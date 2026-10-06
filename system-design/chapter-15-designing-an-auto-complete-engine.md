## 15: Designing an Auto-Complete Engine

### Design at a Glance

Build autocomplete as an in-memory, sharded trie with top-K suggestions precomputed at each prefix node. Keep the serving path short: client -> web tier -> Redis -> trie shard on cache miss. Route misses with consistent hashing, keep shard replicas for failover, and refresh ranking signals every 15 minutes from query logs. This gives sub-10 ms p99 latency with high availability while keeping operational complexity manageable.

### What Problem Are We Solving?

Auto-complete is the feature where a search box shows suggestions as you type. You type `"Dub"` and see `Dubai`, `Dublin`, `Dubrovnik` appear instantly — before you finish the word.

**Why is this hard?** Every single keystroke fires a query. At 1,000 users typing simultaneously, that is thousands of sub-10 ms requests per second. A normal database query takes 20–100 ms. A disk seek takes ~10 ms. Neither can keep up. We need a completely different approach.

**Real-world scale:** Google's autocomplete serves billions of queries per day at under 5 ms median latency. Amazon shows product suggestions as you type in the search box. Airbnb completes destination names. Spotify completes song and artist names. All of these use the same core architecture this chapter walks through.

### Scope and Assumptions

To keep the chapter focused, we explicitly scope what this system does and does not do:

- **In scope:** Exact prefix suggestions, popularity-based ranking, locale-aware results, high availability.
- **Out of scope:** Full-text relevance ranking, typo correction on the hot path, semantic retrieval, and user-level personalization inside the trie.
- **Latency budget:** End-to-end p99 under 10 ms for suggestion API calls.
- **Serving model:** Trie is memory-resident on indexer shards; web tier is stateless.

This scope is intentionally strict because system design interviews reward clear boundaries and explicit trade-offs.

---

### The Core Insight: Why a Trie?

Before jumping into the full system, you need to understand the key data structure: the **trie** (pronounced "try," short for re**trie**val tree).

Imagine you want to store the words: `apple`, `app`, `apply`, `apt`. A normal dictionary would store each as a separate entry. A trie stores them as a tree where each level is one character:

```
root
 └─ a
     └─ p
         ├─ p ← "app" ends here
         │   ├─ l
         │   │   ├─ e ← "apple" ends here
         │   │   └─ y ← "apply" ends here
         └─ t ← "apt" ends here
```

To find all words starting with `"ap"`, you walk to the `p` node under `a`, then collect every word in its subtree. This takes **O(M)** time where M is the length of the prefix — completely independent of how many total strings exist. Whether you have 1,000 strings or 10 billion, finding prefix matches takes the same steps.

**Why not other data structures?**

| Data Structure | Prefix Search | Time Complexity | Memory |
|---|---|---|---|
| Hash Table | No — exact match only | O(1) | Low |
| Inverted Index | No — full-term match only | O(log N) | Medium |
| Binary Search Tree | Partial (in-order traversal needed) | O(M × log N) | Medium |
| SQL `LIKE 'prefix%'` | Yes, with index | O(log N + K) | Low but slow |
| **Trie (Prefix Tree)** ✅ | Yes, natively | **O(M)** | Higher |

The trie's O(M) complexity is the reason every major autocomplete system uses it. No other structure comes close for prefix queries at scale.

---

### The Single-Server Trie

Start simple: one server, all strings loaded into a trie in memory, HTTP endpoint to query it.

```
Client → Web Server → In-Memory Trie → Return top-10 suggestions
```

**Trie node structure (code form):**
```python
class TrieNode:
    def __init__(self):
        self.children = {}       # char → TrieNode
        self.is_end = False      # marks a complete word
        self.top_suggestions = []  # cached: top-10 results for this prefix

class Trie:
    def search(self, prefix):
        node = self.root
        for char in prefix:
            if char not in node.children:
                return []        # no completions exist
            node = node.children[char]
        return node.top_suggestions  # O(M) lookup
```

**The optimization trick:** At each trie node, pre-cache the top-10 most popular completions. This turns every prefix lookup into a direct read — no subtree traversal needed at query time. You pay the cost once at build time, save it on every query.

This one-server design works for a small product: a company's internal search bar, a small e-commerce site. It fails when:
- Data grows beyond one machine's RAM
- Traffic exceeds one server's capacity
- The server restarts and takes minutes to reload the trie

---

### Requirements at Scale

Now design for Google-scale. Nail the requirements first.

#### Functional Requirements

1. **Suggest:** Given a prefix string + locale, return the top-N completions ranked by popularity.
2. **Prefix match only:** No substring, fuzzy, or semantic matching (separate features, separate systems).
3. **Popularity ranking:** Results ordered by a score computed from historical query frequency.
4. **Multi-language support:** Unicode prefixes, locale-specific ranking (French users see French completions first).
5. **Freshness:** Popularity scores updated at least every 15 minutes from query logs.

#### Non-Functional Requirements

| Property | Target | Why This Number |
|---|---|---|
| Query latency (p99) | < 10 ms | Users perceive delays > 100 ms; 10 ms leaves budget for network + rendering |
| Indexed strings | 10 billion | Google-scale search index |
| Peak throughput | 1,000 QPS baseline, 10 K+ with caching | 1,000 active users × avg 1 keystroke/sec |
| Availability | 99.99%+ | < 1 hour downtime/year |
| Staleness | Up to 15 minutes | Trending topics refresh fast enough; perfectly fresh rankings not needed |

#### Capacity Estimation

Work through the math to size the system:

1. **Storage:** 10 billion strings × 100 bytes/string = **1 TB raw**. Trie pointer overhead roughly doubles this → **~2 TB effective memory required**.
2. **Server count:** 2 TB ÷ 256 GB per high-memory node = **~8 nodes** for storage. Add replication factor 2 + spare capacity → **16 nodes** in practice.
3. **Query load:** 1,000 QPS × avg 4 keystrokes per typing session = ~4,000 trie lookups/second. Cache absorbs >90% → indexer nodes only see ~400 QPS.
4. **Bandwidth:** 1,000 QPS × ~1 KB per response = ~1 MB/s egress. Negligible.
5. **Popularity pipeline:** 1,000 QPS query logs × 100 bytes/log = ~100 KB/s. A batch job every 15 minutes processes ~90 MB of logs — easily fits within a single-node Spark job.

**Consistency note:** We treat a "shard" as a **logical primary partition**. With replication factor 2, each logical shard has one primary and one replica.

---

### Data Model

Three tables persist the data; the trie itself lives in memory (not a table).

**SuggestionEntry** — the master list of all possible completions:

| Field | Type | Notes |
|---|---|---|
| `entry_id` | `BIGINT` PK | Auto-incrementing internal ID |
| `text` | `VARCHAR(512)` | The complete suggestion string |
| `locale` | `VARCHAR(16)` | Language/region variant (e.g., `en-US`) |
| `shard_id` | `INT` | Which indexer node owns this prefix |
| `created_at` | `TIMESTAMP` | When this string was first indexed |

**PopularityScore** — computed by the batch pipeline, tells the trie how to rank:

| Field | Type | Notes |
|---|---|---|
| `score_id` | `BIGINT` PK | |
| `entry_id` | `BIGINT` FK → SuggestionEntry | |
| `locale` | `VARCHAR(16)` | Locale-specific ranking |
| `score` | `DOUBLE` | Normalized popularity (0.0 to 1.0) |
| `window_start` | `TIMESTAMP` | Scoring window start |
| `window_end` | `TIMESTAMP` | Scoring window end |
| `computed_at` | `TIMESTAMP` | When the batch job produced this score |

**QueryLog** — raw event stream of what users typed and clicked:

| Field | Type | Notes |
|---|---|---|
| `query_id` | `UUID` PK | |
| `prefix` | `VARCHAR(512)` | What the user typed |
| `locale` | `VARCHAR(16)` | |
| `user_id` | `UUID` | Nullable for anonymous users |
| `suggestions_returned` | `INT` | How many suggestions were shown |
| `clicked_suggestion` | `VARCHAR(512)` | Nullable — which one the user picked |
| `issued_at` | `TIMESTAMP` | |

**Entity relationships:**

```
SuggestionEntry ──────────────< PopularityScore
      │                           (one entry, many
      │                            time-window scores)
      │
      └─────────────────────────< QueryLog
                                     │
                               (batch pipeline reads
                                these every 15 min,
                                writes new PopularityScores)
```

The **trie** is the in-memory serving structure built from SuggestionEntry + PopularityScore at startup. It is rebuilt periodically — it is not a persisted table.

---

### API Design

```http
POST /v1/autocomplete/suggest
Content-Type: application/json
```

**Request:**
```json
{
  "prefix": "dub",
  "user_id": "u_123",
  "locale": "en-US",
  "limit": 10,
  "request_id": "d0f4e3d8-7bc7-4b56-92b7-8a6f0be6be9e"
}
```

**Response:**
```json
{
  "prefix": "dub",
  "suggestions": [
    {"text": "Dubai",     "score": 0.98},
    {"text": "Dublin",    "score": 0.91},
    {"text": "Dubrovnik", "score": 0.74}
  ],
  "latency_ms": 3,
  "cache_hit": true,
  "model_version": "pop-v3.2"
}
```

**Why POST instead of GET?** The prefix could be long, contain Unicode characters, or carry user context (locale, A/B test group). POST bodies handle all of this cleanly. GET with query parameters works for simple cases but breaks with complex Unicode in some HTTP clients.

**Validation and limits:**
- `prefix` length: 1 to 64 Unicode code points after normalization.
- `limit`: 1 to 20 (default 10).
- Unsupported locale falls back to the product default locale.
- Rate-limit by user/IP to protect shards from abusive traffic.

---

### Memory vs. Disk: Why Everything Must Be In RAM

This is the single most important architectural decision in the chapter.

| Strategy | Access Time | P99 Outcome | Verdict |
|---|---|---|---|
| All data on disk | ~10 ms per seek | Consistently violates 10 ms SLA | ❌ |
| Hybrid (20% hot in memory) | Variable — cache misses hit disk | P99 misses SLA on cold queries | ❌ |
| **All data in memory** ✅ | ~100 ns–10 µs | P99 well under 10 ms | ✅ |

The 10 ms SLA leaves no room for disk I/O. A single disk seek takes ~10 ms — consuming the entire latency budget before any network or computation happens. The only option is to keep the entire trie in RAM across a fleet of nodes.

**Analogy:** Think of disk access like going to a library in another city to look up a word. Memory access is like having the dictionary open on your desk. The trie must live on your desk.

---

### High-Level Architecture

```
Client (Web / Mobile / API)
         │
    Load Balancer (routes to nearest region)
         │
  ┌──────┴───────────┐
Web Server 1    Web Server 2   ... (stateless; handles locale re-ranking)
  │  └── Redis Cache (hot prefix → suggestion list, TTL = 15 min)
  │
  │  (cache miss → consistent hash on prefix → target shard)
  │
Indexer Shard 1   Shard 2   ...  Shard 8   (logical shards; trie in RAM)
  ├── Replica A                              (replication factor = 2)
  └── Replica B
         │
    S3 / HDFS  (raw string corpus — source of truth for trie rebuilds)
         │
  Popularity Pipeline  (Spark batch job every 15 min)
         │         └── reads QueryLog stream from Kafka
         └── pushes incremental popularity updates to indexer shards
```

**Request flow, step by step:**

1. User types `"Du"` → browser fires HTTP POST to load balancer.
2. Load balancer routes to nearest web server (round-robin or latency-based).
3. Web server checks Redis cache for key `"en-US:Du"`.
   - **Cache HIT** (>90% of the time): return result immediately — total latency ~2 ms.
   - **Cache MISS**: proceed to step 4.
4. Web server applies consistent hashing on `"Du"` → determines target indexer shard.
5. Indexer shard traverses trie to the `u` node under `D`, reads pre-cached top-10 list.
6. Web server applies locale-specific re-ranking (e.g., boost local city names).
7. Web server writes result back to Redis cache (TTL = 15 minutes); returns to client.

**Total latency on cache miss:** ~3–8 ms (trie lookup ~1 ms + network round trip ~2–5 ms + re-ranking ~1 ms).

### Latency Budget (P99)

Define a budget per stage so the 10 ms target is enforceable:

| Stage | Budget (ms) |
|---|---|
| Client -> LB -> Web | 2.0 |
| Redis lookup (hit path) | 0.8 |
| Web -> Indexer RPC (miss path) | 2.0 |
| Trie traversal + top-K read | 1.0 |
| Re-ranking + serialization | 1.0 |
| Tail slack | 3.2 |
| **Total P99 budget** | **10.0** |

---

### Sharding Strategy

2 TB of trie data cannot fit on one machine. You need to distribute (shard) it. Three approaches:

| Strategy | How It Works | Problem |
|---|---|---|
| Alphabetical | A–D on Shard 1, E–H on Shard 2, etc. | Massively skewed: S, A, R are the most common first letters; X, Q, Z are rare |
| Random hash | Hash the prefix → shard number | Even distribution but full cluster rescan on shard addition/removal |
| **Consistent Hashing** ✅ | Nodes and keys both mapped to a ring; key goes to nearest clockwise node | Even load; only adjacent keys migrate when a node is added or removed |

Consistent hashing is covered in depth in Chapter 13. The key property here: when you add a 9th logical shard, only about $\frac{1}{9} \approx 11\%$ of keys migrate (those that fall between the new node and its predecessor on the ring). You do not need to rebuild the entire trie.

Each shard is replicated to 2 nodes. On shard failure, the replica takes over immediately with no rebuild required.

---

### Popularity Pipeline: Keeping Rankings Fresh

The trie needs to know which suggestions are popular. "Dubai" should rank above "Dubrovnik" because far more people search for Dubai. Here is how that score is computed and kept current.

**Pipeline flow:**

```
User types prefix → QueryLog event → Kafka topic
                                          │
                          Spark batch job (every 15 min)
                                          │
                    reads last 15 min of QueryLog events
                    counts clicks and impressions per suggestion
                    normalizes to 0.0–1.0 score
                                          │
                          writes new PopularityScore rows
                                          │
                    pushes incremental diff to each indexer shard
                    (shard updates scores in-memory, no full rebuild)
```

**Why batch (every 15 min) instead of real-time streaming?**

- At baseline (1,000 QPS), query logs arrive at ~100 KB/s — trivial to buffer for 15 minutes.
- Real-time streaming (Kafka + Flink) adds operational complexity: exactly-once semantics, watermarking, late-arriving events.
- Popularity of "Dubai" changing by 0.1% in real-time has no user-visible impact. A 15-minute lag is invisible.
- **Exception:** Trending events (breaking news, viral content) can cause a term to spike 100× in minutes. For these, a supplemental near-real-time scoring path can be added in Year 2 (see evolution section).

---

### Design Decisions and Trade-Offs

| Decision | Option A | Option B | Choice & Reasoning |
|---|---|---|---|
| **Core data structure** | Trie — O(M) prefix search | Inverted index — full-term match only | **Trie.** Inverted index cannot serve prefix queries without a full-term; trie does it natively in O(M). |
| **Storage tier** | All in memory | Hybrid memory + disk | **All in memory.** Disk P99 (~10 ms per seek) violates the 10 ms SLA before any other work happens. |
| **Popularity updates** | Batch every 15 min | Real-time streaming | **Batch by default.** 15-min lag is imperceptible; streaming doubles operational complexity with no user-visible benefit at launch. |
| **Sharding** | Alphabetical splits | Consistent hashing | **Consistent hashing.** Alphabetical sharding creates hot shards (S, A, R dominate); consistent hashing distributes evenly. |
| **Caching layer** | No cache | Redis at web tier | **Redis cache.** Most prefixes repeat ("the", "new", city names). Cache absorbs >90% of load, reducing indexer QPS by 10×. |
| **Replication factor** | None | Factor 2 | **Factor 2.** Doubles memory cost but provides instant failover. Without it, one node failure takes a shard down until rebuild completes. |

---

### Failure Modes and Mitigations

| Failure | User Impact | Mitigation |
|---|---|---|
| Indexer shard crashes | Suggestions missing for that shard's prefix range | Replica takes over in < 1 second; no rebuild required |
| Replica falls behind primary | Stale suggestions for some prefixes | Monitor replication lag; serve from primary if replica lag > 30 seconds |
| Cache stampede on cold start | All requests miss cache → indexer overload | Pre-warm Redis by replaying recent query logs before marking server live |
| Consistent hashing ring state lost | Queries routed to wrong shard | Persist ring state in ZooKeeper; validate and restore on each startup |
| S3 slow or unavailable | Indexer cannot rebuild trie after full restart | Keep a secondary snapshot store in a separate region; local disk snapshot as last resort |
| Popularity pipeline delayed | Rankings based on data > 15 min old | Alert if pipeline lag > 30 minutes; stale rankings do not affect availability, only relevance |
| Hot prefix causes one shard overload | One shard gets 100× normal traffic for a viral term | Cache layer absorbs this; if cache is cold, rate-limit per-prefix at the web server tier |
| Bad ranking deploy | Relevance drops quickly | Canary rollout (1-5%), CTR guardrails, and one-click rollback |
| Redis or shard transient outage | Timeout spikes | Serve stale cache or global defaults before failing empty |

---

### Cost Model

| Component | Spec | Monthly Cost (AWS) |
|---|---|---|
| 16 × Indexer Nodes | r6i.8xlarge (256 GB RAM each) | ~$23,200 |
| 2 × Web Servers | c5.xlarge | ~$300 |
| Redis cache cluster | cache.r6g.large (3 nodes) | ~$720 |
| S3 storage (1 TB) | Standard storage + requests | ~$50 |
| Load Balancer (ALB) | — | ~$50 |
| Monitoring (CloudWatch + alerts) | — | ~$100 |
| **Total at 1 K QPS** | | **~$24,420/month** |

**Scaling to 10 K QPS:** Add more web servers (~$300) and cache nodes (~$700). Indexer nodes do NOT need to grow — they scale with data volume, not query volume. Total at 10 K QPS: ~$25,400/month.

**Key insight:** Memory dominates cost. The cache layer still materially reduces indexer CPU pressure and tail latency, but the primary bill driver is the RAM footprint of the trie fleet.

---

### Operations Playbook

**Day-to-day monitoring:**
- Indexer query latency P50/P99 per shard — alert if P99 > 8 ms.
- Redis cache hit rate — alert if hit rate drops below 85% (could indicate cache eviction or a new data access pattern).
- Popularity pipeline lag — alert if lag > 30 minutes.
- Shard availability — alert if any shard and its replica are both down simultaneously.

**Adding a new indexer node (shard rebalancing):**
1. Add new node to the consistent hash ring.
2. New node receives its key range from the neighbor shard (data migration).
3. Verify completeness: run a sample query against new node and compare against old shard.
4. Mark new node live; update ZooKeeper ring state.
5. Decommission excess capacity from neighbor shard.

**Index rebuild drill (quarterly):**
Simulate a full node restart from S3. Time-to-serve-first-query should be < 5 minutes. This validates the S3 snapshot is current and the rebuild pipeline works before you need it in production.

**A/B testing ranking changes:**
The re-ranking logic lives in the web server layer — completely separate from the trie. To test a new ranking algorithm: route 5% of traffic to web servers running the new algorithm; compare click-through rates. No trie modification needed.

### Correctness Guardrails

- Normalize text before both cache key creation and trie lookup to avoid duplicate representations.
- Keep work bounded: fixed top-K, fixed timeout budget, and maximum response size.
- Propagate `request_id` through logs and tracing for fast incident debugging.
- Define fallback order clearly: fresh cache -> shard result -> stale cache -> global defaults.

---

### System Evolution: Year 1 to Year 3

| Year | What Changes | Why |
|---|---|---|
| **Year 1** | 8 logical shards (16 indexer nodes with RF=2), batch popularity updates, English-only. Cache hit rate ~90%. Serves 1 K QPS. | Launch with simplest thing that meets SLA. Operational debt is low. |
| **Year 2** | Multi-language trie (Unicode normalization). Near-real-time popularity updates via Kafka + Flink for trending terms. Personalized re-ranking by user location and past searches. Serves 10 K QPS. | User feedback shows international users get worse results. Trending events matter more. |
| **Year 3** | ML-based semantic suggestions using embeddings (FAISS / Milvus). Typing "cheap flights" suggests "Budget Airlines" even though "Budget" does not start with "che". Trie retained for exact prefix; vector search handles intent. Serves 100 K+ QPS. | Pure prefix matching misses ~30% of user intent at this scale. Semantic layer dramatically improves relevance. |

---

### Advanced Topics

#### Compressed Tries (PATRICIA Trie / Radix Tree)

A standard trie wastes nodes on long common prefixes. The string `"autocomplete"` creates 12 nodes. A **compressed trie** collapses paths with single children into a single edge:

```
Standard trie:  root → a → u → t → o → c → ...  (12 nodes)
Compressed:     root → "auto" → "complete"       (2 nodes for the common path)
```

Compressed tries use ~40% less memory for typical English dictionaries. Widely used in production implementations (e.g., Redis's PATRICIA trie for sorted sets).

#### Locality-Aware Caching

Hot prefixes (short strings like "a", "th", "ne") generate disproportionate traffic. Rather than caching all prefixes equally, weight the cache eviction policy (LFU — Least Frequently Used) over LRU (Least Recently Used). A query for "a" repeats millions of times per day; it should never be evicted.

#### Fuzzy Matching and Typo Tolerance

Exact prefix matching fails when users make typos: typing `"Dibai"` gets no results. Production systems add a Damerau-Levenshtein distance layer that accepts strings within edit-distance 1 or 2. This runs as a separate service — it is too expensive (O(M × N)) to run on the trie's hot path.

#### Personalization Without Trie Modification

User A in France should see Paris before Philadelphia. User B who frequently searches for music should see "Taylor Swift" before "Taylor University". This personalization happens entirely in the web server re-ranking layer — the trie stays global and shared. Only the final ranking before returning to the client is personalized. This keeps the trie simple and shared across all users.

---

### Interview Trade-Off Questions and Answers

**1. When is a trie enough for autocomplete, and when do typo tolerance, semantics, or personalization require a different retrieval layer?**

A trie handles exact prefix matching perfectly. It is sufficient when: users type correctly, suggestions are purely string-based, and ranking by popularity is acceptable. You need a different layer when:
- **Typo tolerance:** Users make mistakes. Edit-distance computation (BK-tree or Damerau-Levenshtein) must run separately — it's O(M × N) and cannot run on the trie's hot path without blowing the latency budget.
- **Semantic matching:** "cheap flights" should suggest "Budget Airlines" even though no string starts with "cheap". This requires embedding-based vector search (FAISS, Milvus), not prefix matching.
- **Personalization:** The trie is a global, shared index. Personalization (boost my city, my past searches, my language) is applied as a re-ranking step in the stateless web server layer — never modifies the trie itself.

**2. How fresh should popularity updates be before near-real-time ranking stops paying off?**

For most search terms, batch updates every 15 minutes are sufficient — the popularity of "Dubai" versus "Dublin" doesn't shift meaningfully in 15 minutes. The cost of near-real-time (Kafka + Flink, exactly-once semantics, watermarking, backpressure handling) is significant.

Near-real-time pays off only for **trending terms**: a breaking news event can spike a term 100× in 5 minutes. The practical answer is a hybrid: batch for stable terms (covers 99% of the index), near-real-time scoring for a small "trending terms" layer that overrides or supplements the trie for detected spikes. Detect trending terms by monitoring the QueryLog stream for terms whose frequency increases >5× over a 5-minute rolling window.

**3. If memory is too expensive, what do you trade first — recall, latency, or more aggressive caching?**

In order of preference:
1. **More aggressive caching first** — if cache hit rate is already >90%, there is limited room. But reducing TTL allows smaller cache to serve same load with slightly more misses.
2. **Reduce recall** — serve top-5 suggestions instead of top-10. Halves the trie node annotation storage with minimal user-visible impact. Most users click the first 1–3 results anyway.
3. **Increase staleness** — update popularity scores every hour instead of every 15 minutes. No memory impact but reduces freshness.
4. **Trade latency last** — the 10 ms SLA exists because users perceive delays above 100 ms. Violating P99 latency has direct UX impact; avoid trading this unless all other options are exhausted.

---

### What Interviewers Usually Probe Next

1. **Multilingual correctness:** How are normalization, case folding, and locale ranking handled?
2. **Personalization boundary:** Why does personalization happen in re-ranking rather than inside the trie?
3. **Failure behavior:** What does the API return during partial outages?
4. **Measurement:** Which SLOs and business guardrails prove the system is healthy?

---

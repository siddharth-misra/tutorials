## 20: Search Engine Design

### The Core Problem: Finding Needles in Billions of Haystacks in 200 ms

Design a search engine that crawls documents from the web or an internal corpus, builds an inverted index, ranks results by relevance, and serves queries with low latency.

This chapter extends the inverted-index and trie ideas from Chapter 15, scaling them to billions of documents and 100,000 queries/second.

Two fundamentally different systems must be designed together:
1. **Offline pipeline** — continuously crawl, parse, and index documents; can afford minutes to hours of latency per document
2. **Online serving** — answer a query in < 200 ms by pre-computing as much as possible in the offline stage

The reason search feels instant despite indexing the entire web: all the hard work is done before the user ever types a word.

---

### The Library Analogy

Imagine a 10-million-book library. You want every book that mentions "distributed consensus." You could read every book — that's a **full scan**, taking years. Or the library could maintain a **master index**: "distributed → [Book 42, Book 97]", "consensus → [Book 42, Book 201]". Finding all books becomes a two-second lookup.

A search engine is this master index, built for billions of web pages:

1. **Crawl:** A robot visits pages (like a reader visiting every book)
2. **Parse:** Extract words and links (like reading each page)
3. **Index:** Build `word → [page_A, page_B, ...]` (like building the master index)
4. **Rank:** Sort matching pages by relevance (which books are most authoritative on this topic?)
5. **Serve:** Return the top 10 results in < 200 ms

**Inverted index example:**
```
Document 42: "Redis consistency tradeoffs explained"
Document 97: "Consistency models in distributed systems"

Inverted index:
  "redis"       → [(doc42, freq=1, positions=[0])]
  "consistency" → [(doc42, freq=1, positions=[1]), (doc97, freq=1, positions=[0])]
  "distributed" → [(doc97, freq=1, positions=[3])]
  "systems"     → [(doc97, freq=1, positions=[4])]

Query "redis consistency":
  Postings("redis") = [doc42]
  Postings("consistency") = [doc42, doc97]
  Intersection = [doc42]
  BM25 score(doc42) > BM25 score(doc97) → doc42 ranked #1
```

The inverted index converts "scan every document" → "jump directly to candidates." The ranker then spends CPU only where it matters.

---

### Real-World Examples

| System | Scale | Key Differentiator |
|---|---|---|
| **Google Search** | ~8.5 B queries/day, ~130 trillion indexed pages | Knowledge graph, semantic understanding, personalization |
| **Bing** | ~1 B queries/day | Integration with ChatGPT for generative answers |
| **Elasticsearch** | Billions of documents, deployed by thousands of companies | Real-time full-text + structured query, REST API |
| **Apache Solr** | Enterprise-scale | Rich analytics, faceted search, multi-language |
| **Algolia** | Millisecond SaaS search | Pre-built relevance tuning, geosearch, UI widgets |
| **Meilisearch** | Developer-friendly | Typo tolerance out of the box, simple HTTP API |

---

### Functional Requirements

1. **Crawl documents:** Discover and fetch documents from configured seeds, sitemaps, or RSS feeds.
2. **Parse and normalize:** Extract text, metadata, links, canonical URLs, and language.
3. **Build inverted index:** Map normalized terms to postings lists of matching documents.
4. **Spell correction:** Suggest "did you mean X?" for mistyped queries.
5. **Query understanding:** Tokenize, expand synonyms, and apply NLP preprocessing before index lookup.
6. **Serve search queries:** Return ranked results within a low-latency budget.
7. **Snippets and highlights:** Show KWIC context snippets around matches.
8. **Semantic search:** Support vector-based retrieval alongside keyword retrieval.
9. **Personalization:** Rank results higher for content matching user history, language, and location.
10. **Incremental indexing:** Reflect content changes without rebuilding the full corpus.
11. **Deduplication and canonicalization:** Avoid indexing the same content under many URLs.
12. **Abuse and quality filtering:** Suppress low-quality, manipulated, or harmful content.

---

### Non-Functional Requirements

| Property | Target |
|---|---|
| Query latency (p99) | < 200 ms |
| Query availability | 99.99% |
| Crawl freshness | Hot domains refreshed within minutes to hours |
| Durability | Indexed data and crawl logs survive machine failures |
| Relevance quality | Ranking changes must be measured and reviewable |
| Scale | 1 B documents, 100 K queries/second, tens of TB of index data |

---

### Capacity Estimation

1. **Corpus size:** 1 B documents × 10 KB average = ~10 TB raw content.
2. **Index size:** Inverted index + stored fields + forward index + ranking features often 2–5× raw content = **20–50 TB**.
3. **Crawl rate:** Refreshing 1 B documents in 30 days = ~385 fetches/second average; burst headroom needed for hot news domains.
4. **Query fan-out:** 100 K queries/sec × 10 shards per query = ~1 M shard requests/second at the broker tier.
5. **Cache effect:** 20% cache hit rate on popular repeated queries avoids ~200 K shard requests/second of ranking work.
6. **Embedding storage (vector search):** 1 B documents × 1,024-dimension float32 vector = ~4 TB just for embeddings.

---

### Entity Design

**Document**

| Field | Type | Notes |
|---|---|---|
| `doc_id` | `BIGINT` PK | Internal immutable ID |
| `url` | `TEXT` | Canonical URL |
| `title` | `TEXT` | |
| `content_hash` | `CHAR(64)` | Dedup support |
| `language` | `VARCHAR(16)` | |
| `fetched_at` | `TIMESTAMP` | |
| `last_modified_at` | `TIMESTAMP` | Nullable from source |
| `quality_score` | `FLOAT` | Spam/quality signal |
| `embedding_vector` | `FLOAT[]` | 1024-dim for vector search; stored separately in vector DB |

**Posting** (in inverted index)

| Field | Type | Notes |
|---|---|---|
| `term` | `VARCHAR(128)` | Normalized token |
| `doc_id` | `BIGINT` FK → Document | |
| `term_frequency` | `INT` | |
| `positions` | `INT[]` | Optional for phrase search |

**LinkEdge**

| Field | Type | Notes |
|---|---|---|
| `source_doc_id` | `BIGINT` FK → Document | |
| `target_doc_id` | `BIGINT` FK → Document | |
| `anchor_text` | `TEXT` | Ranking signal input |

**QueryLog**

| Field | Type | Notes |
|---|---|---|
| `query_id` | `UUID` PK | |
| `query_text` | `TEXT` | Raw user input |
| `normalized_query` | `TEXT` | After NLP preprocessing |
| `issued_at` | `TIMESTAMP` | |
| `result_doc_ids` | `BIGINT[]` | |
| `clicked_doc_id` | `BIGINT` | Nullable |
| `session_id` | `UUID` | For personalization |

---

### ER Diagram

```
Document ─────────────< Posting
    │
    ├─────────────────< LinkEdge >──────── Document
    │
    └─────────────────< QueryLog
                           │
                    (click feedback → re-ranking)
```

---

### API Design

```http
GET /v1/search?q=redis+consistency&limit=10&lang=en&user_id=usr_123
```

Response:
```json
{
  "query": "redis consistency",
  "normalized_query": "redis consist",
  "spell_correction": null,
  "results": [
    {
      "doc_id": 42,
      "title": "Redis Consistency Trade-Offs",
      "url": "https://example.com/redis-consistency",
      "snippet": "...trade-offs between <b>availability</b> and <b>consistency</b> in Redis...",
      "score": 12.73,
      "doc_type": "article"
    }
  ],
  "took_ms": 37
}
```

```http
GET /v1/search?q=rdis+consitency
→ spell_correction: "Did you mean: redis consistency?"
```

---

### Pipeline Overview

```
Offline:
  Crawler Frontier → Fetcher Workers → Parser/Canonicalizer/Deduper
      → Document Store → Indexer (inverted index segments)
      → Embedding Worker (vector index) → Shard Builder / Merger

Online:
  Query → Query Understanding → Spell Correction → Index Lookup (BM25)
      → Vector Retrieval (HNSW) → Candidate Merge → Ranker → Snippet Generator
      → Personalization Rerank → Top-10 Response
```

---

### Stage 1: Crawling

The **Crawler Frontier** is a priority queue of URLs to fetch. Priority is determined by:
- **Freshness demand:** news sites need re-crawling every few minutes; static pages every few months
- **Page importance:** high-PageRank pages get more frequent re-crawls
- **Change rate:** observed through `ETag` / `Last-Modified` headers; if a page never changes, deprioritize

**Crawl budget allocation:**
- ~80% of budget: known high-value domains, weighted by historical change rate and traffic importance
- ~20%: discovering new URLs via outlinks from already-indexed pages and sitemap submission

**Crawler politeness:** Respect `robots.txt`, identify the crawler with a stable user-agent, and rate-limit per domain (1 request/second default; honor `Crawl-delay` when published). Treat repeated 429/503 responses as backpressure signals and slow down rather than trying to evade blocking.

---

### Stage 2: Parsing and Canonicalization

After fetching raw HTML:

1. **HTML parse** — extract title, meta description, body text, headings, `<a href>` links.
2. **Language detection** — identify language to route to the correct language-specific tokenizer.
3. **Canonicalization** — resolve `<link rel="canonical">`, strip tracking parameters (`?utm_*`), normalize to HTTPS, resolve redirects. A canonical URL is the "one true address" of the content.
4. **Content-hash dedup** — compute SHA-256 of normalized text. If hash exists in the `Document` table, skip indexing (exact duplicate).
5. **Near-dedup (SimHash/MinHash)** — detect pages that are ~90% similar (scraped duplicates, printer-friendly versions). Use SimHash: compute bit-fingerprint of document; documents with Hamming distance < 3 are near-duplicates.

---

### Stage 3: Query Understanding

Raw user input is messy. Query understanding converts it into a structured lookup before the inverted index is touched.

**Pipeline steps (applied in order):**

```
Raw query: "What are good Redis Consistency strategies?"
  1. Lowercase:           "what are good redis consistency strategies"
  2. Tokenize:            ["what", "are", "good", "redis", "consistency", "strategies"]
  3. Stop word removal:   ["good", "redis", "consistency", "strategies"]
  4. Stemming/Lemmatize:  ["good", "redis", "consist", "strategi"]
  5. Synonym expansion:   "redis" → ["redis", "redis db", "redis cluster"]
                          "consist" → ["consist", "consistenc"]
  6. Query type detect:   informational (not navigational or transactional)
  7. Final tokens:        ["good", "redis", "consist", "strategi"]
```

**Stemming vs Lemmatization:**
- **Stemming (fast):** Remove suffixes with rules — "running" → "run", "strategies" → "strategi". May produce non-words.
- **Lemmatization (slower, NLP):** Map to dictionary form — "strategies" → "strategy", "was" → "be". More accurate, requires POS tagging.

At web scale, use stemming for the inverted index (fast at index time and query time). Use lemmatization only when precision matters (legal search, medical search).

**Synonym expansion:** Expand query terms with known synonyms from a curated list or learned word embeddings — "car" → also query "automobile", "vehicle". Increases recall at cost of precision; control with expansion weight dampening.

**Query type classification:**
- **Navigational** ("facebook login"): user wants one specific page → boost URL/title exact match
- **Informational** ("how does Redis work"): user wants explanation → favor comprehensive, high-authority documents
- **Transactional** ("buy Redis Enterprise license"): user wants to complete an action → favor product pages, e-commerce signals

---

### Stage 4: Spell Correction ("Did You Mean?")

**Problem:** Users type "rdis consistncy" instead of "redis consistency". The naive inverted index returns zero results because no document contains "rdis".

**Algorithm: Edit distance + Corpus frequency**

```
1. For each potentially misspelled token T:
   a. Generate all strings within edit distance 2 of T (insertions, deletions, substitutions, transpositions)
   b. Filter to only those strings that exist in the query corpus vocabulary (known words)
   c. Rank candidates by: P(correction) × P(T was mistyped as correction)
      - P(correction) = how often the word appears in the query log (language model prior)
      - P(T | correction) = keyboard proximity, phonetic similarity (noisy channel model)
   d. Pick the candidate with highest combined probability

2. If top correction has significantly higher corpus frequency than original:
   → Show "Did you mean: [correction]?"
  → Auto-apply only for high-confidence cases; otherwise run the original query and show the correction as a suggestion
```

**Practical implementation:** Use a trie or BK-tree over the vocabulary for fast edit-distance search. Do not run spell correction on every token — only tokens not found in vocabulary. Use the query log (not just documents) as the language model source — "rdis" is corrected to "redis" because millions of users search "redis" but almost none search "rdis".

**Serving policy:** Auto-apply only very high-confidence corrections. For everything else, run the original query, surface the correction as a suggestion, and optionally run the corrected query on a shadow path for comparison.

**Example:**
```
"rdis consistncy" →
  "rdis":      candidates = {"redis" (ed=1), "rdis" (not in vocab)} → correct to "redis"
  "consistncy": candidates = {"consistency" (ed=2)} → correct to "consistency"
Result: "Did you mean: redis consistency?"
```

---

### Stage 5: The Inverted Index and BM25 Scoring

#### Inverted Index Structure

The inverted index maps each normalized term to its **postings list**: the ordered list of documents containing that term, along with frequency and position information.

```
term         │ postings (doc_id, term_freq, positions)
─────────────┼──────────────────────────────────────────────────
"redis"      │ [(42, 3, [0,12,87]), (107, 1, [5]), (923, 2, [2,34])]
"consist"    │ [(42, 1, [1]), (97, 4, [0,1,8,22]), (201, 2, [9,14])]
"cluster"    │ [(107, 5, [0,1,2,3,4]), (201, 1, [11])]
```

A lookup of `"redis consistency"` first normalizes the query to tokens such as `"redis"` and `"consist"`, then fetches the postings lists and intersects (for AND) or unions (for OR) them before scoring each candidate document.

#### BM25 Scoring (The Industry Standard)

BM25 (Best Match 25) is the most widely used ranking function in full-text search. It scores a document `d` for query `q` as:

$$\text{BM25}(d, q) = \sum_{t \in q} \text{IDF}(t) \cdot \frac{f(t, d) \cdot (k_1 + 1)}{f(t, d) + k_1 \cdot \left(1 - b + b \cdot \frac{|d|}{\text{avgDL}}\right)}$$

Where:
- $f(t, d)$ = frequency of term $t$ in document $d$
- $|d|$ = document length (number of tokens)
- $\text{avgDL}$ = average document length across corpus
- $k_1$ = term frequency saturation parameter (typically 1.2–2.0)
- $b$ = length normalization parameter (typically 0.75)
- $\text{IDF}(t) = \ln\!\left(\frac{N - n_t + 0.5}{n_t + 0.5} + 1\right)$, where $N$ = total documents, $n_t$ = documents containing term $t$

**Plain-English interpretation:**
- **IDF** — rare terms score higher. "Redis" in a corpus of web documents is fairly rare → high IDF. "The" appears in every document → IDF near zero.
- **Term frequency saturation** — going from 1 to 2 occurrences matters a lot; going from 50 to 51 matters very little. The $k_1$ parameter controls this saturation.
- **Length normalization** — a term appearing 3 times in a 20-word document is more significant than in a 2,000-word document. The $b$ parameter controls how much to penalize long documents.

**Worked Example:**
```
Query: "redis consistency"
Documents:
  doc_A: "Redis consistency: trade-offs explained" (length=4)
  doc_B: "A very long article about distributed systems and their consistency properties, including Redis, and many other databases." (length=20)

Both contain "redis" once and "consistency" once.
avgDL = 12 (some average), k1 = 1.2, b = 0.75

IDF("redis") ≈ 4.5 (rare term)
IDF("consistency") ≈ 2.1 (moderately rare)

BM25 for "redis" in doc_A:
  f=1, |d|=4, norm = 1 - 0.75 + 0.75*(4/12) = 0.5
  TF part = 1 * (1.2+1) / (1 + 1.2*0.5) = 2.2/1.6 = 1.375
  Contribution = 4.5 * 1.375 = 6.19

BM25 for "redis" in doc_B:
  f=1, |d|=20, norm = 1 - 0.75 + 0.75*(20/12) = 1.5
  TF part = 1 * 2.2 / (1 + 1.2*1.5) = 2.2/2.8 = 0.786
  Contribution = 4.5 * 0.786 = 3.54

→ doc_A scores higher because the term appears in a shorter, more focused document.
```

---

### Stage 6: Vector / Semantic Search

Keyword search fails when the user's intent does not match the document's exact wording:
- User queries: "what causes memory leaks in JVM"
- Document says: "garbage collection pressure from retained object references"
→ No keyword overlap, but semantically very relevant.

**Solution: Embedding-based retrieval**

1. **Offline:** For each document, compute a dense vector embedding using a transformer model (e.g., BERT, sentence-transformers). Store vectors in a vector index.
2. **Online:** Embed the query using the same model. Find the K nearest documents by cosine similarity.

**HNSW Index (Hierarchical Navigable Small World):** The standard algorithm for approximate nearest-neighbor (ANN) search in high-dimensional spaces. Builds a hierarchical graph of vectors; queries traverse the graph in O(log N) rather than O(N).

**Hybrid Retrieval (BM25 + Vector):**

```
1. BM25 retrieval → top-100 keyword candidates
2. Vector retrieval (HNSW) → top-100 semantic candidates
3. Merge: union of both candidate sets (up to 200 candidates)
4. Reciprocal Rank Fusion (RRF) or learned re-ranker assigns final scores
5. Return top-10
```

**When to use each:**

| Retrieval | Best for | Weakness |
|---|---|---|
| BM25 / keyword | Exact product names, technical terms, serial numbers | Misses synonyms, paraphrases |
| Vector / semantic | Conversational queries, NL questions, cross-lingual | Misses exact terms; requires GPU for embedding; 4 TB+ vector storage at 1 B docs |
| Hybrid | General-purpose web search, enterprise search | Higher complexity and latency budget |

---

### Stage 7: Snippet Generation (KWIC — Keywords In Context)

Users need to see a preview of *why* a document matched their query before clicking. The snippet should show the matched terms in surrounding context.

**Algorithm (Keywords In Context — KWIC):**

```
1. Load document text (or stored summary field).
2. Find all positions of query terms in the document.
3. Group positions into "windows" — consecutive or nearby positions within 30 tokens.
4. Score each window by: number of distinct query terms covered + term proximity.
5. Select the top-scoring window as the snippet.
6. Bold/highlight matched terms.
7. Truncate to ~160 characters with context on each side.
```

**Example:**
```
Query: "redis consistency"
Document text: "...In production, Redis offers several consistency models. The most common
  is eventual consistency. For strong consistency, you can configure..."

Positions:
  "redis"       → [5]
  "consistency" → [8, 12]

Best window: [5..12] → "Redis offers several consistency models. The most common is eventual consistency."
Highlighted: "<b>Redis</b> offers several <b>consistency</b> models...eventual <b>consistency</b>"
```

---

### Serving-Path Latency Budget

The easiest way to lose the interview is to say "200 ms" without showing where it goes. A realistic budget forces the architecture to stay honest:

| Stage | Typical Budget |
|---|---|
| API gateway + auth + parsing | 5-10 ms |
| Query understanding + spell correction | 10-20 ms |
| Broker fan-out to keyword shards | 20-50 ms |
| Vector retrieval (if enabled) | 20-40 ms |
| Candidate merge + ranking | 15-30 ms |
| Snippet generation + response serialization | 10-20 ms |
| Network tail / retries / safety margin | 20-40 ms |

This is why most ranking features must be precomputed offline. If query-time ranking requires loading large feature sets or running heavyweight models synchronously, the p99 budget collapses immediately.

Common latency controls:
- Keep hot postings lists and top ranking features in RAM.
- Use broker timeouts and partial-result thresholds rather than waiting for the slowest shard forever.
- Cache repeated head queries and shard-local postings for hot terms.
- Bound expensive work, for example limit ANN candidate count or snippet windows per result.

---

### Stage 8: Ranking Signals

Full ranking combines offline and online signals:

**Offline signals (precomputed per document):**

| Signal | What it measures | How computed |
|---|---|---|
| **PageRank / Authority** | How many quality sites link to this page | Iterative link-graph propagation |
| **Quality score** | Content quality, grammar, structure | ML classifier on document features |
| **Spam score** | Link manipulation, thin content | Abuse classifier, link pattern analysis |
| **Freshness** | How recently indexed | Timestamp-based decay function |
| **Anchor text** | How inbound links describe this page | Aggregate `LinkEdge.anchor_text` |
| **Document embedding** | Semantic content vector | Transformer model (BERT, etc.) |

**Online signals (query-dependent):**

| Signal | Algorithm |
|---|---|
| **BM25** | Term frequency + IDF + length normalization (see above) |
| **Query-document proximity** | Terms appearing close together → phrase boost |
| **CTR** | Fraction of users clicking this result for similar queries |
| **User personalization** | Boost documents matching user's language/location/history |

**Final ranking pipeline:**

```
1. Candidate retrieval: BM25 intersection → top-1000 candidates
2. Vector retrieval (HNSW): semantic ANN → top-100 candidates
3. Merge and deduplicate candidates
4. Feature assembly: attach offline signals (PageRank, quality, spam)
5. Score: BM25 + personalization + freshness decay
6. Re-rank: learned-to-rank model or weighted combination
7. Top-K extraction: min-heap → top 10
8. Snippet generation: KWIC
9. Return results
```

---

### Stage 9: Personalization

Same query from two different users should return differently ranked results when user context differs.

**Personalization signals:**
- **Language:** Boost documents in the user's preferred language (from `Accept-Language` header and user history).
- **Location:** For queries with local intent ("pizza near me", "redis meetup"), boost geographically relevant results.
- **Search history:** If the user has searched "Redis performance" before, boost advanced-level Redis content over beginner tutorials.
- **Click history:** If the user previously clicked a specific author or domain, apply a small authority boost for that source.

**Privacy:** Personalization must not leak one user's history to another. Store personalization signals as user-level aggregate feature vectors (not raw query logs); use differential privacy noise if sharing aggregate signals across users.

---

### Batch Indexing vs Near-Real-Time Indexing

| | Batch Indexing | Near-Real-Time Indexing |
|---|---|---|
| **How it works** | Reindex entire corpus on a schedule (daily/weekly) | Stream new documents into index continuously; publish new segments immediately |
| **Freshness** | Hours to days | Seconds to minutes |
| **Implementation** | MapReduce/Spark job on document store | Flink/Kafka streams → segment writer → atomic shard swap |
| **Cost** | Expensive cluster burst every N hours | Smaller but continuous compute |
| **Failure recovery** | Re-run batch job from durable store | Replay Kafka offset; segment writes are idempotent |
| **Use case** | Historical archives, monthly analytics reports | News, social media, product inventory |

**Practical hybrid:** Batch rebuild index weekly for quality (full corpus consistency, re-run ranking features). Near-real-time delta index for freshness (new documents searchable within minutes). Query serving merges results from both.

**LSM-inspired segment structure:**
1. New documents → small in-memory segment (indexed immediately, searchable)
2. Background merger: compact small segments → large sorted segments
3. Atomic shard swap: publish new segment file, update pointer; queries see either old or new, never partial

---

### Sharding and Broker Fan-Out

At 1 B documents, one index node is not realistic. The corpus is partitioned into many shards, and the broker fans out each query to the relevant shard replicas.

**Typical strategy:**
- **Document sharding:** assign each document to a shard using hash(doc_id) or range partitioning.
- **Replication:** keep 2-3 replicas per shard so reads can survive node failures and maintenance.
- **Scatter-gather:** the broker sends the query to one healthy replica of each shard, each shard returns local top-K, and the broker merges them into global top-K.
- **Adaptive routing:** for very selective filters such as language or tenant, only hit the shards that own the relevant partition.

**Why local top-K works:** each shard does not need to return every matching document. If the final answer is top-10, each shard can return its local top-100 or top-1000, and the broker merges those bounded heaps into a final top-10. That keeps network payloads and broker memory predictable.

**Failure handling:** if one replica is slow, the broker can hedge to another replica or degrade gracefully using partial results plus a warning metric. Search systems usually prefer slightly worse recall over a hard timeout for the whole query.

---

### High-Level Architecture

```
Seeds / Sitemaps / Sitemap APIs
        │
Crawler Frontier  (priority queue: domain, change-rate, PageRank)
        │
Fetcher Workers   (distributed, robots.txt compliant, rate-limited per domain)
        │
Parser / Canonicalizer / Deduper
        │
        ├──────────────────────────────────┐
        ▼                                  ▼
Document + LinkEdge Store           Embedding Worker
        │                                  │
        ▼                                  ▼
Indexer (inverted index segments)    Vector Index (HNSW, Faiss, Weaviate)
        │                                  │
Shard Builder / Segment Merger       Vector Shard Store
        │                                  │
        └────────────────┬─────────────────┘
                         ▼
              Query Broker (receives user query)
                         │
            ┌────────────┴─────────────┐
            ▼                          ▼
   BM25 Index Shards          Vector Index Shards
   (keyword retrieval)        (semantic retrieval)
            │                          │
            └────────────┬─────────────┘
                         ▼
                  Candidate Merger
                         │
                  Ranker + Personalization
                         │
                  Snippet Generator (KWIC)
                         │
                  Result Cache (Redis, short TTL)
                         │
                  Query API Response
```

---

### Architecture Decisions

| Axis | Decision | Reasoning |
|---|---|---|
| **Scalability** | Horizontal scaling independently for crawlers, indexers, query nodes | Each stage has different resource profiles (I/O vs CPU vs memory) |
| **Latency vs throughput** | Query serving optimized for latency; crawl/index pipeline for throughput | Two fundamentally different problems |
| **Availability vs consistency** | Serve slightly stale results over returning errors | A 10-minute-stale index beats errors at 100 K QPS |
| **Indexing freshness** | Hybrid batch + near-real-time delta | Batch for quality; near-real-time for freshness |
| **Retrieval** | Hybrid BM25 + vector | BM25 for precision; vector for semantic recall |
| **Deduplication** | Canonical URL + SimHash near-dup detection | Dedup before indexing saves storage and improves ranking quality |

---

### Trade-Offs

| Decision | Option A | Option B | Chosen & Why |
|---|---|---|---|
| **Retrieval** | Keyword-only (BM25) | Keyword + vector (hybrid) | **Hybrid** for best recall+precision; keyword-only for cost-constrained early stage |
| **Spell correction** | None (exact match only) | Edit distance + language model | **Edit distance + LM** because user experience degrades severely without it |
| **Freshness model** | Full reindex periodically | Hybrid batch + near-real-time | **Hybrid** so both quality and freshness are maintained |
| **Personalization** | None (same results for all users) | User history + location signals | **Personalized** when user data is available; respect privacy regulations |
| **Sharding** | Single shard | Many shards with brokered fan-out | **Many shards** — corpus too large for one node |
| **Serving architecture** | Sync in-process ranking | Pre-computed offline scores + lightweight online BM25 | **Pre-compute offline** for predictable latency |

---

### Failure Modes & Mitigations

| Failure | Impact | Mitigation |
|---|---|---|
| Crawl frontier starvation | Important sites stop refreshing | Prioritize by freshness and change rate; monitor frontier depth |
| Duplicate URLs inflate index | Waste storage, dilute ranking | Canonicalization + content-hash dedupe + SimHash |
| Segment publish bug | Queries see partial index | Immutable segment snapshots + atomic swap pointer |
| Index lag | Fresh content missing from results | Near-real-time incremental indexing with freshness SLOs |
| Hot query storms | Popular queries overload serving tier | Result cache (Redis) + shard cache + admission control |
| Ranking spam / SEO manipulation | Low-quality results rise | Quality classifiers, PageRank trust, human review pipeline |
| Vector index unavailable | Semantic retrieval degrades to keyword-only | Fallback to BM25-only; alert but do not return errors |
| Spell correction wrong | "Do you mean X?" misleads user | Show correction as suggestion only (not auto-apply) for low-confidence corrections |

---

### Design Rationale

Search separates offline indexing from online query serving because each has incompatible performance requirements. Crawling, parsing, link-graph analysis, embedding generation, and segment merging are throughput-bound batch workloads that can afford latency. Query serving is a latency-bound interactive workload that cannot afford heavy computation. Mixing them degrades both.

The inverted index is the foundational reason keyword search scales: it converts O(N) document scans into O(log N + result set size) postings list lookups. Hybrid retrieval adds semantic recall via vector search. BM25 provides robust relevance scoring with well-understood parameters. KWIC snippet generation makes results actionable without users needing to click through to understand relevance.

---

### How Much Will It Cost?

**Infrastructure estimate (1 B documents, 100 K queries/second):**

| Component | Spec | Monthly Cost (AWS) |
|---|---|---|
| Crawler workers (20 × c5.2xlarge) | ~385 fetches/sec avg; burst for news domains | ~$6,000 |
| Fetcher + Parser pool (10 × c5.xlarge) | Content extraction, canonicalization, dedup | ~$1,500 |
| Document store (S3, 10 TB raw + 40 TB index) | Standard storage + requests | ~$2,300 |
| Indexer workers (10 × r5.2xlarge) | Segment building, compaction, shard publishing | ~$3,000 |
| Embedding workers (4 × p3.2xlarge GPU) | BERT-scale embedding generation | ~$4,500 |
| Vector index storage (4 TB, Faiss/Weaviate nodes) | ANN index for 1 B doc embeddings | ~$2,000 |
| Query broker (4 × c5.xlarge) | Fan-out to shards, merge and rank | ~$600 |
| BM25 index shard nodes (20 × r5.4xlarge) | Hot postings lists in RAM; 100 K QPS | ~$8,000 |
| Vector query nodes (6 × g4dn.xlarge GPU) | ANN query serving | ~$3,000 |
| Result cache (Redis, cache.r6g.2xlarge × 3) | ~20% repeated-query cache hit | ~$1,500 |
| Monitoring + logging | Query latency, crawl freshness, zero-result rate | ~$500 |
| **Total** | | **~$32,900/month** |

Vector search (GPU embedding + ANN storage) adds ~$9,500/month versus keyword-only. At early stage, defer vector search until keyword search quality plateaus.

---

### Operations

- Monitor crawl success rate, robots.txt compliance, frontier depth, and per-domain fetch latency.
- Track indexing freshness SLO: time from fetch → searchable (target < 5 min for high-priority domains).
- Measure query p50/p95/p99 latency, timeout rate, zero-result rate, spell-correction acceptance rate, and CTR as relevance proxies.
- Track offline relevance metrics such as nDCG@10, MRR, and recall@100 on a labeled evaluation set before shipping ranking changes.
- Roll out ranking changes with **offline evaluation** (test on annotated query set) + **canary traffic** (5% of live traffic) before full rollout — "fast but worse relevance" is a regression.
- Maintain spam and abuse review pipelines — adversaries adapt to ranking signals continuously.

---

### How Does It Evolve in 3 Years?

| Year | Evolution |
|---|---|
| **Year 1** | Crawler, inverted index, BM25 ranking, KWIC snippets, spell correction, distributed query serving. |
| **Year 2** | Query understanding (NLP preprocessing), near-real-time incremental indexing, hybrid keyword+vector retrieval, basic personalization. |
| **Year 3** | Full personalization, learned-to-rank model, multi-modal search (image, video), generative AI answer synthesis above results. |

---

### Interview Questions & Answers

**Q1: When is a classic inverted index (BM25) enough, and when does vector/semantic retrieval justify the extra complexity?**

BM25 is sufficient when: users search with exact keywords, domain vocabulary is consistent and specialized (e.g., legal or medical systems where users know precise terms), and keyword recall is acceptable. Add vector retrieval when: queries are conversational ("what causes memory leaks"), synonyms and paraphrases are common and missing them causes visible quality degradation, cross-language search is needed, or user satisfaction data (CTR, reformulation rate) shows keyword-only misses are frequent. The operational cost of vector search is significant: embedding generation requires GPU inference, HNSW index at 1 B documents requires 4 TB storage, and ANN query latency adds 20–50 ms. Justify with measurable recall improvement before adding it.

**Q2: Walk through exactly what happens from the moment a user types a query to seeing results — including spell correction, query understanding, and ranking.**

(1) **Query received** by the query broker. (2) **Query understanding:** lowercase, tokenize, remove stopwords, stem ("strategies" → "strategi"), detect query type (informational/navigational/transactional), expand synonyms. (3) **Spell correction:** check each token against corpus vocabulary; for unknown tokens, generate edit-distance candidates ranked by language model probability; show "did you mean?" for high-confidence corrections. (4) **BM25 retrieval:** fan out to all index shards; each shard fetches postings for query terms, intersects, computes BM25 scores locally, returns top-100 candidates. (5) **Vector retrieval (if enabled):** embed query using transformer model; HNSW ANN search on vector index shards; top-100 semantic candidates. (6) **Candidate merge:** union BM25 + vector candidates, deduplicate. (7) **Re-rank:** attach offline features (PageRank, quality score, spam score); apply personalization signals; score with weighted combination or learned-to-rank model. (8) **Snippet generation:** KWIC — find windows in document text maximizing query term coverage; highlight matched terms. (9) **Return top-10** with snippets, scores, and metadata. Total time target: < 200 ms p99.

**Q3: How does BM25 decide which documents are more relevant than others? What are the key parameters?**

BM25 scores documents based on three intuitions: (1) **Term frequency** — documents that mention query terms more often are more relevant, but with diminishing returns (controlled by $k_1$, typically 1.2–2.0; $k_1 = 0$ = binary presence/absence, $k_1 = \infty$ = raw term count). (2) **Inverse document frequency (IDF)** — terms that appear in fewer documents carry more discriminative power; "redis" in a general web corpus is rarer than "the" and thus more informative. (3) **Document length normalization** — a term appearing 3 times in a 20-word document is more significant than in a 2,000-word document (controlled by $b$, typically 0.75; $b = 0$ = no normalization, $b = 1$ = full length normalization). Tuning: $k_1$ and $b$ are usually tuned against a labeled relevance dataset. Elasticsearch defaults: $k_1 = 1.2$, $b = 0.75$.

**Q4: How does spell correction work, and how do you avoid "correcting" technical terms that are correct?**

Spell correction uses the **noisy channel model**: $P(\text{correction} | \text{query}) \propto P(\text{query} | \text{correction}) \times P(\text{correction})$, where $P(\text{correction})$ is corpus frequency and $P(\text{query} | \text{correction})$ is keyboard/phonetic confusion probability. To avoid mis-correcting technical terms: (1) Build the correction vocabulary from the **query log** (not just documents) — user queries that received clicks are reliable "valid" terms. "rdis" has almost zero query log frequency; "redis" has millions of log entries. (2) Set a confidence threshold — only show correction when the candidate has significantly higher query log frequency than the original. (3) Maintain a **technical term whitelist** for known proper nouns (product names, API names, company names). (4) Show corrections as suggestions rather than auto-applying when confidence is below threshold.

**Q5: How do you implement near-real-time indexing so new content appears in search within minutes while maintaining the stability of the main index?**

Use a **delta index + merge strategy** (LSM-inspired): (1) New documents land in a small **in-memory segment** and are immediately searchable (< 1 min from crawl to searchable). (2) Background merger compacts multiple small segments into larger sorted segments (every few minutes). (3) The query broker searches both the main index and active delta segments, merging results at query time. (4) Periodically (hours or days), a full **segment merge job** rebuilds clean large segments; atomic shard swap replaces old segments — queries see either old or new, never partial. (5) Failure recovery: segments are written to durable storage (S3/HDFS) before being made searchable; replay from Kafka offset if the writer crashes. The delta index adds a small per-query latency overhead for merging results from multiple index layers, but is typically <10 ms — acceptable for a 200 ms budget.

**Q6: How would you personalize search results while respecting user privacy?**

Personalization is implemented through **user feature vectors** rather than raw query log replay: (1) For each user, maintain an aggregate feature vector: preferred language, location, top-10 topic categories inferred from recent clicks, preferred reading level. (2) At query time, use the user's feature vector to adjust ranking: upweight results matching preferred language, downweight topics the user historically skips, boost local results for location-sensitive queries. (3) **Privacy safeguards:** Store aggregate features only (not raw query text or URLs clicked). Apply differential privacy noise when computing features from small user populations. Offer a clear "clear personalization history" control. For GDPR compliance: process all personalization in the serving path without persisting query text beyond the session. (4) A/B test personalization: run personalized and non-personalized ranking in parallel for 5% of traffic each; measure CTR and reformulation rate to confirm personalization improves outcomes before full rollout.

---

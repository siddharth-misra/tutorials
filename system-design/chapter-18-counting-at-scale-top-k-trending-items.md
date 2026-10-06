## 18: Counting at Scale — Top-K Trending Items

### The Core Problem: Counting Billions of Events in Real Time

You run a music streaming service like Spotify. You want to answer: **"What are the 100 most-played songs in the last hour?"**

**Naive approach:** Keep a counter for every song. When a song plays, increment its counter. Sort by count at the end of each hour. This works for 1,000 songs. It breaks for 50 million songs with 1 billion plays per hour because:
- A hash table of 50 M counters doesn't fit in one machine's RAM.
- Sorting 50 M counters every second is too slow.
- Events arrive on thousands of different machines simultaneously.

**The distributed challenge:** Events for the same song arrive on different machines. No single machine knows the true global count. And different consumers of the result want different accuracy guarantees:

| Consumer | Accuracy Needed | Freshness Needed |
|---|---|---|
| Trending chart on homepage | "Close enough" — rank 3 vs rank 5 doesn't matter | Seconds |
| Creator royalty dashboard | Exact — 1 play = 1 cent | Minutes to hours |
| Billing engine | Exact — financial record | Daily batch |
| Fraud detection | Approximate spike detection | Seconds |

This natural tension — **speed vs accuracy** — leads to a **dual-path architecture**: a fast approximate path for product surfaces, and a slow exact path for billing and audit.

### The Ballot Counter

Imagine an election with millions of ballots arriving per second at 1,000 different counting stations:

**Exact count:** Collect every ballot at one place and count. Perfect, but slow — you need all ballots before you know the result.

**Approximate count:** Each station takes a sample and estimates the total. Fast — but has some error margin.

For trending charts, you want the "rough estimate by each counting station, combined into a global estimate" approach. For royalties, you need every single ballot counted correctly.

**Key insight for distributed counting:**
- A single machine can compute Top-K exactly with a `HashMap` + `MinHeap` — O(N) space, O(N log K) time.
- The distributed problem is: (a) events are spread across thousands of partitions, (b) combined state is too large for one machine's RAM, and (c) some consumers need approximate results in seconds while others need exact results with bounded error.

### Real-World Examples

| Platform | Query | Time Window | Scale |
|---|---|---|---|
| **Twitter/X** | Most retweeted tweets | Last 1 hour | Billions of tweets/day |
| **YouTube** | Most watched videos | Last 24 hours | 500 hours of video uploaded per minute |
| **Spotify** | Most played songs | Last hour / day / week | ~100M active users |
| **Google** | Most searched queries | Last minute | 8.5B searches/day |
| **Instagram** | Trending hashtags | Last hour | 100M+ posts/day |
| **GitHub** | Most starred repos | Last week | Millions of repos |

---

### Functional Requirements

1. **Top-K query:** `topK(K, startTime, endTime, scope) → [item_1, item_2, ..., item_K]`
2. **Windowing:** Support windows: last 5 min, 1 hour, 24 hours, 7 days.
3. **Scope filters:** Global, regional, by category (e.g., top songs in hip-hop genre).
4. **Fast path (approximate):** Return near-real-time results within seconds.
5. **Slow path (exact):** Return exact results for analytics, audits, and billing.
6. **Weighted events:** Support events with weights (e.g., a "super like" counts as 5).
7. **Replay and backfill:** Recompute windows when processing logic changes or jobs fail.
8. **Hot-key resilience:** Single viral items must not overwhelm one partition.

---

### Non-Functional Requirements

| Requirement | Target |
|---|---|
| Events per day | Trillions |
| Fast path latency | Approximate results in < 5 seconds |
| Slow path latency | Exact results in minutes to hours |
| Storage | Raw events retained for 3–7 days for replay |
| Accuracy (fast path) | Bounded error — sketch guarantees |
| Accuracy (slow path) | Exactly correct |

---

### Capacity Estimation

1. **Ingestion rate:** 100 B events/day = ~1.16 M events/second average; plan for ~10× bursts (~11.6 M/sec).
2. **Bandwidth:** At 100 bytes/event, peak ingress = ~1.16 GB/s before replication.
3. **Storage:** 100 B events/day × 100 bytes = ~10 TB/day of raw events.
4. **Kafka partitions:** With 1,024 partitions at 10× burst, each partition handles ~11,300 events/sec average.
5. **Approximate state per worker:** Count-Min Sketch with H=5, W=10,000 = **400 KB** — the entire sketch fits in L3 cache regardless of unique item count.
6. **Exact aggregation:** 50 M unique songs × 8 bytes counter = ~400 MB per worker — feasible with key-partitioned assignment.

---

### Entity Design

**Event** (raw input)

| Field | Type | Notes |
|---|---|---|
| `event_id` | `UUID` PK | |
| `item_id` | `VARCHAR(128)` | the entity being counted (song_id, video_id, tweet_id) |
| `scope` | `VARCHAR(64)` | global / us-east / hip-hop |
| `occurred_at` | `TIMESTAMP` | event time (not ingestion time) |
| `weight` | `INT` | usually 1; higher for premium actions |

**TopKWindowResult** (precomputed output)

| Field | Type | Notes |
|---|---|---|
| `window_id` | `UUID` PK | |
| `window_start` | `TIMESTAMP` | |
| `window_end` | `TIMESTAMP` | |
| `scope` | `VARCHAR(64)` | |
| `mode` | `VARCHAR(16)` | approximate / exact |
| `generated_at` | `TIMESTAMP` | when this result was computed |

**TopKWindowEntry** (ranked items within a result)

| Field | Type | Notes |
|---|---|---|
| `window_id` | `UUID` FK → TopKWindowResult | |
| `rank` | `INT` | 1 = most frequent |
| `item_id` | `VARCHAR(128)` | |
| `count` | `BIGINT` | |

---

### ER Diagram

```
Event ──────────────────────────────────► Fast Processors ──► Approximate Result Store
   │                                         (CMS + heap)
   └────────────────────────────────────► Durable Storage ──► Exact Aggregator ──► Exact Result Store
                                            (S3 / HDFS)

TopKWindowResult ─────────────< TopKWindowEntry
                 ▲
                 └── served by Query API
```

---

### API Design

```http
POST /v1/topk/query
```

Request:
```json
{
  "k": 100,
  "start_time": "2026-04-20T00:00:00Z",
  "end_time": "2026-04-20T01:00:00Z",
  "scope": "global",
  "mode": "approximate"
}
```

Response:
```json
{
  "items": [
    {"id": "song_bohemian_rhapsody", "count": 12412310},
    {"id": "song_blinding_lights",   "count": 11877203}
  ],
  "mode": "approximate",
  "generated_at": "2026-04-20T01:00:04Z",
  "window_start": "2026-04-20T00:00:00Z",
  "window_end":   "2026-04-20T01:00:00Z"
}
```

```http
GET /v1/topk/results?window=1h&scope=global&limit=100&mode=exact
```

---

### High-Level Architecture

#### Fast Path (Approximate — seconds of freshness)

```
Event Producers
        │
Ingestion API / Gateway
        │
Apache Kafka  (partitioned by item_id for exact; by event hash for approximate)
        │
Fast Processors  (one per Kafka partition)
   ├── Count-Min Sketch (in-memory, fixed size)
   ├── Min-Heap of top-K candidates
   └── Every 5 sec: emit local Top-K candidates
        │
Global Aggregator
   ├── Collect candidates from all processors
   ├── Merge sketch estimates
   └── Compute global Top-K from merged candidates
        │
Query API  (reads latest materialized result from cache)
```

#### Slow Path (Exact — minutes to hours of freshness)

```
Apache Kafka
        │
Durable Raw Event Sink (S3 / HDFS)
   └── Partitioned by (scope, window, item_id)
        │
Exact Aggregation Job  (MapReduce / Spark / Flink)
   ├── Shuffle by item_id → each reducer owns all events for one item
   ├── Sum counts exactly
   └── Extract global Top-K
        │
Exact Result Store  (Postgres/DynamoDB)
        │
Query API  (returns exact results for completed windows)
```

---

### The Counting Algorithms

#### Algorithm 1: Count-Min Sketch (Fast Path)

The standard algorithm for the approximate fast path. It provides fixed-memory approximate frequency counting.

**Structure:** a 2D array, `H` rows × `W` columns.
- `H` = number of independent hash functions (typically 5–7)
- `W` = width per row (typically 1,000–10,000)
- Total memory = `H × W × 8 bytes` (64-bit counters)

**Update (event for item `x` with weight `w`):**
```
For each row i in [0, H):
    j = hash_i(x) mod W
    sketch[i][j] += w
```

**Query (estimated frequency of `x`):**
```
return min(sketch[i][hash_i(x) mod W] for i in [0, H))
```

**Why min?** Hash collisions inflate some cells. The minimum across rows gives the tightest upper-bound estimate — at least one row's cell has the least collision contamination.

**Worked Example (H=3, W=5):** After 100 plays of "Song A":
```
Row 0, col 2: 103  ← 100 Song A + 3 collisions from other songs
Row 1, col 4: 100  ← 100 Song A + 0 collisions (lucky)
Row 2, col 1: 101  ← 100 Song A + 1 collision
Estimate = min(103, 100, 101) = 100  ✓
```

**Error bound:** Estimated count ≤ true count + ε × N, where ε = e/W (≈ 2.718/W) and N = total events. With W=10,000, H=5: error ≤ 0.027% of total events, with probability ≥ 1 - e^{-5} ≈ 99.3%.

**Memory:** H=5, W=10,000 → 50,000 counters × 8 bytes = **400 KB** — fits in a single CPU's L3 cache regardless of unique item cardinality.

**Merge across workers:** Element-wise sum of two sketches gives a sketch over the union of events — this makes the fast path naturally parallelizable without coordination.

---

#### Algorithm 2: Misra-Gries (Space-Efficient Exact Candidate Finding)

Misra-Gries finds all items that occur more than N/K times using only K-1 counters. It is used as an alternative to CMS for identifying "heavy hitter candidates."

**Algorithm:**
```
counters = {}  # at most K-1 entries

for each event x:
    if x in counters:
        counters[x] += 1
    elif len(counters) < K - 1:
        counters[x] = 1
    else:
        # decrement all counters by 1 and remove zeros
        for key in list(counters):
            counters[key] -= 1
            if counters[key] == 0:
                del counters[key]
```

**Guarantee:** Any item occurring more than N/K times will appear in `counters` at the end. False positives are possible (items in counters may not actually exceed N/K), but no item exceeding N/K is ever missed.

**When to use Misra-Gries:** When you need to identify candidates for exact counting and want stronger guarantees than CMS about which items are "heavy hitters." After identifying candidates, verify their exact counts against the slow path or a second pass.

**Memory:** O(K) counters — much less than a full hash table when the candidate list K is small (e.g., K=1,000 for Top-100).

---

#### Algorithm 3: Space-Saving (More Accurate Heavy Hitter Detection)

An improvement on Misra-Gries that maintains exact counts for candidates and provides tighter error bounds.

**Key difference from Misra-Gries:** When a new item displaces the minimum-count entry, the new item inherits the minimum count value (instead of starting at 1). This gives an explicit error bound per item: `estimated_count - error_bound[item]`.

**Guarantee:** The true count of item x is between `(estimated_count[x] - max_error)` and `estimated_count[x]`.

**When to use Space-Saving vs Count-Min Sketch:**
- **CMS** is better when you need to query arbitrary items' frequencies — it can estimate the count of any item, not just candidates.
- **Space-Saving** is better when you specifically want the most frequent K items and care about tight per-item error bounds.

---

### Fast Path vs Slow Path Comparison

| | Fast Path | Slow Path |
|---|---|---|
| **Algorithm** | Count-Min Sketch + Min-Heap | Exact aggregation (MapReduce, Spark, Flink) |
| **Freshness** | Seconds | Minutes to hours |
| **Accuracy** | Approximate (bounded error) | Exact |
| **Storage** | Fixed memory per worker | Durable raw events in S3/HDFS |
| **Parallelism** | Embarrassingly parallel (merge sketches) | Requires shuffle by item_id |
| **Failure recovery** | Accept bounded error; re-sketch from Kafka | Idempotent re-run from durable storage |
| **Use case** | Trending feeds, live leaderboards | Billing, creator dashboards, audit |

**Why not a single path?** A single server with a hash table becomes the ingestion bottleneck at millions of events/second. A single exact distributed path has minutes of latency — unacceptable for trending. A single approximate path cannot serve billing use cases. The two-path architecture explicitly accepts the tension between speed and correctness.

---

### Sliding Windows vs Tumbling Windows

**Tumbling windows:** Non-overlapping fixed intervals (e.g., 10:00–11:00, 11:00–12:00).
- Simple to implement: each processor keeps state for the current window; flushes at boundaries.
- Used for: hourly charts, daily reports.

**Sliding windows:** Windows that move continuously (e.g., "last 60 minutes" at every second).
- More complex: need to add new events and expire old ones continuously.
- Implementation options:
  1. **Multiple tumbling windows merged:** Keep 12 × 5-minute buckets; the "last hour" result is the merge of all 12. Evict the oldest bucket every 5 minutes.
  2. **Flink/Spark time-windowed aggregations:** Built-in support for sliding windows in streaming frameworks.
- Used for: "trending right now" features where users expect real-time ranking.

---

### Hot-Key Problem

When a viral item (Taylor Swift drops a new album) receives 1000× more events than average, one Kafka partition receives 1000× more events → one processor is overwhelmed.

**Detection:** Monitor `max_partition_events_per_sec / avg_partition_events_per_sec`. Alert when ratio > 5×.

**Mitigation:**
1. **Sub-key splitting:** Route the hot item to a dedicated set of partitions by appending a random suffix: `taylor_swift_new_album_0`, `..._1`, ..., `..._N`. Aggregate their counts in the global aggregator.
2. **Dedicated hot-key processor:** Assign additional compute to process the hot partition. This is automatic in Kafka with auto-rebalancing if you have more consumer threads than usual.
3. **Backpressure at ingestion:** Rate-limit events per partition at the ingestion gateway. Accept bounded loss of viral events rather than let one item crash a processor.

---

### Query Flow

```
1. Client requests Top-K for window W and scope S
2. Query API checks if exact result exists for the requested window → return if available
3. If no exact result yet (window still open), return latest approximate result
4. Response includes mode (approximate/exact), generated_at, and window boundaries
5. Product layer shows "updated 4 seconds ago" or "exact · as of 2:00 AM"
```

Always include `mode` in the response — product teams and partners need to know whether they are viewing a near-real-time estimate or a finalized exact result.

---

### Architecture Decisions

| Axis | Decision | Reasoning |
|---|---|---|
| Scalability | Horizontal partitioning for ingestion and compute | Millions of events/second cannot be processed by one machine |
| Latency vs accuracy | Dual fast + slow paths | Product surfaces need seconds; billing needs exactness |
| Counting algorithm | CMS for fast path; exact for slow path | CMS: fixed memory, mergeable; exact: correct but requires shuffle |
| Hot-key handling | Dedicated sub-key split path | Prevents one viral item from overwhelming one partition |
| Result freshness | Precomputed window results | Stable query latency; avoids re-scanning raw events per query |
| Partitioning | Hash-based (approximate); by item_id (exact) | CMS sketches merge freely; exact path requires co-location |

---

### Failure Modes & Mitigations

| Component | Failure | Impact | Mitigation |
|---|---|---|---|
| Ingestion API | Burst overflow | Events dropped → undercounting | Monitor buffer depth; auto-scale; accept bounded loss for approximate path |
| Kafka broker | Partition unavailable | Processing lag | Replication factor = 3; replay when healthy |
| Fast Processor | Crash before flush | Approximate undercounting for that window | Bounded error acceptable; checkpoint sketch state if needed |
| Hot partition | Viral item overwhelms one processor | Slow / skewed results | Sub-key splitting; dedicated hot-key processing lane |
| Exact aggregation job | Failure mid-job | Window result delayed | Idempotent job re-runs from durable S3 storage |
| Global aggregator | Single point of failure | No approximate results | Run 2+ aggregator instances; results are mergeable |

---

### Design Rationale

The system serves two fundamentally different consumers: product surfaces need fresh approximate results, and billing/audit needs exact counts. A single design over-optimizes for one side and fails the other. The two-path architecture explicitly accepts the tension: compact approximate summaries for fast answers, durable raw-event aggregation for exact answers later. Count-Min Sketch is the key enabler of the fast path — it provides sub-percent error in **fixed memory** (400 KB regardless of unique item count), enabling sketches to run on every partition simultaneously with trivial merge semantics.

---

### How Much Will It Cost?

**Infrastructure estimate (100 B events/day, Top-K = 100 items):**

| Component | Spec | Monthly Cost |
|---|---|---|
| Ingestion API (10 × c5.2xlarge) | Buffering + validation | ~$3,000 |
| Kafka cluster (6 × kafka.m5.2xlarge, MSK) | 3× replication, 7-day retention | ~$2,200 |
| Fast Processors (20 × c5.xlarge) | Count-Min Sketch in memory | ~$1,500 |
| Exact Aggregation (10 × r5.xlarge + EMR/Flink) | Shuffle by item_id, exact count | ~$3,500 |
| S3 / HDFS (100 TB raw/month) | Raw event storage | ~$2,300 |
| Serving Store (RDS + Redis) | Top-K result API | ~$700 |
| **Total** | | **~$13,200/month** |

Storage and streaming compute dominate at large scale. At smaller scale (1 B events/day), total cost drops to ~$2,000/month.

---

### Operations

- Monitor: fast-path freshness, approximate error rate vs sampled exact counts, consumer lag per partition, exact-job SLA breach rate.
- Maintain a **hot-key runbook** — operators must know how to detect and split a viral item before it crashes a processor.
- Periodically compare approximate results with exact results from completed windows to validate sketch accuracy is within bounds.
- Keep raw events in S3 for 7+ days — the ability to replay and recompute is critical when algorithm bugs are found.

---

### How Does It Evolve in 3 Years?

| Year | Evolution |
|---|---|
| **Year 1** | Approximate fast path with Count-Min Sketch + hourly exact batch jobs. |
| **Year 2** | Streaming exact aggregation with Flink, adaptive hot-key detection, and sliding window support. |
| **Year 3** | Unified streaming architecture with multi-window support, personalized Top-K (top items per user cohort), and regional Top-K for geo-specific trending. |

---

### Interview Questions & Answers

**Q1: When are approximate answers good enough, and when do product or billing requirements force exact counts?**

Approximate answers are good enough for **trending and discovery** features where rank 3 vs rank 5 has no business consequence, and for leaderboards where a small error margin is invisible to users. Exact counts are required for: billing (per-event charges), creator royalty compensation (1 play = 1 unit of revenue), audit compliance (regulators inspect exact numbers), and cases where the margin between adjacent ranked items is small and business decisions depend on the exact ranking. Practical rule: if displaying the wrong count could cause a financial dispute or legal obligation, use the exact slow path.

**Q2: How much memory are you willing to spend on sketch accuracy before exact partitioned counting becomes simpler?**

A Count-Min Sketch with W=10,000 and H=5 uses **400 KB** of memory per worker, with error bounded at ≤0.027% of total events. Widening to W=100,000 reduces error to 0.0027% at 4 MB. Beyond 100 MB per worker, you are better off partitioning by item key so each worker holds an exact hash table for its slice — the overhead of maintaining massive sketches exceeds the operational simplicity advantage. The practical crossover: if you need < 0.001% error and have fewer than ~100,000 unique items in the relevant scope, exact partitioned counting with a hash table is simpler and more accurate.

**Q3: What is the difference between Count-Min Sketch, Misra-Gries, and Space-Saving, and when would you pick each?**

**Count-Min Sketch:** Best for arbitrary frequency queries over any item in the data stream. Fixed memory regardless of unique item count. Easily parallelizable via element-wise merge. Error is overcount (never undercount). Use when you need to answer "how often did this specific item appear?" as well as Top-K. **Misra-Gries:** Best for identifying heavy hitter candidates with O(K) memory. Guarantees no item exceeding N/K frequency is missed, but may include false positives. Use when you know the items you care about have frequency > 1/K. **Space-Saving:** Best when you need top-K items with tighter per-item error bounds than CMS. Improvement over Misra-Gries in accuracy. Use when you need the Top-K list and care about error bounds per ranked item, not arbitrary item queries.

**Q4: When should you use strict key partitioning for correctness versus random partitioning for load balance?**

**Strict key partitioning by `item_id`** is required for the exact path — all events for one item must reach one counter or the exact count is impossible without a distributed join. **Random partitioning** is appropriate for the approximate path (CMS) — sketches from different partitions merge by element-wise sum, so it does not matter which partition processes which items. The fast path can use random partitioning for load balance, tolerating hot keys more gracefully. The exact path must use key partitioning and handle hot keys explicitly via sub-key splitting.

**Q5: At what scale is streaming exact aggregation worth replacing batch jobs?**

When the acceptable latency for exact results drops below what batch processing can deliver. A nightly Spark batch job (runs at 2 AM) is fine for weekly reporting. An hourly Spark job is fine for daily analytics dashboards. A streaming Flink job is required when exact counts must be available within minutes — for real-time creator dashboards, per-minute billing events, or live event leaderboards during a sports match. The operational cost of managing stateful streaming (checkpoint tuning, backpressure, state backend storage) is significantly higher than batch. Only cross that line when the business genuinely needs sub-hour exact freshness. A good intermediate: run micro-batch jobs every 5 minutes for approximate-exact results, and a slower full-precision job hourly.

**Q6: How do you prevent a single viral item from taking down one processor, and how do you detect the problem early?**

**Detection:** Track `events_per_second` per Kafka partition. Alert when any partition exceeds `3× average`. This is a leading indicator that triggers intervention before the processor falls behind.

**Mitigation:** Implement sub-key splitting at the ingestion layer. Route all events for the hot item `viral_song_xyz` to a dedicated set of partitions using a random sub-key suffix: `viral_song_xyz_0` through `viral_song_xyz_9`. Each partition is processed independently. The global aggregator sums the sub-key counts: `total_count("viral_song_xyz") = sum(count("viral_song_xyz_0"), ..., count("viral_song_xyz_9"))`. This splits the hot key's load across 10 partitions without changing the rest of the pipeline. The sub-key mapping must be idempotent and stored in the routing configuration so replays produce the same routing decisions.

---

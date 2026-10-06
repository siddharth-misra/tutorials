## 11: Caching Strategies

### Why Caching Exists

Every system eventually hits a wall where the database cannot keep up with read traffic. Memory is roughly 100× faster than SSD and thousands of times faster than a cross-region database query. Caching exploits this gap by keeping frequently accessed data in fast memory so the database does not have to answer the same question repeatedly.

Three concrete problems caching solves:

1. **Latency** — a Redis lookup takes ~0.1 ms; a Postgres query over the network takes ~5–20 ms.
2. **Database protection** — at 1M requests/second, even a 90% cache hit rate eliminates 900K database calls per second.
3. **Cost** — serving reads from memory is cheaper than scaling database replicas.

**Real-world example:** Amazon product pages receive tens of millions of views per day. If every page view queried Postgres for product details, prices, and reviews, the database cluster would need to be hundreds of times larger. Instead, product metadata is cached in Redis or Memcached. The database handles writes and cache misses only.

---

### How a Cache Works: Hits, Misses, and Hit Rate

A cache stores a subset of data in fast storage. When the application needs a value, it checks the cache first:

- **Cache hit** — the value is in cache; return it immediately.
- **Cache miss** — the value is not in cache; fetch from the database, return to the caller, and optionally populate the cache.

**Hit rate** is the percentage of requests served from cache. A hit rate of 80% means only 20% of requests reach the database.

```
Hit Rate = Cache Hits / (Cache Hits + Cache Misses)
```

**Why hit rate matters more than raw speed:**
Even a slow cache with a 95% hit rate drastically reduces database load. A fast cache with a 20% hit rate saves almost nothing. Hit rate is the single most important metric to optimize first.

**Real-world example:** Netflix reports that its EVCache (a distributed Memcached layer) achieves over 99% hit rates for content metadata. That means less than 1 in 100 user requests touches a persistent database.

---

### Where to Place a Cache: The Caching Hierarchy

Caches can sit at multiple layers. Placing a cache closer to the user reduces latency further.

```
User
  ↓
Browser / Client Cache         ← L1: cheapest, fastest, local to device
  ↓
CDN (Edge Cache)               ← L2: geographically close to users
  ↓
API Gateway Cache              ← L3: before your application code runs
  ↓
Application Cache (Redis)      ← L4: in-process or shared remote cache
  ↓
Database Query Cache           ← L5: inside the DB engine itself
  ↓
Database (source of truth)
```

| Cache Layer | Typical Use | Latency | Scope |
|---|---|---|---|
| Browser cache | Static assets, API responses with Cache-Control headers | 0 ms (local) | One user |
| CDN | Images, JS/CSS, public API responses | ~5–20 ms | Global edge |
| API Gateway | Rate-limited or auth-checked responses | ~1–5 ms | All users |
| Redis / Memcached | DB query results, sessions, counters | ~0.1–1 ms | All app servers |
| DB query cache | Repeated identical SQL queries | ~1 ms | One DB node |

**Real-world example:** A news website serves static article HTML from a CDN. The CDN cache absorbs 95% of traffic. Only cache misses (e.g. a newly published article) reach the origin application servers, which then query Postgres and cache the result in Redis for subsequent requests from other users.

---

### Cache Write Strategies

Write strategy determines when and how data lands in cache relative to the database. Choosing the wrong strategy is the most common source of stale data bugs.

#### Cache-Aside (Lazy Loading)

The application controls cache population. On a miss, the app fetches from the DB and writes to cache. On a write, the app updates the DB and optionally invalidates the cache entry.

```
Read:  App → Cache miss → App → DB → App writes to Cache → returns data
Write: App → DB updated → App deletes or ignores cache entry
```

**Pros:** Simple. Cache only holds data that is actually requested. DB is always the source of truth.

**Cons:** First request always misses (cold start). Stale data possible between write and invalidation.

**Best for:** Product pages, blog posts, user profiles — read-heavy data that changes infrequently.

**Real-world example:** Twitter uses cache-aside for tweet timelines. A timeline is fetched from the database on the first view, cached in Redis, and served from cache on subsequent views. When a new tweet is posted, the cached timeline is invalidated so the next read fetches the fresh version.

#### Write-Through

Every write updates both the cache and the database synchronously. Reads always hit the cache.

```
Write: App → Cache updated → DB updated → return success
Read:  App → Cache hit (always warm)
```

**Pros:** Cache is always warm and consistent. No cold start for reads after writes.

**Cons:** Write latency increases (two writes per operation). Cache may store data that is never read.

**Best for:** User sessions, feature flags, shopping cart contents — data that is written and immediately read.

**Real-world example:** A user's shopping cart is stored write-through. Every add-to-cart operation writes to Redis and the database simultaneously. The cart is always fresh in cache, so checkout can read from Redis without a database round-trip.

#### Write-Back (Write-Behind)

Writes land in cache only. The cache asynchronously flushes dirty entries to the database later.

```
Write: App → Cache updated → return success immediately
Flush: Background job → Cache → DB (async, delayed)
```

**Pros:** Extremely low write latency. Absorbs write bursts.

**Cons:** Data loss if the cache node fails before flushing. Complex recovery. Harder to reason about consistency.

**Best for:** High-throughput counters, analytics event buffers, game leaderboards where some loss is tolerable.

**Real-world example:** A multiplayer game updates player scores hundreds of times per second. Writing every increment to Postgres would overwhelm the database. Instead, scores are accumulated in Redis (write-back) and periodically persisted to the database every few seconds.

#### Write-Around

Writes go directly to the database, bypassing the cache. The cache is populated only on the next read miss.

**Best for:** Write-once, rarely-read data like logs, archived records, or bulk imports. Avoids polluting the cache with data that will not be read soon.

#### Choosing a Write Strategy

| Strategy | Write Speed | Read Freshness | Data Safety | Use When |
|---|---|---|---|---|
| Cache-aside | Fast (DB only) | May be stale until invalidated | Safe (DB is source of truth) | Read-heavy, infrequent writes |
| Write-through | Slower (two writes) | Always fresh | Safe | Frequently read after write |
| Write-back | Fastest (memory only) | Always fresh | Risk of loss | Write-heavy, loss-tolerant |
| Write-around | Fast (DB only) | Always miss on first read | Safe | Rarely-read after write |

---

### Cache Eviction Policies

Caches have finite memory. When memory is full, the cache must evict (remove) existing entries to make room. The eviction policy determines which entries are removed.

| Policy | How It Works | Best For |
|---|---|---|
| **LRU** (Least Recently Used) | Evicts the entry not accessed for the longest time | General purpose; most commonly used default |
| **LFU** (Least Frequently Used) | Evicts the entry accessed fewest times overall | Workloads with stable hot data (e.g. top products) |
| **FIFO** (First In, First Out) | Evicts the oldest entry regardless of access | Simple; not access-aware |
| **Random** | Evicts a random entry | Very simple; surprisingly effective in some workloads |
| **TTL-based** | Evicts entries whose time-to-live has expired | Time-sensitive data (sessions, rate limits) |

**Redis** supports LRU, LFU, random, and TTL-based eviction, configurable via `maxmemory-policy`.

**Real-world example:** Spotify caches song metadata with LRU. Older, less-popular songs are evicted when memory fills up. Recently-played songs stay warm. This matches the access pattern: users tend to re-listen to recent discoveries.

---

### TTL Strategy: Controlling Freshness Through Expiry

TTL (Time To Live) is the simplest cache invalidation tool. An entry automatically expires and is removed after its TTL elapses.

#### Choosing TTL Values

Different data has different acceptable staleness:

| Data Type | Acceptable Staleness | Suggested TTL |
|---|---|---|
| User session token | Must be exact | Session duration (e.g. 30 min) |
| Rate-limit counter | Must be exact | Short window (e.g. 60 s) |
| Product price | Minutes acceptable | 5–10 minutes |
| Product catalog | Hours acceptable | 1 hour |
| Marketing / CMS pages | Hours to days acceptable | 6–24 hours |
| Static assets (JS, images) | Very long | Days to weeks (versioned URLs) |

#### TTL Jitter: Avoiding the Thundering Herd

If many cache entries share the same TTL and are populated at the same time (e.g. during a cache warm-up), they will all expire at the same time. This causes a sudden wave of cache misses all hitting the database simultaneously — the **thundering herd** (also called **cache stampede**).

**Fix:** Add random jitter to TTLs.

```python
# Instead of a fixed TTL:
ttl = 300

# Add ±20% jitter:
import random
ttl = 300 + random.randint(-60, 60)
```

**Real-world example:** During a Black Friday traffic spike, an e-commerce platform pre-warms product pages into Redis. Without jitter, all 10,000 product entries would expire at exactly the same time 5 minutes later, creating a stampede. With TTL jitter of ±30 seconds, expiries are spread across a 60-second window, smoothing the load.

---

### Cache Invalidation: The Hardest Problem in Caching

> "There are only two hard things in computer science: cache invalidation and naming things." — Phil Karlton

Invalidation ensures the cache does not serve stale data after the underlying data changes.

#### Strategies

**1. Explicit delete on write**

When the application updates the database, it immediately deletes the corresponding cache key. The next read is a miss and populates the fresh value.

```
App writes to DB → App deletes cache key → Next read repopulates cache
```

Simple and effective when writes originate in one place.

**2. Write-through update**

On every write, update the cache entry at the same time. No deletion needed because the cached value is always current.

**3. Versioned keys**

Instead of mutating `product:123`, write to `product:123:v2`. Readers increment the version number on update. Old keys expire naturally via TTL. No explicit invalidation logic needed.

```
product:123:v1  ← old readers still see this until TTL
product:123:v2  ← new readers see this
```

**4. Event-driven invalidation (Change Data Capture)**

A CDC tool (e.g. Debezium) watches the database write-ahead log and publishes events for every row change. A cache invalidation service subscribes to these events and deletes the affected cache keys.

```
DB write → Debezium → Kafka event → Cache invalidation service → DELETE cache key
```

**Best for:** Systems where multiple services write to the same data and you cannot afford to add invalidation logic to every writer.

**Real-world example:** Airbnb uses CDC-based cache invalidation for listing prices. When a host updates their price in the database, a Debezium connector captures the change, publishes it to Kafka, and a cache invalidation consumer deletes the stale price entry in Memcached. This decouples the host-facing write service from the guest-facing read cache.

#### Freshness Guarantees

Define the freshness contract per dataset, not per cache cluster:

| Freshness Model | Definition | Example |
|---|---|---|
| **Read-after-write consistency** | A user always sees their own writes immediately | Profile photo update |
| **Bounded staleness** | Data may be stale by at most N seconds | Product catalog (30 s) |
| **Stale-while-revalidate** | Serve slightly stale data; refresh in background | News feed |
| **Negative caching** | Cache "not found" responses briefly | Prevent repeated DB misses for non-existent keys |

**Rule:** define freshness per dataset. Sessions, prices, feature flags, and marketing pages should never share a single default TTL.

---

### Distributed Caching: Scaling Beyond One Node

A single cache node is limited by one machine's memory and network capacity. Distributed caching spreads keys across multiple nodes.

#### Sharding Strategies

**Consistent hashing** maps keys to nodes on a virtual ring. When a node is added or removed, only the keys on the adjacent segment are remapped — all others stay put. This minimizes cache churn during scaling events.

```
Key "product:123" → hash → position on ring → maps to Node B
Key "product:456" → hash → position on ring → maps to Node C
```

Without consistent hashing (e.g. simple modulo hashing), adding one node would remap ~50% of all keys, causing a massive miss spike.

#### Redis vs Memcached

| Feature | Redis | Memcached |
|---|---|---|
| Data types | Strings, lists, sets, sorted sets, hashes, streams | Strings only |
| Persistence | RDB snapshots, AOF log | None (in-memory only) |
| Replication | Built-in primary/replica | Not built-in |
| Clustering | Redis Cluster (sharding + replication) | Client-side sharding only |
| Pub/Sub | Yes | No |
| Lua scripting | Yes | No |
| Performance | Slightly lower (single-threaded core) | Slightly higher for pure string ops |
| Best for | Rich data structures, sessions, leaderboards, pub/sub | Simple high-throughput key-value cache |

**Real-world example:** Facebook operates one of the largest Memcached deployments in the world (described in their 2013 paper "Scaling Memcache at Facebook"). They use Memcached for simple object caching at massive scale and a separate Redis layer for features that require richer data structures like sorted sets for news feed ranking.

#### Replication

Distributed cache deployments typically run each primary shard with one or more replicas:

- Replicas provide fault tolerance. If a primary fails, a replica is promoted.
- Replicas can also serve read traffic to increase read throughput.
- Replication multiplies memory cost (2 replicas = 3× memory).

---

### Hot Keys and the Thundering Herd

#### What Is a Hot Key?

A hot key is a cache key accessed disproportionately more than others. Examples:

- The homepage object
- A celebrity's profile (e.g. a tweet from a public figure with 100M followers)
- A global feature flag checked by every request
- A trending product on a sale day

Even a perfectly sharded distributed cache is useless if all traffic goes to the same key on the same node. That node becomes a bottleneck regardless of the cache cluster's size.

**Real-world example:** During the 2013 Super Bowl, a single tweet from a major brand received millions of read requests per second. The cache key for that tweet's engagement data became a hot key on one Redis shard, causing it to spike to 100% CPU while other shards sat idle.

#### Mitigations

**1. Key splitting (fan-out replication)**

Store N copies of the hot value under different keys and route readers to different copies:

```
product:featured:0  → cached on Node A
product:featured:1  → cached on Node B
product:featured:2  → cached on Node C
...
Reader picks: product:featured:(requestId % N)
```

**2. Local in-process cache (L1 cache)**

Each application server keeps a tiny in-memory cache (e.g. using Guava Cache or Caffeine in Java, or `lru-cache` in Node.js). Hot keys are served from process memory without any network hop.

```
App server L1 (in-process, 100 MB) → Redis L2 (shared, 10 GB) → DB
```

**3. Request coalescing (mutex / single-flight)**

When multiple goroutines/threads/requests miss the same key simultaneously, only one fetches from the database. The others wait and share the result.

```go
// Go singleflight example
val, err, _ := sfGroup.Do(cacheKey, func() (interface{}, error) {
    return db.GetProduct(id)
})
```

**4. Read replicas for hot shards**

Add extra read replicas to the shard holding the hot key and distribute reads across them.

---

### Session Caching

User sessions (login state, auth tokens, user preferences) are a natural fit for caching:

- Sessions are small (a few KB), so they fit easily in memory.
- Sessions are read on every authenticated request — high read frequency.
- Sessions are user-scoped — no fan-out or hot key problem.

**Typical session cache design:**

```
Login → generate session token → store session in Redis (key: session:{token}, TTL: 30 min)
Request → read Bearer token from header → lookup Redis → retrieve user context
Logout → delete Redis key
```

**Session fields typically cached:**
- `user_id`
- `role` / `permissions`
- `MFA status`
- `user-specific feature flags`
- `refresh token expiry`

**Risk:** If the cache cluster goes down, all users are logged out. Mitigate by:

1. Using Redis replication so a replica can take over.
2. Storing a durable backup of refresh tokens in the database (sessions are rebuilt on next login).
3. Configuring Redis persistence (AOF mode) for session data specifically.

**Real-world example:** GitHub uses Redis for session storage. Each web request looks up the session token in Redis to authenticate the user without hitting the user database. Session TTLs are aligned with inactivity timeouts.

---

### Cache Warming: Avoiding the Cold Start Problem

A newly deployed or restarted cache has zero entries. The first wave of requests all miss, all hit the database simultaneously, and the database may be overwhelmed before the cache has time to warm up.

#### Warming Strategies

**1. Eager pre-warm on deploy**

Before taking traffic, a warm-up job pre-populates the cache with the most-accessed keys.

```bash
# Pseudo-script run before deploy completes:
for product_id in $(top_1000_products):
    redis-cli SET product:${product_id} $(db_fetch ${product_id}) EX 3600
```

**2. Lazy warm-up with circuit breaker**

Allow cache misses to reach the database but rate-limit the miss rate. If misses exceed a threshold, return a degraded response instead of pounding the DB.

**3. Warm from a snapshot**

Periodically snapshot the cache contents to a file or S3. On restart, reload from the snapshot. Redis supports this natively via RDB snapshots.

**4. Traffic shadowing**

Before cutting over to a new cache cluster, shadow production read traffic to it. The shadow cluster warms up without serving real users.

**Real-world example:** DoorDash pre-warms restaurant menus into Redis before the lunch rush. A scheduled job at 10:30 AM pre-populates the 1,000 most-ordered restaurants' menus so that the 12:00 PM spike hits a warm cache.

---

### Multi-Tier Caching

Production systems often use multiple cache layers simultaneously. Each tier trades memory size for speed.

```
Request
  ↓
L1: In-process cache (Caffeine / Guava)
    — size: 100 MB per app server
    — latency: ~0 ms (no network)
    — scope: single app server process
    — best for: very hot, rarely-changing data (feature flags, config)
  ↓ (on L1 miss)
L2: Shared remote cache (Redis Cluster)
    — size: 10–100 GB across cluster
    — latency: ~0.1–1 ms
    — scope: all app servers
    — best for: user sessions, product data, computed results
  ↓ (on L2 miss)
L3: CDN (for HTTP responses)
    — size: distributed edge nodes
    — latency: ~5–20 ms
    — scope: global
    — best for: public, cacheable HTTP responses
  ↓ (on all misses)
Database (source of truth)
```

**Consistency challenge:** With two cache layers, a write must invalidate both L1 and L2. L1 is per-process, so you cannot invalidate it remotely. Common solutions:

- Use a short TTL for L1 (e.g. 10 seconds) to bound staleness.
- Use a pub/sub channel (Redis Pub/Sub) to broadcast invalidation events to all app servers.

**Real-world example:** LinkedIn uses a multi-tier cache: an in-process Ehcache layer for member profile attributes that rarely change (e.g. name, headline) and a shared Couchbase cluster for more dynamic data. L1 absorbs the hottest reads within each JVM, and L2 provides consistency across the fleet.

---

### Failure Modes and Mitigations

| Failure | What Happens | Mitigation |
|---|---|---|
| **Cache stampede (thundering herd)** | Simultaneous misses for the same key overwhelm the DB | TTL jitter, request coalescing (singleflight), mutex lock on fill |
| **Hot key meltdown** | One shard at 100% CPU; others idle | Key splitting, L1 in-process cache, read replicas for hot shard |
| **Stale data after write** | Users see outdated content | Explicit invalidation, write-through, versioned keys, CDC |
| **Cache node failure** | Traffic falls through to DB; spike may cause cascade | Replicas, circuit breaker, graceful degradation |
| **Write-back data loss** | Cache crashes before dirty entries flush to DB | Replicated write-back; enable Redis persistence (AOF) |
| **Negative cache pollution** | A flood of missing-key requests bypasses cache | Cache "not found" results with a short TTL (negative caching) |
| **Cache poisoning** | Attacker inserts malicious values into the cache | Validate data before caching; use signed tokens for sensitive values |
| **Memory exhaustion** | Evictions spike; hit rate collapses | Monitor memory usage; size cache with headroom; choose correct eviction policy |
| **Session loss on cache restart** | All users logged out simultaneously | Redis replication + persistence; durable refresh token fallback in DB |

---

### Capacity Estimation

**Scenario:** Product page cache for an e-commerce site. 10M products, each ~2 KB of metadata. Peak traffic: 500K page views/second. Target cache hit rate: 95%.

**Step 1: Requests the cache must serve**
```
500K req/s × 95% hit rate = 475K req/s from cache
```

**Step 2: Memory footprint**
```
10M products × 2 KB = 20 GB for the full catalog
Practical working set (20% of products get 80% of traffic): ~4 GB hot data
With 2× replication: ~8 GB cache memory needed
```

**Step 3: Network bandwidth**
```
475K req/s × 2 KB response = ~950 MB/s read bandwidth across the cache fleet
```

**Step 4: Node sizing**
```
Redis node with 8 GB RAM and 10 Gbps NIC can handle this workload.
Add 2–3 nodes (primary + replicas) for HA.
```

**Step 5: Cost (AWS ElastiCache r7g.large, ~$0.17/hr)**
```
3 nodes × $0.17/hr × 720 hr/month ≈ $367/month
Compare: Postgres RDS instance to absorb 475K reads/s would cost $10,000+/month
```

---

### How Much Will It Cost?

1. **Memory is the primary cost lever.** Cache is RAM; RAM costs more per GB than SSD or HDD. Size the cache to the working set, not the full dataset.
2. **Replication multiplies cost.** Two replicas means 3× the memory and egress costs.
3. **Network egress matters at scale.** Remote cache calls add bandwidth; in-process caches eliminate that cost entirely.
4. **Operational overhead is real.** Invalidation logic, key naming conventions, TTL tuning, and incident response take engineering hours.

Redis is typically far cheaper than scaling the database to serve equivalent read throughput.

---

### Operations

- **Monitor:** hit rate, miss rate, eviction rate, memory usage, hot key distribution, and replication lag.
- **Alert on:** hit rate dropping below 85%, memory usage above 80%, eviction rate spikes, node failover events.
- **Operate:** warm caches after deploys or failovers; document TTL and invalidation policies per dataset; run regular failover drills.
- **Naming conventions:** use consistent, namespaced key patterns (`entity:id:field`) to simplify debugging and avoid key collisions across teams.
- **Schema evolution:** when a cached object's schema changes, use versioned keys or flush-and-repopulate to prevent stale deserialization errors.

---

### How Does It Evolve in 3 Years?

| Year | Evolution |
|---|---|
| Year 1 | Single Redis node in front of the primary database. Cache-aside for product/user reads. TTL-based invalidation. |
| Year 2 | Redis Cluster for horizontal scale. Explicit invalidation on writes. TTL jitter. Monitoring of hit rate and hot keys. Session caching. Cache warm-up on deploy. |
| Year 3 | Multi-tier: L1 in-process + L2 Redis + L3 CDN. Event-driven invalidation via CDC (Debezium + Kafka). Per-dataset freshness contracts. Automated hot key detection and splitting. |

---

### Design Trade-Off Summary

| Axis | Consideration |
|---|---|
| Scalability | Distribute cache horizontally with consistent hashing. Use L1 per-process caches for the hottest keys. |
| Latency vs throughput | Cache hits optimize latency. High hit rate protects database throughput. |
| Consistency vs availability | Caches sacrifice some consistency for speed. Define acceptable staleness per dataset. |
| Reliability | Replication, failover replicas, circuit breakers, and pre-warming reduce outage impact. |
| Stateful vs stateless | Cache nodes are stateful. Plan for node failure, snapshot recovery, and warm-up. |
| Synchronous vs asynchronous | Reads are synchronous. Invalidation, warming, and write-back flushes are often asynchronous. |

---

### Interview Trade-Off Questions and Answers

**Q1. When is cache-aside the right default, and when is write-through worth the extra write-path complexity?**

Cache-aside is the right default when reads greatly outnumber writes and some staleness between write and next read is acceptable. It is simpler to implement and keeps the cache lean — only frequently accessed data is stored. Write-through is worth the added complexity when data is almost always read immediately after being written (e.g. shopping carts, user preferences, feature flags) and you want to guarantee cache freshness without a miss on the first read. The cost is that every write now takes two hops (cache + DB), increasing write latency and storing entries that may never be read again.

**Q2. How do you choose between TTL-based freshness and explicit invalidation for datasets like prices, profiles, or feature flags?**

Use TTL when bounded staleness is acceptable and writes are infrequent or unpredictable: a product catalog can tolerate being 60 seconds stale. Use explicit invalidation when data must be fresh after a write, the write path is clearly owned by one service, and you can afford the operational complexity: user profile updates should invalidate the profile cache immediately. Use both together as a defence-in-depth strategy — explicit invalidation for the common case, TTL as a safety net in case invalidation is missed. Feature flags are a special case: because they affect every request, use write-through to keep them always current and use a short TTL (e.g. 5 seconds) as a fallback.

**Q3. If the cache is unavailable, should the system serve stale data, fall back to the database, or fail fast?**

It depends on the data type and business impact. For non-critical reads (product catalog, public content), serve stale data from a local backup or secondary cache — degraded freshness is better than a full outage. For database-backed reads where a fallback is cheap, fall through to the database and use a circuit breaker to shed load if the DB is also under stress. For session or auth lookups, a cache outage logs users out — mitigate by replicating sessions or storing durable refresh tokens in the database. Only fail fast for data where serving stale or absent values would cause incorrect business outcomes (e.g. serving a previously-active price after a price change to a lower value would be financially harmful). The general principle: cache unavailability should degrade gracefully, not cause a total outage.

**Q4. How do you detect and handle a hot key in production?**

Detection: monitor per-key access rates using Redis's `OBJECT FREQ` command (LFU mode), sampling via `MONITOR` (careful in production — high overhead), or by instrumenting the application layer to log cache key hit counts. Cloud providers (AWS ElastiCache, GCP Memorystore) expose hot key metrics in their dashboards. Handling: once identified, use key splitting (store N copies), add an L1 in-process cache on each app server so the network round-trip is eliminated, or promote the hot value into a local dictionary with a very short TTL (5–10 seconds) and background refresh.

**Q5. How would you design a caching layer that can survive a complete cache cluster restart without a thundering herd?**

Use a combination of: (1) Redis RDB snapshots or AOF persistence so the cache can reload its state on restart without hitting the database; (2) a pre-warm script that populates the top N keys before the cache is put back into the load balancer; (3) request coalescing (singleflight) at the application layer so that simultaneous misses for the same key result in only one database query; (4) a circuit breaker that limits the miss-fallthrough rate to the database during the warm-up window; and (5) TTL jitter on all cached entries to prevent simultaneous mass expiry after the warm-up completes.

---

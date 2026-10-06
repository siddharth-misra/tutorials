## 14: Designing a Distributed Cache

### 14.1 The Problem: Why Caches Exist

#### Plain-English Intuition

Imagine a popular restaurant where a waiter takes your order to the kitchen. On a quiet evening, that works fine. On a Friday night with 500 customers, every waiter running to the kitchen for every request creates a bottleneck — the kitchen (your database) gets overwhelmed.

A cache is a "prep station" near the front. The most popular dishes are pre-prepared and sitting on a shelf. 80% of orders are served from that shelf in seconds. Only 20% of unusual orders go back to the kitchen (database).

Web applications follow the same **Zipfian distribution**: 80% of requests touch the same 20% of data. A cache stores that hot 20% in RAM, serving it at ~100 µs instead of ~10 ms from disk — a 100× speedup.

**The fundamental equation:**
- Without cache: every request hits the database.
- With 90% cache hit rate: 10× fewer database queries at a fraction of the latency.

#### Real-World Examples

| System | Cache Technology | Scale |
|---|---|---|
| Facebook | Memcached ("Memcache") | Billions of requests/sec; 2,800+ servers in one cluster |
| Netflix | EVCache (Memcached-based) | 30 million+ cache operations/second globally |
| Twitter | Twemcache + Redis | Timeline caches, rate-limiting counters |
| Airbnb | Redis Cluster | Search results, session state |
| Uber | Redis + custom routing layer | Surge pricing data, driver location |

**Facebook's Memcached lesson (2013 paper):** Without the cache tier, Facebook would need 100× more MySQL servers. The cache layer processes tens of millions of requests per second with sub-millisecond latency. The paper introduced the concept of *lease-based invalidation* to solve cache stampedes.

---

### 14.2 Requirements

#### Functional Requirements

1. `put(key, value, ttl)` — Store a key-value pair with optional expiry.
2. `get(key)` — Return the value; null if not present or expired.
3. `delete(key)` — Explicitly evict a key.
4. **Eviction:** Automatically evict entries when memory is full, using a configurable policy (LRU, LFU, TTL).
5. **Replication:** Data survives a single node failure without loss.
6. **Discovery:** Clients automatically learn about node additions and removals without restart.

#### Non-Functional Requirements

| Property | Target |
|---|---|
| Read/write latency (p99) | < 1 ms within the same datacenter |
| Throughput | 1 M+ operations/second per cluster |
| Availability | No single point of failure; survives one node crash |
| Consistency | Stale reads acceptable for short TTL windows |
| Scalability | Horizontally scalable by adding nodes |
| Durability | Optional; acceptable to lose in-memory data on crash for a pure cache |

---

### 14.3 Capacity Estimation

**Scenario:** A social network with 10 M active users serving user profile pages.

**QPS estimation:**
- 10 M users × 5 requests/day avg = 50 M requests/day
- 50 M ÷ 86,400 sec ≈ **580 QPS average; ~2,000 QPS at peak** (3× peak factor)
- With 90% cache hit rate: cache handles **1,800 QPS**; DB handles **200 QPS**

**Storage estimation:**
- Avg user profile = 1 KB
- 10 M profiles × 1 KB = **10 GB** (fits on a single node)
- With replication factor 3: **30 GB** physical storage
- At 100 M users × 1 KB = **100 GB logical** → sharding required

**Bandwidth at 1 M QPS scale:**
- 800 K cache reads/sec (80% hit rate) × 1 KB = **800 MB/s** egress across cluster
- Requires distributing load across multiple nodes with sufficient combined NIC capacity

**Node count example:**
- 6 shards × 2 replicas = 12 nodes; using r6g.2xlarge (52 GB each) = 312 GB primary capacity, **624 GB total** with replicas

---

### 14.4 API Design

```http
GET    /v1/cache/{key}
PUT    /v1/cache/{key}
DELETE /v1/cache/{key}
```

Request body for `PUT`:
```json
{
  "value": "serialized payload",
  "ttl_seconds": 300
}
```

Response for `GET` (hit):
```json
{
  "key": "user:42:profile",
  "value": "...",
  "expires_at": "2026-04-20T12:05:00Z"
}
```

Response for `GET` (miss): `404 Not Found`

**Key namespacing convention:** Use `{entity}:{id}:{attribute}` (e.g., `user:42:profile`, `product:99:inventory`). This avoids key collisions between services sharing the same cluster and enables prefix-based scanning for debugging (`redis-cli --scan --pattern "user:*"`).

---

### 14.5 Single-Node Cache Internals

Before distributing a cache, understand how a single node works. Every distributed cache is a collection of single-node caches working together.

#### Core Data Structures

A single-node LRU cache uses a **hash map + doubly linked list** to achieve O(1) get, put, and eviction:

```
Hash Map:      key → pointer to linked-list node

Linked List:   [HEAD: most-recent] ↔ [nodeA] ↔ [nodeB] ↔ [TAIL: least-recent]
```

**GET operation:**
1. Look up key in hash map → pointer to linked-list node. Miss → return null. (O(1))
2. Hit: move node to HEAD, return value. (O(1))

**PUT operation:**
1. Key exists → update value at existing node, move to HEAD. (O(1))
2. Key is new, cache not full → insert new node at HEAD. (O(1))
3. Key is new, cache full → **evict TAIL node** (O(1)); remove from hash map; insert new node at HEAD.

**Real-world implementation:** Java's `LinkedHashMap` (with `accessOrder=true`) is exactly this structure. Redis uses a more memory-efficient **approximation** — it samples N random keys and evicts the least-recently used among them, avoiding the overhead of maintaining a full sorted doubly linked list across millions of keys.

#### Eviction Policies

When memory is full, the cache must decide what to discard.

| Policy | Evicts | Mechanism | Best For | Real Example |
|---|---|---|---|---|
| **LRU** | Least Recently Used | Doubly linked list; evict tail | General-purpose; temporal locality | Redis `allkeys-lru`, Caffeine |
| **LFU** | Least Frequently Used | Min-heap of access counts; evict min | Stable hot-sets (celebrity profiles, trending pages) | Redis `allkeys-lfu` (Redis 4.0+) |
| **FIFO** | Oldest inserted item | Queue; evict front | Simple cases without access locality | Basic HTTP reverse proxy caches |
| **Random** | A random item | Random selection | Lowest overhead; no tracking needed | Memcached internal approximation |
| **TTL-based** | Items past expiry | Background thread scans; evict expired | Session stores, rate-limit counters | Redis lazy + active expiry |

**LRU vs LFU — when does each win?**
- **LRU wins** when access patterns are temporal (recently accessed items are likely to be accessed again). Example: news feed items, recently edited documents.
- **LFU wins** when a small set of items is perpetually popular regardless of recency. Example: the top 1% of product pages that get 80% of traffic. LRU will evict popular-but-not-recently-accessed items; LFU protects them.
- **Redis 4.0+ LFU with time decay:** Frequency counts decay over time so old popularity doesn't permanently protect stale items. Best of both worlds for most production workloads.

**Redis lazy vs active TTL expiry:**
- **Lazy expiry:** A key is only deleted when someone reads it past TTL. Low CPU overhead; "zombie keys" linger in memory until accessed.
- **Active expiry:** Redis samples 20 random keys every 100 ms and deletes expired ones. Prevents indefinite accumulation of expired keys.
- Together, these two mechanisms keep memory clean without a full scan.

---

### 14.6 Scaling to a Distributed Cache

A single-node cache is bounded by one server's RAM (~100–500 GB). At 100 M users × 5 KB average profile = 500 GB of data, you need to distribute the cache across nodes.

#### Co-located vs. Remote Cache

| Setup | Latency | Pros | Cons | When to Use |
|---|---|---|---|---|
| **Co-located** (same host as app server) | ~100 ns (in-process) | No network hop; trivially fast | Cache lost if app server dies; memory competes with app; no sharing between instances | Local state: computed results, static config, feature flags |
| **Remote** (dedicated cluster) ✅ | ~500 µs–1 ms | Independent scaling; survives app restarts; shared across all instances | Network round-trip | Shared state: sessions, profiles, rate-limit counters |

**Production pattern:** Use both tiers together — L1 (in-process, co-located) for the hottest keys at sub-millisecond latency, L2 (remote Redis) for the shared tier. See Section 14.10.

#### Naive Hashing and Its Fatal Flaw

The obvious routing strategy:

```
node = hash(key) % N
```

**The problem:** When N changes (add or remove a node), `hash(key) % N` and `hash(key) % (N±1)` differ for approximately `(N-1)/N` of all keys — ~75% when going from 3 to 4 nodes. Every remapped key is now a cache miss. Your database receives a sudden 75% miss-rate spike, which is catastrophic in production.

#### Consistent Hashing with Virtual Nodes

See Chapter 13 for the full mathematical treatment. Summary for this context:

**Core idea:** Map both keys and servers onto a circular ring (0 to 2³²). A key is owned by the first server encountered clockwise from its hash position.

```
Ring:   0 ─── Server A (pos 100) ─── Server B (pos 220) ─── Server C (pos 310) ─── 0 (wrap)

        "user:42" → hash 150 → owned by Server B
        "user:99" → hash 320 → owned by Server C (wraps around)
```

**When a node is added/removed:** Only the keys between the new node and its predecessor migrate. On average, only `1/N` of keys are remapped — for N=10 nodes, adding the 11th moves only ~10% of keys.

**Virtual nodes (vnodes):** Each physical server occupies 100–200 positions on the ring. Benefits:
1. Even key distribution despite heterogeneous hardware
2. Fine-grained load balancing (assign more vnodes to more powerful servers)
3. Smoother node additions (keys spread across all existing nodes, not just direct ring neighbors)

**Real-world adoption:** Apache Cassandra, Amazon DynamoDB, Riak, and Memcached's `ketama` library all use consistent hashing with vnodes.

---

### 14.7 Cache Access Patterns

How the application reads and writes through the cache determines consistency, latency, and write complexity. There are five standard patterns.

#### Pattern 1: Cache-Aside (Lazy Loading)

The application manages the cache explicitly. The most common production pattern.

```
Read:   value = cache.get(key)
        if value == null:
            value = db.read(key)        # Cache miss: go to DB
            cache.put(key, value, ttl)  # Populate cache for future reads
        return value

Write:  db.write(key, newValue)
        cache.delete(key)               # Invalidate; next read re-populates
```

**Pros:** Cache only holds what is actually requested. Application retains full control. Cache failure does not affect writes.
**Cons:** First request for any key is always a cache miss (cold start). Risk of stale data if DB is updated without a corresponding cache invalidation.
**Best for:** Read-heavy workloads where not all data needs to be in cache (news articles, product catalogs).

#### Pattern 2: Read-Through

The cache sits in front of the database. On a miss, the **cache itself** — not the application — fetches from the DB and self-populates.

```
Application → Cache.get(key)
                      ↓ (miss)
              Cache → DB.read(key) → stores result → returns to Application
```

**Pros:** Application code is cleaner (no explicit cache population logic). Data in cache always mirrors what was read from DB.
**Cons:** First read is slow. Cache and DB are tightly coupled. Cache library must understand the DB schema.
**Best for:** ORM-layer caches; use cases where a caching middleware handles DB queries.

#### Pattern 3: Write-Through

Every write goes through the cache to the database synchronously before returning success.

```
Application → cache.put(key, value)
                      ↓ (synchronous)
              Cache → DB.write(key, value) → success → returns to Application
```

**Pros:** Cache is always consistent with the DB. No stale-data problem.
**Cons:** Write latency doubles (cache write + DB write in series). Cache may fill with data that is written but never read.
**Best for:** Financial balances, inventory levels — any entity where stale reads are unacceptable. Typically combined with cache-aside for reads.

#### Pattern 4: Write-Behind (Write-Back)

Writes land in the cache immediately; the database is updated **asynchronously** (batched or after a delay).

```
Application → cache.put(key, value) → returns immediately (~100 µs)

Background: Cache → DB.write(key, value)  [async, potentially batched]
```

**Pros:** Write latency equals only the cache write (~100 µs). Batching can significantly reduce DB write load.
**Cons:** Data can be lost if the cache node crashes before flushing. Cache and DB are temporarily inconsistent. Complex to implement correctly.
**Best for:** High-throughput write workloads where occasional data loss is tolerable (analytics counters, non-critical event logs).

#### Pattern 5: Write-Around

Writes bypass the cache and go directly to the DB. Reads use cache-aside.

```
Write:  DB.write(key, value)  [cache not involved]
Read:   cache.get(key) → miss → DB.read → cache.put (lazy)
```

**Pros:** Cache is not polluted with "write-once, read-never" data.
**Cons:** Read after write always misses cache until TTL-based lazy population.
**Best for:** Write-heavy data that is rarely re-read (audit logs, bulk imports, analytics writes).

#### Pattern Comparison

| Pattern | Read Latency | Write Latency | Consistency | Complexity | Best For |
|---|---|---|---|---|---|
| **Cache-Aside** ✅ | Fast (hit) / Slow (miss) | Fast (DB direct) | Eventual (TTL) | Low | Most use cases |
| **Read-Through** | Fast (hit) / Slow (miss) | Fast (DB direct) | Eventual | Medium | ORM-managed caches |
| **Write-Through** | Fast | 2× (cache + DB sync) | Strong | Medium | Financial, inventory |
| **Write-Behind** | Fast | Very fast (async) | Eventual | High | High write throughput |
| **Write-Around** | Slow (first read) | Fast | Eventual | Low | Write-once data |

**Most common production choice:** Cache-aside for reads + write-through for critical entities + TTL as a safety net.

---

### 14.8 Cache Invalidation Strategies

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

Cache invalidation is the hard problem: when data changes in the DB, how do you ensure the cache does not serve stale data indefinitely?

#### TTL-Based Expiry

Every cache entry has a time-to-live. After TTL, the entry expires; the next read is a cache miss and re-fetches from the DB.

**Pros:** Simple. No coordination between cache and DB required.
**Cons:** Data is stale for up to TTL seconds after every DB update. Shorter TTL = more DB load.

**TTL selection heuristics by entity type:**

| Entity | Recommended TTL | Rationale |
|---|---|---|
| Static content (product images, FAQ) | Hours to days | Rarely changes; high cache value |
| Product catalog / descriptions | 60–300 seconds | Infrequent changes; low staleness risk |
| Product price | 30–60 seconds | Price changes visible at checkout |
| Inventory count | 5–15 seconds | Overselling risk vs DB load trade-off |
| User account balance | 0 seconds | Financial integrity; bypass cache or write-through |
| Active user session | Session duration | Invalidate on logout |

**TTL Jitter:** To prevent a thundering herd when many keys expire simultaneously, add randomness: `ttl = base_ttl + random(0, base_ttl × 0.1)`. This spreads expiry events over time and avoids simultaneous mass misses.

#### Explicit Invalidation

When a write to the DB occurs, explicitly delete or update the corresponding cache entry.

```python
db.update("user:42:profile", new_data)
cache.delete("user:42:profile")  # Explicit invalidation
```

**Pros:** Near-instant consistency after writes.
**Cons:** Must be coordinated with the DB write. If the app crashes between DB write and `cache.delete`, the stale entry persists. Race condition: a read can repopulate stale data between the DB write and the delete.

**Best practice:** Delete from cache **after** the DB write succeeds (not before). On the next read, the cache miss triggers a fresh DB fetch. Use TTL as a safety net for any missed invalidations.

#### Event-Driven Invalidation via CDC + Kafka

Use **Change Data Capture (CDC)** to stream DB changes to a message queue. A dedicated cache-invalidation consumer reads change events and deletes or updates cache entries.

```
DB write → MySQL binlog → Debezium (CDC) → Kafka topic "db-changes"
                                                  ↓
                                    Cache Invalidation Consumer
                                          ↓
                                    cache.delete(key)
```

**Pros:** Decouples application code from cache management. Catches invalidations even if the application forgot to call `cache.delete`. Works across multiple services sharing the same cache.
**Cons:** Adds infrastructure (Debezium, Kafka). Lag between DB write and cache invalidation (~100 ms–1 s). Consumer must be idempotent.

**Real-world:** Netflix's Hollow library pushes DB state snapshots to in-memory caches across thousands of servers. Facebook's McSqueal reads MySQL binlogs and publishes invalidation messages to the Memcached tier.

---

### 14.9 High-Level Architecture

```
┌────────────────────────────────────────────┐
│              Application Tier              │
│   (stateless; all reads hit cache first)   │
└────────────────────┬───────────────────────┘
                     │
           Cache Client Library
     (consistent hash ring; ZooKeeper-aware)
                     │
    ┌────────────────┴────────────────────────────┐
    │                                             │
Shard 1 Primary              Shard 2 Primary  ...  Shard N Primary
  └─ Replica 1 (AZ-B)          └─ Replica 1 (AZ-B)
  └─ Replica 2 (AZ-C)          └─ Replica 2 (AZ-C)
    │
    ├── ZooKeeper / etcd
    │     (server list, leader election, health)
    │
    └── Database (source of truth; populated on cache miss)
```

**Request flow (cache-aside pattern):**
1. App calls `cache.get("user:42:profile")`.
2. Client library hashes the key → consistent ring position → routes to Shard 2 Primary.
3. **Hit:** Returns value. **Miss:** Falls through to DB, populates cache, returns value.

#### Node Discovery

How do clients know which nodes exist?

| Mechanism | Update Latency | Pros | Cons |
|---|---|---|---|
| **Static config file** | Requires client restart | Simple | Not suitable for dynamic clusters |
| **S3 config file** (polled) | 30–60 sec polling delay | No restart needed | Manual updates; stale between polls |
| **ZooKeeper / etcd** ✅ | Seconds (push via watch) | Real-time; no restart | Additional infrastructure dependency |
| **Consul / DNS SRV** | Seconds | Cloud-native; Kubernetes-friendly | DNS caching can cause stale records |

**ZooKeeper workflow:**
1. Each cache node registers itself as an ephemeral ZNode on startup (`/cache/nodes/cache-node-3`).
2. If the node crashes, its ZNode disappears automatically (ZooKeeper session expiry).
3. All clients watching `/cache/nodes/` receive a callback within seconds.
4. Client updates its consistent hash ring and reroutes traffic — **zero application restarts**.

#### Primary-Replica Replication

**Write path:** All writes go to the shard primary. Primary writes to memory and returns success. Replication to replicas is asynchronous.

**Read path:** Reads can be served from replicas (with potential lag) or from the primary (always fresh). Serving from replicas distributes hot-read load.

**Failover sequence (ZooKeeper-driven):**
1. Primary node stops heartbeating ZooKeeper.
2. ZooKeeper ephemeral node disappears.
3. Watch callback notifies all clients.
4. Replica with the lowest replication lag is elected as the new primary.
5. All clients update routing; writes resume to the new primary.
6. **Total failover time: 5–30 seconds.** During this window, the DB absorbs the miss spike.

**Cross-AZ placement:** Primary in AZ-A, Replica-1 in AZ-B, Replica-2 in AZ-C. A full AZ outage does not take down the shard.

---

### 14.10 Failure Modes and Mitigations

#### Cache Stampede (Thundering Herd)

**Scenario:** A hot key's TTL expires. 10,000 simultaneous requests all miss the cache and fire DB queries at the same instant. The database is overwhelmed.

**Mitigation 1 — Mutex lock on first miss:**
```python
lock = redis.set("lock:user:42", "1", nx=True, ex=5)  # NX = only if not exists
if lock:
    value = db.read("user:42")
    cache.set("user:42", value, ttl=300)
    redis.delete("lock:user:42")
else:
    time.sleep(0.05)   # brief wait
    value = cache.get("user:42")  # retry
```
Only one request fetches from DB; all others wait briefly and then hit the warm cache.

**Mitigation 2 — Probabilistic early expiry (PER):**
```python
current_ttl = cache.ttl(key)
max_ttl = 300
if current_ttl < random.uniform(0, max_ttl * 0.1):
    value = db.read(key)   # Refresh slightly before expiry
    cache.set(key, value, ttl=max_ttl)
```
Clients occasionally re-fetch *before* TTL expires, preventing simultaneous expiry across many cache instances.

**Mitigation 3 — Stale-while-revalidate:** Return the stale entry immediately; trigger an async background refresh. The user sees slightly stale data for one request but never waits.

**Mitigation 4 — TTL Jitter:** Spread expiry times as described in Section 14.7 to prevent mass simultaneous expiry.

#### Hot Key Problem

**Scenario:** Key `"super-bowl-ad-2026:product:99"` receives 500,000 QPS after a viral event. All 500 K requests route to the same shard, overwhelming it.

**Mitigation 1 — Key replication (read fan-out):** Write the same value to multiple shards with a suffix:
```
Write:  for i in range(10): cache.set(f"product:99:shard:{i}", value, ttl=300)
Read:   shard = random.randint(0, 9)
        cache.get(f"product:99:shard:{shard}")
```
500 K QPS is now spread across 10 nodes.

**Mitigation 2 — L1 in-process cache:** A local Caffeine/lru-cache inside the application handles the hottest keys at < 100 ns. Redis QPS for that key drops by 90%.

**Mitigation 3 — Request coalescing:** The API gateway batches repeated requests for the same key within a short window (5–10 ms) and fires a single upstream request.

**Detection:** Redis 4.0+ `redis-cli --hotkeys` command; set `maxmemory-policy allkeys-lfu` to track per-key access frequency via `OBJECT FREQ key`.

#### Cold Start and Cache Warming

**Scenario:** A new cache cluster is deployed (or new shards added). The cache is empty. 100% of traffic misses and hits the database. The database is overwhelmed.

**Mitigation 1 — Cache warming script:** Before routing live traffic, replay the last N hours of read queries against the DB and populate the cache. Warming even 50% of hot keys dramatically reduces the miss spike.

**Mitigation 2 — Gradual traffic shift:** Route 5% → 10% → 25% → 50% → 100% of traffic to the new cluster, allowing the cache to warm incrementally under real traffic patterns.

**Mitigation 3 — Snapshot restore:** For Redis, restore a recent RDB snapshot to pre-populate the new cluster with existing data. The fastest approach for large datasets.

**Mitigation 4 — Shadow traffic:** Route a copy of live traffic to the new cluster (without returning responses to users) for 15–30 minutes before full cutover.

#### Network Partition Between Cache and DB

**Scenario:** Cache nodes cannot reach the DB. Cache misses cannot be served. The service is degraded.

**Circuit breaker:** If the DB is unreachable, stop attempting DB queries. Return stale cache data with a `X-Cache-Stale: true` response header, or return a gracefully degraded response. This prevents connection exhaustion and cascading failure.

**Extended TTL on failure:** When the DB is detected as down, automatically extend all cache entry TTLs by N minutes to buy time during recovery.

#### Node Failure Summary

| Failure | Impact | Mitigation |
|---|---|---|
| Replica node crashes | No immediate impact; primary handles all reads | ZooKeeper removes node; keys reroute to primary |
| Primary node crashes | Shard unavailable 5–30 sec during failover | ZooKeeper promotes replica; DB absorbs miss spike |
| Consistent hash ring corrupted | Keys routed to wrong server; false misses | Persist ring state in ZooKeeper; validate on every client startup |
| Memory pressure → excessive evictions | Rising miss rate | Monitor eviction rate; alert at 1%/min; add nodes |
| Network partition (cache ↔ DB) | Miss fallback to DB fails | Circuit breaker; serve stale; alert on-call |
| All replicas in same AZ | AZ failure kills shard | Enforce cross-AZ replica placement by policy |

---

### 14.11 Multi-Tier Caching (L1 + L2 + L3)

Production systems use multiple cache tiers to balance latency, consistency, and cost.

```
Request → L1 (In-Process, ~100 ns) → L2 (Redis Cluster, ~500 µs) → L3 (Database, ~5 ms)
```

| Tier | Technology | Latency | Capacity | Scope | Trade-off |
|---|---|---|---|---|---|
| **L1** | Caffeine, Guava, lru-cache (in-process) | ~100 ns | Small (10–500 MB per instance) | Per service instance only; not shared | Inconsistent across instances |
| **L2** | Redis Cluster / Memcached | ~500 µs–1 ms | Large (10 GB–10 TB cluster total) | Shared across all service instances | Network hop; shared memory |
| **L3** | PostgreSQL / MySQL / DynamoDB | ~1–10 ms | Unlimited (disk-backed) | Single source of truth | Slowest; can become bottleneck |

**How tiers interact:**
1. L1 miss → check L2. L2 hit → populate L1, return value.
2. L2 miss → check L3. L3 hit → populate L2 and L1, return value.
3. On write → invalidate/update L2 (authoritative shared state). Let L1 expire via TTL.

**L1 invalidation problem:** If instance A updates a key in L2, instance B's L1 still holds the old value until its local TTL expires. Solutions:
- **Short L1 TTL** (5–10 seconds): Acceptable staleness for most read-heavy use cases.
- **Redis pub/sub invalidation:** When L2 is updated, publish an invalidation message. All instances subscribed to that channel delete the key from their L1 cache immediately.
- **Redis 6+ client-side caching:** Redis natively tracks which keys a client has cached and pushes invalidation messages automatically without application-level pub/sub.

**Real-world example — Netflix:**
- L1: JVM heap cache (Hollow + ConcurrentHashMap) per microservice instance
- L2: EVCache (Memcached cluster) per region, ~30 M ops/sec
- L3: Cassandra / MySQL

---

### 14.12 Redis vs. Memcached

Both are production-proven distributed caches. The right choice depends on your requirements.

| Feature | Redis | Memcached |
|---|---|---|
| **Data structures** | Strings, Hashes, Lists, Sets, Sorted Sets, Streams, Geospatial, HyperLogLog | Strings only |
| **Persistence** | RDB snapshots + AOF append log (optional) | None (pure in-memory) |
| **Replication** | Built-in primary-replica replication | Client-side sharding only |
| **Clustering** | Redis Cluster (hash slots; built-in auto-sharding) | Client-side sharding only |
| **Scripting** | Lua scripting for atomic multi-step operations | None |
| **Pub/Sub** | Built-in (used for L1 invalidation) | None |
| **Transactions** | `MULTI`/`EXEC` (optimistic) | None |
| **Memory efficiency** | Higher overhead per key (~100 bytes overhead) | More memory-efficient for pure string data |
| **Throughput** | ~100 K–1 M QPS per node | ~1 M+ QPS per node (simpler operation set) |
| **Threading model** | Single-threaded event loop (I/O multi-threaded since Redis 6+) | Fully multi-threaded |

**Choose Redis when:**
- You need data structures beyond strings (leaderboards → Sorted Sets; rate limiting → atomic counters + Lua; session stores → Hashes)
- You want optional persistence (RDB snapshots for crash recovery)
- You need pub/sub for L1 cache invalidation across service instances
- You are already using Redis for rate limiting, queues, or Streams — reduce operational surface area

**Choose Memcached when:**
- Pure key-value caching workload with only string values
- Maximum per-node throughput is the top priority
- Multi-threading matters for CPU-bound workloads
- Operational simplicity is preferred

**Facebook's approach:** Operates both — Memcached for the primary cache tier (pure KV, multi-threaded, highest throughput) and Redis for features requiring richer data structures or persistence.

---

### 14.13 Data Model

**CacheEntry**

| Field | Type | Notes |
|---|---|---|
| `key` | `VARCHAR(512)` PK | Namespaced key (e.g., `user:42:profile`) |
| `value` | `BLOB` | Serialized value |
| `size_bytes` | `INT` | Memory footprint for eviction accounting |
| `shard_id` | `INT` | Which shard owns this key |
| `created_at` | `TIMESTAMP` | |
| `expires_at` | `TIMESTAMP` | NULL = no expiry; derived from TTL on write |
| `last_accessed_at` | `TIMESTAMP` | Updated on each read; used by LRU eviction |
| `access_count` | `BIGINT` | Incremented on each read; used by LFU eviction |

**CacheNode**

| Field | Type | Notes |
|---|---|---|
| `node_id` | `VARCHAR(64)` PK | Unique server ID (e.g., `cache-node-3`) |
| `host` | `VARCHAR(256)` | IP or hostname |
| `port` | `INT` | Listen port |
| `region` | `VARCHAR(32)` | Availability zone or datacenter |
| `role` | `VARCHAR(16)` | primary / replica |
| `status` | `VARCHAR(16)` | healthy / degraded / offline |
| `joined_at` | `TIMESTAMP` | When the node joined the ring |
| `memory_bytes_total` | `BIGINT` | Total allocatable memory |
| `memory_bytes_used` | `BIGINT` | Current usage; updated by heartbeat |

**CacheCluster**

| Field | Type | Notes |
|---|---|---|
| `cluster_id` | `VARCHAR(64)` PK | |
| `vnodes_per_node` | `INT` | Virtual ring positions per physical node |
| `replication_factor` | `INT` | Copies of each shard across nodes |
| `eviction_policy` | `VARCHAR(16)` | LRU / LFU / TTL |
| `created_at` | `TIMESTAMP` | |

**Entity Relationships:**

```
CacheCluster ────────< CacheNode >──────── CacheEntry
                           ^
                           │
                   Consistent Hash Ring
              (maps key → owning shard/node)
```

- One **CacheCluster** contains many **CacheNode** rows.
- One **CacheNode** (primary) owns many **CacheEntry** rows in its assigned shard.
- The **Consistent Hash Ring** is an in-memory routing structure maintained by each client from the live node list in ZooKeeper — not a database table.

---

### 14.14 Key Design Decisions and Trade-Offs

| Decision | Option A | Option B | Chosen & Why |
|---|---|---|---|
| **Key routing** | Mod-based `hash(key) % N` | Consistent hashing with vnodes | **Consistent hashing** — node change remaps only 1/N keys; mod-based remaps ~all keys |
| **Cache placement** | Co-located (same host as app) | Remote dedicated cluster | **Remote** — failure isolation, independent scaling, shared across all service instances |
| **Eviction policy** | LRU (recency) | LFU (frequency) | **LRU default**; LFU for stable hot-sets where recency misleads |
| **Consistency model** | Strong (read-your-writes) | Eventual (stale reads OK) | **Eventual** — strong consistency requires synchronous replication, doubling write latency for minimal practical benefit |
| **Write strategy** | Write-through (cache + DB synchronous) | Write-behind (cache first, DB async) | **Write-through** for correctness; write-behind only for workloads that can tolerate potential data loss |
| **Node discovery** | Static config file | ZooKeeper / etcd | **ZooKeeper** — real-time propagation; no client restarts on topology changes |
| **Cache technology** | Redis (rich features) | Memcached (raw throughput) | **Redis default**; Memcached only when multi-threaded throughput is the overriding priority |
| **Persistence** | RDB snapshots enabled | No persistence | **Optional** — enable for crash recovery; disable for pure cache where cold start is acceptable |

---

### 14.15 Operational Considerations

#### Key Metrics to Monitor

| Metric | Healthy | Alert | Why It Matters |
|---|---|---|---|
| **Cache hit rate** | > 95% | < 90% | Below 90% = cache undersized, wrong TTLs, or access-pattern shift; DB absorbs excessive load |
| **Eviction rate** | ~0 | > 1%/min | Rapid evictions signal memory pressure; hit rate begins to fall |
| **Memory usage** | < 70% | > 80% | Alert early enough to add capacity before eviction rate spikes |
| **Replication lag** | < 100 ms | > 500 ms | High lag means failover will lose recent writes |
| **Connection count** | < 5,000 | > 8,000 | Redis default max = 10,000; near-limit causes connection refusals |
| **Command latency (p99)** | < 1 ms | > 5 ms | Latency spikes usually indicate large keys, blocking `KEYS *` commands, or CPU saturation |

**Critical anti-pattern:** Running `KEYS *` in production. Redis is largely single-threaded; `KEYS *` blocks all other commands while scanning every key. Use `SCAN` with a cursor for non-blocking iteration.

#### Operational Procedures

**Cache warming (new cluster launch):**
1. Restore from the most recent RDB snapshot (fastest for large datasets).
2. Run a warming script: iterate top 10 K hot keys from DB; pre-populate.
3. Shift 5% of traffic; monitor hit rate.
4. Increase gradually: 10% → 25% → 50% → 100% over 30 minutes.

**TTL tuning:**
- Review TTL values quarterly against hit rate metrics.
- Too short → hit rate drops, DB load rises. Too long → stale data accumulates.
- Use entity-specific TTLs (profile: 5 min, product: 1 min, pricing: 30 sec).

**Large key detection:**
- Run `redis-cli --bigkeys` during off-peak hours.
- Keys > 1 MB spike eviction latency and congest the network. Split large values into multiple smaller keys.

**Backup and restore:**
- Enable ElastiCache automated daily snapshots; retain 7 days.
- Test restore quarterly: spin up a new cluster from snapshot, verify key count and sample values.
- Document RTO: "restore from snapshot takes ~15 minutes for a 100 GB cluster."

**Graceful node drain before removal:**
1. Mark the node as "draining" in ZooKeeper (stop routing new writes to it).
2. Wait for TTLs to expire existing keys naturally.
3. Remove from the consistent hash ring only after key count drops near zero.
4. Prevents the abrupt miss spike of a sudden ring removal.

---

### 14.16 Cost Estimation

| Configuration | Spec | Monthly Cost (AWS ElastiCache) |
|---|---|---|
| Single Redis primary (r6g.large) | 13 GB RAM, no HA | ~$120 |
| Redis primary + 1 replica (r6g.large × 2) | 13 GB, HA | ~$240 |
| Redis Cluster, 3 shards × 2 nodes (r6g.large) | 78 GB total | ~$720 |
| Redis Cluster, 6 shards × 2 nodes (r6g.2xlarge) | 624 GB total | ~$5,800 |
| Self-managed Redis (6 × r5.2xlarge + EBS + ops) | ~624 GB | ~$4,200 + engineering overhead |

**Cost justification:**
- A 78 GB Redis cluster at $720/month absorbs load that would otherwise require an RDS read replica at ~$700/month — roughly cost-neutral, but with 10–100× lower latency.
- At Facebook scale, without caching, 100× more DB servers would cost hundreds of millions of dollars.

**Cost optimization levers:**
- `volatile-lru` eviction: let Redis self-manage memory; avoid over-provisioning.
- **Reserved instances:** ~40% cost reduction on 1-year commitments.
- **Graviton (r6g) instances:** ~20% better price/performance vs x86 (r5/r6i).

---

### 14.17 Three-Year Evolution Roadmap

| Milestone | What Changes | Why |
|---|---|---|
| **Year 1: Single cluster, single region** | One Redis primary + 1 replica; manual cache invalidation on writes; LRU eviction; shared by all services | Simple; right-sized for early product; proves cache value with minimal operational burden |
| **Year 2: Cluster mode + automation** | Redis Cluster with consistent hashing + vnodes; ZooKeeper-based node discovery; write-through for critical entities; service-specific key namespaces to prevent collisions | Single-node becomes a bottleneck; automation reduces operational toil |
| **Year 3: Multi-tier + event-driven invalidation** | L1 = in-process Caffeine per service instance; L2 = Redis Cluster; L3 = DB; CDC + Kafka-driven invalidation replaces lazy TTL for critical entities; cross-region active-active replication | Sub-millisecond reads; precise invalidation; global scale |
| **Year 4+: Specialized tiers** | Separate hot-key tier; write-behind for high-throughput counters; Redis Streams for real-time leaderboards; edge caching (CDN + regional PoPs) | Workload-specific optimization; global latency reduction |

---

### 14.18 Interview Questions and Answers

**Q1: When should you use a local in-process cache vs. a remote shared cache vs. both?**

**Answer:**

Use a **local (in-process) cache** (Caffeine, Guava Cache, lru-cache) when:
- Sub-millisecond latency is required — no network hop can be tolerated.
- Data is read-heavy and changes rarely: feature flags, config values, static lookup tables.
- Staleness of 5–30 seconds per instance is acceptable.
- Cache entries can be independently stale across different service instances without causing correctness problems.

Use a **remote (shared) cache** (Redis, Memcached) when:
- Multiple service instances need a consistent view of the same data: user sessions, profiles, rate-limit counters.
- Cache size exceeds the JVM heap budget (typically > a few hundred MB).
- Cache must survive application server restarts.
- Cache invalidation needs to be centrally coordinated.

Use **both (multi-tier L1 + L2)** when:
- A small hot set (top 1,000 keys driving 80% of traffic) benefits from L1 near-zero latency; the long tail is served from L2.
- You accept the L1 invalidation complexity trade-off (short TTL or Redis pub/sub invalidation).

**Key trade-off:** Local cache is faster but creates per-instance inconsistency. Remote cache is consistent but adds network latency. Multi-tier gives you both at the cost of invalidation complexity.

---

**Q2: How much stale data is acceptable in exchange for protecting the database during cache misses or failovers?**

**Answer:**

This is a **product and business decision**, not purely technical. The acceptable staleness window depends on the cost of a user seeing outdated data.

**By data type:**
- Static content (images, FAQ): hours to days — CDN + long TTL is correct.
- Product catalog / descriptions: 60–300 seconds — infrequent changes; 5-minute stale names rarely harm users.
- Product pricing: 30–60 seconds — visible price discrepancy at checkout is a business risk.
- Inventory count: 5–15 seconds — overselling risk must be weighed against DB load.
- User account balance / payment data: 0 seconds — financial integrity is non-negotiable; bypass cache or use synchronous write-through.

**During failovers:** Serve intentionally stale data rather than return errors. Configure `replica-serve-stale-data yes` in Redis so replicas answer reads even when out-of-sync with the primary. A slightly stale product page is better than a 500 error. Use `X-Cache-Stale: true` response headers so clients and observability tools can detect this condition.

**Circuit breaker pattern:** If the DB fallback itself is failing, serve stale cache data with a degraded-state flag rather than erroring. Keep the user-facing experience degraded but functional; alert on-call immediately.

---

**Q3: When does a distributed cache deserve its own discovery, failover, and replication control plane instead of a managed service?**

**Answer:**

**Use a managed service** (AWS ElastiCache, Google Memorystore, Upstash, Momento) when:
- You are at small to medium scale (< 100 M requests/day).
- Your team does not have dedicated infrastructure / SRE resources.
- You want automatic failover, patching, backups, and monitoring out of the box.
- Your security and compliance requirements are met by the managed service's certifications (SOC 2, PCI, HIPAA).
- Time-to-market and operational simplicity outweigh cost savings from self-management.

**Build your own control plane** when:
1. **Hyperscaler scale:** You are at Facebook / Twitter / Netflix scale — billions of requests per second where managed-service cluster-size limits or network topology constraints do not fit your needs.
2. **Custom semantics:** You need custom eviction policies, non-standard data structures, or cache-specific routing logic that managed services do not support (LinkedIn's Cleo, Twitter's Twemcache, Meta's Memcache with lease-based invalidation).
3. **Multi-region active-active with custom conflict resolution:** Managed services typically offer only single-region or active-passive replication.
4. **Cost at very large scale:** At 1,000+ nodes, self-managed can be 40–60% cheaper than managed, justifying the engineering investment.
5. **Data sovereignty / air-gap requirements:** Government, defense, or certain financial regulatory environments prohibit cloud managed services.

**Decision heuristic:** If a managed service covers 90% of your requirements and the remaining 10% can be worked around, use managed. A self-managed cache control plane requires 3–5 dedicated engineers to maintain safely — that cost is rarely justified below significant scale.

---

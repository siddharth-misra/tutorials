# 13: ElastiCache

Caching helps applications respond faster and reduces pressure on slower backend systems such as databases. Amazon ElastiCache provides in-memory data stores that applications can use to keep frequently accessed data close and fast.

This chapter explains why caching is powerful but also easy to misuse. You will learn how ElastiCache fits into application architecture, what kinds of data are good candidates for caching, and why expiration, consistency, and failure handling matter in production.

---

## 13.1 Why Caching Matters

As applications grow, the database is often asked to do too much.

Repeated reads for the same data can create:

- unnecessary latency
- avoidable database load
- higher cost in the primary data tier
- reduced headroom for truly important queries

Caching addresses this by keeping frequently needed data in a faster, temporary layer closer to the application.

Amazon ElastiCache is AWS's managed in-memory caching service for this pattern.

Caching matters because it can improve user experience and scalability dramatically, but it also introduces a second data layer with its own correctness and operational questions. That means architects need to understand not only why cache improves speed, but also when cache can make behavior more complex.

---

## 13.2 What a Cache Is and What It Is Not

A cache is usually a temporary store of data that can be recomputed or reloaded from a system of record.

That system of record is often a relational database, DynamoDB table, or another persistent backend.

This distinction is critical:

- the cache speeds access
- the system of record preserves truth

If the application cannot tolerate losing the cached data, then the workload may be using cache as if it were the primary database, which is usually a design smell.

Caching works best when the application can rebuild or repopulate the cached data safely. That is why cache strategy is tightly linked to application behavior and data freshness expectations.

---

## 13.3 ElastiCache and Common Use Cases

ElastiCache is used for in-memory data patterns such as:

- caching frequently read query results
- storing session data
- maintaining short-lived counters or rate-limit state
- improving response time for expensive computations or repeated lookups

These use cases share a common theme: the application benefits from very fast access to recently or frequently used data.

ElastiCache is helpful when the data is accessed far more often than it changes, or when the original computation or database read is expensive enough that repeated retrieval is wasteful.

---

## 13.4 Read Caching and Cache-Aside Thinking

![Cache-aside read flow showing request path from application to cache, fallback to database on miss, and TTL-based cache population.](images/ch13-elasticache-cache-aside-flow.svg)

One of the most common patterns is cache-aside.

In this model:

1. the application checks the cache first
2. if the item is present, it returns quickly
3. if the item is missing, the application reads from the system of record
4. the application then places the result in the cache for later reads

This works well because it keeps the database as the source of truth while still reducing repeated load.

But it also means you must think about:

- how long cached data stays valid
- what happens on cache miss storms
- whether a deployment or expiration event can suddenly drive heavy traffic back to the database

Good cache design includes database protection thinking, not just fast-path thinking.

---

## 13.5 Write Patterns, Invalidation, and Freshness Trade-Offs

Caching becomes harder when data changes.

If the application updates the system of record, it also has to decide what to do with the cached value.

Common strategies include:

- invalidate the cache entry after a write
- update the cache immediately with the new value
- rely on short time-to-live settings for acceptable staleness windows

There is no universal best option. The right choice depends on:

- how stale data can be before it harms the business
- how frequently the underlying data changes
- how expensive it is to reload the value

Architects should always ask what user-visible error is worse: slightly stale data or much slower responses under load. Many cache decisions are trade-offs between those two failure modes.

---

## 13.6 Eviction, Time to Live, and Memory Pressure

Cache capacity is finite.

That means data does not stay in memory forever. ElastiCache design needs explicit thinking about:

- time to live, or TTL, values
- which data deserves to stay cached longer
- what happens when memory pressure causes eviction
- whether the application can tolerate frequent misses during churn

If the TTL is too short, the cache may provide little benefit. If it is too long, stale data may linger or memory may be spent on low-value items.

This is one of the main reasons cache design is application-specific. The value of a cached object depends on frequency, freshness, and reload cost.

---

## 13.7 High Availability, Failure Behavior, and Operational Risk

Caches fail too.

When they do, the application should degrade safely.

Important questions include:

- Can the application continue if the cache is unavailable?
- Will the database survive a sudden return of read traffic?
- Does the application treat cache timeouts as a hard failure or a soft fallback condition?
- What monitoring detects elevated miss rates, latency, or connection failures?

Architecturally, the safest mindset is that cache improves performance but should not become a single point of failure for correctness.

If a cache outage takes down the whole application, the system has likely coupled the cache too tightly to the critical path.

---

## 13.8 Security and Access Boundaries

Caches often hold sensitive or semisensitive data, even if only temporarily.

That means you still need to review:

- which application components can connect
- network placement and security groups
- whether credentials or secrets are managed safely
- whether the cached data itself should be minimized or redacted

The fact that cache contents are short-lived does not make them harmless. A cached session token or customer profile fragment can still be sensitive.

Strong caching practice includes deciding what should never be cached at all.

---

## 13.9 Architect Decision Patterns for Caching

When reviewing a design that introduces ElastiCache, ask:

- What specific read or computation bottleneck is the cache solving?
- What is the system of record if the cache is empty?
- How fresh must the data be?
- How are writes and invalidations handled?
- What happens if the cache fails or is cold after deployment?
- Does the cost and operational complexity of cache justify the benefit?

These questions prevent teams from adding cache because it sounds advanced rather than because it solves a clear problem.

The best caching layers are narrowly justified and carefully bounded.

---

## 13.10 Common Mistakes

- adding cache before identifying the real bottleneck
- treating cache as the system of record instead of a performance layer
- ignoring invalidation strategy and then serving stale data unpredictably
- choosing TTL values without understanding update frequency or read patterns
- failing to protect the database from miss storms during cache cold starts or outages
- storing sensitive data in cache without reviewing whether it should be cached at all
- coupling the application so tightly to the cache that cache failure becomes application failure
- assuming caching always reduces cost without considering operational complexity and extra infrastructure

---

## 13.11 Hands-On Tasks

1. Identify one read-heavy path in an application and explain why it is a good or bad candidate for caching.
2. Describe a cache-aside flow for a product-details API or a user-profile API.
3. Choose whether the cached value should be invalidated on write or left to expire, and explain the trade-off.
4. Define what should happen if the cache is unavailable during peak traffic.
5. List two data types that should probably not be cached without careful review.

---

## 13.12 Recap

ElastiCache helps applications reduce latency and offload databases by storing frequently used data in memory, but it adds a second data-access layer that must be designed carefully. Strong caching architecture defines the system of record clearly, chooses appropriate TTL and invalidation behavior, and ensures the application can degrade safely when the cache is cold or unavailable. Cache is a performance tool, not a substitute for sound data design.

Next: 14: Lambda

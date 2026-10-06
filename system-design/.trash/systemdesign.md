# System Design

---

## Table of Contents

1. [Quick Reference Cheat Sheet](#quick-reference-cheat-sheet)
2. [Chapter 1: System Design Interview Framework](#chapter-1-system-design-interview-framework)
3. [Chapter 2: Fundamentals of System Design](#chapter-2-fundamentals-of-system-design)
4. [Chapter 3: Networking & Internet Fundamentals](#chapter-3-networking-and-internet-fundamentals)
5. [Chapter 4: Microservice Architecture](#chapter-4-microservice-architecture)
6. [Chapter 5: Availability, CAP Theorem & Reliability Patterns](#chapter-5-availability-cap-theorem-and-reliability-patterns)
7. [Chapter 6: Database Internals](#chapter-6-database-internals)
8. [Chapter 7: Rate Limiting](#chapter-7-rate-limiting)
9. [Chapter 8: Distributed Consensus](#chapter-8-distributed-consensus)
10. [Chapter 9: Distributed Systems](#chapter-9-distributed-systems)
11. [Chapter 10: Security Design](#chapter-10-security-design)
12. [Chapter 11: Caching Strategies](#chapter-11-caching-strategies)
13. [Chapter 12: Event-Driven Messaging Systems](#chapter-12-event-driven-messaging-systems)
14. [Chapter 13: Consistent Hashing](#chapter-13-consistent-hashing)
15. [Chapter 14: Designing a Distributed Cache](#chapter-14-designing-a-distributed-cache)
16. [Chapter 15: Designing an Auto-Complete Engine](#chapter-15-designing-an-auto-complete-engine)
17. [Chapter 16: Designing a Scalable Notification Service](#chapter-16-designing-a-scalable-notification-service)
18. [Chapter 17: Designing a Real-Time Push Platform](#chapter-17-designing-a-real-time-push-platform)
19. [Chapter 18: Counting at Scale — Top-K Trending Items](#chapter-18-counting-at-scale-top-k-trending-items)
20. [Chapter 19: URL Shortener & Pastebin](#chapter-19-url-shortener-and-pastebin)
21. [Chapter 20: Search Engine Design](#chapter-20-search-engine-design)
22. [Glossary](#glossary)

---

**How to read this document**

Every major topic answers five questions, clearly marked:
- **Why this architecture?** — The reasoning behind the design decision.
- **What can fail?** — Concrete failure modes and mitigations.
- **How much will it cost?** — Back-of-envelope cost estimates with real pricing.
- **How will teams maintain it?** — Day-2 operations: deployment, monitoring, debugging.
- **How does it evolve in 3 years?** — Where this design goes as the product matures.
- **How does it actually work?** — The deeper mechanics that make the design correct, fast, and maintainable.

**Study flow**

This document is ordered for prep:
- Chapter 1 for the interview framework
- Chapter 2 for foundations of system design
- Chapter 3 for networking fundamentals
- Chapters 4 and 5 for microservice principles and availability
- Chapters 6 to 12 for core distributed-system primitives
- Chapters 13 and 14 for hashing and distributed cache mechanics
- Chapters 15 to 20 for applied system-design problems

**Concepts that should appear explicitly somewhere in your notes**
- `SLI / SLO / SLA`
- `RTO / RPO`
- Schema evolution and backward compatibility
- Idempotency, retries, and deduplication
- Backpressure and load shedding
- Quorum reads/writes
- Multi-region active-active vs active-passive
- Data retention, replay, and restoration drills

---

## Quick Reference Cheat Sheet

**Note:** Use this card during review. All numbers are rough order-of-magnitude estimates for interviews.

### Key Latency Numbers

| Operation | Latency |
|---|---|
| L1 cache reference | ~0.5 ns |
| L2 cache reference | ~7 ns |
| Main memory (RAM) access | ~100 ns |
| Redis / in-process cache get | ~100 µs–1 ms |
| SSD random read | ~100 µs |
| Network round-trip (same datacenter) | ~500 µs |
| Network round-trip (same region, cross-AZ) | ~1–2 ms |
| DB query (indexed, warm cache) | ~1–5 ms |
| HDD seek | ~10 ms |
| Network round-trip (US ↔ Europe) | ~80–100 ms |
| Network round-trip (US ↔ Asia) | ~150–200 ms |

**Rule:** One cross-region synchronous hop costs ~100 ms. Three hops = 300 ms — unacceptable for a checkout flow.

### Availability "Nines"

| SLA | Annual downtime | Use for |
|---|---|---|
| 99% | ~3.65 days | Internal tooling |
| 99.9% | ~8.7 hours | Most B2B SaaS |
| 99.99% | ~52 minutes | Payment APIs, S3 |
| 99.999% | ~5 minutes | Telecom, exchanges |

**Formula:** `Availability = MTTF / (MTTF + MTTR)`

This means **availability is the fraction of total time the system is up**: **MTTF** (Mean Time To Failure, the average healthy runtime before the next outage) divided by **MTTF + MTTR**, where **MTTR** (Mean Time To Recovery, the average time to restore service after an outage) is the downtime portion. Higher MTTF and lower MTTR increase availability.

### Back-of-Envelope Rules of Thumb

| Thing to estimate | Rule |
|---|---|
| Bytes per character | 1 byte (ASCII), up to 4 bytes (UTF-8) |
| 1 million seconds | ~11.5 days |
| 1 billion requests/day | ~11,600 RPS |
| Average tweet size | ~280 bytes text + metadata ≈ ~1 KB |
| Average photo (compressed) | ~300 KB |
| Average HD video minute | ~10 MB |
| 1 TB disk | ~10⁶ MB, ~10⁹ KB |
| QPS from a single server | ~1K–10K simple reads; ~100–1K writes |
| Read replica headroom | Each replica adds ~1K–5K read QPS |

### Common Capacity Estimation Steps

1. Daily active users × actions per day = daily events.
2. Daily events / 86,400 = average RPS; multiply by 5–10× for peak.
3. Average payload size × RPS = bandwidth.
4. Storage = payload × events/day × retention days.
5. Shards = total storage / per-node capacity.
6. Sanity-check latency: sum up each hop.

### Multi-Region: Active-Active vs Active-Passive

| Model | What it means | Trade-offs |
|---|---|---|
| **Active-Passive** | One region serves all traffic; the second is on standby. Failover is triggered manually or automatically on primary failure. | Simpler to reason about. Failover takes time (RTO minutes–hours). The passive region is mostly idle cost. Write consistency is easier — one region owns writes. |
| **Active-Active** | Both regions simultaneously serve traffic and accept writes. Traffic is routed by geography (nearest region). | Near-zero RTO for regional failure. Lower latency for global users. Requires conflict resolution for concurrent writes to the same record. Much harder to make strongly consistent. |

**When to choose each:**
- Active-Passive: financial systems, single-tenant SaaS, teams without multi-region ops experience.
- Active-Active: global consumer apps (social, e-commerce), where per-region latency matters and eventual consistency is tolerable (DynamoDB Global Tables, Cassandra multi-DC writes, CockroachDB).

**Key concepts that appear with multi-region:**
- **RTO (Recovery Time Objective):** how quickly service must be restored. Active-Active targets seconds; Active-Passive typically targets minutes.
- **RPO (Recovery Point Objective):** how much data loss is acceptable. Synchronous replication gives RPO ≈ 0; asynchronous replication accepts RPO of seconds to minutes.
- **Write conflict resolution:** last-write-wins (LWW), vector clocks, CRDTs, or application-level merge logic.
- **Quorum writes across regions:** strong consistency is possible but adds cross-region latency (~100 ms) to every write.

### Chapter-by-Chapter Revision Grid

Use this as the fastest pass before an interview: one or two ideas per chapter, plus the mistake most people make.

### Interview, Networking, and Foundations

| Chapter | Quick revision points | Common trap |
|---|---|---|
| **1. Interview framework** | Use the loop: **requirements -> scale -> API -> high-level design -> bottlenecks -> trade-offs**. Speak at **product, mechanism, and operations** layers. | Jumping into boxes without clarifying scope, API shape, or failure modes. |
| **2. Fundamentals** | Name the dominant force first: **latency, throughput, availability, consistency, durability, or operability**. Every architecture choice optimizes one axis by spending another. | Treating a design as universally correct instead of stating which trade-off it buys. |
| **3. Networking** | Trace the full request path: **DNS -> TCP/TLS -> CDN/gateway -> load balancer/proxy -> app -> data store**. Latency is additive, and most user-visible slowness comes from too many hops. | Treating "the backend" as one black box and ignoring edge, TLS, and routing costs. |
| **4. Microservices** | Split services by **business capability, data ownership, change cadence, scaling profile, and transaction boundary**. Prefer a **modular monolith** until boundaries are real. | Prematurely splitting into chatty services with shared databases. |

### Reliability, Data, and Coordination

| Chapter | Quick revision points | Common trap |
|---|---|---|
| **5. Availability & CAP** | During partitions, choose **CP** or **AP** per operation, not once for the whole product. Availability improves with **higher MTTF** and **lower MTTR**. | Saying "we want both consistency and availability" without describing partition behavior. |
| **6. Database internals** | **B-tree** favors reads/range scans; **LSM** favors writes. **WAL before data pages** gives durability; **MVCC** gives snapshot reads but needs cleanup. | Adding indexes freely and forgetting they increase write amplification and storage. |
| **7. Rate limiting** | **Token bucket** allows bursts, **leaky bucket** smooths traffic, **sliding window** is stricter. Define **who** is limited, **where** enforcement happens, and **fail-open vs fail-closed**. | Implementing one global "req/min" rule without tying it to a resource or abuse case. |
| **8. Distributed consensus** | Consensus clusters stay small: usually **3 or 5 nodes**. In Raft: **leader appends, majority commits, followers replicate, snapshots bound replay time**. | Using consensus for workloads that only need simple primary-replica failover. |
| **9. Distributed systems** | Know **primary-replica vs leaderless**, **sync vs async replication**, **quorum rules**, **fencing tokens**, **delivery semantics**, and **sagas**. Prefer **idempotency + compensation** over distributed 2PC in many microservice flows. | Using distributed locks or leases without fencing tokens, then getting stale-writer corruption. |

### Security, Caching, Messaging, and Routing

| Chapter | Quick revision points | Common trap |
|---|---|---|
| **10. Security** | Security is layered: **authentication, authorization, TLS, encryption at rest, secrets management, rate limits, audit logs, WAF/DDoS controls**. **RBAC** is simple; **ABAC** is expressive. | Treating JWTs or OAuth as the whole security model instead of one layer. |
| **11. Caching strategies** | **Cache-aside** is the default; **write-through** helps freshness; **write-back** is fastest but riskiest. Set **TTL per dataset**, add **jitter**, and plan for **stampedes** and **hot keys**. | One TTL policy for everything, or no invalidation story after writes. |
| **12. Messaging & events** | **Queue** = one consumer path; **pub/sub** = fan-out. At-least-once delivery means **idempotent consumers**, **DLQs**, **backoff + jitter**, and usually the **outbox pattern**. | Chasing "exactly once" everywhere instead of designing safe duplicates. |
| **13. Consistent hashing** | It minimizes remapping when nodes change; use **virtual nodes** (often ~100-200 per server) for balance. Rebalancing cost is about **data movement**, not hash lookup time. | Using `hash(key) % N` in a cluster that needs frequent scaling or failover. |
| **14. Distributed cache** | A serious cache uses **remote shared nodes, consistent hashing, replicas, discovery, and an eviction policy**. Measure **hit rate, eviction rate, lag, and memory pressure**. | Building a cache tier without discovery, failover, or warming strategy. |

### Applied System Designs

| Chapter | Quick revision points | Common trap |
|---|---|---|
| **15. Auto-complete** | Use an **in-memory trie** for prefix search: lookup cost depends on **prefix length**, not dataset size. Keep **serving** separate from **popularity updates**. | Using disk or DB lookups on every keystroke and missing the latency budget. |
| **16. Notification service** | Accept fast, **deliver asynchronously**, and **persist before publish**. Partition by **recipient** for best-effort ordering; centralize **preferences, retries, DLQ, and provider failover**. | Putting APNs/FCM/Twilio calls on the user request path. |
| **17. Real-time push platform** | Real-time push is a **connection-state** problem. Use **WebSockets**, event-driven socket servers, a **registry (`client_id -> server_id`)**, and **jittered reconnects**. Scale on **open connections**, not RPS. | Autoscaling on CPU/RPS while connection servers are actually saturated by socket count. |
| **18. Top-K trending items** | Large-scale Top-K usually needs **two paths**: **approximate fast path** (Count-Min Sketch + heap) and **exact slow path** (replayable aggregation). Partition by **item key** and watch for **hot keys**. | Trying to make one exact real-time path serve both product and audit needs. |
| **19. URL shortener & pastebin** | Keep the redirect path tiny: **code -> target** lookup should be cache-first and ultra-fast; do **analytics, abuse checks, and cleanup asynchronously**. Choose **301 vs 302** intentionally. | Doing analytics or moderation synchronously on the redirect path. |
| **20. Search engine** | Search is two systems: **offline crawl/index pipeline** and **online query serving**. The **inverted index** is the core structure; ranking mixes **lexical, authority, freshness, and quality** signals. | Mixing indexing and serving concerns, or thinking search is just a database query problem. |

---

## Chapter 1: System Design Interview Framework

**Goal:** Build a repeatable mental process for approaching any system design question — from a beginner who draws boxes to an expert who dissects failure modes, cost, and evolution. By the end of this chapter you have a framework, templates, and the vocabulary to run a strong interview discussion at any level.

---

### 1.1 What Is System Design, and Why Does It Matter?

System design is the practice of defining how software components — services, databases, caches, queues, APIs — fit together to solve a real business problem at a specific scale.

**For beginners:** Think of it like designing a city. A small town (startup) needs a road, a post office, and a store. A metropolis (Google-scale) needs highways, airports, multiple distribution centres, and backup power grids. The components are the same in concept, but the constraints — volume, reliability, cost — are entirely different.

**Why interviews test it:** Writing code is table stakes for software engineering. System design tests whether you can reason about trade-offs, anticipate failure, and design something a team can actually build and operate. A senior engineer who cannot explain _why_ they chose PostgreSQL over Cassandra, or _what_ happens when their cache goes down, is a risk in production.

**Real-world grounding:** When a user submits a ride request on Uber, dozens of systems interact within milliseconds: the mobile client, an API gateway, a location service, a matching engine, a pricing service, a payment service, a notification service, and a driver app. None of those were designed in isolation. Each owns its data, its failure mode, and its scaling profile. System design is how Uber's engineers made deliberate choices about where each boundary sits.

---

### 1.2 The Six-Step Interview Loop

Use the same structure for nearly every system design question. This loop works whether you have 20 minutes or 60.

```
Step 1  →  Clarify requirements and constraints
Step 2  →  Estimate scale and capacity
Step 3  →  Define the API contract
Step 4  →  Draw the high-level design
Step 5  →  Deep dive on bottlenecks and failure modes
Step 6  →  Discuss trade-offs and evolution
```

**Why this order matters:** Each step builds on the previous. You cannot estimate storage without knowing the data model. You cannot find bottlenecks without a design to interrogate. Skipping steps is the most common mistake — engineers jump to drawing boxes before they know what the boxes must do.

**Real-world example:** Interview loops at Google, Meta, and Amazon explicitly expect this progression. Interviewers at these companies are trained to probe each step; if you skip requirements, they will ask you to go back. Staying in the loop is not rigid — it is signal to the interviewer that you can structure ambiguous problems.

---

### 1.3 Step 1 — Clarify Requirements

Requirements are not given to you cleanly in a real interview. You must extract them. Spend the first 3–5 minutes asking questions before drawing anything.

#### Functional requirements (what the system must do)

- What are the core use cases? (e.g., "users can post a photo; followers can see it in their feed")
- What is out of scope? (e.g., "ads and monetization are out of scope for this session")
- What do users interact with — mobile, web, or both?

#### Non-functional requirements (how well the system must do it)

- **Latency:** What response time is acceptable? (e.g., "search results in under 200 ms")
- **Availability:** What is the uptime target? (99.9% = 8.7 hours downtime/year; 99.99% = 52 minutes/year)
- **Consistency:** Can users see slightly stale data, or must reads always reflect the latest write?
- **Durability:** Can any data loss be tolerated? (e.g., "a lost notification is acceptable; a lost payment is not")
- **Scale:** How many daily active users? What is the read/write ratio?

#### The two questions most beginners forget

1. **"What is the read/write ratio?"** — A system that is 99% reads (Wikipedia) is designed very differently from one that is 50/50 (Twitter timeline writes). Reads are typically cheap to scale horizontally; writes require more care with consistency and replication.
2. **"Is correctness, freshness, or cost the primary constraint?"** — These three frequently conflict. A social media feed can show slightly old posts (freshness sacrificed for cost). A bank ledger cannot (correctness non-negotiable, cost secondary).

**Real-world example — Uber ride matching:** Functional: match rider to nearby driver in real time. Non-functional: latency < 2 s, availability > 99.99% (an outage means no rides), eventual consistency acceptable for surge prices (a user seeing a price that is 10 seconds stale is fine), zero data loss for payments. Without asking these questions, you might design a strongly consistent system with cross-region synchronous writes — adding hundreds of milliseconds to the match path and making the system fragile during a regional outage.

---

### 1.4 Step 2 — Estimate Scale and Capacity

Back-of-envelope math is not about precision. It is about finding which dimension — storage, bandwidth, compute — is the hardest constraint, and making sure your design handles it.

#### The five-step capacity template

1. **Daily active users × actions per day = daily events.** (e.g., 100 M users × 5 posts/day = 500 M posts/day)
2. **Daily events ÷ 86,400 = average RPS; multiply by 5–10× for peak RPS.** (500 M ÷ 86,400 ≈ 5,800 avg RPS; peak ≈ 30,000–60,000 RPS)
3. **Average payload size × peak RPS = bandwidth.** (e.g., 1 KB × 30,000 = 30 MB/s ingress)
4. **Storage = payload × events/day × retention days.** (1 KB × 500 M × 365 days ≈ 183 TB/year)
5. **Shards = total storage ÷ per-node capacity; sanity-check latency by summing each hop.**

#### Rules of thumb to memorize

| Estimate | Value |
|---|---|
| 1 billion requests/day | ~11,600 RPS |
| Average tweet (text + metadata) | ~1 KB |
| Average photo (compressed) | ~300 KB |
| Average HD video minute | ~10 MB |
| QPS a single server handles | ~1K–10K reads; ~100–1K writes |
| Read replica benefit | +1K–5K read QPS per replica |

#### Real-world example — Instagram at scale

Instagram serves ~100 M daily active users, each viewing ~50 photos/day. That is 5 billion photo views/day ≈ 58,000 read RPS on average, peaking above 200,000 RPS. A single database server handles at most ~10,000 reads/second. The math alone tells you that without caching (CDN + Redis), you need dozens of read replicas just for photo URLs — before a single line of product code is written. The capacity estimate drives the architecture.

---

### 1.5 Step 3 — Define the API Contract

The API step is where you prove that you thought about the interface before drawing component boxes. A well-defined API reveals hidden requirements (idempotency, versioning, authentication) and forces you to clarify data shapes.

#### What a minimal but correct API looks like

For a notification service:

```http
POST /v1/notifications          # Trigger a new notification
GET  /v1/notifications/{id}     # Check delivery status
```

```json
{
  "recipient_id": "user_456",
  "idempotency_key": "order_789_shipped",
  "channels": ["push", "email"],
  "event_type": "order_shipped",
  "payload": { "order_id": "789", "tracking_url": "https://..." }
}
```

#### What the interviewer is listening for

| API property | Why it matters |
|---|---|
| `idempotency_key` on POST | Retries from the client or gateway must not send the same notification twice |
| `/v1/` versioning | Signals awareness that APIs evolve without breaking existing clients |
| Explicit `channels` | Channels are a product decision — implicit channel selection hides business logic |
| `event_type` field | Lets the service apply template selection and routing logic without coupling to payload shape |

**Design principle:** Define the smallest API that satisfies the requirements. Every field you add is a contract you must maintain. Every field you leave out is a decision you are documenting consciously.

**Beginner mistake:** Designing the API as a database mirror — one endpoint per table, exposing internal schema. A good API represents domain operations ("place an order," "cancel a ride"), not database tables ("POST /orders_table"). If the database schema changes, a domain-oriented API is isolated from the change.

---

### 1.6 Step 4 — High-Level Design

Draw the minimum set of components that satisfies the requirements. This is not the time for deep optimization. The goal is a coherent end-to-end sketch that answers: how does data get in, how does it get stored, and how does it get out?

#### The standard component vocabulary

| Component | Job | When to reach for it |
|---|---|---|
| **API gateway** | Auth, rate limiting, routing | Any public-facing API surface |
| **Load balancer** | Distribute traffic across service instances | Any service that runs more than one instance |
| **Application service** | Business logic | Always |
| **Cache (Redis/Memcached)** | Serve hot reads without hitting the database | Read-heavy workloads, expensive queries |
| **Database** | Durable storage with query capability | Anything that needs to persist |
| **Message queue (Kafka/SQS)** | Decouple producers from consumers, buffer bursts | Async processing, fan-out, retries |
| **Object storage (S3)** | Store large blobs cheaply | Images, videos, backups, logs |
| **CDN** | Serve static/cacheable content close to users | Global user base, static assets |

#### The two paths every design has

Always keep these separate in your diagram and explanation:

- **Request path (synchronous):** client → gateway → service → cache → database → response. This is the latency-sensitive path users wait on.
- **Data path (asynchronous):** event → queue → workers → downstream services. This is where side effects happen — sending emails, updating search indexes, charging cards.

Mixing these paths is the root cause of most latency problems. A checkout that synchronously charges a card, sends an email, and updates the recommendation engine before returning a response is fragile and slow. The only synchronous part should be the payment; everything else goes on the async path.

**Real-world example — Instagram photo upload:**

```
Client → API gateway → Upload service → Object storage (S3)   [sync — returns URL]
                    ↓
                 Kafka event (photo_uploaded)
                    ↓
         ├── Thumbnail generator (async)
         ├── Feed fanout service (async)
         └── Search index updater (async)
```

The user gets their photo URL in under a second. Thumbnails and feed updates happen within seconds. Search indexing may take minutes. Each path has the right latency contract for its purpose.

---

### 1.7 Step 5 — Bottlenecks and Failure Modes

This is where senior candidates separate themselves. A beginner draws a correct design. A senior engineer knows exactly which part will break first and why.

#### The five failure analysis categories

For any component in your design, ask these questions:

| Category | What to ask |
|---|---|
| **Single point of failure (SPOF)** | What happens if this component goes down? Is there a replica or fallback? |
| **Hot partition / hot key** | Could a single database shard or cache key receive all traffic? (e.g., a celebrity's tweet being fetched by 10 M users simultaneously) |
| **Backpressure and queue growth** | If a downstream service is slow, does the queue grow unboundedly? What is the consumer's recovery time? |
| **Data loss vs. duplication** | If a message is delivered twice, does the consumer produce wrong state? Is processing idempotent? |
| **Slow downstream dependency** | If a payment service takes 5 seconds instead of 200 ms, what does the calling service do? Does it have a timeout? A circuit breaker? |

#### Failure analysis for the Instagram photo upload design

| Component | Failure | Mitigation |
|---|---|---|
| Upload service crashes mid-write | Partial file in S3 | Multipart upload with completion check; retry on resume |
| Kafka lag spikes | Feed fanout delayed by minutes | Backpressure limit; consumer autoscaling; SLA = "feed updates within 60 s" |
| Hot key: celebrity posts | Single shard overwhelmed | Pre-shard fan-out; celebrity posts use a separate high-throughput path |
| Feed fanout writes too many DB rows | Write amplification for users with 10 M followers | Hybrid push/pull: push for accounts with < 1 M followers; pull on read for accounts above that threshold |

**Real-world example:** When a major celebrity like Taylor Swift tweets, Twitter's fan-out service used to push updates to ~90 M followers synchronously. This caused visible fan-out delays on the write path. The fix was a hybrid model: pre-compute feeds for most users on write, but merge celebrity tweets at read time.

---

### 1.8 Step 6 — Trade-Offs and Evolution

Every design optimizes for some constraints at the expense of others. A complete answer names the trade-off explicitly and explains how the design would evolve as the product grows.

#### The six trade-off axes

| Axis | What you are choosing between |
|---|---|
| Latency vs. consistency | A caching layer reduces read latency but means some reads see stale data |
| Availability vs. correctness | Failing open (serving stale data during outage) vs. failing closed (returning errors) |
| Cost vs. durability | Synchronous replication to three availability zones is more durable but 3× the storage cost |
| Simple vs. scalable | A monolith is simpler to build but harder to scale; microservices are the reverse |
| Strong consistency vs. eventual consistency | Strongly consistent writes are slower; eventually consistent systems are harder to reason about |
| Fast writes vs. fast reads | LSM-tree storage (write-optimized) vs. B-tree storage (read-optimized) |

#### Evolution over three stages

| Stage | Typical setup | The change that triggers the next stage |
|---|---|---|
| Early (< 1 M users) | Single-region monolith, one database, basic CDN | Monolith deploy time exceeds 30 min; hot teams block each other |
| Growing (1 M–100 M users) | Microservices for high-change domains, read replicas, Redis caching layer | Single region can no longer handle peak RPS; first regional outage |
| Scale (> 100 M users) | Multi-region active-passive or active-active, service mesh, event-driven fan-out, dedicated caching tier | Global latency requirements; compliance requiring data residency |

**Rule:** Do not design for Stage 3 when you are at Stage 1. Over-engineering costs money and engineering time, and the boundaries you guess at Stage 1 are usually wrong by Stage 3 anyway. The right answer is: "Today I'd build this; here is the clear trigger that tells us to move to the next stage."

---

### 1.9 What Interview-Ready Depth Actually Means

A strong answer operates at three layers simultaneously:

1. **Product layer** — what user or business problem the system solves, and why the design serves it.
2. **Mechanism layer** — how the request actually flows through caches, services, queues, and storage.
3. **Operations layer** — what breaks in production, how you detect it, and how you recover safely.

**The difference between a shallow and a deep answer:**

| Shallow | Deep |
|---|---|
| "Use Redis for caching." | "Cache the user profile with key `profile:{user_id}`, TTL 5 minutes, invalidated on profile write. On Redis failure, fall through to the database with a 1-second timeout and a circuit breaker to prevent DB overload." |
| "Use Kafka for async processing." | "Partition by `user_id` for ordered per-user processing. Consumer group with manual offset commit after successful processing — never auto-commit, or a crash before processing loses the event. DLQ for events that fail after 3 retries." |
| "Use Postgres for storage." | "Two read replicas for query offload. Write to primary, read from replica with acceptable 100 ms lag. Index on `(user_id, created_at)` for timeline queries. Explain the index selectivity trade-off." |

In practice, strong system-design discussions move repeatedly between these layers. A notification service is not just "API → queue → workers." The real design also covers delivery semantics, idempotency, provider outage handling, queue backlog growth, and how cost controls interact with retries.

---

### 1.10 Worked Example: Design a URL Shortener

This is one of the simplest system design questions. Walk through all six steps to see the framework in practice.

**Step 1 — Requirements:**
- Users submit a long URL; get back a 7-character short code (e.g., `sho.rt/aB3xY9q`).
- Anyone with the short URL is redirected to the long URL.
- Analytics (click count) are a nice-to-have; real-time accuracy is not required.
- Scale: 100 M URLs created/month; 10 B redirects/month.

**Step 2 — Capacity:**
- Writes: 100 M / 30 days / 86,400 s ≈ **40 writes/second**.
- Reads: 10 B / 30 / 86,400 ≈ **3,900 reads/second** (peak ~20,000 RPS).
- Storage: 1 URL ≈ 500 bytes; 100 M × 500 B = 50 GB/month → manageable in one database.
- Read/write ratio: ~100:1 → optimize for reads.

**Step 3 — API:**
```http
POST /v1/links                    # Create a short URL
GET  /{code}                      # Redirect to the long URL (returns 301 or 302)
GET  /v1/links/{code}/stats       # Click analytics
```

**Step 4 — High-level design:**
```
Client → CDN (cache 301 redirects) → API gateway → Redirect service → Redis cache → DB
                                                  → Link creation service → DB
                                                  → Analytics worker (async via Kafka)
```

**Step 5 — Bottlenecks:**
- The redirect path is 100× higher volume than writes. Cache the `code → long_url` mapping in Redis with a long TTL (hours/days). A CDN can cache 301 redirects at the edge — after the first redirect, the user's browser and every CDN PoP caches it permanently. This drops origin load by 90%+.
- Hash collision: a 7-character base62 code gives 62⁷ ≈ 3.5 trillion combinations — no collision risk at 1 B total URLs.
- Single database: at 40 writes/second and 50 GB, a single Postgres instance handles this comfortably. Partition or add read replicas if the read tail latency rises.

**Step 6 — Trade-offs:**
- **301 vs. 302:** 301 (permanent) redirect is cached by browsers forever — lowest load, but you lose analytics after the first click and cannot update the target URL. 302 (temporary) redirect is not cached — every click hits origin, giving accurate analytics but higher cost. Choose intentionally based on whether analytics matter.
- **Analytics accuracy:** Counting every click synchronously adds latency and write pressure. Push click events to Kafka asynchronously; aggregate in a batch job. Sacrifices real-time accuracy for throughput.

---

### 1.11 Interview Trade-Off Questions

#### 1. If the interviewer gives you only 20 minutes, which steps do you compress and which do you never skip?

**Never skip:** Step 1 (requirements) and Step 5 (bottlenecks). Without requirements, you might design the wrong system entirely. Without bottlenecks, you have no evidence that the design actually works at scale.

**Compress:** Step 3 (API) — mention one or two key endpoints and move on rather than detailing every field. Step 4 (high-level design) — draw the skeleton quickly and spend the saved time on deep-diving one interesting component.

**The rule:** Spend roughly 5 minutes on requirements and scale, 5 minutes on a minimal design sketch, and 10 minutes going deep on the one component that is most likely to break. Interviewers remember the depth of the hard discussion, not the breadth of a rushed sketch.

---

#### 2. When should you push back on a requirement because it makes the design unrealistic?

Push back when a requirement creates a contradiction you cannot resolve without acknowledging it — and when accepting it silently would produce a dishonest design.

**Example of a contradiction to push back on:** "We need 100% availability and strong consistency across all global regions." That is impossible under network partitions (CAP theorem). The right response is: "Strong consistency and 100% availability conflict during a partition. Can we accept eventual consistency for reads, or a brief write-outage during a partition, rather than 100% availability?"

**Example of a valid pushback on scope:** "You mentioned the system should support 10 billion daily users. Are we designing for that day-one, or should I design for current scale with a clear path to get there? Designing for 10 B users from scratch costs 100× more and takes far longer to build."

Interviewers appreciate pushbacks that demonstrate real engineering judgment. They dislike pushbacks that are really just avoidance ("that seems hard, can we simplify?"). The difference is whether you propose a concrete alternative.

---

#### 3. If you have time for only one deep dive, how do you choose between scaling, data model, and failure handling?

Choose the dimension that, if wrong, would cause the most irreversible damage to the system.

- **Data model** is often the highest-stakes choice because it is the hardest to change after launch. A wrong schema or wrong database type (relational vs. document vs. wide-column) creates technical debt that lasts years. Deep-dive on the data model when the access patterns are unusual, when the data has complex relationships, or when scale requirements push against relational assumptions (e.g., a time-series workload on a relational DB).

- **Failure handling** is the highest-stakes choice when the product cannot tolerate even brief outages or data loss — payments, healthcare, financial trading. A system that loses data or corrupts state during a crash is worse than one that is merely slow.

- **Scaling** is the highest-stakes choice when the capacity estimate shows you are within an order of magnitude of a single node's limits. If your math shows 50,000 write RPS and a single DB handles 5,000, you must solve the scaling problem before the interview ends.

**Rule of thumb:** Data model for data-intensive products, failure handling for correctness-critical products, scaling for high-volume products.

---
## Chapter 2: Fundamentals of System Design

This chapter covers the core trade-off forces that drive every system design decision and the fundamental building blocks — microservices, load balancers, databases, caches, file storage, and messaging queues — used to construct large-scale systems. Understanding these forces and components is the foundation for every design in this guide.

### The Core Forces Behind Most System Designs

Nearly every design decision in distributed systems is a response to a small number of recurring forces:

- **Latency (how long one request or operation takes)** — how long one operation takes from the user's point of view.
- **Throughput (how much work the system finishes per second)** — how much work the system can complete per second.
- **Availability (how often the system stays usable)** — whether the system keeps serving requests during failures.
- **Consistency (whether different parts of the system see the same data at the same time)** — whether different parts of the system agree on the same value at the same time.
- **Durability (whether acknowledged data survives crashes)** — whether acknowledged data survives crashes and recovery.
- **Operability (how easy the system is to run, debug, and change safely)** — whether humans can debug, deploy, and evolve the system safely.

Those forces interact. Batching improves throughput but can hurt latency. Stronger consistency improves correctness but may reduce availability during partitions. More caching reduces latency and cost, but increases staleness risk. Sharding (splitting data across many machines) improves scale, but complicates joins, transactions (groups of operations that succeed or fail together), and debugging.

That is why "best design" is rarely absolute. Search prefers low latency and can tolerate slightly stale results. A bank ledger prefers durability and correctness over raw write throughput. A metrics pipeline often prefers availability and eventual convergence over strict transactional guarantees. When a system-design answer feels vague, it is usually because the speaker has not yet said which force matters most.

---

### Microservices

The microservice architecture structures an application as a collection of small, independently deployable services. Each service:

- Is organized around a specific **business capability**
- Is owned by a **small team** (the "two-pizza rule": a team small enough to be fed by two pizzas)
- Is **independently deployable** and **scalable** without coordinating with other teams
- Is **loosely coupled** from other services — changes inside one service do not require changes in others
- Is **highly maintainable and testable** in isolation
- **Owns its own data** — no shared databases between services

**Real-world example:** Netflix decomposes its platform into hundreds of microservices — user auth, recommendations, billing, video encoding, content delivery, and more. A bug in the recommendations service does not bring down billing. Each service is deployed dozens of times per day by its own team.

#### Monolith vs. Microservices: When to Choose Each

Before reaching for microservices, it is worth understanding what a monolith is and when it is the better option.

A **monolith** is a single deployable unit where all business logic, data access, and API handling live together. It is faster to develop initially, trivial to test end-to-end, and has zero network overhead between components. The right choice for teams under ~15 engineers, products in early discovery, and systems where operational simplicity matters more than independent scalability.

A **modular monolith** is an intermediate option: code is organized into clearly separated modules with defined interfaces, but it is still deployed as one unit. This is often the right answer for teams that have not yet found their true service boundaries but want clean code organization.

**Microservices** become the right choice when:
- Different parts of the system have genuinely different **scaling requirements** (the video encoding pipeline needs 100× more CPU than the user auth service).
- Teams are large enough that a shared codebase creates **coordination overhead and deploy bottlenecks**.
- Parts of the system need **different technology stacks** (ML inference in Python, low-latency trading logic in C++, web APIs in Go).
- **Blast radius** from failures must be contained — a bug in one service should not take down unrelated capabilities.

| Dimension | Monolith | Modular Monolith | Microservices |
|---|---|---|---|
| Deployment complexity | Single deploy | Single deploy | Per-service CI/CD pipelines |
| Operational overhead | Low | Low | High (service mesh, discovery, observability) |
| Independent scaling | No | No | Yes |
| Network latency between components | Zero (in-process) | Zero (in-process) | Real (adds ~1–5ms per hop) |
| Data isolation | Shared DB | Shared DB | DB-per-service |
| Team autonomy | Low | Medium | High |
| Best for | Early-stage, small teams | Growing teams, unclear boundaries | Mature products, multiple teams |

#### How to Split Services: The Five Axes

Poor service boundaries are the most common microservices mistake. Use these axes to decide where to draw lines:

1. **Business capability** — split around what the business does, not how the code is organized technically. "Order Management," "Payment Processing," "User Profile" are good boundaries. "Database Layer" or "Utility Functions" are bad ones.
2. **Data ownership** — each service should own its primary data store exclusively. If two services need to join data at the database level, they are probably too fine-grained.
3. **Change cadence** — a component that changes frequently (product catalog) should not be coupled to one that rarely changes (billing rules). Different change rates justify different services.
4. **Scaling profile** — components with different resource needs (CPU, memory, I/O) benefit from independent scaling. Video transcoding and user authentication have nothing in common operationally.
5. **Transaction boundary** — if two operations must always succeed or fail together atomically, keeping them in the same service is simpler than coordinating a distributed transaction. Split across services only when the business can tolerate eventual consistency between them.

#### Inter-Service Communication

Services communicate in one of two ways, and choosing the right one for each interaction is critical:

**Synchronous (request-response):**
- The caller waits for a response before proceeding.
- Used for: queries where the result is needed immediately (fetch user profile, check inventory).
- Protocols: REST over HTTP, gRPC (preferred for internal calls — binary encoding, streaming, strong contracts).
- Risk: the caller is blocked while the callee processes. If the callee is slow, the caller slows down too — creating latency amplification across chains of services.

**Asynchronous (event-driven):**
- The caller publishes an event and moves on. Downstream services consume it at their own pace.
- Used for: operations where the caller does not need an immediate result (send email after order placed, update search index after product updated).
- Protocols: Kafka, Amazon SQS, RabbitMQ.
- Benefit: temporal decoupling — the producer and consumer do not need to be running simultaneously. The queue absorbs bursts.
- Risk: eventual consistency — the downstream service may lag behind the producer by seconds or minutes.

**The rule of thumb:** use synchronous calls for queries (read operations) and async events for commands that trigger side effects in other services (write operations with fan-out).

#### Key Resilience Patterns

When services call each other synchronously, failures cascade unless you actively contain them. These four patterns are the standard toolkit:

**Circuit Breaker** — a wrapper around outbound calls that tracks the error rate. If errors exceed a threshold (e.g., 50% of calls in the last 10 seconds fail), the circuit "opens" and subsequent calls fail immediately without waiting for a timeout. This prevents a slow downstream service from holding threads and connections in the calling service. After a cooldown period, the circuit allows a probe request through to check if the downstream has recovered. Implemented by: Resilience4j (Java), Polly (.NET), or at the infrastructure layer via a service mesh (Istio, Linkerd).

**Timeout** — every outbound call must have a deadline. Without a timeout, a hung downstream service will hold a thread in the caller indefinitely, eventually exhausting the thread pool. A common mistake is setting timeouts only at the outermost API gateway while inner service-to-service calls have none.

**Retry with exponential backoff and jitter** — transient failures (network blip, brief overload) are common in distributed systems. Retrying the same call after a short delay often succeeds. Exponential backoff prevents retry storms: wait 100ms, then 200ms, then 400ms. Jitter (adding randomness to the wait time) prevents all retrying clients from hitting the recovering service at exactly the same moment.

**Bulkhead** — isolate resources so that one slow integration does not exhaust resources shared with other integrations. Example: use a separate thread pool for calls to the payment service, so a payment outage does not exhaust threads needed for the inventory service. Named after the watertight compartments in a ship's hull.

#### The Saga Pattern: Distributed Transactions Without 2PC

Microservices with separate databases cannot use a traditional database transaction that spans services. The naive alternative — distributed two-phase commit (2PC) — is slow, fragile, and creates tight coupling between services. The better solution is the **Saga pattern**.

A Saga is a sequence of local transactions, each in its own service, where each step publishes an event that triggers the next step. If a step fails, the Saga executes **compensating transactions** to undo the completed steps.

**Example: placing an e-commerce order**
1. Order Service creates the order (status: PENDING) → publishes `OrderCreated` event.
2. Inventory Service reserves the items → publishes `InventoryReserved` event.
3. Payment Service charges the card → publishes `PaymentProcessed` event.
4. Order Service marks the order CONFIRMED.

If payment fails at step 3:
- Payment Service publishes `PaymentFailed` event.
- Inventory Service receives it and releases the reserved items (compensating transaction).
- Order Service marks the order CANCELLED.

**Two Saga execution styles:**
- **Choreography** — each service listens for events and reacts. No central coordinator. Simple to implement but hard to trace when a flow goes wrong across many services.
- **Orchestration** — a dedicated Saga Orchestrator service explicitly calls each step and handles compensations. Easier to visualize and debug but introduces a central component that must be kept reliable.

#### Data Management in Microservices

The database-per-service pattern is non-negotiable for true independence, but it creates challenges that a shared database does not have.

**Database-per-service:** Each service has its own schema, and no other service queries it directly. Cross-service data needs are satisfied through API calls or events. This means:
- The Order Service cannot JOIN against the User Service's table — it must call the User Service's API or maintain a local copy of the data it needs.
- Schema changes in one service do not break others.
- Each service can choose the right storage technology for its workload (Postgres for transactional data, Cassandra for write-heavy time-series, Redis for ephemeral session state).

**The CQRS pattern (Command Query Responsibility Segregation):** Separate the data model used for writes (commands) from the data model used for reads (queries). The write model optimizes for correctness and consistency; the read model optimizes for query performance (denormalized, pre-joined, cached). Changes on the write side are propagated to the read side asynchronously via events. This is especially useful when a service's read patterns are very different from its write patterns (e.g., a social feed where writes are per-user but reads are per-follower).

**The Outbox Pattern:** When a service needs to update its own database and publish an event atomically, it writes both the data change and the event to the same local database in a single transaction. A separate process (the "outbox publisher") reads unpublished events from the outbox table and forwards them to the message broker. This guarantees that events are never lost even if the broker is temporarily unavailable at write time.

#### Service Discovery

In a dynamic environment where services start, stop, and scale horizontally, hardcoding IP addresses is not viable. Service discovery solves this.

- **Client-side discovery:** The client queries a service registry (Consul, etcd, Eureka) to get the list of healthy instances and picks one using a load balancing algorithm. The client owns the routing logic.
- **Server-side discovery:** The client sends requests to a load balancer or API gateway, which queries the registry and forwards to a healthy instance. The client has no knowledge of the registry.
- **Kubernetes DNS:** In Kubernetes, each service gets a stable DNS name (e.g., `payment-service.payments.svc.cluster.local`). The kube-proxy layer handles routing to healthy pods transparently. This is the most common form of service discovery for containerized microservices.

#### API Gateway

An API gateway is the single entry point for all external traffic into a microservices system. It handles concerns that should not live in every individual service:

- **Authentication and authorization** — validate JWT tokens, enforce OAuth scopes.
- **Rate limiting** — protect backend services from overload by limiting calls per client.
- **Request routing** — forward `/api/orders/*` to the Order Service and `/api/users/*` to the User Service.
- **Protocol translation** — accept REST from external clients, translate to gRPC for internal services.
- **Response aggregation** — combine responses from multiple services into a single API response (the Backend-for-Frontend pattern).
- **Observability** — log every request, emit metrics, inject trace IDs.

Common tools: AWS API Gateway, Kong, Nginx, Envoy. The API gateway should be thin — it routes and enforces policies, but business logic stays in the services.

#### Why this architecture?

A monolith is fast to start with, but as the codebase grows past ~50 engineers, a single deploy cycle becomes a coordination nightmare — one broken test blocks the whole release train. Microservices give each team an independent deploy pipeline. At Amazon, the move to services was driven by a 2002 Jeff Bezos mandate: all data and functionality must be exposed via service interfaces, with no other form of inter-process communication.

The deeper reason microservices work at scale is **Conway's Law**: organizations tend to produce architectures that mirror their communication structures. A company with 20 product teams building a monolith spends enormous energy coordinating changes. The same company with well-defined service boundaries lets each team move at its own pace.

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| Service crashes | That capability is unavailable | Health checks + auto-restart (Kubernetes liveness probes) |
| Network partition between services | Cascading failures | Circuit breakers, timeouts, retries with exponential backoff and jitter |
| Shared database modified by one team | Other services break on schema change | Database-per-service ownership; schema changes via backward-compatible migrations |
| Deployment of bad code | Regression for one service | Canary deployments, blue-green deployments, feature flags |
| Service discovery failure | Services cannot find each other | Consul, Kubernetes DNS with fallback to static IPs |
| Saga compensation fails mid-flow | Data inconsistency across services | Idempotent compensating transactions; human-review queue for stuck sagas |
| Outbox publisher crashes | Events not delivered to broker | Outbox publisher is stateless and restartable; events remain in DB until published |
| API gateway overload | All services become unreachable | Rate limit at the gateway; autoscale the gateway tier; provision headroom for peak |

**Real-world failure:** A misconfigured deploy of Amazon's Route 53 DNS service caused a cascading failure that took down a large portion of AWS US-East-1 for several hours. Services that had implemented circuit breakers degraded gracefully; services that retried aggressively without backoff amplified the outage.

#### How much will it cost?

A minimal microservices setup for a mid-sized startup (10 services, 3 instances each):

| Resource | Monthly Cost (AWS) |
|---|---|
| 30 × t3.medium EC2 instances | ~$1,000 |
| 10 × RDS db.t3.small (one DB per service) | ~$800 |
| ALB + NLB load balancers | ~$200 |
| CloudWatch monitoring | ~$150 |
| **Total baseline** | **~$2,150/month** |

At scale (Netflix-level, thousands of services), the cost runs into tens of millions/year — largely offset by engineering velocity gains and reduced incident blast radius. The hidden cost of microservices is **operational complexity**, not infrastructure: more deployable units, more failure surfaces, and more observability tooling to buy and maintain.

#### How will teams maintain it?

- **Service catalog** (e.g., Backstage by Spotify) tracks every service, its owner, runbooks, and on-call rotation. Without this, services become orphans with no clear owner.
- **Centralized logging** (ELK, Datadog, Splunk) with structured logs + **correlation IDs** — a single ID injected at the API gateway and propagated through every service so a full request trace can be reconstructed from logs.
- **Distributed tracing** (Jaeger, Zipkin, AWS X-Ray) to visualize end-to-end latency across service hops and pinpoint which service introduced a regression.
- **On-call rotations** per service team — the team that owns the service is on-call for it. This creates accountability ("you build it, you run it").
- **Runbooks** for common failures: how to restart the service, how to roll back, what dashboards to check, and how to drain traffic during a deploy.
- **Contract testing** (Pact) — verify that the API contract between a producer service and its consumers does not break when either side changes, without requiring a full integration test environment.

#### How does it evolve in 3 years?

| Year | Typical Evolution |
|---|---|
| Year 1 | 5–10 services. Teams are still figuring out service boundaries. Most services share an API gateway and a Kubernetes cluster. Synchronous REST between services. Simple retry logic in application code. |
| Year 2 | Service mesh (Istio, Linkerd) introduced to handle mTLS, retries, circuit breaking at the infrastructure layer. Schema Registry enforces event contracts. Saga orchestration introduced for multi-step flows. Service catalog becomes mandatory. |
| Year 3 | Platform engineering team provides golden paths (templates, CI/CD pipelines, observability) so product teams do not reinvent infrastructure. Event-driven architecture adopted for async workflows. CQRS introduced for high-read services. Separate read models pre-computed via stream processing (Flink, Kafka Streams). |

---

### Load Balancers

A load balancer sits between clients and a pool of backend servers. Every incoming request arrives at the LB, which picks a healthy backend, forwards the request, and streams the response back to the client. From the client's perspective it looks like a single server; from the backend's perspective, load is spread evenly across the whole fleet.

```
Client ──► Load Balancer ──► Server A
                         ├──► Server B
                         └──► Server C
```

Without a load balancer, all traffic hits one server. A single modern server handles roughly 10 K–100 K requests/second depending on workload complexity. A load balancer lets you add more servers and distribute load automatically — this is **horizontal scaling**. It also provides **built-in failover**: the moment a backend fails its health check, the LB drains its connections and stops routing new traffic to it, usually within 10–30 seconds.

---

#### Layer 4 vs. Layer 7

The OSI model defines networking layers. Load balancers operate at either Layer 4 (Transport) or Layer 7 (Application), and the choice has real performance and routing implications.

| | Layer 4 (Transport) | Layer 7 (Application) |
|---|---|---|
| Routes on | IP address + TCP/UDP port | HTTP headers, URL path, query params, cookies |
| TLS termination | No (passes encrypted bytes through) | Yes (decrypts, inspects, re-encrypts) |
| Content-based routing | No | Yes (`/api/video/*` → video fleet, `/api/auth/*` → auth fleet) |
| Throughput | Very high — no packet inspection overhead | Slightly lower — parses HTTP on every request |
| Typical use | Database proxies, raw TCP services, gaming | Web apps, REST/gRPC APIs, microservices |
| AWS equivalent | NLB (Network Load Balancer) | ALB (Application Load Balancer) |

**When to pick L4:** You need maximum throughput and lowest latency, you are proxying a non-HTTP protocol (e.g., MySQL, Redis, MQTT), or you cannot afford the overhead of TLS termination at the LB.

**When to pick L7:** You need path-based routing, host-based routing, header rewriting, sticky sessions, WAF (Web Application Firewall) integration, or detailed HTTP access logs.

---

#### Load Balancing Algorithms

The algorithm decides *which* backend receives the next request. Choosing the wrong one causes hot spots — one backend saturated while others idle.

| Algorithm | How it works | Best for | Watch out for |
|---|---|---|---|
| **Round Robin** | Cycles through backends in order (A → B → C → A → …) | Homogeneous fleets where every request costs roughly the same | Uneven load if some requests are much heavier |
| **Weighted Round Robin** | Like round robin but higher-capacity servers receive proportionally more requests | Mixed instance types (e.g., c5.2xlarge gets 2× weight of c5.large) | Weights must be re-tuned when fleet changes |
| **Least Connections** | Routes to the backend with the fewest active open connections at that moment | Long-lived connections such as WebSockets, database proxies, file uploads | Slightly higher LB CPU to maintain connection counters |
| **Least Response Time** | Routes to the backend that replied fastest recently | Latency-sensitive APIs where backend speed varies by request type | Slow backends starved entirely if one backend is always fastest |
| **IP Hash** | Hashes the client IP to always map to the same backend | Stateful workloads where session state is stored locally | Backend failure changes hash mapping, breaking all sessions |
| **Random with Two Choices** (Power of Two) | Picks two backends at random, routes to the least loaded of the pair | Very large fleets where centralized state tracking is expensive | Slightly worse distribution than Least Connections at small scale |

**Rule of thumb:** Default to **Least Connections** for general web workloads. Switch to **Weighted Round Robin** when your fleet is heterogeneous. Avoid **IP Hash** for stateful session storage — externalize session state to Redis instead.

---

#### TLS Termination

HTTPS traffic is encrypted end-to-end using TLS (Transport Layer Security). The load balancer can handle TLS in three ways:

1. **TLS Termination (most common):** The LB decrypts traffic, routes in cleartext to backends on the private network. Backends do not need TLS certificates. Pros: cheaper backends, full L7 visibility. Cons: traffic inside the datacenter is unencrypted (acceptable on a trusted private network).

2. **TLS Passthrough:** The LB forwards encrypted bytes without decrypting. Backends terminate TLS themselves. Pros: end-to-end encryption. Cons: L7 routing is impossible since the LB cannot read the HTTP headers.

3. **TLS Re-encryption:** The LB terminates, inspects, then re-encrypts before forwarding to backends. Full end-to-end encryption *and* L7 routing. Cons: double TLS overhead.

Certificate management is the most common operational pain point. Automate renewal with **AWS Certificate Manager (ACM)** or **Let's Encrypt with cert-manager** — never manage certificates manually.

---

#### Health Checks

The LB continuously probes backends to detect failures before they affect users.

| Health check type | How it works | When to use |
|---|---|---|
| **TCP** | Opens a connection; success if the port accepts | Simple, low overhead; does not verify app is healthy |
| **HTTP/HTTPS** | Sends a GET to a path (e.g., `/health`); success if response is 2xx | Recommended for web services — verifies app logic is up |
| **Custom script** | Runs a script on the backend | Rare; used for complex startup readiness checks |

**Health check parameters to configure:**
- **Interval:** How often to probe (e.g., every 10 s).
- **Timeout:** How long to wait for a response (e.g., 5 s).
- **Healthy threshold:** Consecutive successes before marking healthy (e.g., 2).
- **Unhealthy threshold:** Consecutive failures before marking unhealthy (e.g., 3).

A backend marked unhealthy has its **connections drained** (in-flight requests complete; new requests stop) and then removed from rotation. This is called **connection draining** or **deregistration delay** (AWS default: 300 s).

Design your `/health` endpoint to check real dependencies — a 200 response that ignores a broken database connection is useless. Return 200 only when the service can actually serve traffic.

---

#### Sticky Sessions (Session Affinity)

By default, each request can land on any backend. Sticky sessions pin a client's requests to the same backend using a **cookie** (L7) or **source IP** (L4).

**Why you might use it:** Legacy apps that store session state in memory on the server (shopping cart, login token) cannot handle requests hopping between backends.

**Why you should avoid it:**
- If the pinned backend crashes, the user's session is lost.
- Traffic distribution becomes uneven as some backends accumulate sticky connections.
- It prevents true horizontal scaling.

**Better approach:** Externalize session state to a shared store (Redis, DynamoDB). Now every backend is stateless and can serve any user's request — no stickiness needed.

---

#### Types of Load Balancers

| Type | Examples | Pros | Cons |
|---|---|---|---|
| **Cloud-managed** | AWS ALB/NLB, GCP Cloud Load Balancing, Azure Load Balancer | Zero ops, auto-scales, multi-AZ by default, built-in TLS cert management | Vendor lock-in, can be expensive at very high scale |
| **Software (self-managed)** | NGINX, HAProxy, Envoy, Caddy | Full control, no vendor lock-in, can run anywhere | You own patching, HA configuration, scaling |
| **Hardware** | F5 BIG-IP, Citrix ADC | Extreme throughput for on-prem data centers | Expensive ($50 K+), inflexible, no cloud-native integration |
| **DNS-based** | AWS Route 53 weighted routing, Cloudflare | Global geographic routing, no single LB bottleneck | No health check at connection level; DNS TTL delays (30–60 s) on failover |

**Cloud-managed LBs are almost always the right default** unless you have specific cost or compliance requirements that force self-managed.

---

#### Global Load Balancing

A single regional LB routes traffic within one datacenter region. Global load balancing adds a layer above that to route users to the *nearest* healthy region.

```
User in Tokyo ──► Global LB ──► Asia-Pacific Region
User in NYC   ──► Global LB ──► US-East Region
User in London ──► Global LB ──► EU-West Region
```

Options:
- **AWS Global Accelerator:** Anycast IPs that route to the nearest AWS region over the AWS backbone, cutting latency significantly vs. the public internet.
- **Cloudflare Load Balancing:** Routes to origin based on latency, geography, and health checks. Also benefits from Cloudflare's CDN and DDoS protection.
- **Route 53 Latency-Based Routing:** DNS-level routing to the lowest-latency region. Simple but subject to DNS TTL delay on failover.

Use global load balancing when you have users across multiple continents or need sub-100 ms latency globally.

---

**Real-world example:** During Amazon Prime Day, the AWS ALB fleet absorbs hundreds of millions of requests per second globally. Each regional ALB autoscales its own capacity, while Route 53 and Global Accelerator handle cross-region routing. A backend fleet of thousands of EC2 instances uses Least Connections routing so that heavier requests (large product pages) do not pile onto the same servers.

---

#### Why this architecture?

Without a load balancer, all traffic hits a single server. One server caps out at ~10–100K requests/second depending on complexity. A load balancer enables horizontal scaling — add more servers, the LB distributes load automatically. It also provides health checking — if server 3 fails, the LB stops sending traffic to it within seconds.

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| Load balancer itself crashes | Total outage (single point of failure) | Active-passive LB pair (e.g., AWS ALB is managed and multi-AZ by default) |
| Health check misconfigured | LB routes to dead servers | Test health check endpoints explicitly; `/health` must check real dependencies |
| SSL/TLS certificate expired | HTTPS traffic fails at termination | Automate certificate renewal (AWS ACM, Let's Encrypt with cert-manager) |
| Sticky sessions + server failure | User session lost | Store sessions in Redis externally, not on the server |
| LB overloaded | High latency or drops | Pre-provision for peak; use autoscaling on the backend fleet |
| Connection draining too short | In-flight requests cut off during deploys | Set deregistration delay ≥ your 99th-percentile request duration |
| Thundering herd after failover | Surviving backends overwhelmed | Implement circuit breakers and request queuing on backends |

#### How much will it cost?

| LB Type | Monthly Cost |
|---|---|
| AWS ALB | $16 base + $0.008 per LCU-hour (~$50–200 for medium traffic) |
| AWS NLB | $16 base + $0.006 per LCU-hour |
| AWS Global Accelerator | $18 base + $0.01 per GB data transfer |
| Self-managed NGINX (2 × c5.large) | ~$140/month + ops overhead |
| Self-managed HAProxy (2 × c5.xlarge, HA pair) | ~$280/month + ops overhead |

At high scale (millions of req/s), managed LBs like AWS ALB cost ~$500–5,000/month but save significant ops effort vs. self-managed HAProxy/NGINX.

#### How will teams maintain it?

- Monitor **connection count, request rate, error rate (5xx), target health count, and p99 latency** in CloudWatch or Datadog.
- Set alerts on: unhealthy host count > 1, 5xx error rate > 0.1%, p99 latency spike > 2×  baseline.
- Regularly test failover: terminate a backend instance and verify traffic reroutes within the health check interval (typically 30 seconds).
- Review access logs for anomalies (bot traffic, sudden spikes from specific IPs).
- Use **slow-start mode** (gradually ramp new instances into rotation) to prevent cold backends from immediately receiving full traffic.
- During deployments, ensure **connection draining** is enabled so in-flight requests complete before a backend is deregistered.

#### How does it evolve in 3 years?

| Year | Evolution |
|---|---|
| Year 1 | Single regional ALB in one availability zone. Manual scaling rules. Basic HTTP health checks. |
| Year 2 | Multi-AZ ALB for high availability. Global Accelerator or Cloudflare for geographic routing. Automated autoscaling policies on backend fleet. TLS certificates automated via ACM. |
| Year 3 | Service mesh (Istio/Envoy) handles east-west (service-to-service) load balancing with mTLS, circuit breaking, and traffic shaping. External LB handles north-south (user-to-cluster) only. Canary releases, A/B routing, and weighted traffic splits done at the LB/mesh layer without code deploys. |

---

### Databases

A database provides structured, durable storage with access control and consistency guarantees.

**ACID (transaction guarantees for correctness and crash safety) guarantees:**
- **Atomicity** — A transaction succeeds entirely or not at all. (Bank transfer: deduct A and credit B must both succeed.)
- **Consistency** — Data transitions from one valid state to another. (A balance cannot go negative if the constraint disallows it.)
- **Isolation** — Concurrent transactions do not interfere. (Two users buying the last item simultaneously — only one succeeds.)
- **Durability** — Committed data survives crashes. (Data flushed to disk before acknowledging the commit.)

**SQL (the relational database language and ecosystem used by systems like Postgres and MySQL) vs NoSQL (non-relational data stores built for flexibility or scale):**

| Feature | SQL (Postgres, MySQL) | NoSQL (Cassandra, MongoDB, DynamoDB) |
|---|---|---|
| Schema | Fixed, structured | Flexible, schema-less |
| Scaling | Vertical (primarily) | Horizontal |
| Transactions | Full ACID | Eventual consistency (a model where replicas may differ briefly but converge later) (usually) |
| Query model | Rich SQL joins, aggregations | Key-value, document, or column scans |
| Best for | Financial records, user profiles, joins | High write throughput, flexible/dynamic data, global scale |

**Real-world example:** Stripe uses Postgres for its core payments ledger (ACID required) but uses Redis for rate-limit counters and DynamoDB for audit log event streams (write-heavy, no joins needed).

#### Why this architecture?

SQL databases are the right default when data has relationships, requires consistent multi-row updates, and needs complex queries. NoSQL is the right choice when write throughput exceeds what a single SQL primary can handle (typically >100K writes/second), when the data model is inherently key-based, or when global distribution with low write latency is required (Cassandra's leaderless design handles multi-region writes natively).

**Example decision point:** Instagram's user feed metadata is stored in Cassandra (high write throughput, simple key lookups), but the user's account settings are in Postgres (relational, low write volume, requires consistency).

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| Primary DB crashes | All writes fail | Automatic failover to read replica (extra copies of data on other machines) (RDS Multi-AZ: ~60s failover) |
| Slow query locks the table | All subsequent queries queue up | Query timeouts, `EXPLAIN ANALYZE`, index (extra data structures that make lookups faster) optimization |
| Disk fills up | Database crashes or becomes read-only | Monitor disk usage, set alerts at 70% and 85% |
| Replication (keeping copies of data in sync on multiple machines) lag too high | Reads from replica return stale data | Monitor `replica_lag`; route read-critical queries to primary |
| Accidental `DELETE` without `WHERE` | Entire table wiped | Point-in-time recovery (PITR); test restore procedures regularly |

#### How much will it cost?

| Setup | Monthly Cost (AWS RDS) |
|---|---|
| db.t3.medium Postgres, single AZ | ~$60 |
| db.r5.large Postgres, Multi-AZ | ~$420 |
| db.r5.4xlarge Postgres, Multi-AZ + 2 read replicas | ~$3,500 |
| Aurora Serverless v2 (scales 0.5–128 ACUs) | ~$100–5,000+ depending on load |

Storage costs $0.115/GB/month on RDS. A 1 TB database adds ~$115/month just in storage.

#### How will teams maintain it?

- **Schema migrations** via tools like Flyway or Liquibase — never modify production schemas manually.
- **Slow query log** enabled; alert on queries exceeding 500ms.
- **Weekly VACUUM and ANALYZE** on Postgres to reclaim dead row space and update planner statistics.
- **Regular restore drills** — once per quarter, restore a backup to a staging environment and verify data integrity. Undrilled backups are not real backups.
- **Connection pooling** via PgBouncer (Postgres) to avoid the DB exhausting its connection limit at scale.

#### How does it evolve in 3 years?

| Year | Evolution |
|---|---|
| Year 1 | Single Postgres primary + one read replica. Manual backups. |
| Year 2 | Aurora (Postgres-compatible) for auto-scaling storage and up to 15 read replicas. Point-in-time recovery enabled. Connection pooler (PgBouncer) added. |
| Year 3 | Read-heavy traffic migrated to a purpose-built cache (Redis). Write-heavy event streams migrated to Kafka + Cassandra. Postgres retains ownership of transactional core (orders, payments, users). Global tables (DynamoDB Global Tables or Aurora Global Database) added for multi-region read latency. |

---

### Caches

A cache is a small, fast storage layer that reduces latency and database load by serving frequently accessed data from memory.

**Cache levels:**

| Level | Example | What it caches |
|---|---|---|
| **Client cache** | Browser cache | HTML, CSS, JS, images |
| **CDN (content delivery network, edge servers that cache content near users) cache** | Cloudflare, CloudFront | Static assets served from edge nodes near the user |
| **Web server cache** | NGINX proxy cache | Full HTTP responses |
| **Database cache** | Query result cache (legacy / rare; prefer application-level caching) | Query result sets |
| **Application cache** | Redis, Memcached | DB query results, computed objects, session tokens |

**Real-world example:** Twitter uses Redis to cache pre-computed timelines for active users. Without the cache, loading a timeline would require a multi-join query across hundreds of millions of tweets and follow relationships — taking seconds per load.

#### Why this architecture?

Applications follow a **Zipfian distribution (a skewed pattern where a small set of items gets most of the traffic, often roughly 80/20)** — 80% of requests touch the same 20% of data. Caches exploit this by keeping hot data in fast memory (~100 ns access vs. ~10ms for disk). The result: a cache hit rate of 99% means only 1 in 100 requests hits the database, enabling a single DB instance to serve 100× more users.

**Example:** Facebook's Memcached deployment absorbs billions of cache reads per second, preventing those requests from ever reaching MySQL.

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| Cache node crashes | Cache miss spike → DB overloaded | Cache replication (Redis Sentinel/Cluster); graceful DB fallback with rate limiting (controlling how fast a client may send requests) |
| **Cache stampede (many requests missing the same popular key at once)** (thundering herd) | Many simultaneous misses hit DB for the same key (e.g., cache TTL (Time To Live, meaning how long cached or temporary data stays valid) expires at the same instant for a hot key (popular keys that receive far more traffic than average)) | Probabilistic early expiry; mutex locking on the first miss |
| **Stale data** | Users see outdated information | TTL-based expiry; write-through (a cache pattern where writes update cache and database together) caching; explicit invalidation on update |
| Memory eviction of hot keys | Hot-key misses cause latency spikes | Monitor eviction rate; increase cache capacity or adjust eviction policy |
| Split-brain on cache cluster | Two partitions serve different values for the same key | Quorum (the minimum number of replicas that must agree) reads in Redis Cluster |

**Real-world failure:** In 2016, a major e-commerce site experienced a cache stampede during a flash sale. All product page caches expired simultaneously, sending millions of cache misses to the DB in a few seconds. The DB collapsed. Fix: staggered TTLs with ±10% random jitter.

#### How much will it cost?

| Option | Monthly Cost |
|---|---|
| AWS ElastiCache Redis (cache.r6g.large, 1 node) | ~$120 |
| AWS ElastiCache Redis (cache.r6g.xlarge, 3-node cluster) | ~$720 |
| Self-managed Redis on EC2 (3 × r5.large) | ~$450 + ops overhead |
| Cloudflare CDN (free tier caches static assets globally) | $0–$200 |

A typical mid-scale app spends $200–$1,500/month on caching infrastructure. The ROI is immediate: eliminating DB reads avoids horizontal DB scaling costs many times larger.

#### How will teams maintain it?

- Monitor **cache hit rate** (target > 95%), **eviction rate**, **memory usage**, and **connection count**.
- Alert when hit rate drops below 90% — indicates cache is undersized or TTLs are too aggressive.
- Use Redis's `MONITOR` command sparingly (expensive) or `redis-cli --stat` for lightweight monitoring.
- For Redis Cluster, monitor **replication lag** between primary and replicas.
- Maintain a **cache warming strategy**: on new node joins, pre-populate the cache by replaying recent traffic rather than waiting for organic misses.

#### How does it evolve in 3 years?

| Year | Evolution |
|---|---|
| Year 1 | Single Redis node. Application manually invalidates cache on write. TTL-based expiry as a safety net. |
| Year 2 | Redis Cluster (sharded) for horizontal scale. Sentinel for automatic failover. Write-through caching introduced for critical entities (user sessions, product prices). |
| Year 3 | Multi-tier caching: local in-process cache (Guava, Caffeine) in front of Redis to absorb intra-service hot keys with sub-millisecond latency. CDN caches API responses for read-heavy, publicly accessible endpoints (product catalog, static content). Redis used primarily for user-specific and write-invalidated data. |

---

### File System Storage

**Block Storage** — Data organized in fixed-size blocks on disk. Used for high-performance databases and OS volumes. AWS example: EBS (Elastic Block Store). Latency: ~1ms. Not shareable across instances.

**Object Storage** — Data stored as objects (binary blob + metadata + unique key). Designed for massive horizontal scale. AWS example: S3. Latency: ~10–100ms but handles trillions of objects at petabyte scale cheaply.

**Distributed File System (DFS) properties:**

| Property | Description | Example |
|---|---|---|
| **Performance** | High throughput, low latency | GFS, HDFS |
| **Availability** | Accessible despite partial node failures | S3 (99.99% availability) |
| **Scalability** | Scales to petabytes/exabytes | S3, Azure Blob Storage |
| **Reliability** | Replication prevents data loss | S3 stores 3 copies across AZs by default |
| **Data Integrity** | Checksums and atomicity on writes | HDFS CRC verification |
| **Heterogeneity** | Stores images, video, logs, structured data | S3 stores any byte stream |

**Real-world example:** Google's Colossus (successor to GFS) stores all Gmail attachments, Google Drive files, and YouTube videos — exabytes of data, distributed across global data centers.

#### Why this architecture?

Block storage is fast but expensive and tied to a single instance. Object storage is cheap ($0.023/GB on S3 vs. $0.10/GB on EBS), globally accessible, and scales infinitely without provisioning. Any service in any region can read from S3 via an API call. This makes object storage the de facto choice for user-generated content (profile photos, video uploads, documents) and large static datasets.

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| S3 regional outage | All objects in that region temporarily inaccessible | S3 Cross-Region Replication (CRR) to a second region |
| Object deleted accidentally | Data permanently lost | S3 Versioning + MFA (multi-factor authentication, meaning more than one proof of identity) Delete; Object Lock for compliance |
| Slow upload/download speeds | Poor user experience for large files | Use presigned URLs + multipart upload for files > 100MB |
| Egress costs explode | Unexpectedly high bill | Use CloudFront CDN to serve objects — CDN-to-S3 is free; only user-to-CDN egress is charged |
| Wrong ACL set | Private objects publicly accessible | Block Public Access at account level; audit with AWS Trusted Advisor |

#### How much will it cost?

| Usage | Monthly Cost (AWS S3) |
|---|---|
| 1 TB storage | ~$23 |
| 100 TB storage | ~$2,300 |
| 1 million PUT requests | ~$5 |
| 10 million GET requests | ~$4 |
| 10 TB egress (to internet) | ~$900 |

Egress is the largest hidden cost. Serving 10 TB/month directly from S3 costs ~$900 in egress alone. Putting CloudFront in front reduces this: CloudFront-to-S3 transfer is free; users pay CloudFront pricing (~$0.085/GB), which also benefits from caching.

#### How will teams maintain it?

- Enable **S3 Storage Lens** for visibility into bucket size, access patterns, and cost by prefix (the starting characters of a word or query).
- Set **S3 Lifecycle Policies**: move objects to S3 Infrequent Access after 30 days ($0.0125/GB); move to Glacier after 90 days ($0.004/GB).
- Monitor **4xx/5xx error rates** from CloudFront or S3 access logs to detect misconfigured bucket policies or expired presigned URLs.
- Enforce **object versioning** on buckets holding critical data; test restore procedures quarterly.

#### How does it evolve in 3 years?

| Year | Evolution |
|---|---|
| Year 1 | Single private S3 bucket with signed URLs for access. Manual lifecycle management. |
| Year 2 | CloudFront CDN in front of S3. Lifecycle policies for tiered storage. Versioning enabled on production buckets. |
| Year 3 | CRR to a secondary region for DR. S3 Intelligent-Tiering for automatic cost optimization. Large media files transcoded and served via a purpose-built media CDN (e.g., AWS MediaConvert + CloudFront). |

---

### Messaging Queues

Messaging queues enable **asynchronous** communication between services. Producers write messages to the queue; consumers read and process them independently and at their own pace.

**Core components:**
- **Producer** — The service that creates and publishes messages (e.g., the Uber Ride Service publishes a `RIDE_CANCELLED` event).
- **Consumer** — The service that reads and processes messages (e.g., the Notification Service consumes `RIDE_CANCELLED` to send a push notification).
- **Broker (the system that stores and routes messages)** — The messaging infrastructure that stores and routes messages (Kafka, RabbitMQ, SQS).

**Popular implementations:** Apache Kafka, RabbitMQ, Amazon SQS, Google Pub/Sub (publish-subscribe, where one event can go to many consumers).

**Real-world example:** Uber uses Kafka to propagate all ride lifecycle events (booking, driver location updates, cancellation) between services. The booking service does not wait for the notification service — it fires the event and moves on.

#### Why this architecture?

Synchronous HTTP calls between services create tight coupling and cascading failure risk. If the Notification Service is slow or down, a synchronous call from the Booking Service would cause the booking itself to timeout. A queue decouples them: the Booking Service writes to Kafka and returns immediately; the Notification Service processes the event whenever it is ready. This provides:

1. **Temporal decoupling** — Producer and consumer do not need to be running simultaneously.
2. **Load leveling** — A burst of 1M bookings in 10 seconds can be drained from the queue over the next 30 seconds by the consumer, rather than overwhelming it instantly.
3. **Replay** — Kafka retains messages for configurable periods (days/weeks). If the Notification Service had a bug and dropped messages, you can replay the Kafka topic from a past offset.

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| Broker node crashes | Messages buffered on that node temporarily unavailable | Kafka replication factor ≥ 3; ISR (in-sync replicas, the Kafka replicas that are fully caught up) (in-sync replicas) ensures no data loss |
| Consumer crashes mid-processing | Message not acknowledged, remains in queue | At-least-once delivery; consumer must be idempotent (deduplicate by message ID) |
| Consumer falls behind (lag grows) | Messages pile up; downstream delay increases | Monitor consumer group lag; add consumer instances; alert when lag > threshold |
| Message payload too large | Broker rejects the message | Enforce payload size limits; store large payloads in S3 and pass a reference |
| Poison pill message | One malformed message crashes consumer in a loop | Dead-letter queue (DLQ) for messages failing > N retries; alert on DLQ depth |

**Real-world failure:** In 2019, GitHub's internal queue filled up due to a slow consumer, causing CI job notifications to be delayed by hours. The DLQ caught the overflow and prevented data loss; the team scaled up consumers to drain the backlog.

#### How much will it cost?

| Option | Monthly Cost |
|---|---|
| Amazon SQS (1 billion requests) | ~$400 |
| Amazon MSK (Kafka, 3 × kafka.m5.large brokers) | ~$700 |
| Self-managed Kafka (3 × r5.xlarge + 2 TB EBS) | ~$800 + ops overhead |
| RabbitMQ on CloudAMQP (startup plan) | $19–$300 |

Kafka's operational cost is dominated by **storage** (retained messages) and **replication** (3× storage). A topic retaining 7 days of data at 1 TB/day costs ~$2,100/month in storage alone on AWS MSK. Set retention policies carefully.

#### How will teams maintain it?

- Monitor **consumer group lag** per partition (Kafka's most important operational metric). Alert when lag exceeds 5 minutes of expected throughput.
- Monitor **broker disk usage** — Kafka does not auto-delete unless retention policy fires. Alert at 70%.
- Use **Kafka UI** (Conduktor, AKHQ) for topic browsing, consumer group management, and lag dashboards.
- Define **DLQ policies** for every consumer: messages that fail > 3 retries go to a dead-letter topic for manual inspection.
- Run **Schema Registry** (Confluent, AWS Glue) to enforce message schema contracts between producers and consumers, preventing deserialization errors.

#### How does it evolve in 3 years?

| Year | Evolution |
|---|---|
| Year 1 | RabbitMQ or Amazon SQS for simple async jobs (email sending, image processing). Single consumer per queue. |
| Year 2 | Kafka adopted for high-throughput event streaming (user activity, transactions). Consumer groups enable parallel processing. Schema Registry enforces contracts. |
| Year 3 | Event-driven architecture: Kafka becomes the system of record for the event log. Stream processing (Apache Flink, Kafka Streams) replaces batch jobs. Multiple downstream consumers read the same topic independently (fan-out (sending one event to many downstream targets) pattern). Kafka Connect integrates with data warehouse for analytics. |

---

### Networking

Cloud providers (AWS, Azure, GCP) provide Wide Area Networks spanning geographies. Services communicate using HTTP/HTTPS, gRPC (a binary RPC framework for fast service-to-service calls), or WebSocket protocols.
For a full treatment of DNS, TLS (the encryption layer that protects data while it travels over the network), load balancing, CDN, reverse proxies, API gateways, and common tooling, see Chapter 3.

**Key latency reference numbers:**

| Operation | Latency |
|---|---|
| L1 cache reference | 0.5 ns |
| L2 cache reference | 7 ns |
| Main memory access | 100 ns |
| SSD random read | 100 µs |
| Hard disk seek | 10 ms |
| Round trip within same datacenter | 500 µs |
| Round trip same region, different AZ | ~1–2 ms |
| Round trip cross-region (US–Europe) | ~80–100 ms |
| Round trip cross-region (US–Asia) | ~150–200 ms |
| Max memory per commodity server | ~256–512 GB |

**Why these numbers matter:** A system design choice that adds one synchronous cross-region hop adds ~100ms of latency to every user request. At 10 hops, that is 1 second added — unacceptable for a search engine or checkout flow.

Use Chapter 3 for the detailed networking stack. This section is only the latency and topology primer for the rest of the document.

### Interview Trade-Off Questions

1. When is a monolith the better engineering choice than microservices, even for a fast-growing product?
2. If a system is slow, how do you decide whether to add caching, split services, or redesign the database access pattern first?
3. When should you choose SQL over NoSQL for a new service, and what future scaling cost are you accepting?

---
## Chapter 3: Networking & Internet Fundamentals

**Goal:** Understand how a request travels from a client to a backend and back, and how each hop affects latency, reliability, security, and cost. By the end of this chapter you can trace any request end-to-end, name every component, attach a latency number and failure mode to each, and make principled design decisions about protocols, edge architecture, and retry behavior.

---

### 3.1 The Mental Model: One Request, Five Stages

When a user taps "Place Order," the phone does not talk to business logic directly. Before a single line of your application code runs, the request passes through name resolution, connection setup, edge infrastructure, and a routing layer. Understanding that path is the foundation of all networking reasoning.

The five-stage mental model to internalize:

```
Client → DNS (name resolution)
       → TCP/TLS (connection setup)
       → Edge (CDN / WAF / API gateway)
       → Routing (load balancer / reverse proxy)
       → App + Data (service, cache, DB, queues)
```

Every performance, reliability, and security question in this chapter maps to one or more of these five stages.

**Real-world example:** When a user opens `app.example.com`, DNS resolves the hostname to an edge IP. A CDN may terminate TLS and serve cached assets. An API gateway applies authentication and rate limits. A load balancer forwards the request to a healthy app instance. Static files (images, JS, CSS) never reach the app server; dynamic paths like `/checkout` continue through to origin services and databases.

---

### 3.2 Stage 1 — Name Resolution (DNS)

DNS (Domain Name System) translates a human-readable hostname into an IP address. It is the first thing that happens on every request, and it is where many outages begin.

**How it works:**
1. Client checks its local DNS cache.
2. If not cached, the OS asks a recursive resolver (usually provided by the ISP or a managed service like Route 53).
3. The resolver walks the DNS hierarchy — root → TLD → authoritative nameserver — and returns the IP.
4. The answer is cached for the TTL (Time To Live) duration.

**TTL is a trade-off:**
- Low TTL (30–60 s): faster failover and traffic shifting, but more resolver queries and slightly higher latency on cold paths.
- High TTL (5–30 min): better cache hit rate and fewer queries, but stale records can delay failover.

**Common failures:**
- DNS record drift after an IP change, leaving old records pointing at decommissioned hosts.
- Stale resolver caches during failover, causing traffic to hit dead targets long after a switch.
- Misconfigured NS or CNAME chains that break resolution entirely.

**Mitigations:** Managed DNS (Route 53, Cloudflare), staged record rollouts, automated health-check-based failover, and explicit TTL choices documented alongside every DNS change.

---

### 3.3 Stage 2 — Connection Setup (TCP, TLS, HTTP Versions)

Once DNS returns an IP, the client establishes a transport connection and negotiates encryption before any application data moves.

#### TCP and the Three-Way Handshake

TCP (Transmission Control Protocol) is a reliable, ordered, connection-oriented protocol. Before data flows, three packets must be exchanged:

```
Client → SYN    → Server
Client ← SYN-ACK ← Server
Client → ACK    → Server
```

This adds at least one round-trip time (RTT) before the first byte is sent.

#### TLS Handshake

TLS (Transport Layer Security) runs on top of TCP and adds authentication and encryption. TLS 1.3 (current standard) requires one additional RTT after the TCP handshake. TLS 1.2 required two.

A **TLS session ticket** lets a client skip the full handshake on reconnection (0-RTT or 1-RTT resumption), which is why warm connections are dramatically cheaper than cold ones.

#### HTTP Versions and Their Impact on Connection Cost

| Version | Transport | Key behavior | When to prefer |
|---|---|---|---|
| HTTP/1.1 | TCP | One request per connection unless pipelined; keep-alive reuses the TCP connection | Legacy or very simple deployments |
| HTTP/2 | TCP | Multiplexes many requests over one connection; header compression | Most modern web traffic |
| HTTP/3 / QUIC | UDP | Multiplexes streams; better head-of-line blocking; faster handshake and loss recovery | Mobile clients, lossy networks |

**Practical rule:** HTTP/2 with connection pooling eliminates most of the per-request TCP + TLS overhead on warm paths. HTTP/3 helps most for mobile users on unreliable networks.

**Common failures:**
- No keep-alive → every request pays a full TCP + TLS handshake cost.
- Expired TLS certificate → HTTPS fails entirely for all users hitting that endpoint.
- Too many new connections per second → TLS CPU spikes on the server side.

---

### 3.4 Stage 3 — Edge Infrastructure (CDN, WAF, DDoS Protection)

Edge infrastructure sits geographically close to users. Its job is to absorb as much traffic as possible before it ever touches your origin servers.

#### CDN (Content Delivery Network)

A CDN caches responses at dozens or hundreds of Points of Presence (PoPs) worldwide. When a user in Tokyo requests a file, they get it from a Tokyo PoP rather than your US-East origin — reducing latency from ~150 ms to ~5 ms.

**What CDNs are good at:**
- Static assets: images, JS, CSS, fonts, videos.
- Publicly cacheable API responses (product listings, config).
- Origin shielding: a single PoP forwards cache misses to origin, preventing thundering-herd misses.

**What CDNs are bad at:** Per-user or session-specific data. Never cache responses that include user-specific content unless you're using very deliberate cache-key variations.

**Cache key mistakes** are a common source of incidents:
- Forgetting to vary by `Accept-Encoding` → some users get garbled compressed content.
- Caching a response that contains a session token → user A sees user B's data.

#### WAF and DDoS Protection

A WAF (Web Application Firewall) inspects request content for attack signatures — SQL injection, XSS, path traversal. A DDoS (Distributed Denial of Service) protection layer absorbs volumetric attacks (floods of traffic) before they reach origin.

These layers belong at the edge. If they sit inside your network, attack traffic still crosses the internet to reach you.

---

### 3.5 Stage 4 — Routing Layer (API Gateway, Load Balancer, Reverse Proxy)

These three components are frequently confused because they all sit between the internet and your application. The distinction is **what decision each one makes**.

#### API Gateway

An API gateway is the policy enforcement point for your API surface.

**Owns:** AuthN/AuthZ, rate limiting, request normalization, routing by path or header, observability (request logging, tracing), quota enforcement.

**Does not own:** Business logic, pricing, inventory, or any domain-specific behavior. Every time you put a business rule in the gateway, a product change requires an infrastructure deployment.

#### Load Balancer

A load balancer distributes traffic across multiple healthy instances of a service.

**Layer 4 (L4) load balancing** operates at the TCP/UDP level: it routes connections based on IP and port without inspecting HTTP content. Very fast, no HTTP awareness.

**Layer 7 (L7) load balancing** inspects HTTP headers, paths, and cookies. Enables content-based routing, sticky sessions, and health checks against real endpoints.

**Health checks** are what make load balancers valuable during incidents. A load balancer that drains an unhealthy instance before users notice is doing its job. A load balancer with a poorly configured health endpoint (one that always returns 200 regardless of actual health) is a liability.

**Load balancing algorithms:**
- Round-robin: simple, works well when instances are uniform.
- Least-connections: routes to the instance with the fewest active connections — better for long-lived requests.
- Consistent hashing: routes requests for the same key to the same instance — useful for cache locality.

#### Reverse Proxy

A reverse proxy manages HTTP connection behavior between clients and backends.

**Owns:** TLS termination, connection pooling to upstreams, buffering, compression, header rewriting, connection timeout management.

A reverse proxy is infrastructure, not application code. The moment it starts making routing decisions based on business state, it becomes a hidden application layer — which creates operational problems because changes require infrastructure deployments and ownership is unclear.

#### Responsibility Boundary Summary

| Component | Primary job | Good responsibilities | Avoid |
|---|---|---|---|
| CDN | Serve cacheable content close to users | Static asset delivery, origin shielding | Per-user business logic |
| WAF / DDoS | Protect origin from hostile traffic | Signature rules, IP reputation, bot filtering | Application-specific authorization |
| API gateway | Enforce policy at API entry | AuthN/AuthZ, rate limits, routing, observability | Domain logic (pricing, inventory) |
| Reverse proxy | Manage HTTP connection behavior | TLS termination, compression, header rewriting | Becoming a hidden application layer |
| Load balancer | Spread traffic across healthy targets | Health checks, upstream selection, failover | Deep request interpretation |

---

### 3.6 Stage 5 — Application and Data Path

Once the request reaches a healthy app instance, the service executes:

1. **Authentication check** — validate the token or session.
2. **Cache lookups** — check Redis or Memcached before hitting the DB.
3. **DB queries** — reads and writes to the primary datastore.
4. **Downstream service calls** — RPC or HTTP calls to dependent services.
5. **Response shaping** — serialize, compress, set `Cache-Control` headers.

The most expensive mistakes here are architectural, not code-level:

- **Fan-out without batching:** calling five downstream services sequentially adds their latencies in series. If you can call them in parallel, you pay only the slowest one.
- **N+1 queries:** fetching a list then querying per item in a loop. One query with a join or batch fetch is almost always faster.
- **Missing or wrong cache headers:** every response that should be cacheable but isn't adds origin load and user latency.

---

### 3.7 Latency — Budgeting and Reasoning

Latency is additive. Understanding where time goes is more useful than saying "it's slow."

#### Typical Latency Numbers (Warm Path)

| Hop | Typical latency | Why it exists |
|---|---|---|
| Client → edge (same region) | 5–30 ms | Physical distance and network quality |
| API gateway / reverse proxy | 1–10 ms | TLS termination, routing, policy checks |
| App service | 5–50 ms | Business logic, serialization, auth decisions |
| Local cache (Redis, Memcached) | 0.5–2 ms | Hot-read acceleration |
| Indexed DB query | 1–10 ms | Transactional storage |
| Cross-region synchronous call | 80–150+ ms | Geography, not code quality |

#### Latency Budget Example: Checkout

| Component | Latency |
|---|---|
| DNS + TLS (cold connection) | 15 ms |
| Gateway + proxy hops | 10 ms |
| Application logic | 35 ms |
| DB + cache operations | 40 ms |
| One downstream service call | 30 ms |
| **Total** | **~130 ms** |

**Key insight:** One synchronous cross-region call (80–150 ms) can blow the entire budget for a user-facing flow. Removing a hop is usually more valuable than micro-optimizing an existing query by a few milliseconds.

**Tail latency compounds.** If three independent services each have a p99 of 50 ms, a request requiring all three will see a p99 much higher than 50 ms — because it needs the worst outcome from each service simultaneously.

---

### 3.8 Protocol Selection

| Scenario | Default choice | Why | Main cost |
|---|---|---|---|
| Public web/mobile API | HTTPS + REST | Broad compatibility, simple tooling, easy debugging | Larger payloads, weaker contracts than gRPC |
| Internal low-latency service call | gRPC over HTTP/2 | Strong contracts, binary payloads, multiplexing | Browser compatibility, steeper tooling curve |
| Real-time bidirectional updates | WebSocket | Persistent connection, server push | Connection lifecycle and scaling complexity |
| Unreliable networks / connection churn | HTTP/3 / QUIC | Faster loss recovery, better handshake | Newer tooling, less operational maturity |
| Fire-and-forget or decoupled work | Message queue / event bus | Async buffering, independent scaling | Eventual consistency, replay complexity |

**The rule:** use synchronous protocols when the caller needs the answer immediately. Use asynchronous messaging when the caller only needs the work to happen eventually.

---

### 3.9 Retries, Timeouts, and Failure Handling

Retries are the most dangerous tool in distributed systems. Used correctly, they recover from transient failures. Used incorrectly, they turn a degraded system into a dead one.

#### Timeouts

Every network call must have a timeout. Without one, a slow downstream service can exhaust your thread pool or connection pool, taking your service down too.

Set timeouts at the call site, not just at the edge. A gateway timeout of 30 s is useless if the downstream service holds a DB connection for 60 s on every slow request.

#### Retry Policy

- **Where to retry:** pick one or two layers (typically the client and one gateway layer). Retries at every layer multiply traffic exponentially during an incident.
- **What to retry:** only idempotent or safe operations. Never blindly retry a POST that creates a record.
- **How to retry:** exponential backoff with jitter. Pure exponential backoff causes synchronized retry bursts ("thundering herd"); jitter spreads them out.
- **Retry budget:** limit the fraction of requests that can be retried per time window. If 30% of your traffic is retries, stop and investigate rather than retry more.

#### Circuit Breaker

A circuit breaker tracks the error rate to a downstream service. When errors exceed a threshold, it "opens" — rejecting calls immediately rather than waiting for timeouts. This protects both the caller (fast failure) and the downstream (reduced load during degradation).

States: **Closed** (normal, calls pass through) → **Open** (errors exceeded threshold, calls fail fast) → **Half-open** (probe traffic to test recovery).

---

### 3.10 Failure Modes and Mitigations

| Failure | Impact | Mitigation |
|---|---|---|
| DNS misconfiguration | Traffic blackholed or sent to wrong targets | Managed DNS, staged rollouts, TTL discipline |
| TLS certificate expiry | HTTPS fails at edge or origin | Automated renewal, expiry alerting |
| CDN cache-key mistake | Stale data served to wrong users, or origin overloaded | Cache-key audits, `Cache-Control` tests, purge tooling |
| Gateway policy mistake | Auth or routing outage for many endpoints | Config as code, canary rollout, fast rollback |
| Proxy or LB overload | 5xx, connection resets, rising tail latency | Autoscaling, connection limits, overload protection |
| Retry storm | Cascading failure amplifies already-degraded traffic | Retry budgets, exponential backoff, jitter, circuit breakers |
| WebSocket drops during deploys | Real-time feature instability, reconnect spikes | Graceful draining, jittered reconnect logic |
| Cross-region call on user path | Sudden 100–300 ms latency increase | Keep critical flows region-local; use async replication |

**The pattern to remember:** networking outages usually come from control-plane mistakes — bad DNS, expired certs, misconfigured gateways, or broken retry policies — not raw bandwidth problems.

---

### 3.11 Common Traffic Flows

These five patterns cover the vast majority of real-world networking problems:

- **Browser → web app:** `DNS → CDN → reverse proxy → app server → database`
- **Mobile app → backend API:** `DNS → API gateway → load balancer → service`
- **Internal service call:** `service mesh` or `direct gRPC → backend service`
- **Real-time feed:** `client opens WebSocket → server pushes events`
- **Large file upload:** `client → presigned URL → object storage directly` (never route large uploads through app servers)

The last pattern is the most commonly missed. Routing a 2 GB video upload through your application fleet is both expensive and fragile.

---

### 3.12 Design Decisions and Trade-Offs

#### Where to Terminate TLS
Edge termination simplifies origin services and is the default. Re-encryption from edge to origin adds CPU and latency but improves security posture inside the cluster. Required in high-compliance environments.

#### How Many Synchronous Dependencies Are On-Path
Every synchronous dependency adds latency and failure coupling. A checkout request that needs auth, feature flags, pricing, and recommendations before it can respond has become fragile. Move non-critical dependencies off the critical path (async or pre-fetched).

#### Cache Aggressiveness
Longer TTLs reduce origin cost but risk serving stale content. Dynamic APIs need deliberate cache keys, explicit `Cache-Control` headers, and a tested invalidation path. "No cache" is rarely the right answer — it usually means someone never thought about it.

#### Where Rate Limits Live
Coarse per-client limits belong at the edge or gateway. Fine-grained per-operation limits belong in the service that knows which operations are expensive. Doing fine-grained limiting at the gateway means the gateway must understand your domain, which is an ownership problem.

#### Cold Path vs. Warm Path
Warm connections and warm caches look excellent in benchmarks. Mobile clients, cold starts, blue-green deploys, and regional failovers all hit the cold path. Design and test for it explicitly.

---

### 3.13 Operations, Cost, and Evolution

#### Key Metrics to Track

- Gateway and LB: p95/p99 latency, 4xx/5xx rates, connection counts, unhealthy target count.
- CDN: cache hit ratio, origin shield effectiveness, egress spend.
- DNS: failover propagation time, resolver error rate.
- Certificates: days until expiry, renewal success/failure rate.

#### Cost Drivers

| Component | What drives cost |
|---|---|
| DNS | Query volume and failover frequency |
| CDN | Egress bandwidth and cache hit rate |
| Load balancer | Requests, open connections, cross-zone traffic |
| API gateway | Request volume, auth feature usage, logging |
| TLS | CPU overhead on handshakes, certificate automation |

The biggest hidden costs are: low CDN cache-hit rates (all traffic hits origin), cross-zone or cross-region traffic from poor instance placement, and retry-amplified duplicate traffic.

#### Evolutionary Path

| Stage | Typical setup |
|---|---|
| Early | Single-region: managed DNS, one LB/gateway path, basic CDN |
| Growing | WAF, mature gateway policies, gRPC for hot internal paths, explicit cache strategy |
| Scale | Multi-region routing, failover automation, service mesh for east-west traffic, edge compute for latency-sensitive features |

---

### 3.14 Mini Case Study: "Checkout Is Slow"

**Symptom:** p99 checkout latency doubled from 450 ms to 900 ms overnight.

**Investigation:**
1. CDN and edge metrics are stable — the slowdown is not a cache or internet problem.
2. Gateway p99 increased at the same time a new auth policy deployed.
3. The new policy does synchronous token introspection on every request; the downstream auth service now shows high tail latency and elevated retry counts.

**Fix:**
- Cache token introspection results at the gateway for 30–60 s (most tokens are valid for hours).
- Add a timeout and degrade gracefully for non-critical auth metadata fields.
- Reduce the number of synchronous calls the gateway makes per request.

**Lesson:** "The network is slow" is almost never about packets. It is almost always about dependency shape — too many synchronous calls on the critical path.

---

### 3.15 Interview Checklist and Trade-Off Questions

#### Before Finishing a Networking Answer, Cover:

1. The request path from client to data store (all five stages).
2. Latency budget with rough numbers per hop.
3. Where caching happens and how invalidation works.
4. Which layer owns auth, rate limits, routing, and retries.
5. The main failure modes and how the design degrades gracefully.
6. Metrics and ownership for each networking layer.

#### Trade-Off Questions

---

**1. When would you choose gRPC over REST for a service boundary, and what compatibility cost does that bring?**

Choose gRPC when two internal services are calling each other at high frequency and you control both ends. The benefits — binary Protobuf payloads (typically 3–10x smaller than JSON), HTTP/2 multiplexing, and strongly-typed generated clients — matter most for high-throughput or latency-sensitive internal paths.

The costs are real: browser clients cannot call gRPC directly without a transcoding proxy (grpc-gateway or Envoy); debugging is harder because payloads are binary, not human-readable; and onboarding new engineers takes longer because they must understand `.proto` files and the code-generation toolchain.

**Rule of thumb:** gRPC for internal service-to-service calls on hot paths. REST + JSON for anything a browser, mobile app, or external partner must call directly. The public API surface should remain REST unless you have a very specific reason otherwise.

---

**2. Global users have high latency — do you add a CDN, move compute closer, or remove synchronous hops? How do you decide?**

Diagnose before acting. The right fix depends on where time is actually being spent:

- If the slow path is **static assets or publicly cacheable responses** — add a CDN. A user in Singapore should not be fetching a JS bundle from US-East on every page load. A CDN fix is low-risk and often gives the biggest improvement for the least effort.
- If the slow path is **dynamic, user-specific, or write-heavy** (login, checkout, personalized feed) — a CDN helps little. The request must reach origin regardless of cache. Here you should look at whether the origin region is far from the user. If so, multi-region deployment or read replicas closer to the user is the answer.
- If the latency is high even for users near the origin — look at the number of synchronous hops. A checkout flow that calls auth → pricing → inventory → recommendations in series before responding will be slow no matter where the servers are. Removing or parallelizing those hops often saves more than any infrastructure change.

**Decision order:** CDN for cacheable content → remove or parallelize synchronous hops → move compute closer for unavoidably dynamic flows.

---

**3. Where should retries live — client, gateway, or service — and how do you prevent retry amplification during an incident?**

Retries can live at multiple layers, but each layer that retries multiplies traffic during an incident. If the client retries 3×, the gateway retries 3×, and the service retries 3×, a single failed request becomes up to 27 attempts against an already-struggling downstream.

**Recommended approach:**
- **Client:** retry for network errors and 5xx responses, with exponential backoff and jitter. This handles transient failures the user experiences directly.
- **Gateway:** optionally retry once for connection failures to upstream services, but only for idempotent operations. Never retry blindly.
- **Service:** retry downstream calls (e.g., a DB read) only at the point that understands idempotency. Do not add a retry layer at every service boundary.

**Preventing amplification:**
- Use a **retry budget**: cap the percentage of total requests that can be retries (e.g., no more than 10% of traffic). If retries exceed the budget, stop retrying and fail fast.
- **Jitter** (randomizing backoff timing) prevents synchronized retry bursts from all clients hitting a recovering service at the same moment.
- **Circuit breakers** cut off retries entirely when a downstream is clearly unhealthy, giving it time to recover rather than hammering it.

---

**4. Should a gateway fail open or fail closed when the auth service is unreachable? What does each choice cost you?**

This is a product and risk question, not purely a technical one. There is no universally correct answer.

**Fail closed** (reject all requests when auth is unreachable): maximizes security — no unauthenticated request ever reaches your services. The cost is availability: if the auth service goes down, your entire product goes down with it. This is the right default for anything involving money, private data, or regulatory compliance.

**Fail open** (allow requests through when auth is unreachable, possibly with reduced claims): maximizes availability — users keep working during an auth outage. The cost is security: some requests that should be rejected will be allowed through. This can be acceptable for low-risk, read-only, or public endpoints where the cost of a brief auth bypass is lower than the cost of a full outage.

**Practical middle ground:** fail closed by default, but design auth to be highly available (multiple instances, regional redundancy, short-lived cached tokens at the gateway). For specific low-risk endpoints (public content, health checks), explicitly mark them as auth-exempt rather than failing open globally.

---

**5. A new team wants to put feature-flag logic into the API gateway. What argument do you make for or against it?**

**Against (the usual right answer):** Feature flags are a product and application concern, not an infrastructure concern. Putting them in the gateway means:
- Every flag change requires an infrastructure deployment or a gateway config change, which typically has a slower, more guarded release process than an application deployment.
- The gateway team becomes a dependency for product engineers who want to ship quickly.
- Debugging becomes harder — production behavior is now split across gateway config and application code.
- It sets a precedent. Once one team adds feature-flag logic to the gateway, others follow, and the gateway gradually becomes a hidden application layer that nobody fully owns.

**When it might be acceptable:** Coarse traffic routing (send 10% of traffic to a new service version for a canary) is a legitimate gateway concern — that is routing policy, not application logic. The key distinction is whether the flag controls *which service handles the request* (gateway's domain) or *what the service does with it* (application's domain). If the team's feature flag is really just a canary routing rule, the gateway is the right place. If it changes application behavior based on user attributes, it belongs in the application.

---

## Chapter 4: Microservice Architecture

### What Is a Microservice? (Start Here)

Imagine a restaurant. A monolith is one person who takes orders, cooks, plates, and handles payment — fast to start, hard to scale when busy. A microservice architecture is a kitchen divided into stations: host, chef, pastry, cashier. Each station can be staffed independently, upgraded, and swapped without shutting down the others.

A **microservice** is a small, independently deployable unit of software that owns one focused business capability and its own data. Services communicate over a network — typically HTTP/REST, gRPC, or an event bus like Kafka.

This is different from how most applications start. Understanding the spectrum of architectures helps you decide *when* to use microservices — and when not to.

### The Architecture Spectrum: Monolith → SOA → Microservices

| Architecture | What it is | Deploy unit | Scaling | DB ownership | Best for |
|---|---|---|---|---|---|
| **Monolith** | One codebase, one deployable | Entire app | Vertical (bigger servers) | One shared DB | Teams < 10, early-stage products |
| **Modular Monolith** | One codebase, strictly separated internal modules | Entire app | Vertical | One shared DB (with schema namespacing) | Growing teams that want boundaries without ops overhead |
| **SOA** | Coarse-grained services sharing an Enterprise Service Bus (ESB) | Per service | Per service | Shared or per service | Legacy enterprise integration |
| **Microservices** | Fine-grained, single-responsibility services, each owning its data | Per service, independent | Per service, horizontal | One DB per service | Large orgs, 20+ engineers, high scale |

**Real-world journey:** Amazon started as a Perl monolith in 1994. By 2002, Jeff Bezos issued a mandate: all internal teams must expose functionality through service interfaces. Today, a single Amazon product page makes 100+ service calls — pricing, reviews, inventory, recommendations, advertising — all independently deployed and scaled.

**The key insight:** Microservices are not a goal. They are a solution to specific scaling and team coordination problems. A small startup should almost always start with a monolith and extract services when the pain of coupling becomes real.

### When to Split: Choosing the Right Architecture

The inflection point is almost always about *people* before it is about *technology*.

Split a service when:
- Two teams are constantly blocked waiting on each other to deploy.
- One component needs to scale at 100× the rate of everything else (e.g., search vs. billing).
- A piece has a clearly distinct change cadence and data model.
- An SLA boundary requires separate failure isolation (e.g., payments must stay up even if recommendations crash).

Do **not** split when:
- Two pieces of logic always need to commit atomically — splitting them creates a distributed transaction problem.
- The "service" would be so small it spends more time on network overhead than actual work (nanoservice anti-pattern).
- The team is fewer than 8–10 engineers — operational overhead will outweigh independence gains.

**Cost reality check:** A comparable monolith might cost $500/month to run. The microservices equivalent starts at $2,000–$5,000/month due to per-service databases, CI/CD pipelines, and observability tooling. The crossover where efficiency gains justify costs typically happens around 20–30 engineers or 5M+ users.

---

### Drawing Good Service Boundaries

The hardest part of microservices is not containers or Kubernetes. It is finding boundaries that remain stable as the product grows.

Good boundaries align on five signals:

1. **Business capability** — one service owns one coherent domain: identity, catalog, checkout, search. Not a technical layer like "API layer" or "data layer".
2. **Data ownership** — the service is the single source of truth for its state. No other service writes directly to its database.
3. **Change cadence** — the team can evolve code and schema without coordinating with other teams week to week.
4. **Scaling profile** — components with drastically different traffic patterns deserve separate scaling boundaries.
5. **Transaction boundary** — if two operations must always succeed or fail together, keep them in the same service.

**Warning signs of bad boundaries:**
- Every page render fans out through 6+ services in series → split is too chatty.
- Every feature requires schema changes across 4 databases → boundaries are not independent.
- One "user service" owns identity, profiles, privacy, social graph, and billing → boundary is too broad.

**Real-world example:** Uber's early architecture had a monolithic "uber-api" service. As it grew, they split into ~2,200 microservices. But they over-split: teams couldn't understand the system, and cascading failures became common. By 2020 they began consolidating into "domain-oriented microservices" — fewer, larger services organized around business domains.

---

### Five Principles That Make Microservices Work

Microservices are not just an architectural pattern — they require a set of engineering practices to be operationally sustainable. These five principles work together: skip one, and the others degrade.

#### Principle 1: Domain-Driven Design — Boundaries That Match Business Reality

Domain-Driven Design (DDD) is the practice of structuring software around the business domains it serves, so that service boundaries align with how teams actually think and work.

The central concept is a **bounded context** — a clearly delimited part of the system with its own vocabulary, data model, and team ownership. The same word can mean different things in different contexts:
- In the **Sales context**, a `Customer` is a prospect with a pipeline stage and a deal value.
- In the **Support context**, a `Customer` is a user with open tickets and an SLA tier.

These two services should model `Customer` independently. They share only what is necessary through a defined API contract — not a shared database table.

**Credit card processing example:** A payment platform has three clearly distinct bounded contexts:
- **Payment Subdomain** — online transaction processing (authorize, capture, void).
- **Merchant Subdomain** — merchant onboarding, acceptance workflow, risk scoring.
- **Accounting Subdomain** — end-of-day clearing, reconciliation, settlement.

These have different data models, different regulatory requirements, and different change rates. Merging them into one service couples unrelated concerns.

**Real-world example:** Stripe's public API is domain-driven — `/charges`, `/subscriptions`, `/customers`, `/invoices` each correspond to an internal bounded context with its own team, data store, and deployment pipeline. The fact that these surface as clean API endpoints is a side effect of good domain boundaries internally.

**Conway's Law:** "Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations." If your payments team and your fraud team are separate, your architecture will naturally evolve to reflect that. DDD makes this intentional rather than accidental.

**Pitfalls:**
- **Too-early splitting** — Merging `Order` and `Inventory` contexts and then splitting them after 18 months of data coupling is expensive. Start with a modular monolith if the boundaries are unclear, and extract services once the boundaries are proven stable in production.
- **Boundaries drawn by technical layer** (e.g., "frontend service", "backend service") rather than business capability — leads to services that always deploy together, defeating independence.

Bounded contexts evolve. A single `Orders` service often splits into `OrderCreation`, `OrderFulfillment`, and `OrderReturns` as teams discover distinct ownership and change rates. Run **event storming workshops** — bring product, engineering, and business onto a whiteboard to map domain events, commands, and aggregates. This surfaces boundaries before they become expensive to change.

#### Principle 2: Automate Everything — From Code to Production

A monolith with 10 engineers has one deployment pipeline. A microservices system with 50 services needs 50. Manual processes do not scale here — automation is not optional.

**Three automation layers:**
- **Infrastructure as Code (IaC)** — Terraform, Pulumi, AWS CDK. Infrastructure is version-controlled. Spinning up a staging environment is `terraform apply`, not two weeks of ticketing. Eliminates "works in staging, broken in production" drift.
- **Continuous Integration (CI)** — Tests run on every pull request. A broken build in the Payments service does not block the Reviews team.
- **Continuous Delivery (CD)** — Spinnaker, Harness, GitLab CI/CD. Each service deploys independently. Canary deployments (route 5% of traffic to the new version, check error rates, then ramp to 100%) catch regressions before they hit all users.

**Real-world example:** Netflix deploys hundreds of times per day across thousands of microservices. A single engineer can safely push a change to a service serving 250M users. Their Spinnaker pipeline runs automated smoke tests, checks error rates and latency against baselines, and rolls back automatically if thresholds are breached — all without a human in the loop.

**Common failures and mitigations:**

| Failure | Impact | Mitigation |
|---|---|---|
| Slow CI pipeline (>15 min) | Engineers skip running tests locally; PRs pile up | Parallelize test stages; cache dependencies; target <10 min end-to-end |
| Flaky tests | False alarms erode trust in the pipeline | Track flaky test count as a team metric; fix or quarantine within 48h |
| Terraform state corruption | IaC cannot reconcile with real infrastructure | Remote state with locking (S3 + DynamoDB); never edit state files manually |
| CD deploys bad code to 100% | Full production regression | Canary with automated rollback on P99 latency or error rate breach |

**Maturity progression:**

| Stage | Capability |
|---|---|
| Year 1 | CI on every PR (tests, lint, build). Manual CD via Slack bot or button click. |
| Year 2 | Automated canary deployments (5% → 25% → 100%). Automated rollback. IaC for all infrastructure. DORA metrics tracked. |
| Year 3 | Self-service developer platform — engineer pushes code, automation handles test, build, deploy, monitor, rollback. Progressive delivery with feature flags (LaunchDarkly). |

#### Principle 3: Encapsulation — Hide Internals, Expose Contracts

Each service is a black box. It exposes behavior through a versioned API and hides everything else: its database schema, business logic, caching layer, and internal data models.

**The shared database anti-pattern:** When two services share a database table, any schema change — renaming a column, adding a NOT NULL constraint, changing a data type — requires coordinating deployments across both services simultaneously. You lose independent deployability entirely. This is the most common way microservices teams accidentally rebuild a distributed monolith.

**Good design in practice:**
- The Orders service owns the `orders` database. Inventory reads order state only through `GET /orders/{id}`, never by joining directly.
- The Support API returns `{ user_id, ticket_count, sla_tier }` — not the full internal user record with fields that belong to Sales or Finance.
- API response schemas explicitly allowlist fields. Internal database models are never passed directly to serializers.

**Real-world example:** Shopify's merchant API has exposed `/orders` since 2007. In that time, Shopify has moved the underlying storage from MySQL shards to a Vitess cluster, added Kafka for event streaming, and introduced a data warehouse layer — none of which broke the thousands of apps built on the API. The contract was stable even as the internals changed completely.

#### API Contracts and Schema Evolution

Schema changes are the most common source of silent production breakage in microservice systems. The rules are simple:

1. **Additive changes are safe.** Adding a new optional field to a JSON response or Protobuf message does not break existing consumers that ignore unknown fields.
2. **Removing or renaming fields is breaking.** A consumer relying on `user.email_address` breaks silently if it becomes `user.email`. Deprecate with a 30–90 day grace window before removal.
3. **Type changes are breaking.** Changing `int` to `string`, or adding null-ability, breaks deserialization for all consumers. Always introduce a new API version.

**Safe migration: the expand-contract pattern**
1. **Expand:** Add the new field alongside the old one. Both exist in the response simultaneously.
2. **Migrate:** Update all consumers to read from the new field. Verify in production.
3. **Contract:** Remove the old field once every consumer has deployed.

For event schemas on Kafka or other message buses, use a **Schema Registry** (Confluent Schema Registry, AWS Glue) that enforces compatibility rules — `BACKWARD`, `FORWARD`, or `FULL` — before a producer can publish a new schema version. This acts as a gate: a bad schema change is rejected at publish time, before it can reach any consumer.

**Tooling:**
- **OpenAPI / Swagger** — document and machine-validate REST API request/response schemas.
- **Pact (consumer-driven contract tests)** — consumers publish what they expect; the provider's CI pipeline runs these contracts before every deploy. A provider can never ship a breaking change without first knowing which consumers it would break.

#### Principle 4: Decentralization — Team Autonomy with Shared Rails

In a microservices organization, no single central team should be a bottleneck for all infrastructure changes or technology decisions. Autonomy is what makes independent deployability real in practice.

**Two levels of decentralization:**
- **Self-service infrastructure** — teams provision resources via cloud consoles and IaC without waiting for central IT approvals. A team needing a new database or message queue creates it in minutes from a Terraform module, not days through a ticketing system.
- **Polyglot technology choices** — teams pick the right tool for the job. The recommendations team uses Python and a graph database. The payments team uses Java and PostgreSQL. Cross-cutting standards (API design, security policies, observability) are enforced through shared libraries and automated checks, not mandates.

**Real-world example:** Spotify's squad model — each squad owns its domain end-to-end (backend, frontend, data). Guilds (cross-squad communities of practice) share standards organically without top-down enforcement. A chapter lead for backend engineering sets norms through example, not approval gates.

**The balance to maintain:**
- **Technology fragmentation risk** — without any governance, teams end up with 15 different messaging systems and no ability to share data across them. Solution: a technology radar (Thoughtworks-style) with four rings: Adopt, Trial, Assess, Hold. Teams can use "Trial" technologies; "Hold" technologies require an exception process.
- **Security inconsistency** — teams implement auth differently, some incorrectly. Solution: shared auth middleware or a sidecar proxy (mTLS via Istio service mesh) so no team implements authentication from scratch.

#### Principle 5: Smart Endpoints, Dumb Pipes — Keep Logic in Services

Business logic belongs inside services, not in the communication infrastructure between them.

**The SOA mistake (ESB anti-pattern):** Enterprise Service Bus architectures put routing logic, data transformation, validation, and business rules inside the bus. A small business rule change requires touching the ESB — owned by a central integration team with a 6-week change window. Every service becomes coupled to this shared infrastructure layer.

**The microservices model:** Kafka or an HTTP gateway is a dumb pipe. It moves bytes from A to B without understanding them. The consuming service applies all logic. This means:
- Changing how the Billing service processes a `VIDEO_PLAYBACK_STARTED` event requires only deploying the Billing service — not touching Kafka, not notifying the Analytics team.
- Adding a new consumer (e.g., a Fraud Detection service) requires only subscribing to the existing topic — no changes to producers or infrastructure.

**Real-world example:** Netflix emits `VIDEO_PLAYBACK_STARTED` to a Kafka topic. At least four services consume it independently: Analytics (for viewing statistics), Recommendations (to update the user model), Billing (for pay-per-view accounting), and Personalization (to update "continue watching"). None of this logic lives in Kafka — it lives in each service, independently maintained and deployed.

**Watch out for logic duplication:** If multiple services implement the same transformation independently, they drift over time. Use a shared library for truly cross-cutting logic (e.g., a shared auth token validation library). But apply sparingly — shared libraries create compile-time coupling between teams.

---

### Cross-Cutting Concerns: What Every Microservice Needs

Once you have more than a handful of services, certain infrastructure problems appear universally. These are not domain concerns — they are the "rails" that keep the system operable.

#### Service Discovery and the API Gateway

With dozens of services, clients cannot hardcode IP addresses. Two patterns handle this:
- **Service registry** (Consul, Eureka, Kubernetes DNS) — services register on startup; clients look up addresses at runtime.
- **API Gateway** (Kong, AWS API Gateway, Nginx) — a single entry point for external traffic. The gateway handles routing, authentication, rate limiting, and SSL termination, so each service does not need to implement these itself.

**Example:** A mobile app calls `api.example.com/checkout`. The API gateway authenticates the request, rate-limits it, routes it to the Checkout service, and strips the internal JWT before forwarding — the Checkout service receives a clean, pre-authenticated request.

#### Observability: Distributed Tracing, Metrics, and Logs

In a monolith, a slow request shows up in one log file. In microservices, a single user request fans out across 5–10 services — and any one of them could be the bottleneck.

Three pillars of observability:
- **Distributed tracing** (Jaeger, Zipkin, AWS X-Ray) — a trace ID propagates through every service call in a request. When a user reports "checkout is broken," you pull the trace and see the exact call graph with per-service latency.
- **Metrics** (Prometheus + Grafana) — per-service error rate, latency (P50/P95/P99), and throughput. Alert when a service's P99 latency exceeds its SLO.
- **Centralized logging** (ELK stack, Datadog) — all service logs ship to one place, tagged with trace IDs so you can pivot from a trace to the raw logs for that request.

**SLOs and ownership:** Every service should have a named owner, a defined SLO (e.g., 99.9% availability, P99 latency < 200ms), and an on-call rotation. Without these, incidents become a blame game instead of a structured response.

#### Inter-Service Communication: Sync vs. Async

Services communicate in two fundamentally different ways, each with different failure modes:

| Pattern | Technology | When to use | Risk |
|---|---|---|---|
| **Synchronous (request-reply)** | HTTP/REST, gRPC | Caller needs an immediate response (e.g., price lookup for checkout) | Cascading failures: if Inventory is slow, Checkout slows too |
| **Asynchronous (event-driven)** | Kafka, SQS, RabbitMQ | Caller does not need an immediate response (e.g., send confirmation email after order placed) | Eventual consistency: downstream services may be temporarily behind |

**Circuit breaker pattern:** For synchronous calls, wrap downstream calls in a circuit breaker (Resilience4j, Hystrix). If the Inventory service starts failing, the circuit "opens" and Checkout immediately returns a fallback response (e.g., assume in stock) rather than waiting for timeouts. This prevents one slow service from cascading into a full system outage.

#### Distributed Transactions: The Saga Pattern

In a monolith, placing an order is a single database transaction: deduct inventory, charge the card, create the order — atomic, all-or-nothing. In microservices, these three operations span three separate services with three separate databases. There is no global transaction coordinator.

The **Saga pattern** solves this by replacing one atomic transaction with a sequence of local transactions, each publishing an event or calling the next service. If any step fails, the saga executes **compensating transactions** to undo the completed steps.

**Order placement saga example:**
1. Order Service creates order (status: `PENDING`) → emits `ORDER_CREATED`.
2. Inventory Service reserves stock → emits `INVENTORY_RESERVED`. On failure: emits `INVENTORY_FAILED`.
3. Payment Service charges card → emits `PAYMENT_SUCCESS`. On failure: emits `PAYMENT_FAILED`.
4. Order Service updates status to `CONFIRMED`.

If Payment fails at step 3, the saga runs compensation: release the inventory reservation (step 2 reversal), then cancel the order (step 1 reversal). The system ends in a consistent state — no half-placed orders, no phantom reservations.

**Two coordination styles:**
- **Choreography** — services react to each other's events directly, with no central coordinator. Simple to implement; harder to visualize the full flow as it grows.
- **Orchestration** — a dedicated Saga Orchestrator service drives the workflow, calling each service in sequence and handling failures centrally. Easier to reason about for complex multi-step flows.

**Real-world example:** Uber's trip completion flow — end trip, calculate fare, charge payment method, pay driver — spans multiple services. If the payment charge fails, Uber does not show the driver as "paid." The saga compensates and queues a retry rather than leaving the system in an inconsistent state.

---

### Service Mesh: Infrastructure for Service-to-Service Traffic

As the number of services grows past ~20, common infrastructure concerns — mutual TLS, retries, circuit breaking, load balancing — become repetitive to implement per service. A **service mesh** (Istio, Linkerd) moves these concerns into a sidecar proxy injected alongside each service container.

Every service gets a sidecar (e.g., Envoy proxy). All service-to-service traffic passes through the sidecar pair. The control plane (Istio's Pilot) pushes configuration: "retry up to 3 times with exponential backoff," "reject traffic from services without a valid certificate," "route 10% of traffic to the canary version."

**What the mesh handles:**
- Mutual TLS (mTLS) — all service-to-service traffic is encrypted and authenticated automatically, without any application code changes.
- Retries and timeouts — configured centrally, not duplicated in each service.
- Traffic splitting — route 5% of traffic to a new version for canary testing.
- Observability — the mesh emits per-call latency, error rate, and request volume metrics for every service pair automatically.

**When to adopt:** A service mesh adds operational complexity. Adopt it at Year 2+ maturity, when you have 20+ services, a dedicated platform team, and specific needs for mTLS or advanced traffic management.

---

### Architecture Maturity: A Three-Year Progression

| Year | Team Size | Architecture State | Key Investments |
|---|---|---|---|
| Year 1 | 5–15 engineers | Modular monolith or 5–10 services. Shared Kubernetes cluster. Manual deployments via Slack bot. | Good domain boundaries in code. Basic CI. On-call rotation. Centralized logging. |
| Year 2 | 15–50 engineers | 15–40 services. Automated canary deployments. Service registry. Contract tests in CI. | Distributed tracing. Service mesh (mTLS, retries). SLOs per service. Backstage service catalog. IaC for all infrastructure. |
| Year 3 | 50+ engineers | 50+ services. Internal developer platform ("golden path"). Event-driven architecture for high-throughput flows. | Self-service provisioning. Chaos engineering (Netflix Chaos Monkey, AWS FIS). DORA metrics as team health KPIs. Feature flag system (LaunchDarkly) for progressive delivery. |

---

### Common Pitfalls and How to Avoid Them

| Pitfall | What happens | How to avoid |
|---|---|---|
| **Distributed monolith** | Services are split but still share a database or require synchronized deployments. You get all the operational overhead with none of the independence. | Enforce one-database-per-service. If two services always deploy together, they should be one service. |
| **Service proliferation** | 100+ services without a catalog. Engineers can't find where logic lives. "Nanoservices" waste more time on networking than computation. | Maintain a service catalog (Backstage). Every service must have a named owner, README, and SLO. Merge services that do not justify their operational cost. |
| **Latency amplification** | A user request chains through 7 services in series. Each adds 20ms. Total: 140ms minimum even if all services are fast. | Parallelize independent downstream calls. Set strict per-call timeouts. Measure P99 end-to-end latency on the critical path. |
| **Chatty services** | Service A calls Service B 50 times per request (e.g., fetching each product's price individually instead of in a batch). | Batch APIs (fetch 50 prices in one call). Use an aggregation layer or BFF (Backend for Frontend) for read-heavy flows. |
| **No ownership clarity** | An incident hits and nobody knows which team owns the failing service. | Publish a service ownership matrix. Every service maps to one team, one SLO, and one on-call rotation. |

---

### Interview Trade-Off Questions

1. How small is too small for a microservice? What metrics or signals indicate a boundary is over-split?
2. When would you use choreography vs. orchestration for a saga? What are the debugging tradeoffs of each?
3. When is a shared library the right answer vs. a separate service for cross-cutting logic?
4. How much team autonomy should you allow before platform inconsistency starts hurting reliability and security?
5. You're a 10-person startup being asked to build in microservices from day one. How do you respond?

---
## Chapter 5: Availability, CAP Theorem & Reliability Patterns

### Why Availability Is a Business Requirement

Before diving into theory, understand why availability is non-negotiable:

- **Facebook 2021 outage** took WhatsApp, Instagram, and Messenger offline for ~6 hours — estimated $60M+ in lost revenue and long-term reputational damage.
- **AWS US-East-1 outages (2017, 2021)** knocked out Slack, Trello, GitHub, and Airbnb simultaneously because all depended on the same region.
- **Per Gartner:** Average downtime cost is **$336,000/hour** across industries; top e-commerce sites risk up to **$13M/hour**.

If your system goes down, users go elsewhere. Every architectural decision in this chapter maps directly to how long and how often your users are unable to reach you.

---

### What Availability Actually Means

**Availability** is the percentage of time a system correctly serves requests. It is commonly expressed in "nines":

| Availability | Annual Downtime | Typical Use Case |
|---|---|---|
| 99% (2 nines) | ~3.65 days | Internal dashboards, batch jobs |
| 99.9% (3 nines) | ~8.7 hours | Most B2B SaaS products |
| 99.99% (4 nines) | ~52 minutes | Amazon S3, major payment APIs |
| 99.999% (5 nines) | ~5 minutes | Telecom switches, financial exchanges |

Moving from 3 nines to 5 nines is not twice as hard — it is orders of magnitude harder and more expensive. A startup aiming for 99.999% before they have product-market fit is over-engineering.

#### Three Ways to Measure Availability

**1. Time-based (MTTF / MTTR):**

```
Availability = MTTF / (MTTF + MTTR)
```

- **MTTF** (Mean Time To Failure) — average healthy runtime before the next outage.
- **MTTR** (Mean Time To Recovery) — average time to detect, diagnose, and restore service.

Improving MTTF means building more resilient systems (redundancy, circuit breakers). Improving MTTR means better observability and runbooks. Both matter — but MTTR is often faster to improve and cheaper.

**2. Request-count based:**

```
Availability = Successful Requests / Total Requests
```

Simple and common, but biased: if your system goes down at 3 AM when almost no one is online, this metric looks great even though real users were affected.

**3. Google's Meaningful Availability (per-user uptime):**

```
Availability = Σ uptime(u) / (Σ uptime(u) + Σ downtime(u))  for all users u
```

Counts every failed request as downtime for that user, including silently retried ones. This is the most user-centric metric. Recommended for any consumer product where user experience matters more than aggregate uptime.

---

### The CAP Theorem: The Core Trade-Off

Every distributed system — one where multiple machines cooperate to look like one — must make an explicit choice about what to do when the network fails. The **CAP Theorem** (Brewer, 2000) makes this trade-off precise.

A distributed data system can guarantee only **two of these three** properties simultaneously:

- **Consistency (C)** — Every read returns the most recent write. All nodes agree on the same data at the same time. No stale reads.
- **Availability (A)** — Every request to a non-failing node gets a response within reasonable time, even if some nodes are down.
- **Partition Tolerance (P)** — The system keeps operating despite network partitions (when machines cannot communicate — cables are cut, packets are dropped, a data center loses connectivity).

**Network partitions are unavoidable in real distributed systems.** They happen due to hardware failure, misconfiguration, or simply geography. Therefore, the real choice is always between **C and A** when a partition occurs.

#### The Intuition with a Simple Example

S1 and S2 are two database nodes. A network partition occurs — they cannot communicate. A client writes "balance = $100" to S1, then reads from S2. Now what?

- **Option A:** S2 returns its last known value (maybe $80) → it is available but **consistency is sacrificed**. This is an AP system.
- **Option B:** S2 refuses to respond until the partition heals and it can verify the latest write → it is consistent but **availability is sacrificed**. This is a CP system.

There is no third option.

#### CP vs AP: Behavior During Failures

| Failure Mode | CP System | AP System |
|---|---|---|
| Network partition | Rejects or delays requests until quorum restored | Serves potentially stale data; reconciles after healing |
| Node failure | Availability drops (need quorum) | System stays fully available; stale-read risk increases |
| Partition heals | Resumes normal operation | Reconciliation runs; conflict resolution needed |
| Examples | PostgreSQL (replicated), MongoDB, HBase, ZooKeeper, Redis | Cassandra, DynamoDB, CouchDB |
| Best for | Financial transactions, inventory counts, anything where stale reads cause business harm | User activity feeds, recommendations, social features |

#### Choosing CP vs AP by Business Domain

The decision follows from business consequences, not preference:

| Use Case | Choice | Reasoning |
|---|---|---|
| Bank account balance | CP (Postgres, Redis) | A stale balance read enables fraudulent overdraft |
| Payment authorization | CP | Charging a card twice or not at all is unacceptable |
| E-commerce inventory | CP | Overselling is a real business problem |
| Shopping cart | AP (DynamoDB) | Showing stale cart contents is fine; cart must always be available |
| User profile / bio | AP (Cassandra) | 10-second stale bio is acceptable; failed profile load is not |
| Social media likes/feed | AP | Approximate counts are fine; feeds must load |
| Search index | AP with eventual consistency | Slightly stale search results are acceptable |

**Real-world example — Meta 2021 BGP outage:** An internal BGP configuration service became unreachable. Because it was designed as a CP system, services refused to serve traffic until they could verify correct configuration state. The data centers were physically running, but the consistency requirement prevented them from responding. Six hours of downtime for billions of users.

**Counter-example — Google Spanner:** Spanner uses GPS and atomic clocks (TrueTime API) to achieve near-perfect external consistency at global scale. It pushes CAP's practical limits by making partition windows so small (< 7ms) that the CA trade-off becomes negligible. Cost: ~$5,000–$20,000/month per TB — a premium only large-scale systems can justify.

#### Most Real Systems Are Mixed

A single company typically operates both CP and AP data stores simultaneously:

- Payments → CP (Postgres or Spanner)
- Shopping cart → AP (DynamoDB)
- User activity feed → AP (Cassandra)
- Real-time rate limiting counters → CP (Redis)
- Search → AP with eventual consistency (Elasticsearch)

CAP position is a **per-data-store decision**, not a system-wide personality.

#### Infrastructure Cost by CAP Position

| System | Monthly cost for 1 TB at 100K writes/sec |
|---|---|
| Postgres (CP, primary + 2 replicas) | ~$3,000 |
| Cassandra on AWS (AP, 6-node cluster) | ~$2,000 |
| DynamoDB (AP, on-demand pricing) | ~$1,500–$10,000 depending on read/write ratio |
| Google Spanner (near-CA, globally consistent) | ~$5,000–$20,000 |

#### Beyond CAP: The PACELC Extension

PACELC extends CAP to cover normal (non-partition) operation: even when the network is healthy, systems still trade off **Latency vs. Consistency**. A strongly consistent database must coordinate writes across replicas (adding latency); an eventually consistent one returns immediately. This is why Cassandra (AP/EL — prioritize availability during partition, lower latency during normal operation) and Spanner (CP/HC — prioritize consistency always) feel different to application developers even when no partition is occurring.

---

### Conflict Resolution in AP Systems

When a network partition heals, an AP system may have accepted conflicting writes on both sides. It needs rules to reconcile them:

**Last-Write-Wins (LWW):** The write with the latest timestamp wins. Simple to implement. Risk: clock skew between nodes means a causally-earlier write with a slightly later clock timestamp silently overwrites a more recent one. DynamoDB and Cassandra use LWW by default.

**Vector Clocks:** Each node tracks a version vector — a logical clock that captures causal order independent of wall time. When two writes conflict, the system presents both versions to the application for resolution. Amazon's original Dynamo paper used this approach. Richer but more complex to implement.

**CRDTs (Conflict-free Replicated Data Types):** Mathematical data structures designed so that all concurrent updates always merge correctly without any conflict. A CRDT counter that can only increment (like a like-count) will always converge to the correct total regardless of update order. Used in Redis CRDT modules and Riak. Best for counters, sets, and registers.

**Real-world example:** When two people edit the same Google Doc offline and reconnect, Google Drive uses operational transformation (a CRDT-like technique) to merge both sets of changes correctly, rather than discarding one person's work.

---

### Building High Availability: Practical Techniques

#### Redundancy: Eliminating Single Points of Failure

A single server is a single point of failure — any hardware failure is an outage. The fix is redundancy at every tier:

```
Without redundancy:
  [Client] -> [1 Server] -> [1 DB]
  MTTF ~5 years (hardware), MTTR ~2 hours -> ~99.9% availability

With redundancy:
  [Client] -> [Load Balancer] -> [Server A, Server B] -> [Primary DB + Replica]
  Any single component failure is transparent to users -> ~99.99% availability
```

Stateless services (no session state on the server) scale horizontally behind a load balancer. Stateful services (databases, caches) require explicit replication strategies.

**Real-world example:** Netflix runs every service in at least two AWS availability zones simultaneously. During the 2011 AWS US-East outage, Netflix remained online because it had pre-built multi-region failover. Competitors that were single-region went dark.

#### Graceful Degradation: Failing Partially, Not Totally

Instead of failing completely when a dependency is down, design services to degrade gracefully:

- **Product page without recommendations:** If the recommendation service is down, show the product page without "You might also like" — do not fail the whole page.
- **Feed without ads:** If the ad service is down, show the social feed without ads — do not block the feed.
- **Checkout without fraud score:** Queue the order and run fraud scoring asynchronously — do not block checkout.

This requires identifying which dependencies are **critical** (failure = outage) vs. **non-critical** (failure = degraded but functional). Making this distinction explicitly is one of the highest-leverage reliability decisions in system design.

#### Circuit Breakers: Preventing Cascade Failures

When service A depends on service B, and B starts responding slowly, A's threads fill up waiting. A becomes slow. Everything depending on A becomes slow. This is a **cascade failure** — one slow service takes down the entire system.

A **circuit breaker** wraps calls to B and tracks the failure rate of recent calls:
- **Closed (normal):** calls pass through.
- **Open (tripped):** after the failure threshold is exceeded, calls immediately return a fast error without hitting B. This protects A's thread pool.
- **Half-open (probing):** after a timeout, the circuit allows one test call through. If it succeeds, the circuit closes.

**Real-world example:** Netflix's Hystrix library (now replaced by resilience4j) implements circuit breakers for every inter-service call. During a dependency outage, affected services return cached or default responses in milliseconds rather than hanging threads for 30 seconds each.

---

### Observability: Seeing What Is Happening

Availability is only improvable if you can measure it. Observability means having enough visibility to answer: is something wrong, what is wrong, and where is it wrong?

#### The Four Pillars

| Pillar | What It Tells You | Tools |
|---|---|---|
| **Metrics** | *That* something is wrong — error rate up, latency P99 spiked, throughput dropped | Prometheus + Grafana, Datadog, CloudWatch |
| **Logs** | *What* went wrong — timestamped event records with context per request or error | ELK Stack, Loki, Splunk |
| **Traces** | *Where* it went wrong — end-to-end request flow across all services in the call chain | Jaeger, Zipkin, AWS X-Ray |
| **Alerts** | *Who to wake up* — automated notification when a threshold is breached | PagerDuty, OpsGenie, Grafana Alerts |

All four are necessary. Metrics without logs means you know something is wrong but cannot debug it. Logs without traces means you see errors but cannot tell which service in a chain of seven caused them.

**Real-world example:** During a Shopify incident, distributed tracing showed that 95% of checkout latency came from a single downstream call to a fraud scoring service — despite that service's own metrics showing it was "healthy." Without tracing, the team would have blamed checkout itself.

#### Alerting on Symptoms, Not Causes

Alerting on CPU usage, memory pressure, or disk I/O creates alert fatigue. Instead:

- **Alert on symptoms (user-facing):** error rate > 1%, P99 latency > 2s, checkout failure rate > 0.5%.
- **Investigate causes from dashboards:** CPU, memory, disk are useful for debugging but not for waking people up.

Each alert must link to a **runbook** — a step-by-step document: "Check X, look at Y, restart Z, escalate if error rate is still above threshold after 10 minutes."

#### SLOs, SLAs, and Error Budgets

| Term | Definition | Example |
|---|---|---|
| **SLA** (Service Level Agreement) | External contractual promise to customers | "We will maintain 99.9% uptime per month" |
| **SLO** (Service Level Objective) | Internal target the team tracks | "Error rate < 0.1% over rolling 30 days" |
| **Error Budget** | Allowed room for failures within the SLO | 99.9% SLO = 0.1% errors allowed = ~43 min/month |

Error budgets create a principled balance between reliability and velocity: if the error budget is mostly consumed, freeze new feature deployments and focus on reliability. If it is largely intact, move fast. This removes the judgment call from whether to ship.

#### Observability Cost and Operations

| Tool | Monthly Cost | Best For |
|---|---|---|
| AWS CloudWatch (50 metrics, 10 GB logs) | ~$150 | Early stage, AWS-native teams |
| Prometheus + Grafana (self-hosted) | ~$200 infrastructure | Cost-conscious teams with ops capacity |
| Datadog (50 hosts, APM + logs) | ~$3,000–$8,000 | Mid-size teams wanting managed, integrated tooling |
| Splunk (1 TB/day ingest) | ~$5,000–$20,000 | Enterprise-scale log analysis |

Rule of thumb: spend 5–10% of infrastructure budget on observability — it directly reduces MTTR, and lower MTTR directly reduces the business cost of every incident.

**Ongoing operations:**
- **SLO dashboards:** Track rolling 30-day SLO for error rate and latency P99. Every on-call engineer sees the same dashboard.
- **Runbooks linked to every alert:** When an alert fires, the engineer sees a link to a step-by-step runbook.
- **Blameless post-mortems** after every severity-1 incident: what happened, why, and what systemic change prevents recurrence.
- **Regular load testing** (quarterly) to verify availability under 2× peak traffic.

**Known failure modes in the observability stack itself:**
- **Metrics pipeline overwhelmed:** A spike in errors generates 10× more log volume; the logging pipeline falls behind. Fix: sample high-volume logs; keep critical error logs unsampled.
- **Alert fatigue:** Too many low-priority alerts cause engineers to ignore them. Fix: alert on symptoms, not causes. Every alert must have a runbook.
- **Tracing overhead:** Full distributed tracing adds ~5–10% latency overhead per traced request. Fix: sample 1–10% of traffic; trace 100% only during incident investigation.

---

### Idempotency, Retries, and Deduplication

These three concepts always appear together when designing any network call, payment flow, or message-processing pipeline.

#### The Problem: Ambiguous Failures

In a distributed system, any network call can fail with an ambiguous result: you sent a request but do not know whether the server received it and crashed before responding, or never received it at all. The only safe response is to retry. But naive retries create duplicate processing.

**Real-world example:** You tap "Pay" on your phone. The request reaches Stripe, the charge succeeds, but the response never makes it back to your app. Your app shows an error. If you tap "Pay" again — do you get charged twice?

#### Idempotency: Making Operations Safe to Retry

**Idempotency** means applying the same operation N times produces the same result as applying it once. HTTP GET, PUT, and DELETE are idempotent by design. POST is not.

**Making POST idempotent with Idempotency Keys:**

1. The client generates a UUID for the logical operation (e.g., "charge for order #1234").
2. The client sends this UUID as an `Idempotency-Key` header on every attempt.
3. The server stores `(key → result)` in a durable store (Redis with TTL, or a DB table).
4. On retry with the same key, the server returns the cached result without re-executing.

Stripe, PayPal, and most payment APIs require `Idempotency-Key` on every charge creation. This is why tapping "Pay" twice does not charge you twice.

#### Deduplication: Exactly-Once Processing from At-Least-Once Queues

Message queues (Kafka, SQS, RabbitMQ) guarantee **at-least-once delivery** — a message may arrive more than once if a consumer crashes after processing but before acknowledging. To prevent duplicate side effects:

```
Before processing message M:
  if M.id in processed_ids -> skip (already done)
After processing successfully:
  insert M.id into processed_ids
```

This converts at-least-once delivery into effectively-once behavior at the application layer. The `processed_ids` store can be Redis (fast, TTL-based) or a database table (durable).

#### Retry Strategy: Backoff and Jitter

Retrying immediately and repeatedly is almost always wrong — all clients retry at the same moment and overwhelm the recovering server. Use **exponential backoff with jitter** instead:

```
delay = min(cap, base * 2^attempt) + random(0, jitter)
```

Jitter adds randomness that spreads retries across time, preventing synchronized retry storms. Always set a maximum retry count and route permanently failed messages to a **Dead Letter Queue (DLQ)** for investigation.

---

### Infrastructure Evolution: From Startup to Scale

| Stage | Architecture | Availability Target |
|---|---|---|
| **Year 1 (startup)** | Single Postgres instance. CloudWatch metrics. Email alerts. Engineers SSH in to debug. | ~99.9% |
| **Year 2 (growth)** | Postgres primary + replica. Redis cache (AP) for read-heavy endpoints. Centralized logging (Datadog or ELK). SLOs defined. PagerDuty for on-call. | ~99.95% |
| **Year 3 (scale)** | Multi-model persistence: Postgres (CP) for transactions, Cassandra (AP) for activity streams, Redis (CP) for counters. Distributed tracing. Circuit breakers on all inter-service calls. Multi-region failover for critical paths. | ~99.99% |

Each stage adds cost and operational complexity. Skip stages at your own risk — but also do not build Year 3 infrastructure before you have Year 1 users.

---

### Interview Trade-Off Questions

**Q1. A payment service and a social feed service are both down. You can restore only one in the next 10 minutes. Which do you restore first, and why? What does this reveal about CAP positioning?**

Restore the payment service first. Payments are CP — every failed payment is a direct, measurable revenue loss and a contractual SLA breach. A customer who cannot pay churns immediately and may dispute the failed transaction. A social feed being down is frustrating but survivable; users tolerate feed outages for minutes without leaving the platform. This reveals a core CAP principle: not all services deserve the same availability budget. CP services must be prioritized in incident response because consistency failures (double charges, lost transactions) create business liability that eventual consistency systems do not. In practice, CP services should also have more aggressive alerting thresholds, more redundancy, and dedicated on-call runbooks precisely because the cost of their downtime is quantifiably higher.

---

**Q2. You are designing a shopping cart for a Black Friday sale. How do you choose between CP and AP for cart storage? What conflict resolution strategy do you use if you choose AP?**

Choose AP (DynamoDB or Cassandra). The cart must remain writable under extreme load — on Black Friday, traffic spikes 10–50× and a CP system that rejects writes to maintain quorum will enrage users at the worst possible moment. A cart showing slightly stale contents (a recently removed item still visible for a second) is far less harmful than a cart that is unavailable. Choose AP.

For conflict resolution, use **Last-Write-Wins (LWW) with client-side idempotency keys** for cart updates. Most cart operations are overwrites (set quantity to 2, remove item), not concurrent increments, so LWW is safe. The edge case to defend: if a user has the cart open on two devices simultaneously and both update at the same split-second, LWW means one update silently wins. Acceptable for a cart. If you need stronger guarantees (e.g., a gift registry multiple people edit), use a **CRDT set** — adds and removes always merge correctly. At checkout, run a final CP read from the inventory service to verify stock before completing the order; this is the one place where consistency matters and the volume is low.

---

**Q3. Your service has a 99.9% SLO but has already used 80% of its monthly error budget by the 15th. What do you do?**

80% budget consumed in half the month means you are on track to burn through 160% — you will breach the SLO. The right response has three steps:

**Immediate (next hour):** Review the error rate trend. Is it a gradual leak (slow burn from a recent deploy) or a spike that already resolved? Check the last deploy, config change, or dependency change that coincides with budget consumption beginning.

**Short-term (next 24 hours):** Freeze non-critical feature deployments. Each deploy is a risk of introducing new errors. Only ship reliability fixes. If a recent deploy correlates with the budget burn, roll it back.

**Structural (this sprint):** Investigate the root causes of the errors consumed. Are they from a single endpoint, a specific dependency, or a class of inputs? Fix the underlying issue, not just the symptom. Then, if budget is still at risk, evaluate whether the SLO is correctly set for the current system maturity — a 99.9% SLO on a service that genuinely cannot sustain it means the target needs re-negotiation, not just heroics every month.

The error budget framework exists precisely for this: it converts a vague "is the system reliable enough?" into a quantitative policy — when budget is depleted, reliability work takes priority over features, automatically.

---

**Q4. A downstream fraud-scoring service is timing out intermittently under load. How do you prevent this from cascading to block all checkout requests?**

This is a textbook circuit breaker scenario. Without protection, here is what happens: the fraud service takes 30s to time out → checkout threads block for 30s waiting → checkout thread pool exhausts → checkout starts returning 503s → the entire checkout funnel is down because of a non-critical dependency.

**Solution — three layers:**

1. **Timeout aggressively:** Set a hard timeout of 500ms on the fraud service call. Do not wait 30 seconds. If it does not respond in 500ms, treat it as failed.

2. **Circuit breaker:** Wrap the call in a circuit breaker (resilience4j, Hystrix). After 5 consecutive failures or a 50% error rate in the last 10 seconds, open the circuit — subsequent calls fast-fail in < 1ms without hitting the fraud service at all. After 30 seconds, half-open and test one call.

3. **Graceful degradation fallback:** When the circuit is open, do not fail the checkout — degrade gracefully. Accept the order, flag it for asynchronous fraud review, and fulfill it. For low-risk orders (small amount, known customer, billing = shipping), this is acceptable. For high-risk orders, you might decline, but that is a business rule, not a technical cascade failure.

This is exactly how Amazon and Netflix handle dependency outages: isolate, fast-fail, and degrade — never let a non-critical service bring down a critical one.

---

**Q5. A client reports being double-charged. Walk through how idempotency keys, retry logic, and deduplication should have prevented this — and why they might have failed.**

**How it should work:**

1. The client's app generates a UUID (`idem-key: abc-123`) when the user taps "Pay."
2. The request reaches the payment service, which calls Stripe with `Idempotency-Key: abc-123`.
3. The network times out before the response reaches the app.
4. The app retries with the **same** `idem-key: abc-123`.
5. Stripe finds the existing key in its idempotency store and returns the original charge result — no second charge created.

**Why it might have failed — five real failure modes:**

| Failure | What Happened | Fix |
|---|---|---|
| New key on retry | The client generated a fresh UUID for the retry instead of reusing the original | Client must store the key durably (local DB) before the first attempt and reuse it |
| Key not passed to Stripe | The payment service called Stripe without forwarding the `Idempotency-Key` header | Every downstream payment call must propagate the key end-to-end |
| Key expired | Stripe's idempotency store TTL expired (typically 24h) before the retry | Retry within the key's TTL window; for long-running retries, idempotency at the application layer is needed |
| Race condition in the payment service | Two retry requests arrived simultaneously before the first response was cached | The idempotency store must use atomic compare-and-set (Redis SET NX) to prevent parallel execution of the same key |
| Queue deduplication skipped | A message queue re-delivered the charge event and the consumer did not check `processed_ids` | Every charge event consumer must check and insert into a `processed_ids` table before executing |

The root cause of most double-charges is not missing idempotency keys — it is that the key is not stored durably on the client before the first attempt. If the app crashes after sending but before persisting the key, the next launch generates a new key and charges again.

---
## Chapter 6: Database Internals

### Why Storage Engines Matter

When you pick a database, you are really picking a storage engine — the subsystem that decides how bytes land on disk, how they are read back, and what happens during a crash. Every database you have used (Postgres, MySQL, Cassandra, Redis) is built on a storage engine, and most performance, cost, and reliability trade-offs trace back to that choice.

The core tension: reading, writing, and crash recovery all want different things from on-disk layout. No engine delivers all three at peak performance simultaneously. Understanding the trade-offs lets you pick the right tool and explain your choice in any system design conversation.

---

### Part 1 — Foundations

#### How Data Reaches Disk: The Write Path

Before diving into engine types, understand the universal write path every serious database follows:

```
Client write request
        │
        ▼
   1. Write to WAL (Write-Ahead Log)   ← durability checkpoint
        │
        ▼
   2. Write to in-memory buffer        ← fast acknowledgment path
        │
        ▼
   3. Flush buffer to main data files  ← lazy, batched, asynchronous
```

**WAL (Write-Ahead Log)** is the durability backbone. Before any data page is modified, a log record is appended to a sequential file on disk. Sequential writes are fast. If the server crashes between steps 2 and 3, the WAL replays and rebuilds the lost state. Data pages are updated lazily in the background.

**Real-world example — why WAL matters for payments:** A payment service calls `INSERT INTO charges ...`. The database acknowledges "committed" only after the WAL record hits durable storage. If the server dies at that exact instant, the WAL replay on restart re-applies the insert. Without WAL, the charge would silently disappear and the customer would be charged twice or not at all on retry.

---

#### The Two Engine Families: B-Tree vs. LSM Tree

Almost every relational and key-value engine belongs to one of two families.

**Think of it as two ways to organize a library:**
- A **B-tree** is a well-organized bookshelf: books are always in alphabetical order. Finding a title or a range is instant because the shelf is always sorted. Adding a new book means finding the exact slot and shifting neighbors — more work per insert.
- An **LSM tree** is an inbox: new books are tossed in a pile first, and a night-shift worker sorts them later. Inserting is instant. Reading requires checking the pile, a few sorted sub-stacks, and the final shelf — more work per read.

##### B-Tree Engines (Postgres, MySQL InnoDB)

Data is stored in a balanced tree where every leaf node is a fixed-size page (~8 KB in Postgres). The tree stays sorted by key at all times.

How a write works:
1. Find the correct leaf page (tree traversal).
2. Lock that page.
3. Insert or update the record in-place.
4. Write the change to WAL first (crash safety).
5. Mark the page dirty — it will be flushed to disk later.

How a read works:
1. Traverse the tree to the correct leaf page.
2. Return the record directly.

**Strengths:** Fast point lookups and range scans. Predictable read latency. ACID by default.
**Weaknesses:** Random writes scatter across the tree, causing random I/O. High write amplification on NVMe-constrained systems.

##### LSM Tree Engines (RocksDB, Cassandra, ScyllaDB, LevelDB)

Writes always go to memory first, never directly to sorted disk structures.

How a write works:
1. Append to WAL (durability).
2. Write to in-memory **memtable** (a sorted structure, typically a skip list or red-black tree).
3. When the memtable fills, flush it as an immutable **SSTable** (Sorted String Table) to disk.
4. Background **compaction** merges overlapping SSTables into fewer, larger, sorted files over time.

How a read works:
1. Check memtable (fastest).
2. Check each level of SSTables from newest to oldest.
3. Use **Bloom filters** (a probabilistic structure that says "this key is definitely not here" ~99% of the time) to skip most SSTable checks.

**Strengths:** All writes are sequential (memtable → SSTable flush). Extremely high write throughput. Works well on spinning disks and SSDs.
**Weaknesses:** Read amplification (multiple levels to check). Background compaction competes with foreground I/O. Space amplification (deleted/overwritten records persist until compaction).

##### Head-to-Head Comparison

| Dimension | B-Tree | LSM Tree |
|---|---|---|
| Write throughput | Moderate (~50K/s single node) | High (>500K/s single node) |
| Read latency | Low, predictable | Higher, depends on compaction state |
| Range scans | Excellent | Moderate (SSTables are sorted within a level) |
| Space usage | Compact but bloats without VACUUM | 1.5–3× amplification during compaction |
| Crash recovery | WAL replay | WAL + memtable reconstruct |
| Best fit | OLTP, ACID, mixed read/write | Write-heavy, append, time-series |
| Examples | Postgres, MySQL InnoDB | RocksDB, Cassandra, ScyllaDB |

---

### Part 2 — Concurrency and Transactions

#### MVCC: How Reads and Writes Coexist

Most production databases use **MVCC (Multi-Version Concurrency Control)** to avoid the classic problem where a read blocks a write or vice versa.

The key idea: instead of overwriting a row in place, a write creates a *new version* of the row. Old versions persist until they are no longer needed by any active transaction. Each reader sees the version that was current at the start of its snapshot — other concurrent writes are invisible to it.

**Real-world analogy:** Think of Git branches. A reader opens a branch at a specific commit hash. Other commits can happen on `main` without changing what the reader sees. The reader's view is frozen in time.

**Real-world example — analytics vs. checkout:** An e-commerce site runs a 5-minute revenue report at the same time that checkout traffic is inserting thousands of orders. With MVCC, the report reads a consistent snapshot from when it started. Checkout inserts keep happening in parallel. Neither blocks the other. Without MVCC, the report would have to lock rows it reads, which would block every checkout touching those rows.

The cost of MVCC: old row versions accumulate. Postgres calls the cleanup process **VACUUM**. Without regular vacuuming, table bloat grows and query performance degrades.

---

#### Transaction Isolation Levels

MVCC enables a spectrum of isolation guarantees. Stronger isolation means fewer anomalies but more conflict detection overhead.

| Level | Dirty Reads | Non-Repeatable Reads | Phantom Reads | When to Use |
|---|---|---|---|---|
| **READ UNCOMMITTED** | Yes | Yes | Yes | Almost never. Only in analytics tolerating stale data. |
| **READ COMMITTED** | No | Yes | Yes | Default in Postgres and Oracle. Good for most OLTP. |
| **REPEATABLE READ** | No | No | No* | Multi-read transactions needing a stable snapshot (reports, audits). |
| **SERIALIZABLE** | No | No | No | Financial operations, inventory, seat reservations — anything that must not double-book. |

*Postgres's MVCC prevents phantoms at REPEATABLE READ too, which is stronger than the SQL standard requires.

**Anomaly definitions:**
- **Dirty read:** Reading a row that another transaction has modified but not yet committed. That other transaction might roll back — so you read data that never officially existed.
- **Non-repeatable read:** Reading the same row twice in one transaction and getting different values because another transaction committed between the two reads.
- **Phantom read:** Re-running a range query within one transaction and seeing new rows appear because another transaction inserted them.

**Real-world example — double-spend prevention:** A fintech application debits a user's balance. The logic reads current balance, checks if it's sufficient, then writes the new balance. Two concurrent requests could both read "balance: $100", both decide the debit is valid, and both subtract $50 — leaving the balance at $50 instead of $0. SERIALIZABLE isolation detects this conflict and aborts one of the two transactions. This is exactly how Stripe and similar payment processors prevent double-spend.

**Practical guidance:**
- Use **READ COMMITTED** by default for OLTP (web apps, APIs, microservices).
- Use **REPEATABLE READ** when a transaction does several reads that must see a consistent state (report generation, audit logs).
- Use **SERIALIZABLE** when correctness requires that no two concurrent transactions both succeed doing the same logical operation on the same data. Accept ~10–20% throughput overhead.

---

### Part 3 — Indexing

#### What an Index Is and Why It Costs

An index is a separate data structure (typically a B-tree itself) that the database maintains alongside the table. Its sole purpose is to make a specific query pattern faster by avoiding a full table scan.

**The trade-off is not free:** Every index you add must be updated on every INSERT, UPDATE, and DELETE to that table. A table with 10 indexes means every write touches 11 structures (the table + 10 indexes). Index storage typically adds 30–50% of the indexed column size.

**Mental model:** An index is a back-of-the-book index. It makes finding a topic fast. But every time you revise the book, you must also update the index. A book with 20 indexes takes 20× longer to update its index section per revision.

#### Index Types

| Index Type | How It Works | When to Use | Real-World Example |
|---|---|---|---|
| **Primary (clustered)** | Physical row order follows the index key. One per table. | Always — it's your primary key. | `id` on an `orders` table. |
| **Secondary (non-clustered)** | Separate structure pointing to heap row location. | Any alternate lookup path. | Index on `email` for `WHERE email = ?` login queries. |
| **Composite** | Index on multiple columns in a defined order. | Queries filtering and/or sorting on multiple columns together. | `(user_id, created_at)` for "all orders for user X, newest first." |
| **Covering** | Index includes all columns the query needs; no heap lookup required. | Read-hot queries where every millisecond counts. | Include `total_amount` in the composite index to serve the query entirely from the index. |
| **Partial** | Indexes only rows matching a WHERE condition. | When most rows are irrelevant to the indexed query. | Index on `status = 'pending'` for a job queue — only a small fraction of rows are ever pending. |
| **Expression / Functional** | Indexes the output of an expression, not a raw column. | Case-insensitive lookups, date truncation. | `LOWER(email)` enables `WHERE LOWER(email) = 'foo@bar.com'` without a full scan. |
| **Full-text (GIN/GiST)** | Inverted index mapping each word to the rows containing it. | Text search without a dedicated search engine. | Product catalog search by keyword. |
| **BRIN (Block Range)** | Stores min/max values per disk block range. Very small. | Append-only tables naturally ordered by time. | `created_at` on a log table — new rows always have larger timestamps. |

#### When to Add an Index (and When Not To)

Add an index when:
- `EXPLAIN ANALYZE` on production data shows a sequential scan with high actual rows.
- The query runs frequently (high QPS) and the table is large (>100K rows).
- You have confirmed in a staging environment that the index is actually used.

Do not add an index when:
- The table is small — the planner will prefer a sequential scan anyway.
- The query is infrequent — the maintenance cost exceeds the read benefit.
- The column has very low cardinality (e.g., a boolean `is_deleted`) — an index on it returns half the table and is useless.

**Index bloat:** Postgres does not immediately reclaim space from deleted index entries. On high-update tables, run `VACUUM ANALYZE` regularly. Monitor `pg_stat_user_indexes` for index size vs. table size. Rebuild severely bloated indexes with `REINDEX CONCURRENTLY` (online rebuild, no lock).

---

### Part 4 — Scaling Data

#### Table Partitioning (Single Database)

When a table grows to hundreds of millions of rows, even a good index starts to slow down — the index itself becomes large. Partitioning splits one logical table into multiple physical child tables while keeping them invisible to the application query.

The query planner eliminates partitions irrelevant to a query's WHERE clause (**partition pruning**), touching only the relevant child table.

| Partition Strategy | How It Splits | Best For |
|---|---|---|
| **Range** | By a column range (usually time: `created_at < '2026-01-01'`). | Time-series, event logs, audit tables. Dropping old data = dropping a partition (instant vs. slow DELETE). |
| **List** | By discrete values (`region IN ('us-east', 'us-west')`). | Multi-tenant data, geographic isolation. |
| **Hash** | By `hash(key) % N`. | Even data distribution with no natural range or list boundary. |

**Real-world example — Uber Eats order history:** An orders table accumulates billions of rows over years. Partitioned by month, each partition holds ~1 month of data. Queries for recent orders only scan one or two partitions. Dropping data older than 2 years = dropping old partition files — an instant operation versus a DELETE that would take hours and generate massive WAL.

#### Horizontal Sharding (Multiple Databases)

When a single database machine is the bottleneck (CPU, memory, or disk I/O), sharding splits data across multiple independent database instances. Each instance owns a subset of the data, determined by a **shard key**.

| Strategy | Pros | Cons |
|---|---|---|
| **Range sharding** | Simple; sequential scans stay local to one shard. | Hot shards if writes concentrate on recent ranges (e.g., newest user IDs). |
| **Hash sharding** | Even distribution; no hot spots. | Loses range locality; cross-shard range queries require scatter-gather. |
| **Directory-based** | Maximum flexibility; shard assignment is a lookup table you control. | Lookup adds a network hop; the directory itself becomes a critical bottleneck. |

**Cross-shard joins** are expensive: the application must query multiple shards and merge results in memory. For this reason, the shard key should be the entity that most queries filter on (e.g., `user_id`, `shop_id`, `tenant_id`).

**Real-world example — Shopify:** Shopify shards MySQL by `shop_id`. Every query from a merchant's store is scoped to that shop's data, which all lives on one shard. This means zero cross-shard joins for the common case. New capacity is added by migrating some shops to a new shard — a copy-and-cut-over operation that can be staged without downtime. Shopify can scale to millions of shops by adding more shards, not by upgrading a single giant server.

---

### Part 5 — Operational Concerns

#### Connection Pooling

A Postgres connection is not cheap: it spawns a backend process and allocates ~5–10 MB of memory. A web service with 10,000 concurrent application pods each holding one direct connection would exhaust DB memory before saturating CPU.

**PgBouncer** is a lightweight proxy that sits between application and database. It multiplexes thousands of application-facing connections onto a small pool of real server connections.

| PgBouncer Mode | Server Connection Released | Trade-off |
|---|---|---|
| **Session mode** | When application disconnects | No multiplexing benefit; useful only for hard connection cap. |
| **Transaction mode** | After each transaction commits | Most efficient. Breaks `LISTEN`/`NOTIFY` and advisory locks. |
| **Statement mode** | After each statement | Rarely used. Breaks multi-statement transactions. |

**Sizing rule:** Server-side connections = `(DB CPU cores × 2) + effective_spindle_count`. In practice, 50–100 server connections is the ceiling for most RDS/Aurora instances. PgBouncer in transaction mode then safely handles thousands of app-side connections.

**Real-world example:** A startup deploys 200 app pods, each with a connection pool of 10. That is 2,000 attempted DB connections. A `db.r5.large` with 2 vCPUs should hold ~10 server connections comfortably. PgBouncer absorbs the 2,000 app connections and funnels them through 10 server connections — the database never sees the pressure.

---

#### Capacity Estimation

| Workload Type | Back-of-Envelope |
|---|---|
| 50K writes/sec × 1 KB rows | ~50 MB/s raw ingest |
| WAL overhead | +1× write bandwidth for durability (plan ~100 MB/s total) |
| LSM compaction overhead | 1.5–3× logical data size on disk |
| Per-index cost | +1 B-tree write per index per row written |
| Connection overhead (Postgres) | ~5–10 MB per server connection |

---

#### Failure Modes to Know

| Failure | Cause | How to Detect | Mitigation |
|---|---|---|---|
| WAL disk full | High write rate, no archiving | Disk utilization alert > 80% | Archive WAL to object storage; set `max_wal_size` |
| Compaction backlog (LSM) | Write throughput > compaction capacity | Compaction queue depth metric | Add nodes; throttle writes temporarily |
| Table/index bloat (B-tree) | Deleted rows not reclaimed | `n_dead_tup` in `pg_stat_user_tables` | Run `VACUUM ANALYZE`; tune autovacuum |
| Long-running transactions | Forgotten `BEGIN`, stuck connections | `pg_stat_activity` age column | Set `idle_in_transaction_session_timeout = 30s` |
| Replication lag | Replica can't keep up with primary write rate | `now() - pg_last_xact_replay_timestamp()` | Alert at >30s; route stale-tolerant reads to replicas only |

---

### Part 6 — Choosing the Right Engine

#### Decision Flow

```
What dominates your workload?
├── High write throughput (>50K writes/sec), no complex joins
│   └── LSM engine: RocksDB, Cassandra, ScyllaDB
├── ACID transactions, complex queries, moderate writes
│   └── B-tree: Postgres, MySQL InnoDB
├── Sub-millisecond reads, data fits in RAM, durability secondary
│   └── In-memory: Redis, Memcached
└── Very large dataset, mostly append, analytical scans
    └── Columnar: Parquet/S3, BigQuery, Redshift, ClickHouse
```

#### Cost Reference (AWS, approximate monthly)

| Option | Monthly Cost | Good For |
|---|---|---|
| Postgres RDS `db.r5.large`, Multi-AZ | ~$420 | Most startups up to ~10M users |
| Aurora Serverless v2 (0.5–128 ACUs) | ~$100–$5,000 | Variable OLTP; auto-scales with traffic |
| DynamoDB on-demand (50K writes/sec) | ~$2,600 | Serverless key-value, no ops overhead |
| Cassandra on EC2 (6 × `r5.2xlarge`) | ~$3,600 | >500K writes/sec, eventual consistency |
| RocksDB on EC2 (6 × `i3.2xlarge`, NVMe) | ~$6,000 | Write-optimized, self-managed ops |

**Rule of thumb:** A single well-tuned Postgres primary with one read replica handles most startup workloads up to ~10M users at $500–$1,000/month. Sharding or moving to Cassandra is a meaningful operational investment — make it only when single-node Postgres is a proven bottleneck.

**Hidden LSM cost:** Storage amplification means physical disk usage is 1.5–3× logical data size. Budget for it.

---

### Part 7 — Operations and Evolution

#### Database Maintenance Checklist

A neglected database accumulates bloat, stale indexes, and slow queries until it fails in production at the worst possible time. These practices prevent that:

- **Schema migrations** — use Flyway, Liquibase, or Atlas. All changes are version-controlled and run through staging first. For zero-downtime changes, use the expand-contract pattern (Chapter 4).
- **Slow query monitoring** — enable `pg_stat_statements`. Alert on queries exceeding 200–500 ms. Review the top 5 offenders weekly.
- **Index validation** — before adding an index, run `EXPLAIN (ANALYZE, BUFFERS)` on staging with production-representative row counts. Confirm the planner actually uses it.
- **Autovacuum tuning** — monitor `pg_stat_user_tables.n_dead_tup`. Trigger manual `VACUUM ANALYZE` when dead tuples exceed 10% of live rows on high-update tables.
- **Backup restore drills** — restore a production backup to a staging environment once per quarter. Verify data integrity. An undrilled backup is not a backup.
- **Replication lag alert** — query `now() - pg_last_xact_replay_timestamp()` on each read replica. Alert at >30 seconds.
- **Compaction queue (LSM)** — watch compaction queue depth. A growing backlog means write throughput has outpaced compaction; add nodes or reduce write rate.

#### Growth Trajectory

| Stage | Database Architecture |
|---|---|
| **0–1M users** | Single Postgres primary. Focus on schema design and indexing. |
| **1–10M users** | Add read replicas. Route read-heavy queries (analytics, reports) to replicas. Enable PgBouncer. |
| **10–100M users** | Partition large tables by time or tenant. Consider Aurora or a managed scaling tier. Introduce a caching layer (Chapter 11). |
| **>100M users** | Evaluate sharding by primary entity (user_id, shop_id). Consider specialized engines per workload: Cassandra for event streams, Postgres for transactions, Redis for sessions. |

---

### Interview Questions and Answers

**Q1: When is a B-tree engine the right default, and when do write-heavy workloads justify switching to an LSM-based system?**

**A:** B-tree (Postgres, MySQL) is the right default when the workload is mixed — reads and writes at moderate volume, with range queries and ACID transactions. The predictable read latency and strong transaction semantics make it the safe choice for orders, payments, user accounts, and most OLTP systems. The switch to LSM (RocksDB, Cassandra) is justified when write throughput consistently exceeds what a well-tuned single-node B-tree can absorb (~50–100K writes/sec), and the workload doesn't require complex joins or strong ACID. Examples: time-series telemetry, IoT sensor ingestion, clickstream data, append-only audit logs. The decision is not just about throughput — LSM systems introduce operational complexity (compaction tuning, read amplification, no native joins) that must be worth the trade.

**Q2: How many secondary indexes are too many, and how do you decide whether faster reads are worth slower writes?**

**A:** There is no fixed number, but the cost is linear: each index adds roughly one B-tree write per row written to the table. A table with 8 indexes pays 8× the write overhead. The threshold is workload-dependent: a read-heavy product catalog can afford more indexes than a high-insert event log. The decision process is: (1) measure the slow query in production with `EXPLAIN ANALYZE`; (2) confirm the table is large enough that a full scan is actually slow; (3) check whether an existing index can be extended (covering index) before adding a new one; (4) add the index on a staging clone and benchmark write throughput before and after. A rule of thumb: 3–5 indexes per table is common; more than 8–10 on a write-heavy table is a signal to audit.

**Q3: When should you keep strong transactional semantics in one database versus moving part of the workload to logs, caches, or separate stores?**

**A:** Keep transactions in one database when correctness depends on atomicity across multiple entities — e.g., deducting inventory and creating an order must either both succeed or both fail. Move to logs or caches when: (a) the workload is append-only and eventual consistency is acceptable (event logs, audit trails, analytics); (b) the data is read-heavy and can tolerate staleness (session state, feature flags, search indexes); or (c) the volume far exceeds what the primary can handle and the consumer can reconcile late updates. The risk of splitting is that cross-store consistency is now the application's responsibility — you lose the database's ACID guarantee. A common pattern: keep the source-of-truth write in Postgres, publish a domain event to Kafka, and let downstream stores (Elasticsearch, Redis, a reporting DB) consume it asynchronously. This gives you both strong transactional semantics for the write path and scalable read paths without coupling them.

---
## Chapter 7: Rate Limiting

### What Is Rate Limiting and Why Does It Exist?

Every shared system has finite resources — CPU, database connections, memory, third-party API quota, and outbound bandwidth. Without a mechanism to control how fast clients consume these resources, a single misbehaving caller can exhaust capacity for everyone else.

Rate limiting is the policy that answers: **how many requests can this caller make in this time window before we start rejecting them?**

It is both a fairness mechanism and a safety valve:
- **Fairness:** prevents one tenant from starving others on shared infrastructure.
- **Safety:** limits blast radius when a client has a bug, a retry loop goes wild, or an attacker probes endpoints.
- **Cost control:** a runaway integration sending 10× expected Twilio SMS messages can cost thousands of dollars per hour before anyone notices.

**Real-world anchors:**
- **Cloudflare** enforces IP-level rate limits at the network edge, dropping abusive traffic before it reaches origin servers.
- **Stripe** applies per-API-key limits so one misconfigured integration cannot overwhelm the payment infrastructure for all merchants.
- **Slack** caps per-workspace request rates so a buggy bot cannot monopolize backend capacity during message bursts.
- **GitHub** returns `X-RateLimit-Remaining: 0` and a `Retry-After` header when an unauthenticated client polls the API too frequently.

---

### Core Concepts (Beginner)

**The stadium gate analogy**

Imagine a concert venue with a single entry gate. The gate controls throughput — it does not care who is outside, only how fast people can enter.

- **Token bucket** — a bucket of tickets refills at a fixed rate. Attendees can enter in short bursts if tickets have accumulated. Good for user-facing features where occasional bursts are acceptable.
- **Leaky bucket** — security lets exactly one person through every N seconds, no matter how big the crowd outside. Good for smoothing traffic to rate-limited downstream services.

**The simplest possible rate limiter**

```python
# In-memory counter (single server, non-distributed)
counts = {}

def allow(user_id, limit=100, window_seconds=60):
    key = f"{user_id}:{int(time.time() // window_seconds)}"
    counts[key] = counts.get(key, 0) + 1
    return counts[key] <= limit
```

This works for a single process. It breaks the moment you run two servers — each has its own counter and the limit doubles. That gap is what distributed rate limiting solves.

---

### The Four Core Algorithms

#### 1. Fixed Window Counter

Divide time into fixed buckets (e.g., each minute). Increment a counter per bucket; reject when it exceeds the limit.

```
Minute 00:01  [▓▓▓▓▓▓▓▓░░]  80/100 requests
Minute 00:02  [▓░░░░░░░░░]  10/100 requests  ← window reset
```

**Problem:** boundary bursts. A client can send 100 at 00:59 and 100 at 01:00 — 200 requests in 2 seconds.

**Use when:** simple quota enforcement where boundary bursts are acceptable (e.g., daily API credits).

#### 2. Sliding Window Log

Store a timestamp for every request in a sorted set. When a new request arrives, purge timestamps older than the window, count what remains, and allow if under the limit.

```
Window: last 60 seconds
Timestamps in set: [t-58, t-42, t-31, t-12, t-3]  → 5 requests
```

**Pro:** exact — no boundary burst problem.
**Con:** memory grows with request count; 1,000 req/min per user = 1,000 stored timestamps per user.

**Use when:** correctness is critical — failed login tracking, OTP send limits, compliance-mandated quotas.

#### 3. Sliding Window Counter (approximate)

A cheap approximation: combine the previous fixed window's count with the current window's count, weighted by how far into the current window you are.

```
rate = prev_count × (1 - elapsed/window) + curr_count
```

**Example:** 84 requests in the previous minute, 36 seconds into the current minute with 18 requests so far.
```
rate = 84 × (1 - 36/60) + 18 = 84 × 0.4 + 18 = 33.6 + 18 = 51.6
```

**Pro:** constant memory (two counters); close approximation.
**Con:** slightly over- or under-counts at window boundaries.

**Use when:** high-volume API gateways where a ~1% approximation error is fine.

#### 4. Token Bucket

A bucket holds up to `capacity` tokens. Tokens refill at `refill_rate` per second. Each request consumes one token; if empty, the request is rejected.

```
capacity = 100 tokens
refill_rate = 10 tokens/sec

User fires 20 requests in 1 second → 20 tokens consumed, 80 remain
User is idle for 5 seconds → +50 tokens refilled (capped at 100)
```

**Pro:** naturally handles legitimate bursts; intuitive capacity model.
**Use when:** user-facing APIs, search endpoints, dashboard refreshes — anywhere short bursts are expected and acceptable.

#### 5. Leaky Bucket

Requests enter a queue (the "bucket") and drain at a fixed rate. If the queue overflows, new requests are dropped.

```
Queue: [req1, req2, req3, req4]  (capacity 10)
Drain rate: 5 req/sec

No matter how fast requests arrive, output is always ≤5/sec.
```

**Pro:** perfectly smooth output; downstream never sees a burst.
**Use when:** calling a downstream service with a hard throughput limit — Twilio SMS (100/sec), SendGrid email, any vendor API with a strict rate cap.

#### Algorithm Decision Table

| Scenario | Best Algorithm | Why |
|---|---|---|
| Login brute-force protection | Sliding window log | Exact count required; security critical |
| Public REST API per API key | Sliding window counter | High volume; approximation acceptable |
| User dashboard search | Token bucket | Burst-tolerant; good UX |
| Outbound SMS to Twilio | Leaky bucket | Must not exceed vendor limit even in bursts |
| Daily credit quota | Fixed window | Simple; reset at midnight is acceptable |

---

### Deciding What to Limit (Intermediate)

Rate limiting is not just "requests per minute." You must specify three things precisely before writing any code.

#### 1. Who is being limited?

| Identity | Example key | Best for |
|---|---|---|
| IP address | `ratelimit:ip:1.2.3.4` | Unauthenticated endpoints, DDoS mitigation |
| User ID | `ratelimit:user:u_123` | Authenticated APIs, per-account fairness |
| API key / token | `ratelimit:key:sk_abc` | Developer APIs, billing tiers |
| Tenant / org | `ratelimit:tenant:acme` | Multi-tenant SaaS fairness |
| Device ID | `ratelimit:device:d_xyz` | Mobile apps, per-device abuse prevention |

In practice, you often combine levels. A login endpoint might limit by both IP (stop distributed brute force) and by account (stop targeted credential stuffing regardless of IP diversity).

#### 2. Where is the limit enforced?

| Layer | Tool examples | Scope | Latency impact |
|---|---|---|---|
| Network / CDN edge | Cloudflare, AWS WAF | IP-level, volumetric DDoS | ~0 ms (edge-local) |
| API Gateway | Kong, AWS API Gateway | Per API key or tenant | ~1–2 ms |
| Service layer | In-process + Redis | Per user, per feature flag | ~1–5 ms |
| Downstream worker | Queue depth + consumer pacing | Outbound vendor API quota | Async |

Most production systems use **two tiers**: a coarse limit at the API gateway (protect the fleet), plus a fine-grained limit at the service layer (per-user fairness). Edge-only limiting is insufficient — it cannot stop authenticated abuse originating from distributed IPs.

#### 3. What resource is protected?

This changes the limit unit:

- **Login endpoint** → failed attempts per IP per minute (not just total requests)
- **SMS send API** → messages per tenant per second (maps to Twilio quota)
- **Search endpoint** → CPU-equivalent score, not raw request count
- **Export endpoint** → concurrent exports per user (not req/min)

A single `1000 req/min` global rule applied to all endpoints protects nothing well. The `/send-sms` endpoint and the `/search-products` endpoint have completely different cost and abuse profiles.

---

### Distributed Rate Limiting (Intermediate → Advanced)

#### The Core Problem

With multiple servers, each holding its own in-memory counter, the effective limit multiplies by the number of servers. With 10 app servers and a 100 req/min limit, the real limit is 1,000 req/min.

```
Server A: counter=40
Server B: counter=35      ← same user, different server
Server C: counter=38
Total: 113 requests — but each server sees ≤40, so all "pass"
```

**Solution:** move the counter to a shared store (Redis).

#### Redis Pattern: Atomic Increment

```python
def allow(key, limit, window_seconds):
    pipe = redis.pipeline()
    now_bucket = int(time.time() // window_seconds)
    redis_key = f"rl:{key}:{now_bucket}"
    pipe.incr(redis_key)
    pipe.expire(redis_key, window_seconds * 2)
    count, _ = pipe.execute()
    return count <= limit
```

**Problem with this approach:** `INCR` then `EXPIRE` are two commands — not atomic. A server crash between them leaves keys that never expire.

#### Redis Pattern: Atomic Lua Script (Sliding Window)

A Lua script runs atomically inside Redis, eliminating the race between check and update:

```lua
-- KEYS[1]: rate limit key, e.g. "ratelimit:user_123:POST:/api/orders"
-- ARGV[1]: max requests per window
-- ARGV[2]: window size in seconds
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(redis.call("TIME")[1])

-- Remove events outside the sliding window
redis.call("ZREMRANGEBYSCORE", key, 0, now - window)

-- Count events in window
local count = redis.call("ZCARD", key)

if count < limit then
    redis.call("ZADD", key, now, now .. math.random())
    redis.call("EXPIRE", key, window)
    return {1, limit - count - 1}   -- {allowed, remaining}
else
    local oldest = tonumber(redis.call("ZRANGE", key, 0, 0, "WITHSCORES")[2])
    local retry_after = window - (now - oldest)
    return {0, 0, retry_after}       -- {denied, remaining=0, retry_after}
end
```

Called via `EVAL` — the check and update are a single atomic operation.

#### Token Bucket in Redis (burst-tolerant)

```
FUNCTION allow_token_bucket(key, capacity, refill_rate_per_sec):
  tokens, last_refill = GET(key)
  now = current_time()
  tokens = min(capacity, tokens + refill_rate_per_sec * (now - last_refill))
  if tokens >= 1:
      SET(key, {tokens - 1, now})
      return ALLOW
  else:
      return DENY, retry_after = (1 - tokens) / refill_rate_per_sec
```

#### Local Admission + Global Budget (High Scale)

At 1M+ req/s, even a fast Redis cluster adds latency on every single request. The common solution:

1. Each app server holds a **local token bucket** (in-process, zero latency).
2. Every N milliseconds, servers **sync with a global Redis counter** — reporting usage and fetching a refreshed global budget.
3. The local bucket is replenished based on its fair share of the global budget.

This reduces Redis calls by 10–100×. The tradeoff: enforcement is slightly approximate within a sync interval.

---

### API Contract: HTTP Headers and Response Codes

Well-designed APIs tell clients their rate-limit state so clients can self-throttle instead of receiving surprise `429` responses.

| Header | Meaning | Example |
|---|---|---|
| `X-RateLimit-Limit` | Total requests allowed in the current window | `100` |
| `X-RateLimit-Remaining` | Requests left in the current window | `42` |
| `X-RateLimit-Reset` | Unix timestamp when the window resets | `1745280000` |
| `Retry-After` | Seconds to wait before retrying (sent on 429 only) | `8` |

**On limit exceeded:** return `429 Too Many Requests` with `Retry-After`.

Never return `500` or `503` for a rate limit — clients treat those as transient errors and retry immediately, making the overload worse.

#### API Design

```http
POST /v1/rate-limit/check
```

Request:
```json
{
  "key": "user_123",
  "limit": 100,
  "window_seconds": 60,
  "algorithm": "token_bucket"
}
```

Response:
```json
{
  "allowed": true,
  "remaining": 42,
  "retry_after_ms": 0
}
```

---

### Fail Behavior: Open vs. Closed (Advanced)

What happens when the rate-limit store (Redis) is unreachable?

**Fail open** — allow all requests through.
- Pro: preserves availability; clients are not blocked by infrastructure failure.
- Con: the protection is gone. An attacker or runaway client can exploit this window.
- Use for: low-risk, non-critical endpoints (analytics, search).

**Fail closed** — reject all requests with `429` (or `503`).
- Pro: the system is protected even when the limiter is degraded.
- Con: legitimate users are blocked during a Redis outage.
- Use for: billing APIs, OTP sends, security-critical endpoints.

**Local fallback bucket** — the middle ground. Each server keeps a conservative in-process bucket. If Redis is unreachable, enforce from the local bucket. When Redis recovers, reconcile.
- Use for: most production systems. Balances protection with availability.

**Rule:** specify fail behavior explicitly in the service runbook. Do not assume. Test it by killing the rate-limit store in staging.

---

### Capacity Estimation

| Dimension | Calculation | Result |
|---|---|---|
| Checks/second | 100K users × 10 req/s | 1M checks/s |
| Storage (sliding log) | 1M keys × 100 timestamps × 8 bytes | ~800 MB |
| Storage (counter) | 1M keys × 16 bytes | ~16 MB |
| Redis bandwidth | 1M checks/s × 200 bytes/check | ~200 MB/s |
| Redis nodes needed (centralized) | 200 MB/s ÷ ~100 MB/s per node | 2–3 nodes |
| With local admission (sync every 100ms) | 200 MB/s ÷ 100x reduction | ~2 MB/s |

**Key insight:** local admission with periodic sync reduces Redis bandwidth by 100× at the cost of ~100ms enforcement lag — acceptable for almost all use cases.

---

### Cost Model

| Setup | Approximate Monthly Cost | Notes |
|---|---|---|
| Redis (ElastiCache r6g.large) | ~$120 | 1M checks/s; shared across services |
| AWS API Gateway throttling | $0–$30 | Built-in per-key limits; no extra infra |
| Cloudflare rate limiting (Pro) | $20 | Edge enforcement; ~10 rules |
| Envoy/Istio in-cluster Redis | Infrastructure cost only | No SaaS overhead |
| In-process (Bucket4j, single node) | $0 | No external store; not distributed |

The cost of **not** rate limiting: a single misbehaving Twilio integration sending 10× expected SMS volume can cost thousands of dollars per hour before anyone notices.

---

### What Can Go Wrong

| Failure Mode | Effect | Mitigation |
|---|---|---|
| Redis becomes a bottleneck | Limiter adds latency to every request | Shard counters; use local admission |
| Clock skew across servers | Window boundaries are inconsistent | Use Redis `TIME` command, not local clocks |
| Limit too strict | Legitimate bursts are blocked | Use token bucket; track false-positive 429s |
| Limit too loose | Downstream is not protected | Per-feature limits; regular threshold review |
| Boundary burst (fixed window) | 2× requests in 2 seconds | Use sliding window or token bucket |
| Hot key in Redis | One shard overwhelmed by high-traffic key | Shard by key prefix; use local admission |

---

### Operations and Maintenance

- **Monitor limiter latency as a first-class SLO.** The limiter is on every request path. Alert at p99 > 2 ms; investigate before it becomes the bottleneck.
- **Track false-positive rate.** Log 429s by caller, endpoint, and time window. A spike in legitimate-user 429s means a threshold is too tight or a client has a retry bug.
- **Review thresholds quarterly.** Traffic patterns change. A limit that protected at launch may be blocking legitimate 10× growth, or may be too loose for evolved attack patterns.
- **Test fail behavior explicitly.** Kill the Redis store in staging; verify the system fails open or closed as intended.
- **Use per-feature limits.** `/send-sms` and `/search-products` have different cost and abuse profiles. A shared global limit protects neither well.
- **Shard counters for high-cardinality keys.** 10M users × 1 counter each = 10M keys. Distribute across Redis nodes by key prefix to avoid hot shards.

---

### Evolution Over Time

| Stage | Approach | When to use |
|---|---|---|
| Early / single server | In-process token bucket (Bucket4j, in-memory map) | 1–2 servers; simplest path |
| Multi-server | Redis atomic counter or Lua script | 3–20 servers; need shared enforcement |
| High scale | Local admission + periodic global sync | 20+ servers; Redis bandwidth is a concern |
| Adaptive | Dynamic limits based on real-time system health signals | Mature platform; autoscaling + circuit breaker integration |

---

### Interview Trade-Off Questions and Answers

**1. When is token bucket better than sliding window, and when does exact enforcement matter enough to pay the extra cost?**

Token bucket is better when burst is intentional and user-friendly — a user legitimately refreshes a dashboard 5 times in 2 seconds. It allows short bursts as long as the average rate stays within budget, and it is cheaper to implement (two values: token count and last-refill time).

Sliding window log is better when exact enforcement is required — failed login attempts (where a boundary burst enables a brute-force attack), OTP sends (where exceeding a vendor quota causes dropped messages), or compliance-mandated quotas. The extra cost (storing one timestamp per request) is only worth paying when the business or security consequence of a boundary burst is material.

Sliding window counter is the practical middle ground: it approximates the sliding window with constant memory and is accurate enough for API fairness quotas.

**2. If the central limiter store is unavailable, should the system fail open or fail closed?**

It depends on what the limiter protects.

For security-critical or cost-critical endpoints (login attempts, payment processing, SMS sends), fail closed or use a conservative local fallback bucket. The risk of unlimited requests is higher than the risk of temporarily blocking clients.

For non-critical endpoints (analytics, search, product catalog), fail open to preserve availability. A brief window of unrated traffic is acceptable.

The local admission fallback is the best default: keep a conservative in-process token bucket on each server. If Redis is unreachable, enforce from the local bucket (which underestimates capacity, erring on the side of protection). When Redis recovers, reconcile and resume global enforcement.

**Never rely on a single answer for all endpoints.** Document fail behavior per service in the runbook.

**3. How do you balance per-user fairness with global system protection during a burst or attack?**

Use two independent limit layers:

- **Global / fleet-level limit** at the API gateway: protects total system capacity regardless of who is sending. Example: 50K req/s fleet-wide regardless of caller identity.
- **Per-user / per-tenant limit** at the service layer: enforces fairness. Example: 100 req/min per user, 10K req/min per tenant.

During a distributed attack from many accounts, the fleet-level limit absorbs the burst. During a single rogue tenant, the per-tenant limit contains the damage without affecting others.

Additionally, **dynamic limits** improve this further: detect anomalous behavior (a user sending 10× their historical average) and tighten their window automatically — isolating the bad actor while preserving capacity for everyone else. This requires behavioral baselines but scales well on mature platforms.

---
## Chapter 8: Distributed Consensus

### What Problem Does Consensus Solve?

Imagine you run a bank with three ATMs. A customer withdraws $500. Which ATM records it first? What if two ATMs both think they processed it? Without coordination, the customer might withdraw $1,000 when they only have $500.

Distributed consensus solves this: **multiple machines must agree on a single sequence of events, even when some machines crash or messages get delayed.**

More formally: keep a replicated state machine — a group of machines applying the same ordered commands so they stay identical — consistent across failures.

**Why can’t one machine just be the source of truth?** It can, until it fails. A single coordinator is a single point of failure (SPOF). Consensus distributes that coordination across multiple machines so the system survives individual failures.

**The core guarantee:** consensus ensures that if any machine commits a decision, all surviving machines will eventually commit the same decision — and no two machines commit conflicting decisions.

---

### The Intuition: Voting on a Single Truth

Think of consensus like a committee vote. If you need 3 out of 5 members to agree before passing a resolution, the committee can survive up to 2 absent members and still function. But if too many members are absent, you can’t reach quorum (the minimum number agreeing to make a decision valid) and no decision gets made.

In distributed systems:
- Each **node** is a committee member.
- Each **write** is a resolution.
- **Quorum** = majority = (N/2 + 1) nodes.
- A 3-node cluster tolerates 1 failure; a 5-node cluster tolerates 2.

**Real-world analogy:** When Kubernetes scales your app from 3 pods to 5, it writes that desired state to etcd (a distributed key-value store using the Raft consensus algorithm). If two control-plane nodes disagree about the current value, the cluster might create duplicate or missing pods. Consensus prevents that split view.

---

### Beginner: The Core Concepts

#### Leader, Followers, and Terms

Raft — the dominant modern consensus algorithm, designed to be easier to understand than older approaches — organizes nodes into three roles:

- **Leader:** accepts all client writes, replicates them to followers.
- **Follower:** receives and stores log entries from the leader.
- **Candidate:** a follower attempting to become the new leader during an election.

Time is divided into **terms** — numbered epochs. Each term has at most one leader. If no leader exists (due to a crash), nodes hold an election to pick a new one.

#### The Replicated Log

Every node maintains a **log** — an ordered list of commands. The leader appends new entries to its log and sends them to followers. Once a majority stores an entry, it’s **committed** — permanently part of the state machine.

```
Log Index:  1           2              3
Entry:      [set x=1]  [set y=2]      [del x]
Committed:  ✓           ✓              ✓
```

All nodes apply committed entries in the same order, so their state machines stay identical.

#### What Does "Quorum" Mean in Practice?

| Cluster Size | Quorum Needed | Failures Tolerated |
|---|---|---|
| 3 nodes | 2 | 1 |
| 5 nodes | 3 | 2 |
| 7 nodes | 4 | 3 |

**Never run an even number of nodes** — 4 nodes tolerate only 1 failure (same as 3), but pay the cost of an extra node. Use 3 or 5.

---

### Intermediate: How Raft Works Step by Step

#### Steady State (Normal Operation)

1. One node is elected leader for the current term.
2. Clients send all writes to the leader.
3. Leader appends the entry to its own log, then sends `AppendEntries` RPCs to all followers.
4. Followers write the entry to their logs and acknowledge.
5. Once a majority acknowledges, the leader **commits** the entry and applies it to its state machine.
6. The leader notifies followers of the commit; followers apply it in the same term order.

**Example:** A feature flag service using etcd. You call `etcdctl put feature_dark_mode true`. That write goes to the etcd leader, which replicates it to followers. Once 2-of-3 nodes acknowledge, the write is committed and every node reflects `feature_dark_mode = true`.

#### Leader Election (Failure Recovery)

1. Followers expect a **heartbeat** from the leader every 150–300ms.
2. If a follower’s **election timeout** fires (no heartbeat received), it increments the term and transitions to **Candidate**.
3. The candidate sends `RequestVote` RPCs to peers.
4. A peer grants its vote if: the candidate’s term is newer **and** the candidate’s log is at least as up-to-date as its own.
5. If the candidate wins a majority of votes, it becomes the new leader and immediately sends heartbeats to suppress other elections.
6. If no candidate wins (split vote), everyone waits a randomized timeout and retries.

**Randomized timeouts** prevent all followers from becoming candidates simultaneously, which would cause repeated split votes and no leader emerging.

#### Safety: Why Two Leaders Can Never Commit Conflicting Entries

The key invariant: **a node votes for at most one candidate per term.** Since two candidates would each need a majority, and there’s only one majority, only one candidate can win. This prevents two leaders in the same term.

Log matching via `(prevLogIndex, prevLogTerm)` in every `AppendEntries` ensures followers reject entries that don’t follow their current log state — the leader backs up and repairs diverged followers before moving forward.

#### Snapshotting and Log Compaction

A Raft log that grows forever eventually makes restarts unbearably slow. **Snapshots** solve this: periodically serialize the entire current state machine into a file, then truncate the log up to that point.

On restart: load the snapshot, then replay only the remaining log entries.

**Example:** etcd defaults to snapshotting every 10,000 entries. An etcd cluster handling 1,000 writes/second at 1 KB each accumulates ~86 GB/day before compaction. Configure `auto-compaction-retention = 1h` and `--snapshot-count = 10000` to bound disk usage.

---

### Advanced: Nuances That Matter at Scale

#### Read Linearizability and Follower Reads

A subtle but critical point: **reads from a consensus cluster are not automatically linearizable.**

In Raft, followers can serve reads from their local state — but a follower might be slightly behind the leader. Three strategies to handle this:

1. **Route all reads to the leader.** Always returns the latest committed value. Downside: creates a leader hot spot; limits read throughput.
2. **Leader lease reads.** The leader confirms it is still active (via a recent heartbeat within a bounded clock window) before serving the read locally. Avoids a full quorum round trip but requires tight clock discipline — clock skew can serve stale data.
3. **Quorum reads.** Read from a majority of nodes, return the value with the highest log index. Safe but doubles read latency.

**etcd:** Routes reads to the leader by default for linearizability. Clients can opt into `serializable` (follower) reads for lower latency at the cost of possible staleness.

**CockroachDB:** Closed timestamps let followers serve consistent reads for past timestamps without leader involvement — enabling near-linear read scale-out across replicas.

**Interview rule:** When proposing etcd or Consul, always state whether clients need linearizable reads or whether slightly stale reads are acceptable. The answer changes the architecture.

#### Paxos vs. Raft

Paxos is the original formal proof that distributed consensus is possible. Raft was designed as a more understandable alternative.

| Property | Paxos | Raft |
|---|---|---|
| **Origin** | Lamport 1989 | Ongaro & Ousterhout 2014 |
| **Understandability** | Notoriously hard to implement correctly | Designed to be understandable |
| **Leader** | Multi-Paxos adds a leader, not inherent | Leader is central |
| **Log handling** | Complex; entries can arrive out of order | Strict ordered log |
| **Used in** | Google Chubby, Spanner (internally) | etcd, CockroachDB, Consul |

For system design interviews, use Raft as your default mental model. Mention Paxos only to acknowledge it exists and that Raft is the modern, teachable alternative.

#### Multi-Region Consensus

Extending a consensus cluster across regions adds cross-AZ/region latency to every write. A 3-node cluster with one node in us-east-1, one in us-west-2, and one in eu-west-1 pays 70–200ms round-trip per write — unsuitable for low-latency coordination.

**Common pattern:** keep consensus clusters regional, use async replication for cross-region data. Only span regions when the failure scenario you’re protecting against is a full regional outage and the latency cost is acceptable.

**CockroachDB’s approach:** per-range Raft groups — each partition of a distributed SQL table has its own 3-node Raft group. This allows writes to commit within the closest region for that range, limiting cross-region latency to ranges that span regions.

---

### Real-World Systems That Use Consensus

| System | Algorithm | What It Coordinates |
|---|---|---|
| **etcd** | Raft | Kubernetes cluster state: pod counts, config maps, service endpoints |
| **Consul** | Raft | Service discovery, distributed KV, distributed locks |
| **Kafka KRaft** | Raft (built in) | Broker metadata, partition leadership (replaced ZooKeeper in Kafka 3.x) |
| **CockroachDB** | Per-range Raft | Each SQL partition’s replicated log |
| **ZooKeeper** | ZAB (similar to Raft) | Legacy Kafka, HDFS NameNode HA, HBase coordination |
| **Google Chubby** | Paxos | Distributed locking for Bigtable, GFS within Google |
| **Google Spanner** | Paxos | Global distributed SQL transactions |

**etcd in depth:** Every `kubectl apply` goes through etcd. Loss of etcd quorum halts all Kubernetes scheduling — no new pods, no config updates, no autoscaling. This is why Kubernetes documentation treats etcd as a critical data store requiring dedicated hardware and regular backups.

#### etcd vs. ZooKeeper: When to Choose Which

| Dimension | etcd | ZooKeeper |
|---|---|---|
| **Algorithm** | Raft | ZAB (Zookeeper Atomic Broadcast) |
| **Data model** | Flat key-value with hierarchical prefixes | Hierarchical ZNode tree |
| **Watch semantics** | Prefix watch; streams change events continuously | Single-fire watch; requires re-registration after each event |
| **Operational complexity** | Low; single binary, `etcdctl` CLI | Higher; JVM-based, separate ZK shell |
| **Kubernetes integration** | Native default | Not used |
| **Best for** | New systems: Kubernetes, service configs, feature flags | Legacy Apache ecosystem: pre-KRaft Kafka, HDFS |

**Decision rule:** For any new system, use etcd or Consul. ZooKeeper only when integrating with existing Apache ecosystem tools that require it.

---

### When to Use Consensus — and When Not To

#### Use Consensus When

- **Leader election** is needed for database primaries, Kafka controllers, or scheduler masters — correctness requires exactly one leader.
- **Distributed locks** where two processes must never hold the lock simultaneously (billing systems, job schedulers).
- **Configuration management** where all nodes must agree on the current config before acting — feature flags, routing rules, schema versions.
- **Coordination metadata** is small volume but must be 100% consistent.

#### Do Not Use Consensus When

- **High write throughput on user data** — consensus clusters stay small (3–5 nodes) and cannot scale horizontally. Use Raft for metadata, not for the 100,000 writes/second user data path.
- **Eventual consistency is acceptable** — Cassandra, DynamoDB, and other leaderless replication systems handle high-throughput writes without a consensus layer, at the cost of possible brief staleness.
- **Read-heavy workloads** — a consensus cluster’s leader bottleneck limits read throughput. Consider caching or follower reads with accepted staleness.

**The canonical anti-pattern:** storing application session data in etcd. Sessions are high-volume, tolerant of brief staleness, and don’t need consensus. Use Redis. Reserve etcd for low-volume, correctness-critical metadata.

---

### What Can Go Wrong?

| Failure Mode | What Happens | Recovery |
|---|---|---|
| **Leader crashes before commit** | Entry exists on leader’s log but not replicated; treated as uncommitted | New leader elected; entry discarded or re-proposed |
| **Network partition splits quorum** | Minority partition cannot commit writes; majority partition elects a new leader | Partition heals; minority syncs from majority’s log |
| **Log divergence after partial failures** | Followers have entries the new leader doesn’t | Leader uses `prevLogIndex/Term` to find divergence point, overwrites follower |
| **Slow follower lags far behind** | Full snapshot transfer required; brief loss of fault tolerance during transfer | Leader sends snapshot; follower replaces its log and state |
| **Clock skew on lease reads** | Leader thinks it’s still active; serves stale data after another leader was elected | Use quorum reads or route to leader; tight NTP discipline |
| **Election churn** | Frequent leader changes; no progress | Investigate CPU/disk/network on leader nodes; check heartbeat timeout tuning |

---

### API Design

```grpc
service Consensus {
  rpc RequestVote(RequestVoteRequest) returns (RequestVoteResponse);
  rpc AppendEntries(AppendEntriesRequest) returns (AppendEntriesResponse);
  rpc Propose(Proposal) returns (ProposalResponse);
  rpc GetLeader(LeaderRequest) returns (LeaderResponse);
}
```

- `RequestVote` — used during elections; candidates solicit votes from peers.
- `AppendEntries` — used by the leader to replicate log entries and send heartbeats.
- `Propose` — client-facing; submit a new command to be committed.
- `GetLeader` — allows clients to discover the current leader for redirect.

---

### Cost Model

Consensus clusters are intentionally small (3–5 nodes), so raw hardware cost is modest. The real cost is **latency** and **operational discipline**.

| Setup | Monthly Cost (AWS estimate) | Notes |
|---|---|---|
| etcd cluster (3 × m5.large) | ~$300 | Kubernetes control plane; tolerates 1 failure |
| etcd cluster (5 × m5.xlarge) | ~$800 | Tolerates 2 failures; higher-availability clusters |
| Consul cluster (3 × t3.medium) | ~$100 | Service discovery + KV; lightweight |
| ZooKeeper (3 × m5.large) | ~$300 | Legacy Kafka/Hadoop; JVM adds memory overhead |
| CockroachDB (3 × c5.2xlarge) | ~$1,500 | Full distributed SQL with per-range Raft |

**Latency cost per write:** every quorum commit adds one network round trip — ~1–5 ms within an AZ, ~10–30 ms cross-AZ. Consensus is cheap for low-volume coordination; prohibitively expensive for high-frequency data writes.

---

### Operations and Maintenance

Consensus clusters are critical infrastructure. Quorum loss halts all dependent systems — Kubernetes scheduling stops the moment etcd loses quorum. Treat these clusters with the same rigor as primary databases.

**Key practices:**

- **Monitor quorum health continuously.** Alert if any node leaves the quorum or if leader elections happen more than once per hour. Frequent elections signal network instability or CPU starvation.
- **Watch follower replication lag.** A follower too far behind needs a full snapshot transfer from the leader — a multi-minute operation that temporarily reduces fault tolerance.
- **Set compaction policies.** Unbounded log growth causes disk exhaustion. Configure `auto-compaction-retention = 1h` and alert at 70% disk usage.
- **Back up etcd regularly.** `etcdctl snapshot save` produces a single-file backup. Run hourly, store in S3, test restore quarterly — never perform a first restore during an incident.
- **Use dedicated hardware with fast SSDs.** Consensus performance depends on low-latency WAL writes. Noisy neighbors cause heartbeat timeouts and spurious elections.
- **Roll changes one node at a time.** When replacing nodes during upgrades, remove one node, confirm quorum health, then add the replacement. Never replace multiple nodes simultaneously.

---

### Evolution Over Time

| Phase | Focus |
|---|---|
| **Year 1 (small system)** | Single-region 3-node cluster; leader election and log replication for a single coordination concern (e.g., database leader election) |
| **Year 2 (growing system)** | Add snapshotting and compaction; faster failover automation; separate consensus clusters per concern (one for DB, one for job scheduler) |
| **Year 3 (large system)** | Multi-region coordination with per-region clusters and async cross-region replication; automated recovery runbooks; real-time quorum health dashboards |

---

### Interview Trade-Off Questions and Answers

**Q1: When is a 3-node quorum enough, and when does the extra fault tolerance of 5 nodes justify the added latency?**

**A:** A 3-node cluster tolerates 1 simultaneous failure. For most production systems, this is sufficient — the probability of 2 nodes failing at the same time before the first is repaired is very low. Use 5 nodes when: (a) you operate across 3 availability zones and want to survive a full AZ loss without reducing to a 1-node quorum, (b) you have strict SLAs and the system is critical enough that the latency tradeoff (one extra hop) is worth the insurance. The extra latency is minimal within a region (~1ms) but may matter in cross-AZ/cross-region deployments.

**Q2: When do you really need consensus instead of a simpler primary-replica setup with manual failover?**

**A:** Use a simple primary-replica setup when: human-in-the-loop failover is acceptable (seconds to minutes of downtime), write volume is high enough that consensus latency would be a bottleneck, or the system is internal-only and brief inconsistency is tolerable. Use consensus when: automated failover must happen in seconds without human intervention, split-brain would cause data corruption or duplicate financial transactions, or the system coordinates other systems (a coordination plane must itself be highly available). In practice, consensus is for the *coordination metadata layer* (who is leader, what is the current config), not for bulk user data.

**Q3: Is multi-region consensus worth the write-latency cost for your workload, or should coordination stay regional?**

**A:** Multi-region consensus pays 70–200ms per write for cross-region round trips. That’s acceptable for configuration changes that happen rarely but unacceptable for any latency-sensitive write path. The standard pattern is: keep consensus clusters regional, use async replication between regions for data, and only use multi-region consensus when the failure scenario is a full regional outage. For most systems, regional consensus with cross-region async replication and a runbook for region failover is the right balance. CockroachDB’s per-range Raft approach is the exception — it places Raft groups near their data, limiting cross-region hops to ranges that genuinely span regions.

---
## Chapter 9: Distributed Systems

Distributed systems are the backbone of every large-scale product — Google Search, Amazon's checkout, Netflix streaming, WhatsApp messaging. This chapter builds understanding from scratch: what a distributed system is, why you build one, the fundamental problems they introduce, and the engineering techniques used to solve those problems. By the end you will be able to reason about coordination, failure, and consistency trade-offs in a system design interview.

---

### Part 1 — Foundations (Beginner)

#### What Is a Distributed System?

A distributed system is a collection of independent computers that appears to users as a single coherent system. Your laptop and a server farm are both computers, but when you use Gmail, you interact with thousands of servers spread across multiple data centers — yet it feels like one inbox.

**Simple mental model:** Think of a restaurant chain. Each franchise location (node) can take orders and serve food independently. The corporate headquarters (control plane) keeps the menu in sync across all locations. If one location burns down, customers go to the next one. That is a distributed system.

#### Why Build a Distributed System?

Four forces push engineers toward distribution:

| Driver | Problem it solves | Real-world example |
|---|---|---|
| **Scale** | A single server has finite CPU, memory, disk, and network bandwidth | Google processes ~8.5 billion searches/day — no single machine can handle that |
| **Fault tolerance** | A single server will eventually crash, lose power, or suffer hardware failure | Netflix replicates video chunks across multiple servers so a disk failure doesn't interrupt your show |
| **Geographic distribution** | Serving Tokyo users from Virginia adds ~150ms of latency | Cloudflare runs 300+ edge nodes so your nearest server is typically under 20ms away |
| **Independent scalability** | Different services have different bottlenecks | Uber's map service needs read-heavy geo-indexing; its billing service needs transactional writes — each scales differently |

#### When NOT to Use a Distributed System

Distribution introduces real complexity. Before distributing, ask whether you need to:

- **Traffic fits one machine (< 10K RPS):** A well-tuned single server with a managed backup is far simpler. Most startups live here for years.
- **Data fits one database:** One primary database with a read replica handles most applications up to millions of users.
- **Strong consistency everywhere:** Cross-node coordination adds latency. If every operation must be strongly consistent and latency matters, a monolith may outperform a distributed system.

> **Rule of thumb:** Distribute only what must be distributed, and only when the cost of not distributing is real and measurable. Premature distribution is one of the most expensive engineering mistakes.

---

### Part 2 — Core Concepts (Intermediate)

#### The Fundamental Challenges of Distribution

Four problems arise over a network that simply do not exist on a single machine:

1. **Messages can be delayed or lost** — A node cannot tell the difference between a slow reply and a dead node. It must decide: keep waiting or assume failure?
2. **Clocks drift** — Two servers' clocks are never perfectly in sync. "Who wrote this first?" is a hard question without a shared clock.
3. **Partial failures** — One service can fail while the rest runs fine, leaving the system in an ambiguous half-working state.
4. **Concurrent updates** — Two nodes can modify the same data simultaneously, creating conflicts.

These are captured formally in two ideas:
- **CAP theorem** — A distributed system can guarantee at most two of: Consistency, Availability, Partition tolerance. (See Chapter 5 for the full treatment.)
- **Fallacies of Distributed Computing** — Eight common false assumptions: the network is reliable, latency is zero, bandwidth is infinite, the network is secure, topology doesn't change, there is one administrator, transport cost is zero, the network is homogeneous.

#### Key Properties Every Distributed System Must Balance

| Property | What it means | Trade-off |
|---|---|---|
| **Scalability** | Performance grows as nodes are added | Adding nodes adds coordination overhead |
| **Fault tolerance** | System keeps operating despite partial failures | Redundancy costs money and adds complexity |
| **Transparency** | System appears as one machine to users | Hiding failures can make debugging harder |
| **Concurrency** | Multiple nodes work simultaneously | Requires careful coordination to avoid corruption |
| **Consistency** | All nodes return the same value for the same key | Strong consistency limits availability during partitions |
| **Replication** | Data copied to multiple nodes for durability | Replication lag means reads may be stale |

#### How Nodes Coordinate: Three Patterns

**Pattern 1 — Leader-Follower (Primary-Replica)**

One node is elected as the authoritative source for writes. All others replicate its state.

- Simple to reason about; reads can scale by adding replicas
- Leader is a single point of bottleneck; failover takes time (seconds to minutes)
- Used by: PostgreSQL, Redis Sentinel, Kafka topic partitions, MySQL with GTID replication

*Real example:* A PostgreSQL primary handles all writes. Three read replicas serve analytics queries. If the primary crashes, Patroni (a HA tool) detects the failure and promotes a replica to primary within ~30 seconds.

**Pattern 2 — Leaderless (Peer-to-Peer)**

Any node can accept a write. Writes propagate to other nodes. Requires conflict resolution.

- Highly available — no single point of failure for writes
- Harder to make strongly consistent; conflicts resolved via last-write-wins, vector clocks, or CRDTs
- Used by: Cassandra, DynamoDB, Amazon S3

*Real example:* In Cassandra, a write for `user_id=42` goes to three replicas simultaneously. If replica 2 is slow, replicas 1 and 3 acknowledge the write and the client proceeds. Replica 2 catches up via a repair process. Two concurrent writes to the same key from different nodes are resolved by last-write-wins (based on timestamps).

**Pattern 3 — Consensus-Based**

A cluster of nodes votes on every write. A write is committed only after a majority (quorum) agrees.

- Strongest consistency guarantees
- Higher write latency; limited to small clusters (3 or 5 nodes) because larger groups slow voting
- Used by: etcd (Kubernetes config store), ZooKeeper (Kafka metadata), CockroachDB

*Real example:* Kubernetes stores all cluster state in etcd. When you run `kubectl apply`, the API server writes to etcd, which uses the Raft consensus algorithm to get agreement from at least 2 of 3 etcd nodes before acknowledging the write. If one etcd node crashes, the cluster still has a majority (2 of 3) and continues to accept writes.

#### Replication: Synchronous vs. Asynchronous

| Mode | How it works | Consistency | Latency | Risk |
|---|---|---|---|---|
| **Synchronous** | Primary waits for replica confirmation before ACKing client | Strong — replicas never lag | Higher — adds a network round trip | Replica slowness blocks the primary |
| **Asynchronous** | Primary ACKs immediately; replicas catch up later | Eventual — replicas may lag | Lower — primary doesn't wait | If primary crashes before replica syncs, data may be lost |
| **Semi-synchronous** | Primary waits for at least one replica before ACKing | Middle ground | Middle ground | MySQL's default mode |

*Real example:* Google Spanner uses synchronous replication within a region and semi-synchronous across regions. Financial transactions require synchronous replication so no committed write is ever lost. A photo upload service might use asynchronous replication because losing one photo upload is acceptable and the lower latency improves user experience.

#### Failure Modes Unique to Distributed Systems

| Failure Mode | What happens | Real-world example | Mitigation |
|---|---|---|---|
| **Network partition** | Two groups of nodes lose connectivity | An AWS Availability Zone loses its uplink; nodes inside still work but can't reach other AZs | Design for partition tolerance; accept eventual consistency during partitions |
| **Split-brain** | Two nodes both believe they are the leader, accepting conflicting writes | Two Kafka brokers both think they are partition leader after a network glitch, producing duplicate messages | Fencing tokens (monotonically increasing lease IDs) — storage systems reject writes with stale tokens |
| **Byzantine fault** | A node sends incorrect or malicious data | A compromised validator node in a blockchain broadcasts invalid transactions | Byzantine fault-tolerant (BFT) consensus; used in blockchains, not typical enterprise systems |
| **Clock skew** | Nodes disagree on current time by milliseconds to seconds | A distributed lock expires at 10:00:00.500 on node A but node B's clock reads 10:00:00.450, so node B still treats the lock as valid | TrueTime (Google Spanner: GPS + atomic clocks); logical clocks (Lamport timestamps) for systems that don't need wall time |
| **Cascading failure** | One slow node queues up callers, overloading the whole system | A slow database causes all API servers to block on DB calls, exhausting their thread pools | Circuit breakers, timeouts, and bulkheads at every service boundary |

> **Real-world postmortem:** In 2012, AWS suffered a widespread outage when an EBS control plane bug triggered a cascading failure. Services using circuit breakers and async decoupling degraded gracefully. Services with tight synchronous coupling failed completely. The incident validated the importance of bulkhead patterns in distributed architectures.

---

### Part 3 — Advanced Mechanics (Expert)

#### Leader Election

Leader election is the process by which nodes agree on which one node is the current authoritative coordinator. Without it, you get split-brain.

**How it works in practice (Raft algorithm):**
1. Nodes start as followers, waiting for heartbeats from a leader.
2. If a follower doesn't hear from a leader within an election timeout (150–300ms), it becomes a candidate and votes for itself.
3. The candidate sends `RequestVote` RPCs to other nodes. Nodes grant their vote only once per term.
4. If a candidate receives votes from a majority, it becomes the leader and starts sending heartbeats.
5. If no majority forms (split vote), the election times out and a new one starts with an incremented term number.

*Real example:* etcd (used by Kubernetes) uses Raft. When an etcd leader node crashes, the remaining two nodes hold an election within ~500ms. The one that wins sends its first heartbeat, and Kubernetes resumes accepting API requests. The whole failover is invisible to most users.

#### Distributed Locks and Why They Are Tricky

A distributed lock coordinates access to a shared resource across multiple nodes — preventing two services from processing the same order at the same time, for instance.

**The naive approach fails:** Using Redis `SET key value NX PX 30000` gives you a lock that expires after 30 seconds. But consider:

1. Worker A acquires the lock (30s TTL).
2. Worker A gets a GC pause or network slowdown and takes 35 seconds.
3. At second 30, the lock expires. Worker B acquires the lock.
4. Worker A resumes at second 35, still thinking it holds the lock.
5. Both A and B are writing to the shared resource simultaneously.

**The fix — fencing tokens:**

Every lock acquisition returns a monotonically increasing token (epoch number). Storage systems that receive writes check the token and reject any write with a token lower than the highest they've seen.

```
Worker A acquires lock → receives token 42
Worker B acquires lock → receives token 43
Worker A tries to write with token 42 → REJECTED (storage has seen 43)
Worker B writes with token 43 → ACCEPTED
```

This is why "just use Redis for distributed locks" is incomplete advice. A lease without fencing protects liveness (only one holder at a time, in the happy path) but not correctness (a stale holder can still write after its lease expires). For correctness-critical workflows, you need either fencing tokens or idempotent writes that can detect and reject stale updates.

**When to use distributed locks vs. idempotency:**
- Use locks when you need mutual exclusion and the window of concurrent access is small (< 1 second).
- Prefer idempotent writes when the lock window would be long or when lock failures are hard to recover from. An idempotent write with a unique operation ID is more resilient than a lock.

#### Quorum Reads and Writes

For a replicated store with `N` replicas, choose read quorum `R` and write quorum `W` such that:

```
R + W > N
```

This ensures every successful read overlaps with every successful write on at least one replica, making stale reads less likely.

**Common configurations:**

| N | W | R | Effect |
|---|---|---|---|
| 3 | 2 | 2 | Balanced — tolerates 1 failure on either read or write |
| 3 | 3 | 1 | Write-heavy durability — all replicas must confirm writes; reads are fast |
| 3 | 1 | 3 | Read-heavy consistency — writes are fast; reads check all replicas |

*Real example:* DynamoDB with W=2, R=2, N=3 means a write must be acknowledged by 2 of 3 replicas. A subsequent read from any 2 replicas will always hit at least one that has the latest write. This gives you strong consistency without requiring all 3 replicas to be available.

**Quorum is not enough alone:** Quorum prevents stale reads in the common case but doesn't prevent split-brain during network partitions. That requires fencing tokens as described above.

#### Clock Synchronization and Logical Clocks

Distributed systems cannot rely on wall clocks for ordering because clocks drift. Two approaches:

**Physical clocks (NTP):** Servers synchronize to network time servers. Typical accuracy: ±10ms in a data center, ±100ms across the internet. Good enough for coarse-grained ordering but not for strict event ordering across nodes.

**Logical clocks (Lamport timestamps):** Each node maintains a counter. On every send, the counter increments. On every receive, the counter is set to `max(local, received) + 1`. This gives a partial ordering of events without relying on wall time.

**Hybrid Logical Clocks (HLC):** Combine wall time with a logical component. CockroachDB uses HLC to track causality while staying close to wall time — enabling bounded staleness reads without requiring TrueTime hardware.

**TrueTime (Google Spanner):** GPS receivers and atomic clocks in every data center provide time with bounded uncertainty (typically ±7ms). Spanner's commit wait forces each transaction to wait out the uncertainty window before committing, guaranteeing that later transactions always get higher timestamps. This enables globally consistent reads without any distributed locking.

*The practical implication for leases and TTLs:* If a lease expires at wall time T and clock skew is S, a node must treat the lease as expired at T - S (to be safe). Failing to account for skew means two nodes may both believe they hold a valid lease simultaneously.

#### Event Delivery Guarantees

Every message queue or event stream makes a guarantee about how many times a consumer processes each event:

| Guarantee | What it means | How achieved | Use when |
|---|---|---|---|
| **At-most-once** | Message delivered 0 or 1 times — possible loss, no duplicates | Commit offset before processing; if the consumer crashes after commit but before processing, the message is skipped | Metrics and logging where occasional gaps are acceptable |
| **At-least-once** | Message delivered 1 or more times — no loss, possible duplicates | Commit offset only after processing succeeds; broker re-delivers on consumer restart | Most production systems; requires idempotent consumers |
| **Effectively-once** | Appears exactly once to the application | At-least-once delivery + idempotent consumer-side deduplication | Payment processing, order placement — anywhere duplicates cause visible damage |

**Why true "exactly-once" at the broker layer is hard:**

Kafka provides exactly-once semantics *within Kafka* using transactions and idempotent producers. But once the event triggers an action in an external system (send an email, charge a credit card), exactly-once is no longer Kafka's problem — it requires idempotency on the external side.

*Real example:* Stripe's payment processing accepts at-least-once delivery from its internal event queues. Each charge attempt carries an idempotency key (a UUID generated by the caller). If the same key arrives twice, Stripe returns the original charge result without charging the card again. This is cheaper and more reliable than trying to guarantee exactly-once delivery at the broker layer.

**Commit position determines delivery semantics in Kafka:**

```
Auto-commit before processing → at-most-once (message may be skipped on crash)
Manual commit after processing → at-least-once (message may be reprocessed on crash)
Transactional write + commit → effectively-once (requires consumer idempotency)
```

#### The Saga Pattern: Distributed Transactions Without 2PC

When a business workflow spans multiple services with separate databases, you cannot use a database transaction to coordinate them. Two-phase commit (2PC) is the classical solution but has problems: the coordinator is a single point of failure, and participants block during the prepare phase.

**The Saga alternative:** Break the workflow into a sequence of local transactions. Each step succeeds or fails independently. If a later step fails, earlier steps are undone using explicit compensating transactions.

*Real example — e-commerce order:*

```
Step 1: Reserve inventory          → Compensation: Release reservation
Step 2: Charge payment             → Compensation: Refund charge
Step 3: Create shipment record     → Compensation: Cancel shipment
Step 4: Send confirmation email    → (no compensation needed; email is idempotent)
```

If step 3 fails, the saga runs step 2's compensation (refund) and step 1's compensation (release reservation) in reverse order.

**Choreography vs. Orchestration:**

| Style | How it works | Pros | Cons |
|---|---|---|---|
| **Choreography** | Each service listens for events and reacts independently | No central coordinator; highly decoupled | Hard to trace the overall flow; debugging is difficult |
| **Orchestration** | A central saga orchestrator calls each step and handles failures | Easy to visualize and debug; single source of truth | Orchestrator is a stateful service that must itself be fault-tolerant |

**Making the orchestrator reliable:** Store saga state durably (in PostgreSQL or a Kafka compacted topic) and design the orchestrator to be restartable from any step. If the orchestrator crashes mid-flow, it must be able to resume without re-running already-completed steps.

**When to use sagas:**
1. A workflow spans multiple services with separate databases.
2. The business can tolerate eventual consistency (state may be inconsistent for seconds while compensations propagate).
3. 2PC's blocking behavior is unacceptable for your availability requirements.

---

### Part 4 — System Design Application

#### Putting It Together: Designing a Distributed Coordination Service

A coordination service (like etcd or ZooKeeper) provides leader election, distributed locks, and configuration storage to other services. Here is how to think through its design:

**API surface:**

```
POST /v1/leader/elect          → returns { leader_id, token, lease_expires_at }
POST /v1/locks/{name}:acquire  → returns { acquired: true, token: 7, expires_at }
DELETE /v1/locks/{name}:release → returns { released: true }
PUT /v1/config/{key}           → stores configuration value
GET /v1/config/{key}           → returns current configuration value
```

**Capacity estimates:**
- Quorum cluster size: 3 or 5 nodes (odd number to avoid ties; 7+ adds latency without adding meaningful fault tolerance)
- Write latency: one quorum write = at least one network round trip to majority → ~1–5ms in a single data center
- Replication bandwidth: 5,000 config updates/second × 1 KB = ~5 MB/s before replication overhead
- Clock skew budget: lease duration must be >> maximum observed clock skew; if skew is 10ms, a 30-second lease is safe; a 15ms lease is not

#### Design Trade-Offs at a Glance

| Axis | Option A | Option B | When to choose A |
|---|---|---|---|
| Consistency vs. availability | Reject writes during partition (CP) | Accept writes with possible conflicts (AP) | Financial data, configuration, leader election |
| Replication mode | Synchronous | Asynchronous | When you cannot afford to lose any acknowledged write |
| Coordination style | Consensus (Raft/ZooKeeper) | Quorum (DynamoDB-style) | When you need strong consistency on metadata; quorum for user data |
| Lock safety | Fencing tokens | TTL-only leases | Always prefer fencing tokens for correctness-critical workflows |
| Delivery guarantee | Effectively-once | At-least-once + idempotency | Use idempotency — it's simpler and more resilient than broker-level exactly-once |

#### Failure Modes and Mitigations

| Failure | Root cause | Mitigation |
|---|---|---|
| Leader election flaps | Short election timeout causes re-elections under load | Tune heartbeat and timeout intervals; use pre-vote (Raft optimization) |
| Split-brain | Network partition between leader and followers | Fencing tokens; quorum rules that require majority to proceed |
| Lost write after failover | Async replica promotes before it has the latest data | Semi-sync or sync replication; write fencing on epoch change |
| Stale lock holder | GC pause or network delay outlasts TTL | Fencing tokens; idempotent writes that detect stale operations |
| Duplicate saga execution | Retry replays a workflow step | Idempotency keys per saga step; deduplication table checked before execution |
| Clock skew breaks leases | System clock adjusted or drifts | NTP with monitoring; leases far longer than max observed skew |
| Cascading failure | Slow node backs up callers | Circuit breakers with half-open probe; bulkhead thread pools per downstream |

#### Observability and Operations

A distributed system that you cannot observe will eventually surprise you at the worst possible moment:

- **Leader churn rate:** Alert if leader elections exceed 1/hour in a healthy cluster — frequent elections indicate instability.
- **Replication lag:** Alert if any replica lags the primary by more than 5 seconds — it may not be usable for failover.
- **Quorum loss:** Immediately page on-call — a cluster below quorum cannot accept writes.
- **Clock skew:** Alert if any node's skew exceeds half the minimum lease duration.
- **Saga state:** Track saga completion rate, compensation rate, and stuck sagas (those that haven't advanced in N minutes).

**Failure drills to run regularly:**
- Kill the leader and verify automatic failover completes within SLA.
- Partition one node and verify quorum continues to function.
- Inject a GC pause into a lock holder and verify the fencing token prevents stale writes.
- Replay a saga from a mid-flow checkpoint and verify idempotency keys prevent double-execution.

#### Evolution Over Time

| Phase | What you build | Why |
|---|---|---|
| **Year 1** | Primary-replica databases; simple Redis-based locks; manual failover | Fast to build; sufficient for early scale |
| **Year 2** | Quorum-based writes; automated failover (Patroni/Orchestrator); idempotent consumers | Eliminate manual toil; reduce recovery time from hours to seconds |
| **Year 3** | Multi-region consensus for critical metadata; saga orchestration across domains; HLC for bounded staleness reads | Survive regional failures; eliminate 2PC; enable globally consistent reads |

---

### Interview Questions and Answers

**Q1: When is a saga a better fit than distributed two-phase commit (2PC), and what business complexity does it push into compensation logic?**

**A:** Use a saga over 2PC when the workflow spans services with separate databases, when the coordinator being a single point of failure is unacceptable, or when blocking all participants during a prepare phase violates availability requirements. 2PC's prepare phase holds database locks across multiple services for the duration of the commit — a coordinator crash leaves all participants blocked waiting for a decision.

The trade-off is that sagas push complexity into compensation logic. You must design explicit undo actions for every non-terminal step. Compensations must themselves be idempotent (they may be retried). Some business effects — like a sent email or a triggered push notification — cannot be undone, only acknowledged. The business must accept eventual consistency during the window between a step's success and the completion or rollback of the full saga. For workflows where this is unacceptable (real-time trading, ATM withdrawals), 2PC or a single-service transactional boundary is the right answer.

**Q2: How do you choose between asynchronous replication, quorum writes, and single-leader synchronous replication for a user-facing workflow?**

**A:** The choice depends on what you can and cannot afford to lose or accept:

- **Asynchronous replication:** Choose when low write latency matters more than durability guarantees and when losing the last few seconds of writes during a failure is acceptable. Good for: social media posts, non-financial user profile updates, activity logs.
- **Quorum writes (R + W > N):** Choose when you need to survive node failures without a dedicated leader failover process, and when you can tolerate slightly higher write latency than async but lower than full sync. Good for: user data in Cassandra or DynamoDB, where availability matters more than strict consistency.
- **Single-leader synchronous replication:** Choose when you cannot lose any acknowledged write and when the system's value depends on strong read-your-writes consistency. Good for: payment records, inventory levels, anything where stale reads after failover would cause incorrect business decisions.

In practice, most systems use asynchronous replication for read replicas (to serve read traffic) and synchronous or semi-synchronous replication for the standby that would take over on leader failure.

**Q3: When should you rely on distributed locks, and when is it safer to redesign the workflow to be idempotent without a lock?**

**A:** Use distributed locks when mutual exclusion is genuinely required for correctness and the critical section is short (under 1 second). Example: a job scheduler ensuring only one worker processes a given task partition at a time.

Avoid distributed locks when the lock window would be long (seconds or minutes), when the downstream operation is an external API call, or when the lock holder can fail silently (GC pause, network partition). In these cases, the lock provides false safety — a stale holder can resume after its lease expires and corrupt shared state.

The safer alternative is idempotent design: assign a unique operation ID (idempotency key) to each logical operation. Before executing, check whether the operation has already been completed. If yes, return the cached result. If no, execute and record the result atomically. This approach handles retries, concurrent attempts, and stale workers without relying on a lock's availability or timing guarantees. Stripe's payment API, AWS S3's conditional puts, and database `INSERT ... ON CONFLICT DO NOTHING` are all examples of idempotent design replacing distributed locks.

---
## Chapter 10: Security Design

### What Is Security Design?

Security in distributed systems is not a single feature — it is a layered system that spans identity, transport, application logic, data storage, and operations. Every layer must be independently secured because a failure in any one layer can compromise the entire system.

Think of it like a bank. The front door requires an ID (authentication). The teller checks if you're allowed to access a specific account (authorization). Your account data is encrypted in the bank's storage (encryption at rest). The wire transfer goes over a secure channel (encryption in transit). The vault credentials rotate regularly (secrets management). Cameras log everything (audit logging). Security guards block a crowd trying to rush the door (DDoS protection).

**Real-world stakes:** Stripe processes hundreds of billions of dollars annually. GitHub stores the source code of millions of organizations. A security failure at either company is not just a technical incident — it is a business-ending event. Both companies invest heavily in scoped authorization, audit trails, and strict secrets management for this reason.

### Security Layers and Threat Model

Before picking tools, map threats layer by layer. For each layer, ask: *what asset exists here, who could abuse it, what trust boundary protects it, and what control detects or blocks the abuse?*

| Layer | What it protects | Key threats | Controls |
|---|---|---|---|
| **Identity** | Who users and services are | Credential stuffing, session theft, token replay, weak MFA | Strong auth, MFA, short-lived tokens, session invalidation |
| **Transport** | Data in motion | Plaintext interception, bad TLS config, cert expiry, MITM | TLS 1.3, HSTS, mTLS for internal traffic, cert automation |
| **Application** | What actors are allowed to do | Broken access control, IDOR, injection, XSS, SSRF | RBAC/ABAC, parameterized queries, input validation, CSP |
| **Data** | Sensitive data at rest | Unencrypted backups, over-broad DB permissions, data leaks | Encryption at rest, envelope encryption, field-level encryption |
| **Operations** | Secrets, deploys, dependencies | Leaked API keys, vulnerable libraries, supply chain attacks | Secrets vault, dependency scanning, signed artifacts, audit logs |

### Authentication — Proving Who You Are

Authentication answers: "Who is this?" It is the first gate every request must pass.

**Basic username + password** is the starting point but is insufficient alone. Passwords are reused, guessed, and phished. Treat authentication as multi-factor from day one for any system with sensitive data.

**Multi-Factor Authentication (MFA)** requires a second proof of identity beyond a password:
- **TOTP (Time-based One-Time Password)** — apps like Google Authenticator or Authy generate a 6-digit code that changes every 30 seconds. Simple and widely supported.
- **Hardware keys (FIDO2/WebAuthn)** — physical USB or NFC devices (YubiKey). Phishing-resistant because the key binds to the site's origin. Used by Google, GitHub, and Stripe internally.
- **Push notifications** — the user approves a login request on their phone via an app. More user-friendly but susceptible to MFA fatigue attacks (spamming the user with approve prompts).

**Service-to-service authentication** (no human involved):
- **mTLS (mutual TLS)** — both sides of a connection present certificates. Each service proves its identity cryptographically. Used extensively in service meshes (Istio, Linkerd).
- **Signed tokens (JWT with client credentials)** — a service presents a signed token obtained from an internal auth server. Easier to implement than mTLS but requires a token issuer.
- **API keys** — simple shared secrets. Appropriate for external developer APIs (Stripe, Twilio) but rotate them frequently and never embed them in client-side code.

**Authentication API design:**

```http
POST /v1/auth/login         # exchange credentials for tokens
POST /v1/auth/refresh       # exchange refresh token for new access token
POST /v1/auth/logout        # invalidate session
GET  /v1/me                 # return current user's identity
```

Login request:
```json
{
  "email": "user@example.com",
  "password": "correct horse battery staple",
  "mfa_code": "482917"
}
```

Login response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expires_in": 900,
  "token_type": "Bearer",
  "user_id": "usr_123"
}
```

### OAuth 2.0 — Delegated Authorization

OAuth 2.0 is an authorization framework, not an authentication system. It lets a user say, "This third-party app may read my calendar," without handing over their password. The user never gives their credentials to the app — they give their consent at the Authorization Server, which issues a scoped token.

**Real-world example:** When you click "Sign in with Google" on a third-party app, you are redirected to Google (the Authorization Server). Google asks if you consent to share your email and profile. You approve. Google sends the app a token. The app uses that token to call Google APIs on your behalf. Your Google password never touched the third-party app.

**Core roles:**

| Role | Responsibility | Example |
|---|---|---|
| **Resource Owner** | The user who owns the data | You, the Google account holder |
| **Client** | The app requesting access | A calendar scheduling app |
| **Authorization Server** | Issues tokens after user consent | Google's OAuth server |
| **Resource Server** | Hosts the protected API | Google Calendar API |

**Flows:**

- **Authorization Code + PKCE** — the standard for web and mobile apps. The user authenticates at the Authorization Server, receives an authorization code, and the client exchanges it server-to-server for tokens. PKCE (Proof Key for Code Exchange) prevents a stolen code from being exchanged by an attacker. Always use PKCE for SPAs and native mobile apps.
- **Client Credentials** — for machine-to-machine calls with no user involved. A backend service authenticates with its own `client_id` + `client_secret` and receives an access token. Used for cron jobs, internal services, and background workers.
- **Device Authorization** — for input-constrained devices (smart TVs, CLIs). The device displays a short code and a URL; the user completes auth on their phone. The device polls until the user approves.

**Token types:**

| Token | Lifetime | Purpose |
|---|---|---|
| **Access token** | Short (15 min – 1 hour) | Sent in `Authorization: Bearer` header to call APIs |
| **Refresh token** | Long (hours to days) | Exchanges for a new access token; never sent to resource servers |
| **ID token (OIDC)** | Short | JWT carrying user identity claims; used by the app, not APIs |

**OpenID Connect (OIDC)** is an identity layer built on top of OAuth 2.0. OAuth tells you *what* an app may do; OIDC tells you *who* the user is. Most modern "sign in with" flows use OIDC.

**Common mistakes:**
- Returning tokens in redirect URLs — they appear in browser history and server logs. Use server-to-server code exchange instead.
- Not validating the `aud` (audience) claim — allows a token issued for service A to be replayed at service B.
- Issuing long-lived access tokens without a revocation strategy — a stolen token stays valid until expiry.
- Skipping PKCE for SPAs — leaves the authorization code vulnerable to interception by browser extensions or network attackers.

### JWT — Stateless Identity Tokens

A JWT (JSON Web Token) is a compact, signed token that carries identity claims. Any service that knows the public key can verify a JWT without calling a central server — this makes JWTs ideal for distributed systems.

**Structure:** Three Base64URL-encoded parts separated by dots.

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9   ← header (algorithm + token type)
.eyJzdWIiOiJ1c3JfMTIzIiwiaXNzIjoiYXV0... ← payload (claims)
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV...   ← signature
```

The payload is Base64-encoded, **not encrypted**. Anyone with the token can read the claims. Never put passwords, credit card numbers, or sensitive PII in a JWT payload.

**Standard claims:**

| Claim | Meaning | Example |
|---|---|---|
| `sub` | Subject — who the token is about | `usr_123` |
| `iss` | Issuer — who minted the token | `https://auth.example.com` |
| `aud` | Audience — intended recipient | `https://api.example.com` |
| `exp` | Expiration (Unix timestamp) | `1745283600` |
| `iat` | Issued-at time | `1745280000` |
| `jti` | Unique token ID for revocation | `tok_abc` |
| `scope` / `roles` | Authorization claims | `["read:orders", "write:profile"]` |

**Signing algorithms:**

- **HS256 (HMAC-SHA256)** — symmetric; same secret signs and verifies. Every service that verifies must hold the secret. Fine for a single service; risky at scale because sharing the secret means any service can forge tokens.
- **RS256 (RSA-SHA256)** — asymmetric; private key signs, public key verifies. Resource servers only need the public key, published via a JWKS (JSON Web Key Set) endpoint. Preferred for multi-service architectures.
- **ES256 (ECDSA-SHA256)** — smaller signature than RSA at equivalent security. Preferred for mobile-heavy systems.

**Validation — perform all steps on every request:**

1. Verify the signature using the expected algorithm and key (fetch public key from JWKS endpoint).
2. Confirm `iss` matches the expected issuer.
3. Confirm `aud` includes this service's identifier.
4. Confirm `exp` is in the future; `iat` is not in the future.
5. If revocation is required, check `jti` against a blocklist in Redis.

**The revocation problem:** Because JWTs are stateless, a stolen token stays valid until `exp`. Mitigations:
- Keep access tokens short-lived (15 minutes is standard).
- Use refresh token rotation — each refresh issues a new refresh token and invalidates the old one. If an old refresh token is used after rotation, it indicates a theft — invalidate the entire token family.
- Maintain a `jti` blocklist in Redis for immediate revocation on logout or compromise. Cost: one Redis GET per request, which is fast and acceptable at most scales.

**JWT vs. opaque tokens:**

| Dimension | JWT | Opaque token |
|---|---|---|
| Verification | Local (stateless, no network call) | Remote (introspection endpoint call) |
| Revocation | Hard — wait for expiry or use blocklist | Easy — delete from token store |
| Token size | Larger (carries claims inline) | Small (random identifier) |
| Best for | Distributed services where low-latency verification matters | High-security flows requiring immediate revocation |

### Authorization — Controlling What You Can Do

Authentication proves identity. Authorization decides permissions. The two are separate concerns and must be enforced independently on every request — hiding a button in the UI is not authorization.

**RBAC (Role-Based Access Control):** Permissions attach to roles; roles attach to users.

```
User → [support_agent, billing_viewer] → {create_refund, view_invoice}
```

Strengths: simple, auditable, maps naturally to org charts. Adding an employee means assigning a role, not writing a policy. Most SaaS products start here.

Weaknesses: coarse-grained. Roles express *what* but not *when*, *where*, or *on whose data*. "Role explosion" — dozens of near-identical roles for edge cases — is a sign RBAC has been stretched too far.

Real-world examples: `admin`, `support_agent`, `billing_viewer`, `read_only`.

**ABAC (Attribute-Based Access Control):** Access decisions evaluate a policy expression over attributes of the user, resource, action, and environment.

```
ALLOW IF:
  user.department == resource.department
  AND user.clearance_level >= resource.sensitivity
  AND request.time BETWEEN 09:00 AND 17:00
  AND request.ip_region == "us-east-1"
```

Strengths: fine-grained and contextual. One policy replaces dozens of RBAC roles. Handles dynamic decisions based on runtime context (IP, time of day, device trust level).

Weaknesses: harder to reason about, audit, and debug. Policy engines (OPA — Open Policy Agent, AWS Cedar, Casbin) add operational complexity. A policy bug can silently affect many users.

Real-world examples: healthcare systems where a doctor may access only their currently admitted patients' records; financial platforms where analysts may view only transactions in their assigned region; multi-tenant SaaS where a user may only edit their own organization's documents.

**Choosing between them:**

| Scenario | Recommendation |
|---|---|
| Small team, simple roles, enterprise B2B | RBAC |
| Multi-tenant with per-tenant permissions | RBAC + tenant-ID scoping on every query |
| Row-level or field-level access control | ABAC or hybrid |
| Contextual constraints (time, location, device) | ABAC |
| Regulatory compliance with rich audit trails | ABAC with policy-as-code (OPA, Cedar) |

**Hybrid approach (common in production):** RBAC gates entry to a feature; ABAC governs individual resource access. `role=support_agent` lets a user access the support tool. `ticket.assigned_team == agent.team` determines which tickets they can open.

**Policy-as-code:** Define, test, and version authorization policies as code using OPA or AWS Cedar. Policies live in a repo, go through pull request review, are tested against example inputs in CI, and deploy independently of application code. This prevents silent authorization regressions.

### Encryption — Protecting Data in Transit and at Rest

Encryption protects data from specific threats — eavesdropping and stolen storage media — but does not replace access control, input validation, or secure application logic.

**Encryption in transit:**

Use TLS 1.3 for all traffic. TLS 1.3 removes weak cipher suites, reduces the handshake to one round trip, and mandates forward secrecy (a compromised private key does not decrypt past traffic).

Key practices:
- Redirect all HTTP to HTTPS and set an HSTS header (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`) to prevent downgrade attacks.
- Encrypt internal service-to-service traffic, not just the public edge. A compromised internal network should not expose plaintext. Use mTLS to authenticate both sides of internal calls.
- Automate TLS certificate rotation (Let's Encrypt with cert-manager, AWS ACM). Certificate expiry is the most common cause of preventable TLS outages.
- Disable TLS 1.0 and 1.1 at the load balancer — both have known weaknesses (BEAST, POODLE).

**Encryption at rest:**

| Layer | What to encrypt | Tool |
|---|---|---|
| Database storage | All rows and indexes | AWS RDS AES-256, Postgres with LUKS |
| Object storage | Files, exports, backups | S3 SSE-KMS; enforce via bucket policy |
| Backups | DB dumps, WAL archives | Encrypt before upload; store keys separately |
| Sensitive fields | PII (SSN, card number, health data) | Envelope encryption via KMS |
| Audit logs | Logs containing sensitive context | Encrypt at rest + restrict access |

**Envelope encryption** — the standard pattern for encrypting sensitive database fields:

1. A data encryption key (DEK) encrypts the plaintext value.
2. A master key in KMS (AWS KMS, HashiCorp Vault, GCP Cloud KMS) encrypts the DEK.
3. Only the encrypted DEK is stored alongside the data. The plaintext DEK lives in memory only during active use.

Rotating the master key only requires re-wrapping the DEKs — not re-encrypting all data. This makes rotation fast and practical.

**What encryption does NOT protect against:**
- A bug that returns decrypted data to the wrong user (broken access control).
- SQL injection that queries encrypted-then-decrypted fields via normal app logic.
- An attacker who compromises the application process, which holds decryption keys in memory.
- An authorized user with DB access who legitimately exports data (insider threat).

### Secrets Management

Secrets — API keys, database passwords, signing keys, TLS certificates, webhook secrets — must never be hardcoded in source code, baked into Docker images, or committed to git.

**Where secrets go wrong:**
- A developer hardcodes a staging DB password that gets committed to git. The repo becomes public. The password is indexed by scanners within hours.
- A CI pipeline logs the value of an environment variable containing an API key. The log is accessible to all engineers.
- A Docker image built with `ARG SECRET_KEY` bakes the value into an image layer. The registry is public.

**Correct approach:**

1. **Use a secrets manager:** AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager. Secrets are stored encrypted, access is audited, and rotation can be automated.
2. **Inject at runtime:** Applications fetch secrets from the vault on startup via the vault SDK or environment injection (AWS Parameter Store + ECS task role). No secrets in the image.
3. **Rotate regularly:** Automate rotation for database credentials (AWS Secrets Manager supports this natively for RDS). Rotate signing keys on a schedule and immediately on compromise.
4. **Scan continuously:** Use tools like GitGuardian, GitHub secret scanning, or truffleHog in CI to catch secrets committed by mistake.
5. **Least privilege:** Each service gets a vault role that can only access the secrets it needs. A payment service should not be able to read email provider credentials.

**Real-world example:** Uber's engineer accidentally committed AWS credentials to a public GitHub repo in 2016, leading to a breach of 57 million user records. The attacker used the credentials to access S3 buckets containing driver and rider data.

### Abuse Prevention — Rate Limiting and DDoS Protection

Rate limiting and DDoS protection are security controls that keep services available under adversarial traffic.

**Rate limiting by dimension:**
- **Per-IP** — blocks bots and scanners. A single IP making 1,000 login requests per minute is clearly a brute-force attack.
- **Per-user** — limits damage from compromised accounts. Even a legitimate user token should not be able to make 10,000 API calls per second.
- **Per-tenant** — in multi-tenant SaaS, prevents one tenant's traffic spike from degrading all others (the "noisy neighbor" problem).

Apply rate limiting at the **edge** (Cloudflare, AWS WAF), not only in the application. Edge enforcement blocks traffic before it reaches origin servers and absorbs volumetric attacks that would overwhelm app-layer rate limiters.

**DDoS protection layers:**
- **CDN / Anycast** (Cloudflare, AWS CloudFront) — distributes traffic across global PoPs. Volumetric floods are absorbed at the edge.
- **WAF (Web Application Firewall)** — filters traffic using rules (block known bad IPs, rate-limit patterns, block requests matching injection signatures).
- **Bot detection** — CAPTCHA challenges, browser fingerprinting, and behavioral analysis distinguish bots from humans for login and registration endpoints.
- **Origin shielding** — keep origin IPs private. If attackers know the origin IP, they can bypass CDN and hit it directly.

**Real-world example:** GitHub was hit by a 1.35 Tbps DDoS attack in 2018, the largest ever recorded at the time. They mitigated it within 10 minutes by routing traffic through Akamai's scrubbing infrastructure, which absorbed the flood before it reached GitHub's origin.

### OWASP Top 10 — Application Vulnerability Baseline

The OWASP Top 10 is the industry-standard list of the most critical web application security risks. Every system design involving user-facing APIs should address each class.

| # | Vulnerability | What happens | How to prevent it |
|---|---|---|---|
| A01 | **Broken Access Control** | Users access resources they should not own. Example: `/orders/789` returns any order regardless of who's logged in (IDOR). | Enforce authorization server-side on every request. Use ABAC row-level checks. Return 403 (not 404) to avoid leaking resource existence. |
| A02 | **Cryptographic Failures** | Sensitive data exposed due to weak or missing encryption. Example: passwords stored as MD5 hashes; internal traffic over HTTP. | TLS everywhere including internal hops. Use Argon2/bcrypt for passwords. Encrypt backups. Envelope encryption for PII fields. |
| A03 | **Injection** | Untrusted input executed as code or commands. Example: `'; DROP TABLE users; --` in a search field that constructs SQL via string concatenation. | Parameterized queries or prepared statements always. Validate and allowlist inputs. Least-privilege DB credentials. |
| A04 | **Insecure Design** | Security flaws baked into architecture. Example: no rate limiting on password reset; trusting role claims from the client. | Threat model during design phase. Defense in depth. Security review for auth, payments, and PII flows. |
| A05 | **Security Misconfiguration** | Insecure defaults left in place. Example: open S3 bucket, debug mode in prod, `CORS: *`, verbose stack traces in error responses. | Harden all defaults. Use IaC to enforce config. Periodic audits with AWS Config, Prowler, ScoutSuite. |
| A06 | **Vulnerable Components** | Libraries or runtimes with known CVEs. Example: Log4Shell (CVE-2021-44228) allowed remote code execution in Java apps using log4j. | Automated dependency scanning in CI (Dependabot, Snyk). Subscribe to CVE feeds. Patch critical vulnerabilities within 24 hours. |
| A07 | **Auth Failures** | Broken auth lets attackers impersonate users. Example: no brute-force protection on login; sessions not invalidated on logout; predictable tokens. | Rate-limit login attempts. Require MFA. Short session expiry. Invalidate sessions server-side on logout. Detect credential stuffing. |
| A08 | **Data Integrity Failures** | Code or data updates applied without integrity checks. Example: CI pipeline fetches a dependency without verifying its checksum (supply chain attack). | Sign and verify artifacts. Pin dependency versions. Use safe serialization (JSON + schema validation) instead of arbitrary object deserialization. |
| A09 | **Logging and Monitoring Failures** | Attacks go undetected because events are not logged or alerted. Example: 1,000 failed logins per minute with no alert. | Log all auth decisions and access-control failures. Write-once audit logs (S3 Object Lock). Alert on login failure spikes and privilege escalation. Include correlation IDs. |
| A10 | **SSRF (Server-Side Request Forgery)** | Attacker makes the server fetch an internal URL it should not. Example: submitting `http://169.254.169.254/latest/meta-data/` to a URL-fetching feature to steal AWS IAM credentials. | Allowlist allowed fetch targets. Block RFC-1918 and link-local addresses. Use an egress proxy for outbound HTTP. Enforce IMDSv2 on AWS (adds a session token requirement). |

**Where these failures concentrate in distributed systems:**
- **Injection (A03)** hits search, filter, and reporting endpoints that build queries dynamically.
- **SSRF (A10)** is amplified in microservices where one compromised service can reach internal APIs trusted by the VPC.
- **Broken access control (A01)** in multi-tenant systems often appears as a missing `WHERE tenant_id = ?` clause — one omitted filter returns every tenant's data.
- **Misconfiguration (A05)** is the most common cloud audit finding: overly permissive IAM roles, open security groups, public S3 buckets.

### Operational Security — Logging, Auditing, and Maintenance

Security is not set-and-forget. The operations layer determines whether a breach is detected in minutes or months.

**What to log:**
- Every authentication attempt (success and failure) with user ID, IP, user agent, and timestamp.
- Every authorization decision that results in a denial.
- All administrative actions (role changes, secret rotations, configuration changes).
- All data exports or bulk reads of sensitive data.

**How to store logs:**
- Write-once storage (S3 Object Lock, Splunk, Datadog) — logs must not be modifiable after writing.
- Separate the log storage from the application — a compromised application should not be able to delete its own audit trail.
- Include correlation IDs on every log line so a full request chain can be reconstructed across services.

**Alerting:**
- Login failure rate spikes (credential stuffing / brute force).
- Privilege escalation events (a user suddenly gains admin role).
- Secret access anomalies (a service fetching credentials it has never fetched before).
- Unusual data export volume.

**Ongoing maintenance checklist:**
- Rotate API keys, DB passwords, and TLS certificates on a schedule.
- Run dependency scanning continuously; patch critical CVEs within 24 hours.
- Review and test authorization policies quarterly.
- Perform tabletop drills for credential leakage and account takeover.
- Run SAST (Static Application Security Testing) and DAST (Dynamic Application Security Testing) in CI/CD.
- Use Git secret scanning to catch committed credentials before they reach remote.

### How Security Grows With the System

| Stage | What you have | What to add |
|---|---|---|
| **Early (MVP, small team)** | Basic password login, HTTPS, a few role checks | MFA for admins, short-lived JWTs, bcrypt passwords, encrypted backups |
| **Growth (product-market fit)** | More users, multiple services | Centralized auth service, OAuth 2.0 for third-party integrations, secrets vault, WAF at the edge, audit logging |
| **Scale (hundreds of engineers)** | Multi-tenant, regulated data, complex roles | ABAC with policy-as-code (OPA/Cedar), mTLS for internal traffic, HSM-backed key management, automated cert rotation, real-time anomaly detection, red team exercises |
| **Enterprise (compliance-driven)** | SOC 2, HIPAA, PCI-DSS requirements | Hardware security modules, formal penetration testing, zero-trust network architecture, break-glass procedures with full audit trails |

### Cost Considerations

| Control | Cost profile |
|---|---|
| TLS | Near-zero — certificate automation (ACM, Let's Encrypt) is free |
| Secrets management | Low recurring cost (AWS Secrets Manager ~$0.40/secret/month); high value per dollar |
| WAF / DDoS protection | Meaningful monthly cost at scale (Cloudflare Pro/Enterprise, AWS WAF per-rule pricing) |
| HSM-backed key management | Higher cost; required for PCI-DSS and regulated industries |
| Audit logging and SIEM | Storage and ingestion costs grow with request volume; plan for this early |
| Security reviews and pen tests | Operational cost often exceeds infra cost; budget 1-2 per year at minimum |

Security is one of the highest ROI investments in a technology company. A single breach — covering customer notification, legal fees, lost contracts, and remediation — routinely costs orders of magnitude more than the prevention spending it replaced.

### Interview Trade-Off Questions and Answers

**Q1: When are stateless JWTs the right choice, and when do server-side sessions or token introspection give you better security control?**

**Answer:** Use JWTs when you have multiple services that need to verify identity without network calls and when short access token lifetimes (15–30 minutes) are acceptable. JWTs eliminate the need for a shared session store and are cheap to verify at scale.

Use server-side sessions or opaque tokens with introspection when you need immediate revocation — for example, after detecting account compromise or on user logout in a high-security application. A 15-minute window before a stolen JWT expires may be unacceptable for financial or healthcare systems. The tradeoff is that every request now requires a network call to the token introspection endpoint, adding latency. This can be mitigated with a short-TTL cache (30–60 seconds) of token validity, which keeps revocation near-instant while reducing introspection calls.

Hybrid approach: short-lived JWTs (15 minutes) for normal API calls, combined with a `jti` blocklist in Redis for immediate revocation on logout or compromise. This gives most of the performance benefits of JWTs while bounding the window of a stolen token.

**Q2: When is RBAC sufficient, and when does the product complexity justify moving to ABAC or a policy engine?**

**Answer:** RBAC is sufficient when permissions map cleanly to job functions with a manageable number of roles (under ~20) and when access decisions do not depend on runtime context or resource attributes. Most B2B SaaS products start with RBAC and it serves them well through significant scale.

Move to ABAC when you encounter role explosion (you are creating roles like `support_agent_us_east_tier1_refund_only` to handle edge cases), when access decisions require context (time of day, user's geographic region, device trust level), or when you need row-level isolation in a multi-tenant system. ABAC also becomes necessary for compliance requirements like HIPAA minimum necessary access, where "this doctor may only read records for patients currently under their care" cannot be expressed as a static role.

The cost of ABAC is policy complexity: a bug in a policy expression can silently grant or deny access to many users at once. Policy-as-code (OPA, AWS Cedar) with a robust test suite mitigates this.

**Q3: How do you balance strong revocation and short-lived tokens against latency, cacheability, and operational simplicity?**

**Answer:** The core tension is: shorter token lifetime = smaller breach window, but also more frequent refresh calls, more auth server load, and more complexity. Longer lifetime = simpler and faster, but a stolen token stays valid longer.

Practical resolution: use a two-token pattern with a short-lived access token (15 minutes) and a longer-lived refresh token (7–30 days). The access token is self-contained (JWT); services verify it locally with no network call. When it expires, the client silently exchanges the refresh token for a new pair. Refresh token rotation on every use means a stolen refresh token is detected the next time it is legitimately used.

For immediate revocation (account compromise, admin lockout): maintain a `jti` blocklist in Redis. Only compromised or force-logged-out tokens need to be blocklisted — the vast majority of tokens expire naturally. This keeps the blocklist small and the Redis lookup fast (sub-millisecond at typical scale).

Avoid caching access tokens at the edge for longer than their `exp` — a CDN that caches a 401 response or a valid token for 10 minutes can mask revocations and break logout flows.

---
## Chapter 11: Caching Strategies

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

### How Will Teams Maintain It?

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
## Chapter 12: Event-Driven Messaging Systems

### What This Chapter Covers

This chapter builds a complete mental model of event-driven messaging from first principles to production-grade design. You will understand why asynchronous messaging exists, how to choose between queues and pub/sub, how to guarantee correctness under retries and failures, and how to design systems that stay operationally healthy at scale.

**Topics covered:** queues, pub/sub, delivery guarantees, idempotency, retries, dead letter queues, backpressure, ordering, replay, schema evolution, outbox pattern, event sourcing, CQRS, broker selection, capacity planning, and operations.

### Learning Path

| Level | What you should understand by the end |
|---|---|
| Beginner | What a message queue is, why async reduces user-facing latency, queue vs pub/sub |
| Intermediate | Idempotency, retries with backoff, DLQ, partitioning, consumer groups, backpressure |
| Advanced | Ordering trade-offs, replay-safe design, outbox pattern, schema compatibility, event sourcing, CQRS |

---

### Part 1 — Why Messaging? (Beginner)

#### The Problem with Synchronous Chains

Imagine a user clicks "Place Order". The checkout service must:
1. Charge the payment gateway (~300 ms)
2. Reserve inventory (~100 ms)
3. Send a confirmation email (~200 ms)
4. Update fraud scoring (~150 ms)
5. Record analytics (~50 ms)

Done synchronously, the user waits ~800 ms. Worse, if the email provider is slow, the payment still blocks. If fraud scoring crashes, checkout fails entirely — even though the user's money was already charged.

This is the **synchronous coupling problem**: one slow or failed dependency makes everything slower or broken.

#### The Async Solution

With messaging, checkout does one thing: write the order to the database and publish an `order_created` event. It returns `202 Accepted` to the user in ~50 ms. All downstream work happens asynchronously, independently, and in parallel.

```
Customer → Checkout API → writes order + publishes event → returns "order accepted"
                                          │
                           ┌──────────────┼──────────────┐──────────────┐
                           ▼              ▼              ▼              ▼
                      Payment        Inventory      Email Service   Fraud/Analytics
                      Service        Service        (async)          (async)
```

Benefits:
- **User latency drops** — checkout response is no longer coupled to downstream slowness.
- **Fault isolation** — email service crash does not affect payment processing.
- **Independent scaling** — each consumer scales to its own load.
- **Replay** — if the fraud service goes down and comes back up, it can replay missed events.

#### What is a Message?

A message is a structured payload with metadata sent from a producer to a broker, then delivered to one or more consumers.

```json
{
  "event_type": "order_created",
  "event_id": "evt_8f22",
  "occurred_at": "2026-04-22T10:00:00Z",
  "payload": {
    "order_id": "order_123",
    "user_id": "user_456",
    "total": 129.99,
    "currency": "USD"
  }
}
```

Key fields: an `event_type` naming what happened, an `event_id` for deduplication, a timestamp, and a business payload.

---

### Part 2 — Core Building Blocks (Beginner)

#### Queue vs Pub/Sub

These are the two fundamental message delivery patterns:

**Queue (Point-to-Point)**

One message is consumed by exactly one consumer instance. If you have five workers, each message goes to exactly one of them.

```
Producer → [Queue] → Consumer A  (gets message 1)
                   → Consumer B  (gets message 2)
                   → Consumer C  (gets message 3)
```

Use a queue when:
- One service owns the task end-to-end (thumbnail generation, invoice PDF creation, ETL job execution).
- You want to distribute work across workers for parallelism.
- You do not need multiple services to react to the same event.

**Pub/Sub (Publish-Subscribe)**

One event is delivered to all subscribers independently. Each subscriber gets its own copy.

```
Producer → [Topic] → Billing Service      (receives order_created)
                   → Inventory Service    (receives order_created)
                   → Email Service        (receives order_created)
                   → Fraud Service        (receives order_created)
```

Use pub/sub when:
- Multiple independent domains must react to the same business fact.
- Adding a new consumer should not require changing the producer.
- You want true decoupling between producer and consumer teams.

**Decision guide:**

| Scenario | Use |
|---|---|
| Generate a PDF invoice for one order | Queue |
| Notify billing, inventory, email, fraud about one order | Pub/Sub |
| Resize one uploaded image to five sizes | Queue (five workers, one job each) |
| Propagate a user signup to five services | Pub/Sub |
| Process payment for each order | Queue (one payment per order) |

Many production systems combine both: pub/sub topics fan out `order_created` to downstream queues, which worker services drain independently.

#### Core Vocabulary

| Term | What it means |
|---|---|
| Producer | Service that publishes messages |
| Consumer | Service that reads and processes messages |
| Broker | The system that stores and routes messages (Kafka, RabbitMQ, SQS) |
| Topic | Named channel in a pub/sub system |
| Queue | Named channel in a point-to-point system |
| Partition | A subdivision of a topic for parallelism |
| Consumer group | A set of consumers sharing work on a topic |
| Offset | A consumer's position in a partition (Kafka-style) |
| Ack | Consumer acknowledgement that a message was processed |
| DLQ | Dead letter queue — where failed messages go after exhausting retries |
| Schema registry | Central store of event schema versions |

---

### Part 3 — Delivery Guarantees (Intermediate)

Every messaging system makes a promise about what happens to messages. There are three levels:

#### At-Most-Once

The broker delivers each message zero or one time. If the consumer crashes before processing, the message is lost.

**When to use:** Metrics, analytics events, or telemetry where occasional loss is acceptable and duplicates cause more problems than loss.

**Risk:** Data loss.

#### At-Least-Once

The broker keeps retrying until the consumer acknowledges. If the consumer processes the message but crashes before acknowledging, the broker retries, causing a duplicate.

**When to use:** Most business workflows. This is the practical default.

**Risk:** Duplicate side effects (double charge, duplicate email). You must make consumers idempotent to handle this.

#### Exactly-Once (Narrow Scope)

Available in some broker+sink combinations (Kafka transactions + Kafka Streams). Does not extend to external side effects like payment gateways, email providers, or REST APIs.

**Rule:** Treat exactly-once as at-least-once at any external system boundary. Design consumers for idempotency regardless.

**For most systems:** Design for at-least-once delivery and make side effects idempotent.

---

### Part 4 — Idempotency: Handling Duplicates Safely (Intermediate)

Idempotency means processing the same message twice produces the same result as processing it once.

#### Why You Need It

With at-least-once delivery, a consumer can receive the same message multiple times because:
- The consumer processed the message but crashed before acknowledging.
- The broker retried due to a timeout.
- A replay was triggered after a consumer outage.

Without idempotency, a user could be charged twice for the same order, or receive the same email three times.

#### Idempotency Key Pattern

Every event that triggers a side effect should carry an `idempotency_key` — a stable, unique identifier for that specific business action.

```json
{
  "event_type": "order_paid",
  "event_id": "evt_8f22",
  "idempotency_key": "order_123_payment_attempt_1",
  "occurred_at": "2026-04-22T10:00:00Z",
  "payload": {
    "order_id": "order_123",
    "amount": 129.99,
    "currency": "USD"
  }
}
```

The consumer checks a `processed_events` table before acting:

```sql
-- Before processing
SELECT 1 FROM processed_events
WHERE consumer_name = 'payment_service'
  AND idempotency_key = 'order_123_payment_attempt_1';

-- If not found: process + insert (in one transaction)
INSERT INTO processed_events (consumer_name, idempotency_key, processed_at)
VALUES ('payment_service', 'order_123_payment_attempt_1', NOW());

-- Charge the user here (inside the same transaction if possible)
```

**Key rules:**
1. Use a `UNIQUE` constraint on `(consumer_name, idempotency_key)` to make dedup race-safe.
2. Commit the processed_events row and the business side effect in the same database transaction where possible.
3. If the side effect is external (payment gateway), store the external result and skip the call if already recorded.

#### Real-World Example

Stripe's payment API accepts an `Idempotency-Key` header. If you call Stripe twice with the same key, you get the same result without a second charge. Their servers store the first response keyed by your idempotency key and return it on replay.

---

### Part 5 — Retries, Backoff, and Dead Letter Queues (Intermediate)

#### When to Retry

Retry only for **transient failures**: timeouts, HTTP 429 rate limit responses, temporary service unavailability.

Do not retry **permanent failures**: invalid payload, business rule violation, message too large. These will never succeed and will tie up the consumer.

#### Exponential Backoff with Jitter

A naive retry-immediately strategy causes **retry storms**: all consumers hit the same degraded service simultaneously, making recovery impossible.

The solution is exponential backoff with jitter:

```
attempt 1: wait 1s  + random(0–0.5s)
attempt 2: wait 2s  + random(0–1s)
attempt 3: wait 4s  + random(0–2s)
attempt 4: wait 8s  + random(0–4s)
attempt 5: wait 16s + random(0–8s)
→ route to DLQ after attempt 5 fails
```

The random jitter spreads retries across time, preventing synchronized spikes.

#### Dead Letter Queue (DLQ)

After exhausting retries, route the failing message to a DLQ instead of dropping it. The DLQ holds messages that need human or automated triage.

**DLQ message should include:**
- Original message content
- Error message and stack trace from the last failure
- Number of attempts
- First and last failure timestamps
- Consumer name and version

**DLQ is not a parking lot.** Teams must:
- Track DLQ message age and count as SLO metrics
- Alert when DLQ depth grows unexpectedly
- Provide replay tooling with guardrails (replay one message, replay all, replay filtered by error type)
- Fix root cause before replaying — replaying a broken message without fixing the bug wastes retries

#### Best-Practice Retry Policy

```
1. Detect failure type: transient vs. permanent
2. Transient → exponential backoff + jitter, max N attempts (e.g., 5)
3. Permanent → route directly to DLQ, no retries
4. Terminal failure after N attempts → route to DLQ with full error metadata
5. DLQ → alert on growth, require investigation before replay
```

---

### Part 6 — Partitioning, Consumer Groups, and Ordering (Intermediate)

#### Why Partition?

A single broker node cannot handle millions of events per second. Partitioning splits a topic into parallel shards, each served by different broker nodes.

```
Topic: order_events
  Partition 0: [evt_1, evt_4, evt_7, ...]  → Consumer A
  Partition 1: [evt_2, evt_5, evt_8, ...]  → Consumer B
  Partition 2: [evt_3, evt_6, evt_9, ...]  → Consumer C
```

Each partition is consumed by exactly one consumer within a consumer group at a time. This provides parallelism while preserving per-partition ordering.

#### Consumer Groups

A consumer group is a named set of consumers that share work on a topic. Kafka assigns each partition to exactly one consumer in the group.

```
Consumer Group: payment_service
  partition 0 → payment-worker-1
  partition 1 → payment-worker-2
  partition 2 → payment-worker-3
```

If payment-worker-2 crashes, Kafka reassigns partition 1 to one of the remaining workers (rebalancing). This is automatic.

Multiple consumer groups can consume the same topic independently — billing, fraud, and analytics can all have their own consumer groups reading `order_events` from offset 0.

#### Ordering Guarantees

**Global order is not available** in partitioned systems. Ordering is guaranteed only within a partition.

Choose partition keys based on what ordering actually matters for your business:

| Need | Partition key |
|---|---|
| All events for one order in sequence | `order_id` |
| All events for one user in sequence | `user_id` |
| All events for one account in sequence | `account_id` |
| Maximum throughput, no ordering requirement | Random or round-robin |

**E-commerce example:** Partition `order_events` by `order_id`. This guarantees that `order_created`, `order_paid`, and `order_shipped` for order-123 are always processed in that sequence, while events for different orders are processed in parallel.

#### Backpressure

When consumers are slower than producers, the broker accumulates lag. Unchecked lag can lead to:
- Disk exhaustion on the broker
- Hours or days of business delay for downstream systems
- Consumer restart storms as lag triggers alerts

Handle backpressure explicitly:
1. **Monitor consumer lag** — alert when lag exceeds a threshold (e.g., > 10,000 messages or > 5 minutes of delay).
2. **Scale consumers** — add more consumer instances (add more partitions first if at capacity).
3. **Throttle producers** — if consumers cannot keep up, slow down ingestion via backpressure signals.
4. **Prioritize queues** — route critical events to separate high-priority topics consumed by dedicated workers.

---

### Part 7 — The Outbox Pattern: Solving Dual-Write (Intermediate → Advanced)

#### The Dual-Write Problem

Every service that publishes events after a database write faces a subtle risk:

```
Step 1: Write order row to database  ✓ (succeeds)
Step 2: Publish order_created event   ✗ (fails — network error, broker down)
```

Now the database says the order exists but downstream services never learned about it. The order is stuck — no payment, no inventory reservation, no email.

The naive fix is to retry the publish, but that creates another problem: what if the DB write succeeded but the process crashes before publishing? You do not know which to retry.

#### The Outbox Pattern

The outbox pattern solves this with a single atomic transaction:

```sql
BEGIN TRANSACTION;

-- Write the business record
INSERT INTO orders (order_id, user_id, total, status)
VALUES ('order_123', 'user_456', 129.99, 'pending');

-- Write the event to an outbox table in the same transaction
INSERT INTO outbox (event_id, event_type, payload, created_at, published)
VALUES ('evt_8f22', 'order_created', '{"order_id":"order_123",...}', NOW(), false);

COMMIT;
```

A separate **outbox relay** process (or Debezium CDC) polls the outbox table and publishes unpublished rows to the broker:

```
Outbox Relay:
1. SELECT * FROM outbox WHERE published = false ORDER BY created_at LIMIT 100
2. Publish each row to the broker
3. UPDATE outbox SET published = true, published_at = NOW() WHERE event_id = ?
```

If the relay crashes between publishing and marking as published, it will retry the publish. The broker receives a duplicate, which is handled by consumer-side idempotency.

**Guarantees:**
- If the DB transaction succeeds, the event will eventually be published (at-least-once).
- If the DB transaction fails, no event is published (atomicity).
- Database and event stream are always consistent.

#### CDC-Based Outbox (Production Scale)

At high volume, polling the outbox table adds database load. Production systems use **Change Data Capture (CDC)** with Debezium:

```
PostgreSQL WAL → Debezium connector → Kafka topic
```

Debezium reads the database write-ahead log and streams outbox row insertions directly to Kafka without polling. This eliminates DB polling load and achieves near-zero latency from DB write to event publication.

---

### Part 8 — Replay-Safe Consumer Design (Advanced)

Consumers must be safe to replay. This is required for:
- Recovery after a consumer outage
- Backfilling a new service with historical events
- Correcting a bug by reprocessing events with a fixed consumer

A replay-safe consumer requires:

1. **Idempotent state transitions** — processing the same event twice produces the same database state.
2. **Offset commit after side effect** — commit the broker offset only after the business action succeeds, not before.
3. **Version-aware deserialization** — old events from months ago must still be parseable even if the schema evolved.
4. **Projection isolation** — pure read-model projections (analytics, search indexes) should be separate from consumers that trigger side effects (payments, emails), so projections can be replayed freely without business risk.

**Anti-pattern to avoid:** Committing the offset before processing the message. If the consumer crashes after commit but before processing, the message is silently lost.

```
WRONG:
  commit offset → process message  (message lost on crash between these)

CORRECT:
  process message → commit offset   (message replayed on crash — safe with idempotency)
```

---

### Part 9 — Schema Evolution and Compatibility (Advanced)

#### Why Schema Matters

Producers and consumers are deployed independently. A producer may add a field today; consumers running yesterday's code still need to read the message. Without governance, schema changes break consumers silently.

#### Compatibility Modes

| Mode | Rule | Safe operations |
|---|---|---|
| Backward compatible | New schema can read old data | Add optional fields, remove fields |
| Forward compatible | Old schema can read new data | Add fields with defaults |
| Full compatible | Both directions | Only add optional fields with defaults |

**E-commerce example:** Adding `discount_code` to `order_created` is backward-compatible — old consumers ignore it. Removing `total` is not — old consumers that read `total` will break.

#### Schema Registry

A schema registry (Confluent Schema Registry, AWS Glue Schema Registry) stores and enforces schema versions:

1. Producer registers schema before publishing.
2. Registry validates compatibility against previous versions.
3. Message is encoded with schema ID (not the full schema).
4. Consumer fetches schema by ID from registry and deserializes.

This prevents schema drift from reaching consumers and provides a clear audit trail of contract changes.

#### Recommended Encoding

- **Avro** — compact binary, schema-in-registry, good for high-volume streams.
- **Protobuf** — field-number-based evolution, good for heterogeneous consumers.
- **JSON Schema** — human-readable, slower, good for lower-volume or debugging-heavy pipelines.

---

### Part 10 — Event Sourcing and CQRS (Advanced)

#### Event Sourcing

Traditional systems store current state: the `orders` table has the current status of each order.

Event sourcing stores immutable events as the source of truth. The current state is derived by replaying events:

```
order_created  → status: pending
order_paid     → status: paid
order_shipped  → status: shipped
order_delivered→ status: delivered
```

To find an order's current state: replay all events for that `order_id` in sequence.

**When to use event sourcing:**
- You need a full audit trail (financial systems, healthcare, compliance).
- You need to reconstruct historical state at any point in time.
- You need multiple read views derived from the same event stream.

**When to avoid:**
- Simple CRUD systems where audit is not required.
- Teams without experience maintaining event stores and projections.
- Systems where query patterns are simple and do not justify the complexity.

**Real-world example:** Accounting systems must never modify a transaction — only record a correcting entry. Event sourcing naturally models this: every balance change is an append-only event.

#### CQRS (Command Query Responsibility Segregation)

CQRS separates the write path (commands that change state) from the read path (queries that read state):

```
Write Path:  Command → Validate → Store Event → Publish to broker
Read Path:   Query   → Read Projection (pre-computed from events)
```

The read projection is updated asynchronously by a consumer that listens to the event stream. Different projections can be optimized for different query patterns:

```
order_events stream
  → consumer A: updates Postgres orders table (normalized, for transactional queries)
  → consumer B: updates Elasticsearch index (denormalized, for search)
  → consumer C: updates Redis cache (hot path, for low-latency reads)
```

**Combined Event Sourcing + CQRS:** Events are the write model; projections are the read models. Adding a new read view means deploying a new consumer that replays the event history — no schema migration required.

**Trade-off:** CQRS introduces eventual consistency between write and read paths. A write succeeds immediately but the read projection may be seconds or minutes behind.

---

### Part 11 — Broker Selection Guide (Intermediate → Advanced)

#### Kafka

Apache Kafka is a distributed log: an append-only, partitioned, replicated stream of records.

**Strengths:**
- Very high throughput (millions of events per second per cluster).
- Long retention (days, weeks, years).
- Replay from any offset.
- Consumer groups allow independent consumption of the same stream.
- Exactly-once semantics within Kafka using transactions.

**Weaknesses:**
- Operational complexity (ZooKeeper or KRaft mode, partition rebalancing, retention management).
- Not designed for complex routing (exchanges, routing keys, per-message TTL).
- Higher per-message overhead for very low-volume use cases.

**Use Kafka when:** High throughput, event replay, stream processing, or multiple independent consumer groups are required.

#### RabbitMQ

RabbitMQ is a traditional message broker with exchanges, routing keys, and binding rules.

**Strengths:**
- Rich routing (direct, topic, fanout, headers exchanges).
- Per-message TTL and priority queues.
- Mature management UI.
- Lower operational overhead for moderate traffic.

**Weaknesses:**
- Messages are deleted after consumption (no replay without an additional persistence layer).
- Does not scale as high as Kafka for write throughput.

**Use RabbitMQ when:** Complex routing rules, per-message TTL, or traditional queue semantics without replay needs.

#### Amazon SQS / SNS

Managed services with zero operational overhead.

- **SQS** — standard queue (at-least-once) or FIFO queue (exactly-once within the queue, strict order).
- **SNS** — pub/sub fan-out to SQS queues, Lambda, HTTP endpoints.

**Strengths:** No infrastructure to manage, auto-scaling, pay-per-use, tight AWS integration.

**Weaknesses:** No native replay, limited retention (14 days max), limited throughput tuning.

**Use SQS/SNS when:** Low operational budget, already on AWS, replay and stream processing are not requirements.

#### Decision Summary

| Requirement | Kafka | RabbitMQ | SQS/SNS |
|---|---|---|---|
| High throughput (>100K msg/sec) | ✓ | Partial | Partial |
| Event replay | ✓ | ✗ | ✗ |
| Multiple consumer groups | ✓ | Partial | ✓ (via SNS fan-out) |
| Complex routing rules | Partial | ✓ | ✓ (SNS filter policies) |
| Managed, zero ops | Partial (Confluent Cloud) | Partial (CloudAMQP) | ✓ |
| Exactly-once within pipeline | ✓ (transactions) | ✗ | ✓ (FIFO) |

---

### Part 12 — System Architecture (Advanced)

#### High-Level Architecture: E-Commerce Checkout

```
Checkout API
     │
     ├── writes to: orders DB + outbox table (single transaction)
     │
     └── returns 202 Accepted to user (~50ms)

Outbox Relay / CDC (Debezium)
     │
     └── publishes to: Kafka topic "order.events"

Kafka: topic "order.events" (partitioned by order_id, replication factor 3)
     │
     ├── Consumer Group: payment_service       → charges card → idempotency key: order_id
     ├── Consumer Group: inventory_service     → reserves stock → idempotency key: order_id
     ├── Consumer Group: notification_service  → sends email → idempotency key: order_id
     ├── Consumer Group: fraud_service         → async risk scoring
     └── Consumer Group: analytics_service     → updates dashboards

Each consumer:
     ├── processes message
     ├── writes result to its own database
     ├── commits Kafka offset after success
     └── on failure: retries with backoff → DLQ after 5 attempts
```

#### API Surface

```http
POST /v1/events                          -- publish event
POST /v1/commands                        -- publish command
GET  /v1/events/{event_id}               -- retrieve event by ID
GET  /v1/consumers/{consumer_id}/lag     -- consumer lag metrics
POST /v1/replay                          -- replay events (topic, offset range)
GET  /v1/dlq/{topic}                     -- list DLQ messages
POST /v1/dlq/{topic}/replay              -- replay DLQ messages
```

---

### Part 13 — Capacity Planning (Advanced)

#### Example Calculation

Assume:
- 50,000 events/second peak
- Average event size: 1 KB
- Replication factor: 3
- Retention: 7 days
- 5 consumer groups

**Broker write throughput:**
- Raw ingress: 50,000 × 1 KB = 50 MB/s
- With replication factor 3: 150 MB/s internal write load

**Broker storage:**
- Per day: 50 MB/s × 86,400 s = ~4.3 TB/day (before compression)
- With 3× replication: ~12.9 TB/day
- 7-day retention: ~90 TB raw (before compression)
- With Snappy compression (~3:1): ~30 TB disk footprint

**Consumer throughput:**
- 5 consumer groups, each reading 50 MB/s: 250 MB/s total read throughput
- Partition count: at least 5 × expected_consumer_instances (e.g., 5 groups × 10 workers = 50 partitions minimum)

**Broker node sizing:**
- Each Kafka broker handles ~200 MB/s write with RAID storage
- Need at least 3 brokers for replication; 5–8 for this workload

#### Cost Model (AWS, Self-Managed Kafka)

| Component | Spec | Monthly cost |
|---|---|---|
| 6 × Kafka broker nodes | r5.2xlarge (64 GB, 8 vCPU) | ~$2,500 |
| EBS storage (30 TB gp3) | — | ~$2,400 |
| 10 × consumer worker nodes | c5.xlarge (4 vCPU, 8 GB) | ~$1,500 |
| Schema registry + monitoring | 2 × c5.large | ~$200 |
| **Total** | | **~$6,600/month** |

**Managed alternative (Confluent Cloud):**
- ~$0.10/GB ingress + ~$0.12/GB retention per month
- At 50 MB/s ingress: ~$13,000/month — significantly higher but zero operational overhead.

---

### Part 14 — What Can Fail? (Advanced)

| Failure mode | Symptom | Mitigation |
|---|---|---|
| Broker node outage | Producers cannot publish to affected partitions | Multi-AZ deployment, replication factor ≥ 3, producer retry with backoff |
| Consumer lag explosion | Business delay, downstream views go stale | Scale consumer instances, throttle producers, increase partition count |
| Poison pill event | Consumer crashes on the same message repeatedly | Validate schema at consumer, add DLQ after N retries, schema compatibility checks |
| Dual-write failure | DB and event stream diverge | Use outbox pattern — atomically commit business row + outbox row |
| Duplicate processing | Double charge, duplicate email | Idempotency keys + dedup table with unique constraint |
| Schema drift | Deserialization errors on message decode | Schema registry with backward/forward compatibility policies enforced on publish |
| Retry storm | Cascading overload on recovering service | Exponential backoff + jitter + circuit breakers + per-consumer rate limits |
| DLQ filling | Unresolved failures accumulate | Alert on DLQ depth, assign on-call owner, fix root cause before replay |
| Consumer rebalancing storm | High reassignment latency during deploy | Use incremental cooperative rebalancing (Kafka 2.4+), stagger rolling deploys |
| Partition skew | Hot partition consumes one consumer while others are idle | Choose high-cardinality, uniformly distributed partition key |

---

### Part 15 — Day-2 Operations

#### Monitoring Checklist

1. **Publish latency** (p50, p99) — alert if p99 > 100 ms
2. **Consumer lag** — alert if lag > 10,000 messages or > 5 minutes of delay
3. **DLQ depth** — alert on any growth; page on sustained growth
4. **Partition skew** — alert if any partition is > 2× average message rate
5. **Error rate** — alert if consumer error rate > 1%
6. **Broker disk usage** — alert at 70% capacity

#### SLO Definition

Define SLOs per topic class:

| Topic class | Delivery SLO | Lag SLO |
|---|---|---|
| Critical (payment, fraud) | 99.99% delivered within 30 seconds | < 1,000 messages |
| Standard (notifications, analytics) | 99.9% delivered within 5 minutes | < 50,000 messages |
| Non-critical (batch analytics) | 99% delivered within 1 hour | Unlimited |

#### Operational Playbooks

1. **Consumer lag runbook** — scale out consumers, check for partition skew, check for poison pills in DLQ.
2. **DLQ replay runbook** — identify error signature, fix root cause, replay with dry-run first, replay in batches with monitoring.
3. **Broker node failure runbook** — verify replicas are in-sync, allow rebalancing to complete, add replacement node.
4. **Schema rollback runbook** — if incompatible schema deployed, redeploy with compatible version, do not delete old schema registry entries.

#### Chaos Engineering

1. Kill a broker node mid-traffic and verify producers retry and consumers recover.
2. Kill half the consumer instances and verify rebalancing completes within SLO.
3. Publish a malformed event and verify it routes to DLQ without crashing the consumer.
4. Replay 1 million events on a fresh consumer and verify idempotency holds.

---

### Part 16 — Evolution Over Three Years

| Year | Architecture | Focus |
|---|---|---|
| Year 1 | Simple queue-based async jobs, manual retries, basic DLQ, SQS or RabbitMQ | Decouple user-facing latency from background work |
| Year 2 | Kafka pub/sub, retry policies, DLQ workflows, schema registry, outbox pattern | Correctness, reliability, multi-consumer fan-out |
| Year 3 | Stream processing (Kafka Streams, Flink), event sourcing for selected domains, CQRS projections, CDC-based outbox, workflow orchestration (Temporal) | Audit trails, complex business workflows, operational maturity |

---

### Part 17 — Design Axes Summary

| Axis | Decision |
|---|---|
| Scalability | Partition topics by business key; scale consumer groups horizontally |
| Latency vs throughput | Async publish decouples user-facing latency from downstream processing; throughput scales with partition count |
| Availability vs consistency | At-least-once delivery favors availability; idempotency restores correctness |
| Reliability | Idempotency, retries with backoff, DLQ, replay safety, and outbox pattern are non-optional at business scale |
| Stateless vs stateful | Brokers, consumer offsets, and projection stores are stateful and require explicit recovery design |
| Operability | Observability (lag, DLQ depth, error rate) and schema governance determine long-term operational health |

---

### Interview Questions and Answers

**Q1. When is a queue enough, and when do you need pub/sub?**

A queue is enough when exactly one service owns the task end-to-end — for example, one payment service processes each payment. Use pub/sub when multiple independent bounded contexts must react to the same domain event — for example, `order_created` consumed by billing, inventory, fraud, notifications, and analytics. The test: if adding a new consumer requires changing the producer, pub/sub is the right abstraction.

**Q2. Should we chase exactly-once delivery?**

Usually no, at the system boundary level. Exactly-once is available in specific broker+sink combinations (Kafka transactions within a Kafka Streams pipeline) but does not extend to external systems — payment gateways, email providers, REST APIs. Practical design: at-least-once delivery with idempotent consumers, dedup constraints, and replay-safe logic. This achieves exactly-once business outcomes without relying on broker guarantees that do not extend to your full system.

**Q3. Kafka vs RabbitMQ vs SQS — how do you choose?**

Choose Kafka when you need high throughput, event replay, long retention, or multiple independent consumer groups reading the same stream. Choose RabbitMQ when you need complex routing rules (exchanges, routing keys), per-message TTL, or traditional queue semantics without replay. Choose SQS/SNS when operational simplicity is paramount, you are already on AWS, and replay and stream semantics are not required. For most greenfield systems at scale, Kafka (self-managed or Confluent Cloud) is the default choice.

**Q4. How do you prevent a retry storm during a partial outage?**

Use exponential backoff with jitter: delays grow as powers of two, with randomization to spread retries across time. Cap retry attempts (e.g., five). Add circuit breakers on consumers to stop calling a recovering service when it is failing above a threshold. Throttle producers when consumer lag exceeds SLO. Route messages to a DLQ after exhausting retries rather than blocking the pipeline.

**Q5. What is the correct way to avoid dual-write inconsistency?**

Use the outbox pattern: commit the business data row and an outbox event row in a single local database transaction. A relay process (or CDC with Debezium) publishes outbox rows to the broker asynchronously. This guarantees that if the DB write succeeds, the event will eventually be published. If the DB write fails, no event is published. Consumer-side idempotency handles the case where the relay publishes a duplicate.

**Q6. How do you handle a schema change that breaks existing consumers?**

Use a schema registry with backward or full compatibility enforcement. Add new fields as optional with defaults; never remove or rename fields in a single deployment. Deploy consumer changes before producer changes (consumers must handle both old and new schema). If a breaking change is unavoidable, version the topic (e.g., `order.events.v2`) and run both versions in parallel during a migration window, then decommission the old topic.

**Q7. How do you design a consumer that is safe to replay from offset zero?**

The consumer must be idempotent: each event write must be guarded by a dedup check (`processed_events` table with unique constraint on `(consumer_name, idempotency_key)`). Side-effect-free projection consumers (analytics, search index) can be replayed freely by truncating and rebuilding. Side-effect consumers (payments, emails) must verify idempotency before acting. Commit the offset only after the side effect succeeds, not before.

**Q8. How do you handle a poison pill message that keeps crashing a consumer?**

A poison pill is a message the consumer cannot process, causing repeated crashes and blocking all messages behind it on that partition. Mitigations: (1) catch deserialization errors and route directly to DLQ without retrying; (2) validate schema at consumer startup and reject malformed messages on receipt; (3) enforce schema compatibility in the schema registry to prevent malformed messages from being published; (4) add per-message error isolation so one bad message does not block the partition.

---
## Chapter 13: Consistent Hashing

### The Core Problem

Distributed systems constantly add nodes (capacity, recovery) and lose nodes (failures, decommissions). You need to route each key to the right server — but how do you do that when the set of servers keeps changing?

The naive approach is **modulo hashing**: `server = hash(key) % N`. It works perfectly when `N` is fixed. But when `N` changes:

```text
# N=8 cluster: key "user:42" → server 3
server = hash("user:42") % 8  →  3

# Add one server, N=9: same key now routes to server 7
server = hash("user:42") % 9  →  7  ← moved!
```

Adding just one server to an 8-server Memcached pool causes ~87.5% of keys to remap to different servers. Every remapped key is a cache miss. Every cache miss hits the database. For a system doing millions of lookups per second, this is a thundering herd that can bring down the database.

**Consistent hashing solves this.** When you add or remove one node from an N-node ring, only ~1/N of keys move — the theoretical minimum. The rest of the cluster is completely unaffected.

---

### Level 1: The Ring Intuition

Imagine a clock face, but instead of 12 positions it has positions from 0 to 2³²−1 (about 4 billion). Both servers and keys are placed on this clock by hashing them.

- **Server placement:** `position(server) = hash(server_name)`
- **Key placement:** `position(key) = hash(key)`
- **Routing rule:** Walk clockwise from the key's position until you hit a server. That server owns the key.

```
           0 / 2³²
           │
     ┌─────┴─────┐
 270 ┤  Server C  ├ 90
     │    (S3)   │
 240 ┤           ├ 120
     └─────┬─────┘
           180
     
Ring positions (example):
  Server A → position 50
  Server B → position 150  
  Server C → position 270
  
  Key "user:1" → hash = 80  → walks clockwise → hits Server B at 150
  Key "user:2" → hash = 200 → walks clockwise → hits Server C at 270
  Key "user:3" → hash = 300 → walks clockwise → wraps to Server A at 50
```

**Adding a server:** Place it on the ring. It takes ownership of keys between its predecessor and itself. Every other key is untouched.

**Removing a server:** Its keys pass to its clockwise successor. Every other key is untouched.

With modulo hashing: `(N-1)/N` keys move when N changes ≈ 87.5% for N=8.  
With consistent hashing: `1/N` keys move ≈ 12.5% for N=8.

---

### Level 2: The Problem with a Simple Ring

A single position per server creates **uneven arc sizes**. With 3 servers randomly placed, one server might own 60% of the ring and another only 10% — by pure chance.

The solution is **virtual nodes (vnodes)**: each physical server owns many positions on the ring, not just one.

```
Physical servers: A, B, C
With 6 vnodes each:

Ring: A1-B2-C1-A2-B1-C2-A3-B3-C3-A4-B4-C4-A5-B5-C5-A6-B6-C6...
      ↑                                                         ↑
      positions scattered evenly around the ring
```

With more vnodes, the law of large numbers ensures each server owns approximately `1/N` of the ring, regardless of where the hash function places each individual token.

**Load distribution by vnode count:**

| Vnodes per server | Load imbalance (std dev) | Recommendation |
|---|---|---|
| 1 | ~30% | Never use in production |
| 10 | ~10% | Borderline acceptable |
| 100 | ~3% | Good for most systems |
| 200 | ~2% | Standard (Cassandra default) |
| 1000 | ~1% | Diminishing returns; more metadata overhead |

**Weighted vnodes for heterogeneous hardware:**

If one server has twice the RAM/CPU, give it twice the vnodes so it owns twice the ring share:

```text
vnodes_i = round(total_vnodes × w_i / Σ(all weights))
```

**Example — mixed fleet:**

| Node | RAM | Vnodes (of 600 total) | Ring share |
|---|---|---|---|
| node-A | 64 GB | 150 | 25% |
| node-B | 64 GB | 150 | 25% |
| node-C | 128 GB | 300 | 50% |

Node C owns 50% of the ring because it can store 50% of the data. Without weighting, it would be overloaded and become the hot spot.

**Metadata overhead:** 600 vnodes × 16 bytes/token × 100 nodes = ~960 KB — fits in memory on any client and is trivial to gossip across the cluster.

---

### Level 3: Production Ring Mechanics

#### Lookup Algorithm

The ring is stored as a **sorted array of (token, node_id) pairs**. Lookup is a binary search — O(log V) where V is the number of vnodes.

```python
import bisect, hashlib

def get_node(key: str, ring: list[tuple[int, str]]) -> str:
    h = int(hashlib.md5(key.encode()).hexdigest(), 16)
    idx = bisect.bisect(ring, (h,))  # binary search, O(log V)
    idx = idx % len(ring)            # wrap around the ring
    return ring[idx][1]

def get_replicas(key: str, ring: list[tuple[int, str]], R: int) -> list[str]:
    h = int(hashlib.md5(key.encode()).hexdigest(), 16)
    idx = bisect.bisect(ring, (h,)) % len(ring)
    seen_nodes, replicas = set(), []
    while len(replicas) < R:
        node = ring[idx % len(ring)][1]
        if node not in seen_nodes:
            replicas.append(node)
            seen_nodes.add(node)
        idx += 1
    return replicas
```

For a cluster with 200 vnodes × 100 nodes = 20,000 ring entries, binary search takes ~14 comparisons — nanoseconds, completely negligible vs any network RTT.

#### Replication Strategy

Most systems replicate to the next `R` clockwise **distinct physical nodes** after the primary. Cassandra calls these the coordinator (primary) and replicas.

```
Ring: ... A(token=10) → B(token=20) → C(token=30) → D(token=40) ...
Key hashes to token=15 → primary = B
Replicas (R=3): B (primary), C (next distinct), D (next distinct after C)

Quorum reads: any 2-of-3 replicas must agree (W + R > N → 2 + 2 > 3 ✓)
```

This means the system tolerates `R-1` replica failures per key without data loss.

#### Hash Function Selection

The hash function determines how uniformly nodes and keys scatter across the ring.

| Function | Speed | Distribution | Recommendation |
|---|---|---|---|
| **MD5** | ~500 MB/s | Excellent | Legacy only; overkill crypto overhead |
| **MurmurHash3** | ~3 GB/s | Excellent | Default choice for most systems |
| **xxHash** | ~10 GB/s | Excellent | Best choice for high-throughput systems |
| **CRC32** | ~4 GB/s | Good | Avoid for general use; weak on adversarial inputs |
| **SHA-256** | ~150 MB/s | Excellent | Only when cryptographic security is required |

**Critical rule:** Every client and every server in the cluster must use the **same hash function and same seed**. A mismatch causes different clients to compute different ring positions — silently routing keys to wrong nodes.

---

### Level 4: Ring Membership — Keeping Everyone in Sync

The ring is shared state. When nodes join or leave, all clients need to know. There are three propagation mechanisms:

| Mechanism | How It Works | Trade-offs | Used By |
|---|---|---|---|
| **Gossip** | Nodes periodically exchange ring state with random peers. Convergence in O(log N) rounds. | Eventually consistent; 10–30s for 1000-node cluster | Cassandra, Riak |
| **Config service (CP)** | Ring state in ZooKeeper/etcd. Clients watch for changes. | Strongly consistent; adds dependency on config service | Kafka (ZooKeeper era), Envoy/xDS |
| **Client-side bootstrap** | Clients download full ring state on startup, refresh on version mismatch. | Simple; stale until refresh | libketama, Redis Cluster |

**Gossip detail (Cassandra model):**
- Every 1 second, each node picks 3 random peers and exchanges state
- State includes: node list, tokens, health status, heartbeat counter
- Dead detection: if a node's heartbeat hasn't advanced for `phi` intervals, it's suspected DOWN
- For 1,000 nodes: full convergence ≈ log₂(1000) ≈ 10 rounds ≈ 10 seconds

#### Safe Node Addition (Stream Before Handoff)

```
1. New node registers (via gossip or config service)
2. Ring controller assigns token ranges (vnodes) to new node
3. New node streams data from current owners of those token ranges
4. Once streaming completes, ring state updated: new node goes LIVE
5. Former owners mark migrated data for deletion at next compaction
```

**Never flip the ring before data arrives.** If the ring is updated first, requests hit the new node before it has the data — cache misses or 404s for every key in the transferred range.

#### Safe Node Removal (Drain Before Departure)

```
1. Operator marks node as DECOMMISSIONING
2. Node streams all its token ranges to clockwise successors
3. Successors confirm receipt and replicate to their own replicas
4. Ring state updated: node removed
5. Node shuts down cleanly
```

**Never abruptly remove a node.** If the node was the only replica for some token range (possible during failure scenarios), abrupt removal causes permanent data loss.

---

### Level 5: Advanced Patterns

#### Pattern 1 — Client-Side Ring (Smart Client)

```
┌──────────────────┐    ring cached locally    ┌──────────────┐
│  Client          │──────────────────────────▶│  Node A      │
│  (holds ring)    │   direct to owning node   ├──────────────┤
│  ring_version=42 │                           │  Node B      │
└──────────────────┘                           ├──────────────┤
                                               │  Node C      │
                                               └──────────────┘
```

Client computes the owning node locally and routes directly — zero proxy hops.

**Used by:** Cassandra native drivers, Redis Cluster clients, libketama  
**Pro:** Lowest latency — no extra network hop  
**Con:** Ring state must be refreshed on every client; complex client library

#### Pattern 2 — Proxy-Side Ring (Thin Client)

```
┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│  Client  │────▶│  Proxy/Router   │────▶│  Node A      │
│  (dumb)  │     │  (holds ring)   │     │  Node B      │
└──────────┘     └─────────────────┘     └──────────────┘
```

A central proxy (Twemproxy, mcrouter, Envoy) holds the ring and forwards requests to the right node. Clients use standard protocols (Memcached, Redis) without knowing about the ring.

**Used by:** Twemproxy (Twitter), mcrouter (Facebook), Envoy sidecar  
**Pro:** Simple clients; ring managed in one place  
**Con:** Proxy is a bottleneck and potential single point of failure; must be horizontally scaled

#### Pattern 3 — Sloppy Quorum with Hinted Handoff

Used by Amazon Dynamo and Cassandra to keep writes available during partial failures:

1. A write for key `K` targets replicas A, B, C (per the ring)
2. If B is temporarily down, write a **hint** to node D (outside the replica set), tagged "deliver to B when it recovers"
3. When B recovers, D forwards the hinted write and deletes the hint

**Real-life example:** During an AWS availability zone outage, DynamoDB continues accepting writes for affected partitions by routing hinted handoffs to nodes in healthy AZs. When the AZ recovers, hints are drained automatically.

This allows writes to succeed even when designated replicas are down (at the cost of brief inconsistency). The sloppy quorum is `W + R > N` computed across available nodes, not necessarily the ring-designated nodes.

#### Pattern 4 — Token Range Splitting (Auto-Sharding)

Used by DynamoDB and TiKV to handle hot partitions automatically:

1. Monitor each partition's size and request rate
2. When a partition exceeds threshold (DynamoDB: >10 GB or >3,000 WCU), split its token range at the median key
3. Assign the two halves to different physical nodes
4. Update ring state atomically

**Real-life example:** A DynamoDB table for an e-commerce flash sale accumulates all writes on the partition for `product_id=VIRAL_ITEM`. DynamoDB detects the hot partition and automatically splits it, distributing the load — without any operator action.

#### Pattern 5 — Fixed Slots (Two-Level Hashing, Redis Cluster)

Instead of a continuous ring, use a fixed number of **slots** that never change:

1. Fixed 16,384 slots (not vnodes — slots never added or removed)
2. Each key maps to a slot: `slot = CRC16(key) % 16384`
3. Slots are assigned to physical nodes; resharding = moving slot assignments

```
Slot 0–5460    → Node A
Slot 5461–10922 → Node B
Slot 10923–16383 → Node C

Moving Node B's slots to Node D:
  Client gets MOVED 7500 10.0.0.4:6379  ← redirected
  Client updates its slot→node table
  Client retries directly to Node D
```

**Pro:** Client routing table is a fixed-size array (16,384 entries). Simple to implement correctly in any language.  
**Con:** Less flexible than vnodes (no weighted distribution, fixed slot count).

---

### Level 6: Alternative Hashing Algorithms

Ring-based consistent hashing isn't the only option. Three alternatives are worth knowing:

#### Rendezvous Hashing (Highest Random Weight, HRW)

For each key, score every server and pick the highest score:

```text
owner = argmax_i( hash(key ‖ server_i) )
```

- No ring data structure needed
- Perfectly uniform with any N
- **O(N) lookup per key** — must score all servers; impractical for large N
- Used by: Akamai CDN origin selection, some Nginx configs

#### Jump Consistent Hash (Google, 2014)

Pure arithmetic — no ring, no sorted array, no vnodes:

```c
int32_t JumpConsistentHash(uint64_t key, int32_t num_buckets) {
    int64_t b = -1, j = 0;
    while (j < num_buckets) {
        b = j;
        key = key * 2862933555777941757ULL + 1;
        j = (b + 1) * ((double)(1LL << 31) / (double)((key >> 33) + 1));
    }
    return (int32_t)b;
}
```

- O(log N) time, O(1) space — extremely fast and compact
- **Only supports adding nodes at the end** (no arbitrary removal)
- Ideal for ordered storage backends
- Used by: Google Spanner (internal variant), some distributed file systems

#### Consistent Hashing with Bounded Loads (Google, 2017)

A refinement of ring hashing that prevents hot spots when traffic skews:

- If a node's current load exceeds the cluster average by more than factor `ε`, skip it and try the next node clockwise
- Prevents one popular key range from overloading one node
- At the cost of slightly violating the "nearest clockwise node" rule

Used by: Google's internal load balancers, Envoy proxy (`ring_hash` and `maglev` policies)

**Algorithm comparison:**

| Algorithm | Lookup | Space | Node removal | Best for |
|---|---|---|---|---|
| Ring + vnodes | O(log V) | O(V) | Arbitrary | General purpose |
| Rendezvous (HRW) | O(N) | O(1) | Arbitrary | Small N, CDN |
| Jump Hash | O(log N) | O(1) | Append only | Sequential storage |
| Fixed slots (Redis) | O(1) | O(slots) | Arbitrary | Multi-language clients |

---

### Real-World Implementations

#### Amazon DynamoDB — Token-Based Partitioning

DynamoDB uses a 128-bit ring derived from MD5 of the partition key. Each partition owns a token range. When a partition exceeds 10 GB or 3,000 WCU, it automatically splits its token range. The control plane (a Paxos-replicated metadata service) maintains the authoritative ring state, so every router in AWS has a consistent view. When an AWS region adds capacity, DynamoDB absorbs the new nodes without any user impact.

#### Apache Cassandra — Gossip + Vnodes

Cassandra uses 256 vnodes per node by default (`num_tokens=256` in `cassandra.yaml`). Ring state gossips across the cluster every 1 second. Native drivers maintain a local ring copy and route directly — no proxy hop. During decommission, Cassandra streams all token ranges to successors before updating the ring, guaranteeing zero data loss.

#### Memcached + libketama — The Original Production Use

Before consistent hashing, Memcached used `hash(key) % N`. Adding one server to a 7-node pool moved 6/7 ≈ 86% of keys. LinkedIn's `libketama` (2007) fixed this with a ring of 150 vnodes per server using MD5. This reduced key movement to ~1/N and made cache resizing safe during traffic. Every major Memcached client library today uses this approach.

#### Discord — Gateway Server Affinity

Discord routes WebSocket connections across gateway servers using consistent hashing on `user_id`. When a gateway server restarts for a deploy, only the users in that server's ring segment disconnect. Without consistent hashing, a rolling restart of the gateway fleet would disconnect every user simultaneously.

#### Nginx / HAProxy — Cache-Friendly Load Balancing

Both support consistent hashing for upstream selection:
- Nginx: `hash $request_uri consistent;`
- HAProxy: `balance uri`

This creates **sticky routing**: all requests for the same URL always go to the same upstream cache server, maximizing hit rate. If an upstream goes down, only the keys in its ring segment miss — the rest of the fleet keeps serving hits normally.

---

### API Design for a Ring Management Service

```http
# Route a key — which node owns it?
GET /v1/ring/lookup?key=user:42
→ { "node": "node-7", "replica_nodes": ["node-2", "node-11"] }

# Add a new node
POST /v1/ring/nodes
{ "node_id": "node-12", "host": "10.0.1.12", "weight": 1.0 }
→ 201 Created
  { "token_ranges_assigned": ["0x3A2F..–0x4B1C..", "0xC012..–0xD34A.."] }

# Graceful removal (triggers async drain)
DELETE /v1/ring/nodes/node-12?drain=true
→ 202 Accepted

# Full ring state (for client bootstrap)
GET /v1/ring/state
→ { "version": 42, "vnodes": [ { "token": "0x...", "node": "node-3" }, ... ] }
```

**Client contract:** Cache ring state locally keyed by version. On `404` or routing error (`MOVED`), re-fetch ring state and retry.

---

### Design Trade-offs Summary

| Axis | Decision |
|---|---|
| **Scalability** | Horizontal: add nodes; ring absorbs them with O(keys/N) movement |
| **Latency** | Ring lookup is O(log V) — nanoseconds, negligible vs network RTT |
| **Consistency vs availability** | Stale ring views cause misroutes, not outages; prefer availability, tolerate brief stale views |
| **Fault tolerance** | Vnodes + R replicas clockwise keeps failures local to one ring segment |
| **Client complexity** | Client-side ring = fastest; proxy-side ring = simpler clients |

---

### Capacity Estimation

**Scenario:** 16-node cluster storing 2 TB total.

1. **Key movement on resize:** Adding one node moves ~1/16 = 6.25% of keys
2. **Rebalance bandwidth:** 2 TB / 16 nodes = 125 GB per node. Adding one node triggers ~125 GB streaming. At 1 Gbps = ~17 minutes. Plan maintenance windows accordingly.
3. **Metadata size:** 200 vnodes × 100 nodes = 20,000 ring entries × 20 bytes = 400 KB — trivial to cache on every client
4. **Lookup latency:** Binary search on 20,000 entries = ~14 comparisons = nanoseconds
5. **Write amplification:** Replication factor R=3 means each write goes to 3 nodes. Effective cluster write throughput = total capacity / 3

---

### Failure Modes and Mitigations

| Failure Mode | Root Cause | Mitigation |
|---|---|---|
| **Hot spots** | Too few vnodes or poor hash distribution | Use 150–256 vnodes; use MurmurHash3 or xxHash |
| **Rebalance storm** | Node removed suddenly during peak traffic | Graceful drain; throttle streaming bandwidth (Cassandra: `stream_throughput_outbound_megabits_per_sec`) |
| **Stale ring metadata** | Client cached old ring view | Version ring state; refresh on MOVED error or misroute |
| **Hash function mismatch** | Different clients use different seeds | Enforce hash function + seed in cluster config; test on startup |
| **Split-brain ring views** | Network partition splits gossip graph | Use etcd/ZooKeeper as authoritative ring store; treat gossip as cache only |
| **Skewed partitions (hot key)** | Popular key maps to one node regardless of ring | Append per-key suffix to scatter across nodes; or use bounded-load hashing |
| **Oversized range after decommission** | Leaving node's full range absorbed by one successor | Pre-split large token ranges before decommissioning |

---

### Operational Playbook

- **Vnode audits:** Periodically verify each node's actual data volume matches its expected ring share (e.g., `nodetool status` in Cassandra)
- **Ring health checks:** Monitor for nodes that are in the ring but not responding; auto-evict after grace period
- **Add nodes gradually:** Start new nodes with a small vnode count (e.g., 10) to validate health before ramping to 200
- **Never remove two nodes simultaneously:** Each removal triggers a rebalance; overlapping rebalances saturate NICs
- **Stagger additions:** Add one node, wait for streaming to complete, verify balance, then add the next
- **Free space headroom:** Keep ~20% free space per node to absorb keys streaming in during a peer's failure

---

### Evolution Over Time

| Phase | Capability |
|---|---|
| **Startup** | Basic consistent hashing; manual node management; client-side ring |
| **Growth** | Vnodes and weighted placement; gossip-based membership; proxy router for non-smart clients |
| **Scale** | Automated split-on-size (hot partition detection); bounded-load routing; hot-key scatter; auto-drain on health failure |

---

### Interview Trade-Off Questions & Answers

**Q1: When is simple modulo hashing good enough?**

**A:** When your node count is fixed and never changes under load — for example, a fixed-size batch processing cluster or a static sharding scheme where you plan migrations manually. Modulo hashing is simpler, needs no ring data structure, and has O(1) lookup. Consistent hashing is necessary when nodes join or leave while the system is serving traffic, especially for caches where mass remapping = mass cache miss = database overload.

**Q2: How many vnodes are enough?**

**A:** 150–256 is the production standard range. More vnodes reduce load variance (200 vnodes → ~2% std dev from mean), but increase: (1) ring metadata size, (2) number of token ranges each node participates in during streaming, (3) complexity of range-based operations. For most systems, 200 is the right default. Below 100, imbalance becomes noticeable. Above 500, you're paying overhead for negligible improvement.

**Q3: Rebalance during peak traffic — fast recovery or minimal movement?**

**A:** Minimize movement. A rebalance storm during peak traffic — saturating NICs with streaming data, causing cache misses for moved keys — is far worse than a slightly longer recovery window. Throttle streaming bandwidth explicitly (cap at 50–100 Mbps per node during business hours). Schedule large node additions for off-peak windows. Fast recovery matters for failures; for planned scaling, do it slowly.

**Q4: Vnodes vs. fixed slots (Redis Cluster style)?**

**A:** Vnodes offer flexibility: arbitrary node counts, weighted distribution, non-uniform ring. Fixed slots offer simplicity: client routing is a static 16,384-entry array, easy to implement correctly in any programming language. For polyglot systems where many different client libraries need to route correctly, fixed slots win — the client implementation is trivial. For storage systems where weighting and flexibility matter more than client simplicity, vnodes win. Most new cache systems choose fixed slots; most new storage systems choose vnodes.

**Q5: What happens during a network partition that splits the gossip graph?**

**A:** Each partition island develops a diverging view of the ring. Nodes on each side believe they own certain token ranges. This leads to: (1) writes accepted by wrong nodes, (2) reads missing data on the "real" owner, (3) eventual data divergence when partition heals. Mitigation: use a strongly consistent store (etcd, ZooKeeper) as the source of truth for ring state. Treat gossip as a propagation optimization only — never as authoritative. With etcd, ring updates require quorum; during a partition, ring changes block rather than diverge.

---
## Chapter 14: Designing a Distributed Cache

### 14.0 The Problem: Why Caches Exist

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

### 14.1 Requirements

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

### 14.2 Capacity Estimation

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

### 14.3 API Design

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

### 14.4 Single-Node Cache Internals

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

### 14.5 Scaling to a Distributed Cache

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

### 14.6 Cache Access Patterns

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

### 14.7 Cache Invalidation Strategies

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

### 14.8 High-Level Architecture

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

### 14.9 Failure Modes and Mitigations

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

### 14.10 Multi-Tier Caching (L1 + L2 + L3)

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

### 14.11 Redis vs. Memcached

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

### 14.12 Data Model

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

### 14.13 Key Design Decisions and Trade-Offs

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

### 14.14 Operational Considerations

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

### 14.15 Cost Estimation

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

### 14.16 Three-Year Evolution Roadmap

| Milestone | What Changes | Why |
|---|---|---|
| **Year 1: Single cluster, single region** | One Redis primary + 1 replica; manual cache invalidation on writes; LRU eviction; shared by all services | Simple; right-sized for early product; proves cache value with minimal operational burden |
| **Year 2: Cluster mode + automation** | Redis Cluster with consistent hashing + vnodes; ZooKeeper-based node discovery; write-through for critical entities; service-specific key namespaces to prevent collisions | Single-node becomes a bottleneck; automation reduces operational toil |
| **Year 3: Multi-tier + event-driven invalidation** | L1 = in-process Caffeine per service instance; L2 = Redis Cluster; L3 = DB; CDC + Kafka-driven invalidation replaces lazy TTL for critical entities; cross-region active-active replication | Sub-millisecond reads; precise invalidation; global scale |
| **Year 4+: Specialized tiers** | Separate hot-key tier; write-behind for high-throughput counters; Redis Streams for real-time leaderboards; edge caching (CDN + regional PoPs) | Workload-specific optimization; global latency reduction |

---

### 14.17 Interview Questions and Answers

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
## Chapter 15: Designing an Auto-Complete Engine

### What Problem Are We Solving?

Auto-complete is the feature where a search box shows suggestions as you type. You type `"Dub"` and see `Dubai`, `Dublin`, `Dubrovnik` appear instantly — before you finish the word.

**Why is this hard?** Every single keystroke fires a query. At 1,000 users typing simultaneously, that is thousands of sub-10 ms requests per second. A normal database query takes 20–100 ms. A disk seek takes ~10 ms. Neither can keep up. We need a completely different approach.

**Real-world scale:** Google's autocomplete serves billions of queries per day at under 5 ms median latency. Amazon shows product suggestions as you type in the search box. Airbnb completes destination names. Spotify completes song and artist names. All of these use the same core architecture this chapter walks through.

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

### Beginner View: One Server, Simple Trie

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

### Intermediate View: Requirements at Scale

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
  "limit": 10
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
  "cache_hit": true
}
```

**Why POST instead of GET?** The prefix could be long, contain Unicode characters, or carry user context (locale, A/B test group). POST bodies handle all of this cleanly. GET with query parameters works for simple cases but breaks with complex Unicode in some HTTP clients.

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
Indexer Shard 1   Shard 2   ...  Shard 16   (trie in RAM)
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

---

### Sharding Strategy

2 TB of trie data cannot fit on one machine. You need to distribute (shard) it. Three approaches:

| Strategy | How It Works | Problem |
|---|---|---|
| Alphabetical | A–D on Shard 1, E–H on Shard 2, etc. | Massively skewed: S, A, R are the most common first letters; X, Q, Z are rare |
| Random hash | Hash the prefix → shard number | Even distribution but full cluster rescan on shard addition/removal |
| **Consistent Hashing** ✅ | Nodes and keys both mapped to a ring; key goes to nearest clockwise node | Even load; only adjacent keys migrate when a node is added or removed |

Consistent hashing is covered in depth in Chapter 13. The key property here: when you add a 17th indexer node, only ~6% of keys migrate (those that fall between the new node and its predecessor on the ring). You do not need to rebuild the entire trie.

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

---

### Cost Model

| Component | Spec | Monthly Cost (AWS) |
|---|---|---|
| 16 × Indexer Nodes | r5.2xlarge (64 GB RAM each) | ~$4,800 |
| 2 × Web Servers | c5.xlarge | ~$300 |
| Redis cache cluster | cache.r6g.large (3 nodes) | ~$720 |
| S3 storage (1 TB) | Standard storage + requests | ~$50 |
| Load Balancer (ALB) | — | ~$50 |
| Monitoring (CloudWatch + alerts) | — | ~$100 |
| **Total at 1 K QPS** | | **~$6,020/month** |

**Scaling to 10 K QPS:** Add more web servers (~$300) and cache nodes (~$700). Indexer nodes do NOT need to grow — they scale with data volume, not query volume. Total at 10 K QPS: ~$7,000/month.

**Key insight:** The caching layer is what makes this economical. Without Redis, 10 K QPS would require 10× more indexer nodes (~$48,000/month for indexers alone). The $720 cache cluster saves ~$40,000/month.

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

---

### System Evolution: Year 1 to Year 3

| Year | What Changes | Why |
|---|---|---|
| **Year 1** | 16 indexer nodes, batch popularity updates, English-only. Cache hit rate ~90%. Serves 1 K QPS. | Launch with simplest thing that meets SLA. Operational debt is low. |
| **Year 2** | Multi-language trie (Unicode normalization). Near-real-time popularity updates via Kafka + Flink for trending terms. Personalized re-ranking by user location and past searches. Serves 10 K QPS. | User feedback shows international users get worse results. Trending events matter more. |
| **Year 3** | ML-based semantic suggestions using embeddings (FAISS / Milvus). Typing "cheap flights" suggests "Budget Airlines" even though "Budget" does not start with "che". Trie retained for exact prefix; vector search handles intent. Serves 100 K+ QPS. | Pure prefix matching misses ~30% of user intent at this scale. Semantic layer dramatically improves relevance. |

---

### Expert View: Advanced Topics

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
## Chapter 16: Designing a Scalable Notification Service

### The Core Problem: Why Notifications Are Harder Than They Look

Imagine you are building the Uber app. A driver cancels a ride. Within 5 seconds, the rider's phone must buzz with a push notification, an email must be queued, and possibly an SMS must be sent. Three things must happen right now while the booking service moves on to the next operation.

The naive solution: call APNs/FCM/Twilio directly from the booking service before returning the response. This works for one request. At scale it breaks:

- **APNs gets slow** → your booking endpoint becomes slow
- **Twilio rate-limits you** → your booking service returns errors
- **User has 3 devices** → you send the same push 3 times
- **User opts out of SMS** → you have no central place to check

The real solution is **complete decoupling**: the booking service publishes an event and returns immediately. A separate notification pipeline drains that event asynchronously, applies preference rules, deduplicates, fan-outs to providers, and records delivery state.

This is why real notification systems (Uber, DoorDash, Stripe, GitHub) look like **orchestration pipelines**, not simple sender services.

### Beginner's Mental Model: The Post Office Analogy

Think of the notification service as a **post office**:

- Your business service drops a **letter** (event) into a **mailbox** (Kafka) and walks away — it doesn't care when it's delivered.
- The **sorting office** (Orchestrator) reads the letter, checks the recipient's preferences ("do not disturb 10pm–7am"), decides which channels to use, and routes the letter to the right counter.
- Each **counter** (Push Worker, Email Worker, SMS Worker) handles its own delivery method and retries if the delivery fails.
- The post office keeps a **tracking record** (NotificationAttempt table) for every attempt.

**Why does this matter?** Separating acceptance from delivery means the business service is never blocked by slow external providers, and the notification pipeline can retry independently without re-running business logic.

### Real-World Examples

| Domain | Trigger | Channels | Scale |
|---|---|---|---|
| Ride-hailing (Uber) | Driver cancelled ride | Push + SMS | < 5 sec, 10M/hr |
| Finance (Stripe) | Fraud alert detected | Push + Email + SMS | Critical, < 2 sec |
| E-commerce (Amazon) | Order shipped | Email + Push | Batch, 100M+/day |
| Social (Instagram) | New follower | In-app + Push | 1B+ users |
| DevOps (PagerDuty) | Service down | Webhook + Phone call | On-call escalation |
| Marketing (Mailchimp) | Campaign blast | Email only | 100M+ at once |

---

### Functional Requirements

1. **Multi-channel delivery:** Push (APNs/FCM), Email (SES/SendGrid), SMS (Twilio), Webhook, In-app (WebSocket).
2. **Async acceptance:** Accept events and return `202 Accepted` immediately; deliver asynchronously.
3. **Priority tiers:** Critical alerts (fraud, cancellation) delivered ahead of promotional messages.
4. **Idempotency:** The same event submitted twice must not result in duplicate deliveries.
5. **User preferences:** Respect per-channel opt-outs, quiet hours, and locale settings.
6. **Cross-channel deduplication:** One user with 3 registered phones should not receive 3 identical pushes for the same event.
7. **Per-user rate limiting:** Suppress excessive notifications to a single user within a time window (e.g., max 5 push/min per user).
8. **Delivery receipts:** Track each attempt: queued → sent → delivered → opened / failed.
9. **Templates and localization:** Reusable templates with locale variants and variable substitution.
10. **Scheduled delivery:** Support delayed notifications (e.g., reminder at a specified future time).
11. **Provider failover:** If primary provider is degraded, route to backup where policy allows.
12. **Dead-letter handling:** Messages failing after N retries move to a DLQ — never silently dropped.

---

### Non-Functional Requirements

| Property | Target |
|---|---|
| End-to-end delivery latency (p99) | < 5 seconds for critical alerts |
| Throughput | 10 M notifications/hour (~2,800/sec average) |
| Burst capacity | 10× average (~28,000/sec) |
| Availability | No single point of failure; 99.99% uptime |
| Durability | At-least-once delivery; zero message loss after acceptance |
| Ordering | Best-effort per-user ordering for the same notification type |
| Security | No cross-user data leakage; PII encrypted in transit and at rest |
| Extensibility | New channels plug into the same orchestration model |

---

### Capacity Estimation

1. **Throughput:** 10 M/hour = ~2,800 notifications/second average; budget for ~28,000/second peak bursts.
2. **Channel fan-out:** At 1.8 channels/notification average, peak provider calls = ~50,000 attempts/second.
3. **Kafka ingress:** 28,000/sec × 1 KB/event = ~28 MB/s raw; replication factor 3 → ~84 MB/s internal.
4. **Receipt writes:** 50,000 attempts/second × 300 bytes/receipt ≈ 15 MB/s at peak.
5. **Kafka retention:** 7-day retention at average volume ≈ 1.7 TB raw before replication.
6. **Preference cache:** 50 M users × ~300 bytes metadata ≈ 15 GB — fits in Redis.
7. **Dedup window:** For cross-channel dedup, a Redis SET with 24-hour TTL covering `user_id + event_type + idempotency_key` uses ~64 bytes × 50 M active users ≈ 3 GB.

---

### Entity Design

**Notification**

| Field | Type | Notes |
|---|---|---|
| `notification_id` | `UUID` PK | Internal identifier |
| `idempotency_key` | `VARCHAR(128)` UNIQUE | Deduplication key from producer |
| `event_type` | `VARCHAR(64)` | e.g., `ride_cancelled` |
| `recipient_id` | `UUID` FK → User | |
| `payload` | `JSONB` | Event-specific metadata |
| `priority` | `SMALLINT` | 1 = critical, 2 = standard, 3 = marketing |
| `created_at` | `TIMESTAMP` | |
| `scheduled_at` | `TIMESTAMP` | Nullable — for future delivery |
| `status` | `VARCHAR(16)` | accepted / in_progress / delivered / failed |

**NotificationAttempt** (append-only, one row per delivery attempt)

| Field | Type | Notes |
|---|---|---|
| `attempt_id` | `UUID` PK | |
| `notification_id` | `UUID` FK → Notification | |
| `channel` | `VARCHAR(16)` | push / email / sms / webhook / in_app |
| `provider` | `VARCHAR(32)` | APNs / FCM / SES / Twilio / internal |
| `attempt_number` | `INT` | starts at 1 |
| `status` | `VARCHAR(16)` | queued / sent / delivered / failed |
| `delivered_at` | `TIMESTAMP` | Nullable |
| `opened_at` | `TIMESTAMP` | Nullable |
| `failure_reason` | `TEXT` | Nullable |

**UserPreference**

| Field | Type | Notes |
|---|---|---|
| `user_id` | `UUID` PK | |
| `opt_out_channels` | `VARCHAR[]` | channels the user disabled globally |
| `opt_out_event_types` | `VARCHAR[]` | specific event types opted out |
| `quiet_hours_start` | `TIME` | |
| `quiet_hours_end` | `TIME` | |
| `locale` | `VARCHAR(16)` | template selection |
| `max_push_per_minute` | `SMALLINT` | per-user rate limit override |

**Endpoint** (one row per registered delivery address)

| Field | Type | Notes |
|---|---|---|
| `endpoint_id` | `UUID` PK | |
| `user_id` | `UUID` FK → UserPreference | |
| `channel` | `VARCHAR(16)` | push / email / sms / webhook |
| `address` | `TEXT` | device token, email, phone, or URL |
| `provider` | `VARCHAR(32)` | APNs / FCM / SES / Twilio |
| `is_verified` | `BOOLEAN` | |
| `dedup_group` | `VARCHAR(64)` | Nullable — group endpoints for cross-device dedup |
| `updated_at` | `TIMESTAMP` | |

---

### ER Diagram

```
UserPreference ─────────────────< Endpoint
       │
       └────────────────────────< Notification ──────────< NotificationAttempt
```

- One user → one **UserPreference** row and zero or many **Endpoint** rows.
- One **Notification** → one or many **NotificationAttempt** rows (one per channel/provider attempt).
- **NotificationAttempt** is append-only so retries are fully auditable.
- **dedup_group** on **Endpoint** lets the orchestrator pick one representative device per user per group, preventing duplicate pushes to the same person across multiple registered phones.

---

### Notification Delivery State Machine

Every notification moves through a clear lifecycle:

```
ACCEPTED
    │  (event passes idempotency check and is persisted)
    ▼
IN_PROGRESS
    │  (orchestrator evaluates preferences, fans out to channel workers)
    │
    ├──► SUPPRESSED  (quiet hours, opt-out, or rate limit hit)
    │
    ├──► SCHEDULED   (future delivery requested)
    │
    ▼
SENT
    │  (provider accepted the message)
    ▼
DELIVERED            FAILED
    │                  │  (provider rejected or N retries exhausted)
    ▼                  ▼
OPENED             DEAD-LETTERED
```

Tracking this state machine is what makes the "delivery receipt" feature possible — and it lets the orchestrator decide whether to fall back to another channel if the primary one stays in FAILED state too long.

---

### API Design

```http
POST /v1/notifications
Authorization: Bearer <service-token>

{
  "event_type": "ride_cancelled",
  "recipient_id": "user_456",
  "channels": ["push", "email"],
  "priority": 1,
  "payload": {
    "ride_id": "r_789",
    "reason": "driver_unavailable"
  },
  "idempotency_key": "evt_abc123",
  "scheduled_at": null
}

202 Accepted
{
  "notification_id": "n_xyz",
  "status": "accepted"
}
```

```http
GET /v1/notifications/{notification_id}/status
→ 200 OK
{
  "notification_id": "n_xyz",
  "status": "delivered",
  "attempts": [
    {"channel": "push",  "status": "delivered", "delivered_at": "2026-04-20T10:00:05Z"},
    {"channel": "email", "status": "delivered", "delivered_at": "2026-04-20T10:00:07Z"}
  ]
}
```

```http
POST /v1/users/{user_id}/preferences
Authorization: Bearer <user-token>

{
  "opt_out_channels": ["sms"],
  "quiet_hours_start": "22:00:00",
  "quiet_hours_end": "07:00:00",
  "max_push_per_minute": 3
}

200 OK
```

---

### High-Level Architecture

```
Upstream Service  (Booking, Fraud, Marketing)
        │
        │  POST /v1/notifications
        ▼
Load Balancer
        │
Notification API Service
   ├── Auth + schema validation
   ├── Idempotency check (Redis dedup set)
   ├── Per-service rate limiting
   ├── Persist Notification row (Postgres/DynamoDB)
   └── Publish to Kafka (transactional outbox pattern)
        │
        ▼
Kafka Topics
   ├── notifications-critical        (priority=1)
   ├── notifications-standard        (priority=2)
   ├── notifications-scheduled       (future delivery)
   └── notifications-marketing       (batch / bulk)
        │
        ▼
Orchestrator / Policy Engine
   ├── Load UserPreference + Endpoints from Redis (warm cache)
   ├── Apply opt-out, quiet hours, per-user rate limit
   ├── Cross-device deduplication (pick representative endpoint per dedup_group)
   ├── Resolve and render template (locale)
   └── Fan out by channel → channel-specific Kafka sub-topics
        │
   ┌────┬──────┬────────┬──────────┬─────────┐
   ▼    ▼      ▼        ▼          ▼         ▼
 Push  Email   SMS    Webhook    In-App   Scheduler
 APNs  SES     Twilio HTTP(S)   WS conn  Delay Queue
 FCM   SendGrid                 WebPush
   │
   ▼
Receipt Collector
   ├── Update NotificationAttempt rows
   ├── Update aggregate Notification status
   └── Emit to DLQ after N failed attempts
        │
        ▼
Status Store (Postgres) + Analytics Pipeline (Kafka → Data Warehouse)
```

---

### Key Design Decisions

| Axis | Decision | Reasoning |
|---|---|---|
| Scalability | Kafka absorbs bursts between acceptance and delivery | Notification traffic is spiky; Kafka decouples producer throughput from provider rate |
| Priority | Separate Kafka topics per priority tier | Critical alerts get dedicated low-lag consumers; marketing batches can queue |
| Delivery semantics | At-least-once + application-layer idempotency | Exactly-once across external providers (APNs, Twilio) is impractical; dedup is simpler |
| Preference enforcement | Centralized orchestrator, not per-channel workers | Prevents divergence when different teams own different channels |
| Cross-device dedup | `dedup_group` on endpoints + one-pick-per-group logic | Avoids sending 3 identical pushes to the same user's 3 phones |
| Per-user rate limiting | Redis counter per `user_id` + sliding window | Prevents notification fatigue and prevents abuse from misconfigured producers |
| Persistence before publish | Transactional outbox or Kafka transactional producer | DB write + Kafka publish are atomic; no accepted-but-undelivered events on crash |
| Stateless vs stateful | Stateless API + worker fleet; stateful Kafka + Redis | Workers scale horizontally; durable state lives in specialized stores |

---

### Per-User Rate Limiting

Without per-user rate limiting, a bug in a marketing campaign can blast a user 1,000 times in a minute. The orchestrator enforces:

```
redis> INCR ratelimit:push:user_456:minute:2026042010
redis> EXPIRE ratelimit:push:user_456:minute:2026042010 60
```

If the count exceeds `max_push_per_minute` (default 5, configurable per user), the attempt is suppressed and logged. Critical notifications (priority=1) bypass rate limits.

---

### Provider Failover Strategy

Each channel worker maintains a **primary** and **secondary** provider:

```
push:  primary=FCM,        fallback=APNs (for cross-platform devices)
email: primary=SES,        fallback=SendGrid
sms:   primary=Twilio,     fallback=Vonage
```

When the primary returns a 5xx or times out after 3 retries, the worker:
1. Marks the attempt as `failed_primary`
2. Creates a new attempt against the fallback
3. Increments a `provider_error_rate` counter in Redis
4. If error rate > 10% over 5 minutes, activates a circuit breaker and routes all new traffic to the fallback automatically

---

### Delivery Flow (Critical Path)

```
1. Producer calls POST /v1/notifications
2. API validates auth, schema, and idempotency key (Redis lookup)
3. API writes Notification row and publishes to Kafka (atomic outbox)
4. Orchestrator consumes event, loads preferences + endpoints from Redis
5. Orchestrator applies: opt-out → quiet hours → per-user rate limit → cross-device dedup
6. Orchestrator renders template, creates NotificationAttempt rows, fans out to channel topics
7. Channel workers deliver to APNs / FCM / SES / Twilio / webhook
8. Provider responses update NotificationAttempt rows
9. Receipt aggregator updates Notification.status
```

Total end-to-end for critical (priority=1): < 5 seconds. Scheduled and marketing traffic tolerates longer queueing.

---

### Trade-Offs

| Decision | Option A | Option B | Chosen & Why |
|---|---|---|---|
| **Coupling** | Synchronous HTTP to provider | Async Kafka pipeline | **Async pipeline** — provider latency must not block business workflows |
| **Message bus** | SQS / RabbitMQ | Kafka | **Kafka** for replay, multiple consumers, and sustained throughput |
| **Delivery semantics** | Exactly-once | At-least-once + dedup | **At-least-once + idempotency** — exactly-once across providers is too expensive |
| **Priority handling** | Single shared queue | Separate topics per tier | **Separate topics** — critical alerts must never wait behind promotional batches |
| **Partitioning** | Random | By `recipient_id` | **By `recipient_id`** — preserves best-effort per-user ordering cheaply |
| **Preference storage** | In-memory only | Redis + Postgres | **Redis + Postgres** — low latency lookups plus durable storage |
| **Cross-device dedup** | None | dedup_group + one-pick | **dedup_group** — essential for users with multiple registered devices |
| **Per-user rate limiting** | None | Redis sliding window | **Redis sliding window** — prevents notification fatigue and producer bugs |

---

### Failure Modes & Mitigations

| Failure | Impact | Mitigation |
|---|---|---|
| Kafka broker crashes | Partitions temporarily unavailable | Replication factor = 3; consumer rebalancing; no durable message loss |
| Provider worker crashes mid-delivery | Attempt retried from Kafka | Message redelivered from last committed offset; idempotency suppresses duplicates |
| APNs / FCM rate limit | Channel-specific slowdown | Exponential backoff; provider-specific queue; circuit breaker activates fallback |
| Preference store unavailable | Cannot evaluate opt-outs or quiet hours | Redis cache serves warm reads; fail-closed for marketing, fail-open for critical |
| Duplicate event submission | Duplicate delivery | Producer-supplied `idempotency_key` stored in Redis; checked before publish |
| User device offline | Push not immediately deliverable | APNs/FCM store-and-forward; fallback to email or SMS if device offline > TTL |
| Per-user rate limit misconfigured | User flooded with notifications | Alert on per-user delivery rate; default conservative limits in orchestrator |
| DLQ growing continuously | Notifications effectively lost | Alert on DLQ depth and age; on-call triages and replays; root-cause provider bugs first |
| Template rendering failure | Notification sent with garbled content | Validate templates at deploy time; fallback to plaintext version |

---

### Why This Architecture?

Coupling business services to notification delivery creates a latency and availability dependency — a slow APNs or Twilio call delays the original user action. This architecture separates **acceptance** (fast, synchronous), **orchestration** (preference policy, dedup, rate limiting), and **provider delivery** (async, retryable) so each layer scales and fails independently. Policy stays centralized, so opt-outs and quiet hours are enforced consistently across all channels regardless of which team owns which provider.

---

### How Much Will It Cost?

| Component | Spec | Monthly Cost |
|---|---|---|
| Notification API Service (4 × c5.xlarge, auto-scaled) | Ingestion + idempotency | ~$600 |
| Kafka cluster (3 × kafka.m5.xlarge, MSK) | 7-day retention, 4 topics | ~$900 |
| Orchestrator + Policy Engine (4 × c5.large) | Preference eval, dedup, fan-out | ~$400 |
| Channel Workers (6 × c5.large, auto-scaled) | Push, email, SMS, webhook | ~$600 |
| Preference store (Redis r6g.large × 2 + RDS db.t3.medium) | User prefs + dedup counters | ~$400 |
| External APIs (APNs free; Twilio SMS $0.0079/msg; SES $0.10/1K) | 5 M SMS + 5 M emails/month | ~$2,500 |
| **Total** | | **~$5,400/month** |

External provider fees (especially SMS) dominate. Infrastructure cost is a small fraction of total spend.

---

### How Will Teams Maintain It?

- Monitor end-to-end latency from acceptance to provider acknowledgement, broken down by channel and priority.
- Alert on: consumer lag, DLQ depth, per-provider error rate, duplicate-delivery rate, per-user rate-limit suppression rate.
- Rotate APNs/FCM certificates and Twilio/SES credentials before expiry using secrets management (Vault, AWS Secrets Manager).
- Run **replay drills** using retained Kafka traffic — recovery from sender bugs must be routine.
- Version notification templates separately from application deploys — a bad template change is a production incident.
- Test quiet-hour enforcement in staging with synthetic users across time zones.

---

### How Does It Evolve in 3 Years?

| Year | Evolution |
|---|---|
| **Year 1** | Basic push + email pipeline with idempotency, retries, DLQ, and user opt-out. |
| **Year 2** | Priority tiers, scheduling, per-user rate limiting, cross-device dedup, provider failover, and richer delivery receipts. |
| **Year 3** | ML-based channel selection (predict best channel per user), notification fatigue detection, cross-channel suppression ("already delivered on push — skip email"), and regional routing for data residency (GDPR). |

---

### Interview Questions & Answers

**Q1: When should notifications stay on the request path versus being pushed to an async pipeline?**

Keep notifications synchronous only when the caller must confirm delivery before proceeding — e.g., an OTP that the user must enter on the same screen, or a 2FA code that gates login. Push everything else to async. The threshold is ~50 ms: if provider latency, fan-out, or retry logic could add more than 50 ms to the primary request, the notification belongs on an async pipeline. In practice, nearly all product notifications (cancellations, fraud alerts, reminders, marketing) should be async. The 202 Accepted pattern lets the caller move forward while delivery happens off the critical path.

**Q2: How do you prevent one user from receiving 50 identical push notifications because of a producer bug?**

Two layers of defense: (a) **Idempotency key deduplication** — the producer attaches a unique `idempotency_key` to each event; the API checks a Redis set before publishing, rejecting duplicates within a configurable TTL window. (b) **Per-user rate limiting** in the orchestrator — a Redis counter per `user_id + channel + time_bucket` enforces a maximum delivery rate (e.g., 5 push/min). Critical alerts bypass the rate limit; marketing traffic is always subject to it. This two-layer approach catches both "same event submitted twice" and "producer in a loop sending new distinct events."

**Q3: When is at-least-once delivery with deduplication the right choice, and when does missing a message cause less harm than a duplicate?**

At-least-once + idempotency is the right default for transactional notifications (fraud alerts, OTPs, password resets) where missing a delivery causes direct user harm. Accept potential loss for ephemeral bulk marketing messages where resending creates worse UX than silence — a flash-sale push that arrives 2 hours after the sale ends is actively harmful. Exactly-once delivery across external providers (APNs, Twilio) is impractical because those providers do not expose idempotent APIs in every case; application-layer dedup keys are the practical solution.

**Q4: Should preference-store failures fail open or fail closed, and does the answer differ between fraud alerts and marketing traffic?**

Yes — the answer depends on notification type and must be encoded per event type, not globally. Fail **closed** (suppress delivery) for marketing traffic when preferences are unavailable: sending unsolicited notifications creates GDPR/CAN-SPAM compliance risk. Fail **open** (deliver anyway) for critical alerts like fraud detection or security breaches: missing these causes direct user harm that outweighs the risk of one unwanted notification. Implementation: mark event types with `critical=true` → fail-open; `critical=false` → fail-closed. Monitor how often fallback decisions are made — high frequency means the preference store SLO is too loose.

**Q5: When is a shared orchestration layer better than channel-specific pipelines owned by individual teams?**

Build a shared orchestration layer when: (a) multiple teams need the same preference/opt-out enforcement, (b) deduplication must span channels (e.g., "already sent push — don't also send SMS"), (c) consistent delivery receipts are a product requirement, and (d) regulatory compliance requires a single source of truth for who received what. The shared layer becomes critical at scale when channel-specific proliferation creates inconsistent user experience — a user opts out of email but still gets SMS because the SMS team maintains a separate subscriber list. Start with channel-specific pipelines for speed; centralize when the operational cost of divergence exceeds the coordination overhead of a shared service.

**Q6: How do you handle a user with 5 registered push notification tokens (3 iPhones, 2 iPads) without flooding all 5 devices?**

Use the `dedup_group` concept on the **Endpoint** table. All 5 devices for the same user belong to the same `dedup_group`. The orchestrator's fan-out logic picks **one representative endpoint per dedup_group** for each notification — typically the most recently active device. Rules: (a) prefer the most-recently-seen device by `updated_at`; (b) if the primary times out after delivery, retry on the next device in the group. Tokens that APNs/FCM return as invalid (device unregistered) are purged immediately from the Endpoint table to keep the group clean.

---
## Chapter 17: Designing a Real-Time Push Platform

> **Case Study:** Netflix's Zuul Push Service — delivering real-time updates to 250 M+ devices.

### The Core Problem: 10 Million Open Sockets

Sending a message to one user is trivial. Maintaining persistent two-way connections to **10 million devices simultaneously** is a fundamentally different engineering problem.

The naive approach — one thread per connection — requires 10 million OS threads. That is physically impossible: a modern server has 8–32 cores and a few GB of stack memory. You need a completely different model.

**Why persistent connections?**

Without persistent connections, you fall back to polling: the client asks "any messages for me?" every second. At 10 million clients, that is 10 million HTTP requests per second just for the polling overhead — and messages still arrive up to 1 second late. Persistent connections invert the model: the server pushes when there is something to say, and the client sits quietly until then.

**The three hard sub-problems:**
1. **Scalability:** How do you hold 10 M open sockets without running out of OS resources?
2. **Routing:** When you want to push to `user_456`, which of your 80 servers currently owns their socket?
3. **Deployability:** When you redeploy code, you cannot disconnect all 10 M clients at once.

### Beginner's Mental Model: The Stadium Intercom

Think of this system as a **stadium with 10 million seats**:

- Each spectator (device) is seated in a specific section (connection server). They are just sitting there — they opened a persistent connection and are waiting.
- The announcer's booth (router) knows "seat 4,521,007 is in Section 37" but does not own the seat's headphone system.
- When a score update arrives, the booth looks up the section, forwards the audio to Section 37's speaker system (connection server), which delivers it to that one seat's headphones.

**The key resource:** Not CPU per request, but **open socket count per server**. A modern 8-core server using non-blocking I/O can handle 100,000–200,000 sockets simultaneously. 10 million connections → ~80 servers.

### Real-World Examples

| Product | Use Case | Connection Scale |
|---|---|---|
| **Netflix** (Zuul Push) | Playback state sync across devices | 250 M+ subscribers |
| **Slack** | Real-time message delivery, typing indicators | Millions of concurrent users |
| **Google Docs** | Live collaborative editing, cursor positions | Per-document sessions |
| **Robinhood** | Real-time stock price updates | Millions of live market feeds |
| **Multiplayer games** (Fortnite) | Player positions, game state sync | 100K+ per match server |
| **Uber driver app** | Driver location updates, trip status | Millions of drivers + riders |

---

### Transport Protocol Comparison

| Protocol | Direction | Model | Server State | Best For |
|---|---|---|---|---|
| **HTTP Polling** | Client → Server (repeated) | Request/response | Stateless | Simple, low-frequency (1/min) |
| **HTTP Long Polling** | Server holds open | Request/response | Stateful per request | Low-frequency events, simpler infra |
| **Server-Sent Events (SSE)** | Server → Client only | Persistent stream | Stateful | One-way push: dashboards, feeds |
| **WebSockets** ✅ | Bidirectional | Persistent channel | Stateful | Chat, gaming, collaborative tools |
| **MQTT** | Bidirectional, lightweight | Pub/Sub | Stateful | IoT devices (batteries, low bandwidth) |

**WebSocket** provides full-duplex TCP communication. Once the HTTP upgrade handshake completes, the connection is a raw byte stream — the server can push at any time without the client requesting.

**When to choose each:**
- Choose **SSE** if you only need server-to-client push and want simpler HTTP infrastructure (SSE automatically reconnects and handles backpressure well).
- Choose **WebSockets** if the client also sends messages upstream (typing indicators, game actions, collaborative edits).
- Choose **MQTT** for IoT devices that run on batteries or low-bandwidth networks — it is an order of magnitude lighter than WebSockets.
- Choose **APNs/FCM** for mobile devices that may be asleep or offline — you cannot maintain a TCP socket to a sleeping phone.

---

### Functional Requirements

1. **Persistent connection management:** Accept, authenticate, and maintain long-lived client connections.
2. **Targeted message routing:** Deliver a message to a specific device or user with < 1 second latency.
3. **Multi-device fan-out:** One user may have many active connections (phone, tablet, TV).
4. **Automatic reconnection:** Clients recover from server crashes or deploys without manual intervention.
5. **Presence awareness:** The system knows whether a specific device is currently online.
6. **Offline fallback:** When a device is offline, hand off to APNs/FCM or hold for reconnect.
7. **Priority delivery:** Urgent messages (security alerts, session-stolen) bypass low-priority queues.
8. **Message TTL:** Messages stale beyond their useful lifetime are not delivered on reconnect.
9. **Session resumption:** After reconnect, clients can request messages they missed.

---

### Non-Functional Requirements

| Property | Target |
|---|---|
| Concurrent connections | 10 M+ |
| Push latency (p99) | < 1 second inside a region |
| Availability | No server, registry shard, or broker is a SPOF |
| Connection recovery time | Clients reconnect within 3–5 seconds |
| Failure blast radius | One server failure disconnects ≤ 0.1% of clients |
| Security | Authenticated connections, encrypted transport (TLS), tenant isolation |

---

### Capacity Estimation

1. **Server count:** 10 M connections ÷ 125 K per server = **~80 connection servers**.
2. **Registry size:** 10 M entries × 100 bytes = ~1 GB before replication.
3. **Reconnect rate:** If 1% of clients reconnect per minute → 1,667 reconnects/second steady state; 10× during a bad deploy.
4. **Heartbeat load:** 10 M clients × 1 heartbeat / 60 sec = ~167,000 registry TTL refreshes/second.
5. **Push bandwidth:** 5% of clients receive 1 push/min × 1 KB = ~833 KB/s payload (mostly idle; dominated by heartbeat overhead).
6. **Missed-message buffer:** If TTL is 5 minutes, retain undelivered messages for offline users for 5 min × message_rate × offline_fraction.

---

### Entity Design

**Connection** (live registry entry, not persisted long-term)

| Field | Type | Notes |
|---|---|---|
| `connection_id` | `UUID` | |
| `client_id` | `VARCHAR(128)` | device or session ID |
| `user_id` | `VARCHAR(128)` | |
| `server_id` | `VARCHAR(64)` | owning connection server |
| `region` | `VARCHAR(32)` | |
| `connected_at` | `TIMESTAMP` | |
| `expires_at` | `TIMESTAMP` | heartbeat TTL — entry auto-expires if no heartbeat |

**PushMessage**

| Field | Type | Notes |
|---|---|---|
| `message_id` | `UUID` PK | |
| `recipient_user_id` | `VARCHAR(128)` | |
| `recipient_device_id` | `VARCHAR(128)` | Nullable — null = all devices |
| `message_type` | `VARCHAR(64)` | |
| `payload` | `JSONB` | |
| `priority` | `VARCHAR(16)` | high / normal / low |
| `freshness_ttl_sec` | `INT` | max age before dropping |
| `created_at` | `TIMESTAMP` | |

**DeliveryOutcome**

| Field | Type | Notes |
|---|---|---|
| `outcome_id` | `UUID` PK | |
| `message_id` | `UUID` FK → PushMessage | |
| `connection_id` | `UUID` Nullable | Null if delivered offline via APNs/FCM |
| `status` | `VARCHAR(16)` | delivered / dropped / offline / fallback_sent |
| `recorded_at` | `TIMESTAMP` | |

---

### ER Diagram

```
Connection Server ────────< Connection >──────── PushMessage ────────< DeliveryOutcome
                              ^
                              │ lookup
                         Push Registry
                         (Redis, client_id → server_id)
```

- One connection server owns many live **Connection** entries in the registry (with TTL).
- One **PushMessage** targets one client or user and produces one **DeliveryOutcome**.
- The **Push Registry** is the indirection layer enabling O(1) routing.

---

### API Design

```grpc
service PushService {
  rpc RegisterConnection(RegisterConnectionRequest)  returns (RegisterConnectionResponse);
  rpc SendMessage(SendMessageRequest)                returns (SendMessageResponse);
  rpc CloseConnection(CloseConnectionRequest)        returns (CloseConnectionResponse);
  rpc GetPresence(GetPresenceRequest)                returns (GetPresenceResponse);
}
```

REST equivalents:

```http
POST /v1/connections
POST /v1/push/messages
DELETE /v1/connections/{connection_id}
GET  /v1/presence/{user_id}
```

```http
POST /v1/push/messages
Authorization: Bearer <service-token>

{
  "recipient_user_id": "u123",
  "recipient_device_id": "tv_456",
  "message_type": "playback_state_changed",
  "payload": { "session_id": "s789", "state": "started_elsewhere" },
  "priority": "high",
  "freshness_ttl_sec": 30,
  "idempotency_key": "push_evt_001"
}

202 Accepted
{ "message_id": "msg_xyz", "status": "queued" }
```

---

### High-Level Architecture

```
Client (iOS / Android / TV / Browser)
        │  TLS WebSocket upgrade
        ▼
Network Load Balancer  (Layer 4 TCP passthrough)
        │  sticky by connection_id
        ▼
Connection Servers  (Netty / Node.js async I/O, ~125K sockets each)
        │  register connection, heartbeat refresh
        ▼
Push Registry  (Redis / Dynomite cluster, client_id → server_id, with TTL)
        ▲
        │  lookup server_id for each recipient
        ▼
Message Router  (stateless, Kafka consumer)
        ▲
        │  consume from prioritized Kafka topics
        ▼
Kafka Topics
   ├── push-high       (security alerts, session actions)
   ├── push-normal     (playback sync, friend activity)
   └── push-low        (recommendation badges, stats updates)
        ▲
        │  publish
        ▼
Internal Services  (via shared Push Library)

Offline Path:
Message Router ──► Offline Fallback Worker ──► APNs / FCM / Notification Service
```

---

### Key Design Decisions

| Axis | Decision | Reasoning |
|---|---|---|
| Socket model | Event-driven I/O (Netty, epoll) | Thread-per-connection impossible at 10 M sockets |
| Routing | Registry lookup (O(1)) vs broadcast (O(N servers)) | Broadcast sends every message to every server; too expensive |
| Connection lifetime | Bounded + jittered (e.g., 30 min ± random) | Prevents thundering herd on deploy; stale registry entries expire naturally |
| Server sizing | Many medium servers (~125K sockets each) | Limits blast radius; one failure ≤ 0.1% of users disconnected |
| Registry consistency | TTL-based expiry + heartbeat refresh | Stale entries expire without explicit deletion; clean up on crash |
| Offline handling | Message TTL + fallback APNs/FCM | Time-sensitive messages are useless after freshness_ttl; APNs wakes sleeping devices |
| State locality | Connection servers own sockets; routers are stateless | Stateless routers scale horizontally; socket complexity isolated to connection servers |
| Priority isolation | Separate Kafka topics per priority | Low-priority messages cannot starve high-priority delivery |

---

### Connection Lifecycle

```
                CONNECT
                   │
                   ▼
              AUTHENTICATING
           (verify JWT / session token)
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
    AUTH_FAILED          CONNECTED
    (close socket)    (write registry entry with TTL)
                           │
               ┌───────────┼────────────┐
               ▼           ▼            ▼
         HEARTBEAT    RECEIVING     CLIENT_CLOSE
         (refresh      MESSAGES      (graceful
          registry TTL)  (push)       disconnect)
               │
          TTL_EXPIRED
          (entry deleted;
           router sees client offline)
               │
         CLIENT_RECONNECT
         (new connection, new server possibly)
```

**Why bounded lifetimes?** A connection that lives forever means: (a) a bug in the new version of connection-server code affects clients forever, (b) when you deploy, all clients disconnect at once causing a massive reconnect storm. By setting connection lifetime to 30 minutes with ±5 minutes of jitter, reconnects are naturally spread over a 10-minute window, and a buggy deploy self-corrects within 30 minutes as connections cycle.

---

### Session Resumption After Reconnect

When a client reconnects after a brief disconnection (e.g., flaky WiFi), it may have missed messages. Two approaches:

1. **Client-side sequence number:** The client tracks the last `message_seq` it received. On reconnect, it sends `last_seen_seq` and the server replays any buffered messages after that sequence. Works if the server retains a short message buffer (e.g., 5 minutes of history per `client_id`).

2. **Stateless catch-up:** The client reconnects and polls a "missed events" endpoint. The push platform does not maintain history; the client fetches state directly from the source of truth (e.g., "what is the current playback state of my session?"). Simpler operationally but requires the source service to support state queries.

Netflix's approach: stateless catch-up. The Zuul Push platform does not maintain message history. On reconnect, the client refreshes its view from the appropriate APIs. This keeps the push platform simple — it is a delivery mechanism, not a message store.

---

### Thundering Herd Prevention

If all 80 servers restart simultaneously (e.g., bad deploy rolls out everywhere at once), 10 million clients reconnect at the same moment. This can:
- Overwhelm the load balancer with TCP SYN packets
- Flood the Push Registry with concurrent writes
- Cause CPU spikes on the authentication service

**Mitigations:**
1. **Jittered reconnect backoff on clients:** Clients use `min(cap, base * 2^attempt + rand(0, base))` — exponential backoff with full jitter. A client disconnected at t=0 might reconnect at t=3s, t=7s, t=15s, not at t=1s, t=1s, t=1s.
2. **Bounded connection lifetimes with per-client jitter:** Each connection expires at a different time, so even a total redeploy only disconnects a fraction simultaneously.
3. **Rolling deploys:** Deploy to one server at a time (~125K disconnects per rolling step), not all 80 at once.
4. **Admission control at load balancer:** Rate-limit new TLS handshakes per second during known-bad conditions.

---

### Trade-Offs

| Decision | Option A | Option B | Chosen & Why |
|---|---|---|---|
| **Transport** | SSE | WebSockets | **WebSockets** — need bidirectional for client ack and heartbeats |
| **Socket model** | Thread-per-connection | Event-driven I/O | **Event-driven** — thread-per-connection impossible at 10 M |
| **Routing** | Broadcast to all servers | Registry lookup | **Registry lookup** — O(1) vs O(N) |
| **Server sizing** | 10 very large servers | 80 medium servers | **Many medium** — smaller blast radius |
| **Connection lifetime** | Infinite | Bounded + jittered | **Bounded + jittered** — makes deploys survivable |
| **Offline handling** | Drop messages | APNs/FCM fallback | **Fallback** for time-sensitive; drop for stale |
| **Message history** | Buffer on push server | Stateless catch-up | **Stateless** (Netflix-style) — simpler, source of truth stays in source service |

---

### Failure Modes & Mitigations

| Failure | Impact | Mitigation |
|---|---|---|
| Connection server crashes | Clients on that server disconnect (~125K) | Clients auto-reconnect with jittered backoff; registry entries TTL-expire |
| Push Registry unavailable | Router cannot resolve server_id | Replicated Redis cluster; quorum reads; fall back to APNs/FCM for offline handling |
| Stale registry entry | Router sends to wrong server | TTL ensures staleness expires; delivery failure triggers fallback to offline path |
| Kafka broker failure | Messages on that broker delayed | Replication factor = 3; Kafka re-routes to replicas |
| Thundering herd on deploy | Massive reconnect spike | Jittered connection lifetimes + rolling deploys + client-side exponential backoff |
| Priority inversion | Low-priority messages delay high-priority | Separate Kafka topics per priority with isolated consumer groups |
| Memory leak on connection server | Connection count degrades over time | Bounded lifetimes force periodic recycling; monitor `connection_count` vs `expected_count` |

---

### Why This Architecture?

10 million open connections is a **state-management problem**, not a request-rate problem. A thread-per-connection model collapses under memory and scheduling pressure. Event-driven I/O + a dedicated connection tier + a registry-based router turns this into a horizontally scalable system: keep sockets on specialized servers, keep routing logic separate, keep reconnect storms bounded by design. The registry is the key insight — routing without it requires broadcasting every message to every server, which is O(N servers) per message and untenable at scale.

---

### How Much Will It Cost?

**Netflix-scale estimate (10 M concurrent connections):**

| Component | Spec | Monthly Cost |
|---|---|---|
| 80 × Connection servers (m5.large) | Netty, 125 K sockets each | ~$12,000 |
| Push Registry (Redis, 6-node cluster, Dynomite) | client_id → server_id, TTL heartbeat | ~$1,800 |
| Kafka cluster (6 × m5.xlarge, 3 priority topics) | 3× replication | ~$1,800 |
| Message Router (4 × c5.2xlarge, auto-scaled) | Kafka consumer + registry lookup | ~$1,200 |
| Load Balancer (NLB, TCP passthrough) | WebSocket sticky routing | ~$200 |
| Offline Fallback Worker (2 × c5.large) | APNs/FCM routing for offline clients | ~$200 |
| **Total** | | **~$17,200/month** |

At smaller scale (100 K connections): 1–2 connection servers + small Redis + small Kafka ≈ ~$1,000/month.

---

### How Will Teams Maintain It?

**The three operational lessons from Netflix Zuul Push:**

**Lesson 1: Connections make servers stateful — rollback is painful.**
A buggy build affects every client still connected to that server. Mitigation: bounded lifetimes + jitter mean bugs self-correct as connections cycle; canary deploys limit exposure.

**Lesson 2: The right auto-scaling metric is open connection count, not CPU or RPS.**
RPS is deceptively low (most connections are idle most of the time). CPU can stay low even at full capacity. Monitor `open_connections / server` and scale out at 80% of target. Use reconnect rate as a leading indicator — a spike usually precedes a CPU or memory alarm.

**Lesson 3: Never let registry entries go stale silently.**
A stale entry means the router forwards messages to a server that no longer owns the socket. Messages are silently dropped. Monitor `registry_miss_rate` (percentage of routing attempts where the target server rejects the forward) — this should be < 0.1%. Spikes indicate TTL misconfiguration or an unhealthy heartbeat path.

Additional checks:
- Alert on reconnect spikes (often signal a bad deploy or a regional network event).
- Monitor `freshness_ttl_expired_message_rate` — high rates mean messages arrive after TTL, indicating either slow delivery or TTLs set too short.
- Coordinate TLS certificate rotation across all client platforms.

---

### How Does It Evolve in 3 Years?

| Year | Evolution |
|---|---|
| **Year 1** | Single-region WebSocket cluster with basic routing, heartbeat, and manual scaling. |
| **Year 2** | Multi-region deployment, auto-scaling on connection count, jittered lifetimes, and offline APNs/FCM fallback. |
| **Year 3** | Adaptive transport (MQTT for IoT/mobile, WebSocket for browser), session resumption with sequence numbers, and intelligent message batching to reduce power drain on mobile clients. |

---

### Interview Questions & Answers

**Q1: When are WebSockets worth the operational complexity over SSE, long polling, or APNs/FCM?**

WebSockets are worth it when: (a) you need bidirectional communication — the client must also send messages upstream (typing indicators, collaborative edits, game actions), (b) message rate is high enough that polling wastes bandwidth or creates perceptible latency, and (c) sub-second delivery matters. For purely server-to-client delivery of infrequent events (e.g., email notifications), SSE or APNs/FCM are simpler and sufficient. For mobile devices that may sleep, APNs/FCM is the only viable option because a sleeping device cannot maintain a TCP socket. Choose WebSockets for collaborative tools, live dashboards, and chat. Choose APNs/FCM for mobile where battery life and background state matter more than latency.

**Q2: Is it better to run fewer large connection servers or more medium-sized ones?**

More medium-sized servers. A single large server that fails disconnects a proportionally larger share of clients, causing a bigger reconnect storm and more user-visible disruption. Netflix sized servers at ~100K–200K connections each — one failure impacts at most 0.1–0.2% of users, which is usually an acceptable blast radius. The tradeoff: more servers means more registry entries, more operational overhead, and slightly higher coordination cost — but this is almost always the right trade-off compared to the UX impact of a massive server failure. Rule: if a server failure would be visible as a major user-facing incident, the server is too large.

**Q3: How do you prevent a rolling deploy from causing a thundering herd of simultaneous reconnects?**

Three complementary controls: (a) **Bounded + jittered connection lifetimes** — connections expire at different random times so even a simultaneous redeploy only causes a fraction to reconnect at once. (b) **Rolling deploys** — deploy to one server at a time, giving the registry and load balancer time to absorb the reconnect spike before the next server restarts. (c) **Client-side exponential backoff with full jitter** — clients that disconnect simultaneously will reconnect at different times if they each wait `base * 2^attempt + rand(0, base)` seconds. Together, these convert a potential 10 M simultaneous reconnects into a smooth ~10-minute ramp.

**Q4: When should offline clients fall back to APNs/FCM versus receiving the message on the next reconnect?**

Fall back to APNs/FCM when: (a) the message is time-sensitive (driver arriving, security alert, live score update), (b) the user should be woken from background state, or (c) the message has a `freshness_ttl` that will expire before the device reconnects. Defer to reconnect when: the message is informational and tolerates latency (a badge count update, a non-urgent status change), or the device has been offline for longer than the message's useful lifetime. Design all push messages with a `freshness_ttl_sec` field so the router can make this decision automatically: if `now > created_at + freshness_ttl`, drop the message instead of delivering a stale notification that confuses the user.

**Q5: Which metric should drive auto-scaling: RPS, CPU, memory, or open connection count?**

**Open connection count** per server is the primary scaling metric. RPS is misleading for WebSocket servers — most connections are idle most of the time, so RPS stays low even when the server is at capacity. CPU stays low too because non-blocking I/O is not CPU-intensive. Memory is a secondary signal (each connection holds a socket buffer + metadata). The canonical auto-scaling rule: scale out when `open_connections > 0.8 × target_connections_per_server`. Use **reconnect rate as a leading indicator** — a sudden spike in reconnections usually precedes capacity pressure by several minutes, giving time to scale proactively before CPU or memory alarms fire.

**Q6: How does MQTT differ from WebSockets, and when would you choose it for a push platform?**

MQTT is a lightweight publish-subscribe protocol designed specifically for constrained environments: low-bandwidth networks (2G/3G), battery-powered devices, and unreliable connections. Key differences from WebSockets: (a) **Message framing is more compact** — a minimal MQTT PUBLISH packet is 2 bytes of fixed header vs. 2–10 bytes for WebSocket framing. (b) **Built-in QoS levels** — MQTT natively supports fire-and-forget (QoS 0), at-least-once (QoS 1), and exactly-once (QoS 2). WebSockets have no built-in QoS. (c) **Clean session vs persistent session** — an MQTT broker can hold queued messages for a disconnected client with a persistent session, re-delivering them on reconnect. Choose MQTT for: IoT sensors, wearables, vehicles, and any scenario where the device has constrained power or bandwidth. Choose WebSockets for: browser-based apps and native apps on full-power mobile devices where latency matters more than efficiency.

---
## Chapter 18: Counting at Scale — Top-K Trending Items

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

### Beginner's Mental Model: The Ballot Counter

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

### Why This Architecture?

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

### How Will Teams Maintain It?

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
## Chapter 19: URL Shortener & Pastebin

### The Core Problem: Two Asymmetric Workloads

A URL shortener does two things:
1. **Shorten (write):** `https://example.com/very/long/path?tracking=123&source=newsletter` → `sho.rt/aZ81kQ`
2. **Redirect (read):** When someone clicks `sho.rt/aZ81kQ`, their browser instantly goes to the original URL.

The fundamental asymmetry: you create each link **once**, but it may be clicked **millions of times**. A marketing email to 5 million subscribers that contains a link will generate millions of near-simultaneous redirects within minutes of send time. The read path must be extraordinarily fast. The write path can afford slightly more latency.

**The caching insight:** The `code → original URL` mapping is **immutable** once created — the short code never changes its target. This makes it a perfect candidate for aggressive caching at every layer: CDN edge caches, Redis, and even browser caches (with 301 redirects).

**Pastebin** is a URL shortener where the "destination" is a text blob (code snippet, log file, configuration, error trace) instead of a URL. The same short-code system applies; the difference is the redirect service instead returns content directly.

### Beginner's Mental Model

Think of a URL shortener as a **phone book in reverse**:
- Normal phone book: name → number
- URL shortener: short code → long URL

The short code is like a room number in a hotel: short, easy to say, but the hotel's front desk (your redirect service) knows exactly which room (URL) it maps to.

**301 vs 302 — the fundamental tradeoff:**
- `301 Moved Permanently` → browser caches this forever, CDN caches it → near-zero redirect latency from cache, but you **lose all analytics** on repeat clicks
- `302 Found` (temporary) → every click reaches your servers → you **capture every click for analytics**, but must handle all traffic

| Use `301` when | Use `302` when |
|---|---|
| Link is permanent, analytics not needed | Analytics must capture every click |
| Link is in a cacheable context (CDN-heavy distribution) | Link is temporary or has expiry |
| You want to minimize origin server load | You need to track unique visitors, referrers, devices |

### Real-World Examples

| Service | Primary Use | Scale | Differentiation |
|---|---|---|---|
| **TinyURL** | General purpose link shortening | Billions of links | Oldest, most recognized |
| **bit.ly** | Marketing analytics | Millions of links/day | Rich click analytics, brand links |
| **t.co** (Twitter) | Every URL in tweets | Trillions of redirects | Security scanning, malware detection |
| **goo.gl** (deprecated) | Google services | Billions of links | QR code generation, AMP support |
| **Pastebin** | Code/text sharing | 20M+ pastes/month | Syntax highlighting, expiry |
| **GitHub Gist** | Code snippet sharing | Millions of gists | Git-backed, forkable, versioned |

---

### Functional Requirements

1. **URL shortening:** Given a long URL, return a unique short code.
2. **Redirect:** `GET /{code}` resolves to the original URL with an HTTP redirect.
3. **Custom vanity aliases:** Users may supply a preferred slug (e.g., `sho.rt/my-product-launch`).
4. **TTL / expiration:** Links carry an optional expiry; after expiry return `410 Gone`.
5. **Paste support:** Accept arbitrary text blobs up to a configured maximum size.
6. **Link deactivation:** Owners can deactivate a link before expiry.
7. **Analytics:** Track redirect count, unique visitors, country, referrer, device type per link.
8. **Custom domains:** Enterprise users can serve short links from their own domains (e.g., `go.acme.com/launch`).
9. **QR code generation:** Return a QR code image for any short link.
10. **Rate limiting:** Prevent abuse on the creation endpoint.
11. **Abuse / malware detection:** Scan destination URLs and flag or block harmful links.

---

### Non-Functional Requirements

| Property | Target |
|---|---|
| Redirect latency (p99) | < 20 ms |
| Creation latency (p99) | < 200 ms |
| Availability | 99.99% (< 1 hr downtime/year) |
| Durability | No link lost once creation is confirmed |
| Read/write ratio | ~100:1 (reads dominate) |
| Scale | 100 M new links/day, 10 B redirects/day |
| Code uniqueness | No two live codes may point to different targets |
| Analytics consistency | Eventually consistent; a few seconds of lag is acceptable |

---

### Capacity Estimation

1. **Code space:** Base62 with 7 characters → `62^7` ≈ 3.5 trillion codes — enough for billions of links before collision pressure.
2. **Metadata storage:** 100 M links/day × ~100 bytes/link → ~10 GB/day of link metadata.
3. **Redirect QPS:** 10 B redirects/day ÷ 86,400 sec/day ≈ 115,000 redirects/second peak. Requires aggressive caching.
4. **Paste storage:** 1 M pastes/day × average 50 KB = ~50 GB/day — object storage is necessary.
5. **Analytics events:** 115 K click events/sec × 200 bytes each → ~23 MB/s write to analytics pipeline.
6. **Redis working set:** Top 1% of links get 99% of traffic. 1 M active links × 200 bytes = ~200 MB — trivially fits in Redis.

---

### Entity Design

**User**

| Field | Type | Notes |
|---|---|---|
| `user_id` | `UUID` PK | |
| `email` | `VARCHAR(255)` UNIQUE | |
| `created_at` | `TIMESTAMP` | |
| `plan` | `VARCHAR(16)` | free / pro / enterprise |

**Link**

| Field | Type | Notes |
|---|---|---|
| `code` | `VARCHAR(8)` PK | Base62 slug |
| `owner_id` | `UUID` FK → User | Nullable for anonymous links |
| `original_url` | `TEXT` | up to ~2 KB |
| `alias` | `VARCHAR(64)` UNIQUE | Nullable vanity slug |
| `custom_domain_id` | `UUID` FK → CustomDomain | Nullable |
| `created_at` | `TIMESTAMP` | immutable after creation |
| `expires_at` | `TIMESTAMP` | NULL = no expiry |
| `is_active` | `BOOLEAN` | soft-delete flag |
| `redirect_type` | `SMALLINT` | 301 or 302 |
| `abuse_status` | `VARCHAR(16)` | clean / flagged / blocked |

**CustomDomain**

| Field | Type | Notes |
|---|---|---|
| `domain_id` | `UUID` PK | |
| `owner_id` | `UUID` FK → User | |
| `domain` | `VARCHAR(253)` UNIQUE | e.g., `go.acme.com` |
| `ssl_cert_arn` | `TEXT` | ACM certificate reference |
| `verified_at` | `TIMESTAMP` | DNS TXT record verification |

**Paste**

| Field | Type | Notes |
|---|---|---|
| `code` | `VARCHAR(8)` PK | shares code-space with links |
| `owner_id` | `UUID` FK → User | Nullable |
| `storage_key` | `TEXT` | S3/GCS object key for blob > 64 KB |
| `content_inline` | `TEXT` | Nullable — for blobs ≤ 64 KB |
| `size_bytes` | `INT` | |
| `language` | `VARCHAR(32)` | syntax-highlight hint |
| `created_at` | `TIMESTAMP` | |
| `expires_at` | `TIMESTAMP` | |

**ClickEvent** (append-only analytics log)

| Field | Type | Notes |
|---|---|---|
| `event_id` | `UUID` PK | idempotency key |
| `code` | `VARCHAR(8)` FK → Link | |
| `occurred_at` | `TIMESTAMP` | |
| `country` | `CHAR(2)` | geo-resolved from IP |
| `referrer` | `TEXT` | |
| `device_type` | `VARCHAR(16)` | mobile / desktop / bot |
| `user_agent_hash` | `CHAR(16)` | fingerprint for unique-visitor counting |

**LinkStats** (materialized counters — eventually consistent)

| Field | Type | Notes |
|---|---|---|
| `code` | `VARCHAR(8)` PK | |
| `total_clicks` | `BIGINT` | |
| `unique_visitors` | `BIGINT` | HLL-based approximation |
| `last_updated_at` | `TIMESTAMP` | |

---

### ER Diagram

```
User ──────────< Link >────────────── LinkStats
                  │
                  └──────────────────< ClickEvent

User ──────────< Paste

User ──────────< CustomDomain ───────< Link

Link and Paste share the same code-space; a code is either a link or a paste, never both.
```

---

### API Design

#### URL Shortener

```http
POST /v1/links
Authorization: Bearer <token>  (optional for anonymous)

{
  "url": "https://example.com/very/long/path?q=foo",
  "alias": "my-product-launch",
  "ttl_seconds": 2592000,
  "redirect_type": 302,
  "custom_domain_id": "dom_abc123"
}

201 Created
{
  "code": "aZ81kQ",
  "short_url": "https://sho.rt/aZ81kQ",
  "custom_url": "https://go.acme.com/my-product-launch",
  "expires_at": "2026-05-20T00:00:00Z",
  "qr_code_url": "https://api.sho.rt/v1/links/aZ81kQ/qr"
}
```

```http
GET /aZ81kQ
→ 302 Location: https://example.com/very/long/path?q=foo
→ 301 (if redirect_type is 301)
→ 410 Gone (if expired or deactivated)
→ 451 Unavailable For Legal Reasons (if abuse_status = blocked)
```

```http
DELETE /v1/links/{code}
Authorization: Bearer <token>
→ 204 No Content
```

```http
GET /v1/links/{code}/stats
→ 200 OK
{
  "code": "aZ81kQ",
  "total_clicks": 142000,
  "unique_visitors": 98500,
  "top_countries": [{"country": "US", "clicks": 80000}],
  "clicks_over_time": [{"date": "2026-04-19", "clicks": 12000}]
}
```

```http
GET /v1/links/{code}/qr?size=256
→ 200 OK  Content-Type: image/png
(QR code image embedding https://sho.rt/aZ81kQ)
```

#### Pastebin

```http
POST /v1/pastes
{
  "content": "package main\n\nfunc main() { ... }",
  "language": "go",
  "ttl_seconds": 86400
}

201 Created
{
  "code": "xK9mPz",
  "url": "https://sho.rt/p/xK9mPz",
  "expires_at": "2026-04-21T00:00:00Z"
}
```

```http
GET /p/{code}
→ 200 OK  Content-Type: text/plain
→ 410 Gone (expired)
```

---

### High-Level Architecture

```
Client
  │
  ▼
CDN / Edge Cache  (CloudFront / Cloudflare)
  ├── 301 links: cached at edge indefinitely → zero origin hits after first request
  ├── 302 links: short TTL cache (5–60 sec) → origin for each click, captures analytics
  └── QR code images: cached at edge (immutable, long TTL)
  │
  │  cache miss
  ▼
Load Balancer  (L7, routes by path prefix)
  │
  ├─ /v1/links      → Creation Service  ──► Code Generator ──► Primary DB ──► Cache invalidation
  ├─ /{code}        → Redirect Service  ──► Redis Cluster ──► Primary DB (miss)
  ├─ /p/{code}      → Paste Service     ──► Redis ──► DB ──► S3 (large blobs)
  ├─ /v1/*/stats    → Analytics API     ──► LinkStats table + ClickEvent store
  └─ /v1/*/qr       → QR Service        ──► QR generation library ──► CDN cache
  │
  │  Redirect Service fires async click event
  ▼
Kafka topic: click_events
  │
  ▼
Analytics Consumer  ──► Geo-resolve IP ──► ClickEvent table ──► LinkStats upsert
```

---

### Code Generation Deep-Dive

Two strategies for generating short codes:

#### Strategy 1: Counter-Based (Base62 encoding of distributed ID)

```
Global counter (Redis INCR or Snowflake-style ID):
  integer 12345678 → Base62 → "5afX"

Characters: 0-9, a-z, A-Z (62 characters total)
7 characters → 62^7 ≈ 3.5 trillion unique codes
```

Pros: Zero collision. Predictable length growth. Sortable.
Cons: Sequential codes are **enumerable** — an attacker can crawl all short links by incrementing. Mitigate by shuffling with a bijective function (e.g., Feistel network or bit-reversal permutation).

#### Strategy 2: CSPRNG Hash (Random code)

```
Generate 7 random Base62 characters using CSPRNG.
If code already exists in DB → retry with new random code.
```

Pros: Non-enumerable — resistant to scraping. Each creation is independent.
Cons: Small but non-zero collision probability. Requires DB check on every creation.

**Recommendation:**
- General/public links: counter-based with shuffle (predictable + collision-free + non-sequential appearance)
- Private/sensitive links (medical results, one-time share links): CSPRNG (enumeration-resistant)
- Vanity aliases: user-supplied, checked for uniqueness, reserved namespace for brand protection

---

### Custom Domains

Enterprise users want their own branded short domains: `go.company.com/deal` instead of `sho.rt/deal`.

**How it works:**
1. User creates a `CustomDomain` record and verifies ownership via a DNS TXT record.
2. User adds a CNAME pointing `go.company.com` → `sho.rt` in their DNS.
3. A wildcard TLS certificate is provisioned (ACM) for `*.sho.rt` or per-domain cert via Let's Encrypt/ACM.
4. The redirect service receives requests on `go.company.com`, looks up the `CustomDomain` row, and resolves the link against the same `Link` table filtered by `custom_domain_id`.
5. Analytics are tagged with the custom domain to separate branded traffic in dashboards.

---

### QR Code Generation

QR codes are generated on-demand and cached aggressively:

```
GET /v1/links/aZ81kQ/qr?size=256
  1. Check CDN/Redis cache for qr:{code}:256
  2. Cache hit → return cached PNG immediately
  3. Cache miss → render QR code for https://sho.rt/aZ81kQ at 256px
  4. Store in CDN (Cache-Control: immutable, max-age=31536000)
  5. Return PNG
```

Since the link target is immutable, the QR code is also immutable — cache forever at CDN. QR codes can be generated using a library (e.g., `qrcode` in Python/Node.js, ZXing in Java) without any external API call.

---

### Redirect Flow (Critical Path)

```
1. Browser requests GET /aZ81kQ
2. CDN edge check → HIT → return 301/302 instantly (< 5 ms edge)
3. CDN MISS → Load Balancer → Redirect Service
4. Redirect Service: check Redis → HIT → return redirect, fire async Kafka click event
5. Redis MISS → query DB → populate Redis with TTL → return redirect
6. DB returns expired record → return 410 Gone
7. Kafka consumer: geo-resolve IP, write ClickEvent, upsert LinkStats
```

**Target p99 latencies:**
- CDN cache hit: < 5 ms
- Redis cache hit: < 20 ms
- DB fallback: < 50 ms

---

### Analytics

The analytics pipeline captures every redirect asynchronously:

- **What we track:** total clicks, unique visitors (HyperLogLog-based estimation), geographic distribution, referrer domain, device type (mobile / desktop / bot), click-over-time time series.
- **Why async:** Synchronous analytics on the redirect path adds latency and couples availability. A Kafka topic absorbs bursts; the consumer processes at its own rate.
- **Exactly-once guarantee:** Each `ClickEvent` has a unique `event_id`; consumer uses `INSERT ... ON CONFLICT DO NOTHING` on `event_id` before incrementing counters. Idempotent design handles Kafka consumer retries gracefully.
- **Unique visitors:** Exact unique-visitor counting requires storing every user fingerprint — expensive at scale. Use **HyperLogLog** (Redis `PFADD`/`PFCOUNT`) for ~1% error with negligible memory. For billing-grade unique visitors, fall back to exact dedup within windows.

---

### Abuse & Malware Detection

t.co (Twitter's URL shortener) is one of the largest spam/malware detection systems in the world. Every link must be scanned:

1. **At creation:** Check the destination URL against a threat-intelligence database (Google Safe Browsing API, VirusTotal, internal blocklist). Flag suspicious links immediately; set `abuse_status = flagged`.
2. **Async re-scan:** A background job periodically re-scans existing links because a domain may become malicious after creation. Set `abuse_status = blocked` and return `451` on redirect.
3. **User reporting:** Allow users to report malicious links; feed reports into the blocklist.
4. **Redirect interstitial (optional):** For flagged (not yet confirmed blocked) links, show a warning page before redirecting to let users opt out.

---

### Trade-Offs

| Decision | Option A | Option B | Chosen & Why |
|---|---|---|---|
| **Code generation** | Sequential counter | CSPRNG | **Counter with shuffle** for general; **CSPRNG** for private/sensitive links |
| **301 vs 302** | 301 Permanent (browser caches) | 302 Temporary (every click hits servers) | **302 by default** for analytics; **301 as opt-in** when analytics not needed |
| **Analytics path** | Synchronous before redirect | Async via Kafka | **Async** — synchronous analytics add latency and couple availability |
| **Paste storage** | Inline TEXT column in DB | Object storage (S3/GCS) | **Object storage** for blobs > 64 KB; inline for small pastes |
| **Cache invalidation** | TTL-only eviction | TTL + active invalidation on delete | **Both** — TTL for normal expiry, active invalidation on deactivation |
| **DB for redirects** | Relational (Postgres) | Key-value (DynamoDB) | **DynamoDB / Cassandra** for hot redirect path (single-key lookup, massive scale); Postgres for admin and analytics |
| **Custom domains** | Platform domain only | Custom domain support | **Custom domains** needed at enterprise tier |

---

### Failure Modes & Mitigations

| Failure | Impact | Mitigation |
|---|---|---|
| Code collision | Two users get the same code | Atomic `INSERT … ON CONFLICT`; retry with new code |
| Redis unavailable | All redirects hit DB; latency spike | DB handles redirect traffic at degraded latency; Redis failure is not data loss |
| TTL cleanup lag | Expired links still redirect | Lazy expiry check on read (`expires_at < NOW()` → 410); background sweeper purges old rows |
| Analytics consumer lag | Stale stats | Acceptable by design; stats are eventually consistent |
| Abuse link clicks before detection | User harmed by malicious redirect | Async scan within seconds of creation; scan on first click if creation scan missed it |
| Paste blob loss | Content unavailable | S3 has 11-nines durability; enable versioning against accidental deletes |
| Viral traffic spike | Redis/DB overwhelmed | CDN absorbs 301 traffic fully; Redis horizontal scaling; DB read replicas |
| Custom domain misconfiguration | Links return 404 for branded domain | DNS verification before activation; automated HTTPS certificate renewal |

---

### Why This Architecture?

The read path (redirect) must be dramatically faster than the write path (creation). The core design problem is making `code → target` lookups tiny, immutable, and cache-friendly. Everything else — analytics aggregation, abuse review, QR generation, TTL cleanup — runs off the critical path asynchronously. Separating the creation service from the redirect service lets each scale to its respective traffic shape independently.

---

### How Much Will It Cost?

**Infrastructure estimate (100 M new links/day, 10 B redirects/day — ~115 K redirects/sec peak):**

| Component | Spec | Monthly Cost |
|---|---|---|
| CDN (CloudFront / Cloudflare) | ~60% of 301 traffic; 10 TB/month egress | ~$900 |
| Redirect Service (4 × c5.xlarge, auto-scaled) | ~115K RPS with Redis cache | ~$600 |
| Redis Cluster (cache.r6g.large × 3) | Hot code→URL cache, ~200 MB working set | ~$700 |
| Primary DB (DynamoDB or RDS + 2 read replicas) | 100 M links/day × 100 bytes metadata | ~$1,500 |
| Creation Service (2 × c5.large) | ~1,200 writes/second average | ~$200 |
| Kafka + Analytics consumers (3-broker MSK + 2 × c5.large) | 115K click events/sec | ~$800 |
| Object Storage (S3, paste blobs + QR images, ~1 TB/month) | Standard storage + requests | ~$130 |
| **Total** | | **~$4,830/month** |

Cost drivers: DB read-replica and CDN egress dominate. A single viral link receiving 10 M clicks/day generates ~$50 in CDN egress alone. Redis memory is cheap relative to the latency savings.

---

### How Will Teams Maintain It?

- Monitor redirect p99 latency and Redis cache-hit rate (target > 98%) at all times.
- Run TTL sweeps to reclaim storage from expired links and pastes.
- Watch analytics consumer lag — backlog indicates Kafka consumer needs more resources.
- Audit custom domain TLS certificates; automate renewal via Let's Encrypt or ACM.
- Run abuse scan coverage reports: what percentage of new links are scanned within 5 seconds of creation?

---

### How Does It Evolve in 3 Years?

| Year | Evolution |
|---|---|
| **Year 1** | Basic shorten-and-redirect with TTL, soft-delete, and async click analytics. |
| **Year 2** | Analytics pipeline, Pastebin support, abuse detection, rate limiting, and QR code generation. |
| **Year 3** | Custom domains, richer analytics dashboards, enterprise SSO/audit logging, geographic routing (route US clicks to US edge, EU clicks to EU edge for GDPR compliance). |

---

### Interview Questions & Answers

**Q1: When is a sequential counter acceptable for code generation, and when do you need random codes?**

Sequential counters (Base62-encoded Snowflake IDs) are fine when: links are public content, enumeration of all links is not a security concern, and predictable sortable codes have operational value. Use random CSPRNG codes when: links are sensitive (medical results, private file shares, one-time download links), you need to prevent enumeration attacks (incrementing codes to scrape all links), or users must not be able to infer adjacent link codes. For a general consumer URL shortener, a counter with a bijective shuffle function (making codes appear random while remaining collision-free) is the best of both worlds. Never use MD5/SHA-256 truncation — the collision probability is non-trivial at scale.

**Q2: When should redirects return 301 versus 302?**

`301 Moved Permanently` tells browsers and CDNs to cache the redirect indefinitely. Future clicks bypass your servers entirely — you lose analytics, but get near-zero redirect latency from CDN edge cache. `302 Found` means every click hits your redirect service, enabling analytics capture. **Use 302 by default** for any product that cares about analytics (which is almost always). Use 301 only for permanent vanity redirects where analytics are explicitly not needed — for example, a legacy domain redirect where you only care that users arrive at the new domain, not where they came from.

**Q3: How much work should happen on the redirect path before analytics or other concerns hurt latency?**

The redirect path should do exactly two things: **code lookup** and **return redirect response**. All analytics (click events, geo-resolution, device classification), abuse checks, and QR code generation must be async or cached. Budget: one Redis lookup targeting < 5 ms, one DB fallback targeting < 50 ms total p99. Any additional synchronous work adds latency to every single click, including the 115,000 redirects per second during a viral campaign. The async Kafka event can carry all context needed for analytics processing without blocking the redirect.

**Q4: How would you handle a viral link that suddenly receives 10× expected traffic?**

Multi-layer defense: (1) **CDN absorbs 301 traffic completely** — no origin hits after first edge fill. For 302 links, CDN can cache with a short TTL (5–60 sec), reducing origin load by ~80%. (2) **Redis serves the hot redirect immutably** — `code → URL` mapping never changes after creation, so it stays in Redis cache indefinitely; horizontal Redis scaling handles more concurrent connections. (3) **DB read replicas** absorb any remaining cache-miss traffic. (4) **Rate-limit or sample analytics writes** under extreme load — drop 1-in-10 click events at 100× traffic rather than backing up the redirect path. (5) The immutable mapping means aggressive caching is safe at every layer — no cache coherence issues.

**Q5: How do you guarantee exactly-once analytics counting given Kafka consumer retries?**

You cannot guarantee exactly-once cheaply across external Kafka delivery. The practical approach is **idempotent consumer design**: (1) Each `ClickEvent` carries a unique `event_id` generated by the redirect service before publishing to Kafka. (2) The analytics consumer uses `INSERT INTO click_events ... ON CONFLICT (event_id) DO NOTHING` before incrementing `total_clicks` in `LinkStats`. (3) For unique visitor counting using HyperLogLog, Redis `PFADD` is idempotent — adding the same fingerprint twice does not double-count. (4) Accept and document that analytics counts are **best-effort eventually consistent** — this is the appropriate guarantee for a click analytics system and should be explicit in the data contract with analytics consumers.

**Q6: How do you implement custom domains without requiring users to change their entire DNS to point to your infrastructure?**

Custom domains via **CNAME delegation**: the user adds a single CNAME record to their DNS pointing `go.company.com` → `sho.rt`. They keep control of their DNS provider. Your redirect service must: (1) Accept incoming requests on any hostname (using Server Name Indication / SNI), (2) Look up the `CustomDomain` row matching the `Host` header, (3) Resolve links scoped to that `custom_domain_id`, (4) Return the redirect. For TLS, use **per-domain certificates via Let's Encrypt ACME protocol** or **AWS ACM with custom domain certificates** — automate renewal. Challenge: at tens of thousands of custom domains, certificate provisioning and renewal becomes a platform-level problem, not a one-time setup.

---
## Chapter 20: Search Engine Design

### The Core Problem: Finding Needles in Billions of Haystacks in 200 ms

Design a search engine that crawls documents from the web or an internal corpus, builds an inverted index, ranks results by relevance, and serves queries with low latency.

This chapter extends the inverted-index and trie ideas from Chapter 15, scaling them to billions of documents and 100,000 queries/second.

Two fundamentally different systems must be designed together:
1. **Offline pipeline** — continuously crawl, parse, and index documents; can afford minutes to hours of latency per document
2. **Online serving** — answer a query in < 200 ms by pre-computing as much as possible in the offline stage

The reason search feels instant despite indexing the entire web: all the hard work is done before the user ever types a word.

---

### Beginner's Mental Model: The Library Analogy

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

**Crawler politeness:** Respect `robots.txt`. Rate-limit per domain (1 request/second default; negotiate `Crawl-delay`). Rotate user-agent and source IPs to avoid being blocked.

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
   → Auto-apply correction (run both original and corrected queries in parallel)
```

**Practical implementation:** Use a trie or BK-tree over the vocabulary for fast edit-distance search. Do not run spell correction on every token — only tokens not found in vocabulary. Use the query log (not just documents) as the language model source — "rdis" is corrected to "redis" because millions of users search "redis" but almost none search "rdis".

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
"consistent" │ [(42, 1, [1]), (97, 4, [0,1,8,22]), (201, 2, [9,14])]
"cluster"    │ [(107, 5, [0,1,2,3,4]), (201, 1, [11])]
```

A lookup of `"redis consistency"` fetches two postings lists and intersects (for AND) or unions (for OR) them, then scores each candidate document.

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
Highlighted: "Redis offers several <b>consistency</b> models...eventual <b>consistency</b>"
```

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

### Why This Architecture?

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

### How Will Teams Maintain It?

- Monitor crawl success rate, robots.txt compliance, frontier depth, and per-domain fetch latency.
- Track indexing freshness SLO: time from fetch → searchable (target < 5 min for high-priority domains).
- Measure query p50/p99 latency, zero-result rate, spell-correction accuracy, and CTR as a relevance proxy.
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
## Glossary

| Term | Meaning |
|---|---|
| **ABAC** | Attribute-Based Access Control. Authorization is decided from attributes such as user role, geography, project, or request context instead of only one fixed role name. |
| **ACID** | Atomicity, Consistency, Isolation, Durability. The four properties that make a relational transaction correct under concurrency and crashes. |
| **API gateway** | The entry layer that handles authentication, rate limits, routing, protocol translation, and observability for external traffic before it reaches internal services. |
| **Backpressure** | A mechanism that slows producers or sheds work when consumers or downstream systems cannot keep up. |
| **B-tree** | A balanced tree index optimized for point lookups and range scans. Common in relational databases such as Postgres and MySQL. |
| **Bounded context** | A Domain-Driven Design boundary inside which one model and vocabulary stay consistent. The same business word can mean different things in different contexts. |
| **Cache-aside** | A caching pattern where the application reads from cache first, falls back to the database on a miss, then writes the fetched value back to cache. |
| **Cache stampede** | A burst of simultaneous cache misses for the same hot key that overwhelms the backing store. |
| **Canary deployment** | A release strategy that routes a small percentage of traffic to a new version first, then ramps up gradually if latency and error rates remain healthy. |
| **CAP theorem** | In the presence of a network partition, a distributed system can guarantee at most two of consistency, availability, and partition tolerance. Since partitions are unavoidable, the practical trade-off is consistency versus availability. |
| **CDC (Change Data Capture)** | Streaming row-level data changes from a database to downstream systems so caches, search indexes, and analytics pipelines stay up to date. |
| **Circuit breaker** | A protection pattern that stops sending requests to a failing dependency until it recovers, preventing retry storms and thread exhaustion. |
| **Compaction** | The process of rewriting on-disk data to merge segments, remove deleted entries, and reclaim space. Central to LSM-tree storage engines. |
| **Consistent hashing** | A partitioning technique that minimizes key remapping when cache or storage nodes are added or removed. |
| **Consumer group** | A Kafka abstraction where multiple consumers share a topic's partitions so work is parallelized without processing the same partition twice within the same group. |
| **Count-Min Sketch** | A probabilistic data structure that estimates item frequencies with small memory use. Useful for streaming Top-K systems where exact counting is too expensive on the hot path. |
| **CQRS** | Command Query Responsibility Segregation. The write model and the read model are separated so each can be optimized independently. |
| **Dead-letter queue (DLQ)** | A queue or topic that holds messages which failed processing too many times, so one poison message does not block the whole stream. |
| **Deduplication** | Detecting and ignoring repeated requests or messages so retries do not create duplicate side effects. |
| **Eventual consistency** | A consistency model where replicas may temporarily disagree after a write but converge over time. |
| **Fan-out** | Delivering one event to many downstream consumers, such as inventory, billing, and notification services reading the same order-created event. |
| **Fencing token** | A monotonically increasing token attached to a lock or lease holder so stale owners can be rejected even if they still believe they hold the lock. |
| **Gossip protocol** | A peer-to-peer state propagation mechanism where nodes exchange membership and health information with random neighbors instead of relying on one coordinator. |
| **Hot key** | A key that receives far more traffic than average and can overload one cache node, shard, or partition. |
| **Idempotency** | A property where executing the same logical request multiple times leads to the same final outcome as executing it once. |
| **Idempotency key** | A client-supplied token that lets a server recognize retried requests and return the original result rather than processing the operation again. |
| **Inverted index** | A search index that maps each term to the set of documents containing it, enabling fast full-text lookup without scanning all documents. |
| **Leader election** | The process of choosing one node to coordinate writes or metadata for a distributed cluster. |
| **LSM tree** | A write-optimized storage engine that buffers writes in memory and flushes them to immutable disk files, later merging them through compaction. |
| **mTLS** | Mutual TLS. Both client and server present certificates so service-to-service calls are authenticated at the transport layer. |
| **MVCC** | Multi-Version Concurrency Control. Readers see a snapshot while writers create newer versions, which improves concurrency but requires cleanup of old versions. |
| **Outbox pattern** | A way to publish events reliably by writing the business change and the outbound event record in the same local database transaction, then forwarding events asynchronously. |
| **PACELC** | An extension of CAP that says systems also trade latency against consistency when there is no partition. |
| **PageRank** | A link-analysis score that estimates authority from how many other important pages link to a page. Often combined with lexical relevance in search ranking. |
| **Posting list** | The list of document identifiers stored for a term inside an inverted index. Query execution intersects posting lists for multi-term searches. |
| **Quorum** | The minimum number of replicas that must agree for a read or write to be considered successful, usually a majority. |
| **Raft** | A consensus algorithm where a leader replicates a log to followers and commits entries after a majority acknowledges them. |
| **Replication lag** | The delay between a write reaching the primary and that same write becoming visible on replicas. |
| **RTO / RPO** | `RTO` is the target time to restore service after failure. `RPO` is the amount of data loss the business is willing to tolerate. |
| **Saga pattern** | A distributed transaction pattern that coordinates a sequence of local transactions and uses compensating actions when a later step fails. |
| **Schema registry** | A service that stores versioned event schemas and enforces compatibility rules so producers and consumers do not silently drift apart. |
| **Service mesh** | Infrastructure that adds mTLS, retries, traffic shaping, and observability to service-to-service calls without duplicating that logic in every application. |
| **Sharding** | Splitting data across multiple machines so storage and traffic scale horizontally. |
| **SLI / SLO / SLA** | `SLI` is the measured service indicator, `SLO` is the internal target, and `SLA` is the external promise with contractual consequences. |
| **Split brain** | A failure mode where two partitions each believe they are the leader and both accept conflicting work. |
| **TF-IDF** | Term Frequency-Inverse Document Frequency. A scoring method that rewards terms frequent in one document but rare across the corpus. |
| **Trie** | A prefix tree used for efficient prefix lookups such as auto-complete suggestions. Lookup cost depends on prefix length, not total vocabulary size. |
| **TTL (Time To Live)** | The amount of time cached data, sessions, or records remain valid before expiring automatically. |
| **Two-phase commit (2PC)** | A distributed commit protocol that guarantees all participants either commit or abort together, but can block if the coordinator fails after prepare. |
| **WAL (Write-Ahead Log)** | A durability mechanism where changes are appended to a log before data pages are updated, allowing recovery after crashes. |
| **WebSocket** | A long-lived full-duplex connection between client and server, commonly used for real-time push systems, chat, and live dashboards. |

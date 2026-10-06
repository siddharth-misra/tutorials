## 1: System Design Interview Framework

### 1.1 What Is System Design, and Why Does It Matter?

System design is the practice of defining how software components — services, databases, caches, queues, APIs — fit together to solve a real business problem at a specific scale.

Think of it like designing a city. A small town (startup) needs a road, a post office, and a store. A metropolis (Google-scale) needs highways, airports, multiple distribution centres, and backup power grids. The components are the same in concept, but the constraints — volume, reliability, cost — are entirely different.

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

#### Suggested time split (45-minute interview)

| Step | Time | Output |
|---|---|---|
| 1. Requirements | 5–7 min | Functional + non-functional scope, explicit assumptions |
| 2. Capacity | 4–6 min | RPS, storage, bandwidth, peak multiplier |
| 3. API | 3–5 min | 2–3 core endpoints, idempotency/versioning notes |
| 4. High-level design | 8–10 min | End-to-end architecture with sync/async separation |
| 5. Bottlenecks/failures | 10–12 min | 2–3 likely failure points + mitigations |
| 6. Trade-offs/evolution | 5–7 min | Why this design now, and when to evolve |

If the interview is shorter, keep the same order and compress details, not structure.

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

#### Two Questions Worth Getting Right

1. **"What is the read/write ratio?"** — A system that is 99% reads (Wikipedia) is designed very differently from one that is 50/50 (Twitter timeline writes). Reads are typically cheap to scale horizontally; writes require more care with consistency and replication.
2. **"Is correctness, freshness, or cost the primary constraint?"** — These three frequently conflict. A social media feed can show slightly old posts (freshness sacrificed for cost). A bank ledger cannot (correctness non-negotiable, cost secondary).

#### Requirement prioritization shorthand

When constraints conflict, explicitly rank them as:

1. **Must-have:** Non-negotiable (for example, payment correctness)
2. **Should-have:** Important but negotiable (for example, p95 latency under 200 ms)
3. **Nice-to-have:** Deferrable (for example, real-time analytics)

Saying this out loud helps the interviewer see decision quality, not just architecture knowledge.

**Real-world example — Uber ride matching:** Functional: match rider to nearby driver in real time. Non-functional: latency < 2 s, availability > 99.99% (an outage means no rides), eventual consistency acceptable for surge prices (a user seeing a price that is 10 seconds stale is fine), zero data loss for payments. Without asking these questions, you might design a strongly consistent system with cross-region synchronous writes — adding hundreds of milliseconds to the match path and making the system fragile during a regional outage.

**Step output:** A prioritized requirements list with explicit scope, assumptions, and success metrics.

---

### 1.4 Step 2 — Estimate Scale and Capacity

Back-of-envelope math is not about precision. It is about finding which dimension — storage, bandwidth, compute — is the hardest constraint, and making sure your design handles it.

#### The five-step capacity template

1. **Daily active users × actions per day = daily events.** (e.g., 100 M users × 5 posts/day = 500 M posts/day)
2. **Daily events ÷ 86,400 = average RPS; multiply by 5–10× for peak RPS.** (500 M ÷ 86,400 ≈ 5,800 avg RPS; peak ≈ 30,000–60,000 RPS)
3. **Average payload size × peak RPS = bandwidth.** (e.g., 1 KB × 30,000 = 30 MB/s ingress)
4. **Storage = payload × events/day × retention days.** (1 KB × 500 M × 365 days ≈ 183 TB/year)
5. **Shards = total storage ÷ per-node capacity; sanity-check latency by summing each hop.**

#### Three sanity checks interviewers like

- **Peak skew check:** Peaks are often bursty and regional, not globally smooth. If peak is 10× average, validate whether one region or one tenant could see 20×.
- **Read amplification check:** One user action can trigger many reads (for example, timeline aggregation). Account for internal fan-out, not just external API calls.
- **Write amplification check:** One write can create multiple downstream writes (feeds, notifications, indexes). This often becomes the true bottleneck.

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

**Step output:** A capacity sheet with average and peak RPS, bandwidth, storage growth, and first-pass sharding assumptions.

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

#### Minimal API reliability contract

Even if you do not write full OpenAPI specs, mention these explicitly:

- **Retries:** Which responses are safe to retry (for example, `5xx` or timeout)?
- **Idempotency window:** How long `idempotency_key` values are retained.
- **Error model:** Use stable error codes (for example, `RATE_LIMITED`, `INVALID_RECIPIENT`) instead of only free-form messages.
- **Auth boundary:** Who can call the endpoint (end-user token, service token, or both).

**Design principle:** Define the smallest API that satisfies the requirements. Every field you add is a contract you must maintain. Every field you leave out is a decision you are documenting consciously.

**Beginner mistake:** Designing the API as a database mirror — one endpoint per table, exposing internal schema. A good API represents domain operations ("place an order," "cancel a ride"), not database tables ("POST /orders_table"). If the database schema changes, a domain-oriented API is isolated from the change.

**Step output:** A minimal API contract with key endpoints, request/response fields, idempotency strategy, and error model.

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
| **Observability stack** | Metrics, logs, traces, alerting | Any production system where MTTR matters |

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

**Production note:** Include observability in the initial sketch, not as an afterthought. At minimum, define one user-facing SLI (for example, redirect success rate) and one system SLI (for example, queue lag).

**Step output:** One clear architecture diagram that separates request path and data path, with stores and queues labeled.

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

#### Failure-mode checklist in interviews

For each critical dependency, quickly state:

- Timeout budget (for example, 300 ms)
- Retry policy (count + backoff + jitter)
- Circuit breaker behavior (open/half-open/close)
- Fallback behavior (serve stale, queue for later, or fail fast)

This turns abstract reliability claims into concrete engineering decisions.

#### Failure analysis for the Instagram photo upload design

| Component | Failure | Mitigation |
|---|---|---|
| Upload service crashes mid-write | Partial file in S3 | Multipart upload with completion check; retry on resume |
| Kafka lag spikes | Feed fanout delayed by minutes | Backpressure limit; consumer autoscaling; SLA = "feed updates within 60 s" |
| Hot key: celebrity posts | Single shard overwhelmed | Pre-shard fan-out; celebrity posts use a separate high-throughput path |
| Feed fanout writes too many DB rows | Write amplification for users with 10 M followers | Hybrid push/pull: push for accounts with < 1 M followers; pull on read for accounts above that threshold |

**Real-world example:** When a major celebrity like Taylor Swift tweets, Twitter's fan-out service used to push updates to ~90 M followers synchronously. This caused visible fan-out delays on the write path. The fix was a hybrid model: pre-compute feeds for most users on write, but merge celebrity tweets at read time.

**Step output:** A short failure table listing likely bottlenecks, blast radius, and mitigation per component.

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

#### Decision log template (high signal in interviews)

Use this one-liner format as you discuss choices:

`Decision: <choice> | Why: <primary constraint> | Cost: <what gets worse> | Trigger to revisit: <metric/threshold>`

Example:

`Decision: eventual consistency for feed reads | Why: p95 latency target | Cost: occasional stale timeline | Trigger to revisit: stale-read complaints > 0.5% of sessions`

**Rule:** Do not design for Stage 3 when you are at Stage 1. Over-engineering costs money and engineering time, and the boundaries you guess at Stage 1 are usually wrong by Stage 3 anyway. The right answer is: "Today I'd build this; here is the clear trigger that tells us to move to the next stage."

**Step output:** A decision log with current choice, trade-off cost, and measurable trigger to evolve.

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

This depth model is the quality bar for every step in Sections 1.3 to 1.8.

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

**Compress:** Step 3 (API) and Step 4 (high-level design). Mention only key endpoints and draw the minimum architecture needed to support discussion.

**The rule:** Follow the time split from Section 1.2 and use any remaining time for one high-value deep dive.

---

#### 2. When should you push back on a requirement because it makes the design unrealistic?

Push back when a requirement creates a contradiction you cannot resolve without acknowledging it — and when accepting it silently would produce a dishonest design.

**Example of a contradiction to push back on:** "We need 100% availability and strong consistency across all global regions." That is impossible under network partitions (CAP theorem). The right response is: "Strong consistency and 100% availability conflict during a partition. Can we accept eventual consistency for reads, or a brief write-outage during a partition, rather than 100% availability?"

**Example of a valid pushback on scope:** "You mentioned the system should support 10 billion daily users. Are we designing for that day one, or should I design for current scale with a clear path to get there? Designing for 10 B users from scratch costs 100× more and takes far longer to build."

Interviewers appreciate pushback that demonstrates engineering judgment. They dislike pushback that is avoidance ("that seems hard, can we simplify?"). The difference is whether you propose a concrete alternative.


#### 3. If you have time for only one deep dive, how do you choose between scaling, data model, and failure handling?

Choose the dimension that, if wrong, would cause the most irreversible damage to the system.

- **Data model** is often the highest-stakes choice because it is the hardest to change after launch. A wrong schema or wrong database type (relational vs. document vs. wide-column) creates technical debt that lasts years. Deep-dive on the data model when the access patterns are unusual, when the data has complex relationships, or when scale requirements push against relational assumptions (e.g., a time-series workload on a relational DB).

- **Failure handling** is the highest-stakes choice when the product cannot tolerate even brief outages or data loss — payments, healthcare, financial trading. A system that loses data or corrupts state during a crash is worse than one that is merely slow.

- **Scaling** is the highest-stakes choice when the capacity estimate shows you are within an order of magnitude of a single node's limits. If your math shows 50,000 write RPS and a single DB handles 5,000, you must solve the scaling problem before the interview ends.

**Rule of thumb:** Data model for data-intensive products, failure handling for correctness-critical products, scaling for high-volume products.

---

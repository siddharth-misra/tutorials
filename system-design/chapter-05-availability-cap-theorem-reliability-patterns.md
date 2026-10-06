## 5: Availability, CAP Theorem & Reliability Patterns

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

## 12: Event-Driven Messaging Systems

This chapter builds a complete mental model of event-driven messaging from first principles to production-grade design. You will understand why asynchronous messaging exists, how to choose between queues and pub/sub, how to guarantee correctness under retries and failures, and how to design systems that stay operationally healthy at scale.

**Topics covered:** queues, pub/sub, delivery guarantees, idempotency, retries, dead letter queues, backpressure, ordering, replay, schema evolution, outbox pattern, event sourcing, CQRS, broker selection, capacity planning, and operations.

---

### Part 1 — Why Messaging?

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

### Part 2 — Core Building Blocks

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

#### Event vs Command (Common Interview Trap)

- **Event** describes something that already happened (`order_created`, `payment_failed`).
- **Command** asks for something to happen (`create_invoice`, `reserve_inventory`).

Guideline:
- Use events for decoupled fan-out and auditability.
- Use commands when exactly one owner should perform an action.

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

### Part 3 — Delivery Guarantees

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

### Part 4 — Idempotency: Handling Duplicates Safely

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
-- Attempt to claim the idempotency key first
INSERT INTO processed_events (consumer_name, idempotency_key, processed_at)
VALUES ('payment_service', 'order_123_payment_attempt_1', NOW())
ON CONFLICT (consumer_name, idempotency_key) DO NOTHING;

-- If rows_affected = 0, this is a duplicate; skip side effects and ack safely.
```

**Key rules:**
1. Use a `UNIQUE` constraint on `(consumer_name, idempotency_key)` to make dedup race-safe.
2. For DB-local effects, write business state and dedup marker in one transaction.
3. For external effects (payment gateway, email), persist an idempotency state machine (`pending`/`succeeded`/`failed`) and reuse the same external idempotency key on retries.

#### Real-World Example

Stripe's payment API accepts an `Idempotency-Key` header. If you call Stripe twice with the same key, you get the same result without a second charge. Their servers store the first response keyed by your idempotency key and return it on replay.

---

### Part 5 — Retries, Backoff, and Dead Letter Queues

#### When to Retry

Retry only for **transient failures**: timeouts, HTTP 429 rate limit responses, temporary service unavailability.

Do not retry **permanent failures**: invalid payload, business rule violation, message too large. These will never succeed and will tie up the consumer.

Practical classifier:
- Retry: network timeout, 5xx, 429, transient broker/network errors.
- No retry: schema validation failure, missing required business fields, authorization failure.

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

### Part 6 — Partitioning, Consumer Groups, and Ordering

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
5. **Apply load shedding** — if lag threatens critical SLOs, drop or sample non-critical traffic first.

---

### Part 7 — The Outbox Pattern: Solving Dual-Write

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
- Database and event stream are eventually consistent, with no permanent dual-write gap.

#### CDC-Based Outbox (Production Scale)

At high volume, polling the outbox table adds database load. Production systems use **Change Data Capture (CDC)** with Debezium:

```
PostgreSQL WAL → Debezium connector → Kafka topic
```

Debezium reads the database write-ahead log and streams outbox row insertions directly to Kafka without polling. This eliminates DB polling load and achieves near-zero latency from DB write to event publication.

---

### Part 8 — Replay-Safe Consumer Design

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

### Part 9 — Schema Evolution and Compatibility

#### Why Schema Matters

Producers and consumers are deployed independently. A producer may add a field today; consumers running yesterday's code still need to read the message. Without governance, schema changes break consumers silently.

#### Compatibility Modes

| Mode | Rule | Safe operations |
|---|---|---|
| Backward compatible | New consumers can read old messages | Add optional fields; avoid removing required fields |
| Forward compatible | Old consumers can read new messages | Add fields only with safe defaults/optional semantics |
| Full compatible | Both directions hold | Add optional fields with defaults; avoid renames/removals |

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

### Part 10 — Event Sourcing and CQRS

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

### Part 11 — Broker Selection Guide

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

- **SQS** — standard queue (at-least-once) or FIFO queue (ordered with deduplication window).
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
| Exactly-once within pipeline | ✓ (transactions, scoped) | ✗ | Partial (dedup window + consumer idempotency still required) |

---

### Part 12 — System Architecture

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

### Part 13 — Capacity Planning

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

### Part 14 — What Can Fail?

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
7. **Consumer rebalance duration** — alert if rebalances exceed expected deployment window
8. **Retry-to-DLQ ratio** — alert on sudden spikes (often indicates upstream regression)

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

#### Pre-Production Readiness Checklist

Before shipping an event-driven workflow to production, verify:
1. Every side-effect consumer has idempotency keys and dedup constraints.
2. Retry policy distinguishes transient vs permanent failures.
3. DLQ replay tooling exists and is tested in staging.
4. Outbox (or CDC equivalent) is in place for all producer writes that also emit events.
5. Schema compatibility mode is enforced in CI/CD.
6. Dashboards include publish latency, lag, DLQ depth, error rate, and partition skew.
7. At least one chaos test has been executed and documented.

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

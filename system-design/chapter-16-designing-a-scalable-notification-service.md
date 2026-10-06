## 16: Designing a Scalable Notification Service

### The Core Problem: Why Notifications Are Harder Than They Look

Imagine you are building the Uber app. A driver cancels a ride. Within 5 seconds, the rider's phone must buzz with a push notification, an email must be queued, and possibly an SMS must be sent. Three things must happen right now while the booking service moves on to the next operation.

The naive solution: call APNs/FCM/Twilio directly from the booking service before returning the response. This works for one request. At scale it breaks:

- **APNs gets slow** → your booking endpoint becomes slow
- **Twilio rate-limits you** → your booking service returns errors
- **User has 3 devices** → you send the same push 3 times
- **User opts out of SMS** → you have no central place to check

The real solution is **complete decoupling**: the booking service publishes an event and returns immediately. A separate notification pipeline drains that event asynchronously, applies preference rules, deduplicates, fan-outs to providers, and records delivery state.

This is why real notification systems (Uber, DoorDash, Stripe, GitHub) look like **orchestration pipelines**, not simple sender services.

### The Post Office Analogy

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

### Design Rationale

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

### Operations

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

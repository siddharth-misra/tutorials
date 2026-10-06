# 22: Payment Systems Engineering

Payment platforms are distributed systems with financial consequences. That means familiar engineering concerns such as retries, idempotency, consistency, and event ordering become more demanding because mistakes do not just create bugs, they create money mismatches and compliance problems.

This chapter explains the core system-design patterns used to keep payment workflows correct under failure. The focus is on why those patterns exist and how they protect transaction integrity, replay safety, and operational recovery.

---

## 22.1 Engineering Reality

Payment systems are distributed, failure-prone, and highly regulated.

Design must prioritize correctness first, then speed.

---

## 22.2 Idempotency and Duplicate Prevention

Idempotency ensures repeated requests do not create repeated financial effects.

Core mechanisms:

- idempotency keys,
- dedupe stores,
- deterministic response replay.

---

## 22.3 Retry and Replay Safety

Retries are unavoidable; unsafe retries are dangerous.

Use:

- exponential backoff,
- jitter,
- bounded retries,
- poison-message handling.

---

## 22.4 CQRS and Event Sourcing

- **CQRS:** Separate read and write models for scalability/control.
- **Event sourcing:** Persist state changes as immutable events.

These patterns can improve auditability and temporal debugging.

---

## 22.5 Saga Patterns

Sagas coordinate multi-step workflows without global ACID transactions.

Compensation actions handle partial failures.

---

## 22.6 Consistency and CAP Trade-offs

Distributed systems trade among consistency, availability, and partition tolerance.

Payments need careful boundary design:

- where strong consistency is mandatory,
- where eventual consistency is acceptable with safeguards.

---

## 22.7 Observability and Controls

Minimum controls:

- trace IDs across services,
- domain-level metrics,
- alerting on financial anomalies,
- auditable operator interventions.

---

## 22.8 Common Mistakes

1. Event-driven architecture without replay governance.
2. No compensation strategy for partial failures.
3. Mixing business and technical retry logic unsafely.

---

## 22.9 Glossary

- **CQRS:** Command Query Responsibility Segregation.
- **Saga:** Distributed transaction coordination pattern with compensation.
- **Eventual consistency:** Data converges over time, not instantly.
- **Poison message:** Message that repeatedly fails processing.

---

## 22.10 Resources

- Martin Fowler CQRS: https://martinfowler.com/bliki/CQRS.html
- Microservices patterns: https://microservices.io/

---

## 22.11 Recap

- Payment engineering requires strict safety patterns.
- Idempotency and replay control are non-negotiable.
- Distributed consistency decisions must be explicit and testable.

Next: Cloud and Infrastructure for Payment Platforms.

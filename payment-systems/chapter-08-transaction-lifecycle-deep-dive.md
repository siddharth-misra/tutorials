# 8: Transaction Lifecycle Deep Dive

A card payment is not one moment at checkout. It is a lifecycle with multiple message exchanges, state transitions, and exception paths that can unfold over seconds, hours, or days.

That lifecycle matters because real systems are built around non-happy paths: retries, reversals, timeouts, duplicate submissions, late clearing, and partial failures. This chapter follows the transaction end to end so you can understand where problems happen and how payment platforms stay consistent when the flow gets messy.

---

## 8.1 Lifecycle Overview

A card transaction is a multi-stage process:

1. Authorization
2. Capture/presentment
3. Clearing
4. Settlement
5. Reconciliation and exception handling

Each stage can fail or diverge.

---

## 8.2 Authorization Decisioning

Issuer decision includes checks like:

- account status,
- available funds/credit,
- risk/fraud signals,
- velocity and policy controls.

Result is approval or decline with response code.

---

## 8.3 Reversals and Voids

If a transaction is canceled or failed after approval:

- merchant/acquirer may send reversal,
- issuer releases hold,
- records must align to avoid customer confusion.

Reversal timeliness is important for trust.

---

## 8.4 Partial Approvals

Sometimes requested amount exceeds available funds/limit.

Issuer may approve a smaller amount where rules allow.

Merchant UX must clearly handle partial approvals.

---

## 8.5 Retries and Timeouts

Network or processor issues can cause timeouts.

Safe retry design requires:

- idempotency keys,
- duplicate detection,
- deterministic response handling.

Without this, duplicate charges can occur.

---

## 8.6 Stand-In Processing (Concept)

In specific outage scenarios, network-level stand-in logic may provide fallback authorization behavior using predefined rules.

Stand-in is continuity support, not a replacement for issuer systems.

---

## 8.7 Clearing and Settlement Timing

Clearing files can arrive later than authorization.

Implications:

- posted amount may differ from hold amount,
- FX and tips can alter final amount,
- delayed presentment requires robust reconciliation.

---

## 8.8 Exception Handling Framework

Strong systems maintain:

- reason-code based workflows,
- queue-based retry pipelines,
- manual review for edge cases,
- strict audit logging.

---

## 8.9 Common Mistakes

1. No idempotency on retries.
2. Poor handling of timeout-then-late-response scenarios.
3. Assuming hold and posting always match exactly.
4. Missing observability on decline/reversal trends.

---

## 8.10 Glossary

- **Capture:** Merchant confirmation to finalize authorized transaction.
- **Timeout:** No response within expected SLA.
- **SLA:** Service Level Agreement for expected performance.
- **Reason code:** Standard category explaining dispute/exception type.

---

## 8.11 Resources

- Visa developer docs: https://developer.visa.com/
- PCI SSC: https://www.pcisecuritystandards.org/

---

## 8.12 Recap

- Payment lifecycle includes multiple asynchronous stages.
- Non-happy paths are normal and must be engineered intentionally.
- Idempotency, reconciliation, and observability are core reliability controls.

Next: Tap to Pay and EMV.
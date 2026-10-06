# 6: Issuer Accounts, Ledger, and Balances

Issuer balances are not just numbers on a screen. They reflect ledger entries, authorization holds, settlement postings, fees, reversals, and timing differences between network messages and internal account systems.

This chapter explains how available balance and posted balance diverge, why holds exist, and how processors and issuers keep account state consistent while transactions are still moving through the network. If this layer is misunderstood, every later discussion about disputes, reconciliation, or risk becomes harder to reason about.

---

## 6.1 Why Ledger Thinking Is Essential

Payments are not only API calls; they are financial events that must be auditable.

A ledger provides:

- traceability,
- control,
- reconciliation foundation,
- dispute support.

---

## 6.2 Authorization Hold vs Posted Transaction

During authorization, systems often place a hold.

- **Hold:** Temporary reservation of funds/credit.
- **Posted transaction:** Final accounting entry after clearing/settlement events.

Holds can be released, partially captured, or adjusted.

---

## 6.3 Available Balance Model

Simple conceptual formula:

Available balance = current balance - active holds - pending fees (if applicable)

Exact rules vary by issuer policy and regulation.

---

## 6.4 Double-Entry Basics

Double-entry means every financial movement has corresponding debit/credit entries.

Benefits:

- internal consistency,
- easier reconciliation,
- stronger audit posture.

Even if customer sees one transaction line, backend may record multiple accounting events.

---

## 6.5 Reconciliation Layers

Reconciliation is needed between:

1. Processor operational records
2. Issuer internal ledger
3. Network clearing/settlement files
4. Bank settlement accounts

Mismatch handling is a core operations function.

---

## 6.6 Exception Scenarios

- late presentment,
- duplicate presentment,
- partial reversal,
- currency conversion variance,
- timeout with later completion.

Systems must safely handle all without corrupting balances.

---

## 6.7 Controls and Auditability

Minimum good practices:

- immutable event IDs,
- idempotent posting logic,
- maker-checker for sensitive adjustments,
- full audit trail for manual interventions.

---

## 6.8 Common Mistakes

1. Treating authorization approval as final posting.
2. Weak idempotency causing duplicate ledger entries.
3. Incomplete reversal handling.
4. No clear aging rules for stale holds.

---

## 6.9 Glossary

- **Ledger:** Authoritative financial record system.
- **Idempotency:** Repeating an operation does not change outcome after first success.
- **Presentment:** Finalized transaction submission for clearing.
- **Maker-checker:** Two-person control model for sensitive actions.

---

## 6.10 Resources

- BIS payment concepts: https://www.bis.org/
- Visa settlement resources (overview): https://usa.visa.com/

---

## 6.11 Recap

- Holds and postings are distinct stages.
- Ledger integrity and idempotency are non-negotiable.
- Multi-party reconciliation keeps financial truth aligned.

Next: Transaction Economics.

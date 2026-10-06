# 16: Visa Direct

Visa Direct uses the network for push-style disbursements rather than only for traditional purchase flows. That makes it useful for payouts, gig-worker earnings, refunds, remittances, and other cases where funds need to reach an eligible account quickly.

The important conceptual shift is that the system is sending money out to a recipient through a networked credential or account mapping instead of authorizing a consumer purchase. This chapter explains where Visa Direct fits, what operating controls matter, and how its risk profile differs from standard card acceptance.

---

## 16.1 What Is Visa Direct (Conceptually)

Visa Direct supports push-payment scenarios where funds are sent to eligible credentials/accounts for use cases like disbursements.

It is commonly discussed for faster payout experiences.

---

## 16.2 Core Use Cases

- P2P transfers,
- gig-worker payouts,
- insurance claims,
- marketplace seller disbursements,
- remittance flows.

---

## 16.3 Business Advantages

- improved recipient experience,
- faster access to funds in many scenarios,
- stronger operational predictability vs batch-only payout models.

---

## 16.4 Operational Design Considerations

1. Recipient validation and eligibility checks.
2. Risk screening before payout initiation.
3. AML/sanctions controls for disbursement programs.
4. Failure/retry handling and reconciliation.

---

## 16.5 Platform Architecture Patterns

Typical payout platform includes:

- API layer,
- orchestration/risk service,
- payout ledger,
- reporting and compliance modules,
- support tools for exception management.

---

## 16.6 Common Mistakes

1. Focusing only on speed, ignoring controls.
2. Weak recipient identity verification.
3. No clear handling for failed or returned payouts.

---

## 16.7 Glossary

- **Push payment:** Payment initiated by sender to recipient.
- **Disbursement:** Outbound payment from business/government to individual/entity.
- **Remittance:** Cross-border money transfer, often person-to-person.

---

## 16.8 Resources

- Visa Direct overview: https://usa.visa.com/visa-direct.html

---

## 16.9 Recap

- Visa Direct supports modern payout and disbursement use cases.
- Speed must be paired with robust risk and compliance controls.
- Reconciliation and exception handling remain critical.

Next: B2B Connect and Cross-Border Payments.
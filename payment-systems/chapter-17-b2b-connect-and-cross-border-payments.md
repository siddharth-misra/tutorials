# 17: B2B Connect and Cross-Border Payments

Cross-border B2B payments are harder than domestic consumer payments because they combine multiple banks, currencies, compliance regimes, and reconciliation needs. Delays and uncertainty often come less from the payment message itself and more from missing transparency around fees, foreign exchange, counterparties, and settlement timing.

This chapter explains why cross-border flows are structurally complex and how network-led approaches such as B2B Connect aim to reduce friction. It frames the problem in operational terms so you can see where modernization helps and where legacy constraints still remain.

---

## 17.1 Why Cross-Border Is Hard

Cross-border payments involve multiple jurisdictions, currencies, compliance regimes, and intermediaries.

Common friction points:

- slower settlement,
- higher cost opacity,
- reconciliation gaps,
- inconsistent messaging standards.

---

## 17.2 B2B Connect Lens

B2B payment modernization focuses on:

- better transparency,
- richer payment data,
- predictable timelines,
- improved traceability.

These improvements matter for treasury teams and supplier confidence.

---

## 17.3 FX and Correspondent Banking Complexity

- **FX conversion** introduces rate and timing variance.
- **Correspondent chains** can increase cost and reduce visibility.
- **Compliance controls** add necessary checks but can increase latency.

Architecture must handle these realities explicitly.

---

## 17.4 Design Priorities for Cross-Border Platforms

1. End-to-end tracking identifiers.
2. Rich remittance data.
3. Predictable fee transparency.
4. Exception and return workflows.
5. Regional compliance adaptability.

---

## 17.5 Common Mistakes

1. Designing cross-border like domestic flows.
2. Ignoring FX reconciliation detail.
3. Weak support tooling for payment status inquiries.

---

## 17.6 Glossary

- **FX:** Foreign exchange conversion.
- **Correspondent banking:** Intermediary-bank chain used for certain international transfers.
- **Remittance data:** Payment context data used by receiver for reconciliation.

---

## 17.7 Resources

- Visa B2B resources: https://usa.visa.com/business/solutions/b2b-connect.html
- SWIFT standards context: https://www.swift.com/

---

## 17.8 Recap

- Cross-border B2B payments are data and compliance heavy.
- Transparency and traceability are key modernization goals.
- FX and intermediary complexity must be first-class design concerns.

Next: Government-to-Consumer, Open Banking, and Embedded Finance.

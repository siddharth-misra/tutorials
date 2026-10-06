# 13: Fraud Prevention

Fraud prevention in payments is an optimization problem, not just a blocking problem. A system that stops every suspicious transaction by declining aggressively will also reject legitimate customers, reduce revenue, and create operational friction for merchants and issuers.

The hard part is balancing approval rate, fraud loss, customer experience, and investigation cost across many channels and attack patterns. This chapter explains the layered controls used in card programs and why strong fraud programs combine models, rules, operations, and feedback loops rather than relying on a single tool.

---

## 13.1 Fraud Is a System Problem

Fraud prevention is not one model or one rule. It is a layered system across issuer, acquirer, merchant, and network controls.

---

## 13.2 Core Fraud Control Layers

1. Real-time risk scoring
2. Velocity and anomaly checks
3. Device, behavioral, and geolocation signals
4. Rules engines and model decisions
5. Manual review/escalation for edge cases

---

## 13.3 Approval Rate Trade-off

Blocking fraud too aggressively can decline good transactions.

Two key metrics:

- **Fraud rate:** Loss/abuse indicator
- **Approval rate:** Revenue and customer-experience indicator

Great teams optimize both, not one at the expense of the other.

---

## 13.4 False Positives

False positive = legitimate transaction declined.

Impacts:

- lost revenue,
- customer frustration,
- reduced trust in card/program.

Reducing false positives often requires feature quality improvements and policy tuning.

---

## 13.5 Threat Intelligence and Cyber Programs

Fraud prevention needs constant adaptation:

- threat intel sharing,
- attack pattern monitoring,
- red-team simulations,
- incident runbooks.

---

## 13.6 Common Mistakes

1. Static rules with no feedback loop.
2. No segmented strategy by channel/product.
3. Poor post-incident learning discipline.

---

## 13.7 Glossary

- **False positive:** Good transaction flagged as fraud.
- **False negative:** Fraudulent transaction allowed.
- **Velocity check:** Control on number/value of transactions over time.
- **Risk scoring:** Numerical estimate of fraud likelihood.

---

## 13.8 Resources

- Visa risk resources: https://usa.visa.com/run-your-business/small-business-tools/payment-security.html
- NIST cybersecurity guidance: https://www.nist.gov/cyberframework

---

## 13.9 Recap

- Fraud control is multi-layer and continuously evolving.
- Approval and fraud metrics must be jointly managed.
- Operational readiness is as important as model accuracy.

Next: Compliance and Standards.

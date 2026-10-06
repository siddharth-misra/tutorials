# 14: Compliance and Standards

Payments run inside a dense web of technical standards, security obligations, and financial-crime controls. Teams that treat compliance as a separate legal exercise usually discover too late that requirements like PCI DSS, EMV, 3DS, AML, sanctions, and KYC shape architecture, logging, access control, and release processes from the start.

This chapter explains the main standards in practical terms so you can see what each one is trying to protect and where engineering teams actually feel the impact. The useful framing is to connect policy language to real system design and operational behavior.

---

## 14.1 Why Compliance Is Foundational

In payments, compliance is not a checklist after launch. It is part of architecture, operations, and product decisions.

---

## 14.2 PCI DSS Essentials

PCI DSS defines security requirements for handling cardholder data.

Core themes:

- data protection,
- access control,
- vulnerability management,
- logging and monitoring,
- security testing.

---

## 14.3 EMV and 3DS in Compliance Context

- **EMV:** Secure card-present standards.
- **3DS:** Additional authentication framework for many online transactions.

Both influence fraud liability and risk posture.

---

## 14.4 AML, KYC, Sanctions Basics

- **AML:** Anti-Money Laundering controls.
- **KYC:** Know Your Customer identity verification.
- **Sanctions screening:** Prevent prohibited transactions/entities.

These controls are essential in onboarding and ongoing monitoring.

---

## 14.5 Privacy and Data Residency

Organizations must manage:

- lawful data processing,
- retention limits,
- cross-border data transfer rules,
- data localization requirements in some jurisdictions.

---

## 14.6 Secure Engineering Practices

Use engineering controls early:

- threat modeling,
- secure SDLC,
- secret management,
- dependency governance,
- least-privilege access.

OWASP guidance is useful baseline for application security.

---

## 14.7 Common Mistakes

1. Treating compliance as only legal team's job.
2. Late security design causing expensive rework.
3. Missing evidence collection for audits.

---

## 14.8 Glossary

- **PCI DSS:** Payment Card Industry Data Security Standard.
- **AML:** Anti-Money Laundering.
- **KYC:** Know Your Customer.
- **OWASP:** Open Worldwide Application Security Project.
- **Least privilege:** Granting only minimal necessary access.

---

## 14.9 Resources

- PCI SSC: https://www.pcisecuritystandards.org/
- FATF AML guidance: https://www.fatf-gafi.org/
- OWASP: https://owasp.org/

---

## 14.10 Recap

- Compliance requirements directly shape system design.
- PCI, EMV, 3DS, AML/KYC, and privacy controls are interconnected.
- Secure engineering and audit evidence discipline are critical.

Next: Disputes and Chargebacks.

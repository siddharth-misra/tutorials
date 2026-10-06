# 4: Pismo and Issuer Processing Platforms

For an issuer, the card network is only one layer of the stack. The systems that hold accounts, post transactions, manage card lifecycle events, apply limits, and expose APIs to banks or fintech apps usually sit on an issuer processing platform.

Modern platforms such as Pismo matter because they turn complex banking operations into configurable product and ledger capabilities. This chapter explains what issuer processors actually do, how cloud-native platforms change delivery speed, and why ledger correctness matters more than front-end polish in payment systems.

---

## 4.1 What Is Issuer Processing?

Issuer processing is the software and operations layer that helps an issuer run card and account programs.

It powers:

- card issuance,
- transaction decisioning,
- balance and limit checks,
- posting and statements,
- dispute and operations workflows.

---

## 4.2 Why Platforms Like Pismo Matter

Traditional core systems can be rigid and slow to change.

Cloud-native platforms aim to provide:

- faster product launch,
- API-first integration,
- real-time controls,
- scalable event-driven architecture,
- multi-tenant operating efficiency.

This supports digital banks, fintechs, and incumbents modernizing legacy stacks.

---

## 4.3 Core Capabilities of Issuer Platforms

1. **Program configuration:** BIN/product setup, fees, rewards, limits.
2. **Card lifecycle:** Create, activate, replace, block, reissue.
3. **Authorization controls:** Velocity checks, MCC rules, channel rules.
4. **Ledger posting:** Hold, capture, post, reverse, adjust.
5. **Customer servicing:** Statements, notifications, support actions.

---

## 4.4 Product Configuration in Practice

A platform should let teams configure products without deep code rewrites.

Examples:

- domestic vs international usage controls,
- ATM withdrawal limits,
- installment eligibility,
- per-card spend limits,
- card-on-file policy options.

The better the configuration model, the faster experimentation can happen safely.

---

## 4.5 Card and Account Lifecycle

Lifecycle events include:

- card ordered,
- card activated,
- PIN set,
- card temporarily blocked/unblocked,
- card replaced for lost/stolen,
- account closed or migrated.

Each event must be auditable and synchronized with network and ledger states.

---

## 4.6 Limits and Spend Controls

Good issuer platforms provide layered controls:

- per-transaction limits,
- daily/weekly/monthly limits,
- channel limits (e-commerce, ATM, POS),
- geography restrictions,
- merchant category restrictions.

Controls are central to fraud prevention and customer trust.

---

## 4.7 Authorization Decisioning Path

A simplified path:

1. Request arrives from network.
2. Platform validates account/card status.
3. Risk checks and business rules execute.
4. Available funds/credit assessed.
5. Approve/decline returned.

Low latency and consistent logic are critical.

---

## 4.8 Processor vs Issuer Responsibilities

- **Issuer:** Owns customer relationship, policy, final risk appetite.
- **Processor platform:** Provides technology and operations to execute issuer policy.

Clear ownership avoids compliance and incident confusion.

---

## 4.9 Common Mistakes

1. Treating platform migration as only a tech project, not an operating model change.
2. Weak reconciliation design between processor and issuer GL.
3. Too many hardcoded rules with poor governance.
4. Missing audit trails for control changes.

---

## 4.10 Glossary

- **BIN:** Bank Identification Number range tied to card program.
- **GL:** General Ledger.
- **MCC:** Merchant Category Code.
- **API-first:** Platform exposed primarily through robust APIs.
- **Multi-tenant:** One platform serving multiple clients with isolation.

---

## 4.11 Resources

- Visa issuer insights: https://usa.visa.com/partner-with-us/info-for-partners/issuers.html
- Pismo (overview): https://www.pismo.io/

---

## 4.12 Recap

- Issuer processing platforms run critical card/account operations.
- Cloud-native models improve speed, control, and scalability.
- Configuration, lifecycle, and decision controls are core platform strengths.

Next: Core Card Products.

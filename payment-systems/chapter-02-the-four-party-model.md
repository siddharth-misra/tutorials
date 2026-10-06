# 2: The Four-Party Model

The four-party model is the operating pattern that lets card payments scale across millions of merchants and thousands of financial institutions without every participant building direct bilateral connections. It separates customer ownership, merchant acceptance, and network connectivity into distinct roles that can be standardized and reused.

If you understand who owns the account, who serves the merchant, who makes the approval decision, and where VISA sits in the middle, later topics like interchange, disputes, tokenization, and fraud become much easier to follow. This chapter explains the model as a system for coordinating data flow, risk allocation, and money movement.

---

## 2.1 Why the Four-Party Model Matters

The four-party model is the foundation of card payments at scale.

Without this model, each merchant would need direct technical and legal integrations with many issuers. That would be slow, expensive, and hard to operate globally.

The four-party model solves that by standardizing interactions through a network.

It gives you:

- predictable message formats,
- common operating rules,
- shared dispute and liability frameworks,
- and broad interoperability.

If you understand this model early, all later topics become easier: fees, fraud, chargebacks, tokenization, and modern wallet flows.

---

## 2.2 The Four Parties (Plain English)

In a standard card transaction, four core business entities are involved.

1. **Cardholder:** Person or business making a purchase.
2. **Merchant:** Seller accepting payment.
3. **Issuer (Issuing Bank):** Financial institution that gave the card/account to the cardholder.
4. **Acquirer (Acquiring Bank):** Financial institution that supports the merchant in accepting card payments.

VISA is the network layer connecting issuer and acquirer side participants, but the core economic and account relationships sit with those four parties.

Important beginner point:

- The cardholder relationship is usually with the issuer.
- The merchant relationship is usually with the acquirer/PSP stack.
- VISA enables standardized connectivity between those sides.

---

## 2.3 Transaction Journey: Message Flow First

Before money moves, **messages** move.

Most card transactions start with an authorization request.

Typical flow:

1. Cardholder presents card details to merchant.
2. Merchant sends payment request to gateway/processor.
3. Merchant processor routes request to acquirer.
4. Acquirer sends standardized request through VISA network.
5. VISA routes to the issuer (or issuer processor).
6. Issuer makes approve/decline decision.
7. Response goes back through VISA to acquirer to merchant.
8. Merchant completes or rejects checkout based on response.

This stage is usually real-time and latency-sensitive.

Beginner-friendly framing:

- Authorization is a permission decision, not final money movement.
- Finalized funds movement is handled later through clearing and settlement.

---

## 2.4 Responsibility Map: Who Owns What

The model works because each party has distinct responsibilities.

### Cardholder responsibilities

- Keep credentials reasonably secure.
- Report fraud or errors quickly.
- Follow account terms with issuer.

### Merchant responsibilities

- Capture payment data correctly and securely.
- Use compliant acceptance methods.
- Deliver goods/services and retain proof when needed.

### Issuer responsibilities

- Perform risk checks and authorization decisioning.
- Manage cardholder account, limits, and available funds/credit.
- Handle cardholder billing and many dispute interactions.

### Acquirer responsibilities

- Onboard and monitor merchants.
- Provide merchant acceptance connectivity.
- Manage merchant risk, settlement, and compliance expectations.

### VISA responsibilities (network + scheme)

- Route messages between parties.
- Define and enforce network operating standards.
- Support clearing and settlement frameworks.
- Provide rulebooks for disputes, fraud controls, and exception handling.

No single participant does everything. This separation is intentional and essential for scale.

---

## 2.5 Risk Flow: Where Risk Actually Sits

Beginners often ask: "Who takes the risk?"

Answer: risk is split across participants and depends on context.

Examples:

- **Issuer risk:** Credit risk (for credit products), account fraud exposure, and authorization decision quality.
- **Merchant risk:** Fraudulent orders, fulfillment risk, refund/chargeback risk, and operational errors.
- **Acquirer risk:** Merchant portfolio risk and merchant-side compliance risk.
- **Network risk (VISA):** Systemic network integrity and rule enforcement, not direct lending risk in the way issuers hold it.

Liability can shift based on transaction type, authentication quality, regional rules, and compliance posture (for example EMV and 3DS contexts covered in later chapters).

---

## 2.6 Data Flow: What Data Moves and Why

Card payments involve structured data flowing across the model.

Common data categories:

- card credential references,
- merchant identifier and terminal/channel context,
- amount, currency, and timestamp,
- risk and authentication indicators,
- authorization result and response codes.

Important beginner note:

- Not every participant sees every piece of data in the same way.
- Data handling is governed by standards, contracts, and regulations.

Data minimization and secure handling are crucial in payment systems. You will study this deeper in compliance and security chapters.

---

## 2.7 Money Flow: From Authorization to Settlement

Authorization says "approved" or "declined," but that does not by itself finish final financial movement.

The broad financial sequence:

1. Authorization request/response (real-time decision).
2. Clearing data exchange (transaction finalization records).
3. Settlement obligations calculated and processed between institutions.
4. Merchant funding and cardholder posting reflected in account systems.

Timing differs by product, geography, merchant agreement, and institution operating model.

This is why a cardholder might see:

- a temporary hold first,
- final posted transaction later,
- and sometimes adjustments if reversals or corrections happen.

---

## 2.8 VISA's Exact Role Across the Lifecycle

This section answers a common interview-style question directly.

### In authorization

VISA provides network routing and message standards so issuer decisions can be requested and returned reliably at scale.

### In clearing

VISA supports standardized exchange of finalized transaction records that institutions use for reconciliation and obligations.

### In settlement

VISA supports settlement frameworks and processes that facilitate obligations between participating institutions, under network rules.

### In rules/governance

VISA defines operating standards, participation requirements, dispute frameworks, and compliance expectations across the network ecosystem.

Simple way to remember:

- VISA is the standardized network-and-rules layer.
- Issuers/acquirers and their processors execute many account- and merchant-facing operations around that layer.

---

## 2.9 Where Processors and PSPs Fit Around the Model

The four-party model explains core economic relationships. Real-world implementations add technology intermediaries.

- **Processor:** Operates payment technology flows on behalf of issuer or acquirer/merchant side.
- **PSP (Payment Service Provider):** Merchant-facing provider that can bundle gateway, processing, risk, and orchestration.

These entities do not remove the core four-party economics. They make implementation and operations practical.

You will break this down in detail in Chapter 3 and Chapter 4.

---

## 2.10 Common Mistakes Beginners Make

1. Thinking authorization means final settlement is complete.
2. Assuming VISA always makes the approve/decline decision.
3. Assuming acquirer and processor are always the same legal entity.
4. Ignoring risk distribution across participants.
5. Treating "payment success" as only a checkout event, not an end-to-end lifecycle.

---

## 2.11 Abbreviations and Jargon (Plain English)

- **3DS (3-D Secure):** Additional authentication protocol used in many online card flows.
- **Acquirer:** Institution serving the merchant for card acceptance.
- **Authorization:** Real-time response of approve/decline from issuer side.
- **Clearing:** Exchange of finalized transaction records after authorization.
- **EMV (Europay, Mastercard, and Visa):** Global chip-card standard for secure card-present payments.
- **Issuer:** Institution that issued the card/account to the cardholder.
- **PSP (Payment Service Provider):** Merchant-side provider bundling acceptance capabilities.
- **Scheme:** Network and associated operating rules framework.
- **Settlement:** Financial obligation fulfillment between institutions after clearing.
- **Stand-in processing:** Network-level fallback behavior in specific outage/failure scenarios (covered later).

---

## 2.12 Suggested External Resources

Official and standards-oriented references for deeper reading:

- VISA corporate and product context:
  https://usa.visa.com/
- VISA investor and business reporting:
  https://investor.visa.com/
- EMV specifications overview:
  https://www.emvco.com/
- PCI Security Standards Council:
  https://www.pcisecuritystandards.org/

Read these with one question in mind:

"Which participant owns this responsibility in the four-party model?"

---

## 2.13 Recap

- The four-party model separates core roles: cardholder, merchant, issuer, and acquirer.
- Authorization is a real-time decision stage, not final settlement.
- Risk, data, and money do not move in the same way or at the same time.
- VISA's role is network routing, standards, lifecycle support, and rule governance.
- Processors and PSPs operationalize the model, but do not replace its core structure.

Next: Merchant Acquiring, Gateways, and Processors.
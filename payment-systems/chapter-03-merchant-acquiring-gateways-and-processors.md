# 3: Merchant Acquiring, Gateways, and Processors

A successful card payment on the merchant side depends on more than one company. What looks like a single checkout experience is usually a chain of gateway, PSP, processor, acquirer, fraud tools, and network connectivity working together behind the scenes.

Industry conversations often use these terms loosely, which makes it easy to blur commercial roles, legal entities, and technical components. This chapter separates those layers so you can see who integrates with whom, who owns merchant risk, and where VISA's responsibilities stop.

---

## 3.1 Why This Layer Matters

When customers click "Pay," the merchant needs a chain of systems to collect payment details, run checks, route messages, and get paid.

This chain is called the merchant acceptance stack.

---

## 3.2 Key Actors on Merchant Side

1. **Merchant:** Sells goods/services.
2. **Payment Gateway:** Securely captures and transmits payment data from checkout.
3. **Processor:** Executes payment transaction operations.
4. **Acquirer:** Financial institution enabling card acceptance and merchant settlement.
5. **PSP (Payment Service Provider):** Bundles gateway + processing + risk + reporting in one package.

In practice, one company may play multiple roles.

---

## 3.3 In-Store Stack vs E-commerce Stack

### In-store (card-present)

- POS terminal reads chip/contactless/magstripe.
- Terminal software formats transaction request.
- Merchant processor/acquirer routes to network.

### E-commerce (card-not-present)

- Checkout form or SDK captures card details/token.
- Gateway sends request to processor/acquirer.
- Extra fraud and authentication steps (like 3DS) are common.

Card-not-present flows have higher fraud risk, so controls are stricter.

---

## 3.4 Acquirer Responsibilities

- Merchant onboarding and underwriting.
- Pricing and contract management.
- Transaction routing to card networks.
- Merchant funding and settlement operations.
- Chargeback coordination with merchant.

Acquirers manage merchant portfolio risk, not only technical connectivity.

---

## 3.5 Gateway Responsibilities

- Collect and encrypt payment data.
- Provide API/hosted checkout integrations.
- Tokenize card details for merchant storage reduction.
- Send payment request to processor.
- Return approval/decline response to checkout.

Gateway is primarily an integration and secure transport layer.

---

## 3.6 Processor Responsibilities

- Normalize transaction formats.
- Route to acquirer/network/issuer paths.
- Handle retries, reversals, and response mapping.
- Produce operational logs and reconciliation files.
- Support dispute and exception workflows.

Processors are the high-throughput operations engine.

---

## 3.7 Where VISA Stops

VISA provides network rails, standards, and scheme rules between acquirer and issuer sides.

VISA generally does **not**:

- build the merchant checkout UI,
- run every merchant gateway,
- onboard each merchant directly,
- or own each merchant settlement account.

This boundary helps avoid role confusion in architecture decisions.

---

## 3.8 Common Integration Patterns

1. **Direct-to-PSP:** Fastest launch for most startups.
2. **Gateway + separate acquirer:** More pricing/control flexibility.
3. **Multi-PSP orchestration:** Better resilience and routing optimization.

Trade-off is always speed vs control vs complexity.

---

## 3.9 Common Mistakes

1. Treating gateway and acquirer as identical.
2. Ignoring settlement and reconciliation during checkout design.
3. No fallback route when one processor is degraded.
4. Poor decline-code handling in user experience.

---

## 3.10 Glossary

- **POS:** Point of Sale terminal.
- **Card-present:** In-store payment where card/device is physically present.
- **Card-not-present (CNP):** Online/mobile payment without physical card presentation.
- **Underwriting:** Risk evaluation before approving a merchant.
- **Orchestration:** Dynamic routing across multiple payment providers.

---

## 3.11 Resources

- Visa merchant resources: https://usa.visa.com/run-your-business.html
- PCI SSC standards: https://www.pcisecuritystandards.org/

---

## 3.12 Recap

- Merchant acceptance requires multiple specialized layers.
- Gateway, processor, and acquirer have different responsibilities.
- VISA provides network interoperability but not full merchant stack ownership.

Next: Pismo and Issuer Processing Platforms.

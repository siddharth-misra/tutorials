# 7: Transaction Economics

Every card transaction creates a chain of economic transfers rather than one simple fee. The merchant pays for acceptance, the issuer earns part of that flow, the network charges for operating the rails, and processors or PSPs may take their own share for technology and operations.

Because several participants are paid for different functions, payment costs are easy to oversimplify. This chapter breaks the stack apart so you can distinguish interchange from network fees, understand merchant discount rate, and reason about why pricing changes across products, geographies, and channels.

---

## 7.1 Why Economics Matter

Technical flows and business viability are tightly linked.

Small basis-point changes can materially affect margin at scale.

---

## 7.2 Key Fee Components

1. **Interchange:** Typically flows to issuer side.
2. **Scheme/assessment fees:** Network-related fees.
3. **Processor/PSP fees:** Technology and operations fees.
4. **Acquirer markup:** Commercial spread and service fees.

These components together influence merchant cost.

---

## 7.3 Merchant Discount Rate (MDR)

**MDR** is the overall percentage/fee merchant pays for acceptance.

MDR is not one single actor's revenue. It is a bundle of components.

---

## 7.4 Example (Conceptual)

For a transaction of 100 units:

- Interchange: 1.40
- Scheme/network: 0.15
- Processor + acquirer + PSP components: 0.45

Total acceptance cost: 2.00 (illustrative only)

Actual values vary by region, MCC, card type, and agreement terms.

---

## 7.5 Revenue Lenses by Participant

- **Issuer:** Interchange + cardholder-side economics.
- **Acquirer/PSP/processor:** Service and processing fees.
- **VISA/network:** Scheme and data processing/value-added revenues.
- **Merchant:** Higher conversion and sales, minus acceptance cost.

---

## 7.6 Cross-Border and Premium Impacts

Cross-border transactions and premium products can change fee structure and risk assumptions.

Additional factors:

- FX costs,
- fraud risk profile,
- regulatory caps in specific markets.

---

## 7.7 Optimization Levers

1. Better auth rates (fewer false declines).
2. Smart routing/orchestration.
3. Fraud reduction without blocking good traffic.
4. Product/channel-specific pricing strategy.

Economics optimization must not weaken compliance or customer trust.

---

## 7.8 Common Mistakes

1. Treating MDR as "VISA fee."
2. Optimizing only one metric (for example approval rate) while harming fraud losses.
3. Ignoring reconciliation leakage and operational chargeback costs.

---

## 7.9 Glossary

- **MDR:** Merchant Discount Rate.
- **Basis point (bps):** One hundredth of one percent (0.01%).
- **FX:** Foreign exchange.
- **Assessment:** Network-level fee category.

---

## 7.10 Resources

- Visa investor materials: https://investor.visa.com/
- ECB card payments statistics (regional context): https://www.ecb.europa.eu/

---

## 7.11 Recap

- Card economics is multi-party and multi-component.
- Interchange and scheme fees are different.
- Good economics strategy balances growth, risk, and reliability.

Next: Transaction Lifecycle Deep Dive.

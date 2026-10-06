# 11: Real-Time Payments, BNPL, and Emerging Consumer Flows

Consumer payment behavior is expanding beyond classic card-present and card-not-present flows. Real-time account-to-account systems, buy now pay later products, super apps, and wallet-centric experiences each change where approval happens, how funding works, and what the user expects.

This chapter compares these newer flows with traditional card models so you can see what is actually different and what infrastructure is still being reused. It treats these models as design trade-offs, not as automatic replacements for cards, which is the only useful way to reason about where each one fits.

---

## 11.1 Why New Flows Matter

Consumers increasingly expect instant, contextual, and embedded payment experiences.

This shifts product strategy from "card at checkout" to "best journey for context."

---

## 11.2 Real-Time Payments (RTP)

Real-time payment systems focus on near-instant transfer and confirmation.

Key implications:

- faster funds availability,
- different fraud windows,
- stronger need for real-time risk controls.

---

## 11.3 BNPL Models

BNPL (Buy Now, Pay Later) allows installment-based consumer payment experiences.

Common components:

- instant eligibility checks,
- transparent installment plans,
- merchant-funded or consumer-funded economics.

BNPL requires careful lending/compliance governance.

---

## 11.4 Wallet-First Journeys

Wallet-first means the wallet becomes primary payment interface.

Benefits:

- quick checkout,
- tokenized security,
- cross-merchant consistency.

---

## 11.5 Account-to-Account (A2A) Flows

A2A moves funds directly between bank accounts without traditional card rails for selected use cases.

Trade-offs vary by market:

- lower costs in some scenarios,
- variable consumer protections,
- onboarding and mandate complexity.

---

## 11.6 Embedded Checkout

Payments are increasingly integrated into non-financial apps and platforms.

Examples:

- ride-hailing,
- food delivery,
- marketplace payouts,
- subscription ecosystems.

---

## 11.7 Common Mistakes

1. Assuming one payment method fits every customer segment.
2. Launching BNPL without lifecycle risk controls.
3. Ignoring operational impacts of instant payment expectations.

---

## 11.8 Glossary

- **RTP:** Real-Time Payments.
- **BNPL:** Buy Now, Pay Later.
- **A2A:** Account to Account transfer.
- **Embedded finance:** Financial services integrated into non-financial products.

---

## 11.9 Resources

- BIS fast payments resources: https://www.bis.org/
- Visa innovation pages: https://usa.visa.com/visa-everywhere.html

---

## 11.10 Recap

- Payment experiences are diversifying quickly.
- Real-time and installment models create new risk/ops demands.
- Platform teams must design by use case, not by one default rail.

Next: Tokenization.

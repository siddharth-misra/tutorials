# 10: Online and Mobile Payments

Online and mobile payments move the payment experience away from a physical terminal and into apps, browsers, wallets, and merchant-managed credential stores. That shift increases convenience, but it also creates new dependency layers around authentication, tokenization, device trust, and checkout orchestration.

This chapter explains the major digital payment models so you can separate wallet experiences from the underlying credential rails. It also clarifies how click-to-pay, stored cards, and in-app payment flows reduce friction while introducing new security and conversion trade-offs.

---

## 10.1 Digital Checkout Reality

Online conversion depends on speed, trust, and low friction.

Teams must balance:

- fewer checkout steps,
- stronger fraud controls,
- privacy and compliance obligations.

---

## 10.2 Click to Pay

Click to Pay is a streamlined online checkout approach designed to reduce manual card entry friction.

Benefits:

- smoother repeat purchase flows,
- potentially better conversion,
- reduced direct handling of raw card details in some models.

---

## 10.3 Mobile Wallet Integrations

Common integrations include Apple Pay, Google Pay, and Samsung Pay.

Wallet flows commonly use tokenized credentials and device-level security.

Merchant gains:

- faster checkout,
- improved user trust,
- reduced sensitive data exposure patterns.

---

## 10.4 Card-on-File and Credential-on-File

- **Card-on-file:** Merchant stores card credentials/token for future use.
- **Credential-on-file (COF):** Broader framework for recurring, merchant-initiated, and customer-initiated stored credential usage.

COF flows need clear consent and robust lifecycle handling.

---

## 10.5 Key E-commerce Architecture Decisions

1. Hosted checkout vs direct API integration.
2. Single PSP vs multi-PSP routing.
3. Risk engine strategy and 3DS orchestration.
4. Token vault ownership model.

---

## 10.6 Common Mistakes

1. Over-optimizing friction and increasing fraud.
2. Poor retry UX causing duplicate attempts.
3. Missing stored credential consent governance.
4. No wallet-specific observability dashboards.

---

## 10.7 Glossary

- **COF:** Credential on file.
- **MIT:** Merchant Initiated Transaction.
- **CIT:** Customer Initiated Transaction.
- **Token vault:** Secure store for tokenized payment credentials.

---

## 10.8 Resources

- Visa Click to Pay: https://usa.visa.com/pay-with-visa/featured-technologies/click-to-pay.html
- Apple Pay (merchant): https://developer.apple.com/apple-pay/
- Google Pay API docs: https://developers.google.com/pay

---

## 10.9 Recap

- Digital acceptance requires balancing conversion and security.
- Wallet and tokenized flows reduce raw credential exposure.
- COF governance is central for recurring and one-click models.

Next: Real-Time Payments, BNPL, and Emerging Consumer Flows.

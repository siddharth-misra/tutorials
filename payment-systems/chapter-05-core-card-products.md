# 5: Core Card Products

Cards may look similar in a wallet, but the product type behind them changes how money is funded, when balances are updated, what controls apply, and who carries the primary financial risk. Credit, debit, prepaid, commercial, and virtual cards solve different problems even when they ride the same network.

Understanding these product shapes is essential before you evaluate economics, fraud controls, settlement timing, or platform design. This chapter explains the practical differences so you can connect each product to its funding model, user experience, and operational constraints.

---

## 5.1 Why Product Type Matters

Not all cards behave the same. Product type affects:

- risk model,
- authorization logic,
- settlement behavior,
- customer expectations,
- compliance obligations.

---

## 5.2 Credit Cards

Issuer extends a credit line to cardholder.

Characteristics:

- revolving balance possible,
- billing cycles and interest,
- richer rewards in many markets,
- issuer credit risk is central.

---

## 5.3 Debit Cards

Payments draw from deposit account balance.

Characteristics:

- lower credit exposure,
- strong real-time balance checks,
- frequent daily-use transactions.

---

## 5.4 Prepaid Cards

Spending is generally limited to preloaded value.

Use cases:

- payroll,
- travel,
- gifting,
- youth/student programs,
- controlled spend programs.

---

## 5.5 Commercial Cards

Business-focused card products for companies and institutions.

Examples:

- corporate travel cards,
- purchasing cards,
- virtual cards for procurement/AP automation.

Often include richer controls and reporting.

---

## 5.6 Virtual Cards

Digitally generated card credentials, usually for safer online or one-time use.

Benefits:

- reduced exposure of primary credentials,
- merchant- or amount-bound controls,
- strong fit for e-commerce and B2B payables.

---

## 5.7 Credential Components

Common card credential elements:

- PAN (Primary Account Number),
- expiry date,
- card verification value,
- tokenized variants for digital channels.

Modern systems increasingly rely on tokenization for security.

---

## 5.8 Funding Source Mapping

- Credit card -> credit line.
- Debit card -> deposit account.
- Prepaid card -> prefunded stored value account.
- Commercial card -> company credit or linked business funding model.

Funding model drives risk and reconciliation behavior.

---

## 5.9 Common Mistakes

1. Applying consumer card assumptions to commercial programs.
2. Ignoring limit/control differences between prepaid and debit.
3. Storing raw credentials unnecessarily instead of tokens.

---

## 5.10 Glossary

- **PAN:** Primary Account Number.
- **CVV/CVC:** Card verification code.
- **Stored value:** Prefunded balance used for transactions.
- **AP (Accounts Payable):** Function responsible for paying suppliers.

---

## 5.11 Resources

- Visa products overview: https://usa.visa.com/pay-with-visa/cards.html
- Visa business solutions: https://usa.visa.com/business.html

---

## 5.12 Recap

- Card products differ by funding source, risk, and control model.
- Virtual and tokenized credentials are increasingly important.
- Product choices shape downstream operations and economics.

Next: Issuer Accounts, Ledger, and Balances.

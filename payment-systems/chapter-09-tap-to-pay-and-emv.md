# 9: Tap to Pay and EMV

Tap to pay feels instant to the customer, but it depends on EMV standards that were designed to reduce fraud and make card-present payments more trustworthy. The card, terminal, cryptographic data, and fallback rules all work together to decide whether a transaction can be treated as genuine.

This chapter explains EMV from the perspective of real payment behavior rather than standards jargon. You will see why chips changed fraud patterns, how contactless transactions differ from magstripe-era flows, and why fallback handling is a security concern instead of just a user-experience detail.

---

## 9.1 Contactless in Context

Tap to Pay improves speed and checkout convenience while preserving strong cryptographic security models.

Growth drivers:

- faster queue throughput,
- improved user experience,
- lower physical wear than magstripe,
- broad terminal support.

---

## 9.2 EMV Basics

**EMV** is a global chip-card standard used for secure card-present transactions.

Core idea: each transaction can include dynamic cryptographic data, reducing usefulness of copied credentials.

---

## 9.3 Tap Flow (Simplified)

1. Card/device enters NFC range.
2. Terminal and card exchange EMV data.
3. Merchant stack sends authorization request.
4. Issuer approves/declines.
5. Terminal displays result.

The visible tap is quick, but several security checks run in background.

---

## 9.4 Card Present vs Card Not Present Risk

- Card-present EMV transactions generally have lower fraud than many CNP transactions.
- CNP flows rely more on digital authentication and fraud scoring controls.

Risk posture depends on channel behavior, not only card brand.

---

## 9.5 Fallback Scenarios

Fallback means moving to alternative acceptance path when preferred method fails.

Examples:

- chip read failure leading to alternate method,
- contactless disabled on terminal.

Fallback should be monitored because abuse can indicate fraud pressure.

---

## 9.6 Terminal and Certification Considerations

Payment terminals and software need standards compliance and certification.

Operational controls include:

- key management,
- firmware updates,
- tamper protections,
- periodic compliance checks.

---

## 9.7 Common Mistakes

1. Assuming contactless means weaker security.
2. Ignoring fallback trend monitoring.
3. Poor terminal lifecycle governance.

---

## 9.8 Glossary

- **EMV:** Europay, Mastercard, and Visa chip standard.
- **NFC:** Near Field Communication used for tap interactions.
- **Fallback:** Alternate processing path when primary method fails.
- **Cryptogram:** Transaction-specific cryptographic value.

---

## 9.9 Resources

- EMVCo: https://www.emvco.com/
- Visa contactless overview: https://usa.visa.com/pay-with-visa/contactless-payments.html

---

## 9.10 Recap

- Contactless combines speed and strong security controls.
- EMV dynamic data is central to fraud reduction.
- Fallback management is an important risk signal.

Next: Online and Mobile Payments.

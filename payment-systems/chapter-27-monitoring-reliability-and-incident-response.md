# 27: Monitoring, Reliability, and Incident Response

Real-time payment systems are judged continuously in production. If latency climbs, approval rates drop, or downstream dependencies degrade, the impact shows up immediately in customer experience and business metrics.

This chapter explains how teams detect problems early, measure service health meaningfully, and respond without creating more damage. It treats observability, SLOs, and incident response as connected disciplines rather than separate operational tasks.

---

## 27.1 Observability Pillars

1. Metrics
2. Logs
3. Traces

Together, they provide fast diagnosis and better prevention.

---

## 27.2 What to Monitor in Payments

- authorization latency and success rates,
- decline reason distributions,
- reversal and duplicate patterns,
- settlement/reconciliation lag,
- system saturation signals.

Business and technical metrics should be correlated.

---

## 27.3 Alerting Strategy

Good alerting is:

- actionable,
- severity-based,
- low-noise,
- tied to runbooks.

Noisy alerts create incident fatigue.

---

## 27.4 Incident Response Lifecycle

1. Detect
2. Triage
3. Contain
4. Recover
5. Communicate
6. Learn (postmortem)

Clear role ownership reduces confusion under pressure.

---

## 27.5 SLOs and Error Budgets

- **SLO:** Reliability target for key service behavior.
- **Error budget:** Allowed unreliability window before stricter release controls kick in.

This framework aligns engineering and product trade-offs.

---

## 27.6 Postmortem Discipline

Effective postmortems are:

- blameless,
- root-cause focused,
- action-oriented,
- followed by verified remediation.

---

## 27.7 Common Mistakes

1. Monitoring infrastructure metrics only, ignoring payment-domain metrics.
2. No clear incident commander model.
3. Postmortems without ownership and deadlines.

---

## 27.8 Glossary

- **SLO:** Service Level Objective.
- **Error budget:** Permitted reliability shortfall for a period.
- **Runbook:** Step-by-step operational response guide.
- **MTTR:** Mean Time To Recovery.

---

## 27.9 Resources

- OpenTelemetry: https://opentelemetry.io/
- SRE workbook: https://sre.google/workbook/

---

## 27.10 Recap

- Monitoring must reflect both system health and payment outcomes.
- Incident response needs structure, rehearsals, and communication discipline.
- SLO-driven operations improves long-term reliability decisions.

Next: Squad Leadership and Execution.

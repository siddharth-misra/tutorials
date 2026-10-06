# 21: Network Scale and Reliability

In payments, reliability is a product feature, not just an infrastructure metric. A few seconds of downtime or elevated latency can translate directly into failed purchases, duplicate retries, customer distrust, and operational incidents across many institutions at once.

This chapter explains what scale and reliability mean in the context of a global payment network. It connects throughput, latency, resilience, and fault isolation to the business expectation that payment systems must be available nearly all the time.

---

## 21.1 Reliability Is Product Quality

For payment systems, downtime is not only technical failure. It is failed commerce and lost trust.

---

## 21.2 Key Reliability Metrics

- **Latency:** Response time.
- **Uptime/availability:** Time service is operational.
- **Throughput:** Transaction volume processed over time.
- **Error rate:** Fraction of failed requests.

Metrics must be measured per region/channel/path.

---

## 21.3 Resilience Architecture Patterns

1. Multi-region infrastructure strategy.
2. Active-active or active-standby patterns.
3. Automated failover controls.
4. Capacity headroom and load shedding.

---

## 21.4 Fault Tolerance and Redundancy

Design for component failure by default:

- redundant network paths,
- replicated state where appropriate,
- queue-based decoupling,
- graceful degradation modes.

---

## 21.5 Stand-In Capability

Stand-in support can preserve partial service continuity during upstream disruption.

It should be governed by strict rules and monitoring.

---

## 21.6 Disaster Recovery

Recovery strategy is defined by:

- RTO (Recovery Time Objective),
- RPO (Recovery Point Objective),
- tested failover runbooks.

Unrehearsed DR plans are operational risk.

---

## 21.7 Common Mistakes

1. High average latency hiding tail latency spikes.
2. Untested failover assumptions.
3. No chaos or game-day resilience testing.

---

## 21.8 Glossary

- **RTO:** Target time to recover service.
- **RPO:** Target acceptable data loss window.
- **Tail latency:** Slowest percentile response times (for example p99).
- **Graceful degradation:** Partial service during failures.

---

## 21.9 Resources

- Google SRE resources: https://sre.google/
- AWS reliability pillar: https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html

---

## 21.10 Recap

- Reliability is a business-critical capability in payments.
- Scale requires capacity, isolation, and disciplined recovery engineering.
- Tail latency and failover readiness are key maturity indicators.

Next: Payment Systems Engineering.

# 27: Backup and Disaster Recovery

Backups and disaster recovery are related, but they are not the same thing. A backup helps you restore data, while a disaster recovery plan helps you restore service after a major failure such as infrastructure loss, corruption, or regional disruption.

This chapter explains how to think about recovery in business terms instead of vague promises. You will learn why Recovery Point Objective (RPO) and Recovery Time Objective (RTO) guide design choices, and how AWS supports recovery patterns with different costs, speeds, and levels of complexity.

---

## 27.1 Why Backup and Disaster Recovery Matter

Failures are not theoretical.

Data can be deleted, encrypted by ransomware, overwritten by deployment mistakes, corrupted by application bugs, or lost through infrastructure failure. Entire regions are designed to be highly resilient, but serious regional disruptions and dependency failures still have to be planned for.

Backup and disaster recovery, often shortened to DR, exist to answer two hard questions:

- How much data can we afford to lose?
- How long can the service be unavailable?

If those questions are not answered explicitly, recovery design becomes guesswork.

Production teams often discover too late that they had backups but no realistic restore process, or that they had high availability in one region but no regional recovery plan at all.

---

## 27.2 Backups Versus High Availability Versus Disaster Recovery

These terms are related but not identical.

### Backup

A backup is a recoverable copy of data captured for restoration later.

### High availability

High availability keeps a service running through localized failure, usually within one region or across multiple Availability Zones.

### Disaster recovery

Disaster recovery restores service after a major failure that exceeds normal high-availability assumptions, such as regional disruption, destructive account compromise, or unrecoverable application or data damage.

This distinction matters because Multi-AZ alone is not a backup strategy, and backups alone do not provide fast recovery.

Architects must design across all three layers, not assume one of them covers the rest.

---

## 27.3 RPO and RTO

Two metrics drive most recovery design.

### Recovery Point Objective, or RPO

RPO defines how much data loss is acceptable.

If the RPO is 15 minutes, the business accepts losing up to 15 minutes of recent data in a disaster scenario.

### Recovery Time Objective, or RTO

RTO defines how long it can take to restore service.

If the RTO is 1 hour, the recovery plan must restore the service within that time window.

These values are not infrastructure trivia. They directly affect architecture, cost, and operational complexity.

- Lower RPO usually requires stronger replication or more frequent backups.
- Lower RTO usually requires pre-provisioned capacity and rehearsed failover.

When teams say they need near-zero loss and near-instant recovery, they are usually asking for one of the most expensive and complex recovery postures available.

---

## 27.4 AWS Backup Building Blocks

AWS provides multiple ways to protect data, including service-native backups and centralized backup management.

Important building blocks include:

- automated snapshots and backups for services such as RDS and EBS
- versioning and lifecycle controls for S3
- retention policies aligned to business and compliance needs
- cross-account or cross-region backup copy patterns for stronger isolation
- centralized backup policy management where appropriate

The design choice is not only about whether a service can create backups. It is about whether those backups are retained correctly, isolated sufficiently, and restorable under pressure.

Backup isolation is especially important. If an attacker compromises the same account and can delete backups, recovery confidence is weaker than it appears.

---

## 27.5 Restore Testing Is Part of the Backup Strategy

A backup that has never been restored is only an assumption.

Restore testing should verify:

- the backup exists where expected
- the restore process is documented and works
- dependencies such as KMS keys, networking, IAM, and DNS are understood
- restored data is usable by the application
- the team can complete the process inside the expected RTO

This is one of the most common maturity gaps in cloud environments. Teams pay for backups for years without proving that the restore path actually works.

Recovery design must be tested as an operational process, not only configured as a checkbox.

---

## 27.6 Disaster Recovery Patterns

![Disaster recovery spectrum comparing backup-restore, pilot light, warm standby, and active-active against RPO and RTO targets.](images/ch27-dr-strategy-spectrum.svg)

AWS recovery patterns usually fall into four broad levels.

### Backup and restore

This is the lowest-cost pattern. Data and configuration backups exist, but infrastructure is rebuilt after the failure. Recovery time is usually slower.

### Pilot light

Critical data and minimal core services exist in the recovery region, but most application capacity is scaled up only during failover.

### Warm standby

A reduced-capacity version of the workload already runs in the recovery region. Failover is faster, but cost is higher.

### Active-active or multi-site

Traffic and services run in more than one region at the same time. This provides the strongest posture for low RTO and low RPO, but it is also the most complex to design, test, and operate.

The architect's job is to match the pattern to business impact rather than chase the most advanced-sounding design.

---

## 27.7 Regional, Account, and Security Failure Scenarios

Good recovery planning considers more than hardware failure.

Important scenarios include:

- accidental deletion by an operator or pipeline
- application bugs that corrupt data logically
- ransomware or destructive credential compromise
- region-wide service disruption
- account compromise or misconfiguration that affects production resources and backups

These scenarios matter because the recovery design that handles one failure may not handle another.

For example:

- Multi-AZ protects against localized infrastructure failure but not malicious deletion.
- Same-account backups may not be sufficient for account compromise.
- Cross-region replication may replicate corruption as quickly as healthy data if no recovery checkpoint strategy exists.

Recovery architecture must be threat-aware, not only availability-aware.

---

## 27.8 Data Consistency and Application Dependencies

Restoring a system is often harder than restoring one database.

Applications usually depend on combinations of:

- databases
- object storage
- queues or streams
- secrets and configuration
- DNS and certificate configuration
- IAM roles and network controls

If those dependencies are not coordinated, the recovered system may come up in a broken or inconsistent state.

That is why disaster recovery planning often needs dependency maps and recovery order decisions. A restored application that points to the wrong queue, lacks the right secret, or depends on a stale DNS record is not truly recovered.

---

## 27.9 Solutions Architect Review Checklist

During design review, ask:

- What are the business RPO and RTO requirements for this workload?
- Which failure scenarios are in scope: AZ, region, data corruption, credential compromise, or all of them?
- Where are backups stored, and can attackers in the primary account destroy them?
- How often are restores tested?
- Which services or configuration dependencies must be recovered together?
- Does the planned recovery pattern match the actual cost tolerance and downtime tolerance of the business?

This review usually reveals whether recovery design is real or only aspirational.

---

## 27.10 Common Mistakes

- assuming Multi-AZ availability is the same as a backup strategy
- creating backups without ever testing restores
- defining RPO and RTO implicitly instead of agreeing on them with the business
- storing backups in ways that are vulnerable to the same account compromise or deletion path as production
- planning cross-region recovery without coordinating DNS, secrets, and application dependencies
- using replication alone as if it were protection against logical corruption or ransomware
- documenting DR steps once and never updating them after architecture changes
- choosing an advanced DR pattern whose cost and operational burden the team cannot sustain

---

## 27.11 Hands-On Tasks

1. Define RPO and RTO for a low-traffic internal reporting tool and for a revenue-generating production API.
2. Compare backup and restore, pilot light, warm standby, and active-active for one workload you know.
3. List the dependencies that would need to be recovered together for a three-tier web application.
4. Describe how you would test a restore for a database-backed service without waiting for a real outage.
5. Explain why same-account backups may be insufficient for certain threat models.

---

## 27.12 Recap

Backups, high availability, and disaster recovery serve different purposes and must be designed together. RPO and RTO define the acceptable loss and recovery window, and those targets determine which recovery pattern makes sense. In AWS, strong recovery design includes protected backups, restore testing, dependency-aware procedures, and clear trade-offs between speed, complexity, and cost.

Next: 28: Cost Optimization and Well-Architected Review

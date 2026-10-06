# 11: RDS and Aurora

Relational databases are still a common choice for applications that need structured data, transactions, and SQL. Amazon Relational Database Service (Amazon RDS) and Amazon Aurora let AWS manage much of the operational work, such as backups, patching, and failover, while you still make key design decisions.

This chapter explains where managed relational databases fit in AWS architecture. You will learn how they differ from running a database yourself on Amazon Elastic Compute Cloud (Amazon EC2), and why backups, read scaling, and Multi-Availability Zone design matter in production.

---

## 11.1 Why Managed Relational Databases Matter

Many business systems still depend on relational data.

They need:

- structured schemas
- transactional integrity
- SQL querying
- strong consistency for core workflows

You can run a relational database on EC2, but that puts responsibility for patching, backups, availability design, monitoring, and recovery on your team.

Amazon Relational Database Service, or Amazon RDS, reduces much of that operational burden by providing managed database infrastructure for several relational engines.

Amazon Aurora goes further with an AWS-built relational engine designed for cloud operational patterns and higher managed resilience characteristics.

The value is not that AWS makes databases simple. The value is that AWS takes over a meaningful part of the infrastructure operations so teams can focus more on schema, queries, scaling patterns, and application behavior.

---

## 11.2 What RDS Provides

Amazon RDS is a managed service for relational database engines.

At a practical level, it helps with:

- instance provisioning
- automated backups
- patching windows and maintenance operations
- monitoring and service integration
- high-availability options such as Multi-AZ deployments

RDS reduces operational work, but it does not remove design responsibility.

You still need to decide:

- which engine fits the workload
- how large the database should be
- how backups and retention should work
- which applications and users can access it
- whether the workload needs read scaling or higher availability

Managed does not mean architecture-free.

---

## 11.3 Aurora and How It Differs

Aurora is part of the RDS family but is architecturally distinct enough to think about separately.

It is designed to provide relational database behavior with AWS-managed storage and high-availability patterns tuned for cloud deployments.

At a high level, Aurora is often chosen when teams want:

- managed relational behavior with stronger built-in resilience patterns
- simpler scaling patterns for some read-heavy designs
- tighter AWS-managed operational characteristics than a traditional self-managed engine style

The important lesson for beginners is not to memorize internal implementation details. It is to recognize that "RDS" can mean both traditional managed relational engines and Aurora, and the trade-offs are not identical.

Aurora is not always automatically the best choice. It is a design option whose strengths need to match the workload.

---

## 11.4 Single-AZ, Multi-AZ, and Failure Thinking

![RDS and Aurora reliability model showing primary writer, standby or shared storage design, read scaling endpoints, and managed failover recovery path.](images/ch11-rds-aurora-failover-and-recovery.svg)

Relational databases are often critical-path systems. Their failure can stop the application.

That is why availability design matters so much.

Single-instance database deployment may be acceptable for development or low-risk internal use, but production systems often need stronger failure tolerance.

Multi-AZ design improves resilience against infrastructure failure inside a region by keeping the database service ready for failover across Availability Zones.

This is not the same as read scaling.

Important distinction:

- Multi-AZ is mainly about availability and failover
- read replicas are mainly about distributing read load or supporting read-heavy patterns

Teams often confuse these. A read replica does not automatically provide the same operational guarantee as a high-availability failover design.

---

## 11.5 Backups, Snapshots, and Recovery Strategy

Managed databases still require backup planning.

RDS and Aurora support automated backups and manual snapshots, but the architectural questions remain:

- how long should backups be retained
- how much data loss is acceptable
- how quickly must recovery happen
- does the workload need cross-region recovery planning

Backups support recovery from more than hardware failure. They also matter for:

- accidental deletion
- application bugs that corrupt data
- rollback or environment cloning needs
- security incidents that require known-good recovery points

The presence of automated backups is useful, but it does not replace restore testing or disaster recovery design.

---

## 11.6 Read Scaling and Replica Patterns

Many relational workloads eventually face a read-versus-write imbalance.

If the primary database handles both writes and all read traffic, application growth can create pressure even when write volume is moderate.

Read replicas help distribute read load for workloads such as:

- reporting queries
- read-heavy APIs
- analytics-style queries that should not burden the primary

But replicas come with architectural consequences:

- applications must know which traffic is safe to read from replicas
- replication lag may matter for freshness-sensitive reads
- some user journeys must still read from the primary if immediate consistency is required

That means read scaling is not only a database feature. It is an application-consistency decision.

---

## 11.7 Security and Access Control

A managed database is still a sensitive system.

Security design should cover:

- network placement inside appropriate subnets
- security groups that allow only intended clients
- encryption at rest and in transit where required
- credential handling through Secrets Manager or equivalent secure patterns
- least-privilege database users and application roles

One of the most common mistakes is focusing on engine setup while leaving access design too broad.

Databases should not be reachable by everything inside the VPC by default. Access boundaries should reflect the application architecture and trust model.

---

## 11.8 Operational Trade-Offs: Self-Managed on EC2 Versus RDS or Aurora

Managed services always involve trade-offs.

Running a database on EC2 may offer more low-level control, but it also means your team owns more of:

- patching
- backup orchestration
- failover engineering
- OS-level hardening
- monitoring and restoration workflows

RDS and Aurora reduce that operational surface significantly.

For most teams, that trade is beneficial. The exception is usually when a workload has specific engine-level or OS-level requirements that the managed model does not fit.

Architects should default to managed relational services unless there is a concrete reason not to.

---

## 11.9 Solutions Architect Review Questions

When reviewing a relational database design, ask:

- Does the workload truly need a relational database?
- What is the availability requirement: development convenience, production baseline, or high-criticality failover posture?
- Will the workload need read scaling, and how will the application handle replica consistency?
- What backup retention and restore expectations exist?
- Are credentials, subnet placement, and security groups properly constrained?
- Is there any reason this workload should be self-managed instead of using RDS or Aurora?

These questions keep the service choice tied to workload behavior rather than habit.

---

## 11.10 Common Mistakes

- assuming a managed database removes the need for backup and recovery planning
- confusing Multi-AZ with read scaling
- sending freshness-sensitive reads to replicas without thinking through replication lag
- exposing the database too broadly at the network layer
- hard-coding database credentials into application code or local files
- choosing self-managed databases on EC2 without a strong operational reason
- treating relational storage as the default answer even when the access pattern may fit another database model better
- ignoring restore testing while assuming backups are sufficient

---

## 11.11 Hands-On Tasks

1. Explain the difference between Multi-AZ failover and read replicas.
2. Compare a small internal app database with a customer-facing production transaction database and describe the likely availability posture for each.
3. Define a backup retention strategy for a relational database that supports daily business operations.
4. List the application reads that could safely use replicas and the reads that should stay on the primary.
5. Describe one case where running a database on EC2 might be justified and why it is usually not the default choice.

---

## 11.12 Recap

RDS and Aurora provide managed relational database options that reduce operational burden while preserving the core strengths of relational systems. Strong design still requires deliberate decisions about availability, backups, read scaling, credentials, and network access. Managed databases simplify operations, but they do not remove the need for sound architectural judgment.

Next: 12: DynamoDB

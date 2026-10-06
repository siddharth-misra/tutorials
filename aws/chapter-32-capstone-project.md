# 32: Capstone Project

This chapter brings the roadmap together by moving from individual AWS services to a complete system design. The goal is not to memorize one perfect architecture, but to practice making connected decisions that reflect real production needs.

You will use the ideas from earlier chapters to shape a realistic workload across networking, compute, storage, security, observability, delivery, and cost. The focus is on reasoning clearly about trade-offs, because strong AWS design comes from how services work together, not from listing as many services as possible.

---

## 32.1 Why a Capstone Matters

Learning services one by one is necessary, but real systems are built from service combinations and trade-offs.

The capstone matters because architecture skill is not proven by knowing what Lambda or Route 53 does in isolation. It is proven by being able to choose a coherent design, explain the boundaries between services, and justify why the design is appropriate for the workload.

This chapter is therefore not a detailed build script. It is a synthesis chapter that forces design thinking across the roadmap.

---

## 32.2 Define the Target Workload

Use a workload realistic enough to exercise the roadmap.

One strong example is a small but production-aware digital commerce or booking platform with these needs:

- public web or mobile client access
- a secure API layer
- application compute that can scale
- persistent data storage
- asynchronous processing for notifications or background jobs
- monitoring, auditability, backups, and deployment automation

You could also choose a SaaS internal platform or event-driven order-processing system. The exact domain matters less than whether the system forces you to make meaningful architecture decisions.

The best capstone is one that is simple enough to finish conceptually but rich enough to expose trade-offs.

---

## 32.3 Reference Architecture for the Capstone

![Capstone reference architecture connecting edge routing, compute tiers, async services, data stores, observability, and delivery guardrails.](images/ch32-capstone-reference-architecture.svg)

A reasonable capstone architecture might include:

- Route 53 for DNS
- CloudFront for edge delivery of static content
- WAF and Shield protection for internet-facing entry points
- Cognito for user authentication
- API Gateway or an Application Load Balancer as the front door to application logic
- Lambda, ECS on Fargate, or EC2-based services depending on the chosen compute model
- S3 for static assets and document storage
- RDS, DynamoDB, or both depending on the data access pattern
- SQS or EventBridge for asynchronous workflows
- CloudWatch for metrics, logs, alarms, and dashboards
- CloudTrail and Config for audit and governance
- KMS, Secrets Manager, and Parameter Store for encryption and secret or config handling
- Infrastructure as code and CI/CD for repeatable delivery

This is not the only valid architecture. It is a reference shape that covers the main learning surfaces from the roadmap.

---

## 32.4 Choose Compute and Data Intentionally

The capstone becomes meaningful when you justify your core choices.

Examples:

- Choose Lambda if the workload is highly event-driven, bursty, and operational simplicity matters more than low-level runtime control.
- Choose ECS on Fargate if you want container packaging without managing EC2 hosts.
- Choose EC2 if you specifically need instance-level control and understand the added operational cost.

For data:

- choose RDS or Aurora when relational integrity and SQL access matter
- choose DynamoDB when access patterns are known and horizontal scale with low operational overhead matters
- choose S3 for static content, durable object storage, or analytical export landing zones

There is no prize for using the most services. The capstone is strongest when the chosen components clearly match the workload.

---

## 32.5 Security and Identity Baseline

Every capstone design should define a security baseline, not treat security as an appendix.

The baseline should include:

- least-privilege IAM roles for workloads and operators
- Cognito or another appropriate identity boundary for end users
- WAF rules and Shield coverage for public entry points
- KMS-backed encryption for sensitive data stores where appropriate
- Secrets Manager or Parameter Store for secret and configuration retrieval
- CloudTrail and Config for auditability and change tracking

Security design should also describe the trust boundaries between clients, edge services, application components, and data stores.

If you cannot explain those trust boundaries, the capstone is incomplete.

---

## 32.6 Reliability, Scaling, and Recovery Design

A production-aware capstone should specify:

- whether the workload runs across multiple Availability Zones
- how it scales with demand
- what happens when a component fails
- how backups are handled
- what the approximate RPO and RTO expectations are

Examples:

- use Multi-AZ patterns for core infrastructure inside one region
- place asynchronous workloads behind queues to absorb spikes
- define whether the disaster recovery posture is backup-and-restore, pilot light, or something stronger

The capstone should not claim "high availability" unless the design actually supports it through redundant paths and operational recovery thinking.

---

## 32.7 Observability and Operational Readiness

Every meaningful capstone should answer these questions:

- What will be monitored?
- Which failures trigger alarms?
- Where will logs be collected?
- How will operators know whether an incident is caused by traffic, code, dependency failure, or configuration drift?

At minimum, the design should include:

- CloudWatch metrics and alarms for key service health signals
- structured logs for important application paths
- dashboards aligned to the workload's main user journey
- CloudTrail and Config for audit and drift visibility

A capstone that cannot be operated is not architecturally complete.

---

## 32.8 Delivery, Environments, and Change Control

The capstone should also define how changes move safely.

Expected elements include:

- separate environments such as sandbox, staging, and production
- infrastructure as code for durable provisioning
- CI/CD to build, validate, and deploy application and infrastructure changes
- secrets and configuration managed outside source code
- approvals or release controls where production risk justifies them

This is where many otherwise good designs become unrealistic. If the system can be drawn but not deployed safely and repeatedly, it is not ready for real use.

---

## 32.9 Cost and Architecture Trade-Off Review

The capstone should include a short cost and complexity review.

Ask:

- Which services are always on and which scale with usage?
- Where might hidden costs appear, such as data transfer, logging, or NAT traffic?
- Which design choices intentionally cost more because they reduce operational or reliability risk?
- Could a simpler design meet the same business need?

This review keeps the capstone grounded. Good architecture is not only technically sound. It is also economically sensible for the workload stage.

---

## 32.10 Common Mistakes

- treating the capstone as a diagram exercise with no justification for service choices
- adding many AWS services because they are available rather than because the workload needs them
- ignoring IAM, secrets, logging, backups, and delivery workflows while focusing only on the request path
- claiming multi-region or high availability without defining failure behavior and recovery patterns
- designing a system the team could not realistically deploy, observe, or operate
- skipping trade-off analysis and presenting one architecture as if it were universally correct
- forgetting to define environment separation and change-control boundaries

---

## 32.11 Hands-On Tasks

1. Choose a capstone workload domain and write a one-paragraph problem statement for it.
2. Draw or describe the request path from client to data store, including edge, identity, compute, and data components.
3. Justify one compute choice and one data-store choice against at least one realistic alternative.
4. Define the top five CloudWatch alarms you would configure first.
5. State the workload's expected RPO and RTO and explain which recovery pattern supports them.
6. List the infrastructure-as-code and CI/CD controls needed before the workload should be called production-ready.

---

## 32.12 Recap

The capstone turns AWS service knowledge into architecture judgment. A strong final design connects identity, networking, compute, storage, messaging, observability, governance, recovery, and delivery into one system whose trade-offs are clear. The goal is not to build the most complex architecture. The goal is to design one that is secure, operable, scalable, and appropriate for the problem.

Next: Revisit the roadmap sections that the capstone exposed as weak points and deepen them in implementation.

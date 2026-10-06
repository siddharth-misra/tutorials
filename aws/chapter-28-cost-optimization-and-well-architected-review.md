# 28: Cost Optimization and Well-Architected Review

Good AWS design is not only about making systems work. It is also about spending money deliberately and checking whether the architecture is balanced across cost, security, reliability, performance, and operations.

This chapter explains how cost optimization works as an ongoing engineering habit, not a one-time cleanup. You will learn how the AWS Well-Architected Framework helps teams review trade-offs, find waste, and make better design choices before small inefficiencies become expensive problems.

---

## 28.1 Why Cost Optimization Needs Design Discipline

Cloud cost problems rarely come from one expensive instance.

They usually come from many small decisions:

- resources left running without purpose
- overprovisioned environments
- unnecessary data transfer
- poor storage lifecycle choices
- architecture patterns that scale cost faster than value

Cost optimization is not about making AWS cheap at all costs. It is about spending deliberately.

The best question is not, "How do we reduce the bill?" The better question is, "Are we paying for the right things at the right level for the business need?"

That framing matters because some higher costs are justified by improved resilience, lower operational risk, or better customer experience. Cost optimization is a trade-off exercise, not blind minimization.

---

## 28.2 Major AWS Cost Drivers

Most AWS bills are shaped by a few predictable categories:

- compute runtime and instance sizing
- storage capacity and access patterns
- data transfer
- managed service consumption models
- logging, monitoring, and analytics volume
- provisioned capacity left idle

Architects need to understand not only the direct price of a service, but also the supporting cost pattern around it.

Examples:

- a cheap compute tier may become expensive once cross-AZ or cross-region data transfer is included
- verbose logs retained indefinitely may create unnecessary observability cost
- a serverless workload can be efficient at low volume but surprising at extreme request rates or with inefficient code paths

Cost optimization starts with understanding the shape of the workload, not with memorizing a pricing page.

---

## 28.3 Common Waste Patterns

Waste in AWS is usually operational, not theoretical.

Typical examples include:

- development resources left running after work hours
- oversized EC2 instances chosen without load evidence
- unattached EBS volumes and old snapshots
- idle load balancers, NAT gateways, or IP allocations
- duplicated data copies with no lifecycle strategy
- high-cost services used for low-value internal workloads

Another common waste pattern is architectural mismatch. Teams sometimes choose a service because it is familiar or because it sounds advanced, not because it fits the access pattern.

For example, running a constantly idle fleet to serve infrequent jobs may cost far more than an event-driven design.

---

## 28.4 Right-Sizing and Elasticity

One of cloud's main promises is elasticity, but many workloads still run as if capacity were fixed.

Right-sizing means matching resource size and count to actual demand.

Important practices include:

- reviewing utilization trends instead of provisioning by guesswork
- scaling out or in based on meaningful load signals
- selecting instance families that fit the workload profile
- turning off nonproduction resources when they are not needed

Right-sizing is not a one-time project. Workloads change. Usage changes. Release patterns change. Periodic review is necessary.

Architects should also remember that underprovisioning has a cost too. Performance failures, operator time, and customer dissatisfaction are real business costs.

---

## 28.5 Storage, Retention, and Data Transfer Economics

Storage cost is often underestimated because the monthly growth appears gradual.

Design choices that matter include:

- whether objects need high-frequency access or can move to cheaper tiers
- whether snapshots and backups have retention and cleanup rules
- whether logs are kept indefinitely without operational reason
- whether traffic patterns create unnecessary cross-AZ, cross-region, or internet egress charges

Data transfer deserves special attention. A design that looks simple on a diagram can become expensive if services exchange large amounts of data across boundaries that incur transfer charges.

That is why cost review is part of architecture review, not only part of finance reporting.

---

## 28.6 Purchasing Models and Commitment Decisions

AWS offers different purchasing models for some services, especially compute.

The main lesson is not to memorize every option. The lesson is to match commitment level to workload predictability.

- steady, predictable baseline usage may justify longer commitments
- variable or experimental workloads may need more flexibility
- interruptible or fault-tolerant jobs may fit lower-cost models designed for noncritical execution patterns

Commitment can reduce cost significantly, but only when the workload pattern is understood. Premature commitment based on assumptions can lock in the wrong economics.

---

## 28.7 The Well-Architected Framework as a Review Tool

![Continuous optimization loop connecting cost signals, right-sizing actions, commitment choices, Well-Architected review, and ownership tracking.](images/ch28-cost-and-well-architected-review-loop.svg)

The AWS Well-Architected Framework gives teams a structured way to review design decisions across key pillars:

- operational excellence
- security
- reliability
- performance efficiency
- cost optimization
- sustainability

This framework is useful because cost decisions should not be made in isolation.

For example:

- removing redundancy may lower cost but damage reliability
- reducing observability spend may save money but slow incident response
- aggressive caching may improve performance and cost, but only if data freshness requirements permit it

Well-Architected reviews force teams to make those trade-offs explicit.

---

## 28.8 How to Run a Practical Review

A useful review is evidence-based, not slogan-based.

Ask questions such as:

- Which components drive the largest percentage of monthly spend?
- Are we paying for idle capacity?
- Which reliability controls are intentional, and which are accidental overengineering?
- Are monitoring, backups, and security controls sized to real need?
- Does this workload need this level of regional redundancy, or is a simpler posture acceptable?
- Which costs would rise fastest if traffic doubled?

The goal is not to chase perfection. The goal is to identify the next set of changes that materially improves architecture quality.

Well-Architected work is most valuable when it becomes a repeatable review habit, especially before major launches or after cost surprises.

---

## 28.9 Cost Optimization Guardrails and Ownership

Strong cost control requires ownership.

Useful guardrails include:

- tagging standards so spend can be attributed to teams and environments
- budgets and alerts for unexpected growth
- scheduled cleanup or shutdown for nonproduction resources
- regular review of unused or orphaned resources
- clear approval patterns for expensive architecture changes

Without ownership, cost optimization turns into periodic cleanup campaigns rather than a stable operating model.

This is why cost and architecture should be discussed together. Teams that own the design should also understand the financial shape of their design choices.

---

## 28.10 Common Mistakes

- treating cost optimization as a finance-only problem instead of an architecture and operations problem
- minimizing cost without considering reliability, performance, or security consequences
- overprovisioning resources because no one reviewed actual utilization
- ignoring data transfer and retention costs while focusing only on instance pricing
- committing to long-term purchasing models before workload behavior is understood
- keeping old snapshots, logs, and resources indefinitely because cleanup ownership is unclear
- running Well-Architected reviews as checklist exercises without evidence or follow-through
- assuming the current bill shape will remain stable as the workload scales

---

## 28.11 Hands-On Tasks

1. Pick one AWS workload and identify its likely top three cost drivers.
2. List five waste patterns you would check first in a nonproduction account.
3. Explain one case where paying more is the correct architectural decision.
4. Define a simple tagging model that would let a team separate production, staging, and shared-platform spend.
5. Write down three Well-Architected review questions you would ask before approving a major workload expansion.

---

## 28.12 Recap

Cost optimization in AWS is a design discipline grounded in usage patterns, not a late-stage cleanup activity. The best results come from understanding cost drivers, removing waste deliberately, matching service and purchasing choices to real workload behavior, and reviewing trade-offs through the Well-Architected pillars. A mature workload is not the cheapest possible system. It is the system whose cost and architectural quality both make sense for the business.

Next: 29: Multi-Account and Landing Zone Design

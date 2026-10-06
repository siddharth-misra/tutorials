# 2: AWS Account Setup and Cost Guardrails

Your Amazon Web Services (AWS) account is the starting point for everything you build. It controls billing, identity, logging, and access to every service, so a weak setup here can create security risks or unexpected costs very quickly.

This chapter explains how to set up an account so it is safe to learn in and easier to operate later in production. You will see why protecting the root user, turning on billing alerts, and adding basic guardrails matter before you launch real workloads.

---

## 2.1 Why Account Setup Matters

Many AWS mistakes happen before the first workload is deployed.

Common examples:

- the root user has no MFA
- budgets are not configured
- billing alerts are missing
- experiments are run without tags or cleanup discipline

These are not advanced problems. They are foundation problems. Fix them at the start.

Account setup decisions also become sticky. Email ownership, root access practices, billing visibility, and logging defaults are much easier to establish correctly on day one than to retrofit after teams, workloads, and automation already depend on the account.

![AWS account setup sequence showing the required order: root protection, contacts, budgets, governance logging, and tagging plus cleanup.](images/ch02-account-setup-sequence.svg)

*Figure: The setup sequence is a dependency chain, not a checklist of unrelated tasks. Doing it in order prevents the most common early security and billing failures.*

---

## 2.2 Root User Protection

The root user has full control over the AWS account. It should almost never be used for day-to-day work.

### Minimum root user checklist

1. Use a strong unique password.
2. Enable multi-factor authentication.
3. Store recovery details safely.
4. Do not use the root user for routine CLI or console work.

### Why this matters

If root access is compromised, the attacker can bypass many normal protections. This is one of the highest-impact account risks.

The root user is best treated as a break-glass identity. It exists for rare account-level actions and recovery scenarios, not for normal administration.

---

## 2.3 Basic Account Hygiene

After securing the root user, configure the account so that billing and security signals reach real humans.

Set up:

- alternate billing contact
- alternate operations contact
- alternate security contact
- account-level notification email that is actively monitored

Those details matter because billing warnings, abuse notices, service notifications, and recovery messages are only useful if they reach a mailbox someone actually watches.

This reduces the chance that warnings or invoices are missed.

### Foundational security services to enable early

For a solutions architect, account setup also means creating a minimum governance baseline.

- CloudTrail for API audit history
- AWS Config for resource configuration tracking
- GuardDuty for threat detection
- Security Hub when you want centralized findings across services and accounts

In a learning account, you may not enable every governance service immediately if cost or complexity is a concern. But you should at least understand which signals you are choosing to delay and why.

These services do not replace secure design, but they improve visibility and response.

---

## 2.4 Budget and Billing Guardrails

AWS charges by usage. If you do not monitor usage, the first surprise is often financial.

### Create a budget early

Set a modest monthly budget for the learning account.

Examples:

- total monthly cost budget
- service-specific budget for EC2 or RDS
- forecasted spend alert before the actual bill lands

### Enable billing alerts

Use billing alerts so you know when usage increases before it becomes expensive.

Billing signals are helpful, but they are not perfect real-time protection. A strong cost posture combines budgets, anomaly detection, tagging, and cleanup habits.

### Use Cost Explorer

Cost Explorer helps answer:

- which service is costing the most
- whether cost is growing daily or weekly
- which experiments were not cleaned up

### Add cost allocation discipline

Solutions architects should standardize:

- cost allocation tags
- budget alerts by environment or workload
- Cost Anomaly Detection for unusual spend spikes
- regular cost reviews tied to architecture decisions

This matters because cost is easier to control when you can attribute it. If resources are untagged or environments are mixed together, cost analysis becomes guesswork instead of governance.

Cost control is not only finance work. It is architecture work.

![Cost guardrail feedback loop showing tagging, spend measurement, drift detection, alert routing, and corrective action.](images/ch02-cost-guardrail-feedback-loop.svg)

*Figure: Budgets and alerts only work when paired with ownership and cleanup actions. Cost control is a continuous architecture and operations loop.*

---

## 2.5 Free Tier Is Helpful, Not a Safety Guarantee

The free tier reduces learning cost, but it does not guarantee a zero bill.

Important points:

- not every service is free
- limits differ by service
- usage beyond the free threshold is billable
- some resources keep charging even when you forget about them

Beginners are often surprised by supporting resources rather than by the main service itself. Storage, public IPv4 addresses, snapshots, NAT, and idle infrastructure can outlive the experiment that created them.

Always verify pricing before launching resources.

---

## 2.6 Tagging for Control

Tags are key-value labels attached to resources.

They help with:

- cost tracking
- ownership
- environment separation
- cleanup workflows

Recommended starter tags:

- `Project`
- `Environment`
- `Owner`
- `Purpose`

As environments mature, tags often become part of policy and automation. They influence chargeback, access controls, cleanup jobs, reporting, and compliance checks.

Without tags, cost analysis becomes messy very quickly.

---

## 2.7 First Admin Setup Pattern

The normal pattern is:

1. secure the root user
2. create a dedicated administrative identity
3. use that identity for normal work

That administrative identity should still follow good discipline:

- use MFA
- avoid shared credentials
- separate admin access from routine lower-privilege work where practical

The detailed access model comes in the IAM chapter, but the principle belongs here: avoid doing regular work as root.

### Learning account vs production landing zone

A single account is fine for learning, but it is not a strong production operating model.

A solutions architect should understand the multi-account baseline:

- separate production and non-production accounts
- separate security or log archive accounts
- use AWS Organizations to group accounts
- apply service control policies, or SCPs, for top-level guardrails
- use AWS Control Tower when the team wants a managed landing-zone starting point

This pattern reduces blast radius, simplifies billing boundaries, and improves governance.

The point is not complexity for its own sake. The point is that security, audit, and cost boundaries become clearer when production does not share an account with experiments and ad hoc testing.

![Learning account versus production landing-zone diagram showing transition from one account to multi-account AWS Organizations structure with SCP guardrails.](images/ch02-learning-to-landing-zone.svg)

*Figure: A single account is a practical learning start, but production reliability and governance improve when environments are split into multiple accounts under AWS Organizations guardrails.*

---

## 2.8 Cleanup Discipline

Cloud resources continue to cost money until they are stopped or deleted.

Good habits:

- terminate test instances when finished
- delete unused EBS volumes and snapshots
- remove idle load balancers and NAT gateways
- clean up old log groups, test buckets, and databases

Cleanup is not just a developer habit. It is a design responsibility. If a team cannot tell which resources are intentionally long-lived and which are leftovers, costs and risk both increase.

The cloud rewards speed, but it also punishes forgotten resources.

Architecturally, this is part of lifecycle management. Every design should include who owns cleanup, when retention applies, and which resources are intentionally persistent.

---

## 2.9 Safe Starter Checklist

Before moving to IAM, make sure your account has the following:

1. Root MFA enabled
2. Alternate contacts configured
3. A monthly budget created
4. Billing alerts enabled
5. A tagging convention decided
6. A plan to avoid daily root-user usage
7. CloudTrail enabled and reviewed
8. A basic account structure plan for environments and future growth
9. A monitored notification path for billing and security events
10. A cleanup habit for temporary resources and experiments

---

## 2.10 Common Mistakes

- using the root user for normal work
- using personal or unmonitored email paths for important account notifications
- assuming free tier means free by default
- launching resources without watching cost
- expecting budgets alone to stop unwanted spend automatically
- skipping tags and losing ownership visibility
- forgetting to clean up storage, IPs, or databases
- mixing production and experimentation in one account because it feels simpler at the start
- putting production and experimentation in the same account without a reason
- delaying audit and logging baselines until after deployment

---

## 2.11 Hands-On Tasks

1. Enable MFA for the root user.
2. Add alternate billing and security contacts.
3. Create a monthly budget with alert thresholds.
4. Open Cost Explorer and inspect available service groupings.
5. Write down a simple tag policy for future resources.
6. Draft a two-account or three-account structure for production, non-production, and logging.
7. Write down which alerts should go to billing contacts, which should go to security contacts, and who should own each response.
8. List three AWS resources that commonly continue costing money after an experiment ends.
9. Describe one reason a single learning account is fine now and one reason it becomes weak for production later.

---

## 2.12 Recap

- Root user protection is mandatory, not optional.
- Budgets, billing alerts, and Cost Explorer are part of the foundation.
- Tags make cost analysis, ownership tracking, and cleanup manageable.
- Free tier helps, but it does not remove the need for cost discipline or pricing checks.
- A clean AWS account starts with strong security, monitored notification paths, and simple operational guardrails.
- Solutions architects also define landing-zone direction, logging baselines, account boundaries, and lifecycle discipline early instead of retrofitting them later.

Next: learn IAM so the right people and services get the right permissions, and nothing more.
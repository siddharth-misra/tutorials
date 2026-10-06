# 29: Multi-Account and Landing Zone Design

As AWS environments grow, one account is usually not enough. Multi-account design gives teams clearer security boundaries, better billing separation, safer experimentation, and more controlled operations across environments and business units.

This chapter explains how a landing zone provides the starting structure for operating at scale. You will learn how AWS Organizations, service control policies (SCPs), shared logging, and account standards are used to build a foundation that supports governance without blocking delivery.

---

## 29.1 Why Multi-Account Design Matters

One AWS account is enough for learning, but it is rarely enough for a mature organization.

As environments grow, a single account creates problems:

- weak blast-radius boundaries
- unclear ownership between teams and environments
- noisy billing and logging separation
- broad permissions that are hard to govern safely
- operational coupling between unrelated workloads

Multi-account design exists to contain risk and improve clarity.

It lets organizations separate workloads by environment, business unit, security boundary, or operational purpose. That separation makes it easier to apply different controls to production, sandbox, logging, networking, and shared-platform services.

The key idea is simple: accounts are not only billing containers. In AWS, they are one of the strongest native isolation boundaries.

---

## 29.2 AWS Organizations Fundamentals

AWS Organizations is the main service used to manage multiple AWS accounts together.

It allows teams to:

- create and group accounts centrally
- apply policies across those accounts
- consolidate billing
- structure environments under a common governance model

Organizations introduces hierarchy through organizational units, usually shortened to OUs. OUs help group accounts by purpose.

Examples:

- sandbox OU
- production OU
- security OU
- infrastructure OU

This hierarchy matters because governance should reflect workload sensitivity. A production account should not be controlled the same way as an experimental sandbox account.

---

## 29.3 Service Control Policies and Guardrails

Service control policies, or SCPs, are one of the most important governance tools in a multi-account AWS environment.

SCPs do not grant permissions. They define the maximum allowed permissions for accounts in an organization or OU.

That means SCPs are best used as guardrails.

Examples:

- prevent disabling CloudTrail or security tooling
- restrict use of certain regions
- deny creation of specific high-risk resources outside approved workflows
- block use of the root user for normal operations where applicable

SCPs are powerful, but they must be designed carefully. Overly broad denies can break legitimate operational work and create hard-to-debug failures.

The design goal is to enforce clear organizational boundaries, not to create a maze of opaque policy side effects.

---

## 29.4 Common Account Patterns

There is no single perfect account layout, but several patterns appear repeatedly.

Common account roles include:

- sandbox or development accounts for experimentation
- staging or preproduction accounts for release validation
- dedicated production accounts for live workloads
- shared services accounts for tooling, CI/CD, or internal platforms
- log archive or security accounts for centralized audit and detection systems
- networking accounts for shared connectivity in larger organizations

The deeper reason for these patterns is separation of concern.

For example, if security logs are stored in the same account as the workload that generated them, a compromise of that workload account may also endanger the audit data. Moving log archival and some security tooling into separate accounts improves resilience and accountability.

---

## 29.5 What a Landing Zone Provides

![Landing zone structure with Organizations OUs, security and logging accounts, shared services, workload accounts, and guardrails.](images/ch29-landing-zone-multi-account-structure.svg)

A landing zone is the baseline multi-account environment design an organization uses to start safely and consistently.

It usually includes:

- an account structure
- identity and access patterns
- logging and audit configuration
- network and connectivity foundations
- guardrails and policy baselines
- provisioning automation for new accounts

A landing zone is valuable because unmanaged growth creates drift quickly. If every team creates accounts with different logging, tagging, identity, and network decisions, governance becomes expensive and fragile.

The landing zone is not the final architecture of every workload. It is the foundation that makes later workload-specific architecture safer and more repeatable.

---

## 29.6 Identity, Access, and Administrative Model

Multi-account design works best when workforce access is centralized and role-based.

Good practice usually includes:

- centralized identity integration for human users
- role assumption into target accounts instead of long-lived account-local user sprawl
- separate administrative, read-only, and emergency-access paths
- deliberate access boundaries between production and nonproduction environments

This matters because account sprawl without identity discipline becomes a security problem quickly.

Architects should favor a model where users authenticate through a centralized identity layer and assume roles into the accounts they need. That improves auditability and reduces unmanaged credentials.

---

## 29.7 Shared Services, Logging, and Network Design

As organizations grow, some capabilities are more effective when centralized.

Examples include:

- centralized CloudTrail and Config aggregation
- security tooling and detections
- CI/CD services used across many application accounts
- DNS, connectivity, or transit architecture in larger network topologies

Centralization can improve consistency, but it also creates dependencies. A shared services account becomes part of the operational backbone, so its resilience, access model, and change controls need more attention than a normal application account.

Landing zone design is therefore a balance between standardization and avoiding oversized shared bottlenecks.

---

## 29.8 Provisioning, Governance, and Lifecycle Management

The real test of a landing zone is what happens when new accounts are needed.

Mature environments do not create accounts manually and then fix them later. They provision them with a baseline that includes:

- required logging
- approved identity integration
- default guardrails
- naming and tagging standards
- baseline network and security controls

Lifecycle management matters too. Accounts should have owners, intended purpose, contact paths, and retirement rules. Orphaned accounts are a governance and cost problem.

This is why landing zones are not only technical templates. They are operating models.

---

## 29.9 Solutions Architect Review Questions

When evaluating a multi-account design, ask:

- What isolation problem are accounts solving here: security, environment separation, billing clarity, or all of them?
- Which controls belong at the organization level and which belong in workload accounts?
- Are SCPs enforcing a few clear guardrails or compensating for weak identity and deployment practices?
- Where are audit logs, security findings, and shared automation hosted?
- How are new accounts created and brought under governance quickly?
- Does the shared-platform design help teams move faster, or has it created central bottlenecks?

These questions usually expose whether the environment is intentionally governed or simply large.

---

## 29.10 Common Mistakes

- keeping everything in one account long after the organization has outgrown that model
- creating many accounts without a landing-zone baseline for logging, identity, and guardrails
- using SCPs as a substitute for least-privilege IAM and sound operational design
- centralizing too many services and creating fragile shared bottlenecks
- allowing workforce users to exist separately in many accounts instead of using centralized access patterns
- failing to separate production and nonproduction blast radius clearly
- creating accounts without ownership, lifecycle tracking, or purpose-based naming
- assuming consolidated billing alone is the same as governance

---

## 29.11 Hands-On Tasks

1. Sketch an AWS Organizations OU structure for sandbox, staging, production, security, and shared services.
2. Define three SCP guardrails that would be reasonable for production accounts.
3. Explain why a centralized log archive account can improve security investigations.
4. Describe a role-based access pattern for engineers who need read-only production access and admin access only in sandbox.
5. List the baseline controls you would want every new AWS account to inherit automatically.

---

## 29.12 Recap

Multi-account AWS design uses the account boundary as a core isolation and governance tool. AWS Organizations, OUs, and SCPs make it possible to apply guardrails across environments, while a landing zone provides the baseline structure for identity, logging, networking, and account provisioning. Strong designs use these capabilities to reduce blast radius, clarify ownership, and keep growth manageable over time.

Next: 30: Multi-Region Architecture

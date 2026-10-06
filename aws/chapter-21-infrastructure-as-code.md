# 21: Infrastructure as Code

Infrastructure as Code means defining cloud resources in files instead of creating them by hand in a console. This matters because infrastructure becomes reviewable, repeatable, versioned, and safer to change over time.

This chapter introduces the main AWS approaches, including AWS CloudFormation and the AWS Cloud Development Kit (AWS CDK). You will learn how teams use code-driven infrastructure to reduce manual mistakes, manage environments consistently, and control changes in production.

---

## 21.1 Why Infrastructure as Code Matters

Manual cloud changes do not scale well.

Clicking through the console may be fine for learning, but it becomes risky for production systems because it creates:

- undocumented changes
- poor repeatability
- weak reviewability
- configuration drift between environments
- harder rollback during incidents

Infrastructure as Code, or IaC, treats infrastructure definitions as versioned source artifacts.

That means VPCs, IAM roles, load balancers, databases, and other resources can be:

- reviewed before change
- applied consistently
- recreated in new environments
- tracked over time like application code

For a solutions architect, IaC is not only an automation convenience. It is a control mechanism for safety, consistency, and governance.

---

## 21.2 CloudFormation and CDK in AWS Workflows

AWS provides native IaC options such as CloudFormation and the AWS Cloud Development Kit, or AWS CDK.

### CloudFormation

CloudFormation defines infrastructure declaratively through templates.

This makes desired state explicit and reviewable.

### AWS CDK

CDK lets you define infrastructure using programming languages that synthesize into CloudFormation.

This can improve reuse, abstraction, and developer ergonomics when used carefully.

The decision between them often comes down to team preference and complexity level.

Important architect questions include:

- does the team need direct declarative clarity or higher-level code abstractions
- how much custom reuse is actually valuable
- how will generated infrastructure remain understandable during review

The best choice is the one that keeps infrastructure understandable, not merely the one with the most expressive language features.

---

## 21.3 Desired State, Stacks, and Change Boundaries

![Infrastructure as Code change flow from source-controlled templates to reviewed plans, applied stack updates, drift detection, and rollback safety.](images/ch21-iac-desired-state-and-change-flow.svg)

IaC works best when infrastructure is grouped into sensible change units.

In AWS-native workflows, that often means stacks or stack-like boundaries that map to:

- a service
- a shared platform component
- an environment baseline
- a reusable infrastructure module

The point is to define change boundaries that are easy to reason about.

If one stack controls everything in the estate, change risk becomes too large. If every tiny resource is isolated without a design reason, coordination becomes messy.

Architects should think about:

- what changes together
- what should be deployed independently
- what shared resources need separate lifecycle ownership

Good boundaries reduce blast radius and make review easier.

---

## 21.4 Reviewability, Change Sets, and Safe Delivery

IaC improves safety only if changes are reviewed and applied predictably.

Important practices include:

- version control for all infrastructure definitions
- pull request review before deployment
- change previews or change sets where supported
- separate approval controls for higher-risk environments

This matters because the most dangerous infrastructure changes are often syntactically valid. The risk is semantic.

For example:

- widening an IAM policy
- replacing a database resource unexpectedly
- changing a route or security group that breaks traffic flow

Safe IaC delivery depends on making those changes visible before they are applied.

---

## 21.5 Drift, State, and Environment Consistency

One of the biggest reasons to use IaC is to avoid drift.

Drift happens when the real environment no longer matches the declared source of truth.

Common causes include:

- manual console edits
- out-of-band emergency changes never codified afterward
- separate teams changing shared resources without coordination

Drift creates operational risk because nobody is fully sure what the current environment actually is.

IaC does not prevent all drift automatically, but it gives you a model for detecting and correcting it.

Architecturally, the goal should be clear:

- code is the intended source of truth
- emergency manual changes are rare and must be reconciled back into code quickly
- environments should differ deliberately, not accidentally

---

## 21.6 Reuse, Parameters, and Environment Strategy

Infrastructure definitions usually need some reuse across environments, but too much flexibility can make them harder to understand.

Useful reuse patterns include:

- shared constructs for repeated service patterns
- parameterization for region, environment name, or sizing
- common baseline stacks for logging, networking, or security controls

The danger is over-abstraction.

If an IaC module becomes so generic that no reviewer can tell what it actually creates, the code is less safe even if it is technically reusable.

Environment strategy also matters.

You should decide:

- which settings vary by environment
- which resources are shared versus isolated
- whether environments live in separate accounts
- how secrets and sensitive values are provided at deploy time

IaC should reduce ambiguity, not hide it behind abstraction layers.

---

## 21.7 Security, Compliance, and Policy Guardrails

IaC is one of the best places to enforce security and compliance early.

Instead of catching problems after deployment, teams can review or validate infrastructure definitions for issues such as:

- public exposure where private placement was expected
- overly broad IAM permissions
- missing encryption settings
- lack of tagging or logging controls

This is where policy guardrails become valuable.

The more important the environment, the more infrastructure changes should be checked for compliance and security expectations before deployment.

Architects should treat IaC pipelines as control points for governance, not only as convenience wrappers around deployment commands.

---

## 21.8 Testing, Rollback, and Failure Handling

Infrastructure changes can fail in ways that application developers do not always expect.

Examples include:

- resource creation failures due to quotas or naming conflicts
- replacement of resources that should have been preserved
- partial success where some dependent resources were updated and others were not

That is why IaC workflows need:

- testing in lower environments
- careful review of destructive changes
- rollback planning for stateful resources
- awareness that not every rollback is clean or risk-free

The production mindset is simple: infrastructure changes are deployments. They need the same seriousness as application releases, and sometimes more.

---

## 21.9 Infrastructure as Code Design Patterns and Decision Criteria

IaC should become the default operating model for durable AWS infrastructure.

Strong patterns include:

- treat infrastructure definitions as first-class source code
- keep stack boundaries understandable and ownership clear
- promote reviewed changes through environments predictably
- encode guardrails and validation close to the deployment path

An architect checkpoint should review:

- whether the code clearly represents intended infrastructure
- whether change scope is understandable before deploy
- how manual changes are prevented or reconciled
- how shared resources are governed
- how secrets, approvals, and destructive operations are controlled

If the answers are unclear, the organization may have automation but not yet true infrastructure discipline.

---

## 21.10 Common Mistakes

- treating the console as the primary production change path after adopting IaC
- over-abstracting templates or constructs until reviewers cannot understand the actual resources
- putting too much unrelated infrastructure into one large deployment unit
- allowing environment drift to accumulate after manual fixes or emergencies
- ignoring change previews and reviewing only syntax rather than infrastructure impact
- assuming rollback is always safe even for stateful resources
- failing to encode security and policy checks into the workflow
- parameterizing everything until environments become inconsistent and difficult to reason about
- lacking clear ownership of shared infrastructure stacks
- thinking infrastructure code quality matters less than application code quality

---

## 21.11 Hands-On Tasks

1. Define a simple AWS resource stack using CloudFormation or CDK.
2. Put that definition under version control and review the resulting change before deployment.
3. Deploy the stack to a lower environment and inspect the created resources.
4. Make one intentional change and review the resulting change set or diff.
5. Introduce a manual console change and explain why that creates drift.
6. Refactor one repeated pattern into a reusable abstraction, then explain where further abstraction would become excessive.
7. Identify one security guardrail your infrastructure pipeline should enforce automatically.
8. Describe how you would separate shared platform infrastructure from one application's infrastructure.

---

## 21.12 Recap

- Infrastructure as Code turns infrastructure into versioned, reviewable, repeatable source artifacts.
- CloudFormation and CDK both support AWS-native IaC workflows with different trade-offs around abstraction and clarity.
- Safe IaC depends on change boundaries, reviewability, drift control, and environment consistency.
- IaC pipelines are strong places to enforce security, compliance, and deployment guardrails.
- Infrastructure changes need testing, approval, and rollback thinking just like application releases.
- The goal is not simply automation. The goal is controlled, understandable, reproducible infrastructure change.

Next: 22: CI/CD on AWS

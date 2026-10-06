# 22: CI/CD on AWS

Continuous Integration and Continuous Delivery (CI/CD) is the practice of building, testing, and deploying software through automated pipelines. In AWS, this helps teams move faster while still applying checks, approvals, and rollback strategies.

This chapter explains how AWS supports delivery workflows from source change to production release. You will learn why pipeline stages matter, how automation reduces risky manual steps, and what controls are needed to make releases secure, observable, and dependable.

---

## 22.1 Why CI/CD Matters

Manual releases do not scale well.

They are slow, inconsistent, and hard to audit. They also make rollback and environment drift more likely because the release process depends on people remembering steps correctly under pressure.

Continuous integration and continuous delivery, usually shortened to CI/CD, improves this by making software delivery:

- repeatable
- testable
- observable
- easier to review
- safer to promote across environments

On AWS, CI/CD is not only about pushing application code. It often includes infrastructure changes, container image publishing, policy checks, and deployment approval gates.

For a solutions architect, CI/CD matters because delivery speed without safety is reckless, and safety without automation becomes slow and fragile.

---

## 22.2 The Core Pipeline Stages

![CI/CD control flow from commit trigger through build and tests, signed artifacts, staged deployment, monitoring, and rollback.](images/ch22-cicd-pipeline-control-flow.svg)

Most delivery pipelines follow a similar shape even if tooling differs.

Typical stages include:

- source retrieval
- build
- test
- package or artifact creation
- deployment to one or more environments
- verification and possible promotion

The exact implementation changes by workload type.

Examples:

- a Lambda workload may build and package functions plus infrastructure templates
- a containerized application may build an image, push to ECR, and deploy to ECS or EKS
- an infrastructure change may synthesize, validate, and deploy CloudFormation or CDK artifacts

The architect's job is to make sure each stage answers a clear question before the next stage proceeds.

---

## 22.3 AWS Services Commonly Used in Delivery Pipelines

AWS provides several services that can participate in delivery workflows.

Common examples include:

- CodePipeline for orchestrating pipeline stages
- CodeBuild for build and test execution
- CodeDeploy for certain deployment patterns
- ECR for container artifact storage
- CloudFormation or CDK deployment steps for infrastructure changes

Many teams also integrate AWS pipelines with external source platforms and testing systems.

The right design does not require every AWS delivery service. What matters is a clean pipeline that can:

- retrieve trusted source
- build artifacts reproducibly
- apply tests and policy checks
- deploy through controlled stages
- show what changed and whether it succeeded

Tool count is less important than delivery discipline.

---

## 22.4 Artifact Integrity and Build Reproducibility

Pipelines should create trusted artifacts, not just run commands.

Important questions include:

- what exact source revision was built
- what dependency versions were used
- what artifact was produced
- where that artifact is stored
- whether later environments deploy the same artifact or a rebuilt variant

Strong pipelines usually build once and promote the same artifact forward.

Examples:

- one container image digest moves from test to production
- one Lambda package is validated and then promoted unchanged
- one reviewed infrastructure artifact moves through approved environments

This reduces ambiguity and makes incident analysis easier. If each environment rebuilds separately, you risk hidden artifact drift.

---

## 22.5 Deployment Strategies and Safety Controls

Not every deployment should replace everything at once.

Safe delivery may use patterns such as:

- rolling deployment
- blue-green deployment
- canary release
- staged promotion from lower environments to production

The right choice depends on workload type and failure tolerance.

Architects should ask:

- how quickly a bad release must be stopped
- whether old and new versions can coexist temporarily
- what rollback actually means for the workload
- what health checks prove the release is safe

Deployment automation is only as safe as its verification logic. If the pipeline deploys quickly but cannot detect a bad release, automation has merely accelerated risk.

---

## 22.6 Secrets, Permissions, and Environment Isolation

Delivery pipelines often have broad access if they are not designed carefully.

That makes them a high-value security target.

You should review:

- what permissions the pipeline has in each environment
- how secrets such as tokens and deployment credentials are stored
- whether production deployments are isolated from lower-environment credentials and roles
- whether one compromised build step could affect every environment

Good practice includes:

- least-privilege roles for pipeline stages
- separate roles or accounts for different environments
- managed secret storage instead of plaintext credentials in pipeline definitions
- clear approval boundaries for higher-risk changes

CI/CD is part of the security architecture, not only an engineering convenience.

---

## 22.7 Validation, Policy Checks, and Human Approval Gates

Automation does not mean humans disappear from the process. It means humans intervene at the right control points.

Common validation controls include:

- unit and integration tests
- infrastructure validation and policy checks
- image scanning
- static analysis and configuration checks
- smoke tests after deployment

For some changes, especially in production, human approvals are still valuable.

The key is to use approvals for meaningful risk boundaries, not to slow every harmless change with bureaucracy.

A good pipeline is fast for safe changes and deliberate for high-impact ones.

---

## 22.8 Observability, Auditability, and Rollback Readiness

You should be able to answer these questions quickly for any release:

- what version was deployed
- when it was deployed
- by which pipeline execution
- what tests and checks passed
- how to revert if necessary

That means CI/CD systems need strong logging, traceability, and deployment history.

Rollback readiness also matters. Some systems can roll back quickly by redeploying a previous artifact. Others involve state changes, schema changes, or external side effects that make rollback more complex.

Production-safe delivery pipelines acknowledge that nuance. They do not assume rollback is effortless in every system.

---

## 22.9 CI/CD Design Patterns and Decision Criteria

Strong AWS delivery pipelines usually follow a few durable principles:

- build once and promote trusted artifacts
- separate lower-risk and higher-risk environments clearly
- automate verification as early as possible
- keep deployment identity and audit history explicit
- use environment-specific roles and secrets intentionally

An architect checkpoint should review:

- whether the pipeline reflects the actual release risk of the system
- whether the same artifact moves forward or is rebuilt repeatedly
- whether infrastructure and application delivery are coordinated safely
- whether failure signals stop promotion automatically where appropriate
- whether operators can quickly understand and revert a release if needed

If the pipeline is fast but opaque, it is not mature.

---

## 22.10 Common Mistakes

- treating CI/CD as only a build script instead of a controlled delivery system
- rebuilding artifacts separately in each environment instead of promoting one trusted artifact
- giving pipeline roles excessive permissions across all environments
- storing secrets directly in pipeline configuration or source code
- skipping post-deployment verification and relying only on a successful deploy command
- using manual production changes outside the pipeline while assuming the pipeline remains the source of truth
- adding approval gates everywhere instead of only at meaningful risk boundaries
- automating deployment without clear rollback and release visibility
- ignoring infrastructure changes as part of the delivery workflow
- assuming faster deployment always means better delivery without measuring safety and recoverability

---

## 22.11 Hands-On Tasks

1. Sketch a pipeline for one AWS workload from source commit to production deployment.
2. Identify which artifact the pipeline produces and how that artifact is tracked across environments.
3. Add a validation stage and explain what risk it reduces.
4. Define which stages should run automatically and where human approval is justified.
5. Separate the permissions needed for lower-environment deployment from production deployment.
6. Describe how the pipeline should surface deployment history and rollback options.
7. Explain how the same pipeline would handle both application code changes and infrastructure code changes.
8. Compare a direct manual release process with the controlled pipeline you designed and identify the operational risks removed.

---

## 22.12 Recap

- CI/CD makes software and infrastructure delivery repeatable, testable, and auditable.
- AWS delivery workflows often combine services such as CodePipeline, CodeBuild, ECR, and CloudFormation or CDK deployment steps.
- Strong pipelines build trusted artifacts once and promote them forward predictably.
- Deployment safety depends on verification, permissions, environment isolation, and meaningful approval boundaries.
- Observability and rollback readiness are part of delivery design, not afterthoughts.
- A mature pipeline optimizes both speed and control instead of sacrificing one for the other.

Next: 23: CloudWatch

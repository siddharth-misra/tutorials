# 24: CloudTrail and AWS Config

AWS CloudTrail and AWS Config both help you understand change in your AWS environment, but they answer different questions. CloudTrail records API activity, while Config records the state of resources and how that state changes over time.

This chapter explains why both services are important for security and operations. You will learn how they support auditing, investigation, governance, and drift detection, and why production environments need clear records of both actions and configuration history.

---

## 24.1 Why CloudTrail and AWS Config Matter

Production AWS environments change constantly.

Roles are assumed, policies are edited, instances are launched, security groups are modified, buckets are reconfigured, and encryption settings are updated. If you cannot answer who changed something, when it changed, and what the previous state was, you are operating with weak control.

CloudTrail and AWS Config exist to solve two related but different problems:

- CloudTrail records API activity and account actions.
- AWS Config records resource configuration state and how that state changes over time.

This distinction is important during incidents. If a bucket became public, CloudTrail helps identify the action that changed it. AWS Config helps show the resulting configuration state and often what it was before the change.

Together, these services support auditability, incident response, change review, and governance at scale.

---

## 24.2 What CloudTrail Captures

CloudTrail records AWS API activity in your account.

That usually includes:

- console actions
- CLI commands
- SDK calls from applications and automation
- service-initiated actions on your behalf in some scenarios

Each event can include details such as:

- who performed the action
- which API was called
- when the action happened
- the source IP address
- request parameters
- the affected resource when applicable

This makes CloudTrail one of the core sources for security and operational forensics.

For example, if an IAM policy suddenly becomes more permissive, CloudTrail can help answer whether the change came from a person in the console, a CI/CD role, or an application using an access key or assumed role.

CloudTrail does not tell you whether the resulting configuration is good. It tells you that an action happened and gives you evidence around that action.

---

## 24.3 Management Events, Data Events, and Insights

CloudTrail event categories matter because they affect both coverage and cost.

### Management events

These track control-plane actions such as creating a role, modifying a security group, or deleting a trail.

Management events are the baseline for most accounts because they show administrative and configuration activity.

### Data events

These track operations against resource data paths, such as object-level activity in S3 or invocation-level activity in Lambda.

Data events can be extremely valuable, but they can also create large event volumes. They are usually enabled selectively for sensitive resources or workloads where object- or function-level auditability matters.

### CloudTrail Insights

CloudTrail Insights highlights unusual patterns in API activity, such as sudden spikes in write actions or error rates. It can help surface suspicious or unexpected control-plane behavior, but it is not a replacement for strong logging, detection engineering, or deliberate security monitoring.

The design lesson is straightforward: collect enough detail to support real investigations, but do not assume every event category must be enabled everywhere without cost and signal review.

---

## 24.4 Trails, Storage, and Organization Coverage

A trail controls how CloudTrail events are delivered and stored.

Typical design choices include:

- whether the trail covers one region or all regions
- whether it applies to one account or an AWS Organizations structure
- which event categories it records
- where the logs are stored

For production environments, multi-region coverage is usually the safer baseline because attackers and operators do not always stay inside the region you expected.

Organization trails are especially important in multi-account environments. Without them, each account may have inconsistent audit coverage, which weakens incident response and governance.

You should also think about log destination design:

- centralize trails where practical
- protect the destination with strong access controls
- enable integrity validation where required
- design retention around audit and compliance needs

CloudTrail is most valuable when it is hard to tamper with and easy for the right responders to access.

---

## 24.5 What AWS Config Captures

AWS Config focuses on resource configuration state.

It records configuration items for supported resources and tracks how those configurations change over time.

That means Config can help answer questions such as:

- Is this bucket encrypted right now?
- When did this security group rule change?
- Which resources are noncompliant with our tagging requirement?
- What did this role or subnet configuration look like yesterday?

Unlike CloudTrail, which centers on API activity, Config centers on the resulting resource state and compliance view.

This makes it useful for drift detection and governance. If a resource gradually moves away from the approved baseline, Config can surface that even if no one is currently reviewing the resource manually.

---

## 24.6 Recorders, Rules, and Compliance Views

Config works through a few important concepts.

### Recorder

The recorder tracks supported resource changes in the account and region.

### Configuration history

Config stores historical snapshots and change relationships so teams can inspect how a resource evolved over time.

### Rules

Config rules evaluate whether resources comply with desired conditions.

Examples:

- S3 buckets should not allow public read access.
- EBS volumes should be encrypted.
- Security groups should not expose sensitive ports to the internet.
- Required tags should exist on resources.

Rules can be AWS-managed or custom. The important point is that Config turns governance from a periodic spreadsheet exercise into continuous evaluation.

That does not mean every rule should alert or auto-remediate. Rules need ownership, risk-based prioritization, and operational follow-through.

---

## 24.7 How CloudTrail and Config Work Together

![Governance flow linking CloudTrail API activity, Config state timeline, compliance evaluation, and incident response actions.](images/ch24-cloudtrail-config-governance.svg)

These services are complementary, not interchangeable.

CloudTrail answers:

- who did what
- which API call occurred
- when the call happened
- from where the action was initiated

Config answers:

- what the resource configuration is now
- how the resource looked before
- whether the resource is compliant with defined expectations

A common incident workflow looks like this:

1. An engineer sees that a security control failed.
2. AWS Config shows the resource is noncompliant and when the state changed.
3. CloudTrail identifies the principal, API call, and session context that caused the change.
4. Teams restore the desired state and review whether stronger preventive controls are needed.

This pairing is one of the core governance patterns in AWS.

---

## 24.8 Security, Governance, and Incident Response Patterns

CloudTrail and Config become much more valuable when they are designed as part of a broader control system.

Common patterns include:

- centralized logging accounts for audit data
- organization-wide trails and Config aggregation
- alerting on sensitive actions such as disabling logging, changing key policies, or opening public access paths
- regular review of noncompliant resources and repeat offenders
- automated remediation for low-risk, well-understood configuration drift

Architects should be careful with automatic remediation. It is useful for deterministic corrections, such as reapplying a missing tag or closing a clearly forbidden port, but it can be dangerous if the rule logic is broad or if business exceptions are not modeled correctly.

These tools support governance, but they do not replace access control, deployment discipline, or review processes.

---

## 24.9 Solutions Architect Checkpoint

When reviewing an AWS environment, ask:

- Are CloudTrail logs enabled for all relevant regions and accounts?
- Are important data events enabled where object-level or invocation-level auditability matters?
- Is audit log storage centralized and protected from casual tampering?
- Is AWS Config recording the resources that matter most for governance?
- Which compliance rules are informative only, and which are tied to operational action?
- Can responders quickly correlate a bad resource state with the action that caused it?

The checkpoint is not about enabling every possible feature. It is about making sure the environment supports accountability and investigation when something changes unexpectedly.

---

## 24.10 Common Mistakes

- assuming CloudTrail alone is enough without any resource-state history or compliance view
- enabling CloudTrail only in one region and missing activity elsewhere
- failing to centralize or protect audit logs adequately
- turning on high-volume data events broadly without cost review or clear investigative need
- treating Config rules as complete governance without assigning owners or remediation paths
- enabling Config without deciding which resources and controls matter most
- ignoring repeat noncompliance because alerts are too noisy or poorly prioritized
- failing to correlate CloudTrail and Config during security investigations

---

## 24.11 Hands-On Tasks

1. Explain the difference between a CloudTrail management event and a data event.
2. Pick one sensitive AWS resource type and describe whether data events should be enabled for it.
3. Define three AWS Config rules you would enforce in a production account.
4. Describe how you would investigate an unexpected security group change using both CloudTrail and Config.
5. Sketch an organization-level design for storing audit logs from multiple AWS accounts.

---

## 24.12 Recap

CloudTrail records account and API activity, while AWS Config records resource configuration state and compliance over time. CloudTrail helps identify who made a change and how. Config helps show what changed and whether the new state violates expectations. Together, they provide the audit and drift-detection foundation needed for secure, governed AWS environments.

Next: 25: KMS, Secrets Manager, and Parameter Store

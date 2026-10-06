# 3: IAM Fundamentals

AWS Identity and Access Management (IAM) is the system that decides who can do what in your AWS environment. It is one of the most important AWS services because every action, from opening the console to deploying an application, depends on permissions.

This chapter introduces the main IAM building blocks such as users, groups, roles, and policies. You will learn why least privilege matters, how teams and applications get access safely, and why good IAM design is a foundation for secure production systems.

---

## 3.1 What IAM Does

IAM, or Identity and Access Management, controls who can do what in an AWS account.

It is one of the main places where AWS security, operations, and governance meet. Poor IAM design creates both security risk and operational friction. Good IAM design reduces blast radius while still letting teams move.

It answers questions such as:

- Which human can log in?
- Which service can read from an S3 bucket?
- Which application can assume temporary credentials?
- Which actions are blocked even if someone has broad access?

IAM is a global service and is one of the most important AWS security foundations.

That global scope matters. A permission mistake in IAM can have account-wide consequences even if the affected workload is deployed in only one region.

---

## 3.2 Core IAM Building Blocks

### Users

An IAM user represents a person or workload that needs direct long-term credentials.

In modern AWS setups, you should minimize long-term credentials whenever possible.

Long-lived IAM users are easy to overuse because they feel simple. In practice, they create more credential lifecycle, rotation, and leakage risk than temporary-role-based access.

### Groups

Groups collect users with similar access needs.

Example:

- developers
- read-only auditors
- platform administrators

Groups reduce repeated manual permission assignments.

### Roles

Roles are identities that are assumed temporarily.

Roles are widely used for:

- EC2 instances accessing AWS services
- Lambda functions calling other services
- cross-account access
- temporary admin access

Roles are preferred over hard-coded credentials.

Roles also depend on trust. A role is useful only when the correct principal is allowed to assume it. In practice, role design has two sides:

- a trust policy that says who may assume the role
- permission policies that say what the role may do after assumption

### Policies

Policies are JSON documents that define permissions.

They specify:

- actions
- resources
- conditions
- effect, which is allow or deny

### Resource-based policies

Some AWS services also support resource-based policies.

These policies are attached to the resource instead of the identity.

Common examples:

- S3 bucket policies
- KMS key policies
- SNS topic policies
- SQS queue policies

Solutions architects need to know both models because many real designs combine identity-based and resource-based access.

That combination is where many access bugs come from. A user may have permission to call a service, but the target resource may still reject access because its own resource policy does not allow the request.

### Federation and IAM Identity Center

For workforce access, modern AWS environments usually prefer federation over large numbers of long-lived IAM users.

Common pattern:

- users authenticate through an external identity provider
- access is brokered through IAM Identity Center
- users assume roles in target accounts

This is easier to manage and usually more secure than distributing permanent AWS credentials.

![IAM core model and policy attachment path](images/ch03-iam-identity-model-and-policy-path.svg)

*Figure: IAM authorization is a combined model. Principals, identity policies, and resource policies are evaluated together for a request context, and access is granted only when an allow path survives all checks.*

---

## 3.3 How Permission Evaluation Works

IAM evaluation becomes much easier when you remember three rules:

1. By default, access is denied.
2. An explicit allow grants access.
3. An explicit deny overrides allows.

This means a broad allow is not final if another policy denies the action.

That single rule explains many confusing access errors.

Another useful mental model is this:

- identity-based policies and resource-based policies can grant access
- guardrails such as SCPs and permission boundaries can narrow what is possible
- explicit deny overrides the rest

In real environments, permission evaluation often also includes:

- SCPs from AWS Organizations
- permission boundaries
- resource-based policies
- session policies on assumed roles

As a solutions architect, you do not need to memorize every evaluation edge case on day one, but you must know that permissions are layered.

If you ignore the layered model, you will spend too much time debugging the wrong policy document.

![IAM permission evaluation layered flow](images/ch03-iam-permission-evaluation-layered-flow.svg)

*Figure: IAM permission evaluation is layered. Identity and resource policies can grant access, guardrails can narrow scope, and any explicit deny overrides everything else.*

---

## 3.4 Least Privilege

Least privilege means granting only the permissions required for a task, and nothing more.

Bad example:

- giving `AdministratorAccess` to every developer

Better example:

- allowing read and write only to the specific S3 bucket required for a project

Least privilege reduces blast radius when credentials are misused or compromised.

In real systems, least privilege is usually iterative. Teams often begin with broader access to understand what a workload needs, then reduce permissions once the required actions and resource scopes are known.

Teams often extend least privilege with attribute-based access control, or ABAC, by using tags such as `Environment`, `Project`, or `Team` in permission conditions.

That works well when tagging discipline is strong. If tags are inconsistent, ABAC becomes harder to trust and troubleshoot.

---

## 3.5 Common Policy Structure

A policy usually defines four things:

- `Effect`
- `Action`
- `Resource`
- optional `Condition`

Conditions are where policies become more precise. They let you say not only which action is allowed, but under which circumstances. For example, a policy might require MFA, restrict access to certain source networks, or permit actions only when resource tags match expected values.

Example shape:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::my-learning-bucket/*"]
    }
  ]
}
```

You do not need to memorize every policy detail early, but you must understand the model.

The main risk pattern is over-broad scope. If `Action` or `Resource` expands farther than intended, the policy may technically work while still violating least privilege badly.

---

## 3.6 Managed Policies vs Inline Policies

### Managed Policies

Managed policies are reusable permission documents.

They can be:

- AWS managed
- customer managed

These are easier to reuse and update across multiple identities.

### Inline Policies

Inline policies are attached directly to one principal and usually serve a narrow purpose.

Use them sparingly. Reusable customer-managed policies are usually easier to maintain.

That is mainly an operations decision. Reusable managed policies make review, updates, and consistent permission boundaries easier across many identities.

---

## 3.7 Why Roles Matter More Than Beginners Expect

Roles are central to secure AWS design.

Examples:

- An EC2 instance assumes a role to read secrets.
- A Lambda function assumes a role to publish to SNS.
- An engineer assumes an admin role temporarily instead of storing permanent admin keys.

This pattern avoids embedding long-term credentials in files, code, or servers.

It also enables better separation of concerns. The application runtime can receive only the permissions it needs, and engineers can assume stronger permissions only when the task justifies it.

### Cross-account access pattern

Cross-account access is a normal operating model in AWS.

Example:

- an engineer signs in through IAM Identity Center
- assumes a read-only role in production
- assumes a broader role in a sandbox account

This keeps permissions scoped to the account and task instead of concentrating every permission in one identity.

Under the hood, AWS Security Token Service, or STS, issues temporary credentials when a role is assumed.

That temporary credential model is one of the most important AWS security defaults. Short-lived credentials reduce exposure time and make credential handling safer than permanent keys stored in many places.

![Cross-account role assumption flow with IAM Identity Center and STS](images/ch03-cross-account-role-assumption-flow.svg)

*Figure: Workforce users authenticate through an external identity provider, receive account-role access via IAM Identity Center, and use STS-issued temporary credentials to operate in target accounts with scoped permissions.*

---

## 3.8 Multi-Factor Authentication and Temporary Credentials

Strong access control is not only about permissions. It is also about credential quality.

Important practices:

- enable MFA for privileged users
- avoid long-lived access keys where possible
- prefer temporary credentials through roles
- rotate credentials that must exist

Console and API access also need observability. Access control is stronger when you can answer which principal assumed which role, when the session happened, and what actions followed.

Permanent keys are easy to leak. Temporary credentials reduce the exposure window.

### Access analysis and debugging

Solutions architects should know the basic tools for permission troubleshooting:

- IAM Policy Simulator to test whether a policy should allow an action
- IAM Access Analyzer to identify broad or unintended access
- CloudTrail to confirm which principal called which API

Good architecture includes operability, including access debugging.

This is a practical point, not a theory point. If a team cannot explain why access was granted or denied, security becomes slower and less reliable.

---

## 3.9 Common IAM Mistakes

- granting wide permissions to move faster
- attaching permissions without understanding the role's trust policy
- using the root user instead of roles or named identities
- hard-coding access keys into code or configuration files
- attaching permissions to the wrong resource scope
- forgetting that explicit deny overrides allow
- using IAM users for workforce access when federation is available
- assuming one allow policy is enough without checking SCPs, boundaries, or resource policies
- forgetting that SCPs or permission boundaries can block apparently valid access

---

## 3.10 A Simple Access Design Pattern

For a small team, a clean starter model looks like this:

1. Human users authenticate through a secure identity workflow.
2. Developers get scoped permissions through groups or roles.
3. Workloads use roles instead of static access keys.
4. Read-only access is separated from administrative access.
5. Sensitive actions require stronger review and tighter scope.

This pattern becomes stronger when role names, account boundaries, and permission scopes are predictable. Consistency helps both security review and incident response.

This is simple, scalable, and much safer than ad hoc permission grants.

For multi-account environments, add one more rule: use cross-account roles rather than duplicating identities and secrets in every account.

---

## 3.11 Hands-On Tasks

1. Open IAM and identify users, groups, roles, and policies in the console.
2. Read one AWS managed policy and explain what it grants.
3. Create a basic group structure on paper for `Admin`, `Developer`, and `ReadOnly`.
4. Inspect a sample policy and identify the action and resource scope.
5. List two places where roles are safer than long-term access keys.
6. Explain when a bucket policy is needed in addition to an IAM policy.
7. Sketch a cross-account access flow using IAM Identity Center and STS.
8. Identify the trust side and the permission side of one example role.
9. Describe one example where an explicit deny should be used deliberately.
10. Explain how you would troubleshoot an access denial when the identity policy looks correct at first glance.

---

## 3.12 Recap

- IAM controls access to AWS resources.
- Users, groups, roles, and policies solve different access-control problems.
- Permissions start with deny, allows grant access, and explicit deny wins.
- Least privilege is the default security principle, but it must be applied iteratively and reviewed over time.
- Roles and temporary credentials are safer than hard-coded long-term keys, and trust policies are as important as permission policies.
- Solutions architects should also understand federation, resource-based policies, and layered permission controls across multiple accounts.

Next: use the console, CLI, and SDKs correctly so you can work with AWS interactively, from scripts, and from applications.
# 4: Console, CLI, and SDK Workflow

There are three common ways to work with AWS: the web console, the Command Line Interface (CLI), and Software Development Kits (SDKs). They all talk to the same AWS services, but each one fits a different kind of task.

This chapter shows when to use each approach in practice. The console is useful for learning and inspection, the CLI is useful for repeatable operator tasks, and SDKs are how applications call AWS services directly in code.

---

## 4.1 The Three Access Modes

AWS work usually happens through one of these interfaces:

- Console for visual exploration and service configuration
- CLI for repeatable terminal-based operations
- SDKs for application code and automation inside programs

They solve different problems. Strong AWS workflow means using the right interface at the right time.

This is not only a productivity decision. It is also a safety decision. The interface you choose affects repeatability, auditability, error rate, and how easily the work can be reviewed or reproduced later.

![Console, CLI, and SDK shared API path](images/ch04-shared-api-access-path.svg)

*Figure: Console, CLI, and SDK differ in workflow ergonomics, but all ultimately rely on credentials, signed requests, and AWS service APIs/endpoints.*

---

## 4.2 When to Use the Console

The AWS Management Console is best for:

- learning a service for the first time
- inspecting current resource state
- reviewing dashboards, logs, and policy details
- performing guided setup for unfamiliar services

The console is useful, but it is not ideal for repeated operational tasks. Manual clicks do not scale well.

The console can also hide important details if you rely on it too heavily. It is excellent for learning and inspection, but it is weaker as a durable system of record for repeated changes.

AWS CloudShell is also useful for lightweight console-adjacent command execution when you need temporary shell access inside the AWS web environment.

---

## 4.3 When to Use the CLI

The AWS CLI is best for:

- repeatable commands
- scripting
- automation in shell workflows
- quick inspection of configuration and outputs

Example command:

```bash
aws s3 ls
```

The CLI helps you move from manual actions to reliable workflows.

It also makes it easier to script validation steps, gather machine-readable outputs, and rerun known procedures consistently. That is why CLI literacy becomes important long before a team adopts full infrastructure as code.

---

## 4.4 When to Use SDKs

AWS SDKs are used when your application code needs to call AWS services directly.

Examples:

- a Java service writing to DynamoDB
- a Python script uploading files to S3
- a Node.js Lambda function publishing to SNS

SDKs are for program logic, not only infrastructure setup.

That distinction matters. If a task belongs inside application behavior, the SDK is appropriate. If it is a one-off operator action or a provisioning step, putting it in application code may create the wrong dependency boundary.

---

## 4.5 Basic CLI Setup

A normal starter workflow looks like this:

1. Install the AWS CLI.
2. Configure credentials and default region.
3. Test identity and access.

Common configuration command:

```bash
aws configure
```

Useful verification command:

```bash
aws sts get-caller-identity
```

This confirms which AWS identity your CLI is actually using.

That identity check should become habit. Many costly AWS mistakes are not syntax problems. They are wrong-account or wrong-region problems.

For workforce access in modern AWS environments, `aws configure sso` is often preferred over storing long-lived access keys.

![Safe CLI mutation workflow](images/ch04-cli-safe-change-workflow.svg)

*Figure: Before mutating commands, explicitly select profile and region, verify identity, then execute only after target checks pass.*

---

## 4.6 Profiles and Environments

Do not force every task to use a single default profile.

Profiles help separate:

- personal learning account access
- sandbox access
- production access
- different roles or regions

Example:

```bash
aws s3 ls --profile learning
```

Profile separation reduces mistakes, especially when you later work across multiple accounts.

It also reduces mental load. Clear profile names make it easier to stop and verify intent before running a command that changes infrastructure.

For architect workflows, profiles often map to assumed roles such as `sandbox-admin`, `prod-readonly`, or `shared-services-ops`.

That naming pattern is useful because it encodes both environment and privilege level. A profile named `prod-readonly` is much easier to reason about safely than a generic `default` profile used for everything.

---

## 4.7 Output, Querying, and Scripting

The CLI becomes much more useful when you shape its output.

Common patterns:

- human-readable tables for quick review
- JSON output for automation
- filtered output for scripts

Choosing the right output format matters. Commands meant for humans and commands meant for automation should not be treated the same way.

Example:

```bash
aws ec2 describe-instances --output json
```

CLI workflows become powerful when combined with shell scripting, but always verify the target account and region before running mutating commands.

Scripts also need operational discipline. They should fail clearly, log intent, and avoid hidden assumptions about the active profile or default region.

Architects should also be comfortable with:

- `--query` for extracting only needed fields
- pagination behavior on large result sets
- explicit `--region` usage when commands must not depend on defaults
- tagging commands and outputs so automation remains traceable

These details matter because automation often fails at edges: unexpected pagination, missing filters, wrong region defaults, or scripts that parse human-formatted output instead of stable machine-readable output.

---

## 4.8 How SDK Credentials Usually Work

SDKs usually do not require you to hard-code credentials directly in source code.

Good patterns:

- local development uses configured profiles or environment-based credentials
- EC2 uses instance roles
- Lambda uses execution roles
- containers use task roles or equivalent runtime identity

This usually works through a credential provider chain. The SDK checks several possible credential sources in a defined order and uses the first valid one it finds.

This connects directly to the IAM chapter: secure access comes from roles and temporary credentials.

SDK workflows also require a few architectural habits:

- use the default credential provider chain instead of hard-coded secrets
- design for retries and exponential backoff when APIs throttle
- handle idempotency where repeated API calls must not duplicate outcomes
- log request context carefully without exposing secrets

That provider-chain behavior is useful, but it can also surprise teams. If the runtime picks up credentials from an unexpected environment variable or local profile, the application may talk to the wrong account without obvious signs.

![SDK credential provider chain](images/ch04-sdk-credential-provider-chain.svg)

*Figure: SDKs select the first valid credential source in the provider chain, so precedence and runtime identity design are critical.*

---

## 4.9 Choosing the Right Interface

Use this decision model:

### Choose console when

- you are learning
- you need visual inspection
- you are validating settings manually

### Choose CLI when

- the task is repeated
- you want auditability in scripts
- you need fast terminal operations
- you need structured outputs for follow-up automation or validation

### Choose SDK when

- an application must call AWS during runtime
- business logic depends on AWS responses
- the task belongs inside software, not in a shell command

The architect question is not, "Which tool can do this?" It is, "Which interface puts this responsibility in the right place?"

### One more architect rule: provision through code

Even though infrastructure as code is covered later, a solutions architect should adopt the principle early:

- use the console for learning and inspection
- use the CLI for repeatable operations and validation
- use SDKs for application runtime behavior
- use infrastructure as code for durable provisioning changes

This reduces click-ops drift and makes reviews, rollback, and audit much easier.

The usual maturity path looks like this:

- console for learning and inspection
- CLI for repeatable operator workflows
- SDK for runtime service integrations
- infrastructure as code for durable provisioning changes

The earlier that pattern becomes normal, the easier later automation work becomes.

![AWS interface selection workflow](images/ch04-console-cli-sdk-decision-workflow.svg)

*Figure: Use console for learning, CLI for repeatable operations, SDK for runtime application behavior, and IaC for durable provisioning changes.*

---

## 4.10 Common Mistakes

- hard-coding credentials in application code
- forgetting to verify the active account and region
- using one default profile for every environment and privilege level
- relying on console-only workflows for repeatable operations
- using a default profile blindly across environments
- treating CLI automation as safe without reviewing permissions
- parsing human-readable CLI output in scripts instead of stable machine-readable output
- making production infrastructure changes manually when they should be codified
- assuming the SDK is using the intended credentials without understanding provider-chain precedence
- ignoring API throttling and retry behavior in SDK-based integrations

---

## 4.11 Hands-On Tasks

1. Install the AWS CLI.
2. Run `aws configure` for a learning profile.
3. Run `aws sts get-caller-identity` and inspect the result.
4. List S3 buckets or another harmless read-only resource.
5. Explain one task better suited to the console, one to the CLI, and one to an SDK.
6. Describe a safe profile strategy for sandbox, production read-only, and production admin access.
7. Explain why infrastructure provisioning should eventually move to IaC instead of console-only changes.
8. Run a harmless read-only command with an explicit profile and region, then explain what safety problem that avoids.
9. Describe one case where JSON output is the right choice and one where table output is enough.
10. Explain how an SDK running on EC2 should obtain credentials without storing access keys on disk.

---

## 4.12 Recap

- The console is best for exploration and visual inspection.
- The CLI is best for repeatable commands and automation.
- SDKs are for runtime access inside application code and should normally rely on credential provider chains and temporary credentials.
- Profiles, identity checks, and region awareness prevent common wrong-account and wrong-region mistakes.
- Secure workflows depend on IAM roles and temporary credentials, not hard-coded secrets.
- Solutions architects also treat repeatability, auditability, and multi-account safety as first-class workflow requirements.

Next phase: start building real infrastructure with networking and compute services such as VPC and EC2.
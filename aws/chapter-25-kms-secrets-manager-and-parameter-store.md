# 25: KMS, Secrets Manager, and Parameter Store

Applications need encryption keys, secrets, and configuration values, but they should not store them directly in code. AWS Key Management Service (AWS KMS), AWS Secrets Manager, and AWS Systems Manager Parameter Store help teams handle sensitive data in safer and more manageable ways.

This chapter explains what each service is for and why mixing them up causes bad designs. You will learn how they are used for encryption, credentials, tokens, and configuration, and how the right choice improves security, rotation, and operational control.

---

## 25.1 Why These Services Matter

Every AWS workload eventually faces the same questions:

- How do we encrypt data?
- Where do we store credentials?
- How do applications read configuration safely?
- How do we rotate secrets without changing code manually?

Weak answers lead to familiar failures: secrets committed into repositories, plaintext passwords in environment files, inconsistent encryption standards, and unclear ownership of sensitive values.

AWS separates these concerns intentionally:

- KMS manages encryption keys and cryptographic policy controls.
- Secrets Manager stores and rotates secrets.
- Parameter Store stores configuration values and can also hold sensitive parameters.

If you use one service for the wrong purpose, you often get either unnecessary complexity or insufficient control.

---

## 25.2 AWS KMS Fundamentals

AWS Key Management Service, or KMS, manages cryptographic keys used across many AWS services and custom applications.

KMS matters because most teams should not build low-level key management themselves. Key creation, access control, auditability, rotation policy, and service integration are all security-critical.

KMS keys are commonly used for:

- S3 object encryption
- EBS volume encryption
- RDS encryption at rest
- encrypting application data
- protecting secrets stored in other AWS services

KMS does not usually store your business secrets directly. It stores and governs the keys that encrypt or decrypt data.

That distinction is important. A key and a secret are not the same thing. A key protects data cryptographically. A secret is itself sensitive data, such as a database password, API token, or signing credential.

---

## 25.3 KMS Keys, Policies, and Usage Model

KMS design is built around access control and usage context.

Important concepts include:

- customer managed keys, which you control more directly
- AWS managed keys, which AWS services create and manage for you in simpler scenarios
- key policies and IAM permissions that determine who can use a key and how
- envelope encryption, where a data key encrypts the payload and the KMS key protects that data key

Customer managed keys are common when you need clear ownership, fine-grained control, explicit policy review, or cross-service consistency. AWS managed keys are simpler but less customizable.

Architecturally, key access should usually be granted to roles and services that need it, not to broad human identities. If many people can use a production key directly, key governance is already too loose.

You should also distinguish between permissions to administer a key and permissions to use a key. Those are different responsibilities.

---

## 25.4 Secrets Manager Fundamentals

Secrets Manager is designed for secret values that applications or operators need to retrieve securely.

Typical examples include:

- database credentials
- API tokens
- third-party service keys
- application signing secrets
- credentials that need regular rotation

Secrets Manager is most valuable when the secret lifecycle matters, not only secret storage.

That lifecycle includes:

- secure creation
- controlled access
- retrieval by authorized applications
- version tracking
- rotation

In other words, Secrets Manager is not just a hidden key-value store. It is an operational workflow for secrets.

---

## 25.5 Rotation and Application Integration

Secret rotation is one of the strongest reasons to use Secrets Manager.

For secrets that support automated rotation, the service can update the secret on a defined schedule and coordinate the lifecycle needed for applications or databases.

Rotation reduces the damage window if a credential is exposed. It also reduces the long-term operational risk of forgotten static credentials that remain valid for years.

Applications should retrieve secrets at runtime through approved identities such as:

- Lambda execution roles
- EC2 instance roles
- ECS task roles
- EKS workload identities or comparable patterns

Avoid copying secrets into code, AMIs, container images, or long-lived local files. Those shortcuts usually survive far longer than intended.

There is still an application design question: how often should a secret be fetched? Fetching every request may be wasteful. Caching forever defeats rotation. Good designs use bounded caching with refresh logic appropriate to the rotation model and outage tolerance.

---

## 25.6 Parameter Store Fundamentals

Systems Manager Parameter Store is a configuration store for application and infrastructure parameters.

It is commonly used for:

- environment configuration values
- feature flags or operational toggles
- service endpoint settings
- AMI identifiers and deployment parameters
- sensitive values stored as secure strings in simpler scenarios

Parameter Store is often a good fit when you need hierarchical configuration and do not require the richer rotation and secret-management lifecycle that Secrets Manager provides.

Examples:

- `/prod/payments/api/base-url`
- `/shared/network/vpc-id`
- `/sandbox/app/log-level`

That path-based organization helps teams manage configuration consistently across environments.

---

## 25.7 How to Choose Between Secrets Manager and Parameter Store

![Decision model for KMS, Secrets Manager, and Parameter Store across encryption, rotation, config storage, access control, and audit needs.](images/ch25-kms-secrets-parameter-decision.svg)

The services overlap, but they are not interchangeable in intent.

Choose Secrets Manager when:

- the value is a true secret
- rotation matters
- secret versioning and lifecycle controls matter
- the operational cost of stale credentials is high

Choose Parameter Store when:

- the value is configuration rather than a credential
- you need hierarchical naming and broad environment parameter management
- secret rotation is not the primary requirement
- you want a simpler configuration distribution model

Use KMS alongside both when encryption and access control of the underlying values is required.

The mistake to avoid is flattening everything into a single generic store. Configuration, secrets, and keys have different ownership models and different operational consequences.

---

## 25.8 Encryption, Access Control, and Auditability

All three services are only as strong as their access model.

Good practices include:

- granting read access only to workload identities that truly need the value
- separating administrative privileges from consumption privileges
- using least-privilege IAM and key policies
- reviewing who can decrypt, retrieve, or modify sensitive entries
- logging and auditing changes and access patterns where relevant

Encryption at rest is important, but it is not enough. A value can be encrypted perfectly and still be exposed if too many roles can decrypt or retrieve it.

Architects should also think about failure modes. If an application depends on retrieving secrets or parameters at startup, what happens if IAM is misconfigured or a regional dependency becomes unavailable? Security design and availability design intersect here.

---

## 25.9 Solutions Architect Decision Patterns

During design review, ask:

- What values are keys, what values are secrets, and what values are just configuration?
- Which identities need read access, and which identities need administrative control?
- Does any application still rely on hard-coded credentials or static local config files?
- Which secrets should rotate automatically?
- Are cross-account or cross-environment access patterns intentional and reviewable?
- Can the workload tolerate temporary failure to retrieve a secret or parameter?

This checkpoint often reveals hidden risk. Many teams think they have a secret-management strategy when they really have a collection of encrypted plaintext values with unclear ownership.

---

## 25.10 Common Mistakes

- storing secrets directly in source code, `.env` files, AMIs, or container images
- using broad IAM permissions that let many roles decrypt or retrieve sensitive values
- treating KMS as if it were a full secret store instead of a key-management service
- storing large volumes of application configuration in ad hoc files rather than in a managed parameter hierarchy
- choosing Parameter Store for secrets that require frequent rotation and tighter lifecycle management
- enabling encryption but ignoring who can actually read the decrypted value
- failing to separate production secret access from lower-environment access
- rotating secrets without making sure applications can refresh them safely

---

## 25.11 Hands-On Tasks

1. Classify these items as key, secret, or configuration value: an S3 encryption key, a database password, an API endpoint URL, and a JWT signing secret.
2. Design a Parameter Store hierarchy for one application across sandbox, staging, and production.
3. Explain when Secrets Manager is a better choice than Parameter Store for application credentials.
4. Describe who should be allowed to administer a KMS key versus who should only use it.
5. Sketch a safe secret-retrieval pattern for a Lambda function or containerized service.

---

## 25.12 Recap

KMS manages encryption keys, Secrets Manager manages secret values and their lifecycle, and Parameter Store manages configuration values with optional secure storage for simpler sensitive data. Strong AWS designs distinguish among these concerns instead of forcing one service to solve every problem. The result is clearer ownership, safer access control, and less exposure of sensitive information in application code and operations.

Next: 26: WAF, Shield, and Cognito

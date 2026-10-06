# 18: ECR

Amazon Elastic Container Registry (Amazon ECR) stores container images for deployment on AWS. It gives teams a central place to push, version, scan, and manage the artifacts that container platforms pull at runtime.

This chapter explains why image management is part of a secure delivery pipeline, not just a storage task. You will learn how repositories, tags, digests, lifecycle policies, and scanning help teams ship containers in a more repeatable and production-safe way.

---

## 18.1 Why ECR Matters

Containerized systems need a reliable place to store images before deployment.

That image registry is not just a file store. It is part of the software supply path.

If image storage is unmanaged or inconsistent, teams run into problems such as:

- unclear image versions in production
- weak access control around deployment artifacts
- stale or vulnerable images lingering indefinitely
- unreliable promotion between environments

Amazon Elastic Container Registry, or Amazon ECR, is AWS's managed container image registry.

It gives AWS-native workflows a place to push, store, scan, and pull images for services such as ECS, EKS, and some Lambda container-image deployments.

For a solutions architect, ECR matters because deployment reliability starts before runtime. You need to know exactly what artifact is being shipped, who can publish it, and how that artifact is controlled across environments.

---

## 18.2 Repositories, Tags, and Digests

ECR organizes images into repositories.

Each repository holds image manifests and layers for one application or component family.

There are two ways people commonly identify images:

- tags, such as `v1.4.2` or `prod`
- digests, which uniquely identify the exact image content

Tags are convenient, but they are mutable unless you enforce immutability policies. Digests are stronger for precise deployment because they refer to one exact artifact.

This distinction matters in production.

If an environment deploys `latest`, you may not actually know what code is running without additional investigation. If an environment deploys a digest, the artifact identity is explicit.

Architecturally, strong delivery pipelines usually treat:

- tags as human-friendly labels
- digests as the immutable truth for what is deployed

That mindset reduces ambiguity during rollback, incident response, and audit review.

---

## 18.3 Image Push and Pull Workflow

The typical ECR workflow looks like this:

1. Build a container image.
2. Authenticate to ECR.
3. Push the image to a repository.
4. Reference that image from ECS, EKS, or another runtime.

The technical steps are straightforward, but the operational questions matter more:

- who is allowed to push images
- which pipeline or role should publish them
- how environments decide what artifact is approved
- whether production pulls by tag or by digest

In strong delivery systems, developers do not push ad hoc production artifacts from laptops. Publishing usually happens through controlled build pipelines with consistent identity and logging.

That improves repeatability and reduces supply-chain risk.

---

## 18.4 Access Control and Repository Security

ECR repositories are protected through IAM and repository policies.

You should separate at least three kinds of access:

- who can push images
- who can pull images
- who can administer repository settings and policies

This matters in multi-environment and multi-account setups.

For example:

- a build pipeline in one account may push images
- a runtime service in another account may only pull approved images
- security or platform teams may control repository policy and replication configuration

Encryption at rest is managed by AWS, but security still depends on identity design and operational discipline.

Good practice includes:

- least-privilege roles for publishers and deployers
- separation of build and runtime permissions
- avoiding manual long-lived credentials for registry access
- controlled cross-account pull permissions where needed

The registry is part of your deployment trust boundary, not just a developer convenience tool.

---

## 18.5 Vulnerability Scanning and Image Hygiene

Container registries accumulate risk if images are built once and then forgotten.

ECR supports vulnerability scanning capabilities that help teams identify known issues in pushed images.

Scanning is useful, but it is only one layer of image hygiene. You also need:

- small base images where practical
- regular rebuilds to pick up patched dependencies
- clear ownership of repositories
- removal of unused or outdated images

An important nuance is that a scan result is not a full security decision by itself.

Architects and operators still need to ask:

- is the vulnerable package reachable in the actual workload
- has the base image been refreshed recently
- is this image still deployable under release policy

The correct response is not panic or indifference. It is controlled artifact hygiene.

---

## 18.6 Lifecycle Policies, Immutability, and Promotion

![ECR image lifecycle from CI build and immutable digest push through vulnerability scanning, promotion, and lifecycle cleanup.](images/ch18-ecr-image-lifecycle.svg)

Without cleanup rules, ECR repositories grow indefinitely.

Lifecycle policies help remove old images according to rules such as tag prefixes, age, or image count.

That saves storage cost and keeps repositories easier to manage.

Immutability is equally important. If a tag can be overwritten freely, the same tag can mean different code at different times.

Production-aware teams often use one or both of these patterns:

- immutable versioned tags, such as semantic version tags or build IDs
- deployment by digest even when tags remain available for human reference

Promotion strategy also matters. You can either:

- rebuild separately per environment, which may create artifact drift
- build once and promote the same tested artifact across environments, which usually improves consistency

The second model is often more trustworthy because test and production use the same artifact identity.

---

## 18.7 Integration with ECS, EKS, Lambda, and CI/CD

ECR is rarely the end of the story. It sits between build and runtime.

Common integrations include:

- ECS services pulling images during task launch
- EKS workloads referencing images in Pod specs
- CI/CD pipelines pushing tested build artifacts to a repository
- Lambda functions deployed from container images in some cases

This makes naming and versioning strategy important.

If the registry structure does not reflect application boundaries clearly, deployment configuration becomes confusing. Teams should be able to answer quickly:

- which repository holds which workload
- which pipeline publishes to it
- which runtime consumes it
- which image version is currently deployed

ECR works best when those artifact boundaries are aligned with deployment ownership.

---

## 18.8 Replication, Availability, and Cost Considerations

Artifact availability can become a deployment dependency.

If you operate in multiple regions or accounts, replication strategy may matter for:

- deployment speed
- regional isolation
- central platform governance

Cost is usually not the hardest part of ECR, but it still exists through:

- stored image layers
- data transfer patterns
- duplicated artifacts across regions or accounts

Architects should also think about operational availability:

- what happens if the pipeline cannot push new images
- whether the runtime depends on pulling images during scale-out events
- whether image layers are being rebuilt too often due to poor Dockerfile structure

Registry design is not usually the hardest AWS problem, but weak registry discipline creates repeated delivery friction.

---

## 18.9 ECR Design Patterns and Decision Criteria

ECR is a strong fit when your container workloads already run on AWS and you want a managed, IAM-integrated registry.

Useful design patterns include:

- one repository per deployable service or component family
- build once, promote the same artifact across environments
- deploy by digest for strong artifact identity
- use lifecycle policies to control repository growth

An architect checkpoint should review:

- how images are named and versioned
- whether tag immutability is enforced where needed
- how scanning results influence release decisions
- whether cross-account and cross-region access is deliberate
- whether deployment systems reference trusted artifacts precisely

If artifact identity is unclear, the delivery system is weaker than it appears.

---

## 18.10 Common Mistakes

- deploying mutable tags such as `latest` without clear artifact traceability
- allowing broad push access instead of controlled pipeline publishing
- treating vulnerability scans as optional background noise
- keeping old images forever and never applying lifecycle policies
- rebuilding different artifacts per environment when one tested artifact should be promoted
- failing to separate image-push and image-pull permissions
- using unclear repository naming that hides ownership and workload boundaries
- ignoring cross-account or cross-region pull design until deployment time
- assuming the registry is not part of the software supply-chain security boundary
- storing images successfully but lacking a reliable record of what digest is running in production

---

## 18.11 Hands-On Tasks

1. Create an ECR repository for a sample application.
2. Build a small container image and push it to that repository.
3. Pull the image by tag and then identify its digest.
4. Enable or review image scanning and inspect the reported results.
5. Add a lifecycle policy that removes old unneeded images.
6. Describe whether your deployment system should reference the image by tag or digest and why.
7. Sketch a promotion flow from dev to staging to production using the same image artifact.
8. Explain which roles should be allowed to push images and which should only pull them.

---

## 18.12 Recap

- ECR is the managed container registry layer for AWS container delivery workflows.
- Repositories, tags, and digests define how image artifacts are stored and identified.
- Strong production workflows publish images through controlled pipelines and deploy trusted artifacts precisely.
- Scanning, lifecycle policies, and tag immutability improve security and artifact hygiene.
- ECR integrates with ECS, EKS, Lambda container images, and CI/CD pipelines.
- Clear artifact identity and access boundaries are core delivery requirements, not optional cleanup details.

Next: 19: ECS and Fargate

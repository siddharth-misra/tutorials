# 20: EKS Basics

Amazon Elastic Kubernetes Service (Amazon EKS) is AWS's managed Kubernetes platform. It runs the Kubernetes control plane for you, but you still need to understand how Kubernetes works and what operating responsibilities remain.

This chapter explains where EKS fits and why teams choose it. You will learn the basics of how workloads run on Kubernetes, how networking and identity affect cluster design, and why EKS is powerful but more operationally demanding than simpler AWS compute options.

---

## 20.1 Why EKS Matters

Some teams need more than a managed container runtime. They need the Kubernetes ecosystem, API model, and workload portability that comes with it.

Amazon Elastic Kubernetes Service, or Amazon EKS, provides a managed Kubernetes control plane on AWS.

This matters when teams want:

- Kubernetes-native tooling and patterns
- workload portability across environments
- ecosystem integrations built around the Kubernetes API
- fine-grained orchestration behavior beyond simpler container platforms

But EKS is not "containers, but better" by default. It introduces more moving parts and a larger operational surface than ECS.

For a solutions architect, the important question is not whether Kubernetes is popular. It is whether the system and the organization truly benefit from Kubernetes-level flexibility enough to justify the extra complexity.

---

## 20.2 What EKS Manages and What You Still Manage

EKS manages the Kubernetes control plane for you.

That reduces the burden of running core control-plane components, but it does not remove cluster operations entirely.

You still need to think about:

- worker node strategy or serverless pod execution models where applicable
- cluster upgrades
- networking and ingress setup
- observability
- identity mapping
- workload security and multi-tenant boundaries

This is a key architectural nuance.

EKS is managed Kubernetes, not no-operations Kubernetes.

If a team adopts EKS assuming AWS will make every cluster concern disappear, they usually discover the real complexity later during upgrades, incident response, or platform standardization.

---

## 20.3 Core Kubernetes Objects You Need to Understand

To use EKS responsibly, you need a working mental model of the main Kubernetes primitives.

Important concepts include:

- Pods as the smallest deployable compute units
- Deployments for managing replicated stateless workloads
- Services for stable network access inside the cluster
- Ingress or load-balancing mechanisms for external access
- ConfigMaps and Secrets for configuration and sensitive values
- Namespaces for logical separation

These concepts are powerful, but they are also a source of confusion for teams new to Kubernetes.

The architect should care less about memorizing every object type and more about understanding how declarative desired state, reconciliation, and cluster networking fit together.

Without that mental model, debugging cluster behavior becomes guesswork.

---

## 20.4 Worker Nodes, Scheduling, and Pod Placement

Kubernetes schedules pods onto worker capacity.

In EKS, that capacity may be managed through node groups or other supported execution approaches depending on the chosen operating model.

This introduces several production concerns:

- instance sizing and node efficiency
- pod resource requests and limits
- scheduling behavior when nodes fill up
- isolation for different workload classes

If resource requests are unrealistic, scheduling becomes unreliable. If limits are missing entirely, noisy workloads can damage cluster stability.

The scheduler is powerful, but it depends on good workload declarations. Architects should expect platform standards around resource settings, placement rules, and environment separation.

---

## 20.5 Networking, Ingress, and Service Connectivity

![EKS service path diagram showing ingress entry, service routing, pod placement across nodes, and cluster network boundaries.](images/ch20-eks-networking-and-service-path.svg)

Kubernetes networking adds another abstraction layer on top of the AWS VPC model.

That means EKS teams need to understand both:

- AWS networking boundaries such as subnets, route tables, and security groups
- Kubernetes service connectivity and ingress patterns

Important design questions include:

- how external traffic reaches workloads
- how internal services discover each other
- whether ingress is centralized or per-application
- how network isolation is enforced between workloads and namespaces

Because EKS sits inside AWS networking, bad VPC design still causes trouble. Kubernetes does not replace foundational network architecture. It adds more networking decisions on top of it.

---

## 20.6 Identity, Security, and Multi-Tenancy

Cluster security is one of the most important reasons not to adopt Kubernetes casually.

In EKS, you need to think about:

- who can administer the cluster
- how workloads access AWS services
- what separation exists between teams or applications sharing a cluster
- how secrets are stored and consumed

This usually involves a mix of AWS IAM, Kubernetes RBAC, and workload identity patterns.

That layered model is powerful, but it can become confusing if ownership boundaries are unclear.

Security concerns also include:

- container image trust
- namespace and admission controls
- pod-to-pod traffic boundaries
- minimizing cluster-admin style privileges

Multi-tenant clusters can work, but they require mature governance. Without it, a shared cluster becomes a policy problem disguised as a cost optimization.

---

## 20.7 Upgrades, Add-Ons, and Operational Overhead

Kubernetes platforms require lifecycle management.

Even with a managed control plane, teams still face work around:

- version upgrades
- add-on compatibility
- ingress and DNS components
- autoscaling behavior
- cluster and node maintenance

This is where many EKS programs either mature or struggle.

A cluster is not a one-time setup task. It is a platform product that needs ownership. If no team owns its upgrade cadence, baseline policies, and standard tooling, the cluster becomes harder to operate over time.

Architects should treat EKS as a platform decision, not just an application deployment choice.

---

## 20.8 Observability, Cost, and Platform Fit

EKS requires strong observability because failures can happen at several layers:

- application layer
- pod and deployment layer
- node layer
- networking and ingress layer
- cluster control integration layer

That means logging, metrics, tracing, and alerting need to be designed as part of the platform.

Cost also includes more than raw compute. It includes:

- cluster management overhead
- operator time
- supporting tooling and add-ons
- underutilized node capacity if workloads are packed poorly

The question is not only whether EKS can run the workload. It is whether the organization will operate it well enough to justify the platform cost and complexity.

---

## 20.9 EKS Design Patterns and Decision Criteria

EKS is a strong fit when Kubernetes itself is the requirement.

Good reasons include:

- organizational standardization on Kubernetes
- need for Kubernetes-native operators or custom resource patterns
- multi-environment portability where Kubernetes skills and tooling are already mature
- workload sets that benefit from the broader Kubernetes ecosystem

Weak reasons include:

- using EKS just because containers are involved
- assuming EKS is automatically more scalable or more modern than ECS for every use case

An architect checkpoint should ask:

- what concrete capability requires Kubernetes
- who owns the cluster platform operationally
- how multi-tenant boundaries will be enforced
- how upgrades and add-ons will be managed
- whether ECS or Fargate would solve the same problem with less operational burden

If those answers are weak, EKS is probably being chosen too early.

---

## 20.10 Common Mistakes

- choosing EKS because Kubernetes is popular rather than because it is truly required
- assuming a managed control plane removes the need for platform ownership
- underestimating networking and ingress complexity
- treating IAM and Kubernetes RBAC as interchangeable instead of layered controls
- running shared clusters without clear tenancy, namespace, and access boundaries
- skipping resource requests and limits, leading to unstable scheduling behavior
- ignoring upgrade and add-on lifecycle planning
- lacking centralized observability across pods, nodes, and ingress layers
- moving a simple workload to EKS when ECS or Lambda would be operationally simpler
- treating Kubernetes knowledge gaps as minor details that can be learned later during production incidents

---

## 20.11 Hands-On Tasks

1. Create or inspect an EKS cluster and identify which components AWS manages versus which your team must operate.
2. Deploy a simple application using a Deployment and Service.
3. Expose that application through an ingress or load-balancing pattern and trace the request path.
4. Define resource requests and limits for the workload and explain why they matter.
5. Map one application workload to the AWS permissions it needs and describe how workload identity should be handled.
6. List the baseline observability capabilities your EKS platform would need before production use.
7. Compare the same workload on EKS versus ECS and explain which platform you would choose.
8. Describe a realistic reason your organization would adopt EKS and one weak reason it should reject.

---

## 20.12 Recap

- EKS provides a managed Kubernetes control plane, but teams still own significant platform operations work.
- Kubernetes primitives such as Pods, Deployments, Services, and Ingress shape how workloads run and communicate.
- EKS adds Kubernetes-level flexibility, but also more networking, identity, upgrade, and observability complexity.
- Security requires layered thinking across IAM, Kubernetes RBAC, workload identity, and cluster policy.
- EKS is the right choice when Kubernetes is a genuine requirement, not just when containers are present.
- Platform ownership and operational maturity determine whether EKS becomes an asset or a burden.

Next: 21: Infrastructure as Code

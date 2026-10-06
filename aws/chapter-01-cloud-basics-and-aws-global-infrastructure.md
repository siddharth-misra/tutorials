# 1: Cloud Basics and AWS Global Infrastructure

Amazon Web Services (AWS) is a cloud computing platform that gives you infrastructure, storage, networking, databases, and many other managed services on demand. Before learning individual AWS services, you need a clear picture of the cloud model itself and of the physical and logical structure AWS uses to deliver it.

In simple terms, this chapter explains what cloud computing is, why organizations choose it, and how AWS organizes its global infrastructure through Regions, Availability Zones, and edge locations. This matters because almost every later architecture decision depends on these basics: where you deploy, how you design for failure, who manages which layer, and how you think about availability, latency, and recovery.

You can think of this chapter as the foundation for the rest of the roadmap. It shows how AWS works at a high level, why the shared responsibility model is important, and how the platform is built to support resilient systems before you move into specific services such as Amazon Elastic Compute Cloud (Amazon EC2), Amazon Simple Storage Service (Amazon S3), or AWS Lambda.

---

## 1.1 Why Cloud Computing Matters

Cloud computing gives you on-demand infrastructure instead of requiring you to buy and manage physical servers yourself.

The key shift is not only technical. It is operational and financial:

- You provision resources in minutes instead of waiting for hardware.
- You pay for usage instead of large upfront purchases.
- You scale up and down with demand.
- You outsource part of the infrastructure management to AWS.

That changes how teams plan work. In traditional environments, capacity planning often happens months ahead. In cloud environments, capacity can be adjusted much closer to real demand, which improves agility but also makes poor governance visible faster.

This model lets teams move faster, but it also creates new risks: overspending, weak access control, poor architecture choices, and region-wide dependency mistakes.

For a solutions architect, cloud is not just infrastructure on demand. It is a decision framework. Every major design choice should be reviewed through the AWS Well-Architected pillars:

- operational excellence
- security
- reliability
- performance efficiency
- cost optimization
- sustainability

These pillars help you explain why one architecture is better than another, not just how to deploy it.

This is one of the most important mindset shifts in AWS. Cloud is not only about getting servers quickly. It is about making better trade-offs around security, recovery, speed, and cost from the beginning.

---

## 1.2 Core Cloud Service Models

You will repeatedly see three service models:

### Infrastructure as a Service (IaaS)

You manage operating systems, runtime, application code, and part of the network design.

Examples:

- EC2
- EBS
- VPC

### Platform as a Service (PaaS)

AWS manages more of the operating environment, and you focus more on application logic.

Examples:

- RDS
- Elastic Beanstalk
- ECS Fargate

### Serverless

You focus mainly on code and event flow. AWS handles most of the infrastructure operations.

Examples:

- Lambda
- API Gateway
- Step Functions

The higher the abstraction, the less infrastructure you manage. The trade-off is reduced low-level control.

That trade-off also changes the shared responsibility boundary. Moving from EC2 to a managed database or to a serverless function does not remove responsibility. It changes where your effort should go. You spend less time on host operations and more time on identity, data protection, application behavior, and service limits.

---

## 1.3 AWS Global Infrastructure

AWS is not one giant data center. It is a global collection of isolated and connected infrastructure units.

That physical and logical separation is one of the core reasons AWS can offer both scale and failure isolation. It is also why architects must think carefully about what happens inside one region versus across multiple regions.

![AWS Global Infrastructure overview showing global services, regions, Availability Zones, and edge locations.](images/ch01-aws-global-infrastructure.svg)

*Figure: Global scope services coordinate identity and routing, while workloads run in regional resources spread across Availability Zones, with edge locations improving user latency.*

### Region

A region is a geographic area where AWS has multiple data center clusters.

Examples:

- `us-east-1` for Northern Virginia
- `eu-west-1` for Ireland
- `ap-south-1` for Mumbai

You choose a region based on:

- latency to users
- data residency or compliance requirements
- service availability
- disaster recovery design
- cost

Regions are designed to be strongly isolated from each other. That is good for fault containment, but it also means cross-region designs require deliberate planning for data replication, failover, identity patterns, and operations.

### Availability Zone

An Availability Zone, or AZ, is one or more isolated data centers inside a region.

AZs are connected with fast networking, but they are designed so that a failure in one AZ does not automatically take down the others.

This is why production systems often run across multiple AZs in the same region.

### Edge Location

An edge location is part of AWS's content delivery and edge network.

It is used for low-latency content delivery and request routing, mainly through services such as CloudFront and Route 53.

Edge locations are closer to end users than regions.

That does not mean they replace regions. Edge locations are mainly used to improve delivery and request handling near users, while the core application and data systems usually still live in regions.

### Regional vs Global Services

Not every AWS service behaves the same way:

- Regional services run inside a selected region, such as EC2, RDS, and VPC.
- Global services work across the AWS account more broadly, such as IAM, Route 53, and CloudFront control planes.

There are also important nuances:

- S3 stores data in a chosen region even though bucket names are globally unique.
- Route 53 is global, but it often routes traffic to regional resources.
- CloudFront is global, but its origins usually sit in specific regions.

If you miss this distinction, you will misread where your data, access rules, or failures actually live.

This misunderstanding causes real design mistakes. Teams sometimes assume that using a global service means the workload itself is globally resilient, when in reality the application may still depend on one regional database or one regional compute tier.

---

## 1.4 Shared Responsibility Model

AWS does not secure everything for you. The cloud changes who is responsible for what.

The exact boundary depends on the service model. With EC2, you manage much more of the operating environment than you do with Lambda or RDS. That is why architects must always ask not only, "What does this service do?" but also, "What does this service leave to us?"

![Shared responsibility model showing AWS responsibilities for security of the cloud and customer responsibilities for security in the cloud across service models.](images/ch01-shared-responsibility-model.svg)

*Figure: Shared responsibility boundary where AWS secures infrastructure of the cloud, while customers secure identities, data, configuration, and workloads in the cloud.*

### AWS is responsible for security **of** the cloud

AWS manages things such as:

- physical data centers
- hardware
- networking backbone
- hypervisor layer

### You are responsible for security **in** the cloud

You manage things such as:

- IAM permissions
- data encryption choices
- operating system patching on EC2
- security groups
- application vulnerabilities
- secrets management

### Why this matters

Many teams assume that using AWS means their system is secure by default. That is false.

For example:

- AWS secures the S3 service.
- You secure who can read your S3 bucket.

Managed services reduce operational work, but they do not remove accountability.

This is especially important in audits and incident response. If a bucket is public, a key is over-permissive, or a secret is exposed in application code, AWS did not make that decision for you.

---

## 1.5 High Availability and Fault Isolation

AWS architecture is built around failure isolation.

Important design rules:

- One instance in one AZ is not a production architecture.
- Multi-AZ is the normal baseline for important workloads.
- Region failure is rare, but it must still be part of disaster recovery planning.

Think in layers:

- single instance failure
- AZ failure
- region failure

Each layer changes cost, complexity, and recovery time.

Another useful term here is blast radius. Blast radius is the scope of damage a single failure can cause. Good architecture reduces blast radius by isolating failures across instances, Availability Zones, accounts, and sometimes regions.

### Recovery patterns a solutions architect must know

High availability and disaster recovery are related but not identical.

- Multi-AZ protects against local infrastructure failure inside one region.
- Backup and restore is the cheapest regional recovery pattern, but recovery is slow.
- Pilot light keeps critical data and minimal services ready in a second region.
- Warm standby runs a reduced-capacity environment in a second region for faster failover.
- Active-active multi-region gives the best recovery posture, but cost and design complexity rise sharply.

These options are normally evaluated using recovery time objective, or RTO, and recovery point objective, or RPO.

Those metrics are not paperwork. They influence architecture directly. A very low RTO usually requires more pre-provisioned infrastructure. A very low RPO usually requires stronger replication and data protection choices.

---

## 1.6 How to Choose a Region

Do not pick a region randomly. Use clear decision criteria.

### Choose based on latency

If your users are mostly in India, `ap-south-1` may be a better default than `us-east-1`.

### Choose based on compliance

Some workloads must keep data in a specific geography.

### Choose based on service support

Not every service or feature launches in every region at the same time.

### Choose based on recovery design

If you need disaster recovery, plan a secondary region early.

### Choose based on cost

Pricing differs by service and region.

There can also be indirect cost differences. Data transfer, cross-region replication, and operational overhead can change the total cost of a region choice even when the base compute price looks attractive.

### Choose based on quotas and ecosystem fit

Architects also check service quotas, partner connectivity, and team operations. A region may be technically available but still be a poor fit if quotas are too low, managed services are missing, or connectivity to on-premises environments is weak.

The best region is usually the one that balances user latency, compliance, service support, recovery design, and team operability. There is rarely a universally correct answer across every workload.

---

## 1.7 Example Mental Model

A simple production web application might look like this:

- One region for primary deployment
- Two or more AZs for application instances
- CloudFront edge locations for static content and low-latency delivery
- Route 53 for DNS routing
- A managed database in Multi-AZ mode
- CloudWatch and CloudTrail for visibility and audit
- Backups and documented recovery procedures

![End-to-end AWS reference architecture with Route 53, CloudFront, Multi-AZ app tier, Multi-AZ database, observability, and backups.](images/ch01-end-to-end-reference-architecture.svg)

*Figure: End-to-end reference architecture for a production baseline using Route 53 and CloudFront at ingress, multi-AZ application and database layers in-region, plus CloudWatch or CloudTrail visibility and backup workflows.*

This example is deliberately simple, but it already shows several AWS patterns:

- global user entry through DNS and edge services
- regional application hosting
- Multi-AZ resilience inside the primary region
- explicit observability and recovery planning instead of assuming resilience automatically exists

This is the first important AWS pattern: keep the application close to users, distribute across AZs, and avoid single points of failure inside a region.

### Solutions architect checkpoint

A solutions architect should be able to answer the following after this chapter:

- Why is Multi-AZ the normal production baseline?
- When is one region enough, and when is multi-region justified?
- Which services in the design are regional, global, or edge-based?
- Which Well-Architected pillar is driving a design trade-off?
- What are the RTO and RPO expectations for the workload?
- Where is the biggest blast radius if one component fails?

---

## 1.8 Common Mistakes

- Treating a region as if it were a single data center
- Assuming all AWS services are global
- Confusing edge locations with Availability Zones
- Believing AWS secures your application permissions automatically
- Designing production workloads in a single AZ
- Assuming managed services automatically remove the need for resilience planning
- Choosing a region without considering compliance, service support, or disaster recovery consequences

---

## 1.9 Hands-On Checks

Use the AWS documentation and console to verify the following:

1. Find three regions where EC2 is available.
2. Identify how many Availability Zones exist in your preferred region.
3. Check whether IAM is regional or global.
4. List one service that commonly uses edge locations.
5. Compare backup and restore, warm standby, and active-active in terms of cost and recovery speed.
6. Pick one region and explain why it would or would not be a good primary region for a workload serving users in your geography.
7. Identify one AWS service in your expected stack that is global and one that is regional.
8. Write down a simple RTO and RPO target for a learning application and explain how that would affect architecture.

---

## 1.10 Recap

- Cloud computing trades fixed infrastructure for on-demand services.
- AWS organizes infrastructure into regions, AZs, and edge locations.
- Regions are geographic, AZs provide isolation, and edge locations improve delivery performance.
- AWS secures the cloud platform, but you still secure your workloads, identities, and data configurations.
- Multi-AZ thinking is the normal production baseline, and blast-radius reduction is a core design goal.
- Service model choice affects how much infrastructure you manage and where operational responsibility shifts.
- Solutions architects use the Well-Architected pillars, service scope, and RTO or RPO goals to justify foundational design choices.

Next: set up an AWS account correctly so you start with strong security and cost controls instead of fixing preventable mistakes later.
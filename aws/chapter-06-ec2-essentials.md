# 6: EC2 Essentials

Amazon Elastic Compute Cloud (Amazon EC2) gives you virtual machines in AWS. It is a core service because it lets you run operating systems, install software, and control the environment more directly than many higher-level AWS options.

This chapter explains how EC2 is used for real workloads and what choices matter most. You will learn why instance type, Amazon Machine Image (AMI), storage, and pricing model affect performance, reliability, and cost when you run servers in production.

---

## 6.1 Why EC2 Still Matters

Even though AWS offers many managed and serverless services, EC2 remains one of the most important building blocks in the platform.

You use EC2 when you need:

- operating system level control
- custom runtimes or software packages
- predictable compute environments
- legacy application support
- special hardware such as graphics processing units, or GPUs

EC2 is infrastructure as a service. That means AWS gives you the virtual machine, but you still own major operational responsibilities such as operating system patching, process management, instance hardening, and much of the runtime behavior.

This flexibility is powerful, but it is also where teams often reintroduce old data center habits into the cloud.

---

## 6.2 What an EC2 Instance Actually Includes

An EC2 instance is not just a virtual server. It is a combination of several decisions:

- the Amazon Machine Image, or AMI
- the instance type
- the VPC and subnet placement
- attached storage such as Elastic Block Store, or EBS
- attached security groups
- an IAM role for AWS API access
- bootstrap configuration such as user data

There are also less obvious decisions that matter in production:

- which CPU architecture the workload expects
- whether the instance should receive a public IP address
- whether the root volume should persist after termination
- how the instance will be monitored, patched, and replaced

If any one of these choices is wrong, the instance may launch but still be unusable, insecure, or too expensive.

This is why architects treat instance creation as a template problem, not a one-click problem. You are defining a repeatable compute pattern, not just booting a box.

![EC2 instance design decision map showing AMI, instance type, architecture, networking, storage, identity, bootstrap, and monitoring choices.](images/ch06-ec2-instance-decision-map.svg)

---

## 6.3 Instance Families and Workload Fit

EC2 instance types are grouped into families based on resource profile.

The most common categories are:

- general purpose for balanced compute and memory
- compute optimized for CPU-heavy tasks
- memory optimized for in-memory databases, caches, and large heap applications
- storage optimized for high local throughput or low-latency local disks
- accelerated computing for GPU or specialized hardware workloads

Examples:

- `t3` or `t4g` for low-to-moderate general workloads
- `m7i` or similar families for balanced production workloads
- `c7i` for compute-heavy application servers or batch processing
- `r7i` for memory-heavy services

Another real decision is processor architecture:

- x86-based instances fit the widest range of existing software
- Arm-based instances such as Graviton families can improve price-performance when the software stack supports them

This is not just a cost topic. It affects compatibility with operating system images, agents, libraries, and compiled application components.

The right question is not, "Which family is newest?"

The right question is, "Which family matches the dominant bottleneck of this workload?"

If your application is CPU-bound, adding more memory does not solve the problem. If your application holds large datasets in memory, a cheap burstable instance usually becomes the wrong choice quickly.

The same logic applies to network-heavy and storage-heavy workloads. If a service spends much of its time waiting on network throughput or disk operations, choosing by vCPU count alone leads to the wrong result.

---

## 6.4 Sizing, Bursting, and Performance Reality

Instance size affects vCPU count, memory, network bandwidth, and sometimes storage performance.

Beginners often choose too small an instance and then misread the symptoms. Slow response time may come from:

- CPU saturation
- memory pressure and swapping
- network limits
- EBS throughput limits
- poor application tuning

Burstable instances such as `t3` and `t4g` deserve special attention. They are cost-effective for workloads with low baseline usage and short bursts, but they are a bad fit for systems that run at sustained high CPU utilization.

It is also worth separating vertical scaling from horizontal scaling:

- vertical scaling means moving to a larger instance size
- horizontal scaling means adding more instances behind a load balancer or worker pool

Vertical scaling is simple, but it has limits and can increase blast radius. Horizontal scaling is often better for stateless application tiers, though it requires the application to tolerate replacement and distribution.

Architectural implications:

- use burstable instances for light services, dev environments, or low-duty workloads
- use steady-performance families for consistently busy production services
- benchmark based on real workload behavior instead of guessing from marketing labels
- observe CPU, memory, storage, and network behavior together before resizing

Right-sizing is not a one-time launch decision. It is an operational practice.

---

## 6.5 Amazon Machine Images and Launch Consistency

An AMI defines the base software image for an EC2 instance.

It usually includes:

- the operating system
- optional preinstalled software
- configuration choices needed at launch

Common AMI sources include:

- AWS-managed AMIs
- marketplace AMIs
- your own custom golden images

Production guidance:

- prefer approved, patched base images
- minimize unnecessary software in the image
- version your AMIs clearly
- avoid manual snowflake instances that drift from the intended baseline

The main trade-off is boot speed versus configuration flexibility:

- richer images reduce launch-time setup work and improve startup consistency
- lighter images reduce image sprawl and push more configuration into automation

Custom AMIs are useful when boot time matters or when every instance must start from a controlled image. However, an AMI should not become a dumping ground for untracked configuration. Pair images with automation and clear versioning.

In production, image pipelines matter. If teams do not rebuild and revalidate images regularly, old packages and outdated agents quietly become part of the baseline.

---

## 6.6 Storage Choices: EBS and Instance Store

Most EC2 instances use Amazon EBS for persistent block storage.

EBS is useful because:

- data can survive instance stop and start cycles depending on configuration
- volume size and type can be chosen per workload
- snapshots support backup and recovery workflows

In practice, EBS choices also affect performance. General-purpose volumes are suitable for many common workloads, but high-throughput or high-IOPS systems need more deliberate sizing and volume selection.

Instance store is different. It provides physically attached temporary storage on certain instance types.

Important distinction:

- EBS is persistent block storage for most normal server use cases
- instance store is ephemeral and should only hold data that can be lost and recreated

Another operational distinction is lifecycle behavior:

- stopping an instance usually preserves attached EBS volumes unless configured otherwise
- terminating an instance may delete the root volume depending on launch settings
- instance store data does not survive the loss or termination of the instance

Examples:

- root volume and application data on EBS
- scratch space or temporary cache on instance store

If the business cannot tolerate losing the data, that data should not live only on ephemeral local storage.

Storage design is not only about capacity. It is about durability, throughput, latency, recovery, and cost. Later chapters go deeper into EBS and EFS, but EC2 design already depends on knowing that local temporary storage and durable network-attached storage are not interchangeable.

---

## 6.7 Access, Identity, and Safe Bootstrap

Launching the instance is only part of the job. You also need a safe operating model.

Key controls include:

- security groups for traffic filtering
- IAM roles for AWS API access from the instance
- user data for launch-time bootstrap actions
- Systems Manager based access patterns instead of broad direct shell exposure where possible
- logging and monitoring agents or equivalent observability controls

Production principles:

- do not bake long-lived AWS credentials into the instance
- do not expose SSH or RDP from the internet unless there is a clear operational reason
- use IAM roles so applications receive temporary credentials
- keep bootstrap logic predictable and idempotent
- prefer private administration paths over public management access where possible

User data is useful for startup tasks such as package installation or agent registration, but large, fragile startup scripts often become a hidden source of failure. If a service depends on long initialization logic, that dependency should be explicit and observable.

The broader principle is that instance access should support operations without turning every server into a manually managed snowflake. If human access is the primary recovery method, the design is already too dependent on individual machines.

---

## 6.8 Pricing Models and Cost Trade-Offs

EC2 pricing changes based on how flexible your workload is.

The main models are:

- On-Demand for short-term or unpredictable usage
- Savings Plans or Reserved Instance style commitments for steady usage patterns
- Spot Instances for interruptible capacity at lower cost
- Dedicated options for specialized isolation requirements

How to choose:

- use On-Demand when the workload is new or variable
- use commitment-based pricing when usage is predictable enough to justify it
- use Spot when interruption is acceptable and the system can recover gracefully

Spot is powerful for batch jobs, stateless workers, queue consumers, and fault-tolerant processing. It is a poor fit for single-instance critical systems.

Commitment-based discounts also need discipline. They save money only when the workload shape is steady enough and the organization is confident the usage will remain. Buying too early can lock in the wrong assumption.

Architects should separate workload behavior from pricing behavior. First decide what failure tolerance the application has. Then choose the cheapest pricing model that fits that tolerance.

One common pattern is mixed capacity:

- baseline capacity on On-Demand or commitment-backed instances
- burst or worker capacity on Spot when interruption is acceptable

That gives cost efficiency without making the whole service dependent on interruptible capacity.

---

## 6.9 Availability, Lifecycle, and Replacement Strategy

An EC2 instance is disposable infrastructure, or at least it should be treated that way.

You should not design around one precious server that must never fail.

Important realities:

- an instance can fail
- an Availability Zone can fail
- stopping and starting an instance may change its underlying host and public IP behavior
- scaling events may replace instances unexpectedly
- operating system drift accumulates if instances live too long without rebuild discipline

This is why good EC2 architecture usually includes:

- instances spread across multiple Availability Zones
- data stored outside the instance when durability matters
- launch templates or image standards for consistent replacement
- monitoring and health checks so unhealthy instances are detected quickly

There is also a lifecycle mindset difference between cloud-native and legacy operations:

- legacy thinking protects the individual server
- cloud thinking protects the service and assumes the server can be recreated

That shift affects patching, deployments, incident response, and capacity planning. If recovery requires logging into one irreplaceable host and repairing it manually, the architecture has not yet absorbed the cloud model.

![EC2 replacement lifecycle showing launch templates, health checks, unhealthy instance detection, and automatic replacement with externalized state.](images/ch06-ec2-replacement-lifecycle.svg)

The next chapter expands this into Elastic Load Balancing and Auto Scaling, but the mindset starts here: if replacement is difficult, the design is too instance-centric.

---

## 6.10 Common Mistakes

- choosing instance types by guesswork instead of workload profile
- ignoring CPU architecture compatibility when evaluating Graviton or other instance families
- using burstable instances for constantly busy production workloads
- treating one manually configured instance as the permanent server
- assuming more vCPU always fixes a workload that is really storage-bound or network-bound
- storing critical data only on ephemeral instance storage
- forgetting root volume deletion behavior and losing data unexpectedly at termination
- hard-coding AWS credentials on the machine instead of using an IAM role
- exposing management ports directly to the internet without strong operational controls
- building startup logic so fragile that replacement instances take too long to become useful
- buying commitment-based pricing before usage patterns are stable enough to justify it
- assuming larger instance size is the only solution to every performance problem

---

## 6.11 Hands-On Tasks

1. Pick three example workloads: a small internal web app, a memory-heavy cache-backed service, and a batch image-processing worker.
2. Choose an EC2 family for each workload and explain why.
3. Decide whether each workload is a good or bad candidate for burstable instances.
4. Compare when you would use EBS and when you would use instance store.
5. Describe what should go into an AMI versus what should run in user data.
6. Explain why an IAM role is safer than storing access keys on the instance.
7. Choose whether each workload should run On-Demand, Spot, or under a longer-term commitment model.
8. Describe how you would replace a failed instance without manual reconstruction.
9. For one workload, decide whether x86 or Arm is the better fit and explain the compatibility check you would perform first.
10. Choose whether the root volume should persist after termination for three different example servers.
11. List the metrics you would inspect before deciding whether a slow instance needs a larger size.
12. Describe one design where horizontal scaling is better than vertical scaling and one where the opposite may be more practical.

---

## 6.12 Recap

- EC2 gives you flexible compute, but you keep significant operational responsibility.
- Every instance is a combination of image, size, network placement, storage, and identity decisions.
- Instance families should match workload bottlenecks such as CPU, memory, storage, network, or accelerator needs.
- Processor architecture compatibility matters, especially when comparing x86 and Arm-based options.
- AMIs and launch standards improve consistency and reduce configuration drift.
- EBS is the normal persistent storage choice, while instance store is temporary and should hold only recreatable data.
- Pricing models should follow workload interrupt tolerance, predictability, and how much interruption the system can absorb.
- Strong EC2 architecture assumes instances can be replaced rather than preserved forever.

Next: Elastic Load Balancing and Auto Scaling.
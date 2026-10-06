# 10: EBS and EFS

Some workloads need storage that looks like a disk, and others need a shared file system that many machines can use at the same time. Amazon Elastic Block Store (Amazon EBS) and Amazon Elastic File System (Amazon EFS) solve these two different problems.

This chapter shows when block storage is the right fit and when shared file storage makes more sense. You will learn how these services are used with Amazon Elastic Compute Cloud (Amazon EC2), and why performance, availability, persistence, and cost all affect the design choice.

---

## 10.1 Why EBS and EFS Matter

Not all persistent data belongs in object storage.

Many workloads need:

- a disk attached to a compute instance
- a file system shared by multiple instances
- low-latency storage for operating systems, databases, or application state

That is where Amazon Elastic Block Store, or EBS, and Amazon Elastic File System, or EFS, become relevant.

These services solve different storage problems:

- EBS provides block storage, usually attached to one EC2 instance at a time in normal designs
- EFS provides a managed shared file system that can be mounted across multiple compute resources

Choosing between them is not a feature comparison exercise. It is a workload-shape decision.

---

## 10.2 Block Storage Versus Shared File Storage

Before looking at the services themselves, clarify the storage models.

### Block storage

Block storage behaves like a raw disk presented to a machine. The operating system formats and mounts it.

This is useful when:

- the workload expects local-disk semantics
- an operating system or database needs a dedicated volume
- low-latency instance-attached storage behavior matters

### Shared file storage

Shared file storage presents a file system that multiple clients can mount.

This is useful when:

- multiple servers need access to the same files
- applications rely on standard file-system directory structures
- you want managed elasticity without operating your own NFS infrastructure

This distinction is the core decision boundary between EBS and EFS.

![EBS versus EFS storage model comparison showing single-node block volume attachment versus multi-node shared file system access.](images/ch10-ebs-vs-efs-storage-model.svg)

---

## 10.3 Amazon EBS Fundamentals

Amazon EBS is persistent block storage for EC2-based workloads.

Common uses include:

- root volumes for EC2 instances
- database storage for self-managed databases running on EC2
- application data volumes that need low-latency block access
- boot disks and attached persistent volumes for traditional server patterns

EBS is useful because it separates compute lifetime from storage lifetime. An EC2 instance can stop, fail, or be replaced while the volume persists according to your design.

That said, EBS is still part of an Availability Zone scoped model. Architects need to understand placement and recovery boundaries rather than assuming a volume behaves like region-wide shared storage.

---

## 10.4 EBS Volume Types, Performance, and Design Trade-Offs

EBS is not one uniform volume type.

Different workloads need different balances of:

- input and output operations per second, or IOPS
- throughput
- latency
- cost

The architect's question is not just, "Which EBS option is fastest?" The better question is, "What performance profile does the workload require, and what is the cost of overprovisioning or underprovisioning it?"

For example:

- a small general-purpose application volume may not need high-end performance tuning
- a busy self-managed database on EC2 may care deeply about latency and sustained IOPS behavior

Storage performance should be based on measured workload needs, not intuition or maximum specifications.

---

## 10.5 Snapshots, Backup, and Recovery for EBS

EBS volumes are persistent, but persistence alone is not a backup strategy.

Snapshots provide a way to protect and recover volume data over time. They are essential for:

- backup and restore processes
- golden image or baseline environment creation
- recovery after accidental deletion or corruption
- copying data into new environments or regions as part of broader recovery planning

Architecturally, snapshot strategy should answer:

- how often data changes
- how much loss is acceptable
- how quickly a volume or server must be restored
- whether recovery must stay within one region or cross regions

EBS is strong for persistent instance storage, but it still needs the same backup discipline discussed later in the disaster recovery chapter.

![EBS snapshot and recovery flow showing backup cadence, snapshot sets, and restore paths into replacement nodes or new environments.](images/ch10-ebs-snapshot-recovery-flow.svg)

---

## 10.6 Amazon EFS Fundamentals

Amazon EFS is a managed elastic file system designed for shared access.

It is useful when multiple compute resources need to mount the same file system concurrently.

Typical use cases include:

- shared application content
- content management systems
- container workloads that need a shared filesystem layer
- environments that historically would have used an NFS server

EFS reduces the burden of managing your own shared file storage infrastructure. You do not need to patch or scale an NFS appliance yourself.

But EFS is not the right answer for every workload. If a workload needs low-latency single-instance block semantics, EBS is the closer fit.

---

## 10.7 Availability, Mount Targets, and Shared Access Patterns

EFS is designed for regional use with access from resources in connected network environments through mount targets.

The important architectural point is that EFS provides shared file access, not merely persistent storage.

That makes it attractive when:

- several application nodes need consistent access to the same files
- a fleet may scale in and out but should see one common filesystem view
- the workload benefits from managed elasticity rather than fixed-capacity file servers

Shared access also changes the operational model. You need to think about:

- how applications coordinate file changes
- whether the workload assumes local-disk performance that EFS is not designed to provide
- network access and security group design for mounted clients

Shared storage solves one class of problems while introducing concurrency and application-behavior considerations of its own.

---

## 10.8 EBS Versus EFS: How to Choose

Choose EBS when:

- the storage belongs closely to one EC2 instance or one workload node at a time
- block-device semantics are required
- the application expects a local disk or database-style volume pattern
- you want direct control over the volume-performance profile

Choose EFS when:

- multiple instances or containers need to mount the same file system
- the workload expects shared directories rather than isolated local disks
- you want managed file-system scaling instead of running your own shared storage server

Avoid forcing one model to imitate the other. If the workload clearly wants block storage, shared file storage will often feel slow or awkward. If the workload clearly needs shared files, per-instance EBS volumes will create synchronization pain.

---

## 10.9 Architect Decision Patterns and Operational Concerns

When reviewing storage choices, ask:

- Does the application need object, block, or shared file storage?
- Is the storage tied to a single node, or must it be shared across many nodes?
- What are the backup and restore expectations?
- What performance characteristics matter most?
- Does the workload scale through stateless compute with external storage, or is state tightly bound to one machine?
- Are security groups, encryption, and access controls aligned with how the storage is mounted or attached?

These questions usually reveal whether the storage choice supports the application cleanly or whether it is compensating for an unclear application design.

---

## 10.10 Common Mistakes

- choosing EBS when several servers really need a shared file system
- choosing EFS for workloads that actually need single-node block-device behavior
- assuming persistent storage means backups are unnecessary
- sizing storage performance by guesswork rather than workload observation
- forgetting that EBS volumes are Availability Zone scoped in their normal operating model
- attaching storage securely but failing to define retention, snapshot, or restore procedures
- mounting shared storage without thinking through file coordination and application concurrency behavior
- using shared storage as a shortcut instead of making stateless components simpler where possible

---

## 10.11 Hands-On Tasks

1. Compare a self-managed database on EC2 with a shared content repository used by multiple application nodes, and choose EBS or EFS for each.
2. Explain why S3 is not the right replacement for an instance boot disk.
3. Describe an EBS snapshot strategy for a small production EC2-based application.
4. List the application behaviors that make EFS a better fit than multiple separate EBS volumes.
5. Identify one workload where the correct answer is neither EBS nor EFS because object storage is a better model.

---

## 10.12 Recap

EBS provides persistent block storage for EC2-based workloads, while EFS provides a managed shared file system for workloads that need concurrent file access. The correct choice depends on storage semantics, performance expectations, sharing needs, and recovery requirements. Strong storage design begins by understanding what the application actually needs rather than treating all persistence as the same problem.

Next: 11: RDS and Aurora
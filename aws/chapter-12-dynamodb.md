# 12: DynamoDB

Amazon DynamoDB is a managed NoSQL database built for very high scale and low-latency access. It is useful when applications need fast, predictable performance without managing database servers.

This chapter introduces the DynamoDB design mindset, which is different from traditional relational modeling. You will learn why partition keys, sort keys, and access patterns shape the data model, and how that affects application design, scaling, and operational simplicity.

---

## 12.1 Why DynamoDB Matters

Not every workload fits a relational database.

Some systems need:

- very high scale with low operational overhead
- predictable low-latency access patterns
- simple key-based lookups and event-driven integration
- flexible schemas aligned to known application access needs

Amazon DynamoDB is AWS's fully managed NoSQL database service built for those kinds of workloads.

DynamoDB matters because it changes the design conversation. Instead of starting from normalized tables and joins, you start from access patterns: what the application needs to read and write, how frequently, and with what latency expectations.

This is a powerful model, but it requires discipline. Poor DynamoDB design usually begins when teams treat it like a relational database with different syntax.

---

## 12.2 The Access-Pattern-First Mindset

The most important DynamoDB concept is that schema design follows access patterns.

That means you ask:

- What exact items will the application retrieve most often?
- By which keys or query shapes?
- What write patterns will occur?
- What query flexibility is truly required?

In relational systems, you can often model the data first and rely on joins or ad hoc queries later. In DynamoDB, that approach usually creates inefficient or awkward access.

The design process is therefore closer to API design than traditional database normalization. You shape items so the most important reads and writes are efficient and predictable.

---

## 12.3 Tables, Items, and Primary Keys

DynamoDB stores data in tables containing items.

Each item is a set of attributes, but the critical design element is the primary key.

Primary key patterns include:

- a partition key alone for simple key distribution and lookup
- a partition key plus sort key for grouped item collections and ordered retrieval within a partition

The partition key matters because it influences how data is distributed and how access scales.

The sort key matters because it allows multiple related items to be modeled together and queried in ordered or filtered ways within the same partition.

These are not minor implementation details. They are the center of DynamoDB data modeling.

---

## 12.4 Partitioning, Scale, and Hot Keys

DynamoDB scales by partitioning data behind the scenes. That is why key choice is so important.

If traffic concentrates too heavily on one partition key value, the workload may create a hot partition or hot key problem.

This matters because overall table scale does not help much if the access pattern is concentrated on a small part of the key space.

Good designs spread traffic naturally across partition keys where the workload allows it.

Architects should watch for patterns such as:

- timestamp-heavy writes that all target the same key shape
- globally popular items that receive disproportionate traffic
- designs where many unrelated operations collapse onto one partition key

DynamoDB can scale very well, but only when the key model supports that scale.

---

## 12.5 Query Patterns, Secondary Indexes, and Data Modeling Trade-Offs

![DynamoDB access-pattern model showing primary key design, secondary index paths, capacity controls, and consistency considerations.](images/ch12-dynamodb-access-pattern-and-indexing.svg)

Applications often need more than one way to retrieve data.

DynamoDB supports additional query flexibility through secondary indexes, but indexes should be created deliberately.

The design question is not, "How do I recreate arbitrary SQL-style querying?" The better question is, "Which additional access patterns are important enough to justify dedicated index paths?"

Secondary indexes are powerful, but they bring trade-offs:

- additional write overhead
- more design complexity
- more operational surface to understand and monitor

Strong DynamoDB design often denormalizes data intentionally to support the important reads directly rather than relying on many generic query paths.

That can feel unusual to teams coming from relational backgrounds, but it is often the correct trade in this model.

---

## 12.6 Throughput Modes and Capacity Thinking

DynamoDB capacity planning is about read and write demand, traffic variability, and cost.

At a practical level, teams choose between models that reflect:

- stable versus bursty traffic
- the desire for simpler scaling behavior versus tighter predictability and cost control
- how much operational attention the table should require

The core lesson is that capacity is not only a billing topic. It reflects workload shape.

Architects should consider:

- steady traffic that may be easy to plan
- sudden spikes that need automatic responsiveness
- background jobs that can create intense write bursts

If the application traffic model is poorly understood, the DynamoDB cost and performance model will usually be misunderstood too.

---

## 12.7 Consistency, Events, and Application Behavior

DynamoDB is often used in event-driven architectures, session stores, high-scale APIs, and service-owned data models.

That means application behavior matters as much as table design.

Important questions include:

- which reads require the freshest possible data
- whether the workload can tolerate eventual consistency in some cases
- how item updates interact with asynchronous events or retries
- whether writes are idempotent when requests are replayed

DynamoDB works well with modern decoupled architectures, but only if the application logic is designed for the database semantics rather than against them.

---

## 12.8 Security and Operational Simplicity

DynamoDB removes many infrastructure tasks associated with self-managed databases.

You do not manage servers, disks, patches, or conventional replication infrastructure in the same way.

But operational simplicity is not the same as zero responsibility.

You still need to design:

- IAM access boundaries
- encryption and secret handling for clients and dependent services
- alarms for throttling, latency, and error behavior
- backup and restore expectations
- data model changes over time

One of the service's strengths is that it lets teams focus more on data access design and less on infrastructure maintenance. That strength is only realized when the data model is sound.

---

## 12.9 Solutions Architect Review Questions

When reviewing a DynamoDB design, ask:

- What are the exact read and write access patterns?
- Is the partition key likely to distribute traffic well?
- Do any planned queries require secondary indexes, and are those indexes justified?
- Which reads require fresh data and which can tolerate looser consistency?
- Is the team using DynamoDB because it fits the workload or simply to avoid relational modeling?
- How will throttling, retries, and backup or restore events be handled operationally?

These questions are usually more useful than asking whether DynamoDB is "faster" than a relational database. The real issue is model fit.

---

## 12.10 Common Mistakes

- modeling DynamoDB as if it were a relational database with arbitrary query flexibility
- choosing a partition key without analyzing traffic distribution
- creating hot partitions through highly concentrated access patterns
- adding secondary indexes reactively without understanding the write and complexity trade-offs
- ignoring consistency expectations in application code
- treating throughput and scaling as billing-only topics instead of workload-shape topics
- assuming fully managed infrastructure eliminates the need for alarms, backups, and IAM review
- using DynamoDB where a relational model is clearly better suited to the business problem

---

## 12.11 Hands-On Tasks

1. Pick one application workflow, such as orders by customer or sessions by user, and define the main DynamoDB access patterns.
2. Propose a partition key and sort key design for that workflow.
3. Identify one access pattern that may need a secondary index and explain why.
4. Describe a hot-key risk for your design and how you would recognize it.
5. Explain why a relational design process and a DynamoDB design process usually start from different questions.

---

## 12.12 Recap

DynamoDB is a fully managed NoSQL database built for high-scale, low-latency workloads, but it demands an access-pattern-first design mindset. Partition keys, sort keys, secondary indexes, and throughput choices all shape both performance and cost. Strong DynamoDB design begins by understanding how the application reads and writes data, not by copying relational habits into a different service.

Next: 13: ElastiCache

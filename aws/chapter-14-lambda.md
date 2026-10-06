# 14: Lambda

AWS Lambda runs code in response to events without requiring you to manage servers directly. It is a core serverless service and is often used for APIs, file processing, automation, and event-driven workflows.

This chapter explains where Lambda works well and where its limits matter. You will learn how functions are invoked, how scaling and concurrency behave, and why packaging, permissions, execution time, and networking decisions affect reliability and cost.

---

## 14.1 Why Lambda Matters

AWS Lambda lets you run code without managing servers directly.

That changes more than provisioning. It changes how you think about workload boundaries, scaling, operations, and failure handling.

Lambda is useful when work is naturally triggered by an event, request, schedule, or message. Common examples include:

- processing API requests
- reacting to object uploads
- transforming queue messages
- running scheduled maintenance tasks
- orchestrating small integration steps between managed services

The service is attractive because AWS handles server provisioning, patching of the managed runtime environment, and elastic scale for many bursty workloads.

That does not mean there is no infrastructure thinking left. A solutions architect still has to decide:

- whether the workload is truly event-driven
- how much execution time and memory it needs
- how retries and duplicate events should be handled
- what happens when downstream systems are slow or unavailable
- whether cold starts, concurrency limits, or VPC networking behavior will matter

Lambda is not a universal replacement for containers or virtual machines. It is a strong fit when the workload benefits from short-lived execution, fine-grained scaling, and deep integration with other AWS services.

---

## 14.2 The Lambda Execution Model

![Lambda execution model showing event trigger, execution environment, concurrency scaling, and retry or dead-letter controls.](images/ch14-lambda-execution-and-invocation.svg)

A Lambda function is code packaged with configuration such as runtime, memory, timeout, environment variables, and an execution role.

When an event arrives, Lambda creates or reuses an execution environment to run the function.

There are two important phases to understand:

- initialization, when the runtime starts and top-level code is loaded
- invocation, when the handler processes one event

If AWS can reuse an existing execution environment, later invocations can be faster because initialization does not need to happen again. This is why developers often talk about warm starts and cold starts.

Important consequences of the execution model:

- execution environments are ephemeral and should not be treated as durable state
- temporary local storage is limited and should be used carefully
- top-level initialization cost affects cold-start latency
- any in-memory cache is best-effort only and may disappear at any time

This model favors stateless design. Durable state should normally live in services such as DynamoDB, S3, RDS, ElastiCache, or another managed data system depending on the workload.

---

## 14.3 Invocation Models and Event Sources

Lambda supports several invocation patterns, and the behavior of retries, latency, and failure handling changes depending on which pattern you use.

### Synchronous invocation

The caller waits for the response.

Common examples:

- API Gateway invoking Lambda for an API request
- an application directly calling the Lambda Invoke API

In synchronous flows, timeout and end-user latency matter immediately. If the function is slow, the user experiences that delay directly.

### Asynchronous invocation

The caller hands the event to Lambda and does not wait for the function result.

Common examples:

- S3 event notifications
- EventBridge rules
- SNS topics

Lambda queues the event internally and retries on failure according to the integration behavior. That improves decoupling, but it also means duplicate delivery and delayed failure handling must be part of the design.

### Poll-based invocation

Lambda can poll event sources such as SQS queues, Kinesis streams, or DynamoDB Streams.

In these cases, Lambda manages reading batches from the source and invoking the function with those records.

Architecturally, the invocation source decides several things for you:

- whether the caller expects a response now
- who owns retry behavior
- whether events may be batched
- what ordering guarantees, if any, exist
- how backpressure appears when downstream processing slows down

You cannot design Lambda correctly without first understanding the event source contract.

---

## 14.4 IAM, Resource Access, and Execution Roles

Every Lambda function runs with an execution role.

That role defines what AWS APIs the function can call. For example, the function may need permission to:

- write logs to CloudWatch Logs
- read from Parameter Store or Secrets Manager
- publish to SNS
- read or write S3 objects
- query DynamoDB

This ties directly to the IAM chapter: Lambda functions should use least-privilege roles instead of embedded credentials.

There are two access directions to keep clear:

- what is allowed to invoke the function
- what the function is allowed to access after it starts running

Those are separate concerns.

For example:

- API Gateway may have permission to invoke a function
- the function itself may have permission to write to DynamoDB

Over-permissive Lambda roles are a common production risk. A small function with broad `*` permissions can become a large blast-radius problem if the code is compromised or misused.

Good practice includes:

- one role per workload boundary, not one giant shared role for everything
- explicit permissions for only the required resources and actions
- secrets retrieved from managed secret stores rather than hard-coded environment values
- log access reviewed so sensitive data is not exposed in plain text

---

## 14.5 Concurrency, Scaling, and Throttling

Lambda scales by increasing concurrent executions when more events arrive.

This scaling model is powerful because you do not manually add servers, but it introduces control points that matter in production.

Key terms:

- concurrency: the number of function invocations running at the same time
- reserved concurrency: a hard allocation and cap for one function
- provisioned concurrency: pre-initialized environments to reduce startup latency

Why this matters:

- a traffic spike can create far more downstream database connections than expected
- one noisy function can consume too much account concurrency if not controlled
- latency-sensitive APIs may need provisioned concurrency to reduce cold-start impact

Throttling happens when a function cannot scale further because of concurrency limits. From an architecture standpoint, throttling is not only a Lambda problem. It is often a sign that the surrounding system has no backpressure strategy.

Design questions a solutions architect should ask:

- Should this workload absorb spikes through SQS instead of scaling directly from user traffic?
- Can the database handle the concurrency Lambda can generate?
- Is user-facing latency strict enough to justify provisioned concurrency?
- Should reserved concurrency protect critical functions from being starved by less important ones?

Serverless scale is real, but it must be matched with downstream capacity planning.

---

## 14.6 Packaging, Runtimes, and Dependency Strategy

Lambda supports multiple runtimes and packaging models, including zip-based deployment packages and container images.

The choice should reflect the workload, team workflow, and dependency footprint.

### Zip package model

This is the common starting point for small and medium functions.

It works well when:

- dependencies are modest
- build and deployment are simple
- startup speed matters

### Container image model

This is useful when:

- the dependency graph is large
- the runtime needs OS-level customization
- the team already has a container-based build pipeline

Container images do not turn Lambda into a container orchestrator. The function still runs inside Lambda's execution model, limits, and event lifecycle.

Packaging decisions also affect cold starts. Large dependency bundles and heavy initialization logic often make startup slower.

A practical rule is to keep functions focused:

- smaller deployment units are easier to reason about
- smaller dependency surfaces reduce security and startup overhead
- narrower functions usually map better to event-driven responsibilities

If one Lambda function starts becoming a large application container with many unrelated code paths, the architecture may be pushing against the service model.

---

## 14.7 State, Storage, and VPC Networking

Lambda functions should generally be treated as stateless.

That means:

- no assumption that one invocation will run on the same environment as the next
- no assumption that local files will survive beyond the current environment lifetime
- no assumption that in-memory objects are durable

For durable storage, use an external service that matches the access pattern.

Examples:

- S3 for objects and generated files
- DynamoDB for key-value and event-oriented application state
- RDS or Aurora for relational workloads
- ElastiCache for low-latency shared cache state

Lambda can also be attached to a VPC when it needs private network access, such as reaching:

- RDS databases in private subnets
- internal services behind private load balancers
- private endpoints for AWS services

This decision has consequences:

- VPC attachment adds network complexity
- subnet and security-group design now matter for function connectivity
- poor outbound design can force all traffic through NAT and add cost

The question should not be, "Can this function run in a VPC?" The better question is, "Does this function actually need private network access, and if so, have we designed that path deliberately?"

---

## 14.8 Errors, Retries, Idempotency, and Observability

Many Lambda failures are not code syntax failures. They are retry, timeout, duplication, or observability failures.

You need to think in failure modes.

Important behaviors to design for:

- asynchronous sources may retry failed events
- queue-based sources may re-deliver messages
- partial failures in a batch may require careful handling
- downstream APIs may throttle or fail transiently

This is why idempotency matters.

An idempotent function can safely process the same event more than once without creating duplicate business outcomes. That often requires:

- stable event identifiers
- conditional writes
- deduplication records
- clear separation between read, validate, and commit steps

Observability is equally important. At minimum, production Lambda workloads should have:

- structured logs in CloudWatch Logs
- metrics and alarms for errors, duration, throttles, and concurrency
- request tracing where supported, often through X-Ray or integrated observability tooling
- clear dead-letter or failure destinations where the integration supports them

If a function retries quietly and fails without alarm coverage, the system is not really serverless. It is just invisible failure.

---

## 14.9 Lambda Design Patterns and Decision Criteria

Lambda works best when the unit of work is small, event-driven, and loosely coupled.

Strong fit patterns include:

- API backends with moderate request duration
- file and image processing triggered by S3 events
- asynchronous queue consumers
- scheduled control-plane tasks
- lightweight data transformation or enrichment steps

Weaker fit patterns include:

- very long-running compute jobs
- workloads needing large local state or persistent connections as a core design assumption
- highly stateful systems with tight low-latency coordination between processes
- applications better served by always-on containers or hosts

An architect checkpoint for Lambda is to evaluate five things together:

- event source contract
- execution duration profile
- state and data access model
- concurrency effect on downstream systems
- operational visibility and replay strategy

If those five factors line up well, Lambda is usually a strong choice. If they do not, using Lambda anyway can hide complexity rather than remove it.

---

## 14.10 Common Mistakes

- assuming Lambda removes the need for architecture and operations discipline
- giving functions broad IAM permissions instead of least-privilege execution roles
- ignoring duplicate event delivery and building non-idempotent handlers
- attaching functions to a VPC without understanding subnet, route, and egress implications
- allowing unbounded concurrency to overwhelm databases or third-party APIs
- packaging large, slow-starting functions when smaller focused functions would fit better
- storing secrets directly in code or plain environment variables without managed secret controls
- relying on local temporary state as if it were durable application storage
- skipping alarms for errors, throttles, and age of queued work
- choosing Lambda for long-running or heavily stateful workloads that fit containers better

---

## 14.11 Hands-On Tasks

1. Create a simple Lambda function that logs an input event and returns a small JSON response.
2. Configure the function with a minimal execution role that only allows CloudWatch Logs writes.
3. Invoke the function synchronously and inspect the returned payload and logs.
4. Trigger the function asynchronously from an EventBridge schedule and compare the behavior.
5. Add an environment variable and explain which values belong there and which should move to Secrets Manager or Parameter Store.
6. Set a timeout and memory value, then explain how each setting affects runtime behavior and cost.
7. Describe one workload that fits Lambda well and one that should run on containers or EC2 instead.
8. Sketch an idempotency strategy for a Lambda function that processes order-created events.

---

## 14.12 Recap

- Lambda is event-driven compute that removes server management but not architecture responsibility.
- Invocation model matters because synchronous, asynchronous, and poll-based sources behave differently under failure.
- Execution roles, least privilege, and managed secret handling are core security requirements.
- Concurrency and throttling must be designed together with downstream system capacity.
- Packaging size, initialization cost, and VPC networking choices directly affect latency, cost, and operability.
- Reliable Lambda systems depend on idempotency, observability, and explicit failure-handling strategy.

Next: 15: API Gateway

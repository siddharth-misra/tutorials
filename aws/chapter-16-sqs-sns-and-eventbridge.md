# 16: SQS, SNS, and EventBridge

Modern systems often work better when parts of the application do not talk to each other directly. Amazon Simple Queue Service (Amazon SQS), Amazon Simple Notification Service (Amazon SNS), and Amazon EventBridge are AWS services for messaging and event-driven communication.

This chapter explains the different delivery models they provide and why those differences matter. You will learn when to use a queue, when to use publish and subscribe, and when an event bus is the better choice for decoupling systems, absorbing traffic spikes, and routing events cleanly.

---

## 16.1 Why Messaging and Eventing Matter

Tightly coupled systems fail badly under load and change slowly over time.

If one service can only work when another service responds immediately, every latency spike and downstream failure becomes an end-user problem.

Messaging and eventing help break that coupling.

They let you:

- absorb traffic spikes
- separate producers from consumers
- retry work safely
- fan out information to multiple subscribers
- evolve systems without direct point-to-point integration everywhere

AWS provides multiple services because not all communication patterns are the same.

Sometimes you need a queue for durable work. Sometimes you need publish-subscribe fan-out. Sometimes you need event routing across many producers and consumers without direct awareness of each other.

Choosing correctly matters because delivery semantics define how reliable, scalable, and understandable the system will be.

---

## 16.2 Amazon SQS: Durable Queue-Based Decoupling

Amazon Simple Queue Service, or Amazon SQS, is a managed message queue.

A producer sends a message to the queue. A consumer reads the message and processes it later.

This separation is powerful because it removes the requirement that producer and consumer be available at the same time.

SQS is commonly used for:

- background job processing
- order and payment workflow steps
- buffering traffic spikes before workers consume them
- protecting downstream systems from sudden load bursts

Important SQS behavior:

- messages are stored durably for a retention period
- consumers poll the queue
- after a consumer receives a message, the message becomes temporarily invisible through the visibility timeout
- if processing fails or is not completed correctly, the message can be delivered again

This means SQS supports reliability, but not exactly-once business outcomes by itself. Consumers still need idempotent handling.

---

## 16.3 Standard and FIFO Queues

SQS offers two main queue types.

### Standard queues

These are the default choice for most workloads.

They provide:

- high throughput
- at-least-once delivery
- best-effort ordering

This is usually enough for asynchronous work where processing order is not the primary requirement.

### FIFO queues

FIFO means first in, first out.

These queues are used when ordering and deduplication behavior matter more strictly.

They provide:

- ordered delivery within message groups
- deduplication controls

The trade-off is that FIFO adds design constraints and typically lower throughput characteristics than unconstrained standard queue usage.

The architect decision is simple in principle: do not choose FIFO unless ordering is a real business requirement. Using FIFO by default creates unnecessary constraints.

---

## 16.4 Amazon SNS: Publish-Subscribe Fan-Out

Amazon Simple Notification Service, or Amazon SNS, is a publish-subscribe service.

A publisher sends one message to a topic, and multiple subscribers can receive copies.

SNS is useful when one event should trigger several downstream reactions.

Examples:

- an order-created event notifies analytics, fulfillment, and customer communication systems
- operational alerts are sent to email, chat, or automated handlers
- one application event fans out to multiple SQS queues for independent processing

SNS is not a queue replacement. It is a fan-out mechanism.

That distinction matters because subscribers may be:

- Lambda functions
- SQS queues
- HTTP endpoints
- email or SMS targets in some notification scenarios

If you need independent durable processing, SNS often works best when it fans out into separate SQS queues rather than pushing complexity directly into every consumer endpoint.

---

## 16.5 Amazon EventBridge: Event Routing at System Scale

Amazon EventBridge is an event bus service designed for event routing between AWS services, SaaS integrations, and custom applications.

Instead of one producer knowing every consumer directly, producers emit events to a bus and rules decide which targets should receive them.

EventBridge is especially useful for:

- application event buses in decoupled architectures
- routing events based on content patterns
- integrating AWS service events with downstream automation
- scheduled rules and event-driven control-plane workflows

Its strength is routing and filtering.

That means EventBridge often fits when you want:

- event contracts that multiple teams can subscribe to
- rules based on event content rather than one fixed topic per use case
- looser coupling between producers and consumers

EventBridge is event routing, not a queue substitute for heavy worker buffering. If the consumer needs durable backlog handling and work pulling, SQS is still often part of the design.

---

## 16.6 How to Choose Between SQS, SNS, and EventBridge

![Messaging choice map comparing queue decoupling, pub-sub fanout, and event-bus routing with retries and idempotent consumers.](images/ch16-sqs-sns-eventbridge-choice-map.svg)

The right service depends on the communication pattern.

Choose SQS when:

- one consumer group should process durable work items
- you need backlog absorption and pull-based consumption
- you want to protect a downstream system from spikes

Choose SNS when:

- one message should fan out to multiple subscribers
- publishers should not manage multiple point-to-point sends
- topic-based pub-sub is enough

Choose EventBridge when:

- you want event bus style routing based on event content or source
- many producers and consumers should stay loosely coupled
- AWS service events or scheduled rules are part of the design

In real systems, these services are often combined.

Example pattern:

- an application emits an order event to EventBridge
- rules route the event to several SQS queues
- each queue feeds an independent worker or Lambda consumer

That combination gives routing flexibility plus durable workload buffering.

---

## 16.7 Retries, Dead-Letter Queues, and Idempotency

Messaging systems are only useful if failure behavior is designed clearly.

Important concepts include:

- retries for transient failures
- dead-letter queues for messages that repeatedly fail
- visibility timeout tuning for SQS consumers
- idempotent processing so duplicate delivery does not create duplicate outcomes

For SQS, visibility timeout must be longer than realistic processing time, or the same message may be delivered to another consumer before the first one finishes.

Dead-letter queues help isolate poison messages, but they are not a solution by themselves. You still need a plan for:

- alerting when messages accumulate there
- inspecting failure causes
- replaying or correcting messages safely

SNS and EventBridge also have retry and target-failure behaviors that must be understood before production use.

The real design lesson is this: at-least-once delivery is common, so business operations must be safe to retry.

---

## 16.8 Security, Filtering, and Operational Visibility

Messaging systems carry business events, so access control matters.

You should review:

- who can publish
- who can consume
- whether resource policies are needed for cross-account access
- whether messages contain sensitive data that needs encryption controls

Filtering is equally important for reducing waste.

Examples:

- SNS subscription filter policies can reduce unnecessary consumer traffic
- EventBridge rules can route only the events that match a specific pattern

Operational visibility should include:

- queue depth and age metrics
- consumer error rates
- delivery failure metrics where available
- alarms for growing backlog or dead-letter activity

If messages are flowing but nobody is watching backlog age, the system can fail silently while appearing healthy.

---

## 16.9 Messaging Patterns and Architect Checkpoints

These services are most valuable when used as architectural building blocks rather than isolated features.

Common patterns include:

- queue-based work distribution for asynchronous processing
- topic fan-out for multi-subscriber notifications
- event bus routing for domain events across bounded systems
- API-to-queue handoff for workloads that should not stay synchronous

An architect checkpoint should review:

- what delivery guarantee the business actually needs
- whether ordering is a true requirement or only an assumption
- how duplicate delivery will be handled
- what backlog and replay behavior should look like during incidents
- whether one consumer's failure should affect others

If those questions are unresolved, the integration pattern is not ready for production regardless of how easy the AWS setup looks.

---

## 16.10 Common Mistakes

- using synchronous service-to-service calls where durable queues would better absorb failure and load
- choosing FIFO queues without a true ordering requirement
- assuming a queue guarantees exactly-once business processing
- setting SQS visibility timeout too short for realistic processing time
- sending one event directly to many consumers instead of using fan-out or event routing patterns
- confusing EventBridge routing with queue-style work buffering
- skipping dead-letter handling or never monitoring dead-letter queues
- letting producers and consumers share unclear event contracts
- placing sensitive data in events without reviewing encryption and access boundaries
- ignoring queue depth, age, and retry metrics until a backlog becomes user-visible

---

## 16.11 Hands-On Tasks

1. Create a standard SQS queue and send several test messages.
2. Consume those messages with a Lambda function or small worker and observe visibility-timeout behavior.
3. Create an SNS topic and subscribe an SQS queue to it.
4. Publish one message to the topic and verify that the queue receives a copy.
5. Create an EventBridge rule that matches a simple custom event pattern and targets a Lambda function.
6. Compare the mental model of the SQS queue, SNS topic, and EventBridge bus in your own words.
7. Configure a dead-letter queue and explain what operational process should follow if messages land there.
8. Describe a realistic workload that should use API Gateway plus SQS instead of a long synchronous backend call.

---

## 16.12 Recap

- SQS provides durable queue-based decoupling and backlog absorption.
- SNS provides publish-subscribe fan-out to multiple subscribers.
- EventBridge provides event bus routing and filtering across producers and consumers.
- Delivery guarantees, retries, and ordering behavior differ and must be designed explicitly.
- Dead-letter queues, visibility timeout tuning, and idempotent consumers are key reliability controls.
- Strong messaging architectures choose services by communication pattern, not by brand similarity.

Next: 17: Step Functions

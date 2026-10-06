# 15: API Gateway

An Application Programming Interface (API) is often the front door to an application. Amazon API Gateway helps you publish, secure, and manage APIs so clients can call backend services in a controlled and observable way.

This chapter shows how API Gateway is used in front of AWS Lambda, containers, and other services. You will learn why endpoint type, authentication, throttling, stages, and integrations matter when building APIs that are safe to expose to real users.

---

## 15.1 Why API Gateway Matters

Most production systems need a controlled way for clients to call backend services.

That control layer is not only about routing HTTP requests. It is where you often enforce:

- authentication and authorization
- request validation
- throttling and quotas
- versioning and deployment stages
- observability for request traffic

Amazon API Gateway is AWS's managed API front door service for HTTP, REST, and WebSocket workloads.

It is especially common with Lambda-based systems, but it can also front HTTP services and some AWS service integrations directly.

For a solutions architect, API Gateway matters because it provides a durable boundary between clients and backend implementation details. That boundary helps with security, gradual rollout, operational visibility, and scaling.

Without that boundary, teams often expose backend components too directly and lose control over request policy, client behavior, and failure handling.

---

## 15.2 What API Gateway Actually Provides

API Gateway receives client requests, matches them to routes or methods, and sends them to a configured integration target.

Depending on the API type and design, it can also handle:

- TLS termination
- custom domains
- request and response transformation
- authentication hooks
- usage plans and rate limiting
- metrics and access logging

This is important because API Gateway is not just a router. It is a policy and mediation layer.

That means architects should think about three boundaries separately:

- client boundary: what the caller sees and is allowed to send
- API boundary: what policies and validation are enforced at the front door
- backend boundary: what service actually fulfills the request

When those boundaries are designed clearly, APIs are easier to evolve. When they are not, backend behavior leaks outward and clients become tightly coupled to internal implementation choices.

---

## 15.3 API Types and When to Choose Them

![API Gateway request pipeline showing domain entry, route matching, authorization, backend integration, and throttling or logging controls.](images/ch15-api-gateway-request-pipeline.svg)

API Gateway supports multiple API models, and the choice affects cost, feature depth, and operational complexity.

### HTTP APIs

HTTP APIs are typically the simpler and lower-cost option.

They are often a strong fit for:

- straightforward Lambda-backed APIs
- modern JWT-based authorization flows
- internal or public APIs that do not need the full older REST API feature set

### REST APIs

REST APIs provide a broader feature set and more mature controls in some areas.

They are often chosen when you need:

- advanced request transformation behavior
- API keys and usage-plan-oriented controls
- legacy compatibility with an existing design pattern

### WebSocket APIs

These are used for bidirectional, long-lived client communication patterns such as:

- real-time dashboards
- collaborative applications
- push-style application messaging

The architect question is not, "Which API type is best in general?" It is, "Which API type provides the needed control plane without unnecessary complexity or cost?"

For many new request-response APIs, HTTP APIs are the sensible first evaluation point.

---

## 15.4 Routes, Methods, Stages, and Custom Domains

An API needs structure.

That structure usually includes:

- routes or resources
- HTTP methods such as GET, POST, PUT, and DELETE
- deployment stages such as dev, test, and prod
- optional custom domains for stable client-facing names

Stages are operationally important because they let you separate environments and rollout behavior.

Good API design usually keeps these concerns explicit:

- URL structure should reflect business resources clearly
- stages should not become a substitute for proper environment isolation where separate accounts are more appropriate
- custom domains should hide implementation-specific hostnames from consumers

Versioning also matters. If you expect breaking changes, plan the version boundary deliberately. That may appear in:

- the path
- the domain structure
- the deployment process

The point is not to over-engineer versioning from day one. The point is to avoid pretending APIs never change.

---

## 15.5 Authentication, Authorization, and Exposure Control

API Gateway can enforce several access patterns depending on the use case.

Common options include:

- IAM-based authorization for AWS-authenticated callers
- Cognito or JWT-based authorization for user-facing applications
- Lambda authorizers for custom token validation logic

The correct choice depends on who the caller is.

Examples:

- an internal AWS service or script may use IAM authorization
- a mobile or web application may use JWT tokens issued by an identity provider
- a specialized enterprise integration may require custom authorization logic

Security should not stop at identity. Exposure scope matters too.

Architectural controls can include:

- private APIs for internal access patterns
- resource policies that restrict who can call the API
- AWS WAF in front of public endpoints for application-layer filtering
- rate limits to reduce abuse and accidental overload

Public API does not have to mean fully open API. A well-designed public endpoint still enforces identity, policy, and request discipline.

---

## 15.6 Integrations, Transformations, and Backend Decoupling

API Gateway can integrate with several backend styles.

Common patterns include:

- Lambda proxy integrations
- HTTP integrations for services running behind load balancers or public endpoints
- direct AWS service integrations in some designs

The integration choice affects how much mediation happens at the API layer.

Proxy-style integrations are simple and common because the backend receives the request with minimal front-door transformation. That simplicity is good for speed of development, but it also pushes more responsibility into the backend.

More explicit transformation patterns can decouple the client-facing contract from the backend shape, but they add complexity.

Important questions:

- Should the backend own request validation, or should some validation happen earlier?
- Do clients need a stable contract even if backend payloads evolve?
- Are backend errors being mapped into useful client responses, or just passed through blindly?

An API layer should reduce coupling, not become a thin tunnel that exposes backend internals directly.

---

## 15.7 Throttling, Quotas, and Failure Handling

Every API needs traffic control.

Without it, one badly behaved client or one sudden spike can damage the whole system.

API Gateway provides controls such as:

- throttling limits
- quotas through usage plans in supported models
- request size and payload boundaries
- timeout constraints that shape backend expectations

These controls are not only about abuse prevention. They are part of resilience design.

If the backend is Lambda, traffic spikes can create concurrency surges. If the backend is a container service or database-backed application, request amplification can exhaust CPU, memory, or connection pools.

A good front-door design considers:

- what happens when the backend is slow
- which errors should be retried by the client
- how to communicate rate limits clearly
- whether some traffic should be moved to asynchronous patterns instead of synchronous APIs

Not every operation should be a live request-response call. Some workloads become more reliable when the API accepts a request and places durable work onto a queue.

---

## 15.8 Observability, Caching, Cost, and Performance

API Gateway is part of the runtime path, so it needs operational visibility.

Important signals include:

- request count
- latency
- integration latency
- error rates by status code family
- throttled requests

Access logs and structured correlation identifiers help trace a request across the API layer and backend services.

Caching can reduce backend load for read-heavy patterns, but it should be used deliberately. The architect must consider:

- whether responses are safe to cache
- how stale data is tolerated
- how cache invalidation will happen

Cost also depends on traffic shape. API Gateway is operationally convenient, but per-request pricing matters at high scale.

That means the right design sometimes includes:

- moving static content to CloudFront and S3
- using asynchronous processing where synchronous APIs would be wasteful
- choosing HTTP APIs when the simpler feature set is enough

Performance should be evaluated across the full request path, not only the API service in isolation.

---

## 15.9 API Gateway Design Patterns and Decision Criteria

API Gateway is strongest when you need a managed entry layer with security, governance, and integration control.

Good fit patterns include:

- Lambda-backed APIs for web and mobile clients
- internal service APIs with controlled authentication and rate limits
- asynchronous request intake where the API fronts queue-based workflows
- multi-environment APIs with staged rollout and clear client contracts

Less ideal patterns include:

- extremely latency-sensitive internal traffic where another integration model is simpler
- APIs whose needs are so minimal that a full gateway layer adds more complexity than value

An architect checkpoint for API Gateway should review:

- who the callers are
- how identity will be enforced
- what backend contract should remain hidden
- what traffic shaping is required
- what the fallback strategy is when the backend is degraded

If the API front door does not make the system safer, clearer, or easier to operate, it may not be designed at the right abstraction level yet.

---

## 15.10 Common Mistakes

- exposing backend services directly without a clear API boundary
- choosing an API type based on habit instead of required features and cost profile
- pushing every workload into synchronous APIs when queue-based or event-driven designs would be safer
- skipping throttling and letting clients overload downstream systems
- using overly permissive authorization or treating public reachability as acceptable by default
- leaking backend error details directly to clients
- using stages as the only form of environment separation when account-level isolation is needed
- adding transformation complexity without a clear decoupling benefit
- ignoring access logs, correlation IDs, and latency breakdowns
- assuming API Gateway alone solves application security without backend validation and safe coding practices

---

## 15.11 Hands-On Tasks

1. Create a small HTTP API that routes one GET request to a Lambda function.
2. Add a second route and explain how route structure should map to business resources rather than internal implementation names.
3. Configure logging and inspect latency and status metrics for a few test calls.
4. Add authorization and explain why the chosen method fits the caller type.
5. Set a throttling limit and describe what problem it protects against.
6. Return a controlled error from the backend and verify the client-facing response shape.
7. Explain when this API should remain synchronous and when it should instead hand work to SQS.
8. Sketch a versioning strategy for a future breaking change.

---

## 15.12 Recap

- API Gateway is a managed front door for APIs, not just a request router.
- The right API type depends on needed features, cost sensitivity, and client pattern.
- Routes, stages, custom domains, and version boundaries should be deliberate operational choices.
- Authorization, resource policies, throttling, and backend isolation are core security and reliability controls.
- Integration style affects coupling, error handling, and where validation logic belongs.
- Strong API designs treat observability, traffic shaping, and backend protection as first-class concerns.

Next: 16: SQS, SNS, and EventBridge

## 2: Fundamentals of System Design

This chapter covers the core trade-off forces that drive every system design decision and the fundamental building blocks — microservices, load balancers, databases, caches, file storage, and messaging queues — used to construct large-scale systems. Understanding these forces and components is the foundation for every design in this guide.

### 2.1 The Core Forces Behind Most System Designs

Nearly every design decision in distributed systems is a response to a small number of recurring forces:

- **Latency (how long one request or operation takes)** — how long one operation takes from the user's point of view.
- **Throughput (how much work the system finishes per second)** — how much work the system can complete per second.
- **Availability (how often the system stays usable)** — whether the system keeps serving requests during failures.
- **Consistency (whether different parts of the system see the same data at the same time)** — whether different parts of the system agree on the same value at the same time.
- **Durability (whether acknowledged data survives crashes)** — whether acknowledged data survives crashes and recovery.
- **Operability (how easy the system is to run, debug, and change safely)** — whether humans can debug, deploy, and evolve the system safely.

Those forces interact. Batching improves throughput but can hurt latency. Stronger consistency improves correctness but may reduce availability during partitions. More caching reduces latency and cost, but increases staleness risk. Sharding (splitting data across many machines) improves scale, but complicates joins, transactions (groups of operations that succeed or fail together), and debugging.

That is why "best design" is rarely absolute. Search prefers low latency and can tolerate slightly stale results. A bank ledger prefers durability and correctness over raw write throughput. A metrics pipeline often prefers availability and eventual convergence over strict transactional guarantees. When a system-design answer feels vague, it is usually because the speaker has not yet said which force matters most.

---

### 2.2 Microservices

The microservice architecture structures an application as a collection of small, independently deployable services. Each service:

- Is organized around a specific **business capability**
- Is owned by a **small team** (the "two-pizza rule": a team small enough to be fed by two pizzas)
- Is **independently deployable** and **scalable** without coordinating with other teams
- Is **loosely coupled** from other services — changes inside one service do not require changes in others
- Is **highly maintainable and testable** in isolation
- **Owns its own data** — no shared databases between services

**Real-world example:** Netflix decomposes its platform into hundreds of microservices — user auth, recommendations, billing, video encoding, content delivery, and more. A bug in the recommendations service does not bring down billing. Each service is deployed dozens of times per day by its own team.

#### Monolith vs. Microservices: When to Choose Each

Before reaching for microservices, it is worth understanding what a monolith is and when it is the better option.

A **monolith** is a single deployable unit where all business logic, data access, and API handling live together. It is faster to develop initially, trivial to test end-to-end, and has zero network overhead between components. The right choice for teams under ~15 engineers, products in early discovery, and systems where operational simplicity matters more than independent scalability.

A **modular monolith** is an intermediate option: code is organized into clearly separated modules with defined interfaces, but it is still deployed as one unit. This is often the right answer for teams that have not yet found their true service boundaries but want clean code organization.

**Microservices** become the right choice when:
- Different parts of the system have genuinely different **scaling requirements** (the video encoding pipeline needs 100× more CPU than the user auth service).
- Teams are large enough that a shared codebase creates **coordination overhead and deploy bottlenecks**.
- Parts of the system need **different technology stacks** (ML inference in Python, low-latency trading logic in C++, web APIs in Go).
- **Blast radius** from failures must be contained — a bug in one service should not take down unrelated capabilities.

| Dimension | Monolith | Modular Monolith | Microservices |
|---|---|---|---|
| Deployment complexity | Single deploy | Single deploy | Per-service CI/CD pipelines |
| Operational overhead | Low | Low | High (service mesh, discovery, observability) |
| Independent scaling | No | No | Yes |
| Network latency between components | Zero (in-process) | Zero (in-process) | Real (adds ~1–5ms per hop) |
| Data isolation | Shared DB | Shared DB | DB-per-service |
| Team autonomy | Low | Medium | High |
| Best for | Early-stage, small teams | Growing teams, unclear boundaries | Mature products, multiple teams |

#### How to Split Services: The Five Axes

Poor service boundaries are the most common microservices mistake. Use these axes to decide where to draw lines:

1. **Business capability** — split around what the business does, not how the code is organized technically. "Order Management," "Payment Processing," "User Profile" are good boundaries. "Database Layer" or "Utility Functions" are bad ones.
2. **Data ownership** — each service should own its primary data store exclusively. If two services need to join data at the database level, they are probably too fine-grained.
3. **Change cadence** — a component that changes frequently (product catalog) should not be coupled to one that rarely changes (billing rules). Different change rates justify different services.
4. **Scaling profile** — components with different resource needs (CPU, memory, I/O) benefit from independent scaling. Video transcoding and user authentication have nothing in common operationally.
5. **Transaction boundary** — if two operations must always succeed or fail together atomically, keeping them in the same service is simpler than coordinating a distributed transaction. Split across services only when the business can tolerate eventual consistency between them.

#### Inter-Service Communication

Services communicate in one of two ways, and choosing the right one for each interaction is critical:

**Synchronous (request-response):**
- The caller waits for a response before proceeding.
- Used for: queries where the result is needed immediately (fetch user profile, check inventory).
- Protocols: REST over HTTP, gRPC (preferred for internal calls — binary encoding, streaming, strong contracts).
- Risk: the caller is blocked while the callee processes. If the callee is slow, the caller slows down too — creating latency amplification across chains of services.

**Asynchronous (event-driven):**
- The caller publishes an event and moves on. Downstream services consume it at their own pace.
- Used for: operations where the caller does not need an immediate result (send email after order placed, update search index after product updated).
- Protocols: Kafka, Amazon SQS, RabbitMQ.
- Benefit: temporal decoupling — the producer and consumer do not need to be running simultaneously. The queue absorbs bursts.
- Risk: eventual consistency — the downstream service may lag behind the producer by seconds or minutes.

**The rule of thumb:** use synchronous calls for queries (read operations) and async events for commands that trigger side effects in other services (write operations with fan-out).

#### Key Resilience Patterns

When services call each other synchronously, failures cascade unless you actively contain them. These four patterns are the standard toolkit:

**Circuit Breaker** — a wrapper around outbound calls that tracks the error rate. If errors exceed a threshold (e.g., 50% of calls in the last 10 seconds fail), the circuit "opens" and subsequent calls fail immediately without waiting for a timeout. This prevents a slow downstream service from holding threads and connections in the calling service. After a cooldown period, the circuit allows a probe request through to check if the downstream has recovered. Implemented by: Resilience4j (Java), Polly (.NET), or at the infrastructure layer via a service mesh (Istio, Linkerd).

**Timeout** — every outbound call must have a deadline. Without a timeout, a hung downstream service will hold a thread in the caller indefinitely, eventually exhausting the thread pool. A common mistake is setting timeouts only at the outermost API gateway while inner service-to-service calls have none.

**Retry with exponential backoff and jitter** — transient failures (network blip, brief overload) are common in distributed systems. Retrying the same call after a short delay often succeeds. Exponential backoff prevents retry storms: wait 100ms, then 200ms, then 400ms. Jitter (adding randomness to the wait time) prevents all retrying clients from hitting the recovering service at exactly the same moment.

**Bulkhead** — isolate resources so that one slow integration does not exhaust resources shared with other integrations. Example: use a separate thread pool for calls to the payment service, so a payment outage does not exhaust threads needed for the inventory service. Named after the watertight compartments in a ship's hull.

#### The Saga Pattern: Distributed Transactions Without 2PC

Microservices with separate databases cannot use a traditional database transaction that spans services. The naive alternative — distributed two-phase commit (2PC) — is slow, fragile, and creates tight coupling between services. The better solution is the **Saga pattern**.

A Saga is a sequence of local transactions, each in its own service, where each step publishes an event that triggers the next step. If a step fails, the Saga executes **compensating transactions** to undo the completed steps.

**Example: placing an e-commerce order**
1. Order Service creates the order (status: PENDING) → publishes `OrderCreated` event.
2. Inventory Service reserves the items → publishes `InventoryReserved` event.
3. Payment Service charges the card → publishes `PaymentProcessed` event.
4. Order Service marks the order CONFIRMED.

If payment fails at step 3:
- Payment Service publishes `PaymentFailed` event.
- Inventory Service receives it and releases the reserved items (compensating transaction).
- Order Service marks the order CANCELLED.

**Two Saga execution styles:**
- **Choreography** — each service listens for events and reacts. No central coordinator. Simple to implement but hard to trace when a flow goes wrong across many services.
- **Orchestration** — a dedicated Saga Orchestrator service explicitly calls each step and handles compensations. Easier to visualize and debug but introduces a central component that must be kept reliable.

#### Data Management in Microservices

The database-per-service pattern is non-negotiable for true independence, but it creates challenges that a shared database does not have.

**Database-per-service:** Each service has its own schema, and no other service queries it directly. Cross-service data needs are satisfied through API calls or events. This means:
- The Order Service cannot JOIN against the User Service's table — it must call the User Service's API or maintain a local copy of the data it needs.
- Schema changes in one service do not break others.
- Each service can choose the right storage technology for its workload (Postgres for transactional data, Cassandra for write-heavy time-series, Redis for ephemeral session state).

**The CQRS pattern (Command Query Responsibility Segregation):** Separate the data model used for writes (commands) from the data model used for reads (queries). The write model optimizes for correctness and consistency; the read model optimizes for query performance (denormalized, pre-joined, cached). Changes on the write side are propagated to the read side asynchronously via events. This is especially useful when a service's read patterns are very different from its write patterns (e.g., a social feed where writes are per-user but reads are per-follower).

**The Outbox Pattern:** When a service needs to update its own database and publish an event atomically, it writes both the data change and the event to the same local database in a single transaction. A separate process (the "outbox publisher") reads unpublished events from the outbox table and forwards them to the message broker. This guarantees that events are never lost even if the broker is temporarily unavailable at write time.

#### Service Discovery

In a dynamic environment where services start, stop, and scale horizontally, hardcoding IP addresses is not viable. Service discovery solves this.

- **Client-side discovery:** The client queries a service registry (Consul, etcd, Eureka) to get the list of healthy instances and picks one using a load balancing algorithm. The client owns the routing logic.
- **Server-side discovery:** The client sends requests to a load balancer or API gateway, which queries the registry and forwards to a healthy instance. The client has no knowledge of the registry.
- **Kubernetes DNS:** In Kubernetes, each service gets a stable DNS name (e.g., `payment-service.payments.svc.cluster.local`). The kube-proxy layer handles routing to healthy pods transparently. This is the most common form of service discovery for containerized microservices.

#### API Gateway

An API gateway is the single entry point for all external traffic into a microservices system. It handles concerns that should not live in every individual service:

- **Authentication and authorization** — validate JWT tokens, enforce OAuth scopes.
- **Rate limiting** — protect backend services from overload by limiting calls per client.
- **Request routing** — forward `/api/orders/*` to the Order Service and `/api/users/*` to the User Service.
- **Protocol translation** — accept REST from external clients, translate to gRPC for internal services.
- **Response aggregation** — combine responses from multiple services into a single API response (the Backend-for-Frontend pattern).
- **Observability** — log every request, emit metrics, inject trace IDs.

Common tools: AWS API Gateway, Kong, Nginx, Envoy. The API gateway should be thin — it routes and enforces policies, but business logic stays in the services.

#### Design Rationale

A monolith is fast to start with, but as the codebase grows past ~50 engineers, a single deploy cycle becomes a coordination nightmare — one broken test blocks the whole release train. Microservices give each team an independent deploy pipeline. At Amazon, the move to services was driven by a 2002 Jeff Bezos mandate: all data and functionality must be exposed via service interfaces, with no other form of inter-process communication.

The deeper reason microservices work at scale is **Conway's Law**: organizations tend to produce architectures that mirror their communication structures. A company with 20 product teams building a monolith spends enormous energy coordinating changes. The same company with well-defined service boundaries lets each team move at its own pace.

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| Service crashes | That capability is unavailable | Health checks + auto-restart (Kubernetes liveness probes) |
| Network partition between services | Cascading failures | Circuit breakers, timeouts, retries with exponential backoff and jitter |
| Shared database modified by one team | Other services break on schema change | Database-per-service ownership; schema changes via backward-compatible migrations |
| Deployment of bad code | Regression for one service | Canary deployments, blue-green deployments, feature flags |
| Service discovery failure | Services cannot find each other | Consul, Kubernetes DNS with fallback to static IPs |
| Saga compensation fails mid-flow | Data inconsistency across services | Idempotent compensating transactions; human-review queue for stuck sagas |
| Outbox publisher crashes | Events not delivered to broker | Outbox publisher is stateless and restartable; events remain in DB until published |
| API gateway overload | All services become unreachable | Rate limit at the gateway; autoscale the gateway tier; provision headroom for peak |

**Real-world failure:** A misconfigured deploy of Amazon's Route 53 DNS service caused a cascading failure that took down a large portion of AWS US-East-1 for several hours. Services that had implemented circuit breakers degraded gracefully; services that retried aggressively without backoff amplified the outage.

#### How much will it cost?

A minimal microservices setup for a mid-sized startup (10 services, 3 instances each):

| Resource | Monthly Cost (AWS) |
|---|---|
| 30 × t3.medium EC2 instances | ~$1,000 |
| 10 × RDS db.t3.small (one DB per service) | ~$800 |
| ALB + NLB load balancers | ~$200 |
| CloudWatch monitoring | ~$150 |
| **Total baseline** | **~$2,150/month** |

At scale (Netflix-level, thousands of services), the cost runs into tens of millions/year — largely offset by engineering velocity gains and reduced incident blast radius. The hidden cost of microservices is **operational complexity**, not infrastructure: more deployable units, more failure surfaces, and more observability tooling to buy and maintain.

#### Operations

- **Service catalog** (e.g., Backstage by Spotify) tracks every service, its owner, runbooks, and on-call rotation. Without this, services become orphans with no clear owner.
- **Centralized logging** (ELK, Datadog, Splunk) with structured logs + **correlation IDs** — a single ID injected at the API gateway and propagated through every service so a full request trace can be reconstructed from logs.
- **Distributed tracing** (Jaeger, Zipkin, AWS X-Ray) to visualize end-to-end latency across service hops and pinpoint which service introduced a regression.
- **On-call rotations** per service team — the team that owns the service is on-call for it. This creates accountability ("you build it, you run it").
- **Runbooks** for common failures: how to restart the service, how to roll back, what dashboards to check, and how to drain traffic during a deploy.
- **Contract testing** (Pact) — verify that the API contract between a producer service and its consumers does not break when either side changes, without requiring a full integration test environment.

#### How does it evolve in 3 years?

| Year | Typical Evolution |
|---|---|
| Year 1 | 5–10 services. Teams are still figuring out service boundaries. Most services share an API gateway and a Kubernetes cluster. Synchronous REST between services. Simple retry logic in application code. |
| Year 2 | Service mesh (Istio, Linkerd) introduced to handle mTLS, retries, circuit breaking at the infrastructure layer. Schema Registry enforces event contracts. Saga orchestration introduced for multi-step flows. Service catalog becomes mandatory. |
| Year 3 | Platform engineering team provides golden paths (templates, CI/CD pipelines, observability) so product teams do not reinvent infrastructure. Event-driven architecture adopted for async workflows. CQRS introduced for high-read services. Separate read models pre-computed via stream processing (Flink, Kafka Streams). |

---

### 2.3 Load Balancers

A load balancer sits between clients and a pool of backend servers. Every incoming request arrives at the LB, which picks a healthy backend, forwards the request, and streams the response back to the client. From the client's perspective it looks like a single server; from the backend's perspective, load is spread evenly across the whole fleet.

```
Client ──► Load Balancer ──► Server A
                         ├──► Server B
                         └──► Server C
```

Without a load balancer, all traffic hits one server. A single modern server handles roughly 10 K–100 K requests/second depending on workload complexity. A load balancer lets you add more servers and distribute load automatically — this is **horizontal scaling**. It also provides **built-in failover**: the moment a backend fails its health check, the LB drains its connections and stops routing new traffic to it, usually within 10–30 seconds.

---

#### Layer 4 vs. Layer 7

The OSI model defines networking layers. Load balancers operate at either Layer 4 (Transport) or Layer 7 (Application), and the choice has real performance and routing implications.

| | Layer 4 (Transport) | Layer 7 (Application) |
|---|---|---|
| Routes on | IP address + TCP/UDP port | HTTP headers, URL path, query params, cookies |
| TLS termination | No (passes encrypted bytes through) | Yes (decrypts, inspects, re-encrypts) |
| Content-based routing | No | Yes (`/api/video/*` → video fleet, `/api/auth/*` → auth fleet) |
| Throughput | Very high — no packet inspection overhead | Slightly lower — parses HTTP on every request |
| Typical use | Database proxies, raw TCP services, gaming | Web apps, REST/gRPC APIs, microservices |
| AWS equivalent | NLB (Network Load Balancer) | ALB (Application Load Balancer) |

**When to pick L4:** You need maximum throughput and lowest latency, you are proxying a non-HTTP protocol (e.g., MySQL, Redis, MQTT), or you cannot afford the overhead of TLS termination at the LB.

**When to pick L7:** You need path-based routing, host-based routing, header rewriting, sticky sessions, WAF (Web Application Firewall) integration, or detailed HTTP access logs.

---

#### Load Balancing Algorithms

The algorithm decides *which* backend receives the next request. Choosing the wrong one causes hot spots — one backend saturated while others idle.

| Algorithm | How it works | Best for | Watch out for |
|---|---|---|---|
| **Round Robin** | Cycles through backends in order (A → B → C → A → …) | Homogeneous fleets where every request costs roughly the same | Uneven load if some requests are much heavier |
| **Weighted Round Robin** | Like round robin but higher-capacity servers receive proportionally more requests | Mixed instance types (e.g., c5.2xlarge gets 2× weight of c5.large) | Weights must be re-tuned when fleet changes |
| **Least Connections** | Routes to the backend with the fewest active open connections at that moment | Long-lived connections such as WebSockets, database proxies, file uploads | Slightly higher LB CPU to maintain connection counters |
| **Least Response Time** | Routes to the backend that replied fastest recently | Latency-sensitive APIs where backend speed varies by request type | Slow backends starved entirely if one backend is always fastest |
| **IP Hash** | Hashes the client IP to always map to the same backend | Stateful workloads where session state is stored locally | Backend failure changes hash mapping, breaking all sessions |
| **Random with Two Choices** (Power of Two) | Picks two backends at random, routes to the least loaded of the pair | Very large fleets where centralized state tracking is expensive | Slightly worse distribution than Least Connections at small scale |

**Rule of thumb:** Default to **Least Connections** for general web workloads. Switch to **Weighted Round Robin** when your fleet is heterogeneous. Avoid **IP Hash** for stateful session storage — externalize session state to Redis instead.

---

#### TLS Termination

HTTPS traffic is encrypted end-to-end using TLS (Transport Layer Security). The load balancer can handle TLS in three ways:

1. **TLS Termination (most common):** The LB decrypts traffic, routes in cleartext to backends on the private network. Backends do not need TLS certificates. Pros: cheaper backends, full L7 visibility. Cons: traffic inside the datacenter is unencrypted (acceptable on a trusted private network).

2. **TLS Passthrough:** The LB forwards encrypted bytes without decrypting. Backends terminate TLS themselves. Pros: end-to-end encryption. Cons: L7 routing is impossible since the LB cannot read the HTTP headers.

3. **TLS Re-encryption:** The LB terminates, inspects, then re-encrypts before forwarding to backends. Full end-to-end encryption *and* L7 routing. Cons: double TLS overhead.

Certificate management is the most common operational pain point. Automate renewal with **AWS Certificate Manager (ACM)** or **Let's Encrypt with cert-manager** — never manage certificates manually.

---

#### Health Checks

The LB continuously probes backends to detect failures before they affect users.

| Health check type | How it works | When to use |
|---|---|---|
| **TCP** | Opens a connection; success if the port accepts | Simple, low overhead; does not verify app is healthy |
| **HTTP/HTTPS** | Sends a GET to a path (e.g., `/health`); success if response is 2xx | Recommended for web services — verifies app logic is up |
| **Custom script** | Runs a script on the backend | Rare; used for complex startup readiness checks |

**Health check parameters to configure:**
- **Interval:** How often to probe (e.g., every 10 s).
- **Timeout:** How long to wait for a response (e.g., 5 s).
- **Healthy threshold:** Consecutive successes before marking healthy (e.g., 2).
- **Unhealthy threshold:** Consecutive failures before marking unhealthy (e.g., 3).

A backend marked unhealthy has its **connections drained** (in-flight requests complete; new requests stop) and then removed from rotation. This is called **connection draining** or **deregistration delay** (AWS default: 300 s).

Design your `/health` endpoint to check real dependencies — a 200 response that ignores a broken database connection is useless. Return 200 only when the service can actually serve traffic.

---

#### Sticky Sessions (Session Affinity)

By default, each request can land on any backend. Sticky sessions pin a client's requests to the same backend using a **cookie** (L7) or **source IP** (L4).

**Why you might use it:** Legacy apps that store session state in memory on the server (shopping cart, login token) cannot handle requests hopping between backends.

**Why you should avoid it:**
- If the pinned backend crashes, the user's session is lost.
- Traffic distribution becomes uneven as some backends accumulate sticky connections.
- It prevents true horizontal scaling.

**Better approach:** Externalize session state to a shared store (Redis, DynamoDB). Now every backend is stateless and can serve any user's request — no stickiness needed.

---

#### Types of Load Balancers

| Type | Examples | Pros | Cons |
|---|---|---|---|
| **Cloud-managed** | AWS ALB/NLB, GCP Cloud Load Balancing, Azure Load Balancer | Zero ops, auto-scales, multi-AZ by default, built-in TLS cert management | Vendor lock-in, can be expensive at very high scale |
| **Software (self-managed)** | NGINX, HAProxy, Envoy, Caddy | Full control, no vendor lock-in, can run anywhere | You own patching, HA configuration, scaling |
| **Hardware** | F5 BIG-IP, Citrix ADC | Extreme throughput for on-prem data centers | Expensive ($50 K+), inflexible, no cloud-native integration |
| **DNS-based** | AWS Route 53 weighted routing, Cloudflare | Global geographic routing, no single LB bottleneck | No health check at connection level; DNS TTL delays (30–60 s) on failover |

**Cloud-managed LBs are almost always the right default** unless you have specific cost or compliance requirements that force self-managed.

---

#### Global Load Balancing

A single regional LB routes traffic within one datacenter region. Global load balancing adds a layer above that to route users to the *nearest* healthy region.

```
User in Tokyo ──► Global LB ──► Asia-Pacific Region
User in NYC   ──► Global LB ──► US-East Region
User in London ──► Global LB ──► EU-West Region
```

Options:
- **AWS Global Accelerator:** Anycast IPs that route to the nearest AWS region over the AWS backbone, cutting latency significantly vs. the public internet.
- **Cloudflare Load Balancing:** Routes to origin based on latency, geography, and health checks. Also benefits from Cloudflare's CDN and DDoS protection.
- **Route 53 Latency-Based Routing:** DNS-level routing to the lowest-latency region. Simple but subject to DNS TTL delay on failover.

Use global load balancing when you have users across multiple continents or need sub-100 ms latency globally.

---

**Real-world example:** During Amazon Prime Day, the AWS ALB fleet absorbs hundreds of millions of requests per second globally. Each regional ALB autoscales its own capacity, while Route 53 and Global Accelerator handle cross-region routing. A backend fleet of thousands of EC2 instances uses Least Connections routing so that heavier requests (large product pages) do not pile onto the same servers.

---

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| Load balancer itself crashes | Total outage (single point of failure) | Active-passive LB pair (e.g., AWS ALB is managed and multi-AZ by default) |
| Health check misconfigured | LB routes to dead servers | Test health check endpoints explicitly; `/health` must check real dependencies |
| SSL/TLS certificate expired | HTTPS traffic fails at termination | Automate certificate renewal (AWS ACM, Let's Encrypt with cert-manager) |
| Sticky sessions + server failure | User session lost | Store sessions in Redis externally, not on the server |
| LB overloaded | High latency or drops | Pre-provision for peak; use autoscaling on the backend fleet |
| Connection draining too short | In-flight requests cut off during deploys | Set deregistration delay ≥ your 99th-percentile request duration |
| Thundering herd after failover | Surviving backends overwhelmed | Implement circuit breakers and request queuing on backends |

#### How much will it cost?

| LB Type | Monthly Cost |
|---|---|
| AWS ALB | $16 base + $0.008 per LCU-hour (~$50–200 for medium traffic) |
| AWS NLB | $16 base + $0.006 per LCU-hour |
| AWS Global Accelerator | $18 base + $0.01 per GB data transfer |
| Self-managed NGINX (2 × c5.large) | ~$140/month + ops overhead |
| Self-managed HAProxy (2 × c5.xlarge, HA pair) | ~$280/month + ops overhead |

At high scale (millions of req/s), managed LBs like AWS ALB cost ~$500–5,000/month but save significant ops effort vs. self-managed HAProxy/NGINX.

#### Operations

- Monitor **connection count, request rate, error rate (5xx), target health count, and p99 latency** in CloudWatch or Datadog.
- Set alerts on: unhealthy host count > 1, 5xx error rate > 0.1%, p99 latency spike > 2×  baseline.
- Regularly test failover: terminate a backend instance and verify traffic reroutes within the health check interval (typically 30 seconds).
- Review access logs for anomalies (bot traffic, sudden spikes from specific IPs).
- Use **slow-start mode** (gradually ramp new instances into rotation) to prevent cold backends from immediately receiving full traffic.
- During deployments, ensure **connection draining** is enabled so in-flight requests complete before a backend is deregistered.

#### How does it evolve in 3 years?

| Year | Evolution |
|---|---|
| Year 1 | Single regional ALB in one availability zone. Manual scaling rules. Basic HTTP health checks. |
| Year 2 | Multi-AZ ALB for high availability. Global Accelerator or Cloudflare for geographic routing. Automated autoscaling policies on backend fleet. TLS certificates automated via ACM. |
| Year 3 | Service mesh (Istio/Envoy) handles east-west (service-to-service) load balancing with mTLS, circuit breaking, and traffic shaping. External LB handles north-south (user-to-cluster) only. Canary releases, A/B routing, and weighted traffic splits done at the LB/mesh layer without code deploys. |

---

### 2.4 Databases

A database provides structured, durable storage with access control and consistency guarantees.

**ACID (transaction guarantees for correctness and crash safety) guarantees:**
- **Atomicity** — A transaction succeeds entirely or not at all. (Bank transfer: deduct A and credit B must both succeed.)
- **Consistency** — Data transitions from one valid state to another. (A balance cannot go negative if the constraint disallows it.)
- **Isolation** — Concurrent transactions do not interfere. (Two users buying the last item simultaneously — only one succeeds.)
- **Durability** — Committed data survives crashes. (Data flushed to disk before acknowledging the commit.)

**SQL (the relational database language and ecosystem used by systems like Postgres and MySQL) vs NoSQL (non-relational data stores built for flexibility or scale):**

| Feature | SQL (Postgres, MySQL) | NoSQL (Cassandra, MongoDB, DynamoDB) |
|---|---|---|
| Schema | Fixed, structured | Flexible, schema-less |
| Scaling | Vertical (primarily) | Horizontal |
| Transactions | Full ACID | Eventual consistency (a model where replicas may differ briefly but converge later) (usually) |
| Query model | Rich SQL joins, aggregations | Key-value, document, or column scans |
| Best for | Financial records, user profiles, joins | High write throughput, flexible/dynamic data, global scale |

**Real-world example:** Stripe uses Postgres for its core payments ledger (ACID required) but uses Redis for rate-limit counters and DynamoDB for audit log event streams (write-heavy, no joins needed).

#### Design Rationale

SQL databases are the right default when data has relationships, requires consistent multi-row updates, and needs complex queries. NoSQL is the right choice when write throughput exceeds what a single SQL primary can handle (typically >100K writes/second), when the data model is inherently key-based, or when global distribution with low write latency is required (Cassandra's leaderless design handles multi-region writes natively).

**Example decision point:** Instagram's user feed metadata is stored in Cassandra (high write throughput, simple key lookups), but the user's account settings are in Postgres (relational, low write volume, requires consistency).

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| Primary DB crashes | All writes fail | Automatic failover to read replica (extra copies of data on other machines) (RDS Multi-AZ: ~60s failover) |
| Slow query locks the table | All subsequent queries queue up | Query timeouts, `EXPLAIN ANALYZE`, index (extra data structures that make lookups faster) optimization |
| Disk fills up | Database crashes or becomes read-only | Monitor disk usage, set alerts at 70% and 85% |
| Replication (keeping copies of data in sync on multiple machines) lag too high | Reads from replica return stale data | Monitor `replica_lag`; route read-critical queries to primary |
| Accidental `DELETE` without `WHERE` | Entire table wiped | Point-in-time recovery (PITR); test restore procedures regularly |

#### How much will it cost?

| Setup | Monthly Cost (AWS RDS) |
|---|---|
| db.t3.medium Postgres, single AZ | ~$60 |
| db.r5.large Postgres, Multi-AZ | ~$420 |
| db.r5.4xlarge Postgres, Multi-AZ + 2 read replicas | ~$3,500 |
| Aurora Serverless v2 (scales 0.5–128 ACUs) | ~$100–5,000+ depending on load |

Storage costs $0.115/GB/month on RDS. A 1 TB database adds ~$115/month just in storage.

#### Operations

- **Schema migrations** via tools like Flyway or Liquibase — never modify production schemas manually.
- **Slow query log** enabled; alert on queries exceeding 500ms.
- **Weekly VACUUM and ANALYZE** on Postgres to reclaim dead row space and update planner statistics.
- **Regular restore drills** — once per quarter, restore a backup to a staging environment and verify data integrity. Undrilled backups are not real backups.
- **Connection pooling** via PgBouncer (Postgres) to avoid the DB exhausting its connection limit at scale.

#### How does it evolve in 3 years?

| Year | Evolution |
|---|---|
| Year 1 | Single Postgres primary + one read replica. Manual backups. |
| Year 2 | Aurora (Postgres-compatible) for auto-scaling storage and up to 15 read replicas. Point-in-time recovery enabled. Connection pooler (PgBouncer) added. |
| Year 3 | Read-heavy traffic migrated to a purpose-built cache (Redis). Write-heavy event streams migrated to Kafka + Cassandra. Postgres retains ownership of transactional core (orders, payments, users). Global tables (DynamoDB Global Tables or Aurora Global Database) added for multi-region read latency. |

---

### 2.5 Caches

A cache is a small, fast storage layer that reduces latency and database load by serving frequently accessed data from memory.

**Cache levels:**

| Level | Example | What it caches |
|---|---|---|
| **Client cache** | Browser cache | HTML, CSS, JS, images |
| **CDN (content delivery network, edge servers that cache content near users) cache** | Cloudflare, CloudFront | Static assets served from edge nodes near the user |
| **Web server cache** | NGINX proxy cache | Full HTTP responses |
| **Database cache** | Query result cache (legacy / rare; prefer application-level caching) | Query result sets |
| **Application cache** | Redis, Memcached | DB query results, computed objects, session tokens |

**Real-world example:** Twitter uses Redis to cache pre-computed timelines for active users. Without the cache, loading a timeline would require a multi-join query across hundreds of millions of tweets and follow relationships — taking seconds per load.

#### Design Rationale

Applications follow a **Zipfian distribution (a skewed pattern where a small set of items gets most of the traffic, often roughly 80/20)** — 80% of requests touch the same 20% of data. Caches exploit this by keeping hot data in fast memory (~100 ns access vs. ~10ms for disk). The result: a cache hit rate of 99% means only 1 in 100 requests hits the database, enabling a single DB instance to serve 100× more users.

**Example:** Facebook's Memcached deployment absorbs billions of cache reads per second, preventing those requests from ever reaching MySQL.

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| Cache node crashes | Cache miss spike → DB overloaded | Cache replication (Redis Sentinel/Cluster); graceful DB fallback with rate limiting (controlling how fast a client may send requests) |
| **Cache stampede (many requests missing the same popular key at once)** (thundering herd) | Many simultaneous misses hit DB for the same key (e.g., cache TTL (Time To Live, meaning how long cached or temporary data stays valid) expires at the same instant for a hot key (popular keys that receive far more traffic than average)) | Probabilistic early expiry; mutex locking on the first miss |
| **Stale data** | Users see outdated information | TTL-based expiry; write-through (a cache pattern where writes update cache and database together) caching; explicit invalidation on update |
| Memory eviction of hot keys | Hot-key misses cause latency spikes | Monitor eviction rate; increase cache capacity or adjust eviction policy |
| Split-brain on cache cluster | Two partitions serve different values for the same key | Quorum (the minimum number of replicas that must agree) reads in Redis Cluster |

**Real-world failure:** In 2016, a major e-commerce site experienced a cache stampede during a flash sale. All product page caches expired simultaneously, sending millions of cache misses to the DB in a few seconds. The DB collapsed. Fix: staggered TTLs with ±10% random jitter.

#### How much will it cost?

| Option | Monthly Cost |
|---|---|
| AWS ElastiCache Redis (cache.r6g.large, 1 node) | ~$120 |
| AWS ElastiCache Redis (cache.r6g.xlarge, 3-node cluster) | ~$720 |
| Self-managed Redis on EC2 (3 × r5.large) | ~$450 + ops overhead |
| Cloudflare CDN (free tier caches static assets globally) | $0–$200 |

A typical mid-scale app spends $200–$1,500/month on caching infrastructure. The ROI is immediate: eliminating DB reads avoids horizontal DB scaling costs many times larger.

#### Operations

- Monitor **cache hit rate** (target > 95%), **eviction rate**, **memory usage**, and **connection count**.
- Alert when hit rate drops below 90% — indicates cache is undersized or TTLs are too aggressive.
- Use Redis's `MONITOR` command sparingly (expensive) or `redis-cli --stat` for lightweight monitoring.
- For Redis Cluster, monitor **replication lag** between primary and replicas.
- Maintain a **cache warming strategy**: on new node joins, pre-populate the cache by replaying recent traffic rather than waiting for organic misses.

#### How does it evolve in 3 years?

| Year | Evolution |
|---|---|
| Year 1 | Single Redis node. Application manually invalidates cache on write. TTL-based expiry as a safety net. |
| Year 2 | Redis Cluster (sharded) for horizontal scale. Sentinel for automatic failover. Write-through caching introduced for critical entities (user sessions, product prices). |
| Year 3 | Multi-tier caching: local in-process cache (Guava, Caffeine) in front of Redis to absorb intra-service hot keys with sub-millisecond latency. CDN caches API responses for read-heavy, publicly accessible endpoints (product catalog, static content). Redis used primarily for user-specific and write-invalidated data. |

---

### 2.6 File System Storage

**Block Storage** — Data organized in fixed-size blocks on disk. Used for high-performance databases and OS volumes. AWS example: EBS (Elastic Block Store). Latency: ~1ms. Not shareable across instances.

**Object Storage** — Data stored as objects (binary blob + metadata + unique key). Designed for massive horizontal scale. AWS example: S3. Latency: ~10–100ms but handles trillions of objects at petabyte scale cheaply.

**Distributed File System (DFS) properties:**

| Property | Description | Example |
|---|---|---|
| **Performance** | High throughput, low latency | GFS, HDFS |
| **Availability** | Accessible despite partial node failures | S3 (99.99% availability) |
| **Scalability** | Scales to petabytes/exabytes | S3, Azure Blob Storage |
| **Reliability** | Replication prevents data loss | S3 stores 3 copies across AZs by default |
| **Data Integrity** | Checksums and atomicity on writes | HDFS CRC verification |
| **Heterogeneity** | Stores images, video, logs, structured data | S3 stores any byte stream |

**Real-world example:** Google's Colossus (successor to GFS) stores all Gmail attachments, Google Drive files, and YouTube videos — exabytes of data, distributed across global data centers.

#### Design Rationale

Block storage is fast but expensive and tied to a single instance. Object storage is cheap ($0.023/GB on S3 vs. $0.10/GB on EBS), globally accessible, and scales infinitely without provisioning. Any service in any region can read from S3 via an API call. This makes object storage the de facto choice for user-generated content (profile photos, video uploads, documents) and large static datasets.

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| S3 regional outage | All objects in that region temporarily inaccessible | S3 Cross-Region Replication (CRR) to a second region |
| Object deleted accidentally | Data permanently lost | S3 Versioning + MFA (multi-factor authentication, meaning more than one proof of identity) Delete; Object Lock for compliance |
| Slow upload/download speeds | Poor user experience for large files | Use presigned URLs + multipart upload for files > 100MB |
| Egress costs explode | Unexpectedly high bill | Use CloudFront CDN to serve objects — CDN-to-S3 is free; only user-to-CDN egress is charged |
| Wrong ACL set | Private objects publicly accessible | Block Public Access at account level; audit with AWS Trusted Advisor |

#### How much will it cost?

| Usage | Monthly Cost (AWS S3) |
|---|---|
| 1 TB storage | ~$23 |
| 100 TB storage | ~$2,300 |
| 1 million PUT requests | ~$5 |
| 10 million GET requests | ~$4 |
| 10 TB egress (to internet) | ~$900 |

Egress is the largest hidden cost. Serving 10 TB/month directly from S3 costs ~$900 in egress alone. Putting CloudFront in front reduces this: CloudFront-to-S3 transfer is free; users pay CloudFront pricing (~$0.085/GB), which also benefits from caching.

#### Operations

- Enable **S3 Storage Lens** for visibility into bucket size, access patterns, and cost by prefix (the starting characters of a word or query).
- Set **S3 Lifecycle Policies**: move objects to S3 Infrequent Access after 30 days ($0.0125/GB); move to Glacier after 90 days ($0.004/GB).
- Monitor **4xx/5xx error rates** from CloudFront or S3 access logs to detect misconfigured bucket policies or expired presigned URLs.
- Enforce **object versioning** on buckets holding critical data; test restore procedures quarterly.

#### How does it evolve in 3 years?

| Year | Evolution |
|---|---|
| Year 1 | Single private S3 bucket with signed URLs for access. Manual lifecycle management. |
| Year 2 | CloudFront CDN in front of S3. Lifecycle policies for tiered storage. Versioning enabled on production buckets. |
| Year 3 | CRR to a secondary region for DR. S3 Intelligent-Tiering for automatic cost optimization. Large media files transcoded and served via a purpose-built media CDN (e.g., AWS MediaConvert + CloudFront). |

---

### 2.7 Messaging Queues

Messaging queues enable **asynchronous** communication between services. Producers write messages to the queue; consumers read and process them independently and at their own pace.

**Core components:**
- **Producer** — The service that creates and publishes messages (e.g., the Uber Ride Service publishes a `RIDE_CANCELLED` event).
- **Consumer** — The service that reads and processes messages (e.g., the Notification Service consumes `RIDE_CANCELLED` to send a push notification).
- **Broker (the system that stores and routes messages)** — The messaging infrastructure that stores and routes messages (Kafka, RabbitMQ, SQS).

**Popular implementations:** Apache Kafka, RabbitMQ, Amazon SQS, Google Pub/Sub (publish-subscribe, where one event can go to many consumers).

**Real-world example:** Uber uses Kafka to propagate all ride lifecycle events (booking, driver location updates, cancellation) between services. The booking service does not wait for the notification service — it fires the event and moves on.

#### Design Rationale

Synchronous HTTP calls between services create tight coupling and cascading failure risk. If the Notification Service is slow or down, a synchronous call from the Booking Service would cause the booking itself to timeout. A queue decouples them: the Booking Service writes to Kafka and returns immediately; the Notification Service processes the event whenever it is ready. This provides:

1. **Temporal decoupling** — Producer and consumer do not need to be running simultaneously.
2. **Load leveling** — A burst of 1M bookings in 10 seconds can be drained from the queue over the next 30 seconds by the consumer, rather than overwhelming it instantly.
3. **Replay** — Kafka retains messages for configurable periods (days/weeks). If the Notification Service had a bug and dropped messages, you can replay the Kafka topic from a past offset.

#### What can fail?

| Failure | Impact | Mitigation |
|---|---|---|
| Broker node crashes | Messages buffered on that node temporarily unavailable | Kafka replication factor ≥ 3; ISR (in-sync replicas, the Kafka replicas that are fully caught up) (in-sync replicas) ensures no data loss |
| Consumer crashes mid-processing | Message not acknowledged, remains in queue | At-least-once delivery; consumer must be idempotent (deduplicate by message ID) |
| Consumer falls behind (lag grows) | Messages pile up; downstream delay increases | Monitor consumer group lag; add consumer instances; alert when lag > threshold |
| Message payload too large | Broker rejects the message | Enforce payload size limits; store large payloads in S3 and pass a reference |
| Poison pill message | One malformed message crashes consumer in a loop | Dead-letter queue (DLQ) for messages failing > N retries; alert on DLQ depth |

**Real-world failure:** In 2019, GitHub's internal queue filled up due to a slow consumer, causing CI job notifications to be delayed by hours. The DLQ caught the overflow and prevented data loss; the team scaled up consumers to drain the backlog.

#### How much will it cost?

| Option | Monthly Cost |
|---|---|
| Amazon SQS (1 billion requests) | ~$400 |
| Amazon MSK (Kafka, 3 × kafka.m5.large brokers) | ~$700 |
| Self-managed Kafka (3 × r5.xlarge + 2 TB EBS) | ~$800 + ops overhead |
| RabbitMQ on CloudAMQP (startup plan) | $19–$300 |

Kafka's operational cost is dominated by **storage** (retained messages) and **replication** (3× storage). A topic retaining 7 days of data at 1 TB/day costs ~$2,100/month in storage alone on AWS MSK. Set retention policies carefully.

#### Operations

- Monitor **consumer group lag** per partition (Kafka's most important operational metric). Alert when lag exceeds 5 minutes of expected throughput.
- Monitor **broker disk usage** — Kafka does not auto-delete unless retention policy fires. Alert at 70%.
- Use **Kafka UI** (Conduktor, AKHQ) for topic browsing, consumer group management, and lag dashboards.
- Define **DLQ policies** for every consumer: messages that fail > 3 retries go to a dead-letter topic for manual inspection.
- Run **Schema Registry** (Confluent, AWS Glue) to enforce message schema contracts between producers and consumers, preventing deserialization errors.

#### How does it evolve in 3 years?

| Year | Evolution |
|---|---|
| Year 1 | RabbitMQ or Amazon SQS for simple async jobs (email sending, image processing). Single consumer per queue. |
| Year 2 | Kafka adopted for high-throughput event streaming (user activity, transactions). Consumer groups enable parallel processing. Schema Registry enforces contracts. |
| Year 3 | Event-driven architecture: Kafka becomes the system of record for the event log. Stream processing (Apache Flink, Kafka Streams) replaces batch jobs. Multiple downstream consumers read the same topic independently (fan-out (sending one event to many downstream targets) pattern). Kafka Connect integrates with data warehouse for analytics. |

---

### 2.8 Networking Primer

Cloud providers (AWS, Azure, GCP) provide Wide Area Networks spanning geographies. Services communicate using HTTP/HTTPS, gRPC (a binary RPC framework for fast service-to-service calls), or WebSocket protocols.
For a full treatment of DNS, TLS (the encryption layer that protects data while it travels over the network), load balancing, CDN, reverse proxies, API gateways, and common tooling, see Chapter 3.

**Key latency reference numbers:**

| Operation | Latency |
|---|---|
| L1 cache reference | 0.5 ns |
| L2 cache reference | 7 ns |
| Main memory access | 100 ns |
| SSD random read | 100 µs |
| Hard disk seek | 10 ms |
| Round trip within same datacenter | 500 µs |
| Round trip same region, different AZ | ~1–2 ms |
| Round trip cross-region (US–Europe) | ~80–100 ms |
| Round trip cross-region (US–Asia) | ~150–200 ms |
| Max memory per commodity server | ~256–512 GB |

**Why these numbers matter:** A system design choice that adds one synchronous cross-region hop adds ~100ms of latency to every user request. At 10 hops, that is 1 second added — unacceptable for a search engine or checkout flow.

Use Chapter 3 for the detailed networking stack. This section is only the latency and topology primer for the rest of the document.

### 2.9 Interview Trade-Off Questions

1. When is a monolith the better engineering choice than microservices, even for a fast-growing product?
2. If a system is slow, how do you decide whether to add caching, split services, or redesign the database access pattern first?
3. When should you choose SQL over NoSQL for a new service, and what future scaling cost are you accepting?

---
## 4: Microservice Architecture

### What Is a Microservice?

Imagine a restaurant. A monolith is one person who takes orders, cooks, plates, and handles payment — fast to start, hard to scale when busy. A microservice architecture is a kitchen divided into stations: host, chef, pastry, cashier. Each station can be staffed independently, upgraded, and swapped without shutting down the others.

A **microservice** is a small, independently deployable unit of software that owns one focused business capability and its own data. Services communicate over a network — typically HTTP/REST, gRPC, or an event bus like Kafka.

This is different from how most applications start. Understanding the spectrum of architectures helps you decide *when* to use microservices — and when not to.

### The Architecture Spectrum: Monolith → SOA → Microservices

| Architecture | What it is | Deploy unit | Scaling | DB ownership | Best for |
|---|---|---|---|---|---|
| **Monolith** | One codebase, one deployable | Entire app | Vertical (bigger servers) | One shared DB | Teams < 10, early-stage products |
| **Modular Monolith** | One codebase, strictly separated internal modules | Entire app | Vertical | One shared DB (with schema namespacing) | Growing teams that want boundaries without ops overhead |
| **SOA** | Coarse-grained services sharing an Enterprise Service Bus (ESB) | Per service | Per service | Shared or per service | Legacy enterprise integration |
| **Microservices** | Fine-grained, single-responsibility services, each owning its data | Per service, independent | Per service, horizontal | One DB per service | Large orgs, 20+ engineers, high scale |

**Real-world journey:** Amazon started as a Perl monolith in 1994. By 2002, Jeff Bezos issued a mandate: all internal teams must expose functionality through service interfaces. Today, a single Amazon product page makes 100+ service calls — pricing, reviews, inventory, recommendations, advertising — all independently deployed and scaled.

**The key insight:** Microservices are not a goal. They are a solution to specific scaling and team coordination problems. A small startup should almost always start with a monolith and extract services when the pain of coupling becomes real.

### When to Split: Choosing the Right Architecture

The inflection point is almost always about *people* before it is about *technology*.

Split a service when:
- Two teams are constantly blocked waiting on each other to deploy.
- One component needs to scale at 100× the rate of everything else (e.g., search vs. billing).
- A piece has a clearly distinct change cadence and data model.
- An SLA boundary requires separate failure isolation (e.g., payments must stay up even if recommendations crash).

Do **not** split when:
- Two pieces of logic always need to commit atomically — splitting them creates a distributed transaction problem.
- The "service" would be so small it spends more time on network overhead than actual work (nanoservice anti-pattern).
- The team is fewer than 8–10 engineers — operational overhead will outweigh independence gains.

**Cost reality check:** A comparable monolith might cost $500/month to run. The microservices equivalent starts at $2,000–$5,000/month due to per-service databases, CI/CD pipelines, and observability tooling. The crossover where efficiency gains justify costs typically happens around 20–30 engineers or 5M+ users.

---

### Drawing Good Service Boundaries

The hardest part of microservices is not containers or Kubernetes. It is finding boundaries that remain stable as the product grows.

Good boundaries align on five signals:

1. **Business capability** — one service owns one coherent domain: identity, catalog, checkout, search. Not a technical layer like "API layer" or "data layer".
2. **Data ownership** — the service is the single source of truth for its state. No other service writes directly to its database.
3. **Change cadence** — the team can evolve code and schema without coordinating with other teams week to week.
4. **Scaling profile** — components with drastically different traffic patterns deserve separate scaling boundaries.
5. **Transaction boundary** — if two operations must always succeed or fail together, keep them in the same service.

**Warning signs of bad boundaries:**
- Every page render fans out through 6+ services in series → split is too chatty.
- Every feature requires schema changes across 4 databases → boundaries are not independent.
- One "user service" owns identity, profiles, privacy, social graph, and billing → boundary is too broad.

**Real-world example:** Uber's early architecture had a monolithic "uber-api" service. As it grew, they split into ~2,200 microservices. But they over-split: teams couldn't understand the system, and cascading failures became common. By 2020 they began consolidating into "domain-oriented microservices" — fewer, larger services organized around business domains.

---

### Five Principles That Make Microservices Work

Microservices are not just an architectural pattern — they require a set of engineering practices to be operationally sustainable. These five principles work together: skip one, and the others degrade.

#### Principle 1: Domain-Driven Design — Boundaries That Match Business Reality

Domain-Driven Design (DDD) is the practice of structuring software around the business domains it serves, so that service boundaries align with how teams actually think and work.

The central concept is a **bounded context** — a clearly delimited part of the system with its own vocabulary, data model, and team ownership. The same word can mean different things in different contexts:
- In the **Sales context**, a `Customer` is a prospect with a pipeline stage and a deal value.
- In the **Support context**, a `Customer` is a user with open tickets and an SLA tier.

These two services should model `Customer` independently. They share only what is necessary through a defined API contract — not a shared database table.

**Credit card processing example:** A payment platform has three clearly distinct bounded contexts:
- **Payment Subdomain** — online transaction processing (authorize, capture, void).
- **Merchant Subdomain** — merchant onboarding, acceptance workflow, risk scoring.
- **Accounting Subdomain** — end-of-day clearing, reconciliation, settlement.

These have different data models, different regulatory requirements, and different change rates. Merging them into one service couples unrelated concerns.

**Real-world example:** Stripe's public API is domain-driven — `/charges`, `/subscriptions`, `/customers`, `/invoices` each correspond to an internal bounded context with its own team, data store, and deployment pipeline. The fact that these surface as clean API endpoints is a side effect of good domain boundaries internally.

**Conway's Law:** "Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations." If your payments team and your fraud team are separate, your architecture will naturally evolve to reflect that. DDD makes this intentional rather than accidental.

**Pitfalls:**
- **Too-early splitting** — Merging `Order` and `Inventory` contexts and then splitting them after 18 months of data coupling is expensive. Start with a modular monolith if the boundaries are unclear, and extract services once the boundaries are proven stable in production.
- **Boundaries drawn by technical layer** (e.g., "frontend service", "backend service") rather than business capability — leads to services that always deploy together, defeating independence.

Bounded contexts evolve. A single `Orders` service often splits into `OrderCreation`, `OrderFulfillment`, and `OrderReturns` as teams discover distinct ownership and change rates. Run **event storming workshops** — bring product, engineering, and business onto a whiteboard to map domain events, commands, and aggregates. This surfaces boundaries before they become expensive to change.

#### Principle 2: Automate Everything — From Code to Production

A monolith with 10 engineers has one deployment pipeline. A microservices system with 50 services needs 50. Manual processes do not scale here — automation is not optional.

**Three automation layers:**
- **Infrastructure as Code (IaC)** — Terraform, Pulumi, AWS CDK. Infrastructure is version-controlled. Spinning up a staging environment is `terraform apply`, not two weeks of ticketing. Eliminates "works in staging, broken in production" drift.
- **Continuous Integration (CI)** — Tests run on every pull request. A broken build in the Payments service does not block the Reviews team.
- **Continuous Delivery (CD)** — Spinnaker, Harness, GitLab CI/CD. Each service deploys independently. Canary deployments (route 5% of traffic to the new version, check error rates, then ramp to 100%) catch regressions before they hit all users.

**Real-world example:** Netflix deploys hundreds of times per day across thousands of microservices. A single engineer can safely push a change to a service serving 250M users. Their Spinnaker pipeline runs automated smoke tests, checks error rates and latency against baselines, and rolls back automatically if thresholds are breached — all without a human in the loop.

**Common failures and mitigations:**

| Failure | Impact | Mitigation |
|---|---|---|
| Slow CI pipeline (>15 min) | Engineers skip running tests locally; PRs pile up | Parallelize test stages; cache dependencies; target <10 min end-to-end |
| Flaky tests | False alarms erode trust in the pipeline | Track flaky test count as a team metric; fix or quarantine within 48h |
| Terraform state corruption | IaC cannot reconcile with real infrastructure | Remote state with locking (S3 + DynamoDB); never edit state files manually |
| CD deploys bad code to 100% | Full production regression | Canary with automated rollback on P99 latency or error rate breach |

**Maturity progression:**

| Stage | Capability |
|---|---|
| Year 1 | CI on every PR (tests, lint, build). Manual CD via Slack bot or button click. |
| Year 2 | Automated canary deployments (5% → 25% → 100%). Automated rollback. IaC for all infrastructure. DORA metrics tracked. |
| Year 3 | Self-service developer platform — engineer pushes code, automation handles test, build, deploy, monitor, rollback. Progressive delivery with feature flags (LaunchDarkly). |

#### Principle 3: Encapsulation — Hide Internals, Expose Contracts

Each service is a black box. It exposes behavior through a versioned API and hides everything else: its database schema, business logic, caching layer, and internal data models.

**The shared database anti-pattern:** When two services share a database table, any schema change — renaming a column, adding a NOT NULL constraint, changing a data type — requires coordinating deployments across both services simultaneously. You lose independent deployability entirely. This is the most common way microservices teams accidentally rebuild a distributed monolith.

**Good design in practice:**
- The Orders service owns the `orders` database. Inventory reads order state only through `GET /orders/{id}`, never by joining directly.
- The Support API returns `{ user_id, ticket_count, sla_tier }` — not the full internal user record with fields that belong to Sales or Finance.
- API response schemas explicitly allowlist fields. Internal database models are never passed directly to serializers.

**Real-world example:** Shopify's merchant API has exposed `/orders` since 2007. In that time, Shopify has moved the underlying storage from MySQL shards to a Vitess cluster, added Kafka for event streaming, and introduced a data warehouse layer — none of which broke the thousands of apps built on the API. The contract was stable even as the internals changed completely.

#### API Contracts and Schema Evolution

Schema changes are the most common source of silent production breakage in microservice systems. The rules are simple:

1. **Additive changes are safe.** Adding a new optional field to a JSON response or Protobuf message does not break existing consumers that ignore unknown fields.
2. **Removing or renaming fields is breaking.** A consumer relying on `user.email_address` breaks silently if it becomes `user.email`. Deprecate with a 30–90 day grace window before removal.
3. **Type changes are breaking.** Changing `int` to `string`, or adding null-ability, breaks deserialization for all consumers. Always introduce a new API version.

**Safe migration: the expand-contract pattern**
1. **Expand:** Add the new field alongside the old one. Both exist in the response simultaneously.
2. **Migrate:** Update all consumers to read from the new field. Verify in production.
3. **Contract:** Remove the old field once every consumer has deployed.

For event schemas on Kafka or other message buses, use a **Schema Registry** (Confluent Schema Registry, AWS Glue) that enforces compatibility rules — `BACKWARD`, `FORWARD`, or `FULL` — before a producer can publish a new schema version. This acts as a gate: a bad schema change is rejected at publish time, before it can reach any consumer.

**Tooling:**
- **OpenAPI / Swagger** — document and machine-validate REST API request/response schemas.
- **Pact (consumer-driven contract tests)** — consumers publish what they expect; the provider's CI pipeline runs these contracts before every deploy. A provider can never ship a breaking change without first knowing which consumers it would break.

#### Principle 4: Decentralization — Team Autonomy with Shared Rails

In a microservices organization, no single central team should be a bottleneck for all infrastructure changes or technology decisions. Autonomy is what makes independent deployability real in practice.

**Two levels of decentralization:**
- **Self-service infrastructure** — teams provision resources via cloud consoles and IaC without waiting for central IT approvals. A team needing a new database or message queue creates it in minutes from a Terraform module, not days through a ticketing system.
- **Polyglot technology choices** — teams pick the right tool for the job. The recommendations team uses Python and a graph database. The payments team uses Java and PostgreSQL. Cross-cutting standards (API design, security policies, observability) are enforced through shared libraries and automated checks, not mandates.

**Real-world example:** Spotify's squad model — each squad owns its domain end-to-end (backend, frontend, data). Guilds (cross-squad communities of practice) share standards organically without top-down enforcement. A chapter lead for backend engineering sets norms through example, not approval gates.

**The balance to maintain:**
- **Technology fragmentation risk** — without any governance, teams end up with 15 different messaging systems and no ability to share data across them. Solution: a technology radar (Thoughtworks-style) with four rings: Adopt, Trial, Assess, Hold. Teams can use "Trial" technologies; "Hold" technologies require an exception process.
- **Security inconsistency** — teams implement auth differently, some incorrectly. Solution: shared auth middleware or a sidecar proxy (mTLS via Istio service mesh) so no team implements authentication from scratch.

#### Principle 5: Smart Endpoints, Dumb Pipes — Keep Logic in Services

Business logic belongs inside services, not in the communication infrastructure between them.

**The SOA mistake (ESB anti-pattern):** Enterprise Service Bus architectures put routing logic, data transformation, validation, and business rules inside the bus. A small business rule change requires touching the ESB — owned by a central integration team with a 6-week change window. Every service becomes coupled to this shared infrastructure layer.

**The microservices model:** Kafka or an HTTP gateway is a dumb pipe. It moves bytes from A to B without understanding them. The consuming service applies all logic. This means:
- Changing how the Billing service processes a `VIDEO_PLAYBACK_STARTED` event requires only deploying the Billing service — not touching Kafka, not notifying the Analytics team.
- Adding a new consumer (e.g., a Fraud Detection service) requires only subscribing to the existing topic — no changes to producers or infrastructure.

**Real-world example:** Netflix emits `VIDEO_PLAYBACK_STARTED` to a Kafka topic. At least four services consume it independently: Analytics (for viewing statistics), Recommendations (to update the user model), Billing (for pay-per-view accounting), and Personalization (to update "continue watching"). None of this logic lives in Kafka — it lives in each service, independently maintained and deployed.

**Watch out for logic duplication:** If multiple services implement the same transformation independently, they drift over time. Use a shared library for truly cross-cutting logic (e.g., a shared auth token validation library). But apply sparingly — shared libraries create compile-time coupling between teams.

---

### Cross-Cutting Concerns: What Every Microservice Needs

Once you have more than a handful of services, certain infrastructure problems appear universally. These are not domain concerns — they are the "rails" that keep the system operable.

#### Service Discovery and the API Gateway

With dozens of services, clients cannot hardcode IP addresses. Two patterns handle this:
- **Service registry** (Consul, Eureka, Kubernetes DNS) — services register on startup; clients look up addresses at runtime.
- **API Gateway** (Kong, AWS API Gateway, Nginx) — a single entry point for external traffic. The gateway handles routing, authentication, rate limiting, and SSL termination, so each service does not need to implement these itself.

**Example:** A mobile app calls `api.example.com/checkout`. The API gateway authenticates the request, rate-limits it, routes it to the Checkout service, and strips the internal JWT before forwarding — the Checkout service receives a clean, pre-authenticated request.

#### Observability: Distributed Tracing, Metrics, and Logs

In a monolith, a slow request shows up in one log file. In microservices, a single user request fans out across 5–10 services — and any one of them could be the bottleneck.

Three pillars of observability:
- **Distributed tracing** (Jaeger, Zipkin, AWS X-Ray) — a trace ID propagates through every service call in a request. When a user reports "checkout is broken," you pull the trace and see the exact call graph with per-service latency.
- **Metrics** (Prometheus + Grafana) — per-service error rate, latency (P50/P95/P99), and throughput. Alert when a service's P99 latency exceeds its SLO.
- **Centralized logging** (ELK stack, Datadog) — all service logs ship to one place, tagged with trace IDs so you can pivot from a trace to the raw logs for that request.

**SLOs and ownership:** Every service should have a named owner, a defined SLO (e.g., 99.9% availability, P99 latency < 200ms), and an on-call rotation. Without these, incidents become a blame game instead of a structured response.

#### Inter-Service Communication: Sync vs. Async

Services communicate in two fundamentally different ways, each with different failure modes:

| Pattern | Technology | When to use | Risk |
|---|---|---|---|
| **Synchronous (request-reply)** | HTTP/REST, gRPC | Caller needs an immediate response (e.g., price lookup for checkout) | Cascading failures: if Inventory is slow, Checkout slows too |
| **Asynchronous (event-driven)** | Kafka, SQS, RabbitMQ | Caller does not need an immediate response (e.g., send confirmation email after order placed) | Eventual consistency: downstream services may be temporarily behind |

**Circuit breaker pattern:** For synchronous calls, wrap downstream calls in a circuit breaker (Resilience4j, Hystrix). If the Inventory service starts failing, the circuit "opens" and Checkout immediately returns a fallback response (e.g., assume in stock) rather than waiting for timeouts. This prevents one slow service from cascading into a full system outage.

#### Distributed Transactions: The Saga Pattern

In a monolith, placing an order is a single database transaction: deduct inventory, charge the card, create the order — atomic, all-or-nothing. In microservices, these three operations span three separate services with three separate databases. There is no global transaction coordinator.

The **Saga pattern** solves this by replacing one atomic transaction with a sequence of local transactions, each publishing an event or calling the next service. If any step fails, the saga executes **compensating transactions** to undo the completed steps.

**Order placement saga example:**
1. Order Service creates order (status: `PENDING`) → emits `ORDER_CREATED`.
2. Inventory Service reserves stock → emits `INVENTORY_RESERVED`. On failure: emits `INVENTORY_FAILED`.
3. Payment Service charges card → emits `PAYMENT_SUCCESS`. On failure: emits `PAYMENT_FAILED`.
4. Order Service updates status to `CONFIRMED`.

If Payment fails at step 3, the saga runs compensation: release the inventory reservation (step 2 reversal), then cancel the order (step 1 reversal). The system ends in a consistent state — no half-placed orders, no phantom reservations.

**Two coordination styles:**
- **Choreography** — services react to each other's events directly, with no central coordinator. Simple to implement; harder to visualize the full flow as it grows.
- **Orchestration** — a dedicated Saga Orchestrator service drives the workflow, calling each service in sequence and handling failures centrally. Easier to reason about for complex multi-step flows.

**Real-world example:** Uber's trip completion flow — end trip, calculate fare, charge payment method, pay driver — spans multiple services. If the payment charge fails, Uber does not show the driver as "paid." The saga compensates and queues a retry rather than leaving the system in an inconsistent state.

---

### Service Mesh: Infrastructure for Service-to-Service Traffic

As the number of services grows past ~20, common infrastructure concerns — mutual TLS, retries, circuit breaking, load balancing — become repetitive to implement per service. A **service mesh** (Istio, Linkerd) moves these concerns into a sidecar proxy injected alongside each service container.

Every service gets a sidecar (e.g., Envoy proxy). All service-to-service traffic passes through the sidecar pair. The control plane (Istio's Pilot) pushes configuration: "retry up to 3 times with exponential backoff," "reject traffic from services without a valid certificate," "route 10% of traffic to the canary version."

**What the mesh handles:**
- Mutual TLS (mTLS) — all service-to-service traffic is encrypted and authenticated automatically, without any application code changes.
- Retries and timeouts — configured centrally, not duplicated in each service.
- Traffic splitting — route 5% of traffic to a new version for canary testing.
- Observability — the mesh emits per-call latency, error rate, and request volume metrics for every service pair automatically.

**When to adopt:** A service mesh adds operational complexity. Adopt it at Year 2+ maturity, when you have 20+ services, a dedicated platform team, and specific needs for mTLS or advanced traffic management.

---

### Architecture Maturity: A Three-Year Progression

| Year | Team Size | Architecture State | Key Investments |
|---|---|---|---|
| Year 1 | 5–15 engineers | Modular monolith or 5–10 services. Shared Kubernetes cluster. Manual deployments via Slack bot. | Good domain boundaries in code. Basic CI. On-call rotation. Centralized logging. |
| Year 2 | 15–50 engineers | 15–40 services. Automated canary deployments. Service registry. Contract tests in CI. | Distributed tracing. Service mesh (mTLS, retries). SLOs per service. Backstage service catalog. IaC for all infrastructure. |
| Year 3 | 50+ engineers | 50+ services. Internal developer platform ("golden path"). Event-driven architecture for high-throughput flows. | Self-service provisioning. Chaos engineering (Netflix Chaos Monkey, AWS FIS). DORA metrics as team health KPIs. Feature flag system (LaunchDarkly) for progressive delivery. |

---

### Common Pitfalls and How to Avoid Them

| Pitfall | What happens | How to avoid |
|---|---|---|
| **Distributed monolith** | Services are split but still share a database or require synchronized deployments. You get all the operational overhead with none of the independence. | Enforce one-database-per-service. If two services always deploy together, they should be one service. |
| **Service proliferation** | 100+ services without a catalog. Engineers can't find where logic lives. "Nanoservices" waste more time on networking than computation. | Maintain a service catalog (Backstage). Every service must have a named owner, README, and SLO. Merge services that do not justify their operational cost. |
| **Latency amplification** | A user request chains through 7 services in series. Each adds 20ms. Total: 140ms minimum even if all services are fast. | Parallelize independent downstream calls. Set strict per-call timeouts. Measure P99 end-to-end latency on the critical path. |
| **Chatty services** | Service A calls Service B 50 times per request (e.g., fetching each product's price individually instead of in a batch). | Batch APIs (fetch 50 prices in one call). Use an aggregation layer or BFF (Backend for Frontend) for read-heavy flows. |
| **No ownership clarity** | An incident hits and nobody knows which team owns the failing service. | Publish a service ownership matrix. Every service maps to one team, one SLO, and one on-call rotation. |

---

### Interview Trade-Off Questions

1. How small is too small for a microservice? What metrics or signals indicate a boundary is over-split?
2. When would you use choreography vs. orchestration for a saga? What are the debugging tradeoffs of each?
3. When is a shared library the right answer vs. a separate service for cross-cutting logic?
4. How much team autonomy should you allow before platform inconsistency starts hurting reliability and security?
5. You're a 10-person startup being asked to build in microservices from day one. How do you respond?

---

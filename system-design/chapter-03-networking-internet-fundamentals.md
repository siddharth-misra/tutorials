## 3: Networking & Internet Fundamentals

### 3.1 The Mental Model: One Request, Five Stages

When a user taps "Place Order," the phone does not talk to business logic directly. Before a single line of your application code runs, the request passes through name resolution, connection setup, edge infrastructure, and a routing layer. Understanding that path is the foundation of all networking reasoning.

The five-stage mental model to internalize:

```
Client → DNS (name resolution)
       → TCP/TLS (connection setup)
       → Edge (CDN / WAF / API gateway)
       → Routing (load balancer / reverse proxy)
       → App + Data (service, cache, DB, queues)
```

Every performance, reliability, and security question in this chapter maps to one or more of these five stages.

**Real-world example:** When a user opens `app.example.com`, DNS resolves the hostname to an edge IP. A CDN may terminate TLS and serve cached assets. An API gateway applies authentication and rate limits. A load balancer forwards the request to a healthy app instance. Static files (images, JS, CSS) never reach the app server; dynamic paths like `/checkout` continue through to origin services and databases.

---

### 3.2 Stage 1 — Name Resolution (DNS)

DNS (Domain Name System) translates a human-readable hostname into an IP address. It is the first thing that happens on every request, and it is where many outages begin.

**How it works:**
1. Client checks its local DNS cache.
2. If not cached, the OS asks a recursive resolver (usually provided by the ISP or a managed service like Route 53).
3. The resolver walks the DNS hierarchy — root → TLD → authoritative nameserver — and returns the IP.
4. The answer is cached for the TTL (Time To Live) duration.

**TTL is a trade-off:**
- Low TTL (30–60 s): faster failover and traffic shifting, but more resolver queries and slightly higher latency on cold paths.
- High TTL (5–30 min): better cache hit rate and fewer queries, but stale records can delay failover.

**Common failures:**
- DNS record drift after an IP change, leaving old records pointing at decommissioned hosts.
- Stale resolver caches during failover, causing traffic to hit dead targets long after a switch.
- Misconfigured NS or CNAME chains that break resolution entirely.

**Mitigations:** Managed DNS (Route 53, Cloudflare), staged record rollouts, automated health-check-based failover, and explicit TTL choices documented alongside every DNS change.

---

### 3.3 Stage 2 — Connection Setup (TCP, TLS, HTTP Versions)

Once DNS returns an IP, the client establishes a transport connection and negotiates encryption before any application data moves.

#### TCP and the Three-Way Handshake

TCP (Transmission Control Protocol) is a reliable, ordered, connection-oriented protocol. Before data flows, three packets must be exchanged:

```
Client → SYN    → Server
Client ← SYN-ACK ← Server
Client → ACK    → Server
```

This adds at least one round-trip time (RTT) before the first byte is sent.

#### TLS Handshake

TLS (Transport Layer Security) runs on top of TCP and adds authentication and encryption. TLS 1.3 (current standard) requires one additional RTT after the TCP handshake. TLS 1.2 required two.

A **TLS session ticket** lets a client skip the full handshake on reconnection (0-RTT or 1-RTT resumption), which is why warm connections are dramatically cheaper than cold ones.

#### HTTP Versions and Their Impact on Connection Cost

| Version | Transport | Key behavior | When to prefer |
|---|---|---|---|
| HTTP/1.1 | TCP | One request per connection unless pipelined; keep-alive reuses the TCP connection | Legacy or very simple deployments |
| HTTP/2 | TCP | Multiplexes many requests over one connection; header compression | Most modern web traffic |
| HTTP/3 / QUIC | UDP | Multiplexes streams; better head-of-line blocking; faster handshake and loss recovery | Mobile clients, lossy networks |

**Practical rule:** HTTP/2 with connection pooling eliminates most of the per-request TCP + TLS overhead on warm paths. HTTP/3 helps most for mobile users on unreliable networks.

**Common failures:**
- No keep-alive → every request pays a full TCP + TLS handshake cost.
- Expired TLS certificate → HTTPS fails entirely for all users hitting that endpoint.
- Too many new connections per second → TLS CPU spikes on the server side.

---

### 3.4 Stage 3 — Edge Infrastructure (CDN, WAF, DDoS Protection)

Edge infrastructure sits geographically close to users. Its job is to absorb as much traffic as possible before it ever touches your origin servers.

#### CDN (Content Delivery Network)

A CDN caches responses at dozens or hundreds of Points of Presence (PoPs) worldwide. When a user in Tokyo requests a file, they get it from a Tokyo PoP rather than your US-East origin — reducing latency from ~150 ms to ~5 ms.

**What CDNs are good at:**
- Static assets: images, JS, CSS, fonts, videos.
- Publicly cacheable API responses (product listings, config).
- Origin shielding: a single PoP forwards cache misses to origin, preventing thundering-herd misses.

**What CDNs are bad at:** Per-user or session-specific data. Never cache responses that include user-specific content unless you're using very deliberate cache-key variations.

**Cache key mistakes** are a common source of incidents:
- Forgetting to vary by `Accept-Encoding` → some users get garbled compressed content.
- Caching a response that contains a session token → user A sees user B's data.

#### WAF and DDoS Protection

A WAF (Web Application Firewall) inspects request content for attack signatures — SQL injection, XSS, path traversal. A DDoS (Distributed Denial of Service) protection layer absorbs volumetric attacks (floods of traffic) before they reach origin.

These layers belong at the edge. If they sit inside your network, attack traffic still crosses the internet to reach you.

---

### 3.5 Stage 4 — Routing Layer (API Gateway, Load Balancer, Reverse Proxy)

These three components are frequently confused because they all sit between the internet and your application. The distinction is **what decision each one makes**.

#### API Gateway

An API gateway is the policy enforcement point for your API surface.

**Owns:** AuthN/AuthZ, rate limiting, request normalization, routing by path or header, observability (request logging, tracing), quota enforcement.

**Does not own:** Business logic, pricing, inventory, or any domain-specific behavior. Every time you put a business rule in the gateway, a product change requires an infrastructure deployment.

#### Load Balancer

A load balancer distributes traffic across multiple healthy instances of a service.

**Layer 4 (L4) load balancing** operates at the TCP/UDP level: it routes connections based on IP and port without inspecting HTTP content. Very fast, no HTTP awareness.

**Layer 7 (L7) load balancing** inspects HTTP headers, paths, and cookies. Enables content-based routing, sticky sessions, and health checks against real endpoints.

**Health checks** are what make load balancers valuable during incidents. A load balancer that drains an unhealthy instance before users notice is doing its job. A load balancer with a poorly configured health endpoint (one that always returns 200 regardless of actual health) is a liability.

**Load balancing algorithms:**
- Round-robin: simple, works well when instances are uniform.
- Least-connections: routes to the instance with the fewest active connections — better for long-lived requests.
- Consistent hashing: routes requests for the same key to the same instance — useful for cache locality.

#### Reverse Proxy

A reverse proxy manages HTTP connection behavior between clients and backends.

**Owns:** TLS termination, connection pooling to upstreams, buffering, compression, header rewriting, connection timeout management.

A reverse proxy is infrastructure, not application code. The moment it starts making routing decisions based on business state, it becomes a hidden application layer — which creates operational problems because changes require infrastructure deployments and ownership is unclear.

#### Responsibility Boundary Summary

| Component | Primary job | Good responsibilities | Avoid |
|---|---|---|---|
| CDN | Serve cacheable content close to users | Static asset delivery, origin shielding | Per-user business logic |
| WAF / DDoS | Protect origin from hostile traffic | Signature rules, IP reputation, bot filtering | Application-specific authorization |
| API gateway | Enforce policy at API entry | AuthN/AuthZ, rate limits, routing, observability | Domain logic (pricing, inventory) |
| Reverse proxy | Manage HTTP connection behavior | TLS termination, compression, header rewriting | Becoming a hidden application layer |
| Load balancer | Spread traffic across healthy targets | Health checks, upstream selection, failover | Deep request interpretation |

---

### 3.6 Stage 5 — Application and Data Path

Once the request reaches a healthy app instance, the service executes:

1. **Authentication check** — validate the token or session.
2. **Cache lookups** — check Redis or Memcached before hitting the DB.
3. **DB queries** — reads and writes to the primary datastore.
4. **Downstream service calls** — RPC or HTTP calls to dependent services.
5. **Response shaping** — serialize, compress, set `Cache-Control` headers.

The most expensive mistakes here are architectural, not code-level:

- **Fan-out without batching:** calling five downstream services sequentially adds their latencies in series. If you can call them in parallel, you pay only the slowest one.
- **N+1 queries:** fetching a list then querying per item in a loop. One query with a join or batch fetch is almost always faster.
- **Missing or wrong cache headers:** every response that should be cacheable but isn't adds origin load and user latency.

---

### 3.7 Latency — Budgeting and Reasoning

Latency is additive. Understanding where time goes is more useful than saying "it's slow."

#### Typical Latency Numbers (Warm Path)

| Hop | Typical latency | Why it exists |
|---|---|---|
| Client → edge (same region) | 5–30 ms | Physical distance and network quality |
| API gateway / reverse proxy | 1–10 ms | TLS termination, routing, policy checks |
| App service | 5–50 ms | Business logic, serialization, auth decisions |
| Local cache (Redis, Memcached) | 0.5–2 ms | Hot-read acceleration |
| Indexed DB query | 1–10 ms | Transactional storage |
| Cross-region synchronous call | 80–150+ ms | Geography, not code quality |

#### Latency Budget Example: Checkout

| Component | Latency |
|---|---|
| DNS + TLS (cold connection) | 15 ms |
| Gateway + proxy hops | 10 ms |
| Application logic | 35 ms |
| DB + cache operations | 40 ms |
| One downstream service call | 30 ms |
| **Total** | **~130 ms** |

**Key insight:** One synchronous cross-region call (80–150 ms) can blow the entire budget for a user-facing flow. Removing a hop is usually more valuable than micro-optimizing an existing query by a few milliseconds.

**Tail latency compounds.** If three independent services each have a p99 of 50 ms, a request requiring all three will see a p99 much higher than 50 ms — because it needs the worst outcome from each service simultaneously.

---

### 3.8 Protocol Selection

| Scenario | Default choice | Why | Main cost |
|---|---|---|---|
| Public web/mobile API | HTTPS + REST | Broad compatibility, simple tooling, easy debugging | Larger payloads, weaker contracts than gRPC |
| Internal low-latency service call | gRPC over HTTP/2 | Strong contracts, binary payloads, multiplexing | Browser compatibility, steeper tooling curve |
| Real-time bidirectional updates | WebSocket | Persistent connection, server push | Connection lifecycle and scaling complexity |
| Unreliable networks / connection churn | HTTP/3 / QUIC | Faster loss recovery, better handshake | Newer tooling, less operational maturity |
| Fire-and-forget or decoupled work | Message queue / event bus | Async buffering, independent scaling | Eventual consistency, replay complexity |

**The rule:** use synchronous protocols when the caller needs the answer immediately. Use asynchronous messaging when the caller only needs the work to happen eventually.

---

### 3.9 Retries, Timeouts, and Failure Handling

Retries are the most dangerous tool in distributed systems. Used correctly, they recover from transient failures. Used incorrectly, they turn a degraded system into a dead one.

#### Timeouts

Every network call must have a timeout. Without one, a slow downstream service can exhaust your thread pool or connection pool, taking your service down too.

Set timeouts at the call site, not just at the edge. A gateway timeout of 30 s is useless if the downstream service holds a DB connection for 60 s on every slow request.

#### Retry Policy

- **Where to retry:** pick one or two layers (typically the client and one gateway layer). Retries at every layer multiply traffic exponentially during an incident.
- **What to retry:** only idempotent or safe operations. Never blindly retry a POST that creates a record.
- **How to retry:** exponential backoff with jitter. Pure exponential backoff causes synchronized retry bursts ("thundering herd"); jitter spreads them out.
- **Retry budget:** limit the fraction of requests that can be retried per time window. If 30% of your traffic is retries, stop and investigate rather than retry more.

#### Circuit Breaker

A circuit breaker tracks the error rate to a downstream service. When errors exceed a threshold, it "opens" — rejecting calls immediately rather than waiting for timeouts. This protects both the caller (fast failure) and the downstream (reduced load during degradation).

States: **Closed** (normal, calls pass through) → **Open** (errors exceeded threshold, calls fail fast) → **Half-open** (probe traffic to test recovery).

---

### 3.10 Failure Modes and Mitigations

| Failure | Impact | Mitigation |
|---|---|---|
| DNS misconfiguration | Traffic blackholed or sent to wrong targets | Managed DNS, staged rollouts, TTL discipline |
| TLS certificate expiry | HTTPS fails at edge or origin | Automated renewal, expiry alerting |
| CDN cache-key mistake | Stale data served to wrong users, or origin overloaded | Cache-key audits, `Cache-Control` tests, purge tooling |
| Gateway policy mistake | Auth or routing outage for many endpoints | Config as code, canary rollout, fast rollback |
| Proxy or LB overload | 5xx, connection resets, rising tail latency | Autoscaling, connection limits, overload protection |
| Retry storm | Cascading failure amplifies already-degraded traffic | Retry budgets, exponential backoff, jitter, circuit breakers |
| WebSocket drops during deploys | Real-time feature instability, reconnect spikes | Graceful draining, jittered reconnect logic |
| Cross-region call on user path | Sudden 100–300 ms latency increase | Keep critical flows region-local; use async replication |

**The pattern to remember:** networking outages usually come from control-plane mistakes — bad DNS, expired certs, misconfigured gateways, or broken retry policies — not raw bandwidth problems.

---

### 3.11 Common Traffic Flows

These five patterns cover the vast majority of real-world networking problems:

- **Browser → web app:** `DNS → CDN → reverse proxy → app server → database`
- **Mobile app → backend API:** `DNS → API gateway → load balancer → service`
- **Internal service call:** `service mesh` or `direct gRPC → backend service`
- **Real-time feed:** `client opens WebSocket → server pushes events`
- **Large file upload:** `client → presigned URL → object storage directly` (never route large uploads through app servers)

The last pattern is the most commonly missed. Routing a 2 GB video upload through your application fleet is both expensive and fragile.

---

### 3.12 Design Decisions and Trade-Offs

#### Where to Terminate TLS
Edge termination simplifies origin services and is the default. Re-encryption from edge to origin adds CPU and latency but improves security posture inside the cluster. Required in high-compliance environments.

#### How Many Synchronous Dependencies Are On-Path
Every synchronous dependency adds latency and failure coupling. A checkout request that needs auth, feature flags, pricing, and recommendations before it can respond has become fragile. Move non-critical dependencies off the critical path (async or pre-fetched).

#### Cache Aggressiveness
Longer TTLs reduce origin cost but risk serving stale content. Dynamic APIs need deliberate cache keys, explicit `Cache-Control` headers, and a tested invalidation path. "No cache" is rarely the right answer — it usually means someone never thought about it.

#### Where Rate Limits Live
Coarse per-client limits belong at the edge or gateway. Fine-grained per-operation limits belong in the service that knows which operations are expensive. Doing fine-grained limiting at the gateway means the gateway must understand your domain, which is an ownership problem.

#### Cold Path vs. Warm Path
Warm connections and warm caches look excellent in benchmarks. Mobile clients, cold starts, blue-green deploys, and regional failovers all hit the cold path. Design and test for it explicitly.

---

### 3.13 Operations, Cost, and Evolution

#### Key Metrics to Track

- Gateway and LB: p95/p99 latency, 4xx/5xx rates, connection counts, unhealthy target count.
- CDN: cache hit ratio, origin shield effectiveness, egress spend.
- DNS: failover propagation time, resolver error rate.
- Certificates: days until expiry, renewal success/failure rate.

#### Cost Drivers

| Component | What drives cost |
|---|---|
| DNS | Query volume and failover frequency |
| CDN | Egress bandwidth and cache hit rate |
| Load balancer | Requests, open connections, cross-zone traffic |
| API gateway | Request volume, auth feature usage, logging |
| TLS | CPU overhead on handshakes, certificate automation |

The biggest hidden costs are: low CDN cache-hit rates (all traffic hits origin), cross-zone or cross-region traffic from poor instance placement, and retry-amplified duplicate traffic.

#### Evolutionary Path

| Stage | Typical setup |
|---|---|
| Early | Single-region: managed DNS, one LB/gateway path, basic CDN |
| Growing | WAF, mature gateway policies, gRPC for hot internal paths, explicit cache strategy |
| Scale | Multi-region routing, failover automation, service mesh for east-west traffic, edge compute for latency-sensitive features |

---

### 3.14 Mini Case Study: "Checkout Is Slow"

**Symptom:** p99 checkout latency doubled from 450 ms to 900 ms overnight.

**Investigation:**
1. CDN and edge metrics are stable — the slowdown is not a cache or internet problem.
2. Gateway p99 increased at the same time a new auth policy deployed.
3. The new policy does synchronous token introspection on every request; the downstream auth service now shows high tail latency and elevated retry counts.

**Fix:**
- Cache token introspection results at the gateway for 30–60 s (most tokens are valid for hours).
- Add a timeout and degrade gracefully for non-critical auth metadata fields.
- Reduce the number of synchronous calls the gateway makes per request.

**Lesson:** "The network is slow" is almost never about packets. It is almost always about dependency shape — too many synchronous calls on the critical path.

---

### 3.15 Interview Checklist and Trade-Off Questions

#### Before Finishing a Networking Answer, Cover:

1. The request path from client to data store (all five stages).
2. Latency budget with rough numbers per hop.
3. Where caching happens and how invalidation works.
4. Which layer owns auth, rate limits, routing, and retries.
5. The main failure modes and how the design degrades gracefully.
6. Metrics and ownership for each networking layer.

#### Trade-Off Questions

---

**1. When would you choose gRPC over REST for a service boundary, and what compatibility cost does that bring?**

Choose gRPC when two internal services are calling each other at high frequency and you control both ends. The benefits — binary Protobuf payloads (typically 3–10x smaller than JSON), HTTP/2 multiplexing, and strongly-typed generated clients — matter most for high-throughput or latency-sensitive internal paths.

The costs are real: browser clients cannot call gRPC directly without a transcoding proxy (grpc-gateway or Envoy); debugging is harder because payloads are binary, not human-readable; and onboarding new engineers takes longer because they must understand `.proto` files and the code-generation toolchain.

**Rule of thumb:** gRPC for internal service-to-service calls on hot paths. REST + JSON for anything a browser, mobile app, or external partner must call directly. The public API surface should remain REST unless you have a very specific reason otherwise.

---

**2. Global users have high latency — do you add a CDN, move compute closer, or remove synchronous hops? How do you decide?**

Diagnose before acting. The right fix depends on where time is actually being spent:

- If the slow path is **static assets or publicly cacheable responses** — add a CDN. A user in Singapore should not be fetching a JS bundle from US-East on every page load. A CDN fix is low-risk and often gives the biggest improvement for the least effort.
- If the slow path is **dynamic, user-specific, or write-heavy** (login, checkout, personalized feed) — a CDN helps little. The request must reach origin regardless of cache. Here you should look at whether the origin region is far from the user. If so, multi-region deployment or read replicas closer to the user is the answer.
- If the latency is high even for users near the origin — look at the number of synchronous hops. A checkout flow that calls auth → pricing → inventory → recommendations in series before responding will be slow no matter where the servers are. Removing or parallelizing those hops often saves more than any infrastructure change.

**Decision order:** CDN for cacheable content → remove or parallelize synchronous hops → move compute closer for unavoidably dynamic flows.

---

**3. Where should retries live — client, gateway, or service — and how do you prevent retry amplification during an incident?**

Retries can live at multiple layers, but each layer that retries multiplies traffic during an incident. If the client retries 3×, the gateway retries 3×, and the service retries 3×, a single failed request becomes up to 27 attempts against an already-struggling downstream.

**Recommended approach:**
- **Client:** retry for network errors and 5xx responses, with exponential backoff and jitter. This handles transient failures the user experiences directly.
- **Gateway:** optionally retry once for connection failures to upstream services, but only for idempotent operations. Never retry blindly.
- **Service:** retry downstream calls (e.g., a DB read) only at the point that understands idempotency. Do not add a retry layer at every service boundary.

**Preventing amplification:**
- Use a **retry budget**: cap the percentage of total requests that can be retries (e.g., no more than 10% of traffic). If retries exceed the budget, stop retrying and fail fast.
- **Jitter** (randomizing backoff timing) prevents synchronized retry bursts from all clients hitting a recovering service at the same moment.
- **Circuit breakers** cut off retries entirely when a downstream is clearly unhealthy, giving it time to recover rather than hammering it.

---

**4. Should a gateway fail open or fail closed when the auth service is unreachable? What does each choice cost you?**

This is a product and risk question, not purely a technical one. There is no universally correct answer.

**Fail closed** (reject all requests when auth is unreachable): maximizes security — no unauthenticated request ever reaches your services. The cost is availability: if the auth service goes down, your entire product goes down with it. This is the right default for anything involving money, private data, or regulatory compliance.

**Fail open** (allow requests through when auth is unreachable, possibly with reduced claims): maximizes availability — users keep working during an auth outage. The cost is security: some requests that should be rejected will be allowed through. This can be acceptable for low-risk, read-only, or public endpoints where the cost of a brief auth bypass is lower than the cost of a full outage.

**Practical middle ground:** fail closed by default, but design auth to be highly available (multiple instances, regional redundancy, short-lived cached tokens at the gateway). For specific low-risk endpoints (public content, health checks), explicitly mark them as auth-exempt rather than failing open globally.

---

**5. A new team wants to put feature-flag logic into the API gateway. What argument do you make for or against it?**

**Against (the usual right answer):** Feature flags are a product and application concern, not an infrastructure concern. Putting them in the gateway means:
- Every flag change requires an infrastructure deployment or a gateway config change, which typically has a slower, more guarded release process than an application deployment.
- The gateway team becomes a dependency for product engineers who want to ship quickly.
- Debugging becomes harder — production behavior is now split across gateway config and application code.
- It sets a precedent. Once one team adds feature-flag logic to the gateway, others follow, and the gateway gradually becomes a hidden application layer that nobody fully owns.

**When it might be acceptable:** Coarse traffic routing (send 10% of traffic to a new service version for a canary) is a legitimate gateway concern — that is routing policy, not application logic. The key distinction is whether the flag controls *which service handles the request* (gateway's domain) or *what the service does with it* (application's domain). If the team's feature flag is really just a canary routing rule, the gateway is the right place. If it changes application behavior based on user attributes, it belongs in the application.

---


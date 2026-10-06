## 19: URL Shortener and Pastebin

### The Core Problem

A URL shortener stores a mapping from a short code to a long destination URL:

- Create: `https://example.com/products/launch?campaign=spring-sale` -> `sho.rt/aZ81kQ`
- Read: `GET /aZ81kQ` -> redirect the browser to the original URL

Pastebin solves a closely related problem. Instead of mapping `code -> long URL`, it maps `code -> text content`. The short-code system, caching strategy, and metadata management are similar; the main difference is what happens on the read path:

- URL shortener: return an HTTP redirect
- Pastebin: return the stored content directly

These systems are interesting because the workloads are asymmetric:

- A link or paste is usually created once.
- It may be read millions of times.

That asymmetry pushes the design toward a very fast read path, aggressive caching, and asynchronous background processing for everything that is not strictly required to serve the user immediately.

---

### The Dictionary Analogy

Think of the system as a highly optimized dictionary:

- Input key: short code such as `aZ81kQ`
- Value: either a long URL or a text blob

For URL shortening, the critical operation is not creating the entry. It is resolving the key during every click. That means the most important design question is:

**How do we make `code -> target` lookup extremely fast and extremely reliable?**

Everything else, such as analytics, abuse detection, QR generation, and cleanup of expired records, should stay off the critical path whenever possible.

---

### Why URL Shortener and Pastebin Are Grouped Together

The two products share most of the same design building blocks:

- short unique identifiers
- metadata storage
- optional expiry
- ownership and deletion controls
- read-heavy traffic patterns
- abuse and rate-limiting concerns

They differ in one important way:

- URL shortener stores a small pointer and returns a redirect
- Pastebin may store a large payload and returns content directly

This difference changes the storage layer and caching policy, but not the overall architecture style.

---

### Functional Requirements

1. Create a short URL for a long destination URL.
2. Redirect `GET /{code}` to the original URL.
3. Support optional custom aliases such as `sho.rt/launch-day`.
4. Support optional TTL and expiry.
5. Allow owners to deactivate links before expiry.
6. Store and retrieve text pastes.
7. Support analytics for redirects.
8. Support branded custom domains such as `go.company.com/deal`.
9. Protect the system with rate limiting and abuse detection.
10. Optionally generate QR codes for links.

---

### Non-Functional Requirements

| Requirement | Target |
|---|---|
| Redirect latency (p99) | < 20 ms on cache hit |
| Link creation latency (p99) | < 200 ms |
| Availability | 99.99% |
| Durability | No confirmed link is lost |
| Read/write ratio | ~100:1 or higher |
| Analytics freshness | Eventually consistent |
| Code uniqueness | No active code collision |

---

### Capacity Estimation

Assume:

- 100 million new links per day
- 10 billion redirects per day
- 1 million new pastes per day
- average paste size of 50 KB

Derived estimates:

1. **Redirect traffic:**
   `10B / 86400 ~= 115K` redirects/sec average. Real systems must handle bursty traffic, so design for significantly higher peak.

2. **Link metadata storage:**
   If each link record averages ~100 bytes of compact metadata, `100M/day` is about `10 GB/day` before replication and indexes.

3. **Paste storage:**
   `1M * 50 KB = 50 GB/day`, which strongly suggests object storage rather than storing all content inline in a relational database.

4. **Analytics volume:**
   If each click event is ~200 bytes, then `115K events/sec` means roughly `23 MB/sec` of analytics ingestion on average.

5. **Code space:**
   Base62 with 7 characters gives `62^7 ~= 3.5 trillion` possible codes, which is enough for very large scale if code allocation is managed correctly.

The main lesson from capacity planning is simple:

- metadata can fit in a normal database or wide-column store
- click analytics becomes a streaming problem
- pastes require a cheap and durable blob store

---

### Core Data Model

The exact schema depends on the storage technology, but the logical entities are stable.

**User**

| Field | Type | Notes |
|---|---|---|
| `user_id` | `UUID` PK | |
| `email` | `VARCHAR(255)` UNIQUE | |
| `plan` | `VARCHAR(16)` | free / pro / enterprise |
| `created_at` | `TIMESTAMP` | |

**Link**

| Field | Type | Notes |
|---|---|---|
| `code` | `VARCHAR(8)` PK | short slug |
| `owner_id` | `UUID` FK -> User | nullable for anonymous links |
| `original_url` | `TEXT` | destination URL |
| `alias` | `VARCHAR(64)` UNIQUE | nullable custom slug |
| `custom_domain_id` | `UUID` FK -> CustomDomain | nullable |
| `redirect_type` | `SMALLINT` | 301 or 302 |
| `is_active` | `BOOLEAN` | soft delete / kill switch |
| `expires_at` | `TIMESTAMP` | nullable |
| `abuse_status` | `VARCHAR(16)` | clean / flagged / blocked |
| `created_at` | `TIMESTAMP` | |

**Paste**

| Field | Type | Notes |
|---|---|---|
| `code` | `VARCHAR(8)` PK | same code-space concept |
| `owner_id` | `UUID` FK -> User | nullable |
| `content_inline` | `TEXT` | for small pastes |
| `storage_key` | `TEXT` | object-store key for large pastes |
| `size_bytes` | `INT` | |
| `language` | `VARCHAR(32)` | optional syntax highlight hint |
| `expires_at` | `TIMESTAMP` | nullable |
| `created_at` | `TIMESTAMP` | |

**CustomDomain**

| Field | Type | Notes |
|---|---|---|
| `domain_id` | `UUID` PK | |
| `owner_id` | `UUID` FK -> User | |
| `domain` | `VARCHAR(253)` UNIQUE | e.g. `go.company.com` |
| `verified_at` | `TIMESTAMP` | set after DNS verification |
| `ssl_cert_ref` | `TEXT` | certificate reference |

**ClickEvent**

| Field | Type | Notes |
|---|---|---|
| `event_id` | `UUID` PK | idempotency key |
| `code` | `VARCHAR(8)` | link code |
| `occurred_at` | `TIMESTAMP` | |
| `country` | `CHAR(2)` | derived from IP |
| `referrer` | `TEXT` | |
| `device_type` | `VARCHAR(16)` | mobile / desktop / bot |
| `visitor_hash` | `CHAR(16)` | approximate unique visitor logic |

**LinkStats**

| Field | Type | Notes |
|---|---|---|
| `code` | `VARCHAR(8)` PK | |
| `total_clicks` | `BIGINT` | |
| `unique_visitors` | `BIGINT` | approximate is acceptable |
| `last_updated_at` | `TIMESTAMP` | |

---

### High-Level Architecture

```text
Client
  |
  v
CDN / Edge Cache
  |
  v
Load Balancer
  |
  +--> Creation Service ----> Code Generator ----> Metadata DB
  |
  +--> Redirect Service ----> Redis Cache -------> Metadata DB
  |                               |
  |                               +--> publish click event
  |
  +--> Paste Service -------> Metadata DB -------> Object Storage
  |
  +--> Analytics API -------> Stats Store
  |
  +--> QR Service -----------> cacheable image output

Click events
  |
  v
Kafka / Queue --> Analytics Consumers --> ClickEvent Store + LinkStats
```

This architecture separates the system by traffic shape:

- **Creation service** handles relatively low write volume.
- **Redirect service** handles very high read volume.
- **Paste service** handles mixed metadata lookups and blob retrieval.
- **Analytics pipeline** runs asynchronously so redirects remain fast.

This separation is important because one overloaded analytics consumer should never make redirects slow.

---

### API Design

#### Create Short Link

```http
POST /v1/links

{
  "url": "https://example.com/very/long/path?q=foo",
  "alias": "product-launch",
  "ttl_seconds": 2592000,
  "redirect_type": 302,
  "custom_domain_id": "dom_abc123"
}
```

```http
201 Created

{
  "code": "aZ81kQ",
  "short_url": "https://sho.rt/aZ81kQ",
  "expires_at": "2026-05-20T00:00:00Z",
  "qr_code_url": "https://api.sho.rt/v1/links/aZ81kQ/qr"
}
```

#### Redirect

```http
GET /aZ81kQ
-> 302 Location: https://example.com/very/long/path?q=foo
-> 301 Location: ...
-> 410 Gone
-> 451 Unavailable For Legal Reasons
```

#### Create Paste

```http
POST /v1/pastes

{
  "content": "package main\n\nfunc main() { ... }",
  "language": "go",
  "ttl_seconds": 86400
}
```

```http
201 Created

{
  "code": "xK9mPz",
  "url": "https://sho.rt/p/xK9mPz",
  "expires_at": "2026-04-21T00:00:00Z"
}
```

#### Fetch Analytics

```http
GET /v1/links/{code}/stats
```

---

### Request Flows

#### 1. Link Creation Flow

```text
1. Client sends long URL and optional metadata.
2. Creation service validates URL, alias, TTL, and rate limits.
3. Code generator creates or reserves a unique code.
4. Metadata is written durably to the primary store.
5. Cache may be warmed for hot links or left cold until first read.
6. Response returns the short URL.
```

Important design point: the system must confirm creation only after durable metadata write succeeds. Otherwise a client may receive a short URL that later disappears.

#### 2. Redirect Flow

```text
1. Browser requests GET /aZ81kQ.
2. CDN checks for cached redirect.
3. On cache miss, request reaches redirect service.
4. Redirect service checks Redis for code metadata.
5. On Redis miss, service reads metadata DB.
6. Service validates is_active, expires_at, and abuse_status.
7. Service returns 301 or 302 with Location header.
8. Service emits click event asynchronously.
```

This is the critical path. Only lookup, validation, and response generation belong here.

#### 3. Paste Read Flow

```text
1. Client requests GET /p/{code}.
2. Service resolves paste metadata from cache or DB.
3. If small, return inline content.
4. If large, fetch from object storage or stream it.
5. Respect expiry and access rules.
```

The paste path is still read-heavy, but unlike redirects it may involve larger payload delivery. That is why object storage and CDN caching matter more here.

---

### Code Generation Strategies

The short code generator must satisfy three properties:

1. uniqueness
2. short human-friendly format
3. resistance to cheap enumeration when possible

There are two practical strategies.

#### Strategy A: Counter + Permutation + Base62

```text
global unique integer -> reversible permutation -> Base62 encoding
```

Example:

```text
12345678 -> 93284751 -> 6Mfa9
```

Why this works well:

- globally unique IDs eliminate collisions
- Base62 keeps codes compact
- reversible permutation hides obvious sequential patterns

This is usually the best default for a general-purpose URL shortener because it is operationally simple and collision-free.

#### Strategy B: Random CSPRNG Code + Retry

```text
generate random 7-char Base62 code
if code already exists -> retry
```

Why teams choose it:

- harder to enumerate
- independent generation across nodes
- good for sensitive content

Trade-off:

- collisions are rare, but not impossible
- the system needs atomic insert-and-retry logic

#### Recommendation

- use **counter + permutation + Base62** for normal public links
- use **random codes** for security-sensitive or hard-to-enumerate shares
- treat **vanity aliases** as a separate reserved namespace

Avoid deterministic hashing of the original URL as the primary code strategy. It creates awkward duplicate-handling behavior and still does not eliminate collision management.

---

### Caching Strategy and Redirect Semantics

Caching is the most important performance lever in this system because the mapping from code to destination changes rarely after creation.

#### Cache Layers

- **CDN edge cache** reduces origin traffic for very hot links.
- **Redis** handles extremely fast metadata lookup for the redirect service.
- **Primary metadata store** is the fallback source of truth.

#### 301 vs 302

This choice affects both performance and observability.

- `301 Moved Permanently`
  - browsers and CDNs can cache aggressively
  - lowers origin load and latency
  - repeat clicks may never reach your service, so analytics become incomplete

- `302 Found`
  - redirects continue to hit your infrastructure
  - supports analytics, abuse checks, and dynamic policy changes
  - higher read load than 301

Practical default:

- use `302` by default when analytics or control matters
- use `301` only for truly stable permanent redirects where reduced observability is acceptable

This is one of the most common interview trade-offs in URL shortener design, and the key is to explain the business impact, not just the HTTP semantics.

---

### Storage Choices

Different data types in this system want different storage engines.

#### Metadata Store

Best fit:

- relational database for moderate scale and operational simplicity
- DynamoDB or Cassandra style key-value / wide-column store for very high-scale redirect lookup workloads

Why:

- redirect lookups are usually single-key reads
- the access pattern is simple and predictable
- durability and availability matter more than complex joins

#### Cache

Redis is a strong fit because:

- access is key-based
- latency is very low
- hot entries fit easily in memory

#### Paste Content

Object storage is the right choice for larger pastes because:

- it is cheap and durable
- it avoids bloating the metadata database
- it handles large payloads better than a transactional metadata store

Small pastes may still be stored inline for simplicity and faster reads.

---

### Analytics Design

Analytics should be asynchronous.

If analytics is written synchronously on the redirect path, then every click pays the cost of:

- event serialization
- network I/O
- potential storage or downstream service delay

That is the wrong place to spend latency budget.

A better design:

```text
Redirect Service -> emit click event -> queue / Kafka -> analytics consumers
```

The analytics pipeline can then compute:

- total clicks
- approximate unique visitors
- country distribution
- referrer breakdown
- device type distribution
- time-series aggregates

#### Unique Visitor Counting

Exact unique counting at large scale is expensive because it requires retaining many identifiers. In most analytics dashboards, approximate counting is acceptable.

Use HyperLogLog or a similar probabilistic structure when:

- low memory usage matters
- a small error margin is acceptable
- analytics is informational rather than billing-critical

#### Idempotency

Consumers must handle retries safely.

Typical pattern:

- generate `event_id` at redirect time
- use `INSERT ... ON CONFLICT DO NOTHING` semantics in the consumer
- make downstream counter updates idempotent where possible

This does not make the system magically perfect, but it makes retries safe and practical.

---

### Pastebin-Specific Considerations

Pastebin adds a few concerns that a pure URL shortener may not need to handle as strongly:

#### Content Size

- very small text can be stored inline
- larger content should live in object storage

#### Rendering

- raw text response is simplest
- optional syntax highlighting is a presentation-layer concern and should not complicate storage design

#### Privacy and Abuse

- some pastes may contain secrets, credentials, or malware payloads
- scanning and moderation are often more important than in a basic shortener

#### Expiry

Paste systems often rely more heavily on TTL, one-time sharing, and deletion semantics than consumer short links do.

---

### Custom Domains

Custom domains are a business feature, especially for enterprise customers.

Example:

- platform URL: `sho.rt/sale`
- branded URL: `go.company.com/sale`

Typical flow:

1. Customer creates a custom-domain record.
2. Customer proves ownership through DNS verification.
3. Customer points a CNAME or equivalent record to the platform.
4. Platform provisions or attaches TLS certificates.
5. Redirect service resolves links using both `Host` header and code.

Design implication: the lookup key becomes closer to `(domain, code)` rather than just `code`.

---

### Abuse Detection and Safety

A public URL shortener will be abused unless it has explicit protections.

Common threats:

- phishing destinations
- malware links
- spam campaigns
- brute-force creation attempts
- abusive or illegal paste content

Mitigations:

1. rate limit creation APIs
2. check destinations against blocklists at creation time
3. allow asynchronous rescans because a safe domain can become malicious later
4. support manual reporting and takedown
5. return `451` or a warning interstitial for blocked content where appropriate

This is not an optional add-on at scale. It is a core platform responsibility.

---

### Failure Modes and Mitigations

| Failure | Impact | Mitigation |
|---|---|---|
| Code collision | wrong mapping or failed creation | atomic insert and retry |
| Redis outage | redirect latency spike | fall back to DB at degraded performance |
| DB outage | link creation and cold reads fail | replication, failover, and aggressive cache survival |
| Expiry cleanup lag | expired records remain stored longer | enforce lazy expiry check on reads |
| Analytics lag | stale dashboards | acceptable eventual consistency |
| Abuse detection delay | harmful links remain active briefly | create-time scan plus fast asynchronous rescans |
| Viral traffic spike | overloaded redirect infrastructure | CDN, Redis, horizontal scaling, backpressure |
| Object-store issue | paste content unavailable | retry logic, replication, durable storage configuration |

---

### Key Trade-Offs

| Decision | Choice | Why |
|---|---|---|
| Code generation | counter + permutation by default | simple, scalable, collision-free |
| Sensitive sharing | random codes | harder to enumerate |
| Redirect type | 302 by default | better analytics and operational control |
| Analytics path | asynchronous | preserves redirect latency |
| Paste storage | object store for large blobs | cheaper and more durable |
| Metadata lookup | cache-first | read-heavy workload demands it |
| Expiry enforcement | check on read + background cleanup | correctness plus operational simplicity |

---

### Why This Design Works

This design works because it respects the real bottleneck of the system:

- reads dominate writes
- hot data is tiny and cacheable
- analytics is valuable but not latency-critical
- paste content storage is different from metadata storage

The architecture therefore keeps the hot path narrow:

- resolve code
- validate policy
- return result

Everything else is pushed behind queues, caches, and background workers.

That is the main systems-design lesson in this chapter.

---

### Summary

A URL shortener and Pastebin look simple on the surface, but they teach several core design principles:

1. optimize for the dominant workload, not the most obvious API
2. separate the read path from background processing
3. choose storage by access pattern, not by habit
4. treat abuse prevention and expiry as first-class concerns
5. explain trade-offs in business terms, especially around caching and analytics

If you can clearly justify code generation, caching, redirect semantics, storage separation, and asynchronous analytics, you have covered the heart of this design problem.

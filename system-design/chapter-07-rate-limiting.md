## 7: Rate Limiting

### What Is Rate Limiting and Why Does It Exist?

Every shared system has finite resources — CPU, database connections, memory, third-party API quota, and outbound bandwidth. Without a mechanism to control how fast clients consume these resources, a single misbehaving caller can exhaust capacity for everyone else.

Rate limiting is the policy that answers: **how many requests can this caller make in this time window before we start rejecting them?**

It is both a fairness mechanism and a safety valve:
- **Fairness:** prevents one tenant from starving others on shared infrastructure.
- **Safety:** limits blast radius when a client has a bug, a retry loop goes wild, or an attacker probes endpoints.
- **Cost control:** a runaway integration sending 10× expected Twilio SMS messages can cost thousands of dollars per hour before anyone notices.

**Real-world anchors:**
- **Cloudflare** enforces IP-level rate limits at the network edge, dropping abusive traffic before it reaches origin servers.
- **Stripe** applies per-API-key limits so one misconfigured integration cannot overwhelm the payment infrastructure for all merchants.
- **Slack** caps per-workspace request rates so a buggy bot cannot monopolize backend capacity during message bursts.
- **GitHub** returns `X-RateLimit-Remaining: 0` and a `Retry-After` header when an unauthenticated client polls the API too frequently.

---

### Core Concepts

**The stadium gate analogy**

Imagine a concert venue with a single entry gate. The gate controls throughput — it does not care who is outside, only how fast people can enter.

- **Token bucket** — a bucket of tickets refills at a fixed rate. Attendees can enter in short bursts if tickets have accumulated. Good for user-facing features where occasional bursts are acceptable.
- **Leaky bucket** — security lets exactly one person through every N seconds, no matter how big the crowd outside. Good for smoothing traffic to rate-limited downstream services.

**The simplest possible rate limiter**

```python
# In-memory counter (single server, non-distributed)
counts = {}

def allow(user_id, limit=100, window_seconds=60):
    key = f"{user_id}:{int(time.time() // window_seconds)}"
    counts[key] = counts.get(key, 0) + 1
    return counts[key] <= limit
```

This works for a single process. It breaks the moment you run two servers — each has its own counter and the limit doubles. That gap is what distributed rate limiting solves.

---

### The Four Core Algorithms

#### 1. Fixed Window Counter

Divide time into fixed buckets (e.g., each minute). Increment a counter per bucket; reject when it exceeds the limit.

```
Minute 00:01  [▓▓▓▓▓▓▓▓░░]  80/100 requests
Minute 00:02  [▓░░░░░░░░░]  10/100 requests  ← window reset
```

**Problem:** boundary bursts. A client can send 100 at 00:59 and 100 at 01:00 — 200 requests in 2 seconds.

**Use when:** simple quota enforcement where boundary bursts are acceptable (e.g., daily API credits).

#### 2. Sliding Window Log

Store a timestamp for every request in a sorted set. When a new request arrives, purge timestamps older than the window, count what remains, and allow if under the limit.

```
Window: last 60 seconds
Timestamps in set: [t-58, t-42, t-31, t-12, t-3]  → 5 requests
```

**Pro:** exact — no boundary burst problem.
**Con:** memory grows with request count; 1,000 req/min per user = 1,000 stored timestamps per user.

**Use when:** correctness is critical — failed login tracking, OTP send limits, compliance-mandated quotas.

#### 3. Sliding Window Counter (approximate)

A cheap approximation: combine the previous fixed window's count with the current window's count, weighted by how far into the current window you are.

```
rate = prev_count × (1 - elapsed/window) + curr_count
```

**Example:** 84 requests in the previous minute, 36 seconds into the current minute with 18 requests so far.
```
rate = 84 × (1 - 36/60) + 18 = 84 × 0.4 + 18 = 33.6 + 18 = 51.6
```

**Pro:** constant memory (two counters); close approximation.
**Con:** slightly over- or under-counts at window boundaries.

**Use when:** high-volume API gateways where a ~1% approximation error is fine.

#### 4. Token Bucket

A bucket holds up to `capacity` tokens. Tokens refill at `refill_rate` per second. Each request consumes one token; if empty, the request is rejected.

```
capacity = 100 tokens
refill_rate = 10 tokens/sec

User fires 20 requests in 1 second → 20 tokens consumed, 80 remain
User is idle for 5 seconds → +50 tokens refilled (capped at 100)
```

**Pro:** naturally handles legitimate bursts; intuitive capacity model.
**Use when:** user-facing APIs, search endpoints, dashboard refreshes — anywhere short bursts are expected and acceptable.

#### 5. Leaky Bucket

Requests enter a queue (the "bucket") and drain at a fixed rate. If the queue overflows, new requests are dropped.

```
Queue: [req1, req2, req3, req4]  (capacity 10)
Drain rate: 5 req/sec

No matter how fast requests arrive, output is always ≤5/sec.
```

**Pro:** perfectly smooth output; downstream never sees a burst.
**Use when:** calling a downstream service with a hard throughput limit — Twilio SMS (100/sec), SendGrid email, any vendor API with a strict rate cap.

#### Algorithm Decision Table

| Scenario | Best Algorithm | Why |
|---|---|---|
| Login brute-force protection | Sliding window log | Exact count required; security critical |
| Public REST API per API key | Sliding window counter | High volume; approximation acceptable |
| User dashboard search | Token bucket | Burst-tolerant; good UX |
| Outbound SMS to Twilio | Leaky bucket | Must not exceed vendor limit even in bursts |
| Daily credit quota | Fixed window | Simple; reset at midnight is acceptable |

---

### Deciding What to Limit

Rate limiting is not just "requests per minute." You must specify three things precisely before writing any code.

#### 1. Who is being limited?

| Identity | Example key | Best for |
|---|---|---|
| IP address | `ratelimit:ip:1.2.3.4` | Unauthenticated endpoints, DDoS mitigation |
| User ID | `ratelimit:user:u_123` | Authenticated APIs, per-account fairness |
| API key / token | `ratelimit:key:sk_abc` | Developer APIs, billing tiers |
| Tenant / org | `ratelimit:tenant:acme` | Multi-tenant SaaS fairness |
| Device ID | `ratelimit:device:d_xyz` | Mobile apps, per-device abuse prevention |

In practice, you often combine levels. A login endpoint might limit by both IP (stop distributed brute force) and by account (stop targeted credential stuffing regardless of IP diversity).

#### 2. Where is the limit enforced?

| Layer | Tool examples | Scope | Latency impact |
|---|---|---|---|
| Network / CDN edge | Cloudflare, AWS WAF | IP-level, volumetric DDoS | ~0 ms (edge-local) |
| API Gateway | Kong, AWS API Gateway | Per API key or tenant | ~1–2 ms |
| Service layer | In-process + Redis | Per user, per feature flag | ~1–5 ms |
| Downstream worker | Queue depth + consumer pacing | Outbound vendor API quota | Async |

Most production systems use **two tiers**: a coarse limit at the API gateway (protect the fleet), plus a fine-grained limit at the service layer (per-user fairness). Edge-only limiting is insufficient — it cannot stop authenticated abuse originating from distributed IPs.

#### 3. What resource is protected?

This changes the limit unit:

- **Login endpoint** → failed attempts per IP per minute (not just total requests)
- **SMS send API** → messages per tenant per second (maps to Twilio quota)
- **Search endpoint** → CPU-equivalent score, not raw request count
- **Export endpoint** → concurrent exports per user (not req/min)

A single `1000 req/min` global rule applied to all endpoints protects nothing well. The `/send-sms` endpoint and the `/search-products` endpoint have completely different cost and abuse profiles.

---

### Distributed Rate Limiting

#### The Core Problem

With multiple servers, each holding its own in-memory counter, the effective limit multiplies by the number of servers. With 10 app servers and a 100 req/min limit, the real limit is 1,000 req/min.

```
Server A: counter=40
Server B: counter=35      ← same user, different server
Server C: counter=38
Total: 113 requests — but each server sees ≤40, so all "pass"
```

**Solution:** move the counter to a shared store (Redis).

#### Redis Pattern: Atomic Increment

```python
def allow(key, limit, window_seconds):
    pipe = redis.pipeline()
    now_bucket = int(time.time() // window_seconds)
    redis_key = f"rl:{key}:{now_bucket}"
    pipe.incr(redis_key)
    pipe.expire(redis_key, window_seconds * 2)
    count, _ = pipe.execute()
    return count <= limit
```

**Problem with this approach:** `INCR` then `EXPIRE` are two commands — not atomic. A server crash between them leaves keys that never expire.

#### Redis Pattern: Atomic Lua Script (Sliding Window)

A Lua script runs atomically inside Redis, eliminating the race between check and update:

```lua
-- KEYS[1]: rate limit key, e.g. "ratelimit:user_123:POST:/api/orders"
-- ARGV[1]: max requests per window
-- ARGV[2]: window size in seconds
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(redis.call("TIME")[1])

-- Remove events outside the sliding window
redis.call("ZREMRANGEBYSCORE", key, 0, now - window)

-- Count events in window
local count = redis.call("ZCARD", key)

if count < limit then
    redis.call("ZADD", key, now, now .. math.random())
    redis.call("EXPIRE", key, window)
    return {1, limit - count - 1}   -- {allowed, remaining}
else
    local oldest = tonumber(redis.call("ZRANGE", key, 0, 0, "WITHSCORES")[2])
    local retry_after = window - (now - oldest)
    return {0, 0, retry_after}       -- {denied, remaining=0, retry_after}
end
```

Called via `EVAL` — the check and update are a single atomic operation.

#### Token Bucket in Redis (burst-tolerant)

```
FUNCTION allow_token_bucket(key, capacity, refill_rate_per_sec):
  tokens, last_refill = GET(key)
  now = current_time()
  tokens = min(capacity, tokens + refill_rate_per_sec * (now - last_refill))
  if tokens >= 1:
      SET(key, {tokens - 1, now})
      return ALLOW
  else:
      return DENY, retry_after = (1 - tokens) / refill_rate_per_sec
```

#### Local Admission + Global Budget (High Scale)

At 1M+ req/s, even a fast Redis cluster adds latency on every single request. The common solution:

1. Each app server holds a **local token bucket** (in-process, zero latency).
2. Every N milliseconds, servers **sync with a global Redis counter** — reporting usage and fetching a refreshed global budget.
3. The local bucket is replenished based on its fair share of the global budget.

This reduces Redis calls by 10–100×. The tradeoff: enforcement is slightly approximate within a sync interval.

---

### API Contract: HTTP Headers and Response Codes

Well-designed APIs tell clients their rate-limit state so clients can self-throttle instead of receiving surprise `429` responses.

| Header | Meaning | Example |
|---|---|---|
| `X-RateLimit-Limit` | Total requests allowed in the current window | `100` |
| `X-RateLimit-Remaining` | Requests left in the current window | `42` |
| `X-RateLimit-Reset` | Unix timestamp when the window resets | `1745280000` |
| `Retry-After` | Seconds to wait before retrying (sent on 429 only) | `8` |

**On limit exceeded:** return `429 Too Many Requests` with `Retry-After`.

Never return `500` or `503` for a rate limit — clients treat those as transient errors and retry immediately, making the overload worse.

#### API Design

```http
POST /v1/rate-limit/check
```

Request:
```json
{
  "key": "user_123",
  "limit": 100,
  "window_seconds": 60,
  "algorithm": "token_bucket"
}
```

Response:
```json
{
  "allowed": true,
  "remaining": 42,
  "retry_after_ms": 0
}
```

---

### Fail Behavior: Open vs. Closed

What happens when the rate-limit store (Redis) is unreachable?

**Fail open** — allow all requests through.
- Pro: preserves availability; clients are not blocked by infrastructure failure.
- Con: the protection is gone. An attacker or runaway client can exploit this window.
- Use for: low-risk, non-critical endpoints (analytics, search).

**Fail closed** — reject all requests with `429` (or `503`).
- Pro: the system is protected even when the limiter is degraded.
- Con: legitimate users are blocked during a Redis outage.
- Use for: billing APIs, OTP sends, security-critical endpoints.

**Local fallback bucket** — the middle ground. Each server keeps a conservative in-process bucket. If Redis is unreachable, enforce from the local bucket. When Redis recovers, reconcile.
- Use for: most production systems. Balances protection with availability.

**Rule:** specify fail behavior explicitly in the service runbook. Do not assume. Test it by killing the rate-limit store in staging.

---

### Capacity Estimation

| Dimension | Calculation | Result |
|---|---|---|
| Checks/second | 100K users × 10 req/s | 1M checks/s |
| Storage (sliding log) | 1M keys × 100 timestamps × 8 bytes | ~800 MB |
| Storage (counter) | 1M keys × 16 bytes | ~16 MB |
| Redis bandwidth | 1M checks/s × 200 bytes/check | ~200 MB/s |
| Redis nodes needed (centralized) | 200 MB/s ÷ ~100 MB/s per node | 2–3 nodes |
| With local admission (sync every 100ms) | 200 MB/s ÷ 100x reduction | ~2 MB/s |

**Key insight:** local admission with periodic sync reduces Redis bandwidth by 100× at the cost of ~100ms enforcement lag — acceptable for almost all use cases.

---

### Cost Model

| Setup | Approximate Monthly Cost | Notes |
|---|---|---|
| Redis (ElastiCache r6g.large) | ~$120 | 1M checks/s; shared across services |
| AWS API Gateway throttling | $0–$30 | Built-in per-key limits; no extra infra |
| Cloudflare rate limiting (Pro) | $20 | Edge enforcement; ~10 rules |
| Envoy/Istio in-cluster Redis | Infrastructure cost only | No SaaS overhead |
| In-process (Bucket4j, single node) | $0 | No external store; not distributed |

The cost of **not** rate limiting: a single misbehaving Twilio integration sending 10× expected SMS volume can cost thousands of dollars per hour before anyone notices.

---

### What Can Go Wrong

| Failure Mode | Effect | Mitigation |
|---|---|---|
| Redis becomes a bottleneck | Limiter adds latency to every request | Shard counters; use local admission |
| Clock skew across servers | Window boundaries are inconsistent | Use Redis `TIME` command, not local clocks |
| Limit too strict | Legitimate bursts are blocked | Use token bucket; track false-positive 429s |
| Limit too loose | Downstream is not protected | Per-feature limits; regular threshold review |
| Boundary burst (fixed window) | 2× requests in 2 seconds | Use sliding window or token bucket |
| Hot key in Redis | One shard overwhelmed by high-traffic key | Shard by key prefix; use local admission |

---

### Operations and Maintenance

- **Monitor limiter latency as a first-class SLO.** The limiter is on every request path. Alert at p99 > 2 ms; investigate before it becomes the bottleneck.
- **Track false-positive rate.** Log 429s by caller, endpoint, and time window. A spike in legitimate-user 429s means a threshold is too tight or a client has a retry bug.
- **Review thresholds quarterly.** Traffic patterns change. A limit that protected at launch may be blocking legitimate 10× growth, or may be too loose for evolved attack patterns.
- **Test fail behavior explicitly.** Kill the Redis store in staging; verify the system fails open or closed as intended.
- **Use per-feature limits.** `/send-sms` and `/search-products` have different cost and abuse profiles. A shared global limit protects neither well.
- **Shard counters for high-cardinality keys.** 10M users × 1 counter each = 10M keys. Distribute across Redis nodes by key prefix to avoid hot shards.

---

### Evolution Over Time

| Stage | Approach | When to use |
|---|---|---|
| Early / single server | In-process token bucket (Bucket4j, in-memory map) | 1–2 servers; simplest path |
| Multi-server | Redis atomic counter or Lua script | 3–20 servers; need shared enforcement |
| High scale | Local admission + periodic global sync | 20+ servers; Redis bandwidth is a concern |
| Adaptive | Dynamic limits based on real-time system health signals | Mature platform; autoscaling + circuit breaker integration |

---

### Interview Trade-Off Questions and Answers

**1. When is token bucket better than sliding window, and when does exact enforcement matter enough to pay the extra cost?**

Token bucket is better when burst is intentional and user-friendly — a user legitimately refreshes a dashboard 5 times in 2 seconds. It allows short bursts as long as the average rate stays within budget, and it is cheaper to implement (two values: token count and last-refill time).

Sliding window log is better when exact enforcement is required — failed login attempts (where a boundary burst enables a brute-force attack), OTP sends (where exceeding a vendor quota causes dropped messages), or compliance-mandated quotas. The extra cost (storing one timestamp per request) is only worth paying when the business or security consequence of a boundary burst is material.

Sliding window counter is the practical middle ground: it approximates the sliding window with constant memory and is accurate enough for API fairness quotas.

**2. If the central limiter store is unavailable, should the system fail open or fail closed?**

It depends on what the limiter protects.

For security-critical or cost-critical endpoints (login attempts, payment processing, SMS sends), fail closed or use a conservative local fallback bucket. The risk of unlimited requests is higher than the risk of temporarily blocking clients.

For non-critical endpoints (analytics, search, product catalog), fail open to preserve availability. A brief window of unrated traffic is acceptable.

The local admission fallback is the best default: keep a conservative in-process token bucket on each server. If Redis is unreachable, enforce from the local bucket (which underestimates capacity, erring on the side of protection). When Redis recovers, reconcile and resume global enforcement.

**Never rely on a single answer for all endpoints.** Document fail behavior per service in the runbook.

**3. How do you balance per-user fairness with global system protection during a burst or attack?**

Use two independent limit layers:

- **Global / fleet-level limit** at the API gateway: protects total system capacity regardless of who is sending. Example: 50K req/s fleet-wide regardless of caller identity.
- **Per-user / per-tenant limit** at the service layer: enforces fairness. Example: 100 req/min per user, 10K req/min per tenant.

During a distributed attack from many accounts, the fleet-level limit absorbs the burst. During a single rogue tenant, the per-tenant limit contains the damage without affecting others.

Additionally, **dynamic limits** improve this further: detect anomalous behavior (a user sending 10× their historical average) and tighten their window automatically — isolating the bad actor while preserving capacity for everyone else. This requires behavioral baselines but scales well on mature platforms.

---

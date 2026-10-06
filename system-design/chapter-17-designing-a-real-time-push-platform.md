## 17: Designing a Real-Time Push Platform

> **Case Study:** Netflix's Zuul Push Service — delivering real-time updates to 250 M+ devices.

### The Core Problem: 10 Million Open Sockets

Sending a message to one user is trivial. Maintaining persistent two-way connections to **10 million devices simultaneously** is a fundamentally different engineering problem.

The naive approach — one thread per connection — requires 10 million OS threads. That is physically impossible: a modern server has 8–32 cores and a few GB of stack memory. You need a completely different model.

**Why persistent connections?**

Without persistent connections, you fall back to polling: the client asks "any messages for me?" every second. At 10 million clients, that is 10 million HTTP requests per second just for the polling overhead — and messages still arrive up to 1 second late. Persistent connections invert the model: the server pushes when there is something to say, and the client sits quietly until then.

**The three hard sub-problems:**
1. **Scalability:** How do you hold 10 M open sockets without running out of OS resources?
2. **Routing:** When you want to push to `user_456`, which of your 80 servers currently owns their socket?
3. **Deployability:** When you redeploy code, you cannot disconnect all 10 M clients at once.

### The Stadium Intercom

Think of this system as a **stadium with 10 million seats**:

- Each spectator (device) is seated in a specific section (connection server). They are just sitting there — they opened a persistent connection and are waiting.
- The announcer's booth (router) knows "seat 4,521,007 is in Section 37" but does not own the seat's headphone system.
- When a score update arrives, the booth looks up the section, forwards the audio to Section 37's speaker system (connection server), which delivers it to that one seat's headphones.

**The key resource:** Not CPU per request, but **open socket count per server**. A modern 8-core server using non-blocking I/O can handle 100,000–200,000 sockets simultaneously. 10 million connections → ~80 servers.

### Real-World Examples

| Product | Use Case | Connection Scale |
|---|---|---|
| **Netflix** (Zuul Push) | Playback state sync across devices | 250 M+ subscribers |
| **Slack** | Real-time message delivery, typing indicators | Millions of concurrent users |
| **Google Docs** | Live collaborative editing, cursor positions | Per-document sessions |
| **Robinhood** | Real-time stock price updates | Millions of live market feeds |
| **Multiplayer games** (Fortnite) | Player positions, game state sync | 100K+ per match server |
| **Uber driver app** | Driver location updates, trip status | Millions of drivers + riders |

---

### Transport Protocol Comparison

| Protocol | Direction | Model | Server State | Best For |
|---|---|---|---|---|
| **HTTP Polling** | Client → Server (repeated) | Request/response | Stateless | Simple, low-frequency (1/min) |
| **HTTP Long Polling** | Server holds open | Request/response | Stateful per request | Low-frequency events, simpler infra |
| **Server-Sent Events (SSE)** | Server → Client only | Persistent stream | Stateful | One-way push: dashboards, feeds |
| **WebSockets** ✅ | Bidirectional | Persistent channel | Stateful | Chat, gaming, collaborative tools |
| **MQTT** | Bidirectional, lightweight | Pub/Sub | Stateful | IoT devices (batteries, low bandwidth) |

**WebSocket** provides full-duplex TCP communication. Once the HTTP upgrade handshake completes, the connection is a raw byte stream — the server can push at any time without the client requesting.

**When to choose each:**
- Choose **SSE** if you only need server-to-client push and want simpler HTTP infrastructure (SSE automatically reconnects and handles backpressure well).
- Choose **WebSockets** if the client also sends messages upstream (typing indicators, game actions, collaborative edits).
- Choose **MQTT** for IoT devices that run on batteries or low-bandwidth networks — it is an order of magnitude lighter than WebSockets.
- Choose **APNs/FCM** for mobile devices that may be asleep or offline — you cannot maintain a TCP socket to a sleeping phone.

---

### Functional Requirements

1. **Persistent connection management:** Accept, authenticate, and maintain long-lived client connections.
2. **Targeted message routing:** Deliver a message to a specific device or user with < 1 second latency.
3. **Multi-device fan-out:** One user may have many active connections (phone, tablet, TV).
4. **Automatic reconnection:** Clients recover from server crashes or deploys without manual intervention.
5. **Presence awareness:** The system knows whether a specific device is currently online.
6. **Offline fallback:** When a device is offline, hand off to APNs/FCM or hold for reconnect.
7. **Priority delivery:** Urgent messages (security alerts, session-stolen) bypass low-priority queues.
8. **Message TTL:** Messages stale beyond their useful lifetime are not delivered on reconnect.
9. **Session resumption:** After reconnect, clients can request messages they missed.

---

### Non-Functional Requirements

| Property | Target |
|---|---|
| Concurrent connections | 10 M+ |
| Push latency (p99) | < 1 second inside a region |
| Availability | No server, registry shard, or broker is a SPOF |
| Connection recovery time | Clients reconnect within 3–5 seconds |
| Failure blast radius | One server failure disconnects ≤ 0.1% of clients |
| Security | Authenticated connections, encrypted transport (TLS), tenant isolation |

---

### Capacity Estimation

1. **Server count:** 10 M connections ÷ 125 K per server = **~80 connection servers**.
2. **Registry size:** 10 M entries × 100 bytes = ~1 GB before replication.
3. **Reconnect rate:** If 1% of clients reconnect per minute → 1,667 reconnects/second steady state; 10× during a bad deploy.
4. **Heartbeat load:** 10 M clients × 1 heartbeat / 60 sec = ~167,000 registry TTL refreshes/second.
5. **Push bandwidth:** 5% of clients receive 1 push/min × 1 KB = ~833 KB/s payload (mostly idle; dominated by heartbeat overhead).
6. **Missed-message buffer:** If TTL is 5 minutes, retain undelivered messages for offline users for 5 min × message_rate × offline_fraction.

---

### Entity Design

**Connection** (live registry entry, not persisted long-term)

| Field | Type | Notes |
|---|---|---|
| `connection_id` | `UUID` | |
| `client_id` | `VARCHAR(128)` | device or session ID |
| `user_id` | `VARCHAR(128)` | |
| `server_id` | `VARCHAR(64)` | owning connection server |
| `region` | `VARCHAR(32)` | |
| `connected_at` | `TIMESTAMP` | |
| `expires_at` | `TIMESTAMP` | heartbeat TTL — entry auto-expires if no heartbeat |

**PushMessage**

| Field | Type | Notes |
|---|---|---|
| `message_id` | `UUID` PK | |
| `recipient_user_id` | `VARCHAR(128)` | |
| `recipient_device_id` | `VARCHAR(128)` | Nullable — null = all devices |
| `message_type` | `VARCHAR(64)` | |
| `payload` | `JSONB` | |
| `priority` | `VARCHAR(16)` | high / normal / low |
| `freshness_ttl_sec` | `INT` | max age before dropping |
| `created_at` | `TIMESTAMP` | |

**DeliveryOutcome**

| Field | Type | Notes |
|---|---|---|
| `outcome_id` | `UUID` PK | |
| `message_id` | `UUID` FK → PushMessage | |
| `connection_id` | `UUID` Nullable | Null if delivered offline via APNs/FCM |
| `status` | `VARCHAR(16)` | delivered / dropped / offline / fallback_sent |
| `recorded_at` | `TIMESTAMP` | |

---

### ER Diagram

```
Connection Server ────────< Connection >──────── PushMessage ────────< DeliveryOutcome
                              ^
                              │ lookup
                         Push Registry
                         (Redis, client_id → server_id)
```

- One connection server owns many live **Connection** entries in the registry (with TTL).
- One **PushMessage** targets one client or user and produces one **DeliveryOutcome**.
- The **Push Registry** is the indirection layer enabling O(1) routing.

---

### API Design

```grpc
service PushService {
  rpc RegisterConnection(RegisterConnectionRequest)  returns (RegisterConnectionResponse);
  rpc SendMessage(SendMessageRequest)                returns (SendMessageResponse);
  rpc CloseConnection(CloseConnectionRequest)        returns (CloseConnectionResponse);
  rpc GetPresence(GetPresenceRequest)                returns (GetPresenceResponse);
}
```

REST equivalents:

```http
POST /v1/connections
POST /v1/push/messages
DELETE /v1/connections/{connection_id}
GET  /v1/presence/{user_id}
```

```http
POST /v1/push/messages
Authorization: Bearer <service-token>

{
  "recipient_user_id": "u123",
  "recipient_device_id": "tv_456",
  "message_type": "playback_state_changed",
  "payload": { "session_id": "s789", "state": "started_elsewhere" },
  "priority": "high",
  "freshness_ttl_sec": 30,
  "idempotency_key": "push_evt_001"
}

202 Accepted
{ "message_id": "msg_xyz", "status": "queued" }
```

---

### High-Level Architecture

```
Client (iOS / Android / TV / Browser)
        │  TLS WebSocket upgrade
        ▼
Network Load Balancer  (Layer 4 TCP passthrough)
        │  sticky by connection_id
        ▼
Connection Servers  (Netty / Node.js async I/O, ~125K sockets each)
        │  register connection, heartbeat refresh
        ▼
Push Registry  (Redis / Dynomite cluster, client_id → server_id, with TTL)
        ▲
        │  lookup server_id for each recipient
        ▼
Message Router  (stateless, Kafka consumer)
        ▲
        │  consume from prioritized Kafka topics
        ▼
Kafka Topics
   ├── push-high       (security alerts, session actions)
   ├── push-normal     (playback sync, friend activity)
   └── push-low        (recommendation badges, stats updates)
        ▲
        │  publish
        ▼
Internal Services  (via shared Push Library)

Offline Path:
Message Router ──► Offline Fallback Worker ──► APNs / FCM / Notification Service
```

---

### Key Design Decisions

| Axis | Decision | Reasoning |
|---|---|---|
| Socket model | Event-driven I/O (Netty, epoll) | Thread-per-connection impossible at 10 M sockets |
| Routing | Registry lookup (O(1)) vs broadcast (O(N servers)) | Broadcast sends every message to every server; too expensive |
| Connection lifetime | Bounded + jittered (e.g., 30 min ± random) | Prevents thundering herd on deploy; stale registry entries expire naturally |
| Server sizing | Many medium servers (~125K sockets each) | Limits blast radius; one failure ≤ 0.1% of users disconnected |
| Registry consistency | TTL-based expiry + heartbeat refresh | Stale entries expire without explicit deletion; clean up on crash |
| Offline handling | Message TTL + fallback APNs/FCM | Time-sensitive messages are useless after freshness_ttl; APNs wakes sleeping devices |
| State locality | Connection servers own sockets; routers are stateless | Stateless routers scale horizontally; socket complexity isolated to connection servers |
| Priority isolation | Separate Kafka topics per priority | Low-priority messages cannot starve high-priority delivery |

---

### Connection Lifecycle

```
                CONNECT
                   │
                   ▼
              AUTHENTICATING
           (verify JWT / session token)
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
    AUTH_FAILED          CONNECTED
    (close socket)    (write registry entry with TTL)
                           │
               ┌───────────┼────────────┐
               ▼           ▼            ▼
         HEARTBEAT    RECEIVING     CLIENT_CLOSE
         (refresh      MESSAGES      (graceful
          registry TTL)  (push)       disconnect)
               │
          TTL_EXPIRED
          (entry deleted;
           router sees client offline)
               │
         CLIENT_RECONNECT
         (new connection, new server possibly)
```

**Why bounded lifetimes?** A connection that lives forever means: (a) a bug in the new version of connection-server code affects clients forever, (b) when you deploy, all clients disconnect at once causing a massive reconnect storm. By setting connection lifetime to 30 minutes with ±5 minutes of jitter, reconnects are naturally spread over a 10-minute window, and a buggy deploy self-corrects within 30 minutes as connections cycle.

---

### Session Resumption After Reconnect

When a client reconnects after a brief disconnection (e.g., flaky WiFi), it may have missed messages. Two approaches:

1. **Client-side sequence number:** The client tracks the last `message_seq` it received. On reconnect, it sends `last_seen_seq` and the server replays any buffered messages after that sequence. Works if the server retains a short message buffer (e.g., 5 minutes of history per `client_id`).

2. **Stateless catch-up:** The client reconnects and polls a "missed events" endpoint. The push platform does not maintain history; the client fetches state directly from the source of truth (e.g., "what is the current playback state of my session?"). Simpler operationally but requires the source service to support state queries.

Netflix's approach: stateless catch-up. The Zuul Push platform does not maintain message history. On reconnect, the client refreshes its view from the appropriate APIs. This keeps the push platform simple — it is a delivery mechanism, not a message store.

---

### Thundering Herd Prevention

If all 80 servers restart simultaneously (e.g., bad deploy rolls out everywhere at once), 10 million clients reconnect at the same moment. This can:
- Overwhelm the load balancer with TCP SYN packets
- Flood the Push Registry with concurrent writes
- Cause CPU spikes on the authentication service

**Mitigations:**
1. **Jittered reconnect backoff on clients:** Clients use `min(cap, base * 2^attempt + rand(0, base))` — exponential backoff with full jitter. A client disconnected at t=0 might reconnect at t=3s, t=7s, t=15s, not at t=1s, t=1s, t=1s.
2. **Bounded connection lifetimes with per-client jitter:** Each connection expires at a different time, so even a total redeploy only disconnects a fraction simultaneously.
3. **Rolling deploys:** Deploy to one server at a time (~125K disconnects per rolling step), not all 80 at once.
4. **Admission control at load balancer:** Rate-limit new TLS handshakes per second during known-bad conditions.

---

### Trade-Offs

| Decision | Option A | Option B | Chosen & Why |
|---|---|---|---|
| **Transport** | SSE | WebSockets | **WebSockets** — need bidirectional for client ack and heartbeats |
| **Socket model** | Thread-per-connection | Event-driven I/O | **Event-driven** — thread-per-connection impossible at 10 M |
| **Routing** | Broadcast to all servers | Registry lookup | **Registry lookup** — O(1) vs O(N) |
| **Server sizing** | 10 very large servers | 80 medium servers | **Many medium** — smaller blast radius |
| **Connection lifetime** | Infinite | Bounded + jittered | **Bounded + jittered** — makes deploys survivable |
| **Offline handling** | Drop messages | APNs/FCM fallback | **Fallback** for time-sensitive; drop for stale |
| **Message history** | Buffer on push server | Stateless catch-up | **Stateless** (Netflix-style) — simpler, source of truth stays in source service |

---

### Failure Modes & Mitigations

| Failure | Impact | Mitigation |
|---|---|---|
| Connection server crashes | Clients on that server disconnect (~125K) | Clients auto-reconnect with jittered backoff; registry entries TTL-expire |
| Push Registry unavailable | Router cannot resolve server_id | Replicated Redis cluster; quorum reads; fall back to APNs/FCM for offline handling |
| Stale registry entry | Router sends to wrong server | TTL ensures staleness expires; delivery failure triggers fallback to offline path |
| Kafka broker failure | Messages on that broker delayed | Replication factor = 3; Kafka re-routes to replicas |
| Thundering herd on deploy | Massive reconnect spike | Jittered connection lifetimes + rolling deploys + client-side exponential backoff |
| Priority inversion | Low-priority messages delay high-priority | Separate Kafka topics per priority with isolated consumer groups |
| Memory leak on connection server | Connection count degrades over time | Bounded lifetimes force periodic recycling; monitor `connection_count` vs `expected_count` |

---

### Design Rationale

10 million open connections is a **state-management problem**, not a request-rate problem. A thread-per-connection model collapses under memory and scheduling pressure. Event-driven I/O + a dedicated connection tier + a registry-based router turns this into a horizontally scalable system: keep sockets on specialized servers, keep routing logic separate, keep reconnect storms bounded by design. The registry is the key insight — routing without it requires broadcasting every message to every server, which is O(N servers) per message and untenable at scale.

---

### How Much Will It Cost?

**Netflix-scale estimate (10 M concurrent connections):**

| Component | Spec | Monthly Cost |
|---|---|---|
| 80 × Connection servers (m5.large) | Netty, 125 K sockets each | ~$12,000 |
| Push Registry (Redis, 6-node cluster, Dynomite) | client_id → server_id, TTL heartbeat | ~$1,800 |
| Kafka cluster (6 × m5.xlarge, 3 priority topics) | 3× replication | ~$1,800 |
| Message Router (4 × c5.2xlarge, auto-scaled) | Kafka consumer + registry lookup | ~$1,200 |
| Load Balancer (NLB, TCP passthrough) | WebSocket sticky routing | ~$200 |
| Offline Fallback Worker (2 × c5.large) | APNs/FCM routing for offline clients | ~$200 |
| **Total** | | **~$17,200/month** |

At smaller scale (100 K connections): 1–2 connection servers + small Redis + small Kafka ≈ ~$1,000/month.

---

### Operations

**The three operational lessons from Netflix Zuul Push:**

**Lesson 1: Connections make servers stateful — rollback is painful.**
A buggy build affects every client still connected to that server. Mitigation: bounded lifetimes + jitter mean bugs self-correct as connections cycle; canary deploys limit exposure.

**Lesson 2: The right auto-scaling metric is open connection count, not CPU or RPS.**
RPS is deceptively low (most connections are idle most of the time). CPU can stay low even at full capacity. Monitor `open_connections / server` and scale out at 80% of target. Use reconnect rate as a leading indicator — a spike usually precedes a CPU or memory alarm.

**Lesson 3: Never let registry entries go stale silently.**
A stale entry means the router forwards messages to a server that no longer owns the socket. Messages are silently dropped. Monitor `registry_miss_rate` (percentage of routing attempts where the target server rejects the forward) — this should be < 0.1%. Spikes indicate TTL misconfiguration or an unhealthy heartbeat path.

Additional checks:
- Alert on reconnect spikes (often signal a bad deploy or a regional network event).
- Monitor `freshness_ttl_expired_message_rate` — high rates mean messages arrive after TTL, indicating either slow delivery or TTLs set too short.
- Coordinate TLS certificate rotation across all client platforms.

---

### How Does It Evolve in 3 Years?

| Year | Evolution |
|---|---|
| **Year 1** | Single-region WebSocket cluster with basic routing, heartbeat, and manual scaling. |
| **Year 2** | Multi-region deployment, auto-scaling on connection count, jittered lifetimes, and offline APNs/FCM fallback. |
| **Year 3** | Adaptive transport (MQTT for IoT/mobile, WebSocket for browser), session resumption with sequence numbers, and intelligent message batching to reduce power drain on mobile clients. |

---

### Interview Questions & Answers

**Q1: When are WebSockets worth the operational complexity over SSE, long polling, or APNs/FCM?**

WebSockets are worth it when: (a) you need bidirectional communication — the client must also send messages upstream (typing indicators, collaborative edits, game actions), (b) message rate is high enough that polling wastes bandwidth or creates perceptible latency, and (c) sub-second delivery matters. For purely server-to-client delivery of infrequent events (e.g., email notifications), SSE or APNs/FCM are simpler and sufficient. For mobile devices that may sleep, APNs/FCM is the only viable option because a sleeping device cannot maintain a TCP socket. Choose WebSockets for collaborative tools, live dashboards, and chat. Choose APNs/FCM for mobile where battery life and background state matter more than latency.

**Q2: Is it better to run fewer large connection servers or more medium-sized ones?**

More medium-sized servers. A single large server that fails disconnects a proportionally larger share of clients, causing a bigger reconnect storm and more user-visible disruption. Netflix sized servers at ~100K–200K connections each — one failure impacts at most 0.1–0.2% of users, which is usually an acceptable blast radius. The tradeoff: more servers means more registry entries, more operational overhead, and slightly higher coordination cost — but this is almost always the right trade-off compared to the UX impact of a massive server failure. Rule: if a server failure would be visible as a major user-facing incident, the server is too large.

**Q3: How do you prevent a rolling deploy from causing a thundering herd of simultaneous reconnects?**

Three complementary controls: (a) **Bounded + jittered connection lifetimes** — connections expire at different random times so even a simultaneous redeploy only causes a fraction to reconnect at once. (b) **Rolling deploys** — deploy to one server at a time, giving the registry and load balancer time to absorb the reconnect spike before the next server restarts. (c) **Client-side exponential backoff with full jitter** — clients that disconnect simultaneously will reconnect at different times if they each wait `base * 2^attempt + rand(0, base)` seconds. Together, these convert a potential 10 M simultaneous reconnects into a smooth ~10-minute ramp.

**Q4: When should offline clients fall back to APNs/FCM versus receiving the message on the next reconnect?**

Fall back to APNs/FCM when: (a) the message is time-sensitive (driver arriving, security alert, live score update), (b) the user should be woken from background state, or (c) the message has a `freshness_ttl` that will expire before the device reconnects. Defer to reconnect when: the message is informational and tolerates latency (a badge count update, a non-urgent status change), or the device has been offline for longer than the message's useful lifetime. Design all push messages with a `freshness_ttl_sec` field so the router can make this decision automatically: if `now > created_at + freshness_ttl`, drop the message instead of delivering a stale notification that confuses the user.

**Q5: Which metric should drive auto-scaling: RPS, CPU, memory, or open connection count?**

**Open connection count** per server is the primary scaling metric. RPS is misleading for WebSocket servers — most connections are idle most of the time, so RPS stays low even when the server is at capacity. CPU stays low too because non-blocking I/O is not CPU-intensive. Memory is a secondary signal (each connection holds a socket buffer + metadata). The canonical auto-scaling rule: scale out when `open_connections > 0.8 × target_connections_per_server`. Use **reconnect rate as a leading indicator** — a sudden spike in reconnections usually precedes capacity pressure by several minutes, giving time to scale proactively before CPU or memory alarms fire.

**Q6: How does MQTT differ from WebSockets, and when would you choose it for a push platform?**

MQTT is a lightweight publish-subscribe protocol designed specifically for constrained environments: low-bandwidth networks (2G/3G), battery-powered devices, and unreliable connections. Key differences from WebSockets: (a) **Message framing is more compact** — a minimal MQTT PUBLISH packet is 2 bytes of fixed header vs. 2–10 bytes for WebSocket framing. (b) **Built-in QoS levels** — MQTT natively supports fire-and-forget (QoS 0), at-least-once (QoS 1), and exactly-once (QoS 2). WebSockets have no built-in QoS. (c) **Clean session vs persistent session** — an MQTT broker can hold queued messages for a disconnected client with a persistent session, re-delivering them on reconnect. Choose MQTT for: IoT sensors, wearables, vehicles, and any scenario where the device has constrained power or bandwidth. Choose WebSockets for: browser-based apps and native apps on full-power mobile devices where latency matters more than efficiency.

---

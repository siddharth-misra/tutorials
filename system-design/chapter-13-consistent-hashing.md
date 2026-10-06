## 13: Consistent Hashing

### The Core Problem

Distributed systems constantly add nodes (capacity, recovery) and lose nodes (failures, decommissions). You need to route each key to the right server — but how do you do that when the set of servers keeps changing?

The naive approach is **modulo hashing**: `server = hash(key) % N`. It works perfectly when `N` is fixed. But when `N` changes:

```text
# N=8 cluster: key "user:42" → server 3
server = hash("user:42") % 8  →  3

# Add one server, N=9: same key now routes to server 7
server = hash("user:42") % 9  →  7  ← moved!
```

Adding just one server to an 8-server Memcached pool causes ~87.5% of keys to remap to different servers. Every remapped key is a cache miss. Every cache miss hits the database. For a system doing millions of lookups per second, this is a thundering herd that can bring down the database.

**Consistent hashing solves this.** When you add or remove one node from an N-node ring, only ~1/N of keys move — the theoretical minimum. The rest of the cluster is completely unaffected.

---

### The Ring Intuition

Imagine a clock face, but instead of 12 positions it has positions from 0 to 2³²−1 (about 4 billion). Both servers and keys are placed on this clock by hashing them.

- **Server placement:** `position(server) = hash(server_name)`
- **Key placement:** `position(key) = hash(key)`
- **Routing rule:** Walk clockwise from the key's position until you hit a server. That server owns the key.

```
           0 / 2³²
           │
     ┌─────┴─────┐
 270 ┤  Server C  ├ 90
     │    (S3)   │
 240 ┤           ├ 120
     └─────┬─────┘
           180
     
Ring positions (example):
  Server A → position 50
  Server B → position 150  
  Server C → position 270
  
  Key "user:1" → hash = 80  → walks clockwise → hits Server B at 150
  Key "user:2" → hash = 200 → walks clockwise → hits Server C at 270
  Key "user:3" → hash = 300 → walks clockwise → wraps to Server A at 50
```

**Adding a server:** Place it on the ring. It takes ownership of keys between its predecessor and itself. Every other key is untouched.

**Removing a server:** Its keys pass to its clockwise successor. Every other key is untouched.

With modulo hashing: `(N-1)/N` keys move when N changes ≈ 87.5% for N=8.  
With consistent hashing: `1/N` keys move ≈ 12.5% for N=8.

---

### The Problem with a Simple Ring

A single position per server creates **uneven arc sizes**. With 3 servers randomly placed, one server might own 60% of the ring and another only 10% — by pure chance.

The solution is **virtual nodes (vnodes)**: each physical server owns many positions on the ring, not just one.

```
Physical servers: A, B, C
With 6 vnodes each:

Ring: A1-B2-C1-A2-B1-C2-A3-B3-C3-A4-B4-C4-A5-B5-C5-A6-B6-C6...
      ↑                                                         ↑
      positions scattered evenly around the ring
```

With more vnodes, the law of large numbers ensures each server owns approximately `1/N` of the ring, regardless of where the hash function places each individual token.

**Load distribution by vnode count:**

| Vnodes per server | Load imbalance (std dev) | Recommendation |
|---|---|---|
| 1 | ~30% | Never use in production |
| 10 | ~10% | Borderline acceptable |
| 100 | ~3% | Good for most systems |
| 200 | ~2% | Standard (Cassandra default) |
| 1000 | ~1% | Diminishing returns; more metadata overhead |

**Weighted vnodes for heterogeneous hardware:**

If one server has twice the RAM/CPU, give it twice the vnodes so it owns twice the ring share:

```text
vnodes_i = round(total_vnodes × w_i / Σ(all weights))
```

**Example — mixed fleet:**

| Node | RAM | Vnodes (of 600 total) | Ring share |
|---|---|---|---|
| node-A | 64 GB | 150 | 25% |
| node-B | 64 GB | 150 | 25% |
| node-C | 128 GB | 300 | 50% |

Node C owns 50% of the ring because it can store 50% of the data. Without weighting, it would be overloaded and become the hot spot.

**Metadata overhead:** 600 vnodes × 16 bytes/token × 100 nodes = ~960 KB — fits in memory on any client and is trivial to gossip across the cluster.

---

### Production Ring Mechanics

#### Lookup Algorithm

The ring is stored as a **sorted array of (token, node_id) pairs**. Lookup is a binary search — O(log V) where V is the number of vnodes.

```python
import bisect, hashlib

def get_node(key: str, ring: list[tuple[int, str]]) -> str:
    h = int(hashlib.md5(key.encode()).hexdigest(), 16)
    idx = bisect.bisect(ring, (h,))  # binary search, O(log V)
    idx = idx % len(ring)            # wrap around the ring
    return ring[idx][1]

def get_replicas(key: str, ring: list[tuple[int, str]], R: int) -> list[str]:
    h = int(hashlib.md5(key.encode()).hexdigest(), 16)
    idx = bisect.bisect(ring, (h,)) % len(ring)
    seen_nodes, replicas = set(), []
    while len(replicas) < R:
        node = ring[idx % len(ring)][1]
        if node not in seen_nodes:
            replicas.append(node)
            seen_nodes.add(node)
        idx += 1
    return replicas
```

For a cluster with 200 vnodes × 100 nodes = 20,000 ring entries, binary search takes ~14 comparisons — nanoseconds, completely negligible vs any network RTT.

#### Replication Strategy

Most systems replicate to the next `R` clockwise **distinct physical nodes** after the primary. Cassandra calls these the coordinator (primary) and replicas.

```
Ring: ... A(token=10) → B(token=20) → C(token=30) → D(token=40) ...
Key hashes to token=15 → primary = B
Replicas (R=3): B (primary), C (next distinct), D (next distinct after C)

Quorum reads: any 2-of-3 replicas must agree (W + R > N → 2 + 2 > 3 ✓)
```

This means the system tolerates `R-1` replica failures per key without data loss.

#### Hash Function Selection

The hash function determines how uniformly nodes and keys scatter across the ring.

| Function | Speed | Distribution | Recommendation |
|---|---|---|---|
| **MD5** | ~500 MB/s | Excellent | Legacy only; overkill crypto overhead |
| **MurmurHash3** | ~3 GB/s | Excellent | Default choice for most systems |
| **xxHash** | ~10 GB/s | Excellent | Best choice for high-throughput systems |
| **CRC32** | ~4 GB/s | Good | Avoid for general use; weak on adversarial inputs |
| **SHA-256** | ~150 MB/s | Excellent | Only when cryptographic security is required |

**Critical rule:** Every client and every server in the cluster must use the **same hash function and same seed**. A mismatch causes different clients to compute different ring positions — silently routing keys to wrong nodes.

---

### Ring Membership — Keeping Everyone in Sync

The ring is shared state. When nodes join or leave, all clients need to know. There are three propagation mechanisms:

| Mechanism | How It Works | Trade-offs | Used By |
|---|---|---|---|
| **Gossip** | Nodes periodically exchange ring state with random peers. Convergence in O(log N) rounds. | Eventually consistent; 10–30s for 1000-node cluster | Cassandra, Riak |
| **Config service (CP)** | Ring state in ZooKeeper/etcd. Clients watch for changes. | Strongly consistent; adds dependency on config service | Kafka (ZooKeeper era), Envoy/xDS |
| **Client-side bootstrap** | Clients download full ring state on startup, refresh on version mismatch. | Simple; stale until refresh | libketama, Redis Cluster |

**Gossip detail (Cassandra model):**
- Every 1 second, each node picks 3 random peers and exchanges state
- State includes: node list, tokens, health status, heartbeat counter
- Dead detection: if a node's heartbeat hasn't advanced for `phi` intervals, it's suspected DOWN
- For 1,000 nodes: full convergence ≈ log₂(1000) ≈ 10 rounds ≈ 10 seconds

#### Safe Node Addition (Stream Before Handoff)

```
1. New node registers (via gossip or config service)
2. Ring controller assigns token ranges (vnodes) to new node
3. New node streams data from current owners of those token ranges
4. Once streaming completes, ring state updated: new node goes LIVE
5. Former owners mark migrated data for deletion at next compaction
```

**Never flip the ring before data arrives.** If the ring is updated first, requests hit the new node before it has the data — cache misses or 404s for every key in the transferred range.

#### Safe Node Removal (Drain Before Departure)

```
1. Operator marks node as DECOMMISSIONING
2. Node streams all its token ranges to clockwise successors
3. Successors confirm receipt and replicate to their own replicas
4. Ring state updated: node removed
5. Node shuts down cleanly
```

**Never abruptly remove a node.** If the node was the only replica for some token range (possible during failure scenarios), abrupt removal causes permanent data loss.

---

### Advanced Patterns

#### Pattern 1 — Client-Side Ring (Smart Client)

```
┌──────────────────┐    ring cached locally    ┌──────────────┐
│  Client          │──────────────────────────▶│  Node A      │
│  (holds ring)    │   direct to owning node   ├──────────────┤
│  ring_version=42 │                           │  Node B      │
└──────────────────┘                           ├──────────────┤
                                               │  Node C      │
                                               └──────────────┘
```

Client computes the owning node locally and routes directly — zero proxy hops.

**Used by:** Cassandra native drivers, Redis Cluster clients, libketama  
**Pro:** Lowest latency — no extra network hop  
**Con:** Ring state must be refreshed on every client; complex client library

#### Pattern 2 — Proxy-Side Ring (Thin Client)

```
┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│  Client  │────▶│  Proxy/Router   │────▶│  Node A      │
│  (dumb)  │     │  (holds ring)   │     │  Node B      │
└──────────┘     └─────────────────┘     └──────────────┘
```

A central proxy (Twemproxy, mcrouter, Envoy) holds the ring and forwards requests to the right node. Clients use standard protocols (Memcached, Redis) without knowing about the ring.

**Used by:** Twemproxy (Twitter), mcrouter (Facebook), Envoy sidecar  
**Pro:** Simple clients; ring managed in one place  
**Con:** Proxy is a bottleneck and potential single point of failure; must be horizontally scaled

#### Pattern 3 — Sloppy Quorum with Hinted Handoff

Used by Amazon Dynamo and Cassandra to keep writes available during partial failures:

1. A write for key `K` targets replicas A, B, C (per the ring)
2. If B is temporarily down, write a **hint** to node D (outside the replica set), tagged "deliver to B when it recovers"
3. When B recovers, D forwards the hinted write and deletes the hint

**Real-life example:** During an AWS availability zone outage, DynamoDB continues accepting writes for affected partitions by routing hinted handoffs to nodes in healthy AZs. When the AZ recovers, hints are drained automatically.

This allows writes to succeed even when designated replicas are down (at the cost of brief inconsistency). The sloppy quorum is `W + R > N` computed across available nodes, not necessarily the ring-designated nodes.

#### Pattern 4 — Token Range Splitting (Auto-Sharding)

Used by DynamoDB and TiKV to handle hot partitions automatically:

1. Monitor each partition's size and request rate
2. When a partition exceeds threshold (DynamoDB: >10 GB or >3,000 WCU), split its token range at the median key
3. Assign the two halves to different physical nodes
4. Update ring state atomically

**Real-life example:** A DynamoDB table for an e-commerce flash sale accumulates all writes on the partition for `product_id=VIRAL_ITEM`. DynamoDB detects the hot partition and automatically splits it, distributing the load — without any operator action.

#### Pattern 5 — Fixed Slots (Two-Level Hashing, Redis Cluster)

Instead of a continuous ring, use a fixed number of **slots** that never change:

1. Fixed 16,384 slots (not vnodes — slots never added or removed)
2. Each key maps to a slot: `slot = CRC16(key) % 16384`
3. Slots are assigned to physical nodes; resharding = moving slot assignments

```
Slot 0–5460    → Node A
Slot 5461–10922 → Node B
Slot 10923–16383 → Node C

Moving Node B's slots to Node D:
  Client gets MOVED 7500 10.0.0.4:6379  ← redirected
  Client updates its slot→node table
  Client retries directly to Node D
```

**Pro:** Client routing table is a fixed-size array (16,384 entries). Simple to implement correctly in any language.  
**Con:** Less flexible than vnodes (no weighted distribution, fixed slot count).

---

### Alternative Hashing Algorithms

Ring-based consistent hashing isn't the only option. Three alternatives are worth knowing:

#### Rendezvous Hashing (Highest Random Weight, HRW)

For each key, score every server and pick the highest score:

```text
owner = argmax_i( hash(key ‖ server_i) )
```

- No ring data structure needed
- Perfectly uniform with any N
- **O(N) lookup per key** — must score all servers; impractical for large N
- Used by: Akamai CDN origin selection, some Nginx configs

#### Jump Consistent Hash (Google, 2014)

Pure arithmetic — no ring, no sorted array, no vnodes:

```c
int32_t JumpConsistentHash(uint64_t key, int32_t num_buckets) {
    int64_t b = -1, j = 0;
    while (j < num_buckets) {
        b = j;
        key = key * 2862933555777941757ULL + 1;
        j = (b + 1) * ((double)(1LL << 31) / (double)((key >> 33) + 1));
    }
    return (int32_t)b;
}
```

- O(log N) time, O(1) space — extremely fast and compact
- **Only supports adding nodes at the end** (no arbitrary removal)
- Ideal for ordered storage backends
- Used by: Google Spanner (internal variant), some distributed file systems

#### Consistent Hashing with Bounded Loads (Google, 2017)

A refinement of ring hashing that prevents hot spots when traffic skews:

- If a node's current load exceeds the cluster average by more than factor `ε`, skip it and try the next node clockwise
- Prevents one popular key range from overloading one node
- At the cost of slightly violating the "nearest clockwise node" rule

Used by: Google's internal load balancers, Envoy proxy (`ring_hash` and `maglev` policies)

**Algorithm comparison:**

| Algorithm | Lookup | Space | Node removal | Best for |
|---|---|---|---|---|
| Ring + vnodes | O(log V) | O(V) | Arbitrary | General purpose |
| Rendezvous (HRW) | O(N) | O(1) | Arbitrary | Small N, CDN |
| Jump Hash | O(log N) | O(1) | Append only | Sequential storage |
| Fixed slots (Redis) | O(1) | O(slots) | Arbitrary | Multi-language clients |

---

### Real-World Implementations

#### Amazon DynamoDB — Token-Based Partitioning

DynamoDB uses a 128-bit ring derived from MD5 of the partition key. Each partition owns a token range. When a partition exceeds 10 GB or 3,000 WCU, it automatically splits its token range. The control plane (a Paxos-replicated metadata service) maintains the authoritative ring state, so every router in AWS has a consistent view. When an AWS region adds capacity, DynamoDB absorbs the new nodes without any user impact.

#### Apache Cassandra — Gossip + Vnodes

Cassandra uses 256 vnodes per node by default (`num_tokens=256` in `cassandra.yaml`). Ring state gossips across the cluster every 1 second. Native drivers maintain a local ring copy and route directly — no proxy hop. During decommission, Cassandra streams all token ranges to successors before updating the ring, guaranteeing zero data loss.

#### Memcached + libketama — The Original Production Use

Before consistent hashing, Memcached used `hash(key) % N`. Adding one server to a 7-node pool moved 6/7 ≈ 86% of keys. LinkedIn's `libketama` (2007) fixed this with a ring of 150 vnodes per server using MD5. This reduced key movement to ~1/N and made cache resizing safe during traffic. Every major Memcached client library today uses this approach.

#### Discord — Gateway Server Affinity

Discord routes WebSocket connections across gateway servers using consistent hashing on `user_id`. When a gateway server restarts for a deploy, only the users in that server's ring segment disconnect. Without consistent hashing, a rolling restart of the gateway fleet would disconnect every user simultaneously.

#### Nginx / HAProxy — Cache-Friendly Load Balancing

Both support consistent hashing for upstream selection:
- Nginx: `hash $request_uri consistent;`
- HAProxy: `balance uri`

This creates **sticky routing**: all requests for the same URL always go to the same upstream cache server, maximizing hit rate. If an upstream goes down, only the keys in its ring segment miss — the rest of the fleet keeps serving hits normally.

---

### API Design for a Ring Management Service

```http
# Route a key — which node owns it?
GET /v1/ring/lookup?key=user:42
→ { "node": "node-7", "replica_nodes": ["node-2", "node-11"] }

# Add a new node
POST /v1/ring/nodes
{ "node_id": "node-12", "host": "10.0.1.12", "weight": 1.0 }
→ 201 Created
  { "token_ranges_assigned": ["0x3A2F..–0x4B1C..", "0xC012..–0xD34A.."] }

# Graceful removal (triggers async drain)
DELETE /v1/ring/nodes/node-12?drain=true
→ 202 Accepted

# Full ring state (for client bootstrap)
GET /v1/ring/state
→ { "version": 42, "vnodes": [ { "token": "0x...", "node": "node-3" }, ... ] }
```

**Client contract:** Cache ring state locally keyed by version. On `404` or routing error (`MOVED`), re-fetch ring state and retry.

---

### Design Trade-offs Summary

| Axis | Decision |
|---|---|
| **Scalability** | Horizontal: add nodes; ring absorbs them with O(keys/N) movement |
| **Latency** | Ring lookup is O(log V) — nanoseconds, negligible vs network RTT |
| **Consistency vs availability** | Stale ring views cause misroutes, not outages; prefer availability, tolerate brief stale views |
| **Fault tolerance** | Vnodes + R replicas clockwise keeps failures local to one ring segment |
| **Client complexity** | Client-side ring = fastest; proxy-side ring = simpler clients |

---

### Capacity Estimation

**Scenario:** 16-node cluster storing 2 TB total.

1. **Key movement on resize:** Adding one node moves ~1/16 = 6.25% of keys
2. **Rebalance bandwidth:** 2 TB / 16 nodes = 125 GB per node. Adding one node triggers ~125 GB streaming. At 1 Gbps = ~17 minutes. Plan maintenance windows accordingly.
3. **Metadata size:** 200 vnodes × 100 nodes = 20,000 ring entries × 20 bytes = 400 KB — trivial to cache on every client
4. **Lookup latency:** Binary search on 20,000 entries = ~14 comparisons = nanoseconds
5. **Write amplification:** Replication factor R=3 means each write goes to 3 nodes. Effective cluster write throughput = total capacity / 3

---

### Failure Modes and Mitigations

| Failure Mode | Root Cause | Mitigation |
|---|---|---|
| **Hot spots** | Too few vnodes or poor hash distribution | Use 150–256 vnodes; use MurmurHash3 or xxHash |
| **Rebalance storm** | Node removed suddenly during peak traffic | Graceful drain; throttle streaming bandwidth (Cassandra: `stream_throughput_outbound_megabits_per_sec`) |
| **Stale ring metadata** | Client cached old ring view | Version ring state; refresh on MOVED error or misroute |
| **Hash function mismatch** | Different clients use different seeds | Enforce hash function + seed in cluster config; test on startup |
| **Split-brain ring views** | Network partition splits gossip graph | Use etcd/ZooKeeper as authoritative ring store; treat gossip as cache only |
| **Skewed partitions (hot key)** | Popular key maps to one node regardless of ring | Append per-key suffix to scatter across nodes; or use bounded-load hashing |
| **Oversized range after decommission** | Leaving node's full range absorbed by one successor | Pre-split large token ranges before decommissioning |

---

### Operational Playbook

- **Vnode audits:** Periodically verify each node's actual data volume matches its expected ring share (e.g., `nodetool status` in Cassandra)
- **Ring health checks:** Monitor for nodes that are in the ring but not responding; auto-evict after grace period
- **Add nodes gradually:** Start new nodes with a small vnode count (e.g., 10) to validate health before ramping to 200
- **Never remove two nodes simultaneously:** Each removal triggers a rebalance; overlapping rebalances saturate NICs
- **Stagger additions:** Add one node, wait for streaming to complete, verify balance, then add the next
- **Free space headroom:** Keep ~20% free space per node to absorb keys streaming in during a peer's failure

---

### Evolution Over Time

| Phase | Capability |
|---|---|
| **Startup** | Basic consistent hashing; manual node management; client-side ring |
| **Growth** | Vnodes and weighted placement; gossip-based membership; proxy router for non-smart clients |
| **Scale** | Automated split-on-size (hot partition detection); bounded-load routing; hot-key scatter; auto-drain on health failure |

---

### Interview Trade-Off Questions & Answers

**Q1: When is simple modulo hashing good enough?**

**A:** When your node count is fixed and never changes under load — for example, a fixed-size batch processing cluster or a static sharding scheme where you plan migrations manually. Modulo hashing is simpler, needs no ring data structure, and has O(1) lookup. Consistent hashing is necessary when nodes join or leave while the system is serving traffic, especially for caches where mass remapping = mass cache miss = database overload.

**Q2: How many vnodes are enough?**

**A:** 150–256 is the production standard range. More vnodes reduce load variance (200 vnodes → ~2% std dev from mean), but increase: (1) ring metadata size, (2) number of token ranges each node participates in during streaming, (3) complexity of range-based operations. For most systems, 200 is the right default. Below 100, imbalance becomes noticeable. Above 500, you're paying overhead for negligible improvement.

**Q3: Rebalance during peak traffic — fast recovery or minimal movement?**

**A:** Minimize movement. A rebalance storm during peak traffic — saturating NICs with streaming data, causing cache misses for moved keys — is far worse than a slightly longer recovery window. Throttle streaming bandwidth explicitly (cap at 50–100 Mbps per node during business hours). Schedule large node additions for off-peak windows. Fast recovery matters for failures; for planned scaling, do it slowly.

**Q4: Vnodes vs. fixed slots (Redis Cluster style)?**

**A:** Vnodes offer flexibility: arbitrary node counts, weighted distribution, non-uniform ring. Fixed slots offer simplicity: client routing is a static 16,384-entry array, easy to implement correctly in any programming language. For polyglot systems where many different client libraries need to route correctly, fixed slots win — the client implementation is trivial. For storage systems where weighting and flexibility matter more than client simplicity, vnodes win. Most new cache systems choose fixed slots; most new storage systems choose vnodes.

**Q5: What happens during a network partition that splits the gossip graph?**

**A:** Each partition island develops a diverging view of the ring. Nodes on each side believe they own certain token ranges. This leads to: (1) writes accepted by wrong nodes, (2) reads missing data on the "real" owner, (3) eventual data divergence when partition heals. Mitigation: use a strongly consistent store (etcd, ZooKeeper) as the source of truth for ring state. Treat gossip as a propagation optimization only — never as authoritative. With etcd, ring updates require quorum; during a partition, ring changes block rather than diverge.

---

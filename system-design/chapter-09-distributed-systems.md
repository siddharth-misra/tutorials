## 9: Distributed Systems

Distributed systems are the backbone of every large-scale product — Google Search, Amazon's checkout, Netflix streaming, WhatsApp messaging. This chapter builds understanding from scratch: what a distributed system is, why you build one, the fundamental problems they introduce, and the engineering techniques used to solve those problems. By the end you will be able to reason about coordination, failure, and consistency trade-offs in a system design interview.

---

### Part 1 — Foundations

#### What Is a Distributed System?

A distributed system is a collection of independent computers that appears to users as a single coherent system. Your laptop and a server farm are both computers, but when you use Gmail, you interact with thousands of servers spread across multiple data centers — yet it feels like one inbox.

**Simple mental model:** Think of a restaurant chain. Each franchise location (node) can take orders and serve food independently. The corporate headquarters (control plane) keeps the menu in sync across all locations. If one location burns down, customers go to the next one. That is a distributed system.

#### Why Build a Distributed System?

Four forces push engineers toward distribution:

| Driver | Problem it solves | Real-world example |
|---|---|---|
| **Scale** | A single server has finite CPU, memory, disk, and network bandwidth | Google processes ~8.5 billion searches/day — no single machine can handle that |
| **Fault tolerance** | A single server will eventually crash, lose power, or suffer hardware failure | Netflix replicates video chunks across multiple servers so a disk failure doesn't interrupt your show |
| **Geographic distribution** | Serving Tokyo users from Virginia adds ~150ms of latency | Cloudflare runs 300+ edge nodes so your nearest server is typically under 20ms away |
| **Independent scalability** | Different services have different bottlenecks | Uber's map service needs read-heavy geo-indexing; its billing service needs transactional writes — each scales differently |

#### When NOT to Use a Distributed System

Distribution introduces real complexity. Before distributing, ask whether you need to:

- **Traffic fits one machine (< 10K RPS):** A well-tuned single server with a managed backup is far simpler. Most startups live here for years.
- **Data fits one database:** One primary database with a read replica handles most applications up to millions of users.
- **Strong consistency everywhere:** Cross-node coordination adds latency. If every operation must be strongly consistent and latency matters, a monolith may outperform a distributed system.

> **Rule of thumb:** Distribute only what must be distributed, and only when the cost of not distributing is real and measurable. Premature distribution is one of the most expensive engineering mistakes.

---

### Part 2 — Core Concepts

#### The Fundamental Challenges of Distribution

Four problems arise over a network that simply do not exist on a single machine:

1. **Messages can be delayed or lost** — A node cannot tell the difference between a slow reply and a dead node. It must decide: keep waiting or assume failure?
2. **Clocks drift** — Two servers' clocks are never perfectly in sync. "Who wrote this first?" is a hard question without a shared clock.
3. **Partial failures** — One service can fail while the rest runs fine, leaving the system in an ambiguous half-working state.
4. **Concurrent updates** — Two nodes can modify the same data simultaneously, creating conflicts.

These are captured formally in two ideas:
- **CAP theorem** — A distributed system can guarantee at most two of: Consistency, Availability, Partition tolerance. (See Chapter 5 for the full treatment.)
- **Fallacies of Distributed Computing** — Eight common false assumptions: the network is reliable, latency is zero, bandwidth is infinite, the network is secure, topology doesn't change, there is one administrator, transport cost is zero, the network is homogeneous.

#### Key Properties Every Distributed System Must Balance

| Property | What it means | Trade-off |
|---|---|---|
| **Scalability** | Performance grows as nodes are added | Adding nodes adds coordination overhead |
| **Fault tolerance** | System keeps operating despite partial failures | Redundancy costs money and adds complexity |
| **Transparency** | System appears as one machine to users | Hiding failures can make debugging harder |
| **Concurrency** | Multiple nodes work simultaneously | Requires careful coordination to avoid corruption |
| **Consistency** | All nodes return the same value for the same key | Strong consistency limits availability during partitions |
| **Replication** | Data copied to multiple nodes for durability | Replication lag means reads may be stale |

#### How Nodes Coordinate: Three Patterns

**Pattern 1 — Leader-Follower (Primary-Replica)**

One node is elected as the authoritative source for writes. All others replicate its state.

- Simple to reason about; reads can scale by adding replicas
- Leader is a single point of bottleneck; failover takes time (seconds to minutes)
- Used by: PostgreSQL, Redis Sentinel, Kafka topic partitions, MySQL with GTID replication

*Real example:* A PostgreSQL primary handles all writes. Three read replicas serve analytics queries. If the primary crashes, Patroni (a HA tool) detects the failure and promotes a replica to primary within ~30 seconds.

**Pattern 2 — Leaderless (Peer-to-Peer)**

Any node can accept a write. Writes propagate to other nodes. Requires conflict resolution.

- Highly available — no single point of failure for writes
- Harder to make strongly consistent; conflicts resolved via last-write-wins, vector clocks, or CRDTs
- Used by: Cassandra, DynamoDB, Amazon S3

*Real example:* In Cassandra, a write for `user_id=42` goes to three replicas simultaneously. If replica 2 is slow, replicas 1 and 3 acknowledge the write and the client proceeds. Replica 2 catches up via a repair process. Two concurrent writes to the same key from different nodes are resolved by last-write-wins (based on timestamps).

**Pattern 3 — Consensus-Based**

A cluster of nodes votes on every write. A write is committed only after a majority (quorum) agrees.

- Strongest consistency guarantees
- Higher write latency; limited to small clusters (3 or 5 nodes) because larger groups slow voting
- Used by: etcd (Kubernetes config store), ZooKeeper (Kafka metadata), CockroachDB

*Real example:* Kubernetes stores all cluster state in etcd. When you run `kubectl apply`, the API server writes to etcd, which uses the Raft consensus algorithm to get agreement from at least 2 of 3 etcd nodes before acknowledging the write. If one etcd node crashes, the cluster still has a majority (2 of 3) and continues to accept writes.

#### Replication: Synchronous vs. Asynchronous

| Mode | How it works | Consistency | Latency | Risk |
|---|---|---|---|---|
| **Synchronous** | Primary waits for replica confirmation before ACKing client | Strong — replicas never lag | Higher — adds a network round trip | Replica slowness blocks the primary |
| **Asynchronous** | Primary ACKs immediately; replicas catch up later | Eventual — replicas may lag | Lower — primary doesn't wait | If primary crashes before replica syncs, data may be lost |
| **Semi-synchronous** | Primary waits for at least one replica before ACKing | Middle ground | Middle ground | MySQL's default mode |

*Real example:* Google Spanner uses synchronous replication within a region and semi-synchronous across regions. Financial transactions require synchronous replication so no committed write is ever lost. A photo upload service might use asynchronous replication because losing one photo upload is acceptable and the lower latency improves user experience.

#### Failure Modes Unique to Distributed Systems

| Failure Mode | What happens | Real-world example | Mitigation |
|---|---|---|---|
| **Network partition** | Two groups of nodes lose connectivity | An AWS Availability Zone loses its uplink; nodes inside still work but can't reach other AZs | Design for partition tolerance; accept eventual consistency during partitions |
| **Split-brain** | Two nodes both believe they are the leader, accepting conflicting writes | Two Kafka brokers both think they are partition leader after a network glitch, producing duplicate messages | Fencing tokens (monotonically increasing lease IDs) — storage systems reject writes with stale tokens |
| **Byzantine fault** | A node sends incorrect or malicious data | A compromised validator node in a blockchain broadcasts invalid transactions | Byzantine fault-tolerant (BFT) consensus; used in blockchains, not typical enterprise systems |
| **Clock skew** | Nodes disagree on current time by milliseconds to seconds | A distributed lock expires at 10:00:00.500 on node A but node B's clock reads 10:00:00.450, so node B still treats the lock as valid | TrueTime (Google Spanner: GPS + atomic clocks); logical clocks (Lamport timestamps) for systems that don't need wall time |
| **Cascading failure** | One slow node queues up callers, overloading the whole system | A slow database causes all API servers to block on DB calls, exhausting their thread pools | Circuit breakers, timeouts, and bulkheads at every service boundary |

> **Real-world postmortem:** In 2012, AWS suffered a widespread outage when an EBS control plane bug triggered a cascading failure. Services using circuit breakers and async decoupling degraded gracefully. Services with tight synchronous coupling failed completely. The incident validated the importance of bulkhead patterns in distributed architectures.

---

### Part 3 — Advanced Mechanics

#### Leader Election

Leader election is the process by which nodes agree on which one node is the current authoritative coordinator. Without it, you get split-brain.

**How it works in practice (Raft algorithm):**
1. Nodes start as followers, waiting for heartbeats from a leader.
2. If a follower doesn't hear from a leader within an election timeout (150–300ms), it becomes a candidate and votes for itself.
3. The candidate sends `RequestVote` RPCs to other nodes. Nodes grant their vote only once per term.
4. If a candidate receives votes from a majority, it becomes the leader and starts sending heartbeats.
5. If no majority forms (split vote), the election times out and a new one starts with an incremented term number.

*Real example:* etcd (used by Kubernetes) uses Raft. When an etcd leader node crashes, the remaining two nodes hold an election within ~500ms. The one that wins sends its first heartbeat, and Kubernetes resumes accepting API requests. The whole failover is invisible to most users.

#### Distributed Locks and Why They Are Tricky

A distributed lock coordinates access to a shared resource across multiple nodes — preventing two services from processing the same order at the same time, for instance.

**The naive approach fails:** Using Redis `SET key value NX PX 30000` gives you a lock that expires after 30 seconds. But consider:

1. Worker A acquires the lock (30s TTL).
2. Worker A gets a GC pause or network slowdown and takes 35 seconds.
3. At second 30, the lock expires. Worker B acquires the lock.
4. Worker A resumes at second 35, still thinking it holds the lock.
5. Both A and B are writing to the shared resource simultaneously.

**The fix — fencing tokens:**

Every lock acquisition returns a monotonically increasing token (epoch number). Storage systems that receive writes check the token and reject any write with a token lower than the highest they've seen.

```
Worker A acquires lock → receives token 42
Worker B acquires lock → receives token 43
Worker A tries to write with token 42 → REJECTED (storage has seen 43)
Worker B writes with token 43 → ACCEPTED
```

This is why "just use Redis for distributed locks" is incomplete advice. A lease without fencing protects liveness (only one holder at a time, in the happy path) but not correctness (a stale holder can still write after its lease expires). For correctness-critical workflows, you need either fencing tokens or idempotent writes that can detect and reject stale updates.

**When to use distributed locks vs. idempotency:**
- Use locks when you need mutual exclusion and the window of concurrent access is small (< 1 second).
- Prefer idempotent writes when the lock window would be long or when lock failures are hard to recover from. An idempotent write with a unique operation ID is more resilient than a lock.

#### Quorum Reads and Writes

For a replicated store with `N` replicas, choose read quorum `R` and write quorum `W` such that:

```
R + W > N
```

This ensures every successful read overlaps with every successful write on at least one replica, making stale reads less likely.

**Common configurations:**

| N | W | R | Effect |
|---|---|---|---|
| 3 | 2 | 2 | Balanced — tolerates 1 failure on either read or write |
| 3 | 3 | 1 | Write-heavy durability — all replicas must confirm writes; reads are fast |
| 3 | 1 | 3 | Read-heavy consistency — writes are fast; reads check all replicas |

*Real example:* DynamoDB with W=2, R=2, N=3 means a write must be acknowledged by 2 of 3 replicas. A subsequent read from any 2 replicas will always hit at least one that has the latest write. This gives you strong consistency without requiring all 3 replicas to be available.

**Quorum is not enough alone:** Quorum prevents stale reads in the common case but doesn't prevent split-brain during network partitions. That requires fencing tokens as described above.

#### Clock Synchronization and Logical Clocks

Distributed systems cannot rely on wall clocks for ordering because clocks drift. Two approaches:

**Physical clocks (NTP):** Servers synchronize to network time servers. Typical accuracy: ±10ms in a data center, ±100ms across the internet. Good enough for coarse-grained ordering but not for strict event ordering across nodes.

**Logical clocks (Lamport timestamps):** Each node maintains a counter. On every send, the counter increments. On every receive, the counter is set to `max(local, received) + 1`. This gives a partial ordering of events without relying on wall time.

**Hybrid Logical Clocks (HLC):** Combine wall time with a logical component. CockroachDB uses HLC to track causality while staying close to wall time — enabling bounded staleness reads without requiring TrueTime hardware.

**TrueTime (Google Spanner):** GPS receivers and atomic clocks in every data center provide time with bounded uncertainty (typically ±7ms). Spanner's commit wait forces each transaction to wait out the uncertainty window before committing, guaranteeing that later transactions always get higher timestamps. This enables globally consistent reads without any distributed locking.

*The practical implication for leases and TTLs:* If a lease expires at wall time T and clock skew is S, a node must treat the lease as expired at T - S (to be safe). Failing to account for skew means two nodes may both believe they hold a valid lease simultaneously.

#### Event Delivery Guarantees

Every message queue or event stream makes a guarantee about how many times a consumer processes each event:

| Guarantee | What it means | How achieved | Use when |
|---|---|---|---|
| **At-most-once** | Message delivered 0 or 1 times — possible loss, no duplicates | Commit offset before processing; if the consumer crashes after commit but before processing, the message is skipped | Metrics and logging where occasional gaps are acceptable |
| **At-least-once** | Message delivered 1 or more times — no loss, possible duplicates | Commit offset only after processing succeeds; broker re-delivers on consumer restart | Most production systems; requires idempotent consumers |
| **Effectively-once** | Appears exactly once to the application | At-least-once delivery + idempotent consumer-side deduplication | Payment processing, order placement — anywhere duplicates cause visible damage |

**Why true "exactly-once" at the broker layer is hard:**

Kafka provides exactly-once semantics *within Kafka* using transactions and idempotent producers. But once the event triggers an action in an external system (send an email, charge a credit card), exactly-once is no longer Kafka's problem — it requires idempotency on the external side.

*Real example:* Stripe's payment processing accepts at-least-once delivery from its internal event queues. Each charge attempt carries an idempotency key (a UUID generated by the caller). If the same key arrives twice, Stripe returns the original charge result without charging the card again. This is cheaper and more reliable than trying to guarantee exactly-once delivery at the broker layer.

**Commit position determines delivery semantics in Kafka:**

```
Auto-commit before processing → at-most-once (message may be skipped on crash)
Manual commit after processing → at-least-once (message may be reprocessed on crash)
Transactional write + commit → effectively-once (requires consumer idempotency)
```

#### The Saga Pattern: Distributed Transactions Without 2PC

When a business workflow spans multiple services with separate databases, you cannot use a database transaction to coordinate them. Two-phase commit (2PC) is the classical solution but has problems: the coordinator is a single point of failure, and participants block during the prepare phase.

**The Saga alternative:** Break the workflow into a sequence of local transactions. Each step succeeds or fails independently. If a later step fails, earlier steps are undone using explicit compensating transactions.

*Real example — e-commerce order:*

```
Step 1: Reserve inventory          → Compensation: Release reservation
Step 2: Charge payment             → Compensation: Refund charge
Step 3: Create shipment record     → Compensation: Cancel shipment
Step 4: Send confirmation email    → (no compensation needed; email is idempotent)
```

If step 3 fails, the saga runs step 2's compensation (refund) and step 1's compensation (release reservation) in reverse order.

**Choreography vs. Orchestration:**

| Style | How it works | Pros | Cons |
|---|---|---|---|
| **Choreography** | Each service listens for events and reacts independently | No central coordinator; highly decoupled | Hard to trace the overall flow; debugging is difficult |
| **Orchestration** | A central saga orchestrator calls each step and handles failures | Easy to visualize and debug; single source of truth | Orchestrator is a stateful service that must itself be fault-tolerant |

**Making the orchestrator reliable:** Store saga state durably (in PostgreSQL or a Kafka compacted topic) and design the orchestrator to be restartable from any step. If the orchestrator crashes mid-flow, it must be able to resume without re-running already-completed steps.

**When to use sagas:**
1. A workflow spans multiple services with separate databases.
2. The business can tolerate eventual consistency (state may be inconsistent for seconds while compensations propagate).
3. 2PC's blocking behavior is unacceptable for your availability requirements.

---

### Part 4 — System Design Application

#### Putting It Together: Designing a Distributed Coordination Service

A coordination service (like etcd or ZooKeeper) provides leader election, distributed locks, and configuration storage to other services. Here is how to think through its design:

**API surface:**

```
POST /v1/leader/elect          → returns { leader_id, token, lease_expires_at }
POST /v1/locks/{name}:acquire  → returns { acquired: true, token: 7, expires_at }
DELETE /v1/locks/{name}:release → returns { released: true }
PUT /v1/config/{key}           → stores configuration value
GET /v1/config/{key}           → returns current configuration value
```

**Capacity estimates:**
- Quorum cluster size: 3 or 5 nodes (odd number to avoid ties; 7+ adds latency without adding meaningful fault tolerance)
- Write latency: one quorum write = at least one network round trip to majority → ~1–5ms in a single data center
- Replication bandwidth: 5,000 config updates/second × 1 KB = ~5 MB/s before replication overhead
- Clock skew budget: lease duration must be >> maximum observed clock skew; if skew is 10ms, a 30-second lease is safe; a 15ms lease is not

#### Design Trade-Offs at a Glance

| Axis | Option A | Option B | When to choose A |
|---|---|---|---|
| Consistency vs. availability | Reject writes during partition (CP) | Accept writes with possible conflicts (AP) | Financial data, configuration, leader election |
| Replication mode | Synchronous | Asynchronous | When you cannot afford to lose any acknowledged write |
| Coordination style | Consensus (Raft/ZooKeeper) | Quorum (DynamoDB-style) | When you need strong consistency on metadata; quorum for user data |
| Lock safety | Fencing tokens | TTL-only leases | Always prefer fencing tokens for correctness-critical workflows |
| Delivery guarantee | Effectively-once | At-least-once + idempotency | Use idempotency — it's simpler and more resilient than broker-level exactly-once |

#### Failure Modes and Mitigations

| Failure | Root cause | Mitigation |
|---|---|---|
| Leader election flaps | Short election timeout causes re-elections under load | Tune heartbeat and timeout intervals; use pre-vote (Raft optimization) |
| Split-brain | Network partition between leader and followers | Fencing tokens; quorum rules that require majority to proceed |
| Lost write after failover | Async replica promotes before it has the latest data | Semi-sync or sync replication; write fencing on epoch change |
| Stale lock holder | GC pause or network delay outlasts TTL | Fencing tokens; idempotent writes that detect stale operations |
| Duplicate saga execution | Retry replays a workflow step | Idempotency keys per saga step; deduplication table checked before execution |
| Clock skew breaks leases | System clock adjusted or drifts | NTP with monitoring; leases far longer than max observed skew |
| Cascading failure | Slow node backs up callers | Circuit breakers with half-open probe; bulkhead thread pools per downstream |

#### Observability and Operations

A distributed system that you cannot observe will eventually surprise you at the worst possible moment:

- **Leader churn rate:** Alert if leader elections exceed 1/hour in a healthy cluster — frequent elections indicate instability.
- **Replication lag:** Alert if any replica lags the primary by more than 5 seconds — it may not be usable for failover.
- **Quorum loss:** Immediately page on-call — a cluster below quorum cannot accept writes.
- **Clock skew:** Alert if any node's skew exceeds half the minimum lease duration.
- **Saga state:** Track saga completion rate, compensation rate, and stuck sagas (those that haven't advanced in N minutes).

**Failure drills to run regularly:**
- Kill the leader and verify automatic failover completes within SLA.
- Partition one node and verify quorum continues to function.
- Inject a GC pause into a lock holder and verify the fencing token prevents stale writes.
- Replay a saga from a mid-flow checkpoint and verify idempotency keys prevent double-execution.

#### Evolution Over Time

| Phase | What you build | Why |
|---|---|---|
| **Year 1** | Primary-replica databases; simple Redis-based locks; manual failover | Fast to build; sufficient for early scale |
| **Year 2** | Quorum-based writes; automated failover (Patroni/Orchestrator); idempotent consumers | Eliminate manual toil; reduce recovery time from hours to seconds |
| **Year 3** | Multi-region consensus for critical metadata; saga orchestration across domains; HLC for bounded staleness reads | Survive regional failures; eliminate 2PC; enable globally consistent reads |

---

### Interview Questions and Answers

**Q1: When is a saga a better fit than distributed two-phase commit (2PC), and what business complexity does it push into compensation logic?**

**A:** Use a saga over 2PC when the workflow spans services with separate databases, when the coordinator being a single point of failure is unacceptable, or when blocking all participants during a prepare phase violates availability requirements. 2PC's prepare phase holds database locks across multiple services for the duration of the commit — a coordinator crash leaves all participants blocked waiting for a decision.

The trade-off is that sagas push complexity into compensation logic. You must design explicit undo actions for every non-terminal step. Compensations must themselves be idempotent (they may be retried). Some business effects — like a sent email or a triggered push notification — cannot be undone, only acknowledged. The business must accept eventual consistency during the window between a step's success and the completion or rollback of the full saga. For workflows where this is unacceptable (real-time trading, ATM withdrawals), 2PC or a single-service transactional boundary is the right answer.

**Q2: How do you choose between asynchronous replication, quorum writes, and single-leader synchronous replication for a user-facing workflow?**

**A:** The choice depends on what you can and cannot afford to lose or accept:

- **Asynchronous replication:** Choose when low write latency matters more than durability guarantees and when losing the last few seconds of writes during a failure is acceptable. Good for: social media posts, non-financial user profile updates, activity logs.
- **Quorum writes (R + W > N):** Choose when you need to survive node failures without a dedicated leader failover process, and when you can tolerate slightly higher write latency than async but lower than full sync. Good for: user data in Cassandra or DynamoDB, where availability matters more than strict consistency.
- **Single-leader synchronous replication:** Choose when you cannot lose any acknowledged write and when the system's value depends on strong read-your-writes consistency. Good for: payment records, inventory levels, anything where stale reads after failover would cause incorrect business decisions.

In practice, most systems use asynchronous replication for read replicas (to serve read traffic) and synchronous or semi-synchronous replication for the standby that would take over on leader failure.

**Q3: When should you rely on distributed locks, and when is it safer to redesign the workflow to be idempotent without a lock?**

**A:** Use distributed locks when mutual exclusion is genuinely required for correctness and the critical section is short (under 1 second). Example: a job scheduler ensuring only one worker processes a given task partition at a time.

Avoid distributed locks when the lock window would be long (seconds or minutes), when the downstream operation is an external API call, or when the lock holder can fail silently (GC pause, network partition). In these cases, the lock provides false safety — a stale holder can resume after its lease expires and corrupt shared state.

The safer alternative is idempotent design: assign a unique operation ID (idempotency key) to each logical operation. Before executing, check whether the operation has already been completed. If yes, return the cached result. If no, execute and record the result atomically. This approach handles retries, concurrent attempts, and stale workers without relying on a lock's availability or timing guarantees. Stripe's payment API, AWS S3's conditional puts, and database `INSERT ... ON CONFLICT DO NOTHING` are all examples of idempotent design replacing distributed locks.

---

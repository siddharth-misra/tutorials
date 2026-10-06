## 8: Distributed Consensus

### What Problem Does Consensus Solve?

Imagine you run a bank with three ATMs. A customer withdraws $500. Which ATM records it first? What if two ATMs both think they processed it? Without coordination, the customer might withdraw $1,000 when they only have $500.

Distributed consensus solves this: **multiple machines must agree on a single sequence of events, even when some machines crash or messages get delayed.**

More formally: keep a replicated state machine — a group of machines applying the same ordered commands so they stay identical — consistent across failures.

**Why can’t one machine just be the source of truth?** It can, until it fails. A single coordinator is a single point of failure (SPOF). Consensus distributes that coordination across multiple machines so the system survives individual failures.

**The core guarantee:** consensus ensures that if any machine commits a decision, all surviving machines will eventually commit the same decision — and no two machines commit conflicting decisions.

---

### The Intuition: Voting on a Single Truth

Think of consensus like a committee vote. If you need 3 out of 5 members to agree before passing a resolution, the committee can survive up to 2 absent members and still function. But if too many members are absent, you can’t reach quorum (the minimum number agreeing to make a decision valid) and no decision gets made.

In distributed systems:
- Each **node** is a committee member.
- Each **write** is a resolution.
- **Quorum** = majority = (N/2 + 1) nodes.
- A 3-node cluster tolerates 1 failure; a 5-node cluster tolerates 2.

**Real-world analogy:** When Kubernetes scales your app from 3 pods to 5, it writes that desired state to etcd (a distributed key-value store using the Raft consensus algorithm). If two control-plane nodes disagree about the current value, the cluster might create duplicate or missing pods. Consensus prevents that split view.

---

### The Core Concepts

#### Leader, Followers, and Terms

Raft — the dominant modern consensus algorithm, designed to be easier to understand than older approaches — organizes nodes into three roles:

- **Leader:** accepts all client writes, replicates them to followers.
- **Follower:** receives and stores log entries from the leader.
- **Candidate:** a follower attempting to become the new leader during an election.

Time is divided into **terms** — numbered epochs. Each term has at most one leader. If no leader exists (due to a crash), nodes hold an election to pick a new one.

#### The Replicated Log

Every node maintains a **log** — an ordered list of commands. The leader appends new entries to its log and sends them to followers. Once a majority stores an entry, it’s **committed** — permanently part of the state machine.

```
Log Index:  1           2              3
Entry:      [set x=1]  [set y=2]      [del x]
Committed:  ✓           ✓              ✓
```

All nodes apply committed entries in the same order, so their state machines stay identical.

#### What Does "Quorum" Mean in Practice?

| Cluster Size | Quorum Needed | Failures Tolerated |
|---|---|---|
| 3 nodes | 2 | 1 |
| 5 nodes | 3 | 2 |
| 7 nodes | 4 | 3 |

**Never run an even number of nodes** — 4 nodes tolerate only 1 failure (same as 3), but pay the cost of an extra node. Use 3 or 5.

---

### How Raft Works Step by Step

#### Steady State (Normal Operation)

1. One node is elected leader for the current term.
2. Clients send all writes to the leader.
3. Leader appends the entry to its own log, then sends `AppendEntries` RPCs to all followers.
4. Followers write the entry to their logs and acknowledge.
5. Once a majority acknowledges, the leader **commits** the entry and applies it to its state machine.
6. The leader notifies followers of the commit; followers apply it in the same term order.

**Example:** A feature flag service using etcd. You call `etcdctl put feature_dark_mode true`. That write goes to the etcd leader, which replicates it to followers. Once 2-of-3 nodes acknowledge, the write is committed and every node reflects `feature_dark_mode = true`.

#### Leader Election (Failure Recovery)

1. Followers expect a **heartbeat** from the leader every 150–300ms.
2. If a follower’s **election timeout** fires (no heartbeat received), it increments the term and transitions to **Candidate**.
3. The candidate sends `RequestVote` RPCs to peers.
4. A peer grants its vote if: the candidate’s term is newer **and** the candidate’s log is at least as up-to-date as its own.
5. If the candidate wins a majority of votes, it becomes the new leader and immediately sends heartbeats to suppress other elections.
6. If no candidate wins (split vote), everyone waits a randomized timeout and retries.

**Randomized timeouts** prevent all followers from becoming candidates simultaneously, which would cause repeated split votes and no leader emerging.

#### Safety: Why Two Leaders Can Never Commit Conflicting Entries

The key invariant: **a node votes for at most one candidate per term.** Since two candidates would each need a majority, and there’s only one majority, only one candidate can win. This prevents two leaders in the same term.

Log matching via `(prevLogIndex, prevLogTerm)` in every `AppendEntries` ensures followers reject entries that don’t follow their current log state — the leader backs up and repairs diverged followers before moving forward.

#### Snapshotting and Log Compaction

A Raft log that grows forever eventually makes restarts unbearably slow. **Snapshots** solve this: periodically serialize the entire current state machine into a file, then truncate the log up to that point.

On restart: load the snapshot, then replay only the remaining log entries.

**Example:** etcd defaults to snapshotting every 10,000 entries. An etcd cluster handling 1,000 writes/second at 1 KB each accumulates ~86 GB/day before compaction. Configure `auto-compaction-retention = 1h` and `--snapshot-count = 10000` to bound disk usage.

---

### Nuances That Matter at Scale

#### Read Linearizability and Follower Reads

A subtle but critical point: **reads from a consensus cluster are not automatically linearizable.**

In Raft, followers can serve reads from their local state — but a follower might be slightly behind the leader. Three strategies to handle this:

1. **Route all reads to the leader.** Always returns the latest committed value. Downside: creates a leader hot spot; limits read throughput.
2. **Leader lease reads.** The leader confirms it is still active (via a recent heartbeat within a bounded clock window) before serving the read locally. Avoids a full quorum round trip but requires tight clock discipline — clock skew can serve stale data.
3. **Quorum reads.** Read from a majority of nodes, return the value with the highest log index. Safe but doubles read latency.

**etcd:** Routes reads to the leader by default for linearizability. Clients can opt into `serializable` (follower) reads for lower latency at the cost of possible staleness.

**CockroachDB:** Closed timestamps let followers serve consistent reads for past timestamps without leader involvement — enabling near-linear read scale-out across replicas.

**Interview rule:** When proposing etcd or Consul, always state whether clients need linearizable reads or whether slightly stale reads are acceptable. The answer changes the architecture.

#### Paxos vs. Raft

Paxos is the original formal proof that distributed consensus is possible. Raft was designed as a more understandable alternative.

| Property | Paxos | Raft |
|---|---|---|
| **Origin** | Lamport 1989 | Ongaro & Ousterhout 2014 |
| **Understandability** | Notoriously hard to implement correctly | Designed to be understandable |
| **Leader** | Multi-Paxos adds a leader, not inherent | Leader is central |
| **Log handling** | Complex; entries can arrive out of order | Strict ordered log |
| **Used in** | Google Chubby, Spanner (internally) | etcd, CockroachDB, Consul |

For system design interviews, use Raft as your default mental model. Mention Paxos only to acknowledge it exists and that Raft is the modern, teachable alternative.

#### Multi-Region Consensus

Extending a consensus cluster across regions adds cross-AZ/region latency to every write. A 3-node cluster with one node in us-east-1, one in us-west-2, and one in eu-west-1 pays 70–200ms round-trip per write — unsuitable for low-latency coordination.

**Common pattern:** keep consensus clusters regional, use async replication for cross-region data. Only span regions when the failure scenario you’re protecting against is a full regional outage and the latency cost is acceptable.

**CockroachDB’s approach:** per-range Raft groups — each partition of a distributed SQL table has its own 3-node Raft group. This allows writes to commit within the closest region for that range, limiting cross-region latency to ranges that span regions.

---

### Real-World Systems That Use Consensus

| System | Algorithm | What It Coordinates |
|---|---|---|
| **etcd** | Raft | Kubernetes cluster state: pod counts, config maps, service endpoints |
| **Consul** | Raft | Service discovery, distributed KV, distributed locks |
| **Kafka KRaft** | Raft (built in) | Broker metadata, partition leadership (replaced ZooKeeper in Kafka 3.x) |
| **CockroachDB** | Per-range Raft | Each SQL partition’s replicated log |
| **ZooKeeper** | ZAB (similar to Raft) | Legacy Kafka, HDFS NameNode HA, HBase coordination |
| **Google Chubby** | Paxos | Distributed locking for Bigtable, GFS within Google |
| **Google Spanner** | Paxos | Global distributed SQL transactions |

**etcd in depth:** Every `kubectl apply` goes through etcd. Loss of etcd quorum halts all Kubernetes scheduling — no new pods, no config updates, no autoscaling. This is why Kubernetes documentation treats etcd as a critical data store requiring dedicated hardware and regular backups.

#### etcd vs. ZooKeeper: When to Choose Which

| Dimension | etcd | ZooKeeper |
|---|---|---|
| **Algorithm** | Raft | ZAB (Zookeeper Atomic Broadcast) |
| **Data model** | Flat key-value with hierarchical prefixes | Hierarchical ZNode tree |
| **Watch semantics** | Prefix watch; streams change events continuously | Single-fire watch; requires re-registration after each event |
| **Operational complexity** | Low; single binary, `etcdctl` CLI | Higher; JVM-based, separate ZK shell |
| **Kubernetes integration** | Native default | Not used |
| **Best for** | New systems: Kubernetes, service configs, feature flags | Legacy Apache ecosystem: pre-KRaft Kafka, HDFS |

**Decision rule:** For any new system, use etcd or Consul. ZooKeeper only when integrating with existing Apache ecosystem tools that require it.

---

### When to Use Consensus — and When Not To

#### Use Consensus When

- **Leader election** is needed for database primaries, Kafka controllers, or scheduler masters — correctness requires exactly one leader.
- **Distributed locks** where two processes must never hold the lock simultaneously (billing systems, job schedulers).
- **Configuration management** where all nodes must agree on the current config before acting — feature flags, routing rules, schema versions.
- **Coordination metadata** is small volume but must be 100% consistent.

#### Do Not Use Consensus When

- **High write throughput on user data** — consensus clusters stay small (3–5 nodes) and cannot scale horizontally. Use Raft for metadata, not for the 100,000 writes/second user data path.
- **Eventual consistency is acceptable** — Cassandra, DynamoDB, and other leaderless replication systems handle high-throughput writes without a consensus layer, at the cost of possible brief staleness.
- **Read-heavy workloads** — a consensus cluster’s leader bottleneck limits read throughput. Consider caching or follower reads with accepted staleness.

**The canonical anti-pattern:** storing application session data in etcd. Sessions are high-volume, tolerant of brief staleness, and don’t need consensus. Use Redis. Reserve etcd for low-volume, correctness-critical metadata.

---

### What Can Go Wrong?

| Failure Mode | What Happens | Recovery |
|---|---|---|
| **Leader crashes before commit** | Entry exists on leader’s log but not replicated; treated as uncommitted | New leader elected; entry discarded or re-proposed |
| **Network partition splits quorum** | Minority partition cannot commit writes; majority partition elects a new leader | Partition heals; minority syncs from majority’s log |
| **Log divergence after partial failures** | Followers have entries the new leader doesn’t | Leader uses `prevLogIndex/Term` to find divergence point, overwrites follower |
| **Slow follower lags far behind** | Full snapshot transfer required; brief loss of fault tolerance during transfer | Leader sends snapshot; follower replaces its log and state |
| **Clock skew on lease reads** | Leader thinks it’s still active; serves stale data after another leader was elected | Use quorum reads or route to leader; tight NTP discipline |
| **Election churn** | Frequent leader changes; no progress | Investigate CPU/disk/network on leader nodes; check heartbeat timeout tuning |

---

### API Design

```grpc
service Consensus {
  rpc RequestVote(RequestVoteRequest) returns (RequestVoteResponse);
  rpc AppendEntries(AppendEntriesRequest) returns (AppendEntriesResponse);
  rpc Propose(Proposal) returns (ProposalResponse);
  rpc GetLeader(LeaderRequest) returns (LeaderResponse);
}
```

- `RequestVote` — used during elections; candidates solicit votes from peers.
- `AppendEntries` — used by the leader to replicate log entries and send heartbeats.
- `Propose` — client-facing; submit a new command to be committed.
- `GetLeader` — allows clients to discover the current leader for redirect.

---

### Cost Model

Consensus clusters are intentionally small (3–5 nodes), so raw hardware cost is modest. The real cost is **latency** and **operational discipline**.

| Setup | Monthly Cost (AWS estimate) | Notes |
|---|---|---|
| etcd cluster (3 × m5.large) | ~$300 | Kubernetes control plane; tolerates 1 failure |
| etcd cluster (5 × m5.xlarge) | ~$800 | Tolerates 2 failures; higher-availability clusters |
| Consul cluster (3 × t3.medium) | ~$100 | Service discovery + KV; lightweight |
| ZooKeeper (3 × m5.large) | ~$300 | Legacy Kafka/Hadoop; JVM adds memory overhead |
| CockroachDB (3 × c5.2xlarge) | ~$1,500 | Full distributed SQL with per-range Raft |

**Latency cost per write:** every quorum commit adds one network round trip — ~1–5 ms within an AZ, ~10–30 ms cross-AZ. Consensus is cheap for low-volume coordination; prohibitively expensive for high-frequency data writes.

---

### Operations and Maintenance

Consensus clusters are critical infrastructure. Quorum loss halts all dependent systems — Kubernetes scheduling stops the moment etcd loses quorum. Treat these clusters with the same rigor as primary databases.

**Key practices:**

- **Monitor quorum health continuously.** Alert if any node leaves the quorum or if leader elections happen more than once per hour. Frequent elections signal network instability or CPU starvation.
- **Watch follower replication lag.** A follower too far behind needs a full snapshot transfer from the leader — a multi-minute operation that temporarily reduces fault tolerance.
- **Set compaction policies.** Unbounded log growth causes disk exhaustion. Configure `auto-compaction-retention = 1h` and alert at 70% disk usage.
- **Back up etcd regularly.** `etcdctl snapshot save` produces a single-file backup. Run hourly, store in S3, test restore quarterly — never perform a first restore during an incident.
- **Use dedicated hardware with fast SSDs.** Consensus performance depends on low-latency WAL writes. Noisy neighbors cause heartbeat timeouts and spurious elections.
- **Roll changes one node at a time.** When replacing nodes during upgrades, remove one node, confirm quorum health, then add the replacement. Never replace multiple nodes simultaneously.

---

### Evolution Over Time

| Phase | Focus |
|---|---|
| **Year 1 (small system)** | Single-region 3-node cluster; leader election and log replication for a single coordination concern (e.g., database leader election) |
| **Year 2 (growing system)** | Add snapshotting and compaction; faster failover automation; separate consensus clusters per concern (one for DB, one for job scheduler) |
| **Year 3 (large system)** | Multi-region coordination with per-region clusters and async cross-region replication; automated recovery runbooks; real-time quorum health dashboards |

---

### Interview Trade-Off Questions and Answers

**Q1: When is a 3-node quorum enough, and when does the extra fault tolerance of 5 nodes justify the added latency?**

**A:** A 3-node cluster tolerates 1 simultaneous failure. For most production systems, this is sufficient — the probability of 2 nodes failing at the same time before the first is repaired is very low. Use 5 nodes when: (a) you operate across 3 availability zones and want to survive a full AZ loss without reducing to a 1-node quorum, (b) you have strict SLAs and the system is critical enough that the latency tradeoff (one extra hop) is worth the insurance. The extra latency is minimal within a region (~1ms) but may matter in cross-AZ/cross-region deployments.

**Q2: When do you really need consensus instead of a simpler primary-replica setup with manual failover?**

**A:** Use a simple primary-replica setup when: human-in-the-loop failover is acceptable (seconds to minutes of downtime), write volume is high enough that consensus latency would be a bottleneck, or the system is internal-only and brief inconsistency is tolerable. Use consensus when: automated failover must happen in seconds without human intervention, split-brain would cause data corruption or duplicate financial transactions, or the system coordinates other systems (a coordination plane must itself be highly available). In practice, consensus is for the *coordination metadata layer* (who is leader, what is the current config), not for bulk user data.

**Q3: Is multi-region consensus worth the write-latency cost for your workload, or should coordination stay regional?**

**A:** Multi-region consensus pays 70–200ms per write for cross-region round trips. That’s acceptable for configuration changes that happen rarely but unacceptable for any latency-sensitive write path. The standard pattern is: keep consensus clusters regional, use async replication between regions for data, and only use multi-region consensus when the failure scenario is a full regional outage. For most systems, regional consensus with cross-region async replication and a runbook for region failover is the right balance. CockroachDB’s per-range Raft approach is the exception — it places Raft groups near their data, limiting cross-region hops to ranges that genuinely span regions.

---

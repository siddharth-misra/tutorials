## 6: Database Internals

### Why Storage Engines Matter

When you pick a database, you are really picking a storage engine — the subsystem that decides how bytes land on disk, how they are read back, and what happens during a crash. Every database you have used (Postgres, MySQL, Cassandra, Redis) is built on a storage engine, and most performance, cost, and reliability trade-offs trace back to that choice.

The core tension: reading, writing, and crash recovery all want different things from on-disk layout. No engine delivers all three at peak performance simultaneously. Understanding the trade-offs lets you pick the right tool and explain your choice in any system design conversation.

---

### Part 1 — Foundations

#### How Data Reaches Disk: The Write Path

Before diving into engine types, understand the universal write path every serious database follows:

```
Client write request
        │
        ▼
   1. Write to WAL (Write-Ahead Log)   ← durability checkpoint
        │
        ▼
   2. Write to in-memory buffer        ← fast acknowledgment path
        │
        ▼
   3. Flush buffer to main data files  ← lazy, batched, asynchronous
```

**WAL (Write-Ahead Log)** is the durability backbone. Before any data page is modified, a log record is appended to a sequential file on disk. Sequential writes are fast. If the server crashes between steps 2 and 3, the WAL replays and rebuilds the lost state. Data pages are updated lazily in the background.

**Real-world example — why WAL matters for payments:** A payment service calls `INSERT INTO charges ...`. The database acknowledges "committed" only after the WAL record hits durable storage. If the server dies at that exact instant, the WAL replay on restart re-applies the insert. Without WAL, the charge would silently disappear and the customer would be charged twice or not at all on retry.

---

#### The Two Engine Families: B-Tree vs. LSM Tree

Almost every relational and key-value engine belongs to one of two families.

**Think of it as two ways to organize a library:**
- A **B-tree** is a well-organized bookshelf: books are always in alphabetical order. Finding a title or a range is instant because the shelf is always sorted. Adding a new book means finding the exact slot and shifting neighbors — more work per insert.
- An **LSM tree** is an inbox: new books are tossed in a pile first, and a night-shift worker sorts them later. Inserting is instant. Reading requires checking the pile, a few sorted sub-stacks, and the final shelf — more work per read.

##### B-Tree Engines (Postgres, MySQL InnoDB)

Data is stored in a balanced tree where every leaf node is a fixed-size page (~8 KB in Postgres). The tree stays sorted by key at all times.

How a write works:
1. Find the correct leaf page (tree traversal).
2. Lock that page.
3. Insert or update the record in-place.
4. Write the change to WAL first (crash safety).
5. Mark the page dirty — it will be flushed to disk later.

How a read works:
1. Traverse the tree to the correct leaf page.
2. Return the record directly.

**Strengths:** Fast point lookups and range scans. Predictable read latency. ACID by default.
**Weaknesses:** Random writes scatter across the tree, causing random I/O. High write amplification on NVMe-constrained systems.

##### LSM Tree Engines (RocksDB, Cassandra, ScyllaDB, LevelDB)

Writes always go to memory first, never directly to sorted disk structures.

How a write works:
1. Append to WAL (durability).
2. Write to in-memory **memtable** (a sorted structure, typically a skip list or red-black tree).
3. When the memtable fills, flush it as an immutable **SSTable** (Sorted String Table) to disk.
4. Background **compaction** merges overlapping SSTables into fewer, larger, sorted files over time.

How a read works:
1. Check memtable (fastest).
2. Check each level of SSTables from newest to oldest.
3. Use **Bloom filters** (a probabilistic structure that says "this key is definitely not here" ~99% of the time) to skip most SSTable checks.

**Strengths:** All writes are sequential (memtable → SSTable flush). Extremely high write throughput. Works well on spinning disks and SSDs.
**Weaknesses:** Read amplification (multiple levels to check). Background compaction competes with foreground I/O. Space amplification (deleted/overwritten records persist until compaction).

##### Head-to-Head Comparison

| Dimension | B-Tree | LSM Tree |
|---|---|---|
| Write throughput | Moderate (~50K/s single node) | High (>500K/s single node) |
| Read latency | Low, predictable | Higher, depends on compaction state |
| Range scans | Excellent | Moderate (SSTables are sorted within a level) |
| Space usage | Compact but bloats without VACUUM | 1.5–3× amplification during compaction |
| Crash recovery | WAL replay | WAL + memtable reconstruct |
| Best fit | OLTP, ACID, mixed read/write | Write-heavy, append, time-series |
| Examples | Postgres, MySQL InnoDB | RocksDB, Cassandra, ScyllaDB |

---

### Part 2 — Concurrency and Transactions

#### MVCC: How Reads and Writes Coexist

Most production databases use **MVCC (Multi-Version Concurrency Control)** to avoid the classic problem where a read blocks a write or vice versa.

The key idea: instead of overwriting a row in place, a write creates a *new version* of the row. Old versions persist until they are no longer needed by any active transaction. Each reader sees the version that was current at the start of its snapshot — other concurrent writes are invisible to it.

**Real-world analogy:** Think of Git branches. A reader opens a branch at a specific commit hash. Other commits can happen on `main` without changing what the reader sees. The reader's view is frozen in time.

**Real-world example — analytics vs. checkout:** An e-commerce site runs a 5-minute revenue report at the same time that checkout traffic is inserting thousands of orders. With MVCC, the report reads a consistent snapshot from when it started. Checkout inserts keep happening in parallel. Neither blocks the other. Without MVCC, the report would have to lock rows it reads, which would block every checkout touching those rows.

The cost of MVCC: old row versions accumulate. Postgres calls the cleanup process **VACUUM**. Without regular vacuuming, table bloat grows and query performance degrades.

---

#### Transaction Isolation Levels

MVCC enables a spectrum of isolation guarantees. Stronger isolation means fewer anomalies but more conflict detection overhead.

| Level | Dirty Reads | Non-Repeatable Reads | Phantom Reads | When to Use |
|---|---|---|---|---|
| **READ UNCOMMITTED** | Yes | Yes | Yes | Almost never. Only in analytics tolerating stale data. |
| **READ COMMITTED** | No | Yes | Yes | Default in Postgres and Oracle. Good for most OLTP. |
| **REPEATABLE READ** | No | No | No* | Multi-read transactions needing a stable snapshot (reports, audits). |
| **SERIALIZABLE** | No | No | No | Financial operations, inventory, seat reservations — anything that must not double-book. |

*Postgres's MVCC prevents phantoms at REPEATABLE READ too, which is stronger than the SQL standard requires.

**Anomaly definitions:**
- **Dirty read:** Reading a row that another transaction has modified but not yet committed. That other transaction might roll back — so you read data that never officially existed.
- **Non-repeatable read:** Reading the same row twice in one transaction and getting different values because another transaction committed between the two reads.
- **Phantom read:** Re-running a range query within one transaction and seeing new rows appear because another transaction inserted them.

**Real-world example — double-spend prevention:** A fintech application debits a user's balance. The logic reads current balance, checks if it's sufficient, then writes the new balance. Two concurrent requests could both read "balance: $100", both decide the debit is valid, and both subtract $50 — leaving the balance at $50 instead of $0. SERIALIZABLE isolation detects this conflict and aborts one of the two transactions. This is exactly how Stripe and similar payment processors prevent double-spend.

**Practical guidance:**
- Use **READ COMMITTED** by default for OLTP (web apps, APIs, microservices).
- Use **REPEATABLE READ** when a transaction does several reads that must see a consistent state (report generation, audit logs).
- Use **SERIALIZABLE** when correctness requires that no two concurrent transactions both succeed doing the same logical operation on the same data. Accept ~10–20% throughput overhead.

---

### Part 3 — Indexing

#### What an Index Is and Why It Costs

An index is a separate data structure (typically a B-tree itself) that the database maintains alongside the table. Its sole purpose is to make a specific query pattern faster by avoiding a full table scan.

**The trade-off is not free:** Every index you add must be updated on every INSERT, UPDATE, and DELETE to that table. A table with 10 indexes means every write touches 11 structures (the table + 10 indexes). Index storage typically adds 30–50% of the indexed column size.

**Mental model:** An index is a back-of-the-book index. It makes finding a topic fast. But every time you revise the book, you must also update the index. A book with 20 indexes takes 20× longer to update its index section per revision.

#### Index Types

| Index Type | How It Works | When to Use | Real-World Example |
|---|---|---|---|
| **Primary (clustered)** | Physical row order follows the index key. One per table. | Always — it's your primary key. | `id` on an `orders` table. |
| **Secondary (non-clustered)** | Separate structure pointing to heap row location. | Any alternate lookup path. | Index on `email` for `WHERE email = ?` login queries. |
| **Composite** | Index on multiple columns in a defined order. | Queries filtering and/or sorting on multiple columns together. | `(user_id, created_at)` for "all orders for user X, newest first." |
| **Covering** | Index includes all columns the query needs; no heap lookup required. | Read-hot queries where every millisecond counts. | Include `total_amount` in the composite index to serve the query entirely from the index. |
| **Partial** | Indexes only rows matching a WHERE condition. | When most rows are irrelevant to the indexed query. | Index on `status = 'pending'` for a job queue — only a small fraction of rows are ever pending. |
| **Expression / Functional** | Indexes the output of an expression, not a raw column. | Case-insensitive lookups, date truncation. | `LOWER(email)` enables `WHERE LOWER(email) = 'foo@bar.com'` without a full scan. |
| **Full-text (GIN/GiST)** | Inverted index mapping each word to the rows containing it. | Text search without a dedicated search engine. | Product catalog search by keyword. |
| **BRIN (Block Range)** | Stores min/max values per disk block range. Very small. | Append-only tables naturally ordered by time. | `created_at` on a log table — new rows always have larger timestamps. |

#### When to Add an Index (and When Not To)

Add an index when:
- `EXPLAIN ANALYZE` on production data shows a sequential scan with high actual rows.
- The query runs frequently (high QPS) and the table is large (>100K rows).
- You have confirmed in a staging environment that the index is actually used.

Do not add an index when:
- The table is small — the planner will prefer a sequential scan anyway.
- The query is infrequent — the maintenance cost exceeds the read benefit.
- The column has very low cardinality (e.g., a boolean `is_deleted`) — an index on it returns half the table and is useless.

**Index bloat:** Postgres does not immediately reclaim space from deleted index entries. On high-update tables, run `VACUUM ANALYZE` regularly. Monitor `pg_stat_user_indexes` for index size vs. table size. Rebuild severely bloated indexes with `REINDEX CONCURRENTLY` (online rebuild, no lock).

---

### Part 4 — Scaling Data

#### Table Partitioning (Single Database)

When a table grows to hundreds of millions of rows, even a good index starts to slow down — the index itself becomes large. Partitioning splits one logical table into multiple physical child tables while keeping them invisible to the application query.

The query planner eliminates partitions irrelevant to a query's WHERE clause (**partition pruning**), touching only the relevant child table.

| Partition Strategy | How It Splits | Best For |
|---|---|---|
| **Range** | By a column range (usually time: `created_at < '2026-01-01'`). | Time-series, event logs, audit tables. Dropping old data = dropping a partition (instant vs. slow DELETE). |
| **List** | By discrete values (`region IN ('us-east', 'us-west')`). | Multi-tenant data, geographic isolation. |
| **Hash** | By `hash(key) % N`. | Even data distribution with no natural range or list boundary. |

**Real-world example — Uber Eats order history:** An orders table accumulates billions of rows over years. Partitioned by month, each partition holds ~1 month of data. Queries for recent orders only scan one or two partitions. Dropping data older than 2 years = dropping old partition files — an instant operation versus a DELETE that would take hours and generate massive WAL.

#### Horizontal Sharding (Multiple Databases)

When a single database machine is the bottleneck (CPU, memory, or disk I/O), sharding splits data across multiple independent database instances. Each instance owns a subset of the data, determined by a **shard key**.

| Strategy | Pros | Cons |
|---|---|---|
| **Range sharding** | Simple; sequential scans stay local to one shard. | Hot shards if writes concentrate on recent ranges (e.g., newest user IDs). |
| **Hash sharding** | Even distribution; no hot spots. | Loses range locality; cross-shard range queries require scatter-gather. |
| **Directory-based** | Maximum flexibility; shard assignment is a lookup table you control. | Lookup adds a network hop; the directory itself becomes a critical bottleneck. |

**Cross-shard joins** are expensive: the application must query multiple shards and merge results in memory. For this reason, the shard key should be the entity that most queries filter on (e.g., `user_id`, `shop_id`, `tenant_id`).

**Real-world example — Shopify:** Shopify shards MySQL by `shop_id`. Every query from a merchant's store is scoped to that shop's data, which all lives on one shard. This means zero cross-shard joins for the common case. New capacity is added by migrating some shops to a new shard — a copy-and-cut-over operation that can be staged without downtime. Shopify can scale to millions of shops by adding more shards, not by upgrading a single giant server.

---

### Part 5 — Operational Concerns

#### Connection Pooling

A Postgres connection is not cheap: it spawns a backend process and allocates ~5–10 MB of memory. A web service with 10,000 concurrent application pods each holding one direct connection would exhaust DB memory before saturating CPU.

**PgBouncer** is a lightweight proxy that sits between application and database. It multiplexes thousands of application-facing connections onto a small pool of real server connections.

| PgBouncer Mode | Server Connection Released | Trade-off |
|---|---|---|
| **Session mode** | When application disconnects | No multiplexing benefit; useful only for hard connection cap. |
| **Transaction mode** | After each transaction commits | Most efficient. Breaks `LISTEN`/`NOTIFY` and advisory locks. |
| **Statement mode** | After each statement | Rarely used. Breaks multi-statement transactions. |

**Sizing rule:** Server-side connections = `(DB CPU cores × 2) + effective_spindle_count`. In practice, 50–100 server connections is the ceiling for most RDS/Aurora instances. PgBouncer in transaction mode then safely handles thousands of app-side connections.

**Real-world example:** A startup deploys 200 app pods, each with a connection pool of 10. That is 2,000 attempted DB connections. A `db.r5.large` with 2 vCPUs should hold ~10 server connections comfortably. PgBouncer absorbs the 2,000 app connections and funnels them through 10 server connections — the database never sees the pressure.

---

#### Capacity Estimation

| Workload Type | Back-of-Envelope |
|---|---|
| 50K writes/sec × 1 KB rows | ~50 MB/s raw ingest |
| WAL overhead | +1× write bandwidth for durability (plan ~100 MB/s total) |
| LSM compaction overhead | 1.5–3× logical data size on disk |
| Per-index cost | +1 B-tree write per index per row written |
| Connection overhead (Postgres) | ~5–10 MB per server connection |

---

#### Failure Modes to Know

| Failure | Cause | How to Detect | Mitigation |
|---|---|---|---|
| WAL disk full | High write rate, no archiving | Disk utilization alert > 80% | Archive WAL to object storage; set `max_wal_size` |
| Compaction backlog (LSM) | Write throughput > compaction capacity | Compaction queue depth metric | Add nodes; throttle writes temporarily |
| Table/index bloat (B-tree) | Deleted rows not reclaimed | `n_dead_tup` in `pg_stat_user_tables` | Run `VACUUM ANALYZE`; tune autovacuum |
| Long-running transactions | Forgotten `BEGIN`, stuck connections | `pg_stat_activity` age column | Set `idle_in_transaction_session_timeout = 30s` |
| Replication lag | Replica can't keep up with primary write rate | `now() - pg_last_xact_replay_timestamp()` | Alert at >30s; route stale-tolerant reads to replicas only |

---

### Part 6 — Choosing the Right Engine

#### Decision Flow

```
What dominates your workload?
├── High write throughput (>50K writes/sec), no complex joins
│   └── LSM engine: RocksDB, Cassandra, ScyllaDB
├── ACID transactions, complex queries, moderate writes
│   └── B-tree: Postgres, MySQL InnoDB
├── Sub-millisecond reads, data fits in RAM, durability secondary
│   └── In-memory: Redis, Memcached
└── Very large dataset, mostly append, analytical scans
    └── Columnar: Parquet/S3, BigQuery, Redshift, ClickHouse
```

#### Cost Reference (AWS, approximate monthly)

| Option | Monthly Cost | Good For |
|---|---|---|
| Postgres RDS `db.r5.large`, Multi-AZ | ~$420 | Most startups up to ~10M users |
| Aurora Serverless v2 (0.5–128 ACUs) | ~$100–$5,000 | Variable OLTP; auto-scales with traffic |
| DynamoDB on-demand (50K writes/sec) | ~$2,600 | Serverless key-value, no ops overhead |
| Cassandra on EC2 (6 × `r5.2xlarge`) | ~$3,600 | >500K writes/sec, eventual consistency |
| RocksDB on EC2 (6 × `i3.2xlarge`, NVMe) | ~$6,000 | Write-optimized, self-managed ops |

**Rule of thumb:** A single well-tuned Postgres primary with one read replica handles most startup workloads up to ~10M users at $500–$1,000/month. Sharding or moving to Cassandra is a meaningful operational investment — make it only when single-node Postgres is a proven bottleneck.

**Hidden LSM cost:** Storage amplification means physical disk usage is 1.5–3× logical data size. Budget for it.

---

### Part 7 — Operations and Evolution

#### Database Maintenance Checklist

A neglected database accumulates bloat, stale indexes, and slow queries until it fails in production at the worst possible time. These practices prevent that:

- **Schema migrations** — use Flyway, Liquibase, or Atlas. All changes are version-controlled and run through staging first. For zero-downtime changes, use the expand-contract pattern (Chapter 4).
- **Slow query monitoring** — enable `pg_stat_statements`. Alert on queries exceeding 200–500 ms. Review the top 5 offenders weekly.
- **Index validation** — before adding an index, run `EXPLAIN (ANALYZE, BUFFERS)` on staging with production-representative row counts. Confirm the planner actually uses it.
- **Autovacuum tuning** — monitor `pg_stat_user_tables.n_dead_tup`. Trigger manual `VACUUM ANALYZE` when dead tuples exceed 10% of live rows on high-update tables.
- **Backup restore drills** — restore a production backup to a staging environment once per quarter. Verify data integrity. An undrilled backup is not a backup.
- **Replication lag alert** — query `now() - pg_last_xact_replay_timestamp()` on each read replica. Alert at >30 seconds.
- **Compaction queue (LSM)** — watch compaction queue depth. A growing backlog means write throughput has outpaced compaction; add nodes or reduce write rate.

#### Growth Trajectory

| Stage | Database Architecture |
|---|---|
| **0–1M users** | Single Postgres primary. Focus on schema design and indexing. |
| **1–10M users** | Add read replicas. Route read-heavy queries (analytics, reports) to replicas. Enable PgBouncer. |
| **10–100M users** | Partition large tables by time or tenant. Consider Aurora or a managed scaling tier. Introduce a caching layer (Chapter 11). |
| **>100M users** | Evaluate sharding by primary entity (user_id, shop_id). Consider specialized engines per workload: Cassandra for event streams, Postgres for transactions, Redis for sessions. |

---

### Interview Questions and Answers

**Q1: When is a B-tree engine the right default, and when do write-heavy workloads justify switching to an LSM-based system?**

**A:** B-tree (Postgres, MySQL) is the right default when the workload is mixed — reads and writes at moderate volume, with range queries and ACID transactions. The predictable read latency and strong transaction semantics make it the safe choice for orders, payments, user accounts, and most OLTP systems. The switch to LSM (RocksDB, Cassandra) is justified when write throughput consistently exceeds what a well-tuned single-node B-tree can absorb (~50–100K writes/sec), and the workload doesn't require complex joins or strong ACID. Examples: time-series telemetry, IoT sensor ingestion, clickstream data, append-only audit logs. The decision is not just about throughput — LSM systems introduce operational complexity (compaction tuning, read amplification, no native joins) that must be worth the trade.

**Q2: How many secondary indexes are too many, and how do you decide whether faster reads are worth slower writes?**

**A:** There is no fixed number, but the cost is linear: each index adds roughly one B-tree write per row written to the table. A table with 8 indexes pays 8× the write overhead. The threshold is workload-dependent: a read-heavy product catalog can afford more indexes than a high-insert event log. The decision process is: (1) measure the slow query in production with `EXPLAIN ANALYZE`; (2) confirm the table is large enough that a full scan is actually slow; (3) check whether an existing index can be extended (covering index) before adding a new one; (4) add the index on a staging clone and benchmark write throughput before and after. A rule of thumb: 3–5 indexes per table is common; more than 8–10 on a write-heavy table is a signal to audit.

**Q3: When should you keep strong transactional semantics in one database versus moving part of the workload to logs, caches, or separate stores?**

**A:** Keep transactions in one database when correctness depends on atomicity across multiple entities — e.g., deducting inventory and creating an order must either both succeed or both fail. Move to logs or caches when: (a) the workload is append-only and eventual consistency is acceptable (event logs, audit trails, analytics); (b) the data is read-heavy and can tolerate staleness (session state, feature flags, search indexes); or (c) the volume far exceeds what the primary can handle and the consumer can reconcile late updates. The risk of splitting is that cross-store consistency is now the application's responsibility — you lose the database's ACID guarantee. A common pattern: keep the source-of-truth write in Postgres, publish a domain event to Kafka, and let downstream stores (Elasticsearch, Redis, a reporting DB) consume it asynchronously. This gives you both strong transactional semantics for the write path and scalable read paths without coupling them.

---

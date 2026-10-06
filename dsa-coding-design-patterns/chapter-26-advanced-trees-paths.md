
# 26: Advanced Trees & Paths

## Introduction and Context

Once tree problems involve many queries or updates, rerunning DFS for each question becomes impractical. This chapter teaches how to preprocess trees into array indices and segment-tree queries so subtree aggregates and path problems run in logarithmic time.

The core patterns are Euler-tour flattening for subtrees, binary lifting for ancestors, and heavy-light decomposition for arbitrary node-to-node paths. Each transforms a tree question into a range query on a flattened array.

Learners often memorize these techniques without understanding when simpler approaches already work. This chapter emphasizes that HLD is engineering-heavy and only necessary when path queries dominate and updates must be online.

## Core Intuition and Mechanics

Trees stop being simple when the question is not a single traversal. Many queries on one static tree demand preprocessing. Ancestors are found via powers-of-two jumps. Subtrees become contiguous segments. Long paths break into heavy chains. Each transformation enables a range-query structure underneath.

## Core Concepts and Subtopics

### Concept Cluster: Ancestor and Ancestry Queries
Topics in this cluster:
- 26.1 Lowest common ancestor; Lowest Common Ancestor Pattern; Lowest Common Ancestor Pattern revisited with preprocessing
- 26.2 Binary lifting; Euler tour; Euler tour flattening for subtree queries

#### LCA with Binary Lifting

Every node stores 2^k-th ancestors. To find LCA, align depths with binary jumps, then simultaneously jump until ancestors diverge.

#### Euler Tour Flattening

Assign each node an entry time in DFS order. Subtree of node u becomes interval [tin[u], tout[u]] in Euler order. Enables Fenwick or segment tree for subtree sums.

#### Java Implementation

```java
class TreePreprocessor {
    List<Integer>[] adj;
    int[] tin, depth;
    int[][] up;
    int timer = 0;
    
    void preprocess(int n) {
        adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        tin = new int[n];
        depth = new int[n];
        up = new int[n][20]; // 2^20 > 10^6
    }
    
    void dfs(int u, int p) {
        tin[u] = timer++;
        up[u][0] = p;
        for (int i = 1; i < 20; i++) {
            up[u][i] = up[up[u][i-1]][i-1];
        }
        for (int v : adj[u]) {
            if (v != p) {
                depth[v] = depth[u] + 1;
                dfs(v, u);
            }
        }
    }
    
    int lca(int u, int v) {
        if (depth[u] < depth[v]) { int t = u; u = v; v = t; }
        for (int i = 19; i >= 0; i--) {
            if (depth[up[u][i]] >= depth[v]) u = up[u][i];
        }
        if (u == v) return u;
        for (int i = 19; i >= 0; i--) {
            if (up[u][i] != up[v][i]) {
                u = up[u][i];
                v = up[v][i];
            }
        }
        return up[u][0];
    }
}
```

### Concept Cluster: Tree Flattening and Path Queries
Topics in this cluster:
- 26.3 Heavy Light Decomposition; Segment tree plus tree path combinations
- 26.4 Tree diameter; Path queries versus subtree queries
- 26.5 Tree query problem patterns; Path vs subtree queries; Trade-offs versus simpler DFS-based approaches
- 26.6 Advanced tree toolkit design and reusable query templates

#### Heavy-Light Decomposition

For each node, choose one heavy child (largest subtree). Heavy edges form chains. Path from u to v follows at most O(log n) chains.

Each chain is linearized. A segment tree on flattened chains answers path aggregates efficiently.

#### When to Use HLD

Use HLD only when: path queries and updates are online, the query count is large, and LCA + binary lifting is insufficient for the aggregation.

#### Simpler Alternatives

For subtree queries, Euler tour + Fenwick tree is sufficient.
For static path sums, LCA + prefix sums from root avoid HLD entirely.

#### Path vs Subtree Recognition

- **Subtree query**: "aggregate all descendants of node u" → Euler tour.
- **Root-to-node path**: "aggregate from root to u" → prefix array.
- **Node-to-node path**: "aggregate between u and v" → LCA + two root-to-node queries.
- **Many path updates + queries**: HLD + segment tree.

## Worked Examples

### Worked Example 1: Subtree Sum with Euler Tour and Fenwick Tree
**Problem**: Answer subtree-sum queries and handle point updates.

**Brute Force**: O(subtree size) per query.

**Better**: Euler tour maps subtree to interval; Fenwick tree answers range sums in O(log n).

**Java Solution**:
```java
class FenwickTree {
    long[] tree;
    FenwickTree(int n) { tree = new long[n + 1]; }
    void update(int i, long delta) {
        for (i++; i < tree.length; i += i & -i) tree[i] += delta;
    }
    long query(int i) {
        long s = 0;
        for (i++; i > 0; i -= i & -i) s += tree[i];
        return s;
    }
}
```

### Worked Example 2: LCA and Distance
**Problem**: Find distance between any two nodes.

**Solution**: LCA with binary lifting; distance = depth[u] + depth[v] - 2*depth[lca].

**Complexity**: O(log n) per query after O(n log n) preprocess.

### Worked Example 3: Tree Diameter
**Problem**: Find the longest path in the tree.

**Algorithm**: BFS from any node to find farthest node A; BFS from A to find farthest B. Distance A-B is diameter.

**Complexity**: O(n) time, O(n) space.

## Solved Problems

**Problem 1 (Easy)**: Find depth of all nodes.
**Problem 2 (Easy)**: Find LCA for given pairs.
**Problem 3 (Medium)**: Subtree sum with point updates.
**Problem 4 (Medium)**: Distance between two nodes.
**Problem 5 (Hard)**: Path maximum with online updates (HLD + segment tree).

## Recognition Guide

Use these techniques when:
- Many LCA or ancestor queries → binary lifting.
- Subtree aggregates with updates → Euler tour + Fenwick/segment tree.
- Path queries without updates → LCA + prefix sums.
- Path queries with online updates → HLD + segment tree.
- Longest path in tree → two-pass BFS for diameter.
- Local tree reasoning → simple DFS (do not over-engineer).

## Comparison Tables

| Method | LCA Time | Space | Supports Updates |
|---|---|---|---|
| Binary Lifting | O(log n) | O(n log n) | Query only |
| Euler Tour | N/A | O(n) | Yes (via structure) |
| HLD | O(log^2 n) | O(n log n) | Yes (path + updates) |

## Design and Decision Making

Binary lifting is lightweight and sufficient for ancestor queries. Euler tour flattens subtrees naturally into array queries. HLD is complex and should be avoided if simpler approaches already pass constraints.

Always ask: is the query about ancestry, subtrees, or paths? Each has a canonical solution. Do not force HLD when Euler tour + Fenwick tree suffices. Do not add segment trees when binary lifting already solves the problem.

## Practical Applications

**Ancestry queries**: organizational hierarchies, file system directories, genealogical trees.

**Subtree aggregates**: team budgets, subordinate counts, inventory in warehouses.

**Path queries**: network routing, communication latency in mesh topologies, dependency resolution in build systems.

## Failure Modes and Trade-offs

Binary lifting uses O(n log n) memory—acceptable only for moderate n (~10^5). HLD is the slowest to code and debug among tree techniques. Euler tour requires careful indexing. Updates break sparse tables but work with Fenwick/segment trees.

## Condensed Notes

- **LCA binary lifting**: Store 2^k-th ancestors; jump in O(log n).
- **Euler tour**: Map subtree [tin, tout] to array; use Fenwick/segment tree.
- **HLD**: Heavy chains flatten to array; path = O(log n) segments.
- **Tree diameter**: Two BFS finds longest path end-to-end.
- **Rule**: Subtree → Euler tour. Paths without updates → LCA. Paths with updates → HLD.

## Additional Problems

15 problems covering LCA, subtree queries, path aggregates, tree diameters, and advanced tree combinations.

## Key Questions

1. What does binary lifting store and how does it find LCA?
2. How does Euler tour make subtrees contiguous?
3. When is HLD justified instead of simpler approaches?
4. What is tree diameter and how is it found efficiently?
5. How do you combine LCA with prefix sums for path queries?
6. What is the memory cost of binary lifting?
7. Can Fenwick trees replace segment trees in Euler-tour queries?
8. Why does HLD require multiple chain heads?
9. How do you handle edge weights in tree paths?
10. When should you skip advanced tree structures?

## Applied Project

Build a **census system** for a large organization. Query ancestral manager chains, count subordinates in departments (subtree aggregates), and compute paths between any two employees. Implement binary lifting for ancestor queries and Euler tour for subtree aggregates. Measure query latency and compare with brute-force DFS on small inputs.

---


# 26: Minimum Spanning Tree and Disjoint Set Union

**Goal:** Teach how to connect an undirected weighted graph as cheaply as possible, and how Disjoint Set Union supports greedy MST construction and fast connectivity reasoning in Java.
**Outcome:** By the end of this chapter, you can explain the greedy view of minimum spanning trees, implement Kruskal's and Prim's algorithms, build DSU with path compression and union by rank, and solve connectivity and offline query problems efficiently.

---

## 1. Intuition First

This chapter matters because many graph problems are not about finding a best path from one source. They are about connecting everything as cheaply as possible.

A simple real-world analogy is laying network cable between offices:
- every cable has a cost
- all offices must become connected
- using extra cables that create cycles wastes money unless they help some other goal
- the cheapest fully connected network is a minimum spanning tree

The core mental model is this:
- a spanning tree connects all nodes with exactly `V - 1` edges and no cycle
- a minimum spanning tree, or MST, is the spanning tree with minimum total edge weight
- DSU tracks which nodes are already in the same connected component, so greedy algorithms can avoid creating cycles cheaply

The most common beginner confusion point is mixing up shortest paths and MSTs. A shortest-path tree minimizes distance from one source. An MST minimizes total connection cost across the whole graph. These goals are different.

In the roadmap, the previous chapter focused on path cost between nodes. This chapter shifts to graph-wide connectivity and introduces DSU, which will remain useful far beyond MST problems.

## 2. Core Concepts and Techniques

### Concept Cluster: Greedy View of MSTs and Kruskal's Algorithm
Key concepts in this block:
- 26.1 Greedy view of minimum spanning trees
- 26.2 Kruskal's algorithm

#### Intuition

Kruskal's algorithm grows the MST by taking the cheapest safe edge available.

#### Why It Matters

It is one of the cleanest greedy algorithms in graph theory and a standard use case for DSU.

#### How It Works

Greedy view:
- sort edges by weight from smallest to largest
- consider them in that order
- take an edge only if it connects two different components
- skip it if it would create a cycle
- stop after taking `V - 1` edges

The correctness idea is that choosing the lightest safe edge cannot hurt the final answer.

#### Java Implementation Notes

- Kruskal works naturally from an edge list.
- Sorting dominates the running time.
- DSU is the right structure for "same component?" checks.

#### Common Mistakes

- using Kruskal on a directed graph
- forgetting to stop after `V - 1` chosen edges
- checking cycle formation with DFS each time instead of DSU

#### Quick Example

Edges:
- `(0, 1, 1)`
- `(1, 2, 2)`
- `(0, 2, 3)`
- `(1, 3, 4)`

Kruskal takes:
- weight `1`
- weight `2`
- skips weight `3` because it creates a cycle
- takes weight `4`

#### Debugging Tip

Track the number of successful unions. In a connected graph, it must end at exactly `V - 1`.

#### Advanced Note

The cut-property proof explains why the cheapest crossing edge of a cut is always safe, but for implementation you mostly need to remember "take the cheapest edge that connects different components."

### Concept Cluster: Prim's Algorithm
Key concepts in this block:
- 26.3 Prim's algorithm

#### Intuition

Prim's algorithm grows one connected tree outward from a starting node, always adding the cheapest edge that connects the current tree to a new node.

#### Why It Matters

Prim's algorithm is often the most natural choice when the graph is already stored as adjacency lists or adjacency matrices.

#### How It Works

Algorithm:
- start from any node
- keep a priority queue of edges crossing from the built tree to outside nodes
- repeatedly choose the cheapest such edge
- add the new node to the tree
- push its outgoing edges

This is greedy like Dijkstra in structure, but the meaning is different:
- Dijkstra chooses the next cheapest path from a source
- Prim chooses the next cheapest edge that expands the tree

#### Java Implementation Notes

- Use an adjacency list for sparse graphs.
- Use a `PriorityQueue` keyed by edge weight.
- Skip nodes already included in the MST.

#### Common Mistakes

- confusing shortest distance with cheapest connecting edge
- forgetting to add both directions for an undirected graph
- returning a cost even when the graph is disconnected

#### Quick Example

If the current tree contains nodes `{0, 1}` and the crossing edges have weights `3`, `5`, and `7`, Prim must choose the edge of weight `3`, even if some other edge elsewhere in the graph is cheaper but does not touch the current tree.

#### Debugging Tip

Count how many nodes have been added to the tree. A connected graph must finish with all `V` nodes included.

#### Advanced Note

A matrix-based `O(V^2)` Prim implementation can be good for dense graphs.

### Concept Cluster: Find, Union, and DSU Optimizations
Key concepts in this block:
- 26.4 Find and union operations
- 26.5 Path compression and union by rank

#### Intuition

DSU keeps track of which nodes belong to the same component as edges are added over time.

#### Why It Matters

Without DSU, many graph algorithms keep rechecking connectivity from scratch. DSU turns that repeated work into almost constant-time updates and queries.

#### How It Works

Core operations:
- `find(x)`: return the representative of the component containing `x`
- `union(a, b)`: merge the components of `a` and `b` if they differ

Optimizations:
- path compression shortens parent chains during `find`
- union by rank attaches the shallower tree under the deeper one

Together these make DSU operations very fast in practice.

#### Java Implementation Notes

- Store `parent[]` and `rank[]`.
- Initialize `parent[i] = i`.
- A successful `union` is the right place to decrement a component counter if one is being tracked.

#### Common Mistakes

- forgetting to use `find` before comparing or merging
- updating rank incorrectly
- decrementing the component count even when the nodes were already connected

#### Quick Example

If:
- `union(0, 1)`
- `union(1, 2)`

Then `find(0)` and `find(2)` should return the same representative.

#### Debugging Tip

After a few unions, print `parent[]` and a few `find()` results. If equal components still have different representatives, path compression or root attachment is wrong.

#### Advanced Note

The amortized complexity is often written as `O(alpha(V))`, where `alpha` is the inverse Ackermann function. In practice, that is effectively constant.

### Concept Cluster: Connectivity and Offline Query Problems
Key concepts in this block:
- 26.6 Connectivity and offline query problems

#### Intuition

Sometimes queries ask whether two nodes are connected under a condition, such as "only use edges lighter than this limit." If queries are processed in sorted order, DSU can reuse work instead of rebuilding the graph every time.

#### Why It Matters

This pattern appears in threshold queries, batched connectivity checks, and some dynamic-style graph problems.

#### How It Works

Offline approach:
- sort edges by the condition that makes them usable
- sort queries by the same threshold
- sweep from small to large threshold
- union edges as soon as they become allowed
- answer each query by checking whether its endpoints now have the same representative

#### Java Implementation Notes

- Store original query indices so answers can be written back in input order.
- `Arrays.sort` on helper objects keeps the code readable.
- Offline means you are allowed to reorder the processing, even though you return answers in the original order.

#### Common Mistakes

- confusing `< limit` with `<= limit`
- forgetting to restore answer order
- rebuilding DSU for every query and losing the whole optimization

#### Quick Example

If edges of weight less than `5` are allowed, then you union only edges with weights `1`, `2`, `3`, and `4` before answering that query.

#### Debugging Tip

Print the edge pointer and current threshold while sweeping. Many offline bugs come from one wrong comparison operator.

#### Advanced Note

This is one reason DSU appears in many problems that do not even mention MSTs.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Minimum Spanning Tree with Kruskal's Algorithm
#### Problem Statement

Given an undirected weighted graph with `nodeCount` nodes and edges `[u, v, weight]`, return the total weight of its minimum spanning tree. If the graph is disconnected, return `-1`.

#### Why This Example Matters

This is the standard MST problem and the classic place where DSU becomes necessary.

#### Constraints or Assumptions

- the graph is undirected
- the graph may be disconnected
- edge weights may repeat
- multiple MSTs may exist

#### Brute-Force Approach

Check every subset of exactly `V - 1` edges, keep only those that form a spanning tree, and take the minimum total weight.

This is combinatorial and immediately too slow.

#### Better Approach

Sort the edges and run Kruskal's algorithm with DSU.

#### Why the Better Approach Works

At each step, the cheapest edge connecting two different components is safe to include. DSU makes the "different components?" test fast.

#### Pragmatic Java Choice

Use:
- a sortable edge list
- DSU with path compression and union by rank
- a running count of how many edges have been chosen

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

class KruskalMstExample {
    private static final class Edge {
        final int from;
        final int to;
        final int weight;

        Edge(int from, int to, int weight) {
            this.from = from;
            this.to = to;
            this.weight = weight;
        }
    }

    private static final class DisjointSetUnion {
        private final int[] parent;
        private final int[] rank;

        DisjointSetUnion(int size) {
            this.parent = new int[size];
            this.rank = new int[size];
            for (int node = 0; node < size; node++) {
                parent[node] = node;
            }
        }

        int find(int node) {
            if (parent[node] != node) {
                parent[node] = find(parent[node]);
            }
            return parent[node];
        }

        boolean union(int first, int second) {
            int rootFirst = find(first);
            int rootSecond = find(second);
            if (rootFirst == rootSecond) {
                return false;
            }

            if (rank[rootFirst] < rank[rootSecond]) {
                parent[rootFirst] = rootSecond;
            } else if (rank[rootFirst] > rank[rootSecond]) {
                parent[rootSecond] = rootFirst;
            } else {
                parent[rootSecond] = rootFirst;
                rank[rootFirst]++;
            }

            return true;
        }
    }

    static long minimumSpanningTreeCost(int nodeCount, int[][] edgesArray) {
        if (nodeCount == 0) {
            return 0L;
        }

        List<Edge> edges = new ArrayList<>();
        for (int[] edge : edgesArray) {
            edges.add(new Edge(edge[0], edge[1], edge[2]));
        }

        edges.sort(Comparator.comparingInt(edge -> edge.weight));

        DisjointSetUnion dsu = new DisjointSetUnion(nodeCount);
        long totalCost = 0L;
        int chosenEdges = 0;

        for (Edge edge : edges) {
            if (dsu.union(edge.from, edge.to)) {
                totalCost += edge.weight;
                chosenEdges++;
                if (chosenEdges == nodeCount - 1) {
                    break;
                }
            }
        }

        return chosenEdges == nodeCount - 1 ? totalCost : -1L;
    }
}
```

#### Dry Run

Edges:
- `[0, 1, 1]`
- `[1, 2, 2]`
- `[0, 2, 3]`
- `[1, 3, 4]`
- `[2, 3, 5]`

Sorted by weight:
- `1, 2, 3, 4, 5`

Process:
- take `[0, 1, 1]`
- take `[1, 2, 2]`
- skip `[0, 2, 3]` because `0` and `2` are already connected
- take `[1, 3, 4]`

Total MST cost:
- `1 + 2 + 4 = 7`

#### Time and Space Complexity

Brute force:
- Time: combinatorial in the number of edges
- Space: subset bookkeeping dependent

Kruskal with DSU:
- Time: `O(E log E)`
- Space: `O(V + E)`

#### Edge Cases

- disconnected graph
- duplicate edges between the same pair
- negative or zero edge weights
- self-loops, which should never help the MST

#### Common Mistakes

- forgetting that MSTs are for undirected graphs
- returning a cost before checking that `V - 1` edges were chosen
- not using DSU roots when testing connectivity

### Worked Example 2: Minimum Spanning Tree with Prim's Algorithm
#### Problem Statement

Given an undirected weighted graph, return the total weight of its minimum spanning tree using Prim's algorithm. Return `-1` if the graph is disconnected.

#### Why This Example Matters

It gives a second MST construction strategy and highlights the contrast between edge-list-first and adjacency-first thinking.

#### Constraints or Assumptions

- the graph is undirected
- the graph may be disconnected
- any start node is acceptable

#### Brute-Force Approach

Build the tree one node at a time by scanning all graph edges repeatedly to find the cheapest edge leaving the current tree.

That works conceptually, but it wastes work because it keeps rescanning edges that have already been considered.

#### Better Approach

Use Prim's algorithm with an adjacency list and a min-priority queue.

#### Why the Better Approach Works

The priority queue always exposes the cheapest edge crossing from the built tree to an outside node. That is exactly the next safe greedy choice.

#### Pragmatic Java Choice

Use:
- an undirected adjacency list
- a `PriorityQueue<State>` keyed by edge weight
- a boolean array to mark nodes already included in the MST

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;

class PrimMstExample {
    private static final class Edge {
        final int to;
        final int weight;

        Edge(int to, int weight) {
            this.to = to;
            this.weight = weight;
        }
    }

    private static final class State implements Comparable<State> {
        final int node;
        final int edgeWeight;

        State(int node, int edgeWeight) {
            this.node = node;
            this.edgeWeight = edgeWeight;
        }

        @Override
        public int compareTo(State other) {
            return Integer.compare(this.edgeWeight, other.edgeWeight);
        }
    }

    static long minimumSpanningTreeCost(int nodeCount, int[][] edgesArray) {
        if (nodeCount == 0) {
            return 0L;
        }

        List<List<Edge>> graph = new ArrayList<>();
        for (int node = 0; node < nodeCount; node++) {
            graph.add(new ArrayList<>());
        }

        for (int[] edge : edgesArray) {
            int first = edge[0];
            int second = edge[1];
            int weight = edge[2];
            graph.get(first).add(new Edge(second, weight));
            graph.get(second).add(new Edge(first, weight));
        }

        boolean[] used = new boolean[nodeCount];
        PriorityQueue<State> priorityQueue = new PriorityQueue<>();
        priorityQueue.offer(new State(0, 0));

        long totalCost = 0L;
        int usedCount = 0;

        while (!priorityQueue.isEmpty() && usedCount < nodeCount) {
            State current = priorityQueue.poll();
            if (used[current.node]) {
                continue;
            }

            used[current.node] = true;
            usedCount++;
            totalCost += current.edgeWeight;

            for (Edge edge : graph.get(current.node)) {
                if (!used[edge.to]) {
                    priorityQueue.offer(new State(edge.to, edge.weight));
                }
            }
        }

        return usedCount == nodeCount ? totalCost : -1L;
    }
}
```

#### Dry Run

Use the same graph as before.

Start:
- tree contains only node `0`
- queue contains edges leaving `0`

Process:
- choose edge `(0, 1, 1)`, total becomes `1`
- from nodes `{0, 1}`, cheapest crossing edge is `(1, 2, 2)`, total becomes `3`
- from nodes `{0, 1, 2}`, cheapest crossing edge is `(1, 3, 4)`, total becomes `7`

All nodes are now connected.

#### Time and Space Complexity

Repeated full-edge scanning baseline:
- Time: often `O(VE)` in simple implementations
- Space: `O(V + E)`

Prim with priority queue:
- Time: `O(E log V)`
- Space: `O(V + E)`

#### Edge Cases

- disconnected graph
- one-node graph
- duplicate edges
- large weight values

#### Common Mistakes

- forgetting to add both directions to the adjacency list
- counting the starting node's fake edge weight incorrectly
- confusing Prim's greedy choice with Dijkstra's distance logic

### Worked Example 3: Offline Connectivity Queries with DSU
#### Problem Statement

You are given an undirected weighted graph and many queries of the form `[u, v, limit]`. For each query, decide whether `u` and `v` are connected using only edges with weight strictly less than `limit`.

#### Why This Example Matters

It shows how DSU goes beyond MSTs and solves batched connectivity problems by reusing work across sorted queries.

#### Constraints or Assumptions

- the graph is undirected
- queries can be processed offline
- connectivity uses only edges with weight `< limit`

#### Brute-Force Approach

For each query:
- build or filter the graph using only edges below the limit
- run BFS or DFS from `u`
- check whether `v` is reachable

That repeats nearly the same work for every query.

#### Better Approach

Sort edges by weight, sort queries by limit, and union edges incrementally with DSU.

#### Why the Better Approach Works

As query limits increase, the set of allowed edges only grows. So each edge needs to be added at most once. DSU keeps connectivity up to date cheaply.

#### Pragmatic Java Choice

Use:
- helper objects for edges and queries
- `Arrays.sort`
- DSU with path compression and union by rank

#### Java Solution

```java
import java.util.Arrays;
import java.util.Comparator;

class OfflineConnectivityQueriesExample {
    private static final class Edge {
        final int from;
        final int to;
        final int weight;

        Edge(int from, int to, int weight) {
            this.from = from;
            this.to = to;
            this.weight = weight;
        }
    }

    private static final class Query {
        final int from;
        final int to;
        final int limit;
        final int index;

        Query(int from, int to, int limit, int index) {
            this.from = from;
            this.to = to;
            this.limit = limit;
            this.index = index;
        }
    }

    private static final class DisjointSetUnion {
        private final int[] parent;
        private final int[] rank;

        DisjointSetUnion(int size) {
            this.parent = new int[size];
            this.rank = new int[size];
            for (int node = 0; node < size; node++) {
                parent[node] = node;
            }
        }

        int find(int node) {
            if (parent[node] != node) {
                parent[node] = find(parent[node]);
            }
            return parent[node];
        }

        void union(int first, int second) {
            int rootFirst = find(first);
            int rootSecond = find(second);
            if (rootFirst == rootSecond) {
                return;
            }

            if (rank[rootFirst] < rank[rootSecond]) {
                parent[rootFirst] = rootSecond;
            } else if (rank[rootFirst] > rank[rootSecond]) {
                parent[rootSecond] = rootFirst;
            } else {
                parent[rootSecond] = rootFirst;
                rank[rootFirst]++;
            }
        }
    }

    static boolean[] distanceLimitedPathsExist(int nodeCount, int[][] edgesArray, int[][] queriesArray) {
        Edge[] edges = new Edge[edgesArray.length];
        for (int i = 0; i < edgesArray.length; i++) {
            edges[i] = new Edge(edgesArray[i][0], edgesArray[i][1], edgesArray[i][2]);
        }
        Arrays.sort(edges, Comparator.comparingInt(edge -> edge.weight));

        Query[] queries = new Query[queriesArray.length];
        for (int i = 0; i < queriesArray.length; i++) {
            queries[i] = new Query(queriesArray[i][0], queriesArray[i][1], queriesArray[i][2], i);
        }
        Arrays.sort(queries, Comparator.comparingInt(query -> query.limit));

        boolean[] answer = new boolean[queriesArray.length];
        DisjointSetUnion dsu = new DisjointSetUnion(nodeCount);

        int edgeIndex = 0;
        for (Query query : queries) {
            while (edgeIndex < edges.length && edges[edgeIndex].weight < query.limit) {
                dsu.union(edges[edgeIndex].from, edges[edgeIndex].to);
                edgeIndex++;
            }

            answer[query.index] = dsu.find(query.from) == dsu.find(query.to);
        }

        return answer;
    }
}
```

#### Dry Run

Edges:
- `[0, 1, 2]`
- `[1, 2, 4]`
- `[2, 3, 6]`
- `[0, 3, 10]`

Queries:
- `[0, 2, 5]`
- `[0, 3, 5]`
- `[0, 3, 11]`

Sort by limit:
- limit `5`
- limit `5`
- limit `11`

Sweep:
- before limit `5`, union edges of weights `2` and `4`
- now `0` and `2` are connected, so first query is `true`
- `0` and `3` are not yet connected, so second query is `false`
- before limit `11`, also union weights `6` and `10`
- now `0` and `3` are connected, so third query is `true`

#### Time and Space Complexity

Per-query BFS baseline:
- Time: roughly `O(Q(V + E))`
- Space: graph and traversal dependent

Offline DSU approach:
- Time: `O(E log E + Q log Q + (E + Q) * alpha(V))`
- Space: `O(V + E + Q)`

#### Edge Cases

- query endpoints already equal
- disconnected graph
- duplicate edges with different weights
- strict inequality `< limit` versus non-strict inequality `<= limit`

#### Common Mistakes

- sorting queries but forgetting their original indices
- using the wrong threshold comparison
- rebuilding DSU per query and losing the main optimization

## 4. Complexity and Decision Guide

Main trade-offs in this chapter:

- Kruskal's algorithm: `O(E log E)`. Choose it when the graph is naturally given as an edge list or when DSU reasoning is already central.
- Prim's algorithm with a priority queue: `O(E log V)`. Choose it when the graph is already stored as adjacency lists and you want to grow one tree directly.
- DSU operations with path compression and union by rank: effectively near-constant amortized time. Choose DSU when the core question is "are these nodes already connected?"
- Offline connectivity with DSU: sorting plus near-constant unions and finds. Choose it when many connectivity queries can be reordered.

Recognition signals:
- "connect all nodes with minimum total cost" suggests MST
- "avoid cycles while taking cheap edges" suggests Kruskal
- "grow the tree from one seed" suggests Prim
- "many union/find or connectivity checks" suggests DSU
- "many threshold queries" suggests offline DSU

Signals not to force a technique:
- do not use MST when the problem is really shortest path from one source
- do not use DSU when you need actual path reconstruction
- do not use Prim or Kruskal on directed graphs as if nothing changed
- do not process offline queries online if the problem forbids reordering

A practical rule:
- MST goal means Kruskal or Prim
- repeated connectivity goal means DSU
- thresholded batch connectivity goal means offline DSU

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:
- forgetting the graph is undirected
- accepting self-loops into the MST
- returning an MST cost on a disconnected graph
- decrementing component count on failed unions
- forgetting path compression inside `find`
- getting the offline threshold comparison wrong

Boundary handling:
- `nodeCount = 0` should not crash
- `nodeCount = 1` has MST cost `0`
- duplicate edges are legal and should be handled naturally
- negative edge weights can still appear in an MST problem

Short debugging checklist:
- verify that undirected edges are added in both directions for Prim
- verify Kruskal counts exactly successful unions
- verify `find(find(x)) == find(x)` after compression
- verify component merges only happen when roots differ
- verify disconnected graphs return `-1` for MST
- verify offline query answers are restored to original order

## 6. Practice Problems

### Easy

- Title: Redundant Connection. One-line prompt: return the edge that first creates a cycle in an undirected graph. Expected pattern or core idea: DSU cycle detection.
- Title: Number of Connected Components in an Undirected Graph. One-line prompt: count how many components remain after processing all edges. Expected pattern or core idea: DSU or traversal.
- Title: Connecting Cities with Minimum Cost. One-line prompt: connect all cities as cheaply as possible or report impossibility. Expected pattern or core idea: Kruskal's algorithm.

### Medium

- Title: Min Cost to Connect All Points. One-line prompt: connect all points using edge costs based on coordinate distance. Expected pattern or core idea: Prim or Kruskal MST.
- Title: Number of Operations to Make Network Connected. One-line prompt: decide whether spare cables can connect all computers and count the needed operations. Expected pattern or core idea: DSU component counting.
- Title: Accounts Merge. One-line prompt: merge records that share identifiers. Expected pattern or core idea: DSU on entities linked by shared keys.

### Hard

- Title: Checking Existence of Edge Length Limited Paths. One-line prompt: answer many connectivity queries under edge-weight limits. Expected pattern or core idea: offline DSU.
- Title: Optimize Water Distribution in a Village. One-line prompt: choose wells and pipes to minimize total cost. Expected pattern or core idea: MST with a virtual node.
- Title: Critical and Pseudo-Critical Edges in Minimum Spanning Tree. One-line prompt: classify edges by how essential they are to MST construction. Expected pattern or core idea: repeated Kruskal reasoning.

## 7. Short Recap

The core idea of this chapter is that graph-wide cheapest connectivity is different from shortest paths.

The most important optimization insight is that DSU turns cycle checks and connectivity checks into very cheap operations, which makes Kruskal and many offline query solutions practical.

The most important implementation warning is to keep the graph undirected where appropriate and to union only by component representatives.

This chapter prepares the next chapter by moving from global graph connectivity to deeper structural analysis inside directed and undirected graphs.

## 8. Coverage Check

- [x] 26.1 Greedy view of minimum spanning trees
- [x] 26.2 Kruskal's algorithm
- [x] 26.3 Prim's algorithm
- [x] 26.4 Find and union operations
- [x] 26.5 Path compression and union by rank
- [x] 26.6 Connectivity and offline query problems

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 27: Strongly Connected Components, Bridges, and Articulation Points
# Part V Outcome: Graph Algorithms

**Scope:** Chapters 22 to 27
**Part outcome:**
- Model real problems as graphs
- Choose the right traversal or shortest-path tool
- Solve 30 graph problems across medium and hard levels
**Capstone milestone:** Build a graph toolkit with BFS, DFS, Dijkstra, DSU, and MST

---

## 1. What Completing Part V Should Mean

By the end of Part V, graph problems should stop feeling like disconnected algorithm names. You should first decide what the nodes and edges mean, then choose the traversal, path, or connectivity tool that matches the model.

Part V is complete only when you can:

- model a real problem as a graph without distorting the rules
- decide whether BFS, DFS, topological sort, shortest path, or DSU is the right tool
- explain why edge direction, weights, and cycles change the solution family
- implement core graph templates without re-deriving them from scratch each time

## 2. Part V Revision Sheet

### 2.1 Graph Foundations

What to remember:

- graph terminology includes vertices, edges, indegree, outdegree, paths, cycles, and components
- adjacency list is usually the default sparse representation
- adjacency matrix is simpler conceptually but expensive for large sparse graphs
- direction and weight are problem-defining properties, not decorations
- many real problems are graph-modeling problems first

Common mistakes:

- using the wrong representation for the density level
- forgetting whether edges are directed or undirected

### 2.2 Graph Traversal

What to remember:

- BFS explores by distance layers in unweighted graphs
- DFS explores depth-first structure and is useful for recursion-based reasoning
- connected components group mutually reachable regions in undirected graphs
- cycle detection rules differ for directed and undirected graphs
- bipartite checking is often coloring plus traversal

Common mistakes:

- reusing the same visited rule for directed and undirected cycle detection
- forgetting disconnected components

### 2.3 Topological Sort and DAG Problems

What to remember:

- DAG means directed acyclic graph
- Kahn's algorithm uses indegrees and a queue
- DFS-based topological sort uses postorder finishing logic
- dependency ordering problems are often disguised topological sorts
- shortest paths in DAGs use topological order instead of Dijkstra

Common mistakes:

- trying topological sort on graphs with cycles without checking validity
- reversing dependency edge direction incorrectly

### 2.4 Shortest Path Algorithms

What to remember:

- Dijkstra handles nonnegative weights
- Bellman-Ford handles negative edges and can detect negative cycles
- Floyd-Warshall solves all-pairs shortest paths on smaller dense graphs
- 0-1 BFS is for edge weights of only `0` or `1`
- algorithm choice depends on weights, graph size, and query needs

Common mistakes:

- using Dijkstra with negative edges
- choosing Floyd-Warshall on graphs too large for `O(n^3)`

### 2.5 Minimum Spanning Tree and Disjoint Set Union

What to remember:

- MST is about minimum total connection cost, not shortest path between one pair
- Kruskal relies on edge sorting plus DSU
- Prim grows the tree from a chosen start region
- DSU supports find and union for connectivity tracking
- path compression and union by rank keep DSU efficient

Common mistakes:

- confusing MST with shortest-path problems
- broken DSU parent updates

### 2.6 Strongly Connected Components, Bridges, and Articulation Points

What to remember:

- SCCs apply to directed graphs
- Kosaraju and Tarjan solve SCC problems in different ways
- bridges are edges whose removal disconnects an undirected graph
- articulation points are nodes whose removal disconnects an undirected graph
- low-link intuition matters for bridges and articulation points

Common mistakes:

- mixing directed-graph SCC logic with undirected low-link logic
- not tracking discovery and low times correctly

## 3. Part V Graph Toolkit Completion Checklist

Your Part V capstone should include at least these reusable components:

- adjacency-list graph builder
- BFS template
- DFS template
- topological-sort template
- `DijkstraSolver`
- `BellmanFordSolver`
- `ZeroOneBfsTemplate`
- `DisjointSetUnion`
- `KruskalMst`
- `PrimMst`

For each component, verify:

- the graph direction and weight assumptions are documented
- one small example exists
- disconnected-case behavior is tested where relevant
- complexity is written down nearby

## 4. Part V Mini Assessment

### Part A: Quick Questions

1. When is BFS better than DFS for shortest-path work?
2. What makes a graph a DAG?
3. Why does Dijkstra fail on negative-weight edges?
4. What problem does DSU solve well?
5. What is the difference between an MST and a shortest path tree?
6. What kind of graph does strongly connected components apply to?

### Part B: Short Tasks

7. Implement BFS and DFS on an adjacency list.
8. Solve one course-schedule or dependency-order problem.
9. Solve one shortest-path problem and justify why that algorithm fits the weights.
10. Implement DSU and use it in Kruskal's algorithm.

### Part C: Answer Guide

1. In unweighted graphs where shortest path means fewest edges.
2. It is directed and contains no directed cycle.
3. Its greedy choice assumes once a shortest distance is finalized it will not later improve.
4. Connectivity tracking and component merging.
5. MST minimizes total tree cost for all nodes; shortest path tree minimizes path distances from one source.
6. Directed graphs.

### Part D: Scoring Guide

- `6/6` on Part A and all Part B tasks completed: Part V is ready.
- `4-5/6` on Part A: review the weak graph family.
- `3/6` or lower on Part A: do another revision pass first.

## 5. Part V Capstone: Graph Toolkit

Build one reusable Java toolkit containing:

- graph construction helpers
- BFS and DFS templates
- topological-sort logic
- Dijkstra, Bellman-Ford, and 0-1 BFS templates
- DSU and MST implementations

Minimum verification standard:

- every template runs on one small graph example
- directed and undirected assumptions are explicit
- weighted and unweighted templates are not mixed carelessly

## 6. Exit Checklist

- You can model real problems as graphs correctly.
- You can choose traversal and shortest-path tools by constraints.
- DSU and MST logic are implementable from scratch.
- SCC, bridge, and articulation-point terminology is stable.
- You have solved about 30 graph problems across medium and hard levels.
- Your Part V graph toolkit exists and is usable.

If one of these is still weak, Part V is not complete.
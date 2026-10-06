# 13: Weighted Graph and Network Patterns

## 0. Introduction

This chapter sits in Part III - Recursive Search, Trees, and Graph Structure (Weeks 10-15), with the roadmap treating it as upper intermediate to advanced work. Its goal is to learn how to choose between shortest-path, minimum spanning tree, and flow-network patterns in weighted graphs by understanding relaxation, cut intuition, residual structure, and the objective each algorithm is actually optimizing. This chapter directly supports the Part III outcome of building confidence with medium and hard connectivity problems in Java and choosing the right weighted-graph pattern from the problem statement.

Read it as a bridge in the larger sequence. Chapter 12 focused on connectivity, components, and dependencies in unweighted graphs. This chapter adds edge weights and capacities, which change the right objective and therefore the right algorithm. Chapter 14 shifts from graph-structured search into dynamic programming state design, where repeated subproblems and transitions become explicit. Start this chapter after you are comfortable with Chapters 1 through 12, especially graph traversal, priority queues, union find, and careful state modeling. The main themes here are Shortest Path Pattern, Minimum Spanning Tree Pattern, Advanced Graph Flow Pattern, Relaxation and cut-based intuition, Residual thinking and network transformation basics, and Choosing between traversal, shortest path, MST, and flow.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to recognize when a weighted graph problem is about shortest paths, global connection cost, or transferable capacity; apply relaxation in shortest-path algorithms, cut-based reasoning in MST algorithms, and residual-network thinking in flow algorithms; and explain why traversal alone is not enough once weights or capacities matter.

## 1. Intuition First

This chapter matters because once edges have weights or capacities, simple traversal no longer answers the real question. Reaching a node is no longer enough. You may need the cheapest route, the cheapest way to connect everything, or the greatest amount of transferable flow from a source to a sink.

The simplest analogy is planning a logistics network. If you want the cheapest route from one warehouse to another, you need a shortest-path model. If you want the cheapest set of roads that connects all warehouses, you need an MST model. If you want to know how much product can move through a network of roads with limited capacity, you need a flow model. These are all graph questions, but they optimize different things.

The core mental model is:

- shortest path minimizes total path cost from a source to destinations
- MST minimizes the total weight of edges needed to connect all vertices
- flow maximizes transferable value under edge capacities
- relaxation improves distance estimates in shortest-path methods
- cut intuition explains safe MST edge choices
- residual networks explain how flow can be rerouted and improved

Recognition signals for this chapter:

- weighted routes, travel cost, delay, or distance
- connect all nodes as cheaply as possible
- maximize transferable units through a network
- edge capacity, bottleneck, or throughput language
- traversal reaches the right nodes but says nothing about optimal cost

The most common beginner confusion point is using “graph traversal” as if it were the full solution once a graph is built. Weighted problems usually need an optimization invariant on top of the graph structure itself.

In the larger roadmap, this chapter closes the graph portion of Part III by showing how different graph objectives demand different state updates, proofs, and data structures.

## 2. Learning Path and Recognition Checklist

The chapter starts with shortest paths because they are the most common first weighted-graph pattern. It then moves to MSTs, where the goal is not one route but the cheapest global connection of all nodes. After that, it introduces flow networks, where capacities and residual structure replace simple distance or connectivity. Throughout the chapter, it keeps asking the same diagnostic question: what is the objective actually optimizing?

Recognition checklist for this chapter:

- Do I need the cheapest route from one node to another, or to all nodes?
- Do I need to connect all nodes with minimum total cost rather than optimize one path?
- Do I need to maximize capacity from a source to a sink?
- Are weights non-negative, or do negative edges require a different shortest-path tool?
- Does the problem talk about capacities, bottlenecks, or re-routing flow?
- Would plain DFS or BFS ignore the actual optimization target?

The brute-force baselines often look like this:

- enumerate many or all possible paths and compare total costs
- enumerate many or all spanning trees and compare their total weight
- guess flow allocations on many path combinations without residual structure

The optimization in this chapter depends on the objective:

- shortest path uses relaxation to improve distance estimates
- MST uses cut-based reasoning to add safe connecting edges
- flow uses residual networks and augmenting paths to improve total throughput

Mastery by the end of the chapter looks like this: you can name the optimization goal, choose the matching graph pattern, and explain the invariant that makes its updates safe.

Do not force Dijkstra when negative edges matter. Do not force an MST when the question asks for one source-to-target route. Do not force flow when the problem is just reachability or cost minimization without capacities.

## 3. Official Subtopic Coverage

### Concept Cluster: Shortest Paths and Relaxation
Official subtopics covered:
- 13.1 Shortest Path Pattern
- 13.4 Relaxation and cut-based intuition

#### Definition or Framing
The Shortest Path Pattern finds minimum-cost routes in weighted graphs. Relaxation is the operation of improving a best-known distance estimate by using an edge from an already considered node.

#### Recognition Signals
- minimum cost, minimum time, minimum distance, or minimum delay
- weighted edges
- one source to one target or one source to all nodes
- the current best distance estimate may improve through a new route

#### Brute-Force Baseline
- enumerate simple paths and track the cheapest one
- use BFS even though weights are not uniform

#### Optimized Pattern Idea
Maintain best-known distances and repeatedly relax edges. Use Dijkstra for non-negative weights, Bellman-Ford when negative edges matter but negative cycles are absent, and other specialized tools as needed.

#### Invariant / State Representation / Transition Logic
Relaxation says: if `distance[u] + weight(u, v) < distance[v]`, then a better route to `v` has been found through `u`, so update `distance[v]`. In Dijkstra with non-negative edges, once a node is extracted with the smallest tentative distance, that distance is final.

#### Java Implementation Notes
- use adjacency lists plus a priority queue for Dijkstra
- use `long` if edge weights and path sums can overflow `int`
- stale priority queue entries can be skipped by comparing popped distance with current stored distance

#### Quick Dry Run
If the best-known cost to `u` is `4` and the edge `u -> v` costs `3`, then the route through `u` proposes a distance of `7` to `v`. If `v` was previously `10`, relaxation improves it to `7`.

#### Common Mistakes
- using BFS for weighted edges where weights differ
- assuming Dijkstra works with negative edges
- forgetting to skip stale priority queue states

#### Debugging Strategy
Print distance updates as edges relax. If a “better” path appears after a supposedly final Dijkstra extraction with non-negative edges, the invariant or implementation is wrong.

#### Comparison with Similar Pattern
Traversal only asks whether a node can be reached. Shortest-path algorithms ask what the cheapest reachable route is.

#### Advanced Note
Bellman-Ford, Floyd-Warshall, and specialized DAG shortest paths are all part of the broader relaxation family, but Dijkstra is the first major pattern for non-negative weighted graphs.

### Concept Cluster: Minimum Spanning Trees and Global Connection Cost
Official subtopics covered:
- 13.2 Minimum Spanning Tree Pattern

#### Definition or Framing
The Minimum Spanning Tree Pattern finds a set of `n - 1` edges that connects all vertices with minimum total weight and no cycles.

#### Recognition Signals
- connect all nodes
- minimize total connection cost, not one route cost
- any spanning structure is acceptable as long as total cost is smallest

#### Brute-Force Baseline
- enumerate many or all spanning trees and compute total weight
- try to grow arbitrary connected subgraphs and compare them afterward

#### Optimized Pattern Idea
Use cut-based reasoning: at each stage, a lightest safe edge crossing an appropriate cut can be added without losing optimality. Kruskal uses global edge ordering and union find; Prim grows a tree frontier with a priority queue.

#### Invariant / State Representation / Transition Logic
Kruskal invariant: accepted edges are acyclic and can be extended to an MST. Prim invariant: the current chosen set is a tree, and the next safe edge is the lightest edge connecting the built tree to an outside vertex.

#### Java Implementation Notes
- Kruskal pairs well with union find
- Prim pairs well with adjacency lists and a min-heap
- MST problems often need careful handling of disconnected graphs if a full spanning tree is impossible

#### Quick Dry Run
If an edge connects two vertices already in the same Kruskal component, adding it would create a cycle and cannot help the MST. If it connects different components and is the next lightest safe edge, it is a good candidate to include.

#### Common Mistakes
- confusing shortest path tree with MST
- assuming the cheapest path between two nodes determines the MST structure
- forgetting to detect disconnected input when a full spanning tree cannot be formed

#### Debugging Strategy
For Kruskal, print chosen edges in sorted order and the union-find roots after each selection. If a chosen edge closes a cycle, the DSU logic is wrong.

#### Comparison with Similar Pattern
Shortest path minimizes route cost from a source. MST minimizes total edge cost for connecting all vertices. They answer different objectives and may choose very different edges.

#### Advanced Note
Cut-based intuition is one of the first places where a proof idea becomes central: a safe crossing edge can be chosen without damaging global optimality.

### Concept Cluster: Flow Networks, Residual Structure, and Pattern Choice
Official subtopics covered:
- 13.3 Advanced Graph Flow Pattern
- 13.5 Residual thinking and network transformation basics
- 13.6 Choosing between traversal, shortest path, MST, and flow

#### Definition or Framing
The Advanced Graph Flow Pattern models a network where each edge has a capacity and the goal is to maximize flow from a source to a sink. Residual thinking means the algorithm reasons about remaining capacity and possible reversal of earlier flow so better overall allocations can be found.

#### Recognition Signals
- maximize throughput, assignment count, transport volume, or matching size
- capacities on directed edges
- routing decisions may need to be revised when new augmenting paths are found
- the graph may need transformation from a real-world problem into a source-sink network

#### Brute-Force Baseline
- guess how much flow to send along each path combination
- greedily fill one path without allowing later rerouting

#### Optimized Pattern Idea
Build a flow network, compute augmenting paths in the residual graph, and update residual capacities after each augmentation. Edmonds-Karp uses BFS to find shortest augmenting paths by edge count.

#### Invariant / State Representation / Transition Logic
The residual graph shows how much additional flow can still move forward or be canceled backward on each edge. Each augmenting path increases total flow by its bottleneck capacity, and residual updates preserve conservation and capacity constraints.

#### Java Implementation Notes
- adjacency lists plus a residual capacity matrix are a common Edmonds-Karp starting point
- reverse edges must exist in the residual structure even if their initial capacity is zero
- many real problems need a graph transformation step before the max-flow algorithm starts

#### Quick Dry Run
If `s -> a -> t` is saturated, but a later route can use `s -> b -> a -> t`, the residual back edge from `a` may allow previous flow to be rerouted. That is why residual networks are more powerful than one-pass greedy path filling.

#### Common Mistakes
- ignoring reverse residual edges
- thinking max flow is just repeated path finding without capacity updates
- using shortest-path or MST logic when the problem is about total transferable capacity instead

#### Debugging Strategy
After each augmentation, print the bottleneck and the changed residual capacities on the path. If total flow changes but residual capacity logic does not, the implementation is broken.

#### Comparison with Similar Pattern
Traversal asks whether the sink is reachable. Shortest path minimizes route cost. MST connects all vertices cheaply. Flow maximizes total transferable volume under capacities. The problem statement's objective must pick the pattern.

#### Advanced Note
Many matching and assignment problems become flow problems after network transformation, which is why modeling is as important as the augmentation algorithm itself.

## 4. Pattern Template, State Model, or Core Workflow

Canonical Dijkstra workflow:

```java
PriorityQueue<State> minHeap = new PriorityQueue<>((first, second) -> Long.compare(first.distance, second.distance));
distance[source] = 0;
minHeap.offer(new State(source, 0));

while (!minHeap.isEmpty()) {
    State current = minHeap.poll();
    if (current.distance != distance[current.node]) {
        continue;
    }
    for (Edge edge : graph.get(current.node)) {
        long nextDistance = current.distance + edge.weight;
        if (nextDistance < distance[edge.to]) {
            distance[edge.to] = nextDistance;
            minHeap.offer(new State(edge.to, nextDistance));
        }
    }
}
```

Canonical Kruskal workflow:

```java
Arrays.sort(edges, Comparator.comparingInt(edge -> edge.weight));
for (Edge edge : edges) {
    if (unionFind.union(edge.from, edge.to)) {
        totalWeight += edge.weight;
    }
}
```

Canonical Edmonds-Karp workflow:

```java
while (bfsFindAugmentingPath(source, sink, parent, residualCapacity, graph)) {
    int bottleneck = computePathBottleneck(source, sink, parent, residualCapacity);
    applyResidualUpdates(source, sink, parent, residualCapacity, bottleneck);
    maxFlow += bottleneck;
}
```

Important variables and decision rules:

- `distance[]`: best-known shortest-path estimates
- relaxation rule: update when a cheaper route is found
- union find state: current connected components in Kruskal
- cut intuition: safe MST edge crosses from connected side to disconnected side without causing cycles
- residual capacity: remaining forward capacity plus reversible backward capacity for flow

Safety rules:

- shortest path and MST are not interchangeable objectives
- Dijkstra requires non-negative edges
- MST requires global connection cost, not one source-target route
- flow requires residual updates and capacity conservation, not just repeated reachability
- choose the pattern from the optimization target first, then from the graph structure

What usually breaks first is objective mismatch. Many wrong solutions model the graph correctly but optimize the wrong thing.

Adapt the templates by changing the shortest-path variant, MST flavor, or flow routine, but keep the objective and invariant explicit.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Network Delay Time with Dijkstra
#### Problem Statement
You are given directed weighted edges `times[i] = [u, v, w]`, representing that a signal takes `w` time to travel from `u` to `v`. Starting from node `k`, return the time it takes for all nodes to receive the signal, or `-1` if some node is unreachable.

#### Why This Example Matters
This is the foundational shortest-path example because it is about minimum weighted arrival time from one source to all nodes.

#### Input and Constraints
- graph is directed and weighted
- edge weights are non-negative
- one source broadcasts to all nodes

#### Recognition Signals
- minimum time to reach nodes
- weights differ, so BFS is not enough
- a one-source shortest-path pattern is needed

#### Brute-Force Approach
Enumerate many or all simple paths from the source to every node, then choose the minimum arrival time per node.

#### Better Pattern-Based Approach
Use Dijkstra's algorithm with a min-heap and distance relaxation.

#### Why the Pattern Fits
All edge weights are non-negative, so once Dijkstra extracts the smallest tentative distance, that node's shortest distance is final.

#### Invariant or State Transition
When a node is popped with the current best distance equal to the stored distance, that distance is the final shortest-path value for that node.

#### Pragmatic Java Choice
Use adjacency lists plus a `PriorityQueue` of `(node, distance)` states.

#### Dry Run Before Code
If node `2` is currently best known at distance `5`, and a popped node `1` with distance `3` has edge `1 -> 2` of weight `1`, relaxation improves node `2` to distance `4`.

#### Java Solution
```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.PriorityQueue;

public class NetworkDelayTimeDijkstra {
    static class Edge {
        int to;
        int weight;

        Edge(int to, int weight) {
            this.to = to;
            this.weight = weight;
        }
    }

    static class State {
        int node;
        long distance;

        State(int node, long distance) {
            this.node = node;
            this.distance = distance;
        }
    }

    public int networkDelayTime(int[][] times, int n, int k) {
        List<List<Edge>> graph = new ArrayList<>();
        for (int node = 0; node <= n; node++) {
            graph.add(new ArrayList<>());
        }

        for (int[] edge : times) {
            graph.get(edge[0]).add(new Edge(edge[1], edge[2]));
        }

        long[] distance = new long[n + 1];
        Arrays.fill(distance, Long.MAX_VALUE);
        distance[k] = 0;

        PriorityQueue<State> minHeap = new PriorityQueue<>((first, second) -> Long.compare(first.distance, second.distance));
        minHeap.offer(new State(k, 0));

        while (!minHeap.isEmpty()) {
            State current = minHeap.poll();
            if (current.distance != distance[current.node]) {
                continue;
            }

            for (Edge edge : graph.get(current.node)) {
                long nextDistance = current.distance + edge.weight;
                if (nextDistance < distance[edge.to]) {
                    distance[edge.to] = nextDistance;
                    minHeap.offer(new State(edge.to, nextDistance));
                }
            }
        }

        long answer = 0;
        for (int node = 1; node <= n; node++) {
            if (distance[node] == Long.MAX_VALUE) {
                return -1;
            }
            answer = Math.max(answer, distance[node]);
        }

        return (int) answer;
    }
}
```

#### Time and Space Complexity
- Brute-force path enumeration: exponential in the worst case
- Dijkstra with a heap: $O((n + m) \log n)$ time, $O(n + m)$ space

#### Edge Cases
- unreachable node
- one-node graph
- multiple edges between the same pair of nodes

#### Common Mistakes
- using BFS as if all weights were equal
- forgetting that nodes are one-based in this problem style
- not skipping stale heap entries

### Worked Example 2: Minimum Cost to Connect All Nodes with Kruskal
#### Problem Statement
Given `n` nodes and a list of weighted undirected edges `[u, v, w]`, return the minimum total cost to connect all nodes, or `-1` if the graph cannot be fully connected.

#### Why This Example Matters
This is the canonical MST example because the objective is global connection cost, not a route from one source to another.

#### Input and Constraints
- graph is undirected and weighted
- not every graph is connected
- all nodes must be connected at minimum total edge cost

#### Recognition Signals
- connect all nodes
- minimum total weight
- route-specific shortest path is not the question

#### Brute-Force Approach
Enumerate spanning edge sets and keep the minimum-cost one that connects all nodes without cycles.

#### Better Pattern-Based Approach
Sort edges by weight and use Kruskal's algorithm with union find to add safe edges that connect different components.

#### Why the Pattern Fits
Kruskal's cut-based logic ensures that the next lightest safe connecting edge can be added without damaging optimality.

#### Invariant or State Transition
The chosen edge set is always acyclic and can still be extended to some MST. Each accepted edge strictly reduces the number of connected components.

#### Pragmatic Java Choice
Use an edge array plus a compact union-find implementation.

#### Dry Run Before Code
If the lightest edge connects two different components, accept it. If a later edge connects vertices already in the same component, reject it because it would create a cycle.

#### Java Solution
```java
import java.util.Arrays;

public class MinimumSpanningTreeKruskal {
    static class Edge {
        int from;
        int to;
        int weight;

        Edge(int from, int to, int weight) {
            this.from = from;
            this.to = to;
            this.weight = weight;
        }
    }

    static class UnionFind {
        int[] parent;
        int[] rank;

        UnionFind(int size) {
            parent = new int[size + 1];
            rank = new int[size + 1];
            for (int index = 0; index <= size; index++) {
                parent[index] = index;
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

    public int minimumCost(int n, int[][] connections) {
        Edge[] edges = new Edge[connections.length];
        for (int index = 0; index < connections.length; index++) {
            edges[index] = new Edge(connections[index][0], connections[index][1], connections[index][2]);
        }

        Arrays.sort(edges, (first, second) -> Integer.compare(first.weight, second.weight));

        UnionFind unionFind = new UnionFind(n);
        int totalCost = 0;
        int edgesUsed = 0;

        for (Edge edge : edges) {
            if (unionFind.union(edge.from, edge.to)) {
                totalCost += edge.weight;
                edgesUsed++;
            }
        }

        return edgesUsed == n - 1 ? totalCost : -1;
    }
}
```

#### Time and Space Complexity
- Spanning-tree brute force: combinatorially explosive
- Kruskal: $O(m \log m)$ time due to edge sorting, with near-constant DSU operations and $O(n)$ extra space

#### Edge Cases
- graph already minimally connected
- disconnected graph with no spanning tree
- multiple equal-weight safe edges

#### Common Mistakes
- confusing MST with shortest path from one source
- accepting an edge that joins nodes already in the same component
- forgetting to verify that exactly `n - 1` edges were chosen

### Worked Example 3: Maximum Flow with Edmonds-Karp
#### Problem Statement
Given a directed capacity graph, a source node, and a sink node, return the maximum possible flow from source to sink.

#### Why This Example Matters
This is the core flow-network example because it forces residual thinking instead of greedy path filling.

#### Input and Constraints
- edges have non-negative capacities
- flow must obey capacity constraints and conservation at intermediate nodes
- the objective is maximum total flow, not cheapest path

#### Recognition Signals
- maximize throughput or transferable units
- capacities on edges
- multiple augmenting routes may interact

#### Brute-Force Approach
Try many combinations of sending flow across source-to-sink paths and compare the total feasible throughput.

#### Better Pattern-Based Approach
Use Edmonds-Karp: repeatedly find an augmenting path in the residual graph with BFS, augment by the bottleneck capacity, and update forward and backward residual edges.

#### Why the Pattern Fits
Residual edges allow the algorithm to revise earlier path choices when a better global allocation becomes possible.

#### Invariant or State Transition
The residual graph always represents exactly how much additional flow can move forward or be canceled backward without violating current flow feasibility. Each augmentation increases total flow by the bottleneck along the found path.

#### Pragmatic Java Choice
Use an adjacency list for traversal and an `int[][] residualCapacity` matrix for direct capacity updates.

#### Dry Run Before Code
If one augmenting path has bottleneck `3`, total flow increases by `3`, forward residual capacities decrease by `3`, and backward residual capacities increase by `3` so future rerouting is possible.

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;

public class MaxFlowEdmondsKarp {
    public int maxFlow(int n, int[][] edges, int source, int sink) {
        int[][] residualCapacity = new int[n][n];
        List<List<Integer>> graph = new ArrayList<>();
        for (int node = 0; node < n; node++) {
            graph.add(new ArrayList<>());
        }

        for (int[] edge : edges) {
            int from = edge[0];
            int to = edge[1];
            int capacity = edge[2];

            residualCapacity[from][to] += capacity;
            graph.get(from).add(to);
            graph.get(to).add(from);
        }

        int maxFlow = 0;
        int[] parent = new int[n];

        while (bfs(source, sink, graph, residualCapacity, parent)) {
            int bottleneck = Integer.MAX_VALUE;
            int current = sink;

            while (current != source) {
                int previous = parent[current];
                bottleneck = Math.min(bottleneck, residualCapacity[previous][current]);
                current = previous;
            }

            current = sink;
            while (current != source) {
                int previous = parent[current];
                residualCapacity[previous][current] -= bottleneck;
                residualCapacity[current][previous] += bottleneck;
                current = previous;
            }

            maxFlow += bottleneck;
        }

        return maxFlow;
    }

    private boolean bfs(int source, int sink, List<List<Integer>> graph, int[][] residualCapacity, int[] parent) {
        Arrays.fill(parent, -1);
        parent[source] = source;

        Deque<Integer> queue = new ArrayDeque<>();
        queue.offerLast(source);

        while (!queue.isEmpty()) {
            int node = queue.pollFirst();
            for (int neighbor : graph.get(node)) {
                if (parent[neighbor] == -1 && residualCapacity[node][neighbor] > 0) {
                    parent[neighbor] = node;
                    if (neighbor == sink) {
                        return true;
                    }
                    queue.offerLast(neighbor);
                }
            }
        }

        return false;
    }
}
```

#### Time and Space Complexity
- Naive path-allocation search: combinatorially difficult and structurally hard to manage
- Edmonds-Karp: $O(VE^2)$ time in the standard bound, with $O(V^2 + E)$ residual storage depending on representation

#### Edge Cases
- no source-to-sink path
- multiple parallel edges between the same nodes
- one direct edge from source to sink

#### Common Mistakes
- forgetting reverse residual updates
- treating path capacity greedily without allowing rerouting
- confusing maximum flow with maximum-capacity single path

## 6. Complexity and Comparison Guide

This chapter is driven by objective-based trade-offs.

- Traversal by DFS or BFS is still $O(n + m)$, but it only answers reachability or unweighted shortest-edge questions.
- Dijkstra solves non-negative weighted shortest paths in roughly $O((n + m) \log n)$ with a heap.
- Kruskal solves MST via sorting plus union find in $O(m \log m)$.
- Edmonds-Karp solves max flow with a much heavier bound, but it answers a fundamentally different capacity objective.

Comparison with similar patterns:

- Traversal versus shortest path: traversal says whether a node can be reached; shortest path says the cheapest route cost.
- Shortest path versus MST: shortest path is source-centered route optimization; MST is global network connection cost minimization.
- MST versus flow: MST chooses a cheap backbone; flow maximizes transferable volume through capacities.
- Dijkstra versus Bellman-Ford: Dijkstra is faster under non-negative edges; Bellman-Ford handles negative edges but at higher time cost.

Decision criteria:

- choose plain traversal when weights do not matter and reachability is enough
- choose shortest path when route cost from a source matters
- choose MST when all nodes must be connected as cheaply as possible
- choose flow when the goal is maximum transferable capacity from source to sink

Signals that you should not force these techniques:

- using Dijkstra with negative edges
- using MST when only one route matters
- using shortest path for capacity maximization
- using flow when a simple weighted path or spanning tree objective already captures the problem

What breaks when the invariant or preconditions fail is usually the proof of optimality. A graph may still be traversed correctly, but the chosen updates no longer optimize the right objective.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- BFS used on weighted graphs with nonuniform costs
- stale priority queue states not skipped in Dijkstra
- negative edges fed into Dijkstra
- MST code forgetting to check connectivity
- residual reverse edges omitted in flow updates

Boundary and arithmetic risks:

- large weight sums requiring `long`
- disconnected graphs for MST and shortest-path queries
- parallel edges and self-loops depending on problem guarantees
- capacities accumulating across repeated edges

Short debugging checklist:

1. What is the optimization objective: reachability, cheapest route, cheapest full connection, or maximum throughput?
2. Are edge weights non-negative, and if not, is Dijkstra invalid?
3. In shortest path, where do relaxations happen and why are they safe?
4. In MST, does every accepted edge connect two different components?
5. In flow, do residual forward and backward capacities both update after augmentation?

Quick counterexample that defeats a common wrong solution:

Using BFS on a weighted graph with edges `0 -> 1` cost `100`, `0 -> 2` cost `1`, and `2 -> 1` cost `1` gives the wrong intuition if it returns node `1` after one edge from `0`. The cheapest route to `1` is actually `0 -> 2 -> 1` with total cost `2`, which BFS does not capture because edge count and edge weight are different objectives.

## 8. Practice Problems

### Easy
- Find the City With Smallest Reachable Cost Threshold in tiny graphs: Compare weighted reachability under a budget. Expected pattern or core idea: shortest path awareness.
- Connecting Cities With Minimum Cost in small inputs: Connect all nodes as cheaply as possible. Expected pattern or core idea: MST.
- Path With Minimum Effort introduction variants: Minimize the worst local cost on a route. Expected pattern or core idea: weighted path reasoning.

### Medium
- Network Delay Time: Compute maximum arrival time from one source. Expected pattern or core idea: Dijkstra shortest path.
- Minimum Cost to Connect All Points: Build a cheapest full connection structure. Expected pattern or core idea: MST.
- Cheapest Flights Within K Stops: Route optimization under an extra constraint. Expected pattern or core idea: constrained shortest path.

### Hard
- Max Flow in directed capacity networks: Compute source-to-sink throughput. Expected pattern or core idea: Edmonds-Karp or more advanced flow.
- Minimum Cost Maximum Flow style assignment variants: Optimize both capacity and cost. Expected pattern or core idea: network transformation plus flow.
- Negative-edge shortest path problems with cycle checks: Handle weighted directed graphs beyond Dijkstra's assumptions. Expected pattern or core idea: Bellman-Ford relaxation.

## 9. Short Recap

The core idea of this chapter is that weighted graph problems must be classified by objective before algorithm choice: cheapest route, cheapest full connection, or maximum throughput. The strongest recognition clue is what the edge values mean: costs, connection weights, or capacities. The most important optimization insight is that relaxation, cut-based choice, and residual updates are the mechanisms that make these objectives tractable. The most important implementation warning is that a correct graph representation is not enough if the chosen algorithm optimizes the wrong thing or violates its preconditions. This chapter prepares the next part by transitioning from graph-structured optimization into explicit dynamic programming state and transition design.

## 10. Coverage Check

- 13.1 Shortest Path Pattern - Covered
- 13.2 Minimum Spanning Tree Pattern - Covered
- 13.3 Advanced Graph Flow Pattern - Covered
- 13.4 Relaxation and cut-based intuition - Covered
- 13.5 Residual thinking and network transformation basics - Covered
- 13.6 Choosing between traversal, shortest path, MST, and flow - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 14: Dynamic Programming Foundations
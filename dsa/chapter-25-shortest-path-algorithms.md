# 25: Shortest Path Algorithms

**Goal:** Teach how shortest-path problems differ by edge weights, graph size, and query type, and how to choose and implement the right Java algorithm for each case.
**Outcome:** By the end of this chapter, you can apply Dijkstra's algorithm, Bellman-Ford, Floyd-Warshall, and 0-1 BFS correctly, and you can choose the right shortest-path algorithm from the graph constraints.

---

## 1. Intuition First

This chapter matters because "find the shortest path" is not one problem. It is a family of problems. The right algorithm depends on whether edges can be negative, whether you need one source or all pairs, and whether weights have special structure.

A simple real-world analogy is route planning:
- if all roads have nonnegative travel times, always extending the cheapest current route can be safe
- if some edges can reduce cost, greedy choices can become unsafe
- if every pair of cities matters, solving one source at a time may waste work
- if weights are only `0` or `1`, there is a special shortcut

The core mental model is relaxation. Relaxing an edge means checking whether reaching `v` through `u` gives a better distance than the best one known so far.

The most common beginner confusion point is treating shortest-path algorithms as interchangeable. They are not. Dijkstra's algorithm fails on negative edges. Floyd-Warshall is correct for all-pairs shortest paths on small graphs, but it is too expensive on large sparse graphs. 0-1 BFS is extremely fast, but only for weights `0` and `1`.

In the roadmap, the previous chapter showed that DAG structure can simplify shortest paths. This chapter removes that restriction and teaches the standard tools for general weighted graphs.

## 2. Core Concepts and Techniques

### Concept Cluster: Dijkstra's Algorithm
Key concepts in this block:
- 25.1 Dijkstra's algorithm

#### Intuition

Dijkstra's algorithm repeatedly commits to the not-yet-finalized node with the smallest current distance.

#### Why It Matters

It is the standard tool for single-source shortest paths when all edge weights are nonnegative.

#### How It Works

Algorithm:
- initialize all distances to infinity except the source
- use a min-priority queue keyed by current best distance
- pop the node with smallest tentative distance
- relax all outgoing edges
- if a shorter distance is found for a neighbor, push the improved state

The key correctness idea is that once the smallest tentative distance is popped, no later path can improve it if all edge weights are nonnegative.

#### Java Implementation Notes

- Use `PriorityQueue<State>`.
- Use `long[] distance`.
- Skip stale queue entries where the stored distance is not the current best one.

#### Common Mistakes

- using Dijkstra on negative edges
- forgetting stale-entry checks
- treating the graph as undirected when the input is directed
- using `int` when path sums may overflow

#### Quick Example

Edges:
- `0 -> 1` with `4`
- `0 -> 2` with `1`
- `2 -> 1` with `2`

From source `0`:
- first finalize `0`
- then finalize `2` with distance `1`
- then improve `1` from `4` to `3`

#### Debugging Tip

Whenever Dijkstra gives a wrong result, inspect the edge weights first. A single negative edge invalidates the greedy guarantee.

#### Advanced Note

A simple `O(V^2)` version exists with arrays instead of a priority queue. It can be reasonable for dense graphs or very small `V`.

### Concept Cluster: Bellman-Ford Algorithm
Key concepts in this block:
- 25.2 Bellman-Ford algorithm

#### Intuition

Bellman-Ford improves distances by edge count. After one full pass, it knows the best path using at most one edge more than before.

#### Why It Matters

It handles negative edge weights and can detect negative cycles reachable from the source.

#### How It Works

Algorithm:
- initialize distances
- repeat `V - 1` times:
- try relaxing every edge
- if nothing changes in a pass, stop early
- do one extra pass to detect whether any distance can still improve

If a reachable distance improves on the extra pass, there is a reachable negative cycle.

#### Java Implementation Notes

- An edge list is often simpler than an adjacency list here.
- Only relax an edge if the source endpoint is already reachable.
- Early stopping is a useful optimization.

#### Common Mistakes

- doing too few passes
- detecting negative cycles that are not reachable from the chosen source
- forgetting to guard against adding to infinity

#### Quick Example

Edges:
- `0 -> 1` with `4`
- `1 -> 2` with `-2`
- `0 -> 2` with `5`

After the first pass:
- distance to `1` becomes `4`
- distance to `2` becomes `2` through `1`, not `5` directly

#### Debugging Tip

Print the full distance array after each pass. Bellman-Ford bugs are often pass-order or initialization bugs.

#### Advanced Note

A limited-pass Bellman-Ford pattern also appears in problems with a bound on stops or edges.

### Concept Cluster: Floyd-Warshall Algorithm
Key concepts in this block:
- 25.3 Floyd-Warshall algorithm

#### Intuition

Floyd-Warshall asks whether allowing one more intermediate node improves any shortest path.

#### Why It Matters

It solves all-pairs shortest paths in a clean dynamic-programming form and works well when `V` is small enough for `O(V^3)`.

#### How It Works

Let `distance[i][j]` mean the current best distance from `i` to `j`.

Then for each possible intermediate node `k`, update:
- `distance[i][j] = min(distance[i][j], distance[i][k] + distance[k][j])`

After processing all `k`, every shortest path that uses any subset of nodes as intermediates has been considered.

#### Java Implementation Notes

- Use a `long[][]` matrix.
- Initialize `distance[i][i] = 0`.
- If multiple edges exist between the same pair, keep the minimum one.
- Guard against adding infinity values.

#### Common Mistakes

- overflow when adding two "infinity" sentinels
- forgetting that the algorithm is naturally all-pairs, not just one source
- using it on graphs too large for `O(V^3)`

#### Quick Example

If:
- `0 -> 1 = 5`
- `1 -> 2 = 3`
- `0 -> 2 = 20`

Then when `1` is allowed as an intermediate node, `0 -> 2` improves from `20` to `8`.

#### Debugging Tip

When one matrix entry looks wrong, inspect the exact `via` node that should have improved it.

#### Advanced Note

Negative cycles can be detected if some diagonal entry `distance[i][i]` becomes negative.

### Concept Cluster: 0-1 BFS and Algorithm Selection
Key concepts in this block:
- 25.4 0-1 BFS
- 25.5 Choosing the right shortest-path algorithm

#### Intuition

If every edge weight is either `0` or `1`, a deque can replace the priority queue.

#### Why It Matters

0-1 BFS runs in linear time and is often much faster and simpler than generic shortest-path logic for binary-weight graphs.

#### How It Works

0-1 BFS:
- start from the source with distance `0`
- use a deque
- when relaxing a `0`-weight edge, push the neighbor to the front
- when relaxing a `1`-weight edge, push the neighbor to the back

Algorithm choice:
- Dijkstra: nonnegative weights, single source
- Bellman-Ford: negative edges or negative-cycle detection
- Floyd-Warshall: all pairs on small or dense graphs
- 0-1 BFS: edge weights only `0` and `1`

#### Java Implementation Notes

- Use `ArrayDeque<Integer>`.
- Do not use a normal BFS queue for weighted edges, even if the weights are small.
- Keep the same relaxation mindset as Dijkstra, just with a deque instead of a min-heap.

#### Common Mistakes

- applying plain BFS to `0/1` weighted graphs
- using Dijkstra when 0-1 BFS would be simpler and faster
- forgetting whether the problem uses `< limit`, `<= limit`, or exact edge cost conditions

#### Quick Example

If:
- `0 -> 1` costs `0`
- `0 -> 2` costs `1`
- `1 -> 2` costs `1`

Then `1` should be processed before `2`, even though both are discovered from `0`, because the path to `1` has lower total cost.

#### Debugging Tip

If 0-1 BFS behaves like ordinary BFS, check whether you always use `offerLast`. Zero-cost moves must go to the front.

#### Advanced Note

The broader idea is bucketed shortest-path processing. 0-1 BFS is the simplest and most common special case.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Single-Source Shortest Paths with Dijkstra's Algorithm
#### Problem Statement

Given a directed weighted graph with nonnegative edge weights and a source node, return the shortest distance from the source to every node.

#### Why This Example Matters

This is the default shortest-path problem when weights are nonnegative.

#### Constraints or Assumptions

- all edge weights are nonnegative
- the graph may be disconnected
- unreachable nodes should remain at infinity

#### Brute-Force Approach

Enumerate all simple paths from the source and keep the shortest one to each destination.

That is exponential and not realistic even on moderate graphs.

#### Better Approach

Use Dijkstra's algorithm with a min-priority queue.

#### Why the Better Approach Works

The next node removed from the priority queue has the smallest tentative distance. Because all remaining edges are nonnegative, no later route can beat that distance.

#### Pragmatic Java Choice

Use:
- an adjacency list
- a `PriorityQueue` of `(node, distance)` states
- stale-entry skipping instead of a separate finalized set

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.PriorityQueue;

class DijkstraShortestPathExample {
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
        final long distance;

        State(int node, long distance) {
            this.node = node;
            this.distance = distance;
        }

        @Override
        public int compareTo(State other) {
            return Long.compare(this.distance, other.distance);
        }
    }

    static long[] shortestPaths(int nodeCount, int[][] edges, int source) {
        List<List<Edge>> graph = new ArrayList<>();
        for (int node = 0; node < nodeCount; node++) {
            graph.add(new ArrayList<>());
        }

        for (int[] edge : edges) {
            graph.get(edge[0]).add(new Edge(edge[1], edge[2]));
        }

        long infinity = Long.MAX_VALUE / 4;
        long[] distance = new long[nodeCount];
        Arrays.fill(distance, infinity);
        distance[source] = 0L;

        PriorityQueue<State> priorityQueue = new PriorityQueue<>();
        priorityQueue.offer(new State(source, 0L));

        while (!priorityQueue.isEmpty()) {
            State current = priorityQueue.poll();
            if (current.distance != distance[current.node]) {
                continue;
            }

            for (Edge edge : graph.get(current.node)) {
                long candidate = current.distance + edge.weight;
                if (candidate < distance[edge.to]) {
                    distance[edge.to] = candidate;
                    priorityQueue.offer(new State(edge.to, candidate));
                }
            }
        }

        return distance;
    }
}
```

#### Dry Run

Input:
- source `0`
- edges:
- `[0, 1, 4]`
- `[0, 2, 1]`
- `[2, 1, 2]`
- `[1, 3, 1]`
- `[2, 3, 5]`
- `[3, 4, 3]`

Process:
- start with distances `[0, inf, inf, inf, inf]`
- pop `0`, relax to `[0, 4, 1, inf, inf]`
- pop `2`, improve `1` to `3`, set `3` to `6`
- pop `1`, improve `3` to `4`
- pop `3`, set `4` to `7`

Final distances:
- `[0, 3, 1, 4, 7]`

#### Time and Space Complexity

Brute force:
- Time: exponential
- Space: path-recursion dependent

Dijkstra with priority queue:
- Time: `O((V + E) log V)`
- Space: `O(V + E)`

#### Edge Cases

- unreachable nodes
- multiple edges between the same pair
- zero-weight edges
- source with no outgoing edges

#### Common Mistakes

- using Dijkstra on a graph with negative edges
- failing to skip stale priority-queue entries
- forgetting whether the graph is directed or undirected

### Worked Example 2: Negative Edges and Cycle Detection with Bellman-Ford
#### Problem Statement

Given a directed weighted graph and a source node, compute shortest distances and report whether a negative cycle is reachable from the source.

#### Why This Example Matters

This is the standard fallback when negative weights appear.

#### Constraints or Assumptions

- edge weights may be negative
- the graph may be disconnected
- only negative cycles reachable from the source matter for the returned answer

#### Brute-Force Approach

Enumerate all simple source-to-destination paths and take the minimum path weight.

That is again exponential and gives no clean way to reason about negative cycles.

#### Better Approach

Use Bellman-Ford on the edge list.

#### Why the Better Approach Works

After `k` passes, Bellman-Ford has considered all shortest paths that use at most `k` edges. Any simple shortest path uses at most `V - 1` edges. If an extra pass still improves a reachable distance, some cycle must be reducing cost.

#### Pragmatic Java Choice

Use:
- an edge list instead of nested adjacency traversal
- `long[] distance`
- early stopping when a pass makes no changes

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class BellmanFordExample {
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

    static final class Result {
        final long[] distance;
        final boolean hasReachableNegativeCycle;

        Result(long[] distance, boolean hasReachableNegativeCycle) {
            this.distance = distance;
            this.hasReachableNegativeCycle = hasReachableNegativeCycle;
        }
    }

    static Result shortestPaths(int nodeCount, int[][] edgesArray, int source) {
        List<Edge> edges = new ArrayList<>();
        for (int[] edge : edgesArray) {
            edges.add(new Edge(edge[0], edge[1], edge[2]));
        }

        long infinity = Long.MAX_VALUE / 4;
        long[] distance = new long[nodeCount];
        Arrays.fill(distance, infinity);
        distance[source] = 0L;

        for (int pass = 1; pass <= nodeCount - 1; pass++) {
            boolean changed = false;

            for (Edge edge : edges) {
                if (distance[edge.from] == infinity) {
                    continue;
                }

                long candidate = distance[edge.from] + edge.weight;
                if (candidate < distance[edge.to]) {
                    distance[edge.to] = candidate;
                    changed = true;
                }
            }

            if (!changed) {
                break;
            }
        }

        boolean hasReachableNegativeCycle = false;
        for (Edge edge : edges) {
            if (distance[edge.from] == infinity) {
                continue;
            }

            if (distance[edge.from] + edge.weight < distance[edge.to]) {
                hasReachableNegativeCycle = true;
                break;
            }
        }

        return new Result(distance, hasReachableNegativeCycle);
    }
}
```

#### Dry Run

Input:
- source `0`
- edges:
- `[0, 1, 4]`
- `[0, 2, 5]`
- `[1, 2, -2]`
- `[2, 3, 3]`
- `[1, 3, 6]`

Pass 1:
- `distance[1] = 4`
- `distance[2] = 5`
- then improve `distance[2]` to `2` through `1`
- set `distance[3] = 5` through `2`

Pass 2:
- no further improvement

Final distances:
- `[0, 4, 2, 5]`

Extra pass:
- no change, so no reachable negative cycle

#### Time and Space Complexity

Brute force:
- Time: exponential
- Space: path-recursion dependent

Bellman-Ford:
- Time: `O(VE)`
- Space: `O(V + E)`

#### Edge Cases

- negative edges but no negative cycle
- negative cycle unreachable from the source
- self-loop with negative weight
- disconnected nodes

#### Common Mistakes

- forgetting the extra pass for negative-cycle detection
- treating every negative edge as a negative cycle
- relaxing from nodes that are still unreachable

### Worked Example 3: All-Pairs Shortest Paths with Floyd-Warshall
#### Problem Statement

Given a directed weighted graph with `nodeCount` nodes, compute the shortest distance between every ordered pair of nodes.

#### Why This Example Matters

Some problems ask many shortest-path queries across the same graph. Running a single-source algorithm over and over may be the wrong abstraction.

#### Constraints or Assumptions

- graph size should be small enough for `O(V^3)`
- edge weights may be negative if there is no relevant negative cycle
- multiple edges between the same nodes may exist

#### Brute-Force Approach

Run a single-source shortest-path algorithm separately from every source node.

That can work, but it repeats setup and reasoning for each source. Floyd-Warshall is often cleaner when all pairs matter and `V` is small.

#### Better Approach

Use Floyd-Warshall dynamic programming.

#### Why the Better Approach Works

At step `k`, the algorithm decides whether paths are better when they are allowed to go through node `k` as an intermediate. After all `k`, every possible intermediate set has been considered.

#### Pragmatic Java Choice

Use:
- a `long[][] distance` matrix
- a large infinity sentinel
- direct initialization from the edge list

#### Java Solution

```java
import java.util.Arrays;

class FloydWarshallExample {
    static long[][] allPairsShortestPaths(int nodeCount, int[][] edges) {
        long infinity = Long.MAX_VALUE / 4;
        long[][] distance = new long[nodeCount][nodeCount];

        for (int from = 0; from < nodeCount; from++) {
            Arrays.fill(distance[from], infinity);
            distance[from][from] = 0L;
        }

        for (int[] edge : edges) {
            int from = edge[0];
            int to = edge[1];
            int weight = edge[2];
            distance[from][to] = Math.min(distance[from][to], weight);
        }

        for (int via = 0; via < nodeCount; via++) {
            for (int from = 0; from < nodeCount; from++) {
                if (distance[from][via] == infinity) {
                    continue;
                }

                for (int to = 0; to < nodeCount; to++) {
                    if (distance[via][to] == infinity) {
                        continue;
                    }

                    long candidate = distance[from][via] + distance[via][to];
                    if (candidate < distance[from][to]) {
                        distance[from][to] = candidate;
                    }
                }
            }
        }

        return distance;
    }

    static boolean hasNegativeCycle(long[][] distance) {
        for (int node = 0; node < distance.length; node++) {
            if (distance[node][node] < 0) {
                return true;
            }
        }
        return false;
    }
}
```

#### Dry Run

Input edges:
- `[0, 1, 5]`
- `[1, 2, 3]`
- `[2, 3, 1]`
- `[0, 3, 10]`

Initial key entries:
- `distance[0][3] = 10`
- `distance[0][1] = 5`
- `distance[1][2] = 3`
- `distance[2][3] = 1`

When `via = 1`:
- `distance[0][2]` improves from infinity to `8`

When `via = 2`:
- `distance[0][3]` improves from `10` to `9`
- `distance[1][3]` becomes `4`

#### Time and Space Complexity

Brute-force repeated single-source approach:
- Time: depends on the chosen single-source algorithm
- Space: depends on that algorithm

Floyd-Warshall:
- Time: `O(V^3)`
- Space: `O(V^2)`

#### Edge Cases

- multiple edges between the same pair
- unreachable pairs
- negative edges
- negative cycles, detectable by a negative diagonal entry

#### Common Mistakes

- forgetting to keep the minimum direct edge
- overflow from adding two infinity values
- using Floyd-Warshall on graphs too large for cubic time

### Worked Example 4: Binary-Weight Shortest Paths with 0-1 BFS
#### Problem Statement

Given a directed graph where every edge weight is either `0` or `1`, compute the shortest distance from a source node to every node.

#### Why This Example Matters

It teaches a specialized but extremely useful optimization. Many interview problems hide `0/1` weights behind costs like free moves versus paid moves.

#### Constraints or Assumptions

- every edge weight is exactly `0` or `1`
- the graph may be disconnected
- the graph may be directed or undirected depending on the problem statement

#### Brute-Force Approach

Use Dijkstra's algorithm with a priority queue.

That is correct, but it does more work than needed because the weights have only two possibilities.

#### Better Approach

Use 0-1 BFS with a deque.

#### Why the Better Approach Works

A `0`-cost move should be processed before any pending `1`-cost move at the same current distance frontier. A deque is enough to maintain that order.

#### Pragmatic Java Choice

Use:
- an adjacency list
- an `ArrayDeque<Integer>`
- a `long[] distance` array

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;

class ZeroOneBfsExample {
    private static final class Edge {
        final int to;
        final int weight;

        Edge(int to, int weight) {
            this.to = to;
            this.weight = weight;
        }
    }

    static long[] shortestPaths(int nodeCount, int[][] edges, int source) {
        List<List<Edge>> graph = new ArrayList<>();
        for (int node = 0; node < nodeCount; node++) {
            graph.add(new ArrayList<>());
        }

        for (int[] edge : edges) {
            graph.get(edge[0]).add(new Edge(edge[1], edge[2]));
        }

        long infinity = Long.MAX_VALUE / 4;
        long[] distance = new long[nodeCount];
        Arrays.fill(distance, infinity);
        distance[source] = 0L;

        Deque<Integer> deque = new ArrayDeque<>();
        deque.offerFirst(source);

        while (!deque.isEmpty()) {
            int node = deque.pollFirst();

            for (Edge edge : graph.get(node)) {
                long candidate = distance[node] + edge.weight;
                if (candidate < distance[edge.to]) {
                    distance[edge.to] = candidate;
                    if (edge.weight == 0) {
                        deque.offerFirst(edge.to);
                    } else {
                        deque.offerLast(edge.to);
                    }
                }
            }
        }

        return distance;
    }
}
```

#### Dry Run

Input:
- source `0`
- edges:
- `[0, 1, 0]`
- `[0, 2, 1]`
- `[1, 2, 1]`
- `[1, 3, 0]`
- `[3, 4, 1]`

Process:
- start with deque `[0]`
- pop `0`, set `1` to `0` and push front, set `2` to `1` and push back
- deque is now `[1, 2]`
- pop `1`, set `3` to `0` and push front
- deque is now `[3, 2]`
- pop `3`, set `4` to `1`

Final distances:
- `[0, 0, 1, 0, 1]`

#### Time and Space Complexity

Dijkstra baseline:
- Time: `O((V + E) log V)`
- Space: `O(V + E)`

0-1 BFS:
- Time: `O(V + E)`
- Space: `O(V + E)`

#### Edge Cases

- source isolated from the rest of the graph
- multiple `0`-cost edges
- graph containing an accidental weight other than `0` or `1`
- directed versus undirected interpretation

#### Common Mistakes

- using a normal queue instead of a deque
- pushing zero-cost neighbors to the back
- assuming a node should be processed only once without checking distance improvements

## 4. Complexity and Decision Guide

The main trade-offs in this chapter are:

- Dijkstra's algorithm: `O((V + E) log V)`. Choose it for single-source shortest paths with nonnegative edges.
- Bellman-Ford algorithm: `O(VE)`. Choose it when negative edges exist or when reachable negative-cycle detection matters.
- Floyd-Warshall algorithm: `O(V^3)`. Choose it when all-pairs answers matter and `V` is small enough.
- 0-1 BFS: `O(V + E)`. Choose it when every edge weight is `0` or `1`.

Recognition signals:
- "nonnegative weighted graph" suggests Dijkstra
- "negative edges" suggests Bellman-Ford
- "all pairs" or "many source-target queries on a small graph" suggests Floyd-Warshall
- "free move versus paid move" or "binary weights" suggests 0-1 BFS

Signals not to force a technique:
- do not use Dijkstra with negative edges
- do not use Floyd-Warshall on large sparse graphs
- do not use plain BFS when weights are not all equal
- do not use Bellman-Ford by default when all weights are nonnegative and performance matters

A practical rule:
- first inspect the edge-weight restrictions
- then inspect whether the task is single-source or all-pairs
- then inspect graph size

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:
- wrong infinity initialization
- overflow when adding to infinity
- mixing directed and undirected interpretations
- forgetting stale-entry handling in Dijkstra
- forgetting the extra Bellman-Ford pass
- using the wrong push side in 0-1 BFS

Boundary handling:
- unreachable nodes should remain at infinity
- zero-weight edges are legal for Dijkstra and important for 0-1 BFS
- negative self-loops are immediate reachable negative cycles if the source can reach them
- Floyd-Warshall should start with `distance[i][i] = 0`

Short debugging checklist:
- verify edge-weight assumptions before choosing the algorithm
- verify the source starts with distance `0`
- verify relaxations only come from reachable states
- verify Dijkstra never sees a negative edge
- verify Bellman-Ford runs at most `V - 1` full passes before cycle check
- verify Floyd-Warshall guards infinity before addition
- verify 0-1 BFS pushes weight `0` edges to the front

## 6. Practice Problems

### Easy

- Title: Cheapest Path in a Nonnegative Directed Graph. One-line prompt: compute shortest distances from one source when every edge cost is nonnegative. Expected pattern or core idea: Dijkstra's algorithm.
- Title: Minimum Edge Reversals to Reach Destination. One-line prompt: follow existing directed edges for cost `0` and reverse an edge for cost `1`. Expected pattern or core idea: 0-1 BFS.
- Title: Dense City Map Queries. One-line prompt: answer many shortest-path queries between all city pairs in a small graph. Expected pattern or core idea: Floyd-Warshall.

### Medium

- Title: Network Delay Time. One-line prompt: compute how long it takes a signal to reach all nodes from one source. Expected pattern or core idea: Dijkstra's algorithm.
- Title: Cheapest Flights Within K Stops. One-line prompt: find the minimum flight cost with a bound on the number of edges used. Expected pattern or core idea: limited-pass Bellman-Ford style relaxation.
- Title: Path With Minimum Effort. One-line prompt: minimize the maximum step cost across a grid path. Expected pattern or core idea: Dijkstra on an implicit weighted graph.

### Hard

- Title: Detect Arbitrage or Negative Cycle in an Exchange Graph. One-line prompt: determine whether repeated exchanges can reduce cost without bound. Expected pattern or core idea: Bellman-Ford negative-cycle detection.
- Title: Minimum Cost to Make at Least One Valid Path in a Grid. One-line prompt: move freely along suggested directions and pay to deviate. Expected pattern or core idea: 0-1 BFS.
- Title: All-Pairs Routing Table for a Small Dense Network. One-line prompt: precompute shortest distances for every ordered pair. Expected pattern or core idea: Floyd-Warshall.

## 7. Short Recap

The core idea of this chapter is that shortest-path problems must be classified before they are solved.

The most important optimization insight is to match the algorithm to edge-weight structure:
- nonnegative weights: Dijkstra
- negative edges: Bellman-Ford
- all pairs: Floyd-Warshall
- weights `0/1`: 0-1 BFS

The most important implementation warning is that Dijkstra's algorithm is not safe with negative edges.

This chapter prepares the next chapter by moving from shortest routes between nodes to the cheapest way to connect an entire graph.

## 8. Coverage Check

- [x] 25.1 Dijkstra's algorithm
- [x] 25.2 Bellman-Ford algorithm
- [x] 25.3 Floyd-Warshall algorithm
- [x] 25.4 0-1 BFS
- [x] 25.5 Choosing the right shortest-path algorithm

Coverage Summary: 5/5 official subtopics covered
This must always be 5/5 before final output

Next: 26: Minimum Spanning Tree and Disjoint Set Union
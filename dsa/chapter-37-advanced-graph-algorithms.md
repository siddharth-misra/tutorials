# 37: Advanced Graph Algorithms

**Goal:** Teach how to reason about flows, cuts, state-expanded shortest paths, and richer graph models beyond standard traversal and shortest-path templates.
**Outcome:** By the end of this chapter, you can model max-flow problems, implement Edmonds-Karp, explain the max flow min cut relationship, solve shortest-path problems with additional state, and recognize advanced graph modeling patterns.

---

## 1. Intuition First

This chapter matters because some graph problems are not just about reaching nodes. They are about how much can move through a network, how constraints change what a node means, or how a real-world scenario should be modeled before any algorithm makes sense.

A simple real-world analogy is shipping goods through a network of pipes. Each pipe has a capacity. Sending more through one route may block what can still travel elsewhere. That is different from ordinary shortest-path thinking.

The core mental model is:

- choose the correct graph model first
- ask whether the task is about path length, path count, capacity, or a state-constrained journey
- run the algorithm that matches that model

The most common beginner confusion point is trying to force all advanced graph problems into plain BFS or Dijkstra. When capacities or extra state dimensions matter, the graph itself must be expanded or reinterpreted.

This chapter continues the Part VII focus on trade-offs and modeling discipline. The next chapter applies the same idea to advanced string algorithms.

## 2. Core Concepts and Techniques

### Concept Cluster: Flow Networks and Augmenting Paths
Key concepts in this block:
- 37.1 Flow network basics
- 37.2 Ford-Fulkerson
- 37.3 Edmonds-Karp

#### Intuition

A flow network has capacities on directed edges, a source where flow starts, and a sink where flow ends.

#### Why It Matters

Flow models solve transport, assignment, matching, and cut problems that ordinary shortest paths cannot express.

#### How It Works

Ford-Fulkerson repeatedly finds an augmenting path in the residual graph and pushes additional flow through it.

Edmonds-Karp is a specific Ford-Fulkerson strategy that always uses BFS to find the shortest augmenting path in edge count.

Residual graph idea:

- forward edges show remaining capacity
- backward edges show how much previous flow can be canceled or rerouted

#### Java Implementation Notes

- Maintain a residual-capacity matrix or adjacency lists with reverse edges.
- Always update both forward and backward capacities after augmentation.
- Use BFS parent tracking for Edmonds-Karp.

#### Common Mistakes

- forgetting reverse edges in the residual graph
- adding flow directly to the original graph without maintaining residual capacities
- assuming any path choice gives the same runtime behavior

#### Quick Example

If path `source -> A -> sink` has bottleneck capacity `3`, pushing `3` units reduces those forward capacities and increases reverse capacities by `3`.

#### Debugging Tip

After each augmentation, print the chosen path and bottleneck. Most max-flow bugs are residual-graph bugs.

#### Advanced Note

Edmonds-Karp improves the path-choice rule of Ford-Fulkerson to guarantee polynomial time.

### Concept Cluster: Cuts and State-Expanded Paths
Key concepts in this block:
- 37.4 Max flow min cut
- 37.5 Shortest path with state

#### Intuition

Max flow min cut says the maximum transport possible equals the minimum total capacity that separates source from sink. Shortest path with state treats each logical condition as part of the node identity.

#### Why It Matters

These ideas connect algorithmic results to modeling power. They let you solve problems with constraints like one coupon, one wall break, or limited special moves.

#### How It Works

Max flow min cut:

- after max flow finishes, nodes still reachable from the source in the residual graph form one side of the minimum cut

Shortest path with state:

- expand node identity from `node` to something like `(node, usedSpecialMove)` or `(row, col, breaksUsed)`
- run BFS or Dijkstra on that expanded graph

#### Java Implementation Notes

- The expanded-state graph is usually implicit, not fully materialized beforehand.
- Choose BFS for unweighted state transitions and Dijkstra for weighted ones.
- Keep state objects simple and hashable if using maps or sets.

#### Common Mistakes

- forgetting that visiting the same node with different state values is not the same state
- marking a physical node visited globally instead of by full state
- misunderstanding the cut after max-flow completion

#### Quick Example

In a grid where you may break one wall, `(2, 3, 0)` and `(2, 3, 1)` are different states because future options differ.

#### Debugging Tip

When the path result looks impossible, inspect whether the visited structure is keyed by full state rather than just raw node index.

#### Advanced Note

Many hard shortest-path problems become standard once the state expansion is modeled correctly.

### Concept Cluster: Richer Problem Modeling
Key concepts in this block:
- 37.6 Advanced graph modeling

#### Intuition

The hardest part of some graph problems is deciding what the graph should be.

#### Why It Matters

A correct model can turn a confusing real-world description into a clean matching, flow, or shortest-path problem.

#### How It Works

Common modeling moves:

- split one entity type into two sides to form bipartite graphs
- add source and sink to convert matching into max flow
- expand state to encode limited resources or mode changes
- create edges based on dependency, reachability, or compatibility rules

#### Java Implementation Notes

- Name node groups clearly when building modeled graphs.
- Keep conversion code separate from the chosen algorithm implementation.
- Verify the model on a tiny example before running the full solver.

#### Common Mistakes

- building too many edges because the compatibility rule is vague
- using weighted shortest path when the problem is actually a capacity problem
- losing the original problem meaning during modeling

#### Quick Example

Job assignment can be modeled as source -> worker -> job -> sink, with capacity `1` edges.

#### Debugging Tip

Draw the modeled graph for a three-entity example. If the graph does not reflect the rules exactly, the algorithm choice is irrelevant.

#### Advanced Note

Advanced graph problems are often won or lost at the modeling stage, not the implementation stage.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Maximum Flow with Edmonds-Karp
#### Problem Statement

Given a directed network with capacities, return the maximum flow from `source` to `sink`.

#### Why This Example Matters

This is the standard entry point to flow algorithms and residual reasoning.

#### Constraints or Assumptions

- capacities are nonnegative integers
- the graph is directed
- multiple augmenting paths may exist

#### Brute-Force Approach

Try to reason about all source-to-sink path combinations manually and guess how to split the flow.

That is not scalable and ignores residual rerouting.

#### Better Approach

Use Edmonds-Karp, the BFS-based version of Ford-Fulkerson.

#### Why the Better Approach Works

Each augmentation increases the total flow while respecting capacity and conservation rules. The residual graph makes rerouting possible when earlier choices need adjustment.

#### Pragmatic Java Choice

Use an adjacency list plus a residual-capacity matrix for clarity.

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class EdmondsKarpExample {
    static int maxFlow(int nodeCount, int[][] edges, int source, int sink) {
        int[][] residual = new int[nodeCount][nodeCount];
        List<Integer>[] graph = new ArrayList[nodeCount];
        for (int node = 0; node < nodeCount; node++) {
            graph[node] = new ArrayList<>();
        }

        for (int[] edge : edges) {
            int from = edge[0];
            int to = edge[1];
            int capacity = edge[2];
            residual[from][to] += capacity;
            graph[from].add(to);
            graph[to].add(from);
        }

        int totalFlow = 0;
        int[] parent = new int[nodeCount];

        while (bfs(graph, residual, source, sink, parent)) {
            int pathFlow = Integer.MAX_VALUE;
            for (int node = sink; node != source; node = parent[node]) {
                pathFlow = Math.min(pathFlow, residual[parent[node]][node]);
            }

            for (int node = sink; node != source; node = parent[node]) {
                int previous = parent[node];
                residual[previous][node] -= pathFlow;
                residual[node][previous] += pathFlow;
            }

            totalFlow += pathFlow;
        }

        return totalFlow;
    }

    private static boolean bfs(List<Integer>[] graph, int[][] residual, int source, int sink, int[] parent) {
        Arrays.fill(parent, -1);
        parent[source] = source;
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        queue.add(source);

        while (!queue.isEmpty()) {
            int node = queue.remove();
            for (int next : graph[node]) {
                if (parent[next] == -1 && residual[node][next] > 0) {
                    parent[next] = node;
                    if (next == sink) {
                        return true;
                    }
                    queue.add(next);
                }
            }
        }

        return false;
    }
}
```

#### Dry Run

If BFS finds path `source -> 1 -> 3 -> sink` with bottleneck `4`:

- add `4` to total flow
- reduce each forward residual capacity on that path by `4`
- increase each reverse residual capacity by `4`

The algorithm repeats until no augmenting path remains.

#### Time and Space Complexity

Naive manual path reasoning:

- Time: not practical as a general algorithm
- Space: not meaningful as a reusable method

Edmonds-Karp:

- Time: `O(V * E^2)`
- Space: `O(V^2)` with a residual matrix in this implementation, plus adjacency storage

#### Edge Cases

- no path from source to sink
- multiple edges between the same nodes
- already saturated critical edge

#### Common Mistakes

- forgetting reverse-capacity updates
- not combining parallel edge capacities correctly
- treating the residual graph as the original graph

### Worked Example 2: Maximum Bipartite Matching via Max Flow
#### Problem Statement

Given workers and jobs, where each worker can perform certain jobs, return the maximum number of worker-job assignments such that each worker and job is used at most once.

#### Why This Example Matters

This is a strong modeling example. It shows how a matching problem becomes a max-flow problem.

#### Constraints or Assumptions

- each worker can take at most one job
- each job can be assigned to at most one worker
- compatibility pairs are given

#### Brute-Force Approach

Try all compatible assignment combinations recursively.

That grows combinatorially.

#### Better Approach

Build a flow network:

- source -> each worker with capacity `1`
- compatible worker -> job edges with capacity `1`
- each job -> sink with capacity `1`

#### Why the Better Approach Works

Any unit of flow corresponds to one valid assignment, and capacities enforce the one-worker-one-job rule.

#### Pragmatic Java Choice

Reuse the max-flow solver after building the modeled graph.

#### Java Solution

```java
class BipartiteMatchingFlowExample {
    static int maximumMatching(int workerCount, int jobCount, int[][] compatiblePairs) {
        int source = 0;
        int workerOffset = 1;
        int jobOffset = workerOffset + workerCount;
        int sink = jobOffset + jobCount;
        int[][] edges = new int[workerCount + jobCount + compatiblePairs.length][3];
        int edgeIndex = 0;

        for (int worker = 0; worker < workerCount; worker++) {
            edges[edgeIndex++] = new int[] {source, workerOffset + worker, 1};
        }

        for (int[] pair : compatiblePairs) {
            int worker = pair[0];
            int job = pair[1];
            edges[edgeIndex++] = new int[] {workerOffset + worker, jobOffset + job, 1};
        }

        for (int job = 0; job < jobCount; job++) {
            edges[edgeIndex++] = new int[] {jobOffset + job, sink, 1};
        }

        return EdmondsKarpExample.maxFlow(sink + 1, edges, source, sink);
    }
}
```

#### Dry Run

Suppose:

- worker `0` can do jobs `0` and `1`
- worker `1` can do job `1`

Then each successful unit of flow from source to sink passes through one worker and one job. If two units of flow reach the sink, two assignments exist.

#### Time and Space Complexity

Brute-force assignment search:

- Time: exponential in the worst case
- Space: `O(workerCount)` recursion depth

Flow-based solution with Edmonds-Karp:

- Time: polynomial in the constructed graph size, using the underlying max-flow bound
- Space: polynomial in node and edge count

#### Edge Cases

- no compatible edges
- more workers than jobs
- duplicate compatibility pairs

#### Common Mistakes

- forgetting source or sink capacity edges
- giving worker-job edges capacity greater than `1` without justification
- mixing worker and job index ranges in the modeled graph

### Worked Example 3: Shortest Path with One Wall Break
#### Problem Statement

Given a grid of `0`s and `1`s, where `1` means wall, return the shortest path length from top-left to bottom-right if you may break at most one wall.

#### Why This Example Matters

This is a clean shortest-path-with-state problem. The key difficulty is not BFS itself, but modeling `(row, col, wallBreakUsed)` as the node.

#### Constraints or Assumptions

- moving up, down, left, or right costs `1`
- at most one wall may be broken
- return `-1` if no valid path exists

#### Brute-Force Approach

Try all paths while tracking whether a wall has already been broken.

That is exponential and repeats many states.

#### Better Approach

Run BFS on expanded states.

#### Why the Better Approach Works

The graph is still unweighted, but each physical cell now has two logical versions:

- not yet used the wall break
- already used the wall break

#### Pragmatic Java Choice

Use a queue of state arrays and a three-dimensional visited array.

#### Java Solution

```java
import java.util.ArrayDeque;

class GridWallBreakBfsExample {
    static int shortestPath(int[][] grid) {
        int rows = grid.length;
        int cols = grid[0].length;
        boolean[][][] visited = new boolean[rows][cols][2];
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        queue.add(new int[] {0, 0, 0, 0});
        visited[0][0][0] = true;

        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        while (!queue.isEmpty()) {
            int[] current = queue.remove();
            int row = current[0];
            int col = current[1];
            int usedBreak = current[2];
            int distance = current[3];

            if (row == rows - 1 && col == cols - 1) {
                return distance;
            }

            for (int[] direction : directions) {
                int nextRow = row + direction[0];
                int nextCol = col + direction[1];

                if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
                    continue;
                }

                int nextUsedBreak = usedBreak;
                if (grid[nextRow][nextCol] == 1) {
                    if (usedBreak == 1) {
                        continue;
                    }
                    nextUsedBreak = 1;
                }

                if (!visited[nextRow][nextCol][nextUsedBreak]) {
                    visited[nextRow][nextCol][nextUsedBreak] = true;
                    queue.add(new int[] {nextRow, nextCol, nextUsedBreak, distance + 1});
                }
            }
        }

        return -1;
    }
}
```

#### Dry Run

If the first promising path hits one wall:

- move into that wall cell using the one allowed break
- continue BFS from state `(row, col, 1)`
- later revisiting the same cell with break state `0` would still be different and potentially useful

That distinction is the whole reason ordinary BFS on plain cells is insufficient.

#### Time and Space Complexity

Brute-force path search:

- Time: exponential in the worst case
- Space: depends on recursion depth and visited-path tracking

Expanded-state BFS:

- Time: `O(rows * cols)` because each cell-state pair is processed at most once
- Space: `O(rows * cols)`

#### Edge Cases

- start or end cell handling when one is a wall
- no path even after one break
- shortest path that never uses the break

#### Common Mistakes

- using a two-dimensional visited array instead of tracking the break state
- marking a cell visited too aggressively across both states
- forgetting to stop wall-breaking after the first use

## 4. Complexity and Decision Guide

Advanced graph problems split mainly by what the graph represents.

- max flow algorithms solve capacity and assignment problems, not shortest-distance problems
- state-expanded BFS or Dijkstra solves constrained movement problems where the node identity includes extra information
- advanced graph modeling is often the real bottleneck, because a poor model leads to the wrong algorithm

When to choose brute force:

- tiny networks or tiny compatibility sets while discovering the model
- small constrained-state examples used only to verify correctness reasoning

When to optimize:

- capacities or assignments make plain traversal meaningless
- the same node must be revisited under different resource states
- the problem naturally describes conservation, blocking, or matching

Recognition signals:

- source, sink, capacity, assignment, or throughput suggests flow
- one coupon, one wall break, one mode switch, or limited resource suggests shortest path with state
- bipartite choices or one-to-one assignments often suggest flow-based modeling or matching

Signals not to force these techniques:

- a plain unweighted reachability problem that BFS already solves
- a standard weighted graph problem with no extra state, where Dijkstra is sufficient
- a problem where the modeled graph size explodes because the state is not compressed properly

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- residual graph updates missing reverse capacity
- treating revisited stateful nodes as duplicates when their state differs
- forgetting to preserve original problem constraints in the graph model
- mixing capacity problems with distance problems

Short debugging checklist:

- draw the graph model for a tiny example
- for flow, print each augmenting path and bottleneck
- for state-expanded shortest paths, print the full state tuple being visited
- verify that the visited structure matches the full logical state
- after max flow, inspect residual reachability if a cut interpretation is needed

## 6. Practice Problems

### Easy

**Title:** Basic Max Flow Network  
**Prompt:** Compute the maximum flow in a small directed capacity network.  
**Expected pattern or core idea:** Residual graph and Edmonds-Karp.

**Title:** One Special Move Grid  
**Prompt:** Reach the destination in a grid when one blocked cell may be bypassed.  
**Expected pattern or core idea:** BFS on expanded state.

**Title:** Bipartite Matching Starter  
**Prompt:** Match people to tasks with one-to-one constraints.  
**Expected pattern or core idea:** Graph modeling into a matching or flow problem.

### Medium

**Title:** Max Flow Min Cut Interpretation  
**Prompt:** Find the minimum cut edges after computing a maximum flow.  
**Expected pattern or core idea:** Residual reachability after max flow.

**Title:** Shortest Path with Discount Coupon  
**Prompt:** Reach a destination where one edge may be taken at reduced cost.  
**Expected pattern or core idea:** Dijkstra or BFS with extra state dimension.

**Title:** Course Assignment Variant  
**Prompt:** Assign students to courses under one-seat and compatibility constraints.  
**Expected pattern or core idea:** Advanced graph modeling into flow.

### Hard

**Title:** Multiple Resource Constrained Path  
**Prompt:** Find a shortest path while tracking fuel, coupons, or permissions.  
**Expected pattern or core idea:** State-expanded shortest path with careful compression.

**Title:** Minimum Edge Cut Construction  
**Prompt:** Identify a minimum-capacity cut separating source and sink.  
**Expected pattern or core idea:** Max flow min cut theorem in practice.

**Title:** Scheduling as Flow Network  
**Prompt:** Model a richer allocation problem with capacities across multiple layers.  
**Expected pattern or core idea:** Multi-layer graph modeling and flow reasoning.

## 7. Short Recap

The core idea is that advanced graph algorithms depend on choosing the right graph meaning before coding anything. The most important optimization insight is that capacities call for flow, while constrained movement often calls for state-expanded shortest paths. The most important implementation warning is to keep residual or state information faithful to the real constraints. This prepares the next chapter, where string problems demand the same modeling care with prefixes, hashes, and automaton-style matching.

## 8. Coverage Check

- 37.1 Flow network basics - Covered
- 37.2 Ford-Fulkerson - Covered
- 37.3 Edmonds-Karp - Covered
- 37.4 Max flow min cut - Covered
- 37.5 Shortest path with state - Covered
- 37.6 Advanced graph modeling - Covered

Coverage Summary: 6/6 official subtopics covered

Next: Advanced String Algorithms
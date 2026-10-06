# 23: Graph Traversal

**Goal:** Teach how to explore graphs systematically using BFS and DFS, and how traversal solves reachability, connected components, cycle detection, and bipartite checking in Java.
**Outcome:** By the end of this chapter, you can implement BFS and DFS cleanly, count connected components, detect cycles, check bipartite structure, and reuse robust Java traversal templates across graph problems.

---

## 1. Intuition First

Once a graph is modeled correctly, the next question is simple: how do you move through it without missing nodes or getting stuck in cycles?

A simple real-world analogy is exploring a building:
- BFS explores room by room, outward in layers from the starting room
- DFS goes down one hallway as far as possible before backing up

The core mental model is this:
- traversal needs a frontier of work
- BFS uses a queue and explores by distance in edges
- DFS uses recursion or an explicit stack and explores deeply first
- a visited structure prevents repeated work and infinite loops

The most common beginner confusion point is marking visited too late. If you do that carelessly, nodes may enter the queue or recursion many times.

In the roadmap, this chapter turns graph representation into graph movement. The next chapter narrows that movement to directed acyclic graphs and ordering constraints.

## 2. Core Concepts and Techniques

### Concept Cluster: Two Fundamental Traversals
Key concepts in this block:
- 23.1 Breadth-first search
- 23.2 Depth-first search

#### Intuition

BFS explores by layers. DFS explores by depth. They answer different questions naturally.

#### Why It Matters

BFS is usually the first choice for:
- shortest path in an unweighted graph
- layer-by-layer expansion
- minimum number of moves

DFS is usually the first choice for:
- structural exploration
- recursion-friendly search
- component counting
- many cycle and backtracking patterns

#### How It Works

BFS:
- start from a source
- mark it visited
- push it into a queue
- repeatedly pop from the queue and push unvisited neighbors

DFS:
- start from a source
- mark it visited
- recursively or iteratively visit each unvisited neighbor before returning

#### Java Implementation Notes

- `ArrayDeque<Integer>` is a good queue for BFS.
- Recursive DFS is simple, but deep graphs may risk stack overflow.
- Adjacency lists are usually the most natural representation for traversal.
- Mark visited as soon as you decide to process a node, not after exploring all neighbors.

#### Common Mistakes

- marking visited too late in BFS
- forgetting disconnected components
- assuming DFS finds shortest paths in unweighted graphs
- using recursion without considering graph depth

#### Quick Example

Graph:
- `0 -> [1, 2]`
- `1 -> [3]`
- `2 -> [4]`

From `0`:
- BFS order is `0, 1, 2, 3, 4`
- one valid DFS order is `0, 1, 3, 2, 4`

#### Debugging Tip

For BFS, print the queue after each pop. For DFS, print `(node, parent)` at entry and exit.

#### Advanced Note

Traversal order can vary if neighbor lists are in different orders. The correctness condition is usually about coverage, not one exact order.

### Concept Cluster: Structure from Traversal
Key concepts in this block:
- 23.3 Connected components
- 23.4 Cycle detection

#### Intuition

Traversal does more than visit nodes. It reveals the shape of the graph.

#### Why It Matters

Connected components tell you how many disconnected regions exist. Cycle detection tells you whether some path loops back in a problematic way.

#### How It Works

Connected components in an undirected graph:
- loop through all nodes
- if a node is unvisited, start a traversal
- that one traversal covers exactly one component

Cycle detection:
- undirected graph: track the parent; visiting an already visited neighbor that is not the parent means a cycle
- directed graph: often use a recursion stack or three-state marking

#### Java Implementation Notes

- Use one outer loop for all nodes, not just one source.
- Keep parent information when checking cycles in undirected graphs.
- For directed cycles, a three-state array is often cleaner than a plain visited array.

#### Common Mistakes

- assuming one BFS or DFS from node `0` covers the full graph
- treating the parent edge in an undirected graph as a cycle
- mixing directed and undirected cycle logic

#### Quick Example

If the graph has edges:
- `(0, 1)`, `(1, 2)`, `(2, 0)`, `(3, 4)`

Then:
- `{0, 1, 2}` is one connected component with a cycle
- `{3, 4}` is another connected component without a cycle

#### Debugging Tip

When cycle detection looks wrong, inspect one component at a time and write down the parent relationship for each edge visit.

#### Advanced Note

Directed cycle detection becomes especially important in the next chapter, where topological ordering only works on DAGs.

### Concept Cluster: Coloring and Reusable Templates
Key concepts in this block:
- 23.5 Bipartite graph check
- 23.6 Java traversal templates

#### Intuition

A graph is bipartite if you can color its nodes with two colors so that every edge connects different colors.

#### Why It Matters

Bipartite checking appears in scheduling, conflict modeling, and parity-style constraints. It is also a good test of whether you truly understand traversal state.

#### How It Works

Use BFS or DFS to color:
- start an unvisited node with color `0`
- every neighbor must get the opposite color
- if a neighbor already has the same color, the graph is not bipartite

Because the graph may be disconnected, repeat this for every component.

#### Java Implementation Notes

- Use `int[] color` with values like `-1`, `0`, and `1`.
- Reusable traversal templates should separate:
  - graph representation
  - visited or color state
  - node-processing logic

#### Common Mistakes

- checking only one component
- forgetting that a self-loop immediately breaks bipartiteness
- mixing visited state and color state carelessly

#### Quick Example

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

class GraphTraversalTemplatesQuickExample {
    static List<Integer> bfsOrder(List<List<Integer>> graph, int start) {
        List<Integer> order = new ArrayList<>();
        boolean[] visited = new boolean[graph.size()];
        Queue<Integer> queue = new ArrayDeque<>();

        visited[start] = true;
        queue.offer(start);

        while (!queue.isEmpty()) {
            int node = queue.poll();
            order.add(node);

            for (int neighbor : graph.get(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                }
            }
        }
        return order;
    }

    static List<Integer> dfsOrder(List<List<Integer>> graph, int start) {
        List<Integer> order = new ArrayList<>();
        boolean[] visited = new boolean[graph.size()];
        dfs(start, graph, visited, order);
        return order;
    }

    private static void dfs(int node, List<List<Integer>> graph, boolean[] visited, List<Integer> order) {
        visited[node] = true;
        order.add(node);

        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                dfs(neighbor, graph, visited, order);
            }
        }
    }
}
```

#### Debugging Tip

When a template fails, confirm the invariant for each loop or call: every node in the queue or recursion stack should already be marked as scheduled for processing.

#### Advanced Note

Well-structured templates reduce bugs more than clever traversal tricks do.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Shortest Path in an Unweighted Graph with BFS
#### Problem Statement

Given an unweighted graph, a source node, and a target node, return one shortest path from source to target.

#### Why This Example Matters

This is the most important BFS pattern. BFS is not just traversal order here; it guarantees the first time you reach a node is through the minimum number of edges.

#### Constraints or Assumptions

- the graph is unweighted
- there may be multiple shortest paths
- return an empty path if the target is unreachable

#### Brute-Force Approach

Enumerate all simple paths from source to target and keep the shortest one.

#### Better Approach

Use BFS with a `parent[]` array to reconstruct the shortest path.

#### Why the Better Approach Works

BFS explores nodes by increasing distance from the source. The first time the target is reached, the path length is minimal in number of edges.

#### Pragmatic Java Choice

Use:
- `ArrayDeque<Integer>` as the queue
- `boolean[] visited`
- `int[] parent` initialized to `-1`

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Queue;

class BfsShortestPathExample {
    static List<Integer> bruteForceShortestPath(List<List<Integer>> graph, int source, int target) {
        boolean[] visited = new boolean[graph.size()];
        List<Integer> currentPath = new ArrayList<>();
        List<Integer> bestPath = new ArrayList<>();
        dfsAllPaths(graph, source, target, visited, currentPath, bestPath);
        return bestPath;
    }

    static List<Integer> shortestPathBfs(List<List<Integer>> graph, int source, int target) {
        int nodeCount = graph.size();
        boolean[] visited = new boolean[nodeCount];
        int[] parent = new int[nodeCount];
        Arrays.fill(parent, -1);

        Queue<Integer> queue = new ArrayDeque<>();
        queue.offer(source);
        visited[source] = true;
        parent[source] = source;

        while (!queue.isEmpty()) {
            int node = queue.poll();
            if (node == target) {
                break;
            }

            for (int neighbor : graph.get(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    parent[neighbor] = node;
                    queue.offer(neighbor);
                }
            }
        }

        if (!visited[target]) {
            return List.of();
        }
        return reconstructPath(parent, source, target);
    }

    private static void dfsAllPaths(
            List<List<Integer>> graph,
            int node,
            int target,
            boolean[] visited,
            List<Integer> currentPath,
            List<Integer> bestPath) {
        visited[node] = true;
        currentPath.add(node);

        if (node == target) {
            if (bestPath.isEmpty() || currentPath.size() < bestPath.size()) {
                bestPath.clear();
                bestPath.addAll(currentPath);
            }
        } else {
            for (int neighbor : graph.get(node)) {
                if (!visited[neighbor]) {
                    dfsAllPaths(graph, neighbor, target, visited, currentPath, bestPath);
                }
            }
        }

        currentPath.remove(currentPath.size() - 1);
        visited[node] = false;
    }

    private static List<Integer> reconstructPath(int[] parent, int source, int target) {
        List<Integer> path = new ArrayList<>();
        int current = target;

        while (current != source) {
            path.add(current);
            current = parent[current];
        }
        path.add(source);
        Collections.reverse(path);
        return path;
    }
}
```

#### Dry Run

Graph:
- `0 -> [1, 2]`
- `1 -> [3]`
- `2 -> [3, 4]`
- `3 -> [5]`
- `4 -> [5]`

Source `0`, target `5`.

BFS steps:
- start with queue `[0]`
- visit `0`, add `1` and `2`
- visit `1`, add `3`
- visit `2`, add `4` because `3` is already scheduled
- visit `3`, add `5`

The reconstructed path can be `[0, 1, 3, 5]`. It uses three edges, which is shortest.

#### Time and Space Complexity

- brute force simple-path search: exponential in the worst case
- BFS with adjacency list: $O(V + E)$
- extra space: $O(V)$ for queue, visited, and parent

#### Edge Cases

- source equals target
- target unreachable
- graph with cycles
- multiple shortest paths

#### Common Mistakes

- marking visited only when popping instead of when enqueuing
- forgetting to store parents for path reconstruction
- using BFS shortest-path logic on weighted graphs

### Worked Example 2: Count Connected Components and Detect a Cycle
#### Problem Statement

Given an undirected graph, return:
- the number of connected components
- whether the graph contains at least one cycle

#### Why This Example Matters

This example shows how one DFS framework can answer multiple structural questions at once.

#### Constraints or Assumptions

- the graph is undirected
- it may be disconnected
- self-loops count as cycles

#### Brute-Force Approach

For each node, run a full reachability search, compare all reachability sets, and deduce the component groups. For cycle detection, repeatedly test whether alternate routes exist between the endpoints of an edge. This works conceptually, but it repeats a lot of work.

#### Better Approach

Run one DFS per unvisited component and track the parent edge to detect cycles.

#### Why the Better Approach Works

Each node is visited once. The outer loop counts how many separate traversals are needed. During a DFS in an undirected graph, finding a visited neighbor that is not the parent means a back edge and therefore a cycle.

#### Pragmatic Java Choice

Use:
- one outer loop over all nodes
- a recursive DFS for clarity
- a small result record to return both answers together

#### Java Solution

```java
import java.util.List;

class ConnectedComponentsAndCycleExample {
    record Analysis(int componentCount, boolean hasCycle) {}

    static int bruteForceComponentCount(List<List<Integer>> graph) {
        int nodeCount = graph.size();
        boolean[][] reaches = new boolean[nodeCount][nodeCount];

        for (int start = 0; start < nodeCount; start++) {
            markReachable(graph, start, reaches[start]);
        }

        boolean[] assigned = new boolean[nodeCount];
        int components = 0;

        for (int node = 0; node < nodeCount; node++) {
            if (assigned[node]) {
                continue;
            }
            components++;
            for (int other = 0; other < nodeCount; other++) {
                if (reaches[node][other]) {
                    assigned[other] = true;
                }
            }
        }
        return components;
    }

    static Analysis analyzeUndirectedGraph(List<List<Integer>> graph) {
        boolean[] visited = new boolean[graph.size()];
        int componentCount = 0;
        boolean hasCycle = false;

        for (int node = 0; node < graph.size(); node++) {
            if (!visited[node]) {
                componentCount++;
                if (dfs(node, -1, graph, visited)) {
                    hasCycle = true;
                }
            }
        }

        return new Analysis(componentCount, hasCycle);
    }

    private static boolean dfs(int node, int parent, List<List<Integer>> graph, boolean[] visited) {
        visited[node] = true;

        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                if (dfs(neighbor, node, graph, visited)) {
                    return true;
                }
            } else if (neighbor != parent) {
                return true;
            }
        }
        return false;
    }

    private static void markReachable(List<List<Integer>> graph, int node, boolean[] seen) {
        if (seen[node]) {
            return;
        }
        seen[node] = true;

        for (int neighbor : graph.get(node)) {
            markReachable(graph, neighbor, seen);
        }
    }
}
```

#### Dry Run

Graph:
- component 1: edges `(0, 1)`, `(1, 2)`, `(2, 0)`
- component 2: edge `(3, 4)`
- component 3: node `5` isolated

Outer loop:
- start at `0`, DFS visits `0, 1, 2` and detects a cycle
- next unvisited node is `3`, DFS visits `3, 4`
- next unvisited node is `5`, DFS visits only `5`

Final answer:
- component count is `3`
- cycle exists is `true`

#### Time and Space Complexity

- brute force repeated reachability: up to $O(V \cdot (V + E))$
- optimized DFS: $O(V + E)$
- extra space: $O(V)$ for visited, plus recursion stack up to $O(V)$

#### Edge Cases

- isolated nodes
- self-loops
- multiple components
- graph with no edges

#### Common Mistakes

- forgetting the outer loop over all nodes
- reporting the parent edge as a cycle
- using undirected cycle logic on a directed graph

### Worked Example 3: Check Whether a Graph Is Bipartite
#### Problem Statement

Given an undirected graph, determine whether it can be colored using two colors so that every edge connects different colors.

#### Why This Example Matters

Bipartite checking combines traversal, state assignment, and component handling. It is a clean test of BFS or DFS correctness.

#### Constraints or Assumptions

- the graph can be disconnected
- a self-loop immediately makes the graph non-bipartite
- any valid two-coloring is acceptable

#### Brute-Force Approach

Try all possible two-color assignments for all nodes and check whether every edge connects opposite colors.

#### Better Approach

Use BFS coloring.

#### Why the Better Approach Works

When BFS visits an edge `(u, v)`, it forces `v` to have the opposite color of `u`. If a contradiction appears, the graph is not bipartite. If all components are colored consistently, it is bipartite.

#### Pragmatic Java Choice

Use:
- `int[] color` filled with `-1`
- BFS so layer-style reasoning is explicit
- one outer loop to cover disconnected graphs

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.List;
import java.util.Queue;

class BipartiteGraphCheckExample {
    static boolean bruteForceTwoColoring(List<List<Integer>> graph) {
        int nodeCount = graph.size();
        int totalAssignments = 1 << nodeCount;

        for (int mask = 0; mask < totalAssignments; mask++) {
            boolean valid = true;

            for (int node = 0; node < nodeCount && valid; node++) {
                int color = (mask >> node) & 1;
                for (int neighbor : graph.get(node)) {
                    int neighborColor = (mask >> neighbor) & 1;
                    if (color == neighborColor) {
                        valid = false;
                        break;
                    }
                }
            }

            if (valid) {
                return true;
            }
        }
        return false;
    }

    static boolean isBipartite(List<List<Integer>> graph) {
        int[] color = new int[graph.size()];
        Arrays.fill(color, -1);

        for (int start = 0; start < graph.size(); start++) {
            if (color[start] != -1) {
                continue;
            }

            Queue<Integer> queue = new ArrayDeque<>();
            queue.offer(start);
            color[start] = 0;

            while (!queue.isEmpty()) {
                int node = queue.poll();

                for (int neighbor : graph.get(node)) {
                    if (neighbor == node) {
                        return false;
                    }

                    if (color[neighbor] == -1) {
                        color[neighbor] = 1 - color[node];
                        queue.offer(neighbor);
                    } else if (color[neighbor] == color[node]) {
                        return false;
                    }
                }
            }
        }

        return true;
    }
}
```

#### Dry Run

Graph:
- `0 -> [1, 3]`
- `1 -> [0, 2]`
- `2 -> [1, 3]`
- `3 -> [0, 2]`

This is an even cycle.

BFS coloring:
- color `0` as `0`
- neighbors `1` and `3` become `1`
- neighbor `2` of node `1` becomes `0`
- all edges connect opposite colors, so the graph is bipartite

If you add edge `(0, 2)`:
- node `0` and node `2` would both need the same color and different colors at once
- contradiction appears
- graph is not bipartite

#### Time and Space Complexity

- brute force coloring: $O(2^V \cdot E)$
- BFS coloring: $O(V + E)$
- extra space: $O(V)$

#### Edge Cases

- disconnected graph
- isolated nodes
- self-loops
- odd cycles

#### Common Mistakes

- checking only one connected component
- forgetting that a self-loop breaks bipartiteness immediately
- mixing visited logic and color logic so nodes are recolored incorrectly

## 4. Complexity and Decision Guide

Main trade-offs in this chapter:
- BFS and DFS both run in $O(V + E)$ on adjacency lists
- BFS naturally gives shortest path in unweighted graphs
- DFS is often simpler for recursive structural checks
- connected components, cycle detection, and bipartite checks are usually just traversal plus the right extra state

Choose BFS when:
- shortest path in an unweighted graph matters
- the problem has layers or minimum moves
- queue-based level reasoning is natural

Choose DFS when:
- you need structural exploration
- recursion makes the logic clearer
- parent or recursion-state reasoning is central

Use component-wise outer loops when:
- the graph may be disconnected
- the question asks about the whole graph, not only one source

Recognition signals:
- "can you reach...?"
- "minimum number of moves" in an unweighted setting
- "how many groups/components...?"
- "does this graph contain a cycle?"
- "can this graph be split into two valid groups?"

Signals not to force this technique:
- weighted shortest path is required
- the graph is a DAG dependency problem better suited for topological order
- the core problem is not about traversal at all

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- forgetting to mark visited at the right moment
- starting from one node and assuming the whole graph is covered
- using DFS for shortest path in an unweighted graph
- confusing directed cycle logic with undirected cycle logic
- forgetting parent tracking in undirected cycle detection
- failing to reset or separate traversal state across problems

Boundary and state risks:
- empty graph
- isolated nodes
- self-loops
- repeated edges
- recursion depth on very deep graphs
- disconnected graphs in bipartite checks

Short debugging checklist:
- Is every node that enters the queue or recursion stack marked as scheduled?
- Are you looping over all nodes for whole-graph problems?
- In undirected cycle detection, are you excluding the parent edge?
- In bipartite checking, are colors assigned consistently across components?
- Are you relying on BFS only for unweighted shortest path problems?

## 6. Practice Problems

### Easy

- Title: Find if Path Exists in Graph. One-line prompt: determine whether two nodes are connected at all. Expected pattern or core idea: BFS or DFS reachability.
- Title: Flood Fill. One-line prompt: recolor all connected cells reachable from a starting cell. Expected pattern or core idea: BFS or DFS on an implicit grid graph.
- Title: Keys and Rooms. One-line prompt: decide whether every room becomes reachable from room `0`. Expected pattern or core idea: traversal over a directed graph.

### Medium

- Title: Number of Provinces. One-line prompt: count connected components from an adjacency matrix. Expected pattern or core idea: component traversal.
- Title: Is Graph Bipartite? One-line prompt: decide whether the graph can be colored with two colors. Expected pattern or core idea: BFS or DFS coloring.
- Title: Redundant Connection. One-line prompt: identify the extra edge that creates a cycle in an undirected graph. Expected pattern or core idea: traversal-based cycle reasoning or DSU comparison.

### Hard

- Title: Word Ladder. One-line prompt: find the shortest transformation sequence length between words. Expected pattern or core idea: BFS on an implicit graph.
- Title: Open the Lock. One-line prompt: reach a target lock state while avoiding forbidden states. Expected pattern or core idea: BFS over state space.
- Title: Shortest Path in Binary Matrix. One-line prompt: compute the minimum path length through an implicit grid graph. Expected pattern or core idea: BFS with careful visited management.

## 7. Short Recap

The core idea of this chapter is that graph traversal is controlled exploration with explicit state.

The most important optimization insight is that BFS and DFS are not interchangeable:
- BFS for unweighted shortest paths and layers
- DFS for structural exploration and many recursive checks

The most important implementation warning is to manage visited, parent, and color state carefully, especially across disconnected graphs.

This chapter prepares the next chapter by turning general traversal into ordered traversal on DAGs with topological sorting.

## 8. Coverage Check

- [x] 23.1 Breadth-first search
- [x] 23.2 Depth-first search
- [x] 23.3 Connected components
- [x] 23.4 Cycle detection
- [x] 23.5 Bipartite graph check
- [x] 23.6 Java traversal templates

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 24: Topological Sort and DAG Problems
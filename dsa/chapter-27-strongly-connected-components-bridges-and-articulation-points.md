# 27: Strongly Connected Components, Bridges, and Articulation Points

**Goal:** Teach how to analyze graph structure under failure, using SCC decomposition in directed graphs and low-link reasoning for bridges and articulation points in undirected graphs.
**Outcome:** By the end of this chapter, you can find strongly connected components with Kosaraju's and Tarjan's algorithms, identify bridges and articulation points with low-link values, and explain what these structures mean for graph resilience.

---

## 1. Intuition First

This chapter matters because many graph problems are not only about reachability or minimum cost. Sometimes the real question is structural:

- which vertices mutually depend on each other
- which edge is a single point of failure
- which vertex disconnects the network if it fails

A simple real-world analogy is a company network:

- a strongly connected component is a group of services that can all call each other through some chain
- a bridge is a single cable whose removal splits the network
- an articulation point is a router whose failure disconnects parts of the system

The core mental model is depth-first search plus structural timestamps. DFS gives a tree. Low-link reasoning tells us whether a subtree can reconnect to an earlier part of the graph without using its parent edge.

The most common beginner confusion point is mixing directed and undirected settings:

- SCCs are a directed-graph concept
- bridges and articulation points are usually defined on undirected graphs
- the low-link idea appears in both, but the exact condition changes

This chapter closes Part V. The earlier graph chapters taught traversal, shortest paths, and spanning trees. This chapter shifts from "how do I move through the graph?" to "what structural pieces hold the graph together?" That prepares the transition into Part VI, where correctness arguments matter more than surface pattern matching.

## 2. Core Concepts and Techniques

### Concept Cluster: Mutual Reachability and Kosaraju
Key concepts in this block:
- 27.1 Strongly connected components
- 27.2 Kosaraju's algorithm

#### Intuition

A strongly connected component, or SCC, is a maximal set of vertices in a directed graph where every vertex can reach every other vertex.

#### Why It Matters

SCCs compress cyclic dependency regions into single units. After compression, the graph becomes a DAG, which is much easier to reason about.

#### How It Works

Kosaraju's algorithm uses two DFS passes:

- first DFS on the original graph to record vertices by finishing order
- second DFS on the reversed graph, processing vertices in reverse finishing order
- each second-pass DFS tree is one SCC

The correctness idea is that the finishing order isolates source and sink behavior across SCC boundaries.

#### Java Implementation Notes

- Build both the graph and the reversed graph.
- Store a finishing-order list from the first pass.
- Reset `visited` before the second pass.

#### Common Mistakes

- forgetting to reverse the graph
- processing the second pass in the wrong order
- applying SCC logic to an undirected graph

#### Quick Example

If `0 -> 1 -> 2 -> 0` and `2 -> 3 -> 4 -> 3`, then the SCCs are `{0, 1, 2}` and `{3, 4}`.

#### Debugging Tip

If the second pass returns too many one-node components, check the order of the first-pass finishing list.

#### Advanced Note

If you contract every SCC into one node, you get the condensation graph, which is always a DAG.

### Concept Cluster: Tarjan's Algorithm
Key concepts in this block:
- 27.3 Tarjan's algorithm

#### Intuition

Tarjan's SCC algorithm finds SCCs in one DFS by tracking which nodes are still active on the current recursion stack.

#### Why It Matters

It avoids building the reversed graph and gives a very compact one-pass SCC routine.

#### How It Works

For each node, Tarjan stores:

- `discoveryTime[node]`
- `lowLink[node]`
- whether the node is currently on the stack

When `lowLink[node] == discoveryTime[node]`, that node is the root of one SCC, so the algorithm pops the stack until it reaches that root.

#### Java Implementation Notes

- Use a stack plus a boolean `onStack[]`.
- Update low-link values only through neighbors that are still on the stack.
- Use one shared DFS timer.

#### Common Mistakes

- updating low-link through every visited node instead of only stack-active nodes
- forgetting to mark nodes as removed from the stack
- mixing Tarjan SCC rules with bridge rules from undirected graphs

#### Quick Example

If DFS enters `0, 1, 2`, and `2` has a back edge to `0`, then all three can end up with the same low-link value.

#### Debugging Tip

Print `(node, discoveryTime, lowLink, onStack)` during DFS. Most Tarjan bugs show up there immediately.

#### Advanced Note

Tarjan's SCC algorithm and Tarjan-style bridge algorithms share the low-link idea, but the exact update rules depend on whether the graph is directed and whether the neighbor is on the active stack.

### Concept Cluster: Bridges in Graphs
Key concepts in this block:
- 27.4 Bridges in graphs

#### Intuition

A bridge is an undirected edge whose removal increases the number of connected components.

#### Why It Matters

Bridges represent single points of failure in physical networks, dependency graphs, and road systems.

#### How It Works

Run DFS and compute `discoveryTime` and `lowLink`.

For a DFS tree edge `u -> v`, the edge is a bridge if:

- `lowLink[v] > discoveryTime[u]`

That means the subtree rooted at `v` cannot reach `u` or any ancestor of `u` without using the edge `(u, v)`.

#### Java Implementation Notes

- In undirected graphs, skip only the exact parent edge, not every edge back to the parent vertex if parallel edges are possible.
- Edge IDs make the implementation safer than only storing parent nodes.

#### Common Mistakes

- using `>=` instead of `>`
- skipping all edges to the parent node and breaking parallel-edge cases
- forgetting to visit disconnected components

#### Quick Example

In the graph `0-1-2` with an extra triangle `1-3-4-1`, the edge `0-1` is a bridge, but the edges inside the triangle are not.

#### Debugging Tip

When an expected bridge is missing, inspect the child's low-link value. It is almost always being lowered incorrectly.

#### Advanced Note

Bridges split the graph into 2-edge-connected regions.

### Concept Cluster: Articulation Points
Key concepts in this block:
- 27.5 Articulation points

#### Intuition

An articulation point is a vertex whose removal increases the number of connected components.

#### Why It Matters

Articulation points are failure-critical routers, cities, or modules. They are often more important than individual edges.

#### How It Works

For a non-root DFS node `u`, if it has a child `v` such that:

- `lowLink[v] >= discoveryTime[u]`

then `u` is an articulation point.

For the DFS root, the rule is different:

- the root is an articulation point only if it has more than one DFS child

#### Java Implementation Notes

- Count DFS children for the root.
- Use the same `discoveryTime` and `lowLink` framework as bridges.
- Collect articulation points in ascending order if you want stable output.

#### Common Mistakes

- using the non-root rule on the root
- using `>` instead of `>=`
- forgetting to reset or initialize arrays for multiple components

#### Quick Example

If `1` connects the left half and right half of a network, then removing `1` disconnects the graph even if no single incident edge alone is enough to describe the failure.

#### Debugging Tip

When a root is incorrectly marked, count how many DFS tree children it actually has. The root rule is special.

#### Advanced Note

Articulation points split the graph into 2-vertex-connected regions.

### Concept Cluster: Failure Analysis and Graph-Cut Intuition
Key concepts in this block:
- 27.6 Failure analysis and graph-cut intuition

#### Intuition

This chapter is really about asking what breaks when a piece disappears.

#### Why It Matters

Graph algorithms become much easier to choose when you name the kind of failure you care about:

- mutual reachability in directed graphs suggests SCCs
- edge failure in undirected graphs suggests bridges
- vertex failure in undirected graphs suggests articulation points

#### How It Works

The cut intuition is:

- SCCs compress strongly cyclic regions into one node
- bridges are edges crossing a structural cut with no alternative route
- articulation points are vertices that sit on all paths between regions

#### Java Implementation Notes

- Decide first whether the graph is directed or undirected.
- Decide second whether the failure unit is an edge or a vertex.
- Then choose the matching DFS condition.

#### Common Mistakes

- trying to use SCCs to answer an undirected bridge question
- treating every important-looking high-degree node as an articulation point
- forcing one graph template onto all failure questions

#### Quick Example

A node can have high degree and still not be an articulation point if many cycles route around it.

#### Debugging Tip

Draw the DFS tree and mark back edges. Low-link logic becomes obvious on paper.

#### Advanced Note

These ideas appear again in advanced topics such as 2-SAT, block-cut trees, and bridge trees.

## 3. Worked Examples and Full Solutions

### Worked Example 1: SCC Decomposition with Kosaraju's Algorithm
#### Problem Statement

Given a directed graph with `nodeCount` vertices and `edges`, return all strongly connected components.

#### Why This Example Matters

This is the standard SCC entry point. It directly teaches mutual reachability and the two-pass decomposition idea.

#### Constraints or Assumptions

- the graph is directed
- the graph may be disconnected
- multiple SCCs may exist

#### Brute-Force Approach

For each vertex, run DFS to compute all reachable vertices. Then group vertices `u` and `v` together if `u` reaches `v` and `v` reaches `u`.

This works conceptually, but it costs `O(V(V + E))` and becomes wasteful on large graphs.

#### Better Approach

Use Kosaraju's algorithm.

#### Why the Better Approach Works

The first DFS pass computes a finishing order that respects SCC boundaries. The second DFS pass on the reversed graph peels off exactly one SCC at a time.

#### Pragmatic Java Choice

Use:

- two adjacency lists: original and reversed
- a finishing-order list
- recursive DFS for clarity

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class KosarajuSccExample {
    static List<List<Integer>> stronglyConnectedComponents(int nodeCount, int[][] edges) {
        List<List<Integer>> graph = new ArrayList<>();
        List<List<Integer>> reverseGraph = new ArrayList<>();
        for (int node = 0; node < nodeCount; node++) {
            graph.add(new ArrayList<>());
            reverseGraph.add(new ArrayList<>());
        }

        for (int[] edge : edges) {
            graph.get(edge[0]).add(edge[1]);
            reverseGraph.get(edge[1]).add(edge[0]);
        }

        boolean[] visited = new boolean[nodeCount];
        List<Integer> finishingOrder = new ArrayList<>();

        for (int node = 0; node < nodeCount; node++) {
            if (!visited[node]) {
                dfsOrder(node, graph, visited, finishingOrder);
            }
        }

        Collections.reverse(finishingOrder);
        visited = new boolean[nodeCount];
        List<List<Integer>> components = new ArrayList<>();

        for (int node : finishingOrder) {
            if (!visited[node]) {
                List<Integer> component = new ArrayList<>();
                dfsCollect(node, reverseGraph, visited, component);
                components.add(component);
            }
        }

        return components;
    }

    private static void dfsOrder(int node, List<List<Integer>> graph, boolean[] visited, List<Integer> order) {
        visited[node] = true;
        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                dfsOrder(neighbor, graph, visited, order);
            }
        }
        order.add(node);
    }

    private static void dfsCollect(int node, List<List<Integer>> graph, boolean[] visited, List<Integer> component) {
        visited[node] = true;
        component.add(node);
        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                dfsCollect(neighbor, graph, visited, component);
            }
        }
    }
}
```

#### Dry Run

Graph:

- `0 -> 1`
- `1 -> 2`
- `2 -> 0`
- `2 -> 3`
- `3 -> 4`
- `4 -> 5`
- `5 -> 3`
- `5 -> 6`

First pass finishing order ends with nodes from the sink side later.

Second pass on the reversed graph:

- starting from `0` collects `{0, 1, 2}`
- later starting from `3` collects `{3, 4, 5}`
- `6` is alone

#### Time and Space Complexity

Brute force:

- Time: `O(V(V + E))`
- Space: `O(V + E)`

Kosaraju:

- Time: `O(V + E)`
- Space: `O(V + E)`

#### Edge Cases

- isolated vertices
- one large SCC containing all vertices
- graph with no directed cycles
- disconnected directed graph

#### Common Mistakes

- forgetting to reverse the finishing-order list
- building the reverse graph incorrectly
- thinking SCCs are the same as connected components

### Worked Example 2: SCC Decomposition with Tarjan's Algorithm
#### Problem Statement

Given a directed graph, return all strongly connected components using a one-pass DFS algorithm.

#### Why This Example Matters

Tarjan's algorithm is the compact, interview-ready SCC routine when you want one traversal and tight control over DFS state.

#### Constraints or Assumptions

- the graph is directed
- the graph may be disconnected
- recursion depth must fit the environment

#### Brute-Force Approach

Again, compute mutual reachability by running DFS from every vertex and grouping vertices that can reach each other.

That is correct but slow and does not expose the deeper structural invariant.

#### Better Approach

Use Tarjan's algorithm with a stack and low-link values.

#### Why the Better Approach Works

A node stays on the stack exactly while its SCC is still open. When `lowLink[node] == discoveryTime[node]`, the algorithm has reached the root of one SCC and can pop that whole component.

#### Pragmatic Java Choice

Use:

- adjacency lists
- arrays for `discoveryTime`, `lowLink`, and `onStack`
- `ArrayDeque<Integer>` as the DFS stack

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

class TarjanSccExample {
    static List<List<Integer>> stronglyConnectedComponents(int nodeCount, int[][] edges) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int node = 0; node < nodeCount; node++) {
            graph.add(new ArrayList<>());
        }
        for (int[] edge : edges) {
            graph.get(edge[0]).add(edge[1]);
        }

        int[] discoveryTime = new int[nodeCount];
        int[] lowLink = new int[nodeCount];
        boolean[] onStack = new boolean[nodeCount];
        Deque<Integer> stack = new ArrayDeque<>();
        int[] timer = {1};
        List<List<Integer>> components = new ArrayList<>();

        for (int node = 0; node < nodeCount; node++) {
            if (discoveryTime[node] == 0) {
                dfs(node, graph, discoveryTime, lowLink, onStack, stack, timer, components);
            }
        }

        return components;
    }

    private static void dfs(
            int node,
            List<List<Integer>> graph,
            int[] discoveryTime,
            int[] lowLink,
            boolean[] onStack,
            Deque<Integer> stack,
            int[] timer,
            List<List<Integer>> components) {
        discoveryTime[node] = timer[0];
        lowLink[node] = timer[0];
        timer[0]++;

        stack.push(node);
        onStack[node] = true;

        for (int neighbor : graph.get(node)) {
            if (discoveryTime[neighbor] == 0) {
                dfs(neighbor, graph, discoveryTime, lowLink, onStack, stack, timer, components);
                lowLink[node] = Math.min(lowLink[node], lowLink[neighbor]);
            } else if (onStack[neighbor]) {
                lowLink[node] = Math.min(lowLink[node], discoveryTime[neighbor]);
            }
        }

        if (lowLink[node] == discoveryTime[node]) {
            List<Integer> component = new ArrayList<>();
            while (true) {
                int current = stack.pop();
                onStack[current] = false;
                component.add(current);
                if (current == node) {
                    break;
                }
            }
            components.add(component);
        }
    }
}
```

#### Dry Run

Graph:

- `0 -> 1`
- `1 -> 2`
- `2 -> 0`
- `1 -> 3`
- `3 -> 4`
- `4 -> 3`

DFS enters `0, 1, 2`. The back edge from `2` to `0` lowers low-link values for that cycle.

Later DFS enters `3, 4`. Since `4` reaches back to `3`, they form one SCC.

The algorithm pops `{4, 3}` and then `{2, 1, 0}`.

#### Time and Space Complexity

Brute force:

- Time: `O(V(V + E))`
- Space: `O(V + E)`

Tarjan:

- Time: `O(V + E)`
- Space: `O(V + E)`

#### Edge Cases

- one-node SCCs
- self-loops
- multiple disconnected SCC regions
- directed acyclic graph, where every SCC has size `1`

#### Common Mistakes

- updating low-link through every visited node instead of only stack-active neighbors
- not clearing `onStack` when popping
- using bridge logic instead of SCC stack logic

### Worked Example 3: Finding Bridges in an Undirected Graph
#### Problem Statement

Given an undirected graph, return every bridge edge.

#### Why This Example Matters

Bridges are the most direct edge-failure question. This problem forces you to understand low-link values precisely.

#### Constraints or Assumptions

- the graph is undirected
- the graph may be disconnected
- parallel edges may exist

#### Brute-Force Approach

For each edge:

- temporarily remove it
- run DFS or BFS
- check whether the number of connected components increases

This costs `O(E(V + E))` and repeats almost the same traversal many times.

#### Better Approach

Use one DFS with low-link values.

#### Why the Better Approach Works

A tree edge `(u, v)` is a bridge exactly when the subtree of `v` cannot reconnect to `u` or above without that edge. The condition is:

- `lowLink[v] > discoveryTime[u]`

#### Pragmatic Java Choice

Use:

- adjacency lists with edge IDs
- arrays for discovery and low-link
- a `List<int[]>` for the answer

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class BridgesExample {
    private static final class Edge {
        final int to;
        final int id;

        Edge(int to, int id) {
            this.to = to;
            this.id = id;
        }
    }

    static List<int[]> bridges(int nodeCount, int[][] edgesArray) {
        List<List<Edge>> graph = new ArrayList<>();
        for (int node = 0; node < nodeCount; node++) {
            graph.add(new ArrayList<>());
        }

        for (int edgeId = 0; edgeId < edgesArray.length; edgeId++) {
            int from = edgesArray[edgeId][0];
            int to = edgesArray[edgeId][1];
            graph.get(from).add(new Edge(to, edgeId));
            graph.get(to).add(new Edge(from, edgeId));
        }

        int[] discoveryTime = new int[nodeCount];
        int[] lowLink = new int[nodeCount];
        int[] timer = {1};
        List<int[]> answer = new ArrayList<>();

        for (int node = 0; node < nodeCount; node++) {
            if (discoveryTime[node] == 0) {
                dfs(node, -1, graph, discoveryTime, lowLink, timer, answer);
            }
        }

        return answer;
    }

    private static void dfs(
            int node,
            int parentEdgeId,
            List<List<Edge>> graph,
            int[] discoveryTime,
            int[] lowLink,
            int[] timer,
            List<int[]> answer) {
        discoveryTime[node] = timer[0];
        lowLink[node] = timer[0];
        timer[0]++;

        for (Edge edge : graph.get(node)) {
            int neighbor = edge.to;
            if (edge.id == parentEdgeId) {
                continue;
            }

            if (discoveryTime[neighbor] == 0) {
                dfs(neighbor, edge.id, graph, discoveryTime, lowLink, timer, answer);
                lowLink[node] = Math.min(lowLink[node], lowLink[neighbor]);

                if (lowLink[neighbor] > discoveryTime[node]) {
                    answer.add(new int[]{node, neighbor});
                }
            } else {
                lowLink[node] = Math.min(lowLink[node], discoveryTime[neighbor]);
            }
        }
    }
}
```

#### Dry Run

Graph:

- `0-1`
- `1-2`
- `2-0`
- `1-3`
- `3-4`

The triangle on `0,1,2` keeps those edges safe.

DFS then explores `1-3-4`:

- `4` has no back edge, so `lowLink[4] > discoveryTime[3]`, making `3-4` a bridge
- `3` cannot reach above `1`, so `1-3` is also a bridge

#### Time and Space Complexity

Brute force:

- Time: `O(E(V + E))`
- Space: `O(V + E)`

Low-link DFS:

- Time: `O(V + E)`
- Space: `O(V + E)`

#### Edge Cases

- disconnected graph
- graph with no bridges
- a tree, where every edge is a bridge
- parallel edges, where one copy may protect the other

#### Common Mistakes

- using `>=` instead of `>`
- skipping all parent-vertex edges instead of only the parent edge ID
- forgetting to start DFS from every component

### Worked Example 4: Finding Articulation Points in an Undirected Graph
#### Problem Statement

Given an undirected graph, return every articulation point.

#### Why This Example Matters

This is the vertex-failure version of the bridge problem and a very common interview follow-up.

#### Constraints or Assumptions

- the graph is undirected
- the graph may be disconnected
- return articulation points in ascending order

#### Brute-Force Approach

For each vertex:

- remove it conceptually
- run DFS from a remaining vertex
- check whether connectivity worsens

This costs `O(V(V + E))`.

#### Better Approach

Use one DFS with low-link values and special handling for the DFS root.

#### Why the Better Approach Works

For a non-root node `u`, if some child subtree cannot reconnect above `u`, then removing `u` disconnects that subtree. The condition is:

- `lowLink[child] >= discoveryTime[u]`

The root is special because it becomes critical only if it has at least two DFS children.

#### Pragmatic Java Choice

Use:

- adjacency lists with edge IDs
- boolean array to mark articulation points
- one final pass to collect marked nodes in order

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class ArticulationPointsExample {
    private static final class Edge {
        final int to;
        final int id;

        Edge(int to, int id) {
            this.to = to;
            this.id = id;
        }
    }

    static List<Integer> articulationPoints(int nodeCount, int[][] edgesArray) {
        List<List<Edge>> graph = new ArrayList<>();
        for (int node = 0; node < nodeCount; node++) {
            graph.add(new ArrayList<>());
        }

        for (int edgeId = 0; edgeId < edgesArray.length; edgeId++) {
            int from = edgesArray[edgeId][0];
            int to = edgesArray[edgeId][1];
            graph.get(from).add(new Edge(to, edgeId));
            graph.get(to).add(new Edge(from, edgeId));
        }

        int[] discoveryTime = new int[nodeCount];
        int[] lowLink = new int[nodeCount];
        boolean[] isArticulation = new boolean[nodeCount];
        int[] timer = {1};

        for (int node = 0; node < nodeCount; node++) {
            if (discoveryTime[node] == 0) {
                dfs(node, -1, -1, graph, discoveryTime, lowLink, isArticulation, timer);
            }
        }

        List<Integer> answer = new ArrayList<>();
        for (int node = 0; node < nodeCount; node++) {
            if (isArticulation[node]) {
                answer.add(node);
            }
        }
        return answer;
    }

    private static void dfs(
            int node,
            int parentNode,
            int parentEdgeId,
            List<List<Edge>> graph,
            int[] discoveryTime,
            int[] lowLink,
            boolean[] isArticulation,
            int[] timer) {
        discoveryTime[node] = timer[0];
        lowLink[node] = timer[0];
        timer[0]++;

        int childCount = 0;

        for (Edge edge : graph.get(node)) {
            int neighbor = edge.to;
            if (edge.id == parentEdgeId) {
                continue;
            }

            if (discoveryTime[neighbor] == 0) {
                childCount++;
                dfs(neighbor, node, edge.id, graph, discoveryTime, lowLink, isArticulation, timer);
                lowLink[node] = Math.min(lowLink[node], lowLink[neighbor]);

                if (parentNode != -1 && lowLink[neighbor] >= discoveryTime[node]) {
                    isArticulation[node] = true;
                }
            } else {
                lowLink[node] = Math.min(lowLink[node], discoveryTime[neighbor]);
            }
        }

        if (parentNode == -1 && childCount > 1) {
            isArticulation[node] = true;
        }
    }
}
```

#### Dry Run

Use the same graph:

- `0-1`
- `1-2`
- `2-0`
- `1-3`
- `3-4`

Articulation points are:

- `1`, because it separates the triangle from the `3-4` branch
- `3`, because it separates `4` from the rest

The root rule matters if DFS starts at a node with multiple independent children.

#### Time and Space Complexity

Brute force:

- Time: `O(V(V + E))`
- Space: `O(V + E)`

Low-link DFS:

- Time: `O(V + E)`
- Space: `O(V + E)`

#### Edge Cases

- one-vertex graph
- fully biconnected graph with no articulation points
- tree graphs, where many internal nodes are articulation points
- disconnected graph with multiple DFS roots

#### Common Mistakes

- forgetting the special root rule
- using `>` instead of `>=`
- not collecting results from all components

## 4. Complexity and Decision Guide

Main trade-offs in this chapter:

- brute-force SCC grouping: `O(V(V + E))`
- Kosaraju's algorithm: `O(V + E)`
- Tarjan's SCC algorithm: `O(V + E)`
- bridge finding: `O(V + E)`
- articulation point finding: `O(V + E)`

When to choose which technique:

- choose SCC algorithms when the graph is directed and the question is about mutual reachability
- choose Kosaraju when a two-pass solution feels easiest to reason about
- choose Tarjan when you want a compact one-pass SCC routine
- choose bridge logic when the failure unit is an edge
- choose articulation-point logic when the failure unit is a vertex

Recognition signals:

- "if we collapse cyclic dependency groups" suggests SCCs
- "critical connection" suggests bridges
- "critical router" or "critical city" suggests articulation points
- "what breaks if this service or road fails?" suggests graph-cut intuition

Signals not to force this technique:

- do not use SCCs for undirected edge-failure questions
- do not use bridge logic in directed graphs as if nothing changed
- do not use DSU when the question depends on DFS tree structure rather than only connectivity

A practical rule:

- directed mutual reachability: SCC
- undirected edge failure: bridge
- undirected vertex failure: articulation point

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- mixing directed and undirected logic
- updating low-link with the wrong timestamp
- forgetting to process disconnected components
- mishandling the DFS root for articulation points
- skipping every edge to the parent vertex instead of the exact parent edge

Boundary handling:

- isolated vertices form SCCs of size `1`
- a tree has no SCC issue but every edge is a bridge
- an SCC can be size `1` even with no self-loop
- parallel edges can remove what would otherwise be a bridge

Short debugging checklist:

- verify whether the graph is directed or undirected
- verify discovery times strictly increase once per first visit
- verify low-link values only decrease through valid back-edge logic
- verify the root articulation rule is handled separately
- verify SCC Tarjan updates only through neighbors still on the stack
- draw the DFS tree and mark back edges if the answer looks wrong

## 6. Practice Problems

### Easy

- Title: Count Strongly Connected Groups. One-line prompt: return how many SCCs exist in a small directed graph. Expected pattern or core idea: Kosaraju or Tarjan SCC decomposition.
- Title: Is This Road Critical? One-line prompt: determine whether one named undirected edge is a bridge. Expected pattern or core idea: bridge definition plus low-link intuition.
- Title: Is This Router Critical? One-line prompt: determine whether removing one vertex disconnects the graph. Expected pattern or core idea: articulation-point conditions.

### Medium

- Title: Critical Connections in a Network. One-line prompt: list all edges whose removal disconnects the undirected network. Expected pattern or core idea: Tarjan bridge algorithm.
- Title: Strong Connectivity Compression. One-line prompt: decompose a directed graph into SCCs and build the condensation DAG. Expected pattern or core idea: SCC decomposition.
- Title: Minimum New Links for Strong Connectivity. One-line prompt: find how many directed edges must be added after SCC compression. Expected pattern or core idea: SCC condensation indegree and outdegree reasoning.

### Hard

- Title: 2-SAT Satisfiability Check. One-line prompt: decide whether implication constraints are satisfiable. Expected pattern or core idea: SCCs on an implication graph.
- Title: Offline Critical Vertex Queries. One-line prompt: answer whether removing certain vertices disconnects key pairs. Expected pattern or core idea: articulation structure and block reasoning.
- Title: Robust Network Upgrade Planning. One-line prompt: identify bridge-heavy and articulation-heavy regions before adding redundancy. Expected pattern or core idea: graph-cut intuition on DFS structure.

## 7. Short Recap

The core idea of this chapter is that graph structure under failure can be read from DFS order and low-link values.

The most important optimization insight is that one DFS can replace many repeated connectivity checks.

The most important implementation warning is to keep the directed SCC rules separate from the undirected bridge and articulation rules.

This chapter prepares the next chapter by finishing graph structure analysis and setting up the Part VI transition into proof-driven algorithm design.

## 8. Coverage Check

- [x] 27.1 Strongly connected components
- [x] 27.2 Kosaraju's algorithm
- [x] 27.3 Tarjan's algorithm
- [x] 27.4 Bridges in graphs
- [x] 27.5 Articulation points
- [x] 27.6 Failure analysis and graph-cut intuition

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 28: Greedy Algorithms
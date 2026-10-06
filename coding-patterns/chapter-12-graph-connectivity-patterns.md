# 12: Graph Connectivity Patterns

## 0. Introduction

This chapter sits in Part III - Recursive Search, Trees, and Graph Structure (Weeks 10-15), with the roadmap treating it as intermediate to upper intermediate work. Its goal is to learn how to model graph problems around connectivity, reachability, dependencies, and cycles so you can choose DFS, BFS, union find, topological sort, or strongly connected component logic deliberately. This chapter directly supports the Part III outcome of mapping graph problems to the right traversal or preprocessing pattern and building confidence with connectivity problems in Java.

Read it as a bridge in the larger sequence. Chapter 11 used DFS, BFS, and ancestor reasoning on trees, where structure is acyclic and rooted. This chapter generalizes those ideas to graphs, where cycles, multiple components, and arbitrary edges make visited-state discipline essential. Chapter 13 adds weights and capacities, turning plain connectivity into shortest paths, minimum spanning trees, and flow networks. Start this chapter after you are comfortable with Chapters 1 through 11, especially DFS, BFS, queues, recursion state, and tree traversal discipline. The main themes here are Graph DFS Pattern, Graph BFS Pattern, Union Find Pattern, Topological Sort Pattern, Strongly Connected Components Pattern, and Modeling components, dependencies, and cycles.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to use graph DFS and BFS for traversal and shortest unweighted reach, apply union find for dynamic connectivity, use topological sort for dependency ordering, reason about strongly connected components in directed graphs, and model components, dependencies, and cycles cleanly in Java.

## 1. Intuition First

This chapter matters because graphs are where traversal patterns stop being purely local. In a tree, there is one simple parent-to-child structure and no cycles. In a graph, there may be multiple components, multiple incoming edges, back edges, cycles, and dependency directions. If the graph model is wrong, the whole algorithm usually follows it into confusion.

The simplest analogy is a transportation map. Some questions ask whether two stations are connected at all. Some ask for the fewest stops in an unweighted network. Some ask whether a set of tasks can be finished given prerequisites. Some ask whether two areas are mutually reachable in both directions. Each question is about graph structure, but not the same structure.

The core mental model is:

- DFS is strong for component exploration, cycle detection, and structure discovery
- BFS is strong for shortest reach in unweighted graphs and frontier growth
- union find is strong for dynamic connectivity and component merging
- topological sort is strong for dependency order in directed acyclic graphs
- strongly connected components capture mutual reachability in directed graphs

Recognition signals for this chapter:

- explicit nodes and edges, or implicit state transitions
- connected components, reachability, or cycle detection
- prerequisites, ordering constraints, or dependency graphs
- dynamic merging of groups
- mutual reachability in a directed graph

The most common beginner confusion point is treating every graph as “just DFS.” DFS is often useful, but the graph question may really be about shortest unweighted distance, dynamic connectivity, dependency order, or strongly connected structure instead.

In the larger roadmap, this chapter is the core graph-connectivity layer before weighted edges and flow networks add cost and capacity reasoning in the next chapter.

## 2. Learning Path and Recognition Checklist

The chapter starts with graph DFS and BFS because they are the two most common ways to explore graph structure. It then introduces union find, which avoids repeated traversal when edges arrive dynamically or component queries dominate. After that, it moves to topological sort for prerequisite order and cycle detection in directed acyclic settings. Finally, it introduces strongly connected components, where direction matters enough that ordinary component logic is no longer sufficient.

Recognition checklist for this chapter:

- Is the graph directed or undirected?
- Do I need to visit one component, count all components, or answer repeated connectivity merges?
- Does the problem ask for shortest number of edges in an unweighted graph?
- Does the graph encode prerequisites or dependencies?
- Is the key question about cycles, or about mutual reachability in a directed graph?
- Is the graph explicit as edges and nodes, or implicit through allowed transitions between states?

The brute-force baselines often look like this:

- launch fresh traversals from many nodes without reusing visited information
- recompute connectivity from scratch after each new edge
- try all possible orderings to satisfy prerequisites
- treat directed reachability as if undirected connectivity were enough

The optimization in this chapter is to choose the graph pattern that matches the structural question:

- DFS for exploration and structural discovery
- BFS for shortest unweighted reach
- union find for merge-based connectivity
- topological sort for dependency order
- SCC for mutual directed reachability

Mastery by the end of the chapter looks like this: you can explain what the nodes and edges represent, whether visited state or component labels are needed, and why the chosen graph pattern matches the question better than its neighbors.

Do not force BFS when the main issue is dependency ordering. Do not force union find when edge direction matters. Do not force topological sort on graphs that may need SCC reasoning because cycles are part of the structure, not just an error case.

## 3. Official Subtopic Coverage

### Concept Cluster: Traversal for Reachability and Components
Official subtopics covered:
- 12.1 Graph DFS Pattern
- 12.2 Graph BFS Pattern

#### Definition or Framing
Graph DFS explores deeply along edges before backtracking, which is useful for reachability, component discovery, and cycle-aware structural traversal. Graph BFS expands layer by layer, which is useful for shortest path by number of edges in unweighted graphs.

#### Recognition Signals
- DFS: connected components, cycle detection, path existence, structural exploration
- BFS: shortest unweighted distance, minimum steps, frontier growth, layer grouping

#### Brute-Force Baseline
- from each node, restart exploration without remembering what has already been visited
- for shortest unweighted path, enumerate longer and longer paths or use repeated DFS with poor distance control

#### Optimized Pattern Idea
Maintain a visited structure so each node is processed at most once per traversal goal. Use DFS when depth-first exploration or recursion state matters, and BFS when the first time a node is reached should correspond to its minimum edge distance.

#### Invariant / State Representation / Transition Logic
DFS invariant: once a node is marked visited, it belongs to the currently discovered reachable structure and should not be expanded again in the same traversal. BFS invariant: the queue frontier is processed in nondecreasing distance order, so the first time a node is dequeued or enqueued, its shortest unweighted distance is fixed.

#### Java Implementation Notes
- use adjacency lists for sparse graphs
- `boolean[] visited` is the standard starting point for simple traversals
- BFS typically stores node indices and optionally a distance array
- recursive DFS is concise, but iterative DFS can avoid deep call stacks on large graphs

#### Quick Dry Run
In an unweighted graph, if BFS reaches node `7` from node `0` in three edge layers, no later path with more layers can be shorter. That is why BFS gives shortest path by edge count.

#### Common Mistakes
- marking visited too late and enqueuing or recursing into the same node repeatedly
- using DFS when the problem asks for shortest unweighted distance
- forgetting that directed graphs restrict traversal direction

#### Debugging Strategy
Print the traversal order on a tiny graph and state what `visited` means. For BFS, also print node distances by layer.

#### Comparison with Similar Pattern
DFS and BFS can both answer reachability, but BFS has the extra shortest-layer guarantee in unweighted graphs. DFS does not.

#### Advanced Note
Later weighted graph chapters replace BFS with shortest-path algorithms when edge costs stop being uniform.

### Concept Cluster: Dynamic Connectivity and Dependency Order
Official subtopics covered:
- 12.3 Union Find Pattern
- 12.4 Topological Sort Pattern

#### Definition or Framing
Union find, also called disjoint set union, maintains components under edge unions and fast connectivity queries. Topological sort orders nodes in a directed acyclic graph so every prerequisite comes before its dependent node.

#### Recognition Signals
- union find: repeated merge operations, dynamic connectivity, cycle detection in undirected graphs, component counting under added edges
- topological sort: prerequisites, dependency order, “can all tasks be finished,” directed acyclic structure

#### Brute-Force Baseline
- union find baseline: after each new edge, recompute connectivity with a fresh DFS or BFS
- topological sort baseline: try all possible orderings and test whether each respects the prerequisites

#### Optimized Pattern Idea
Union find compresses component structure into parent pointers and ranks or sizes. Topological sort tracks indegrees or DFS finish order so dependency-safe order emerges without testing every permutation.

#### Invariant / State Representation / Transition Logic
Union find invariant: each set has a representative root, and `find` returns the current component representative. Topological sort invariant: nodes with indegree zero currently have all prerequisites satisfied and are safe to process next.

#### Java Implementation Notes
- path compression and union by rank or size make union find efficient in practice
- Kahn's algorithm for topological sort uses a queue of indegree-zero nodes
- DFS-based topological sort uses postorder and reverse finishing order, but cycle detection must be handled explicitly

#### Quick Dry Run
If course `2` depends on courses `0` and `1`, then course `2` cannot enter the topological order until both incoming dependencies are processed and its indegree drops to zero.

#### Common Mistakes
- using union find on directed prerequisite graphs where direction matters
- forgetting to decrement indegree of neighbors in Kahn's algorithm
- assuming every graph has a topological order even when cycles exist

#### Debugging Strategy
For union find, print parent roots after unions on a tiny graph. For topological sort, print indegrees and the queue after each processed node.

#### Comparison with Similar Pattern
Union find answers “which component is this node in now?” Topological sort answers “in what order can dependency-constrained nodes be processed?” They solve very different graph questions.

#### Advanced Note
Union find becomes important again in MST algorithms, while topological ordering later supports DP on DAGs and dependency-driven workflows.

### Concept Cluster: Directed Structure, SCCs, and Modeling
Official subtopics covered:
- 12.5 Strongly Connected Components Pattern
- 12.6 Modeling components, dependencies, and cycles

#### Definition or Framing
Strongly connected components, or SCCs, are maximal groups of nodes in a directed graph where every node can reach every other node in the same group. More generally, graph modeling means deciding whether the problem is really about undirected components, directed dependencies, cycles, or mutually reachable directed regions.

#### Recognition Signals
- directed graph with mutual reachability questions
- need to compress cyclic directed regions into single meta-nodes
- cycle structure is part of the solution, not just something to reject
- the same real-world problem could be modeled with undirected edges, directed edges, or state-transition edges depending on the goal

#### Brute-Force Baseline
- from each directed node, run reachability to every other node and try to intersect results manually
- build the wrong graph model first, then patch the algorithm with extra checks

#### Optimized Pattern Idea
Use SCC algorithms such as Kosaraju or Tarjan to identify strongly connected regions directly. Model the graph before coding by asking what an edge means: connectivity, prerequisite, transition, or reversible relation.

#### Invariant / State Representation / Transition Logic
In SCC logic, nodes inside the same component are mutually reachable in both directions. In modeling, correctness begins before traversal: edges must represent exactly the relation the algorithm depends on.

#### Java Implementation Notes
- Kosaraju uses one DFS for finish order and another DFS on the reversed graph
- Tarjan uses discovery times and low-link values
- adjacency-list representation should match graph direction explicitly

#### Quick Dry Run
If nodes `0 -> 1 -> 2 -> 0` form a directed cycle, they belong to one SCC because each node can reach the others. A one-way edge from that SCC to node `3` does not place `3` in the same SCC unless reachability also returns back.

#### Common Mistakes
- treating directed connectivity as if undirected traversal were enough
- choosing the wrong edge direction when modeling prerequisites
- assuming any cycle in a directed graph automatically means one large SCC

#### Debugging Strategy
Before coding, write one sentence for what a node means and one sentence for what an edge means. Many graph bugs are modeling bugs, not traversal bugs.

#### Comparison with Similar Pattern
Undirected connected components group nodes by any path. Strongly connected components group directed nodes by two-way reachability. That is a much stronger condition.

#### Advanced Note
SCC compression often turns a cyclic directed graph into a DAG, which then makes topological reasoning possible on the compressed structure.

## 4. Pattern Template, State Model, or Core Workflow

Canonical graph DFS template:

```java
void dfs(int node, List<List<Integer>> graph, boolean[] visited) {
    visited[node] = true;
    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            dfs(neighbor, graph, visited);
        }
    }
}
```

Canonical graph BFS template:

```java
Deque<Integer> queue = new ArrayDeque<>();
queue.offerLast(start);
visited[start] = true;
distance[start] = 0;

while (!queue.isEmpty()) {
    int node = queue.pollFirst();
    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            visited[neighbor] = true;
            distance[neighbor] = distance[node] + 1;
            queue.offerLast(neighbor);
        }
    }
}
```

Canonical union find template:

```java
int rootFirst = find(first);
int rootSecond = find(second);
if (rootFirst != rootSecond) {
    union(rootFirst, rootSecond);
}
```

Canonical Kahn topological sort template:

```java
Deque<Integer> queue = new ArrayDeque<>();
for (int node = 0; node < nodeCount; node++) {
    if (indegree[node] == 0) {
        queue.offerLast(node);
    }
}
```

Important variables and decision rules:

- `visited`: whether a node has already been fully claimed for the current traversal goal
- `distance`: shortest unweighted distance in BFS
- `parent` and `rank` or `size`: union find component structure
- `indegree`: number of unmet prerequisites in topological sort
- graph direction: whether edges mean mutual connectivity, one-way dependency, or state transition

Safety rules:

- model nodes and edges before choosing the algorithm
- mark visited at the right moment to prevent duplicate work
- use union find only when direction does not matter for the query
- topological sort is valid only for DAG-style dependency order
- SCC reasoning is required when direction and mutual reachability both matter

What usually breaks first is graph modeling. A correct DFS or BFS on the wrong graph is still the wrong solution.

Adapt the templates by changing node payload, edge direction, or stored metadata, but keep the graph meaning explicit.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Count Connected Components in an Undirected Graph
#### Problem Statement
Given `n` nodes labeled `0` to `n - 1` and a list of undirected edges, return the number of connected components.

#### Why This Example Matters
This is the foundational graph DFS example because it shows how one outer scan plus one traversal per unseen component counts the full graph structure.

#### Input and Constraints
- graph is undirected
- nodes may be isolated
- edges may not connect the entire graph

#### Recognition Signals
- connected components
- undirected connectivity
- need to count groups, not just traverse one start node

#### Brute-Force Approach
For each node, run a fresh traversal to figure out which nodes are connected to it, then try to deduplicate those groups afterward.

#### Better Pattern-Based Approach
Build an adjacency list. Scan all nodes. Each time an unvisited node is found, run DFS from it and increment the component count once.

#### Why the Pattern Fits
DFS marks one entire connected component at a time. Once marked, those nodes never need to be explored again for the same question.

#### Invariant or State Transition
After each DFS call started from an unvisited node, every node in that component is marked visited, and the component count has increased by one exactly once for that component.

#### Pragmatic Java Choice
Use `List<List<Integer>>` for the adjacency list and a `boolean[] visited` array.

#### Dry Run Before Code
If nodes `{0, 1, 2}` are connected and nodes `{3, 4}` are connected separately, the outer loop starts DFS at `0` for the first component and later at `3` for the second. No other starting node should increment the count.

#### Java Solution
```java
import java.util.ArrayList;
import java.util.List;

public class ConnectedComponentsDFS {
    public int countComponents(int n, int[][] edges) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int node = 0; node < n; node++) {
            graph.add(new ArrayList<>());
        }

        for (int[] edge : edges) {
            int first = edge[0];
            int second = edge[1];
            graph.get(first).add(second);
            graph.get(second).add(first);
        }

        boolean[] visited = new boolean[n];
        int components = 0;

        for (int node = 0; node < n; node++) {
            if (!visited[node]) {
                components++;
                dfs(node, graph, visited);
            }
        }

        return components;
    }

    private void dfs(int node, List<List<Integer>> graph, boolean[] visited) {
        visited[node] = true;
        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                dfs(neighbor, graph, visited);
            }
        }
    }
}
```

#### Time and Space Complexity
- Brute force repeated traversals: up to $O(n(n + m))$ time where `m` is edge count
- DFS component count: $O(n + m)$ time, $O(n + m)$ graph storage plus recursion depth

#### Edge Cases
- no edges
- one large component
- isolated nodes
- repeated edge input if not filtered by problem constraints

#### Common Mistakes
- incrementing the component count for every node instead of every unvisited start node
- forgetting to add both directions for an undirected graph
- failing to mark visited before recursing further

### Worked Example 2: Shortest Path in an Unweighted Graph
#### Problem Statement
Given an undirected unweighted graph with `n` nodes, an edge list, a source node, and a target node, return the minimum number of edges needed to reach the target from the source, or `-1` if unreachable.

#### Why This Example Matters
This is the cleanest graph BFS example because the first time BFS reaches a node is its shortest unweighted distance.

#### Input and Constraints
- graph is unweighted
- graph may be disconnected
- shortest edge count is required

#### Recognition Signals
- minimum number of steps or edges
- unweighted graph
- layer-by-layer exploration fits the question exactly

#### Brute-Force Approach
Enumerate all simple paths from the source and track the shortest one reaching the target.

#### Better Pattern-Based Approach
Use BFS from the source. Track distances in edge layers.

#### Why the Pattern Fits
All edges cost the same, so BFS layers correspond directly to shortest path length by edge count.

#### Invariant or State Transition
When a node is first discovered by BFS, its recorded distance is the minimum number of edges from the source.

#### Pragmatic Java Choice
Use an adjacency list, a queue, and an `int[] distance` array initialized to `-1`.

#### Dry Run Before Code
If the source is `0`, all nodes reachable in one edge get distance `1` first, then all nodes reachable in two edges get distance `2`, and so on. A later route cannot beat the first layer that reached a node.

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class UnweightedShortestPathBFS {
    public int shortestPath(int n, int[][] edges, int source, int target) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int node = 0; node < n; node++) {
            graph.add(new ArrayList<>());
        }

        for (int[] edge : edges) {
            graph.get(edge[0]).add(edge[1]);
            graph.get(edge[1]).add(edge[0]);
        }

        int[] distance = new int[n];
        for (int node = 0; node < n; node++) {
            distance[node] = -1;
        }

        Deque<Integer> queue = new ArrayDeque<>();
        queue.offerLast(source);
        distance[source] = 0;

        while (!queue.isEmpty()) {
            int node = queue.pollFirst();
            if (node == target) {
                return distance[node];
            }

            for (int neighbor : graph.get(node)) {
                if (distance[neighbor] == -1) {
                    distance[neighbor] = distance[node] + 1;
                    queue.offerLast(neighbor);
                }
            }
        }

        return -1;
    }
}
```

#### Time and Space Complexity
- Enumerating simple paths: exponential in the worst case
- BFS shortest path: $O(n + m)$ time, $O(n + m)$ space

#### Edge Cases
- source equals target
- target unreachable
- graph with isolated nodes

#### Common Mistakes
- using DFS and expecting the first found path to be shortest
- marking visited too late and re-enqueuing nodes unnecessarily
- forgetting that the graph is undirected in adjacency construction

### Worked Example 3: Redundant Connection with Union Find
#### Problem Statement
You are given a tree with one extra undirected edge added. Return the edge that can be removed so the graph becomes a tree again.

#### Why This Example Matters
This is a clean union-find example because each new edge either joins two different components safely or creates a cycle inside one component.

#### Input and Constraints
- graph is undirected
- exactly one extra edge creates a cycle
- edges arrive one by one in input order

#### Recognition Signals
- dynamic connectivity under edge additions
- cycle detection in an undirected graph
- repeated component merging

#### Brute-Force Approach
For each edge, temporarily add it and run a fresh DFS or BFS to see whether it closes a cycle.

#### Better Pattern-Based Approach
Use union find. If two endpoints already share the same root, the edge is redundant. Otherwise union their components.

#### Why the Pattern Fits
The question is not about full traversal order. It is about whether two nodes are already in the same connected component at the moment an edge arrives.

#### Invariant or State Transition
Before processing each edge, union find represents the connected components formed by all earlier edges. An edge is redundant exactly when both endpoints already belong to the same component.

#### Pragmatic Java Choice
Use path compression and union by rank for a compact DSU implementation.

#### Dry Run Before Code
If edges have already merged `1`, `2`, and `3` into one component, then an edge `(1, 3)` does not connect new components. It closes a cycle and is therefore redundant.

#### Java Solution
```java
public class RedundantConnectionUnionFind {
    public int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        UnionFind unionFind = new UnionFind(n + 1);

        for (int[] edge : edges) {
            if (!unionFind.union(edge[0], edge[1])) {
                return edge;
            }
        }

        return new int[0];
    }

    static class UnionFind {
        private final int[] parent;
        private final int[] rank;

        UnionFind(int size) {
            parent = new int[size];
            rank = new int[size];
            for (int index = 0; index < size; index++) {
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
}
```

#### Time and Space Complexity
- Recompute connectivity per edge: $O(m(n + m))$ in dense repeated-check settings
- Union find: near-linear total time, often written as $O(m \alpha(n))$, with $O(n)$ extra space

#### Edge Cases
- redundant edge appears late in input
- endpoints already indirectly connected through many earlier unions
- small graph with only one cycle

#### Common Mistakes
- trying to use union find on directed-cycle dependency questions
- forgetting to compress paths or balance unions in larger inputs
- assuming node labels are zero-based when the problem is one-based

### Worked Example 4: Course Schedule II with Topological Sort
#### Problem Statement
There are `numCourses` labeled from `0` to `numCourses - 1`. Given prerequisite pairs `[course, prerequisite]`, return a valid order to finish all courses, or an empty array if impossible.

#### Why This Example Matters
This is the standard topological-sort example because the graph is about directed dependency order, not undirected connectivity.

#### Input and Constraints
- edges are directed from prerequisite to dependent course
- cycles make completion impossible
- one valid order is enough

#### Recognition Signals
- prerequisites
- dependency order
- cycle means no valid schedule

#### Brute-Force Approach
Try all permutations of the courses and test whether each respects every prerequisite.

#### Better Pattern-Based Approach
Use Kahn's algorithm. Build indegrees, start with courses whose indegree is zero, and process them while reducing neighbors' indegrees.

#### Why the Pattern Fits
Courses with indegree zero have no unmet prerequisites, so they are exactly the safe next choices. A cycle is detected when not all courses can be processed.

#### Invariant or State Transition
At every step, the queue contains exactly the courses whose prerequisites have all been satisfied by earlier choices in the output order.

#### Pragmatic Java Choice
Use adjacency lists, an indegree array, and an `ArrayDeque<Integer>`.

#### Dry Run Before Code
If course `1` depends on `0`, and course `2` depends on `0`, then `0` starts with indegree zero and leaves the queue first. Processing `0` reduces the indegree of `1` and `2`, making them eligible next.

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class CourseScheduleTopologicalSort {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int course = 0; course < numCourses; course++) {
            graph.add(new ArrayList<>());
        }

        int[] indegree = new int[numCourses];
        for (int[] prerequisite : prerequisites) {
            int course = prerequisite[0];
            int dependency = prerequisite[1];
            graph.get(dependency).add(course);
            indegree[course]++;
        }

        Deque<Integer> queue = new ArrayDeque<>();
        for (int course = 0; course < numCourses; course++) {
            if (indegree[course] == 0) {
                queue.offerLast(course);
            }
        }

        int[] order = new int[numCourses];
        int index = 0;

        while (!queue.isEmpty()) {
            int course = queue.pollFirst();
            order[index++] = course;

            for (int nextCourse : graph.get(course)) {
                indegree[nextCourse]--;
                if (indegree[nextCourse] == 0) {
                    queue.offerLast(nextCourse);
                }
            }
        }

        if (index != numCourses) {
            return new int[0];
        }

        return order;
    }
}
```

#### Time and Space Complexity
- Testing all course orders: $O(n! \cdot m)$ or worse conceptually
- Kahn's algorithm: $O(n + m)$ time, $O(n + m)$ space

#### Edge Cases
- no prerequisites
- one long dependency chain
- directed cycle with no valid order

#### Common Mistakes
- reversing edge direction when building the graph
- forgetting to decrement indegrees of outgoing neighbors
- assuming a partial order is valid even when not all courses are processed

## 6. Complexity and Comparison Guide

This chapter's patterns differ by the kind of graph question they answer.

- Graph DFS and BFS each run in $O(n + m)$ time on adjacency lists, with DFS favoring structural discovery and BFS favoring shortest unweighted reach.
- Union find processes merges and connectivity checks in near-linear total time across many operations.
- Topological sort runs in $O(n + m)$ time and reveals dependency order only when the directed graph is acyclic at the relevant component level.
- SCC algorithms such as Kosaraju and Tarjan also run in linear time over nodes and edges, but answer a stronger directed reachability question.

Comparison with similar patterns:

- DFS versus BFS: both cover reachable nodes, but BFS owns shortest unweighted distance by layer.
- DFS/BFS versus union find: traversal inspects explicit graph structure; union find compresses component membership when edge merges dominate.
- Topological sort versus SCC: topological sort assumes DAG-style dependency order, while SCC reasoning identifies strongly cyclic directed regions first.
- Undirected components versus directed SCCs: a path in either direction is enough for undirected connectivity; SCCs require mutual directed reachability.

Decision criteria:

- choose DFS for components, structural discovery, and recursive graph exploration
- choose BFS for minimum edge count in unweighted graphs
- choose union find for repeated undirected connectivity merges and cycle checks
- choose topological sort for directed prerequisite order
- choose SCC when direction and mutual reachability both matter

Signals that you should not force this chapter's techniques:

- using union find for directed dependency order
- using plain DFS when shortest unweighted distance is the real goal
- using topological sort on cyclic directed graphs without first reasoning about cycles or SCCs

What breaks when the invariant or preconditions fail is often not the code but the model. A graph algorithm on the wrong edge direction or wrong node meaning can be perfectly implemented and still answer the wrong question.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- wrong edge direction in directed graph modeling
- marking visited too late in DFS or BFS
- forgetting isolated nodes when counting components
- using union find where direction matters
- failing to detect cycles when topological ordering is impossible

Boundary and modeling risks:

- one-based versus zero-based node labels
- disconnected graphs
- self-loops and duplicate edges depending on problem guarantees
- implicit graphs where generating neighbors incorrectly changes the problem itself

Short debugging checklist:

1. What exactly does a node represent?
2. What exactly does an edge mean, and is it directed?
3. What does `visited` mean in this traversal?
4. If using BFS, what does the current layer or distance value mean?
5. If using topological sort, which nodes currently have all prerequisites satisfied?

Quick counterexample that defeats a common wrong solution:

If prerequisites are modeled in the wrong direction, a course can appear before its requirement in the computed order. For example, with prerequisite pair `[1, 0]`, treating the edge as `1 -> 0` instead of `0 -> 1` reverses the dependency and breaks the schedule.

## 8. Practice Problems

### Easy
- Find if Path Exists in Graph: Decide whether two nodes are connected. Expected pattern or core idea: graph DFS or BFS.
- Number of Provinces: Count connected components from an adjacency matrix. Expected pattern or core idea: graph DFS/BFS.
- Find the Town Judge: Infer graph structure from trust relations. Expected pattern or core idea: directed degree modeling.

### Medium
- Course Schedule: Decide whether all courses can be finished. Expected pattern or core idea: topological sort or cycle detection.
- Redundant Connection: Return the extra undirected edge creating a cycle. Expected pattern or core idea: union find.
- Clone Graph: Copy all reachable nodes and edges. Expected pattern or core idea: graph DFS/BFS with visited map.

### Hard
- Strongly Connected Components on directed contest graphs: Identify mutually reachable directed regions. Expected pattern or core idea: Kosaraju or Tarjan.
- Alien Dictionary: Recover character order from sorted words. Expected pattern or core idea: topological sort on directed dependency graph.
- Critical Connections in a Network: Find bridges whose removal disconnects the graph. Expected pattern or core idea: DFS low-link reasoning.

## 9. Short Recap

The core idea of this chapter is that graph problems should be classified by structure before coding: components, shortest unweighted reach, dynamic merges, dependency order, or mutual directed reachability. The strongest recognition clue is what an edge means and whether direction or repeated merges matter. The most important optimization insight is that the right graph model usually makes the correct traversal or preprocessing pattern obvious. The most important implementation warning is that graph bugs are often modeling bugs first and traversal bugs second. This chapter prepares the next one by adding weights, cuts, relaxation, and capacities on top of the connectivity patterns established here.

## 10. Coverage Check

- 12.1 Graph DFS Pattern - Covered
- 12.2 Graph BFS Pattern - Covered
- 12.3 Union Find Pattern - Covered
- 12.4 Topological Sort Pattern - Covered
- 12.5 Strongly Connected Components Pattern - Covered
- 12.6 Modeling components, dependencies, and cycles - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 13: Weighted Graph and Network Patterns
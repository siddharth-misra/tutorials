# 24: Topological Sort and DAG Problems

**Goal:** Teach how directed acyclic graphs model one-way dependencies, how to compute a valid topological order in Java, and how that order solves dependency and shortest-path problems efficiently.
**Outcome:** By the end of this chapter, you can recognize a DAG, produce a topological ordering with Kahn's algorithm or DFS, solve dependency ordering problems, and compute shortest paths in DAGs in linear time.

---

## 1. Intuition First

This chapter matters because many real problems are not just about reachability. They are about order. If task `A` must happen before task `B`, the graph is not just a set of connections. It is a dependency system.

A simple real-world analogy is a university degree plan:
- you cannot take advanced databases before the prerequisite programming course
- you cannot graduate if your prerequisites form a loop
- if the prerequisite graph has no directed cycle, there is at least one legal course order

The core mental model is this:
- a directed edge `u -> v` means `u` must come before `v`
- a directed acyclic graph, or DAG, is a directed graph with no directed cycle
- a topological order is a linear ordering of nodes where every edge points forward in the order

The most common beginner confusion point is mixing up plain traversal with dependency order. BFS and DFS tell you how to visit a graph. Topological sort tells you whether the graph admits a legal ordering and what one such ordering can be.

In the roadmap, Chapter 23 taught general graph traversal. This chapter adds a stricter graph shape and a stronger output: valid dependency order. That same order will become a powerful optimization tool for shortest paths inside DAGs, which then leads naturally into the general shortest-path algorithms in the next chapter.

## 2. Core Concepts and Techniques

### Concept Cluster: DAG Structure and Dependency Modeling
Key concepts in this block:
- 24.1 Directed acyclic graphs
- 24.4 Dependency ordering problems

#### Intuition

A DAG is the graph version of "do these things in an order that respects prerequisites."

#### Why It Matters

Build systems, job scheduling, course planning, spreadsheet recalculation, and package installation all have this shape. The graph does not just describe what touches what. It describes what must happen first.

#### How It Works

A graph is a DAG if it is directed and contains no directed cycle.

A topological order exists if and only if the graph is a DAG.

For every edge `u -> v`, node `u` must appear before node `v` in any valid topological order.

Dependency ordering problems often reduce to three steps:
- choose the correct edge direction
- detect whether a cycle exists
- if no cycle exists, produce one valid order

#### Java Implementation Notes

- Use an adjacency list for most sparse graphs.
- Be explicit about edge meaning. If a pair says "prerequisite before course", store `prerequisite -> course`.
- Disconnected DAGs are normal. A topological order may start from any zero-dependency node in any component.

#### Common Mistakes

- reversing the edge direction
- assuming a topological order is unique
- trying to topologically sort an undirected graph
- forgetting that a directed cycle makes the problem impossible

#### Quick Example

If the graph has edges:
- `0 -> 2`
- `1 -> 2`
- `2 -> 3`

Then valid orders include:
- `0, 1, 2, 3`
- `1, 0, 2, 3`

Node `2` cannot come before `0` or `1`, and node `3` cannot come before `2`.

#### Debugging Tip

If the produced order violates a dependency, inspect one edge at a time and ask whether the graph direction matches the problem statement.

#### Advanced Note

Topological order is only about relative constraints. It does not say anything about path cost, earliest completion time, or optimality by itself.

### Concept Cluster: Kahn's Algorithm
Key concepts in this block:
- 24.2 Kahn's algorithm

#### Intuition

Kahn's algorithm repeatedly removes nodes that currently have no incoming dependencies.

#### Why It Matters

It is the most direct algorithm for dependency scheduling. It is also very good at cycle detection because a cycle leaves nodes stuck with indegree greater than zero.

#### How It Works

Kahn's algorithm uses indegree, which is the number of incoming edges to a node.

Algorithm:
- compute indegree for every node
- push all nodes with indegree `0` into a queue
- repeatedly pop a node, add it to the answer, and reduce the indegree of its outgoing neighbors
- when a neighbor reaches indegree `0`, push it into the queue
- if the answer contains fewer than all nodes, the graph has a cycle

#### Java Implementation Notes

- Use `int[] indegree`.
- Use `ArrayDeque<Integer>` as the queue.
- If the problem wants a smallest-numbered valid order, use a `PriorityQueue<Integer>` instead of a queue.

#### Common Mistakes

- forgetting to initialize all zero-indegree nodes
- decrementing the wrong endpoint of an edge
- treating "queue became empty" as success even when some nodes were never processed

#### Quick Example

Suppose indegrees start as:
- node `0`: `0`
- node `1`: `0`
- node `2`: `2`
- node `3`: `1`

Queue starts with `0, 1`. Once both are removed, node `2` reaches indegree `0`, and then node `3` becomes available.

#### Debugging Tip

After building the graph, the sum of all indegrees should equal the number of edges.

#### Advanced Note

Kahn's algorithm naturally supports level-based scheduling variants, such as "minimum semesters" or "number of rounds."

### Concept Cluster: DFS-Based Topological Sort
Key concepts in this block:
- 24.3 DFS-based topological sort

#### Intuition

DFS-based topological sort uses finishing order. A node is added after all nodes reachable from it have already been processed.

#### Why It Matters

This version is often convenient when DFS is already the natural reasoning tool, especially when you want explicit cycle detection with recursion-stack state.

#### How It Works

Use three states:
- `0`: unvisited
- `1`: visiting
- `2`: fully processed

DFS steps:
- mark the current node as visiting
- recursively process each outgoing neighbor
- if you ever see a neighbor already in state `1`, you found a directed cycle
- after all neighbors are done, mark the current node as processed and append it to the order
- reverse the final order

#### Java Implementation Notes

- A plain `visited[]` array is not enough for directed cycle detection here.
- Use recursion for clarity or an explicit stack if depth may be large.
- Reverse postorder is the key result, not preorder.

#### Common Mistakes

- using only `visited[]` and missing back edges
- forgetting to reverse the collected order
- applying undirected cycle logic to a directed graph

#### Quick Example

For edges `0 -> 2`, `1 -> 2`, `2 -> 3`:
- DFS from `0` reaches `2`, then `3`
- `3` finishes first
- then `2`
- then `0`
- after also processing `1`, reversing the finish order gives a valid topological order

#### Debugging Tip

Log state transitions as `0 -> 1 -> 2`. A node should never move backward.

#### Advanced Note

Recursive DFS is elegant, but on very deep DAGs an iterative implementation may be safer in production.

### Concept Cluster: Shortest Paths in DAGs
Key concepts in this block:
- 24.5 Shortest paths in DAGs

#### Intuition

In a DAG, once you process nodes in topological order, every edge into the current node has already been considered. That removes the need for repeated revisits.

#### Why It Matters

This gives a shortest-path algorithm in `O(V + E)` time, which is faster than general shortest-path algorithms for this special graph shape.

#### How It Works

Steps:
- compute a topological order
- initialize all distances to infinity except the source
- process nodes in topological order
- for each edge `u -> v` with weight `w`, relax it by checking whether `distance[u] + w` improves `distance[v]`

Relaxation means trying to improve a known distance using one more edge.

This works even with negative edge weights, as long as the graph is a DAG.

#### Java Implementation Notes

- Use `long` for distances.
- Keep unreachable nodes at a large sentinel value.
- Guard against adding to infinity by checking reachability before relaxing.

#### Common Mistakes

- trying this on a graph that may contain cycles
- assuming unreachable nodes should become `0`
- forgetting that edge direction still matters

#### Quick Example

Edges:
- `0 -> 1` with weight `2`
- `0 -> 2` with weight `4`
- `1 -> 2` with weight `-1`

If the topological order is `0, 1, 2`, then:
- after processing `0`, distances are `0, 2, 4`
- after processing `1`, distance to `2` improves from `4` to `1`

#### Debugging Tip

Print the topological order before relaxing edges. If the order is wrong, all later shortest-path logic will also be wrong.

#### Advanced Note

The same pattern can solve longest-path-style DAG problems if the recurrence and initialization are adjusted carefully.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Course Schedule Ordering with Kahn's Algorithm
#### Problem Statement

Given `numCourses` labeled `0` to `numCourses - 1` and prerequisite pairs `[course, prerequisite]`, return one valid order in which all courses can be completed. If no valid order exists, return an empty list.

#### Why This Example Matters

This is the standard dependency-ordering problem. It maps directly to a DAG and makes indegree reasoning concrete.

#### Constraints or Assumptions

- the graph is directed
- there may be disconnected components
- multiple valid orders may exist
- an empty result means a cycle exists

#### Brute-Force Approach

Repeatedly scan all unscheduled courses and ask whether every prerequisite has already been completed.

This works, but it rescans the prerequisite list again and again.

#### Better Approach

Use Kahn's algorithm with an indegree array and a queue of currently available courses.

#### Why the Better Approach Works

A course is ready exactly when all incoming dependencies have been removed. Kahn's algorithm tracks that condition incrementally instead of recomputing it from scratch every round.

#### Pragmatic Java Choice

Use:
- an adjacency list from `prerequisite -> course`
- an `int[] indegree`
- an `ArrayDeque<Integer>` queue

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Queue;
import java.util.Set;

class KahnTopologicalOrderExample {
    static List<Integer> naiveOrderByRescanning(int numCourses, int[][] prerequisites) {
        Set<Integer> scheduled = new HashSet<>();
        List<Integer> order = new ArrayList<>();

        boolean madeProgress = true;
        while (order.size() < numCourses && madeProgress) {
            madeProgress = false;

            for (int course = 0; course < numCourses; course++) {
                if (scheduled.contains(course)) {
                    continue;
                }

                boolean ready = true;
                for (int[] prerequisite : prerequisites) {
                    int nextCourse = prerequisite[0];
                    int requiredCourse = prerequisite[1];
                    if (nextCourse == course && !scheduled.contains(requiredCourse)) {
                        ready = false;
                        break;
                    }
                }

                if (ready) {
                    scheduled.add(course);
                    order.add(course);
                    madeProgress = true;
                }
            }
        }

        return order.size() == numCourses ? order : List.of();
    }

    static List<Integer> topologicalOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int course = 0; course < numCourses; course++) {
            graph.add(new ArrayList<>());
        }

        int[] indegree = new int[numCourses];
        for (int[] prerequisite : prerequisites) {
            int course = prerequisite[0];
            int requiredCourse = prerequisite[1];
            graph.get(requiredCourse).add(course);
            indegree[course]++;
        }

        Queue<Integer> queue = new ArrayDeque<>();
        for (int course = 0; course < numCourses; course++) {
            if (indegree[course] == 0) {
                queue.offer(course);
            }
        }

        List<Integer> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            int course = queue.poll();
            order.add(course);

            for (int nextCourse : graph.get(course)) {
                indegree[nextCourse]--;
                if (indegree[nextCourse] == 0) {
                    queue.offer(nextCourse);
                }
            }
        }

        return order.size() == numCourses ? order : List.of();
    }
}
```

#### Dry Run

Input:
- `numCourses = 4`
- prerequisites: `[1, 0]`, `[2, 0]`, `[3, 1]`, `[3, 2]`

Graph:
- `0 -> 1`
- `0 -> 2`
- `1 -> 3`
- `2 -> 3`

Indegrees:
- `0: 0`
- `1: 1`
- `2: 1`
- `3: 2`

Process:
- queue starts with `0`
- pop `0`, order becomes `[0]`, indegrees of `1` and `2` become `0`
- queue now has `1, 2`
- pop `1`, order becomes `[0, 1]`, indegree of `3` becomes `1`
- pop `2`, order becomes `[0, 1, 2]`, indegree of `3` becomes `0`
- pop `3`, order becomes `[0, 1, 2, 3]`

#### Time and Space Complexity

Brute force:
- Time: `O(VE)` in the common repeated-rescan form
- Space: `O(V)`

Kahn's algorithm:
- Time: `O(V + E)`
- Space: `O(V + E)`

#### Edge Cases

- cycle such as `0 -> 1 -> 0`
- isolated courses with no prerequisites
- duplicate prerequisite pairs if input is not sanitized
- `numCourses = 0`

#### Common Mistakes

- building the edge as `course -> prerequisite`
- forgetting to compare output size with `numCourses`
- only seeding the queue with one zero-indegree node instead of all of them

### Worked Example 2: Build Order with DFS-Based Topological Sort
#### Problem Statement

Given `moduleCount` modules and dependency pairs `[prerequisite, dependent]`, return one valid build order. If the dependencies contain a cycle, return an empty list.

#### Why This Example Matters

It shows the DFS version of topological sort and makes directed cycle detection explicit.

#### Constraints or Assumptions

- dependencies are directed
- the build graph may be disconnected
- any valid order is acceptable

#### Brute-Force Approach

Generate all permutations of the modules and test whether each order respects every dependency.

That is conceptually simple but factorial in the number of modules, so it becomes useless quickly.

#### Better Approach

Use DFS with a three-state array and reverse finishing order.

#### Why the Better Approach Works

A node is added only after every node reachable from it has been fully processed. Reversing that finishing order places prerequisites before dependents. A back edge to a currently visiting node proves a cycle.

#### Pragmatic Java Choice

Use:
- an adjacency list from `prerequisite -> dependent`
- an `int[] state` with values `0`, `1`, and `2`
- a `List<Integer>` to collect finish order

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class DfsTopologicalOrderExample {
    static List<Integer> buildOrder(int moduleCount, int[][] dependencies) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int module = 0; module < moduleCount; module++) {
            graph.add(new ArrayList<>());
        }

        for (int[] dependency : dependencies) {
            int prerequisite = dependency[0];
            int dependent = dependency[1];
            graph.get(prerequisite).add(dependent);
        }

        int[] state = new int[moduleCount];
        List<Integer> order = new ArrayList<>();

        for (int module = 0; module < moduleCount; module++) {
            if (state[module] == 0 && !dfs(module, graph, state, order)) {
                return List.of();
            }
        }

        Collections.reverse(order);
        return order;
    }

    private static boolean dfs(int node, List<List<Integer>> graph, int[] state, List<Integer> order) {
        state[node] = 1;

        for (int neighbor : graph.get(node)) {
            if (state[neighbor] == 1) {
                return false;
            }
            if (state[neighbor] == 0 && !dfs(neighbor, graph, state, order)) {
                return false;
            }
        }

        state[node] = 2;
        order.add(node);
        return true;
    }
}
```

#### Dry Run

Input:
- `moduleCount = 5`
- dependencies: `[0, 2]`, `[1, 2]`, `[2, 3]`

Meaning:
- `0` before `2`
- `1` before `2`
- `2` before `3`
- `4` is independent

Possible DFS flow:
- start at `0`
- go to `2`
- go to `3`
- finish `3`, then `2`, then `0`
- later process `1`, then `4`

Collected finish order could be:
- `[3, 2, 0, 1, 4]`

Reverse it:
- `[4, 1, 0, 2, 3]`

That is valid because `0` and `1` still come before `2`, and `2` comes before `3`.

#### Time and Space Complexity

Brute force:
- Time: `O(V! * E)`
- Space: `O(V)`

DFS topological sort:
- Time: `O(V + E)`
- Space: `O(V + E)` plus recursion stack up to `O(V)`

#### Edge Cases

- a self-loop such as `[2, 2]`
- multiple disconnected components
- deep chains that may create recursion-depth concerns
- duplicate dependencies

#### Common Mistakes

- using only a boolean `visited[]`
- forgetting to reverse the finish order
- treating a fully processed node as a cycle

### Worked Example 3: Shortest Paths in a Weighted DAG
#### Problem Statement

Given a weighted DAG with `nodeCount` nodes, an edge list `[from, to, weight]`, and a source node, return the shortest distance from the source to every node. Use a large sentinel for unreachable nodes.

#### Why This Example Matters

It shows why topological order is not just for dependency output. In DAGs, it directly turns into dynamic programming over paths.

#### Constraints or Assumptions

- the graph must be a DAG
- edge weights may be positive, zero, or negative
- unreachable nodes should remain at infinity

#### Brute-Force Approach

Enumerate all directed paths starting from the source and keep the cheapest path to each destination.

That is exponential in the worst case because a DAG can still contain many distinct paths.

#### Better Approach

Compute a topological order once, then relax edges in that order.

#### Why the Better Approach Works

When processing a node in topological order, every path into that node has already come from earlier nodes. That means its best distance is already finalized for the purpose of forward relaxations.

#### Pragmatic Java Choice

Use:
- an adjacency list with edge weights
- Kahn's algorithm to obtain a topological order
- a `long[] distance` array

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Queue;

class DagShortestPathExample {
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

        int[] indegree = new int[nodeCount];
        for (int[] edge : edges) {
            int from = edge[0];
            int to = edge[1];
            int weight = edge[2];
            graph.get(from).add(new Edge(to, weight));
            indegree[to]++;
        }

        List<Integer> order = topologicalOrder(graph, indegree);
        if (order.size() != nodeCount) {
            throw new IllegalArgumentException("Input graph must be a DAG.");
        }

        long infinity = Long.MAX_VALUE / 4;
        long[] distance = new long[nodeCount];
        Arrays.fill(distance, infinity);
        distance[source] = 0L;

        for (int node : order) {
            if (distance[node] == infinity) {
                continue;
            }

            for (Edge edge : graph.get(node)) {
                long candidate = distance[node] + edge.weight;
                if (candidate < distance[edge.to]) {
                    distance[edge.to] = candidate;
                }
            }
        }

        return distance;
    }

    private static List<Integer> topologicalOrder(List<List<Edge>> graph, int[] indegree) {
        Queue<Integer> queue = new ArrayDeque<>();
        for (int node = 0; node < indegree.length; node++) {
            if (indegree[node] == 0) {
                queue.offer(node);
            }
        }

        List<Integer> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            int node = queue.poll();
            order.add(node);

            for (Edge edge : graph.get(node)) {
                indegree[edge.to]--;
                if (indegree[edge.to] == 0) {
                    queue.offer(edge.to);
                }
            }
        }

        return order;
    }
}
```

#### Dry Run

Input:
- source `0`
- edges:
- `[0, 1, 2]`
- `[0, 2, 4]`
- `[1, 2, -1]`
- `[1, 3, 2]`
- `[2, 3, 3]`

One valid topological order:
- `0, 1, 2, 3`

Process:
- start distances as `[0, inf, inf, inf]`
- from `0`, relax to `[0, 2, 4, inf]`
- from `1`, improve node `2` to `1` and node `3` to `4`
- from `2`, candidate for node `3` is `1 + 3 = 4`, so no change
- final distances are `[0, 2, 1, 4]`

#### Time and Space Complexity

Brute force:
- Time: exponential in the number of distinct source-to-node paths
- Space: path-recursion dependent

Topological shortest path:
- Time: `O(V + E)`
- Space: `O(V + E)`

#### Edge Cases

- unreachable nodes
- negative edge weights
- graph accidentally containing a cycle
- source in a disconnected component

#### Common Mistakes

- forgetting to guard against relaxing from infinity
- assuming this works on arbitrary cyclic graphs
- building the topological order from the wrong edge direction

## 4. Complexity and Decision Guide

Across this chapter, the main trade-offs are simple:

- Kahn's algorithm: `O(V + E)` time, `O(V + E)` space. Choose it when indegree is natural, when you want explicit cycle detection by output size, or when layer-based scheduling matters.
- DFS-based topological sort: `O(V + E)` time, `O(V + E)` space. Choose it when DFS reasoning already fits the problem or when you want direct recursion-stack cycle detection.
- Shortest paths in DAGs: `O(V + E)` time after topological ordering. Choose it when the graph is guaranteed to be acyclic and path weights matter.

Use this chapter's techniques when you see signals like:
- prerequisites
- dependency graph
- build order
- task order
- schedule with no cycles
- weighted DAG

Do not force topological sort when:
- the graph is undirected
- the graph can contain cycles and the task is still meaningful
- you need shortest paths in a general weighted graph rather than a DAG

A practical rule:
- if you only need a legal dependency order, use Kahn or DFS topo sort
- if the graph is a DAG and you need weighted shortest paths, use topological relaxation
- if the graph is not guaranteed to be a DAG, wait for the algorithms in the next chapter

## 5. Edge Cases, Pitfalls, and Debugging

Common bugs in this chapter include:
- reversing dependency edges
- forgetting to process disconnected components
- using plain `visited[]` for directed cycle detection
- assuming an empty queue means success in Kahn's algorithm
- treating DAG shortest-path logic as valid on a cyclic graph

Boundary and correctness checks:
- zero nodes should not crash the implementation
- isolated nodes still belong in the topological order
- self-loops are immediate cycles
- unreachable nodes in DAG shortest paths should stay at infinity

Short debugging checklist:
- verify the edge direction against the problem statement
- verify the sum of indegrees equals the number of edges
- verify Kahn's output length equals `V`
- verify DFS state transitions only move `0 -> 1 -> 2`
- verify the topological order before relaxing shortest-path edges
- verify unreachable nodes are never used as relaxation sources

## 6. Practice Problems

### Easy

- Title: Course Schedule. One-line prompt: decide whether all courses can be finished under prerequisite constraints. Expected pattern or core idea: cycle detection in a directed graph with Kahn or DFS.
- Title: Course Schedule II. One-line prompt: return one valid order of courses if it exists. Expected pattern or core idea: topological sorting.
- Title: Find All Possible Recipes from Given Supplies. One-line prompt: determine which recipes can be made when recipes can depend on other recipes. Expected pattern or core idea: dependency graph and Kahn's algorithm.

### Medium

- Title: Parallel Courses. One-line prompt: compute the minimum number of rounds needed when any number of zero-indegree courses can be taken together. Expected pattern or core idea: Kahn's algorithm in layers.
- Title: Alien Dictionary. One-line prompt: infer a valid character order from a sorted dictionary. Expected pattern or core idea: graph construction plus topological sort.
- Title: Eventual Safe States. One-line prompt: find nodes that never lead into a directed cycle. Expected pattern or core idea: reverse graph and topological reasoning.

### Hard

- Title: Parallel Courses III. One-line prompt: compute the minimum total time when each course has its own duration. Expected pattern or core idea: topological order plus dynamic programming on a DAG.
- Title: Largest Color Value in a Directed Graph. One-line prompt: maximize repeated color count along a valid path or report a cycle. Expected pattern or core idea: topological DP with cycle detection.
- Title: Longest Weighted Path in a DAG. One-line prompt: find the maximum path value in an acyclic directed graph. Expected pattern or core idea: DAG dynamic programming after topological order.

## 7. Short Recap

The core idea of this chapter is that DAGs turn graph traversal into valid ordering.

The most important optimization insight is that once a graph is acyclic, topological order lets you solve dependency and path problems in linear time.

The most important implementation warning is to get edge direction and directed cycle detection exactly right.

This chapter prepares the next chapter by moving from DAG-specific path reasoning to shortest-path algorithms for general weighted graphs.

## 8. Coverage Check

- [x] 24.1 Directed acyclic graphs
- [x] 24.2 Kahn's algorithm
- [x] 24.3 DFS-based topological sort
- [x] 24.4 Dependency ordering problems
- [x] 24.5 Shortest paths in DAGs

Coverage Summary: 5/5 official subtopics covered
This must always be 5/5 before final output

Next: 25: Shortest Path Algorithms
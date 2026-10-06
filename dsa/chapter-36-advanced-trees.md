# 36: Advanced Trees

**Goal:** Teach how to answer advanced tree queries and reason about global tree properties using ancestor jumps, Euler tours, diameter methods, and heavy-path ideas.
**Outcome:** By the end of this chapter, you can solve LCA problems with binary lifting, flatten trees with Euler tour technique, compute tree diameter efficiently, and recognize when heavy-light decomposition is the right next tool.

---

## 1. Intuition First

This chapter matters because tree problems stop being simple once the question is no longer just "traverse the tree." You may need to compare ancestors, answer subtree queries, or reason about long paths quickly across many operations.

A simple real-world analogy is an organizational chart. If two employees ask for their closest shared manager, or if you want the total budget of one department, you should not walk the entire chart from scratch every time.

The core mental model is:

- preprocess the tree once
- map complex tree questions into simpler representations such as ancestor jumps or subtree intervals
- answer many queries faster than a fresh full traversal each time

The most common beginner confusion point is thinking tree queries always stay tree-shaped. In advanced problems, the right move is often to flatten the tree or jump through powers of two.

This chapter builds directly on the tree, BST, and range-query foundations from earlier chapters. The next chapter applies a similar expert-level mindset to advanced graph algorithms.

## 2. Core Concepts and Techniques

### Concept Cluster: Ancestor Queries
Key concepts in this block:
- 36.1 Lowest common ancestor
- 36.2 Binary lifting

#### Intuition

The lowest common ancestor, or LCA, of two nodes is the deepest node that is an ancestor of both.

#### Why It Matters

LCA appears in path queries, distance calculations, genealogical problems, and many advanced tree tasks.

#### How It Works

Binary lifting preprocesses `up[node][jump]`, meaning the `2^jump`th ancestor of `node`.

To answer LCA:

- lift the deeper node until both nodes are at the same depth
- lift both nodes from large jumps down to small jumps until their ancestors diverge
- the parent just above the divergence is the LCA

#### Java Implementation Notes

- Store depths from a root chosen during preprocessing.
- Use `-1` as a missing ancestor sentinel.
- Compute the number of jump levels from `log2(n)`.

#### Common Mistakes

- forgetting to equalize depths before the simultaneous lift
- wrong ancestor table initialization for the root
- mixing one-based and zero-based node numbering inconsistently

#### Quick Example

If node `9` is deeper than node `5`, first lift `9` until both are at the same depth. Then lift both together until they just stop matching.

#### Debugging Tip

Print the ancestor table for a tiny tree and manually verify a few jump pointers before trusting the query method.

#### Advanced Note

Binary lifting also supports k-th ancestor queries and often helps with path aggregations.

### Concept Cluster: Flattening and Longest Paths
Key concepts in this block:
- 36.3 Euler tour technique
- 36.4 Tree diameter

#### Intuition

Euler tours turn subtree regions into contiguous array intervals. Tree diameter asks for the longest simple path in the tree.

#### Why It Matters

Flattening is the bridge between tree problems and array/range-query techniques. Diameter is a common global-property problem with elegant linear solutions.

#### How It Works

Euler tour technique:

- run DFS and record each node's entry time
- if the traversal is designed correctly, every subtree becomes one continuous segment in the Euler order

Tree diameter:

- run DFS or BFS from any node to find a farthest node `A`
- run again from `A` to find a farthest node `B`
- the path from `A` to `B` is the diameter

#### Java Implementation Notes

- Keep `tin[node]` and `subtreeSize[node]` for subtree interval mapping.
- For weighted trees, diameter needs distance sums, not just edge counts.
- Use iterative DFS if recursion depth is a concern on very deep trees.

#### Common Mistakes

- using a flattening order that does not preserve subtree contiguity
- forgetting to reset visited arrays between diameter traversals
- assuming the longest path must pass through the root

#### Quick Example

If a subtree rooted at node `u` occupies Euler-order positions `[tin[u], tin[u] + subtreeSize[u] - 1]`, subtree-sum queries can become interval-sum queries.

#### Debugging Tip

Print `tin`, `subtreeSize`, and flattened order for a small tree. If one subtree is not contiguous, the flattening logic is wrong.

#### Advanced Note

Euler tours are often the first step before Fenwick trees, segment trees, or heavy-light decomposition on trees.

### Concept Cluster: Heavy Paths and Query Recognition
Key concepts in this block:
- 36.5 Heavy-light decomposition overview
- 36.6 Tree query problem patterns

#### Intuition

Heavy-light decomposition breaks a tree into a small number of chain segments so path queries can be answered with array-based structures.

#### Why It Matters

It is the right next tool when subtree tricks are not enough and the problem asks for repeated path queries with updates.

#### How It Works

Heavy-light decomposition:

- choose one heavy child per node, usually the child with the largest subtree
- heavy edges form chains
- any root-to-node path crosses only `O(log n)` light edges

Tree query recognition patterns:

- ancestor query
- subtree aggregate query
- path query between two nodes
- update plus repeated query scenario

#### Java Implementation Notes

- Heavy-light decomposition is an engineering-heavy technique, so keep arrays for parent, depth, heavy child, head, and position clearly separated.
- Map the decomposed chains into one base array.
- Use segment tree or Fenwick tree on that base array depending on the query type.

#### Common Mistakes

- using HLD when simple Euler-tour subtree intervals already solve the problem
- confusing path queries with subtree queries
- losing track of chain heads during decomposition

#### Quick Example

A path query from `u` to `v` can be broken into a small number of chain segments by repeatedly moving the deeper chain head upward.

#### Debugging Tip

Classify the query before coding: ancestor, subtree, or general path. The right tool often becomes obvious from that one step.

#### Advanced Note

Many hard tree problems are solved not by a new algorithmic trick, but by recognizing which tree-to-array reduction fits the query pattern.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Lowest Common Ancestor with Binary Lifting
#### Problem Statement

Given a rooted tree and many pairs of nodes, return the lowest common ancestor for each pair.

#### Why This Example Matters

This is the standard advanced-tree query. It combines preprocessing with fast repeated queries.

#### Constraints or Assumptions

- nodes are labeled from `0` to `n - 1`
- the tree is connected and rooted at node `0`
- many LCA queries are expected

#### Brute-Force Approach

For each query:

- walk the deeper node upward until both nodes are at the same depth
- then move both upward one parent at a time

That can take `O(height)` per query.

#### Better Approach

Preprocess binary-lifting ancestors.

#### Why the Better Approach Works

Jumping by powers of two reduces the number of upward steps dramatically. Each query uses only `O(log n)` jumps.

#### Pragmatic Java Choice

Use DFS preprocessing plus an `up[node][level]` table.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class BinaryLiftingLcaExample {
    static final class LcaSolver {
        private final List<Integer>[] graph;
        private final int[][] up;
        private final int[] depth;
        private final int levels;

        LcaSolver(List<Integer>[] graph, int root) {
            this.graph = graph;
            int n = graph.length;
            levels = 1;
            while ((1 << levels) <= n) {
                levels++;
            }
            up = new int[n][levels];
            depth = new int[n];
            dfs(root, -1);
        }

        private void dfs(int node, int parent) {
            up[node][0] = parent;
            for (int level = 1; level < levels; level++) {
                int middleAncestor = up[node][level - 1];
                up[node][level] = middleAncestor == -1 ? -1 : up[middleAncestor][level - 1];
            }

            for (int next : graph[node]) {
                if (next == parent) {
                    continue;
                }
                depth[next] = depth[node] + 1;
                dfs(next, node);
            }
        }

        int lca(int first, int second) {
            if (depth[first] < depth[second]) {
                int temporary = first;
                first = second;
                second = temporary;
            }

            int depthDifference = depth[first] - depth[second];
            for (int level = levels - 1; level >= 0; level--) {
                if (((depthDifference >> level) & 1) == 1) {
                    first = up[first][level];
                }
            }

            if (first == second) {
                return first;
            }

            for (int level = levels - 1; level >= 0; level--) {
                if (up[first][level] != up[second][level]) {
                    first = up[first][level];
                    second = up[second][level];
                }
            }

            return up[first][0];
        }
    }

    static List<Integer>[] buildGraph(int nodeCount, int[][] edges) {
        List<Integer>[] graph = new ArrayList[nodeCount];
        for (int node = 0; node < nodeCount; node++) {
            graph[node] = new ArrayList<>();
        }
        for (int[] edge : edges) {
            int first = edge[0];
            int second = edge[1];
            graph[first].add(second);
            graph[second].add(first);
        }
        return graph;
    }
}
```

#### Dry Run

Suppose the tree has root `0`, and query nodes are `8` and `11`.

- first equalize depths by lifting the deeper node with binary jumps
- then compare large ancestor jumps downward from the largest level
- once the nodes are just below their common ancestor, return the parent one level up

#### Time and Space Complexity

Brute-force parent climbing:

- Preprocessing Time: `O(n)`
- Query Time: `O(height)`
- Space: `O(n)`

Binary lifting:

- Preprocessing Time: `O(n log n)`
- Query Time: `O(log n)`
- Space: `O(n log n)`

#### Edge Cases

- one node is the ancestor of the other
- query with the same node twice
- root involved in the query

#### Common Mistakes

- not equalizing depths first
- wrong jump-table initialization for missing ancestors
- off-by-one mistakes in the number of levels

### Worked Example 2: Tree Diameter
#### Problem Statement

Given an undirected tree, return the number of edges on its diameter, meaning the longest simple path in the tree.

#### Why This Example Matters

Diameter is a classic global tree property. The optimal method is elegant and much faster than checking all node pairs.

#### Constraints or Assumptions

- the input graph is a tree
- edges are unweighted in this example
- returning the path length in edges is enough

#### Brute-Force Approach

Run BFS or DFS from every node and keep the largest distance found.

That costs `O(n^2)` on a tree.

#### Better Approach

Use two BFS traversals.

#### Why the Better Approach Works

From any node, one farthest node is guaranteed to be an endpoint of some diameter. Starting from that endpoint and searching again reaches the other endpoint.

#### Pragmatic Java Choice

Use iterative BFS to avoid recursion concerns.

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

class TreeDiameterExample {
    static final class SearchResult {
        final int node;
        final int distance;

        SearchResult(int node, int distance) {
            this.node = node;
            this.distance = distance;
        }
    }

    static int diameterLength(List<Integer>[] graph) {
        SearchResult first = farthestFrom(0, graph);
        SearchResult second = farthestFrom(first.node, graph);
        return second.distance;
    }

    private static SearchResult farthestFrom(int start, List<Integer>[] graph) {
        boolean[] visited = new boolean[graph.length];
        int[] distance = new int[graph.length];
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        queue.add(start);
        visited[start] = true;

        int farthestNode = start;
        while (!queue.isEmpty()) {
            int node = queue.remove();
            farthestNode = node;

            for (int next : graph[node]) {
                if (!visited[next]) {
                    visited[next] = true;
                    distance[next] = distance[node] + 1;
                    queue.add(next);
                }
            }
        }

        return new SearchResult(farthestNode, distance[farthestNode]);
    }

    static List<Integer>[] buildGraph(int nodeCount, int[][] edges) {
        List<Integer>[] graph = new ArrayList[nodeCount];
        for (int node = 0; node < nodeCount; node++) {
            graph[node] = new ArrayList<>();
        }
        for (int[] edge : edges) {
            graph[edge[0]].add(edge[1]);
            graph[edge[1]].add(edge[0]);
        }
        return graph;
    }
}
```

#### Dry Run

If the tree path `4 - 2 - 0 - 1 - 3 - 7` is the longest:

- BFS from an arbitrary start may find `4` as a farthest node
- BFS from `4` then reaches `7` at maximum distance
- that distance is the diameter length

#### Time and Space Complexity

Brute-force all-start BFS:

- Time: `O(n^2)`
- Space: `O(n)`

Two-BFS diameter method:

- Time: `O(n)`
- Space: `O(n)`

#### Edge Cases

- one-node tree
- chain-shaped tree
- star-shaped tree

#### Common Mistakes

- not clearing visited state between searches
- assuming the first BFS distance is the diameter directly
- applying the method to a general graph instead of a tree without extra care

### Worked Example 3: Subtree Sum Queries with Euler Tour Technique
#### Problem Statement

Given a rooted tree with values on nodes, answer many queries asking for the sum of all values in a node's subtree.

#### Why This Example Matters

This example shows how a tree can be flattened into an array interval so ordinary prefix sums or range structures can answer subtree queries.

#### Constraints or Assumptions

- the tree is rooted at node `0`
- node values are static in this version
- many subtree queries are expected

#### Brute-Force Approach

For each query, run DFS from the node and sum its entire subtree.

That costs `O(subtreeSize)` per query.

#### Better Approach

Run one Euler tour, flatten node values into entry order, and answer each subtree query as an array interval sum.

#### Why the Better Approach Works

In a preorder-style Euler flattening, all nodes in a subtree appear contiguously. That turns a tree query into a range-sum query.

#### Pragmatic Java Choice

Use `tin`, `subtreeSize`, and a prefix-sum array over the flattened node values.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class EulerTourSubtreeSumExample {
    static final class Solver {
        private final List<Integer>[] graph;
        private final int[] nodeValues;
        private final int[] tin;
        private final int[] subtreeSize;
        private final int[] order;
        private final long[] prefixSums;
        private int timer;

        Solver(List<Integer>[] graph, int[] nodeValues, int root) {
            this.graph = graph;
            this.nodeValues = nodeValues;
            int n = graph.length;
            tin = new int[n];
            subtreeSize = new int[n];
            order = new int[n];
            prefixSums = new long[n + 1];
            dfs(root, -1);

            for (int index = 0; index < n; index++) {
                prefixSums[index + 1] = prefixSums[index] + nodeValues[order[index]];
            }
        }

        private void dfs(int node, int parent) {
            tin[node] = timer;
            order[timer] = node;
            timer++;
            subtreeSize[node] = 1;

            for (int next : graph[node]) {
                if (next == parent) {
                    continue;
                }
                dfs(next, node);
                subtreeSize[node] += subtreeSize[next];
            }
        }

        long subtreeSum(int node) {
            int left = tin[node];
            int right = tin[node] + subtreeSize[node] - 1;
            return prefixSums[right + 1] - prefixSums[left];
        }
    }

    static List<Integer>[] buildGraph(int nodeCount, int[][] edges) {
        List<Integer>[] graph = new ArrayList[nodeCount];
        for (int node = 0; node < nodeCount; node++) {
            graph[node] = new ArrayList<>();
        }
        for (int[] edge : edges) {
            graph[edge[0]].add(edge[1]);
            graph[edge[1]].add(edge[0]);
        }
        return graph;
    }
}
```

#### Dry Run

Suppose the Euler order is `[0, 1, 3, 4, 2, 5]`.

- if `tin[1] = 1` and `subtreeSize[1] = 3`
- then subtree of node `1` maps to flat interval `[1, 3]`
- a prefix-sum query over that interval returns the subtree total immediately

#### Time and Space Complexity

Brute-force per query:

- Time: `O(subtreeSize)` per query
- Space: `O(h)` recursion depth for each query

Euler tour with prefix sums:

- Preprocessing Time: `O(n)`
- Query Time: `O(1)`
- Space: `O(n)`

#### Edge Cases

- querying the root subtree
- querying a leaf
- highly unbalanced tree

#### Common Mistakes

- using a traversal order that does not make subtrees contiguous
- off-by-one errors in the flattened interval
- forgetting that this static version does not support updates without an extra structure

## 4. Complexity and Decision Guide

Advanced tree techniques are mostly about turning repeated queries into fast jumps or intervals.

- LCA with binary lifting costs `O(n log n)` preprocessing and `O(log n)` per query
- Euler-tour subtree queries often cost `O(n)` preprocessing and then `O(1)` or `O(log n)` per query depending on the backing structure
- tree diameter can be solved in `O(n)` rather than `O(n^2)` with the right global insight
- heavy-light decomposition usually gives path queries in about `O(log^2 n)` with a segment tree, or better with more refinement

When to choose brute force:

- very small tree and very few queries
- one-off analysis rather than repeated online queries

When to optimize:

- many ancestor queries
- many subtree or path queries
- updates mixed with repeated queries on large trees

Recognition signals:

- LCA or k-th ancestor wording suggests binary lifting
- subtree aggregate wording suggests Euler tour flattening
- repeated path queries with updates suggest heavy-light decomposition
- global longest-path wording suggests tree diameter logic

Signals not to force these techniques:

- a single DFS solves the whole problem once
- the query volume is tiny
- the tree is actually dynamic in topology, which changes the tool choice significantly

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- wrong root assumptions during preprocessing
- ancestor table entries not initialized correctly for the root
- Euler intervals off by one
- forgetting to reset traversal state between multiple passes
- mixing path queries and subtree queries under the same flattening logic

Short debugging checklist:

- verify depth values on a tiny tree
- check a few known ancestor jumps manually
- print Euler entry times and subtree sizes
- test leaf, root, and ancestor-of-self queries
- classify the query type before choosing the technique

## 6. Practice Problems

### Easy

**Title:** K-th Ancestor of a Tree Node  
**Prompt:** Return the k-th ancestor for many queries on a rooted tree.  
**Expected pattern or core idea:** Binary lifting jump table.

**Title:** Subtree Size Queries  
**Prompt:** Return the number of nodes in each queried subtree.  
**Expected pattern or core idea:** Euler tour flattening with subtree intervals.

**Title:** Tree Diameter  
**Prompt:** Return the longest simple path length in a tree.  
**Expected pattern or core idea:** Two BFS or DFS passes.

### Medium

**Title:** Lowest Common Ancestor  
**Prompt:** Answer many LCA queries on a rooted tree.  
**Expected pattern or core idea:** Binary lifting plus depth equalization.

**Title:** Subtree Sum with Updates  
**Prompt:** Support value updates on nodes and subtree sum queries.  
**Expected pattern or core idea:** Euler tour plus Fenwick tree or segment tree.

**Title:** Distance Between Two Nodes  
**Prompt:** Return the distance between many node pairs.  
**Expected pattern or core idea:** LCA plus depth information.

### Hard

**Title:** Path Sum Query with Updates  
**Prompt:** Support repeated path aggregate queries and point updates on a tree.  
**Expected pattern or core idea:** Heavy-light decomposition overview applied to path segments.

**Title:** Tree Path Maximum  
**Prompt:** Return the maximum value on arbitrary node-to-node paths with updates.  
**Expected pattern or core idea:** Path decomposition into array intervals.

**Title:** Dynamic Root Query Variant  
**Prompt:** Answer subtree or ancestor-style queries when the root may change.  
**Expected pattern or core idea:** Careful tree-query classification and preprocessing.

## 7. Short Recap

The core idea is to preprocess trees into jump tables or flat intervals so repeated queries avoid full traversals. The most important optimization insight is that many advanced tree questions become easy after the right reduction: ancestors to binary jumps, subtrees to intervals, and long paths to diameter logic. The most important implementation warning is to keep roots, depths, and flattened intervals consistent. This prepares the next chapter, where advanced graph algorithms require similar modeling discipline on more general structures.

## 8. Coverage Check

- 36.1 Lowest common ancestor - Covered
- 36.2 Binary lifting - Covered
- 36.3 Euler tour technique - Covered
- 36.4 Tree diameter - Covered
- 36.5 Heavy-light decomposition overview - Covered
- 36.6 Tree query problem patterns - Covered

Coverage Summary: 6/6 official subtopics covered

Next: Advanced Graph Algorithms
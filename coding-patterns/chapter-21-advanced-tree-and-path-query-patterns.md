# 21: Advanced Tree and Path Query Patterns

## 0. Introduction

This chapter sits in Part VI - Expert Structures and Hybrid Problem Solving (Weeks 29-34), with the roadmap treating it as advanced to expert work. Its goal is to learn how to preprocess trees so subtree and path queries become indexed range problems instead of repeated traversals. This chapter directly supports the Part VI outcome of justifying advanced structures with clear trade-offs instead of memorizing them as rituals.

Read it as a bridge in the larger sequence. Chapter 20 used coordinate compression and sweep structures on geometric objects. This chapter reuses that same flatten-and-index mindset on trees. Chapter 22 shifts from structural tree preprocessing to game-state analysis and probabilistic reasoning. Start this chapter after you are comfortable with Chapters 1 through 20, especially DFS, BFS, segment trees, Fenwick trees, recursion state, and range-query reasoning. The main themes here are Heavy Light Decomposition Pattern, Lowest Common Ancestor Pattern revisited with preprocessing, Euler tour flattening for subtree queries, Segment tree plus tree path combinations, Path queries versus subtree queries, and Trade-offs versus simpler DFS-based approaches.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to use Euler-tour flattening for subtree queries, binary lifting for LCA preprocessing, heavy-light decomposition for path queries, and segment-tree combinations for online tree updates in Java while knowing when a simpler DFS-based solution is still the better choice.

## 1. Intuition First

This chapter matters because many tree problems stop being about one traversal. Once queries and updates arrive online, rerunning DFS from scratch for every question becomes too slow. The main trick is to map tree structure into array structure without losing the meaning of ancestor, subtree, or path.

The simplest analogy is an organizational chart. If you want the total salary inside a manager's department, that is a subtree query. If you want the total salary along the chain between two employees, that is a path query. Both are tree questions, but they flatten differently.

The core mental model is:

- subtree queries often become contiguous segments after an Euler tour
- path queries usually do not stay contiguous in one simple flattening
- LCA preprocessing reduces repeated ancestor climbs
- heavy-light decomposition breaks a path into a small number of heavy-chain segments
- segment trees or Fenwick trees become the query engine after the tree is flattened

Recognition signals for this chapter:

- many online subtree or path queries on one static tree structure
- repeated ancestor, distance, or path aggregate questions
- point updates on node values mixed with queries
- brute-force DFS per query is too slow

The most common beginner confusion point is trying to solve path queries with the same flattening used for subtree queries. Euler tours make subtrees contiguous, but arbitrary node-to-node paths usually need heavier preprocessing such as HLD plus an indexed structure.

In the larger roadmap, this chapter is the advanced-tree half of Part VI's “stronger structures only when justified” theme.

## 2. Learning Path and Recognition Checklist

The chapter starts with the split between subtree queries and path queries. It then covers Euler-tour flattening for subtrees, LCA preprocessing for ancestor reasoning, and heavy-light decomposition for path queries with segment-tree support. Throughout, it keeps one question visible: do you really need the heavy machinery, or would a simpler DFS-based approach already pass?

Recognition checklist for this chapter:

- Is the query about a subtree, a root-to-node path, or a node-to-node path?
- Are updates online or is the tree immutable after preprocessing?
- Is the query asking for ancestry, distance, or an aggregate such as sum or max?
- Can the tree be flattened into one contiguous range for the query type?
- Is binary lifting enough, or do I need HLD plus a segment tree?
- Would simple DFS per query already work under the constraints?

The brute-force baseline usually looks like this:

- rerun DFS from the queried node for every subtree aggregate
- climb parents one step at a time to find the LCA
- walk the full path between two nodes and recompute the aggregate each time

The optimization path later becomes:

- Euler tour for subtree contiguity
- binary lifting for fast ancestor jumps and LCA
- HLD to break a path into `O(log n)` segments
- segment tree or Fenwick tree over the flattened order to answer updates and queries efficiently

Mastery by the end of the chapter looks like this: you can state whether the query is subtree-shaped or path-shaped, choose the flattening that preserves that structure, and explain why a simpler approach would or would not suffice.

Do not force HLD for a small number of queries. Do not force Euler-tour subtree logic onto general path problems.

## 3. Official Subtopic Coverage

### Concept Cluster: Subtree Flattening and Query Shape
Official subtopics covered:
- 21.3 Euler tour flattening for subtree queries
- 21.5 Path queries versus subtree queries
- 21.6 Trade-offs versus simpler DFS-based approaches

#### Definition or Framing
Euler-tour flattening records each node's entry time in a DFS order so every subtree becomes one contiguous segment in the flattened array. This is powerful for subtree aggregates, but it does not automatically solve arbitrary path queries.

#### Recognition Signals
- query asks about all descendants of a node
- point updates plus subtree sums or subtree counts
- the tree structure is static, but values may change

#### Brute-Force Baseline
Run DFS from the queried node and aggregate over all descendants each time.

#### Optimized Pattern Idea
Assign each node an entry index and subtree end index. Build an indexed structure over the flattened array so a subtree becomes one range query.

#### Invariant / State Representation / Transition Logic
For every node `u`, the subtree of `u` occupies exactly the contiguous interval `[tin[u], tout[u]]` in the Euler-tour order.

#### Java Implementation Notes
- store `tin`, `tout`, and a timer
- a Fenwick tree is often enough for subtree sums with point updates
- keep the DFS order and value array synchronized carefully

#### Quick Dry Run
If node `2` enters at time `4` and its subtree ends at time `8`, then every descendant of `2` appears in flattened positions `4` through `8`.

#### Common Mistakes
- using preorder entry times without storing subtree boundaries
- mixing node ids and flattened indices
- trying to answer arbitrary path queries with a single subtree interval

#### Debugging Strategy
Print `(node, tin, tout)` for a tiny tree and check that each subtree really maps to a contiguous segment.

#### Comparison with Similar Pattern
Euler flattening is ideal for subtree queries, but HLD is the standard answer for arbitrary path queries.

#### Advanced Note
Subtree flattening combines especially well with Fenwick trees when the query is additive and updates are point-based.

### Concept Cluster: Fast Ancestor Reasoning
Official subtopics covered:
- 21.2 Lowest Common Ancestor Pattern revisited with preprocessing
- 21.5 Path queries versus subtree queries

#### Definition or Framing
LCA preprocessing answers repeated ancestor and distance questions quickly by storing jump pointers for powers of two above each node.

#### Recognition Signals
- repeated LCA or ancestor queries
- distance between nodes in an unweighted tree
- path aggregates that need the path split around the LCA

#### Brute-Force Baseline
Climb parent pointers one level at a time until depths match, then continue climbing together.

#### Optimized Pattern Idea
Use binary lifting so depth alignment and ancestor jumps happen in `O(log n)`.

#### Invariant / State Representation / Transition Logic
`up[k][u]` stores the `2^k`-th ancestor of node `u`. Jumping by powers of two preserves ancestry while shrinking the remaining distance quickly.

#### Java Implementation Notes
- compute `LOG` from `n`
- preprocess depth and `up[0]` in one DFS
- guard the root's ancestors consistently

#### Quick Dry Run
If node `u` is `13` levels deeper than node `v`, binary lifting aligns their depths by jumping `8 + 4 + 1` levels instead of climbing one step at a time.

#### Common Mistakes
- reading from invalid ancestors near the root
- forgetting to align depths before the simultaneous jump phase
- using LCA preprocessing when only one or two queries exist

#### Debugging Strategy
Print a few `up[k][u]` entries and verify them on a tiny rooted tree by hand.

#### Comparison with Similar Pattern
Binary lifting is lighter than HLD when the query is about ancestry or distance only and no path aggregate updates are needed.

#### Advanced Note
LCA preprocessing often becomes one building block inside larger path-query systems.

### Concept Cluster: Heavy Paths and Indexed Path Queries
Official subtopics covered:
- 21.1 Heavy Light Decomposition Pattern
- 21.4 Segment tree plus tree path combinations
- 21.5 Path queries versus subtree queries
- 21.6 Trade-offs versus simpler DFS-based approaches

#### Definition or Framing
Heavy Light Decomposition, or HLD, breaks each root-to-leaf route into heavy chains so any node-to-node path can be decomposed into `O(log n)` contiguous chain segments. A segment tree over the flattened positions then answers path aggregates efficiently.

#### Recognition Signals
- many path sum, max, xor, or min queries on a static tree with online updates
- Euler tour alone does not make the node-to-node path contiguous
- the constraints are too high for repeated DFS or path reconstruction

#### Brute-Force Baseline
Recover the full path between two nodes and aggregate its values directly for every query.

#### Optimized Pattern Idea
Choose one heavy child per node, flatten each heavy chain contiguously, and climb chain heads until both query nodes share a chain.

#### Invariant / State Representation / Transition Logic
Each node belongs to exactly one heavy chain. While the heads of two nodes differ, the deeper head's segment can be answered and removed from the remaining path.

#### Java Implementation Notes
- compute subtree sizes first to choose heavy children
- store `head`, `position`, `parent`, `depth`, and `heavy`
- use a segment tree or Fenwick tree over the linearized node values

#### Quick Dry Run
If nodes `u` and `v` are on different chains, query the segment from the deeper chain head to its node, move that node to the parent of its head, and repeat until both nodes share a chain.

#### Common Mistakes
- assigning heavy children before subtree sizes are known
- forgetting to swap nodes so the deeper chain is processed first
- mixing edge values and node values without deciding the indexing model

#### Debugging Strategy
Print the chain head and position of every node on a tiny tree. Most HLD bugs are mapping bugs before they become query bugs.

#### Comparison with Similar Pattern
HLD is much stronger than a simple Euler tour for path queries, but it is also much more complex. Use it only when the query pattern justifies that complexity.

#### Advanced Note
HLD plus segment tree is the standard scalable answer for online path aggregates, but offline or small-query cases often admit simpler DFS-based solutions.

## 4. Pattern Template, State Model, or Core Workflow

Canonical tree-query decision workflow:

1. Classify the query shape.
   Subtree, ancestor, root-to-node path, or arbitrary node-to-node path?
2. Classify mutability.
   Are node or edge values updated online?
3. Choose the lightest flattening or preprocessing that preserves the query shape.

The standard choices are:

- subtree query plus point updates: Euler tour plus Fenwick or segment tree
- repeated ancestor or distance queries: binary lifting for LCA
- arbitrary path queries with updates: HLD plus segment tree

Important variables and safety rules:

- `tin` and `tout` must describe one contiguous subtree interval
- `up[k][u]` must always mean the `2^k`-th ancestor of `u`
- in HLD, `head[u]` and `position[u]` define the chain mapping; those meanings must never drift
- decide whether values live on nodes or edges before flattening

What usually breaks first:

- mixing subtree and path reasoning in one wrong flattening
- forgetting to align depths in LCA
- incorrect chain-head climbing order in HLD
- segment-tree queries on the wrong inclusive ranges after linearization

When to adapt versus keep the template unchanged:

- keep Euler-tour logic unchanged for subtree-only workloads
- keep binary lifting unchanged for ancestry and distance
- adapt HLD carefully when the path aggregate stores richer segment-tree state than a simple sum

## 5. Worked Examples and Full Solutions

### Worked Example 1: Subtree Sum Queries with Point Updates
#### Problem Statement
Given a rooted tree with a value on each node, support online operations to update one node's value and query the sum of all values in a node's subtree.

#### Why This Example Matters
This is the cleanest demonstration that subtree queries flatten naturally into one contiguous interval.

#### Input and Constraints
- `1 <= n, queries <= 200000`
- node values may require `long` when summed
- the tree structure is static

#### Recognition Signals
- subtree aggregate
- point updates only
- repeated queries make DFS per query too slow

#### Brute-Force Approach
For each subtree query, run DFS from the target node and sum all descendants.

#### Better Pattern-Based Approach
Use Euler-tour entry and exit times so each subtree becomes one range. Maintain flattened node values in a Fenwick tree.

#### Why the Pattern Fits
Subtrees are contiguous in DFS entry order, so a range-sum structure over the flattened tree answers the query directly.

#### Invariant or State Transition
For every node `u`, the flattened interval `[tin[u], tout[u]]` contains exactly the nodes in `u`'s subtree.

#### Pragmatic Java Choice
Fenwick tree is enough because the aggregate is sum and updates are point-based.

#### Dry Run Before Code
If node `2`'s subtree occupies flattened positions `3` through `6`, then querying the subtree sum is just `rangeSum(3, 6)`.

#### Java Solution
```java
import java.util.ArrayList;
import java.util.List;

public class EulerTourSubtreeExample {
    static class FenwickTree {
        private final long[] tree;

        FenwickTree(int size) {
            tree = new long[size + 1];
        }

        void add(int index, long delta) {
            int position = index + 1;
            while (position < tree.length) {
                tree[position] += delta;
                position += position & -position;
            }
        }

        long prefixSum(int index) {
            long sum = 0;
            int position = index + 1;
            while (position > 0) {
                sum += tree[position];
                position -= position & -position;
            }
            return sum;
        }

        long rangeSum(int left, int right) {
            return prefixSum(right) - (left == 0 ? 0 : prefixSum(left - 1));
        }
    }

    static class TreeQueries {
        private final List<Integer>[] graph;
        private final int[] tin;
        private final int[] tout;
        private final long[] values;
        private final FenwickTree fenwickTree;
        private int timer;

        TreeQueries(int n, int[][] edges, long[] initialValues) {
            graph = new ArrayList[n + 1];
            for (int node = 1; node <= n; node++) {
                graph[node] = new ArrayList<>();
            }
            for (int[] edge : edges) {
                graph[edge[0]].add(edge[1]);
                graph[edge[1]].add(edge[0]);
            }

            tin = new int[n + 1];
            tout = new int[n + 1];
            values = initialValues.clone();
            fenwickTree = new FenwickTree(n);

            dfs(1, 0);
            for (int node = 1; node <= n; node++) {
                fenwickTree.add(tin[node], values[node]);
            }
        }

        private void dfs(int node, int parent) {
            tin[node] = timer++;
            for (int neighbor : graph[node]) {
                if (neighbor != parent) {
                    dfs(neighbor, node);
                }
            }
            tout[node] = timer - 1;
        }

        void updateValue(int node, long newValue) {
            long delta = newValue - values[node];
            values[node] = newValue;
            fenwickTree.add(tin[node], delta);
        }

        long querySubtree(int node) {
            return fenwickTree.rangeSum(tin[node], tout[node]);
        }
    }

    public static void main(String[] args) {
        int[][] edges = {{1, 2}, {1, 3}, {2, 4}, {2, 5}, {3, 6}};
        long[] values = {0, 5, 3, 4, 2, 1, 7};
        TreeQueries treeQueries = new TreeQueries(6, edges, values);
        System.out.println(treeQueries.querySubtree(2));
        treeQueries.updateValue(5, 10);
        System.out.println(treeQueries.querySubtree(2));
    }
}
```

#### Time and Space Complexity
- Brute force: `O(subtree size)` per query
- Euler tour plus Fenwick tree: `O(log n)` update and `O(log n)` subtree query after `O(n)` preprocessing

#### Edge Cases
- querying the root subtree
- leaf-node subtree queries
- updating the same node many times

#### Common Mistakes
- forgetting that the flattened index, not the node id, is used in the Fenwick tree
- building `tout` before finishing all descendants
- using this approach for arbitrary path queries

### Worked Example 2: LCA and Distance Queries with Binary Lifting
#### Problem Statement
Given many node pairs in a rooted tree, answer their lowest common ancestor and unweighted distance.

#### Why This Example Matters
This example isolates ancestor preprocessing before the chapter adds heavier path-query machinery.

#### Input and Constraints
- `1 <= n, queries <= 200000`
- the tree is static after construction

#### Recognition Signals
- repeated LCA or distance queries
- climbing one parent at a time would be too slow

#### Brute-Force Approach
Raise the deeper node one step at a time, then climb both nodes together until they meet.

#### Better Pattern-Based Approach
Use binary lifting to jump by powers of two in `O(log n)`.

#### Why the Pattern Fits
The query is purely ancestral. No segment tree or chain decomposition is needed.

#### Invariant or State Transition
`up[k][u]` remains the `2^k`-th ancestor of `u` for every valid `k`.

#### Pragmatic Java Choice
Use a dense `int[][]` jump table because the tree is static and queries are frequent.

#### Dry Run Before Code
If node `11` is `13` levels below node `4`, align their depth with jumps of `8`, `4`, and `1`, then lift both together.

#### Java Solution
```java
import java.util.ArrayList;
import java.util.List;

public class BinaryLiftingLcaExample {
    static class LcaSolver {
        private final List<Integer>[] graph;
        private final int[][] up;
        private final int[] depth;
        private final int log;

        LcaSolver(int n, int[][] edges, int root) {
            graph = new ArrayList[n + 1];
            for (int node = 1; node <= n; node++) {
                graph[node] = new ArrayList<>();
            }
            for (int[] edge : edges) {
                graph[edge[0]].add(edge[1]);
                graph[edge[1]].add(edge[0]);
            }

            log = 32 - Integer.numberOfLeadingZeros(n);
            up = new int[log][n + 1];
            depth = new int[n + 1];
            dfs(root, root);
        }

        private void dfs(int node, int parent) {
            up[0][node] = parent;
            for (int bit = 1; bit < log; bit++) {
                up[bit][node] = up[bit - 1][up[bit - 1][node]];
            }
            for (int neighbor : graph[node]) {
                if (neighbor != parent) {
                    depth[neighbor] = depth[node] + 1;
                    dfs(neighbor, node);
                }
            }
        }

        int lca(int first, int second) {
            if (depth[first] < depth[second]) {
                int temp = first;
                first = second;
                second = temp;
            }

            int difference = depth[first] - depth[second];
            for (int bit = 0; bit < log; bit++) {
                if ((difference & (1 << bit)) != 0) {
                    first = up[bit][first];
                }
            }

            if (first == second) {
                return first;
            }

            for (int bit = log - 1; bit >= 0; bit--) {
                if (up[bit][first] != up[bit][second]) {
                    first = up[bit][first];
                    second = up[bit][second];
                }
            }
            return up[0][first];
        }

        int distance(int first, int second) {
            int ancestor = lca(first, second);
            return depth[first] + depth[second] - 2 * depth[ancestor];
        }
    }

    public static void main(String[] args) {
        int[][] edges = {{1, 2}, {1, 3}, {2, 4}, {2, 5}, {3, 6}, {6, 7}};
        LcaSolver solver = new LcaSolver(7, edges, 1);
        System.out.println(solver.lca(4, 5));
        System.out.println(solver.distance(4, 7));
    }
}
```

#### Time and Space Complexity
- Brute force parent climbing: `O(height)` per query
- Binary lifting: `O(n log n)` preprocessing and `O(log n)` per query

#### Edge Cases
- one node is the ancestor of the other
- the root is part of the query
- many repeated queries on the same pair

#### Common Mistakes
- not setting the root's ancestor consistently
- forgetting depth alignment before the simultaneous jumps
- reading invalid ancestor entries when indexing from `0`

### Worked Example 3: Path Sum Queries with Heavy-Light Decomposition
#### Problem Statement
Given a rooted tree with values on nodes, support point updates on node values and path-sum queries between any two nodes.

#### Why This Example Matters
This is the main expert structure of the chapter. It shows why subtree flattening alone is not enough for arbitrary paths.

#### Input and Constraints
- `1 <= n, queries <= 200000`
- the tree structure is static
- node values may require `long`

#### Recognition Signals
- arbitrary node-to-node path queries
- online point updates
- repeated path reconstruction would be too slow

#### Brute-Force Approach
Recover the path between the two nodes and sum the node values directly on each query.

#### Better Pattern-Based Approach
Use HLD to break the path into `O(log n)` chain segments. Use a segment tree over the linearized node order to answer segment sums.

#### Why the Pattern Fits
Paths are not contiguous under one simple DFS order, but they become a small number of contiguous heavy-chain segments under HLD.

#### Invariant or State Transition
While the chain heads differ, the deeper head-to-node segment is a valid contiguous path piece that can be queried immediately.

#### Pragmatic Java Choice
Use node values, not edge values, to keep the indexing model simpler for the first HLD implementation.

#### Dry Run Before Code
If `u` and `v` sit on different chains, query from the deeper chain head to its node, move that node to the parent of the head, and repeat until both nodes share a chain.

#### Java Solution
```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class HeavyLightDecompositionExample {
    static class SegmentTree {
        private final long[] tree;
        private final int size;

        SegmentTree(long[] values) {
            size = values.length;
            tree = new long[size * 4];
            build(1, 0, size - 1, values);
        }

        private void build(int node, int left, int right, long[] values) {
            if (left == right) {
                tree[node] = values[left];
                return;
            }
            int mid = left + (right - left) / 2;
            build(node * 2, left, mid, values);
            build(node * 2 + 1, mid + 1, right, values);
            tree[node] = tree[node * 2] + tree[node * 2 + 1];
        }

        void update(int index, long newValue) {
            update(1, 0, size - 1, index, newValue);
        }

        private void update(int node, int left, int right, int index, long newValue) {
            if (left == right) {
                tree[node] = newValue;
                return;
            }
            int mid = left + (right - left) / 2;
            if (index <= mid) {
                update(node * 2, left, mid, index, newValue);
            } else {
                update(node * 2 + 1, mid + 1, right, index, newValue);
            }
            tree[node] = tree[node * 2] + tree[node * 2 + 1];
        }

        long query(int queryLeft, int queryRight) {
            return query(1, 0, size - 1, queryLeft, queryRight);
        }

        private long query(int node, int left, int right, int queryLeft, int queryRight) {
            if (queryRight < left || right < queryLeft) {
                return 0;
            }
            if (queryLeft <= left && right <= queryRight) {
                return tree[node];
            }
            int mid = left + (right - left) / 2;
            return query(node * 2, left, mid, queryLeft, queryRight)
                    + query(node * 2 + 1, mid + 1, right, queryLeft, queryRight);
        }
    }

    static class HldSolver {
        private final List<Integer>[] graph;
        private final int[] parent;
        private final int[] depth;
        private final int[] size;
        private final int[] heavy;
        private final int[] head;
        private final int[] position;
        private final long[] values;
        private int currentPosition;
        private SegmentTree segmentTree;

        HldSolver(int n, int[][] edges, long[] nodeValues) {
            graph = new ArrayList[n + 1];
            for (int node = 1; node <= n; node++) {
                graph[node] = new ArrayList<>();
            }
            for (int[] edge : edges) {
                graph[edge[0]].add(edge[1]);
                graph[edge[1]].add(edge[0]);
            }

            parent = new int[n + 1];
            depth = new int[n + 1];
            size = new int[n + 1];
            heavy = new int[n + 1];
            Arrays.fill(heavy, -1);
            head = new int[n + 1];
            position = new int[n + 1];
            values = nodeValues.clone();

            dfs(1, 0);
            long[] linearized = new long[n];
            decompose(1, 1, linearized);
            segmentTree = new SegmentTree(linearized);
        }

        private int dfs(int node, int parentNode) {
            parent[node] = parentNode;
            size[node] = 1;
            int bestSubtree = 0;

            for (int neighbor : graph[node]) {
                if (neighbor == parentNode) {
                    continue;
                }
                depth[neighbor] = depth[node] + 1;
                int subtreeSize = dfs(neighbor, node);
                size[node] += subtreeSize;
                if (subtreeSize > bestSubtree) {
                    bestSubtree = subtreeSize;
                    heavy[node] = neighbor;
                }
            }
            return size[node];
        }

        private void decompose(int node, int chainHead, long[] linearized) {
            head[node] = chainHead;
            position[node] = currentPosition;
            linearized[currentPosition++] = values[node];

            if (heavy[node] != -1) {
                decompose(heavy[node], chainHead, linearized);
            }
            for (int neighbor : graph[node]) {
                if (neighbor != parent[node] && neighbor != heavy[node]) {
                    decompose(neighbor, neighbor, linearized);
                }
            }
        }

        void updateNode(int node, long newValue) {
            values[node] = newValue;
            segmentTree.update(position[node], newValue);
        }

        long queryPath(int first, int second) {
            long answer = 0;

            while (head[first] != head[second]) {
                if (depth[head[first]] < depth[head[second]]) {
                    int temp = first;
                    first = second;
                    second = temp;
                }
                answer += segmentTree.query(position[head[first]], position[first]);
                first = parent[head[first]];
            }

            if (depth[first] > depth[second]) {
                int temp = first;
                first = second;
                second = temp;
            }
            answer += segmentTree.query(position[first], position[second]);
            return answer;
        }
    }

    public static void main(String[] args) {
        int[][] edges = {{1, 2}, {1, 3}, {2, 4}, {2, 5}, {3, 6}, {6, 7}};
        long[] values = {0, 5, 3, 4, 2, 1, 7, 6};
        HldSolver solver = new HldSolver(7, edges, values);
        System.out.println(solver.queryPath(4, 7));
        solver.updateNode(6, 10);
        System.out.println(solver.queryPath(4, 7));
    }
}
```

#### Time and Space Complexity
- Brute force path recovery: `O(path length)` per query
- HLD plus segment tree: `O(log^2 n)` path query, `O(log n)` point update, and `O(n)` preprocessing arrays plus segment-tree storage

Compared with simpler DFS logic, HLD is much more complex but scales to large online path-query workloads.

#### Edge Cases
- querying a node with itself
- root involved in the path
- updates on chain-head nodes

#### Common Mistakes
- not swapping to process the deeper chain first
- confusing node values with edge values
- wrong linearized segment boundaries after decomposition

## 6. Complexity and Comparison Guide

Across the chapter, the main trade-offs are:

- repeated DFS or parent climbing: simplest code, acceptable only for small query counts
- Euler tour plus Fenwick tree: strong for subtree sums with point updates, `O(log n)` operations
- binary lifting: `O(n log n)` preprocessing and `O(log n)` ancestor or distance queries
- HLD plus segment tree: heavier implementation cost but scalable online path aggregates

Comparison with similar patterns:

- Euler tour versus HLD: Euler tour gives contiguous subtrees; HLD gives a small number of contiguous path segments.
- Binary lifting versus HLD: binary lifting is enough for ancestry and distance; HLD is needed for online path aggregates.
- Simple DFS versus advanced preprocessing: DFS is often clearer and adequate when queries are few or offline.

Decision criteria:

- choose Euler flattening for subtree aggregates
- choose binary lifting for repeated LCA or distance queries
- choose HLD only when arbitrary path aggregates and updates make it necessary
- choose simpler DFS if the query count is low enough to tolerate it

Signals not to force these techniques:

- one or two queries only
- tiny trees where preprocessing cost and bug risk dominate
- subtree-only tasks where HLD would add unnecessary complexity

What breaks when invariants fail:

- wrong `tin/tout` destroys subtree queries
- wrong jump pointers destroy LCA answers
- wrong chain mapping destroys path decomposition in HLD

## 7. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- mixing 0-indexed flattened positions with 1-indexed node ids
- forgetting to root the tree consistently before preprocessing
- incorrect heavy-child selection because subtree sizes were not computed first
- querying segment-tree ranges in the wrong order after chain swaps

Boundary-condition handling:

- the root often needs special handling in ancestor tables
- leaf nodes should still have valid subtree intervals and chain assignments
- node-value and edge-value models must be separated clearly

Short debugging checklist:

1. Print `tin`, `tout`, `head`, and `position` for a tiny tree.
2. Verify one subtree interval by hand.
3. Check one LCA query against manual parent climbing.
4. Decompose one path into chains on paper before trusting HLD output.
5. Compare against brute force on small random trees.

Counterexample to a common wrong solution:

If you try to answer path sum between two arbitrary nodes from one Euler-tour interval, the interval will include nodes outside the path whenever the path bends across branches. Subtree contiguity is not path contiguity.

## 8. Practice Problems

### Easy
- Subtree Sum Queries: update node values and query subtree totals; expected pattern or core idea: Euler tour plus Fenwick tree.
- Distance Between Two Nodes: answer repeated distances in a rooted tree; expected pattern or core idea: LCA with preprocessing.
- K-th Ancestor of a Node: answer repeated ancestor jumps; expected pattern or core idea: binary lifting.

### Medium
- Company Hierarchy Bonus Updates: point updates and subtree queries on an org chart; expected pattern or core idea: Euler flattening plus indexed range structure.
- Path Maximum Query: answer path maximum on a tree with updates; expected pattern or core idea: HLD plus segment tree.
- Tree XOR Queries: online path xor with node updates; expected pattern or core idea: HLD with a custom merge.

### Hard
- Dynamic Path Aggregates at Scale: maintain sums or maximums on many tree paths; expected pattern or core idea: HLD plus segment tree.
- Mixed Subtree and Path Workload: support both subtree and path operations efficiently; expected pattern or core idea: combine Euler flattening, HLD, and careful API design.
- Competitive Tree Query Suite: answer LCA, distance, path, and subtree queries together; expected pattern or core idea: layered preprocessing and structure selection.

## 9. Short Recap

The core idea is to preserve tree structure through the right flattening: Euler tour for subtrees, binary lifting for ancestors, and HLD for arbitrary paths. The strongest recognition clue is repeated online queries on one static tree. The key optimization insight is that different query shapes need different indexed views of the tree. The most important implementation warning is to keep the meaning of flattened positions, chain heads, and ancestors explicit at all times. This prepares the next chapter by reinforcing the same expert mindset: pick strong machinery only when the query structure truly demands it.

## 10. Coverage Check

- 21.1 Heavy Light Decomposition Pattern - covered
- 21.2 Lowest Common Ancestor Pattern revisited with preprocessing - covered
- 21.3 Euler tour flattening for subtree queries - covered
- 21.4 Segment tree plus tree path combinations - covered
- 21.5 Path queries versus subtree queries - covered
- 21.6 Trade-offs versus simpler DFS-based approaches - covered

- Coverage Summary: 6/6 official subtopics covered
- This must always be 6/6 before final output

Next: 22: Games and Probabilistic Thinking

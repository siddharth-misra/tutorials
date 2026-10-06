# Part VII Outcome: Advanced and Expert Track

**Scope:** Chapters 35 to 40
**Part outcome:**
- Solve hard problems with structure, not guesswork
- Build a reusable Java DSA library
- Be ready for interviews, contests, or advanced coursework
**Capstone milestone:** Complete 200+ curated problems with written notes

---

## 1. What Completing Part VII Should Mean

By the end of Part VII, you should no longer approach hard problems by trying random advanced techniques. You should be able to:

- classify whether the problem is really about preprocessing, path queries, flow, string matching, monotonic structure maintenance, or workflow discipline
- explain why the baseline solution is too slow and what exact bottleneck the optimized method removes
- choose the smallest advanced tool that satisfies the constraints instead of defaulting to the heaviest tool
- implement reusable Java templates for the advanced techniques you are likely to use again
- write short postmortems after practice problems so the pattern becomes reusable knowledge instead of a one-time solve

If those skills are not stable yet, the right next step is not more random hard problems. The right next step is deliberate revision plus targeted practice.

## 2. Part VII Revision Sheet

### 2.1 Advanced Range and Query Techniques

Recognition signals:

- many range queries over mostly static data
- query count is large enough that `O(n)` per query is too slow
- offline reordering is allowed
- the operation is static minimum, maximum, distinct count, threshold count, or similar

Core choices:

- sparse table for static idempotent queries such as range minimum or maximum
- square root decomposition when you want simpler engineering than a segment tree and the update-query mix is moderate
- Mo's algorithm when queries are offline and add/remove operations are cheap
- offline sweep plus Fenwick tree when queries can be sorted by threshold or endpoint

Common failure cases:

- using sparse table for sums with overlapping blocks
- using Mo's algorithm when add/remove logic is expensive
- ignoring offline processing even though the prompt allows reordering

What to remember in Java:

- precompute `log2` for sparse table queries
- keep block boundaries explicit in sqrt decomposition
- store original query indices for offline methods
- coordinate-compress large values before using frequency arrays

### 2.2 Advanced Trees

Recognition signals:

- repeated LCA or ancestor queries
- subtree sum, subtree count, or subtree update problems
- repeated path queries between arbitrary nodes
- problems asking for longest path or global distance structure in a tree

Core choices:

- binary lifting for LCA and k-th ancestor queries
- Euler tour flattening for subtree intervals
- two BFS or DFS passes for diameter
- heavy-light decomposition when path queries and updates appear together

Common failure cases:

- not separating subtree queries from general path queries
- flattening the tree incorrectly so subtrees are not contiguous
- forgetting to equalize depths before binary-lifting comparisons

What to remember in Java:

- store `depth`, `parent`, and `up[node][jump]`
- store `tin` and `subtreeSize` for subtree interval mapping
- keep tree root assumptions explicit

### 2.3 Advanced Graph Algorithms

Recognition signals:

- capacities, assignments, throughput, or cuts
- shortest path where one resource or mode change matters
- matching or allocation problems that are easier to model than to search directly

Core choices:

- Ford-Fulkerson as the augmenting-path framework
- Edmonds-Karp as the BFS-based specialization and a clear max-flow baseline
- residual-graph reasoning for max flow min cut
- BFS or Dijkstra on expanded state when the node identity includes resource state
- graph-modeling reduction for matching, assignment, or layered constraints

Common failure cases:

- forgetting reverse edges in the residual graph
- marking a physical node visited without including its extra state
- using shortest path when the real problem is a capacity problem

What to remember in Java:

- keep residual updates symmetric
- store full state in the visited structure
- separate model-building code from solver code

### 2.4 Advanced String Algorithms

Recognition signals:

- exact pattern matching with repeated mismatches
- repeated equal-length substring comparisons
- many dictionary words sharing prefixes
- need to choose a matcher by constraints rather than habit

Core choices:

- KMP for deterministic one-pattern matching
- Z algorithm when prefix matching logic gives the cleanest view
- Rabin-Karp plus rolling hash for fast window comparisons with verification
- trie-based matching for many shared-prefix patterns

Common failure cases:

- broken LPS or Z preprocessing arrays
- skipping substring verification after a hash match
- choosing trie-based matching for a single short pattern

What to remember in Java:

- keep preprocessing and search code separate
- normalize rolling-hash subtraction under the modulus
- define trie alphabet assumptions clearly

### 2.5 Monotonic Structures and Interval Patterns

Recognition signals:

- next greater, previous smaller, or nearest boundary wording
- sliding window minimum or maximum
- histogram span calculations
- interval merging or event overlap counting

Core choices:

- monotonic stack for next-greater and span problems
- monotonic queue for sliding-window max or min
- sort and merge for overlapping intervals
- sweep line when event ordering is the real structure

Common failure cases:

- not being able to state the monotonic invariant
- forgetting to remove expired indices from a window deque
- forgetting the final stack flush in histogram problems
- ignoring interval endpoint semantics

What to remember in Java:

- store indices when boundaries matter
- use `ArrayDeque<Integer>` for stacks and queues
- sort intervals or events before trying to merge or sweep

### 2.6 Interview and Contest Workflow

Recognition signals:

- the problem is unfamiliar, but the bottleneck is still identifiable
- constraints strongly rule out one family of solutions
- the main failure risk is weak explanation or fragile implementation

Core workflow:

1. Restate the problem in plain language.
2. Write or describe the simplest correct baseline.
3. Name the bottleneck explicitly.
4. Match that bottleneck to a known pattern.
5. Implement the optimized solution in the safest order.
6. Explain correctness and complexity clearly.

Common failure cases:

- jumping to an advanced pattern before the baseline is correct
- optimizing the wrong bottleneck
- giving a complexity answer that is not grounded in the actual code structure

What to remember in Java:

- choose data types by constraint range
- keep helper methods small and named by responsibility
- test empty, singleton, and adversarial cases before trusting the solution

## 3. Reusable Java DSA Library Completion Checklist

By the end of Part VII, your reusable Java library should include at least the following advanced modules.

### 3.1 Required classes

- `SparseTableMin` or `SparseTableMax`
- `SqrtDecompositionRangeSum`
- `FenwickTree`
- `BinaryLiftingLca`
- `EulerTourSubtreeQuery`
- `TreeDiameter`
- `MaxFlowEdmondsKarp`
- `StateBfsTemplate`
- `KmpMatcher`
- `ZMatcher`
- `RollingHashMatcher`
- `TrieDictionaryMatcher`
- `MonotonicStackTemplates`
- `MonotonicQueueTemplates`
- `IntervalUtils`
- `ContestSolverTemplate`

### 3.2 Minimum public method surface

```java
public final class SparseTableMin {
    public SparseTableMin(int[] values) {}
    public int query(int left, int right) { return 0; }
}

public final class BinaryLiftingLca {
    public BinaryLiftingLca(java.util.List<Integer>[] graph, int root) {}
    public int lca(int first, int second) { return 0; }
    public int kthAncestor(int node, int k) { return 0; }
}

public final class MaxFlowEdmondsKarp {
    public MaxFlowEdmondsKarp(int nodeCount) {}
    public void addEdge(int from, int to, int capacity) {}
    public int maxFlow(int source, int sink) { return 0; }
}

public final class KmpMatcher {
    public java.util.List<Integer> search(String text, String pattern) { return java.util.List.of(); }
}

public final class IntervalUtils {
    public int[][] merge(int[][] intervals) { return new int[0][]; }
}
```

### 3.3 Library completion standard

For each reusable class, verify all of the following:

- the class has one tiny hand-checkable example
- the complexity is written in a code comment or nearby notes
- edge cases are explicitly tested
- the method names describe the operation rather than the problem source
- the implementation uses consistent zero-based or one-based indexing rules

### 3.4 Contest template baseline

Your contest template should already let you start a problem without rebuilding the same infrastructure each time.

Keep one template that includes:

- fast input
- fast output
- graph adjacency-list builder
- BFS and DFS scaffolding
- common math helpers if you actually reuse them
- a safe `solve()` entry point separated from input parsing

## 4. Part VII Mini Assessment

Use this as a self-check after finishing chapters 35 to 40.

### Part A: Pattern Recognition

1. You have `2,000,000` range minimum queries on a static array with no updates. Which structure should you prefer, and why is a segment tree not the cleanest default?
2. You need subtree sum queries on a rooted tree, and node values do not change. What reduction turns the tree problem into an array problem?
3. A shortest-path problem allows exactly one discounted edge. Why is ordinary Dijkstra on plain node IDs incomplete?
4. A problem asks for the next greater element to the right for every index. What invariant should your stack maintain?
5. You need to search one pattern in one long text with deterministic linear time. Which matcher is the cleanest default?
6. A hard problem statement is unclear. What is the first useful step before you reach for an advanced optimization?

### Part B: Short Design Tasks

7. Give one case where Mo's algorithm is a poor choice even if the queries are offline.
8. Explain the difference between subtree queries and path queries on trees in one or two sentences.
9. Describe what reverse edges mean in a residual graph.
10. Explain why rolling hash still needs substring verification in exact matching.
11. Give one signal that sweep line is more natural than interval merging.
12. Name one reason a reusable Java library is better than copying old contest code ad hoc.

### Part C: Implementation Tasks

13. Implement one reusable Java class from the Part VII checklist without copying from a chapter file.
14. Solve one new problem from each of these groups:
    - advanced range or query
    - advanced tree
    - advanced graph
    - advanced string
    - monotonic or interval
15. For each solved problem, write a four-line postmortem:
    - baseline idea
    - bottleneck
    - final pattern
    - bug or edge case that mattered

### Part D: Answer Guide

1. Prefer sparse table because the data is static and RMQ is idempotent; segment tree is more flexible than necessary.
2. Euler tour flattening maps each subtree to one contiguous interval.
3. The state must include whether the discount has already been used.
4. The stack keeps unresolved indices in decreasing-value order.
5. KMP is the cleanest deterministic linear-time default for one-pattern exact matching.
6. Restate the problem and produce the simplest correct baseline first.
7. Mo's algorithm is poor when add/remove operations are expensive or awkward to maintain.
8. Subtree queries stay inside one rooted region; path queries connect two arbitrary nodes and often need different machinery.
9. Reverse edges represent flow that can be canceled or rerouted later.
10. Equal hashes can still collide, so verification preserves exact correctness.
11. Sweep line is more natural when the main structure is a sorted stream of start or end events.
12. Reusable library code reduces reimplementation bugs and makes pattern selection faster under pressure.

### Part E: Scoring Guide

- `12/12` on Parts A and B, plus all Part C tasks completed: Part VII outcome is complete.
- `9-11/12` on Parts A and B: Part VII concepts are mostly stable, but one review pass is still needed.
- `8/12` or lower on Parts A and B: redo revision before spending more time on new hard problems.

## 5. 200+ Curated Problems Plan With Written Notes

The Part VII capstone is not just volume. It is structured volume.

### 5.1 Recommended distribution

- 25 problems: advanced range and query techniques
- 30 problems: advanced trees
- 35 problems: advanced graph algorithms
- 25 problems: advanced string algorithms
- 25 problems: monotonic structures and interval patterns
- 60 problems: mixed interview and contest problems requiring explicit pattern choice

Total: `200`

### 5.2 Minimum written note for every solved problem

Write these five items after each solve:

- the final pattern used
- the rejected baseline and its bottleneck
- the invariant, state, or model that made the optimized solution correct
- one bug, edge case, or trap worth remembering
- one sentence on when to reuse the same idea again

### 5.3 Weekly cadence that actually scales

- 4 easier reinforcement problems
- 6 medium problems
- 2 hard problems
- 1 revision session where you re-solve one old problem from memory
- 1 note-cleanup session where you compress old postmortems into short reusable lessons

### 5.4 Failure rules

If you miss a problem because of one of these reasons, tag it explicitly:

- wrong pattern recognition
- wrong state or invariant
- coding bug
- edge-case miss
- time-management failure

That tag matters more than whether the final answer was eventually accepted.

## 6. Exit Checklist

Mark Part VII complete only when all of these are true.

- You can explain when sparse table beats segment tree and when it does not.
- You can answer LCA queries with binary lifting without re-reading a template line by line.
- You understand residual graphs well enough to debug a bad max-flow implementation.
- You can tell when a shortest-path problem needs state expansion.
- You can implement at least one of KMP or Z algorithm from memory and debug the preprocessing array.
- You can use a monotonic queue or stack without memorizing the answer pattern blindly.
- You have a reusable Java library containing the advanced templates from this part.
- You have completed the mini assessment honestly.
- You have a live tracker for the 200-problem capstone with written notes.

If even one of those is still unstable, the part is not finished yet. Review first, then practice again.
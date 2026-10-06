# 18: Range Query Patterns

## 0. Introduction

This chapter sits in Part V - Range Queries, Strings, and Geometry (Weeks 23-28), with the roadmap treating it as advanced work. Its goal is to learn how to model range-query problems from the constraints first so you can choose prefix sums, Fenwick trees, segment trees, or sparse tables deliberately instead of by habit. This chapter directly supports the Part V outcome of matching query problems to preprocessing-heavy or update-heavy solutions based on the constraints.

Read it as a bridge in the larger sequence. Chapter 17 focused on optimizing dynamic programming transitions when the recurrence structure allowed it. This chapter shifts from recurrence speedups to data structures that answer repeated interval questions efficiently. Chapter 19 moves from interval preprocessing on arrays to preprocessing-heavy string tools such as rolling hash and string matching. Start this chapter after you are comfortable with Chapters 1 through 17, especially arrays, prefix sums, trees, binary search thinking, and the habit of checking constraints before committing to a data structure. The main themes here are Range Query Pattern, Segment Tree Pattern, Fenwick Tree Pattern, Sparse Table Pattern, Point updates, range updates, and immutable queries, and Choosing the right query structure from the constraints.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to distinguish mutable and immutable query settings, apply segment trees for general range work, use Fenwick trees for compact sum-style updates, use sparse tables for immutable idempotent queries, and justify the chosen structure in Java from the input limits.

## 1. Intuition First

This chapter matters because many problems are not really about one query. They are about thousands, millions, or online streams of queries over intervals. If each query scans the whole interval again, the algorithm usually fails on constraints even when the logic is correct.

The simplest analogy is a warehouse dashboard. One manager asks for the total stock from shelf 20 to shelf 80. Another asks for the minimum temperature in aisle 5 through aisle 12. A third keeps updating shelves after deliveries. The right answer depends less on the question wording and more on whether the data changes and what operation the interval query uses.

The core mental model is:

- a range query problem is a constraint-selection problem before it is a coding problem
- immutable arrays reward preprocessing-heavy structures
- point updates often allow lighter data structures than full range updates
- general range updates and general range queries usually push you toward segment trees with lazy propagation
- not every range query needs the strongest structure; simpler tools are often faster to implement and easier to debug

Recognition signals for this chapter:

- many queries on subarrays or index intervals
- online updates mixed with queries
- runtime target that makes repeated scanning impossible
- query operations such as sum, minimum, maximum, gcd, xor, or custom associative merges
- words like mutable, live updates, intervals, dashboard, logs, snapshots, or repeated queries

The most common beginner confusion point is picking the fanciest structure too early. A sparse table is excellent for immutable range minimum queries, but useless for live updates. A Fenwick tree is elegant for additive prefix-based work, but not a universal replacement for a segment tree.

In the larger roadmap, this chapter is the foundation for later preprocessing-heavy ideas in strings and geometry. It trains the habit of reading constraints before selecting the data structure.

## 2. Learning Path and Recognition Checklist

The chapter starts with the general range query pattern because the first job is not implementation. The first job is classification: is the data immutable, updated at points, updated over ranges, or queried with an operation that needs stronger merge logic? After that, the chapter studies segment trees, Fenwick trees, and sparse tables as three major answers to those classifications.

Recognition checklist for this chapter:

- Is the array immutable after preprocessing?
- Are updates point updates or range updates?
- Is the query operation additive, associative, or idempotent?
- Do I need online answers as operations arrive?
- Can prefix sums solve the problem already?
- Is memory tight enough that a lighter structure matters?

The brute-force baseline usually looks like this:

- scan every index in `[left, right]` for each query
- apply every update directly to every affected element
- rebuild aggregate information from scratch after each change

The optimization path introduced later is:

- prefix sums for immutable sum-style ranges
- Fenwick trees for compact additive point-update workflows
- segment trees for general merge logic and stronger update/query combinations
- sparse tables for immutable idempotent queries such as min, max, and gcd

Mastery by the end of the chapter looks like this: you can explain not only how the chosen structure works, but why the other obvious choices are worse for the same constraint profile.

Do not force a segment tree when prefix sums are enough. Do not force a sparse table when the problem has live updates. Do not force a Fenwick tree for arbitrary non-invertible merge logic.

## 3. Official Subtopic Coverage

### Concept Cluster: Constraint-First Range Thinking
Official subtopics covered:
- 18.1 Range Query Pattern
- 18.6 Choosing the right query structure from the constraints

#### Definition or Framing
The Range Query Pattern is the practice of answering many interval queries by preprocessing or maintaining aggregate information so each query avoids rescanning the raw interval. The first design decision is always constraint-driven: immutable versus mutable data, and point updates versus range updates.

#### Recognition Signals
- repeated interval questions over the same array or sequence
- large query counts compared with array size
- runtime failure from repeated scanning
- a clear aggregate operation such as sum, min, max, gcd, xor, or count

#### Brute-Force Baseline
For each query, scan from `left` to `right` and compute the answer directly. For each update, modify the affected cells and rebuild whatever summary the next query needs.

#### Optimized Pattern Idea
Replace repeated raw scans with a structure that stores reusable interval information. The correct structure depends on the query operator and on whether updates exist.

#### Invariant / State Representation / Transition Logic
Every node, prefix entry, or precomputed block must represent a valid aggregate over a known interval. Correctness comes from keeping that interval meaning stable after updates or during preprocessing.

#### Java Implementation Notes
- use `long` for sums when the input size and values can overflow `int`
- keep indexing conventions explicit; Fenwick trees are usually 1-indexed internally, while segment trees often expose 0-indexed APIs
- write helper methods that make the interval meaning obvious

#### Quick Dry Run
If there are `100000` queries over an array of length `100000`, an `O(length)` scan per query is already too expensive. That forces preprocessing or a maintained structure.

#### Common Mistakes
- ignoring whether the input is mutable
- choosing a structure by memorized template instead of constraint fit
- forgetting that some query operators combine nicely while others do not

#### Debugging Strategy
Write down three things before coding: what updates exist, what the query returns, and whether overlapping interval combination is safe.

#### Comparison with Similar Pattern
Prefix sums are the simplest range-query structure, but only for immutable additive queries. This chapter generalizes that idea to richer query and update models.

#### Advanced Note
In harder problems, the range-query structure may be one layer inside another technique such as heavy-light decomposition or sweep line.

### Concept Cluster: Segment Trees for General Mutable Ranges
Official subtopics covered:
- 18.2 Segment Tree Pattern
- 18.5 Point updates, range updates, and immutable queries

#### Definition or Framing
The Segment Tree Pattern stores aggregates over nested intervals so queries and updates can skip large unaffected sections. It is the most flexible mainstream range structure in this chapter.

#### Recognition Signals
- point updates plus arbitrary range queries
- range updates plus online queries
- query operations that need a custom merge such as minimum, maximum, gcd, xor, or a richer state object
- the problem needs more flexibility than a Fenwick tree or sparse table provides

#### Brute-Force Baseline
Apply point updates directly to the array and scan every query interval. For range updates, touch every element in the updated interval.

#### Optimized Pattern Idea
Store aggregates in a binary interval tree. Recurse only into nodes whose intervals overlap the operation. For range updates, delay propagation with lazy tags until the information is needed.

#### Invariant / State Representation / Transition Logic
Each tree node must always represent the correct aggregate for its exact interval. A lazy tag means the update has been logically applied to the whole node interval even if its children are not yet refreshed.

#### Java Implementation Notes
- `4 * n` arrays are a common simple allocation strategy
- use iterative or recursive implementations consistently; do not mix interval conventions casually
- when lazy propagation is used, always define how a tag updates the node value and how tags compose

#### Quick Dry Run
If an update covers the whole segment represented by a node, update that node once and store a lazy tag instead of descending to every leaf.

#### Common Mistakes
- forgetting to push lazy tags before descending
- using the wrong neutral value for no-overlap cases
- mixing inclusive and exclusive intervals inside the same implementation

#### Debugging Strategy
Print node intervals and stored values on a tiny array after each operation. Lazy propagation bugs are easier to catch from wrong interval semantics than from final answers alone.

#### Comparison with Similar Pattern
Fenwick trees are smaller and simpler for additive workflows, but segment trees handle a much wider class of interval queries and update patterns.

#### Advanced Note
The same segment-tree skeleton later powers path queries on trees and event sweeps over compressed coordinates.

### Concept Cluster: Fenwick Trees for Compact Additive Work
Official subtopics covered:
- 18.3 Fenwick Tree Pattern

#### Definition or Framing
The Fenwick Tree Pattern, also called Binary Indexed Tree, stores partial prefix aggregates so point updates and prefix queries run in `O(log n)` with small memory and low constant factors.

#### Recognition Signals
- sum, count, xor, or another prefix-friendly invertible aggregate
- point updates plus range queries derived from prefix queries
- the problem needs a lighter structure than a segment tree
- coordinate compression appears together with frequency counting

#### Brute-Force Baseline
Maintain the raw array and recompute prefix or range sums by scanning.

#### Optimized Pattern Idea
Store carefully chosen suffix-sized prefix chunks in a 1-indexed array. Move upward or downward by the lowest set bit to update or query only the affected chunks.

#### Invariant / State Representation / Transition Logic
`tree[index]` stores the aggregate of a fixed suffix of the prefix ending at `index`. Repeatedly adding or subtracting `index & -index` moves between the chunks needed to assemble a prefix answer.

#### Java Implementation Notes
- keep the public API 0-indexed if desired, but convert internally to 1-indexed
- for range sum on `[left, right]`, compute `prefix(right) - prefix(left - 1)`
- use `long[]` when counts or sums can grow large

#### Quick Dry Run
At index `12`, the lowest set bit is `4`, so that Fenwick cell summarizes a block of length `4` ending at `12`.

#### Common Mistakes
- forgetting the internal 1-indexed convention
- using Fenwick trees for unsupported non-invertible merge logic
- writing `while (index > 0)` loops incorrectly during updates or queries

#### Debugging Strategy
After a few updates, print the raw tree array and manually verify one prefix query from the covered blocks.

#### Comparison with Similar Pattern
Fenwick trees are usually easier than segment trees for additive prefix-style work, but they do not replace segment trees for general range minimum or lazy range update cases.

#### Advanced Note
Two Fenwick trees can support certain range update and range query combinations, but the algebra must match the operation.

### Concept Cluster: Sparse Tables for Immutable Idempotent Queries
Official subtopics covered:
- 18.4 Sparse Table Pattern
- 18.5 Point updates, range updates, and immutable queries
- 18.6 Choosing the right query structure from the constraints

#### Definition or Framing
The Sparse Table Pattern precomputes answers for intervals of length `2^k`. It is strongest when the array is immutable and the query operation is idempotent, meaning overlapping blocks can be combined safely, as with minimum, maximum, and gcd.

#### Recognition Signals
- no updates after preprocessing
- very many queries on a fixed array
- min, max, gcd, or another idempotent interval operator
- preprocessing time and extra memory are acceptable

#### Brute-Force Baseline
Answer each immutable query by scanning the requested interval.

#### Optimized Pattern Idea
Precompute answers for all power-of-two intervals. For a query, combine two overlapping blocks of the same power-of-two length.

#### Invariant / State Representation / Transition Logic
`table[k][i]` stores the answer for the interval starting at `i` with length `2^k`. Query correctness relies on the operator tolerating overlap, which is why sparse tables work naturally for min and max but not plain range sum in this form.

#### Java Implementation Notes
- precompute floor logs once
- build level `k` from level `k - 1`
- document clearly that the structure is immutable after construction

#### Quick Dry Run
For a query of length `13`, the largest power of two not exceeding it is `8`. For range minimum, combine the precomputed intervals `[left, left + 7]` and `[right - 7, right]`.

#### Common Mistakes
- trying to use sparse tables for mutable data
- forgetting that overlap safety depends on the operator
- using the wrong second block start during queries

#### Debugging Strategy
Check the log table first. Many sparse-table bugs are really off-by-one mistakes in `right - (1 << k) + 1`.

#### Comparison with Similar Pattern
Sparse tables beat segment trees on immutable idempotent queries because queries can be `O(1)`, but they lose immediately once updates enter the problem.

#### Advanced Note
Disjoint sparse tables extend the idea to more query operators, but the basic sparse table remains the standard first tool for immutable RMQ-style tasks.

## 4. Pattern Template, State Model, or Core Workflow

Canonical range-query decision workflow:

1. Identify the operation.
   Is it sum, min, max, gcd, xor, count, or a custom merge?
2. Classify mutability.
   Immutable data suggests heavy preprocessing; mutable data suggests maintained structures.
3. Classify update type.
   Point updates are weaker than range updates and often allow simpler structures.
4. Check algebraic properties.
   Prefix-difference tricks need invertibility. Sparse-table `O(1)` queries need idempotence.
5. Pick the cheapest correct structure.

The usual choices are:

- immutable sum query: prefix sum
- immutable min or max query: sparse table
- point update plus range sum or count: Fenwick tree
- point update plus general associative range query: segment tree
- range update plus online range query: lazy segment tree

Important variables and safety rules:

- define whether intervals are inclusive or half-open and do not mix them
- for segment trees, each node must know the exact interval it represents
- for lazy segment trees, document how the lazy tag changes the node aggregate
- for Fenwick trees, keep internal indexing 1-based even if the public API is 0-based
- for sparse tables, verify that the operator supports the query composition rule

What usually breaks first:

- no-overlap return values in segment tree queries
- pushing lazy tags in the wrong order
- off-by-one errors when converting between 0-indexed input and 1-indexed Fenwick storage
- using sparse tables for range sum without a disjoint or different design

When to adapt versus keep the template unchanged:

- keep Fenwick trees unchanged for classic additive or counting tasks
- adapt segment tree node state when the query merges richer information
- keep sparse tables unchanged for immutable idempotent operators
- switch away from the structure entirely if the constraint profile changes

## 5. Worked Examples and Full Solutions

### Worked Example 1: Live Sales Range Sums
#### Problem Statement
Design a structure for an array of daily sales. Support two operations online: update one day by adding a delta, and return the total sales from day `left` to day `right`.

#### Why This Example Matters
This is the cleanest entry point into mutable range sums. It shows why point updates immediately break a simple prefix-sum solution and why a Fenwick tree is the lightest correct tool.

#### Input and Constraints
- `1 <= n, operations <= 200000`
- values and deltas fit in `int`, but totals may require `long`
- operations arrive online

#### Recognition Signals
- point updates only
- range sum query
- many operations, so rescanning is too slow

#### Brute-Force Approach
Store the raw array. For an update, change one cell in `O(1)`. For a query, scan from `left` to `right` in `O(n)`.

#### Better Pattern-Based Approach
Use a Fenwick tree. Each point update and prefix query becomes `O(log n)`, and a range sum becomes the difference of two prefix sums.

#### Why the Pattern Fits
The aggregate is additive, updates are point-based, and the structure needs online answers. That is the exact strength of a Fenwick tree.

#### Invariant or State Transition
Each Fenwick entry stores the sum of a fixed block ending at that index. Updating one array position updates only the Fenwick blocks that cover it.

#### Pragmatic Java Choice
Use a `long[]` internally and expose 0-indexed methods so the calling code stays natural.

#### Dry Run Before Code
Suppose the sales are `[5, 2, 7, 1, 3]`.

- Query `[1, 3]` asks for `2 + 7 + 1 = 10`
- Update index `2` by `+4`, so the array becomes `[5, 2, 11, 1, 3]`
- Query `[1, 3]` now becomes `2 + 11 + 1 = 14`

The Fenwick tree updates only the prefix blocks touched by index `2`, not the whole suffix.

#### Java Solution
```java
import java.util.Arrays;

public class FenwickRangeSumExample {
    static class FenwickTree {
        private final long[] tree;

        FenwickTree(int size) {
            this.tree = new long[size + 1];
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
            if (left > right) {
                return 0;
            }
            return prefixSum(right) - (left == 0 ? 0 : prefixSum(left - 1));
        }
    }

    static class SalesTracker {
        private final long[] values;
        private final FenwickTree fenwickTree;

        SalesTracker(int[] initialSales) {
            this.values = new long[initialSales.length];
            this.fenwickTree = new FenwickTree(initialSales.length);
            for (int index = 0; index < initialSales.length; index++) {
                values[index] = initialSales[index];
                fenwickTree.add(index, initialSales[index]);
            }
        }

        void addToDay(int index, int delta) {
            values[index] += delta;
            fenwickTree.add(index, delta);
        }

        long queryRange(int left, int right) {
            return fenwickTree.rangeSum(left, right);
        }
    }

    public static void main(String[] args) {
        SalesTracker tracker = new SalesTracker(new int[]{5, 2, 7, 1, 3});
        System.out.println(tracker.queryRange(1, 3));
        tracker.addToDay(2, 4);
        System.out.println(tracker.queryRange(1, 3));
    }
}
```

#### Time and Space Complexity
- Brute force: update `O(1)`, query `O(n)`, space `O(n)`
- Fenwick tree: update `O(log n)`, query `O(log n)`, space `O(n)`

Compared with a segment tree, the Fenwick tree uses less memory and simpler code, but it is less flexible.

#### Edge Cases
- empty query interval if `left > right`
- large cumulative totals that overflow `int`
- repeated updates on the same index

#### Common Mistakes
- forgetting the internal `+1` shift
- computing `prefix(left)` instead of `prefix(left - 1)`
- mixing assignment updates with delta updates without tracking the current value

### Worked Example 2: Range Add and Range Maximum
#### Problem Statement
Given an array of server loads, support online operations of two kinds: add `delta` to every element in `[left, right]`, and return the maximum load in `[left, right]`.

#### Why This Example Matters
This example shows why Fenwick trees are not universal. The update touches a whole interval, and the query asks for a non-additive aggregate. That forces a lazy segment tree.

#### Input and Constraints
- `1 <= n, operations <= 200000`
- values and updates may be negative or positive
- online answers are required

#### Recognition Signals
- range updates, not just point updates
- range maximum query
- scanning the interval on each update or query is too slow

#### Brute-Force Approach
For each update, loop from `left` to `right` and add `delta`. For each query, loop again to find the maximum.

#### Better Pattern-Based Approach
Use a segment tree with lazy propagation. Whole covered segments are updated in one step, and deferred tags push the work downward only when needed.

#### Why the Pattern Fits
The query merge is `max`, the updates affect intervals, and operations arrive online. That combination is exactly where a lazy segment tree is the standard answer.

#### Invariant or State Transition
Each node stores the maximum over its interval. A lazy tag means every value in that interval has already been conceptually increased by the tag amount.

#### Pragmatic Java Choice
Use arrays for the tree and lazy tags because they are faster and simpler than allocating node objects for this classic indexed problem.

#### Dry Run Before Code
Suppose the loads are `[4, 1, 6, 2, 5]`.

- Query max in `[1, 4]` gives `6`
- Add `3` to `[0, 2]`, producing `[7, 4, 9, 2, 5]`
- Query max in `[1, 4]` now gives `9`

The update touches the left large segments quickly instead of descending to every leaf.

#### Java Solution
```java
public class LazySegmentTreeMaxExample {
    static class SegmentTree {
        private final long[] tree;
        private final long[] lazy;
        private final int size;

        SegmentTree(int[] values) {
            this.size = values.length;
            this.tree = new long[size * 4];
            this.lazy = new long[size * 4];
            build(1, 0, size - 1, values);
        }

        private void build(int node, int left, int right, int[] values) {
            if (left == right) {
                tree[node] = values[left];
                return;
            }
            int mid = left + (right - left) / 2;
            build(node * 2, left, mid, values);
            build(node * 2 + 1, mid + 1, right, values);
            tree[node] = Math.max(tree[node * 2], tree[node * 2 + 1]);
        }

        private void apply(int node, long delta) {
            tree[node] += delta;
            lazy[node] += delta;
        }

        private void push(int node) {
            if (lazy[node] != 0) {
                apply(node * 2, lazy[node]);
                apply(node * 2 + 1, lazy[node]);
                lazy[node] = 0;
            }
        }

        void rangeAdd(int queryLeft, int queryRight, long delta) {
            rangeAdd(1, 0, size - 1, queryLeft, queryRight, delta);
        }

        private void rangeAdd(int node, int left, int right, int queryLeft, int queryRight, long delta) {
            if (queryRight < left || right < queryLeft) {
                return;
            }
            if (queryLeft <= left && right <= queryRight) {
                apply(node, delta);
                return;
            }
            push(node);
            int mid = left + (right - left) / 2;
            rangeAdd(node * 2, left, mid, queryLeft, queryRight, delta);
            rangeAdd(node * 2 + 1, mid + 1, right, queryLeft, queryRight, delta);
            tree[node] = Math.max(tree[node * 2], tree[node * 2 + 1]);
        }

        long rangeMax(int queryLeft, int queryRight) {
            return rangeMax(1, 0, size - 1, queryLeft, queryRight);
        }

        private long rangeMax(int node, int left, int right, int queryLeft, int queryRight) {
            if (queryRight < left || right < queryLeft) {
                return Long.MIN_VALUE;
            }
            if (queryLeft <= left && right <= queryRight) {
                return tree[node];
            }
            push(node);
            int mid = left + (right - left) / 2;
            long leftAnswer = rangeMax(node * 2, left, mid, queryLeft, queryRight);
            long rightAnswer = rangeMax(node * 2 + 1, mid + 1, right, queryLeft, queryRight);
            return Math.max(leftAnswer, rightAnswer);
        }
    }

    public static void main(String[] args) {
        SegmentTree segmentTree = new SegmentTree(new int[]{4, 1, 6, 2, 5});
        System.out.println(segmentTree.rangeMax(1, 4));
        segmentTree.rangeAdd(0, 2, 3);
        System.out.println(segmentTree.rangeMax(1, 4));
    }
}
```

#### Time and Space Complexity
- Brute force: range update `O(n)`, range query `O(n)`, space `O(n)`
- Lazy segment tree: range update `O(log n)`, range query `O(log n)`, space `O(n)`

Compared with a Fenwick tree, this is heavier in code and memory, but it matches the richer update and query model.

#### Edge Cases
- single-element intervals
- negative deltas that lower the maximum
- querying disjoint regions repeatedly after many deferred updates

#### Common Mistakes
- returning `0` for no overlap in a maximum query instead of a true neutral minimum
- forgetting to push lazy tags before partial recursion
- not recomputing the parent after child updates

### Worked Example 3: Immutable Range Minimum Query
#### Problem Statement
Given a fixed array of temperatures, answer many queries asking for the minimum value in `[left, right]`. No updates occur after preprocessing.

#### Why This Example Matters
This example shows the opposite end of the design spectrum. Once the data becomes immutable, a sparse table can outperform a segment tree on query speed.

#### Input and Constraints
- `1 <= n, queries <= 200000`
- the array is fixed after construction
- queries ask for minimum only

#### Recognition Signals
- immutable data
- very large number of queries
- idempotent operator: minimum

#### Brute-Force Approach
Scan each interval and compute the minimum directly in `O(length)` time.

#### Better Pattern-Based Approach
Build a sparse table in `O(n log n)`, then answer each minimum query in `O(1)`.

#### Why the Pattern Fits
Minimum is idempotent, so two overlapping precomputed blocks can safely answer the query. Because there are no updates, preprocessing is a good trade.

#### Invariant or State Transition
`table[power][index]` stores the minimum over the interval starting at `index` with length `2^power`.

#### Pragmatic Java Choice
Use `int[][]` for values and a separate `int[] logs` for query lengths. The structure is immutable after construction.

#### Dry Run Before Code
Suppose the temperatures are `[9, 4, 7, 3, 8, 2, 6]`.

- Query `[1, 5]` has length `5`
- largest power of two not exceeding `5` is `4`
- compare the precomputed answers for `[1, 4]` and `[2, 5]`
- the minimum is `2`

#### Java Solution
```java
public class SparseTableMinExample {
    static class SparseTable {
        private final int[][] table;
        private final int[] logs;

        SparseTable(int[] values) {
            int n = values.length;
            logs = new int[n + 1];
            for (int length = 2; length <= n; length++) {
                logs[length] = logs[length / 2] + 1;
            }

            int maxPower = logs[n] + 1;
            table = new int[maxPower][n];
            System.arraycopy(values, 0, table[0], 0, n);

            for (int power = 1; power < maxPower; power++) {
                int segmentLength = 1 << power;
                int halfLength = segmentLength >> 1;
                for (int index = 0; index + segmentLength <= n; index++) {
                    table[power][index] = Math.min(
                            table[power - 1][index],
                            table[power - 1][index + halfLength]
                    );
                }
            }
        }

        int rangeMin(int left, int right) {
            int length = right - left + 1;
            int power = logs[length];
            int blockLength = 1 << power;
            return Math.min(table[power][left], table[power][right - blockLength + 1]);
        }
    }

    public static void main(String[] args) {
        SparseTable sparseTable = new SparseTable(new int[]{9, 4, 7, 3, 8, 2, 6});
        System.out.println(sparseTable.rangeMin(1, 5));
        System.out.println(sparseTable.rangeMin(3, 6));
    }
}
```

#### Time and Space Complexity
- Brute force: query `O(n)`, preprocessing `O(1)`, space `O(1)` beyond input
- Sparse table: preprocessing `O(n log n)`, query `O(1)`, space `O(n log n)`

Compared with a segment tree, the sparse table spends more memory up front but answers immutable RMQ faster.

#### Edge Cases
- querying a single index
- arrays of length `1`
- negative values or duplicate minimum values

#### Common Mistakes
- building the second half from the wrong start index
- forgetting that the query uses overlapping blocks
- applying the same structure to mutable queries

## 6. Complexity and Comparison Guide

Across the chapter, the main trade-offs are:

- brute-force scanning: minimal implementation cost, but `O(length)` per query is usually too slow at scale
- Fenwick tree: `O(log n)` updates and prefix-derived range queries with `O(n)` memory; best when the algebra is additive or count-like
- segment tree: `O(log n)` updates and queries with `O(n)` memory; best for general associative merges and range updates via lazy propagation
- sparse table: `O(n log n)` preprocessing, `O(1)` immutable idempotent queries, `O(n log n)` memory

Comparison with similar patterns:

- Prefix sum versus Fenwick tree: prefix sum is simpler for immutable sum queries, but breaks under online updates.
- Fenwick tree versus segment tree: Fenwick is smaller and simpler for additive workflows; segment tree is stronger for custom merges and lazy updates.
- Segment tree versus sparse table: segment tree handles updates, sparse table wins on immutable query speed.

Decision criteria:

- choose prefix sum if the array never changes and the query is additive
- choose Fenwick if updates are points and the query can be reduced to prefix aggregates
- choose segment tree if the query merge is richer or updates affect ranges
- choose sparse table if the array is immutable and the operator is idempotent

Signals not to force this chapter's techniques:

- only one or two queries: brute force may be enough
- tiny constraints: a heavy structure may add more bug risk than value
- the operator is incompatible with the structure's algebraic assumptions

What breaks when invariants fail:

- if a segment-tree node stops representing its interval correctly, every ancestor above it becomes untrustworthy
- if a Fenwick tree uses inconsistent indexing, prefix sums silently drift
- if a sparse table is used for mutable data or non-idempotent overlap, the answers can look plausible while being wrong

## 7. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- off-by-one errors between inclusive query intervals and internal recursion bounds
- wrong neutral values in segment-tree no-overlap branches
- forgetting to store current values when a Fenwick tree API expects deltas
- applying sparse-table logic to range sums without a compatible design

Boundary-condition handling:

- empty arrays usually need explicit guarding or problem-level exclusion
- single-element queries should pass through all structures cleanly
- when values can be large, sums must use `long`

Stale state and mutation risks:

- lazy propagation that is never pushed during partial queries
- rebuilding one part of a segment tree but forgetting the parent merge
- mixing direct array mutation with maintained-tree mutation without keeping them synchronized

Short debugging checklist:

1. Write down what each stored cell or node means.
2. Verify one tiny example by hand after each update.
3. Check interval conventions at every recursive call.
4. Confirm the neutral element for no overlap.
5. Compare against brute force on random small cases.

Counterexample to a common wrong solution:

Using a plain prefix-sum array for mutable range-sum queries fails immediately. If the array is `[2, 5, 1]` and index `1` changes from `5` to `9`, every later prefix value after index `1` becomes stale unless the whole suffix is repaired.

## 8. Practice Problems

### Easy
- Range Sum Query - Immutable: preprocess an array so each sum query on `[left, right]` is fast; expected pattern or core idea: prefix sums.
- Range Sum Query - Mutable: support point updates and range sums online; expected pattern or core idea: Fenwick tree or segment tree.
- Static Range Minimum: answer many minimum queries on a fixed array; expected pattern or core idea: sparse table.

### Medium
- Corporate Flight Bookings: apply range additions over booking intervals and report final seat counts; expected pattern or core idea: difference array, with range-update intuition connected to segment trees.
- Count of Smaller Numbers After Self: count how many later values are smaller than each element; expected pattern or core idea: Fenwick tree with coordinate compression.
- Longest Well-Performing Interval with Updates Variant: maintain interval summaries under point changes; expected pattern or core idea: segment tree with custom node merge.

### Hard
- Range Module: add, remove, and query covered intervals online; expected pattern or core idea: segment tree with lazy-style interval maintenance.
- Falling Squares: maintain maximum heights over compressed coordinates; expected pattern or core idea: segment tree with coordinate compression.
- Dynamic RMQ with Range Additions: support range add and range minimum queries at scale; expected pattern or core idea: lazy segment tree.

## 9. Short Recap

The core idea is to treat interval problems as a constraint-classification problem first and a data-structure implementation problem second. The strongest recognition clue is repeated range queries mixed with updates or heavy query volume. The key optimization insight is that different constraint profiles reward different structures: Fenwick for compact additive work, segment tree for general mutable intervals, and sparse table for immutable idempotent queries. The most important implementation warning is to keep interval meaning and indexing conventions consistent everywhere. This prepares the next chapter by reinforcing the same preprocessing mindset that advanced string algorithms rely on.

## 10. Coverage Check

- 18.1 Range Query Pattern - covered
- 18.2 Segment Tree Pattern - covered
- 18.3 Fenwick Tree Pattern - covered
- 18.4 Sparse Table Pattern - covered
- 18.5 Point updates, range updates, and immutable queries - covered
- 18.6 Choosing the right query structure from the constraints - covered

- Coverage Summary: 6/6 official subtopics covered
- This must always be 6/6 before final output

Next: 19: String Processing Patterns
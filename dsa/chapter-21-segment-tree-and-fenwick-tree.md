# 21: Segment Tree and Fenwick Tree

**Goal:** Teach how to answer range queries efficiently when arrays change over time, and how to choose between segment trees and Fenwick trees in Java.
**Outcome:** By the end of this chapter, you can explain why range-query data structures matter, build and query a segment tree, handle point and range updates with lazy propagation, implement a Fenwick tree, and choose the right structure for the constraints in front of you.

---

## 1. Intuition First

Range-query structures matter because many problems ask the same pattern repeatedly: "What is the sum, minimum, maximum, or frequency over this interval?" If the array never changes, prefix sums often solve the problem. If updates are mixed with queries, recomputing the answer from scratch becomes too slow.

A simple real-world analogy is a spreadsheet with thousands of rows. If one value changes and you still need fast totals for many row ranges, scanning those rows again and again wastes work. A range-query structure stores partial summaries so you reuse previous computation.

The core mental model is this:
- a segment tree stores answers for nested intervals
- a Fenwick tree stores carefully chosen partial prefix sums
- both trade extra memory for much faster repeated queries and updates

The most common beginner confusion point is thinking prefix sums already solve everything. Prefix sums are excellent for static arrays, but once values change often, the old prefix data becomes stale.

In the roadmap, this chapter is the final step in Part IV. You already know trees as hierarchical structures. Here, that tree idea becomes an interval tool. The next chapter shifts from ordered intervals to graph modeling.

## 2. Core Concepts and Techniques

### Concept Cluster: Why Range Structures Exist
Key concepts in this block:
- 21.1 Why range-query structures matter
- 21.2 Segment tree build and query

#### Intuition

If every query scans part of the array, repeated range queries become expensive. A segment tree avoids that by storing answers for subranges once and reusing them.

#### Why It Matters

Problems with many queries often have constraints where $O(n)$ per query is too slow. If $n = 10^5$ and there are $10^5$ queries, a full scan per query is not realistic.

#### How It Works

A segment tree recursively splits the array into halves.
- each leaf stores one array value
- each internal node stores a merged answer for its interval
- for sums, the merge is addition
- for minimum queries, the merge is `min`
- a query visits only nodes whose intervals overlap the requested range

Build works bottom-up:
- split interval `[left, right]` into two halves
- build children
- merge child answers into the parent

Query works by overlap cases:
- no overlap: return the neutral value
- full overlap: return the node's stored answer
- partial overlap: query both children and merge

#### Java Implementation Notes

- A common implementation uses arrays such as `long[] tree = new long[4 * n]`.
- Store intervals as inclusive bounds.
- Use `long` for sums when values or counts can exceed `int`.
- Keep the merge operation explicit so the structure is easier to adapt.

#### Common Mistakes

- mixing array indices with tree node indices
- getting the overlap conditions wrong
- forgetting that the query range is inclusive
- using `int` sums when overflow is possible

#### Quick Example

For the array `[2, 1, 5, 3]`:
- the root stores the answer for `[0, 3]`, which is `11`
- the left child stores `[0, 1]`, which is `3`
- the right child stores `[2, 3]`, which is `8`

A query for `[1, 2]` does not scan all four positions. It visits only the branches that overlap `[1, 2]`.

#### Debugging Tip

Log `(node, left, right, tree[node])` during build and query. Most bugs become obvious when the interval boundaries are visible.

#### Advanced Note

A segment tree works when the merge operation is associative. Sum, minimum, maximum, and gcd all fit naturally.

### Concept Cluster: Updates and Deferred Work
Key concepts in this block:
- 21.3 Point updates and range updates
- 21.4 Lazy propagation

#### Intuition

Once the tree stores interval answers, an update must keep those stored answers correct. Point updates affect one leaf and its ancestors. Range updates may affect many leaves, which is where lazy propagation matters.

#### Why It Matters

If a problem mixes many updates and many queries, a good query structure is not enough. Update speed matters just as much.

#### How It Works

For a point update:
- go from root to the target leaf
- change the leaf value
- recompute all ancestors on the way back

For a range update without lazy propagation:
- descend into every affected leaf
- recompute many nodes
- this can become too expensive

Lazy propagation stores pending work at a node instead of pushing it immediately to all descendants.
- if a node interval is fully covered by the update, apply the effect to that node
- store a lazy tag saying "children still need this update later"
- push that tag downward only when a future query or update needs to inspect the children

#### Java Implementation Notes

- Keep separate arrays such as `tree[]` and `lazy[]`.
- For range sums, updating a whole interval by `delta` changes the node value by `delta * intervalLength`.
- Push lazy values before descending into children during partial-overlap operations.

#### Common Mistakes

- forgetting to multiply by interval length for sum queries
- not pushing lazy values before going deeper
- clearing the lazy value too early or too late
- assuming the same lazy logic works unchanged for every kind of update

#### Quick Example

Suppose the array is `[4, 0, 2, 1]` and you add `3` to `[1, 3]`.
- brute force changes three positions directly
- lazy propagation can mark a fully covered segment and postpone child updates until needed

#### Debugging Tip

After each update, inspect both `tree` and `lazy`. If the root answer is correct but later queries fail, the bug is often in pushing tags to children.

#### Advanced Note

Range assignment, range add, and range minimum updates do not all use the same lazy logic. The tag meaning must match the operation.

### Concept Cluster: Fenwick Tree and Choosing the Right Tool
Key concepts in this block:
- 21.5 Fenwick tree basics
- 21.6 Segment tree vs binary indexed tree

#### Intuition

A Fenwick tree, also called a binary indexed tree, stores partial prefix sums in a compact structure. Each index is responsible for a block whose size comes from its least significant set bit.

#### Why It Matters

For prefix sums, range sums, and frequency counting with point updates, a Fenwick tree is often simpler and smaller than a segment tree.

#### How It Works

Fenwick tree rules:
- internal storage is usually 1-indexed
- update adds `delta` at one position and climbs upward with `index += index & -index`
- prefix sum moves downward with `index -= index & -index`
- range sum `[left, right]` equals `prefix(right) - prefix(left - 1)`

Comparison:
- Fenwick tree is compact and fast for sum-like prefix logic
- segment tree is more general and handles more query and update types

#### Java Implementation Notes

- Keep a 0-indexed public API and translate internally to 1-indexed storage.
- Track current values if the API asks for "set index to newValue" rather than "add delta".
- Fenwick trees are especially natural for frequency arrays and coordinate-compressed counting problems.

#### Common Mistakes

- mixing 0-indexed external positions with 1-indexed internal positions
- updating with the new value instead of the delta
- expecting a basic Fenwick tree to support arbitrary range updates and arbitrary range queries without extra techniques

#### Quick Example

In a 1-indexed Fenwick tree:
- index `6` has lowbit `2`
- so `tree[6]` stores the sum for a block of length `2`
- that block ends at `6`, so it covers indices `5` and `6`

#### Debugging Tip

Write down the exact indices touched by an update and a prefix query. If the index jumps look wrong, the lowbit logic is wrong.

#### Advanced Note

Fenwick trees usually win on simplicity and constants for sums. Segment trees win on flexibility.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Range Sum Query with Point Updates
#### Problem Statement

Design a structure over an integer array that supports:
- updating one index to a new value
- querying the sum of any inclusive range `[left, right]`

#### Why This Example Matters

This is the basic segment tree use case. It covers build, query, and point update in one clean problem.

#### Constraints or Assumptions

- the array size can be large
- there can be many mixed updates and queries
- sums may exceed `int`, so `long` is safer

#### Brute-Force Approach

Use a plain array.
- point update is easy: write the new value in $O(1)$
- range sum query scans from `left` to `right` in $O(right - left + 1)$

This is acceptable when queries are few or ranges are tiny.

#### Better Approach

Use a segment tree where each node stores the sum of its interval.

#### Why the Better Approach Works

A range query visits only the branches that overlap the requested interval. A point update changes one leaf and recomputes only the ancestors on that root-to-leaf path.

#### Pragmatic Java Choice

Use:
- an array-backed segment tree
- inclusive interval bounds
- a copied `values[]` array to compute update deltas safely

#### Java Solution

```java
import java.util.Arrays;

class SegmentTreeRangeSumExample {
    static final class SegmentTree {
        private final int size;
        private final long[] tree;
        private final int[] values;

        SegmentTree(int[] numbers) {
            this.size = numbers.length;
            this.tree = new long[Math.max(1, 4 * size)];
            this.values = Arrays.copyOf(numbers, numbers.length);
            if (size > 0) {
                build(1, 0, size - 1);
            }
        }

        private void build(int node, int left, int right) {
            if (left == right) {
                tree[node] = values[left];
                return;
            }

            int mid = left + (right - left) / 2;
            build(node * 2, left, mid);
            build(node * 2 + 1, mid + 1, right);
            tree[node] = tree[node * 2] + tree[node * 2 + 1];
        }

        long sumRange(int queryLeft, int queryRight) {
            if (size == 0 || queryLeft > queryRight) {
                return 0;
            }
            return sumRange(1, 0, size - 1, queryLeft, queryRight);
        }

        private long sumRange(int node, int left, int right, int queryLeft, int queryRight) {
            if (queryRight < left || right < queryLeft) {
                return 0;
            }
            if (queryLeft <= left && right <= queryRight) {
                return tree[node];
            }

            int mid = left + (right - left) / 2;
            return sumRange(node * 2, left, mid, queryLeft, queryRight)
                    + sumRange(node * 2 + 1, mid + 1, right, queryLeft, queryRight);
        }

        void update(int index, int newValue) {
            if (size == 0) {
                return;
            }
            long delta = newValue - values[index];
            values[index] = newValue;
            update(1, 0, size - 1, index, delta);
        }

        private void update(int node, int left, int right, int index, long delta) {
            if (index < left || index > right) {
                return;
            }

            tree[node] += delta;
            if (left == right) {
                return;
            }

            int mid = left + (right - left) / 2;
            update(node * 2, left, mid, index, delta);
            update(node * 2 + 1, mid + 1, right, index, delta);
        }
    }
}
```

#### Dry Run

Array: `[2, 4, 1, 7, 3]`

Query `sumRange(1, 3)`:
- total scan would compute `4 + 1 + 7`
- the segment tree visits only overlapping nodes
- answer is `12`

Update `index 2` to `6`:
- old value was `1`, so `delta = 5`
- update the leaf for index `2`
- add `5` to each ancestor on the path to the root

Now `sumRange(1, 3)` becomes `4 + 6 + 7 = 17`.

#### Time and Space Complexity

- brute force: update $O(1)$, query $O(n)$ in the worst case
- segment tree: build $O(n)$, update $O(\log n)$, query $O(\log n)$
- extra space: $O(n)$

#### Edge Cases

- empty array
- single-element range
- updating the same index many times
- large sums that overflow `int`

#### Common Mistakes

- forgetting that the query is inclusive
- returning the wrong neutral value on no-overlap
- recomputing with stale original values during updates

### Worked Example 2: Range Add Updates with Range Sum Queries
#### Problem Statement

Design a structure that supports:
- adding `delta` to every element in `[left, right]`
- querying the sum of any inclusive range `[left, right]`

#### Why This Example Matters

This is the point where plain segment trees become insufficiently efficient for repeated range updates. Lazy propagation is the key new idea.

#### Constraints or Assumptions

- many updates and queries are interleaved
- values may become large, so use `long`
- intervals are inclusive

#### Brute-Force Approach

Use a plain array.
- for update `[left, right]`, loop through every affected index and add `delta`
- for query `[left, right]`, loop through the same interval and sum values

This can become $O(n)$ for both update and query.

#### Better Approach

Use a segment tree with lazy propagation.

#### Why the Better Approach Works

A fully covered segment can be updated in one step:
- change the node's sum immediately
- store a pending lazy value for children
- delay the child work until a later partial query or update actually needs those children

#### Pragmatic Java Choice

Use:
- `tree[]` for interval sums
- `lazy[]` for pending increments
- helper methods `apply` and `pushDown` to keep the logic local and readable

#### Java Solution

```java
class LazyPropagationRangeSumExample {
    static final class LazySegmentTree {
        private final int size;
        private final long[] tree;
        private final long[] lazy;

        LazySegmentTree(int[] numbers) {
            this.size = numbers.length;
            this.tree = new long[Math.max(1, 4 * size)];
            this.lazy = new long[Math.max(1, 4 * size)];
            if (size > 0) {
                build(1, 0, size - 1, numbers);
            }
        }

        private void build(int node, int left, int right, int[] numbers) {
            if (left == right) {
                tree[node] = numbers[left];
                return;
            }

            int mid = left + (right - left) / 2;
            build(node * 2, left, mid, numbers);
            build(node * 2 + 1, mid + 1, right, numbers);
            tree[node] = tree[node * 2] + tree[node * 2 + 1];
        }

        void rangeAdd(int updateLeft, int updateRight, long delta) {
            if (size == 0 || updateLeft > updateRight) {
                return;
            }
            rangeAdd(1, 0, size - 1, updateLeft, updateRight, delta);
        }

        private void rangeAdd(int node, int left, int right, int updateLeft, int updateRight, long delta) {
            if (updateRight < left || right < updateLeft) {
                return;
            }
            if (updateLeft <= left && right <= updateRight) {
                apply(node, left, right, delta);
                return;
            }

            pushDown(node, left, right);
            int mid = left + (right - left) / 2;
            rangeAdd(node * 2, left, mid, updateLeft, updateRight, delta);
            rangeAdd(node * 2 + 1, mid + 1, right, updateLeft, updateRight, delta);
            tree[node] = tree[node * 2] + tree[node * 2 + 1];
        }

        long rangeSum(int queryLeft, int queryRight) {
            if (size == 0 || queryLeft > queryRight) {
                return 0;
            }
            return rangeSum(1, 0, size - 1, queryLeft, queryRight);
        }

        private long rangeSum(int node, int left, int right, int queryLeft, int queryRight) {
            if (queryRight < left || right < queryLeft) {
                return 0;
            }
            if (queryLeft <= left && right <= queryRight) {
                return tree[node];
            }

            pushDown(node, left, right);
            int mid = left + (right - left) / 2;
            return rangeSum(node * 2, left, mid, queryLeft, queryRight)
                    + rangeSum(node * 2 + 1, mid + 1, right, queryLeft, queryRight);
        }

        private void apply(int node, int left, int right, long delta) {
            tree[node] += delta * (right - left + 1L);
            lazy[node] += delta;
        }

        private void pushDown(int node, int left, int right) {
            if (lazy[node] == 0 || left == right) {
                return;
            }

            int mid = left + (right - left) / 2;
            apply(node * 2, left, mid, lazy[node]);
            apply(node * 2 + 1, mid + 1, right, lazy[node]);
            lazy[node] = 0;
        }
    }
}
```

#### Dry Run

Array: `[5, 2, 1, 4, 3]`

Update `rangeAdd(1, 3, 2)`:
- brute force would change the array to `[5, 4, 3, 6, 3]`
- lazy propagation updates covered segments and stores pending tags instead of touching every descendant immediately

Query `rangeSum(2, 4)`:
- the answer should be `3 + 6 + 3 = 12`
- if the query reaches a node with a pending tag, that tag is pushed before exploring children

#### Time and Space Complexity

- brute force: update $O(n)$, query $O(n)$ in the worst case
- lazy segment tree: update $O(\log n)$, query $O(\log n)$
- extra space: $O(n)$

#### Edge Cases

- update range of length one
- update the full array
- many overlapping updates before a query
- negative `delta`

#### Common Mistakes

- forgetting `segmentLength` in sum updates
- not pushing lazy values before partial recursion
- assuming the parent sum stays correct after child recursion without recomputing it

### Worked Example 3: Dynamic Prefix and Range Sums with a Fenwick Tree
#### Problem Statement

Design a structure that supports:
- setting one index to a new value
- returning prefix sums and arbitrary range sums

#### Why This Example Matters

A Fenwick tree is often the simplest correct answer when the operation is sum-like and the updates are point updates.

#### Constraints or Assumptions

- range sum can be reduced to prefix sums
- point updates are frequent
- the tree is internally 1-indexed

#### Brute-Force Approach

Two common baselines exist:
- use a plain array and scan for every prefix or range sum
- use prefix sums and rebuild them after each update

Both are simple, but the second one still makes updates expensive.

#### Better Approach

Use a Fenwick tree.

#### Why the Better Approach Works

Each Fenwick tree cell stores the sum of a carefully chosen suffix of a prefix. That lets updates and prefix queries jump across blocks instead of touching every element.

#### Pragmatic Java Choice

Use:
- a public 0-indexed API
- an internal 1-indexed `tree[]`
- a `values[]` array so "set index to newValue" can be translated into an added delta

#### Java Solution

```java
class FenwickTreeRangeSumExample {
    static final class FenwickTree {
        private final long[] tree;
        private final long[] values;

        FenwickTree(int[] numbers) {
            this.tree = new long[numbers.length + 1];
            this.values = new long[numbers.length];
            for (int index = 0; index < numbers.length; index++) {
                set(index, numbers[index]);
            }
        }

        void set(int index, long newValue) {
            long delta = newValue - values[index];
            values[index] = newValue;
            addDelta(index, delta);
        }

        long prefixSum(int index) {
            long sum = 0;
            int oneBasedIndex = index + 1;
            while (oneBasedIndex > 0) {
                sum += tree[oneBasedIndex];
                oneBasedIndex -= oneBasedIndex & -oneBasedIndex;
            }
            return sum;
        }

        long rangeSum(int left, int right) {
            if (left > right) {
                return 0;
            }
            return prefixSum(right) - (left == 0 ? 0 : prefixSum(left - 1));
        }

        private void addDelta(int index, long delta) {
            int oneBasedIndex = index + 1;
            while (oneBasedIndex < tree.length) {
                tree[oneBasedIndex] += delta;
                oneBasedIndex += oneBasedIndex & -oneBasedIndex;
            }
        }
    }
}
```

#### Dry Run

Array: `[3, 1, 4, 1, 5]`

Build:
- `set(0, 3)` touches internal indices `1, 2, 4`
- `set(2, 4)` touches internal indices `3, 4`
- each update adds its delta to the responsible blocks

Query `rangeSum(1, 3)`:
- compute `prefixSum(3) - prefixSum(0)`
- result is `1 + 4 + 1 = 6`

Update `set(2, 6)`:
- old value at index `2` is `4`
- delta is `2`
- add `2` to the internal blocks that cover index `2`

#### Time and Space Complexity

- brute force array scan: update $O(1)$, query $O(n)$
- rebuilt prefix sums: update $O(n)$, query $O(1)$
- Fenwick tree: update $O(\log n)$, prefix sum $O(\log n)$, range sum $O(\log n)$
- extra space: $O(n)$

#### Edge Cases

- querying a range of length one
- querying from index `0`
- setting a value to the same number
- negative values

#### Common Mistakes

- forgetting the internal 1-index shift
- using `newValue` directly instead of the delta
- expecting a basic Fenwick tree to answer minimum queries or arbitrary lazy range updates

## 4. Complexity and Decision Guide

Main trade-offs in this chapter:
- plain scan: simplest code, but repeated range queries are expensive
- prefix sums: excellent for static arrays, weak for frequent updates
- segment tree: flexible and supports many aggregates with $O(\log n)$ queries and updates
- lazy segment tree: the right choice when full interval updates must also stay fast
- Fenwick tree: compact and practical for prefix sums, range sums, and frequency counting

Choose brute force when:
- the array is small
- there are very few operations
- implementation time matters more than asymptotic performance

Choose prefix sums when:
- the array is static
- the query is sum-like
- updates do not happen after preprocessing

Choose a Fenwick tree when:
- you need point updates and prefix or range sums
- you want simpler code and lower constants
- the operation naturally reduces to prefix sums

Choose a segment tree when:
- you need min, max, gcd, or another associative aggregate
- you need more flexible query shapes
- range updates are part of the problem

Choose lazy propagation when:
- many updates touch full intervals
- pushing every update to leaves would be too expensive

Recognition signals:
- many queries over subarrays
- many updates mixed with queries
- constraints where $O(n)$ per operation is too slow

Signals not to force this technique:
- only one or two queries exist
- the array never changes and prefix sums are enough
- the real problem is not about intervals at all

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- off-by-one errors in inclusive ranges
- wrong no-overlap or full-overlap conditions
- stale values during point updates
- forgetting to multiply lazy updates by interval length for sums
- mixing 0-indexed public inputs with 1-indexed Fenwick internals

Boundary risks:
- empty arrays
- single-element segments
- negative updates
- integer overflow on large sums

Mutation risks:
- not recomputing parent values after child updates
- pushing lazy tags only in one code path but not another
- setting a Fenwick value without converting to delta first

Short debugging checklist:
- Does every tree node really represent the interval you think it does?
- For a no-overlap query, are you returning the correct neutral value?
- After a point update, are all ancestors updated?
- Before descending in a lazy tree, are pending tags pushed?
- In a Fenwick tree, which internal indices should a given update touch?
- Are you using `long` where sums can grow large?

## 6. Practice Problems

### Easy

- Title: Range Sum Query - Immutable. One-line prompt: answer many range sum queries on a fixed array. Expected pattern or core idea: prefix sums as the static baseline before dynamic structures.
- Title: Range Sum Query - Mutable. One-line prompt: support point updates and range sum queries. Expected pattern or core idea: segment tree or Fenwick tree.
- Title: Prefix Frequency Tracker. One-line prompt: maintain counts of values and answer prefix-frequency totals after updates. Expected pattern or core idea: Fenwick tree over frequencies.

### Medium

- Title: Range Addition. One-line prompt: apply many interval increments and inspect final values or sums. Expected pattern or core idea: difference array baseline, then lazy propagation when updates and queries interleave.
- Title: Count of Smaller Numbers After Self. One-line prompt: for each element, count how many smaller values appear to its right. Expected pattern or core idea: Fenwick tree with coordinate compression.
- Title: Dynamic Booking Load. One-line prompt: support interval additions and query the total load on a range. Expected pattern or core idea: lazy segment tree.

### Hard

- Title: Falling Squares. One-line prompt: place interval-based blocks and track the maximum height after each insertion. Expected pattern or core idea: segment tree with coordinate compression.
- Title: Reverse Pairs. One-line prompt: count pairs satisfying an inequality across positions in the array. Expected pattern or core idea: Fenwick tree or segment tree with compressed values.
- Title: Interval Maximum with Massive Coordinates. One-line prompt: process many interval updates and maximum queries over sparse coordinates. Expected pattern or core idea: segment tree plus coordinate compression.

## 7. Short Recap

The core idea of this chapter is that range-query structures store partial answers so you do not recompute whole intervals from scratch.

The most important optimization insight is that the right structure depends on the update pattern:
- static array: prefix sums
- point updates plus sums: Fenwick tree or segment tree
- range updates plus queries: lazy segment tree

The most important implementation warning is that interval boundaries and update propagation must stay consistent, especially with lazy tags and Fenwick indexing.

This chapter prepares the next chapter by shifting from interval relationships inside arrays to relationship modeling between nodes in graphs.

## 8. Coverage Check

- [x] 21.1 Why range-query structures matter
- [x] 21.2 Segment tree build and query
- [x] 21.3 Point updates and range updates
- [x] 21.4 Lazy propagation
- [x] 21.5 Fenwick tree basics
- [x] 21.6 Segment tree vs binary indexed tree

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 22: Graph Foundations
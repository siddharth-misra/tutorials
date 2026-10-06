# 35: Advanced Range and Query Techniques

**Goal:** Teach how to answer many range queries efficiently by choosing the right preprocessing, decomposition, or offline strategy.
**Outcome:** By the end of this chapter, you can use sparse tables for static idempotent queries, square root decomposition for balanced update-query trade-offs, Mo's algorithm for offline range processing, and constraint-driven reasoning to choose the right structure.

---

## 1. Intuition First

This chapter matters because many problems are not hard because a single query is hard. They are hard because there are many queries. A naive `O(n)` answer per query becomes too slow when the query count is large.

A simple real-world analogy is a teacher answering repeated questions about the same textbook. If students keep asking for summaries of different page ranges, the teacher should build notes once instead of rereading the full book every time.

The core mental model is:

- look at the data mutation pattern: static, point updates, or heavy query reordering
- look at the query type: min, max, sum, xor, distinct count, and so on
- pick preprocessing that matches the constraints instead of defaulting to one structure

The most common beginner confusion point is treating all range-query problems as segment-tree problems. Segment trees are flexible, but they are not always the simplest or fastest choice for the actual constraints.

This chapter begins Part VII by focusing on advanced trade-offs. The next chapters continue that theme for trees, graphs, strings, and interview problem solving.

## 2. Core Concepts and Techniques

### Concept Cluster: Static Queries and Block Decomposition
Key concepts in this block:
- 35.1 Sparse table
- 35.2 Square root decomposition

#### Intuition

Sparse tables are for static arrays where the query operation can combine overlapping blocks safely. Square root decomposition splits the array into blocks to balance preprocessing and query/update time.

#### Why It Matters

These two techniques teach an important habit: match the query tool to the mutation pattern.

#### How It Works

Sparse table:

- preprocess answers for ranges of length `2^k`
- answer range minimum or maximum in `O(1)` using two overlapping blocks

Square root decomposition:

- split the array into blocks of size about `sqrt(n)`
- store one summary per block
- queries scan partial edge blocks and use summaries for full blocks

#### Java Implementation Notes

- Precompute `log2` values for sparse-table query lengths.
- Keep block size as an integer near `sqrt(n)`.
- Sparse tables are best for idempotent operations such as min or max, not general sum with overlapping blocks.

#### Common Mistakes

- using sparse table for operations where overlapping blocks double-count, such as sum
- picking block sizes inconsistently across build and query logic
- forgetting to rebuild or adjust the block summary after a point update

#### Quick Example

For RMQ on `[5, 2, 7, 1, 3]`, a sparse table can answer min over `[1, 4]` by combining two length-`2` blocks that cover the interval.

#### Debugging Tip

For square root decomposition, print block boundaries and block summaries. Many bugs are just wrong block indexing.

#### Advanced Note

Sparse tables trade update support for very fast queries. That trade is excellent when the array is static and the query count is large.

### Concept Cluster: Offline Reordering for Faster Queries
Key concepts in this block:
- 35.3 Mo's algorithm
- 35.4 Offline query processing

#### Intuition

If queries do not need to be answered in their original order, you can sort them to reduce repeated work.

#### Why It Matters

Offline processing often turns an otherwise slow repeated-query problem into something practical.

#### How It Works

Mo's algorithm:

- sort range queries by left block and then by right endpoint
- maintain a sliding current range
- add and remove elements as the query window moves

General offline query processing:

- sort queries or events by some key such as right endpoint, threshold, or time
- process data and queries together in that sorted order

#### Java Implementation Notes

- Keep add and remove operations constant time if possible.
- Store each query's original index so answers can be restored in user order.
- For threshold-style offline processing, Fenwick trees and sorting often combine well.

#### Common Mistakes

- forgetting that Mo's algorithm only helps when add/remove operations are cheap
- losing the original query order
- sorting offline queries by the wrong key and breaking the invariant

#### Quick Example

If many queries ask for the number of distinct values in subarrays, Mo's algorithm avoids rebuilding a fresh frequency map from scratch for each query.

#### Debugging Tip

Log current left, current right, and the maintained summary while processing a tiny set of sorted queries.

#### Advanced Note

Offline processing is a broad idea. Mo's algorithm is one specific offline strategy for range queries.

### Concept Cluster: Structure Choice by Constraints
Key concepts in this block:
- 35.5 Choosing the right query structure by constraints

#### Intuition

The best data structure depends on whether the array changes, how many queries exist, and what each query asks for.

#### Why It Matters

Expert-level range-query problem solving is often a structure-selection problem before it is a coding problem.

#### How It Works

Ask:

- is the data static or dynamic
- is the operation idempotent, associative, or something more complex
- are queries online or can they be reordered offline
- do we need point updates, range updates, or no updates

#### Java Implementation Notes

- Choose the simplest structure that meets the constraints.
- Static RMQ often favors sparse table.
- Moderate point updates plus range sums may favor Fenwick tree or sqrt decomposition.
- Complex dynamic queries often favor segment trees.

#### Common Mistakes

- choosing the most flexible tool instead of the most appropriate one
- ignoring preprocessing cost when query count is small
- overlooking that offline solutions are allowed

#### Quick Example

Ten million RMQ queries on a static array strongly favor sparse table over a dynamic structure.

#### Debugging Tip

Before coding, write expected `build`, `query`, and `update` costs. If they do not fit the constraints, change the structure.

#### Advanced Note

Many hard problems are won by recognizing that the query type is static or offline, which collapses the needed complexity.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Range Minimum Query with Sparse Table
#### Problem Statement

Given a static integer array and many range minimum queries, return the minimum value in each queried interval.

#### Why This Example Matters

This is the standard sparse-table use case and the cleanest example of preprocess-heavy, query-light cost shifting.

#### Constraints or Assumptions

- the array does not change after preprocessing
- many queries are expected
- the operation is minimum, which is idempotent

#### Brute-Force Approach

For each query `[left, right]`, scan the interval and keep the minimum.

That costs `O(length)` per query.

#### Better Approach

Preprocess a sparse table for powers of two.

#### Why the Better Approach Works

Any interval length can be covered by two overlapping power-of-two blocks. For minimum, overlapping coverage is safe because taking the minimum twice does not distort the answer.

#### Pragmatic Java Choice

Use a `table[level][index]` layout and a precomputed log array.

#### Java Solution

```java
class SparseTableRmExample {
    static final class SparseTable {
        private final int[][] table;
        private final int[] log2;

        SparseTable(int[] values) {
            int n = values.length;
            log2 = new int[n + 1];
            for (int length = 2; length <= n; length++) {
                log2[length] = log2[length / 2] + 1;
            }

            int levels = log2[n] + 1;
            table = new int[levels][n];
            System.arraycopy(values, 0, table[0], 0, n);

            for (int level = 1; level < levels; level++) {
                int blockLength = 1 << level;
                int half = blockLength >> 1;
                for (int index = 0; index + blockLength <= n; index++) {
                    table[level][index] = Math.min(table[level - 1][index], table[level - 1][index + half]);
                }
            }
        }

        int rangeMin(int left, int right) {
            int length = right - left + 1;
            int level = log2[length];
            int blockLength = 1 << level;
            return Math.min(table[level][left], table[level][right - blockLength + 1]);
        }
    }
}
```

#### Dry Run

Array: `[5, 2, 7, 1, 3]`, query `[1, 4]`

- query length is `4`
- largest power of two not exceeding `4` is `4`
- compare the precomputed block starting at `1` with the block ending at `4`
- both blocks cover the interval, and the answer is `1`

#### Time and Space Complexity

Brute-force per query:

- Time: `O(n)` in the worst case per query
- Space: `O(1)`

Sparse table:

- Build Time: `O(n log n)`
- Query Time: `O(1)`
- Space: `O(n log n)`

#### Edge Cases

- one-element query
- duplicate minimum values
- full-array query

#### Common Mistakes

- using sparse table for non-idempotent queries like sum
- off-by-one errors in query length
- wrong second block start in the query method

### Worked Example 2: Range Sum with Square Root Decomposition
#### Problem Statement

Given an integer array, support point updates and range sum queries.

#### Why This Example Matters

This example shows a middle ground between full segment trees and full brute force.

#### Constraints or Assumptions

- point updates occur, but not too aggressively
- range sum queries are common
- clarity is preferred over the most flexible possible structure

#### Brute-Force Approach

- update the array directly in `O(1)`
- answer each query by scanning the interval in `O(n)`

That becomes slow when queries are frequent.

#### Better Approach

Split the array into blocks and store each block's sum.

#### Why the Better Approach Works

Full blocks contribute instantly from precomputed sums, and only the partial edge blocks need element-by-element scanning.

#### Pragmatic Java Choice

Use block size near `sqrt(n)` and separate block sums from raw values.

#### Java Solution

```java
class SqrtDecompositionSumExample {
    static final class SqrtDecomposition {
        private final int[] values;
        private final int[] blockSums;
        private final int blockSize;

        SqrtDecomposition(int[] input) {
            values = input.clone();
            blockSize = (int) Math.ceil(Math.sqrt(values.length));
            blockSums = new int[(values.length + blockSize - 1) / blockSize];

            for (int index = 0; index < values.length; index++) {
                blockSums[index / blockSize] += values[index];
            }
        }

        void update(int index, int newValue) {
            int block = index / blockSize;
            blockSums[block] += newValue - values[index];
            values[index] = newValue;
        }

        int rangeSum(int left, int right) {
            int sum = 0;
            int current = left;

            while (current <= right && current % blockSize != 0) {
                sum += values[current++];
            }

            while (current + blockSize - 1 <= right) {
                sum += blockSums[current / blockSize];
                current += blockSize;
            }

            while (current <= right) {
                sum += values[current++];
            }

            return sum;
        }
    }
}
```

#### Dry Run

Array: `[4, 1, 7, 3, 2, 6, 5, 8, 9]`

- with block size `3`, block sums are `[12, 11, 22]`
- query `[2, 7]` uses part of block `0`, full block `1`, and part of block `2`
- update index `4` from `2` to `10` adjusts its block sum by `+8`

#### Time and Space Complexity

Brute-force approach:

- Update Time: `O(1)`
- Query Time: `O(n)`
- Space: `O(1)` extra

Square root decomposition:

- Build Time: `O(n)`
- Update Time: `O(1)`
- Query Time: `O(sqrt(n))`
- Space: `O(sqrt(n))`

#### Edge Cases

- updates at the first or last index
- queries inside one block only
- array length not divisible by block size

#### Common Mistakes

- block size mismatch between build and query logic
- not updating the block summary after a point change
- scanning past the query boundary in the middle loop

### Worked Example 3: Distinct Values in Range with Mo's Algorithm
#### Problem Statement

Given an array and many range queries `[left, right]`, return the number of distinct values in each range.

#### Why This Example Matters

This is the classic Mo's algorithm problem. It shows how query reordering reduces repeated work.

#### Constraints or Assumptions

- the array is static
- all queries are known in advance
- values are within a manageable range for frequency counting or can be coordinate-compressed first

#### Brute-Force Approach

For each query, scan the interval and build a fresh set of seen values.

That costs `O(length)` per query and repeats a lot of work.

#### Better Approach

Sort the queries with Mo's ordering and maintain one moving window.

#### Why the Better Approach Works

Adjacent sorted queries often differ by only a few elements, so add and remove operations can update the answer incrementally.

#### Pragmatic Java Choice

Use an inner `Query` class, store original indices, and keep a frequency array.

#### Java Solution

```java
import java.util.Arrays;

class MosAlgorithmExample {
    static final class Query {
        final int left;
        final int right;
        final int index;

        Query(int left, int right, int index) {
            this.left = left;
            this.right = right;
            this.index = index;
        }
    }

    static int[] distinctCounts(int[] values, Query[] queries, int maxValue) {
        int blockSize = Math.max(1, (int) Math.sqrt(values.length));
        Arrays.sort(queries, (first, second) -> {
            int firstBlock = first.left / blockSize;
            int secondBlock = second.left / blockSize;
            if (firstBlock != secondBlock) {
                return Integer.compare(firstBlock, secondBlock);
            }
            return Integer.compare(first.right, second.right);
        });

        int[] frequency = new int[maxValue + 1];
        int[] answers = new int[queries.length];
        int currentLeft = 0;
        int currentRight = -1;
        int distinct = 0;

        for (Query query : queries) {
            while (currentLeft > query.left) {
                currentLeft--;
                if (frequency[values[currentLeft]]++ == 0) {
                    distinct++;
                }
            }
            while (currentRight < query.right) {
                currentRight++;
                if (frequency[values[currentRight]]++ == 0) {
                    distinct++;
                }
            }
            while (currentLeft < query.left) {
                if (--frequency[values[currentLeft]] == 0) {
                    distinct--;
                }
                currentLeft++;
            }
            while (currentRight > query.right) {
                if (--frequency[values[currentRight]] == 0) {
                    distinct--;
                }
                currentRight--;
            }
            answers[query.index] = distinct;
        }

        return answers;
    }
}
```

#### Dry Run

Array: `[1, 2, 1, 3, 2]`

Queries:

- `[0, 2]`
- `[1, 4]`

Mo's ordering keeps a current window. When moving from `[0, 2]` to `[1, 4]`:

- remove index `0`
- add indices `3` and `4`
- update frequencies and distinct count incrementally

Answers become:

- `[0, 2] -> 2`
- `[1, 4] -> 3`

#### Time and Space Complexity

Brute-force per query:

- Time: `O(n)` per query in the worst case
- Space: up to `O(n)` temporary set space per query

Mo's algorithm:

- Time: about `O((n + q) * sqrt(n))` add/remove work, depending on implementation details
- Space: `O(valueRange + q)`

#### Edge Cases

- queries of length `1`
- all values equal
- all values distinct

#### Common Mistakes

- forgetting to store original query indices
- using expensive add/remove operations, which cancels Mo's benefit
- not compressing large values before frequency counting

### Worked Example 4: Offline Count of Values Greater Than `k`
#### Problem Statement

Given an array and many queries `(left, right, k)`, return how many values in each interval are greater than `k`.

#### Why This Example Matters

This example shows offline query processing outside Mo's algorithm. The query key is the threshold `k`, not just the interval.

#### Constraints or Assumptions

- all queries are known beforehand
- array indices are zero-based in the explanation
- Fenwick tree support is allowed

#### Brute-Force Approach

For each query, scan the interval and count values greater than `k`.

That costs `O(length)` per query.

#### Better Approach

Sort array values and queries in descending order of threshold, activating indices whose values are already greater than the current query's `k`.

#### Why the Better Approach Works

Once all positions with `value > k` are marked in a Fenwick tree, each query answer becomes a range-sum query over active indices.

#### Pragmatic Java Choice

Use an events-style offline sweep with a Fenwick tree.

#### Java Solution

```java
import java.util.Arrays;

class OfflineGreaterThanQueryExample {
    static final class Entry {
        final int value;
        final int index;

        Entry(int value, int index) {
            this.value = value;
            this.index = index;
        }
    }

    static final class Query {
        final int left;
        final int right;
        final int threshold;
        final int index;

        Query(int left, int right, int threshold, int index) {
            this.left = left;
            this.right = right;
            this.threshold = threshold;
            this.index = index;
        }
    }

    static final class FenwickTree {
        private final int[] tree;

        FenwickTree(int size) {
            tree = new int[size + 1];
        }

        void add(int index, int delta) {
            for (int i = index + 1; i < tree.length; i += i & -i) {
                tree[i] += delta;
            }
        }

        int prefixSum(int index) {
            int sum = 0;
            for (int i = index + 1; i > 0; i -= i & -i) {
                sum += tree[i];
            }
            return sum;
        }

        int rangeSum(int left, int right) {
            if (left > right) {
                return 0;
            }
            return prefixSum(right) - (left == 0 ? 0 : prefixSum(left - 1));
        }
    }

    static int[] countGreaterThanK(int[] values, Query[] queries) {
        Entry[] entries = new Entry[values.length];
        for (int i = 0; i < values.length; i++) {
            entries[i] = new Entry(values[i], i);
        }

        Arrays.sort(entries, (first, second) -> Integer.compare(second.value, first.value));
        Arrays.sort(queries, (first, second) -> Integer.compare(second.threshold, first.threshold));

        FenwickTree fenwickTree = new FenwickTree(values.length);
        int[] answers = new int[queries.length];
        int entryIndex = 0;

        for (Query query : queries) {
            while (entryIndex < entries.length && entries[entryIndex].value > query.threshold) {
                fenwickTree.add(entries[entryIndex].index, 1);
                entryIndex++;
            }
            answers[query.index] = fenwickTree.rangeSum(query.left, query.right);
        }

        return answers;
    }
}
```

#### Dry Run

Array: `[5, 1, 7, 3, 6]`

Query: `(1, 4, 4)`

- activate all values greater than `4`: indices with `5`, `7`, and `6`
- the Fenwick tree marks those active positions
- range sum over `[1, 4]` counts indices `2` and `4`

Answer: `2`

#### Time and Space Complexity

Brute-force per query:

- Time: `O(n)` per query in the worst case
- Space: `O(1)`

Offline sweep with Fenwick tree:

- Sorting Time: `O((n + q) log(n + q))`
- Processing Time: `O((n + q) log n)`
- Space: `O(n + q)`

#### Edge Cases

- no values greater than `k`
- all values greater than `k`
- interval of length `1`

#### Common Mistakes

- sorting thresholds in the wrong direction
- forgetting to restore original query order
- mixing zero-based array indices with one-based Fenwick tree internals

## 4. Complexity and Decision Guide

The main trade-off in this chapter is where the work happens.

- sparse table pays `O(n log n)` up front to get `O(1)` static RMQ queries
- square root decomposition pays small build cost and gives balanced `O(sqrt(n))` queries with simple point updates
- Mo's algorithm avoids rebuilding query state and works well when add/remove operations are cheap and queries are offline
- general offline sweeps combine sorting with a structure such as Fenwick tree when the query key includes thresholds or event order

When to choose brute force:

- very small query count
- very short intervals
- when preprocessing cost would dominate the total work

When to optimize:

- query count is large relative to array size
- the data is static, making preprocess-heavy tools attractive
- queries can be reordered without changing correctness

Recognition signals for each technique:

- sparse table: static array plus idempotent range queries like min or max
- square root decomposition: moderate updates and queries with simple summaries
- Mo's algorithm: offline range queries where one movable window can maintain the answer
- offline sweep: queries include an orderable threshold, endpoint, or time dimension

Signals not to force these techniques:

- frequent complex range updates that need lazy propagation instead
- online queries that must be answered in arrival order when the chosen method depends on reordering
- expensive add/remove logic that makes Mo's algorithm too slow in practice

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- off-by-one errors in interval boundaries
- wrong block numbering in sqrt decomposition or Mo's ordering
- using overlapping sparse-table blocks for an operation that is not idempotent
- losing original query order in offline methods
- forgetting coordinate compression when values are too large for direct frequency arrays

Mutation and consistency risks:

- block summaries not updated after point changes
- Fenwick tree using one-based indexing internally while callers use zero-based indices
- comparing thresholds with the wrong strictness in offline sweeps

Short debugging checklist:

- write the expected build, update, and query complexities before coding
- test single-element intervals first
- test intervals that begin or end exactly on block boundaries
- log query ordering for offline methods
- confirm answer restoration into original query order

## 6. Practice Problems

### Easy

**Title:** Static Range Minimum Query  
**Prompt:** Answer many minimum queries on an unchanging array.  
**Expected pattern or core idea:** Sparse table for idempotent static queries.

**Title:** Range Sum with Point Updates  
**Prompt:** Support updates and sum queries on an array of manageable size.  
**Expected pattern or core idea:** Square root decomposition or Fenwick tree trade-off.

**Title:** Prefix XOR Query Variant  
**Prompt:** Answer many static xor queries quickly.  
**Expected pattern or core idea:** Recognize when prefix preprocessing beats heavier structures.

### Medium

**Title:** Distinct Values in Range  
**Prompt:** Return the number of distinct values for many offline interval queries.  
**Expected pattern or core idea:** Mo's algorithm with add/remove frequency maintenance.

**Title:** Count Values Greater Than `k`  
**Prompt:** Answer interval queries with a threshold condition.  
**Expected pattern or core idea:** Offline sweep plus Fenwick tree.

**Title:** Static GCD Range Queries  
**Prompt:** Answer many GCD queries on a fixed array.  
**Expected pattern or core idea:** Constraint-driven selection of a static query structure.

### Hard

**Title:** Powerful Array  
**Prompt:** Maintain a custom frequency-based score over many offline subarray queries.  
**Expected pattern or core idea:** Mo's algorithm with nontrivial add/remove updates.

**Title:** K-th Number in a Range Offline Variant  
**Prompt:** Answer order-statistic queries over intervals with offline processing.  
**Expected pattern or core idea:** Query reordering and auxiliary data structures.

**Title:** Dynamic Range Mode Approximation Discussion  
**Prompt:** Explore why some query types are much harder than sum or minimum.  
**Expected pattern or core idea:** Choosing structures by operation complexity, not habit.

## 7. Short Recap

The core idea is that range-query performance depends on whether data is static, partially dynamic, or fully offline. The most important optimization insight is to shift work into preprocessing or query reordering when constraints allow it. The most important implementation warning is to keep interval boundaries, block boundaries, and original query order consistent. This prepares the next chapter, where tree-specific advanced query techniques become the main focus.

## 8. Coverage Check

- 35.1 Sparse table - Covered
- 35.2 Square root decomposition - Covered
- 35.3 Mo's algorithm - Covered
- 35.4 Offline query processing - Covered
- 35.5 Choosing the right query structure by constraints - Covered

Coverage Summary: 5/5 official subtopics covered

Next: Advanced Trees
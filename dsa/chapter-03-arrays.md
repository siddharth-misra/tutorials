# 3: Arrays

**Goal:** Build strong array problem-solving habits by teaching traversal, indexing, updates, lookup choices, rotation patterns, prefix sums, and Kadane's algorithm in a way that stays beginner-friendly but interview-relevant.
**Outcome:** By the end of this chapter, you can scan arrays safely, insert and delete with shifting, choose a lookup strategy based on constraints, solve common rotation and rearrangement tasks, use prefix sums for repeated range queries, and compute the maximum subarray sum with Kadane's algorithm.

---

## 1. Intuition First

An array is a row of numbered boxes. Each box has a fixed position, and that position matters as much as the value inside it. Most beginner DSA problems start here because arrays are simple to store, fast to access by index, and rich enough to express many patterns.

A simple real-world analogy is seats in a theater. Every seat has a number. You can jump directly to seat 25 if you know the index, but if you want to insert a new seat in the middle, every seat after it must shift. That is the core trade-off of arrays: indexed access is easy, but structural changes in the middle are expensive.

The core mental model is that arrays reward sequential thinking. You usually solve array problems by deciding:
- how to traverse the positions
- what state to carry while traversing
- whether you should store extra summary information
- whether the array should be modified in place or left unchanged

The most common beginner confusion point is mixing up values and indexes. Many bugs come from reading the right value from the wrong position, or from updating an index boundary incorrectly.

In the larger roadmap, arrays are the first real pattern laboratory. Prefix sums, rearrangement, and Kadane's algorithm all teach you how to reuse earlier work instead of recomputing it.

## 2. Core Concepts and Techniques

### Concept Cluster: Traversal, Indexing, and Lookup
Key concepts in this block:
- 3.1 Traversal and indexing patterns
- 3.3 Searching and lookup strategies

#### Intuition

Traversal is the order in which you visit array positions. Indexing is how you refer to those positions. Searching is the process of finding a value or deciding it is absent.

#### Why It Matters

Almost every array solution starts with a traversal choice. A wrong loop boundary or a poor search strategy can make even simple problems fail.

#### How It Works

Common traversal patterns:
- left to right when earlier positions influence later ones
- right to left when shifting or suffix information matters
- two ends moving inward for symmetric checks or pair reasoning
- full scan with running state for counts, sums, or best-so-far values

Common lookup strategies:
- linear search for unsorted arrays or one-off lookups
- early stopping if the array is sorted and the current value already exceeds the target
- preprocessing or extra structures when the same lookup happens many times

#### Java Implementation Notes

- Use `for (int index = 0; index < values.length; index++)` when you need positions.
- Use enhanced for-loops only when the index itself is irrelevant.
- Guard against `values[index + 1]` or `values[index - 1]` access before touching neighbors.

#### Common Mistakes

- starting from index `1` when the problem needs index `0`
- reading beyond array bounds on neighbor checks
- confusing the element value with the index position
- using a slow full scan repeatedly when the problem has many lookups

#### Quick Example

```java
static int findFirstIndex(int[] values, int target) {
    for (int index = 0; index < values.length; index++) {
        if (values[index] == target) {
            return index;
        }
    }
    return -1;
}
```

#### Debugging Tip

When an array answer is wrong, print both the index and the value at that index. Printing only the value often hides the real bug.

#### Advanced Note

Searching strategy depends on structure. An unsorted array and a sorted array do not invite the same approach, even if both store the same values.

### Concept Cluster: Updates, Rotation, and Rearrangement
Key concepts in this block:
- 3.2 Insertion and deletion
- 3.4 Rotation and rearrangement problems

#### Intuition

Arrays are fixed-size blocks of contiguous storage. If you insert or delete in the middle, elements must shift. Rotation and rearrangement problems ask you to move values while preserving or intentionally changing order.

#### Why It Matters

This is where learners first feel the real cost of array updates. It also introduces in-place modification, which is common in interviews.

#### How It Works

Insertion and deletion:
- insertion at the end is easy if capacity exists
- insertion in the middle shifts elements right
- deletion in the middle shifts elements left

Rotation and rearrangement:
- repeated one-step movement is often correct but too slow
- better solutions usually exploit structure, such as reversal or careful index mapping
- many rearrangement problems become easier when you write down where each value should move

#### Java Implementation Notes

- Shift from right to left during insertion so you do not overwrite values you still need.
- Shift from left to right during deletion to close the gap.
- Normalize rotation count with `k %= values.length` when `k` may be larger than the array size.

#### Common Mistakes

- overwriting values during a shift
- forgetting to reduce the logical size after deletion
- not handling `k = 0` or `k` larger than the array length
- using extra arrays even when an in-place solution is possible and expected

#### Quick Example

```java
static int deleteAtIndex(int[] values, int size, int deleteIndex) {
    for (int index = deleteIndex; index < size - 1; index++) {
        values[index] = values[index + 1];
    }
    return size - 1;
}
```

#### Debugging Tip

For movement problems, draw the array before and after one operation. If the first small step is wrong, the full algorithm will stay wrong.

#### Advanced Note

In-place rearrangement often trades simpler reasoning for better space usage. For beginner practice, correctness comes first, but you should still notice when a pattern supports constant extra space.

### Concept Cluster: Prefix Sums and Maximum Subarray Thinking
Key concepts in this block:
- 3.5 Prefix sum arrays
- 3.6 Kadane's algorithm

#### Intuition

Prefix sums store cumulative totals so later range sums become cheap. Kadane's algorithm stores the best subarray ending at the current position so the global best can be updated in one pass.

#### Why It Matters

These are two early examples of the same important idea: save the right summary of earlier work, and you avoid recomputation.

#### How It Works

Prefix sums:
- build an array where `prefix[i]` stores the sum of the first `i` elements
- then the sum from `left` to `right` becomes `prefix[right + 1] - prefix[left]`

Kadane's algorithm:
- at each position, decide whether to extend the current subarray or start fresh at the current value
- keep the best running sum ending here
- keep the overall maximum seen so far

#### Java Implementation Notes

- Use `long` for prefix sums when values or ranges can make totals exceed `int`.
- For Kadane's algorithm, initialize from the first element so all-negative arrays are handled correctly.
- Be explicit about whether an empty subarray is allowed. In classic maximum subarray problems, it usually is not.

#### Common Mistakes

- off-by-one errors when building or querying prefix sums
- rebuilding a range sum from scratch even after constructing prefix data
- resetting Kadane's running sum to zero blindly and breaking all-negative cases
- mixing subarray problems with subsequence thinking

#### Quick Example

```java
static long[] buildPrefixSum(int[] values) {
    long[] prefix = new long[values.length + 1];
    for (int index = 0; index < values.length; index++) {
        prefix[index + 1] = prefix[index] + values[index];
    }
    return prefix;
}
```

#### Debugging Tip

When prefix or Kadane logic fails, write the running state after each index. These techniques are simple once you can see the evolving summary.

#### Advanced Note

Kadane's algorithm is an early form of state compression. Later dynamic programming chapters will formalize this style of reasoning.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Rotate an Array to the Right by `k` Positions
#### Problem Statement

Given an integer array and a non-negative integer `k`, rotate the array to the right by `k` positions.

#### Why This Example Matters

It teaches movement cost, index normalization, and how structure can replace repeated work.

#### Constraints or Assumptions

- `0 <= k`
- the array may be empty
- in-place modification is preferred

#### Brute-Force Approach

Perform a one-step right rotation exactly `k` times. Each one-step rotation moves every element once.

That approach is correct, but it costs `O(nk)` time.

#### Better Approach

Use the reversal method:
- reverse the full array
- reverse the first `k` elements
- reverse the remaining `n - k` elements

#### Why the Better Approach Works

Reversal changes position groups in bulk. Instead of moving elements one step at a time, it rearranges the array in three linear passes.

#### Pragmatic Java Choice

Use an in-place `reverse` helper. It keeps the code short and exposes the core pattern clearly.

#### Java Solution

```java
class RotateArrayExample {
    static void rotateBruteForce(int[] values, int k) {
        if (values == null || values.length == 0) {
            return;
        }

        int rotations = k % values.length;
        for (int step = 0; step < rotations; step++) {
            int last = values[values.length - 1];
            for (int index = values.length - 1; index > 0; index--) {
                values[index] = values[index - 1];
            }
            values[0] = last;
        }
    }

    static void rotateOptimized(int[] values, int k) {
        if (values == null || values.length == 0) {
            return;
        }

        int rotations = k % values.length;
        if (rotations == 0) {
            return;
        }

        reverse(values, 0, values.length - 1);
        reverse(values, 0, rotations - 1);
        reverse(values, rotations, values.length - 1);
    }

    private static void reverse(int[] values, int left, int right) {
        while (left < right) {
            int temp = values[left];
            values[left] = values[right];
            values[right] = temp;
            left++;
            right--;
        }
    }
}
```

#### Dry Run

Use `values = [1, 2, 3, 4, 5, 6, 7]` and `k = 3`.

Optimized approach:
- reverse all -> `[7, 6, 5, 4, 3, 2, 1]`
- reverse first 3 -> `[5, 6, 7, 4, 3, 2, 1]`
- reverse last 4 -> `[5, 6, 7, 1, 2, 3, 4]`

That is the array rotated right by 3 positions.

#### Time and Space Complexity

- Brute force: `O(nk)` time, `O(1)` extra space
- Optimized: `O(n)` time, `O(1)` extra space

#### Edge Cases

- empty array -> do nothing
- `k = 0` -> unchanged
- `k` is a multiple of array length -> unchanged after normalization
- one-element array -> unchanged

#### Common Mistakes

- forgetting `k %= values.length`
- reversing the wrong subarray boundaries
- using left-to-right shifting and overwriting values during brute-force rotation

### Worked Example 2: Answer Multiple Range Sum Queries
#### Problem Statement

Given an integer array and several queries `[left, right]`, return the sum of values in each inclusive range.

#### Why This Example Matters

This is the classic reason prefix sums exist. It turns repeated linear work into fast queries.

#### Constraints or Assumptions

- `0 <= left <= right < values.length`
- many queries may be asked on the same array
- sums may exceed `int`, so `long` is safer

#### Brute-Force Approach

For each query, loop from `left` to `right` and add the values.

This costs `O(length of range)` per query, which becomes expensive across many queries.

#### Better Approach

Build one prefix sum array, then answer every query with subtraction.

#### Why the Better Approach Works

The prefix array stores cumulative totals. The sum of a middle range is the difference between two cumulative sums.

#### Pragmatic Java Choice

Use a `long[] prefix` with length `values.length + 1`. The extra leading zero removes special cases for `left = 0`.

#### Java Solution

```java
class RangeSumQueries {
    static long[] answerQueriesBruteForce(int[] values, int[][] queries) {
        long[] answers = new long[queries.length];
        for (int queryIndex = 0; queryIndex < queries.length; queryIndex++) {
            int left = queries[queryIndex][0];
            int right = queries[queryIndex][1];

            long sum = 0;
            for (int index = left; index <= right; index++) {
                sum += values[index];
            }
            answers[queryIndex] = sum;
        }
        return answers;
    }

    static long[] answerQueriesOptimized(int[] values, int[][] queries) {
        long[] prefix = new long[values.length + 1];
        for (int index = 0; index < values.length; index++) {
            prefix[index + 1] = prefix[index] + values[index];
        }

        long[] answers = new long[queries.length];
        for (int queryIndex = 0; queryIndex < queries.length; queryIndex++) {
            int left = queries[queryIndex][0];
            int right = queries[queryIndex][1];
            answers[queryIndex] = prefix[right + 1] - prefix[left];
        }
        return answers;
    }
}
```

#### Dry Run

Use `values = [4, -2, 7, 1, 3]` and queries `[[0, 2], [2, 4], [1, 1]]`.

Build prefix:
- `prefix[0] = 0`
- `prefix[1] = 4`
- `prefix[2] = 2`
- `prefix[3] = 9`
- `prefix[4] = 10`
- `prefix[5] = 13`

Answer queries:
- `[0, 2]` -> `prefix[3] - prefix[0] = 9`
- `[2, 4]` -> `prefix[5] - prefix[2] = 11`
- `[1, 1]` -> `prefix[2] - prefix[1] = -2`

#### Time and Space Complexity

- Brute force: `O(q * n)` in the worst case, `O(1)` extra space
- Optimized: `O(n + q)` time, `O(n)` extra space

#### Edge Cases

- empty query list -> return an empty answer array
- single-element ranges -> still work with the same formula
- negative numbers -> prefix sums still work correctly

#### Common Mistakes

- forgetting the extra leading zero in the prefix array
- using `prefix[right] - prefix[left]` instead of `prefix[right + 1] - prefix[left]`
- storing large cumulative sums in `int`

### Worked Example 3: Maximum Subarray Sum
#### Problem Statement

Given an integer array, return the maximum possible sum of a non-empty contiguous subarray.

#### Why This Example Matters

Kadane's algorithm is one of the first important "one-pass state" techniques in DSA. It rewards understanding over memorization.

#### Constraints or Assumptions

- the array is non-empty
- values may be positive, zero, or negative
- the subarray must be contiguous

#### Brute-Force Approach

Try every possible start index. For each start, extend the end index and track the running sum. Keep the best sum seen.

This is `O(n^2)` time.

#### Better Approach

Use Kadane's algorithm. At each position, decide whether the best subarray ending here should extend the previous one or start fresh at the current element.

#### Why the Better Approach Works

If the previous running sum is negative, carrying it forward only makes the new subarray worse. If it is positive, extending it helps. That local decision is enough to build the global answer.

#### Pragmatic Java Choice

Use two variables:
- `currentBestEndingHere`
- `globalBest`

This keeps the logic readable and handles all-negative arrays when initialized from the first value.

#### Java Solution

```java
class MaximumSubarrayExample {
    static int maxSubarrayBruteForce(int[] values) {
        int best = values[0];
        for (int start = 0; start < values.length; start++) {
            int runningSum = 0;
            for (int end = start; end < values.length; end++) {
                runningSum += values[end];
                best = Math.max(best, runningSum);
            }
        }
        return best;
    }

    static int maxSubarrayKadane(int[] values) {
        int currentBestEndingHere = values[0];
        int globalBest = values[0];

        for (int index = 1; index < values.length; index++) {
            currentBestEndingHere = Math.max(values[index], currentBestEndingHere + values[index]);
            globalBest = Math.max(globalBest, currentBestEndingHere);
        }

        return globalBest;
    }
}
```

#### Dry Run

Use `values = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`.

Kadane's algorithm:
- start: `current = -2`, `best = -2`
- index 1 value `1`: `current = max(1, -1) = 1`, `best = 1`
- index 2 value `-3`: `current = max(-3, -2) = -2`, `best = 1`
- index 3 value `4`: `current = max(4, 2) = 4`, `best = 4`
- index 4 value `-1`: `current = 3`, `best = 4`
- index 5 value `2`: `current = 5`, `best = 5`
- index 6 value `1`: `current = 6`, `best = 6`
- index 7 value `-5`: `current = 1`, `best = 6`
- index 8 value `4`: `current = 5`, `best = 6`

Final answer: `6`, from subarray `[4, -1, 2, 1]`.

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(1)` extra space
- Kadane's algorithm: `O(n)` time, `O(1)` extra space

#### Edge Cases

- all-negative array -> answer is the largest single element
- single-element array -> that element is the answer
- zeros mixed with negatives -> zero may be the best answer

#### Common Mistakes

- resetting the running sum to zero without handling all-negative arrays
- confusing subarray with subsequence
- thinking Kadane's algorithm works by magic instead of by the "extend or restart" rule

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- traversal is usually `O(n)` and should be your default baseline
- insertion and deletion in the middle are `O(n)` because shifting is unavoidable in arrays
- repeated one-step rotation is often correct but too slow for large `k`
- prefix sums trade `O(n)` extra space for much faster repeated range queries
- Kadane's algorithm reduces maximum subarray search from quadratic to linear time without extra arrays

Choose the simpler approach when:
- there is only one query and the array is small
- code clarity matters more than a small constant-factor improvement
- the optimized approach adds complexity without changing feasibility

Choose the optimized approach when:
- there are many queries on the same array
- repeated movement or repeated summation is the bottleneck
- the input size makes quadratic behavior unsafe

Recognition signals for array techniques:
- the problem is index-based and contiguous order matters
- you need fast random access to positions
- the operation can be expressed as a left-to-right or right-to-left pass

Signals not to force arrays alone:
- you need fast insertion and deletion in the middle over and over
- you mainly need key-based lookup instead of positional access
- the problem is really about dynamic window state, hashing, or trees, which later chapters handle better

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:
- off-by-one errors in loop boundaries
- using the wrong start or end index in neighbor checks
- overwriting values during shifting or reversal
- forgetting whether the solution should modify the array in place

Boundary-condition handling:
- empty arrays
- one-element arrays
- rotation counts larger than array size
- range queries where `left` equals `right`
- all-negative inputs for maximum subarray problems

Stale-state and indexing risks:
- not resetting a running sum or counter between attempts
- reusing arrays without understanding their current logical size
- mixing inclusive and exclusive index boundaries in prefix sum formulas

Short debugging checklist:
- What does each index represent right now?
- Should the current loop include the last position or stop before it?
- Am I reading old data or data I already overwrote?
- Can I write the running state after each step on paper?
- Is this problem asking for one answer or many repeated queries?

## 6. Practice Problems

### Easy

- Title: Remove Duplicates from Sorted Array
  - One-line prompt: Compact a sorted array in place so each distinct value appears once.
  - Expected pattern or core idea: Safe traversal, write index, and in-place updates.
- Title: Best Time to Buy and Sell Stock
  - One-line prompt: Find the maximum profit from one buy and one sell.
  - Expected pattern or core idea: One-pass tracking of the minimum seen so far.
- Title: Find Pivot Index
  - One-line prompt: Return an index where the left sum equals the right sum.
  - Expected pattern or core idea: Prefix-style sum reasoning without repeated scans.

### Medium

- Title: Rotate Array
  - One-line prompt: Rotate an array by `k` steps under realistic input sizes.
  - Expected pattern or core idea: Compare repeated shifts with reversal or extra-array methods.
- Title: Product of Array Except Self
  - One-line prompt: Build each answer from all elements except the current one without division.
  - Expected pattern or core idea: Prefix and suffix accumulation.
- Title: Maximum Product Subarray
  - One-line prompt: Return the largest product among all contiguous subarrays.
  - Expected pattern or core idea: One-pass state tracking with sign-sensitive updates.

### Hard

- Title: First Missing Positive
  - One-line prompt: Find the smallest missing positive value in linear time and constant extra space.
  - Expected pattern or core idea: In-place index placement and careful boundary handling.
- Title: Trapping Rain Water
  - One-line prompt: Compute how much water can be trapped between bars.
  - Expected pattern or core idea: Array summaries, two-sided information, and movement reasoning.
- Title: Maximum Sum Circular Subarray
  - One-line prompt: Find the best contiguous subarray sum when the array is circular.
  - Expected pattern or core idea: Extend Kadane-style thinking to wraparound cases.

## 7. Short Recap

The core idea of this chapter is that arrays are simple in structure but rich in patterns. Good array solutions come from careful traversal, correct indexing, and awareness of movement cost.

The most important optimization insight is to save the right summary. Prefix sums answer repeated range queries quickly, and Kadane's algorithm keeps only the best running state needed for maximum subarray problems.

The most important implementation warning is to treat indexes precisely. Most array bugs come from boundaries, shifting, or mixing positions with values.

This chapter prepares the next chapter by carrying the same traversal discipline into strings, where characters replace numeric values but the indexing risks remain.

## 8. Coverage Check

- [x] 3.1 Traversal and indexing patterns
- [x] 3.2 Insertion and deletion
- [x] 3.3 Searching and lookup strategies
- [x] 3.4 Rotation and rearrangement problems
- [x] 3.5 Prefix sum arrays
- [x] 3.6 Kadane's algorithm

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 4: Strings
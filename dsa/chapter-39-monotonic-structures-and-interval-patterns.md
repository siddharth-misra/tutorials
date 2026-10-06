# 39: Monotonic Structures and Interval Patterns

**Goal:** Teach how to use monotonic stacks, monotonic queues, interval merging, and sweep-line reasoning to solve order-sensitive problems efficiently.
**Outcome:** By the end of this chapter, you can recognize monotonic stack and queue signals, solve next-greater and histogram problems, merge intervals correctly, and explain when sweep-line thinking is the right abstraction.

---

## 1. Intuition First

This chapter matters because many array and interval problems are really about preserving the right order information while elements enter and leave consideration. A plain stack or queue is not enough unless it keeps a useful order invariant.

A simple real-world analogy is standing in a line of buildings and asking which taller building appears next for each one. You do not need every previous building forever. You only need the candidates that could still matter.

The core mental model is:

- maintain only the candidates that are still useful
- remove dominated elements as soon as they can never matter again
- sort interval endpoints or events when the problem is about overlapping time or space

The most common beginner confusion point is using a monotonic structure without being able to say what is monotonic. If you cannot state the invariant, the structure will feel like a memorized trick rather than a reasoning tool.

This chapter is the last major algorithm-pattern chapter before the final problem-solving chapter. It connects sequence order, interval order, and event order in one toolkit.

## 2. Core Concepts and Techniques

### Concept Cluster: Order-Maintaining Linear Structures
Key concepts in this block:
- 39.1 Monotonic stack
- 39.2 Monotonic queue
- 39.3 Next greater element

#### Intuition

A monotonic stack or queue keeps elements in increasing or decreasing order so dominated elements are removed immediately.

#### Why It Matters

These structures turn many repeated scans into linear-time passes.

#### How It Works

Monotonic stack:

- often stores indices
- pops while the current value breaks the chosen monotonic order
- the popped element has just found its answer or has become useless

Monotonic queue:

- supports a sliding window
- removes expired indices from the front
- removes dominated values from the back

Next greater element:

- scan while maintaining a decreasing stack of unresolved indices
- when a larger value appears, resolve all smaller ones on top

#### Java Implementation Notes

- Store indices rather than raw values when window bounds or answer positions matter.
- Use `ArrayDeque<Integer>` for both stack and queue roles.
- Decide whether equal values should stay or be removed based on the exact problem statement.

#### Common Mistakes

- forgetting to remove expired indices in a window problem
- storing values when the index is needed later
- using the wrong strictness with equal values and breaking the invariant

#### Quick Example

For next greater element, a decreasing stack of unresolved values collapses as soon as a larger number appears.

#### Debugging Tip

Write the invariant as a sentence, for example: "indices in the deque are inside the current window and their values are in decreasing order."

#### Advanced Note

Many monotonic-structure problems are really "nearest previous/next element satisfying a relation" problems.

### Concept Cluster: Area and Interval Consolidation
Key concepts in this block:
- 39.4 Histogram problems
- 39.5 Merge intervals

#### Intuition

Histogram and interval problems both depend on correctly identifying spans.

#### Why It Matters

They appear constantly in interviews and reward strong invariant-based thinking.

#### How It Works

Histogram problems:

- for each bar, find how far it can extend left and right while remaining the minimum height
- monotonic stacks reveal those boundaries efficiently

Merge intervals:

- sort intervals by start time
- walk left to right, merging overlaps into one growing current interval

#### Java Implementation Notes

- Add a sentinel height or one final cleanup pass in histogram solutions.
- Sort intervals by start, then by end when needed.
- Treat touching intervals according to the problem's overlap definition.

#### Common Mistakes

- forgetting to flush the remaining histogram stack at the end
- not sorting before merging intervals
- mixing closed and half-open interval semantics

#### Quick Example

If intervals `[1, 4]` and `[2, 5]` overlap, the merged interval becomes `[1, 5]`.

#### Debugging Tip

For histogram problems, print each popped index with the computed width. For interval problems, print the current merged interval after each step.

#### Advanced Note

The same span-finding intuition behind histogram problems also appears in matrix and subarray optimization variants.

### Concept Cluster: Event-Ordered Reasoning
Key concepts in this block:
- 39.6 Sweep line overview

#### Intuition

Sweep line processes starts, ends, or other events in sorted order while maintaining active information.

#### Why It Matters

It turns many geometric, interval, and scheduling problems into ordered event processing.

#### How It Works

Typical sweep-line steps:

- convert each object into one or more events
- sort events by position or time
- update an active set or counter while walking through the events

#### Java Implementation Notes

- Represent events as simple objects or arrays and sort with a comparator.
- Be explicit about tie-breaking when start and end events share the same coordinate.
- Choose the active structure based on the query: count, min, max, or set membership.

#### Common Mistakes

- wrong event ordering on ties
- forgetting to remove expired events from the active structure
- using sweep line when a simpler sort-and-merge is enough

#### Quick Example

To count the maximum number of overlapping meetings, create a `+1` event at each start and a `-1` event at each end, then sweep through sorted events.

#### Debugging Tip

Write out the event list after sorting. Many sweep-line bugs come from incorrect event ordering rather than the active-set logic.

#### Advanced Note

Sweep line is an approach, not one fixed data structure. The active information determines the final implementation.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Next Greater Element
#### Problem Statement

Given an integer array, return an array where each position stores the next greater value to its right, or `-1` if none exists.

#### Why This Example Matters

This is the standard monotonic-stack problem and the cleanest place to learn the invariant.

#### Constraints or Assumptions

- the next greater value must be strictly greater
- only the first greater value to the right counts
- duplicates may appear

#### Brute-Force Approach

For each index, scan rightward until a larger value is found.

That costs `O(n^2)` in the worst case.

#### Better Approach

Use a decreasing monotonic stack of indices.

#### Why the Better Approach Works

When the current value is greater than the value at the stack top, it is the answer for that unresolved index and possibly others below it.

#### Pragmatic Java Choice

Use `ArrayDeque<Integer>` and store indices.

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.Arrays;

class NextGreaterElementExample {
    static int[] nextGreater(int[] values) {
        int[] answer = new int[values.length];
        Arrays.fill(answer, -1);
        ArrayDeque<Integer> stack = new ArrayDeque<>();

        for (int index = 0; index < values.length; index++) {
            while (!stack.isEmpty() && values[stack.peek()] < values[index]) {
                answer[stack.pop()] = values[index];
            }
            stack.push(index);
        }

        return answer;
    }
}
```

#### Dry Run

Input: `[2, 1, 2, 4, 3]`

- stack starts with index `0`
- index `2` resolves index `1`
- value `4` resolves both earlier `2` values waiting on the stack
- remaining unresolved indices keep `-1`

Answer: `[4, 2, 4, -1, -1]`

#### Time and Space Complexity

Brute-force scan:

- Time: `O(n^2)`
- Space: `O(1)` extra

Monotonic stack:

- Time: `O(n)`
- Space: `O(n)`

#### Edge Cases

- strictly decreasing array
- strictly increasing array
- duplicate values

#### Common Mistakes

- storing values instead of indices when positions matter
- using `<=` instead of `<` without checking the problem's strictness
- forgetting unresolved entries should remain `-1`

### Worked Example 2: Sliding Window Maximum
#### Problem Statement

Given an integer array and a window size `k`, return the maximum value in every contiguous window of length `k`.

#### Why This Example Matters

This is the standard monotonic-queue problem. It shows how to maintain the best window candidate while indices expire.

#### Constraints or Assumptions

- `1 <= k <= n`
- windows move one step at a time
- duplicates are allowed

#### Brute-Force Approach

For each window, scan all `k` elements and compute the maximum.

That costs `O(nk)`.

#### Better Approach

Use a decreasing deque of indices.

#### Why the Better Approach Works

The deque front always holds the largest valid element in the current window. Smaller trailing elements are removed because they can never become the maximum while the larger newer element remains.

#### Pragmatic Java Choice

Use `ArrayDeque<Integer>` and expire indices from the front.

#### Java Solution

```java
import java.util.ArrayDeque;

class SlidingWindowMaximumExample {
    static int[] maxInWindows(int[] values, int k) {
        int[] answer = new int[values.length - k + 1];
        ArrayDeque<Integer> deque = new ArrayDeque<>();

        for (int index = 0; index < values.length; index++) {
            while (!deque.isEmpty() && deque.peekFirst() <= index - k) {
                deque.removeFirst();
            }

            while (!deque.isEmpty() && values[deque.peekLast()] <= values[index]) {
                deque.removeLast();
            }

            deque.addLast(index);

            if (index >= k - 1) {
                answer[index - k + 1] = values[deque.peekFirst()];
            }
        }

        return answer;
    }
}
```

#### Dry Run

Input: `values = [1, 3, -1, -3, 5, 3, 6, 7]`, `k = 3`

- first full window `[1, 3, -1]` has max `3`
- when `5` enters, smaller trailing elements are removed
- the deque front always represents the current window maximum

Answer: `[3, 3, 5, 5, 6, 7]`

#### Time and Space Complexity

Brute-force per window:

- Time: `O(nk)`
- Space: `O(1)` extra

Monotonic queue:

- Time: `O(n)`
- Space: `O(k)` up to `O(n)` in general analysis

#### Edge Cases

- `k = 1`
- all equal values
- window maximum leaving the window boundary

#### Common Mistakes

- forgetting to remove expired indices from the front
- removing from the wrong end
- using raw values without positions, making expiration impossible

### Worked Example 3: Largest Rectangle in Histogram
#### Problem Statement

Given an array of bar heights, return the area of the largest rectangle that can be formed in the histogram.

#### Why This Example Matters

This is the standard histogram problem and a high-value monotonic-stack pattern.

#### Constraints or Assumptions

- heights are nonnegative integers
- rectangle width spans contiguous bars
- use a stack-based linear solution

#### Brute-Force Approach

For every bar, expand left and right until a smaller bar appears, then compute the area.

That costs `O(n^2)` in the worst case.

#### Better Approach

Use an increasing monotonic stack of indices.

#### Why the Better Approach Works

When a shorter bar appears, any taller bar on top of the stack has just found its right boundary. The new stack top gives its left boundary.

#### Pragmatic Java Choice

Append a sentinel iteration with height `0` to flush the stack.

#### Java Solution

```java
import java.util.ArrayDeque;

class HistogramRectangleExample {
    static int largestRectangle(int[] heights) {
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        int best = 0;

        for (int index = 0; index <= heights.length; index++) {
            int currentHeight = index == heights.length ? 0 : heights[index];

            while (!stack.isEmpty() && heights[stack.peek()] > currentHeight) {
                int height = heights[stack.pop()];
                int leftBoundary = stack.isEmpty() ? -1 : stack.peek();
                int width = index - leftBoundary - 1;
                best = Math.max(best, height * width);
            }

            stack.push(index);
        }

        return best;
    }
}
```

#### Dry Run

Input: `[2, 1, 5, 6, 2, 3]`

- bars `5` and `6` stay on the stack while heights increase
- when height `2` appears, both are popped and evaluated
- the best rectangle area becomes `10`

#### Time and Space Complexity

Brute-force span expansion:

- Time: `O(n^2)`
- Space: `O(1)`

Monotonic stack:

- Time: `O(n)`
- Space: `O(n)`

#### Edge Cases

- all bars equal
- strictly increasing heights
- strictly decreasing heights
- zero-height bars

#### Common Mistakes

- forgetting the final stack flush
- computing width from the wrong left boundary after a pop
- using `>=` or `>` incorrectly and changing span behavior for equal heights

### Worked Example 4: Merge Intervals
#### Problem Statement

Given a list of intervals, merge all overlapping intervals and return the merged list.

#### Why This Example Matters

This is a foundational interval pattern. It appears in scheduling, calendars, memory ranges, and event consolidation problems.

#### Constraints or Assumptions

- intervals are closed in this explanation
- intervals may be unsorted
- touching intervals should be merged if they overlap under the chosen definition

#### Brute-Force Approach

Repeatedly compare every pair of intervals, merging overlaps until no changes remain.

That is unnecessarily slow and awkward.

#### Better Approach

Sort by start time, then sweep once.

#### Why the Better Approach Works

After sorting, any interval that can overlap the current merged interval must appear next. No earlier interval can surprise you later.

#### Pragmatic Java Choice

Use a simple `int[][]` sort and a result list.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class MergeIntervalsExample {
    static int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (first, second) -> Integer.compare(first[0], second[0]));
        List<int[]> merged = new ArrayList<>();

        for (int[] interval : intervals) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < interval[0]) {
                merged.add(new int[] {interval[0], interval[1]});
            } else {
                merged.get(merged.size() - 1)[1] = Math.max(merged.get(merged.size() - 1)[1], interval[1]);
            }
        }

        return merged.toArray(new int[merged.size()][]);
    }
}
```

#### Dry Run

Input: `[[1, 3], [2, 6], [8, 10], [9, 12]]`

- after sorting, start with `[1, 3]`
- `[2, 6]` overlaps, so merge to `[1, 6]`
- `[8, 10]` starts a new interval
- `[9, 12]` overlaps the current interval, so merge to `[8, 12]`

Answer: `[[1, 6], [8, 12]]`

#### Time and Space Complexity

Repeated pairwise merging:

- Time: worse than `O(n log n)`, often `O(n^2)` or more depending on implementation
- Space: depends on repeated merge bookkeeping

Sort and merge:

- Time: `O(n log n)` due to sorting
- Space: `O(n)` for the output list

#### Edge Cases

- empty input
- one interval only
- already disjoint intervals
- one interval fully containing another

#### Common Mistakes

- forgetting to sort first
- merging non-overlapping intervals by using the wrong comparison
- not clarifying whether touching endpoints count as overlap

## 4. Complexity and Decision Guide

The main trade-off in this chapter is between repeated rescanning and maintaining the right invariant once.

- monotonic stacks and queues are usually linear because each index enters and leaves once
- merge-interval patterns are usually dominated by sorting cost, then a linear sweep
- sweep-line approaches usually cost `O(n log n)` from event sorting, plus active-structure updates

When to choose brute force:

- tiny arrays or interval counts
- first-pass reasoning to expose the nearest-greater or overlap structure

When to optimize:

- repeated nearest-greater or span-finding logic appears
- windows slide one step at a time
- intervals or events need consolidation after sorting

Recognition signals:

- next greater, previous smaller, or span wording suggests a monotonic stack
- sliding window min or max suggests a monotonic queue
- intervals that need combining suggest sort and merge
- active overlap counting or event boundary reasoning suggests sweep line

Signals not to force these techniques:

- the problem only needs one pass with a simpler counter or prefix sum
- the invariant cannot be stated clearly
- interval queries are dynamic rather than one-time sorted processing

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- wrong monotonic invariant for equal values
- forgetting to expire indices in window problems
- missing the final cleanup pass in stack problems
- merging intervals without sorting
- tie-breaking events incorrectly in sweep-line solutions

Short debugging checklist:

- write the monotonic invariant in one sentence
- test strictly increasing and strictly decreasing cases
- test duplicate values explicitly
- print the sorted intervals or event list before processing
- verify whether interval endpoints are closed, open, or half-open

## 6. Practice Problems

### Easy

**Title:** Next Greater Element  
**Prompt:** Return the first greater value to the right for every position.  
**Expected pattern or core idea:** Decreasing monotonic stack.

**Title:** Daily Temperatures  
**Prompt:** Return how many days each temperature waits for a warmer day.  
**Expected pattern or core idea:** Monotonic stack on unresolved indices.

**Title:** Merge Intervals  
**Prompt:** Merge overlapping intervals after sorting.  
**Expected pattern or core idea:** Interval consolidation sweep.

### Medium

**Title:** Sliding Window Maximum  
**Prompt:** Return the maximum in every window of size `k`.  
**Expected pattern or core idea:** Monotonic queue with expiring indices.

**Title:** Largest Rectangle in Histogram  
**Prompt:** Return the largest rectangle area in a histogram.  
**Expected pattern or core idea:** Increasing monotonic stack for boundaries.

**Title:** Meeting Rooms II  
**Prompt:** Return the minimum number of meeting rooms needed.  
**Expected pattern or core idea:** Sweep line or sorted starts/ends reasoning.

### Hard

**Title:** Maximal Rectangle  
**Prompt:** Find the largest rectangle of ones in a binary matrix.  
**Expected pattern or core idea:** Histogram reduction plus monotonic stack.

**Title:** Trapping Rain Water II Discussion  
**Prompt:** Extend boundary reasoning to a harder two-dimensional setting.  
**Expected pattern or core idea:** Recognize when monotonic ideas do and do not transfer directly.

**Title:** Skyline Problem Overview  
**Prompt:** Compute the outer skyline of buildings from interval events.  
**Expected pattern or core idea:** Sweep line with active heights.

## 7. Short Recap

The core idea is to maintain only the candidates or events that can still affect future answers. The most important optimization insight is that monotonic structures and interval sweeps remove dominated elements immediately instead of rescanning them later. The most important implementation warning is to define the invariant and boundary rules before coding. This prepares the next chapter, which turns all the earlier patterns into a disciplined interview and contest problem-solving workflow.

## 8. Coverage Check

- 39.1 Monotonic stack - Covered
- 39.2 Monotonic queue - Covered
- 39.3 Next greater element - Covered
- 39.4 Histogram problems - Covered
- 39.5 Merge intervals - Covered
- 39.6 Sweep line overview - Covered

Coverage Summary: 6/6 official subtopics covered

Next: Problem Solving for Interviews and Contests
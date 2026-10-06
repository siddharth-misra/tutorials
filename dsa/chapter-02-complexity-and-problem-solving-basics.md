# 2: Complexity and Problem-Solving Basics

**Goal:** Teach learners how to measure algorithm cost, compare approaches honestly, read constraints carefully, and choose a fitting data structure before writing code.
**Outcome:** By the end of this chapter, you can estimate time and space complexity, separate best, average, worst, and amortized reasoning, read constraints with purpose, and make better early decisions about arrays, hash-based structures, and preprocessing.

---

## 1. Intuition First

Complexity is how you estimate the cost of a solution before you run it. In DSA, that matters because a correct solution can still fail if it does too much work or uses too much memory.

A simple real-world analogy is choosing transportation for a daily commute. Walking, cycling, and driving can all get you to the same destination, but the right choice depends on distance, traffic, budget, and how often you make the trip. Algorithms work the same way. Several approaches may be correct, but the input size and constraints decide which one is practical.

The core mental model is growth. Do not ask only, "How many steps does this take on one small example?" Ask, "How does the work grow when the input doubles, or becomes 100 times larger?"

The most common beginner confusion point is treating syntax complexity and algorithmic complexity as the same thing. A short piece of code is not automatically fast. A long piece of code is not automatically slow. The real question is how many operations it performs as input size grows.

In the larger roadmap, this chapter is the judgment layer. It helps you stop guessing. From here onward, each new pattern should come with an efficiency argument, not just working code.

## 2. Core Concepts and Techniques

### Concept Cluster: Measuring Work and Memory
Key concepts in this block:
- 2.1 Time complexity
- 2.2 Space complexity

#### Intuition

Time complexity measures how the number of operations grows with input size. Space complexity measures how much extra memory the algorithm needs while it runs.

#### Why It Matters

If `n` is tiny, many approaches work. If `n` is large, a small change in growth rate can decide whether the solution finishes in time. Space matters for the same reason. An algorithm that is fast but uses too much extra memory can still be unusable.

#### How It Works

Use `n` for input size and describe growth with Big-O notation.

Common patterns:
- `O(1)`: constant work, such as reading `arr[0]`
- `O(log n)`: work shrinks by a fraction each step
- `O(n)`: one full pass through the input
- `O(n log n)`: sorting-like behavior
- `O(n^2)`: two nested passes over the input

For space complexity, separate input storage from extra storage.

Examples:
- summing an array with one variable uses `O(1)` extra space
- copying the array into another array uses `O(n)` extra space
- using a `HashSet` of seen values can also use `O(n)` extra space

When analyzing, ignore small constants and lower-order terms. `3n + 5` grows like `O(n)`. `n^2 + n` grows like `O(n^2)`.

#### Java Implementation Notes

- Count loop structure, not line count.
- Temporary arrays, `HashMap`, `HashSet`, and recursion stacks all affect space complexity.
- Be explicit about whether you mean total memory or auxiliary memory. In interviews and DSA tutorials, auxiliary space is usually the focus.

#### Common Mistakes

- Saying two consecutive loops are `O(n^2)` when they are really `O(n) + O(n) = O(n)`
- Forgetting that nested loops may still be linear if pointers only move forward overall
- Ignoring the memory cost of helper structures such as sets or frequency arrays
- Confusing faster-looking code with faster asymptotic growth

#### Quick Example

```java
static int sumArray(int[] values) {
    int total = 0;
    for (int value : values) {
        total += value;
    }
    return total;
}
```

This method is `O(n)` time and `O(1)` extra space.

#### Debugging Tip

When complexity reasoning feels unclear, write down exactly what each loop variable can do over the full execution. That usually reveals whether the total work is linear, quadratic, or something else.

#### Advanced Note

Big-O describes growth, not exact runtime. A slower `O(n)` implementation can still beat a poorly optimized `O(n log n)` one on small inputs. Complexity gives the main trend, not the full performance story.

### Concept Cluster: Case Analysis and Amortized Thinking
Key concepts in this block:
- 2.3 Best, average, and worst case analysis
- 2.4 Amortized analysis

#### Intuition

Not every input triggers the same amount of work. Some are easy, some typical, and some painful. Amortized analysis asks what the average cost per operation is across a long sequence of operations, even if a few individual operations are expensive.

#### Why It Matters

Without case analysis, you can misjudge risk. Without amortized analysis, dynamic structures such as resizable arrays look worse than they really are.

#### How It Works

Best, average, and worst case:
- best case: the luckiest valid input
- average case: the expected cost across typical inputs under some model
- worst case: the maximum cost on any valid input

Example with linear search:
- best case: target is at index `0`, so `O(1)`
- worst case: target is absent or at the end, so `O(n)`
- average case: target tends to appear somewhere in the middle, still linear growth

Amortized analysis:
- a resizable array append is sometimes expensive because resizing copies all elements
- but if capacity doubles when full, those expensive copies happen rarely
- across many appends, the average cost per append is `O(1)` amortized

#### Java Implementation Notes

- `ArrayList` append is a classic amortized `O(1)` operation.
- Be careful not to confuse amortized `O(1)` with guaranteed `O(1)` for every single operation.
- In Java, library methods may hide resizing or copying work. That hidden work still matters in analysis.

#### Common Mistakes

- Reporting the best case as if it represents normal behavior
- Assuming average case without saying what "average" means
- Treating one expensive resize as proof that all appends are linear
- Forgetting that worst-case analysis is often the safest default in interviews

#### Quick Example

```java
class SimpleDynamicArray {
    private int[] data = new int[2];
    private int size = 0;

    void add(int value) {
        if (size == data.length) {
            int[] next = new int[data.length * 2];
            System.arraycopy(data, 0, next, 0, data.length);
            data = next;
        }
        data[size++] = value;
    }
}
```

Most `add` calls cost constant time. A resize costs linear time, but not on every call. That is why append is amortized `O(1)`.

#### Debugging Tip

If one test case is much slower than the rest, check whether you are looking at a worst-case input or at a hidden expensive operation such as copying or reallocation.

#### Advanced Note

Amortized reasoning is strongest when you can prove that each element is copied or moved only a limited number of times over the full sequence.

### Concept Cluster: Constraints, Feasibility, and Data Structure Choice
Key concepts in this block:
- 2.5 Reading problem constraints
- 2.6 Choosing the right data structure

#### Intuition

Problem constraints are not decoration. They tell you what kind of solution the problem is asking for. Data structures are the tools that let you achieve that target complexity.

#### Why It Matters

Many wrong approaches are rejected before coding even starts. If `n = 10^5`, a quadratic solution usually will not fit. If the problem asks for fast membership checks, a `HashSet` may fit better than repeated linear scans.

#### How It Works

Read constraints with these questions:
- how large can the input become?
- is there one query or many queries?
- do we need updates, lookups, ordering, or uniqueness?
- do values fit in `int`, or do we need `long`?
- is extra memory acceptable?

Useful early choices:
- array: fixed-size sequential storage with fast indexed access
- `ArrayList`: dynamic sequence with fast append
- `HashSet`: fast membership and uniqueness checks
- `HashMap`: fast key-value lookup and frequency counting

Match the data structure to the dominant operation:
- repeated membership queries -> `HashSet`
- counting frequencies -> `HashMap`
- indexed access -> array or `ArrayList`
- append-heavy dynamic storage -> `ArrayList`

#### Java Implementation Notes

- Use `long` when constraints suggest sums or products may overflow `int`.
- Prefer the simplest structure that meets the performance target.
- If the problem needs sorted order, a plain `HashMap` or `HashSet` may not be enough.

#### Common Mistakes

- Ignoring repeated queries and solving each one from scratch
- Using a list for membership checks when a set is more appropriate
- Using a map when a small fixed-size frequency array would be simpler
- Picking a structure by habit instead of by operation cost

#### Quick Example

```java
static boolean containsDuplicate(int[] values) {
    java.util.HashSet<Integer> seen = new java.util.HashSet<>();
    for (int value : values) {
        if (seen.contains(value)) {
            return true;
        }
        seen.add(value);
    }
    return false;
}
```

The main gain comes from replacing repeated scanning with fast membership checks.

#### Debugging Tip

Before coding, write one sentence that starts with: "The slow part of the naive approach is..." Then choose a data structure that directly attacks that bottleneck.

#### Advanced Note

The right data structure is sometimes the difference between `O(n^2)` and `O(n)`. Most early optimization is not about clever math. It is about storing information so you do not recompute it.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Detect Whether an Array Contains Duplicates
#### Problem Statement

Given an integer array, return `true` if any value appears at least twice. Otherwise, return `false`.

#### Why This Example Matters

This is one of the clearest early examples of how a data structure choice changes complexity.

#### Constraints or Assumptions

- `1 <= values.length <= 100000`
- integers fit in Java `int`
- order does not matter for the final answer

#### Brute-Force Approach

Compare every pair of positions. If any pair has the same value, a duplicate exists.

That means two nested loops, which leads to `O(n^2)` time and `O(1)` extra space.

#### Better Approach

Use a `HashSet` to track values seen so far. While scanning the array once, check whether the current value is already in the set.

#### Why the Better Approach Works

The brute-force method recomputes membership information again and again. The set stores that information as you go, so each value is checked once.

#### Pragmatic Java Choice

Use `HashSet<Integer>` because the important operation is membership testing, not ordering.

#### Java Solution

```java
import java.util.HashSet;
import java.util.Set;

class DuplicateChecker {
    static boolean containsDuplicateBruteForce(int[] values) {
        for (int left = 0; left < values.length; left++) {
            for (int right = left + 1; right < values.length; right++) {
                if (values[left] == values[right]) {
                    return true;
                }
            }
        }
        return false;
    }

    static boolean containsDuplicateOptimized(int[] values) {
        Set<Integer> seen = new HashSet<>();
        for (int value : values) {
            if (seen.contains(value)) {
                return true;
            }
            seen.add(value);
        }
        return false;
    }
}
```

#### Dry Run

Use `values = [3, 1, 4, 1]`.

Brute force:
- compare `3` with `1`, `4`, `1`
- compare first `1` with `4`, then second `1`
- match found on the pair `(1, 1)`

Optimized:
- start with `seen = {}`
- read `3`, not present, add it -> `{3}`
- read `1`, not present, add it -> `{3, 1}`
- read `4`, not present, add it -> `{3, 1, 4}`
- read `1`, already present -> return `true`

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(1)` extra space
- Optimized: `O(n)` average time, `O(n)` extra space

#### Edge Cases

- empty array -> `false`
- one element -> `false`
- negative values -> handled normally
- all equal values -> early duplicate detection

#### Common Mistakes

- forgetting that `HashSet` uses extra space
- using a list instead of a set and losing the time improvement
- checking after adding only if you do not understand `add` semantics clearly

### Worked Example 2: Answer Many Membership Queries
#### Problem Statement

Given an integer array `values` and another integer array `queries`, return a boolean array where each answer tells whether the query value exists in `values`.

#### Why This Example Matters

It shows how reading constraints changes the solution. One lookup may tolerate a scan. Thousands of lookups usually should not.

#### Constraints or Assumptions

- `1 <= values.length, queries.length <= 100000`
- duplicates may exist in `values`
- each query is independent

#### Brute-Force Approach

For every query, scan the full array until the value is found or the scan ends.

This costs `O(values.length * queries.length)` time.

#### Better Approach

Build a `HashSet` from `values` once, then answer each query with a constant-time average membership check.

#### Why the Better Approach Works

The expensive part is repeating the same array scan for each query. Preprocessing stores the searchable information once.

#### Pragmatic Java Choice

Use a `HashSet<Integer>` for preprocessing and a `boolean[]` for answers.

#### Java Solution

```java
import java.util.HashSet;
import java.util.Set;

class MembershipQueries {
    static boolean[] answerQueriesBruteForce(int[] values, int[] queries) {
        boolean[] answers = new boolean[queries.length];
        for (int queryIndex = 0; queryIndex < queries.length; queryIndex++) {
            int target = queries[queryIndex];
            for (int value : values) {
                if (value == target) {
                    answers[queryIndex] = true;
                    break;
                }
            }
        }
        return answers;
    }

    static boolean[] answerQueriesOptimized(int[] values, int[] queries) {
        Set<Integer> valueSet = new HashSet<>();
        for (int value : values) {
            valueSet.add(value);
        }

        boolean[] answers = new boolean[queries.length];
        for (int queryIndex = 0; queryIndex < queries.length; queryIndex++) {
            answers[queryIndex] = valueSet.contains(queries[queryIndex]);
        }
        return answers;
    }
}
```

#### Dry Run

Use `values = [8, 2, 5, 9]` and `queries = [5, 7, 8]`.

Optimized:
- build set `{8, 2, 5, 9}`
- query `5` -> present -> `true`
- query `7` -> absent -> `false`
- query `8` -> present -> `true`

Final answer: `[true, false, true]`

#### Time and Space Complexity

- Brute force: `O(nq)` time, `O(1)` extra space
- Optimized: `O(n + q)` average time, `O(n)` extra space

Here, `n = values.length` and `q = queries.length`.

#### Edge Cases

- empty `values` -> every answer is `false`
- empty `queries` -> return an empty boolean array
- duplicate items in `values` -> harmless because the set stores uniqueness

#### Common Mistakes

- solving many-query problems as if they were one-query problems
- using `ArrayList.contains`, which is still linear
- forgetting to define what should happen when `queries` is empty

### Worked Example 3: Build a Simple Dynamic Integer Array
#### Problem Statement

Implement a growable integer array with these operations:
- `add(int value)` appends a value
- `get(int index)` returns the value at that position
- `size()` returns the number of stored elements

#### Why This Example Matters

This is the cleanest way to understand amortized analysis instead of treating it like a formula to memorize.

#### Constraints or Assumptions

- appends can happen many times
- indexed access should remain fast
- invalid indexes should be rejected clearly

#### Brute-Force Approach

Whenever the array is full and a new value arrives, create a new array of size `oldLength + 1`, copy all elements, then append the new value.

This makes every full append expensive, and if you do it on every append, the total cost across `n` appends becomes quadratic.

#### Better Approach

Keep a capacity and double it when the array becomes full.

#### Why the Better Approach Works

Resizing is still expensive when it happens, but it happens rarely. Each element is copied only a limited number of times across a long sequence of appends, so the average append cost becomes amortized `O(1)`.

#### Pragmatic Java Choice

In production or interviews, use `ArrayList<Integer>` unless the problem explicitly asks for a manual implementation. Here, we implement it ourselves to make the complexity visible.

#### Java Solution

```java
class DynamicIntArrayDemo {
    static class DynamicIntArray {
        private int[] data;
        private int size;

        DynamicIntArray() {
            this.data = new int[2];
            this.size = 0;
        }

        void add(int value) {
            ensureCapacity();
            data[size] = value;
            size++;
        }

        int get(int index) {
            if (index < 0 || index >= size) {
                throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
            }
            return data[index];
        }

        int size() {
            return size;
        }

        private void ensureCapacity() {
            if (size < data.length) {
                return;
            }

            int[] next = new int[data.length * 2];
            System.arraycopy(data, 0, next, 0, data.length);
            data = next;
        }
    }
}
```

#### Dry Run

Start with capacity `2`.

- add `10` -> data becomes `[10, _]`, size `1`
- add `20` -> data becomes `[10, 20]`, size `2`
- add `30` -> array is full, resize to length `4`, copy old values, then append -> `[10, 20, 30, _]`, size `3`
- add `40` -> `[10, 20, 30, 40]`, size `4`

One append was expensive, but not all of them were.

#### Time and Space Complexity

- `get`: `O(1)` time, `O(1)` extra space
- `add`: amortized `O(1)` time, worst-case `O(n)` when resizing happens
- total stored space: `O(n)`

#### Edge Cases

- invalid negative index -> throw exception
- index equal to size -> out of bounds
- many appends -> repeated resizing still keeps amortized append efficient

#### Common Mistakes

- resizing by only one slot each time
- forgetting to copy old data into the new array
- not separating `size` from `capacity`
- calling amortized `O(1)` the same as worst-case `O(1)`

## 4. Complexity and Decision Guide

Across this chapter, the main trade-off is simple:
- brute force often saves memory and is easy to reason about
- optimized solutions often save time by storing extra information

Common decisions:
- choose brute force when input sizes are tiny, or when you only need one quick check and code simplicity matters most
- choose preprocessing when the same data will be queried many times
- choose hash-based structures when fast membership or counting is the bottleneck
- accept amortized analysis when the occasional expensive step is rare and predictable

Recognition signals that this chapter's techniques apply:
- the problem gives large `n`, such as `10^5` or higher
- the naive solution repeats the same scan many times
- the task needs fast lookup, uniqueness checks, or frequency counts
- the statement contains many queries on mostly fixed data

Signals not to force optimization:
- `n` is so small that `O(n^2)` is still fine and clearer
- memory is tightly constrained and extra structures are too costly
- the dominant difficulty is correctness, not speed, so a simpler baseline is better first

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:
- counting source lines instead of actual repeated operations
- forgetting that helper structures consume extra memory
- assuming average-case performance without explaining the assumption
- using the wrong numeric type for constraints involving large sums or products

Boundary and data-handling risks:
- empty arrays and empty query lists
- index errors in manual array implementations
- stale state when reusing a set or map across multiple test cases
- hidden copying cost in resizing or string building

Short debugging checklist:
- What is the input size variable?
- Which loop or operation dominates the total work?
- Am I repeating the same lookup or computation unnecessarily?
- What extra memory am I using, and is that acceptable?
- Does the problem have many queries, updates, or both?
- Is my chosen data structure optimized for the main operation?

## 6. Practice Problems

### Easy

- Title: Contains Duplicate
  - One-line prompt: Return whether any value appears at least twice in the array.
  - Expected pattern or core idea: Compare pairwise checking with `HashSet` membership.
- Title: Number of Good Pairs
  - One-line prompt: Count pairs `(i, j)` where `i < j` and `nums[i] == nums[j]`.
  - Expected pattern or core idea: Start with nested loops, then use frequency counting.
- Title: Running Sum of 1D Array
  - One-line prompt: Replace each position with the sum of all values up to that index.
  - Expected pattern or core idea: Practice linear scans and space reasoning.

### Medium

- Title: Range Sum Query - Immutable
  - One-line prompt: Answer many subarray sum queries efficiently.
  - Expected pattern or core idea: Recognize repeated work and preprocess once.
- Title: Design HashSet
  - One-line prompt: Implement a set structure that supports add, remove, and contains.
  - Expected pattern or core idea: Connect operation cost to data-structure design.
- Title: Top K Frequent Elements
  - One-line prompt: Return the `k` most frequent values in the array.
  - Expected pattern or core idea: Frequency counting plus a structure that matches the output requirement.

### Hard

- Title: First Missing Positive
  - One-line prompt: Find the smallest missing positive integer in linear time and constant extra space.
  - Expected pattern or core idea: Constraints force you away from naive counting structures.
- Title: Sliding Window Maximum
  - One-line prompt: Return the maximum value in every window of size `k`.
  - Expected pattern or core idea: Use complexity reasoning to reject repeated full scans.
- Title: Median of Two Sorted Arrays
  - One-line prompt: Find the median of two sorted arrays under a strict runtime target.
  - Expected pattern or core idea: Read the required complexity before deciding the algorithm.

## 7. Short Recap

The core idea of this chapter is that correct code is only half of a solution. You also need to understand how its work and memory grow.

The most important optimization insight is to store information when recomputation is the bottleneck. A set, map, or preprocessing step often turns repeated work into one-time work.

The most important implementation warning is not to confuse average, worst, and amortized reasoning. They answer different questions.

This chapter prepares the next chapter by giving you the complexity language needed to compare array operations instead of just memorizing them.

## 8. Coverage Check

- [x] 2.1 Time complexity
- [x] 2.2 Space complexity
- [x] 2.3 Best, average, and worst case analysis
- [x] 2.4 Amortized analysis
- [x] 2.5 Reading problem constraints
- [x] 2.6 Choosing the right data structure

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 3: Arrays
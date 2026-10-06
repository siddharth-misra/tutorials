# 12: Binary Search

**Goal:** Teach learners how binary search works as a shrinking search-space technique, how to maintain correct search invariants, and how to extend the idea beyond exact lookup.
**Outcome:** By the end of this chapter, you can implement iterative and recursive binary search, compute lower and upper bounds, apply binary search to monotonic answer spaces, and reason about off-by-one behavior using explicit invariants.

---

## 1. Intuition First

Binary search matters because it replaces repeated scanning with repeated elimination. If the data or answer space has order, you can often throw away half of the remaining possibilities at each step.

A simple real-world analogy is looking up a name in a printed dictionary. You do not read page by page from the start. You open near the middle, decide whether the target is before or after that point, and keep narrowing the range.

The core mental model is this: binary search works on an ordered space and maintains a range where the answer must still exist. Every comparison must preserve that guarantee.

The most common beginner confusion point is thinking binary search is only about finding an exact value in a sorted array. That is only the first form. The deeper idea is searching any monotonic space where one side is impossible and the other side is possible.

In the roadmap, this chapter builds directly on recursion and correctness reasoning. It also prepares you for divide and conquer, answer-space search, and ordered structures later.

## 2. Core Concepts and Techniques

### Concept Cluster: Exact Lookup with Iterative and Recursive Binary Search
Key concepts in this block:
- 12.1 Iterative binary search
- 12.2 Recursive binary search

#### Intuition

If the array is sorted, comparing the middle element with the target tells you which half cannot contain the answer.

#### Why It Matters

This is one of the most common interview techniques because it transforms `O(n)` search into `O(log n)` search when ordering is available.

#### How It Works

- keep two boundaries, usually `left` and `right`
- compute the middle index safely
- if the middle is the target, return it
- if the middle is too small, discard the left half including `mid`
- if the middle is too large, discard the right half including `mid`

Iterative and recursive versions apply the same logic. The only difference is whether the shrinking range is stored in loop variables or in call frames.

#### Java Implementation Notes

- Use `left + (right - left) / 2` to compute `mid` safely.
- The iterative version is usually the practical default in Java.
- Recursive binary search is useful for learning and for divide-and-conquer symmetry, but it adds call stack usage.

#### Common Mistakes

- using `while (left < right)` when the intended invariant needs `left <= right`
- forgetting to move past `mid`, which causes infinite loops
- searching unsorted data
- returning too early without checking the full invariant

#### Quick Example

```java
class BinarySearchQuickExample {
    static int search(int[] values, int target) {
        int left = 0;
        int right = values.length - 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (values[mid] == target) {
                return mid;
            }
            if (values[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return -1;
    }
}
```

#### Debugging Tip

Print `left`, `mid`, and `right` on every iteration. If they stop changing, your update rule is wrong.

#### Advanced Note

The important part is not the loop shape. It is the invariant: what property is guaranteed about the remaining range after every step?

### Concept Cluster: Lower Bound and Upper Bound
Key concepts in this block:
- 12.3 Lower bound and upper bound

#### Intuition

Sometimes you do not need an exact match. You need the first position where a value could appear, or the first position strictly greater than a value.

#### Why It Matters

Lower and upper bound solve insert-position problems, range-counting problems, duplicate handling, and many frequency queries.

#### How It Works

- lower bound: first index `i` where `values[i] >= target`
- upper bound: first index `i` where `values[i] > target`
- use a half-open search range like `[left, right)` to keep the invariant clean
- when the predicate at `mid` is true, keep the left half including `mid`
- otherwise move `left` to `mid + 1`

#### Java Implementation Notes

- Lower and upper bound become much easier when you think in terms of a boolean predicate over indices.
- Half-open intervals often reduce off-by-one errors.
- These forms are more reusable than exact-match code for interview problems.

#### Common Mistakes

- returning `mid` directly instead of the converged boundary
- mixing up `>=` and `>` between lower and upper bound
- failing to handle the case where the answer is `values.length`

#### Quick Example

```java
class BoundsQuickExample {
    static int lowerBound(int[] values, int target) {
        int left = 0;
        int right = values.length;

        while (left < right) {
            int mid = left + (right - left) / 2;
            if (values[mid] >= target) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }

        return left;
    }
}
```

#### Debugging Tip

State the predicate in plain language before coding. For lower bound, ask: is this position already large enough?

#### Advanced Note

Many range-count problems reduce to `upperBound(target) - lowerBound(target)`.

### Concept Cluster: Binary Search on Answer, Templates, Invariants, and Edge Cases
Key concepts in this block:
- 12.4 Binary search on answer
- 12.5 Templates, invariants, and edge cases

#### Intuition

You can binary-search an answer even when the answer is not stored in an array, as long as you can test whether a candidate answer is feasible and the feasibility changes only once.

#### Why It Matters

This is one of the most important transitions from mechanical coding to problem recognition. Many interview questions hide binary search behind words like minimum feasible or maximum possible.

#### How It Works

- define a search range of candidate answers
- define a monotonic predicate such as canFinish(mid)
- if `mid` is feasible, keep the half that still contains the optimal answer
- otherwise discard it
- make the invariant explicit: for example, all values below `left` are impossible, all values at or above `right` are feasible

#### Java Implementation Notes

- Write the predicate first. If the predicate is not monotonic, binary search does not apply.
- Prefer a reusable template with named invariants over memorizing many small code variations.
- Watch for overflow in arithmetic problems by using division-based checks when possible.

#### Common Mistakes

- applying binary search when feasibility is not monotonic
- choosing a search range that does not contain the answer
- mixing exact-match logic with answer-space logic
- not proving which side remains feasible or infeasible after each update

#### Quick Example

```java
class SquareRootQuickExample {
    static int floorSqrt(int target) {
        int left = 0;
        int right = target;
        int answer = 0;

        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (mid <= target / Math.max(1, mid)) {
                answer = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return answer;
    }
}
```

#### Debugging Tip

Write one sentence for the invariant before coding. If you cannot explain what is guaranteed on each side of the boundary, the template is not ready.

#### Advanced Note

Binary search templates become dramatically easier when you think in terms of finding the first true or last true position of a monotonic predicate.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Search for a Target in a Sorted Array
#### Problem Statement

Given a sorted array of integers and a target value, return the index of the target or `-1` if it does not exist.

#### Why This Example Matters

It is the canonical exact-match binary search problem and the foundation for every later variant.

#### Constraints or Assumptions

- the array is sorted in non-decreasing order
- duplicates may exist, but any matching index is acceptable
- return `-1` when the target is absent

#### Brute-Force Approach

Scan the array from left to right and stop when you find the target.

#### Better Approach

Use iterative binary search, and include the recursive version as a secondary implementation of the same invariant.

#### Why the Better Approach Works

Because the array is sorted, one comparison with the middle element eliminates half the remaining search range.

#### Pragmatic Java Choice

Prefer the iterative version in Java for day-to-day use because it is explicit and avoids call stack overhead.

#### Java Solution

```java
class ExactBinarySearchExample {
    static int linearSearch(int[] values, int target) {
        for (int index = 0; index < values.length; index++) {
            if (values[index] == target) {
                return index;
            }
        }
        return -1;
    }

    static int binarySearchIterative(int[] values, int target) {
        int left = 0;
        int right = values.length - 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (values[mid] == target) {
                return mid;
            }
            if (values[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return -1;
    }

    static int binarySearchRecursive(int[] values, int target) {
        return binarySearchRecursive(values, target, 0, values.length - 1);
    }

    private static int binarySearchRecursive(int[] values, int target, int left, int right) {
        if (left > right) {
            return -1;
        }

        int mid = left + (right - left) / 2;
        if (values[mid] == target) {
            return mid;
        }
        if (values[mid] < target) {
            return binarySearchRecursive(values, target, mid + 1, right);
        }
        return binarySearchRecursive(values, target, left, mid - 1);
    }
}
```

#### Dry Run

Use `values = [2, 4, 7, 9, 11, 15]` and `target = 9`.

Iterative search:
- `left = 0`, `right = 5`, `mid = 2`, value `7` is too small
- move `left` to `3`
- `mid = 4`, value `11` is too large
- move `right` to `3`
- `mid = 3`, value `9` matches

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(1)` extra space
- Better approach: `O(log n)` time, iterative `O(1)` extra space, recursive `O(log n)` call stack space

#### Edge Cases

- empty array returns `-1`
- target smaller than the first element returns `-1`
- target larger than the last element returns `-1`

#### Common Mistakes

- updating `left = mid` or `right = mid` instead of moving past `mid`
- forgetting the array must already be sorted
- mixing iterative and recursive boundary conventions

### Worked Example 2: Search Insert Position with Lower Bound
#### Problem Statement

Given a sorted array and a target, return the first index where the target can be inserted while preserving sorted order.

#### Why This Example Matters

It turns binary search from exact lookup into boundary finding, which is the more reusable form in interviews.

#### Constraints or Assumptions

- the array is sorted in non-decreasing order
- if the target already exists, return its first valid insertion position
- if the target is greater than all elements, return `values.length`

#### Brute-Force Approach

Scan from left to right until you find the first element greater than or equal to the target.

#### Better Approach

Use a lower-bound binary search on a half-open interval.

#### Why the Better Approach Works

The predicate `values[index] >= target` is monotonic across a sorted array. Once it becomes true, it stays true.

#### Pragmatic Java Choice

Use a reusable `lowerBound` helper because it generalizes cleanly to duplicate counting and interval queries.

#### Java Solution

```java
class LowerBoundExample {
    static int searchInsertLinear(int[] values, int target) {
        for (int index = 0; index < values.length; index++) {
            if (values[index] >= target) {
                return index;
            }
        }
        return values.length;
    }

    static int lowerBound(int[] values, int target) {
        int left = 0;
        int right = values.length;

        while (left < right) {
            int mid = left + (right - left) / 2;
            if (values[mid] >= target) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }

        return left;
    }

    static int upperBound(int[] values, int target) {
        int left = 0;
        int right = values.length;

        while (left < right) {
            int mid = left + (right - left) / 2;
            if (values[mid] > target) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }

        return left;
    }
}
```

#### Dry Run

Use `values = [1, 3, 3, 5, 8]` and `target = 3`.

Lower bound:
- `left = 0`, `right = 5`, `mid = 2`, value `3` is large enough, move `right` to `2`
- `mid = 1`, value `3` is large enough, move `right` to `1`
- `mid = 0`, value `1` is too small, move `left` to `1`
- `left == right == 1`, answer is `1`

Upper bound for `3` would return `3`, so the count of `3` is `3 - 1 = 2`.

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(1)` extra space
- Better approach: `O(log n)` time, `O(1)` extra space

#### Edge Cases

- empty array returns `0`
- target smaller than all elements returns `0`
- target larger than all elements returns `values.length`

#### Common Mistakes

- using the exact-match template instead of a boundary template
- mixing up lower bound with upper bound
- forgetting that returning `values.length` can be correct

### Worked Example 3: Floor Square Root with Binary Search on Answer
#### Problem Statement

Given a non-negative integer `target`, return the largest integer `x` such that `x * x <= target`.

#### Why This Example Matters

It is the cleanest beginner example of binary search on answer. The answer is not in an array, but the feasibility test is monotonic.

#### Constraints or Assumptions

- `target` is non-negative
- return the floor of the square root
- avoid multiplication overflow where possible

#### Brute-Force Approach

Try every integer from `0` upward until the square exceeds `target`.

#### Better Approach

Binary-search the answer range from `0` to `target` and test whether `mid` is feasible.

#### Why the Better Approach Works

The predicate `mid * mid <= target` is monotonic. If a candidate `mid` works, every smaller candidate works too. If it fails, every larger candidate fails too.

#### Pragmatic Java Choice

Use division-based comparison `mid <= target / mid` to avoid integer overflow.

#### Java Solution

```java
class IntegerSquareRootExample {
    static int sqrtLinear(int target) {
        int answer = 0;
        while ((long) (answer + 1) * (answer + 1) <= target) {
            answer++;
        }
        return answer;
    }

    static int sqrtBinarySearch(int target) {
        if (target < 2) {
            return target;
        }

        int left = 1;
        int right = target;
        int answer = 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (mid <= target / mid) {
                answer = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return answer;
    }
}
```

#### Dry Run

Use `target = 20`.

Binary search:
- `left = 1`, `right = 20`, `mid = 10`, `10 <= 20 / 10` is false
- move `right` to `9`
- `mid = 5`, `5 <= 20 / 5` is false
- move `right` to `4`
- `mid = 2`, `2 <= 20 / 2` is true, record `2`, move `left` to `3`
- `mid = 3`, `3 <= 20 / 3` is true, record `3`, move `left` to `4`
- `mid = 4`, `4 <= 20 / 4` is true, record `4`, move `left` to `5`
- stop, answer is `4`

#### Time and Space Complexity

- Brute force: `O(sqrt(target))` time, `O(1)` extra space
- Better approach: `O(log target)` time, `O(1)` extra space

#### Edge Cases

- `target = 0` returns `0`
- `target = 1` returns `1`
- large values require overflow-safe checks

#### Common Mistakes

- using `mid * mid` with `int` and overflowing
- searching the wrong answer range
- not storing the best feasible answer before moving rightward

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- exact-match binary search reduces sorted-array lookup from `O(n)` to `O(log n)`
- lower and upper bound keep the same `O(log n)` runtime while handling duplicates and insertion positions cleanly
- binary search on answer turns many trial-and-error problems from linear scanning into logarithmic search over a numeric range
- recursive forms can be elegant but use call stack space, while iterative forms are usually simpler to ship in Java

Choose binary search when:
- the data is sorted or the answer space is ordered
- one comparison or feasibility test eliminates half the remaining candidates
- the predicate is monotonic

Choose lower or upper bound when:
- duplicates matter
- you need first occurrence, insertion position, or range counts
- exact-match search feels too rigid for the question

Choose binary search on answer when:
- the problem asks for minimum feasible or maximum valid
- you can write a yes or no predicate for a candidate answer
- feasibility changes only once across the answer range

Signals not to force binary search:
- the data is unsorted and cannot be ordered cheaply enough
- the predicate is not monotonic
- the range is tiny and a direct scan is simpler

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- infinite loops from not moving beyond `mid`
- off-by-one errors from mixing closed and half-open intervals
- incorrect lower-bound or upper-bound comparison operators
- binary-searching a space that is not monotonic

Boundary and arithmetic risks:
- empty arrays
- single-element arrays
- targets outside the array range
- overflow in arithmetic comparisons for answer-space problems

Short debugging checklist:
- What exact invariant am I maintaining about the search range?
- Is the interval closed `[left, right]` or half-open `[left, right)`?
- When I reject `mid`, do I move past it correctly?
- For answer search, is my predicate truly monotonic?
- If the answer does not exist as an exact value, what boundary should I return?

## 6. Practice Problems

### Easy

- Title: Binary Search
  - One-line prompt: Return the index of a target in a sorted array.
  - Expected pattern or core idea: Exact iterative binary search.
- Title: Search Insert Position
  - One-line prompt: Return the first position where a target fits in sorted order.
  - Expected pattern or core idea: Lower bound.
- Title: Sqrt(x)
  - One-line prompt: Return the floor square root of a non-negative integer.
  - Expected pattern or core idea: Binary search on answer.

### Medium

- Title: Find First and Last Position of Element in Sorted Array
  - One-line prompt: Return the inclusive range of a target value.
  - Expected pattern or core idea: Lower bound and upper bound.
- Title: Peak Index in a Mountain Array
  - One-line prompt: Find the peak in a unimodal array.
  - Expected pattern or core idea: Binary search on ordered slope information.
- Title: Koko Eating Bananas
  - One-line prompt: Find the minimum eating speed to finish within a time limit.
  - Expected pattern or core idea: Binary search on answer with feasibility predicate.

### Hard

- Title: Median of Two Sorted Arrays
  - One-line prompt: Compute the median without fully merging two sorted arrays.
  - Expected pattern or core idea: Partition-based binary search.
- Title: Split Array Largest Sum
  - One-line prompt: Minimize the largest subarray sum under a partition limit.
  - Expected pattern or core idea: Binary search on answer.
- Title: Search in Rotated Sorted Array II
  - One-line prompt: Search a rotated sorted array with duplicates.
  - Expected pattern or core idea: Binary search with ambiguous boundaries.

## 7. Short Recap

The core idea of this chapter is that binary search is not about memorizing one loop. It is about maintaining a correct ordered search range and shrinking it safely.

The most important optimization insight is that once you can express the problem as a monotonic boundary or feasibility predicate, many linear scans become logarithmic.

The most important implementation warning is to define the invariant and interval style before you write comparisons.

This chapter prepares the next chapter by strengthening divide-and-conquer reasoning before sorting algorithms compare multiple ways to reduce disorder efficiently.

## 8. Coverage Check

- [x] 12.1 Iterative binary search
- [x] 12.2 Recursive binary search
- [x] 12.3 Lower bound and upper bound
- [x] 12.4 Binary search on answer
- [x] 12.5 Templates, invariants, and edge cases

Coverage Summary: 5/5 official subtopics covered
This must always be 5/5 before final output

Next: 13: Sorting Algorithms
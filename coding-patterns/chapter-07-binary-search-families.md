# 7: Binary Search Families

## 0. Introduction

This chapter sits in Part II - Simulation, Ordering, and Search Space Control (Weeks 5-9), with the roadmap treating it as intermediate work. Its goal is to learn how to use binary search as an invariant-driven search method over sorted data and monotonic answer spaces, not as a memorized loop with fragile boundary updates. This chapter directly supports the Part II outcome of using invariants to keep bounded search spaces correct and solving medium problems with a repeatable pattern-first workflow.

Read it as a bridge in the larger sequence. Chapter 6 used traversal frontiers to search grids. This chapter moves from state expansion to bounded search over ordered or monotonic spaces. Chapter 8 broadens the use of ordering from search boundaries to sorting, intervals, and placement-by-index workflows. Start this chapter after you are comfortable with Chapters 1 through 6, especially sorted-order reasoning, loop invariants, and careful boundary updates. The main themes here are Binary Search Pattern, Binary Search on Answer Pattern, Lower bound, upper bound, and search invariants, Designing monotonic conditions, Off-by-one handling and termination rules, and Template comparison for inclusive and exclusive ranges.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to apply standard binary search, lower and upper bound searches, and binary search on answer; design monotonic feasibility checks; handle off-by-one and termination rules safely; and choose between inclusive and exclusive templates with clear reasoning.

## 1. Intuition First

This chapter matters because binary search is one of the most reused patterns in algorithmic problem solving, but it is also one of the most misapplied. Many learners memorize `mid = (left + right) / 2` and a couple of pointer updates, then get stuck the first time the problem asks for the first valid answer, the smallest feasible capacity, or a lower bound instead of an exact match.

The simplest analogy is guessing a page number in a sorted book index. Every question cuts away half of the remaining pages because the order guarantees that all pages on one side are too small or too large. Binary search works only when that kind of safe elimination is available.

The core mental model is:

- maintain a search interval that still might contain the answer
- choose a middle candidate
- use an ordered or monotonic property to prove that one side can be discarded
- keep the invariant true after every update

Recognition signals for this chapter:

- sorted array or sorted list
- first position, last position, insertion point, or threshold question
- minimum feasible or maximum feasible answer
- answer space is numeric and a predicate changes from false to true only once

The most common beginner confusion point is thinking that binary search is about arrays only. It is really about ordered search spaces. Those spaces can be indices, values, capacities, times, or rates, as long as the test is monotonic.

In the larger roadmap, this chapter completes Part II's focus on bounded search spaces and correctness through invariants. It also prepares the learner for later topics where order and preconditions matter more than raw implementation speed.

## 2. Learning Path and Recognition Checklist

The chapter begins with exact search in a sorted array because that is the cleanest setting for binary search. It then moves to lower and upper bounds, where the target is not just “find a value” but “find the first or last index satisfying a rule.” After that, it expands to binary search on answer, where the search space is numeric and correctness depends on a monotonic feasibility check. It finishes by comparing inclusive and exclusive templates and making termination and off-by-one handling explicit.

Recognition checklist for this chapter:

- Is the data already sorted, or is the answer space naturally ordered?
- Can I write a predicate that becomes true and stays true, or false and stays false, after a threshold?
- Am I searching for an exact value, the first valid position, the last valid position, or an optimal feasible answer?
- What does the current search interval mean at every step?
- After evaluating `mid`, which half is provably impossible?
- What loop condition guarantees termination?

The brute-force baselines usually look like this:

- linear scan through a sorted array
- scan all insertion positions or all candidate capacities
- try every possible answer and test feasibility one by one

The optimized pattern is to use the ordered structure to cut away half the remaining search space each step.

Mastery by the end of the chapter looks like this: you can define the interval invariant, choose a template deliberately, design the monotonic check, and predict exactly what `left`, `right`, and `mid` mean on every iteration.

Do not force binary search when the predicate is not monotonic, when the data is not ordered and cannot be ordered safely, or when the search space is so small that linear scan is simpler and equally effective.

## 3. Official Subtopic Coverage

### Concept Cluster: Exact Search and Boundary Search
Official subtopics covered:
- 7.1 Binary Search Pattern
- 7.3 Lower bound, upper bound, and search invariants

#### Definition or Framing
The Binary Search Pattern repeatedly halves a sorted search space to find a target or a position. Lower bound and upper bound searches extend this idea from exact match to the first or last position where a condition changes.

#### Recognition Signals
- sorted array or sorted list
- target lookup in ordered data
- find first occurrence, last occurrence, or insertion point
- repeated comparisons against a middle value can discard half the space safely

#### Brute-Force Baseline
- scan the array left to right for a target
- scan until the first element greater than or equal to the target
- scan all equal elements to find the last occurrence

#### Optimized Pattern Idea
Use the sorted order to compare `target` with `values[mid]`. Then discard the half where the target or desired boundary cannot exist.

#### Invariant / State Representation / Transition Logic
The search interval always contains every position that could still be the answer. For exact search, that means the target, if present, lies within the current range. For lower bound, it means the first valid position lies within the current range. The pointer updates must preserve that meaning.

#### Java Implementation Notes
- compute `mid` as `left + (right - left) / 2` to avoid overflow
- choose inclusive or exclusive ranges before writing the loop
- for lower bound, move `right` leftward when `values[mid] >= target`
- for upper bound, move `left` rightward when `values[mid] <= target`

#### Quick Dry Run
To find lower bound of `5` in `[1, 3, 5, 5, 8]`, if `mid` points to a `5`, you do not stop immediately. You move leftward because an earlier `5` could still be the first valid position.

#### Common Mistakes
- returning as soon as any match is found when the task asks for the first or last match
- mixing exact-search updates with lower-bound updates
- using inconsistent interval meaning across iterations

#### Debugging Strategy
State the invariant in plain language before coding. During debugging, print `left`, `right`, `mid`, and the meaning of each move on a tiny sorted array.

#### Comparison with Similar Pattern
Exact binary search asks, “is the target at `mid`?” Lower bound and upper bound ask, “is `mid` on the true side of the boundary?” The loop shape can look similar, but the stopping condition and return logic are different.

#### Advanced Note
Many later problems that appear to need custom logic are really lower-bound or upper-bound searches in disguise.

### Concept Cluster: Binary Search on Answer and Monotonic Design
Official subtopics covered:
- 7.2 Binary Search on Answer Pattern
- 7.4 Designing monotonic conditions

#### Definition or Framing
Binary search on answer does not search an array position. It searches a numeric answer space for the smallest or largest value that satisfies a feasibility condition.

#### Recognition Signals
- minimum feasible value or maximum feasible value
- answer is numeric and bounded
- feasibility can be checked in linear or near-linear time
- once a value works, all larger values work, or once a value fails, all smaller values fail

#### Brute-Force Baseline
- test every possible speed, capacity, or threshold one by one
- compute the result by scanning the entire range of candidate answers

#### Optimized Pattern Idea
Define a monotonic predicate such as `canFinish(speed)` or `canShip(capacity)`. Then binary search the smallest value where the predicate becomes true, or the largest where it remains true.

#### Invariant / State Representation / Transition Logic
The search interval contains the transition point of the monotonic predicate. If `mid` is feasible and you want the smallest feasible answer, the transition point is at `mid` or to the left. If `mid` is infeasible, the transition point is to the right.

#### Java Implementation Notes
- derive tight low and high bounds from the problem, not arbitrary constants
- keep the feasibility check pure and deterministic
- if the answer space is large, use `long` for bounds and mid calculation when necessary

#### Quick Dry Run
If Koko can finish all piles at speed `8`, and any faster speed also works, then the smallest feasible speed is at `8` or below. That is the monotonic structure that makes binary search valid.

#### Common Mistakes
- writing a predicate that is not monotonic
- using an answer range that excludes the true answer
- trying to binary search an objective that changes up and down rather than across a single threshold

#### Debugging Strategy
Test the predicate itself on a short sequence of candidate answers. If the outputs do not change in one direction only, the problem is not ready for binary search on answer.

#### Comparison with Similar Pattern
Binary search on answer is not greedy search. Greedy chooses locally. Binary search on answer tests a threshold globally and depends on monotonic feasibility.

#### Advanced Note
Later advanced problems combine binary search on answer with greedy checks, prefix sums, or graph traversal inside the feasibility function.

### Concept Cluster: Boundaries, Termination, and Template Choice
Official subtopics covered:
- 7.5 Off-by-one handling and termination rules
- 7.6 Template comparison for inclusive and exclusive ranges

#### Definition or Framing
Off-by-one handling is the discipline of making sure the loop condition, midpoint calculation, pointer updates, and final return all match the same interval definition. Inclusive and exclusive templates are both valid when used consistently.

#### Recognition Signals
- loop gets stuck on one or two positions
- return value should be an index even if the target is absent
- same problem can be written with `left <= right` or `left < right`

#### Brute-Force Baseline
Beginners often avoid these details by falling back to linear scan. That avoids boundary bugs but loses the logarithmic advantage.

#### Optimized Pattern Idea
Pick one template deliberately and make every line respect that template's interval meaning.

#### Invariant / State Representation / Transition Logic
Inclusive template: both `left` and `right` are candidate positions, so the loop often uses `left <= right`.

Exclusive-right template: the interval is `[left, right)`, so `right` is not a candidate index, and the loop often uses `left < right`.

Termination happens when the interval becomes empty or shrinks to the exact boundary case defined by the template.

#### Java Implementation Notes
- use `while (left <= right)` for many exact-search inclusive templates
- use `while (left < right)` for many lower-bound style exclusive-right templates
- when using inclusive intervals, exact search often updates `right = mid - 1` or `left = mid + 1`
- when using exclusive-right intervals, lower-bound style search often updates `right = mid` or `left = mid + 1`

#### Quick Dry Run
In a lower-bound search on `[left, right)`, if `values[mid] >= target`, then `mid` is still a candidate. So `right = mid`, not `mid - 1`.

#### Common Mistakes
- using an inclusive loop condition with exclusive return logic
- updating `right = mid` in an inclusive exact-search template and causing infinite loops
- returning `left` without checking what `left` means in the chosen template

#### Debugging Strategy
When a bug appears, write the current interval as a mathematical set: inclusive `[left, right]` or half-open `[left, right)`. Then check whether each update preserves that set meaning.

#### Comparison with Similar Pattern
Inclusive and exclusive templates are both good. The danger is not choosing one over the other. The danger is mixing them.

#### Advanced Note
Strong binary-search solutions often become simpler when all searches in your codebase follow one or two stable templates instead of many improvised versions.

## 4. Pattern Template, State Model, or Core Workflow

Canonical exact-search inclusive template:

```java
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
```

Canonical lower-bound half-open template:

```java
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
```

Canonical binary-search-on-answer template for smallest feasible value:

```java
int left = minimumPossibleAnswer;
int right = maximumPossibleAnswer;

while (left < right) {
    int mid = left + (right - left) / 2;
    if (isFeasible(mid)) {
        right = mid;
    } else {
        left = mid + 1;
    }
}

return left;
```

Important variables and decision rules:

- `left`, `right`: current candidate interval
- `mid`: representative candidate inside that interval
- feasibility predicate: the monotonic test for answer-space search
- return value: exact index, insertion point, first valid answer, or last valid answer

Safety rules:

- define the interval meaning before coding
- define whether `mid` remains a candidate when the condition is true
- keep the predicate monotonic in answer-space search
- derive bounds that are guaranteed to include the true answer

What usually breaks first is interval meaning. If `right` is treated as inclusive in one line and exclusive in another, the loop either misses answers or fails to terminate.

Adapt the template when you need the largest feasible answer, an upper bound, or a last occurrence, but do not change the boundary rules casually.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Search in a Sorted Array
#### Problem Statement
Given a sorted integer array `nums` and an integer `target`, return the index of `target` if it exists, otherwise return `-1`.

#### Why This Example Matters
This is the foundational binary search problem because the ordered search space is explicit and the invariant is easy to state.

#### Input and Constraints
- `nums` is sorted in ascending order
- `nums` may be empty
- exact match is required

#### Recognition Signals
- sorted array
- exact lookup
- comparing against a midpoint can discard half the remaining positions

#### Brute-Force Approach
Scan the array linearly until the target is found or the array ends.

#### Better Pattern-Based Approach
Use binary search with an inclusive `[left, right]` interval.

#### Why the Pattern Fits
Because the array is sorted, if `nums[mid] < target`, every index left of or equal to `mid` is impossible.

#### Invariant or State Transition
If the target exists, it always remains within the current inclusive interval `[left, right]`.

#### Pragmatic Java Choice
Use `int` indices and the overflow-safe midpoint formula.

#### Dry Run Before Code
For `nums = [-1, 0, 3, 5, 9, 12]` and `target = 9`:

- `left = 0`, `right = 5`, `mid = 2`, value `3`, target is larger
- `left = 3`, `right = 5`, `mid = 4`, value `9`, found

#### Java Solution
```java
public class SearchSortedArray {
    public int search(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;

            if (nums[mid] == target) {
                return mid;
            }

            if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return -1;
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n)$ time, $O(1)$ extra space
- Binary search: $O(\log n)$ time, $O(1)$ extra space

#### Edge Cases
- empty array
- target smaller than all values
- target larger than all values
- array of length `1`

#### Common Mistakes
- using `while (left < right)` with exact-search updates and missing the last candidate
- returning `left` when the target is absent
- forgetting that the input must be sorted

### Worked Example 2: First and Last Position of a Target
#### Problem Statement
Given a sorted integer array `nums` and an integer `target`, return the starting and ending position of `target`. If the target is not present, return `[-1, -1]`.

#### Why This Example Matters
This example forces the distinction between exact search and boundary search, which is where many binary-search bugs begin.

#### Input and Constraints
- array is sorted in ascending order
- target may appear multiple times
- first and last positions are required

#### Recognition Signals
- sorted array
- duplicates
- find a boundary, not just any match

#### Brute-Force Approach
Scan from left to right to find the first occurrence, then continue until the last occurrence.

#### Better Pattern-Based Approach
Use lower bound to find the first index `>= target`, and lower bound again for `target + 1` to derive the last occurrence.

#### Why the Pattern Fits
The problem is really about locating the boundary where values become `target` and the boundary where values stop being `target`.

#### Invariant or State Transition
In lower-bound search, the half-open interval `[left, right)` always contains the first index whose value is at least the query target.

#### Pragmatic Java Choice
Implement one reusable `lowerBound` helper and build the final answer from it.

#### Dry Run Before Code
For `nums = [5, 7, 7, 8, 8, 10]` and `target = 8`:

- `lowerBound(nums, 8)` returns `3`
- `lowerBound(nums, 9)` returns `5`
- last occurrence is `5 - 1 = 4`

#### Java Solution
```java
public class SearchRange {
    public int[] searchRange(int[] nums, int target) {
        int first = lowerBound(nums, target);

        if (first == nums.length || nums[first] != target) {
            return new int[] {-1, -1};
        }

        int afterLast = lowerBound(nums, target + 1);
        return new int[] {first, afterLast - 1};
    }

    private int lowerBound(int[] nums, int target) {
        int left = 0;
        int right = nums.length;

        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] >= target) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }

        return left;
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n)$ time, $O(1)$ extra space
- Two lower-bound searches: $O(\log n)$ time, $O(1)$ extra space

#### Edge Cases
- target absent
- target fills the entire array
- target appears once
- target smaller or larger than all values

#### Common Mistakes
- returning the first exact match found by ordinary binary search
- forgetting to verify that the lower-bound index actually stores the target
- mixing inclusive and exclusive interval logic in the helper

### Worked Example 3: Koko Eating Bananas
#### Problem Statement
Koko loves to eat bananas. There are `piles` of bananas, and the `i`th pile has `piles[i]` bananas. Koko can decide her eating speed `k` bananas per hour. Each hour, she chooses one pile and eats up to `k` bananas from it. Return the minimum integer `k` such that she can finish all piles within `h` hours.

#### Why This Example Matters
This is the signature binary-search-on-answer problem because the search space is numeric and the monotonic predicate is natural.

#### Input and Constraints
- pile sizes are positive integers
- the answer is an integer speed
- smaller speeds may fail, larger speeds may succeed

#### Recognition Signals
- minimum feasible answer
- answer range is ordered from `1` up to the maximum pile size
- feasibility can be checked by computing total hours needed

#### Brute-Force Approach
Try every speed from `1` up to the maximum pile size and return the first speed that finishes within `h` hours.

#### Better Pattern-Based Approach
Binary search the smallest speed for which the feasibility check returns true.

#### Why the Pattern Fits
If Koko can finish at speed `k`, she can also finish at any speed greater than `k`. That one-direction change is the monotonic property binary search needs.

#### Invariant or State Transition
The answer always lies in the current speed interval `[left, right]`. If `mid` works, the smallest feasible speed is at `mid` or below; otherwise it must be above `mid`.

#### Pragmatic Java Choice
Use a helper method `canFinish` and keep the main loop focused on the search invariant.

#### Dry Run Before Code
For `piles = [3, 6, 7, 11]` and `h = 8`:

- speed `6` works because hours are `1 + 1 + 2 + 2 = 6`
- speed `3` fails because hours are `1 + 2 + 3 + 4 = 10`
- the smallest feasible speed lies between them, so the interval keeps shrinking

#### Java Solution
```java
public class KokoEatingBananas {
    public int minEatingSpeed(int[] piles, int h) {
        int left = 1;
        int right = 0;

        for (int pile : piles) {
            right = Math.max(right, pile);
        }

        while (left < right) {
            int mid = left + (right - left) / 2;

            if (canFinish(piles, h, mid)) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }

        return left;
    }

    private boolean canFinish(int[] piles, int h, int speed) {
        long hoursNeeded = 0;

        for (int pile : piles) {
            hoursNeeded += (pile + speed - 1) / speed;
            if (hoursNeeded > h) {
                return false;
            }
        }

        return true;
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n \cdot M)$ time where `M` is the maximum pile size, $O(1)$ extra space
- Binary search on answer: $O(n \log M)$ time, $O(1)$ extra space

#### Edge Cases
- one pile
- `h` equal to the number of piles
- very large pile sizes requiring careful arithmetic

#### Common Mistakes
- using loose bounds that do not guarantee inclusion of the answer
- writing a non-monotonic helper
- overflowing the total hours accumulator with `int`

### Worked Example 4: Integer Square Root
#### Problem Statement
Given a non-negative integer `x`, return the integer square root of `x`, which is the largest integer `r` such that `r * r <= x`.

#### Why This Example Matters
This example highlights off-by-one discipline and “largest valid answer” reasoning inside a numeric ordered space.

#### Input and Constraints
- `x` is non-negative
- the result is an integer floor value
- multiplication can overflow `int`

#### Recognition Signals
- ordered numeric search space from `0` to `x`
- want the largest value satisfying a condition
- monotonic predicate: `mid * mid <= x`

#### Brute-Force Approach
Start from `0` and increment until the square would exceed `x`.

#### Better Pattern-Based Approach
Binary search the largest valid integer whose square does not exceed `x`.

#### Why the Pattern Fits
If `mid * mid <= x`, then all smaller values also satisfy the condition. If `mid * mid > x`, all larger values fail.

#### Invariant or State Transition
`answer` stores the largest valid value seen so far, while the remaining interval still contains any larger candidate that could also be valid.

#### Pragmatic Java Choice
Use `long` for the squared value to avoid overflow.

#### Dry Run Before Code
For `x = 8`:

- `mid = 4`, square `16`, too large
- `mid = 1`, square `1`, valid, answer becomes `1`
- `mid = 2`, square `4`, valid, answer becomes `2`
- `mid = 3`, square `9`, too large, final answer is `2`

#### Java Solution
```java
public class IntegerSquareRoot {
    public int mySqrt(int x) {
        int left = 0;
        int right = x;
        int answer = 0;

        while (left <= right) {
            int mid = left + (right - left) / 2;
            long square = (long) mid * mid;

            if (square <= x) {
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

#### Time and Space Complexity
- Brute force: $O(\sqrt{x})$ or $O(x)$ depending on implementation, $O(1)$ extra space
- Binary search: $O(\log x)$ time, $O(1)$ extra space

#### Edge Cases
- `x = 0`
- `x = 1`
- perfect square
- large non-square near integer limits

#### Common Mistakes
- returning `left` instead of the largest valid value after the loop
- overflow in `mid * mid`
- using lower-bound logic when the goal is the largest valid answer

## 6. Complexity and Comparison Guide

Binary search trades stronger preconditions for much smaller search cost.

- Exact search and lower/upper bound queries reduce $O(n)$ scans on sorted data to $O(\log n)$ time.
- Binary search on answer reduces repeated testing of all candidate values from $O(R)$ checks to $O(\log R)$ checks, where `R` is the answer range size.
- Space stays $O(1)$ in the standard iterative forms.

Comparison with similar patterns:

- Binary search versus linear scan: use linear scan when the data is unsorted or tiny; use binary search when order or monotonicity gives safe halving.
- Binary search versus two pointers: two pointers scan linearly across sorted data when both ends interact; binary search is better when a single boundary or target threshold is being located.
- Binary search on answer versus greedy: greedy constructs a solution directly; binary search on answer repeatedly tests whether a threshold is feasible.

Decision criteria:

- choose exact binary search for direct lookup in sorted data
- choose lower or upper bound when you need a transition point or boundary index
- choose binary search on answer when you can test feasibility and that test is monotonic

Signals that you should not force this technique:

- predicate changes from true to false to true again
- answer space bounds are unknown or derived incorrectly
- the input must stay unsorted for index-sensitive logic and no monotonic search space exists

What breaks when the invariant or preconditions fail is safe elimination. The loop may terminate, but it is no longer justified that the discarded half contained no answer.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- mixing inclusive and exclusive interval logic
- wrong midpoint update causing infinite loops on two elements
- returning any found match when the task asks for the first or last occurrence
- designing a feasibility predicate that is not monotonic
- using bounds that exclude the true answer

Off-by-one risks:

- `right = mid` versus `right = mid - 1`
- `while (left < right)` versus `while (left <= right)`
- insertion-point returns when the target is absent

Boundary and arithmetic risks:

- empty arrays
- one-element arrays
- large values requiring overflow-safe `mid` and `long` calculations inside predicates

Short debugging checklist:

1. What does the current interval mean exactly: `[left, right]` or `[left, right)`?
2. If the condition at `mid` is true, does `mid` remain a candidate or not?
3. Does my predicate change in only one direction across the search space?
4. Do my initial bounds definitely include the answer?
5. On a two-element case, do the updates still shrink the interval?

Quick counterexample that defeats a common wrong solution:

Using ordinary exact-match binary search to find the first occurrence in `[2, 4, 4, 4, 9]` may return index `2` or `3`, but the correct first occurrence is index `1`. The pattern needed was lower bound, not ordinary exact search.

## 8. Practice Problems

### Easy
- Binary Search: Return the target index in a sorted array. Expected pattern or core idea: exact binary search.
- Search Insert Position: Return the insertion index of a target in sorted data. Expected pattern or core idea: lower bound.
- Valid Perfect Square: Decide whether a number is a perfect square. Expected pattern or core idea: binary search over values.

### Medium
- Find First and Last Position of Element in Sorted Array: Return the boundary range of a target. Expected pattern or core idea: lower and upper bound.
- Koko Eating Bananas: Find the minimum feasible eating speed. Expected pattern or core idea: binary search on answer.
- Capacity To Ship Packages Within D Days: Find the smallest feasible ship capacity. Expected pattern or core idea: binary search on answer with monotonic feasibility.

### Hard
- Median of Two Sorted Arrays: Find the median without merging fully. Expected pattern or core idea: partition-based binary search.
- Split Array Largest Sum: Minimize the largest segment sum. Expected pattern or core idea: binary search on answer.
- Maximum Value at a Given Index in a Bounded Array: Find the largest feasible peak under constraints. Expected pattern or core idea: binary search on answer with arithmetic feasibility.

## 9. Short Recap

The core idea of this chapter is that binary search is a proof-driven way to discard half of an ordered search space at a time. The strongest recognition clue is a sorted or monotonic space with a single transition boundary. The most important optimization insight is that you do not need to inspect every candidate when a comparison or feasibility check can eliminate a whole half safely. The most important implementation warning is that interval meaning and return logic must match exactly. This chapter prepares the next one by extending ordered reasoning from search thresholds to sorting-driven interval and placement patterns.

## 10. Coverage Check

- 7.1 Binary Search Pattern - Covered
- 7.2 Binary Search on Answer Pattern - Covered
- 7.3 Lower bound, upper bound, and search invariants - Covered
- 7.4 Designing monotonic conditions - Covered
- 7.5 Off-by-one handling and termination rules - Covered
- 7.6 Template comparison for inclusive and exclusive ranges - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 8: Ordering and Interval Patterns
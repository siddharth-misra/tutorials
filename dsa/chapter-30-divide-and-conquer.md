# 30: Divide and Conquer

**Goal:** Teach how to solve problems by splitting them into smaller independent parts, solving those parts recursively, and combining the results with clear recurrence thinking.
**Outcome:** By the end of this chapter, you can recognize divide-and-conquer structure, implement merge sort, quick sort, binary search, and the closest pair algorithm, and reason about recursive solution structure with recurrences.

---

## 1. Intuition First

This chapter matters because not every recursive algorithm is backtracking. Backtracking explores many possible futures. Divide and conquer solves the same kind of smaller problem repeatedly and then combines the answers.

A simple real-world analogy is grading a huge stack of papers:

- split the stack in half
- solve each half the same way
- combine the results when needed

The core mental model is:

- divide the problem into smaller independent subproblems
- conquer the subproblems recursively
- combine their answers
- analyze the recurrence this creates

The most common beginner confusion point is thinking recursion alone means divide and conquer. It does not. A recursive algorithm is divide and conquer only when the subproblems are structurally smaller versions of the same problem and there is a meaningful combine step.

This chapter closes the non-DP part of Part VI. Backtracking focused on search trees. Divide and conquer focuses on recurrence structure. That sets up the next chapter, where overlapping subproblems turn recurrences into dynamic programming.

## 2. Core Concepts and Techniques

### Concept Cluster: Divide-and-Conquer Strategy
Key concepts in this block:
- 30.1 Divide-and-conquer strategy

#### Intuition

Break the problem into smaller pieces of the same type, solve them, then merge the partial answers.

#### Why It Matters

This pattern produces many fast algorithms and gives a clean way to reason about recursion.

#### How It Works

Most divide-and-conquer algorithms answer three questions:

- how do I split the problem
- what is the base case
- how do I combine the sub-results

#### Java Implementation Notes

- Keep recursive boundaries explicit with `left` and `right`.
- Prefer `mid = left + (right - left) / 2` to avoid overflow.
- Separate the combine step into its own helper when useful.

#### Common Mistakes

- vague base cases
- forgetting the combine cost in complexity analysis
- splitting into overlapping subproblems and pretending it is the same pattern

#### Quick Example

Merge sort splits an array into halves, sorts both halves, then merges them.

#### Debugging Tip

Write the recurrence before the code. It exposes missing split or combine logic early.

#### Advanced Note

When subproblems overlap heavily, divide and conquer often transitions into dynamic programming.

### Concept Cluster: Merge Sort as a Case Study
Key concepts in this block:
- 30.2 Merge sort as a case study

#### Intuition

Sort the left half, sort the right half, then merge two sorted halves.

#### Why It Matters

Merge sort is the cleanest divide-and-conquer sorting algorithm and a standard recurrence example.

#### How It Works

Recursively split until subarrays of size `1`, then merge sorted pieces in linear time.

#### Java Implementation Notes

- Use one reusable buffer array.
- Keep merge logic stable by taking from the left side first on equal values.
- In-place merge is possible but not the beginner-friendly version.

#### Common Mistakes

- wrong copy-back indices
- forgetting the base case
- allocating too many temporary arrays in every recursive call

#### Quick Example

`[5, 2, 4, 1]` becomes `[5, 2]` and `[4, 1]`, then `[2, 5]` and `[1, 4]`, then `[1, 2, 4, 5]`.

#### Debugging Tip

Print the current `(left, mid, right)` ranges before each merge.

#### Advanced Note

The merge idea also powers inversion counting and many range problems.

### Concept Cluster: Quick Sort as a Case Study
Key concepts in this block:
- 30.3 Quick sort as a case study

#### Intuition

Choose a pivot, partition the array around it, then sort the two sides.

#### Why It Matters

Quick sort shows how the divide step itself can rearrange the data and how pivot quality affects performance.

#### How It Works

Partition so that:

- elements less than the pivot move left
- elements greater than or equal to the pivot move right

Then recurse on the two sides.

#### Java Implementation Notes

- Randomized pivot choice avoids predictable worst-case patterns.
- In-place partitioning saves memory.
- The recursion excludes the pivot's final position.

#### Common Mistakes

- wrong partition boundaries
- forgetting to move the pivot into place
- using a fixed bad pivot on already sorted input

#### Quick Example

For `[4, 1, 6, 2, 5]`, pivot `4` can partition the array into `[1, 2]`, `4`, and `[6, 5]`.

#### Debugging Tip

Print the array after every partition, not only after the full recursive call.

#### Advanced Note

Quick sort is fast on average but not stable and not worst-case safe without care.

### Concept Cluster: Binary Search as Divide and Conquer
Key concepts in this block:
- 30.4 Binary search as divide and conquer

#### Intuition

Discard half the search range after one comparison.

#### Why It Matters

This is the simplest divide-and-conquer search algorithm and a clean reminder that the technique is broader than sorting.

#### How It Works

Compare the target with the middle element:

- if equal, return the index
- if smaller, recurse on the left half
- if larger, recurse on the right half

#### Java Implementation Notes

- Use explicit `left` and `right` bounds.
- Decide whether the interval is closed or half-open and keep it consistent.
- Midpoint overflow still matters in Java.

#### Common Mistakes

- off-by-one errors in bounds
- infinite recursion when the interval does not shrink
- using binary search on unsorted data

#### Quick Example

Searching for `7` in `[1, 3, 5, 7, 9]` compares `7` with `5`, then only the right half remains.

#### Debugging Tip

Print the current `(left, right, mid)` triple on every call.

#### Advanced Note

Earlier chapters already used binary search as a pattern. Here the emphasis is the divide-and-conquer structure behind it.

### Concept Cluster: Closest Pair Problem
Key concepts in this block:
- 30.5 Closest pair problem

#### Intuition

Find the best pair in the left half, the best pair in the right half, then check only a narrow strip near the middle for cross-border candidates.

#### Why It Matters

This is a classic example where divide and conquer beats a natural quadratic brute-force baseline.

#### How It Works

Sort points by `x`, recurse on halves, merge by `y`, and only compare nearby points in the vertical strip of width `bestDistance`.

#### Java Implementation Notes

- Keep the points sorted by `x` initially.
- Maintain segments sorted by `y` during the recursion.
- Use `Math.hypot` or squared distance carefully.

#### Common Mistakes

- checking too many strip points and losing the `O(n log n)` bound
- using the midpoint after the array has already been reordered by `y`
- forgetting the base-case brute-force computation

#### Quick Example

If the best left-half distance is `3` and best right-half distance is `4`, only points within `3` of the dividing line can beat the current answer.

#### Debugging Tip

Store the midpoint `x` value before recursive calls reorder anything.

#### Advanced Note

Closest pair is a strong example of how careful combine-step geometry changes the complexity class.

### Concept Cluster: Recurrence Thinking and Solution Structure
Key concepts in this block:
- 30.6 Recurrence thinking and solution structure

#### Intuition

Every divide-and-conquer algorithm creates a recurrence that describes its work.

#### Why It Matters

If you can state the recurrence, you can usually predict the complexity before finishing the code.

#### How It Works

Typical examples:

- merge sort: `T(n) = 2T(n / 2) + O(n)`
- binary search: `T(n) = T(n / 2) + O(1)`
- quick sort average case: `T(n) = T(left) + T(right) + O(n)`

#### Java Implementation Notes

- Write the split, base case, and combine step as separate logical units.
- If the combine step is expensive, it usually dominates the recurrence.
- Keep helper arrays reusable when possible.

#### Common Mistakes

- ignoring the combine term
- assuming balanced splits when the algorithm does not guarantee them
- analyzing average-case behavior as if it were worst-case

#### Quick Example

Binary search drops to one half each time, so after about `log n` levels, the range is size `1`.

#### Debugging Tip

When the runtime surprises you, check whether the split is balanced and whether the combine step is really linear.

#### Advanced Note

The next chapter turns recurrence thinking into DP once the same states start repeating.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Merge Sort
#### Problem Statement

Given an integer array, sort it in nondecreasing order using merge sort.

#### Why This Example Matters

This is the canonical divide-and-conquer algorithm. It cleanly shows split, solve, and combine.

#### Constraints or Assumptions

- the input may contain duplicates
- stable output is preferred
- sorting should be done in place with one helper buffer

#### Brute-Force Approach

Use a simple quadratic sorting algorithm such as insertion sort or bubble sort.

That works on small arrays, but it degrades to `O(n^2)`.

#### Better Approach

Use merge sort.

#### Why the Better Approach Works

Each recursive call solves half the array. Since both halves are sorted afterward, a linear-time merge produces one sorted whole.

#### Pragmatic Java Choice

Use:

- one helper buffer array
- recursive ranges `[left, right]`
- a stable merge that takes from the left side first on ties

#### Java Solution

```java
class MergeSortCaseStudyExample {
    static void mergeSort(int[] values) {
        if (values.length <= 1) {
            return;
        }
        int[] buffer = new int[values.length];
        sort(values, buffer, 0, values.length - 1);
    }

    private static void sort(int[] values, int[] buffer, int left, int right) {
        if (left >= right) {
            return;
        }

        int mid = left + (right - left) / 2;
        sort(values, buffer, left, mid);
        sort(values, buffer, mid + 1, right);
        merge(values, buffer, left, mid, right);
    }

    private static void merge(int[] values, int[] buffer, int left, int mid, int right) {
        int first = left;
        int second = mid + 1;
        int index = left;

        while (first <= mid && second <= right) {
            if (values[first] <= values[second]) {
                buffer[index++] = values[first++];
            } else {
                buffer[index++] = values[second++];
            }
        }

        while (first <= mid) {
            buffer[index++] = values[first++];
        }

        while (second <= right) {
            buffer[index++] = values[second++];
        }

        for (int i = left; i <= right; i++) {
            values[i] = buffer[i];
        }
    }
}
```

#### Dry Run

Input: `[5, 2, 4, 1]`

Split:

- `[5, 2]` and `[4, 1]`
- then `[5]`, `[2]`, `[4]`, `[1]`

Merge:

- `[5]` and `[2]` -> `[2, 5]`
- `[4]` and `[1]` -> `[1, 4]`
- `[2, 5]` and `[1, 4]` -> `[1, 2, 4, 5]`

#### Time and Space Complexity

Quadratic baseline:

- Time: `O(n^2)`
- Space: `O(1)` or small auxiliary space depending on the sort

Merge sort:

- Time: `O(n log n)`
- Space: `O(n)`

#### Edge Cases

- empty array
- already sorted array
- reverse-sorted array
- many duplicate values

#### Common Mistakes

- off-by-one merge boundaries
- not copying merged values back
- allocating new arrays at every merge without reason

### Worked Example 2: In-Place Quick Sort
#### Problem Statement

Given an integer array, sort it using in-place quick sort.

#### Why This Example Matters

Quick sort shows a different divide-and-conquer shape: the divide step is a partition, and the split quality controls the runtime.

#### Constraints or Assumptions

- in-place mutation is allowed
- duplicate values may exist
- randomized pivot selection is preferred

#### Brute-Force Approach

Create new temporary arrays `left`, `equal`, and `right` around a pivot at every step, recursively sort the sides, then concatenate.

That is easier to explain, but it uses extra memory and more copying than necessary.

#### Better Approach

Use in-place partitioning with a randomized pivot.

#### Why the Better Approach Works

After partitioning, the pivot is already in its final position. The left and right partitions can then be sorted independently.

#### Pragmatic Java Choice

Use:

- randomized pivot selection
- Lomuto partition for clarity
- recursive range sorting

#### Java Solution

```java
import java.util.Random;

class QuickSortCaseStudyExample {
    private static final Random RANDOM = new Random(0);

    static void quickSort(int[] values) {
        sort(values, 0, values.length - 1);
    }

    private static void sort(int[] values, int left, int right) {
        if (left >= right) {
            return;
        }

        int pivotIndex = left + RANDOM.nextInt(right - left + 1);
        swap(values, pivotIndex, right);

        int partitionIndex = partition(values, left, right);
        sort(values, left, partitionIndex - 1);
        sort(values, partitionIndex + 1, right);
    }

    private static int partition(int[] values, int left, int right) {
        int pivot = values[right];
        int smallerIndex = left;

        for (int current = left; current < right; current++) {
            if (values[current] < pivot) {
                swap(values, current, smallerIndex);
                smallerIndex++;
            }
        }

        swap(values, smallerIndex, right);
        return smallerIndex;
    }

    private static void swap(int[] values, int first, int second) {
        int temporary = values[first];
        values[first] = values[second];
        values[second] = temporary;
    }
}
```

#### Dry Run

Input: `[4, 1, 6, 2, 5]`

If pivot `4` is chosen:

- partition produces `[1, 2, 4, 6, 5]`
- recurse on `[1, 2]` and `[6, 5]`
- final result becomes `[1, 2, 4, 5, 6]`

#### Time and Space Complexity

Copy-heavy baseline:

- Time: average `O(n log n)`
- Space: `O(n log n)` or more due to repeated temporary arrays

In-place quick sort:

- Average Time: `O(n log n)`
- Worst-Case Time: `O(n^2)`
- Space: average `O(log n)` recursion depth

#### Edge Cases

- already sorted input if pivot choice is poor
- many equal values
- one-element array
- empty array

#### Common Mistakes

- wrong partition boundaries
- forgetting to exclude the pivot's final index from recursion
- assuming quick sort is worst-case safe without randomized or careful pivots

### Worked Example 3: Recursive Binary Search
#### Problem Statement

Given a sorted array and a target, return the target index or `-1` if it does not exist.

#### Why This Example Matters

This is the smallest divide-and-conquer example in the chapter and a clean way to reason about recurrence depth.

#### Constraints or Assumptions

- the input array is sorted in nondecreasing order
- any matching index is acceptable
- use recursive divide and conquer

#### Brute-Force Approach

Scan the array left to right until the target is found.

That costs `O(n)`.

#### Better Approach

Use binary search to discard half the array after each comparison.

#### Why the Better Approach Works

Because the array is sorted, one comparison with the middle element proves that the target cannot lie in one entire half.

#### Pragmatic Java Choice

Use:

- closed interval bounds `[left, right]`
- overflow-safe midpoint
- recursion for the chapter's divide-and-conquer framing

#### Java Solution

```java
class BinarySearchDivideConquerExample {
    static int binarySearch(int[] values, int target) {
        return search(values, target, 0, values.length - 1);
    }

    private static int search(int[] values, int target, int left, int right) {
        if (left > right) {
            return -1;
        }

        int mid = left + (right - left) / 2;
        if (values[mid] == target) {
            return mid;
        }

        if (target < values[mid]) {
            return search(values, target, left, mid - 1);
        }

        return search(values, target, mid + 1, right);
    }
}
```

#### Dry Run

Array: `[1, 3, 5, 7, 9, 11]`, target `9`

- `left = 0`, `right = 5`, `mid = 2`, value `5`
- target is larger, recurse on `[3, 5]`
- `mid = 4`, value `9`, found

#### Time and Space Complexity

Linear scan:

- Time: `O(n)`
- Space: `O(1)`

Binary search:

- Time: `O(log n)`
- Space: `O(log n)` due to recursion

#### Edge Cases

- empty array
- target smaller than all elements
- target larger than all elements
- duplicates, where any matching index may be returned

#### Common Mistakes

- wrong base case when `left > right`
- midpoint overflow if written carelessly
- using binary search on unsorted input

### Worked Example 4: Closest Pair of Points
#### Problem Statement

Given points in the plane, return the minimum Euclidean distance between any two points.

#### Why This Example Matters

This is the chapter's advanced transfer example. It shows divide and conquer beating the obvious quadratic baseline with a carefully designed combine step.

#### Constraints or Assumptions

- there may be many points
- duplicate points imply distance `0`
- return the distance as a `double`

#### Brute-Force Approach

Check every pair of points and keep the minimum distance.

That is `O(n^2)`.

#### Better Approach

Sort by `x`, split in half, recurse, then inspect only the narrow cross-border strip.

#### Why the Better Approach Works

Any cross-border pair that beats the current best distance must lie close to the dividing line. After sorting by `y` inside the strip, only a constant number of nearby points must be checked for each point.

#### Pragmatic Java Choice

Use:

- a `Point` class
- one array sorted by `x`
- a reusable buffer for merge-by-`y`

#### Java Solution

```java
import java.util.Arrays;
import java.util.Comparator;

class ClosestPairCaseStudyExample {
    private static final Comparator<Point> BY_X =
            Comparator.comparingDouble((Point point) -> point.x).thenComparingDouble(point -> point.y);
    private static final Comparator<Point> BY_Y =
            Comparator.comparingDouble((Point point) -> point.y).thenComparingDouble(point -> point.x);

    static final class Point {
        final double x;
        final double y;

        Point(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }

    static double closestPairDistance(Point[] points) {
        if (points.length < 2) {
            return Double.POSITIVE_INFINITY;
        }

        Point[] byX = points.clone();
        Arrays.sort(byX, BY_X);
        Point[] buffer = new Point[points.length];
        return solve(byX, buffer, 0, points.length - 1);
    }

    private static double solve(Point[] points, Point[] buffer, int left, int right) {
        if (right - left <= 3) {
            double best = bruteForce(points, left, right);
            Arrays.sort(points, left, right + 1, BY_Y);
            return best;
        }

        int mid = left + (right - left) / 2;
        double midX = points[mid].x;

        double leftBest = solve(points, buffer, left, mid);
        double rightBest = solve(points, buffer, mid + 1, right);
        double best = Math.min(leftBest, rightBest);

        mergeByY(points, buffer, left, mid, right);

        int stripSize = 0;
        for (int i = left; i <= right; i++) {
            if (Math.abs(points[i].x - midX) < best) {
                buffer[stripSize++] = points[i];
            }
        }

        for (int i = 0; i < stripSize; i++) {
            for (int j = i + 1; j < stripSize && (buffer[j].y - buffer[i].y) < best; j++) {
                best = Math.min(best, distance(buffer[i], buffer[j]));
            }
        }

        return best;
    }

    private static double bruteForce(Point[] points, int left, int right) {
        double best = Double.POSITIVE_INFINITY;
        for (int i = left; i <= right; i++) {
            for (int j = i + 1; j <= right; j++) {
                best = Math.min(best, distance(points[i], points[j]));
            }
        }
        return best;
    }

    private static void mergeByY(Point[] points, Point[] buffer, int left, int mid, int right) {
        int first = left;
        int second = mid + 1;
        int index = left;

        while (first <= mid && second <= right) {
            if (BY_Y.compare(points[first], points[second]) <= 0) {
                buffer[index++] = points[first++];
            } else {
                buffer[index++] = points[second++];
            }
        }

        while (first <= mid) {
            buffer[index++] = points[first++];
        }

        while (second <= right) {
            buffer[index++] = points[second++];
        }

        for (int i = left; i <= right; i++) {
            points[i] = buffer[i];
        }
    }

    private static double distance(Point first, Point second) {
        return Math.hypot(first.x - second.x, first.y - second.y);
    }
}
```

#### Dry Run

Points:

- `(0, 0)`
- `(2, 3)`
- `(3, 4)`
- `(7, 7)`
- `(8, 8)`

Split around the midpoint by `x`.

Suppose left half best distance is about `1.41` and right half best distance is also about `1.41`.

Then only points within `1.41` of the dividing line enter the strip. The combine step checks only nearby strip points, not all cross pairs.

#### Time and Space Complexity

Brute force:

- Time: `O(n^2)`
- Space: `O(1)` extra

Divide and conquer:

- Time: `O(n log n)`
- Space: `O(n)`

#### Edge Cases

- fewer than two points
- duplicate points with distance `0`
- many points sharing the same `x` or `y`
- floating-point formatting of the answer

#### Common Mistakes

- recomputing strip comparisons quadratically
- using the midpoint after recursive reordering changed the array
- forgetting to keep the segment sorted by `y` on return

## 4. Complexity and Decision Guide

Main trade-offs in this chapter:

- merge sort: `O(n log n)` time, `O(n)` space
- quick sort: average `O(n log n)` time, worst-case `O(n^2)`, low extra space
- binary search: `O(log n)` time
- closest pair: `O(n log n)` instead of `O(n^2)`

When to choose divide and conquer:

- the problem splits into smaller independent pieces
- the combine step is cheaper than solving the original problem directly
- the recursive structure is clear and repeatable

Recognition signals:

- "split into halves"
- "sort or solve both sides, then merge"
- "discard half the search space"
- "cross-border interactions are limited and structured"

Signals not to force this technique:

- if the same subproblem repeats heavily, DP may be better
- if the search explores many possible decisions, backtracking may be the right model
- if the combine step is as expensive as re-solving everything, the split may not help

A practical rule:

- write the recurrence first
- if the recurrence improves meaningfully over the baseline, the divide-and-conquer design is probably worth it

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- wrong midpoint calculations
- missing or weak base cases
- bad partition boundaries in quick sort
- incorrect merge indices in merge sort
- losing sorted-by-`y` structure in closest pair

Boundary handling:

- empty arrays and one-element arrays should terminate immediately
- already sorted input can expose quick sort pivot problems
- duplicate values and duplicate points should not break correctness
- recursive intervals must shrink every time

Short debugging checklist:

- verify every recursive call reduces the problem size
- verify the base case returns immediately and correctly
- print split boundaries on small examples
- for merge sort, print arrays before and after merge
- for quick sort, print the array after each partition
- for closest pair, verify the strip is narrow and sorted by `y`

## 6. Practice Problems

### Easy

- Title: Binary Search in a Sorted Array. One-line prompt: return the index of a target in sorted data or `-1`. Expected pattern or core idea: divide the interval in half each step.
- Title: Sort an Array with Merge Sort. One-line prompt: implement stable `O(n log n)` sorting on integers. Expected pattern or core idea: split, sort halves, merge.
- Title: First Bad Version. One-line prompt: find the first failing version with as few checks as possible. Expected pattern or core idea: binary search on a monotonic predicate.

### Medium

- Title: Quick Sort Implementation. One-line prompt: sort an array in place using partition-based recursion. Expected pattern or core idea: pivot partitioning.
- Title: Count Inversions. One-line prompt: count how many index pairs are out of order. Expected pattern or core idea: merge-sort-based divide and conquer.
- Title: Median of Two Sorted Arrays. One-line prompt: find the median without fully merging both arrays. Expected pattern or core idea: divide and conquer over sorted structure.

### Hard

- Title: Closest Pair of Points. One-line prompt: find the smallest distance among all point pairs faster than quadratic time. Expected pattern or core idea: geometric divide and conquer.
- Title: Kth Smallest in Two Sorted Arrays. One-line prompt: discard blocks of candidates recursively until the answer remains. Expected pattern or core idea: divide and conquer on ranks.
- Title: External Merge Planning. One-line prompt: design a large-data merge workflow with predictable recursion and combine costs. Expected pattern or core idea: recurrence thinking and solution structure.

## 7. Short Recap

The core idea of this chapter is that divide and conquer solves smaller independent pieces and combines their answers systematically.

The most important optimization insight is that the split and combine design changes the recurrence, which changes the complexity class.

The most important implementation warning is to get the boundaries and base cases exactly right.

This chapter prepares the next chapter by turning recurrence thinking into dynamic programming when subproblems start overlapping.

## 8. Coverage Check

- [x] 30.1 Divide-and-conquer strategy
- [x] 30.2 Merge sort as a case study
- [x] 30.3 Quick sort as a case study
- [x] 30.4 Binary search as divide and conquer
- [x] 30.5 Closest pair problem
- [x] 30.6 Recurrence thinking and solution structure

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 31: Dynamic Programming Foundations
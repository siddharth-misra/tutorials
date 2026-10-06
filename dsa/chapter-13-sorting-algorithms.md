# 13: Sorting Algorithms

**Goal:** Teach learners how major sorting algorithms work, what trade-offs they make, and how to choose a sorting strategy based on data shape, stability needs, memory limits, and constraints.
**Outcome:** By the end of this chapter, you can explain and implement elementary quadratic sorts, merge sort, quick sort, heap sort, and counting-style sorts in Java, and you can justify when one sorting approach is more appropriate than another.

---

## 1. Intuition First

Sorting matters because many harder problems become easier after order is imposed. Searching, duplicate handling, interval merging, greedy scheduling, and many graph or tree preprocessing tasks often become simpler once data is sorted.

A simple real-world analogy is organizing books on a shelf. You can sort by repeatedly swapping neighbors, by selecting the next correct book, by splitting books into smaller piles and merging them, or by placing them into bins by label range. Different methods reach the same final order with different costs.

The core mental model is this: a sorting algorithm spends work resolving disorder. The right algorithm depends on how much disorder there is, whether extra memory is allowed, whether equal elements must keep their original order, and whether the key range is small.

The most common beginner confusion point is assuming there is one universally best sort. There is not. Some are stable, some are in-place, some are fast on average, and some depend on value range rather than pairwise comparison.

In the roadmap, this chapter turns comparison-based reasoning from binary search into broader algorithm trade-offs. It also prepares later chapters where sorted order becomes an assumption rather than the main topic.

## 2. Core Concepts and Techniques

### Concept Cluster: Bubble Sort, Selection Sort, and Insertion Sort
Key concepts in this block:
- 13.1 Bubble sort, selection sort, and insertion sort

#### Intuition

These algorithms are the first clear models of how local operations gradually create global order.

#### Why It Matters

They are not usually the best choice for large arrays, but they teach invariants, swapping, shifting, and how sorted prefixes or suffixes grow.

#### How It Works

- bubble sort repeatedly swaps adjacent out-of-order pairs so large values drift right
- selection sort repeatedly selects the smallest remaining value and places it next
- insertion sort grows a sorted prefix by inserting each new value into its correct position

#### Java Implementation Notes

- Insertion sort is often the best of the three for small arrays or nearly sorted data.
- Selection sort minimizes writes, which can matter in special cases.
- Bubble sort is mainly educational unless a problem explicitly asks for it.

#### Common Mistakes

- forgetting the inner-loop bounds
- swapping too eagerly in insertion sort instead of shifting efficiently
- assuming bubble sort is stable only if swaps occur on equal values
- ignoring the early-exit optimization in bubble sort

#### Quick Example

```java
class InsertionSortQuickExample {
    static void insertionSort(int[] values) {
        for (int index = 1; index < values.length; index++) {
            int current = values[index];
            int position = index - 1;

            while (position >= 0 && values[position] > current) {
                values[position + 1] = values[position];
                position--;
            }

            values[position + 1] = current;
        }
    }
}
```

#### Debugging Tip

After each outer-loop step, verify what portion of the array is guaranteed to be sorted.

#### Advanced Note

Many production sorting implementations switch to insertion sort for tiny partitions because its constant factors are low.

### Concept Cluster: Merge Sort and Quick Sort
Key concepts in this block:
- 13.2 Merge sort
- 13.3 Quick sort

#### Intuition

Both algorithms use divide and conquer, but they make opposite trade-offs. Merge sort is predictable and stable but uses extra memory. Quick sort is usually faster in practice and in-place, but its worst case is poor without careful pivot strategy.

#### Why It Matters

These two algorithms dominate interview discussions of general-purpose comparison sorting.

#### How It Works

Merge sort:
- split the array into halves
- sort each half recursively
- merge the two sorted halves

Quick sort:
- choose a pivot
- partition smaller values left and larger values right
- recurse on the partitions

#### Java Implementation Notes

- Merge sort is stable and easier to reason about.
- Quick sort needs careful partitioning and a decent pivot choice.
- Randomized pivoting helps avoid consistently bad partitions.

#### Common Mistakes

- forgetting to copy leftovers during merge
- partition loops that skip or double-count elements
- using quick sort without understanding what the pivot position guarantees
- assuming quick sort is stable

#### Quick Example

```java
class MergeSortQuickExample {
    static void mergeSort(int[] values) {
        int[] buffer = new int[values.length];
        mergeSort(values, 0, values.length - 1, buffer);
    }

    private static void mergeSort(int[] values, int left, int right, int[] buffer) {
        if (left >= right) {
            return;
        }

        int mid = left + (right - left) / 2;
        mergeSort(values, left, mid, buffer);
        mergeSort(values, mid + 1, right, buffer);
        merge(values, left, mid, right, buffer);
    }

    private static void merge(int[] values, int left, int mid, int right, int[] buffer) {
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
        for (int position = left; position <= right; position++) {
            values[position] = buffer[position];
        }
    }
}
```

#### Debugging Tip

For merge sort, print the two halves before merging. For quick sort, print the pivot and final partition boundary after each partition step.

#### Advanced Note

The difference between a stable and unstable sort matters whenever equal keys carry attached meaning, such as timestamps or IDs.

### Concept Cluster: Heap Sort, Counting Sort, Radix Sort, and Choosing the Right Sort
Key concepts in this block:
- 13.4 Heap sort
- 13.5 Counting sort and radix sort
- 13.6 When to use which sorting algorithm

#### Intuition

Heap sort repeatedly extracts the next extreme value from a heap. Counting and radix sort avoid pairwise comparisons when keys have helpful structure.

#### Why It Matters

This is where sorting becomes a constraint-driven choice rather than a single technique.

#### How It Works

Heap sort:
- build a max heap
- swap the root with the last unsorted position
- restore the heap property and repeat

Counting sort:
- count how many times each value appears
- rebuild the array from counts

Radix sort:
- sort by one digit or character position at a time
- usually relies on a stable inner sort such as counting sort

Choosing rules:
- stable general-purpose sort with extra memory: merge sort
- fast average in-place comparison sort: quick sort
- guaranteed `O(n log n)` in-place comparison sort: heap sort
- bounded integer key range: counting sort
- fixed-width digit-based keys: radix sort

#### Java Implementation Notes

- Heap sort is valuable when you need worst-case guarantees without extra array-sized memory.
- Counting sort only makes sense when the value range is not too large.
- Radix sort is excellent for fixed-format numeric keys but requires careful stable passes.

#### Common Mistakes

- assuming counting sort works efficiently for arbitrary large ranges
- forgetting that radix sort depends on stable intermediate passes
- mismanaging heap size during heap sort extraction

#### Quick Example

```java
class CountingSortQuickExample {
    static int[] countingSortNonNegative(int[] values, int maximum) {
        int[] counts = new int[maximum + 1];
        for (int value : values) {
            counts[value]++;
        }

        int[] result = new int[values.length];
        int index = 0;
        for (int value = 0; value <= maximum; value++) {
            for (int count = 0; count < counts[value]; count++) {
                result[index++] = value;
            }
        }
        return result;
    }
}
```

#### Debugging Tip

Before choosing a sort, state the constraints in one line: stable or not, extra memory allowed or not, value range small or not, nearly sorted or not.

#### Advanced Note

Sorting choice is often about constants, memory, and data distribution, not just asymptotic runtime.

## 3. Worked Examples and Full Solutions

### Worked Example 1: General Array Sorting with Merge Sort
#### Problem Statement

Given an integer array, sort it in ascending order.

#### Why This Example Matters

It introduces the first efficient general-purpose sorting upgrade over the quadratic beginner algorithms.

#### Constraints or Assumptions

- the array may contain duplicates and negative values
- stable behavior is desirable
- extra array-sized memory is acceptable

#### Brute-Force Approach

Use bubble sort and repeatedly swap adjacent out-of-order pairs until the array is sorted.

#### Better Approach

Use merge sort.

#### Why the Better Approach Works

Merge sort splits the problem into two smaller sorting problems, then combines already sorted halves in linear time per merge level.

#### Pragmatic Java Choice

Use one reusable buffer array to avoid allocating a new temporary array at every merge call.

#### Java Solution

```java
class MergeSortExample {
    static void bubbleSort(int[] values) {
        for (int end = values.length - 1; end > 0; end--) {
            boolean swapped = false;
            for (int index = 0; index < end; index++) {
                if (values[index] > values[index + 1]) {
                    int temp = values[index];
                    values[index] = values[index + 1];
                    values[index + 1] = temp;
                    swapped = true;
                }
            }
            if (!swapped) {
                return;
            }
        }
    }

    static void mergeSort(int[] values) {
        int[] buffer = new int[values.length];
        mergeSort(values, 0, values.length - 1, buffer);
    }

    private static void mergeSort(int[] values, int left, int right, int[] buffer) {
        if (left >= right) {
            return;
        }

        int mid = left + (right - left) / 2;
        mergeSort(values, left, mid, buffer);
        mergeSort(values, mid + 1, right, buffer);
        merge(values, left, mid, right, buffer);
    }

    private static void merge(int[] values, int left, int mid, int right, int[] buffer) {
        int first = left;
        int second = mid + 1;
        int write = left;

        while (first <= mid && second <= right) {
            if (values[first] <= values[second]) {
                buffer[write++] = values[first++];
            } else {
                buffer[write++] = values[second++];
            }
        }

        while (first <= mid) {
            buffer[write++] = values[first++];
        }
        while (second <= right) {
            buffer[write++] = values[second++];
        }
        for (int index = left; index <= right; index++) {
            values[index] = buffer[index];
        }
    }
}
```

#### Dry Run

Use `values = [5, 2, 4, 1]`.

Merge sort:
- split into `[5, 2]` and `[4, 1]`
- split again into single elements
- merge `[5]` and `[2]` into `[2, 5]`
- merge `[4]` and `[1]` into `[1, 4]`
- merge `[2, 5]` and `[1, 4]` into `[1, 2, 4, 5]`

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(1)` extra space
- Better approach: `O(n log n)` time, `O(n)` extra space

#### Edge Cases

- empty array remains empty
- single-element array is already sorted
- duplicates keep their original relative order under merge sort

#### Common Mistakes

- forgetting to copy remaining elements after one half finishes
- allocating too many temporary arrays unnecessarily
- assuming merge sort is in-place

### Worked Example 2: In-Place Sorting with Quick Sort
#### Problem Statement

Given an integer array, sort it in ascending order using an in-place strategy.

#### Why This Example Matters

It highlights the trade-off between memory efficiency and worst-case predictability.

#### Constraints or Assumptions

- average-case performance matters
- extra array-sized memory is undesirable
- the input can contain duplicates

#### Brute-Force Approach

Use selection sort and repeatedly choose the smallest remaining value for the next position.

#### Better Approach

Use quick sort with a randomized pivot.

#### Why the Better Approach Works

Partitioning places the pivot into its final sorted position and ensures all smaller values are on one side and all larger values are on the other. The same logic then applies recursively to both sides.

#### Pragmatic Java Choice

Randomize the pivot selection to reduce the chance of worst-case partitions on already patterned input.

#### Java Solution

```java
import java.util.concurrent.ThreadLocalRandom;

class QuickSortExample {
    static void selectionSort(int[] values) {
        for (int start = 0; start < values.length; start++) {
            int minimumIndex = start;
            for (int index = start + 1; index < values.length; index++) {
                if (values[index] < values[minimumIndex]) {
                    minimumIndex = index;
                }
            }
            int temp = values[start];
            values[start] = values[minimumIndex];
            values[minimumIndex] = temp;
        }
    }

    static void quickSort(int[] values) {
        quickSort(values, 0, values.length - 1);
    }

    private static void quickSort(int[] values, int left, int right) {
        if (left >= right) {
            return;
        }

        int pivotIndex = ThreadLocalRandom.current().nextInt(left, right + 1);
        swap(values, pivotIndex, right);
        int partitionIndex = partition(values, left, right);
        quickSort(values, left, partitionIndex - 1);
        quickSort(values, partitionIndex + 1, right);
    }

    private static int partition(int[] values, int left, int right) {
        int pivot = values[right];
        int smallerEnd = left;

        for (int index = left; index < right; index++) {
            if (values[index] <= pivot) {
                swap(values, smallerEnd, index);
                smallerEnd++;
            }
        }

        swap(values, smallerEnd, right);
        return smallerEnd;
    }

    private static void swap(int[] values, int first, int second) {
        int temp = values[first];
        values[first] = values[second];
        values[second] = temp;
    }
}
```

#### Dry Run

Use `values = [7, 3, 5, 2]` and assume pivot `5`.

- move pivot to the end if needed
- scan the array and keep a boundary for values `<= 5`
- after partition, array becomes `[3, 2, 5, 7]`
- pivot `5` is fixed in its final position
- recursively sort `[3, 2]` and `[7]`
- final answer is `[2, 3, 5, 7]`

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(1)` extra space
- Better approach: average `O(n log n)` time, worst-case `O(n^2)` time, average `O(log n)` call stack space

#### Edge Cases

- already sorted input can be bad for poor pivot choices
- all equal values still need correct partition behavior
- empty and single-element arrays should return immediately

#### Common Mistakes

- misunderstanding what the partition index guarantees
- forgetting to exclude the pivot's final position from recursive calls
- not randomizing or otherwise choosing pivots carefully

### Worked Example 3: Sorting Bounded Integers with Counting Sort
#### Problem Statement

Given an array of non-negative integers where every value lies between `0` and `maximum`, sort the array.

#### Why This Example Matters

It shows that sometimes you should stop comparing elements entirely and exploit the key range directly.

#### Constraints or Assumptions

- all values are non-negative
- `maximum` is not extremely large relative to `n`
- stability is not required for this basic version

#### Brute-Force Approach

Use a comparison sort such as merge sort.

#### Better Approach

Use counting sort.

#### Why the Better Approach Works

If the key range is small, counting each value is cheaper than repeatedly comparing values to each other.

#### Pragmatic Java Choice

Use counting sort only when the range size is manageable. If the range is too large, the memory cost becomes the new bottleneck.

#### Java Solution

```java
class CountingSortExample {
    static void mergeSort(int[] values) {
        int[] buffer = new int[values.length];
        mergeSort(values, 0, values.length - 1, buffer);
    }

    private static void mergeSort(int[] values, int left, int right, int[] buffer) {
        if (left >= right) {
            return;
        }

        int mid = left + (right - left) / 2;
        mergeSort(values, left, mid, buffer);
        mergeSort(values, mid + 1, right, buffer);
        merge(values, left, mid, right, buffer);
    }

    private static void merge(int[] values, int left, int mid, int right, int[] buffer) {
        int first = left;
        int second = mid + 1;
        int write = left;

        while (first <= mid && second <= right) {
            if (values[first] <= values[second]) {
                buffer[write++] = values[first++];
            } else {
                buffer[write++] = values[second++];
            }
        }
        while (first <= mid) {
            buffer[write++] = values[first++];
        }
        while (second <= right) {
            buffer[write++] = values[second++];
        }
        for (int index = left; index <= right; index++) {
            values[index] = buffer[index];
        }
    }

    static int[] countingSort(int[] values, int maximum) {
        int[] counts = new int[maximum + 1];
        for (int value : values) {
            counts[value]++;
        }

        int[] result = new int[values.length];
        int write = 0;
        for (int value = 0; value <= maximum; value++) {
            while (counts[value] > 0) {
                result[write++] = value;
                counts[value]--;
            }
        }
        return result;
    }
}
```

#### Dry Run

Use `values = [4, 2, 2, 1, 3]` and `maximum = 4`.

Counting sort:
- counts become `[0, 1, 2, 1, 1]`
- rebuild output by writing one `1`, two `2`s, one `3`, and one `4`
- result is `[1, 2, 2, 3, 4]`

Radix sort extends this idea by applying stable counting-style passes one digit at a time.

#### Time and Space Complexity

- Brute force: `O(n log n)` time, `O(n)` extra space for merge sort
- Better approach: `O(n + k)` time and `O(k)` extra space, where `k = maximum + 1`

#### Edge Cases

- empty array returns empty output
- many repeated values are handled efficiently
- a very large `maximum` can make counting sort impractical

#### Common Mistakes

- using counting sort when the key range is far larger than the array length
- forgetting that this simple version only handles non-negative bounded integers
- assuming radix sort works without stable per-digit sorting

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- bubble, selection, and insertion sorts are `O(n^2)` and mainly useful for learning or very small inputs
- merge sort gives `O(n log n)` time with stability but needs `O(n)` extra memory
- quick sort is often fastest in practice on average and sorts in place, but its worst case is `O(n^2)`
- heap sort guarantees `O(n log n)` and uses only `O(1)` extra array space, but it is not stable and often has larger constants
- counting sort and radix sort can beat comparison sorts when the keys have a constrained structure

Choose insertion sort when:
- the array is small or nearly sorted
- simplicity matters
- stability is useful

Choose merge sort when:
- stable ordering matters
- predictable `O(n log n)` time matters
- extra memory is acceptable

Choose quick sort when:
- you want fast average performance and in-place partitioning
- randomized or good pivot selection is available

Choose heap sort when:
- worst-case `O(n log n)` is required without array-sized extra memory

Choose counting or radix sort when:
- the key domain is constrained enough to exploit
- comparison sorting is leaving performance on the table

Signals not to force a specific sort:
- using counting sort on huge sparse ranges
- using quick sort when stability is required
- using merge sort when memory is too constrained

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- incorrect loop bounds in quadratic sorts
- broken merge leftover copying
- faulty partition logic in quick sort
- heapify index mistakes in heap sort
- range misuse in counting sort

Boundary and data-shape risks:
- empty arrays
- single-element arrays
- already sorted or reverse-sorted input
- many duplicates
- negative values in counting-sort problems unless explicitly handled

Short debugging checklist:
- After each outer loop, what subrange is guaranteed to be sorted?
- If I am merging, did I copy all leftover elements?
- If I am partitioning, what does the pivot boundary mean exactly?
- Does the chosen sort match the data constraints and stability needs?
- Am I paying memory for a benefit I actually need?

## 6. Practice Problems

### Easy

- Title: Sort Colors
  - One-line prompt: Rearrange an array containing only `0`, `1`, and `2`.
  - Expected pattern or core idea: Counting insight or three-way partitioning.
- Title: Relative Sort Array
  - One-line prompt: Sort one array according to the order defined by another.
  - Expected pattern or core idea: Counting or custom ordering.
- Title: Merge Sorted Array
  - One-line prompt: Merge two sorted arrays into one sorted result.
  - Expected pattern or core idea: Merge procedure.

### Medium

- Title: Sort an Array
  - One-line prompt: Implement a full sorting algorithm rather than calling the library.
  - Expected pattern or core idea: Merge sort or quick sort.
- Title: K Closest Points to Origin
  - One-line prompt: Return the `k` closest points.
  - Expected pattern or core idea: Heap or quickselect-style partition reasoning.
- Title: Largest Number
  - One-line prompt: Arrange numbers so their concatenation is maximal.
  - Expected pattern or core idea: Comparator design after understanding sorting behavior.

### Hard

- Title: Reverse Pairs
  - One-line prompt: Count pairs where one value is more than twice another later value.
  - Expected pattern or core idea: Merge-sort-based counting.
- Title: Count of Smaller Numbers After Self
  - One-line prompt: For each index, count how many smaller values appear later.
  - Expected pattern or core idea: Merge-sort counting or Fenwick tree later.
- Title: Maximum Gap
  - One-line prompt: Find the maximum difference between adjacent sorted values.
  - Expected pattern or core idea: Bucket or radix-style thinking beyond comparison sort.

## 7. Short Recap

The core idea of this chapter is that sorting is a family of trade-offs, not a single algorithm.

The most important optimization insight is that `O(n log n)` comparison sorting is the default upgrade, but bounded-key problems can do even better with counting-style methods.

The most important implementation warning is to choose a sort that matches the actual constraints instead of copying one algorithm everywhere.

This chapter prepares the next chapter by making ordered, bit-level, and structural thinking more natural before bit manipulation starts optimizing representation itself.

## 8. Coverage Check

- [x] 13.1 Bubble sort, selection sort, and insertion sort
- [x] 13.2 Merge sort
- [x] 13.3 Quick sort
- [x] 13.4 Heap sort
- [x] 13.5 Counting sort and radix sort
- [x] 13.6 When to use which sorting algorithm

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 14: Bit Manipulation
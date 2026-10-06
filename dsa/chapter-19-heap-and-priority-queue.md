# 19: Heap and Priority Queue

**Goal:** Teach learners how heaps maintain quick access to the smallest or largest element, how heapify and build-heap work, and when Java's `PriorityQueue` is the right tool.
**Outcome:** By the end of this chapter, you can explain min heaps and max heaps, implement heap insertion and extraction, use heapify and build-heap, apply `PriorityQueue` in Java, perform heap sort, and solve top K and streaming problems efficiently.

---

## 1. Intuition First

Heaps matter because some problems do not need full sorted order. They only need fast access to the current smallest or largest value while the rest of the data keeps changing.

A simple real-world analogy is a priority line at an airport. You do not need every passenger perfectly sorted in every way. You only need the next highest-priority passenger to be available immediately.

The core mental model is this: a heap is a complete binary tree where each parent obeys a priority rule relative to its children. In a min heap, every parent is less than or equal to its children. In a max heap, every parent is greater than or equal to its children.

The most common beginner confusion point is mixing heap order with full sorted order. A heap only guarantees parent-child priority, not left-to-right sorted traversal.

In the roadmap, this chapter builds on tree structure and ordering ideas from BSTs, but uses a different rule. Instead of searchable full ordering, heaps optimize repeated extreme-value access.

## 2. Core Concepts and Techniques

### Concept Cluster: Min Heap, Max Heap, Heapify, and Build-Heap
Key concepts in this block:
- 19.1 Min heap and max heap
- 19.2 Heapify and build-heap

#### Intuition

A heap is a nearly compact tree that keeps the best candidate at the root.

#### Why It Matters

It supports repeated insertions and extractions of the minimum or maximum without full sorting.

#### How It Works

- min heap: parent value `<=` child values
- max heap: parent value `>=` child values
- complete tree shape allows efficient array representation
- insert uses sift-up to restore heap order
- extract-root uses sift-down after swapping with the last element
- heapify means restoring heap order from a node downward
- build-heap runs heapify from the last internal node backward

Array representation:
- left child index: `2 * index + 1`
- right child index: `2 * index + 2`
- parent index: `(index - 1) / 2`

#### Java Implementation Notes

- Array-backed heaps are preferred because complete-tree shape eliminates pointer overhead.
- Build-heap is faster than inserting all values one by one into an empty heap.
- Max heaps in Java can be simulated with a reversed comparator in `PriorityQueue`.

#### Common Mistakes

- assuming siblings are ordered
- forgetting to restore the heap after removing the root
- building a heap by repeated insertion when linear-time build-heap would be simpler

#### Quick Example

```java
import java.util.ArrayList;
import java.util.List;

class MinHeapQuickExample {
    static final class MinHeap {
        private final List<Integer> values = new ArrayList<>();

        void add(int value) {
            values.add(value);
            siftUp(values.size() - 1);
        }

        private void siftUp(int index) {
            while (index > 0) {
                int parent = (index - 1) / 2;
                if (values.get(parent) <= values.get(index)) {
                    break;
                }
                swap(parent, index);
                index = parent;
            }
        }

        private void swap(int first, int second) {
            int temp = values.get(first);
            values.set(first, values.get(second));
            values.set(second, temp);
        }
    }
}
```

#### Debugging Tip

After every insert or extract, check the parent-child rule for the changed path only. Heap bugs are almost always local repair bugs.

#### Advanced Note

Build-heap is `O(n)`, not `O(n log n)`, because most nodes are near the bottom and move only a short distance.

### Concept Cluster: PriorityQueue in Java and Heap Sort
Key concepts in this block:
- 19.3 PriorityQueue in Java
- 19.4 Heap sort

#### Intuition

`PriorityQueue` is Java's ready-made heap. Heap sort uses heap extraction repeatedly to place values into final sorted order.

#### Why It Matters

Many interview problems want heap behavior, not a custom heap implementation. Heap sort also shows how a heap can become a full sorting algorithm.

#### How It Works

- Java `PriorityQueue` is a min heap by default
- use `Comparator.reverseOrder()` for max-heap behavior
- heap sort builds a max heap, then swaps the root with the last unsorted position and restores the heap

#### Java Implementation Notes

- Prefer `PriorityQueue` unless the problem explicitly asks you to implement the heap yourself.
- Heap sort is in-place on the array, but it is not stable.
- `PriorityQueue` gives clean `offer`, `poll`, and `peek` operations.

#### Common Mistakes

- expecting `PriorityQueue` iteration to be sorted
- forgetting that `PriorityQueue` is min-heap by default
- heap-sorting with a min heap but writing the output logic for a max heap

#### Quick Example

```java
import java.util.Comparator;
import java.util.PriorityQueue;

class PriorityQueueQuickExample {
    static int kthLargest(int[] values, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();

        for (int value : values) {
            minHeap.offer(value);
            if (minHeap.size() > k) {
                minHeap.poll();
            }
        }

        return minHeap.peek();
    }

    static PriorityQueue<Integer> maxHeap() {
        return new PriorityQueue<>(Comparator.reverseOrder());
    }
}
```

#### Debugging Tip

If a `PriorityQueue` result looks wrong, check whether you actually needed a min heap or a max heap.

#### Advanced Note

Heap sort is a strong worst-case option, but many real systems prefer different sorts because stability and cache behavior also matter.

### Concept Cluster: Top K and Streaming Problems
Key concepts in this block:
- 19.5 Top K and streaming problems

#### Intuition

If you only need the best `k` values, storing all values in fully sorted order is often wasteful.

#### Why It Matters

This is the most common interview use case for heaps and priority queues.

#### How It Works

- for top `k` largest values, keep a min heap of size `k`
- for top `k` smallest values, keep a max heap of size `k`
- in streaming problems, update the heap as new values arrive
- the root always tells you the current boundary of the kept set

#### Java Implementation Notes

- A fixed-size heap is often the cleanest answer for top K tasks.
- Streaming problems usually care about amortized updates, not full re-sorting after every input.

#### Common Mistakes

- sorting the full stream after every insertion
- choosing the wrong heap direction for the boundary element
- keeping more than `k` elements when only `k` are needed

#### Quick Example

```java
import java.util.PriorityQueue;

class StreamingQuickExample {
    static final class KthLargestStream {
        private final int k;
        private final PriorityQueue<Integer> minHeap = new PriorityQueue<>();

        KthLargestStream(int k) {
            this.k = k;
        }

        int add(int value) {
            minHeap.offer(value);
            if (minHeap.size() > k) {
                minHeap.poll();
            }
            return minHeap.peek();
        }
    }
}
```

#### Debugging Tip

State what the heap root means after every operation. In a top-K-largest stream with a min heap, the root is the current kth largest.

#### Advanced Note

Top K problems are usually about maintaining a boundary, not about sorting everything.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Design a Min Heap with Build-Heap
#### Problem Statement

Implement a min heap that supports `peek`, `add`, and `extractMin`, and can also build a heap from an existing array.

#### Why This Example Matters

It makes the heap property concrete and shows the difference between incremental insertion and bottom-up build-heap.

#### Constraints or Assumptions

- duplicates are allowed
- extraction from an empty heap should fail clearly
- the underlying storage is an array-like structure

#### Brute-Force Approach

Store values in an unsorted list. `add` is cheap, but `peek` and `extractMin` must scan the entire list to find the minimum.

#### Better Approach

Use a binary min heap with sift-up, sift-down, and bottom-up build-heap.

#### Why the Better Approach Works

The heap property keeps the smallest value at the root. Local repairs after insertions or deletions are enough because only one root-to-leaf path can become invalid each time.

#### Pragmatic Java Choice

Use an `ArrayList<Integer>` to focus on heap logic instead of manual resizing.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class MinHeapExample {
    static final class UnsortedMinStore {
        private final List<Integer> values = new ArrayList<>();

        void add(int value) {
            values.add(value);
        }

        int peek() {
            if (values.isEmpty()) {
                throw new IllegalStateException("Heap is empty");
            }

            int minimum = values.get(0);
            for (int value : values) {
                minimum = Math.min(minimum, value);
            }
            return minimum;
        }

        int extractMin() {
            if (values.isEmpty()) {
                throw new IllegalStateException("Heap is empty");
            }

            int minimumIndex = 0;
            for (int index = 1; index < values.size(); index++) {
                if (values.get(index) < values.get(minimumIndex)) {
                    minimumIndex = index;
                }
            }

            int minimum = values.get(minimumIndex);
            values.remove(minimumIndex);
            return minimum;
        }
    }

    static final class MinHeap {
        private final List<Integer> values = new ArrayList<>();

        MinHeap() {
        }

        MinHeap(int[] initialValues) {
            for (int value : initialValues) {
                values.add(value);
            }
            buildHeap();
        }

        int peek() {
            if (values.isEmpty()) {
                throw new IllegalStateException("Heap is empty");
            }
            return values.get(0);
        }

        void add(int value) {
            values.add(value);
            siftUp(values.size() - 1);
        }

        int extractMin() {
            if (values.isEmpty()) {
                throw new IllegalStateException("Heap is empty");
            }

            int minimum = values.get(0);
            int lastIndex = values.size() - 1;
            swap(0, lastIndex);
            values.remove(lastIndex);
            if (!values.isEmpty()) {
                siftDown(0);
            }
            return minimum;
        }

        private void buildHeap() {
            for (int index = values.size() / 2 - 1; index >= 0; index--) {
                siftDown(index);
            }
        }

        private void siftUp(int index) {
            while (index > 0) {
                int parent = (index - 1) / 2;
                if (values.get(parent) <= values.get(index)) {
                    break;
                }
                swap(parent, index);
                index = parent;
            }
        }

        private void siftDown(int index) {
            int size = values.size();

            while (true) {
                int leftChild = 2 * index + 1;
                int rightChild = 2 * index + 2;
                int smallest = index;

                if (leftChild < size && values.get(leftChild) < values.get(smallest)) {
                    smallest = leftChild;
                }
                if (rightChild < size && values.get(rightChild) < values.get(smallest)) {
                    smallest = rightChild;
                }
                if (smallest == index) {
                    break;
                }

                swap(index, smallest);
                index = smallest;
            }
        }

        private void swap(int first, int second) {
            int temp = values.get(first);
            values.set(first, values.get(second));
            values.set(second, temp);
        }
    }
}
```

#### Dry Run

Build a heap from `[7, 3, 10, 1, 5]`.

Bottom-up build:
- start from the last internal node
- heapify the subtree rooted at `3` if needed
- heapify the root `7`, which swaps down until `1` reaches the root
- final min heap root is `1`

Extracting the minimum:
- swap root `1` with the last element
- remove the last element
- sift down the new root until the heap property is restored

#### Time and Space Complexity

- Brute force: `add` `O(1)`, `peek` `O(n)`, `extractMin` `O(n)`
- Better approach: `peek` `O(1)`, `add` `O(log n)`, `extractMin` `O(log n)`, build-heap `O(n)`

#### Edge Cases

- extracting from an empty heap
- duplicate values
- building a heap from an empty array

#### Common Mistakes

- forgetting to sift down after extraction
- computing child indexes incorrectly
- not realizing build-heap is different from repeated insertion

### Worked Example 2: Heap Sort
#### Problem Statement

Given an integer array, sort it in ascending order using heap sort.

#### Why This Example Matters

It shows how heap structure can produce a full in-place sort with guaranteed `O(n log n)` time.

#### Constraints or Assumptions

- in-place sorting is desired
- stability is not required
- the array may contain duplicates

#### Brute-Force Approach

Use selection sort and repeatedly place the maximum remaining element at the end.

#### Better Approach

Build a max heap, then repeatedly move the root to the end of the unsorted region and restore the heap.

#### Why the Better Approach Works

The max heap guarantees that the largest unsorted value is always at the root. Moving it to the array end fixes one final position per step.

#### Pragmatic Java Choice

Implement heap sort directly on the input array so the relationship between array indexes and heap positions stays visible.

#### Java Solution

```java
class HeapSortExample {
    static void selectionSort(int[] values) {
        for (int end = values.length - 1; end >= 0; end--) {
            int maximumIndex = 0;
            for (int index = 1; index <= end; index++) {
                if (values[index] > values[maximumIndex]) {
                    maximumIndex = index;
                }
            }
            swap(values, maximumIndex, end);
        }
    }

    static void heapSort(int[] values) {
        int size = values.length;

        for (int index = size / 2 - 1; index >= 0; index--) {
            siftDown(values, size, index);
        }

        for (int end = size - 1; end > 0; end--) {
            swap(values, 0, end);
            siftDown(values, end, 0);
        }
    }

    private static void siftDown(int[] values, int size, int index) {
        while (true) {
            int leftChild = 2 * index + 1;
            int rightChild = 2 * index + 2;
            int largest = index;

            if (leftChild < size && values[leftChild] > values[largest]) {
                largest = leftChild;
            }
            if (rightChild < size && values[rightChild] > values[largest]) {
                largest = rightChild;
            }
            if (largest == index) {
                break;
            }

            swap(values, index, largest);
            index = largest;
        }
    }

    private static void swap(int[] values, int first, int second) {
        int temp = values[first];
        values[first] = values[second];
        values[second] = temp;
    }
}
```

#### Dry Run

Use `values = [4, 10, 3, 5, 1]`.

- build max heap so the root becomes `10`
- swap `10` with the last position
- reduce heap size and sift down the new root
- next largest value reaches the root and is moved next
- continue until the array becomes `[1, 3, 4, 5, 10]`

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(1)` extra space
- Better approach: `O(n log n)` time, `O(1)` extra space

#### Edge Cases

- empty array remains empty
- one-element array is already sorted
- duplicates are allowed but heap sort is not stable

#### Common Mistakes

- building a min heap instead of a max heap for ascending order
- forgetting to shrink the heap size after placing the maximum
- assuming heap order means the array is already globally sorted

### Worked Example 3: Kth Largest Element in a Stream
#### Problem Statement

Design a data structure that returns the kth largest element after each new stream insertion.

#### Why This Example Matters

It is the most common real use of `PriorityQueue` in interview settings.

#### Constraints or Assumptions

- values arrive one at a time
- only the kth largest element is needed, not the full sorted stream
- `k` is fixed

#### Brute-Force Approach

Store every seen value in a list and sort the whole list after each insertion.

#### Better Approach

Maintain a min heap of size `k`.

#### Why the Better Approach Works

The heap stores exactly the current `k` largest values. The smallest among them is the kth largest overall, so it sits at the root.

#### Pragmatic Java Choice

Use `PriorityQueue<Integer>` directly because the problem is about maintaining the boundary, not implementing the heap yourself.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.PriorityQueue;

class KthLargestStreamExample {
    static final class NaiveKthLargest {
        private final int k;
        private final List<Integer> values = new ArrayList<>();

        NaiveKthLargest(int k) {
            this.k = k;
        }

        int add(int value) {
            values.add(value);
            Collections.sort(values);
            return values.get(values.size() - k);
        }
    }

    static final class HeapKthLargest {
        private final int k;
        private final PriorityQueue<Integer> minHeap = new PriorityQueue<>();

        HeapKthLargest(int k) {
            this.k = k;
        }

        int add(int value) {
            minHeap.offer(value);
            if (minHeap.size() > k) {
                minHeap.poll();
            }
            return minHeap.peek();
        }
    }
}
```

#### Dry Run

Use `k = 3` and stream values `4, 5, 8, 2, 10`.

Min-heap of size `3`:
- add `4` -> heap `[4]`
- add `5` -> heap `[4, 5]`
- add `8` -> heap `[4, 5, 8]`, current 3rd largest is `4`
- add `2` -> heap becomes size `4`, remove `2`, root stays `4`
- add `10` -> heap temporarily has four values, remove smallest `4`, root becomes `5`

The current 3rd largest is now `5`.

#### Time and Space Complexity

- Brute force: `O(n log n)` per insertion after sorting all seen values
- Better approach: `O(log k)` per insertion, `O(k)` extra space

#### Edge Cases

- fewer than `k` values seen so far requires a clear problem convention
- duplicate values still count as separate elements
- negative values work normally

#### Common Mistakes

- using a max heap when a fixed-size min heap is the correct boundary structure
- sorting the full history after every update
- forgetting what the heap root represents

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- heaps give `O(1)` root access and `O(log n)` insert or extract, which is ideal when only the smallest or largest item matters repeatedly
- build-heap in `O(n)` is better than repeated insertion when you already have all data up front
- heap sort gives in-place `O(n log n)` sorting but sacrifices stability
- fixed-size heaps reduce top K maintenance from full re-sorting to `O(log k)` updates

Choose a min heap when:
- you need repeated access to the smallest value
- you want to maintain the top `k` largest values with the smallest kept boundary at the root

Choose a max heap when:
- you need repeated access to the largest value
- you want to maintain the top `k` smallest values with the largest kept boundary at the root

Choose `PriorityQueue` when:
- the problem is about heap behavior, not heap implementation details

Choose heap sort when:
- you need guaranteed `O(n log n)` time and in-place sorting
- stability is not required

Signals not to force heaps:
- the problem needs arbitrary search by value
- a full sorted order is needed only once and another sort fits better
- the dataset is tiny and simpler logic is clearer

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- wrong parent or child index formulas
- sifting in the wrong direction after updates
- misunderstanding what the heap root means in top K problems
- expecting `PriorityQueue` iteration to return sorted order

Boundary and representation risks:
- empty heap operations
- duplicate values
- incorrect heap size management during heap sort
- using the wrong comparator for min or max behavior

Short debugging checklist:
- Does every parent satisfy the heap rule relative to its children?
- After extraction, did I restore the heap from the root downward?
- For top K, what exact boundary does the root represent?
- Should I use a min heap or a max heap here?
- If I already have all values, would build-heap be simpler than repeated insertion?

## 6. Practice Problems

### Easy

- Title: Last Stone Weight
  - One-line prompt: Repeatedly remove the two largest stones and insert the remainder.
  - Expected pattern or core idea: Max heap.
- Title: Kth Largest Element in an Array
  - One-line prompt: Return the kth largest value from a static array.
  - Expected pattern or core idea: Fixed-size min heap.
- Title: Sort Characters by Frequency
  - One-line prompt: Return characters ordered by decreasing count.
  - Expected pattern or core idea: Priority queue over frequency pairs.

### Medium

- Title: Top K Frequent Elements
  - One-line prompt: Return the `k` most frequent values.
  - Expected pattern or core idea: Frequency map plus fixed-size heap.
- Title: K Closest Points to Origin
  - One-line prompt: Keep the `k` closest points by distance.
  - Expected pattern or core idea: Max heap of size `k`.
- Title: Find Median from Data Stream
  - One-line prompt: Maintain the median as values stream in.
  - Expected pattern or core idea: Two heaps.

### Hard

- Title: Merge k Sorted Lists
  - One-line prompt: Merge multiple sorted linked lists into one sorted list.
  - Expected pattern or core idea: Min heap over current list heads.
- Title: Sliding Window Median
  - One-line prompt: Return the median for each moving window.
  - Expected pattern or core idea: Two heaps plus lazy deletion.
- Title: IPO
  - One-line prompt: Maximize capital after selecting up to `k` projects.
  - Expected pattern or core idea: Sorted availability plus max heap.

## 7. Short Recap

The core idea of this chapter is that heaps optimize repeated access to the best current candidate without fully sorting everything.

The most important optimization insight is that build-heap, fixed-size heaps, and `PriorityQueue` let you avoid repeated global sorting in top K and streaming tasks.

The most important implementation warning is to remember that heap order is local parent-child order, not complete sorted order.

This chapter prepares the next chapter by showing a tree structure optimized for one kind of lookup before tries optimize prefix-based lookup over strings instead of numeric priority.

## 8. Coverage Check

- [x] 19.1 Min heap and max heap
- [x] 19.2 Heapify and build-heap
- [x] 19.3 PriorityQueue in Java
- [x] 19.4 Heap sort
- [x] 19.5 Top K and streaming problems

Coverage Summary: 5/5 official subtopics covered
This must always be 5/5 before final output

Next: 20: Trie
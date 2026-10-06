# 11: Sorting, Selection, Bit Tricks, and Math Tools

## Introduction and Context

This chapter covers the tools that transform problems once order is imposed. Sorting rearranges data; heaps extract top elements efficiently; bits compress state; math shortcuts solve counting and factorization tasks. Together, they form a toolkit for optimization beyond basic search and recursion.

The central insight is that different problems call for different tools. Some need stable sorting; some need in-place; some need a stream-based selection without full sort. Bit tricks optimize space; math shortcuts optimize counting. Knowing when to reach for each tool is what separates efficient solutions from slow ones.

## Core Intuition and Mechanics

Think of each technique as answering different questions:

- **Sorting**: "How do I impose order to see patterns?"
- **Heaps**: "How do I get the top k elements without sorting the rest?"
- **Merge intervals**: "How do I combine overlapping ranges?"
- **Cyclic sort**: "How do I place elements at their target positions?"
- **Greedy**: "What is the safest local choice?"
- **Bits**: "How do I compress flags into one integer?"
- **Math**: "What shortcuts avoid brute force?"

Each solves a different optimization problem. The art is recognizing which applies.

## Core Concepts and Subtopics

### Concept Cluster: Elementary and Advanced Sorting Algorithms

**Topics in this cluster:**
- 11.1 Bubble sort, selection sort, and insertion sort
- 11.2 Merge sort; Merge sort as a case study; Divide-and-conquer strategy
- 11.3 Quick sort; Quick sort as a case study
- 11.4 Heap sort; Counting sort and radix sort; When to use which sorting algorithm

#### Definition

**Elementary sorts** (bubble, selection, insertion) are O(n²) but teach fundamentals. **Merge sort** is stable and O(n log n) but uses O(n) space. **Quick sort** is average O(n log n), in-place, but unstable and worst-case O(n²). **Counting sort** and **radix sort** are linear on small key ranges.

#### When to Use Which

| Algorithm | Best For |
|-----------|----------|
| Insertion sort | Small arrays or nearly sorted |
| Merge sort | Stable sort required; guaranteed O(n log n) |
| Quick sort | Average performance; in-place needed |
| Counting sort | Keys are small integers |
| Radix sort | Multi-digit keys; linear time needed |

#### Insertion Sort (In-Place, Stable)

```java
public void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}
```

#### Merge Sort (Stable, O(n log n))

```java
public void mergeSort(int[] arr) {
    if (arr.length < 2) return;
    int mid = arr.length / 2;
    int[] left = Arrays.copyOfRange(arr, 0, mid);
    int[] right = Arrays.copyOfRange(arr, mid, arr.length);
    mergeSort(left);
    mergeSort(right);
    merge(arr, left, right);
}

private void merge(int[] arr, int[] left, int[] right) {
    int i = 0, j = 0, k = 0;
    while (i < left.length && j < right.length) {
        arr[k++] = (left[i] <= right[j]) ? left[i++] : right[j++];
    }
    System.arraycopy(left, i, arr, k, left.length - i);
    System.arraycopy(right, j, arr, k, right.length - j);
}
```

#### Quick Sort (In-Place, Unstable)

```java
public void quickSort(int[] arr) {
    quickSort(arr, 0, arr.length - 1);
}

private void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

private int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
            i++;
        }
    }
    int temp = arr[i];
    arr[i] = arr[high];
    arr[high] = temp;
    return i;
}
```

#### Common Mistakes

- Merge sort: forgetting to copy remaining elements.
- Quick sort: choosing worst-case pivot (use randomization or median-of-three).
- Counting sort: forgetting the size of the range.

---

### Concept Cluster: Top K, Heap Pattern, and Streaming

**Topics in this cluster:**
- 11.5 Top K Elements Pattern, Heap Pattern, Top K and streaming problems

#### Definition

Top K asks: find the k largest (or smallest) elements without fully sorting.

#### Why It Matters

Full sort is O(n log n). Using a heap, you can find top k in O(n log k), much faster when k << n.

#### Min Heap Approach (Keep Largest k)

```java
public List<Integer> topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int num : nums) {
        freq.put(num, freq.getOrDefault(num, 0) + 1);
    }
    
    PriorityQueue<Integer> minHeap = new PriorityQueue<>((a, b) -> freq.get(a) - freq.get(b));
    
    for (int num : freq.keySet()) {
        minHeap.offer(num);
        if (minHeap.size() > k) {
            minHeap.poll();
        }
    }
    
    return new ArrayList<>(minHeap);
}
```

**Complexity**: O(n log k).

#### Common Mistakes

- Using max heap (you want min heap to keep only top k).
- Not checking heap size before polling.

---

### Concept Cluster: Merge Intervals, Cyclic Sort, and Greedy Patterns

**Topics in this cluster:**
- 11.6 Merge Intervals Pattern; Sorting by endpoints and overlap normalization; Interval edge cases with touching and nested ranges
- 11.7 Cyclic Sort Pattern; Placement-by-index problems and missing-value tricks; When sorting is the real hidden pattern
- 11.8 Greedy Choice Pattern; Meet in the Middle Pattern; Randomized Algorithm Pattern; Trade-offs between sorting, heap selection, greed, and search splitting
- 11.9 Greedy-choice property; Activity selection; Fractional knapsack; Interval scheduling; Huffman coding; Proving a greedy strategy

#### Merge Intervals

```java
public int[][] merge(int[][] intervals) {
    if (intervals.length == 0) return new int[0][0];
    
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    
    List<int[]> result = new ArrayList<>();
    int[] current = intervals[0];
    
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] <= current[1]) {
            current[1] = Math.max(current[1], intervals[i][1]);
        } else {
            result.add(current);
            current = intervals[i];
        }
    }
    result.add(current);
    
    return result.toArray(new int[0][]);
}
```

#### Cyclic Sort (Place Element at Its Index)

```java
public void cyclicSort(int[] arr) {
    int i = 0;
    while (i < arr.length) {
        int correct = arr[i] - 1;
        if (arr[i] != arr[correct]) {
            int temp = arr[i];
            arr[i] = arr[correct];
            arr[correct] = temp;
        } else {
            i++;
        }
    }
}
```

#### Greedy Activity Selection

```java
public int maxActivities(int[] start, int[] end) {
    // Sort by end time
    Integer[] indices = new Integer[start.length];
    for (int i = 0; i < indices.length; i++) indices[i] = i;
    Arrays.sort(indices, (i, j) -> Integer.compare(end[i], end[j]));
    
    int count = 1;
    int lastEnd = end[indices[0]];
    
    for (int i = 1; i < indices.length; i++) {
        if (start[indices[i]] >= lastEnd) {
            count++;
            lastEnd = end[indices[i]];
        }
    }
    
    return count;
}
```

---

### Concept Cluster: Bitwise Operators and Bit Manipulation

**Topics in this cluster:**
- 11.10 Bitwise operators, Set/clear/toggle bit operations, Counting bits, XOR tricks, Bitmasking basics, Subset and state-encoding patterns

#### Definition

Bit operators work directly on binary representation. XOR cancels pairs. Bitmasking stores yes/no state in one integer.

#### Set, Clear, Toggle Bits

```java
// Set bit k
int set(int num, int k) { return num | (1 << k); }

// Clear bit k
int clear(int num, int k) { return num & ~(1 << k); }

// Toggle bit k
int toggle(int num, int k) { return num ^ (1 << k); }

// Test bit k
boolean testBit(int num, int k) { return (num & (1 << k)) != 0; }

// Count set bits
int countBits(int num) {
    int count = 0;
    while (num > 0) {
        num &= num - 1;
        count++;
    }
    return count;
}
```

#### XOR Trick (Find Unique Element)

```java
int findUnique(int[] arr) {
    int result = 0;
    for (int num : arr) {
        result ^= num;
    }
    return result;
}
```

#### Bitmasking Subsets

```java
List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    for (int mask = 0; mask < (1 << nums.length); mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < nums.length; i++) {
            if ((mask & (1 << i)) != 0) {
                subset.add(nums[i]);
            }
        }
        result.add(subset);
    }
    return result;
}
```

---

### Concept Cluster: Math Tools and Shortcuts

**Topics in this cluster:**
- 11.11 GCD and LCM, Factorization and divisors, Logarithms in algorithm analysis, Fast exponentiation, Modular arithmetic basics, Math shortcuts for interview problems
- 11.12 Closest pair problem, Recurrence thinking and solution structure

#### GCD and LCM

```java
int gcd(int a, int b) {
    return b == 0 ? a : gcd(b, a % b);
}

int lcm(int a, int b) {
    return a / gcd(a, b) * b;
}
```

#### Fast Exponentiation (Modulo)

```java
long power(long base, long exp, long mod) {
    long result = 1;
    base %= mod;
    while (exp > 0) {
        if ((exp & 1) == 1) {
            result = (result * base) % mod;
        }
        base = (base * base) % mod;
        exp >>= 1;
    }
    return result;
}
```

#### Divisors and Factorization

```java
List<Integer> getDivisors(int n) {
    List<Integer> divisors = new ArrayList<>();
    for (int i = 1; i * i <= n; i++) {
        if (n % i == 0) {
            divisors.add(i);
            if (i != n / i) {
                divisors.add(n / i);
            }
        }
    }
    return divisors;
}
```

---

## Worked Examples

### Worked Example 1: Merge Sorted Intervals

**Problem**: Merge overlapping intervals.

**Solution**: Sort by start; extend current interval if overlapping; record when gap appears.

(See Merge Intervals code above.)

---

### Worked Example 2: Top K Frequent Elements

**Problem**: Find k most frequent elements in array.

**Solution**: Count frequencies; use min heap to keep top k.

(See Top K Frequent code above.)

---

### Worked Example 3: Find Missing Number (Cyclic Sort)

**Problem**: Array contains n distinct numbers from 0 to n. Find missing.

**Solution**: Place each number at its index; find position without its target.

```java
public int missingNumber(int[] nums) {
    int i = 0;
    while (i < nums.length) {
        int correct = nums[i];
        if (correct < nums.length && correct != i && nums[correct] != correct) {
            int temp = nums[i];
            nums[i] = nums[correct];
            nums[correct] = temp;
        } else {
            i++;
        }
    }
    
    for (int j = 0; j < nums.length; j++) {
        if (nums[j] != j) return j;
    }
    return nums.length;
}
```

---

## Solved Problems

**Problem 1 (Easy)**: Sort array by frequency.

**Problem 2 (Easy)**: Find missing number using XOR.

**Problem 3 (Medium)**: Merge overlapping intervals.

**Problem 4 (Medium)**: Top k frequent elements.

**Problem 5 (Hard)**: Median of data stream using two heaps.

---

## Recognition Guide

Use sorting when you need to impose order for pattern recognition. Use heaps for top k without full sort. Use bitwise for state compression. Use math for counting without loops.

---

## Comparison Tables

| Tool | Best When | Time Pattern | Main Trade-off |
|---|---|---|---|
| Full sort | You need total order | Usually `O(n log n)` | More work than necessary for top-k only |
| Heap | You need repeated min/max or top k | `O(log k)` or `O(log n)` updates | No full global order |
| Cyclic sort | Values map naturally to indexes | Near-linear | Only works for constrained ranges |
| Bit tricks | State fits in bits | Constant-time state ops | Lower readability |
| Math shortcut | Algebra replaces iteration | Often sublinear | Requires proof and edge-case care |

---

## Design and Decision Making

Choose merge sort if stability matters. Choose quick sort for average performance. Choose counting/radix for small-range keys. Choose heap for streaming top k. Choose bits for state under 64 flags. Choose math for large numbers.

---

## Practical Applications

- Log-processing pipelines use heaps for streaming top-k queries and medians without sorting the full stream.
- Scheduling and calendar systems rely on interval sorting and merge logic to normalize overlaps.
- Compilers, databases, and networking stacks use bit flags for compact state storage and fast checks.
- Cryptography, hashing, simulations, and distributed systems all depend on modular arithmetic and fast exponentiation.

---

## Failure Modes and Trade-offs

Unstable sorts lose original order on duplicates. Heap operations are log n each. Bit tricks are concise but obscure. Math shortcuts require proof of correctness.

---

## Condensed Notes

- Insertion sort: small or nearly sorted.
- Merge sort: stable, guaranteed O(n log n), O(n) space.
- Quick sort: average O(n log n), O(1) space, unstable.
- Counting/radix: linear on small key range.
- Heap: top k in O(n log k).
- Bitwise: set, clear, toggle, XOR, count.
- Math: GCD, fast exponentiation, divisors.

---

## Additional Problems

### Easy

- Sort characters by frequency with a heap or bucket array.
- Find the single non-duplicated number using XOR.

### Medium

- Reorganize string with a max heap and greedy placement.
- Insert and merge a new interval into a sorted interval list.

### Hard

- Sliding window median with two heaps and lazy deletion.
- Closest pair of points using divide and conquer.

---

## Key Questions

1. Which sort is stable?
2. Why is merge sort guaranteed O(n log n)?
3. How does quick sort partition work?
4. When is counting sort better than merge sort?
5. How do you find top k efficiently?
6. What does XOR with all elements do?
7. How do you set a specific bit?
8. What is the formula for GCD?
9. Why does bitmasking encode subsets?
10. When is cyclic sort the right pattern?

---

## Applied Project

Build a data stream analyzer: find top k frequent words in an infinite stream using heaps, track running median, compute statistics (GCD of number sequences), and use bitmasking to represent word-character sets efficiently.


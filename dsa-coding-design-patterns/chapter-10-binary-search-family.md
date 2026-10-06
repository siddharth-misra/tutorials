# 10: Binary Search Family

## Introduction and Context

Binary search is the gateway technique for turning O(n) linear scans into O(log n) logarithmic searches. It works on sorted data (or sorted answer spaces) by repeatedly eliminating half the remaining possibilities.

Many learners memorize one binary search template and struggle when variations appear: finding the first occurrence, the last, or searching for an answer rather than an exact value. The key insight is that all variants share the same core: maintain a shrinking range where the answer is guaranteed to exist, and preserve that invariant with every comparison and pointer move.

This chapter teaches the canonical patterns and the mental model behind them. You will be able to implement classic binary search, lower and upper bound, binary search on answer, and off-by-one-free templates that work reliably on edge cases.

## Core Intuition and Mechanics

Imagine a sorted list of names in a phone book. To find a name, you do not read from the start. You open to the middle. If the target comes before that name alphabetically, discard the right half. Otherwise discard the left half. Repeat until you find the name or confirm it does not exist.

The core model is: maintain a range `[left, right]` where the answer is guaranteed to exist. Every iteration, use one comparison to cut that range in half. The loop continues while the range is non-empty. When it becomes empty, the answer is either found or does not exist.

The most common pitfall is off-by-one errors. Different templates use different loop conditions and pointer updates. The key is to define and maintain one **invariant** clearly.

## Core Concepts and Subtopics

### Concept Cluster: Classic Binary Search, Iterative and Recursive Forms

**Topics in this cluster:**
- 10.1 Binary Search Pattern, Classic binary search, Iterative binary search, Recursive binary search

#### Definition

Binary search finds an exact target in a sorted array in O(log n) time by comparing the middle element and eliminating half the remaining range.

#### Why It Matters

It is the foundation for all other binary search variants and teaches the mental model of "maintained invariant" that transfers to many algorithms.

#### Iterative Binary Search

```java
public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1; // not found
}
```

**Invariant**: If target exists, it is in `[left, right]`.

#### Recursive Binary Search

```java
public int binarySearchRecursive(int[] nums, int target, int left, int right) {
    if (left > right) return -1;
    
    int mid = left + (right - left) / 2;
    if (nums[mid] == target) {
        return mid;
    } else if (nums[mid] < target) {
        return binarySearchRecursive(nums, target, mid + 1, right);
    } else {
        return binarySearchRecursive(nums, target, left, mid - 1);
    }
}
```

#### When to Choose

Iterative is safer (no stack overflow) and preferred in production. Recursive is cleaner for divide-and-conquer thinking.

#### Common Mistakes

- Using `(left + right) / 2` instead of `left + (right - left) / 2` (integer overflow).
- Using `left < right` as the loop condition when `<=` is correct.
- Returning `mid` without checking if the value matches the target.

---

### Concept Cluster: Lower Bound and Upper Bound

**Topics in this cluster:**
- 10.2 Lower bound and upper bound, Lower bound, upper bound, and search invariants

#### Definition

**Lower bound**: first index `i` where `nums[i] >= target`.
**Upper bound**: first index `i` where `nums[i] > target`.

#### Why It Matters

These are reusable for counting duplicates, range queries, and insertion-position problems.

#### Lower Bound Implementation

```java
public int lowerBound(int[] nums, int target) {
    int left = 0, right = nums.length;
    
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
```

**Invariant**: `[0, left)` all < target; `[left, right)` unknown; `[right, n)` all >= target.

#### Upper Bound Implementation

```java
public int upperBound(int[] nums, int target) {
    int left = 0, right = nums.length;
    
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] <= target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    
    return left;
}
```

#### Counting Duplicates with Bounds

```java
int count = upperBound(nums, target) - lowerBound(nums, target);
```

#### Common Mistakes

- Mixing up the comparison operators.
- Using closed intervals `[left, right]` instead of half-open `[left, right)`.
- Returning `mid` instead of the final boundary.

---

### Concept Cluster: Binary Search on Answer and Monotonic Predicates

**Topics in this cluster:**
- 10.3 Binary search on answer, Designing monotonic conditions, Monotonic predicates
- 10.4 Off-by-one handling and termination rules, Template comparison for inclusive and exclusive ranges
- 10.5 Templates, invariants, and edge cases
- 10.6 Binary search as divide and conquer

#### Definition

Binary search on answer searches not an array, but a range of possible answers [min, max]. The answer space must be monotonic: all values below some threshold fail a test, all above pass (or vice versa).

#### Why It Matters

Many optimization problems reduce to "find the smallest X such that condition(X) is true." Binary search makes that O(log(answer range)) instead of O(answer range).

#### Binary Search on Answer Example

**Problem**: Find minimum hours to eat all bananas at eating speed k.

```java
public int minEatingSpeed(int[] piles, int hours) {
    int left = 1, right = maxPile(piles);
    
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (canEatInTime(piles, mid, hours)) {
            right = mid; // try slower (smaller speed does not work)
        } else {
            left = mid + 1;
        }
    }
    
    return left;
}

private boolean canEatInTime(int[] piles, int speed, int hours) {
    int needed = 0;
    for (int pile : piles) {
        needed += (pile + speed - 1) / speed;
    }
    return needed <= hours;
}
```

**Invariant**: speeds in `[1, left)` cannot eat in time; speeds in `[left, right]` unknown; speeds in `(right, max]` can eat in time.

#### Off-by-One Template Comparison

**Inclusive range `[left, right]`, find first true:**

```java
while (left < right) {
    int mid = left + (right - left) / 2;
    if (condition(mid)) {
        right = mid;
    } else {
        left = mid + 1;
    }
}
return left;
```

**Half-open range `[left, right)`, find first true:**

```java
while (left < right) {
    int mid = left + (right - left) / 2;
    if (condition(mid)) {
        right = mid;
    } else {
        left = mid + 1;
    }
}
return left;
```

Both converge to the first true index.

#### Common Mistakes

- Applying binary search to non-monotonic answer spaces (condition is true at position 5, false at 10, true again at 15).
- Using the wrong loop condition or pointer update.
- Not thinking about what the converged `left` and `right` represent.

---

## Worked Examples

### Worked Example 1: Classic Binary Search

**Problem**: Find the index of target in sorted array [1, 3, 5, 7, 9, 11].

**Solution**: Compare middle with target; discard half based on comparison.

```java
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}
```

---

### Worked Example 2: Search for First and Last Occurrence

**Problem**: Find first and last index of target in [5, 7, 7, 8, 8, 10].

**Solution**: Use lower bound and upper bound.

```java
public int[] searchRange(int[] nums, int target) {
    int first = lowerBound(nums, target);
    int last = upperBound(nums, target) - 1;
    
    if (first == nums.length || nums[first] != target) {
        return new int[]{-1, -1};
    }
    return new int[]{first, last};
}

private int lowerBound(int[] nums, int target) {
    int left = 0, right = nums.length;
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

private int upperBound(int[] nums, int target) {
    int left = 0, right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] <= target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;
}
```

---

### Worked Example 3: Binary Search on Answer (Capacity to Ship Packages)

**Problem**: Ship packages within d days with minimum ship capacity.

**Solution**: Binary search on capacity; test if capacity allows shipping in d days.

```java
public int shipWithinDays(int[] weights, int days) {
    int left = maxWeight(weights);
    int right = sumWeights(weights);
    
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (canShip(weights, mid, days)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    
    return left;
}

private boolean canShip(int[] weights, int capacity, int days) {
    int currentLoad = 0, daysNeeded = 1;
    for (int weight : weights) {
        if (currentLoad + weight > capacity) {
            daysNeeded++;
            currentLoad = weight;
        } else {
            currentLoad += weight;
        }
    }
    return daysNeeded <= days;
}
```

---

## Solved Problems

**Problem 1 (Easy)**: Search for target in sorted array; return index or -1.

**Problem 2 (Easy)**: Find first occurrence of target in sorted array.

**Problem 3 (Medium)**: Search insert position (where target would be inserted to keep array sorted).

**Problem 4 (Medium)**: Minimum capacity to ship all packages within d days.

**Problem 5 (Hard)**: Find minimum number of days to make m bouquets with k adjacent flowers each.

---

## Recognition Guide

Use binary search when:
- The input is sorted or the answer space is monotonic.
- Brute force O(n) is too slow and O(log n) is acceptable.

Avoid when:
- The space is not monotonic (jumbled up and down).
- The invariant is unclear.

---

## Comparison Tables

| Variant | Goal | Range Style | Return Value |
|---|---|---|---|
| Classic binary search | Exact match | Usually closed `[left, right]` | Index or `-1` |
| Lower bound | First `>= target` | Often half-open `[left, right)` | Insertion position |
| Upper bound | First `> target` | Often half-open `[left, right)` | Boundary after duplicates |
| Binary search on answer | First feasible value | Integer or answer interval | Minimum or maximum valid answer |

---

## Design and Decision Making

Always state the loop invariant before coding. Decide: inclusive or half-open ranges? Are you searching for exact match, first true, or last true? Different invariants lead to different templates.

---

## Practical Applications

- Databases use lower-bound style logic for index seeks, pagination anchors, and range filtering.
- Capacity planning and scheduling problems often use binary search on answer to find the smallest feasible throughput or budget.
- Search features use upper and lower bounds to find all duplicates or prefix-matching ranges in sorted arrays.
- Performance-sensitive code prefers iterative binary search because it is branch-light, predictable, and avoids recursion overhead.

---

## Failure Modes and Trade-offs

Off-by-one errors are subtle. Test edge cases: target at position 0, at n-1, not found, single element, all same. Always compute `mid` safely.

---

## Condensed Notes

- Iterative safer than recursive.
- Invariant: answer is in `[left, right]`.
- Lower bound: first >= target.
- Upper bound: first > target.
- Binary search on answer: test monotonic condition.

---

## Additional Problems

### Easy

- Find the floor or ceiling of a target in a sorted array.
- Return the count of a target using lower and upper bound.

### Medium

- Search a rotated sorted array with no duplicates.
- Find the minimum element in a rotated sorted array.

### Hard

- Median of two sorted arrays using partition-based binary search.
- Split array largest sum via binary search on answer.

---

## Key Questions

1. Why use `left + (right - left) / 2` instead of `(left + right) / 2`?
2. When is `left < right` vs `left <= right`?
3. How do lower and upper bound differ?
4. What is a monotonic answer space?
5. How do you prove binary search correctness?
6. When should you use binary search on answer?
7. What happens if left and right never meet?
8. How do you handle duplicates?
9. What is the time complexity and why?
10. How do you convert between inclusive and half-open ranges?

---

## Applied Project

Build a coding problem difficulty estimator: use binary search on the difficulty range to estimate the minimum difficulty level at which a solution passes all test cases; test your estimator against real problem data.


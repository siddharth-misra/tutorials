# 6: Two Pointers

**Goal:** Teach learners how to solve linear-time problems by moving two indexes deliberately instead of restarting scans or using nested loops.
**Outcome:** By the end of this chapter, you can recognize when opposite-direction, same-direction, fast-and-slow, or partition-style pointer movement removes repeated work, and you can explain the invariant that makes each pattern correct.

---

## 1. Intuition First

Two pointers means you track two positions in the same structure and let their movement encode the algorithm.

A simple real-world analogy is searching a long shelf with two markers. Sometimes one marker starts at the left end and the other at the right end. Sometimes both move left to right, but at different roles: one reads and one writes. Sometimes one moves twice as fast as the other to detect a cycle or a meeting point.

The core mental model is that each pointer move must eliminate impossible answers or preserve a useful invariant. This is why two-pointer solutions are fast. They do not re-check large regions once the movement rule proves those regions cannot help.

The most common beginner confusion point is thinking two pointers is just "use variables named `left` and `right`." That is not the pattern. The real pattern is controlled movement with a reason for every move.

In the roadmap, this chapter is the bridge from basic scanning to stronger pattern recognition. Once you can justify pointer motion, you are ready for sliding windows, linked-list pointer manipulation, and many interview array problems.

## 2. Core Concepts and Techniques

### Concept Cluster: Opposite-Direction and Same-Direction Pointers
Key concepts in this block:
- 6.1 Opposite-direction pointers
- 6.2 Same-direction pointers

#### Intuition

Opposite-direction pointers start from different ends and move inward. Same-direction pointers both move left to right, but they represent different roles, such as "read here" and "write here."

#### Why It Matters

These two forms solve a large share of linear array and string problems without extra nested loops.

#### How It Works

Opposite-direction pointers fit when:
- the array is sorted and you need a pair or a comparison
- you compare symmetric positions, such as palindrome checks
- moving one side can safely eliminate a region

Same-direction pointers fit when:
- you are compacting valid elements forward
- duplicates or unwanted values must be skipped
- one boundary marks processed output while the other explores input

#### Java Implementation Notes

- Use descriptive names like `left`, `right`, `readIndex`, and `writeIndex`.
- Write the invariant in plain language before the loop if the logic feels subtle.
- Be precise about whether a pointer move happens before or after using the current value.

#### Common Mistakes

- moving both pointers when only one should move
- forgetting the array must often be sorted for opposite-direction pair logic
- updating the write pointer before the placement is complete
- letting the read and write regions overlap without understanding why it is safe

#### Quick Example

```java
class OppositePointerQuickExample {
    static boolean hasPairWithTargetSum(int[] sortedValues, int target) {
        int left = 0;
        int right = sortedValues.length - 1;

        while (left < right) {
            int sum = sortedValues[left] + sortedValues[right];
            if (sum == target) {
                return true;
            }
            if (sum < target) {
                left++;
            } else {
                right--;
            }
        }

        return false;
    }
}
```

#### Debugging Tip

Print both pointer positions and the current window after each move. If the algorithm fails, the first unjustified move is usually the real bug.

#### Advanced Note

The difference between opposite-direction and same-direction pointers is not cosmetic. It changes what facts each movement step can safely eliminate.

### Concept Cluster: Fast and Slow Pointer Technique and Recognition
Key concepts in this block:
- 6.3 Fast and slow pointer technique
- 6.5 Recognizing two-pointer problems

#### Intuition

Fast and slow pointers traverse the same state space at different speeds. If a cycle exists, the fast one eventually catches the slow one.

#### Why It Matters

This gives you cycle detection or middle-position discovery without extra memory. It also trains you to think about movement rules rather than just positions.

#### How It Works

Recognition signals for two pointers:
- the input is already sorted or can be treated as ordered
- you care about pairs, symmetry, or contiguous regions
- the answer can be improved or validated by moving one boundary at a time
- you want in-place updates instead of extra arrays
- you want to detect cycles or repeated states without a set

Fast-and-slow specifically fits when:
- a structure may contain a cycle
- repeated state transitions define a hidden cycle
- you need a middle position in one traversal

#### Java Implementation Notes

- Keep the transition logic in a helper method when the next state is not obvious.
- Guard loop conditions carefully so fast movement never reads beyond valid state.
- For state-transition problems, name the helper something like `nextState` or `nextValue`.

#### Common Mistakes

- using fast-and-slow when a normal window is the real pattern
- forgetting that opposite-direction pointer logic often needs sorted data
- moving the wrong pointer after comparing two values
- failing to justify why a movement step cannot skip the answer

#### Quick Example

```java
class MiddleIndexQuickExample {
    static int middleIndex(int[] values) {
        int slow = 0;
        int fast = 0;

        while (fast < values.length - 1) {
            slow++;
            fast += 2;
        }

        return slow;
    }
}
```

#### Debugging Tip

State the invariant in a sentence before coding. For example: "All values before `writeIndex` are already in their final kept order." That sentence often prevents wrong pointer updates.

#### Advanced Note

Fast-and-slow pointers are really cycle reasoning in disguise. Later chapters apply the same idea to linked lists more directly.

### Concept Cluster: Partitioning and Rearrangement
Key concepts in this block:
- 6.4 Partitioning and rearrangement

#### Intuition

Partitioning divides the data into regions such as valid and invalid, small and large, zero and non-zero, or processed and unprocessed.

#### Why It Matters

Many interview problems are not about finding an answer separately from the array. They are about reshaping the array in place while preserving some ordering rule.

#### How It Works

Typical partition layout:
- left side already satisfies the target property
- middle is the unexplored region
- right side is either unexplored or already classified differently

Rearrangement problems usually become simpler once you write down what each region means before the loop starts.

#### Java Implementation Notes

- Swapping is often safer than repeated shifting when order does not matter.
- Overwriting with a write pointer is often cleaner when order must be preserved.
- Do not mix stable and unstable rearrangement ideas by accident.

#### Common Mistakes

- not deciding whether relative order must be preserved
- swapping too early and destroying an unprocessed value
- forgetting to handle already-correct elements
- changing both ends of a partition when only one boundary should move

#### Quick Example

```java
class ParityPartitionQuickExample {
    static void moveEvenNumbersFirst(int[] values) {
        int writeIndex = 0;
        for (int readIndex = 0; readIndex < values.length; readIndex++) {
            if (values[readIndex] % 2 == 0) {
                int temporary = values[writeIndex];
                values[writeIndex] = values[readIndex];
                values[readIndex] = temporary;
                writeIndex++;
            }
        }
    }
}
```

#### Debugging Tip

Draw the array as regions, not just raw values. If you cannot label the regions clearly, the implementation is probably not ready yet.

#### Advanced Note

Partition problems are often one small invariant away from being simple. Without that invariant, they feel messy and ad hoc.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Pair Sum in a Sorted Array
#### Problem Statement

Given a sorted array and a target value, return the indexes of two numbers whose sum equals the target. If no such pair exists, return `[-1, -1]`.

#### Why This Example Matters

It is the classic opposite-direction two-pointer problem. It shows exactly how pointer movement eliminates impossible pairs.

#### Constraints or Assumptions

- the array is sorted in non-decreasing order
- exactly one valid pair may or may not exist
- indexes are zero-based for this chapter

#### Brute-Force Approach

Try every pair with nested loops and return the first matching pair.

This is simple, but it costs `O(n^2)` time.

#### Better Approach

Start one pointer at the left end and one at the right end. Compare their sum with the target.

#### Why the Better Approach Works

Because the array is sorted:
- if the sum is too small, the left pointer must move right to increase it
- if the sum is too large, the right pointer must move left to decrease it

No skipped pair can become valid once the sorted order rules out that region.

#### Pragmatic Java Choice

Two integer indexes and one loop are enough. No extra collection is needed because sorted order already gives the structure.

#### Java Solution

```java
class SortedTwoSumExample {
    static int[] twoSumBruteForce(int[] values, int target) {
        for (int left = 0; left < values.length; left++) {
            for (int right = left + 1; right < values.length; right++) {
                if (values[left] + values[right] == target) {
                    return new int[]{left, right};
                }
            }
        }
        return new int[]{-1, -1};
    }

    static int[] twoSumOptimized(int[] values, int target) {
        int left = 0;
        int right = values.length - 1;

        while (left < right) {
            int sum = values[left] + values[right];
            if (sum == target) {
                return new int[]{left, right};
            }
            if (sum < target) {
                left++;
            } else {
                right--;
            }
        }

        return new int[]{-1, -1};
    }
}
```

#### Dry Run

Use `values = [1, 2, 4, 6, 10, 12]` and `target = 16`.

Optimized approach:
- `left = 0`, `right = 5`, sum is `13`, too small -> move `left`
- `left = 1`, `right = 5`, sum is `14`, too small -> move `left`
- `left = 2`, `right = 5`, sum is `16`, match found -> return `[2, 5]`

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(1)` extra space
- Better approach: `O(n)` time, `O(1)` extra space

#### Edge Cases

- empty or one-element array -> no pair exists
- negative values still work as long as the array is sorted
- duplicate values can still form the answer if indexes are different

#### Common Mistakes

- applying the method to an unsorted array
- moving both pointers after one comparison
- returning values instead of indexes when the problem asks for indexes

### Worked Example 2: Move Zeroes to the End
#### Problem Statement

Given an integer array, move all zeroes to the end while keeping the relative order of the non-zero values.

#### Why This Example Matters

It is one of the cleanest same-direction pointer and partitioning problems. One pointer reads, one pointer writes, and the invariant is easy to inspect.

#### Constraints or Assumptions

- the operation should modify the array in place
- the relative order of non-zero elements must remain unchanged
- zeroes may already be at the end

#### Brute-Force Approach

Build a temporary array. Copy all non-zero values into it, then fill the remaining positions with zeroes, and copy the result back.

This is correct, but it uses extra memory.

#### Better Approach

Use a `readIndex` to scan the array and a `writeIndex` to mark where the next non-zero value should go.

#### Why the Better Approach Works

At every step, all positions before `writeIndex` already contain the kept non-zero values in the correct order. The remaining region is either unexplored or safely swappable.

#### Pragmatic Java Choice

An in-place write-pointer solution is clearer here than repeated shifting. It is linear and preserves order.

#### Java Solution

```java
class MoveZeroesExample {
    static void moveZeroesBruteForce(int[] values) {
        int[] copy = new int[values.length];
        int writeIndex = 0;

        for (int value : values) {
            if (value != 0) {
                copy[writeIndex++] = value;
            }
        }

        while (writeIndex < copy.length) {
            copy[writeIndex++] = 0;
        }

        System.arraycopy(copy, 0, values, 0, values.length);
    }

    static void moveZeroesOptimized(int[] values) {
        int writeIndex = 0;

        for (int readIndex = 0; readIndex < values.length; readIndex++) {
            if (values[readIndex] != 0) {
                int temporary = values[writeIndex];
                values[writeIndex] = values[readIndex];
                values[readIndex] = temporary;
                writeIndex++;
            }
        }
    }
}
```

#### Dry Run

Use `values = [0, 1, 0, 3, 12]`.

Optimized approach:
- `readIndex = 0`, value `0`, do nothing
- `readIndex = 1`, value `1`, swap with `writeIndex = 0` -> `[1, 0, 0, 3, 12]`, `writeIndex = 1`
- `readIndex = 2`, value `0`, do nothing
- `readIndex = 3`, value `3`, swap with `writeIndex = 1` -> `[1, 3, 0, 0, 12]`, `writeIndex = 2`
- `readIndex = 4`, value `12`, swap with `writeIndex = 2` -> `[1, 3, 12, 0, 0]`

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(n)` extra space
- Better approach: `O(n)` time, `O(1)` extra space

#### Edge Cases

- all zeroes -> unchanged
- no zeroes -> unchanged
- empty array -> unchanged

#### Common Mistakes

- breaking relative order accidentally
- using repeated left shifts and turning a linear task into a slower one
- incrementing `writeIndex` even when the read value is zero

### Worked Example 3: Happy Number
#### Problem Statement

Starting from a positive integer, repeatedly replace the number with the sum of the squares of its digits. Return `true` if the process reaches `1`, otherwise return `false`.

#### Why This Example Matters

It is a strong transfer example for fast-and-slow pointers because the state space behaves like a hidden linked structure without actually using linked lists.

#### Constraints or Assumptions

- input is a positive integer
- the process either reaches `1` or falls into a cycle

#### Brute-Force Approach

Keep a `HashSet` of previously seen values. If the process repeats a value before reaching `1`, a cycle exists.

This is correct, but it uses extra memory.

#### Better Approach

Use a slow pointer that advances one transformation at a time and a fast pointer that advances two transformations at a time.

#### Why the Better Approach Works

If the process enters a cycle, fast and slow eventually meet inside it. If the fast pointer reaches `1`, the process is happy.

#### Pragmatic Java Choice

Keep the state transition in a helper method. The main loop becomes much easier to reason about when `nextValue` is isolated.

#### Java Solution

```java
import java.util.HashSet;
import java.util.Set;

class HappyNumberExample {
    static int nextValue(int value) {
        int result = 0;
        while (value > 0) {
            int digit = value % 10;
            result += digit * digit;
            value /= 10;
        }
        return result;
    }

    static boolean isHappyBruteForce(int value) {
        Set<Integer> seen = new HashSet<>();
        while (value != 1 && seen.add(value)) {
            value = nextValue(value);
        }
        return value == 1;
    }

    static boolean isHappyOptimized(int value) {
        int slow = value;
        int fast = nextValue(value);

        while (fast != 1 && slow != fast) {
            slow = nextValue(slow);
            fast = nextValue(nextValue(fast));
        }

        return fast == 1;
    }
}
```

#### Dry Run

Use `value = 19`.

Optimized approach:
- slow starts at `19`, fast starts at `82`
- next states: `19 -> 82 -> 68 -> 100 -> 1`
- the fast pointer reaches `1`, so return `true`

For a non-happy number like `2`, the sequence enters a repeating cycle and slow and fast eventually meet.

#### Time and Space Complexity

- Brute force: `O(t)` time and `O(t)` space, where `t` is the number of generated states before termination or repetition
- Better approach: `O(t)` time and `O(1)` extra space

#### Edge Cases

- `1` is already happy
- single-digit values may or may not be happy
- the state sequence quickly shrinks, but the cycle logic still matters

#### Common Mistakes

- forgetting to advance the fast pointer twice
- mixing up the current number with the next transformed value
- using this pattern when a normal visited-set solution would be clearer for a different problem shape

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- brute-force pair checking often costs `O(n^2)`
- two-pointer scans often reduce that to `O(n)`
- same-direction compaction usually keeps `O(n)` time while dropping extra space from `O(n)` to `O(1)`
- fast-and-slow pointers often trade extra memory for a more subtle invariant

Choose the simpler baseline when:
- the input is very small
- the invariant is not yet clear and you need a correctness reference
- the problem does not actually allow safe pointer elimination

Choose two pointers when:
- sorted order or symmetry lets one movement eliminate many impossible states
- the task is about keeping or discarding elements in place
- a contiguous region is expanding or shrinking
- repeated states form a cycle you can traverse

Recognition signals for two-pointer techniques:
- sorted array pair problems
- palindrome or symmetric comparisons
- remove duplicates, move zeroes, or stable compaction tasks
- partitioning by a condition
- cycle detection without extra memory

Signals not to force this technique:
- the problem is really about arbitrary key lookup, where hashing fits better
- the data is not ordered and pointer movement does not eliminate anything
- the best state is not attached to boundaries or positions

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- wrong pointer movement after comparison
- broken loop conditions that skip the last valid case
- treating a non-sorted problem as if opposite-direction logic were safe
- losing order during in-place rearrangement

Off-by-one and boundary risks:
- `left < right` versus `left <= right`
- when the write pointer should advance
- whether the fast pointer still has room to move twice
- empty arrays and single-element arrays

Mutation and stale-state risks:
- swapping values that are still needed later
- overwriting the write region before reading the current value
- reusing temporary state across test cases without resetting it

Short debugging checklist:
- What does each pointer represent right now?
- Why is this pointer move safe?
- What region is already solved after each iteration?
- Does this approach rely on sorted order or another property I have not guaranteed?
- If I stop the loop now, what cases remain unprocessed?

## 6. Practice Problems

### Easy

- Title: Valid Palindrome
  - One-line prompt: Return whether a string reads the same forward and backward after ignoring punctuation and case.
  - Expected pattern or core idea: Opposite-direction pointers on normalized comparison.
- Title: Remove Duplicates from Sorted Array
  - One-line prompt: Keep one copy of each value in a sorted array and return the new logical length.
  - Expected pattern or core idea: Same-direction read and write pointers.
- Title: Merge Strings Alternately
  - One-line prompt: Build a string by alternating characters from two inputs.
  - Expected pattern or core idea: Coordinated same-direction traversal.

### Medium

- Title: Container With Most Water
  - One-line prompt: Choose two lines that trap the maximum area.
  - Expected pattern or core idea: Opposite-direction pointers with elimination logic.
- Title: 3Sum
  - One-line prompt: Return all unique triplets whose sum is zero.
  - Expected pattern or core idea: Sorting plus a fixed index and inner two-pointer scan.
- Title: Sort Colors
  - One-line prompt: Rearrange an array of `0`, `1`, and `2` in one pass.
  - Expected pattern or core idea: Partitioning with multiple regions.

### Hard

- Title: Trapping Rain Water
  - One-line prompt: Compute how much water is trapped after raining.
  - Expected pattern or core idea: Opposite-direction pointers with running boundary maxima.
- Title: Find the Duplicate Number
  - One-line prompt: Find the repeated value without modifying the array and using constant extra space.
  - Expected pattern or core idea: Fast-and-slow pointer cycle interpretation.
- Title: Shortest Unsorted Continuous Subarray
  - One-line prompt: Find the smallest window that must be sorted so the full array becomes sorted.
  - Expected pattern or core idea: Boundary reasoning and pointer-based scans.

## 7. Short Recap

The core idea of this chapter is that pointer movement can replace repeated scanning when each move preserves a clear invariant.

The most important optimization insight is that sorted order, symmetry, compaction, and cycle structure often let you reduce `O(n^2)` work to `O(n)`.

The most important implementation warning is to justify every pointer move. If you cannot explain why moving one side is safe, the algorithm is probably not correct yet.

This chapter prepares the next chapter by turning two moving boundaries into full sliding windows with explicit state such as sums and frequency counts.

## 8. Coverage Check

- [x] 6.1 Opposite-direction pointers
- [x] 6.2 Same-direction pointers
- [x] 6.3 Fast and slow pointer technique
- [x] 6.4 Partitioning and rearrangement
- [x] 6.5 Recognizing two-pointer problems

Coverage Summary: 5/5 official subtopics covered
This must always be 5/5 before final output

Next: 7: Sliding Window
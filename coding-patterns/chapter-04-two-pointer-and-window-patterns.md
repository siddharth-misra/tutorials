# 4: Two-Pointer and Window Patterns

## 0. Introduction

This chapter sits in Part I - Pattern Foundations and Linear Thinking (Weeks 1-4), with the roadmap treating it as beginner to intermediate work. Its goal is to learn how to solve linear-scan problems by moving one or more pointers with a clear invariant instead of restarting work with nested loops. This chapter directly supports the Part I outcome of explaining why a linear scan can replace a naive nested-loop approach when the problem's structure permits pointer movement.

Read it as a bridge in the larger sequence. Chapter 3 taught how to carry remembered state across a linear scan with maps and prefix data. This chapter teaches how to carry moving boundaries across a linear scan. Chapter 5 shifts from pointer-managed scans to stateful simulations built on stacks, queues, and monotonic structures. Start this chapter after you are comfortable with Chapters 1 through 3, comfort with arrays and strings, and basic reasoning about loop invariants and boundary checks. The main themes here are Two Pointers Pattern, Sliding Window Pattern, Fast and Slow Pointer Pattern, In-Place Reversal Pattern, Partitioning, shrinking, and expanding workflows, and Recognition checklist for linear-scan problems.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to apply two pointers, sliding windows, fast and slow pointers, and in-place reversal; explain partitioning, shrinking, and expanding workflows; and recognize when a linear scan is valid and when it is not.

## 1. Intuition First

This chapter matters because many problems do not need more memory. They need better movement. A brute-force solution often restarts a scan from scratch for every starting point. Pointer-based patterns avoid that restart by making every movement meaningful.

The simplest analogy is adjusting two hands on a measuring tape. If the tape is already laid out in order, you do not walk back to the beginning after every observation. You slide the ends inward or outward based on what the current measurement tells you.

The core mental model is that pointers mark the part of the input that still matters. Every time you move a pointer, you must be able to say what impossible states were safely discarded.

Recognition signals for this chapter:

- sorted arrays with pair or triplet conditions
- longest or shortest contiguous subarray or substring
- in-place modification of a sequence from both ends
- linked-structure tasks involving middle, cycle, or pace difference
- partitioning data into processed, active, and unprocessed regions

The most common beginner confusion point is moving pointers because the code "looks like the template" rather than because the invariant proves the move is safe. Pointer movement without a proof turns linear-time code into fragile guesswork.

In the larger roadmap, this chapter completes Part I by adding dynamic boundaries to the remembered-state ideas from the previous chapter. Together, these patterns form the core of many early interview problems.

## 2. Learning Path and Recognition Checklist

The chapter begins with two pointers on ordered data, where movement rules are easiest to justify. It then broadens into sliding windows, where the active region grows and shrinks dynamically under a validity condition. Next it covers fast and slow pointers, where different movement speeds reveal hidden structure such as cycles or middle positions. After that, it shows in-place reversal as a precise two-pointer swap workflow. The chapter finishes with partitioning logic and a checklist for deciding whether a linear scan is truly justified.

Recognition checklist for this chapter:

- Is the input sorted, or can pointer movement still be justified by some monotonic property?
- Is the target property about a contiguous segment rather than an arbitrary subset?
- Does the algorithm need to maintain a valid window while expanding and shrinking?
- Do two positions moving at different speeds reveal structure more cheaply than extra memory?
- Can elements be safely swapped in place from the ends inward?
- Does the scan divide the input into processed, active, and unprocessed zones?
- Can every pointer move be explained as discarding impossible states?

The brute-force baseline is usually one of these:

- nested loops for every pair or every substring
- rescanning from scratch after each left boundary change
- using extra memory to reverse or track visited states when pointer pace would be enough

The optimization in this chapter is not magic. It is simply disciplined movement under a maintained invariant.

Mastery by the end of the chapter looks like this: you can point to each index variable in a solution and explain what region it controls, what condition it maintains, and why its next move is logically safe.

Do not force these patterns when the data lacks the needed order, when the problem is not contiguous, or when updates break the monotonic reasoning that pointer movement depends on.

## 3. Official Subtopic Coverage

### Concept Cluster: Pointer Motion on Ordered or Linked Structure
Official subtopics covered:
- 4.1 Two Pointers Pattern
- 4.3 Fast and Slow Pointer Pattern

#### Definition or Framing
The Two Pointers Pattern uses two indices that move through the data according to a rule derived from order or structure. The Fast and Slow Pointer Pattern uses two references moving at different speeds to expose information that a single pass cannot reveal as cleanly, such as cycles or middle positions.

#### Recognition Signals
- sorted array with pair, triplet, or range condition
- need to remove duplicates or compress an ordered sequence
- need the middle of a linked list
- need to detect a cycle without extra memory

#### Brute-Force Baseline
- try every pair with nested loops
- store all visited nodes in a set for cycle detection
- count the linked list length and then rescan for the middle

#### Optimized Pattern Idea
Move pointers instead of restarting scans. Sorted order lets one pointer move inward based on whether the current sum is too small or too large. Different pointer speeds create relative motion that reveals hidden structure.

#### Invariant / State Representation / Transition Logic
For opposite-direction two pointers, the answer, if it exists, remains inside the current pointer interval. For fast and slow pointers, the slow pointer advances one step per loop, while the fast pointer advances two. Their relative pace either reaches the middle or causes an eventual meeting inside a cycle.

#### Java Implementation Notes
- use `while (left < right)` for opposite-direction scans
- guard linked-list pointer access with `fast != null && fast.next != null`
- keep pointer updates small and symmetric so the invariant is easy to audit

#### Quick Dry Run
In a sorted pair-sum problem, if `numbers[left] + numbers[right]` is too small, moving `right` inward cannot help because all values left of `right` are even smaller or equal. So only `left++` is safe.

In cycle detection, if a cycle exists, a fast pointer eventually laps a slow pointer inside the cycle, so they meet.

#### Common Mistakes
- using two pointers on unsorted input without a supporting property
- moving both pointers when only one move is justified
- forgetting the null guard on the fast pointer
- assuming fast and slow pointers solve all linked-list tasks automatically

#### Debugging Strategy
Print pointer positions and the values they reference on a tiny case. If you cannot explain why the next move discards only impossible states, the movement rule is wrong.

#### Comparison with Similar Pattern
Two pointers use order or monotonic structure to cut away impossible states. Hashing uses extra memory to answer lookup questions directly. Both can reduce nested loops, but their proofs are different.

#### Advanced Note
Later chapters will use these same motion ideas inside partitioning routines, cycle-based array problems, and tree or graph preprocessing workflows.

### Concept Cluster: Dynamic Windows and In-Place Reversal
Official subtopics covered:
- 4.2 Sliding Window Pattern
- 4.4 In-Place Reversal Pattern

#### Definition or Framing
The Sliding Window Pattern maintains a contiguous active segment while moving through the sequence. The In-Place Reversal Pattern swaps mirrored positions inside a range until the range is reversed.

#### Recognition Signals
- longest or shortest substring or subarray satisfying a condition
- contiguous segment with a count or frequency constraint
- need to reverse characters or values without extra memory
- repeated rescans of overlapping contiguous regions

#### Brute-Force Baseline
- enumerate every substring or subarray and test validity
- create a new reversed copy instead of swapping in place

#### Optimized Pattern Idea
For sliding windows, expand the right boundary to include new information and shrink the left boundary only when the invariant is broken or when you want a smaller valid window. For reversal, swap ends inward until the pointers cross.

#### Invariant / State Representation / Transition Logic
In a window problem, define what "valid" means. The active segment must satisfy that definition whenever the algorithm records an answer. In reversal, everything outside `[left, right]` is already in final reversed position, and everything inside is still pending.

#### Java Implementation Notes
- use a frequency map or array when window validity depends on counts
- shrink the window in a `while` loop when one expansion can make the state invalid repeatedly
- write a small `swap` helper when reversing arrays for readability

#### Quick Dry Run
For longest substring without repeating characters, expand right one character at a time. If a duplicate appears, move left until the duplicate is removed and the window is valid again.

For reversing `['h', 'e', 'l', 'l', 'o']`, swap positions `(0, 4)` then `(1, 3)`. Pointer `2` does not need to move because the middle element stays in place.

#### Common Mistakes
- recording answers when the window is still invalid
- shrinking only once when multiple shrinks are needed
- confusing subsequence problems with contiguous window problems
- using extra arrays when the task explicitly wants in-place mutation

#### Debugging Strategy
At each step, print the window boundaries, the tracked counts, and whether the validity condition currently holds. For reversal, print the array after each swap on a tiny case.

#### Comparison with Similar Pattern
Sliding windows manage a live contiguous region. Prefix sums summarize the entire prefix and answer range questions from stored accumulation. Reversal is a fixed-structure inward scan, not a validity-driven window.

#### Advanced Note
Some advanced window problems track "at most" and derive "exactly" from subtraction. That idea becomes important later, but the core discipline is still expand, validate, shrink, and record.

### Concept Cluster: Partitioning, Shrinking, Expanding, and Recognition
Official subtopics covered:
- 4.5 Partitioning, shrinking, and expanding workflows
- 4.6 Recognition checklist for linear-scan problems

#### Definition or Framing
Partitioning workflows divide the input into zones with known meaning, such as processed versus unprocessed, or less-than versus unknown versus greater-than. Shrinking and expanding workflows decide when boundaries move and what each move means.

#### Recognition Signals
- need to group elements by a predicate in one pass
- valid region grows until a rule breaks, then contracts
- current pointer examines an unknown region while left and right boundaries store classified regions
- the problem asks for the best contiguous segment under a dynamic constraint

#### Brute-Force Baseline
- sort the entire array when a one-pass partition would do
- restart scanning from every new left boundary
- create multiple intermediate arrays to represent zones

#### Optimized Pattern Idea
Assign a meaning to every region and move only the pointer whose rule is triggered. For partitioning, maintain explicit zones. For shrinking and expanding windows, adjust the correct boundary in the correct order.

#### Invariant / State Representation / Transition Logic
Typical partition invariant:

- left side already satisfies condition A
- middle zone is currently being examined
- right side already satisfies condition B

Typical expand-shrink invariant:

- expanding adds information
- shrinking restores validity or improves optimality
- every element enters the active region once and leaves it at most once

#### Java Implementation Notes
- use descriptive variable names such as `left`, `right`, `current`, `windowStart`, `windowEnd`
- process the swapped-in element carefully in partition routines; do not advance blindly after every swap
- keep mutation order consistent so the region meanings stay true

#### Quick Dry Run
In a three-way partition problem such as sorting values `0`, `1`, and `2`, maintain three zones: already placed low values, current unknown values, and already placed high values. When a high value is swapped in from the right, the current pointer must recheck the new element before advancing.

#### Common Mistakes
- advancing the scan pointer after every swap even when the incoming value is unclassified
- shrinking a window before recording a valid answer in minimum-window problems
- failing to state what each zone means before coding

#### Debugging Strategy
Write the region meanings in comments or notes before coding. During debugging, print the boundaries and label each region on a tiny example.

#### Comparison with Similar Pattern
Partitioning is not the same as general sorting. It uses a small number of categories and a stronger invariant to avoid unnecessary order work.

#### Advanced Note
Partitioning logic later appears inside quickselect, Dutch National Flag style scans, and some greedy interval workflows.

## 4. Pattern Template, State Model, or Core Workflow

Canonical opposite-direction two-pointer template:

```java
int left = 0;
int right = values.length - 1;

while (left < right) {
    int state = evaluate(values[left], values[right]);
    if (state == 0) {
        // answer found
    } else if (state < 0) {
        left++;
    } else {
        right--;
    }
}
```

Canonical sliding-window template:

```java
int left = 0;
for (int right = 0; right < values.length; right++) {
    add(values[right]);

    while (windowIsInvalid()) {
        remove(values[left]);
        left++;
    }

    recordAnswer(left, right);
}
```

Canonical fast-and-slow template:

```java
ListNode slow = head;
ListNode fast = head;

while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
```

Canonical in-place reversal template:

```java
int left = 0;
int right = values.length - 1;
while (left < right) {
    swap(values, left, right);
    left++;
    right--;
}
```

Important variables and state meanings:

- `left`, `right`: active boundaries or mirrored positions
- `slow`, `fast`: same structure, different pace
- frequency state inside a window: the reason a window is valid or invalid
- classified zones in partition problems: processed left, active middle, processed right

Safety rules:

- every pointer move must be justified by the invariant
- record answers only when the window meaning says the segment is valid
- guard fast-pointer access before jumping two steps
- after swaps in partition code, ask whether the new current element has been classified yet

What usually breaks first is update order. A valid idea fails when the code expands before counting, shrinks too early, or advances a pointer whose new state has not been interpreted yet.

Adapt the template when the condition is about counts, distinct values, or a min/max objective, but keep the movement logic disciplined.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Two Sum II on a Sorted Array
#### Problem Statement
Given a 1-indexed array of integers sorted in non-decreasing order, find two numbers such that they add up to a specific target number and return their 1-based indices.

#### Why This Example Matters
This is the cleanest first example of opposite-direction two pointers on ordered data.

#### Input and Constraints
- array is sorted
- exactly one solution exists
- no extra array is needed

#### Recognition Signals
- pair condition
- sorted input
- one valid pair inside an ordered range

#### Brute-Force Approach
Try every pair with nested loops.

#### Better Pattern-Based Approach
Place one pointer at each end and move inward based on whether the current sum is too small or too large.

#### Why the Pattern Fits
Sorted order makes pointer movement informative. Each move discards only impossible pairs.

#### Invariant or State Transition
If the current sum is too small, no pair using the current left value with any smaller right value can work, so `left++` is safe. The reverse logic makes `right--` safe when the sum is too large.

#### Pragmatic Java Choice
Use two integer indices and a `while` loop. No map is needed because the sorted order supplies the needed structure.

#### Dry Run Before Code
For `[2, 3, 4, 8, 11]` and target `12`:

- `(2, 11)` gives `13`, too large, move right leftward
- `(2, 8)` gives `10`, too small, move left rightward
- `(3, 8)` gives `11`, too small, move left rightward
- `(4, 8)` gives `12`, found

#### Java Solution
```java
public class TwoSumSorted {
    public int[] twoSum(int[] numbers, int target) {
        int left = 0;
        int right = numbers.length - 1;

        while (left < right) {
            int sum = numbers[left] + numbers[right];

            if (sum == target) {
                return new int[] {left + 1, right + 1};
            }

            if (sum < target) {
                left++;
            } else {
                right--;
            }
        }

        throw new IllegalArgumentException("Input guarantees one valid answer");
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n^2)$ time, $O(1)$ extra space
- Two pointers: $O(n)$ time, $O(1)$ extra space

#### Edge Cases
- duplicate values
- negative numbers
- smallest and largest values forming the answer

#### Common Mistakes
- using the method on unsorted input
- moving both pointers at once
- forgetting the problem uses 1-based indices

### Worked Example 2: Longest Substring Without Repeating Characters
#### Problem Statement
Given a string `s`, return the length of the longest substring without repeating characters.

#### Why This Example Matters
This example demonstrates the sliding-window pattern with a validity condition based on character frequency.

#### Input and Constraints
- the string may contain repeated characters
- the answer must be contiguous
- the string may be large, so nested substring checks are too slow

#### Recognition Signals
- longest valid substring
- contiguous region
- duplicates break validity and must be removed by shrinking

#### Brute-Force Approach
Generate every substring, test whether it has unique characters, and track the maximum length.

#### Better Pattern-Based Approach
Use a sliding window with a map from character to its latest index. Move the left boundary forward whenever a repeated character would break uniqueness.

#### Why the Pattern Fits
Adjacent windows overlap heavily. The window pattern reuses almost all of the previous substring state instead of rebuilding it.

#### Invariant or State Transition
The substring `s[left..right]` is always free of duplicate characters after the left boundary is adjusted.

#### Pragmatic Java Choice
Use a `HashMap<Character, Integer>` for latest positions because the character set may be broader than lowercase English letters.

#### Dry Run Before Code
For `s = "abba"`:

- right at `a`, window is `"a"`, best is `1`
- right at `b`, window is `"ab"`, best is `2`
- right at next `b`, move left to one position after the previous `b`, window becomes `"b"`
- right at `a`, window becomes `"ba"`, best remains `2`

#### Java Solution
```java
import java.util.HashMap;
import java.util.Map;

public class LongestUniqueSubstring {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> lastSeenIndex = new HashMap<>();
        int left = 0;
        int bestLength = 0;

        for (int right = 0; right < s.length(); right++) {
            char currentChar = s.charAt(right);

            if (lastSeenIndex.containsKey(currentChar)) {
                left = Math.max(left, lastSeenIndex.get(currentChar) + 1);
            }

            lastSeenIndex.put(currentChar, right);
            bestLength = Math.max(bestLength, right - left + 1);
        }

        return bestLength;
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n^3)$ time if uniqueness is tested by scanning each substring, or $O(n^2)$ with smarter checks
- Sliding window: $O(n)$ time, $O(min(n, alphabet))$ space

#### Edge Cases
- empty string
- all identical characters
- all unique characters
- repeated character whose previous occurrence is already outside the window

#### Common Mistakes
- moving `left` backward by assigning the previous index without `Math.max`
- treating subsequences as substrings
- forgetting that the window must stay contiguous

### Worked Example 3: Reverse a Character Array In Place
#### Problem Statement
Given a character array `letters`, reverse the array in place.

#### Why This Example Matters
This is the cleanest example of an in-place reversal pattern: a fixed symmetric process with no extra memory.

#### Input and Constraints
- the reversal must happen in place
- only mirrored swaps are needed
- the array may have even or odd length

#### Recognition Signals
- reverse without extra copy
- symmetric positions from both ends matter
- no need for additional ordering logic

#### Brute-Force Approach
Create a new array and write characters from the end of the original into the front of the new array.

#### Better Pattern-Based Approach
Swap the first and last characters, then move inward until the pointers cross.

#### Why the Pattern Fits
Each swap places two characters into their final positions. There is no need to revisit them.

#### Invariant or State Transition
Everything outside the pointer interval is already reversed and fixed. Everything inside still needs processing.

#### Pragmatic Java Choice
Use a small private `swap` helper for readability.

#### Dry Run Before Code
For `['h', 'e', 'l', 'l', 'o']`:

- swap indices `0` and `4` -> `['o', 'e', 'l', 'l', 'h']`
- swap indices `1` and `3` -> `['o', 'l', 'l', 'e', 'h']`
- stop when pointers cross

#### Java Solution
```java
public class ReverseCharacterArray {
    public void reverseString(char[] letters) {
        int left = 0;
        int right = letters.length - 1;

        while (left < right) {
            swap(letters, left, right);
            left++;
            right--;
        }
    }

    private void swap(char[] letters, int first, int second) {
        char temp = letters[first];
        letters[first] = letters[second];
        letters[second] = temp;
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n)$ time, $O(n)$ extra space
- In-place reversal: $O(n)$ time, $O(1)$ extra space

#### Edge Cases
- empty array
- one character
- odd-length array with a fixed middle element

#### Common Mistakes
- using extra memory when the problem explicitly asks for in-place mutation
- running the loop while `left <= right` and doing an unnecessary self-swap
- forgetting to move both pointers after each swap

### Worked Example 4: Linked List Cycle Detection
#### Problem Statement
Given the head of a linked list, return `true` if the list contains a cycle. Otherwise return `false`.

#### Why This Example Matters
This is the classic fast-and-slow pointer example because it replaces a visited-set solution with pointer pace alone.

#### Input and Constraints
- the list may be empty
- the list may or may not contain a cycle
- extra memory is ideally avoided

#### Recognition Signals
- linked structure
- cycle detection
- need to avoid storing all visited nodes if possible

#### Brute-Force Approach
Traverse the list and store every visited node in a `HashSet`. If a node appears again, a cycle exists.

#### Better Pattern-Based Approach
Use two pointers moving at different speeds. If a cycle exists, the fast pointer eventually meets the slow pointer.

#### Why the Pattern Fits
Relative movement inside a cycle guarantees a meeting, so the pattern avoids extra memory while still detecting repetition.

#### Invariant or State Transition
On each loop, slow moves one step and fast moves two. If the list ends, no cycle exists. If they meet, a cycle exists.

#### Pragmatic Java Choice
Define a simple `ListNode` class inside the example so the code is self-contained.

#### Dry Run Before Code
In a cycle of length `4`, if slow moves `1` step per round and fast moves `2`, the gap between them decreases modulo `4`. Eventually that gap becomes zero and the pointers meet.

#### Java Solution
```java
public class LinkedListCycleDetection {
    static class ListNode {
        int value;
        ListNode next;

        ListNode(int value) {
            this.value = value;
        }
    }

    public boolean hasCycle(ListNode head) {
        ListNode slow = head;
        ListNode fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;

            if (slow == fast) {
                return true;
            }
        }

        return false;
    }
}
```

#### Time and Space Complexity
- Brute force with a set: $O(n)$ time, $O(n)$ extra space
- Fast and slow pointers: $O(n)$ time, $O(1)$ extra space

#### Edge Cases
- empty list
- one node with no cycle
- one node pointing to itself
- long non-cyclic list

#### Common Mistakes
- forgetting the `fast != null && fast.next != null` guard
- comparing node values instead of node references
- assuming meeting implies a cycle when the code accidentally reuses node objects incorrectly in tests

## 6. Complexity and Comparison Guide

The main trade-off in this chapter is between repeated scans and disciplined pointer movement.

- opposite-direction two pointers often reduce pair-search problems from $O(n^2)$ to $O(n)$ when sorted order is available
- sliding windows usually reduce substring and subarray enumeration from $O(n^2)$ or worse to $O(n)$ by reusing nearly all active-state work
- fast and slow pointers keep $O(n)$ time while reducing extra memory from $O(n)$ to $O(1)$ in cycle and midpoint tasks
- in-place reversal keeps linear time but reduces space from $O(n)$ to $O(1)$

Comparison with similar patterns:

- Two pointers versus hashing: use hashing when the input is unsorted and direct lookup is cheaper than imposing order; use two pointers when sorted structure makes movement provably safe.
- Sliding window versus prefix sums: windows are best for live contiguous validity conditions; prefix sums are best for stored accumulation and offline range queries.
- Fast and slow pointers versus a visited set: pace-based detection wins on space when the structure allows it, but a set is sometimes simpler for arbitrary graph repetition.
- Partitioning versus full sorting: partitioning is stronger when only a few categories matter and full order is unnecessary.

Decision criteria:

- choose opposite-direction pointers for ordered pair or boundary problems
- choose sliding window for contiguous segments with live validity checks
- choose fast and slow pointers when different pace reveals hidden structure
- choose in-place reversal or partitioning when swap-based mutation can finish elements once and never revisit them

Signals that you should not force this chapter's techniques:

- no sortedness or monotonic structure to justify pointer movement
- problem asks for arbitrary subsets, not contiguous windows
- updates or negative values invalidate a specific window rule you were relying on

What breaks when the invariant fails is the safety of movement. The code may still run in linear time, but it may skip valid answers or count invalid regions.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- moving the wrong pointer after evaluating the state
- recording a window answer before the window is valid
- forgetting to remove left-side state while shrinking
- using two pointers on unsorted input without a proof
- skipping re-evaluation of a swapped-in element in partition routines
- dereferencing `fast.next` without a null guard

Boundary and mutation risks:

- off-by-one errors when computing window length as `right - left + 1`
- empty or single-element inputs
- windows that need repeated shrinking, not one-time shrinking
- in-place updates that destroy data needed later unless swap order is careful

Short debugging checklist:

1. What does each pointer represent right now?
2. Why is moving this pointer safe?
3. Is the active window valid at the moment I record the answer?
4. After a swap, is the new current element already classified?
5. Have I tested empty input, one element, and a case that forces repeated shrinking?

Quick counterexample that defeats a common wrong solution:

Applying a sliding window to subarray sum equals `k` with negative numbers fails because expanding the window can reduce the sum and shrinking can increase it. On `[2, -1, 2]` with `k = 3`, simple grow-while-small and shrink-while-large rules do not work reliably.

## 8. Practice Problems

### Easy
- Two Sum II - Input Array Is Sorted: Return a target pair from sorted input. Expected pattern or core idea: opposite-direction two pointers.
- Reverse String: Reverse a character array in place. Expected pattern or core idea: in-place reversal.
- Middle of the Linked List: Return the middle node of a linked list. Expected pattern or core idea: fast and slow pointers.

### Medium
- Longest Substring Without Repeating Characters: Find the longest unique-character substring. Expected pattern or core idea: sliding window with latest positions.
- Container With Most Water: Maximize area between vertical lines. Expected pattern or core idea: opposite-direction two pointers.
- Sort Colors: Reorder `0`, `1`, and `2` in one pass. Expected pattern or core idea: partitioning workflow.

### Hard
- Trapping Rain Water: Compute trapped water between bars. Expected pattern or core idea: two-pointer boundary reasoning.
- Minimum Window Substring: Find the smallest substring covering all required characters. Expected pattern or core idea: shrinking sliding window.
- Find the Duplicate Number: Detect a repeated value under constrained space. Expected pattern or core idea: fast and slow pointers on implicit linked structure.

## 9. Short Recap

The core idea of this chapter is that many nested scans can be replaced by moving boundaries whose meaning is always clear. The strongest recognition clue is a contiguous or ordered structure where pointer movement can discard impossible states safely. The most important optimization insight is that every element should usually enter and leave the active region only a small number of times. The main implementation warning is that pointer code fails when the invariant is implied instead of stated. This chapter prepares the next one by making stateful linear scans precise enough to extend into stack and queue simulations.

## 10. Coverage Check

- 4.1 Two Pointers Pattern - Covered
- 4.2 Sliding Window Pattern - Covered
- 4.3 Fast and Slow Pointer Pattern - Covered
- 4.4 In-Place Reversal Pattern - Covered
- 4.5 Partitioning, shrinking, and expanding workflows - Covered
- 4.6 Recognition checklist for linear-scan problems - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 5: Stack and Queue Driven Patterns
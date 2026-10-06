# Part II Outcome: Core Patterns and Linear Data Structures

**Scope:** Chapters 5 to 10
**Part outcome:**
- Solve 40 mixed easy and medium problems
- Identify when a pattern is better than brute force
- Implement linear data structures from scratch
**Capstone milestone:** Build a Java library for arrays, linked lists, stacks, and queues

---

## 1. What Completing Part II Should Mean

By the end of Part II, you should stop seeing every problem as a raw loop problem. You should start recognizing when a repeated scan can be replaced by a pattern such as hashing, two pointers, sliding window, or prefix preprocessing.

This is also the part where linear data structures should stop feeling like library magic. You should understand how linked lists, stacks, queues, and deques behave internally and when implementing them from scratch is useful.

Part II is complete only when you can:

- compare a brute-force solution against a pattern-based one and name the bottleneck
- implement linked-list and stack or queue mechanics without confusion about pointers or indices
- recognize when a problem is really asking for a moving window, a frequency map, or prefix-state reuse

## 2. Part II Revision Sheet

### 2.1 Hashing

What to remember:

- HashMap is for counts, positions, grouping, and fast lookup
- HashSet is for membership and uniqueness checks
- frequency maps are often the first optimization over nested loops
- collision handling exists under the hood even if Java manages it for you
- custom hashing and equality matter for user-defined keys

Common mistakes:

- forgetting to override both `equals()` and `hashCode()`
- using a map when a set is enough
- not checking whether the value stored should be earliest index, latest index, or frequency

### 2.2 Two Pointers

What to remember:

- opposite-direction pointers are common in sorted or symmetric problems
- same-direction pointers are common in compaction and partition tasks
- fast and slow pointers help with cycles or middle-finding
- recognizing the pointer movement rule is more important than memorizing examples

Common mistakes:

- moving both pointers without preserving the invariant
- using two pointers on unsorted data when sorting or a different pattern is required

### 2.3 Sliding Window

What to remember:

- fixed-size windows work when the window length never changes
- variable-size windows work when a validity condition expands and shrinks the window
- window state must be updated consistently when indices move
- longest or shortest subarray problems often hide a sliding-window pattern
- frequency-based windows usually need a map or array of counts

Common mistakes:

- stale counts after shrinking the window
- off-by-one errors in window length
- using sliding window when negative values break the monotonic property you need

### 2.4 Prefix Sum and Difference Techniques

What to remember:

- prefix sums answer repeated range sums quickly
- difference arrays apply many range updates efficiently before a final rebuild
- prefix XOR works when xor has the needed algebraic property
- hashing can combine with prefix data to detect target sums or equal states

Common mistakes:

- mixing inclusive and exclusive prefix conventions
- forgetting the extra starting zero in prefix arrays

### 2.5 Linked Lists

What to remember:

- singly, doubly, and circular linked lists differ in what pointers are available
- reversal techniques are pointer-update exercises, not value-copy exercises
- cycle detection uses pointer movement, not extra memory by default
- merge and pointer manipulation problems depend on clean local pointer updates

Common mistakes:

- losing the next node during reversal
- failing to update both directions in doubly linked lists
- not handling head changes explicitly

### 2.6 Stack, Queue, and Deque

What to remember:

- stack is LIFO, queue is FIFO, deque supports both ends
- array-based and linked implementations have different trade-offs
- queue using stacks and stack using queues are classic behavior-simulation exercises
- parentheses, expression, and simulation problems often reduce to disciplined stack or queue state

Common mistakes:

- mixing push or pop ends in deque logic
- incorrect full or empty checks in circular queues
- forgetting that simulation problems still need invariants, not just code motion

## 3. Part II Java Toolkit Completion Checklist

Your Part II capstone should include at least these reusable classes or equivalents:

- `SinglyLinkedList`
- `DoublyLinkedList`
- `CircularQueue`
- `ArrayStack`
- `ArrayQueue`
- `DequeTemplate`
- `SlidingWindowFrequencyTemplate`
- `PrefixSumUtils`
- `TwoPointerTemplates`
- `HashingTemplates`

For each class or template, verify:

- one hand-checkable example exists
- edge cases are tested
- operations are named clearly
- complexity is written down nearby

## 4. Part II Mini Assessment

### Part A: Quick Questions

1. When is hashing a better choice than a nested loop?
2. What invariant usually makes sliding window correct?
3. Why can fast and slow pointers detect a cycle?
4. What extra rule makes difference arrays useful?
5. What is the key risk when reversing a linked list?
6. When should you use a deque instead of a plain stack or queue?

### Part B: Short Tasks

7. Implement linked-list reversal from scratch.
8. Solve one fixed-size sliding-window problem and one variable-size sliding-window problem.
9. Solve one prefix-sum-plus-hashing problem.
10. Implement one array-based stack and one circular queue.

### Part C: Answer Guide

1. When repeated lookups or counts replace repeated rescanning.
2. The maintained state must always correctly describe the current window after every expand or shrink step.
3. In a cycle, the faster pointer eventually laps the slower one.
4. You can apply many range updates in `O(1)` each and rebuild the final array afterward.
5. Losing track of the next pointer before rewiring links.
6. When operations from both ends are needed efficiently.

### Part D: Scoring Guide

- `6/6` on Part A and all Part B tasks completed: Part II is ready.
- `4-5/6` on Part A: review the weak pattern area.
- `3/6` or lower on Part A: do not move on yet.

## 5. Part II Capstone: Linear Structures Library

Build one Java package or folder containing:

- arrays and prefix helpers
- linked-list implementations and reversal helpers
- stack, queue, and deque implementations
- one or two reusable hashing and sliding-window templates

Minimum verification standard:

- every structure supports its core operations
- every structure has at least one small test or handwritten example
- queue and stack edge cases are checked for empty or full behavior
- linked-list code handles head changes correctly

## 6. Exit Checklist

- You can explain when a pattern is better than brute force.
- You can implement linked lists, stacks, and queues from scratch.
- Sliding window no longer feels like a memorized trick.
- Prefix sum and hashing combinations feel natural.
- You have solved about 40 mixed easy and medium problems.
- Your Part II capstone library exists and is usable.

If one of these is still unstable, Part II is not complete.
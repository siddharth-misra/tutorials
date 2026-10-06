# 9: Linked Lists

**Goal:** Teach learners how linked lists are built node by node, how pointer updates change structure safely, and how to solve the most common reversal, merge, and cycle-detection problems in Java.
**Outcome:** By the end of this chapter, you can implement singly, doubly, and circular linked lists conceptually, reverse and merge lists with pointer manipulation, detect cycles, and explain when a linked list is a better fit than an array.

---

## 1. Intuition First

An array stores values next to each other in memory by index. A linked list stores values in separate nodes connected by references.

A simple real-world analogy is a train. Each carriage knows how to reach the next carriage. In a doubly linked train, each carriage can also reach the previous one. In a circular train, the last carriage connects back to the first.

The core mental model is this: a linked list is about connections, not positions. You rarely jump directly to index `k`. Instead, you walk node by node and change links carefully when restructuring the list.

The most common beginner confusion point is losing part of the list during mutation. If you change `current.next` before saving the next node you still need, the rest of the list can disappear from reach.

In the roadmap, this chapter is where pointer manipulation becomes concrete. The same pointer discipline later appears in stacks, queues, trees, and many interview list problems.

## 2. Core Concepts and Techniques

### Concept Cluster: Singly, Doubly, and Circular Linked Lists
Key concepts in this block:
- 9.1 Singly linked lists
- 9.2 Doubly linked lists
- 9.3 Circular linked lists

#### Intuition

A singly linked list node points to the next node. A doubly linked list node points both forward and backward. A circular linked list reconnects the tail to the head instead of ending with `null`.

#### Why It Matters

The node shape determines what operations are cheap, what traversal directions are possible, and what mutation risks exist.

#### How It Works

Singly linked list:
- simplest node shape
- forward traversal only
- insertion after a known node is easy

Doubly linked list:
- supports backward movement
- deletion is easier when you already have the target node
- each mutation must update both directions consistently

Circular linked list:
- no `null` tail marker
- useful when the structure should wrap around repeatedly
- traversal must stop by a logical condition, not by waiting for `null`

#### Java Implementation Notes

- For interview problems, define a custom `ListNode` or `DoublyNode` class explicitly.
- Java provides `java.util.LinkedList`, but that class is usually better for queue or deque behavior than for pointer-manipulation interview problems.
- Keep node fields minimal until the problem requires more.

#### Common Mistakes

- treating a linked list like an array with constant-time random access
- forgetting to update both `prev` and `next` in doubly linked lists
- traversing a circular list with a `while (current != null)` loop
- losing the head or tail reference during updates

#### Quick Example

```java
class SinglyLinkedListQuickExample {
    static final class ListNode {
        int value;
        ListNode next;

        ListNode(int value) {
            this.value = value;
        }
    }

    static ListNode insertAfter(ListNode node, int value) {
        ListNode newNode = new ListNode(value);
        newNode.next = node.next;
        node.next = newNode;
        return newNode;
    }
}
```

#### Debugging Tip

Draw the nodes and arrows before and after one pointer change. Linked-list bugs are usually visual bugs.

#### Advanced Note

Extra pointers make some operations easier, but they also double the mutation surface. Simpler structure is often better unless the use case clearly needs more.

### Concept Cluster: Reversal, Merge, and Pointer Manipulation
Key concepts in this block:
- 9.4 Reversal techniques
- 9.6 Merge and pointer manipulation problems

#### Intuition

Reversal flips pointer direction. Merge interleaves or combines nodes while preserving a rule such as sorted order.

#### Why It Matters

These problems force you to reason about structure changes directly. They are a major interview checkpoint because they reveal whether you actually understand node references.

#### How It Works

Common pointer roles:
- `previous` stores the already-reversed part
- `current` is the node being processed
- `nextNode` saves the rest of the list before rewiring
- `tail` or `dummy` helps build merged output safely

The main safety rule is: save what you still need before changing any pointer that might disconnect it.

#### Java Implementation Notes

- Dummy nodes make merge logic cleaner by removing head-special cases.
- Iterative reversal is usually the first version to master before recursive reversal.
- When order must be preserved during merge, move nodes one by one instead of copying values unless a brute-force baseline is intentional.

#### Common Mistakes

- overwriting `current.next` before saving it
- forgetting to move the tail pointer in a merge
- leaving the old `next` link attached and creating an accidental cycle
- returning the wrong head after reversal

#### Quick Example

```java
class ReverseQuickExample {
    static final class ListNode {
        int value;
        ListNode next;

        ListNode(int value) {
            this.value = value;
        }
    }

    static ListNode reverse(ListNode head) {
        ListNode previous = null;
        ListNode current = head;

        while (current != null) {
            ListNode nextNode = current.next;
            current.next = previous;
            previous = current;
            current = nextNode;
        }

        return previous;
    }
}
```

#### Debugging Tip

At each step, ask three questions: What is already fixed? What am I processing now? What part of the list have I saved for later?

#### Advanced Note

Most linked-list problems are pointer bookkeeping problems, not algorithm-invention problems. Clear role naming matters a lot.

### Concept Cluster: Cycle Detection
Key concepts in this block:
- 9.5 Cycle detection

#### Intuition

Cycle detection asks whether following `next` references can loop forever instead of ending at `null`.

#### Why It Matters

Cycle bugs are structural, not value-based. The problem teaches you to reason about list shape independently of node data.

#### How It Works

Two standard strategies:
- visited-set detection: remember nodes already seen
- Floyd's slow-and-fast pointer technique: if a cycle exists, fast and slow eventually meet

#### Java Implementation Notes

- A `HashSet<ListNode>` is the easiest correctness baseline.
- Floyd's algorithm is the space-optimized version to master after the baseline is clear.
- If you later need the cycle entry point, the same meeting logic extends naturally.

#### Common Mistakes

- comparing node values instead of node references
- forgetting that a single node can point to itself and still form a cycle
- moving the fast pointer unsafely when `fast.next` is `null`

#### Quick Example

```java
class CycleQuickExample {
    static final class ListNode {
        int value;
        ListNode next;

        ListNode(int value) {
            this.value = value;
        }
    }

    static boolean hasCycle(ListNode head) {
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

#### Debugging Tip

When cycle detection fails, draw the meeting sequence for a tiny cyclic list. Pointer motion bugs become obvious quickly on a 3-node cycle.

#### Advanced Note

Cycle reasoning is one of the first places where node identity matters more than the node value.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Reverse a Singly Linked List
#### Problem Statement

Given the head of a singly linked list, reverse the list and return the new head.

#### Why This Example Matters

It is the foundation of linked-list pointer manipulation. If reversal is not stable yet, harder list problems remain fragile.

#### Constraints or Assumptions

- the list may be empty
- the list may contain one node
- reversal should preserve the nodes, not just the values conceptually

#### Brute-Force Approach

Copy all node values into an array-like list, then walk the original list again and overwrite node values from back to front.

This returns the reversed value sequence, but it uses extra memory and avoids the real pointer skill.

#### Better Approach

Reverse the `next` pointers in place using `previous`, `current`, and `nextNode`.

#### Why the Better Approach Works

At each step, the already-processed prefix is reversed and safely anchored at `previous`. Saving `nextNode` keeps the unexplored suffix reachable.

#### Pragmatic Java Choice

Master the iterative version first. It is explicit, efficient, and easier to debug than recursive reversal for beginners.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class ReverseLinkedListExample {
    static final class ListNode {
        int value;
        ListNode next;

        ListNode(int value) {
            this.value = value;
        }
    }

    static ListNode reverseBruteForce(ListNode head) {
        List<Integer> values = new ArrayList<>();
        for (ListNode current = head; current != null; current = current.next) {
            values.add(current.value);
        }

        int index = values.size() - 1;
        for (ListNode current = head; current != null; current = current.next) {
            current.value = values.get(index--);
        }

        return head;
    }

    static ListNode reverseOptimized(ListNode head) {
        ListNode previous = null;
        ListNode current = head;

        while (current != null) {
            ListNode nextNode = current.next;
            current.next = previous;
            previous = current;
            current = nextNode;
        }

        return previous;
    }
}
```

#### Dry Run

Use `1 -> 2 -> 3 -> null`.

Optimized approach:
- start: `previous = null`, `current = 1`
- save `nextNode = 2`, point `1.next` to `null`, move `previous` to `1`
- save `nextNode = 3`, point `2.next` to `1`, move `previous` to `2`
- save `nextNode = null`, point `3.next` to `2`, move `previous` to `3`
- return `3 -> 2 -> 1 -> null`

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(n)` extra space
- Better approach: `O(n)` time, `O(1)` extra space

#### Edge Cases

- empty list -> return `null`
- one-node list -> unchanged
- long list -> same logic scales linearly

#### Common Mistakes

- not saving `nextNode` before rewiring
- returning the old head instead of the new head
- accidentally creating a cycle by forgetting to terminate the new tail

### Worked Example 2: Merge Two Sorted Linked Lists
#### Problem Statement

Given the heads of two sorted singly linked lists, merge them into one sorted list and return the new head.

#### Why This Example Matters

It combines traversal, comparison, and safe pointer stitching. It is one of the most common linked-list interview questions.

#### Constraints or Assumptions

- both input lists are sorted in non-decreasing order
- either list may be empty
- the result should preserve sorted order

#### Brute-Force Approach

Copy all values from both lists into an `ArrayList`, sort the list, and rebuild a new linked list.

This works, but it throws away the structural advantage of already sorted linked lists.

#### Better Approach

Use a dummy head and repeatedly attach the smaller current node from the two lists.

#### Why the Better Approach Works

At every step, the next node of the merged list must be the smaller of the two current candidates. The dummy head removes the need for a special first attachment case.

#### Pragmatic Java Choice

Use a dummy node for clarity. It is the standard way to simplify list-building logic in Java interviews.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class MergeSortedListsExample {
    static final class ListNode {
        int value;
        ListNode next;

        ListNode(int value) {
            this.value = value;
        }
    }

    static ListNode mergeBruteForce(ListNode first, ListNode second) {
        List<Integer> values = new ArrayList<>();

        for (ListNode current = first; current != null; current = current.next) {
            values.add(current.value);
        }
        for (ListNode current = second; current != null; current = current.next) {
            values.add(current.value);
        }

        Collections.sort(values);

        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        for (int value : values) {
            tail.next = new ListNode(value);
            tail = tail.next;
        }
        return dummy.next;
    }

    static ListNode mergeOptimized(ListNode first, ListNode second) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;

        ListNode left = first;
        ListNode right = second;

        while (left != null && right != null) {
            if (left.value <= right.value) {
                tail.next = left;
                left = left.next;
            } else {
                tail.next = right;
                right = right.next;
            }
            tail = tail.next;
        }

        tail.next = (left != null) ? left : right;
        return dummy.next;
    }
}
```

#### Dry Run

Use `first = 1 -> 3 -> 5` and `second = 2 -> 4 -> 6`.

Optimized approach:
- compare `1` and `2`, attach `1`
- compare `3` and `2`, attach `2`
- compare `3` and `4`, attach `3`
- continue similarly until one list ends
- attach the remaining suffix directly

Result: `1 -> 2 -> 3 -> 4 -> 5 -> 6`

#### Time and Space Complexity

- Brute force: `O((n + m) log(n + m))` time, `O(n + m)` extra space
- Better approach: `O(n + m)` time, `O(1)` extra space if reusing the input nodes

#### Edge Cases

- one list empty -> return the other
- both lists empty -> return `null`
- duplicate values merge naturally

#### Common Mistakes

- forgetting to advance `tail`
- forgetting to attach the remaining suffix after one list finishes
- rebuilding the head repeatedly instead of keeping one stable dummy

### Worked Example 3: Detect a Cycle in a Linked List
#### Problem Statement

Given the head of a singly linked list, return `true` if the list contains a cycle; otherwise return `false`.

#### Why This Example Matters

It shows how shape-based reasoning differs from value-based reasoning, and it revisits fast-and-slow pointers in the most classic linked-list form.

#### Constraints or Assumptions

- nodes may repeat by reference only if a cycle exists
- node values are irrelevant to cycle existence
- a node may point to itself

#### Brute-Force Approach

Use a `HashSet` to store visited node references. If a node appears again, a cycle exists.

This is easy to reason about, but it uses extra memory.

#### Better Approach

Use Floyd's slow-and-fast pointer technique.

#### Why the Better Approach Works

If there is no cycle, the fast pointer reaches `null`. If there is a cycle, the faster pointer laps the slower one and they eventually meet.

#### Pragmatic Java Choice

The visited-set version is a good correctness baseline. Floyd's algorithm is the optimized version you should aim to internalize.

#### Java Solution

```java
import java.util.HashSet;
import java.util.Set;

class LinkedListCycleExample {
    static final class ListNode {
        int value;
        ListNode next;

        ListNode(int value) {
            this.value = value;
        }
    }

    static boolean hasCycleBruteForce(ListNode head) {
        Set<ListNode> visited = new HashSet<>();
        ListNode current = head;

        while (current != null) {
            if (!visited.add(current)) {
                return true;
            }
            current = current.next;
        }

        return false;
    }

    static boolean hasCycleOptimized(ListNode head) {
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

#### Dry Run

Use `1 -> 2 -> 3 -> 4 -> 2 ...`.

Optimized approach:
- slow moves `1 -> 2 -> 3 -> 4 -> 2 ...`
- fast moves `1 -> 3 -> 2 -> 4 -> 3 ...`
- eventually both references land on the same node inside the cycle
- return `true`

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(n)` extra space
- Better approach: `O(n)` time, `O(1)` extra space

#### Edge Cases

- empty list -> `false`
- single node without self-loop -> `false`
- single node pointing to itself -> `true`

#### Common Mistakes

- comparing node values instead of node references
- moving the fast pointer without checking `fast.next`
- assuming cycles only happen in longer lists

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- traversal is usually `O(n)` because linked lists do not support constant-time random access
- insertion or deletion after a known node is usually `O(1)`
- reversal and merge are usually linear-time pointer tasks
- visited-set cycle detection uses extra memory, while Floyd's algorithm keeps `O(1)` extra space

Choose a linked list when:
- insertions and deletions in the middle are frequent once you already have the node reference
- the structure naturally grows node by node
- pointer-based reordering is easier than shifting array elements

Choose an array or `ArrayList` instead when:
- you need random access by index
- cache-friendly traversal and simple indexing matter more than pointer rewiring
- the structure is mostly read-only and contiguous memory helps

Recognition signals for linked-list techniques:
- node-by-node traversal
- reversal or reorder operations
- merge by pointer stitching
- cycle or middle-of-list questions

Signals not to force this technique:
- the problem is mainly about indexed lookup
- you plan to scan to the middle repeatedly and need random access
- a standard queue or deque library abstraction is enough without custom node work

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- losing the rest of the list during rewiring
- forgetting to update both directions in a doubly linked list
- returning the wrong head after mutation
- comparing values instead of references in structural problems

Null and boundary-condition handling:
- empty list
- single-node list
- head insertion or deletion
- tail updates
- circular traversal stop conditions

Mutation risks:
- overwriting `next` before saving it
- leaving stale links and creating unintended cycles
- forgetting that a dummy node changes where the real head begins

Short debugging checklist:
- What node does each pointer represent right now?
- Have I saved the next node before rewiring?
- After this change, can I still reach the rest of the list?
- Am I mutating structure or just values?
- If this were a circular list, how would traversal know when to stop?

## 6. Practice Problems

### Easy

- Title: Reverse Linked List
  - One-line prompt: Reverse a singly linked list and return the new head.
  - Expected pattern or core idea: Iterative pointer reversal.
- Title: Middle of the Linked List
  - One-line prompt: Return the middle node of a linked list.
  - Expected pattern or core idea: Slow and fast pointers.
- Title: Linked List Cycle
  - One-line prompt: Return whether a linked list contains a cycle.
  - Expected pattern or core idea: Visited set baseline versus Floyd's algorithm.

### Medium

- Title: Remove Nth Node From End of List
  - One-line prompt: Delete the nth node from the end in one pass.
  - Expected pattern or core idea: Gap-based two-pointer traversal.
- Title: Odd Even Linked List
  - One-line prompt: Group odd-indexed nodes before even-indexed nodes.
  - Expected pattern or core idea: Careful pointer partitioning.
- Title: Reorder List
  - One-line prompt: Reorder the list by alternating from the front and back halves.
  - Expected pattern or core idea: Find middle, reverse second half, then merge.

### Hard

- Title: Reverse Nodes in K-Group
  - One-line prompt: Reverse nodes in groups of size `k` while preserving the rest.
  - Expected pattern or core idea: Segment-based pointer reversal.
- Title: Merge K Sorted Lists
  - One-line prompt: Merge many sorted linked lists into one sorted result.
  - Expected pattern or core idea: Merge strategy plus heap or divide and conquer.
- Title: Copy List with Random Pointer
  - One-line prompt: Clone a linked structure that contains both `next` and random references.
  - Expected pattern or core idea: Pointer modeling and careful node mapping.

## 7. Short Recap

The core idea of this chapter is that linked lists are about node connections, and most important operations are really careful pointer updates.

The most important optimization insight is that pointer-based reversal, merge, and cycle detection avoid unnecessary extra arrays or sets when the structure permits it.

The most important implementation warning is to save what you still need before changing a link. Most list bugs come from losing reachability.

This chapter prepares the next chapter by giving you the structural intuition needed to implement stacks, queues, and deques cleanly with either arrays or linked nodes.

## 8. Coverage Check

- [x] 9.1 Singly linked lists
- [x] 9.2 Doubly linked lists
- [x] 9.3 Circular linked lists
- [x] 9.4 Reversal techniques
- [x] 9.5 Cycle detection
- [x] 9.6 Merge and pointer manipulation problems

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 10: Stack, Queue, and Deque
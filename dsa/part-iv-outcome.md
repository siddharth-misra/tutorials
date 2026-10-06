# Part IV Outcome: Trees and Ordered Structures

**Scope:** Chapters 16 to 21
**Part outcome:**
- Visualize tree problems before coding
- Implement key tree structures from scratch
- Solve 35 medium problems with trees and heaps
**Capstone milestone:** Build a tree toolkit with traversals, BST, heap, and trie

---

## 1. What Completing Part IV Should Mean

By the end of Part IV, tree problems should stop feeling like a pile of special cases. You should be able to draw the structure, classify the query type, and choose a traversal or data structure that matches the shape of the problem.

Part IV is complete only when you can:

- visualize parent-child structure before writing code
- write recursive and iterative traversals without confusion about order
- implement BST, heap, trie, segment tree, and Fenwick tree foundations from scratch
- explain when a problem is about subtree structure, order, or repeated range aggregation

## 2. Part IV Revision Sheet

### 2.1 Tree Fundamentals

What to remember:

- tree terminology includes parent, child, sibling, ancestor, descendant, and subtree
- height, depth, and degree measure different things
- root, internal, and leaf nodes define structural roles
- Java tree representation usually starts with a `TreeNode` class
- recursion on trees naturally mirrors the structure

Common mistakes:

- mixing height and depth
- forgetting null-base handling in recursive tree logic

### 2.2 Binary Trees and Traversals

What to remember:

- full, complete, perfect, and balanced are not synonyms
- inorder, preorder, postorder, and level-order serve different query goals
- Morris traversal trades pointer rewiring for low extra space

Common mistakes:

- choosing the wrong traversal for the information needed
- not restoring structure correctly in Morris traversal

### 2.3 Binary Search Trees

What to remember:

- BST property drives search, insertion, and deletion
- deletion cases differ for zero, one, and two children
- validation needs correct lower and upper bounds, not just local checks
- kth-smallest problems often rely on inorder traversal order

Common mistakes:

- validating only parent-child order instead of whole-subtree bounds
- mishandling successor replacement in deletion

### 2.4 Heap and Priority Queue

What to remember:

- min heap and max heap differ only in ordering rule, not core shape
- heapify and build-heap are foundational operations
- Java `PriorityQueue` is a min heap by default
- heap sort and top-k problems both rely on heap ordering

Common mistakes:

- forgetting zero-based child index formulas
- assuming PriorityQueue is a max heap without a comparator

### 2.5 Trie

What to remember:

- trie nodes store branching by character or digit
- insert and search are path-walk operations
- prefix search is the main reason to use tries
- delete and memory behavior matter when the structure grows large

Common mistakes:

- forgetting terminal-word markers
- deleting shared prefix nodes too aggressively

### 2.6 Segment Tree and Fenwick Tree

What to remember:

- range-query structures matter when repeated queries or updates dominate
- segment tree supports richer query and update behavior
- lazy propagation delays range-update work safely
- Fenwick tree is lighter for prefix-style aggregation
- comparing segment tree and Fenwick tree starts with the query-update requirements

Common mistakes:

- using the wrong structure for the operation mix
- broken lazy propagation state handling
- mixing one-based and zero-based indexing in Fenwick trees

## 3. Part IV Tree Toolkit Completion Checklist

Your Part IV capstone should include at least these reusable components:

- `TreeNode` base type
- recursive and iterative traversal templates
- `BinarySearchTree`
- `BinaryHeap` or clear heap helper utilities
- `Trie`
- `SegmentTree`
- `FenwickTree`

For each component, verify:

- one small hand-checkable example exists
- insert, query, and update behavior is tested where relevant
- null or empty cases are handled explicitly
- complexity is written down nearby

## 4. Part IV Mini Assessment

### Part A: Quick Questions

1. What is the difference between tree height and node depth?
2. Why does inorder traversal of a BST produce sorted output?
3. When should you prefer a heap over sorting the full data set?
4. What makes tries useful for autocomplete-style problems?
5. When is a Fenwick tree a cleaner choice than a segment tree?
6. What extra idea makes range updates efficient in a segment tree?

### Part B: Short Tasks

7. Implement inorder, preorder, and postorder traversal.
8. Validate whether a binary tree is a BST using bounds.
9. Solve one top-k problem using PriorityQueue.
10. Build a trie for insert, search, and prefix queries.

### Part C: Answer Guide

1. Height measures distance down to the deepest leaf; depth measures distance from the root.
2. The BST property places all smaller values left and all larger values right, so inorder visits them in sorted order.
3. When you need repeated access to the smallest or largest few elements without fully sorting everything.
4. Shared prefixes are stored once, making prefix search efficient.
5. When prefix-style queries and point updates are enough and simpler engineering is preferred.
6. Lazy propagation.

### Part D: Scoring Guide

- `6/6` on Part A and all Part B tasks completed: Part IV is ready.
- `4-5/6` on Part A: review the weak structure area.
- `3/6` or lower on Part A: do another revision pass first.

## 5. Part IV Capstone: Tree Toolkit

Build one reusable Java toolkit containing:

- tree node definitions and traversal templates
- BST search, insert, delete, and validation helpers
- heap and priority-queue examples
- trie insert, search, and prefix utilities
- segment tree and Fenwick tree implementations

Minimum verification standard:

- every structure has one working example
- traversals are checked on a small drawn tree
- range-query structures are tested on both queries and updates

## 6. Exit Checklist

- You can visualize tree structure before coding.
- Traversals feel intentional, not memorized blindly.
- BST, heap, trie, segment tree, and Fenwick tree basics are implementable from scratch.
- You have solved about 35 medium problems with trees and heaps.
- Your Part IV tree toolkit exists and is usable.

If one of these is still weak, Part IV is not complete.
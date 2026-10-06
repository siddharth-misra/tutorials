# DSA Capstone Milestones

This document implements the capstone milestones listed in `topics.txt` and turns them into concrete deliverables with verification rules.

---

## 1. How To Use These Milestones

Capstones exist to prove that a part is usable, not just readable. A part is not complete because the chapters were read once. A part is complete when its main techniques can be turned into reusable assets:

- a working Java toolkit
- a revision sheet you can actually review quickly
- a structured problem log with written notes

Parts I and III do not have standalone capstone milestones in the roadmap. Parts II, IV, V, VI, and VII do.

## 2. End of Part II: Linear Structures Library

**Roadmap milestone:** Build a Java library for arrays, linked lists, stacks, and queues

### Required deliverables

- array traversal and prefix helper methods
- singly linked list implementation
- doubly linked list implementation
- stack implementation
- queue implementation
- circular queue implementation
- deque usage template or implementation

### Minimum verification standard

- every structure supports its core operations
- empty-state behavior is tested
- boundary operations are tested, especially head and tail changes
- one small hand-checkable example exists for each structure

### Completion signal

You can start a linear-structure problem without re-deriving the underlying implementation details.

## 3. End of Part IV: Tree Toolkit

**Roadmap milestone:** Build a tree toolkit with traversals, BST, heap, and trie

### Required deliverables

- tree node base type
- recursive and iterative traversals
- BST search, insert, delete, and validation helpers
- min-heap or max-heap implementation or clear utilities
- PriorityQueue examples in Java
- trie insert, search, and prefix operations
- segment tree and Fenwick tree implementations

### Minimum verification standard

- every traversal is tested on one small drawn tree
- BST deletion is checked on zero, one, and two-child cases
- heap operations preserve heap property after insert and remove
- trie prefix behavior is verified explicitly

### Completion signal

You can classify a tree problem before coding and have reusable templates ready for the main structure family.

## 4. End of Part V: Graph Toolkit

**Roadmap milestone:** Build a graph toolkit with BFS, DFS, Dijkstra, DSU, and MST

### Required deliverables

- adjacency-list graph builder
- BFS template
- DFS template
- Dijkstra template
- DSU implementation with path compression and union by rank or size
- Kruskal MST implementation
- Prim MST implementation or at least one correct MST template

### Minimum verification standard

- directed and undirected assumptions are clearly separated
- weighted and unweighted graph helpers are not mixed carelessly
- disconnected-graph behavior is tested where relevant
- Dijkstra is only used on nonnegative edge examples

### Completion signal

You can move from graph modeling to the correct core solver quickly and safely.

## 5. End of Part VI: DP and Greedy Revision Sheet

**Roadmap milestone:** Publish a DP and greedy revision sheet

### Required deliverables

- one concise greedy proof reminder section
- one backtracking and recursion skeleton section
- one divide-and-conquer recurrence section
- one DP state-design section
- one memoization versus tabulation section
- one one-dimensional, two-dimensional, and advanced DP section

### Minimum verification standard

- every section is short enough to review in one sitting
- DP sections define state explicitly, not vaguely
- greedy sections state why the choice is safe
- at least one small example appears for each major family

### Completion signal

You can review Part VI quickly before practice and recover the main state-design ideas without rereading full chapters.

## 6. End of Part VII: 200+ Curated Problems With Written Notes

**Roadmap milestone:** Complete 200+ curated problems with written notes

### Required deliverables

- at least `200` solved problems
- balanced coverage across advanced range queries, trees, graphs, strings, monotonic patterns, and mixed problem solving
- a written note for every solved problem

### Minimum note format

- final pattern used
- rejected baseline and its bottleneck
- invariant, state, or model that made the optimized solution correct
- one bug or edge case that mattered
- one sentence on when to reuse the idea

### Minimum verification standard

- problems are grouped by pattern, not just source platform
- weak areas are tagged explicitly
- old mistakes are reviewed rather than ignored

### Completion signal

You can solve hard problems with structure instead of guesswork and explain your choices clearly.

## 7. Milestone Tracking Template

Use this checklist to track completion:

- Part II capstone complete
- Part IV capstone complete
- Part V capstone complete
- Part VI capstone complete
- Part VII capstone complete

For each completed milestone, confirm:

- deliverables exist
- examples were tested
- notes are written
- the material is reusable, not one-off
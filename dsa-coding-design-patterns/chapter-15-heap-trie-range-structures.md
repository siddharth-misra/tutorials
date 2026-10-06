
# 15: Heap, Trie, Range Structures

## Introduction and Context

This chapter covers three fundamental data structures that seem unrelated but share a core idea: trade structure for speed on specific operations.

Heaps keep the best element always accessible without full sorting. Tries make prefix-based lookup proportional to word length, not dictionary size. Range structures (segment trees, Fenwick trees) answer interval queries in logarithmic time with live updates.

The challenge is recognizing which structure solves which problem. Many learners memorize one solution per problem type; the real skill is seeing the constraint pattern and matching it to the right tool.

## Core Intuition and Mechanics

Think of these structures as specialized indices:

- **Heap**: a priority-ordered partial sort. Not fully sorted, but the root is always optimal.
- **Trie**: a prefix tree. Shared prefixes compress storage; lookup depends on word length, not dictionary size.
- **Range structure**: a preprocessed interval store. Interval queries and updates are logarithmic; the preprocessing and update strategy vary by constraint.

The recurring theme: each structure wastes some potential in exchange for fast guaranteed access to a specific pattern.

## Core Concepts and Subtopics

### Concept Cluster: Min and Max Heaps
Topics in this cluster:
- 15.1 Min heap and max heap; Heapify and build-heap; PriorityQueue in Java
- 15.2 Heap sort; Top K and streaming problems; Top K elements in practice

#### Definition

A **min heap** is a complete binary tree where every parent ≤ its children. A **max heap** is the opposite.

#### Array Representation

For 0-indexed array:
- Left child of i: `2*i + 1`
- Right child of i: `2*i + 2`
- Parent of i: `(i - 1) / 2`

#### Sift-Up (Insert)

```java
void siftUp(int[] heap, int index) {
    while (index > 0) {
        int parent = (index - 1) / 2;
        if (heap[parent] <= heap[index]) break;
        swap(heap, parent, index);
        index = parent;
    }
}
```

#### Sift-Down (Extract)

```java
void siftDown(int[] heap, int index, int size) {
    while (2 * index + 1 < size) {
        int smaller = 2 * index + 1;
        if (2 * index + 2 < size && heap[2 * index + 2] < heap[smaller]) {
            smaller = 2 * index + 2;
        }
        if (heap[index] <= heap[smaller]) break;
        swap(heap, index, smaller);
        index = smaller;
    }
}
```

#### Build-Heap (Linear Time)

```java
void buildHeap(int[] values) {
    int n = values.length;
    for (int i = n / 2 - 1; i >= 0; i--) {
        siftDown(values, i, n);
    }
}
```

#### PriorityQueue in Java

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
```

#### Top K Pattern

```java
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) minHeap.poll();
    }
    return minHeap.peek();
}
```

---

### Concept Cluster: Trie Structure and Prefix Search
Topics in this cluster:
- 15.3 Trie structure and node design; Trie operations; Insert and search operations
- 15.4 Prefix search; Prefix Tree Search Pattern; Delete and memory considerations; Dictionary and autocomplete problems

#### Definition

A **trie** stores strings by shared prefixes. Each node has a character and a set of children. A flag marks whether the path to a node completes a word.

#### Node Design

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];  // for lowercase a-z
    boolean isWord;
}
```

#### Insert

```java
void insert(String word) {
    TrieNode current = root;
    for (char c : word.toCharArray()) {
        int index = c - 'a';
        if (current.children[index] == null) {
            current.children[index] = new TrieNode();
        }
        current = current.children[index];
    }
    current.isWord = true;
}
```

#### Search

```java
boolean search(String word) {
    TrieNode node = find(word);
    return node != null && node.isWord;
}

TrieNode find(String prefix) {
    TrieNode current = root;
    for (char c : prefix.toCharArray()) {
        int index = c - 'a';
        if (current.children[index] == null) return null;
        current = current.children[index];
    }
    return current;
}
```

#### Prefix Search

```java
List<String> startsWith(String prefix) {
    List<String> result = new ArrayList<>();
    TrieNode node = find(prefix);
    if (node != null) dfs(node, new StringBuilder(prefix), result);
    return result;
}

void dfs(TrieNode node, StringBuilder path, List<String> result) {
    if (node.isWord) result.add(path.toString());
    for (int i = 0; i < 26; i++) {
        if (node.children[i] != null) {
            path.append((char)('a' + i));
            dfs(node.children[i], path, result);
            path.deleteCharAt(path.length() - 1);
        }
    }
}
```

---

### Concept Cluster: Range Query Structures
Topics in this cluster:
- 15.5 Why range-query structures matter; Range Query Pattern; Segment tree build and query
- 15.6 Point updates and range updates; Lazy propagation; Fenwick tree basics; Point updates, range updates, and immutable queries
- 15.7 Segment tree vs binary indexed tree; Sparse table; Choosing the right query structure by constraints; Choosing the right query structure from the constraints

#### When Range Queries Matter

If you have 10^5 queries and 10^5 elements, O(n) per query fails. A segment tree answers each query in O(log n).

#### Segment Tree Build

```java
class SegmentTree {
    long[] tree;
    int n;

    SegmentTree(int[] values) {
        n = values.length;
        tree = new long[4 * n];
        build(0, 0, n - 1, values);
    }

    void build(int node, int left, int right, int[] values) {
        if (left == right) {
            tree[node] = values[left];
        } else {
            int mid = (left + right) / 2;
            build(2 * node + 1, left, mid, values);
            build(2 * node + 2, mid + 1, right, values);
            tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
        }
    }

    long query(int left, int right) {
        return query(0, 0, n - 1, left, right);
    }

    long query(int node, int l, int r, int left, int right) {
        if (r < left || l > right) return 0;
        if (left <= l && r <= right) return tree[node];
        int mid = (l + r) / 2;
        return query(2 * node + 1, l, mid, left, right) + 
               query(2 * node + 2, mid + 1, r, left, right);
    }
}
```

#### Fenwick Tree (Binary Indexed Tree)

Fenwick trees are compact for sum-style queries and point updates. Use segment trees for range updates or non-additive queries.

#### Choosing the Right Structure

- **Immutable array, sum queries**: prefix sums O(1).
- **Point updates, sum queries**: Fenwick tree O(log n).
- **Range updates, arbitrary merge**: segment tree with lazy propagation O(log n).
- **Immutable array, min/max queries**: sparse table O(1).

---

## Worked Examples

### Worked Example 1: Top K Elements

```java
int[] topK(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) minHeap.poll();
    }
    int[] result = new int[k];
    for (int i = k - 1; i >= 0; i--) {
        result[i] = minHeap.poll();
    }
    return result;
}
```

**Complexity**: O(n log k). **Space**: O(k). Keep a min-heap of size k; the heap holds the k largest.

### Worked Example 2: Autocomplete with Trie

```java
void insert(String word) {
    TrieNode current = root;
    for (char c : word.toCharArray()) {
        if (current.children[c - 'a'] == null) {
            current.children[c - 'a'] = new TrieNode();
        }
        current = current.children[c - 'a'];
    }
    current.isWord = true;
}

List<String> autocomplete(String prefix) {
    TrieNode node = root;
    for (char c : prefix.toCharArray()) {
        if (node.children[c - 'a'] == null) return new ArrayList<>();
        node = node.children[c - 'a'];
    }
    return allWordsFrom(node, prefix);
}
```

**Why it works**: prefix lookup is O(prefix length), not dictionary size.

### Worked Example 3: Range Sum Query with Updates

```java
long query(int left, int right) {
    return queryRange(0, 0, n - 1, left, right);
}

void update(int index, int value) {
    updateNode(0, 0, n - 1, index, value);
}
```

**Complexity**: O(log n) per query and update. Each operation touches only log n nodes.

---

## Solved Problems

**Problem 1 (Easy)**: Kth largest element.

**Problem 2 (Easy)**: Implement a Trie.

**Problem 3 (Medium)**: Merge K sorted lists (use heap).

**Problem 4 (Medium)**: Word search in Trie (prefix matching).

**Problem 5 (Hard)**: Design a data structure supporting range updates and range sum queries.

---

## Recognition Guide

**Heap**: top K, scheduling, streaming max/min.

**Trie**: prefix lookup, autocomplete, word search, spell check.

**Range structures**: interval queries, dynamic updates, aggregation over ranges.

---

## Comparison Tables

| Structure | Search | Insert | Delete | Prefix |
|-----------|--------|--------|--------|--------|
| Heap | O(n) | O(log n) | O(log n) | N/A |
| Trie | O(m) | O(m) | O(m) | O(m) |
| Segment Tree | O(log n) | O(log n) | O(log n) | N/A |
| Fenwick | O(log n) sum | O(log n) | N/A | N/A |

(m = word length; n = array size)

---

## Design and Decision Making

Heaps are first choice for priority and top-K problems. Tries are best for prefix-based string work. Segment trees handle complex interval operations; Fenwick trees are simpler for sums. Choose based on the constraint pattern, not the problem wording.

---

## Practical Applications

- **Heaps**: task scheduling, event priority, median-finding, Dijkstra's algorithm.
- **Tries**: search engines, IP routing, spell checkers, autocomplete systems.
- **Range structures**: SQL range aggregates, monitoring dashboards, version control systems.

---

## Failure Modes and Trade-offs

**Heap overflow**: unbounded growth in streaming. Set a fixed size for top-K problems.

**Trie memory**: large alphabets waste space. Use maps instead of arrays for sparse alphabets.

**Range tree complexity**: lazy propagation is error-prone. Start with simpler structures if constraints allow.

---

## Condensed Notes

- Heap: parent ≤ children (min heap); O(log n) insert/remove.
- Trie: character at each node; isWord flag at path end.
- Segment tree: interval merging; O(log n) query and update.
- Top K: keep min-heap of size k; optimal is O(n log k).
- Prefix search: find node, then DFS all children.
- Range query: choose structure by: immutable? point or range update? operation type?

---

## Additional Problems

**Easy**: Last K elements. Design a Trie. Kth smallest in BST (reuse from Ch 14).

**Medium**: Find median from data stream. Search suggestions system. Range sum with point update.

**Hard**: Merge K sorted lists. Maximum XOR of two numbers in array. Range assignment with lazy propagation.

---

## Key Questions

1. How does a min-heap maintain its invariant?
2. Why is build-heap O(n) and not O(n log n)?
3. How do you find the kth largest element efficiently?
4. What is a Trie and when is it better than a hash set?
5. How does prefix search work in a Trie?
6. What are the differences between segment trees and Fenwick trees?
7. When should you use lazy propagation?
8. How do you validate a segment tree?
9. What is the space-time trade-off in range queries?
10. How do you handle range updates and range queries together?

---

## Applied Project

Build a **real-time dashboard**: compute top-10 products, handle live sales, prefix-search by product name, and show range sum queries (total sales in a time window) using a combination of heap, trie, and segment tree.


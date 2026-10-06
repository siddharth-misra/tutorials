
# 14: Binary Trees and BST

## Introduction and Context

Binary trees with two children per node simplify traversal and enable strong algorithmic guarantees. When you add the BST property—left subtree smaller, right subtree larger—the tree becomes a searchable data structure, not just a shape.

The core challenge: BST correctness is fragile. A simple mistake in insertion, deletion, or validation can silently create an invalid tree. Similarly, many learners confuse tree shape (what pointers exist) with tree order (what values matter).

The key insight: a binary tree is only as good as its invariant. For BSTs, that invariant is "every node is larger than its left subtree and smaller than its right." Break that, and search fails.

## Core Intuition and Mechanics

Think of a BST as a decision tree. To find a value, you ask one question at each node: "Is my target smaller or larger?" That single comparison eliminates an entire half of the tree.

- **Inorder traversal** on a BST produces sorted values.
- **Search** uses the value ordering to eliminate half the tree at each step.
- **Insertion** finds the right spot by following the search path and attaching at the null child.
- **Deletion** has three cases: no children, one child, or two children.
- **Validation** checks that every node respects the BST property relative to all ancestors, not just its immediate parent.

The mechanical rules:
- Search left if target < node.value, right if target > node.value.
- Insert at the first null position found on the search path.
- Delete by removing the node and promoting the most appropriate child (successor or predecessor).
- Validate using ancestor bounds, not just parent comparison.

## Core Concepts and Subtopics

### Concept Cluster: Binary Tree Shapes and Traversals
Topics in this cluster:
- 14.1 Binary Trees and Traversals: Inorder traversal; Preorder traversal; Postorder traversal
- 14.2 Morris traversal

#### Definition

**Inorder**: left, root, right. **Preorder**: root, left, right. **Postorder**: left, right, root. **Morris traversal**: use right-subtree threads to avoid stack space.

#### Inorder Recursive

```java
void inorder(TreeNode node, List<Integer> result) {
    if (node == null) return;
    inorder(node.left, result);
    result.add(node.value);
    inorder(node.right, result);
}
```

#### Morris Inorder (O(1) space)

```java
List<Integer> morrisInorder(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    TreeNode current = root;
    while (current != null) {
        if (current.left == null) {
            result.add(current.value);
            current = current.right;
        } else {
            TreeNode predecessor = current.left;
            while (predecessor.right != null && predecessor.right != current) {
                predecessor = predecessor.right;
            }
            if (predecessor.right == null) {
                predecessor.right = current;
                current = current.left;
            } else {
                result.add(current.value);
                predecessor.right = null;
                current = current.right;
            }
        }
    }
    return result;
}
```

#### Why Morris Matters

Recursion uses O(height) space on the call stack. Morris threads pointers temporarily to achieve O(1) space without recursion.

#### Java Notes

Recursive traversals are clearest for most interview problems. Morris is advanced but useful when space is tight.

---

### Concept Cluster: BST Property, Search, Insert, Delete
Topics in this cluster:
- 14.3 BST property and search; BST search, insert, and delete operations
- 14.4 Validating a BST; Insert and delete operations in practice

#### Definition

**BST property**: for every node, all values in the left subtree < node.value < all values in the right subtree.

#### Search

```java
TreeNode search(TreeNode root, int target) {
    if (root == null || root.value == target) return root;
    return target < root.value ? search(root.left, target) : search(root.right, target);
}
```

#### Insert

```java
TreeNode insert(TreeNode root, int value) {
    if (root == null) return new TreeNode(value);
    if (value < root.value) {
        root.left = insert(root.left, value);
    } else if (value > root.value) {
        root.right = insert(root.right, value);
    }
    return root;
}
```

#### Delete

```java
TreeNode delete(TreeNode root, int value) {
    if (root == null) return null;
    if (value < root.value) {
        root.left = delete(root.left, value);
    } else if (value > root.value) {
        root.right = delete(root.right, value);
    } else {
        if (root.left == null) return root.right;
        if (root.right == null) return root.left;
        TreeNode successor = findMin(root.right);
        root.value = successor.value;
        root.right = delete(root.right, successor.value);
    }
    return root;
}

TreeNode findMin(TreeNode node) {
    while (node.left != null) node = node.left;
    return node;
}
```

#### Validate BST

```java
boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.value <= min || node.value >= max) return false;
    return validate(node.left, min, node.value) && validate(node.right, node.value, max);
}
```

**Key insight**: track the valid range as you descend. Parent comparison alone is insufficient.

---

### Concept Cluster: Order-Statistics and Interview Patterns
Topics in this cluster:
- 14.5 Kth smallest and order-statistics style problems
- 14.6 Common BST interview questions; Interview patterns

#### Definition

**Kth smallest**: find the k-th element in sorted order. Inorder traversal gives sorted values; stop at position k.

```java
int kthSmallest(TreeNode root, int k) {
    List<Integer> inorder = new ArrayList<>();
    inorder(root, inorder);
    return inorder.get(k - 1);
}

void inorder(TreeNode node, List<Integer> result) {
    if (node == null) return;
    inorder(node.left, result);
    result.add(node.value);
    inorder(node.right, result);
}
```

#### Optimized Kth Smallest (early stop)

```java
class KthSmallestCounter {
    int count = 0;
    int result = -1;

    void inorder(TreeNode node, int k) {
        if (node == null || count >= k) return;
        inorder(node.left, k);
        count++;
        if (count == k) {
            result = node.value;
            return;
        }
        inorder(node.right, k);
    }
}
```

---

## Worked Examples

### Worked Example 1: Insert and Maintain BST

```java
TreeNode insert(TreeNode root, int value) {
    if (root == null) return new TreeNode(value);
    if (value < root.value) root.left = insert(root.left, value);
    else if (value > root.value) root.right = insert(root.right, value);
    return root;
}
```

**Dry run**: Insert 5, 3, 7 into empty tree. Root becomes 5. Insert 3 → goes left. Insert 7 → goes right.

### Worked Example 2: Delete with Two Children

Delete 5 from tree with root 5, left 3, right 7.
- Node has two children.
- Find successor (6 from right subtree).
- Replace value and delete the successor.

**Complexity**: O(log n) average, O(n) worst (skewed).

### Worked Example 3: Validate and Correct

Check if tree is valid BST while maintaining bounds for ancestors.

```java
boolean isValid(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}
```

**Key**: bounds change as you descend. Left child must be < parent. Right child must be > parent.

---

## Solved Problems

**Problem 1 (Easy)**: Search for value in BST.

**Problem 2 (Easy)**: Convert sorted array to balanced BST.

**Problem 3 (Medium)**: Inorder successor in BST.

**Problem 4 (Medium)**: Recover corrupted BST (two nodes swapped; restore it).

**Problem 5 (Hard)**: Largest BST subtree in a possibly-invalid tree.

---

## Recognition Guide

Use BST when you need both search and sorted iteration. BST problems often hinge on recognizing when inorder produces sorted values or when deletion requires successor logic.

Avoid BST when you only need exact lookup (hash map is simpler) or when range queries matter more than sorted traversal (segment trees are better).

---

## Comparison Tables

| Operation | Array | BST (Balanced) | Hash Map |
|-----------|-------|---|---|
| Search | O(log n) binary search | O(log n) | O(1) average |
| Insert | O(n) shift | O(log n) | O(1) average |
| Delete | O(n) shift | O(log n) | O(1) average |
| Inorder | O(n) | O(n) | N/A |

---

## Design and Decision Making

Use BSTs when you need sorted traversal and dynamic updates. Use hash maps for pure lookup. Use balanced-tree variants (AVL, Red-Black) when worst-case log n is critical.

---

## Practical Applications

- **Databases**: B-trees are BST generalizations for disk-based indexing.
- **Sorted maps**: TreeMap in Java uses red-black trees.
- **Expression evaluation**: BST for operator precedence.

---

## Failure Modes and Trade-offs

**Unbalanced BST**: insertion in sorted order creates a chain; O(n) search. Use self-balancing variants or randomize.

**Wrong deletion**: forgetting successor logic or not updating parent pointer causes corruption.

**Validation bug**: comparing only with parent, not all ancestors, allows invalid trees.

---

## Condensed Notes

- Search: go left if target < node, right if target > node.
- Insert: attach at first null found on search path.
- Delete: handle 0, 1, or 2 children separately.
- Inorder: left, root, right → sorted values.
- Validate: track min/max bounds from ancestors.
- Successor: leftmost in right subtree.
- Kth smallest: inorder + early stop at position k.

---

## Additional Problems

**Easy**: Search in BST. Minimum in BST. Closest value to target.

**Medium**: Delete node from BST. Range sum of BST. Inorder successor.

**Hard**: Recover BST from two swapped nodes. All BSTs from preorder. Largest BST subtree.

---

## Key Questions

1. How do you search a BST?
2. What is the inorder traversal of a BST?
3. How do you delete a node with two children?
4. Why is validation harder than just checking the parent?
5. When is a BST preferred over a hash map?
6. How do you find the kth smallest element?
7. What is the successor of a node in BST?
8. Why does insertion order affect BST performance?
9. How do you build a balanced BST from a sorted array?
10. What is Morris traversal and why use it?

---

## Applied Project

Build a **phone contact manager** backed by a BST: store (name, phone) pairs sorted by name, support insert, delete, search, and range queries (names starting with a prefix).


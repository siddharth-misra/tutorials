# 18: Binary Search Trees

**Goal:** Teach learners how value ordering inside a binary tree changes search, insertion, deletion, and query strategies, and how to reason about BST correctness in Java.
**Outcome:** By the end of this chapter, you can use the BST property for efficient search, implement insert and delete, validate whether a tree is a BST, solve kth-smallest style problems, and recognize common BST interview patterns.

---

## 1. Intuition First

Binary search trees matter because they combine the hierarchical shape of trees with the ordered elimination idea of binary search. The structure of the tree tells you where a value can and cannot be.

A simple real-world analogy is a paper filing system where every drawer splits records into smaller and larger values relative to one label. To find a record, you never check every drawer. You follow the only path that can still contain it.

The core mental model is this: for every node, all values in the left subtree are smaller, and all values in the right subtree are larger. That local rule creates a global searchable order.

The most common beginner confusion point is thinking a BST is automatically balanced. It is not. A BST can still degenerate into a chain if insertion order is unlucky.

In the roadmap, this chapter turns traversal knowledge into ordered-tree reasoning. It also prepares heaps, tries, and advanced balanced-tree ideas later.

## 2. Core Concepts and Techniques

### Concept Cluster: BST Property, Search, Insert, and Delete
Key concepts in this block:
- 18.1 BST property and search
- 18.2 Insert and delete operations

#### Intuition

Searching in a BST is just repeated branch elimination based on the current node's value.

#### Why It Matters

BSTs are the first major example where tree structure and value ordering work together to reduce search time.

#### How It Works

- if target equals current value, stop
- if target is smaller, move left
- if target is larger, move right

Insertion:
- follow the same search path until a `null` child is found
- attach the new value there

Deletion cases:
- no children: remove the node directly
- one child: replace the node with its child
- two children: replace the node with its inorder successor or predecessor, then delete that moved value from the subtree

#### Java Implementation Notes

- Recursive BST code is readable because the subtree replacement logic maps cleanly to return values.
- Iterative search is often the practical default for lookup.
- Be explicit about how duplicates are handled. Many interview BSTs assume all values are distinct.

#### Common Mistakes

- treating deletion as a simple remove without handling the three structural cases
- assuming search is logarithmic even when the tree is skewed
- placing equal values inconsistently

#### Quick Example

```java
class BstSearchQuickExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static boolean contains(TreeNode root, int target) {
        TreeNode current = root;
        while (current != null) {
            if (current.value == target) {
                return true;
            }
            current = target < current.value ? current.left : current.right;
        }
        return false;
    }
}
```

#### Debugging Tip

During deletion, draw the exact subtree being returned after each case. Most bugs come from returning the wrong replacement root.

#### Advanced Note

Balanced BST variants exist because the BST ordering rule alone does not prevent pathological shape.

### Concept Cluster: Validating a BST
Key concepts in this block:
- 18.3 Validating a BST

#### Intuition

A BST is not valid just because each node is larger than its left child and smaller than its right child. The whole subtree range matters.

#### Why It Matters

This is one of the most common correctness traps in tree interviews.

#### How It Works

- pass an allowable value range down the tree
- every node must lie strictly between the lower and upper bounds it inherits
- alternatively, inorder traversal of a valid BST must be strictly increasing if duplicates are not allowed

#### Java Implementation Notes

- Use `long` bounds if node values are `int`, so edge values near `Integer.MIN_VALUE` and `Integer.MAX_VALUE` are still handled safely.
- Range validation is usually easier to explain than local-child checks.

#### Common Mistakes

- only comparing a node with its immediate children
- using inclusive bounds when duplicates are not allowed
- forgetting that a right subtree node must be larger than every ancestor on the left path too

#### Quick Example

```java
class ValidateBstQuickExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static boolean isValid(TreeNode root) {
        return isValid(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    private static boolean isValid(TreeNode node, long lower, long upper) {
        if (node == null) {
            return true;
        }
        if (node.value <= lower || node.value >= upper) {
            return false;
        }
        return isValid(node.left, lower, node.value)
                && isValid(node.right, node.value, upper);
    }
}
```

#### Debugging Tip

When a local-child check seems to pass but the tree is still invalid, write the inherited lower and upper bounds beside each node.

#### Advanced Note

Inorder monotonicity is a compact validation method, but range-based validation often communicates the correctness idea more directly.

### Concept Cluster: Kth Smallest and Common BST Interview Questions
Key concepts in this block:
- 18.4 Kth smallest and order-statistics style problems
- 18.5 Common BST interview questions

#### Intuition

Because inorder traversal of a BST is sorted, many rank and predecessor or successor questions reduce to controlled inorder traversal.

#### Why It Matters

This is where BSTs stop being just searchable storage and become tools for ordered queries.

#### How It Works

- kth smallest: perform inorder traversal and stop after visiting `k` nodes
- predecessor: largest value smaller than target
- successor: smallest value larger than target
- lowest common ancestor in BST: move left or right together until the split point

#### Java Implementation Notes

- Iterative inorder with a stack is often better than storing the full inorder list if you only need the kth element.
- Common BST questions usually reuse the ordering rule, not a completely new trick.

#### Common Mistakes

- collecting all inorder values when only the first `k` are needed
- forgetting that predecessor and successor depend on the ordering path, not arbitrary traversal
- assuming all common tree interview questions are BST questions

#### Quick Example

```java
import java.util.ArrayDeque;
import java.util.Deque;

class KthSmallestQuickExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static int kthSmallest(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode current = root;

        while (current != null || !stack.isEmpty()) {
            while (current != null) {
                stack.push(current);
                current = current.left;
            }

            current = stack.pop();
            k--;
            if (k == 0) {
                return current.value;
            }
            current = current.right;
        }

        throw new IllegalArgumentException("k is larger than the number of nodes");
    }
}
```

#### Debugging Tip

If a BST query feels difficult, ask what inorder order would reveal. Many answers become obvious after that step.

#### Advanced Note

Order-statistics trees maintain subtree sizes to answer rank queries faster, but the basic inorder idea is enough for this stage.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Maintain a BST with Search, Insert, and Delete
#### Problem Statement

Design a BST that supports search, insert, and delete for distinct integer keys.

#### Why This Example Matters

It forces you to use the BST property for both navigation and structural updates.

#### Constraints or Assumptions

- keys are distinct
- operations should preserve the BST property
- the tree does not self-balance automatically

#### Brute-Force Approach

Store all values in a sorted list. Use linear insertion and deletion by shifting values, and scan linearly for search.

#### Better Approach

Store values in a BST and use ordered branching for search, insert, and delete.

#### Why the Better Approach Works

The BST property tells you exactly which subtree can still contain the target or insertion position. Deletion preserves that order by reconnecting valid subtrees carefully.

#### Pragmatic Java Choice

Use iterative search and recursive insert or delete because deletion case handling is cleaner when subtree roots are returned.

#### Java Solution

```java
class BstOperationsExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static boolean search(TreeNode root, int target) {
        TreeNode current = root;
        while (current != null) {
            if (current.value == target) {
                return true;
            }
            current = target < current.value ? current.left : current.right;
        }
        return false;
    }

    static TreeNode insert(TreeNode root, int value) {
        if (root == null) {
            return new TreeNode(value);
        }
        if (value < root.value) {
            root.left = insert(root.left, value);
        } else if (value > root.value) {
            root.right = insert(root.right, value);
        }
        return root;
    }

    static TreeNode delete(TreeNode root, int value) {
        if (root == null) {
            return null;
        }

        if (value < root.value) {
            root.left = delete(root.left, value);
        } else if (value > root.value) {
            root.right = delete(root.right, value);
        } else {
            if (root.left == null) {
                return root.right;
            }
            if (root.right == null) {
                return root.left;
            }

            TreeNode successor = findMinimum(root.right);
            root.value = successor.value;
            root.right = delete(root.right, successor.value);
        }

        return root;
    }

    private static TreeNode findMinimum(TreeNode node) {
        while (node.left != null) {
            node = node.left;
        }
        return node;
    }
}
```

#### Dry Run

Delete `50` from a BST where `50` has left subtree rooted at `30` and right subtree rooted at `70`, and `70` has left child `60`.

- node `50` has two children
- find inorder successor, which is the minimum of the right subtree: `60`
- replace `50` with `60`
- delete the original `60` from the right subtree
- BST order is preserved

#### Time and Space Complexity

- Brute force: search `O(n)`, insert `O(n)`, delete `O(n)` due to shifting or scanning
- Better approach: average `O(h)` time per operation where `h` is tree height, `O(h)` call stack space for recursive insert or delete

#### Edge Cases

- insert into empty tree
- delete a leaf node
- delete a node with one child
- delete the root node

#### Common Mistakes

- not handling the two-child delete case correctly
- forgetting to reconnect returned subtrees
- assuming the tree stays balanced automatically

### Worked Example 2: Validate a Binary Search Tree
#### Problem Statement

Given the root of a binary tree, return `true` if it is a valid BST.

#### Why This Example Matters

It is the canonical proof-oriented BST problem and exposes the difference between local checks and full-subtree constraints.

#### Constraints or Assumptions

- duplicate values are not allowed
- any invalid value anywhere in a subtree makes the whole tree invalid

#### Brute-Force Approach

At each node, only compare the node with its immediate left and right child.

#### Better Approach

Carry lower and upper bounds through recursion.

#### Why the Better Approach Works

Every node must satisfy all ordering constraints from its ancestors, not just from its parent.

#### Pragmatic Java Choice

Use `long` bounds even if values are `int` so extreme values remain valid test cases.

#### Java Solution

```java
class ValidateBstExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static boolean isValidLocalCheck(TreeNode root) {
        if (root == null) {
            return true;
        }
        if (root.left != null && root.left.value >= root.value) {
            return false;
        }
        if (root.right != null && root.right.value <= root.value) {
            return false;
        }
        return isValidLocalCheck(root.left) && isValidLocalCheck(root.right);
    }

    static boolean isValidRangeCheck(TreeNode root) {
        return isValidRangeCheck(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    private static boolean isValidRangeCheck(TreeNode node, long lower, long upper) {
        if (node == null) {
            return true;
        }
        if (node.value <= lower || node.value >= upper) {
            return false;
        }
        return isValidRangeCheck(node.left, lower, node.value)
                && isValidRangeCheck(node.right, node.value, upper);
    }
}
```

#### Dry Run

Use a tree with root `10`, left child `5`, right child `15`, and `15` having left child `6`.

Local checks appear to pass at `10` and `15`, but range checks reveal the issue:
- node `15`'s left child `6` must be greater than `10` because it is in the right subtree of `10`
- `6` violates the inherited lower bound `10`
- the tree is not a valid BST

#### Time and Space Complexity

- Brute force: `O(n)` time but logically incorrect, `O(h)` call stack space
- Better approach: `O(n)` time, `O(h)` call stack space

#### Edge Cases

- empty tree is valid
- single-node tree is valid
- extreme integer values require careful bounds

#### Common Mistakes

- comparing only parent and child
- using inclusive bounds incorrectly
- forgetting that duplicates need a clear rule

### Worked Example 3: Kth Smallest Element in a BST
#### Problem Statement

Given the root of a BST and an integer `k`, return the `k`th smallest value.

#### Why This Example Matters

It turns inorder traversal into an ordered query rather than just a listing procedure.

#### Constraints or Assumptions

- `1 <= k <= number of nodes`
- the tree is a valid BST
- duplicate values are not used in this version

#### Brute-Force Approach

Collect the full inorder traversal into a list, then return the value at index `k - 1`.

#### Better Approach

Perform iterative inorder traversal and stop as soon as the `k`th value is visited.

#### Why the Better Approach Works

Inorder traversal visits BST values in sorted order. The `k`th visited node is the `k`th smallest.

#### Pragmatic Java Choice

Use an explicit stack so you can stop early without building an entire list.

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

class KthSmallestExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static int kthSmallestWithList(TreeNode root, int k) {
        List<Integer> inorderValues = new ArrayList<>();
        inorder(root, inorderValues);
        return inorderValues.get(k - 1);
    }

    private static void inorder(TreeNode node, List<Integer> values) {
        if (node == null) {
            return;
        }
        inorder(node.left, values);
        values.add(node.value);
        inorder(node.right, values);
    }

    static int kthSmallestIterative(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode current = root;

        while (current != null || !stack.isEmpty()) {
            while (current != null) {
                stack.push(current);
                current = current.left;
            }

            current = stack.pop();
            k--;
            if (k == 0) {
                return current.value;
            }
            current = current.right;
        }

        throw new IllegalArgumentException("k exceeds node count");
    }
}
```

#### Dry Run

Use BST values `[2, 3, 4, 5, 7, 8]` arranged as a valid BST and `k = 4`.

Iterative inorder visits values in this order:
- `2`
- `3`
- `4`
- `5`

The fourth visited value is `5`.

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(n)` extra space
- Better approach: `O(h + k)` time, `O(h)` extra space

#### Edge Cases

- `k = 1` returns the smallest value
- `k = n` returns the largest value
- invalid `k` should be rejected or handled explicitly

#### Common Mistakes

- using preorder or postorder instead of inorder
- traversing the full tree when early stopping is enough
- assuming the method works on arbitrary binary trees

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- BST search, insert, and delete are `O(h)` where `h` is tree height, which is good only if the tree is reasonably balanced
- validation and inorder-style queries usually run in `O(n)` time because every node may need to be checked
- iterative traversals use explicit stack space `O(h)`, while recursive traversals use call stack space `O(h)`

Choose BST search logic when:
- the structure satisfies the BST ordering property
- the question asks for predecessor, successor, search, rank-like, or ordered lookup behavior

Choose range validation when:
- you need to prove the BST property globally

Choose iterative inorder when:
- you need sorted BST values but do not need to store all of them
- early stopping matters

Signals not to force BST reasoning:
- the tree is not ordered by value
- the problem needs breadth-first shape information instead of ordered lookup
- the input can be badly skewed and worst-case performance matters strongly

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- incorrect subtree reconnection during deletion
- local-child validation instead of global-range validation
- forgetting how duplicates are handled
- assuming logarithmic performance without considering tree shape

Boundary and structural risks:
- empty tree
- deleting the root
- nodes with only one child
- extreme integer bounds in validation

Short debugging checklist:
- Does every subtree returned after insert or delete still satisfy BST order?
- Am I validating against ancestor bounds, not just parent comparisons?
- For kth-smallest, am I actually using inorder order?
- Could this BST be skewed enough to hurt runtime?
- Have I defined duplicate handling explicitly?

## 6. Practice Problems

### Easy

- Title: Search in a Binary Search Tree
  - One-line prompt: Return whether a target exists in the BST.
  - Expected pattern or core idea: Ordered branching by value.
- Title: Insert into a Binary Search Tree
  - One-line prompt: Insert a new key while preserving BST order.
  - Expected pattern or core idea: Recursive or iterative insertion path.
- Title: Minimum Absolute Difference in BST
  - One-line prompt: Find the smallest difference between any two BST values.
  - Expected pattern or core idea: Inorder sorted order.

### Medium

- Title: Validate Binary Search Tree
  - One-line prompt: Determine whether a binary tree satisfies the BST property.
  - Expected pattern or core idea: Range-based validation.
- Title: Delete Node in a BST
  - One-line prompt: Remove a key while preserving BST structure.
  - Expected pattern or core idea: Three delete cases.
- Title: Kth Smallest Element in a BST
  - One-line prompt: Return the kth smallest value.
  - Expected pattern or core idea: Inorder traversal.

### Hard

- Title: Recover Binary Search Tree
  - One-line prompt: Fix a BST where two values were swapped.
  - Expected pattern or core idea: Inorder anomaly detection.
- Title: Serialize and Deserialize BST
  - One-line prompt: Encode and decode a BST efficiently.
  - Expected pattern or core idea: BST order plus traversal serialization.
- Title: Binary Search Tree Iterator
  - One-line prompt: Build an iterator that returns BST values in sorted order.
  - Expected pattern or core idea: Controlled inorder traversal with stack state.

## 7. Short Recap

The core idea of this chapter is that BSTs use tree structure plus value ordering to narrow work to one relevant path instead of scanning everything.

The most important optimization insight is that inorder traversal turns many ordered BST questions into simple rank or boundary problems.

The most important implementation warning is that deletion and validation are about full-subtree correctness, not local comparisons or pointer changes alone.

This chapter prepares the next chapter by making ordered tree reasoning comfortable before heaps use a different ordering rule that optimizes access to only the extreme value.

## 8. Coverage Check

- [x] 18.1 BST property and search
- [x] 18.2 Insert and delete operations
- [x] 18.3 Validating a BST
- [x] 18.4 Kth smallest and order-statistics style problems
- [x] 18.5 Common BST interview questions

Coverage Summary: 5/5 official subtopics covered
This must always be 5/5 before final output

Next: 19: Heap and Priority Queue
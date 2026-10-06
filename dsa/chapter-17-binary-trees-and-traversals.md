# 17: Binary Trees and Traversals

**Goal:** Teach learners the major binary-tree shape categories, the meaning of each traversal order, and when to use recursive, iterative, breadth-first, or Morris-style traversal in Java.
**Outcome:** By the end of this chapter, you can distinguish full, complete, perfect, and balanced binary trees; implement inorder, preorder, postorder, and level-order traversals; and explain how Morris traversal achieves inorder traversal with `O(1)` extra space.

---

## 1. Intuition First

Binary trees matter because many algorithms become easier when each node has at most two children. That restriction creates clean traversal rules and supports later ordered structures like BSTs and heaps.

A simple real-world analogy is a decision tree with yes or no branches. At each point you can move left or right, and the order in which you visit nodes changes what information you see first.

The core mental model is this: a traversal is a visitation rule. In preorder you visit the current node before its children. In inorder you visit the left subtree, then the current node, then the right subtree. In postorder you visit children before the current node. In level order you visit breadth-first.

The most common beginner confusion point is memorizing traversal names without tying them to what the algorithm needs. Traversal order should be chosen because it matches the problem's dependency structure.

In the roadmap, this chapter sharpens the binary-tree model before BST ordering, heaps, and trie branching add more specialized behavior.

## 2. Core Concepts and Techniques

### Concept Cluster: Binary Tree Shapes
Key concepts in this block:
- 17.1 Full, complete, perfect, and balanced binary trees

#### Intuition

These terms describe shape constraints, not value ordering.

#### Why It Matters

Many tree guarantees and time bounds depend on shape. A balanced tree behaves very differently from a skewed one.

#### How It Works

- full binary tree: every node has either `0` or `2` children
- complete binary tree: every level is full except possibly the last, and the last level is filled left to right
- perfect binary tree: every internal node has `2` children and all leaves are at the same depth
- balanced binary tree: subtree heights stay within a limited difference, commonly at most `1` in interview problems

#### Java Implementation Notes

- These shape properties are usually checked by traversal logic, not by special node fields.
- Complete trees are especially important for array-based heaps later.

#### Common Mistakes

- confusing full with complete
- assuming complete implies perfect
- treating balanced as identical to complete

#### Quick Example

```java
class BinaryTreeShapeQuickNotes {
    static boolean isLeaf(int leftExists, int rightExists) {
        return leftExists == 0 && rightExists == 0;
    }
}
```

#### Debugging Tip

Draw a counterexample for each term. The easiest way to remember the definitions is to see what each one allows that the others do not.

#### Advanced Note

Balanced structure is often the real reason operations stay logarithmic in later ordered trees.

### Concept Cluster: Depth-First Traversals
Key concepts in this block:
- 17.2 Inorder traversal
- 17.3 Preorder traversal
- 17.4 Postorder traversal

#### Intuition

Depth-first traversals differ only in when the current node is processed relative to its children.

#### Why It Matters

Traversal order often reveals whether the problem depends on parent-before-child, child-before-parent, or left-root-right ordering.

#### How It Works

- inorder: left, root, right
- preorder: root, left, right
- postorder: left, right, root

Typical use cases:
- inorder on BSTs produces sorted values
- preorder is useful for copying or serialization with root-first logic
- postorder is useful when the answer for a node depends on both child results first

#### Java Implementation Notes

- Recursive traversal is the clearest first implementation.
- Iterative traversal uses an explicit stack and is worth learning because it makes control flow visible.
- Postorder iteration is often the trickiest because the current node must wait for both children.

#### Common Mistakes

- writing the right recursive calls but adding the value in the wrong place
- thinking inorder is special for all binary trees when it is only value-meaningful for BSTs
- pushing children in the wrong order for iterative preorder

#### Quick Example

```java
import java.util.ArrayList;
import java.util.List;

class TraversalQuickExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static List<Integer> preorder(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        preorder(root, result);
        return result;
    }

    private static void preorder(TreeNode node, List<Integer> result) {
        if (node == null) {
            return;
        }
        result.add(node.value);
        preorder(node.left, result);
        preorder(node.right, result);
    }
}
```

#### Debugging Tip

When a traversal output is wrong, annotate one node and ask exactly when its value should be recorded.

#### Advanced Note

Many tree DP problems are postorder in disguise because each parent depends on child summaries.

### Concept Cluster: Level-Order Traversal and Morris Traversal
Key concepts in this block:
- 17.5 Level-order traversal
- 17.6 Morris traversal

#### Intuition

Level order visits the tree breadth-first by depth. Morris traversal temporarily threads the tree to avoid using a stack for inorder traversal.

#### Why It Matters

Level order is the standard tool for per-level processing. Morris traversal is an advanced but important example of trading temporary pointer rewiring for lower space.

#### How It Works

Level order:
- use a queue
- process nodes level by level

Morris inorder:
- for a node with a left child, find the rightmost node in its left subtree
- temporarily point that predecessor back to the current node
- move left first, then restore the pointer later and visit the current node

#### Java Implementation Notes

- `ArrayDeque` works well for level-order traversal queues.
- Morris traversal mutates pointers temporarily, so it requires careful restoration.
- Use Morris only when the `O(1)` extra-space benefit is meaningful and the tree can be safely rewired during traversal.

#### Common Mistakes

- forgetting to separate levels in BFS problems
- not restoring threaded pointers in Morris traversal
- using Morris traversal when recursive or stack-based traversal is clearer and sufficient

#### Quick Example

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

class LevelOrderQuickExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) {
            return result;
        }

        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);

        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            List<Integer> level = new ArrayList<>();
            for (int count = 0; count < levelSize; count++) {
                TreeNode current = queue.poll();
                level.add(current.value);
                if (current.left != null) {
                    queue.offer(current.left);
                }
                if (current.right != null) {
                    queue.offer(current.right);
                }
            }
            result.add(level);
        }

        return result;
    }
}
```

#### Debugging Tip

For Morris traversal, print when a temporary thread is created and removed. That makes pointer restoration errors obvious.

#### Advanced Note

Morris traversal is a good reminder that space optimization can require structural mutation, not just a clever loop.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Binary Tree Level-Order Traversal
#### Problem Statement

Given the root of a binary tree, return the node values level by level from top to bottom.

#### Why This Example Matters

It is the standard breadth-first tree problem and the easiest way to see why queue-based traversal differs from DFS.

#### Constraints or Assumptions

- the tree may be empty
- nodes on the same depth should appear together
- left child should be processed before right child at the same level

#### Brute-Force Approach

First compute the height of the tree, then for each level call a helper that collects nodes exactly at that depth.

#### Better Approach

Use a queue and process one level at a time.

#### Why the Better Approach Works

The queue naturally stores the next frontier of nodes. Measuring the queue size at the start of each round gives you one complete level.

#### Pragmatic Java Choice

Use `ArrayDeque<TreeNode>` as the queue and group levels using the current queue size.

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

class LevelOrderExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static List<List<Integer>> levelOrderByDepthQueries(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        int height = height(root);
        for (int depth = 0; depth <= height; depth++) {
            List<Integer> level = new ArrayList<>();
            collectLevel(root, depth, level);
            result.add(level);
        }
        return result;
    }

    private static int height(TreeNode node) {
        if (node == null) {
            return -1;
        }
        return 1 + Math.max(height(node.left), height(node.right));
    }

    private static void collectLevel(TreeNode node, int depth, List<Integer> level) {
        if (node == null) {
            return;
        }
        if (depth == 0) {
            level.add(node.value);
            return;
        }
        collectLevel(node.left, depth - 1, level);
        collectLevel(node.right, depth - 1, level);
    }

    static List<List<Integer>> levelOrderWithQueue(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) {
            return result;
        }

        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);

        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            List<Integer> level = new ArrayList<>();

            for (int count = 0; count < levelSize; count++) {
                TreeNode current = queue.poll();
                level.add(current.value);
                if (current.left != null) {
                    queue.offer(current.left);
                }
                if (current.right != null) {
                    queue.offer(current.right);
                }
            }

            result.add(level);
        }

        return result;
    }
}
```

#### Dry Run

Use a tree with root `1`, children `2` and `3`, and node `2` having children `4` and `5`.

Queue method:
- start queue `[1]`, process level `[1]`
- queue becomes `[2, 3]`, process level `[2, 3]`
- queue becomes `[4, 5]`, process level `[4, 5]`
- queue is empty, stop

#### Time and Space Complexity

- Brute force: `O(nh)` time in the worst case, `O(h)` call stack space
- Better approach: `O(n)` time, `O(w)` extra queue space

#### Edge Cases

- empty tree returns `[]`
- single-node tree returns one level
- skewed tree gives one node per level

#### Common Mistakes

- not separating levels correctly
- forgetting to return an empty result for `null`
- using DFS order by accident when the problem expects BFS

### Worked Example 2: Inorder Traversal with Morris Traversal
#### Problem Statement

Given the root of a binary tree, return its inorder traversal.

#### Why This Example Matters

It connects the most common DFS traversal with an advanced space-optimization technique.

#### Constraints or Assumptions

- the tree may be empty
- output should be in left-root-right order
- temporary pointer rewiring is allowed during traversal as long as it is restored

#### Brute-Force Approach

Use recursive inorder traversal.

#### Better Approach

Use Morris inorder traversal to achieve `O(1)` extra space.

#### Why the Better Approach Works

When a node has a left subtree, its inorder predecessor is the rightmost node in that left subtree. Temporarily linking that predecessor back to the current node lets you return to the current node without an explicit stack.

#### Pragmatic Java Choice

Use recursive or stack-based inorder in most code. Use Morris when space is the real constraint and you are comfortable with pointer restoration.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class InorderMorrisExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static List<Integer> inorderRecursive(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        inorder(root, result);
        return result;
    }

    private static void inorder(TreeNode node, List<Integer> result) {
        if (node == null) {
            return;
        }
        inorder(node.left, result);
        result.add(node.value);
        inorder(node.right, result);
    }

    static List<Integer> inorderMorris(TreeNode root) {
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
                    predecessor.right = null;
                    result.add(current.value);
                    current = current.right;
                }
            }
        }

        return result;
    }
}
```

#### Dry Run

Use root `2` with left child `1` and right child `3`.

Morris traversal:
- current `2` has left child, predecessor is `1`
- thread `1.right` to `2`, move to `1`
- `1` has no left child, visit `1`, move to threaded `2`
- predecessor thread exists, remove it, visit `2`, move to `3`
- `3` has no left child, visit `3`

Result: `[1, 2, 3]`.

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(h)` call stack space
- Better approach: `O(n)` time, `O(1)` extra space

#### Edge Cases

- empty tree returns empty list
- single-node tree returns one value
- highly skewed trees still work because threading is restored

#### Common Mistakes

- forgetting to restore predecessor links
- visiting the current node at the wrong time
- treating Morris traversal as simpler than it is

### Worked Example 3: Check Whether a Binary Tree Is Height-Balanced
#### Problem Statement

Given the root of a binary tree, return `true` if it is height-balanced.

#### Why This Example Matters

It makes the balanced-tree concept concrete and shows how postorder-style summaries avoid repeated work.

#### Constraints or Assumptions

- a tree is balanced if every node's left and right subtree heights differ by at most `1`
- an empty tree is balanced

#### Brute-Force Approach

For every node, recompute the height of the left and right subtrees separately, then recurse into both children.

#### Better Approach

Use one bottom-up DFS that returns the subtree height or a failure marker.

#### Why the Better Approach Works

Each node needs child heights to decide whether it is balanced. Returning height information bottom-up lets every subtree be solved once.

#### Pragmatic Java Choice

Return `-2` as a special failure marker because valid heights under the edge-count convention are `-1` or greater.

#### Java Solution

```java
class BalancedTreeExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static boolean isBalancedBruteForce(TreeNode root) {
        if (root == null) {
            return true;
        }

        int leftHeight = height(root.left);
        int rightHeight = height(root.right);

        return Math.abs(leftHeight - rightHeight) <= 1
                && isBalancedBruteForce(root.left)
                && isBalancedBruteForce(root.right);
    }

    private static int height(TreeNode node) {
        if (node == null) {
            return -1;
        }
        return 1 + Math.max(height(node.left), height(node.right));
    }

    static boolean isBalancedOptimized(TreeNode root) {
        return checkHeight(root) != -2;
    }

    private static int checkHeight(TreeNode node) {
        if (node == null) {
            return -1;
        }

        int leftHeight = checkHeight(node.left);
        if (leftHeight == -2) {
            return -2;
        }

        int rightHeight = checkHeight(node.right);
        if (rightHeight == -2) {
            return -2;
        }

        if (Math.abs(leftHeight - rightHeight) > 1) {
            return -2;
        }

        return 1 + Math.max(leftHeight, rightHeight);
    }
}
```

#### Dry Run

Use a skewed tree `1 -> 2 -> 3` down the left side.

Optimized check:
- node `3` returns height `0`
- node `2` sees left `0`, right `-1`, returns `1`
- node `1` sees left `1`, right `-1`, difference `2`, returns failure marker `-2`
- final result is `false`

#### Time and Space Complexity

- Brute force: `O(n^2)` time in the worst case, `O(h)` call stack space
- Better approach: `O(n)` time, `O(h)` call stack space

#### Edge Cases

- empty tree is balanced
- single-node tree is balanced
- skewed tree often fails quickly in the optimized version

#### Common Mistakes

- recomputing heights repeatedly
- not agreeing on the height convention
- forgetting that every node, not just the root, must satisfy the balance condition

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- recursive DFS traversals usually run in `O(n)` time with `O(h)` call stack space
- level-order traversal runs in `O(n)` time with `O(w)` queue space
- Morris traversal preserves `O(n)` time while reducing extra space to `O(1)`, but the implementation is more delicate
- bottom-up traversal summaries often avoid repeated subtree work compared with naive top-down checks

Choose preorder when:
- the current node must be processed before its children
- you are building or serializing root-first structure

Choose inorder when:
- left-before-root-before-right order matters
- you later work with BST sorted order

Choose postorder when:
- the parent depends on completed child answers

Choose level order when:
- the problem is explicitly per level or shortest-depth style

Use Morris traversal when:
- extra stack space truly matters
- temporary pointer rewiring is acceptable

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- putting node visitation in the wrong place for DFS
- mixing up tree shape terminology
- failing to separate BFS levels
- not restoring temporary Morris threads

Boundary and shape risks:
- empty tree
- single-node tree
- skewed trees with high recursion depth
- duplicate values that do not affect traversal order but can confuse manual tracing

Short debugging checklist:
- When exactly should the current node be visited?
- Does the problem need DFS or BFS?
- Am I relying on a shape property like balanced or complete correctly?
- If I use Morris traversal, are all temporary links restored?
- Can I state what each traversal order means without looking it up?

## 6. Practice Problems

### Easy

- Title: Binary Tree Inorder Traversal
  - One-line prompt: Return the inorder sequence of a binary tree.
  - Expected pattern or core idea: Left-root-right DFS.
- Title: Binary Tree Preorder Traversal
  - One-line prompt: Return the preorder sequence of a binary tree.
  - Expected pattern or core idea: Root-left-right DFS.
- Title: Binary Tree Level Order Traversal
  - One-line prompt: Return the values grouped by depth.
  - Expected pattern or core idea: Queue-based BFS.

### Medium

- Title: Binary Tree Zigzag Level Order Traversal
  - One-line prompt: Traverse the tree level by level while alternating direction.
  - Expected pattern or core idea: BFS with level-direction handling.
- Title: Balanced Binary Tree
  - One-line prompt: Check whether the tree is height-balanced.
  - Expected pattern or core idea: Bottom-up height summary.
- Title: Flatten Binary Tree to Linked List
  - One-line prompt: Rewrite the tree into preorder-linked form.
  - Expected pattern or core idea: Preorder reasoning with pointer updates.

### Hard

- Title: Binary Tree Postorder Traversal
  - One-line prompt: Return the postorder sequence without recursion if possible.
  - Expected pattern or core idea: Iterative postorder control.
- Title: Recover Binary Search Tree
  - One-line prompt: Fix two swapped BST nodes.
  - Expected pattern or core idea: Inorder ordering, possibly with Morris traversal.
- Title: Vertical Order Traversal of a Binary Tree
  - One-line prompt: Group nodes by vertical columns.
  - Expected pattern or core idea: BFS or DFS with coordinate tracking.

## 7. Short Recap

The core idea of this chapter is that traversal order is a deliberate choice based on what information must be available before or after a node is processed.

The most important optimization insight is that bottom-up DFS and Morris traversal show two different ways to avoid unnecessary extra work or space.

The most important implementation warning is to keep traversal order and shape terminology precise, because small wording mistakes become wrong algorithms quickly.

This chapter prepares the next chapter by making inorder meaning and binary-tree structure stable before BSTs attach ordering rules to the node values themselves.

## 8. Coverage Check

- [x] 17.1 Full, complete, perfect, and balanced binary trees
- [x] 17.2 Inorder traversal
- [x] 17.3 Preorder traversal
- [x] 17.4 Postorder traversal
- [x] 17.5 Level-order traversal
- [x] 17.6 Morris traversal

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 18: Binary Search Trees
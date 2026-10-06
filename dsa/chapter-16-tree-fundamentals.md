# 16: Tree Fundamentals

**Goal:** Teach learners how tree structure differs from linear data structures, how to represent trees cleanly in Java, and how recursive reasoning naturally matches parent-child relationships.
**Outcome:** By the end of this chapter, you can explain core tree terminology, distinguish height from depth and degree, identify root, internal, and leaf nodes, represent trees in Java, and write basic recursive tree traversals and aggregations.

---

## 1. Intuition First

Trees matter because many real systems are hierarchical rather than linear. Filesystems, company org charts, HTML documents, and category menus all branch from parent to child instead of forming one straight sequence.

A simple real-world analogy is a family tree. One ancestor branches into children, then grandchildren, then deeper generations. Each person has one parent connection above and several child connections below.

The core mental model is this: a tree is a connected structure with no cycles, and each subtree is itself a smaller tree. That recursive shape is why recursion becomes the default mental tool here.

The most common beginner confusion point is mixing up height and depth. Depth measures how far a node is from the root. Height measures how far a node is from its deepest descendant.

In the roadmap, this chapter opens Part IV. It gives you the vocabulary and mental model needed before binary trees, BSTs, heaps, tries, and range-query trees start adding stronger rules.

## 2. Core Concepts and Techniques

### Concept Cluster: Tree Terminology, Height, Depth, Degree, and Node Roles
Key concepts in this block:
- 16.1 Tree terminology
- 16.2 Height, depth, and degree
- 16.3 Root, internal, and leaf nodes

#### Intuition

Tree terminology exists so you can describe structure precisely before writing algorithms on top of it.

#### Why It Matters

If you cannot distinguish parent, child, ancestor, descendant, depth, or leaf, tree algorithms become much harder to explain and debug.

#### How It Works

- root: the topmost node with no parent
- parent and child: the direct connection between neighboring levels
- ancestor and descendant: any higher or lower node on the same path
- degree of a node: number of children
- leaf node: node with no children
- internal node: node with at least one child
- depth of a node: number of edges from the root to that node
- height of a node: number of edges on the longest downward path to a leaf
- height of the tree: height of the root

#### Java Implementation Notes

- In binary trees, each node usually stores `left` and `right` references.
- In general trees, use a list of children.
- Decide early whether height counts edges or nodes, and keep that definition consistent.

#### Common Mistakes

- using height and depth interchangeably
- calling the root a leaf when it is the only node without clarifying the convention
- forgetting that degree is about children, not depth

#### Quick Example

```java
import java.util.ArrayList;
import java.util.List;

class GeneralTreeQuickExample {
    static final class Node {
        int value;
        List<Node> children = new ArrayList<>();

        Node(int value) {
            this.value = value;
        }
    }
}
```

#### Debugging Tip

Draw a small tree and label root, leaf, depth, and height manually before coding. Many tree bugs are really vocabulary bugs.

#### Advanced Note

Later chapters add special constraints, such as binary branching or BST order, but the parent-child hierarchy from this chapter still stays underneath everything.

### Concept Cluster: Tree Representation in Java and Recursion on Trees
Key concepts in this block:
- 16.4 Tree representation in Java
- 16.5 Recursion on trees

#### Intuition

A tree is easiest to process when each node directly points to its children. Recursion then becomes a natural way to solve the same task for every subtree.

#### Why It Matters

Representation determines whether algorithms feel simple or painful. Good tree code usually comes from choosing a node structure that matches the operations you need.

#### How It Works

- binary trees use a node with `left` and `right`
- general trees often use `List<Node> children`
- some problems start from edges, so you first build adjacency or child lists
- recursive tree functions usually follow this pattern:
  - handle the null or leaf case
  - solve the problem for each child
  - combine those child answers at the current node

#### Java Implementation Notes

- Use `null` carefully to represent missing children in binary trees.
- If the input is an edge list, convert it into node references or adjacency lists before running recursive logic.
- A recursive helper often returns a summary value such as count, height, or boolean validity for the current subtree.

#### Common Mistakes

- recursing into `null` without a base case
- rebuilding child lookup repeatedly instead of representing the tree once
- forgetting whether the recursion should process children before or after combining results

#### Quick Example

```java
class BinaryTreeQuickExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static int countNodes(TreeNode root) {
        if (root == null) {
            return 0;
        }
        return 1 + countNodes(root.left) + countNodes(root.right);
    }
}
```

#### Debugging Tip

When a recursive tree method fails, ask three questions: what is the base case, what information comes from each child, and how are those child answers combined?

#### Advanced Note

Many advanced tree algorithms are still just specialized versions of subtree-return recursion with better summary information.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Count Nodes in a Binary Tree
#### Problem Statement

Given the root of a binary tree, return how many nodes it contains.

#### Why This Example Matters

It is the simplest non-trivial tree recursion. It shows how a whole-tree answer is built from left and right subtree answers.

#### Constraints or Assumptions

- the tree may be empty
- the tree is not necessarily balanced
- every node should be counted exactly once

#### Brute-Force Approach

Use an explicit queue and perform a level-order traversal, counting nodes one by one.

#### Better Approach

Use recursion and return `1 + leftCount + rightCount` for each node.

#### Why the Better Approach Works

Every subtree is itself a smaller binary tree. If you know how many nodes are in the left and right subtrees, the current node contributes exactly one more.

#### Pragmatic Java Choice

Use recursion here because the combine rule is direct and easy to verify.

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.Queue;

class CountNodesExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static int countWithQueue(TreeNode root) {
        if (root == null) {
            return 0;
        }

        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        int count = 0;

        while (!queue.isEmpty()) {
            TreeNode current = queue.poll();
            count++;

            if (current.left != null) {
                queue.offer(current.left);
            }
            if (current.right != null) {
                queue.offer(current.right);
            }
        }

        return count;
    }

    static int countRecursively(TreeNode root) {
        if (root == null) {
            return 0;
        }
        return 1 + countRecursively(root.left) + countRecursively(root.right);
    }
}
```

#### Dry Run

Use a tree with root `10`, left child `5`, right child `20`, and `20` having left child `15`.

Recursive count:
- root `10` needs count of left subtree and right subtree
- left subtree rooted at `5` returns `1`
- right subtree rooted at `20` returns `1 + 1 + 0 = 2`
- root returns `1 + 1 + 2 = 4`

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(w)` extra space for the queue where `w` is max width
- Better approach: `O(n)` time, `O(h)` call stack space where `h` is tree height

#### Edge Cases

- empty tree returns `0`
- single-node tree returns `1`
- skewed trees increase recursion depth

#### Common Mistakes

- forgetting the `null` base case
- returning only child counts without adding `1` for the current node
- confusing tree height with node count

### Worked Example 2: Compute the Height of a Binary Tree
#### Problem Statement

Given the root of a binary tree, return its height measured in edges.

#### Why This Example Matters

It forces you to distinguish depth from height and introduces the max-combine pattern common in tree recursion.

#### Constraints or Assumptions

- an empty tree has height `-1`
- a single-node tree has height `0`
- height is measured in edges, not nodes

#### Brute-Force Approach

Use level-order traversal and count how many levels are processed.

#### Better Approach

Use recursion: the height of a node is `1 + max(leftHeight, rightHeight)`.

#### Why the Better Approach Works

The longest root-to-leaf path must go through either the left child or the right child. Recursion finds both subtree heights and keeps the larger one.

#### Pragmatic Java Choice

Choose a base case that matches the height definition exactly. Using `-1` for `null` makes a leaf's height become `0` naturally.

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.Queue;

class HeightExample {
    static final class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    static int heightByLevels(TreeNode root) {
        if (root == null) {
            return -1;
        }

        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        int height = -1;

        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            height++;

            for (int count = 0; count < levelSize; count++) {
                TreeNode current = queue.poll();
                if (current.left != null) {
                    queue.offer(current.left);
                }
                if (current.right != null) {
                    queue.offer(current.right);
                }
            }
        }

        return height;
    }

    static int heightRecursively(TreeNode root) {
        if (root == null) {
            return -1;
        }
        return 1 + Math.max(heightRecursively(root.left), heightRecursively(root.right));
    }
}
```

#### Dry Run

Use a tree where root `1` has left child `2`, right child `3`, and node `2` has left child `4`.

Recursive height:
- node `4` has height `0`
- node `2` sees left height `0` and right height `-1`, so height `1`
- node `3` is a leaf, so height `0`
- root sees `max(1, 0)`, so height `2`

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(w)` extra space
- Better approach: `O(n)` time, `O(h)` call stack space

#### Edge Cases

- empty tree height is `-1` by this convention
- single-node tree height is `0`
- skewed tree height can be `n - 1`

#### Common Mistakes

- mixing node-based and edge-based height definitions
- returning `0` for `null` when the chosen convention expects `-1`
- taking `min` instead of `max`

### Worked Example 3: Build a Rooted Tree from Edges and Compute Subtree Sizes
#### Problem Statement

Given `n` nodes labeled `0` to `n - 1`, a list of parent-child edges for a rooted tree, and the root node, return the size of every node's subtree.

#### Why This Example Matters

It shows why representation matters. Tree algorithms become simpler once you convert raw edges into child lists.

#### Constraints or Assumptions

- the input edges form a valid rooted tree
- subtree size includes the node itself
- the root is given

#### Brute-Force Approach

For every recursive step, scan the entire edge list to find the current node's children.

#### Better Approach

Build an adjacency list once, then run one DFS recursion to compute subtree sizes.

#### Why the Better Approach Works

The adjacency list gives direct access to children, so each edge is processed once instead of being rediscovered repeatedly.

#### Pragmatic Java Choice

Use `List<List<Integer>>` when the tree comes from edge data instead of prebuilt node objects.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class SubtreeSizeExample {
    static int[] subtreeSizesByScanningEdges(int n, int[][] edges, int root) {
        int[] sizes = new int[n];
        computeByScanning(root, edges, sizes);
        return sizes;
    }

    private static int computeByScanning(int node, int[][] edges, int[] sizes) {
        int size = 1;
        for (int[] edge : edges) {
            if (edge[0] == node) {
                size += computeByScanning(edge[1], edges, sizes);
            }
        }
        sizes[node] = size;
        return size;
    }

    static int[] subtreeSizesWithAdjacency(int n, int[][] edges, int root) {
        List<List<Integer>> children = new ArrayList<>();
        for (int node = 0; node < n; node++) {
            children.add(new ArrayList<>());
        }

        for (int[] edge : edges) {
            children.get(edge[0]).add(edge[1]);
        }

        int[] sizes = new int[n];
        computeWithAdjacency(root, children, sizes);
        return sizes;
    }

    private static int computeWithAdjacency(int node, List<List<Integer>> children, int[] sizes) {
        int size = 1;
        for (int child : children.get(node)) {
            size += computeWithAdjacency(child, children, sizes);
        }
        sizes[node] = size;
        return size;
    }
}
```

#### Dry Run

Use `n = 5`, `edges = [[0, 1], [0, 2], [1, 3], [1, 4]]`, `root = 0`.

Adjacency list:
- `0 -> [1, 2]`
- `1 -> [3, 4]`
- `2 -> []`
- `3 -> []`
- `4 -> []`

Subtree sizes:
- nodes `3` and `4` return `1`
- node `1` returns `1 + 1 + 1 = 3`
- node `2` returns `1`
- node `0` returns `1 + 3 + 1 = 5`

#### Time and Space Complexity

- Brute force: `O(n * e)` time in the worst case because edges are rescanned repeatedly, `O(h)` call stack space
- Better approach: `O(n + e)` time, `O(n + e)` adjacency space plus `O(h)` call stack space

#### Edge Cases

- single-node tree gives subtree size `1`
- leaves always have subtree size `1`
- malformed edge input would break the tree assumption

#### Common Mistakes

- recomputing child lookup repeatedly from the raw edge list
- forgetting to count the current node in its own subtree size
- confusing parent-child direction in the edge list

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- tree traversals usually touch each node once, so the natural baseline is often `O(n)` time
- recursion on trees typically uses `O(h)` call stack space, where `h` is tree height
- queue-based level traversal uses `O(w)` extra space, where `w` is the maximum width
- a good representation choice, such as child lists instead of rescanning edges, often matters as much as the traversal itself

Choose recursion when:
- the answer for a node depends on answers from its children
- the subtree structure is naturally recursive
- the tree height is manageable

Choose explicit queue or stack traversal when:
- the problem is naturally level-based
- you want to avoid deep recursion
- the traversal order is breadth-first rather than depth-first

Recognition signals for tree problems:
- parent-child hierarchy
- no cycles and exactly one root path in rooted settings
- subtree answers combine into a whole-tree answer

Signals not to force tree logic:
- the input is really a general graph with cycles
- the structure is mostly sequential rather than hierarchical

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- missing `null` base cases
- mixing height and depth definitions
- forgetting whether leaf handling should return `0`, `1`, or `-1` based on the chosen metric
- representing a tree poorly and then fighting the traversal code

Boundary and representation risks:
- empty tree
- single-node tree
- skewed trees with large height
- incorrect parent-child direction when building from edges

Short debugging checklist:
- What does the base case return for `null`?
- What information do I need from each child?
- Am I computing depth or height?
- Does my representation give direct access to children?
- If the tree came from edges, have I built it only once?

## 6. Practice Problems

### Easy

- Title: Maximum Depth of Binary Tree
  - One-line prompt: Return the maximum root-to-leaf depth.
  - Expected pattern or core idea: Recursive height computation.
- Title: Count Complete Tree Nodes
  - One-line prompt: Return the number of nodes in a binary tree.
  - Expected pattern or core idea: Tree counting with recursion.
- Title: Same Tree
  - One-line prompt: Decide whether two binary trees are identical.
  - Expected pattern or core idea: Recursive structural comparison.

### Medium

- Title: Balanced Binary Tree
  - One-line prompt: Determine whether every node's subtree heights differ by at most one.
  - Expected pattern or core idea: Recursive height summary.
- Title: Diameter of Binary Tree
  - One-line prompt: Return the longest path length in the tree.
  - Expected pattern or core idea: Bottom-up recursion combining subtree heights.
- Title: Subtree of Another Tree
  - One-line prompt: Check whether one tree appears inside another.
  - Expected pattern or core idea: Recursive comparison plus traversal.

### Hard

- Title: Binary Tree Maximum Path Sum
  - One-line prompt: Find the highest-value path through a binary tree.
  - Expected pattern or core idea: Recursive subtree contribution summary.
- Title: Serialize and Deserialize Binary Tree
  - One-line prompt: Convert a tree to text and back.
  - Expected pattern or core idea: Representation plus traversal order.
- Title: Sum of Distances in Tree
  - One-line prompt: Compute distance sums for every node in a tree.
  - Expected pattern or core idea: Tree DP with rerooting insight.

## 7. Short Recap

The core idea of this chapter is that trees are hierarchical structures where each subtree can usually be solved the same way as the whole tree.

The most important optimization insight is that a good representation and a clean subtree-return recursion often eliminate repeated work immediately.

The most important implementation warning is to define height, depth, and base cases precisely before coding.

This chapter prepares the next chapter by making binary-tree shape and recursive traversal natural before specific traversal orders and binary-tree properties matter more.

## 8. Coverage Check

- [x] 16.1 Tree terminology
- [x] 16.2 Height, depth, and degree
- [x] 16.3 Root, internal, and leaf nodes
- [x] 16.4 Tree representation in Java
- [x] 16.5 Recursion on trees

Coverage Summary: 5/5 official subtopics covered
This must always be 5/5 before final output

Next: 17: Binary Trees and Traversals
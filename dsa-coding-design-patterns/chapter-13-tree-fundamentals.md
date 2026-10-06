
# 13: Tree Fundamentals

## Introduction and Context

Trees matter because many real systems are hierarchical rather than linear. Filesystems, org charts, HTML documents, and category menus all branch from parent to child. Linear data structures force everything into a sequence; trees capture the actual shape of the problem.

The core challenge is that many learners understand recursion but struggle to match recursion state with tree structure. A wrong return value or a missing base case silently corrupts the entire subtree. Similarly, choosing between DFS and BFS changes what information is available at each step—DFS reveals path context, BFS reveals layer order.

Tree correctness comes from explicitly naming the invariant: what does this recursive call represent? What state enters a node? What state leaves it?

## Core Intuition and Mechanics

Think of a tree as a function evaluation chart. The root is the main problem. Subtrees are subproblems. Recursion is not a mysterious loop—it is a restatement of "solve the subtree, combine results."

- **DFS** visits deeply; you know the full path from root to current node.
- **BFS** visits breadth-first; you know all nodes at the current distance from root.
- **Preorder** visits parent before children; useful for copying or writing state.
- **Postorder** visits children before parent; useful when the answer depends on child results first.
- **Inorder** (on binary trees) visits left, parent, right; useful for sorted traversal in BSTs.

The mechanical invariants that matter:
- Base case: when a node is null or a leaf, stop.
- Recursive case: combine results from children in the correct order.
- Return value: match what the problem actually needs (a count, a node, a path, or nothing).

## Core Concepts and Subtopics

### Concept Cluster: Tree Terminology and Properties
Topics in this cluster:
- 13.1 Tree terminology; Height, depth, and degree; Root, internal, and leaf nodes
- 13.5 Tree properties; Full, complete, perfect, and balanced binary trees

#### Definition

**Root**: the topmost node with no parent. **Leaf**: a node with no children. **Internal node**: a node with at least one child. **Depth**: edges from root to a node. **Height**: edges from a node to its deepest descendant. **Degree**: number of children. **Full binary tree**: every node has 0 or 2 children. **Complete binary tree**: every level full except possibly the last, filled left-to-right. **Perfect binary tree**: all internal nodes have 2 children and all leaves at the same depth. **Balanced binary tree**: subtree heights differ by at most 1.

#### Why It Matters

Tree terminology lets you describe structure precisely. Shape properties like "complete" guarantee array-based efficiency (heaps). Understanding depth vs. height prevents off-by-one bugs in recursion.

#### Java Implementation Notes

```java
class TreeNode {
    int value;
    TreeNode left, right;
    List<TreeNode> children;  // for general trees
    TreeNode(int value) { this.value = value; }
}
```

For general trees, use `List<TreeNode>`. For binary trees, use explicit `left` and `right`.

#### Common Mistakes

- Confusing depth and height.
- Assuming a node with one child is a leaf.
- Calling a single-node tree a leaf (it is a root).

---

### Concept Cluster: DFS and BFS Recursion Patterns
Topics in this cluster:
- 13.3 Recursion on trees; DFS recursion on trees; Tree DFS Pattern
- 13.4 BFS level order; Tree BFS Pattern; Level-order traversal
- 13.6 Path state, subtree state, and ancestor queries

#### Definition

**DFS recursion**: process subtrees in a single execution chain. **BFS**: process nodes level by level using a queue. **Path state**: information about the path from root to current node. **Subtree state**: information about a fully processed subtree.

#### How DFS Works

Preorder processes parent before children. Postorder processes children before parent.

```java
void dfs(TreeNode node, List<Integer> result) {
    if (node == null) return;
    result.add(node.value);                    // preorder
    dfs(node.left, result);
    dfs(node.right, result);
}
```

#### How BFS Works

```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.value);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}
```

#### Java Notes

For DFS, recursion is clearest. For BFS, use `ArrayDeque` or `LinkedList` as the queue. **Key insight**: measure the queue size at loop start to separate levels.

#### Common Mistakes

- Forgetting the null check.
- Mixing up what the return value means.
- Not separating levels in BFS.

---

## Worked Examples

### Worked Example 1: Maximum Depth (DFS Path State)

```java
int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Why it works**: the height of a subtree is 1 plus the height of the taller child. Base case is null → 0.

### Worked Example 2: Level-Order Traversal (BFS)

```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> q = new LinkedList<>();
    q.offer(root);
    while (!q.isEmpty()) {
        int size = q.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode n = q.poll();
            level.add(n.value);
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
        result.add(level);
    }
    return result;
}
```

**Key insight**: the queue size at the start of each loop iteration is exactly one level.

### Worked Example 3: Validate Binary Search Tree (Subtree + Ancestor State)

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

**Why it works**: track the valid range as we descend. The value must be strictly between the bounds.

---

## Solved Problems

**Problem 1 (Easy)**: Invert a binary tree (swap left and right recursively).

**Problem 2 (Easy)**: Check if a tree is symmetric (mirror image).

**Problem 3 (Medium)**: Path sum (root-to-leaf sums; return count where sum equals target).

**Problem 4 (Medium)**: Lowest common ancestor of two nodes in a tree.

**Problem 5 (Hard)**: Serialize and deserialize a binary tree (BFS or preorder with markers).

---

## Recognition Guide

Use tree DFS when the answer depends on subtree results or path-to-root context. Use BFS when you need layer-by-layer processing or shortest edge distance. Choose DFS when combining child results; BFS when processing one level at a time.

Avoid forced recursion on non-tree inputs. Do not mix DFS and BFS in the same traversal unless you have a clear reason.

---

## Comparison Tables

| Pattern | Use Case | Space | Time |
|---------|----------|-------|------|
| DFS Recursion | subtree summaries, path questions | O(height) stack | O(n) |
| BFS Queue | level order, shortest distance | O(width) queue | O(n) |
| Preorder | copy tree, prefix expression | O(height) stack | O(n) |
| Postorder | aggregate from children | O(height) stack | O(n) |

---

## Design and Decision Making

Before writing any tree code, ask: "What does each recursive call return?" and "What state needs to flow down (ancestors) vs. up (children)?"

For path state, pass arguments downward. For subtree state, return values upward. Mix them when needed, but name both explicitly.

Avoid deep nesting of recursive calls; keep the call chain to 2–3 levels in the main logic.

---

## Practical Applications

- **Filesystems**: traverse directories and compute total size using postorder.
- **DOM trees**: find elements using BFS and ancestors using DFS with bounds.
- **Org charts**: count team size (postorder) or find all reports (DFS).
- **Game trees**: minimax uses postorder to compute best move at each level.

---

## Failure Modes and Trade-offs

**Deep recursion**: stack overflow if height > ~10000. Use iteration + explicit stack for very deep trees.

**Wrong base case**: returns garbage for single-node trees. Always test null and single-node cases first.

**Missing null checks**: crashes if pointers are null. Guard every child access or ensure preconditions in documentation.

**Returning the wrong type**: matching return value to recursive usage is error-prone. Write a comment if unclear.

---

## Condensed Notes

- Base case: `if (node == null) return ...`
- Preorder: parent, left, right.
- Postorder: left, right, parent.
- DFS: recursion stack = path state.
- BFS: queue levels = layer state.
- Validate BST: track min/max as you descend.
- Height: `1 + max(left, right)`.

---

## Additional Problems

**Easy**: Diameter of binary tree. Same tree. Subtree of another tree. Univalued subtree.

**Medium**: Binary tree right side view. Maximum path sum. Reconstruct tree from traversals.

**Hard**: Serialize/deserialize BST. Median of two BSTs. Maximum product path.

---

## Key Questions

1. What is the difference between depth and height?
2. When do you use DFS vs. BFS?
3. Why does postorder suit aggregation problems?
4. How do you validate a BST using only one pass?
5. What state flows down in recursive tree algorithms?
6. How do you avoid stack overflow in very deep trees?
7. Why does BFS require queue-size measurement at loop start?
8. How do you reconstruct a tree from preorder and inorder?
9. What is the invariant for path-state recursion?
10. How do you handle trees with more than two children?

---

## Applied Project

Build a **file system browser**: represent directories as a tree, allow traversal, compute total size, and find largest files using DFS and BFS.


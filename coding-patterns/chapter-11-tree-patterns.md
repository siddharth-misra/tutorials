# 11: Tree Patterns

## 0. Introduction

This chapter sits in Part III - Recursive Search, Trees, and Graph Structure (Weeks 10-15), with the roadmap treating it as intermediate to upper intermediate work. Its goal is to learn how to reason about trees through traversal state, subtree summaries, ancestor relationships, and prefix-structured search so you can choose the right tree pattern instead of treating every tree problem as raw recursion. This chapter directly supports the Part III outcome of mapping tree problems to the right traversal or preprocessing pattern and explaining recursion state without hand-waving.

Read it as a bridge in the larger sequence. Chapter 10 introduced recursive search trees and backtracking. This chapter turns that search-state thinking into concrete tree traversals, subtree summaries, and ancestor-aware reasoning. Chapter 12 generalizes many of these traversal ideas from trees to full graph connectivity, cycles, dependencies, and components. Start this chapter after you are comfortable with Chapters 1 through 10, especially recursion trees, queues, stacks, and the idea that each recursive call or frontier entry carries precise state. The main themes here are Tree DFS Pattern, Tree BFS Pattern, Lowest Common Ancestor Pattern, Trie Pattern, Prefix Tree Search Pattern, and Path state, subtree state, and ancestor queries.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to apply tree DFS and tree BFS, solve lowest common ancestor queries, implement a trie and prefix search workflow, and explain how path state, subtree state, and ancestor information control correctness in Java tree solutions.

## 1. Intuition First

This chapter matters because trees look simple on the surface but hide several distinct kinds of state. Sometimes you care about the path from the root to the current node. Sometimes you care only about a fully processed subtree. Sometimes you care about ancestor relationships between two nodes. Sometimes the “tree” is not a binary tree at all, but a trie built from characters.

The simplest analogy is a company org chart. If you ask, “who is the deepest manager chain?” you care about path depth. If you ask, “what is the total team size under this manager?” you care about subtree summaries. If you ask, “who is the nearest common manager of two employees?” you care about ancestors. If you ask, “which stored words share this prefix?” you are effectively walking a character tree.

The core mental model is:

- DFS is natural when a recursive path or subtree summary matters
- BFS is natural when layer order or minimum edge distance from the root matters
- LCA asks for the lowest shared ancestor of two target nodes
- tries treat prefixes as explicit tree paths
- tree correctness depends on naming the right kind of state: path, subtree, or ancestor

Recognition signals for this chapter:

- binary tree or rooted tree input
- level-by-level output or nearest-depth behavior
- path sum, root-to-leaf, or ancestor relationship questions
- prefix lookup, autocomplete, or dictionary matching
- subtree aggregate values such as size, height, balance, or sum

The most common beginner confusion point is using recursion on trees without deciding what the recursive call is supposed to return. A tree DFS is easy to write syntactically and still wrong semantically if the return value does not match the needed subtree information.

In the larger roadmap, this chapter is the first step from generic recursive search into structured hierarchical data. It teaches how to make the shape of the tree and the meaning of the traversal state explicit.

## 2. Learning Path and Recognition Checklist

The chapter starts with tree DFS because depth-first recursion is the most direct way to explain subtree state, path state, and return-value meaning. It then adds tree BFS for level-wise traversal and shortest edge-distance reasoning in unweighted trees. After that, it focuses on lowest common ancestor queries, where ancestor state and return propagation matter. Finally, it introduces tries and prefix-tree search, showing that trees are not only pointer structures over numeric nodes but also search structures over characters.

Recognition checklist for this chapter:

- Is the input a rooted tree, binary tree, or prefix tree?
- Does the answer depend on root-to-node path information or fully processed subtree information?
- Is the output grouped by levels or asking for the shallowest or nearest node by edge count?
- Are two target nodes related by ancestry, making LCA the hidden pattern?
- Does the problem ask for repeated prefix lookup, full-word existence, or prefix-guided search over strings?
- What should each recursive call return: a boolean, a height, a node, an aggregate sum, or nothing because state is updated externally?

The brute-force baselines often look like this:

- recompute subtree information repeatedly from scratch
- store every root-to-node path and compare entire paths for ancestor questions
- scan every stored word linearly for each prefix query instead of using a trie
- use repeated DFS from the root when a single BFS by levels would answer the question directly

The optimization in this chapter is to match the traversal to the state:

- DFS for subtree summaries and path-sensitive recursion
- BFS for levels and distance by edge count
- LCA for ancestor queries
- trie traversal for prefix-structured string search

Mastery by the end of the chapter looks like this: you can explain what state enters a node, what state leaves a node, whether the traversal is path-driven or level-driven, and why the chosen tree abstraction matches the question.

Do not force DFS when the output is fundamentally by layers. Do not force BFS when the main issue is a recursive subtree return value. Do not force a trie for tiny one-off word lists where linear scan is simpler.

## 3. Official Subtopic Coverage

### Concept Cluster: Depth-First and Breadth-First Tree Traversal
Official subtopics covered:
- 11.1 Tree DFS Pattern
- 11.2 Tree BFS Pattern

#### Definition or Framing
Tree DFS explores deeply into one branch before returning, making it ideal for recursive path reasoning and subtree aggregation. Tree BFS explores the tree level by level using a queue, making it ideal for breadth-wise output and shortest edge-distance from the root in an unweighted tree.

#### Recognition Signals
- DFS: subtree size, height, balance, path sum, postorder aggregation
- BFS: level order traversal, right-side view by level, minimum depth, layer grouping

#### Brute-Force Baseline
- DFS-style problems: recompute subtree values from descendants multiple times
- BFS-style problems: track node depths manually with repeated scans per depth

#### Optimized Pattern Idea
Use DFS when each node should return a summary about its subtree or path. Use BFS when processing order by level is the core structure.

#### Invariant / State Representation / Transition Logic
In DFS, the recursive call owns one subtree and returns information that is complete for that subtree. In BFS, the queue contains the current frontier in level order, and each loop iteration processes nodes whose distance from the root is already fixed.

#### Java Implementation Notes
- recursive DFS is concise for binary trees and rooted trees
- BFS usually uses `ArrayDeque<TreeNode>`
- when BFS groups by level, record `levelSize = queue.size()` before processing the current layer

#### Quick Dry Run
For a tree rooted at `3` with children `9` and `20`, BFS first processes `[3]`, then `[9, 20]`, then their children. DFS instead follows one branch down first, such as `3 -> 20 -> 15`, before returning.

#### Common Mistakes
- using DFS for a level-order output and then rebuilding levels awkwardly afterward
- using BFS while still expecting a subtree return value
- forgetting the base case for null children in DFS

#### Debugging Strategy
For DFS, print node values on entry and exit to see subtree ownership. For BFS, print each queue layer separately so level boundaries are visible.

#### Comparison with Similar Pattern
DFS and BFS both visit all nodes in $O(n)$ time, but they answer different structural questions naturally. The difference is not speed first. It is state meaning.

#### Advanced Note
Later graph chapters reuse DFS and BFS, but trees remove cycle handling, which makes the state model much easier to see clearly here.

### Concept Cluster: Ancestors, Paths, and Subtrees
Official subtopics covered:
- 11.3 Lowest Common Ancestor Pattern
- 11.6 Path state, subtree state, and ancestor queries

#### Definition or Framing
The Lowest Common Ancestor Pattern finds the deepest node that is an ancestor of two target nodes. More broadly, tree problems often depend on three kinds of state: path state from root to current node, subtree state computed from descendants, and ancestor relationships between nodes.

#### Recognition Signals
- nearest shared ancestor, common manager, or fork point in a rooted tree
- root-to-node path conditions such as path sum or path string
- subtree aggregate questions such as size, height, or best value below a node
- queries that compare two nodes through their ancestry

#### Brute-Force Baseline
- build the full root-to-node path for each target and compare the paths
- recompute subtree information separately for many nodes
- track ancestor sets explicitly when a recursive return can encode the answer more directly

#### Optimized Pattern Idea
Use recursive returns to propagate whether targets were found in left or right subtrees. More generally, choose the correct tree state model: path state travels down, subtree state returns up, and ancestor queries often combine both viewpoints.

#### Invariant / State Representation / Transition Logic
For LCA in a binary tree, a recursive call returns one of three meaningful results: target found in this subtree, no target found, or current node is the split point where both targets are found in different branches or one is the current node.

Path state is valid only along the current root-to-node path. Subtree state is complete only after both child calls return. Ancestor queries rely on how these facts propagate upward.

#### Java Implementation Notes
- define clearly whether node identity is by reference or by value
- for path problems, mutate the path on descent and rollback on ascent
- for subtree problems, return a compact summary object or primitive when possible

#### Quick Dry Run
If one target is found in the left subtree and the other in the right subtree of a node, that node is the lowest common ancestor. If both targets are found entirely in one subtree, the answer stays lower in that subtree.

#### Common Mistakes
- comparing only node values when duplicate values could exist
- confusing “lowest” with “closest to the root” instead of deepest shared ancestor
- trying to use a subtree return value where path state was actually needed

#### Debugging Strategy
Ask for each variable: is this information valid only on the current path, only after both children return, or as an ancestor relation between targets? Many tree bugs come from mixing those categories.

#### Comparison with Similar Pattern
LCA is not just “another DFS.” It is a DFS whose return meaning is specifically about descendant target presence and shared ancestry.

#### Advanced Note
Later advanced chapters revisit LCA with preprocessing for repeated queries, but the recursive ancestor logic learned here remains the conceptual base.

### Concept Cluster: Tries and Prefix-Guided Search
Official subtopics covered:
- 11.4 Trie Pattern
- 11.5 Prefix Tree Search Pattern

#### Definition or Framing
A trie, also called a prefix tree, stores strings by character path from the root. The Trie Pattern supports fast insertion, full-word lookup, and prefix queries. Prefix Tree Search extends that structure to tasks like autocomplete, dictionary matching, and prefix-constrained traversal.

#### Recognition Signals
- repeated word insert and lookup
- prefix existence or autocomplete
- search should branch by character position rather than scan full words repeatedly

#### Brute-Force Baseline
- store all words in a list or set and scan every word for each prefix query
- compare characters from scratch across many words repeatedly

#### Optimized Pattern Idea
Build a character tree where each edge represents one next character. Shared prefixes reuse the same path, so prefix checks become path walks instead of repeated full-string comparisons.

#### Invariant / State Representation / Transition Logic
Each trie node represents one prefix. The path from the root to the node spells that prefix exactly. A word ends at a node marked as a completed word.

#### Java Implementation Notes
- a trie node usually stores a map or array of child references plus an `isWord` flag
- use an array for fixed small alphabets such as lowercase English letters, or a map for flexible character sets
- separate full-word search from prefix search in the public API

#### Quick Dry Run
If the trie stores `cat`, `car`, and `dog`, then `c -> a` is one shared prefix path. Searching prefix `ca` stops successfully at that shared node even though it is not itself a full word.

#### Common Mistakes
- forgetting that prefix existence and full-word existence are different queries
- failing to mark the word-end flag separately from child presence
- overengineering the trie for tiny datasets where linear search is simpler

#### Debugging Strategy
Trace the character path one step at a time. If the path exists but `isWord` is false, the string is only a prefix, not a stored full word.

#### Comparison with Similar Pattern
Hash sets answer exact-word membership well, but they do not expose prefix structure efficiently. Tries pay extra memory to make prefix traversal explicit.

#### Advanced Note
Later string chapters will introduce heavier string structures, but tries are the first clean example of making prefix structure part of the data model itself.

## 4. Pattern Template, State Model, or Core Workflow

Canonical DFS subtree-summary template:

```java
int dfs(TreeNode node) {
    if (node == null) {
        return baseValue;
    }

    int leftSummary = dfs(node.left);
    int rightSummary = dfs(node.right);
    return combine(node, leftSummary, rightSummary);
}
```

Canonical BFS level-order template:

```java
Deque<TreeNode> queue = new ArrayDeque<>();
queue.offerLast(root);

while (!queue.isEmpty()) {
    int levelSize = queue.size();
    for (int count = 0; count < levelSize; count++) {
        TreeNode node = queue.pollFirst();
        // process current level node
        if (node.left != null) {
            queue.offerLast(node.left);
        }
        if (node.right != null) {
            queue.offerLast(node.right);
        }
    }
}
```

Canonical LCA recursive template:

```java
TreeNode lca(TreeNode node, TreeNode first, TreeNode second) {
    if (node == null || node == first || node == second) {
        return node;
    }

    TreeNode left = lca(node.left, first, second);
    TreeNode right = lca(node.right, first, second);

    if (left != null && right != null) {
        return node;
    }
    return left != null ? left : right;
}
```

Canonical trie workflow:

```java
TrieNode node = root;
for (char currentChar : word.toCharArray()) {
    if (node.children[currentChar - 'a'] == null) {
        node.children[currentChar - 'a'] = new TrieNode();
    }
    node = node.children[currentChar - 'a'];
}
node.isWord = true;
```

Important variables and state meanings:

- DFS return value: subtree summary or target presence meaning
- path list or running sum: valid only on the current root-to-node path
- BFS queue: frontier of nodes whose level distance is already known
- trie node: exact prefix spelled by the path from the root

Safety rules:

- decide whether a recursive helper returns subtree information, path information, or an ancestor-related node
- copy path state when recording a complete root-to-leaf solution
- for BFS, freeze the current level size before processing a layer
- for tries, separate prefix traversal success from full-word success

What usually breaks first is state meaning. A tree solution can visit the right nodes and still be wrong because the return value, path mutation, or queue layer interpretation does not match the question.

Adapt the templates by changing the subtree combine logic, path payload, or trie child storage, but keep the state category explicit.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Maximum Depth of Binary Tree
#### Problem Statement
Given the root of a binary tree, return its maximum depth.

#### Why This Example Matters
This is the foundational tree DFS example because the return value is a pure subtree summary.

#### Input and Constraints
- tree may be empty
- depth counts nodes on the longest root-to-leaf path

#### Recognition Signals
- subtree summary question
- each node's answer depends on child answers
- recursive DFS maps directly to the tree shape

#### Brute-Force Approach
Enumerate every root-to-leaf path, record its length, and then take the maximum length.

#### Better Pattern-Based Approach
Use DFS where each node returns `1 + max(leftDepth, rightDepth)`.

#### Why the Pattern Fits
The depth of a node is entirely determined by the depths of its children, so subtree return values are the natural state.

#### Invariant or State Transition
When `maxDepth(node)` returns, it is the correct maximum depth of the subtree rooted at `node`.

#### Pragmatic Java Choice
Use a small recursive helper with `0` as the null-tree base case.

#### Dry Run Before Code
If a node has left depth `2` and right depth `4`, then its depth is `5`. The recursion computes children first and then combines them at the parent.

#### Java Solution
```java
public class MaximumDepthOfBinaryTree {
    static class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    public int maxDepth(TreeNode root) {
        if (root == null) {
            return 0;
        }

        int leftDepth = maxDepth(root.left);
        int rightDepth = maxDepth(root.right);
        return 1 + Math.max(leftDepth, rightDepth);
    }
}
```

#### Time and Space Complexity
- Brute-force root-to-leaf path enumeration: $O(n)$ to $O(nh)$ depending on path storage details
- DFS subtree summary: $O(n)$ time, $O(h)$ recursion depth where `h` is tree height

#### Edge Cases
- empty tree
- one node
- completely skewed tree
- perfectly balanced tree

#### Common Mistakes
- using `1` as the null base case
- confusing node count depth with edge count depth
- trying to store full path lists when only a subtree summary is needed

### Worked Example 2: Binary Tree Level Order Traversal
#### Problem Statement
Given the root of a binary tree, return the level order traversal of its nodes' values.

#### Why This Example Matters
This example demonstrates tree BFS in its cleanest form because the answer is literally grouped by levels.

#### Input and Constraints
- tree may be empty
- output must group nodes by depth from the root

#### Recognition Signals
- level order output
- each level should be processed together
- shortest edge distance from the root defines grouping

#### Brute-Force Approach
Compute tree height, then for each level perform a separate traversal to collect nodes at that depth.

#### Better Pattern-Based Approach
Use BFS with a queue and process one level at a time using the queue size.

#### Why the Pattern Fits
The queue frontier already stores nodes in level order, so no repeated rescans by depth are needed.

#### Invariant or State Transition
At the start of each outer loop iteration, the queue contains exactly the nodes of the current level.

#### Pragmatic Java Choice
Use `ArrayDeque<TreeNode>` and `List<List<Integer>>` for the layered result.

#### Dry Run Before Code
For a root with children `9` and `20`, the first queue layer is `[3]`. After processing it, the second layer becomes `[9, 20]`, and so on.

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class BinaryTreeLevelOrderTraversal {
    static class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> answer = new ArrayList<>();
        if (root == null) {
            return answer;
        }

        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.offerLast(root);

        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            List<Integer> currentLevel = new ArrayList<>();

            for (int count = 0; count < levelSize; count++) {
                TreeNode node = queue.pollFirst();
                currentLevel.add(node.value);

                if (node.left != null) {
                    queue.offerLast(node.left);
                }
                if (node.right != null) {
                    queue.offerLast(node.right);
                }
            }

            answer.add(currentLevel);
        }

        return answer;
    }
}
```

#### Time and Space Complexity
- Repeated per-level traversal: can degrade to $O(nh)$ time
- BFS level order: $O(n)$ time, $O(w)$ space where `w` is maximum tree width

#### Edge Cases
- empty tree
- one level only
- highly unbalanced tree

#### Common Mistakes
- recomputing depths repeatedly instead of using one BFS
- forgetting to freeze `levelSize` before the inner loop
- mixing nodes from different levels by using `queue.size()` dynamically inside the level loop

### Worked Example 3: Lowest Common Ancestor of a Binary Tree
#### Problem Statement
Given a binary tree and two nodes `p` and `q`, return their lowest common ancestor.

#### Why This Example Matters
This is the core ancestor-query example because the recursive return value directly encodes whether targets exist below a node.

#### Input and Constraints
- tree may be arbitrary, not necessarily a BST
- target nodes are given as node references
- the answer must be the deepest shared ancestor

#### Recognition Signals
- ancestor query
- two target nodes in one tree
- current node may be the split point of two successful descendant searches

#### Brute-Force Approach
Store the full root-to-node path for `p` and for `q`, then scan until the paths diverge.

#### Better Pattern-Based Approach
Use recursive DFS. If a node matches one target, return it. If one target is found in each subtree, the current node is the answer.

#### Why the Pattern Fits
The recursion naturally asks the right question at each subtree: does it contain `p`, `q`, both, or neither?

#### Invariant or State Transition
The helper returns `null` if neither target is found in the subtree, one target node if exactly one is found, or the LCA if both are found and merged below or at the current node.

#### Pragmatic Java Choice
Use node references rather than values to avoid ambiguity when values repeat.

#### Dry Run Before Code
If the left subtree returns `p` and the right subtree returns `q`, then the current node is the first place both targets meet, so it is the LCA.

#### Java Solution
```java
public class LowestCommonAncestorSolver {
    static class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) {
            return root;
        }

        TreeNode leftResult = lowestCommonAncestor(root.left, p, q);
        TreeNode rightResult = lowestCommonAncestor(root.right, p, q);

        if (leftResult != null && rightResult != null) {
            return root;
        }

        return leftResult != null ? leftResult : rightResult;
    }
}
```

#### Time and Space Complexity
- Full path comparison baseline: $O(n)$ time and $O(h)$ extra path space
- Recursive LCA: $O(n)$ time, $O(h)$ recursion depth

#### Edge Cases
- one target is the ancestor of the other
- root is the LCA
- targets in the same subtree

#### Common Mistakes
- returning the first matched target as the final answer without considering the sibling subtree
- comparing values instead of node references in non-unique trees
- misunderstanding “lowest” as “closest to the root”

### Worked Example 4: Implement Trie and Prefix Search
#### Problem Statement
Design a trie with `insert`, `search`, and `startsWith` methods for lowercase English letters.

#### Why This Example Matters
This example shows that tree patterns also apply to string search structures where prefixes become explicit paths.

#### Input and Constraints
- words use lowercase English letters
- repeated prefix queries should be efficient
- full-word and prefix checks are distinct operations

#### Recognition Signals
- repeated insertion and lookup of words
- prefix existence matters
- scanning all stored words for every query is wasteful

#### Brute-Force Approach
Store all words in a list or set and linearly check whether each word matches the prefix or the exact query.

#### Better Pattern-Based Approach
Build a trie so each character walks one edge downward. Full-word search checks the end flag; prefix search only checks path existence.

#### Why the Pattern Fits
Shared prefixes are reused in the same nodes, so prefix queries do not restart full-word comparisons across unrelated words.

#### Invariant or State Transition
After reading the first `i` characters of a query, the current trie node represents exactly that prefix if the path exists. Full-word success additionally requires `isWord` at the end.

#### Pragmatic Java Choice
Use a fixed `TrieNode[] children = new TrieNode[26]` for lowercase English letters.

#### Dry Run Before Code
After inserting `cat` and `car`, searching `ca` reaches the shared prefix node successfully. `startsWith("ca")` returns true there, but `search("ca")` returns false unless the prefix itself was inserted as a full word.

#### Java Solution
```java
public class TrieImplementation {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isWord;
    }

    private final TrieNode root = new TrieNode();

    public void insert(String word) {
        TrieNode node = root;
        for (int index = 0; index < word.length(); index++) {
            int childIndex = word.charAt(index) - 'a';
            if (node.children[childIndex] == null) {
                node.children[childIndex] = new TrieNode();
            }
            node = node.children[childIndex];
        }
        node.isWord = true;
    }

    public boolean search(String word) {
        TrieNode node = walk(word);
        return node != null && node.isWord;
    }

    public boolean startsWith(String prefix) {
        return walk(prefix) != null;
    }

    private TrieNode walk(String text) {
        TrieNode node = root;
        for (int index = 0; index < text.length(); index++) {
            int childIndex = text.charAt(index) - 'a';
            if (node.children[childIndex] == null) {
                return null;
            }
            node = node.children[childIndex];
        }
        return node;
    }
}
```

#### Time and Space Complexity
- Linear word scan baseline: $O(m \cdot L)$ per query where `m` is number of words and `L` is average word length
- Trie operations: $O(L)$ time per insert/search/prefix query, with memory proportional to stored prefixes

#### Edge Cases
- empty string insertion depending on API rules
- prefix exists but full word does not
- one word is a prefix of another

#### Common Mistakes
- using child existence alone as proof of full-word membership
- forgetting the word-end flag
- choosing a trie for tiny datasets where a set would be simpler

## 6. Complexity and Comparison Guide

This chapter's patterns are mainly distinguished by the type of state they expose.

- Tree DFS and tree BFS both visit every node in $O(n)$ time, but DFS is natural for subtree returns and path logic, while BFS is natural for level order and minimum edge distance from the root.
- LCA in a binary tree stays $O(n)$ per query in the basic recursive form and avoids repeated full-path storage.
- Trie operations run in time proportional to the query length rather than the number of stored words, at the cost of higher structural memory.

Comparison with similar patterns:

- Tree DFS versus BFS: choose DFS for recursive subtree summaries or path accumulation; choose BFS for level structure or shortest root distance in an unweighted tree.
- LCA versus storing root-to-node paths: path storage is conceptually simple for one query, but recursive ancestor logic is cleaner and more direct for the tree pattern itself.
- Trie versus hash set: hash sets are strong for exact membership, while tries are strong for prefix-aware operations.

Decision criteria:

- choose DFS when each node needs to return or combine subtree information
- choose BFS when the answer is grouped by levels or depends on breadth layers
- choose LCA when two-node ancestry is the hidden relation
- choose a trie when many prefix lookups or prefix-constrained searches are expected

Signals that you should not force this chapter's techniques:

- using BFS when you really need a returned subtree summary
- using a trie for a tiny static dictionary with almost no prefix queries
- using LCA logic when the problem is really about one root-to-node path, not two-node ancestry

What breaks when the invariant or preconditions fail is the meaning of the returned or stored state. A traversal that visits all nodes can still answer the wrong question if its state model is mischosen.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- unclear recursive return meaning in DFS
- level mixing in BFS because the current level size was not frozen
- comparing node values instead of node identity in ancestor queries
- forgetting to rollback path state in root-to-leaf style problems
- confusing prefix existence with full-word existence in tries

Boundary and state risks:

- empty tree or null root
- skewed trees causing deep recursion
- duplicate values in nodes when equality by value is unsafe
- tries with variable alphabets requiring a different child representation

Short debugging checklist:

1. What does one DFS call return for its subtree?
2. Is the state I am tracking valid on the current path, only after both children return, or across BFS layers?
3. For BFS, what exactly is in the queue at the start of each outer loop?
4. For LCA, what does a non-null recursive return mean?
5. For tries, does reaching a node mean full-word success or only prefix success?

Quick counterexample that defeats a common wrong solution:

If `search("ca")` in a trie returns true just because the path `c -> a` exists after inserting `cat`, the implementation is wrong. The prefix exists, but the full word `ca` was never inserted. This is why the word-end flag matters.

## 8. Practice Problems

### Easy
- Maximum Depth of Binary Tree: Return the deepest root-to-leaf depth. Expected pattern or core idea: tree DFS.
- Binary Tree Level Order Traversal: Return node values by level. Expected pattern or core idea: tree BFS.
- Implement Trie (Prefix Tree): Support insert, search, and prefix queries. Expected pattern or core idea: trie pattern.

### Medium
- Lowest Common Ancestor of a Binary Tree: Return the deepest shared ancestor of two nodes. Expected pattern or core idea: LCA recursive return logic.
- Path Sum II: Return all root-to-leaf paths with a target sum. Expected pattern or core idea: DFS with path state and rollback.
- Word Search II: Find many words on a board efficiently. Expected pattern or core idea: prefix tree search plus traversal.

### Hard
- Binary Tree Maximum Path Sum: Compute the best path through a tree. Expected pattern or core idea: subtree return plus global path state.
- Serialize and Deserialize Binary Tree: Encode and rebuild tree structure. Expected pattern or core idea: DFS or BFS tree traversal design.
- Word Break II: Return all valid sentence segmentations. Expected pattern or core idea: trie or memoized prefix-structured search.

## 9. Short Recap

The core idea of this chapter is that tree problems are controlled by the kind of state they carry: path state, subtree state, ancestor state, or prefix state. The strongest recognition clue is whether the question is about subtree summaries, level order, shared ancestry, or prefix traversal. The most important optimization insight is to let the tree shape itself carry the problem structure instead of recomputing paths, levels, or prefixes from scratch. The most important implementation warning is that the recursive return value or stored node meaning must be defined explicitly. This chapter prepares the next one by extending DFS and BFS from acyclic trees to general graphs where components, cycles, and visited-state discipline become central.

## 10. Coverage Check

- 11.1 Tree DFS Pattern - Covered
- 11.2 Tree BFS Pattern - Covered
- 11.3 Lowest Common Ancestor Pattern - Covered
- 11.4 Trie Pattern - Covered
- 11.5 Prefix Tree Search Pattern - Covered
- 11.6 Path state, subtree state, and ancestor queries - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 12: Graph Connectivity Patterns
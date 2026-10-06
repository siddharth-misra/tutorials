# 34: Advanced Dynamic Programming

**Goal:** Teach how to recognize and implement richer DP state spaces on subsequences, strings, trees, subsets, and digit constraints.
**Outcome:** By the end of this chapter, you can design advanced DP states, solve representative problems on subsequences, strings, trees, and bitmasks, and understand the purpose and structure of digit DP.

---

## 1. Intuition First

This chapter matters because once the easy DP patterns are stable, the real challenge becomes state design. Hard DP problems usually do not fail because the loops are long. They fail because the chosen state does not capture the right information.

A simple real-world analogy is planning a tournament bracket with notes. Sometimes you only need one number. Sometimes you need position plus budget. Sometimes you need a subset of already chosen players, or whether your current digit prefix is still tied to an upper limit. The note must match the decision context exactly.

The core mental model is:

- identify what information must be remembered and what can be forgotten
- choose a state that is just large enough to make future decisions correct
- derive transitions that shrink the remaining uncertainty

The most common beginner confusion point is assuming advanced DP means bigger tables. Often the real difference is structural: trees do not have linear order, subsets use masks, and digit DP tracks constraints imposed by a numeric bound.

This chapter closes the DP sequence in Part VI. It prepares the jump into advanced problem solving, where the main skill is recognizing state shapes rather than memorizing fixed templates.

## 2. Core Concepts and Techniques

### Concept Cluster: Sequence and String State Design
Key concepts in this block:
- 34.1 DP on subsequences
- 34.2 DP on strings

#### Intuition

Subsequence DP often asks whether to include or exclude the current element. String DP often compares prefix or interval states.

#### Why It Matters

Many hard interview problems live here because the sequence order matters, but local greedy choices are not enough.

#### How It Works

DP on subsequences often uses states like:

- first `i` elements with target sum `s`
- best answer ending at index `i`

DP on strings often uses states like:

- prefix lengths `i` and `j`
- substring interval `(left, right)`

#### Java Implementation Notes

- Use clear state arrays such as `boolean[][] reachable` or `int[][] best`.
- For interval string DP, be explicit about whether both ends are inclusive.
- Use memoization when the interval or branching structure is easier to describe recursively.

#### Common Mistakes

- confusing subsequence with substring
- choosing a state that omits necessary order information
- writing transitions that accidentally reuse elements multiple times

#### Quick Example

For subset sum, `dp[i][sum]` can mean whether the first `i` elements can build `sum`. For longest palindromic subsequence, `dp[left][right]` can mean the best answer inside that interval.

#### Debugging Tip

On small examples, list the exact state names you expect to become true or nonzero. That often exposes whether the state is missing information.

#### Advanced Note

When the state compares intervals or prefixes, the right traversal order matters as much as the recurrence itself.

### Concept Cluster: Non-Linear and Exponential-Looking State Spaces
Key concepts in this block:
- 34.3 DP on trees
- 34.4 Bitmask DP

#### Intuition

Some DPs are not arranged in a flat line or rectangular grid.

#### Why It Matters

Tree DP teaches how parent-child structure changes state flow. Bitmask DP teaches how to represent subsets compactly when `n` is small.

#### How It Works

Tree DP often uses one or more states per node, such as:

- best answer if this node is taken
- best answer if this node is skipped

Bitmask DP usually uses a state like:

- `dp[mask]` or `dp[mask][last]`

where `mask` encodes which items are already used.

#### Java Implementation Notes

- In tree DP, return a small result object or array from each recursive call.
- In bitmask DP, use `1 << n` carefully and confirm that `n` is small enough.
- Iterate over unset bits efficiently when expanding a mask.

#### Common Mistakes

- mixing parent and child constraints in tree DP without isolating the states
- using bitmask DP when `n` is too large for `2^n` states
- forgetting whether a bit represents a chosen item or an available item

#### Quick Example

In a tree independent-set style problem, if you take a node, you must skip its children. That naturally creates two states per node.

#### Debugging Tip

For tree DP, draw a three-node tree and compute states bottom-up by hand. For bitmask DP, print masks in binary for small `n`.

#### Advanced Note

Bitmask DP is powerful but only when the small-`n` constraint is real. If `n = 25`, `2^n` is already too large for many interview settings.

### Concept Cluster: Constraint-Aware State Recognition
Key concepts in this block:
- 34.5 Digit DP overview
- 34.6 Recognizing DP states in hard problems

#### Intuition

Digit DP handles questions about all numbers up to a limit by processing digits left to right while tracking whether you are still tied to the limit.

#### Why It Matters

It shows that advanced DP is really about encoding constraints into state rather than guessing formulas.

#### How It Works

A typical digit DP state may include:

- current digit position
- whether the prefix is tight with the upper bound
- whether a non-leading digit has started the number
- some property being counted, such as digit sum, previous digit, or number of occurrences

Recognizing hard DP states usually means asking:

- what exact information must the future know
- which information can be dropped safely
- whether the state graph repeats enough to justify caching

#### Java Implementation Notes

- Memoize digit DP with a map or multidimensional array when state bounds are manageable.
- Store the upper bound as a string for easy digit access.
- Define every boolean dimension in words before implementing.

#### Common Mistakes

- forgetting the tight flag
- confusing leading zeros with actual chosen digits
- adding state dimensions that are irrelevant and make the DP explode

#### Quick Example

To count numbers up to `N` with no adjacent equal digits, the state needs position, previous digit, started flag, and tight flag.

#### Debugging Tip

For hard DP, write the state tuple first, then test whether two different recursive paths can arrive at the same state. If yes, caching may help.

#### Advanced Note

Recognizing the minimal sufficient state is often the hardest step in advanced DP and the main difference between medium and hard problems.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Subset Sum Decision
#### Problem Statement

Given an array `values` and a target sum, return `true` if some subsequence of the array sums exactly to the target.

#### Why This Example Matters

This is a clean DP-on-subsequences problem. It shows include-or-exclude state design clearly.

#### Constraints or Assumptions

- all values are nonnegative integers
- each element may be used at most once
- only the decision, not the subsequence itself, is required

#### Brute-Force Approach

For each element, recursively choose whether to include or exclude it.

That explores `2^n` subsets.

#### Better Approach

Use DP over prefix length and target sum.

#### Why the Better Approach Works

At each element, a target sum is reachable either without using the element or by using it and relying on a smaller target from earlier elements.

#### Pragmatic Java Choice

Use a boolean table because the answer is reachability, not a numeric optimum.

#### Java Solution

```java
class SubsetSumDpExample {
    static boolean canReachTarget(int[] values, int target) {
        boolean[][] dp = new boolean[values.length + 1][target + 1];
        dp[0][0] = true;

        for (int index = 1; index <= values.length; index++) {
            int currentValue = values[index - 1];
            for (int sum = 0; sum <= target; sum++) {
                dp[index][sum] = dp[index - 1][sum];
                if (sum >= currentValue && dp[index - 1][sum - currentValue]) {
                    dp[index][sum] = true;
                }
            }
        }

        return dp[values.length][target];
    }
}
```

#### Dry Run

Input: `values = [3, 4, 5, 2]`, `target = 9`

- with no elements, only sum `0` is reachable
- after `3`, sum `3` becomes reachable
- after `4`, sum `7` becomes reachable
- after `5`, sum `9` becomes reachable using `4 + 5`

Answer: `true`

#### Time and Space Complexity

Brute-force subset recursion:

- Time: `O(2^n)`
- Space: `O(n)` recursion depth

DP table:

- Time: `O(n * target)`
- Space: `O(n * target)`

#### Edge Cases

- target `0`
- empty array
- values all larger than the target

#### Common Mistakes

- using the current row and accidentally allowing repeated picks
- forgetting that subsequence choice here means include-or-exclude, not contiguous segment
- assuming negative numbers without redesigning the state space

### Worked Example 2: Longest Palindromic Subsequence
#### Problem Statement

Given a string `text`, return the length of its longest palindromic subsequence.

#### Why This Example Matters

This is a classic DP-on-strings example where interval state is more natural than one-direction prefix state.

#### Constraints or Assumptions

- the subsequence does not need to be contiguous
- matching characters at both ends can contribute to the answer
- use bottom-up interval DP

#### Brute-Force Approach

Explore all subsequences and test whether they are palindromes.

That is exponential.

#### Better Approach

Use interval DP:

- `dp[left][right]` is the LPS length inside `text[left..right]`

#### Why the Better Approach Works

If the end characters match, they can contribute `2` plus the best answer of the inner interval. Otherwise, the answer must come from dropping one end or the other.

#### Pragmatic Java Choice

Use a bottom-up table ordered by interval length.

#### Java Solution

```java
class LongestPalindromicSubsequenceExample {
    static int longestPalindromicSubsequence(String text) {
        int n = text.length();
        int[][] dp = new int[n][n];

        for (int index = 0; index < n; index++) {
            dp[index][index] = 1;
        }

        for (int length = 2; length <= n; length++) {
            for (int left = 0; left + length - 1 < n; left++) {
                int right = left + length - 1;
                if (text.charAt(left) == text.charAt(right)) {
                    dp[left][right] = (length == 2) ? 2 : 2 + dp[left + 1][right - 1];
                } else {
                    dp[left][right] = Math.max(dp[left + 1][right], dp[left][right - 1]);
                }
            }
        }

        return dp[0][n - 1];
    }
}
```

#### Dry Run

Input: `text = "bbbab"`

- every single character interval has value `1`
- interval `"bb"` has value `2`
- larger intervals compare end characters and combine inner answers
- final answer becomes `4`

One valid longest palindromic subsequence is `"bbbb"`.

#### Time and Space Complexity

Brute-force subsequence search:

- Time: `O(2^n)`
- Space: `O(n)` recursion depth

Interval DP:

- Time: `O(n^2)`
- Space: `O(n^2)`

#### Edge Cases

- empty string
- one-character string
- all distinct characters

#### Common Mistakes

- confusing subsequence with substring
- iterating intervals in the wrong order so inner states are unavailable
- forgetting the special handling for interval length `2`

### Worked Example 3: Maximum Sum of Non-Adjacent Tree Nodes
#### Problem Statement

Given a binary tree where each node stores a nonnegative value, return the maximum sum obtainable by choosing nodes such that no chosen node has a chosen parent.

#### Why This Example Matters

This is a clean tree-DP problem. It shows how each node can return multiple states upward.

#### Constraints or Assumptions

- node values are nonnegative
- the tree may be empty
- the answer is a maximum sum, not the chosen node set itself

#### Brute-Force Approach

At each node, either take the node and skip its children, or skip the node and solve the children freely.

That revisits the same subtrees many times if written naively.

#### Better Approach

Return two values from each node:

- best sum if this node is taken
- best sum if this node is skipped

#### Why the Better Approach Works

The parent only needs these two summaries from each child. That is exactly the right amount of information for future decisions.

#### Pragmatic Java Choice

Use a helper that returns an `int[]` of size `2`.

#### Java Solution

```java
class TreeHouseRobberDpExample {
    static final class TreeNode {
        final int value;
        final TreeNode left;
        final TreeNode right;

        TreeNode(int value, TreeNode left, TreeNode right) {
            this.value = value;
            this.left = left;
            this.right = right;
        }
    }

    static int maxIndependentSum(TreeNode root) {
        int[] result = solve(root);
        return Math.max(result[0], result[1]);
    }

    private static int[] solve(TreeNode node) {
        if (node == null) {
            return new int[] {0, 0};
        }

        int[] left = solve(node.left);
        int[] right = solve(node.right);

        int takeNode = node.value + left[1] + right[1];
        int skipNode = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);

        return new int[] {takeNode, skipNode};
    }
}
```

#### Dry Run

For a root value `3` with children `2` and `3`, and grandchildren under those children:

- leaves return `{value, 0}`
- each parent combines child take/skip states
- the root compares taking itself plus child-skip states against skipping itself and taking the best child states

This bottom-up summary avoids recomputing subtrees.

#### Time and Space Complexity

Brute-force tree recursion:

- Time: exponential in the worst case
- Space: `O(h)` recursion depth, where `h` is tree height

Tree DP:

- Time: `O(n)`
- Space: `O(h)` recursion depth

#### Edge Cases

- empty tree
- single node
- highly skewed tree

#### Common Mistakes

- not separating the take and skip states
- trying to use one number per node when the parent needs more information
- forgetting that children can be chosen when the current node is skipped

### Worked Example 4: Minimum Assignment Cost with Bitmask DP
#### Problem Statement

Given a square cost matrix where `costs[worker][job]` is the cost of assigning one worker to one job, return the minimum total assignment cost.

#### Why This Example Matters

This is a standard bitmask-DP example. It shows how subsets become states when `n` is small.

#### Constraints or Assumptions

- `n` is small enough that `2^n` states are feasible
- each worker gets exactly one distinct job
- the matrix is square

#### Brute-Force Approach

Try every permutation of job assignments.

That takes `O(n!)` time.

#### Better Approach

Use bitmask DP where `mask` tells which jobs are already assigned.

#### Why the Better Approach Works

If `bitCount(mask)` jobs are already used, then the next worker index is known. The future only needs to know which jobs remain available.

#### Pragmatic Java Choice

Use a one-dimensional DP array over masks.

#### Java Solution

```java
import java.util.Arrays;

class AssignmentBitmaskDpExample {
    static int minimumAssignmentCost(int[][] costs) {
        int n = costs.length;
        int totalMasks = 1 << n;
        int[] dp = new int[totalMasks];
        Arrays.fill(dp, Integer.MAX_VALUE / 4);
        dp[0] = 0;

        for (int mask = 0; mask < totalMasks; mask++) {
            int worker = Integer.bitCount(mask);
            if (worker == n) {
                continue;
            }

            for (int job = 0; job < n; job++) {
                if ((mask & (1 << job)) == 0) {
                    int nextMask = mask | (1 << job);
                    dp[nextMask] = Math.min(dp[nextMask], dp[mask] + costs[worker][job]);
                }
            }
        }

        return dp[totalMasks - 1];
    }
}
```

#### Dry Run

Input:

```text
9 2 7
6 4 3
5 8 1
```

- `mask = 000` means no jobs assigned, so assign a job to worker `0`
- from there, each new mask increases the worker count automatically
- eventually `mask = 111` represents a full assignment

The best total cost is `9` from assignments:

- worker `0` -> job `1` with cost `2`
- worker `1` -> job `0` with cost `6`
- worker `2` -> job `2` with cost `1`

#### Time and Space Complexity

Brute-force permutations:

- Time: `O(n!)`
- Space: `O(n)` recursion depth

Bitmask DP:

- Time: `O(n * 2^n)`
- Space: `O(2^n)`

#### Edge Cases

- `n = 1`
- equal costs in many cells
- `n` too large for bitmask DP to be practical

#### Common Mistakes

- computing the next worker index incorrectly
- forgetting that `mask` represents already assigned jobs, not remaining jobs
- using bitmask DP on inputs too large for `2^n` states

## 4. Complexity and Decision Guide

Advanced DP is less about one fixed time bound and more about choosing the correct state space.

- subsequence DP often costs `O(n * target)` or `O(n^2)` depending on the second dimension or transition fan-out
- string interval or prefix-pair DP often costs `O(n^2)` or `O(m * n)`
- tree DP is often `O(n)` when each node combines a constant-size summary from children
- bitmask DP is usually `O(n * 2^n)` or `O(n^2 * 2^n)`, so it only works for small `n`
- digit DP depends on the number of positions and bounded state dimensions, often roughly `O(numberOfStates * 10)` for transitions

When to choose brute force:

- when the input size is genuinely tiny and you want to uncover the state structure
- when the recurrence is still unclear and a small recursive prototype helps

When to optimize:

- when the same subtree, interval, prefix pair, or subset appears repeatedly
- when the constraints rule out factorial or exponential search
- when a compact summary can replace large raw history

Recognition signals for advanced DP:

- future choices depend on a compressed summary of the past rather than the full raw sequence
- a problem over subsets, trees, intervals, or numeric bounds shows repeated states
- the hardest part of the problem is choosing what information a state must remember

Signals not to force this technique:

- the problem has a direct graph, greedy, or data-structure solution that is simpler and provably correct
- the state dimensions explode with no meaningful repetition
- you cannot explain in one sentence what a state means

## 5. Edge Cases, Pitfalls, and Debugging

Common advanced DP bugs:

- state omits essential information, causing invalid merges
- state includes irrelevant information, making the DP too large
- traversal order for interval or tree states is wrong
- bitmask meaning is inconsistent across transitions
- digit DP forgets tightness or leading-zero behavior

Boundary and modeling risks:

- empty intervals or empty trees
- single-node or single-character base cases
- impossible states that need a sentinel rather than default `0`
- integer overflow in count-heavy or cost-heavy DP

Short debugging checklist:

- describe the state in one precise sentence
- list which smaller states each transition reads
- verify that different paths can actually converge to the same state
- test tiny hand-computable inputs first
- if a result is impossible or too good, inspect whether the state forgot a constraint

## 6. Practice Problems

### Easy

**Title:** Partition Equal Subset Sum  
**Prompt:** Decide whether an array can be split into two subsets with equal sum.  
**Expected pattern or core idea:** Subsequence reachability DP.

**Title:** Longest Palindromic Subsequence  
**Prompt:** Return the LPS length in a string.  
**Expected pattern or core idea:** Interval DP on strings.

**Title:** Count Palindromic Subsequences Variant  
**Prompt:** Count palindromic structures in a short string with careful interval state.  
**Expected pattern or core idea:** String interval state design.

### Medium

**Title:** House Robber III  
**Prompt:** Maximize chosen value on a tree without taking parent and child together.  
**Expected pattern or core idea:** Tree DP with take and skip states.

**Title:** Minimum Cost Assignment  
**Prompt:** Assign workers to jobs with minimum total cost.  
**Expected pattern or core idea:** Bitmask DP on used jobs.

**Title:** Distinct Subsequences  
**Prompt:** Count how many ways one string appears as a subsequence of another.  
**Expected pattern or core idea:** DP on strings with prefix-pair states.

### Hard

**Title:** Traveling Salesperson on Small `n`  
**Prompt:** Find the minimum tour cost when the city count is small enough for subset DP.  
**Expected pattern or core idea:** Bitmask DP with `(mask, last)` state.

**Title:** Count Numbers Without Adjacent Equal Digits  
**Prompt:** Count all numbers up to `N` satisfying a digit constraint.  
**Expected pattern or core idea:** Digit DP with tight and previous-digit state.

**Title:** Cherry Pickup or Similar Grid State Problem  
**Prompt:** Maximize collection value when two simultaneous positions must be tracked.  
**Expected pattern or core idea:** Higher-dimensional state recognition.

## 7. Short Recap

The core idea is that advanced DP succeeds when the state remembers exactly the information future decisions need and nothing more. The most important optimization insight is that trees, subsets, intervals, and digits can all become repeatable state spaces once modeled correctly. The most important implementation warning is to prove your state meaning before coding transitions. This prepares the next chapter, where the focus shifts from DP state design to advanced range-query and offline-processing techniques.

## 8. Coverage Check

- 34.1 DP on subsequences - Covered
- 34.2 DP on strings - Covered
- 34.3 DP on trees - Covered
- 34.4 Bitmask DP - Covered
- 34.5 Digit DP overview - Covered
- 34.6 Recognizing DP states in hard problems - Covered

Coverage Summary: 6/6 official subtopics covered

Next: Advanced Range and Query Techniques
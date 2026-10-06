# 16: Advanced State DP Patterns

## 0. Introduction

This chapter sits in Part IV - Dynamic Programming Pattern Mastery (Weeks 16-22), with the roadmap treating it as advanced work. Its goal is to learn how to design dynamic programming states when the problem structure is no longer a simple index or prefix, but instead involves trees, digits, bitmasks, compressed states, sparse memo tables, and search pruning. This chapter directly supports the Part IV outcome of moving from pattern recognition to explicit state and transition design and understanding where advanced optimization or proof obligations begin.

Read it as a bridge in the larger sequence. Chapter 15 covered major standard DP families such as knapsack, subsequence, string, interval, and state-machine patterns. This chapter extends DP into richer state spaces where the subproblem is structural rather than purely positional. Chapter 17 studies optimization-heavy DP techniques that reduce transition cost or exploit formal monotonicity and convexity assumptions. Start this chapter after you are comfortable with Chapters 1 through 15, especially recursion trees, memoization, interval reasoning, state machines, and careful invalid-state design. The main themes here are Tree DP Pattern, Digit DP Pattern, Bitmask DP Pattern, Advanced State Compression Pattern, Sparse-state memo tables and caching strategies, and Constraint-driven pruning in hard DP problems.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to model tree DP, digit DP, and bitmask DP in Java, apply state compression deliberately, choose effective sparse-state memo caching strategies, and combine DP with constraint-driven pruning in harder search spaces.

## 1. Intuition First

This chapter matters because many hard DP problems cannot be solved with a table indexed only by `i` or by `(i, j)`. The state must encode structure. That structure might be the current tree node and whether its parent was chosen, the current digit position and whether the prefix is already tight to an upper bound, the set of used elements encoded as a bitmask, or a compressed summary of previous decisions.

The simplest analogy is packing information into a passport stamp instead of carrying the whole travel history. A good advanced DP state records only the information needed to make future decisions. If it records too little, transitions become invalid. If it records too much, the state space explodes.

The core mental model is:

- tree DP solves a subtree while carrying only local structural context
- digit DP walks a number digit by digit under upper-bound constraints
- bitmask DP compresses a subset of chosen or used elements into an integer mask
- advanced state compression stores the minimum sufficient summary of the past
- sparse memoization caches only reached states when the theoretical table is too large
- pruning cuts branches that cannot lead to valid or better solutions

Recognition signals for this chapter:

- the input is a tree and each answer depends on child subtrees
- the problem asks for counts or optimizations over numbers up to a bound
- the state is naturally a subset of small elements
- a full dense DP table would be mostly unused or too large
- search is still necessary, but many branches repeat the same abstract state

The most common beginner confusion point is adding variables to the state “just in case.” Advanced DP usually gets harder, not safer, when the state is oversized.

In the larger roadmap, this chapter is where DP state design becomes the main skill. The difficulty is no longer writing loops. The difficulty is choosing the smallest complete summary of future-relevant information.

## 2. Learning Path and Recognition Checklist

The chapter begins with tree DP because subtrees are a natural structural unit. It then moves to digit DP, where the state is defined by digit position and constraint flags rather than numeric values directly. After that, it introduces bitmask DP and advanced state compression, where subsets and boolean features are encoded compactly. It closes with sparse-state memo tables and pruning, because many hard problems need both caching and selective search.

Recognition checklist for this chapter:

- Does each answer depend on child subtrees plus a small parent-related condition?
- Is the problem about counting or optimizing over all numbers up to a bound with digit-wise constraints?
- Is the relevant state a small subset, assignment set, or set of visited nodes?
- Can multiple boolean or categorical state features be compressed into a mask or small tuple?
- Would a dense table be too large or mostly unreachable?
- Can infeasible or dominated branches be pruned early without changing correctness?

The brute-force baselines usually look like this:

- traverse every tree decision combination
- enumerate every number up to `n`
- try every permutation or subset assignment explicitly
- backtrack over a huge search space without caching equivalent states

The optimization is to cache only the essential abstract state and to prune branches that violate constraints or cannot improve the objective.

Mastery by the end of the chapter looks like this: you can derive a structural state, justify why it is sufficient, choose between arrays and hash maps for caching, and explain which pruning rules preserve correctness.

Do not force bitmask DP when the subset size is large enough to make $2^n$ states unreasonable. Do not force digit DP when the problem can be solved by direct combinatorics or a simpler prefix count.

## 3. Official Subtopic Coverage

### Concept Cluster: Structural and Numeric State Design
Official subtopics covered:
- 16.1 Tree DP Pattern
- 16.2 Digit DP Pattern

#### Definition or Framing
Tree DP solves a problem over a rooted tree by combining child subtree answers under a local node-based condition. Digit DP solves problems over numbers by processing digits from most significant to least significant while tracking whether the constructed prefix is still tight to the bound and whether the number has started.

#### Recognition Signals
- tree DP: subtree independence after choosing the right local state, parent-child constraints, rerooting or include-exclude on nodes
- digit DP: “count numbers from `0` to `n` satisfying ...”, digit restrictions, bound-aware counting, prefix legality

#### Brute-Force Baseline
- tree DP: try all choose-or-skip combinations over nodes or all root-to-leaf combinations
- digit DP: iterate through all integers up to `n` and test the digit rule directly

#### Optimized Pattern Idea
In tree DP, each state summarizes what a subtree contributes given a local condition such as whether the current node is selected. In digit DP, each state summarizes position, bound tightness, leading-zero status, and any extra property such as digit sum, previous digit, or parity state.

#### Invariant / State Representation / Transition Logic
Tree DP states must make child subtrees conditionally independent once the node context is fixed. Digit DP states must ensure the remaining suffix choices depend only on the current position and a small set of constraint flags.

#### Java Implementation Notes
- tree DP often uses post-order recursion and returns a small array or object per node
- digit DP often uses memoized DFS over `position`, `tight`, `started`, and optional extra dimensions
- dense arrays work when each dimension is small and bounded; hash maps work when some dimensions are sparse

#### Quick Dry Run
If a tree node may or may not be chosen, then each subtree only needs to know whether the parent choice restricts the current node. If a digit DP is building numbers up to `527`, then at position `0`, choosing digit `3` immediately makes later positions non-tight.

#### Common Mistakes
- carrying full ancestor history in tree DP instead of only the needed parent condition
- forgetting the `tight` flag in digit DP and accidentally counting numbers beyond the bound
- mishandling leading zeros and counting empty prefixes as real numbers incorrectly

#### Debugging Strategy
For tree DP, test on a three-level tree and inspect returned states per node. For digit DP, print a few memo states for a small bound like `25` or `105`.

#### Comparison with Similar Pattern
Tree DP is structural recursion over subtrees. Digit DP is bounded combinatorial counting over prefix states. Both are top-down-friendly, but their state axes mean very different things.

#### Advanced Note
Many hard tree and digit problems add one more carefully chosen state dimension, but the discipline stays the same: add only future-relevant information.

### Concept Cluster: Subsets and Compressed State Spaces
Official subtopics covered:
- 16.3 Bitmask DP Pattern
- 16.4 Advanced State Compression Pattern

#### Definition or Framing
Bitmask DP represents a subset of small elements using bits of an integer. Advanced state compression means encoding the minimum sufficient combination of boolean flags, small categories, or local row states so the DP fits into a manageable representation.

#### Recognition Signals
- `n` is small, often around `15` to `22`, but subset relationships matter
- assignments, tours, matchings, or “used versus unused” constraints dominate the problem
- the raw history is large, but the future depends only on a compressed subset or summary

#### Brute-Force Baseline
- enumerate every permutation or assignment explicitly
- carry full decision history rather than the used-set summary

#### Optimized Pattern Idea
Use a mask to represent which elements are already used. Derive the next logical index from the number of bits set or pair the mask with one or two additional compact state variables.

#### Invariant / State Representation / Transition Logic
The mask must capture exactly the part of history that affects future decisions. If more information matters, it must be encoded explicitly rather than assumed away.

#### Java Implementation Notes
- use `1 << n` states when `n` is small enough
- `Integer.bitCount(mask)` is useful when the next step equals the number of used elements
- for compressed row states or multi-flag states, combine values into an integer key consistently

#### Quick Dry Run
If `mask = 0101`, then elements `0` and `2` are already used. If the next worker index equals `bitCount(mask)`, then worker `2` is about to be assigned.

#### Common Mistakes
- applying bitmask DP when `n` is too large for `2^n` states
- forgetting that a compressed state must still be uniquely decodable or consistently interpreted
- storing redundant state dimensions that can be derived from the mask

#### Debugging Strategy
List a few small masks by hand and verify which logical state each one represents. Many bugs come from inconsistent bit positions, not from the recurrence itself.

#### Comparison with Similar Pattern
Bitmask DP is a specific compression technique for subset states. Advanced compression is the broader design principle of storing only the future-relevant summary.

#### Advanced Note
Later optimization techniques may reduce transition cost, but they still depend on a correct compressed state before any optimization is even possible.

### Concept Cluster: Sparse Caching and Hard-Search Pruning
Official subtopics covered:
- 16.5 Sparse-state memo tables and caching strategies
- 16.6 Constraint-driven pruning in hard DP problems

#### Definition or Framing
Sparse-state memoization caches only the states actually reached, often in a hash map, when a dense table would waste space or be impractical. Constraint-driven pruning cuts branches early using problem-specific impossibility or dominance rules while preserving correctness.

#### Recognition Signals
- reachable states are a tiny fraction of the full theoretical space
- some branches violate limits immediately
- several search paths collapse to the same abstract state
- sorting or ordering can make pruning much stronger

#### Brute-Force Baseline
Pure backtracking revisits equivalent states and explores obviously impossible branches repeatedly.

#### Optimized Pattern Idea
Cache abstract states in a hash map or map-like memo structure and add safe pruning rules such as target overflow checks, remaining-capacity impossibility checks, duplicate-choice skipping, or descending sort for earlier failure detection.

#### Invariant / State Representation / Transition Logic
The memo key must capture every future-relevant variable. A pruning rule is valid only if it discards branches that can be proven impossible or never better than already explored alternatives.

#### Java Implementation Notes
- prefer arrays for dense bounded states and `HashMap` or `Map` for sparse irregular states
- build memo keys from derived state values, not raw history traces
- prune before recursing when the condition is cheap and safe

#### Quick Dry Run
If the current subset sum already exceeds the bucket target, that branch can stop immediately. If two recursion paths reach the same used-mask and current bucket sum, the future search is equivalent and should be memoized.

#### Common Mistakes
- using a memo key that omits one future-relevant variable
- pruning with heuristics that are not logically safe
- caching raw node objects or mutable collections directly instead of stable abstract keys

#### Debugging Strategy
Disable pruning first and verify correctness on small inputs. Then re-enable pruning rules one by one and check that the answers stay unchanged.

#### Comparison with Similar Pattern
Memoization saves repeated equivalent work. Pruning skips provably bad work. Hard problems often need both.

#### Advanced Note
Sparse caching plus pruning is often the bridge between impossible brute force and manageable advanced DP.

## 4. Pattern Template, State Model, or Core Workflow

Canonical tree DP workflow:

```java
int[] dfs(TreeNode node) {
    if (node == null) {
        return new int[]{0, 0};
    }

    int[] left = dfs(node.left);
    int[] right = dfs(node.right);

    int include = node.val + left[1] + right[1];
    int exclude = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);
    return new int[]{include, exclude};
}
```

Canonical digit DP workflow:

```java
int dfs(int position, boolean tight, boolean started, extraState) {
    if (position == digits.length) {
        return answerForCompletedNumber(started, extraState);
    }
    if (!tight && memoized(position, started, extraState)) {
        return cachedValue;
    }

    int limit = tight ? digits[position] : 9;
    int total = 0;
    for (int digit = 0; digit <= limit; digit++) {
        total += dfs(nextPosition, nextTight, nextStarted, nextExtraState);
    }
    cacheIfAllowed(...);
    return total;
}
```

Canonical bitmask DP workflow:

```java
for (int mask = 0; mask < (1 << n); mask++) {
    int step = Integer.bitCount(mask);
    for (int next = 0; next < n; next++) {
        if ((mask & (1 << next)) == 0) {
            dp[mask | (1 << next)] = transition(dp[mask], step, next);
        }
    }
}
```

Canonical sparse memo plus pruning workflow:

```java
boolean search(State state) {
    if (prune(state)) {
        return false;
    }
    if (goalReached(state)) {
        return true;
    }
    if (memo.containsKey(state.key())) {
        return memo.get(state.key());
    }

    boolean answer = false;
    for (State next : expand(state)) {
        if (search(next)) {
            answer = true;
            break;
        }
    }
    memo.put(state.key(), answer);
    return answer;
}
```

Important variables and decision rules:

- node-local conditions in tree DP
- `position`, `tight`, `started`, and small extra dimensions in digit DP
- subset mask and optional derived index in bitmask DP
- compact memo keys for sparse states
- safe, correctness-preserving pruning checks

Safety rules:

- include only future-relevant information in the state
- derive variables from the mask when possible instead of storing them redundantly
- separate tight and non-tight digit states carefully
- do not memoize states whose meaning still depends on a bound-specific flag unless the key includes it
- prove pruning rules logically before relying on them

What usually breaks first is not the loop. It is the state key. If the key omits a relevant condition, equivalent-looking states may actually have different futures.

Adapt these templates by adding one carefully justified dimension at a time, rather than designing a large opaque state all at once.

## 5. Worked Examples and Full Solutions

### Worked Example 1: House Robber III
#### Problem Statement
Given the root of a binary tree, return the maximum amount of money you can rob if you cannot rob two directly connected nodes.

#### Why This Example Matters
This is the cleanest tree DP example because each node contributes a small pair of states that summarize the whole subtree.

#### Input and Constraints
- tree structure
- adjacent parent-child nodes cannot both be selected
- maximize total value

#### Recognition Signals
- subtree independence after fixing the node choice
- local parent-child restriction
- brute-force branching over include versus exclude at each node

#### Brute-Force Approach
For each node, try robbing it and then skipping its children, or skipping it and choosing the best from children. Recompute many subtrees repeatedly.

#### Better Pattern-Based Approach
Return two values for each node: best if the node is robbed, and best if the node is skipped.

#### Why the Pattern Fits
Once the current node choice is fixed, left and right subtrees are independent except for that local constraint.

#### Invariant or State Transition
For each node:

- `include = node.val + left.exclude + right.exclude`
- `exclude = max(left.include, left.exclude) + max(right.include, right.exclude)`

#### Pragmatic Java Choice
Use post-order DFS returning an `int[]` of size `2`.

#### Dry Run Before Code
At a leaf, including the node gives its value and excluding it gives `0`. Parent nodes combine child pairs using the include-exclude rule.

#### Java Solution
```java
public class HouseRobberTreeDP {
    static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    public int rob(TreeNode root) {
        int[] answer = dfs(root);
        return Math.max(answer[0], answer[1]);
    }

    private int[] dfs(TreeNode node) {
        if (node == null) {
            return new int[]{0, 0};
        }

        int[] left = dfs(node.left);
        int[] right = dfs(node.right);

        int include = node.val + left[1] + right[1];
        int exclude = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);
        return new int[]{include, exclude};
    }
}
```

#### Time and Space Complexity
- Brute-force subtree branching: exponential in the worst case
- Tree DP: $O(n)$ time, $O(h)$ recursion depth where `h` is tree height

#### Edge Cases
- empty tree
- single node
- skewed tree

#### Common Mistakes
- carrying unnecessary ancestor history instead of only the parent-related condition
- swapping include and exclude positions in the returned array
- using inorder or preorder reasoning when the recurrence actually needs post-order data

### Worked Example 2: Count Numbers Without the Digit 4
#### Problem Statement
Given a non-negative integer `n`, count how many integers in the range `[0, n]` do not contain the digit `4`.

#### Why This Example Matters
This is a compact digit DP example because the state needs position, tightness, and started status, but not the full number value.

#### Input and Constraints
- range from `0` to `n`
- numbers containing digit `4` are invalid
- leading zeros should not create false digit usage

#### Recognition Signals
- count numbers up to a bound
- legality depends on digits, not arithmetic iteration alone
- naive enumeration is easy to describe but too slow for large bounds

#### Brute-Force Approach
Loop from `0` to `n`, convert each number to digits or a string, and reject those containing `4`.

#### Better Pattern-Based Approach
Use memoized DFS over digit position, `tight`, and `started`.

#### Why the Pattern Fits
Once the prefix state is known, the future depends only on the current position and whether the bound is still tight.

#### Invariant or State Transition
`dfs(position, tight, started)` returns the count of valid numbers formed from this digit position onward. Digits equal to `4` are skipped.

#### Pragmatic Java Choice
Use a character array for digits and memoize only non-tight states.

#### Dry Run Before Code
If the bound is `25`, then from the first position, choosing digit `0` makes the rest non-tight for numbers below `10`, choosing `1` keeps the rest non-tight under the first digit, and choosing `2` keeps the second position tight up to `5`.

#### Java Solution
```java
import java.util.Arrays;

public class DigitDPNoFour {
    private char[] digits;
    private int[][] memo;

    public int countWithoutFour(int n) {
        digits = String.valueOf(n).toCharArray();
        memo = new int[digits.length][2];
        for (int[] row : memo) {
            Arrays.fill(row, -1);
        }
        return dfs(0, true, false);
    }

    private int dfs(int position, boolean tight, boolean started) {
        if (position == digits.length) {
            return 1;
        }

        if (!tight && memo[position][started ? 1 : 0] != -1) {
            return memo[position][started ? 1 : 0];
        }

        int limit = tight ? digits[position] - '0' : 9;
        int total = 0;

        for (int digit = 0; digit <= limit; digit++) {
            if (digit == 4) {
                continue;
            }
            boolean nextStarted = started || digit != 0;
            boolean nextTight = tight && digit == limit;
            total += dfs(position + 1, nextTight, nextStarted);
        }

        if (!tight) {
            memo[position][started ? 1 : 0] = total;
        }
        return total;
    }
}
```

#### Time and Space Complexity
- Brute-force enumeration: $O(n \cdot digits)$ time
- Digit DP: $O(d \cdot states \cdot 10)$ where `d` is digit count, effectively very small relative to `n`

#### Edge Cases
- `n = 0`
- bounds containing multiple `4`s
- powers of ten with leading-zero transitions

#### Common Mistakes
- forgetting the `tight` condition and counting beyond the bound
- mishandling leading zeros so the empty prefix is treated inconsistently
- memoizing tight states without encoding the bound-sensitive context correctly

### Worked Example 3: Minimum Assignment Cost
#### Problem Statement
Given a square cost matrix `cost` where `cost[worker][job]` is the cost of assigning one worker to one job, return the minimum total cost to assign every worker to a distinct job.

#### Why This Example Matters
This is a standard bitmask DP problem because the entire history can be summarized by which jobs are already used.

#### Input and Constraints
- number of workers equals number of jobs
- each job assigned once
- each worker receives exactly one job
- minimize total cost

#### Recognition Signals
- assignment of unique resources
- subset of used jobs matters
- brute-force permutation search is factorial

#### Brute-Force Approach
Try every permutation of jobs and compute the assignment cost.

#### Better Pattern-Based Approach
Use a mask for used jobs and derive the current worker index from the number of assigned jobs.

#### Why the Pattern Fits
The future depends only on which jobs are already taken, not on the exact order used to reach that subset.

#### Invariant or State Transition
`dp[mask]` means the minimum cost to assign the first `bitCount(mask)` workers using exactly the jobs marked in `mask`.

#### Pragmatic Java Choice
Use a 1D array of length `1 << n` initialized with large values.

#### Dry Run Before Code
If `mask = 0101`, two jobs are used, so worker `2` is next. Every unset bit is a candidate job for that worker.

#### Java Solution
```java
import java.util.Arrays;

public class AssignmentBitmaskDP {
    public int minimumAssignmentCost(int[][] cost) {
        int n = cost.length;
        int[] dp = new int[1 << n];
        Arrays.fill(dp, Integer.MAX_VALUE / 2);
        dp[0] = 0;

        for (int mask = 0; mask < (1 << n); mask++) {
            int worker = Integer.bitCount(mask);
            if (worker == n) {
                continue;
            }

            for (int job = 0; job < n; job++) {
                if ((mask & (1 << job)) == 0) {
                    int nextMask = mask | (1 << job);
                    dp[nextMask] = Math.min(dp[nextMask], dp[mask] + cost[worker][job]);
                }
            }
        }

        return dp[(1 << n) - 1];
    }
}
```

#### Time and Space Complexity
- Brute-force permutations: $O(n!)$ time
- Bitmask DP: $O(n \cdot 2^n)$ time, $O(2^n)$ space

#### Edge Cases
- `n = 1`
- equal costs across multiple choices
- negative or zero costs if allowed by the variant

#### Common Mistakes
- storing both `worker` and `mask` when `worker` can already be derived from `mask`
- using bit positions inconsistently
- applying this pattern when `n` is too large for `2^n` states

### Worked Example 4: Partition to K Equal Sum Subsets
#### Problem Statement
Given an integer array `nums` and an integer `k`, return whether the array can be partitioned into `k` subsets with equal sum.

#### Why This Example Matters
This example combines state compression, sparse memoization, and constraint-driven pruning in a hard search space.

#### Input and Constraints
- all numbers must be used exactly once
- each subset must sum to the same target
- the search space is combinatorial

#### Recognition Signals
- subset usage matters
- many search paths collapse to the same used-set and partial bucket state
- pruning by target overflow is safe and powerful

#### Brute-Force Approach
Try assigning each number to one of `k` buckets and check whether all buckets finish at the same target.

#### Better Pattern-Based Approach
Sort descending for stronger pruning, track used elements with a bitmask, and memoize by used-mask, current bucket sum, and buckets remaining.

#### Why the Pattern Fits
The future depends on which numbers are already used, how full the current bucket is, and how many buckets remain to be completed.

#### Invariant or State Transition
The recursive state means: using `usedMask`, currently filling one bucket with sum `currentSum`, and needing `bucketsRemaining` buckets total. If `currentSum` reaches the target, a new bucket starts.

#### Pragmatic Java Choice
Use DFS with a `HashMap<String, Boolean>` for sparse memoization and cheap, safe pruning rules.

#### Dry Run Before Code
If the current bucket sum exceeds the target, the branch is impossible. If the same used mask and current bucket state are reached again, the rest of the search is identical and should be cached.

#### Java Solution
```java
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class PartitionKSubsetsDP {
    public boolean canPartitionKSubsets(int[] nums, int k) {
        int total = 0;
        for (int num : nums) {
            total += num;
        }
        if (total % k != 0) {
            return false;
        }

        int target = total / k;
        Arrays.sort(nums);
        reverse(nums);
        if (nums[0] > target) {
            return false;
        }

        Map<String, Boolean> memo = new HashMap<>();
        return dfs(nums, 0, 0, k, target, memo);
    }

    private boolean dfs(int[] nums, int usedMask, int currentSum, int bucketsRemaining,
                        int target, Map<String, Boolean> memo) {
        if (bucketsRemaining == 1) {
            return true;
        }
        if (currentSum == target) {
            return dfs(nums, usedMask, 0, bucketsRemaining - 1, target, memo);
        }

        String key = usedMask + "|" + currentSum + "|" + bucketsRemaining;
        if (memo.containsKey(key)) {
            return memo.get(key);
        }

        for (int index = 0; index < nums.length; index++) {
            if ((usedMask & (1 << index)) != 0) {
                continue;
            }
            if (currentSum + nums[index] > target) {
                continue;
            }
            if (dfs(nums, usedMask | (1 << index), currentSum + nums[index], bucketsRemaining, target, memo)) {
                memo.put(key, true);
                return true;
            }
        }

        memo.put(key, false);
        return false;
    }

    private void reverse(int[] nums) {
        for (int left = 0, right = nums.length - 1; left < right; left++, right--) {
            int temp = nums[left];
            nums[left] = nums[right];
            nums[right] = temp;
        }
    }
}
```

#### Time and Space Complexity
- Brute-force bucket assignment: exponential with very large branching
- Sparse memo with pruning: still exponential in the worst case, but often dramatically reduced by state reuse and early cuts

#### Edge Cases
- total sum not divisible by `k`
- largest element exceeds target bucket sum
- repeated equal numbers
- `k = 1`

#### Common Mistakes
- memoizing with an incomplete key that omits current bucket state
- using unsafe pruning rules that discard valid solutions
- keeping raw bucket arrays in the key instead of a compact abstract state

## 6. Complexity and Comparison Guide

This chapter is about advanced state choice rather than one fixed time complexity shape.

- Tree DP is often linear in the number of nodes when each node returns or stores a constant-size state.
- Digit DP usually scales with digit count times the number of small state combinations, which is tiny compared with iterating up to the bound.
- Bitmask DP often costs $O(n \cdot 2^n)$ or $O(n^2 \cdot 2^n)$ depending on transition cost.
- Sparse-state memoization trades dense-table guarantees for caching only reached states, which can be far smaller in practice.
- Pruning does not change worst-case complexity guarantees in many hard problems, but it can transform practical runtime.

Comparison with similar patterns:

- Tree DP versus graph DP: trees provide acyclic parent-child structure, making subtree composition much cleaner.
- Digit DP versus simple counting: digit DP handles bound-aware constraints that direct formulas cannot easily express.
- Bitmask DP versus general backtracking: bitmask DP compresses equivalent partial histories into shared subset states.
- Sparse memoization versus dense arrays: dense arrays are faster when the state space is small and bounded; sparse maps are better when most states are never reached.

Decision criteria:

- choose tree DP when subtree answers combine cleanly under a small local condition
- choose digit DP when the bound is numeric and legality depends on digits or prefix constraints
- choose bitmask DP when subset size is small and used-set history matters
- choose sparse memoization when the dense theoretical state space is too large or too empty
- choose pruning when safe impossibility checks remove large parts of the search space early

Signals that you should not force these techniques:

- subset size is too large for mask-based state
- the memo key keeps growing because the real state has not been abstracted enough
- pruning rules are heuristic rather than logically justified

What breaks when invariants fail is usually state equivalence. Two states that look similar may have different futures if one relevant variable was omitted from the key.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- oversized state definitions that blow up runtime and memory
- incomplete memo keys that merge non-equivalent states
- forgetting leading-zero handling in digit DP
- incorrect bit operations or inconsistent bit positions in mask DP
- pruning on “seems unlikely” heuristics instead of proven impossibility rules

Boundary and correctness risks:

- null child states in tree DP
- upper-bound equality in digit DP tight transitions
- `1 << n` overflow if `n` is too large for integer masks
- mutable objects used directly as memo keys

Short debugging checklist:

1. Can I describe the state in one precise sentence?
2. Does the state contain only future-relevant information?
3. Could two different histories with the same key still have different valid futures?
4. Are pruning rules logically safe or only intuitive?
5. On a tiny input, can I enumerate all states and compare them with the memo cache?

Quick counterexample that defeats a common wrong solution:

In digit DP, if `tight` is omitted from the state, then the same `position` and `started` state reached under a bound prefix of `2` can be treated as equivalent to one reached under a free prefix. That incorrectly counts suffix choices that exceed the original bound.

## 8. Practice Problems

### Easy
- House Robber III: Maximize non-adjacent picks on a tree. Expected pattern or core idea: tree DP.
- Count numbers without a forbidden digit up to `n`: Bound-aware counting over digits. Expected pattern or core idea: digit DP.
- Small assignment variants: Match workers to tasks with minimum cost. Expected pattern or core idea: bitmask DP.

### Medium
- Maximum product or path variants on trees: Combine subtree states carefully. Expected pattern or core idea: tree DP.
- Count special integers with digit uniqueness or adjacency rules: Carry tight and previous-digit information. Expected pattern or core idea: digit DP.
- Traveling Salesman Problem on small `n`: Visit subsets with path-state compression. Expected pattern or core idea: bitmask DP.

### Hard
- Partition to K Equal Sum Subsets: Reuse subset states and prune aggressively. Expected pattern or core idea: compressed-state memo plus pruning.
- Small-grid placement problems with row masks: Compress previous row state and validate transitions. Expected pattern or core idea: advanced state compression.
- Game-state win/lose search with repeated states: Cache sparse search states precisely. Expected pattern or core idea: memoization with compressed keys.

## 9. Short Recap

The core idea of this chapter is that hard DP depends on choosing the smallest structural state that preserves future decisions. The strongest recognition clue is when simple index-based tables are no longer enough, but the future still depends on a compact abstract summary. The most important optimization insight is that compression, sparse caching, and pruning are different tools and often work best together. The most important implementation warning is that an incomplete state key silently merges non-equivalent futures. This chapter prepares the next one by moving from advanced state design to proof-heavy DP optimizations such as divide-and-conquer optimization, Knuth optimization, and convex hull tricks.

## 10. Coverage Check

- 16.1 Tree DP Pattern - Covered
- 16.2 Digit DP Pattern - Covered
- 16.3 Bitmask DP Pattern - Covered
- 16.4 Advanced State Compression Pattern - Covered
- 16.5 Sparse-state memo tables and caching strategies - Covered
- 16.6 Constraint-driven pruning in hard DP problems - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 17: DP Optimization Patterns
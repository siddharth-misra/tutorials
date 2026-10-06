# 23: Advanced DP Families

## Introduction and Context

Some problems do not fit neatly into sequence, grid, or knapsack boxes. Trees need DP on parent-child structure. Subsets need bitmask encoding. Number constraints need digit DP. Hard problems combine multiple techniques.

This chapter teaches how to recognize and design DP states when the input structure is non-linear or the constraints are architectural. The skill is not memorizing new formulas. It is identifying what information matters for future decisions and encoding it compactly.

## Core Intuition and Mechanics

- **Tree DP**: Each node state depends on child subtrees.
- **Bitmask DP**: Subsets encoded as bits; state transitions flip bits.
- **Digit DP**: Process a number digit by digit; track constraint tightness.
- **Advanced compression**: Store only what future decisions need; drop everything else.
- **Constraint-driven pruning**: Eliminate branches that violate invariants or cannot improve the objective.

## Core Concepts and Subtopics

### Concept Cluster: Non-Linear State Spaces
Topics in this cluster:
- 23.1 DP on subsequences; DP on strings; DP on trees; Tree DP Pattern
- 23.2 Bitmask DP; Bitmasking basics; Subset and state-encoding patterns; Digit DP overview; Digit DP Pattern

#### Tree DP Pattern

State: Each node stores answers for its subtree, often split into cases (e.g., node taken vs skipped).

```java
// Maximum weighted independent set on tree (no two adjacent nodes)
class TreeNode { int val; List<TreeNode> children; }

int[] dfs(TreeNode node) {
    if (node.children.isEmpty()) return new int[]{node.val, 0};
    
    int taken = node.val;
    int skipped = 0;
    
    for (TreeNode child : node.children) {
        int[] states = dfs(child);
        taken += states[1]; // if node taken, children must be skipped
        skipped += Math.max(states[0], states[1]); // if node skipped, children can be either
    }
    return new int[]{taken, skipped};
}
```

Key: Each subtree computes independently; results combine at parent.

#### Bitmask DP

State: `dp[mask][last]` where mask encodes which items are used, last is previous item index.

```java
// Traveling salesman: visit all cities once, minimize cost
int tsp(int[][] dist) {
    int n = dist.length;
    int[][] dp = new int[1 << n][n];
    for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE);
    dp[1][0] = 0;
    
    for (int mask = 1; mask < (1 << n); mask++) {
        for (int u = 0; u < n; u++) {
            if ((mask & (1 << u)) == 0) continue;
            if (dp[mask][u] == Integer.MAX_VALUE) continue;
            
            for (int v = 0; v < n; v++) {
                if ((mask & (1 << v)) != 0) continue;
                int newMask = mask | (1 << v);
                dp[newMask][v] = Math.min(dp[newMask][v], dp[mask][u] + dist[u][v]);
            }
        }
    }
    
    int result = Integer.MAX_VALUE;
    for (int u = 1; u < n; u++) {
        result = Math.min(result, dp[(1 << n) - 1][u] + dist[u][0]);
    }
    return result;
}
```

Complexity: O(2^n * n^2); only viable for n ≤ 20.

#### Digit DP

State: `dp[pos][tight][started]` = count of numbers with certain digit properties up to bound.

```java
// Count integers in [0, n] where digit sum is k
class DigitDP {
    int n, k;
    int[][][] memo;
    
    int solve(int pos, int tight, int sum) {
        if (sum > k) return 0;
        if (pos == -1) return sum == k ? 1 : 0;
        
        if (memo[pos][tight][sum] != -1) return memo[pos][tight][sum];
        
        int limit = tight ? (n / (int)Math.pow(10, pos)) % 10 : 9;
        int result = 0;
        
        for (int digit = 0; digit <= limit; digit++) {
            int newTight = tight && (digit == limit) ? 1 : 0;
            result += solve(pos - 1, newTight, sum + digit);
        }
        return memo[pos][tight][sum] = result;
    }
}
```

Key: Tight flag ensures prefix stays ≤ bound.

### Concept Cluster: Compression and Optimization
Topics in this cluster:
- 23.3 Advanced State Compression Pattern; Sparse-state memo tables and caching strategies
- 23.4 Constraint-driven pruning in hard DP problems; Recognizing DP states in hard problems
- 23.5 Divide and Conquer Pattern; Divide and Conquer DP Pattern
- 23.6 Knuth Optimization Pattern; Convex Hull Trick Pattern; Monotonicity assumptions and optimization prerequisites; When a simpler DP is better than a theoretical optimization

#### State Compression

If the state space is sparse, use a HashMap instead of an array.

```java
// Coin change with many denominations, large target
Map<Integer, Integer> memo = new HashMap<>();

int minCoins(int amount) {
    if (amount == 0) return 0;
    if (memo.containsKey(amount)) return memo.get(amount);
    
    int result = Integer.MAX_VALUE;
    for (int coin : coins) {
        if (amount >= coin) {
            int sub = minCoins(amount - coin);
            if (sub != Integer.MAX_VALUE) result = Math.min(result, sub + 1);
        }
    }
    return memo.put(amount, result);
}
```

#### Constraint-Driven Pruning

Prune branches that violate problem constraints before exploring further.

```java
// Max weight independent set: prune if current weight > limit or remaining nodes cannot improve
int search(int node, int weight, int remaining) {
    if (weight > limit) return Integer.MIN_VALUE; // prune: over limit
    if (node == n) return weight; // base: all nodes processed
    
    int maxLossIfSkip = remaining * maxNodeValue;
    if (weight + maxLossIfSkip <= bestSoFar) return Integer.MIN_VALUE; // prune: cannot improve
    
    // try taking or skipping
    int taken = search(node + 1, weight + nodeValue[node], remaining - 1);
    int skipped = search(node + 1, weight, remaining - 1);
    
    return Math.max(taken, skipped);
}
```

#### Divide and Conquer DP Optimization

If optimal indices move monotonically, narrow the candidate range recursively.

```java
// Partition problem with monotone opt: dp[i] = min cost, tries k in [l, r]
// If opt[i] < opt[i+1] (monotone), search [opt[i], opt[i+1]] for opt[i+1]
void optimizeDC(int left, int right, int optL, int optR) {
    if (left > right) return;
    
    int mid = (left + right) / 2;
    int bestK = optL;
    long bestCost = Long.MAX_VALUE;
    
    for (int k = optL; k <= Math.min(mid, optR); k++) {
        long cost = dp[k] + cost(k + 1, mid);
        if (cost < bestCost) {
            bestCost = cost;
            bestK = k;
        }
    }
    dp[mid] = bestCost;
    
    optimizeDC(left, mid - 1, optL, bestK);
    optimizeDC(mid + 1, right, bestK, optR);
}
```

---

## Worked Examples

### Worked Example 1: House Robber III (Tree DP)

**Problem**: Rob houses on a tree; cannot rob adjacent nodes; maximize total.

```java
class TreeNode { int val; TreeNode left, right; }

int[] rob(TreeNode node) {
    if (node == null) return new int[]{0, 0};
    
    int[] left = rob(node.left);
    int[] right = rob(node.right);
    
    int robbed = node.val + left[1] + right[1];
    int notRobbed = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);
    
    return new int[]{robbed, notRobbed};
}
```

**Result**: Return max(root[0], root[1]).

### Worked Example 2: Traveling Salesman (Bitmask DP)

Already shown in concept cluster. Key insight: visit cities in any order; use bitmask to track visited set.

### Worked Example 3: Count Numbers with Digit Sum k (Digit DP)

```java
int countNumbers(int n, int k) {
    String s = String.valueOf(n);
    int[][][] dp = new int[s.length() + 1][2][k + 1];
    for (int[][] plane : dp) for (int[] row : plane) Arrays.fill(row, -1);
    
    return helper(s, 0, 1, 0, k, dp);
}

int helper(String s, int pos, int tight, int sum, int k, int[][][] dp) {
    if (sum > k) return 0;
    if (pos == s.length()) return sum == k ? 1 : 0;
    
    if (dp[pos][tight][sum] != -1) return dp[pos][tight][sum];
    
    int limit = tight == 1 ? Character.getNumericValue(s.charAt(pos)) : 9;
    int result = 0;
    
    for (int digit = 0; digit <= limit; digit++) {
        result += helper(s, pos + 1, tight == 1 && digit == limit ? 1 : 0, sum + digit, k, dp);
    }
    
    return dp[pos][tight][sum] = result;
}
```

---

## Solved Problems

**Problem 1** (Easy): Maximum depth of N-ary tree. DFS each subtree; result is 1 + max child depth.

**Problem 2** (Easy): Number of distinct islands. Mark visited; count connected components.

**Problem 3** (Medium): Paint house with k colors such that no two adjacent houses have the same color. DP: dp[i][c] = min cost painting houses 0..i with house i color c.

**Problem 4** (Medium): Count number of unique paths in a grid with obstacles. DP: dp[i][j] = paths to (i,j) from (0,0).

**Problem 5** (Hard): Largest divisible subset. DP: for each number, find longest chain where each divides the next. Use LIS-like approach.

---

## Recognition Guide

- **Tree DP**: Input is tree; answer depends on subtree values.
- **Bitmask DP**: n ≤ 20; subset, tour, or assignment relationship.
- **Digit DP**: Count numbers with digit constraint up to bound.
- **Sparse memo**: State space large but only subset reachable; use HashMap.
- **Divide-conquer DP**: Monotone optimal indices allow bounded transition search.

---

## Comparison Tables

| Technique | Use When | State Size | Typical Complexity |
|-----------|----------|------------|-------------------|
| Tree DP | Input is tree | O(n) | O(n) |
| Bitmask | n ≤ 20, subsets matter | O(2^n * n) | O(2^n * n^2) |
| Digit DP | Digit constraint, bound given | O(len * 2 * sum) | O(len * 10 * sum) |
| Sparse memo | Reachable states << total | O(reached) | Varies |
| DC DP opt | Monotone opt indices | O(states) | O(states log states) |

---

## Design and Decision Making

**Tree DP**: Return value per node for each case (taken, skipped, etc.). Combine child results bottom-up.

**Bitmask DP**: Only for small n. Ensure encoding is consistent (bit i = item i or bit i = visited i).

**Digit DP**: Always track tight flag. Process digits left to right.

**Sparse memo**: Use when state is multi-dimensional or dependent on input values (not just indices).

---

## Practical Applications

- Routing: TSP, vehicle routing
- Assignments: job allocation under constraints
- Combinatorics: digit constraints in number theory
- Tree optimization: forest management, organization hierarchies

---

## Failure Modes and Trade-offs

**Bitmask overflow**: Confirm n ≤ 20. For n=25, 2^n > 33 million states.

**Digit DP tight flag wrong**: Forgetting tight means allowing numbers > bound. Must track carefully.

**Tree DP mixing cases**: Ensure cases (e.g., taken vs skipped) are mutually exclusive and exhaustive.

---

## Condensed Notes

- **Tree DP**: dfs returns array of cases; combine child results.
- **Bitmask**: dp[mask][last]; flip bits as you visit.
- **Digit DP**: Process left-to-right; track tight(compare to bound).
- **Sparse**: HashMap<State, Value> instead of array.
- **DC opt**: Recurse on left/right with narrowed opt range.

---

## Additional Problems

**Easy**: (1) Tree node count, (2) Max depth, (3) Balanced tree check, (4) Same tree, (5) Symmetric tree.

**Medium**: (1) LCA, (2) Paint house, (3) Russian doll envelopes (DP on 2D), (4) Distinct subsequences, (5) Count pairs divisible.

**Hard**: (1) Alien dictionary (topological DP), (2) Largest divisible subset, (3) Maximal network rank, (4) Number of ways to arrive destination (shortest path count), (5) Restore array from adjacent pairs.

---

## Key Questions

1. **How do you handle tree DP on a binary tree?** Return an array [case1, case2, ...]; combine child cases in parent.

2. **When is bitmask DP feasible?** n ≤ 20 only; beyond that, state space is too large.

3. **What is the tight flag in digit DP?** Tracks if prefix is still equal to upper bound; if not, later digits can be 0-9.

4. **How do you reconstruct a path in TSP?** Store parent/previous state in a separate array during DP.

5. **When should you use sparse memoization?** State space is multi-dimensional or dependent on values, not just indices.

6. **How do you know if monotone optimal indices hold?** Prove it mathematically, or test on a few examples. Do not assume.

7. **What is the time complexity of TSP bitmask DP?** O(n^2 * 2^n); reasonable up to n~20.

8. **How do you avoid leading zeros in digit DP?** Add a `started` flag; if not started and digit=0, do not increment sum.

9. **Can you always optimize divide-conquer DP?** Only if monotone opt holds. Verify before implementing.

10. **Why is tree DP efficient?** Each node computed once; subtrees solved independently; O(n) total time.

---

## Applied Project

**Project**: Plan an expedition visiting cities with supply constraints.

**Features**:
- Start at city 0; visit all; return to 0
- Carry limited supplies; refuel at cities
- Minimize total cost (fuel + resupply)

**Approach**: Bitmask DP with extra dimension for fuel. State: dp[mask][last][fuel] = min cost to visit mask cities, end at last, have fuel remaining.


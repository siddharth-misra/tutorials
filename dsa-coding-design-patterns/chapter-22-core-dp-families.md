# 22: Core DP Families

## Introduction and Context

Once DP foundations are solid, the real skill is recognizing which DP family a problem belongs to. A knapsack problem is not solved the same way as a string-comparison problem, even though both use DP.

This chapter teaches five major DP families: linear sequences (stairs, house robber, LIS), grids (unique paths, minimum cost), knapsack (capacity-constrained choices), strings (LCS, edit distance), and interval/state-machine DP (range decisions, mode transitions).

Each family has a standard state design and transition shape. Learning these families does not mean memorizing formulas. It means recognizing the structure of a new problem, fitting it into a known family, and adapting the template correctly.

## Core Intuition and Mechanics

- **Sequence DP**: Progress left to right; each state depends on earlier positions.
- **Grid DP**: Two axes; fill in dependency order (top-left to bottom-right).
- **Knapsack**: Items and capacity; each item chosen at most once (0/1) or many times (unbounded).
- **String DP**: Prefix pairs; compare or align two strings.
- **Interval DP**: Split a range; recur on subranges and combine.
- **State Machine DP**: Small set of modes; transitions between them over time.

## Core Concepts and Subtopics

### Concept Cluster: Sequence Decisions and Transitions
Topics in this cluster:
- 22.1 Fibonacci and introductory recurrences; Climbing stairs; House robber
- 22.2 Longest increasing subsequence; Decode ways; Space optimization techniques

#### Fibonacci and Climbing Stairs

`fib(n) = fib(n-1) + fib(n-2)` is the simplest recurrence. Climbing stairs with 1 or 2 steps uses the same recurrence because you can reach step i from steps i-1 and i-2.

```java
int climb(int n) {
    if (n <= 2) return n;
    int a = 1, b = 2;
    for (int i = 3; i <= n; i++) {
        int c = a + b;
        a = b;
        b = c;
    }
    return b;
}
```

#### House Robber

State: `dp[i]` = max money robbing houses up to index i. Decision: rob house i or skip it.

```java
int rob(int[] nums) {
    int prev2 = 0, prev1 = 0;
    for (int num : nums) {
        int curr = Math.max(prev1, num + prev2);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

#### Longest Increasing Subsequence (LIS)

State: `dp[i]` = length of LIS ending at index i. Transition: for all j < i where nums[j] < nums[i], `dp[i] = max(dp[i], dp[j] + 1)`.

```java
int lis(int[] nums) {
    int n = nums.length;
    int[] dp = new int[n];
    Arrays.fill(dp, 1);
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
        }
    }
    return Arrays.stream(dp).max().orElse(0);
}
```

Complexity: O(n²) DP; O(n log n) with patience sorting.

#### Decode Ways

State: `dp[i]` = ways to decode first i characters. Transition: if char at i-1 is '1'-'9', add dp[i-1]; if chars at i-2 and i-1 form '10'-'26', add dp[i-2].

```java
int numDecodings(String s) {
    int n = s.length();
    int[] dp = new int[n + 1];
    dp[0] = 1;
    dp[1] = s.charAt(0) != '0' ? 1 : 0;
    
    for (int i = 2; i <= n; i++) {
        int one = Integer.parseInt(s.substring(i - 1, i));
        int two = Integer.parseInt(s.substring(i - 2, i));
        
        if (one != 0) dp[i] += dp[i - 1];
        if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
    }
    return dp[n];
}
```

#### Space Optimization

If only k prior states matter, keep k variables instead of a full array. Check after the full solution works.

```java
// Rolling two variables instead of dp array
int maxRob = 0, prevMax = 0;
for (int num : nums) {
    int curr = Math.max(prevMax, num + maxRob);
    maxRob = prevMax;
    prevMax = curr;
}
```

### Concept Cluster: Grid and Interval Problems
Topics in this cluster:
- 22.3 Grid dynamic programming; Unique paths; Minimum path sum
- 22.4 0/1 knapsack; Knapsack Pattern

#### Unique Paths

State: `dp[i][j]` = ways to reach (i,j) moving only right or down. Base: first row and first column are all 1. Transition: `dp[i][j] = dp[i-1][j] + dp[i][j-1]`.

```java
int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];
    for (int i = 0; i < m; i++) dp[i][0] = 1;
    for (int j = 0; j < n; j++) dp[0][j] = 1;
    
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
        }
    }
    return dp[m - 1][n - 1];
}
```

#### Minimum Path Sum

Same structure, but sum costs instead of counting.

```java
int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dp = new int[m][n];
    dp[0][0] = grid[0][0];
    
    for (int i = 1; i < m; i++) dp[i][0] = dp[i - 1][0] + grid[i][0];
    for (int j = 1; j < n; j++) dp[0][j] = dp[0][j - 1] + grid[0][j];
    
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1]) + grid[i][j];
        }
    }
    return dp[m - 1][n - 1];
}
```

#### 0/1 Knapsack

State: `dp[w]` = max value achievable with weight limit w. For each item, iterate capacities backward to ensure each item is used at most once.

```java
int knapsack(int[] weights, int[] values, int capacity) {
    int[] dp = new int[capacity + 1];
    
    for (int i = 0; i < weights.length; i++) {
        for (int w = capacity; w >= weights[i]; w--) {
            dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }
    return dp[capacity];
}
```

### Concept Cluster: String and State-Machine Families
Topics in this cluster:
- 22.5 Subsequence DP; String DP; Longest common subsequence; Edit distance
- 22.6 Interval DP; State machine DP

#### Longest Common Subsequence (LCS)

State: `dp[i][j]` = LCS length for first i chars of s1, first j chars of s2.

```java
int lcs(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[m][n];
}
```

#### Edit Distance

State: `dp[i][j]` = min edits to transform s1[0..i-1] to s2[0..j-1].

```java
int editDistance(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];
    
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
            }
        }
    }
    return dp[m][n];
}
```

#### State Machine DP (Stock Trading)

State: `dp[i][0]` = max profit holding stock at day i; `dp[i][1]` = max profit not holding at day i.

```java
int maxProfit(int[] prices) {
    int hold = -prices[0], free = 0;
    
    for (int i = 1; i < prices.length; i++) {
        int newHold = Math.max(hold, free - prices[i]);
        int newFree = Math.max(free, hold + prices[i]);
        hold = newHold;
        free = newFree;
    }
    return free;
}
```

---

## Worked Examples

### Worked Example 1: Maximum Product Subarray (Sequence DP with Negatives)

**Problem**: Find max product of contiguous subarray.

**Challenge**: Negatives flip sign. Track both max and min ending at each position.

```java
int maxProduct(int[] nums) {
    int maxHere = nums[0], minHere = nums[0], result = nums[0];
    
    for (int i = 1; i < nums.length; i++) {
        int newMax = Math.max(nums[i], Math.max(maxHere * nums[i], minHere * nums[i]));
        int newMin = Math.min(nums[i], Math.min(maxHere * nums[i], minHere * nums[i]));
        
        maxHere = newMax;
        minHere = newMin;
        result = Math.max(result, maxHere);
    }
    return result;
}
```

**Dry Run** [2, 3, -2, 4]: Start (2,2,2). i=1: (6,3,6). i=2: (4,-6,4). i=3: (24,-24,24). Result: 24. ✓

### Worked Example 2: Coin Change (Unbounded Knapsack)

**Problem**: Minimum coins to make amount.

**State**: `dp[amt]` = min coins for amount.

```java
int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    
    for (int amt = 1; amt <= amount; amt++) {
        for (int coin : coins) {
            if (amt >= coin) {
                dp[amt] = Math.min(dp[amt], dp[amt - coin] + 1);
            }
        }
    }
    return dp[amount] <= amount ? dp[amount] : -1;
}
```

**Note**: Forward iteration (unbounded) vs backward (0/1).

### Worked Example 3: Regular Expression Matching (String DP with Wildcards)

**Problem**: DP match where '.' matches one char, '*' matches 0+ of previous char.

```java
boolean isMatch(String s, String p) {
    int m = s.length(), n = p.length();
    boolean[][] dp = new boolean[m + 1][n + 1];
    dp[0][0] = true;
    
    for (int j = 2; j <= n; j++) {
        if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];
    }
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (p.charAt(j - 1) == '*') {
                dp[i][j] = dp[i][j - 2] || (dp[i - 1][j] && (s.charAt(i - 1) == p.charAt(j - 2) || p.charAt(j - 2) == '.'));
            } else {
                dp[i][j] = dp[i - 1][j - 1] && (s.charAt(i - 1) == p.charAt(j - 1) || p.charAt(j - 1) == '.');
            }
        }
    }
    return dp[m][n];
}
```

---

## Solved Problems

**Problem 1** (Easy): Palindromic substrings count. State: `dp[i][j]` = true if s[i..j] is palindrome. Transition: true if s[i]==s[j] and dp[i+1][j-1], base case length 1 or 2 strings.

**Problem 2** (Easy): Partition equal subset sum. State: `dp[sum]` = true if sum is achievable. Each number either included or not.

**Problem 3** (Medium): Word break. State: `dp[i]` = true if s[0..i-1] can be segmented into dictionary. Transition: if dp[j] and s[j..i-1] in dict, then dp[i] = true.

**Problem 4** (Medium): Maximal square in matrix. State: `dp[i][j]` = side length of largest square with (i,j) as bottom-right. Transition: if grid[i][j]='1', then dp[i][j] = 1 + min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]).

**Problem 5** (Hard): Burst balloons. State: `dp[left][right]` = max coins bursting balloons in range. Transition: try each balloon last, compute coins = balloons[left]*balloons[mid]*balloons[right] + recursive solutions.

---

## Recognition Guide

- **Sequence DP**: One linear progress; each answer depends on prior positions.
- **Grid DP**: Two axes; fill top-left to bottom-right.
- **Knapsack**: Items and capacity; backward iteration for 0/1, forward for unbounded.
- **String DP**: Two string prefixes; match, align, or count.
- **State Machine**: Small set of modes; transitions over time.
- **Interval DP**: Split a range; recur on subranges.

---

## Comparison Tables

| Family | State | Order | Use Case |
|--------|-------|-------|----------|
| Sequence | dp[i] | i ascending | Linear progress |
| Grid | dp[i][j] | row then col | 2D paths |
| Knapsack | dp[w] | capacity desc (0/1) | Item selection |
| String | dp[i][j] | both ascending | Prefix comparison |
| Interval | dp[l][r] | length ascending | Range decisions |
| State Machine | dp[day][state] | day ascending | Mode transitions |

---

## Design and Decision Making

When a new problem arrives, ask:
1. Is there one linear progress measure? → Sequence DP.
2. Are there two grid-like dimensions? → Grid DP.
3. Do we choose items under a capacity or limit? → Knapsack.
4. Do we compare or transform two strings? → String DP.
5. Do we split a range and combine results? → Interval DP.
6. Do we move between modes? → State Machine DP.

---

## Practical Applications

- Finance: optimal trade sequences, portfolio allocation
- Bioinformatics: sequence alignment, gene matching
- Game design: optimal play strategies, turn-based decisions
- Manufacturing: assembly optimization, scheduling

---

## Failure Modes and Trade-offs

**Knapsack backward iteration forgotten**: Forward iteration allows reusing one item. Must reverse for 0/1.

**String DP off-by-one**: Prefix lengths (i+1 dimensions) vs indices can confuse. Be explicit.

**State machine mode forget**: Forgetting one mode or an allowed transition causes wrong answers.

---

## Condensed Notes

- **Sequence**: dp[i] = f(dp[i-1], dp[i-2], ...)
- **Grid**: dp[i][j] = combine(dp[i-1][j], dp[i][j-1], ...)
- **Knapsack 0/1**: Loop capacity backward; each item once.
- **Knapsack unbounded**: Loop capacity forward; each item many times.
- **String DP**: Prefix lengths i, j both ascending.
- **State Machine**: Rolling variables for day transitions.

---

## Additional Problems

**Easy**: (1) Delete and earn, (2) Best time buy-sell stock, (3) Min cost stairs, (4) Climbing stairs variants, (5) House robber 2 (circular).

**Medium**: (1) Coin change 2 (ways), (2) Partition equal subset, (3) Target sum (2D count), (4) Unique paths 2 (obstacles), (5) Triangle minimum path.

**Hard**: (1) Wildcard matching, (2) Distinct subsequences 2, (3) Palindrome partitions (count), (4) Maximal rectangle, (5) Shortest path visiting all cells.

---

## Key Questions

1. **Why reverse capacity iteration in 0/1 knapsack?** Each item used once; forward would reuse same item.

2. **When do you use interval DP?** Problems asking to split a range optimally.

3. **How is LCS different from edit distance?** LCS finds longest matching subsequence; edit distance counts minimum operations to transform.

4. **When does a problem need two state variables?** When answer depends on two independent progress measures or comparison dimensions.

5. **What is the state machine DP pattern?** Track a small number of modes; transition between them; optimize over time.

6. **How do you handle string DP with wildcards?** Special transitions for * (0+ matches) vs normal chars.

7. **Can you always compress 2D knapsack to 1D?** Yes, if each item is used at most once (0/1). Unbounded needs more state handling.

8. **What is the key insight for palindrome DP?** If ends match and middle is palindrome, whole range is palindrome.

9. **How do you recognize interval DP problems?** Ranges, splitting points, combining subrange answers.

10. **When should you track both max and min?** When negatives or reversals can change the optimal choice.

---

## Applied Project

**Project**: Build a stock trading assistant with multiple constraints.

**Features**:
- Buy/sell with transaction fee
- Cooldown days between transactions
- Maximum held stocks limit
- Compute max profit

**State**: dp[day][holding][cooldown] = max profit at day, holding status, cooldown remaining.

**Testing**: Verify edge cases (fee=0, cooldown=0, single stock).


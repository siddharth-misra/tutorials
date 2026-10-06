# 21: DP Foundations

## Introduction and Context

Dynamic programming answers one core question: when does solving a big problem require solving the same smaller problem many times? The naive answer is "recursively branch and hope." The smarter answer is "store the answer once, reuse it everywhere."

This chapter teaches the foundational mental model for DP: recognizing overlapping subproblems, defining state precisely, writing correct transitions, and choosing between memoization (top-down caching) and tabulation (bottom-up filling). The core skill is not implementing loops. The core skill is making sure the state definition captures exactly what remains to be solved, no more, no less.

Learners often confuse DP with just using an array. DP is really about three things: identifying repeated work, storing answers to avoid repeating that work, and computing answers in an order where dependencies are already known. Arrays and maps are only the tools.

## Core Intuition and Mechanics

A problem has overlapping subproblems when many branches of a recursion ask for the same smaller question. A problem has optimal substructure when the best answer to a bigger problem can be built from best answers to smaller problems. When both exist, DP fits.

The mental model: **state** names what still needs solving, **transition** describes how to build that state from smaller ones, **base case** is the smallest state with an immediate answer, and **memoization or tabulation** avoids recomputing.

Two styles: memoization recursively asks for smaller states and caches results; tabulation fills states in dependency order using loops.

## Core Concepts and Subtopics

### Concept Cluster: Recognizing Overlapping Work and Optimal Structure
Topics in this cluster:
- 21.1 Overlapping subproblems; Optimal substructure

#### Why Overlapping Matters

In Fibonacci, `fib(5)` asks for `fib(4)` and `fib(3)`, and `fib(4)` also asks for `fib(3)`. That repeated `fib(3)` is overlap. Brute-force recursion recomputes it multiple times. Memoization computes it once.

#### Why Optimal Structure Matters

If the best answer to reaching step `i` is "best answer reaching step `i-1` plus cost(i)" or "minimum of best reaching step `i-2` plus cost(i)", then best answers to smaller problems build the larger answer. Not every problem has this property. Greedy choices on local decisions do not guarantee global optimality unless optimal substructure is proven.

#### How to Check

Draw the recursion tree on a small input. Count how many times the same state label appears. If it appears many times, overlap exists. Ask whether the best solution can always use best subsolutions. If yes, optimal structure probably holds.

#### Common Mistakes

- assuming that any recursive problem has optimal substructure
- confusing "a smaller problem appears in the recurrence" with "overlap helps"
- ignoring whether local greedy choices prevent optimal assembly

### Concept Cluster: Two Execution Styles
Topics in this cluster:
- 21.2 Memoization; Tabulation; Memoization Pattern revisited; Tabulation versus recursion trade-offs

#### Memoization: Top-Down Caching

Recursively ask for the answer to a state. Before returning, cache it. On future calls to the same state, return the cached value.

```java
int[] memo;

int fib(int n) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fib(n - 1) + fib(n - 2);
}
```

Pros: Matches the problem's recursive structure directly; only computes needed states. Cons: Recursion depth limits; call-stack overhead.

#### Tabulation: Bottom-Up Filling

Decide an order where dependencies come first. Initialize base cases. Loop through states in order, building each from already-computed states.

```java
int fib(int n) {
    if (n <= 1) return n;
    int[] dp = new int[n + 1];
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}
```

Pros: No recursion depth limit; tight loop control. Cons: Must decide order upfront; may compute unnecessary states.

#### Trade-Offs

Choose memoization when the state graph is sparse (not all states are needed). Choose tabulation when all states are likely needed and recursion depth is a concern.

### Concept Cluster: State Design and Transitions
Topics in this cluster:
- 21.3 1D Dynamic Programming Pattern; 2D Dynamic Programming Pattern; State Representation; State design
- 21.4 Defining state correctly; Transition logic; Designing transitions

#### 1D DP Pattern

One index or progress measure defines the subproblem. Example: `dp[i]` = best answer using elements up to index `i`, or ways to reach step `i`.

```java
// Climbing stairs: ways to reach step i using 1 or 2 steps
int[] dp = new int[n + 1];
dp[0] = 1; dp[1] = 1;
for (int i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
}
```

**Key**: One sentence defines the meaning of `dp[i]`. Stick to it throughout.

#### 2D DP Pattern

Two coordinates define the subproblem. Example: `dp[i][j]` = best answer for first `i` items and first `j` capacity, or grid paths to row `i`, column `j`.

```java
// Grid paths: ways to reach (i, j) moving right or down
int[][] dp = new int[rows][cols];
for (int i = 0; i < rows; i++) dp[i][0] = 1;
for (int j = 0; j < cols; j++) dp[0][j] = 1;
for (int i = 1; i < rows; i++) {
    for (int j = 1; j < cols; j++) {
        dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
    }
}
```

**Key**: Both axes must represent real progress dimensions. If one axis is redundant, simplify to 1D.

#### Transition Logic

Every state must depend only on already-computed states. Identify which earlier states contribute. Write one sentence: "`dp[i]` equals ...". Then code it exactly.

```java
// House robber: max money up to house i
for (int i = 1; i < n; i++) {
    dp[i] = Math.max(dp[i - 1], nums[i] + (i >= 2 ? dp[i - 2] : 0));
}
```

### Concept Cluster: Recurrence Discipline
Topics in this cluster:
- 21.5 Recurrence mistakes, invalid states, and base-case design
- 21.6 Move from brute force to recurrence to optimized implementation

#### Common Recurrence Mistakes

1. **Vague state meaning**: "best answer" is not complete. "best answer using items up to index i under capacity w" is.
2. **Wrong dependency order**: In tabulation, use a state before it is computed.
3. **Mixing two state definitions**: `dp[i]` sometimes means "ending at i", sometimes "up to i". Pick one.

#### Invalid States

Some states may be unreachable or impossible. Mark them explicitly with a sentinel value like `Integer.MAX_VALUE` (for minimization) or `-1` (if positive is always valid).

```java
// Knapsack: impossible capacities start at Integer.MAX_VALUE
int[] dp = new int[capacity + 1];
Arrays.fill(dp, Integer.MAX_VALUE);
dp[0] = 0; // base: 0 capacity, 0 items, 0 cost
for (int i = 0; i < items; i++) {
    for (int c = capacity; c >= weight[i]; c--) {
        if (dp[c - weight[i]] != Integer.MAX_VALUE) {
            dp[c] = Math.min(dp[c], dp[c - weight[i]] + value[i]);
        }
    }
}
```

#### Base Cases

Base cases are the smallest valid states. Derive them from the state meaning, not from convenience.

---

## Worked Examples

### Worked Example 1: Fibonacci with Memoization vs Tabulation

**Problem**: Compute the nth Fibonacci number efficiently.

**Brute Force**:
```java
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2); // O(2^n)
}
```

**Memoization**:
```java
int fibMemo(int n, int[] memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
}
```

**Tabulation**:
```java
int fibTab(int n) {
    if (n <= 1) return n;
    int[] dp = new int[n + 1];
    dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}
```

**Dry Run** (n=4): dp[0]=0, dp[1]=1, dp[2]=1, dp[3]=2, dp[4]=3. ✓

**Complexity**: Time O(n), Space O(n).

**Decision**: Tabulation avoids recursion depth limits. Memoization matches the math. Both are correct here.

### Worked Example 2: Climbing Stairs (1D DP)

**Problem**: Climb n stairs. Each move is 1 or 2 steps. Count total ways.

**State**: `dp[i]` = ways to reach step i.

**Base**: `dp[1] = 1`, `dp[2] = 2`.

**Transition**: `dp[i] = dp[i-1] + dp[i-2]` (come from step i-1 or i-2).

```java
int climbStairs(int n) {
    if (n <= 2) return n;
    int[] dp = new int[n + 1];
    dp[1] = 1; dp[2] = 2;
    for (int i = 3; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}
```

**Dry Run** (n=4): dp[1]=1, dp[2]=2, dp[3]=3, dp[4]=5. ✓

**Complexity**: Time O(n), Space O(n); can reduce to O(1) with two variables.

### Worked Example 3: 0/1 Knapsack (2D to 1D)

**Problem**: Select items with max value under weight limit.

**2D State**: `dp[i][w]` = max value using first i items, weight limit w.

```java
int knapsack2D(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];
    
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            dp[i][w] = dp[i - 1][w]; // skip item i
            if (w >= weights[i - 1]) {
                dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
            }
        }
    }
    return dp[n][capacity];
}
```

**1D Optimization**: Note that each row depends only on the previous row.

```java
int knapsack1D(int[] weights, int[] values, int capacity) {
    int[] dp = new int[capacity + 1];
    
    for (int i = 0; i < weights.length; i++) {
        for (int w = capacity; w >= weights[i]; w--) {
            dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }
    return dp[capacity];
}
```

**Key**: Reverse iteration ensures each item is used at most once. Forward iteration allows unbounded reuse.

**Complexity**: Time O(n * capacity), Space O(capacity).

---

## Solved Problems

**Problem 1** (Easy): Maximum subarray sum.
```java
int maxSubarray(int[] nums) {
    int maxHere = nums[0], maxSoFar = nums[0];
    for (int i = 1; i < nums.length; i++) {
        maxHere = Math.max(nums[i], maxHere + nums[i]);
        maxSoFar = Math.max(maxSoFar, maxHere);
    }
    return maxSoFar;
}
```

**Problem 2** (Easy): Count number of ways to decode a string of digits (base case: "12" -> "1,2" or "12").
Recurrence: if current digit is valid, add ways to previous; if last two digits form valid code, add those ways too.

**Problem 3** (Medium): Longest increasing subsequence (LIS).
```java
int lengthOfLIS(int[] nums) {
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

**Problem 4** (Medium): Edit distance (minimum edits to transform one string to another).
State: `dp[i][j]` = edits to transform first i chars of s1 to first j chars of s2. Transitions: match (no edit), insert, delete, or replace.

**Problem 5** (Hard): Distinct subsequences of s that equal t.
State: `dp[i][j]` = count of distinct t[0..j-1] using s[0..i-1]. If s[i-1] == t[j-1], add ways without s[i-1].

---

## Recognition Guide

Use DP when:
- brute-force recursion repeats the same subproblem many times
- the answer for a state depends on best/count for smaller states
- the input size rules out complete enumeration but DP states are manageable

Do not use DP when:
- a greedy choice provably gives the optimal answer
- the state space is too large (exponential or very high dimension)
- a simpler linear scan or sorting algorithm already solves it

---

## Comparison Tables

| Aspect | Memoization | Tabulation |
|--------|-------------|-----------|
| Order | Top-down, on-demand | Bottom-up, predetermined |
| Recursion depth | Can hit stack limit | No stack overhead |
| Clarity | Matches math closely | Requires loop order design |
| Sparsity | Only computed states | All states computed |
| Debugging | Trace recurrence directly | Print table at each step |

---

## Design and Decision Making

**When to choose state dimensions**: Ask "what information does the future need?" Not "what information does the past have?" If position alone is enough, use 1D. If position and budget matter differently, use 2D.

**When to compress memory**: After the full-state solution works, check if only a window of prior states matter. Many 2D problems compress to rolling 1D arrays.

**When to use memoization**: Non-linear state graphs, sparse states, problem structure that branches unpredictably.

**When to use tabulation**: Dense regular grids, all states likely needed, large input sizes.

---

## Practical Applications

- Finance: shortest cost path, max profit sequences
- Bioinformatics: string alignment, sequence matching
- Manufacturing: optimal production schedules under constraints
- Scheduling: task ordering, resource allocation

---

## Failure Modes and Trade-offs

**Silent wrong answers** from incorrect state meaning are the worst. Always prove the recurrence on a small example by hand first.

**Stack overflow** in memoization is real. Test recursion depth on large inputs.

**TLE (Time Limit Exceeded)** happens when the DP state space is larger than expected. Count states before coding.

**MLE (Memory Limit Exceeded)** happens with dense large tables. Compress immediately if only a window matters.

---

## Condensed Notes

- **Overlap**: Same state computed multiple times → memoize
- **Optimal substructure**: Best solution uses best subsolutions
- **1D**: `dp[i]` = answer for first i items or up to position i
- **2D**: `dp[i][j]` = answer for first i items with second param j
- **Base cases**: Derive from state meaning, not convenience
- **Transitions**: Write one sentence; then code it

---

## Additional Problems

**Easy**: (1) Fibonacci, (2) Climbing stairs, (3) Min cost climbing stairs, (4) House robber 1, (5) Is subsequence.

**Medium**: (1) LIS, (2) Edit distance, (3) Distinct subsequences, (4) Max product subarray, (5) Coin change ways.

**Hard**: (1) Palindrome partitions DP, (2) Burst balloons, (3) Integer break, (4) Regular expression matching, (5) Wildcard matching.

---

## Key Questions

1. **What does "overlapping subproblems" mean?** When recursive calls ask for the same state many times, wasting computation.

2. **When is DP not the right tool?** When a greedy choice works or the state space is exponential even after DP.

3. **How do you choose between 1D and 2D DP?** 1D if one progress measure suffices; 2D if two independent coordinates matter.

4. **Why reverse iteration in 0/1 knapsack?** To ensure each item is used at most once (can't use the same item row twice).

5. **How do you detect wrong state meaning?** Run the recurrence on a tiny example by hand and compare the output.

6. **What is the difference between memoization and tabulation?** Memoization is recursive top-down; tabulation is iterative bottom-up.

7. **How do you compress 2D DP to 1D?** If each row depends only on the previous row, keep only two rows or even one.

8. **What is a base case?** The smallest state where the answer is known immediately without further recursion.

9. **When should you use Integer.MAX_VALUE for impossible states?** In minimization problems where no valid answer exists for some states.

10. **How do you avoid off-by-one errors?** Use one clear sentence for state meaning (e.g., "first i items, not index i") and stick to it.

---

## Applied Project

**Project**: Build a cost-optimized flight itinerary planner.

**Features**:
- Find cheapest path from origin to destination with up to k stops
- Handle multiple airlines, prices, and schedules
- Compute in reasonable time even for many flights

**Suggested structure**:
- State: `dp[stops][destination]` = min cost to reach destination using at most stops flights
- Base: `dp[0][origin]` = 0
- Transition: For each stop, try extending to each neighbor
- Compress to rolling array if memory is tight

**Testing**: Verify on small city networks; compare against all-paths brute force for correctness.


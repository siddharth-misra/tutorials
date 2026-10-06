# 14: Dynamic Programming Foundations

## 0. Introduction

This chapter sits in Part IV - Dynamic Programming Pattern Mastery (Weeks 16-22), with the roadmap treating it as intermediate to upper intermediate work. Its goal is to learn how to turn repeated recursive work into explicit dynamic programming states, transitions, and tables so you can move from intuition to correct and efficient Java implementations. This chapter directly supports the Part IV outcome of moving from pattern recognition to explicit state and transition design and writing Java DP solutions from recurrence to optimized implementation.

Read it as a bridge in the larger sequence. Chapter 13 finished weighted graph optimization. This chapter opens Part IV by shifting from graph objectives to repeated subproblem structure and explicit state design. Chapter 15 builds on these foundations with major DP families such as knapsack, subsequence, string, interval, and state-machine DP. Start this chapter after you are comfortable with Chapters 1 through 13, especially recursion trees, memoization from Chapter 10, and careful invariant-based reasoning. The main themes here are 1D Dynamic Programming Pattern, 2D Dynamic Programming Pattern, Memoization Pattern revisited, State Representation, Transition Logic, and Tabulation versus recursion trade-offs.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to recognize when a problem needs 1D or 2D dynamic programming, revisit memoization as cached state search, define good state representations and transitions, and compare tabulation against recursion with clear trade-offs.

## 1. Intuition First

This chapter matters because dynamic programming is where many learners stop recognizing patterns and start memorizing formulas. That usually fails. DP works only when the state, the transition, and the reuse relationship are all explicit.

The simplest analogy is filling out a travel notebook. If you repeatedly ask, “What is the cheapest way to get here?” and write the answer down the first time you solve it, you do not need to recompute that route again. Dynamic programming is that notebook made systematic: define the subproblem, write the rule that links it to smaller subproblems, and then reuse the result.

The core mental model is:

- a DP state names a subproblem
- a transition describes how that subproblem depends on smaller ones
- memoization caches recursive state results
- tabulation fills states in an order where dependencies are already known
- 1D DP uses one main index or linear progress measure
- 2D DP uses two meaningful dimensions, often position pairs or grid coordinates

Recognition signals for this chapter:

- brute-force recursion repeats the same state many times
- the answer can be described as “best/count/possible up to this point”
- the problem naturally decomposes into overlapping subproblems
- local choices depend on earlier solved states rather than raw input alone

The most common beginner confusion point is thinking that DP starts with code. It does not. It starts with a subproblem definition that is precise enough to reuse.

In the larger roadmap, this chapter is the foundation for the more specialized DP families that follow. If state meaning and transition design are unclear here, later DP chapters become mechanical and fragile.

## 2. Learning Path and Recognition Checklist

The chapter starts with 1D DP because the dependency structure is easiest to see there. It then moves to 2D DP, where two coordinates or two prefixes define the subproblem. After that, it revisits memoization as recursive state caching and contrasts it with bottom-up tabulation. Throughout, the chapter emphasizes one question above all: what exactly does `dp[...]` mean?

Recognition checklist for this chapter:

- Does the brute-force recursion revisit the same subproblem state?
- Can the answer be expressed by one progress measure, such as position or remaining amount, suggesting 1D DP?
- Do two coordinates, two prefixes, or row-column choices matter simultaneously, suggesting 2D DP?
- What does one DP entry represent in plain language?
- What smaller states are required to compute it?
- In what order can states be computed so those smaller states are already available?

The brute-force baselines usually look like this:

- recursive branching that recomputes the same suffix or prefix state many times
- exploring all decision sequences instead of reusing solved subproblems
- manually reasoning forward without storing intermediate answers

The optimization is to convert repeated subproblems into stored states and to compute them in a dependency-safe order.

Mastery by the end of the chapter looks like this: you can define the state, write the recurrence or transition, justify the base cases, and implement both memoized and tabulated versions when appropriate.

Do not force DP when a greedy or simpler linear solution already works. Do not use a 2D table when a 1D state already fully describes the subproblem.

## 3. Official Subtopic Coverage

### Concept Cluster: Linear DP States
Official subtopics covered:
- 14.1 1D Dynamic Programming Pattern
- 14.4 State Representation

#### Definition or Framing
The 1D Dynamic Programming Pattern uses one primary index or progress measure to define subproblems. State representation is the act of deciding what one DP entry means so transitions become valid and base cases become obvious.

#### Recognition Signals
- one linear progress measure such as index, amount, step count, or prefix length
- answer at position `i` depends on a small set of earlier positions
- brute-force recursion revisits the same one-dimensional state repeatedly

#### Brute-Force Baseline
- recurse from position `i` and recompute the same later positions many times
- try all step-by-step decision paths without caching results

#### Optimized Pattern Idea
Define `dp[i]` as the answer for a specific linear subproblem, such as “best answer up to index `i`” or “number of ways to reach step `i`,” and fill or cache those states once.

#### Invariant / State Representation / Transition Logic
Each `dp[i]` must have one exact meaning. If `dp[i]` means “best answer using elements up to index `i`,” then every transition into `dp[i]` must combine only states that match that same interpretation.

#### Java Implementation Notes
- use arrays for dense linear states
- name the state meaning in comments or notes before coding
- when only a few previous entries matter, consider rolling variables after first building the full-table version clearly

#### Quick Dry Run
If `dp[i]` means the number of ways to reach step `i`, then `dp[5] = dp[4] + dp[3]` for a staircase allowing 1-step or 2-step moves. That only works because the state meaning is consistent.

#### Common Mistakes
- defining `dp[i]` too vaguely
- mixing “up to index `i`” and “starting from index `i`” in the same recurrence
- optimizing to rolling variables before proving the full recurrence works

#### Debugging Strategy
Say one sentence out loud: “`dp[i]` means ...” If that sentence changes halfway through the solution, the DP is not stable yet.

#### Comparison with Similar Pattern
1D DP is not always simpler than recursion conceptually. It is simpler operationally because the repeated states lie along one main progress axis.

#### Advanced Note
Many advanced DP families later compress back to 1D when one dimension can be eliminated safely.

### Concept Cluster: Grids, Prefix Pairs, and Table Growth
Official subtopics covered:
- 14.2 2D Dynamic Programming Pattern
- 14.5 Transition Logic

#### Definition or Framing
The 2D Dynamic Programming Pattern uses two meaningful dimensions to define each subproblem. Transition logic explains exactly how each state depends on prior states along those dimensions.

#### Recognition Signals
- grid coordinates
- two strings or two prefixes
- position plus resource budget, or row plus column, or index pair
- a single dimension loses essential information

#### Brute-Force Baseline
- recursive exploration over two indices with heavy repeated overlap
- recompute every subgrid or sub-prefix result from scratch

#### Optimized Pattern Idea
Build a table where `dp[row][col]` or `dp[i][j]` stores the answer for the subproblem defined by those two coordinates. Fill the table in an order that respects dependencies.

#### Invariant / State Representation / Transition Logic
Every transition must move from already solved smaller states to the current state. For example, in a grid path count, `dp[row][col]` may depend on `dp[row - 1][col]` and `dp[row][col - 1]` because those represent the only ways to arrive.

#### Java Implementation Notes
- initialize the first row and first column carefully because many 2D DP tables depend on them as base boundaries
- loops must follow dependency direction
- use `int[][]` or `long[][]` depending on result size

#### Quick Dry Run
If `dp[2][3]` means the number of ways to reach row `2`, column `3`, and movement is only right or down, then the state depends on the cell above and the cell to the left.

#### Common Mistakes
- filling the table in an order that reads uninitialized dependencies
- forgetting first-row or first-column base cases
- using a 2D table when the problem's state is actually 1D and simpler

#### Debugging Strategy
Draw a tiny `3 x 3` table and fill it by hand. If you cannot explain why one cell depends on its chosen neighbors, the transition is not ready.

#### Comparison with Similar Pattern
2D DP is not defined by using a matrix as input. It is defined by needing two state dimensions. Some array problems also need 2D DP, and some grid problems do not.

#### Advanced Note
Later string and interval DP chapters use 2D tables for prefix pairs and substring ranges even when the input is not geometric.

### Concept Cluster: Memoization Revisited and Bottom-Up Trade-Offs
Official subtopics covered:
- 14.3 Memoization Pattern revisited
- 14.6 Tabulation versus recursion trade-offs

#### Definition or Framing
Memoization revisited means viewing top-down cached recursion as one face of DP rather than as a separate trick. Tabulation versus recursion trade-offs asks whether the problem is clearer or more efficient with top-down state discovery or bottom-up table filling.

#### Recognition Signals
- top-down recursion mirrors the problem definition naturally
- only some states are ever reached, which can favor memoization
- a full table order is obvious, which can favor tabulation
- recursion depth or call overhead may matter in large inputs

#### Brute-Force Baseline
- plain recursion without caching
- ad hoc iterative updates without a state definition

#### Optimized Pattern Idea
Use memoization when recursive structure is natural and sparse state reach matters. Use tabulation when dependency order is clear and iterative control is simpler or safer.

#### Invariant / State Representation / Transition Logic
Memoization and tabulation must solve the same state definition with the same transition logic. The difference is only evaluation order: demand-driven top-down versus dependency-ordered bottom-up.

#### Java Implementation Notes
- memoization often uses arrays with sentinel values or maps for sparse states
- tabulation avoids recursion depth limits and often makes space compression easier
- verify the same base cases in both forms before comparing them

#### Quick Dry Run
In top-down staircase counting, `ways(5)` calls only the states it needs and caches them. In bottom-up form, `dp[0]` through `dp[5]` are filled in order whether or not a recursion tree would have revisited them.

#### Common Mistakes
- treating memoization and DP as different paradigms
- changing the state meaning between recursive and iterative versions
- choosing recursion for inputs that may overflow the call stack unnecessarily

#### Debugging Strategy
Write the top-down recurrence first, then map each parameter set directly to a DP table entry. If that mapping is unclear, the DP state is not mature yet.

#### Comparison with Similar Pattern
Memoization discovers states on demand. Tabulation computes states in a planned order. They are not competing definitions of DP; they are two evaluation strategies for the same recurrence.

#### Advanced Note
Later advanced DP optimizations often start from a correct tabulation and then improve memory, transitions, or search over candidate decisions.

## 4. Pattern Template, State Model, or Core Workflow

Canonical memoized recursion workflow:

```java
int solve(int state, int[] memo) {
    if (baseCase(state)) {
        return baseValue(state);
    }
    if (memo[state] != UNVISITED) {
        return memo[state];
    }

    int answer = transitionFromSmallerStates(state, memo);
    memo[state] = answer;
    return answer;
}
```

Canonical 1D tabulation workflow:

```java
dp[baseIndex] = baseValue;
for (int index = firstComputedIndex; index <= limit; index++) {
    dp[index] = combine(dp[dependency1], dp[dependency2]);
}
```

Canonical 2D tabulation workflow:

```java
for (int row = 0; row < rows; row++) {
    for (int col = 0; col < cols; col++) {
        dp[row][col] = transitionFromNeighbors(row, col, dp);
    }
}
```

Important variables and decision rules:

- state meaning must be one exact sentence
- base cases define the smallest solvable states
- transitions must depend only on already solved or recursively smaller states
- table order must respect dependency direction

Safety rules:

- define the state before writing the recurrence
- define the recurrence before optimizing memory
- ensure base cases match the state meaning exactly
- for tabulation, fill states only after dependencies exist
- for memoization, cache by the full logical state, not an incomplete shortcut

What usually breaks first is state meaning. A DP table with correct syntax but ambiguous semantics almost always develops wrong transitions or wrong base cases.

Adapt the template when the state is multi-dimensional, sparse, or rolling, but keep the state sentence and dependency order explicit.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Climbing Stairs
#### Problem Statement
You are climbing a staircase with `n` steps. Each time you may climb `1` or `2` steps. Return the number of distinct ways to reach the top.

#### Why This Example Matters
This is the simplest 1D DP example because the repeated subproblem structure is obvious and the state meaning is easy to phrase.

#### Input and Constraints
- `n` is non-negative
- only step sizes `1` and `2` are allowed

#### Recognition Signals
- number of ways
- answer for step `i` depends on smaller steps
- raw recursion repeats the same step counts many times

#### Brute-Force Approach
Use recursion: ways to reach step `n` equals ways to reach `n - 1` plus ways to reach `n - 2`.

#### Better Pattern-Based Approach
Use 1D DP or memoization to store each computed step count once.

#### Why the Pattern Fits
The subproblem is linear: “how many ways reach step `i`?” That is a 1D state.

#### Invariant or State Transition
`dp[i]` means the number of ways to reach step `i`, so `dp[i] = dp[i - 1] + dp[i - 2]`.

#### Pragmatic Java Choice
A bottom-up array is the clearest first implementation.

#### Dry Run Before Code
For `n = 5`:

- `dp[0] = 1`, one way to stand at the start
- `dp[1] = 1`
- `dp[2] = 2`
- `dp[3] = 3`
- `dp[4] = 5`
- `dp[5] = 8`

#### Java Solution
```java
public class ClimbingStairsDP {
    public int climbStairs(int n) {
        if (n <= 1) {
            return 1;
        }

        int[] dp = new int[n + 1];
        dp[0] = 1;
        dp[1] = 1;

        for (int step = 2; step <= n; step++) {
            dp[step] = dp[step - 1] + dp[step - 2];
        }

        return dp[n];
    }
}
```

#### Time and Space Complexity
- Brute-force recursion: $O(2^n)$ time, $O(n)$ recursion depth
- DP: $O(n)$ time, $O(n)$ space

#### Edge Cases
- `n = 0`
- `n = 1`
- large `n` relative to integer range limits

#### Common Mistakes
- using inconsistent base cases for `0` and `1`
- thinking DP starts only after the recurrence is already known by memory
- optimizing to two variables before confirming the table logic

### Worked Example 2: House Robber
#### Problem Statement
Given an integer array `nums` where each value is the amount of money in a house, return the maximum amount you can rob without robbing two adjacent houses.

#### Why This Example Matters
This example shows how state representation turns a “choose or skip” problem into clean 1D DP.

#### Input and Constraints
- houses are arranged linearly
- adjacent houses cannot both be chosen
- maximize total value

#### Recognition Signals
- best value up to index `i`
- local decision depends on earlier compatible states
- naive recursion branches on rob versus skip

#### Brute-Force Approach
At each index, recursively try robbing the current house and skipping the next one, or skipping the current house.

#### Better Pattern-Based Approach
Define `dp[i]` as the best value achievable from the first `i + 1` houses.

#### Why the Pattern Fits
Each decision at house `i` depends only on two earlier states: best up to `i - 1` or current house value plus best up to `i - 2`.

#### Invariant or State Transition
`dp[i] = max(dp[i - 1], nums[i] + dp[i - 2])`.

#### Pragmatic Java Choice
Use a 1D array first because it makes the recurrence and base cases explicit.

#### Dry Run Before Code
For `[2, 7, 9, 3, 1]`:

- `dp[0] = 2`
- `dp[1] = max(2, 7) = 7`
- `dp[2] = max(7, 9 + 2) = 11`
- `dp[3] = max(11, 3 + 7) = 11`
- `dp[4] = max(11, 1 + 11) = 12`

#### Java Solution
```java
public class HouseRobberDP {
    public int rob(int[] nums) {
        if (nums.length == 0) {
            return 0;
        }
        if (nums.length == 1) {
            return nums[0];
        }

        int[] dp = new int[nums.length];
        dp[0] = nums[0];
        dp[1] = Math.max(nums[0], nums[1]);

        for (int index = 2; index < nums.length; index++) {
            dp[index] = Math.max(dp[index - 1], nums[index] + dp[index - 2]);
        }

        return dp[nums.length - 1];
    }
}
```

#### Time and Space Complexity
- Brute-force recursion: exponential time, $O(n)$ recursion depth
- DP: $O(n)$ time, $O(n)$ space

#### Edge Cases
- empty array
- one house
- two houses
- repeated equal values

#### Common Mistakes
- defining the state as “best if I rob house `i`” and then using transitions for “best up to `i`” interchangeably
- forgetting base cases for small arrays
- using current decisions without preserving earlier optimal totals

### Worked Example 3: Unique Paths
#### Problem Statement
Given an `m x n` grid, return the number of unique paths from the top-left cell to the bottom-right cell if you may move only right or down.

#### Why This Example Matters
This is the clearest 2D DP foundation example because the state is a grid position and the transition comes directly from two predecessor cells.

#### Input and Constraints
- movement only right or down
- starting cell is `(0, 0)`
- goal is `(m - 1, n - 1)`

#### Recognition Signals
- grid state
- count paths
- each cell depends on two earlier cells

#### Brute-Force Approach
Recursively explore moving right or down from each cell until reaching the goal.

#### Better Pattern-Based Approach
Use a 2D DP table where each cell stores the number of ways to reach that cell.

#### Why the Pattern Fits
The subproblem needs two coordinates: row and column. One dimension alone loses essential information.

#### Invariant or State Transition
`dp[row][col]` means the number of unique paths to reach `(row, col)`, so `dp[row][col] = dp[row - 1][col] + dp[row][col - 1]`.

#### Pragmatic Java Choice
Use a 2D array and fill it row by row after initializing the first row and first column.

#### Dry Run Before Code
In a `3 x 3` grid, the first row and first column are all `1` because there is only one straight path along an edge. Then the center cells accumulate paths from top and left.

#### Java Solution
```java
public class UniquePathsDP {
    public int uniquePaths(int rows, int cols) {
        int[][] dp = new int[rows][cols];

        for (int row = 0; row < rows; row++) {
            dp[row][0] = 1;
        }
        for (int col = 0; col < cols; col++) {
            dp[0][col] = 1;
        }

        for (int row = 1; row < rows; row++) {
            for (int col = 1; col < cols; col++) {
                dp[row][col] = dp[row - 1][col] + dp[row][col - 1];
            }
        }

        return dp[rows - 1][cols - 1];
    }
}
```

#### Time and Space Complexity
- Brute-force recursion: exponential time in the worst case
- 2D DP: $O(mn)$ time, $O(mn)$ space

#### Edge Cases
- one row
- one column
- smallest grid `1 x 1`

#### Common Mistakes
- forgetting to initialize the first row and first column
- reading from uninitialized neighbors
- using a 1D state description when the row and column both matter

### Worked Example 4: Coin Change
#### Problem Statement
Given coin denominations `coins` and an integer `amount`, return the minimum number of coins needed to make exactly that amount, or `-1` if impossible.

#### Why This Example Matters
This example connects memoization revisited with tabulation trade-offs and makes transition logic explicit for a minimization DP.

#### Input and Constraints
- coin values are positive integers
- each coin may be used unlimited times
- exact amount must be formed

#### Recognition Signals
- repeated subproblems on remaining amount
- minimizing count rather than counting ways
- recursion naturally mirrors the problem but overlaps heavily

#### Brute-Force Approach
Recursively try every coin at each step, subtract it from the remaining amount, and take the minimum valid result.

#### Better Pattern-Based Approach
Define `dp[value]` as the minimum coins needed for amount `value`, or use memoization on remaining amount.

#### Why the Pattern Fits
The subproblem is 1D: remaining amount. Each transition tries one coin and reuses the answer for a smaller amount.

#### Invariant or State Transition
`dp[value] = min(dp[value], dp[value - coin] + 1)` for each coin that can contribute to `value`.

#### Pragmatic Java Choice
Show a bottom-up tabulation because the table order is natural and easy to verify.

#### Dry Run Before Code
For `coins = [1, 3, 4]` and `amount = 6`:

- `dp[1] = 1`
- `dp[3] = 1`
- `dp[4] = 1`
- `dp[6]` can become `2` from `dp[3] + 1` using coin `3`

#### Java Solution
```java
import java.util.Arrays;

public class CoinChangeDP {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;

        for (int value = 1; value <= amount; value++) {
            for (int coin : coins) {
                if (coin <= value) {
                    dp[value] = Math.min(dp[value], dp[value - coin] + 1);
                }
            }
        }

        return dp[amount] == amount + 1 ? -1 : dp[amount];
    }
}
```

#### Time and Space Complexity
- Brute-force recursion: exponential time in the worst case
- DP: $O(amount \cdot numberOfCoins)$ time, $O(amount)$ space

#### Edge Cases
- amount `0`
- impossible amount
- one coin denomination only

#### Common Mistakes
- using `0` or an invalid sentinel that collides with real answers
- forgetting that this is a minimization DP rather than a counting DP
- mixing memoized remaining-amount logic with bottom-up “formed amount” logic inconsistently

## 6. Complexity and Comparison Guide

This chapter is about choosing the right state dimension and evaluation strategy.

- 1D DP usually uses $O(n)$ or $O(amount)$ states when one linear progress measure defines the subproblem.
- 2D DP usually uses $O(rows \cdot cols)$ or $O(nm)$ states when two coordinates or prefixes are both essential.
- Memoization often matches the recursive definition closely and may compute only reachable states.
- Tabulation often has lower overhead, clearer iteration order, and simpler space-compression paths once the transition is known.

Comparison with similar patterns:

- Memoization versus tabulation: memoization is top-down and demand-driven; tabulation is bottom-up and order-driven.
- 1D versus 2D DP: use the smallest state that still captures the whole subproblem.
- DP versus recursion without caching: both may share the same recurrence, but only DP stores and reuses solved states.
- DP versus greedy: DP keeps alternate possibilities alive through state values; greedy commits early when a local rule is provably safe.

Decision criteria:

- choose 1D DP when one axis fully describes progress
- choose 2D DP when two coordinates or prefix boundaries are both essential
- choose memoization when recursion mirrors the problem naturally or only sparse states are reached
- choose tabulation when dependency order is clear and iterative control is simpler or safer

Signals that you should not force this technique:

- the problem has no overlapping subproblems
- a greedy, graph, or linear scan pattern already solves it directly
- the state has been overdesigned and includes irrelevant dimensions

What breaks when the invariant or preconditions fail is usually the recurrence itself. Wrong state meaning leads to wrong transitions, and wrong transitions make every computed table entry consistent but incorrect.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- vague state definitions
- incorrect base cases
- transitions that read states with a different meaning than intended
- filling tabulation tables in the wrong order
- using the wrong sentinel value for impossible states

Off-by-one and boundary risks:

- whether `dp[0]` means the empty prefix, zero amount, or the start position
- array sizes such as `n + 1` versus `n`
- first row and first column initialization in 2D DP

Short debugging checklist:

1. What does one DP entry mean in one sentence?
2. What are the smallest states, and what are their exact values?
3. Which smaller states are allowed to transition into the current state?
4. In tabulation, are those smaller states already filled?
5. If I draw the first few states by hand, do the values match the code?

Quick counterexample that defeats a common wrong solution:

If `dp[i]` in House Robber is sometimes treated as “best value if house `i` is robbed” and elsewhere treated as “best value using houses up to `i`,” the recurrence breaks immediately. Those are different states, and mixing them leads to invalid transitions.

## 8. Practice Problems

### Easy
- Climbing Stairs: Count the number of ways to reach the top. Expected pattern or core idea: 1D DP.
- Min Cost Climbing Stairs: Minimize cumulative step cost. Expected pattern or core idea: 1D DP transition.
- Unique Paths: Count paths in a grid with right and down moves. Expected pattern or core idea: 2D DP.

### Medium
- House Robber: Maximize non-adjacent house values. Expected pattern or core idea: 1D DP with choose-skip transition.
- Coin Change: Minimize coins to form an amount. Expected pattern or core idea: 1D minimization DP.
- Minimum Path Sum: Minimize grid path cost. Expected pattern or core idea: 2D DP with accumulation.

### Hard
- Edit Distance: Transform one string into another with minimum operations. Expected pattern or core idea: 2D prefix DP.
- Decode Ways II or similar wildcard variants: Count decodings with richer transitions. Expected pattern or core idea: advanced 1D DP.
- Burst-style interval previews before Chapter 15: Reason about subarray ranges as states. Expected pattern or core idea: interval-flavored DP foundations.

## 9. Short Recap

The core idea of this chapter is that DP starts with a precise state, not with a memorized table. The strongest recognition clue is repeated subproblems whose answers can be reused through one or two clear state dimensions. The most important optimization insight is that memoization and tabulation are two ways to evaluate the same recurrence, not separate problem families. The most important implementation warning is that an ambiguous state definition poisons the entire recurrence. This chapter prepares the next one by turning these foundations into named DP families such as knapsack, subsequence, string, interval, and state-machine patterns.

## 10. Coverage Check

- 14.1 1D Dynamic Programming Pattern - Covered
- 14.2 2D Dynamic Programming Pattern - Covered
- 14.3 Memoization Pattern revisited - Covered
- 14.4 State Representation - Covered
- 14.5 Transition Logic - Covered
- 14.6 Tabulation versus recursion trade-offs - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 15: Choice and Sequence DP Patterns
# 31: Dynamic Programming Foundations

**Goal:** Teach how dynamic programming turns repeated recursive work into reusable state transitions, and how to design states and recurrences with precision.
**Outcome:** By the end of this chapter, you can recognize overlapping subproblems and optimal substructure, choose between memoization and tabulation, define DP state clearly, and write correct transitions for foundational problems in Java.

---

## 1. Intuition First

This chapter matters because many brute-force recursive solutions repeat the same work again and again. Dynamic programming, usually shortened to DP, removes that waste by storing answers to smaller states and reusing them.

A simple real-world analogy is trip planning across multiple cities. If you already computed the cheapest cost from city `C` to the destination, you should not recompute that same suffix of the trip every time another route reaches `C`.

The core mental model is:

- define a state that captures exactly what still needs to be solved
- express the answer for that state using smaller states
- store results so each state is solved once

The most common beginner confusion point is thinking DP means "use an array and loop." That is too shallow. DP is really about repeated states and a correct recurrence. Arrays, maps, recursion, and loops are only implementation choices.

This chapter starts Part VI's shift from pattern recognition into formal state design. Earlier chapters trained you to see structures like trees, graphs, and divide and conquer. This chapter teaches how to model problems where many partial decisions lead back to the same smaller subproblem.

## 2. Core Concepts and Techniques

### Concept Cluster: Repeated Work and Structural Choice
Key concepts in this block:
- 31.1 Overlapping subproblems
- 31.2 Optimal substructure

#### Intuition

If many recursive paths ask for the answer to the same smaller question, the problem has overlapping subproblems. If the best answer to a bigger problem can be assembled from best answers to smaller problems, the problem has optimal substructure.

#### Why It Matters

Without these two properties, DP is usually the wrong tool. Overlap tells you caching is useful. Optimal substructure tells you combining smaller optimal answers can still produce a larger optimal answer.

#### How It Works

For Fibonacci, `fib(5)` asks for `fib(4)` and `fib(3)`, and `fib(4)` also asks for `fib(3)`. That repeated `fib(3)` is overlap.

For shortest cost problems, if the best way to reach step `i` depends on the best way to reach earlier steps plus one local cost, that is optimal substructure.

#### Java Implementation Notes

- Use an `int[]`, `long[]`, or `Integer[]` when the state is indexed by position.
- Use a `HashMap<State, Answer>` when the state is sparse or multi-dimensional.
- Make the state definition explicit in method parameters before coding transitions.

#### Common Mistakes

- forcing DP onto a problem with no repeated states
- assuming greedy local choices imply optimal substructure
- storing answers before the state is fully defined

#### Quick Example

In a staircase problem, if state `dp[i]` means the number of ways to reach step `i`, then every state uses a small set of earlier states instead of recomputing the full recursion tree.

#### Debugging Tip

Draw the recursion tree for a tiny input. If the same state label appears many times, you probably have overlap.

#### Advanced Note

Optimal substructure is not enough by itself. Many graph problems have optimal substructure but still need shortest-path or matching algorithms rather than plain DP.

### Concept Cluster: Two Main DP Execution Styles
Key concepts in this block:
- 31.3 Memoization
- 31.4 Tabulation

#### Intuition

Memoization solves states on demand with recursion and a cache. Tabulation fills states in a deliberate order, usually with loops.

#### Why It Matters

The recurrence may be the same, but implementation trade-offs differ:

- memoization matches the mathematical recurrence closely
- tabulation avoids recursion depth and gives tighter control over evaluation order

#### How It Works

Memoization pattern:

- ask for the target state
- recursively ask for smaller states
- cache the answer before returning

Tabulation pattern:

- decide an order where dependencies are already known
- initialize base states
- fill larger states from smaller ones

#### Java Implementation Notes

- `Integer[] memo` is convenient when `0` could be a valid answer and you need `null` as "not computed yet."
- For tabulation, define the meaning of `dp[i]` in one sentence before writing the loop.
- Watch recursion depth on large inputs; Java does not optimize tail recursion.

#### Common Mistakes

- forgetting to cache before returning in memoization
- filling the table in an order that uses uninitialized states
- mixing two different state meanings in one array

#### Quick Example

For Fibonacci:

- memoization computes only needed states recursively
- tabulation starts from `dp[0]` and `dp[1]`, then builds upward

#### Debugging Tip

For tabulation, print the `dp` array after each iteration for a tiny input. For memoization, log each state the first time it is computed.

#### Advanced Note

Memoization is often best for irregular state graphs. Tabulation is often best when the dependency order is clear and all states are likely to be needed.

### Concept Cluster: Modeling the DP Correctly
Key concepts in this block:
- 31.5 Defining state correctly
- 31.6 Designing transitions

#### Intuition

Most DP bugs begin before the code. They begin with a vague or wrong state definition.

#### Why It Matters

If the state is too small, it loses information and produces wrong answers. If it is too large, the DP becomes slow, memory-heavy, or unnecessarily complicated.

#### How It Works

Ask these questions:

- what decision or progress marker uniquely describes the remaining problem
- what smaller states can lead into this state, or out of it
- what is the base case
- in what order can these states be computed

Then write the transition as a sentence before turning it into code.

Example sentence:

"The minimum cost to reach index `i` is the current cost plus the minimum of the best cost to reach `i - 1` and `i - 2`."

#### Java Implementation Notes

- Use descriptive names such as `bestCostAtIndex`, `waysToReach`, or `canBreakPrefix`.
- Keep base cases close to the state definition.
- If a transition depends on impossible states, use a clear sentinel like a large constant or `false`.

#### Common Mistakes

- defining state as "the answer so far" instead of "the problem remaining"
- forgetting whether the state includes or excludes the current element
- writing a recurrence that does not shrink toward a base case

#### Quick Example

For word break, a useful state is: `dp[end]` means whether the prefix `s[0..end)` can be segmented. That state gives a clean transition over earlier cut positions.

#### Debugging Tip

For every state variable, say out loud what it means on one concrete input. If that sentence sounds ambiguous, the state is not ready.

#### Advanced Note

Many hard DP problems are not hard because of syntax. They are hard because the correct state is non-obvious.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Fibonacci Numbers
#### Problem Statement

Given `n`, return the `n`th Fibonacci number where `fib(0) = 0` and `fib(1) = 1`.

#### Why This Example Matters

This is the cleanest introduction to overlapping subproblems, memoization, and tabulation.

#### Constraints or Assumptions

- assume `0 <= n <= 45` for `int`
- larger inputs should use `long` or `BigInteger`
- the goal is clarity, not cleverness

#### Brute-Force Approach

Use the direct recursive definition:

- `fib(n) = fib(n - 1) + fib(n - 2)`

This is easy to write but repeats the same states many times.

#### Better Approach

Use tabulation or memoization so each `fib(k)` is computed once.

#### Why the Better Approach Works

The recurrence only depends on two smaller states. Once those answers are known, the current answer is fixed. There is no need to recompute them.

#### Pragmatic Java Choice

Use tabulation here because the dependency order is obvious and every state from `0` to `n` is needed.

#### Java Solution

```java
class FibonacciDpExample {
    static int fibonacci(int n) {
        if (n <= 1) {
            return n;
        }

        int[] dp = new int[n + 1];
        dp[0] = 0;
        dp[1] = 1;

        for (int index = 2; index <= n; index++) {
            dp[index] = dp[index - 1] + dp[index - 2];
        }

        return dp[n];
    }
}
```

#### Dry Run

Input: `n = 6`

- `dp[0] = 0`
- `dp[1] = 1`
- `dp[2] = 1`
- `dp[3] = 2`
- `dp[4] = 3`
- `dp[5] = 5`
- `dp[6] = 8`

Answer: `8`

#### Time and Space Complexity

Brute-force recursion:

- Time: `O(2^n)`
- Space: `O(n)` recursion depth

DP tabulation:

- Time: `O(n)`
- Space: `O(n)`

#### Edge Cases

- `n = 0`
- `n = 1`
- values large enough to overflow `int`

#### Common Mistakes

- forgetting the `n = 0` base case
- treating an uninitialized array cell as a computed answer in memoization
- using recursion for very large `n` in Java without considering stack depth

### Worked Example 2: Minimum Cost to Reach the Last Index
#### Problem Statement

You are given an array `costs` where `costs[i]` is the cost of landing on index `i`. Start at index `0`, and at each move you may jump to `i + 1` or `i + 2`. Return the minimum total cost needed to reach the last index.

#### Why This Example Matters

This example makes optimal substructure concrete and shows how state meaning drives a clean transition.

#### Constraints or Assumptions

- `costs.length >= 1`
- all costs are nonnegative integers
- you must include the landing cost for visited indices

#### Brute-Force Approach

From each index, recursively try both jumps and return the cheaper choice.

That explores an exponential number of repeated states.

#### Better Approach

Use memoization or tabulation with:

- `dp[i] = minimum cost to reach index i`

#### Why the Better Approach Works

To reach index `i`, the previous position must be either `i - 1` or `i - 2`. So the best answer for `i` depends only on the best answers for those two smaller states.

#### Pragmatic Java Choice

Use tabulation because the state order is strictly left to right and the transition is small.

#### Java Solution

```java
class MinimumCostJumpExample {
    static int minimumCost(int[] costs) {
        int n = costs.length;
        if (n == 1) {
            return costs[0];
        }

        int[] dp = new int[n];
        dp[0] = costs[0];
        dp[1] = costs[0] + costs[1];

        for (int index = 2; index < n; index++) {
            dp[index] = costs[index] + Math.min(dp[index - 1], dp[index - 2]);
        }

        return dp[n - 1];
    }
}
```

#### Dry Run

Input: `costs = [1, 4, 2, 7, 3]`

- `dp[0] = 1`
- `dp[1] = 5`
- `dp[2] = 2 + min(5, 1) = 3`
- `dp[3] = 7 + min(3, 5) = 10`
- `dp[4] = 3 + min(10, 3) = 6`

Answer: `6`

The cheapest route is indices `0 -> 2 -> 4`.

#### Time and Space Complexity

Brute-force recursion:

- Time: `O(2^n)`
- Space: `O(n)` recursion depth

DP tabulation:

- Time: `O(n)`
- Space: `O(n)`

#### Edge Cases

- one-element array
- two-element array
- all zero costs

#### Common Mistakes

- defining `dp[i]` as cost from index `i` to the end, then accidentally coding transitions for cost to reach `i`
- forgetting the exact meaning of the starting cost
- mixing jump count with total cost in the same state

### Worked Example 3: Word Break Decision
#### Problem Statement

Given a string `text` and a dictionary of valid words, return `true` if `text` can be split into a sequence of dictionary words, otherwise return `false`.

#### Why This Example Matters

This is a transfer example. The recurrence is not numeric, but the same DP ideas still apply: define the prefix state and build correct transitions.

#### Constraints or Assumptions

- dictionary lookup should be efficient
- exact case-sensitive matches are used
- return only whether a split exists, not the split itself

#### Brute-Force Approach

Try every cut position recursively. For each prefix that is a valid word, recursively solve the suffix.

That can revisit the same suffix many times.

#### Better Approach

Use tabulation on prefixes:

- `dp[end]` is `true` if `text[0..end)` can be segmented

#### Why the Better Approach Works

If there exists a cut position `start` such that:

- `dp[start]` is `true`
- `text[start..end)` is in the dictionary

then `dp[end]` is also `true`.

#### Pragmatic Java Choice

Use a `HashSet<String>` for dictionary membership and a boolean array over prefix lengths.

#### Java Solution

```java
import java.util.HashSet;
import java.util.List;
import java.util.Set;

class WordBreakDpExample {
    static boolean canSegment(String text, List<String> words) {
        Set<String> dictionary = new HashSet<>(words);
        boolean[] dp = new boolean[text.length() + 1];
        dp[0] = true;

        for (int end = 1; end <= text.length(); end++) {
            for (int start = 0; start < end; start++) {
                if (dp[start] && dictionary.contains(text.substring(start, end))) {
                    dp[end] = true;
                    break;
                }
            }
        }

        return dp[text.length()];
    }
}
```

#### Dry Run

Input:

- `text = "applepenapple"`
- `words = ["apple", "pen"]`

State meaning: `dp[end]` tells whether the prefix ending before `end` can be segmented.

- `dp[0] = true`
- `end = 5`, substring `text[0..5) = "apple"`, so `dp[5] = true`
- `end = 8`, substring `text[5..8) = "pen"` and `dp[5] = true`, so `dp[8] = true`
- `end = 13`, substring `text[8..13) = "apple"` and `dp[8] = true`, so `dp[13] = true`

Answer: `true`

#### Time and Space Complexity

Brute-force recursion:

- Time: exponential in the worst case
- Space: `O(n)` recursion depth

DP tabulation:

- Time: `O(n^2)` substring checks, ignoring substring-copy costs in modern Java discussions
- Space: `O(n + d)` where `d` is dictionary storage

#### Edge Cases

- empty string
- dictionary with overlapping words such as `"cat"` and `"cats"`
- no valid segmentation

#### Common Mistakes

- confusing `dp[i]` as "suffix from i works" while coding a prefix DP
- not setting `dp[0] = true`
- forgetting that substring boundaries in Java use half-open intervals

## 4. Complexity and Decision Guide

The main trade-offs in this chapter are not about one specific algorithm. They are about execution style and modeling quality.

- brute-force recursion is acceptable when the state space is tiny or when you are still discovering the recurrence
- memoization is a strong first implementation when the recurrence is natural but the state graph is irregular
- tabulation is often better when the dependency order is obvious, the full state space will be used, or recursion depth could be a problem
- space optimization is worth considering only after the state transition is correct and you know exactly which earlier states are still needed

Recognition signals that DP is appropriate:

- the naive recursive tree repeats the same states
- the problem asks for best count, minimum cost, maximum value, or number of ways
- the answer for a larger instance depends on a bounded set of smaller instances

Signals that you should not force DP:

- a greedy local choice can be proven correct and simpler
- the state would need to remember too much history, making the DP explode
- the problem is really a graph traversal, shortest path, or data-structure query problem in disguise

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs in foundational DP:

- wrong state meaning written in code comments or variable names
- base cases that do not match the state definition
- transitions that accidentally use future states instead of already solved states
- using `0` as both a valid answer and an "uncomputed" marker
- integer overflow when counts or costs become large

Boundary risks:

- empty input
- single-element input
- first row or first column style base states
- off-by-one errors when state indexes represent prefixes of length `i`

State and mutation risks:

- reusing one array slot before all consumers have read the old value
- mixing global mutable state with memoized recursion
- forgetting to clear memo structures between test cases

Short debugging checklist:

- write one sentence that defines `dp[i]` or `dp[state]`
- list the exact base cases
- verify that every transition moves toward a base case
- test the smallest nontrivial input by hand
- print the first few states or table rows to confirm the evaluation order

## 6. Practice Problems

### Easy

**Title:** Fibonacci Number  
**Prompt:** Return the `n`th Fibonacci number.  
**Expected pattern or core idea:** Basic memoization or tabulation over one index.

**Title:** Min Cost Climb Variant  
**Prompt:** Reach the last step with jumps of size `1` or `2` and minimum total cost.  
**Expected pattern or core idea:** Define `dp[i]` as best cost for step `i`.

**Title:** Count Ways to Reach Step `n`  
**Prompt:** Count how many ways exist if each move is `1` or `2` steps.  
**Expected pattern or core idea:** Recurrence with overlapping subproblems.

### Medium

**Title:** Word Break  
**Prompt:** Decide whether a string can be segmented into dictionary words.  
**Expected pattern or core idea:** Prefix state and cut-position transitions.

**Title:** Maximum Sum of Non-Adjacent Values  
**Prompt:** Choose numbers from an array with no adjacent picks and maximize the total.  
**Expected pattern or core idea:** State transition between taking and skipping.

**Title:** Minimum Coins for Amount  
**Prompt:** Return the minimum number of coins needed to reach a target amount.  
**Expected pattern or core idea:** DP state for best answer per amount.

### Hard

**Title:** Partition Array for Minimum Difference  
**Prompt:** Split numbers into two groups so the difference of sums is as small as possible.  
**Expected pattern or core idea:** State design over achievable sums.

**Title:** Decode Message with Wildcards  
**Prompt:** Count the number of valid decodings when some characters can represent multiple digits.  
**Expected pattern or core idea:** Careful transition design and modular counting.

**Title:** Boolean Parenthesization  
**Prompt:** Count how many ways an expression can evaluate to true.  
**Expected pattern or core idea:** Multi-parameter state and transition composition.

## 7. Short Recap

The core idea is that DP solves repeated subproblems once and reuses the result through a well-defined state. The most important optimization insight is that the recurrence comes first, and memoization or tabulation is just the execution strategy. The most important implementation warning is to define the state precisely before writing any array or loop. This prepares the next chapter, where these ideas are applied to standard one-dimensional DP problems.

## 8. Coverage Check

- 31.1 Overlapping subproblems - Covered
- 31.2 Optimal substructure - Covered
- 31.3 Memoization - Covered
- 31.4 Tabulation - Covered
- 31.5 Defining state correctly - Covered
- 31.6 Designing transitions - Covered

Coverage Summary: 6/6 official subtopics covered

Next: One-Dimensional Dynamic Programming
# 32: One-Dimensional Dynamic Programming

**Goal:** Teach how to model and solve classic linear dynamic programming problems where each state usually depends on earlier positions in a sequence.
**Outcome:** By the end of this chapter, you can build one-dimensional DP recurrences, solve foundational interview problems such as climbing stairs, house robber, LIS, and decode ways, and reduce memory when only a small state window is needed.

---

## 1. Intuition First

This chapter matters because many interview problems are really sequence problems in disguise. You move left to right, and each position asks, "What is the best or total answer up to here?"

A simple real-world analogy is walking across numbered stepping stones while keeping a notebook. At each stone, you write the best information you know so far, such as the cheapest cost to get here, the number of ways to get here, or the longest valid pattern ending here.

The core mental model is:

- choose a one-dimensional index such as position, amount, or prefix length
- define what `dp[i]` means in one exact sentence
- compute `dp[i]` from earlier states that are already known

The most common beginner confusion point is writing a recurrence that sounds right but does not match the meaning of `dp[i]`. If the state means "best answer ending at `i`" and the code treats it like "best answer up to `i`," the implementation quietly goes wrong.

This chapter takes the DP foundations from the previous chapter and turns them into standard one-dimensional patterns. The next chapter widens the state shape into rows, columns, and pairs of indexes.

## 2. Core Concepts and Techniques

### Concept Cluster: Introductory Linear Recurrences
Key concepts in this block:
- 32.1 Fibonacci and introductory recurrences
- 32.2 Climbing stairs

#### Intuition

These are the first sequence DP problems because each new state depends on a small, fixed number of earlier states.

#### Why It Matters

They teach the core loop pattern for one-dimensional DP and make base cases visible.

#### How It Works

Fibonacci uses:

- `dp[i] = dp[i - 1] + dp[i - 2]`

Climbing stairs uses the same recurrence if each move is either `1` or `2` steps:

- ways to reach step `i` come from `i - 1` and `i - 2`

#### Java Implementation Notes

- Use `int[]` or `long[]` depending on the size of answers.
- Initialize the first two states before entering the loop.
- If only the previous two states are needed, keep two variables instead of a full array.

#### Common Mistakes

- wrong base cases for `n = 0` or `n = 1`
- starting the loop at the wrong index
- forgetting whether the count includes the starting position

#### Quick Example

For climbing stairs with `n = 4`, the number of ways is:

- step `1`: `1`
- step `2`: `2`
- step `3`: `3`
- step `4`: `5`

#### Debugging Tip

Write out the first five states by hand. If the recurrence or base case is wrong, it usually becomes obvious immediately.

#### Advanced Note

Many introductory recurrences are linear recurrences. Some can later be optimized with matrix methods, but that is outside this chapter's scope.

### Concept Cluster: Sequence Decisions and Best Ending States
Key concepts in this block:
- 32.3 House robber
- 32.4 Longest increasing subsequence

#### Intuition

These problems ask you to make a decision at each position while respecting a constraint.

#### Why It Matters

They teach two essential one-dimensional DP shapes:

- take-or-skip transitions
- best-answer-ending-here transitions

#### How It Works

House robber:

- `dp[i]` is the maximum money from the first `i + 1` houses
- at house `i`, either skip it or take it and add `dp[i - 2]`

Longest increasing subsequence:

- `dp[i]` is the length of the LIS ending at index `i`
- look at every earlier `j < i` where `values[j] < values[i]`

#### Java Implementation Notes

- For house robber, be explicit about whether `dp[i]` uses prefix length or array index.
- For LIS in this chapter, use the `O(n^2)` DP first because it keeps the state and transition visible.
- Name transitions after decisions: `skipCurrent`, `takeCurrent`, `bestEndingHere`.

#### Common Mistakes

- mixing "ending at `i`" with "best up to `i`"
- forgetting that LIS compares values, not indices alone
- using the wrong previous state when taking the current house

#### Quick Example

For houses `[2, 7, 9, 3]`:

- best up to house `0` is `2`
- best up to house `1` is `7`
- best up to house `2` is `11`
- best up to house `3` is still `11`

#### Debugging Tip

If the answer seems too large, check whether your transition accidentally allows adjacent picks or invalid subsequence extensions.

#### Advanced Note

LIS also has an `O(n log n)` method, but the `O(n^2)` DP version is the right learning target for this chapter.

### Concept Cluster: Counting Decodings and Shrinking Memory
Key concepts in this block:
- 32.5 Decode ways
- 32.6 Space optimization techniques

#### Intuition

Some linear DP problems count how many valid interpretations exist rather than maximizing or minimizing a value.

#### Why It Matters

These problems force careful handling of invalid states, boundary conditions, and limited memory.

#### How It Works

Decode ways uses prefix DP:

- one-digit decode if the current character is not `'0'`
- two-digit decode if the last two characters form a number from `10` to `26`

Space optimization works when `dp[i]` depends only on a fixed number of previous states.

#### Java Implementation Notes

- Keep the state meaning fixed when optimizing memory.
- Use descriptive variables such as `previousOne` and `previousTwo`.
- When zeros are invalid in certain positions, check them before adding counts.

#### Common Mistakes

- treating `'0'` as a standalone valid digit
- overwriting a previous state before using it
- applying space optimization before confirming the full DP is correct

#### Quick Example

For `"226"`:

- `"2"`, `"2"`, `"6"`
- `"22"`, `"6"`
- `"2"`, `"26"`

So the answer is `3`.

#### Debugging Tip

For counting problems, list all valid interpretations on a tiny input and compare them with your prefix states.

#### Advanced Note

Space optimization reduces memory, but it can make debugging harder. Keep the full array version first if the transition is still unstable.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Climbing Stairs
#### Problem Statement

Given `n`, return how many distinct ways there are to reach step `n` if each move is either `1` or `2` steps.

#### Why This Example Matters

This is the cleanest one-dimensional DP problem. It shows how a small recurrence becomes a stable loop.

#### Constraints or Assumptions

- `n >= 0`
- the answer fits in `int` for the test range considered here
- reaching step `0` counts as one empty way

#### Brute-Force Approach

Use recursion from step `n` backward:

- ways to reach `n` are ways to reach `n - 1` plus ways to reach `n - 2`

That recomputes the same states many times.

#### Better Approach

Use tabulation over step numbers.

#### Why the Better Approach Works

Each state depends only on the two earlier steps. Once those are known, the current count is fixed.

#### Pragmatic Java Choice

Use a full array first for clarity.

#### Java Solution

```java
class ClimbingStairsDpExample {
    static int countWays(int n) {
        if (n == 0) {
            return 1;
        }
        if (n == 1) {
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

#### Dry Run

Input: `n = 5`

- `dp[0] = 1`
- `dp[1] = 1`
- `dp[2] = 2`
- `dp[3] = 3`
- `dp[4] = 5`
- `dp[5] = 8`

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
- very large `n` where `int` overflows

#### Common Mistakes

- returning `0` for `n = 0`
- starting the loop at `1` and overwriting base cases
- forgetting that this is a count, not a minimum or maximum problem

### Worked Example 2: House Robber
#### Problem Statement

Given an array `money` where `money[i]` is the amount in house `i`, return the maximum amount that can be robbed without robbing two adjacent houses.

#### Why This Example Matters

This is the standard take-or-skip pattern. It appears in many disguised forms.

#### Constraints or Assumptions

- `money.length >= 1`
- values are nonnegative
- houses are arranged in a straight line, not a circle

#### Brute-Force Approach

At each index, either rob the current house and skip the next, or skip the current house.

That builds an exponential recursion tree.

#### Better Approach

Use one-dimensional DP on prefixes.

#### Why the Better Approach Works

For each house, the optimal answer is the better of:

- skipping the current house and keeping the previous best
- taking the current house and adding the best answer from two houses back

#### Pragmatic Java Choice

Use a DP array first, then note the space-optimized form.

#### Java Solution

```java
class HouseRobberDpExample {
    static int maxRobbedAmount(int[] money) {
        int n = money.length;
        if (n == 1) {
            return money[0];
        }

        int[] dp = new int[n];
        dp[0] = money[0];
        dp[1] = Math.max(money[0], money[1]);

        for (int index = 2; index < n; index++) {
            int skipCurrent = dp[index - 1];
            int takeCurrent = money[index] + dp[index - 2];
            dp[index] = Math.max(skipCurrent, takeCurrent);
        }

        return dp[n - 1];
    }
}
```

#### Dry Run

Input: `money = [2, 7, 9, 3, 1]`

- `dp[0] = 2`
- `dp[1] = 7`
- `dp[2] = max(7, 2 + 9) = 11`
- `dp[3] = max(11, 7 + 3) = 11`
- `dp[4] = max(11, 11 + 1) = 12`

Answer: `12`

#### Time and Space Complexity

Brute-force recursion:

- Time: `O(2^n)`
- Space: `O(n)` recursion depth

DP tabulation:

- Time: `O(n)`
- Space: `O(n)`

#### Edge Cases

- one house
- two houses
- all zero values

#### Common Mistakes

- using `dp[i - 1] + money[i]` for the take case, which illegally allows adjacent houses
- forgetting to initialize the second state correctly
- confusing circular-house variants with the linear version

### Worked Example 3: Longest Increasing Subsequence
#### Problem Statement

Given an integer array, return the length of the longest strictly increasing subsequence.

#### Why This Example Matters

This problem teaches the "best answer ending here" state, which is different from prefix-maximum DP.

#### Constraints or Assumptions

- duplicates do not count as increasing
- the subsequence does not need to be contiguous
- use the `O(n^2)` DP approach for this chapter

#### Brute-Force Approach

Explore all subsequences and keep the longest increasing one.

That is exponential because each element is either taken or skipped.

#### Better Approach

Use:

- `dp[i] = length of the longest increasing subsequence ending at i`

#### Why the Better Approach Works

Any increasing subsequence ending at `i` must come from some earlier index `j` where `values[j] < values[i]`. So the best answer ending at `i` extends the best valid earlier ending state.

#### Pragmatic Java Choice

Use the `O(n^2)` DP because it makes the state and transition explicit.

#### Java Solution

```java
import java.util.Arrays;

class LisDpExample {
    static int longestIncreasingSubsequenceLength(int[] values) {
        int n = values.length;
        int[] dp = new int[n];
        Arrays.fill(dp, 1);

        int best = 0;
        for (int current = 0; current < n; current++) {
            for (int previous = 0; previous < current; previous++) {
                if (values[previous] < values[current]) {
                    dp[current] = Math.max(dp[current], dp[previous] + 1);
                }
            }
            best = Math.max(best, dp[current]);
        }

        return best;
    }
}
```

#### Dry Run

Input: `values = [10, 9, 2, 5, 3, 7, 101, 18]`

- each `dp[i]` starts at `1`
- at value `5`, it can extend `2`, so length becomes `2`
- at value `7`, it can extend `5` or `3`, so length becomes `3`
- at value `101`, it can extend `7`, so length becomes `4`

Answer: `4`

One LIS is `[2, 5, 7, 101]`.

#### Time and Space Complexity

Brute-force subsequence search:

- Time: `O(2^n)`
- Space: `O(n)` recursion depth

DP approach:

- Time: `O(n^2)`
- Space: `O(n)`

#### Edge Cases

- empty array
- all equal values
- strictly decreasing array

#### Common Mistakes

- treating equal values as increasing
- defining `dp[i]` as best answer in the prefix but coding an ending-at-`i` transition
- forgetting to track the global maximum across all endings

### Worked Example 4: Decode Ways
#### Problem Statement

Given a digit string where `'1'` maps to `'A'`, `'2'` to `'B'`, up to `'26'` to `'Z'`, return how many valid decodings exist.

#### Why This Example Matters

This problem combines one-dimensional prefix DP with strict invalid-state handling. It is a common interview trap because `'0'` changes the transition rules.

#### Constraints or Assumptions

- the string contains only digits
- empty string handling should be explicit
- leading zeros are invalid

#### Brute-Force Approach

At each index, try decoding one digit and, when valid, two digits.

That revisits the same suffixes many times.

#### Better Approach

Use prefix DP with space optimization.

#### Why the Better Approach Works

The number of ways to decode up to position `i` depends only on:

- the number of ways up to `i - 1` if the current digit is valid alone
- the number of ways up to `i - 2` if the last two digits form a valid letter

#### Pragmatic Java Choice

Use two rolling variables because only the previous two states are needed.

#### Java Solution

```java
class DecodeWaysDpExample {
    static int decodeWays(String digits) {
        if (digits.isEmpty() || digits.charAt(0) == '0') {
            return 0;
        }

        int previousTwo = 1;
        int previousOne = 1;

        for (int index = 1; index < digits.length(); index++) {
            int current = 0;

            if (digits.charAt(index) != '0') {
                current += previousOne;
            }

            int twoDigitValue = (digits.charAt(index - 1) - '0') * 10 + (digits.charAt(index) - '0');
            if (twoDigitValue >= 10 && twoDigitValue <= 26) {
                current += previousTwo;
            }

            previousTwo = previousOne;
            previousOne = current;
        }

        return previousOne;
    }
}
```

#### Dry Run

Input: `digits = "226"`

- before the loop, `previousTwo = 1`, `previousOne = 1`
- at index `1` (`'2'`): single-digit valid and `22` valid, so `current = 2`
- update: `previousTwo = 1`, `previousOne = 2`
- at index `2` (`'6'`): single-digit valid and `26` valid, so `current = 3`

Answer: `3`

#### Time and Space Complexity

Brute-force recursion:

- Time: exponential in the worst case
- Space: `O(n)` recursion depth

Space-optimized DP:

- Time: `O(n)`
- Space: `O(1)`

#### Edge Cases

- empty string
- leading zero
- strings like `"10"` and `"101"`
- invalid strings like `"06"`

#### Common Mistakes

- counting `'0'` as a standalone letter
- allowing two-digit values outside `10` to `26`
- updating rolling variables in the wrong order

## 4. Complexity and Decision Guide

One-dimensional DP usually trades a naive exponential recursion for linear or quadratic time, depending on how many earlier states each position must inspect.

- introductory recurrences such as Fibonacci and climbing stairs are usually `O(n)` with constant or linear space
- take-or-skip patterns such as house robber are usually `O(n)` because each state inspects only a constant number of earlier states
- LIS with the straightforward DP is `O(n^2)` because each state compares against all previous positions
- decode ways is `O(n)` because each prefix only checks one-digit and two-digit extensions

When to choose brute force:

- when you are first discovering the recurrence on a tiny input
- when the input size is so small that exponential exploration is acceptable

When to optimize:

- when repeated states appear immediately in the recursion tree
- when constraints suggest `n` in the thousands or higher
- when the transition only depends on a small fixed window of prior states and space can be reduced safely

Recognition signals for one-dimensional DP:

- the input is a linear sequence or prefix-based string problem
- the answer for index `i` depends on a bounded set of earlier indices
- the problem asks for count, min, max, or best valid ending state

Signals not to force this technique:

- the problem depends on two moving boundaries and is better handled by sliding window
- the structure is really a grid, tree, or graph state space
- a greedy invariant solves the problem more simply and can be justified

## 5. Edge Cases, Pitfalls, and Debugging

Common one-dimensional DP bugs:

- state meaning changes halfway through the implementation
- wrong initialization for the first one or two positions
- using invalid earlier states such as `i - 2` when `i < 2`
- reading from an already overwritten rolling variable
- mixing contiguous subarray logic with subsequence logic

Boundary risks:

- empty arrays or strings
- single-element inputs
- inputs containing zeros or duplicates when validity rules matter

Mutation and indexing risks:

- updating `previousTwo` before using it
- off-by-one mistakes when state uses prefix length rather than array index
- assuming `dp[n - 1]` is the answer when the state definition says the answer is the maximum over all `dp[i]`

Short debugging checklist:

- state what `dp[i]` means on paper
- verify base states for the smallest inputs
- test a case where only one transition path is valid
- test a case where multiple transition paths combine into the answer
- only after correctness is stable, reduce memory usage

## 6. Practice Problems

### Easy

**Title:** Climbing Stairs  
**Prompt:** Count how many ways there are to reach step `n` using moves of `1` or `2`.  
**Expected pattern or core idea:** Introductory recurrence over one index.

**Title:** Min Cost Stair Climb  
**Prompt:** Reach the top with the minimum total cost when each step has an entry cost.  
**Expected pattern or core idea:** Linear DP with min transitions.

**Title:** Tribonacci Number  
**Prompt:** Return the `n`th value of a three-term recurrence.  
**Expected pattern or core idea:** Small fixed dependency window and space optimization.

### Medium

**Title:** House Robber  
**Prompt:** Maximize robbed value without taking adjacent houses.  
**Expected pattern or core idea:** Take-or-skip DP.

**Title:** Decode Ways  
**Prompt:** Count how many valid letter decodings exist for a digit string.  
**Expected pattern or core idea:** Prefix DP with invalid-state checks.

**Title:** Longest Increasing Subsequence  
**Prompt:** Return the length of the longest strictly increasing subsequence.  
**Expected pattern or core idea:** Best subsequence ending at each index.

### Hard

**Title:** House Robber II  
**Prompt:** Maximize robbed value when houses are arranged in a circle.  
**Expected pattern or core idea:** Split into two linear one-dimensional DP runs.

**Title:** Delete and Earn  
**Prompt:** Pick values for points, but taking value `x` prevents taking `x - 1` and `x + 1`.  
**Expected pattern or core idea:** Transform the frequency map into a house robber DP.

**Title:** Number of Longest Increasing Subsequences  
**Prompt:** Count how many LIS solutions exist.  
**Expected pattern or core idea:** Track length and count states together.

## 7. Short Recap

The core idea is to define a linear state such as position or prefix length and compute each state from earlier ones in a valid order. The most important optimization insight is that many one-dimensional DP problems only depend on a small recent window, so memory can often be reduced after correctness is confirmed. The most important implementation warning is to keep the exact meaning of `dp[i]` consistent. This prepares the next chapter, where DP states expand beyond one index into grids, capacities, and pairs of strings.

## 8. Coverage Check

- 32.1 Fibonacci and introductory recurrences - Covered
- 32.2 Climbing stairs - Covered
- 32.3 House robber - Covered
- 32.4 Longest increasing subsequence - Covered
- 32.5 Decode ways - Covered
- 32.6 Space optimization techniques - Covered

Coverage Summary: 6/6 official subtopics covered

Next: Two-Dimensional Dynamic Programming
# 15: Choice and Sequence DP Patterns

## 0. Introduction

This chapter sits in Part IV - Dynamic Programming Pattern Mastery (Weeks 16-22), with the roadmap treating it as upper intermediate work. Its goal is to learn the main dynamic programming families where decisions over items, prefixes, strings, ranges, and explicit modes lead to reusable state and transition templates. This chapter directly supports the Part IV outcome of writing Java DP solutions from recurrence to optimized implementation and moving from pattern recognition to explicit state design.

Read it as a bridge in the larger sequence. Chapter 14 established DP foundations: state meaning, transition logic, memoization, and tabulation. This chapter applies those foundations to the major DP families that appear across interviews and contests. Chapter 16 pushes DP state design further into trees, digits, bitmasks, compressed states, sparse memo tables, and harder pruning logic. Start this chapter after you are comfortable with Chapters 1 through 14, especially state representation, transition logic, and memoization-versus-tabulation trade-offs. The main themes here are Knapsack Pattern, Subsequence DP Pattern, String DP Pattern, Interval DP Pattern, State Machine DP Pattern, and Recurrence mistakes, invalid states, and base-case design.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to recognize and implement knapsack, subsequence, string, interval, and state-machine DP patterns in Java, while avoiding recurrence mistakes, invalid states, and weak base-case design.

## 1. Intuition First

This chapter matters because many important DP problems are not new from scratch. They belong to a small number of recurring families. Once you can classify a problem as knapsack-like, subsequence-based, interval-based, or state-machine-based, the state design becomes much more manageable.

The simplest analogy is organizing tools by task. You do not use the same tool for measuring a wall, cutting wood, and tightening bolts. Dynamic programming is similar. A budget-and-choice problem behaves like knapsack. Relative order problems behave like subsequence or string DP. Range-splitting problems behave like interval DP. Problems that switch among modes such as holding, selling, cooling down, or resting behave like state-machine DP.

The core mental model is:

- knapsack DP distributes choices over capacity or budget
- subsequence DP compares ordered elements while preserving relative order
- string DP is often prefix-pair DP over edits, matches, or alignments
- interval DP solves a range by splitting it into smaller ranges
- state-machine DP tracks which mode or status the process is in

Recognition signals for this chapter:

- choose items under a limit or budget
- order matters but contiguity does not
- two strings or sequence prefixes interact
- answer for a subarray or substring depends on splitting an interval
- a small number of “modes” govern allowed next transitions

The most common beginner confusion point is choosing a famous DP formula before writing the state meaning. The family name is useful only after the state and recurrence are made precise.

In the larger roadmap, this chapter is where DP stops being a single technique and becomes a collection of reusable structural families.

## 2. Learning Path and Recognition Checklist

The chapter starts with knapsack because capacity-based choose-or-skip decisions are one of the clearest DP families. It then moves into subsequence and string DP, where prefix pairs and ordered comparisons dominate. After that, it introduces interval DP, where subarrays or substrings are solved by splitting ranges. Finally, it covers state-machine DP, where a small finite set of modes drives transitions. Throughout, the chapter keeps surfacing recurrence mistakes, invalid states, and base-case design.

Recognition checklist for this chapter:

- Is the problem about selecting items under a weight, capacity, or count limit?
- Does the answer depend on preserving relative order across one or two sequences?
- Are there two indices over prefixes or strings that define the subproblem?
- Does each answer come from splitting a range at one or more pivot points?
- Can the process be described as moving among a few modes such as hold, free, used, or cooldown?
- Have invalid states been identified explicitly instead of being left to default values accidentally?

The brute-force baselines usually look like this:

- try every subset under a budget
- try every possible alignment or deletion sequence
- recursively split every interval without caching
- simulate all decision histories instead of compressing them into modes

The optimization is to match the recurrence family to the structure:

- knapsack for capacity-constrained choices
- subsequence or string DP for ordered comparisons
- interval DP for range splitting
- state machine DP for mode transitions

Mastery by the end of the chapter looks like this: you can name the family, define the state cleanly, reject invalid states explicitly, and explain why each transition corresponds to a legal problem move.

Do not force interval DP when a linear left-to-right DP already solves the problem. Do not force a 2D string table when one sequence or one mode already captures the full state.

## 3. Official Subtopic Coverage

### Concept Cluster: Capacity and Ordered Choice Families
Official subtopics covered:
- 15.1 Knapsack Pattern
- 15.2 Subsequence DP Pattern

#### Definition or Framing
The Knapsack Pattern models choose-or-skip decisions under a capacity, budget, or constraint. The Subsequence DP Pattern models problems where relative order matters but elements do not need to stay contiguous.

#### Recognition Signals
- knapsack: capacity, weight, cost, count limit, choose-or-skip items
- subsequence: order matters, skipping is allowed, compare prefixes or positions while preserving order

#### Brute-Force Baseline
- knapsack: enumerate all subsets and keep the best valid one
- subsequence: try all subsequences or all pairwise alignments recursively

#### Optimized Pattern Idea
Knapsack uses DP over items and capacity or over capacity only, depending on the variant. Subsequence DP uses prefix-based states such as `dp[i][j]` for the best answer using the first `i` and first `j` elements.

#### Invariant / State Representation / Transition Logic
In knapsack, `dp[i][c]` or `dp[c]` must mean the best value achievable using a defined set of items and capacity `c`. In subsequence DP, `dp[i][j]` typically means the answer for prefixes ending before `i` and `j`, preserving order constraints.

#### Java Implementation Notes
- 0/1 knapsack often needs reverse capacity iteration in 1D compression so each item is used at most once
- unbounded knapsack often iterates capacities forward because reuse is allowed
- subsequence DP frequently uses 2D arrays with dimensions `(n + 1) x (m + 1)`

#### Quick Dry Run
If a 0/1 knapsack item of weight `3` and value `4` is processed, capacity `5` may update from `dp[2] + 4`, but reverse iteration ensures the same item is not reused in the same round.

#### Common Mistakes
- iterating 0/1 knapsack capacities forward and accidentally reusing one item multiple times
- confusing subsequence with substring and allowing gaps where contiguity is required
- using `0` for impossible states when a problem needs explicit negative infinity or a sentinel invalid marker

#### Debugging Strategy
For knapsack, print one row or one capacity array after each item. For subsequence DP, fill a tiny prefix table by hand and compare it with the program.

#### Comparison with Similar Pattern
Knapsack is about constrained selection. Subsequence DP is about ordered matching or progression. Both are choice-driven, but their state axes mean different things.

#### Advanced Note
Many later hard DP problems blend knapsack with bitmasks or subsequence DP with state machines, but the underlying family identity still helps.

### Concept Cluster: Prefix Pairs, Ranges, and Mode Changes
Official subtopics covered:
- 15.3 String DP Pattern
- 15.4 Interval DP Pattern
- 15.5 State Machine DP Pattern

#### Definition or Framing
String DP usually compares prefixes or suffixes of strings under edit, match, or alignment rules. Interval DP solves a range by considering smaller subranges and split points. State Machine DP tracks a process across a small set of modes with allowed transitions between them.

#### Recognition Signals
- string DP: edit distance, alignment, longest common subsequence or substring, palindrome transformations
- interval DP: ranges, substrings, subarrays, burst or merge order, split points matter
- state machine DP: buy/hold/sell, rest/cooldown, used/not used, phase-driven transitions

#### Brute-Force Baseline
- string DP: recursively try edits or character matches across prefixes
- interval DP: recursively split a range at every pivot with repeated recomputation
- state machine DP: simulate all action sequences over time

#### Optimized Pattern Idea
String DP uses prefix-pair tables. Interval DP uses states like `dp[left][right]` with transitions over possible split points or last actions inside the interval. State-machine DP uses a few explicit mode states with day-to-day or step-to-step transitions.

#### Invariant / State Representation / Transition Logic
String DP entries must name the prefix relation exactly. Interval DP entries must mean the answer for a closed range or half-open range consistently. State-machine DP entries must mean the best or count value when the process ends the current step in a specific mode.

#### Java Implementation Notes
- interval DP often iterates by increasing interval length
- string DP often uses `dp[0][*]` and `dp[*][0]` as base rows or columns
- state-machine DP often fits cleanly into a small number of rolling variables after the full-state version is understood

#### Quick Dry Run
If `dp[left][right]` means the best answer for interval `[left, right]`, then shorter intervals such as `[left, mid]` and `[mid + 1, right]` must be solved first. If `hold[day]` means best profit while holding a stock at the end of that day, then transitions into `hold[day]` must only come from legal earlier modes.

#### Common Mistakes
- filling interval DP in left-to-right order instead of by increasing interval length
- mixing substring and subsequence logic in string DP
- forgetting that state-machine modes are mutually exclusive and need separate transitions

#### Debugging Strategy
For interval DP, write the table diagonally by length on paper. For state-machine DP, label each mode in plain language and verify every transition is legal.

#### Comparison with Similar Pattern
String DP and subsequence DP often share 2D tables, but string-specific operations usually involve edit or match rules. Interval DP depends on range splitting. State-machine DP depends on mode transitions, not index pairs alone.

#### Advanced Note
Later advanced DP chapters will compress these families, combine them with masks or trees, or optimize their transitions, but the state definitions stay recognizable.

### Concept Cluster: Recurrence Failures and Base-Case Discipline
Official subtopics covered:
- 15.6 Recurrence mistakes, invalid states, and base-case design

#### Definition or Framing
Recurrence mistakes happen when the state meaning, legal transitions, impossible states, or base cases do not match the actual problem. Invalid-state design means some table entries should be unreachable or forbidden, not quietly treated as ordinary zeros.

#### Recognition Signals
- recurrence seems plausible but gives impossible answers
- some combinations of indices or modes should never occur
- base cases feel patched in instead of logically derived

#### Brute-Force Baseline
Beginners often avoid invalid-state design and hope default array values behave like meaningful answers. That can accidentally pass small tests and fail badly later.

#### Optimized Pattern Idea
Name invalid states explicitly, initialize them with safe sentinels when needed, and derive base cases directly from the state meaning rather than from convenience.

#### Invariant / State Representation / Transition Logic
Every DP entry must be either valid and meaningful or explicitly impossible. Base cases should be the smallest valid states under the same interpretation used everywhere else.

#### Java Implementation Notes
- use large negative sentinels for impossible maximization states and large positive sentinels for impossible minimization states when needed
- avoid accidental overflow when adding to sentinel values
- validate recurrence edges for the first row, first column, smallest interval, or first mode step

#### Quick Dry Run
If a stock DP has a “hold” state on day `0`, it can be initialized as `-price[0]`, but a “cooldown before any sale” state may be invalid and should not default silently to zero if that changes transitions incorrectly.

#### Common Mistakes
- defaulting impossible states to zero
- copying a recurrence from another family with a different state meaning
- using base cases that are easy to code but logically inconsistent

#### Debugging Strategy
Inspect the first few rows, columns, lengths, or days. Most DP bugs appear at boundaries before they appear in the middle of the table.

#### Comparison with Similar Pattern
A recurrence is not correct just because it resembles a familiar DP template. It is correct only if the state meaning, legal moves, and base cases all align.

#### Advanced Note
The more advanced the DP family, the more important invalid-state design becomes, especially with masks, compressed states, or multiple phases.

## 4. Pattern Template, State Model, or Core Workflow

Canonical 0/1 knapsack workflow:

```java
for (int item = 0; item < itemCount; item++) {
    for (int capacity = maxCapacity; capacity >= weight[item]; capacity--) {
        dp[capacity] = Math.max(dp[capacity], dp[capacity - weight[item]] + value[item]);
    }
}
```

Canonical subsequence or string DP workflow:

```java
for (int i = 1; i <= firstLength; i++) {
    for (int j = 1; j <= secondLength; j++) {
        dp[i][j] = transition(dp, i, j);
    }
}
```

Canonical interval DP workflow:

```java
for (int length = 1; length <= n; length++) {
    for (int left = 0; left + length - 1 < n; left++) {
        int right = left + length - 1;
        dp[left][right] = computeFromShorterIntervals(left, right, dp);
    }
}
```

Canonical state-machine DP workflow:

```java
for (int day = 1; day < prices.length; day++) {
    nextHold = Math.max(previousHold, previousFree - prices[day]);
    nextFree = Math.max(previousFree, previousHold + prices[day]);
}
```

Important variables and decision rules:

- capacity or budget axis for knapsack
- prefix indices for subsequence and string DP
- left and right bounds for interval DP
- explicit modes for state-machine DP
- sentinel values for invalid states

Safety rules:

- write the state sentence before choosing dimensions
- initialize impossible states deliberately, not accidentally
- fill interval DP by length, not by raw indices alone
- match iteration direction to 0/1 versus unbounded reuse in knapsack
- confirm every state-machine transition is legal in the original problem

What usually breaks first is a transition that looks familiar but belongs to a different family or state meaning.

Adapt the templates by changing the objective, dimensions, or number of modes, but keep the state interpretation explicit.

## 5. Worked Examples and Full Solutions

### Worked Example 1: 0/1 Knapsack
#### Problem Statement
Given arrays `weights` and `values`, and an integer `capacity`, return the maximum total value that fits in the knapsack if each item can be taken at most once.

#### Why This Example Matters
This is the foundational choice DP example because it makes the difference between taking and skipping an item explicit under a capacity constraint.

#### Input and Constraints
- each item may be chosen at most once
- capacity is limited
- maximize total value

#### Recognition Signals
- choose or skip
- limited capacity
- each choice affects remaining budget

#### Brute-Force Approach
Enumerate all subsets of items, compute their total weight and value, and keep the best valid subset.

#### Better Pattern-Based Approach
Use 1D knapsack DP with reverse capacity iteration.

#### Why the Pattern Fits
The problem is exactly about best value under a capacity constraint with one-time item usage.

#### Invariant or State Transition
`dp[c]` means the best value achievable with capacity `c` after processing items up to the current step. Reverse iteration prevents one item from being reused in the same round.

#### Pragmatic Java Choice
Use a 1D array because it is the clearest compressed version once the recurrence is understood.

#### Dry Run Before Code
If an item has weight `2` and value `6`, capacity `5` can consider `dp[3] + 6`. But reverse iteration ensures `dp[3]` still refers to earlier items only, not this item reused.

#### Java Solution
```java
public class ZeroOneKnapsackDP {
    public int maxValue(int[] weights, int[] values, int capacity) {
        int[] dp = new int[capacity + 1];

        for (int item = 0; item < weights.length; item++) {
            for (int currentCapacity = capacity; currentCapacity >= weights[item]; currentCapacity--) {
                dp[currentCapacity] = Math.max(
                        dp[currentCapacity],
                        dp[currentCapacity - weights[item]] + values[item]);
            }
        }

        return dp[capacity];
    }
}
```

#### Time and Space Complexity
- Brute-force subsets: $O(2^n)$ time, $O(n)$ subset storage depth
- DP: $O(n \cdot capacity)$ time, $O(capacity)$ space

#### Edge Cases
- zero capacity
- no items
- items heavier than the full capacity

#### Common Mistakes
- iterating capacity forward and accidentally turning 0/1 knapsack into unbounded knapsack
- forgetting what `dp[c]` means after each item round
- assuming every item must be taken or skipped exactly once in the final answer rather than considering capacity feasibility

### Worked Example 2: Longest Common Subsequence
#### Problem Statement
Given two strings `text1` and `text2`, return the length of their longest common subsequence.

#### Why This Example Matters
This is the classic subsequence and string DP example because the state is defined by two prefixes and relative order matters while contiguity does not.

#### Input and Constraints
- order matters
- skipping characters is allowed
- contiguity is not required

#### Recognition Signals
- compare two sequences by prefixes
- subsequence, not substring
- repeated overlap across suffix or prefix pairs

#### Brute-Force Approach
Recursively try matching or skipping characters from the two strings and take the best result.

#### Better Pattern-Based Approach
Use 2D DP where `dp[i][j]` is the LCS length for the first `i` characters of `text1` and the first `j` characters of `text2`.

#### Why the Pattern Fits
Two prefix lengths fully describe the subproblem, and the recurrence branches on whether the current characters match.

#### Invariant or State Transition
If the last characters match, `dp[i][j] = dp[i - 1][j - 1] + 1`. Otherwise, `dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])`.

#### Pragmatic Java Choice
Use a `(length + 1) x (length + 1)` table so empty-prefix base cases are easy.

#### Dry Run Before Code
For `"abcde"` and `"ace"`, matching `a`, then `c`, then `e` builds the subsequence length gradually across the 2D prefix table.

#### Java Solution
```java
public class LongestCommonSubsequenceDP {
    public int longestCommonSubsequence(String text1, String text2) {
        int[][] dp = new int[text1.length() + 1][text2.length() + 1];

        for (int i = 1; i <= text1.length(); i++) {
            for (int j = 1; j <= text2.length(); j++) {
                if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        return dp[text1.length()][text2.length()];
    }
}
```

#### Time and Space Complexity
- Brute-force recursion: exponential time in the worst case
- DP: $O(nm)$ time, $O(nm)$ space

#### Edge Cases
- one or both strings empty
- no common characters
- one string fully contained as a subsequence of the other

#### Common Mistakes
- using substring logic and requiring contiguity
- forgetting the extra row and column for empty prefixes
- confusing character positions with DP indices shifted by one

### Worked Example 3: Burst Balloons
#### Problem Statement
Given an array `nums`, each time you burst balloon `i` you gain `nums[left] * nums[i] * nums[right]`, where `left` and `right` are the adjacent balloons still remaining. Return the maximum coins obtainable.

#### Why This Example Matters
This is a signature interval DP problem because the answer for a range depends on choosing the last balloon to burst inside that interval.

#### Input and Constraints
- bursting order matters
- a local greedy choice is not enough
- the problem is defined on subarrays with changing neighbors

#### Recognition Signals
- interval or subarray state
- answer depends on picking a split or last action inside a range
- recursive brute force over orders explodes combinatorially

#### Brute-Force Approach
Try every possible balloon-burst order and compute the resulting score.

#### Better Pattern-Based Approach
Pad the array with `1`s on both ends and define `dp[left][right]` as the best answer for the open interval between `left` and `right`, then choose which balloon is burst last inside it.

#### Why the Pattern Fits
Choosing the last balloon in an interval makes the remaining neighbors fixed, which is exactly what interval DP needs.

#### Invariant or State Transition
`dp[left][right]` stores the best answer for bursting all balloons strictly between `left` and `right`. Transition by trying each `mid` in `(left, right)` as the last balloon.

#### Pragmatic Java Choice
Use a 2D table over padded indices and iterate intervals by increasing length.

#### Dry Run Before Code
If balloon `mid` is chosen last in `(left, right)`, then the total is the left interval result plus the right interval result plus the coins from bursting `mid` when `left` and `right` are its final neighbors.

#### Java Solution
```java
public class BurstBalloonsIntervalDP {
    public int maxCoins(int[] nums) {
        int n = nums.length;
        int[] values = new int[n + 2];
        values[0] = 1;
        values[n + 1] = 1;
        for (int index = 0; index < n; index++) {
            values[index + 1] = nums[index];
        }

        int[][] dp = new int[n + 2][n + 2];

        for (int length = 2; length < n + 2; length++) {
            for (int left = 0; left + length < n + 2; left++) {
                int right = left + length;
                for (int mid = left + 1; mid < right; mid++) {
                    dp[left][right] = Math.max(
                            dp[left][right],
                            dp[left][mid] + dp[mid][right] + values[left] * values[mid] * values[right]);
                }
            }
        }

        return dp[0][n + 1];
    }
}
```

#### Time and Space Complexity
- Brute-force order search: factorial or worse in structure
- Interval DP: $O(n^3)$ time, $O(n^2)$ space

#### Edge Cases
- one balloon
- repeated equal values
- zeros inside the array

#### Common Mistakes
- trying to decide the first burst instead of the last burst
- filling the interval table in the wrong order
- forgetting the padded boundary balloons with value `1`

### Worked Example 4: Best Time to Buy and Sell Stock with Cooldown
#### Problem Statement
Given an array `prices`, return the maximum profit you can achieve if you may buy and sell multiple times, but after selling a stock you must wait one day before buying again.

#### Why This Example Matters
This is a clean state-machine DP example because the process has a small set of mutually exclusive modes with legal transitions between them.

#### Input and Constraints
- one stock at a time
- cooldown after every sale
- maximize total profit

#### Recognition Signals
- actions change the process mode
- legality of the next action depends on the current mode
- a small number of states summarizes the full history

#### Brute-Force Approach
Try all valid action sequences day by day and keep the best profit.

#### Better Pattern-Based Approach
Track three modes at the end of each day: holding a stock, just sold today, or free to buy.

#### Why the Pattern Fits
The entire relevant history compresses into the current day and current mode. No longer history is needed once the mode values are known.

#### Invariant or State Transition
At day `i`, `hold`, `sold`, and `free` mean the best profit if the day ends in those modes. Transitions only follow legal actions:

- `hold` from previous `hold` or previous `free - price`
- `sold` from previous `hold + price`
- `free` from previous `free` or previous `sold`

#### Pragmatic Java Choice
Use rolling variables because there are only three states per day.

#### Dry Run Before Code
If you end day `i - 1` in `sold`, then day `i` can be `free`, but not `hold` from an immediate buy on the cooldown day. That is exactly why separate modes are needed.

#### Java Solution
```java
public class StockWithCooldownStateMachineDP {
    public int maxProfit(int[] prices) {
        if (prices.length == 0) {
            return 0;
        }

        int hold = -prices[0];
        int sold = Integer.MIN_VALUE / 2;
        int free = 0;

        for (int day = 1; day < prices.length; day++) {
            int nextHold = Math.max(hold, free - prices[day]);
            int nextSold = hold + prices[day];
            int nextFree = Math.max(free, sold);

            hold = nextHold;
            sold = nextSold;
            free = nextFree;
        }

        return Math.max(sold, free);
    }
}
```

#### Time and Space Complexity
- Brute-force action search: exponential time
- State-machine DP: $O(n)$ time, $O(1)$ space

#### Edge Cases
- empty price list
- one day only
- strictly decreasing prices
- repeated equal prices

#### Common Mistakes
- merging incompatible modes into one value
- allowing a buy immediately after a sale despite cooldown
- initializing impossible states with ordinary zero values

## 6. Complexity and Comparison Guide

This chapter is about choosing the right DP family for the recurrence structure.

- Knapsack-style DP often costs $O(n \cdot capacity)$ or similar resource-by-item complexity.
- Subsequence and string DP often cost $O(nm)$ for two-prefix tables.
- Interval DP commonly costs $O(n^3)$ time and $O(n^2)$ space because each interval tries split points.
- State-machine DP often runs in linear time with a very small constant number of modes.

Comparison with similar patterns:

- Knapsack versus greedy: greedy may fail when local value density or local benefit is not globally safe; knapsack keeps alternatives through DP states.
- Subsequence versus substring DP: subsequences allow gaps, substrings require contiguity.
- String DP versus interval DP: string DP is often prefix-pair based; interval DP is range-splitting based.
- State-machine DP versus plain 1D DP: both may be linear, but state-machine DP makes modes explicit so illegal transitions are excluded cleanly.

Decision criteria:

- choose knapsack for budget or capacity-constrained selection
- choose subsequence or string DP for ordered prefix comparisons
- choose interval DP for subarray or substring problems solved by last choice or split points
- choose state-machine DP when a small number of legal modes controls future actions

Signals that you should not force these techniques:

- using interval DP when there is no meaningful range split
- using a 2D prefix table when one linear state already captures the recurrence
- using state-machine terminology without identifying actual legal modes

What breaks when invariants fail is usually validity of transitions. A table can still fill completely while moving through illegal states or skipping necessary modes.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- wrong iteration direction in knapsack
- mixing subsequence and substring logic
- filling interval DP before shorter intervals are ready
- forgetting impossible-mode initialization in state-machine DP
- base cases that do not match the state meaning

Boundary and invalid-state risks:

- empty prefix rows and columns in string DP
- smallest interval lengths in interval DP
- zero capacity or zero amount in knapsack-like problems
- sentinel overflow when adding to “impossible” values

Short debugging checklist:

1. What exactly does one DP entry mean?
2. Are there invalid states that should not default to zero?
3. Does the loop order respect reuse rules and dependency direction?
4. For interval DP, are shorter ranges fully solved first?
5. For mode-based DP, does every transition correspond to a legal action?

Quick counterexample that defeats a common wrong solution:

If 0/1 knapsack iterates capacity forward, a single item of weight `2` and value `5` can incorrectly contribute twice to capacity `4` in the same item round. That silently turns the problem into the unbounded version and breaks correctness.

## 8. Practice Problems

### Easy
- Partition Equal Subset Sum intro variants: Decide whether a subset reaches half the total. Expected pattern or core idea: knapsack DP.
- Longest Common Subsequence: Find the longest ordered shared sequence. Expected pattern or core idea: subsequence DP.
- Best Time to Buy and Sell Stock basic variants: Track profit across small action modes. Expected pattern or core idea: state-machine DP.

### Medium
- Coin Change: Minimize coins to form a target amount. Expected pattern or core idea: knapsack-style or amount DP.
- Edit Distance: Minimize operations to convert one string to another. Expected pattern or core idea: string DP.
- Burst Balloons: Maximize coins by choosing last burst inside intervals. Expected pattern or core idea: interval DP.

### Hard
- Regular Expression Matching: Match a string against pattern rules. Expected pattern or core idea: string DP with careful invalid states.
- Palindrome Partitioning II: Minimize cuts using prefix and palindrome state. Expected pattern or core idea: interval and string DP blend.
- Advanced stock trading variants with fees or limited transactions: Optimize across richer action modes. Expected pattern or core idea: state-machine DP.

## 9. Short Recap

The core idea of this chapter is that major DP families are distinguished by what the state axis represents: capacity, prefixes, intervals, or modes. The strongest recognition clue is the structure of legal transitions, not the story around the problem. The most important optimization insight is that once the right family is chosen, the recurrence often becomes much simpler and safer. The most important implementation warning is that invalid states and weak base cases can quietly poison a recurrence. This chapter prepares the next one by pushing DP beyond these standard families into trees, digits, masks, compressed states, and sparse caching.

## 10. Coverage Check

- 15.1 Knapsack Pattern - Covered
- 15.2 Subsequence DP Pattern - Covered
- 15.3 String DP Pattern - Covered
- 15.4 Interval DP Pattern - Covered
- 15.5 State Machine DP Pattern - Covered
- 15.6 Recurrence mistakes, invalid states, and base-case design - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 16: Advanced State DP Patterns
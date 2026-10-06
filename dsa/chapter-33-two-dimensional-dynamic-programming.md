# 33: Two-Dimensional Dynamic Programming

**Goal:** Teach how to design DP states with two coordinates, whether those coordinates represent grid positions, capacities, or two-string prefixes.
**Outcome:** By the end of this chapter, you can model two-dimensional DP tables, solve grid path problems, handle knapsack-style decisions, and reason about pairwise string DPs such as LCS and edit distance in Java.

---

## 1. Intuition First

This chapter matters because some problems cannot be described by a single index. You may need both a row and a column, an item index and a remaining capacity, or two prefix lengths from two different strings.

A simple real-world analogy is filling out a travel planner on graph paper. One axis tracks where you are in one dimension of the problem, and the second axis tracks another piece of progress. Each cell summarizes the best answer for one combination of those two choices.

The core mental model is:

- define what each axis means
- define what one cell `dp[row][col]` means
- fill the grid or table in an order where dependencies are already known

The most common beginner confusion point is thinking two-dimensional DP is just one-dimensional DP with extra syntax. The real challenge is not the second bracket. It is making sure both axes represent the right progress variables.

This chapter extends the previous chapter's linear state design into richer state spaces. The next chapter pushes even further into advanced DP on trees, subsets, strings, and digit constraints.

## 2. Core Concepts and Techniques

### Concept Cluster: Grid Movement States
Key concepts in this block:
- 33.1 Grid dynamic programming
- 33.2 Unique paths
- 33.3 Minimum path sum

#### Intuition

In grid DP, each cell depends on neighboring cells that could reach it.

#### Why It Matters

This is the easiest way to learn two-dimensional state flow. It also introduces careful boundary handling for the first row and first column.

#### How It Works

Unique paths:

- `dp[row][col]` is the number of ways to reach cell `(row, col)`
- if movement is only right or down, then states come from top and left

Minimum path sum:

- `dp[row][col]` is the minimum total cost to reach `(row, col)`
- transition uses the smaller of the top and left costs plus the current cell value

#### Java Implementation Notes

- Use `rows` and `cols` variables instead of repeating `grid.length` expressions.
- Initialize the first row and first column carefully because they have fewer incoming states.
- Keep the state meaning fixed as either count, cost, or maximum value.

#### Common Mistakes

- reading from `row - 1` or `col - 1` when on a boundary
- mixing count logic with minimum-cost logic
- forgetting whether the starting cell contributes cost

#### Quick Example

On a `3 x 3` grid for unique paths, the top row and left column are all `1`, and interior cells become sums of top and left values.

#### Debugging Tip

Print the table row by row for a `3 x 3` example. Grid DP errors are usually visible immediately.

#### Advanced Note

Some grid problems add obstacles, diagonal moves, or state flags. The same modeling principles still apply.

### Concept Cluster: Item Choice and Capacity States
Key concepts in this block:
- 33.4 0/1 knapsack
- 33.5 Longest common subsequence

#### Intuition

These problems use two axes that represent two different kinds of progress.

#### Why It Matters

They show that two-dimensional DP is broader than literal grids. One axis can represent items, and the other can represent capacity, or one axis can represent a prefix of one string while the other axis represents a prefix of another.

#### How It Works

0/1 knapsack:

- `dp[item][capacity]` is the best value using the first `item` items within `capacity`

Longest common subsequence:

- `dp[i][j]` is the LCS length for the first `i` characters of one string and the first `j` characters of the other

#### Java Implementation Notes

- Use prefix lengths rather than last indices when string DP boundaries are easier that way.
- For knapsack, item-first indexing often simplifies base cases.
- Keep transition branches explicit instead of compressing them into clever one-liners.

#### Common Mistakes

- using the current item multiple times in 0/1 knapsack
- confusing subsequence with substring in LCS
- off-by-one errors when converting from characters to prefix lengths

#### Quick Example

If the last characters of two prefixes match in LCS, the state extends the diagonal cell by `1`.

#### Debugging Tip

Label rows and columns with their prefix lengths or characters. This makes transition direction easier to inspect.

#### Advanced Note

Knapsack and LCS are gateway problems for many more advanced two-dimensional state designs.

### Concept Cluster: Edit Operations on Two Strings
Key concepts in this block:
- 33.6 Edit distance

#### Intuition

Edit distance asks how many single-character changes are needed to transform one string into another.

#### Why It Matters

It is a classic example where each state compares prefixes and chooses among multiple operation types.

#### How It Works

Let `dp[i][j]` be the minimum edits to convert the first `i` characters of `first` into the first `j` characters of `second`.

Transitions consider:

- insert
- delete
- replace or match

#### Java Implementation Notes

- Initialize the first row and first column as increasing edit counts.
- If characters match, carry the diagonal value forward unchanged.
- Use `Math.min` carefully so the three operations stay readable.

#### Common Mistakes

- forgetting that matching characters cost `0`
- mixing source and target string roles in insert and delete reasoning
- not initializing the empty-prefix row and column correctly

#### Quick Example

Transforming `"cat"` to `"cut"` requires one replacement, so the answer is `1`.

#### Debugging Tip

Check a tiny example where both strings are empty or one string is empty. Most edit-distance bugs appear there first.

#### Advanced Note

Edit distance is closely related to LCS, but the state meaning and allowed operations are different.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Unique Paths
#### Problem Statement

Given `rows` and `cols`, return how many distinct paths exist from the top-left cell to the bottom-right cell if you may only move right or down.

#### Why This Example Matters

This is the cleanest two-dimensional DP problem. It teaches cell dependencies and boundary initialization.

#### Constraints or Assumptions

- `rows >= 1`
- `cols >= 1`
- no blocked cells

#### Brute-Force Approach

Recursively try moving right and down from each cell until the destination is reached.

That repeats many cells and grows exponentially.

#### Better Approach

Use a two-dimensional DP table.

#### Why the Better Approach Works

Every path to a cell must come from exactly one of two earlier cells: the one above or the one to the left.

#### Pragmatic Java Choice

Use a full `int[][]` table first for clarity.

#### Java Solution

```java
class UniquePathsDpExample {
    static int countPaths(int rows, int cols) {
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

#### Dry Run

Input: `rows = 3`, `cols = 3`

Table build:

- first row: `[1, 1, 1]`
- first column: `[1, 1, 1]`
- `dp[1][1] = 2`
- `dp[1][2] = 3`
- `dp[2][1] = 3`
- `dp[2][2] = 6`

Answer: `6`

#### Time and Space Complexity

Brute-force recursion:

- Time: exponential in `rows + cols`
- Space: `O(rows + cols)` recursion depth

DP table:

- Time: `O(rows * cols)`
- Space: `O(rows * cols)`

#### Edge Cases

- `1 x 1` grid
- one row only
- one column only

#### Common Mistakes

- forgetting to initialize the first row and column
- using subtraction or minimum instead of counting logic
- returning the wrong destination cell

### Worked Example 2: Minimum Path Sum
#### Problem Statement

Given a nonnegative integer grid, return the minimum path sum from top-left to bottom-right if you may only move right or down.

#### Why This Example Matters

This uses the same grid structure as unique paths, but the transition meaning changes from counting to minimizing.

#### Constraints or Assumptions

- grid values are nonnegative
- the starting cell cost is included
- right and down are the only moves

#### Brute-Force Approach

Explore both possible directions recursively from each cell and return the cheaper path.

That repeats many suffix paths.

#### Better Approach

Use grid DP for minimum cost accumulation.

#### Why the Better Approach Works

The cheapest way to reach a cell must come from the cheaper of its two incoming states.

#### Pragmatic Java Choice

Use a dedicated DP table instead of mutating the input grid.

#### Java Solution

```java
class MinimumPathSumDpExample {
    static int minimumPathSum(int[][] grid) {
        int rows = grid.length;
        int cols = grid[0].length;
        int[][] dp = new int[rows][cols];

        dp[0][0] = grid[0][0];

        for (int row = 1; row < rows; row++) {
            dp[row][0] = dp[row - 1][0] + grid[row][0];
        }
        for (int col = 1; col < cols; col++) {
            dp[0][col] = dp[0][col - 1] + grid[0][col];
        }

        for (int row = 1; row < rows; row++) {
            for (int col = 1; col < cols; col++) {
                dp[row][col] = grid[row][col] + Math.min(dp[row - 1][col], dp[row][col - 1]);
            }
        }

        return dp[rows - 1][cols - 1];
    }
}
```

#### Dry Run

Input:

```text
1 3 1
1 5 1
4 2 1
```

- `dp[0][0] = 1`
- first row becomes `[1, 4, 5]`
- first column becomes `[1, 2, 6]`
- `dp[1][1] = 5 + min(4, 2) = 7`
- `dp[1][2] = 1 + min(5, 7) = 6`
- `dp[2][1] = 2 + min(7, 6) = 8`
- `dp[2][2] = 1 + min(6, 8) = 7`

Answer: `7`

#### Time and Space Complexity

Brute-force recursion:

- Time: exponential in `rows + cols`
- Space: `O(rows + cols)` recursion depth

DP table:

- Time: `O(rows * cols)`
- Space: `O(rows * cols)`

#### Edge Cases

- single cell grid
- one row or one column
- large values that may approach integer limits

#### Common Mistakes

- forgetting to include the starting cell's cost
- mixing path count logic with path sum logic
- using uninitialized boundary states

### Worked Example 3: 0/1 Knapsack
#### Problem Statement

Given arrays `weights` and `values` and a maximum capacity, return the maximum total value that can fit in the knapsack when each item may be used at most once.

#### Why This Example Matters

This is the standard two-axis DP where one axis tracks items and the other tracks capacity.

#### Constraints or Assumptions

- `weights.length == values.length`
- each item may be taken at most once
- all weights are positive

#### Brute-Force Approach

For each item, recursively choose to include or exclude it.

That explores `2^n` subsets.

#### Better Approach

Use a DP table over item count and capacity.

#### Why the Better Approach Works

For each item and capacity, the best answer is either:

- skip the current item
- take the current item, if it fits, and add the best answer for the reduced capacity using earlier items only

#### Pragmatic Java Choice

Use a two-dimensional table first so the one-use constraint stays visually clear.

#### Java Solution

```java
class KnapsackDpExample {
    static int maxValue(int[] weights, int[] values, int capacity) {
        int itemCount = weights.length;
        int[][] dp = new int[itemCount + 1][capacity + 1];

        for (int item = 1; item <= itemCount; item++) {
            int weight = weights[item - 1];
            int value = values[item - 1];

            for (int currentCapacity = 0; currentCapacity <= capacity; currentCapacity++) {
                dp[item][currentCapacity] = dp[item - 1][currentCapacity];
                if (weight <= currentCapacity) {
                    int take = value + dp[item - 1][currentCapacity - weight];
                    dp[item][currentCapacity] = Math.max(dp[item][currentCapacity], take);
                }
            }
        }

        return dp[itemCount][capacity];
    }
}
```

#### Dry Run

Input:

- `weights = [1, 3, 4, 5]`
- `values = [1, 4, 5, 7]`
- `capacity = 7`

Key idea:

- after item `1`, small capacities can carry value `1`
- after item `3`, capacity `4` can reach value `5`
- after item `4`, capacity `7` can reach value `9`
- item `5` gives another option, but the best at capacity `7` remains `9`

Answer: `9`

#### Time and Space Complexity

Brute-force subset recursion:

- Time: `O(2^n)`
- Space: `O(n)` recursion depth

DP table:

- Time: `O(n * capacity)`
- Space: `O(n * capacity)`

#### Edge Cases

- capacity `0`
- no items
- all items heavier than the capacity

#### Common Mistakes

- using the current row instead of the previous row and accidentally allowing repeated item use
- confusing item index with prefix length
- skipping the zero-capacity base column

### Worked Example 4: Edit Distance
#### Problem Statement

Given two strings, return the minimum number of insertions, deletions, and replacements needed to transform the first string into the second.

#### Why This Example Matters

This is a classic two-string DP where each state must compare characters and choose among several operations.

#### Constraints or Assumptions

- all operations cost `1`
- exact character matches cost `0`
- empty prefixes must be handled explicitly

#### Brute-Force Approach

Recursively try insert, delete, and replace whenever characters differ.

That revisits the same prefix pairs many times.

#### Better Approach

Use a two-dimensional table over prefix lengths.

#### Why the Better Approach Works

Each state reduces one or both prefixes. Once smaller prefix pairs are solved, the current answer is the cheapest of the valid operations.

#### Pragmatic Java Choice

Use prefix lengths `i` and `j` so base cases are simple.

#### Java Solution

```java
class EditDistanceDpExample {
    static int editDistance(String first, String second) {
        int[][] dp = new int[first.length() + 1][second.length() + 1];

        for (int i = 0; i <= first.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= second.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= first.length(); i++) {
            for (int j = 1; j <= second.length(); j++) {
                if (first.charAt(i - 1) == second.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    int insert = dp[i][j - 1];
                    int delete = dp[i - 1][j];
                    int replace = dp[i - 1][j - 1];
                    dp[i][j] = 1 + Math.min(replace, Math.min(insert, delete));
                }
            }
        }

        return dp[first.length()][second.length()];
    }
}
```

#### Dry Run

Input: `first = "horse"`, `second = "ros"`

Key steps:

- converting an empty prefix to `"ros"` costs `3`
- matching `"o"` with `"o"` keeps the diagonal value
- mismatches choose among insert, delete, and replace

Final answer: `3`

One valid sequence is:

- replace `'h'` with `'r'`
- delete one `'r'`-misaligned character later in the prefix alignment
- delete `'e'`

#### Time and Space Complexity

Brute-force recursion:

- Time: exponential in the string lengths
- Space: `O(m + n)` recursion depth

DP table:

- Time: `O(m * n)`
- Space: `O(m * n)`

#### Edge Cases

- one or both strings empty
- identical strings
- completely different strings

#### Common Mistakes

- forgetting to initialize the first row and column
- charging cost `1` even when characters match
- mixing up insertion and deletion reasoning

## 4. Complexity and Decision Guide

Two-dimensional DP usually appears when a single index cannot describe enough progress.

- grid path problems usually cost `O(rows * cols)` because each cell depends on a constant number of neighbors
- 0/1 knapsack costs `O(n * capacity)` because each item-capacity pair is one state
- LCS and edit distance cost `O(m * n)` because every prefix pair is a state

When to choose brute force:

- for tiny grids or tiny strings when you are still discovering the recurrence
- when the full state space is extremely small

When to optimize:

- when repeated two-dimensional states appear in the recursion
- when constraints make exponential search impossible
- when only the previous row or previous column is needed and space can be reduced carefully

Recognition signals for two-dimensional DP:

- the problem naturally uses two progress variables
- the answer depends on combining two prefixes or one prefix plus one resource limit
- the state can be drawn as a table where earlier rows or columns feed later ones

Signals not to force this technique:

- the structure is really a graph shortest-path problem with arbitrary transitions
- a greedy sort or heap approach solves the problem more directly
- the second dimension is artificial and does not correspond to real remaining information

## 5. Edge Cases, Pitfalls, and Debugging

Common two-dimensional DP bugs:

- wrong state meaning for rows or columns
- first row and first column initialized incorrectly
- mismatching prefix lengths with character indices
- accidentally reusing an item multiple times in 0/1 knapsack
- updating cells in the wrong traversal order when dependencies are directional

Boundary risks:

- empty strings
- grids with one row or one column
- zero capacity in knapsack

Mutation and memory risks:

- compressing to one row too early and destroying needed previous-row data
- mutating the input grid when callers expect it to remain unchanged
- using a default value such as `0` when the real state should start as infinity or an impossible marker

Short debugging checklist:

- define both axes in one sentence each
- label what `dp[row][col]` means exactly
- verify the first row and first column on paper
- test the smallest nontrivial grid or shortest string pair
- only then attempt row compression or other space optimizations

## 6. Practice Problems

### Easy

**Title:** Unique Paths  
**Prompt:** Count paths in a grid when moves are only right or down.  
**Expected pattern or core idea:** Two-dimensional count DP on cells.

**Title:** Unique Paths with Obstacles  
**Prompt:** Count valid paths in a grid where blocked cells cannot be visited.  
**Expected pattern or core idea:** Grid DP with blocked-state handling.

**Title:** Minimum Path Sum  
**Prompt:** Return the minimum cost path from top-left to bottom-right in a grid.  
**Expected pattern or core idea:** Grid DP using minimum incoming cost.

### Medium

**Title:** 0/1 Knapsack  
**Prompt:** Maximize value without exceeding capacity when each item is used at most once.  
**Expected pattern or core idea:** Item-and-capacity state table.

**Title:** Longest Common Subsequence  
**Prompt:** Return the LCS length of two strings.  
**Expected pattern or core idea:** Prefix-pair DP on two strings.

**Title:** Edit Distance  
**Prompt:** Compute the minimum edits needed to transform one string into another.  
**Expected pattern or core idea:** Multi-operation two-string DP.

### Hard

**Title:** Distinct Subsequences  
**Prompt:** Count how many ways one string can form another as a subsequence.  
**Expected pattern or core idea:** Prefix-pair counting DP.

**Title:** Interleaving String  
**Prompt:** Decide whether a third string can be formed by interleaving two others.  
**Expected pattern or core idea:** Two-dimensional boolean DP over prefix lengths.

**Title:** Regular Expression Matching  
**Prompt:** Match a string against a pattern with `.` and `*`.  
**Expected pattern or core idea:** Careful state design over string and pattern prefixes.

## 7. Short Recap

The core idea is to model states with two progress variables and fill a table in dependency order. The most important optimization insight is that many two-dimensional problems become straightforward once the axes and cell meaning are written down clearly. The most important implementation warning is to get boundary initialization right before trusting any interior cell. This prepares the next chapter, where DP expands to trees, subsets, digit constraints, and harder state-recognition tasks.

## 8. Coverage Check

- 33.1 Grid dynamic programming - Covered
- 33.2 Unique paths - Covered
- 33.3 Minimum path sum - Covered
- 33.4 0/1 knapsack - Covered
- 33.5 Longest common subsequence - Covered
- 33.6 Edit distance - Covered

Coverage Summary: 6/6 official subtopics covered

Next: Advanced Dynamic Programming
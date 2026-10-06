# 29: Backtracking

**Goal:** Teach how to explore a decision tree systematically, build partial solutions, prune impossible branches, and undo choices cleanly in Java.
**Outcome:** By the end of this chapter, you can model a search space, write reusable backtracking templates, and solve subsets, permutations, combination sum, N-Queens, and Sudoku-style problems with correct pruning.

---

## 1. Intuition First

This chapter matters because some problems do not have a safe greedy move and do not fit a direct formula. Instead, you must try choices, detect failure early, and back out cleanly.

A simple real-world analogy is filling a schedule or puzzle one decision at a time:

- place one item
- check whether the partial state is still legal
- continue if it is
- undo and try a different choice if it is not

The core mental model is a decision tree:

- each node is a partial solution
- each edge is one next choice
- a base case records a full valid solution
- pruning cuts off a branch before it wastes more work

The most common beginner confusion point is mixing backtracking with plain brute force. Backtracking is still exhaustive in the worst case, but it avoids exploring obviously invalid partial states. It is organized search, not blind search.

This chapter continues the Part VI shift into state design. Greedy asked, "What local choice is safe?" Backtracking asks, "What state do I need to represent a partial solution, and when can I stop exploring this branch?"

## 2. Core Concepts and Techniques

### Concept Cluster: Search Space and Decision Trees
Key concepts in this block:
- 29.1 Search space and decision trees

#### Intuition

Backtracking is DFS over a space of possible decisions.

#### Why It Matters

If you cannot describe the search tree, you cannot write the recursion cleanly.

#### How It Works

A backtracking function usually answers:

- what choices are available now
- how to apply one choice
- how to undo it
- when a partial state is invalid
- when a full solution is complete

#### Java Implementation Notes

- Pass mutable `List` or board state plus a result container.
- Undo mutations immediately after the recursive call.
- Keep the recursive signature small and explicit.

#### Common Mistakes

- forgetting to undo a choice
- storing the same mutable list reference in the result
- not defining the base case precisely

#### Quick Example

In a subset problem, every index gives two branches: include or exclude.

#### Debugging Tip

Print the recursion depth, current path, and next index. That usually exposes state leaks.

#### Advanced Note

Pruning quality often matters more than the bare recursion template.

### Concept Cluster: Subsets
Key concepts in this block:
- 29.2 Subsets

#### Intuition

For each element, decide whether it is in the subset.

#### Why It Matters

This is the simplest backtracking pattern and the cleanest entry point for recursion trees.

#### How It Works

At index `i`, branch into:

- do not take `values[i]`
- take `values[i]`

When `i == n`, record the current subset.

#### Java Implementation Notes

- Use one `List<Integer> current`.
- Add before the recursive call and remove after it.
- Copy the list when storing a solution.

#### Common Mistakes

- forgetting to copy the current subset
- mixing subset order with permutation order
- stopping too early

#### Quick Example

For `[1, 2]`, the subsets are `[]`, `[2]`, `[1]`, `[1, 2]`.

#### Debugging Tip

If subsets repeat, check whether the same list object is being reused in the result.

#### Advanced Note

Bitmask iteration is another way to generate subsets, but backtracking generalizes better when constraints appear.

### Concept Cluster: Permutations
Key concepts in this block:
- 29.3 Permutations

#### Intuition

A permutation chooses the next unused element at every depth.

#### Why It Matters

This introduces "used versus unused" state and order-sensitive search.

#### How It Works

At depth `d`, try every element not yet used, append it to the path, recurse, then undo.

#### Java Implementation Notes

- Use `boolean[] used`.
- The permutation is complete when `path.size() == values.length`.
- For duplicate elements, extra deduplication logic is needed.

#### Common Mistakes

- forgetting to reset `used[i]`
- assuming subset logic also handles order
- not handling duplicates separately

#### Quick Example

For `[1, 2, 3]`, the first layer has three branches: start with `1`, `2`, or `3`.

#### Debugging Tip

Print `used[]` alongside the current path. Permutation bugs are usually state-reset bugs.

#### Advanced Note

Many ordering problems reduce to permutation search plus pruning.

### Concept Cluster: Combination Sum
Key concepts in this block:
- 29.4 Combination sum

#### Intuition

Choose numbers that build toward a target while pruning branches that already overshoot.

#### Why It Matters

This is the standard "search with constraints" pattern where pruning meaningfully reduces the tree.

#### How It Works

Sort the candidates, keep a remaining target, and recurse with either:

- the same index again if reuse is allowed
- the next index if reuse is not allowed

Stop when the remaining target becomes `0` or negative.

#### Java Implementation Notes

- Sorting enables early break pruning.
- Pass the current start index to control reuse.
- Keep the remaining target instead of recomputing sums.

#### Common Mistakes

- not sorting before pruning
- using the wrong next index for reuse versus no-reuse versions
- continuing after the target already became negative

#### Quick Example

For candidates `[2, 3, 6, 7]` and target `7`, the valid combinations are `[2, 2, 3]` and `[7]`.

#### Debugging Tip

Log `(startIndex, remainingTarget, path)` before branching. That makes pruning decisions easy to inspect.

#### Advanced Note

This family often branches into subset sum, partitioning, and k-combination variants.

### Concept Cluster: N-Queens
Key concepts in this block:
- 29.5 N-Queens

#### Intuition

Place one queen per row and rule out attacked columns and diagonals.

#### Why It Matters

It is the classic board backtracking problem and teaches how to encode constraints for fast pruning.

#### How It Works

At row `r`, try each column `c` that is not already blocked by:

- another queen in column `c`
- a queen on the main diagonal
- a queen on the anti-diagonal

#### Java Implementation Notes

- Use boolean arrays for columns and diagonals.
- Row-by-row placement avoids checking every board cell.
- Build string rows only when a full solution is found.

#### Common Mistakes

- wrong diagonal indexing
- forgetting to undo diagonal marks
- placing more than one queen per row

#### Quick Example

On a `4 x 4` board, placing a queen at `(0, 1)` blocks column `1`, diagonal `row - col = -1`, and anti-diagonal `row + col = 1`.

#### Debugging Tip

Print the row and chosen column each time you place a queen. Diagonal index bugs show up fast.

#### Advanced Note

N-Queens is a strong example of pruning transforming an impossible full-board search into a manageable row-based search.

### Concept Cluster: Sudoku Solver
Key concepts in this block:
- 29.6 Sudoku solver

#### Intuition

Fill one empty cell at a time, but only with digits consistent with the row, column, and box constraints.

#### Why It Matters

Sudoku combines backtracking with tight constraint propagation and shows how strong pruning makes search practical.

#### How It Works

Precompute which digits are already used in each row, column, and `3 x 3` box. For each empty cell, try only legal digits, recurse, and undo.

#### Java Implementation Notes

- Use `boolean[9][10]` for row, column, and box usage.
- Collect empty cells first.
- Backtrack as soon as one full valid board is found if only one solution is needed.

#### Common Mistakes

- using the wrong box index
- forgetting to clear row, column, or box state on undo
- validating the whole board repeatedly instead of maintaining constraint state

#### Quick Example

For cell `(4, 7)`, the box index is `(4 / 3) * 3 + (7 / 3) = 5`.

#### Debugging Tip

If the solver gets stuck too early, print the legal digits for the first few empty cells.

#### Advanced Note

Sudoku is a preview of constraint-satisfaction thinking more than a pure brute-force problem.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Generate All Permutations of Distinct Integers
#### Problem Statement

Given an array of distinct integers, return all permutations.

#### Why This Example Matters

This is the standard order-sensitive backtracking template. It teaches how to represent "already used" choices.

#### Constraints or Assumptions

- all values are distinct
- order matters
- every permutation should appear exactly once

#### Brute-Force Approach

Generate every length-`n` sequence by choosing any value at each position, then filter out sequences that reuse the same value.

That creates `n^n` sequences before filtering, which is far too wasteful.

#### Better Approach

Build the permutation one position at a time and only choose unused elements.

#### Why the Better Approach Works

A partial permutation is valid exactly when no value is repeated. By enforcing that rule during construction, the search explores only legal prefixes.

#### Pragmatic Java Choice

Use:

- `boolean[] used`
- a mutable `List<Integer> path`
- a result list of copied paths

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class PermutationsBacktrackingExample {
    static List<List<Integer>> permute(int[] values) {
        List<List<Integer>> result = new ArrayList<>();
        boolean[] used = new boolean[values.length];
        backtrack(values, used, new ArrayList<>(), result);
        return result;
    }

    private static void backtrack(int[] values, boolean[] used, List<Integer> path, List<List<Integer>> result) {
        if (path.size() == values.length) {
            result.add(new ArrayList<>(path));
            return;
        }

        for (int i = 0; i < values.length; i++) {
            if (used[i]) {
                continue;
            }

            used[i] = true;
            path.add(values[i]);
            backtrack(values, used, path, result);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}
```

#### Dry Run

Input: `[1, 2, 3]`

Tree start:

- choose `1`, then explore `[1, 2, 3]` and `[1, 3, 2]`
- choose `2`, then explore `[2, 1, 3]` and `[2, 3, 1]`
- choose `3`, then explore `[3, 1, 2]` and `[3, 2, 1]`

#### Time and Space Complexity

Brute force:

- Time: `O(n^n)`
- Space: sequence generation dependent

Backtracking:

- Time: `O(n * n!)`
- Space: `O(n)` recursion depth plus output storage

#### Edge Cases

- empty array
- single element
- duplicate values, which need extra handling not shown here
- large `n`, where output size dominates everything

#### Common Mistakes

- not resetting `used[i]`
- forgetting to copy `path`
- confusing permutation logic with subset logic

### Worked Example 2: Combination Sum
#### Problem Statement

Given distinct candidate numbers and a target, return all unique combinations where the chosen numbers sum to the target. You may reuse the same candidate multiple times.

#### Why This Example Matters

This is the classic pruning example. It shows how sorting and remaining-target logic shrink the search tree.

#### Constraints or Assumptions

- candidates are positive
- reuse is allowed
- output order does not matter

#### Brute-Force Approach

Enumerate every sequence of candidate picks up to some length bound, compute its sum, and filter the ones that equal the target.

That explores many paths that already overshoot the target or differ only by useless ordering.

#### Better Approach

Sort the candidates and backtrack with:

- `startIndex`
- `remainingTarget`
- early break when the candidate is too large

#### Why the Better Approach Works

All choices keep the partial sum valid. Sorting means once one candidate is too large, all later ones are too large too, so the whole suffix can be pruned.

#### Pragmatic Java Choice

Use:

- `Arrays.sort`
- one mutable `path`
- recursion that passes the current index again to allow reuse

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class CombinationSumBacktrackingExample {
    static List<List<Integer>> combinationSum(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> result = new ArrayList<>();
        backtrack(candidates, target, 0, new ArrayList<>(), result);
        return result;
    }

    private static void backtrack(
            int[] candidates,
            int remainingTarget,
            int startIndex,
            List<Integer> path,
            List<List<Integer>> result) {
        if (remainingTarget == 0) {
            result.add(new ArrayList<>(path));
            return;
        }

        for (int i = startIndex; i < candidates.length; i++) {
            int candidate = candidates[i];
            if (candidate > remainingTarget) {
                break;
            }

            path.add(candidate);
            backtrack(candidates, remainingTarget - candidate, i, path, result);
            path.remove(path.size() - 1);
        }
    }
}
```

#### Dry Run

Candidates: `[2, 3, 6, 7]`, target `7`

Search starts:

- take `2` -> remaining `5`
- take another `2` -> remaining `3`
- take `3` -> remaining `0`, record `[2, 2, 3]`
- backtrack and try `7` directly -> record `[7]`

Branches involving `6` after remaining `5` are cut immediately.

#### Time and Space Complexity

Brute force:

- Time: exponential with large constant waste
- Space: recursion and output dependent

Backtracking with pruning:

- Time: still exponential in the worst case
- Space: `O(target / minCandidate)` recursion depth plus output storage

#### Edge Cases

- target `0`
- no valid combination
- one candidate larger than target
- many combinations causing large output

#### Common Mistakes

- forgetting to sort before pruning
- using `i + 1` and accidentally disallowing reuse
- not breaking once the sorted candidate is too large

### Worked Example 3: N-Queens
#### Problem Statement

Given `n`, return all valid ways to place `n` queens on an `n x n` chessboard so that no two queens attack each other.

#### Why This Example Matters

This is the classic structured board-search problem. The main lesson is that good constraint encoding matters.

#### Constraints or Assumptions

- one queen per row
- no two queens share a column
- no two queens share a diagonal

#### Brute-Force Approach

Choose any `n` cells from the `n^2` board and test whether those cells form a valid configuration.

That is much too large and ignores obvious structure.

#### Better Approach

Place one queen per row and maintain blocked columns and diagonals.

#### Why the Better Approach Works

Each recursive level represents one row, so the search never creates illegal states with multiple queens in one row. Columns and diagonals let the algorithm reject invalid positions immediately.

#### Pragmatic Java Choice

Use:

- a mutable `char[][] board`
- `boolean[] columns`
- `boolean[] diagonalDown` for `row + col`
- `boolean[] diagonalUp` for `row - col + n`

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class NQueensBacktrackingExample {
    static List<List<String>> solveNQueens(int size) {
        char[][] board = new char[size][size];
        for (char[] row : board) {
            Arrays.fill(row, '.');
        }

        boolean[] columns = new boolean[size];
        boolean[] diagonalDown = new boolean[2 * size];
        boolean[] diagonalUp = new boolean[2 * size];
        List<List<String>> result = new ArrayList<>();

        backtrack(0, size, board, columns, diagonalDown, diagonalUp, result);
        return result;
    }

    private static void backtrack(
            int row,
            int size,
            char[][] board,
            boolean[] columns,
            boolean[] diagonalDown,
            boolean[] diagonalUp,
            List<List<String>> result) {
        if (row == size) {
            List<String> solution = new ArrayList<>();
            for (char[] boardRow : board) {
                solution.add(new String(boardRow));
            }
            result.add(solution);
            return;
        }

        for (int col = 0; col < size; col++) {
            int downIndex = row + col;
            int upIndex = row - col + size;
            if (columns[col] || diagonalDown[downIndex] || diagonalUp[upIndex]) {
                continue;
            }

            columns[col] = true;
            diagonalDown[downIndex] = true;
            diagonalUp[upIndex] = true;
            board[row][col] = 'Q';

            backtrack(row + 1, size, board, columns, diagonalDown, diagonalUp, result);

            board[row][col] = '.';
            diagonalUp[upIndex] = false;
            diagonalDown[downIndex] = false;
            columns[col] = false;
        }
    }
}
```

#### Dry Run

For `n = 4`:

- row `0`: try column `1`
- row `1`: safe choice becomes column `3`
- row `2`: safe choice becomes column `0`
- row `3`: safe choice becomes column `2`

That gives one solution:

- `.Q..`
- `...Q`
- `Q...`
- `..Q.`

#### Time and Space Complexity

Brute force:

- Time: combinatorial over board-cell subsets
- Space: board-check dependent

Backtracking with pruning:

- Time: exponential in the worst case
- Space: `O(n)` recursion depth plus output storage

#### Edge Cases

- `n = 1`
- `n = 2` and `n = 3`, which have no solutions
- large `n`, where output can be huge
- diagonal-index mistakes

#### Common Mistakes

- wrong diagonal formulas
- not undoing column or diagonal marks
- scanning the entire board to validate every move instead of maintaining state

### Worked Example 4: Sudoku Solver
#### Problem Statement

Given a partially filled `9 x 9` Sudoku board, fill it in place so every row, column, and `3 x 3` box contains digits `1` through `9`.

#### Why This Example Matters

This is the most constraint-heavy example in the chapter. It shows how maintaining legality state turns blind search into practical backtracking.

#### Constraints or Assumptions

- the input board is valid so far
- empty cells contain `'.'`
- one valid solution is enough

#### Brute-Force Approach

Fill every empty cell with digits `1` through `9` in every possible way, then validate the full board at the end.

That explores `9^k` assignments for `k` empty cells and wastes work on clearly invalid partial states.

#### Better Approach

Track used digits in rows, columns, and boxes, and only try legal digits for each empty cell.

#### Why the Better Approach Works

Every recursive step preserves Sudoku constraints, so the search never descends into a branch that is already impossible.

#### Pragmatic Java Choice

Use:

- `boolean[9][10]` for row, column, and box usage
- a list of empty cell positions
- recursion that stops when one complete board is found

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class SudokuSolverBacktrackingExample {
    static void solveSudoku(char[][] board) {
        boolean[][] rowUsed = new boolean[9][10];
        boolean[][] columnUsed = new boolean[9][10];
        boolean[][] boxUsed = new boolean[9][10];
        List<int[]> emptyCells = new ArrayList<>();

        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                char cell = board[row][col];
                if (cell == '.') {
                    emptyCells.add(new int[]{row, col});
                } else {
                    int digit = cell - '0';
                    int box = boxIndex(row, col);
                    rowUsed[row][digit] = true;
                    columnUsed[col][digit] = true;
                    boxUsed[box][digit] = true;
                }
            }
        }

        backtrack(0, emptyCells, board, rowUsed, columnUsed, boxUsed);
    }

    private static boolean backtrack(
            int index,
            List<int[]> emptyCells,
            char[][] board,
            boolean[][] rowUsed,
            boolean[][] columnUsed,
            boolean[][] boxUsed) {
        if (index == emptyCells.size()) {
            return true;
        }

        int row = emptyCells.get(index)[0];
        int col = emptyCells.get(index)[1];
        int box = boxIndex(row, col);

        for (int digit = 1; digit <= 9; digit++) {
            if (rowUsed[row][digit] || columnUsed[col][digit] || boxUsed[box][digit]) {
                continue;
            }

            board[row][col] = (char) ('0' + digit);
            rowUsed[row][digit] = true;
            columnUsed[col][digit] = true;
            boxUsed[box][digit] = true;

            if (backtrack(index + 1, emptyCells, board, rowUsed, columnUsed, boxUsed)) {
                return true;
            }

            board[row][col] = '.';
            rowUsed[row][digit] = false;
            columnUsed[col][digit] = false;
            boxUsed[box][digit] = false;
        }

        return false;
    }

    private static int boxIndex(int row, int col) {
        return (row / 3) * 3 + (col / 3);
    }
}
```

#### Dry Run

Suppose the first empty cell is `(0, 2)`:

- digits already used in row `0`, column `2`, and box `0` remove most options
- only legal digits are tried
- after placing one digit, the solver moves to the next empty cell
- if a later contradiction appears, it undoes the digit and tries the next one

#### Time and Space Complexity

Brute force:

- Time: `O(9^k)` for `k` empty cells
- Space: recursion depth `O(k)`

Backtracking with constraint tables:

- Time: still exponential in the worst case, but much faster in practice due to pruning
- Space: `O(k)` recursion depth plus fixed Sudoku state

#### Edge Cases

- already solved board
- board with very few clues
- invalid board state if input guarantees are not respected
- many empty cells causing deep recursion

#### Common Mistakes

- wrong box index
- forgetting to undo row, column, or box marks
- revalidating the full board on every step instead of maintaining state

## 4. Complexity and Decision Guide

Main trade-offs in this chapter:

- subsets: `O(2^n)`
- permutations: `O(n * n!)`
- combination-style searches: exponential in the worst case
- N-Queens and Sudoku: exponential search with strong pruning benefits

When to choose backtracking:

- you must construct actual solutions, not just count with a closed formula
- partial solutions can be checked for validity early
- the problem naturally forms a choice tree

Recognition signals:

- "generate all valid configurations"
- "try choices until one works"
- "place items under constraints"
- "search all combinations or arrangements with pruning"

Signals not to force this technique:

- if the problem has a safe greedy rule, greedy is better
- if the same subproblem repeats heavily, dynamic programming may be better
- if the state is just graph reachability or shortest path, standard graph algorithms are usually better

A practical rule:

- backtracking is the right tool when the search tree is unavoidable but can be pruned intelligently

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- forgetting to undo mutations
- storing a mutable path without copying it
- weak pruning that allows obviously impossible branches
- wrong base case or stop condition
- mixing reuse and no-reuse logic in combination problems

Boundary handling:

- empty input often has one valid trivial configuration
- duplicates need extra care in subset and permutation problems
- constraint tables must stay consistent after every undo
- recursion depth can become large on big search spaces

Short debugging checklist:

- print the current path or board before and after each recursive call
- verify every mutation has a matching undo
- verify the base case exactly matches a complete solution
- verify pruning conditions are correct and not too aggressive
- test the smallest nontrivial input first
- for boards, print row, column, and diagonal or box state explicitly

## 6. Practice Problems

### Easy

- Title: Subsets. One-line prompt: return every subset of a list of distinct integers. Expected pattern or core idea: include-or-exclude backtracking.
- Title: Letter Combinations of a Phone Number. One-line prompt: generate all strings formed from digit-to-letter mappings. Expected pattern or core idea: decision tree over choices per position.
- Title: Combination Sum. One-line prompt: return all combinations that add to a target with reuse allowed. Expected pattern or core idea: backtracking with pruning on remaining target.

### Medium

- Title: Permutations. One-line prompt: return every ordering of distinct integers. Expected pattern or core idea: used-array backtracking.
- Title: Palindrome Partitioning. One-line prompt: split a string into all partitions where every piece is a palindrome. Expected pattern or core idea: backtracking over cut positions plus validity checks.
- Title: Generate Parentheses. One-line prompt: generate all valid parenthesis strings of length `2n`. Expected pattern or core idea: constrained backtracking with state counts.

### Hard

- Title: N-Queens. One-line prompt: return all valid queen placements on an `n x n` board. Expected pattern or core idea: row-by-row backtracking with column and diagonal constraints.
- Title: Sudoku Solver. One-line prompt: fill a partially completed Sudoku board. Expected pattern or core idea: constraint-backed backtracking.
- Title: Expression Add Operators. One-line prompt: insert operators into a digit string to hit a target value. Expected pattern or core idea: backtracking with rolling expression state.

## 7. Short Recap

The core idea of this chapter is that backtracking explores a decision tree while rejecting invalid partial states as early as possible.

The most important optimization insight is that pruning and good state representation matter more than the raw recursion template.

The most important implementation warning is to undo every mutation exactly once.

This chapter prepares the next chapter by shifting from search-tree reasoning to split-solve-combine reasoning in divide and conquer.

## 8. Coverage Check

- [x] 29.1 Search space and decision trees
- [x] 29.2 Subsets
- [x] 29.3 Permutations
- [x] 29.4 Combination sum
- [x] 29.5 N-Queens
- [x] 29.6 Sudoku solver

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 30: Divide and Conquer
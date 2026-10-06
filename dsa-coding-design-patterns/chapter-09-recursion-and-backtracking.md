# 9: Recursion and Backtracking

## Introduction and Context

Recursion is the bridge from sequential loops to thinking in smaller, self-similar subproblems. Backtracking extends that idea: explore a decision tree, test partial solutions, undo choices that fail, and report complete valid solutions.

Many problems do not fit a greedy approach or a direct formula. Instead, you must try possible choices, detect failure early, and back out cleanly. Without backtracking, you resort to brute-force enumeration. With it, you prune the search tree aggressively and solve problems that would otherwise time out.

This chapter teaches the mental models and implementation patterns. The central insight is that backtracking is organized exhaustive search with intelligent pruning. Base cases, invariants, and undo logic matter as much as the recursive structure itself.

## Core Intuition and Mechanics

Imagine a maze. You enter a corridor, leave a marker, try all doors ahead. If you hit a dead end, erase your work and back up. If you find the exit, record it. That is backtracking.

The key mental model is a decision tree:
- Each node represents a partial solution state.
- Each branch is one next choice.
- A leaf is either a complete solution or a dead end.
- Pruning cuts off branches before they waste time.

Backtracking works by:
1. Choosing a position in the search space.
2. Making one choice and updating state.
3. Recursing to extend the solution.
4. Undoing the choice (undo must be exact).
5. Trying the next choice.

The undo step is critical. If you forget to undo, state persists across branches and you get wrong results or confusing bugs.

## Core Concepts and Subtopics

### Concept Cluster: Recursion Foundations and Backtracking Basics

**Topics in this cluster:**
- 9.1 Base case and recursive case design, Understanding the call stack, Tail recursion
- 9.2 Recursion Tree Pattern, Pruning, rollback, and search-tree visualization
- 9.3 Backtracking basics, Search space and decision trees

#### Definition

A recursive function solves a problem by calling itself on smaller inputs. A base case stops the recursion. The recursive case moves toward that base case. Backtracking adds explicit choice exploration and rollback.

#### Why It Matters

Recursion naturally models problems with recursive structure: tree traversal, divide-and-conquer, and exhaustive search. Backtracking organizes the search so you do not explore clearly invalid branches.

#### How Recursion Works

```java
// Base case: n == 0
// Recursive case: solve(n-1) first, then use that result
static int factorial(int n) {
    if (n <= 1) return 1;           // base case
    return n * factorial(n - 1);    // recursive case
}
```

#### How Backtracking Works

```java
static void permute(int[] arr, int start, List<List<Integer>> results) {
    if (start == arr.length) {
        // Base case: full permutation found
        results.add(toList(arr));
        return;
    }
    
    for (int i = start; i < arr.length; i++) {
        // Choose
        swap(arr, start, i);
        // Explore
        permute(arr, start + 1, results);
        // Undo
        swap(arr, start, i);
    }
}
```

#### Clean Code Rules

- **State the base case first.** It is the exit rule.
- **State what the recursive case assumes.** If the subproblem shrinks, what shrinks?
- **Undo immediately after recursion.** Do not delay cleanup.
- **Use descriptive variable names.** `start`, `index`, `choices` are clearer than `i`, `j`.

#### Common Mistakes

- Forgetting the base case or making it wrong.
- Recursive call does not shrink the problem.
- State leaks across branches because undo was forgotten or incomplete.
- Off-by-one in base case boundary.

---

### Concept Cluster: Subsets, Permutations, and Combination Sum

**Topics in this cluster:**
- 9.4 Subsets, Permutations, Combination sum

#### Definition

**Subsets**: generate all 2^n subsets of an array.
**Permutations**: generate all n! orderings.
**Combination Sum**: find all unique combinations of elements that sum to a target.

#### Why It Matters

These are the canonical backtracking problems. Once you see the pattern, many variations become straightforward.

#### Subsets

```java
static void subsets(int[] nums, int idx, List<Integer> current, List<List<Integer>> results) {
    if (idx == nums.length) {
        results.add(new ArrayList<>(current));
        return;
    }
    
    // Include nums[idx]
    current.add(nums[idx]);
    subsets(nums, idx + 1, current, results);
    current.remove(current.size() - 1);
    
    // Exclude nums[idx]
    subsets(nums, idx + 1, current, results);
}
```

#### Permutations

```java
static void permutations(int[] nums, List<Integer> current, boolean[] used, List<List<Integer>> results) {
    if (current.size() == nums.length) {
        results.add(new ArrayList<>(current));
        return;
    }
    
    for (int i = 0; i < nums.length; i++) {
        if (!used[i]) {
            used[i] = true;
            current.add(nums[i]);
            permutations(nums, current, used, results);
            current.remove(current.size() - 1);
            used[i] = false;
        }
    }
}
```

#### Combination Sum

```java
static void combinationSum(int[] candidates, int target, int start, List<Integer> current, List<List<Integer>> results) {
    if (target == 0) {
        results.add(new ArrayList<>(current));
        return;
    }
    if (target < 0) return;
    
    for (int i = start; i < candidates.length; i++) {
        current.add(candidates[i]);
        combinationSum(candidates, target - candidates[i], i, current, results);
        current.remove(current.size() - 1);
    }
}
```

#### Common Mistakes

- Not passing `start` to avoid duplicate combinations.
- Forgetting to remove from `current` after recursion.
- Handling negative remainders incorrectly in Combination Sum.

---

### Concept Cluster: N-Queens and Sudoku Solver

**Topics in this cluster:**
- 9.5 N-Queens, Sudoku solver

#### Definition

**N-Queens**: place N queens on an N×N board such that no two queens attack each other.
**Sudoku**: fill a 9×9 grid with digits 1–9 such that each row, column, and 3×3 box has each digit exactly once.

#### Why It Matters

These are classic backtracking problems that teach constraint validation and efficient pruning.

#### N-Queens Sketch

```java
static void solveNQueens(int n, int row, List<String> current, Set<Integer> cols, Set<Integer> diag1, Set<Integer> diag2, List<List<String>> results) {
    if (row == n) {
        results.add(new ArrayList<>(current));
        return;
    }
    
    for (int col = 0; col < n; col++) {
        if (!cols.contains(col) && !diag1.contains(row - col) && !diag2.contains(row + col)) {
            cols.add(col);
            diag1.add(row - col);
            diag2.add(row + col);
            
            // Place queen at (row, col)
            current.add(buildRow(col, n));
            solveNQueens(n, row + 1, current, cols, diag1, diag2, results);
            current.remove(current.size() - 1);
            
            cols.remove(col);
            diag1.remove(row - col);
            diag2.remove(row + col);
        }
    }
}
```

#### Sudoku Sketch

```java
static boolean solveSudoku(char[][] board, int row, int col) {
    if (row == 9) return true;
    
    int nextRow = (col == 8) ? row + 1 : row;
    int nextCol = (col == 8) ? 0 : col + 1;
    
    if (board[row][col] != '.') {
        return solveSudoku(board, nextRow, nextCol);
    }
    
    for (char digit = '1'; digit <= '9'; digit++) {
        if (isValid(board, row, col, digit)) {
            board[row][col] = digit;
            if (solveSudoku(board, nextRow, nextCol)) return true;
            board[row][col] = '.';
        }
    }
    
    return false;
}
```

#### Pruning Strategy

Both problems use early constraint checking: only explore branches that satisfy board rules.

---

### Concept Cluster: Memoization and Recursion to Iteration

**Topics in this cluster:**
- 9.6 Memoization basics, Converting recursion to iteration

#### Definition

Memoization caches subproblem results to avoid recomputation. Converting recursion to iteration uses explicit stacks to replace call stacks.

#### Why It Matters

Memoization prevents exponential blowup in recursive code with overlapping subproblems. Iteration avoids stack overflow on deep recursion.

#### Memoization Example

```java
static int fib(int n, Map<Integer, Integer> memo) {
    if (n <= 1) return n;
    if (memo.containsKey(n)) return memo.get(n);
    
    int result = fib(n - 1, memo) + fib(n - 2, memo);
    memo.put(n, result);
    return result;
}
```

#### Iterative Conversion

```java
static int fibIterative(int n) {
    if (n <= 1) return n;
    
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}
```

---

## Worked Examples

### Worked Example 1: Generate All Subsets (Power Set)

**Problem**: Given array [1, 2, 3], return all subsets.

**Solution**: Backtrack on include/exclude choice for each element.

```java
public static List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> results = new ArrayList<>();
    subsets(nums, 0, new ArrayList<>(), results);
    return results;
}

private static void subsets(int[] nums, int idx, List<Integer> current, List<List<Integer>> results) {
    if (idx == nums.length) {
        results.add(new ArrayList<>(current));
        return;
    }
    
    current.add(nums[idx]);
    subsets(nums, idx + 1, current, results);
    current.remove(current.size() - 1);
    
    subsets(nums, idx + 1, current, results);
}
```

---

### Worked Example 2: Combination Sum (Unique Combinations)

**Problem**: Find all unique combinations from [2, 3, 6, 7] that sum to 7.

**Solution**: Backtrack with start index to avoid duplicates; prune when sum exceeds target.

```java
public static List<List<Integer>> combinationSum(int[] candidates, int target) {
    List<List<Integer>> results = new ArrayList<>();
    Arrays.sort(candidates);
    combinationSum(candidates, target, 0, new ArrayList<>(), results);
    return results;
}

private static void combinationSum(int[] candidates, int remaining, int start, List<Integer> current, List<List<Integer>> results) {
    if (remaining == 0) {
        results.add(new ArrayList<>(current));
        return;
    }
    
    for (int i = start; i < candidates.length && candidates[i] <= remaining; i++) {
        current.add(candidates[i]);
        combinationSum(candidates, remaining - candidates[i], i, current, results);
        current.remove(current.size() - 1);
    }
}
```

---

### Worked Example 3: N-Queens Board Configuration

**Problem**: Place 4 queens on a 4×4 board with no conflicts.

**Solution**: Backtrack row by row; maintain columns and diagonals as constraints.

```java
public static List<List<String>> solveNQueens(int n) {
    List<List<String>> results = new ArrayList<>();
    solveNQueens(n, 0, new HashSet<>(), new HashSet<>(), new HashSet<>(), new ArrayList<>(), results);
    return results;
}

private static void solveNQueens(int n, int row, Set<Integer> cols, Set<Integer> diag1, Set<Integer> diag2,
                                 List<String> current, List<List<String>> results) {
    if (row == n) {
        results.add(new ArrayList<>(current));
        return;
    }
    
    for (int col = 0; col < n; col++) {
        if (!cols.contains(col) && !diag1.contains(row - col) && !diag2.contains(row + col)) {
            cols.add(col);
            diag1.add(row - col);
            diag2.add(row + col);
            current.add(buildRow(col, n));
            
            solveNQueens(n, row + 1, cols, diag1, diag2, current, results);
            
            current.remove(current.size() - 1);
            cols.remove(col);
            diag1.remove(row - col);
            diag2.remove(row + col);
        }
    }
}

private static String buildRow(int queenCol, int n) {
    char[] row = new char[n];
    Arrays.fill(row, '.');
    row[queenCol] = 'Q';
    return new String(row);
}
```

---

## Solved Problems

**Problem 1 (Easy)**: Generate all permutations of [1, 2, 3].

**Problem 2 (Easy)**: Check if a number is "happy" (digit-square sequence reaches 1).

**Problem 3 (Medium)**: Find all unique combinations of a sorted array that sum to a target (allow reuse).

**Problem 4 (Medium)**: Solve Sudoku given a 9×9 grid.

**Problem 5 (Hard)**: Solve N-Queens for arbitrary N and return all board configurations.

---

## Recognition Guide

Use recursion and backtracking when:
- The problem has a recursive structure (subproblems are smaller versions).
- You need to explore many possible states or choices.
- Early pruning can eliminate whole branches.

Avoid when:
- The problem has no recursive structure (use iteration).
- Memoization is not applicable and deep recursion risks stack overflow.

---

## Comparison Tables

| Technique | Best Fit | Core State | Main Risk |
|---|---|---|---|
| Plain recursion | Self-similar decomposition | Parameters and call stack | Missing or wrong base case |
| Backtracking | Search over choices | Partial solution plus rollback | State leaks between branches |
| Memoization | Overlapping subproblems | Cache keyed by state | Wrong state encoding |
| Iterative simulation | Deep recursion or explicit traversal | Manual stack/queue | More bookkeeping code |

---

## Design and Decision Making

Before coding, sketch the decision tree and the base case. Define what state must be maintained and what must be undone. Use memoization if subproblems overlap. Prefer iteration if the recursion depth is unbounded.

---

## Practical Applications

- File system crawlers, expression evaluators, and dependency walkers all use recursion because their inputs are naturally tree-shaped.
- Constraint solvers, route planners, and puzzle engines use backtracking with pruning to avoid exploring impossible states.
- Dynamic-programming implementations often start as recursive formulations with memoization before being flattened into iterative tables.
- Production services sometimes replace recursive traversal with explicit stacks when input depth is user-controlled and stack overflow is a reliability risk.

---

## Failure Modes and Trade-offs

Forgotten undo logic creates subtle bugs. Deep recursion risks stack overflow. Memoization requires careful state definition. Over-aggressive pruning may miss solutions.

---

## Condensed Notes

- Base case: when recursion stops.
- Recursive case: shrink problem and recurse.
- Backtracking: choice, recurse, undo.
- Subsets: include/exclude each element.
- Permutations: try each unused element.
- Memoization: cache subproblem results.

---

## Additional Problems

### Easy

- Generate balanced parentheses for a small number of pairs.
- Compute power with fast recursion and explain the base cases.

### Medium

- Partition a string into all palindrome decompositions.
- Find all subsets when the input contains duplicates.

### Hard

- Word search on a board with pruning and visited-state rollback.
- Expression add operators with recursive state plus precedence handling.

---

## Key Questions

1. What is the difference between recursion and backtracking?
2. How do you define the base case correctly?
3. Why must you undo changes after recursion?
4. When should you use memoization?
5. How do you convert recursion to iteration?
6. What is the time complexity of subset generation?
7. How do you prune the search tree?
8. What is the call stack and why does it matter?
9. How do you handle duplicates in combination problems?
10. When is recursion clearer than iteration?

---

## Applied Project

Build a puzzle solver: implement constraint satisfaction for a simple puzzle (like Sudoku or N-Queens), add memoization for overlapping subproblems, measure pruning effectiveness, and visualize the search tree to understand backtracking depth.


# 11: Recursion

**Goal:** Teach learners how recursive thinking works, how to design safe base cases, and how to use recursion for search, memoization, and backtracking without treating it as magic.
**Outcome:** By the end of this chapter, you can trace recursive calls, explain the call stack, write base and recursive cases deliberately, recognize when memoization or backtracking is needed, and convert simple recursive logic into iteration when Java stack depth becomes a risk.

---

## 1. Intuition First

Recursion matters because many problems are easier to describe in terms of a smaller version of themselves. Instead of handling the whole problem at once, you define how to solve one step and trust the same logic on a reduced input.

A simple real-world analogy is opening a stack of nested gift boxes. To reach the smallest box, you repeat the same action: open the current box and move to the next smaller one. When you reach the smallest box, you stop. That stopping rule is the base case.

The core mental model is this: recursion is a function calling itself on a smaller state until a stopping condition is reached, then the answers return in reverse order through the call stack. The call stack is the runtime structure that remembers where each unfinished call should continue.

The most common beginner confusion point is thinking recursion is a different kind of logic from loops. It is not. It is another way to express repetition, but each step stores its own local state on the call stack.

In the roadmap, this chapter starts Part III. It turns pattern familiarity from Part II into reasoning about correctness, state, and control flow. That foundation is required for binary search invariants, divide and conquer, tree traversals, and dynamic programming later.

## 2. Core Concepts and Techniques

### Concept Cluster: Base Cases, Recursive Cases, and the Call Stack
Key concepts in this block:
- 11.1 Base case and recursive case design
- 11.2 Understanding the call stack

#### Intuition

Every recursive function needs two parts: the rule for when to stop and the rule for how to shrink the problem. The call stack keeps track of all unfinished work.

#### Why It Matters

Most recursion bugs come from one of three causes: no valid stopping rule, no real progress toward the stop, or returning the wrong value while calls unwind.

#### How It Works

- the base case handles the smallest input directly
- the recursive case moves toward that smallest input
- each function call gets its own local variables and return address
- when the deepest call finishes, earlier calls resume one by one

For `factorial(4)`, the stack grows like this:
- `factorial(4)` waits for `factorial(3)`
- `factorial(3)` waits for `factorial(2)`
- `factorial(2)` waits for `factorial(1)`
- `factorial(1)` returns immediately
- the answers unwind upward

#### Java Implementation Notes

- Keep the base case near the top of the method so it is obvious.
- Prefer descriptive parameter names because each call represents a different state.
- Java does not expose the call stack as a normal collection, so you must reason about it mentally or with a debugger.

#### Common Mistakes

- forgetting the base case entirely
- making a recursive call that does not shrink the problem
- assuming one call can see another call's local variables
- returning before combining the recursive result correctly

#### Quick Example

```java
class CountdownQuickExample {
    static void printCountdown(int value) {
        if (value == 0) {
            System.out.println("done");
            return;
        }

        System.out.println(value);
        printCountdown(value - 1);
    }
}
```

#### Debugging Tip

Write the parameter value beside each call on paper. If the values do not move toward the base case, the recursion is wrong.

#### Advanced Note

A recursive definition is only useful if the subproblem is structurally simpler and the combining step is correct. That same idea reappears in divide and conquer and dynamic programming.

### Concept Cluster: Tail Recursion and Converting Recursion to Iteration
Key concepts in this block:
- 11.3 Tail recursion
- 11.6 Converting recursion to iteration

#### Intuition

Tail recursion means the recursive call is the last operation in the function. That usually means the function's entire state can be carried forward explicitly.

#### Why It Matters

Tail-recursive logic is easier to convert into an iterative loop. That matters in Java because the language does not guarantee tail-call optimization.

#### How It Works

- non-tail recursion does work after the recursive call returns
- tail recursion passes all needed state into the next call
- when that state is explicit, a loop can usually replace the call stack

Example idea:
- non-tail factorial: `return n * factorial(n - 1)`
- tail-recursive shape: keep an accumulator and call the next state directly

#### Java Implementation Notes

- Prefer iteration over deep tail recursion in Java for production-style safety.
- If you convert recursion to iteration, identify what each stack frame was storing and make those values explicit variables or a manual stack.
- Tail recursion improves clarity of state transitions even when you still implement the final version iteratively.

#### Common Mistakes

- calling a method tail-recursive when extra work still happens after the call
- converting recursion to iteration but losing one piece of per-call state
- forgetting that Java recursion depth is limited by the call stack size

#### Quick Example

```java
class SumQuickExample {
    static int recursiveSum(int value) {
        if (value == 0) {
            return 0;
        }
        return value + recursiveSum(value - 1);
    }

    static int iterativeSum(int value) {
        int total = 0;
        while (value > 0) {
            total += value;
            value--;
        }
        return total;
    }
}
```

#### Debugging Tip

Ask what information one call frame must remember before the next call starts. That list tells you what an iterative rewrite must preserve.

#### Advanced Note

For tree or graph traversals, conversion to iteration usually needs an explicit stack because one variable is not enough to remember branching state.

### Concept Cluster: Backtracking and Memoization Basics
Key concepts in this block:
- 11.4 Backtracking basics
- 11.5 Memoization basics

#### Intuition

Backtracking explores choices, commits to one, and then undoes that choice to try the next path. Memoization stores answers for repeated subproblems so you do not solve the same state again.

#### Why It Matters

These are the first two big upgrades to plain recursion. Backtracking makes recursion useful for search spaces. Memoization makes recursion efficient on overlapping subproblems.

#### How It Works

Backtracking:
- choose
- recurse
- undo the choice

Memoization:
- identify the state by parameters
- before computing, check whether that state was already solved
- store the answer the first time it is computed

These two patterns solve different bottlenecks:
- backtracking handles branching decision trees
- memoization handles repeated work across branches

#### Java Implementation Notes

- For backtracking, copy the current path only when storing a finished answer.
- For memoization, arrays are faster when the state is a simple index range; maps are better when the state is sparse or composite.
- Be precise about whether cached values can be zero or negative so you do not confuse an uninitialized state with a real answer.

#### Common Mistakes

- forgetting to undo a choice in backtracking
- reusing the same mutable list object in the final answer
- memoizing with the wrong state key
- storing partial results before they are actually complete

#### Quick Example

```java
import java.util.ArrayList;
import java.util.List;

class BacktrackingQuickExample {
    static List<List<Integer>> buildSubsets(int[] values) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(values, 0, new ArrayList<>(), result);
        return result;
    }

    private static void backtrack(int[] values, int index, List<Integer> current, List<List<Integer>> result) {
        if (index == values.length) {
            result.add(new ArrayList<>(current));
            return;
        }

        backtrack(values, index + 1, current, result);

        current.add(values[index]);
        backtrack(values, index + 1, current, result);
        current.remove(current.size() - 1);
    }
}
```

#### Debugging Tip

In backtracking, print the path both before and after the undo step. If the path does not return to the previous state, later branches will be corrupted.

#### Advanced Note

Memoization is the bridge from recursive intuition to dynamic programming. Once the state and recurrence are stable, tabulation becomes possible.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Fibonacci Number
#### Problem Statement

Given `n`, return the `n`th Fibonacci number where `F(0) = 0`, `F(1) = 1`, and `F(n) = F(n - 1) + F(n - 2)`.

#### Why This Example Matters

It is the classic example of recursion that is easy to write but inefficient without memoization. It makes the cost of repeated subproblems visible.

#### Constraints or Assumptions

- `n` is non-negative
- assume the answer fits in `int` for the chosen test cases
- the goal is to compare plain recursion and memoized recursion

#### Brute-Force Approach

Use the direct recursive definition. For each `n`, recursively compute `n - 1` and `n - 2`.

This is simple, but it recomputes the same Fibonacci values many times.

#### Better Approach

Use memoization. Store the answer for each `n` the first time it is computed, then reuse it.

#### Why the Better Approach Works

The recursive relation is still correct, but overlapping subproblems disappear because each state is solved once.

#### Pragmatic Java Choice

Use an `int[]` cache initialized with `-1` because the state is just one integer index from `0` to `n`.

#### Java Solution

```java
import java.util.Arrays;

class FibonacciExample {
    static int fibonacciBruteForce(int n) {
        if (n <= 1) {
            return n;
        }
        return fibonacciBruteForce(n - 1) + fibonacciBruteForce(n - 2);
    }

    static int fibonacciMemoized(int n) {
        int[] memo = new int[n + 1];
        Arrays.fill(memo, -1);
        return fibonacciMemoized(n, memo);
    }

    private static int fibonacciMemoized(int n, int[] memo) {
        if (n <= 1) {
            return n;
        }
        if (memo[n] != -1) {
            return memo[n];
        }
        memo[n] = fibonacciMemoized(n - 1, memo) + fibonacciMemoized(n - 2, memo);
        return memo[n];
    }
}
```

#### Dry Run

Use `n = 6`.

Brute-force recursion starts with:
- `F(6)` needs `F(5)` and `F(4)`
- `F(5)` needs `F(4)` and `F(3)`
- `F(4)` is already appearing again before the first `F(4)` is even finished

Memoized version:
- compute `F(6)`
- solve `F(5)` and `F(4)` as needed
- once `F(4)` becomes `3`, store it
- later requests for `F(4)` return immediately from the cache
- final result is `8`

#### Time and Space Complexity

- Brute force: `O(2^n)` time, `O(n)` call stack space
- Better approach: `O(n)` time, `O(n)` extra space for memo plus `O(n)` call stack space

#### Edge Cases

- `n = 0` returns `0`
- `n = 1` returns `1`
- very large `n` can still risk stack depth and integer overflow

#### Common Mistakes

- using `0` as both a valid answer and an uninitialized cache marker
- forgetting the `n <= 1` base case
- assuming memoization removes call stack usage when it only removes repeated work

### Worked Example 2: Generate All Subsets
#### Problem Statement

Given an array of distinct integers, return all possible subsets.

#### Why This Example Matters

It is the cleanest first backtracking problem. You make a binary choice at each index: include the element or skip it.

#### Constraints or Assumptions

- input values are distinct
- output order does not matter
- all subsets should be included, including the empty subset

#### Brute-Force Approach

Use bitmasking. For each number from `0` to `(1 << n) - 1`, use the bits to decide which elements belong to the current subset.

This works well, but it does not teach the recursive decision-tree structure.

#### Better Approach

Use backtracking with an index and a current path. At each index, first skip the element, then include it, and undo the inclusion afterward.

#### Why the Better Approach Works

Each recursive level represents one decision point. The two branches cover all possibilities exactly once, and the undo step restores the previous state before exploring the next branch.

#### Pragmatic Java Choice

Use `ArrayList` for the current path and copy it only when a full subset is complete.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class SubsetsExample {
    static List<List<Integer>> subsetsBitmask(int[] values) {
        List<List<Integer>> result = new ArrayList<>();
        int totalMasks = 1 << values.length;

        for (int mask = 0; mask < totalMasks; mask++) {
            List<Integer> subset = new ArrayList<>();
            for (int bit = 0; bit < values.length; bit++) {
                if ((mask & (1 << bit)) != 0) {
                    subset.add(values[bit]);
                }
            }
            result.add(subset);
        }

        return result;
    }

    static List<List<Integer>> subsetsBacktracking(int[] values) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(values, 0, new ArrayList<>(), result);
        return result;
    }

    private static void backtrack(int[] values, int index, List<Integer> current, List<List<Integer>> result) {
        if (index == values.length) {
            result.add(new ArrayList<>(current));
            return;
        }

        backtrack(values, index + 1, current, result);

        current.add(values[index]);
        backtrack(values, index + 1, current, result);
        current.remove(current.size() - 1);
    }
}
```

#### Dry Run

Use `values = [1, 2]`.

Backtracking path:
- start at index `0` with `[]`
- skip `1`, go to index `1`
- skip `2`, store `[]`
- include `2`, store `[2]`, undo to `[]`
- return and include `1`, current is `[1]`
- skip `2`, store `[1]`
- include `2`, store `[1, 2]`, undo twice

Final subsets are `[]`, `[2]`, `[1]`, `[1, 2]`.

#### Time and Space Complexity

- Brute force: `O(n * 2^n)` time, `O(n)` extra space per constructed subset
- Better approach: `O(n * 2^n)` time, `O(n)` recursion depth plus output space

#### Edge Cases

- empty array returns `[[]]`
- one element returns two subsets
- duplicate input values would create repeated subsets unless handled differently

#### Common Mistakes

- not removing the last choice after the recursive call
- adding `current` directly to the result without copying it
- using the wrong stopping condition

### Worked Example 3: Factorial, Tail Recursion, and Iteration
#### Problem Statement

Given a non-negative integer `n`, return `n!`.

#### Why This Example Matters

It is the simplest way to compare basic recursion, tail-recursive state passing, and an iterative rewrite that avoids stack growth in Java.

#### Constraints or Assumptions

- `0 <= n <= 20` so the answer fits in `long`
- negative input is invalid
- the focus is control flow, not big-number arithmetic

#### Brute-Force Approach

Use direct recursion: `n! = n * (n - 1)!`.

This is readable, but every call must wait for the deeper call to return before multiplying.

#### Better Approach

Reshape the logic into tail-recursive form with an accumulator, then implement the final production version as a loop.

#### Why the Better Approach Works

Once the unfinished multiplication is moved into the accumulator, each step only needs the next `n` and the current accumulated product. That state maps directly to iterative variables.

#### Pragmatic Java Choice

In Java, prefer the iterative version for large input ranges because the language does not guarantee tail-call optimization.

#### Java Solution

```java
class FactorialExample {
    static long factorialRecursive(int n) {
        if (n < 0) {
            throw new IllegalArgumentException("n must be non-negative");
        }
        if (n <= 1) {
            return 1L;
        }
        return n * factorialRecursive(n - 1);
    }

    static long factorialTailRecursive(int n) {
        if (n < 0) {
            throw new IllegalArgumentException("n must be non-negative");
        }
        return factorialTailRecursive(n, 1L);
    }

    private static long factorialTailRecursive(int n, long accumulator) {
        if (n <= 1) {
            return accumulator;
        }
        return factorialTailRecursive(n - 1, accumulator * n);
    }

    static long factorialIterative(int n) {
        if (n < 0) {
            throw new IllegalArgumentException("n must be non-negative");
        }

        long result = 1L;
        for (int value = 2; value <= n; value++) {
            result *= value;
        }
        return result;
    }
}
```

#### Dry Run

Use `n = 4`.

Direct recursion:
- `factorialRecursive(4)` waits for `4 * factorialRecursive(3)`
- `factorialRecursive(3)` waits for `3 * factorialRecursive(2)`
- `factorialRecursive(2)` waits for `2 * factorialRecursive(1)`
- `factorialRecursive(1)` returns `1`
- unwind to get `2`, then `6`, then `24`

Tail-recursive state:
- `(4, 1)` becomes `(3, 4)`
- `(3, 4)` becomes `(2, 12)`
- `(2, 12)` becomes `(1, 24)`
- return `24`

Iterative version follows the same state updates with loop variables.

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(n)` call stack space
- Better approach: tail-recursive form is still `O(n)` time and `O(n)` stack space in Java; iterative conversion is `O(n)` time and `O(1)` extra space

#### Edge Cases

- `n = 0` returns `1`
- `n = 1` returns `1`
- negative input should be rejected
- `n > 20` overflows `long`

#### Common Mistakes

- forgetting that `0! = 1`
- claiming tail recursion is automatically stack-safe in Java
- converting to iteration but starting the loop with the wrong initial product

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- plain recursion can be clean but may repeat work or consume deep call stack space
- memoization often reduces repeated recursive work from exponential time to linear or polynomial time, depending on the state space
- backtracking explores all valid branches, so it is often exponential by nature, but recursion keeps the search logic clear
- tail-recursive state design can make iterative conversion straightforward, even though Java still keeps recursive calls on the stack

Choose plain recursion when:
- the problem naturally reduces to a smaller version of itself
- the depth is modest
- the logic is clearer recursively than iteratively

Choose memoization when:
- the same parameter state appears repeatedly
- the brute-force recursive tree has visible overlap
- correctness is easier to derive recursively than bottom-up at first

Choose backtracking when:
- you are enumerating combinations, subsets, paths, or assignments
- each step branches into choices
- you need to explore a decision tree and possibly undo state

Choose iteration instead of recursion when:
- the depth could be large enough to risk stack overflow
- the recursive state is simple enough to carry with variables or a manual stack
- Java runtime safety matters more than matching the mathematical definition directly

Recognition signals for recursion:
- the problem statement says solve the same task on a smaller input
- the structure is nested or hierarchical
- you can describe a base case and a reducing step cleanly

Signals not to force recursion:
- a simple loop is more direct
- the depth could approach input size in a large dataset
- the state is easier to maintain iteratively than through many call frames

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- missing or incorrect base cases
- recursive calls that do not move toward the base case
- mutating shared lists in backtracking without undoing the change
- memo caches that treat a legitimate answer as if it means uninitialized
- stack overflow from deep recursion on large input

Boundary and state risks:
- empty arrays or strings in recursive traversal problems
- index values that move past array bounds
- negative input in math-style recursive functions
- exponential branching when you forget pruning or memoization

Short debugging checklist:
- What is the smallest valid input, and does my base case handle it?
- Which parameter strictly moves toward the base case on every path?
- What state does each call need to remember before the next call?
- If I am using backtracking, where exactly do I undo the last choice?
- If I am using memoization, is my cache key the full state?
- Would an iterative rewrite be safer for this depth in Java?

## 6. Practice Problems

### Easy

- Title: Fibonacci Number
  - One-line prompt: Return the `n`th Fibonacci number.
  - Expected pattern or core idea: Base case design plus memoization.
- Title: Power of Three
  - One-line prompt: Decide whether a number can be repeatedly divided to reach the base case.
  - Expected pattern or core idea: Recursive reduction with a clear stop condition.
- Title: Reverse String
  - One-line prompt: Reverse a character array in place.
  - Expected pattern or core idea: Recursive shrinking from both ends or iterative conversion.

### Medium

- Title: Generate Parentheses
  - One-line prompt: Generate all well-formed parentheses strings of length `2n`.
  - Expected pattern or core idea: Backtracking with validity constraints.
- Title: Subsets
  - One-line prompt: Return every subset of a distinct integer array.
  - Expected pattern or core idea: Backtracking decision tree.
- Title: Climbing Stairs
  - One-line prompt: Count how many ways there are to climb to the top.
  - Expected pattern or core idea: Memoized recursion over overlapping subproblems.

### Hard

- Title: N-Queens
  - One-line prompt: Place queens so none attack each other.
  - Expected pattern or core idea: Backtracking with state pruning.
- Title: Word Search
  - One-line prompt: Determine whether a word can be traced through a grid.
  - Expected pattern or core idea: Recursive DFS-style backtracking with visited-state control.
- Title: Different Ways to Add Parentheses
  - One-line prompt: Return all possible results from computing an expression with different parenthesizations.
  - Expected pattern or core idea: Divide-and-conquer recursion with memoization.

## 7. Short Recap

The core idea of this chapter is that recursion solves a problem by reducing it to smaller versions of the same problem until a safe base case is reached.

The most important optimization insight is that memoization fixes repeated subproblem work, while backtracking manages branching search by choosing and undoing state carefully.

The most important implementation warning is to be explicit about progress toward the base case and to remember that Java recursion depth is limited.

This chapter prepares the next chapter by making recursive reasoning and invariants more natural before binary search asks you to prove why a shrinking search space stays correct.

## 8. Coverage Check

- [x] 11.1 Base case and recursive case design
- [x] 11.2 Understanding the call stack
- [x] 11.3 Tail recursion
- [x] 11.4 Backtracking basics
- [x] 11.5 Memoization basics
- [x] 11.6 Converting recursion to iteration

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 12: Binary Search
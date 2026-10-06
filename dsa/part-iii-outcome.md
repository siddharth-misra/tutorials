# Part III Outcome: Recursion, Searching, Sorting, and Math Tools

**Scope:** Chapters 11 to 15
**Part outcome:**
- Explain why an algorithm is correct
- Compare multiple approaches for the same problem
- Solve 30 medium problems confidently
**Capstone milestone:** No standalone capstone at the end of this part

---

## 1. What Completing Part III Should Mean

By the end of Part III, you should be moving beyond syntax and basic pattern spotting into correctness reasoning. This is the part where you start comparing solutions instead of stopping at the first one that works.

Part III should make you comfortable with:

- reading recursive structure and understanding the call stack
- using binary search with stable invariants and edge handling
- comparing sorting algorithms by complexity, memory, and input behavior
- using bits and math tools as practical problem-solving shortcuts rather than isolated theory

If you still cannot explain why a method is correct, you are not ready for the later DP and advanced-structure chapters.

## 2. Part III Revision Sheet

### 2.1 Recursion

What to remember:

- every recursive solution needs a base case and a shrinking recursive case
- the call stack stores suspended work
- tail recursion is structurally simpler, but Java does not guarantee tail-call optimization
- backtracking is recursion plus state undo or careful state isolation
- memoization is recursion plus caching repeated states
- many recursive routines can be converted to iteration with an explicit stack

Common mistakes:

- base cases that do not actually stop all paths
- mutating shared state without undo logic in backtracking
- assuming recursion is automatically efficient

### 2.2 Binary Search

What to remember:

- iterative and recursive binary search solve the same core problem
- lower bound and upper bound are boundary-finding variants
- binary search on answer works when the feasibility check is monotonic
- invariants matter more than memorized code

Common mistakes:

- off-by-one errors in interval boundaries
- using binary search when the needed monotonic property does not exist
- midpoint overflow if written carelessly

### 2.3 Sorting Algorithms

What to remember:

- simple quadratic sorts are useful for intuition and tiny inputs
- merge sort is stable and reliably `O(n log n)`
- quick sort is fast on average but pivot-dependent
- heap sort gives `O(n log n)` without recursion depth risk from quick sort's worst case
- counting sort and radix sort depend on value-domain assumptions
- algorithm choice depends on data properties and constraints

Common mistakes:

- comparing average-case and worst-case behavior carelessly
- using non-comparison sorts without checking value bounds

### 2.4 Bit Manipulation

What to remember:

- bitwise operators modify or inspect individual bits
- set, clear, and toggle are standard state operations
- counting bits and XOR tricks appear in many medium problems
- bitmasking compresses subset state when `n` is small
- state encoding with bits is often the first step toward subset DP later

Common mistakes:

- confusing signed behavior with raw bit operations
- forgetting parentheses around shifts and masks

### 2.5 Mathematics for DSA

What to remember:

- GCD and LCM help with divisibility and periodicity problems
- factorization and divisor enumeration depend on square-root bounds
- logarithms explain why repeated halving gives `O(log n)`
- fast exponentiation reduces repeated multiplication to logarithmic time
- modular arithmetic matters whenever numbers get large
- small math shortcuts often remove brute-force loops entirely

Common mistakes:

- overflow before modulus is applied
- confusing integer division behavior in formulas

## 3. Part III Readiness Checklist

Mark Part III stable only if all of these are true:

- you can explain why a recursive or binary-search solution is correct
- you can compare at least two approaches for one problem and justify the final choice
- you know when a monotonic feasibility check makes binary search on answer valid
- you can select an appropriate sorting algorithm by constraints
- you can use bits and math tools without treating them as isolated tricks

## 4. Part III Mini Assessment

### Part A: Quick Questions

1. What two things must every recursive solution define clearly?
2. Why is a binary-search invariant more important than memorizing one code template?
3. When is merge sort preferable to quick sort?
4. What does XOR make easy in certain array problems?
5. Why does fast exponentiation run in logarithmic time?
6. What property is required for binary search on answer?

### Part B: Short Tasks

7. Convert one recursive traversal or computation into an iterative version.
8. Solve one lower-bound or upper-bound problem.
9. Compare two sorting algorithms on the same input family and explain the trade-off.
10. Solve one medium problem using bitmasking or fast exponentiation.

### Part C: Answer Guide

1. A base case and a recursive case that shrinks toward it.
2. Because boundary correctness depends on the maintained search interval semantics.
3. When stable `O(n log n)` behavior is preferred or worst-case quick-sort behavior is risky.
4. Detecting parity-like cancelation patterns such as finding a unique element among pairs.
5. Each step halves the exponent size.
6. The feasibility condition must be monotonic across the searched answer space.

### Part D: Scoring Guide

- `6/6` on Part A and at least `3/4` tasks completed in Part B: Part III is stable.
- `4-5/6` on Part A: review correctness and boundary handling.
- `3/6` or lower on Part A: do another revision pass first.

## 5. Targeted Practice Set

- 6 recursion and memoization starter problems
- 8 binary-search and boundary-finding problems
- 6 sorting and comparison problems
- 5 bit-manipulation problems
- 5 math-tool problems

Target total: `30` medium problems.

For each problem, record:

- the baseline approach
- the optimized approach
- why the optimized approach is correct

## 6. Exit Checklist

- You can explain why an algorithm is correct, not just that it passes tests.
- You can compare multiple approaches and justify one clearly.
- Binary search edge cases no longer feel random.
- Sorting choices are based on data and constraints.
- Bit tricks and math tools feel usable, not decorative.
- You have solved about 30 medium problems with written notes.

If one of these is still weak, Part III is not complete.
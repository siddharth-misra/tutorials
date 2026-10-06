# Part I Outcome: Beginner Foundations

**Scope:** Chapters 1 to 4
**Part outcome:**
- Solve 25-30 easy problems
- Write clean Java solutions without syntax help
- Understand complexity for every solution
**Capstone milestone:** No standalone capstone at the end of this part

---

## 1. What Completing Part I Should Mean

By the end of Part I, basic Java syntax should no longer consume most of your attention. You should be able to read a small problem, choose a straightforward data structure, and write a correct first solution without depending on syntax prompts.

Part I is not about advanced optimization. It is about stabilizing the foundation:

- loops, methods, arrays, and strings should feel normal
- HashMap, HashSet, and ArrayList should be familiar tools, not mysterious shortcuts
- you should be able to explain why one solution is `O(n)` and another is `O(n^2)`
- you should be able to debug indexing mistakes and boundary cases on your own

If these basics are still unstable, moving forward will only make later chapters feel random.

## 2. Part I Revision Sheet

### 2.1 Java Foundations for DSA

What to remember:

- variables, primitive types, and operators are the base layer for every later implementation
- conditions, loops, and methods are your control-flow toolkit
- arrays give fixed-size indexed storage; strings are immutable character sequences
- ArrayList is for dynamic lists, HashMap is for key-value lookup, and HashSet is for uniqueness or membership
- comparators matter whenever ordering is not the language default
- fast input and a reusable coding template help once problem volume increases

Common mistakes:

- mixing `==` and `.equals()` for objects
- forgetting Java arrays use zero-based indexing
- mutating a String repeatedly instead of using StringBuilder

### 2.2 Complexity and Problem-Solving Basics

What to remember:

- time complexity tracks how runtime grows with input size
- space complexity tracks extra memory beyond the input itself
- best, average, and worst case are different viewpoints, not interchangeable labels
- amortized analysis explains why occasional expensive operations can still average out well
- reading constraints tells you which solution families are already impossible
- choosing the right data structure is often the first optimization step

Common mistakes:

- stating complexity without connecting it to loops or recursion depth
- ignoring constraints before coding
- confusing input size with numeric value size

### 2.3 Arrays

What to remember:

- traversal and indexing patterns are the base of most early DSA problems
- insertion and deletion in arrays usually require shifting elements
- searching can be linear or faster only when extra structure exists
- rotation and rearrangement problems often depend on careful index movement
- prefix sums turn repeated range sums into constant-time queries after preprocessing
- Kadane's algorithm tracks the best subarray ending at each position

Common mistakes:

- off-by-one errors in traversal boundaries
- losing values during in-place rearrangement
- forgetting to compare the running best in Kadane's algorithm

### 2.4 Strings

What to remember:

- strings and character arrays behave differently in Java
- frequency counting is often the first useful string technique
- substrings are contiguous, subsequences are not
- palindrome problems depend on symmetric comparison
- StringBuilder is the right tool for repeated edits
- many interview string problems reduce to traversal, counting, or two-pointer logic

Common mistakes:

- confusing substring with subsequence
- repeated string concatenation in loops
- not handling empty or single-character cases explicitly

## 3. Part I Skills Checklist

Mark Part I stable only if all of these are true:

- you can write a clean Java method with parameters and return values without syntax guessing
- you can use arrays, strings, ArrayList, HashMap, and HashSet correctly in small problems
- you can compute and explain simple `O(1)`, `O(n)`, and `O(n^2)` runtimes
- you can debug null, empty input, and boundary cases in beginner problems
- you can solve easy array and string problems without relying on later patterns

## 4. Part I Mini Assessment

### Part A: Quick Questions

1. What is the difference between a substring and a subsequence?
2. Why is repeated string concatenation inside a loop often a bad Java choice?
3. When does an array insertion become `O(n)`?
4. What does amortized analysis explain in one sentence?
5. Why does reading constraints matter before choosing an approach?
6. What problem does prefix sum preprocessing solve?

### Part B: Short Tasks

7. Write a method that counts character frequencies in a string.
8. Solve one easy array traversal problem and explain the runtime.
9. Solve one easy palindrome problem and list its edge cases.
10. Build one reusable Java starter template with fast input or at least clean method structure.

### Part C: Answer Guide

1. A substring is contiguous; a subsequence keeps order but may skip characters.
2. Strings are immutable, so repeated concatenation creates unnecessary new objects; StringBuilder is usually better.
3. When elements after the insertion point must shift right.
4. It explains the average cost per operation over a sequence of operations.
5. Constraints eliminate solution families that are too slow or memory-heavy.
6. It turns repeated range-sum calculations into constant-time queries after one preprocessing pass.

### Part D: Scoring Guide

- `6/6` on Part A and at least `3/4` tasks completed in Part B: Part I is stable.
- `4-5/6` on Part A: review weak areas before moving on.
- `3/6` or lower on Part A: redo revision first.

## 5. Targeted Practice Set

Use the Part I outcome target directly:

- 10 easy Java syntax and control-flow problems
- 8 easy complexity and data-structure choice problems
- 6 easy array problems
- 6 easy string problems

Target total: `30` easy problems.

For every solved problem, write two short notes:

- what data structure you chose and why
- one bug or boundary case that mattered

## 6. Exit Checklist

- You can write clean Java without syntax assistance for beginner problems.
- You can explain time complexity for every solution you submit.
- Arrays and strings feel routine rather than error-prone.
- HashMap and HashSet usage is no longer confusing.
- You have completed at least 25 easy problems with brief notes.

If one of these is still weak, Part I is not finished yet.
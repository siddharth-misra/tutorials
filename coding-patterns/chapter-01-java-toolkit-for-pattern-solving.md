# 1: Java Toolkit for Pattern Solving

## 0. Introduction

This chapter builds the Java toolkit that later pattern work depends on. It sits in Part I - Pattern Foundations and Linear Thinking (Weeks 1-4), with the roadmap treating it as beginner work, so the point is to remove mechanical friction before the algorithmic ideas get harder. In practical terms, it supports the Part I outcome of writing clean Java scaffolding for array, string, and hash-based solutions and building the habits needed to explain why a better linear workflow beats a naive scan when it applies.

Read it as the setup layer for the rest of the roadmap. Because this is the first chapter, it establishes the baseline every later coding-pattern chapter depends on, and Chapter 2 immediately builds on it by turning that toolkit into pattern recognition, clue spotting, and brute-force selection from real problem statements. The prerequisite is simple: be comfortable running a Java program and following basic control flow, then focus on sequence containers, hash-based workflows, comparator-driven ordering, safe loop templates, fast I/O, and debugging discipline.

A useful way to study this chapter is to map each Java tool to the dominant operation it supports. Arrays and strings support indexed sequence work, maps and sets support remembered state, deques support two-ended processing, heaps support repeated best-item queries, and the template and debugging sections keep small implementation mistakes from hiding a correct idea. By the end, you should be able to choose between arrays, strings, and core collections; sort with comparators; write index-safe loops; start from a contest-ready Java template; and debug small Java solutions with traces, assertions, and dry runs.

## 1. Intuition First

This chapter matters because pattern solving in Java usually fails long before the interesting algorithm begins. Learners lose time on the wrong issues: choosing the wrong container, writing unsafe loop bounds, building strings inefficiently, sorting with a fragile comparator, or reading large input too slowly.

The simplest analogy is a mechanic's tool cart. You do not use the same tool to tighten a bolt, lift an engine, and measure a gap. Pattern solving works the same way. Arrays, strings, maps, sets, deques, heaps, sort utilities, and debug traces each fit a different operation profile.

The core mental model is straightforward: pick the data structure that matches the dominant operation, pair it with a loop shape that protects your indices, and wrap the solution in reusable input, output, and debugging habits.

Usage signals show up early in problem statements:

- fixed-size indexed data: array
- text scanning or character comparisons: `String` or `char[]`
- frequency, seen-before, or key-based lookup: `HashMap` or `HashSet`
- repeated front or back processing: `ArrayDeque`
- repeated smallest or largest extraction: `PriorityQueue`
- custom ordering by multiple fields: helper class plus `Comparator`
- very large input or many test cases: fast I/O plus batched output

The most common beginner confusion point is trying to memorize later pattern families before learning how to represent state safely. This chapter fixes that by focusing on the Java toolkit first.

In the larger roadmap, this chapter is the foundation layer. It does not teach a major pattern family yet. It teaches the Java scaffolding that lets later chapters focus on recognition, invariants, and optimization instead of syntax recovery.

## 2. Learning Path and Recognition Checklist

The learning path in this chapter is deliberate.

First, you learn the sequence containers that show up in most beginner problems: arrays, strings, and dynamic lists. Next, you learn the four core utility structures that repeatedly appear in pattern-heavy solutions: `HashMap`, `HashSet`, `ArrayDeque`, and `PriorityQueue`. After that, you learn how Java expresses order through comparators and helper classes. Then you tighten the mechanics with safe loop templates, faster input and output, and a debugging routine that catches mistakes before they spread.

Recognition checklist for this chapter:

- If the input is already arranged in positions and you need direct indexed access, start with an array.
- If the data is text and you only read it, start with `String`; if you need to mutate characters, convert to `char[]`.
- If the main question is count, lookup, or membership, test whether a `HashMap` or `HashSet` removes repeated scans.
- If you keep inserting and removing from the front or back, prefer `ArrayDeque` over shifting an `ArrayList`.
- If you repeatedly need the current smallest or largest item, test whether `PriorityQueue` beats sorting or repeated linear scans.
- If the problem says order by score, then by name, then by original index, you need a helper class plus a comparator.
- If the judge input is large, do not start with `Scanner` by default. Use a faster parser and build output in memory first.

The brute-force baseline in this chapter is not one single algorithm. It is a class of habits:

- nested scans for membership and frequency
- repeated string concatenation inside loops
- `ArrayList.remove(0)` for queue behavior
- manual $O(n^2)$ sorting when the library already offers $O(n \log n)$ sort
- ad hoc loops with unclear boundaries

The optimization introduced later in the chapter is also a class of habits:

- use a container whose core operation matches the problem
- use built-in sorting and well-formed comparators instead of manual swaps
- reuse safe loop templates instead of rewriting boundaries from scratch
- batch I/O and dry run the logic on a tiny case before trusting the code

Mastery by the end of the chapter looks like this: you can read a beginner problem and quickly decide what must be stored, what operation dominates runtime, what loop shape is safest, and what template gets you to correct Java code without hesitation.

Do not force these tools blindly. If the key range is tiny, an `int[]` frequency table can be better than a `HashMap`. If you only need one final sorted order, a single sort can be better than a `PriorityQueue`. If the input is tiny and clarity matters more than speed, a simpler implementation may be the right first draft.

## 3. Official Subtopic Coverage

### Concept Cluster: Sequence Containers for Pattern Problems
Official subtopics covered:
- 1.1 Arrays, strings, and collections used in pattern problems

#### Definition or Framing
An array is a fixed-size indexed container. A `String` is an immutable sequence of characters. A collection such as `ArrayList` is a resizable container that trades a little overhead for flexibility.

#### Recognition Signals
Use these tools when the problem gives you ordered input, positions, adjacent comparisons, or character-level work.

- "Given an array..."
- "Given a string..."
- "Process elements from left to right"
- "Return a transformed list or string"

#### Brute-Force Baseline
A beginner often throws nested loops and repeated string concatenation at everything. That works on tiny input, but it becomes slow or awkward when the sequence is large or frequently updated.

#### Optimized Pattern Idea
Choose the sequence representation by operation:

- array for fixed size and direct index access
- `String` for read-only text
- `char[]` when characters must be modified
- `StringBuilder` for repeated text construction
- `ArrayList` when the sequence grows dynamically

#### Core Workflow / Decision Rules
Ask four questions in order:

1. Is the size fixed after input is read?
2. Do I need direct indexed access?
3. Do I need to mutate characters or build output incrementally?
4. Do I need dynamic growth?

If the answer is fixed plus indexed, prefer an array. If the answer is growing sequence, prefer `ArrayList`. If the answer is repeated text construction, prefer `StringBuilder`.

#### Java Implementation Notes
- `arr.length` is a field, but `text.length()` is a method.
- Compare strings with `.equals()`, not `==`.
- Convert a string to a mutable buffer with `toCharArray()` when necessary.
- Use primitive arrays when the data is numeric and the size is known.

#### Quick Dry Run
Suppose the input string is `"abca"` and you want to build a version without `'a'`.

- Repeated `result += currentChar` creates a new temporary string on every append.
- `StringBuilder` appends `'b'` and `'c'` once each, then converts at the end.

The second version matches the real operation better: incremental building.

#### Common Mistakes
- Accessing `arr[arr.length]`
- Using `==` to compare string contents
- Forgetting that strings are immutable
- Using a dynamic list where a simple primitive array would be clearer

#### Debugging Strategy
When sequence code fails, print the current index, the current value, and the next value before each risky access. For strings, print either the current character index or the current `StringBuilder` contents.

#### Comparison with Similar Pattern
Array versus `ArrayList` is the first important comparison in this chapter.

- array: fixed size, less overhead, fastest raw indexed access
- `ArrayList`: dynamic size, convenient helpers, still good indexed access

#### Advanced Note
Later pattern chapters often begin with an array or string representation even when the final optimized solution adds maps, heaps, or graph structures on top.

### Concept Cluster: Hashing, Deque, and Heap Workflows
Official subtopics covered:
- 1.2 HashMap, HashSet, ArrayDeque, and PriorityQueue workflows

#### Definition or Framing
These structures are operation-driven tools.

- `HashMap`: store key-value pairs for lookup, counting, or accumulation
- `HashSet`: store unique values for membership checks
- `ArrayDeque`: push and pop from both ends efficiently
- `PriorityQueue`: remove the smallest item by default, or the largest with a reversed comparator

#### Recognition Signals
Choose one of these when the problem says:

- count frequencies
- detect duplicates or seen-before values
- process from the front and add at the back
- remove from either end
- repeatedly ask for the current minimum or maximum

#### Brute-Force Baseline
The brute-force habit here is repeated scanning.

- count by scanning the whole array again for each value
- check duplicates with nested loops
- simulate a queue by removing index `0` from an `ArrayList`
- find the current minimum by scanning all remaining values each time

Those approaches are easy to start but waste time because the dominant operation is repeated too often.

#### Optimized Pattern Idea
Replace repeated scanning with a structure that remembers useful state.

- `HashMap` stores counts or latest information by key
- `HashSet` stores what has already appeared
- `ArrayDeque` keeps front and back operations at constant time
- `PriorityQueue` keeps the current best candidate near the top

#### Core Workflow / Decision Rules
Pick the structure by the question you ask most often.

- "How many times have I seen this?" -> `HashMap`
- "Have I seen this already?" -> `HashSet`
- "Who is next at the front or back?" -> `ArrayDeque`
- "What is the smallest or largest item right now?" -> `PriorityQueue`

The structure should answer the dominant question cheaply.

#### Java Implementation Notes
- `map.getOrDefault(key, 0)` is the standard frequency update helper.
- `set.add(value)` returns `false` if the value was already present.
- Prefer `ArrayDeque` over `Stack` for stack-like behavior in modern Java.
- `PriorityQueue<Integer>` is a min-heap by default.
- Use `new PriorityQueue<>(Comparator.reverseOrder())` for a max-heap of boxed values.

#### Quick Dry Run
Two tiny dry runs show the workflows.

For duplicates in `[5, 2, 5, 3]`:

- add `5` to `HashSet` -> new
- add `2` -> new
- add `5` -> already present, duplicate found

For repeated minimum extraction from `[8, 3, 5]`:

- insert all into a min-heap
- `poll()` returns `3`, then `5`, then `8`

For queue behavior with commands `ADD 7`, `ADD 9`, `SERVE`:

- deque becomes `[7, 9]`
- `pollFirst()` returns `7`

#### Common Mistakes
- Expecting `PriorityQueue` to be a max-heap by default
- Using mutable objects as map keys and then changing the fields that define equality
- Using `ArrayList.remove(0)` for heavy queue workloads
- Forgetting that hash-based structures do not preserve sorted order

#### Debugging Strategy
Print the structure after each operation on a tiny case. For maps, print the key and updated count. For deques, print front and back. For heaps, remember that printing the heap does not show sorted order, so verify behavior through `peek()` and `poll()`.

#### Comparison with Similar Pattern
Use a small fixed-size array instead of a `HashMap` when the key domain is tiny and numeric, such as lowercase English letters. Use sorting instead of a heap when you only need one final global order rather than repeated best-item queries.

#### Advanced Note
Later chapters will turn these tools into full pattern families such as sliding windows with maps, monotonic deques, and heap-based top-$k$ workflows. Here the goal is only to make the Java mechanics natural.

### Concept Cluster: Ordering and Data Modeling in Java
Official subtopics covered:
- 1.3 Sorting, comparators, and helper classes in Java

#### Definition or Framing
Sorting arranges data by a rule. A comparator is the rule. A helper class groups related fields so the sorting rule can be written clearly.

#### Recognition Signals
This subtopic matters when the statement says:

- sort by value
- order by one field, then another
- sort intervals by start time
- sort records before scanning them

#### Brute-Force Baseline
The brute-force baseline is manual sorting with nested loops or parallel arrays that keep related fields in separate structures. Both approaches are easy to start and easy to break.

#### Optimized Pattern Idea
Model each record as one object, then use Java's library sort with a comparator that matches the real ordering rule.

#### Core Workflow / Decision Rules
Use this ordering workflow:

1. Decide what one logical item is.
2. Put all fields for that item into one helper class.
3. Write the ordering rule from highest priority key to lowest.
4. Sort once.
5. Scan in sorted order.

#### Java Implementation Notes
- Use `Integer.compare(a, b)` instead of `a - b` to avoid overflow.
- Chain comparator keys from most important to least important.
- For object collections, `list.sort(comparator)` and `Collections.sort(list, comparator)` are standard options.
- `Arrays.sort(objectArray, comparator)` works when your data is already in an array.

#### Quick Dry Run
Suppose students are sorted by score descending, then name ascending.

- `(Ava, 95)` must come before `(Liam, 90)` because `95 > 90`
- `(Ava, 95)` must come before `(Noah, 95)` because scores tie and `Ava` is lexicographically smaller

That ordering rule becomes one comparator instead of many manual swap conditions.

#### Common Mistakes
- Forgetting a secondary tie-breaker
- Using subtraction in a comparator and causing overflow
- Sorting only one array while related data lives elsewhere
- Writing a comparator that contradicts the intended problem order

#### Debugging Strategy
Before sorting the full input, print a tiny list of records with their key fields and manually predict the correct order. Then compare that prediction with the sorted output.

#### Comparison with Similar Pattern
Sorting once is different from repeatedly extracting the best item.

- sort once: good when you need one final global order
- `PriorityQueue`: good when items are inserted or removed over time and you need the best current item repeatedly

#### Advanced Note
Java 17 also supports `record` types, which can make small data carriers shorter. In beginner problem solving, a simple helper class is still a good default because it makes each field explicit.

### Concept Cluster: Safe Traversal Templates
Official subtopics covered:
- 1.4 Reusable loop templates and index-safe coding habits

#### Definition or Framing
Reusable loop templates are standard traversal shapes that reduce off-by-one errors. Index-safe habits are the rules that prevent invalid reads and writes.

#### Recognition Signals
Reach for loop templates when the task is a full scan, reverse scan, adjacent comparison, or index-driven update.

#### Brute-Force Baseline
The brute-force habit is writing a fresh loop from scratch every time, then hoping the boundaries are right. That is where many beginner bugs come from.

#### Optimized Pattern Idea
Reuse a small set of tested loop shapes and adapt only the body, not the boundary logic.

#### Core Workflow / Decision Rules
Pick the loop template that matches the access pattern.

- full left-to-right scan: `for (int index = 0; index < n; index++)`
- reverse scan: `for (int index = n - 1; index >= 0; index--)`
- adjacent pair access: ensure `index + 1 < n`
- fixed window start: ensure `start + windowSize <= n`

Write down the valid index range before writing the loop body.

#### Java Implementation Notes
These four templates cover most early chapter traversal needs.

```java
for (int index = 0; index < values.length; index++) {
    // use values[index]
}

for (int index = values.length - 1; index >= 0; index--) {
    // reverse traversal
}

for (int index = 0; index + 1 < values.length; index++) {
    // safe access to values[index] and values[index + 1]
}

for (int start = 0; start + windowSize <= values.length; start++) {
    // safe access to a fixed-size segment
}
```

#### Quick Dry Run
Suppose `values = [3, 1, 4]` and you want to compare adjacent pairs.

- `index = 0` compares `3` and `1`
- `index = 1` compares `1` and `4`
- stop before `index = 2` because `index + 1` would be out of bounds

The stop condition is part of the algorithm, not a small syntax detail.

#### Common Mistakes
- Using `<=` where `<` is required
- Accessing `values[index + 1]` without proving `index + 1 < values.length`
- Updating the index in the wrong place inside a `while` loop
- Mixing an enhanced for-loop with logic that really needs explicit indices

#### Debugging Strategy
When a traversal fails, print the index immediately before each array access and verify that the intended valid range matches the actual loop condition.

#### Comparison with Similar Pattern
An enhanced for-loop is safer when you only need the values. An indexed loop is necessary when the position matters. Do not force one into the other.

#### Advanced Note
Later patterns such as two pointers, sliding windows, and binary search all depend on disciplined boundary thinking. This chapter builds that habit early.

### Concept Cluster: Fast Input and Contest Setup
Official subtopics covered:
- 1.5 Fast input/output and a contest-ready Java template

#### Definition or Framing
Fast I/O means reading input with buffering and parsing tokens directly instead of relying on slower high-level utilities. A contest-ready template is the reusable shell that separates parsing, solving, and output.

#### Recognition Signals
Use fast I/O when the input size is large, the time limit is tight, or there are many test cases and many output lines.

#### Brute-Force Baseline
The brute-force version is `Scanner` plus repeated `System.out.println` inside deep loops. It is simple, but it often becomes the bottleneck before the algorithm does.

#### Optimized Pattern Idea
Buffer the input, parse tokens quickly, collect output in a `StringBuilder`, and print once at the end.

#### Core Workflow / Decision Rules
The contest-ready workflow is:

1. create one scanner-like parser
2. read the size or test case count
3. pass parsed values into a focused `solve` method
4. append results to a `StringBuilder`
5. print once at the end

#### Java Implementation Notes
- `BufferedInputStream` is a common base for fast token parsing.
- `StringBuilder` prevents many slow console writes.
- Keep `main` thin and move logic into `solve`.
- Be careful when mixing line-based and token-based parsing styles.

#### Quick Dry Run
For input `5` followed by `10 20 30 40 50`, a contest template should:

- parse `5`
- loop exactly five times
- accumulate the answer
- append one output line
- print once

#### Common Mistakes
- Mixing `nextInt()` and line-based reads without handling leftover whitespace
- Printing inside inner loops when batched output is better
- Letting parsing and problem logic mix together in one giant `main`
- Using slow I/O first and only noticing performance trouble after the rest of the code is finished

#### Debugging Strategy
Test the template on a tiny custom input first. If parsing is wrong, print each token as it is read before you blame the algorithm.

#### Comparison with Similar Pattern
`Scanner` is simpler for tiny examples and teaching snippets. A fast parser is better when input volume is large enough to matter. Use the simplest tool that still respects the constraints.

#### Advanced Note
Fast I/O is not a substitute for a good algorithm. It removes constant-factor waste. It does not fix a quadratic solution that should have been linear or $n \log n$.

### Concept Cluster: Debugging Discipline
Official subtopics covered:
- 1.6 Debugging with traces, assertions, and dry runs

#### Definition or Framing
Tracing means printing or recording how state changes step by step. An assertion is a runtime check that states what must be true at a certain point. A dry run is a manual simulation of the algorithm on a tiny input.

#### Recognition Signals
Use this workflow when the final answer is wrong, the code crashes on boundaries, or the program seems to work on random tests but fails on one specific case.

#### Brute-Force Baseline
The weak debugging baseline is guessing, changing code randomly, and rerunning. That wastes time because it does not locate the first wrong state transition.

#### Optimized Pattern Idea
Debug in layers:

- find the smallest failing case
- trace the state changes
- assert the intended invariants
- compare the first wrong step against the expected step

#### Core Workflow / Decision Rules
Use this debugging order:

1. reduce to the smallest counterexample
2. write the expected state after each step
3. trace the actual state after each step
4. add assertions where assumptions should always hold
5. fix the first wrong transition, not the final symptom

#### Java Implementation Notes
- Java assertions are enabled with the `-ea` flag.
- Assertions are best for internal sanity checks, not user-facing error handling.
- Keep debug prints easy to remove or guard behind a boolean flag.

#### Quick Dry Run
If a duplicate counter fails on `[2, 2, 3]`, the dry run should show exactly when the state changes.

- before reading first `2`, set is empty
- after first `2`, set contains `2`
- before reading second `2`, duplicate should be detected

If the code misses that moment, the bug is near the update order.

#### Common Mistakes
- Checking only the final answer instead of the first wrong step
- Leaving debug prints everywhere and drowning the useful signal
- Writing assertions for conditions that are not actually guaranteed
- Forgetting that assertions may be disabled unless explicitly enabled

#### Debugging Strategy
Start with one tiny failing input, trace only the important state, and stop the moment the actual state differs from the expected state. That is where the real bug lives.

#### Comparison with Similar Pattern
A dry run explains the algorithm on paper. A trace shows what the program actually did. An assertion states what must never be violated. Use the three together, not as substitutes.

#### Advanced Note
Later chapters will express stronger invariants, such as window boundaries, heap validity, or binary search range correctness. The discipline starts here with small examples.

## 4. Pattern Template, State Model, or Core Workflow

Chapter 1 is toolkit-heavy, so the most useful output is a reusable operating workflow.

### Canonical Workflow for Starting a Java Pattern Problem

1. Read the input format and constraints.
2. Identify the dominant operation.
3. Pick the structure that answers that operation cheaply.
4. Choose the safest traversal template.
5. Write down the state variables and what each one means.
6. Dry run on the smallest non-trivial input.
7. Add a trace or assertion for the most fragile assumption.
8. Only then write the full code.

### Important Variables, States, Boundaries, and Decision Rules

- `n`, `m`, `queryCount`: input sizes that define loop boundaries
- `index`, `left`, `right`, `start`, `end`: position variables whose valid ranges must be explicit
- `seen`, `frequency`, `queue`, `heap`: structure variables that represent remembered state
- `answer`, `sum`, `best`: running aggregates that should be updated in one predictable place

Useful decision rules:

- If you access by index often, stay with arrays or `ArrayList`.
- If you ask about membership or counts, prefer hashing over repeated scanning.
- If you remove from the front, do not shift an `ArrayList`.
- If you only need one final order, sort once before reaching for a heap.

### Invariant Checks and Safety Rules

- Before `values[index]`, prove `0 <= index < values.length`.
- Before `values[index + 1]`, prove `index + 1 < values.length`.
- If `seen` represents processed items, update it in a consistent place every iteration.
- If a comparator defines the problem order, include all required tie-breakers.
- If the parser reads `n` items, the loop must run exactly `n` times.

### Safe Update Order and Mutation Discipline

The safest update order is usually:

1. read current input value
2. inspect current state
3. compute the action for this iteration
4. update the state once
5. update the answer once

Many beginner bugs come from updating state too early. For example, if a set is supposed to represent previously seen values, check membership before adding the current value when the logic depends on prior state only.

### What Usually Breaks First

- loop boundaries
- string equality checks
- comparator tie-breakers
- queue simulations built on `ArrayList.remove(0)`
- slow I/O that hides a good algorithm behind a timeout
- traces that start too late and miss the first wrong transition

### When to Adapt the Template Versus Keep It Unchanged

Keep the workflow unchanged when the problem is a standard scan, counting task, sorting task, or simulation. Adapt it when the input is interactive, graph-shaped, or recursive. Even then, the first five steps usually remain valid.

### Contest-Ready Java Starter Template

```java
import java.io.BufferedInputStream;
import java.io.EOFException;
import java.io.IOException;

class Main {
    private static final class FastScanner {
        private final BufferedInputStream input = new BufferedInputStream(System.in);
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int bytesRead = 0;

        private int read() throws IOException {
            if (pointer >= bytesRead) {
                bytesRead = input.read(buffer);
                pointer = 0;
                if (bytesRead <= 0) {
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        String next() throws IOException {
            StringBuilder token = new StringBuilder();
            int character = read();
            while (character != -1 && character <= ' ') {
                character = read();
            }
            if (character == -1) {
                return null;
            }
            while (character > ' ') {
                token.append((char) character);
                character = read();
            }
            return token.toString();
        }

        int nextInt() throws IOException {
            String token = next();
            if (token == null) {
                throw new EOFException();
            }
            return Integer.parseInt(token);
        }

        long nextLong() throws IOException {
            String token = next();
            if (token == null) {
                throw new EOFException();
            }
            return Long.parseLong(token);
        }
    }

    private static void solve(FastScanner scanner, StringBuilder out) throws Exception {
        int valueCount = scanner.nextInt();
        long sum = 0L;
        for (int index = 0; index < valueCount; index++) {
            sum += scanner.nextLong();
        }
        out.append(sum).append('\n');
    }

    public static void main(String[] args) throws Exception {
        FastScanner scanner = new FastScanner();
        StringBuilder out = new StringBuilder();
        solve(scanner, out);
        System.out.print(out);
    }
}
```

## 5. Worked Examples and Full Solutions

### Worked Example 1: Count Distinct Values
#### Problem Statement
Given an integer array, return how many distinct values it contains.

#### Why This Example Matters
This is the first clean example of replacing repeated membership scans with the right container.

#### Input and Constraints
- `1 <= n <= 200000`
- values may be negative or repeated

#### Recognition Signals
- the question is about uniqueness
- the same membership question appears for many elements
- the array only needs one left-to-right pass

#### Brute-Force Approach
For each value, scan all earlier values to see whether it has appeared before. If not, increase the answer.

That is easy to reason about, but in the worst case it does nearly every pair comparison, so the runtime is $O(n^2)$.

#### Better Pattern-Based Approach
Use a `HashSet<Integer>` named `seenValues`. Insert each value once. At the end, the set size is the number of distinct values.

#### Why the Pattern Fits
The dominant operation is membership and uniqueness, not sorting or index manipulation. A set matches that operation directly.

#### Invariant or State Transition
After processing the first `index` elements, `seenValues` contains exactly the distinct values from that processed prefix.

#### Pragmatic Java Choice
Use `HashSet<Integer>` with an enhanced for-loop. The code is short, clear, and avoids manual index work because the position itself does not matter.

#### Dry Run Before Code
Input: `[4, 2, 4, 3, 2]`

- start: `seenValues = {}`
- read `4` -> `{4}`
- read `2` -> `{4, 2}`
- read `4` -> unchanged
- read `3` -> `{4, 2, 3}`
- read `2` -> unchanged

Final answer: `3`

#### Java Solution
```java
import java.util.HashSet;
import java.util.Set;

class DistinctCounter {
    static int countDistinct(int[] values) {
        if (values == null || values.length == 0) {
            return 0;
        }

        Set<Integer> seenValues = new HashSet<>();
        for (int value : values) {
            seenValues.add(value);
        }
        return seenValues.size();
    }
}
```

#### Time and Space Complexity
- brute force: $O(n^2)$ time and $O(1)$ extra space
- optimized set-based version: $O(n)$ average time and $O(n)$ extra space

#### Edge Cases
- empty array -> answer is `0`
- all values identical -> answer is `1`
- all values distinct -> answer is `n`

#### Common Mistakes
- using a list and calling `contains`, which falls back to linear membership
- sorting first even when only the count of distinct values is required
- forgetting that `null` input should be handled explicitly if the method contract allows it

### Worked Example 2: Sort Students by Score, Then Name, Then Submission Order
#### Problem Statement
Given a list of student records with `name`, `score`, and `submissionOrder`, return the records sorted by score descending, then name ascending, then submission order ascending.

#### Why This Example Matters
This example shows how helper classes and comparators replace fragile manual sorting logic and parallel arrays.

#### Input and Constraints
- `1 <= n <= 100000`
- `name` contains letters only
- `score` fits in `int`

#### Recognition Signals
- the problem defines a multi-key ordering
- one logical item has several related fields
- the likely workflow is sort once, then scan or print

#### Brute-Force Approach
Store fields in parallel arrays and perform manual nested-loop sorting by swapping entries in all arrays together.

That approach is hard to maintain because every swap must keep multiple arrays synchronized. It also costs $O(n^2)$ time.

#### Better Pattern-Based Approach
Model each student as one helper object and sort a list with a comparator chain.

#### Why the Pattern Fits
The real task is not searching or counting. It is establishing one global order based on multiple keys. Java's sort utilities already solve that part well.

#### Invariant or State Transition
The comparator defines the full intended order: higher score first, then smaller name, then earlier submission order. Once the comparator is correct, the sorted list is correct.

#### Pragmatic Java Choice
Use a small helper class and `Comparator.comparingInt(...)` plus tie-breakers. This keeps the ordering logic readable and avoids arithmetic overflow from subtraction inside a comparator.

#### Dry Run Before Code
Input records:

- `("Mia", 90, 2)`
- `("Ava", 95, 5)`
- `("Noah", 95, 1)`
- `("Ava", 95, 3)`

Sorted order should be:

1. `("Ava", 95, 3)`
2. `("Ava", 95, 5)`
3. `("Noah", 95, 1)`
4. `("Mia", 90, 2)`

Reasoning:

- score `95` comes before `90`
- among score `95`, `Ava` comes before `Noah`
- among the two `Ava` records, smaller `submissionOrder` comes first

#### Java Solution
```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

class StudentSorter {
    static final class Student {
        final String name;
        final int score;
        final int submissionOrder;

        Student(String name, int score, int submissionOrder) {
            this.name = name;
            this.score = score;
            this.submissionOrder = submissionOrder;
        }
    }

    static List<Student> sortStudents(List<Student> students) {
        List<Student> orderedStudents = new ArrayList<>(students);
        orderedStudents.sort(
            Comparator.comparingInt((Student student) -> student.score)
                .reversed()
                .thenComparing(student -> student.name)
                .thenComparingInt(student -> student.submissionOrder)
        );
        return orderedStudents;
    }
}
```

#### Time and Space Complexity
- brute force manual sorting: $O(n^2)$ time and $O(1)$ extra space if sorted in place
- comparator-based library sort: $O(n \log n)$ time and $O(n)$ extra space in the copied list version shown here

#### Edge Cases
- all students identical by all keys -> any stable equal order is acceptable
- one student only -> list stays unchanged
- names with different letter case -> define whether case-sensitive order is intended

#### Common Mistakes
- forgetting a tie-breaker and getting unstable-looking output
- writing `studentA.score - studentB.score` in a comparator
- splitting related fields across separate arrays and losing synchronization during swaps

### Worked Example 3: Service Desk Queue with Fast I/O
#### Problem Statement
You are given `q` commands. Each command is one of the following:

- `ADD x`: add customer `x` to the back of the service queue
- `SERVE`: remove and print the customer at the front, or print `EMPTY` if the queue is empty
- `PEEK`: print the customer at the front without removing it, or print `EMPTY` if the queue is empty

Process all commands efficiently.

#### Why This Example Matters
This example combines three Chapter 1 skills at once: `ArrayDeque` for queue behavior, fast token parsing, and batched output.

#### Input and Constraints
- `1 <= q <= 200000`
- customer ids fit in `int`
- commands arrive one tokenized line at a time

#### Recognition Signals
- repeated front removal and back insertion
- many operations, so shifting a list is too expensive
- large input, so parsing speed matters

#### Brute-Force Approach
Use an `ArrayList<Integer>` and call `remove(0)` for `SERVE`.

That works functionally, but every front removal shifts the remaining elements, so heavy workloads become quadratic.

#### Better Pattern-Based Approach
Use `ArrayDeque<Integer>` so both `offerLast` and `pollFirst` are constant-time operations. Pair it with a fast scanner and a `StringBuilder` for output.

#### Why the Pattern Fits
The dominant operations are push-to-back and pop-from-front. `ArrayDeque` matches those operations directly.

#### Invariant or State Transition
At every step, the deque contents are exactly the current waiting line from front to back. The front of the deque is the next customer to be served.

#### Pragmatic Java Choice
Use `ArrayDeque<Integer>` instead of `LinkedList` or `ArrayList`. Use a token parser backed by `BufferedInputStream`, and append output lines to one `StringBuilder`.

#### Dry Run Before Code
Commands:

```text
7
ADD 5
ADD 9
PEEK
SERVE
ADD 3
SERVE
SERVE
```

Dry run:

- `ADD 5` -> queue `[5]`
- `ADD 9` -> queue `[5, 9]`
- `PEEK` -> output `5`
- `SERVE` -> output `5`, queue `[9]`
- `ADD 3` -> queue `[9, 3]`
- `SERVE` -> output `9`, queue `[3]`
- `SERVE` -> output `3`, queue `[]`

Final output lines:

```text
5
5
9
3
```

#### Java Solution
```java
import java.io.BufferedInputStream;
import java.io.EOFException;
import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;

class ServiceDeskSimulation {
    private static final class FastScanner {
        private final BufferedInputStream input = new BufferedInputStream(System.in);
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int bytesRead = 0;

        private int read() throws IOException {
            if (pointer >= bytesRead) {
                bytesRead = input.read(buffer);
                pointer = 0;
                if (bytesRead <= 0) {
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        String next() throws IOException {
            StringBuilder token = new StringBuilder();
            int character = read();
            while (character != -1 && character <= ' ') {
                character = read();
            }
            if (character == -1) {
                return null;
            }
            while (character > ' ') {
                token.append((char) character);
                character = read();
            }
            return token.toString();
        }

        int nextInt() throws IOException {
            String token = next();
            if (token == null) {
                throw new EOFException();
            }
            return Integer.parseInt(token);
        }
    }

    public static void main(String[] args) throws Exception {
        FastScanner scanner = new FastScanner();
        int queryCount = scanner.nextInt();

        Deque<Integer> serviceQueue = new ArrayDeque<>();
        StringBuilder out = new StringBuilder();

        for (int queryIndex = 0; queryIndex < queryCount; queryIndex++) {
            String command = scanner.next();

            if ("ADD".equals(command)) {
                int customerId = scanner.nextInt();
                serviceQueue.offerLast(customerId);
            } else if ("SERVE".equals(command)) {
                if (serviceQueue.isEmpty()) {
                    out.append("EMPTY\n");
                } else {
                    out.append(serviceQueue.pollFirst()).append('\n');
                }
            } else if ("PEEK".equals(command)) {
                if (serviceQueue.isEmpty()) {
                    out.append("EMPTY\n");
                } else {
                    out.append(serviceQueue.peekFirst()).append('\n');
                }
            }
        }

        System.out.print(out);
    }
}
```

#### Time and Space Complexity
- brute force `ArrayList.remove(0)` simulation: worst-case $O(q^2)$ time
- deque-based simulation: $O(q)$ total time for the queue operations and $O(q)$ space in the worst case

#### Edge Cases
- `SERVE` on an empty queue
- `PEEK` on an empty queue
- many commands but no output-producing operations
- repeated additions without service

#### Common Mistakes
- using `remove(0)` on an `ArrayList`
- printing inside the loop instead of batching output
- forgetting to handle empty queue commands
- mixing line parsing and token parsing unnecessarily

## 6. Complexity and Comparison Guide

Chapter 1 is about choosing the right baseline tool before later pattern chapters add more structure.

- array access by index: $O(1)$
- `ArrayList` indexed access: $O(1)$ average, but front removal is $O(n)$
- `HashMap` and `HashSet` operations: $O(1)$ average for insert, lookup, and update
- `ArrayDeque` end operations: $O(1)$
- `PriorityQueue` insert and remove-best: $O(\log n)$
- sorting with a comparator: $O(n \log n)$

Useful comparisons:

- `HashSet` versus nested scans: use the set when repeated membership dominates.
- `HashMap` versus fixed-size count array: use the array when the key range is tiny and numeric.
- `ArrayDeque` versus `ArrayList.remove(0)`: use the deque for queue behavior because front removal should not shift the entire structure.
- sorting once versus `PriorityQueue`: sort once when you need one final order; use a heap when new items arrive over time or the best current item is requested repeatedly.

Decision criteria for choosing among them:

- choose arrays when size is fixed and indices matter
- choose hashing when lookup, frequency, or uniqueness is the bottleneck
- choose deque when both ends matter
- choose heap when repeated best-item extraction matters
- choose sorting when the whole dataset must be globally ordered once

Recognition signals that justify this chapter's techniques:

- many repeated membership checks
- repeated smallest or largest retrieval
- front or back processing
- multi-key ordering
- large input size

Signals that you should not force these techniques:

- tiny fixed key range where an array is simpler than a map
- one-time global ordering where a heap only adds complexity
- value-only traversal where an indexed loop adds no benefit over an enhanced for-loop
- toy input where fast I/O would make the code harder to read without helping

What breaks when the invariant or preconditions fail:

- wrong loop bounds cause crashes or skipped elements
- incomplete comparator rules cause wrong ordering on ties
- wrong structure choice causes timeouts even when the logic is correct
- missing trace points make debugging focus on the symptom instead of the first wrong state change

## 7. Edge Cases, Pitfalls, and Debugging

The most common Chapter 1 implementation bugs are mechanical, not theoretical.

- confusing `arr.length`, `list.size()`, and `text.length()`
- comparing strings with `==`
- using `PriorityQueue` as if it were a max-heap without a comparator
- writing `a - b` inside a comparator and risking overflow
- calling `ArrayList.remove(0)` inside large queue simulations
- printing on every iteration instead of batching output

Off-by-one risks are especially common.

- full scans should stop at `index < n`
- adjacent access should prove `index + 1 < n`
- reverse scans should start at `n - 1`, not `n`

Boundary handling also matters.

- empty arrays and empty strings
- single-element inputs
- all-duplicate or all-distinct cases
- empty queue operations
- input that ends exactly after the last token

Stale state and mutation bugs show up when the update order is wrong.

- checking a set after you already inserted the current element
- counting with a map but forgetting the default zero case
- sorting related fields in one structure while leaving another unsorted copy behind

Short debugging checklist:

1. Test the smallest non-trivial case.
2. Test an empty or single-element boundary case if the problem allows it.
3. Trace the first three iterations, not the last three.
4. Print the structure state after each update on the tiny case.
5. Add one assertion for the most fragile assumption.
6. Fix the first wrong transition you observe.

Quick counterexample that defeats a common wrong solution:

If you simulate a queue with `ArrayList.remove(0)` and the commands are `200000` additions followed by `200000` services, the logic may still be correct, but the repeated shifting turns a simple queue task into a timeout-prone solution. The data structure choice, not the visible logic, is the bug.

## 8. Practice Problems

### Easy
- Distinct Element Count: Given an integer array, return the number of unique values. Expected pattern or core idea: `HashSet` membership.
- Character Frequency Summary: Given a lowercase string, report the frequency of each character. Expected pattern or core idea: fixed-size array or `HashMap` counting.
- Reverse Print Safely: Print an array in reverse order without index errors. Expected pattern or core idea: reverse loop template.
- Remove a Target Character: Build a new string after skipping one target character. Expected pattern or core idea: `StringBuilder` plus left-to-right scan.

### Medium
- Student Ranking Board: Sort records by score descending, then name ascending, then id ascending. Expected pattern or core idea: helper class plus comparator.
- First Duplicate Detector: Return the first value whose second occurrence appears earliest in the scan. Expected pattern or core idea: `HashSet` or `HashMap` with left-to-right traversal.
- Queue Command Processor: Support add, peek, and serve operations over many commands. Expected pattern or core idea: `ArrayDeque` plus batched output.
- Top Three Scores Stream: After each insertion, report the current three largest scores. Expected pattern or core idea: `PriorityQueue` with controlled size.

### Hard
- Event Ordering Audit: Given event records with timestamps, priorities, and original order, produce a stable audit output under strict tie-break rules. Expected pattern or core idea: helper class, comparator discipline, and dry-run validation.
- High-Volume Frequency Queries: Process add, remove, and count queries over a large stream of ids. Expected pattern or core idea: `HashMap` state management plus fast I/O.
- Two-End Work Queue Simulator: Simulate commands that push and pop from both ends while preserving correctness under empty operations. Expected pattern or core idea: `ArrayDeque` workflow and boundary handling.
- Streaming Median Preview: Report the running median after each insertion. Expected pattern or core idea: two heaps as a preview of later heap-based pattern work.

## 9. Short Recap

- The core idea is to match the Java structure to the dominant operation instead of forcing one container everywhere.
- The strongest recognition clue is the repeated question the problem keeps asking: membership, count, order, front or back access, or current best item.
- The most important optimization insight is that the right container removes repeated scans, shifting, or rebuilding.
- The most important implementation warning is that loop bounds, comparator rules, and update order break more beginner solutions than the algorithm itself.
- This chapter prepares the next chapter by giving you the toolkit needed to recognize when a problem is asking for a pattern instead of just raw syntax.

## 10. Coverage Check

- [x] 1.1 Arrays, strings, and collections used in pattern problems
- [x] 1.2 HashMap, HashSet, ArrayDeque, and PriorityQueue workflows
- [x] 1.3 Sorting, comparators, and helper classes in Java
- [x] 1.4 Reusable loop templates and index-safe coding habits
- [x] 1.5 Fast input/output and a contest-ready Java template
- [x] 1.6 Debugging with traces, assertions, and dry runs

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: How to Recognize a Coding Pattern
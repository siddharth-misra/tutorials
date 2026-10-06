# 1: Java Foundations for DSA

**Goal:** Build enough Java fluency to solve beginner DSA problems without getting stuck on syntax, containers, or program structure.
**Outcome:** By the end of this chapter, you can write clean Java methods, use arrays and strings safely, choose between `ArrayList`, `HashMap`, and `HashSet`, define simple classes with comparators, and start every DSA problem from a reusable coding template.

---

## 1. Intuition First

Java for DSA is a workshop. Variables are labeled boxes. Loops are repeated actions. Methods are reusable tools. Arrays and strings are simple storage shelves. Collections are smarter containers. Classes let you model real data, and comparators tell Java how to order that data.

This chapter matters because beginner DSA problems are rarely hard because of the algorithm alone. They are hard because learners try to think about the algorithm, the syntax, the data structure, and the output format all at once. That overload causes avoidable mistakes.

The simplest real-world analogy is a kitchen prep station. Before cooking a meal, you need containers, measuring rules, a cutting sequence, and a clean workspace. DSA problem solving works the same way. You need a stable setup before speed or cleverness matters.

The most common beginner confusion point is not "What is a loop?" It is "Which Java tool should I pick here?" Should this be an array or an `ArrayList`? Should I count with a `HashMap`? Should I make a helper method? This chapter answers those decisions early so later chapters can focus on actual algorithmic thinking.

In the roadmap, this chapter is the language foundation. It does not teach advanced algorithms. It teaches how to express them cleanly when they arrive.

## 2. Core Concepts and Techniques

### Concept Cluster: Variables, Data Types, and Operators
Key concepts in this block:
- 1.1 Variables, data types, and operators

#### Intuition

A variable is a named box. A data type tells Java what can go inside that box. An operator is the action you perform on those values.

#### Why It Matters

DSA problems depend on correct state updates. If you pick the wrong type or misunderstand an operator, the algorithm can fail before the real logic even starts.

#### How It Works

The most common beginner Java types are:
- `int` for whole numbers in a moderate range
- `long` for larger whole numbers
- `double` for decimal values
- `boolean` for true or false state
- `char` for a single character
- `String` for text

The main operator groups are:
- arithmetic: `+`, `-`, `*`, `/`, `%`
- comparison: `==`, `!=`, `<`, `<=`, `>`, `>=`
- logical: `&&`, `||`, `!`
- assignment: `=`, `+=`, `-=`, `*=`, `/=`

Two beginner rules matter immediately:
- integer division drops the fractional part, so `5 / 2` is `2`
- multiplication can overflow `int`, so use `long` when constraints may grow large

#### Java Implementation Notes

- Use `long` for sums, products, and large counters when problem constraints may exceed about 2 billion.
- Add parentheses when expression order is not obvious. Clear grouping is better than trusting precedence memory.
- Use final local variables when a value should not change after initialization.

#### Common Mistakes

- Using `int` for a value that should be `long`
- Expecting `7 / 2` to produce `3.5`
- Mixing comparison and assignment thinking
- Writing expressions that rely on operator precedence instead of making grouping explicit

#### Quick Example

```java
static long computeScore(int solvedProblems, int bonusPerProblem, boolean submittedOnTime) {
    long score = (long) solvedProblems * bonusPerProblem;
    if (!submittedOnTime) {
        score -= 5;
    }
    return Math.max(score, 0L);
}
```

#### Debugging Tip

When arithmetic looks wrong, print every intermediate value before the final assignment. Most beginner bugs come from one unexpected expression, not from the whole method.

#### Advanced Note

Even simple DSA problems can fail because of overflow. If a problem uses values up to `10^9`, a product of two such values does not fit in `int`.

### Concept Cluster: Conditions, Loops, and Methods
Key concepts in this block:
- 1.2 Conditions, loops, and methods

#### Intuition

Conditions choose a path. Loops repeat work. Methods package logic so you can reuse and test it.

#### Why It Matters

Most DSA solutions are nothing more than careful state updates inside loops, plus a few helper methods that keep the code readable.

#### How It Works

Use:
- `if`, `else if`, and `else` when the program must choose between cases
- `for` when the number of steps is naturally tied to an index or range
- `while` when repetition depends on a changing condition
- methods to isolate one logical job at a time

For DSA, a strong beginner habit is: keep `main` small, put logic in methods, and let each method answer one clear question.

#### Java Implementation Notes

- Prefer enhanced for-loops when you only need values, not indexes.
- Prefer indexed loops when you need element positions or need to modify array entries.
- Use early returns in methods to reduce nesting.

#### Common Mistakes

- Infinite loops caused by forgetting to update loop state
- Off-by-one errors such as using `i <= arr.length - 1` instead of `i < arr.length`
- Writing one very large method instead of a few focused helper methods

#### Quick Example

```java
static int countPositiveEvenNumbers(int[] values) {
    int count = 0;
    for (int value : values) {
        if (value > 0 && value % 2 == 0) {
            count++;
        }
    }
    return count;
}
```

#### Debugging Tip

If a loop produces the wrong answer, print the loop index, the current value, and the state variable after each update. That usually reveals the first wrong transition.

#### Advanced Note

Good methods do not just improve readability. They also make dry runs, test cases, and future refactoring much easier.

### Concept Cluster: Arrays and Strings in Java
Key concepts in this block:
- 1.3 Arrays and strings in Java

#### Intuition

An array is a fixed-size row of boxes. A string is a sequence of characters. Arrays are mutable. Strings are immutable, which means their contents do not change after creation.

#### Why It Matters

Most early DSA problems are about traversing arrays or reading patterns from strings. If you understand indexing and immutability early, later chapters become much easier.

#### How It Works

Key points:
- array size is fixed after creation
- array indexing starts at `0`
- array length is `arr.length`
- string length is `text.length()`
- character access is `text.charAt(index)`

Because strings are immutable, repeated concatenation in a loop creates many temporary strings. That is acceptable for tiny problems but inefficient for heavy output or repeated edits.

#### Java Implementation Notes

- Use arrays when the size is known and fixed.
- Use strings for read-only text handling.
- Be careful with `charAt(index)` because it throws an exception if the index is invalid.

#### Common Mistakes

- Confusing `arr.length` with `text.length()`
- Accessing `arr[arr.length]`, which is out of bounds
- Using `==` to compare strings instead of `.equals()`
- Building a long output string with repeated `+` inside a loop

#### Quick Example

```java
static int countOccurrences(String text, char target) {
    int count = 0;
    for (int index = 0; index < text.length(); index++) {
        if (text.charAt(index) == target) {
            count++;
        }
    }
    return count;
}
```

#### Debugging Tip

When string logic fails, print the index and the current character. When array logic fails, print the valid index range before the loop starts.

#### Advanced Note

Strings are immutable for safety and predictability. Later, when performance matters, `StringBuilder` becomes the better tool for repeated text construction.

### Concept Cluster: ArrayList, HashMap, and HashSet Basics
Key concepts in this block:
- 1.4 ArrayList, HashMap, and HashSet basics

#### Intuition

`ArrayList` is a dynamic array. `HashMap` stores key-value pairs. `HashSet` stores unique values.

#### Why It Matters

These three tools solve a huge share of beginner DSA tasks:
- store a growing list
- count frequencies
- check whether a value has already appeared

#### How It Works

- `ArrayList<E>` supports fast append and indexed access
- `HashMap<K, V>` supports average `O(1)` insert and lookup by key
- `HashSet<E>` supports average `O(1)` membership checks

Use:
- `ArrayList` when size changes over time
- `HashMap` when you need counts, grouping, or direct lookup by key
- `HashSet` when only existence or uniqueness matters

#### Java Implementation Notes

- `map.getOrDefault(key, 0)` is a standard frequency-counting pattern.
- `set.add(value)` returns `true` only if the value was not already present.
- Generic types matter: `HashMap<String, Integer>` is much clearer than raw types.

#### Common Mistakes

- Using `ArrayList.contains()` repeatedly when a `HashSet` is the better fit
- Forgetting that `HashMap` iteration order is not sorted
- Confusing keys with values when reading or updating a map

#### Quick Example

```java
static java.util.HashMap<String, Integer> buildFrequencyMap(String[] words) {
    java.util.HashMap<String, Integer> frequency = new java.util.HashMap<>();
    for (String word : words) {
        frequency.put(word, frequency.getOrDefault(word, 0) + 1);
    }
    return frequency;
}
```

#### Debugging Tip

If frequency logic is wrong, print the map after each update for a tiny sample input of three or four elements.

#### Advanced Note

Average `O(1)` does not mean ordered. When order matters, you may need a different structure later, but `HashMap` and `HashSet` remain the default fast lookup tools.

### Concept Cluster: Classes, Objects, and Comparators
Key concepts in this block:
- 1.5 Classes, objects, and comparators

#### Intuition

A class is a blueprint. An object is one actual instance built from that blueprint. A comparator is a rule that tells Java how two objects should be ordered.

#### Why It Matters

Real DSA problems rarely stay as plain integers forever. You often need to store multiple fields together such as `name`, `score`, and `age`, then sort by one field and break ties with another.

#### How It Works

Use a class when multiple values belong together. Use a comparator when sorting needs a custom rule such as:
- score descending
- then name ascending

This is cleaner than trying to keep related values in separate arrays.

#### Java Implementation Notes

- Keep fields focused and constructor initialization clear.
- Prefer comparators for sorting rules that may change from problem to problem.
- Name comparators by intent, not by syntax.

#### Common Mistakes

- Splitting related data into parallel arrays instead of one class
- Writing comparator rules that forget tie-breaking conditions
- Returning inconsistent ordering logic, which can make sorting behavior unreliable

#### Quick Example

```java
static final class Student {
    final String name;
    final int score;

    Student(String name, int score) {
        this.name = name;
        this.score = score;
    }
}

static java.util.Comparator<Student> byScoreDescendingThenNameAscending() {
    return (left, right) -> {
        if (left.score != right.score) {
            return Integer.compare(right.score, left.score);
        }
        return left.name.compareTo(right.name);
    };
}
```

#### Debugging Tip

If sorting looks wrong, print the data both before and after sorting, and manually compare two items that appear out of order.

#### Advanced Note

Comparators are one of the first places where clean design shows up in DSA code. A good comparator makes the sorting rule visible instead of burying it inside unrelated logic.

### Concept Cluster: Fast Input/Output and a Reusable Coding Template
Key concepts in this block:
- 1.6 Fast input/output and a reusable coding template

#### Intuition

Fast I/O is a stable entry point for problems with large input. A reusable template reduces setup mistakes and lets you focus on the actual problem.

#### Why It Matters

For small examples, `Scanner` is fine. For larger inputs, it can become noticeably slow. A lightweight template with a fast scanner and clean `solve()` method is the standard Java DSA starting point.

#### How It Works

A beginner-friendly template usually contains:
- a `FastScanner` for token-based input
- a `solve()` method for the real logic
- a `main` method that only calls `solve()`
- `StringBuilder` or `PrintWriter` for efficient output

#### Java Implementation Notes

- Keep the template minimal. Do not copy a huge personal library before you understand it.
- Start with one fast scanner class and one place for helper methods.
- Use `StringBuilder` when producing many lines of output.

#### Common Mistakes

- Putting all logic inside `main`
- Copying a template without understanding how it reads tokens
- Mixing slow and fast I/O styles carelessly
- Forgetting to handle empty input in a reusable template

#### Quick Example

```java
import java.io.BufferedInputStream;
import java.io.IOException;

public class Main {
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

        int nextInt() throws IOException {
            int current;
            do {
                current = read();
            } while (current <= ' ');

            int sign = 1;
            if (current == '-') {
                sign = -1;
                current = read();
            }

            int value = 0;
            while (current > ' ') {
                value = value * 10 + current - '0';
                current = read();
            }
            return value * sign;
        }
    }

    public static void main(String[] args) throws Exception {
        FastScanner scanner = new FastScanner();
        int count = scanner.nextInt();
        long sum = 0;
        for (int index = 0; index < count; index++) {
            sum += scanner.nextInt();
        }
        System.out.println(sum);
    }
}
```

#### Debugging Tip

When fast input fails, first test the scanner with a tiny input of one or two numbers. Scanner bugs are easier to isolate before the full solution exists.

#### Advanced Note

The best template is not the biggest template. It is the one you fully understand and can debug under pressure.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Count Distinct Numbers

#### Problem Statement

Given an integer array, return how many distinct values it contains.

#### Why This Example Matters

This is one of the cleanest first examples for choosing between brute force and the right Java container. It reinforces arrays, loops, methods, and `HashSet`.

#### Constraints or Assumptions

- The array may be empty.
- Values may repeat.
- Values may be negative.

#### Brute-Force Approach

Keep a second array or list of values seen so far. For every new number, scan that stored collection linearly to check whether the number already exists. If not, add it.

This works, but in the worst case every new number scans all previous unique values, so the total time becomes `O(n^2)`.

#### Better Approach

Use a `HashSet<Integer>`. Add every value once, then return the set size.

#### Why the Better Approach Works

A set stores each unique value only once. The repeated "have I seen this before?" question becomes an average `O(1)` membership operation instead of a linear scan.

#### Pragmatic Java Choice

For uniqueness checks, `HashSet` is the default starting point. It is clearer and less bug-prone than maintaining manual duplicate logic.

#### Java Solution

```java
import java.util.HashSet;
import java.util.Set;

public class DistinctCounter {
    public static int countDistinct(int[] values) {
        Set<Integer> seen = new HashSet<>();
        for (int value : values) {
            seen.add(value);
        }
        return seen.size();
    }

    public static void main(String[] args) {
        int[] values = {4, 2, 4, 1, 2, 5};
        System.out.println(countDistinct(values));
    }
}
```

#### Dry Run

Input: `[4, 2, 4, 1, 2, 5]`

- Start with `seen = {}`
- Read `4`, set becomes `{4}`
- Read `2`, set becomes `{2, 4}`
- Read `4`, set stays `{2, 4}`
- Read `1`, set becomes `{1, 2, 4}`
- Read `2`, set stays `{1, 2, 4}`
- Read `5`, set becomes `{1, 2, 4, 5}`
- Final answer: `4`

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(n)` space
- Better approach: average `O(n)` time, `O(n)` space

#### Edge Cases

- Empty array returns `0`
- Single element returns `1`
- All values equal returns `1`

#### Common Mistakes

- Using `ArrayList.contains()` repeatedly instead of a set
- Forgetting that uniqueness, not order, is the goal here
- Returning the array length instead of the set size

### Worked Example 2: Most Frequent Word in a Sentence

#### Problem Statement

Given a lowercase sentence with words separated by spaces, return the most frequent word. If multiple words have the same highest frequency, return the lexicographically smallest one.

#### Why This Example Matters

This example shows why `HashMap` is one of the most important DSA tools in Java. It turns repeated counting from a slow nested-loop process into a clean one-pass pattern.

#### Constraints or Assumptions

- Input may be empty or blank.
- Words contain only lowercase English letters.
- Words are separated by one or more spaces.

#### Brute-Force Approach

Split the sentence into words. For each word, scan the full array again to count how many times it appears. Track the best answer with tie-breaking.

This is straightforward but costs `O(n^2)` time because counting one word requires another full pass.

#### Better Approach

Split once, maintain a frequency map, and update the best answer while building the map.

#### Why the Better Approach Works

Each word contributes one increment to its own count. The map remembers the frequency seen so far, so no repeated full-array scanning is needed.

#### Pragmatic Java Choice

Use `HashMap<String, Integer>` for counting. It is the standard Java frequency-map pattern and appears in many later chapters.

#### Java Solution

```java
import java.util.HashMap;
import java.util.Map;

public class MostFrequentWord {
    public static String mostFrequentWord(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }

        String[] words = text.trim().split("\\s+");
        Map<String, Integer> frequency = new HashMap<>();
        String bestWord = "";
        int bestCount = 0;

        for (String word : words) {
            int updatedCount = frequency.getOrDefault(word, 0) + 1;
            frequency.put(word, updatedCount);

            if (updatedCount > bestCount
                    || (updatedCount == bestCount
                    && (bestWord.isEmpty() || word.compareTo(bestWord) < 0))) {
                bestCount = updatedCount;
                bestWord = word;
            }
        }

        return bestWord;
    }

    public static void main(String[] args) {
        String text = "java loops java map loops java";
        System.out.println(mostFrequentWord(text));
    }
}
```

#### Dry Run

Input: `"java loops java map loops java"`

- Start with empty map, `bestWord = ""`, `bestCount = 0`
- Read `java`, map becomes `{java=1}`, best becomes `java`
- Read `loops`, map becomes `{java=1, loops=1}`, tie does not beat `java`
- Read `java`, map becomes `{java=2, loops=1}`, best becomes `java`
- Read `map`, map becomes `{java=2, loops=1, map=1}`
- Read `loops`, map becomes `{java=2, loops=2, map=1}`, tie between `java` and `loops`, lexicographically `java` stays smaller
- Read `java`, map becomes `{java=3, loops=2, map=1}`, best stays `java`
- Final answer: `java`

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(n)` space for split words
- Better approach: average `O(n)` time, `O(n)` space

#### Edge Cases

- Blank input returns `""`
- One word returns that word
- Full tie uses lexicographic order

#### Common Mistakes

- Forgetting to trim or split on repeated spaces
- Updating the map but forgetting to update the current best answer
- Using `==` instead of `.equals()` when comparing string content elsewhere

### Worked Example 3: Build a Simple Leaderboard

#### Problem Statement

Read `n` student records. Each record contains a one-word `name` and an integer `score`. Print the students sorted by score descending, then by name ascending.

#### Why This Example Matters

This example combines multiple Chapter 1 ideas in one place: classes, objects, comparators, arrays, fast input, and efficient output.

#### Constraints or Assumptions

- Student names are single tokens.
- `n` may be large enough that fast input is useful.
- Duplicate names are allowed.

#### Brute-Force Approach

Use `Scanner`, store each student in parallel arrays, and manually selection-sort the result.

That works for learning, but it mixes related data poorly and uses an `O(n^2)` sorting approach when Java already provides a better sorting API.

#### Better Approach

Create a `Student` class, store records in an array, define a comparator for the sorting rule, and use `Arrays.sort`. Use a fast scanner and `StringBuilder` for input/output overhead.

#### Why the Better Approach Works

The class keeps related fields together. The comparator makes the ordering rule explicit. `Arrays.sort` uses a well-optimized library implementation and removes a lot of manual sorting bugs.

#### Pragmatic Java Choice

When multiple fields belong together, model them with a class. When sorting rules are custom, use a comparator instead of scattering sort logic across the program.

#### Java Solution

```java
import java.io.BufferedInputStream;
import java.io.IOException;
import java.util.Arrays;

public class LeaderboardBuilder {
    private static final class Student {
        final String name;
        final int score;

        Student(String name, int score) {
            this.name = name;
            this.score = score;
        }
    }

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
            int current;
            do {
                current = read();
            } while (current != -1 && current <= ' ');

            if (current == -1) {
                return null;
            }

            StringBuilder token = new StringBuilder();
            while (current > ' ') {
                token.append((char) current);
                current = read();
            }
            return token.toString();
        }

        int nextInt() throws IOException {
            return Integer.parseInt(next());
        }
    }

    public static void main(String[] args) throws Exception {
        FastScanner scanner = new FastScanner();
        int count = scanner.nextInt();
        Student[] students = new Student[count];

        for (int index = 0; index < count; index++) {
            String name = scanner.next();
            int score = scanner.nextInt();
            students[index] = new Student(name, score);
        }

        Arrays.sort(students, (left, right) -> {
            if (left.score != right.score) {
                return Integer.compare(right.score, left.score);
            }
            return left.name.compareTo(right.name);
        });

        StringBuilder output = new StringBuilder();
        for (Student student : students) {
            output.append(student.name)
                    .append(' ')
                    .append(student.score)
                    .append('\n');
        }

        System.out.print(output);
    }
}
```

#### Dry Run

Sample input:

```text
4
Mira 90
Arun 95
Zoya 90
Ishaan 95
```

Steps:

- Read 4 students into an array of `Student` objects
- Compare by score descending first
- For the two students with score 95, compare names: `Arun` comes before `Ishaan`
- For the two students with score 90, compare names: `Mira` comes before `Zoya`
- Final order:
  - `Arun 95`
  - `Ishaan 95`
  - `Mira 90`
  - `Zoya 90`

#### Time and Space Complexity

- Brute force with manual selection sort: `O(n^2)` time, `O(n)` space for storage
- Better approach: `O(n log n)` time for sorting, `O(n)` space for storage and output building

#### Edge Cases

- `n = 0` should print nothing
- Equal scores must be ordered by name
- One student should still work correctly

#### Common Mistakes

- Splitting name and score into unrelated parallel arrays
- Forgetting the tie-break comparator rule
- Using `Scanner` for very large inputs without noticing the slowdown
- Appending output line by line with repeated string concatenation

## 4. Complexity and Decision Guide

The main lesson of this chapter is not to optimize everything early. It is to choose the right basic tool.

- Use arrays when size is known and indexed access matters. Array access is `O(1)`.
- Use `ArrayList` when the collection grows dynamically and indexed access still matters.
- Use `HashSet` when the real question is membership or uniqueness.
- Use `HashMap` when the real question is lookup, counting, or grouping by key.
- Use a class when multiple fields describe one logical item.
- Use a comparator when sorting depends on more than one field or on a custom ordering rule.

Recognition signals:
- "count frequency" usually means `HashMap`
- "have we seen this before" usually means `HashSet`
- "store a list that grows" usually means `ArrayList`
- "sort by score, then by name" usually means class plus comparator
- "large input" often means fast I/O template

Signals not to force a technique:
- If the size is fixed and simple, an array may be better than `ArrayList`.
- If you only need a yes-or-no existence check, do not build a full map.
- If the program is tiny and the input is tiny, fast I/O is optional.
- If data belongs together, do not force separate arrays just because arrays were introduced earlier.

Brute force is still useful in Chapter 1 because it teaches the bottleneck clearly. The goal is to understand why the better structure helps, not to memorize containers without context.

## 5. Edge Cases, Pitfalls, and Debugging

Common pitfalls in early Java DSA code:

- confusing `arr.length` and `text.length()`
- accessing an array out of bounds
- using `==` for string content comparison
- forgetting to reset or update a state variable inside a loop
- choosing `int` when `long` is safer
- storing related values in separate arrays instead of one class
- using a list for repeated membership checks instead of a set

Boundary conditions to test early:

- empty input
- one element
- all values equal
- all values distinct
- smallest and largest allowed numeric values
- tie cases during sorting or counting

Short debugging checklist:

1. Write the smallest sample input that still reproduces the bug.
2. Print the loop index and the main state variable after each update.
3. For maps and sets, print the container after each insert on a tiny example.
4. For comparators, manually compare two specific objects that appear misordered.
5. For input bugs, test the scanner separately before testing the whole algorithm.
6. Dry run one example on paper before changing the code again.

## 6. Practice Problems

### Easy

1. `Count Positive Numbers`
   One-line prompt: Given an array of integers, return how many elements are greater than zero.
   Expected pattern or core idea: Array traversal with a simple counter.

2. `First Duplicate Value`
   One-line prompt: Return the first value that appears more than once in an integer array, or `-1` if none exists.
   Expected pattern or core idea: `HashSet` membership tracking.

3. `Vowel Counter`
   One-line prompt: Given a string, count how many vowels it contains.
   Expected pattern or core idea: String traversal with conditions.

### Medium

1. `Student Pass Report`
   One-line prompt: Given student names and scores, print all passing students sorted by score descending and name ascending.
   Expected pattern or core idea: Class plus comparator plus filtering.

2. `Word Frequency Summary`
   One-line prompt: Given a sentence, print each word with its frequency.
   Expected pattern or core idea: `HashMap` frequency counting.

3. `Unique Sorted Numbers`
   One-line prompt: Read `n` integers, remove duplicates, and print the remaining values in ascending order.
   Expected pattern or core idea: `HashSet` for uniqueness, then list conversion and sorting.

### Hard

1. `Mini Contact Directory`
   One-line prompt: Support commands `ADD name number`, `FIND name`, and `COUNT` for many operations.
   Expected pattern or core idea: Reusable template plus `HashMap` lookup.

2. `Contest Ranking Engine`
   One-line prompt: Given many submissions with participant name and score, keep each participant's best score and print the final ranking.
   Expected pattern or core idea: `HashMap` aggregation plus class and comparator.

3. `Character Frequency Tie Breaker`
   One-line prompt: Return the most frequent character in a string, breaking ties by earliest position.
   Expected pattern or core idea: Counting plus careful tie-handling logic.

## 7. Short Recap

The core idea of this chapter is that good DSA code starts with stable Java basics: correct types, controlled loops, focused methods, and the right container for the job.

The most important optimization insight is simple: replace repeated scanning with the right lookup structure. `HashSet` removes manual duplicate checks, and `HashMap` removes repeated counting passes.

The most important implementation warning is that many beginner bugs come from structure, not algorithms: wrong index bounds, wrong type choice, wrong container, or unclear method design.

This chapter prepares the next one by giving you the raw Java tools needed to analyze efficiency instead of just making code run.

## 8. Coverage Check

- [x] 1.1 Variables, data types, and operators
- [x] 1.2 Conditions, loops, and methods
- [x] 1.3 Arrays and strings in Java
- [x] 1.4 ArrayList, HashMap, and HashSet basics
- [x] 1.5 Classes, objects, and comparators
- [x] 1.6 Fast input/output and a reusable coding template
- Coverage Summary: 6/6 official subtopics covered

Next: 2: Complexity and Problem-Solving Basics
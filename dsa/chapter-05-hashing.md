# 5: Hashing

**Goal:** Teach learners how to use hashing for fast lookup, membership checks, frequency counting, and custom key design in Java.
**Outcome:** By the end of this chapter, you can choose between `HashMap` and `HashSet`, replace many nested-loop lookups with average `O(1)` operations, explain what collisions mean, and write correct `equals()` and `hashCode()` methods for custom keys.

---

## 1. Intuition First

Hashing is a shortcut system. Instead of scanning every item until you find what you want, you compute a key and jump near the answer immediately.

A simple real-world analogy is a library locker wall. If every book request required checking lockers one by one, retrieval would be slow. A hash function is the rule that tells you which locker area to check first. It is not magic. It is structured guessing backed by a fast data structure.

The core mental model is this: hashing trades ordered storage for fast access by key. A `HashMap` answers "what value belongs to this key?" A `HashSet` answers "have I seen this value before?" Many brute-force solutions become much faster once repeated searching is replaced by remembered lookup state.

The most common beginner confusion point is thinking hashing gives guaranteed `O(1)` time in every case. In practice, Java hash-based collections are designed for average-case constant-time work, but collisions and poor key design still matter.

In the larger roadmap, hashing is the first chapter where preprocessing and remembered state start to beat straightforward scanning in a consistent way. That idea returns in sliding windows, prefix sums with maps, graph visitation, and dynamic programming memoization.

## 2. Core Concepts and Techniques

### Concept Cluster: Hash-Based Lookup Containers
Key concepts in this block:
- 5.1 HashMap fundamentals
- 5.2 HashSet fundamentals

#### Intuition

A `HashMap` stores pairs. A `HashSet` stores unique values. Both are built for fast access by hashing the incoming key or value.

#### Why It Matters

Many beginner solutions use a nested loop only because the program forgets what it has already seen. Hash-based containers fix that by remembering answers from earlier work.

#### How It Works

Use `HashMap<K, V>` when you need:
- counts
- indexes
- groups
- any mapping from one piece of information to another

Use `HashSet<E>` when you need:
- uniqueness
- fast membership checks
- deduplication
- quick detection of repeats

Common operations:
- map insert/update: `put(key, value)`
- map lookup: `get(key)` or `getOrDefault(key, fallback)`
- map membership: `containsKey(key)`
- set insert: `add(value)`
- set membership: `contains(value)`

#### Java Implementation Notes

- Prefer `getOrDefault` for counting patterns.
- `HashSet.add(value)` returns `false` if the value was already present.
- Hash-based collections do not preserve sorted order.
- If you need insertion order, that is a different container choice and a different trade-off.

#### Common Mistakes

- using a `HashMap` when only uniqueness is needed
- using a `HashSet` when counts are needed
- assuming iteration order means anything stable
- forgetting that primitive values such as `int` are stored through wrapper types like `Integer`

#### Quick Example

```java
import java.util.HashSet;

class ContainsDuplicateQuickExample {
    static boolean containsDuplicate(int[] values) {
        HashSet<Integer> seen = new HashSet<>();
        for (int value : values) {
            if (!seen.add(value)) {
                return true;
            }
        }
        return false;
    }
}
```

#### Debugging Tip

If a hash-based solution looks wrong, print the map or set after each update. Many bugs come from updating the structure at the wrong time, not from the collection itself.

#### Advanced Note

Hashing is usually about average-case speed. When a problem also requires sorted order or minimum and maximum queries, a hash-based collection may not be the right tool.

### Concept Cluster: Frequency Maps and Collision Thinking
Key concepts in this block:
- 5.3 Frequency maps and counting patterns
- 5.4 Collision handling basics

#### Intuition

A frequency map is a ledger. Every time a value appears, its count increases. A collision happens when different keys land in the same internal bucket area.

#### Why It Matters

Frequency counting is one of the most reusable DSA patterns. Collisions matter because they explain why hashing is fast in practice but still based on careful internal structure.

#### How It Works

Frequency map pattern:
- if a key has not appeared, treat its count as `0`
- increment by `1`
- store the updated result back in the map

Collision basics:
- Java hashes a key into an integer
- internal bucket selection uses that hash
- two different keys may map to the same bucket area
- collisions do not break correctness because Java still uses equality checks to distinguish keys

The key lesson is that equal keys must have equal hash codes, but different keys may still share a hash bucket.

#### Java Implementation Notes

- `frequency.put(key, frequency.getOrDefault(key, 0) + 1)` is the standard counting line.
- Never rely on hash code uniqueness.
- Avoid mutable objects as hash keys unless you are certain the fields used by `equals()` and `hashCode()` will never change while the object sits inside the collection.

#### Common Mistakes

- treating collisions as errors instead of normal behavior
- assuming unequal objects must have different hash codes
- mutating a key after inserting it into a map or set
- recomputing counts with repeated scans instead of storing them once

#### Quick Example

```java
import java.util.HashMap;
import java.util.Map;

class FrequencyQuickExample {
    static Map<String, Integer> countWords(String[] words) {
        Map<String, Integer> frequency = new HashMap<>();
        for (String word : words) {
            frequency.put(word, frequency.getOrDefault(word, 0) + 1);
        }
        return frequency;
    }
}
```

#### Debugging Tip

When counts are wrong, inspect the exact key string or value being used. Hidden whitespace, case differences, or premature normalization errors are common causes.

#### Advanced Note

Collision handling affects performance, but equality rules affect correctness. If equality is wrong, the collection can behave incorrectly even when hashing looks fast.

### Concept Cluster: Custom Hashing and Equality in Java
Key concepts in this block:
- 5.5 Custom hashing and equality in Java

#### Intuition

For custom objects, Java needs two answers:
- when should two objects be treated as logically equal?
- how should they be placed into hash buckets?

#### Why It Matters

If you store custom objects in a `HashSet` or use them as `HashMap` keys without correct equality rules, duplicates may not be recognized and lookups may fail unexpectedly.

#### How It Works

The core contract is:
- if `a.equals(b)` is `true`, then `a.hashCode()` must equal `b.hashCode()`
- if two objects are unequal, their hash codes may still be the same

For value-style objects, define equality using the fields that identify the object logically.

#### Java Implementation Notes

- Override both `equals()` and `hashCode()` together.
- Use `instanceof` or exact-class checks consistently.
- `Objects.hash(...)` is simple and readable for beginner code.
- Java 17 records generate value-based equality automatically, but writing the methods manually once is still important for understanding.

#### Common Mistakes

- overriding `equals()` but not `hashCode()`
- comparing fields that should not define logical identity
- using mutable fields inside the hash definition and then changing them later
- confusing object identity with logical equality

#### Quick Example

```java
import java.util.Objects;

class Point {
    private final int row;
    private final int column;

    Point(int row, int column) {
        this.row = row;
        this.column = column;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof Point point)) {
            return false;
        }
        return row == point.row && column == point.column;
    }

    @Override
    public int hashCode() {
        return Objects.hash(row, column);
    }
}
```

#### Debugging Tip

If a `HashSet` seems to contain duplicates of a custom object, print both `equals()` results and hash codes for the suspicious values.

#### Advanced Note

Good equality rules are part of data modeling, not just syntax. Poorly chosen identity fields create bugs that hashing merely exposes.

## 3. Worked Examples and Full Solutions

### Worked Example 1: First Non-Repeating Integer
#### Problem Statement

Given an integer array, return the first value that appears exactly once. If no such value exists, return `-1`.

#### Why This Example Matters

It shows the most common beginner hashing pattern: count first, answer second.

#### Constraints or Assumptions

- the array may contain duplicates
- order matters because the answer is the first unique value by original position
- negative numbers are allowed

#### Brute-Force Approach

For each element, scan the full array again and count how many times it appears. Return the first element whose count is `1`.

This works, but it costs `O(n^2)` time because every element triggers another full scan.

#### Better Approach

Build a frequency map in one pass, then scan the array a second time and return the first value whose count is `1`.

#### Why the Better Approach Works

The first pass stores all repeated information once. The second pass preserves original order while using constant-time average lookup for the count.

#### Pragmatic Java Choice

Use `HashMap<Integer, Integer>` because the problem is explicitly about value-to-count mapping.

#### Java Solution

```java
import java.util.HashMap;
import java.util.Map;

class FirstNonRepeatingIntegerExample {
    static int firstNonRepeatingBruteForce(int[] values) {
        for (int value : values) {
            int count = 0;
            for (int candidate : values) {
                if (candidate == value) {
                    count++;
                }
            }
            if (count == 1) {
                return value;
            }
        }
        return -1;
    }

    static int firstNonRepeatingOptimized(int[] values) {
        Map<Integer, Integer> frequency = new HashMap<>();
        for (int value : values) {
            frequency.put(value, frequency.getOrDefault(value, 0) + 1);
        }

        for (int value : values) {
            if (frequency.get(value) == 1) {
                return value;
            }
        }

        return -1;
    }
}
```

#### Dry Run

Use `values = [4, 5, 1, 2, 1, 2, 4]`.

Optimized approach:
- first pass builds `{4=2, 5=1, 1=2, 2=2}`
- second pass checks `4` -> count `2`
- checks `5` -> count `1`
- return `5`

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(1)` extra space
- Better approach: average `O(n)` time, `O(n)` extra space

#### Edge Cases

- empty array -> return `-1`
- all values repeated -> return `-1`
- first element already unique -> return it immediately in the second pass

#### Common Mistakes

- returning the smallest unique value instead of the first unique by position
- counting correctly but iterating over map keys instead of the original array order
- using a set when counts are actually needed

### Worked Example 2: Longest Consecutive Sequence
#### Problem Statement

Given an unsorted integer array, return the length of the longest run of consecutive integers.

#### Why This Example Matters

It demonstrates why `HashSet` is not just for duplicate detection. It can also support fast expansion from carefully chosen starting points.

#### Constraints or Assumptions

- input may be unsorted
- duplicates may exist
- the answer depends on values, not original positions

#### Brute-Force Approach

Sort the array and then scan to measure the longest consecutive run.

This is much better than a naive nested search, but sorting still costs `O(n log n)` time.

#### Better Approach

Insert all unique values into a `HashSet`. Start a run only from numbers that do not have a predecessor `value - 1`. Then extend forward while the next consecutive value exists.

#### Why the Better Approach Works

Every consecutive chain has exactly one true start: the first value whose predecessor is absent. By only expanding from starts, the algorithm avoids redundant work.

#### Pragmatic Java Choice

Use `HashSet<Integer>` because the task is pure membership checking.

#### Java Solution

```java
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

class LongestConsecutiveSequenceExample {
    static int longestConsecutiveBruteForce(int[] values) {
        if (values.length == 0) {
            return 0;
        }

        int[] copy = Arrays.copyOf(values, values.length);
        Arrays.sort(copy);

        int best = 1;
        int current = 1;

        for (int index = 1; index < copy.length; index++) {
            if (copy[index] == copy[index - 1]) {
                continue;
            }
            if (copy[index] == copy[index - 1] + 1) {
                current++;
            } else {
                current = 1;
            }
            best = Math.max(best, current);
        }

        return best;
    }

    static int longestConsecutiveOptimized(int[] values) {
        Set<Integer> present = new HashSet<>();
        for (int value : values) {
            present.add(value);
        }

        int best = 0;
        for (int value : present) {
            if (present.contains(value - 1)) {
                continue;
            }

            int currentLength = 1;
            int currentValue = value;
            while (present.contains(currentValue + 1)) {
                currentValue++;
                currentLength++;
            }
            best = Math.max(best, currentLength);
        }

        return best;
    }
}
```

#### Dry Run

Use `values = [100, 4, 200, 1, 3, 2]`.

Optimized approach:
- set becomes `{100, 4, 200, 1, 3, 2}`
- `100` has no predecessor `99`, run length is `1`
- `4` has predecessor `3`, so skip as a start
- `200` has no predecessor `199`, run length is `1`
- `1` has no predecessor `0`, expand to `2`, `3`, `4`
- best becomes `4`

#### Time and Space Complexity

- Brute force: `O(n log n)` time, `O(n)` extra space for the copy
- Better approach: average `O(n)` time, `O(n)` extra space

#### Edge Cases

- empty array -> `0`
- all duplicates -> `1`
- negative values work exactly the same way

#### Common Mistakes

- starting a scan from every value instead of only true sequence starts
- forgetting to skip duplicates in the sorting approach
- using a map when simple membership is enough

### Worked Example 3: Count Unique Grid Points with a Custom Key
#### Problem Statement

Given a list of integer coordinate pairs, return how many distinct points appear.

#### Why This Example Matters

It is the clearest beginner example of why custom classes need correct equality and hashing rules when used inside a `HashSet`.

#### Constraints or Assumptions

- points are defined only by `(row, column)`
- duplicate coordinates should count once
- point order does not matter

#### Brute-Force Approach

For each point, scan all earlier points and check whether the same coordinates already appeared.

This works, but duplicate detection costs `O(n^2)` time.

#### Better Approach

Create a `Point` class with correct `equals()` and `hashCode()`, insert every point into a `HashSet<Point>`, and return the set size.

#### Why the Better Approach Works

The set delegates duplicate detection to the custom equality rules. Once logical identity is defined correctly, insertion and membership are fast on average.

#### Pragmatic Java Choice

Manual `equals()` and `hashCode()` are better here than a string-encoding shortcut because they teach the actual Java rule behind custom hashing.

#### Java Solution

```java
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

class DistinctPointsExample {
    static final class Point {
        private final int row;
        private final int column;

        Point(int row, int column) {
            this.row = row;
            this.column = column;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (!(other instanceof Point point)) {
                return false;
            }
            return row == point.row && column == point.column;
        }

        @Override
        public int hashCode() {
            return Objects.hash(row, column);
        }
    }

    static int countDistinctBruteForce(int[][] coordinates) {
        int distinct = 0;
        for (int index = 0; index < coordinates.length; index++) {
            boolean seenEarlier = false;
            for (int previous = 0; previous < index; previous++) {
                if (coordinates[index][0] == coordinates[previous][0]
                        && coordinates[index][1] == coordinates[previous][1]) {
                    seenEarlier = true;
                    break;
                }
            }
            if (!seenEarlier) {
                distinct++;
            }
        }
        return distinct;
    }

    static int countDistinctOptimized(int[][] coordinates) {
        Set<Point> points = new HashSet<>();
        for (int[] coordinate : coordinates) {
            points.add(new Point(coordinate[0], coordinate[1]));
        }
        return points.size();
    }
}
```

#### Dry Run

Use `coordinates = [[1, 2], [3, 4], [1, 2], [5, 1]]`.

Optimized approach:
- add `(1, 2)` -> set size `1`
- add `(3, 4)` -> set size `2`
- add `(1, 2)` again -> equality says it already exists, size stays `2`
- add `(5, 1)` -> set size `3`
- return `3`

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(1)` extra space
- Better approach: average `O(n)` time, `O(n)` extra space

#### Edge Cases

- empty input -> `0`
- all points identical -> `1`
- negative coordinates still hash and compare normally

#### Common Mistakes

- overriding `equals()` but forgetting `hashCode()`
- using mutable coordinate fields and changing them after insertion
- assuming matching hash codes alone mean objects are equal

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- nested-loop lookup and counting often cost `O(n^2)`
- sorting can reduce some problems to `O(n log n)` without hashing
- hash-based lookup often brings the cost down to average `O(n)` with `O(n)` extra space
- custom-key hashing adds implementation responsibility even when the asymptotic complexity stays strong

Choose brute force or sorting when:
- the input is tiny
- the ordering created by sorting is directly useful
- extra hash-based state would make a simple one-off solution harder to read than necessary

Choose hashing when:
- the same lookup happens repeatedly
- the problem asks for counts, membership, first repeats, or grouping by key
- you want to remove repeated scanning from a baseline solution

Recognition signals for hashing:
- "have we seen this before?"
- "how many times does this appear?"
- "group equal items together"
- "find a complement quickly"
- "deduplicate these records"

Signals not to force hashing:
- the problem depends mainly on sorted order or minimum and maximum access
- the input is a short fixed alphabet, where an array may be simpler than a map
- the solution needs contiguous-window logic more than standalone lookup

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- using the wrong container type for the actual question
- updating the map in the wrong order
- assuming iteration order is meaningful
- forgetting custom equality rules for object keys

Null, empty input, and boundary-condition handling:
- empty arrays or lists
- blank input for string-based counting tasks
- single-element cases where the answer is immediate
- repeated identical values that should collapse to one set entry or many map counts

Collision, mutation, and stale-state risks:
- mutable keys inside a hash-based collection
- comparing reference identity instead of logical equality
- reusing one map across test cases without clearing it

Short debugging checklist:
- What exact key am I inserting?
- Should this problem use a map or a set?
- Am I preserving original order when the answer requires it?
- If I use a custom class, do `equals()` and `hashCode()` describe the same identity?
- Did I accidentally rely on iteration order from a hash-based collection?

## 6. Practice Problems

### Easy

- Title: Contains Duplicate
  - One-line prompt: Return whether any value appears at least twice in the array.
  - Expected pattern or core idea: HashSet membership check.
- Title: Two Sum
  - One-line prompt: Find two indexes whose values add to a target.
  - Expected pattern or core idea: Complement lookup in a HashMap.
- Title: First Unique Character in a String
  - One-line prompt: Return the first index whose character appears exactly once.
  - Expected pattern or core idea: Frequency counting followed by an order-preserving scan.

### Medium

- Title: Group Anagrams
  - One-line prompt: Group strings that contain the same character multiset.
  - Expected pattern or core idea: Build a stable key and map strings to that key.
- Title: Longest Consecutive Sequence
  - One-line prompt: Return the longest run of consecutive values in an unsorted array.
  - Expected pattern or core idea: HashSet membership with true-sequence-start detection.
- Title: Top K Frequent Elements
  - One-line prompt: Return the `k` most frequent values from an array.
  - Expected pattern or core idea: Frequency map followed by ordering or bucket selection.

### Hard

- Title: Subarray Sum Equals K
  - One-line prompt: Count how many subarrays sum to `k`.
  - Expected pattern or core idea: Prefix sums combined with hashing.
- Title: Longest Substring with At Most K Distinct Characters
  - One-line prompt: Return the maximum-length substring containing at most `k` distinct characters.
  - Expected pattern or core idea: HashMap frequency state inside a sliding window.
- Title: Design HashMap
  - One-line prompt: Build a hash map implementation that supports insert, delete, and get.
  - Expected pattern or core idea: Collision handling and bucket design.

## 7. Short Recap

The core idea of this chapter is that hashing lets you remember what earlier work discovered, so later lookups stop repeating the same scan.

The most important optimization insight is that many `O(n^2)` lookup and counting tasks become average `O(n)` once you store counts or seen values explicitly.

The most important implementation warning is that correctness depends on equality rules. Custom objects must define `equals()` and `hashCode()` together.

This chapter prepares the next chapter by teaching how to eliminate repeated work. Two-pointer techniques continue that idea, but with movement rules instead of remembered lookup state.

## 8. Coverage Check

- [x] 5.1 HashMap fundamentals
- [x] 5.2 HashSet fundamentals
- [x] 5.3 Frequency maps and counting patterns
- [x] 5.4 Collision handling basics
- [x] 5.5 Custom hashing and equality in Java

Coverage Summary: 5/5 official subtopics covered
This must always be 5/5 before final output

Next: 6: Two Pointers
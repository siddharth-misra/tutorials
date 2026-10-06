# 4: Strings

**Goal:** Teach learners how to reason about strings as indexed character sequences, handle traversal and counting safely, distinguish substrings from subsequences, solve basic palindrome tasks, and build efficient string solutions in Java.
**Outcome:** By the end of this chapter, you can work with `String` and `char[]` confidently, count character frequencies, explain the difference between substrings and subsequences, solve common palindrome checks, use `StringBuilder` when repeated updates are needed, and recognize several core interview-style string patterns.

---

## 1. Intuition First

Strings are arrays of meaning. Instead of storing just numbers, they store ordered characters that combine into words, identifiers, patterns, and encoded information. That makes them one of the most common interview data types.

A simple real-world analogy is a train of labeled carriages. Each carriage holds one character, and the order matters. If you change or remove one carriage, the full message may change. That is why string problems are usually about order, grouping, comparison, or transformation.

The core mental model is this: a string problem is usually an indexing problem in disguise. You solve it by deciding where to start, where to stop, what state to carry, and whether you should inspect, count, compare, or rebuild characters.

The most common beginner confusion point is forgetting that Java `String` objects are immutable. You can read characters easily, but you cannot edit a string in place. If you need repeated modifications, you usually want `StringBuilder` or a character array.

In the roadmap, this chapter turns raw indexing skill into text-processing skill. It prepares you for hashing, sliding windows, and more advanced pattern matching later.

## 2. Core Concepts and Techniques

### Concept Cluster: String Basics, Character Arrays, and Frequency Counting
Key concepts in this block:
- 4.1 Character arrays and string fundamentals
- 4.2 String traversal and frequency counting

#### Intuition

A Java `String` is an immutable sequence of characters. A `char[]` is a mutable array of characters. Traversal means visiting characters in order. Frequency counting means recording how often each character appears.

#### Why It Matters

Many string problems are just careful traversal plus a good summary structure. If you understand what can and cannot be modified directly, your code becomes much safer.

#### How It Works

Core facts:
- `text.charAt(index)` reads one character
- `text.length()` returns the number of characters
- `text.toCharArray()` creates a mutable character array copy
- `String` does not support in-place updates

Frequency counting choices:
- use `int[26]` when the problem guarantees lowercase English letters
- use `int[128]` or `int[256]` for small fixed ASCII ranges
- use a `HashMap<Character, Integer>` when the character set is not small or fixed

#### Java Implementation Notes

- Compare strings with `.equals()`, not `==`.
- Use indexed loops when position matters.
- Convert to `char[]` only when mutation or repeated access patterns make it useful.

#### Common Mistakes

- using `==` to compare string contents
- assuming `String` can be changed in place
- using a fixed-size frequency array when the input may contain characters outside that range
- forgetting to normalize case when the problem says case should be ignored

#### Quick Example

```java
static int[] lowercaseFrequency(String text) {
    int[] frequency = new int[26];
    for (int index = 0; index < text.length(); index++) {
        char current = text.charAt(index);
        frequency[current - 'a']++;
    }
    return frequency;
}
```

#### Debugging Tip

When character counting looks wrong, print the index, the character, and the bucket being updated. That usually reveals case or range assumptions immediately.

#### Advanced Note

Choosing a frequency array instead of a map is an early example of using problem constraints to simplify both code and complexity.

### Concept Cluster: Substrings, Subsequences, and Palindromes
Key concepts in this block:
- 4.3 Substrings and subsequences
- 4.4 Palindrome problems

#### Intuition

A substring is a contiguous block of characters. A subsequence preserves order but can skip characters. A palindrome reads the same forward and backward.

#### Why It Matters

These definitions control the entire solution. Many beginner mistakes happen because a problem asks for a subsequence and the learner accidentally thinks in substrings, or because a palindrome problem is solved with unnecessary rebuilding.

#### How It Works

Key distinctions:
- substring: characters stay together without gaps
- subsequence: characters stay in order but may have gaps
- palindrome: compare symmetric positions from the ends inward

Common approaches:
- use `substring(left, rightExclusive)` when you explicitly need a contiguous piece
- use a scan over two strings to test subsequence relationships
- use either reverse-and-compare or inward comparison for palindrome checks

#### Java Implementation Notes

- `substring(begin, end)` includes `begin` and excludes `end`.
- Be precise about inclusive and exclusive boundaries.
- For palindrome checks that ignore punctuation or case, normalize consistently before comparing.

#### Common Mistakes

- thinking substring and subsequence mean the same thing
- off-by-one errors with `substring`
- comparing raw characters when the problem says to ignore case or symbols
- building too many temporary strings inside loops

#### Quick Example

```java
static boolean isSubsequence(String small, String large) {
    int smallIndex = 0;
    int largeIndex = 0;

    while (smallIndex < small.length() && largeIndex < large.length()) {
        if (small.charAt(smallIndex) == large.charAt(largeIndex)) {
            smallIndex++;
        }
        largeIndex++;
    }

    return smallIndex == small.length();
}
```

#### Debugging Tip

For substring or palindrome bugs, write the exact left and right boundaries on paper. Most errors come from boundary interpretation, not from the comparison itself.

#### Advanced Note

Many advanced string algorithms are still built on these same definitions. If substring and subsequence are not stable concepts yet, harder string topics become confusing very quickly.

### Concept Cluster: StringBuilder and Interview Workflows
Key concepts in this block:
- 4.5 StringBuilder and mutable string workflows
- 4.6 Common interview string patterns

#### Intuition

`StringBuilder` is a mutable buffer for text. It lets you append, delete, reverse, and edit characters without creating a new `String` on every change.

#### Why It Matters

Repeated string concatenation inside loops can quietly become expensive. `StringBuilder` is the standard Java tool for efficient incremental string construction.

#### How It Works

Useful interview string patterns:
- normalize input first if case, spaces, or punctuation should be ignored
- count characters when equality or grouping depends on composition
- compare from both ends for palindrome-style questions
- build the final answer incrementally with `StringBuilder`
- parse one character at a time when tokens or groups matter

#### Java Implementation Notes

- `builder.append(...)` is usually the main operation.
- `builder.reverse()` is useful when reversal is the final goal.
- `builder.length()` tells you whether to insert separators such as spaces or commas.

#### Common Mistakes

- using `result = result + nextPart` inside a long loop
- forgetting that `StringBuilder` itself is mutable and may need clearing between test cases
- appending separators in the wrong place and then trimming awkwardly later
- treating a parsing problem as a one-line library trick before understanding the character rules

#### Quick Example

```java
static String normalizeLettersOnly(String text) {
    StringBuilder builder = new StringBuilder();
    for (int index = 0; index < text.length(); index++) {
        char current = text.charAt(index);
        if (Character.isLetter(current)) {
            builder.append(Character.toLowerCase(current));
        }
    }
    return builder.toString();
}
```

#### Debugging Tip

If the built string is almost correct but formatting is off, print the builder state after each append. Separator bugs usually become obvious immediately.

#### Advanced Note

Efficient string building is often the difference between a clean linear solution and a slower solution with hidden quadratic behavior.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Check Whether Two Strings Are Anagrams
#### Problem Statement

Given two strings `first` and `second`, return `true` if one string is an anagram of the other. Assume the strings contain only lowercase English letters.

#### Why This Example Matters

It is one of the clearest demonstrations of how frequency counting beats repeated or heavier comparison work.

#### Constraints or Assumptions

- both strings contain only lowercase English letters
- order does not matter, but character counts must match exactly
- equal lengths are required

#### Brute-Force Approach

Convert both strings to character arrays, sort them, and compare the sorted arrays.

This works because anagrams have the same characters after sorting, but sorting costs `O(n log n)` time.

#### Better Approach

Use a frequency array of size 26. Count characters from the first string and subtract characters from the second.

#### Why the Better Approach Works

An anagram condition is really a frequency equality condition. Sorting proves that indirectly. Counting proves it directly.

#### Pragmatic Java Choice

For lowercase English letters, `int[26]` is simpler and faster than a `HashMap<Character, Integer>`.

#### Java Solution

```java
import java.util.Arrays;

class ValidAnagramExample {
    static boolean isAnagramBruteForce(String first, String second) {
        if (first.length() != second.length()) {
            return false;
        }

        char[] left = first.toCharArray();
        char[] right = second.toCharArray();
        Arrays.sort(left);
        Arrays.sort(right);
        return Arrays.equals(left, right);
    }

    static boolean isAnagramOptimized(String first, String second) {
        if (first.length() != second.length()) {
            return false;
        }

        int[] frequency = new int[26];
        for (int index = 0; index < first.length(); index++) {
            frequency[first.charAt(index) - 'a']++;
            frequency[second.charAt(index) - 'a']--;
        }

        for (int count : frequency) {
            if (count != 0) {
                return false;
            }
        }
        return true;
    }
}
```

#### Dry Run

Use `first = "listen"` and `second = "silent"`.

Optimized approach:
- count `listen` -> buckets for `l, i, s, t, e, n` increase
- subtract `silent` -> the same buckets decrease back to zero
- every frequency entry ends at zero -> return `true`

#### Time and Space Complexity

- Brute force: `O(n log n)` time, `O(n)` extra space for sorted arrays
- Optimized: `O(n)` time, `O(1)` extra space because the frequency array size is fixed

#### Edge Cases

- different lengths -> immediately `false`
- both empty strings -> `true`
- repeated characters -> handled by counts naturally

#### Common Mistakes

- forgetting the equal-length check
- using a 26-size array when the input is not guaranteed to be lowercase English letters
- sorting strings repeatedly inside a loop instead of once

### Worked Example 2: Valid Palindrome Ignoring Case and Symbols
#### Problem Statement

Given a string, return `true` if it reads the same forward and backward after ignoring non-alphanumeric characters and letter case.

#### Why This Example Matters

It teaches normalization, boundary movement, and a very common interview comparison pattern.

#### Constraints or Assumptions

- letters, digits, spaces, and punctuation may all appear
- comparison should ignore non-alphanumeric characters
- comparison should ignore case

#### Brute-Force Approach

Build a cleaned lowercase string containing only alphanumeric characters. Reverse that cleaned string and compare it with the original cleaned string.

This is correct, but it builds extra strings.

#### Better Approach

Use two indexes, one from the left and one from the right. Skip non-alphanumeric characters on both sides and compare lowercase characters directly.

#### Why the Better Approach Works

Palindrome logic only needs symmetric comparison. Once both pointers land on valid comparable characters, you can decide immediately whether the string remains a candidate.

#### Pragmatic Java Choice

Use `Character.isLetterOrDigit` and `Character.toLowerCase` so the code stays clear and handles letters and digits correctly.

#### Java Solution

```java
class ValidPalindromeExample {
    static boolean isPalindromeBruteForce(String text) {
        StringBuilder cleaned = new StringBuilder();
        for (int index = 0; index < text.length(); index++) {
            char current = text.charAt(index);
            if (Character.isLetterOrDigit(current)) {
                cleaned.append(Character.toLowerCase(current));
            }
        }

        String normalized = cleaned.toString();
        String reversed = cleaned.reverse().toString();
        return normalized.equals(reversed);
    }

    static boolean isPalindromeOptimized(String text) {
        int left = 0;
        int right = text.length() - 1;

        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(text.charAt(left))) {
                left++;
            }
            while (left < right && !Character.isLetterOrDigit(text.charAt(right))) {
                right--;
            }

            char leftChar = Character.toLowerCase(text.charAt(left));
            char rightChar = Character.toLowerCase(text.charAt(right));
            if (leftChar != rightChar) {
                return false;
            }

            left++;
            right--;
        }

        return true;
    }
}
```

#### Dry Run

Use `text = "A man, a plan, a canal: Panama"`.

Optimized approach:
- left `A`, right `a` -> equal after lowercase
- skip spaces and punctuation until left `m`, right `m`
- continue inward with matching pairs
- no mismatch appears -> return `true`

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(n)` extra space
- Optimized: `O(n)` time, `O(1)` extra space

#### Edge Cases

- empty string -> `true`
- string with only punctuation -> `true` after ignoring all symbols
- mixed digits and letters -> digits compare normally

#### Common Mistakes

- comparing raw characters without lowercasing
- forgetting to skip symbols on one side or both
- thinking an empty cleaned string should be `false`

### Worked Example 3: Reverse Words in a Sentence
#### Problem Statement

Given a string that may contain leading, trailing, or repeated spaces, return a new string with the words in reverse order and exactly one space between words.

#### Why This Example Matters

This is a practical `StringBuilder` problem. It also shows how interview string tasks often combine parsing and formatting rules.

#### Constraints or Assumptions

- words are separated by spaces
- the output should not contain leading or trailing spaces
- multiple spaces between words should collapse to one space in the result

#### Brute-Force Approach

Split the trimmed string into words and rebuild the answer using repeated string concatenation with `+`.

This is easy to write, but repeated concatenation inside a loop creates many temporary strings.

#### Better Approach

Scan from the end of the string, locate each word boundary, and append each word to a `StringBuilder`.

#### Why the Better Approach Works

The scan processes each character a small number of times and builds the output incrementally without repeated full-string copying.

#### Pragmatic Java Choice

Use `StringBuilder` because the output is assembled piece by piece.

#### Java Solution

```java
class ReverseWordsExample {
    static String reverseWordsBruteForce(String text) {
        String trimmed = text.trim();
        if (trimmed.isEmpty()) {
            return "";
        }

        String[] words = trimmed.split("\\s+");
        String result = "";
        for (int index = words.length - 1; index >= 0; index--) {
            result += words[index];
            if (index > 0) {
                result += " ";
            }
        }
        return result;
    }

    static String reverseWordsOptimized(String text) {
        StringBuilder builder = new StringBuilder();
        int end = text.length() - 1;

        while (end >= 0) {
            while (end >= 0 && text.charAt(end) == ' ') {
                end--;
            }
            if (end < 0) {
                break;
            }

            int start = end;
            while (start >= 0 && text.charAt(start) != ' ') {
                start--;
            }

            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(text, start + 1, end + 1);
            end = start - 1;
        }

        return builder.toString();
    }
}
```

#### Dry Run

Use `text = "  the   sky is blue  "`.

Optimized approach:
- skip trailing spaces
- find word `blue`, append -> `"blue"`
- find word `is`, append -> `"blue is"`
- find word `sky`, append -> `"blue is sky"`
- find word `the`, append -> `"blue is sky the"`

#### Time and Space Complexity

- Brute force: often `O(n^2)` total time because of repeated concatenation, plus split storage
- Optimized: `O(n)` time, `O(n)` extra space for the output builder

#### Edge Cases

- all spaces -> return empty string
- one word only -> unchanged except trimming
- repeated internal spaces -> collapse to one space in the output

#### Common Mistakes

- forgetting to trim or skip extra spaces
- appending an extra space at the front or end
- using repeated `+` concatenation in a long loop and hiding the real cost

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- simple traversal is usually `O(n)` and should be your default baseline
- sorting-based string comparison often costs `O(n log n)`
- frequency counting can reduce many comparison problems to `O(n)`
- reverse-and-compare palindrome solutions are simple but often use extra memory
- `StringBuilder` avoids the hidden repeated-copy cost of string concatenation in loops

Choose the simpler approach when:
- the input is small and clarity matters most
- the one-off transformation is easy to reason about with a cleaned copy
- extra memory is acceptable and improves readability

Choose the optimized approach when:
- you are traversing large strings
- the solution builds or edits the result repeatedly
- the same comparison can be expressed through fixed-size counting

Recognition signals for string techniques:
- order of characters matters
- case or punctuation rules affect comparison
- the task asks for counting, grouping, or equivalence
- the answer is itself another string that must be built incrementally

Signals not to force these techniques:
- the problem is mainly about key-based counting across many items, where hashing may fit better
- the solution requires window movement or advanced pattern search, which later chapters handle directly
- you are using substring creation heavily when a simple index range would be enough

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:
- off-by-one errors in string boundaries
- assuming a string can be modified directly
- forgetting to normalize case, spaces, or symbols when the problem requires it
- using the wrong frequency structure for the character set

Null, empty, and boundary-condition handling:
- empty strings
- strings made only of spaces or punctuation
- single-character strings
- mismatched lengths in comparison problems

Stale-state and mutation risks:
- reusing a `StringBuilder` without clearing it
- reversing a builder and forgetting it has changed permanently
- mixing cleaned and original indexes in the same logic

Short debugging checklist:
- What does each index point to right now?
- Am I treating substring and subsequence as different concepts?
- Did I normalize exactly what the problem says to ignore?
- Am I building the answer efficiently or recreating many temporary strings?
- Does my frequency structure match the character set assumptions?

## 6. Practice Problems

### Easy

- Title: Valid Anagram
  - One-line prompt: Decide whether two strings contain the same characters with the same counts.
  - Expected pattern or core idea: Sorting baseline versus frequency counting.
- Title: Is Subsequence
  - One-line prompt: Return whether one string appears in another in order, but not necessarily contiguously.
  - Expected pattern or core idea: Separate substring thinking from subsequence thinking and scan carefully.
- Title: Longest Common Prefix
  - One-line prompt: Find the longest prefix shared by all strings in an array.
  - Expected pattern or core idea: Character-by-character comparison with early stopping.

### Medium

- Title: Group Anagrams
  - One-line prompt: Group strings that are anagrams of each other.
  - Expected pattern or core idea: Use normalized representations and frequency signatures.
- Title: Longest Palindromic Substring
  - One-line prompt: Return the longest contiguous palindrome in the string.
  - Expected pattern or core idea: Palindrome expansion and careful boundary movement.
- Title: Reverse Words in a String
  - One-line prompt: Reverse the word order while cleaning up spaces.
  - Expected pattern or core idea: Parsing plus efficient output construction.

### Hard

- Title: Minimum Window Substring
  - One-line prompt: Find the smallest substring that contains all characters of another string.
  - Expected pattern or core idea: Frequency counting combined with dynamic window state.
- Title: Palindrome Partitioning II
  - One-line prompt: Split a string into palindromic pieces using the fewest cuts.
  - Expected pattern or core idea: Build on palindrome recognition and later dynamic programming ideas.
- Title: Regular Expression Matching
  - One-line prompt: Match a string against a pattern containing `.` and `*`.
  - Expected pattern or core idea: Careful state reasoning and formal recurrence design.

## 7. Short Recap

The core idea of this chapter is that string problems become much easier when you treat a string as an indexed sequence of characters and choose the right representation for the job.

The most important optimization insight is that counting and `StringBuilder` often remove unnecessary work. Many string problems do not need repeated sorting or repeated concatenation.

The most important implementation warning is to be precise about immutability, boundaries, and normalization rules.

This chapter prepares the next chapter by turning character counting and lookup intuition into the hashing mindset used throughout DSA.

## 8. Coverage Check

- [x] 4.1 Character arrays and string fundamentals
- [x] 4.2 String traversal and frequency counting
- [x] 4.3 Substrings and subsequences
- [x] 4.4 Palindrome problems
- [x] 4.5 StringBuilder and mutable string workflows
- [x] 4.6 Common interview string patterns

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 5: Hashing
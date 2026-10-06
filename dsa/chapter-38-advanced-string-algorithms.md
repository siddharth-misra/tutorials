# 38: Advanced String Algorithms

**Goal:** Teach how to solve string-matching problems efficiently with linear-time prefix methods, rolling hashes, and trie-based matching strategies.
**Outcome:** By the end of this chapter, you can implement KMP, Z algorithm, and Rabin-Karp in Java, explain rolling hash mechanics, use trie-based prefix matching, and choose the right string-matching tool by constraints.

---

## 1. Intuition First

This chapter matters because brute-force string matching wastes work. When you shift a pattern by one character and compare almost the same prefix again, a good algorithm should reuse what is already known.

A simple real-world analogy is searching a long document for a phrase. If the phrase almost matches and then fails near the end, you should not restart from zero if part of that failed attempt still gives information about the next possible alignment.

The core mental model is:

- preprocess the pattern, the text, or both
- reuse structural information instead of restarting full comparisons
- choose the algorithm based on whether you need exact one-pattern search, hash-based filtering, or many-prefix matching

The most common beginner confusion point is treating all string-matching algorithms as interchangeable. They solve related problems, but their trade-offs differ in preprocessing, collision risk, multiple-pattern support, and implementation complexity.

This chapter continues the advanced-pattern mindset of Part VII. The next chapter shifts from strings to monotonic structures and interval reasoning.

## 2. Core Concepts and Techniques

### Concept Cluster: Linear Prefix-Based Matching
Key concepts in this block:
- 38.1 KMP algorithm
- 38.2 Z algorithm

#### Intuition

Both KMP and Z algorithm avoid recomparing known matching prefixes.

#### Why It Matters

They give linear-time exact pattern matching without probabilistic hashing.

#### How It Works

KMP:

- preprocess the pattern's longest proper prefix that is also a suffix, often called LPS
- when a mismatch happens, jump within the pattern instead of restarting from the next text index blindly

Z algorithm:

- compute, for each position, the length of the longest substring starting there that matches the overall string prefix
- for pattern search, run Z on `pattern + separator + text`

#### Java Implementation Notes

- KMP code is easier to maintain if LPS construction is separate from search.
- Use a separator character in Z concatenation that does not appear in either input.
- Keep index movement explicit to avoid infinite loops after mismatch handling.

#### Common Mistakes

- incorrect LPS fallback on mismatch
- using a separator that appears in the pattern or text for Z algorithm
- forgetting to record full matches when the matched length equals the pattern length

#### Quick Example

If the pattern prefix `"abab"` already matched and a mismatch occurs next, KMP can often resume with the shorter border `"ab"` instead of starting from zero.

#### Debugging Tip

Print the LPS or Z array for a tiny pattern first. If preprocessing is wrong, the search phase will be wrong too.

#### Advanced Note

KMP and Z are both linear, but some developers find one preprocessing array easier to reason about than the other. Learn both so you can choose the cleaner explanation in an interview.

### Concept Cluster: Hash-Based Matching
Key concepts in this block:
- 38.3 Rabin-Karp
- 38.4 Rolling hash

#### Intuition

Instead of comparing whole substrings character by character, compare compact numeric fingerprints that update in constant time as the window slides.

#### Why It Matters

Hashing can be simple and fast in practice, especially for repeated window checks or multiple patterns of the same length.

#### How It Works

Rolling hash:

- represent a string window as a polynomial-like hash
- remove the outgoing character contribution
- shift by the base and add the incoming character contribution

Rabin-Karp:

- compare the hash of the pattern with each text-window hash
- when hashes match, verify the actual substring to guard against collisions

#### Java Implementation Notes

- Use `long` and a modulus to reduce overflow.
- Precompute powers of the base when needed.
- Always keep the collision-check verification step in exact matching code.

#### Common Mistakes

- forgetting modulus normalization after subtraction
- assuming equal hashes always mean equal substrings
- inconsistent character encoding in the hash formula

#### Quick Example

When moving from window `"abc"` to `"bcd"`, rolling hash removes `'a'`, shifts the remaining contribution, and adds `'d'`.

#### Debugging Tip

On a short text, print the window substring and its hash together to verify the rolling update logic.

#### Advanced Note

Double hashing can reduce collision risk further, but the conceptual model is the same.

### Concept Cluster: Trie Matching and Algorithm Choice
Key concepts in this block:
- 38.5 Trie-based string matching
- 38.6 Choosing the right string-matching approach

#### Intuition

Tries are useful when many patterns share prefixes. Algorithm choice depends on whether the main cost comes from one pattern, many patterns, or repeated substring comparisons.

#### Why It Matters

Choosing the wrong matcher is a frequent interview mistake. The best method depends on the exact query pattern and constraints.

#### How It Works

Trie-based string matching:

- build a trie from patterns or dictionary words
- walk characters from each relevant text position or query prefix
- report matches whenever a terminal trie node is reached

Choosing the right approach:

- KMP for deterministic one-pattern search
- Z algorithm for elegant prefix-based matching setups
- Rabin-Karp for rolling-window hashing and repeated equal-length checks
- trie-based matching for many shared-prefix patterns or dictionary-driven prefix matching

#### Java Implementation Notes

- Use array children for lowercase letters when the alphabet is fixed and small.
- Store terminal markers or counts at trie nodes.
- Separate the trie build phase from the text scan phase.

#### Common Mistakes

- building a trie when one pattern is enough and KMP would be simpler
- forgetting to reset the trie walk when scanning from a new start position
- choosing hashing without thinking about collisions or pattern lengths

#### Quick Example

If the dictionary contains `"cat"`, `"car"`, and `"care"`, then all three share the path for prefix `"ca"` in the trie.

#### Debugging Tip

Before coding the full matcher, verify the trie insert and one simple prefix walk with a hand-built dictionary.

#### Advanced Note

More advanced multiple-pattern matching structures build on trie ideas, but the core prefix-sharing intuition starts here.

## 3. Worked Examples and Full Solutions

### Worked Example 1: KMP Exact Pattern Search
#### Problem Statement

Given a text and a pattern, return all starting indices where the pattern appears in the text.

#### Why This Example Matters

This is the canonical exact pattern-matching problem for KMP.

#### Constraints or Assumptions

- exact case-sensitive matching
- overlapping matches should be reported
- empty pattern handling should be explicit

#### Brute-Force Approach

Try every starting index in the text and compare the pattern character by character.

That costs `O(textLength * patternLength)` in the worst case.

#### Better Approach

Precompute the LPS array and run KMP.

#### Why the Better Approach Works

The LPS array tells how much matched-prefix information can be reused after a mismatch, so the text index never moves backward.

#### Pragmatic Java Choice

Split the solution into LPS construction and search.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class KmpSearchExample {
    static List<Integer> search(String text, String pattern) {
        List<Integer> matches = new ArrayList<>();
        if (pattern.isEmpty()) {
            return matches;
        }

        int[] lps = buildLps(pattern);
        int textIndex = 0;
        int patternIndex = 0;

        while (textIndex < text.length()) {
            if (text.charAt(textIndex) == pattern.charAt(patternIndex)) {
                textIndex++;
                patternIndex++;

                if (patternIndex == pattern.length()) {
                    matches.add(textIndex - pattern.length());
                    patternIndex = lps[patternIndex - 1];
                }
            } else if (patternIndex > 0) {
                patternIndex = lps[patternIndex - 1];
            } else {
                textIndex++;
            }
        }

        return matches;
    }

    private static int[] buildLps(String pattern) {
        int[] lps = new int[pattern.length()];
        int length = 0;

        for (int index = 1; index < pattern.length(); ) {
            if (pattern.charAt(index) == pattern.charAt(length)) {
                length++;
                lps[index] = length;
                index++;
            } else if (length > 0) {
                length = lps[length - 1];
            } else {
                lps[index] = 0;
                index++;
            }
        }

        return lps;
    }
}
```

#### Dry Run

Text: `"ababcabcabababd"`, pattern: `"ababd"`

- KMP matches several prefix characters
- after a mismatch, the LPS array says how far the pattern index can fall back
- the search continues without restarting full text comparisons
- final match occurs at index `10`

#### Time and Space Complexity

Brute-force matching:

- Time: `O(n * m)`
- Space: `O(1)`

KMP:

- Time: `O(n + m)`
- Space: `O(m)`

#### Edge Cases

- empty pattern
- pattern longer than text
- repeated-prefix patterns such as `"aaaa"`

#### Common Mistakes

- wrong LPS fallback logic
- failing to allow overlapping matches
- moving both indices incorrectly after mismatch

### Worked Example 2: Pattern Search with Z Algorithm
#### Problem Statement

Given a text and a pattern, return all starting indices where the pattern appears in the text using the Z algorithm.

#### Why This Example Matters

This example shows a different linear-time view of the same matching problem through prefix matches.

#### Constraints or Assumptions

- choose a separator not present in the inputs
- exact pattern matching only
- overlapping matches should be reported

#### Brute-Force Approach

Try every starting index in the text and compare character by character.

That is again `O(n * m)` in the worst case.

#### Better Approach

Build the Z array on `pattern + separator + text`.

#### Why the Better Approach Works

If the Z value at a position inside the text portion equals the pattern length, then the pattern matches starting there.

#### Pragmatic Java Choice

Keep the concatenated string and one reusable Z-array builder.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class ZAlgorithmSearchExample {
    static List<Integer> search(String text, String pattern) {
        List<Integer> matches = new ArrayList<>();
        if (pattern.isEmpty()) {
            return matches;
        }

        String combined = pattern + "#" + text;
        int[] z = buildZ(combined);
        int patternLength = pattern.length();

        for (int index = patternLength + 1; index < combined.length(); index++) {
            if (z[index] == patternLength) {
                matches.add(index - patternLength - 1);
            }
        }

        return matches;
    }

    private static int[] buildZ(String text) {
        int[] z = new int[text.length()];
        int left = 0;
        int right = 0;

        for (int index = 1; index < text.length(); index++) {
            if (index <= right) {
                z[index] = Math.min(right - index + 1, z[index - left]);
            }

            while (index + z[index] < text.length()
                    && text.charAt(z[index]) == text.charAt(index + z[index])) {
                z[index]++;
            }

            if (index + z[index] - 1 > right) {
                left = index;
                right = index + z[index] - 1;
            }
        }

        return z;
    }
}
```

#### Dry Run

Pattern `"ana"`, text `"bananas"`

- combined string is `"ana#bananas"`
- when a text position produces `z[index] = 3`, the pattern matches there
- matches occur at original text indices `1` and `3`

#### Time and Space Complexity

Brute-force matching:

- Time: `O(n * m)`
- Space: `O(1)`

Z algorithm:

- Time: `O(n + m)`
- Space: `O(n + m)` for the combined string and Z array

#### Edge Cases

- separator accidentally present in input
- pattern of length `1`
- repeated characters leading to large Z boxes

#### Common Mistakes

- wrong offset when converting a combined-string index back to a text index
- not shrinking Z reuse to the current box boundary
- misplacing the separator

### Worked Example 3: Rabin-Karp with Rolling Hash
#### Problem Statement

Given a text and a pattern, return all starting indices where the pattern appears in the text using Rabin-Karp.

#### Why This Example Matters

This example teaches rolling hash directly and shows where probabilistic filtering is useful.

#### Constraints or Assumptions

- exact case-sensitive matching
- collisions are handled by verification
- lowercase English letters are used in this implementation for simplicity

#### Brute-Force Approach

Compare each length-`m` text window directly with the pattern.

That costs `O(n * m)` in the worst case.

#### Better Approach

Use rolling hash to compare hashes first, then verify only on hash matches.

#### Why the Better Approach Works

The rolling hash updates a window in constant time, so most positions avoid full substring comparison.

#### Pragmatic Java Choice

Use `long`, a base, a modulus, and a verification step.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class RabinKarpExample {
    private static final long BASE = 911382323L;
    private static final long MOD = 1_000_000_007L;

    static List<Integer> search(String text, String pattern) {
        List<Integer> matches = new ArrayList<>();
        int n = text.length();
        int m = pattern.length();
        if (m == 0 || m > n) {
            return matches;
        }

        long highestPower = 1;
        for (int index = 1; index < m; index++) {
            highestPower = (highestPower * BASE) % MOD;
        }

        long patternHash = 0;
        long windowHash = 0;
        for (int index = 0; index < m; index++) {
            patternHash = (patternHash * BASE + pattern.charAt(index)) % MOD;
            windowHash = (windowHash * BASE + text.charAt(index)) % MOD;
        }

        for (int start = 0; start <= n - m; start++) {
            if (patternHash == windowHash && text.regionMatches(start, pattern, 0, m)) {
                matches.add(start);
            }

            if (start < n - m) {
                long outgoing = (text.charAt(start) * highestPower) % MOD;
                windowHash = (windowHash - outgoing + MOD) % MOD;
                windowHash = (windowHash * BASE + text.charAt(start + m)) % MOD;
            }
        }

        return matches;
    }
}
```

#### Dry Run

Text `"abracadabra"`, pattern `"abra"`

- compute the initial pattern and window hashes
- compare them at index `0`, verify the actual substring, and record a match
- roll the window one step at a time
- another verified match appears at index `7`

#### Time and Space Complexity

Brute-force matching:

- Time: `O(n * m)`
- Space: `O(1)`

Rabin-Karp:

- Average Time: `O(n + m)` plus verification on hash matches
- Worst-Case Time: `O(n * m)` if many collisions trigger verification
- Space: `O(1)` extra beyond output

#### Edge Cases

- pattern longer than text
- repeated-character windows
- collision-heavy adversarial cases

#### Common Mistakes

- forgetting modulus normalization after removing the outgoing character
- skipping substring verification after a hash match
- computing the wrong highest power

### Worked Example 4: Trie-Based Dictionary Matching in Text
#### Problem Statement

Given a dictionary of lowercase words and a text, return all starting indices where at least one dictionary word matches as a prefix of the text from that index.

#### Why This Example Matters

This example shows how trie-based string matching helps when many patterns share prefixes.

#### Constraints or Assumptions

- dictionary words and text use lowercase English letters
- matching any dictionary word from a start index is enough to report that start index
- overlapping matches are allowed

#### Brute-Force Approach

At each text position, compare every dictionary word character by character.

That repeats prefix work heavily.

#### Better Approach

Insert all dictionary words into a trie, then walk the trie from each start position.

#### Why the Better Approach Works

Shared prefixes are stored once. From a given start index, the trie walk explores only prefixes that actually exist in the dictionary.

#### Pragmatic Java Choice

Use fixed-size child arrays for lowercase letters.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class TrieTextMatchingExample {
    static final class TrieNode {
        final TrieNode[] children = new TrieNode[26];
        boolean isWord;
    }

    static List<Integer> matchStarts(String text, List<String> dictionary) {
        TrieNode root = new TrieNode();
        for (String word : dictionary) {
            insert(root, word);
        }

        List<Integer> starts = new ArrayList<>();
        for (int start = 0; start < text.length(); start++) {
            TrieNode current = root;
            for (int index = start; index < text.length(); index++) {
                int childIndex = text.charAt(index) - 'a';
                if (childIndex < 0 || childIndex >= 26 || current.children[childIndex] == null) {
                    break;
                }
                current = current.children[childIndex];
                if (current.isWord) {
                    starts.add(start);
                    break;
                }
            }
        }

        return starts;
    }

    private static void insert(TrieNode root, String word) {
        TrieNode current = root;
        for (int index = 0; index < word.length(); index++) {
            int childIndex = word.charAt(index) - 'a';
            if (current.children[childIndex] == null) {
                current.children[childIndex] = new TrieNode();
            }
            current = current.children[childIndex];
        }
        current.isWord = true;
    }
}
```

#### Dry Run

Text: `"cartoon"`, dictionary: `["car", "toon", "art"]`

- start `0`: trie walk matches `"car"`, so record `0`
- start `1`: trie walk matches `"art"`, so record `1`
- later start positions may match `"toon"`

The trie avoids restarting comparisons separately for every dictionary word.

#### Time and Space Complexity

Brute-force dictionary scan:

- Time: up to `O(textLength * dictionarySize * averageWordLength)`
- Space: `O(1)` extra beyond dictionary storage

Trie-based matching:

- Build Time: `O(totalDictionaryCharacters)`
- Query Time: depends on traversed prefixes, often much better when prefixes are shared
- Space: `O(totalDictionaryCharacters * alphabetFactor)` in this array-child implementation

#### Edge Cases

- empty dictionary
- text shorter than every word
- multiple dictionary words sharing one start index

#### Common Mistakes

- not resetting the trie walk for each start position
- assuming trie-based matching is always better for one pattern
- failing on characters outside the assumed alphabet

## 4. Complexity and Decision Guide

The main trade-off in this chapter is what kind of reuse the problem allows.

- KMP and Z algorithm give deterministic linear-time exact matching for one pattern
- Rabin-Karp gives rolling-window efficiency and is especially convenient for repeated equal-length checks or hash-based filtering
- trie-based matching helps when many patterns share prefixes or the queries are prefix-oriented

When to choose brute force:

- one very short pattern and one short text
- a one-off check where preprocessing would dominate

When to optimize:

- long texts with repetitive mismatch structure
- many search requests over shared-prefix dictionaries
- repeated same-length window comparisons

Recognition signals:

- exact one-pattern search with deterministic linear time desired: KMP or Z
- natural rolling window or many equal-length comparisons: Rabin-Karp with rolling hash
- many shared-prefix patterns or prefix lookup: trie-based matching

Signals not to force a technique:

- building a trie for one short pattern
- using Rabin-Karp without collision verification in exact matching
- choosing KMP or Z when the task is really dictionary/prefix search rather than single-pattern search

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- wrong preprocessing array values for LPS or Z
- off-by-one errors when translating combined-string indices back to text positions
- incorrect rolling-hash subtraction or modulus handling
- trie alphabet assumptions not matching the real input

Short debugging checklist:

- print the preprocessing array for a small example
- test overlapping matches explicitly
- verify rolling hash against direct substring hashing on tiny inputs
- test trie insert and one prefix walk before scanning the full text
- choose the algorithm only after clarifying whether the problem is one-pattern, hash-window, or dictionary-driven

## 6. Practice Problems

### Easy

**Title:** Implement KMP Search  
**Prompt:** Return all match positions of a pattern inside a text.  
**Expected pattern or core idea:** LPS preprocessing and deterministic linear scan.

**Title:** Pattern Search with Z Algorithm  
**Prompt:** Find pattern occurrences by computing a Z array on a combined string.  
**Expected pattern or core idea:** Prefix-length reuse across positions.

**Title:** Rolling Hash Window Check  
**Prompt:** Compare many equal-length substrings efficiently.  
**Expected pattern or core idea:** Constant-time rolling hash updates.

### Medium

**Title:** Rabin-Karp Pattern Search  
**Prompt:** Find all pattern matches with rolling hash and collision verification.  
**Expected pattern or core idea:** Hash-first, verify-on-match search.

**Title:** Trie Dictionary Prefix Matching  
**Prompt:** Detect dictionary words while scanning a text or answering prefix queries.  
**Expected pattern or core idea:** Shared-prefix trie traversal.

**Title:** Repeated String Match Variant  
**Prompt:** Determine whether one string appears inside repeated copies of another.  
**Expected pattern or core idea:** Choose a matcher by constraints and text construction.

### Hard

**Title:** Multiple Pattern Search Overview  
**Prompt:** Search for many dictionary words in one large text.  
**Expected pattern or core idea:** Trie-based matching direction and prefix reuse.

**Title:** Longest Duplicate Substring Discussion  
**Prompt:** Find repeated substrings in a large text using hashing and binary search ideas.  
**Expected pattern or core idea:** Rolling hash under stronger constraints.

**Title:** String Matching Strategy Comparison  
**Prompt:** Pick the right matcher for several different input scenarios.  
**Expected pattern or core idea:** Constraint-driven choice among KMP, Z, hashing, and trie-based matching.

## 7. Short Recap

The core idea is to reuse structure in strings instead of restarting full comparisons after every mismatch or shift. The most important optimization insight is that different matchers reuse different information: borders for KMP, prefix boxes for Z, rolling fingerprints for Rabin-Karp, and shared prefixes for tries. The most important implementation warning is to keep preprocessing and index translation exact. This prepares the next chapter, where monotonic structures and interval patterns shift focus from strings to ordered ranges and event reasoning.

## 8. Coverage Check

- 38.1 KMP algorithm - Covered
- 38.2 Z algorithm - Covered
- 38.3 Rabin-Karp - Covered
- 38.4 Rolling hash - Covered
- 38.5 Trie-based string matching - Covered
- 38.6 Choosing the right string-matching approach - Covered

Coverage Summary: 6/6 official subtopics covered

Next: Monotonic Structures and Interval Patterns
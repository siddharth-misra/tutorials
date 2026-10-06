# 19: String Processing Patterns

## 0. Introduction

This chapter sits in Part V - Range Queries, Strings, and Geometry (Weeks 23-28), with the roadmap treating it as advanced to expert work. Its goal is to learn how to preprocess and compare strings efficiently so repeated matching, substring ranking, and suffix-based reasoning become structured choices instead of ad hoc loops. This chapter directly supports the Part V outcome of using advanced string tools without losing sight of correctness guarantees and memory trade-offs.

Read it as a bridge in the larger sequence. Chapter 18 focused on repeated interval queries over arrays. This chapter carries the same preprocessing mindset into strings, where the repeated work is substring comparison and pattern matching. Chapter 20 moves from string structure to geometry and event ordering, where sorted events and boundary reasoning matter as much as text preprocessing matters here. Start this chapter after you are comfortable with Chapters 1 through 18, especially arrays, hashing, prefix thinking, binary search, and the habit of choosing a structure from the query pattern. The main themes here are Rolling Hash Pattern, String Matching Pattern, Suffix Array Pattern, Suffix Tree Pattern, Prefix-function and Z-style matching intuition, and Collision handling, verification, and memory trade-offs.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to use rolling hash, KMP-style matching, prefix-function and Z-style intuition, suffix arrays, and suffix-tree reasoning in Java while accounting for collision risk, verification cost, and memory trade-offs.

## 1. Intuition First

This chapter matters because strings punish repeated comparison. A direct character-by-character check feels cheap once, but not when it is hidden inside thousands of candidate matches or all suffixes of a long text. Efficient string processing is mostly about refusing to repeat equivalent comparisons.

The simplest analogy is searching through a library index. If you keep rereading whole pages to decide whether two phrases match, the process collapses. Good string algorithms store partial knowledge: which prefixes already match, what a rolling substring fingerprint looks like, or how all suffixes compare in sorted order.

The core mental model is:

- local pattern matching benefits from prefix reuse, as in KMP or Z-style reasoning
- substring equality can be accelerated by rolling hash, but hashes are evidence, not proof
- global substring questions often become suffix problems
- suffix arrays give compact sorted suffix order; suffix trees give richer traversal structure at a much higher implementation cost
- every speedup comes with a correctness or memory trade-off that must be stated explicitly

Recognition signals for this chapter:

- repeated substring search in a long text
- many substring equality checks
- longest repeated substring or lexicographic suffix questions
- need to preprocess one text and answer many queries on it
- constraints that make repeated `substring` or nested comparison loops too slow

The most common beginner confusion point is treating all fast string methods as interchangeable. KMP solves exact pattern matching without collision risk. Rolling hash supports very fast equality filtering, but needs collision handling. Suffix arrays and suffix trees solve more global substring structure problems.

In the larger roadmap, this chapter is the string-processing half of Part V's preprocessing theme.

## 2. Learning Path and Recognition Checklist

The chapter starts with direct pattern matching because that is the most common entry point. It then adds rolling hash for fast substring comparison, then scales up to suffix arrays and suffix-tree intuition for global substring structure. Throughout, it keeps one engineering question visible: what are you paying in proof burden, memory, or implementation complexity for the speedup?

Recognition checklist for this chapter:

- Do I need exact pattern matching or fast substring comparison?
- Is collision-free correctness mandatory, or can hashing be used with verification?
- Is the problem local to one pattern search, or global across all suffixes and substrings?
- Are updates involved, or is the string immutable after preprocessing?
- Do I need the lexicographic order of suffixes, or just match positions?
- Is a simpler prefix-function or Z-style method enough before reaching for suffix structures?

The brute-force baseline usually looks like this:

- compare the pattern against every text position character by character
- compare substrings directly each time they are referenced
- generate and sort all substrings or all suffixes with expensive repeated comparisons

The optimization path later becomes:

- KMP or Z-style prefix reuse for exact pattern search
- rolling hash for fast substring equality tests with verification discipline
- suffix arrays for sorted suffix reasoning and LCP-based substring questions
- suffix trees when linear-time suffix structure is necessary and the memory budget allows it

Mastery by the end of the chapter looks like this: you can explain whether the task is local matching, equality filtering, or global suffix structure, and then choose the lightest correct tool.

Do not force rolling hash when collision risk is unacceptable and a deterministic matcher exists. Do not force suffix trees when suffix arrays already solve the problem with less implementation risk.

## 3. Official Subtopic Coverage

### Concept Cluster: Exact Matching and Prefix Reuse
Official subtopics covered:
- 19.2 String Matching Pattern
- 19.5 Prefix-function and Z-style matching intuition

#### Definition or Framing
The String Matching Pattern finds exact occurrences of a pattern inside a text without restarting comparison from scratch after every mismatch. Prefix-function and Z-style reasoning both reuse prefix-match information instead of discarding it.

#### Recognition Signals
- exact pattern occurrences in a large text
- one pattern, one text, many overlapping partial matches
- repeated fallback after mismatch

#### Brute-Force Baseline
Start matching at every text position and compare characters until a mismatch occurs.

#### Optimized Pattern Idea
Use prefix information to skip comparisons that brute force would repeat. KMP uses the longest proper prefix that is also a suffix for fallback. Z-style reasoning measures how long the prefix matches from each starting point.

#### Invariant / State Representation / Transition Logic
In KMP, `prefix[i]` records the longest proper prefix of the pattern that is also a suffix ending at `i`. During the text scan, the matched-prefix length always represents the longest suffix of the processed text that is also a prefix of the pattern.

#### Java Implementation Notes
- use `char[]` or `String.charAt` consistently; avoid repeated substring creation
- keep fallback logic in a tight loop and test it carefully on repeated-prefix patterns
- Z-array code is usually shorter, but KMP is the more standard exact matcher API

#### Quick Dry Run
For pattern `ababaca`, a mismatch after matching `ababa` does not mean restarting from zero. The prefix table tells you how much prefix knowledge is still valid.

#### Common Mistakes
- building the prefix array with the wrong fallback loop
- confusing prefix length with last matched index
- forgetting to continue searching after one full match

#### Debugging Strategy
Print the prefix array for patterns with repeated structure such as `aaaa`, `ababaca`, and `aabaaab` before debugging the full matcher.

#### Comparison with Similar Pattern
KMP is deterministic exact matching. Rolling hash may also find matches quickly, but it needs verification discipline because equal hashes do not automatically prove equal strings.

#### Advanced Note
The Z-function is especially convenient when the problem is about matching the string prefix against many suffix starts.

### Concept Cluster: Fast Substring Comparison with Hashing
Official subtopics covered:
- 19.1 Rolling Hash Pattern
- 19.6 Collision handling, verification, and memory trade-offs

#### Definition or Framing
The Rolling Hash Pattern assigns a numeric fingerprint to substrings so adjacent or arbitrary substring comparisons can often be reduced to arithmetic on prefix hashes.

#### Recognition Signals
- many substring equality checks
- repeated window movement over a string
- search tasks where verifying only promising positions is much cheaper than checking every position fully

#### Brute-Force Baseline
Compare candidate substrings character by character every time.

#### Optimized Pattern Idea
Precompute prefix hashes and powers of the base. Use them to compute substring hashes in `O(1)`, then verify only if the hashes match or if the problem cannot tolerate collision risk.

#### Invariant / State Representation / Transition Logic
The prefix-hash array encodes the hash of each prefix under a fixed base and modulus. A substring hash is derived by subtracting and rescaling prefix hashes so equal substrings are likely, but not guaranteed, to produce equal values.

#### Java Implementation Notes
- use `long` for intermediate products
- if correctness pressure is high, use double hashing or explicit verification after a hash match
- document whether the implementation is Las Vegas style with verification or Monte Carlo style without it

#### Quick Dry Run
When sliding a window one position right, the old left character can be removed algebraically and the new right character added, so the hash update avoids rescanning the window.

#### Common Mistakes
- forgetting modular correction after subtraction
- treating a single hash match as a mathematical proof
- using a weak base or modulus carelessly

#### Debugging Strategy
Compare rolling-hash match candidates against direct substring comparison on random small strings before trusting the hash layer.

#### Comparison with Similar Pattern
Rolling hash is broader than KMP because it supports substring equality tasks, but it is weaker on correctness guarantees unless verification is added.

#### Advanced Note
Double hashing reduces collision risk significantly, while suffix arrays avoid probabilistic correctness concerns at the cost of heavier preprocessing.

### Concept Cluster: Global Suffix Structure
Official subtopics covered:
- 19.3 Suffix Array Pattern
- 19.4 Suffix Tree Pattern
- 19.6 Collision handling, verification, and memory trade-offs

#### Definition or Framing
Suffix arrays sort all suffixes of a string and often pair naturally with LCP, or longest common prefix, information. Suffix trees compress all suffixes into a trie-like directed structure and support many linear-time string operations, but with much larger implementation complexity and memory cost.

#### Recognition Signals
- lexicographic suffix order matters
- longest repeated substring or substring ranking is needed
- many global substring questions over one immutable text
- suffix-tree power is tempting, but memory and code complexity may dominate engineering cost

#### Brute-Force Baseline
Generate all suffixes or substrings and sort or compare them directly.

#### Optimized Pattern Idea
Use suffix arrays for compact sorted suffix order and derive substring information from neighboring suffix comparisons. Use suffix-tree reasoning when linear-time suffix traversal or explicit substring-state branching is essential.

#### Invariant / State Representation / Transition Logic
In a suffix array, each rank step must preserve the lexicographic order of suffixes according to larger and larger prefix lengths. In a suffix tree, each path from the root represents a substring, and compressed edges preserve the branching structure of all suffixes.

#### Java Implementation Notes
- suffix arrays are much more practical than suffix trees in interview and production code
- suffix trees are usually better treated as a conceptual tool unless the problem truly requires them
- keep memory trade-offs explicit: suffix trees store many objects or edge records, while suffix arrays are mostly integer arrays

#### Quick Dry Run
For `banana`, sorting suffixes gives `a`, `ana`, `anana`, `banana`, `na`, `nana`. The longest repeated substring comes from the largest LCP between neighboring sorted suffixes, which is `ana`.

#### Common Mistakes
- using suffix arrays when one exact match query would be simpler with KMP
- confusing suffix-tree edges with single characters after compression
- underestimating memory usage for tree-heavy implementations in Java

#### Debugging Strategy
Print the sorted suffix order for tiny strings such as `banana` and `mississippi`. If the order is wrong, every later suffix-array answer will be wrong too.

#### Comparison with Similar Pattern
Suffix arrays and suffix trees solve related global substring questions, but suffix arrays are usually the practical engineering default and suffix trees are the conceptual heavy artillery.

#### Advanced Note
Many problems that look like suffix-tree problems can be solved with suffix arrays plus LCP and binary search, which is often a better Java trade.

## 4. Pattern Template, State Model, or Core Workflow

Canonical string-processing decision workflow:

1. Classify the task.
   Is it exact pattern search, many substring comparisons, or a global suffix-structure problem?
2. Decide whether deterministic correctness is required at the comparison layer.
3. Estimate how many times the same text knowledge will be reused.
4. Choose the cheapest correct preprocessing model.

The standard choices are:

- one exact pattern search or repeated exact matching: KMP or Z-style logic
- many substring equality checks or rolling windows: rolling hash with verification discipline
- lexicographic suffix order or repeated-substring questions: suffix array
- suffix-tree-level functionality only when the stronger structure justifies the memory and implementation cost

Important variables and safety rules:

- KMP matched length must always mean “current longest matched prefix length”
- rolling hash needs a consistent base, modulus, and power table
- suffix-array rank arrays must match the current doubled prefix length
- memory cost must be part of the decision, especially in Java

What usually breaks first:

- prefix-function fallback loops on repeated-prefix patterns
- modular subtraction in rolling hash
- suffix-array sorting keys when the second half rank is out of bounds
- collision handling that is described but not actually implemented

When to adapt versus keep the template unchanged:

- keep KMP unchanged for exact matching
- adapt rolling hash with double hashing or explicit verification when risk rises
- keep suffix arrays as the practical default unless a problem explicitly demands suffix-tree structure

## 5. Worked Examples and Full Solutions

### Worked Example 1: Exact Pattern Search in Logs
#### Problem Statement
Given a text and a pattern, return all starting indices where the pattern appears exactly in the text.

#### Why This Example Matters
This is the cleanest example of deterministic prefix reuse. It shows why KMP exists before suffix structures or hashing are needed.

#### Input and Constraints
- `1 <= pattern.length() <= text.length() <= 200000`
- lowercase letters for simplicity, but the method is character-agnostic

#### Recognition Signals
- exact matching
- many overlapping prefixes between pattern and text
- direct rescanning would repeat work

#### Brute-Force Approach
Align the pattern at every text position and compare characters until a mismatch occurs.

#### Better Pattern-Based Approach
Use KMP with a prefix table so mismatches fall back to the longest still-valid prefix instead of restarting from zero.

#### Why the Pattern Fits
The task is exact matching, not approximate equality or lexicographic suffix ordering. A deterministic matcher is the lightest correct answer.

#### Invariant or State Transition
While scanning the text, `matchedLength` always equals the longest suffix of the processed text that is also a prefix of the pattern.

#### Pragmatic Java Choice
Use `List<Integer>` for answer positions and a compact prefix-array helper.

#### Dry Run Before Code
For text `ababcabcabababd` and pattern `ababd`, KMP carries forward the knowledge from earlier `abab` matches instead of rescanning those characters after mismatch.

#### Java Solution
```java
import java.util.ArrayList;
import java.util.List;

public class KmpSearchExample {
    static int[] buildPrefixTable(String pattern) {
        int[] prefix = new int[pattern.length()];
        int matchedLength = 0;

        for (int index = 1; index < pattern.length(); index++) {
            while (matchedLength > 0 && pattern.charAt(index) != pattern.charAt(matchedLength)) {
                matchedLength = prefix[matchedLength - 1];
            }
            if (pattern.charAt(index) == pattern.charAt(matchedLength)) {
                matchedLength++;
            }
            prefix[index] = matchedLength;
        }
        return prefix;
    }

    static List<Integer> search(String text, String pattern) {
        List<Integer> matches = new ArrayList<>();
        if (pattern.isEmpty()) {
            return matches;
        }

        int[] prefix = buildPrefixTable(pattern);
        int matchedLength = 0;

        for (int index = 0; index < text.length(); index++) {
            while (matchedLength > 0 && text.charAt(index) != pattern.charAt(matchedLength)) {
                matchedLength = prefix[matchedLength - 1];
            }
            if (text.charAt(index) == pattern.charAt(matchedLength)) {
                matchedLength++;
            }
            if (matchedLength == pattern.length()) {
                matches.add(index - pattern.length() + 1);
                matchedLength = prefix[matchedLength - 1];
            }
        }
        return matches;
    }

    public static void main(String[] args) {
        System.out.println(search("ababcabcabababd", "ababd"));
    }
}
```

#### Time and Space Complexity
- Brute force: `O(textLength * patternLength)` worst case
- KMP: `O(textLength + patternLength)` time and `O(patternLength)` space

#### Edge Cases
- repeated-character patterns such as `aaaa`
- pattern longer than text
- multiple overlapping matches

#### Common Mistakes
- failing to continue searching after a match
- incorrect fallback after mismatch
- off-by-one when recording the start index

### Worked Example 2: Rolling Hash Pattern Search with Verification
#### Problem Statement
Find every occurrence of a pattern inside a text using rolling hash, and verify candidate matches to avoid false positives from collisions.

#### Why This Example Matters
This example shows both the power and the discipline of rolling hash. It is fast, but only careful verification turns it into a fully trustworthy solution.

#### Input and Constraints
- `1 <= pattern.length() <= text.length() <= 200000`
- lowercase English letters for this implementation

#### Recognition Signals
- many sliding windows of equal length
- direct comparison at every position is expensive
- verification after a hash hit is acceptable

#### Brute-Force Approach
Check the pattern against each text window character by character.

#### Better Pattern-Based Approach
Compute the pattern hash and roll a window hash through the text. When hashes match, verify by direct character comparison.

#### Why the Pattern Fits
The query is window-based and equal-length. Hashing filters most impossible positions quickly.

#### Invariant or State Transition
The current rolling hash always equals the hash of the current text window under the chosen base and modulus.

#### Pragmatic Java Choice
Use one modulus plus explicit verification to keep the implementation readable while preserving correctness.

#### Dry Run Before Code
On text `abracadabra` and pattern `abra`, the window hash at positions `0` and `7` matches the pattern hash. Verification confirms both matches.

#### Java Solution
```java
import java.util.ArrayList;
import java.util.List;

public class RabinKarpExample {
    private static final long MOD = 1_000_000_007L;
    private static final long BASE = 911382323L;

    static List<Integer> search(String text, String pattern) {
        List<Integer> matches = new ArrayList<>();
        int textLength = text.length();
        int patternLength = pattern.length();
        if (patternLength == 0 || patternLength > textLength) {
            return matches;
        }

        long highestPower = 1;
        for (int i = 1; i < patternLength; i++) {
            highestPower = (highestPower * BASE) % MOD;
        }

        long patternHash = 0;
        long windowHash = 0;
        for (int i = 0; i < patternLength; i++) {
            patternHash = (patternHash * BASE + text.charAt(i)) % MOD;
            windowHash = (windowHash * BASE + text.charAt(i)) % MOD;
        }

        for (int start = 0; start + patternLength <= textLength; start++) {
            if (patternHash == windowHash && text.regionMatches(start, pattern, 0, patternLength)) {
                matches.add(start);
            }

            if (start + patternLength < textLength) {
                long outgoing = (text.charAt(start) * highestPower) % MOD;
                windowHash = (windowHash - outgoing + MOD) % MOD;
                windowHash = (windowHash * BASE + text.charAt(start + patternLength)) % MOD;
            }
        }

        return matches;
    }

    public static void main(String[] args) {
        System.out.println(search("abracadabra", "abra"));
    }
}
```

#### Time and Space Complexity
- Brute force: `O(textLength * patternLength)` worst case
- Rolling hash with verification: expected `O(textLength + patternLength)` plus verification cost on hash hits, `O(1)` extra space beyond the answer list

#### Edge Cases
- all characters the same
- many equal hash candidates in adversarial inputs
- pattern length `1`

#### Common Mistakes
- forgetting modular correction after removing the outgoing character
- assuming equal hashes imply equal substrings
- choosing no verification path in a correctness-critical setting

### Worked Example 3: Longest Repeated Substring with a Suffix Array
#### Problem Statement
Given a string, return one longest substring that appears at least twice.

#### Why This Example Matters
This is a global suffix-structure problem. It shows when local matchers and rolling windows stop being the right mental model.

#### Input and Constraints
- `1 <= s.length() <= 100000`
- lowercase letters for simplicity
- the string is immutable

#### Recognition Signals
- repeated substring question over the whole string
- lexicographic suffix ordering is useful
- neighboring suffixes reveal the longest common prefixes

#### Brute-Force Approach
Compare all substring pairs or all suffix pairs directly and track the best common prefix.

#### Better Pattern-Based Approach
Build a suffix array, then compute LCP values between neighboring sorted suffixes. The largest LCP gives a longest repeated substring.

#### Why the Pattern Fits
The question is global across all suffixes. Sorted suffix order exposes repeated-substring structure compactly.

#### Invariant or State Transition
At doubling step `k`, suffix ranks must reflect lexicographic order by the first `2^k` characters. Once ranks are unique, the suffix array is complete.

#### Pragmatic Java Choice
Use an `O(n log^2 n)` doubling implementation because it is far simpler and more interview-friendly than a full linear-time suffix-tree build in Java.

#### Dry Run Before Code
For `banana`, sorted suffixes place `ana` and `anana` next to each other. Their LCP is `3`, giving repeated substring `ana`.

#### Java Solution
```java
import java.util.Arrays;

public class SuffixArrayExample {
    static class Suffix implements Comparable<Suffix> {
        int index;
        int firstRank;
        int secondRank;

        @Override
        public int compareTo(Suffix other) {
            if (firstRank != other.firstRank) {
                return Integer.compare(firstRank, other.firstRank);
            }
            return Integer.compare(secondRank, other.secondRank);
        }
    }

    static int[] buildSuffixArray(String text) {
        int n = text.length();
        int[] ranks = new int[n];
        Suffix[] suffixes = new Suffix[n];

        for (int i = 0; i < n; i++) {
            suffixes[i] = new Suffix();
            suffixes[i].index = i;
            suffixes[i].firstRank = text.charAt(i);
            suffixes[i].secondRank = i + 1 < n ? text.charAt(i + 1) : -1;
        }

        for (int length = 2; length < 2 * n; length *= 2) {
            Arrays.sort(suffixes);

            int currentRank = 0;
            int previousFirst = suffixes[0].firstRank;
            int previousSecond = suffixes[0].secondRank;
            suffixes[0].firstRank = 0;
            ranks[suffixes[0].index] = 0;

            for (int i = 1; i < n; i++) {
                if (suffixes[i].firstRank != previousFirst || suffixes[i].secondRank != previousSecond) {
                    currentRank++;
                    previousFirst = suffixes[i].firstRank;
                    previousSecond = suffixes[i].secondRank;
                }
                suffixes[i].firstRank = currentRank;
                ranks[suffixes[i].index] = currentRank;
            }

            for (int i = 0; i < n; i++) {
                int nextIndex = suffixes[i].index + length;
                suffixes[i].secondRank = nextIndex < n ? ranks[nextIndex] : -1;
            }

            if (currentRank == n - 1) {
                break;
            }
        }

        Arrays.sort(suffixes);
        int[] suffixArray = new int[n];
        for (int i = 0; i < n; i++) {
            suffixArray[i] = suffixes[i].index;
        }
        return suffixArray;
    }

    static int[] buildLcp(String text, int[] suffixArray) {
        int n = text.length();
        int[] rank = new int[n];
        for (int i = 0; i < n; i++) {
            rank[suffixArray[i]] = i;
        }

        int[] lcp = new int[n - 1];
        int common = 0;
        for (int i = 0; i < n; i++) {
            int position = rank[i];
            if (position == n - 1) {
                common = 0;
                continue;
            }
            int nextSuffix = suffixArray[position + 1];
            while (i + common < n && nextSuffix + common < n
                    && text.charAt(i + common) == text.charAt(nextSuffix + common)) {
                common++;
            }
            lcp[position] = common;
            if (common > 0) {
                common--;
            }
        }
        return lcp;
    }

    static String longestRepeatedSubstring(String text) {
        if (text.isEmpty()) {
            return "";
        }
        int[] suffixArray = buildSuffixArray(text);
        int[] lcp = buildLcp(text, suffixArray);

        int bestLength = 0;
        int bestStart = 0;
        for (int i = 0; i < lcp.length; i++) {
            if (lcp[i] > bestLength) {
                bestLength = lcp[i];
                bestStart = suffixArray[i];
            }
        }
        return text.substring(bestStart, bestStart + bestLength);
    }

    public static void main(String[] args) {
        System.out.println(longestRepeatedSubstring("banana"));
    }
}
```

#### Time and Space Complexity
- Brute force: at least `O(n^3)` if substring comparison is done naively
- Suffix array with doubling plus LCP: `O(n log^2 n)` time and `O(n)` extra space for arrays

Compared with suffix trees, this approach is slower asymptotically than a fully linear construction, but far more practical in Java.

#### Edge Cases
- no repeated substring, answer is empty
- all characters the same
- multiple best answers of equal length

#### Common Mistakes
- using the wrong second-half rank length during doubling
- forgetting to rebuild the suffix order after updating ranks
- returning the wrong substring start after scanning LCP values

## 6. Complexity and Comparison Guide

Across the chapter, the main trade-offs are:

- brute-force matching: simplest implementation, but repeated comparisons make it collapse on large inputs
- KMP and Z-style logic: deterministic `O(n + m)` exact matching with modest memory
- rolling hash: very fast substring comparison or window search, but collision management is part of correctness
- suffix arrays: strong global substring structure with manageable memory and practical implementations
- suffix trees: very strong theoretical power, but the heaviest memory and implementation cost in this chapter

Comparison with similar patterns:

- KMP versus rolling hash: KMP is deterministic exact matching; rolling hash is a flexible comparison layer with collision trade-offs.
- Rolling hash versus suffix array: rolling hash is local and query-driven; suffix arrays expose global suffix order.
- Suffix array versus suffix tree: suffix arrays are usually the practical Java default; suffix trees are conceptually stronger but much more expensive to build and store.

Decision criteria:

- exact single-pattern matching: prefer KMP or Z-style logic
- many substring-equality checks: prefer rolling hash with verification
- longest repeated substring or lexicographic suffix queries: prefer suffix array
- suffix-tree-level traversal only when the stronger structure is justified by repeated complex substring operations

Signals not to force these techniques:

- tiny strings where direct comparison is already enough
- one-off pattern search where a library call may be acceptable outside interview settings
- problems whose main challenge is not string matching at all, but graph or DP modeling

What breaks when invariants fail:

- a wrong prefix table breaks every KMP fallback
- a hash layer without verification can silently accept false matches
- a wrong suffix order makes every LCP-based answer meaningless

## 7. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- off-by-one in prefix-function fallback
- modular subtraction mistakes in rolling hash
- rank-update mistakes in suffix arrays when the second key runs past the end of the string
- assuming suffix trees are “just tries” and underestimating compression logic

Boundary-condition handling:

- empty pattern or empty text handling must be explicit
- repeated characters often expose prefix-array and LCP bugs fastest
- large alphabets may require broader character handling than simple lowercase arithmetic

Collision, memory, and verification risks:

- single hashes without verification are probabilistic
- double hashing reduces but does not completely erase collision reasoning
- suffix trees can be memory-heavy enough to change the feasible solution in Java

Short debugging checklist:

1. Test KMP on repeated-prefix patterns.
2. Compare rolling-hash hits against direct substring equality on random small tests.
3. Print sorted suffixes for a tiny string and inspect the order manually.
4. Check whether the chosen structure matches local matching, hashing, or global suffix needs.
5. Measure memory assumptions before committing to suffix-tree-heavy code.

Counterexample to a common wrong solution:

If you treat one matching hash as proof, then a collision can return a false match even though the substrings differ. That is why correctness-critical rolling-hash solutions must verify or use stronger safeguards.

## 8. Practice Problems

### Easy
- Implement `strStr`: find the first occurrence of a pattern in a text; expected pattern or core idea: KMP or Z-style matching.
- Repeated String Match: determine how many repeats are needed for one string to contain another; expected pattern or core idea: string matching with careful boundary handling.
- Substring Equality Queries: answer whether two substrings are equal; expected pattern or core idea: rolling hash with verification discipline.

### Medium
- Find All Occurrences of a Pattern: return every exact match position; expected pattern or core idea: KMP.
- Longest Duplicate Substring: find a longest repeated substring; expected pattern or core idea: rolling hash plus binary search, or suffix array.
- Distinct Substrings Count: count different substrings of a string; expected pattern or core idea: suffix array plus LCP reasoning.

### Hard
- Build Suffix Array and LCP for Many Queries: preprocess a text for lexicographic substring tasks; expected pattern or core idea: suffix array.
- Multi-Pattern Prefix Matching Variant: answer prefix-based matching across many positions; expected pattern or core idea: Z-function or automaton-style preprocessing.
- Suffix-Tree-Level Substring Analytics: support many complex substring traversals on one text; expected pattern or core idea: suffix-tree reasoning with memory trade-offs.

## 9. Short Recap

The core idea is to stop repeating substring comparisons by storing reusable prefix, hash, or suffix structure. The strongest recognition clue is repeated matching or substring comparison over an immutable text. The key optimization insight is that local exact matching, hash-based comparison, and global suffix problems need different tools. The most important implementation warning is to treat collision handling and memory trade-offs as part of correctness, not as optional afterthoughts. This prepares the next chapter by extending the same preprocessing discipline into geometry, where sorted events and boundary logic replace suffix structure.

## 10. Coverage Check

- 19.1 Rolling Hash Pattern - covered
- 19.2 String Matching Pattern - covered
- 19.3 Suffix Array Pattern - covered
- 19.4 Suffix Tree Pattern - covered
- 19.5 Prefix-function and Z-style matching intuition - covered
- 19.6 Collision handling, verification, and memory trade-offs - covered

- Coverage Summary: 6/6 official subtopics covered
- This must always be 6/6 before final output

Next: 20: Geometry and Event Patterns

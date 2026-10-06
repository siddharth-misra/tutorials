# 3: Hashing and Accumulation Patterns

## 0. Introduction

This chapter sits in Part I - Pattern Foundations and Linear Thinking (Weeks 1-4), with the roadmap treating it as beginner to early intermediate work. Its goal is to build reliable Java techniques for counting, membership lookup, prefix accumulation, and prefix-plus-hash combinations so repeated scans can be replaced by reused state. This chapter directly supports the Part I outcome of writing clean Java scaffolding for array, string, and hash-based solutions and explaining why a linear scan can beat nested loops.

Read it as a bridge in the larger sequence. Chapter 2 explained how to recognize a pattern from clues and bottlenecks. This chapter turns that recognition skill into concrete hash and accumulation techniques. Chapter 4 extends linear reasoning from remembered state into moving pointers and dynamic windows. Start this chapter after you are comfortable with Chapter 1 Java toolkit, Chapter 2 pattern recognition workflow, basic complexity comparison, and comfort with arrays, strings, maps, and sets. The main themes here are Frequency Counter Pattern, Hash Map Lookup Pattern, Prefix Sum Pattern, Prefix XOR and accumulation variants, Combining prefix data with hashing, and Common map-state mistakes and collision-style pitfalls.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to choose between frequency tables, hash-based lookup, prefix sums, prefix XOR, and combined prefix-hash workflows; explain the invariant behind each; and avoid the update-order mistakes that commonly break these patterns.

## 1. Intuition First

This chapter matters because many early algorithm problems are not hard because of deep theory. They are hard because a naive solution keeps forgetting what it already learned. If you recount every character, rescan every prefix, or search every earlier element from scratch, the code is simple but the runtime grows too quickly.

The best analogy is a running ledger. A good ledger does not recompute the business history every time someone asks for the current balance. It stores summary information that can be updated and reused. Hashing and accumulation patterns do the same thing for algorithms.

The core mental model is:

- hashing remembers selective past facts keyed by value or state
- accumulation remembers running totals or running xor values
- prefix plus hashing remembers accumulated history and lets future positions query it quickly

Recognition signals are strong in this chapter:

- frequency counts or duplicate detection
- "have we seen this before?"
- pair complement lookup
- many contiguous range questions
- counting subarrays or prefixes with a property
- balancing, parity, xor, or same-difference conditions

The most common beginner confusion point is treating every hash-based problem as the same. Counting, direct lookup, earliest index tracking, and prefix frequency tracking look similar in code, but they use different invariants and different update orders.

In the larger roadmap, this chapter is the first fully operational pattern chapter. It gives you reusable tools that appear again in sliding windows, trees, graphs, and dynamic programming.

## 2. Learning Path and Recognition Checklist

The chapter starts with the simplest remembered-state pattern: frequency counting. From there it moves to direct hash lookup, where the important question is not "how many?" but "have I already seen the right value or state?" Then it shifts from keyed state to accumulated state with prefix sums and prefix XOR. Finally, it combines both ideas, because many strong interview problems need a running prefix plus a map of previously seen prefix states.

Recognition checklist for this chapter:

- Do I need counts, last positions, first positions, or membership only?
- Does the brute-force solution repeatedly scan earlier elements?
- Is the problem about contiguous ranges or subarrays?
- Are there many range queries or a single scan with repeated prefix questions?
- Does subtraction work for the accumulated quantity, or is xor the right reversible operation?
- Am I storing counts of states, earliest positions, or just existence?
- Does the map need to be updated before or after querying it?

The brute-force baselines in this chapter are usually easy to state:

- nested loops for counting frequencies or finding pairs
- recomputing range sums for every query
- enumerating every subarray and summing it from scratch

The optimized idea is always the same at a high level: preserve useful information so each position does not restart the whole computation.

Mastery by the end of the chapter looks like this: you can scan once, maintain the right state, explain exactly what that state means, and justify why the update order is correct.

Do not force these patterns when the input domain is tiny and a plain array is cleaner than a map, when sorting gives a simpler answer, or when the property is not contiguous and prefix methods no longer apply.

## 3. Official Subtopic Coverage

### Concept Cluster: Counting and Direct Lookup
Official subtopics covered:
- 3.1 Frequency Counter Pattern
- 3.2 Hash Map Lookup Pattern

#### Definition or Framing
The Frequency Counter Pattern stores how many times each value appears. The Hash Map Lookup Pattern stores useful information keyed by a value or state so the scan can answer repeated questions immediately.

Frequency counting answers questions like:

- are two strings anagrams?
- which value appears most often?
- has every required character been seen enough times?

Hash lookup answers questions like:

- have I seen the complement before?
- what was the last index of this value?
- is this state already present?

#### Recognition Signals
- duplicates, counts, or character balance
- repeated complement checks
- nearest previous occurrence
- one-pass scan where each step asks about earlier data

#### Brute-Force Baseline
The baseline usually rescans the same data:

- for each character, count matches by scanning the second string
- for each number, search earlier numbers for a needed complement
- for each index, scan backward for the last occurrence

#### Optimized Pattern Idea
Store the needed information once in a map, set, or fixed-size frequency array. Then reuse it in constant expected time per step.

#### Invariant / State Representation / Transition Logic
At position `i`, the state summarizes exactly what has been seen in the prefix up to `i - 1` or up to `i`, depending on the chosen update order. The algorithm is correct only if the query step and update step match that meaning.

#### Java Implementation Notes
- use `getOrDefault` for count updates
- use `putIfAbsent` when you want the earliest position and must not overwrite it
- use `HashSet` when membership is enough and counts are unnecessary
- use an `int[]` frequency table instead of `HashMap<Character, Integer>` when the alphabet is fixed and tiny

#### Quick Dry Run
For `"listen"` and `"silent"`, increment counts for the first string and decrement counts for the second string. If every final count is zero, the strings have the same multiset of characters.

For `[2, 7, 11, 15]` and target `9`, scan left to right and ask at each step whether `target - value` already exists in the map.

#### Common Mistakes
- overwriting earliest positions when the first occurrence matters
- using a map when a tiny array would be simpler and faster
- updating the current value before checking the complement when that allows illegal self-use
- confusing count storage with membership storage

#### Debugging Strategy
Print the key, the current query, and the map state on a tiny case. Most bugs appear immediately when the state meaning is written out line by line.

#### Comparison with Similar Pattern
Frequency counting is about aggregate counts. Direct lookup is about answering a targeted question at each step. They often share data structures, but not the same invariant.

#### Advanced Note
Later chapters will extend hash-based state from single values to compound states such as `(row, column)`, `(difference, index)`, or `(node, mask)`.

### Concept Cluster: Prefix-Based Accumulation
Official subtopics covered:
- 3.3 Prefix Sum Pattern
- 3.4 Prefix XOR and accumulation variants

#### Definition or Framing
Prefix accumulation stores a running summary from the start of the sequence to the current position. For sums, this summary supports fast range-sum queries by subtraction. For xor, the same role is played by the reversible property `a ^ a = 0`.

#### Recognition Signals
- many contiguous range queries
- subarray properties defined by total sum or total xor
- parity or balance questions that depend on accumulated history
- repeated recomputation of the same partial total

#### Brute-Force Baseline
- sum every query range directly
- recompute the sum or xor of every subarray from scratch
- rebuild left and right totals repeatedly inside nested loops

#### Optimized Pattern Idea
Store a running prefix value so each range or state can be expressed in terms of two prefixes instead of a fresh scan.

#### Invariant / State Representation / Transition Logic
For sums, `prefix[i]` means the sum of the first `i` elements. For xor, `prefixXor[i]` means the xor of the first `i` elements. A range value comes from combining the two endpoint prefixes with the inverse operation:

- sum from `left` to `right`: `prefix[right + 1] - prefix[left]`
- xor from `left` to `right`: `prefixXor[right + 1] ^ prefixXor[left]`

#### Java Implementation Notes
- use `long` if sum overflow is possible
- remember that prefix arrays usually have one extra slot
- use `^` for xor in Java
- xor patterns often need the same map logic as prefix sum patterns, but with xor keys instead of sum keys

#### Quick Dry Run
For `nums = [4, 2, 7, 1]`, the prefix sum array is `[0, 4, 6, 13, 14]`. The sum from index `1` to `3` is `14 - 4 = 10`.

For xor on the same array, the running xor values are `[0, 4, 6, 1, 0]`. The xor of indices `1` to `3` is `0 ^ 4 = 4`.

#### Common Mistakes
- off-by-one errors in prefix indexing
- assuming sliding window can replace prefix sums even when negative values exist
- forgetting that xor and addition have different inverse operations
- storing prefix values in `int` when range sums can overflow

#### Debugging Strategy
Write out the prefix array on a tiny example and verify one or two range computations by hand before trusting larger cases.

#### Comparison with Similar Pattern
Prefix sums answer many queries over static accumulation. Sliding windows adjust a live contiguous segment. Prefix methods are more general when values can be negative or when many offline queries exist.

#### Advanced Note
Accumulation variants also include prefix minimums, prefix maximums, running counts, and balance-difference arrays, but sum and xor are the main reversible forms in early chapters.

### Concept Cluster: Prefix Plus Hashing and Map-State Pitfalls
Official subtopics covered:
- 3.5 Combining prefix data with hashing
- 3.6 Common map-state mistakes and collision-style pitfalls

#### Definition or Framing
Some problems ask about subarrays, balanced prefixes, or repeated accumulated states. In those cases, a prefix value alone is not enough. You also need a map that tells you how often a previous prefix occurred, or where it first occurred.

#### Recognition Signals
- count subarrays with sum `k`
- longest subarray with equal counts of two categories
- find the earliest position where a prefix state repeats
- xor or sum target over many implicit subarrays during one scan

#### Brute-Force Baseline
Enumerate every start and end pair, compute the subarray value, and test whether it matches the target condition.

#### Optimized Pattern Idea
As you scan, maintain the current prefix. Use a hash map to ask whether an earlier prefix would make the current subarray satisfy the target. Then update the map for future positions.

#### Invariant / State Representation / Transition Logic
At index `i`, the current prefix value summarizes the sequence from the start through `i`. The map stores counts or first positions of earlier prefix values. For subarray sum equals `k`, you need earlier prefixes equal to `currentPrefix - k`.

The update order matters:

- query the map first using the current prefix
- then add the current prefix to the map for future positions

unless the specific problem's invariant requires a different order.

#### Java Implementation Notes
- initialize the map with the neutral prefix: `0 -> 1` for counting or `0 -> -1` for earliest-index logic
- decide whether the map stores counts, earliest positions, or latest positions before writing code
- when using compound keys, define a stable key representation with correct equality and hash behavior

#### Quick Dry Run
For `nums = [1, 2, 3]` and `k = 3`:

- start with map `{0: 1}` and prefix `0`
- read `1`, prefix `1`, need `-2`, not found, store `1`
- read `2`, prefix `3`, need `0`, found once, count becomes `1`, store `3`
- read `3`, prefix `6`, need `3`, found once, count becomes `2`

The valid subarrays are `[1, 2]` and `[3]`.

#### Common Mistakes
- forgetting to seed the neutral prefix in the map
- overwriting counts when you should increment them
- storing latest position when earliest position is needed for maximum length
- updating the current prefix into the map before querying, which can count illegal zero-length subarrays
- building custom keys without stable equality or hash behavior

#### Debugging Strategy
On a tiny array, print four values at each step: index, current prefix, queried target prefix, and map contents after the update. Most logic errors become obvious immediately.

#### Comparison with Similar Pattern
Prefix sum alone answers direct range queries. Prefix plus hashing answers implicit range questions discovered during a single scan.

#### Advanced Note
Collision-style pitfalls in interviews are often not about the hash table implementation itself. They are about choosing the wrong key, mutating key state, or confusing count maps with position maps.

## 4. Pattern Template, State Model, or Core Workflow

The canonical workflows in this chapter are short and reusable.

Frequency counter template:

```java
Map<Integer, Integer> countByValue = new HashMap<>();
for (int value : values) {
    countByValue.put(value, countByValue.getOrDefault(value, 0) + 1);
}
```

Direct lookup template:

```java
Map<Integer, Integer> seen = new HashMap<>();
for (int index = 0; index < nums.length; index++) {
    int value = nums[index];
    int needed = target - value;
    if (seen.containsKey(needed)) {
        // answer found
    }
    seen.put(value, index);
}
```

Prefix sum template:

```java
long[] prefix = new long[nums.length + 1];
for (int index = 0; index < nums.length; index++) {
    prefix[index + 1] = prefix[index] + nums[index];
}
```

Prefix plus hash template:

```java
Map<Integer, Integer> frequencyByPrefix = new HashMap<>();
frequencyByPrefix.put(0, 1);
int prefix = 0;
for (int value : nums) {
    prefix += value;
    answer += frequencyByPrefix.getOrDefault(prefix - target, 0);
    frequencyByPrefix.put(prefix, frequencyByPrefix.getOrDefault(prefix, 0) + 1);
}
```

Important state decisions:

- counts versus positions versus existence
- `int` versus `long` for accumulated values
- query-then-update versus update-then-query
- neutral initial state for empty prefix support

Safety rules:

- define exactly what the map stores before coding
- define exactly what the prefix means before coding
- seed the neutral prefix when the empty prefix is part of valid reasoning
- do not mutate keys after inserting them into a map

What usually breaks first is update order. Many chapter bugs come from correct data structures with the wrong timing.

Adapt the template when the key is not a raw value but a derived state, such as a difference between two counts, a running xor, or a normalized balance.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Valid Anagram with a Frequency Counter
#### Problem Statement
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, otherwise return `false`.

#### Why This Example Matters
This is the clearest introduction to the Frequency Counter Pattern because the problem is fundamentally about matching counts, not order.

#### Input and Constraints
- strings may be large
- lowercase English letters in the simplest version
- order does not matter, frequency does

#### Recognition Signals
- compare two multisets of characters
- same characters must appear the same number of times
- direct position-by-position comparison is irrelevant

#### Brute-Force Approach
For each character in `s`, search for a matching unused character in `t` and mark it as used.

#### Better Pattern-Based Approach
Count how many times each letter occurs in both strings and compare the totals.

#### Why the Pattern Fits
The baseline repeats matching work. A frequency counter summarizes the entire string in one linear pass.

#### Invariant or State Transition
After processing both strings, each frequency entry should return to zero if the character counts match exactly.

#### Pragmatic Java Choice
Because the alphabet is fixed to lowercase English letters, an `int[26]` array is simpler than a hash map.

#### Dry Run Before Code
For `s = "listen"` and `t = "silent"`:

- increment counts for `listen`
- decrement counts for `silent`
- every count ends at zero

#### Java Solution
```java
public class ValidAnagram {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) {
            return false;
        }

        int[] frequency = new int[26];

        for (int index = 0; index < s.length(); index++) {
            frequency[s.charAt(index) - 'a']++;
            frequency[t.charAt(index) - 'a']--;
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

#### Time and Space Complexity
- Brute force: $O(n^2)$ time, $O(n)$ extra space if marking characters
- Frequency counter: $O(n)$ time, $O(1)$ extra space for fixed alphabet

#### Edge Cases
- different lengths
- repeated letters
- empty strings

#### Common Mistakes
- sorting both strings when only counts are needed and linear time is possible
- forgetting that anagrams compare counts, not positions
- using the wrong alphabet size assumption

### Worked Example 2: Two Sum with Hash Map Lookup
#### Problem Statement
Given an integer array `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

#### Why This Example Matters
This example isolates the direct-lookup form of hashing: one current value asks a question about previously seen values.

#### Input and Constraints
- values may repeat
- the array is not sorted
- exactly one answer exists

#### Recognition Signals
- pair condition
- complement lookup
- output needs original indices

#### Brute-Force Approach
Check all pairs using nested loops.

#### Better Pattern-Based Approach
Store seen values in a map from value to index and check whether the complement is already present.

#### Why the Pattern Fits
The baseline repeats earlier searches. The map makes each earlier-search query constant time on average.

#### Invariant or State Transition
Before visiting index `i`, the map stores indices for values from earlier positions only, so the current element is never reused as both numbers in the answer.

#### Pragmatic Java Choice
Use `HashMap<Integer, Integer>` because the answer requires indices.

#### Dry Run Before Code
For `nums = [3, 2, 4]` and `target = 6`:

- index `0`, value `3`, need `3`, not found, store `3 -> 0`
- index `1`, value `2`, need `4`, not found, store `2 -> 1`
- index `2`, value `4`, need `2`, found at `1`, answer is `[1, 2]`

#### Java Solution
```java
import java.util.HashMap;
import java.util.Map;

public class TwoSumHashLookup {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> indexByValue = new HashMap<>();

        for (int index = 0; index < nums.length; index++) {
            int value = nums[index];
            int needed = target - value;

            if (indexByValue.containsKey(needed)) {
                return new int[] {indexByValue.get(needed), index};
            }

            indexByValue.put(value, index);
        }

        throw new IllegalArgumentException("Input guarantees one valid answer");
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n^2)$ time, $O(1)$ extra space
- Hash lookup: $O(n)$ expected time, $O(n)$ extra space

#### Edge Cases
- duplicate values such as `[3, 3]`
- negative numbers
- complement equal to current value but needing a different index

#### Common Mistakes
- inserting the current value before checking the complement
- sorting the array and losing original indices
- forgetting that later duplicate values may overwrite earlier ones when the problem's requirements differ

### Worked Example 3: Pivot Index with Prefix Sums
#### Problem Statement
Given an integer array `nums`, return the pivot index where the sum of all numbers strictly to the left equals the sum of all numbers strictly to the right. Return `-1` if no such index exists.

#### Why This Example Matters
This example shows how prefix accumulation removes repeated summation work without needing any map.

#### Input and Constraints
- values may be negative
- the array can be large
- only one pass after preprocessing is desirable

#### Recognition Signals
- repeated left-sum and right-sum checks
- contiguous accumulation
- no updates to the array during the scan

#### Brute-Force Approach
For each index, compute the left sum and right sum by scanning both sides directly.

#### Better Pattern-Based Approach
Compute the total sum once and maintain a running left sum. Then derive the right sum from `totalSum - leftSum - currentValue`.

#### Why the Pattern Fits
The baseline repeats overlapping addition work at every index. Prefix accumulation reuses earlier totals.

#### Invariant or State Transition
At index `i`, `leftSum` equals the sum of elements before `i`. The right sum is whatever remains after removing `leftSum` and `nums[i]` from the total.

#### Pragmatic Java Choice
Use `long` for the running totals if input constraints could overflow `int`.

#### Dry Run Before Code
For `nums = [1, 7, 3, 6, 5, 6]`:

- total sum is `28`
- at index `0`, left is `0`, right is `27`
- at index `3`, left is `11`, right is `11`, so pivot index is `3`

#### Java Solution
```java
public class PivotIndexPrefixSum {
    public int pivotIndex(int[] nums) {
        long totalSum = 0;
        for (int value : nums) {
            totalSum += value;
        }

        long leftSum = 0;
        for (int index = 0; index < nums.length; index++) {
            long rightSum = totalSum - leftSum - nums[index];
            if (leftSum == rightSum) {
                return index;
            }
            leftSum += nums[index];
        }

        return -1;
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n^2)$ time, $O(1)$ extra space
- Prefix accumulation: $O(n)$ time, $O(1)$ extra space beyond stored totals

#### Edge Cases
- pivot at index `0`
- pivot at the last index
- negative values
- no pivot exists

#### Common Mistakes
- including the pivot value in both sums
- updating `leftSum` before checking the pivot condition
- using a sliding window when negative values make a window interpretation unreliable

### Worked Example 4: Subarray Sum Equals K with Prefix Plus Hashing
#### Problem Statement
Given an integer array `nums` and an integer `k`, return the number of contiguous subarrays whose sum equals `k`.

#### Why This Example Matters
This is the signature example for combining prefix data with hashing. It also exposes the most common map-state bugs in the chapter.

#### Input and Constraints
- values may be positive, zero, or negative
- the array can be large
- the task is to count all valid contiguous subarrays

#### Recognition Signals
- contiguous subarray counting
- target sum over many implicit start positions
- negative numbers rule out a simple sliding window

#### Brute-Force Approach
Try every start index, extend every possible end index, compute the sum, and count matches.

#### Better Pattern-Based Approach
Maintain a running prefix sum. At each step, count how many earlier prefixes equal `currentPrefix - k`.

#### Why the Pattern Fits
The brute-force method rechecks many overlapping subarrays. The combined pattern turns each end position into a direct query over previously seen prefix states.

#### Invariant or State Transition
Before storing the current prefix, the map contains counts of prefix sums from all earlier positions. The number of valid subarrays ending at the current index equals the frequency of `currentPrefix - k` in that map.

#### Pragmatic Java Choice
Use `HashMap<Integer, Integer>` for prefix frequencies. Seed it with `0 -> 1` so subarrays starting at index `0` are counted.

#### Dry Run Before Code
For `nums = [1, 1, 1]` and `k = 2`:

- start with prefix `0`, map `{0: 1}`
- read first `1`, prefix `1`, need `-1`, count stays `0`, store prefix `1`
- read second `1`, prefix `2`, need `0`, count becomes `1`, store prefix `2`
- read third `1`, prefix `3`, need `1`, count becomes `2`

The valid subarrays are the first two elements and the last two elements.

#### Java Solution
```java
import java.util.HashMap;
import java.util.Map;

public class SubarraySumEqualsK {
    public int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0, 1);

        int currentPrefix = 0;
        int answer = 0;

        for (int value : nums) {
            currentPrefix += value;
            answer += prefixCount.getOrDefault(currentPrefix - k, 0);
            prefixCount.put(currentPrefix, prefixCount.getOrDefault(currentPrefix, 0) + 1);
        }

        return answer;
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n^2)$ time, $O(1)$ extra space
- Prefix plus hashing: $O(n)$ expected time, $O(n)$ extra space

#### Edge Cases
- negative values
- zero values that create many repeated prefixes
- target sum `0`
- multiple overlapping valid subarrays

#### Common Mistakes
- forgetting the initial `0 -> 1` entry
- updating the map before counting matches
- storing only existence instead of frequency
- assuming sliding window works even with negative numbers

## 6. Complexity and Comparison Guide

The chapter's main trade-offs are about what kind of remembered state you need.

- Frequency counters and direct hash lookup both turn repeated scans into $O(1)$ expected-time state queries, usually giving $O(n)$ total time instead of $O(n^2)$.
- Prefix sums turn repeated range totals from $O(length)$ each into $O(1)$ queries after $O(n)$ preprocessing.
- Prefix xor provides the same structure for xor-based properties using xor as the reversible operation.
- Prefix plus hashing spends extra memory to count or locate implicit subarrays during a single scan.

Comparison with similar patterns:

- Frequency counter versus sorting: sorting can compare multisets in $O(n \log n)$ time with less custom state, but frequency counting is often linear and clearer when counts are the real question.
- Hash lookup versus two pointers: use hashing on unsorted data or when original indices matter; use two pointers on sorted data when constant extra space is valuable.
- Prefix sum versus sliding window: prefix sums handle negative values and offline queries cleanly; sliding windows are best when the window can be adjusted incrementally under stronger conditions.
- Prefix-only versus prefix plus hashing: use prefix-only when the query endpoints are given explicitly; use prefix plus hashing when valid endpoints must be discovered during the scan.

Decision criteria:

- choose frequency counting when order is irrelevant but multiplicity matters
- choose direct lookup when each step asks a targeted question about earlier state
- choose prefix accumulation when range values are defined by reversible totals
- choose prefix plus hashing when the scan must discover matching prior accumulated states

Signals that you should not force these techniques:

- the value domain is tiny and a plain array is simpler than a map
- sorting produces a simpler answer and the order loss does not hurt correctness
- the problem is about arbitrary subsets, not contiguous ranges, so prefix logic does not apply

When invariants fail, the algorithm usually still looks close to correct. That is what makes these bugs dangerous. A wrong update order or wrong map meaning often passes small cases and fails only on overlapping or prefix-at-zero cases.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- off-by-one errors in prefix arrays
- forgetting the neutral prefix initialization
- storing the wrong kind of map value: count instead of earliest index, or latest index instead of count
- mutating the state before the query when the invariant requires query first
- assuming hash-based logic preserves order information that was never stored

Boundary and safety issues:

- negative values often invalidate naive sliding-window replacements
- `int` overflow can silently break prefix sums on large inputs
- repeated prefixes must be counted, not collapsed to a single boolean
- compound keys need stable equality and hash behavior

Short debugging checklist:

1. What exactly does the map store?
2. What exactly does the prefix value mean at this line?
3. Should I query first or update first?
4. Did I seed the empty-prefix case correctly?
5. Can I reproduce the bug on a three- or four-element example and print each state transition?

Quick counterexample that defeats a common wrong solution:

Using sliding window for subarray sum equals `k` fails on negative values. For `[2, -1, 2]` and `k = 3`, window growth and shrink rules based only on the current sum are not reliable because the sum can decrease when the window expands.

## 8. Practice Problems

### Easy
- Valid Anagram: Determine whether two strings contain the same characters with the same multiplicities. Expected pattern or core idea: frequency counter.
- Contains Duplicate: Return whether any value appears more than once. Expected pattern or core idea: hash set membership.
- Find Pivot Index: Return the index whose left and right sums match. Expected pattern or core idea: prefix accumulation.

### Medium
- Two Sum: Return indices of a target pair in an unsorted array. Expected pattern or core idea: hash map lookup.
- Subarray Sum Equals K: Count subarrays with target sum. Expected pattern or core idea: prefix sum plus hashing.
- Continuous Subarray Sum: Decide whether a subarray sum is a multiple of `k`. Expected pattern or core idea: prefix remainder plus earliest-index hash map.

### Hard
- Count of Range Sum: Count subarray sums within a value interval. Expected pattern or core idea: prefix accumulation plus ordered counting structure.
- Subarrays with K Different Integers: Count subarrays with exactly `k` distinct values. Expected pattern or core idea: window counting with frequency state.
- Count Triplets That Can Form Two Arrays of Equal XOR: Count xor-based triplets. Expected pattern or core idea: prefix xor with state aggregation.

## 9. Short Recap

The core idea of this chapter is to stop recomputing work that can be remembered. The strongest recognition clue is repeated lookup or repeated accumulation across prefixes or subarrays. The most important optimization insight is that a map and a running prefix often turn nested scans into a single pass. The main implementation warning is that the data structure alone is not enough; the exact state meaning and update order must be correct. This chapter prepares the next one by making linear scans stateful, which is the foundation for two pointers and sliding windows.

## 10. Coverage Check

- 3.1 Frequency Counter Pattern - Covered
- 3.2 Hash Map Lookup Pattern - Covered
- 3.3 Prefix Sum Pattern - Covered
- 3.4 Prefix XOR and accumulation variants - Covered
- 3.5 Combining prefix data with hashing - Covered
- 3.6 Common map-state mistakes and collision-style pitfalls - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 4: Two-Pointer and Window Patterns
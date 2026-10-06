# 8: Prefix Sum and Difference Techniques

**Goal:** Teach learners how to preprocess cumulative information so repeated range queries and range updates become efficient instead of repetitive.
**Outcome:** By the end of this chapter, you can build one-dimensional prefix sums, answer range sum queries in `O(1)`, apply many updates with a difference array, reason about prefix XOR, and combine prefix data with hashing to count subarrays efficiently.

---

## 1. Intuition First

Prefix techniques turn repeated work into remembered work.

A simple real-world analogy is mile markers on a road. If you know the total distance from the origin to mile marker `10` and the total distance to mile marker `3`, then the distance from `3` to `10` is just the difference between those two cumulative totals. You do not re-measure the entire road segment every time.

The core mental model is this: store enough cumulative information so a later query becomes subtraction, XOR cancellation, or one map lookup instead of a full scan.

The most common beginner confusion point is mixing up what the prefix array stores. A prefix array usually stores information up to, but not including, the current index in the original array. That extra offset is what removes many boundary special cases.

In the roadmap, this chapter is the first strong example of offline preprocessing. You spend time once, then answer many questions quickly.

## 2. Core Concepts and Techniques

### Concept Cluster: One-Dimensional Prefix Sums and Range Sum Queries
Key concepts in this block:
- 8.1 One-dimensional prefix sums
- 8.2 Range sum queries

#### Intuition

A prefix sum array stores cumulative totals from the start of the array up to each position.

#### Why It Matters

Without preprocessing, repeated range sums can cost `O(n)` each. With prefix sums, each range query becomes `O(1)`.

#### How It Works

The standard layout is:
- `prefix[0] = 0`
- `prefix[i + 1] = prefix[i] + values[i]`

Then the sum from `left` to `right` inclusive is:
- `prefix[right + 1] - prefix[left]`

That extra leading zero is the main boundary simplifier.

#### Java Implementation Notes

- Prefer a prefix array of length `n + 1`.
- Use `long` if the total sum may overflow `int`.
- Keep query formulas consistent about inclusive and exclusive boundaries.

#### Common Mistakes

- forgetting the leading zero entry
- using `prefix[right] - prefix[left]` by mistake
- mixing inclusive and exclusive boundaries mid-solution
- rebuilding ranges from scratch even after preprocessing

#### Quick Example

```java
class PrefixSumQuickExample {
    static long[] buildPrefix(int[] values) {
        long[] prefix = new long[values.length + 1];
        for (int index = 0; index < values.length; index++) {
            prefix[index + 1] = prefix[index] + values[index];
        }
        return prefix;
    }
}
```

#### Debugging Tip

Write out the prefix array for a tiny example by hand. If the prefix values are wrong, every query answer will also be wrong.

#### Advanced Note

Prefix sums are best when the underlying array stays mostly static. If updates are frequent and queries are frequent, later tree-based structures become more appropriate.

### Concept Cluster: Difference Arrays
Key concepts in this block:
- 8.3 Difference arrays

#### Intuition

A difference array stores where a running effect starts and where it stops.

#### Why It Matters

If a problem applies many range updates to a static array, updating every element inside every range is wasteful. Difference arrays mark only the boundaries and reconstruct the final values later.

#### How It Works

For an update that adds `delta` on `[left, right]`:
- add `delta` at `difference[left]`
- subtract `delta` at `difference[right + 1]` if that index exists

After all updates, prefix-summing the difference array reconstructs the final values.

#### Java Implementation Notes

- Difference arrays are ideal for offline batch updates.
- The final reconstruction pass is just a running sum.
- Be careful when `right + 1` reaches the array boundary.

#### Common Mistakes

- forgetting the stop marker subtraction
- applying updates directly to the original array and losing the whole point of the technique
- mixing the original array and difference array semantics
- not checking the boundary before writing `right + 1`

#### Quick Example

```java
class DifferenceArrayQuickExample {
    static int[] applySingleUpdate(int length, int left, int right, int delta) {
        int[] difference = new int[length];
        difference[left] += delta;
        if (right + 1 < length) {
            difference[right + 1] -= delta;
        }
        return difference;
    }
}
```

#### Debugging Tip

When the final array is wrong, inspect the raw difference array before the reconstruction pass. Boundary mistakes show up there first.

#### Advanced Note

Difference arrays are the update-side mirror image of prefix sums. One makes queries cheap, the other makes updates cheap.

### Concept Cluster: Prefix XOR and Prefix Data with Hashing
Key concepts in this block:
- 8.4 Prefix XOR
- 8.5 Combining prefix data with hashing

#### Intuition

Prefix XOR stores the XOR of all values up to each position. Combining prefix data with hashing means remembering how often a cumulative value has appeared so far.

#### Why It Matters

Many subarray count problems are really questions about relationships between two prefix states. Once you see that relationship, a map can count valid starts in constant time per position.

#### How It Works

For sums:
- if `prefixSum[right] - prefixSum[left] = target`, then an earlier prefix value determines whether a valid subarray exists

For XOR:
- if `prefixXor ^ earlierPrefixXor = target`, then `earlierPrefixXor = prefixXor ^ target`

The map stores how many times each earlier prefix value has already appeared.

#### Java Implementation Notes

- Seed the map with the empty prefix value before scanning.
- For sums, the empty prefix is `0`.
- For XOR, the empty prefix is also `0`.
- Update the answer before inserting the current prefix count if you are counting subarrays ending at the current index.

#### Common Mistakes

- forgetting the initial prefix count of `0`
- confusing prefix sum formulas with prefix XOR formulas
- updating the map in the wrong order
- treating subarray and subsequence problems as the same thing

#### Quick Example

```java
import java.util.HashMap;
import java.util.Map;

class PrefixCountQuickExample {
    static int countPrefixesEqualToValue(int[] values, int target) {
        Map<Integer, Integer> count = new HashMap<>();
        count.put(0, 1);

        int prefix = 0;
        int answer = 0;
        for (int value : values) {
            prefix += value;
            answer += count.getOrDefault(prefix - target, 0);
            count.put(prefix, count.getOrDefault(prefix, 0) + 1);
        }
        return answer;
    }
}
```

#### Debugging Tip

Print the current prefix value and the map lookup target at each step. That reveals whether your algebra or your update order is wrong.

#### Advanced Note

Prefix-plus-hash solutions often look magical until you write the equation connecting two prefix states. Once that equation is clear, the map is just a counter of possible starting points.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Range Sum Query on a Static Array
#### Problem Statement

Given an integer array and many queries `[left, right]`, return the sum of the values inside each inclusive range.

#### Why This Example Matters

It is the direct reason prefix sums exist. A single preprocessing pass turns repeated range queries into constant-time work.

#### Constraints or Assumptions

- the array does not change between queries
- there may be many queries
- range boundaries are inclusive

#### Brute-Force Approach

For each query, loop from `left` to `right` and add the values directly.

This is easy to write, but repeated queries become expensive.

#### Better Approach

Precompute a prefix sum array once. Then answer each query using subtraction.

#### Why the Better Approach Works

The prefix array stores total work from the start. Subtracting two cumulative totals isolates the middle range instantly.

#### Pragmatic Java Choice

A tiny wrapper class around the prefix array keeps query logic clean and avoids repeating the formula.

#### Java Solution

```java
class RangeSumQueryExample {
    static long sumRangeBruteForce(int[] values, int left, int right) {
        long sum = 0;
        for (int index = left; index <= right; index++) {
            sum += values[index];
        }
        return sum;
    }

    static final class PrefixSumRangeQuery {
        private final long[] prefix;

        PrefixSumRangeQuery(int[] values) {
            prefix = new long[values.length + 1];
            for (int index = 0; index < values.length; index++) {
                prefix[index + 1] = prefix[index] + values[index];
            }
        }

        long sumRange(int left, int right) {
            return prefix[right + 1] - prefix[left];
        }
    }
}
```

#### Dry Run

Use `values = [2, 4, 5, 7]` and query `[1, 3]`.

Prefix array:
- `prefix[0] = 0`
- `prefix[1] = 2`
- `prefix[2] = 6`
- `prefix[3] = 11`
- `prefix[4] = 18`

Query answer:
- sum from `1` to `3` is `prefix[4] - prefix[1] = 18 - 2 = 16`

#### Time and Space Complexity

- Brute force: `O(length of range)` time per query, `O(1)` extra space
- Better approach: `O(n)` preprocessing time, `O(1)` per query, `O(n)` extra space

#### Edge Cases

- query starting at `0`
- query covering the full array
- negative numbers are handled normally

#### Common Mistakes

- forgetting that the query boundaries are inclusive
- building a prefix array of size `n` instead of `n + 1`
- using `int` when the total sum can grow large

### Worked Example 2: Apply Many Range Increment Updates
#### Problem Statement

Given an array length `n` and a list of updates `[left, right, delta]`, apply every increment to that inclusive range and return the final array.

#### Why This Example Matters

It shows the update-side version of preprocessing. Instead of making queries cheap, you make repeated range updates cheap.

#### Constraints or Assumptions

- the initial array contains all zeroes
- all updates are known in advance
- updates are inclusive ranges

#### Brute-Force Approach

For each update, loop from `left` to `right` and add `delta` to every element.

This is correct, but it costs `O(number of updates * range length)` in the worst case.

#### Better Approach

Use a difference array. Mark where each increment starts and where it stops, then reconstruct the final values with a prefix sum.

#### Why the Better Approach Works

Every range update contributes the same effect over a contiguous interval. Boundary markers are enough to represent that effect compactly until the reconstruction pass.

#### Pragmatic Java Choice

Keep the difference array separate from the final result array. That separation makes the update logic easier to debug.

#### Java Solution

```java
class RangeAdditionExample {
    static int[] applyUpdatesBruteForce(int length, int[][] updates) {
        int[] values = new int[length];

        for (int[] update : updates) {
            int left = update[0];
            int right = update[1];
            int delta = update[2];

            for (int index = left; index <= right; index++) {
                values[index] += delta;
            }
        }

        return values;
    }

    static int[] applyUpdatesOptimized(int length, int[][] updates) {
        int[] difference = new int[length];

        for (int[] update : updates) {
            int left = update[0];
            int right = update[1];
            int delta = update[2];

            difference[left] += delta;
            if (right + 1 < length) {
                difference[right + 1] -= delta;
            }
        }

        int[] result = new int[length];
        int running = 0;
        for (int index = 0; index < length; index++) {
            running += difference[index];
            result[index] = running;
        }

        return result;
    }
}
```

#### Dry Run

Use `length = 5` and updates `[[1, 3, 2], [2, 4, 3], [0, 2, -2]]`.

Difference updates:
- after `[1, 3, 2]` -> `[0, 2, 0, 0, -2]`
- after `[2, 4, 3]` -> `[0, 2, 3, 0, -2]`
- after `[0, 2, -2]` -> `[-2, 2, 3, 2, -2]`

Reconstruction by running sum:
- index `0`: `-2`
- index `1`: `0`
- index `2`: `3`
- index `3`: `5`
- index `4`: `3`

Final array: `[-2, 0, 3, 5, 3]`

#### Time and Space Complexity

- Brute force: `O(q * n)` in the worst case, where `q` is the number of updates
- Better approach: `O(q + n)` time, `O(n)` extra space

#### Edge Cases

- one update covering the full array
- `right` already at the last index
- negative deltas work naturally

#### Common Mistakes

- forgetting to subtract at `right + 1`
- reconstructing directly into the difference array and losing clarity
- trying to use this technique for online updates and queries without reconsidering the problem model

### Worked Example 3: Count Subarrays with XOR Equal to K
#### Problem Statement

Given an integer array and a target `k`, return how many contiguous subarrays have XOR equal to `k`.

#### Why This Example Matters

It combines prefix XOR with hashing. This is the chapter's most important transfer pattern.

#### Constraints or Assumptions

- the answer counts contiguous subarrays
- values may repeat
- the array may contain zeroes

#### Brute-Force Approach

Start every subarray at every index and keep a running XOR as the end index extends.

This is correct, but it still costs `O(n^2)` time.

#### Better Approach

Maintain the prefix XOR as you scan. For each position, count how many earlier prefix XOR values satisfy `earlierPrefix = currentPrefix ^ k`.

#### Why the Better Approach Works

If `prefixXor[0..right] ^ prefixXor[0..left - 1] = k`, then the earlier prefix must be exactly `currentPrefix ^ k`. A map tells you how many such earlier prefixes already exist.

#### Pragmatic Java Choice

Use a `HashMap<Integer, Integer>` from prefix XOR value to occurrence count. Seed it with the empty prefix XOR `0`.

#### Java Solution

```java
import java.util.HashMap;
import java.util.Map;

class SubarrayXorCountExample {
    static int countBruteForce(int[] values, int targetXor) {
        int answer = 0;

        for (int start = 0; start < values.length; start++) {
            int runningXor = 0;
            for (int end = start; end < values.length; end++) {
                runningXor ^= values[end];
                if (runningXor == targetXor) {
                    answer++;
                }
            }
        }

        return answer;
    }

    static int countOptimized(int[] values, int targetXor) {
        Map<Integer, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0, 1);

        int prefixXor = 0;
        int answer = 0;

        for (int value : values) {
            prefixXor ^= value;
            answer += prefixCount.getOrDefault(prefixXor ^ targetXor, 0);
            prefixCount.put(prefixXor, prefixCount.getOrDefault(prefixXor, 0) + 1);
        }

        return answer;
    }
}
```

#### Dry Run

Use `values = [4, 2, 2, 6, 4]` and `targetXor = 6`.

Optimized approach:
- start with map `{0=1}`
- read `4`, prefix XOR `4`, look for `4 ^ 6 = 2`, not found
- read `2`, prefix XOR `6`, look for `6 ^ 6 = 0`, found once -> answer `1`
- read `2`, prefix XOR `4`, look for `2`, still not found, map count for `4` becomes `2`
- read `6`, prefix XOR `2`, look for `4`, found twice -> answer `3`
- read `4`, prefix XOR `6`, look for `0`, found once -> answer `4`

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(1)` extra space
- Better approach: average `O(n)` time, `O(n)` extra space

#### Edge Cases

- empty array -> `0`
- target XOR `0` is valid and often important
- zero values can create repeated prefix XOR states

#### Common Mistakes

- forgetting the initial map entry for prefix XOR `0`
- using sum subtraction logic instead of XOR algebra
- updating the map before counting the current position's answer and changing the meaning of the scan

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- direct range queries can cost `O(n)` each without preprocessing
- prefix sums trade `O(n)` extra space for `O(1)` query time on static data
- difference arrays trade `O(n)` extra space for fast batched range updates
- prefix-plus-hash solutions often reduce subarray counting from `O(n^2)` to average `O(n)`

Choose brute force when:
- there are very few queries or updates
- the input is tiny
- preprocessing would cost more mental overhead than it saves

Choose prefix sums when:
- the array is static
- you need many contiguous range sums
- the query formula is simple subtraction from cumulative totals

Choose difference arrays when:
- you know all range updates in advance
- you want the final array after all updates, not instant answers after each one

Recognition signals for prefix-plus-hash techniques:
- count subarrays with a target sum or XOR
- longest subarray with a given cumulative property
- repeated range questions on static data

Signals not to force this technique:
- the problem is about non-contiguous choices
- the data updates online between queries and you still need fast answers
- the cumulative algebra is not actually additive or XOR-canceling

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- off-by-one errors in prefix boundaries
- forgetting the empty prefix value
- confusing prefix sum and difference array semantics
- mixing update order and query order incorrectly in prefix-plus-map problems

Boundary and state risks:
- `left = 0` queries
- `right + 1` falling outside the array in difference logic
- integer overflow in cumulative sums
- using subtraction rules for XOR or XOR rules for subtraction

Short debugging checklist:
- What exactly does `prefix[i]` mean in this solution?
- Do my formulas assume inclusive or exclusive boundaries?
- Did I seed the empty prefix state correctly?
- Am I solving many queries, many updates, or both?
- If I write out a tiny example by hand, does my prefix or difference array match it?

## 6. Practice Problems

### Easy

- Title: Range Sum Query - Immutable
  - One-line prompt: Answer many range-sum queries on a static array.
  - Expected pattern or core idea: One-dimensional prefix sums.
- Title: Find Pivot Index
  - One-line prompt: Find an index where the left sum equals the right sum.
  - Expected pattern or core idea: Prefix sums or running left-right totals.
- Title: XOR Queries of a Subarray
  - One-line prompt: Answer many range XOR queries efficiently.
  - Expected pattern or core idea: Prefix XOR.

### Medium

- Title: Subarray Sum Equals K
  - One-line prompt: Count subarrays whose sum equals a target.
  - Expected pattern or core idea: Prefix sums combined with hashing.
- Title: Range Addition
  - One-line prompt: Apply many inclusive range increment operations and return the final array.
  - Expected pattern or core idea: Difference array plus reconstruction.
- Title: Continuous Subarray Sum
  - One-line prompt: Determine whether a subarray sum is a multiple of `k`.
  - Expected pattern or core idea: Prefix remainder states stored in a map.

### Hard

- Title: Count Subarrays with XOR K
  - One-line prompt: Return how many subarrays have XOR equal to a target.
  - Expected pattern or core idea: Prefix XOR with frequency hashing.
- Title: Maximum Size Subarray Sum Equals K
  - One-line prompt: Return the maximum length of a subarray summing to `k`.
  - Expected pattern or core idea: Earliest prefix occurrence mapping.
- Title: Corporate Flight Bookings
  - One-line prompt: Apply many seat-booking increments on flight ranges.
  - Expected pattern or core idea: Difference array on offline updates.

## 7. Short Recap

The core idea of this chapter is that cumulative state lets you answer repeated range questions or batched updates without recomputing the same work.

The most important optimization insight is that prefix sums, difference arrays, and prefix-plus-hash maps each compress many local operations into one scan plus cheap lookups.

The most important implementation warning is to define your prefix meaning precisely. Most bugs here are boundary-definition bugs.

This chapter prepares the next chapter by closing the array-preprocessing part of Part II. The next chapter moves to linked lists, where structure changes matter more than index arithmetic.

## 8. Coverage Check

- [x] 8.1 One-dimensional prefix sums
- [x] 8.2 Range sum queries
- [x] 8.3 Difference arrays
- [x] 8.4 Prefix XOR
- [x] 8.5 Combining prefix data with hashing

Coverage Summary: 5/5 official subtopics covered
This must always be 5/5 before final output

Next: 9: Linked Lists
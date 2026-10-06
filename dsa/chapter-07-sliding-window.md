# 7: Sliding Window

**Goal:** Teach learners how to maintain a moving contiguous region efficiently by updating state incrementally instead of recomputing it from scratch.
**Outcome:** By the end of this chapter, you can solve fixed-size and variable-size window problems, manage window sums and frequency counts correctly, and recognize when a longest or shortest contiguous subarray problem can be solved in linear time.

---

## 1. Intuition First

A sliding window is a live segment of the array or string that moves across the input while carrying exactly the information the problem needs.

A simple real-world analogy is a camera frame moving along a long scene. You do not re-process the entire scene every time the frame shifts by one position. You remove what left the frame, add what entered the frame, and keep the running state updated.

The core mental model is this: a window works only when the answer for a contiguous region can be updated from the previous region by local changes. If you can add one item, remove one item, and still know the state, you probably have a sliding-window candidate.

The most common beginner confusion point is trying to use sliding windows on problems where the data is not contiguous or where negative values break the monotonic behavior needed for shrinking logic.

In the roadmap, this chapter is where two pointers become more powerful. Instead of just moving positions, you now maintain live state such as a running sum, a count of distinct values, or a frequency map.

## 2. Core Concepts and Techniques

### Concept Cluster: Fixed-Size Windows
Key concepts in this block:
- 7.1 Fixed-size window

#### Intuition

A fixed-size window is a moving block of constant length `k`.

#### Why It Matters

It turns repeated contiguous computations such as sums, counts, or averages from `O(nk)` into `O(n)`.

#### How It Works

For each shift by one position:
- remove the contribution of the outgoing element
- add the contribution of the incoming element
- update the answer

This works because the new window differs from the old one by only two boundary changes.

#### Java Implementation Notes

- Build the first full window once before sliding.
- Use `long` for sums when value ranges can overflow `int`.
- Be explicit about what happens when `k` is invalid.

#### Common Mistakes

- forgetting to subtract the outgoing value
- updating the answer before the first full window exists
- mixing window indexes and element values

#### Quick Example

```java
class FixedWindowQuickExample {
    static long firstWindowSum(int[] values, int k) {
        long sum = 0;
        for (int index = 0; index < k; index++) {
            sum += values[index];
        }
        return sum;
    }
}
```

#### Debugging Tip

Print the left boundary, right boundary, outgoing value, incoming value, and running state for the first few slides.

#### Advanced Note

Fixed-size windows are often the cleanest place to learn the pattern because the validity condition never changes.

### Concept Cluster: Variable-Size Windows and Longest or Shortest Patterns
Key concepts in this block:
- 7.2 Variable-size window
- 7.4 Longest and shortest subarray patterns

#### Intuition

Variable-size windows expand to include more data and shrink only when a condition becomes invalid or when the current window is already sufficient.

#### Why It Matters

This pattern solves many substring and subarray problems in linear time when the condition behaves monotonically as the boundaries move.

#### How It Works

Typical workflow:
- expand the right boundary
- update the state
- while the window is invalid or overly large, move the left boundary and repair the state
- update the best answer when the window is in the right condition

Longest-window problems usually ask you to keep windows valid as large as possible. Shortest-window problems usually ask you to shrink aggressively once the current window becomes sufficient.

#### Java Implementation Notes

- Write the validity condition in a boolean-style sentence first.
- Keep the shrink loop separate and easy to read.
- For shortest-window problems, initialize the best answer to a sentinel such as `Integer.MAX_VALUE`.

#### Common Mistakes

- forgetting to shrink repeatedly in a `while` loop
- using this technique on data with negative values when the monotonic argument fails
- updating the best answer before the window becomes valid
- shrinking too far and losing the first valid state

#### Quick Example

```java
class VariableWindowQuickExample {
    static int minLengthAtLeastTarget(int[] values, int target) {
        int left = 0;
        int sum = 0;
        int best = Integer.MAX_VALUE;

        for (int right = 0; right < values.length; right++) {
            sum += values[right];
            while (sum >= target) {
                best = Math.min(best, right - left + 1);
                sum -= values[left++];
            }
        }

        return best == Integer.MAX_VALUE ? 0 : best;
    }
}
```

#### Debugging Tip

When the answer is close but wrong, print the condition that decides whether the window should shrink. That condition is often the real source of the bug.

#### Advanced Note

Variable-size sliding windows work best when adding more elements moves the condition in one predictable direction.

### Concept Cluster: Window State Management and Frequency-Based Problems
Key concepts in this block:
- 7.3 Window state management
- 7.5 Frequency-based sliding window problems

#### Intuition

Window state is the summary you maintain for the current boundaries. Frequency-based windows store how many times each relevant value appears inside the window.

#### Why It Matters

The boundaries alone are not enough. The state tells you whether the current window is valid and how to repair it when it is not.

#### How It Works

Common window state choices:
- running sum
- count of distinct values
- frequency map or array
- number of satisfied required characters

Frequency-based windows are especially useful for:
- duplicate control
- anagram matching
- substring coverage requirements
- windows with a bounded number of distinct values

#### Java Implementation Notes

- Use a `HashMap` when the character set or value set is flexible.
- Use a fixed-size array when the alphabet is small and known.
- Remove keys whose frequency becomes zero only if that simplifies your validity logic.

#### Common Mistakes

- not decrementing state correctly when the left boundary moves
- storing more state than the problem needs
- forgetting that distinct-count logic changes when a frequency crosses `0` or `1`
- mixing up the window length with the count of unique values

#### Quick Example

```java
import java.util.HashMap;
import java.util.Map;

class FrequencyWindowQuickExample {
    static int distinctCharacters(String text, int left, int right) {
        Map<Character, Integer> frequency = new HashMap<>();
        for (int index = left; index <= right; index++) {
            char current = text.charAt(index);
            frequency.put(current, frequency.getOrDefault(current, 0) + 1);
        }
        return frequency.size();
    }
}
```

#### Debugging Tip

Print the state structure whenever the window expands or shrinks. Sliding-window bugs are usually stale-state bugs, not boundary bugs alone.

#### Advanced Note

A good window solution stores the smallest state that still lets you decide validity and update the answer.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Maximum Sum of a Subarray of Size K
#### Problem Statement

Given an integer array and an integer `k`, return the maximum sum of any contiguous subarray of size `k`.

#### Why This Example Matters

It is the cleanest fixed-size sliding-window example. It shows the exact remove-one, add-one update pattern.

#### Constraints or Assumptions

- `k` is positive
- the array may contain negative numbers
- if `k` is larger than the array length, return `0`

#### Brute-Force Approach

For every starting position, sum the next `k` elements directly.

This works, but it repeats most additions across overlapping windows.

#### Better Approach

Compute the first window sum once, then slide the window by subtracting the outgoing value and adding the incoming value.

#### Why the Better Approach Works

Adjacent windows share `k - 1` elements. Recomputing the whole sum throws away work the previous window already performed.

#### Pragmatic Java Choice

Use `long` for the running sum so large inputs do not overflow accidentally.

#### Java Solution

```java
class MaxSumFixedWindowExample {
    static long maxSumBruteForce(int[] values, int k) {
        if (k <= 0 || k > values.length) {
            return 0;
        }

        long best = Long.MIN_VALUE;
        for (int start = 0; start + k <= values.length; start++) {
            long sum = 0;
            for (int index = start; index < start + k; index++) {
                sum += values[index];
            }
            best = Math.max(best, sum);
        }
        return best;
    }

    static long maxSumOptimized(int[] values, int k) {
        if (k <= 0 || k > values.length) {
            return 0;
        }

        long windowSum = 0;
        for (int index = 0; index < k; index++) {
            windowSum += values[index];
        }

        long best = windowSum;
        for (int right = k; right < values.length; right++) {
            windowSum += values[right];
            windowSum -= values[right - k];
            best = Math.max(best, windowSum);
        }

        return best;
    }
}
```

#### Dry Run

Use `values = [2, 1, 5, 1, 3, 2]` and `k = 3`.

Optimized approach:
- first window `[2, 1, 5]` has sum `8`
- slide to `[1, 5, 1]`: `8 - 2 + 1 = 7`
- slide to `[5, 1, 3]`: `7 - 1 + 3 = 9`
- slide to `[1, 3, 2]`: `9 - 5 + 2 = 6`
- best sum is `9`

#### Time and Space Complexity

- Brute force: `O(nk)` time, `O(1)` extra space
- Better approach: `O(n)` time, `O(1)` extra space

#### Edge Cases

- `k = 1` -> answer is the maximum single value
- `k` equal to array length -> answer is the full array sum
- all negative values still work correctly

#### Common Mistakes

- forgetting to build the first complete window before sliding
- subtracting the wrong outgoing index
- using `int` when the sum may exceed its range

### Worked Example 2: Longest Substring Without Repeating Characters
#### Problem Statement

Given a string, return the length of the longest substring that contains no repeated characters.

#### Why This Example Matters

It is the standard frequency-based variable-size window problem. It forces you to maintain validity while expanding and shrinking.

#### Constraints or Assumptions

- the answer must be a contiguous substring
- characters may repeat anywhere in the string
- an empty string should return `0`

#### Brute-Force Approach

Start from every index and extend the substring until a repeated character appears.

This is simpler than checking all substrings, but it still costs `O(n^2)` time in the worst case.

#### Better Approach

Use a variable-size sliding window with a frequency map. Expand the right boundary, and while the current character frequency exceeds `1`, shrink from the left.

#### Why the Better Approach Works

The window invariant is: every character frequency inside the current window is at most `1`. When the right boundary breaks that rule, the left boundary moves until the rule is restored.

#### Pragmatic Java Choice

Use a `HashMap<Character, Integer>` for clarity. If the character set were guaranteed small and fixed, an array would also be reasonable.

#### Java Solution

```java
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

class LongestUniqueSubstringExample {
    static int lengthBruteForce(String text) {
        int best = 0;

        for (int start = 0; start < text.length(); start++) {
            Set<Character> seen = new HashSet<>();
            for (int end = start; end < text.length(); end++) {
                char current = text.charAt(end);
                if (seen.contains(current)) {
                    break;
                }
                seen.add(current);
                best = Math.max(best, end - start + 1);
            }
        }

        return best;
    }

    static int lengthOptimized(String text) {
        Map<Character, Integer> frequency = new HashMap<>();
        int left = 0;
        int best = 0;

        for (int right = 0; right < text.length(); right++) {
            char current = text.charAt(right);
            frequency.put(current, frequency.getOrDefault(current, 0) + 1);

            while (frequency.get(current) > 1) {
                char leftChar = text.charAt(left);
                frequency.put(leftChar, frequency.get(leftChar) - 1);
                if (frequency.get(leftChar) == 0) {
                    frequency.remove(leftChar);
                }
                left++;
            }

            best = Math.max(best, right - left + 1);
        }

        return best;
    }
}
```

#### Dry Run

Use `text = "abcaef"`.

Optimized approach:
- add `a`, window `"a"`, best `1`
- add `b`, window `"ab"`, best `2`
- add `c`, window `"abc"`, best `3`
- add `a`, window becomes invalid because `a` repeats
- shrink from left: remove first `a`, window becomes `"bca"`
- continue with `e`, `f`, best becomes `5` for `"bcaef"`

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(n)` extra space in the worst case
- Better approach: `O(n)` time, `O(n)` extra space

#### Edge Cases

- empty string -> `0`
- all identical characters -> `1`
- all unique characters -> full string length

#### Common Mistakes

- shrinking only once instead of until the window is valid again
- confusing substring with subsequence
- forgetting to decrement the left-side frequency when shrinking

### Worked Example 3: Minimum Size Subarray Sum
#### Problem Statement

Given an array of positive integers and a target sum, return the length of the shortest contiguous subarray whose sum is at least the target. If no such subarray exists, return `0`.

#### Why This Example Matters

It is the canonical shortest-window pattern. It also shows why positivity matters for this style of shrinking logic.

#### Constraints or Assumptions

- all values are positive
- the answer must be a contiguous subarray
- return `0` if the target cannot be reached

#### Brute-Force Approach

Start every subarray at every index and keep extending until the sum reaches or exceeds the target.

This is correct, but it costs `O(n^2)` time.

#### Better Approach

Expand the right boundary to grow the sum. As soon as the current sum reaches the target, shrink from the left as much as possible while the window still satisfies the requirement.

#### Why the Better Approach Works

Because all values are positive, removing elements from the left can only decrease the sum. That monotonic behavior makes the shrink loop safe and meaningful.

#### Pragmatic Java Choice

Keep the running sum as a simple integer or long. The algorithm does not need a map because only the total sum matters.

#### Java Solution

```java
class MinimumSizeSubarrayExample {
    static int minLengthBruteForce(int target, int[] values) {
        int best = Integer.MAX_VALUE;

        for (int start = 0; start < values.length; start++) {
            int sum = 0;
            for (int end = start; end < values.length; end++) {
                sum += values[end];
                if (sum >= target) {
                    best = Math.min(best, end - start + 1);
                    break;
                }
            }
        }

        return best == Integer.MAX_VALUE ? 0 : best;
    }

    static int minLengthOptimized(int target, int[] values) {
        int left = 0;
        int sum = 0;
        int best = Integer.MAX_VALUE;

        for (int right = 0; right < values.length; right++) {
            sum += values[right];

            while (sum >= target) {
                best = Math.min(best, right - left + 1);
                sum -= values[left];
                left++;
            }
        }

        return best == Integer.MAX_VALUE ? 0 : best;
    }
}
```

#### Dry Run

Use `target = 7` and `values = [2, 3, 1, 2, 4, 3]`.

Optimized approach:
- expand to `[2, 3, 1, 2]`, sum `8`, best `4`
- shrink to `[3, 1, 2]`, sum `6`, stop shrinking
- expand with `4`, window `[3, 1, 2, 4]`, sum `10`
- shrink to `[1, 2, 4]`, sum `7`, best `3`
- shrink to `[2, 4]`, sum `6`, stop shrinking
- expand with `3`, window `[2, 4, 3]`, sum `9`
- shrink to `[4, 3]`, sum `7`, best `2`
- shrink to `[3]`, sum `3`, stop shrinking

#### Time and Space Complexity

- Brute force: `O(n^2)` time, `O(1)` extra space
- Better approach: `O(n)` time, `O(1)` extra space

#### Edge Cases

- no subarray reaches the target -> `0`
- one element already reaches the target -> `1`
- the positivity assumption is essential; with negative values, this exact shrinking argument is not safe

#### Common Mistakes

- using the pattern without noticing that the array contains negative numbers
- updating the best answer after shrinking too far
- forgetting that shortest-window problems usually need a `while` shrink loop

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- fixed-size brute force often costs `O(nk)`
- variable-size brute force often costs `O(n^2)`
- well-formed sliding windows usually reduce these to `O(n)`
- frequency-based windows often need `O(k)` or `O(n)` extra space depending on the state structure

Choose brute force when:
- the window idea is not yet clear and you need a correctness baseline
- the input is tiny
- the condition does not support efficient incremental updates

Choose sliding windows when:
- the problem is explicitly about a contiguous substring or subarray
- the answer can be updated when one element enters or leaves
- the validity condition depends on boundary-local changes

Recognition signals for sliding windows:
- fixed-size contiguous maximum or minimum problems
- longest substring or subarray satisfying a rule
- shortest window meeting a threshold or coverage requirement
- frequency limits such as no repeats or at most `k` distinct values

Signals not to force this technique:
- the problem is not contiguous
- negative values destroy the monotonic shrinking logic you planned to use
- the state needed for each region cannot be updated incrementally

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- stale sums or stale frequency counts
- shrinking too late or too early
- updating the answer before the window reaches a valid state
- forgetting that distinct-count logic changes when a frequency crosses zero

Boundary and validity risks:
- invalid `k` values in fixed-size problems
- empty input strings or arrays
- shortest-window sentinel values not being converted back to `0` when no answer exists
- positive-number assumptions being ignored

Short debugging checklist:
- What does the current window represent?
- What exact state do I maintain for it?
- When I move the left boundary, which state entries must decrease?
- Is the shrink loop supposed to run once or until validity is restored?
- Am I solving a contiguous problem, or should I stop forcing a window?

## 6. Practice Problems

### Easy

- Title: Maximum Average Subarray I
  - One-line prompt: Return the maximum average value of any contiguous subarray of length `k`.
  - Expected pattern or core idea: Fixed-size sliding window with running sum.
- Title: Find All Anagrams in a String
  - One-line prompt: Return all start indexes where a substring is an anagram of a target string.
  - Expected pattern or core idea: Fixed-size frequency window.
- Title: Diet Plan Performance
  - One-line prompt: Score a sequence based on sums of fixed-size daily windows.
  - Expected pattern or core idea: Fixed-size sum maintenance.

### Medium

- Title: Longest Substring Without Repeating Characters
  - One-line prompt: Return the length of the longest substring with all unique characters.
  - Expected pattern or core idea: Variable-size frequency window.
- Title: Minimum Size Subarray Sum
  - One-line prompt: Return the shortest subarray length whose sum reaches a target.
  - Expected pattern or core idea: Variable-size window on positive values.
- Title: Longest Repeating Character Replacement
  - One-line prompt: Find the longest substring that can be made uniform after at most `k` replacements.
  - Expected pattern or core idea: Window validity driven by frequency state.

### Hard

- Title: Minimum Window Substring
  - One-line prompt: Return the smallest substring that contains all characters of another string.
  - Expected pattern or core idea: Frequency-based coverage window with aggressive shrinking.
- Title: Subarrays with K Different Integers
  - One-line prompt: Count subarrays that contain exactly `k` distinct values.
  - Expected pattern or core idea: Convert exact-count to at-most windows and subtract.
- Title: Sliding Window Maximum
  - One-line prompt: Return the maximum value in every fixed-size window.
  - Expected pattern or core idea: Sliding window combined with a deque.

## 7. Short Recap

The core idea of this chapter is that a window can move across contiguous data without recomputing everything from scratch, as long as you maintain the right state.

The most important optimization insight is that fixed-size and variable-size windows often reduce `O(nk)` or `O(n^2)` work to `O(n)` by updating only what changes at the boundaries.

The most important implementation warning is that window boundaries and window state must stay synchronized. Most bugs happen when one changes without the other.

This chapter prepares the next chapter by showing how local cumulative state works. Prefix sums and difference arrays store similar information globally instead of for one live window.

## 8. Coverage Check

- [x] 7.1 Fixed-size window
- [x] 7.2 Variable-size window
- [x] 7.3 Window state management
- [x] 7.4 Longest and shortest subarray patterns
- [x] 7.5 Frequency-based sliding window problems

Coverage Summary: 5/5 official subtopics covered
This must always be 5/5 before final output

Next: 8: Prefix Sum and Difference Techniques
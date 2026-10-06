# 6: Sliding Window Family

## Introduction and Context

Sliding window is the technique for contiguous ranges when recomputing state from scratch is the real bottleneck. Instead of treating every substring or subarray as a fresh object, you keep a live summary of the current range and update only what entered or left. That is why so many apparent O(n^2) range problems collapse into linear scans.

The hard part is not moving the boundaries. It is defining the right window state, deciding what makes the window valid, and recording the answer at the correct moment. Most mistakes come from stale frequency maps, shrinking too early or too late, or measuring the window before it has the required shape.

## Core Intuition and Mechanics
Think of a window as a camera frame sliding over a road.

- Fixed-size window: camera size is locked; you move one step and update what enters/leaves.
- Variable-size window: camera can zoom in/out; you expand to gain information and shrink to restore validity.

What makes sliding window work is not the picture of a moving frame but the bookkeeping behind it:

1. Define the boundaries: `left` and `right`.
2. Define the maintained state: sum, counts, distinct values, max frequency, or whatever the problem needs.
3. Define the invariant that tells you whether the current window is valid.
4. Update state in a fixed order when `right` expands and when `left` shrinks.
5. Record answers only when the window is in the required form.

In a well-formed window solution, each element enters the window once and leaves it once. That is where the linear-time behavior comes from. If the state update or validity check forces you to rescan the window, you have usually lost the main advantage of the technique.

## Core Concepts and Subtopics

### Concept Cluster: Window Basics and Fixed Size
Topics in this cluster:
- 6.1 Sliding Window Pattern; Fixed-size window

#### Definition
Sliding Window Pattern processes contiguous segments by moving boundaries and reusing previous computations instead of recomputing from scratch.  
Fixed-size window keeps window length constant at k.

#### Why It Matters
If you recompute each length-k segment from scratch, cost is usually O(nk).  
With incremental updates, cost becomes O(n).

#### How It Works
For sum-based fixed window:
- Add incoming element at right.
- When window size exceeds k, subtract outgoing element at left and increment left.
- When window size equals k, evaluate answer.

#### Internal Mechanics
Each element is added once and removed once, giving amortized constant work per index:
T(n) = O(n)

#### Java Implementation Notes
- Use int for typical constraints; use long when sum may overflow.
- Use clear variable names: left, right, windowSum.
- Keep update order consistent to avoid off-by-one bugs.

#### Clean Code Rules If Applicable
- Keep window update logic in one predictable sequence.
- Name invariant explicitly in comments if not obvious.
- Avoid hidden state mutation across methods.

#### Mini Example
Max sum of subarray of length k:
- Input: [2, 1, 5, 1, 3, 2], k=3
- Best window: [5, 1, 3], sum = 9

#### Common Mistakes
- Checking answer before window reaches size k
- Forgetting to remove outgoing element
- Using int for potentially large cumulative sums

#### Debugging Tips
Log per iteration:
- right, added value
- left, removed value
- current window size
- window summary

#### Practical Note
State your invariant first:  
“At any point, windowSum equals sum of nums[left..right].”

#### Deeper Note
Fixed window generalizes to rolling hash and streaming metrics where memory and latency are strict.

#### Related Concepts
Prefix sum, rolling hash, moving average, stream processors.

---

### Concept Cluster: Variable Window, Longest/Shortest Targets, and Frequency State
Topics in this cluster:
- 6.2 Variable-size window; Longest and shortest subarray patterns
- 6.3 Window state management; Frequency-based sliding window problems

#### Definition
Variable-size window adjusts length dynamically to satisfy a condition.  
Typical goals:
- Longest valid window
- Shortest valid window

Frequency-based windows track element counts in current range.

#### Why It Matters
Many string/array constraints are not fixed-length:
- “at most K distinct”
- “contains all chars of target”
- “no duplicate chars”

Without variable windows, brute force is often quadratic.

#### How It Works
Common pattern:
1. Expand right and update state.
2. While invalid, shrink left and clean state.
3. Record best answer when valid.

For shortest window:
- Expand until valid, then shrink aggressively to minimize length.
For longest window:
- Expand greedily and shrink only when invalid.

#### Internal Mechanics
Critical state examples:
- freq map: char -> count
- matchedTypes or matchedChars
- distinctCount
- maxFreqInWindow (for replacement-type problems)

The correctness depends on precise synchronization between boundaries and state updates.

#### Java Implementation Notes
- Prefer int[128] for ASCII speed.
- Use HashMap<Character, Integer> for generic Unicode-like cases.
- Remove keys whose count becomes zero to keep distinct counts accurate.

#### Clean Code Rules If Applicable
- Separate helper methods:
  - addChar(c), removeChar(c), isValid()
- Keep validity logic centralized.
- Avoid duplicated condition checks across loop bodies.

#### Mini Example
Longest substring without repeating chars:
- Expand right and increment frequency.
- While frequency of current char > 1, move left and decrement.
- Update max length.

#### Common Mistakes
- Shrinking only once when multiple shrinks are required
- Forgetting zero-count cleanup in map-based distinct tracking
- Mixing “validity for shortest” with “validity for longest” strategy

#### Debugging Tips
Track after each boundary move:
- left, right
- key counts
- validity flag
- current best answer

#### Practical Note
If problem says “longest/shortest contiguous segment satisfying condition,” sliding window is a top candidate.

#### Deeper Note
Frequency windows are a special case of incremental constraint maintenance, similar to online algorithms and stream analytics.

#### Related Concepts
Two pointers, hash-based counting, monotonic queue (for max/min windows), event stream processing.

---

### Concept Cluster: Trade-offs, Debugging, Recognition, and Brute-force Upgrade Path
Topics in this cluster:
- 6.4 Fixed-size window versus variable-size window trade-offs
- 6.5 Debugging windows; Off-by-one handling and stale state checks
- 6.6 Window recognition signals and brute-force to linear-scan upgrades

#### Definition
Trade-off analysis decides whether fixed or variable window is appropriate.  
Recognition signals help quickly map problem text to a window strategy.

#### Why It Matters
Wrong template selection causes:
- overcomplicated code
- incorrect logic
- unnecessary O(n^2) fallback

#### How It Works
Decision guide:
- Exact length k requested -> fixed-size window.
- Constraint-driven window (“at most”, “at least”, “contains all”) -> variable-size.
- Non-contiguous requirement -> usually not sliding window.

Brute-force upgrade:
1. Write baseline nested loops.
2. Identify repeated recomputation.
3. Replace recomputation with incremental add/remove state.
4. Prove each element enters/exits limited times.

#### Internal Mechanics
Off-by-one hot spots:
- window size formula: right - left + 1
- shrink loop condition
- answer update timing (before or after shrink)

Stale state is when map/sum/counter no longer matches actual window boundaries.

#### Java Implementation Notes
- Use assertions in debug mode:
  - window size non-negative
  - counts never negative
- Keep one source of truth for counts.

#### Clean Code Rules If Applicable
- One loop for expand, one nested while for shrink.
- Keep mutation order stable and documented.
- Do not interleave unrelated logic inside shrink loop.

#### Mini Example
Problem: shortest subarray with sum >= target (positive numbers)
- Expand right accumulating sum
- While sum >= target: update answer, then shrink left

#### Common Mistakes
- Updating answer in invalid state
- Shrinking too early
- Ignoring positive-only prerequisite for sum-based variable windows

#### Debugging Tips
When output is wrong:
1. Print first failing test and full left/right movement trace.
2. Verify state after each left/right mutation.
3. Add assertions for map counts and invariants.

#### Practical Note
Explain not only code, but why each pointer moves and why complexity is linear.

#### Deeper Note
Amortized argument is often expected: each index is touched by left/right at most once each.

#### Related Concepts
Amortized analysis, invariants, online processing, stream windows.

## Worked Examples

### Worked Example 1: Maximum Sum Subarray of Size K
#### Problem or Design Scenario
Given an integer array and integer k, return the maximum sum among all contiguous subarrays of size k.

#### Technical Value
This is a standard fixed-size sliding window problem and a foundation for rolling analytics.

#### Constraints or Assumptions
- 1 <= k <= n
- Values may be negative
- Use long if values are large

#### Example Input/Output or Usage Scenario
- Input: nums = [2, 1, 5, 1, 3, 2], k = 3
- Output: 9

#### Brute Force or Naive Approach
For every start index, sum next k elements.
- Time: O(nk)
- Space: O(1)

#### Better or Optimized Approach
Maintain rolling sum of current length-k window:
- Add nums[right]
- If size > k, subtract nums[left], left++
- If size == k, update max

#### Why the Better Approach Works
Each element is added once and removed once. No repeated summation.

#### Decision Process
Start with brute force for correctness.  
Then ask: “What recomputation repeats?”  
Repeated piece is subarray sum; replace it with incremental updates.

#### Java Solution
```java
import java.util.*;

public class MaxSumFixedWindow {
    public static long maxSumSubarrayOfSizeK(int[] nums, int k) {
        if (nums == null || nums.length == 0 || k <= 0 || k > nums.length) {
            throw new IllegalArgumentException("Invalid input");
        }

        long windowSum = 0L;
        long maxSum = Long.MIN_VALUE;
        int left = 0;

        for (int right = 0; right < nums.length; right++) {
            windowSum += nums[right];

            if (right - left + 1 > k) {
                windowSum -= nums[left];
                left++;
            }

            if (right - left + 1 == k) {
                maxSum = Math.max(maxSum, windowSum);
            }
        }

        return maxSum;
    }

    public static void main(String[] args) {
        int[] nums = {2, 1, 5, 1, 3, 2};
        System.out.println(maxSumSubarrayOfSizeK(nums, 3)); // 9
    }
}
```

#### Dry Run
For [2,1,5,1,3,2], k=3:
- right=0 sum=2
- right=1 sum=3
- right=2 sum=8 max=8
- right=3 sum=9 remove 2 =>7 max=8
- right=4 sum=10 remove 1 =>9 max=9
- right=5 sum=11 remove 5 =>6 max=9

#### Time and Space Complexity
- Time: O(n)
- Space: O(1)

#### Edge Cases
- k = 1
- k = n
- all negatives
- very large values causing int overflow

#### Common Mistakes
- Updating max before window reaches size k
- Not removing outgoing element when size exceeds k

#### Related Variants
- Minimum sum of size k
- Average over fixed window
- Count windows meeting threshold

#### Validation
Test:
- single element
- all negative
- mixed positive/negative
- max int values with long sum check

---

### Worked Example 2: Longest Substring Without Repeating Characters
#### Problem or Design Scenario
Find length of the longest substring with all unique characters.

#### Technical Value
Classic variable-size and frequency/state-maintenance problem.

#### Constraints or Assumptions
- String may contain ASCII characters
- Return only length

#### Example Input/Output or Usage Scenario
- Input: "abcabcbb"
- Output: 3 ("abc")

#### Brute Force or Naive Approach
Check all substrings; test uniqueness using set.
- Time: O(n^3) naive, or O(n^2) with optimization
- Space: up to O(n)

#### Better or Optimized Approach
Use variable window with frequency array.
- Expand right, increment freq.
- While freq[current] > 1, shrink left and decrement.
- Track max length.

#### Why the Better Approach Works
Window invariant: all characters in window have frequency at most 1.  
Shrink restores validity whenever duplicate appears.

#### Decision Process
When constraints mention “longest contiguous substring with condition,” prefer grow-and-shrink window, not restart-from-scratch loops.

#### Java Solution
```java
import java.util.*;

public class LongestUniqueSubstring {
    public static int lengthOfLongestUniqueSubstring(String s) {
        if (s == null) {
            throw new IllegalArgumentException("Input string is null");
        }

        int[] freq = new int[128];
        int left = 0;
        int best = 0;

        for (int right = 0; right < s.length(); right++) {
            char rc = s.charAt(right);
            freq[rc]++;

            while (freq[rc] > 1) {
                char lc = s.charAt(left);
                freq[lc]--;
                left++;
            }

            best = Math.max(best, right - left + 1);
        }

        return best;
    }

    public static void main(String[] args) {
        System.out.println(lengthOfLongestUniqueSubstring("abcabcbb")); // 3
        System.out.println(lengthOfLongestUniqueSubstring("bbbbb"));    // 1
        System.out.println(lengthOfLongestUniqueSubstring("pwwkew"));   // 3
    }
}
```

#### Dry Run
Input "pwwkew":
- right=0 'p' valid, best=1
- right=1 'w' valid, best=2
- right=2 'w' duplicate -> shrink left until one 'w' remains, window "w", best=2
- right=3 'k' => "wk", best=2
- right=4 'e' => "wke", best=3
- right=5 'w' duplicate -> shrink to "kew", best=3

#### Time and Space Complexity
- Time: O(n)
- Space: O(1) for fixed charset (ASCII), else O(Σ)

#### Edge Cases
- Empty string
- One character
- All same characters
- All unique characters

#### Common Mistakes
- Shrinking only once instead of while invalid
- Forgetting to decrement outgoing char count

#### Related Variants
- Longest substring with at most K distinct
- Longest repeating character replacement

#### Validation
Use randomized tests comparing with brute force for small strings.

---

### Worked Example 3: Minimum Window Substring
#### Problem or Design Scenario
Given strings s and t, find the smallest substring of s containing all characters of t with multiplicity.

#### Technical Value
A high-signal interview problem for advanced frequency-based variable windows and stale-state control.

#### Constraints or Assumptions
- ASCII input for this implementation
- If no valid window exists, return empty string

#### Example Input/Output or Usage Scenario
- Input: s="ADOBECODEBANC", t="ABC"
- Output: "BANC"

#### Brute Force or Naive Approach
Enumerate all substrings and check containment against t frequencies.
- Time: O(n^3) or O(n^2 · Σ)
- Space: O(Σ)

#### Better or Optimized Approach
- Build need[] from t.
- Expand right and update window[].
- Count how many required chars are currently satisfied.
- When fully satisfied, shrink left to get minimum window.

#### Why the Better Approach Works
Only minimal work per boundary movement.  
Invariant: when matched == t.length(), window is valid.

#### Decision Process
Use explicit counters rather than repeated map comparison.  
This avoids costly full-map checks on every step.

#### Java Solution
```java
import java.util.*;

public class MinimumWindowSubstring {
    public static String minWindow(String s, String t) {
        if (s == null || t == null || t.isEmpty() || s.isEmpty()) {
            return "";
        }

        int[] need = new int[128];
        for (char c : t.toCharArray()) {
            need[c]++;
        }

        int[] window = new int[128];
        int matched = 0;
        int left = 0;
        int minLen = Integer.MAX_VALUE;
        int start = 0;

        for (int right = 0; right < s.length(); right++) {
            char rc = s.charAt(right);
            window[rc]++;

            if (need[rc] > 0 && window[rc] <= need[rc]) {
                matched++;
            }

            while (matched == t.length()) {
                int len = right - left + 1;
                if (len < minLen) {
                    minLen = len;
                    start = left;
                }

                char lc = s.charAt(left);
                if (need[lc] > 0 && window[lc] <= need[lc]) {
                    matched--;
                }
                window[lc]--;
                left++;
            }
        }

        return minLen == Integer.MAX_VALUE ? "" : s.substring(start, start + minLen);
    }

    public static void main(String[] args) {
        System.out.println(minWindow("ADOBECODEBANC", "ABC")); // BANC
        System.out.println(minWindow("a", "aa"));              // ""
    }
}
```

#### Dry Run
For s="ADOBECODEBANC", t="ABC":
- Expand until first valid around "ADOBEC"
- Shrink to minimal valid for that right boundary
- Continue expansion and shrinking
- Best final window becomes "BANC"

#### Time and Space Complexity
- Time: O(n)
- Space: O(Σ)

#### Edge Cases
- t longer than s
- repeated chars in t (e.g., "AABC")
- no valid window

#### Common Mistakes
- Using distinct-match count when multiplicity is required
- Incorrect matched decrement order during shrink

#### Related Variants
- Smallest window containing all distinct chars of s
- Minimum window subsequence (different problem, not standard sliding window)

#### Validation
Test multiplicity-heavy targets:
- s="AAABBC", t="AABC" -> "AABBC"

## Solved Problems

### Problem 1: Maximum Average Subarray I (Easy)
#### Problem Statement
Find the maximum average value of any contiguous subarray of size k.

#### Constraints or Assumptions
- 1 <= k <= n
- Return double

#### Example
- nums=[1,12,-5,-6,50,3], k=4
- output=12.75

#### Brute Force or Naive Solution
Compute each length-k sum separately, track max.
- O(nk)

#### Optimized or Refactored Solution
Fixed-size rolling sum.
- O(n)

#### Why the Final Approach Works
Reuses prior window sum and updates by entry/exit delta.

#### Decision Process
When only fixed length matters, avoid variable-window complexity.

#### Java Solution
```java
import java.util.*;

public class MaxAverageSubarray {
    public static double findMaxAverage(int[] nums, int k) {
        if (nums == null || nums.length < k || k <= 0) {
            throw new IllegalArgumentException("Invalid input");
        }

        long sum = 0;
        for (int i = 0; i < k; i++) sum += nums[i];
        long maxSum = sum;

        for (int right = k; right < nums.length; right++) {
            sum += nums[right] - nums[right - k];
            maxSum = Math.max(maxSum, sum);
        }

        return (double) maxSum / k;
    }

    public static void main(String[] args) {
        System.out.println(findMaxAverage(new int[]{1, 12, -5, -6, 50, 3}, 4)); // 12.75
    }
}
```

#### Dry Run
Initial sum=2 (first 4 elems), then slide and update max at each step; best sum=51.

#### Time and Space Complexity
- Time: O(n)
- Space: O(1)

#### Edge Cases
- all negatives
- k=n

#### Related Variants
- minimum average of size k
- threshold count of windows

---

### Problem 2: Maximum Number of Vowels in a Substring of Given Length (Easy)
#### Problem Statement
Given string s and integer k, return max vowels in any substring of length k.

#### Constraints or Assumptions
- lowercase English letters

#### Example
- s="abciiidef", k=3 -> 3

#### Brute Force or Naive Solution
Count vowels for every length-k substring from scratch.

#### Optimized or Refactored Solution
Fixed-size window + delta update for entering/leaving chars.

#### Why the Final Approach Works
Window vowel count remains accurate after each single-step slide.

#### Decision Process
Prefer simple boolean helper for readability and testability.

#### Java Solution
```java
import java.util.*;

public class MaxVowelsFixedWindow {
    private static boolean isVowel(char c) {
        return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
    }

    public static int maxVowels(String s, int k) {
        if (s == null || k <= 0 || k > s.length()) {
            throw new IllegalArgumentException("Invalid input");
        }

        int count = 0;
        for (int i = 0; i < k; i++) {
            if (isVowel(s.charAt(i))) count++;
        }
        int best = count;

        for (int right = k; right < s.length(); right++) {
            if (isVowel(s.charAt(right))) count++;
            if (isVowel(s.charAt(right - k))) count--;
            best = Math.max(best, count);
        }

        return best;
    }

    public static void main(String[] args) {
        System.out.println(maxVowels("abciiidef", 3)); // 3
    }
}
```

#### Dry Run
Window "abc" =>1, "bci"=>1, "cii"=>2, "iii"=>3, best=3.

#### Time and Space Complexity
- Time: O(n)
- Space: O(1)

#### Edge Cases
- k=1
- no vowels
- all vowels

#### Related Variants
- max consonants in size k
- mixed-case vowel handling

---

### Problem 3: Longest Subarray with Sum at Most K (Medium, Positive Numbers)
#### Problem Statement
Given positive integers nums and target k, find longest contiguous subarray with sum <= k.

#### Constraints or Assumptions
- nums contains positive integers only

#### Example
- nums=[1,2,1,0,1,1,0], k=4 -> 5

#### Brute Force or Naive Solution
Try all subarrays, compute sums.

#### Optimized or Refactored Solution
Variable-size window:
- Expand right add nums[right]
- While sum > k shrink left
- Update max length

#### Why the Final Approach Works
Positive-only property ensures shrinking reduces sum and expanding increases monotonic accumulation behavior.

#### Decision Process
Validate positivity assumption first. If negatives allowed, this template may fail.

#### Java Solution
```java
import java.util.*;

public class LongestSubarraySumAtMostK {
    public static int longestAtMostK(int[] nums, int k) {
        if (nums == null || k < 0) {
            throw new IllegalArgumentException("Invalid input");
        }

        int left = 0;
        long sum = 0;
        int best = 0;

        for (int right = 0; right < nums.length; right++) {
            if (nums[right] < 0) {
                throw new IllegalArgumentException("Only positive numbers allowed");
            }
            sum += nums[right];

            while (sum > k && left <= right) {
                sum -= nums[left++];
            }

            best = Math.max(best, right - left + 1);
        }

        return best;
    }

    public static void main(String[] args) {
        System.out.println(longestAtMostK(new int[]{1, 2, 1, 0, 1, 1, 0}, 4)); // 5
    }
}
```

#### Dry Run
Grow until sum exceeds 4, then shrink. Best valid length reaches 5.

#### Time and Space Complexity
- Time: O(n)
- Space: O(1)

#### Edge Cases
- k=0 with zeros present
- single element > k
- empty array

#### Related Variants
- shortest subarray with sum >= k (positive numbers)
- exact sum k with prefix sums

---

### Problem 4: Longest Repeating Character Replacement (Medium)
#### Problem Statement
Given uppercase string s and integer k, return length of longest substring that can become same character after replacing at most k chars.

#### Constraints or Assumptions
- s contains A-Z
- k >= 0

#### Example
- s="AABABBA", k=1 -> 4

#### Brute Force or Naive Solution
Check all substrings; for each, compute replacements needed from char frequencies.

#### Optimized or Refactored Solution
Variable window with frequency array and maxFreq in current window:
- valid if windowSize - maxFreq <= k
- shrink when invalid

#### Why the Final Approach Works
Needed replacements are exactly non-majority chars in the window.

#### Decision Process
Use array over map for fixed alphabet speed and simplicity.

#### Java Solution
```java
import java.util.*;

public class LongestRepeatingReplacement {
    public static int characterReplacement(String s, int k) {
        if (s == null || k < 0) {
            throw new IllegalArgumentException("Invalid input");
        }

        int[] freq = new int[26];
        int left = 0;
        int maxFreq = 0;
        int best = 0;

        for (int right = 0; right < s.length(); right++) {
            int idx = s.charAt(right) - 'A';
            freq[idx]++;
            maxFreq = Math.max(maxFreq, freq[idx]);

            while ((right - left + 1) - maxFreq > k) {
                freq[s.charAt(left) - 'A']--;
                left++;
            }

            best = Math.max(best, right - left + 1);
        }

        return best;
    }

    public static void main(String[] args) {
        System.out.println(characterReplacement("AABABBA", 1)); // 4
    }
}
```

#### Dry Run
Window expands to size 5 but invalid, shrinks, best remains 4.

#### Time and Space Complexity
- Time: O(n)
- Space: O(1)

#### Edge Cases
- k=0
- all same chars
- empty string

#### Related Variants
- lowercase/mixed alphabet
- returning actual substring

---

### Problem 5: Substring with Concatenation of All Words (Hard)
#### Problem Statement
Given string s and words[] equal-length words, return all start indices where substring is concatenation of all words exactly once, contiguous.

#### Constraints or Assumptions
- all words have same length
- words length may repeat

#### Example
- s="barfoothefoobarman", words=["foo","bar"] -> [0,9]

#### Brute Force or Naive Solution
For each start, split chunks and compare multisets.

#### Optimized or Refactored Solution
Use sliding windows over aligned offsets:
- For each offset in [0, wordLen-1], slide by wordLen.
- Maintain window word frequency.
- Shrink when a word frequency exceeds allowed count.
- Record when matched word count equals words.length.

#### Why the Final Approach Works
Alignment by word length reduces state updates to chunk boundaries and preserves contiguous segmentation validity.

#### Decision Process
Hard part is not map logic; hard part is index alignment and stale word cleanup.

#### Java Solution
```java
import java.util.*;

public class SubstringConcatWords {
    public static List<Integer> findSubstring(String s, String[] words) {
        List<Integer> result = new ArrayList<>();
        if (s == null || words == null || words.length == 0 || words[0].isEmpty()) {
            return result;
        }

        int wordLen = words[0].length();
        int totalWords = words.length;
        int windowLen = wordLen * totalWords;
        if (s.length() < windowLen) return result;

        Map<String, Integer> target = new HashMap<>();
        for (String w : words) {
            target.put(w, target.getOrDefault(w, 0) + 1);
        }

        for (int offset = 0; offset < wordLen; offset++) {
            int left = offset;
            int count = 0;
            Map<String, Integer> window = new HashMap<>();

            for (int right = offset; right + wordLen <= s.length(); right += wordLen) {
                String word = s.substring(right, right + wordLen);

                if (!target.containsKey(word)) {
                    window.clear();
                    count = 0;
                    left = right + wordLen;
                    continue;
                }

                window.put(word, window.getOrDefault(word, 0) + 1);
                count++;

                while (window.get(word) > target.get(word)) {
                    String leftWord = s.substring(left, left + wordLen);
                    window.put(leftWord, window.get(leftWord) - 1);
                    if (window.get(leftWord) == 0) {
                        window.remove(leftWord);
                    }
                    left += wordLen;
                    count--;
                }

                if (count == totalWords) {
                    result.add(left);

                    String leftWord = s.substring(left, left + wordLen);
                    window.put(leftWord, window.get(leftWord) - 1);
                    if (window.get(leftWord) == 0) {
                        window.remove(leftWord);
                    }
                    left += wordLen;
                    count--;
                }
            }
        }

        return result;
    }

    public static void main(String[] args) {
        System.out.println(findSubstring("barfoothefoobarman", new String[]{"foo", "bar"})); // [0, 9]
    }
}
```

#### Dry Run
Offset 0:
- read "bar","foo" -> matched 2 words => add 0
- continue...
- later "foo","bar" -> add 9

#### Time and Space Complexity
- Time: O(n * wordLen) effectively linear in chunks
- Space: O(m) where m is number of distinct words

#### Edge Cases
- repeated words in dictionary
- no matches
- overlapping matches

#### Related Variants
- variable word lengths (much harder)
- wildcard dictionary entries

## Recognition Guide
Use sliding window when you see:
- contiguous subarray/substring
- longest/shortest segment with constraint
- at most/at least/exactly K style conditions
- repeated recomputation across overlapping ranges

Recognition signals:
- “Find maximum/minimum over all contiguous segments”
- “Contains all required characters”
- “No duplicates / at most K distinct”
- “Fixed size K”

Constraint clues:
- large n (e.g., 10^5 or 10^6), brute force infeasible
- expected near-linear solution

Invariants to watch:
- state matches current [left..right]
- validity condition is always explicit
- shrink loop restores validity fully, not partially

Common traps:
- using sliding window when condition is non-monotonic
- applying positive-number sum window logic to arrays with negatives
- stale map counts after left moves

When not to use:
- non-contiguous subsequence problems
- global reordering problems
- constraints that do not preserve monotonic validity under shrink/expand

Brute force to linear-scan upgrade checklist:
1. Write brute force.
2. Identify overlapping work.
3. Define window state.
4. Define validity.
5. Convert to add/remove updates.
6. Prove each pointer moves at most n times.

## Comparison Tables

| Aspect | Fixed-Size Window | Variable-Size Window |
|---|---|---|
| Window length | Constant | Dynamic |
| Typical goal | best metric for size k | longest/shortest valid window |
| Core operation | add right, remove left when size > k | add right, shrink while invalid |
| Complexity | usually O(n) | usually O(n) amortized |
| State complexity | low to medium | medium to high |
| Common bugs | wrong size checks | incorrect shrink logic, stale state |
| Best use cases | moving average, max sum of length k | min cover, at-most-K distinct |

| Approach | Runtime | Space | Simplicity | Maintainability | Notes |
|---|---|---|---|---|---|
| Brute force contiguous scan | O(n^2) to O(n^3) | low | high initially | low for large constraints | good baseline for correctness |
| Sliding window with sum | O(n) | O(1) | high | high | requires monotonic condition for variable sum windows |
| Sliding window with frequency map | O(n) | O(Σ) | medium | medium | powerful for string constraints |

| Pattern | Use When | Not Ideal When |
|---|---|---|
| Sliding window | contiguous + incremental condition | non-contiguous or non-monotonic constraints |
| Prefix sum + hashmap | exact sum targets, count subarrays | window validity not monotonic |
| Monotonic deque | window min/max queries | generic frequency constraints |

## Design and Decision Making
Relevant design patterns:
- Strategy Pattern: select fixed-window or variable-window strategy by problem shape.
- Template Method style: common skeleton for expand/shrink with custom validity logic.

Clean code rules for this chapter:
- Keep invariant in one sentence near loop.
- Use helper methods for add/remove/isValid in complex windows.
- Separate result update logic from state mutation logic.
- Prefer descriptive names: requiredCount, matchedCount, distinctCount.

Reusable architecture ideas:
- Build a small WindowState class for complex problems:
  - add(x), remove(x), isValid()
- Makes testing easier and reduces duplicated bug-prone map logic.

Pragmatic choices:
- Start with arrays for fixed alphabets (performance, simpler).
- Use HashMap for flexible token domains.
- Avoid over-abstraction on easy problems; add abstraction only once logic repeats.

Class/module organization:
- problem-specific class per algorithm
- private helper methods for validation and state updates
- avoid global mutable state in interview code

Naming conventions:
- left/right for boundaries
- need/window for frequency maps
- best, minLen, maxLen for objective variables

API design:
- Validate inputs early
- return neutral values (empty string/list) when no solution
- throw IllegalArgumentException when misuse is programming error

Testability:
- deterministic function signatures
- include brute-force checker for small random tests
- add edge-case unit tests for empty, single element, repeated chars

## Practical Applications
Backend systems:
- rolling error-rate windows
- request throughput over last N seconds

Frontend apps:
- real-time typing analytics over recent keystrokes
- recent activity summaries

Databases:
- moving aggregates over time-series partitions
- stream processing windows in event pipelines

Distributed systems:
- rate limiter counters in sliding time windows
- anomaly detection over recent metrics

Operating systems:
- CPU scheduler metrics across recent time slices

Networking:
- packet-loss monitoring over recent packets

AI systems:
- token-window based local statistics
- streaming feature extraction on recent events

Mobile apps:
- battery and sensor trend smoothing

Games:
- damage/heal streak analysis over last k actions
- latency smoothing windows for matchmaking

## Failure Modes and Trade-offs
Senior engineer insights:
- Most window bugs are state-sync bugs, not algorithm-choice bugs.
- In hard problems, draw timeline of boundary movement first.

Hidden tricks:
- For ASCII problems, int[128] is often faster and cleaner than HashMap.
- For “contains all with multiplicity,” track matched character count, not just distinct types.

Performance tuning:
- avoid repeated substring creation in hot loops unless necessary
- avoid map.remove/add churn if count arrays can work

Trade-off thinking:
- clearer code with small constant overhead is often better than hyper-optimized unreadable loops
- optimize only after baseline correctness and profiling

Interview traps:
- claiming O(n) without amortized pointer argument
- forgetting prerequisites (positive numbers) for sum-based variable windows

Common weak spots:
- update order in shrink loop
- off-by-one around right-left+1
- handling no-solution output

Failure modes and debugging strategy:
1. Reproduce smallest failing input.
2. Log every boundary move and state delta.
3. Assert non-negative counts.
4. Compare against brute force on random small tests.

## Condensed Notes
Key rules:
- contiguous + optimization pressure -> think sliding window
- fixed length -> fixed-size template
- condition-based length -> variable-size template

Templates:
- Fixed:
  - expand right
  - if size > k remove left
  - if size == k record answer
- Variable:
  - expand right
  - while invalid shrink left
  - record answer in valid state

Formulas:
- window size = right - left + 1
- replacement needed = window size - maxFreq

Gotchas:
- stale frequency after left++
- answer updated in wrong phase
- negative numbers breaking monotonic sum assumptions

Decision shortcuts:
- “exactly length k” -> fixed
- “longest/shortest satisfying condition” -> variable
- “non-contiguous” -> probably not sliding window

Quick checklist:
1. invariant defined?
2. add/remove symmetric?
3. shrink uses while when needed?
4. edge cases tested?

## Additional Problems

### Easy (5)
1. Title: Max Sum Size K  
One-line prompt: Find maximum sum among all subarrays of length k.  
Expected pattern or concept: Fixed-size window with rolling sum.

2. Title: Min Sum Size K  
One-line prompt: Find minimum sum among all subarrays of length k.  
Expected pattern or concept: Fixed-size window.

3. Title: Max Vowels Size K  
One-line prompt: Return max vowel count in any substring of size k.  
Expected pattern or concept: Fixed-size + incremental count.

4. Title: Average Threshold Count  
One-line prompt: Count windows of size k whose average >= threshold.  
Expected pattern or concept: Fixed-size numeric window.

5. Title: First Negative in Every Window  
One-line prompt: For each size-k window, report first negative element.  
Expected pattern or concept: Fixed-size + auxiliary queue.

### Medium (5)
1. Title: Longest Unique Substring  
One-line prompt: Find longest substring without repeating chars.  
Expected pattern or concept: Variable-size + frequency state.

2. Title: At Most K Distinct  
One-line prompt: Longest substring with at most k distinct characters.  
Expected pattern or concept: Variable-size + distinct counter.

3. Title: Fruit Into Baskets  
One-line prompt: Longest subarray containing at most two distinct values.  
Expected pattern or concept: Variable-size map counts.

4. Title: Character Replacement  
One-line prompt: Longest substring transformable to single char with <=k replacements.  
Expected pattern or concept: Variable-size + maxFreq invariant.

5. Title: Permutation in String  
One-line prompt: Check if s2 contains a permutation of s1.  
Expected pattern or concept: Fixed-size frequency matching.

### Hard (5)
1. Title: Minimum Window Substring  
One-line prompt: Smallest window containing all chars of target with multiplicity.  
Expected pattern or concept: Variable-size frequency cover.

2. Title: Substring Concatenation of All Words  
One-line prompt: Find all starts of concatenated dictionary words.  
Expected pattern or concept: Multi-offset chunked sliding window.

3. Title: Longest Substring with Exactly K Distinct  
One-line prompt: Find longest substring with exactly k distinct chars.  
Expected pattern or concept: At-most trick + careful validity.

4. Title: Count Subarrays with Product Less Than K  
One-line prompt: Count all contiguous subarrays with product < k.  
Expected pattern or concept: Variable-size multiplicative window.

5. Title: Minimum Size Subarray Sum  
One-line prompt: Smallest subarray with sum >= target (positive ints).  
Expected pattern or concept: Variable-size shrink-to-minimize.

## Key Questions

1. Question: What distinguishes fixed-size from variable-size sliding window?  
Answer: Fixed-size has constant length and always evicts once size exceeds k. Variable-size adjusts boundaries based on validity conditions and usually shrinks in a while loop.

2. Question: Why is sliding window often linear?  
Answer: Each element enters and leaves the window at most once, so left and right each move at most n steps.

3. Question: When does sum-based variable window fail?  
Answer: With negative numbers, monotonic behavior breaks, so shrink/expand rules may skip valid solutions.

4. Question: How do you prevent stale frequency-map state?  
Answer: Update map exactly when boundaries move; decrement before left++ and remove zero-count keys when distinct counts matter.

5. Question: What is the key invariant in minimum window substring?  
Answer: Current window is valid when matched required characters count equals target length (with multiplicity).

6. Question: Why use arrays instead of HashMap in many string windows?  
Answer: For bounded charsets, arrays are faster, simpler, and avoid hashing overhead.

7. Question: Common off-by-one mistake?  
Answer: Using right-left instead of right-left+1 for current length.

8. Question: How do you debug wrong output quickly?  
Answer: Compare with brute force on small random inputs and log boundary/state transitions at first mismatch.

9. Question: Can sliding window solve non-contiguous subsequence problems?  
Answer: Usually no. Sliding window is for contiguous segments.

10. Question: How do you explain trade-offs in interview?  
Answer: Present brute force baseline, identify repeated work, show incremental state updates, and justify complexity and correctness with invariants.

## Applied Project
Objective:
- Build a Sliding Window Analytics Toolkit for event streams.

Required features:
- fixed-size metrics: moving sum, moving average, max count condition
- variable-size detectors: longest stable streak, shortest alert-cover interval
- string analyzer: min cover and uniqueness windows

Suggested Java module structure:
- analyzer.core
  - WindowState.java
  - FixedWindowProcessor.java
  - VariableWindowProcessor.java
- analyzer.metrics
  - MovingAverage.java
  - ThresholdCounter.java
- analyzer.string
  - UniqueSubstringAnalyzer.java
  - MinCoverAnalyzer.java
- analyzer.test
  - BruteForceOracleTests.java
  - EdgeCaseTests.java

Testing ideas:
- deterministic unit tests for known examples
- randomized differential tests against brute force for small inputs
- performance test with large synthetic streams

Stretch goals:
- generic tokenizer support
- pluggable window state strategies
- metric export hooks for monitoring dashboards


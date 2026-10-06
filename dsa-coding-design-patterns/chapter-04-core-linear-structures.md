# 4: Core Linear Structures

## Introduction and Context

Arrays, strings, and hash-based lookups are the everyday tools of algorithm work. Later patterns like two pointers, sliding windows, and dynamic programming often look more advanced, but they still depend on the same core decisions you learn here: how to access data, what state to carry forward, and which repeated work can be avoided.

This chapter is really about choosing the right representation before writing the loop. Some problems want direct indexing, some want frequency lookup, some want cumulative state, and some want local rearrangement. The common failures are off-by-one boundaries, rebuilding strings inefficiently, using hashing without understanding equality, and recomputing ranges that could have been accumulated once.

## Core Intuition and Mechanics

Think of linear structures as different ways of navigating one line of data.

- An **array** is a numbered row of lockers: direct access is cheap, middle insertion is expensive.
- A **string** is a sealed version of that row: reading is easy, but rebuilding is expensive unless you use mutable helpers like `StringBuilder`.
- A **HashMap** is a keyed jump table: you pay hashing overhead to avoid repeated scanning.
- A **prefix sum** is carried state: instead of recomputing every range, you store enough past work to answer future queries cheaply.

The important mechanics are access pattern and carried state. If you need instant position lookup, indexes dominate. If you need membership or counts, hashing dominates. If you need many range totals, prefix accumulation dominates. If you need local rearrangement, in-place swaps and reversals dominate. If you need the best contiguous result, algorithms like Kadane keep only the useful part of the past instead of carrying everything forward.

Once you see these as choices about what work to precompute, reuse, or discard, later patterns stop feeling like isolated tricks and start feeling like structured extensions of the same linear-data toolbox.

## Core Concepts and Subtopics

---

### Concept Cluster 1: Arrays — Traversal, Indexing, Mutation, and Rearrangement

**Topics in this cluster:**
- Traversal and indexing patterns
- Insertion and deletion
- Searching and lookup strategies
- Rotation and rearrangement problems

#### Definition

An **array** is a fixed-size, contiguous block of memory where every element is accessed by a zero-based integer index in O(1) time.

In Java, arrays are objects. The declaration `int[] nums = new int[5]` allocates space for exactly five integers on the heap. The length is fixed at creation. If you need a dynamic array, use `ArrayList<Integer>`.

#### Why It Matters

Arrays are the substrate of almost every other structure — heaps, segment trees, hash tables, queues, and stacks can all be built on top of arrays. If you understand array access patterns deeply, you understand the performance profile of everything built on top.

#### How It Works

| Operation | Array | ArrayList |
|---|---|---|
| Random access by index | O(1) | O(1) |
| Append at end | N/A (fixed) | O(1) amortized |
| Insert at position i | O(n) shift | O(n) shift |
| Delete at position i | O(n) shift | O(n) shift |
| Search (unsorted) | O(n) | O(n) |
| Search (sorted, binary search) | O(log n) | O(log n) |

#### Traversal Patterns

**Forward traversal** — the default:
```java
for (int i = 0; i < nums.length; i++) {
    process(nums[i]);
}
```

**Reverse traversal** — useful for rotation and palindrome checks:
```java
for (int i = nums.length - 1; i >= 0; i--) {
    process(nums[i]);
}
```

**Two-index traversal** — scanning from both ends (preview of Chapter 5):
```java
int left = 0, right = nums.length - 1;
while (left < right) {
    // process pair nums[left], nums[right]
    left++;
    right--;
}
```

**Index-safety rule**: Always guard array access. The most common bug is an `ArrayIndexOutOfBoundsException` caused by off-by-one errors. If you access `nums[i + 1]`, your loop condition must be `i < nums.length - 1`, not `i < nums.length`.

#### Insertion and Deletion

In a raw array, insertion at index `k` requires shifting elements `k..n-1` one step to the right:

```java
// Insert value at index k in array of current used size n
// (array must have capacity n+1)
for (int i = n; i > k; i--) {
    arr[i] = arr[i - 1];
}
arr[k] = value;
```

Deletion at index `k` shifts elements left:

```java
for (int i = k; i < n - 1; i++) {
    arr[i] = arr[i + 1];
}
// Decrease n by 1 conceptually
```

Use `ArrayList` when you need frequent insertions or deletions; use raw arrays when size is fixed and performance is critical.

#### Searching and Lookup Strategies

- **Linear search**: O(n). Scan every element. Use when unsorted or when the array is tiny.
- **Binary search**: O(log n). Requires sorted array. Use `Arrays.binarySearch(arr, target)` or implement manually.
- **Hash-based lookup**: O(1) average. Use a `HashMap` or `HashSet` when you need repeated "does element X exist?" queries.

**Rule of thumb**: If you search the same array more than once, preload it into a `HashMap` or `HashSet` and search in O(1) per query.

#### Rotation and Rearrangement

Array rotation is a classic interview topic. Rotating `[1,2,3,4,5]` right by 2 produces `[4,5,1,2,3]`.

**Reverse-based rotation** — elegant O(n) time, O(1) space:

1. Reverse the entire array.
2. Reverse the first `k` elements.
3. Reverse the remaining `n-k` elements.

```java
import java.util.Arrays;

public class ArrayRotation {
    public static void rotate(int[] nums, int k) {
        int n = nums.length;
        k %= n; // handle k >= n
        reverse(nums, 0, n - 1);
        reverse(nums, 0, k - 1);
        reverse(nums, k, n - 1);
    }

    private static void reverse(int[] nums, int left, int right) {
        while (left < right) {
            int temp = nums[left];
            nums[left] = nums[right];
            nums[right] = temp;
            left++;
            right--;
        }
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3, 4, 5};
        rotate(nums, 2);
        System.out.println(Arrays.toString(nums)); // [4, 5, 1, 2, 3]
    }
}
```

**Dry run** for `rotate([1,2,3,4,5], 2)`:
- After full reverse: `[5,4,3,2,1]`
- After reverse first 2: `[4,5,3,2,1]`
- After reverse last 3: `[4,5,1,2,3]` ✓

#### Common Mistakes

- Off-by-one in loop bounds (most common bug in array code)
- Using `==` to compare arrays; use `Arrays.equals(a, b)` instead
- Forgetting `k %= n` before rotation, causing index out of bounds when `k >= n`
- Mutating an array while iterating over it

#### Practical Note

Rotation problems often appear disguised: "shift elements right by k", "find the minimum in a rotated sorted array", or "search in a rotated sorted array." The reverse trick is the cleanest in-place rotation. Binary search on a rotated sorted array is a direct follow-up.

---

### Concept Cluster 2: Strings — Fundamentals, Traversal, and Frequency Counting

**Topics in this cluster:**
- Character arrays and string fundamentals
- String traversal and frequency counting

#### Definition

In Java, a `String` is an **immutable** sequence of `char` values backed by a `char[]` internally. Immutability means every operation that appears to modify a string (like `s + "x"`) actually creates a **new** `String` object. This is critical for performance.

A `char` in Java is a 16-bit Unicode code unit. For ASCII problems, characters fit within `'a'`–`'z'` (26 values), `'A'`–`'Z'`, and `'0'`–`'9'`.

#### Why It Matters

String problems dominate technical interviews. Anagrams, palindromes, character windows, and tokenizing are everywhere. Understanding that strings are immutable — and that `StringBuilder` is the mutable alternative — is the difference between O(n) and O(n²) string building.

#### How It Works

```java
String s = "hello";
char c = s.charAt(2);          // 'l'   — O(1)
int len = s.length();          // 5     — O(1)
String sub = s.substring(1,4); // "ell" — O(k) where k = length of substring
```

**String concatenation in a loop creates a new object every iteration:**

```java
// BAD — O(n²) total work because each + copies the whole string so far
String result = "";
for (char ch : chars) {
    result += ch;
}

// GOOD — O(n) with StringBuilder
StringBuilder sb = new StringBuilder();
for (char ch : chars) {
    sb.append(ch);
}
String result = sb.toString();
```

#### Character-Array Traversal Template

```java
String s = "abcabc";
for (int i = 0; i < s.length(); i++) {
    char c = s.charAt(i);
    // process c
}
```

#### Frequency Counting with an Array

For lowercase-only problems, an `int[26]` is faster and lighter than a `HashMap<Character,Integer>`:

```java
int[] freq = new int[26];
for (char c : s.toCharArray()) {
    freq[c - 'a']++;
}
// freq[0] = count of 'a', freq[1] = count of 'b', ...
```

For general characters (Unicode, digits, punctuation), use `HashMap<Character, Integer>`:

```java
Map<Character, Integer> freq = new HashMap<>();
for (char c : s.toCharArray()) {
    freq.put(c, freq.getOrDefault(c, 0) + 1);
}
```

#### Clean Code Rules

- Prefer `s.toCharArray()` in a for-each loop when you only need characters sequentially; it is readable and avoids repeated `charAt` calls.
- Use `int[26]` for lowercase-only problems; it avoids HashMap overhead and is more cache-friendly.
- Name the frequency array or map `freq` or `count`, not `arr` or `map`.

#### Common Mistakes

- Calling `s.toCharArray()` inside a nested loop — this allocates a new array every call.
- Comparing characters with `==` on `Character` objects (autoboxing pitfall) — always use `char` primitives when iterating.
- Forgetting that `s.substring(i,j)` is exclusive of `j`.

---

### Concept Cluster 3: Substrings, Subsequences, Palindromes, and Interview String Patterns

**Topics in this cluster:**
- Substrings and subsequences
- Palindrome problems
- StringBuilder and mutable string workflows
- Common interview string patterns

#### Substrings vs Subsequences

| Concept | Contiguous? | Example (s="abcde") |
|---|---|---|
| **Substring** | Yes | "bcd" (indices 1–3) |
| **Subsequence** | No | "ace" (skip b,d) |

A **substring** is a contiguous portion of the original string. There are O(n²) substrings in a string of length n.

A **subsequence** preserves relative order but allows gaps. There are O(2ⁿ) subsequences. Subsequences appear heavily in DP chapters (LCS, Edit Distance).

#### Palindrome Problems

A **palindrome** reads the same forwards and backwards: "racecar", "madam", "abcba".

**Two-pointer palindrome check** — O(n) time, O(1) space:

```java
public static boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;
    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) return false;
        left++;
        right--;
    }
    return true;
}
```

**Expand-around-center** — useful for finding the longest palindromic substring:

```java
public class LongestPalindrome {
    public static String longestPalindrome(String s) {
        int start = 0, maxLen = 1;
        for (int i = 0; i < s.length(); i++) {
            // Odd-length palindromes (center at i)
            int len1 = expand(s, i, i);
            // Even-length palindromes (center between i and i+1)
            int len2 = expand(s, i, i + 1);
            int len = Math.max(len1, len2);
            if (len > maxLen) {
                maxLen = len;
                start = i - (len - 1) / 2;
            }
        }
        return s.substring(start, start + maxLen);
    }

    private static int expand(String s, int left, int right) {
        while (left >= 0 && right < s.length()
               && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        return right - left - 1;
    }

    public static void main(String[] args) {
        System.out.println(longestPalindrome("babad")); // "bab" or "aba"
        System.out.println(longestPalindrome("cbbd"));  // "bb"
    }
}
```

#### StringBuilder Workflows

Use `StringBuilder` whenever you build a string incrementally:

```java
// Reverse a string — O(n), O(n) space
public static String reverse(String s) {
    return new StringBuilder(s).reverse().toString();
}

// Build a result string with condition
public static String keepDigits(String s) {
    StringBuilder sb = new StringBuilder();
    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) sb.append(c);
    }
    return sb.toString();
}
```

Key `StringBuilder` methods:
- `append(x)` — add to end
- `insert(i, x)` — insert at index
- `delete(i, j)` — remove range [i, j)
- `reverse()` — reverse in place
- `toString()` — produce final immutable `String`

#### Common Interview String Patterns

| Pattern | Problem Example |
|---|---|
| Anagram check | Two strings are anagrams iff their sorted characters are equal, or their frequency arrays are equal |
| Valid parentheses | Stack-based balance check |
| First unique character | Frequency count → scan for freq == 1 |
| Longest palindromic substring | Expand around center |
| Reverse words in a string | Split → reverse array → join |
| Is one string a rotation of another? | Check if s2 is a substring of s1+s1 |

#### Practical Note

When a string problem mentions "all distinct characters" or "at most k distinct characters," it is usually a sliding window problem (Chapter 6). When it mentions "anagram" or "permutation exists in string," it is a sliding window with a frequency map. Recognizing these signals early saves enormous time.

---

### Concept Cluster 4: HashMap and HashSet — Frequency Counter and Lookup Patterns

**Topics in this cluster:**
- HashMap fundamentals
- HashSet fundamentals
- Frequency Counter Pattern
- Hash Map Lookup Pattern
- Frequency maps and counting patterns

#### Definition

A **HashMap<K,V>** stores key-value pairs. Every key is unique. Lookup, insertion, and deletion are O(1) average. In Java, `HashMap` is backed by an array of **buckets**; a hash function maps keys to bucket indices.

A **HashSet<E>** stores unique elements with O(1) average contains/add/remove. It is effectively a `HashMap` where the value is always a dummy sentinel.

#### Why It Matters

Hash structures collapse many O(n) scan problems into O(1) lookups. The **Two Sum** problem is a standard example: naively O(n²) with nested loops, but O(n) with a `HashMap`. Any time you find yourself scanning an array inside another loop to find something, ask: "Could a map or set precompute this?"

#### Frequency Counter Pattern

**Intuition**: Count how many times each element appears, then reason about those counts.

```java
import java.util.*;

public class FrequencyCounter {
    // Count frequencies
    public static Map<Integer, Integer> buildFreqMap(int[] nums) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int num : nums) {
            freq.put(num, freq.getOrDefault(num, 0) + 1);
        }
        return freq;
    }

    // Classic use: are two strings anagrams?
    public static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] freq = new int[26];
        for (char c : s.toCharArray()) freq[c - 'a']++;
        for (char c : t.toCharArray()) freq[c - 'a']--;
        for (int count : freq) {
            if (count != 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isAnagram("anagram", "nagaram")); // true
        System.out.println(isAnagram("rat", "car"));         // false
    }
}
```

#### Hash Map Lookup Pattern

**Intuition**: Store previously seen values in a map so you can answer "have I seen the complement of this element?" in O(1).

```java
import java.util.*;

public class TwoSum {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>(); // value -> index
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2,7,11,15}, 9)));
        // [0, 1]
    }
}
```

**Dry run** for `twoSum([2,7,11,15], 9)`:
- i=0, num=2, complement=7, seen={}, add {2→0}
- i=1, num=7, complement=2, seen={2→0}, FOUND → return [0,1] ✓

#### Frequency Maps and Counting Patterns

Common counting idioms:

```java
// Count occurrences and find first character with freq == 1
public static char firstUniqueChar(String s) {
    int[] freq = new int[26];
    for (char c : s.toCharArray()) freq[c - 'a']++;
    for (char c : s.toCharArray()) {
        if (freq[c - 'a'] == 1) return c;
    }
    return ' ';
}

// Top K frequent elements using frequency map + heap
import java.util.*;
public static int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.put(n, freq.getOrDefault(n, 0) + 1);
    // Min-heap of size k
    PriorityQueue<Integer> heap = new PriorityQueue<>(
        (a, b) -> freq.get(a) - freq.get(b)
    );
    for (int key : freq.keySet()) {
        heap.offer(key);
        if (heap.size() > k) heap.poll();
    }
    int[] result = new int[k];
    for (int i = k - 1; i >= 0; i--) result[i] = heap.poll();
    return result;
}
```

#### Clean Code Rules

- Use `getOrDefault(key, 0)` instead of `if (map.containsKey(key)) { ... } else { map.put(key,0); }` — it is shorter and clearer.
- Use `map.merge(key, 1, Integer::sum)` as an idiomatic Java 8+ frequency count.
- Name your map `freq`, `count`, or something that describes what it counts. Do not name it `map`.

---

### Concept Cluster 5: Hashing Internals — Collisions, equals/hashCode, and Pitfalls

**Topics in this cluster:**
- Collision handling basics
- Custom hashing and equality in Java
- Common map-state mistakes and collision-style pitfalls

#### How HashMap Works Under the Hood

A `HashMap` stores entries in an array of **buckets**. When you call `map.put(key, value)`:
1. Java calls `key.hashCode()` to compute an integer.
2. The integer is mapped to a bucket index (typically `hash % capacity`).
3. The entry is placed in that bucket.

When two keys hash to the same bucket, that is a **collision**. Java handles collisions with **separate chaining**: each bucket holds a linked list (or, since Java 8, a balanced tree when the chain grows beyond 8 entries) of all entries that map to that bucket.

**Load factor** controls when the backing array is resized (default: 0.75). When the number of entries exceeds `capacity * loadFactor`, Java doubles the capacity and re-hashes everything. This resize is O(n) but happens rarely, so amortized insertion remains O(1).

#### Custom equals and hashCode in Java

If you use a custom object as a map key, you **must** override both `equals` and `hashCode`. They must be consistent: if `a.equals(b)` is true, then `a.hashCode() == b.hashCode()` must also be true.

```java
import java.util.*;

public class Point {
    final int x, y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object obj) {
        if (!(obj instanceof Point)) return false;
        Point other = (Point) obj;
        return this.x == other.x && this.y == other.y;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y); // Delegates to a well-distributed hash
    }

    public static void main(String[] args) {
        Map<Point, String> map = new HashMap<>();
        map.put(new Point(1, 2), "origin");
        System.out.println(map.get(new Point(1, 2))); // "origin"
        // Without override, this would print null
    }
}
```

#### Common Map-State Mistakes

1. **Using mutable objects as keys**: If you change a key after inserting it, the hash changes and the map can no longer find the entry.
2. **Forgetting to override hashCode when overriding equals**: Java's contract says equal objects must have equal hash codes. Violating this makes the map silently lose entries.
3. **Checking `map.get(key) != null` instead of `map.containsKey(key)`**: If a null value is legitimately stored, `get` returning null is ambiguous.
4. **ConcurrentModificationException**: Modifying a map while iterating its `keySet()` or `entrySet()`. Collect keys to modify first, then apply changes after.

```java
// WRONG — throws ConcurrentModificationException
for (Integer key : map.keySet()) {
    if (someCondition) map.remove(key);
}

// CORRECT
Iterator<Map.Entry<Integer,Integer>> it = map.entrySet().iterator();
while (it.hasNext()) {
    Map.Entry<Integer,Integer> entry = it.next();
    if (someCondition) it.remove();
}
```

#### Practical Note

Interviewers sometimes ask "what is the worst-case complexity of HashMap?" The answer is O(n) if all keys collide (adversarial hash codes). In practice, Java's `HashMap` degrades chains to balanced trees in Java 8+, bounding the worst case to O(log n) per bucket. A well-implemented `hashCode` makes this a non-issue in practice.

---

### Concept Cluster 6: Prefix Sums and Range Queries

**Topics in this cluster:**
- Prefix sum arrays
- One-dimensional prefix sums
- Range sum queries

#### Definition

A **prefix sum array** `pre` for input array `nums` is defined as:
```
pre[0] = 0
pre[i] = nums[0] + nums[1] + ... + nums[i-1]
```

The sum of elements from index `l` to `r` (inclusive) is then:
```
rangeSum(l, r) = pre[r+1] - pre[l]
```

This reduces a range sum query from O(n) to O(1), after O(n) preprocessing.

#### Why It Matters

Any time you answer many "what is the sum of a range?" questions on a static array, prefix sums are the right tool. They also power sliding window, subarray sum, and hash-based range counting problems.

#### Java Implementation

```java
public class PrefixSum {
    private final int[] pre;

    public PrefixSum(int[] nums) {
        pre = new int[nums.length + 1];
        for (int i = 0; i < nums.length; i++) {
            pre[i + 1] = pre[i] + nums[i];
        }
    }

    // Returns sum of nums[l..r] inclusive, 0-indexed
    public int rangeSum(int l, int r) {
        return pre[r + 1] - pre[l];
    }

    public static void main(String[] args) {
        PrefixSum ps = new PrefixSum(new int[]{3, 1, 4, 1, 5, 9, 2, 6});
        System.out.println(ps.rangeSum(1, 4)); // 1+4+1+5 = 11
        System.out.println(ps.rangeSum(0, 2)); // 3+1+4 = 8
    }
}
```

**Dry run** for `[3,1,4,1,5,9,2,6]`:
- `pre` = [0, 3, 4, 8, 9, 14, 23, 25, 31]
- `rangeSum(1,4)` = `pre[5] - pre[1]` = 14 - 3 = 11 ✓

#### Subarray Sum Equals K (prefix sum + hashing)

This classic problem asks: how many subarrays sum to exactly `k`?

Brute force: O(n²) — try all pairs.  
Optimized: O(n) using prefix sums + frequency map.

**Insight**: If `pre[j] - pre[i] == k`, then the subarray `nums[i..j-1]` sums to `k`. Rearranging: `pre[i] == pre[j] - k`. So for each `j`, look up `pre[j] - k` in a frequency map of previously seen prefix sums.

```java
import java.util.*;

public class SubarraySum {
    public static int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0, 1); // empty prefix
        int prefixSum = 0, count = 0;
        for (int num : nums) {
            prefixSum += num;
            count += prefixCount.getOrDefault(prefixSum - k, 0);
            prefixCount.put(prefixSum, prefixCount.getOrDefault(prefixSum, 0) + 1);
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(subarraySum(new int[]{1, 1, 1}, 2)); // 2
        System.out.println(subarraySum(new int[]{1, 2, 3}, 3)); // 2
    }
}
```

#### Common Mistakes

- Off-by-one in prefix sum indexing. Using `pre[i] = nums[0]+...+nums[i]` (length-n array) instead of `pre[i+1] = nums[0]+...+nums[i]` (length-n+1 array) makes the range formula harder and more error-prone. Prefer the length-n+1 convention shown above.
- Forgetting to initialize `prefixCount.put(0, 1)` — this handles subarrays that start at index 0.

---

### Concept Cluster 7: Difference Arrays, Prefix XOR, and Combining Prefix Data with Hashing

**Topics in this cluster:**
- Difference arrays
- Prefix XOR
- Prefix XOR and accumulation variants
- Combining prefix data with hashing

#### Difference Arrays

A **difference array** is the dual of a prefix sum: it allows you to apply range updates in O(1) and then reconstruct the final array in O(n).

**Problem**: Given an array, apply `q` range increment operations (add `val` to every element from `l` to `r`). Report the final array. With brute force each update is O(n); total O(n·q). With a difference array, each update is O(1) and final reconstruction is O(n): total O(n+q).

**How it works**:
- `diff[l] += val` marks the start of the range.
- `diff[r+1] -= val` marks where the increment ends.
- After all operations, a prefix sum over `diff` gives the final array.

```java
import java.util.Arrays;

public class DifferenceArray {
    public static int[] applyUpdates(int n, int[][] updates) {
        int[] diff = new int[n + 1];
        for (int[] u : updates) {
            int l = u[0], r = u[1], val = u[2];
            diff[l] += val;
            if (r + 1 <= n) diff[r + 1] -= val;
        }
        // Prefix sum over diff to rebuild array
        int[] result = new int[n];
        int running = 0;
        for (int i = 0; i < n; i++) {
            running += diff[i];
            result[i] = running;
        }
        return result;
    }

    public static void main(String[] args) {
        // Array size 5, updates: [0,2,+3], [1,4,+2], [2,3,-1]
        System.out.println(Arrays.toString(
            applyUpdates(5, new int[][]{{0,2,3},{1,4,2},{2,3,-1}})
        ));
        // [3, 5, 4, 1, 2]
    }
}
```

**Dry run**:
- diff after updates: [3, 2, -4, -1, 0, -2]
- Prefix sum: 3, 5, 1, 0, 0 — wait, let me recompute cleanly:
  - diff=[0..5]: `[3, 2, -4, -1, 0, -2]`
    - update (0,2,3): diff[0]+=3 → diff[3]-=3
    - update (1,4,2): diff[1]+=2 → diff[5]-=2
    - update (2,3,-1): diff[2]-=1 → diff[4]+=1
  - diff = [3, 2, -1, -3, 1, -2]
  - prefix: 3, 5, 4, 1, 2 ✓

#### Prefix XOR

XOR has a powerful property: `x XOR x = 0` and `x XOR 0 = x`. This means XOR is "self-canceling."

A **prefix XOR array** allows range XOR queries in O(1):
```
xorRange(l, r) = pre[r] ^ pre[l-1]
```
where `pre[i] = nums[0] ^ nums[1] ^ ... ^ nums[i]`.

**Classic use**: Find the single non-duplicate element in an array where every element appears twice except one.

```java
public class PrefixXOR {
    // Single non-duplicate using XOR accumulation
    public static int singleNumber(int[] nums) {
        int xor = 0;
        for (int num : nums) xor ^= num;
        return xor; // all duplicates cancel out
    }

    // Range XOR query in O(1) after O(n) build
    static int[] buildPrefixXOR(int[] nums) {
        int[] pre = new int[nums.length + 1];
        for (int i = 0; i < nums.length; i++) {
            pre[i + 1] = pre[i] ^ nums[i];
        }
        return pre;
    }

    static int rangeXOR(int[] pre, int l, int r) {
        return pre[r + 1] ^ pre[l];
    }

    public static void main(String[] args) {
        System.out.println(singleNumber(new int[]{4,1,2,1,2})); // 4

        int[] nums = {3, 5, 2, 8};
        int[] pre = buildPrefixXOR(nums);
        System.out.println(rangeXOR(pre, 1, 3)); // 5^2^8 = 15
    }
}
```

#### Combining Prefix Data with Hashing

This technique is the key to many "count subarrays with property X" problems.

**Pattern**:
1. Compute prefix data (sum, XOR, product, parity, etc.).
2. Store each prefix value in a `HashMap<value → frequency>`.
3. For each position, look up the complement that would make the subarray satisfy the property.

**Example**: Count subarrays with XOR equal to `k`.

```java
import java.util.*;

public class SubarrayXOR {
    public static int countSubarraysWithXOR(int[] nums, int k) {
        Map<Integer, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0, 1);
        int prefixXOR = 0, count = 0;
        for (int num : nums) {
            prefixXOR ^= num;
            // If prefixXOR ^ prev == k, then prev == prefixXOR ^ k
            count += prefixCount.getOrDefault(prefixXOR ^ k, 0);
            prefixCount.put(prefixXOR, prefixCount.getOrDefault(prefixXOR, 0) + 1);
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(countSubarraysWithXOR(new int[]{4, 2, 2, 6, 4}, 6)); // 4
    }
}
```

#### Practical Note

Prefix XOR + HashMap is the XOR analog of prefix sum + HashMap. Whenever you see "count subarrays where XOR equals k", apply this pattern directly. The structure of the solution is identical — only the operation changes from `+` to `^`.

---

### Concept Cluster 8: Kadane's Algorithm and Maximum Subarray Problems

**Topics in this cluster:**
- Kadane's algorithm
- Common interview warmups

#### Definition

**Kadane's algorithm** finds the maximum sum contiguous subarray in O(n) time and O(1) space. It is one of the most elegant and important algorithms in competitive programming.

#### Intuition

At each position, you make one decision: should the current subarray extend the best subarray seen so far, or should it start fresh with just the current element?

- Extend if the running sum from the previous step is positive (it adds value).
- Start fresh if the running sum is negative (it would only drag the new element down).

#### Algorithm

```
maxSum = nums[0]
currentSum = nums[0]

for i from 1 to n-1:
    currentSum = max(nums[i], currentSum + nums[i])
    maxSum = max(maxSum, currentSum)

return maxSum
```

#### Java Implementation

```java
public class Kadane {
    public static int maxSubArray(int[] nums) {
        int maxSum = nums[0];
        int currentSum = nums[0];
        for (int i = 1; i < nums.length; i++) {
            currentSum = Math.max(nums[i], currentSum + nums[i]);
            maxSum = Math.max(maxSum, currentSum);
        }
        return maxSum;
    }

    public static void main(String[] args) {
        System.out.println(maxSubArray(new int[]{-2,1,-3,4,-1,2,1,-5,4}));
        // 6 — subarray [4,-1,2,1]
        System.out.println(maxSubArray(new int[]{1}));       // 1
        System.out.println(maxSubArray(new int[]{-3,-1,-2})); // -1
    }
}
```

**Dry run** for `[-2,1,-3,4,-1,2,1,-5,4]`:

| i | nums[i] | currentSum | maxSum |
|---|---|---|---|
| 0 | -2 | -2 | -2 |
| 1 | 1 | max(1,-1)=1 | 1 |
| 2 | -3 | max(-3,-2)=-2 | 1 |
| 3 | 4 | max(4,2)=4 | 4 |
| 4 | -1 | max(-1,3)=3 | 4 |
| 5 | 2 | max(2,5)=5 | 5 |
| 6 | 1 | max(1,6)=6 | **6** |
| 7 | -5 | max(-5,1)=1 | 6 |
| 8 | 4 | max(4,5)=5 | 6 |

Result: 6 ✓

#### Common Interview Warmups

| Problem | Key Idea |
|---|---|
| Maximum subarray sum | Kadane's |
| Maximum product subarray | Track both maxProduct and minProduct (negatives flip sign) |
| Maximum sum of circular subarray | max(normalKadane, totalSum - minSubarrayKadane) |
| Find indices of maximum subarray | Track start/end during Kadane's |

#### Edge Cases

- All-negative array: answer is the largest single element (most negative element is the least bad). The algorithm handles this correctly because `currentSum = max(nums[i], currentSum+nums[i])` always picks at least `nums[i]`.
- Single-element array: return `nums[0]`.
- All zeros: return 0.

#### Common Mistakes

- Initializing `maxSum = 0` instead of `maxSum = nums[0]`. A zero initialization incorrectly returns 0 for all-negative arrays instead of the largest element.
- Forgetting to reset `currentSum` by taking `max(nums[i], currentSum + nums[i])` — some buggy implementations always extend, which breaks on all-negative inputs.

---

## Worked Examples

---

### Worked Example 1: Product of Array Except Self (Intermediate Array)

#### Problem or Design Scenario
Given an array `nums`, return an array `output` where `output[i]` is the product of all elements except `nums[i]`. Do not use division. Solve in O(n) time.

#### Technical Value
This problem directly tests prefix-product thinking — a generalization of prefix sums. It also tests whether you can use two passes (left prefix, right prefix) instead of extra space.

#### Constraints or Assumptions
- 2 ≤ nums.length ≤ 10⁵
- -30 ≤ nums[i] ≤ 30
- The answer fits in a 32-bit integer

#### Example Input/Output
- Input: `[1,2,3,4]`
- Output: `[24,12,8,6]`

#### Brute Force Approach
For each index `i`, multiply all elements except `nums[i]`. O(n²) time, O(1) extra space (not counting output).

#### Optimized Approach
1. Build a left-prefix product array: `left[i]` = product of all elements to the left of `i`.
2. Traverse from right, maintaining a running right-side product.
3. Multiply `left[i] * rightProduct` for each position. O(n) time, O(1) extra space (beyond output array).

#### Why the Better Approach Works
Left products and right products each encode "everything except me" from one direction. Their product at position `i` excludes `nums[i]` from both sides.

#### Decision Process
"Two passes instead of a nested loop" is the general heuristic: precompute what you know from the left, then sweep from the right to combine. This avoids division (which would fail on zeros) and stays O(n).

#### Java Solution

```java
import java.util.Arrays;

public class ProductExceptSelf {
    public static int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] output = new int[n];

        // Pass 1: output[i] = product of all elements left of i
        output[0] = 1;
        for (int i = 1; i < n; i++) {
            output[i] = output[i - 1] * nums[i - 1];
        }

        // Pass 2: multiply by product of all elements right of i
        int rightProduct = 1;
        for (int i = n - 1; i >= 0; i--) {
            output[i] *= rightProduct;
            rightProduct *= nums[i];
        }

        return output;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(
            productExceptSelf(new int[]{1, 2, 3, 4})
        )); // [24, 12, 8, 6]
        System.out.println(Arrays.toString(
            productExceptSelf(new int[]{-1, 1, 0, -3, 3})
        )); // [0, 0, 9, 0, 0]
    }
}
```

#### Dry Run
Input: `[1,2,3,4]`

After pass 1: `output = [1, 1, 2, 6]`  
Pass 2 (right to left):
- i=3: output[3] = 6*1=6; rightProduct=4
- i=2: output[2] = 2*4=8; rightProduct=12
- i=1: output[1] = 1*12=12; rightProduct=24
- i=0: output[0] = 1*24=24; rightProduct=24

Result: `[24,12,8,6]` ✓

#### Time and Space Complexity
- Time: O(n)
- Space: O(1) extra (output array not counted by convention)

#### Edge Cases
- Array with zero: products for all non-zero positions become 0 except the zero position.
- Two or more zeros: all positions are 0.
- All ones: output is all ones.

#### Common Mistakes
- Not initializing `output[0] = 1` before the first pass.
- Using division — breaks when `nums[i] == 0`.

#### Related Variants
- Maximum product subarray (uses similar "track from both ends" idea).
- Product of range queries on immutable array (use prefix product with division if no zeros guaranteed).

#### Validation
Test: `[0,1,2,3]`, `[1,0,0,1]`, single-element neighbors.

---

### Worked Example 2: Group Anagrams (HashMap + String Frequency)

#### Problem or Design Scenario
Given an array of strings, group all strings that are anagrams of each other together.

#### Technical Value
This tests stable representation via a frequency key — the core of the Frequency Counter Pattern applied to grouping.

#### Constraints or Assumptions
- All input strings are lowercase letters.
- 1 ≤ strings.length ≤ 10⁴, 0 ≤ strings[i].length ≤ 100

#### Example Input/Output
- Input: `["eat","tea","tan","ate","nat","bat"]`
- Output: `[["bat"],["nat","tan"],["ate","eat","tea"]]`

#### Brute Force Approach
Sort each string and use that as a key. Two strings that are anagrams produce the same sorted key.

#### Better Approach
Use a 26-character frequency count as the key. Slightly faster for short strings since sorting is O(k log k) vs O(k) for counting, though both are practical.

#### Java Solution

```java
import java.util.*;

public class GroupAnagrams {
    public static List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            // Build canonical key from character frequency
            int[] freq = new int[26];
            for (char c : s.toCharArray()) freq[c - 'a']++;
            String key = Arrays.toString(freq); // "[1,0,0,...,1,0,...]"
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }

    public static void main(String[] args) {
        String[] input = {"eat","tea","tan","ate","nat","bat"};
        List<List<String>> result = groupAnagrams(input);
        for (List<String> group : result) {
            Collections.sort(group);
            System.out.println(group);
        }
    }
}
```

#### Dry Run

- "eat" → freq key → group with "tea","ate"
- "tan" → freq key → group with "nat"
- "bat" → its own group

#### Time and Space Complexity
- Time: O(n · k) where k = max string length
- Space: O(n · k) for the map

#### Edge Cases
- Empty string `""` is an anagram of itself only.
- Single-character strings each form their own group unless duplicated.

#### Related Variants
- Count number of anagram groups.
- Find anagram groups of exactly size k.

---

### Worked Example 3: Maximum Sum Circular Subarray (Advanced Kadane's Variant)

#### Problem or Design Scenario
Given a circular array of integers, find the maximum sum of a non-empty contiguous subarray. The array is circular, meaning the subarray can wrap around the end and continue from the beginning.

#### Technical Value
This is an advanced Kadane's variant that requires insight: the optimal circular subarray is either (a) a normal subarray (handled by standard Kadane's) or (b) a "wrapped" subarray that equals `totalSum - minSubarraySum`.

#### Constraints
- 1 ≤ nums.length ≤ 3 × 10⁴
- -3 × 10⁴ ≤ nums[i] ≤ 3 × 10⁴

#### Example
- Input: `[1,-2,3,-2]` → Output: `3`
- Input: `[5,-3,5]` → Output: `10`

#### Intuition
A wrapped subarray = everything EXCEPT the minimum subarray in the middle. So:
- `maxWrap = totalSum - minSubarray`
- `answer = max(maxNormal, maxWrap)`

Special case: if all elements are negative, `maxWrap = 0` (empty subarray), which would be invalid. Detect this with the all-negative check: if `maxNormal < 0`, return `maxNormal`.

#### Java Solution

```java
public class MaxCircularSubarray {
    public static int maxSubarraySumCircular(int[] nums) {
        int totalSum = 0;
        int maxSum = nums[0], currentMax = nums[0];
        int minSum = nums[0], currentMin = nums[0];

        for (int i = 1; i < nums.length; i++) {
            totalSum += nums[i - 1];
            currentMax = Math.max(nums[i], currentMax + nums[i]);
            maxSum = Math.max(maxSum, currentMax);
            currentMin = Math.min(nums[i], currentMin + nums[i]);
            minSum = Math.min(minSum, currentMin);
        }
        totalSum += nums[nums.length - 1];

        // If all elements are negative, maxWrap is invalid (empty subarray)
        return maxSum > 0 ? Math.max(maxSum, totalSum - minSum) : maxSum;
    }

    public static void main(String[] args) {
        System.out.println(maxSubarraySumCircular(new int[]{1,-2,3,-2})); // 3
        System.out.println(maxSubarraySumCircular(new int[]{5,-3,5}));    // 10
        System.out.println(maxSubarraySumCircular(new int[]{-3,-2,-3}));  // -2
    }
}
```

#### Dry Run for `[5,-3,5]`
- totalSum = 7
- maxSum (Kadane's): 5 → 2 → 7, so maxSum=7
- minSum (Kadane's min): 5 → -3 → -3+5=2... actually min at single element: minSum=-3
- maxWrap = 7 - (-3) = 10
- answer = max(7, 10) = 10 ✓

#### Time and Space Complexity
- Time: O(n)
- Space: O(1)

#### Edge Cases
- All negative: `maxSum < 0`, return `maxSum` (the least-negative element).
- Single element: works correctly.

#### Related Variants
- Maximum product circular subarray (track min/max product simultaneously).

---

## Solved Problems

---

### Problem 1 (Easy): Find the Maximum in a Rotated Array

#### Problem Statement
Given a sorted array that has been rotated at an unknown pivot, find the maximum element.

#### Constraints
- 1 ≤ nums.length ≤ 10⁵, all values distinct

#### Example
Input: `[4,5,6,7,0,1,2]` → Output: `7`

#### Naive Solution
Linear scan: O(n).

#### Optimized Solution
Binary search: O(log n). The maximum is the last element before the rotation point. In a rotated sorted array, the minimum is the rotation point; maximum is one position before it.

Alternatively, for "find maximum": scan linearly but recognize that in a rotation problem, the maximum is at the rotation boundary.

#### Java Solution

```java
public class MaxInRotated {
    public static int findMax(int[] nums) {
        int left = 0, right = nums.length - 1;
        // If not rotated, the last element is the max
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] > nums[right]) {
                // Max is in [mid+1, right] is wrong; max is in [left, mid]
                // Actually, for "find max", check differently:
                // If nums[mid] > nums[mid+1], mid is the max
                left = mid + 1; // not quite — let's use a clean approach
            } else {
                right = mid;
            }
        }
        // left now points to the minimum; max is just before it
        return nums[(left - 1 + nums.length) % nums.length];
    }

    // Cleaner: just find the minimum (rotation point), then max = arr[(minIdx-1+n)%n]
    public static int findMaxClean(int[] nums) {
        int n = nums.length;
        if (n == 1 || nums[0] < nums[n - 1]) return nums[n - 1]; // not rotated
        int left = 0, right = n - 1;
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] > nums[right]) left = mid + 1;
            else right = mid;
        }
        // left = index of minimum; max is right before it
        return nums[(left - 1 + n) % n];
    }

    public static void main(String[] args) {
        System.out.println(findMaxClean(new int[]{4,5,6,7,0,1,2})); // 7
        System.out.println(findMaxClean(new int[]{1,3,5}));          // 5
    }
}
```

#### Time and Space Complexity
- Time: O(log n), Space: O(1)

#### Edge Cases
- Non-rotated array: handled by early return.
- Single element: returns that element.

#### Related Variants
- Find minimum in rotated sorted array (symmetric problem — the inner binary search directly finds it).

---

### Problem 2 (Easy): First Non-Repeating Character

#### Problem Statement
Given a string, find the index of the first character that does not repeat. Return -1 if none exists.

#### Example
Input: `"leetcode"` → Output: `0` (l appears once)  
Input: `"aabb"` → Output: `-1`

#### Java Solution

```java
public class FirstUnique {
    public static int firstUniqChar(String s) {
        int[] freq = new int[26];
        for (char c : s.toCharArray()) freq[c - 'a']++;
        for (int i = 0; i < s.length(); i++) {
            if (freq[s.charAt(i) - 'a'] == 1) return i;
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(firstUniqChar("leetcode")); // 0
        System.out.println(firstUniqChar("loveleetcode")); // 2
        System.out.println(firstUniqChar("aabb")); // -1
    }
}
```

#### Time and Space Complexity
- Time: O(n), Space: O(1) (array of size 26)

#### Edge Cases
- All characters repeat → -1.
- Single character → 0.

---

### Problem 3 (Medium): Subarray Sum Equals K

#### Problem Statement
Given an integer array and an integer `k`, return the number of continuous subarrays whose sum equals `k`.

#### Example
Input: `nums=[1,1,1], k=2` → Output: `2`

#### Brute Force
Double loop: O(n²).

#### Optimized
Prefix sum + HashMap: O(n).

#### Java Solution

```java
import java.util.*;

public class SubarraySumK {
    public static int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0, 1);
        int prefixSum = 0, count = 0;
        for (int num : nums) {
            prefixSum += num;
            count += prefixCount.getOrDefault(prefixSum - k, 0);
            prefixCount.merge(prefixSum, 1, Integer::sum);
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(subarraySum(new int[]{1,1,1}, 2)); // 2
        System.out.println(subarraySum(new int[]{1,2,3}, 3)); // 2
        System.out.println(subarraySum(new int[]{-1,-1,1}, 0)); // 1
    }
}
```

#### Time and Space Complexity
- Time: O(n), Space: O(n)

#### Edge Cases
- Negative numbers: handled correctly because we're tracking prefix sums.
- k=0: counts subarrays with zero sum.

---

### Problem 4 (Medium): Longest Subarray of Ones After Deleting One Element

#### Problem Statement
Given a binary array (only 0s and 1s), return the length of the longest subarray containing only 1s after deleting exactly one element.

#### Example
Input: `[1,1,0,1]` → Output: `3`

#### Brute Force
Try deleting each element, count longest run of 1s → O(n²).

#### Optimized
Difference array / prefix count approach: maintain count of 1s from left and from right for each position, combine at each 0.

Or: sliding window with a "budget" of one zero allowed — the window itself is covered in Chapter 6, but we can use a prefix sum approach here.

```java
public class LongestOnesDeleteOne {
    public static int longestSubarray(int[] nums) {
        // prefix[i] = number of 1s in nums[0..i-1]
        int n = nums.length;
        int[] prefix = new int[n + 1];
        for (int i = 0; i < n; i++) {
            prefix[i + 1] = prefix[i] + nums[i];
        }
        int maxLen = 0;
        for (int i = 0; i < n; i++) {
            if (nums[i] == 0) {
                // Delete nums[i], count 1s on both sides
                int leftOnes = prefix[i] - prefix[0];      // ones in [0..i-1]
                // Actually we want the run adjacent to i on the right:
                // Use left endpoint = largest j < i with nums[j]==0 (or 0)
                // Simpler: just use two passes tracking gaps
            }
        }
        // Cleaner two-pointer / two-variable approach
        int left = 0, zeros = 0;
        maxLen = 0;
        for (int right = 0; right < n; right++) {
            if (nums[right] == 0) zeros++;
            while (zeros > 1) {
                if (nums[left] == 0) zeros--;
                left++;
            }
            // Subtract 1 because we must delete exactly one element
            maxLen = Math.max(maxLen, right - left);
        }
        return maxLen;
    }

    public static void main(String[] args) {
        System.out.println(longestSubarray(new int[]{1,1,0,1}));       // 3
        System.out.println(longestSubarray(new int[]{0,1,1,1,0,1,1,0,1})); // 5
        System.out.println(longestSubarray(new int[]{1,1,1}));         // 2
    }
}
```

**Note**: The two-pointer section in the solution above previews Chapter 5. The key insight from this chapter: the window shrinks when it contains more than one zero, and the final length subtracts 1 for the required deletion.

#### Time and Space Complexity
- Time: O(n), Space: O(1)

---

### Problem 5 (Hard): Minimum Window Substring (Preview — solved with frequency maps)

#### Problem Statement
Given strings `s` and `t`, return the minimum window substring of `s` that contains every character in `t`. If no such window exists, return `""`.

#### Example
Input: `s="ADOBECODEBANC", t="ABC"` → Output: `"BANC"`

#### Why It's Hard
You need to track character requirements and know when the window is "complete," then shrink it as much as possible.

#### Brute Force
O(n² · m): try all substrings, check each.

#### Optimized
Sliding window with two frequency maps and a "formed" counter: O(n + m).

```java
import java.util.*;

public class MinWindowSubstring {
    public static String minWindow(String s, String t) {
        if (s.isEmpty() || t.isEmpty()) return "";

        Map<Character, Integer> need = new HashMap<>();
        for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);

        int required = need.size(); // distinct chars to satisfy
        int formed = 0;
        Map<Character, Integer> window = new HashMap<>();

        int left = 0;
        int minLen = Integer.MAX_VALUE;
        int minLeft = 0;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            window.merge(c, 1, Integer::sum);

            if (need.containsKey(c) && window.get(c).equals(need.get(c))) {
                formed++;
            }

            // Try to contract the window until it's no longer valid
            while (formed == required) {
                if (right - left + 1 < minLen) {
                    minLen = right - left + 1;
                    minLeft = left;
                }
                char leftChar = s.charAt(left);
                window.merge(leftChar, -1, Integer::sum);
                if (need.containsKey(leftChar)
                        && window.get(leftChar) < need.get(leftChar)) {
                    formed--;
                }
                left++;
            }
        }
        return minLen == Integer.MAX_VALUE ? "" : s.substring(minLeft, minLeft + minLen);
    }

    public static void main(String[] args) {
        System.out.println(minWindow("ADOBECODEBANC", "ABC")); // "BANC"
        System.out.println(minWindow("a", "a"));               // "a"
        System.out.println(minWindow("a", "aa"));              // ""
    }
}
```

#### Dry Run (abbreviated)
For `s="ADOBECODEBANC", t="ABC"`:
- Expand right until window has A, B, C → "ADOBEC" (valid)
- Shrink left: remove 'A' → invalid, stop
- Continue expanding... find "BANC" as minimum

#### Time and Space Complexity
- Time: O(|s| + |t|)
- Space: O(|s| + |t|)

#### Related Variants
- Minimum window containing all distinct characters of s.
- Smallest substring with all characters of t (exactly, not at-least).

---

## Recognition Guide

### When to Use Techniques from This Chapter

| Signal | Technique |
|---|---|
| "Find sum/count of elements in a range" | Prefix sum |
| "Apply many range increment updates, then query final array" | Difference array |
| "Count subarrays with sum/XOR equal to k" | Prefix sum/XOR + HashMap |
| "Check if two strings are anagrams" | Frequency array or sorted key |
| "Find elements with given property (exists? index?)" | HashMap lookup |
| "Count occurrences of elements" | Frequency Counter Pattern |
| "Maximum sum contiguous subarray" | Kadane's algorithm |
| "Maximum sum in circular array" | Kadane's + totalSum - minKadane |
| "Build result string incrementally" | StringBuilder |
| "Search for element or complement in O(1)" | HashSet or HashMap |

### When NOT to Use These Techniques

- **Prefix sums** require a static array. If the array is updated between queries, use a Fenwick Tree or Segment Tree (Chapter 15).
- **HashMap** lookup is O(1) average but has a constant factor. For tiny arrays (≤20 elements), a linear scan may outperform it in practice.
- **Kadane's** solves the sum version. For the maximum product, count, or other objectives, the core loop changes.
- **Frequency maps** are for counting. When order matters or you need contiguous structure, a sliding window (Chapter 6) is more appropriate.

### Recognition Keywords

- "subarray", "contiguous": think prefix sums, Kadane's, sliding window
- "anagram", "permutation": frequency map
- "complement", "pair", "two numbers that sum to": HashMap lookup
- "range update", "range query on mutable array": difference array or segment tree
- "XOR of range", "find single non-duplicate": prefix XOR
- "palindrome": expand around center, two pointers

---

## Comparison Tables

### Array vs ArrayList

| Dimension | Array | ArrayList |
|---|---|---|
| Size | Fixed at creation | Dynamic |
| Access by index | O(1) | O(1) |
| Insert/delete at middle | O(n), manual shifting | O(n), handles shifting |
| Memory | Compact, no overhead | Slightly more overhead |
| Java primitives | Supported directly | Requires boxing |
| Use case | Fixed-size, performance-critical | Dynamic, general purpose |

### int[26] Frequency Array vs HashMap

| Dimension | int[26] | HashMap |
|---|---|---|
| Space | 26 ints, constant | Proportional to unique chars |
| Lookup speed | Array index, extremely fast | Hash function, slightly slower |
| Flexibility | Lowercase only | Any character type |
| Readability | Less clear to beginners | More self-documenting |
| Use case | Lowercase a–z problems | General character problems |

### Prefix Sum vs Difference Array

| Dimension | Prefix Sum | Difference Array |
|---|---|---|
| Build time | O(n) | O(n) |
| Range query | O(1) | Requires rebuild: O(n) |
| Range update | Rebuild needed: O(n) | O(1) per update |
| Best for | Many queries, no updates | Many updates, then one query |

### String Searching Strategies

| Strategy | Time | Notes |
|---|---|---|
| Naive contains | O(n·m) | Built into Java's `contains` |
| Sorted key anagram | O(k log k) per string | Simple, readable |
| Frequency array anagram | O(k) per string | Fastest for lowercase |
| Expand-around-center | O(n²) total | Palindromic substrings |
| KMP / Rolling Hash | O(n+m) | Chapter 25 |

---

## Design and Decision Making

### Keep Array Code Simple

Arrays are not where complexity should live. The complexity belongs in the algorithm. Keep array manipulation code (traversal, rotation, shifting) in small, named helper methods:

```java
private static void reverse(int[] arr, int left, int right) { ... }
private static void swap(int[] arr, int i, int j) { ... }
```

This makes higher-level algorithms (rotation, partition) read like plain English.

### Choose the Right Key Representation

When using maps for grouping (e.g., anagrams), the key design matters:
- Sorted string key: simple, readable, O(k log k) per entry.
- `Arrays.toString(freq)` key: O(k), more efficient, slightly less readable.
- Custom object key: requires `equals`/`hashCode` override.

For production code, document why you chose a particular key format, especially for non-obvious canonicalization strategies.

### Immutability and StringBuilder

Respect Java's string immutability design. The immutability of `String` enables safe sharing and caching (the JVM's string pool). When you need a mutable string, explicitly switch to `StringBuilder`. Do not fight the design; work with it.

### Frequency Maps Are State Machines

A frequency map is really a lightweight state machine: each character's count is its state, and the algorithm transitions between states by incrementing/decrementing. Name the map to reflect this intent: `remaining`, `need`, `freq`, `count`. Avoid generic names like `map` or `hashmap`.

### When to Use `computeIfAbsent` and `merge`

Java 8+ idioms:
- `map.computeIfAbsent(key, k -> new ArrayList<>()).add(value)` — idiomatic grouping
- `map.merge(key, 1, Integer::sum)` — idiomatic frequency increment
- `map.getOrDefault(key, 0)` — safe read with default

Prefer these over verbose `if (map.containsKey(k)) { ... } else { ... }` blocks.

---

## Practical Applications

### Backend Systems
- **Prefix sums** in time-series databases for range aggregations (e.g., analytics dashboards).
- **Frequency maps** in log processing pipelines to count event types.
- **HashMap lookup** in caches (e.g., request deduplication).

### Databases
- **Difference arrays** model the equivalent of range-update queries before a full-table scan.
- **Anagram grouping** is used in query planners that normalize table name or column casing.

### Distributed Systems
- **Kadane's algorithm** inspires the "maximum profit window" calculations in trading systems.
- **Prefix XOR** is used in distributed checksum computation (data integrity over ranges).

### Text Processing
- **StringBuilder** is the backbone of template engines, code generators, and serialization frameworks.
- **Frequency maps** power spell-checkers and autocorrect engines.

### Competitive Programming
Every algorithm from this chapter appears directly in competitive programming problems. Prefix sums + hashing alone unlocks dozens of problems that would otherwise require brute force or segment trees.

---

## Failure Modes and Trade-offs

### Senior Engineer Insights

1. **Prefix sums generalize to any associative operation** with a neutral element: sum, XOR, product (with care for zeros), min/max (with segment trees). Once you internalize the pattern, you recognize it everywhere.

2. **HashMap collision attacks exist in adversarial inputs.** Java 8+ mitigates this with tree buckets, but in security-critical code, consider a randomized hash or a `TreeMap` instead.

3. **`String.intern()`** can reduce memory for large numbers of identical strings but is tricky to use correctly. Avoid it in interview problems; it is a micro-optimization.

4. **Kadane's algorithm is a special case of DP.** The `currentSum` variable is a DP state where `dp[i]` = maximum subarray sum ending at index `i`. Recognizing this connection makes it easier to generalize (e.g., 2D Kadane's for maximum submatrix sum).

### Performance Tuning

- For frequency counting of a large stream, `int[26]` is significantly faster than `HashMap<Character,Integer>` due to cache locality and lack of boxing.
- For prefix sums on large arrays, ensure you use `long` instead of `int` when element values can cause overflow.
- `StringBuilder.append` in a loop is O(n) amortized because it doubles capacity. Specify initial capacity via `new StringBuilder(estimatedSize)` when you know the target size.

### Interview Traps

1. **All-negative array with Kadane's**: If you initialize `maxSum = 0`, you get the wrong answer. Always initialize from `nums[0]`.
2. **Subarray sum equals k with negatives**: Prefix sum + HashMap works; sliding window does NOT (shrinking window does not reliably reduce the sum when negatives exist).
3. **Circular subarray maximum**: The wrapped case requires `totalSum - minSubarraySum`, not a direct application of standard Kadane's.

---

## Condensed Notes

### Array Rules
- `int[]` is fixed size; use `ArrayList` for dynamic resizing.
- Index guard: access `nums[i+1]` only when loop condition is `i < nums.length - 1`.
- Rotation by k: reverse all → reverse [0,k-1] → reverse [k,n-1]. Always do `k %= n` first.

### String Rules
- Java strings are **immutable**; always use `StringBuilder` for incremental construction.
- `s.charAt(i)` is O(1). `s.substring(l,r)` is O(r-l).
- Anagram check: `int[26]` frequency array, check all zeros after subtracting.

### HashMap Rules
- `getOrDefault(key, defaultValue)` for safe reads.
- `merge(key, 1, Integer::sum)` for frequency increment.
- `computeIfAbsent(key, k -> new ArrayList<>())` for grouping.
- Override `equals` AND `hashCode` together, always.

### Prefix Sum Formula
```
pre[0] = 0
pre[i+1] = pre[i] + nums[i]
rangeSum(l, r) = pre[r+1] - pre[l]
```
Initialize `prefixCount.put(0, 1)` for subarray-count problems.

### Difference Array Formula
```
diff[l] += val
diff[r+1] -= val
Rebuild: running prefix sum over diff[]
```

### Prefix XOR
```
pre[i+1] = pre[i] ^ nums[i]
rangeXOR(l, r) = pre[r+1] ^ pre[l]
Subarray XOR = k: look up (prefixXOR ^ k) in map
```

### Kadane's Template
```java
int maxSum = nums[0], cur = nums[0];
for (int i = 1; i < n; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    maxSum = Math.max(maxSum, cur);
}
```

### Decision Shortcuts
- Range sum query, static array → prefix sum
- Range update, one final query → difference array
- Subarray count with property → prefix + HashMap
- Two elements summing to target → HashMap lookup
- Anagram / character count → int[26] or frequency map
- Max sum contiguous → Kadane's
- Max sum circular → Kadane's + totalSum - minKadane

---

## Additional Problems

### Easy

1. **Reverse Array In-Place** — Reverse `[1,2,3,4,5]` without extra space. Pattern: two-pointer swap.

2. **Contains Duplicate** — Return true if any value appears twice. Pattern: HashSet membership check.

3. **Running Sum of 1D Array** — Return prefix sums of `[1,2,3,4]` as `[1,3,6,10]`. Pattern: prefix sum build.

4. **Valid Anagram** — Check if two strings are anagrams. Pattern: int[26] frequency counter.

5. **Single Number** — Find the one non-duplicate in an array where all others appear twice. Pattern: XOR accumulation.

### Medium

6. **Two Sum** — Return indices of two numbers that sum to a target. Pattern: HashMap lookup.

7. **Subarray Sum Equals K** — Count subarrays summing to k (with negatives). Pattern: prefix sum + HashMap.

8. **Find All Anagrams in a String** — Find all start indices of anagram substrings. Pattern: sliding frequency window.

9. **Range Sum Query — Immutable** — Answer multiple range sum queries. Pattern: prefix sum precomputation.

10. **Rotate Array** — Rotate array right by k positions in O(1) space. Pattern: three-step reverse.

### Hard

11. **Minimum Window Substring** — Smallest window in s containing all characters of t. Pattern: frequency map + expand/contract window.

12. **Subarray XOR Equal to K** — Count subarrays with XOR equal to k. Pattern: prefix XOR + HashMap.

13. **Maximum Sum Circular Subarray** — Max subarray sum in a circular array. Pattern: Kadane's + totalSum - minKadane.

14. **Longest Subarray with Equal Number of 0s and 1s** — Replace 0 with -1, find longest zero-sum subarray. Pattern: prefix sum + HashMap (first occurrence).

15. **Corporate Flight Bookings** — Given n flights and booking intervals, compute total seats for each flight. Pattern: difference array.

---

## Key Questions

**Q1**: What is the time complexity of accessing an element in a Java array vs a HashMap?

> Array access is O(1) with guaranteed constant time — it's a direct memory index calculation. HashMap access is O(1) **amortized average**, but in the worst case (all keys collide into one bucket), it degrades to O(n), or O(log n) in Java 8+ due to tree-based bucket fallback.

---

**Q2**: Why should you use `StringBuilder` instead of string concatenation in a loop?

> Java strings are immutable. Each `+=` operation creates a new `String` object and copies all existing characters. In a loop of n iterations building a string of length n, this results in O(n²) total work. `StringBuilder` uses a mutable buffer and doubles capacity as needed, giving O(n) amortized time for the entire build.

---

**Q3**: Walk me through how you would check if two strings are anagrams without sorting.

> Build an `int[26]` frequency array. Increment for each character in string one, decrement for each character in string two. If all entries are zero at the end, the strings are anagrams. This is O(n) time and O(1) space — better than the O(n log n) sort-based approach.

---

**Q4**: What is the prefix sum formula for range queries, and why does it work?

> Build `pre` where `pre[i+1] = pre[i] + nums[i]` and `pre[0] = 0`. Then `rangeSum(l, r) = pre[r+1] - pre[l]`. This works because `pre[r+1]` accumulates all elements from index 0 to r, and subtracting `pre[l]` removes the contribution of elements 0 to l-1, leaving exactly the sum from l to r.

---

**Q5**: Explain Kadane's algorithm in one minute.

> Kadane's scans from left to right and maintains `currentSum` = the maximum subarray sum ending at the current index. At each step, you either extend the previous subarray (add the current element to `currentSum`) or start fresh (the current element alone). You take the max of these two choices. Simultaneously you track the global `maxSum`. This works because extending is only useful if `currentSum` was positive; otherwise starting fresh gives a better foundation.

---

**Q6**: When does prefix sum + HashMap fail for subarray sum problems?

> Prefix sum + HashMap works correctly even with negative numbers. However, **sliding window** fails for subarray sum problems with negatives because contracting the window from the left does not guarantee the sum decreases. Always use prefix sum + HashMap when elements can be negative.

---

**Q7**: What does overriding only `equals` without `hashCode` break in a HashMap?

> Java's contract requires that equal objects have equal hash codes. If you override `equals` but not `hashCode`, two objects that are logically equal will compute different hash codes, land in different buckets, and the map will not find the entry when you look it up. You get a silent bug where `map.get(key)` returns null even though the key was inserted.

---

**Q8**: How would you handle Kadane's algorithm when all elements are negative?

> Initialize `maxSum = nums[0]` and `currentSum = nums[0]`, not to 0. The algorithm naturally picks the "least negative" single element as the maximum. Initializing to 0 would incorrectly return 0 for an all-negative input (implying an empty subarray, which is not allowed by the problem statement requiring a non-empty subarray).

---

**Q9**: What is a difference array and when do you use it?

> A difference array supports O(1) range increment updates. You record `diff[l] += val` and `diff[r+1] -= val` for each update. After all updates, a single prefix sum pass reconstructs the final array. Use it when you have many range updates to apply on a static array, and you only need the final values rather than intermediate queries.

---

**Q10**: How do you count subarrays with XOR equal to k?

> Use prefix XOR + HashMap — the exact same structural pattern as prefix sum + HashMap for sum-equals-k. Compute running XOR. For each prefix XOR value `p`, check how many times `p ^ k` has appeared before (because `prevXOR ^ subXOR = k` implies `prevXOR = p ^ k`). Store each prefix XOR value in a frequency map and look up the complement at each step.

---

## Applied Project

### Objective
Build a **Range Analytics Engine** that supports the following operations over a sequence of integer values:
1. Answer multiple range sum queries after loading data.
2. Apply batch range increment updates (e.g., "add 5 to all elements from index 2 to 7").
3. Find the maximum-sum contiguous segment.
4. Given a second sequence, group elements that are "value-anagrams" (same multiset of digits when each number is converted to its digit string).
5. Count how many subarrays have a sum equal to a user-specified target.

### Required Features
- `loadData(int[] nums)` — load the array.
- `rangeSum(int l, int r)` — O(1) query using prefix sums.
- `applyUpdates(int[][] updates)` — apply all updates using a difference array, then rebuild prefix sums.
- `maxSubarraySum()` — returns result via Kadane's algorithm.
- `countSubarraysWithSum(int k)` — uses prefix sum + HashMap.
- `groupByValueAnagram(int[] nums)` — groups numbers by their sorted-digit signature.

### Suggested Java Module Structure

```
RangeAnalyticsEngine.java   // main engine class
  - int[] data
  - int[] prefixSums
  - void loadData(int[])
  - int rangeSum(int, int)
  - void applyUpdates(int[][])
  - int maxSubarraySum()
  - int countSubarraysWithSum(int)

AnagramGrouper.java         // separate concern: grouping
  - Map<String, List<Integer>> groupByValueAnagram(int[])

RangeAnalyticsEngineTest.java  // unit tests
```

### Testing Ideas
- Load `[3,1,4,1,5,9,2,6,5,3]` and verify range sums.
- Apply `[(1,4,+2), (2,6,-1)]` and verify final array.
- Verify Kadane's result matches expected maximum subarray.
- Test `countSubarraysWithSum` with negative values and k=0.
- Group `[12, 21, 11, 100, 001]` and verify anagram groupings.

### Stretch Goals
- Support 2D range sum queries (sum in rectangle).
- Replace prefix sums with a Fenwick Tree to support point updates between queries.
- Add streaming mode: process elements one at a time and maintain a running Kadane's state.

---


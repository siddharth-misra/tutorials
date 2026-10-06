# 5: Two Pointer Family

## Introduction and Context

Two pointers is the first major pattern where optimization starts to look systematic instead of lucky. Rather than rescanning every possible pair or region, you preserve a relationship between moving positions and let that relationship eliminate work. The speedup comes from monotonic movement: each step rules out many impossible answers without revisiting the same state.

The technique is powerful, but only when the invariant is real. Opposite-direction pointers usually need ordering. Same-direction pointers need a well-defined write boundary or valid region. Fast/slow pointers need a structural reason that relative speed reveals information. Most bugs come from moving the wrong pointer, using the pattern without the required guarantee, or failing to define what is true before and after each move.

## Core Intuition and Mechanics

### The Core Idea: Two Scouts on a Trail

Imagine a hiking trail (your array) with two scouts. You send them out to find something:

- **Opposite-direction scouts**: one starts at the trailhead (left), the other at the summit (right). They walk toward each other. When they meet, the search is complete. This works on **sorted** arrays.
- **Same-direction scouts**: both start at the trailhead. One walks faster or jumps ahead. The slower one holds a "position of interest." This works on **unsorted** arrays and is used to partition, deduplicate, or find windows.
- **Fast and slow scouts**: one takes two steps for every one step the other takes. If there is a loop in the trail, the fast scout will lap the slow one. This is cycle detection.

### What Makes the Pattern Work

- **Opposite-direction pointers** work because ordering lets one comparison discard many impossible pairs.
- **Same-direction pointers** work because one pointer marks a stable prefix or a valid region while the other explores new state.
- **Fast/slow pointers** work because relative speed exposes hidden structure such as cycles or middle positions.
- **Reversal and partition variants** work because each swap or rewrite preserves a growing invariant about which part of the data is already fixed.

Before coding, define four things explicitly: the invariant, the movement rule, the termination rule, and the edge cases. If one of those is fuzzy, the implementation usually becomes a collection of off-by-one repairs instead of a clean linear scan.

---

## Core Concepts and Subtopics

---

### Concept Cluster 1: Two Pointers Pattern and Opposite-Direction Pointers

**Topics in this cluster:**
- 5.1 Two Pointers Pattern
- 5.1 Opposite-direction pointers

---

#### Definition

The **Two Pointers Pattern** maintains two index variables — usually called `left` and `right` (or `lo` and `hi`, or `i` and `j`) — that move through a data structure. Pointer movement is driven by a condition evaluated at each step. The pattern replaces an inner loop, reducing O(n²) to O(n).

**Opposite-direction pointers** start at opposite ends of an array and converge toward the center. They are most useful when the array is **sorted** and you are searching for a pair, trio, or partition boundary.

---

#### Why It Matters

The brute force for pair-sum on a sorted array checks every pair: O(n²). With two opposite-direction pointers, you scan once: O(n). The sorted order lets you reason: if the current pair sum is too small, move `left` right; if too large, move `right` left. You eliminate a whole range of candidates with each step.

---

#### How It Works

```
sorted array: [1, 3, 5, 7, 9, 11]   target = 12

left = 0, right = 5
sum = 1 + 11 = 12  → found!
```

```
sorted array: [1, 3, 5, 7, 9, 11]   target = 10

left = 0, right = 5   sum = 12 > 10 → right--
left = 0, right = 4   sum = 10 = 10 → found!
```

```
sorted array: [1, 3, 5, 7, 9, 11]   target = 6

left = 0, right = 5   sum = 12 → right--
left = 0, right = 4   sum = 10 → right--
left = 0, right = 3   sum =  8 → right--
left = 0, right = 2   sum =  6 → found!
```

**Loop invariant**: at every iteration, if a valid pair exists in the array, at least one endpoint of the pair lies within `[left, right]`.

---

#### Internal Mechanics

- Both pointers start outside each other's range.
- On each iteration, exactly one pointer moves (or in some variants, both).
- The movement rule must shrink the search space — the loop must terminate.
- The search ends when `left >= right` (pointers cross or meet).

---

#### Java Implementation Notes

```java
// Two Sum II - sorted array, opposite-direction pointers
public int[] twoSum(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return new int[]{left + 1, right + 1}; // 1-indexed
        if (sum < target) left++;
        else right--;
    }
    return new int[]{-1, -1}; // no pair found
}
```

**Three Sum (extend to triplets):**

```java
import java.util.*;

public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> result = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue; // skip duplicates
        int left = i + 1, right = nums.length - 1;
        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];
            if (sum == 0) {
                result.add(Arrays.asList(nums[i], nums[left], nums[right]));
                while (left < right && nums[left] == nums[left + 1]) left++;
                while (left < right && nums[right] == nums[right - 1]) right--;
                left++;
                right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    return result;
}
```

---

#### Clean Code Rules

- **Name pointers for their role**: `left`/`right` conveys direction better than `i`/`j` for a converging scan.
- **State the invariant in a comment** before the loop body. It makes the code self-documenting and exposes bugs immediately.
- **Extract the movement condition** into a well-named boolean if it gets complex.

---

#### Mini Example: Valid Palindrome

```java
public boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;
    while (left < right) {
        while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
        while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
        if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}
```

---

#### Common Mistakes

1. **Using `left <= right` instead of `left < right`**: For pair-finding, `left < right` is correct. When `left == right` you are looking at the same element — not a pair.
2. **Not skipping duplicates in Three Sum**: Results in duplicate triplets.
3. **Moving both pointers unconditionally**: The logic must move only the pointer that fixes the imbalance.

---

#### Debugging Tips

- Print `(left, right, nums[left], nums[right])` at the top of each iteration.
- Verify the loop invariant holds before and after each pointer move.
- Test single-element, two-element, and all-same-value arrays.

---

#### Practical Note

Sortedness is the key signal here. A hash map also solves pair sum in O(n) time, but opposite-direction pointers keep O(1) extra space and use the ordering directly.

---

#### Deeper Note

Opposite-direction pointers generalize to **container problems** (maximize width × height) and to **two-pointer on multiple arrays** (merge sorted arrays). The invariant reasoning transfers directly.

---

#### Related Concepts

- Binary search (also exploits sorted order, O(log n) per search)
- Sliding window (same-direction pointers with a dynamic window)

---

### Concept Cluster 2: Same-Direction Pointers and Partitioning

**Topics in this cluster:**
- 5.2 Same-direction pointers
- 5.2 Partitioning and rearrangement

---

#### Definition

**Same-direction pointers** (also called **slow/fast** or **read/write** pointers) both travel left-to-right. They serve different roles:

- **`write` (slow) pointer**: marks where the next valid element should be placed.
- **`read` (fast) pointer**: scans through the array looking for valid elements.

This pattern rewrites an array in-place: valid elements move to the front while invalid ones are left behind. No extra array is allocated — O(1) extra space.

---

#### Why It Matters

Removing duplicates, filtering zeros, and partitioning by a condition are extremely common interview problems. The naive solution copies to a new array. The in-place solution with two same-direction pointers impresses interviewers because it is space-efficient and clean.

---

#### How It Works

**Remove duplicates from sorted array:**

```
[1, 1, 2, 3, 3, 4]
write = 0

read = 0: nums[0]=1, always keep first element → write=1
read = 1: nums[1]=1 == nums[write-1]=1 → skip
read = 2: nums[2]=2 != nums[write-1]=1 → nums[write++]=2 → write=2
read = 3: nums[3]=3 != nums[write-1]=2 → nums[write++]=3 → write=3
read = 4: nums[4]=3 == nums[write-1]=3 → skip
read = 5: nums[5]=4 != nums[write-1]=3 → nums[write++]=4 → write=4

Result: [1, 2, 3, 4, _, _]  → return write = 4
```

---

#### Partitioning and Rearrangement

Partitioning separates elements into two groups without necessarily sorting. The classic example: **move all zeros to the end while preserving relative order of non-zeros**.

```
[0, 1, 0, 3, 12]

write = 0
read: 0 → skip (zero)
read: 1 → nums[write++] = 1 → write=1
read: 0 → skip
read: 3 → nums[write++] = 3 → write=2
read: 12 → nums[write++] = 12 → write=3

Fill rest with zeros:
nums[3]=0, nums[4]=0

Result: [1, 3, 12, 0, 0]
```

**Dutch National Flag** (partition into three groups — 0s, 1s, 2s) uses three pointers:

```
low=0, mid=0, high=n-1

While mid <= high:
  if nums[mid] == 0: swap(low, mid); low++; mid++
  if nums[mid] == 1: mid++
  if nums[mid] == 2: swap(mid, high); high--   // do NOT increment mid
```

---

#### Java Implementation Notes

```java
// Remove duplicates from sorted array
public int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    int write = 1;
    for (int read = 1; read < nums.length; read++) {
        if (nums[read] != nums[write - 1]) {
            nums[write++] = nums[read];
        }
    }
    return write;
}

// Move zeros to end, preserve relative order
public void moveZeroes(int[] nums) {
    int write = 0;
    for (int read = 0; read < nums.length; read++) {
        if (nums[read] != 0) {
            nums[write++] = nums[read];
        }
    }
    while (write < nums.length) {
        nums[write++] = 0;
    }
}

// Dutch National Flag — sort array containing only 0, 1, 2
public void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;
    while (mid <= high) {
        if (nums[mid] == 0) {
            int tmp = nums[low]; nums[low] = nums[mid]; nums[mid] = tmp;
            low++;
            mid++;
        } else if (nums[mid] == 1) {
            mid++;
        } else {
            int tmp = nums[mid]; nums[mid] = nums[high]; nums[high] = tmp;
            high--;
            // do not increment mid — the swapped value is unexamined
        }
    }
}
```

---

#### Clean Code Rules

- **The write pointer always points at the next empty slot**, not the last written slot. Keep this mental model consistent.
- **Separate the read and write concerns**: the read pointer scans; the write pointer records. Do not conflate them.

---

#### Mini Example: Remove Element

```java
// Remove all occurrences of val from nums in-place
public int removeElement(int[] nums, int val) {
    int write = 0;
    for (int read = 0; read < nums.length; read++) {
        if (nums[read] != val) {
            nums[write++] = nums[read];
        }
    }
    return write;
}
```

---

#### Common Mistakes

1. **Forgetting to fill the tail with zeros** after compacting non-zeros.
2. **Incrementing `mid` after swapping with `high`** in Dutch National Flag — the swapped value is unexamined.
3. **Off-by-one in `write` initialization**: start `write` at 0, not 1, unless the problem guarantees a non-empty prefix.

---

#### Practical Note

Dutch National Flag is a classic. DiIjkstra designed it. Interviewers expect you to know the invariant for all three regions:
- `[0, low)` all zeros
- `[low, mid)` all ones
- `(high, n-1]` all twos
- `[mid, high]` unexplored

State the invariant before coding. It earns points.

---

### Concept Cluster 3: Fast and Slow Pointer Technique

**Topics in this cluster:**
- 5.3 Fast and slow pointer technique
- 5.3 Fast and Slow Pointer Pattern

---

#### Definition

The **Fast and Slow Pointer Pattern** (also called **Floyd's Tortoise and Hare**) uses two pointers where the fast pointer advances at twice the speed of the slow pointer. It is used to:

1. **Detect a cycle** in a linked list or sequence.
2. **Find the start of a cycle**.
3. **Find the middle of a linked list**.
4. **Detect whether a number is a happy number**.

---

#### Why It Matters

Cycle detection is a prerequisite for linked list problems (Chapter 7), and the mathematical intuition transfers to any sequence with bounded state. The pattern uses O(1) extra space — no visited set needed.

---

#### How It Works

**Cycle Detection:**

```
List: 1 → 2 → 3 → 4 → 5 → 3 (cycle back to node 3)

slow: 1 → 2 → 3 → 4 → 5 → 3 → 4 ...
fast: 1 → 3 → 5 → 4 → 3 → 5 ...

At some point slow == fast → cycle detected.
```

**Why they must meet**: Once fast enters the cycle, the distance between fast and slow decreases by 1 each step. Eventually the gap closes to 0. They must meet inside the cycle.

**Finding the start of the cycle:**

After detection, reset `slow` to head. Advance both at speed 1. The node where they meet again is the cycle start. (This relies on a number-theoretic argument about cycle length and entry distance.)

**Finding the middle of a linked list:**

```
List: 1 → 2 → 3 → 4 → 5

slow: 1 → 2 → 3        (stops at middle)
fast: 1 → 3 → 5 → null (reaches end)
```

When `fast` reaches null or `fast.next` is null, `slow` is at the middle.

---

#### Internal Mechanics

- `slow` moves 1 step per iteration.
- `fast` moves 2 steps per iteration.
- If no cycle: `fast` reaches null.
- If cycle: `fast` laps `slow` inside the cycle.

---

#### Java Implementation Notes

```java
// Linked list node
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

// Detect cycle
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}

// Find cycle start
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            slow = head; // reset slow to head
            while (slow != fast) {
                slow = slow.next;
                fast = fast.next;
            }
            return slow; // cycle start
        }
    }
    return null; // no cycle
}

// Find middle of linked list
public ListNode middleNode(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}
```

---

#### Clean Code Rules

- **The termination guard is `fast != null && fast.next != null`**, not just `fast != null`. Missing `fast.next != null` will throw a NullPointerException when the list has even length.
- **Reset `slow` to `head` (not to the meeting point)** when finding the cycle start.

---

#### Mini Example: Happy Number

```java
// A number is happy if repeated digit-squaring eventually reaches 1.
// If not happy, it cycles. Use fast/slow on the sequence.
public boolean isHappy(int n) {
    int slow = n, fast = sumOfSquares(n);
    while (fast != 1 && slow != fast) {
        slow = sumOfSquares(slow);
        fast = sumOfSquares(sumOfSquares(fast));
    }
    return fast == 1;
}

private int sumOfSquares(int n) {
    int sum = 0;
    while (n > 0) {
        int digit = n % 10;
        sum += digit * digit;
        n /= 10;
    }
    return sum;
}
```

---

#### Common Mistakes

1. **Initializing both pointers to `head.next`**: The standard initialization is both at `head`. Starting elsewhere shifts the meeting-point math.
2. **Not checking `fast.next != null` before `fast.next.next`**: Two-step advance needs both guards.
3. **Returning `fast` as the cycle start**: The meeting point inside the cycle is not necessarily the entry point. Reset `slow` to head and advance both at speed 1.

---

#### Practical Note

Interviewers frequently ask: "Can you solve this without a HashSet?" The fast/slow pointer is the answer. Memorize the two-phase algorithm (detect, then find start). Know how to verbally explain **why** resetting slow to head finds the entry.

---

#### Deeper Note

The same tortoise-and-hare logic detects duplicate numbers in an array when you treat values as "next pointers" (see Floyd's cycle detection applied to Leetcode #287 Find the Duplicate Number).

---

### Concept Cluster 4: In-Place Reversal Pattern and Pointer Workflows

**Topics in this cluster:**
- 5.4 In-Place Reversal Pattern
- 5.4 Partitioning, shrinking, and expanding workflows

---

#### Definition

The **In-Place Reversal Pattern** reverses a sequence (array, string, or linked list) using two opposite-direction pointers with a swap, consuming O(1) extra space. Reversals appear as standalone problems and as sub-steps in rotation, palindrome, and list-reversal algorithms.

**Partitioning, shrinking, and expanding workflows** covers how pointer pairs work together to either narrow a search space (shrinking) or grow a candidate window (expanding) — the transition concept between two-pointer and sliding window.

---

#### How Reversal Works

**Array reversal:**

```
[1, 2, 3, 4, 5]

left=0, right=4: swap(1,5) → [5, 2, 3, 4, 1]
left=1, right=3: swap(2,4) → [5, 4, 3, 2, 1]
left=2, right=2: left >= right → stop

Result: [5, 4, 3, 2, 1]
```

**Linked list reversal** uses three pointers: `prev`, `curr`, `next`.

```
null ← 1 ← 2 ← 3 ← 4 ← 5

At each step: save next, reverse curr.next, advance prev and curr.
```

---

#### Partitioning Workflows

**Shrinking window**: Both pointers start wide and move inward based on a condition. Used when the valid region narrows. Example: Two Sum on sorted array.

**Expanding window**: Both pointers start narrow (e.g., both at `left=0, right=0`) and expand outward when a condition is met. Used in sliding window (Chapter 6).

**Shrink from one side only**: One pointer is fixed while the other moves in. Used in binary search variants and some partition problems.

---

#### Java Implementation Notes

```java
// Reverse an array in-place
public void reverse(int[] nums) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int tmp = nums[left];
        nums[left] = nums[right];
        nums[right] = tmp;
        left++;
        right--;
    }
}

// Reverse a string in-place (char array)
public void reverseString(char[] s) {
    int left = 0, right = s.length - 1;
    while (left < right) {
        char tmp = s[left];
        s[left] = s[right];
        s[right] = tmp;
        left++;
        right--;
    }
}

// Reverse a linked list iteratively
public ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev; // new head
}

// Rotate array right by k positions using three reversals
public void rotate(int[] nums, int k) {
    int n = nums.length;
    k = k % n; // handle k >= n
    reverse(nums, 0, n - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, n - 1);
}

private void reverse(int[] nums, int left, int right) {
    while (left < right) {
        int tmp = nums[left];
        nums[left] = nums[right];
        nums[right] = tmp;
        left++;
        right--;
    }
}
```

---

#### Clean Code Rules

- **Extract `reverse(int[] nums, int left, int right)` as a helper**. Rotation uses it three times; inlining creates repetition and bugs.
- **Comment the three-reversal trick**: it is not immediately obvious why reversing three segments rotates the array. A one-line comment pays dividends for every reader.

---

#### Mini Example: Reverse Words in a String

```java
// "the sky is blue" → "blue is sky the"
public String reverseWords(String s) {
    char[] chars = s.trim().toCharArray();
    // Step 1: reverse entire array
    reverse(chars, 0, chars.length - 1);
    // Step 2: reverse each word
    int start = 0;
    for (int end = 0; end <= chars.length; end++) {
        if (end == chars.length || chars[end] == ' ') {
            reverse(chars, start, end - 1);
            start = end + 1;
        }
    }
    // Collapse multiple spaces (simplified — real solution needs more handling)
    return new String(chars);
}

private void reverse(char[] chars, int left, int right) {
    while (left < right) {
        char tmp = chars[left]; chars[left] = chars[right]; chars[right] = tmp;
        left++; right--;
    }
}
```

---

#### Common Mistakes

1. **Forgetting `k = k % n`** in rotation — when `k >= n` you wrap around.
2. **Losing the `next` pointer before reversing `curr.next`** in linked list reversal.
3. **Reversing to the wrong boundary** in partial reversal — be precise about inclusive vs exclusive endpoints.

---

#### Practical Note

Three-reversal array rotation is a classic "clever but simple" trick. Interviewers also test linked list reversal constantly. Know both iterative and recursive forms. Recursive linked list reversal uses the call stack as implicit storage — O(n) space.

---

### Concept Cluster 5: Recognizing Two-Pointer Problems

**Topics in this cluster:**
- 5.5 Recognizing two-pointer problems
- 5.5 Recognition checklist for linear-scan problems

---

#### Recognition Signals

Two-pointer problems share common signals. Look for:

| Signal | Example |
|---|---|
| Sorted array + pair/triplet target | Two Sum II, Three Sum |
| In-place filter or deduplicate | Remove duplicates, Remove element |
| Palindrome check | Valid palindrome |
| Cycle or middle of linked list | Linked list cycle, Middle node |
| Reverse or rotate | Reverse string, Rotate array |
| Partition by condition | Dutch National Flag, Move zeros |
| Minimize/maximize a value using two ends | Container with most water |
| O(1) space explicitly required | Almost any of the above |

---

#### Recognition Checklist for Linear-Scan Problems

Use this checklist when you see an array or string problem:

1. **Is the input sorted?** → Consider opposite-direction two pointers.
2. **Do I need to find a pair or triple that satisfies a sum/product condition?** → Sort + two pointers.
3. **Do I need to filter or compact in-place?** → Same-direction read/write pointers.
4. **Is there a cycle or "does it repeat" question on a sequence?** → Fast and slow pointers.
5. **Do I need to reverse a segment?** → In-place reversal.
6. **Is the problem asking for a window or subarray?** → Check Sliding Window (Chapter 6) first; if fixed-or-no-state window, two pointers suffice.
7. **Does brute force use two nested loops with indices moving in opposite directions?** → Strong sign: two opposite-direction pointers.
8. **Does brute force use two nested loops with one index always ahead of the other?** → Strong sign: same-direction pointers.

---

#### When NOT to Use Two Pointers

- When the array is unsorted and you need exact pair sums → Use a HashMap (O(n) time, O(n) space).
- When you need to track multiple overlapping ranges simultaneously → Use a segment tree or sorted set.
- When pointer movement depends on non-local state (state from far away in the array) → Might need DP or stack.
- When the problem asks for the count of all valid pairs (not just existence) → Sometimes O(n²) is unavoidable, but often binary search or prefix sums help.

---

#### Practical Note

Stating the recognition checklist out loud signals algorithmic maturity. Say: "The input is sorted and I need a pair sum — that's a two-pointer opportunity. I'll use opposite-direction pointers and the invariant is..." This is exactly what a senior engineer sounds like in an interview.

---

### Concept Cluster 6: Edge Cases, Invariants, and Debugging Strategy

**Topics in this cluster:**
- 5.6 Edge cases, invariants, and debugging strategy

---

#### Core Invariants to Define Before Coding

Before writing any two-pointer loop, write down:

1. **What does `left` represent at all times?**
2. **What does `right` represent at all times?**
3. **What is the loop's termination condition and why is it correct?**
4. **Does every pointer movement shrink the search space?** (If not, infinite loop.)

Example invariants:
- Opposite two-sum: "At all times, if the answer exists, at least one of its elements has an index in `[left, right]`."
- Read/write: "All elements in `[0, write)` are valid. All elements in `[read, n)` are unexamined."
- Dutch Flag: "All elements in `[0, low)` are 0. All in `[low, mid)` are 1. All in `(high, n-1]` are 2."

---

#### Edge Cases Checklist

| Case | What to check |
|---|---|
| Empty array (`n == 0`) | Return immediately, no loop |
| Single element (`n == 1`) | Most loops do not execute — result is trivially the single element |
| All elements equal | Deduplication reduces to length 1; Dutch Flag has no swaps |
| All elements satisfy condition | Write pointer reaches `n`; no tail filling needed |
| No elements satisfy condition | Write pointer stays at 0; result is empty |
| Even vs odd length (palindrome, middle) | Even: pointers meet at the gap; odd: pointers meet at center |
| Duplicate triplets (Three Sum) | Skip duplicates after finding a valid triplet |
| `k >= n` in rotation | Normalize with `k % n` |

---

#### Debugging Strategy

**Step 1: State your invariant in a comment.**

```java
// Invariant: nums[0..write-1] contains all non-zero elements seen so far.
```

**Step 2: Add a trace line at the top of the loop.**

```java
// System.out.printf("left=%d right=%d nums[left]=%d nums[right]=%d%n",
//                    left, right, nums[left], nums[right]);
```

**Step 3: Check the termination condition manually for small inputs.**

Run a 2-element array and a 3-element array by hand. If the loop body is correct but the termination is `<=` instead of `<`, it shows immediately.

**Step 4: Verify pointer movement actually shrinks the search space.**

Every path through the loop body must move at least one pointer. If there is a path where neither pointer moves, you have an infinite loop.

**Step 5: Verify the final state.**

After the loop, what do `left`, `right`, and `write` point at? Is the return value derived correctly from those?

---

#### Common Invariant Violations

- Swapping elements that include the `write` pointer when `read == write` (no-op swap but can hide bugs).
- Advancing `mid` after swapping with `high` in Dutch Flag — the newly placed element is unexamined.
- In cycle detection, initializing slow/fast at different starting points (changes meeting-point math).

---

## Worked Examples

---

### Worked Example 1: Two Sum II — Input Array Is Sorted

#### Problem or Design Scenario
Given a 1-indexed sorted array `numbers` and a target integer, return the 1-indexed positions of the two numbers that add to target. Exactly one solution exists.

#### Technical Value
This is a standard opposite-direction two-pointer problem. The same movement rule also appears inside Three Sum, Four Sum, and related search problems.

#### Constraints or Assumptions
- Array is sorted in non-decreasing order.
- Exactly one valid pair exists.
- Return 1-indexed positions.

#### Example Input/Output
```
Input:  numbers = [2, 7, 11, 15], target = 9
Output: [1, 2]

Input:  numbers = [2, 3, 4], target = 6
Output: [1, 3]
```

#### Brute Force Approach
Try every pair `(i, j)` where `i < j`. Return when `numbers[i] + numbers[j] == target`.
- Time: O(n²) | Space: O(1)

#### Optimized Approach
Use opposite-direction two pointers. Since the array is sorted:
- If `numbers[left] + numbers[right] < target` → move `left` right (increase sum).
- If `numbers[left] + numbers[right] > target` → move `right` left (decrease sum).
- If equal → found.
- Time: O(n) | Space: O(1)

#### Why the Better Approach Works
Sortedness gives us a monotone property: the sum increases when we move `left` right and decreases when we move `right` left. We eliminate an entire column or row of the pair-search matrix with each step.

#### Decision Process
> I see a sorted array and a pair-sum target. That points to opposite-direction two pointers. A hash map would still be O(n) time, but it uses extra space. The invariant is: if the answer exists, at least one of its indices is in `[left, right]`.

#### Java Solution

```java
public class TwoSumII {
    public int[] twoSum(int[] numbers, int target) {
        int left = 0, right = numbers.length - 1;
        // Invariant: if a valid pair exists, one index is in [left, right]
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) {
                return new int[]{left + 1, right + 1}; // 1-indexed
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
        return new int[]{-1, -1}; // guaranteed not to reach here per problem statement
    }
}
```

#### Dry Run

```
numbers = [2, 7, 11, 15], target = 9

left=0, right=3: sum = 2+15 = 17 > 9 → right--
left=0, right=2: sum = 2+11 = 13 > 9 → right--
left=0, right=1: sum = 2+7  =  9 == 9 → return [1, 2]
```

#### Time and Space Complexity
- **Time**: O(n) — each element is visited at most once.
- **Space**: O(1) — no auxiliary data structure.

#### Edge Cases
- Two-element array: only one pair to check, loop runs once.
- Target formed by first and last elements: terminates on first iteration.
- Large values: use `long` if overflow is possible (`numbers[i]` up to 10⁹).

#### Common Mistakes
- Using `left <= right` — when `left == right`, we are looking at the same element, not a pair.
- Returning 0-indexed instead of 1-indexed.

#### Related Variants
- Two Sum on unsorted array → use HashMap.
- Three Sum → sort, then apply two-pointer in a loop.
- Four Sum → two nested loops + two-pointer inner loop.

#### Validation
```java
assert Arrays.equals(twoSum(new int[]{2,7,11,15}, 9), new int[]{1,2});
assert Arrays.equals(twoSum(new int[]{2,3,4}, 6), new int[]{1,3});
assert Arrays.equals(twoSum(new int[]{-1,0}, -1), new int[]{1,2});
```

---

### Worked Example 2: Remove Duplicates from Sorted Array II (Allow at Most 2 Duplicates)

#### Problem or Design Scenario
Given a sorted array, remove duplicates in-place such that each element appears **at most twice**. Return the new length. Do not allocate extra space.

#### Technical Value
It extends "Remove Duplicates I" (allow at most once) to a generalized form. The key insight is parameterizable: the allowed count `k` generalizes the condition. This teaches you to generalize patterns, not just memorize specific solutions.

#### Constraints or Assumptions
- Sorted in non-decreasing order.
- Modify in-place.
- Elements beyond the returned length are irrelevant.

#### Example Input/Output
```
Input:  [1, 1, 1, 2, 2, 3]
Output: 5    (array becomes [1, 1, 2, 2, 3, _])

Input:  [0, 0, 1, 1, 1, 1, 2, 3, 3]
Output: 7    (array becomes [0, 0, 1, 1, 2, 3, 3, _, _])
```

#### Brute Force Approach
Count occurrences of each value, then rebuild. O(n) time, O(n) space (new array).

#### Optimized Approach
Use a write pointer. Allow writing the current element if `write < 2` (not enough written yet) OR if `nums[read] != nums[write - 2]` (current element differs from the element two positions behind).

#### Why the Better Approach Works
By comparing `nums[read]` with `nums[write - 2]`, we know: if they are the same, we have already placed this value twice and must skip. This generalization works for any allowed count `k` by comparing with `nums[write - k]`.

#### Decision Process
> Same-direction pointers with a write pointer that enforces the invariant. I do not need to count occurrences separately. The invariant: `nums[0..write-1]` has no element appearing more than twice. I advance `write` only when the current element passes the at-most-2 check.

#### Java Solution

```java
public class RemoveDuplicatesII {
    public int removeDuplicates(int[] nums) {
        int write = 0;
        for (int read = 0; read < nums.length; read++) {
            // Allow element if fewer than 2 written, or if it differs from 2 positions back
            if (write < 2 || nums[read] != nums[write - 2]) {
                nums[write++] = nums[read];
            }
        }
        return write;
    }
}
```

#### Dry Run

```
nums = [1, 1, 1, 2, 2, 3]

read=0: write=0 < 2 → write nums[0]=1 → write=1  → [1,_,_,_,_,_]
read=1: write=1 < 2 → write nums[1]=1 → write=2  → [1,1,_,_,_,_]
read=2: nums[2]=1 == nums[write-2]=nums[0]=1 → skip
read=3: nums[3]=2 != nums[write-2]=nums[0]=1 → write nums[3]=2 → write=3 → [1,1,2,_,_,_]
read=4: nums[4]=2 != nums[write-2]=nums[1]=1 → write nums[4]=2 → write=4 → [1,1,2,2,_,_]
read=5: nums[5]=3 != nums[write-2]=nums[2]=2 → write nums[5]=3 → write=5 → [1,1,2,2,3,_]

Return 5.
```

#### Time and Space Complexity
- **Time**: O(n)
- **Space**: O(1)

#### Edge Cases
- Array with fewer than 2 elements: `write < 2` guard handles this.
- All identical: only first 2 kept.
- All distinct: all kept.

#### Common Mistakes
- Comparing with `nums[write - 1]` instead of `nums[write - 2]` (solves the k=1 problem, not k=2).
- Not handling the `write < k` base case — array index out of bounds.

#### Related Variants
- k=1 (original remove duplicates): `nums[read] != nums[write - 1]`
- k=3: `nums[read] != nums[write - 3]`
- General k: `write < k || nums[read] != nums[write - k]`

#### Validation
```java
int[] a = {1,1,1,2,2,3};
assert removeDuplicates(a) == 5;
int[] b = {0,0,1,1,1,1,2,3,3};
assert removeDuplicates(b) == 7;
```

---

### Worked Example 3: Container With Most Water

#### Problem or Design Scenario
Given an integer array `height` of length `n`, where `height[i]` is the height of the `i`th vertical bar, find two bars that together with the x-axis form a container holding the most water.

#### Technical Value
This is a non-obvious application of opposite-direction two pointers that requires a **greedy argument** to justify why it is correct. It moves beyond "sorted array + pair sum" to a maximization problem on unsorted data.

#### Constraints or Assumptions
- `n >= 2`
- Heights are non-negative integers.
- You cannot slant the container.

#### Example Input/Output
```
Input:  height = [1,8,6,2,5,4,8,3,7]
Output: 49   (bars at index 1 and 8, width=7, min height=7, area=49)
```

#### Brute Force Approach
Try every pair `(i, j)`. Area = `min(height[i], height[j]) * (j - i)`. Track the maximum.
- Time: O(n²) | Space: O(1)

#### Optimized Approach
Start `left=0, right=n-1`. The area is `min(height[left], height[right]) * (right - left)`. Move the pointer pointing to the **shorter bar** inward. Shorter bar is the bottleneck; moving it may find a taller bar. Moving the taller bar can only decrease the area.
- Time: O(n) | Space: O(1)

#### Why the Better Approach Works

**Greedy argument**: Suppose `height[left] <= height[right]`. The area with `left` fixed and any `right' < right` is at most `height[left] * (right' - left) < height[left] * (right - left)`. So no future pairing with the current `left` can be larger. We can safely discard `left` by moving it inward.

#### Decision Process
> I need to maximize area = width × min-height. The greedy observation is: width shrinks as I bring pointers together, so I need height to grow. Moving the shorter bar inward is the only hope. The taller bar is not the bottleneck. This greedy argument is provable, not just intuitive.

#### Java Solution

```java
public class ContainerWithMostWater {
    public int maxArea(int[] height) {
        int left = 0, right = height.length - 1;
        int maxWater = 0;
        while (left < right) {
            int water = Math.min(height[left], height[right]) * (right - left);
            maxWater = Math.max(maxWater, water);
            // Move the shorter bar inward — it is the bottleneck
            if (height[left] <= height[right]) {
                left++;
            } else {
                right--;
            }
        }
        return maxWater;
    }
}
```

#### Dry Run

```
height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
indices:   0  1  2  3  4  5  6  7  8

left=0, right=8: water = min(1,7)*8 = 8.   max=8.  height[0]=1 <= height[8]=7 → left++
left=1, right=8: water = min(8,7)*7 = 49.  max=49. height[1]=8 >  height[8]=7 → right--
left=1, right=7: water = min(8,3)*6 = 18.  max=49. height[1]=8 >  height[7]=3 → right--
left=1, right=6: water = min(8,8)*5 = 40.  max=49. height[1]=8 <= height[6]=8 → left++
left=2, right=6: water = min(6,8)*4 = 24.  max=49. left++
left=3, right=6: water = min(2,8)*3 = 6.   max=49. left++
left=4, right=6: water = min(5,8)*2 = 10.  max=49. left++
left=5, right=6: water = min(4,8)*1 = 4.   max=49. left++
left=6: left >= right → stop.

Return 49.
```

#### Time and Space Complexity
- **Time**: O(n) — each pointer moves inward; total moves ≤ n.
- **Space**: O(1)

#### Edge Cases
- Two bars: single iteration.
- All bars same height: width shrinks each step, first pair is largest.
- One extremely tall bar surrounded by short bars: short bars determine height.

#### Common Mistakes
- Moving the **taller** bar inward (never helps).
- Using `<` instead of `<=` when heights are equal — both give the same result here, but be consistent.
- Integer overflow: `min(h[l], h[r]) * (r - l)` can overflow `int` if heights are up to 10⁴ and n up to 10⁵. Use `long` or verify bounds.

#### Related Variants
- Largest rectangle in histogram: more complex, uses monotonic stack (Chapter 7).
- Trapping rain water: uses two-pointer or monotonic stack.

#### Validation
```java
assert maxArea(new int[]{1,8,6,2,5,4,8,3,7}) == 49;
assert maxArea(new int[]{1,1}) == 1;
assert maxArea(new int[]{4,3,2,1,4}) == 16;
```

---

## Solved Problems

---

### Problem 1 (Easy): Squares of a Sorted Array

#### Problem Statement
Given an integer array sorted in non-decreasing order (may contain negative numbers), return an array of the squares of each number, sorted in non-decreasing order. Do it in O(n) time.

#### Constraints or Assumptions
- `-10⁴ <= nums[i] <= 10⁴`
- Array is sorted but may contain negatives.

#### Example
```
Input:  [-4, -1, 0, 3, 10]
Output: [0, 1, 9, 16, 100]
```

#### Brute Force Solution
Square all elements, then sort: O(n log n).

#### Optimized Solution
Use opposite-direction pointers. The largest squares are at the two ends (since the array is sorted by absolute value from the outside in). Fill the result array from the back.

#### Why the Final Approach Works
The maximum square at any step is the larger of `nums[left]²` and `nums[right]²`. Place it at the back of the result and advance the corresponding pointer inward.

#### Decision Process
> Sorted array, but negatives make direct squaring unsorted. The outer elements have the largest absolute values. Fill the result from the end — O(n) and O(n) space for the result (unavoidable since we must return a new array).

#### Java Solution

```java
public class SquaresSortedArray {
    public int[] sortedSquares(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];
        int left = 0, right = n - 1, pos = n - 1;
        while (left <= right) {
            int leftSq = nums[left] * nums[left];
            int rightSq = nums[right] * nums[right];
            if (leftSq >= rightSq) {
                result[pos--] = leftSq;
                left++;
            } else {
                result[pos--] = rightSq;
                right--;
            }
        }
        return result;
    }
}
```

#### Dry Run
```
nums = [-4, -1, 0, 3, 10]
left=0, right=4, pos=4: leftSq=16, rightSq=100 → result[4]=100, right-- → pos=3
left=0, right=3, pos=3: leftSq=16, rightSq=9   → result[3]=16,  left++ → pos=2
left=1, right=3, pos=2: leftSq=1,  rightSq=9   → result[2]=9,   right-- → pos=1
left=1, right=2, pos=1: leftSq=1,  rightSq=0   → result[1]=1,   left++ → pos=0
left=2, right=2, pos=0: leftSq=0,  rightSq=0   → result[0]=0,   left++ → stop

Result: [0, 1, 9, 16, 100]
```

#### Time and Space Complexity
- Time: O(n) | Space: O(n) for result

#### Edge Cases
- All negatives: pointer moves from left inward.
- All positives: pointer moves from right inward.
- Single element: one iteration.

#### Related Variants
- Merge two sorted arrays of squares.

---

### Problem 2 (Easy): Palindrome Check Ignoring Non-Alphanumeric Characters

#### Problem Statement
Given a string `s`, return `true` if it is a palindrome when considering only alphanumeric characters and ignoring case.

#### Constraints or Assumptions
- `0 <= s.length <= 2 * 10⁵`

#### Example
```
Input:  "A man, a plan, a canal: Panama"
Output: true

Input:  "race a car"
Output: false
```

#### Brute Force Solution
Filter characters into a new string, then check if it equals its reverse: O(n) time, O(n) space.

#### Optimized Solution
In-place two pointers, skipping non-alphanumeric characters.

#### Java Solution

```java
public class ValidPalindrome {
    public boolean isPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
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
```
s = "A man, a plan, a canal: Panama"

left=0('A'), right=29('a'): A==a → advance
left=1(' ') → skip to 2('m')
right=28('m'): m==m → advance
... continues until left >= right → return true
```

#### Time and Space Complexity
- Time: O(n) | Space: O(1)

#### Edge Cases
- Empty string: return true.
- All non-alphanumeric: return true (empty after filtering).
- Single character: return true.

---

### Problem 3 (Medium): Three Sum — Find All Unique Triplets Summing to Zero

#### Problem Statement
Given an integer array `nums`, return all unique triplets `[nums[i], nums[j], nums[k]]` such that `i != j != k` and `nums[i] + nums[j] + nums[k] == 0`.

#### Constraints or Assumptions
- Result must not contain duplicate triplets.
- No ordering requirement on the output.

#### Example
```
Input:  [-1, 0, 1, 2, -1, -4]
Output: [[-1, -1, 2], [-1, 0, 1]]
```

#### Brute Force Solution
Three nested loops checking all triples: O(n³). Use a Set to deduplicate.

#### Optimized Solution
Sort the array. For each index `i`, apply two-pointer on `[i+1, n-1]` to find pairs summing to `-nums[i]`. Skip duplicates after each solution found.

#### Java Solution

```java
import java.util.*;

public class ThreeSum {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue; // skip duplicate anchor
            int left = i + 1, right = nums.length - 1;
            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];
                if (sum == 0) {
                    result.add(Arrays.asList(nums[i], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                } else if (sum < 0) {
                    left++;
                } else {
                    right--;
                }
            }
        }
        return result;
    }
}
```

#### Dry Run
```
nums (sorted) = [-4, -1, -1, 0, 1, 2]

i=0, nums[0]=-4: left=1, right=5
  sum = -4 + (-1) + 2 = -3 < 0 → left++
  sum = -4 + (-1) + 2 = -3 < 0 → left++
  sum = -4 + 0 + 2 = -2 < 0 → left++
  sum = -4 + 1 + 2 = -1 < 0 → left++
  left=5 >= right=5 → stop

i=1, nums[1]=-1: left=2, right=5
  sum = -1 + (-1) + 2 = 0 → add [-1,-1,2], skip dups → left=3, right=4
  sum = -1 + 0 + 1 = 0 → add [-1,0,1], skip dups → left=4, right=3 → stop

i=2, nums[2]=-1 == nums[1] → skip
i=3, nums[3]=0: left=4, right=5
  sum = 0 + 1 + 2 = 3 > 0 → right--
  left >= right → stop

Result: [[-1,-1,2], [-1,0,1]]
```

#### Time and Space Complexity
- Time: O(n²) — outer loop O(n), inner two-pointer O(n)
- Space: O(log n) for sort stack; O(k) for result where k = number of triplets

#### Edge Cases
- Fewer than 3 elements: return empty.
- All zeros: one triplet `[0,0,0]`.
- Large duplicate arrays: duplicate-skipping is essential.

#### Related Variants
- Four Sum: two nested loops + two-pointer.
- Three Sum Closest: track minimum difference instead of exact zero.

---

### Problem 4 (Medium): Linked List Cycle II — Find Cycle Entry Point

#### Problem Statement
Given a linked list, return the node where the cycle begins. If there is no cycle, return `null`.

#### Constraints or Assumptions
- Do not modify the list.
- Use O(1) extra space.

#### Example
```
List: 3 → 2 → 0 → -4 → (back to node 2)
Output: node with value 2
```

#### Brute Force Solution
Use a `HashSet<ListNode>` to track visited nodes: O(n) time, O(n) space.

#### Optimized Solution
Floyd's cycle detection: Phase 1 — detect cycle (meet inside cycle). Phase 2 — find entry (reset slow to head, advance both at speed 1 until they meet).

#### Java Solution

```java
public class LinkedListCycleII {
    public ListNode detectCycle(ListNode head) {
        ListNode slow = head, fast = head;
        // Phase 1: detect
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {
                // Phase 2: find entry
                slow = head;
                while (slow != fast) {
                    slow = slow.next;
                    fast = fast.next;
                }
                return slow;
            }
        }
        return null;
    }
}
```

#### Dry Run
```
List: head→[3]→[2]→[0]→[-4]→(back to [2])
Nodes by position:  0    1    2     3

Phase 1:
step 1: slow=1, fast=2
step 2: slow=2, fast=0
step 3: slow=3, fast=2  (fast wrapped: -4 → 2)
step 4: slow=1, fast=0  (slow: 3→2; fast: 2→0)

Wait — let me redo with node references:
n0=3, n1=2, n2=0, n3=-4; n3.next=n1

slow: n0→n1→n2→n3→n1→n2→...
fast: n0→n2→n1→n3→n2→n1→...

step1: slow=n1, fast=n2
step2: slow=n2, fast=n1
step3: slow=n3, fast=n3  → meet at n3

Phase 2: reset slow=n0=head, fast stays at n3
step1: slow=n1(=2), fast=n1(n3.next=n1) → meet at n1=2

Return n1 (value 2). Correct.
```

#### Time and Space Complexity
- Time: O(n) | Space: O(1)

#### Edge Cases
- No cycle: `fast` reaches null.
- Cycle at head: cycle starts immediately; phase 2 returns head.
- Single-node self-loop: `fast.next == fast`; detected in first iteration.

---

### Problem 5 (Hard): Trapping Rain Water

#### Problem Statement
Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

#### Constraints or Assumptions
- `n >= 0`
- `height[i] >= 0`

#### Example
```
Input:  [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
```

#### Brute Force Solution
For each index `i`, scan left and right to find `maxLeft` and `maxRight`. Water at `i` = `min(maxLeft, maxRight) - height[i]`. O(n²) time.

#### Optimized Solution
Use opposite-direction two pointers. Maintain `leftMax` and `rightMax` — the running max seen from each side. Process the side with the smaller max:

- If `leftMax <= rightMax`: water at `left` = `leftMax - height[left]`. Advance `left`.
- Else: water at `right` = `rightMax - height[right]`. Advance `right`.

#### Why the Final Approach Works
For index `left`, if `leftMax <= rightMax`, then `rightMax` is at least `leftMax`, so the water at `left` is determined entirely by `leftMax`. We do not need to know the exact right maximum — we know it is at least `leftMax`. This gives us confidence to process `left` immediately.

#### Decision Process
> Two-pass prefix max gives O(n) with O(n) space. Two pointers give O(n) time and O(1) space — the optimal solution. The key insight: process the side with the smaller maximum because the water there is bounded by that side, regardless of the other side.

#### Java Solution

```java
public class TrappingRainWater {
    public int trap(int[] height) {
        int left = 0, right = height.length - 1;
        int leftMax = 0, rightMax = 0;
        int water = 0;
        while (left < right) {
            if (height[left] <= height[right]) {
                if (height[left] >= leftMax) {
                    leftMax = height[left];
                } else {
                    water += leftMax - height[left];
                }
                left++;
            } else {
                if (height[right] >= rightMax) {
                    rightMax = height[right];
                } else {
                    water += rightMax - height[right];
                }
                right--;
            }
        }
        return water;
    }
}
```

#### Dry Run

```
height = [0,1,0,2,1,0,1,3,2,1,2,1]
           0 1 2 3 4 5 6 7 8 9 ...

left=0, right=11: h[0]=0 <= h[11]=1
  h[0]=0 < leftMax=0? No, 0>=0 → leftMax=0. left++
left=1, right=11: h[1]=1 <= h[11]=1
  h[1]=1 >= leftMax=0 → leftMax=1. left++
left=2, right=11: h[2]=0 <= h[11]=1
  h[2]=0 < leftMax=1 → water += 1-0=1. left++  [water=1]
left=3, right=11: h[3]=2 > h[11]=1
  h[11]=1 >= rightMax=0 → rightMax=1. right--
left=3, right=10: h[3]=2 > h[10]=2? No, equal → h[3] <= h[10]
  h[3]=2 >= leftMax=1 → leftMax=2. left++
left=4, right=10: h[4]=1 <= h[10]=2
  h[4]=1 < leftMax=2 → water += 2-1=1. left++  [water=2]
left=5, right=10: h[5]=0 <= h[10]=2
  h[5]=0 < leftMax=2 → water += 2-0=2. left++  [water=4]
left=6, right=10: h[6]=1 <= h[10]=2
  h[6]=1 < leftMax=2 → water += 2-1=1. left++  [water=5]
left=7, right=10: h[7]=3 > h[10]=2
  h[10]=2 >= rightMax=1 → rightMax=2. right--
left=7, right=9: h[7]=3 > h[9]=1
  h[9]=1 < rightMax=2 → water += 2-1=1. right-- [water=6]
left=7, right=8: h[7]=3 > h[8]=2
  h[8]=2 >= rightMax=2 → rightMax=2. right--
left=7, right=7: left >= right → stop.

Return 6. Correct.
```

#### Time and Space Complexity
- **Time**: O(n) | **Space**: O(1)

#### Edge Cases
- Empty or single-element: no water.
- Monotonically increasing or decreasing: no water.
- All same height: no water.

#### Related Variants
- Largest rectangle in histogram (Chapter 7, monotonic stack).
- Container With Most Water (worked example 3 above).

---

## Recognition Guide

### When to Use Two Pointers

| Scenario | Pointer Style |
|---|---|
| Sorted array, find pair with target sum | Opposite-direction |
| Sorted array, Three/Four Sum | Opposite-direction in outer loop |
| In-place remove/filter/compact | Same-direction (read/write) |
| Partition array by condition | Same-direction or Dutch Flag (3-way) |
| Check palindrome | Opposite-direction |
| Reverse array or string segment | Opposite-direction (swap) |
| Detect cycle in sequence/linked list | Fast and slow |
| Find middle of linked list | Fast and slow |
| Happy number, Floyd cycle in value-space | Fast and slow |
| Rotate array in-place | In-place reversal (3 reversals) |
| Squeeze water or maximize width × height | Opposite-direction, greedy move |

### Recognition Keywords

- "in-place," "O(1) extra space," "without extra memory"
- "sorted array" + "pair/triplet/quadruplet"
- "remove/filter/deduplicate" + array
- "palindrome" + string
- "cycle" + linked list
- "middle" + linked list
- "reverse" + O(1) space

### Constraint Clues

- **O(1) space**: immediately think two pointers or in-place.
- **Sorted input**: opposite-direction two pointers is the first candidate.
- **In-place modification required**: same-direction (write pointer).
- **Linear time O(n)**: nested loops are not acceptable — think one-pass with two pointers.

### Common Traps

- Forgetting to skip duplicates in Three Sum → duplicate triplets in output.
- Using hash map when O(1) space is required.
- Moving both pointers each step without a condition check.
- Off-by-one on `left < right` vs `left <= right`.
- Not normalizing `k % n` in rotation problems.

### When NOT to Use Two Pointers

- Unsorted array, exact pair sum → HashMap (O(n) time, O(n) space).
- Count all valid subarrays with complex state → Sliding Window or DP.
- Non-linear data structures (trees, graphs) → BFS/DFS.
- Multiple independent scans that cannot be merged → may need separate passes.

---

## Comparison Tables

### Opposite-Direction Two Pointers vs HashMap (Pair Sum)

| Dimension | Two Pointers | HashMap |
|---|---|---|
| Precondition | Array must be sorted | No sorting needed |
| Time | O(n) | O(n) |
| Space | O(1) | O(n) |
| Best use | When input is sorted | When input is unsorted |
| Handles duplicates | With extra skip logic | Naturally |
| Returns indices | Yes, directly | Yes, directly |

### Same-Direction (Write Pointer) vs New Array

| Dimension | Write Pointer | New Array |
|---|---|---|
| Space | O(1) extra | O(n) extra |
| Time | O(n) | O(n) |
| Modifies original | Yes | No |
| Preferred when | In-place required | Original must be preserved |

### Two-Pointer Styles Comparison

| Style | Direction | Use Case | Termination |
|---|---|---|---|
| Opposite-direction | ← → | Pair sum, palindrome, container | `left >= right` |
| Same-direction (read/write) | → → | Filter, compact, partition | `read >= n` |
| Fast/slow | → →→ | Cycle, middle | `fast == null` or `slow == fast` |
| In-place reversal | ← → | Reverse, rotate | `left >= right` |

---

## Design and Decision Making

### Relevant Design Patterns

Two-pointer itself is a **coding pattern**, not an OOP design pattern. But the design principles around it are important:

- **Single Responsibility**: Each pointer has one job. `read` scans; `write` records. Do not let them share responsibilities.
- **Invariant as a contract**: Define the loop invariant as a contract before coding. This mirrors defensive programming and DbC (Design by Contract).
- **Template Method**: The two-pointer loop structure is a template: initialize → check condition → compute → move. The specifics vary, but the skeleton is fixed.

### Clean Code Rules for Two-Pointer Code

1. **Declare pointers at the top with meaningful names**: `left/right` for converging; `read/write` for same-direction; `slow/fast` for speed-based.
2. **State the invariant in a comment before the loop**.
3. **Keep the loop body short**: each branch should do one thing — move a pointer, record a result, or both.
4. **Extract helper methods for complex conditions**: `isValid(nums[read])` instead of `nums[read] != 0 && nums[read] != val`.
5. **Avoid mixing pointer roles**: do not use `write` as a read index.

### Naming Conventions

```java
// Opposite-direction
int left = 0, right = nums.length - 1;

// Same-direction
int read = 0, write = 0; // or: int slow = 0, fast = 0;

// Fast/slow (linked list)
ListNode slow = head, fast = head;

// Reversal
int left = start, right = end;
```

### API Design for Reusable Helpers

When reversal is used in multiple problems (rotation, word reversal, palindrome), extract it:

```java
private static void reverse(int[] nums, int left, int right) {
    while (left < right) {
        int tmp = nums[left]; nums[left] = nums[right]; nums[right] = tmp;
        left++; right--;
    }
}
```

This makes the rotation code read like pseudocode:

```java
reverse(nums, 0, n - 1);
reverse(nums, 0, k - 1);
reverse(nums, k, n - 1);
```

### Testability

Two-pointer functions are pure (they either return a value or mutate the input predictably). They are easy to test:

```java
@Test
void testRotate() {
    int[] nums = {1, 2, 3, 4, 5};
    rotate(nums, 2);
    assertArrayEquals(new int[]{4, 5, 1, 2, 3}, nums);
}
```

Always test:
- Empty array
- Single element
- Two elements
- Array length equals `k` (rotation wraps completely)
- Sorted ascending and sorted descending

---

## Practical Applications

### Backend Systems

- **Merge sorted result sets**: opposite-direction two pointers merge two sorted arrays in O(n+m), used in merge sort and external sort.
- **Deduplication pipelines**: same-direction pointers remove duplicates from sorted event logs in O(n) without allocating a new array — memory efficiency matters at scale.

### Databases

- **Two-pointer merge in merge sort**: every database's sort algorithm uses a two-pointer merge when combining sorted runs from disk.
- **Index scan range queries**: a B-tree range scan uses conceptually similar start/end cursor logic.

### Operating Systems

- **Memory compaction**: OS memory managers use write-pointer-style compaction to move live pages together, freeing contiguous space.

### Networking

- **Sliding window TCP**: TCP's send/receive window is a sliding window — a direct generalization of the same-direction two-pointer pattern (Chapter 6 connection).

### Distributed Systems

- **Dedup in streaming pipelines**: a sorted log stream is deduplicated using a write-pointer approach (e.g., deduplicating Kafka topics with sorted keys).

### AI and ML

- **Feature filtering**: in data preprocessing, same-direction pointers remove rows with missing values in-place.
- **Sequence labeling**: sliding windows over sequences (Chapter 6) use the same mental model as same-direction two pointers.

---

## Failure Modes and Trade-offs

### Senior Engineer Insights

1. **The invariant IS the algorithm.** Once you state the invariant precisely, writing the code is almost mechanical. Senior engineers define the invariant before touching the keyboard.

2. **Two pointers degenerate to binary search.** If your pointer movement has a "skip the entire left half" quality, you are doing binary search without naming it. Recognize the overlap.

3. **Multiple two-pointer passes are still O(n).** You can run two separate two-pointer passes and the total is O(n) + O(n) = O(n). Do not hesitate to use multiple passes for clarity.

4. **Cycle detection generalizes beyond linked lists.** Any function `f: S → S` on a finite set will eventually cycle. Floyd's algorithm works on any such function — happy numbers, number sequences, polynomial maps.

### Hidden Tricks

- **Rotate an array using XOR swap instead of temp variable**: saves the temporary, but reduces readability. Prefer clarity.
- **Two-pointer on a sorted 2D matrix**: treat row/column as two coordinates; move left/right or up/down based on comparison.
- **Reverse-then-two-pointer for complex rearrangements**: reverse the whole array, then apply two-pointer to the sub-problem.

### Performance Tuning

- Avoid unnecessary bounds checks inside hot loops: pre-check `nums.length >= 2` before entering the loop.
- For linked list fast/slow, the early-exit `fast == null || fast.next == null` avoids the NullPointerException and lets the JIT eliminate the null check in the common path.

### Interview Traps

1. **"Why not use a HashMap?"** — Two pointers are O(1) space. Be ready to explain the space trade-off.
2. **"What if the array is not sorted?"** — Know when to sort first (O(n log n)) vs when to use a hash map (O(n) but O(n) space).
3. **"Find the cycle start, not just detect it."** — Most candidates know phase 1 but flub phase 2. Memorize: reset slow to head, advance both at speed 1.
4. **"Prove your greedy choice."** — For Container With Most Water, be ready to give the formal argument for why moving the shorter bar is correct.

### Failure Modes and Debugging Strategy

- **Infinite loop**: some branch does not move any pointer. Add an assertion that at least one pointer moved per iteration.
- **Wrong result on even-length palindrome**: the `left < right` condition is `<`, not `<=`. When `left == right` on an odd palindrome, the center is compared with itself — which passes trivially.
- **Missed edge case in cycle start**: drew the picture correctly but confused the reset target. Always reset `slow` to **head**, not to the meeting point.

---

## Condensed Notes

### Key Rules

1. **Opposite-direction**: sorted array, two ends converge. Move the end that cannot possibly be part of the answer.
2. **Same-direction**: filter/compact in-place. `write` points at the next empty slot. `read` scans.
3. **Fast/slow**: cycle detection, middle finding. Fast = 2×slow. Phase 2: reset slow to head.
4. **In-place reversal**: swap from both ends inward. Three reversals = rotation.
5. **Loop invariant**: define it before coding. Every pointer move must preserve it.

### Templates

```java
// Opposite-direction
int left = 0, right = n - 1;
while (left < right) {
    if (condition) { left++; }
    else { right--; }
}

// Same-direction (write pointer)
int write = 0;
for (int read = 0; read < n; read++) {
    if (valid(nums[read])) nums[write++] = nums[read];
}

// Fast/slow — cycle detection
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) { /* cycle detected */ break; }
}

// Reversal helper
private void reverse(int[] a, int l, int r) {
    while (l < r) { int t = a[l]; a[l++] = a[r]; a[r--] = t; }
}
```

### Gotchas

- `k = k % n` before rotation.
- `fast != null && fast.next != null` — both guards needed.
- Skip duplicates explicitly in Three Sum: advance `left` and `right` past equal values after a match.
- Do NOT increment `mid` after swapping with `high` in Dutch National Flag.
- Termination: `left < right` (not `<=`) for pair-finding; `left <= right` for reversal.

### Decision Shortcuts

```
Input sorted + pair target           → Opposite-direction
Input unsorted + pair target         → HashMap
Filter/compact in-place              → Same-direction write pointer
Partition into groups                → Dutch Flag (3-way) or write pointer
Cycle or middle in linked list       → Fast/slow
Reverse segment                      → Swap from both ends
Rotate array                         → Three reversals
O(1) space required + any above      → Two-pointer (not HashMap)
```

---

## Additional Problems

### Easy

1. **Two Sum II (Sorted)**
   - Find indices of two numbers summing to target in sorted array.
   - Pattern: opposite-direction two pointers.

2. **Valid Palindrome**
   - Check if string is palindrome ignoring non-alphanumeric characters.
   - Pattern: opposite-direction two pointers with character skipping.

3. **Remove Element**
   - Remove all occurrences of a value in-place; return new length.
   - Pattern: same-direction write pointer.

4. **Reverse String**
   - Reverse a char array in-place.
   - Pattern: in-place reversal.

5. **Middle of Linked List**
   - Find the middle node of a linked list.
   - Pattern: fast and slow pointers.

---

### Medium

1. **Three Sum**
   - Find all unique triplets summing to zero.
   - Pattern: sort + opposite-direction two pointers in loop.

2. **Container With Most Water**
   - Maximize water held between two bars.
   - Pattern: opposite-direction, greedy pointer movement.

3. **Sort Colors (Dutch National Flag)**
   - Sort array of 0s, 1s, 2s in-place in one pass.
   - Pattern: three-pointer partition.

4. **Linked List Cycle II**
   - Return the node where the cycle begins.
   - Pattern: fast/slow — two-phase Floyd's algorithm.

5. **Remove Duplicates from Sorted Array II**
   - Allow at most 2 occurrences of each element in-place.
   - Pattern: same-direction write pointer with k-position look-back.

---

### Hard

1. **Trapping Rain Water**
   - Compute total water trapped in elevation map.
   - Pattern: opposite-direction two pointers with running max.

2. **Minimum Window Substring** *(preview — full coverage in Chapter 6)*
   - Find shortest substring containing all characters of a target.
   - Pattern: two same-direction pointers (sliding window setup).

3. **Four Sum**
   - Find all unique quadruplets summing to a target.
   - Pattern: two nested loops + two-pointer inner scan.

4. **Find the Duplicate Number (Floyd's Cycle)**
   - Detect duplicate using value-as-pointer cycle detection.
   - Pattern: fast/slow on value space (no extra space).

5. **Palindrome Linked List**
   - Determine if linked list values form a palindrome in O(1) space.
   - Pattern: fast/slow to find middle, in-place reversal of second half, compare.

---

## Key Questions

**Q1: How do you solve Two Sum on a sorted array more efficiently than O(n²)?**

A: Use opposite-direction two pointers. The sorted order gives us a monotone property: moving the left pointer right increases the sum; moving the right pointer left decreases it. We eliminate a column or row of the search space in O(1) per step, achieving O(n) total.

---

**Q2: When would you use a HashMap for pair sum instead of two pointers?**

A: When the array is unsorted and sorting it would cost O(n log n) — more than the O(n) we gain from two pointers over hash map. Both are O(n) time; the trade-off is O(n) space for the hash map vs O(1) for two pointers (which requires sorted input). If the input is sorted or can be sorted cheaply, prefer two pointers for space efficiency.

---

**Q3: Explain the fast/slow pointer cycle detection algorithm and why it works.**

A: Once both pointers enter a cycle, fast gains on slow by 1 position per step (fast moves 2, slow moves 1). The gap closes to 0 within at most `c` steps (cycle length). They must meet. For acyclic lists, fast exits via null. The algorithm is O(n) time and O(1) space.

---

**Q4: After detecting a cycle, how do you find the cycle entry node?**

A: Reset `slow` to `head`. Advance both `slow` and `fast` at speed 1. They will meet at the cycle entry. The mathematical proof: if the distance from head to cycle entry is `d` and cycle length is `c`, the meeting point inside the cycle is at distance `c - (d mod c)` from the entry. Resetting slow to head and advancing both at speed 1 neutralizes this offset in exactly `d` more steps.

---

**Q5: What is the loop invariant in the Three Sum algorithm?**

A: For a fixed anchor `nums[i]`, the invariant is: if a valid pair exists in `nums[i+1..n-1]` summing to `-nums[i]`, both its elements have indices in `[left, right]`. We maintain this by always moving the pointer that cannot be part of the answer.

---

**Q6: Why does "move the shorter bar inward" work for Container With Most Water?**

A: Suppose `height[left] <= height[right]`. For any pair `(left, right')` with `right' < right`, the area is at most `height[left] * (right' - left) < height[left] * (right - left)`. So no future pairing with the current `left` can exceed the current area bounded by `height[left]`. We can safely discard `left`.

---

**Q7: In Dutch National Flag, why do you NOT increment `mid` after swapping with `high`?**

A: The value swapped from `high` to `mid` is unknown — it has not been examined yet. Incrementing `mid` would move it into the "1s zone" without verification. The invariant requires that every element below `mid` is classified. After swapping, the element at `mid` must be re-examined.

---

**Q8: How do you rotate an array right by k positions in O(1) extra space?**

A: Three-reversal trick:
1. Reverse the entire array.
2. Reverse `[0, k-1]`.
3. Reverse `[k, n-1]`.

Example: `[1,2,3,4,5]`, k=2 → `[4,5,1,2,3]`. Normalize `k = k % n` first to handle `k >= n`.

---

**Q9: How do you find the middle of a linked list in one pass?**

A: Fast and slow pointers, both starting at head. Advance slow by 1 and fast by 2 each step. When fast reaches null (or fast.next is null), slow is at the middle. For even-length lists, slow lands at the first of the two middle nodes.

---

**Q10: What are the two termination conditions in the fast/slow pointer loop, and why are both needed?**

A: `while (fast != null && fast.next != null)`. We need `fast != null` because the list might be empty. We need `fast.next != null` because the two-step advance `fast.next.next` would throw a NullPointerException if `fast.next` is null. Omitting either guard causes a crash on even-length acyclic lists.

---

## Applied Project

### Objective

Build a **ListUtility library** — a small Java class that demonstrates all four two-pointer techniques on both arrays and linked lists.

### Required Features

1. **`int[] sortedSquares(int[] nums)`**: squares of sorted array, result sorted, two pointers.
2. **`int removeDuplicates(int[] nums, int k)`**: remove duplicates allowing at most `k` occurrences, write pointer.
3. **`void rotate(int[] nums, int k)`**: rotate array right using three reversals.
4. **`boolean hasCycle(ListNode head)`**: Floyd's cycle detection.
5. **`ListNode findCycleStart(ListNode head)`**: two-phase Floyd's.
6. **`ListNode middleNode(ListNode head)`**: fast/slow middle.
7. **`boolean isPalindromeList(ListNode head)`**: find middle, reverse second half, compare, restore (optional).

### Suggested Java Module Structure

```
list-utility/
├── src/
│   └── main/java/com/tutorials/
│       ├── ListNode.java
│       ├── ArrayTwoPointer.java    // sortedSquares, removeDuplicates, rotate
│       └── ListTwoPointer.java     // hasCycle, findCycleStart, middleNode, isPalindromeList
└── src/
    └── test/java/com/tutorials/
        ├── ArrayTwoPointerTest.java
        └── ListTwoPointerTest.java
```

### Testing Ideas

- `sortedSquares([-4,-1,0,3,10])` → `[0,1,9,16,100]`
- `removeDuplicates([1,1,1,2,2,3], 2)` → `5`
- `rotate([1,2,3,4,5], 2)` → `[4,5,1,2,3]`
- Build a list with a known cycle and verify `hasCycle` returns true.
- Build a 5-node list and verify `middleNode` returns node 3.
- Build `1→2→1` and verify `isPalindromeList` returns true.

### Stretch Goals

1. Make `removeDuplicates` accept a `Predicate<Integer>` for the validity condition.
2. Add `isPalindromeArray(int[] nums)` and benchmark it against the list version.
3. Implement `int trap(int[] height)` (Trapping Rain Water) as a bonus method.
4. Write a cycle-builder test utility: `ListNode buildCycle(int[] values, int cycleIndex)`.

---


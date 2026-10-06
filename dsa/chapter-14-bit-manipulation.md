# 14: Bit Manipulation

**Goal:** Teach learners how binary representation controls low-level operations, how to use bitwise operators safely in Java, and how to recognize when bitmasks simplify state or improve performance.
**Outcome:** By the end of this chapter, you can read and write basic bit operations, set and clear specific bits, count set bits efficiently, use XOR for common interview tricks, and represent subsets or compact state with bitmasks.

---

## 1. Intuition First

Bit manipulation matters because every integer in Java is already stored in binary. Bitwise operations let you work directly with that representation instead of paying for higher-level bookkeeping when the problem only needs on or off state.

A simple real-world analogy is a row of light switches. Each switch is either off or on. A bitmask is just a compact panel of switches where one integer stores many yes or no decisions.

The core mental model is this: a bit position encodes a power of two, and bitwise operators transform those positions directly. Once you can see a number as a set of bits instead of as a decimal value, many operations become mechanical.

The most common beginner confusion point is mixing arithmetic with bitwise reasoning. `+`, `-`, and `*` operate on full numeric values. `&`, `|`, `^`, `~`, `<<`, and `>>` operate on individual bits.

In the roadmap, this chapter sits after sorting because it shifts attention from ordering whole values to representing information more compactly. It also prepares later DP state compression, subset work, and advanced string or graph optimizations.

## 2. Core Concepts and Techniques

### Concept Cluster: Bitwise Operators, Single-Bit Updates, and Counting Bits
Key concepts in this block:
- 14.1 Bitwise operators
- 14.2 Set, clear, and toggle bit operations
- 14.3 Counting bits

#### Intuition

The basic operators let you inspect, combine, or change binary flags one position at a time.

#### Why It Matters

Many interview tasks boil down to testing membership, flipping a flag, or counting how many features are active.

#### How It Works

- `&` keeps a bit on only if both sides have it on
- `|` turns a bit on if either side has it on
- `^` turns a bit on if exactly one side has it on
- `<<` shifts bits left, usually multiplying by a power of two
- `>>` shifts bits right, usually dividing by a power of two for non-negative values

Single-bit operations:
- set bit `k`: `value | (1 << k)`
- clear bit `k`: `value & ~(1 << k)`
- toggle bit `k`: `value ^ (1 << k)`
- test bit `k`: `(value & (1 << k)) != 0`

Counting bits:
- inspect all bit positions one by one
- or remove the lowest set bit repeatedly with `value &= value - 1`

#### Java Implementation Notes

- Remember that Java `int` uses 32 bits and `long` uses 64 bits.
- Parentheses matter because bitwise operators have lower precedence than arithmetic shifts and comparisons in some expressions.
- For counting bits in production code, `Integer.bitCount` exists, but manual logic is still important for interviews.

#### Common Mistakes

- using one-based bit positions when the code expects zero-based positions
- forgetting parentheses around `1 << k`
- misunderstanding right shift on negative numbers
- counting all 32 bits when a lower-set-bit loop would be simpler

#### Quick Example

```java
class BitQuickExample {
    static int toggleThirdBit(int value) {
        return value ^ (1 << 2);
    }

    static int countBits(int value) {
        int count = 0;
        while (value != 0) {
            value &= value - 1;
            count++;
        }
        return count;
    }
}
```

#### Debugging Tip

Write the binary form for a small example. Most bit bugs become obvious once you stop thinking only in decimal.

#### Advanced Note

Brian Kernighan's trick `value &= value - 1` removes one set bit per iteration, so its runtime depends on how many bits are on, not on the word size.

### Concept Cluster: XOR Tricks
Key concepts in this block:
- 14.4 XOR tricks

#### Intuition

XOR is useful because matching values cancel each other out.

#### Why It Matters

Several popular interview problems use XOR to remove paired values, swap parity-like state, or track uniqueness with constant extra space.

#### How It Works

- `a ^ a = 0`
- `a ^ 0 = a`
- XOR is commutative and associative
- if every value appears twice except one, XOR of all values leaves only the unique one

#### Java Implementation Notes

- XOR-based solutions are usually concise, but only when the problem's count pattern fits exactly.
- Use them when the mathematical rule is clean, not because bit tricks look clever.

#### Common Mistakes

- applying XOR when duplicates appear three times or follow a different count pattern
- forgetting that XOR solves parity-style uniqueness, not arbitrary frequency counting

#### Quick Example

```java
class XorQuickExample {
    static int singleNumber(int[] values) {
        int answer = 0;
        for (int value : values) {
            answer ^= value;
        }
        return answer;
    }
}
```

#### Debugging Tip

If you are tempted to use XOR, write down the appearance count of each value first. The cancellation rule must match that pattern exactly.

#### Advanced Note

XOR also helps compare prefix parity states, which later appears in some string and prefix problems.

### Concept Cluster: Bitmasking, Subsets, and State-Encoding Patterns
Key concepts in this block:
- 14.5 Bitmasking basics
- 14.6 Subset and state-encoding patterns

#### Intuition

Bitmasking stores a whole set of yes or no decisions inside one integer.

#### Why It Matters

It is one of the most compact ways to represent subsets, visited choices, permissions, or small-state DP transitions.

#### How It Works

- bit `k` represents whether item `k` is present
- iterating from `0` to `(1 << n) - 1` enumerates all subsets of `n` items
- one integer can also encode small state combinations, such as which letters have appeared or which tasks are finished

#### Java Implementation Notes

- Use `int` masks up to 31 useful positions and `long` if you need more.
- Keep the meaning of each bit explicit in variable names or helper methods.
- Bitmasking is efficient only when the state dimension is small enough.

#### Common Mistakes

- forgetting that `1 << n` overflows if `n` is too large for the type
- losing track of which bit maps to which item
- using bitmasking when a `HashSet` would be clearer and the state is not small

#### Quick Example

```java
import java.util.ArrayList;
import java.util.List;

class BitmaskSubsetsQuickExample {
    static List<List<Integer>> subsets(int[] values) {
        List<List<Integer>> result = new ArrayList<>();
        int totalMasks = 1 << values.length;

        for (int mask = 0; mask < totalMasks; mask++) {
            List<Integer> subset = new ArrayList<>();
            for (int bit = 0; bit < values.length; bit++) {
                if ((mask & (1 << bit)) != 0) {
                    subset.add(values[bit]);
                }
            }
            result.add(subset);
        }

        return result;
    }
}
```

#### Debugging Tip

When a mask represents a set, print both the decimal mask and the chosen elements while testing. This prevents silent bit-position confusion.

#### Advanced Note

Bitmask state encoding becomes especially powerful in advanced DP when the state space is small but the transition logic depends on many yes or no flags.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Single Number
#### Problem Statement

Given an array where every element appears exactly twice except for one element that appears once, return the unique element.

#### Why This Example Matters

It is the cleanest XOR interview problem and shows how bit reasoning can replace extra storage entirely.

#### Constraints or Assumptions

- exactly one value appears once
- every other value appears exactly twice
- order does not matter

#### Brute-Force Approach

Use a `HashMap<Integer, Integer>` to count frequencies and then find the value with count `1`.

#### Better Approach

Use XOR across the whole array.

#### Why the Better Approach Works

Every paired value cancels itself because `a ^ a = 0`, leaving only the unpaired value.

#### Pragmatic Java Choice

Choose XOR here because the frequency pattern is exact and matches the cancellation rule perfectly.

#### Java Solution

```java
import java.util.HashMap;
import java.util.Map;

class SingleNumberExample {
    static int singleNumberWithMap(int[] values) {
        Map<Integer, Integer> frequency = new HashMap<>();
        for (int value : values) {
            frequency.put(value, frequency.getOrDefault(value, 0) + 1);
        }

        for (int value : values) {
            if (frequency.get(value) == 1) {
                return value;
            }
        }

        throw new IllegalArgumentException("Input does not satisfy the problem constraints");
    }

    static int singleNumberWithXor(int[] values) {
        int answer = 0;
        for (int value : values) {
            answer ^= value;
        }
        return answer;
    }
}
```

#### Dry Run

Use `values = [4, 1, 2, 1, 2]`.

XOR flow:
- start `0`
- `0 ^ 4 = 4`
- `4 ^ 1 = 5`
- `5 ^ 2 = 7`
- `7 ^ 1 = 6`
- `6 ^ 2 = 4`

The paired `1` and `2` values cancel out, leaving `4`.

#### Time and Space Complexity

- Brute force: `O(n)` time, `O(n)` extra space
- Better approach: `O(n)` time, `O(1)` extra space

#### Edge Cases

- one-element array returns that element
- negative numbers still work with XOR
- invalid frequency patterns break the XOR assumption

#### Common Mistakes

- using XOR when some elements appear more than twice
- not checking that the problem statement actually fits the trick

### Worked Example 2: Count Set Bits in an Integer
#### Problem Statement

Given a non-negative integer, return how many bits in its binary representation are `1`.

#### Why This Example Matters

It teaches both direct bit inspection and the lower-set-bit removal trick.

#### Constraints or Assumptions

- input is non-negative for simpler reasoning
- treat the value as a standard Java `int`

#### Brute-Force Approach

Inspect each bit position from `0` to `31` and count how many tested bits are on.

#### Better Approach

Use Brian Kernighan's method and repeatedly remove the lowest set bit.

#### Why the Better Approach Works

`value - 1` flips the lowest set bit and all lower bits. Applying `value & (value - 1)` removes exactly one set bit. Repeating that step counts only the set bits that actually exist.

#### Pragmatic Java Choice

Use the loop-based Kernighan version in interviews to show understanding, and use `Integer.bitCount` in production when appropriate.

#### Java Solution

```java
class CountBitsExample {
    static int countBitsByScanning(int value) {
        int count = 0;
        for (int bit = 0; bit < 32; bit++) {
            if ((value & (1 << bit)) != 0) {
                count++;
            }
        }
        return count;
    }

    static int countBitsByRemovingLowestSetBit(int value) {
        int count = 0;
        while (value != 0) {
            value &= value - 1;
            count++;
        }
        return count;
    }
}
```

#### Dry Run

Use `value = 13`, which is binary `1101`.

Kernighan loop:
- `1101` becomes `1100`, count `1`
- `1100` becomes `1000`, count `2`
- `1000` becomes `0000`, count `3`

The answer is `3`.

#### Time and Space Complexity

- Brute force: `O(32)` time, `O(1)` extra space
- Better approach: `O(number of set bits)` time, `O(1)` extra space

#### Edge Cases

- `0` has zero set bits
- powers of two have exactly one set bit
- negative numbers need extra care if the problem expects unsigned interpretation

#### Common Mistakes

- confusing bit positions with decimal digits
- forgetting that left shift on large bit positions can overflow the sign bit in `int`
- not clarifying whether the task treats input as signed or unsigned

### Worked Example 3: Generate All Subsets with Bitmasking
#### Problem Statement

Given an array of distinct integers, return all possible subsets.

#### Why This Example Matters

It shows how one integer can encode a whole choice set and how subset enumeration maps directly to binary counting.

#### Constraints or Assumptions

- all values are distinct
- output order does not matter
- include the empty subset

#### Brute-Force Approach

Use recursive backtracking to decide include or skip at each position.

#### Better Approach

Use bitmask enumeration from `0` to `(1 << n) - 1`.

#### Why the Better Approach Works

Each binary mask is a unique on or off choice for every element. Every subset corresponds to exactly one mask.

#### Pragmatic Java Choice

Use bitmasking when `n` is small enough that `2^n` subsets are acceptable and the state only needs membership, not complex recursion control.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class BitmaskSubsetsExample {
    static List<List<Integer>> subsetsBacktracking(int[] values) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(values, 0, new ArrayList<>(), result);
        return result;
    }

    private static void backtrack(int[] values, int index, List<Integer> current, List<List<Integer>> result) {
        if (index == values.length) {
            result.add(new ArrayList<>(current));
            return;
        }

        backtrack(values, index + 1, current, result);
        current.add(values[index]);
        backtrack(values, index + 1, current, result);
        current.remove(current.size() - 1);
    }

    static List<List<Integer>> subsetsBitmask(int[] values) {
        List<List<Integer>> result = new ArrayList<>();
        int totalMasks = 1 << values.length;

        for (int mask = 0; mask < totalMasks; mask++) {
            List<Integer> subset = new ArrayList<>();
            for (int bit = 0; bit < values.length; bit++) {
                if ((mask & (1 << bit)) != 0) {
                    subset.add(values[bit]);
                }
            }
            result.add(subset);
        }

        return result;
    }
}
```

#### Dry Run

Use `values = [10, 20, 30]`.

Masks:
- `000` gives `[]`
- `001` gives `[10]`
- `010` gives `[20]`
- `011` gives `[10, 20]`
- continue until `111` gives `[10, 20, 30]`

#### Time and Space Complexity

- Brute force: `O(n * 2^n)` time, `O(n)` recursion depth plus output space
- Better approach: `O(n * 2^n)` time, `O(1)` extra control space beyond the output and current subset construction

#### Edge Cases

- empty array returns `[[]]`
- large `n` makes subset enumeration infeasible regardless of implementation style
- duplicate input values would produce repeated subsets semantically

#### Common Mistakes

- mixing bit positions with element values
- using `1 << n` when `n` is too large for the integer type
- forcing bitmasking when recursion is clearer and the state is not compact

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- direct bit operations are usually `O(1)` and extremely cheap
- counting bits can be `O(word size)` or `O(number of set bits)` depending on the method
- XOR tricks often turn map-based frequency work into constant-space scans, but only under exact counting assumptions
- bitmasking is compact and fast for small-state problems, but it does not defeat exponential growth when the number of subsets itself is exponential

Choose bit manipulation when:
- the state is naturally yes or no
- the problem mentions powers of two, parity-like uniqueness, or subset membership
- compact representation simplifies the logic

Choose XOR when:
- the cancellation rule matches the frequency pattern exactly

Choose bitmasking when:
- the universe size is small enough to fit comfortably in a primitive type
- you need fast subset or visited-state checks

Signals not to force bit tricks:
- the code becomes less clear without a real performance benefit
- the state is not naturally binary
- the mask would require too many bits to be practical

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- wrong bit index
- missing parentheses around shifts
- misusing signed right shift on negative values
- forgetting that a bitmask still needs a clear mapping between bits and items

Boundary and representation risks:
- zero values
- negative numbers in shift problems
- masks that exceed `int` capacity
- exponential subset growth for large `n`

Short debugging checklist:
- What does each bit position mean?
- Am I treating positions as zero-based consistently?
- Does the XOR trick match the exact frequency rule?
- Would a set or map be clearer than a bitmask here?
- Is the bit width of the chosen type large enough?

## 6. Practice Problems

### Easy

- Title: Single Number
  - One-line prompt: Find the value that appears once while all others appear twice.
  - Expected pattern or core idea: XOR cancellation.
- Title: Number of 1 Bits
  - One-line prompt: Count how many set bits appear in an integer.
  - Expected pattern or core idea: Bit scanning or lowest-set-bit removal.
- Title: Power of Two
  - One-line prompt: Determine whether a number is a power of two.
  - Expected pattern or core idea: Single-set-bit check.

### Medium

- Title: Subsets
  - One-line prompt: Return all subsets of a distinct integer array.
  - Expected pattern or core idea: Bitmask enumeration or backtracking comparison.
- Title: Counting Bits
  - One-line prompt: Return the number of set bits for every number from `0` to `n`.
  - Expected pattern or core idea: DP over bit relations.
- Title: Sum of Two Integers
  - One-line prompt: Add two integers without using `+` or `-`.
  - Expected pattern or core idea: Bitwise addition with carry.

### Hard

- Title: Single Number III
  - One-line prompt: Find two values that appear once while all others appear twice.
  - Expected pattern or core idea: XOR partition by a distinguishing bit.
- Title: Maximum Product of Word Lengths
  - One-line prompt: Find two words with no shared letters and maximum length product.
  - Expected pattern or core idea: Bitmask state encoding.
- Title: Shortest Path Visiting All Nodes
  - One-line prompt: Visit every node in a graph with minimum steps.
  - Expected pattern or core idea: Bitmask state plus BFS.

## 7. Short Recap

The core idea of this chapter is that bitwise operations let you manipulate binary state directly instead of carrying extra structures for simple on or off information.

The most important optimization insight is that XOR and bitmasks can collapse some map-heavy or subset-heavy logic into compact constant-space state.

The most important implementation warning is to keep bit positions explicit and to use bit tricks only when the problem's structure genuinely matches them.

This chapter prepares the next chapter by making mathematical shortcuts and representation-aware thinking natural before the math toolkit formalizes common algorithmic number operations.

## 8. Coverage Check

- [x] 14.1 Bitwise operators
- [x] 14.2 Set, clear, and toggle bit operations
- [x] 14.3 Counting bits
- [x] 14.4 XOR tricks
- [x] 14.5 Bitmasking basics
- [x] 14.6 Subset and state-encoding patterns

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 15: Mathematics for DSA
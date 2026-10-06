# 28: Greedy Algorithms

**Goal:** Teach when a locally optimal choice leads to a globally optimal solution, and how to justify greedy decisions with clear correctness arguments.
**Outcome:** By the end of this chapter, you can recognize greedy-choice structure, solve classic scheduling, fractional knapsack, and Huffman coding problems, and explain why a greedy strategy is correct instead of just hoping it works.

---

## 1. Intuition First

This chapter matters because greedy algorithms are fast, elegant, and common, but they are also easy to misuse. A greedy solution is not "do something that feels good right now." It is "make a local choice that can be proved safe."

A simple real-world analogy is booking meeting rooms for as many short meetings as possible. If you always keep the room free as early as possible, later meetings have a better chance to fit. That is not luck. That is structure.

The core mental model is:

- define the local choice rule
- prove that some optimal solution can start with that choice
- repeat the same reasoning on the remaining smaller problem

The most common beginner confusion point is thinking that every optimization problem should have a greedy shortcut. Many do not. If the local choice blocks a better future, greedy fails and you usually need dynamic programming, backtracking, or another approach.

This chapter begins Part VI. The graph chapters already used safe greedy choices in algorithms like Dijkstra and Kruskal. Now the focus shifts from pattern recognition to proof-oriented thinking: when is the local move actually safe?

## 2. Core Concepts and Techniques

### Concept Cluster: Greedy-Choice Property
Key concepts in this block:
- 28.1 Greedy-choice property

#### Intuition

A problem has the greedy-choice property if making one best local choice can still lead to some globally optimal solution.

#### Why It Matters

Without this property, a greedy rule is only a heuristic.

#### How It Works

The usual workflow is:

- propose a local rule
- prove it is safe with an exchange argument, stays-ahead argument, or structural argument
- recurse or iterate on the remaining problem

#### Java Implementation Notes

- Greedy solutions often start with sorting.
- `Arrays.sort`, `Collections.sort`, and `PriorityQueue` are common tools.
- Keep the choice rule explicit in code.

#### Common Mistakes

- picking a local rule without proof
- confusing "works on my examples" with correctness
- sorting by the wrong key

#### Quick Example

For activity selection, choosing the activity with the earliest finishing time is safe because it leaves the most room for later activities.

#### Debugging Tip

Build a tiny counterexample by hand. If your local rule fails there, it is not a valid greedy strategy.

#### Advanced Note

Some problems look greedy but actually require dynamic programming because the future depends on more than one local choice.

### Concept Cluster: Activity Selection
Key concepts in this block:
- 28.2 Activity selection

#### Intuition

Choose the next compatible activity that finishes earliest.

#### Why It Matters

It is the classic proof-friendly greedy problem and the cleanest place to learn exchange arguments.

#### How It Works

Sort activities by end time. Scan left to right. Take an activity if its start time is compatible with the last chosen finish time.

#### Java Implementation Notes

- Represent activities as `(start, end)` pairs.
- Sort by `end`, then tie-break by `start` if needed.
- Track only the finish time of the last chosen activity.

#### Common Mistakes

- sorting by start time or duration instead of end time
- not clarifying whether touching intervals are allowed
- forgetting tie behavior

#### Quick Example

If activities are `(1, 3)`, `(2, 5)`, `(3, 4)`, choose `(1, 3)` and then `(3, 4)`.

#### Debugging Tip

If the result seems too small, print the sorted order and every accept or reject decision.

#### Advanced Note

This same earliest-finish idea reappears in many interval problems.

### Concept Cluster: Fractional Knapsack
Key concepts in this block:
- 28.3 Fractional knapsack

#### Intuition

When fractions are allowed, the best local choice is to take the item with the highest value density first.

#### Why It Matters

It is a standard example where greedy works for the fractional version but fails for the 0/1 version.

#### How It Works

Compute `value / weight` for each item, sort in descending order, and take as much as possible from each item until capacity is full.

#### Java Implementation Notes

- Use `double` for ratios and total value.
- Avoid integer division.
- Guard against zero-weight edge cases if the problem allows them.

#### Common Mistakes

- applying this greedy rule to 0/1 knapsack
- sorting by raw value instead of value density
- losing precision with integer division

#### Quick Example

If densities are `6.0`, `5.0`, and `4.0`, take the `6.0` item first even if it is not the heaviest or highest raw value.

#### Debugging Tip

Print `(value, weight, density)` after sorting. Wrong answers often come from the wrong sort key.

#### Advanced Note

Fractional knapsack works because the final partial item does not break the density argument.

### Concept Cluster: Interval Scheduling
Key concepts in this block:
- 28.4 Interval scheduling

#### Intuition

Intervals are activities with start and end points. The goal is usually to keep as many compatible intervals as possible or remove as few overlaps as possible.

#### Why It Matters

It generalizes activity selection language into the broader interval family.

#### How It Works

For the maximum-count version, the same earliest-finish greedy rule is usually the right choice. For other interval variants, the greedy key may change, so read the objective carefully.

#### Java Implementation Notes

- Sort intervals as objects or `int[]`.
- Be explicit about compatibility: `current.start >= lastEnd` versus `>`.
- Keep the rule and the objective aligned.

#### Common Mistakes

- reusing the same rule for a different interval objective without proof
- mixing closed-interval and half-open-interval assumptions
- counting overlap incorrectly

#### Quick Example

To remove the minimum number of overlapping intervals, keep the interval that ends earlier and discard the one that blocks more future room.

#### Debugging Tip

When interval answers are off by one, inspect whether equality at boundaries should be accepted.

#### Advanced Note

Not every interval problem is greedy. Weighted interval scheduling is a classic counterexample and needs dynamic programming.

### Concept Cluster: Huffman Coding
Key concepts in this block:
- 28.5 Huffman coding

#### Intuition

Repeatedly merge the two least frequent symbols so expensive code lengths are assigned to rare symbols, not common ones.

#### Why It Matters

It is a greedy algorithm on trees and one of the best examples of a greedy rule justified by structure rather than simple sorting.

#### How It Works

Insert all symbol frequencies into a min-heap. Repeatedly remove the two smallest, merge them into a new node, and push the merged node back.

#### Java Implementation Notes

- Use a `PriorityQueue<Node>`.
- A Huffman tree is a full binary tree.
- Assign `0` and `1` while traversing from root to leaves.

#### Common Mistakes

- forgetting the single-symbol edge case
- using a max-heap by accident
- assuming Huffman codes are unique

#### Quick Example

For frequencies `5, 9, 12, 13`, merge `5` and `9` first, then continue with the new combined weight.

#### Debugging Tip

Print each merge step. If the heap order is wrong once, the whole tree changes.

#### Advanced Note

Huffman coding is really the optimal merge pattern in disguise.

### Concept Cluster: Proving a Greedy Strategy
Key concepts in this block:
- 28.6 Proving a greedy strategy

#### Intuition

A greedy algorithm is complete only after the proof.

#### Why It Matters

Part VI expects stronger reasoning than "this pattern is common." You should be able to defend why the local rule is safe.

#### How It Works

Common proof styles:

- exchange argument: swap the first choice in an optimal solution with the greedy choice
- stays-ahead argument: show the greedy partial solution is never worse than any competitor at the same step
- cut or structure argument: show the greedy choice is forced by the problem structure

#### Java Implementation Notes

- Let the proof drive the implementation, not the other way around.
- Keep the state small and aligned with the proof invariant.
- Comments can name the invariant when the code is subtle.

#### Common Mistakes

- proving only the first choice and not the repeated step
- arguing from examples instead of structure
- using a proof style that does not match the problem

#### Quick Example

In activity selection, if an optimal solution starts with a later-finishing activity, you can exchange it with the earlier-finishing greedy activity without reducing the number of activities selected.

#### Debugging Tip

If you cannot state the invariant in one sentence, the greedy rule is probably not fully understood yet.

#### Advanced Note

When no clean greedy proof appears, that is often the signal to step back and try DP or backtracking.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Maximum Non-Overlapping Activities
#### Problem Statement

Given a list of activities as `[start, end]`, select the maximum number of pairwise non-overlapping activities.

#### Why This Example Matters

This is the foundational greedy scheduling problem. It also captures the core idea behind many interval scheduling variants.

#### Constraints or Assumptions

- activities are compatible if `next.start >= previous.end`
- intervals may be unsorted
- you only need one optimal selection

#### Brute-Force Approach

Enumerate every subset of activities, keep only compatible subsets, and return the largest one.

This is `O(2^n * n log n)` or worse, depending on how compatibility is checked.

#### Better Approach

Sort by finish time and greedily take the earliest-finishing compatible activity.

#### Why the Better Approach Works

The earliest-finishing activity leaves the most room for the remaining schedule. Any optimal solution can exchange its first activity for this one without reducing how many activities fit later.

#### Pragmatic Java Choice

Use:

- a small `Activity` class
- sorting by finish time
- a simple greedy scan

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

class ActivitySelectionExample {
    static final class Activity {
        final int start;
        final int finish;

        Activity(int start, int finish) {
            this.start = start;
            this.finish = finish;
        }
    }

    static List<Activity> selectMaximumActivities(int[][] intervals) {
        Activity[] activities = new Activity[intervals.length];
        for (int i = 0; i < intervals.length; i++) {
            activities[i] = new Activity(intervals[i][0], intervals[i][1]);
        }

        Arrays.sort(activities, Comparator
                .comparingInt((Activity activity) -> activity.finish)
                .thenComparingInt(activity -> activity.start));

        List<Activity> chosen = new ArrayList<>();
        int lastFinish = Integer.MIN_VALUE;

        for (Activity activity : activities) {
            if (activity.start >= lastFinish) {
                chosen.add(activity);
                lastFinish = activity.finish;
            }
        }

        return chosen;
    }
}
```

#### Dry Run

Activities:

- `[1, 3]`
- `[2, 5]`
- `[3, 4]`
- `[0, 7]`
- `[5, 7]`
- `[8, 9]`

Sorted by finish:

- `[1, 3]`, `[3, 4]`, `[2, 5]`, `[0, 7]`, `[5, 7]`, `[8, 9]`

Greedy picks:

- `[1, 3]`
- `[3, 4]`
- skip `[2, 5]`
- skip `[0, 7]`
- `[5, 7]`
- `[8, 9]`

#### Time and Space Complexity

Brute force:

- Time: exponential
- Space: subset bookkeeping dependent

Greedy:

- Time: `O(n log n)`
- Space: `O(n)` for the returned selection

#### Edge Cases

- empty input
- intervals that touch exactly at endpoints
- multiple optimal schedules
- many identical finish times

#### Common Mistakes

- sorting by start time
- treating endpoint equality inconsistently
- forgetting that the objective is maximum count, not maximum total duration

### Worked Example 2: Fractional Knapsack
#### Problem Statement

Given items with `[value, weight]` and a knapsack capacity, return the maximum total value when you may take fractional parts of items.

#### Why This Example Matters

It is the cleanest example of a problem where greedy is correct only because fractional splitting is allowed.

#### Constraints or Assumptions

- every item has positive weight
- partial items are allowed
- return the maximum total value as a `double`

#### Brute-Force Approach

Try every subset of full items and every possible choice of a final fractional item.

That is combinatorial and unnecessary.

#### Better Approach

Sort items by value density, `value / weight`, in descending order.

#### Why the Better Approach Works

If two items are still available, any solution that takes lower density mass before higher density mass can be improved by swapping that mass. So the density order is always safe.

#### Pragmatic Java Choice

Use:

- an `Item` class
- `Arrays.sort` with a density comparator
- `double` arithmetic

#### Java Solution

```java
import java.util.Arrays;
import java.util.Comparator;

class FractionalKnapsackExample {
    private static final class Item {
        final int value;
        final int weight;

        Item(int value, int weight) {
            this.value = value;
            this.weight = weight;
        }

        double density() {
            return (double) value / weight;
        }
    }

    static double maximumValue(int capacity, int[][] itemsArray) {
        Item[] items = new Item[itemsArray.length];
        for (int i = 0; i < itemsArray.length; i++) {
            items[i] = new Item(itemsArray[i][0], itemsArray[i][1]);
        }

        Arrays.sort(items, Comparator.comparingDouble(Item::density).reversed());

        double totalValue = 0.0;
        int remainingCapacity = capacity;

        for (Item item : items) {
            if (remainingCapacity == 0) {
                break;
            }

            int takeWeight = Math.min(remainingCapacity, item.weight);
            totalValue += takeWeight * item.density();
            remainingCapacity -= takeWeight;
        }

        return totalValue;
    }
}
```

#### Dry Run

Items:

- value `60`, weight `10`, density `6.0`
- value `100`, weight `20`, density `5.0`
- value `120`, weight `30`, density `4.0`

Capacity `50`

Take:

- all of `(60, 10)` -> value `60`
- all of `(100, 20)` -> total `160`
- `20/30` of `(120, 30)` -> add `80`

Final value: `240.0`

#### Time and Space Complexity

Brute force:

- Time: exponential
- Space: subset tracking dependent

Greedy:

- Time: `O(n log n)`
- Space: `O(n)`

#### Edge Cases

- capacity `0`
- one item heavier than the whole capacity
- many items with the same density
- precision formatting in output

#### Common Mistakes

- using integer division for density
- applying the same rule to 0/1 knapsack
- sorting by value instead of density

### Worked Example 3: Huffman Coding
#### Problem Statement

Given symbols and frequencies, build one optimal prefix-free binary code.

#### Why This Example Matters

This is a greedy algorithm on tree construction, not just sorting, and it is a strong test of proof-based thinking.

#### Constraints or Assumptions

- every symbol has positive frequency
- any optimal prefix-free code is acceptable
- if there is one symbol, give it code `"0"`

#### Brute-Force Approach

Enumerate all full binary tree shapes and all leaf placements, compute weighted code length for each, and keep the best one.

That is completely impractical.

#### Better Approach

Use a min-heap and repeatedly merge the two least frequent nodes.

#### Why the Better Approach Works

The two least frequent symbols can be placed deepest together in some optimal tree. Merging them reduces the problem to a smaller one of the same form.

#### Pragmatic Java Choice

Use:

- a `PriorityQueue<Node>`
- a tree node with left and right children
- a DFS to generate bit strings

#### Java Solution

```java
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

class HuffmanCodingExample {
    private static final class Node implements Comparable<Node> {
        final char symbol;
        final int frequency;
        final Node left;
        final Node right;

        Node(char symbol, int frequency, Node left, Node right) {
            this.symbol = symbol;
            this.frequency = frequency;
            this.left = left;
            this.right = right;
        }

        boolean isLeaf() {
            return left == null && right == null;
        }

        @Override
        public int compareTo(Node other) {
            return Integer.compare(this.frequency, other.frequency);
        }
    }

    static Map<Character, String> buildCodes(char[] symbols, int[] frequencies) {
        PriorityQueue<Node> minHeap = new PriorityQueue<>();
        for (int i = 0; i < symbols.length; i++) {
            minHeap.offer(new Node(symbols[i], frequencies[i], null, null));
        }

        if (minHeap.isEmpty()) {
            return new HashMap<>();
        }

        while (minHeap.size() > 1) {
            Node first = minHeap.poll();
            Node second = minHeap.poll();
            minHeap.offer(new Node('\0', first.frequency + second.frequency, first, second));
        }

        Node root = minHeap.poll();
        Map<Character, String> codes = new HashMap<>();
        buildCodes(root, "", codes);
        return codes;
    }

    private static void buildCodes(Node node, String prefix, Map<Character, String> codes) {
        if (node.isLeaf()) {
            codes.put(node.symbol, prefix.isEmpty() ? "0" : prefix);
            return;
        }

        buildCodes(node.left, prefix + "0", codes);
        buildCodes(node.right, prefix + "1", codes);
    }
}
```

#### Dry Run

Frequencies:

- `a: 5`
- `b: 9`
- `c: 12`
- `d: 13`
- `e: 16`
- `f: 45`

Merge order begins:

- `5 + 9 = 14`
- `12 + 13 = 25`
- `14 + 16 = 30`
- `25 + 30 = 55`
- `45 + 55 = 100`

Then DFS assigns shorter codes to more frequent symbols.

#### Time and Space Complexity

Brute force:

- Time: super-exponential in practice
- Space: tree enumeration dependent

Huffman:

- Time: `O(n log n)`
- Space: `O(n)`

#### Edge Cases

- one symbol only
- repeated equal frequencies
- many symbols with very small frequencies
- different valid optimal code assignments

#### Common Mistakes

- using a max-heap
- forgetting the one-symbol case
- expecting a unique code assignment

## 4. Complexity and Decision Guide

Main trade-offs in this chapter:

- greedy scheduling by sorting: usually `O(n log n)`
- fractional knapsack by density sorting: `O(n log n)`
- Huffman coding with a heap: `O(n log n)`
- brute-force baselines: typically exponential or structurally infeasible

When to choose greedy:

- the problem has a clean local-choice rule
- you can write a short proof that the rule is safe
- the remaining problem after the local choice has the same structure

Recognition signals:

- "maximize count of compatible intervals" suggests earliest-finish greedy
- "fractional take is allowed" suggests density-based greedy
- "repeatedly combine the two lightest or cheapest pieces" suggests a min-heap greedy pattern
- "prefix-free code with frequencies" suggests Huffman coding

Signals not to force this technique:

- 0/1 knapsack is not solved by fractional knapsack logic
- weighted interval scheduling is not solved by plain activity selection
- if the best future depends on multiple past choices, greedy may fail
- if you cannot justify the local rule, stop and reassess

A practical rule:

- greedy first asks for a proof
- if the proof does not come, do not pretend the pattern still fits

## 5. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- sorting by the wrong key
- mixing endpoint conventions in interval problems
- using integer division in density calculations
- using the wrong heap direction in Huffman coding
- applying a greedy rule to a nearby but different objective

Boundary handling:

- empty activity list should return an empty selection
- equal interval endpoints need a clear compatibility rule
- capacity `0` in knapsack should return value `0`
- one-symbol Huffman input still needs a valid code

Short debugging checklist:

- verify the objective before choosing the greedy key
- verify the data is sorted by the intended field
- verify each accepted choice preserves the invariant
- test a tiny counterexample by hand
- for Huffman, print each heap merge step
- for interval problems, test boundary equality cases

## 6. Practice Problems

### Easy

- Title: Maximum Number of Compatible Meetings. One-line prompt: select the most non-overlapping intervals from a meeting list. Expected pattern or core idea: earliest-finish-time greedy.
- Title: Non-Overlapping Intervals. One-line prompt: remove the minimum number of intervals so the rest do not overlap. Expected pattern or core idea: interval scheduling greedy.
- Title: Minimum Number of Arrows to Burst Balloons. One-line prompt: use the fewest points to hit all overlapping balloon intervals. Expected pattern or core idea: interval sorting and greedy placement.

### Medium

- Title: Fractional Cargo Loading. One-line prompt: maximize shipment value when partial crates are allowed. Expected pattern or core idea: density-based greedy.
- Title: Optimal Merge Pattern. One-line prompt: repeatedly merge files at minimum total cost. Expected pattern or core idea: min-heap greedy similar to Huffman.
- Title: Partition Labels. One-line prompt: split a string into the most partitions so letters do not cross partitions. Expected pattern or core idea: greedy interval closure.

### Hard

- Title: Huffman Code Construction. One-line prompt: build an optimal prefix-free code from symbol frequencies. Expected pattern or core idea: heap-based greedy with tree merges.
- Title: Job Sequencing with Deadlines. One-line prompt: choose profitable jobs under slot deadlines. Expected pattern or core idea: greedy ordering plus data structure support.
- Title: Prove or Reject the Greedy Rule. One-line prompt: decide whether a proposed local-choice rule is correct and justify the answer. Expected pattern or core idea: exchange argument or counterexample construction.

## 7. Short Recap

The core idea of this chapter is that greedy algorithms work only when a local choice can be proved safe.

The most important optimization insight is that the correct sort key or heap rule often turns an exponential search into an `O(n log n)` routine.

The most important implementation warning is not technical but conceptual: a greedy rule without a proof is not finished.

This chapter prepares the next chapter by moving from one-step-safe choices to full decision-tree exploration with backtracking.

## 8. Coverage Check

- [x] 28.1 Greedy-choice property
- [x] 28.2 Activity selection
- [x] 28.3 Fractional knapsack
- [x] 28.4 Interval scheduling
- [x] 28.5 Huffman coding
- [x] 28.6 Proving a greedy strategy

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 29: Backtracking
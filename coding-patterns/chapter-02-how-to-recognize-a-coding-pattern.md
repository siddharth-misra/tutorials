# 2: How to Recognize a Coding Pattern

## 0. Introduction

This chapter sits in Part I - Pattern Foundations and Linear Thinking (Weeks 1-4), with the roadmap treating it as beginner work. Its goal is to learn a repeatable method for moving from a raw problem statement to a small shortlist of plausible patterns instead of guessing an algorithm from memory. This chapter directly supports the Part I outcome of moving from raw problem statements to a plausible pattern shortlist before writing code.

Read it as a bridge in the larger sequence. Chapter 1 built the Java toolkit. This chapter uses that toolkit to decide what kind of solution shape a problem is asking for. Chapter 3 turns pattern recognition into concrete families built on hashing and accumulation. Start this chapter after you are comfortable with basic Java arrays, strings, loops, maps, sets, and simple complexity comparison from Chapter 1. The main themes here are Definition and core idea of a pattern, Why patterns exist in algorithmic problem solving, Recognition signals and common problem clues, Reading input conditions and output goals, Picking a brute-force baseline before optimizing, and When not to force a familiar pattern.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to define what a coding pattern is, extract useful clues from input and constraints, build a brute-force baseline, identify the bottleneck, and reject patterns that do not match the problem's structure.

## 1. Intuition First

This chapter matters because most wrong solutions start with a wrong diagnosis. Learners often jump from the problem statement directly to a favorite technique: a hash map, a sliding window, binary search, or dynamic programming. Sometimes they get lucky. Most of the time they waste effort because they never stopped to ask what the problem structure actually says.

The simplest analogy is medical triage. A good doctor does not prescribe treatment from memory alone. They first read the symptoms, rule out impossible causes, and identify what kind of condition the evidence supports. Pattern recognition in algorithms works the same way. The problem statement gives symptoms. The pattern is the diagnosis. The code is the treatment.

The core mental model is:

1. Read the raw problem as data shape plus required operation.
2. Build the simplest correct baseline.
3. Identify the bottleneck in that baseline.
4. Match the bottleneck and the clues to a small set of patterns.
5. Check the preconditions before committing to one pattern.

Recognition signals come from repeated clues in problem statements:

- repeated lookup or duplicate detection
- contiguous range questions
- sorted input or order constraints
- repeated best element selection
- graph-like movement or dependencies
- many queries over the same immutable data

The most common beginner confusion point is thinking that a pattern is the same thing as a finished solution. It is not. A pattern is a reusable solution shape. You still need to map the problem's state, invariants, and boundary cases into that shape.

In the larger roadmap, this chapter is the bridge between Java syntax and algorithm structure. It teaches how to recognize a solution direction before later chapters teach the full mechanics of each pattern family.

## 2. Learning Path and Recognition Checklist

The learning path in this chapter is intentionally diagnostic.

First, you define what a pattern is and why pattern families keep appearing in interview and contest problems. Next, you learn how to read clues from the statement itself: input size, sortedness, contiguity, uniqueness, repeated queries, and output form. Then you learn to build a brute-force baseline, because a pattern only becomes meaningful when it removes a specific bottleneck. Finally, you learn when not to force a familiar pattern onto the wrong problem.

Recognition checklist for this chapter:

- What are the input objects: array, string, grid, intervals, tree, graph, stream?
- What is the required output: count, boolean, index, transformed sequence, optimal value, or path?
- Is the question about contiguous data, arbitrary pairs, or global order?
- Is the input sorted, partially ordered, or completely unordered?
- Is there one query or many queries?
- Can a direct brute-force baseline be stated in one or two sentences?
- What exact operation makes the brute-force solution slow?
- Does the candidate pattern require a precondition such as sorted input, monotonicity, or immutability?

The brute-force baseline should come first because it tells you what the optimized solution is fixing. If the brute-force method is already linear and simple, forcing a more advanced pattern often makes the solution worse.

Mastery by the end of the chapter looks like this: you can read a fresh problem, describe a baseline, explain the runtime bottleneck, produce a shortlist of candidate patterns, and justify why one fits better than its neighbors.

Do not force a pattern when the clues do not support it. A sliding window is not for arbitrary subsequences. Two pointers do not help on unsorted data unless you add structure first. Prefix sums do not help when the data changes after every query unless you use a more advanced update structure.

## 3. Official Subtopic Coverage

### Concept Cluster: What a Pattern Really Is
Official subtopics covered:
- 2.1 Definition and core idea of a pattern
- 2.2 Why patterns exist in algorithmic problem solving

#### Definition or Framing
A coding pattern is a reusable solution structure that appears across many problems with slightly different stories. The surface language changes, but the underlying operation is the same. For example, duplicate detection in arrays, repeated membership checks in strings, and complement lookup in pair-sum problems all point toward hash-based state.

Patterns exist because algorithmic problems repeat a small number of core tasks: scanning, accumulating, ordering, searching, traversing, splitting choices, and caching subproblems. Once you learn the reusable structure behind those tasks, you can transfer it between problems instead of starting from zero every time.

#### Recognition Signals
- repeated operation on a growing prefix of data
- same type of condition applied at every position
- output depends on local neighborhood, global frequency, or accumulated history
- the same runtime bottleneck appears in many problem statements

#### Brute-Force Baseline
Without pattern thinking, a learner often writes a direct simulation or nested loop version for every problem. That is a useful starting point, but it becomes expensive when the same work is repeated from scratch at each step.

#### Optimized Pattern Idea
The optimized idea is to reuse structure. A hash-based pattern reuses past lookups. A prefix pattern reuses earlier accumulation. A two-pointer pattern reuses sorted order instead of restarting scans. The pattern saves time because it preserves information between steps.

#### Core Workflow / Decision Rules
Ask two questions:

1. What work is being repeated in the baseline?
2. What information could be stored or reused so that repeated work is avoided?

The answer usually points to the pattern family.

#### Java Implementation Notes
- A `HashMap` or `HashSet` represents remembered history.
- A prefix array represents remembered accumulation.
- Pointer variables represent remembered position in ordered data.
- A queue or stack represents remembered frontier or pending work.

#### Quick Dry Run
Suppose you need to know whether an array contains any duplicate value.

- Baseline: for each element, compare it with all later elements.
- Reused structure: keep a set of values seen so far.
- Pattern signal: the problem is asking repeated membership checks on a growing prefix.

That is the core idea of a pattern: remember the right thing so the same work is not repeated.

#### Common Mistakes
- Treating a pattern as a memorized code template instead of a reusable idea
- Copying a known solution before identifying the actual bottleneck
- Choosing the most advanced pattern you know rather than the simplest fitting one

#### Debugging Strategy
When your chosen pattern feels shaky, stop and write the one-sentence brute-force baseline. If you cannot name what repeated work the pattern removes, the pattern choice is probably weak.

#### Comparison with Similar Pattern
Patterns are not the same as recipes. A recipe says, "always do these steps." A pattern says, "use this structure when these signals and preconditions are present."

#### Advanced Note
Later chapters will show that advanced techniques are usually compositions of simpler patterns, not completely new forms of reasoning.

### Concept Cluster: Reading the Statement for Clues
Official subtopics covered:
- 2.3 Recognition signals and common problem clues
- 2.4 Reading input conditions and output goals

#### Definition or Framing
Pattern recognition begins before coding. The statement usually tells you the shape of the data, the legal operations, and the kind of answer you need. Those details often narrow the solution space more than the story text does.

#### Recognition Signals
Important clues to read explicitly:

- sorted input or monotonic behavior
- contiguous subarray or substring wording
- pair, triplet, or window language
- repeated queries on the same data
- graph movement, adjacency, or dependency language
- minimum or maximum over many candidates
- small constraints on value range or state space

#### Brute-Force Baseline
The baseline at this stage is not code yet. It is a direct interpretation of the statement.

- pair problem: try every pair
- range sum problem: sum every requested range directly
- path problem: try all reachable states with a raw traversal

That baseline helps you see whether the input conditions permit something better.

#### Optimized Pattern Idea
The optimized idea comes from combining the input conditions with the output goal.

- sorted array plus pair target often suggests two pointers
- many range queries over immutable data often suggests prefix sums
- repeated membership or complement lookup often suggests hashing
- shortest steps on an unweighted grid often suggests breadth-first search

#### Core Workflow / Decision Rules
Read the problem in this order:

1. Data shape
2. Allowed operations
3. Output type
4. Constraint size
5. Hidden preconditions such as sorted order or immutability

Each answer removes patterns that do not fit.

#### Java Implementation Notes
- Translate the constraint size into a rough time budget before coding.
- If `n` can be `10^5`, an $O(n^2)$ solution is usually not viable.
- If queries are numerous, consider a preprocessing array or map.
- If the output asks for indices, preserve positions rather than only values.

#### Quick Dry Run
Problem clue: "Given a sorted array, find two numbers whose sum is target."

- Data shape: array
- Condition: sorted
- Output: one pair
- Baseline: try every pair
- Better clue: sorted order lets one pointer move left and the other right without restarting the search

The sorted condition is not decoration. It is the clue that makes two pointers possible.

#### Common Mistakes
- Ignoring the phrase "contiguous"
- Ignoring whether duplicates are allowed
- Throwing away index information when the answer needs original positions
- Reading only the sample input and not the full constraint range

#### Debugging Strategy
Underline or list the structural clues before coding. If the finished solution never uses an important clue from the statement, that clue was probably missed or misunderstood.

#### Comparison with Similar Pattern
Input clues are more reliable than problem theme. Two different story settings can use the same pattern, while two array problems can require completely different approaches.

#### Advanced Note
As problems get harder, the decisive clue is often a precondition such as monotonicity, acyclicity, or immutable queries rather than the data type itself.

### Concept Cluster: Baselines, Bottlenecks, and Pattern Restraint
Official subtopics covered:
- 2.5 Picking a brute-force baseline before optimizing
- 2.6 When not to force a familiar pattern

#### Definition or Framing
A brute-force baseline is the simplest clearly correct method. It gives you a proof anchor, a test oracle for small cases, and a way to identify the exact bottleneck that an optimized pattern must remove.

#### Recognition Signals
Build a baseline first when:

- the pattern is not immediately obvious
- several patterns seem plausible
- you want a small implementation to test against
- the problem might already be solvable within the constraints

#### Brute-Force Baseline
Typical beginner baselines include:

- nested loops for pairs or ranges
- recomputing sums or counts from scratch
- full rescans after every update
- recursive exploration without pruning or memoization

#### Optimized Pattern Idea
Only optimize after naming the repeated cost. Examples:

- repeated range sum work -> prefix sums
- repeated complement search -> hash lookup
- repeated comparison from both ends of sorted data -> two pointers
- repeated frontier expansion with shortest unweighted steps -> BFS

#### Core Workflow / Decision Rules
Use this decision sequence:

1. State a correct baseline.
2. Write its complexity.
3. Name the exact repeated work.
4. Choose a pattern that removes that repeated work.
5. Confirm that the problem satisfies the pattern's preconditions.

#### Java Implementation Notes
- Keep the baseline version in your notes or scratch file for debugging.
- For tiny custom tests, compare the optimized result against the baseline result.
- If the optimized code is complex, preserve variables that map clearly to the baseline meaning.

#### Quick Dry Run
Suppose a problem asks for many sum queries over an immutable array.

- Baseline: for each query, loop from `left` to `right` and sum the range.
- Bottleneck: repeated addition over overlapping ranges.
- Better idea: store prefix sums once and answer each query with subtraction.

The optimization is justified because it attacks the repeated work directly.

#### Common Mistakes
- Starting with an optimized pattern and then forcing the input to fit it
- Forgetting to verify the pattern's preconditions
- Replacing a simple linear solution with a harder linear solution that offers no real gain
- Optimizing a part of the solution that is not the bottleneck

#### Debugging Strategy
If the optimized code fails, run both the baseline and optimized versions on tiny cases. The first mismatch tells you whether the issue is the pattern mapping, the invariant, or an edge case.

#### Comparison with Similar Pattern
There is a difference between "knowing a pattern" and "knowing when not to use it." That restraint is what makes pattern recognition reliable instead of mechanical.

#### Advanced Note
In harder chapters, several patterns may compose cleanly, but each one should still be justified against a visible bottleneck.

## 4. Pattern Template, State Model, or Core Workflow

The canonical workflow for pattern recognition is short enough to memorize and strict enough to prevent random guessing.

1. Name the data shape.
   - array, string, intervals, grid, tree, graph, stream, or query set
2. Name the output type.
   - existence, count, index, value, path, or transformed structure
3. State the simplest correct baseline.
   - usually nested loops, direct simulation, or plain traversal
4. Write the baseline cost.
   - time and space in big-O terms
5. Name the repeated work.
   - repeated lookup, repeated sum, repeated scan, repeated state expansion
6. Extract the decisive clues.
   - sortedness, contiguity, immutability, adjacency, monotonicity, value range
7. Match one or two candidate patterns.
8. Check preconditions before implementation.

Important decision rules:

- If the problem asks about contiguous ranges, think about windows or prefixes before arbitrary subset methods.
- If the problem asks repeated membership or complement questions, think about hashing before nested loops.
- If the input is sorted and you need a pair or interval-style scan, think about pointer movement before hashing.
- If the data is immutable and query-heavy, think about preprocessing.
- If no pattern clearly improves the baseline, keep the baseline.

Safety rules that keep the workflow correct:

- never skip the baseline step
- never choose a pattern without naming the clue that supports it
- never ignore the output form when selecting data structures
- never optimize away index information if the answer needs indices

What usually breaks first is not the final code. It is the early diagnosis. A wrong diagnosis leads to the wrong invariant, wrong data structure, and wrong edge-case handling.

Adapt the workflow when the problem is obviously hybrid, but do not skip any stage. Even hybrid solutions start with data shape, baseline, bottleneck, and preconditions.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Two Sum as a Recognition Exercise
#### Problem Statement
Given an integer array `nums` and an integer `target`, return the indices of two numbers such that they add up to `target`.

#### Why This Example Matters
This is one of the clearest examples of pattern recognition from a brute-force pair search to a hash-based lookup pattern.

#### Input and Constraints
- `2 <= nums.length <= 10^5`
- values can be negative
- exactly one valid answer exists

#### Recognition Signals
- pair search over an unsorted array
- answer requires original indices
- repeated complement lookup: for each number, ask whether `target - number` has already appeared

#### Brute-Force Approach
Try every pair of indices `(i, j)` with `i < j` and return the first pair whose values sum to `target`.

#### Better Pattern-Based Approach
Store each visited value in a hash map from number to index. For each current value, check whether its complement has already been seen.

#### Why the Pattern Fits
The bottleneck in the baseline is repeated pair scanning. A map turns the question "have I already seen the complement?" into constant-time expected lookup.

#### Invariant or State Transition
Before processing index `i`, the map contains every value from indices `0` to `i - 1`, paired with its index. If the complement exists in the map, the answer is found.

#### Pragmatic Java Choice
Use `HashMap<Integer, Integer>` because the output needs original indices, not just existence.

#### Dry Run Before Code
For `nums = [2, 7, 11, 15]` and `target = 9`:

- index `0`, value `2`, complement `7`, map is empty
- store `2 -> 0`
- index `1`, value `7`, complement `2`, map contains `2 -> 0`
- answer is `[0, 1]`

#### Java Solution
```java
import java.util.HashMap;
import java.util.Map;

public class TwoSumRecognition {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> indexByValue = new HashMap<>();

        for (int index = 0; index < nums.length; index++) {
            int value = nums[index];
            int complement = target - value;

            if (indexByValue.containsKey(complement)) {
                return new int[] {indexByValue.get(complement), index};
            }

            indexByValue.put(value, index);
        }

        throw new IllegalArgumentException("Input guarantees one valid answer");
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n^2)$ time, $O(1)$ extra space
- Hash lookup pattern: $O(n)$ expected time, $O(n)$ extra space

#### Edge Cases
- duplicate values, such as `[3, 3]`
- negative numbers
- answer requiring two different indices rather than using the same element twice

#### Common Mistakes
- inserting the current value before checking the complement, which can incorrectly reuse the same index
- storing only a boolean instead of the needed index
- sorting the array and losing original positions

### Worked Example 2: Range Sum Query on an Immutable Array
#### Problem Statement
Given an integer array `nums`, answer many queries of the form: return the sum of values from index `left` to index `right`, inclusive.

#### Why This Example Matters
This example shows how to recognize preprocessing value from the clue "many queries over the same immutable data."

#### Input and Constraints
- array length can be large
- many queries may be asked
- the array does not change after construction

#### Recognition Signals
- repeated range queries
- contiguous segments
- immutable input

#### Brute-Force Approach
For every query, loop from `left` to `right` and sum the values directly.

#### Better Pattern-Based Approach
Precompute a prefix sum array where each entry stores the total up to that position. Then answer each query with one subtraction.

#### Why the Pattern Fits
The baseline repeats almost the same addition work across overlapping ranges. Prefix sums reuse that accumulation.

#### Invariant or State Transition
`prefix[i]` stores the sum of the first `i` elements. The sum of `nums[left..right]` is `prefix[right + 1] - prefix[left]`.

#### Pragmatic Java Choice
Store a `long[]` prefix array if overflow is possible. The interface can still return `long` or cast safely if constraints allow `int`.

#### Dry Run Before Code
For `nums = [5, -2, 4, 7]`:

- prefix becomes `[0, 5, 3, 7, 14]`
- query `(1, 3)` gives `prefix[4] - prefix[1] = 14 - 5 = 9`

#### Java Solution
```java
public class RangeSumQueryImmutable {
    private final long[] prefix;

    public RangeSumQueryImmutable(int[] nums) {
        prefix = new long[nums.length + 1];
        for (int index = 0; index < nums.length; index++) {
            prefix[index + 1] = prefix[index] + nums[index];
        }
    }

    public long sumRange(int left, int right) {
        if (left < 0 || right >= prefix.length - 1 || left > right) {
            throw new IllegalArgumentException("Invalid query bounds");
        }
        return prefix[right + 1] - prefix[left];
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n)$ per query, $O(1)$ extra space
- Prefix sums: $O(n)$ preprocessing, $O(1)$ per query, $O(n)$ extra space

#### Edge Cases
- single-element ranges
- negative values
- empty query set after construction
- large sums that exceed `int`

#### Common Mistakes
- off-by-one errors in the prefix array
- forgetting that the query is inclusive on both ends
- using prefix sums when the array changes after every query

### Worked Example 3: Pair Sum in a Sorted Array
#### Problem Statement
Given a sorted integer array `numbers` and a target value, return the 1-based indices of two numbers whose sum equals the target.

#### Why This Example Matters
This problem demonstrates how a single clue, sorted input, can change the right pattern choice completely.

#### Input and Constraints
- `2 <= numbers.length <= 10^5`
- array is sorted in non-decreasing order
- exactly one valid answer exists

#### Recognition Signals
- sorted array
- pair condition
- only one pass across the ordered data is needed

#### Brute-Force Approach
Try every pair of positions until the target sum is found.

#### Better Pattern-Based Approach
Use two pointers, one at the left end and one at the right end. Move the left pointer rightward when the sum is too small, and move the right pointer leftward when the sum is too large.

#### Why the Pattern Fits
Sorted order makes each pointer move informative. If the sum is too small, increasing the left value is the only direction that can help. If the sum is too large, decreasing the right value is the only direction that can help.

#### Invariant or State Transition
At every step, the valid answer, if not already found, must lie within the current pointer range `[left, right]`. Pointer movement removes only impossible pairs.

#### Pragmatic Java Choice
Two integer indices and a simple loop are enough. No extra data structure is required.

#### Dry Run Before Code
For `numbers = [2, 3, 4, 8, 11]` and `target = 12`:

- left `0`, right `4`, sum `13`, too large, move right leftward
- left `0`, right `3`, sum `10`, too small, move left rightward
- left `1`, right `3`, sum `11`, too small, move left rightward
- left `2`, right `3`, sum `12`, found answer

#### Java Solution
```java
public class SortedPairSum {
    public int[] twoSum(int[] numbers, int target) {
        int left = 0;
        int right = numbers.length - 1;

        while (left < right) {
            int sum = numbers[left] + numbers[right];

            if (sum == target) {
                return new int[] {left + 1, right + 1};
            }

            if (sum < target) {
                left++;
            } else {
                right--;
            }
        }

        throw new IllegalArgumentException("Input guarantees one valid answer");
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n^2)$ time, $O(1)$ extra space
- Two pointers: $O(n)$ time, $O(1)$ extra space

#### Edge Cases
- duplicate values
- negative numbers
- smallest and largest numbers forming the answer

#### Common Mistakes
- using this pattern on unsorted input without sorting or preserving index requirements
- moving both pointers at once
- returning zero-based indices when the problem wants one-based indices

## 6. Complexity and Comparison Guide

This chapter is about choosing the right family, so the main comparison is between a direct baseline and a clue-matched pattern.

- nested loops for pair search are usually $O(n^2)$, while hash lookup or two pointers can reduce that to $O(n)$ when the right clue is present
- repeated range summation is $O(n)$ per query, while prefix sums convert it to $O(1)$ per query after $O(n)$ preprocessing
- hashing spends extra space to speed up lookup, while two pointers use sorted order to stay in constant extra space

Comparison with similar patterns:

- Hash lookup versus two pointers: use hashing on unsorted input when you need direct complement lookup; use two pointers when the order is already sorted or can be sorted without breaking the required output.
- Prefix sums versus sliding window: use prefix sums for many immutable range queries or when negative values make window growth unreliable; use sliding windows when a contiguous range can be adjusted incrementally under the right conditions.
- Baseline simulation versus specialized pattern: keep the baseline if the constraints are small or if the optimized pattern does not remove a real bottleneck.

Decision criteria:

- choose hashing when the dominant question is membership, complement, or frequency
- choose prefix accumulation when overlapping range work repeats
- choose two pointers when ordered data makes pointer movement logically safe

Signals that you should not force a technique:

- no sortedness for a two-pointer sum scan
- many updates on data that a plain prefix array assumes is static
- arbitrary subsequences when a contiguous-range method is being considered

What breaks when the preconditions fail is usually the invariant. The code may still run, but the pointer moves, prefix query logic, or lookup assumptions no longer eliminate only impossible states.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs in this chapter:

- skipping the baseline and choosing a pattern from habit
- ignoring whether the answer needs indices, values, or counts
- missing the word "contiguous" and choosing a non-contiguous technique
- forgetting a pattern's hidden precondition, such as sorted input or immutable data
- measuring the wrong bottleneck and optimizing the wrong part of the algorithm

Off-by-one and boundary risks:

- prefix arrays almost always need one extra slot
- pair scans must avoid reusing the same element twice
- query endpoints may be inclusive or exclusive

Null, empty input, and boundary-condition handling:

- handle empty arrays explicitly when the API allows them
- reject invalid query bounds
- think about duplicate values and repeated keys

Short debugging checklist:

1. Can I state the brute-force baseline in one sentence?
2. What exact repeated work does the pattern remove?
3. What precondition makes the pattern valid?
4. Does my state preserve everything the output requires, such as indices?
5. On a tiny custom test, does the optimized result match the baseline result?

Quick counterexample that defeats a common wrong solution:

Trying two pointers for pair sum on an unsorted array fails because pointer movement no longer removes impossible pairs safely. On `[8, 1, 6, 3]` with target `9`, moving pointers based on current sum has no logical guarantee because the values are not ordered.

## 8. Practice Problems

### Easy
- Two Sum: Return indices of two numbers that add to a target. Expected pattern or core idea: hash map lookup.
- Contains Duplicate: Decide whether any value appears at least twice. Expected pattern or core idea: hash set membership.
- Range Sum Query - Immutable: Answer many fixed-array range sum queries. Expected pattern or core idea: prefix sum preprocessing.

### Medium
- Two Sum II - Input Array Is Sorted: Return a target pair from sorted input. Expected pattern or core idea: two pointers.
- Subarray Sum Equals K: Count contiguous subarrays with a target sum. Expected pattern or core idea: prefix sum plus hashing.
- Longest Substring Without Repeating Characters: Find the longest valid contiguous segment under a uniqueness rule. Expected pattern or core idea: sliding window recognition.

### Hard
- Count of Range Sum: Count ranges whose sums fall within bounds. Expected pattern or core idea: prefix accumulation plus ordered structure.
- Trapping Rain Water: Compute trapped water from elevation bars. Expected pattern or core idea: two-pointer reasoning.
- Minimum Window Substring: Find the smallest substring satisfying character needs. Expected pattern or core idea: shrinking window with state tracking.

## 9. Short Recap

The core idea of this chapter is that pattern choice should come from diagnosis, not memory alone. The strongest recognition clue is the combination of data shape, output goal, and the repeated work inside the brute-force baseline. The most important optimization insight is to attack the actual bottleneck instead of jumping to a favorite technique. The biggest implementation warning is that a pattern without its preconditions becomes unreliable even if the code looks familiar. This chapter prepares the next one by turning clue spotting into concrete hash and prefix-based solution families.

## 10. Coverage Check

- 2.1 Definition and core idea of a pattern - Covered
- 2.2 Why patterns exist in algorithmic problem solving - Covered
- 2.3 Recognition signals and common problem clues - Covered
- 2.4 Reading input conditions and output goals - Covered
- 2.5 Picking a brute-force baseline before optimizing - Covered
- 2.6 When not to force a familiar pattern - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 3: Hashing and Accumulation Patterns
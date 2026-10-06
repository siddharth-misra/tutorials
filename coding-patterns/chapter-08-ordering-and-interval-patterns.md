# 8: Ordering and Interval Patterns

## 0. Introduction

This chapter sits in Part II - Simulation, Ordering, and Search Space Control (Weeks 5-9), with the roadmap treating it as intermediate work. Its goal is to learn how sorting and placement-by-index reveal hidden structure in interval problems and missing-value problems, so overlap handling and index recovery become systematic instead of ad hoc. This chapter directly supports the Part II outcome of recognizing when state should be modeled by sorted order and using invariants to keep interval normalization correct.

Read it as a bridge in the larger sequence. Chapter 7 used ordered search spaces to cut away impossible halves. This chapter uses ordering to normalize overlaps, group related intervals, and place values where they logically belong. Chapter 9 turns ordering choices into broader selection strategies involving heaps, greedy decisions, meet-in-the-middle splits, and randomized selection. Start this chapter after you are comfortable with Chapters 1 through 7, especially sorting, boundary reasoning, and careful loop invariants. The main themes here are Merge Intervals Pattern, Cyclic Sort Pattern, Sorting by endpoints and overlap normalization, Placement-by-index problems and missing-value tricks, Interval edge cases with touching and nested ranges, and When sorting is the real hidden pattern.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to merge and normalize intervals, apply cyclic sort to placement-by-index problems, reason about touching and nested interval edge cases, and recognize when sorting is the real pattern even if the problem statement never says so directly.

## 1. Intuition First

This chapter matters because many problems look chaotic only because the relevant items are still in the wrong order. Intervals appear to overlap unpredictably until you sort by endpoint. Missing numbers seem hard to identify until each value is moved toward its natural index. Once the structure is normalized, the algorithm becomes much simpler.

The simplest analogy is organizing papers on a desk. If appointment cards are scattered randomly, it is hard to see which appointments overlap. If numbered forms are out of place, it is hard to spot what is missing. Sorting by time or placing forms into their numbered slots makes the missing or overlapping structure visible.

The core mental model is:

- sort intervals so neighbors carry useful overlap information
- normalize overlap by carrying a current merged interval forward
- place values at their natural indices when the value range supports it
- let incorrect placement expose missing or duplicated values

Recognition signals for this chapter:

- intervals with start and end times
- need to merge, insert, intersect, or detect overlaps
- numbers expected to fall in a limited index-aligned range such as `0..n` or `1..n`
- missing value, duplicate value, or misplaced value questions
- a brute-force solution becomes simpler after sorting even if sorting is not mentioned explicitly

The most common beginner confusion point is treating sorting as a preprocessing detail rather than the main pattern. In this chapter, sorting is often the whole reason the linear pass afterward becomes correct.

In the larger roadmap, this chapter finishes Part II's emphasis on ordering decisions and bounded structure. It also builds the habit of asking whether a problem becomes simpler once the data is normalized first.

## 2. Learning Path and Recognition Checklist

The chapter starts with merge intervals because it is the clearest example of sorting exposing local structure. It then turns to cyclic sort, where values are repeatedly placed into their intended indices until the remaining mismatches reveal missing or duplicated information. After that, it unifies the two ideas by showing that both patterns depend on normalization: intervals are normalized by endpoint order, and arrays are normalized by natural value positions.

Recognition checklist for this chapter:

- Are there intervals whose relative order matters more than their original input order?
- Once sorted by start time or end time, can each item be handled by comparing it only with the current normalized state?
- Do values belong naturally to indices like `value - 1` or `value`?
- Are all values expected to come from a small contiguous range such as `1..n`?
- Does the brute-force approach repeatedly rescan for overlaps or missing values that normalization would reveal immediately?

The brute-force baselines usually look like this:

- compare every interval against every other interval for overlap
- insert a new interval and repeatedly rescan until merging stabilizes
- scan for each missing value separately
- use a set to track seen values when in-place placement could expose the answer directly

The optimization is to normalize first, then scan once with a clear invariant.

Mastery by the end of the chapter looks like this: you can explain why the chosen ordering is the decisive precondition, describe what “already normalized” means at each step, and use placement or sorted adjacency to avoid global rescans.

Do not force cyclic sort unless the values really belong to a tight index-aligned range. Do not force interval sorting when the original order itself is part of the problem's meaning.

## 3. Official Subtopic Coverage

### Concept Cluster: Interval Ordering and Merge Logic
Official subtopics covered:
- 8.1 Merge Intervals Pattern
- 8.3 Sorting by endpoints and overlap normalization

#### Definition or Framing
The Merge Intervals Pattern sorts intervals by a chosen endpoint, usually start time, and then combines overlapping intervals into normalized ranges. Sorting by endpoints is what makes overlap detection local instead of global.

#### Recognition Signals
- intervals with start and end values
- need to merge, insert, intersect, or detect schedule conflicts
- intervals are easier to reason about when ordered by start time or end time

#### Brute-Force Baseline
- compare every pair of intervals for overlap
- repeatedly merge discovered overlaps and rescan until no changes occur

#### Optimized Pattern Idea
Sort intervals so overlaps appear next to each other in the relevant order. Then keep a current normalized interval and extend or flush it as each new interval arrives.

#### Invariant / State Representation / Transition Logic
After processing intervals up to index `i`, the output list contains normalized non-overlapping intervals covering everything seen so far. The current interval being built is the only interval that can still overlap the next sorted interval.

#### Java Implementation Notes
- sort by start time, with end time as a tie-breaker if helpful
- use `Math.max(currentEnd, nextEnd)` when overlapping intervals are merged
- decide clearly whether touching intervals such as `[1, 3]` and `[3, 5]` should count as overlapping according to the problem statement

#### Quick Dry Run
If sorted intervals are `[1, 3]`, `[2, 6]`, `[8, 10]`, `[9, 12]`, the first two merge into `[1, 6]`, the next two merge into `[8, 12]`, and only neighboring comparisons are needed after sorting.

#### Common Mistakes
- forgetting to sort before merging
- using `>` when the problem treats touching intervals as overlapping and requires `>=` style logic, or the reverse
- appending the current merged interval too late or not at all after the loop

#### Debugging Strategy
Print the intervals after sorting, then trace the current merged interval after each step. If two overlapping intervals are separated after sorting, the sort key is wrong.

#### Comparison with Similar Pattern
Merging intervals is not greedy choice in the Chapter 9 sense. It is normalization by sorted adjacency. The correctness comes from ordering, not from making a locally optimal choice among alternatives.

#### Advanced Note
Many interval problems that look different at first, such as insertion, scheduling conflicts, and union length, reduce to the same “sort then normalize” core.

### Concept Cluster: Placement by Index and Missing-Value Recovery
Official subtopics covered:
- 8.2 Cyclic Sort Pattern
- 8.4 Placement-by-index problems and missing-value tricks

#### Definition or Framing
Cyclic sort repeatedly swaps each value into its natural position when the value range is tightly aligned to indices. Once the array stabilizes, any remaining mismatch directly reveals a missing, duplicate, or misplaced value.

#### Recognition Signals
- values expected to be within `0..n` or `1..n`
- need to find missing numbers, duplicates, or the first misplaced positive
- in-place rearrangement is allowed and useful

#### Brute-Force Baseline
- use a hash set or boolean array to mark all seen values and then scan for the answer
- scan for each candidate missing value separately

#### Optimized Pattern Idea
Place each valid value at its natural index by swapping until either it is in the correct position or a duplicate blocks further progress.

#### Invariant / State Representation / Transition Logic
At any point in the process, indices before the current pointer are either already correct or have been proven unfixable under the problem's rules. Each successful swap places at least one value into its correct position.

#### Java Implementation Notes
- for range `1..n`, the natural index is `value - 1`
- for range `0..n`, the natural index is `value`
- do not advance the pointer immediately after a swap; recheck the new incoming value first
- guard against invalid values and duplicates before swapping

#### Quick Dry Run
For `[3, 4, -1, 1]` in first-missing-positive style logic, the value `3` belongs at index `2`, the value `4` belongs at index `3`, and negative values are ignored. After valid placements stabilize, the first index whose value is not `index + 1` reveals the answer.

#### Common Mistakes
- swapping values outside the allowed range
- incrementing the pointer after every swap and skipping the new value at that position
- infinite loops caused by duplicates when the duplicate guard is missing

#### Debugging Strategy
On a tiny array, print the array after every swap and state which value is being moved to which natural index. Cyclic sort bugs are usually local and visible immediately.

#### Comparison with Similar Pattern
Cyclic sort is not general sorting. It works only because the value range gives each valid value a natural destination index.

#### Advanced Note
The same placement idea later appears in more advanced index-based problems, but only when the value-to-index mapping is rigid enough.

### Concept Cluster: Edge Cases and Hidden Sorting Signals
Official subtopics covered:
- 8.5 Interval edge cases with touching and nested ranges
- 8.6 When sorting is the real hidden pattern

#### Definition or Framing
Interval edge cases determine whether two ranges should merge, remain separate, or be absorbed. Hidden sorting signals appear when the easiest correct solution begins by ordering the data, even if the statement never says “sort.”

#### Recognition Signals
- touching intervals such as `[1, 3]` and `[3, 5]`
- nested intervals such as `[1, 10]` containing `[3, 4]`
- schedules, ranges, endpoints, placements, or “nearest next item” phrasing
- brute-force pair comparisons that disappear after sorting

#### Brute-Force Baseline
- write many custom overlap cases without normalizing order first
- compare every interval with all others
- search missing or conflicting positions from scratch each time

#### Optimized Pattern Idea
Use sorting to make relevant comparisons local. Then decide overlap and nesting behavior with a precise condition tied to the problem's wording.

#### Invariant / State Representation / Transition Logic
Once the data is ordered consistently, each new item only needs to be compared with the current normalized state or its immediate structural neighbor. Hidden pattern recognition means noticing this before the code becomes overly complex.

#### Java Implementation Notes
- write overlap conditions explicitly and test touching cases separately
- when nested intervals occur, ensure the larger end survives the merge
- choose stable and clear comparator logic so ordering intent is visible

#### Quick Dry Run
If intervals are sorted as `[1, 10]`, `[2, 3]`, `[4, 8]`, then nesting is handled naturally by keeping the current end at `10`. No special global scan is needed once the order is normalized.

#### Common Mistakes
- assuming touching intervals always overlap without checking the statement
- forgetting that nested intervals are just overlap cases with one dominant end
- missing the hidden sort opportunity and building a much harder custom simulation

#### Debugging Strategy
Ask one question early: “Does sorting by a meaningful key turn a global relationship into a local relationship?” If the answer is yes, sorting is probably the real pattern.

#### Comparison with Similar Pattern
Sorting is sometimes a preprocessing step. In this chapter it is often the reason the rest of the algorithm becomes linear and correct.

#### Advanced Note
Later chapters reuse the same hidden-pattern idea with events, sweeps, and offline query ordering.

## 4. Pattern Template, State Model, or Core Workflow

Canonical merge-intervals template:

```java
Arrays.sort(intervals, (first, second) -> Integer.compare(first[0], second[0]));

List<int[]> merged = new ArrayList<>();
int[] current = intervals[0].clone();

for (int index = 1; index < intervals.length; index++) {
    int[] next = intervals[index];
    if (next[0] <= current[1]) {
        current[1] = Math.max(current[1], next[1]);
    } else {
        merged.add(current);
        current = next.clone();
    }
}
merged.add(current);
```

Canonical cyclic-sort template for `1..n` values:

```java
int index = 0;
while (index < nums.length) {
    int correctIndex = nums[index] - 1;
    if (nums[index] >= 1
            && nums[index] <= nums.length
            && nums[index] != nums[correctIndex]) {
        swap(nums, index, correctIndex);
    } else {
        index++;
    }
}
```

Important variables and decision rules:

- interval normalization needs a sort key and an overlap rule
- cyclic sort needs a valid value range and a natural destination index
- touching intervals must follow the problem's exact definition of overlap
- duplicates and invalid values must be filtered before swapping

Safety rules:

- sort before assuming neighboring intervals carry meaning
- write the overlap condition in one exact line and test it with touching and nested cases
- after a cyclic-sort swap, recheck the current index
- never swap invalid values into arbitrary indices

What usually breaks first is not the merge or placement idea. It is the precondition: either the data was not normalized first, or the value range did not actually support a natural index mapping.

Adapt the templates when the interval question asks for insertion, intersection, or conflict detection, or when the placement question asks for duplicates instead of missing values, but keep the normalization logic unchanged.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Merge Intervals
#### Problem Statement
Given an array of intervals where `intervals[i] = [start, end]`, merge all overlapping intervals and return the resulting non-overlapping intervals.

#### Why This Example Matters
This is the foundational interval-normalization problem because it shows directly why sorting by start time changes the problem from global to local.

#### Input and Constraints
- interval count may be large
- intervals may overlap, touch, or be nested
- output should contain normalized non-overlapping ranges

#### Recognition Signals
- intervals with start and end values
- output needs merged ranges
- local neighbor comparisons become enough after sorting

#### Brute-Force Approach
Repeatedly scan all pairs of intervals, merge any overlap found, rebuild the list, and keep going until no further merges occur.

#### Better Pattern-Based Approach
Sort intervals by start time, then scan once while maintaining the current merged interval.

#### Why the Pattern Fits
After sorting by start time, any interval that can overlap the current interval must appear next or soon after in the sorted order. Earlier intervals are already normalized.

#### Invariant or State Transition
The output list plus the current working interval covers all processed intervals without overlap. The current interval is the only one still eligible to absorb the next interval.

#### Pragmatic Java Choice
Use `Arrays.sort` with a comparator and store results in a `List<int[]>` before converting back to an array.

#### Dry Run Before Code
For `[[1, 3], [2, 6], [8, 10], [15, 18]]`:

- after sorting, compare `[1, 3]` with `[2, 6]`, merge to `[1, 6]`
- `[8, 10]` does not overlap, so flush `[1, 6]`
- `[15, 18]` does not overlap `[8, 10]`, so flush `[8, 10]`

#### Java Solution
```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class MergeIntervalsSolver {
    public int[][] merge(int[][] intervals) {
        if (intervals.length == 0) {
            return new int[0][0];
        }

        Arrays.sort(intervals, (first, second) -> Integer.compare(first[0], second[0]));

        List<int[]> merged = new ArrayList<>();
        int[] current = intervals[0].clone();

        for (int index = 1; index < intervals.length; index++) {
            int[] next = intervals[index];
            if (next[0] <= current[1]) {
                current[1] = Math.max(current[1], next[1]);
            } else {
                merged.add(current);
                current = next.clone();
            }
        }

        merged.add(current);
        return merged.toArray(new int[merged.size()][]);
    }
}
```

#### Time and Space Complexity
- Brute force repeated merging: can degrade beyond $O(n^2)$ time
- Sort then merge: $O(n \log n)$ time, $O(n)$ extra space for the result

#### Edge Cases
- empty interval list
- one interval
- fully nested intervals
- touching intervals whose merge behavior depends on the statement

#### Common Mistakes
- forgetting to add the final current interval after the loop
- sorting by the wrong endpoint for the intended merge logic
- using the wrong overlap condition for touching intervals

### Worked Example 2: First Missing Positive
#### Problem Statement
Given an unsorted integer array `nums`, return the smallest missing positive integer.

#### Why This Example Matters
This is the strongest cyclic-sort example in the chapter because it uses placement-by-index directly to reveal the missing value without extra hashing.

#### Input and Constraints
- values may be negative, zero, duplicates, or larger than the array length
- the answer must be the smallest missing positive integer
- in-place rearrangement is allowed

#### Recognition Signals
- values that matter are the positive integers in `1..n`
- the answer is a missing value tied naturally to indices
- brute force with a set works but uses extra memory

#### Brute-Force Approach
Store all positive values in a hash set, then scan upward from `1` to find the first missing positive.

#### Better Pattern-Based Approach
Use cyclic sort to place each valid value `v` at index `v - 1`. Then scan for the first index whose value is not `index + 1`.

#### Why the Pattern Fits
Only values in `1..n` can affect the answer. Those values have natural destination indices, so misplacements after stabilization reveal the missing positive directly.

#### Invariant or State Transition
Each successful swap places at least one valid value into its correct position. Once the placement loop ends, any index mismatch identifies the answer immediately.

#### Pragmatic Java Choice
Use a `while` loop with explicit swap logic and duplicate guards.

#### Dry Run Before Code
For `[3, 4, -1, 1]`:

- place `3` at index `2` -> `[-1, 4, 3, 1]`
- place `4` at index `3` -> `[-1, 1, 3, 4]`
- place `1` at index `0` -> `[1, -1, 3, 4]`
- scanning finds index `1` does not store `2`, so the answer is `2`

#### Java Solution
```java
public class FirstMissingPositiveSolver {
    public int firstMissingPositive(int[] nums) {
        int index = 0;

        while (index < nums.length) {
            int value = nums[index];
            int correctIndex = value - 1;

            if (value >= 1
                    && value <= nums.length
                    && nums[index] != nums[correctIndex]) {
                swap(nums, index, correctIndex);
            } else {
                index++;
            }
        }

        for (int position = 0; position < nums.length; position++) {
            if (nums[position] != position + 1) {
                return position + 1;
            }
        }

        return nums.length + 1;
    }

    private void swap(int[] nums, int first, int second) {
        int temp = nums[first];
        nums[first] = nums[second];
        nums[second] = temp;
    }
}
```

#### Time and Space Complexity
- Brute force with a set: $O(n)$ time, $O(n)$ extra space
- Cyclic sort: $O(n)$ time, $O(1)$ extra space

#### Edge Cases
- all values already placed correctly
- all values non-positive
- duplicates blocking some placements
- answer equal to `n + 1`

#### Common Mistakes
- swapping values outside `1..n`
- forgetting the duplicate guard and entering an infinite loop
- advancing the index right after a swap and skipping the incoming value

### Worked Example 3: Insert Interval
#### Problem Statement
Given a list of non-overlapping intervals sorted by start time, insert a new interval into the list and merge if necessary.

#### Why This Example Matters
This example shows how interval normalization handles touching and nested edge cases when a new interval enters an already ordered structure.

#### Input and Constraints
- existing intervals are sorted and non-overlapping
- the new interval may overlap several intervals, touch boundaries, or fit between them

#### Recognition Signals
- intervals already ordered by start time
- insertion plus overlap normalization
- only local scan and merge are needed because the list is already normalized

#### Brute-Force Approach
Insert the interval, then repeatedly scan all pairs for overlap until the list stabilizes.

#### Better Pattern-Based Approach
Append all intervals ending before the new interval starts, then merge overlaps into the new interval, then append the remaining intervals.

#### Why the Pattern Fits
Because the intervals are already sorted and non-overlapping, each interval falls into one of three local categories: strictly before, overlapping, or strictly after the new interval.

#### Invariant or State Transition
Before processing the remaining intervals, the output list is normalized. During the overlap phase, the `newInterval` variable represents the merged union of all overlapping intervals seen so far.

#### Pragmatic Java Choice
Use a `List<int[]>` and a pointer index for a simple three-phase scan.

#### Dry Run Before Code
For intervals `[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]]` and new interval `[4, 8]`:

- `[1, 2]` stays before
- `[3, 5]`, `[6, 7]`, and `[8, 10]` all overlap or touch the new interval under inclusive overlap rules
- merged new interval becomes `[3, 10]`
- `[12, 16]` stays after

#### Java Solution
```java
import java.util.ArrayList;
import java.util.List;

public class InsertIntervalSolver {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> result = new ArrayList<>();
        int index = 0;

        while (index < intervals.length && intervals[index][1] < newInterval[0]) {
            result.add(intervals[index]);
            index++;
        }

        while (index < intervals.length && intervals[index][0] <= newInterval[1]) {
            newInterval[0] = Math.min(newInterval[0], intervals[index][0]);
            newInterval[1] = Math.max(newInterval[1], intervals[index][1]);
            index++;
        }

        result.add(newInterval);

        while (index < intervals.length) {
            result.add(intervals[index]);
            index++;
        }

        return result.toArray(new int[result.size()][]);
    }
}
```

#### Time and Space Complexity
- Brute force repeated overlap checks: can degrade beyond $O(n^2)$ time
- Ordered single scan: $O(n)$ time, $O(n)$ extra space for the result

#### Edge Cases
- insert before all intervals
- insert after all intervals
- new interval fully contained inside an existing interval
- new interval touching one or more boundaries

#### Common Mistakes
- forgetting that touching behavior depends on the problem's overlap rule
- inserting the merged interval too early before all overlaps are absorbed
- losing the existing sorted order by rebuilding the list incorrectly

## 6. Complexity and Comparison Guide

The main trade-off in this chapter is paying an ordering or placement cost once so the remaining logic becomes local and cheap.

- Interval normalization usually costs $O(n \log n)$ because of sorting, followed by an $O(n)$ scan.
- If interval input is already sorted and normalized, insertion or conflict detection can often be done in a single $O(n)$ pass.
- Cyclic sort often achieves $O(n)$ time and $O(1)$ extra space when the value range matches the index pattern exactly.

Comparison with similar patterns:

- Sorting-based interval handling versus brute-force pair comparison: sorting wins because overlap becomes a local neighbor relationship.
- Cyclic sort versus hashing: hashing is simpler and more general, but cyclic sort saves extra space when the value range gives a natural index mapping.
- Merge intervals versus greedy interval scheduling: merge intervals normalizes union ranges; greedy interval scheduling chooses among competing intervals for an objective. The goals differ even though both start from ordered intervals.

Decision criteria:

- choose merge-style ordering when overlapping ranges or adjacent conflicts are the core issue
- choose cyclic sort when values belong naturally to indices in a tight range
- choose plain sorting when the problem becomes much easier after items are placed in a meaningful order, even if the statement never asks for sorted output

Signals that you should not force this technique:

- values do not map naturally to indices, so cyclic sort is invalid
- original order is semantically important and sorting would destroy required meaning
- interval logic depends on more than local endpoint comparison after sorting

What breaks when the invariant or preconditions fail is locality. Without proper ordering or natural placement, the next item is no longer enough to decide the next action.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- forgetting to sort intervals before assuming neighbor overlap carries meaning
- getting the touching-interval condition wrong
- failing to append the last merged interval
- advancing the cyclic-sort pointer after a swap
- infinite loops when duplicate guards are missing in placement-by-index problems

Off-by-one and boundary risks:

- natural index is `value - 1` for `1..n`, not `value`
- invalid values such as `0`, negatives, or values above `n` must be ignored in cyclic-sort variants
- nested intervals are overlap cases, not separate categories requiring global rescans

Short debugging checklist:

1. Did I normalize the data before relying on local comparisons?
2. What exact overlap condition am I using, and how do touching ranges behave?
3. In cyclic sort, what value range is actually valid for swapping?
4. After a swap, did I recheck the current position?
5. On a tiny example, can I print the sorted intervals or the array after each swap and explain every step?

Quick counterexample that defeats a common wrong solution:

If you merge intervals without sorting first, `[[5, 7], [1, 3], [2, 6]]` can produce the wrong result because `[5, 7]` is processed before the intervals that should merge into `[1, 7]`. The local merge logic only becomes valid after sorting by start time.

## 8. Practice Problems

### Easy
- Merge Intervals: Merge all overlapping intervals. Expected pattern or core idea: sort by start time and normalize overlaps.
- Missing Number: Find the missing value from `0..n`. Expected pattern or core idea: placement by index or arithmetic alternative.
- Can Attend All Meetings: Decide whether any intervals overlap. Expected pattern or core idea: sort by start time and compare neighbors.

### Medium
- Insert Interval: Insert and normalize a new interval in sorted intervals. Expected pattern or core idea: interval merge logic.
- Find All Numbers Disappeared in an Array: Return all missing values in `1..n`. Expected pattern or core idea: cyclic sort.
- First Missing Positive: Return the smallest missing positive integer. Expected pattern or core idea: placement-by-index with range guards.

### Hard
- Employee Free Time: Find the common free intervals across schedules. Expected pattern or core idea: sorting and interval normalization.
- First Missing Positive with strict space limits in variants: Recover missing placement under broader noise. Expected pattern or core idea: cyclic sort reasoning.
- The Skyline Problem: Compute visible building outlines. Expected pattern or core idea: hidden ordering via sorted events.

## 9. Short Recap

The core idea of this chapter is that many interval and missing-value problems become simple only after the data is normalized by sorting or natural placement. The strongest recognition clue is that once items are ordered correctly, the next comparison becomes local instead of global. The most important optimization insight is to pay the normalization cost once and then scan with a clean invariant. The most important implementation warning is that the pattern fails when the precondition is wrong, especially around overlap rules or value-range assumptions. This chapter prepares the next one by turning ordering into broader strategy choices among heaps, greedy selection, search splitting, and randomized selection.

## 10. Coverage Check

- 8.1 Merge Intervals Pattern - Covered
- 8.2 Cyclic Sort Pattern - Covered
- 8.3 Sorting by endpoints and overlap normalization - Covered
- 8.4 Placement-by-index problems and missing-value tricks - Covered
- 8.5 Interval edge cases with touching and nested ranges - Covered
- 8.6 When sorting is the real hidden pattern - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 9: Selection and Choice Patterns
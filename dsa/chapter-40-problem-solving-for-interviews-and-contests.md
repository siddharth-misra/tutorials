# 40: Problem Solving for Interviews and Contests

**Goal:** Teach a repeatable workflow for turning unfamiliar problems into correct, explainable, bug-resistant Java solutions under interview or contest pressure.
**Outcome:** By the end of this chapter, you can move from brute force to optimization methodically, classify problems by pattern and constraints, write cleaner Java under time pressure, explain your reasoning clearly, and build a sustainable long-term practice system.

---

## 1. Intuition First

This chapter matters because knowing many algorithms is not enough. Interviews and contests reward the ability to identify the right tool, justify it quickly, implement it reliably, and recover when the first idea is not good enough.

A simple real-world analogy is diagnosing a machine failure. An expert does not randomly replace parts. They observe symptoms, form a baseline explanation, test the next most likely cause, and only then choose the repair.

The core mental model is:

- understand the problem completely before optimizing
- produce a correct brute-force baseline first when possible
- use constraints and patterns to choose the next improvement
- implement in a bug-resistant order and explain the final reasoning clearly

The most common beginner confusion point is jumping straight to a memorized optimal technique before the baseline is even correct. That leads to fragile code and weak explanations.

This chapter closes the DSA roadmap. It converts the previous thirty-nine chapters from isolated techniques into a reusable working system.

## 2. Core Concepts and Techniques

### Concept Cluster: Structured Discovery
Key concepts in this block:
- 40.1 Brute force to optimal workflow
- 40.2 Pattern recognition checklist
- 40.3 Constraint-driven thinking

#### Intuition

Strong problem solving is a sequence of disciplined choices, not a flash of intuition.

#### Why It Matters

This workflow keeps you moving even when the final algorithm is not obvious immediately.

#### How It Works

Brute force to optimal workflow:

- restate the problem in plain language
- write or describe the simplest correct solution
- identify its bottleneck
- ask which earlier pattern removes that bottleneck

Pattern recognition checklist:

- does order matter
- is the structure a sequence, tree, graph, interval set, or string
- is the problem asking for min, max, count, existence, or construction
- are states repeating, suggesting DP
- are queries repeated, suggesting preprocessing

Constraint-driven thinking:

- `n <= 20` may allow bitmask or subset search
- `n` in the hundreds of thousands usually rules out quadratic solutions
- weighted edges change BFS into Dijkstra or related tools

#### Java Implementation Notes

- Translate the chosen pattern into a named helper method or data structure quickly.
- Keep the baseline solution small so it helps reasoning rather than causing noise.
- Let constraints decide data types, recursion safety, and auxiliary structure sizes.

#### Common Mistakes

- guessing the pattern before identifying the bottleneck
- ignoring input-size limits
- optimizing a wrong baseline instead of fixing correctness first

#### Quick Example

If a brute-force nested loop is `O(n^2)` and the bottleneck is repeated prefix sums, hashing or prefix preprocessing may be the next step.

#### Debugging Tip

Before coding the optimized solution, say out loud: "My baseline is slow because of X, and this pattern removes X by doing Y once instead of repeatedly."

#### Advanced Note

In contests, the fastest route to the final solution is often a clean baseline plus one correct optimization step, not a leap to the deepest possible trick.

### Concept Cluster: Reliable Delivery
Key concepts in this block:
- 40.4 Writing bug-resistant Java code
- 40.5 Explaining solutions clearly

#### Intuition

A correct idea still fails if the code is fragile or the explanation is vague.

#### Why It Matters

Interviewers evaluate reasoning quality, not just final output. Contests punish tiny implementation mistakes.

#### How It Works

Writing bug-resistant Java code:

- choose clear names
- define invariants and base cases first
- test boundary conditions early
- isolate complex logic into helpers

Explaining solutions clearly:

- start with the core observation
- define the chosen data structure or state
- explain why the transition or invariant is correct
- finish with time and space complexity

#### Java Implementation Notes

- Prefer small helper methods over one long `main`-style block.
- Use `long` when sums or counts may exceed `int`.
- Keep indexing and interval conventions consistent throughout the solution.

#### Common Mistakes

- one-letter names in nontrivial logic
- skipping edge-case discussion because the main idea feels obvious
- giving a complexity number without tying it to actual loops or operations

#### Quick Example

Instead of saying "I use a map and it works," say: "I store the earliest index for each prefix sum so I can detect the longest subarray reaching target `k` in constant time per position."

#### Debugging Tip

After coding, read the solution as if you are the interviewer. If you cannot explain one loop's invariant in one sentence, the code probably needs cleanup.

#### Advanced Note

Clear explanation often reveals missing correctness arguments before the bug shows up in testing.

### Concept Cluster: Sustainable Improvement
Key concepts in this block:
- 40.6 Building a long-term practice system

#### Intuition

Skill does not come from random problem volume alone. It comes from repeated feedback loops.

#### Why It Matters

Without a system, solved problems fade quickly and weak areas keep repeating.

#### How It Works

A strong practice system includes:

- pattern-tagged problem logs
- short written notes on mistakes and corrected ideas
- spaced review of failed or slow problems
- balanced sets of easy, medium, and hard problems

#### Java Implementation Notes

- Keep a reusable Java template for input, output, graphs, trees, and common helpers.
- Save well-tested snippets for binary search, BFS, DFS, union-find, Fenwick tree, and DP skeletons.
- Record bug patterns such as off-by-one errors or wrong hash-map initialization.

#### Common Mistakes

- tracking only solved count, not error type or speed
- repeating favorite patterns while avoiding weak topics
- copying solutions without writing your own recap

#### Quick Example

After solving a graph problem, note not just "used BFS" but also why BFS was chosen over DFS or Dijkstra.

#### Debugging Tip

If the same bug appears three times across weeks, make it a named checklist item in your practice notes.

#### Advanced Note

Long-term growth comes from building a retrieval system for ideas and mistakes, not from depending on short-term memory.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Longest Subarray with Sum `k`
#### Problem Statement

Given an integer array and a target `k`, return the length of the longest subarray whose sum is exactly `k`.

#### Why This Example Matters

This example demonstrates the full brute-force-to-optimal workflow and shows how a bottleneck leads naturally to prefix sums plus hashing.

#### Constraints or Assumptions

- values may be positive, zero, or negative
- only the length is required, not the subarray itself
- prefix sums fit in `long`

#### Brute-Force Approach

Try every start and end index and compute each subarray sum.

That is `O(n^2)` if sums are accumulated incrementally inside the inner loop.

#### Better Approach

Use prefix sums and store the earliest index for each prefix sum.

#### Why the Better Approach Works

If the current prefix sum is `current`, then a previous prefix sum of `current - k` means the subarray between those positions sums to `k`. Keeping the earliest index gives the longest such subarray.

#### Pragmatic Java Choice

Use `HashMap<Long, Integer>` and store the first occurrence only.

#### Java Solution

```java
import java.util.HashMap;
import java.util.Map;

class LongestSubarraySumKExample {
    static int longestLength(int[] values, int target) {
        Map<Long, Integer> earliestIndex = new HashMap<>();
        earliestIndex.put(0L, -1);

        long prefixSum = 0;
        int best = 0;

        for (int index = 0; index < values.length; index++) {
            prefixSum += values[index];

            long needed = prefixSum - target;
            if (earliestIndex.containsKey(needed)) {
                best = Math.max(best, index - earliestIndex.get(needed));
            }

            earliestIndex.putIfAbsent(prefixSum, index);
        }

        return best;
    }
}
```

#### Dry Run

Input: `values = [1, -1, 5, -2, 3]`, `k = 3`

- prefix `1` at index `0`
- prefix `0` at index `1`
- prefix `5` at index `2`
- prefix `3` at index `3`, so `needed = 0`, earliest index is `-1`, length is `4`

Answer: `4`

#### Time and Space Complexity

Brute-force nested loops:

- Time: `O(n^2)`
- Space: `O(1)`

Prefix sum plus hashing:

- Time: `O(n)` average
- Space: `O(n)`

#### Edge Cases

- no valid subarray
- whole array sums to `k`
- negative values, which break simple sliding-window logic

#### Common Mistakes

- overwriting the earliest prefix index and losing longer answers
- using sliding window even though negative values are allowed
- forgetting the initial prefix sum `0` at index `-1`

### Worked Example 2: Top K Frequent Elements
#### Problem Statement

Given an integer array and an integer `k`, return the `k` most frequent elements.

#### Why This Example Matters

This example shows constraint-driven thinking. After counting frequencies, you must choose between sorting all keys, using a heap, or using buckets depending on constraints.

#### Constraints or Assumptions

- `1 <= k <= number of distinct values`
- order of the returned values is not important
- average-case hash-map performance is acceptable

#### Brute-Force Approach

Count frequencies, sort all distinct values by frequency, and take the first `k`.

That works, but sorting all keys may be unnecessary.

#### Better Approach

Use a min-heap of size `k` after frequency counting.

#### Why the Better Approach Works

The heap keeps only the best `k` candidates seen so far. Smaller-frequency entries are removed immediately.

#### Pragmatic Java Choice

Use `HashMap<Integer, Integer>` for counts and `PriorityQueue<int[]>` for the heap.

#### Java Solution

```java
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

class TopKFrequentElementsExample {
    static int[] topKFrequent(int[] values, int k) {
        Map<Integer, Integer> frequency = new HashMap<>();
        for (int value : values) {
            frequency.merge(value, 1, Integer::sum);
        }

        PriorityQueue<int[]> minHeap = new PriorityQueue<>((first, second) -> Integer.compare(first[1], second[1]));
        for (Map.Entry<Integer, Integer> entry : frequency.entrySet()) {
            minHeap.offer(new int[] {entry.getKey(), entry.getValue()});
            if (minHeap.size() > k) {
                minHeap.poll();
            }
        }

        int[] answer = new int[k];
        for (int index = k - 1; index >= 0; index--) {
            answer[index] = minHeap.poll()[0];
        }

        return answer;
    }
}
```

#### Dry Run

Input: `values = [1, 1, 1, 2, 2, 3]`, `k = 2`

- frequency map becomes `{1=3, 2=2, 3=1}`
- heap keeps only the top `2` frequency entries
- value `3` is removed because it is the least frequent

Answer contains `1` and `2`.

#### Time and Space Complexity

Count and full sort:

- Time: `O(n + u log u)`, where `u` is distinct value count
- Space: `O(u)`

Count and min-heap:

- Time: `O(n + u log k)`
- Space: `O(u + k)`

#### Edge Cases

- `k = 1`
- all values equally frequent
- only one distinct value

#### Common Mistakes

- forgetting that sorting all keys is not always necessary
- writing a max-heap when a bounded min-heap is simpler here
- assuming the final output must be frequency-sorted when the problem does not require it

### Worked Example 3: Course Schedule Feasibility
#### Problem Statement

Given `numCourses` and prerequisite pairs, return `true` if all courses can be finished.

#### Why This Example Matters

This example shows pattern recognition and explanation discipline. The real task is to notice that prerequisites form a directed graph and the question is asking whether a cycle exists.

#### Constraints or Assumptions

- courses are labeled from `0` to `numCourses - 1`
- prerequisite pair `[a, b]` means `b` must be completed before `a`
- only a boolean answer is required

#### Brute-Force Approach

Repeatedly scan all prerequisites, remove any course that currently has no unmet prerequisite, and keep looping until progress stops.

That is clumsy and inefficient.

#### Better Approach

Model the courses as a directed graph and use Kahn's algorithm for topological sorting.

#### Why the Better Approach Works

If the graph is acyclic, at least one node has indegree `0`, and repeated removal eventually processes every course. If a cycle exists, some nodes never drop to indegree `0`.

#### Pragmatic Java Choice

Use an adjacency list, indegree array, and queue.

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

class CourseScheduleExample {
    static boolean canFinish(int numCourses, int[][] prerequisites) {
        List<Integer>[] graph = new ArrayList[numCourses];
        for (int course = 0; course < numCourses; course++) {
            graph[course] = new ArrayList<>();
        }

        int[] indegree = new int[numCourses];
        for (int[] edge : prerequisites) {
            int course = edge[0];
            int prerequisite = edge[1];
            graph[prerequisite].add(course);
            indegree[course]++;
        }

        ArrayDeque<Integer> queue = new ArrayDeque<>();
        for (int course = 0; course < numCourses; course++) {
            if (indegree[course] == 0) {
                queue.add(course);
            }
        }

        int processed = 0;
        while (!queue.isEmpty()) {
            int course = queue.remove();
            processed++;

            for (int next : graph[course]) {
                indegree[next]--;
                if (indegree[next] == 0) {
                    queue.add(next);
                }
            }
        }

        return processed == numCourses;
    }
}
```

#### Dry Run

Input: `numCourses = 4`, prerequisites `[[1, 0], [2, 1], [3, 2]]`

- indegree `0` starts with course `0`
- processing `0` frees `1`
- processing `1` frees `2`
- processing `2` frees `3`

All courses are processed, so the answer is `true`.

If the prerequisites formed a cycle, the queue would become empty early.

#### Time and Space Complexity

Repeated scan removal:

- Time: worse than `O(V + E)` due to repeated rescans
- Space: depends on the bookkeeping approach

Kahn's algorithm:

- Time: `O(V + E)`
- Space: `O(V + E)`

#### Edge Cases

- no prerequisites
- self-dependency
- disconnected prerequisite graph

#### Common Mistakes

- reversing edge direction incorrectly
- forgetting to enqueue all zero-indegree nodes initially
- mistaking topological processing count for graph size without checking equality

## 4. Complexity and Decision Guide

This chapter is about choosing the right optimization path, not one fixed algorithm family.

- start with the simplest correct baseline so the bottleneck is visible
- let constraints rule out impossible complexities early
- choose the smallest correct data structure that eliminates the bottleneck
- keep the final implementation explainable in one or two clear observations

When to stay close to brute force:

- tiny constraints
- debugging the logic of a new problem type
- verifying an optimized idea against a trusted small-input baseline

When to optimize aggressively:

- quadratic or exponential time clearly violates constraints
- repeated queries, repeated states, or repeated comparisons dominate runtime
- a known earlier pattern directly targets the identified bottleneck

Recognition signals:

- repeated prefix or subarray work suggests prefix preprocessing or hashing
- top `k` wording suggests heap or partial ordering
- dependencies suggest DAG reasoning or cycle detection
- dynamic best/count/min/max over prefixes or states suggests DP

Signals not to force a technique:

- choosing a pattern because it is familiar rather than because it matches the bottleneck
- adding unnecessary abstractions under time pressure
- ignoring edge cases while chasing the optimal asymptotic bound

## 5. Edge Cases, Pitfalls, and Debugging

Common interview and contest bugs:

- misreading the problem statement and optimizing the wrong target
- choosing a pattern before verifying the brute-force reasoning
- off-by-one errors in boundaries, especially in prefixes and windows
- integer overflow in sums, products, or counts
- failing to test empty, singleton, and fully constrained cases

Short debugging checklist:

- restate the exact output requirement
- verify the baseline answer on a tiny hand-built input
- name the bottleneck before switching patterns
- test the final solution on one boundary case and one adversarial case
- be ready to explain why the chosen algorithm matches the constraints

## 6. Practice Problems

### Easy

**Title:** Two Sum  
**Prompt:** Find two numbers adding to a target.  
**Expected pattern or core idea:** Baseline to hashing optimization and clear explanation.

**Title:** Valid Parentheses  
**Prompt:** Decide whether brackets are balanced.  
**Expected pattern or core idea:** Fast pattern recognition for stack usage.

**Title:** Best Time to Buy and Sell Stock  
**Prompt:** Maximize profit from one transaction.  
**Expected pattern or core idea:** Identify the bottleneck and reduce to a one-pass invariant.

### Medium

**Title:** Longest Subarray with Sum `k`  
**Prompt:** Return the longest subarray whose sum is exactly `k`.  
**Expected pattern or core idea:** Constraint-aware choice of prefix sum plus hashing.

**Title:** Top K Frequent Elements  
**Prompt:** Return the `k` most frequent values efficiently.  
**Expected pattern or core idea:** Frequency counting plus heap or bucket choice.

**Title:** Course Schedule  
**Prompt:** Decide whether all courses can be completed under prerequisites.  
**Expected pattern or core idea:** Graph modeling and topological reasoning.

### Hard

**Title:** Design a Weekly Revision Loop  
**Prompt:** Build a study system that revisits mistakes and weak patterns deliberately.  
**Expected pattern or core idea:** Long-term practice system rather than random volume.

**Title:** Mixed-Pattern Mock Interview Set  
**Prompt:** Solve a small set where each problem must be classified before coding.  
**Expected pattern or core idea:** Pattern-recognition checklist under time pressure.

**Title:** Explain an Optimized Solution End-to-End  
**Prompt:** Present the observation, structure, correctness idea, and complexity for a hard problem.  
**Expected pattern or core idea:** Solution communication as a first-class skill.

## 7. Short Recap

The core idea is that strong problem solving is a repeatable workflow: baseline, bottleneck, pattern, careful implementation, and clear explanation. The most important optimization insight is that constraints should drive the choice of pattern, not habit. The most important implementation warning is to keep correctness and edge cases visible even under time pressure. This prepares the next step after the roadmap: sustained deliberate practice using the patterns you now know.

## 8. Coverage Check

- 40.1 Brute force to optimal workflow - Covered
- 40.2 Pattern recognition checklist - Covered
- 40.3 Constraint-driven thinking - Covered
- 40.4 Writing bug-resistant Java code - Covered
- 40.5 Explaining solutions clearly - Covered
- 40.6 Building a long-term practice system - Covered

Coverage Summary: 6/6 official subtopics covered

Next: None. This is the final chapter of the roadmap.
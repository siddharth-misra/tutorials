# 25: Pattern Comparison and Revision Systems

## 0. Introduction

This chapter sits in Part VII - Revision, Library Building, and Long-Term Mastery (Weeks 35-36), with the roadmap treating it as consolidation and execution refinement work. Its goal is to learn how to compare neighboring patterns quickly, build a revision system that reinforces the right distinctions, and solve familiar problems faster under time pressure. This chapter directly supports the Part VII outcome of recognizing neighboring patterns quickly under time pressure.

Read it as a bridge in the larger sequence. Chapter 24 built reusable Java templates. This chapter focuses on choosing among those templates quickly and reinforcing the distinctions that matter most. Chapter 26 turns the revision system into practice tracks, interview transfer, and real-world analogies. Start this chapter after you are comfortable with Chapters 1 through 24, especially the main pattern families, common failure modes, and the reusable Java scaffolds built in the previous chapter. The main themes here are Comparison with Similar Patterns, Revision Notes and Cheat Sheet, Mastery Checklist, Practice Roadmap, Speed Solving Strategy, and FAQ and selection heuristics.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to compare similar patterns deliberately, maintain concise revision notes and cheat sheets, use a mastery checklist and practice roadmap, apply speed-solving strategy under time pressure, and answer common pattern-selection questions with clear heuristics in Java problem-solving contexts.

## 1. Intuition First

This chapter matters because many wrong answers come from choosing a nearly-correct pattern. The code may even look polished, but the invariant does not fit the problem. Fast pattern comparison is what prevents that mistake.

The simplest analogy is a doctor's differential diagnosis. Several explanations may look close at first, but the right one depends on a few decisive signals. Pattern comparison works the same way: the clues that rule one pattern in often rule another out.

The core mental model is:

- pattern selection is a decision problem, not a memory contest
- neighboring patterns differ by a few decisive signals, not by long lists of features
- revision notes should store contrasts and counterexamples, not full textbook chapters
- speed comes from reducing the decision tree, not from skipping reasoning

Recognition signals for this chapter:

- you often confuse two similar patterns under pressure
- your first accepted solution is slow because you choose the safer but heavier pattern
- you want a personal revision system that improves selection speed, not just recall volume

The most common beginner confusion point is revising each pattern in isolation. That helps memory, but not selection. Selection improves when neighboring patterns are revised together with contrast cases.

In the larger roadmap, this chapter is the decision-making layer of final mastery.

## 2. Learning Path and Recognition Checklist

The chapter starts with pattern comparison, then turns that into revision notes, mastery checklists, practice sequencing, and speed-solving strategy. It ends with FAQ-style heuristics because common confusions are worth answering directly.

Recognition checklist for this chapter:

- Which two or three patterns does this problem most resemble?
- What clue disqualifies the tempting wrong pattern?
- What is the cheapest correct solution under the constraints?
- What would the brute-force baseline teach me before I optimize?
- What one-sentence note would help me choose this pattern faster next time?
- Which mistake do I keep repeating in this family?

The brute-force baseline here is a solving habit: try the first familiar pattern, discover it is wrong or too slow, and only then start over. The optimized approach is a faster decision system based on contrasts, checklists, and small counterexamples.

Mastery by the end of the chapter looks like this: you can compare similar patterns in a few sentences, record the contrast in a small revision note, and solve faster without becoming careless.

Do not build revision notes that are too long to revisit. Do not mistake a memorized taxonomy for a usable solving system.

## 3. Official Subtopic Coverage

### Concept Cluster: Comparing Neighboring Patterns
Official subtopics covered:
- 25.1 Comparison with Similar Patterns
- 25.6 FAQ and selection heuristics

#### Definition or Framing
Pattern comparison means identifying the decisive clue that separates two similar-looking approaches. FAQ and selection heuristics turn those contrasts into reusable rules under time pressure.

#### Recognition Signals
- two patterns seem plausible
- one problem detail breaks a common default approach
- the same family appears across multiple chapters with small but important differences

#### Brute-Force Baseline
Try one familiar pattern, fail, then restart with another.

#### Optimized Pattern Idea
Store contrast rules such as “positive numbers only -> sliding window may work; negative numbers present -> consider prefix-based methods.”

#### Core Workflow / Decision Rules
Always compare at least one tempting alternative and state why it fails or is weaker. A revision note should capture the deciding clue, not just the chosen pattern's name.

#### Java Implementation Notes
- keep one canonical solution for each contrasted pair
- use tiny code snippets or method signatures in notes only when they clarify the distinction
- store one counterexample for the wrong pattern if possible

#### Quick Dry Run
For subarray-sum questions, the deciding clue is often whether values can be negative and whether the target is exact or at least a threshold.

#### Common Mistakes
- revising “sliding window” and “prefix sum + hash” separately without comparing them
- using vague heuristics like “hashing is faster” without saying why
- forgetting the disqualifying clue for the wrong pattern

#### Debugging Strategy
If you chose the wrong pattern, write down the smallest input that exposes why. That counterexample belongs in the revision note.

#### Comparison with Similar Pattern
The fastest correct selection often comes from one explicit contrast, not from remembering an entire chapter.

#### Advanced Note
Selection heuristics should be short enough to scan in seconds.

### Concept Cluster: Revision Notes, Checklists, and Roadmaps
Official subtopics covered:
- 25.2 Revision Notes and Cheat Sheet
- 25.3 Mastery Checklist
- 25.4 Practice Roadmap

#### Definition or Framing
Revision notes and cheat sheets compress each pattern into recognition clues, invariant, common bug, and one contrast. A mastery checklist tracks whether you can recognize, implement, debug, and compare the pattern. A practice roadmap sequences review so weaker contrasts get revisited sooner.

#### Recognition Signals
- too much content to revise repeatedly in full
- implementation ability and recognition ability are improving at different speeds
- certain pattern families still blur together

#### Brute-Force Baseline
Reread full chapters and solve random problems without tracking the specific mistake pattern.

#### Optimized Pattern Idea
Create compact notes and a checklist-driven practice cycle. Revisit the patterns you misclassify more often than the ones you only code slowly.

#### Core Workflow / Decision Rules
Each note should answer four questions: when to use it, when not to use it, what invariant must hold, and what similar pattern it is easiest to confuse it with. Each checklist should ask whether you can recognize, code, test, compare, and explain it.

#### Java Implementation Notes
- link notes to your trusted template file or code snippet
- keep examples small and representative, not encyclopedic
- store one sample method signature when it speeds recall

#### Quick Dry Run
A one-page cheat sheet for graph problems might list BFS, DFS, Dijkstra, topological sort, DSU, and SCC with one line each on recognition and one line on the main pitfall.

#### Common Mistakes
- turning a cheat sheet into another full tutorial
- tracking solved counts without tracking misclassification causes
- revising only favorite topics and skipping weak ones

#### Debugging Strategy
When you miss a problem, ask whether the failure was recognition, implementation, invariant, or edge-case handling. Update the revision system based on that category.

#### Comparison with Similar Pattern
Cheat sheets are for fast recall; mastery checklists are for honest self-audit; roadmaps are for scheduling practice. They solve different revision jobs.

#### Advanced Note
The best practice roadmap revisits mistakes by cause, not just by chapter number.

### Concept Cluster: Speed Solving Under Pressure
Official subtopics covered:
- 25.5 Speed Solving Strategy
- 25.6 FAQ and selection heuristics

#### Definition or Framing
Speed-solving strategy is the disciplined order for reading, classifying, testing, and implementing a problem under a time limit. It is not “think less.” It is “spend time in the highest-value order.”

#### Recognition Signals
- interviews or contests with tight time budgets
- known patterns that still take too long to select or explain
- repeated restarts from choosing the wrong approach first

#### Brute-Force Baseline
Read the whole problem, guess a pattern, start coding immediately, and debug later.

#### Optimized Pattern Idea
Use a short pipeline: classify the input and constraints, state the brute-force baseline, shortlist two patterns, eliminate one with a clue, then code the lightest correct solution.

#### Core Workflow / Decision Rules
If you cannot say the brute-force baseline and the disqualifying clue for the wrong alternative, you are not ready to code yet. If you can, the implementation is usually much faster.

#### Java Implementation Notes
- start from a trusted template only after the pattern is chosen
- write a tiny sample in comments on paper or mentally, then code
- leave time for one boundary-case pass before submission

#### Quick Dry Run
For a positive-array minimum-length subarray problem, the fast pipeline is: brute force `O(n^2)`, positive numbers mean sliding window is valid, prefix hash is unnecessary, implement window template.

#### Common Mistakes
- confusing fast solving with skipping the baseline
- overusing heavy structures because they feel safe
- spending too long polishing code before validating pattern fit

#### Debugging Strategy
Time each phase mentally: classification, implementation, and testing. If one phase dominates repeatedly, that is where the revision system should focus.

#### Comparison with Similar Pattern
Speed-solving is not a separate algorithmic skill from correctness. It is correctness organized more efficiently.

#### Advanced Note
The better your contrast notes are, the less time you spend on false starts.

## 4. Pattern Template, State Model, or Core Workflow

Canonical revision-system workflow:

1. For each pattern, store one recognition clue, one invariant, one common bug, and one confused neighbor.
2. Maintain a mastery checklist with four statuses: recognize, implement, debug, compare.
3. After each practice session, record the mistake cause.
4. Revisit patterns by mistake frequency, not just in chapter order.
5. Before coding under time pressure, run a fast selection checklist.

Useful speed-solving checklist:

- What is the brute-force baseline?
- What makes it too slow?
- Which two patterns look plausible?
- What clue eliminates the weaker one?
- What is the lightest correct implementation?

What usually breaks first:

- notes grow too long to review
- mastery is judged by memory instead of implementation accuracy
- roadmaps track volume but not recurring error type
- speed attempts skip the pattern-selection step entirely

When to adapt versus keep the template unchanged:

- keep the revision format stable across all patterns
- adapt the practice roadmap based on fresh mistakes
- split cheat sheets by family only when one page becomes too dense to scan quickly

## 5. Worked Examples and Full Solutions

### Worked Example 1: Minimum Size Subarray Sum
#### Problem Statement
Given an array of positive integers and a target sum, return the length of the smallest contiguous subarray whose sum is at least the target. Return `0` if none exists.

#### Why This Example Matters
This is a classic comparison problem. It looks like prefix sums might help, but the decisive clue is that all numbers are positive, which makes a sliding window the simpler and stronger choice.

#### Input and Constraints
- `1 <= n <= 200000`
- all values are positive

#### Recognition Signals
- contiguous subarray
- threshold condition “at least target”
- positivity gives monotone window behavior

#### Brute-Force Approach
Check every subarray sum and track the minimum valid length.

#### Better Pattern-Based Approach
Use a sliding window. Expand right until the sum reaches the target, then shrink left while it stays valid.

#### Why the Pattern Fits
Positive numbers guarantee that shrinking the window only decreases the sum, so the validity condition is monotone.

#### Invariant or State Transition
Before updating the answer inside the shrink loop, the window sum is at least the target.

#### Pragmatic Java Choice
Use `int` for indices and `long` for the running sum if values can accumulate large totals.

#### Dry Run Before Code
Once the running sum becomes large enough, keep shrinking left until the window is no longer valid, updating the answer on each valid shrink step.

#### Java Solution
```java
public class PatternComparisonExampleOne {
    static int minSubArrayLen(int target, int[] values) {
        int left = 0;
        long currentSum = 0;
        int answer = Integer.MAX_VALUE;

        for (int right = 0; right < values.length; right++) {
            currentSum += values[right];
            while (currentSum >= target) {
                answer = Math.min(answer, right - left + 1);
                currentSum -= values[left++];
            }
        }
        return answer == Integer.MAX_VALUE ? 0 : answer;
    }

    public static void main(String[] args) {
        System.out.println(minSubArrayLen(7, new int[]{2, 3, 1, 2, 4, 3}));
    }
}
```

#### Time and Space Complexity
- Brute force: `O(n^2)`
- Sliding window: `O(n)` time and `O(1)` space

#### Edge Cases
- no valid subarray
- target met by one element
- whole array needed

#### Common Mistakes
- choosing prefix hash even though positivity makes a simpler window sufficient
- forgetting that the problem asks for “at least,” not exact sum
- shrinking only once instead of while valid

### Worked Example 2: Subarray Sum Equals K
#### Problem Statement
Given an integer array that may contain negative numbers, return the number of contiguous subarrays whose sum equals `k`.

#### Why This Example Matters
This is the perfect contrast to the previous example. The decisive clue is the presence of negative numbers and exact-sum counting, which invalidate the standard sliding-window choice.

#### Input and Constraints
- `1 <= n <= 200000`
- values may be negative

#### Recognition Signals
- exact sum count
- negative numbers present
- repeated subarray sums

#### Brute-Force Approach
Check every subarray sum and count those equal to `k`.

#### Better Pattern-Based Approach
Use prefix sums with a hash map storing how many times each prefix sum has appeared.

#### Why the Pattern Fits
If `prefix[current] - prefix[previous] = k`, then `prefix[previous] = prefix[current] - k`. A hash map can count those prior prefixes quickly.

#### Invariant or State Transition
Before processing the current value, the map stores counts of all prefix sums seen so far.

#### Pragmatic Java Choice
Use `HashMap<Long, Integer>` if cumulative sums may overflow `int`.

#### Dry Run Before Code
At each index, add to the answer the number of previous prefix sums equal to `currentPrefix - k`, then record the current prefix.

#### Java Solution
```java
import java.util.HashMap;
import java.util.Map;

public class PatternComparisonExampleTwo {
    static int countSubarrays(int[] values, int target) {
        Map<Long, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0L, 1);

        long prefix = 0;
        int answer = 0;
        for (int value : values) {
            prefix += value;
            answer += prefixCount.getOrDefault(prefix - target, 0);
            prefixCount.put(prefix, prefixCount.getOrDefault(prefix, 0) + 1);
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(countSubarrays(new int[]{1, 1, 1}, 2));
        System.out.println(countSubarrays(new int[]{1, -1, 0}, 0));
    }
}
```

#### Time and Space Complexity
- Brute force: `O(n^2)`
- Prefix sum plus hash map: `O(n)` expected time and `O(n)` space

#### Edge Cases
- many zero values
- negative numbers and repeated prefix sums
- target `0`

#### Common Mistakes
- forcing a sliding window even though negatives destroy the monotone invariant
- forgetting the initial prefix count of `0`
- updating the map before querying and double-counting zero-length intervals

### Worked Example 3: Course Schedule Ordering
#### Problem Statement
Given course prerequisite pairs, return one valid course order or an empty array if it is impossible.

#### Why This Example Matters
This example compares two neighboring graph patterns: DFS cycle detection and Kahn's topological sort. Both are valid, but Kahn's algorithm is often easier to explain and debug for explicit ordering.

#### Input and Constraints
- `1 <= numCourses <= 200000`
- prerequisites form a directed graph

#### Recognition Signals
- prerequisite order
- need an actual ordering, not just reachability
- cycles make the answer impossible

#### Brute-Force Approach
Try permutations of courses and test whether each order respects all prerequisites.

#### Better Pattern-Based Approach
Use Kahn's topological sort with indegrees.

#### Why the Pattern Fits
Nodes with indegree `0` have no remaining unmet prerequisites and are safe to place next in the order.

#### Invariant or State Transition
Every node currently in the queue has indegree `0`, meaning all its prerequisites have already been placed in the answer.

#### Pragmatic Java Choice
Use adjacency lists and an `ArrayDeque<Integer>` queue.

#### Dry Run Before Code
Initialize indegrees, enqueue all indegree-zero courses, then repeatedly place one course and reduce its neighbors' indegrees.

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

public class PatternComparisonExampleThree {
    static int[] findOrder(int numCourses, int[][] prerequisites) {
        List<Integer>[] graph = new ArrayList[numCourses];
        for (int course = 0; course < numCourses; course++) {
            graph[course] = new ArrayList<>();
        }

        int[] indegree = new int[numCourses];
        for (int[] prerequisite : prerequisites) {
            int nextCourse = prerequisite[0];
            int requiredCourse = prerequisite[1];
            graph[requiredCourse].add(nextCourse);
            indegree[nextCourse]++;
        }

        ArrayDeque<Integer> queue = new ArrayDeque<>();
        for (int course = 0; course < numCourses; course++) {
            if (indegree[course] == 0) {
                queue.offer(course);
            }
        }

        int[] order = new int[numCourses];
        int index = 0;
        while (!queue.isEmpty()) {
            int current = queue.poll();
            order[index++] = current;
            for (int neighbor : graph[current]) {
                indegree[neighbor]--;
                if (indegree[neighbor] == 0) {
                    queue.offer(neighbor);
                }
            }
        }

        return index == numCourses ? order : new int[0];
    }

    public static void main(String[] args) {
        int[][] prerequisites = {{1, 0}, {2, 0}, {3, 1}, {3, 2}};
        int[] order = findOrder(4, prerequisites);
        for (int course : order) {
            System.out.print(course + " ");
        }
        System.out.println();
    }
}
```

#### Time and Space Complexity
- Brute force permutations: infeasible
- Kahn topological sort: `O(courses + prerequisites)` time and `O(courses + prerequisites)` space

#### Edge Cases
- no prerequisites
- graph contains a cycle
- multiple valid orders exist

#### Common Mistakes
- choosing BFS for a dependency problem without indegree logic
- reversing edge direction accidentally
- forgetting that an empty result means cycle detected, not “no courses”

## 6. Complexity and Comparison Guide

Across the chapter, the main trade-offs are:

- isolated chapter revision: comprehensive but weak for fast selection
- contrast-based revision: much faster for real-time pattern choice
- full rereads: useful occasionally, but inefficient as the default review loop
- cheat sheets and checklists: lower detail, much higher revisit frequency

Comparison with similar patterns:

- sliding window versus prefix-hash methods: positivity and exactness are often the deciding clues
- DFS cycle detection versus Kahn topological sort: both solve DAG feasibility, but Kahn often exposes ordering state more directly
- heavyweight safe solutions versus lightweight exact-fit solutions: under time pressure, the lightest correct method is usually best

Decision criteria:

- store contrasts, not just summaries
- revise the clues that disqualify wrong patterns
- practice selection speed separately from raw implementation speed

Signals not to force this chapter's techniques:

- if you do not yet understand the underlying patterns, a comparison sheet alone will not fix that gap
- if the revision notes are too long to skim quickly, they are no longer doing their job

What breaks when invariants fail:

- using sliding window with non-monotone sums
- using the wrong graph direction in topological problems
- memorizing pattern names without their disqualifying signals

## 7. Edge Cases, Pitfalls, and Debugging

Common implementation and revision bugs:

- revision notes that describe a pattern but never say when not to use it
- speed-solving attempts that skip the brute-force baseline and pick the wrong pattern
- tracking solved counts without tracking misclassification cause

Boundary-condition handling:

- selection heuristics should mention whether negatives, duplicates, cycles, or mutability change the choice
- mastery checklists should test both recognition and coding, not one alone

Short debugging checklist:

1. What wrong pattern was tempting here?
2. What clue should have ruled it out?
3. What one-line note would prevent the same mistake next time?
4. Was the failure recognition, implementation, or testing?
5. Does the cheat sheet still fit on a quick scan?

Counterexample to a common wrong solution:

Using a sliding window to count subarrays with sum exactly `k` in `[1, -1, 1]` fails because shrinking and expanding no longer change the sum monotonically. That single counterexample belongs in the contrast note between sliding window and prefix-sum hashing.

## 8. Practice Problems

### Easy
- Minimum Size Subarray Sum: choose between brute force and window-based optimization; expected pattern or core idea: sliding window under positive values.
- Two Sum Versus Prefix Count Variant: compare direct lookup and accumulation logic; expected pattern or core idea: hashing contrast practice.
- Basic Topological Ordering: order tasks with prerequisites; expected pattern or core idea: Kahn or DFS topological comparison.

### Medium
- Subarray Sum Equals K: count exact-sum intervals with negatives; expected pattern or core idea: prefix sum plus hash map.
- Course Schedule II: return a valid course order; expected pattern or core idea: topological sort and cycle reasoning.
- Window Versus Prefix Threshold Problems: distinguish at-least and exact-sum interval questions; expected pattern or core idea: comparison drill.

### Hard
- Hard Hybrid Selection Set: solve three similar-looking problems with three different patterns; expected pattern or core idea: contrast-based pattern selection.
- Advanced Graph Decision Drill: distinguish DSU, BFS, Dijkstra, and topological sort from constraints; expected pattern or core idea: revision heuristics.
- Timed Mixed Revision Round: solve under strict time and write postmortems by mistake cause; expected pattern or core idea: speed-solving strategy.

## 9. Short Recap

The core idea is to revise patterns by contrast, not in isolation. The strongest recognition clue is the small detail that rules out the tempting wrong approach. The key optimization insight is that cheat sheets, mastery checklists, and short heuristics reduce false starts under time pressure. The most important implementation warning is that revision notes must stay short enough to revisit and specific enough to disqualify wrong patterns. This prepares the next chapter by turning the revision system into concrete practice tracks and real-world transfer.

## 10. Coverage Check

- 25.1 Comparison with Similar Patterns - covered
- 25.2 Revision Notes and Cheat Sheet - covered
- 25.3 Mastery Checklist - covered
- 25.4 Practice Roadmap - covered
- 25.5 Speed Solving Strategy - covered
- 25.6 FAQ and selection heuristics - covered

- Coverage Summary: 6/6 official subtopics covered
- This must always be 6/6 before final output

Next: 26: Practice Tracks and Real-World Transfer

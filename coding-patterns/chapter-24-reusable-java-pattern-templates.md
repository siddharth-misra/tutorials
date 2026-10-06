# 24: Reusable Java Pattern Templates

## 0. Introduction

This chapter sits in Part VII - Revision, Library Building, and Long-Term Mastery (Weeks 35-36), with the roadmap treating it as intermediate to advanced consolidation work. Its goal is to learn how to turn recurring pattern logic into reusable, bug-resistant Java templates instead of re-inventing each solution under time pressure. This chapter directly supports the Part VII outcome of building a reusable Java pattern library and a personal revision sheet.

Read it as a bridge in the larger sequence. Chapter 23 focused on combining patterns in hard problems. This chapter makes those solutions easier to implement repeatedly by extracting reusable Java templates. Chapter 25 builds on these templates by comparing neighboring patterns and designing a revision system for choosing among them quickly. Start this chapter after you are comfortable with Chapters 1 through 23, especially familiarity with the main pattern families and the implementation pain points each one introduces. The main themes here are Pattern Template, Standard Structure, Common Variables, Reusable Snippets, Testing Cases, and Best practices for bug-resistant Java implementations.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to organize reusable Java pattern templates with a standard structure, stable variable naming, practical snippets, lightweight tests, and implementation habits that reduce common contest and interview bugs.

## 1. Intuition First

This chapter matters because under time pressure, most bugs do not come from not knowing the idea. They come from rewriting known scaffolding too quickly: wrong loop bounds, inconsistent variable names, stale helper methods, or missing edge-case tests. Reusable templates reduce that noise.

The simplest analogy is a carpenter's toolkit. A carpenter does not re-design the hammer for each project. The reusable tool is stable, and the project-specific logic is what changes. Pattern templates work the same way in Java.

The core mental model is:

- a template is not a finished solution; it is a safe starting scaffold
- standard structure reduces cognitive overhead under pressure
- common variable names reduce translation bugs between thought and code
- reusable snippets should solve tiny recurring jobs, not hide the whole algorithm blindly
- lightweight test cases belong next to the template so the first bug is found early

Recognition signals for this chapter:

- you repeatedly rewrite the same loop, queue, or binary-search structure
- your solutions fail on edge cases because the skeleton changes subtly each time
- you want a personal Java library that is easy to recall and adapt

The most common beginner confusion point is turning templates into copy-paste cargo cults. A template should preserve the invariant and structure, but still be adapted deliberately to the current problem.

In the larger roadmap, this chapter begins the final consolidation phase by turning recurring patterns into reusable engineering assets.

## 2. Learning Path and Recognition Checklist

The chapter starts with what a good template is and is not. It then covers standard structure, common variable choices, reusable snippets, testing habits, and bug-resistant practices. The emphasis is practical: the template should speed you up without hiding the reasoning.

Recognition checklist for this chapter:

- What part of this pattern stays the same across many problems?
- What part changes problem by problem?
- Can the variable names explain the state without extra comments?
- What tiny helper snippet saves time without making the template rigid?
- What are the first three test cases that should always run?
- What mutation order usually breaks this pattern if written carelessly?

The brute-force baseline here is not an algorithmic runtime baseline. It is an implementation baseline: retype the full solution from scratch every time and accept repeated scaffolding bugs.

The optimization later becomes:

- extract the stable structure into a standard template
- keep problem-specific logic in small clearly marked sections
- attach a tiny test harness or sample invocation to catch mistakes quickly

Mastery by the end of the chapter looks like this: you can take a known pattern, start from a clean Java template, adapt only the necessary parts, and test it quickly without making the code rigid or unreadable.

Do not force one template to cover every variant. A template that tries to do everything usually becomes unsafe to adapt.

## 3. Official Subtopic Coverage

### Concept Cluster: What Makes a Good Template
Official subtopics covered:
- 24.1 Pattern Template
- 24.2 Standard Structure

#### Definition or Framing
A good pattern template is a reusable starting skeleton with a stable control flow, explicit placeholders for problem-specific logic, and enough structure to preserve the core invariant without locking you into one problem statement.

#### Recognition Signals
- the same pattern is implemented repeatedly with similar loops and state variables
- most failures come from setup bugs rather than the core idea
- the pattern has a canonical control flow worth preserving

#### Brute-Force Baseline
Rewrite the full solution structure from memory each time.

#### Optimized Pattern Idea
Keep the stable parts fixed: initialization, loop structure, update order, and return shape. Mark the parts that change.

#### Core Workflow / Decision Rules
The template should expose three zones clearly: setup, core loop or recurrence, and result extraction. If a section changes in nearly every problem, it does not belong in the fixed template.

#### Java Implementation Notes
- prefer one public solve method plus small helpers
- keep imports minimal and standard
- expose the pattern state clearly through named arrays, pointers, or queues

#### Quick Dry Run
A sliding-window template keeps `left`, the expansion loop on `right`, and the shrink loop stable. Only the validity condition and update logic usually change.

#### Common Mistakes
- turning the template into a huge all-purpose file
- hiding the core invariant behind vague helper names
- mixing problem-specific conditions into the fixed scaffold

#### Debugging Strategy
If a template fails repeatedly across problems, the template itself is probably unstable and should be simplified.

#### Comparison with Similar Pattern
A reusable template is smaller and safer than a monolithic “cheat file” full of half-generic code.

#### Advanced Note
The best template is the smallest stable structure that still protects the invariant.

### Concept Cluster: Variables, Snippets, and Tests
Official subtopics covered:
- 24.3 Common Variables
- 24.4 Reusable Snippets
- 24.5 Testing Cases

#### Definition or Framing
Common variables are recurring names such as `left`, `right`, `mid`, `low`, `high`, `queue`, `distance`, `parent`, and `prefix`. Reusable snippets are tiny helpers like direction arrays, Fenwick updates, DSU find/union, or binary-search loops. Testing cases are the minimum checks that validate the template quickly.

#### Recognition Signals
- you keep rewriting the same helper code
- variable confusion creates more bugs than the algorithm itself
- the first bug is often revealed by one tiny edge-case test

#### Brute-Force Baseline
Use ad hoc variable names and rebuild every helper from scratch.

#### Optimized Pattern Idea
Standardize variable names and keep a few small, trusted helpers ready. Attach three to five minimal test cases that stress the invariant.

#### Core Workflow / Decision Rules
Standardize names only when their roles stay stable across problems. Reuse snippets only when the snippet itself is already trusted. Test cases should include the smallest valid input, a boundary case, and one counterexample to a common wrong implementation.

#### Java Implementation Notes
- `left/right` for windows and binary search
- `row/col` with direction arrays for grids
- `node/neighbor` for graph traversal
- `current/best` for DP transitions when their roles are local and clear

#### Quick Dry Run
For a BFS template, the first test should often be a single node, then a disconnected case, then a small connected graph with a known shortest path.

#### Common Mistakes
- reusing a variable name across two different meanings in the same method
- storing too many snippets and trusting none of them fully
- testing only the happy path

#### Debugging Strategy
Keep one tiny sample case right under the template and run it before using the template in a larger problem.

#### Comparison with Similar Pattern
Good snippets support templates; they do not replace the need to think about the current problem's invariant.

#### Advanced Note
A small trusted library beats a large unverified library every time.

### Concept Cluster: Bug-Resistant Template Habits
Official subtopics covered:
- 24.6 Best practices for bug-resistant Java implementations
- 24.2 Standard Structure
- 24.5 Testing Cases

#### Definition or Framing
Bug-resistant template habits are the implementation rules that prevent common failures: stable indexing, consistent interval conventions, safe mutation order, and immediate testing on small cases.

#### Recognition Signals
- off-by-one errors appear often
- overflow bugs reappear across chapters
- mutation order is easy to get wrong in windows, BFS, or DP

#### Brute-Force Baseline
Rely on memory and rush straight into full input sizes.

#### Optimized Pattern Idea
Write templates that encode safe defaults: `long` where sums grow, clear inclusive or half-open bounds, and update order that mirrors the invariant.

#### Core Workflow / Decision Rules
Pick one indexing convention, document it mentally, and keep it throughout the template. If a pattern has a fragile update order, that order belongs in the template, not in improvisation.

#### Java Implementation Notes
- prefer `long` for prefix sums, counts, and cost accumulations when limits are unclear
- guard empty or singleton inputs explicitly if the pattern is sensitive to them
- keep fast helper methods small enough to inspect visually

#### Quick Dry Run
A binary search template should always answer: what does `low` mean, what does `high` mean, and what condition moves each one?

#### Common Mistakes
- mixing inclusive and exclusive intervals in one method
- silently using `int` where sums can overflow
- changing the template's safe mutation order during adaptation

#### Debugging Strategy
When a bug appears, compare the current code to the canonical template line by line and identify the first deviation.

#### Comparison with Similar Pattern
Bug-resistant habits are the difference between having a template library and having a pile of old code.

#### Advanced Note
The safest template is not the most abstract one. It is the one whose invariants stay visible.

## 4. Pattern Template, State Model, or Core Workflow

Canonical Java template workflow:

1. Start from the smallest trusted skeleton.
2. Rename only the problem-specific parts.
3. Mark the invariant in your head before writing any custom logic.
4. Fill in the core condition or transition.
5. Run the minimal test cases immediately.

Useful standard structure for most templates:

- method signature and input validation
- state initialization
- core loop or recurrence
- answer extraction
- tiny `main` sample or assert-style tests when practical

Common variable suggestions:

- `left`, `right` for windows and intervals
- `low`, `high`, `mid` for binary search
- `node`, `neighbor`, `distance` for graph traversal
- `row`, `col`, `nextRow`, `nextCol` for grids
- `current`, `next`, `best` for DP updates

Reusable snippet candidates:

- direction arrays for grids
- DSU `find` and `union`
- Fenwick `add` and `prefixSum`
- binary-search-on-answer loop
- queue-based BFS skeleton

What usually breaks first:

- interval meaning in binary search and range queries
- queue initialization in BFS
- stale state after shrinking a window
- missing base cases in DP

When to adapt versus keep the template unchanged:

- keep the control flow unchanged when the invariant is the same
- adapt only the condition, merge, or transition logic that the current problem changes
- split a template into two variants if one scaffold no longer fits both safely

## 5. Worked Examples and Full Solutions

### Worked Example 1: Reusable Sliding Window Template
#### Problem Statement
Given a string, return the length of the longest substring without repeating characters.

#### Why This Example Matters
This is a strong first template because the loop skeleton stays stable across many window problems.

#### Input and Constraints
- `0 <= s.length() <= 200000`
- ASCII input for this template version

#### Recognition Signals
- contiguous substring
- expand and shrink behavior
- one validity condition controls the window

#### Brute-Force Approach
Check every substring and test whether it contains duplicates.

#### Better Pattern-Based Approach
Use a reusable sliding-window template with a frequency array and a shrink loop triggered by invalid state.

#### Why the Pattern Fits
The stable parts are the same across many window problems: expand right, repair while invalid, update answer.

#### Invariant or State Transition
The window `[left, right]` is valid after the shrink loop finishes. That invariant should be true before updating the answer.

#### Pragmatic Java Choice
Use a fixed-size `int[]` frequency array for ASCII input because it is faster and simpler than a map here.

#### Dry Run Before Code
When the right pointer adds a repeated character, shrink `left` until that character's frequency returns to `1`.

#### Java Solution
```java
public class SlidingWindowTemplateExample {
    static int longestUniqueSubstring(String text) {
        int[] frequency = new int[128];
        int left = 0;
        int answer = 0;

        for (int right = 0; right < text.length(); right++) {
            char currentChar = text.charAt(right);
            frequency[currentChar]++;

            while (frequency[currentChar] > 1) {
                frequency[text.charAt(left)]--;
                left++;
            }

            answer = Math.max(answer, right - left + 1);
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(longestUniqueSubstring("abcabcbb"));
        System.out.println(longestUniqueSubstring("bbbbb"));
    }
}
```

#### Time and Space Complexity
- Brute force: `O(n^2)` or worse depending on duplicate checking
- Sliding-window template: `O(n)` time and `O(1)` space for ASCII

#### Edge Cases
- empty string
- all characters identical
- all characters distinct

#### Common Mistakes
- updating the answer before restoring validity
- shrinking only once instead of while invalid
- using a map when a fixed array is simpler for the character set

### Worked Example 2: Reusable BFS Template
#### Problem Statement
Given an unweighted graph, return the shortest number of edges from a source node to every other node.

#### Why This Example Matters
This is a standard traversal scaffold that appears in graph, grid, and state-space problems.

#### Input and Constraints
- graph may be disconnected
- edges are unweighted
- `1 <= n <= 200000`

#### Recognition Signals
- shortest path by number of edges
- queue-based frontier expansion
- repeated use of visited or distance arrays

#### Brute-Force Approach
Run DFS from the source and hope the first path found is shortest, or try all paths.

#### Better Pattern-Based Approach
Use a BFS template with a queue and distance array.

#### Why the Pattern Fits
In unweighted graphs, BFS layers correspond exactly to shortest path length in edges.

#### Invariant or State Transition
When a node is first dequeued or first discovered, its stored distance is already the shortest possible in an unweighted graph.

#### Pragmatic Java Choice
Use `ArrayDeque<Integer>` and an `int[] distance` initialized to `-1`.

#### Dry Run Before Code
Source enters the queue with distance `0`. Every undiscovered neighbor gets distance `distance[current] + 1` and enters the queue exactly once.

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class BfsTemplateExample {
    static int[] shortestPaths(int n, int[][] edges, int source) {
        List<Integer>[] graph = new ArrayList[n];
        for (int node = 0; node < n; node++) {
            graph[node] = new ArrayList<>();
        }
        for (int[] edge : edges) {
            graph[edge[0]].add(edge[1]);
            graph[edge[1]].add(edge[0]);
        }

        int[] distance = new int[n];
        Arrays.fill(distance, -1);
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        distance[source] = 0;
        queue.offer(source);

        while (!queue.isEmpty()) {
            int current = queue.poll();
            for (int neighbor : graph[current]) {
                if (distance[neighbor] == -1) {
                    distance[neighbor] = distance[current] + 1;
                    queue.offer(neighbor);
                }
            }
        }
        return distance;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1}, {1, 2}, {0, 3}, {3, 4}};
        System.out.println(Arrays.toString(shortestPaths(5, edges, 0)));
    }
}
```

#### Time and Space Complexity
- Brute force path exploration: can be exponential
- BFS template: `O(nodes + edges)` time and `O(nodes)` space

#### Edge Cases
- disconnected nodes
- source with no neighbors
- graph with one node

#### Common Mistakes
- forgetting to mark discovered nodes immediately
- using BFS on weighted graphs without justification
- leaving distance arrays uninitialized or overloaded with multiple meanings

### Worked Example 3: Reusable DP Template with Quick Tests
#### Problem Statement
Given coin denominations and a target amount, return the minimum number of coins needed to form the amount, or `-1` if it is impossible.

#### Why This Example Matters
This example shows how a reusable DP template and a tiny test harness reduce base-case and transition bugs.

#### Input and Constraints
- `1 <= amount <= 10000`
- coin values are positive

#### Recognition Signals
- repeated choice over smaller subproblems
- one-dimensional state by amount
- base case and unreachable states matter

#### Brute-Force Approach
Try every sequence of coins recursively.

#### Better Pattern-Based Approach
Use a standard 1D DP template where `dp[value]` is the minimum coins needed for that value.

#### Why the Pattern Fits
The control flow is stable across many 1D optimization DPs: initialize unreachable state, apply transitions, extract answer.

#### Invariant or State Transition
After processing transitions for value `current`, `dp[current]` is the best known minimum coin count for that amount.

#### Pragmatic Java Choice
Use a large sentinel instead of `Integer.MAX_VALUE` to avoid overflow when adding `1`.

#### Dry Run Before Code
`dp[0] = 0`. For each amount, try every coin that can end the solution and update from `dp[amount - coin] + 1`.

#### Java Solution
```java
import java.util.Arrays;

public class DpTemplateExample {
    static int minCoins(int[] coins, int amount) {
        int sentinel = amount + 1;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, sentinel);
        dp[0] = 0;

        for (int current = 1; current <= amount; current++) {
            for (int coin : coins) {
                if (coin <= current) {
                    dp[current] = Math.min(dp[current], dp[current - coin] + 1);
                }
            }
        }

        return dp[amount] == sentinel ? -1 : dp[amount];
    }

    static void runQuickTests() {
        System.out.println(minCoins(new int[]{1, 2, 5}, 11));
        System.out.println(minCoins(new int[]{2}, 3));
        System.out.println(minCoins(new int[]{1}, 0));
    }

    public static void main(String[] args) {
        runQuickTests();
    }
}
```

#### Time and Space Complexity
- Brute force recursion: exponential in the amount
- 1D DP template: `O(amount * numberOfCoins)` time and `O(amount)` space

#### Edge Cases
- amount `0`
- impossible target amount
- one coin denomination only

#### Common Mistakes
- using an overflow-prone sentinel
- forgetting the `dp[0] = 0` base case
- mixing minimum-count DP with count-of-ways DP structure

## 6. Complexity and Comparison Guide

Across the chapter, the main trade-offs are:

- writing solutions from scratch each time: flexible but bug-prone under pressure
- using stable templates: faster and safer, but only if the template stays small and trusted
- large all-purpose libraries: broad coverage, but often harder to adapt and debug than small focused templates

Comparison with similar patterns:

- template library versus raw memorization: templates externalize stable structure so you can focus on problem-specific logic
- reusable snippets versus full solutions: snippets support adaptation better because they do not hide the whole algorithm
- test harnesses versus informal confidence: tiny tests catch template bugs far earlier than large inputs do

Decision criteria:

- store only patterns you use repeatedly
- keep templates minimal and role-focused
- attach tests to patterns that are easy to get subtly wrong

Signals not to force templates:

- the problem variant changes the invariant too much
- the template has become more abstract than readable
- the snippet is untested and adds more trust burden than speed

What breaks when invariants fail:

- a sliding-window template with the wrong shrink rule loses correctness immediately
- a BFS template that marks visited too late duplicates work
- a DP template with the wrong base state poisons every later entry

## 7. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- stale template leftovers from a previous problem
- variable names reused with a different meaning in the current adaptation
- missing quick tests for empty or singleton cases
- trusting a template that has never been validated independently

Boundary-condition handling:

- template entry points should make empty-input assumptions explicit
- fast I/O and helper snippets should not hide indexing conventions
- standard variable names must still match the actual control flow of the pattern

Short debugging checklist:

1. Identify what part of the template is fixed.
2. Identify what part is problem-specific.
3. Run the smallest valid test.
4. Run one boundary test.
5. Compare the current code to the trusted template version.

Counterexample to a common wrong solution:

If you reuse a sliding-window template on a problem with negative numbers and assume the window sum is monotone, the template itself is not wrong. The pattern choice is wrong. Templates do not override prerequisites.

## 8. Practice Problems

### Easy
- Longest Substring Without Repeating Characters: adapt a sliding-window template; expected pattern or core idea: standard window scaffold.
- Binary Search on Sorted Array: adapt a search template; expected pattern or core idea: inclusive or half-open binary search template.
- BFS Shortest Path in an Unweighted Graph: adapt a queue template; expected pattern or core idea: BFS scaffold.

### Medium
- Coin Change: adapt a 1D DP template; expected pattern or core idea: standard DP structure with sentinel values.
- Number of Islands: adapt grid BFS or DFS scaffolding; expected pattern or core idea: traversal template with direction arrays.
- Range Sum Query - Mutable: adapt a Fenwick template; expected pattern or core idea: reusable indexed-update snippet.

### Hard
- Path Queries on Trees: adapt an HLD plus segment-tree template; expected pattern or core idea: advanced structure template.
- Convex Hull Trick DP Variant: adapt a line-container template; expected pattern or core idea: verified advanced snippet reuse.
- Multi-Pattern Contest Problem: start from two stable templates and combine carefully; expected pattern or core idea: reusable scaffolding plus hybrid reasoning.

## 9. Short Recap

The core idea is to store stable control flow and safe helper logic as reusable Java templates so you can spend your effort on the problem-specific invariant. The strongest recognition clue is repeated reimplementation of the same pattern scaffold across different problems. The key optimization insight is implementation-focused: standard structure, stable variable names, and tiny tests prevent a large class of avoidable bugs. The most important implementation warning is that templates support reasoning but do not replace it. This prepares the next chapter by giving you the reusable building blocks needed for fast pattern comparison and revision.

## 10. Coverage Check

- 24.1 Pattern Template - covered
- 24.2 Standard Structure - covered
- 24.3 Common Variables - covered
- 24.4 Reusable Snippets - covered
- 24.5 Testing Cases - covered
- 24.6 Best practices for bug-resistant Java implementations - covered

- Coverage Summary: 6/6 official subtopics covered
- This must always be 6/6 before final output

Next: 25: Pattern Comparison and Revision Systems
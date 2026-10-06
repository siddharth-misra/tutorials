# 10: Recursive Search Patterns

## 0. Introduction

This chapter sits in Part III - Recursive Search, Trees, and Graph Structure (Weeks 10-15), with the roadmap treating it as intermediate to upper intermediate work. Its goal is to learn how to model recursive search as an explicit decision tree so you can explore choices systematically, roll state back safely, prune impossible branches, and cache repeated subproblems when the same state appears again. This chapter directly supports the Part III outcome of explaining recursion and state clearly, without hand-waving over what the call stack stores or how branching decisions evolve.

Read it as a bridge in the larger sequence. Chapter 9 focused on making controlled choices without full branching. This chapter opens Part III by handling problems where choices really do branch and must be explored as a search tree. Chapter 11 takes recursive and level-order reasoning from generic search trees into concrete tree data structures, tries, and ancestor queries. Start this chapter after you are comfortable with Chapters 1 through 9, especially stacks and queues as hidden control-flow models, sorting, and careful invariant reasoning. The main themes here are Recursion Tree Pattern, Backtracking Pattern, Subsets Pattern, Permutations Pattern, Memoization Pattern, and Pruning, rollback, and search-tree visualization.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to reason about recursion trees, write clean backtracking solutions for subsets and permutations, add pruning and rollback safely, and use memoization when recursive search revisits the same state instead of exploring a truly unique branch each time.

## 1. Intuition First

This chapter matters because many problems are fundamentally about exploring choices, not just scanning data. A subset can include or exclude each element. A permutation must choose which unused element comes next. A recursive formula can either recompute the same state many times or cache it once. Without a clear mental model of the search tree, the code becomes confusing quickly.

The simplest analogy is walking a maze with a notebook. At each fork, you choose a path, record the current route, explore deeper, and then return to the fork to try the next option. If you later reach a fork you have already solved under the same conditions, you can reuse that result instead of rewalking the whole branch. That is recursion plus backtracking plus memoization.

The core mental model is:

- recursion defines the search tree
- each call represents one state in that tree
- backtracking means choose, recurse, undo
- pruning means stop exploring a branch that cannot help
- memoization means cache answers for states that repeat

Recognition signals for this chapter:

- “try all combinations,” “try all orders,” or “choose some elements”
- branching decisions at each position
- repeated recursive calls on the same logical state
- problems where a partial solution can already be ruled out

The most common beginner confusion point is treating recursion as a mysterious language feature instead of a controlled stack of states. Every recursive call has parameters, local variables, and a pending return point. Once that becomes visible, backtracking and memoization become much easier to reason about.

In the larger roadmap, this chapter is the entry point to recursive problem solving before trees, graphs, and dynamic programming formalize these ideas in more specialized settings.

## 2. Learning Path and Recognition Checklist

The chapter starts with recursion trees so the learner can see what the call stack is actually doing. It then introduces backtracking, where a shared partial solution is modified and then rolled back safely. Next it applies that pattern to subsets and permutations, because they are the cleanest search-tree families. After that, it introduces memoization for cases where recursion revisits the same state. Finally, it ties everything together with pruning and search-tree visualization so branching stays understandable instead of opaque.

Recognition checklist for this chapter:

- Does the problem naturally branch into choices at each step?
- Is the goal to enumerate all valid solutions, count them, or just decide whether one exists?
- Does each recursive call represent a unique branch, or can the same state reappear from multiple paths?
- Can a partial choice already be recognized as impossible or unhelpful?
- Will a shared mutable path need explicit rollback after the recursive call returns?

The brute-force baselines often look like this:

- manually enumerating all subsets or all orders
- raw recursive branching with no pruning
- recursive recomputation of the same state many times

The optimization in this chapter depends on the issue:

- backtracking organizes branching cleanly
- pruning avoids hopeless branches early
- memoization avoids re-solving repeated states

Mastery by the end of the chapter looks like this: you can draw the recursive state, define the base case, state what changes before and after the recursive call, and explain whether the problem needs full branching, pruning, or caching.

Do not force backtracking when a greedy or iterative solution already eliminates branching cleanly. Do not force memoization when every recursive state is truly unique and there is nothing to reuse.

## 3. Official Subtopic Coverage

### Concept Cluster: Search Trees and Backtracking Mechanics
Official subtopics covered:
- 10.1 Recursion Tree Pattern
- 10.2 Backtracking Pattern

#### Definition or Framing
The Recursion Tree Pattern models a problem as a branching decision tree where each recursive call represents one node. The Backtracking Pattern explores that tree by making a choice, descending into the next state, and then undoing the choice so the next sibling branch starts from a clean state.

#### Recognition Signals
- each step has multiple choices
- need to explore many candidate solutions
- current path or partial decision matters to deeper calls
- state must be restored after exploring one branch

#### Brute-Force Baseline
- write separate nested loops or ad hoc recursion for each choice depth
- copy large amounts of state unnecessarily for every branch

#### Optimized Pattern Idea
Represent the branching structure directly with a recursive helper. Maintain a compact state, mutate it locally, recurse, and then roll it back.

#### Invariant / State Representation / Transition Logic
At the start of each recursive call, the parameters and shared path represent exactly one node of the search tree. After backtracking returns, the shared path must be restored to the state it had before the branch was explored.

#### Java Implementation Notes
- pass only the state needed for the next decision
- use a shared `List<Integer>` or similar path and copy it only when recording a complete solution
- base cases should be explicit and near the top of the recursive helper

#### Quick Dry Run
In a choose-or-skip recursion, each element creates two children in the recursion tree: include it or exclude it. Backtracking means the included element is removed from the path before exploring the exclude branch.

#### Common Mistakes
- forgetting the rollback step after recursion
- mutating shared state and storing it directly without making a copy for the answer list
- unclear base cases that let recursion continue past a complete or invalid state

#### Debugging Strategy
Write the recursive state as a sentence: “I am at index `i`, and `path` contains the chosen values so far.” If that sentence becomes false after a recursive return, rollback is wrong.

#### Comparison with Similar Pattern
Backtracking is recursive search with reversible state changes. Plain recursion alone may branch, but without rollback discipline shared mutable state quickly becomes corrupted.

#### Advanced Note
Later tree and graph chapters will reuse the same “state on entry, state on exit” discipline for traversal paths, ancestor information, and visited marks.

### Concept Cluster: Canonical Branch Families
Official subtopics covered:
- 10.3 Subsets Pattern
- 10.4 Permutations Pattern

#### Definition or Framing
The Subsets Pattern explores include-or-exclude choices or position-based combination building. The Permutations Pattern explores all orderings by choosing one unused element at each depth.

#### Recognition Signals
- subsets, combinations, power set, choose some elements
- permutations, arrangements, order matters, use each item once
- recursive depth corresponds to position in the built solution

#### Brute-Force Baseline
- subsets: enumerate all bitmasks manually and translate them into element sets
- permutations: generate all possible sequences and filter invalid ones where elements repeat

#### Optimized Pattern Idea
Use backtracking templates matched to the family.

- subsets: recurse by advancing the start index or by include/exclude branching
- permutations: track used elements and try each unused element next

#### Invariant / State Representation / Transition Logic
For subsets, the path contains a valid chosen subset from elements before the current start point. For permutations, the path length equals the current depth, and every used marker matches exactly one element already in the path.

#### Java Implementation Notes
- subsets often use a `startIndex` to avoid duplicates and preserve combination order
- permutations usually need a `boolean[] used` array or swap-based in-place approach
- copy the path when a complete subset or permutation is recorded

#### Quick Dry Run
For subsets of `[1, 2]`, the recursion tree branches into `[]`, `[1]`, `[2]`, and `[1, 2]`. For permutations of `[1, 2, 3]`, depth `0` chooses the first element, depth `1` chooses the second from remaining unused elements, and depth `2` finishes the order.

#### Common Mistakes
- forgetting to advance the start index in subsets and generating duplicates
- forgetting to mark and unmark used elements in permutations
- confusing combinations where order does not matter with permutations where order does matter

#### Debugging Strategy
Print the recursion depth and current path. For permutations, also print the used array. Most duplication or omission bugs show up immediately.

#### Comparison with Similar Pattern
Subsets branch on membership. Permutations branch on position order. They both use backtracking, but the state meaning is different.

#### Advanced Note
Many later combination problems are subsets with extra constraints, while many string arrangement problems are permutations with duplicate-handling rules.

### Concept Cluster: Memoization, Pruning, and Tree Visualization
Official subtopics covered:
- 10.5 Memoization Pattern
- 10.6 Pruning, rollback, and search-tree visualization

#### Definition or Framing
Memoization caches the result of a recursive state so repeated calls reuse it instead of recomputing it. Pruning cuts off branches that cannot lead to a useful answer. Search-tree visualization means drawing or mentally labeling the branching structure so you can see where repeated states, dead ends, and rollback points occur.

#### Recognition Signals
- same parameters lead to the same recursive subproblem many times
- raw recursion repeats identical work
- partial state already violates a constraint or cannot improve the answer
- the recursion feels confusing until the branching tree is drawn explicitly

#### Brute-Force Baseline
- solve every branch independently even when states repeat
- keep exploring branches that are already invalid or dominated

#### Optimized Pattern Idea
Add a cache keyed by the recursive state when subproblems repeat. Add branch checks before descending when the branch cannot help. Visualize the tree to identify repeated states and where rollback or pruning belongs.

#### Invariant / State Representation / Transition Logic
Memoization requires that the cached key fully describes the recursive state that determines the answer. Pruning requires that the rejected branch is truly impossible or provably unnecessary. Rollback ensures that pruning or returning from one branch does not contaminate sibling branches.

#### Java Implementation Notes
- use arrays for memo tables when the state dimensions are small and numeric
- use `HashMap` when states are sparse or compound
- keep pruning checks near the top of the recursive helper or just before the recursive descent

#### Quick Dry Run
In climbing stairs, the state “number of steps remaining” repeats across many branches. In combination sum, once the current candidate exceeds the remaining target in sorted order, later candidates will also be too large, so that branch can be pruned.

#### Common Mistakes
- memoizing incomplete state, which reuses wrong answers
- adding pruning rules that are intuitive but not actually sound
- failing to undo a path mutation before returning early

#### Debugging Strategy
Draw three or four levels of the recursion tree by hand. Mark repeated states and dead branches. That picture usually reveals whether the problem needs memoization, pruning, or both.

#### Comparison with Similar Pattern
Memoization does not change the search tree shape conceptually; it stops re-solving repeated nodes. Pruning changes which nodes are explored at all.

#### Advanced Note
Memoization becomes a direct bridge into dynamic programming later, but in this chapter the focus stays on recursive state and reuse rather than on DP table design.

## 4. Pattern Template, State Model, or Core Workflow

Canonical backtracking template:

```java
void search(State state, List<Integer> path, List<List<Integer>> answer) {
    if (isComplete(state)) {
        answer.add(new ArrayList<>(path));
        return;
    }

    for (Choice choice : validChoices(state)) {
        apply(choice, state, path);
        search(nextState(state, choice), path, answer);
        undo(choice, state, path);
    }
}
```

Canonical memoized recursion template:

```java
int solve(int state, int[] memo) {
    if (isBaseCase(state)) {
        return baseValue(state);
    }
    if (memo[state] != UNVISITED) {
        return memo[state];
    }

    int answer = combineRecursiveResults(state, memo);
    memo[state] = answer;
    return answer;
}
```

Important variables and decision rules:

- recursion parameters define the current node in the search tree
- shared path stores the partial solution
- base case defines when a node is complete or invalid
- rollback restores shared state after each branch
- memo key must capture the entire logical subproblem

Safety rules:

- write the state meaning of each recursive call in one sentence
- record completed solutions using a defensive copy of the path
- place rollback immediately after the recursive call it undoes
- prune only with a sound rule, not a guess
- memoize only when states truly repeat

What usually breaks first is state contamination. A missing rollback, an incomplete memo key, or a weak base case makes later branches inherit the wrong context.

Adapt the template by changing the branching rule, the cached state, or the pruning condition, but keep the search-tree meaning explicit.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Subsets
#### Problem Statement
Given an integer array `nums` of unique elements, return all possible subsets.

#### Why This Example Matters
This is the foundational recursive-search example because the recursion tree is small enough to visualize clearly and the choose-or-skip structure is explicit.

#### Input and Constraints
- all elements are unique
- order inside the subset output is not important
- every subset must be returned exactly once

#### Recognition Signals
- power set or all combinations
- each element can be included or excluded
- need to enumerate every valid branch

#### Brute-Force Approach
Enumerate all bitmasks from `0` to `2^n - 1` and translate each bit pattern into a subset.

#### Better Pattern-Based Approach
Use backtracking with a `startIndex` and a shared path. Record the current path as one valid subset at every call.

#### Why the Pattern Fits
The recursion tree mirrors the structure of the problem: from each point, choose the next element to include, then recurse on later positions only.

#### Invariant or State Transition
At the start of each call, `path` is a valid subset built from indices before `startIndex`, and every future branch only uses indices at or after `startIndex`.

#### Pragmatic Java Choice
Use `List<Integer>` for the path and `List<List<Integer>>` for the answer.

#### Dry Run Before Code
For `[1, 2]`:

- start with `[]`, record it
- choose `1`, record `[1]`
- then choose `2`, record `[1, 2]`
- backtrack and choose `2` directly from the root, record `[2]`

#### Java Solution
```java
import java.util.ArrayList;
import java.util.List;

public class SubsetsSolver {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> answer = new ArrayList<>();
        backtrack(nums, 0, new ArrayList<>(), answer);
        return answer;
    }

    private void backtrack(int[] nums, int startIndex, List<Integer> path, List<List<Integer>> answer) {
        answer.add(new ArrayList<>(path));

        for (int index = startIndex; index < nums.length; index++) {
            path.add(nums[index]);
            backtrack(nums, index + 1, path, answer);
            path.remove(path.size() - 1);
        }
    }
}
```

#### Time and Space Complexity
- Bitmask baseline: $O(n \cdot 2^n)$ time, $O(n)$ auxiliary space besides the output
- Backtracking: $O(n \cdot 2^n)$ time, $O(n)$ recursion depth besides the output

#### Edge Cases
- empty array
- one element
- full subset consisting of all elements

#### Common Mistakes
- forgetting to copy `path` before adding it to the answer
- using `startIndex` incorrectly and generating duplicates or missing subsets
- removing the wrong element during rollback

### Worked Example 2: Permutations
#### Problem Statement
Given an array `nums` of distinct integers, return all possible permutations.

#### Why This Example Matters
This example shows how backtracking changes when order matters and a used-state structure is required.

#### Input and Constraints
- all elements are distinct
- every permutation uses every element exactly once

#### Recognition Signals
- arrangements or orderings
- order matters
- each depth chooses one unused element

#### Brute-Force Approach
Generate all possible sequences of length `n` and filter out sequences that reuse elements or omit some elements.

#### Better Pattern-Based Approach
Use backtracking with a `boolean[] used` array. At each depth, try each currently unused element.

#### Why the Pattern Fits
The recursive depth represents the current position in the permutation, and the used array enforces the “use each element once” rule.

#### Invariant or State Transition
At the start of each call, `path` contains a valid prefix permutation and `used[index]` is true exactly when `nums[index]` already appears in `path`.

#### Pragmatic Java Choice
Use a shared path plus a `boolean[] used` array instead of repeatedly copying filtered candidate lists.

#### Dry Run Before Code
For `[1, 2, 3]`, depth `0` can choose `1`, `2`, or `3`. If depth `0` chooses `2`, then depth `1` can choose only `1` or `3`, and so on until the path length is `3`.

#### Java Solution
```java
import java.util.ArrayList;
import java.util.List;

public class PermutationsSolver {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> answer = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        backtrack(nums, used, new ArrayList<>(), answer);
        return answer;
    }

    private void backtrack(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> answer) {
        if (path.size() == nums.length) {
            answer.add(new ArrayList<>(path));
            return;
        }

        for (int index = 0; index < nums.length; index++) {
            if (used[index]) {
                continue;
            }

            used[index] = true;
            path.add(nums[index]);
            backtrack(nums, used, path, answer);
            path.remove(path.size() - 1);
            used[index] = false;
        }
    }
}
```

#### Time and Space Complexity
- Naive filtered generation: worse than necessary and awkward to reason about
- Backtracking: $O(n \cdot n!)$ time, $O(n)$ recursion depth besides the output

#### Edge Cases
- one element
- empty array depending on output convention
- all elements used exactly once in each result

#### Common Mistakes
- forgetting to unmark `used[index]` during rollback
- reusing the same path object without copying it into the answer
- confusing permutations with combinations and using a start index incorrectly

### Worked Example 3: Combination Sum
#### Problem Statement
Given an array of distinct positive integers `candidates` and a target integer `target`, return all unique combinations where the chosen numbers sum to `target`. The same number may be chosen unlimited times.

#### Why This Example Matters
This example combines backtracking with pruning and rollback, which is where recursive search becomes practical rather than purely exhaustive.

#### Input and Constraints
- candidate values are positive
- candidates are distinct
- a candidate can be reused
- only combinations reaching the target are valid

#### Recognition Signals
- try multiple choices recursively
- partial sum can already become too large
- sorted order can support early pruning

#### Brute-Force Approach
Try all possible sequences of repeated candidate picks and reject those whose sums overshoot or fail to hit the target.

#### Better Pattern-Based Approach
Sort candidates, recurse from a start index so combinations stay unique, and prune as soon as the next candidate exceeds the remaining target.

#### Why the Pattern Fits
The search tree is real, but many branches can be cut early because candidates are positive and sorted. Rollback keeps the shared path clean between sibling branches.

#### Invariant or State Transition
At each call, `remainingTarget` is what still must be formed, and `path` is a valid partial combination whose sum is `originalTarget - remainingTarget`. Because the array is sorted, once `candidates[index] > remainingTarget`, later candidates will also fail.

#### Pragmatic Java Choice
Sort once, then recurse with `remainingTarget` and `startIndex`.

#### Dry Run Before Code
For candidates `[2, 3, 6, 7]` and target `7`:

- choose `2`, remaining target becomes `5`
- choose `2` again, remaining target becomes `3`
- choose `3`, remaining target becomes `0`, record `[2, 2, 3]`
- branch with `6` after remaining target `5` is pruned because `6 > 5`

#### Java Solution
```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class CombinationSumSolver {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> answer = new ArrayList<>();
        backtrack(candidates, target, 0, new ArrayList<>(), answer);
        return answer;
    }

    private void backtrack(int[] candidates, int remainingTarget, int startIndex,
            List<Integer> path, List<List<Integer>> answer) {
        if (remainingTarget == 0) {
            answer.add(new ArrayList<>(path));
            return;
        }

        for (int index = startIndex; index < candidates.length; index++) {
            if (candidates[index] > remainingTarget) {
                break;
            }

            path.add(candidates[index]);
            backtrack(candidates, remainingTarget - candidates[index], index, path, answer);
            path.remove(path.size() - 1);
        }
    }
}
```

#### Time and Space Complexity
- Raw unpruned search: exponential and much wider than necessary
- Backtracking with pruning: still exponential in the worst case, but often much smaller in practice; recursion depth depends on target and candidate sizes

#### Edge Cases
- no solution exists
- target smaller than every candidate
- one candidate used many times

#### Common Mistakes
- forgetting that reuse is allowed and incorrectly recursing with `index + 1`
- pruning without sorting first
- failing to remove the last chosen value during rollback

### Worked Example 4: Climbing Stairs with Memoization
#### Problem Statement
You are climbing a staircase. It takes `n` steps to reach the top. Each time you can climb `1` or `2` steps. Return how many distinct ways there are to reach the top.

#### Why This Example Matters
This is the simplest memoization example because the recursion tree is easy to draw and the repeated states are obvious.

#### Input and Constraints
- `n` is non-negative
- each state depends only on smaller numbers of remaining steps

#### Recognition Signals
- recursion naturally branches
- the same “steps remaining” state appears from multiple paths
- counting, not enumerating full paths, is the goal

#### Brute-Force Approach
Recursively compute `ways(n) = ways(n - 1) + ways(n - 2)` until reaching base cases, without caching results.

#### Better Pattern-Based Approach
Memoize the result for each `stepsRemaining` value so each state is solved once.

#### Why the Pattern Fits
The recursion tree contains many repeated states, such as `ways(3)` being requested from different parent branches. Memoization collapses those repeated subtrees.

#### Invariant or State Transition
`memo[x]` stores the correct number of ways to reach the top from `x` remaining steps. Once computed, that value can be reused wherever the same state appears.

#### Pragmatic Java Choice
Use an `int[] memo` filled with `-1` as the uncomputed marker.

#### Dry Run Before Code
For `n = 5`, raw recursion asks for `ways(4)` and `ways(3)`. Then `ways(4)` asks for `ways(3)` again. Memoization means the second request for `ways(3)` returns immediately.

#### Java Solution
```java
import java.util.Arrays;

public class ClimbingStairsMemoization {
    public int climbStairs(int n) {
        int[] memo = new int[n + 1];
        Arrays.fill(memo, -1);
        return countWays(n, memo);
    }

    private int countWays(int stepsRemaining, int[] memo) {
        if (stepsRemaining <= 1) {
            return 1;
        }

        if (memo[stepsRemaining] != -1) {
            return memo[stepsRemaining];
        }

        memo[stepsRemaining] = countWays(stepsRemaining - 1, memo)
                + countWays(stepsRemaining - 2, memo);
        return memo[stepsRemaining];
    }
}
```

#### Time and Space Complexity
- Raw recursion: $O(2^n)$ time, $O(n)$ recursion depth
- Memoization: $O(n)$ time, $O(n)$ extra space for the memo plus recursion depth

#### Edge Cases
- `n = 0`
- `n = 1`
- large `n` where raw recursion becomes impractical

#### Common Mistakes
- memoizing the wrong state dimension
- using `0` as an uncomputed marker when `0` could be a valid answer in other problems
- thinking memoization is useful even when recursive states never repeat

## 6. Complexity and Comparison Guide

This chapter's patterns differ mainly in how they handle branching.

- Raw recursive search often explores an exponential number of nodes.
- Backtracking keeps the same search shape but makes state handling disciplined and memory-efficient.
- Pruning reduces the number of explored nodes by rejecting impossible or dominated branches early.
- Memoization reduces repeated-state recursion from exponential recomputation to the number of distinct states.

Comparison with similar patterns:

- Backtracking versus brute force: both explore the search tree, but backtracking gives it structure and reversible state updates.
- Memoization versus raw recursion: memoization helps only when different branches reach the same logical state.
- Subsets versus permutations: subsets care about membership, permutations care about order and used-state.
- Pruning versus memoization: pruning removes branches before they are solved; memoization reuses answers when a branch state reappears.

Decision criteria:

- choose plain recursive search when the tree is small and explicit exploration is the goal
- choose backtracking when a shared partial solution must be extended and rolled back
- choose pruning when partial state already proves a branch cannot help
- choose memoization when the same recursive subproblem appears more than once

Signals that you should not force these techniques:

- recursion state is unique every time, so memoization adds overhead without reuse
- branching is unnecessary because a greedy or linear pattern already solves the problem
- pruning rule is not sound and risks cutting valid solutions

What breaks when the invariant or preconditions fail is usually state integrity. A wrong rollback or incomplete memo key creates subtle bugs that look like missing or duplicate solutions.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- weak or missing base cases
- forgetting to undo a mutation after recursion returns
- storing the shared path directly instead of a copy
- memoizing incomplete state
- pruning with a rule that feels plausible but is not actually guaranteed

Boundary and stack risks:

- empty input or depth zero
- deep recursion causing large call stacks
- duplicate values requiring extra handling in some variants
- counting problems where integer overflow may matter for large outputs

Short debugging checklist:

1. What does one recursive call mean in plain language?
2. What are the exact base cases?
3. What changes before the recursive call, and what must be undone after it?
4. Does the memo key fully describe the subproblem?
5. Can I draw the first three levels of the recursion tree and label repeated states or dead branches?

Quick counterexample that defeats a common wrong solution:

If you forget rollback in permutations, choosing `1` first may leave it marked as used when the recursion returns to try starting with `2`. The algorithm then incorrectly misses permutations that should still be available from the new branch.

## 8. Practice Problems

### Easy
- Subsets: Return the full power set of distinct numbers. Expected pattern or core idea: backtracking subsets template.
- Permutations: Return all orderings of distinct numbers. Expected pattern or core idea: backtracking with used array.
- Climbing Stairs: Count ways to reach the top. Expected pattern or core idea: memoized recursion.

### Medium
- Combination Sum: Return combinations reaching a target with unlimited reuse. Expected pattern or core idea: backtracking plus pruning.
- Letter Combinations of a Phone Number: Enumerate all keypad strings. Expected pattern or core idea: recursive search tree.
- Word Break: Decide whether a string can be segmented into dictionary words. Expected pattern or core idea: memoization over repeated suffix states.

### Hard
- N-Queens: Place queens without conflicts. Expected pattern or core idea: backtracking with constraint pruning.
- Expression Add Operators: Insert operators to reach a target value. Expected pattern or core idea: recursive search with rollback and pruning.
- Unique Paths III: Count constrained paths visiting required cells exactly once. Expected pattern or core idea: backtracking with state tracking.

## 9. Short Recap

The core idea of this chapter is that recursive search becomes manageable once each call is treated as a visible node in a search tree with explicit state. The strongest recognition clue is a branching choice structure where a partial path matters. The most important optimization insight is to cut work in two different ways: prune impossible branches and memoize repeated states. The most important implementation warning is that shared state must be rolled back exactly and cached state must be described completely. This chapter prepares the next one by moving from generic recursive search trees into concrete tree traversals, breadth-first tree layers, and ancestor-aware tree state.

## 10. Coverage Check

- 10.1 Recursion Tree Pattern - Covered
- 10.2 Backtracking Pattern - Covered
- 10.3 Subsets Pattern - Covered
- 10.4 Permutations Pattern - Covered
- 10.5 Memoization Pattern - Covered
- 10.6 Pruning, rollback, and search-tree visualization - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 11: Tree Patterns
# 23: Hybrid Pattern Composition

## 0. Introduction

This chapter sits in Part VI - Expert Structures and Hybrid Problem Solving (Weeks 29-34), with the roadmap treating it as advanced to expert work. Its goal is to learn how to solve hard problems by combining smaller known patterns without losing control of correctness, explanation quality, or debugging discipline. This chapter directly supports the Part VI outcome of approaching hard problems as compositions of smaller recognizable moves.

Read it as a bridge in the larger sequence. Chapter 22 focused on game-state and probabilistic reasoning. This chapter widens the lens and asks how to combine multiple familiar patterns inside one hard problem. Chapter 24 shifts from solving hybrid problems to storing the reusable Java templates and snippets that make those solutions faster to implement. Start this chapter after you are comfortable with Chapters 1 through 22, especially prefix sums, monotonic queues, graph traversal, DP, heaps, and the habit of verifying one pattern before adding a second one. The main themes here are Expert Hybrid Pattern, Multi-Pattern Problems, Pattern Combinations across arrays, graphs, and DP, Brute force to optimal workflow for hard problems, Anti-patterns in pattern recognition, and Communication strategy for interviews and contests.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to recognize multi-pattern problems across arrays, graphs, and DP, move from brute force to a composed optimal solution, avoid common hybrid-design anti-patterns, and explain the composition clearly in interviews and contests.

## 1. Intuition First

This chapter matters because many hard problems are not solved by discovering one magical new pattern. They are solved by combining two or three earlier patterns cleanly. The difficult part is not naming more patterns. The difficult part is deciding which layer solves which bottleneck.

The simplest analogy is building a machine from modules. One module filters data, another maintains order, and another optimizes transitions. If two modules overlap or fight each other, the whole design becomes confusing. A good hybrid solution assigns one clear job to each pattern.

The core mental model is:

- hard problems often decompose into one data-transformation layer and one decision layer
- brute force should reveal the bottleneck before any pattern is chosen
- each added pattern should remove one specific bottleneck
- hybrid solutions fail when patterns are stacked without clear responsibilities
- explanation quality matters because hybrid problems are easy to overcomplicate even when the final algorithm is correct

Recognition signals for this chapter:

- one pattern solves part of the problem but leaves a second bottleneck untouched
- arrays, graphs, and DP ideas appear in the same statement
- the input limits rule out the straightforward solution in more than one way
- the final answer needs both preprocessing and search, or both modeling and optimization

The most common beginner confusion point is thinking a hybrid means “use everything I know.” It does not. A hybrid should usually be one dominant pattern plus one supporting pattern, each with a clear role.

In the larger roadmap, this chapter is the bridge from advanced techniques to practical mastery. It teaches how to assemble known ideas without losing rigor.

## 2. Learning Path and Recognition Checklist

The chapter starts with the workflow for moving from brute force to a composed solution. It then covers how hybrids arise across arrays, graphs, and DP, followed by anti-patterns and communication strategy. The through-line is deliberate decomposition: every extra pattern must earn its place.

Recognition checklist for this chapter:

- What is the simplest brute-force baseline, and what exact step is too slow?
- Which part of the problem is data preprocessing, and which part is decision making?
- Can I isolate one pattern that fixes the first bottleneck and another that fixes the second?
- Does one pattern depend on the transformed output of another?
- Am I adding a pattern because it is necessary, or because it feels advanced?
- Can I explain the hybrid in three sentences without hand-waving?

The brute-force baseline usually looks like this:

- nested scans on arrays with repeated state rebuilding
- DFS over a graph state space without pruning or DP reuse
- trying every order or subset directly

The optimization path later becomes:

- transform the raw data into a more query-friendly form
- add a second structure or DP that exploits the transformed view
- keep each pattern's responsibility separate and test them separately when possible

Mastery by the end of the chapter looks like this: you can name the base pattern, the supporting pattern, the bottleneck each removes, and the fallback simpler solution if constraints are smaller.

Do not force hybridization when one pattern already solves the problem. Do not present a final algorithm before you can explain the brute-force failure first.

## 3. Official Subtopic Coverage

### Concept Cluster: From Baseline to Composed Solution
Official subtopics covered:
- 23.1 Expert Hybrid Pattern
- 23.2 Multi-Pattern Problems
- 23.4 Brute force to optimal workflow for hard problems

#### Definition or Framing
The Expert Hybrid Pattern is the deliberate combination of smaller patterns where each one fixes a different bottleneck. Multi-pattern problems become manageable when the brute-force baseline is explicit and each optimization layer has one clear responsibility.

#### Recognition Signals
- one optimization alone is not enough
- the problem statement mixes multiple structure clues
- the final answer needs both faster state discovery and faster state evaluation

#### Brute-Force Baseline
Write the direct search or scan-based approach first and identify exactly which loop or transition causes the blow-up.

#### Optimized Pattern Idea
Introduce one pattern at a time. First transform or restrict the data, then use a second pattern to search or optimize over that transformed state space.

#### Invariant / State Representation / Transition Logic
Each layer must preserve a clear meaning. The transformed representation must still encode the original problem correctly, and the second pattern must operate on that representation without violating its assumptions.

#### Java Implementation Notes
- separate preprocessing helpers from the main solving loop
- name each structure after its role, not after a vague “helper” label
- test the transformed intermediate state on a small example before composing the full solver

#### Quick Dry Run
In a prefix-sum-plus-monotonic-queue problem, the prefix sum layer turns interval sums into differences, and the deque layer maintains the best candidate starts. Each layer solves a different part of the problem.

#### Common Mistakes
- adding two patterns that solve the same bottleneck redundantly
- composing before validating the first transformed state
- using “hybrid” as an excuse for unclear reasoning

#### Debugging Strategy
Temporarily replace one optimized layer with brute force while keeping the other. That often isolates which layer is wrong.

#### Comparison with Similar Pattern
Hybrid composition is not a new algorithm family. It is a design discipline for combining earlier families correctly.

#### Advanced Note
The best hybrid often looks obvious only after the brute-force bottlenecks are named explicitly.

### Concept Cluster: Cross-Domain Combinations
Official subtopics covered:
- 23.3 Pattern Combinations across arrays, graphs, and DP
- 23.1 Expert Hybrid Pattern

#### Definition or Framing
Cross-domain hybrid problems mix ideas from different surfaces: arrays plus monotonic queues, graphs plus DP over stops or subsets, or preprocessing plus greedy decision layers.

#### Recognition Signals
- arrays feed a search structure
- graph state includes an extra DP dimension such as steps used or mask visited
- the recurrence depends on preprocessed order or compressed state

#### Brute-Force Baseline
Treat all dimensions directly, which causes exponential or quadratic blow-up.

#### Optimized Pattern Idea
Choose the first pattern that removes one dimension of repeated work, then choose the second pattern that searches or optimizes over the reduced state space.

#### Invariant / State Representation / Transition Logic
The combined state must be minimal but complete. If the hybrid state drops a needed dimension, the answer becomes incorrect even if each individual pattern is implemented correctly.

#### Java Implementation Notes
- encode hybrid state explicitly in variable names, such as `costByStops` or `prefixIndexDeque`
- avoid reusing one array for two different semantic roles
- document which part is preprocessing and which part is transition logic

#### Quick Dry Run
In graph-plus-DP flight problems, the node alone is not enough state. The number of edges or stops used is part of the state.

#### Common Mistakes
- forgetting one state dimension that changes future choices
- using the wrong supporting pattern because it looked familiar in a different domain
- assuming a graph traversal order still works after adding a stop-count constraint

#### Debugging Strategy
Write one sentence for what the hybrid state means. If that sentence is vague, the implementation usually will be too.

#### Comparison with Similar Pattern
A pure array or pure graph solution often fails because one additional constraint changes what the state must remember.

#### Advanced Note
Hybrid state design is often where hard problems are really won or lost.

### Concept Cluster: Anti-Patterns and Explanation Quality
Official subtopics covered:
- 23.5 Anti-patterns in pattern recognition
- 23.6 Communication strategy for interviews and contests

#### Definition or Framing
Anti-patterns in hybrid reasoning include forcing a familiar pattern without proving fit, skipping the brute-force baseline, and describing the final algorithm as a bag of buzzwords instead of a sequence of responsibilities.

#### Recognition Signals
- the explanation starts with the final structure but never says what it fixes
- too many unrelated keywords appear in the first minute of reasoning
- the candidate cannot justify why simpler alternatives fail

#### Brute-Force Baseline
Present the direct approach and show where it times out or duplicates work.

#### Optimized Pattern Idea
Explain the hybrid as a story of bottlenecks removed one by one.

#### Invariant / State Representation / Transition Logic
A clear explanation names the state, the transitions, and the role of each pattern. If any layer's responsibility is unclear, the hybrid is not yet interview-ready.

#### Java Implementation Notes
- keep helper classes or functions grouped by role
- favor readable method boundaries over one giant solve function
- print or log intermediate transformed states while debugging

#### Quick Dry Run
For an interview answer, the clean version is: “Brute force is `O(n^2)`. Prefix sums convert subarray sums to differences. A monotonic deque maintains candidate starts, giving linear time.”

#### Common Mistakes
- leading with jargon instead of the bottleneck
- describing three patterns when two are actually used
- hiding the state transition behind vague words like “optimize”

#### Debugging Strategy
Force yourself to explain the solution in under one minute. Any missing step in the explanation often matches a bug in the code.

#### Comparison with Similar Pattern
Good communication does not simplify away rigor. It preserves rigor while exposing the structure in a clean order.

#### Advanced Note
In contests, explanation may be private, but the same internal clarity still speeds debugging and implementation.

## 4. Pattern Template, State Model, or Core Workflow

Canonical hybrid-problem workflow:

1. Write the brute-force baseline.
2. Name the exact bottleneck.
3. Choose the first pattern that removes that bottleneck.
4. Re-evaluate the remaining complexity.
5. Add a second pattern only if a second bottleneck remains.
6. State the combined invariant and full state explicitly.

Important variables and safety rules:

- every transformed representation needs a precise meaning
- supporting patterns must consume that transformed representation legally
- hybrid state should be minimal but complete
- if two layers both maintain the same fact, one is probably unnecessary

What usually breaks first:

- lost state dimensions in graph-plus-DP combinations
- composing a monotonic structure with the wrong order assumption
- adding a supporting pattern before the base transformation is validated

When to adapt versus keep the template unchanged:

- keep one-pattern solutions when they already satisfy the constraints
- adapt the hybrid only after you can isolate the remaining bottleneck clearly
- stop adding layers when the solution is already asymptotically and practically sufficient

## 5. Worked Examples and Full Solutions

### Worked Example 1: Shortest Subarray with Sum at Least K
#### Problem Statement
Given an integer array that may contain negative values, return the length of the shortest non-empty subarray whose sum is at least `k`. Return `-1` if none exists.

#### Why This Example Matters
This is a strong array hybrid. Prefix sums alone are not enough, and a monotonic deque alone is not enough. Together they produce a linear-time solution.

#### Input and Constraints
- `1 <= n <= 200000`
- values may be negative, zero, or positive

#### Recognition Signals
- shortest qualifying interval
- negative values make a standard sliding window invalid
- repeated interval sums would be too slow

#### Brute-Force Approach
Check every subarray sum and track the shortest valid length.

#### Better Pattern-Based Approach
Use prefix sums to convert subarray sums into prefix differences. Maintain candidate prefix indices in a monotonic deque so each index enters and leaves once.

#### Why the Pattern Fits
Prefix sums expose interval sums, and the deque maintains only useful candidate starts in order of increasing prefix value.

#### Invariant or State Transition
The deque stores prefix indices with strictly increasing prefix sums. That ensures the front is always the best earliest candidate to satisfy the threshold.

#### Pragmatic Java Choice
Use `long` for prefix sums because large negative and positive values can overflow `int`.

#### Dry Run Before Code
If `prefix[i] - prefix[dequeFront] >= k`, then the front index gives a valid subarray ending at `i`, and any later front replacement can only make that subarray shorter.

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.Deque;

public class ShortestSubarrayHybridExample {
    static int shortestSubarray(int[] values, int k) {
        int n = values.length;
        long[] prefix = new long[n + 1];
        for (int i = 0; i < n; i++) {
            prefix[i + 1] = prefix[i] + values[i];
        }

        int answer = Integer.MAX_VALUE;
        Deque<Integer> deque = new ArrayDeque<>();

        for (int index = 0; index <= n; index++) {
            while (!deque.isEmpty() && prefix[index] - prefix[deque.peekFirst()] >= k) {
                answer = Math.min(answer, index - deque.pollFirst());
            }
            while (!deque.isEmpty() && prefix[index] <= prefix[deque.peekLast()]) {
                deque.pollLast();
            }
            deque.offerLast(index);
        }

        return answer == Integer.MAX_VALUE ? -1 : answer;
    }

    public static void main(String[] args) {
        System.out.println(shortestSubarray(new int[]{2, -1, 2}, 3));
        System.out.println(shortestSubarray(new int[]{1, 2, -1, 2, 3}, 5));
    }
}
```

#### Time and Space Complexity
- Brute force: `O(n^2)`
- Prefix sum plus monotonic deque: `O(n)` time and `O(n)` space

#### Edge Cases
- no valid subarray exists
- one-element valid subarray
- many negative values

#### Common Mistakes
- forcing a normal sliding window even though negatives break its invariant
- forgetting the prefix index `0`
- not maintaining increasing prefix sums in the deque

### Worked Example 2: Cheapest Flights Within K Stops
#### Problem Statement
Given flights `(from, to, price)`, find the cheapest price from `source` to `destination` using at most `k` stops.

#### Why This Example Matters
This problem mixes graph structure with a DP-like stop constraint. A plain shortest-path mindset is incomplete unless the stop count is part of the state.

#### Input and Constraints
- `1 <= n <= 100`
- `0 <= k < n`
- positive edge weights

#### Recognition Signals
- graph edges with costs
- path cost depends on how many edges are allowed
- brute-force DFS grows exponentially

#### Brute-Force Approach
Explore all routes from source to destination using DFS while counting stops.

#### Better Pattern-Based Approach
Use layered Bellman-Ford style relaxation for exactly `k + 1` edge layers. This is a graph-plus-DP hybrid over number of edges used.

#### Why the Pattern Fits
The stop constraint makes “best cost to node” depend on how many edges have been used so far. Layered relaxation captures that state cleanly.

#### Invariant or State Transition
After iteration `step`, the DP array stores the cheapest cost to each node using at most `step` edges.

#### Pragmatic Java Choice
Clone the previous layer before relaxing so one iteration does not accidentally use newly updated values from the same layer.

#### Dry Run Before Code
If only one edge is allowed, only direct flights can be used. Each extra relaxation layer permits one more flight in the route.

#### Java Solution
```java
import java.util.Arrays;

public class CheapestFlightsHybridExample {
    static int findCheapestPrice(int n, int[][] flights, int source, int destination, int k) {
        final int infinity = 1_000_000_000;
        int[] bestCost = new int[n];
        Arrays.fill(bestCost, infinity);
        bestCost[source] = 0;

        for (int step = 0; step <= k; step++) {
            int[] nextCost = bestCost.clone();
            for (int[] flight : flights) {
                int from = flight[0];
                int to = flight[1];
                int price = flight[2];
                if (bestCost[from] != infinity) {
                    nextCost[to] = Math.min(nextCost[to], bestCost[from] + price);
                }
            }
            bestCost = nextCost;
        }

        return bestCost[destination] == infinity ? -1 : bestCost[destination];
    }

    public static void main(String[] args) {
        int[][] flights = {
                {0, 1, 100},
                {1, 2, 100},
                {0, 2, 500}
        };
        System.out.println(findCheapestPrice(3, flights, 0, 2, 1));
    }
}
```

#### Time and Space Complexity
- Brute force DFS: exponential in the number of routes
- Layered relaxation: `O(k * edges)` time and `O(nodes)` space

#### Edge Cases
- no valid route within the stop limit
- direct flight cheaper or more expensive than one-stop route
- cycles in the flight graph

#### Common Mistakes
- treating it as ordinary Dijkstra without encoding the stop constraint carefully
- updating in place inside one layer and accidentally using too many edges
- confusing stops with edges used

### Worked Example 3: Traveling Salesperson on a Small Graph
#### Problem Statement
Given a complete weighted graph on a small number of cities, find the minimum tour cost that starts at city `0`, visits every city exactly once, and returns to city `0`.

#### Why This Example Matters
This is a classic graph-plus-DP hybrid. It shows how a hard search problem becomes manageable when subset state is made explicit.

#### Input and Constraints
- `1 <= n <= 15`
- complete graph represented by a cost matrix

#### Recognition Signals
- brute-force permutations are too expensive
- the state depends on both current city and visited set
- graph structure and DP subset reasoning must work together

#### Brute-Force Approach
Try every permutation of city visits and compute its tour cost.

#### Better Pattern-Based Approach
Use bitmask DP where `dp[mask][city]` is the minimum cost to reach `city` after visiting the set `mask`.

#### Why the Pattern Fits
The graph provides transition costs, and the DP mask prevents revisiting city subsets repeatedly.

#### Invariant or State Transition
`dp[mask][city]` is the cheapest cost for exactly that visited set and end city. Transitions add one unvisited city at a time.

#### Pragmatic Java Choice
Use `int` with a large sentinel for moderate costs; use `long` if edge weights can be much larger.

#### Dry Run Before Code
From `mask = 0011` ending at city `1`, transitions try every unvisited city `next` and update `dp[0011 | (1 << next)][next]`.

#### Java Solution
```java
import java.util.Arrays;

public class TspHybridExample {
    static int tsp(int[][] cost) {
        int n = cost.length;
        int fullMask = 1 << n;
        int infinity = 1_000_000_000;
        int[][] dp = new int[fullMask][n];
        for (int[] row : dp) {
            Arrays.fill(row, infinity);
        }
        dp[1][0] = 0;

        for (int mask = 1; mask < fullMask; mask++) {
            for (int city = 0; city < n; city++) {
                if ((mask & (1 << city)) == 0 || dp[mask][city] == infinity) {
                    continue;
                }
                for (int next = 0; next < n; next++) {
                    if ((mask & (1 << next)) != 0) {
                        continue;
                    }
                    int nextMask = mask | (1 << next);
                    dp[nextMask][next] = Math.min(dp[nextMask][next], dp[mask][city] + cost[city][next]);
                }
            }
        }

        int answer = infinity;
        int allVisited = fullMask - 1;
        for (int city = 1; city < n; city++) {
            answer = Math.min(answer, dp[allVisited][city] + cost[city][0]);
        }
        return answer;
    }

    public static void main(String[] args) {
        int[][] cost = {
                {0, 10, 15, 20},
                {10, 0, 35, 25},
                {15, 35, 0, 30},
                {20, 25, 30, 0}
        };
        System.out.println(tsp(cost));
    }
}
```

#### Time and Space Complexity
- Brute force permutations: `O(n! * n)`
- Bitmask DP: `O(n^2 * 2^n)` time and `O(n * 2^n)` space

#### Edge Cases
- `n = 1`
- asymmetric costs in a directed variant
- very large costs requiring `long`

#### Common Mistakes
- forgetting that the visited set and current city both belong in the state
- double-counting the return edge to the start city
- using this DP beyond the small-`n` regime where it is intended

## 6. Complexity and Comparison Guide

Across the chapter, the main trade-offs are:

- brute-force hybrids: easy to describe, but multiple dimensions of repeated work explode quickly
- array hybrids such as prefix sums plus deque: near-linear when each layer removes a separate bottleneck
- graph-plus-DP hybrids: moderate complexity but often the cleanest answer to path constraints with extra state
- subset-DP hybrids: exponential in a controlled smaller dimension, which is often the right trade for small `n`

Comparison with similar patterns:

- single-pattern solutions are preferable when they already fit the constraints; hybrids are not an automatic upgrade
- DP alone versus graph-plus-DP: plain DP fails when transitions depend on graph edges, while pure graph traversal fails when extra state dimensions matter
- preprocessing plus monotonic structure versus sliding window: sliding window is simpler, but only when its invariant actually holds

Decision criteria:

- choose a hybrid only after naming at least two distinct bottlenecks
- choose the smallest extra state that makes transitions correct
- stop once the complexity is good enough and the explanation remains clear

Signals not to force hybridization:

- a single known pattern already gives acceptable complexity
- the extra pattern duplicates work already handled by the base pattern
- the composed explanation is still unclear after the code “works”

What breaks when invariants fail:

- missing one dimension of state in graph-plus-DP problems
- using a monotonic deque under the wrong order condition
- combining patterns whose assumptions conflict

## 7. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- composing too early and never validating the transformed intermediate state
- state definitions that are incomplete but look plausible on easy inputs
- hiding two different responsibilities inside one variable or helper structure
- describing the solution as a pattern list instead of a dependency chain

Boundary-condition handling:

- hybrid states often need explicit base cases for empty prefix, zero steps, or singleton masks
- negative values can invalidate window-based shortcuts
- path constraints such as stop count or remaining moves must be interpreted consistently

Short debugging checklist:

1. Write the brute-force bottleneck in one line.
2. Name what each pattern removes.
3. Validate the first transformed layer independently.
4. Check that the hybrid state is complete.
5. Compare against brute force on tiny inputs.

Counterexample to a common wrong solution:

Trying to solve shortest subarray with sum at least `k` by a standard sliding window fails when negatives appear. In `[2, -1, 2]` with `k = 3`, shrinking the window greedily destroys the correct answer logic because the sum is not monotone.

## 8. Practice Problems

### Easy
- Longest Substring Without Repeating Characters: combine a hash structure with a moving window; expected pattern or core idea: sliding window plus map.
- Range Sum with Many Queries: combine raw data with prefix preprocessing; expected pattern or core idea: prefix sum as a lightweight hybrid.
- Grid BFS with Obstacles: model state and traversal together; expected pattern or core idea: graph traversal plus state tracking.

### Medium
- Shortest Subarray with Sum at Least K: find the shortest qualifying interval with negatives present; expected pattern or core idea: prefix sums plus monotonic deque.
- Cheapest Flights Within K Stops: optimize cost with a stop constraint; expected pattern or core idea: graph plus DP over edges used.
- Distinct Subsequences: combine string indexing with DP state reuse; expected pattern or core idea: DP plus careful character matching.

### Hard
- Traveling Salesperson for Small N: optimize a full tour over a small graph; expected pattern or core idea: graph plus bitmask DP.
- Hard Interval DP with Preprocessing: combine interval recurrence and faster cost lookup; expected pattern or core idea: DP plus preprocessing layer.
- Multi-Constraint Path Optimization: path cost depends on extra state dimensions; expected pattern or core idea: graph traversal plus DP or state compression.

## 9. Short Recap

The core idea is to compose patterns only when each one removes a distinct bottleneck. The strongest recognition clue is that one good pattern gets the problem closer but still leaves another expensive dimension unresolved. The key optimization insight is to keep each layer's role explicit: transform first, then search or optimize on the transformed state. The most important implementation warning is to avoid hybrid jargon without a precise state definition. This prepares the next chapter because the best hybrid solutions become much easier to implement once you maintain a reusable Java template library.

## 10. Coverage Check

- 23.1 Expert Hybrid Pattern - covered
- 23.2 Multi-Pattern Problems - covered
- 23.3 Pattern Combinations across arrays, graphs, and DP - covered
- 23.4 Brute force to optimal workflow for hard problems - covered
- 23.5 Anti-patterns in pattern recognition - covered
- 23.6 Communication strategy for interviews and contests - covered

- Coverage Summary: 6/6 official subtopics covered
- This must always be 6/6 before final output

Next: 24: Reusable Java Pattern Templates

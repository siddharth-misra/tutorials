# 5: Stack and Queue Driven Patterns

## 0. Introduction

This chapter sits in Part II - Simulation, Ordering, and Search Space Control (Weeks 5-9), with the roadmap treating it as intermediate work. Its goal is to learn how to model algorithm state with stacks, queues, monotonic stacks, and monotonic queues so simulations stay correct, efficient, and easy to reason about. This chapter directly supports the Part II outcome of recognizing when state should be modeled with a stack, queue, or ordered simulation instead of repeated rescans.

Read it as a bridge in the larger sequence. Chapter 4 used pointer movement to manage linear scans. This chapter shifts from moving boundaries to explicit stateful simulation using ordered containers. Chapter 6 takes the idea of controlled state expansion into grids, flood fill, and breadth-first traversal. Start this chapter after you are comfortable with Chapters 1 through 4, especially comfort with Java `ArrayDeque`, loop invariants, and contiguous scans. The main themes here are Stack Simulation Pattern, Queue Simulation Pattern, Monotonic Stack Pattern, Monotonic Queue Pattern, Push-pop invariants and state cleanup rules, and Simulation mistakes that create stale state bugs.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to choose between LIFO, FIFO, monotonic stack, and monotonic queue workflows; explain the push-pop invariant behind each; clean stale state safely; and avoid the bugs that come from mixing unresolved state with expired state.

## 1. Intuition First

This chapter matters because many algorithm problems are really state-machine problems in disguise. The challenge is not finding a clever formula. It is deciding what unresolved work should stay available, what resolved work can be removed, and in what order the pending state should be processed.

The simplest analogy is a help desk. Some tasks are handled in reverse order because the most recent unfinished thing matters first, which is stack behavior. Other tasks are handled in arrival order because fairness matters, which is queue behavior. Some tasks require always keeping only the strongest candidates, which is where monotonic structures appear.

The core mental model is that the container order is not an implementation detail. It is the algorithm's control logic.

- stack: most recent unresolved state matters first
- queue: oldest pending state matters first
- monotonic stack: dominated older candidates can be discarded permanently
- monotonic queue: dominated candidates and expired candidates must both be removed

Recognition signals for this chapter:

- matching, nesting, or undo behavior
- first-in-first-out service or event simulation
- next greater or next smaller element questions
- sliding-window maximum or minimum queries
- repeated cleanup of invalid or expired state

The most common beginner confusion point is thinking that pushing values into a stack or queue is enough. It is not. The real skill is knowing exactly why an element stays, exactly when it leaves, and exactly what the top or front means at every step.

In the larger roadmap, this chapter opens Part II by introducing simulation patterns where correctness comes from ordered state cleanup rather than from hash lookup or pointer movement alone.

## 2. Learning Path and Recognition Checklist

The chapter starts with basic stack and queue simulation because they teach the core idea of pending state. It then upgrades those ideas into monotonic structures, where some elements can be discarded permanently because a better candidate has arrived. Finally, it focuses on cleanup rules and stale-state bugs, because most wrong solutions in this chapter fail there rather than in the choice of data structure itself.

Recognition checklist for this chapter:

- Does the problem care most about the latest unresolved item or the oldest pending item?
- Do future elements need to resolve earlier unanswered elements?
- Is the problem repeatedly asking for the current max or min in a moving window?
- Can some candidates be permanently discarded because a stronger one dominates them?
- Do items expire based on time, index, or boundary movement?
- Will a single push or pop be enough, or must cleanup happen in a loop?

The brute-force baselines are often easy to see:

- rescan backward from each position to find the next greater element
- rescan every current window to find its maximum
- keep a whole history and recompute the active part every time
- simulate a queue by shifting an array or list from the front

The optimized idea is always the same: keep only the state that still matters, and keep it in the order the algorithm needs.

Mastery by the end of the chapter looks like this: you can define what each structure stores, why each stored element is still eligible, and what event should remove it.

Do not force these patterns when the pending order does not matter, when sorting once solves the problem more directly, or when you are using a monotonic structure for a task that does not ask repeated best-candidate queries.

## 3. Official Subtopic Coverage

### Concept Cluster: Basic LIFO and FIFO Simulation
Official subtopics covered:
- 5.1 Stack Simulation Pattern
- 5.2 Queue Simulation Pattern

#### Definition or Framing
The Stack Simulation Pattern models problems where the most recently opened, unresolved, or added state must be handled first. The Queue Simulation Pattern models problems where pending work is handled in arrival order.

#### Recognition Signals
- nested or matched symbols
- undo or backtracking-style state
- event or request processing in arrival order
- layered exploration and time-based expiration

#### Brute-Force Baseline
- repeatedly scan the whole sequence looking for matchable pairs
- store all events in a list and rescan to find which ones still belong to the active range
- remove from index `0` of an `ArrayList` to fake a queue

#### Optimized Pattern Idea
Push unresolved state when it appears. Pop or poll it when a later event resolves or expires it. The structure's front or top always tells you what should be processed next.

#### Invariant / State Representation / Transition Logic
For a stack, the top element is the most recent unresolved state. For a queue, the front element is the earliest still-active state. Every push and pop must preserve that meaning.

#### Java Implementation Notes
- prefer `ArrayDeque` over legacy `Stack`
- use `push`, `pop`, and `peek` for stack behavior
- use `offerLast`, `pollFirst`, and `peekFirst` for queue behavior
- avoid `ArrayList.remove(0)` for queue simulation

#### Quick Dry Run
For parentheses `"([])"`, push opening symbols and pop only when the closing symbol matches the top. For recent calls in the last `3000` milliseconds, enqueue each new timestamp and dequeue old timestamps from the front while they are expired.

#### Common Mistakes
- using the wrong end of the deque
- forgetting to loop on queue cleanup when multiple items expire at once
- popping from an empty stack on malformed input

#### Debugging Strategy
Print the structure after each operation on a tiny example. A wrong push or wrong end is usually obvious immediately.

#### Comparison with Similar Pattern
Stacks are about resolution of the newest pending state. Queues are about processing the oldest pending state. They are not interchangeable just because both can be implemented with a deque.

#### Advanced Note
Later chapters will use queues for BFS frontiers and stacks for DFS-style simulations, but the key idea already appears here: container order defines control flow.

### Concept Cluster: Monotonic Candidate Structures
Official subtopics covered:
- 5.3 Monotonic Stack Pattern
- 5.4 Monotonic Queue Pattern

#### Definition or Framing
A monotonic stack keeps elements in increasing or decreasing order so dominated candidates are removed permanently. A monotonic queue does the same but also supports expiration from the front as a window moves.

#### Recognition Signals
- next greater or next smaller element
- nearest previous or next element satisfying an inequality
- current window maximum or minimum asked repeatedly
- one-pass scan where weaker candidates should never be used again

#### Brute-Force Baseline
- for each index, scan forward until you find a larger value
- for each window, scan all elements to compute the max or min

#### Optimized Pattern Idea
Maintain only candidates that can still become answers. When a stronger current value arrives, pop weaker values from the back or top because they can never win later.

#### Invariant / State Representation / Transition Logic
In a monotonic stack for next greater problems, values or indices on the stack stay in decreasing order, waiting for a future greater element. In a monotonic queue for window maximum, indices in the deque stay in decreasing value order, and the front is always the best current candidate.

#### Java Implementation Notes
- store indices rather than raw values when window boundaries or answer positions matter
- use `while` loops for cleanup because one new element can invalidate many older ones
- remove expired indices from the front before reading the window answer

#### Quick Dry Run
For daily temperatures, when a warmer day arrives, keep popping earlier colder days and fill their answers. For sliding-window maximum, remove smaller values from the back and expired indices from the front.

#### Common Mistakes
- storing values when indices are required for expiration or distance computation
- using `if` instead of `while` during monotonic cleanup
- forgetting to remove out-of-window indices from the queue front

#### Debugging Strategy
On each step, print the indices in the structure and the values they refer to. Verify both the order and the eligibility of every stored index.

#### Comparison with Similar Pattern
Monotonic queues are not heaps. A heap can return the best candidate, but it does not preserve left-to-right window order, so stale elements are harder to remove correctly.

#### Advanced Note
Some hard problems combine monotonic structures with prefix sums, binary search, or DP, but the local invariant remains the same: dominated candidates are removed, and surviving candidates stay ordered.

### Concept Cluster: Cleanup Rules and Stale State Bugs
Official subtopics covered:
- 5.5 Push-pop invariants and state cleanup rules
- 5.6 Simulation mistakes that create stale state bugs

#### Definition or Framing
Simulation code works only if every stored item is still relevant. Push-pop invariants define what the structure is allowed to contain. Cleanup rules define when an item is resolved, dominated, or expired.

#### Recognition Signals
- state becomes invalid after boundaries move
- multiple earlier items may be resolved by one later item
- old candidates remain in memory unless explicitly removed
- wrong answers appear only after several operations, not immediately

#### Brute-Force Baseline
Instead of cleaning state, a brute-force solution recomputes active information from scratch each time. That is simpler but too slow.

#### Optimized Pattern Idea
Keep the structure small and correct by removing stale elements exactly when the invariant says they stop mattering.

#### Invariant / State Representation / Transition Logic
Every stored item must satisfy all three questions:

1. Is it still unresolved or still inside the active range?
2. Is it still eligible to become the answer?
3. Is its relative order inside the structure still valid?

If the answer to any one is no, it must be removed.

#### Java Implementation Notes
- when using indices, encode expiration as an index comparison, not a value comparison
- decide whether cleanup happens before or after reading the answer for the current step
- prefer explicit names like `windowStart`, `currentIndex`, and `candidateIndices`

#### Quick Dry Run
In a sliding-window maximum of size `3`, when processing index `5`, any index `< 3` has expired and must leave the front before the current maximum is read. A stale maximum that stays in the deque can produce a correct-looking answer for some windows and a wrong answer for others.

#### Common Mistakes
- reading the answer before removing expired indices
- popping only one dominated value when several need removal
- mixing queue expiration logic with stack resolution logic
- leaving matched or resolved elements on the stack

#### Debugging Strategy
Describe the structure in plain language at each step: "these are unresolved opening brackets," or "these are candidate maxima still inside the current window, stored from strongest to weakest." If the sentence is false, the bug is local.

#### Comparison with Similar Pattern
The hard part of simulation is rarely pushing new items. It is removing old ones at the correct moment. That is why cleanup rules deserve their own subtopic.

#### Advanced Note
Stale-state bugs in monotonic structures and BFS frontiers later become the same kind of problem: state lingers after its logical validity ended.

## 4. Pattern Template, State Model, or Core Workflow

Canonical stack simulation template:

```java
Deque<Character> stack = new ArrayDeque<>();
for (char symbol : input.toCharArray()) {
    if (isOpening(symbol)) {
        stack.push(symbol);
    } else {
        if (stack.isEmpty() || !matches(stack.peek(), symbol)) {
            return false;
        }
        stack.pop();
    }
}
return stack.isEmpty();
```

Canonical queue simulation template:

```java
Deque<Integer> queue = new ArrayDeque<>();
queue.offerLast(value);
while (!queue.isEmpty() && shouldExpire(queue.peekFirst(), currentState)) {
    queue.pollFirst();
}
```

Canonical monotonic stack template:

```java
Deque<Integer> stack = new ArrayDeque<>();
for (int index = 0; index < nums.length; index++) {
    while (!stack.isEmpty() && nums[index] > nums[stack.peek()]) {
        int previousIndex = stack.pop();
        resolve(previousIndex, index);
    }
    stack.push(index);
}
```

Canonical monotonic queue template:

```java
Deque<Integer> deque = new ArrayDeque<>();
for (int index = 0; index < nums.length; index++) {
    while (!deque.isEmpty() && deque.peekFirst() <= index - windowSize) {
        deque.pollFirst();
    }
    while (!deque.isEmpty() && nums[deque.peekLast()] <= nums[index]) {
        deque.pollLast();
    }
    deque.offerLast(index);
    if (index >= windowSize - 1) {
        record(nums[deque.peekFirst()]);
    }
}
```

Important variables and rules:

- stack top means newest unresolved item
- queue front means oldest still-active item
- monotonic structures usually store indices so value access and expiration both stay possible
- cleanup is often a `while`, not an `if`

Safety rules:

- write the structure meaning in one sentence before coding
- decide exactly when state expires or resolves
- remove stale state before trusting the front or top as an answer
- preserve order and eligibility at every mutation

What usually breaks first is stale state. The code often looks close to correct but keeps one expired candidate for one step too long.

Adapt the templates by changing the stored key, comparison direction, or expiration rule, but do not weaken the cleanup discipline.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Valid Parentheses with a Stack
#### Problem Statement
Given a string containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.

#### Why This Example Matters
This is the standard stack simulation problem because each closing symbol must match the most recent unresolved opening symbol.

#### Input and Constraints
- only bracket characters appear
- every closing bracket must match the correct type and order

#### Recognition Signals
- nested structure
- most recent unresolved opener matters first
- wrong order should fail immediately

#### Brute-Force Approach
Repeatedly remove adjacent valid pairs such as `()` or `[]` from the string until no change occurs, then test whether anything remains.

#### Better Pattern-Based Approach
Push opening brackets onto a stack. When a closing bracket appears, it must match the top of the stack.

#### Why the Pattern Fits
The newest unclosed bracket is exactly the bracket that must be resolved next.

#### Invariant or State Transition
The stack stores unresolved opening brackets in the order they must be matched.

#### Pragmatic Java Choice
Use `ArrayDeque<Character>` and its stack operations.

#### Dry Run Before Code
For `"{[()]}"`:

- push `{`, push `[`, push `(`
- read `)`, matches `(`, pop
- read `]`, matches `[`, pop
- read `}`, matches `{`, pop
- stack is empty, so the string is valid

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.Deque;

public class ValidParentheses {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();

        for (char current : s.toCharArray()) {
            if (current == '(' || current == '[' || current == '{') {
                stack.push(current);
            } else {
                if (stack.isEmpty() || !matches(stack.peek(), current)) {
                    return false;
                }
                stack.pop();
            }
        }

        return stack.isEmpty();
    }

    private boolean matches(char opening, char closing) {
        return (opening == '(' && closing == ')')
                || (opening == '[' && closing == ']')
                || (opening == '{' && closing == '}');
    }
}
```

#### Time and Space Complexity
- Brute-force pair removal: up to $O(n^2)$ time, $O(n)$ extra space
- Stack simulation: $O(n)$ time, $O(n)$ extra space in the worst case

#### Edge Cases
- empty string
- starts with a closing bracket
- extra opening brackets left at the end
- mismatched nested order such as `"([)]"`

#### Common Mistakes
- treating any earlier opening bracket as valid instead of the most recent unresolved one
- forgetting to check whether the stack is empty before peeking
- using the wrong end of the deque

### Worked Example 2: Number of Recent Calls with a Queue
#### Problem Statement
You have a class `RecentCounter` which counts recent requests within the last `3000` milliseconds. Implement `ping(int t)` so it returns the number of requests in the inclusive range `[t - 3000, t]`.

#### Why This Example Matters
This is a clean queue simulation problem because active events expire in arrival order.

#### Input and Constraints
- `t` values arrive in strictly increasing order
- only recent requests matter

#### Recognition Signals
- stream of timestamped events
- oldest active event should leave first
- the answer is the size of the active queue

#### Brute-Force Approach
Store every timestamp and rescan the full history on each `ping` to count which requests still fall inside the valid range.

#### Better Pattern-Based Approach
Enqueue each new timestamp, then dequeue expired timestamps from the front until the queue contains only valid requests.

#### Why the Pattern Fits
Because timestamps arrive in increasing order, expired requests always appear at the front first.

#### Invariant or State Transition
After cleanup, the queue contains exactly the timestamps in the valid interval `[t - 3000, t]`.

#### Pragmatic Java Choice
Use `ArrayDeque<Integer>` for constant-time insertion at the back and removal from the front.

#### Dry Run Before Code
If the calls are `1`, `100`, `3001`, `3002`:

- at `3001`, valid range is `[1, 3001]`, queue size is `3`
- at `3002`, valid range is `[2, 3002]`, timestamp `1` expires and is removed, queue size stays `3`

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.Deque;

public class RecentCounter {
    private final Deque<Integer> recentTimestamps = new ArrayDeque<>();

    public int ping(int timestamp) {
        recentTimestamps.offerLast(timestamp);

        while (!recentTimestamps.isEmpty() && recentTimestamps.peekFirst() < timestamp - 3000) {
            recentTimestamps.pollFirst();
        }

        return recentTimestamps.size();
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n)$ per call, $O(n)$ space
- Queue simulation: amortized $O(1)$ per call, $O(n)$ space for the active history

#### Edge Cases
- first request
- many requests inside the same valid range
- multiple old timestamps expiring on one call

#### Common Mistakes
- removing only one expired timestamp instead of all expired timestamps
- using `<= timestamp - 3000` instead of the correct strict expiration check for the inclusive range
- simulating the queue with front removals from an array list

### Worked Example 3: Daily Temperatures with a Monotonic Stack
#### Problem Statement
Given an array `temperatures`, return an array `answer` such that `answer[i]` is the number of days you have to wait after day `i` to get a warmer temperature. If there is no future day, keep `answer[i] = 0`.

#### Why This Example Matters
This is the classic monotonic-stack pattern because each new temperature resolves earlier colder days.

#### Input and Constraints
- temperatures are processed left to right
- each day wants the next future warmer day
- rescanning forward from each day is too slow

#### Recognition Signals
- next greater element question
- future value resolves earlier unresolved positions
- distance between indices matters

#### Brute-Force Approach
For every day, scan forward until a warmer day appears.

#### Better Pattern-Based Approach
Maintain a decreasing stack of indices whose warmer future day has not been found yet. When a warmer temperature arrives, resolve as many earlier indices as possible.

#### Why the Pattern Fits
If today's temperature is warmer than several earlier unresolved days, it resolves all of them immediately. Those earlier days never need to be revisited again.

#### Invariant or State Transition
Indices in the stack are unresolved and their temperatures are in strictly decreasing order from top to bottom scan perspective.

#### Pragmatic Java Choice
Store indices rather than values so the result distance can be computed.

#### Dry Run Before Code
For `[73, 74, 75, 71, 69, 72, 76, 73]`:

- day `0` waits on the stack until day `1` arrives and resolves it
- day `3` and day `4` both get resolved when day `5` with temperature `72` arrives
- day `6` resolves several earlier days because `76` is warmer than all of them

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.Deque;

public class DailyTemperatures {
    public int[] dailyTemperatures(int[] temperatures) {
        int[] answer = new int[temperatures.length];
        Deque<Integer> unresolvedIndices = new ArrayDeque<>();

        for (int currentIndex = 0; currentIndex < temperatures.length; currentIndex++) {
            while (!unresolvedIndices.isEmpty()
                    && temperatures[currentIndex] > temperatures[unresolvedIndices.peek()]) {
                int previousIndex = unresolvedIndices.pop();
                answer[previousIndex] = currentIndex - previousIndex;
            }

            unresolvedIndices.push(currentIndex);
        }

        return answer;
    }
}
```

#### Time and Space Complexity
- Brute force: $O(n^2)$ time, $O(1)$ extra space
- Monotonic stack: $O(n)$ time, $O(n)$ extra space

#### Edge Cases
- strictly decreasing temperatures
- all equal temperatures
- last day always unresolved

#### Common Mistakes
- storing temperatures instead of indices
- using `if` instead of `while` and resolving only one earlier day
- computing the wait distance from values instead of positions

### Worked Example 4: Sliding Window Maximum with a Monotonic Queue
#### Problem Statement
Given an integer array `nums` and an integer `k`, return the maximum value in every contiguous subarray of size `k`.

#### Why This Example Matters
This is the signature monotonic-queue problem because it combines domination cleanup with window-expiration cleanup.

#### Input and Constraints
- windows move one step at a time
- every window needs its maximum
- repeated full rescans are too slow

#### Recognition Signals
- repeated max query on a moving window
- candidates can expire when they leave the window
- smaller candidates behind a larger newer one can never become useful again

#### Brute-Force Approach
For every window, scan all `k` elements and take the maximum.

#### Better Pattern-Based Approach
Maintain a deque of candidate indices in decreasing value order. Remove expired indices from the front and dominated indices from the back.

#### Why the Pattern Fits
The deque stores exactly the candidates that could still become a current or future window maximum.

#### Invariant or State Transition
The deque contains only indices inside the current window, and their corresponding values are in decreasing order. The front index always points to the current window maximum.

#### Pragmatic Java Choice
Store indices, not values, so both expiration and value comparison are easy.

#### Dry Run Before Code
For `nums = [1, 3, -1, -3, 5, 3, 6, 7]` and `k = 3`:

- when `3` arrives, `1` is removed from the back because it is dominated
- when the window moves past index `1`, that index expires from the front
- when `5` arrives, several weaker values leave the back because they can never be maxima again

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.Deque;

public class SlidingWindowMaximum {
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums.length == 0 || k == 0) {
            return new int[0];
        }

        int[] answer = new int[nums.length - k + 1];
        Deque<Integer> candidateIndices = new ArrayDeque<>();

        for (int currentIndex = 0; currentIndex < nums.length; currentIndex++) {
            while (!candidateIndices.isEmpty() && candidateIndices.peekFirst() <= currentIndex - k) {
                candidateIndices.pollFirst();
            }

            while (!candidateIndices.isEmpty()
                    && nums[candidateIndices.peekLast()] <= nums[currentIndex]) {
                candidateIndices.pollLast();
            }

            candidateIndices.offerLast(currentIndex);

            if (currentIndex >= k - 1) {
                answer[currentIndex - k + 1] = nums[candidateIndices.peekFirst()];
            }
        }

        return answer;
    }
}
```

#### Time and Space Complexity
- Brute force: $O(nk)$ time, $O(1)$ extra space
- Monotonic queue: $O(n)$ time, $O(k)$ extra space

#### Edge Cases
- `k = 1`
- all equal values
- strictly increasing values
- strictly decreasing values

#### Common Mistakes
- forgetting to remove expired indices before reading the answer
- storing raw values and losing expiration information
- removing from the back with `if` instead of `while`

## 6. Complexity and Comparison Guide

The main trade-off in this chapter is between recomputing active state and maintaining only the unresolved or best candidates.

- Stack and queue simulations often reduce repeated rescans to amortized $O(1)$ updates per event.
- Monotonic stacks turn next-greater or next-smaller searches from $O(n^2)$ into $O(n)$.
- Monotonic queues turn repeated moving-window max or min queries from $O(nk)$ into $O(n)$.

Comparison with similar patterns:

- Stack versus recursion: recursion can simulate stack behavior implicitly, but an explicit stack often gives more control over state and avoids deep call stacks.
- Queue versus list rescans: queues are right when expiration or service order is chronological.
- Monotonic queue versus heap: heaps can track a best value, but stale-window cleanup is more cumbersome because the left-to-right order is not built into the structure.
- Monotonic stack versus sorting: sorting changes original order, which next-element problems depend on.

Decision criteria:

- choose a stack when the newest unresolved item should be resolved first
- choose a queue when the oldest still-active item should be removed or processed first
- choose a monotonic stack when future values resolve earlier positions by inequality
- choose a monotonic queue when a moving window repeatedly asks for its best candidate

Signals that you should not force these techniques:

- the problem needs arbitrary global order rather than pending-state order
- the best candidate does not expire with a moving boundary, so a simpler structure may work
- the algorithm never uses the order of unresolved items, so the stack or queue is unnecessary ceremony

What breaks when the invariant fails is usually cleanup. A stale item left inside the structure looks harmless until it reaches the top or front and becomes a wrong answer.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- using the wrong deque end for stack or queue operations
- failing to loop during cleanup when several items should leave at once
- forgetting expiration logic in moving-window problems
- storing values instead of indices when position matters
- reading the answer before cleanup is complete

Boundary and stale-state risks:

- empty input or zero-sized window
- all elements equal, which tests strict versus non-strict comparisons
- large bursts of expired items on one step
- unresolved items that correctly remain until the end and should produce default answers

Short debugging checklist:

1. What does the top or front represent right now?
2. Which events should remove items from this structure?
3. Should cleanup happen before or after reading the current answer?
4. Am I storing indices because I need both values and expiration?
5. Can I print the structure contents after each operation on a five-element test case?

Quick counterexample that defeats a common wrong solution:

In sliding-window maximum, if you do not remove expired indices first, the deque can report a value from a previous window. For `nums = [9, 1, 2]` and `k = 2`, keeping index `0` in front while processing the window `[1, 2]` wrongly reports `9` instead of `2`.

## 8. Practice Problems

### Easy
- Valid Parentheses: Check whether brackets are correctly matched and nested. Expected pattern or core idea: stack simulation.
- Implement Queue using Stacks: Emulate FIFO behavior using LIFO storage. Expected pattern or core idea: queue simulation.
- Number of Recent Calls: Count active requests in the last `3000` milliseconds. Expected pattern or core idea: queue simulation with expiration cleanup.

### Medium
- Daily Temperatures: Return wait time until a warmer day. Expected pattern or core idea: monotonic stack.
- Asteroid Collision: Simulate collisions between moving asteroids. Expected pattern or core idea: stack simulation with repeated resolution.
- Sliding Window Maximum: Return the maximum in each window of size `k`. Expected pattern or core idea: monotonic queue.

### Hard
- Largest Rectangle in Histogram: Compute the maximum rectangle area. Expected pattern or core idea: monotonic stack with boundary computation.
- Shortest Subarray with Sum at Least K: Find the minimum-length qualifying subarray. Expected pattern or core idea: monotonic queue on prefix sums.
- Trapping Rain Water: Compute trapped water between bars. Expected pattern or core idea: stack or two-pointer boundary reasoning.

## 9. Short Recap

The core idea of this chapter is that pending-state order is the algorithm. The strongest recognition clue is that unresolved items or active candidates must be processed in a specific order and cleaned up when they stop mattering. The most important optimization insight is that dominated or expired state should be removed immediately instead of rechecked later. The main implementation warning is that stale-state bugs usually come from correct-looking code with cleanup in the wrong place. This chapter prepares the next one by turning ordered simulation into traversal frontiers, visited state, and layered expansion on grids.

## 10. Coverage Check

- 5.1 Stack Simulation Pattern - Covered
- 5.2 Queue Simulation Pattern - Covered
- 5.3 Monotonic Stack Pattern - Covered
- 5.4 Monotonic Queue Pattern - Covered
- 5.5 Push-pop invariants and state cleanup rules - Covered
- 5.6 Simulation mistakes that create stale state bugs - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 6: Grid and Traversal Patterns
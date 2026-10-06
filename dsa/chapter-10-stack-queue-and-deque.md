# 10: Stack, Queue, and Deque

**Goal:** Teach learners how stack, queue, and deque behavior works, how to implement these structures with arrays or linked nodes, and how to recognize the simulation and expression problems they solve.
**Outcome:** By the end of this chapter, you can explain and implement core stack and queue operations, build a circular queue, use a deque for efficient front-and-back maintenance, and solve common parentheses, expression, and simulation problems in Java.

---

## 1. Intuition First

Stacks, queues, and deques are not just containers. They are rules about where insertion and removal are allowed.

A simple real-world analogy is a cafeteria. A stack is a pile of trays: last in, first out. A queue is a line of people: first in, first out. A deque is a loading dock where work can happen from both ends.

The core mental model is this: once you know which end you are allowed to touch, a surprising number of problems become simple. Parentheses checking, process scheduling, breadth-like simulations, undo behavior, and monotonic-window maintenance all depend more on operation order than on raw storage.

The most common beginner confusion point is mixing the abstract behavior with one specific implementation. A stack can use an array or linked nodes. A queue can use a linked list or a circular array. The behavior is the contract. The implementation is how you realize it efficiently.

In the roadmap, this chapter closes Part II by turning linear traversal ideas into reusable building blocks that appear throughout recursion, trees, graphs, and advanced interview problems.

## 2. Core Concepts and Techniques

### Concept Cluster: Array-Based and Linked Stacks, Queue, and Circular Queue
Key concepts in this block:
- 10.1 Array-based and linked stacks
- 10.2 Queue and circular queue

#### Intuition

A stack touches one end only. A queue adds at the back and removes from the front. A circular queue reuses array slots by wrapping around instead of shifting elements.

#### Why It Matters

These are some of the most reused linear structures in DSA. Their performance depends heavily on choosing the right underlying implementation.

#### How It Works

Stack:
- `push` adds to the top
- `pop` removes from the top
- `peek` reads the top without removing it

Queue:
- `enqueue` adds to the rear
- `dequeue` removes from the front
- `front` reads the next removable value

Circular queue:
- stores `head` and `size` or `head` and `tail`
- uses modular arithmetic to wrap around the array
- avoids `O(n)` shifts on every dequeue

#### Java Implementation Notes

- For everyday Java use, prefer `ArrayDeque` over the legacy `Stack` class.
- Manual array and linked implementations still matter for interviews and invariant understanding.
- Circular queues are best learned with fixed-capacity arrays.

#### Common Mistakes

- using the wrong end for insertion or removal
- forgetting wrap-around logic in a circular queue
- thinking queue dequeue should shift every element in a well-designed implementation
- underflowing or overflowing a fixed-capacity structure

#### Quick Example

```java
class ArrayStackQuickExample {
    static final class IntStack {
        private final int[] data;
        private int size;

        IntStack(int capacity) {
            data = new int[capacity];
        }

        boolean push(int value) {
            if (size == data.length) {
                return false;
            }
            data[size++] = value;
            return true;
        }

        int pop() {
            if (size == 0) {
                return -1;
            }
            return data[--size];
        }
    }
}
```

#### Debugging Tip

Print the logical front, rear, or top indices after each operation. Index bugs are easier to see than final wrong answers.

#### Advanced Note

The abstract operation contract should stay identical even when the implementation changes from array to linked nodes.

### Concept Cluster: Deque Operations and Adapter Structures
Key concepts in this block:
- 10.3 Deque operations and use cases
- 10.4 Queue using stacks
- 10.5 Stack using queues

#### Intuition

A deque supports insertion and removal at both ends. Adapter structures simulate one contract using another contract.

#### Why It Matters

Deque is the practical workhorse for many advanced linear problems. Queue-using-stacks and stack-using-queues teach you to reason about behavior separately from implementation.

#### How It Works

Deque use cases:
- monotonic windows
- task scheduling with both ends active
- palindrome-style or bidirectional processing

Queue using stacks:
- either make enqueue easy and dequeue expensive, or the reverse
- the standard practical design uses two stacks for amortized `O(1)` queue operations

Stack using queues:
- either rotate after every push or do the expensive work on pop
- the usual interview version rotates the queue after push so the newest item reaches the front

#### Java Implementation Notes

- `ArrayDeque` supports stack and deque operations efficiently.
- Queue-using-stacks is an early example of amortized analysis from Chapter 2.
- When teaching the concept, keep operation contracts explicit in comments or method names.

#### Common Mistakes

- forgetting which end of the deque represents the current best candidate in monotonic problems
- assuming amortized `O(1)` means every operation is individually constant time
- rotating a queue incorrectly when simulating a stack
- not transferring elements between stacks at the right moment

#### Quick Example

```java
import java.util.ArrayDeque;
import java.util.Deque;

class QueueUsingStacksQuickExample {
    static final class MyQueue {
        private final Deque<Integer> inStack = new ArrayDeque<>();
        private final Deque<Integer> outStack = new ArrayDeque<>();

        void enqueue(int value) {
            inStack.push(value);
        }

        int dequeue() {
            if (outStack.isEmpty()) {
                while (!inStack.isEmpty()) {
                    outStack.push(inStack.pop());
                }
            }
            return outStack.isEmpty() ? -1 : outStack.pop();
        }
    }
}
```

#### Debugging Tip

List the operations in order on paper and compare them with the data-structure state after each step. Adapter bugs usually show up as contract violations, not syntax mistakes.

#### Advanced Note

Deque often solves problems that look unrelated to stacks or queues at first glance, especially when you need a best candidate from one side and expiry from the other.

### Concept Cluster: Parentheses, Expression, and Simulation Problems
Key concepts in this block:
- 10.6 Parentheses, expression, and simulation problems

#### Intuition

These problems are really about reversible order, pending work, or first-ready processing.

#### Why It Matters

Once you see the operational rule, the right structure often becomes obvious. Nested expressions are stack-shaped. Line processing is queue-shaped. Window maxima often need deque behavior.

#### How It Works

Stack-shaped problems:
- matching nested symbols
- evaluating postfix expressions
- undo or backtracking-like simulations

Queue-shaped problems:
- turn-based processing
- round-robin simulation
- breadth-style scheduling

Deque-shaped problems:
- keep candidates in order while dropping expired ones
- sliding maxima or minima

#### Java Implementation Notes

- For stacks and deques, `ArrayDeque` is usually the best standard-library default.
- For queue behavior, `ArrayDeque` also works well unless the problem requires specialized semantics.
- Manual implementations are still worth writing once so the library is not a black box.

#### Common Mistakes

- pushing opening symbols but checking closings against the wrong order
- confusing postfix and infix evaluation rules
- storing values in a deque when indexes are needed for expiration logic
- picking a queue when the task really needs last-in, first-out behavior

#### Quick Example

```java
import java.util.ArrayDeque;
import java.util.Deque;

class ParenthesesQuickExample {
    static boolean isValid(String text) {
        Deque<Character> stack = new ArrayDeque<>();

        for (int index = 0; index < text.length(); index++) {
            char current = text.charAt(index);
            if (current == '(' || current == '[' || current == '{') {
                stack.push(current);
            } else {
                if (stack.isEmpty()) {
                    return false;
                }
                char open = stack.pop();
                if ((current == ')' && open != '(')
                        || (current == ']' && open != '[')
                        || (current == '}' && open != '{')) {
                    return false;
                }
            }
        }

        return stack.isEmpty();
    }
}
```

#### Debugging Tip

If a simulation problem feels confusing, ask: which item should leave first from the currently pending work? That question often identifies the right structure immediately.

#### Advanced Note

Many so-called simulation problems are secretly data-structure selection problems.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Valid Parentheses
#### Problem Statement

Given a string containing only the characters `()[]{}`, return `true` if the brackets are correctly matched and nested.

#### Why This Example Matters

It is the canonical stack problem. The last unmatched opening bracket must be matched first.

#### Constraints or Assumptions

- input contains only bracket characters
- every closing bracket must match the most recent unmatched opening bracket
- the full string must be consumed with no leftovers

#### Brute-Force Approach

Repeatedly remove every occurrence of `()`, `[]`, and `{}` until the string stops changing. Return `true` if nothing remains.

This works, but it repeatedly rebuilds strings and hides the real structural rule.

#### Better Approach

Use a stack of opening brackets. On each closing bracket, check whether it matches the current stack top.

#### Why the Better Approach Works

Nested delimiters obey last-in, first-out order. The most recent still-open bracket is the only one allowed to close next.

#### Pragmatic Java Choice

Use `ArrayDeque<Character>` as a stack in Java. It is the practical standard choice.

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.Deque;

class ValidParenthesesExample {
    static boolean isValidBruteForce(String text) {
        String previous;
        String current = text;

        do {
            previous = current;
            current = current.replace("()", "")
                    .replace("[]", "")
                    .replace("{}", "");
        } while (!current.equals(previous));

        return current.isEmpty();
    }

    static boolean isValidOptimized(String text) {
        Deque<Character> stack = new ArrayDeque<>();

        for (int index = 0; index < text.length(); index++) {
            char current = text.charAt(index);
            if (current == '(' || current == '[' || current == '{') {
                stack.push(current);
            } else {
                if (stack.isEmpty()) {
                    return false;
                }

                char open = stack.pop();
                if ((current == ')' && open != '(')
                        || (current == ']' && open != '[')
                        || (current == '}' && open != '{')) {
                    return false;
                }
            }
        }

        return stack.isEmpty();
    }
}
```

#### Dry Run

Use `text = "{[()]}"`.

Optimized approach:
- read `{`, push
- read `[`, push
- read `(`, push
- read `)`, pop `(`, match
- read `]`, pop `[`, match
- read `}`, pop `{`, match
- stack ends empty -> return `true`

#### Time and Space Complexity

- Brute force: often `O(n^2)` time because repeated replacements rebuild strings
- Better approach: `O(n)` time, `O(n)` extra space in the worst case

#### Edge Cases

- empty string -> `true`
- starts with a closing bracket -> `false`
- unmatched opening brackets left at the end -> `false`

#### Common Mistakes

- using queue behavior instead of stack behavior
- not checking whether the stack is empty before popping
- only checking counts of brackets instead of nesting order

### Worked Example 2: Design a Circular Queue
#### Problem Statement

Design a fixed-capacity queue supporting `enqueue`, `dequeue`, `front`, `rear`, `isEmpty`, and `isFull`.

#### Why This Example Matters

It teaches the difference between naive queue behavior on an array and an efficient circular-array implementation.

#### Constraints or Assumptions

- capacity is fixed
- operations should not shift all elements on each dequeue
- return `-1` for `front` or `rear` when the queue is empty

#### Brute-Force Approach

Store the queue in an array and shift every element left on each dequeue.

This matches the behavior contract but wastes time.

#### Better Approach

Use a circular array with `head` and `size` so both enqueue and dequeue are `O(1)`.

#### Why the Better Approach Works

The logical front moves through the array without requiring physical shifts. The tail position is computed from `head + size` modulo the capacity.

#### Pragmatic Java Choice

Manual implementation is worth doing here. It teaches the invariant clearly and explains why circular queues exist.

#### Java Solution

```java
class CircularQueueExample {
    static final class NaiveQueue {
        private final int[] data;
        private int size;

        NaiveQueue(int capacity) {
            data = new int[capacity];
        }

        boolean enqueue(int value) {
            if (isFull()) {
                return false;
            }
            data[size++] = value;
            return true;
        }

        boolean dequeue() {
            if (isEmpty()) {
                return false;
            }
            for (int index = 1; index < size; index++) {
                data[index - 1] = data[index];
            }
            size--;
            return true;
        }

        int front() {
            return isEmpty() ? -1 : data[0];
        }

        int rear() {
            return isEmpty() ? -1 : data[size - 1];
        }

        boolean isEmpty() {
            return size == 0;
        }

        boolean isFull() {
            return size == data.length;
        }
    }

    static final class CircularQueue {
        private final int[] data;
        private int head;
        private int size;

        CircularQueue(int capacity) {
            data = new int[capacity];
        }

        boolean enqueue(int value) {
            if (isFull()) {
                return false;
            }
            int tail = (head + size) % data.length;
            data[tail] = value;
            size++;
            return true;
        }

        boolean dequeue() {
            if (isEmpty()) {
                return false;
            }
            head = (head + 1) % data.length;
            size--;
            return true;
        }

        int front() {
            return isEmpty() ? -1 : data[head];
        }

        int rear() {
            if (isEmpty()) {
                return -1;
            }
            int tailIndex = (head + size - 1) % data.length;
            return data[tailIndex];
        }

        boolean isEmpty() {
            return size == 0;
        }

        boolean isFull() {
            return size == data.length;
        }
    }
}
```

#### Dry Run

Use capacity `3`.

Optimized approach:
- enqueue `10` -> `head = 0`, `size = 1`
- enqueue `20` -> tail index `1`, `size = 2`
- enqueue `30` -> tail index `2`, `size = 3`
- dequeue -> move `head` to `1`, `size = 2`
- enqueue `40` -> tail index `(1 + 2) % 3 = 0`, reuse freed slot

Queue order is now `20, 30, 40` without any shifting.

#### Time and Space Complexity

- Brute force: `enqueue` `O(1)`, `dequeue` `O(n)`, `O(n)` space
- Better approach: `O(1)` time for each main operation, `O(n)` space

#### Edge Cases

- dequeue from empty queue -> `false`
- enqueue into full queue -> `false`
- wrapping from the last array index back to `0`

#### Common Mistakes

- confusing capacity with current size
- not using modular arithmetic for wrap-around
- losing track of whether `head` points to the current front or the next insertion slot

### Worked Example 3: Sliding Window Maximum
#### Problem Statement

Given an integer array and a window size `k`, return the maximum value in every contiguous window of length `k`.

#### Why This Example Matters

It is the most important deque use case in early DSA. It combines window expiry on one end with dominance removal on the other.

#### Constraints or Assumptions

- `k` is positive
- if `k` is invalid, return an empty array
- windows are contiguous and fixed-size

#### Brute-Force Approach

For each window, scan all `k` elements and compute the maximum directly.

This works, but it costs `O(nk)` time.

#### Better Approach

Maintain a deque of indexes whose values are in decreasing order. Remove expired indexes from the front and dominated indexes from the back.

#### Why the Better Approach Works

The front of the deque always stores the best candidate for the current window. Any smaller value behind a newly added larger value can never become the maximum while that larger value remains in the window.

#### Pragmatic Java Choice

Store indexes, not values, so you can tell when an element has left the window.

#### Java Solution

```java
import java.util.ArrayDeque;
import java.util.Deque;

class SlidingWindowMaximumExample {
    static int[] maxWindowBruteForce(int[] values, int k) {
        if (k <= 0 || k > values.length) {
            return new int[0];
        }

        int[] result = new int[values.length - k + 1];
        for (int start = 0; start + k <= values.length; start++) {
            int maximum = values[start];
            for (int index = start + 1; index < start + k; index++) {
                maximum = Math.max(maximum, values[index]);
            }
            result[start] = maximum;
        }

        return result;
    }

    static int[] maxWindowOptimized(int[] values, int k) {
        if (k <= 0 || k > values.length) {
            return new int[0];
        }

        int[] result = new int[values.length - k + 1];
        Deque<Integer> deque = new ArrayDeque<>();

        for (int right = 0; right < values.length; right++) {
            while (!deque.isEmpty() && deque.peekFirst() <= right - k) {
                deque.pollFirst();
            }

            while (!deque.isEmpty() && values[deque.peekLast()] <= values[right]) {
                deque.pollLast();
            }

            deque.offerLast(right);

            if (right >= k - 1) {
                result[right - k + 1] = values[deque.peekFirst()];
            }
        }

        return result;
    }
}
```

#### Dry Run

Use `values = [1, 3, -1, -3, 5, 3, 6, 7]` and `k = 3`.

Optimized approach:
- process `1`, deque `[0]`
- process `3`, remove index `0` because `3` dominates `1`, deque `[1]`
- process `-1`, deque `[1, 2]`, first full window max is `3`
- process `-3`, deque `[1, 2, 3]`, next max still `3`
- process `5`, remove expired `1`, then remove dominated `3` and `2`, deque `[4]`, max becomes `5`
- continue similarly to produce `[3, 3, 5, 5, 6, 7]`

#### Time and Space Complexity

- Brute force: `O(nk)` time, `O(1)` extra space beyond the output
- Better approach: `O(n)` time, `O(k)` extra space

#### Edge Cases

- `k = 1` -> every element is its own window maximum
- `k` equal to array length -> one answer
- repeated equal values still work correctly with the dominance rule used consistently

#### Common Mistakes

- storing values instead of indexes in the deque
- forgetting to remove expired indexes before reading the maximum
- removing from the wrong end when enforcing monotonic order

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- array-based or linked manual implementations usually keep core operations at `O(1)` when designed correctly
- naive array queues can degrade dequeue to `O(n)` due to shifting
- deque-based optimizations can reduce fixed-window brute force from `O(nk)` to `O(n)`
- adapter structures such as queue using stacks rely on amortized, not worst-case-per-operation, reasoning

Choose manual implementations when:
- you need to learn or prove the invariant
- the interview asks you to design the structure
- understanding index or pointer behavior is part of the goal

Choose library support when:
- the problem is about the algorithm using the structure, not designing it
- `ArrayDeque` matches the required semantics cleanly
- you want reliable `O(1)`-style end operations without re-implementing container details

Recognition signals for these structures:
- last-opened item must close first -> stack
- earliest pending item must process first -> queue
- both ends need efficient access -> deque
- the problem is described as parentheses, expression evaluation, undo, scheduling, or monotonic candidate maintenance

Signals not to force these techniques:
- the problem is really about random access by index
- ordering alone is not the core issue
- a simpler array scan solves the task just as well

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- using the wrong end of the structure
- forgetting empty or full checks
- mismanaging wrap-around in circular queues
- using values instead of indexes in deque window problems

Boundary and mutation risks:
- empty input for parentheses or simulation tasks
- fixed-capacity overflow and underflow
- stale elements remaining in a deque after they expire from a window
- incorrect amortized reasoning for queue using stacks

Short debugging checklist:
- What operation contract does this problem need: LIFO, FIFO, or both ends?
- Which end am I adding to and removing from?
- If the structure is circular, how do I detect full versus empty?
- If I am using a deque for a window, how do expired elements leave?
- Am I solving the structure-design problem or the algorithm-that-uses-the-structure problem?

## 6. Practice Problems

### Easy

- Title: Valid Parentheses
  - One-line prompt: Decide whether a bracket string is correctly nested.
  - Expected pattern or core idea: Stack for last unmatched opener.
- Title: Implement Queue using Stacks
  - One-line prompt: Build FIFO behavior using only stack operations.
  - Expected pattern or core idea: Two-stack transfer with amortized analysis.
- Title: Baseball Game
  - One-line prompt: Evaluate a sequence of score operations with undo-like behavior.
  - Expected pattern or core idea: Stack simulation.

### Medium

- Title: Evaluate Reverse Polish Notation
  - One-line prompt: Evaluate a postfix expression.
  - Expected pattern or core idea: Stack-based operand management.
- Title: Daily Temperatures
  - One-line prompt: For each day, find how long until a warmer temperature appears.
  - Expected pattern or core idea: Monotonic stack of indexes.
- Title: Design Circular Queue
  - One-line prompt: Support queue operations efficiently on fixed capacity.
  - Expected pattern or core idea: Circular array with front and size.

### Hard

- Title: Sliding Window Maximum
  - One-line prompt: Return the maximum value in every fixed-size window.
  - Expected pattern or core idea: Monotonic deque of indexes.
- Title: Largest Rectangle in Histogram
  - One-line prompt: Find the maximum rectangle area in a histogram.
  - Expected pattern or core idea: Monotonic stack with boundary reasoning.
- Title: Basic Calculator
  - One-line prompt: Evaluate an arithmetic expression with parentheses.
  - Expected pattern or core idea: Stack-based expression state management.

## 7. Short Recap

The core idea of this chapter is that stack, queue, and deque problems become much easier once you identify which end should process work next.

The most important optimization insight is that the right linear structure often turns repeated shifting or repeated rescanning into clean `O(1)` end operations or one-pass simulations.

The most important implementation warning is to separate behavior from implementation. The contract decides the structure. The array or linked representation only realizes it efficiently.

This chapter prepares the next chapter by making stack behavior intuitive before recursion formalizes the call stack and backtracking ideas.

## 8. Coverage Check

- [x] 10.1 Array-based and linked stacks
- [x] 10.2 Queue and circular queue
- [x] 10.3 Deque operations and use cases
- [x] 10.4 Queue using stacks
- [x] 10.5 Stack using queues
- [x] 10.6 Parentheses, expression, and simulation problems

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 11: Recursion
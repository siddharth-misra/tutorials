# 7: Linked List + Stack + Queue + Deque

## Introduction and Context

This chapter moves from plain index-based traversal into structures where correctness depends on disciplined updates at the ends and between nodes. A wrong array index usually produces an obvious bug. A wrong link update or stale stack, queue, or deque state can quietly damage the structure and mislead every later operation.

These structures are useful precisely because they restrict access. Linked lists make rewiring cheap when you already know the position. Stacks and queues keep insertion and removal simple by limiting which end you can touch. Deques open both ends but still avoid the cost of arbitrary middle edits. Monotonic variants go further and remove state that can no longer influence future answers. The recurring failures are lost links, underflow, stale indexes, wrong wraparound math, and cleanup done in the wrong order.

## Core Intuition and Mechanics
Think of these structures as controlled-access views over data rather than general-purpose containers.

- A **linked list** makes structural edits cheap when the neighboring nodes are already known.
- A **stack** stores the most recent unresolved state.
- A **queue** stores the oldest pending work.
- A **deque** gives both ends while still avoiding arbitrary middle edits.

The mechanics that matter are invariant ownership and cleanup order:

- For linked lists, know which pointers define the current shape and what must be saved before rewiring.
- For stacks, queues, and deques, know which end is authoritative and when empty, full, or stale conditions are checked.
- For monotonic structures, know which elements can no longer influence future answers and must be removed immediately.
- For simulation problems, know exactly which state persists between steps and what must be reset.

Correctness in this chapter comes from naming the invariant before coding, updating only the state that is supposed to change, and checking edge cases such as empty structures, single elements, or full circular buffers as part of the normal design instead of as afterthought patches.

## Core Concepts and Subtopics

### Concept Cluster: Linked List Shapes and Navigation
Topics in this cluster:
- 7.1 Singly linked lists; Doubly linked lists; Circular linked lists

#### Definition
- Singly linked list: node has value + next pointer.
- Doubly linked list: node has value + prev + next pointers.
- Circular linked list: last node points back to head (or tail loops to head).

#### Why It Matters
These models enable O(1) inserts/deletes at known positions (like head/tail) without shifting large memory blocks.

#### How It Works
- Singly list is minimal memory, simple forward traversal.
- Doubly list supports backward traversal and easier middle-node deletion.
- Circular list simplifies repeated round-robin traversal.

#### Internal Mechanics
Each node is a separate object. Traversal is pointer chasing, so cache locality is weaker than arrays. This affects real-world performance even when asymptotic complexity matches.

#### Java Implementation Notes
- Use static nested `Node` classes when practical.
- Maintain head and tail when you need O(1) append.
- For circular lists, define one authority pointer (usually tail) to reduce ambiguity.

#### Clean Code Rules If Applicable
- Keep list mutation logic in one method per operation (`insertAtHead`, `deleteByValue`, etc.).
- Do not duplicate pointer fix-up logic across methods.
- Use explicit null checks early.

#### Mini Example
Insert 3 values into singly list: `1 -> 2 -> 3 -> null`.

#### Common Mistakes
- Losing the rest of list by overwriting `next` too early.
- Forgetting to update tail when deleting last node.
- Infinite loop in circular list traversal due to wrong stop condition.

#### Debugging Tips
Print node identities and values during mutation. For circular lists, add max-step guard in debug traversals.

#### Practical Note
State both complexity and hidden practical trade-off: linked list has pointer overhead and poor cache locality.

#### Deeper Note
Circular doubly lists are useful for LRU caches and scheduler loops because removal and insertion at known nodes are O(1).

#### Related Concepts
- Memory layout
- object allocation pressure
- iterator safety

---

### Concept Cluster: Pointer Manipulation and Structural Transformations
Topics in this cluster:
- 7.2 Reversal techniques; Merge and pointer manipulation problems; Cycle detection

#### Definition
Pointer manipulation means changing links without losing reachable nodes.

#### Why It Matters
Many high-value interview and production operations are just careful link rewrites.

#### How It Works
- Reversal: reroute each node's next to previous.
- Merge: progressively connect smaller head among two sorted lists.
- Cycle detection: Floyd's fast/slow pointers.

#### Internal Mechanics
For reversal, invariant during iteration:
- `prev` is already reversed prefix.
- `curr` is current node to process.
- `next` stores the not-yet-processed suffix entry.

For cycle detection:
- If fast pointer catches slow pointer, cycle exists.
- Reset one pointer to head; move both one step to get cycle start.

#### Java Implementation Notes
- Favor iterative reverse for stack safety.
- For merge, use dummy node to simplify head handling.
- For cycle problems, keep methods pure and avoid mutating list.

#### Clean Code Rules If Applicable
- Use small helper methods: `reverse`, `mergeSorted`, `findCycleStart`.
- Document pointer invariants in short comments where non-obvious.

#### Mini Example
Reverse `1->2->3` becomes `3->2->1`.

#### Common Mistakes
- Not storing `next` before changing `curr.next`.
- Advancing wrong pointer in merge.
- Mistaking value equality for node identity in cycle detection.

#### Debugging Tips
Draw 3-pointer table (`prev/curr/next`) per iteration.

#### Practical Note
You can derive cycle start proof quickly with distance equations from meeting point.

#### Deeper Note
Acyclic merge and in-place reverse are examples of local rewiring; similar reasoning appears later in tree rotations.

#### Related Concepts
- two pointers
- loop invariants
- shape preservation

---

### Concept Cluster: Stack Foundations and Simulation Thinking
Topics in this cluster:
- 7.3 Array-based and linked stacks; Stack Simulation Pattern

#### Definition
Stack is LIFO. Operations: push, pop, peek.

#### Why It Matters
Stacks model nested scopes, recursion frames, undo history, expression parsing, and nearest-greater type problems.

#### How It Works
- Array stack: contiguous storage + top index.
- Linked stack: node chain with head as top.
- Simulation pattern: process stream and keep only required unresolved state on stack.

#### Internal Mechanics
Array stack benefits from cache locality and fewer allocations. Linked stack avoids resizing cost but allocates per push.

#### Java Implementation Notes
- For production Java, prefer `ArrayDeque` over `Stack`.
- Avoid legacy `java.util.Stack` unless required by environment constraints.

#### Clean Code Rules If Applicable
- Encapsulate stack operations in a class when behavior is domain-specific.
- Prefer descriptive names (`operandStack`, `indexStack`) over generic `st` in production.

#### Mini Example
Balanced parentheses uses stack of opening brackets.

#### Common Mistakes
- Popping from empty stack without guard.
- Forgetting final stack-empty validation.

#### Debugging Tips
Log token and stack snapshot each step for parser/simulation bugs.

#### Practical Note
For nearest greater/smaller, stack usually stores indexes, not values, to compute spans/distances.

#### Deeper Note
Stack simulation is often a compressed state machine.

#### Related Concepts
- recursion stack
- monotonic stack
- expression evaluation

---

### Concept Cluster: Queue Models and Circular Buffer Discipline
Topics in this cluster:
- 7.4 Queue and circular queue; Queue Simulation Pattern

#### Definition
Queue is FIFO. Operations: offer, poll, peek.

#### Why It Matters
Queues model arrival order: task scheduling, BFS, rate-limiter pipelines.

#### How It Works
- Linked queue: head remove, tail add.
- Circular queue: fixed array with wraparound indexes.
- Simulation pattern: events processed in insertion order.

#### Internal Mechanics
Circular queue uses modulo arithmetic. Distinguish empty and full using either:
- separate size counter, or
- one reserved slot strategy.

#### Java Implementation Notes
- `ArrayDeque` is usually best general queue.
- For fixed-capacity high-throughput pipelines, custom circular array is predictable.

#### Clean Code Rules If Applicable
- Isolate index math in helpers (`inc(index)`), reducing off-by-one errors.

#### Mini Example
Round-robin packet processing queue.

#### Common Mistakes
- Overwriting data when full state is not correctly checked.
- Mixing inclusive/exclusive boundaries for head and tail.

#### Debugging Tips
Print `(head, tail, size)` after every operation.

#### Practical Note
Mention amortized growth behavior of dynamic arrays versus strict O(1) for fixed circular buffers.

#### Deeper Note
Backpressure systems often combine queue + capacity policy + drop/retry strategy.

#### Related Concepts
- BFS frontier
- producer-consumer
- bounded buffers

---

### Concept Cluster: Deque and Structure Conversions
Topics in this cluster:
- 7.5 Deque operations and use cases; Queue using stacks; Stack using queues

#### Definition
Deque supports insertion/removal at both front and back.

#### Why It Matters
It unifies stack and queue behaviors and powers sliding-window maxima and many simulations.

#### How It Works
- `addFirst/addLast/removeFirst/removeLast`.
- Queue using two stacks: inbound + outbound transfer.
- Stack using queues: rotate elements after push or costly pop approach.

#### Internal Mechanics
Queue using stacks provides amortized O(1) because each element transfers at most once from input stack to output stack.

#### Java Implementation Notes
- Use `ArrayDeque<Integer>` for deque-heavy algorithms.
- For queue-using-stacks, keep methods small and explicit.

#### Clean Code Rules If Applicable
- Name conversion components by role (`inStack`, `outStack`).
- Keep transfer logic private and reusable.

#### Mini Example
Implement queue with two stacks for interview API class.

#### Common Mistakes
- Transferring on every operation instead of only when needed.
- Breaking order during stack-via-queue rotation.

#### Debugging Tips
Test alternating operation sequences, not just batched pushes/pops.

#### Practical Note
Say both worst-case and amortized complexities.

#### Deeper Note
This is a concrete example of representation independence: same abstract API, different internal structures.

#### Related Concepts
- amortized analysis
- adapter-like design

---

### Concept Cluster: Monotonic Structures and Invariants
Topics in this cluster:
- 7.6 Monotonic Stack Pattern; Monotonic Queue Pattern; Push-pop invariants and state cleanup rules

#### Definition
- Monotonic stack keeps elements/indexes in increasing or decreasing order.
- Monotonic queue does similar maintenance across moving windows.

#### Why It Matters
Converts many O(n^2) nearest-greater/window-extreme problems into O(n).

#### How It Works
- While incoming value violates monotonic order, pop from end.
- Push current index/value.
- Remove stale indexes outside allowed range.

#### Internal Mechanics
Each index is pushed once and popped once at most, so total operations are linear.

#### Java Implementation Notes
Store indexes to support staleness checks and value lookup.

#### Clean Code Rules If Applicable
- Keep invariant in method-level comment.
- Split cleanup into two phases: order cleanup, then staleness cleanup.

#### Mini Example
Sliding window maximum in O(n) with decreasing deque.

#### Common Mistakes
- Forgetting stale index removal.
- Using values instead of indexes and losing position context.
- Cleaning in wrong order causing stale or incorrect maxima.

#### Debugging Tips
Track deque as `(index:value)` after each step.

#### Practical Note
Say the invariant aloud before coding; it prevents 80% of bugs.

#### Deeper Note
Monotonic structures are local convex hull-like filters over stream prefixes.

#### Related Concepts
- amortized O(1)
- deque discipline
- linear-time optimization

---

### Concept Cluster: Parentheses, Expressions, and Robust Simulation
Topics in this cluster:
- 7.7 Parentheses, expression, and simulation problems; Simulation mistakes that create stale state bugs

#### Definition
Simulation problems mimic rule-driven systems step by step with explicit state.

#### Why It Matters
Many interview tasks appear different but are stack/queue/deque simulations in disguise.

#### How It Works
- Parentheses: stack + matching map.
- Expression evaluation: operator precedence + operand stack(s).
- Simulation: deterministic updates per event.

#### Internal Mechanics
Correctness comes from maintaining a complete state model and applying transitions in the proper order.

#### Java Implementation Notes
- Tokenize clearly.
- Separate parse and evaluate stages where possible.
- Use enums or clear constants for operators in larger evaluators.

#### Clean Code Rules If Applicable
- Do not mix parsing with side effects everywhere.
- Keep invalid-input handling explicit.

#### Mini Example
Evaluate postfix using operand stack.

#### Common Mistakes
- Forgetting to consume all pending operators.
- Not handling spaces/multi-digit numbers.
- Stale state from reused buffers between test cases.

#### Debugging Tips
Log token, action, and stack states after each token.

#### Practical Note
Mention how you validate malformed input and why.

#### Deeper Note
Simulation correctness is often equivalent to a finite-state machine with carefully defined transitions.

#### Related Concepts
- parser design
- state machines
- defensive programming

## Worked Examples

### Worked Example 1: Reverse a Singly Linked List
#### Problem or Design Scenario
Given the head of a singly linked list, reverse it in-place and return new head.

#### Technical Value
This is a standard pointer-manipulation problem and a base for many advanced list transformations.

#### Constraints or Assumptions
- Number of nodes: `0 .. 10^5`
- Node values fit in `int`
- Must be iterative and O(1) extra space

#### Example Input/Output or Usage Scenario
Input: `1 -> 2 -> 3 -> 4 -> null`  
Output: `4 -> 3 -> 2 -> 1 -> null`

#### Brute Force or Naive Approach
Copy values to array/list, then rebuild reversed list.
- Time: O(n)
- Extra space: O(n)

#### Better or Optimized Approach
Iteratively reverse links with three pointers (`prev`, `curr`, `next`).

#### Why the Better Approach Works
At each step, one node is moved from unreversed suffix to reversed prefix while preserving remaining list via `next` temporary reference.

#### Decision Process
- Start with safety: never lose `next`.
- Keep loop invariant explicit.
- Prefer iterative over recursive for large inputs to avoid stack overflow.

#### Java Solution
```java
import java.util.*;

public class ReverseLinkedListExample {
    static class Node {
        int val;
        Node next;

        Node(int val) {
            this.val = val;
        }
    }

    public static Node reverse(Node head) {
        Node prev = null;
        Node curr = head;

        while (curr != null) {
            Node next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }

    public static Node build(int... values) {
        Node dummy = new Node(0);
        Node tail = dummy;
        for (int v : values) {
            tail.next = new Node(v);
            tail = tail.next;
        }
        return dummy.next;
    }

    public static String toString(Node head) {
        StringBuilder sb = new StringBuilder();
        Node cur = head;
        while (cur != null) {
            sb.append(cur.val).append(" -> ");
            cur = cur.next;
        }
        sb.append("null");
        return sb.toString();
    }

    public static void main(String[] args) {
        Node head = build(1, 2, 3, 4);
        Node reversed = reverse(head);
        System.out.println(toString(reversed));
    }
}
```

#### Dry Run
For `1 -> 2 -> 3`:
1. `prev=null`, `curr=1`, `next=2`, set `1.next=null`, move `prev=1`, `curr=2`
2. `next=3`, set `2.next=1`, move `prev=2`, `curr=3`
3. `next=null`, set `3.next=2`, move `prev=3`, `curr=null`
4. return `prev=3`

#### Time and Space Complexity
- Time: O(n)
- Space: O(1)

#### Edge Cases
- Empty list
- Single node
- Very long list

#### Common Mistakes
- Forgetting `next = curr.next` before rewiring.
- Returning `head` instead of `prev`.

#### Related Variants
- Reverse sublist between positions `m` and `n`
- Reverse in groups of `k`

#### Validation
Test `[]`, `[7]`, `[1,2]`, repeated values, and long random lists.

---

### Worked Example 2: Daily Temperatures with Monotonic Stack
#### Problem or Design Scenario
Given temperatures array, for each day find how many days until a warmer temperature; otherwise 0.

#### Technical Value
Classic monotonic stack pattern. Teaches nearest-greater-on-right logic with index stack.

#### Constraints or Assumptions
- `1 <= n <= 10^5`
- temperature range small but algorithm should work generally

#### Example Input/Output or Usage Scenario
Input: `[73,74,75,71,69,72,76,73]`  
Output: `[1,1,4,2,1,1,0,0]`

#### Brute Force or Naive Approach
For each index, scan right until warmer day found.
- Time: O(n^2)
- Space: O(1)

#### Better or Optimized Approach
Use decreasing monotonic stack of indexes.

#### Why the Better Approach Works
When current temperature is higher than stack top's temperature, current day is the answer for that top index. Each index is pushed once and popped once.

#### Decision Process
- Store indexes, not values.
- Use while-pop to resolve all now-satisfied previous days.
- Keep answer default 0 to reduce branching.

#### Java Solution
```java
import java.util.*;

public class DailyTemperaturesExample {
    public static int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] ans = new int[n];
        Deque<Integer> stack = new ArrayDeque<>(); // decreasing by temperature

        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                int prev = stack.pop();
                ans[prev] = i - prev;
            }
            stack.push(i);
        }
        return ans;
    }

    public static void main(String[] args) {
        int[] input = {73, 74, 75, 71, 69, 72, 76, 73};
        System.out.println(Arrays.toString(dailyTemperatures(input)));
    }
}
```

#### Dry Run
At `i=2 (75)`, stack has `[1(74)]`, `75 > 74`, pop 1, set `ans[1]=1`; then compare with `0(73)`, pop, set `ans[0]=2`; push 2.

#### Time and Space Complexity
- Time: O(n)
- Space: O(n)

#### Edge Cases
- Strictly decreasing temperatures -> all 0.
- Single element.

#### Common Mistakes
- Using `>=` instead of `>` if problem requires strictly warmer.
- Pushing values instead of indexes.

#### Related Variants
- Next greater element in circular array.
- Stock span.

#### Validation
Use monotonic increasing, decreasing, equal values, and random arrays.

---

### Worked Example 3: Sliding Window Maximum with Monotonic Queue
#### Problem or Design Scenario
Given array `nums` and window size `k`, return max for each window.

#### Technical Value
This is a standard monotonic-queue problem and combines deque monotonicity with stale-state cleanup.

#### Constraints or Assumptions
- `1 <= k <= n <= 10^5`

#### Example Input/Output or Usage Scenario
Input: `nums=[1,3,-1,-3,5,3,6,7], k=3`  
Output: `[3,3,5,5,6,7]`

#### Brute Force or Naive Approach
For each window, scan k elements for max.
- Time: O(nk)

#### Better or Optimized Approach
Maintain deque of indexes with decreasing values.

#### Why the Better Approach Works
Front always holds max index for current window. Back is cleaned so values remain decreasing. Stale indexes (`<= i-k`) are removed from front.

#### Decision Process
- Write operations in fixed order:
  1. drop stale front
  2. drop smaller back
  3. push current index
  4. record answer when first full window forms

#### Java Solution
```java
import java.util.*;

public class SlidingWindowMaximumExample {
    public static int[] maxSlidingWindow(int[] nums, int k) {
        int n = nums.length;
        if (k == 1) {
            return Arrays.copyOf(nums, n);
        }

        int[] ans = new int[n - k + 1];
        Deque<Integer> dq = new ArrayDeque<>(); // indexes, values decreasing

        for (int i = 0; i < n; i++) {
            while (!dq.isEmpty() && dq.peekFirst() <= i - k) {
                dq.pollFirst();
            }

            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) {
                dq.pollLast();
            }

            dq.offerLast(i);

            if (i >= k - 1) {
                ans[i - k + 1] = nums[dq.peekFirst()];
            }
        }

        return ans;
    }

    public static void main(String[] args) {
        int[] nums = {1, 3, -1, -3, 5, 3, 6, 7};
        System.out.println(Arrays.toString(maxSlidingWindow(nums, 3)));
    }
}
```

#### Dry Run
At `i=4 (5)` with `k=3`:
- Remove stale index 1 for window `[2..4]`.
- Remove back indexes with smaller values `-3` and `-1`.
- Push 4.
- Front points to value 5.

#### Time and Space Complexity
- Time: O(n)
- Space: O(k) worst-case O(n)

#### Edge Cases
- `k=1`
- `k=n`
- duplicate maxima

#### Common Mistakes
- Forgetting stale index removal.
- Recording answer before window is full.

#### Related Variants
- Sliding window minimum.
- Dynamic window extremes in stream processing.

#### Validation
Validate with duplicate values and alternating high-low patterns.

## Solved Problems

### Problem 1: Valid Parentheses (Easy)
#### Problem Statement
Given string containing `()[]{}`, return true if brackets are valid.

#### Constraints or Assumptions
- Input length up to `10^5`
- Contains only bracket characters

#### Example
`"([{}])" -> true`, `"([)]" -> false`

#### Brute Force or Naive Solution
Repeatedly remove `()`, `{}`, `[]` until no change. If empty, valid.
- Can degrade to O(n^2).

#### Optimized or Refactored Solution
Stack of opening brackets + map for matching closing brackets.

#### Why the Final Approach Works
Every closing bracket must match the latest unmatched opening bracket.

#### Decision Process
- Fast fail on odd length.
- Use `switch` for speed/clarity.

#### Java Solution
```java
import java.util.*;

public class ValidParenthesesLab {
    public static boolean isValid(String s) {
        if ((s.length() & 1) == 1) {
            return false;
        }
        Deque<Character> st = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '(':
                case '[':
                case '{':
                    st.push(c);
                    break;
                case ')':
                    if (st.isEmpty() || st.pop() != '(') return false;
                    break;
                case ']':
                    if (st.isEmpty() || st.pop() != '[') return false;
                    break;
                case '}':
                    if (st.isEmpty() || st.pop() != '{') return false;
                    break;
                default:
                    return false;
            }
        }
        return st.isEmpty();
    }

    public static void main(String[] args) {
        System.out.println(isValid("([{}])"));
    }
}
```

#### Dry Run
`([)]`: push `(`, push `[`, see `)`, top is `[`, mismatch -> false.

#### Time and Space Complexity
- Time: O(n)
- Space: O(n)

#### Edge Cases
- Empty string (valid)
- Single char (invalid)

#### Related Variants
- Include wildcard `*`
- Return index of first mismatch

---

### Problem 2: Implement Queue using Two Stacks (Easy)
#### Problem Statement
Implement FIFO queue API using only stack operations.

#### Constraints or Assumptions
- Many operations
- Need amortized efficiency

#### Example
push 1,2,3; pop -> 1; peek -> 2

#### Brute Force or Naive Solution
On each push, move all elements to temp stack and back to maintain order.
- O(n) per push.

#### Optimized or Refactored Solution
Use `in` and `out` stacks. Transfer only when `out` is empty.

#### Why the Final Approach Works
Each element moves at most once from `in` to `out` before removal.

#### Decision Process
Optimize common path: avoid repeated transfers.

#### Java Solution
```java
import java.util.*;

public class QueueUsingStacksLab {
    static class MyQueue {
        private final Deque<Integer> in = new ArrayDeque<>();
        private final Deque<Integer> out = new ArrayDeque<>();

        public void push(int x) {
            in.push(x);
        }

        public int pop() {
            moveIfNeeded();
            return out.pop();
        }

        public int peek() {
            moveIfNeeded();
            return out.peek();
        }

        public boolean empty() {
            return in.isEmpty() && out.isEmpty();
        }

        private void moveIfNeeded() {
            if (out.isEmpty()) {
                while (!in.isEmpty()) {
                    out.push(in.pop());
                }
            }
        }
    }

    public static void main(String[] args) {
        MyQueue q = new MyQueue();
        q.push(1);
        q.push(2);
        q.push(3);
        System.out.println(q.pop());
        System.out.println(q.peek());
    }
}
```

#### Dry Run
After pushing 1,2,3: `in=[3,2,1]`, `out=[]`. First pop transfers to `out=[1,2,3]`, pop gives 1.

#### Time and Space Complexity
- Amortized push/pop/peek: O(1)
- Worst-case single pop: O(n)
- Space: O(n)

#### Edge Cases
- Pop/peek when empty (would throw; define behavior per API)

#### Related Variants
- Queue with generic type
- Bounded capacity queue

---

### Problem 3: Merge Two Sorted Linked Lists (Medium)
#### Problem Statement
Merge two sorted singly linked lists and return sorted merged list.

#### Constraints or Assumptions
- Total nodes up to `2 * 10^5`

#### Example
`1->3->5` and `1->2->4` => `1->1->2->3->4->5`

#### Brute Force or Naive Solution
Copy values to array, sort, rebuild list.
- O((m+n) log(m+n))

#### Optimized or Refactored Solution
Two-pointer merge with dummy node.

#### Why the Final Approach Works
At each step, smallest current node among two list heads must be next in final order.

#### Decision Process
- Use dummy head to avoid special handling for first insertion.
- Reuse existing nodes to avoid extra allocations.

#### Java Solution
```java
public class MergeSortedListsLab {
    static class Node {
        int val;
        Node next;
        Node(int val) { this.val = val; }
    }

    public static Node merge(Node a, Node b) {
        Node dummy = new Node(0);
        Node tail = dummy;

        while (a != null && b != null) {
            if (a.val <= b.val) {
                tail.next = a;
                a = a.next;
            } else {
                tail.next = b;
                b = b.next;
            }
            tail = tail.next;
        }

        tail.next = (a != null) ? a : b;
        return dummy.next;
    }

    public static void main(String[] args) {
        Node a = new Node(1); a.next = new Node(3); a.next.next = new Node(5);
        Node b = new Node(1); b.next = new Node(2); b.next.next = new Node(4);
        Node m = merge(a, b);
        while (m != null) {
            System.out.print(m.val + (m.next == null ? "\n" : " -> "));
            m = m.next;
        }
    }
}
```

#### Dry Run
Compare heads repeatedly: pick 1(a), then 1(b), then 2,3,4,5.

#### Time and Space Complexity
- Time: O(m+n)
- Extra space: O(1)

#### Edge Cases
- One list empty
- All equal values

#### Related Variants
- Merge k sorted lists (heap/divide-conquer)

---

### Problem 4: Design Circular Queue (Medium)
#### Problem Statement
Implement fixed-size circular queue with operations enqueue, dequeue, front, rear, isEmpty, isFull.

#### Constraints or Assumptions
- Capacity `k >= 1`
- O(1) per operation

#### Example
k=3: enq 1,2,3 -> full; deq; enq 4 -> wraps around.

#### Brute Force or Naive Solution
Use array and shift on dequeue.
- O(n) dequeue.

#### Optimized or Refactored Solution
Circular array + head index + size.

#### Why the Final Approach Works
Wraparound position for insertion is `(head + size) % capacity`; deletion advances head by one modulo capacity.

#### Decision Process
Track `size` explicitly to simplify empty/full checks.

#### Java Solution
```java
public class CircularQueueLab {
    static class MyCircularQueue {
        private final int[] data;
        private int head;
        private int size;

        MyCircularQueue(int k) {
            this.data = new int[k];
            this.head = 0;
            this.size = 0;
        }

        public boolean enQueue(int value) {
            if (isFull()) return false;
            int tailIndex = (head + size) % data.length;
            data[tailIndex] = value;
            size++;
            return true;
        }

        public boolean deQueue() {
            if (isEmpty()) return false;
            head = (head + 1) % data.length;
            size--;
            return true;
        }

        public int Front() {
            if (isEmpty()) return -1;
            return data[head];
        }

        public int Rear() {
            if (isEmpty()) return -1;
            int idx = (head + size - 1 + data.length) % data.length;
            return data[idx];
        }

        public boolean isEmpty() {
            return size == 0;
        }

        public boolean isFull() {
            return size == data.length;
        }
    }

    public static void main(String[] args) {
        MyCircularQueue q = new MyCircularQueue(3);
        System.out.println(q.enQueue(1));
        System.out.println(q.enQueue(2));
        System.out.println(q.enQueue(3));
        System.out.println(q.enQueue(4));
        System.out.println(q.Rear());
        System.out.println(q.isFull());
        System.out.println(q.deQueue());
        System.out.println(q.enQueue(4));
        System.out.println(q.Rear());
    }
}
```

#### Dry Run
After enq 1,2,3: `head=0,size=3`. deq -> `head=1,size=2`. enq 4 inserts at `(1+2)%3=0`.

#### Time and Space Complexity
- All operations O(1)
- Space O(k)

#### Edge Cases
- Capacity 1
- Repeated dequeue on empty

#### Related Variants
- Circular deque
- generic queue

---

### Problem 5: Largest Rectangle in Histogram (Hard)
#### Problem Statement
Given bar heights, return largest rectangle area.

#### Constraints or Assumptions
- `1 <= n <= 10^5`
- heights non-negative

#### Example
`[2,1,5,6,2,3] -> 10`

#### Brute Force or Naive Solution
For each bar, expand left/right while bars >= current height.
- O(n^2)

#### Optimized or Refactored Solution
Monotonic increasing stack of indexes.

#### Why the Final Approach Works
When current height is lower than stack top, top bar's maximal width ends at current index minus one. Left boundary is new stack top + 1.

#### Decision Process
Append virtual zero-height bar to flush remaining stack cleanly.

#### Java Solution
```java
import java.util.*;

public class LargestRectangleHistogramLab {
    public static int largestRectangleArea(int[] heights) {
        int n = heights.length;
        Deque<Integer> st = new ArrayDeque<>();
        int best = 0;

        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!st.isEmpty() && h < heights[st.peek()]) {
                int top = st.pop();
                int height = heights[top];
                int left = st.isEmpty() ? -1 : st.peek();
                int width = i - left - 1;
                best = Math.max(best, height * width);
            }
            st.push(i);
        }

        return best;
    }

    public static void main(String[] args) {
        int[] heights = {2, 1, 5, 6, 2, 3};
        System.out.println(largestRectangleArea(heights));
    }
}
```

#### Dry Run
At `i=4, h=2`, pop 6 then 5 bars:
- pop index 3 (height 6), width 1, area 6
- pop index 2 (height 5), width 2, area 10 (best)

#### Time and Space Complexity
- Time: O(n)
- Space: O(n)

#### Edge Cases
- all equal heights
- strictly increasing heights
- zero heights present

#### Related Variants
- maximal rectangle in binary matrix
- online histogram updates

## Recognition Guide
Use this chapter's techniques when you see:
- "nearest greater/smaller", "next warmer day", "span" -> monotonic stack
- "window max/min" with contiguous range -> monotonic queue
- "reverse/merge/reorder list" -> pointer manipulation
- "first-in-first-out events" -> queue
- "nested/undo/backtrack" -> stack
- "both ends needed" -> deque
- "cyclic traversal" -> circular list or circular queue

Recognition signals:
- need O(n) from O(n^2) comparisons
- repeated front/back operations
- order constraints stronger than random access

Constraint clues:
- large n (`10^5` or more) often implies linear or near-linear approach
- fixed capacity suggests circular buffer

Invariants/design forces to watch:
- stack monotonicity condition
- queue staleness rule
- list connectivity (no orphan nodes)

Common traps:
- stale indexes not removed
- pushing values when indexes are required
- pointer rewiring order mistakes

When NOT to use these techniques:
- heavy random-index queries -> arrays/segment trees may fit better
- tiny input where clarity of brute force is enough

## Comparison Tables
| Structure/Pattern | Typical Ops | Time | Space | Strength | Trade-off |
|---|---|---|---|---|---|
| Singly Linked List | insert/delete at head | O(1) | O(n) | simple rewiring | no backward traversal |
| Doubly Linked List | insert/delete known node | O(1) | O(n) + extra pointers | bidirectional navigation | more memory |
| Array Stack | push/pop top | amortized O(1) | O(n) | cache-friendly | resize events |
| Linked Stack | push/pop top | O(1) | O(n) | no resize copy | allocation overhead |
| Queue (`ArrayDeque`) | offer/poll | O(1) amortized | O(n) | practical default in Java | no random access |
| Circular Queue | offer/poll fixed capacity | O(1) | O(k) | predictable latency | fixed size |
| Deque | both-end operations | O(1) | O(n) | very flexible | logic can get complex |
| Monotonic Stack | nearest greater/smaller | O(n) | O(n) | removes nested loops | invariant sensitive |
| Monotonic Queue | sliding max/min | O(n) | O(k) | optimal window extremes | stale cleanup bugs |

| Conversion | Push | Pop | Peek | Key idea |
|---|---|---|---|---|
| Queue using 2 stacks | O(1) | amortized O(1) | amortized O(1) | lazy transfer |
| Stack using queues (costly push) | O(n) | O(1) | O(1) | rotate queue after push |
| Stack using queues (costly pop) | O(1) | O(n) | O(n) | rotate during pop |

## Design and Decision Making
Relevant design patterns:
- Adapter-like idea in queue-using-stacks (same API, different internals)
- Strategy-like selection between array-backed vs linked-backed representation

Clean code rules that matter:
- Separate data-structure API from algorithm logic.
- Keep invariants explicit near mutating code.
- Prefer descriptive method names: `removeStaleIndexes`, `cleanMonotonicTail`.

Clean code structure:
- `datastructures` package for custom classes.
- `algorithms` package for monotonic/linked-list problems.
- `tests` package mirroring class names.

Reusable architecture ideas:
- Build a reusable `MonotonicDeque` helper for max/min variants.
- Build `LinkedListUtils` with pure static methods for reverse/merge/cycle.

Pragmatic choice of solution shape:
- Default to JDK collections (`ArrayDeque`) unless fixed-capacity or memory profile requires custom structure.
- Choose simple O(n) code over clever constant-factor micro-optimizations unless benchmark proves need.

How experienced engineers choose abstraction level:
- One-off interview solution: compact function is fine.
- Reused in service code: encapsulate invariant-heavy logic behind tested APIs.

Naming conventions:
- pointer names: `prev/curr/next`, `slow/fast`
- monotonic deque names: `dq`, but include comment `// decreasing indexes`

API design choices:
- Decide behavior on empty pop/peek: exception vs sentinel vs optional.
- Keep behavior consistent across related structures.

Testability considerations:
- deterministic unit tests for operation sequences
- property checks for invariants (stack order, queue order, list shape)
- fuzz tests for random push/pop/offer/poll sequences

## Practical Applications
- Backend systems: job queues, retry buffers, request batching.
- Frontend apps: undo stack, navigation history stack.
- Databases: LRU-like page replacement often uses deque/list structures.
- Distributed systems: message queue consumers and bounded channels.
- Operating systems: scheduler run queues and circular buffers.
- Networking: packet ring buffers, sliding metrics windows.
- AI systems: beam-search candidates often managed with queues/heaps; token parsers use stacks.
- Mobile apps: recent-actions stack and event queues.
- Games: event simulation loops and turn queues.

## Failure Modes and Trade-offs
Senior engineer insights:
- Big-O is not enough. Memory layout and allocation rates matter.
- `ArrayDeque` beats linked structures in many practical Java workloads due to locality.

Hidden tricks:
- For monotonic stack/queue, store indexes; values can be read from source array.
- Add sentinel elements to simplify edge handling.

Performance tuning:
- avoid boxing/unboxing hot loops where possible
- pre-size arrays when capacity known

Trade-off thinking:
- fixed-capacity circular queue gives predictable latency but can drop/reject data when full
- linked structures avoid resizing but create GC pressure

Interview traps:
- forgetting stale cleanup in window problems
- wrong operator strictness (`<` vs `<=`)
- claiming O(1) where only amortized O(1) is true

Common weak spots:
- pointer order in reverse/merge
- edge cases empty/single/full

Failure modes and debugging strategy:
1. Reproduce with minimal failing input.
2. Log invariant state each step.
3. Assert structure integrity after mutation in debug builds.
4. Compare against brute force on random small inputs.

## Condensed Notes
- Stack = LIFO, Queue = FIFO, Deque = both ends.
- Monotonic stack: push once, pop once -> O(n).
- Sliding max deque invariant: values decreasing, front always current max.
- Linked-list reverse template:
  - save `next`
  - flip `curr.next`
  - advance `prev/curr`
- Floyd cycle detection:
  - meeting implies cycle
  - reset one pointer to head and move both one step to find entry
- Circular queue formulas:
  - tail index: `(head + size) % capacity`
  - rear index: `(head + size - 1 + capacity) % capacity`
- Decision shortcuts:
  - nearest greater/smaller -> monotonic stack
  - window extrema -> monotonic deque
  - strict FIFO stream -> queue
  - nested matching -> stack
- Gotchas:
  - stale index cleanup
  - empty structure checks
  - off-by-one in window boundaries

## Additional Problems
### Easy (5)
1. Title: Implement Stack with Array  
   Prompt: Build push/pop/peek/isEmpty with dynamic resizing.  
   Expected pattern or concept: Array-based stack fundamentals.
2. Title: Valid Parentheses II  
   Prompt: Validate mixed brackets and report first mismatch index.  
   Expected pattern or concept: Stack simulation pattern.
3. Title: Queue Basics  
   Prompt: Implement queue using linked nodes with O(1) offer/poll.  
   Expected pattern or concept: Queue and linked representation.
4. Title: Reverse Linked List  
   Prompt: Reverse singly linked list iteratively.  
   Expected pattern or concept: Pointer manipulation and reversal.
5. Title: Detect Cycle  
   Prompt: Return whether linked list contains cycle.  
   Expected pattern or concept: Fast and slow pointer technique.

### Medium (5)
1. Title: Next Greater Element  
   Prompt: For each element, find next greater on right.  
   Expected pattern or concept: Monotonic stack pattern.
2. Title: Daily Temperatures Variant  
   Prompt: Return days until colder temperature instead of warmer.  
   Expected pattern or concept: Monotonic stack with operator adjustment.
3. Title: Sliding Window Maximum  
   Prompt: Compute max for each size-k window.  
   Expected pattern or concept: Monotonic queue pattern.
4. Title: Queue Using Two Stacks  
   Prompt: Design full queue API with amortized analysis.  
   Expected pattern or concept: Deque/stack conversion and amortization.
5. Title: Merge Two Sorted Lists  
   Prompt: Merge without creating new value nodes.  
   Expected pattern or concept: Merge and pointer rewiring.

### Hard (5)
1. Title: Largest Rectangle in Histogram  
   Prompt: Maximum rectangle area in O(n).  
   Expected pattern or concept: Monotonic stack + width boundaries.
2. Title: Maximal Rectangle in Binary Matrix  
   Prompt: Use histogram per row and stack optimization.  
   Expected pattern or concept: Stack simulation + row transformation.
3. Title: Min Queue with O(1) Operations  
   Prompt: Support enqueue/dequeue/getMin efficiently.  
   Expected pattern or concept: Deque invariants and state cleanup.
4. Title: Evaluate Infix Expression with Parentheses  
   Prompt: Parse multi-digit values and precedence safely.  
   Expected pattern or concept: Parentheses/expression simulation.
5. Title: Circular Deque with Fixed Capacity  
   Prompt: Implement all operations in O(1) with wraparound.  
   Expected pattern or concept: Circular indexing + deque operations.

## Key Questions
1. Q: When should you prefer `ArrayDeque` over `LinkedList` for stack/queue in Java?  
   A: In most cases. `ArrayDeque` has better locality and lower per-element overhead, usually giving better real performance.
2. Q: Why does monotonic stack give O(n) and not O(n^2)?  
   A: Each index is pushed once and popped once at most, so total stack operations are linear.
3. Q: How do you avoid stale state in sliding-window deque problems?  
   A: Remove front indexes outside current window before reading answer.
4. Q: Explain amortized O(1) for queue using two stacks.  
   A: Transfers are occasional and each element moves from input to output at most once before pop.
5. Q: Difference between singly and doubly linked list trade-offs?  
   A: Doubly enables backward traversal and O(1) removal with node reference but uses extra memory.
6. Q: How do you find cycle start in linked list?  
   A: Detect meeting with fast/slow, reset one pointer to head, move both one step until equal.
7. Q: Common bug in linked-list reversal?  
   A: Overwriting `curr.next` before saving next node.
8. Q: Queue using stacks or stack using queues: which is more practical?  
   A: Queue using stacks is more common and cleaner with amortized O(1) operations.
9. Q: Why store indexes instead of values in monotonic structures?  
   A: Indexes support distance calculations and stale-window checks.
10. Q: When not to use linked list even if operations are O(1)?  
    A: When random access and cache locality matter; arrays may be faster in practice.

## Applied Project
### Objective
Build a Java "Stream Analyzer" that processes event numbers and supports:
- enqueue events
- current max over last `k` events
- undo last command
- validate expression-like control commands

### Required Features
- Circular queue for bounded event intake.
- Monotonic deque for rolling maximum.
- Stack for undo history.
- Parentheses validator for command scripts.

### Suggested Java module structure
- `streamanalyzer.core.EventQueue`
- `streamanalyzer.core.RollingMax`
- `streamanalyzer.core.UndoManager`
- `streamanalyzer.parser.CommandValidator`
- `streamanalyzer.app.Main`

### Testing ideas
- deterministic scenario tests
- random operation sequence tests
- invariant assertions after each operation

### Stretch goals
- add rolling minimum too
- add command replay log
- expose REST endpoint for enqueue/query


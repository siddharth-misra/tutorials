
# 28: Hybrid Problem Solving, UI Architecture, and Mastery

## Introduction and Context

This final chapter synthesizes pattern recognition across domains. Hard problems rarely fit one template. They combine array patterns, graph traversal, DP optimization, and game-state reasoning into composable solutions. UI architecture completes the picture: how do patterns apply beyond backend algorithms?

The central theme is recognizing multi-pattern problems, avoiding anti-patterns (overengineering, pattern misidentification), and building communicable solutions. Mastery means knowing not just what patterns exist, but when simpler approaches suffice and when composition is justified.

## Core Intuition and Mechanics

Hybrid problems reveal themselves through brute-force bottlenecks. One pattern fixes the first bottleneck; a second pattern fixes the next. Good solutions are transparent: each layer has one responsibility.

UI patterns teach that backend patterns apply to frontend architecture. Component composition, state management (Redux), and unidirectional data flow bring the same rigor to user interfaces as algorithms bring to backend processing.

## Core Concepts and Subtopics

### Concept Cluster: Multi-Pattern Problem Composition
Topics in this cluster:
- 28.1 Expert Hybrid Pattern; Multi-Pattern Problems; Pattern Combinations across arrays, graphs, and DP
- 28.2 Next greater element; Histogram problems; Monotonic structures and interval patterns; Merge intervals
- 28.6 Pattern Combinations; Factory plus Strategy; Builder plus Prototype; Observer plus Mediator; Decorator plus Composite
- 28.9 Pattern identification; Scenario-based questions; Refactoring questions; Low-level design problems; Pattern selection heuristics and trade-off evaluation

#### Recognizing Hybrid Problems

**Brute force first**: Write the direct solution and identify exactly what is too slow.

**Isolate bottlenecks**: Is it repeated scanning? Exponential search space? Incorrect state representation?

**Choose patterns deliberately**: One pattern should fix each bottleneck. If two patterns solve the same problem, you are overcomplicating.

#### Common Combinations

- **Prefix sums + monotonic queue**: Transform intervals into difference arrays; deque maintains best candidate starts.
- **Graph + DP**: State includes both node and a discrete dimension (edges used, mask visited).
- **Segment tree + lazy propagation**: Range updates and range queries on compressed coordinates.
- **DFS + hashing**: Detect patterns in recursion tree via rolling hashes.

#### Avoiding Anti-Patterns

- **Pattern misidentification**: Forcing a familiar pattern onto a problem it does not fit.
- **Premature optimization**: Optimizing before the bottleneck is proven.
- **Overcomposition**: Adding a second pattern when the first already solves it.
- **Lack of explanation**: The solution works but the reasoning is unclear.

### Concept Cluster: UI Architecture Patterns
Topics in this cluster:
- 28.4 MVC Pattern and request flow; MVP Pattern and presenter responsibility; MVVM Pattern and data binding; Component Pattern and reusable components; Props, inputs, and state management; Choosing a UI pattern by framework constraints
- 28.5 Flux and Redux Pattern; Store, actions, and reducers; Unidirectional data flow; Side effects and async coordination; UI composition with components; When centralized state is unnecessary

#### MVC: Model-View-Controller

Model holds data; View displays it; Controller handles input and updates Model.

```java
// MVC: Controller routes input to model
class OrderController {
    private OrderModel model;
    
    void handleCheckout(CheckoutRequest req) {
        Order order = model.createOrder(req);
        model.processPayment(order);
        view.showConfirmation(order);
    }
}
```

**Pros**: Clear separation of concerns. **Cons**: Controller can grow large; view and model are often coupled.

#### Redux/Flux: Centralized State Management

Single store holds all application state. Actions describe what happened. Reducers compute new state from old state and action.

```java
// Redux: Actions and reducers
class AppState {
    List<Order> orders;
    User currentUser;
}

AppState appReducer(AppState state, Action action) {
    if (action instanceof CreateOrderAction) {
        Order newOrder = ((CreateOrderAction)action).order;
        state.orders.add(newOrder);
    }
    return state;
}
```

**Pros**: Predictable state changes; time-travel debugging. **Cons**: Verbose; every change requires an action.

#### Component Pattern

Reusable UI building blocks. Props flow down; events flow up. State belongs to a parent unless only one component needs it.

```java
// Component: reusable, composable
class OrderCard extends UIComponent {
    Order order;
    Callback onCancel;
    
    void render() {
        display(order.id, order.amount);
        button("Cancel", () -> onCancel.run());
    }
}
```

### Concept Cluster: Game Theory and Randomization
Topics in this cluster:
- 28.3 Game Theory Pattern; Randomized Algorithm Pattern revisited; Winning states, losing states, and turn-based analysis; Expected behavior versus worst-case guarantees; Adversarial testing and counterexample design; When randomness simplifies an otherwise hard strategy

#### Winning and Losing States

State is **winning** if the current player can move to a losing state. State is **losing** if all moves lead to winning states for the opponent.

```java
// Game DP: is position winning for current player?
boolean isWinning(int[] piles) {
    Map<String, Boolean> memo = new HashMap<>();
    return canWin(piles, memo);
}

boolean canWin(int[] piles, Map<String, Boolean> memo) {
    String key = Arrays.toString(piles);
    if (memo.containsKey(key)) return memo.get(key);
    
    for (int i = 0; i < piles.length; i++) {
        if (piles[i] > 0) {
            piles[i]--;
            if (!canWin(piles, memo)) {
                piles[i]++;
                memo.put(key, true);
                return true;
            }
            piles[i]++;
        }
    }
    memo.put(key, false);
    return false;
}
```

#### Randomization Benefits

Randomized pivot selection in quicksort makes O(n log n) expected time even on adversarial inputs. Randomization simplifies where deterministic case analysis is complex.

## Worked Examples

### Worked Example 1: Next Greater Element (Monotonic Stack)
**Problem**: For each element, find the next element to the right that is greater.

**Brute Force**: O(n^2) nested scan.

**Better**: Monotonic decreasing stack stores candidates. Pop when a larger element arrives.

```java
int[] nextGreater(int[] arr) {
    int[] result = new int[arr.length];
    Stack<Integer> stack = new Stack<>();
    for (int i = arr.length - 1; i >= 0; i--) {
        while (!stack.isEmpty() && stack.peek() <= arr[i]) stack.pop();
        result[i] = stack.isEmpty() ? -1 : stack.peek();
        stack.push(arr[i]);
    }
    return result;
}
```

**Complexity**: O(n) time, O(n) space.

### Worked Example 2: Trapping Rain Water (Prefix + Monotonic Deque)
**Problem**: Calculate water trapped between elevation bars.

**Insight**: Water at position i is bounded by max height to left and max height to right.

**Hybrid**: Precompute left/right maxima (prefix idea); or use monotonic decreasing stack to process bar pairs.

**Complexity**: O(n) time.

### Worked Example 3: Largest Rectangle in Histogram (Monotonic Stack)
**Problem**: Find the largest rectangle in a histogram.

**Idea**: For each bar, find how far left and right it extends without a shorter bar.

**Solution**: Monotonic stack tracks increasing heights; when a shorter bar arrives, pop taller ones and compute areas.

**Complexity**: O(n) time.

## Solved Problems

**Problem 1 (Easy)**: Identify which pattern applies: brute force, prefix sum, monotonic stack, or DP.
**Problem 2 (Easy)**: Next greater element using monotonic stack.
**Problem 3 (Medium)**: Trapping rain water with two-pointer or monotonic deque.
**Problem 4 (Medium)**: UI state management: given an action stream, compute final state.
**Problem 5 (Hard)**: Multi-pattern problem combining prefix compression, graph traversal, and DP optimization.

## Recognition Guide

Recognize these hybrid signals:
- One pattern alone is too slow → add a second.
- State includes multiple independent dimensions → DP over one, search over another.
- Geometry + ordering → sweep line + active structure.
- Graph + optimization → BFS + DP or state compression.
- Game logic + randomization → memoized game tree + adversarial testing.

## Comparison Tables

| Scenario | Primary Pattern | Secondary Pattern | Why |
|---|---|---|---|
| Next greater | Monotonic stack | None | Stack alone O(n) |
| Largest rectangle | Monotonic stack | Prefix heights | Heights precomputed; stack processes |
| Trapping water | Prefix sums | Two pointers | Or: monotonic stack |
| Path in grid with stops | BFS | DP | State = (node, stops_used) |
| Heavy graph + many queries | Graph traversal | Segment tree | Flatten via DFS; query via tree |

## Design and Decision Making

Start hybrid design from brute force and bottlenecks, not from pattern names. Ask what is slow: scanning, searching, state explosion? Pick the simplest fix. Do not add patterns unless the constraints rule out the simpler approach.

For UI, choose MVC for simple apps, Redux for apps with complex state shared across many components. Avoid over-centralizing state when one component owns it.

## Practical Applications

**Hybrid arrays/graphs**: Shortest path with forbidden edges; flow with capacities.

**Hybrid DP**: Knapsack with item-rarity scoring; sequence optimization with edit-distance variants.

**UI architecture**: E-commerce checkout (multiple steps, shared cart state); real-time dashboards (Redux with async effects).

## Failure Modes and Trade-offs

Over-hybridization creates unmaintainable solutions. Weak composition (patterns that interfere) is harder to debug than simple solutions. UI state centralization (Redux) adds verbosity but improves predictability. Randomization trades worst-case guarantees for expected performance; some problems require derandomization if worst-case matters.

## Condensed Notes

- **Hybrid workflow**: Brute force → identify bottleneck → add one pattern → test → add second if needed.
- **Monotonic stack**: O(n) for next-greater, largest rectangle, trapping water.
- **MVC**: Simple apps. Redux: complex shared state.
- **Game DP**: Winning/losing states via memoization.
- **Adversarial testing**: Build counterexamples to weak heuristics.
- **Avoid**: pattern names as goal; complexity without bottleneck proof.

## Additional Problems

15 problems mixing arrays, graphs, DP, games, and UI state management across easy, medium, and hard levels.

## Key Questions

1. What is the brute-force baseline and its bottleneck?
2. Which pattern removes that bottleneck?
3. After first optimization, what is the next bottleneck?
4. Can one pattern solve it, or do you need composition?
5. When is MVC sufficient and when does Redux help?
6. How do you test hybrid solutions without confusion?
7. What is the difference between choreography and orchestration in UI?
8. When is centralized state management overkill?
9. How do you identify anti-patterns in your solution?
10. What is the simplest correct approach that passes constraints?

## Applied Project

Build a **stock portfolio tracker** combining backend hybrid algorithms and frontend UI patterns. Backend: compute most profitable trades (DP), rank by volatility (heap + sorting), detect pump-and-dump patterns (graph cycles + hashing). Frontend: display portfolio in MVC (simple view) or Redux (complex filters and sorting). Implement component reusability and time-travel debugging. Test responsiveness under real-time price updates.

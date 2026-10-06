# 22: Games and Probabilistic Thinking

## 0. Introduction

This chapter sits in Part VI - Expert Structures and Hybrid Problem Solving (Weeks 29-34), with the roadmap treating it as advanced work. Its goal is to learn how to reason about turn-based optimal play, winning and losing states, and randomized algorithms with clear expectations about guarantees and adversarial inputs. This chapter directly supports the Part VI outcome of justifying advanced techniques with clear trade-offs instead of treating them as memorized tricks.

Read it as a bridge in the larger sequence. Chapter 21 focused on advanced tree preprocessing. This chapter shifts from structural decomposition to strategic reasoning, where the state meaning and guarantee type matter more than the shape of a data structure. Chapter 23 combines multiple patterns in hard problems, including cases where game reasoning, DP, graphs, or randomized ideas overlap. Start this chapter after you are comfortable with Chapters 1 through 21, especially recursion, DP, greedy counterexamples, adversarial thinking, and the habit of proving invariants before trusting a shortcut. The main themes here are Game Theory Pattern, Randomized Algorithm Pattern revisited, Winning states, losing states, and turn-based analysis, Expected behavior versus worst-case guarantees, Adversarial testing and counterexample design, and When randomness simplifies an otherwise hard strategy.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to model impartial games in Java, identify winning and losing states, explain expected versus worst-case guarantees for randomized algorithms, build adversarial counterexamples, and decide when randomness is a real simplification instead of a distraction.

## 1. Intuition First

This chapter matters because some problems are not about processing data. They are about competing choices. In game problems, every move changes what moves remain for the opponent. In randomized algorithms, the algorithm itself injects uncertainty to avoid worst-case traps or simplify structure.

The simplest analogy is a board game referee and a coin-flipping assistant. The referee needs exact rules about whose turn it is and what counts as a winning position. The assistant uses randomness to avoid predictable bad cases. Both need clear guarantees, but they are different guarantees.

The core mental model is:

- a game state is winning if it has at least one move to a losing state
- a game state is losing if every legal move leads to a winning state for the opponent
- proofs in game theory usually come from invariant state classification, not from simulation hope
- randomized algorithms trade deterministic worst-case guarantees for strong expected performance or simpler logic
- adversarial testing matters because some deterministic choices fail only on carefully constructed inputs

Recognition signals for this chapter:

- two-player turn-based play with optimal decisions
- questions asking whether the first player can force a win
- recurrence over move options and opponent responses
- algorithms whose performance depends on pivot choice, random sampling, or hashing-style randomization
- requests to compare expected time with worst-case time

The most common beginner confusion point is mixing probability with uncertainty in the problem statement. A deterministic game may still need no randomization at all. A randomized algorithm may solve a non-game problem. The chapter keeps those ideas separate and then shows where they connect through adversarial thinking.

In the larger roadmap, this chapter teaches proof-oriented reasoning about strategy and guarantees before the next chapter combines multiple patterns inside harder problems.

## 2. Learning Path and Recognition Checklist

The chapter starts with winning and losing state logic for impartial games, then revisits randomized algorithms through the lens of guarantee type, adversarial inputs, and engineering trade-offs. It ends by tying both themes together with counterexample design.

Recognition checklist for this chapter:

- Is the problem a turn-based optimal-play game?
- Can I define the state so legal moves are explicit?
- Does the answer ask whether a state is winning, losing, or drawn?
- Is the algorithm's runtime sensitive to an adversarial input order or pivot choice?
- Do I need a worst-case guarantee, or is expected performance enough?
- Would randomness eliminate complicated deterministic case analysis?

The brute-force baseline usually looks like this:

- recursively explore the full game tree
- try every move sequence without memoization or state classification
- use a fixed deterministic heuristic that fails badly on adversarial inputs

The optimization path later becomes:

- DP or memoization over winning and losing states
- invariant-based shortcuts such as xor for Nim-like games
- randomized pivot or sampling strategies that flatten bad deterministic cases in expectation
- adversarial test construction to validate the claimed guarantee

Mastery by the end of the chapter looks like this: you can explain who controls each move, what the state means, what guarantee your algorithm provides, and what input would break the wrong approach.

Do not add randomness just to sound advanced. Do not simulate game trees blindly when a state invariant classifies positions directly.

## 3. Official Subtopic Coverage

### Concept Cluster: Optimal Play and State Classification
Official subtopics covered:
- 22.1 Game Theory Pattern
- 22.3 Winning states, losing states, and turn-based analysis

#### Definition or Framing
The Game Theory Pattern models turn-based problems as states with legal moves under optimal play. A state is winning if the current player can move to a losing state for the opponent. A state is losing if every legal move hands the opponent a winning state.

#### Recognition Signals
- “can the first player force a win?”
- finite move options from each state
- players alternate turns with perfect information
- optimal play is assumed

#### Brute-Force Baseline
Explore the entire game tree recursively and test whether any move eventually wins.

#### Optimized Pattern Idea
Memoize state results or derive a stronger invariant such as parity or xor so states can be classified directly.

#### Invariant / State Representation / Transition Logic
The state must encode everything that affects future moves. A winning state has at least one transition to a losing state; a losing state has none.

#### Java Implementation Notes
- small state spaces often fit naturally into DP arrays or hash maps
- keep “whose turn” explicit unless the recurrence already assumes current-player perspective
- test terminal states first; they define the recurrence base

#### Quick Dry Run
If a pile game allows removing `1` or `2` stones, then `0` is losing, `1` is winning, `2` is winning, and `3` is losing because both moves from `3` lead to winning states for the opponent.

#### Common Mistakes
- forgetting that the opponent also plays optimally
- defining an incomplete state that hides future move options
- using greedy move choice without proof

#### Debugging Strategy
List the first few small states by hand and ensure the recurrence matches them exactly.

#### Comparison with Similar Pattern
Game DP resembles ordinary DP, but the transition meaning is adversarial: each move changes what the opponent can force.

#### Advanced Note
Some games collapse to algebraic invariants, which is much stronger than state-by-state DP.

### Concept Cluster: Randomization and Guarantee Types
Official subtopics covered:
- 22.2 Randomized Algorithm Pattern revisited
- 22.4 Expected behavior versus worst-case guarantees
- 22.6 When randomness simplifies an otherwise hard strategy

#### Definition or Framing
The Randomized Algorithm Pattern uses random choices, such as pivot selection or sampling, to obtain better expected performance or simpler logic. The key question is what guarantee remains: expected time, high-probability correctness, or deterministic correctness after verification.

#### Recognition Signals
- deterministic pivot or ordering choices create bad worst cases
- simple randomization removes the need for careful handcrafted cases
- expected runtime is acceptable even if worst-case runtime remains large

#### Brute-Force Baseline
Use a fixed deterministic rule such as always taking the first pivot, regardless of input order.

#### Optimized Pattern Idea
Inject randomness where deterministic choice is fragile, then analyze the expected behavior or success probability explicitly.

#### Invariant / State Representation / Transition Logic
Randomness does not change the correctness condition. It changes how likely the algorithm is to encounter expensive or misleading intermediate states.

#### Java Implementation Notes
- `ThreadLocalRandom.current()` is a practical choice for pivot selection
- document whether the algorithm is always correct but random in runtime, or probabilistic in correctness too
- seed control can help testing, but avoid hiding logic behind “lucky” runs

#### Quick Dry Run
Randomized quickselect does not guarantee a good pivot every time, but it makes consistently bad pivots highly unlikely across many runs.

#### Common Mistakes
- claiming worst-case improvement when only expected improvement exists
- using randomness without stating why it helps
- assuming one successful random test is enough evidence of correctness

#### Debugging Strategy
Test on sorted, reverse-sorted, and repeated-value inputs. Those are where deterministic shortcuts often break first.

#### Comparison with Similar Pattern
Randomization is not a substitute for proof. It is a design tool that changes the guarantee type and often the implementation simplicity.

#### Advanced Note
Some hard deterministic balancing strategies become simple once a random choice makes adversarial structure unlikely.

### Concept Cluster: Adversarial Thinking and Counterexamples
Official subtopics covered:
- 22.5 Adversarial testing and counterexample design
- 22.4 Expected behavior versus worst-case guarantees

#### Definition or Framing
Adversarial testing asks what input or move sequence breaks a naïve heuristic. Counterexample design is the habit of constructing that failure case before trusting the idea.

#### Recognition Signals
- greedy or deterministic shortcuts seem plausible but unproved
- runtime claims depend heavily on input order
- game strategy explanations ignore one dangerous opponent response

#### Brute-Force Baseline
Trust the approach because it works on a few random tests.

#### Optimized Pattern Idea
Act like an opponent or adversary. Search for the smallest input that forces the claimed heuristic to fail.

#### Invariant / State Representation / Transition Logic
The counterexample must violate the hidden assumption of the wrong solution: wrong pivot balance, unhandled opponent move, or false pattern shortcut.

#### Java Implementation Notes
- keep a brute-force checker for small inputs when possible
- random test generation is useful, but hand-built adversarial cases are still necessary
- compare deterministic and randomized versions on the same hard cases

#### Quick Dry Run
Always choosing the first pivot in quickselect performs badly on already sorted arrays. That is a direct adversarial construction.

#### Common Mistakes
- using random tests only and missing structured bad cases
- calling an input “edge case” without explaining what assumption it violates
- confusing expected-case success with worst-case proof

#### Debugging Strategy
Write one sentence for the approach's hidden assumption, then try to falsify it with the smallest possible input.

#### Comparison with Similar Pattern
Counterexample design is the testing partner of proof. If the proof is weak, a good adversarial test often exposes the gap quickly.

#### Advanced Note
In interviews and contests, one sharp counterexample is often more persuasive than a long vague criticism.

## 4. Pattern Template, State Model, or Core Workflow

Canonical game-and-randomization workflow:

1. Define the state precisely.
   What information controls future moves or future cost?
2. Identify the guarantee type.
   Deterministic correctness, expected runtime, or probabilistic correctness?
3. For games, classify small states first.
4. For randomized algorithms, ask what deterministic bad case randomness is avoiding.
5. Design adversarial tests before trusting the method.

Important variables and safety rules:

- game states must encode all legal future moves
- current-player perspective must stay consistent across transitions
- expected-runtime claims must not be written as worst-case claims
- randomness should target a real structural weakness in the deterministic version

What usually breaks first:

- terminal-state definitions in game DP
- incorrect assumption that “a good move exists” without checking the opponent's best reply
- deterministic pivots or sampling rules on ordered adversarial inputs
- vague runtime claims that mix expected and worst-case language

When to adapt versus keep the template unchanged:

- keep winning/losing-state DP unchanged for small finite games
- adapt with stronger invariants when a game collapses to algebraic structure like xor
- keep randomized simplifications only when the guarantee trade is acceptable

## 5. Worked Examples and Full Solutions

### Worked Example 1: Stone Game with Allowed Moves {1, 3, 4}
#### Problem Statement
There are `n` stones in a pile. Two players alternate turns, and a move removes `1`, `3`, or `4` stones. The player who cannot move loses. Determine whether the first player has a winning strategy.

#### Why This Example Matters
This is the cleanest winning-state example. It makes the recurrence and opponent reasoning explicit.

#### Input and Constraints
- `0 <= n <= 100000`
- perfect information, optimal play

#### Recognition Signals
- finite state space
- alternate turns
- question asks whether the first player can force a win

#### Brute-Force Approach
Recursively explore all move sequences from `n` and see whether any first move guarantees eventual victory.

#### Better Pattern-Based Approach
Use DP where `winning[stones]` depends on whether any legal move reaches a losing state.

#### Why the Pattern Fits
The state is just the number of stones left, and each move deterministically transitions to smaller states.

#### Invariant or State Transition
`winning[stones]` is true if there exists an allowed move `m` such that `winning[stones - m]` is false.

#### Pragmatic Java Choice
Use a boolean array for bottom-up clarity and easy debugging on small values.

#### Dry Run Before Code
For `n = 6`:

- remove `1` -> state `5`
- remove `3` -> state `3`
- remove `4` -> state `2`

If all three target states are winning for the opponent, then `6` is losing. Otherwise it is winning.

#### Java Solution
```java
public class StoneGameExample {
    static boolean firstPlayerWins(int stones) {
        int[] moves = {1, 3, 4};
        boolean[] winning = new boolean[stones + 1];

        for (int current = 1; current <= stones; current++) {
            for (int move : moves) {
                if (current >= move && !winning[current - move]) {
                    winning[current] = true;
                    break;
                }
            }
        }
        return winning[stones];
    }

    public static void main(String[] args) {
        System.out.println(firstPlayerWins(6));
        System.out.println(firstPlayerWins(7));
    }
}
```

#### Time and Space Complexity
- Brute-force recursion: exponential in `n`
- DP: `O(n * numberOfMoves)` time and `O(n)` space

#### Edge Cases
- `n = 0`
- small `n` where only one move fits
- repeated move set values if input is generalized

#### Common Mistakes
- marking a state winning because it has a move, instead of because it has a move to a losing state
- forgetting the terminal losing state at `0`
- assuming greedy largest-move choice is always correct

### Worked Example 2: Nim Winner by XOR Invariant
#### Problem Statement
Given pile sizes in standard Nim, determine whether the first player wins under optimal play.

#### Why This Example Matters
This example shows how some games collapse from state-tree reasoning to a compact invariant.

#### Input and Constraints
- `1 <= piles.length <= 200000`
- pile sizes fit in `int`

#### Recognition Signals
- impartial combinational game
- many independent piles
- repeated move-space exploration would be too large

#### Brute-Force Approach
Recursively try every pile reduction for small pile sizes and search the full game tree.

#### Better Pattern-Based Approach
Use the xor of all pile sizes. The first player wins if and only if the xor is nonzero.

#### Why the Pattern Fits
Standard Nim has a known invariant that fully classifies winning and losing states.

#### Invariant or State Transition
Nim-sum, the xor of all pile sizes, is `0` exactly in losing states under optimal play.

#### Pragmatic Java Choice
The implementation is tiny, but the chapter emphasis is on the proof meaning of the invariant, not on code size.

#### Dry Run Before Code
For piles `[1, 4, 5]`, the xor is `1 ^ 4 ^ 5 = 0`, so the position is losing if both players play optimally.

#### Java Solution
```java
public class NimExample {
    static boolean firstPlayerWins(int[] piles) {
        int xor = 0;
        for (int pile : piles) {
            xor ^= pile;
        }
        return xor != 0;
    }

    public static void main(String[] args) {
        System.out.println(firstPlayerWins(new int[]{1, 4, 5}));
        System.out.println(firstPlayerWins(new int[]{3, 4, 5}));
    }
}
```

#### Time and Space Complexity
- Brute-force search: exponential in the total move space
- XOR invariant: `O(numberOfPiles)` time and `O(1)` space

#### Edge Cases
- one pile only
- all piles zero if the variant allows it
- large pile values with many piles

#### Common Mistakes
- applying the xor shortcut to non-Nim games without proof
- interpreting xor as a heuristic instead of a theorem
- forgetting that optimal play is assumed

### Worked Example 3: Randomized Quickselect for K-th Largest
#### Problem Statement
Given an unsorted array, return the `k`-th largest element using a randomized selection strategy.

#### Why This Example Matters
This is a concrete randomized algorithm where the expected guarantee matters and adversarial input order can destroy a deterministic variant.

#### Input and Constraints
- `1 <= n <= 200000`
- duplicate values are allowed
- `1 <= k <= n`

#### Recognition Signals
- deterministic first-pivot quickselect would perform badly on ordered input
- full sorting is more work than needed
- expected linear time is acceptable

#### Brute-Force Approach
Sort the full array and index the `k`-th largest element.

#### Better Pattern-Based Approach
Use randomized quickselect. Partition around a random pivot and recurse only into the side containing the target order statistic.

#### Why the Pattern Fits
Random pivot choice avoids the predictable bad partitions that make a fixed pivot fragile on adversarial inputs.

#### Invariant or State Transition
After partitioning, every element left of the pivot is smaller than it, and every element right of the pivot is greater than or equal to it in the chosen ordering convention.

#### Pragmatic Java Choice
Use iterative quickselect with `ThreadLocalRandom` so pivot selection stays simple and non-deterministic across runs.

#### Dry Run Before Code
If the random pivot lands near the middle rank, the remaining search range shrinks quickly. If it lands badly once, later random pivots still avoid a consistently adversarial pattern in expectation.

#### Java Solution
```java
import java.util.concurrent.ThreadLocalRandom;

public class RandomizedQuickselectExample {
    static int findKthLargest(int[] values, int k) {
        int targetIndex = values.length - k;
        int left = 0;
        int right = values.length - 1;

        while (left <= right) {
            int pivotIndex = ThreadLocalRandom.current().nextInt(left, right + 1);
            int finalPivotIndex = partition(values, left, right, pivotIndex);

            if (finalPivotIndex == targetIndex) {
                return values[finalPivotIndex];
            }
            if (finalPivotIndex < targetIndex) {
                left = finalPivotIndex + 1;
            } else {
                right = finalPivotIndex - 1;
            }
        }
        throw new IllegalStateException("Unreachable for valid input");
    }

    static int partition(int[] values, int left, int right, int pivotIndex) {
        int pivotValue = values[pivotIndex];
        swap(values, pivotIndex, right);

        int storeIndex = left;
        for (int index = left; index < right; index++) {
            if (values[index] < pivotValue) {
                swap(values, storeIndex++, index);
            }
        }
        swap(values, storeIndex, right);
        return storeIndex;
    }

    static void swap(int[] values, int first, int second) {
        int temp = values[first];
        values[first] = values[second];
        values[second] = temp;
    }

    public static void main(String[] args) {
        int[] values = {9, 1, 5, 3, 7, 8, 2};
        System.out.println(findKthLargest(values, 3));
    }
}
```

#### Time and Space Complexity
- Full sort baseline: `O(n log n)` time and implementation simplicity
- Randomized quickselect: expected `O(n)` time, worst-case `O(n^2)` time, and `O(1)` extra space in the iterative version

#### Edge Cases
- duplicate values equal to the pivot
- `k = 1` or `k = n`
- already sorted input, which is the adversarial case for many fixed-pivot strategies

#### Common Mistakes
- claiming worst-case linear time for randomized quickselect
- partitioning with inconsistent ordering around duplicates
- forgetting that the target index is zero-based after converting from `k`-th largest

## 6. Complexity and Comparison Guide

Across the chapter, the main trade-offs are:

- full game-tree search: conceptually direct but quickly exponential
- game DP or memoization: polynomial or pseudo-polynomial when the state space is manageable
- invariant-based game shortcuts such as xor: extremely fast, but only when the proof exists
- deterministic heuristics: sometimes simple, but vulnerable to adversarial inputs
- randomized algorithms: often simpler and faster in expectation, but the guarantee must be stated honestly

Comparison with similar patterns:

- Game DP versus ordinary DP: both use states and transitions, but game DP reasons against an optimal opponent.
- Randomized quickselect versus sorting: sorting is deterministic and stronger than needed; quickselect is more targeted but trades worst-case guarantees for expected speed.
- Invariant-based game proofs versus simulation: invariants are much stronger and more scalable when valid.

Decision criteria:

- choose state DP when the game space is finite and manageable
- choose invariant shortcuts only with proof, not pattern hope
- choose randomization when deterministic bad cases are real and expected behavior is acceptable
- keep deterministic methods when worst-case guarantees are mandatory

Signals not to force these techniques:

- no adversarial opponent and no strategy dependence in the problem
- tiny inputs where brute force is clear enough
- systems where worst-case latency dominates and expected speed is not enough

What breaks when invariants fail:

- wrong terminal-state assumptions break all winning-state labels
- applying a game invariant to the wrong rules gives the wrong winner immediately
- claiming expected behavior as a worst-case guarantee misstates the algorithm entirely

## 7. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- forgetting the opponent perspective in winning/losing recurrences
- missing terminal states or illegal moves in game DP
- using randomness without preserving correctness in the non-random parts of the algorithm
- relying only on random tests and missing structured adversarial cases

Boundary-condition handling:

- zero-size game states often define the base case
- duplicate elements in quickselect change partition behavior
- deterministic bad inputs should be part of the normal test suite, not an afterthought

Short debugging checklist:

1. Classify the smallest states by hand.
2. State the guarantee type in one sentence.
3. Build one adversarial input for the deterministic variant.
4. Compare randomized output or runtime behavior against a baseline on small tests.
5. Separate correctness proof from runtime analysis.

Counterexample to a common wrong solution:

Always choosing the first element as a quickselect pivot looks fine on random arrays, but on already sorted input it repeatedly produces the worst partition and degrades toward quadratic behavior.

## 8. Practice Problems

### Easy
- Divisor Game Variant: determine whether the first player wins under simple move rules; expected pattern or core idea: winning and losing states.
- Nim Basics: classify whether the first player wins; expected pattern or core idea: xor invariant.
- Stone Removal Game: allowed-move pile game with small `n`; expected pattern or core idea: game DP.

### Medium
- Flip Game II: determine whether the first player can force a win; expected pattern or core idea: memoized game-state search.
- Predict the Winner: optimal play on an array of scores; expected pattern or core idea: minimax-style DP.
- K-th Largest Element: select without full sort; expected pattern or core idea: randomized quickselect.

### Hard
- Multi-Pile Impartial Game Variant: derive or disprove an invariant; expected pattern or core idea: Sprague-Grundy style reasoning or counterexample design.
- Adversarial Pivot Analysis: compare deterministic and randomized selection on worst-case inputs; expected pattern or core idea: expected versus worst-case analysis.
- Strategic State Compression Game: classify large state spaces efficiently; expected pattern or core idea: memoization plus invariant reasoning.

## 9. Short Recap

The core idea is to classify states and guarantees explicitly: winning versus losing in games, expected versus worst-case in randomized algorithms. The strongest recognition clue is either optimal turn-based play or a deterministic heuristic that is fragile on adversarial input. The key optimization insight is that state invariants and randomness both eliminate large bad search spaces, but they do so for different reasons. The most important implementation warning is to keep guarantee language honest and to test against adversarial constructions, not just friendly random cases. This prepares the next chapter by strengthening the exact reasoning needed when multiple patterns must be composed inside one hard problem.

## 10. Coverage Check

- 22.1 Game Theory Pattern - covered
- 22.2 Randomized Algorithm Pattern revisited - covered
- 22.3 Winning states, losing states, and turn-based analysis - covered
- 22.4 Expected behavior versus worst-case guarantees - covered
- 22.5 Adversarial testing and counterexample design - covered
- 22.6 When randomness simplifies an otherwise hard strategy - covered

- Coverage Summary: 6/6 official subtopics covered
- This must always be 6/6 before final output

Next: 23: Hybrid Pattern Composition
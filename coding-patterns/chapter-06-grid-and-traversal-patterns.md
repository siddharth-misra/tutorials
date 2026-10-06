# 6: Grid and Traversal Patterns

## 0. Introduction

This chapter sits in Part II - Simulation, Ordering, and Search Space Control (Weeks 5-9), with the roadmap treating it as intermediate work. Its goal is to learn how to model grids as structured traversal spaces so you can scan cells safely, explore connected regions correctly, and choose between DFS-style and BFS-style expansion with confidence. This chapter directly supports the Part II outcome of modeling state with queues and using invariants to keep simulations and traversals correct.

Read it as a bridge in the larger sequence. Chapter 5 focused on ordered simulation state in stacks and queues. This chapter uses queues and traversal state to move through 2D spaces. Chapter 7 turns traversal-style reasoning into binary search invariants and bounded search over ordered domains. Start this chapter after you are comfortable with Chapters 1 through 5, especially loops, queues, simple recursion, and the idea of pending frontier state. The main themes here are Matrix Traversal Pattern, Flood Fill Pattern, Multi-Source BFS Pattern, Boundary checks, visited state, and direction vectors, Layered expansion versus DFS-style exploration, and Visual walkthroughs for grid problems.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to traverse matrices with direction vectors, implement flood fill, run multi-source BFS, reason about visited state and boundary checks, and explain when layered expansion is better than DFS-style exploration.

## 1. Intuition First

This chapter matters because many grid problems look like array problems on the surface but behave like graph problems underneath. Each cell is a state. Each legal move to a neighbor is an edge. Once you see that, the problem becomes much easier to organize.

The simplest analogy is moving through city blocks. A map is printed as rows and columns, but what matters operationally is where you can move next, what blocks you have already visited, and whether you are exploring deeply down one path or expanding outward layer by layer.

The core mental model is:

- matrix traversal visits cells in a disciplined order
- flood fill explores a connected region under a matching rule
- BFS expands the frontier in distance layers
- multi-source BFS starts those layers from many origins at once
- direction vectors prevent repeated neighbor code and reduce boundary mistakes

Recognition signals for this chapter:

- rectangular input with row and column indices
- movement to up, down, left, and right neighbors
- connected components or islands
- shortest steps in an unweighted grid
- spread, infection, rotting, or nearest-source wording

The most common beginner confusion point is thinking that a grid is just a nested loop problem. The nested loops only find starting cells. The real challenge is usually neighbor traversal, visited-state discipline, and deciding whether to go deep first or layer first.

In the larger roadmap, this chapter is the bridge from sequence-based patterns to graph-style reasoning. It builds traversal habits that later chapters reuse on trees, graphs, and shortest-path problems.

## 2. Learning Path and Recognition Checklist

The chapter starts with safe matrix traversal, because all later grid patterns depend on correct coordinates, neighbor generation, and boundary checks. It then moves to flood fill, which introduces component exploration and visited-state discipline. After that, it compares DFS-style exploration with BFS-style layered expansion. It finishes with multi-source BFS, where several starting cells expand simultaneously and the first arrival gives the shortest distance or earliest time.

Recognition checklist for this chapter:

- Is the input a grid where neighboring cells define legal moves?
- Do I need to visit every cell once or only cells in a connected region?
- Does the problem ask for connected components, recoloring, area, perimeter, or reachability?
- Does it ask for minimum steps or minimum time in an unweighted grid?
- Are there multiple starting sources whose waves should expand together?
- Do I need a separate visited structure, or can I mark the grid in place safely?
- Are the legal directions four-directional or eight-directional?

The brute-force baselines often look like this:

- rescanning the whole grid repeatedly until nothing changes
- launching a fresh search from many cells without remembering visited state
- performing a BFS from each target cell instead of from all sources once

The optimization is to traverse each relevant cell a controlled number of times and to preserve frontier or visited state so work is never repeated unnecessarily.

Mastery by the end of the chapter looks like this: you can define what a cell means, what neighbors are legal, when a cell becomes visited, and why DFS or BFS is the right exploration order.

Do not force DFS or BFS without naming the objective. DFS is natural for component marking and exhaustive exploration. BFS is the right first choice when you need minimum steps in an unweighted grid or simultaneous wave expansion.

## 3. Official Subtopic Coverage

### Concept Cluster: Matrix Traversal Mechanics
Official subtopics covered:
- 6.1 Matrix Traversal Pattern
- 6.4 Boundary checks, visited state, and direction vectors

#### Definition or Framing
Matrix traversal is the disciplined process of visiting grid cells while respecting row and column boundaries. In more interesting grid problems, traversal also requires visited-state control and compact neighbor generation through direction vectors.

#### Recognition Signals
- grid input given as `rows x cols`
- need to scan every cell or inspect neighbors
- repeated code for up, down, left, right movements would be error-prone
- revisiting a cell would cause repeated work or infinite loops

#### Brute-Force Baseline
The naive baseline is usually ad hoc coordinate handling:

- nested loops plus repeated handwritten neighbor checks
- no shared direction array
- delayed or missing visited marking

That style works on tiny examples but creates boundary bugs and repeated logic.

#### Optimized Pattern Idea
Represent directions once, centralize the in-bounds test, and decide clearly whether a cell should be marked visited in a separate matrix or directly in the input grid.

#### Invariant / State Representation / Transition Logic
Every cell processed by the algorithm must satisfy three conditions:

1. It is inside the grid bounds.
2. It is relevant to the current task.
3. It has not already been fully processed under the same traversal.

#### Java Implementation Notes
- store `rows = grid.length` and `cols = grid[0].length`
- use a shared direction array such as `{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}`
- use a `boolean[][] visited` when mutating the grid is unsafe or forbidden
- mark a cell visited as soon as it enters the frontier if duplicate enqueues are possible

#### Quick Dry Run
For a cell `(2, 3)` and four-direction movement, the candidate neighbors are `(3, 3)`, `(1, 3)`, `(2, 4)`, and `(2, 2)`. Each one must pass the same boundary and eligibility checks before use.

#### Common Mistakes
- swapping row and column indices
- checking `grid.length` for both dimensions
- marking visited too late and enqueuing the same cell multiple times
- using diagonal moves when the problem only allows four directions

#### Debugging Strategy
Print `(row, col)` coordinates and each accepted neighbor on a `3 x 3` example. Most grid bugs are coordinate or timing bugs, not high-level logic bugs.

#### Comparison with Similar Pattern
Matrix traversal is not yet graph traversal in full generality, but it should be thought of as graph traversal over an implicit graph whose nodes are cells and whose edges are legal moves.

#### Advanced Note
Later chapters generalize direction vectors to knight moves, weighted transitions, and compressed coordinate systems, but the core discipline stays the same.

### Concept Cluster: Flood Fill and Exploration Style
Official subtopics covered:
- 6.2 Flood Fill Pattern
- 6.5 Layered expansion versus DFS-style exploration

#### Definition or Framing
Flood fill explores every cell in a connected region that satisfies a rule, such as the same color or the same terrain type. DFS-style exploration goes deep along one path before backtracking. BFS-style exploration expands outward one layer at a time.

#### Recognition Signals
- connected component counting or marking
- recolor or replace all connected matching cells
- measure the area, perimeter, or reachability of a region
- need to decide whether depth-first or layer-by-layer exploration better matches the objective

#### Brute-Force Baseline
- rescan the whole grid repeatedly until no more cells change
- from each cell, launch fresh searches without remembering which region has already been handled

#### Optimized Pattern Idea
Start once from a valid seed cell, then use DFS or BFS to visit exactly the cells in that component. Mark them as visited immediately so they are never reprocessed.

#### Invariant / State Representation / Transition Logic
The traversal frontier contains cells that belong to the current component and whose neighbors have not yet been fully explored. DFS explores a path deeply before retreating. BFS expands in uniform distance layers.

#### Java Implementation Notes
- recursive DFS is concise but can risk stack overflow on very large grids
- iterative DFS uses an explicit stack if needed
- BFS uses a queue and is preferable when distance or time layers matter

#### Quick Dry Run
In a flood fill starting at `(1, 1)`, once a cell with the original color is accepted, its valid neighbors are explored under the same color rule. Cells with other colors are simply ignored, not marked as part of the region.

#### Common Mistakes
- forgetting to store the original color before recoloring
- marking visited after recursive calls instead of before them
- using DFS when the problem actually asks for minimum distance
- mixing four-directional and diagonal connectivity rules

#### Debugging Strategy
Draw a tiny grid and number the visitation order. If the order matters to the answer, you probably need BFS. If only full component coverage matters, DFS is often simpler.

#### Comparison with Similar Pattern
DFS and BFS can both cover a component. The difference is not correctness of coverage but the meaning of the visitation order. BFS preserves shortest-layer distance in unweighted grids. DFS does not.

#### Advanced Note
The DFS-versus-BFS choice later becomes the difference between simple reachability, shortest path, and topological-style layer processing.

### Concept Cluster: Multi-Source BFS and Visual Grid Reasoning
Official subtopics covered:
- 6.3 Multi-Source BFS Pattern
- 6.6 Visual walkthroughs for grid problems

#### Definition or Framing
Multi-source BFS starts from every source cell at once and expands outward in layers. It is the right model when you need the nearest source, the earliest spread time, or simultaneous propagation.

#### Recognition Signals
- many starting cells influence the grid simultaneously
- nearest zero, nearest gate, nearest fire, or nearest rotten orange style wording
- minimum time or minimum number of steps in an unweighted grid

#### Brute-Force Baseline
- run a separate BFS from every target cell to find the closest source
- simulate time by rescanning the entire grid minute by minute

#### Optimized Pattern Idea
Enqueue all sources with distance or time zero. Then perform one BFS. The first time a cell is reached is its shortest distance or earliest arrival time.

#### Invariant / State Representation / Transition Logic
When a cell is dequeued in BFS, all cells already processed are at the same or smaller distance. In multi-source BFS, this means the first arrival to each cell is the shortest arrival from any source.

#### Java Implementation Notes
- initialize the queue with every source cell before the BFS loop starts
- use level-by-level processing or store distance separately when the exact time is needed
- mark cells when enqueuing them, not when dequeuing, to avoid duplicates

#### Quick Dry Run
In rotting oranges, every rotten orange starts in the queue at minute `0`. Fresh oranges reached in the next expansion become rotten at minute `1`, and so on. The layers are the minutes.

#### Common Mistakes
- starting from only one source when the problem has many
- incrementing time once per cell instead of once per layer
- failing to detect unreachable cells that were never visited

#### Debugging Strategy
Write the initial frontier, then label each BFS layer as minute `0`, `1`, `2`, and so on. If a cell first appears in the wrong layer, the enqueue or cleanup logic is wrong.

#### Comparison with Similar Pattern
Single-source BFS asks, "how far is everything from this one start?" Multi-source BFS asks, "what is the nearest or earliest influence from any valid start?"

#### Advanced Note
Later graph chapters reuse exactly this idea when several nodes start active at distance zero, such as topological layers or shortest paths from many origins.

## 4. Pattern Template, State Model, or Core Workflow

Canonical matrix traversal and direction-vector template:

```java
int rows = grid.length;
int cols = grid[0].length;
int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

for (int row = 0; row < rows; row++) {
    for (int col = 0; col < cols; col++) {
        // inspect or start traversal
    }
}
```

Canonical DFS-style flood-fill template:

```java
private void dfs(int[][] image, int row, int col, int originalColor, int newColor) {
    if (row < 0 || row >= image.length || col < 0 || col >= image[0].length) {
        return;
    }
    if (image[row][col] != originalColor) {
        return;
    }

    image[row][col] = newColor;
    for (int[] direction : DIRECTIONS) {
        dfs(image, row + direction[0], col + direction[1], originalColor, newColor);
    }
}
```

Canonical BFS-style component or shortest-path template:

```java
Deque<int[]> queue = new ArrayDeque<>();
queue.offerLast(new int[] {startRow, startCol});
visited[startRow][startCol] = true;

while (!queue.isEmpty()) {
    int[] cell = queue.pollFirst();
    int row = cell[0];
    int col = cell[1];

    for (int[] direction : DIRECTIONS) {
        int nextRow = row + direction[0];
        int nextCol = col + direction[1];
        if (isValid(nextRow, nextCol) && !visited[nextRow][nextCol]) {
            visited[nextRow][nextCol] = true;
            queue.offerLast(new int[] {nextRow, nextCol});
        }
    }
}
```

Canonical multi-source BFS template:

```java
Deque<int[]> queue = new ArrayDeque<>();
for (int row = 0; row < rows; row++) {
    for (int col = 0; col < cols; col++) {
        if (isSource(row, col)) {
            queue.offerLast(new int[] {row, col});
            visited[row][col] = true;
        }
    }
}
```

Important state decisions:

- whether visited state is separate or encoded by mutating the grid
- whether DFS or BFS matches the objective
- whether distance or time should be stored by levels or per-cell values
- whether the directions are four-way or eight-way

Safety rules:

- centralize boundary checks
- mark visited immediately when a cell joins the frontier
- preserve the original value being matched in flood fill problems
- choose BFS whenever the first arrival distance matters in an unweighted grid

What usually breaks first is visited-state timing. A correct traversal idea can still duplicate work or loop forever if cells are marked too late.

Adapt the templates by changing the cell eligibility rule, direction set, or frontier initialization, but keep the boundary and visited discipline unchanged.

## 5. Worked Examples and Full Solutions

### Worked Example 1: Spiral Matrix Traversal
#### Problem Statement
Given an `m x n` matrix, return all elements of the matrix in spiral order.

#### Why This Example Matters
This is a pure matrix-traversal problem. It teaches controlled boundary movement without requiring visited state.

#### Input and Constraints
- matrix may be rectangular, not necessarily square
- every cell must be visited exactly once

#### Recognition Signals
- grid input
- deterministic visitation order
- boundary shrink after completing a side

#### Brute-Force Approach
Use a visited matrix and walk step by step, turning whenever you hit a boundary or visited cell.

#### Better Pattern-Based Approach
Track four boundaries: `top`, `bottom`, `left`, and `right`. Traverse one side at a time and shrink the corresponding boundary.

#### Why the Pattern Fits
The traversal order is fully determined by shrinking the unvisited rectangle. No extra visited structure is needed.

#### Invariant or State Transition
At every stage, the remaining unvisited cells form a smaller rectangle bounded by `top`, `bottom`, `left`, and `right`.

#### Pragmatic Java Choice
Use an `ArrayList<Integer>` for the output and four integer boundaries.

#### Dry Run Before Code
For

```text
1 2 3
4 5 6
7 8 9
```

the traversal is top row `1 2 3`, right column `6 9`, bottom row `8 7`, left column `4`, then the center `5`.

#### Java Solution
```java
import java.util.ArrayList;
import java.util.List;

public class SpiralMatrixTraversal {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> order = new ArrayList<>();
        int top = 0;
        int bottom = matrix.length - 1;
        int left = 0;
        int right = matrix[0].length - 1;

        while (top <= bottom && left <= right) {
            for (int col = left; col <= right; col++) {
                order.add(matrix[top][col]);
            }
            top++;

            for (int row = top; row <= bottom; row++) {
                order.add(matrix[row][right]);
            }
            right--;

            if (top <= bottom) {
                for (int col = right; col >= left; col--) {
                    order.add(matrix[bottom][col]);
                }
                bottom--;
            }

            if (left <= right) {
                for (int row = bottom; row >= top; row--) {
                    order.add(matrix[row][left]);
                }
                left++;
            }
        }

        return order;
    }
}
```

#### Time and Space Complexity
- Brute force with visited matrix: $O(mn)$ time, $O(mn)$ extra space
- Boundary-guided traversal: $O(mn)$ time, $O(1)$ extra space beyond output

#### Edge Cases
- single row
- single column
- rectangular matrix
- center cell in odd dimensions

#### Common Mistakes
- forgetting boundary checks before traversing the bottom row or left column
- visiting a row or column twice when the remaining rectangle collapses
- mixing row and column loops

### Worked Example 2: Flood Fill
#### Problem Statement
Given an image represented by a grid of integers, a starting cell `(sr, sc)`, and a new color, recolor the starting cell and every four-directionally connected cell with the same original color.

#### Why This Example Matters
This is the standard flood-fill problem because the task is exactly to explore one connected component under a color-matching rule.

#### Input and Constraints
- four-direction connectivity
- only cells with the original starting color belong to the component

#### Recognition Signals
- connected region
- same-value expansion rule
- recolor all reachable matching cells

#### Brute-Force Approach
Repeatedly scan the whole grid and recolor any cell adjacent to an already recolored matching cell until no further changes occur.

#### Better Pattern-Based Approach
Run DFS or BFS from the starting cell, visiting only cells that have the original color.

#### Why the Pattern Fits
The component has one natural seed and a local rule for entering neighbors, so direct traversal is much cheaper than repeated global rescans.

#### Invariant or State Transition
Every visited cell in the traversal belongs to the target component and is recolored exactly once.

#### Pragmatic Java Choice
A recursive DFS is concise for explanation. For very large grids, an iterative version may be safer in Java.

#### Dry Run Before Code
If the starting color is `1`, then from `(sr, sc)` you only continue into neighbors whose value is also `1`. As soon as a cell is recolored, it should not be processed again.

#### Java Solution
```java
public class FloodFillSolver {
    private static final int[][] DIRECTIONS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int[][] floodFill(int[][] image, int sr, int sc, int newColor) {
        int originalColor = image[sr][sc];
        if (originalColor == newColor) {
            return image;
        }

        fill(image, sr, sc, originalColor, newColor);
        return image;
    }

    private void fill(int[][] image, int row, int col, int originalColor, int newColor) {
        if (row < 0 || row >= image.length || col < 0 || col >= image[0].length) {
            return;
        }
        if (image[row][col] != originalColor) {
            return;
        }

        image[row][col] = newColor;

        for (int[] direction : DIRECTIONS) {
            fill(image, row + direction[0], col + direction[1], originalColor, newColor);
        }
    }
}
```

#### Time and Space Complexity
- Brute force repeated rescans: up to $O((mn)^2)$ time in the worst case
- Flood fill traversal: $O(mn)$ time in the worst case, with recursion stack up to $O(mn)$ in the worst case

#### Edge Cases
- starting cell already has the new color
- single-cell component
- entire grid is one component
- thin path-like region causing deep recursion

#### Common Mistakes
- forgetting to save the original color before recoloring
- recoloring first and then comparing neighbors to the new color instead of the original color
- using diagonal neighbors by mistake

### Worked Example 3: Number of Islands
#### Problem Statement
Given a grid of `'1'` and `'0'` cells, return the number of islands, where an island is a group of horizontally or vertically connected `'1'` cells.

#### Why This Example Matters
This example turns flood fill into component counting and makes the DFS-versus-BFS choice concrete.

#### Input and Constraints
- four-direction connectivity
- the grid may contain many separate components
- every land cell should belong to exactly one counted island

#### Recognition Signals
- connected components
- need to count regions, not just explore one known region
- global scan plus local traversal

#### Brute-Force Approach
For every land cell, try to determine from scratch whether it belongs to a previously seen island by scanning surrounding cells repeatedly.

#### Better Pattern-Based Approach
Scan the grid. Every time you find unvisited land, start a DFS or BFS to mark the entire island and increment the count once.

#### Why the Pattern Fits
The global nested loops locate component seeds. The local traversal covers each component exactly once.

#### Invariant or State Transition
Every time a traversal starts, it marks one entire island. No land cell is counted twice because it is marked visited when first reached.

#### Pragmatic Java Choice
Use in-place mutation from `'1'` to `'0'` to avoid an extra visited matrix when modifying the grid is allowed.

#### Dry Run Before Code
On a grid with two separated land masses, the outer scan hits the first land cell, DFS marks that whole island, and later the outer scan skips all those cells because they are already marked. When the second island is found, the count increases again.

#### Java Solution
```java
public class NumberOfIslands {
    private static final int[][] DIRECTIONS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int numIslands(char[][] grid) {
        int islandCount = 0;

        for (int row = 0; row < grid.length; row++) {
            for (int col = 0; col < grid[0].length; col++) {
                if (grid[row][col] == '1') {
                    islandCount++;
                    sinkIsland(grid, row, col);
                }
            }
        }

        return islandCount;
    }

    private void sinkIsland(char[][] grid, int row, int col) {
        if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {
            return;
        }
        if (grid[row][col] != '1') {
            return;
        }

        grid[row][col] = '0';

        for (int[] direction : DIRECTIONS) {
            sinkIsland(grid, row + direction[0], col + direction[1]);
        }
    }
}
```

#### Time and Space Complexity
- Brute force repeated region checks: can degrade far beyond linear work
- Component traversal: $O(mn)$ time because each cell is processed at most once, with recursion stack up to $O(mn)$ in the worst case

#### Edge Cases
- empty grid
- all water
- all land
- many one-cell islands

#### Common Mistakes
- incrementing the island count for every land cell instead of every unvisited island seed
- forgetting to mark visited land and recounting the same island later
- using the wrong connectivity rule

### Worked Example 4: Rotting Oranges with Multi-Source BFS
#### Problem Statement
You are given a grid where `0` is empty, `1` is a fresh orange, and `2` is a rotten orange. Every minute, any fresh orange adjacent to a rotten orange becomes rotten. Return the minimum number of minutes needed until no fresh orange remains, or `-1` if this is impossible.

#### Why This Example Matters
This is the classic multi-source BFS problem because many sources spread simultaneously and the answer is the number of BFS layers.

#### Input and Constraints
- four-direction spread
- all initially rotten oranges start spreading at the same time
- some fresh oranges may be unreachable

#### Recognition Signals
- simultaneous spread from many sources
- minimum time in discrete steps
- layer-by-layer expansion in an unweighted grid

#### Brute-Force Approach
Simulate minute by minute by rescanning the full grid and rotting any fresh orange adjacent to a currently rotten one.

#### Better Pattern-Based Approach
Put all initially rotten oranges into the queue first, count fresh oranges, and run one BFS layer per minute.

#### Why the Pattern Fits
The first time a fresh orange is reached is the earliest minute it can rot. BFS layers match elapsed minutes exactly.

#### Invariant or State Transition
At the start of each BFS layer, the queue contains exactly the oranges that became rotten in the previous minute. Their fresh neighbors become rotten for the next minute.

#### Pragmatic Java Choice
Store coordinates as `int[]` pairs in an `ArrayDeque<int[]>` and process the queue layer by layer.

#### Dry Run Before Code
If three rotten oranges start in different parts of the grid, all three are inserted at minute `0`. Their fresh neighbors rot at minute `1`, and those newly rotten neighbors form the frontier for minute `2`.

#### Java Solution
```java
import java.util.ArrayDeque;
import java.util.Deque;

public class RottingOranges {
    private static final int[][] DIRECTIONS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int orangesRotting(int[][] grid) {
        Deque<int[]> queue = new ArrayDeque<>();
        int freshCount = 0;

        for (int row = 0; row < grid.length; row++) {
            for (int col = 0; col < grid[0].length; col++) {
                if (grid[row][col] == 2) {
                    queue.offerLast(new int[] {row, col});
                } else if (grid[row][col] == 1) {
                    freshCount++;
                }
            }
        }

        int minutes = 0;

        while (!queue.isEmpty() && freshCount > 0) {
            int layerSize = queue.size();

            for (int count = 0; count < layerSize; count++) {
                int[] cell = queue.pollFirst();
                int row = cell[0];
                int col = cell[1];

                for (int[] direction : DIRECTIONS) {
                    int nextRow = row + direction[0];
                    int nextCol = col + direction[1];

                    if (nextRow < 0 || nextRow >= grid.length || nextCol < 0 || nextCol >= grid[0].length) {
                        continue;
                    }
                    if (grid[nextRow][nextCol] != 1) {
                        continue;
                    }

                    grid[nextRow][nextCol] = 2;
                    freshCount--;
                    queue.offerLast(new int[] {nextRow, nextCol});
                }
            }

            minutes++;
        }

        return freshCount == 0 ? minutes : -1;
    }
}
```

#### Time and Space Complexity
- Brute force repeated rescans: up to $O((mn)^2)$ time in the worst case
- Multi-source BFS: $O(mn)$ time, $O(mn)$ space in the worst case for the queue

#### Edge Cases
- no fresh oranges at the start
- no rotten oranges at the start while fresh oranges exist
- isolated fresh oranges that can never be reached
- all cells empty

#### Common Mistakes
- starting BFS from only one rotten orange
- incrementing time per cell instead of per layer
- marking cells rotten when dequeued instead of when enqueued, which can duplicate work

## 6. Complexity and Comparison Guide

The chapter's main trade-off is between repeated global rescans and targeted traversal of relevant cells.

- matrix traversal visits each cell a controlled number of times, usually $O(mn)$ total
- flood fill and component counting process each reachable cell once, giving $O(mn)$ time
- BFS and multi-source BFS also run in $O(mn)$ on a grid because each cell enters the queue at most once

Comparison with similar patterns:

- DFS versus BFS: both can cover components, but BFS is the right tool when shortest distance or minimum time matters in an unweighted grid.
- Single-source versus multi-source BFS: single-source BFS measures distance from one start; multi-source BFS measures nearest or earliest reach from any start.
- Separate visited matrix versus in-place marking: separate visited state preserves the input; in-place marking saves memory when mutation is allowed.
- Plain nested loops versus full traversal: loops alone only enumerate coordinates. Traversal logic is needed once neighbors and components matter.

Decision criteria:

- choose matrix traversal when every cell must be inspected in a systematic order
- choose flood fill when one seed or one discovered component should expand through matching neighbors
- choose DFS for simple exhaustive component coverage when visitation order does not encode distance
- choose BFS for minimum-step propagation in unweighted grids
- choose multi-source BFS when several starts expand simultaneously

Signals that you should not force this chapter's techniques:

- the problem is not neighbor-based, so a grid interpretation is unnecessary
- the graph edges are weighted, so plain BFS no longer gives shortest paths
- diagonal movement is assumed without being allowed by the statement

What breaks when invariants fail is usually visited or frontier timing. The traversal may still appear to work on tiny cases while duplicating work or miscounting layers on larger ones.

## 7. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:

- row and column indices swapped
- boundary checks using the wrong dimension
- marking visited too late and enqueuing the same cell multiple times
- mixing four-direction and eight-direction movement
- using DFS for a shortest-distance question and expecting layer semantics
- incrementing BFS time or distance at the wrong moment

Boundary and mutation risks:

- empty grid or one-cell grid
- mutating the grid when the caller expects the original to remain unchanged
- recursion depth issues on large connected components
- unreachable targets that should produce `-1` or remain unvisited

Short debugging checklist:

1. What cells are legal neighbors?
2. When does a cell become visited: at enqueue, at dequeue, or at entry into DFS?
3. Does the answer depend on coverage only, or on exact BFS layers?
4. Am I preserving the original cell value needed for component membership checks?
5. Can I dry run the algorithm on a `3 x 3` grid and label each visitation order by hand?

Quick counterexample that defeats a common wrong solution:

If you mark visited only when dequeuing in a multi-source BFS, the same fresh cell can be enqueued by two neighboring rotten cells in the same minute. That duplicates work and can break time accounting in problems like rotting oranges.

## 8. Practice Problems

### Easy
- Flood Fill: Recolor all connected cells with the same original color. Expected pattern or core idea: flood fill traversal.
- Island Perimeter: Compute the boundary length of a land mass. Expected pattern or core idea: matrix traversal with neighbor checks.
- Count Servers that Communicate: Count cells sharing a row or column with another server. Expected pattern or core idea: matrix traversal plus row and column accumulation.

### Medium
- Number of Islands: Count connected land components. Expected pattern or core idea: flood fill with visited marking.
- 01 Matrix: For each cell, find distance to the nearest zero. Expected pattern or core idea: multi-source BFS.
- Walls and Gates: Fill empty rooms with distance to the nearest gate. Expected pattern or core idea: multi-source BFS.

### Hard
- Shortest Path in a Grid with Obstacles Elimination: Reach the target under state constraints. Expected pattern or core idea: BFS with expanded state.
- Escape a Large Maze: Decide whether movement through blocked cells is possible. Expected pattern or core idea: bounded BFS with visited state.
- Minimum Moves to Move a Box to Their Target Location: Find minimum pushes in a grid. Expected pattern or core idea: BFS over composite grid state.

## 9. Short Recap

The core idea of this chapter is that a grid should be treated as an implicit graph with careful coordinate, boundary, and frontier rules. The strongest recognition clue is neighbor-based movement, connected components, or shortest unweighted spread across cells. The most important optimization insight is that each relevant cell should usually be visited only once under a clear visited-state discipline. The main implementation warning is that grid bugs usually come from timing of visited marking or incorrect boundary handling, not from the high-level traversal choice alone. This chapter prepares the next one by turning traversal reasoning into invariant-based search over ordered domains.

## 10. Coverage Check

- 6.1 Matrix Traversal Pattern - Covered
- 6.2 Flood Fill Pattern - Covered
- 6.3 Multi-Source BFS Pattern - Covered
- 6.4 Boundary checks, visited state, and direction vectors - Covered
- 6.5 Layered expansion versus DFS-style exploration - Covered
- 6.6 Visual walkthroughs for grid problems - Covered

- Coverage Summary: 6/6 official subtopics covered

Next: 7: Binary Search Families
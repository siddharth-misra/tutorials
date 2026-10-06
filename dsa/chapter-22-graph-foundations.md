# 22: Graph Foundations

**Goal:** Teach how to think about graphs as models of relationships, choose a useful graph representation, and translate real problems into nodes and edges before applying algorithms.
**Outcome:** By the end of this chapter, you can define core graph terminology, build adjacency lists and adjacency matrices in Java, distinguish directed, undirected, and weighted graphs, and model real-world and interview problems as graphs without guessing.

---

## 1. Intuition First

Graphs matter because many problems are not about order in an array or shape in a tree. They are about relationships:
- cities connected by roads
- users connected by friendships
- courses connected by prerequisites
- states connected by allowed moves

A simple real-world analogy is a transit map. Stations are nodes. Tracks are edges. Once you see the map that way, later algorithms like BFS, DFS, shortest path, and topological ordering become natural.

The core mental model is this:
- nodes represent entities or states
- edges represent allowed relationships or moves
- graph algorithms answer questions about reachability, structure, cost, and dependency

The most common beginner confusion point is waiting for a problem statement to say the word "graph". Many graph problems never say it directly. You must notice that the problem is really about objects and connections.

In the roadmap, this chapter starts Part V. The goal is not heavy graph algorithms yet. The goal is correct modeling. Traversal comes next.

## 2. Core Concepts and Techniques

### Concept Cluster: Basic Representation
Key concepts in this block:
- 22.1 Graph terminology
- 22.2 Adjacency list
- 22.3 Adjacency matrix

#### Intuition

A graph is a set of nodes and edges. The first practical decision is how to store those connections.

#### Why It Matters

Graph algorithms are only as clean as the representation underneath them. The same algorithm can feel easy or awkward depending on how the graph is stored.

#### How It Works

Important terminology:
- vertex or node: one entity in the graph
- edge: a connection between two nodes
- path: a sequence of connected edges
- cycle: a path that starts and ends at the same node without trivial repetition
- degree: number of incident edges in an undirected graph
- indegree and outdegree: number of incoming and outgoing edges in a directed graph
- connected component: a maximal connected region in an undirected graph

Two common representations:
- adjacency list: for each node, store its neighbors
- adjacency matrix: store whether edge `(u, v)` exists in a 2D table

#### Java Implementation Notes

- Adjacency list is often `List<List<Integer>>`.
- Weighted adjacency list commonly uses `List<List<Edge>>`.
- Adjacency matrix can be `boolean[][]`, `int[][]`, or `Long[][]` depending on the problem.
- Sparse graphs usually prefer adjacency lists.
- Dense graphs or constant-time edge existence checks may prefer adjacency matrices.

#### Common Mistakes

- forgetting isolated nodes that have no edges
- storing undirected edges in only one direction
- using an adjacency matrix when `V` is large and memory becomes a problem

#### Quick Example

If the graph has edges `(0, 1)` and `(0, 2)`:
- adjacency list for node `0` is `[1, 2]`
- adjacency matrix has `matrix[0][1] = true` and `matrix[0][2] = true`

#### Debugging Tip

Before writing any algorithm, print the graph representation once. Many later bugs are actually construction bugs.

#### Advanced Note

Representation choice affects both runtime and how natural the later code feels. Good graph work starts before traversal.

### Concept Cluster: Graph Types
Key concepts in this block:
- 22.4 Directed and undirected graphs
- 22.5 Weighted graphs

#### Intuition

Edges can have direction, weight, both, or neither. Those choices change what the graph means.

#### Why It Matters

The same pair `(u, v)` can represent:
- mutual friendship in an undirected graph
- one-way dependency in a directed graph
- travel cost or latency in a weighted graph

#### How It Works

Undirected graph:
- edge `(u, v)` means the connection works both ways
- store both `u -> v` and `v -> u` in an adjacency list

Directed graph:
- edge `(u, v)` means movement or dependency only from `u` to `v`
- store one direction only unless the reverse edge also exists

Weighted graph:
- edges carry a number such as distance, cost, time, or probability
- the edge storage must keep both the destination and the weight

#### Java Implementation Notes

- For undirected adjacency lists, always add both directions in the builder.
- A small `Edge` class is usually cleaner than parallel lists.
- Use `long` for weights if costs may grow large.

#### Common Mistakes

- accidentally treating a directed problem as undirected
- duplicating weights incorrectly in undirected graphs
- losing the meaning of the weight when naming fields too vaguely

#### Quick Example

Flights are usually directed and weighted:
- `Delhi -> Mumbai (120)` means a direct route with cost `120`
- it does not automatically imply `Mumbai -> Delhi (120)`

#### Debugging Tip

Ask one question early: "If I can go from `u` to `v`, can I always go back?" That single question prevents many direction bugs.

#### Advanced Note

Some problems are better modeled as layered or state graphs where direction and weight come from transitions, not from a physical map.

### Concept Cluster: Problem Modeling
Key concepts in this block:
- 22.6 Modeling real problems as graphs

#### Intuition

Modeling means deciding what should become a node and what should become an edge.

#### Why It Matters

Many graph problems are lost before the algorithm starts because the nodes or edges were chosen poorly.

#### How It Works

A practical modeling checklist:
- what are the entities or states?
- what transition or relationship connects them?
- is the connection one-way or two-way?
- does each edge need a weight?
- should the graph be built explicitly, or can neighbors be generated on the fly?

Examples:
- social network: users are nodes, friendships are edges
- course plan: courses are nodes, prerequisite rules are directed edges
- grid maze: cells are nodes, legal moves are edges
- lock puzzle: lock states are nodes, one dial move is an edge

#### Java Implementation Notes

- Not every graph must be materialized fully.
- Grid and state-space problems often use implicit graphs where neighbors are generated when needed.
- If identifiers are strings or objects, map them to integer indices when performance matters.

#### Common Mistakes

- choosing edges that are too vague
- ignoring direction in dependency problems
- materializing a massive graph when neighbors can be generated locally
- using expensive object-heavy structures when integer indexing is enough

#### Quick Example

In a maze:
- node: one open cell
- edge: one legal move to a neighboring open cell
- graph type: usually unweighted, often implicit, usually directed and undirected are equivalent because moves work both ways

#### Debugging Tip

State the model in one sentence before coding: "Nodes are ..., edges are ...". If that sentence feels unclear, the implementation will be unclear too.

#### Advanced Note

A good model often matters more than the first algorithm you try. Traversal becomes straightforward when the model is clean.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Build an Undirected Graph with an Adjacency List
#### Problem Statement

Given `n` nodes labeled `0` to `n - 1` and a list of undirected edges, build the graph and return the neighbors of any requested node.

#### Why This Example Matters

Adjacency lists are the default representation for sparse graphs and for most traversal algorithms in the next chapter.

#### Constraints or Assumptions

- nodes are labeled with integers
- edges are undirected
- neighbor order is not guaranteed unless you sort it

#### Brute-Force Approach

Store only the edge list. Whenever you need the neighbors of a node, scan every edge and collect matches.

#### Better Approach

Build an adjacency list once.

#### Why the Better Approach Works

The edge list repeats the same scan for every neighbor query. The adjacency list spends $O(E)$ once and then answers neighbor lookup directly from the stored list.

#### Pragmatic Java Choice

Use:
- `List<List<Integer>>` for the graph
- one `ArrayList` per node
- optional sorting if deterministic output helps debugging

#### Java Solution

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class AdjacencyListExample {
    static List<Integer> neighborsFromEdgeList(int node, int[][] edges) {
        List<Integer> neighbors = new ArrayList<>();
        for (int[] edge : edges) {
            if (edge[0] == node) {
                neighbors.add(edge[1]);
            } else if (edge[1] == node) {
                neighbors.add(edge[0]);
            }
        }
        Collections.sort(neighbors);
        return neighbors;
    }

    static List<List<Integer>> buildUndirectedGraph(int nodeCount, int[][] edges) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int node = 0; node < nodeCount; node++) {
            graph.add(new ArrayList<>());
        }

        for (int[] edge : edges) {
            int first = edge[0];
            int second = edge[1];
            graph.get(first).add(second);
            graph.get(second).add(first);
        }

        for (List<Integer> neighbors : graph) {
            Collections.sort(neighbors);
        }
        return graph;
    }
}
```

#### Dry Run

Suppose:
- `n = 5`
- edges are `(0, 1)`, `(0, 3)`, `(1, 4)`

Brute force for neighbors of `0`:
- scan all edges
- collect `1` and `3`

Adjacency list after building:
- `0 -> [1, 3]`
- `1 -> [0, 4]`
- `2 -> []`
- `3 -> [0]`
- `4 -> [1]`

The isolated node `2` still exists and must have an empty list.

#### Time and Space Complexity

- brute force neighbor lookup: $O(E)$ per query
- adjacency list build: $O(V + E)$
- adjacency list neighbor lookup: $O(degree(node))$
- adjacency list space: $O(V + E)$

#### Edge Cases

- isolated nodes
- repeated edges if the input allows them
- self-loops
- `n = 0`

#### Common Mistakes

- forgetting to add both directions
- skipping isolated nodes entirely
- assuming every node appears in an edge

### Worked Example 2: Direct Flight Lookup with a Weighted Directed Adjacency Matrix
#### Problem Statement

Given a set of cities and directed weighted flights, support direct-route existence checks and direct-route cost lookup.

#### Why This Example Matters

This example shows when an adjacency matrix is a better fit: many direct edge existence queries on a graph that is small enough for $O(V^2)$ storage.

#### Constraints or Assumptions

- edges are directed
- weights are nonnegative costs
- if multiple edges exist between the same pair, keep the cheapest one

#### Brute-Force Approach

Store all flights in an edge list and scan the entire list for every direct-route query.

#### Better Approach

Use a weighted adjacency matrix.

#### Why the Better Approach Works

Direct edge lookup becomes one table access instead of scanning all edges.

#### Pragmatic Java Choice

Use:
- `Long[][] matrix`
- `null` to mean "no direct edge"
- a method that keeps the smallest weight for duplicate edges

#### Java Solution

```java
class AdjacencyMatrixExample {
    static final class WeightedDirectedGraph {
        private final Long[][] matrix;

        WeightedDirectedGraph(int nodeCount) {
            this.matrix = new Long[nodeCount][nodeCount];
        }

        void addEdge(int from, int to, long weight) {
            if (matrix[from][to] == null || weight < matrix[from][to]) {
                matrix[from][to] = weight;
            }
        }

        boolean hasDirectEdge(int from, int to) {
            return matrix[from][to] != null;
        }

        long directCost(int from, int to) {
            if (matrix[from][to] == null) {
                throw new IllegalStateException("No direct edge");
            }
            return matrix[from][to];
        }
    }
}
```

#### Dry Run

Flights:
- `0 -> 1` with cost `50`
- `0 -> 2` with cost `120`
- `2 -> 1` with cost `40`

Matrix idea:
- `matrix[0][1] = 50`
- `matrix[0][2] = 120`
- `matrix[2][1] = 40`
- `matrix[1][0]` stays `null` unless that direct flight also exists

Now:
- `hasDirectEdge(0, 1)` is `true`
- `directCost(0, 1)` is `50`
- `hasDirectEdge(1, 0)` is `false`

#### Time and Space Complexity

- brute force direct lookup: $O(E)$ per query
- adjacency matrix direct lookup: $O(1)$
- build from edges: $O(E)$
- space: $O(V^2)$

#### Edge Cases

- no direct connection
- duplicate edges with different costs
- self-loops
- graphs too large for a practical matrix

#### Common Mistakes

- accidentally filling both directions for a directed graph
- using a matrix on a huge sparse graph
- not defining how duplicate edges should be handled

### Worked Example 3: Model a Grid Maze as a Graph
#### Problem Statement

Given a grid where `'.'` means open and `'#'` means blocked, model the maze so that each open cell can find its reachable neighboring cells in four directions.

#### Why This Example Matters

Many interview problems use implicit graphs. The graph is real, but building every possible edge explicitly is not always necessary.

#### Constraints or Assumptions

- moves are allowed up, down, left, and right
- blocked cells are not nodes
- the graph is unweighted for now

#### Brute-Force Approach

Treat every open cell as a node, compare it with every other open cell, and connect pairs that are one move apart.

#### Better Approach

Generate neighbors locally by checking only the four valid directions around a cell.

#### Why the Better Approach Works

A cell only has at most four relevant neighbors. Comparing against every other open cell wastes work.

#### Pragmatic Java Choice

Use:
- a small `Cell` record for readability
- a helper that checks bounds and blocked cells
- local neighbor generation instead of a full pairwise comparison

#### Java Solution

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class GridGraphModelExample {
    record Cell(int row, int col) {}

    static Map<Cell, List<Cell>> buildGraph(char[][] grid) {
        Map<Cell, List<Cell>> graph = new HashMap<>();
        for (int row = 0; row < grid.length; row++) {
            for (int col = 0; col < grid[0].length; col++) {
                if (isOpen(grid, row, col)) {
                    Cell cell = new Cell(row, col);
                    graph.put(cell, localNeighbors(grid, cell));
                }
            }
        }
        return graph;
    }

    static List<Cell> bruteForceNeighbors(char[][] grid, Cell source) {
        List<Cell> openCells = new ArrayList<>();
        for (int row = 0; row < grid.length; row++) {
            for (int col = 0; col < grid[0].length; col++) {
                if (isOpen(grid, row, col)) {
                    openCells.add(new Cell(row, col));
                }
            }
        }

        List<Cell> neighbors = new ArrayList<>();
        for (Cell candidate : openCells) {
            int distance = Math.abs(candidate.row() - source.row()) + Math.abs(candidate.col() - source.col());
            if (distance == 1) {
                neighbors.add(candidate);
            }
        }
        return neighbors;
    }

    static List<Cell> localNeighbors(char[][] grid, Cell source) {
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        List<Cell> neighbors = new ArrayList<>();

        for (int[] direction : directions) {
            int nextRow = source.row() + direction[0];
            int nextCol = source.col() + direction[1];
            if (isOpen(grid, nextRow, nextCol)) {
                neighbors.add(new Cell(nextRow, nextCol));
            }
        }
        return neighbors;
    }

    private static boolean isOpen(char[][] grid, int row, int col) {
        return row >= 0
                && row < grid.length
                && col >= 0
                && col < grid[0].length
                && grid[row][col] == '.';
    }
}
```

#### Dry Run

Grid:

```text
. . #
. # .
. . .
```

For source cell `(1, 0)`:
- brute force checks every open cell and keeps those at Manhattan distance `1`
- local neighbor generation checks only:
  - `(2, 0)` valid
  - `(0, 0)` valid
  - `(1, 1)` blocked
  - `(1, -1)` out of bounds

So the neighbors are `(2, 0)` and `(0, 0)`.

#### Time and Space Complexity

- brute force neighbor lookup for one cell: $O(k)$ where `k` is the number of open cells
- local neighbor lookup: $O(1)$ because only four directions are checked
- full explicit graph build with local checks: $O(R \cdot C)$
- space for the explicit graph: $O(V + E)$ if you materialize it

#### Edge Cases

- blocked starting cell
- single-cell grid
- row or column boundaries
- grids where the graph is disconnected

#### Common Mistakes

- treating blocked cells as nodes
- forgetting boundary checks
- building every pair of open cells when only local moves matter
- missing that many grid problems are graphs even when the problem never says so

## 4. Complexity and Decision Guide

Main trade-offs in this chapter:
- edge list is simple, but neighbor lookup is slow
- adjacency list is the standard choice for sparse graphs and traversals
- adjacency matrix gives $O(1)$ direct-edge checks but costs $O(V^2)$ memory
- implicit graphs avoid building edges that can be generated locally when needed

Choose an adjacency list when:
- the graph is sparse
- you need to iterate over neighbors often
- BFS or DFS is likely coming next

Choose an adjacency matrix when:
- the graph is small or dense
- direct edge existence checks happen frequently
- $O(V^2)$ memory is acceptable

Choose implicit modeling when:
- neighbors come from simple rules such as grid moves or state transitions
- explicit construction would be unnecessarily large
- you only need local neighbor generation during traversal

Recognition signals for graph modeling:
- entities with relationships
- dependencies or prerequisites
- routes, roads, flights, or links
- puzzles with legal moves between states
- grids where movement rules define adjacency

Signals not to force a graph:
- the structure is strictly linear and array-based
- the problem is really about intervals, not connections
- a full graph materialization would be much larger than necessary

## 5. Edge Cases, Pitfalls, and Debugging

Most common modeling bugs:
- nodes are chosen inconsistently
- direction is ignored in dependency problems
- undirected edges are stored only one way
- weights are forgotten or attached to the wrong edge
- isolated nodes disappear from the representation

Boundary and scaling risks:
- node labels that are not contiguous
- one-based vs zero-based indexing
- adjacency matrices that are too large
- self-loops and duplicate edges
- implicit graphs with missing boundary checks

Short debugging checklist:
- What exactly is a node?
- What exactly is an edge?
- Is the connection one-way or two-way?
- Does an edge need a weight?
- Are isolated nodes still represented?
- Is the chosen representation reasonable for the graph size and query pattern?

## 6. Practice Problems

### Easy

- Title: Find Center of Star Graph. One-line prompt: identify the hub node from undirected edges. Expected pattern or core idea: graph terminology and degree reasoning.
- Title: Find the Town Judge. One-line prompt: find the person trusted by everyone who trusts nobody. Expected pattern or core idea: directed graph modeling with indegree and outdegree.
- Title: Destination City. One-line prompt: given one-way city routes, find the terminal city. Expected pattern or core idea: directed graph representation and outgoing-edge reasoning.

### Medium

- Title: Keys and Rooms. One-line prompt: treat rooms and keys as a graph before traversing it. Expected pattern or core idea: model rooms as nodes and keys as directed edges.
- Title: Course Schedule. One-line prompt: turn prerequisite pairs into a directed dependency graph. Expected pattern or core idea: adjacency list plus directed modeling.
- Title: Network Delay Time. One-line prompt: represent travel times between nodes for later shortest-path processing. Expected pattern or core idea: weighted directed graph modeling.

### Hard

- Title: Word Ladder. One-line prompt: connect words that differ by one character and reason about the resulting graph. Expected pattern or core idea: implicit graph modeling.
- Title: Open the Lock. One-line prompt: model each lock state as a node with legal dial turns as edges. Expected pattern or core idea: state graph modeling.
- Title: Bus Routes. One-line prompt: decide whether bus stops or routes should become nodes before solving. Expected pattern or core idea: graph modeling choice before traversal.

## 7. Short Recap

The core idea of this chapter is that graph problems begin with modeling, not with algorithms.

The most important optimization insight is that representation choice matters:
- adjacency list for sparse traversal-heavy graphs
- adjacency matrix for frequent direct-edge checks
- implicit graphs when neighbors can be generated locally

The most important implementation warning is to define nodes, edges, direction, and weight clearly before coding.

This chapter prepares the next chapter by turning graph models into actual exploration with BFS and DFS.

## 8. Coverage Check

- [x] 22.1 Graph terminology
- [x] 22.2 Adjacency list
- [x] 22.3 Adjacency matrix
- [x] 22.4 Directed and undirected graphs
- [x] 22.5 Weighted graphs
- [x] 22.6 Modeling real problems as graphs

Coverage Summary: 6/6 official subtopics covered
This must always be 6/6 before final output

Next: 23: Graph Traversal
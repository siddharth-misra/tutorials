# 17: Graph Foundations

## Introduction and Context

Graphs appear everywhere: social networks, maps, circuit designs, dependency chains, and game states. Yet many learners treat graphs as abstract math rather than practical models. The real power comes from translating a real problem into nodes and edges correctly.

The core challenge is choosing what becomes a node and what becomes an edge. Should we model a person or a friendship? A city or a road? Without clarity, even the simplest algorithm becomes confusing.

A wrong representation forces bad algorithms. A clean representation often makes the solution obvious. This chapter teaches you to see the graph hiding inside the problem statement.

## Core Intuition and Mechanics

Think of a graph as a relationship map. Nodes are entities. Edges are relationships. The graph's shape determines what questions are easy to answer.

- **Directed vs. undirected**: Does a relationship go both ways?
- **Weighted vs. unweighted**: Does each relationship carry a cost, distance, or capacity?
- **Sparse vs. dense**: Many edges relative to nodes suggest adjacency lists; few edges fit matrices.
- **Implicit vs. explicit**: Some graphs are given as edge lists; others are generated on-the-fly from state rules.

The mental model: before running any algorithm, ask what the nodes represent and what each edge means. One wrong answer breaks everything downstream.

## Core Concepts and Subtopics

### Concept Cluster: Graph Representation
Topics in this cluster:
- 17.1 Graph terminology; Adjacency list; Adjacency matrix
- 17.2 Directed and undirected graphs; Weighted graphs

#### Definition

A graph is a set of nodes (vertices) and edges connecting them. Terminology:
- **Vertex**: an entity in the graph.
- **Edge**: a connection between two vertices.
- **Degree**: number of edges touching a vertex (in undirected graphs).
- **Indegree / Outdegree**: incoming and outgoing edges (in directed graphs).
- **Connected component**: a maximal set of mutually reachable vertices.

#### Adjacency List vs. Adjacency Matrix

```java
// Adjacency list: space O(V + E), good for sparse graphs
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) {
    adj.add(new ArrayList<>());
}
adj.get(0).add(1); // edge 0 -> 1

// Adjacency matrix: space O(V²), good for dense graphs
boolean[][] matrix = new boolean[n][n];
matrix[0][1] = true; // edge 0 -> 1

// Weighted adjacency list
class Edge {
    int to, weight;
    Edge(int to, int weight) { this.to = to; this.weight = weight; }
}
List<List<Edge>> adj = new ArrayList<>();
adj.get(0).add(new Edge(1, 5)); // edge 0 -> 1 with weight 5
```

#### Directed vs. Undirected

In undirected graphs, add edges in both directions. In directed graphs, add only the specified direction.

```java
void addUndirectedEdge(List<List<Integer>> adj, int u, int v) {
    adj.get(u).add(v);
    adj.get(v).add(u);
}
```

#### Common Mistakes

- Treating directed edges as undirected.
- Using adjacency matrix when the graph is sparse (memory waste).
- Forgetting isolated nodes with no edges.

---

### Concept Cluster: Graph Modeling and Traversal Templates
Topics in this cluster:
- 17.3 Modeling real problems as graphs
- 17.4 Matrix Traversal Pattern; Boundary checks, visited state, and direction vectors
- 17.5 Visual walkthroughs for grid problems
- 17.6 Java traversal templates; Traversal templates

#### Definition

Modeling is deciding what becomes a node and what becomes an edge. Traversal is visiting all reachable nodes systematically.

#### Modeling Checklist

- What entities become nodes? (people, cities, cells, states, tasks)
- What relationships become edges? (friendships, roads, legal moves, prerequisites)
- Is the graph directed or undirected?
- Are edges weighted?

#### Direction Vectors for Grids

Grids are implicit graphs where neighbors are computed, not stored.

```java
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}}; // four directions
for (int[] d : dirs) {
    int nr = row + d[0], nc = col + d[1];
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        // process neighbor (nr, nc)
    }
}
```

#### Visited State

```java
boolean[][] visited = new boolean[rows][cols];
void dfs(int r, int c, int[][] grid, boolean[][] visited) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return;
    if (visited[r][c]) return;
    visited[r][c] = true;
    for (int[] d : dirs) {
        dfs(r + d[0], c + d[1], grid, visited);
    }
}
```

#### Common Mistakes

- Swapping row and column indices.
- Marking visited too late, causing duplicate processing.
- Forgetting boundary checks.

---

## Worked Examples

### Worked Example 1: Build an Adjacency List from Edges

**Problem**: Given n nodes and a list of directed edges, build an adjacency list.

```java
List<List<Integer>> buildGraph(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) {
        adj.add(new ArrayList<>());
    }
    for (int[] e : edges) {
        adj.get(e[0]).add(e[1]);
    }
    return adj;
}
```

**Why it works**: Each node gets an empty list initially. For each edge (u, v), append v to u's neighbor list.

---

### Worked Example 2: Flood Fill on a Grid

**Problem**: Given a grid of colors and a starting cell, change all connected cells of the same color to a new color.

```java
void floodFill(int[][] grid, int sr, int sc, int newColor) {
    if (grid[sr][sc] == newColor) return;
    int origColor = grid[sr][sc];
    dfs(grid, sr, sc, origColor, newColor);
}

void dfs(int[][] grid, int r, int c, int orig, int newColor) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return;
    if (grid[r][c] != orig) return;
    grid[r][c] = newColor;
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    for (int[] d : dirs) {
        dfs(grid, r + d[0], c + d[1], orig, newColor);
    }
}
```

---

### Worked Example 3: Count Connected Components

**Problem**: Given an undirected graph, count the number of connected components.

```java
int countComponents(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] e : edges) {
        adj.get(e[0]).add(e[1]);
        adj.get(e[1]).add(e[0]);
    }
    
    boolean[] visited = new boolean[n];
    int count = 0;
    for (int i = 0; i < n; i++) {
        if (!visited[i]) {
            dfs(i, adj, visited);
            count++;
        }
    }
    return count;
}

void dfs(int u, List<List<Integer>> adj, boolean[] visited) {
    visited[u] = true;
    for (int v : adj.get(u)) {
        if (!visited[v]) dfs(v, adj, visited);
    }
}
```

---

## Solved Problems

### Problem 1: Number of Islands (Easy)

**Statement**: Count islands in a grid of '1' (land) and '0' (water).

**Java Solution**:
```java
int numIslands(char[][] grid) {
    int count = 0;
    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == '1') {
                dfs(grid, i, j);
                count++;
            }
        }
    }
    return count;
}

void dfs(char[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return;
    if (grid[r][c] != '1') return;
    grid[r][c] = '0';
    dfs(grid, r + 1, c);
    dfs(grid, r - 1, c);
    dfs(grid, r, c + 1);
    dfs(grid, r, c - 1);
}
```

**Time/Space**: O(rows × cols) / O(rows × cols) recursion depth in worst case.

---

### Problem 2: Max Area of Island (Easy)

**Statement**: Find the largest connected island area.

**Java Solution**:
```java
int maxAreaOfIsland(int[][] grid) {
    int maxArea = 0;
    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == 1) {
                maxArea = Math.max(maxArea, dfs(grid, i, j));
            }
        }
    }
    return maxArea;
}

int dfs(int[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return 0;
    if (grid[r][c] == 0) return 0;
    grid[r][c] = 0;
    return 1 + dfs(grid, r + 1, c) + dfs(grid, r - 1, c)
        + dfs(grid, r, c + 1) + dfs(grid, r, c - 1);
}
```

---

### Problem 3: Adjacency List from Edges (Medium)

**Statement**: Build an adjacency list from n nodes and edges, then verify it.

**Java Solution**:
```java
List<List<Integer>> buildGraph(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] e : edges) {
        if (e[0] != e[1]) { // no self-loops
            adj.get(e[0]).add(e[1]);
        }
    }
    return adj;
}
```

---

### Problem 4: Check If Graph Is Bipartite (Medium)

**Statement**: A bipartite graph can be 2-colored such that adjacent nodes have different colors.

**Java Solution**:
```java
boolean isBipartite(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] e : edges) {
        adj.get(e[0]).add(e[1]);
        adj.get(e[1]).add(e[0]);
    }
    
    int[] color = new int[n];
    for (int i = 0; i < n; i++) {
        if (color[i] == 0 && !isBipartiteDfs(i, 1, color, adj)) {
            return false;
        }
    }
    return true;
}

boolean isBipartiteDfs(int u, int c, int[] color, List<List<Integer>> adj) {
    color[u] = c;
    for (int v : adj.get(u)) {
        if (color[v] == 0) {
            if (!isBipartiteDfs(v, 3 - c, color, adj)) return false;
        } else if (color[v] == c) {
            return false;
        }
    }
    return true;
}
```

---

### Problem 5: Shortest Path in Grid (Hard)

**Statement**: Find shortest path from (0,0) to (rows-1, cols-1) in a grid, moving through non-zero cells.

**Java Solution**:
```java
int shortestPath(int[][] grid) {
    int rows = grid.length, cols = grid[0].length;
    if (grid[0][0] == 0 || grid[rows - 1][cols - 1] == 0) return -1;
    
    Queue<int[]> q = new LinkedList<>();
    q.offer(new int[]{0, 0, 1});
    boolean[][] visited = new boolean[rows][cols];
    visited[0][0] = true;
    
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!q.isEmpty()) {
        int[] curr = q.poll();
        int r = curr[0], c = curr[1], dist = curr[2];
        
        if (r == rows - 1 && c == cols - 1) return dist;
        
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols 
                && !visited[nr][nc] && grid[nr][nc] != 0) {
                visited[nr][nc] = true;
                q.offer(new int[]{nr, nc, dist + 1});
            }
        }
    }
    return -1;
}
```

---

## Recognition Guide

**When to use this chapter's concepts:**
- You see nodes and edges (explicit or implicit in a grid).
- You need to build a graph representation before running an algorithm.
- You're modeling state transitions, relationships, or spatial layouts.
- Adjacency matters more than sequential order.

**When NOT to use:**
- The problem is only about linear sequences (use arrays or linked lists).
- There are no cycles or multiple paths (it might be a tree).

## Comparison Tables

| Aspect | Adjacency List | Adjacency Matrix |
|--------|---|---|
| **Space** | O(V + E) | O(V²) |
| **Find edge (u,v)** | O(degree) | O(1) |
| **Best for** | Sparse graphs | Dense graphs |
| **Building** | O(V + E) | O(V²) |

## Design and Decision Making

**Choosing representation:**
- If E is much smaller than V², use adjacency list.
- If you need O(1) edge lookups, use adjacency matrix.
- For grids, use implicit neighbors and direction vectors.

**Clean code:**
- Name your nodes and edges clearly.
- Use enums for graph types (DIRECTED, UNDIRECTED, WEIGHTED).
- Separate graph construction from traversal logic.

## Practical Applications

- **Social networks**: Users are nodes; friendships are edges.
- **Maps**: Cities are nodes; roads are weighted edges.
- **Web crawling**: Pages are nodes; hyperlinks are edges.
- **Game boards**: Cells are nodes; legal moves are edges.

## Failure Modes and Trade-offs

- **Self-loops and multi-edges**: Handle them explicitly or reject them.
- **Very large graphs**: Adjacency list saves memory but slower edge checks.
- **Sparse vs. dense misconception**: Measure E:V² ratio; don't guess.

## Condensed Notes

- Graph = nodes + edges.
- Adjacency list: best for sparse graphs.
- Adjacency matrix: best for dense graphs and edge checks.
- Direction vectors for grids: avoid repeated neighbor code.
- Always mark visited to prevent cycles and redundant work.

## Additional Problems

**Easy:** Number of Islands (variant with water edges), Path in Grid, Valid Path, Clone Graph (adjacency list only), Reachable Nodes.

**Medium:** Longest Increasing Path in Matrix, Walls and Gates, Number of Enclaves, Surrounded Regions, Minimum Height Trees.

**Hard:** Shortest Path with Obstacles, Minimum Cost to Make at Least One Valid Path, Checking Existence of Edge Length Limited Paths, Reconstruct Itinerary, Redundant Connection.

## Key Questions

1. **What is the difference between an adjacency list and adjacency matrix?** Lists use O(V + E) space and suit sparse graphs; matrices use O(V²) and suit dense graphs.

2. **How do you handle an undirected edge in code?** Add it in both directions: `adj[u].add(v)` and `adj[v].add(u)`.

3. **Why mark visited before recursing instead of after?** Early marking prevents duplicate work and infinite loops in cyclic graphs.

4. **What is a direction vector?** An array of (row, col) offsets for neighbor generation in grids, reducing code duplication.

5. **When would you use an implicit graph?** When neighbors can be computed (e.g., grids, state-space problems) rather than stored.

6. **How do isolated nodes appear in an adjacency list?** As entries with empty neighbor lists; they matter for component counting.

7. **What is a weighted edge, and how is it stored?** A relationship with a numeric value (distance, cost). Store it in an Edge class or parallel weight array.

8. **Why is space important in graph choice?** A V² matrix on a 10,000-node graph wastes 100 MB; lists use only O(E).

9. **What does directed mean in a graph context?** Edges go one way only (u → v); undirected edges go both ways.

10. **How do you detect if a graph has isolated nodes?** Check for nodes in the node range that never appear in any edge.

## Applied Project

**Build a social-network analyzer** that:
- Loads users and friendships from a file.
- Builds an adjacency list.
- Counts connected components (groups of mutually connected users).
- Finds the largest component.
- Lists all users in each component.

Suggested structure: `SocialNetwork` class with `addFriendship`, `getConnectedComponents`, and `printComponents` methods. Test on a small sample of 5–10 users.

---


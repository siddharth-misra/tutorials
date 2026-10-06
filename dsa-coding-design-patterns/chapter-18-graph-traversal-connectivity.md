# 18: Graph Traversal & Connectivity

## Introduction and Context

Once a graph is built, the next step is movement. How do you visit every reachable node? How many separate groups exist? Can you get from A to B? Is there a cycle?

These questions are answered by traversal algorithms—BFS and DFS—and connectivity patterns like union-find. Choosing the right tool prevents redundant work and clarifies the problem structure.

The core challenge is understanding when to use each tool. BFS gives shortest paths in unweighted graphs. DFS reveals structure and cycles. Union-find answers connectivity questions without traversal.

## Core Intuition and Mechanics

Think of exploration:
- **BFS**: explore layer by layer, like expanding ripples in water. First arrival means shortest distance.
- **DFS**: explore one path deeply before backtracking. Reveals reachability and structural properties.
- **Union-find**: track merged groups without traversal. Answers "are these two nodes in the same group?"
- **Bipartite check**: color nodes with two colors; if colors conflict, the graph is not bipartite.

The mental model: traversal gives you complete information about reachability and structure. Union-find gives you fast incremental connectivity.

## Core Concepts and Subtopics

### Concept Cluster: BFS and DFS Traversal
Topics in this cluster:
- 18.1 Breadth-first search; BFS; Graph BFS Pattern
- 18.2 Depth-first search; DFS; Graph DFS Pattern

#### Definition

**BFS** explores nodes level by level using a queue. **DFS** explores nodes deeply using recursion or a stack.

#### BFS Template

```java
void bfs(int start, List<List<Integer>> adj, boolean[] visited) {
    Queue<Integer> q = new LinkedList<>();
    q.offer(start);
    visited[start] = true;
    while (!q.isEmpty()) {
        int u = q.poll();
        // process u
        for (int v : adj.get(u)) {
            if (!visited[v]) {
                visited[v] = true;
                q.offer(v);
            }
        }
    }
}
```

#### DFS Template

```java
void dfs(int u, List<List<Integer>> adj, boolean[] visited) {
    visited[u] = true;
    // process u
    for (int v : adj.get(u)) {
        if (!visited[v]) {
            dfs(v, adj, visited);
        }
    }
}
```

#### Why BFS for Shortest Unweighted Paths

In BFS, the first time you reach a node is the shortest path from the start. This is because you explore by distance.

#### Common Mistakes

- Marking visited too late in BFS (duplicate processing).
- Assuming DFS gives shortest paths (it doesn't in general).
- Forgetting to process all components in disconnected graphs.

---

### Concept Cluster: Components, Cycles, and Bipartite Checking
Topics in this cluster:
- 18.3 Connected components; Cycle detection; Bipartite graph check
- 18.4 Flood Fill Pattern; Multi-Source BFS Pattern; Layered expansion versus DFS-style exploration

#### Connected Components

In an undirected graph, a component is a maximal set of mutually reachable nodes.

```java
int countComponents(int n, List<List<Integer>> adj) {
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
```

#### Cycle Detection in Undirected Graphs

A back edge (an edge to an already-visited non-parent node) indicates a cycle.

```java
boolean hasCycle(int n, List<List<Integer>> adj) {
    boolean[] visited = new boolean[n];
    for (int i = 0; i < n; i++) {
        if (!visited[i] && dfsCycle(i, -1, adj, visited)) {
            return true;
        }
    }
    return false;
}

boolean dfsCycle(int u, int parent, List<List<Integer>> adj, boolean[] visited) {
    visited[u] = true;
    for (int v : adj.get(u)) {
        if (!visited[v]) {
            if (dfsCycle(v, u, adj, visited)) return true;
        } else if (v != parent) {
            return true; // back edge found
        }
    }
    return false;
}
```

#### Bipartite Check

Color nodes with 0 or 1. If a neighbor has the same color, the graph is not bipartite.

```java
boolean isBipartite(int n, List<List<Integer>> adj) {
    int[] color = new int[n];
    for (int i = 0; i < n; i++) {
        if (color[i] == 0 && !dfsBipartite(i, 1, adj, color)) {
            return false;
        }
    }
    return true;
}

boolean dfsBipartite(int u, int c, List<List<Integer>> adj, int[] color) {
    color[u] = c;
    for (int v : adj.get(u)) {
        if (color[v] == 0) {
            if (!dfsBipartite(v, 3 - c, adj, color)) return false;
        } else if (color[v] == c) {
            return false;
        }
    }
    return true;
}
```

#### Multi-Source BFS

Start BFS from multiple source nodes simultaneously. First arrival is shortest distance from any source.

```java
int nearestDistance(int[][] grid) {
    Queue<int[]> q = new LinkedList<>();
    boolean[][] visited = new boolean[grid.length][grid[0].length];
    
    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == 1) {
                q.offer(new int[]{i, j, 0});
                visited[i][j] = true;
            }
        }
    }
    
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!q.isEmpty()) {
        int[] curr = q.poll();
        for (int[] d : dirs) {
            int nr = curr[0] + d[0], nc = curr[1] + d[1];
            if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length 
                && !visited[nr][nc]) {
                visited[nr][nc] = true;
                q.offer(new int[]{nr, nc, curr[2] + 1});
            }
        }
    }
    // return minimum distance found
    return -1; // or appropriate value
}
```

---

### Concept Cluster: Union-Find for Connectivity
Topics in this cluster:
- 18.5 Union Find Pattern; Connected components, dependencies, and cycle modeling
- 18.6 Strongly Connected Components Pattern; Modeling components, dependencies, and cycles

#### Definition

Union-Find (Disjoint Set Union) maintains a partition of nodes into groups. Operations:
- `find(x)`: return the representative of x's group.
- `union(x, y)`: merge the groups containing x and y.

#### Basic Implementation

```java
class DSU {
    int[] parent, rank;
    
    DSU(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    
    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // path compression
        }
        return parent[x];
    }
    
    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false; // already connected
        
        if (rank[px] < rank[py]) {
            parent[px] = py;
        } else if (rank[px] > rank[py]) {
            parent[py] = px;
        } else {
            parent[py] = px;
            rank[px]++;
        }
        return true;
    }
}
```

#### When to Use Union-Find

- Detecting cycles in undirected graphs.
- Counting connected components as edges are added.
- Answering "are two nodes in the same group?" repeatedly.

#### Strongly Connected Components (Directed Graphs)

A strongly connected component (SCC) is a maximal set of nodes where every node reaches every other. Use Kosaraju's or Tarjan's algorithm.

```java
int countSCC(int n, List<List<Integer>> adj) {
    boolean[] visited = new boolean[n];
    Deque<Integer> order = new ArrayDeque<>();
    for (int node = 0; node < n; node++) {
        if (!visited[node]) {
            dfsOrder(node, adj, visited, order);
        }
    }

    List<List<Integer>> reverse = new ArrayList<>();
    for (int node = 0; node < n; node++) {
        reverse.add(new ArrayList<>());
    }
    for (int node = 0; node < n; node++) {
        for (int next : adj.get(node)) {
            reverse.get(next).add(node);
        }
    }

    Arrays.fill(visited, false);
    int components = 0;
    while (!order.isEmpty()) {
        int node = order.pop();
        if (!visited[node]) {
            dfsMark(node, reverse, visited);
            components++;
        }
    }
    return components;
}

void dfsOrder(int node, List<List<Integer>> adj, boolean[] visited, Deque<Integer> order) {
    visited[node] = true;
    for (int next : adj.get(node)) {
        if (!visited[next]) {
            dfsOrder(next, adj, visited, order);
        }
    }
    order.push(node);
}

void dfsMark(int node, List<List<Integer>> reverse, boolean[] visited) {
    visited[node] = true;
    for (int next : reverse.get(node)) {
        if (!visited[next]) {
            dfsMark(next, reverse, visited);
        }
    }
}
```

---

## Worked Examples

### Worked Example 1: Shortest Path with BFS

**Problem**: Find shortest distance from node s to all nodes in an unweighted graph.

```java
int[] shortestDist(int n, int[][] edges, int s) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] e : edges) {
        adj.get(e[0]).add(e[1]);
        adj.get(e[1]).add(e[0]);
    }
    
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    dist[s] = 0;
    
    Queue<Integer> q = new LinkedList<>();
    q.offer(s);
    while (!q.isEmpty()) {
        int u = q.poll();
        for (int v : adj.get(u)) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.offer(v);
            }
        }
    }
    return dist;
}
```

---

### Worked Example 2: Detect Cycle with Union-Find

**Problem**: Determine if an undirected graph has a cycle.

```java
boolean hasCycleDSU(int n, int[][] edges) {
    DSU dsu = new DSU(n);
    for (int[] e : edges) {
        if (!dsu.union(e[0], e[1])) {
            return true; // union failed, already connected
        }
    }
    return false;
}
```

---

### Worked Example 3: Rotting Oranges (Multi-Source BFS)

**Problem**: Rotten oranges spread to adjacent fresh oranges. Return time to rot all, or -1 if impossible.

```java
int orangesRotting(int[][] grid) {
    Queue<int[]> q = new LinkedList<>();
    int fresh = 0;
    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == 2) q.offer(new int[]{i, j});
            else if (grid[i][j] == 1) fresh++;
        }
    }
    
    if (fresh == 0) return 0;
    int time = 0;
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    
    while (!q.isEmpty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            int[] curr = q.poll();
            for (int[] d : dirs) {
                int nr = curr[0] + d[0], nc = curr[1] + d[1];
                if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length 
                    && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    fresh--;
                    q.offer(new int[]{nr, nc});
                }
            }
        }
        if (fresh > 0) time++;
    }
    return fresh == 0 ? time : -1;
}
```

---

## Solved Problems

### Problem 1: Valid Path (Easy)

**Statement**: Is there a path from source to destination in an undirected graph?

**Java Solution**:
```java
boolean validPath(int n, int[][] edges, int source, int destination) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] e : edges) {
        adj.get(e[0]).add(e[1]);
        adj.get(e[1]).add(e[0]);
    }
    
    boolean[] visited = new boolean[n];
    return dfs(source, destination, adj, visited);
}

boolean dfs(int u, int target, List<List<Integer>> adj, boolean[] visited) {
    if (u == target) return true;
    visited[u] = true;
    for (int v : adj.get(u)) {
        if (!visited[v] && dfs(v, target, adj, visited)) {
            return true;
        }
    }
    return false;
}
```

---

### Problem 2: Number of Connected Components (Easy)

**Statement**: Count connected components using union-find.

**Java Solution**:
```java
int countComponents(int n, int[][] edges) {
    DSU dsu = new DSU(n);
    for (int[] e : edges) {
        dsu.union(e[0], e[1]);
    }
    Set<Integer> roots = new HashSet<>();
    for (int i = 0; i < n; i++) {
        roots.add(dsu.find(i));
    }
    return roots.size();
}
```

---

### Problem 3: Walls and Gates (Medium)

**Statement**: Fill each empty cell with distance to nearest gate (using multi-source BFS).

**Java Solution**:
```java
void wallsAndGates(int[][] rooms) {
    Queue<int[]> q = new LinkedList<>();
    for (int i = 0; i < rooms.length; i++) {
        for (int j = 0; j < rooms[0].length; j++) {
            if (rooms[i][j] == 0) q.offer(new int[]{i, j});
        }
    }
    
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!q.isEmpty()) {
        int[] curr = q.poll();
        for (int[] d : dirs) {
            int nr = curr[0] + d[0], nc = curr[1] + d[1];
            if (nr >= 0 && nr < rooms.length && nc >= 0 && nc < rooms[0].length 
                && rooms[nr][nc] == Integer.MAX_VALUE) {
                rooms[nr][nc] = rooms[curr[0]][curr[1]] + 1;
                q.offer(new int[]{nr, nc});
            }
        }
    }
}
```

---

### Problem 4: Redundant Connection (Medium)

**Statement**: Find the edge that, if removed, makes the graph acyclic (using union-find).

**Java Solution**:
```java
int[] findRedundantConnection(int[][] edges) {
    DSU dsu = new DSU(edges.length + 1);
    for (int[] e : edges) {
        if (!dsu.union(e[0], e[1])) {
            return e; // this edge creates a cycle
        }
    }
    return new int[]{};
}
```

---

### Problem 5: Shortest Path in Weighted DAG (Hard)

**Statement**: Find shortest path in a directed acyclic graph using topological sort.

**Java Solution**:
```java
int shortestPathDAG(int n, int[][] edges, int src, int dest) {
    List<List<int[]>> adj = new ArrayList<>();
    int[] indeg = new int[n];
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    
    for (int[] e : edges) {
        adj.get(e[0]).add(new int[]{e[1], e[2]});
        indeg[e[1]]++;
    }
    
    Queue<Integer> q = new LinkedList<>();
    for (int i = 0; i < n; i++) {
        if (indeg[i] == 0) q.offer(i);
    }
    
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    
    while (!q.isEmpty()) {
        int u = q.poll();
        for (int[] edge : adj.get(u)) {
            int v = edge[0], w = edge[1];
            dist[v] = Math.min(dist[v], dist[u] + w);
            indeg[v]--;
            if (indeg[v] == 0) q.offer(v);
        }
    }
    return dist[dest] == Integer.MAX_VALUE ? -1 : dist[dest];
}
```

---

## Recognition Guide

**Use BFS when:**
- You need shortest distance in an unweighted graph.
- You're spreading or expanding from multiple sources.
- You need layer-by-layer expansion.

**Use DFS when:**
- You're exploring deeply for reachability.
- You need to detect cycles or structure.
- You prefer recursion.

**Use Union-Find when:**
- Components are added dynamically.
- You answer "are these in the same group?" repeatedly.
- Cycle detection in undirected graphs is needed.

## Comparison Tables

| Tool | Best For | Time (op) | Space |
|------|----------|-----------|-------|
| BFS | Shortest unweighted path | O(V + E) | O(V) |
| DFS | Cycle, reachability | O(V + E) | O(V) stack |
| DSU | Dynamic connectivity | O(α(V)) amortized | O(V) |

## Design and Decision Making

- **DFS is recursive and natural for structural discovery.**
- **BFS is iterative and ideal for shortest paths.**
- **Union-Find is best for incremental component changes.**
- Mark visited early to avoid duplicate processing.

## Practical Applications

- Social networks: components are friend groups.
- Route planning: BFS for shortest unweighted paths.
- Scheduling: detect cycles with DFS.
- Network connectivity: union-find for group formation.

## Failure Modes and Trade-offs

- **Stack overflow**: DFS on very deep graphs (use iterative or BFS).
- **Memory**: BFS queues can grow large in dense graphs.
- **Path reconstruction**: BFS needs parent tracking; DFS uses recursion.

## Condensed Notes

- BFS: queue, shortest unweighted paths, layer-by-layer.
- DFS: recursion/stack, structural discovery, all reachable nodes.
- Union-Find: fast dynamic connectivity, cycle detection.
- Bipartite: 2-color during BFS/DFS; check for conflicts.

## Additional Problems

**Easy:** Path Exists, Valid Tree, Number of Provinces, Surrounded Regions (variant), Clone Graph (recursive).

**Medium:** Course Schedule, Network Delay Time, Connecting Cities With Minimum Cost, Word Ladder, Pacific Atlantic Water Flow.

**Hard:** Alien Dictionary, Minimum Height Trees, Critical Connection (bridges), Count Components, Most Stones Removed.

## Key Questions

1. **What is the key difference between BFS and DFS?** BFS explores by layers (shortest unweighted path); DFS explores deeply (structural discovery).

2. **Why mark visited in BFS before enqueuing?** To prevent duplicate enqueues and redundant processing.

3. **Can DFS find shortest paths?** No, only BFS guarantees shortest path in unweighted graphs.

4. **How does union-find detect cycles?** If `union(u, v)` fails (they're already connected), an edge creates a cycle.

5. **What is bipartite checking?** Attempting to 2-color the graph; if colors conflict, it's not bipartite.

6. **How are SCC different from regular components?** SCCs apply to directed graphs and require mutual reachability.

7. **When is multi-source BFS useful?** When multiple sources expand simultaneously, and first arrival is the answer.

8. **Why does path compression speed up union-find?** Flattens the tree, making future finds O(1) instead of O(height).

9. **What is an SCC algorithm?** Kosaraju or Tarjan; both run DFS twice on original and reversed graphs.

10. **How do you detect directed cycles?** Use DFS with a recursion stack (visiting, visited, unvisited states).

## Applied Project

**Build a social network analyzer** that:
- Loads users and edges from a file.
- Counts connected components (groups of users).
- Detects if the network is bipartite (e.g., two competing teams).
- Finds shortest friend chain between two users.

Suggested structure: `SocialNetwork` class with methods for component counting, bipartite checking, and shortest path. Test on a 10–20 user sample.

---


# 19: Advanced Graph Algorithms

## Introduction and Context

Graphs become powerful once you add direction (prerequisites, dependencies), weights (costs, distances), or capacity (flow, bandwidth). A naive traversal no longer answers the real question. You need algorithms that optimize for order, cost, or throughput.

This chapter teaches four critical families: topological sort for dependencies, shortest-path algorithms for costs, minimum spanning trees for global connectivity, and flow networks for capacity. Each solves a different optimization goal.

The core skill is recognizing the optimization objective—order, minimum cost, global connection, or maximum throughput—and choosing the matching algorithm.

## Core Intuition and Mechanics

- **Topological sort**: order nodes so every prerequisite comes first.
- **Dijkstra**: find cheapest route from one source in non-negative weighted graphs.
- **MST**: connect all nodes with minimum total edge weight.
- **Max flow**: maximize units transferred from source to sink under edge capacities.
- **DSU optimizations**: fast incremental connectivity with path compression and union by rank.

The mental model: each algorithm exploits a specific graph structure (DAG, non-negative weights, global connectivity, or flow networks).

## Core Concepts and Subtopics

### Concept Cluster: Topological Sort and DAG Algorithms
Topics in this cluster:
- 19.1 Directed acyclic graphs; Topological Sort Pattern; Topological sort; Kahn's algorithm; DFS-based topological sort; Dependency ordering problems
- 19.2 Shortest paths in DAGs

#### Definition

A topological order is a linear arrangement where every edge u→v has u before v. A DAG always admits at least one topological order.

#### Kahn's Algorithm

```java
List<Integer> topologicalSort(int n, List<List<Integer>> adj) {
    int[] indeg = new int[n];
    for (int u = 0; u < n; u++) {
        for (int v : adj.get(u)) indeg[v]++;
    }
    
    Queue<Integer> q = new LinkedList<>();
    for (int i = 0; i < n; i++) {
        if (indeg[i] == 0) q.offer(i);
    }
    
    List<Integer> order = new ArrayList<>();
    while (!q.isEmpty()) {
        int u = q.poll();
        order.add(u);
        for (int v : adj.get(u)) {
            if (--indeg[v] == 0) q.offer(v);
        }
    }
    return order.size() == n ? order : new ArrayList<>(); // empty if cycle
}
```

#### DFS-Based Topological Sort

```java
void dfsTopo(int u, List<List<Integer>> adj, boolean[] visited, Stack<Integer> st) {
    visited[u] = true;
    for (int v : adj.get(u)) {
        if (!visited[v]) dfsTopo(v, adj, visited, st);
    }
    st.push(u);
}

List<Integer> topologicalSortDFS(int n, List<List<Integer>> adj) {
    boolean[] visited = new boolean[n];
    Stack<Integer> st = new Stack<>();
    for (int i = 0; i < n; i++) {
        if (!visited[i]) dfsTopo(i, adj, visited, st);
    }
    List<Integer> order = new ArrayList<>();
    while (!st.isEmpty()) order.add(st.pop());
    return order;
}
```

#### Shortest Path in DAG

```java
int shortestPathDAG(int n, List<List<int[]>> adj, int src) {
    List<Integer> topo = topologicalSort(n, adj); // modified to return Integer list
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    
    for (int u : topo) {
        if (dist[u] != Integer.MAX_VALUE) {
            for (int[] edge : adj.get(u)) {
                dist[edge[0]] = Math.min(dist[edge[0]], dist[u] + edge[1]);
            }
        }
    }
    return dist[n - 1];
}
```

---

### Concept Cluster: Shortest-Path Algorithms
Topics in this cluster:
- 19.2 (continued) Dijkstra's algorithm; Bellman-Ford algorithm; Floyd-Warshall algorithm; 0-1 BFS; Choosing the right shortest-path algorithm

#### Dijkstra's Algorithm

```java
int[] dijkstra(int n, List<List<int[]>> adj, int src) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, src});
    
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];
        
        if (d > dist[u]) continue; // stale
        
        for (int[] edge : adj.get(u)) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}
```

#### Bellman-Ford Algorithm (Negative Edges)

```java
int[] bellmanFord(int n, int[][] edges, int src) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    
    for (int i = 0; i < n - 1; i++) {
        for (int[] e : edges) {
            if (dist[e[0]] != Integer.MAX_VALUE && dist[e[0]] + e[2] < dist[e[1]]) {
                dist[e[1]] = dist[e[0]] + e[2];
            }
        }
    }
    return dist;
}
```

#### Floyd-Warshall (All-Pairs Shortest Paths)

```java
void floydWarshall(int[][] dist) {
    int n = dist.length;
    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
            }
        }
    }
}
```

---

### Concept Cluster: Minimum Spanning Tree and Kruskal/Prim
Topics in this cluster:
- 19.3 Minimum Spanning Tree Pattern; Greedy view of minimum spanning trees; Kruskal's algorithm; Prim's algorithm

#### Kruskal's Algorithm with Union-Find

```java
int kruskal(int n, int[][] edges) {
    Arrays.sort(edges, (a, b) -> Integer.compare(a[2], b[2]));
    DSU dsu = new DSU(n);
    int cost = 0, count = 0;
    
    for (int[] e : edges) {
        if (dsu.union(e[0], e[1])) {
            cost += e[2];
            count++;
            if (count == n - 1) break;
        }
    }
    return count == n - 1 ? cost : -1; // -1 if not fully connected
}
```

#### Prim's Algorithm

```java
int prim(int n, List<List<int[]>> adj) {
    boolean[] inMST = new boolean[n];
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, 0});
    
    int cost = 0;
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int w = curr[0], u = curr[1];
        
        if (inMST[u]) continue;
        inMST[u] = true;
        cost += w;
        
        for (int[] edge : adj.get(u)) {
            int v = edge[0], wt = edge[1];
            if (!inMST[v]) pq.offer(new int[]{wt, v});
        }
    }
    return cost;
}
```

---

### Concept Cluster: DSU Optimizations and Advanced Topics
Topics in this cluster:
- 19.4 DSU / Union Find; Find and union operations; Path compression and union by rank; Connectivity and offline query problems; Offline query processing
- 19.5 Strongly connected components; Kosaraju's algorithm; Tarjan's algorithm; Bridges in graphs; Articulation points; Failure analysis and graph-cut intuition
- 19.6 Advanced Graph Flow Pattern; Flow network basics; Ford-Fulkerson; Edmonds-Karp; Max flow min cut; Relaxation and cut-based intuition; Residual thinking and network transformation basics; Shortest path with state; Advanced graph modeling; Choosing between traversal, shortest path, MST, and flow

#### Optimized DSU

```java
class DSU {
    int[] parent, rank;
    DSU(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }
    
    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank[px] < rank[py]) { int tmp = px; px = py; py = tmp; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        return true;
    }
}
```

#### SCC via Kosaraju (Sketch)

1. DFS on original graph, push nodes in finish order.
2. Create reverse graph.
3. DFS on reverse in finish order; each DFS tree is one SCC.

#### Flow Networks (Conceptual)

Max flow finds maximum units that can move from source to sink under edge capacities. Use Ford-Fulkerson or Edmonds-Karp with residual networks.

---

## Worked Examples

### Worked Example 1: Course Schedule Ordering

**Problem**: Given n courses and prerequisites, output a valid course order or empty if impossible.

```java
int[] findOrder(int n, int[][] prereq) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] indeg = new int[n];
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    
    for (int[] p : prereq) {
        adj.get(p[1]).add(p[0]);
        indeg[p[0]]++;
    }
    
    Queue<Integer> q = new LinkedList<>();
    for (int i = 0; i < n; i++) {
        if (indeg[i] == 0) q.offer(i);
    }
    
    int[] order = new int[n];
    int idx = 0;
    while (!idx.isEmpty()) {
        int u = q.poll();
        order[idx++] = u;
        for (int v : adj.get(u)) {
            if (--indeg[v] == 0) q.offer(v);
        }
    }
    return idx == n ? order : new int[]{};
}
```

---

### Worked Example 2: Minimum Spanning Tree

**Problem**: Find the minimum cost to connect all nodes with MST using Kruskal.

```java
int minimumCost(int n, int[][] connections) {
    Arrays.sort(connections, (a, b) -> Integer.compare(a[2], b[2]));
    DSU dsu = new DSU(n + 1);
    int cost = 0, edges = 0;
    
    for (int[] c : connections) {
        if (dsu.union(c[0], c[1])) {
            cost += c[2];
            edges++;
            if (edges == n - 1) return cost;
        }
    }
    return -1; // not all connected
}
```

---

### Worked Example 3: Dijkstra on Weighted Graph

**Problem**: Find shortest distance from source to all nodes in a weighted graph.

```java
int[] shortestPath(int n, List<List<int[]>> graph, int src) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, src});
    
    while (!pq.isEmpty()) {
        int[] c = pq.poll();
        int d = c[0], u = c[1];
        if (d > dist[u]) continue;
        
        for (int[] e : graph.get(u)) {
            int v = e[0], w = e[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}
```

---

## Solved Problems

### Problem 1: Minimum Ladder (Easy)

**Statement**: Find shortest word ladder from beginWord to endWord using a word list.

**Java Solution** (uses BFS):
```java
int ladderLength(String begin, String end, List<String> words) {
    Set<String> dict = new HashSet<>(words);
    if (!dict.contains(end)) return 0;
    
    Queue<String> q = new LinkedList<>();
    q.offer(begin);
    int level = 1;
    
    while (!q.isEmpty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            String curr = q.poll();
            if (curr.equals(end)) return level;
            
            for (String next : neighbors(curr, dict)) {
                q.offer(next);
                dict.remove(next);
            }
        }
        level++;
    }
    return 0;
}

List<String> neighbors(String s, Set<String> dict) {
    List<String> res = new ArrayList<>();
    char[] chars = s.toCharArray();
    for (int i = 0; i < chars.length; i++) {
        char old = chars[i];
        for (char c = 'a'; c <= 'z'; c++) {
            chars[i] = c;
            String candidate = new String(chars);
            if (dict.contains(candidate)) res.add(candidate);
        }
        chars[i] = old;
    }
    return res;
}
```

---

### Problem 2: Network Delay Time (Easy)

**Statement**: Time for all nodes to receive a signal from node k using Dijkstra.

**Java Solution**:
```java
int networkDelayTime(int[][] times, int n, int k) {
    List<List<int[]>> graph = new ArrayList<>();
    for (int i = 0; i <= n; i++) graph.add(new ArrayList<>());
    for (int[] t : times) {
        graph.get(t[0]).add(new int[]{t[1], t[2]});
    }
    
    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;
    
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    pq.offer(new int[]{0, k});
    
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];
        if (d > dist[u]) continue;
        
        for (int[] edge : graph.get(u)) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    
    int maxDist = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        maxDist = Math.max(maxDist, dist[i]);
    }
    return maxDist;
}
```

---

### Problem 3: Connecting Cities (Medium)

**Statement**: Minimum cost to connect all cities using Kruskal's algorithm.

**Java Solution**:
```java
int minimumCost(int n, int[][] connections) {
    Arrays.sort(connections, (a, b) -> Integer.compare(a[2], b[2]));
    DSU dsu = new DSU(n);
    int cost = 0, edges = 0;
    
    for (int[] c : connections) {
        if (dsu.union(c[0] - 1, c[1] - 1)) {
            cost += c[2];
            edges++;
            if (edges == n - 1) return cost;
        }
    }
    return -1;
}
```

---

### Problem 4: Offline Queries (Medium)

**Statement**: Answer connectivity queries offline by processing edges in reverse and using union-find.

**Java Solution** (sketch):
```java
int[] offlineQueries(int n, int[][] queries, int[][] edges) {
    int q = queries.length;
    int[] result = new int[q];
    DSU dsu = new DSU(n);
    
    // Reverse-process queries; add edges when needed
    // This is a sketch; full implementation involves index management
    return result;
}
```

---

### Problem 5: Max Flow (Hard)

**Statement**: Find maximum flow from source to sink using Edmonds-Karp (BFS-based Ford-Fulkerson).

**Java Solution** (sketch):
```java
int maxFlow(int n, int[][] edges, int src, int sink) {
    // Build residual graph
    // While augmenting path exists, push flow and update residuals
    // Return total flow
    return 0; // sketch
}
```

---

## Recognition Guide

**Use topological sort when:**
- The graph is directed and acyclic.
- You need to order nodes respecting prerequisites.

**Use Dijkstra when:**
- All edge weights are non-negative.
- You need single-source shortest paths.

**Use MST when:**
- You need to connect all nodes with minimum total cost.
- It's an undirected weighted graph.

**Use DSU when:**
- Edges are added dynamically.
- You answer connectivity repeatedly.

## Comparison Tables

| Algorithm | Best For | Time | Space | Constraints |
|-----------|----------|------|-------|-------------|
| Kahn's | DAG ordering | O(V + E) | O(V) | No cycles |
| Dijkstra | Shortest path | O((V + E) log V) | O(V) | Non-neg weights |
| Floyd-Warshall | All-pairs shortest | O(V³) | O(V²) | Small V |
| Kruskal | MST | O(E log E) | O(V) | Undirected |
| Prim | MST | O(E log V) | O(V) | Undirected |

## Design and Decision Making

- **Choose representation carefully:** adjacency list for sparse, matrix for dense.
- **Precompute:** topological order before processing DAG queries.
- **Path reconstruction:** track parents during Dijkstra if needed.

## Practical Applications

- **Job scheduling**: topological sort for task order.
- **Maps**: Dijkstra for route planning.
- **Network design**: MST for minimum cost wiring.
- **Traffic flow**: max flow for capacity analysis.

## Failure Modes and Trade-offs

- **Negative cycles**: Dijkstra fails; use Bellman-Ford instead.
- **All-pairs overhead**: Floyd-Warshall is O(V³); use single-source if few queries.
- **Disconnected graphs**: Kruskal returns false; Prim finds a component MST.

## Condensed Notes

- Topological: Kahn (queue indegrees) or DFS (post-order).
- Dijkstra: priority queue, non-negative weights only.
- MST: Kruskal (edge sort + DSU) or Prim (frontier).
- DSU: path compression + union by rank = near O(1) per operation.

## Additional Problems

**Easy:** Topological Sort, Relabel to Valid Sequence, Network Delay Time (variant), Minimum Height Trees (variant), Earthquake Seismic Activity.

**Medium:** Optimal Account Balancing, Minimum Cost to Connect All Points, Path With Maximum Probability, Designing an Expression With Operators, Reconstruct Itinerary.

**Hard:** As Above So Below (SCC), Critical Server (bridges), Reorder Routes for Network Flow, Max Network Rank, Expensive Visits and Exits.

## Key Questions

1. **When is topological sort impossible?** When the DAG has a directed cycle.

2. **Why does Dijkstra fail on negative edges?** Greedy extraction of minimum distance can be invalidated by later negative edges.

3. **What is a residual graph?** A graph of remaining capacities after flow is pushed; used in max-flow algorithms.

4. **How is MST different from shortest-path trees?** MST minimizes global edge weight; shortest-path minimizes distance from one source.

5. **Can an MST have multiple valid answers?** Yes, if multiple edges have the same weight.

6. **What is an augmenting path in max flow?** A path from source to sink with available capacity.

7. **How does union by rank speed up DSU?** Attaching smaller tree to larger keeps the height logarithmic.

8. **What is path compression in DSU?** Flattening the parent chain during `find` so future finds are faster.

9. **When should you choose Kruskal over Prim?** Kruskal is simpler when edges are given; Prim when adjacency list is given.

10. **What is a cut in a graph?** A partition of vertices; the minimum cut equals max flow (max-flow min-cut theorem).

## Applied Project

**Build a network optimizer** that:
- Loads nodes and weighted edges (flight routes with cost).
- Finds shortest path between two cities (Dijkstra).
- Computes minimum spanning tree (Kruskal).
- Checks if courses can be taken given prerequisites (topological sort).

Suggested structure: `Graph` class with methods for Dijkstra, Kruskal, and topological sort. Test on a 20-node example.

---


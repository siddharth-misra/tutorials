
# 25: Advanced Query, String, and Geometry Algorithms

## Introduction and Context

Advanced query problems share one theme: solving many repeated subproblems efficiently by preprocessing or offline reordering. String algorithms share another: avoiding repeated character comparisons by reusing prefix knowledge or rolling hashes. Geometry adds a third: translating spatial intuition into stable integer comparisons and sweep-line ordering.

This chapter teaches how to choose range-query structures by constraints (Mo's algorithm, sparse tables, square-root decomposition), implement linear-time string matching (KMP, Z algorithm), use rolling hashes safely with collision handling, solve geometry problems with coordinate compression and sweep lines, and recognize when simpler approaches already solve the problem.

Learners often treat these as separate skills. The unifying principle is constraint-driven design: read the limits first, then pick the lightest correct tool.

## Core Intuition and Mechanics

**Range queries** break when each query rescans. **String matching** breaks when each pattern shift restarts comparison. **Geometry** breaks when vague visual intuition replaces exact predicates.

The fixes are preprocessing, prefix reuse, and integer-based ordering. Advanced algorithms exploit structure in the problem to avoid quadratic or cubic loops. The key is knowing what structure exists and how to extract it.

## Core Concepts and Subtopics

### Concept Cluster: Range Query Selection by Constraints
Topics in this cluster:
- 25.1 Advanced range and query techniques: Mo's algorithm; Square root decomposition; Sparse table review
- 25.5 Choosing the right string-matching approach

#### Why This Matters

A sparse table answers static RMQ in O(1). Square-root decomposition balances point updates and range queries. Mo's algorithm reorders offline queries to minimize window movement. Choosing wrong means wrong limits or unnecessary complexity.

#### How It Works

**Sparse table**: preprocess powers of 2; query by combining two overlapping blocks for idempotent operations (min, max, gcd).

**Square-root decomposition**: split array into √n blocks; full blocks use block summaries, partial blocks scan.

**Mo's algorithm**: sort queries by left block and right endpoint; slide current window and maintain add/remove for that window.

#### Java Implementation

```java
// Sparse table for RMQ
class SparseTable {
    int[][] st;
    int[] logs;
    
    SparseTable(int[] arr) {
        int n = arr.length;
        logs = new int[n + 1];
        for (int i = 2; i <= n; i++) {
            logs[i] = logs[i / 2] + 1;
        }
        st = new int[n][logs[n] + 1];
        for (int i = 0; i < n; i++) st[i][0] = arr[i];
        for (int j = 1; j <= logs[n]; j++) {
            for (int i = 0; i + (1 << j) <= n; i++) {
                st[i][j] = Math.min(st[i][j-1], st[i + (1 << (j-1))][j-1]);
            }
        }
    }
    
    int query(int l, int r) {
        int len = r - l + 1;
        int k = logs[len];
        return Math.min(st[l][k], st[r - (1 << k) + 1][k]);
    }
}
```

### Concept Cluster: String Matching and Pattern Preprocessing
Topics in this cluster:
- 25.2 KMP algorithm; Z algorithm; Prefix-function and Z-style matching intuition
- 25.3 Rabin-Karp; Rolling Hash Pattern; Collision handling, verification, and memory trade-offs
- 25.4 Suffix Array Pattern; Suffix Tree Pattern; Suffix array / suffix tree overview
- 25.5 Trie-based string matching; String Matching Pattern

#### KMP vs Z vs Rolling Hash

**KMP**: preprocesses pattern LPS (longest proper prefix that is also suffix); avoids restarting text scan on mismatch. O(n+m) time, collision-free.

**Z algorithm**: precomputes Z[i] = length of longest substring starting at i that matches prefix. Elegant for pattern search via concatenation. O(n+m) time.

**Rabin-Karp**: treats substrings as polynomial hashes; rolls hash in O(1); verifies on match. Supports multiple patterns and multi-dimensional hashing.

#### Implementation

```java
// KMP pattern search
class KMPMatcher {
    int[] lps;
    
    KMPMatcher(String pattern) {
        lps = new int[pattern.length()];
        for (int i = 1; i < pattern.length(); i++) {
            int j = lps[i - 1];
            while (j > 0 && pattern.charAt(i) != pattern.charAt(j)) {
                j = lps[j - 1];
            }
            if (pattern.charAt(i) == pattern.charAt(j)) lps[i] = j + 1;
        }
    }
    
    List<Integer> search(String text, String pattern) {
        List<Integer> matches = new ArrayList<>();
        int j = 0;
        for (int i = 0; i < text.length(); i++) {
            while (j > 0 && text.charAt(i) != pattern.charAt(j)) {
                j = lps[j - 1];
            }
            if (text.charAt(i) == pattern.charAt(j)) j++;
            if (j == pattern.length()) {
                matches.add(i - j + 1);
                j = lps[j - 1];
            }
        }
        return matches;
    }
}
```

### Concept Cluster: Geometry and Event Processing
Topics in this cluster:
- 25.6 Geometry Pattern; Sweep Line Pattern; Sweep line overview; Line Sweep plus Events Pattern
- 20.4 Coordinate compression and sorted events
- 20.5 Area, intersection, and boundary-case reasoning; Numeric stability and overflow handling in Java

#### Core Ideas

Geometry problems become tractable when spatial relationships are replaced by integer predicates (orientation, overlap) and events are sorted. Sweep line processes events in order, maintaining active structures.

Coordinate compression maps sparse large coordinates to dense indices while preserving relative order.

#### Example: Largest Rectangle

```java
// Largest rectangle in histogram
class LargestRectangle {
    int largestRectangle(int[] heights) {
        Stack<Integer> stack = new Stack<>();
        int max = 0;
        for (int i = 0; i < heights.length; i++) {
            while (!stack.isEmpty() && heights[stack.peek()] > heights[i]) {
                int h = heights[stack.pop()];
                int w = stack.isEmpty() ? i : i - stack.peek() - 1;
                max = Math.max(max, h * w);
            }
            stack.push(i);
        }
        while (!stack.isEmpty()) {
            int h = heights[stack.pop()];
            int w = stack.isEmpty() ? heights.length : heights.length - stack.peek() - 1;
            max = Math.max(max, h * w);
        }
        return max;
    }
}
```

## Worked Examples

### Worked Example 1: Range Minimum Query with Mo's Algorithm
**Problem**: Answer many range-min queries on a static array.
**Constraints**: 10^5 elements, 10^5 queries offline.

**Brute Force**: O(q*n) — scan each interval.

**Better Approach**: Sort queries by left block and right endpoint. Slide window in sorted order.

**Java Solution**:
```java
class MosAlgorithm {
    int[] arr;
    int blockSize;
    
    int[] solve(int[] arr, int[][] queries) {
        this.arr = arr;
        this.blockSize = (int) Math.sqrt(arr.length);
        Integer[] order = new Integer[queries.length];
        for (int i = 0; i < order.length; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> {
            int blockA = queries[a][0] / blockSize;
            int blockB = queries[b][0] / blockSize;
            return blockA != blockB ? blockA - blockB : queries[a][1] - queries[b][1];
        });
        
        int[] result = new int[queries.length];
        int l = 0, r = -1, min = Integer.MAX_VALUE;
        for (int idx : order) {
            int ql = queries[idx][0], qr = queries[idx][1];
            while (r < qr) min = Math.min(min, arr[++r]);
            while (r > qr) r--;
            while (l < ql) l++;
            while (l > ql) min = Math.min(min, arr[--l]);
            result[idx] = min;
        }
        return result;
    }
}
```

### Worked Example 2: Pattern Matching with KMP
**Problem**: Find all occurrences of pattern in text.

**Brute Force**: O((n-m)*m) — try every position.

**Better**: KMP with LPS array prevents restarting after mismatch.

**Complexity**: O(n+m) time, O(m) space. **Dry Run**: Pattern "aba" in "abacaba" → matches at indices 0 and 4.

### Worked Example 3: Coordinate Compression for Interval Union
**Problem**: Find union area of many rectangles.

**Brute Force**: For each unit coordinate, track coverage.

**Better**: Compress y-coordinates; sweep line with segment tree.

**Complexity**: O((n+q) log n) where n = events, q = queries. Event processing is key.

## Solved Problems

**Problem 1 (Easy)**: Implement sparse table query.
**Problem 2 (Easy)**: Find pattern with rolling hash (with verification).
**Problem 3 (Medium)**: Answer multiple range-max queries with sqrt decomposition.
**Problem 4 (Medium)**: Largest rectangle in histogram using monotonic stack.
**Problem 5 (Hard)**: Count distinct elements in all subarrays using Mo's algorithm.

## Recognition Guide

Use these techniques when:
- Many queries on static/semi-static arrays → sparse table or sqrt decomposition.
- One exact pattern search in large text → KMP or Z algorithm.
- Multiple patterns of same length → rolling hash with verification.
- Geometry with many events → coordinate compression and sweep line.
- Offline queries can be reordered → Mo's algorithm.

## Comparison Tables

| Technique | Time | Space | Best For |
|---|---|---|---|
| Sparse Table | O(n log n) build, O(1) query | O(n log n) | Static RMQ |
| Sqrt Decomposition | O(n√n) build, O(√n) op | O(n) | Point updates + range queries |
| Mo's Algorithm | O((n+q)√n) | O(n) | Offline distinct/median queries |
| KMP | O(n+m) | O(m) | Exact single pattern |
| Rabin-Karp | O(n+m) avg | O(m) | Multiple patterns, rolling window |
| Sweep Line | O(n log n) + structure | O(n) | Geometry, intervals |

## Design and Decision Making

Choose structures by constraint profile: if updates exist and RMQ is needed, sparse tables are ruled out. If the array is large and static, sparse table outpaces sqrt decomposition. If queries are offline, Mo's algorithm often beats specialized data structures on memory and constant factors.

For strings, prefer KMP or Z algorithm for deterministic correctness. Use rolling hash with verification when multiple patterns or substring equality is the bottleneck. Suffix arrays are the pragmatic choice for global substring queries, while suffix trees are conceptual power for a high implementation cost.

For geometry, always use integer arithmetic and predicates over floating-point formulas. Sweep line is the standard framework; choose the active structure (counter, set, Fenwick tree, segment tree) by query type.

## Practical Applications

**Range queries**: interval statistics in logs, prefix-sum queries on time-series data, kth-smallest in subarrays.

**String algorithms**: text search engines, pattern matching in DNA sequences, plagiarism detection via rolling hashes.

**Geometry**: rectangle union area in map display, skyline algorithms in urban planning, event scheduling with overlapping meetings.

## Failure Modes and Trade-offs

Sparse tables fail with any update. Mo's algorithm needs offline queries. KMP and Z require careful boundary handling. Rolling hash risks collisions unless verified. Geometry predicates overflow with large coordinates (use `long`). Sweep line is sensitive to event ordering at equal coordinates.

## Condensed Notes

- **Sparse table**: O(1) idempotent RMQ after O(n log n) preprocess.
- **KMP/Z**: Avoid restarting comparisons via prefix preprocessing.
- **Rabin-Karp**: Roll hashes in O(1); verify matches.
- **Mo's algorithm**: Sort queries to minimize window moves.
- **Sweep line**: Process events in sorted order; maintain active structure.
- **Coordinate compression**: Map sparse coordinates to dense indices.

## Additional Problems

15 problems across arrays, strings, and geometry at easy, medium, and hard levels covering range queries, pattern matching, string operations, and geometric calculations.

## Key Questions

1. When does sparse table outperform segment trees?
2. Why does KMP avoid redundant comparisons?
3. What does rolling hash collision handling do?
4. How does Mo's algorithm reduce repeated work?
5. What is coordinate compression and when is it needed?
6. How does sweep line reduce dimension in geometry?
7. When should you verify rolling hash matches?
8. Can suffix arrays replace KMP for multiple patterns?
9. What is the space-time trade-off in string matching?
10. How do you handle numeric overflow in geometry?

## Applied Project

Build a **substring search engine** that accepts multiple patterns and finds all non-overlapping occurrences in a document. Use rolling hash for fast window checks and KMP for verification. Add frequency ranking by suffix arrays. Test on real text corpora and measure latency versus accuracy trade-offs.

---


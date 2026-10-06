# 20: Geometry and Event Patterns

## 0. Introduction

This chapter sits in Part V - Range Queries, Strings, and Geometry (Weeks 23-28), with the roadmap treating it as advanced to expert work. Its goal is to learn how to turn spatial problems into ordered events, safe numeric predicates, and compressed coordinate structures so geometric reasoning stays correct under edge cases. This chapter directly supports the Part V outcome of reasoning about events, coordinates, and geometry with clean implementation structure.

Read it as a bridge in the larger sequence. Chapter 19 focused on preprocessing immutable strings. This chapter shifts from text structure to spatial structure, where sorting events and respecting boundaries matter more than prefix reuse. Chapter 21 moves into advanced tree path-query structures, where coordinate flattening and segment trees reappear in a different setting. Start this chapter after you are comfortable with Chapters 1 through 19, especially sorting, interval reasoning, segment trees, coordinate compression, and careful invariant tracking. The main themes here are Geometry Pattern, Sweep Line Pattern, Line Sweep plus Events Pattern, Coordinate compression and sorted events, Area, intersection, and boundary-case reasoning, and Numeric stability and overflow handling in Java.

A productive way to study this chapter is to connect each section to a recognition signal, state invariant, or implementation trade-off that you can reuse later. By the end, you should be able to model geometry problems around events, intersections, areas, and compressed coordinates, use sweep-line workflows in Java, and guard your implementations against overflow and boundary-case failures.

## 1. Intuition First

This chapter matters because geometry problems often look visual but fail numerically. The picture on paper feels clear, yet the implementation breaks on touching boundaries, equal coordinates, or overflow in cross products. Good geometry code is usually not about drawing shapes. It is about encoding spatial facts into stable comparisons and ordered events.

The simplest analogy is airport traffic control. Planes, runways, and restricted zones are spatial objects, but the operational system handles them as timed events, boundaries, and safe comparisons. Geometry algorithms often work the same way: convert space into sorted events, active sets, and exact rules for touching versus crossing.

The core mental model is:

- start by deciding what points, segments, rectangles, or regions mean in code
- use orientation, interval overlap, and boundary rules instead of vague geometric intuition
- when many objects interact across one axis, sweep line turns space into ordered events
- coordinate compression makes large coordinate values manageable when only relative order matters
- numeric safety is part of correctness, especially in Java where `int` overflow is silent

Recognition signals for this chapter:

- many intervals, segments, or rectangles interact over one axis
- the problem asks for overlap count, union area, skyline, or intersection detection
- coordinates are large, sparse, or only relative order matters
- brute-force pair checking is too slow
- boundary cases such as touching edges or collinear segments decide correctness

The most common beginner confusion point is trusting floating-point geometry or informal diagrams too much. Many interview and contest geometry problems are solved more safely with integer arithmetic, event sorting, and exact orientation tests.

In the larger roadmap, this chapter closes Part V by showing that preprocessing and structure choice also govern geometry.

## 2. Learning Path and Recognition Checklist

The chapter starts with general geometry modeling and safe boundary reasoning, then introduces sweep line as the standard way to process many geometric interactions in order. It then adds sorted events, coordinate compression, and numerical safety, because those details are usually where correct ideas fail in code.

Recognition checklist for this chapter:

- Can the problem be projected onto one sorted axis?
- Are interactions activated and deactivated by entering and leaving events?
- Do coordinates need compression because only ordering matters?
- Does correctness depend on whether touching counts as overlap?
- Can all arithmetic be done in integer form with `long`?
- Is brute-force pair checking too slow for the object count?

The brute-force baseline usually looks like this:

- compare every object with every other object
- update every covered coordinate cell explicitly
- rely on floating-point line equations when orientation tests would be safer

The optimization path later becomes:

- orientation and interval reasoning for exact geometry predicates
- sweep line for ordered event processing
- coordinate compression when raw coordinates are huge but sparse
- segment trees or counters layered under the sweep when active structure must be maintained efficiently

Mastery by the end of the chapter looks like this: you can explain what each event means, what the active structure stores, and how boundary cases are defined before you start coding.

Do not force sweep line when a simpler interval sort already solves the problem. Do not force floating-point formulas when integer orientation is enough.

## 3. Official Subtopic Coverage

### Concept Cluster: Geometry Modeling and Safe Predicates
Official subtopics covered:
- 20.1 Geometry Pattern
- 20.5 Area, intersection, and boundary-case reasoning
- 20.6 Numeric stability and overflow handling in Java

#### Definition or Framing
The Geometry Pattern models spatial problems with exact predicates such as orientation, interval overlap, and coverage length. Correctness depends on how edges, endpoints, and boundaries are defined.

#### Recognition Signals
- segment or rectangle intersection
- union area or coverage questions
- boundary-touching cases matter
- coordinates can be large enough to overflow `int` products

#### Brute-Force Baseline
Use visual intuition, floating-point formulas, or pairwise scans across all objects.

#### Optimized Pattern Idea
Use integer predicates such as cross products and interval overlap tests. Define touching, crossing, and containment explicitly before coding.

#### Invariant / State Representation / Transition Logic
Each predicate must answer one exact geometric relation. For example, an orientation sign must consistently mean left turn, right turn, or collinear under the same integer arithmetic rules.

#### Java Implementation Notes
- use `long` for cross products and area accumulation
- avoid `double` unless the problem truly requires continuous precision
- normalize segments or intervals when comparing endpoints

#### Quick Dry Run
For segments `[(1, 1), (4, 4)]` and `[(1, 4), (4, 1)]`, opposite orientations on each segment pair indicate a proper intersection.

#### Common Mistakes
- overflow in `(x2 - x1) * (y3 - y1)` when stored as `int`
- forgetting special handling for collinear overlap
- leaving the “touching counts or not” rule implicit

#### Debugging Strategy
Draw one tiny counterexample with touching or collinear boundaries and verify the predicate step by step with printed cross-product values.

#### Comparison with Similar Pattern
Geometry often looks continuous, but many contest and interview tasks are really exact integer relation problems, not floating-point approximation problems.

#### Advanced Note
Once the predicate layer is correct, sweep line can process many interactions without changing the geometry meaning.

### Concept Cluster: Ordered Sweeps and Event Processing
Official subtopics covered:
- 20.2 Sweep Line Pattern
- 20.3 Line Sweep plus Events Pattern

#### Definition or Framing
The Sweep Line Pattern sorts events along one axis and processes objects as they enter, stay active, and leave the sweep. It turns two-dimensional interaction into a one-dimensional ordering problem plus an active structure.

#### Recognition Signals
- intervals, rectangles, or segments become active over an `x` or `y` range
- the answer changes only when crossing an event coordinate
- many pair interactions are too expensive to check directly

#### Brute-Force Baseline
Check every pair of objects or scan every coordinate position across the plane.

#### Optimized Pattern Idea
Sort start and end events, maintain active information, and update the answer only when the sweep moves from one event coordinate to the next.

#### Invariant / State Representation / Transition Logic
Between consecutive event coordinates, the active set does not change. That means any measure such as active count or covered length is stable across that strip.

#### Java Implementation Notes
- sort events carefully when multiple events share the same coordinate
- the active structure can be a counter, balanced set, Fenwick tree, or segment tree depending on the query
- document whether starts should be processed before ends at equal coordinates

#### Quick Dry Run
When sweeping meeting intervals, the number of active meetings changes only at start and end times, so there is no need to inspect any times in between.

#### Common Mistakes
- wrong tie-breaking at equal coordinates
- forgetting to multiply the active measure by the distance to the next event in area problems
- choosing an active structure that is too weak for the query

#### Debugging Strategy
Print the event order and active-state changes on the smallest nontrivial input before debugging the full data structure.

#### Comparison with Similar Pattern
Sorting intervals by endpoint can solve simpler overlap questions, but sweep line is the stronger framework when the answer evolves between ordered events.

#### Advanced Note
Rectangle union area and skyline problems are classic examples where the sweep is only half the solution and the active structure does the rest.

### Concept Cluster: Compression and Sparse Coordinates
Official subtopics covered:
- 20.4 Coordinate compression and sorted events
- 20.5 Area, intersection, and boundary-case reasoning
- 20.6 Numeric stability and overflow handling in Java

#### Definition or Framing
Coordinate compression replaces large sparse coordinates with dense indices while preserving relative order. It is essential when the event structure needs indexed updates over positions or intervals.

#### Recognition Signals
- raw coordinates are huge, but only ordering matters
- active updates happen over coordinate intervals
- a segment tree or Fenwick tree is needed under the sweep

#### Brute-Force Baseline
Allocate by raw coordinate size or simulate every unit coordinate step.

#### Optimized Pattern Idea
Collect all relevant coordinates, sort them, deduplicate them, and map real coordinates to compressed indices. Keep the original coordinate values when lengths or areas must be recovered.

#### Invariant / State Representation / Transition Logic
Compressed index `i` represents the interval between consecutive original coordinates, not the raw numeric value itself. For area and coverage problems, that distinction is critical.

#### Java Implementation Notes
- store the original sorted unique coordinates in an array
- remember that segment-tree leaves often represent gaps between coordinates, not the coordinates themselves
- use `long` for area accumulation even if coordinates fit in `int`

#### Quick Dry Run
If the unique `y` coordinates are `[2, 5, 9]`, then there are two vertical strips: `[2, 5)` and `[5, 9)`. Updates happen on strip indices, not on the coordinates directly.

#### Common Mistakes
- compressing correctly but later treating indices as real lengths
- updating the wrong half-open interval in rectangle union
- storing area in `int`

#### Debugging Strategy
Print both the compressed index and the original coordinate interval it represents. Many geometry bugs hide in that translation layer.

#### Comparison with Similar Pattern
Coordinate compression is not a geometry algorithm by itself. It is an enabling transformation that lets indexed data structures operate on sparse spatial data.

#### Advanced Note
Compression appears again in tree flattening and offline query problems, which is why this pattern transfers well beyond geometry.

## 4. Pattern Template, State Model, or Core Workflow

Canonical geometry and event workflow:

1. Define the object precisely.
   Is it a point, segment, rectangle, or interval? Are boundaries inclusive or half-open?
2. Decide whether a sorted-axis sweep exists.
3. Define events.
   What enters, what leaves, and what must be updated between events?
4. Choose the active structure.
   Count only, best value, covered length, or more complex state?
5. Check arithmetic safety.
   Use `long` for cross products, lengths, and area accumulation.

Important safety rules:

- tie-breaking at equal event positions must be explicit
- compressed indices represent order; original coordinates recover length
- every predicate must define how touching boundaries are handled
- if the problem can stay in integer arithmetic, keep it there

What usually breaks first:

- event ordering at equal coordinates
- coverage length computation after compression
- segment-intersection handling for collinear cases
- silent overflow in area or orientation calculations

When to adapt versus keep the template unchanged:

- keep simple event counting unchanged for overlap-count problems
- adapt the active structure when the sweep needs covered length or best value
- switch to direct predicates if the object count is small and a full sweep is unnecessary

## 5. Worked Examples and Full Solutions

### Worked Example 1: Minimum Meeting Rooms with Events
#### Problem Statement
Given meeting intervals `[start, end)`, return the minimum number of meeting rooms needed so no meetings overlap in the same room.

#### Why This Example Matters
This is the cleanest sweep-line introduction. It shows how many “geometry” problems are really ordered-event problems.

#### Input and Constraints
- `1 <= intervals.length <= 200000`
- meeting times fit in `int`
- end time is treated as non-overlapping with a meeting that starts exactly there

#### Recognition Signals
- intervals activate and deactivate over time
- the answer changes only at interval boundaries
- brute-force pair checking is too slow

#### Brute-Force Approach
Compare each meeting against all others or simulate room placement with repeated scans.

#### Better Pattern-Based Approach
Create start and end events, sort them, and track the active meeting count while sweeping from left to right.

#### Why the Pattern Fits
The number of active meetings is constant between event times, so only starts and ends matter.

#### Invariant or State Transition
After processing all events at a coordinate, `activeMeetings` equals the number of meetings currently occupying rooms.

#### Pragmatic Java Choice
Use an array of small event objects and explicit tie-breaking so end events come before start events at the same time.

#### Dry Run Before Code
For intervals `[0, 30]`, `[5, 10]`, `[15, 20]`:

- start at `0`: active becomes `1`
- start at `5`: active becomes `2`
- end at `10`: active becomes `1`
- start at `15`: active becomes `2`

The maximum active count is `2`.

#### Java Solution
```java
import java.util.Arrays;

public class MeetingRoomsSweepExample {
    static class Event implements Comparable<Event> {
        int time;
        int delta;

        Event(int time, int delta) {
            this.time = time;
            this.delta = delta;
        }

        @Override
        public int compareTo(Event other) {
            if (time != other.time) {
                return Integer.compare(time, other.time);
            }
            return Integer.compare(delta, other.delta);
        }
    }

    static int minMeetingRooms(int[][] intervals) {
        Event[] events = new Event[intervals.length * 2];
        int index = 0;
        for (int[] interval : intervals) {
            events[index++] = new Event(interval[0], 1);
            events[index++] = new Event(interval[1], -1);
        }

        Arrays.sort(events);
        int activeMeetings = 0;
        int answer = 0;
        for (Event event : events) {
            activeMeetings += event.delta;
            answer = Math.max(answer, activeMeetings);
        }
        return answer;
    }

    public static void main(String[] args) {
        int[][] intervals = {{0, 30}, {5, 10}, {15, 20}};
        System.out.println(minMeetingRooms(intervals));
    }
}
```

#### Time and Space Complexity
- Brute force: `O(n^2)`
- Sweep line: `O(n log n)` time for sorting and `O(n)` space

#### Edge Cases
- meetings that touch at endpoints
- many meetings starting at the same time
- single meeting input

#### Common Mistakes
- processing starts before ends at the same time and overcounting rooms
- forgetting that `[start, end)` is half-open here
- assuming sweep line always needs a complex active structure when a simple counter is enough

### Worked Example 2: Union Area of Axis-Aligned Rectangles
#### Problem Statement
Given axis-aligned rectangles, compute the total area covered by their union.

#### Why This Example Matters
This is the classic line-sweep-plus-events problem. It combines event ordering, coordinate compression, segment trees, and area accumulation.

#### Input and Constraints
- rectangles are given as `(x1, y1, x2, y2)` with `x1 < x2` and `y1 < y2`
- coordinates fit in `int`, but total area may require `long`

#### Recognition Signals
- area is accumulated across strips between sorted `x` events
- active `y` coverage changes only when rectangles start or end
- raw coordinates may be sparse and large

#### Brute-Force Approach
Scan every cell on a fine grid or compare all rectangle interactions directly.

#### Better Pattern-Based Approach
Sweep by `x`. Maintain the total covered `y` length of active rectangles using a segment tree over compressed `y` coordinates.

#### Why the Pattern Fits
Between consecutive `x` events, the set of active rectangles is fixed, so the covered `y` length is constant across that strip.

#### Invariant or State Transition
The segment tree stores the total covered `y` length for the current active rectangle set. Area added between two consecutive `x` positions is `coveredY * deltaX`.

#### Pragmatic Java Choice
Use half-open intervals `[y1, y2)` and store the original sorted `y` coordinates to recover real lengths from compressed indices.

#### Dry Run Before Code
If the current covered `y` length is `7` and the sweep moves from `x = 3` to `x = 8`, the added area is `7 * 5 = 35` before processing the new events at `x = 8`.

#### Java Solution
```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class RectangleUnionAreaExample {
    static class Event implements Comparable<Event> {
        int x;
        int y1;
        int y2;
        int delta;

        Event(int x, int y1, int y2, int delta) {
            this.x = x;
            this.y1 = y1;
            this.y2 = y2;
            this.delta = delta;
        }

        @Override
        public int compareTo(Event other) {
            return Integer.compare(this.x, other.x);
        }
    }

    static class SegmentTree {
        private final int[] coverCount;
        private final long[] coveredLength;
        private final int[] coordinates;

        SegmentTree(int[] coordinates) {
            this.coordinates = coordinates;
            int size = Math.max(1, coordinates.length * 4);
            this.coverCount = new int[size];
            this.coveredLength = new long[size];
        }

        void update(int queryLeft, int queryRight, int delta) {
            update(1, 0, coordinates.length - 2, queryLeft, queryRight, delta);
        }

        private void update(int node, int left, int right, int queryLeft, int queryRight, int delta) {
            if (queryRight < left || right < queryLeft || left > right) {
                return;
            }
            if (queryLeft <= left && right <= queryRight) {
                coverCount[node] += delta;
                pull(node, left, right);
                return;
            }
            int mid = left + (right - left) / 2;
            update(node * 2, left, mid, queryLeft, queryRight, delta);
            update(node * 2 + 1, mid + 1, right, queryLeft, queryRight, delta);
            pull(node, left, right);
        }

        private void pull(int node, int left, int right) {
            if (coverCount[node] > 0) {
                coveredLength[node] = coordinates[right + 1] - coordinates[left];
            } else if (left == right) {
                coveredLength[node] = 0;
            } else {
                coveredLength[node] = coveredLength[node * 2] + coveredLength[node * 2 + 1];
            }
        }

        long totalCoveredLength() {
            return coveredLength[1];
        }
    }

    static long rectangleUnionArea(int[][] rectangles) {
        List<Event> events = new ArrayList<>();
        List<Integer> yCoordinates = new ArrayList<>();

        for (int[] rectangle : rectangles) {
            int x1 = rectangle[0];
            int y1 = rectangle[1];
            int x2 = rectangle[2];
            int y2 = rectangle[3];

            events.add(new Event(x1, y1, y2, 1));
            events.add(new Event(x2, y1, y2, -1));
            yCoordinates.add(y1);
            yCoordinates.add(y2);
        }

        events.sort(null);
        int[] compressed = yCoordinates.stream().distinct().sorted().mapToInt(Integer::intValue).toArray();
        SegmentTree segmentTree = new SegmentTree(compressed);

        long area = 0;
        int previousX = events.get(0).x;
        for (Event event : events) {
            long coveredY = segmentTree.totalCoveredLength();
            area += coveredY * (event.x - previousX);

            int leftIndex = Arrays.binarySearch(compressed, event.y1);
            int rightIndex = Arrays.binarySearch(compressed, event.y2) - 1;
            segmentTree.update(leftIndex, rightIndex, event.delta);
            previousX = event.x;
        }
        return area;
    }

    public static void main(String[] args) {
        int[][] rectangles = {
                {0, 0, 4, 3},
                {2, 1, 6, 5},
                {5, 0, 7, 2}
        };
        System.out.println(rectangleUnionArea(rectangles));
    }
}
```

#### Time and Space Complexity
- Brute force on coordinates: infeasible for large coordinate values
- Sweep line with compression and segment tree: `O(n log n)` time and `O(n)` space

#### Edge Cases
- rectangles that only touch on edges
- repeated `x` events at the same coordinate
- very large total covered area

#### Common Mistakes
- forgetting that segment-tree leaves represent intervals between coordinates, not points
- updating `[y1, y2]` instead of half-open `[y1, y2)`
- storing area in `int`

### Worked Example 3: Segment Intersection with Exact Integer Logic
#### Problem Statement
Given two closed line segments, determine whether they intersect, including touching and collinear overlap cases.

#### Why This Example Matters
This example isolates the geometry predicate layer. It shows how many geometric bugs come from imprecise intersection logic rather than from algorithm choice.

#### Input and Constraints
- endpoints fit in `int`
- touching at endpoints counts as intersection
- collinear overlap counts as intersection

#### Recognition Signals
- segment intersection
- boundary cases matter
- floating-point line-equation checks would be fragile

#### Brute-Force Approach
Rely on slope formulas or approximate line equations with floating-point comparisons.

#### Better Pattern-Based Approach
Use orientation tests plus bounding-box checks for collinear cases.

#### Why the Pattern Fits
Orientation uses exact integer arithmetic and directly captures left-turn, right-turn, and collinear relationships.

#### Invariant or State Transition
The sign of the cross product consistently represents the relative turn direction between ordered points.

#### Pragmatic Java Choice
Use `long` for the cross-product expression even if coordinates are `int`.

#### Dry Run Before Code
Segments `[(1, 1), (4, 4)]` and `[(1, 4), (4, 1)]` have opposite orientations with respect to each other, so they intersect properly.

#### Java Solution
```java
public class SegmentIntersectionExample {
    static class Point {
        long x;
        long y;

        Point(long x, long y) {
            this.x = x;
            this.y = y;
        }
    }

    static long orientation(Point a, Point b, Point c) {
        return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    }

    static boolean onSegment(Point a, Point b, Point c) {
        return Math.min(a.x, c.x) <= b.x && b.x <= Math.max(a.x, c.x)
                && Math.min(a.y, c.y) <= b.y && b.y <= Math.max(a.y, c.y);
    }

    static boolean intersects(Point a, Point b, Point c, Point d) {
        long o1 = orientation(a, b, c);
        long o2 = orientation(a, b, d);
        long o3 = orientation(c, d, a);
        long o4 = orientation(c, d, b);

        if ((o1 > 0 && o2 < 0 || o1 < 0 && o2 > 0)
                && (o3 > 0 && o4 < 0 || o3 < 0 && o4 > 0)) {
            return true;
        }

        if (o1 == 0 && onSegment(a, c, b)) {
            return true;
        }
        if (o2 == 0 && onSegment(a, d, b)) {
            return true;
        }
        if (o3 == 0 && onSegment(c, a, d)) {
            return true;
        }
        return o4 == 0 && onSegment(c, b, d);
    }

    public static void main(String[] args) {
        Point a = new Point(1, 1);
        Point b = new Point(4, 4);
        Point c = new Point(1, 4);
        Point d = new Point(4, 1);
        System.out.println(intersects(a, b, c, d));
    }
}
```

#### Time and Space Complexity
- Brute force and orientation predicate both run in `O(1)` for one pair, but the orientation version is exact and robust
- space `O(1)`

#### Edge Cases
- touching at one endpoint
- fully collinear overlapping segments
- vertical or horizontal segments

#### Common Mistakes
- using `int` for cross products
- forgetting the collinear overlap cases
- mixing strict and non-strict endpoint comparisons inconsistently

## 6. Complexity and Comparison Guide

Across the chapter, the main trade-offs are:

- direct pair checking: simple but too slow for many interacting objects
- sweep line: `O(n log n)` or similar when sorted events and active structure replace pairwise interaction
- coordinate compression: low extra complexity for a large reduction in feasible indexed state
- exact integer predicates: slightly more careful code, but much safer than fragile floating-point comparisons for common tasks

Comparison with similar patterns:

- simple interval sorting versus sweep line: interval sorting is enough when only endpoint order matters; sweep line is stronger when the active state must evolve continuously between events.
- raw coordinates versus compressed coordinates: raw coordinates are simpler conceptually, but infeasible when sparse and huge; compression preserves order while enabling indexed structures.
- floating-point geometry versus integer predicates: floating-point can be necessary in some problems, but many core interview tasks are more safely solved with integer cross products and exact interval rules.

Decision criteria:

- choose direct predicates for single intersections or tiny input sizes
- choose sweep line when the answer changes only at sorted events
- choose compression when coordinates are large but only relative order matters
- choose `long` whenever products, areas, or accumulated lengths may overflow `int`

Signals not to force these techniques:

- the object count is tiny and pair checking is clear enough
- the problem is really graph traversal on a grid, not computational geometry
- coordinate compression adds more complexity than benefit for dense small coordinates

What breaks when invariants fail:

- wrong event tie-breaking changes active counts
- wrong compressed interval mapping corrupts coverage length
- wrong orientation sign handling flips intersection outcomes on boundary cases

## 7. Edge Cases, Pitfalls, and Debugging

Common implementation bugs:

- off-by-one in half-open interval updates during rectangle union
- not deciding whether touching boundaries count as overlap
- forgetting to process equal-coordinate events in a consistent order
- storing geometric accumulators in `int`

Boundary-condition handling:

- equal coordinates often create the hardest cases
- collinear objects need separate handling from proper crossings
- area problems require careful treatment of zero-width or zero-height objects if they are allowed

Numeric stability and overflow risks:

- cross products can overflow `int` even when coordinates look modest
- area sums across many rectangles can exceed `int`
- `double` comparisons on nearly equal values can hide predicate errors

Short debugging checklist:

1. Write the boundary policy explicitly.
2. Print the sorted event list on a tiny example.
3. Map compressed indices back to original coordinates during debugging.
4. Recompute one small case by hand.
5. Upgrade to `long` before chasing mysterious negative values.

Counterexample to a common wrong solution:

If meeting ends are processed after meeting starts at the same time, then intervals `[0, 5)` and `[5, 10)` incorrectly require two rooms even though they do not overlap under half-open semantics.

## 8. Practice Problems

### Easy
- Meeting Rooms II: compute the minimum number of simultaneous intervals; expected pattern or core idea: sweep line with sorted events.
- Rectangle Overlap Check: determine whether two axis-aligned rectangles overlap; expected pattern or core idea: boundary reasoning with interval overlap.
- Segment Intersection Basics: test whether two line segments intersect; expected pattern or core idea: orientation and on-segment checks.

### Medium
- Skyline Problem: output the skyline formed by buildings; expected pattern or core idea: sweep line plus active structure.
- Car Pooling: process interval capacity updates and feasibility; expected pattern or core idea: ordered events or difference array.
- Sweep Coverage Length: compute total covered length of intervals on a line; expected pattern or core idea: event sorting and active counts.

### Hard
- Rectangle Union Area: compute total covered area of many rectangles; expected pattern or core idea: line sweep plus coordinate compression and segment tree.
- Closest Pair Variant with Boundaries: maintain geometric candidates efficiently; expected pattern or core idea: sorted sweeps and careful predicate logic.
- Dynamic Segment Intersections Offline: answer many intersection queries; expected pattern or core idea: sweep line plus event ordering and indexed state.

## 9. Short Recap

The core idea is to turn spatial interaction into exact predicates, sorted events, and compressed indexed state when needed. The strongest recognition clue is that the answer changes only at boundaries or event coordinates. The key optimization insight is that sweep line replaces many pair interactions with ordered updates to an active structure. The most important implementation warning is to make boundary rules and numeric types explicit before coding. This prepares the next chapter because tree path-query structures reuse compression and segment-tree thinking in a non-geometric setting.

## 10. Coverage Check

- 20.1 Geometry Pattern - covered
- 20.2 Sweep Line Pattern - covered
- 20.3 Line Sweep plus Events Pattern - covered
- 20.4 Coordinate compression and sorted events - covered
- 20.5 Area, intersection, and boundary-case reasoning - covered
- 20.6 Numeric stability and overflow handling in Java - covered

- Coverage Summary: 6/6 official subtopics covered
- This must always be 6/6 before final output

Next: 21: Advanced Tree and Path Query Patterns
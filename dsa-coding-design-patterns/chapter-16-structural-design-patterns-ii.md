
# 16: Structural Design Patterns II

## Introduction and Context

This chapter covers the remaining structural patterns that control how objects are composed and accessed: Flyweight (sharing state across many similar objects), advanced wrapper strategies, refactoring paths for legacy code, and testing structural designs.

The core challenge: structural patterns can make code cleaner or more convoluted. The wrong pattern choice trades one problem for another. Flyweight saves memory but complicates equality. Proxy adds indirection, which can hurt clarity. The skill is matching the pattern to the real constraint and knowing when simpler is better.

This chapter also emphasizes a pragmatic lens: when do you actually need these patterns? When should you avoid them?

## Core Intuition and Mechanics

Structural patterns are about composition and delegation:

- **Flyweight**: share immutable state across many objects to save memory.
- **Wrapper composition**: use Decorator, Adapter, Proxy, and Facade as building blocks.
- **Refactoring**: incrementally introduce structure to legacy code without breaking it.
- **Testing**: design for testability by controlling dependencies and seams.

The key tension: every pattern adds indirection and complexity. The payoff must be clear: is the benefit worth the cost?

## Core Concepts and Subtopics

### Concept Cluster: Flyweight Pattern and Memory Optimization
Topics in this cluster:
- 16.1 Flyweight Pattern: Shared state; Intrinsic state; Extrinsic state; Memory optimization
- 16.2 Factory support for flyweights; When object sharing hurts clarity or thread safety

#### Definition

**Intrinsic state** is immutable and shared (e.g., character glyphs in a text editor). **Extrinsic state** is mutable and unique per instance (e.g., position, color). Flyweight extracts intrinsic state into a shared pool, creating new instances only for unique intrinsic values.

#### Classic Example: Text Editor Character

```java
interface Glyph {
    void draw(Graphics g, int x, int y);
}

class Character implements Glyph {
    private final char c;  // intrinsic
    Character(char c) { this.c = c; }
    public void draw(Graphics g, int x, int y) {
        // draw using c, x, y
    }
}

class CharacterFactory {
    private final Map<Character, Glyph> pool = new HashMap<>();
    Glyph getCharacter(char c) {
        return pool.computeIfAbsent(c, Character::new);
    }
}
```

#### Why Flyweight Matters

If a document has 1 million characters but only 26 distinct letters (plus punctuation), storing each character separately wastes memory. Sharing the intrinsic state (the character type) across all instances saves orders of magnitude.

#### When NOT to Use Flyweight

If there are few instances (< 1000), memory savings are negligible. If equality or hashing on extrinsic state is needed, flyweight complicates comparison. If thread safety is critical, sharing state becomes a synchronization headache.

#### Common Mistakes

- Storing mutable state in the flyweight; it becomes shared and breaks isolation.
- Treating extrinsic state as intrinsic; the shared pool is no longer correct.
- Over-engineering for memory savings that never materialize.

---

### Concept Cluster: Wrapper Composition Strategies
Topics in this cluster:
- 16.3 Wrapper composition strategies; Pattern comparisons across Adapter, Facade, Proxy, Bridge, Composite, Decorator, and Flyweight

#### Definition

Adapters, facades, proxies, decorators, and composites all wrap or delegate to other objects. The intent differs:

- **Adapter**: convert interface A to interface B.
- **Facade**: provide simplified access to a subsystem.
- **Proxy**: control access (lazy loading, caching, synchronization).
- **Bridge**: separate abstraction from implementation.
- **Composite**: treat single and group objects uniformly.
- **Decorator**: add responsibilities dynamically.

#### When Each Fits

```java
// Adapter: incompatible interfaces
class LegacyPrinter { void print(String text) {} }
class ModernPrintAdapter implements ModernPrinter {
    private LegacyPrinter legacy = new LegacyPrinter();
    public void printDocument(Document doc) {
        legacy.print(doc.getText());
    }
}

// Decorator: add responsibility
InputStream base = new FileInputStream("file.txt");
InputStream compressed = new GZIPInputStream(base);
InputStream encrypted = new EncryptionInputStream(compressed);

// Proxy: control access
class ExpensiveResourceProxy implements ExpensiveResource {
    private ExpensiveResource real = null;
    public void use() {
        if (real == null) real = new RealExpensiveResource();
        real.use();
    }
}
```

#### Composition vs. Inheritance

Prefer composition. It avoids the fragility of deep inheritance hierarchies and allows runtime flexibility.

---

### Concept Cluster: Refactoring and Legacy Structure
Topics in this cluster:
- 16.4 Refactoring legacy structures; Refactoring paths and extension points
- 16.5 Memory/performance trade-offs; Scalability impact; Indirection cost

#### Definition

Refactoring legacy code to introduce patterns incrementally without breaking existing behavior. Key techniques: extract abstraction, introduce interface, apply strategy or decorator.

#### Refactoring Strategy

1. Write tests for existing behavior.
2. Introduce an interface without changing the implementation.
3. Add a new implementation alongside the old.
4. Use dependency injection to allow switching.
5. Migrate call sites gradually.

#### Example: Adding Caching

```java
// Old
public class DataService {
    public Data fetch(String id) {
        return expensiveQuery(id);
    }
}

// Refactored: interface first
public interface DataFetcher {
    Data fetch(String id);
}

public class DataService implements DataFetcher {
    public Data fetch(String id) {
        return expensiveQuery(id);
    }
}

// New: cache decorator
public class CachingDataFetcher implements DataFetcher {
    private final DataFetcher delegate;
    private final Map<String, Data> cache = new HashMap<>();
    
    public CachingDataFetcher(DataFetcher delegate) {
        this.delegate = delegate;
    }
    
    public Data fetch(String id) {
        return cache.computeIfAbsent(id, k -> delegate.fetch(k));
    }
}
```

#### Trade-offs

- **Memory vs. speed**: caching saves computation but uses memory.
- **Abstraction vs. clarity**: patterns enable extension but add layers to read.
- **Batch refactoring vs. incremental**: incremental is safer; batch is faster.

---

### Concept Cluster: Testing Structural Designs
Topics in this cluster:
- 16.6 Testing structural designs; Unit testing patterns and mocking collaborators; Integration testing and testable design

#### Definition

Structural patterns enable testability by creating seams: points where you can inject dependencies or mocks instead of real implementations.

#### Testable Design with Injection

```java
public class UserRepository {
    private final Database db;
    
    // Dependency injection
    public UserRepository(Database db) {
        this.db = db;
    }
    
    public User findById(String id) {
        return db.query("SELECT * FROM users WHERE id = ?", id);
    }
}

// In tests
class FakeDatabase implements Database {
    private final Map<String, User> store = new HashMap<>();
    public User query(String sql, String id) {
        return store.get(id);
    }
}

@Test
public void testFindById() {
    Database fake = new FakeDatabase();
    ((FakeDatabase) fake).store.put("1", new User("1", "Alice"));
    UserRepository repo = new UserRepository(fake);
    assertEquals("Alice", repo.findById("1").getName());
}
```

#### Mocking Frameworks

```java
@Test
public void testWithMocks() {
    Database mockDb = mock(Database.class);
    when(mockDb.query(anyString(), eq("1"))).thenReturn(new User("1", "Alice"));
    UserRepository repo = new UserRepository(mockDb);
    assertEquals("Alice", repo.findById("1").getName());
}
```

#### Integration Testing

Test multiple layers together; ensure interfaces and contracts hold across boundaries.

#### Anti-Pattern: Over-Mocking

Too many mocks means the test doesn't exercise real behavior. Keep mocks for external dependencies (databases, APIs); use real implementations for internal logic.

---

## Worked Examples

### Worked Example 1: Flyweight in a Game

```java
class Tile {
    final int textureId;  // intrinsic: shared
    int x, y;  // extrinsic: unique per instance
    
    Tile(int textureId) { this.textureId = textureId; }
}

class TileFactory {
    Map<Integer, Tile> tiles = new HashMap<>();
    Tile getTile(int textureId, int x, int y) {
        Tile t = tiles.computeIfAbsent(textureId, Tile::new);
        t.x = x; t.y = y;
        return t;
    }
}
```

**Memory savings**: 1000x1000 grid with 10 tile types uses 10 Tile objects, not 1 million.

### Worked Example 2: Refactoring to Add Caching

```java
interface ExpensiveOperation {
    int compute(int x);
}

class CachingDecorator implements ExpensiveOperation {
    final ExpensiveOperation delegate;
    final Map<Integer, Integer> cache = new HashMap<>();
    
    CachingDecorator(ExpensiveOperation delegate) {
        this.delegate = delegate;
    }
    
    public int compute(int x) {
        return cache.computeIfAbsent(x, delegate::compute);
    }
}
```

**Why it works**: new responsibility (caching) is independent of the original logic.

### Worked Example 3: Mock-Based Unit Test

```java
@Test
public void testPaymentProcessor() {
    PaymentGateway mock = mock(PaymentGateway.class);
    when(mock.charge(100.0)).thenReturn(true);
    
    PaymentProcessor processor = new PaymentProcessor(mock);
    assertTrue(processor.processPayment(100.0));
    
    verify(mock).charge(100.0);
}
```

**Why isolation matters**: test logic without depending on a real payment service.

---

## Solved Problems

**Problem 1 (Easy)**: Implement Flyweight for a character set.

**Problem 2 (Easy)**: Refactor a legacy class to use dependency injection.

**Problem 3 (Medium)**: Add caching via Decorator to an expensive computation.

**Problem 4 (Medium)**: Write testable code for a file-processing service.

**Problem 5 (Hard)**: Design a system that supports multiple logger implementations via composition (Adapter, Decorator, Proxy).

---

## Recognition Guide

Use Flyweight when instances outnumber distinct intrinsic states and memory is constrained. Use Decorator to add independent responsibilities. Use Proxy for access control or lazy initialization. Refactor incrementally, introducing patterns only where the cost-benefit is clear.

Avoid structural patterns when the codebase is already complex. Do not over-engineer for future flexibility that may never be needed.

---

## Comparison Tables

| Pattern | Purpose | Complexity | When to Use |
|---------|---------|-----------|-----------|
| Adapter | Interface conversion | Low | Integrate incompatible interfaces |
| Facade | Simplified access | Low | Hide subsystem complexity |
| Proxy | Access control | Medium | Lazy loading, caching, sync |
| Decorator | Add responsibility | Medium | Dynamic behavior at runtime |
| Bridge | Separate abstraction | Medium | Multiple implementations matter |
| Composite | Uniform treatment | Medium | Tree structures |
| Flyweight | Memory optimization | High | Many similar objects |

---

## Design and Decision Making

Start simple. Use structural patterns only when you have a real constraint (memory, performance, testability). Introduce them incrementally via refactoring. Measure before and after. Design for testability from the start: inject dependencies, avoid static factories, use interfaces.

---

## Practical Applications

- **Web frameworks**: decorators for middleware chains (logging, auth, compression).
- **Graphics systems**: flyweight for textures, glyphs, materials.
- **Database layers**: proxy for connection pooling, caching layers via facades.
- **Legacy system integration**: adapters to bridge old and new APIs.

---

## Failure Modes and Trade-offs

**Flyweight gone wrong**: shared state becomes mutable; isolation breaks.

**Over-composition**: too many wrapper layers; each adds latency and debugging complexity.

**Testability illusion**: perfect mocks but untested real code paths.

**Premature refactoring**: introduce patterns before you know the actual constraints.

---

## Condensed Notes

- Flyweight: share intrinsic, vary extrinsic.
- Adapter: convert interface A to B.
- Facade: simplify subsystem access.
- Proxy: intercept; lazy load, cache, sync.
- Decorator: add responsibility independently.
- Refactor incrementally with tests.
- Inject dependencies; mock at boundaries.
- Measure trade-offs; not all patterns fit.

---

## Additional Problems

**Easy**: Cache layer for API calls. Logging decorator. Object pool pattern.

**Medium**: Multi-level caching (memory, disk). Composite file-system structure. Proxy with lazy initialization.

**Hard**: Thread-safe flyweight factory. Refactor monolith to plugins. Full testing strategy for complex system.

---

## Key Questions

1. What is intrinsic vs. extrinsic state in Flyweight?
2. When is Flyweight worth the complexity?
3. How do Proxy and Decorator differ in intent?
4. What refactoring steps introduce a pattern safely?
5. How do you test code with structural patterns?
6. When should you NOT use a pattern?
7. What is the memory overhead of too many wrapper layers?
8. How do you handle thread safety in shared Flyweight objects?
9. What dependencies should you mock in unit tests?
10. How do you measure if a refactoring improved the system?

---

## Applied Project

Build a **document rendering system** with support for multiple formats (PDF, HTML, Markdown). Use Adapter for format conversion, Decorator for styling and encryption, Flyweight for shared font objects, Proxy for lazy loading of images, and injectable components for testability. Write comprehensive unit and integration tests.

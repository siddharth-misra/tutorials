# 12: Structural Design Patterns I

## Introduction and Context

Structural patterns address how objects and classes are combined into larger structures while keeping those structures flexible and efficient. They are less about creation (like Chapter 8) and more about composition: how should objects relate, delegate, and wrap each other?

The central question is: how do you add behavior without tight coupling, without creating a combinatorial explosion of classes, and without breaking existing code? Structural patterns answer this with composition strategies: adapters convert interfaces, facades simplify complexity, proxies control access, bridges decouple abstraction from implementation, composites unify tree and leaf, decorators add behavior dynamically.

This chapter covers the first six major structural patterns. Understanding these teaches composition discipline that transfers to architecture, testing, and long-term maintainability.

## Core Intuition and Mechanics

Think of each pattern as answering how objects should relate:

- **Adapter**: "How do I make incompatible interfaces work together?"
- **Facade**: "How do I simplify a complex subsystem?"
- **Proxy**: "How do I control access to another object?"
- **Bridge**: "How do I decouple an abstraction from its implementation?"
- **Composite**: "How do I treat individual and composite objects uniformly?"
- **Decorator**: "How do I add behavior dynamically without inheritance?"

Each uses composition strategically. The result is code that respects open-closed principle: open for extension (new variants), closed for modification (existing code unchanged).

## Core Concepts and Subtopics

### Concept Cluster: Adapter and Facade Patterns

**Topics in this cluster:**
- 12.1 Adapter Pattern: Class adapter, Object adapter, Legacy integration, Interface conversion, Wrapper design trade-offs, Adapter versus facade
- 12.2 Facade Pattern and simplified interface, Subsystem wrapping and layered access

#### Definition

**Adapter** converts one interface into another so incompatible classes can work together. **Facade** provides a simplified, unified interface to a complex subsystem.

#### Why It Matters

Adapters let you integrate legacy code without rewriting it. Facades hide subsystem complexity from clients, making systems easier to use and change.

#### Object Adapter (Preferred in Java)

```java
// Existing incompatible interface
interface Target {
    void request();
}

class Adaptee {
    public void specificRequest() {
        System.out.println("Adaptee specific request");
    }
}

// Adapter wraps Adaptee and implements Target
class ObjectAdapter implements Target {
    private Adaptee adaptee;
    
    public ObjectAdapter(Adaptee adaptee) {
        this.adaptee = adaptee;
    }
    
    @Override
    public void request() {
        adaptee.specificRequest();
    }
}

// Usage
Adaptee adaptee = new Adaptee();
Target target = new ObjectAdapter(adaptee);
target.request();
```

#### Facade Pattern

```java
// Subsystem classes
class SubsystemA {
    public void operationA() { System.out.println("Subsystem A"); }
}

class SubsystemB {
    public void operationB() { System.out.println("Subsystem B"); }
}

// Facade provides simplified interface
class Facade {
    private SubsystemA a = new SubsystemA();
    private SubsystemB b = new SubsystemB();
    
    public void complexOperation() {
        a.operationA();
        b.operationB();
        System.out.println("Complex operation done");
    }
}

// Client uses only Facade
Facade facade = new Facade();
facade.complexOperation();
```

#### Adapter vs Facade

Adapter makes two incompatible things work. Facade simplifies many related things into one. Adapter is one-to-one; facade is many-to-one.

#### Common Mistakes

- Using Adapter when Facade would be clearer.
- Forgetting that Adapter does not change Adaptee's behavior.
- Making Facade try to do too much (God object).

---

### Concept Cluster: Proxy and Bridge Patterns

**Topics in this cluster:**
- 12.3 Proxy Pattern and controlled access, Virtual/protection/remote/caching proxies, Lazy loading proxy and lifecycle control, Facade versus proxy versus adapter
- 12.4 Bridge Pattern: Abstraction layer, Implementation layer, Decoupling dimensions, Platform variations, Runtime extensibility, Bridge versus strategy

#### Definition

**Proxy** provides a surrogate that controls access to another object. **Bridge** decouples an abstraction from its implementation so they can vary independently.

#### Why It Matters

Proxies enable lazy initialization, access control, logging, and caching without changing the original object. Bridges avoid combinatorial class explosion when you have two independent dimensions of variation.

#### Proxy Pattern: Caching Example

```java
interface DataService {
    String fetch(String key);
}

class RealDataService implements DataService {
    @Override
    public String fetch(String key) {
        System.out.println("Fetching from network: " + key);
        return "data for " + key;
    }
}

class CachingProxy implements DataService {
    private RealDataService real = new RealDataService();
    private Map<String, String> cache = new HashMap<>();
    
    @Override
    public String fetch(String key) {
        if (!cache.containsKey(key)) {
            cache.put(key, real.fetch(key));
        }
        return cache.get(key);
    }
}

// Client uses proxy; unaware of caching
DataService service = new CachingProxy();
System.out.println(service.fetch("key1")); // fetches
System.out.println(service.fetch("key1")); // cached
```

#### Bridge Pattern: Shape and Color

```java
// Abstraction
interface DrawAPI {
    void draw(int x, int y, int radius);
}

class RedDraw implements DrawAPI {
    @Override
    public void draw(int x, int y, int radius) {
        System.out.println("Red circle at (" + x + "," + y + ")");
    }
}

// Refined Abstraction
abstract class Shape {
    protected DrawAPI drawAPI;
    
    public Shape(DrawAPI drawAPI) {
        this.drawAPI = drawAPI;
    }
    
    abstract void draw();
}

class Circle extends Shape {
    private int x, y, radius;
    
    public Circle(int x, int y, int radius, DrawAPI drawAPI) {
        super(drawAPI);
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
    
    @Override
    public void draw() {
        drawAPI.draw(x, y, radius);
    }
}

// Usage: vary shape and color independently
Circle redCircle = new Circle(0, 0, 10, new RedDraw());
redCircle.draw();
```

#### Proxy vs Bridge

Proxy controls access to one object. Bridge decouples two dimensions (abstraction and implementation). Proxy is a shim; Bridge is structural independence.

#### Common Mistakes

- Using Proxy when you really mean inheritance or delegation.
- Making Bridge too abstract (it is for genuine orthogonal dimensions, not every parameter).

---

### Concept Cluster: Composite and Decorator Patterns

**Topics in this cluster:**
- 12.5 Composite Pattern: Tree structure, Leaf nodes, Composite nodes, Recursive operations, Uniform client treatment, Composite plus traversal extensions
- 12.6 Decorator Pattern: Dynamic behavior addition, Wrapper chaining, Runtime extensions, I/O stream example, Ordering multiple decorators, Decorator versus inheritance

#### Definition

**Composite** lets you compose objects into tree structures where clients treat individual and composite objects uniformly. **Decorator** attaches additional responsibilities to objects dynamically, providing a flexible alternative to inheritance.

#### Why It Matters

Composite handles variable-depth hierarchies elegantly (file systems, menus, expression trees). Decorator adds features at runtime without class explosion.

#### Composite Pattern: File System

```java
abstract class FileSystemNode {
    protected String name;
    
    public FileSystemNode(String name) {
        this.name = name;
    }
    
    abstract int getSize();
    abstract void display(String indent);
}

class File extends FileSystemNode {
    private int size;
    
    public File(String name, int size) {
        super(name);
        this.size = size;
    }
    
    @Override
    public int getSize() { return size; }
    
    @Override
    public void display(String indent) {
        System.out.println(indent + "File: " + name + " (" + size + " bytes)");
    }
}

class Directory extends FileSystemNode {
    private List<FileSystemNode> children = new ArrayList<>();
    
    public Directory(String name) {
        super(name);
    }
    
    public void add(FileSystemNode node) {
        children.add(node);
    }
    
    @Override
    public int getSize() {
        return children.stream().mapToInt(FileSystemNode::getSize).sum();
    }
    
    @Override
    public void display(String indent) {
        System.out.println(indent + "Dir: " + name);
        for (FileSystemNode child : children) {
            child.display(indent + "  ");
        }
    }
}
```

#### Decorator Pattern: I/O Streams Style

```java
interface Component {
    void operation();
}

class ConcreteComponent implements Component {
    @Override
    public void operation() {
        System.out.println("Basic operation");
    }
}

abstract class Decorator implements Component {
    protected Component component;
    
    public Decorator(Component component) {
        this.component = component;
    }
    
    @Override
    public void operation() {
        component.operation();
    }
}

class ConcreteDecoratorA extends Decorator {
    public ConcreteDecoratorA(Component component) {
        super(component);
    }
    
    @Override
    public void operation() {
        System.out.println("Before A");
        component.operation();
        System.out.println("After A");
    }
}

class ConcreteDecoratorB extends Decorator {
    public ConcreteDecoratorB(Component component) {
        super(component);
    }
    
    @Override
    public void operation() {
        System.out.println("Before B");
        component.operation();
        System.out.println("After B");
    }
}

// Usage: stack decorators
Component component = new ConcreteComponent();
component = new ConcreteDecoratorA(component);
component = new ConcreteDecoratorB(component);
component.operation(); // Before B, Before A, Basic, After A, After B
```

#### Composite vs Decorator

Composite builds trees; Decorator wraps linearly. Composite unifies leaf and composite; Decorator extends behavior.

#### Common Mistakes

- Making Composite nodes responsible for GUI rendering (separate traversal logic).
- Stacking too many decorators (becomes hard to reason about order).
- Forgetting to implement all Component methods in Decorator.

---

## Worked Examples

### Worked Example 1: Adapter for Legacy Code Integration

**Problem**: You have an existing `PaymentProcessor` with incompatible method signatures, but your system expects a `PaymentGateway` interface.

**Solution**: Create an Object Adapter.

```java
interface PaymentGateway {
    boolean pay(double amount);
}

class LegacyPaymentProcessor {
    public String processPayment(float cost) {
        return "Payment of " + cost + " processed";
    }
}

class PaymentAdapter implements PaymentGateway {
    private LegacyPaymentProcessor legacy;
    
    public PaymentAdapter(LegacyPaymentProcessor legacy) {
        this.legacy = legacy;
    }
    
    @Override
    public boolean pay(double amount) {
        String result = legacy.processPayment((float) amount);
        return result.contains("processed");
    }
}
```

---

### Worked Example 2: Facade for Database Layer Simplification

**Problem**: Your database layer has many classes (Connection, Statement, Result, Transaction). Clients should not interact with all of them.

**Solution**: Create a Facade.

```java
class DatabaseFacade {
    private DatabaseConnection conn = new DatabaseConnection();
    
    public List<Map<String, Object>> query(String sql) {
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(sql);
        return convertToMaps(rs);
    }
    
    public boolean execute(String sql) {
        Statement stmt = conn.createStatement();
        return stmt.execute(sql);
    }
    
    private List<Map<String, Object>> convertToMaps(ResultSet rs) {
        // Convert result to list of maps
        return new ArrayList<>();
    }
}

// Client uses only Facade
DatabaseFacade db = new DatabaseFacade();
List<Map<String, Object>> results = db.query("SELECT * FROM users");
```

---

### Worked Example 3: Composite Directory Tree with Total Size

**Problem**: Calculate total size of a directory and all nested files.

**Solution**: Use Composite pattern; recurse on all children.

(See Composite Pattern code above for full example.)

---

## Solved Problems

**Problem 1 (Easy)**: Adapt ArrayList to behave like Stack.

**Problem 2 (Easy)**: Create a Facade for a coffee shop ordering system.

**Problem 3 (Medium)**: Build a Composite file system supporting size and display operations.

**Problem 4 (Medium)**: Implement a caching Proxy for expensive computations.

**Problem 5 (Hard)**: Implement Decorator for I/O streams with encryption and compression.

---

## Recognition Guide

Use Adapter when integrating incompatible libraries. Use Facade to hide complexity. Use Proxy for access control or caching. Use Bridge when two dimensions vary independently. Use Composite for tree hierarchies. Use Decorator for optional behaviors.

---

## Comparison Tables

| Pattern | Main Use | Shape | Common Confusion |
|---|---|---|---|
| Adapter | Interface conversion | One wrapper around one target | Mistaken for Facade |
| Facade | Simplified subsystem entry point | One front door over many collaborators | Turning it into a God object |
| Proxy | Access control, caching, lazy loading | Surrogate with same interface | Mistaken for Decorator |
| Bridge | Independent abstraction and implementation axes | Two-layer delegation | Using it for simple parameter choices |
| Composite | Uniform tree operations | Recursive parent-child structure | Mixing traversal logic into node responsibilities |
| Decorator | Runtime behavior stacking | Linear wrapper chain | Losing track of wrapper order |

---

## Design and Decision Making

Adapter is about interface conversion. Facade is about simplification. Proxy is about control. Bridge is about decoupling. Composite is about uniformity. Decorator is about runtime flexibility. Choose based on the problem shape, not just "I want to wrap something."

---

## Practical Applications

- SDK integrations and legacy migrations often start with Adapters so the rest of the codebase can keep one internal interface.
- Facades show up in service layers, payment orchestration, and persistence boundaries where clients need one stable entry point over many moving parts.
- Proxies power lazy loading in ORM systems, access checks in security wrappers, and cached network calls in API clients.
- Composite and Decorator are both common in UI systems, document trees, and file explorers where structure and optional behavior both evolve over time.

---

## Failure Modes and Trade-offs

Adapter adds indirection. Facade can become a God object. Proxy adds a layer. Bridge adds classes. Composite requires traversal logic. Decorator stacking becomes complex.

---

## Condensed Notes

- Adapter: convert incompatible interfaces.
- Facade: simplify complex subsystem.
- Proxy: control access or delay creation.
- Bridge: separate abstraction from implementation.
- Composite: uniform tree and leaf treatment.
- Decorator: add behavior at runtime.

---

## Additional Problems

### Easy

- Wrap a legacy logger behind a modern application logging interface.
- Build a Facade for a video player subsystem.

### Medium

- Implement a virtual proxy for lazy image loading.
- Design a Composite menu tree with recursive rendering.

### Hard

- Build a Decorator chain for request processing with compression, encryption, and auditing.
- Refactor a platform-specific drawing API into a Bridge-based design.

---

## Key Questions

1. When should you use Adapter vs Bridge?
2. How do you prevent Facade from becoming a God object?
3. What types of Proxies exist?
4. Why is Bridge useful when you have 2× variation dimensions?
5. How does Composite differ from Decorator?
6. Can you combine Decorator and Composite?
7. How do you order multiple Decorators?
8. When is Proxy better than inheritance?
9. What is the relationship between Adapter and Facade?
10. How do you test code with Proxy?

---

## Applied Project

Build a file system explorer: implement Composite for nested directories, Adapter for multiple file system types, Facade for a simple API, Proxy for lazy-loading large files, and Decorator for file properties (compression, encryption status).

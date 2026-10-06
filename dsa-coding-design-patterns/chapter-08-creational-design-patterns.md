# 8: Creational Design Patterns

## Introduction and Context

Creational patterns solve a fundamental problem: how do you initialize complex objects consistently and flexibly? Naive constructors become unwieldy. Global state breaks testing. Tight coupling to concrete classes stifles extension.

Creational patterns push initialization logic into specialized objects instead of scattering it across your codebase. The result is cleaner APIs, easier testing, safer global state (or its elimination), and the ability to swap implementations without touching client code.

This chapter covers five major patterns: Singleton (controlled global state), Factory Method (delegated creation), Abstract Factory (families of related objects), Builder (step-by-step construction), and Prototype (cloning templates). Each has specific use cases and pitfalls. The most common failure is overuse: applying these patterns when a simple constructor suffices wastes time and confuses readers.

## Core Intuition and Mechanics

Think of creational patterns as answering different questions:

- **Singleton**: "How do I guarantee exactly one instance?"
- **Factory Method**: "How do I let subclasses choose what to create?"
- **Abstract Factory**: "How do I create whole families of related objects?"
- **Builder**: "How do I construct complex objects step by step?"
- **Prototype**: "How do I copy and customize template objects?"

Each pattern takes a different view of the problem. All share the idea that who creates an object and how it is created are separate concerns worth isolating.

## Core Concepts and Subtopics

### Concept Cluster: Singleton Implementations and Pitfalls

**Topics in this cluster:**
- 8.1 Singleton Pattern: Eager singleton, Lazy singleton, Thread-safe singleton, Double-checked locking, Enum singleton
- 8.2 Singleton pitfalls, global state, and testability concerns, Trade-offs and misuse cases

#### Definition

A Singleton ensures a class has exactly one instance and provides a global point of access. Common forms are eager initialization (at class load), lazy initialization (on first use), double-checked locking (thread-safe lazy), and enum-based.

#### Why It Matters

Some objects genuinely should exist only once: loggers, database connections, configuration holders. But Singleton is overused for convenience, creating hidden dependencies and testability nightmares. Know the difference between "exactly one instance is correct" and "I want global access because it is easy."

#### How It Works

**Eager Singleton**: instance created when class loads.

```java
public class EagerSingleton {
    public static final EagerSingleton INSTANCE = new EagerSingleton();
    private EagerSingleton() {}
}
```

**Lazy Singleton with Double-Checked Locking**: instance created on first use, thread-safe without synchronizing every access.

```java
public class LazyThreadSafe {
    private static volatile LazyThreadSafe instance;
    
    public static LazyThreadSafe getInstance() {
        if (instance == null) {
            synchronized (LazyThreadSafe.class) {
                if (instance == null) {
                    instance = new LazyThreadSafe();
                }
            }
        }
        return instance;
    }
    private LazyThreadSafe() {}
}
```

**Enum Singleton**: Guarantees thread safety and prevents reflection-based instantiation.

```java
public enum EnumSingleton {
    INSTANCE;
    
    public void doSomething() { }
}
```

#### Pitfalls

- Hidden dependencies make code harder to trace and test.
- Reflection can bypass private constructors (not enum).
- Serialization can create multiple instances if not handled.
- Global state makes unit tests interdependent.

#### Clean Code Rules

Prefer dependency injection or enum over Singleton unless the problem truly requires one global instance. If forced to use Singleton, provide a way for tests to reset it.

#### Common Mistakes

- Forgetting `volatile` in double-checked locking (reads may be stale).
- Assuming all platforms initialize classes the same way.
- Not serializing correctly, creating duplicate instances after deserialization.

---

### Concept Cluster: Factory Method, Abstract Factory, and Comparison

**Topics in this cluster:**
- 8.3 Factory Method Pattern: Product interface, Concrete products, Creator class, Factory method override, Real-world usage, Factory method versus a simple factory helper
- 8.4 Abstract Factory Pattern: Factory families, Related objects creation, Swappable families, UI toolkit example, Cross-platform factories, Abstract factory versus factory method

#### Definition

**Factory Method** defines an interface for creating objects, letting subclasses decide the concrete class. **Abstract Factory** provides an interface for creating families of related objects without specifying concrete classes.

#### Why It Matters

Decoupling client code from concrete classes lets you add new products or families without touching client code. This is powerful for multi-platform support, plugin systems, and testing (easy to swap mocks).

#### How Factory Method Works

```java
abstract class DocumentCreator {
    abstract Document createDocument();
    
    void openDocument() {
        Document doc = createDocument();
        doc.open();
    }
}

class PDFCreator extends DocumentCreator {
    @Override
    Document createDocument() { return new PDFDocument(); }
}
```

#### How Abstract Factory Works

```java
interface UIFactory {
    Button createButton();
    Window createWindow();
}

class WindowsUIFactory implements UIFactory {
    public Button createButton() { return new WindowsButton(); }
    public Window createWindow() { return new WindowsWindow(); }
}

class Application {
    UIFactory factory;
    Application(UIFactory factory) { this.factory = factory; }
    void render() {
        Button btn = factory.createButton();
        Window win = factory.createWindow();
    }
}
```

#### Factory Method vs Abstract Factory

Use Factory Method when you have one product hierarchy and subclasses choose the variant. Use Abstract Factory when you have multiple product families and need to ensure consistency across families (all Windows, or all Mac, never mixed).

#### Common Mistakes

- Creating a Factory Method when a helper method or switch statement is simpler.
- Forgetting that Abstract Factory often uses Factory Method internally.
- Not isolating the factory enough; letting creation logic leak into clients.

---

### Concept Cluster: Builder and Prototype Patterns

**Topics in this cluster:**
- 8.5 Builder Pattern: Step builder, Fluent builder, Immutable object builder, Director role, Complex object construction, Validation, defaults, and constructor overload alternatives
- 8.6 Prototype Pattern: Shallow copy, Deep copy, Clone registry, Object templates, Copy safety and mutability traps, Prototype versus builder for object creation

#### Definition

**Builder** constructs a complex object step by step, collecting parts and then assembling them. **Prototype** creates new objects by copying an existing template.

#### Why It Matters

Builders replace telescoping constructors with readable, extensible fluent chains. Prototypes enable efficient object copying and let you clone with variations without knowing the class.

#### Builder Pattern in Java

```java
public class DatabaseConnection {
    private final String host;
    private final int port;
    private final String database;
    private final int maxRetries;
    
    private DatabaseConnection(Builder builder) {
        this.host = builder.host;
        this.port = builder.port;
        this.database = builder.database;
        this.maxRetries = builder.maxRetries;
    }
    
    public static class Builder {
        private final String host;
        private final int port;
        private String database = "default";
        private int maxRetries = 3;
        
        public Builder(String host, int port) {
            this.host = host;
            this.port = port;
        }
        
        public Builder database(String db) {
            this.database = db;
            return this;
        }
        
        public Builder maxRetries(int retries) {
            this.maxRetries = retries;
            return this;
        }
        
        public DatabaseConnection build() {
            return new DatabaseConnection(this);
        }
    }
}

// Usage
DatabaseConnection conn = new DatabaseConnection.Builder("localhost", 5432)
    .database("mydb")
    .maxRetries(5)
    .build();
```

#### Prototype Pattern in Java

```java
public class ConfigClone implements Cloneable {
    private String name;
    private List<String> tags;
    
    @Override
    public ConfigClone clone() throws CloneNotSupportedException {
        ConfigClone cloned = (ConfigClone) super.clone();
        cloned.tags = new ArrayList<>(this.tags); // deep copy mutable fields
        return cloned;
    }
}
```

#### Builder vs Prototype

Use Builder for step-by-step construction with validation. Use Prototype when you have a template and want to quickly make variations. Builder is about assembling; Prototype is about copying.

#### Common Mistakes

- Forgetting to deep copy mutable fields in Prototype.
- Making Builder too complex with too many optional parameters (use inheritance if there are many variants).
- Not validating in `build()` when preconditions matter.

---

## Worked Examples

### Worked Example 1: Enum Singleton with Global Configuration

**Problem**: Build a thread-safe configuration holder that loads once and supplies values globally.

**Solution**: Use enum Singleton to hold configuration with thread safety and serialization safety guarantees.

```java
public enum AppConfig {
    INSTANCE;
    
    private final Properties props;
    
    AppConfig() {
        props = new Properties();
        try {
            props.load(AppConfig.class.getResourceAsStream("/app.properties"));
        } catch (Exception e) {
            throw new RuntimeException("Failed to load config", e);
        }
    }
    
    public String get(String key, String defaultValue) {
        return props.getProperty(key, defaultValue);
    }
}

// Client
String timeout = AppConfig.INSTANCE.get("timeout", "30");
```

---

### Worked Example 2: Abstract Factory for Cross-Platform UI

**Problem**: Support both Windows and macOS UI without client code checking platform.

**Solution**: Use Abstract Factory to swap UI families.

```java
interface Button { void render(); }
class WindowsButton implements Button {
    public void render() { System.out.println("Windows button"); }
}

interface UIFactory {
    Button createButton();
}

class WindowsUIFactory implements UIFactory {
    public Button createButton() { return new WindowsButton(); }
}

public class Application {
    private UIFactory factory;
    
    public Application(UIFactory factory) {
        this.factory = factory;
    }
    
    public void start() {
        Button btn = factory.createButton();
        btn.render();
    }
}
```

---

### Worked Example 3: Builder for Complex Immutable Objects

**Problem**: Create a User with many optional fields and validate before instantiation.

**Solution**: Use Builder with fluent API and validation.

```java
public class User {
    private final String email;
    private final String name;
    private final int age;
    private final List<String> roles;
    
    private User(Builder builder) {
        this.email = builder.email;
        this.name = builder.name;
        this.age = builder.age;
        this.roles = Collections.unmodifiableList(builder.roles);
    }
    
    public static class Builder {
        private final String email;
        private String name = "";
        private int age = 0;
        private final List<String> roles = new ArrayList<>();
        
        public Builder(String email) {
            this.email = email;
        }
        
        public Builder name(String name) {
            this.name = name;
            return this;
        }
        
        public Builder addRole(String role) {
            roles.add(role);
            return this;
        }
        
        public User build() {
            if (email == null || email.isEmpty()) {
                throw new IllegalArgumentException("Email is required");
            }
            return new User(this);
        }
    }
}

// Usage
User user = new User.Builder("user@example.com")
    .name("Alice")
    .addRole("admin")
    .build();
```

---

## Solved Problems

**Problem 1 (Easy)**: Implement thread-safe Lazy Singleton using double-checked locking.

**Problem 2 (Easy)**: Create a simple Document Factory Method that returns PDFDocument or WordDocument based on a string.

**Problem 3 (Medium)**: Build an Abstract Factory for database drivers supporting MySQL and PostgreSQL.

**Problem 4 (Medium)**: Implement Builder for a SQL query object (SELECT, WHERE, ORDER BY, LIMIT).

**Problem 5 (Hard)**: Implement Prototype with deep copy for a graph node structure with circular references.

---

## Recognition Guide

Use Creational patterns when:
- You need to control how objects are instantiated.
- Multiple related object families exist and must be kept consistent.
- Complex initialization needs to be hidden from clients.
- You want to make unit tests easier by swapping implementations.

Avoid when:
- A simple constructor and getter/setter suffice.
- The code introduces too many classes for a tiny problem.

---

## Comparison Tables

| Pattern | Main Question | Strength | Common Misuse |
|---|---|---|---|
| Singleton | One shared instance? | Centralized coordination | Hiding dependencies as global state |
| Factory Method | Which subtype should be created? | Subclass-controlled creation | Replacing a simple helper with too much indirection |
| Abstract Factory | Which product family should be used? | Consistent related objects | Overengineering when only one product varies |
| Builder | How do I assemble a complex object safely? | Readable construction and validation | Using it for tiny two-field objects |
| Prototype | How do I clone a template quickly? | Fast variation from existing objects | Shallow-copy bugs on mutable state |

---

## Design and Decision Making

Choose Singleton only when exactly one instance is necessary and global access is the simplest design. For most cases, dependency injection is clearer.

Choose Factory Method when subclasses naturally override creation logic. Choose Abstract Factory for multiple product families that must be swapped as units.

Use Builder when constructors become unreadable (3+ optional parameters). Use Prototype when copy operations dominate and you want to avoid class dependencies.

---

## Practical Applications

- Application configuration loaders and metrics registries often use Singleton-like ownership, but production code usually wraps them behind interfaces for testability.
- Cross-platform UI toolkits, cloud provider SDKs, and persistence adapters rely on factory-style creation to keep clients decoupled from concrete drivers.
- Immutable request objects, HTTP clients, and domain aggregates benefit from Builder when required and optional fields must be combined safely.
- Game engines, document editors, and simulation tools use Prototype when many objects start from a shared template and then diverge.

---

## Failure Modes and Trade-offs

Singleton creates hidden coupling and makes testing harder. Thread-safe variants add complexity. Factories introduce indirection that can confuse readers. Builders require extra classes. Prototype requires correct deep copy implementation.

---

## Condensed Notes

- Enum Singleton: simplest, thread-safe, serialization-safe.
- Factory Method: delegated creation; subclasses decide product type.
- Abstract Factory: families of objects; ensure consistency across variants.
- Builder: step-by-step construction; fluent API; immutability.
- Prototype: copy templates; deep copy mutable fields.

---

## Additional Problems

(5 Easy, 5 Medium, 5 Hard) — Write simple Singleton, Factory, Builder, and Prototype implementations for various domains (logging, configuration, database connection, HTTP client, email service).

---

## Key Questions

1. When is Singleton better than dependency injection?
2. What is double-checked locking and why is volatile needed?
3. How do Factory Method and Abstract Factory differ?
4. Why use Builder instead of constructor overloading?
5. What is the difference between shallow and deep copy?
6. How do you prevent Singleton reflection attacks?
7. When should you use Prototype over Builder?
8. How do you test code using Singleton?
9. What is the Factory Method's role in subclassing?
10. How do Decorators differ from Builders in extending behavior?

---

## Applied Project

Build a Game Object Factory system: define a GameObject interface, create factories for different enemy types (Goblin, Orc, Dragon), use Builder for complex spell objects with damage, duration, and effect stacking rules, and allow cloning of character templates.


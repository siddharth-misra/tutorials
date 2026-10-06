# 3: Design Thinking Foundations

## Introduction and Context

Software usually becomes painful not because the first version failed, but because later changes became expensive and risky. This chapter gives you the vocabulary and judgment to prevent that decay. Instead of only asking whether code works right now, you start asking whether responsibilities are clear, dependencies are controlled, and changes stay local instead of rippling through the system.

The core trade-off in design is not "pattern or no pattern." It is whether the structure makes future changes cheaper or more confusing. That is why this chapter focuses on principles, relationships, refactoring, and diagrams together: they are different ways of reasoning about the same problem, which is keeping code flexible without turning it into abstraction-heavy ceremony.

## Core Intuition and Mechanics

### The LEGO Analogy: How Design Thinking Works

Imagine building with LEGO bricks. A beginner just clicks bricks together to make something that looks roughly right. The structure might work in the short term, but it's brittle. If you need to change the color of one brick or add a new section, the whole thing falls apart.

An expert, however, understands:
- **Which types of bricks are available** and what they're best for
- **Which connections are strong or weak** and which to use for flexibility
- **How to build in modules** that can be easily changed, removed, or reused later

**Design thinking brings this expertise to software:**

- **Design Patterns** are like **expert LEGO techniques**. They are proven recipes for combining objects and classes to solve common structural problems. "Need to swap payment methods at runtime? Here's the standard way to do it."

- **SOLID Principles** are like the **physics of LEGO**. They are the fundamental laws that explain *why* certain structures are better than others. "Don't build a giant, rigid monolith that will shatter if you change one dependency at the bottom. Use dependency injection instead."

- **UML** is like the **blueprint language**. It lets you draw your LEGO design on paper to show someone else how the pieces connect before you start building. A picture is often clearer than a paragraph of explanation.

### How Design Mechanics Fit Together

- **Principles** such as SOLID, DRY, KISS, and YAGNI explain the forces that make code easier or harder to change.
- **Patterns** package recurring responses to those forces when a certain kind of collaboration keeps showing up.
- **Object relationships** such as composition, delegation, and inheritance determine how change and responsibility flow through the code.
- **UML diagrams** externalize that structure so you can reason about it without holding every dependency in your head.
- **Refactoring** is the controlled process of moving from a brittle design to a clearer one without changing externally visible behavior.

Seen together, these are not separate topics. They are one design loop: notice a force, model the structure, improve the relationships, and keep the system understandable as it evolves.

## Core Concepts and Subtopics

### Concept Cluster 1: What Are Design Patterns and Why Do They Matter?

**Topics in this cluster:**
- 3.1 What are design patterns; Why design patterns matter; Why patterns exist in algorithmic problem solving
- 3.2 History of design patterns; From recurring problems to reusable solutions; Pattern classifications

#### Definition

A **design pattern** is a general, reusable solution to a commonly occurring problem within a given context in software design.

Key insight: **It is not finished code.** A pattern is a *description* or *template* for how to solve a problem. It's like a recipe in a cookbook, not the actual meal. You adapt it to your specific situation.

#### Why Patterns Matter

**1. Shared Language**
Instead of describing a complex structure from scratch, you can just say, "I used a Singleton here," and other developers instantly understand:
- What the intent is
- What trade-offs you've accepted
- How the parts interact

This saves countless hours of explanation and reduces misunderstandings.

**2. Proven Solutions**
Patterns represent the collective wisdom of thousands of developers. When you use a pattern, you're not inventing a solution in isolation—you're leveraging decades of experience.

**3. Avoids Reinventing the Wheel (or the Square Wheel)**
Without patterns, you might invent a solution that seems clever but has hidden problems:
- It might work for your current use case but fail when requirements change
- It might create maintenance nightmares for future developers
- It might have performance pitfalls that aren't obvious

Using established patterns means these pitfalls have already been discovered and addressed by countless developers before you.

#### How Design Patterns Work: The Four Components

Every pattern has four key components:

1. **Problem**: What recurring problem does this pattern solve? What symptoms appear in the code that suggest you need this pattern?

2. **Context**: When should you apply this pattern? What preconditions must be true? What alternatives might you consider instead?

3. **Solution**: What are the key elements that make up the design? How do they relate to each other? What are the responsibilities of each piece? How do they collaborate?

4. **Consequences**: What are the benefits and drawbacks of using this pattern? What new problems might it introduce? What trade-offs are you accepting?

A good pattern provides guidance on all four components, not just the solution.

#### Why Patterns Exist in Algorithmic Problem Solving

When people hear "design patterns," they think of object-oriented design (classes, interfaces, inheritance). But the concept of patterns is universal.

In **algorithms**, we have patterns too:
- **Two Pointers**: A technique for traversing an array with two moving indices
- **Sliding Window**: A technique for solving problems on contiguous subarrays
- **BFS on a Grid**: A template for exploring connected cells in a 2D matrix
- **DFS with Backtracking**: A template for exploring all possible combinations

These are patterns because they:
- Solve a *class* of problems (not just one specific problem)
- Provide a *starting structure* for your thinking
- Come with known *trade-offs* (time complexity, space complexity, etc.)
- Have a *consistent vocabulary* that developers recognize

Just as you'd recognize a "Factory Pattern" in OO code, you recognize a "Sliding Window" algorithm in interview problems. Both are patterns.

#### History: From Individual Solutions to Universal Patterns

The concept of design patterns in software was popularized by four software architects: **Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides**. They are collectively known as the **"Gang of Four" (GoF)**.

In 1994, they published the seminal book: *Design Patterns: Elements of Reusable Object-Oriented Software*.

**The Big Idea**: Instead of each developer inventing their own solutions, let's document the solutions that the best developers have discovered through experience. Let's name them, categorize them, and teach them to others.

This book cataloged **23 fundamental patterns**. More than 30 years later, these patterns are still the foundation of software architecture.

#### Pattern Classifications

All 23 GoF patterns fit into three broad categories:

**1. Creational Patterns** (4 patterns)
- **Purpose**: Control object creation mechanisms
- **Goal**: Create objects in a manner suitable to the situation
- **Common patterns**: Singleton, Factory, Builder, Prototype
- **Why they matter**: As systems get complex, controlling *how* objects are created becomes as important as what they do

**2. Structural Patterns** (7 patterns)
- **Purpose**: Ease design by identifying simple ways to realize relationships between entities
- **Goal**: Combine objects into larger structures while keeping these structures flexible and efficient
- **Common patterns**: Adapter, Facade, Composite, Decorator, Proxy
- **Why they matter**: They show you how to compose simple objects into complex ones while maintaining clarity

**3. Behavioral Patterns** (12 patterns)
- **Purpose**: Identify common communication patterns between objects
- **Goal**: Implement these communication patterns in a flexible, maintainable way
- **Common patterns**: Strategy, Observer, Command, State, Template Method, Chain of Responsibility
- **Why they matter**: They help you manage the flow of logic and responsibility through your system

#### Interview Insight: What Interviewers Really Want to Hear

When an interviewer asks, "How would you design X?", they are **not** looking for:
- A single class with 1000 lines of code
- A solution that only works for their specific example
- Code you can type in 10 minutes

They **are** looking for:
- Evidence that you think in terms of **components** and **responsibilities**
- Understanding of **trade-offs** and when to apply different approaches
- Ability to **communicate** your design clearly
- Knowledge of how to **extend** the system without breaking existing code

Using the language of design patterns is the most effective way to demonstrate all of this. Saying "I'd use a Factory to create objects in a way that's decoupled from the client" tells an interviewer you understand principles, not just syntax.

---

### Concept Cluster 2: The Principles of Good Design

**Topics in this cluster:**
- 3.3 SOLID principles; DRY principle; KISS principle; YAGNI principle

#### What Are Design Principles?

**Principles** are different from **patterns**. 

- A **pattern** is a concrete solution template: "Use the Strategy pattern for this."
- A **principle** is a high-level guideline: "Depend on abstractions, not concrete implementations."

Principles are more fundamental. They guide you toward good design decisions, and many patterns exist *because* they follow these principles.

#### SOLID: The Five Core Principles

SOLID is an acronym for five principles that form the foundation of object-oriented design. They were popularized by Robert C. Martin (often called "Uncle Bob").

---

##### S — Single Responsibility Principle (SRP)

**Definition**: A class should have one reason to change. In other words, a class should have only **one job** or **one area of responsibility**.

**The Intuition**:
Imagine a chef who is also the cashier, also does the dishes, and also handles inventory. When the restaurant gets busy, everything falls apart. When one responsibility changes (new inventory system), the chef has to stop cooking.

A **specialized chef** who only cooks is much more effective.

**Bad Example**:
```java
// VIOLATES SRP: This class has THREE reasons to change:
// 1) If the Employee calculation logic changes
// 2) If the database schema changes
// 3) If the report format changes

public class Employee {
    private String name;
    private double salary;
    
    // Responsibility 1: Calculate compensation
    public double calculatePay() {
        return salary * 1.2; // With bonuses
    }
    
    // Responsibility 2: Persist to database
    public void saveToDatabase() {
        System.out.println("Saving to database...");
        // Database code here
    }
    
    // Responsibility 3: Generate reports
    public String generateReportXML() {
        return "<employee><name>" + name + "</name></employee>";
    }
}
```

**Good Example**:
```java
// FOLLOWS SRP: Each class has ONE reason to change

// Responsibility 1: Encapsulate employee data and business logic
public class Employee {
    private String name;
    private double salary;
    
    public double calculatePay() {
        return salary * 1.2;
    }
    
    public String getName() { return name; }
    public double getSalary() { return salary; }
}

// Responsibility 2: Handle persistence
public class EmployeeRepository {
    public void save(Employee e) {
        System.out.println("Saving " + e.getName() + " to database...");
        // Database code here
    }
}

// Responsibility 3: Handle reporting
public class EmployeeReportGenerator {
    public String generateReportXML(Employee e) {
        return "<employee><name>" + e.getName() + "</name></employee>";
    }
}
```

**Why It Matters**:
- **Easier to test**: You can test `calculatePay()` without needing a database
- **Easier to maintain**: Changes to the report format don't affect the calculation logic
- **Easier to reuse**: Another part of the system can use the `Employee` class without needing all three responsibilities

---

##### O — Open/Closed Principle (OCP)

**Definition**: Software entities should be **open for extension** but **closed for modification**.

**The Intuition**:
Imagine an electrical outlet in your home. The outlet's design is "closed" (you can't change it). But it's "open for extension" because you can plug in many different devices—a lamp, a charger, a vacuum.

Good design is like that outlet: **you can add new functionality without changing the core structure**.

**Bad Example**:
```java
// VIOLATES OCP: Adding a new payment method requires modifying this class

public class PaymentProcessor {
    public void processPayment(String method, double amount) {
        if (method.equals("credit")) {
            System.out.println("Processing credit card: $" + amount);
        } else if (method.equals("paypal")) {
            System.out.println("Processing PayPal: $" + amount);
        }
        // If we add "bankTransfer", we have to modify this class!
    }
}
```

**Good Example**:
```java
// FOLLOWS OCP: Adding a new payment method just means creating a new class

public interface PaymentStrategy {
    void pay(double amount);
}

public class CreditCardStrategy implements PaymentStrategy {
    public void pay(double amount) {
        System.out.println("Processing credit card: $" + amount);
    }
}

public class PayPalStrategy implements PaymentStrategy {
    public void pay(double amount) {
        System.out.println("Processing PayPal: $" + amount);
    }
}

public class PaymentProcessor {
    private PaymentStrategy strategy;
    
    public void setStrategy(PaymentStrategy strategy) {
        this.strategy = strategy;
    }
    
    public void processPayment(double amount) {
        strategy.pay(amount);
    }
}

// To add BankTransfer, we just create a new class. No modifications needed!
public class BankTransferStrategy implements PaymentStrategy {
    public void pay(double amount) {
        System.out.println("Processing bank transfer: $" + amount);
    }
}
```

**Why It Matters**:
- **Safer to extend**: You're adding code, not modifying existing code, so you're less likely to introduce bugs
- **Reduces coupling**: New payment strategies don't need to know about `PaymentProcessor`
- **Scales to many variations**: If you need 20 payment methods, you don't need a giant `if/else` chain

---

##### L — Liskov Substitution Principle (LSP)

**Definition**: Subtypes must be substitutable for their base types. If a function expects a `Bird`, it should work correctly with any subclass of `Bird` without knowing which specific type it is.

**The Intuition**:
If you write code that expects a `Vehicle`, you should be able to pass in a `Car`, a `Truck`, or a `Motorcycle`, and your code should work without special-casing each type.

The principle is named after **Barbara Liskov**, a computer scientist who formalized this concept.

**Bad Example (A Classic Mistake)**:
```java
// VIOLATES LSP: A Penguin is-a Bird, but it can't fly!

public class Bird {
    public void fly() {
        System.out.println("Bird is flying");
    }
}

public class Penguin extends Bird {
    @Override
    public void fly() {
        throw new UnsupportedOperationException("Penguins can't fly!");
    }
}

// Client code that expects a Bird:
public class Zoo {
    public void makeBirdsFly(Bird[] birds) {
        for (Bird bird : birds) {
            bird.fly(); // This throws an exception for Penguins!
            // The contract of Bird is violated.
        }
    }
}
```

**Good Example**:
```java
// FOLLOWS LSP: We model the hierarchy correctly

public interface Bird {
    void move();
}

public class FlyingBird implements Bird {
    public void move() {
        System.out.println("Flying");
    }
}

public class Penguin implements Bird {
    public void move() {
        System.out.println("Swimming");
    }
}

// Client code doesn't make assumptions about HOW a bird moves
public class Zoo {
    public void moveBirds(Bird[] birds) {
        for (Bird bird : birds) {
            bird.move(); // Works for any Bird, including Penguin
        }
    }
}
```

**Why It Matters**:
- **Prevents surprises**: You can use a subclass anywhere the parent type is expected without nasty surprises
- **Enables polymorphism**: Polymorphism only works well when the contract is honestly fulfilled
- **Catches design errors**: If you're violating LSP, it often means your inheritance hierarchy is wrong

---

##### I — Interface Segregation Principle (ISP)

**Definition**: Clients should not be forced to depend on interfaces they do not use. It's better to have many small, specific interfaces than one large, general-purpose interface.

**The Intuition**:
Imagine a universal remote that controls TVs, air conditioners, and microwaves. Your TV client only cares about power and volume, but it's forced to know about features for the air conditioner and microwave. That's bad design.

Better: Create separate, focused interfaces. A **TV Remote** interface has power and volume. An **AC Remote** interface has temperature controls.

**Bad Example**:
```java
// VIOLATES ISP: Worker interface has too much

public interface Worker {
    void work();
    void eat();
    void sleep();
    void manage();
}

public class HumanWorker implements Worker {
    public void work() { /* ... */ }
    public void eat() { /* ... */ }
    public void sleep() { /* ... */ }
    public void manage() { /* not all humans are managers! */ }
}

public class Robot implements Worker {
    public void work() { /* ... */ }
    public void eat() { /* robots don't eat */ throw new UnsupportedOperationException(); }
    public void sleep() { /* robots don't sleep */ throw new UnsupportedOperationException(); }
    public void manage() { /* not all robots manage */ throw new UnsupportedOperationException(); }
}
```

**Good Example**:
```java
// FOLLOWS ISP: Focused, segregated interfaces

public interface Workable {
    void work();
}

public interface Eatable {
    void eat();
}

public interface Sleepable {
    void sleep();
}

public interface Manageable {
    void manage();
}

public class HumanWorker implements Workable, Eatable, Sleepable {
    public void work() { /* ... */ }
    public void eat() { /* ... */ }
    public void sleep() { /* ... */ }
}

public class Manager implements Workable, Manageable {
    public void work() { /* ... */ }
    public void manage() { /* ... */ }
}

public class Robot implements Workable {
    public void work() { /* ... */ }
}
```

**Why It Matters**:
- **Reduces coupling**: Classes only depend on what they actually use
- **More flexible**: You can implement just the interfaces you need
- **Clearer contracts**: Each interface has a clear, single purpose

---

##### D — Dependency Inversion Principle (DIP)

**Definition**: High-level modules should not depend on low-level modules. **Both should depend on abstractions**. Abstractions should not depend on details; details should depend on abstractions.

**The Intuition**:
Imagine a light bulb connected directly to a generator with a hard-wired cable. If you want to use a different power source, you have to rewire everything. That's bad.

Better: Use a **socket** (the abstraction). The bulb plugs into the socket; the generator plugs into the socket. You can swap the generator without touching the bulb.

**Bad Example**:
```java
// VIOLATES DIP: High-level PaymentProcessor depends on low-level CreditCard

public class CreditCard {
    public void charge(double amount) {
        System.out.println("Charging credit card: $" + amount);
    }
}

public class PaymentProcessor {
    private CreditCard creditCard; // Directly depends on concrete class!
    
    public PaymentProcessor(CreditCard creditCard) {
        this.creditCard = creditCard;
    }
    
    public void processPayment(double amount) {
        creditCard.charge(amount);
    }
}

// If we want to use PayPal, we have to modify PaymentProcessor!
```

**Good Example**:
```java
// FOLLOWS DIP: Both depend on the abstraction

public interface PaymentMethod {
    void pay(double amount);
}

public class CreditCard implements PaymentMethod {
    public void pay(double amount) {
        System.out.println("Charging credit card: $" + amount);
    }
}

public class PayPal implements PaymentMethod {
    public void pay(double amount) {
        System.out.println("Processing PayPal: $" + amount);
    }
}

public class PaymentProcessor {
    private PaymentMethod paymentMethod; // Depends on abstraction!
    
    public PaymentProcessor(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
    
    public void processPayment(double amount) {
        paymentMethod.pay(amount);
    }
}

// New payment methods are just new implementations. PaymentProcessor never changes.
```

**Why It Matters**:
- **Maximum flexibility**: You can swap implementations without changing high-level code
- **Testability**: You can inject a fake implementation for testing
- **Loose coupling**: Changes to low-level details don't ripple up to high-level logic

---

#### Beyond SOLID: Three More Principles

While SOLID principles are the core, three other principles are equally important:

---

##### DRY — Don't Repeat Yourself

**Definition**: Every piece of knowledge must have a single, unambiguous, authoritative representation within a system.

**In Plain English**: Don't copy-paste code. Each piece of logic should exist in exactly one place.

**Why It Matters**:
- **Bug fixes propagate**: Fix a bug in one place, and it's fixed everywhere that code is used
- **Changes are easier**: Change the logic once; it's changed everywhere
- **Less to maintain**: Fewer lines of code means fewer lines where bugs can hide

**Example**:
```java
// BAD: Same validation logic repeated in three places
public class RegistrationForm {
    public boolean validateEmail(String email) {
        return email.contains("@");
    }
}

public class LoginForm {
    public boolean validateEmail(String email) {
        return email.contains("@");
    }
}

public class ProfileForm {
    public boolean validateEmail(String email) {
        return email.contains("@");
    }
}

// GOOD: Single source of truth
public class EmailValidator {
    public static boolean validate(String email) {
        return email.contains("@");
    }
}

public class RegistrationForm {
    public boolean validateEmail(String email) {
        return EmailValidator.validate(email);
    }
}

public class LoginForm {
    public boolean validateEmail(String email) {
        return EmailValidator.validate(email);
    }
}

public class ProfileForm {
    public boolean validateEmail(String email) {
        return EmailValidator.validate(email);
    }
}
```

---

##### KISS — Keep It Simple, Stupid

**Definition**: Most systems work best if they are kept simple rather than made complicated. Simplicity should be a key goal in design, and unnecessary complexity should be avoided.

**Why It Matters**:
- **Easier to understand**: Future developers (including you in 6 months) can understand the code faster
- **Fewer bugs**: Less code complexity means fewer places for bugs to hide
- **Faster development**: Simple code is quicker to write and test

**Example**:
```java
// COMPLEX (and unnecessary)
public int getValue() {
    return Optional.ofNullable(obj)
        .flatMap(o -> Optional.ofNullable(o.getField()))
        .map(f -> f.getValue())
        .orElseGet(() -> {
            try {
                return computeDefault();
            } catch (Exception e) {
                return fallback();
            }
        });
}

// SIMPLE and clear
public int getValue() {
    if (obj != null && obj.getField() != null) {
        return obj.getField().getValue();
    }
    try {
        return computeDefault();
    } catch (Exception e) {
        return fallback();
    }
}
```

The second version is more readable and achieves the same result.

---

##### YAGNI — You Ain't Gonna Need It

**Definition**: Always implement things when you actually need them, never when you just foresee that you might need them. Avoid "speculative development."

**Why It Matters**:
- **Reduces bloat**: Features that aren't needed add complexity without value
- **Focuses effort**: You spend time on what actually matters now, not imagined future needs
- **Easier to refactor**: Less code means fewer places to update when requirements change

**Example**:
```java
// BAD: Anticipating features that might never be needed
public class User {
    private String name;
    private String email;
    private List<String> allPreviousEmails; // "Users might change email"
    private List<Date> loginHistory; // "We might need analytics someday"
    private List<String> preferredLanguages; // "Users might be multilingual"
    private Map<String, Object> metadata; // "Just in case"
}

// GOOD: Implement what you actually need right now
public class User {
    private String name;
    private String email;
}

// If you later need to track email changes, add it then.
```

---

#### Why These Principles Matter: The Big Picture

Following SOLID, DRY, KISS, and YAGNI leads to systems that are:

| Benefit | How It's Achieved |
|---------|-------------------|
| **Easier to understand** | Each part has a clear, single responsibility (SRP). No surprises. |
| **Easier to maintain** | Changes are localized (DRY). You're not hunting through 10 files for the bug. |
| **Easier to extend** | New features can be added without changing existing code (OCP). |
| **More robust** | Components are interchangeable and behave as expected (LSP). |
| **More flexible** | Dependencies are managed through abstractions (DIP). You can swap implementations. |
| **Less buggy** | Less code duplication means fewer places for bugs to hide (DRY). |
| **Simpler to reason about** | The code isn't over-engineered or speculative (KISS, YAGNI). |

---

#### Interview Insight: How to Talk About Principles

When you're in an interview or code review and you want to explain a design decision:

**✗ Weak**: "I did this because it's cleaner."

**✓ Strong**: "I did this to follow the Open/Closed Principle. By depending on the `PaymentStrategy` interface rather than concrete classes, I can add new payment methods without modifying existing code."

**✓ Strong**: "I extracted this into a separate class to follow the Single Responsibility Principle. Now the `User` class only manages user data, and `UserValidator` handles validation. This makes both easier to test."

Naming the principle and explaining the benefit shows you understand *why* you made the choice, not just that you followed a pattern.

---

### Concept Cluster 3: Object Relationships and Composition

**Topics in this cluster:**
- 3.4 Composition over inheritance; Coupling and cohesion; Inheritance, composition, and aggregation
- 3.5 Association and delegation; Encapsulation, abstraction, and polymorphism; Immutability and dependency management

#### Understanding Object Relationships

Objects in a system relate to each other in specific ways. Understanding these relationships is crucial to designing flexible systems.

#### The Four Key Relationships

---

##### 1. Inheritance ("Is-A")

**Definition**: A subclass derives from a superclass, inheriting its public and protected members.

**Symbol**: `Dog` **is-a** `Animal`

**Real-World Example**: A penguin is a bird. A car is a vehicle.

**Simple Code Example**:
```java
public class Animal {
    public void eat() {
        System.out.println("Animal is eating");
    }
}

public class Dog extends Animal {
    @Override
    public void eat() {
        System.out.println("Dog is eating dog food");
    }
    
    public void bark() {
        System.out.println("Woof!");
    }
}

// Usage
Animal animal = new Dog();
animal.eat(); // Prints: Dog is eating dog food
```

**When to Use**:
- When a true hierarchical relationship exists ("IS-A")
- When you want to share common code (but see Composition as an alternative!)

**When NOT to Use**:
- When the relationship is temporary or contextual
- When a class needs multiple "is-a" relationships (Java doesn't support multiple inheritance)
- When you're just trying to reuse code (use composition instead)

---

##### 2. Composition ("Has-A", Strong Ownership)

**Definition**: An object is built from other objects. The composed objects are "owned" by the container, and their lifecycles are tied together.

**Symbol**: `Car` **has-a** `Engine`. If the `Car` is destroyed, the `Engine` is too (typically).

**Real-World Example**: A car has an engine. If the car is junked, the engine goes with it.

**Simple Code Example**:
```java
public class Engine {
    public void start() {
        System.out.println("Engine started");
    }
}

public class Car {
    private Engine engine; // Car HAS-A Engine
    
    public Car() {
        this.engine = new Engine(); // Car owns the Engine
    }
    
    public void drive() {
        engine.start();
        System.out.println("Car is driving");
    }
}

// Usage
Car myCar = new Car();
myCar.drive();
// When myCar is destroyed, the engine is also destroyed (garbage collected)
```

**When to Use**:
- When one object needs to use another object to function
- When the contained object's lifetime is tied to the container
- When you want to avoid the rigidity of inheritance

**The "Composition Over Inheritance" Mantra**:
Inheritance is tempting but often creates brittle designs. Composition is more flexible.

---

##### 3. Aggregation ("Has-A", Weak Ownership)

**Definition**: A weaker form of composition. An object uses another, independent object, but the contained object can exist independently.

**Symbol**: `Department` **has-a** `Professor`. If the `Department` is disbanded, the `Professors` still exist and can work elsewhere.

**Real-World Example**: A university department has professors. If the department closes, the professors still exist and can work at other universities.

**Simple Code Example**:
```java
public class Professor {
    private String name;
    
    public Professor(String name) {
        this.name = name;
    }
    
    public String getName() {
        return name;
    }
}

public class Department {
    private String name;
    private List<Professor> professors; // Department HAS-A list of Professors
    
    public Department(String name) {
        this.name = name;
        this.professors = new ArrayList<>();
    }
    
    public void addProfessor(Professor prof) {
        professors.add(prof); // Professors are added, not created by the Department
    }
    
    public void printProfessors() {
        for (Professor prof : professors) {
            System.out.println(prof.getName());
        }
    }
}

// Usage
Professor alice = new Professor("Alice");
Professor bob = new Professor("Bob");

Department cs = new Department("Computer Science");
cs.addProfessor(alice);
cs.addProfessor(bob);

// If the CS department is deleted, Alice and Bob still exist
Department math = new Department("Mathematics");
math.addProfessor(alice); // Alice can teach in multiple departments
```

**When to Use**:
- When objects have independent lifecycles
- When the same object can be "part of" multiple containers
- When there's a "uses but doesn't own" relationship

---

##### 4. Association (General Relationship)

**Definition**: A general relationship between two classes. The relationship is looser than composition or aggregation.

**Symbol**: `Student` is **associated with** `Course`

**Real-World Example**: A student takes a course. The relationship is real but less intimate than "owns" or "uses".

**Simple Code Example**:
```java
public class Student {
    private String name;
    private List<Course> courses;
    
    public void enrollInCourse(Course course) {
        courses.add(course);
    }
}

public class Course {
    private String name;
    private List<Student> students;
    
    public void addStudent(Student student) {
        students.add(student);
    }
}

// Usage: Both classes know about each other, but neither owns the other
```

**When to Use**:
- When objects interact or know about each other
- When the relationship is not a "has-a" or "is-a"
- When classes are peers rather than hierarchical

---

#### Delegation: Making Composition Work

**Definition**: An object forwards a request to another object (its delegate) to handle.

Delegation is the **mechanism** that makes composition powerful. Instead of inheriting behavior, an object asks another object to perform a behavior.

**Example: Without Delegation (Inheritance)**:
```java
public class Car {
    public void start() {
        // Car directly implements starting logic
        System.out.println("Car starts");
    }
}

public class Truck extends Car {
    // Truck inherits start() from Car
    // If the start logic changes, both Car and Truck are affected
}
```

**Example: With Delegation (Composition)**:
```java
public interface Engine {
    void start();
}

public class GasEngine implements Engine {
    public void start() {
        System.out.println("Gas engine starts");
    }
}

public class Car {
    private Engine engine; // Delegation: Car delegates starting to its engine
    
    public void start() {
        engine.start(); // Asking the delegate to do the work
    }
}

// Later, if we need an ElectricEngine, the Car class doesn't change
public class ElectricEngine implements Engine {
    public void start() {
        System.out.println("Electric engine starts silently");
    }
}

Car gasCar = new Car(new GasEngine());
Car electricCar = new Car(new ElectricEngine());
```

**Why Delegation Matters**:
- **Runtime flexibility**: You can swap the delegate at runtime
- **No rigid hierarchies**: You're not locked into a class hierarchy
- **Cleaner separation of concerns**: Each object focuses on its job

---

#### Coupling and Cohesion: The Metrics of Good Design

**Coupling**: The degree to which components depend on each other. **Low coupling is good.**

**Cohesion**: The degree to which elements within a component belong together. **High cohesion is good.**

**Simple Analogy**:
- **Low Coupling**: A car doesn't need to understand how to make steel; it just uses steel wheels. The car and steel factory are loosely coupled.
- **High Cohesion**: All parts of a car's engine work together for a single purpose: generating power. They're tightly bound and belong together.

**Bad Design (High Coupling, Low Cohesion)**:
```java
public class OrderProcessor {
    // This class does EVERYTHING—low cohesion
    public void processOrder(Order order) {
        // Validate the order
        if (order.getTotal() < 0) throw new Exception("Invalid");
        
        // Apply discount
        double discount = order.getTotal() * 0.1;
        
        // Calculate tax
        double tax = (order.getTotal() - discount) * 0.08;
        
        // Charge the credit card—high coupling to CreditCard details
        CreditCard card = order.getCreditCard();
        if (!card.isValid()) throw new Exception("Invalid card");
        card.charge(order.getTotal() - discount + tax);
        
        // Send email
        Email email = new Email();
        email.setTo(order.getCustomer().getEmail());
        email.send("Order processed");
        
        // Log to database
        Database db = new Database();
        db.insert("orders", order);
    }
}
```

**Good Design (Low Coupling, High Cohesion)**:
```java
// Each class has ONE job (high cohesion)
public class OrderValidator {
    public void validate(Order order) { /* ... */ }
}

public class PricingService {
    public double calculateTotal(Order order) { /* ... */ }
}

public class PaymentProcessor {
    private PaymentMethod paymentMethod;
    public void charge(double amount) { /* ... */ }
}

public class NotificationService {
    public void notifyOrderProcessed(Order order) { /* ... */ }
}

// Main processor is simple (low coupling—depends on abstractions, not details)
public class OrderProcessor {
    private OrderValidator validator;
    private PricingService pricing;
    private PaymentProcessor payment;
    private NotificationService notification;
    
    public void processOrder(Order order) {
        validator.validate(order);
        double total = pricing.calculateTotal(order);
        payment.charge(total);
        notification.notifyOrderProcessed(order);
    }
}
```

---

#### Encapsulation, Abstraction, and Polymorphism

These three concepts are the pillars of OOP and make good design possible.

---

##### Encapsulation: Hide the Details

**Definition**: Bundling data (state) and methods (behavior) into a single unit (a class) and hiding the internal details from the outside world.

**Rule of Thumb**: Make fields **private** and provide **public methods** to interact with them.

**Example**:
```java
// BAD: No encapsulation
public class BankAccount {
    public double balance; // Anyone can access and modify!
}

account.balance = -1000000; // Nothing stops this

// GOOD: Encapsulation
public class BankAccount {
    private double balance; // Hidden
    
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount; // Only valid operations allowed
        }
    }
    
    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount; // Validation
        }
    }
    
    public double getBalance() {
        return balance;
    }
}
```

**Why It Matters**:
- **Protects invariants**: You ensure that `balance` is never negative
- **Allows changes**: You can change the internal representation without affecting clients
- **Enforces business rules**: Withdrawals are validated

---

##### Abstraction: Hide Complexity

**Definition**: Showing only the essential features of an object while hiding the complex implementation details.

**Example**:
```java
// Abstraction through an interface
public interface PaymentMethod {
    void pay(double amount); // Simple contract
}

// The implementation details are hidden
public class CreditCardPayment implements PaymentMethod {
    public void pay(double amount) {
        // Complex logic: encryption, API calls, error handling, retry logic
        // But the client just sees: paymentMethod.pay(100);
    }
}
```

**Why It Matters**:
- **Reduces cognitive load**: You don't need to understand all the details
- **Allows specialization**: Experts can handle complex implementations; others can use the simple interface
- **Supports change**: Implementation details can change without affecting the interface

---

##### Polymorphism: One Interface, Many Forms

**Definition**: The ability of objects to take on many forms. Usually, a parent class reference can refer to objects of different subclasses.

**Example**:
```java
public interface Shape {
    double getArea();
}

public class Circle implements Shape {
    private double radius;
    public double getArea() { return Math.PI * radius * radius; }
}

public class Rectangle implements Shape {
    private double width, height;
    public double getArea() { return width * height; }
}

// Polymorphism in action:
List<Shape> shapes = new ArrayList<>();
shapes.add(new Circle(5));
shapes.add(new Rectangle(4, 6));

double totalArea = 0;
for (Shape shape : shapes) {
    totalArea += shape.getArea(); // Same method call, different behavior!
}
```

**Why It Matters**:
- **Write generic code**: You handle all types uniformly without special-casing each one
- **Extend without modification**: Add new shape types without changing the loop
- **Cleaner architecture**: High-level code doesn't need to know all low-level types

---

#### Immutability and Dependency Management

---

##### Immutability: Frozen State

**Definition**: An object's state cannot be modified after it is created.

**Classic Example**: `String` in Java is immutable.

```java
// Immutable class
public final class ImmutableUser {
    private final String name;
    private final int age;
    
    public ImmutableUser(String name, int age) {
        this.name = name;
        this.age = age;
        // No setters!
    }
    
    public String getName() { return name; }
    public int getAge() { return age; }
}

// Once created, it cannot change
ImmutableUser user = new ImmutableUser("Alice", 25);
// user.name = "Bob"; // Compile error!
```

**Why It Matters**:
- **Thread safety**: Immutable objects are inherently thread-safe
- **Predictability**: An immutable object's state never changes, reducing bugs
- **Easy to reason about**: You know the state of the object at any point

---

##### Dependency Management: Control What Objects Know About

**Definition**: Managing the dependencies (other classes, services, resources) that a component relies on.

**Bad Approach (Direct Dependency)**:
```java
public class ReportGenerator {
    private Database db = new Database(); // Hard-wired dependency
    
    public void generate() {
        Data data = db.query("SELECT ...");
        // Generate report
    }
}

// Problems:
// 1) Can't test without a real database
// 2) Can't swap the database for a different one
```

**Good Approach (Dependency Injection)**:
```java
public interface DataSource {
    Data query(String sql);
}

public class ReportGenerator {
    private DataSource dataSource; // Depend on abstraction
    
    public ReportGenerator(DataSource dataSource) {
        this.dataSource = dataSource; // Dependency is "injected"
    }
    
    public void generate() {
        Data data = dataSource.query("SELECT ...");
        // Generate report
    }
}

// Usage
ReportGenerator generator = new ReportGenerator(new RealDatabase());

// In tests
ReportGenerator testGenerator = new ReportGenerator(new FakeDatabase());
```

**Why It Matters**:
- **Testability**: You can inject fake implementations for testing
- **Flexibility**: Swap implementations without changing the code
- **Loose coupling**: High-level code doesn't depend on low-level details

---

### Concept Cluster 4: Refactoring and Code Smells

**Topics in this cluster:**
- 3.6 Refactoring basics; Code smell detection; Replace conditionals; Extract abstraction; Introduce interfaces

#### What Is Refactoring?

**Definition**: Refactoring is the process of restructuring existing computer code—changing its internal structure—**without changing its external behavior**.

**Key Insight**: Refactoring preserves functionality while improving nonfunctional attributes like:
- Readability
- Maintainability
- Testability
- Flexibility
- Performance

**Why It's Important**:
Code is read far more often than it's written. A piece of code might be written in 1 hour but read hundreds of times over its lifetime. Refactoring pays dividends by making the code easier to understand and maintain.

#### Code Smells: Red Flags That Suggest Refactoring

A **code smell** is a surface indication that usually points to a deeper problem. Smells don't always indicate a bug, but they're a signal that something might be wrong.

---

##### Common Code Smells

**1. Long Method**
- **Smell**: A method is hundreds of lines long
- **Problem**: Hard to understand, hard to test, likely doing multiple things
- **Fix**: Extract Method—pull related code into smaller methods

**2. Large Class**
- **Smell**: A class has too many responsibilities
- **Problem**: Hard to understand, hard to test, violates SRP
- **Fix**: Extract Class—create new classes to handle some responsibilities

**3. Long Parameter List**
- **Smell**: A method takes 5+ parameters
- **Problem**: Hard to call correctly, often indicates coupling to multiple concerns
- **Fix**: Introduce Parameter Object—group related parameters into a single object

**4. Duplicate Code**
- **Smell**: The same logic appears in multiple places
- **Problem**: Violates DRY. Bugs fixed in one place aren't fixed elsewhere
- **Fix**: Extract Method—create a shared method and call it from both places

**5. Feature Envy**
- **Smell**: A method is more interested in another class than its own
- **Problem**: Indicates poor organization and tight coupling
- **Example**:
```java
// Employee is envying the Department
public void giveBonus(Employee emp, Department dept) {
    double bonus = dept.getSalary() * 0.1; // Too much interest in dept!
    emp.setSalary(emp.getSalary() + bonus);
}

// Better: Give the method to Department
public void giveBonus(Employee emp) {
    double bonus = getSalary(emp) * 0.1;
    emp.setSalary(emp.getSalary() + bonus);
}
```

**6. Switch Statements (Polymorph Smell)**
- **Smell**: A `switch` statement that checks an object's type
- **Problem**: Violates OCP. Adding a new type means modifying the switch statement
- **Fix**: Replace Conditional with Polymorphism—create subclasses or implementations instead

**7. Data Class**
- **Smell**: A class that is just getters and setters, no real behavior
- **Problem**: Indicates logic is elsewhere (feature envy), violates proper encapsulation
- **Fix**: Move the logic that uses this data into the class itself

---

#### Refactoring Techniques: Tools for Improvement

**1. Extract Method**

**When**: You have a fragment of code that would be clearer as its own method

**How**:
```java
// BEFORE
public void processOrder(Order order) {
    double total = order.getItems().stream()
        .mapToDouble(item -> item.getPrice() * item.getQuantity())
        .sum();
    double discount = total > 100 ? total * 0.1 : 0;
    double tax = (total - discount) * 0.08;
    System.out.println("Order total: $" + (total - discount + tax));
}

// AFTER
public void processOrder(Order order) {
    double total = calculateSubtotal(order);
    double discount = calculateDiscount(total);
    double tax = calculateTax(total, discount);
    printOrderTotal(total, discount, tax);
}

private double calculateSubtotal(Order order) {
    return order.getItems().stream()
        .mapToDouble(item -> item.getPrice() * item.getQuantity())
        .sum();
}

private double calculateDiscount(double total) {
    return total > 100 ? total * 0.1 : 0;
}

private double calculateTax(double total, double discount) {
    return (total - discount) * 0.08;
}

private void printOrderTotal(double total, double discount, double tax) {
    System.out.println("Order total: $" + (total - discount + tax));
}
```

**Benefits**: Easier to understand, test, and reuse each piece

---

**2. Replace Conditional with Polymorphism**

**When**: You have a `switch` or `if/else` chain that checks an object's type

**How**:
```java
// BEFORE (Violates OCP)
public double getDamage() {
    switch (playerType) {
        case KNIGHT: return 15;
        case WIZARD: return 20;
        case ARCHER: return 12;
    }
}

// AFTER (Follows OCP)
public interface PlayerType {
    double getDamage();
}

public class Knight implements PlayerType {
    public double getDamage() { return 15; }
}

public class Wizard implements PlayerType {
    public double getDamage() { return 20; }
}

public class Archer implements PlayerType {
    public double getDamage() { return 12; }
}

public class Player {
    private PlayerType type;
    public double getDamage() {
        return type.getDamage();
    }
}
```

**Benefits**: New types can be added without modifying existing code; follows OCP

---

**3. Extract Class**

**When**: A class has too many responsibilities

**How**:
```java
// BEFORE (Large class with multiple responsibilities)
public class User {
    private String name;
    private String email;
    
    public void calculatePay() { /* ... */ }
    public void saveToDB() { /* ... */ }
    public String generateReport() { /* ... */ }
}

// AFTER (Responsibilities separated)
public class User {
    private String name;
    private String email;
}

public class PaymentCalculator {
    public double calculatePay(User user) { /* ... */ }
}

public class UserRepository {
    public void save(User user) { /* ... */ }
}

public class UserReportGenerator {
    public String generate(User user) { /* ... */ }
}
```

**Benefits**: Each class is simpler, follows SRP, easier to test

---

**4. Introduce Interface**

**When**: You want to decouple a client from a specific implementation

**How**:
```java
// BEFORE (Direct dependency on concrete class)
public class PaymentProcessor {
    private CreditCardProcessor processor = new CreditCardProcessor();
    
    public void process(double amount) {
        processor.process(amount);
    }
}

// AFTER (Depends on abstraction)
public interface PaymentGateway {
    void process(double amount);
}

public class CreditCardProcessor implements PaymentGateway {
    public void process(double amount) { /* ... */ }
}

public class PaymentProcessor {
    private PaymentGateway gateway;
    
    public PaymentProcessor(PaymentGateway gateway) {
        this.gateway = gateway;
    }
    
    public void process(double amount) {
        gateway.process(amount);
    }
}
```

**Benefits**: Easy to swap implementations; can inject fake for testing

---

### Concept Cluster 5: The Unified Modeling Language (UML)

**Topics in this cluster:**
- 3.7 Class diagrams; Sequence diagrams; Object diagrams
- 3.8 State diagrams; Activity diagrams; Package diagrams

#### What Is UML?

**UML** (Unified Modeling Language) is a standardized, visual language for specifying, visualizing, constructing, and documenting the artifacts of software systems.

Think of UML as the "blueprint language" for software—just like architects use blueprints to show how a building will be structured before construction begins.

#### Why Learn UML?

1. **Communication**: A diagram often communicates a design idea faster and clearer than paragraphs of text
2. **Documentation**: Future developers can understand the structure at a glance
3. **Design Tool**: Working through a design on paper (or whiteboard) often reveals problems before coding
4. **Common Language**: Most software engineers understand UML, so it's a universal communication tool

#### UML Diagram Categories

UML diagrams fall into two main categories:

**Structural Diagrams** (Show static structure)
- Class Diagram
- Package Diagram
- Object Diagram

**Behavioral Diagrams** (Show dynamic behavior)
- Sequence Diagram
- Activity Diagram
- State Diagram

---

#### Key Diagram Types

##### 1. Class Diagram

**Purpose**: Describes the structure of a system by showing classes, their attributes, operations, and relationships.

**This is the most important and commonly used diagram for developers.**

**Key Elements**:

```
+---------------------+
|   ClassName         |
+---------------------+
| - attribute: type   |  <- Fields (with visibility modifiers)
| + method(): return  |  <- Methods
+---------------------+
```

**Visibility Modifiers**:
- `+` = public
- `-` = private
- `#` = protected
- `~` = package-private

**Example Class Diagram**:
```
+----------+         +---------+
| Vehicle  |         | Car     |
+----------+         +---------+
| - brand  |         | - model |
| + start()|         | + drive()|
+----------+         +---------+
     ^
     |
  inherits
```

**Relationships**:

**Inheritance** (is-a): Empty arrow pointing to parent
```
Child ---|> Parent
```

**Composition** (has-a, strong): Filled diamond pointing to container
```
Car *-- Engine  (Car has 1 Engine)
```

**Aggregation** (has-a, weak): Empty diamond pointing to container
```
Department o-- Professor (Department has many Professors)
```

**Example Full Diagram**:
```
+---------+       +--------+
| Vehicle |       | Wheel  |
+---------+       +--------+
| -brand  |       | -size  |
+---------|---   |+rotate()|
| +start()        +--------+
| +stop()  |           ^
+---------+           | 1 to 4

Car ---|> Vehicle
Car *-- Wheel
```

---

##### 2. Sequence Diagram

**Purpose**: Shows how objects interact with each other over time, and the order of those interactions.

**Perfect for**: Visualizing a specific use case or method call flow

**Key Elements**:
- Actors/Objects: Boxes at the top
- Lifelines: Vertical dashed lines representing the object's existence over time
- Messages: Arrows showing interactions between objects

**Example: Booking a Flight**
```
Customer    ReservationSystem    PaymentProcessor
    |               |                    |
    |--booking----->|                    |
    |               |--validate------->|
    |               |<--valid---------|
    |               |--charge------->|
    |               |<--confirmed----|
    |<--confirm-----|
```

**Real Code Scenario**:
```java
// This sequence diagram represents this code:
public void bookFlight(Flight flight) {
    // 1. Customer calls the system
    ReservationSystem sys = new ReservationSystem();
    
    // 2. System validates
    boolean valid = flight.validate();
    
    // 3. System charges
    PaymentProcessor processor = new PaymentProcessor();
    boolean charged = processor.charge(flight.getPrice());
    
    // 4. Return confirmation
}
```

---

##### 3. State Diagram

**Purpose**: Describes the different states an object can be in and how it transitions between those states in response to events.

**Perfect for**: Modeling objects with complex lifecycles (e.g., order processing, authentication)

**Example: User Authentication**
```
[Logged Out] --login--> [Logged In] --logout--> [Logged Out]
                              |
                         --timeout-->
                              |
                         [Timed Out]
```

**Real Scenario: Order Processing**
```
[New Order] --validate--> [Validated] --payment--> [Paid]
    |
    +--invalid--> [Rejected]

[Paid] --ship--> [Shipped] --deliver--> [Delivered]
```

---

##### 4. Activity Diagram

**Purpose**: Displays the workflow of a system, like a flowchart.

**Perfect for**: Modeling business processes or complex algorithms

**Example: Order Processing**
```
     Start
       |
       v
   [Place Order]
       |
       v
   [Validate]
     /    \
   Valid  Invalid
   /        \
  v          v
[Process]  [Reject]
  |          |
  |          +-----> [Notify Customer] --> End
  |
  v
[Ship]
  |
  v
[Deliver]
  |
  v
 End
```

---

#### Interview Insight: Whiteboard Confidence

You are **not** expected to be a UML expert. But being able to sketch a simple class diagram on a whiteboard to explain your design is a massive plus.

**What shows mastery**:
✓ Draw a basic class diagram showing inheritance and composition
✓ Explain what each arrow means
✓ Sketch a simple sequence diagram for a specific interaction
✓ Understand the difference between aggregation and composition

**What you don't need to do**:
✗ Draw perfect diagrams with perfect tools
✗ Remember every UML notation detail
✗ Draw comprehensive diagrams for large systems

---

## Worked Examples

### Worked Example 1: Designing a Payment Processor (SOLID Principles)

#### Problem or Design Scenario

**Context**: You're building an e-commerce platform. Initially, it only needs to handle credit card payments. But you know that soon, you'll need to support PayPal and Bank Transfers. The system should be easy to extend with new payment methods without modifying the core processor.

**Challenge**: Design it so that adding a new payment method only requires adding a new class, not modifying existing code.

#### Technical Value

This scenario directly tests your understanding of **Open/Closed Principle** and **Dependency Inversion Principle**. A naive solution will become a maintenance nightmare as you add more payment methods.

#### Analysis: What We Want to Achieve

✓ Adding a new payment method doesn't require modifying existing code (Open/Closed)
✓ The processor doesn't depend on concrete payment classes (Dependency Inversion)
✓ Each payment method is isolated (Single Responsibility)
✓ Easy to test with fake payment methods

#### Naive Approach (What NOT to Do)

```java
// ❌ NAIVE APPROACH - Violates OCP and SRP
public class PaymentProcessor {
    public void processPayment(String method, double amount) {
        if (method.equals("credit")) {
            System.out.println("Processing credit card payment of $" + amount);
            // Validate credit card
            // Call credit card API
            // Handle response
            // TODO: Tons of complex logic here...
        } else if (method.equals("paypal")) {
            System.out.println("Processing PayPal payment of $" + amount);
            // OAuth flow
            // Call PayPal API
            // Handle PayPal-specific errors
            // TODO: Different complex logic...
        }
        // If we add Bank Transfer, we MUST modify this class!
    }
}
```

**Problems with This Approach**:
1. **Violates OCP**: To add a new payment method, you must modify `PaymentProcessor`. It's closed for extension!
2. **Violates SRP**: The class knows about credit cards, PayPal, and banks. That's three reasons for this class to change!
3. **Violates DIP**: The high-level `PaymentProcessor` depends on low-level details (how to charge a credit card).
4. **Hard to test**: You can't test without actual API calls. You can't inject a fake payment method.
5. **Error-prone**: Every new method means searching through and modifying the existing method.

#### Better Approach: The Strategy Pattern

**Key Idea**: Extract the payment logic into separate classes (strategies). The processor depends only on an interface, not concrete classes.

```java
// ✅ BETTER APPROACH - Follows OCP, DIP, and SRP

// 1. Define the abstraction (the contract all strategies must follow)
public interface PaymentStrategy {
    /**
     * Process a payment of the given amount.
     * @param amount The amount to charge
     * @throws PaymentException If the payment fails
     */
    void pay(double amount) throws PaymentException;
}

// 2. Create concrete strategies
public class CreditCardStrategy implements PaymentStrategy {
    private String cardNumber;
    private String expiryDate;
    private String cvv;
    
    public CreditCardStrategy(String cardNumber, String expiryDate, String cvv) {
        this.cardNumber = cardNumber;
        this.expiryDate = expiryDate;
        this.cvv = cvv;
    }
    
    @Override
    public void pay(double amount) throws PaymentException {
        // Validate card details
        if (!isValidCard()) {
            throw new PaymentException("Invalid card");
        }
        
        // Call the credit card processor API
        System.out.println("Charging $" + amount + " to credit card " + cardNumber);
        // In real code: callPaymentGatewayAPI(cardNumber, amount, cvv);
    }
    
    private boolean isValidCard() {
        // TODO: Real validation logic (Luhn algorithm, expiry check, etc.)
        return true;
    }
}

public class PayPalStrategy implements PaymentStrategy {
    private String email;
    private String password;
    
    public PayPalStrategy(String email, String password) {
        this.email = email;
        this.password = password;
    }
    
    @Override
    public void pay(double amount) throws PaymentException {
        // OAuth authentication
        System.out.println("Authenticating with PayPal account " + email);
        
        // Call PayPal API
        System.out.println("Processing $" + amount + " via PayPal");
        // In real code: callPayPalAPI(email, amount);
    }
}

public class BankTransferStrategy implements PaymentStrategy {
    private String accountNumber;
    private String routingNumber;
    
    public BankTransferStrategy(String accountNumber, String routingNumber) {
        this.accountNumber = accountNumber;
        this.routingNumber = routingNumber;
    }
    
    @Override
    public void pay(double amount) throws PaymentException {
        System.out.println("Processing $" + amount + " via bank transfer to account " + accountNumber);
        // In real code: callBankingAPI(accountNumber, routingNumber, amount);
    }
}

// 3. The high-level module depends only on the abstraction
public class PaymentProcessor {
    private PaymentStrategy paymentStrategy;
    
    /**
     * Constructor: Set the payment strategy
     * This demonstrates Dependency Injection
     */
    public PaymentProcessor(PaymentStrategy paymentStrategy) {
        this.paymentStrategy = paymentStrategy;
    }
    
    /**
     * Can also set the strategy after construction
     * Allows switching payment methods mid-session
     */
    public void setPaymentStrategy(PaymentStrategy paymentStrategy) {
        this.paymentStrategy = paymentStrategy;
    }
    
    /**
     * Process payment using the injected strategy
     * Notice: PaymentProcessor doesn't know HOW to pay
     * It just delegates to the strategy
     */
    public void processPayment(double amount) throws PaymentException {
        if (paymentStrategy == null) {
            throw new IllegalStateException("Payment strategy not set.");
        }
        paymentStrategy.pay(amount);
    }
}

// Custom exception for payment failures
public class PaymentException extends Exception {
    public PaymentException(String message) {
        super(message);
    }
    public PaymentException(String message, Throwable cause) {
        super(message, cause);
    }
}

// 4. Client code that uses the processor
public class ShoppingCart {
    public static void main(String[] args) throws PaymentException {
        // Scenario 1: Pay with Credit Card
        System.out.println("=== Scenario 1: Credit Card Payment ===");
        PaymentStrategy ccStrategy = new CreditCardStrategy("1234-5678-9012-3456", "12/25", "123");
        PaymentProcessor processor = new PaymentProcessor(ccStrategy);
        processor.processPayment(100.0);
        System.out.println();
        
        // Scenario 2: Pay with PayPal
        System.out.println("=== Scenario 2: PayPal Payment ===");
        PaymentStrategy payPalStrategy = new PayPalStrategy("user@example.com", "password");
        processor.setPaymentStrategy(payPalStrategy);
        processor.processPayment(50.0);
        System.out.println();
        
        // Scenario 3: Pay via Bank Transfer
        System.out.println("=== Scenario 3: Bank Transfer Payment ===");
        PaymentStrategy bankStrategy = new BankTransferStrategy("9876543210", "102938");
        processor.setPaymentStrategy(bankStrategy);
        processor.processPayment(200.0);
        System.out.println();
        
        // To add a new payment method (e.g., Apple Pay):
        // 1. Create a new class that implements PaymentStrategy
        // 2. Implement the pay() method
        // 3. Pass it to PaymentProcessor
        // NO CHANGES TO PaymentProcessor!
    }
}
```

#### Why the Better Approach Works

**1. Open/Closed Principle**:
- **Open for extension**: To add Apple Pay, just create `ApplePayStrategy` and implement `pay()`. Done.
- **Closed for modification**: `PaymentProcessor` never needs to change.

**2. Dependency Inversion Principle**:
- High-level `PaymentProcessor` depends on the abstraction (`PaymentStrategy`)
- Low-level details (`CreditCardStrategy`) also depend on the abstraction
- Not the other way around

**3. Single Responsibility Principle**:
- `PaymentProcessor` is responsible only for orchestrating the payment process
- `CreditCardStrategy` is responsible only for credit card logic
- `PayPalStrategy` is responsible only for PayPal logic

**4. Testability**:
```java
// In your test file
public class PaymentProcessorTest {
    @Test
    public void testProcessPayment() {
        // Create a fake strategy for testing
        PaymentStrategy fakeStrategy = new PaymentStrategy() {
            public void pay(double amount) {
                System.out.println("Fake payment of $" + amount);
            }
        };
        
        PaymentProcessor processor = new PaymentProcessor(fakeStrategy);
        processor.processPayment(100); // No real API calls!
    }
}
```

#### Dry Run: Step-by-Step Execution

Let's trace through `Scenario 2` above:

```
Input: payPalStrategy, amount = 50.0

1. processor.setPaymentStrategy(payPalStrategy)
   - paymentStrategy field is now set to the PayPalStrategy instance

2. processor.processPayment(50.0)
   - Check: paymentStrategy != null? YES, so continue
   - Call: paymentStrategy.pay(50.0)
   
3. Inside PayPalStrategy.pay(50.0):
   - Print: "Authenticating with PayPal account user@example.com"
   - Print: "Processing $50.0 via PayPal"
   - Return to caller

Output:
Authenticating with PayPal account user@example.com
Processing $50.0 via PayPal
```

#### Edge Cases and Robustness

1. **Null Strategy**: The code throws an `IllegalStateException` if no strategy is set
2. **Invalid Amount**: Strategies could validate that amount > 0
3. **Payment Failure**: Strategies throw `PaymentException` if something goes wrong
4. **Switching Methods**: You can call `setPaymentStrategy()` to switch payment methods mid-session

---

### Worked Example 2: Designing a Notification System (Composition vs. Inheritance)

#### Problem or Design Scenario

**Context**: You're building a notification system. A basic `Notifier` can send emails. Soon, you need to add SMS and push notifications. Here's the twist: **Users can choose any combination of channels**. One user wants Email + SMS, another wants Email + Push, and yet another wants all three.

**Challenge**: Design it so users can mix and match notification channels without creating an explosion of classes.

#### Technical Value

This scenario highlights a critical weakness of inheritance: **the class explosion problem**. It shows why composition is a more flexible approach.

#### Analysis: Why Inheritance Fails

Let's see what happens if we try inheritance:

```
Notifier (base)
├── EmailNotifier
├── SmsNotifier
├── PushNotifier
├── EmailSmsNotifier
├── EmailPushNotifier
├── SmsPushNotifier
├── EmailSmsPushNotifier
```

We'd need **2^n** classes for n notification types! With 5 types, that's 32 classes. With 10 types, that's 1024 classes. This is called the **class explosion problem**.

#### Naive Approach (Inheritance-Based)

```java
// ❌ NAIVE APPROACH - Inheritance leads to class explosion

public class Notifier {
    public void send(String message) {
        System.out.println("Sending email: " + message);
    }
}

public class SmsNotifier extends Notifier {
    @Override
    public void send(String message) {
        super.send(message); // Send email
        System.out.println("Sending SMS: " + message);
    }
}

public class PushNotifier extends Notifier {
    @Override
    public void send(String message) {
        super.send(message); // Send email
        System.out.println("Sending Push: " + message);
    }
}

// What about Email + SMS + Push? We need another class...
public class AllNotifier extends SmsNotifier { // No! This doesn't inherit from PushNotifier
    @Override
    public void send(String message) {
        super.send(message); // Sends Email + SMS
        System.out.println("Sending Push: " + message);
    }
}
```

**Problems**:
1. **Class explosion**: 2^n classes needed
2. **Rigidity**: Behavior is fixed at compile time by the class type
3. **Code duplication**: SMS logic might be duplicated in multiple classes
4. **Impossible combinations**: Multiple inheritance isn't allowed in Java
5. **Inflexible**: Can't decide at runtime to add/remove a channel

#### Better Approach: The Decorator Pattern

**Key Idea**: Treat additional channels as "decorations" that wrap around a base notifier. Each decorator adds its own behavior while delegating to the wrapped notifier.

```java
// ✅ BETTER APPROACH - Composition with the Decorator Pattern

// 1. Define the core interface
public interface INotifier {
    void send(String message);
}

// 2. Base implementation
public class EmailNotifier implements INotifier {
    @Override
    public void send(String message) {
        System.out.println("Sending email: " + message);
    }
}

// 3. Base decorator class (optional but good practice)
public abstract class BaseDecorator implements INotifier {
    protected final INotifier wrappedNotifier;
    
    public BaseDecorator(INotifier notifier) {
        this.wrappedNotifier = notifier;
    }
    
    @Override
    public void send(String message) {
        wrappedNotifier.send(message);
    }
}

// 4. Concrete decorators
public class SmsDecorator extends BaseDecorator {
    public SmsDecorator(INotifier notifier) {
        super(notifier);
    }
    
    @Override
    public void send(String message) {
        super.send(message); // First, do what the wrapped notifier does
        System.out.println("Sending SMS: " + message); // Then, add our own behavior
    }
}

public class PushDecorator extends BaseDecorator {
    public PushDecorator(INotifier notifier) {
        super(notifier);
    }
    
    @Override
    public void send(String message) {
        super.send(message);
        System.out.println("Sending Push Notification: " + message);
    }
}

// 5. Client code composes the object at runtime
public class NotificationClient {
    public static void main(String[] args) {
        System.out.println("=== Scenario 1: Email Only ===");
        INotifier emailOnly = new EmailNotifier();
        emailOnly.send("Hello!");
        System.out.println();
        
        System.out.println("=== Scenario 2: Email + SMS ===");
        INotifier emailAndSms = new SmsDecorator(new EmailNotifier());
        emailAndSms.send("Important alert!");
        System.out.println();
        
        System.out.println("=== Scenario 3: Email + Push ===");
        INotifier emailAndPush = new PushDecorator(new EmailNotifier());
        emailAndPush.send("Update available!");
        System.out.println();
        
        System.out.println("=== Scenario 4: Email + SMS + Push ===");
        INotifier allChannels = new PushDecorator(new SmsDecorator(new EmailNotifier()));
        allChannels.send("System-wide broadcast!");
        System.out.println();
        
        // Easy to add more decorators
        System.out.println("=== Scenario 5: Email + SMS + Push + Custom ===");
        INotifier withCustom = new SlackDecorator(new PushDecorator(new SmsDecorator(new EmailNotifier())));
        withCustom.send("Multi-channel alert!");
    }
}

// Adding a new channel is just one new class!
public class SlackDecorator extends BaseDecorator {
    public SlackDecorator(INotifier notifier) {
        super(notifier);
    }
    
    @Override
    public void send(String message) {
        super.send(message);
        System.out.println("Sending Slack message: " + message);
    }
}
```

#### Why the Better Approach Works

**1. No Class Explosion**:
- With 5 notification types, we need only 5 decorator classes + 1 base class = 6 total
- Not 32 classes like with inheritance!

**2. Runtime Flexibility**:
- You can decide at runtime what channels to use
- You can even wrap a notifier multiple times

**3. Single Responsibility**:
- Each decorator has one job: add one channel
- Each is easy to understand and test

**4. Open/Closed**:
- Adding a new channel means creating a new decorator
- Existing code doesn't change

#### Dry Run: Step-by-Step Execution

Let's trace Scenario 4: `Email + SMS + Push`

```
allChannels = new PushDecorator(new SmsDecorator(new EmailNotifier()))

Structure:
PushDecorator
  └── wrappedNotifier: SmsDecorator
      └── wrappedNotifier: EmailNotifier

Execution: allChannels.send("System-wide broadcast!")

1. PushDecorator.send("System-wide broadcast!")
   - Calls: super.send("System-wide broadcast!")
   - Which calls: wrappedNotifier.send(...)
   
2. SmsDecorator.send("System-wide broadcast!")
   - Calls: super.send(...)
   - Which calls: wrappedNotifier.send(...)
   
3. EmailNotifier.send("System-wide broadcast!")
   - Prints: "Sending email: System-wide broadcast!"
   - Returns
   
4. Back in SmsDecorator:
   - Prints: "Sending SMS: System-wide broadcast!"
   - Returns
   
5. Back in PushDecorator:
   - Prints: "Sending Push Notification: System-wide broadcast!"
   - Returns

Output:
Sending email: System-wide broadcast!
Sending SMS: System-wide broadcast!
Sending Push Notification: System-wide broadcast!
```

---

## Solved Problems

(For this foundational chapter, the "problems" are mini design scenarios rather than algorithmic challenges.)

### Problem 1: Document Converter (Easy, Strategy Pattern)

#### Problem Statement

Design a simple document converter. A `Converter` object takes a file path and should be able to convert it to different formats. Initially, it supports converting to PDF. Soon, you'll need to add conversion to DOCX, HTML, PowerPoint, and other formats.

**Requirement**: Design the system so it's easy to add new formats without modifying the `Converter` class.

#### Solution Outline

This is a perfect fit for the **Strategy Pattern** (which we previewed in Worked Example 1).

**Steps**:
1. Create a `ConversionStrategy` interface with a method `String convert(String filePath)`
2. Create concrete strategy classes:
   - `PdfConversionStrategy`
   - `DocxConversionStrategy`
   - `HtmlConversionStrategy`
3. The main `Converter` class will have:
   - `setStrategy(ConversionStrategy strategy)`
   - `performConversion(String filePath)` that delegates to the strategy
4. This follows the Open/Closed Principle and Dependency Inversion

**Key Insight**: The `Converter` doesn't know *how* to convert. It just tells the strategy to do it.

---

### Problem 2: User Authentication (Easy, Strategy Pattern)

#### Problem Statement

Design a user authentication module. The system needs to support:
- Authentication via username/password
- Authentication via Google Sign-In
- Later: Facebook, GitHub, etc.

**Requirement**: Design so that adding a new authentication method doesn't require changing existing code.

#### Solution Outline

Another perfect fit for the **Strategy Pattern**.

**Steps**:
1. Create an `AuthenticationStrategy` interface: `boolean authenticate(Credentials creds)`
2. Create concrete strategies:
   - `PasswordAuthStrategy`
   - `GoogleAuthStrategy`
   - `FacebookAuthStrategy` (for later)
3. The `Authenticator` class has:
   - `setStrategy(AuthenticationStrategy strategy)`
   - `authenticate(Credentials creds)` delegates to the strategy
4. The system can switch authentication methods based on user choice or configuration

**Key Benefits**:
- Each auth method is isolated and testable
- Adding Google doesn't affect password authentication
- Easy to mock for testing

---

### Problem 3: Coffee Shop Orders (Medium, Decorator Pattern)

#### Problem Statement

Design a system to calculate the cost of a coffee order.

- A basic coffee has a base cost (e.g., $2.00)
- Customers can add extras like:
  - Milk: +$0.50
  - Sugar: +$0.25
  - Whipped Cream: +$0.75
  - Vanilla Syrup: +$0.50
- Customers can add any combination of extras
- The system should output both the description and the total cost

**Example**:
```
Coffee + Milk + Whipped Cream = $3.25
Description: "Black Coffee, with Milk, with Whipped Cream"
```

#### Solution Outline

This is a classic use case for the **Decorator Pattern**.

**Steps**:
1. Create a `Coffee` interface with:
   - `double getCost()`
   - `String getDescription()`
2. Create a `SimpleCoffee` class (the base):
   - `getCost()` returns the base price
   - `getDescription()` returns "Black Coffee"
3. Create decorator classes for each extra:
   - `MilkDecorator`, `SugarDecorator`, etc.
   - Each wraps a `Coffee` object
   - Each decorator's `getCost()` returns `wrappedCoffee.getCost() + extraCost`
   - Each decorator's `getDescription()` returns `wrappedCoffee.getDescription() + ", with Milk"`
4. Build the order by stacking decorators:
   ```java
   Coffee order = new MilkDecorator(new WhippedCreamDecorator(new SimpleCoffee()));
   System.out.println(order.getDescription() + ": $" + order.getCost());
   ```

**Why Decorators Work Here**:
- Each extra is independent
- You can combine them in any way
- No "MilkAndWhippedCreamCoffee" class needed
- Easy to add new extras

---

### Problem 4: GUI Toolkit (Medium, Composite Pattern)

#### Problem Statement

Design a structure for a GUI toolkit. You have:
- **Leaf elements**: `Button`, `TextBox`, `Label`
- **Containers**: `Panel`, `Window` that can hold other elements (including other containers)

**Requirement**: You should be able to call `render()` on any element, and it should "just work" whether it's a leaf or a container with nested children.

#### Solution Outline

The **Composite Pattern** fits this structure because leaves and containers need the same outward interface.

**Steps**:
1. Create a `Component` interface: `void render()`
2. Create "leaf" classes like `Button` and `TextBox`:
   - Their `render()` method draws themselves
3. Create "composite" classes like `Panel`:
   - Have a `List<Component> children`
   - Their `render()` method iterates through children and calls `render()` on each
4. The beauty: You can treat a single `Button` and a `Panel` containing 10 buttons uniformly
   ```java
   List<Component> components = new ArrayList<>();
   components.add(new Button("Click me"));
   components.add(new Panel(/* ... nested components ... */));
   
   for (Component comp : components) {
       comp.render(); // Works for both Button and Panel!
   }
   ```

**Why Composite Works Here**:
- No special-casing for containers vs. leaves
- Nested structures are natural and easy
- Adding a new component type doesn't break existing code

---

### Problem 5: Undo/Redo Functionality (Hard, Command Pattern)

#### Problem Statement

Design the undo/redo functionality for a simple text editor.

- The editor can perform actions like "insert text" and "delete text"
- You need to undo a sequence of actions and then redo them
- Each undo should reverse the most recent action
- Redoing should re-apply the most recent undone action

#### Solution Outline

The **Command Pattern** fits this requirement because undo and redo need actions to be stored as explicit, reversible objects.

**Steps**:
1. Create a `Command` interface with two methods:
   - `void execute()` - perform the action
   - `void undo()` - reverse the action
2. Create concrete command classes:
   - `InsertTextCommand(String text, int position)`: `execute()` inserts, `undo()` deletes
   - `DeleteTextCommand(String text, int position)`: `execute()` deletes, `undo()` re-inserts
3. The editor maintains two stacks:
   - `undoStack`: Commands that have been executed
   - `redoStack`: Commands that have been undone
4. **Workflow**:
   - User types "Hello": Create `InsertTextCommand("Hello", 0)`, call `execute()`, push to `undoStack`
   - User hits Undo: Pop from `undoStack`, call `undo()`, push to `redoStack`
   - User hits Redo: Pop from `redoStack`, call `execute()`, push to `undoStack`

**Why Command Works Here**:
- Each action is encapsulated in an object
- You can store, queue, and replay actions
- Undo/Redo become simple stack operations
- Easy to add new commands (MacroCommand, LoggingCommand, etc.)

---

## Recognition Guide

#### Key Signals That You Need Better Design

This chapter is about the principles *behind* the patterns. The key is to recognize when your code is becoming rigid, brittle, or complex, and then use these principles to guide your refactoring.

---

**Signal 1: Giant `if/else` or `switch` Chain**

```java
if (paymentMethod.equals("credit")) {
    // Process credit
} else if (paymentMethod.equals("paypal")) {
    // Process PayPal
} else if (paymentMethod.equals("bank")) {
    // Process bank
}
```

- **Principle Violated**: Open/Closed Principle
- **Problem**: Adding a new method requires modifying this method
- **Potential Solution**: **Replace Conditional with Polymorphism** (Strategy Pattern)

---

**Signal 2: Class Explosion from Inheritance**

You need a new class for every possible combination of features:
- `EmailNotifier`
- `SmsNotifier`
- `EmailSmsNotifier`
- `EmailPushNotifier`
- `SmsPushNotifier`
- `EmailSmsPushNotifier`

- **Principle Violated**: Open/Closed Principle, indicates inheritance-driven design
- **Problem**: Exponential class growth; unmanageable
- **Potential Solution**: **Use Composition** (Decorator or Strategy Pattern)

---

**Signal 3: A Class Doing Too Much**

```java
public class User {
    // Business logic
    public double calculateBonus() { /* ... */ }
    
    // Database logic
    public void saveToDatabase() { /* ... */ }
    
    // Email logic
    public void sendEmail() { /* ... */ }
    
    // Reporting logic
    public String generateReport() { /* ... */ }
}
```

- **Principle Violated**: Single Responsibility Principle
- **Problem**: Class has multiple reasons to change
- **Potential Solution**: **Extract Class** - Split into `User`, `BonusCalculator`, `UserRepository`, `EmailService`, `ReportGenerator`

---

**Signal 4: High-Level Code Directly Depends on Low-Level Code**

```java
public class ReportGenerator {
    private DatabaseConnection db = new DatabaseConnection(); // Concrete class!
    
    public void generate() {
        Data data = db.query("SELECT ...");
    }
}
```

- **Principle Violated**: Dependency Inversion Principle
- **Problem**: Can't test without a real database; can't swap for a different database
- **Potential Solution**: **Introduce Interface** - Depend on `IDataSource`, use dependency injection

---

**Signal 5: Copy-Paste Code**

You find the exact same block of code in three different places.

```java
// In UserValidator
if (!email.contains("@")) throw new Exception("Invalid email");

// In RegistrationForm
if (!email.contains("@")) throw new Exception("Invalid email");

// In LoginForm
if (!email.contains("@")) throw new Exception("Invalid email");
```

- **Principle Violated**: DRY (Don't Repeat Yourself)
- **Problem**: Fix a bug in one place, but forget to fix the others
- **Potential Solution**: **Extract Method** - Create `EmailValidator.validate(email)`

---

## Design and Decision Making

Software is written by humans, for humans. Good design serves that reality.

#### Clean Code in Algorithm Problems

Even if you're solving a LeetCode problem, good design matters.

**Bad**:
```java
public static int[] solve(String input) {
    // Parse the input
    String[] parts = input.split(",");
    int[] arr = new int[parts.length];
    for (int i = 0; i < parts.length; i++) {
        arr[i] = Integer.parseInt(parts[i]);
    }
    
    // Solve the problem
    // 200 lines of algorithm logic here mixed with output formatting
    
    // Format and return
}
```

**Good**:
```java
public static void main(String[] args) {
    String input = "1,2,3,4,5";
    int[] arr = parseInput(input);
    int result = solve(arr);
    printResult(result);
}

private static int[] parseInput(String input) {
    // Parsing logic isolated
}

private static int solve(int[] arr) {
    // Pure algorithm logic, easy to test
}

private static void printResult(int result) {
    // Output logic isolated
}
```

**Benefits**:
- Each method is testable independently
- Easy to understand what each part does
- Easy to reuse methods for different problems

---

#### Pragmatic Choice: Know When NOT to Apply Patterns

A pragmatic programmer knows that **YAGNI** (You Ain't Gonna Need It) is important. Don't apply a complex design pattern to a simple problem just to show you know it.

**Example**:
```java
// If you only have 2 payment methods and you're 100% sure you'll never have more:
if (method.equals("credit")) {
    processCredit();
} else {
    processPayPal();
}

// This is FINE. It's simple, clear, and maintainable for the current context.
```

**But**:
```java
// If you know you'll have 10+ payment methods, or if you know requirements will change:
// Use the Strategy Pattern. The complexity investment pays off.
```

**The Key**: Recognize when an assumption is likely to change. If it is, invest in flexibility.

---

#### API Design: Think Like a Library Author

When you write a helper class or data structure, think about its **public API**.

**Bad API**:
```java
public class MyList {
    public int[] elements; // Exposed internal state!
}

list.elements[0] = -1000; // Allowed, even though it might violate invariants
```

**Good API**:
```java
public class MyList {
    private int[] elements; // Hidden
    
    public int get(int index) { return elements[index]; }
    public void add(int value) { /* ... */ }
    public int size() { return elements.length; }
}

list.add(-1000); // If add() validates, we maintain invariants
```

**Principles**:
- Encapsulate internal state (make it private)
- Provide clear methods for interaction (get, add, remove, size)
- Enforce business rules through your API

---

#### Testability: Design for Testing

Code that follows SOLID principles is almost always easier to test.

```java
// Hard to test (tight coupling)
public class EmailService {
    private SmtpServer server = new SmtpServer(); // Hard-wired
    
    public void send(String to, String message) {
        server.send(to, message);
    }
}

// Easy to test (loose coupling, dependency injection)
public class EmailService {
    private MailServer server; // Injected
    
    public EmailService(MailServer server) {
        this.server = server;
    }
    
    public void send(String to, String message) {
        server.send(to, message);
    }
}

// In tests:
EmailService service = new EmailService(new FakeMailServer());
service.send("test@example.com", "Hello");
// No real emails sent; we're testing in isolation
```

---

#### Common Mistakes and How to Avoid Them

**Mistake 1: Over-Engineering Simple Problems**
- **Symptom**: You've created 10 classes for a problem that could be solved in 2
- **Fix**: Start simple. Refactor when complexity becomes real

**Mistake 2: Premature Abstraction**
- **Symptom**: You're creating interfaces for everything, even when there's only one implementation
- **Fix**: Only abstract when you have (or foresee) multiple implementations or a real need for decoupling

**Mistake 3: Inheritance Hierarchies That Are Too Deep**
- **Symptom**: `Animal > Mammal > Carnivore > Cat > PersianCat > BlackPersianCat`
- **Fix**: Prefer composition. `Cat` has behaviors, not a deep hierarchy

**Mistake 4: Ignoring Testability**
- **Symptom**: Your code has hard-wired dependencies (like `new DatabaseConnection()`) scattered throughout
- **Fix**: Use dependency injection; pass dependencies in via constructors or setters

---


# 20: Behavioral Design Patterns

## Introduction and Context

Behavioral patterns define how objects interact and delegate responsibility. They are about communication and flexibility rather than structure. The core challenge is knowing when to apply them—over-engineering leads to code that is harder to follow, not easier.

This chapter covers six families: Strategy (switchable algorithms), Chain of Responsibility (request forwarding), Command (encapsulated actions), Mediator and Observer (decoupled communication), State and Memento (state management), and Interpreter/Iterator/Template Method/Visitor (traversal and computation).

The key skill is recognizing when to extract and defer behavior versus keeping it simple.

## Core Intuition and Mechanics

Behavioral patterns answer: "Who does what, and how do we communicate?"

- **Strategy**: switch algorithms at runtime.
- **Chain of Responsibility**: pass a request down a chain until handled.
- **Command**: encapsulate an action so it can be queued, undone, or replayed.
- **Mediator/Observer**: decouple components via a central coordinator or event system.
- **State**: behavior changes when internal state changes.
- **Memento**: capture and restore state.
- **Visitor**: apply operations to elements without modifying them.

The mental model: extract responsibility into separate objects so behavior is decoupled, testable, and reusable.

## Core Concepts and Subtopics

### Concept Cluster: Strategy and Chain of Responsibility
Topics in this cluster:
- 20.1 Strategy Pattern; Algorithm family and runtime switching; Policy injection and payment-style examples
- 20.2 Chain of Responsibility: Handler chain; Request propagation; Dynamic chains

#### Strategy Pattern

Encapsulate an algorithm so it can be swapped at runtime.

```java
interface PaymentStrategy {
    void pay(double amount);
}

class CreditCardPayment implements PaymentStrategy {
    private String cardNumber;
    public CreditCardPayment(String cardNumber) { this.cardNumber = cardNumber; }
    public void pay(double amount) {
        System.out.println("Paying " + amount + " via credit card " + cardNumber);
    }
}

class PayPalPayment implements PaymentStrategy {
    private String email;
    public PayPalPayment(String email) { this.email = email; }
    public void pay(double amount) {
        System.out.println("Paying " + amount + " via PayPal " + email);
    }
}

class ShoppingCart {
    private PaymentStrategy strategy;
    public void setPaymentStrategy(PaymentStrategy strategy) { this.strategy = strategy; }
    public void checkout(double amount) { strategy.pay(amount); }
}
```

#### Chain of Responsibility

Pass a request down a chain of handlers until one processes it.

```java
abstract class Handler {
    protected Handler next;
    public void setNext(Handler next) { this.next = next; }
    public void handle(Request req) {
        if (canHandle(req)) {
            process(req);
        } else if (next != null) {
            next.handle(req);
        }
    }
    protected abstract boolean canHandle(Request req);
    protected abstract void process(Request req);
}

class Manager extends Handler {
    protected boolean canHandle(Request req) { return req.amount <= 1000; }
    protected void process(Request req) { System.out.println("Manager approves"); }
}

class Director extends Handler {
    protected boolean canHandle(Request req) { return req.amount <= 10000; }
    protected void process(Request req) { System.out.println("Director approves"); }
}
```

---

### Concept Cluster: Command and Action Encapsulation
Topics in this cluster:
- 20.3 Command Pattern: Command interface, invoker, and receiver; Undo, redo, and queueable commands; Middleware and action history examples

#### Definition

Encapsulate an action (method call) as an object so it can be queued, logged, or undone.

```java
interface Command {
    void execute();
    void undo();
}

class LightOnCommand implements Command {
    private Light light;
    public LightOnCommand(Light light) { this.light = light; }
    public void execute() { light.on(); }
    public void undo() { light.off(); }
}

class RemoteControl {
    private Command lastCommand;
    public void pressButton(Command cmd) {
        cmd.execute();
        lastCommand = cmd;
    }
    public void pressUndo() { lastCommand.undo(); }
}
```

---

### Concept Cluster: Mediator and Observer
Topics in this cluster:
- 20.4 Mediator and Observer: Central coordinator; Decoupled communication; Chat room example; UI components coordination; Publisher subscriber, event listener, push, and pull models; Mediator versus observer in event-driven systems

#### Mediator Pattern

Central coordinator handles all communication between components.

```java
interface Mediator {
    void notify(Component sender, String event);
}

class ChatRoomMediator implements Mediator {
    private List<User> users = new ArrayList<>();
    public void registerUser(User user) { users.add(user); }
    public void notify(Component sender, String event) {
        for (User user : users) {
            if (user != sender) {
                user.receive(event);
            }
        }
    }
}

class User extends Component {
    private String name;
    public User(String name, Mediator mediator) { 
        super(mediator); 
        this.name = name;
    }
    public void send(String msg) {
        mediator.notify(this, name + ": " + msg);
    }
    public void receive(String msg) {
        System.out.println(msg);
    }
}
```

#### Observer Pattern

Components register as listeners to a publisher.

```java
interface Observer {
    void update(String event);
}

class EventPublisher {
    private List<Observer> observers = new ArrayList<>();
    public void subscribe(Observer obs) { observers.add(obs); }
    public void unsubscribe(Observer obs) { observers.remove(obs); }
    public void publish(String event) {
        for (Observer obs : observers) {
            obs.update(event);
        }
    }
}

class EventListener implements Observer {
    private String name;
    public EventListener(String name) { this.name = name; }
    public void update(String event) {
        System.out.println(name + " received: " + event);
    }
}
```

---

### Concept Cluster: State and Memento
Topics in this cluster:
- 20.5 State and Memento: Snapshot state; Undo history; State restore and encapsulation safety; State objects and transitions; Behavior by state and finite state machines; Memento versus command versus state

#### State Pattern

Behavior depends on internal state; state logic is in separate state objects.

```java
interface State {
    void handle(TrafficLight light);
}

class RedState implements State {
    public void handle(TrafficLight light) {
        System.out.println("Red light");
        light.setState(new GreenState());
    }
}

class GreenState implements State {
    public void handle(TrafficLight light) {
        System.out.println("Green light");
        light.setState(new YellowState());
    }
}

class TrafficLight {
    private State state = new RedState();
    public void setState(State state) { this.state = state; }
    public void change() { state.handle(this); }
}
```

#### Memento Pattern

Capture and restore snapshots of state.

```java
class Memento {
    private String state;
    public Memento(String state) { this.state = state; }
    public String getState() { return state; }
}

class TextEditor {
    private String text = "";
    public void setText(String text) { this.text = text; }
    public String getText() { return text; }
    public Memento createSnapshot() { return new Memento(text); }
    public void restore(Memento m) { text = m.getState(); }
}

class UndoManager {
    private Stack<Memento> history = new Stack<>();
    public void save(Memento m) { history.push(m); }
    public Memento undo() { return history.pop(); }
}
```

---

### Concept Cluster: Iterator, Template Method, and Visitor
Topics in this cluster:
- 20.6 Interpreter, Iterator, Template Method, and Visitor: Grammar rules; Expression tree structure; Parsing basics; Forward iterator; Reverse, custom, and lazy iterators; When a simple parser or loop is enough; Algorithm skeleton and hook methods; Fixed steps and extensible steps; Double dispatch and external operations; AST traversal and extending behavior cleanly

#### Iterator Pattern

Traverse a collection without exposing its structure.

```java
interface Iterator<T> {
    boolean hasNext();
    T next();
}

interface Iterable<T> {
    Iterator<T> iterator();
}

class ListIterator<T> implements Iterator<T> {
    private List<T> list;
    private int index = 0;
    public ListIterator(List<T> list) { this.list = list; }
    public boolean hasNext() { return index < list.size(); }
    public T next() { return list.get(index++); }
}
```

#### Template Method Pattern

Define algorithm skeleton; subclasses fill in specific steps.

```java
abstract class ReportGenerator {
    public final void generate() {
        collectData();
        analyzeData();
        formatReport();
        printReport();
    }
    protected abstract void collectData();
    protected abstract void analyzeData();
    protected abstract void formatReport();
    protected void printReport() { System.out.println("Report printed"); }
}

class SalesReportGenerator extends ReportGenerator {
    protected void collectData() { System.out.println("Collecting sales data"); }
    protected void analyzeData() { System.out.println("Analyzing sales trends"); }
    protected void formatReport() { System.out.println("Formatting as table"); }
}
```

#### Visitor Pattern

Apply operations to elements without modifying them.

```java
interface Visitor {
    void visit(Circle c);
    void visit(Square s);
}

interface Shape {
    void accept(Visitor v);
}

class Circle implements Shape {
    public double radius;
    public Circle(double radius) { this.radius = radius; }
    public void accept(Visitor v) { v.visit(this); }
}

class AreaCalculator implements Visitor {
    public void visit(Circle c) { System.out.println("Area: " + (Math.PI * c.radius * c.radius)); }
    public void visit(Square s) { System.out.println("Area: " + (s.side * s.side)); }
}
```

---

## Worked Examples

### Worked Example 1: Strategy Pattern for Payment

**Problem**: Support multiple payment methods without hardcoding.

```java
PaymentStrategy creditCard = new CreditCardPayment("1234-5678");
PaymentStrategy paypal = new PayPalPayment("user@example.com");

ShoppingCart cart = new ShoppingCart();
cart.setPaymentStrategy(creditCard);
cart.checkout(100.0); // uses credit card

cart.setPaymentStrategy(paypal);
cart.checkout(50.0); // uses PayPal
```

---

### Worked Example 2: Command Pattern with Undo

**Problem**: Encapsulate light control so it can be undone.

```java
Light light = new Light();
Command on = new LightOnCommand(light);
Command off = new LightOffCommand(light);

RemoteControl remote = new RemoteControl();
remote.pressButton(on);  // light is on
remote.pressUndo();      // light is off
remote.pressButton(off); // light is off
```

---

### Worked Example 3: Observer for UI Updates

**Problem**: Multiple UI components listen to a data model.

```java
EventPublisher publisher = new EventPublisher();
EventListener listener1 = new EventListener("UI Component 1");
EventListener listener2 = new EventListener("UI Component 2");

publisher.subscribe(listener1);
publisher.subscribe(listener2);
publisher.publish("Data changed"); // both listeners notified
```

---

## Solved Problems

### Problem 1: Simple Strategy Selection (Easy)

**Statement**: Create a sorting strategy that can be swapped.

**Java Solution**:
```java
interface SortStrategy {
    void sort(int[] arr);
}

class BubbleSort implements SortStrategy {
    public void sort(int[] arr) {
        for (int i = 0; i < arr.length; i++) {
            for (int j = 0; j < arr.length - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int tmp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = tmp;
                }
            }
        }
    }
}

class Sorter {
    private SortStrategy strategy;
    public void setStrategy(SortStrategy strategy) { this.strategy = strategy; }
    public void sort(int[] arr) { strategy.sort(arr); }
}
```

---

### Problem 2: Chain of Responsibility for Approvals (Easy)

**Statement**: Route purchase requests through an approval chain.

**Java Solution**:
```java
class Request {
    int amount;
    Request(int amount) { this.amount = amount; }
}

abstract class Approver {
    protected Approver next;
    public void setNext(Approver next) { this.next = next; }
    public void approve(Request req) {
        if (canApprove(req)) {
            System.out.println(getClass().getSimpleName() + " approves");
        } else if (next != null) {
            next.approve(req);
        }
    }
    protected abstract boolean canApprove(Request req);
}

class Manager extends Approver {
    protected boolean canApprove(Request req) { return req.amount <= 1000; }
}

class Director extends Approver {
    protected boolean canApprove(Request req) { return req.amount <= 10000; }
}
```

---

### Problem 3: Command Pattern for Text Editor (Medium)

**Statement**: Implement copy, paste, undo using commands.

**Java Solution**:
```java
interface EditorCommand {
    void execute();
    void undo();
}

class CopyCommand implements EditorCommand {
    private TextEditor editor;
    public CopyCommand(TextEditor editor) { this.editor = editor; }
    public void execute() { editor.copy(); }
    public void undo() { editor.clearClipboard(); }
}

class TextEditor {
    private String text, clipboard;
    public void copy() { clipboard = text; System.out.println("Copied"); }
    public void clearClipboard() { clipboard = ""; }
}
```

---

### Problem 4: Observer for Event Notifications (Medium)

**Statement**: Multiple objects listen to user login/logout events.

**Java Solution**:
```java
interface UserObserver {
    void onLogin(String username);
    void onLogout(String username);
}

class LoggingObserver implements UserObserver {
    public void onLogin(String username) { System.out.println("Logged in: " + username); }
    public void onLogout(String username) { System.out.println("Logged out: " + username); }
}

class UserService {
    private List<UserObserver> observers = new ArrayList<>();
    public void subscribe(UserObserver obs) { observers.add(obs); }
    public void login(String username) {
        for (UserObserver obs : observers) obs.onLogin(username);
    }
}
```

---

### Problem 5: State Machine for Order (Hard)

**Statement**: Model order status transitions (pending → processing → shipped → delivered).

**Java Solution**:
```java
interface OrderState {
    void process(Order order);
}

class PendingState implements OrderState {
    public void process(Order order) {
        System.out.println("Processing order");
        order.setState(new ProcessingState());
    }
}

class ProcessingState implements OrderState {
    public void process(Order order) {
        System.out.println("Shipping order");
        order.setState(new ShippedState());
    }
}

class Order {
    private OrderState state = new PendingState();
    public void setState(OrderState state) { this.state = state; }
    public void process() { state.process(this); }
}
```

---

## Recognition Guide

**Use Strategy when:**
- Multiple algorithms solve the same problem.
- You need to switch algorithms at runtime.

**Use Chain of Responsibility when:**
- A request passes through multiple handlers.
- Handler choice is dynamic.

**Use Command when:**
- You need to queue, log, or undo actions.
- Requests are encapsulated as objects.

**Use Observer when:**
- Many components listen to a single source.
- Notifications are one-to-many.

**Use State when:**
- Behavior changes with state.
- State transitions are complex.

## Comparison Tables

| Pattern | Purpose | Complexity |
|---------|---------|-----------|
| Strategy | Switchable algorithms | Low |
| Chain | Request forwarding | Medium |
| Command | Encapsulated actions | Medium |
| Observer | Event notifications | Medium |
| State | State-dependent behavior | Medium |
| Visitor | External operations | High |

## Design and Decision Making

- **Don't over-engineer**: simple if-else is fine for 2–3 choices.
- **Dependency injection**: inject strategies, not create them.
- **Testability**: mock observers or strategies for unit testing.
- **Single responsibility**: each pattern extracts one concern.

## Practical Applications

- **E-commerce**: Strategy for payment methods.
- **Logging**: Chain of Responsibility for log levels.
- **Undo/redo**: Command pattern for transactions.
- **UI**: Observer for button clicks and model updates.
- **State machines**: State pattern for workflow.

## Failure Modes and Trade-offs

- **Over-complexity**: too many patterns obscure intent.
- **Memory overhead**: extra objects from Command and Observer.
- **Indirection**: harder to trace execution with Mediator or Visitor.

## Condensed Notes

- Strategy: swap algorithms.
- Chain: forward until handled.
- Command: encapsulate actions (undo, queue).
- Observer: notify many listeners.
- State: behavior by state.
- Visitor: external operations.

## Additional Problems

**Easy:** Simple Factory Strategy, Notification Chain, Undo History, Event Listener, Temperature State.

**Medium:** Payment Pipeline, Document Approval Workflow, Notification System, Trading State Machine, Discount Calculator.

**Hard:** Complex State Transitions, Multi-Observer Coordination, Visitor Over AST, Command Batch Processing, Event-Driven Architecture.

## Key Questions

1. **When should you use Strategy instead of if-else?** When choices are 3+, or will grow, or need plugin architecture.

2. **How does Chain of Responsibility differ from a simple if-else chain?** CoR is for dynamic handlers; if-else is static.

3. **What is the Invoker in Command pattern?** The object that triggers command execution (like a remote control).

4. **Why use Observer instead of direct method calls?** Decoupling: publisher doesn't know about subscribers.

5. **What is a state in State pattern?** An object encapsulating behavior for one state.

6. **How is Memento different from Command?** Memento stores state snapshots; Command stores actions.

7. **What is double dispatch in Visitor?** Two dynamic method calls: visitor type and element type determine behavior.

8. **When is Template Method better than inheritance?** When subclasses need to customize only specific steps.

9. **Can Observer be used with pull instead of push?** Yes; subscribers call methods on publisher to get data.

10. **How do you test behavioral patterns?** Mock dependencies; verify method calls and state transitions.

## Applied Project

**Build a notification system** that:
- Sends notifications via email, SMS, and in-app using Strategy.
- Routes notifications through approval chains (Chain of Responsibility).
- Logs actions (Command pattern with undo).
- Notifies multiple UI components (Observer pattern).

Suggested structure: `NotificationService` with `NotificationStrategy`, `ApprovalChain`, `CommandHistory`, and `NotificationObserver` interfaces. Test with 5 notification types and 3 delivery methods.

---

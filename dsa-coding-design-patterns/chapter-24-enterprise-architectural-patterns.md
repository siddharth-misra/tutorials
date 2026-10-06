# 24: Enterprise / Architectural Patterns

## Introduction and Context

Once you can solve problems correctly, the next challenge is structuring code so it is testable, maintainable, and scalable. Enterprise patterns are design solutions to recurring structural challenges: decoupling data access from business logic, managing dependencies, orchestrating complex workflows, and organizing systems at boundaries.

This chapter teaches six major patterns used in production systems: Dependency Injection (loose coupling), Repository (data abstraction), Unit of Work (transaction management), Specification (reusable queries), CQRS and Event Sourcing (read-write separation), and Domain-Driven Design (modeling by domain concepts). Then it covers three architectural styles that govern how systems are layered and organized.

The core skill is recognizing when a pattern solves a real structural problem versus when it adds unnecessary complexity.

## Core Intuition and Mechanics

- **Dependency Injection**: Objects receive their dependencies rather than creating them; enables testing and flexibility.
- **Repository**: Hide data access details; expose domain-friendly query methods.
- **Unit of Work**: Collect changes; commit or rollback atomically.
- **Specification**: Express business rules as composable objects.
- **CQRS**: Separate command (write) and query (read) models; independent scaling.
- **Domain-Driven Design**: Structure code by domain concepts; hide implementation.
- **Layered Architecture**: Input → Business Logic → Data → Persistence.
- **Hexagonal Architecture**: Core domain at center; adapters on boundaries.
- **Clean Architecture**: Innermost rule-driven; outermost implementation-driven.

## Core Concepts and Subtopics

### Concept Cluster: Decoupling and Dependency Management
Topics in this cluster:
- 24.1 Dependency Injection: Constructor injection; Setter injection and interface injection; IoC container basics
- 24.2 Repository Pattern: Data access abstraction; CRUD repository, aggregate repository, and ORM integration; Testability and boundary ownership
- 24.3 Unit of Work: Transaction boundary; Change tracking; Commit and rollback

#### Dependency Injection

Hard dependency: class creates its own collaborator.

```java
class OrderService {
    private UserRepository userRepository = new UserRepository(); // tight coupling
    
    void processOrder(Order order) {
        User user = userRepository.findById(order.userId);
        // ...
    }
}
```

Constructor Injection: collaborator passed in.

```java
class OrderService {
    private final UserRepository userRepository;
    
    OrderService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```

Setter Injection: set after construction.

```java
class OrderService {
    private UserRepository userRepository;
    
    void setUserRepository(UserRepository repo) {
        this.userRepository = repo;
    }
}
```

Interface Injection: interface defines setter.

```java
interface RepositoryInjector {
    void setUserRepository(UserRepository repo);
}

class OrderService implements RepositoryInjector {
    private UserRepository userRepository;
    public void setUserRepository(UserRepository repo) {
        this.userRepository = repo;
    }
}
```

IoC Container: Framework instantiates and wires dependencies.

```java
// Spring example (pseudocode)
@Component
class OrderService {
    @Autowired UserRepository userRepository; // auto-injected
}
```

**Benefit**: Testing uses mock repositories; production uses real ones. Same code, different dependencies.

#### Repository Pattern

Abstraction hides data access.

```java
interface UserRepository {
    User findById(String id);
    void save(User user);
    List<User> findByEmail(String email);
}

class InMemoryUserRepository implements UserRepository {
    private Map<String, User> users = new HashMap<>();
    public User findById(String id) { return users.get(id); }
    public void save(User user) { users.put(user.id, user); }
    public List<User> findByEmail(String email) {
        return users.values().stream().filter(u -> u.email.equals(email)).collect(toList());
    }
}

class JdbcUserRepository implements UserRepository {
    // same interface; implementation uses JDBC/SQL
}
```

Aggregate Repository: returns entire aggregate (Order with its Items).

```java
interface OrderRepository {
    Order findById(String id); // returns Order + all Items
    void save(Order order); // saves Order and Items atomically
}
```

#### Unit of Work

Tracks changes; commits atomically.

```java
class UnitOfWork {
    private Set<Entity> newEntities = new HashSet<>();
    private Set<Entity> dirtyEntities = new HashSet<>();
    private Set<Entity> removedEntities = new HashSet<>();
    
    void registerNew(Entity entity) { newEntities.add(entity); }
    void registerDirty(Entity entity) { dirtyEntities.add(entity); }
    void registerRemoved(Entity entity) { removedEntities.add(entity); }
    
    void commit() {
        insertNewEntities();
        updateDirtyEntities();
        deleteRemovedEntities();
    }
    
    void rollback() {
        newEntities.clear();
        dirtyEntities.clear();
        removedEntities.clear();
    }
}
```

### Concept Cluster: Domain Modeling and Query Patterns
Topics in this cluster:
- 24.4 Specification Pattern: Business rules composition; Reusable queries and predicate chaining; Repository plus specification collaboration
- 24.5 CQRS and Event Sourcing: Command model; Query model; Read write separation; Event-driven CQRS; Event store, replay, audit trail, and snapshotting; Consistency and operational trade-offs
- 24.6 Domain-Driven Design: Entity; Value object; Aggregate; Domain service; Repository in a DDD model; Bounded context

#### Specification Pattern

Encapsulate a business rule.

```java
interface Specification<T> {
    boolean isSatisfiedBy(T t);
    Specification<T> and(Specification<T> other);
    Specification<T> or(Specification<T> other);
}

class IsActiveSpecification implements Specification<User> {
    public boolean isSatisfiedBy(User u) { return u.isActive; }
    public Specification<User> and(Specification<User> other) { /* */ }
}

class HasEmailDomainSpecification implements Specification<User> {
    private String domain;
    public boolean isSatisfiedBy(User u) { return u.email.endsWith("@" + domain); }
}

// Compose
Specification<User> spec = new IsActiveSpecification()
    .and(new HasEmailDomainSpecification("example.com"));

List<User> matching = users.stream().filter(spec::isSatisfiedBy).collect(toList());
```

#### CQRS

Separate command and query models.

```java
// Command: writes; returns void or confirmation
interface OrderCommandService {
    void placeOrder(PlaceOrderCommand cmd);
}

// Query: reads; returns data
interface OrderQueryService {
    OrderDTO findOrder(String orderId);
    List<OrderSummaryDTO> listOrders(String userId);
}

// Command model: optimized for consistency, transactions
class OrderCommandServiceImpl {
    private OrderRepository orderRepo;
    public void placeOrder(PlaceOrderCommand cmd) {
        Order order = new Order(cmd.userId, cmd.items);
        orderRepo.save(order); // transactional write
    }
}

// Query model: optimized for read access (denormalized, cached)
class OrderQueryServiceImpl {
    private OrderViewRepository viewRepo; // pre-computed view
    public OrderDTO findOrder(String orderId) {
        return viewRepo.findById(orderId); // fast read
    }
}
```

Event Sourcing: Store events, replay to rebuild state.

```java
interface EventStore {
    void append(Event event);
    List<Event> getEvents(String aggregateId);
}

class Order {
    private String id;
    private List<Item> items;
    
    void reconstruct(List<Event> events) {
        for (Event e : events) {
            if (e instanceof ItemAddedEvent) {
                items.add(((ItemAddedEvent) e).item);
            }
        }
    }
}
```

#### Domain-Driven Design

**Entity**: Identity over time.

```java
class Order {
    private String id; // identity
    private List<Item> items;
    private OrderStatus status;
}
```

**Value Object**: No identity; immutable.

```java
class Money {
    private final BigDecimal amount;
    private final String currency;
    // immutable; equals/hashCode based on amount and currency
}
```

**Aggregate**: Cluster of related entities + value objects.

```java
class Order { // aggregate root
    private String id;
    private List<Item> items; // can only access via Order
    private Money total;
    
    void addItem(Item item) { items.add(item); } // enforce invariants
}
```

**Domain Service**: Stateless logic.

```java
class PricingService {
    Money calculateTotal(Order order, Tax tax) { /* */ }
}
```

**Bounded Context**: Clear boundary around a domain model.

```
// e-commerce context: Order, Item, Product
// inventory context: Stock, SKU, Warehouse
// Each has its own Repository, entities, language
// Conversation at boundaries (context map)
```

### Concept Cluster: Architecture Styles
Topics in this cluster:
- 24.7 Architectural Styles: Layered Architecture; Hexagonal Architecture; Clean Architecture; Ports and adapters; Entities, use cases, interface adapters, and frameworks; Choosing architecture by team size, boundaries, and rate of change

#### Layered Architecture

```
┌─────────────────────────────┐
│  Presentation (REST, Web)   │
├─────────────────────────────┤
│  Application (Use cases)    │
├─────────────────────────────┤
│  Domain (Business rules)    │
├─────────────────────────────┤
│  Infrastructure (DB, Queue) │
└─────────────────────────────┘
```

Each layer depends only downward. Tight horizontally; promotes reuse.

#### Hexagonal Architecture (Ports & Adapters)

```
       ┌─────────────────────┐
       │   Adapter: REST     │
       │   Adapter: CLI      │
       │   Adapter: GraphQL  │
       └────────┬────────────┘
                │ ports
       ┌────────▼────────┐
       │  Core Domain    │
       └────────┬────────┘
                │ ports
       ┌────────▼────────────┐
       │ Adapter: DB         │
       │ Adapter: Queue      │
       │ Adapter: Cache      │
       └─────────────────────┘
```

Core domain isolated; adapters pluggable. Good for evolving requirements.

#### Clean Architecture

Concentric circles: entities (innermost, rules), use cases, interfaces, frameworks (outermost).

**Benefit**: Core rules independent of framework; test business logic without web server.

---

## Worked Examples

### Worked Example 1: Dependency Injection for Testability

```java
interface UserRepository {
    User findById(String id);
}

class UserService {
    private final UserRepository repository;
    
    UserService(UserRepository repository) {
        this.repository = repository;
    }
    
    boolean isValidUser(String userId) {
        return repository.findById(userId) != null;
    }
}

// Test with mock
class TestUserService {
    @Test void testValidUser() {
        UserRepository mockRepo = userId -> userId.equals("123") ? new User("123") : null;
        UserService service = new UserService(mockRepo);
        assertTrue(service.isValidUser("123"));
    }
}
```

### Worked Example 2: Repository Hides Implementation

```java
interface PaymentRepository {
    void saveTransaction(Transaction txn);
    List<Transaction> findByUserId(String userId);
}

// In-memory: testing
class InMemoryPaymentRepository implements PaymentRepository {
    private Map<String, Transaction> txns = new HashMap<>();
    public void saveTransaction(Transaction txn) { txns.put(txn.id, txn); }
    public List<Transaction> findByUserId(String userId) { /* filter */ }
}

// Database: production
class JdbcPaymentRepository implements PaymentRepository {
    private DataSource ds;
    public void saveTransaction(Transaction txn) {
        String sql = "INSERT INTO transactions (id, userId, amount) VALUES (?, ?, ?)";
        try (Connection conn = ds.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, txn.id);
            stmt.setString(2, txn.userId);
            stmt.setBigDecimal(3, txn.amount);
            stmt.executeUpdate();
        }
    }
}
```

### Worked Example 3: CQRS with Event Sourcing

```java
// Event
class OrderPlacedEvent {
    String orderId;
    String userId;
    List<Item> items;
    Instant timestamp;
}

// Command handler
class PlaceOrderHandler {
    private EventStore eventStore;
    
    void handle(PlaceOrderCommand cmd) {
        Order order = new Order(cmd.userId, cmd.items);
        OrderPlacedEvent event = new OrderPlacedEvent(order.id, cmd.userId, cmd.items, Instant.now());
        eventStore.append(event);
    }
}

// Query side (eventually consistent)
class OrderViewUpdater {
    private OrderViewRepository viewRepo;
    
    void on(OrderPlacedEvent event) {
        OrderView view = new OrderView(event.orderId, event.userId, event.items);
        viewRepo.save(view);
    }
}
```

---

## Solved Problems

**Problem 1** (Easy): Implement a simple UserRepository interface with CRUD methods for both in-memory and JDBC implementations.

**Problem 2** (Easy): Create a Specification for "active users with email domain @company.com" and compose two Specifications with and/or.

**Problem 3** (Medium): Design a Unit of Work class tracking new, dirty, and removed entities; implement commit/rollback.

**Problem 4** (Medium): Build a CQRS OrderService with separate command and query paths; simulate eventually-consistent view updates.

**Problem 5** (Hard): Model an e-commerce domain with Order aggregate, Item value objects, OrderRepository, and InventoryService collaboration; include invariants.

---

## Recognition Guide

Use these patterns when:
- **DI**: Object creation logic is complex or tests need mocks.
- **Repository**: Data source may change or multiple sources exist.
- **Unit of Work**: Multiple entities must be saved atomically.
- **Specification**: Business rules are reused across queries.
- **CQRS**: Read and write load profiles differ significantly.
- **DDD**: Domain is complex; language clarity matters.
- **Layered**: Team is stable; domain is well-known.
- **Hexagonal**: Requirements evolve; need pluggable adapters.
- **Clean**: Long-term maintainability and testability are critical.

Avoid these patterns when:
- Simplicity is paramount; monolithic scripts suffice.
- Team is tiny; overhead outweighs benefits.
- System is largely data-driven; few business rules exist.

---

## Comparison Tables

| Pattern | Decoupling | Testability | Complexity | Use When |
|---------|-----------|-------------|-----------|----------|
| DI | High | High | Low | Multiple implementations needed |
| Repository | High | High | Medium | Data source varies |
| Unit of Work | Medium | Medium | Medium | Complex transactional logic |
| Specification | Medium | High | Medium | Reusable query rules |
| CQRS | High | Medium | High | Read/write asymmetry |
| DDD | Medium | Medium | High | Complex domain |

---

## Design and Decision Making

**When to apply patterns**: Start with simplicity. Add patterns only when actual problems arise (tight coupling, hard to test, complex queries).

**Pattern precedence**: DI and Repository are foundational; others build on them.

**Over-engineering**: Do not force CQRS into a CRUD application. Do not apply DDD to data ETL.

**Team fit**: Choose patterns your team understands and will maintain consistently.

---

## Practical Applications

- E-commerce: DDD models complex orders; CQRS separates write (placing order) from read (order history).
- Banking: Unit of Work ensures transactional consistency; Event Sourcing provides audit trail.
- SaaS: Layered or Hexagonal architecture allows features to evolve independently.
- Microservices: DDD defines bounded contexts; DI enables testing of service interactions.

---

## Failure Modes and Trade-offs

**Over-abstraction**: Too many layers kill productivity. Keep the critical paths simple.

**Eventual consistency**: CQRS introduces lag between command and view; ensure business can tolerate it.

**Repository leakage**: Repository still exposes implementation details via inefficient queries. Keep contracts domain-focused.

**Test brittleness**: Over-mocking hides real integration issues. Blend unit and integration tests.

---

## Condensed Notes

- **DI**: Constructor > setter; enables testing and flexibility.
- **Repository**: One interface, multiple implementations.
- **Unit of Work**: Batch changes; commit atomically.
- **Specification**: Composable business rules.
- **CQRS**: Read and write separate; optimize independently.
- **DDD**: Model by domain; enforce invariants in aggregates.
- **Layered**: Simple; tight horizontal coupling.
- **Hexagonal**: Ports and adapters; core independent.
- **Clean**: Core rules innermost; frameworks outermost.

---

## Additional Problems

**Easy**: (1) Implement CrudRepository, (2) Implement setter injection, (3) Create a Value Object for Money, (4) Write a simple Specification, (5) Design a basic Entity with identity.

**Medium**: (1) Build a Service using DI and Repository, (2) Implement Specification composition (and/or), (3) Design aggregate boundaries for a Blog (Post, Comment, Author), (4) Write a basic CQRS command handler, (5) Implement Unit of Work with in-memory store.

**Hard**: (1) Design a DDD model for a library system (Book, Author, Member, Lending), (2) Implement Event Sourcing for order state, (3) Build a CQRS OrderService with eventual consistency, (4) Design a Hexagonal architecture for a payment processor, (5) Model a bank account with invariants and transactions using DDD.

---

## Key Questions

1. **Why is constructor injection preferred over setter injection?** Immutability; all required dependencies known at construction time; avoids partially initialized objects.

2. **How does Repository pattern help testing?** Tests can inject a mock repository; no real database needed.

3. **What is the difference between Repository and Data Mapper?** Repository uses domain language; Mapper is lower-level, closer to schema.

4. **When should you use CQRS?** Read and write loads are asymmetric, or eventual consistency is acceptable.

5. **What is eventual consistency in CQRS?** Query updates lag behind commands; suitable for non-critical views.

6. **What is an aggregate in DDD?** Cluster of entities and value objects with one root (aggregate root) controlling access.

7. **How do you enforce invariants in DDD?** Put them in aggregate methods, not getters; validate before saving.

8. **What is a bounded context?** Boundary around a domain model; each context has own language, entities, repositories.

9. **Why use event sourcing?** Immutable audit trail; replay to debug; temporal queries.

10. **How do you choose between Layered, Hexagonal, and Clean?** Layered for simplicity; Hexagonal for evolving adapters; Clean for testability and rule isolation.

---

## Applied Project

**Project**: Build an Order Management System using multiple enterprise patterns.

**Features**:
- Place order (command): validates, applies business rules, saves to event store
- Query order (query): returns denormalized view
- Inventory check (domain service): reserves stock atomically
- Payment processing (external adapter): via pluggable payment gateway

**Architecture**: Hexagonal with DDD-modeled Order aggregate; DI for dependencies; Repository for persistence; Specification for filtering orders; CQRS-style command/query separation.

**Testing**: Unit test business rules (no DB); integration test with in-memory repository; contract test payment adapter.

===

These four chapters form a complete progression from DP foundations through enterprise architecture. Each chapter is self-contained while building toward mastery of both algorithmic and design problem-solving in Java.

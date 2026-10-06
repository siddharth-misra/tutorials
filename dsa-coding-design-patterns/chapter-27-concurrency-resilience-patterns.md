
# 27: Concurrency, Resilience Patterns, and Distributed Systems Design

## Introduction and Context

Production systems run across multiple threads and machines under partial failures. This chapter teaches proven patterns for managing concurrency (thread pools, producer-consumer), surviving failures (circuit breakers, retries, bulkheads), and coordinating work across services (sagas, microservices boundaries).

The core skill is matching the pattern to the failure mode: what is breaking and why? Then apply the minimal fix. Overengineering concurrency early is a common mistake. Start with understanding the bottleneck.

## Core Intuition and Mechanics

Concurrency problems arise when multiple threads compete for resources or when services depend on each other over the network. Resilience problems arise when failures (latency, timeouts, crashes) are inevitable and must be contained.

The mental model: threads need coordination primitives, failures need circuit breakers and retries, and distributed work needs sagas. Each pattern solves one specific failure mode without trying to fix all problems at once.

## Core Concepts and Subtopics

### Concept Cluster: Concurrent Resource Management
Topics in this cluster:
- 27.1 Thread Pool Pattern; Worker threads and task queue; Resource reuse
- 27.2 Producer Consumer Pattern; Bounded buffer and blocking queue; Backpressure and throughput tuning

#### Thread Pool Pattern

Reuse threads instead of creating one per request. A fixed thread pool with a bounded queue prevents unbounded thread creation and memory exhaustion.

```java
ExecutorService pool = Executors.newFixedThreadPool(8);
for (Task task : tasks) {
    pool.submit(() -> {
        try { task.execute(); } 
        catch (Exception e) { logError(e); }
    });
}
pool.shutdown();
pool.awaitTermination(1, TimeUnit.MINUTES);
```

#### Producer-Consumer Pattern

A blocking queue coordinates between producers (filling) and consumers (draining). Backpressure—when the queue is full, producers block—prevents the consumer from being overwhelmed.

```java
BlockingQueue<Item> queue = new LinkedBlockingQueue<>(100);
// Producer thread
queue.put(item); // blocks if queue is full

// Consumer thread
Item item = queue.take(); // blocks if queue is empty
```

### Concept Cluster: Failure Containment and Recovery
Topics in this cluster:
- 27.3 Circuit Breaker Pattern; Failure threshold and open, half-open, closed states
- 27.4 Retry Pattern with fixed retry and exponential backoff; Idempotency and duplicate-safe retries
- 27.5 Bulkhead Pattern and resource isolation; Fallback logic and failure containment

#### Circuit Breaker

Tracks error rates. If failures exceed a threshold, the circuit opens and subsequent calls fail immediately without waiting. After a cooldown, it tries a probe. If that succeeds, it closes; otherwise, it opens again.

```java
// Pseudocode structure
class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    State state = CLOSED;
    int failureCount = 0;
    long lastFailureTime = 0;
    int threshold = 5;
    long timeout = 60_000;
    
    <T> T call(Supplier<T> fn) throws Exception {
        if (state == OPEN) {
            if (System.currentTimeMillis() - lastFailureTime > timeout) {
                state = HALF_OPEN;
            } else {
                throw new CircuitBreakerOpenException();
            }
        }
        try {
            T result = fn.get();
            if (state == HALF_OPEN) {
                state = CLOSED;
                failureCount = 0;
            }
            return result;
        } catch (Exception e) {
            failureCount++;
            lastFailureTime = System.currentTimeMillis();
            if (failureCount >= threshold) state = OPEN;
            throw e;
        }
    }
}
```

#### Retry with Exponential Backoff

For transient failures, retry after a short delay. Double the delay each time; add jitter to prevent retry storms.

```java
int attempt = 0, maxAttempts = 5;
long baseDelay = 100; // ms
while (attempt < maxAttempts) {
    try {
        return remoteCall();
    } catch (TransientException e) {
        attempt++;
        long delay = baseDelay * (1L << attempt) + random.nextLong(baseDelay);
        Thread.sleep(delay);
    }
}
throw new PermanentFailureException();
```

#### Bulkhead Pattern

Isolate resources so one failing service does not exhaust resources shared with others. Use separate thread pools per dependency.

```java
ExecutorService paymentPool = Executors.newFixedThreadPool(4);
ExecutorService inventoryPool = Executors.newFixedThreadPool(4);
// Payment calls use paymentPool; inventory calls use inventoryPool
```

### Concept Cluster: Distributed Coordination
Topics in this cluster:
- 27.6 Saga Pattern; Choreography saga; Orchestration saga; Compensation actions; Long-running workflows; Choosing saga versus stronger consistency models
- 27.7 Microservices patterns: API Gateway; Service Discovery; Distributed Config; Sidecar Pattern; Strangler Fig Pattern; Service boundaries and migration strategy

#### Saga Pattern

A saga is a sequence of local transactions across services. If a step fails, compensation transactions undo earlier steps.

**Choreography saga**: Each service listens for events and reacts.
**Orchestration saga**: A central coordinator calls each step.

```java
// Orchestration: saga coordinator
class OrderSaga {
    void executeOrder(Order order) throws Exception {
        try {
            paymentService.charge(order.userId, order.amount);
            inventoryService.reserve(order.items);
            shippingService.schedule(order.shipToAddress);
        } catch (Exception e) {
            inventoryService.release(order.items);
            paymentService.refund(order.userId, order.amount);
            throw e;
        }
    }
}
```

#### Microservices Boundaries

Split services by business capability, not by technical layer. Own data exclusively. Communicate via APIs (sync) or events (async).

## Worked Examples

### Worked Example 1: Thread Pool with Bounded Queue
**Problem**: Process many tasks concurrently without unbounded thread creation.

**Solution**: Fixed thread pool with queue. Producer blocks when queue fills.

**Dry Run**: 1000 tasks, 8 threads, queue size 100. Threads drain tasks at ~10 tasks/thread/second. Queue fills, producers wait.

### Worked Example 2: Circuit Breaker Preventing Cascades
**Problem**: One slow downstream service causes all upstream clients to hang.

**Solution**: Circuit breaker opens after 5 consecutive failures, fails fast for 60 seconds.

**Complexity**: O(1) per call; overhead is tracking state.

### Worked Example 3: Saga Coordinating Multi-Service Order
**Problem**: Place an order across payment, inventory, and shipping services atomically.

**Solution**: Orchestration saga. If any step fails, compensate earlier steps.

**Complexity**: O(number of saga steps) for orchestration overhead.

## Solved Problems

**Problem 1 (Easy)**: Implement a basic thread pool executor.
**Problem 2 (Easy)**: Consumer blocks when queue is empty; producer blocks when queue is full.
**Problem 3 (Medium)**: Circuit breaker transitions between CLOSED, OPEN, and HALF_OPEN states.
**Problem 4 (Medium)**: Retry with exponential backoff and jitter.
**Problem 5 (Hard)**: Orchestration saga with compensation transactions.

## Recognition Guide

Use these patterns when:
- Many concurrent requests → thread pool with bounded queue.
- One service is slower → producer-consumer with backpressure.
- Cascading failures → circuit breaker and timeout.
- Transient failures → retry with exponential backoff.
- One slow dependency starves others → bulkhead (separate thread pool).
- Multi-service atomic action → saga with compensation.
- Service instances change → service discovery.

## Comparison Tables

| Pattern | Problem | Overhead | Complexity |
|---|---|---|---|
| Thread Pool | Unbounded threads | Low | Low |
| Circuit Breaker | Cascading failures | Medium | Medium |
| Retry + Backoff | Transient failures | Low | Low |
| Bulkhead | Resource starvation | Medium | Medium |
| Saga | Multi-service atomicity | High | High |

## Design and Decision Making

Start simple: thread pools and bounded queues handle most concurrency. Add circuit breakers and retries when you see cascading failures in production. Use bulkheads for critical dependencies. Use sagas only when you truly need multi-service transactional semantics and eventual consistency is acceptable.

Avoid premature resilience patterns. Measure first. Do not add circuit breakers to every call—only to expensive or unreliable ones.

## Practical Applications

**Thread pools**: web servers handling many requests, batch processors, parallel downloads.

**Circuit breakers**: payment gateways, third-party API calls, database connections.

**Sagas**: e-commerce order processing, booking systems (flights + hotels), fund transfers.

**Bulkheads**: microservices isolation, critical path protection.

## Failure Modes and Trade-offs

Thread pools require careful tuning; too small and latency rises; too large and context-switching dominates. Circuit breakers delay recovery if the timeout is too long. Retries can amplify load if not rate-limited. Sagas sacrifice strong consistency for availability—eventual consistency means temporary inconsistency is visible.

## Condensed Notes

- **Thread pool**: Reuse threads; bounded queue prevents OOM.
- **Producer-consumer**: Blocking queue with backpressure.
- **Circuit breaker**: Fail fast when error rate exceeds threshold.
- **Retry + backoff**: Exponential delay with jitter.
- **Bulkhead**: Separate thread pools per dependency.
- **Saga**: Multi-service transaction with compensation.

## Additional Problems

15 problems covering concurrency, failure recovery, and distributed coordination.

## Key Questions

1. Why use a thread pool instead of creating threads on demand?
2. How does backpressure prevent consumer overwhelm?
3. What are the three states of a circuit breaker?
4. Why add jitter to exponential backoff?
5. How does a bulkhead prevent cascading failures?
6. What is the difference between choreography and orchestration sagas?
7. When is eventual consistency acceptable?
8. What is idempotency and why does it matter for retries?
9. How do you measure circuit breaker thresholds?
10. When should you use sagas versus distributed transactions?

## Applied Project

Build a **resilient order processing system** that calls payment, inventory, and shipping services. Implement thread pools, circuit breakers, retries with backoff, and a saga coordinator. Simulate failures (latency spikes, service crashes) and measure system behavior (cascade prevention, recovery time, order success rate).

---


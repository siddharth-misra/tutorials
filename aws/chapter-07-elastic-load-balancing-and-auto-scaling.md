# 7: Elastic Load Balancing and Auto Scaling

Most production applications cannot depend on one server. Elastic Load Balancing spreads incoming traffic across multiple targets, and Auto Scaling adjusts capacity when demand changes or when instances fail.

This chapter shows how these services help keep applications available and responsive. You will learn why health checks, target groups, and scaling rules are important, and how AWS uses them to replace unhealthy compute and add or remove capacity automatically.

---

## 7.1 Why This Layer Matters

One EC2 instance can run an application. It cannot provide a serious availability story on its own.

Real workloads need two capabilities:

- traffic distribution so users are not pinned to one server
- capacity adjustment so the system can react to load and failure

Elastic Load Balancing and Auto Scaling solve these problems together.

Without them, common failure modes become severe:

- one instance failure becomes an outage
- traffic spikes overload the fixed server count
- deployments require manual replacement and risky handoffs

This chapter turns EC2 from single-server compute into a more resilient application tier.

---

## 7.2 Elastic Load Balancing Overview

Elastic Load Balancing, or ELB, is a family of managed traffic distribution services.

The main modern options are:

- Application Load Balancer, or ALB, for HTTP and HTTPS traffic with Layer 7 routing features
- Network Load Balancer, or NLB, for very high-performance Layer 4 traffic using TCP, UDP, and TLS patterns
- Gateway Load Balancer, or GWLB, for specialized inline network appliance scenarios

For most web applications, the first design choice is between ALB and NLB.

That decision affects more than protocol support. It affects where routing logic lives, how much application awareness the traffic layer has, and what kind of observability or request control you can apply at the edge.

As a rule:

- choose ALB when you need request-aware routing based on host, path, or HTTP behavior
- choose NLB when you need very high throughput, static IP behavior, or non-HTTP transport handling

Most beginner architectures start with ALB.

---

## 7.3 Listeners, Rules, Target Groups, and Health Checks

A load balancer is easier to understand when broken into its moving parts.

### Listeners

A listener waits for traffic on a protocol and port, such as HTTPS on port 443.

This is where front-end traffic first enters the load balancer, and it is often where TLS handling, redirect behavior, and the first routing decision begin.

### Rules

Rules decide how matching requests should be handled.

Examples:

- send `/api/*` to the API target group
- send `admin.example.com` to an admin service

### Target groups

Target groups are the backend destinations.

Targets may include:

- EC2 instances
- IP addresses
- Lambda functions in ALB-specific cases

Target groups are important because they let one load balancer route different request classes to different backend pools. That separation is useful for versioned services, admin paths, API tiers, and staged migrations.

### Health checks

Health checks determine whether a target should receive traffic.

This is critical. A server that is technically running but returning errors should not stay in the active serving pool.

Health checks are one of the main ways AWS helps remove bad capacity before users feel the full effect.

The design of the health check matters as much as the existence of the health check. If it checks only whether a process is listening, it may continue sending traffic to an application that cannot reach its database, cannot load configuration, or is returning failures for real user requests.

![ELB request routing flow from listener to rules engine to target groups, showing health checks removing unhealthy targets from traffic rotation.](images/ch07-elb-request-routing-flow.svg)

---

## 7.4 Application Load Balancer

ALB is built for modern web applications.

It is a strong choice when you need:

- path-based routing
- host-based routing
- central TLS termination
- integration with multiple application target groups
- HTTP-aware behavior and observability

ALB is also useful when one public endpoint needs to front multiple services. Instead of placing a separate public entry point in front of every service, you can centralize entry and steer traffic based on request attributes.

Typical pattern:

- ALB in public subnets across multiple Availability Zones
- application instances in private subnets
- security groups allowing traffic from the ALB to the application tier only

This pattern improves security because application instances do not need direct internet exposure.

The main architectural trade-off is that HTTP-aware routing is powerful, but it also means the design now depends on well-defined request paths, headers, and service ownership boundaries. If routing rules grow without discipline, the edge layer becomes difficult to reason about.

ALB is often the default answer for web front ends, but not every workload is an HTTP application. That is where NLB becomes more relevant.

---

## 7.5 Network Load Balancer

NLB operates at Layer 4 and is optimized for high-performance network traffic.

It is useful when you need:

- TCP or UDP handling
- very high connection volumes
- lower-level transport behavior
- static IP style requirements

This makes NLB attractive for protocols that do not benefit from HTTP-aware routing or for systems that require transport-level performance characteristics more than application-layer features.

Compared with ALB, NLB is less focused on application-layer routing logic and more focused on efficient connection handling.

Architectural trade-off:

- ALB gives richer HTTP routing features
- NLB gives simpler, faster transport-level handling for the right use cases

Choose based on traffic type and routing needs, not habit.

In other words, start from the protocol and failure model of the workload, not from what was used in the last project.

---

## 7.6 Auto Scaling Groups

An Auto Scaling Group, or ASG, manages a fleet of instances as a group instead of as unrelated machines.

An ASG defines:

- where instances launch
- which launch template they use
- the minimum number of instances
- the desired number of instances
- the maximum number of instances

The ASG can then:

- launch new instances when capacity is too low
- terminate instances when capacity is too high
- replace unhealthy instances automatically

This replacement behavior is one of the most valuable features. It means the service can recover from individual host failure without requiring operators to rebuild the machine by hand.

This is a major shift in mindset. You stop managing server identity and start managing fleet behavior.

It also means instance readiness matters. If new instances take too long to bootstrap, register, warm caches, or become healthy, scaling may be technically happening while user experience still degrades.

---

## 7.7 Launch Templates and Capacity Boundaries

Auto Scaling needs a launch definition, and modern AWS practice uses launch templates for that purpose.

A launch template usually captures:

- AMI choice
- instance type
- security groups
- IAM role
- storage configuration
- user data and startup behavior

The goal is repeatability. If replacement instances do not launch with the same essential configuration, Auto Scaling becomes a source of drift instead of a source of resilience.

The min, desired, and max values in the ASG matter operationally:

- minimum keeps a floor under your capacity
- desired is what the group tries to maintain now
- maximum prevents unbounded scale-out and surprise cost growth

These values also affect recovery behavior. If desired capacity is too low, the service may technically be healthy but unable to meet normal demand. If minimum capacity is set to one for a supposedly resilient service, then the service still has a single-instance baseline weakness.

If the maximum is set unrealistically high, a bad scaling trigger can produce a large bill. If it is set too low, legitimate demand spikes may still cause outages.

Capacity boundaries are a reliability control and a cost control at the same time.

---

## 7.8 Scaling Policies and Metrics

An ASG needs a reason to scale.

Common triggers include CloudWatch metrics such as:

- average CPU utilization
- request count per target
- custom application metrics

Common policy styles include:

- target tracking to keep a metric near a target value
- step scaling for larger reactions at different thresholds
- scheduled scaling for known predictable demand windows

There is always some delay in scaling. Metrics must rise, policies must evaluate, new instances must launch, bootstrap must finish, and health checks must pass.

Because of that delay, scaling policy design should consider lead time, not just steady-state utilization.

Good scaling depends on choosing a metric that matches real pressure.

Examples:

- CPU may work for compute-bound services
- request or concurrency metrics may be better for web traffic
- queue depth may be better for worker fleets

If the metric does not reflect user impact, the group may scale too late or in the wrong direction.

This is why many mature systems combine multiple signals. For example, request volume might indicate incoming demand while response time or queue depth indicates that the service is no longer keeping up.

---

## 7.9 Multi-AZ Patterns and Safe Operations

The strongest baseline pattern is simple:

- load balancer across multiple Availability Zones
- Auto Scaling Group spanning multiple Availability Zones
- private application instances behind the load balancer
- health checks removing bad capacity automatically

This design helps with:

- instance failure
- localized Availability Zone failure
- traffic surges
- safer rolling updates when new instances can come online before old ones are removed

It also supports a safer deployment model. If the fleet is spread across multiple healthy targets, new versions can be introduced gradually instead of replacing the full serving pool in one risky step.

Solutions architect checkpoint:

- Can the application survive losing one instance?
- Can it survive losing one Availability Zone?
- Are health checks meaningful, not just checking whether a process port is open?
- Does scale-out improve throughput, or is the database or shared dependency the real bottleneck?
- How long does a replacement instance take before it can serve production traffic safely?
- Is session handling compatible with a distributed multi-instance model?

Auto Scaling is not magic. It only helps if the rest of the architecture can absorb additional instances usefully.

State is the common trap. If user session state, temporary files, or application assumptions are pinned to one server, adding more instances may spread traffic while still producing inconsistent behavior.

![Multi-AZ Auto Scaling pattern with ALB traffic distribution and unhealthy instance replacement to maintain desired fleet capacity.](images/ch07-asg-multi-az-replacement.svg)

---

## 7.10 Common Mistakes

- running a production application behind no load balancer at all
- treating the load balancer as a dumb pass-through when routing and health policy are actually core design choices
- using health checks that only prove the server is alive, not that the app is healthy
- defining health checks so deeply that they become noisy and unstable under minor dependency issues
- placing all instances in one Availability Zone
- assuming Auto Scaling will fix a slow database or a locked shared dependency
- choosing CPU-based scaling for workloads where CPU is not the real pressure signal
- expecting new capacity to help immediately without accounting for bootstrap and registration delay
- setting max capacity too low for demand spikes or too high for cost safety
- putting instances in public subnets when a private tier behind a load balancer is safer
- keeping session or application state tied to one instance in a fleet that is supposed to be replaceable
- treating instance replacement as exceptional instead of normal fleet behavior

---

## 7.11 Hands-On Tasks

1. Draw a two-Availability-Zone web application with an ALB and an Auto Scaling Group.
2. Identify which components belong in public subnets and which belong in private subnets.
3. Define one listener and two example rules for host-based or path-based routing.
4. Describe a useful health check path for a web application and explain why a shallow check may be misleading.
5. Choose min, desired, and max capacity values for a small production service and justify them.
6. Pick one scaling metric for a web tier and explain why it reflects demand.
7. Explain one workload where NLB is a better fit than ALB.
8. Describe what happens if one instance becomes unhealthy while traffic is active.
9. Trace how a new instance moves from launch to healthy traffic serving inside an Auto Scaling Group.
10. Choose one health check that is too shallow and one that is too deep, then explain the failure risk in each case.
11. Describe a workload where scaling on queue depth is better than scaling on CPU.
12. Explain why a stateful session model can make horizontal scaling harder even when the infrastructure layer is correct.

---

## 7.12 Recap

- Load balancers spread traffic and help isolate users from individual server failures.
- ALB is usually the default for HTTP and HTTPS applications, while NLB fits lower-level transport needs.
- Target groups, listeners, rules, and health checks together define how traffic is classified and where it goes.
- Auto Scaling Groups manage fleets, not individual pets.
- Launch templates define consistent replacement behavior, and instance readiness affects how useful scaling really is.
- Scaling policies only work well when the chosen metrics match real workload pressure and when scale-out delay is accounted for.
- Multi-AZ load balancing and fleet replacement are baseline reliability patterns, not advanced extras.

Next: Route 53 and DNS Routing.
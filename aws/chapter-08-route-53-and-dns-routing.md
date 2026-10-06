# 8: Route 53 and DNS Routing

The Domain Name System (DNS) is what turns names people use into destinations computers can reach. Amazon Route 53 is AWS's DNS service, and it plays a major role in how users find your applications and how traffic is directed during normal operation or failure.

This chapter explains why DNS is more than a simple naming tool. You will learn how hosted zones, records, alias targets, health checks, and routing policies are used to send users to the right endpoint with the right balance of speed, availability, and control.

---

## 8.1 Why DNS Matters

Users do not type IP addresses into applications. They use names.

That makes DNS a control plane for availability, latency, and change management.

When DNS is designed well:

- users reach the right endpoint
- service migrations become easier
- failover can happen with less manual intervention
- infrastructure can change without exposing raw addressing details

When DNS is designed badly:

- traffic may route to the wrong place
- failover expectations may be unrealistic
- cached records can keep users on unhealthy paths longer than expected

For a solutions architect, DNS is not just naming. It is traffic steering under real-world caching behavior.

That last part matters because DNS is indirect control. You publish answers, but recursive resolvers, client caches, and applications decide when those answers are re-queried. Good DNS design starts with that limitation rather than assuming immediate global consistency.

---

## 8.2 What Route 53 Does

Amazon Route 53 is AWS's managed DNS service.

It handles several core functions:

- domain registration in supported cases
- authoritative DNS hosting through hosted zones
- health checks for selected endpoints
- routing policies that influence how answers are returned

Route 53 does not replace the rest of the application stack. It answers naming and routing questions at the DNS layer, but it does not ensure that the underlying workload is correctly deployed, consistent across regions, or ready for production traffic.

Route 53 is global in scope, but it usually points users toward regional resources such as load balancers, EC2-backed endpoints, or S3-based websites.

That means you need to distinguish between the global control plane and the regional systems that actually serve the traffic.

---

## 8.3 Hosted Zones and Delegation

A hosted zone stores the DNS records for a domain or subdomain.

The two main hosted zone types are:

- public hosted zones for internet-resolvable names
- private hosted zones for names used inside one or more VPCs

This distinction matters operationally. A public hosted zone controls what the internet sees. A private hosted zone controls what selected VPC environments resolve internally. They may use similar names, but they serve different audiences and trust boundaries.

If you manage `example.com`, a public hosted zone can contain records such as:

- `www.example.com`
- `api.example.com`
- `admin.example.com`

Delegation matters because DNS is hierarchical. If you want Route 53 to answer for your domain, your registrar must point the domain's name server records to the Route 53 hosted zone name servers.

That means there are two separate configuration layers:

- the hosted zone and its records inside Route 53
- the parent delegation that tells resolvers Route 53 is authoritative

If delegation is wrong, the records inside Route 53 can be perfectly configured and still never be used.

This is one of the most common beginner problems in DNS work. Teams edit the child zone correctly and then troubleshoot the wrong layer because the parent still points somewhere else.

![Route 53 delegation and DNS resolution flow from user query to recursive resolver, parent DNS delegation, hosted zone answer, and AWS alias target.](images/ch08-route53-delegation-resolution.svg)

---

## 8.4 Record Types and Alias Records

Route 53 supports standard DNS record types such as:

- `A` and `AAAA` for IPv4 and IPv6 answers
- `CNAME` for canonical name mappings
- `MX` for mail routing
- `TXT` for verification and policy data

AWS-specific design often centers on alias records.

Alias records let Route 53 point a name at certain AWS resources such as:

- Application Load Balancers
- Network Load Balancers
- CloudFront distributions
- S3 static website endpoints in supported patterns

Why alias matters:

- it works at the zone apex where a plain `CNAME` would be problematic
- it hides endpoint address changes behind a stable name
- it fits AWS-managed targets cleanly

That apex behavior is especially important for names such as `example.com`, where you often want the root domain to point to an AWS-managed entry point without violating normal DNS constraints.

For many AWS architectures, the public entry point is an alias record pointing to a load balancer.

Architecturally, that gives you a stable DNS name even when the underlying AWS-managed target changes over time.

---

## 8.5 Public and Private DNS

Public DNS answers requests from the public internet. Private DNS answers requests only from associated VPC environments.

Private hosted zones are useful for internal service discovery patterns such as:

- `api.internal.example.local`
- `payments.service.prod`

This separation is important because internal names and public names often have different security and routing goals.

Examples:

- public users resolve `app.example.com` to an internet-facing ALB
- internal application components resolve `db.internal.example.com` to a private endpoint

Some architectures also use the same service concept in both public and private namespaces, but they should still be explicit about which clients resolve which records. If that separation is informal instead of designed, troubleshooting becomes difficult and security boundaries become unclear.

Do not mix internal and public naming casually. Clear boundaries reduce both confusion and accidental exposure.

---

## 8.6 Time to Live, Caching, and Propagation Reality

DNS answers are cached.

That means changes are not seen everywhere immediately, even when Route 53 updates quickly.

The record's time to live, or TTL, influences how long resolvers may cache the answer before asking again.

Implications:

- shorter TTLs can make changes visible sooner, but they increase query frequency
- longer TTLs reduce query churn, but they slow cutovers and failover responsiveness

This is why operational cutovers often begin before the actual migration event. Teams sometimes lower TTLs ahead of a planned DNS change so caches age out faster when the new answer is published.

Important nuance:

- DNS is not an instant failover mechanism
- client resolvers, intermediary caches, and application behavior all affect when users observe a change
- some clients or networks may behave less predictably than the nominal TTL suggests

Architects should set TTLs based on the expected rate of change and the acceptable failover lag, not by habit.

---

## 8.7 Health Checks and DNS Failover

Route 53 health checks let DNS answers depend on endpoint health.

This is useful for:

- active-passive regional failover
- validating whether a public endpoint should stay in rotation
- routing away from unhealthy application entry points

However, health checks have limits:

- they observe from the outside, not from inside every client network path
- they cannot override cached answers already held by resolvers
- they only help if the failover target is actually ready to serve traffic

They also depend on the quality of the health signal. If the check only verifies that a front-end endpoint answers TCP or HTTP, it may miss application-level failure deeper in the stack.

DNS failover is therefore part of a broader recovery design, not a complete recovery design by itself.

If the standby environment is stale, misconfigured, or overloaded, DNS can successfully route users to failure faster.

That is why failover planning must include data replication, dependency readiness, capacity validation, and recovery testing, not only a routing rule.

---

## 8.8 Routing Policies and How to Choose

Route 53 supports multiple routing policies. The important question is when to use each one.

### Simple routing

Use when a single healthy endpoint is enough and no special distribution behavior is needed.

### Weighted routing

Use when you want controlled traffic splitting.

Good for:

- gradual migrations
- canary-style traffic shifts
- reducing traffic to an older endpoint without cutting it off instantly

Weighted routing is useful because it lets you change traffic allocation deliberately instead of treating migration as a single irreversible cut.

### Latency-based routing

Use when users in different geographies should be directed to the region that gives the lowest latency among the configured healthy options.

This improves user experience only if the regional backends are actually prepared to serve the traffic they receive. Lower-latency routing does not solve data locality or cross-region consistency by itself.

### Failover routing

Use when you have a primary endpoint and a standby endpoint for recovery.

This is usually the clearest choice when the architecture has a deliberate primary region and a recovery region with different operational roles.

Other specialized policies exist, but these are enough to build a strong mental model early.

The decision should be driven by workload behavior:

- do you need controlled distribution, lower latency, or explicit standby behavior?

![Route 53 routing policy selection map for simple, weighted, latency, and failover routing, highlighting TTL caching effects on visible cutover speed.](images/ch08-routing-policies-and-failover.svg)

---

## 8.9 DNS Design Patterns for AWS Architectures

Common AWS patterns include:

- `app.example.com` aliasing to an ALB for a regional web application
- `api.example.com` using weighted routing during a blue-green migration
- latency-based routing across multiple regional entry points
- failover routing from a primary region to a warm standby region

Another useful mental model is to decide whether DNS is being used for:

- stable naming
- traffic distribution
- migration control
- regional recovery

One record can sometimes serve more than one purpose, but the design is clearer when you know the primary goal.

Solutions architect checkpoint:

- Is DNS being used to hide infrastructure changes behind a stable name?
- Are TTL values aligned with expected failover or migration speed?
- Does the health-check strategy reflect real application health?
- If multiple regions are used, are data consistency and backend readiness also solved, or only the routing layer?
- Is the parent delegation correct, or is the problem outside the hosted zone itself?
- Are public and private consumers intentionally separated?

DNS should support the architecture, not pretend to replace the rest of it.

---

## 8.10 Common Mistakes

- assuming DNS changes are visible to all users immediately
- confusing hosted zone creation with successful registrar delegation
- lowering or raising TTLs without understanding how that affects cutover behavior
- using public DNS names for internal-only services without clear reason
- treating a `CNAME` and an alias record as interchangeable in every case
- assuming DNS health checks prove the full application stack is healthy
- relying on DNS failover without validating the standby environment
- choosing routing policies without understanding the user traffic pattern
- setting TTLs without considering operational cutover and cache behavior
- trying to solve application consistency problems only at the DNS layer
- forgetting that load balancers and other AWS targets may be regional even when Route 53 is global

---

## 8.11 Hands-On Tasks

1. Define a public hosted zone layout for `example.com` with `www`, `api`, and `admin` subdomains.
2. Explain which of those names should probably point to a load balancer.
3. Describe when you would use an alias record instead of a standard `CNAME`.
4. Design a private hosted zone for internal service names used only inside a VPC.
5. Choose TTL values for a stable production website and for a service you expect to migrate soon, then explain the trade-off.
6. Describe a primary and standby regional design that uses Route 53 failover routing.
7. Explain why health checks alone do not guarantee a successful recovery.
8. Choose between simple, weighted, latency-based, and failover routing for four different example scenarios.
9. Write down the two layers you would verify when a Route 53 hosted zone looks correct but the domain still resolves elsewhere.
10. Describe when a zone apex alias record is necessary and why a normal `CNAME` is not the right choice there.
11. Plan a blue-green migration using weighted routing and explain how TTL affects the rollback story.
12. Describe one case where DNS should point to a stable application entry point and one case where internal-only service names should stay private.

---

## 8.12 Recap

- Route 53 is AWS's managed DNS service and a major traffic steering layer.
- Hosted zones define where Route 53 is authoritative, but delegation must also be correct.
- Alias records are central to many AWS architectures because they integrate cleanly with AWS-managed targets and work well at the zone apex.
- Public and private DNS serve different audiences and should stay intentionally separated.
- TTL and caching behavior shape how fast changes and failovers are observed, so DNS cutovers must be planned rather than assumed.
- Health checks and routing policies support availability goals, but they do not replace a real recovery design.
- DNS is most effective when it works with sound regional, application, and data architecture decisions.

Next: S3 Object Storage.
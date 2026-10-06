# 26: WAF, Shield, and Cognito

Internet-facing applications need protection at both the network edge and the user identity layer. AWS Web Application Firewall (AWS WAF), AWS Shield, and Amazon Cognito each solve a different part of that problem.

This chapter explains how these services fit into a practical security architecture. You will learn how AWS WAF filters web requests, how Shield helps with Distributed Denial of Service (DDoS) protection, and how Cognito manages user sign-in, authentication, and identity flows for applications.

---

## 26.1 Why These Services Matter

By the time a workload is internet-facing, network reachability alone is not the problem.

The real questions become:

- How do we filter malicious or unwanted requests?
- How do we reduce exposure to distributed denial-of-service attacks?
- How do we authenticate end users without building identity infrastructure from scratch?

AWS WAF, AWS Shield, and Amazon Cognito address different parts of that problem space.

- WAF filters web requests using rule logic.
- Shield helps protect against distributed denial-of-service, or DDoS, attacks.
- Cognito manages application user identity, authentication, and token issuance.

These are not interchangeable services. Together they form part of the outer security layer for web applications and APIs.

---

## 26.2 AWS WAF Fundamentals

AWS WAF sits in front of supported web entry points and evaluates requests against rules.

Common placements include:

- CloudFront distributions
- Application Load Balancers
- API Gateway APIs

WAF is useful when you need to control request patterns before they reach your application.

Examples:

- blocking known bad IP ranges
- filtering obvious exploit patterns such as SQL injection or cross-site scripting attempts
- rate limiting abusive clients
- enforcing request size or header expectations for certain paths

WAF is not a magic shield that understands all business logic abuse. It is a request-filtering layer. Its strength comes from applying predictable rules early and consistently.

---

## 26.3 Rule Types, Managed Rules, and Tuning

WAF rules can be custom or managed.

### Custom rules

These are useful when you know your application behavior and want to encode environment-specific protections.

Examples:

- block requests missing expected headers
- limit requests to sensitive paths
- allow only certain HTTP methods for a route

### Managed rules

AWS-managed or partner-managed rule groups provide broader protection for common web attack patterns. They can accelerate a baseline posture, especially for teams that do not want to write every rule from scratch.

But managed rules still need tuning. If you enable a rule group blindly, you may block legitimate requests or create operational confusion. WAF should usually be deployed with a learning period, visibility, and staged enforcement where practical.

Security controls that break good traffic are not mature controls. They are untested assumptions.

---

## 26.4 Rate Limiting, Bot Friction, and Edge Filtering

One of WAF's most practical benefits is request-volume control.

Rate-based rules can help absorb simple abuse patterns such as credential stuffing attempts, scraping, or bursty nuisance traffic that would otherwise consume application resources.

This matters because many application attacks are not sophisticated exploits. They are economic attacks on capacity, cost, or user experience.

WAF can also support bot mitigation and geo- or reputation-based filtering depending on your requirements and service placement. The main design principle is to reject bad or suspicious traffic as early as possible so downstream systems spend less time and money handling it.

---

## 26.5 AWS Shield Fundamentals

AWS Shield focuses on DDoS protection.

At a high level, DDoS attacks try to exhaust network or application capacity so legitimate users cannot access the system.

AWS provides:

- Shield Standard, included automatically for many AWS customers and services
- Shield Advanced, which adds stronger protections, visibility, and response support for higher-risk workloads

Shield is especially relevant for internet-facing services such as CloudFront, Route 53, Global Accelerator, and load-balanced applications.

Architects should understand that DDoS resilience is not delivered by one service alone. It also depends on distribution, scaling, caching, traffic shaping, and the chosen public entry points.

---

## 26.6 What Shield Does and Does Not Solve

Shield helps at the network and transport protection layers, but it does not replace application-aware defenses.

That means:

- Shield can help absorb volumetric attack patterns.
- WAF helps filter malicious HTTP or HTTPS request patterns.
- Your application still needs authentication, authorization, rate controls, and efficient request handling.

This layered view matters. Teams sometimes assume that because a service is on AWS, application-level abuse is automatically controlled. That is false. A system can survive a large network flood and still fail under expensive but valid-looking application requests.

Good designs combine distribution services, Shield coverage, WAF rules, and application-level protections rather than expecting one control to do everything.

---

## 26.7 Amazon Cognito Fundamentals

Amazon Cognito solves a different problem: user identity for applications.

Cognito is used when applications need to:

- register users
- sign users in
- issue tokens to clients
- integrate with identity providers
- manage sessions and user pools without building custom identity services from scratch

Cognito is commonly used for web and mobile applications, especially when the workload needs standards-based authentication flows and token issuance.

It is important to separate Cognito from IAM. IAM manages AWS workforce and workload access to AWS resources. Cognito manages end-user identity for your application.

If you blur those boundaries, the identity model quickly becomes confusing and unsafe.

---

## 26.8 Authentication Flows, Federation, and Token Boundaries

Identity design is not only about login screens. It is about trust boundaries.

Architects need to understand:

- where authentication happens
- where tokens are issued
- how applications validate tokens
- how external identity providers fit into the flow

Cognito can support local user directories and federation with external identity providers. This is useful when applications need to integrate with enterprise identity, social login, or centralized customer identity patterns.

But identity design must stay disciplined:

- keep token scopes tight
- define session duration intentionally
- separate authentication from application authorization logic
- protect sensitive user flows such as password reset and multi-factor authentication enrollment

Cognito reduces the amount of identity infrastructure you build yourself, but it does not remove the need to reason carefully about authentication and authorization.

---

## 26.9 Layered Protection Pattern for Internet-Facing Apps

![Layered defense pattern combining WAF filtering, Shield DDoS protection, Cognito identity, and protected backend APIs.](images/ch26-waf-shield-cognito-layered-defense.svg)

A common AWS protection pattern looks like this:

- CloudFront or another edge entry point handles global traffic distribution
- Shield provides DDoS resilience at the AWS edge and service boundary
- WAF filters malicious or abusive request patterns
- Cognito authenticates legitimate users
- the application enforces authorization, business rules, and service-specific rate control

This layered approach reduces blast radius and clarifies responsibility at each stage.

It also improves cost control. Blocking bad traffic at the edge is usually cheaper than letting it consume application compute, queue capacity, or downstream database resources.

---

## 26.10 Common Mistakes

- assuming WAF alone provides complete application security
- enabling managed rule groups without tuning and then breaking legitimate traffic
- relying on Shield while ignoring application-layer abuse patterns
- confusing Cognito with IAM and mixing end-user identity with AWS administrative access
- treating authentication as sufficient without designing authorization separately
- failing to rate-limit high-risk routes such as login, signup, and password-reset paths
- placing security controls only near the application instead of filtering suspicious traffic earlier
- ignoring observability for blocked requests, authentication failures, and attack patterns

---

## 26.11 Hands-On Tasks

1. List three request patterns that should be considered for WAF rules on a public API.
2. Explain the difference between a DDoS protection problem and an application abuse problem.
3. Describe when Shield Advanced may be justified compared with relying only on baseline AWS protections.
4. Sketch an authentication flow for a web application that uses Cognito and tokens.
5. Explain why login success does not remove the need for application-level authorization checks.

---

## 26.12 Recap

WAF filters web requests, Shield strengthens DDoS resilience, and Cognito manages end-user identity. Together they protect different layers of an internet-facing AWS application. Strong architectures treat them as complementary controls within a broader security design that also includes authorization, monitoring, scaling, and safe operational practices.

Next: 27: Backup and Disaster Recovery

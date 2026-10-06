# 24: API-First and Multi-Tenant Platform Design

Modern payment platforms increasingly expose capabilities through APIs so banks, fintechs, and enterprises can launch products without rebuilding core rails from scratch. Once several clients share the same platform, design questions around tenancy, isolation, permissions, and versioning become central instead of optional.

This chapter explains API-first and multi-tenant thinking as a way to scale both product delivery and platform safety. It focuses on the boundaries that matter most: contract design, tenant isolation, entitlement control, and change management.

---

## 24.1 API-First Mindset

API-first means platform capabilities are designed as reusable contracts, not hidden implementation details.

Benefits:

- faster partner integration,
- clearer ownership boundaries,
- easier platform extensibility.

---

## 24.2 API Style Choices

- **REST:** Widely adopted, resource-oriented.
- **SOAP:** Common in some enterprise legacy contexts.
- **GraphQL:** Flexible query model for client-driven data needs.
- **gRPC:** Efficient binary protocol for service-to-service communication.

Use-case fit is more important than trend-following.

---

## 24.3 Webhooks and Event APIs

Webhooks enable async notifications to partners.

Design needs:

- signature validation,
- retry semantics,
- idempotent consumer patterns,
- replay protection.

---

## 24.4 Platform Security Controls

Common controls include:

- OAuth 2.0 authorization,
- JWT token validation,
- mTLS where needed,
- granular scopes and entitlements,
- strong audit logging.

---

## 24.5 Multi-Tenant Design

Multi-tenant platforms serve many clients while preserving isolation.

Isolation dimensions:

- data,
- compute/resource limits,
- configuration,
- access control and operations.

---

## 24.6 Versioning and Compatibility

Stable versioning policy prevents partner breakage.

Good practices:

- clear deprecation timelines,
- backward compatibility where feasible,
- migration guides and sandboxes.

---

## 24.7 Common Mistakes

1. No tenant isolation threat model.
2. Unbounded customizations per client.
3. Breaking API changes without migration support.

---

## 24.8 Glossary

- **OAuth 2.0:** Authorization framework for delegated access.
- **JWT:** JSON Web Token used for conveying claims.
- **Entitlement:** Permission to use specific feature/action.
- **mTLS:** Mutual TLS with both client and server authentication.

---

## 24.9 Resources

- OAuth standard: https://oauth.net/2/
- OWASP API security: https://owasp.org/www-project-api-security/

---

## 24.10 Recap

- API-first design is core to platform scale.
- Security and tenant isolation must be built into contracts and architecture.
- Versioning discipline protects ecosystem trust.

Next: Languages, Frameworks, and Service Development.
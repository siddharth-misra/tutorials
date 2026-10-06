## 10: Security Design

### What Is Security Design?

Security in distributed systems is not a single feature — it is a layered system that spans identity, transport, application logic, data storage, and operations. Every layer must be independently secured because a failure in any one layer can compromise the entire system.

Think of it like a bank. The front door requires an ID (authentication). The teller checks if you're allowed to access a specific account (authorization). Your account data is encrypted in the bank's storage (encryption at rest). The wire transfer goes over a secure channel (encryption in transit). The vault credentials rotate regularly (secrets management). Cameras log everything (audit logging). Security guards block a crowd trying to rush the door (DDoS protection).

**Real-world stakes:** Stripe processes hundreds of billions of dollars annually. GitHub stores the source code of millions of organizations. A security failure at either company is not just a technical incident — it is a business-ending event. Both companies invest heavily in scoped authorization, audit trails, and strict secrets management for this reason.

### Security Layers and Threat Model

Before picking tools, map threats layer by layer. For each layer, ask: *what asset exists here, who could abuse it, what trust boundary protects it, and what control detects or blocks the abuse?*

| Layer | What it protects | Key threats | Controls |
|---|---|---|---|
| **Identity** | Who users and services are | Credential stuffing, session theft, token replay, weak MFA | Strong auth, MFA, short-lived tokens, session invalidation |
| **Transport** | Data in motion | Plaintext interception, bad TLS config, cert expiry, MITM | TLS 1.3, HSTS, mTLS for internal traffic, cert automation |
| **Application** | What actors are allowed to do | Broken access control, IDOR, injection, XSS, SSRF | RBAC/ABAC, parameterized queries, input validation, CSP |
| **Data** | Sensitive data at rest | Unencrypted backups, over-broad DB permissions, data leaks | Encryption at rest, envelope encryption, field-level encryption |
| **Operations** | Secrets, deploys, dependencies | Leaked API keys, vulnerable libraries, supply chain attacks | Secrets vault, dependency scanning, signed artifacts, audit logs |

### Authentication — Proving Who You Are

Authentication answers: "Who is this?" It is the first gate every request must pass.

**Basic username + password** is the starting point but is insufficient alone. Passwords are reused, guessed, and phished. Treat authentication as multi-factor from day one for any system with sensitive data.

**Multi-Factor Authentication (MFA)** requires a second proof of identity beyond a password:
- **TOTP (Time-based One-Time Password)** — apps like Google Authenticator or Authy generate a 6-digit code that changes every 30 seconds. Simple and widely supported.
- **Hardware keys (FIDO2/WebAuthn)** — physical USB or NFC devices (YubiKey). Phishing-resistant because the key binds to the site's origin. Used by Google, GitHub, and Stripe internally.
- **Push notifications** — the user approves a login request on their phone via an app. More user-friendly but susceptible to MFA fatigue attacks (spamming the user with approve prompts).

**Service-to-service authentication** (no human involved):
- **mTLS (mutual TLS)** — both sides of a connection present certificates. Each service proves its identity cryptographically. Used extensively in service meshes (Istio, Linkerd).
- **Signed tokens (JWT with client credentials)** — a service presents a signed token obtained from an internal auth server. Easier to implement than mTLS but requires a token issuer.
- **API keys** — simple shared secrets. Appropriate for external developer APIs (Stripe, Twilio) but rotate them frequently and never embed them in client-side code.

**Authentication API design:**

```http
POST /v1/auth/login         # exchange credentials for tokens
POST /v1/auth/refresh       # exchange refresh token for new access token
POST /v1/auth/logout        # invalidate session
GET  /v1/me                 # return current user's identity
```

Login request:
```json
{
  "email": "user@example.com",
  "password": "correct horse battery staple",
  "mfa_code": "482917"
}
```

Login response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expires_in": 900,
  "token_type": "Bearer",
  "user_id": "usr_123"
}
```

### OAuth 2.0 — Delegated Authorization

OAuth 2.0 is an authorization framework, not an authentication system. It lets a user say, "This third-party app may read my calendar," without handing over their password. The user never gives their credentials to the app — they give their consent at the Authorization Server, which issues a scoped token.

**Real-world example:** When you click "Sign in with Google" on a third-party app, you are redirected to Google (the Authorization Server). Google asks if you consent to share your email and profile. You approve. Google sends the app a token. The app uses that token to call Google APIs on your behalf. Your Google password never touched the third-party app.

**Core roles:**

| Role | Responsibility | Example |
|---|---|---|
| **Resource Owner** | The user who owns the data | You, the Google account holder |
| **Client** | The app requesting access | A calendar scheduling app |
| **Authorization Server** | Issues tokens after user consent | Google's OAuth server |
| **Resource Server** | Hosts the protected API | Google Calendar API |

**Flows:**

- **Authorization Code + PKCE** — the standard for web and mobile apps. The user authenticates at the Authorization Server, receives an authorization code, and the client exchanges it server-to-server for tokens. PKCE (Proof Key for Code Exchange) prevents a stolen code from being exchanged by an attacker. Always use PKCE for SPAs and native mobile apps.
- **Client Credentials** — for machine-to-machine calls with no user involved. A backend service authenticates with its own `client_id` + `client_secret` and receives an access token. Used for cron jobs, internal services, and background workers.
- **Device Authorization** — for input-constrained devices (smart TVs, CLIs). The device displays a short code and a URL; the user completes auth on their phone. The device polls until the user approves.

**Token types:**

| Token | Lifetime | Purpose |
|---|---|---|
| **Access token** | Short (15 min – 1 hour) | Sent in `Authorization: Bearer` header to call APIs |
| **Refresh token** | Long (hours to days) | Exchanges for a new access token; never sent to resource servers |
| **ID token (OIDC)** | Short | JWT carrying user identity claims; used by the app, not APIs |

**OpenID Connect (OIDC)** is an identity layer built on top of OAuth 2.0. OAuth tells you *what* an app may do; OIDC tells you *who* the user is. Most modern "sign in with" flows use OIDC.

**Common mistakes:**
- Returning tokens in redirect URLs — they appear in browser history and server logs. Use server-to-server code exchange instead.
- Not validating the `aud` (audience) claim — allows a token issued for service A to be replayed at service B.
- Issuing long-lived access tokens without a revocation strategy — a stolen token stays valid until expiry.
- Skipping PKCE for SPAs — leaves the authorization code vulnerable to interception by browser extensions or network attackers.

### JWT — Stateless Identity Tokens

A JWT (JSON Web Token) is a compact, signed token that carries identity claims. Any service that knows the public key can verify a JWT without calling a central server — this makes JWTs ideal for distributed systems.

**Structure:** Three Base64URL-encoded parts separated by dots.

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9   ← header (algorithm + token type)
.eyJzdWIiOiJ1c3JfMTIzIiwiaXNzIjoiYXV0... ← payload (claims)
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV...   ← signature
```

The payload is Base64-encoded, **not encrypted**. Anyone with the token can read the claims. Never put passwords, credit card numbers, or sensitive PII in a JWT payload.

**Standard claims:**

| Claim | Meaning | Example |
|---|---|---|
| `sub` | Subject — who the token is about | `usr_123` |
| `iss` | Issuer — who minted the token | `https://auth.example.com` |
| `aud` | Audience — intended recipient | `https://api.example.com` |
| `exp` | Expiration (Unix timestamp) | `1745283600` |
| `iat` | Issued-at time | `1745280000` |
| `jti` | Unique token ID for revocation | `tok_abc` |
| `scope` / `roles` | Authorization claims | `["read:orders", "write:profile"]` |

**Signing algorithms:**

- **HS256 (HMAC-SHA256)** — symmetric; same secret signs and verifies. Every service that verifies must hold the secret. Fine for a single service; risky at scale because sharing the secret means any service can forge tokens.
- **RS256 (RSA-SHA256)** — asymmetric; private key signs, public key verifies. Resource servers only need the public key, published via a JWKS (JSON Web Key Set) endpoint. Preferred for multi-service architectures.
- **ES256 (ECDSA-SHA256)** — smaller signature than RSA at equivalent security. Preferred for mobile-heavy systems.

**Validation — perform all steps on every request:**

1. Verify the signature using the expected algorithm and key (fetch public key from JWKS endpoint).
2. Confirm `iss` matches the expected issuer.
3. Confirm `aud` includes this service's identifier.
4. Confirm `exp` is in the future; `iat` is not in the future.
5. If revocation is required, check `jti` against a blocklist in Redis.

**The revocation problem:** Because JWTs are stateless, a stolen token stays valid until `exp`. Mitigations:
- Keep access tokens short-lived (15 minutes is standard).
- Use refresh token rotation — each refresh issues a new refresh token and invalidates the old one. If an old refresh token is used after rotation, it indicates a theft — invalidate the entire token family.
- Maintain a `jti` blocklist in Redis for immediate revocation on logout or compromise. Cost: one Redis GET per request, which is fast and acceptable at most scales.

**JWT vs. opaque tokens:**

| Dimension | JWT | Opaque token |
|---|---|---|
| Verification | Local (stateless, no network call) | Remote (introspection endpoint call) |
| Revocation | Hard — wait for expiry or use blocklist | Easy — delete from token store |
| Token size | Larger (carries claims inline) | Small (random identifier) |
| Best for | Distributed services where low-latency verification matters | High-security flows requiring immediate revocation |

### Authorization — Controlling What You Can Do

Authentication proves identity. Authorization decides permissions. The two are separate concerns and must be enforced independently on every request — hiding a button in the UI is not authorization.

**RBAC (Role-Based Access Control):** Permissions attach to roles; roles attach to users.

```
User → [support_agent, billing_viewer] → {create_refund, view_invoice}
```

Strengths: simple, auditable, maps naturally to org charts. Adding an employee means assigning a role, not writing a policy. Most SaaS products start here.

Weaknesses: coarse-grained. Roles express *what* but not *when*, *where*, or *on whose data*. "Role explosion" — dozens of near-identical roles for edge cases — is a sign RBAC has been stretched too far.

Real-world examples: `admin`, `support_agent`, `billing_viewer`, `read_only`.

**ABAC (Attribute-Based Access Control):** Access decisions evaluate a policy expression over attributes of the user, resource, action, and environment.

```
ALLOW IF:
  user.department == resource.department
  AND user.clearance_level >= resource.sensitivity
  AND request.time BETWEEN 09:00 AND 17:00
  AND request.ip_region == "us-east-1"
```

Strengths: fine-grained and contextual. One policy replaces dozens of RBAC roles. Handles dynamic decisions based on runtime context (IP, time of day, device trust level).

Weaknesses: harder to reason about, audit, and debug. Policy engines (OPA — Open Policy Agent, AWS Cedar, Casbin) add operational complexity. A policy bug can silently affect many users.

Real-world examples: healthcare systems where a doctor may access only their currently admitted patients' records; financial platforms where analysts may view only transactions in their assigned region; multi-tenant SaaS where a user may only edit their own organization's documents.

**Choosing between them:**

| Scenario | Recommendation |
|---|---|
| Small team, simple roles, enterprise B2B | RBAC |
| Multi-tenant with per-tenant permissions | RBAC + tenant-ID scoping on every query |
| Row-level or field-level access control | ABAC or hybrid |
| Contextual constraints (time, location, device) | ABAC |
| Regulatory compliance with rich audit trails | ABAC with policy-as-code (OPA, Cedar) |

**Hybrid approach (common in production):** RBAC gates entry to a feature; ABAC governs individual resource access. `role=support_agent` lets a user access the support tool. `ticket.assigned_team == agent.team` determines which tickets they can open.

**Policy-as-code:** Define, test, and version authorization policies as code using OPA or AWS Cedar. Policies live in a repo, go through pull request review, are tested against example inputs in CI, and deploy independently of application code. This prevents silent authorization regressions.

### Encryption — Protecting Data in Transit and at Rest

Encryption protects data from specific threats — eavesdropping and stolen storage media — but does not replace access control, input validation, or secure application logic.

**Encryption in transit:**

Use TLS 1.3 for all traffic. TLS 1.3 removes weak cipher suites, reduces the handshake to one round trip, and mandates forward secrecy (a compromised private key does not decrypt past traffic).

Key practices:
- Redirect all HTTP to HTTPS and set an HSTS header (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`) to prevent downgrade attacks.
- Encrypt internal service-to-service traffic, not just the public edge. A compromised internal network should not expose plaintext. Use mTLS to authenticate both sides of internal calls.
- Automate TLS certificate rotation (Let's Encrypt with cert-manager, AWS ACM). Certificate expiry is the most common cause of preventable TLS outages.
- Disable TLS 1.0 and 1.1 at the load balancer — both have known weaknesses (BEAST, POODLE).

**Encryption at rest:**

| Layer | What to encrypt | Tool |
|---|---|---|
| Database storage | All rows and indexes | AWS RDS AES-256, Postgres with LUKS |
| Object storage | Files, exports, backups | S3 SSE-KMS; enforce via bucket policy |
| Backups | DB dumps, WAL archives | Encrypt before upload; store keys separately |
| Sensitive fields | PII (SSN, card number, health data) | Envelope encryption via KMS |
| Audit logs | Logs containing sensitive context | Encrypt at rest + restrict access |

**Envelope encryption** — the standard pattern for encrypting sensitive database fields:

1. A data encryption key (DEK) encrypts the plaintext value.
2. A master key in KMS (AWS KMS, HashiCorp Vault, GCP Cloud KMS) encrypts the DEK.
3. Only the encrypted DEK is stored alongside the data. The plaintext DEK lives in memory only during active use.

Rotating the master key only requires re-wrapping the DEKs — not re-encrypting all data. This makes rotation fast and practical.

**What encryption does NOT protect against:**
- A bug that returns decrypted data to the wrong user (broken access control).
- SQL injection that queries encrypted-then-decrypted fields via normal app logic.
- An attacker who compromises the application process, which holds decryption keys in memory.
- An authorized user with DB access who legitimately exports data (insider threat).

### Secrets Management

Secrets — API keys, database passwords, signing keys, TLS certificates, webhook secrets — must never be hardcoded in source code, baked into Docker images, or committed to git.

**Where secrets go wrong:**
- A developer hardcodes a staging DB password that gets committed to git. The repo becomes public. The password is indexed by scanners within hours.
- A CI pipeline logs the value of an environment variable containing an API key. The log is accessible to all engineers.
- A Docker image built with `ARG SECRET_KEY` bakes the value into an image layer. The registry is public.

**Correct approach:**

1. **Use a secrets manager:** AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager. Secrets are stored encrypted, access is audited, and rotation can be automated.
2. **Inject at runtime:** Applications fetch secrets from the vault on startup via the vault SDK or environment injection (AWS Parameter Store + ECS task role). No secrets in the image.
3. **Rotate regularly:** Automate rotation for database credentials (AWS Secrets Manager supports this natively for RDS). Rotate signing keys on a schedule and immediately on compromise.
4. **Scan continuously:** Use tools like GitGuardian, GitHub secret scanning, or truffleHog in CI to catch secrets committed by mistake.
5. **Least privilege:** Each service gets a vault role that can only access the secrets it needs. A payment service should not be able to read email provider credentials.

**Real-world example:** Uber's engineer accidentally committed AWS credentials to a public GitHub repo in 2016, leading to a breach of 57 million user records. The attacker used the credentials to access S3 buckets containing driver and rider data.

### Abuse Prevention — Rate Limiting and DDoS Protection

Rate limiting and DDoS protection are security controls that keep services available under adversarial traffic.

**Rate limiting by dimension:**
- **Per-IP** — blocks bots and scanners. A single IP making 1,000 login requests per minute is clearly a brute-force attack.
- **Per-user** — limits damage from compromised accounts. Even a legitimate user token should not be able to make 10,000 API calls per second.
- **Per-tenant** — in multi-tenant SaaS, prevents one tenant's traffic spike from degrading all others (the "noisy neighbor" problem).

Apply rate limiting at the **edge** (Cloudflare, AWS WAF), not only in the application. Edge enforcement blocks traffic before it reaches origin servers and absorbs volumetric attacks that would overwhelm app-layer rate limiters.

**DDoS protection layers:**
- **CDN / Anycast** (Cloudflare, AWS CloudFront) — distributes traffic across global PoPs. Volumetric floods are absorbed at the edge.
- **WAF (Web Application Firewall)** — filters traffic using rules (block known bad IPs, rate-limit patterns, block requests matching injection signatures).
- **Bot detection** — CAPTCHA challenges, browser fingerprinting, and behavioral analysis distinguish bots from humans for login and registration endpoints.
- **Origin shielding** — keep origin IPs private. If attackers know the origin IP, they can bypass CDN and hit it directly.

**Real-world example:** GitHub was hit by a 1.35 Tbps DDoS attack in 2018, the largest ever recorded at the time. They mitigated it within 10 minutes by routing traffic through Akamai's scrubbing infrastructure, which absorbed the flood before it reached GitHub's origin.

### OWASP Top 10 — Application Vulnerability Baseline

The OWASP Top 10 is the industry-standard list of the most critical web application security risks. Every system design involving user-facing APIs should address each class.

| # | Vulnerability | What happens | How to prevent it |
|---|---|---|---|
| A01 | **Broken Access Control** | Users access resources they should not own. Example: `/orders/789` returns any order regardless of who's logged in (IDOR). | Enforce authorization server-side on every request. Use ABAC row-level checks. Return 403 (not 404) to avoid leaking resource existence. |
| A02 | **Cryptographic Failures** | Sensitive data exposed due to weak or missing encryption. Example: passwords stored as MD5 hashes; internal traffic over HTTP. | TLS everywhere including internal hops. Use Argon2/bcrypt for passwords. Encrypt backups. Envelope encryption for PII fields. |
| A03 | **Injection** | Untrusted input executed as code or commands. Example: `'; DROP TABLE users; --` in a search field that constructs SQL via string concatenation. | Parameterized queries or prepared statements always. Validate and allowlist inputs. Least-privilege DB credentials. |
| A04 | **Insecure Design** | Security flaws baked into architecture. Example: no rate limiting on password reset; trusting role claims from the client. | Threat model during design phase. Defense in depth. Security review for auth, payments, and PII flows. |
| A05 | **Security Misconfiguration** | Insecure defaults left in place. Example: open S3 bucket, debug mode in prod, `CORS: *`, verbose stack traces in error responses. | Harden all defaults. Use IaC to enforce config. Periodic audits with AWS Config, Prowler, ScoutSuite. |
| A06 | **Vulnerable Components** | Libraries or runtimes with known CVEs. Example: Log4Shell (CVE-2021-44228) allowed remote code execution in Java apps using log4j. | Automated dependency scanning in CI (Dependabot, Snyk). Subscribe to CVE feeds. Patch critical vulnerabilities within 24 hours. |
| A07 | **Auth Failures** | Broken auth lets attackers impersonate users. Example: no brute-force protection on login; sessions not invalidated on logout; predictable tokens. | Rate-limit login attempts. Require MFA. Short session expiry. Invalidate sessions server-side on logout. Detect credential stuffing. |
| A08 | **Data Integrity Failures** | Code or data updates applied without integrity checks. Example: CI pipeline fetches a dependency without verifying its checksum (supply chain attack). | Sign and verify artifacts. Pin dependency versions. Use safe serialization (JSON + schema validation) instead of arbitrary object deserialization. |
| A09 | **Logging and Monitoring Failures** | Attacks go undetected because events are not logged or alerted. Example: 1,000 failed logins per minute with no alert. | Log all auth decisions and access-control failures. Write-once audit logs (S3 Object Lock). Alert on login failure spikes and privilege escalation. Include correlation IDs. |
| A10 | **SSRF (Server-Side Request Forgery)** | Attacker makes the server fetch an internal URL it should not. Example: submitting `http://169.254.169.254/latest/meta-data/` to a URL-fetching feature to steal AWS IAM credentials. | Allowlist allowed fetch targets. Block RFC-1918 and link-local addresses. Use an egress proxy for outbound HTTP. Enforce IMDSv2 on AWS (adds a session token requirement). |

**Where these failures concentrate in distributed systems:**
- **Injection (A03)** hits search, filter, and reporting endpoints that build queries dynamically.
- **SSRF (A10)** is amplified in microservices where one compromised service can reach internal APIs trusted by the VPC.
- **Broken access control (A01)** in multi-tenant systems often appears as a missing `WHERE tenant_id = ?` clause — one omitted filter returns every tenant's data.
- **Misconfiguration (A05)** is the most common cloud audit finding: overly permissive IAM roles, open security groups, public S3 buckets.

### Operational Security — Logging, Auditing, and Maintenance

Security is not set-and-forget. The operations layer determines whether a breach is detected in minutes or months.

**What to log:**
- Every authentication attempt (success and failure) with user ID, IP, user agent, and timestamp.
- Every authorization decision that results in a denial.
- All administrative actions (role changes, secret rotations, configuration changes).
- All data exports or bulk reads of sensitive data.

**How to store logs:**
- Write-once storage (S3 Object Lock, Splunk, Datadog) — logs must not be modifiable after writing.
- Separate the log storage from the application — a compromised application should not be able to delete its own audit trail.
- Include correlation IDs on every log line so a full request chain can be reconstructed across services.

**Alerting:**
- Login failure rate spikes (credential stuffing / brute force).
- Privilege escalation events (a user suddenly gains admin role).
- Secret access anomalies (a service fetching credentials it has never fetched before).
- Unusual data export volume.

**Ongoing maintenance checklist:**
- Rotate API keys, DB passwords, and TLS certificates on a schedule.
- Run dependency scanning continuously; patch critical CVEs within 24 hours.
- Review and test authorization policies quarterly.
- Perform tabletop drills for credential leakage and account takeover.
- Run SAST (Static Application Security Testing) and DAST (Dynamic Application Security Testing) in CI/CD.
- Use Git secret scanning to catch committed credentials before they reach remote.

### How Security Grows With the System

| Stage | What you have | What to add |
|---|---|---|
| **Early (MVP, small team)** | Basic password login, HTTPS, a few role checks | MFA for admins, short-lived JWTs, bcrypt passwords, encrypted backups |
| **Growth (product-market fit)** | More users, multiple services | Centralized auth service, OAuth 2.0 for third-party integrations, secrets vault, WAF at the edge, audit logging |
| **Scale (hundreds of engineers)** | Multi-tenant, regulated data, complex roles | ABAC with policy-as-code (OPA/Cedar), mTLS for internal traffic, HSM-backed key management, automated cert rotation, real-time anomaly detection, red team exercises |
| **Enterprise (compliance-driven)** | SOC 2, HIPAA, PCI-DSS requirements | Hardware security modules, formal penetration testing, zero-trust network architecture, break-glass procedures with full audit trails |

### Cost Considerations

| Control | Cost profile |
|---|---|
| TLS | Near-zero — certificate automation (ACM, Let's Encrypt) is free |
| Secrets management | Low recurring cost (AWS Secrets Manager ~$0.40/secret/month); high value per dollar |
| WAF / DDoS protection | Meaningful monthly cost at scale (Cloudflare Pro/Enterprise, AWS WAF per-rule pricing) |
| HSM-backed key management | Higher cost; required for PCI-DSS and regulated industries |
| Audit logging and SIEM | Storage and ingestion costs grow with request volume; plan for this early |
| Security reviews and pen tests | Operational cost often exceeds infra cost; budget 1-2 per year at minimum |

Security is one of the highest ROI investments in a technology company. A single breach — covering customer notification, legal fees, lost contracts, and remediation — routinely costs orders of magnitude more than the prevention spending it replaced.

### Interview Trade-Off Questions and Answers

**Q1: When are stateless JWTs the right choice, and when do server-side sessions or token introspection give you better security control?**

**Answer:** Use JWTs when you have multiple services that need to verify identity without network calls and when short access token lifetimes (15–30 minutes) are acceptable. JWTs eliminate the need for a shared session store and are cheap to verify at scale.

Use server-side sessions or opaque tokens with introspection when you need immediate revocation — for example, after detecting account compromise or on user logout in a high-security application. A 15-minute window before a stolen JWT expires may be unacceptable for financial or healthcare systems. The tradeoff is that every request now requires a network call to the token introspection endpoint, adding latency. This can be mitigated with a short-TTL cache (30–60 seconds) of token validity, which keeps revocation near-instant while reducing introspection calls.

Hybrid approach: short-lived JWTs (15 minutes) for normal API calls, combined with a `jti` blocklist in Redis for immediate revocation on logout or compromise. This gives most of the performance benefits of JWTs while bounding the window of a stolen token.

**Q2: When is RBAC sufficient, and when does the product complexity justify moving to ABAC or a policy engine?**

**Answer:** RBAC is sufficient when permissions map cleanly to job functions with a manageable number of roles (under ~20) and when access decisions do not depend on runtime context or resource attributes. Most B2B SaaS products start with RBAC and it serves them well through significant scale.

Move to ABAC when you encounter role explosion (you are creating roles like `support_agent_us_east_tier1_refund_only` to handle edge cases), when access decisions require context (time of day, user's geographic region, device trust level), or when you need row-level isolation in a multi-tenant system. ABAC also becomes necessary for compliance requirements like HIPAA minimum necessary access, where "this doctor may only read records for patients currently under their care" cannot be expressed as a static role.

The cost of ABAC is policy complexity: a bug in a policy expression can silently grant or deny access to many users at once. Policy-as-code (OPA, AWS Cedar) with a robust test suite mitigates this.

**Q3: How do you balance strong revocation and short-lived tokens against latency, cacheability, and operational simplicity?**

**Answer:** The core tension is: shorter token lifetime = smaller breach window, but also more frequent refresh calls, more auth server load, and more complexity. Longer lifetime = simpler and faster, but a stolen token stays valid longer.

Practical resolution: use a two-token pattern with a short-lived access token (15 minutes) and a longer-lived refresh token (7–30 days). The access token is self-contained (JWT); services verify it locally with no network call. When it expires, the client silently exchanges the refresh token for a new pair. Refresh token rotation on every use means a stolen refresh token is detected the next time it is legitimately used.

For immediate revocation (account compromise, admin lockout): maintain a `jti` blocklist in Redis. Only compromised or force-logged-out tokens need to be blocklisted — the vast majority of tokens expire naturally. This keeps the blocklist small and the Redis lookup fast (sub-millisecond at typical scale).

Avoid caching access tokens at the edge for longer than their `exp` — a CDN that caches a 401 response or a valid token for 10 minutes can mask revocations and break logout flows.

---

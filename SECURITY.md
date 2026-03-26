# Security Policy

## Supported Versions

| Version             | Supported             |
| ------------------- | --------------------- |
| 0.x.x (pre-release) | ✅ Active development |

---

## Reporting a Vulnerability

**Do not open a public GitHub Issue for security vulnerabilities.**

Report security issues privately via GitHub's [Security Advisory](https://github.com/SalehOsman/Tempot/security/advisories/new) feature.

Include in your report:

- Description of the vulnerability
- Steps to reproduce
- Affected component (package, module, or configuration)
- Potential impact assessment
- Your suggested fix (optional)

**Response timeline:**

| Action             | Timeline                           |
| ------------------ | ---------------------------------- |
| Acknowledgement    | Within 48 hours                    |
| Initial assessment | Within 5 business days             |
| Fix or mitigation  | Within 30 days for critical issues |
| Public disclosure  | After fix is released              |

---

## Security Architecture

Tempot is built with **Security by Default**. Every request passes through an automatic security chain:

```
sanitize-html → @grammyjs/ratelimiter → CASL Auth Check → Zod Validation → Business Logic → Audit Log
```

### Security Layers

| Layer                 | Tool                    | Purpose                       |
| --------------------- | ----------------------- | ----------------------------- |
| Input sanitization    | `sanitize-html`         | XSS prevention (ADR-020)      |
| Rate limiting (bot)   | `@grammyjs/ratelimiter` | Spam and abuse protection     |
| Rate limiting (API)   | `rate-limiter-flexible` | Dashboard/Mini App protection |
| Authorization         | CASL + Sessions         | RBAC with 4 role tiers        |
| Validation            | Zod                     | Strict schema enforcement     |
| Encryption at rest    | AES-256                 | Sensitive DB fields           |
| Encryption in transit | HTTPS + WSS             | All connections               |
| SQL injection         | Prisma + Drizzle        | Automatic ORM protection      |
| Secret detection      | gitleaks (planned)      | Not yet configured            |
| Audit trail           | Audit Log               | All state changes logged      |

### Role Hierarchy

| Role          | Level | Access                            |
| ------------- | ----- | --------------------------------- |
| `SUPER_ADMIN` | 4     | God Mode — `can('manage', 'all')` |
| `ADMIN`       | 3     | Module management via scoping     |
| `USER`        | 2     | Standard features                 |
| `GUEST`       | 1     | Minimal access                    |

### SUPER_ADMIN Bootstrap

`SUPER_ADMIN` is assigned exclusively via the `SUPER_ADMIN_IDS` environment variable. Self-promotion is architecturally impossible.

### Redis Degradation

Every Redis operation has a fallback. Sessions fall back to in-memory storage. Cache falls back to direct DB queries. SUPER_ADMIN is alerted immediately on any Redis failure.

---

## Security Best Practices for Deployments

When deploying Tempot:

1. **Never commit `.env`** — it is gitignored by default
2. **Rotate secrets regularly** — BOT_TOKEN, API keys, webhook secrets
3. **Use webhook mode in production** — not polling
4. **Set `SUPER_ADMIN_IDS` explicitly** — never leave empty in production
5. **Enable Sentry** (when configured) — set `TEMPOT_SENTRY=true` and configure `SENTRY_DSN`
6. **Use managed PostgreSQL and Redis** — with encryption at rest enabled
7. **Run `pnpm audit` before every deployment**
8. **Review gitleaks output** — secrets in git history are compromised

---

## Known Security Considerations

- Telegram Bot Tokens grant full bot access — treat as high-value secrets
- `SUPER_ADMIN_IDS` contains Telegram user IDs — these users have absolute system access
- Webhook secret tokens prevent unauthorized webhook calls — always set in production
- All API keys stored in DB are encrypted with AES-256 — the encryption key itself must be secured

---

## Security Audit

Automated checks run via GitHub Actions CI (`.github/workflows/ci.yml`) on every push and PR:

- **Lint** — ESLint with strict TypeScript rules
- **Type Check** — Full `pnpm build` compilation
- **Unit Tests** — All unit test suites
- **Integration Tests** — With PostgreSQL + pgvector and Redis services
- **Security Audit** — `pnpm audit` for dependency vulnerabilities

```bash
pnpm audit          # Dependency vulnerability scan
pnpm lint           # ESLint check
pnpm test:unit      # Unit tests
```

gitleaks is planned but not yet configured. See [docs/security/SECURITY-OPERATIONS.md](docs/security/SECURITY-OPERATIONS.md) for full operational security procedures.

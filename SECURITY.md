# Security Policy

## Supported Versions

| Version           | Supported          |
| ----------------- | ------------------ |
| 0.x.x pre-release | Active development |

## Reporting a Vulnerability

Do not open a public GitHub issue for security vulnerabilities.

Report security issues privately through GitHub Security Advisories:
<https://github.com/SalehOsman/Tempot/security/advisories/new>

Include:

- Vulnerability description.
- Steps to reproduce.
- Affected component.
- Potential impact.
- Suggested fix, if available.

## Response Timeline

| Action             | Target                             |
| ------------------ | ---------------------------------- |
| Acknowledgement    | Within 48 hours                    |
| Initial assessment | Within 5 business days             |
| Fix or mitigation  | Within 30 days for critical issues |
| Public disclosure  | After fix is released              |

## Security Architecture

Tempot is built around security-by-default:

```text
sanitize-html -> grammY rate limiter -> CASL check -> Zod validation -> business logic -> audit log
```

| Layer                     | Tool                    | Purpose                            |
| ------------------------- | ----------------------- | ---------------------------------- |
| Input sanitization        | `sanitize-html`         | XSS and HTML input protection      |
| Bot rate limiting         | `@grammyjs/ratelimiter` | Telegram spam and abuse protection |
| Application rate limiting | `rate-limiter-flexible` | AI, services, and internal APIs    |
| HTTP rate limiting        | `hono-rate-limiter`     | Hono endpoints                     |
| Authorization             | CASL                    | RBAC and ABAC                      |
| Validation                | Zod                     | Runtime schema enforcement         |
| Data access               | Prisma and Drizzle      | ORM-mediated SQL access            |
| Audit                     | `@tempot/logger`        | State-change traceability          |

## Deployment Practices

1. Never commit `.env`.
2. Rotate `BOT_TOKEN`, API keys, and webhook secrets regularly.
3. Use webhook mode in production.
4. Set `SUPER_ADMIN_IDS` explicitly.
5. Enable Sentry when `SENTRY_DSN` is configured.
6. Use managed PostgreSQL and Redis with encryption at rest.
7. Run `pnpm audit --audit-level=high` before deployment.

## Known Sensitive Values

- Telegram bot tokens.
- `SUPER_ADMIN_IDS`.
- Webhook secret tokens.
- AI provider API keys.
- Database encryption keys.

## Automated Checks

GitHub Actions run linting, type checks, unit tests, integration tests, and
dependency audit jobs. See `.github/workflows/ci.yml` and
[docs/archive/security/security-baseline.md](docs/archive/security/security-baseline.md)
for the current security baseline.

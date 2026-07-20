# Security Review

## Security Posture

Tempot has a good security foundation: no tracked `.env`, comprehensive `.env.example`, authorization governance, token-protected readiness, Docker image scanning/signing, and dependency audit threshold checks. The project is not security-complete for production because production evidence remains open, secret scanning was not confirmed in CI, pnpm policy is partly ignored, and webhook operational defaults need hardening.

## Findings

| Risk | Severity | Evidence | Impact | Remediation |
|---|---|---|---|---|
| Production security evidence incomplete. | Critical | `docs/ROADMAP.md` still requires staging, monitoring, rollback, backup/restore, and go/no-go evidence. | Production incidents may be hard to detect or recover from. | Complete Spec #057 production evidence before release. |
| Dependency policy ignored by pnpm. | High | pnpm warns that `package.json#pnpm.overrides` and `package.json#pnpm.auditConfig` are ignored. | Security overrides/audit policy may not apply. | Move policy into supported workspace configuration. |
| No confirmed secret-scanning CI. | High | Reviewed workflows do not show gitleaks/trufflehog-style scanning. | Future secret leaks may pass PR checks. | Add PR and history secret scanning. |
| Webhook fallback secret. | High | `apps/bot-server/scripts/webhook-manager.ts` contains fallback secret behavior. | Weak webhook secret may be used accidentally. | Fail fast unless explicit secret is configured. |
| Local `.env` has live secrets. | Medium | Local `.env` exists and is untracked; values were not printed. | Local compromise or accidental copy can expose credentials. | Use least-privilege local credentials and rotation discipline. |
| Request body over-read edge case. | Medium | `apps/bot-server/src/server/hono.factory.ts` reads cloned raw body when length is absent. | Memory pressure from malformed requests. | Add streaming request-size enforcement. |
| Rate-limit unknown-client fallback. | Medium | `apps/bot-server/src/server/hono.factory.ts` falls back to `unknown-client`. | Proxy misconfiguration can cause false throttling or weak attribution. | Require trusted proxy headers in production. |

## Positive Controls

| Control | Evidence |
|---|---|
| `.env` not tracked | `git ls-files` showed `.env.example`, not `.env`. |
| Readiness token | `apps/bot-server/src/server/routes/health.route.ts` protects `/ready` with `x-tempot-readiness-token`. |
| Authorization checks | `pnpm authorization:check` passed. |
| Docker scanning | `.github/workflows/docker.yml` uses Trivy with high/critical enforcement. |
| Image signing | `.github/workflows/docker.yml` uses Cosign signing and verification. |
| Dependency audit threshold | `pnpm audit --audit-level=high` passed threshold. |

## Immediate Security Actions

| Priority | Action |
|---|---|
| P0 | Complete production evidence gates before release. |
| P1 | Correct pnpm policy placement. |
| P1 | Add secret scanning to CI. |
| P1 | Remove webhook fallback secret. |
| P2 | Harden request body limits and trusted proxy behavior. |


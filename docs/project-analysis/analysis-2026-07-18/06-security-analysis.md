# 06 - Security Analysis

## Security Summary

Security posture is good but not production-complete. The project has authorization checks, protected readiness, Docker image scanning/signing, dependency auditing, and no tracked `.env`. Remaining risks are practical: missing production evidence, ignored dependency policy, no confirmed secret scanning, webhook fallback secret, local secret hygiene, and request handling edge cases.

## Findings

| ID | Risk | Severity | Evidence | Impact | Remediation |
|---|---|---|---|---|---|
| S-001 | Production operational security evidence is incomplete. | Critical | `docs/ROADMAP.md:313-320`. | Release cannot prove monitoring, rollback, backup/restore, or staging safety. | Complete production go/no-go evidence. |
| S-002 | pnpm dependency policy is ignored. | High | `package.json:91-104` and pnpm warning. | Security overrides/audit config may not apply. | Move policy to supported workspace configuration. |
| S-003 | No confirmed secret-scanning CI. | High | No gitleaks/trufflehog-style workflow observed. | Future secret leaks may pass PR checks. | Add secret scanning workflow and baseline. |
| S-004 | Webhook fallback secret exists. | High | `apps/bot-server/scripts/webhook-manager.ts:17`. | Weak token could be configured accidentally. | Fail fast without explicit secret outside local test mode. |
| S-005 | Local `.env` contains live secrets. | Medium | Local `.env` exists and is untracked; values were not printed. | Local credential exposure risk. | Use least-privilege local credentials and rotation process. |
| S-006 | Request body fallback can allocate full body. | Medium | `apps/bot-server/src/server/hono.factory.ts` no-content-length body path. | Memory pressure risk from malformed requests. | Use streaming size enforcement. |
| S-007 | Rate-limit identity can fall back to `unknown-client`. | Medium | `apps/bot-server/src/server/hono.factory.ts`. | Proxy misconfiguration can distort rate limiting. | Require/validate trusted proxy headers in production. |
| S-008 | RAG corpus can include stale or historical analysis without freshness metadata. | Medium | `docs/project-analysis/*` and historical docs exist. | AI answers may cite outdated findings as current truth. | Add RAG manifest with freshness and archive flags. |

## Positive Controls

| Control | Evidence |
|---|---|
| Authorization governance | `pnpm authorization:check` passed for 9 modules. |
| Boundary enforcement | `pnpm boundary:audit` passed across 1096 TypeScript files. |
| Readiness token | `/ready` is token-protected. |
| Docker security | Trivy and Cosign are configured in Docker workflow. |
| Dependency audit | `pnpm audit --audit-level=high` passed threshold. |
| Secrets not committed | `.env` is not tracked; `.env.example` is tracked. |

## RAG-Specific Security Requirements

| Requirement | Why |
|---|---|
| Do not index secrets or local env files. | Prevent credential leakage through AI responses. |
| Tag historical docs as archived/stale. | Prevent outdated security findings from being retrieved as current truth. |
| Add role-aware retrieval tests. | Ensure developer-docs, db-schema, and user-memory access rules remain enforced. |
| Add no-context and leakage fixtures. | Prove the assistant refuses or abstains when context is absent or restricted. |


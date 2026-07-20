# Architecture And Code Quality Review

## Architecture Pattern

Tempot uses a modular TypeScript monorepo architecture:

| Layer | Role |
|---|---|
| `apps/bot-server/` | Hono HTTP server, Telegram bot runtime entrypoint, startup orchestration. |
| `apps/docs/` | Documentation application. |
| `packages/` | Shared infrastructure and domain engines. |
| `modules/` | Business modules and feature behavior. |
| `runtime/` | Runtime composition and module activation. |
| `scripts/` | Governance, validation, generation, and operational automation. |
| `specs/` | SpecKit feature artifacts. |
| `docs/` | Source-of-truth documentation and operational records. |

## Architectural Strengths

| Strength | Evidence |
|---|---|
| Thin application entrypoint | `apps/bot-server/src/index.ts` delegates diagnostics, dependency building, startup, and shutdown. |
| Clear startup composition | `apps/bot-server/src/startup/deps.orchestrator.ts` centralizes dependency orchestration. |
| Clean server factory pattern | `apps/bot-server/src/server/hono.factory.ts` composes Hono routes and middleware. |
| Health/readiness separation | `apps/bot-server/src/server/routes/health.route.ts` separates liveness from token-protected readiness. |
| Automated boundary checks | `pnpm boundary:audit` passed across 1096 TypeScript files. |
| Automated module governance | `pnpm module:checklist` passed across 9 modules. |

## Architectural Weaknesses

| Weakness | Severity | Impact | Recommendation |
|---|---|---|---|
| Production evidence is not complete. | Critical | Architecture cannot be certified for production operation. | Close the production gates in `docs/ROADMAP.md`. |
| Architecture source of truth has language/encoding debt. | High | Onboarding and governance clarity are reduced. | Rewrite in English UTF-8. |
| Governance pass depends on allowlist entries. | High | Current compliance can be misread as full compliance. | Burn down `scripts/ci/methodology-lint.allowlist.json`. |
| Webhook operational script bypasses lint rules. | Medium | Script quality and maintainability are weaker than normal code paths. | Refactor and remove eslint-disable comments. |

## Code Quality Findings

| Finding | File/path | Severity | Impact | Fix |
|---|---|---|---|---|
| File-level eslint disables. | `apps/bot-server/scripts/webhook-manager.ts` | Medium | Hides complexity and console-output debt. | Split script into smaller helpers and restore lint compliance. |
| Predictable fallback webhook secret. | `apps/bot-server/scripts/webhook-manager.ts` | High | Risk of accidental weak webhook configuration. | Require explicit secret outside named local test mode. |
| Ignored pnpm policy. | `package.json`, `pnpm-workspace.yaml` | High | Dependency security assumptions may be false. | Move policy into supported workspace configuration. |
| Active architecture doc debt. | `docs/architecture/tempot_architecture.md` | High | Source of truth is not constitution-compliant. | Rewrite in English UTF-8. |
| Broad methodology allowlist. | `scripts/ci/methodology-lint.allowlist.json` | High | Constitutional debt remains hidden behind a pass. | Create owner-bound burn-down tasks. |
| Request body fallback reads full body. | `apps/bot-server/src/server/hono.factory.ts` | Medium | Memory pressure risk. | Use streaming limit enforcement or reject missing content length. |
| Rate-limit fallback uses shared identity. | `apps/bot-server/src/server/hono.factory.ts` | Medium | Proxy misconfiguration can distort throttling. | Validate trusted proxy headers in production. |

## Maintainability Assessment

| Area | Score | Reason |
|---|---:|---|
| Module layout | High | Packages, apps, modules, runtime, specs, and docs are separated. |
| Boundary control | High | Automated boundary and module checks pass. |
| Code health | Good | Lint/build/unit pass. |
| Documentation health | Medium | Extensive docs exist, but the active architecture doc has governance debt. |
| Long-term risk | Medium | The largest risk is accumulated allowlist debt, not a broken architecture. |


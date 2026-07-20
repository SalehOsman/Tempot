# Prioritized Backlog

Effort scale:

| Code | Meaning |
|---|---|
| XS | Less than 1 hour |
| S | 1 to 4 hours |
| M | About 1 work day |
| L | 2 to 5 days |
| XL | More than 1 week |

## Backlog

| Priority | Problem | Type | File/path | Impact | Solution | Effort |
|---|---|---|---|---|---|---|
| P0 | Production go/no-go evidence incomplete. | Operational readiness | `docs/ROADMAP.md` | Cannot safely approve production release. | Complete staging smoke, monitoring, rollback, backup/restore, and final review evidence. | L |
| P0 | Integration gate timed out locally. | Testing/release risk | `pnpm test:integration` | Release confidence is incomplete. | Diagnose hanging suite and add deterministic teardown/timeouts. | M |
| P1 | Coverage gate timed out locally. | Testing/quality risk | `pnpm test:coverage` | No current coverage evidence. | Fix coverage command and publish summary artifact. | M |
| P1 | pnpm dependency policy ignored. | Security/config | `package.json`, `pnpm-workspace.yaml` | Overrides/audit policy may not apply. | Move pnpm policy into supported workspace config. | S |
| P1 | Methodology allowlist masks debt. | Governance | `scripts/ci/methodology-lint.allowlist.json` | Green governance can hide unresolved violations. | Burn down entries by owner/spec. | M |
| P1 | Architecture source of truth has language/encoding debt. | Documentation/governance | `docs/architecture/tempot_architecture.md` | Onboarding and review clarity are reduced. | Rewrite in English UTF-8. | L |
| P1 | No confirmed secret-scanning CI. | Security | `.github/workflows/` | Secret leaks may not be blocked. | Add gitleaks/trufflehog-style scanning. | S |
| P1 | Webhook script has fallback secret. | Security/operations | `apps/bot-server/scripts/webhook-manager.ts` | Weak secret can be accidentally configured. | Require explicit secret outside local test mode. | S |
| P2 | Request body limit can over-read no-length requests. | Security/performance | `apps/bot-server/src/server/hono.factory.ts` | Memory pressure risk. | Use streaming body limit enforcement. | M |
| P2 | Rate-limit fallback uses shared unknown identity. | Operational/security | `apps/bot-server/src/server/hono.factory.ts` | Proxy misconfiguration can distort rate limiting. | Validate trusted proxy headers in production. | S |
| P2 | Docs build warnings remain. | Developer experience | `apps/docs` | Build noise and future upgrade risk. | Migrate deprecated Astro markdown config and fix Pagefind warning. | S |
| P2 | AI/RAG activation evidence incomplete. | Product/architecture | `docs/ROADMAP.md`, `packages/ai-core/README.md`, modules | Product claims may exceed runtime proof. | Complete governed module opt-in and safety fixtures. | L |
| P3 | Local `.env` contains live secrets. | Operational hygiene | Local `.env` | Local exposure risk. | Use least-privilege local credentials and rotation policy. | XS |
| P3 | Docs build is heavy. | Developer experience | `apps/docs` | Slower feedback loop. | Add profiling and incremental docs workflow. | M |

## First Execution Slice

| Order | Task | Why first |
|---:|---|---|
| 1 | Diagnose integration timeout. | It blocks reliable release evidence. |
| 2 | Diagnose coverage timeout. | It blocks quality measurement. |
| 3 | Fix pnpm policy placement. | It removes a repeated security/config warning. |
| 4 | Remove webhook fallback secret. | It is a small, high-impact security fix. |
| 5 | Add secret scanning. | It closes a common CI security gap. |
| 6 | Start production evidence checklist. | It aligns all remaining release work. |


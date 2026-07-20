# 10 - Issues And Risks Register

## Prioritized Register

| ID | Priority | Issue | Type | Evidence | Impact | Effort |
|---|---|---|---|---|---|---|
| IR-001 | P0 | Production go/no-go evidence incomplete. | Operational readiness | `docs/ROADMAP.md:168-170`, `docs/ROADMAP.md:313-320`. | Production release cannot be approved safely. | L |
| IR-002 | P0 | Integration gate timed out locally. | Testing | `pnpm test:integration` timeout. | Release confidence incomplete. | M |
| IR-003 | P1 | Coverage gate timed out locally. | Testing | `pnpm test:coverage` timeout. | No current local coverage evidence. | M |
| IR-004 | P1 | Most docs corpus resolves to `language=unknown`. | RAG/docs | `docs/product/reference` count 2811; `ingest-docs.ts:65-68`. | Poor retrieval filtering and citation quality. | M |
| IR-005 | P1 | Partial chunk failure can be marked as indexed. | RAG bug | `content-ingestion.service.ts:91`, `ingest-runner.ts:107-170`. | Silent missing embeddings. | M |
| IR-006 | P1 | pnpm dependency policy ignored. | Security/config | `package.json:91-104`, pnpm warning. | Dependency controls may not apply. | S |
| IR-007 | P1 | Methodology lint blocked by historical docs path drift. | Governance | `pnpm methodology:lint --format=json` failure. | Governance gate cannot be trusted until resolved. | S/M |
| IR-008 | P1 | Active architecture doc has language/encoding debt. | Documentation/governance | `docs/architecture/tempot_architecture.md`. | Bad source-of-truth and RAG input. | L |
| IR-009 | P1 | Webhook fallback secret. | Security | `apps/bot-server/scripts/webhook-manager.ts:17`. | Weak secret risk. | S |
| IR-010 | P1 | No confirmed secret-scanning CI. | Security | Reviewed workflows. | Secret leaks may pass PRs. | S |
| IR-011 | P2 | Sync docs discovery returns empty list. | Code quality | `apps/docs/scripts/ingest-docs.ts:34-39`. | Incorrect behavior for any sync caller. | S |
| IR-012 | P2 | Request body no-content-length path can over-read. | Security/performance | `apps/bot-server/src/server/hono.factory.ts`. | Memory pressure risk. | M |
| IR-013 | P2 | Rate-limit fallback uses shared unknown identity. | Security/ops | `apps/bot-server/src/server/hono.factory.ts`. | Proxy misconfiguration risk. | S |
| IR-014 | P2 | Docs build warnings remain. | Developer experience | Prior build warnings. | Upgrade and warning-noise risk. | S |
| IR-015 | P2 | RAG golden fixture untracked. | Testing/process | `git status --short`. | CI cannot rely on local fixture. | XS |
| IR-016 | P3 | Local `.env` contains live secrets. | Operational hygiene | Local `.env` inspected for names only. | Local exposure risk. | XS |

Effort scale: XS less than 1 hour, S 1-4 hours, M about 1 work day, L 2-5 days, XL more than 1 week.

## Risk Themes

| Theme | Explanation |
|---|---|
| Evidence risk | Production readiness is not yet proven in staging/ops artifacts. |
| RAG quality risk | Documentation exists, but metadata and corpus ranking are not mature enough for production AI answers. |
| Governance risk | Allowlist/path drift makes methodology lint unreliable until fixed. |
| Security risk | Most controls are good, but weak defaults and missing secret scanning need closure. |


# 04 - Architecture Analysis

## Architecture Pattern

Tempot uses a modular monorepo architecture with clear separation between applications, reusable packages, business modules, runtime composition, specifications, and documentation.

| Concern | Current design |
|---|---|
| Bot runtime | `apps/bot-server` with startup orchestration and Hono server factory. |
| Shared infrastructure | `packages/*` for database, logger, event bus, auth, AI, search, storage, CMS, settings, and more. |
| Business behavior | `modules/*` with module checklist governance. |
| Specifications | `specs/{NNN}-{feature}/` with spec, plan, tasks, research, data model. |
| Documentation | `docs/` and `apps/docs` with Starlight and TypeDoc. |
| RAG foundation | `packages/ai-core/src/rag/*`, `packages/ai-core/src/content/*`, docs ingestion scripts, pgvector migration specs. |

## Strengths

| Strength | Evidence |
|---|---|
| Application entrypoint is thin. | `apps/bot-server/src/index.ts` delegates startup. |
| Runtime composition is centralized. | `apps/bot-server/src/startup/deps.orchestrator.ts`. |
| Health readiness is separated. | `apps/bot-server/src/server/routes/health.route.ts`. |
| Module boundaries are tested. | `pnpm boundary:audit` and `pnpm module:checklist` pass. |
| RAG is built natively rather than added as opaque framework dependency. | ADR-039 and `packages/ai-core/src/rag/*`. |

## Architecture Risks

| ID | Risk | Severity | Evidence | Recommendation |
|---|---|---|---|---|
| A-001 | Production deployment architecture is not fully evidenced. | Critical | `docs/ROADMAP.md:168-170`, `docs/ROADMAP.md:313-320`. | Close external staging, observability, backup, restore, rollback evidence. |
| A-002 | RAG corpus architecture is implicit in directory layout. | High | `docs/product/reference` dominates corpus and language detection depends on path segment. | Add explicit corpus manifest and retrieval weighting policy. |
| A-003 | Source-of-truth architecture doc is not RAG-safe. | High | `docs/architecture/tempot_architecture.md` has language/encoding debt. | Split and rewrite as English UTF-8 pages. |
| A-004 | Docs ingestion write semantics do not guarantee complete indexing. | High | Best-effort chunk skip plus hash persistence. | Make docs ingestion all-or-failed by default. |
| A-005 | AI/RAG runtime activation is still an evidence track, not fully productized runtime capability. | Medium | Spec #062 and #063 are complete, but bot-flow activation is explicitly out of scope. | Keep RAG product claims tied to activation evidence. |

## Coupling Review

| Area | Assessment |
|---|---|
| Apps to packages | Acceptable. Apps compose package services at the edge. |
| Modules to infrastructure | Good. Governance checks passed. |
| Prisma boundaries | Direct usage appears concentrated in database/infrastructure contexts. |
| Docs ingestion to AI/database | Acceptable for operator CLI, but should keep runtime composition isolated. |
| RAG retrieval to authorization | Good direction. `RAGPipeline` filters content types by role and user memory by user id. |

## Architectural Recommendations

| Priority | Recommendation |
|---|---|
| P0 | Treat `docs/ROADMAP.md` production evidence as release blocker. |
| P1 | Add a RAG corpus policy layer instead of relying on filesystem layout. |
| P1 | Fix partial chunk ingestion semantics. |
| P1 | Rewrite architecture source into smaller English pages. |
| P2 | Add architecture tests for RAG corpus metadata and route/language mapping. |


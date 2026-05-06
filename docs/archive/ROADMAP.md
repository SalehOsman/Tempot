# Tempot Roadmap

> Single source of truth for project status. Updated after every merge.
> Constitutional reference: Rule LXXXIX.
>
> Last updated: 2026-05-06.

## Current Technical Baseline

| Area            | Baseline                            |
| --------------- | ----------------------------------- |
| Runtime         | Node.js 22.12+                      |
| Package manager | pnpm 10+                            |
| Language        | TypeScript 5.9.3 strict mode        |
| Bot engine      | grammY 1.41.x                       |
| Web server      | Hono 4.x                            |
| Database        | PostgreSQL 16 + pgvector            |
| ORM             | Prisma 7.x and Drizzle for pgvector |
| AI              | Vercel AI SDK 6.x                   |
| Documentation   | Astro 6 + Starlight 0.38            |

## Current Strategic Track

Tempot Core is active as the current product. The future Tempot Cloud SaaS path
is documented but not yet implemented.

Recently completed:

- Spec #025: `user-management` business module.
- Spec #026: architecture isolation and SaaS-readiness hardening.
- Spec #029: public `ai-core` content block contracts.
- Spec #030: public `ai-core` retrieval planning and grounded answer contracts.
- Spec #031: `ai-core` RAG runtime wiring with `retrieveWithPlan`,
  `buildAnswerState`, access-filtered retrieval outcomes, stage timings, and
  optional `rag_search` audit logging.
- Spec #032: `ai-core` RAG evaluation fixtures with deterministic retrieval hit,
  citation coverage, unauthorized leakage, and no-context scoring tests.
- Spec #013: `notifier` package — queue producer, delivery processor, worker
  factory, Telegram adapter, rate policy, and full unit test coverage.
- Spec #016: `document-engine` package with typed export contracts,
  deterministic PDF/XLSX generation, queue request handling, storage upload, and
  completion or failure events.
- Spec #017: `import-engine` package with CSV and spreadsheet parsing, injected
  schema validation, async queue workflow, valid-row batch events, invalid-row
  report requests, and completion or failure events.
- Spec #014: `search-engine` package with typed relational search planning,
  cache-backed state snapshots, pagination metadata, and adapter-driven semantic
  planning.
- DX foundations: `pnpm tempot init`, `pnpm tempot doctor --quick`, and
  `pnpm tempot module create <module-name>`.
- Governance checks: boundary audit and module checklist audit.
- Documentation entry points were restructured for root, product, development,
  and archive documentation.

Active or next work:

1. Continue Phase 3B business module planning after package readiness decisions.
2. Consider future RAG evaluation expansion for latency, token usage, and cost
   only after a separate Product Manager decision.

## Phase Summary

| Phase    | Scope                                               | Status                                          |
| -------- | --------------------------------------------------- | ----------------------------------------------- |
| Phase 0  | Workspace and monorepo foundation                   | Complete                                        |
| Phase 1  | Core bedrock packages                               | Mostly complete; deferred package policy active |
| Phase 2  | Module infrastructure and bot-server reconstruction | Complete                                        |
| Phase 3  | Business modules                                    | Started; `user-management` implemented          |
| Phase 3A | Architecture isolation and SaaS readiness           | Complete                                        |
| Phase 3B | Next business module and supporting packages        | In planning                                     |
| Phase 4  | Dashboard, mini apps, and additional frontends      | Not started                                     |
| Phase 5  | Enterprise infrastructure                           | Not started                                     |
| Phase 6  | Observability and developer experience expansion    | Partially started through DX tooling            |

## Package Status

### Complete

- `@tempot/shared`
- `@tempot/logger`
- `@tempot/database`
- `@tempot/event-bus`
- `@tempot/auth-core`
- `@tempot/session-manager`
- `@tempot/i18n-core`
- `@tempot/regional-engine`
- `@tempot/storage-engine`
- `@tempot/input-engine`
- `@tempot/ux-helpers`
- `@tempot/ai-core`
- `@tempot/sentry`
- `@tempot/settings`
- `@tempot/module-registry`
- `@tempot/notifier` - completed 2026-04-30 (Spec #013).
- `@tempot/document-engine` - completed 2026-05-06 (Spec #016).
- `@tempot/import-engine` - completed 2026-05-06 (Spec #017).
- `@tempot/search-engine` - completed 2026-05-06 (Spec #014).

### Activated Package Execution Sequence

Product Manager decision recorded 2026-05-06: activate the following packages
for SpecKit repair and sequential Superpowers implementation. Rule LXXXV still
applies: only one package may be in active execution at a time.

| Order | Package         | Spec directory                     | Status                                      |
| ----- | --------------- | ---------------------------------- | ------------------------------------------- |
| 1     | document-engine | `016-document-engine-package`      | Implemented and merged                      |
| 2     | import-engine   | `017-import-engine-package`        | Implemented and merged                      |
| 3     | search-engine   | `014-search-engine-package`        | Implemented and merged                      |

### Deferred Under Rule XC

These packages are intentionally deferred until a business module or roadmap
decision activates them:

| #   | Package         | Spec state     | Status      |
| --- | --------------- | -------------- | ----------- |
| 8   | cms-engine      | Forward design | Not started |

Deferred packages are exempt from blocking `pnpm spec:validate` critical
failures until activation is recorded here.

## Application Status

| App               | Status                                        |
| ----------------- | --------------------------------------------- |
| `apps/bot-server` | Implemented and wired to package dependencies |
| `apps/docs`       | Implemented with Astro 6 and Starlight        |
| Dashboard         | Planned                                       |
| Mini apps         | Planned                                       |

## Business Modules

| Module            | Spec | Status      |
| ----------------- | ---- | ----------- |
| `user-management` | #025 | Implemented |

The next business module must start with SpecKit artifacts, Superpowers
execution, `pnpm boundary:audit`, and `pnpm module:checklist`.

## Architecture and Governance Artifacts

Current active references:

- Architecture spec: `docs/archive/tempot_v11_final.md`
- ADR index: `docs/archive/architecture/adr/README.md`
- Boundary audit: `docs/archive/architecture/boundaries/`
- AI RAG methodology: `docs/archive/architecture/ai-rag-methodology.md`
- SaaS readiness: `docs/archive/architecture/saas-readiness.md`
- SaaS migration map: `docs/archive/architecture/saas-migration-map.md`
- Telegram Managed Bots assessment:
  `docs/archive/architecture/telegram-managed-bots-assessment.md`
- Template marketplace plan: `docs/archive/architecture/template-marketplace.md`
- Documentation cleanup plan:
  `docs/archive/developer/documentation-cleanup-plan.md`

## Quality Gates Before Merge

Use the gates relevant to the change:

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
pnpm cms:check
pnpm boundary:audit
pnpm module:checklist
pnpm docs:freshness
pnpm audit --audit-level=high
```

For documentation-only changes, `pnpm spec:validate` is still relevant because
Tempot enforces code-documentation parity.

## Version Vision

| Version | Theme                                        | Status         |
| ------- | -------------------------------------------- | -------------- |
| v1.0    | MVP bot framework core                       | In development |
| v1.1    | Developer experience and templates           | Planned        |
| v1.2    | AI, RAG, anomaly detection, and smart search | Planned        |
| v1.3    | Mini apps and component library              | Planned        |
| v1.4    | Observability dashboard                      | Planned        |
| v2.0    | Multi-bot SaaS and enterprise platform       | Future vision  |

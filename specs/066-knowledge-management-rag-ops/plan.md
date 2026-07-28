# Implementation Plan: Knowledge Management RAG Operations

**Branch**: `codex/knowledge-management-rag-ops` | **Date**: 2026-07-28 |
**Spec**: [spec.md](spec.md)

## Summary

Create a Telegram-facing `knowledge-management` module and a `bot-server`
operations provider that lets super admins operate AI/RAG indexing safely from
inside the bot. The module owns UX, authorization, i18n, confirmations, history
views, and test-query workflows. The provider owns runtime composition with
existing `@tempot/ai-core`, database, source discovery, and RAG readiness checks.

The design intentionally keeps ingestion out of Docker image build. Indexing is
an operator action because it writes database records, calls external AI
providers, consumes credentials, and depends on environment-specific source
mounts.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode on Node.js 22.12+  
**Primary Dependencies**: grammY 1.41.x, Hono 4.x, Prisma 7.x, Drizzle,
PostgreSQL 16 + pgvector, `neverthrow` 8.2.0, `@tempot/ai-core`,
`@tempot/module-registry`, `@tempot/ux-helpers`, `@tempot/event-bus`  
**Testing**: Vitest 4.1.0 unit tests plus focused bot-server provider tests  
**Target Platform**: Tempot Core Docker/local bot runtime  
**Constraints**: no direct AI/database/filesystem imports from the module, no
arbitrary paths, no user-facing text in TypeScript, no direct Prisma in handlers
or services, no blocking long-running handler execution  
**Scale/Scope**: Single-bot operations now, future dashboard-ready contracts
without implementing hosted SaaS behavior

## Constitution Check

| Rule Area | Gate | Status |
| --- | --- | --- |
| Spec-driven work | Spec #066 exists before code. | Pass |
| Module creation | `modules/knowledge-management` must follow module checklist. | Required before implementation |
| AI degradation | Module declares `hasAI: true` and graceful degradation. | Required |
| Clean architecture | Module receives provider from bot-server and does not import AI infra. | Pass by design |
| Security | Source paths are allowlisted only. | Pass by design |
| i18n | All bot text in `locales/ar.json` and `locales/en.json`. | Required |
| UX | Buttons use compact rows, icons, and explicit confirmations. | Required |
| Audit | State-changing ingestion operations are audited or event-backed. | Required |
| TDD | Tests before production behavior. | Required |

## Project Structure

```text
specs/066-knowledge-management-rag-ops/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- knowledge-operations-provider.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md

modules/knowledge-management/
|-- README.md
|-- package.json
|-- tsconfig.json
|-- vitest.config.ts
|-- module.config.ts
|-- module.flow.json
|-- module.manifest.ts
|-- abilities.ts
|-- index.ts
|-- handlers/
|-- menus/
|-- services/
|-- contracts/
|-- locales/
|   |-- ar.json
|   `-- en.json
`-- tests/

apps/bot-server/src/startup/
|-- knowledge-operations.provider.ts
`-- knowledge-source-profiles.ts
```

## Architecture

### Module Boundary

`knowledge-management` owns:

- Telegram commands and callbacks.
- Localized menus and status messages.
- Confirmation flow state.
- Rendering history, job details, and test-query results.
- Calling an injected `KnowledgeOperationsProvider`.

`bot-server` owns:

- Runtime composition of `@tempot/ai-core`.
- PostgreSQL/Drizzle connection setup.
- Approved source profile registry.
- Source mount validation.
- Dry-run and write ingestion execution.
- RAG readiness snapshots.

### Runtime Source Strategy

The production image should stay minimal. Knowledge files must be supplied by
one approved runtime strategy:

1. Local Docker/Desktop: read-only bind mounts from project folders into
   `/app/knowledge-sources/...`.
2. Staging: deployment-specific read-only artifact or volume mount approved by
   operations.
3. Future: separate ingestion worker service triggered by the bot through a
   queue or event bus.

The first implementation should support strategy 1 and document strategies 2
and 3 as follow-up.

## Source Profiles

| Profile | Roots | Content Type | Use |
| --- | --- | --- | --- |
| `product-help` | `docs/product` | `ui-guide` | User-facing `/ask` help. |
| `admin-ops` | `docs/operations`, `docs/architecture` | `developer-docs` | Super-admin operations support. |
| `developer-docs` | `specs`, `packages`, `modules` | `developer-docs` | Maintenance and development knowledge. |
| `full-project` | all approved profiles | mixed | Full reindex after model or corpus changes. |

## Delivery Phases

### Phase 1: Spec And Design Closure

Create SpecKit artifacts, contract docs, and requirement checklist. Run
`pnpm spec:validate`.

### Phase 2: Provider Contract And Tests

Add failing tests for provider contract, status snapshots, source allowlist
validation, and write gating.

### Phase 3: Module UX

Create module scaffold, abilities, menu, callbacks, locales, flow map, and
tests for status, sources, dry-run, write confirmation, full reindex, history,
and test query.

### Phase 4: Runtime Composition

Implement bot-server provider using existing `@tempot/ai-core` services and
source profile registry. Keep source mounts explicit and safe.

### Phase 5: Verification And Evidence

Run focused tests, lint, build, bot runtime build, cms check, keyboard UX check,
spec validation, and Docker local smoke when source mounts are configured.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| Runtime source mount | The production image intentionally excludes full docs/specs source. | Copying all docs into the image increases runtime surface and weakens image reproducibility. |
| Asynchronous job model | Ingestion can be long-running and provider-dependent. | Running write ingestion directly in callback handlers risks Telegram timeouts and poor UX. |

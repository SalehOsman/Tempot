# Implementation Plan: Session Manager

**Branch**: `004-session-manager-package` | **Date**: 2026-03-19 | **Spec**: specs/004-session-manager-package/spec.md
**Input**: Feature specification from `/specs/004-session-manager-package/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Establish the foundational `session-manager` package for the Tempot bot framework, utilizing a dual-layer strategy with Redis for primary fast read (<2ms latency) and PostgreSQL for secondary persistent storage, synced asynchronously via the event-bus and BullMQ. This ensures high performance while preventing data loss, and includes handling for conversation state, schema versioning, and Redis failure degradation.

## Technical Context

**Language/Version**: TypeScript Strict Mode 5.9.3
**Primary Dependencies**: `ioredis` (via `cache-manager`), `bullmq` (via factory), `@tempot/shared`, `@tempot/event-bus`, `@tempot/database`, `neverthrow`
**Storage**: Redis (Fast Cache), PostgreSQL (Persistent Storage via Prisma)
**Testing**: Vitest + Testcontainers
**Target Platform**: Node.js 20+ Server Environment
**Project Type**: Internal NPM Package (`packages/session-manager`)
**Performance Goals**: < 2ms Redis retrieval time on average
**Constraints**: Zero hardcoded i18n text, strict Result pattern error handling, strictly no `any` types.
**Scale/Scope**: Millions of sessions. Background sync needs to handle Telegram's rapid messaging frequency without dropping updates (using Optimistic Concurrency Control).

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Rule I (TS Strict):** Passed - Package will strictly use TypeScript and no `any` types.
- **Rule XIV (Repository Pattern):** Passed - Postgres access strictly relies on `BaseRepository` via `packages/database`.
- **Rule XV (Event-Driven):** Passed - Synchronization strictly utilizes the `event-bus` rather than direct synchronous coupling.
- **Rule XIX/XX (Cache & Queues):** Passed - `cache-manager` and queue factory strictly used over custom direct instances.
- **Rule XXI (Result Pattern):** Passed - API completely wrapped in `neverthrow`.
- **Rule XXXII (Redis Degradation):** Passed - Explicit fallbacks implemented for Redis failures.
- **Rule XXXIV (TDD Mandatory):** Passed - Implementation will follow TDD as required by Superpowers.

## Project Structure

### Documentation (this feature)

```text
specs/004-session-manager-package/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/session-manager/
├── src/
│   ├── index.ts
│   ├── session.provider.ts
│   ├── session.context.ts
│   ├── session.types.ts
│   ├── session.constants.ts
│   ├── session.migrator.ts
│   ├── session.repository.ts
│   └── session.worker.ts
└── tests/
    ├── unit/
    │   ├── provider.test.ts
    │   ├── context.test.ts
    │   ├── migration.test.ts
    │   └── session.worker.test.ts
    ├── integration/
    │   └── session-integration.test.ts
    └── utils/
        └── test-redis.ts
```

**Structure Decision**: A single-package layout under `packages/session-manager` aligns with the Tempot V11 architecture.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |

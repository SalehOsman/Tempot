# Implementation Plan: Documentation Ingestion Runtime Composition

**Branch**: `codex/ai-rag-runtime-composition` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/063-docs-ingestion-runtime-composition/spec.md`

## Summary

Convert the docs ingestion CLI from a partial helper command into an
operator-safe runtime command. The implementation adds explicit dry-run and
write modes, composes live AI/database dependencies only in write mode, and
persists hashes only after successful file ingestion.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: `@tempot/ai-core`, `@tempot/database`,
`@tempot/shared`, `neverthrow`, `pg`, `drizzle-orm`, `tsx`
**Storage**: PostgreSQL 16 with pgvector through the existing embeddings table
**Testing**: Vitest 4.1.0
**Target Platform**: Node.js 22.12+ operator CLI
**Project Type**: Monorepo CLI script inside the docs app
**Performance Goals**: Incremental ingestion skips unchanged files and avoids AI
provider calls in dry-run mode
**Constraints**: Explicit write mode, no hardcoded user-facing bot text, public
fallible runtime composition returns `Result`/`AsyncResult`, no direct business
module database access
**Scale/Scope**: Documentation Markdown files under `docs/product`

## Constitution Check

- **TypeScript strict mode**: Pass. The implementation remains TypeScript and
  does not use `any`.
- **Error handling**: Pass. Runtime composition and ingestion orchestration use
  `Result`/`AsyncResult` with `AppError`.
- **Module isolation**: Pass. This is an operator CLI; business modules do not
  directly compose database or provider dependencies.
- **i18n rule**: Pass. No Telegram user-facing text is introduced.
- **TDD gate**: Required. Unit tests for the orchestration behavior must fail
  before implementation.
- **Documentation language**: Pass. All feature artifacts and docs are English.

## Project Structure

### Documentation (this feature)

```text
specs/063-docs-ingestion-runtime-composition/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/docs/
├── scripts/
│   ├── docs.types.ts
│   ├── ingest-docs.ts
│   ├── ingest-runner.ts
│   └── ingest-runtime.ts
└── tests/
    └── unit/
        └── ingest-docs.test.ts
```

**Structure Decision**: Keep the CLI entry point in the existing docs script,
place ingestion orchestration in a dedicated runner module, and place runtime
dependency composition in a separate script module to keep live database and AI
provider wiring isolated from pure ingestion helpers.

## Complexity Tracking

No constitution violations are planned.

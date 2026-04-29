# Implementation Plan: AI Core RAG Reconciliation

**Branch**: `028-ai-core-rag-reconciliation` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/028-ai-core-rag-reconciliation/spec.md`

## Summary

Reconcile the completed `ai-core` package with the approved Tempot RAG methodology by fixing stale documentation, replacing user-facing confirmation prose with i18n-compatible keys and structured status, and documenting the handoff from Spec #027.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: Vercel AI SDK 6.x, neverthrow 8.2.0, Vitest 4.1.0
**Storage**: N/A for this slice
**Testing**: Vitest unit tests for `@tempot/ai-core`
**Target Platform**: Node.js monorepo package runtime
**Project Type**: Existing package and documentation reconciliation
**Performance Goals**: No new runtime overhead beyond JSON serialization for confirmation tool status
**Constraints**: Result pattern, i18n-only user text, no deferred package activation, clean diff
**Scale/Scope**: `packages/ai-core`, `specs/015-ai-core-package`, Spec #027 handoff, roadmap

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

- Rule XXXIX i18n-only: PASS. Confirmation prose moves out of package source.
- Rule XXI Result pattern: PASS. Public API continues returning `AsyncResult<IntentResult, AppError>`.
- Rule IX single responsibility: PASS. Scope is ai-core reconciliation only.
- Rule XVI pluggable architecture: PASS. Provider configuration remains environment-driven.
- Rule XXXIV TDD mandatory: PASS. Confirmation behavior changes require failing unit tests first.
- Rule XC deferred packages: PASS. `search-engine`, `document-engine`, and `import-engine` remain deferred.

## Project Structure

### Documentation

```text
specs/028-ai-core-rag-reconciliation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- confirmation-routing-contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
packages/ai-core/
|-- README.md
|-- src/router/intent.router.ts
`-- tests/unit/intent.router.test.ts

specs/015-ai-core-package/
|-- spec.md
`-- tasks.md

docs/archive/
`-- ROADMAP.md
```

**Structure Decision**: Keep the implementation inside the existing `ai-core` package. This feature updates only reconciliation artifacts and the confirmation-routing behavior that violates i18n.

## Complexity Tracking

No constitution violations require justification.

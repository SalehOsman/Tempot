# Implementation Plan: AI Core RAG Evaluation Fixtures

**Branch**: `032-ai-core-rag-evaluation-fixtures` | **Date**: 2026-05-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/032-ai-core-rag-evaluation-fixtures/spec.md`

## Summary

Add test-only RAG evaluation fixtures, scoring helpers, and unit tests for `packages/ai-core`.
The implementation uses Spec #031 runtime contracts (`RetrievalRequest`, `RetrievalOutcome`,
and `RAGAnswerState`) and fake `EmbeddingService` results to measure retrieval hit, citation
coverage, unauthorized-source leakage, and no-context correctness offline. No CLI, evaluator
service, new dependency, schema change, or deferred package activation is introduced.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: Vitest 4.1.0, neverthrow 8.2.0, `@tempot/shared`, existing
`@tempot/ai-core` runtime contracts
**Storage**: N/A - test-only fixtures, no persistent entities
**Testing**: Vitest unit tests with fake `EmbeddingService` results
**Target Platform**: Node.js 22.12+ monorepo
**Project Type**: Monorepo package test update - `packages/ai-core` only
**Performance Goals**: Fixture evaluation completes in unit-test time without network, database,
or Testcontainers I/O
**Constraints**:
  - Result pattern for fallible helper APIs
  - No `any`, no `@ts-ignore`, no `@ts-expect-error`, no `eslint-disable`
  - No hardcoded user-facing text; expected messages use i18n keys only
  - No new CLI, service, package dependency, schema change, or deferred package activation
  - Keep diffs scoped to `packages/ai-core/tests/`, Spec #032 artifacts, and feature pointer
**Scale/Scope**: Minimum four deterministic fixture cases and unit tests for all approved metric
categories

## Constitution Check

| Rule Area | Status | Notes |
| --- | --- | --- |
| TypeScript strict mode | PASS | Test helper types use existing contracts and no `any` |
| File naming | PASS | Planned files use descriptive names, not banned generic names |
| Result pattern | PASS | Fallible evaluation helper returns `Result<T, AppError>` |
| i18n-only user text | PASS | No-context expectations use message keys |
| Package isolation | PASS | `packages/ai-core` tests only; no shared package changes |
| Deferred package policy | PASS | No activation of `search-engine`, `document-engine`, or `import-engine` |
| TDD mandatory | PASS | Tasks require failing tests before helper implementation |
| Clean diff | PASS | No unrelated formatting or runtime behavior changes |
| No test scaffolding in production | PASS | Fixtures and helpers stay under `tests/` |

## Project Structure

### Documentation (this feature)

```text
specs/032-ai-core-rag-evaluation-fixtures/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/rag-evaluation-fixtures.md
  checklists/requirements.md
  tasks.md
```

### Source Code (repository root)

```text
packages/ai-core/tests/
  fixtures/
    rag-evaluation.fixtures.ts
  helpers/
    rag-evaluation.helper.ts
  unit/
    rag-evaluation-fixtures.test.ts
```

**Structure Decision**: This is a test-only package slice. Fixtures and helpers live under
`packages/ai-core/tests/` so no runtime public API, barrel export, package dependency, or
changeset is required unless implementation discovers a necessary runtime change.

## Implementation Strategy

1. Point `.specify/feature.json` at Spec #032 and keep work inside the isolated worktree.
2. Write failing unit tests for the fixture catalog and scoring behavior (RED).
3. Add the typed fixture catalog under `packages/ai-core/tests/fixtures/`.
4. Add the typed scoring helper under `packages/ai-core/tests/helpers/`.
5. Run targeted `ai-core` tests to GREEN.
6. Run lint, spec validation, and whitespace validation.
7. Update ROADMAP only after implementation is complete and ready to merge.

## Phase Relationship

| Spec | Responsibility |
| --- | --- |
| #027 | RAG methodology and evaluation dimensions |
| #029 | Content block public contracts |
| #030 | Retrieval plan and answer-state contracts |
| #031 | Runtime RAG wiring through `retrieveWithPlan` and `buildAnswerState` |
| #032 | This spec - deterministic RAG evaluation fixtures and test helpers |

## Complexity Tracking

No constitution violations or complexity exceptions are planned.

## Backward Compatibility Contract

The implementation must not change:

```typescript
retrieve(options: RetrieveOptions): AsyncResult<RAGContext, AppError>
retrieveWithPlan(request: RetrievalRequest): AsyncResult<RetrievalOutcome, AppError>
buildAnswerState(outcome: RetrievalOutcome): Result<RAGAnswerState, AppError>
```

All new logic is test-only and must not require consumers of `@tempot/ai-core` to migrate.

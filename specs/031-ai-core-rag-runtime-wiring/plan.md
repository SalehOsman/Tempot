# Implementation Plan: AI Core RAG Runtime Wiring

**Branch**: `031-ai-core-rag-runtime-wiring` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)

## Summary

Wire the `RetrievalPlan` and `RAGAnswerState` contracts from Spec #030 into the existing
`RAGPipeline` service. The pipeline gains a new `retrieveWithPlan(request)` method that
validates the request, builds a default plan, executes steps, enforces access filtering,
records timings, and returns a `RetrievalOutcome`. A companion `buildAnswerState(outcome)`
method converts the outcome into a structured `RAGAnswerState`. The old `retrieve` method
remains untouched for backward compatibility.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: neverthrow 8.2.0, `@tempot/shared`, `@tempot/database`
**Storage**: No schema changes
**Testing**: Vitest 4.1.0 unit tests with vi.fn() mocks
**Target Platform**: Node.js 22.12+ monorepo
**Project Type**: Monorepo package update — `packages/ai-core` only
**Performance Goals**: Plan build < 1ms; per-step timing recorded; no new I/O paths added
**Constraints**:
  - Result pattern for all fallible paths
  - i18n keys only for user-facing message keys
  - Max 200 lines per source file
  - No deferred package activation
  - No database schema changes
  - Backward-compatible: existing `retrieve(RetrieveOptions)` must not change

## Constitution Check

| Rule Area                | Status | Notes                                                              |
| ------------------------ | ------ | ------------------------------------------------------------------ |
| TypeScript strict mode   | PASS   | No `any`, no `@ts-ignore`                                          |
| No hardcoded user text   | PASS   | All `messageKey` values are i18n key strings                       |
| Result pattern           | PASS   | `retrieveWithPlan` and `buildAnswerState` return `Result`          |
| Package isolation        | PASS   | All changes stay in `packages/ai-core`                             |
| Deferred package policy  | PASS   | `search-engine`, `document-engine`, `import-engine` remain deferred|
| TDD mandatory            | PASS   | Failing tests written before implementation                        |
| Clean diff               | PASS   | Only `packages/ai-core` and spec artifacts are modified            |
| Max lines per file       | PASS   | Three new files; each planned under 200 lines                      |

## Project Structure

### New files

```text
packages/ai-core/src/rag/
  retrieval-plan.builder.ts       — builds a default RetrievalPlan from a RetrievalRequest
  retrieval-plan.executor.ts      — executes a RetrievalPlan and returns a RetrievalOutcome
packages/ai-core/tests/unit/
  rag-runtime-wiring.test.ts      — unit tests for retrieveWithPlan and buildAnswerState
```

### Modified files

```text
packages/ai-core/src/rag/
  rag-pipeline.service.ts         — adds retrieveWithPlan and buildAnswerState methods
packages/ai-core/src/
  index.ts                        — exports RetrievalPlanBuilder and RetrievalPlanExecutor
```

### Spec artifacts

```text
specs/031-ai-core-rag-runtime-wiring/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/runtime-wiring-contract.md
  checklists/requirements.md
  tasks.md
```

## Implementation Strategy

1. Create spec artifacts and point `.specify/feature.json` at Spec #031.
2. Write failing unit tests (RED) covering all acceptance scenarios.
3. Implement `RetrievalPlanBuilder` — pure function, no I/O.
4. Implement `RetrievalPlanExecutor` — wraps `EmbeddingService`, enforces access filter.
5. Extend `RAGPipeline` with `retrieveWithPlan` and `buildAnswerState`.
6. Wire optional `AuditService` dep into `RAGPipeline` constructor.
7. Run tests to GREEN.
8. Export new internals through `index.ts`.
9. Update ROADMAP, CHANGELOG, and add changeset.

## Phase Relationship

| Spec | Responsibility                                         |
| ---- | ------------------------------------------------------ |
| #027 | RAG methodology reference                              |
| #029 | Content block public contracts                         |
| #030 | Retrieval plan and RAG answer state public contracts   |
| #031 | **This spec** — wire contracts into runtime pipeline   |
| #032 | Future: evaluation fixtures and RAG quality metrics    |

## Complexity Tracking

| Item | Why needed | Simpler alternative rejected because |
| ---- | ---------- | ------------------------------------ |
| `RetrievalPlanBuilder` extracted to own file | Keeps `rag-pipeline.service.ts` under 200 lines | Inline would exceed limit |
| `RetrievalPlanExecutor` extracted to own file | Step execution logic needs independent testability | Combined would violate SRP and max-lines |
| Backward-compatible `retrieve` method | `TelegramAssistantUI` and `IntentRouter` use it | Migration is a separate spec |

## Backward Compatibility Contract

The existing `retrieve(options: RetrieveOptions): AsyncResult<RAGContext, AppError>` method
signature, behavior, and return type MUST remain identical. No modifications to callers are
required in this slice.

New surface area added:

```typescript
retrieveWithPlan(request: RetrievalRequest): AsyncResult<RetrievalOutcome, AppError>
buildAnswerState(outcome: RetrievalOutcome): Result<RAGAnswerState, AppError>
```

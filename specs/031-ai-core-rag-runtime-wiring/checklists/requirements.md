# Requirements Checklist: AI Core RAG Runtime Wiring

**Feature**: 031-ai-core-rag-runtime-wiring
**Date**: 2026-04-30

## Functional Requirements

- [ ] FR-001: `RAGPipeline` exposes `retrieveWithPlan(request)` returning `AsyncResult<RetrievalOutcome, AppError>`
- [ ] FR-002: `retrieveWithPlan` validates `RetrievalRequest` before execution
- [ ] FR-003: `retrieveWithPlan` builds a default `RetrievalPlan` containing vector, access-filter, and context-assembly steps
- [ ] FR-004: access-filter step records rejected block ids with `access-denied` reason before context assembly
- [ ] FR-005: `RetrievalOutcome.timings` contains at least one entry per executed step
- [ ] FR-006: `RAGPipeline` exposes `buildAnswerState(outcome)` returning `Result<RAGAnswerState, AppError>`
- [ ] FR-007: `buildAnswerState` returns `answered` with citations when outcome has selected blocks and is not degraded
- [ ] FR-008: `buildAnswerState` returns `no-context` with i18n `messageKey` when outcome has no selected blocks and is not degraded
- [ ] FR-009: `buildAnswerState` returns `degraded` with i18n `messageKey` when outcome is marked `degraded: true`
- [ ] FR-010: existing `retrieve(RetrieveOptions)` method is unchanged
- [ ] FR-011: `retrieveWithPlan` emits `rag_search` audit entry when `AuditService` dep is provided; audit failure does not propagate
- [ ] FR-012: all new fallible public methods return `Result<T, AppError>`
- [ ] FR-013: no deferred packages activated, no schema changes
- [ ] FR-014: all new source files are under 200 lines

## Constitution Rules

- [ ] TypeScript strict mode — no `any`, no `@ts-ignore`
- [ ] No hardcoded user text — all `messageKey` values are i18n keys
- [ ] Result pattern — all fallible paths return `Result`
- [ ] Package isolation — changes stay in `packages/ai-core`
- [ ] TDD — tests written RED before implementation
- [ ] Clean diff — only `packages/ai-core` and spec files modified
- [ ] Max lines — no single new file exceeds 200 lines

## Success Criteria

- [ ] SC-001: unit tests pass for valid request → outcome, empty no-context, degraded, backward-compat, access-filter rejection, audit emission
- [ ] SC-002: `pnpm --filter @tempot/ai-core test` passes
- [ ] SC-003: `pnpm lint` passes
- [ ] SC-004: `pnpm spec:validate` reports zero critical issues
- [ ] SC-005: `git diff --check` reports no whitespace errors
- [ ] SC-006: `TelegramAssistantUI` and `IntentRouter` compile and their tests pass without modification

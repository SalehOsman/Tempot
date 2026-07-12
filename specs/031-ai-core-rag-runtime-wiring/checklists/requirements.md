# Requirements Checklist: AI Core RAG Runtime Wiring

**Feature**: 031-ai-core-rag-runtime-wiring
**Date**: 2026-04-30
**Status**: Complete

## Functional Requirements

- [x] FR-001: `RAGPipeline` exposes `retrieveWithPlan(request)` returning `AsyncResult<RetrievalOutcome, AppError>`.
- [x] FR-002: `retrieveWithPlan` validates `RetrievalRequest` before execution.
- [x] FR-003: `retrieveWithPlan` builds a default `RetrievalPlan` containing vector, access-filter, and context-assembly steps.
- [x] FR-004: access-filter step records rejected block ids with `access-denied` reason before context assembly.
- [x] FR-005: `RetrievalOutcome.timings` contains at least one entry per executed step.
- [x] FR-006: `RAGPipeline` exposes `buildAnswerState(outcome)` returning `Result<RAGAnswerState, AppError>`.
- [x] FR-007: `buildAnswerState` returns `answered` with citations when outcome has selected blocks and is not degraded.
- [x] FR-008: `buildAnswerState` returns `no-context` with i18n `messageKey` when outcome has no selected blocks and is not degraded.
- [x] FR-009: `buildAnswerState` returns `degraded` with i18n `messageKey` when outcome is marked `degraded: true`.
- [x] FR-010: existing `retrieve(RetrieveOptions)` method is unchanged.
- [x] FR-011: `retrieveWithPlan` emits `rag_search` audit entry when `AuditService` dep is provided; audit failure does not propagate.
- [x] FR-012: all new fallible public methods return `Result<T, AppError>`.
- [x] FR-013: no deferred packages activated and no schema changes were introduced by this slice.
- [x] FR-014: all new source files stay under 200 lines.

## Constitution Rules

- [x] TypeScript strict mode: no `any`, no `@ts-ignore`.
- [x] No hardcoded user text: all answer messages use i18n message keys.
- [x] Result pattern: all fallible paths return `Result`.
- [x] Package isolation: implementation stayed in `packages/ai-core`.
- [x] TDD: tests were written before implementation tasks.
- [x] Clean diff: only planned package and spec files were changed.
- [x] Max lines: no single new source file exceeds 200 lines.

## Success Criteria

- [x] SC-001: unit tests pass for valid request to outcome, empty no-context, degraded, backward compatibility, access-filter rejection, and audit emission.
- [x] SC-002: `pnpm --filter @tempot/ai-core test` passed during feature completion.
- [x] SC-003: `pnpm lint` passed during feature completion.
- [x] SC-004: `pnpm spec:validate` reported zero critical issues during feature completion.
- [x] SC-005: `git diff --check` reported no whitespace errors during feature completion.
- [x] SC-006: `TelegramAssistantUI` and `IntentRouter` compiled and their tests passed without behavior migration.

## Runtime Activation Note

This checklist closes the package-level RAG runtime wiring slice only. It does
not mean AI/RAG is active in the Telegram bot runtime. Bot activation is tracked
in `docs/architecture/ai-rag-runtime-activation-plan.md`.

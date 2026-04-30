# Contract: RAG Runtime Wiring

**Feature**: 031-ai-core-rag-runtime-wiring
**Date**: 2026-04-30

## New Public Methods on RAGPipeline

### retrieveWithPlan

```typescript
retrieveWithPlan(
  request: RetrievalRequest
): AsyncResult<RetrievalOutcome, AppError>
```

**Pre-conditions**:
- `request` passes `validateRetrievalRequest` — returns `RETRIEVAL_REQUEST_INVALID` otherwise.
- Built plan passes `validateRetrievalPlan` — returns `RETRIEVAL_PLAN_INVALID` otherwise.
- Access-filter step exists before context-assembly — returns `RETRIEVAL_PLAN_ACCESS_FILTER_MISSING` otherwise.

**Post-conditions**:
- Returns `ok(RetrievalOutcome)` on success (even if no blocks were selected).
- `outcome.selectedBlockIds` contains only block ids that passed the access-filter step.
- `outcome.rejectedBlocks` contains entries for every block excluded with a typed reason code.
- `outcome.timings` contains at least one entry per executed step.
- `outcome.degraded` is `false` for a normal empty result; `true` only when a required step
  degrades gracefully due to a non-fatal failure.

**Error codes returned**:
- `ai-core.retrieval_request.invalid` — request validation failed.
- `ai-core.retrieval_plan.invalid` — plan build validation failed.
- `ai-core.retrieval_plan.access_filter_missing` — plan missing access-filter before assembly.
- `ai-core.rag.search_failed` — embedding service call failed.

---

### buildAnswerState

```typescript
buildAnswerState(
  outcome: RetrievalOutcome
): Result<RAGAnswerState, AppError>
```

**Decision rules** (see data-model.md for full table):
- `selectedBlockIds.length > 0` and not degraded → `answered` with citations.
- `selectedBlockIds.length > 0` and degraded → `degraded` with `messageKey`.
- `selectedBlockIds.length === 0` → `no-context` or `degraded` with `messageKey`.

**Message key values** (i18n keys, never hardcoded user strings):
- `ai-core.rag.no_context`
- `ai-core.rag.degraded`

**Error codes returned**:
- `ai-core.rag.grounding_invalid` — answered state with no citations (should not happen
  in normal flow; guard against direct calls with malformed outcome).

---

## Unchanged Public Method (backward-compatible)

```typescript
retrieve(options: RetrieveOptions): AsyncResult<RAGContext, AppError>
```

This method signature, behavior, and return type are frozen for this spec.
No modifications to callers are required.

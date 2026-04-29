# Research: AI Core RAG Reconciliation

**Feature**: 028-ai-core-rag-reconciliation
**Date**: 2026-04-29

## Decision 1: Start RAG execution by reconciling ai-core

**Decision**: The first implementation slice after Spec #027 is source-of-truth reconciliation for `ai-core`.

**Rationale**: Spec #027 identified existing drift in `ai-core` documentation and confirmation behavior. Correcting that baseline reduces risk before any RAG package activation.

**Alternatives Rejected**:

- Activate `search-engine` immediately: rejected because retrieval contracts should depend on a clean `ai-core` baseline.
- Build document ingestion first: rejected because Spec #027 keeps document packages deferred until explicit activation.

## Decision 2: Use i18n key strings for confirmation response

**Decision**: `IntentRouter.route()` returns `ai-core.confirmation.required` in `IntentResult.response` when a confirmation is required.

**Rationale**: The current `IntentResult.response` contract is a string. Returning an i18n key preserves the public shape while moving user text ownership to the UI layer.

**Alternatives Rejected**:

- Add `responseKey` and make `response` optional: rejected for this slice because it would broaden the public API change.
- Translate inside `IntentRouter`: rejected because the router package does not own user locale or UI translation.

## Decision 3: Use JSON tool status for confirmation callbacks

**Decision**: The AI SDK tool callback returns JSON containing `status`, `confirmationId`, and `toolName` when execution is paused for confirmation.

**Rationale**: The callback value is machine-readable state for the agent loop, not user-facing prose. It avoids hardcoded English while preserving traceability.

**Alternatives Rejected**:

- Return an English sentence: rejected by Rule XXXIX.
- Return only the confirmation ID: rejected because the model and logs lose status context.

## Decision 4: Reconcile historical tasks instead of preserving obsolete unchecked tasks

**Decision**: Replace the obsolete `specs/015-ai-core-package/tasks.md` execution list with a reconciled status artifact.

**Rationale**: Hundreds of unchecked tasks for completed behavior are misleading and unsafe for future agents. A concise reconciliation artifact is a better source of truth.

**Alternatives Rejected**:

- Leave tasks unchanged: rejected because it keeps stale `AIDegradationMode` and old package guidance active.
- Delete the tasks file: rejected because SpecKit artifacts should remain complete.

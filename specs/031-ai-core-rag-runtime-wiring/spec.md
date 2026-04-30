# Feature Specification: AI Core RAG Runtime Wiring

**Feature Branch**: `031-ai-core-rag-runtime-wiring`
**Created**: 2026-04-30
**Status**: Draft
**Input**: Wire the `RetrievalPlan` and `RAGAnswerState` contracts from Spec #030 into the
existing `RAGPipeline` so runtime retrieval uses the validated plan model, enforces access
filtering, and returns structured answer states instead of raw context strings.

## User Scenarios & Testing

### User Story 1 - RAGPipeline accepts a RetrievalRequest and produces a RetrievalOutcome (Priority: P1)

As a package developer, I want `RAGPipeline.retrieve` to accept a `RetrievalRequest`, build a
`RetrievalPlan` internally, execute retrieval steps, and return a `RetrievalOutcome` so callers
can trace which blocks were selected, rejected, and why.

**Why this priority**: The contracts from Spec #030 are public but not connected to runtime
behavior. Without this wiring the contracts have no effect on execution.

**Independent Test**: A unit test passes a `RetrievalRequest` into `RAGPipeline.retrieve` and
asserts that the returned `RetrievalOutcome` includes at least one selected block id, a timing
entry, and no unauthorized block ids in the selected set.

**Acceptance Scenarios**:

1. **Given** a valid `RetrievalRequest` with query text and user scope, **When** `retrieve` runs,
   **Then** it returns `ok(RetrievalOutcome)` with selected block ids and stage timings.
2. **Given** a request for a user with no authorized content types, **When** `retrieve` runs,
   **Then** it returns `ok(RetrievalOutcome)` with empty `selectedBlockIds` and `degraded: false`.
3. **Given** embedding search fails, **When** `retrieve` runs, **Then** it returns
   `err(AppError)` with code `ai-core.rag.search_failed`.
4. **Given** retrieval returns blocks, some of which the user cannot access, **When** the
   access-filter step runs, **Then** rejected blocks appear in `rejectedBlocks` with reason
   `access-denied` and are absent from `selectedBlockIds`.

---

### User Story 2 - RAGPipeline produces a RAGAnswerState from a retrieved outcome (Priority: P1)

As a bot or module integration author, I want `RAGPipeline` to produce a `RAGAnswerState`
that is either `answered` with citations, or `no-context` with an i18n key, so the caller
never receives a raw string that requires client-side interpretation.

**Why this priority**: The current pipeline returns a plain context string. Callers cannot
distinguish answered from no-context programmatically without parsing text.

**Independent Test**: A unit test calls `RAGPipeline.buildAnswerState` with a `RetrievalOutcome`
that has selected blocks and asserts state is `answered` with at least one citation. A second
test passes an empty outcome and asserts state is `no-context` with a non-blank `messageKey`.

**Acceptance Scenarios**:

1. **Given** a `RetrievalOutcome` with at least one selected block, **When** `buildAnswerState`
   runs, **Then** it returns `ok(RAGAnswerState)` with state `answered` and citations mapping to
   block ids.
2. **Given** a `RetrievalOutcome` with no selected blocks, **When** `buildAnswerState` runs,
   **Then** it returns `ok(RAGAnswerState)` with state `no-context` and a non-blank `messageKey`.
3. **Given** a degraded `RetrievalOutcome`, **When** `buildAnswerState` runs, **Then** it returns
   state `degraded` with a non-blank `messageKey`.

---

### User Story 3 - Callers can migrate from RetrieveOptions to RetrievalRequest gradually (Priority: P2)

As a consumer of `RAGPipeline`, I want the old `RetrieveOptions` interface to remain available
through a compatibility adapter so existing callers are not broken before they migrate.

**Why this priority**: `TelegramAssistantUI` and `IntentRouter` use the current `retrieve`
signature. Breaking them in this slice would cascade across the package.

**Independent Test**: A unit test calls `RAGPipeline.retrieve` with a legacy `RetrieveOptions`
object and receives a result in the existing `RAGContext` shape without errors.

**Acceptance Scenarios**:

1. **Given** a caller passes `RetrieveOptions`, **When** `retrieve` is called, **Then** it
   adapts internally to `RetrievalRequest` and still returns `ok(RAGContext)`.
2. **Given** a caller passes a `RetrievalRequest` directly, **When** `retrieveWithPlan` is
   called, **Then** it returns `ok(RetrievalOutcome)` with the full plan-driven result.

---

### User Story 4 - Audit log records retrieval plan execution (Priority: P2)

As an operator, I want every `retrieveWithPlan` call to emit a structured audit event so
retrieval decisions are traceable for evaluation and debugging.

**Why this priority**: Spec #027 requires RAG quality to be measurable. Audit events are the
foundation for future evaluation fixtures.

**Independent Test**: A unit test calls `retrieveWithPlan` with a mock audit service and asserts
that an audit entry with action `rag_search` was logged with timing metadata from the outcome.

**Acceptance Scenarios**:

1. **Given** a retrieval plan is executed, **When** `retrieveWithPlan` completes, **Then** it
   logs a `rag_search` audit entry containing the plan id, outcome id, selected count, rejected
   count, and total duration.
2. **Given** audit logging fails, **When** `retrieveWithPlan` runs, **Then** the audit failure
   does not propagate to the caller; the outcome is still returned.

## Edge Cases

- A `RetrievalRequest` with no authorized content types produces an empty outcome, not an error.
- Access filter must run before context assembly; a plan missing access-filter is rejected at
  validation before execution.
- Relationship expansion must not expose unauthorized blocks through traversal.
- Embedding search failure returns `err` immediately; partial results are not accepted.
- `buildAnswerState` on a degraded outcome with selected blocks uses `degraded`, not `answered`.
- This slice must not activate `search-engine`, `document-engine`, or `import-engine`.
- This slice must not add physical database schema changes.
- The old `retrieve(RetrieveOptions)` signature must continue to work unchanged for existing
  callers until they opt in to the new `retrieveWithPlan(RetrievalRequest)` method.

## Requirements

### Functional Requirements

- **FR-001**: `RAGPipeline` MUST expose a new `retrieveWithPlan(request: RetrievalRequest)`
  method that returns `AsyncResult<RetrievalOutcome, AppError>`.
- **FR-002**: `retrieveWithPlan` MUST validate the incoming `RetrievalRequest` using
  `validateRetrievalRequest` before execution.
- **FR-003**: `retrieveWithPlan` MUST build a default `RetrievalPlan` from the request
  containing at minimum: a vector step, an access-filter step, and a context-assembly step.
- **FR-004**: `retrieveWithPlan` MUST execute the access-filter step before context assembly
  and record rejected block ids with reason codes in the outcome.
- **FR-005**: `retrieveWithPlan` MUST record stage timings for each executed step in
  `RetrievalOutcome.timings`.
- **FR-006**: `RAGPipeline` MUST expose a `buildAnswerState(outcome: RetrievalOutcome)`
  method that returns `Result<RAGAnswerState, AppError>`.
- **FR-007**: `buildAnswerState` MUST return state `answered` with citations when the outcome
  has at least one selected block id.
- **FR-008**: `buildAnswerState` MUST return state `no-context` with an i18n `messageKey` when
  the outcome has no selected blocks and is not degraded.
- **FR-009**: `buildAnswerState` MUST return state `degraded` with an i18n `messageKey` when
  the outcome is marked `degraded: true`.
- **FR-010**: The existing `retrieve(options: RetrieveOptions)` method MUST remain unchanged
  to preserve backward compatibility with `TelegramAssistantUI` and `IntentRouter`.
- **FR-011**: `retrieveWithPlan` MUST emit a `rag_search` audit entry via `AuditService` when
  an audit service is provided in deps; audit failure MUST NOT propagate.
- **FR-012**: All new fallible public methods MUST return `Result<T, AppError>`.
- **FR-013**: This slice MUST NOT activate deferred packages or introduce schema changes.
- **FR-014**: All new source files MUST stay within 200 lines (Rule: max-lines).

### Key Entities

- **RAGPipeline**: Extended with `retrieveWithPlan` and `buildAnswerState` methods.
- **RetrievalPlanBuilder**: Internal helper that constructs a default `RetrievalPlan` from a
  `RetrievalRequest`.
- **RetrievalPlanExecutor**: Internal helper that executes a `RetrievalPlan` against the
  embedding service and returns a `RetrievalOutcome`.

## Success Criteria

- **SC-001**: Unit tests pass for: valid request producing outcome, empty-result no-context
  state, degraded state, backward-compatible `retrieve`, access-filter rejection recording,
  and audit event emission.
- **SC-002**: `pnpm --filter @tempot/ai-core test` passes.
- **SC-003**: `pnpm lint` passes.
- **SC-004**: `pnpm spec:validate` reports zero critical issues.
- **SC-005**: `git diff --check` reports no whitespace errors.
- **SC-006**: `TelegramAssistantUI` and `IntentRouter` compile and their tests pass without
  modification.

## Assumptions

- Spec #029 content block contracts and Spec #030 retrieval plan contracts are the stable
  foundation for this slice.
- The default plan built internally uses vector retrieval only; lexical and relationship steps
  are reserved for a future slice when `search-engine` is activated.
- `AuditService` is an optional dep; the pipeline must work without it.
- Physical `ContentBlock` rows are not required; the wiring works with the existing
  `EmbeddingSearchResult` shape until full content block persistence is implemented.
- Arabic remains the primary user-facing language; all `messageKey` values must be i18n keys,
  never hardcoded strings.

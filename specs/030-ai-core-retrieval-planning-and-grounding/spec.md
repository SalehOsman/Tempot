# Feature Specification: AI Core Retrieval Planning And Grounding

**Feature Branch**: `030-ai-core-retrieval-planning-and-grounding`
**Created**: 2026-04-29
**Status**: Complete
**Input**: Continue Spec #027 by adding retrieval planning and grounded answer state contracts to `ai-core` after Spec #029 introduced content block contracts.

## User Scenarios & Testing

### User Story 1 - AI core can describe a retrieval plan before execution (Priority: P1)

As a package developer, I want `ai-core` to expose a typed retrieval plan so future search implementations can add vector, lexical, relationship, and rerank steps without changing callers.

**Why this priority**: Tempot needs a stable contract before activating `search-engine` or expanding retrieval beyond the current vector-first pipeline.

**Independent Test**: A unit test imports the public `ai-core` barrel and validates a retrieval plan containing vector retrieval, access filtering, and reranking steps.

**Acceptance Scenarios**:

1. **Given** a retrieval request with a query, locale, content types, user scope, and limits, **When** the plan is validated, **Then** validation returns `ok(plan)`.
2. **Given** a plan contains an unsupported step type, **When** validation runs, **Then** validation returns a typed `AppError`.
3. **Given** a plan omits access filtering, **When** validation runs, **Then** validation rejects the plan before it can be executed.

---

### User Story 2 - RAG answers have explicit states (Priority: P1)

As a bot or module integration author, I want RAG output to distinguish answered, no-context, degraded, and refused states so user interfaces can respond without parsing text.

**Why this priority**: The current methodology requires grounded answers and localized no-context behavior. Structured states prevent unsupported answer claims.

**Independent Test**: A unit test validates that each supported RAG answer state has the required fields and that answered states require citations.

**Acceptance Scenarios**:

1. **Given** an answer is in `answered` state, **When** it has citations and confidence, **Then** validation passes.
2. **Given** an answer is in `answered` state without citations, **When** validation runs, **Then** validation returns `ai-core.rag.grounding_invalid`.
3. **Given** an answer is in `no-context`, `degraded`, or `refused` state, **When** validation runs, **Then** validation requires an i18n message key and does not require citations.

---

### User Story 3 - Evaluation can inspect retrieval and grounding outcomes (Priority: P2)

As an operator, I want retrieval and answer contracts to expose measurable outcome data so future evaluation can track quality, leakage, latency, and cost.

**Why this priority**: RAG quality must be measurable before activating broader document or search packages.

**Independent Test**: A unit test creates a retrieval outcome with timings, selected block ids, rejected block ids, and grounding state, then validates the shape through public exports.

**Acceptance Scenarios**:

1. **Given** retrieval returns selected and rejected blocks, **When** an outcome is validated, **Then** the outcome preserves reason codes for audit and evaluation.
2. **Given** unauthorized content is rejected, **When** outcome metadata is inspected, **Then** rejected ids are not present in generation context.

## Edge Cases

- Plans must reject generation-context assembly when access filtering is missing.
- Empty query text is invalid unless a query content reference is supplied.
- `answered` output without citations is invalid even if confidence is high.
- `no-context`, `degraded`, and `refused` states must use i18n message keys.
- Relationship expansion must not bypass access filtering.
- This slice must not activate `search-engine`, `document-engine`, or `import-engine`.
- This slice must not add physical database schema changes.

## Requirements

### Functional Requirements

- **FR-001**: `ai-core` MUST export public retrieval request, retrieval plan, retrieval step, retrieval outcome, and RAG answer state contracts.
- **FR-002**: Retrieval plan validation MUST require at least one retrieval step and an explicit access filtering step before context assembly.
- **FR-003**: Retrieval request validation MUST require either query text or query content reference, locale, allowed content types, user scope, and maximum result count.
- **FR-004**: Retrieval steps MUST support vector, lexical, relationship expansion, rerank, access filter, content type filter, and context assembly step kinds.
- **FR-005**: Grounded answer validation MUST support `answered`, `no-context`, `degraded`, and `refused` states.
- **FR-006**: `answered` states MUST require at least one citation to a content block.
- **FR-007**: Non-answered states MUST require an i18n message key.
- **FR-008**: Retrieval outcomes MUST include selected block ids, rejected block ids with reason codes, and timing metadata for future evaluation.
- **FR-009**: All fallible public validation helpers MUST return `Result<T, AppError>`.
- **FR-010**: The change MUST not activate deferred packages or introduce schema changes.

### Key Entities

- **RetrievalRequest**: Public input contract for RAG retrieval planning.
- **RetrievalPlan**: Ordered plan of retrieval, filtering, reranking, and context assembly steps.
- **RetrievalStep**: Single step in a retrieval plan.
- **RetrievalOutcome**: Measurable result of a retrieval plan.
- **RAGAnswerState**: Structured answer state consumed by bot or module interfaces.

## Success Criteria

- **SC-001**: Focused `ai-core` unit tests pass for valid retrieval request, valid plan, missing access filter rejection, valid answer states, and invalid grounded answer rejection.
- **SC-002**: `pnpm --filter @tempot/ai-core test` passes.
- **SC-003**: `pnpm lint` passes.
- **SC-004**: `pnpm spec:validate` reports zero critical issues.
- **SC-005**: `git diff --check` reports no whitespace errors.

## Assumptions

- Spec #029 content block contracts are the foundation for citations and retrieval outcomes.
- This slice adds public contracts and validation first; wiring into the existing RAG pipeline can be a follow-on implementation step if needed.
- Future `search-engine` activation depends on this contract but is not part of this slice.

## Closeout

- Completed on 2026-04-29.
- Public retrieval planning and RAG answer state contracts were added to `@tempot/ai-core`.
- Runtime pipeline wiring and RAG evaluation fixtures remain follow-on work.

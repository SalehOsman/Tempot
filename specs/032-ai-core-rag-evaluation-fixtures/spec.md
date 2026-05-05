# Feature Specification: AI Core RAG Evaluation Fixtures

**Feature Branch**: `032-ai-core-rag-evaluation-fixtures`
**Created**: 2026-05-05
**Status**: Draft
**Input**: Build RAG evaluation fixtures for `ai-core` after Spec #031. Scope is fixtures,
test helpers, and unit tests that measure retrieval hit, citation coverage, unauthorized
source leakage, and no-context correctness. No new CLI, evaluator service, deferred package
activation, provider calls, or database schema changes.

## User Scenarios & Testing

### User Story 1 - Maintainers have deterministic RAG evaluation cases (Priority: P1)

As an `ai-core` maintainer, I want deterministic RAG evaluation fixtures that model successful
retrieval, citation coverage, unauthorized-source leakage attempts, and no-context answers so
future RAG changes can be tested against known expected outcomes.

**Why this priority**: Spec #031 wired the runtime path, but there is no stable evaluation
dataset to prevent regressions in retrieval quality and access filtering.

**Independent Test**: A unit test imports the fixture catalog and asserts that it contains
cases for authorized hits, citation coverage, unauthorized leakage attempts, and no-context
behavior with explicit expected outcomes.

**Acceptance Scenarios**:

1. **Given** a fixture case with authorized source blocks, **When** the case is evaluated,
   **Then** the expected selected block ids and expected citation block ids are declared.
2. **Given** a fixture case with unauthorized candidate blocks, **When** the case is evaluated,
   **Then** the fixture declares which block ids must be rejected and must never appear in the
   selected or cited sets.
3. **Given** a fixture case with no usable context, **When** the case is evaluated,
   **Then** the fixture declares an expected `no-context` answer state with an i18n message key.

---

### User Story 2 - Maintainers can score retrieval outcomes offline (Priority: P1)

As an `ai-core` maintainer, I want test helpers that score a `RetrievalOutcome` and
`RAGAnswerState` against fixture expectations so quality regressions are caught by unit tests
without a real AI provider, database, or CLI.

**Why this priority**: The fixtures only provide value if they are executable and report the
metric categories needed by the RAG methodology.

**Independent Test**: Unit tests call the helper with passing and failing outcomes and assert
that it reports retrieval hit, citation coverage, leakage, and no-context correctness.

**Acceptance Scenarios**:

1. **Given** an outcome that selects all required block ids, **When** the helper scores it,
   **Then** `retrievalHit` is true.
2. **Given** an answer state that cites every required citation block, **When** the helper
   scores it, **Then** `citationCoverage` is true.
3. **Given** an outcome or answer state that selects or cites an unauthorized block id, **When**
   the helper scores it, **Then** `leakageDetected` is true.
4. **Given** a no-context fixture and a `RAGAnswerState` with state `no-context`, **When** the
   helper scores it, **Then** `noContextCorrect` is true.

---

### User Story 3 - Runtime wiring is protected by fixture-backed unit tests (Priority: P2)

As a package developer changing `RAGPipeline`, I want unit tests that run fixture cases through
the Spec #031 runtime path so regressions in retrieval selection, access filtering, citations,
or no-context state fail quickly.

**Why this priority**: The first two stories establish fixtures and scoring. This story connects
them to the runtime behavior delivered by Spec #031.

**Independent Test**: A unit test creates fake `EmbeddingService` results from each fixture,
runs `RAGPipeline.retrieveWithPlan`, converts the result with `buildAnswerState`, and evaluates
the result with the helper.

**Acceptance Scenarios**:

1. **Given** an authorized-hit fixture, **When** it is run through `retrieveWithPlan`, **Then**
   the evaluation reports retrieval hit with no leakage.
2. **Given** a leakage-attempt fixture, **When** it is run through `retrieveWithPlan`, **Then**
   unauthorized blocks are rejected and the evaluation reports no leakage.
3. **Given** a no-context fixture, **When** it is run through `retrieveWithPlan` and
   `buildAnswerState`, **Then** the evaluation reports correct no-context behavior.

## Edge Cases

- A selected block without a required citation fails citation coverage.
- A cited block that was not selected fails citation coverage.
- An unauthorized block selected by retrieval or cited by the answer state is counted as leakage.
- A no-context fixture that returns state `answered` fails no-context correctness even if no
  leakage is present.
- Empty selected blocks are valid only for no-context fixtures.
- The helper must be deterministic and must not depend on time, random IDs, external providers,
  a real database, or Testcontainers.
- This slice must not add a CLI, evaluator service, background worker, or runtime public API.
- This slice must not activate `search-engine`, `document-engine`, or `import-engine`.

## Requirements

### Functional Requirements

- **FR-001**: The feature MUST add a deterministic RAG evaluation fixture catalog under
  `packages/ai-core/tests/fixtures/`.
- **FR-002**: The fixture catalog MUST include at least one case for each metric category:
  retrieval hit, citation coverage, unauthorized leakage prevention, and no-context correctness.
- **FR-003**: Each fixture case MUST declare a `RetrievalRequest`, fake embedding search
  results, expected selected block ids, expected rejected block ids, expected citation block ids,
  forbidden block ids, and expected answer state.
- **FR-004**: The feature MUST add test helper functions under `packages/ai-core/tests/helpers/`
  that evaluate `RetrievalOutcome` and `RAGAnswerState` against fixture expectations.
- **FR-005**: The helper MUST report these booleans at minimum: `retrievalHit`,
  `citationCoverage`, `leakageDetected`, and `noContextCorrect`.
- **FR-006**: Helper functions that can fail MUST return `Result<T, AppError>` using
  `neverthrow` and must not throw for fixture validation failures.
- **FR-007**: Unit tests MUST exercise both passing and failing metric scenarios.
- **FR-008**: Unit tests MUST run selected fixtures through `RAGPipeline.retrieveWithPlan` and
  `buildAnswerState`.
- **FR-009**: The implementation MUST NOT add a new CLI, evaluator service, package dependency,
  database schema, provider call, or deferred package activation.
- **FR-010**: The implementation MUST NOT modify the legacy `retrieve(RetrieveOptions)` behavior.
- **FR-011**: All new TypeScript test files MUST satisfy the constitution rules: strict types,
  no `any`, no `@ts-ignore`, no `@ts-expect-error`, no `eslint-disable`, and descriptive file
  names.
- **FR-012**: Any message expectation for no-context or degraded states MUST use i18n message
  keys, never human-readable user-facing text.

### Key Entities

- **RAGEvaluationFixture**: A deterministic test case containing request input, fake retrieval
  candidates, and expected evaluation behavior.
- **RAGEvaluationExpectation**: The expected selected, rejected, cited, forbidden, and answer
  state values for a fixture case.
- **RAGEvaluationScore**: The helper output containing metric booleans and diagnostic ids for
  test assertions.
- **RAGEvaluationHelper**: Test-only utility functions that evaluate runtime outcomes against
  fixture expectations.

## Success Criteria

- **SC-001**: `packages/ai-core` contains at least four deterministic RAG evaluation fixture
  cases covering retrieval hit, citation coverage, leakage prevention, and no-context behavior.
- **SC-002**: Unit tests fail when a required hit is missing, a required citation is missing, an
  unauthorized block leaks, or a no-context fixture returns an answered state.
- **SC-003**: `pnpm --filter @tempot/ai-core test` passes after implementation.
- **SC-004**: `pnpm lint` passes after implementation.
- **SC-005**: `pnpm spec:validate` reports zero critical issues after implementation.
- **SC-006**: `git diff --check` reports no whitespace errors.

## Assumptions

- Spec #031 runtime wiring is the stable runtime surface for this slice.
- Fixtures are test-only assets and do not create a public package API.
- Citation coverage is measured from `RAGAnswerState.citations` against fixture expectations,
  not from generated natural-language answer text.
- No-context correctness is measured from structured `RAGAnswerState.state` and `messageKey`.
- Latency, token usage, and cost remain future evaluation dimensions and are not part of this
  MVP because the Project Manager approved fixtures-only scope.

# Tasks: AI Core RAG Evaluation Fixtures

**Input**: Design documents from `specs/032-ai-core-rag-evaluation-fixtures/`
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/

## Phase 1: Setup

**Purpose**: Establish the isolated feature state.

- [x] T001 Create isolated worktree branch `codex/032-rag-evaluation-fixtures`
- [x] T002 Point `.specify/feature.json` at Spec #032
- [x] T003 Confirm Spec #031 runtime exports are available to `packages/ai-core/tests/unit/`

---

## Phase 2: TDD - Write Failing Tests First

**Purpose**: Define the evaluation behavior in executable form before helper implementation.

- [x] T004 [P] [US1] Add failing unit test in `packages/ai-core/tests/unit/rag-evaluation-fixtures.test.ts` asserting fixture catalog coverage for authorized hit, citation coverage, leakage prevention, and no-context cases - covers FR-001, FR-002, FR-003
- [x] T005 [P] [US2] Add failing unit test in `packages/ai-core/tests/unit/rag-evaluation-fixtures.test.ts` asserting retrieval hit scoring passes and fails correctly - covers FR-004, FR-005
- [x] T006 [P] [US2] Add failing unit test in `packages/ai-core/tests/unit/rag-evaluation-fixtures.test.ts` asserting citation coverage scoring passes and fails correctly - covers FR-004, FR-005
- [x] T007 [P] [US2] Add failing unit test in `packages/ai-core/tests/unit/rag-evaluation-fixtures.test.ts` asserting forbidden selected or cited block ids set `leakageDetected` - covers FR-004, FR-005
- [x] T008 [P] [US2] Add failing unit test in `packages/ai-core/tests/unit/rag-evaluation-fixtures.test.ts` asserting no-context correctness uses `RAGAnswerState.state` and expected i18n `messageKey` - covers FR-005, FR-012
- [x] T009 [US3] Add failing unit test in `packages/ai-core/tests/unit/rag-evaluation-fixtures.test.ts` running selected fixtures through `RAGPipeline.retrieveWithPlan` and `buildAnswerState` with fake embedding results - covers FR-007, FR-008, FR-010
- [x] T010 Run `corepack pnpm --filter @tempot/ai-core exec vitest run tests/unit/rag-evaluation-fixtures.test.ts` and verify RED for the new tests

---

## Phase 3: Implementation

**Purpose**: Add fixtures and helpers to make the failing tests pass.

- [x] T011 [P] [US1] Create `packages/ai-core/tests/fixtures/rag-evaluation.fixtures.ts` with typed fixture entities and at least four deterministic fixture cases - covers FR-001, FR-002, FR-003, SC-001
- [x] T012 [US2] Create `packages/ai-core/tests/helpers/rag-evaluation.helper.ts` with `evaluateRAGFixture(input): Result<RAGEvaluationScore, AppError>` - covers FR-004, FR-005, FR-006
- [x] T013 [US2] Implement missing selected id, missing citation id, leaked id, and no-context diagnostics in `packages/ai-core/tests/helpers/rag-evaluation.helper.ts` - covers FR-005
- [x] T014 [US3] Implement fake `EmbeddingService` test wiring inside `packages/ai-core/tests/unit/rag-evaluation-fixtures.test.ts` without production test scaffolding - covers FR-008, FR-009, FR-010
- [x] T015 Run `corepack pnpm --filter @tempot/ai-core exec vitest run tests/unit/rag-evaluation-fixtures.test.ts` and verify GREEN for the targeted tests - covers SC-002

---

## Phase 4: Refactor and Documentation Sync

**Purpose**: Keep docs, roadmap, and implementation aligned.

- [x] T016 Refactor test helper and fixture files for readability while keeping each file under constitution line limits
- [x] T017 Update `packages/ai-core/README.md` only if implementation adds a developer-facing test workflow that package maintainers must know
- [x] T018 Update `docs/archive/ROADMAP.md` to move Spec #032 into completed work and identify the next roadmap item after implementation passes
- [x] T019 Confirm no changeset is required because the planned change is test-only and does not alter runtime package behavior
- [x] T020 Run `$speckit-analyze` or equivalent cross-artifact analysis and resolve any critical findings

---

## Phase 5: Verification

**Purpose**: Prove the feature is ready for merge.

- [x] T021 Run `corepack pnpm --filter @tempot/ai-core test` - covers SC-003
- [x] T022 Run `corepack pnpm lint` - covers SC-004
- [x] T023 Run `corepack pnpm spec:validate` - covers SC-005
- [x] T024 Run `git diff --check` - covers SC-006
- [x] T025 Review git diff for scope: only Spec #032 artifacts, feature pointer, planned `ai-core` test files, and required roadmap/docs updates

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 must complete before tests or implementation.
- Phase 2 must complete before Phase 3; new tests must be observed failing first.
- Phase 3 must complete before refactor and documentation sync.
- Phase 4 must complete before final verification.
- Phase 5 blocks merge or PR completion.

### User Story Dependencies

- **US1**: Can be implemented first and provides the fixture catalog MVP.
- **US2**: Depends on US1 fixture expectation shapes.
- **US3**: Depends on US1 and US2 because it evaluates runtime results through the helper.

### Parallel Opportunities

- T004 through T008 can be drafted in parallel because they assert independent metric behavior in the same test file only if coordinated by one implementer.
- T011 can run in parallel with T012 only after test expectations are stable.
- Verification commands are sequential because failures must stop the gate.

## MVP Definition

The MVP is a test-only RAG evaluation fixture catalog plus helper and unit tests that
deterministically measure retrieval hit, citation coverage, unauthorized leakage, and
no-context correctness against the Spec #031 runtime path. No CLI, service, dependency,
schema change, provider call, or deferred package activation is included.

## Coverage Notes

- FR-001 through FR-003 are covered by T004 and T011.
- FR-004 through FR-006 are covered by T005 through T008, T012, and T013.
- FR-007 through FR-008 are covered by T009 and T014.
- FR-009 through FR-010 are covered by T014 and T025.
- FR-011 through FR-012 are covered by T012, T016, and T022.

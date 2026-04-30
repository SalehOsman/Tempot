# Tasks: AI Core RAG Runtime Wiring

**Input**: Design documents from `specs/031-ai-core-rag-runtime-wiring/`
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/

## Phase 1: Setup

**Purpose**: Establish the spec pointer and create the worktree.

- [ ] T001 Create isolated worktree branch `codex/031-ai-core-rag-runtime-wiring`
- [ ] T002 Point `.specify/feature.json` at Spec #031
- [ ] T003 Confirm Spec #029 and Spec #030 exports are accessible from public barrel

---

## Phase 2: TDD — Write Failing Tests First

**Purpose**: Define acceptance in executable form before writing implementation (RED).

- [ ] T004 [P] Add failing unit test: valid `RetrievalRequest` produces a `RetrievalOutcome`
      with selected block ids and stage timings — covers FR-001, FR-002, FR-005
- [ ] T005 [P] Add failing unit test: request with no authorized content types returns
      `ok(outcome)` with empty `selectedBlockIds` — covers FR-001, FR-004
- [ ] T006 [P] Add failing unit test: access-filter step records rejected block ids with
      reason `access-denied` — covers FR-004
- [ ] T007 [P] Add failing unit test: embedding service failure returns
      `err(AppError)` with `ai-core.rag.search_failed` — covers FR-012
- [ ] T008 [P] Add failing unit test: `buildAnswerState` with selected blocks returns
      `answered` with citations — covers FR-006, FR-007
- [ ] T009 [P] Add failing unit test: `buildAnswerState` with no selected blocks returns
      `no-context` with non-blank `messageKey` — covers FR-008
- [ ] T010 [P] Add failing unit test: `buildAnswerState` with `degraded: true` returns
      `degraded` with non-blank `messageKey` — covers FR-009
- [ ] T011 [P] Add failing unit test: legacy `retrieve(RetrieveOptions)` still returns
      `ok(RAGContext)` without modification — covers FR-010
- [ ] T012 [P] Add failing unit test: `retrieveWithPlan` logs `rag_search` audit entry
      when audit service dep is provided — covers FR-011
- [ ] T013 [P] Add failing unit test: audit service failure does not propagate to caller
      — covers FR-011
- [ ] T014 Run `pnpm --filter @tempot/ai-core test` and verify RED for all new tests

---

## Phase 3: Implementation

**Purpose**: Make all failing tests pass (GREEN).

- [ ] T015 Create `packages/ai-core/src/rag/retrieval-plan.builder.ts`
      — `buildDefaultRetrievalPlan(request: RetrievalRequest): Result<RetrievalPlan, AppError>`
      — includes vector, access-filter, and context-assembly steps
      — validates built plan with `validateRetrievalPlan` before returning
- [ ] T016 Create `packages/ai-core/src/rag/retrieval-plan.executor.ts`
      — `execute(plan, request, embeddingService): AsyncResult<RetrievalOutcome, AppError>`
      — iterates steps, records per-step timings
      — enforces access-filter step before context-assembly
      — maps rejected blocks with reason codes
- [ ] T017 Extend `packages/ai-core/src/rag/rag-pipeline.service.ts`
      — add optional `AuditService` to `RAGPipelineDeps`
      — add `retrieveWithPlan(request: RetrievalRequest): AsyncResult<RetrievalOutcome, AppError>`
      — add `buildAnswerState(outcome: RetrievalOutcome): Result<RAGAnswerState, AppError>`
      — leave existing `retrieve(options: RetrieveOptions)` method unchanged
- [ ] T018 Add `ai-core.rag.no_context` and `ai-core.rag.degraded` i18n message key
      constants in `retrieval-plan.executor.ts` (as typed string literals, not free text)
- [ ] T019 Run `pnpm --filter @tempot/ai-core test` and verify GREEN for all tests

---

## Phase 4: Export and Documentation Sync

**Purpose**: Make new internals available through the public barrel and update docs.

- [ ] T020 Export `RetrievalPlanBuilder` and `RetrievalPlanExecutor` types from
      `packages/ai-core/src/index.ts` if needed by external callers
- [ ] T021 Update `packages/ai-core/README.md` with `retrieveWithPlan` and
      `buildAnswerState` usage examples
- [ ] T022 Update `docs/archive/ROADMAP.md`
      — move Spec #031 to "Recently completed" after merge
      — update "Active or next work" to reflect evaluation fixtures as next step
- [ ] T023 Add changeset for `@tempot/ai-core` (minor bump)
- [ ] T024 Update `CHANGELOG.md` `[Unreleased]` section with Spec #031 entry
- [ ] T025 Update `.specify/feature.json` to close Spec #031 state

---

## Phase 5: Verification

**Purpose**: Confirm all quality gates pass before merge.

- [ ] T026 Run `pnpm --filter @tempot/ai-core test` — verify SC-001, SC-002
- [ ] T027 Run `pnpm lint` — verify SC-003
- [ ] T028 Run `pnpm spec:validate` — verify SC-004
- [ ] T029 Run `git diff --check` — verify SC-005
- [ ] T030 Run `pnpm build` — verify `TelegramAssistantUI` and `IntentRouter`
      compile without modification — SC-006

---

## MVP Definition

The MVP is a `RAGPipeline` that accepts a `RetrievalRequest`, returns a `RetrievalOutcome`
with access-filtered selected block ids and stage timings, and converts the outcome into a
structured `RAGAnswerState`. The old `retrieve` method works without modification.
No deferred packages are activated and no database schema is changed.

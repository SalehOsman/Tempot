# Tasks: AI Core Retrieval Planning And Grounding

**Input**: Design documents from `specs/030-ai-core-retrieval-planning-and-grounding/`
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [x] T001 Create isolated worktree branch `codex/030-ai-core-retrieval-planning-and-grounding`
- [x] T002 Close Spec #029 documentation state
- [x] T003 Point `.specify/feature.json` at Spec #030
- [x] T004 Create SpecKit artifacts for the retrieval planning and grounding slice

## Phase 2: TDD Contracts

- [x] T005 Add failing unit tests for valid retrieval request validation covering FR-003
- [x] T006 Add failing unit tests for valid retrieval plan validation covering FR-001, FR-002, and FR-004
- [x] T007 Add failing unit tests for missing access filter rejection covering FR-002
- [x] T008 Add failing unit tests for retrieval outcome validation covering FR-008
- [x] T009 Add failing unit tests for RAG answer state validation covering FR-005, FR-006, and FR-007
- [x] T010 Run targeted ai-core tests and verify RED

## Phase 3: Implementation

- [x] T011 Add retrieval planning type contracts under `packages/ai-core/src/rag/` for FR-001 and FR-004
- [x] T012 Add retrieval request, plan, and outcome validation helpers for FR-002, FR-003, FR-008, and FR-009
- [x] T013 Add RAG answer state contracts and validation helpers for FR-005, FR-006, FR-007, and FR-009
- [x] T014 Add new ai-core error codes for FR-002, FR-003, FR-008, and FR-005
- [x] T015 Export contracts and validators from the public ai-core barrel
- [x] T016 Run targeted ai-core tests and verify GREEN for SC-001

## Phase 4: Documentation Sync

- [x] T017 Update `packages/ai-core/README.md` with retrieval planning exports and examples
- [x] T018 Update `docs/archive/ROADMAP.md` to identify Spec #030 implementation status
- [x] T019 Add changeset for `@tempot/ai-core`
- [x] T020 Confirm deferred packages remain deferred for FR-010

## Phase 5: Verification

- [x] T021 Run `pnpm --filter @tempot/ai-core test` for SC-001 and SC-002
- [x] T022 Run `pnpm lint` for SC-003
- [x] T023 Run `pnpm spec:validate` for SC-004
- [x] T024 Run `git diff --check` for SC-005

## MVP First

The MVP is a public validated retrieval planning and grounded answer state contract in `ai-core`; no database schema, parser package, or search package is activated.

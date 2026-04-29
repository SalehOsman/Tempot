# Tasks: AI Core Content Block Contracts

**Input**: Design documents from `specs/029-ai-core-content-block-contracts/`
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [x] T001 Create isolated worktree branch `codex/029-ai-core-content-block-contracts`
- [x] T002 Point `.specify/feature.json` at Spec #029
- [x] T003 Create SpecKit artifacts for the next RAG implementation slice

## Phase 2: TDD Contracts

- [x] T004 Add failing unit tests for public content source and block validation covering FR-001, FR-002, FR-003, FR-004, and FR-005
- [x] T005 Add failing unit tests for raw PII embeddable rejection covering FR-006
- [x] T006 Add failing unit tests for grounded answer citation enforcement covering FR-007
- [x] T007 Run targeted ai-core tests and verify RED

## Phase 3: Implementation

- [x] T008 Add content block type contracts under `packages/ai-core/src/rag/` for FR-001
- [x] T009 Add validation helpers returning `Result<T, AppError>` for FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, and FR-008
- [x] T010 Export contracts and validators from the public ai-core barrel for FR-002
- [x] T011 Add new ai-core error codes for FR-006 and FR-007
- [x] T012 Run targeted ai-core tests and verify GREEN for SC-001

## Phase 4: Documentation Sync

- [x] T013 Update `docs/archive/ROADMAP.md` to identify Spec #029 as active RAG slice
- [x] T014 Add changeset for `@tempot/ai-core`
- [x] T015 Confirm deferred packages remain deferred for FR-009

## Phase 5: Verification

- [x] T016 Run `pnpm --filter @tempot/ai-core test` for SC-001 and SC-002
- [x] T017 Run `pnpm lint` for SC-003
- [x] T018 Run `pnpm spec:validate` for SC-004
- [x] T019 Run `git diff --check` for SC-005

## MVP First

The MVP is a public validated content block contract in `ai-core`; no database schema, parser package, or search package is activated.

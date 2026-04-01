---
description: 'Task list template for feature implementation'
---

# Tasks: Session Manager (Dual-layer)

**Input**: Design documents from `/specs/004-session-manager-package/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: TDD is mandatory as per project constitution (Rule XXXIV). Tests must be written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `packages/session-manager/`
- All paths below are relative to `packages/session-manager/` unless otherwise specified.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize package structure in `packages/session-manager/` (package.json, tsconfig.json, vite/vitest configs)
- [ ] T002 [P] Define `Session` interface and types in `packages/session-manager/src/session.types.ts` based on data-model.md
- [ ] T003 [P] Define `ISessionProvider` interface in `packages/session-manager/src/session.types.ts` based on contracts
- [ ] T004 Create `packages/session-manager/src/index.ts` to export public interfaces and types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Update `packages/database/prisma/schema.prisma` to include the `Session` model (with `JSONB` metadata and version field) — FR-001
- [ ] T006 Generate Prisma client and run migrations in `packages/database`
- [ ] T007 Create `SessionRepository` extending `BaseRepository` in `packages/session-manager/src/session.repository.ts`
- [ ] T008 Define synchronization events (e.g., `session.updated`) in `packages/event-bus/src/event-bus.events.ts` — FR-003
- [ ] T009 Create the BullMQ worker for async Postgres syncing in `packages/session-manager/src/session.worker.ts` — FR-003

**Checkpoint**: Foundation ready - database schema, types, and async worker structure are in place.

---

## Phase 3: User Story 1 - Fast & Persistent Sessions (Priority: P1) 🎯 MVP

**Goal**: As a user, I want my session to be fast and persistent so that my conversation flow is never lost even if the server restarts.

**Independent Test**: Verified by checking session data in Redis for fast access and Postgres for long-term persistence within an integration test.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [US1] Unit test for `SessionProvider.getSession` and `saveSession` in `packages/session-manager/tests/unit/session.provider.test.ts` — FR-001, FR-006
- [ ] T010b [US1] Unit test verifying hierarchical (nested) JSON metadata in Session type is stored and retrieved correctly through Redis and Postgres sync cycle, covering FR-004, in `packages/session-manager/tests/unit/session.provider.test.ts`
- [ ] T011 [US1] Integration test verifying Redis fast access and Postgres persistence in `packages/session-manager/tests/integration/session.integration.test.ts` — SC-002
- [ ] T011a [US1] Integration test asserting Redis fast access takes < 2ms (SC-001) in `packages/session-manager/tests/integration/session.integration.test.ts`
- [ ] T011b [US1] Unit test verifying sliding TTL logic correctly resets TTL on interaction in `packages/session-manager/tests/unit/session.provider.test.ts` — FR-007

### Implementation for User Story 1

- [ ] T012 [US1] Implement `SessionProvider` in `packages/session-manager/src/session.provider.ts` using `neverthrow` — FR-006
- [ ] T013 [US1] Implement Redis fetching/saving with sliding TTL in `SessionProvider` using `cache-manager` — FR-001, FR-007
- [ ] T014 [US1] Implement in-memory fallback logic (Rule XXXII) in `SessionProvider.getSession` for Redis failure/miss — SC-003
- [ ] T015 [US1] Implement Optimistic Concurrency Control (version checking) in `SessionProvider.saveSession`
- [ ] T016 [US1] Implement event dispatching to `event-bus` on `saveSession` for async Postgres sync — FR-003, SC-002

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Conversation State Management (Priority: P1)

**Goal**: As a developer, I want to store the state of the current conversation (e.g., active step, collected data) so that I can handle complex multi-step forms easily without manual session management.

**Independent Test**: Storing complex conversation state and retrieving it in the next update within a mock `AsyncLocalStorage` context.

### Tests for User Story 2 ⚠️

- [ ] T017 [US2] Unit test for `AsyncLocalStorage` context creation and retrieval in `packages/session-manager/tests/unit/session.context.test.ts` — FR-002
- [ ] T018 [US2] Unit test for Session Schema Versioning and migration logic in `packages/session-manager/tests/unit/session.migrator.test.ts` — FR-005, SC-004

### Implementation for User Story 2

- [ ] T019 [P] [US2] Implement `AsyncLocalStorage` context for global session access in `packages/session-manager/src/session.context.ts` — FR-002
- [ ] T020 [US2] Implement `migrateSession` logic in `SessionProvider` or dedicated service for Schema Versioning — FR-005
- [ ] T021 [US2] Export context and updated provider from `packages/session-manager/src/index.ts`
- [ ] T022 [US2] Update BullMQ worker to handle complex metadata sync correctly without data loss

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T023 [P] Ensure all Redis operations adhere to Rule XXXII (Redis Degradation Strategy)
- [ ] T024 [P] Ensure all internal errors are mapped correctly using Result pattern
- [ ] T025 [P] Create `README.md` for the package
- [ ] T026 Add standard JSDoc/TSDoc to public interfaces
- [ ] T027 [P] Verify package passes package-creation-checklist.md (10-point check)
- [ ] T028 [P] Add ShutdownManager registration for BullMQ Worker (Rule XVII)
- [ ] T029 [P] Create ADR for dual-layer session strategy (Redis + Postgres) at `docs/architecture/adr/`
  > **Rule LXIII Compliance Note**: This ADR should ideally be created before implementation begins, not in the Polish phase. For retroactive compliance, the ADR documents the decisions that were already made during implementation.
- [ ] T030 [P] Create ADR for Optimistic Concurrency Control (OCC) approach at `docs/architecture/adr/`
  > **Rule LXIII Compliance Note**: This ADR should ideally be created before implementation begins, not in the Polish phase. For retroactive compliance, the ADR documents the decisions that were already made during implementation.
- [ ] T031 Implement and test `deleteSession()` in SessionProvider — removes from both Redis and Postgres, returns `AsyncResult<void, AppError>`
- [ ] T032 Unit test for `deleteSession()` verifying removal from both layers in `packages/session-manager/tests/unit/session.provider.test.ts`

---

### Task: Pluggable Architecture Toggle (Rule XVI)

**Phase**: 1 (Setup)
**Estimated Duration**: 15 minutes

Constitution Rule XVI requires `TEMPOT_SESSION_MANAGER=true/false` environment variable.

#### Acceptance Criteria

- [ ] Define `TEMPOT_SESSION_MANAGER` environment variable
- [ ] SessionProvider returns a no-op session context when disabled
- [ ] SessionWorker does not start cleanup when disabled
- [ ] Document the disable behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (US1 → US2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Expands on the provider built in US1, so practically depends on US1.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD is non-negotiable)
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All tests for a user story marked [P] can run in parallel
- Documentation tasks in the Polish phase can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently
3. Add User Story 2 → Test independently
4. Polish and document.

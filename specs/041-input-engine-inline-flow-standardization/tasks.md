# Tasks: Input Engine Inline Flow Standardization

**Feature:** 041-input-engine-inline-flow-standardization  
**Source:** spec.md + plan.md + research.md + data-model.md  
**Generated:** 2026-05-12

---

## Phase 1: Setup

**Purpose**: Establish validated artifacts, active feature detection, and the feature-level delivery frame.

- [x] T001 Confirm `specs/041-input-engine-inline-flow-standardization/` artifacts, `.specify/feature.json`, and the capability reuse table are present and aligned. FR-009 SC-005

---

## Phase 2: Foundational

**Purpose**: Add the RED tests and shared runtime prerequisites that block all user-story implementation.

- [x] T002 [P] Add failing bot-server unit tests for conversation/runtime composition in `apps/bot-server/tests/unit/`. FR-001 FR-002 SC-001
- [x] T003 [P] Add failing bot-server integration coverage for enter, continue, cancel, and complete behavior in `apps/bot-server/tests/integration/`. FR-001 FR-002 SC-001

**Checkpoint**: Runtime adoption work may begin only after T002-T003 define the failing expectations.

---

## Phase 3: User Story 1 - Host Input Engine Flows in the Active Bot Runtime (Priority: P1)

**Goal**: Bot-server can host conversation-backed `@tempot/input-engine` flows without disturbing the existing runtime envelope.  
**Independent Test**: The focused bot-server tests prove one flow can enter, continue, cancel, and complete through the active runtime integration.

- [x] T004 [US1] Implement runtime composition in `apps/bot-server/src/bot/bot.factory.ts` and supporting startup dependency files as required. FR-001 FR-002 SC-001
- [x] T005 [US1] Refactor only the affected bot-server dependency assembly needed to preserve current startup boundaries and file/function limits. FR-002
- [x] T006 [US1] Run the focused tests from `apps/bot-server/tests/unit/` and `apps/bot-server/tests/integration/` to GREEN before moving forward. FR-001 FR-002 SC-001

**Checkpoint**: The shared runtime path exists and is test-proven.

---

## Phase 4: User Story 2 - Register Managed Bots Through the Standard Inline Flow (Priority: P1)

**Goal**: `/new_bot` and the inline create action start one shared registration form backed by `@tempot/input-engine`.  
**Independent Test**: Both entry points complete the same registration journey and use the existing bot-management service path for persistence.

- [x] T007 [P] [US2] Add failing unit tests proving `/new_bot` and the inline create action start the same registration flow in `modules/bot-management/tests/unit/`. FR-003 SC-002
- [x] T008 [P] [US2] Add failing unit tests for successful completion, validation rejection, duplicate rejection, and cancellation behavior in `modules/bot-management/tests/unit/`. FR-004 FR-005 FR-006 SC-002
- [x] T009 [US2] Add the bot registration form definition and start helper in `modules/bot-management/` using `@tempot/input-engine`. FR-003 FR-004
- [x] T010 [US2] Wire `/new_bot` and the inline create action to the same start helper via `modules/bot-management/commands/new-bot.command.ts` and `modules/bot-management/handlers/callback.handler.ts`. FR-003 SC-002
- [x] T011 [US2] Route completed form submissions into the existing bot-management service path while preserving duplicate detection and redaction behavior. FR-005 FR-006
- [x] T012 [US2] Update `modules/bot-management/module.config.ts`, `modules/bot-management/package.json`, and locale files only where required by the approved capability declaration and user-facing messages. FR-004 FR-009
- [x] T013 [US2] Run focused bot-management tests from `modules/bot-management/tests/unit/` to GREEN before removal work begins. FR-003 FR-004 FR-005 FR-006 SC-002

**Checkpoint**: Bot registration is package-backed and entry-point consistent.

---

## Phase 5: User Story 3 - Remove the Disapproved Manual Registration State Path (Priority: P1)

**Goal**: Remove the obsolete local manual state mechanism once the shared form path is operational.  
**Independent Test**: The production registration path no longer depends on manual map-backed state code, and registration behavior remains covered by the new tests.

- [x] T014 [P] [US3] Add failing regression assertions in `modules/bot-management/tests/unit/` that the production registration path no longer depends on manual state-map orchestration. FR-007 SC-003
- [x] T015 [US3] Replace or simplify affected text-handler responsibilities in `modules/bot-management/handlers/text.handler.ts` so free-text processing is owned by the form runtime. FR-004 FR-007
- [x] T016 [US3] Remove obsolete manual registration state code, including `modules/bot-management/handlers/bot-state.service.ts` if it no longer owns approved behavior. FR-007 SC-003
- [x] T017 [US3] Re-run the bot-management regression suite and confirm the removed path is no longer required for production registration. FR-007 SC-003

**Checkpoint**: The duplicate local registration mechanism is gone.

---

## Phase 6: User Story 4 - Give Developers Accurate Adoption Guidance (Priority: P1)

**Goal**: Documentation accurately explains the package and the approved adoption model.  
**Independent Test**: The README and feature artifacts describe the actual package behavior, runtime prerequisites, and adoption pattern without contradiction.

- [x] T018 [US4] Update `packages/input-engine/README.md` to reflect implemented capabilities, runtime prerequisites, package adoption guidance, and the reusable standard intended for later modules without migrating unrelated modules now. FR-008 FR-010 SC-004
- [x] T019 [US4] Review `docs/ROADMAP.md`; no pre-merge status update is required because Rule LXXXIX updates roadmap progress after merge. FR-008
- [x] T020 [US4] Reconcile `specs/041-input-engine-inline-flow-standardization/spec.md`, `plan.md`, `research.md`, `data-model.md`, and `tasks.md` with approved implementation refinements while preserving the scoped future-adoption boundary. FR-009 FR-010 SC-005

**Checkpoint**: Future developers receive a coherent package-backed flow standard.

---

## Phase 7: Polish and Cross-Cutting Concerns

**Purpose**: Prove methodology compliance and merge readiness.

- [x] T021 Run SpecKit consistency analysis for `specs/041-input-engine-inline-flow-standardization/` and resolve critical findings. FR-009 SC-005
- [x] T022 Run `pnpm spec:validate` and resolve all critical reconciliation issues. FR-009 SC-005
- [x] T023 Run focused tests for touched workspaces plus any broader gates required by the final diff. FR-001 FR-002 FR-003 FR-004 FR-005 FR-006 FR-007 FR-008
- [x] T024 Run `git diff --check`, review the final diff for scope control, and prepare the merge-ready summary. SC-005

---

## Dependencies and Execution Order

- Phase 1 establishes the feature frame.
- Phase 2 defines RED expectations and blocks production implementation.
- User Story 1 must complete before User Story 2 because the module flow depends on the runtime host.
- User Story 2 must complete before User Story 3 because duplicate state cannot be removed until the new path is working.
- User Story 4 follows stable behavior so the docs describe the final implementation.
- Phase 7 runs after all selected scope is complete.

## Parallel Opportunities

- T002 and T003 can proceed in parallel after T001.
- T007 and T008 can proceed in parallel after User Story 1 completes.
- T018 and T019 can run in parallel once implementation behavior is stable.

## Implementation Strategy

1. Prove the runtime host with RED tests.
2. Implement the runtime and move those tests to GREEN.
3. Specify bot-management behavior with RED tests.
4. Implement the package-backed registration flow.
5. Remove the manual duplicate state path.
6. Reconcile docs and run the full selected gate set.

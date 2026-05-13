# Tasks: Bot Management Lifecycle Operations Hardening

**Feature:** 042-bot-management-lifecycle-operations-hardening  
**Source:** spec.md + plan.md + research.md + data-model.md  
**Generated:** 2026-05-13

---

## Phase 1: Setup

- [x] T001 Create and align Spec #042 artifacts, active feature pointer, and the capability reuse table. FR-011 SC-005

## Phase 2: Lifecycle Menu Projection

- [x] T002 [P] Add failing unit tests for lifecycle inline menu projection by current bot status. FR-001 FR-002 SC-001
- [x] T003 Implement `menus/lifecycle-menu.factory.ts` and any narrow helper needed to project valid lifecycle actions plus back navigation. FR-001 FR-002 SC-001
- [x] T004 Run focused lifecycle menu tests to GREEN. FR-001 FR-002 SC-001

## Phase 3: Callback Routing and Direct Transitions

- [x] T005 [P] Add failing callback-handler tests for opening lifecycle views, direct valid transitions, invalid transitions, and missing-bot handling. FR-001 FR-003 FR-006 FR-007 SC-002
- [x] T006 Add lifecycle service access wiring required by callback execution while preserving current setup patterns. FR-003 FR-010
- [x] T007 Extend callback routing for lifecycle view and direct transition actions that do not require a reason. FR-001 FR-003 FR-006 FR-007 SC-002
- [x] T008 Run focused callback lifecycle tests to GREEN. FR-001 FR-003 FR-006 FR-007 SC-002

## Phase 4: Reason-Required Guided Flows

- [x] T009 [P] Add failing tests proving pause, maintenance, and archive actions enter one package-backed reason flow. FR-004 FR-008 FR-009 SC-003
- [x] T010 Add failing tests for archive inline confirmation and cancellation-before-flow behavior. FR-005 SC-004
- [x] T011 Implement `flows/lifecycle-reason.flow.ts` with `@tempot/input-engine` and service delegation after successful reason collection. FR-004 FR-008 FR-010 SC-003
- [x] T012 Register the lifecycle reason conversation in module setup and route reason-required callbacks into it. FR-004 FR-009
- [x] T013 Implement archive confirmation callback surfaces before starting reason collection. FR-005 SC-004
- [x] T014 Run focused lifecycle reason and archive confirmation tests to GREEN. FR-004 FR-005 FR-008 FR-009 SC-003 SC-004

## Phase 5: Documentation Sync

- [x] T015 Update `modules/bot-management/README.md` so current behavior reflects lifecycle operating surfaces instead of stale registration-only wording. FR-012
- [x] T016 Reconcile Spec #042 artifacts with any implementation refinements while preserving scope boundaries. FR-011 FR-012 SC-005

## Phase 6: Verification and Merge Readiness

- [x] T017 Run focused `@tempot/bot-management` tests for the new lifecycle surfaces. FR-001 FR-002 FR-003 FR-004 FR-005 FR-006 FR-007 FR-008
- [x] T018 Run wider gates required by the diff: module tests, lint, build, `pnpm spec:validate`, `pnpm cms:check`, `pnpm boundary:audit`, `pnpm module:checklist`, and `git diff --check`. SC-005

---

## Dependencies and Execution Order

- Menu projection precedes callback routing because transition actions need a
  stable menu contract.
- Direct transitions precede reason-required flows so the callback surface is
  already established.
- Documentation sync follows stable implementation behavior.

## Parallel Opportunities

- T002 and T005 can be prepared in parallel after T001.
- T009 and T010 can be prepared together after lifecycle callback conventions are fixed.

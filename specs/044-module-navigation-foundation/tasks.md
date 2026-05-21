# Tasks: Module Navigation Foundation

**Input**: Design documents from `specs/044-module-navigation-foundation/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD is mandatory for Tempot production behavior changes. Test tasks must be completed and observed failing before implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Requirement Traceability

- **FR-001**: Covered by T014, T016, T017, T018, T023.
- **FR-002**: Covered by T005, T007, T014, T017, T023.
- **FR-003**: Covered by T014, T016, T017, T022, T023.
- **FR-004**: Covered by T006, T009, T027, T028, T031.
- **FR-005**: Covered by T024, T025, T029, T030, T031.
- **FR-006**: Covered by T005, T008, T019, T020, T021, T034.
- **FR-007**: Covered by T015, T022, T025, T028, T030.
- **FR-008**: Covered by T019, T020, T021, T023.
- **FR-009**: Covered by T035, T046.
- **FR-010**: Covered by T038, T040, T041, T042, T043.
- **FR-011**: Covered by T032, T033, T034, T037.
- **FR-012**: Covered by T006, T009, T011, T013, T031.
- **FR-013**: Covered by T001, T003, T005, T008, T047.
- **SC-001**: Covered by T014, T016, T017, T023.
- **SC-002**: Covered by T016, T023, T037, T043.
- **SC-003**: Covered by T032, T033, T034, T037.
- **SC-004**: Covered by T006, T009, T027, T031.
- **SC-005**: Covered by T038, T040, T041, T043.
- **SC-006**: Covered by T001, T003, T008, T047.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish architecture documentation and baseline ownership scope.

- [ ] T001 Create ADR for module-owned navigation contributions in `docs/architecture/adr/ADR-XXX-module-owned-navigation-contributions.md`
- [ ] T002 Add ADR index entry in `docs/architecture/adr/README.md`
- [ ] T003 Update module development catalog navigation ownership guidance in `docs/developer/module-development-catalog.md`
- [ ] T004 Review current `/start` button ownership and document existing dead actions in `specs/044-module-navigation-foundation/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contracts and validation that block all user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 [P] Write failing contract tests for navigation contribution validation in `packages/module-registry/tests/unit/module-registry.types.test.ts`
- [ ] T006 [P] Write failing duplicate callback ownership tests in `packages/module-registry/tests/unit/module-validator.service.test.ts`
- [ ] T007 [P] Write failing bot-server composition tests for contribution loading in `apps/bot-server/tests/unit/navigation/navigation-composer.test.ts`
- [ ] T008 Define navigation contribution types in `packages/module-registry/src/module-registry.types.ts`
- [ ] T009 Implement navigation validation behavior in `packages/module-registry/src/module-validator.service.ts`
- [ ] T010 Export navigation contracts from `packages/module-registry/src/index.ts`
- [ ] T011 Integrate navigation validation into bot-server module startup in `apps/bot-server/src/startup/deps.bot-factory.ts`
- [ ] T012 Add localized unavailable navigation messages in `apps/bot-server/locales/ar.json` and `apps/bot-server/locales/en.json`
- [ ] T013 Run package-level checks for foundational work with `pnpm --filter @tempot/module-registry test` and `pnpm --filter bot-server test`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Only Available Actions Appear (Priority: P1) MVP

**Goal**: Fresh `/start` menus contain only actions backed by active owners.

**Independent Test**: Disable or omit a capability owner and confirm its menu action is absent while enabled actions still appear and respond.

### Tests for User Story 1

- [ ] T014 [P] [US1] Write failing tests for hiding unavailable main menu actions in `modules/user-management/tests/unit/main-menu.factory.test.ts`
- [ ] T015 [P] [US1] Write failing callback regression test for stale unavailable actions in `apps/bot-server/tests/unit/middleware/callback-fallback.middleware.test.ts`
- [ ] T016 [P] [US1] Write failing integration test for `/start` menu without dead buttons in `apps/bot-server/tests/integration/navigation-menu.integration.test.ts`

### Implementation for User Story 1

- [ ] T017 [US1] Replace hardcoded unavailable main menu actions with composed contributions in `modules/user-management/menus/main-menu.factory.ts`
- [ ] T018 [US1] Add navigation composition helper in `apps/bot-server/src/bot/navigation/navigation-composer.ts`
- [ ] T019 [US1] Register working existing contributions for profile and users in `modules/user-management/module.manifest.ts`
- [ ] T020 [US1] Register existing template-management contribution in `modules/template-management/module.manifest.ts`
- [ ] T021 [US1] Register existing bot-management contribution in `modules/bot-management/module.manifest.ts`
- [ ] T022 [US1] Ensure stale callbacks answer with localized unavailable response in `apps/bot-server/src/bot/middleware/callback-fallback.middleware.ts`
- [ ] T023 [US1] Run US1 checks with `pnpm --filter @tempot/user-management test` and `pnpm --filter bot-server test`

**Checkpoint**: `/start` has no visible dead buttons and remains independently testable.

---

## Phase 4: User Story 2 - Modules Own Their Menu Entries (Priority: P1)

**Goal**: Modules declare their own navigation contributions and callback ownership without direct imports between feature modules.

**Independent Test**: Add one fixture module contribution and verify it appears, routes, and disappears when disabled.

### Tests for User Story 2

- [ ] T024 [P] [US2] Write failing module fixture tests for contribution declaration in `apps/bot-server/tests/integration/__fixtures__/modules/navigation-module/module.manifest.ts`
- [ ] T025 [P] [US2] Write failing pass-through callback tests in `apps/bot-server/tests/integration/navigation-callback-routing.integration.test.ts`
- [ ] T026 [P] [US2] Write failing manifest validation tests in `packages/module-registry/tests/unit/module-config.schema.test.ts`

### Implementation for User Story 2

- [ ] T027 [US2] Extend module manifest validation for navigation declarations in `packages/module-registry/src/module-config.schema.ts`
- [ ] T028 [US2] Add callback ownership registry behavior in `packages/module-registry/src/module-registry.service.ts`
- [ ] T029 [US2] Wire callback ownership metadata through module discovery in `apps/bot-server/src/startup/module-loader.ts`
- [ ] T030 [US2] Ensure module callback handlers pass through unrelated callbacks in `modules/user-management/handlers/callback.handler.ts`, `modules/template-management/handlers/callback.handler.ts`, and `modules/bot-management/handlers/callback.handler.ts`
- [ ] T031 [US2] Run US2 checks with `pnpm --filter @tempot/module-registry test` and `pnpm --filter bot-server test`

**Checkpoint**: Modules own menu entries through validated metadata, not direct cross-module imports.

---

## Phase 5: User Story 3 - Administrators See Operational Capabilities (Priority: P2)

**Goal**: Admins see operational actions only when the owning module exists and is enabled.

**Independent Test**: Compare standard user and admin menus with operational owners enabled and disabled.

### Tests for User Story 3

- [ ] T032 [P] [US3] Write failing role visibility tests in `apps/bot-server/tests/unit/navigation/navigation-visibility.test.ts`
- [ ] T033 [P] [US3] Write failing admin menu integration tests in `apps/bot-server/tests/integration/admin-navigation-menu.integration.test.ts`

### Implementation for User Story 3

- [ ] T034 [US3] Implement role-aware visibility filtering in `apps/bot-server/src/bot/navigation/navigation-visibility.ts`
- [ ] T035 [US3] Add placeholder ownership declarations for future settings, notifications, messages, stats, and help as disabled planned capabilities in `docs/developer/module-development-catalog.md`
- [ ] T036 [US3] Ensure disabled planned capabilities are omitted from runtime menus in `apps/bot-server/src/bot/navigation/navigation-composer.ts`
- [ ] T037 [US3] Run US3 checks with `pnpm --filter bot-server test`

**Checkpoint**: Admin menus are capability-aware and do not expose unimplemented actions.

---

## Phase 6: User Story 4 - Help Reflects Active Capabilities (Priority: P3)

**Goal**: Help reflects active accessible capabilities without documenting unavailable features.

**Independent Test**: Enable and disable module contributions and confirm help changes accordingly for each role.

### Tests for User Story 4

- [ ] T038 [P] [US4] Write failing tests for capability-aware help content in `apps/bot-server/tests/unit/navigation/navigation-help.test.ts`
- [ ] T039 [P] [US4] Write failing help callback routing test in `apps/bot-server/tests/integration/help-navigation.integration.test.ts`

### Implementation for User Story 4

- [ ] T040 [US4] Implement capability-aware help view in `apps/bot-server/src/bot/navigation/navigation-help.view.ts`
- [ ] T041 [US4] Add localized help labels and descriptions in active module locale files under `modules/*/locales/`
- [ ] T042 [US4] Route `help:view` through an owned help contribution in `apps/bot-server/src/bot/navigation/navigation-help.handler.ts`
- [ ] T043 [US4] Run US4 checks with `pnpm --filter bot-server test` and `pnpm cms:check`

**Checkpoint**: Help shows only active accessible capabilities.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification, documentation sync, and release hygiene.

- [ ] T044 [P] Update `docs/ROADMAP.md` with Spec #044 status and next module sequence
- [ ] T045 [P] Update architecture documentation in `docs/architecture/tempot_architecture.md`
- [ ] T046 Create follow-up SpecKit prompts for `settings-management`, `notification-center`, `content-management`, `audit-viewer`, and `help-center` in `specs/044-module-navigation-foundation/quickstart.md`
- [ ] T047 Add changeset for affected packages in `.changeset/`
- [ ] T048 Run `pnpm spec:validate`
- [ ] T049 Run `pnpm cms:check`
- [ ] T050 Run `pnpm lint`
- [ ] T051 Run `pnpm build`
- [ ] T052 Run `pnpm test:unit`
- [ ] T053 Run `pnpm test:integration`
- [ ] T054 Run `pnpm module:checklist`
- [ ] T055 Run `pnpm boundary:audit`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational and can run after or alongside US1 with coordination.
- **User Story 3 (Phase 5)**: Depends on US1 and US2 metadata contracts.
- **User Story 4 (Phase 6)**: Depends on US1/US2 contribution metadata.
- **Polish (Phase 7)**: Depends on selected user stories being complete.

### Parallel Opportunities

- T005, T006, and T007 can run in parallel.
- T014, T015, and T016 can run in parallel.
- T024, T025, and T026 can run in parallel.
- T032 and T033 can run in parallel.
- T038 and T039 can run in parallel.
- Documentation tasks T044 and T045 can run in parallel after implementation stabilizes.

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Complete US1 to remove dead `/start` buttons while preserving working actions.
3. Stop and validate with targeted tests before adding broader module ownership.

### Incremental Delivery

1. Deliver US1 so users stop seeing dead buttons.
2. Deliver US2 so modules own future menu entries correctly.
3. Deliver US3 for admin operational visibility.
4. Deliver US4 for capability-aware help.
5. Generate separate specs for the professional modules that will own settings, notifications, messages/content, stats/audit, and help.

## Notes

- No implementation task may start before tests for that task have been written and observed failing.
- Do not implement the downstream modules inside this spec.
- Do not add placeholder handlers in `user-management` for planned modules.
- Keep every visible action owned by an enabled, validated capability.

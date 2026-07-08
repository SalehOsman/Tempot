# Tasks: Bot Access Mode and Membership Gate

**Input**: Design documents from `/specs/058-bot-access-mode-membership-gate/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

## Execution Rules

- Follow TDD: write failing tests before implementation for every behavior change.
- Keep diffs scoped to this feature.
- Do not develop directly on `main`.
- Use existing module conventions and package boundaries.
- Do not hardcode user-facing strings in TypeScript.
- Do not use `any`, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable`.

## Phase 1: Setup

- [x] T001 Create implementation branch `codex/058-bot-access-mode-membership-gate` from current integration base
- [x] T002 Confirm current middleware order in `apps/bot-server/src/bot/middleware/` and document insertion point in implementation notes
- [x] T003 Confirm settings ownership for bot access mode in `packages/settings/src/` and `modules/settings-management/`
- [x] T004 Confirm event-bus contract conventions in `packages/event-bus/src/` and existing module event examples

## Phase 2: Foundational Tests

- [x] T005 [P] Add access-mode settings tests in the existing `packages/settings/tests/unit/static-settings.loader.test.ts` and `packages/settings/tests/unit/settings.types.test.ts`
- [x] T006 [P] Add access decision table tests in `apps/bot-server/tests/unit/access/access-decision.service.test.ts`
- [x] T007 [P] Add actor resolution tests in `apps/bot-server/tests/unit/access/access-actor.resolver.test.ts`
- [x] T008 [P] Add command/callback gate tests in `apps/bot-server/tests/unit/middleware/access-gate.middleware.test.ts`
- [x] T009 [P] Add menu visibility tests for actor states in `apps/bot-server/tests/unit/navigation/access-filtered-navigation.test.ts` (implemented as `module-navigation.provider.test.ts`)
- [x] T010 [P] Add membership request repository tests in `modules/membership-management/tests/integration/membership-request.repository.test.ts`
- [x] T011 [P] Add membership request state-machine tests in `modules/membership-management/tests/unit/membership-request.service.test.ts`
- [x] T012 [P] Add user-management approval integration test in `modules/user-management/tests/integration/membership-approval-profile.test.ts`

## Phase 3: Access Mode Settings

- [x] T013 Implement typed `BotAccessMode` and validation in `packages/settings/src/settings.types.ts`
- [x] T014 Implement static/dynamic loading for access mode in `packages/settings/src/static-settings.loader.ts`
- [x] T015 Ensure missing access mode resolves to private and invalid mode never resolves to public
- [x] T016 Add settings export in `packages/settings/src/index.ts`
- [x] T017 Update settings documentation in `packages/settings/README.md`

## Phase 4: Central Access Gate

- [x] T018 Define access actor and access decision types in `apps/bot-server/src/access/access.types.ts`
- [x] T019 Implement actor resolver in `apps/bot-server/src/access/access-actor.resolver.ts`
- [x] T020 Implement access decision service in `apps/bot-server/src/access/access-decision.service.ts`
- [x] T021 Implement access gate middleware in `apps/bot-server/src/bot/middleware/access-gate.middleware.ts`
- [x] T022 Register access gate before protected command/callback dispatch in bot startup wiring
- [x] T023 Add denied-interaction i18n response mapping without leaking internal capability names
- [x] T024 Add audit logging for denied protected/admin interactions where required

## Phase 5: Capability Classification and Menu Filtering

- [x] T025 Extend navigation capability metadata to include access classification in the existing navigation provider contract
- [x] T026 Classify existing `user-management` capabilities in `modules/user-management/`
- [x] T027 Classify existing `settings-management` capabilities in `modules/settings-management/`
- [x] T028 Classify existing help, notification, content, template, bot-management, and audit-viewer capabilities according to public/member/admin behavior (template and bot-management currently expose no main-menu item)
- [x] T029 Treat unclassified capabilities as protected during rollout
- [x] T030 Update `apps/bot-server/src/startup/module-navigation.provider.ts` to filter by access decision
- [x] T031 Ensure command and callback execution reuses the same access decision contract as menu rendering

## Phase 6: Membership Management Module

- [x] T032 Scaffold `modules/membership-management/package.json`, `tsconfig.json`, `vitest.config.ts`, `module.manifest.ts`, `module.config.ts`, and `index.ts`
- [x] T033 Add Prisma schema and migration for membership requests in `modules/membership-management/database/`
- [x] T034 Implement membership request repository in `modules/membership-management/repositories/membership-request.repository.ts`
- [x] T035 Implement membership request service in `modules/membership-management/services/membership-request.service.ts`
- [x] T036 Implement visitor command and callback handlers in `modules/membership-management/commands/` and `modules/membership-management/handlers/` (implemented through `/join` command and `membership:request` callback; `/start` prompt remains in user-management)
- [x] T037 Implement administrator review handlers in `modules/membership-management/handlers/admin-membership.handler.ts` (implemented in the module callback handler)
- [x] T038 Implement membership menus in `modules/membership-management/menus/`
- [x] T039 Add English locale entries in `modules/membership-management/locales/en.json`
- [x] T040 Add Arabic locale entries in `modules/membership-management/locales/ar.json`
- [x] T041 Add module abilities in `modules/membership-management/abilities.ts`
- [x] T042 Add module README in `modules/membership-management/README.md`

## Phase 7: Cross-Module Approval Boundary

- [x] T043 Define membership events in `modules/membership-management/events/event-names.ts` and `event-payloads.ts`
- [x] T044 Emit request submitted, approved, rejected, cancelled, and expired events from membership service
- [x] T045 Add user-management event handler or approved boundary for approved membership profile creation
- [x] T046 Ensure profile creation assigns default member role and preserves protected-data rules
- [x] T047 Ensure approval is idempotent when two admins review the same request concurrently
- [x] T048 Add audit records for membership state transitions and profile activation outcome

## Phase 8: Admin Settings for Public/Private Mode

- [x] T049 Add tests for super-admin access-mode settings flow in `modules/settings-management/tests/`
- [x] T050 Add access-mode view/update controls under existing settings or bot-management administration menu
- [x] T051 Restrict access-mode changes to `SUPER_ADMIN` by default unless abilities grant otherwise
- [x] T052 Audit every access-mode change with actor, previous mode, next mode, and timestamp
- [x] T053 Verify regular `USER` and unauthorized `ADMIN` actors cannot view or change access mode

## Phase 9: End-to-End Scenarios

- [x] T054 Add private unknown visitor `/start` scenario test
- [x] T055 Add pending visitor protected-command denial scenario test
- [x] T056 Add stale callback denial scenario test
- [x] T057 Add approve request then member `/start` scenario test
- [x] T058 Add role-filtered menu snapshot tests for `UNKNOWN`, `PENDING`, `USER`, `ADMIN`, and `SUPER_ADMIN`
- [x] T059 Add public mode unknown visitor scenario test
- [x] T060 Add regression test proving existing super-admin bootstrap still works

## Phase 10: Documentation and Quality Gates

- [x] T061 Update root `README.md` with local access-mode behavior after implementation
- [x] T062 Update `docs/ROADMAP.md` with actual feature status after implementation
- [x] T063 Update `docs/architecture/tempot_architecture.md` with access gate and membership-management boundaries
- [x] T064 Add changeset for user-visible access behavior and new module
- [x] T065 Run `pnpm lint`
- [x] T066 Run `pnpm build`
- [x] T067 Run `pnpm test:unit`
- [x] T068 Run `pnpm test:integration`
- [x] T069 Run `pnpm spec:validate`
- [x] T070 Perform code review and resolve all critical findings before merge

## Requirement Traceability

- FR-001: T005, T013, T049, T050
- FR-002: T005, T014, T015
- FR-003: T005, T015
- FR-004: T007, T018, T019, T021, T022
- FR-005: T006, T025, T026, T027, T028, T029
- FR-006: T006, T021, T023, T054
- FR-007: T008, T021, T022, T055
- FR-008: T006, T025, T029, T059
- FR-009: T008, T021, T056
- FR-010: T009, T025, T030, T031, T058
- FR-011: T009, T041, T050, T053, T058
- FR-012: T041, T049, T050, T051, T058
- FR-013: T011, T035, T036, T039, T040, T054
- FR-014: T010, T034, T035
- FR-015: T011, T023, T036, T055
- FR-016: T037, T038, T041, T049
- FR-017: T012, T043, T045, T046, T057
- FR-018: T043, T045, T070
- FR-019: T004, T043, T044, T045
- FR-020: T024, T048, T052
- FR-021: T024, T048, T052
- FR-022: T023, T039, T040
- FR-023: T039, T040
- FR-024: T002, T021, T035, T036
- FR-025: T022, T060, T066
- FR-026: T006, T007, T009, T058
- FR-027: T008, T031, T056
- FR-028: T010, T033, T034
- FR-029: T061, T062, T063, T064
- FR-030: T012, T046, T060

## Success Criteria Traceability

- SC-001: T008, T021, T022, T055
- SC-002: T023, T036, T054
- SC-003: T011, T023, T036, T055
- SC-004: T012, T045, T046, T057
- SC-005: T009, T030, T058
- SC-006: T006, T009, T031, T058
- SC-007: T006, T025, T029, T059
- SC-008: T005, T014, T015
- SC-009: T024, T044, T048, T052
- SC-010: T065, T066, T067, T068, T069, T070

## Dependency Order

1. Setup and foundational tests: T001-T012
2. Settings and access gate: T013-T024
3. Capability classification and menu filtering: T025-T031
4. Membership module: T032-T042
5. Approval boundary: T043-T048
6. Admin settings: T049-T053
7. End-to-end scenarios: T054-T060
8. Documentation and gates: T061-T070

## Parallel Work Guidance

- T005-T012 can be created in parallel because they target independent test files.
- T025-T028 can be split by module after the classification contract is defined.
- T039 and T040 can be done in parallel after locale keys are finalized.
- T054-T060 can be implemented in parallel after the access gate and membership module are functional.

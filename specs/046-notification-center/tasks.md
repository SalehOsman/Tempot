# Tasks: notification-center

## Phase 1 - Specification Alignment

- [x] T001 [FR-001..FR-015] Expand the notification-center spec from a simple
  callback page into a functional operational module.
- [x] T002 [FR-012] Define the required governed notification flow surfaces.
- [x] T003 [SC-007] Document that settings-management must route to notification
  preferences instead of rendering a duplicate notification settings menu.

## Phase 2 - Flow Governance

- [x] T004 [FR-012] Add `modules/notification-center/module.flow.json`.
- [x] T005 [SC-015] Update `modules/settings-management/module.flow.json` so
  settings links only to `notifications:preferences`.
- [x] T006 [FR-013] Add module doctor tests for notification-center flow
  coverage and settings-to-notifications ownership.

## Phase 3 - Runtime Behavior

- [x] T007 [SC-005] Add a failing runtime test proving repeated
  `notifications:test` does not use the unchanged callback path.
- [x] T008 [FR-006, FR-008, FR-009] Implement visible test delivery and a unique
  test result surface.
- [x] T009 [FR-005, FR-016, FR-017, SC-008, SC-009] Implement a real
  settings-backed preference surface with a persisted enablement toggle.
- [x] T010 [FR-010, SC-010, SC-011, SC-012] Implement recent activity display
  from `interactionEvents` or `auditLog`.
- [x] T011 [SC-007] Simplify settings-management notification navigation to the
  shared notification preferences destination.

## Phase 4 - Localization and Documentation

- [x] T012 [FR-003] Add Arabic and English i18n keys for all new surfaces,
  buttons, empty states, timestamps, and delivery references.
- [x] T013 [FR-012] Update module flow governance docs to include
  notification-center as a governed module.
- [x] T014 [SC-001..SC-015] Add or update Telegram quickstart acceptance flows.

## Phase 5 - Verification

- [x] T015 Run `pnpm --filter @tempot/notification-center test`.
- [x] T016 Run `pnpm --filter @tempot/notification-center build`.
- [x] T017 Run `pnpm --filter @tempot/settings-management test`.
- [x] T018 Run `pnpm tempot module doctor notification-center`.
- [x] T019 Run `pnpm tempot module doctor settings-management`.
- [x] T020 Run `pnpm cms:check`.
- [x] T021 Run `pnpm spec:validate`.
- [x] T022 Run `pnpm lint` and `pnpm build:bot-runtime` before merge.

## Coverage Map

- FR-001: Covered by T008 and T015.
- FR-002: Covered by T004, T006, T008, and T018.
- FR-003: Covered by T012 and T020.
- FR-004: Covered by T004, T008, and T014.
- FR-005: Covered by T004, T009, and T014.
- FR-006: Covered by T004, T007, T008, and T014.
- FR-007: Covered by T007 and T008.
- FR-008: Covered by T007, T008, and T014.
- FR-009: Covered by T007, T008, and T014.
- FR-010: Covered by T010 and T014.
- FR-011: Covered by T005, T011, and T017.
- FR-012: Covered by T004, T006, T018, and T019.
- FR-013: Covered by T006, T007, T008, T009, and T010.
- FR-014: Covered by T008, T009, and T010.
- FR-015: Covered by T008.
- FR-016: Covered by T009 and T017.
- FR-017: Covered by T004, T006, T009, and T018.
- SC-001: Covered by T008 and T014.
- SC-002: Covered by T008 and T014.
- SC-003: Covered by T011 and T014.
- SC-004: Covered by T007, T008, and T014.
- SC-005: Covered by T007, T008, and T014.
- SC-006: Covered by T007, T008, and T014.
- SC-007: Covered by T005, T011, and T014.
- SC-008: Covered by T009 and T014.
- SC-009: Covered by T009 and T014.
- SC-010: Covered by T010 and T014.
- SC-011: Covered by T010 and T014.
- SC-012: Covered by T010 and T014.
- SC-013: Covered by T004, T006, and T018.
- SC-014: Covered by T018.
- SC-015: Covered by T005, T006, T018, and T019.

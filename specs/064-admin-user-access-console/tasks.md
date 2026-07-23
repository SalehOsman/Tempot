# Tasks: Admin User Access Console

**Created**: 2026-07-20  
**Feature**: `064-admin-user-access-console`

## Phase 0: Preparation

- [ ] T001 Confirm active workspace branch strategy and isolate implementation work before production code edits.
- [ ] T002 Run focused baseline tests for `user-management`, `auth-core`, and bot access middleware.
- [ ] T003 Review current user, notification, audit, interaction, and authorization contracts before coding.

## Phase 1: Immediate Display And Menu Fixes

- [ ] T004 Add failing tests proving regional keys are localized in user profile displays.
- [ ] T005 Implement regional display normalization for user profile and admin user detail screens.
- [ ] T006 Add failing tests proving non-constitutional role choices are not rendered.
- [ ] T007 Remove invalid role choices from role change menus.
- [ ] T008 Verify no raw i18n or regional keys appear in affected bot messages.
- [x] T008a Add start-menu UX regression tests and render readable single-button rows.
- [x] T008b Add methodology lint coverage for Telegram menu button rows and label length.

## Phase 2: User Detail Console

- [ ] T009 Add failing tests for `users:view:{id}` rendering a complete user detail screen.
- [ ] T010 Implement user lookup by internal user id through user service and repository boundaries.
- [ ] T011 Implement user detail menu with edit, role, activity, notifications, test notification, and back actions.
- [ ] T012 Add pagination or bounded user list behavior tests.
- [ ] T013 Implement bounded user list with selectable user rows.

## Phase 3: Administrative User Editing

- [ ] T014 Add failing tests for super admin editing user identity fields.
- [ ] T015 Implement identity edit handlers and validation.
- [ ] T016 Add failing tests for contact field editing.
- [ ] T017 Implement contact edit handlers and validation.
- [ ] T018 Add failing tests for regional field editing and derived national ID data.
- [ ] T019 Implement regional edit handlers and derived data updates.
- [ ] T020 Add audit tests for every administrative profile update.
- [ ] T021 Implement audit records for administrative profile updates.

## Phase 4: Safe Role Management

- [x] T022 Add failing tests for role change confirmation and allowed role choices.
- [x] T023 Implement role change confirmation flow.
- [x] T024 Add failing tests for last active super admin protection.
- [x] T025 Implement last active super admin protection in the role/status service boundary.
- [x] T026 Add authorization tests for role management permission.
- [x] T027 Implement role-management authorization checks.
- [x] T027a Add guest re-application and blocked-session regression tests.
- [x] T027b Implement super-admin user block action and blocked-session sync.
- [x] T027c Add unblock action and human blocked-account messaging.

## Phase 5: Access Management Module

- [ ] T028 Create `access-management` module spec-aligned scaffold through the project module workflow.
- [ ] T029 Add permission catalog and i18n labels.
- [ ] T030 Add failing repository tests for permission grants and revocations.
- [ ] T031 Implement permission grant repository.
- [ ] T032 Add failing service tests for grant, revoke, duplicate grant, and denied grant scenarios.
- [ ] T033 Implement permission grant service.
- [ ] T034 Add admin permission menu and callback tests.
- [ ] T035 Implement permission grant and revoke bot flows.

## Phase 6: Dynamic Authorization Integration

- [ ] T036 Add failing tests proving active grants are included in final admin abilities.
- [ ] T037 Extend authorization composition to include active permission grants.
- [ ] T038 Add failing tests proving revoked permissions disappear from menus.
- [ ] T039 Update navigation visibility to use final dynamic abilities.
- [ ] T040 Add stale callback denial regression tests after permission revocation.

## Phase 7: Activity And Notifications

- [ ] T041 Add failing tests for user activity summary rendering.
- [ ] T042 Implement activity summary source adapter and display flow.
- [ ] T043 Add failing tests for user notification summary rendering.
- [ ] T044 Implement notification summary source adapter and display flow.
- [ ] T045 Add failing tests for test notification sending.
- [ ] T046 Implement test notification action with success and failure feedback.

## Phase 8: Documentation And Validation

- [ ] T047 Update affected module README files.
- [ ] T048 Update architecture documentation if a new authorization composition boundary is added.
- [ ] T049 Run SpecKit analysis and resolve critical findings.
- [ ] T050 Run `pnpm spec:validate` and resolve critical findings.
- [ ] T051 Run focused tests, `pnpm build:bot-runtime`, and lint.
- [ ] T052 Rebuild Docker and verify `/live` before user bot testing.

## Requirement Coverage

- FR-001: T009, T011, T013
- FR-002: T012, T013
- FR-003: T010, T013
- FR-004: T009, T010, T011
- FR-005: T004, T005
- FR-006: T004, T008
- FR-007: T014, T015, T016, T017, T018, T019
- FR-008: T015, T017, T019
- FR-009: T020, T021
- FR-010: T022, T023
- FR-011: T006, T007
- FR-012: T024, T025, T027a, T027b, T027c
- FR-013: T026, T027
- FR-014: T028, T029, T034, T035
- FR-015: T030, T031, T032, T033, T035
- FR-016: T030, T031, T032, T033
- FR-017: T036, T037
- FR-018: T038, T039
- FR-019: T040
- FR-020: T041, T042
- FR-021: T043, T044
- FR-022: T045, T046
- FR-023: T004, T008, T015, T017, T019, T023, T035, T046
- FR-024: T003, T028
- FR-025: T003, T028, T031

## Success Criteria Coverage

- SC-001: T009, T011, T013
- SC-002: T004, T005, T008
- SC-003: T006, T007, T022
- SC-004: T020, T021, T030, T031, T032, T033
- SC-005: T038, T039, T040
- SC-006: T024, T025, T027a, T027b, T027c
- SC-007: T014, T015, T016, T017, T018, T019
- SC-008: T045, T046

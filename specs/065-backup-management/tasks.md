# Tasks: Backup Management

## Requirement Traceability

| Requirement | Covered By |
| --- | --- |
| FR-001 | T021-T025 |
| FR-002 | T022-T023 |
| FR-003 | T006-T009, T012-T015, T032 |
| FR-004 | T006-T009 |
| FR-005 | T008-T009 |
| FR-006 | T008-T009 |
| FR-007 | T020, T032 |
| FR-008 | T008-T009, T020, T029, T035 |
| FR-009 | T012-T013, T030, T035 |
| FR-010 | T030 |
| FR-011 | T029 |
| FR-012 | T024-T025 |
| FR-013 | T024-T025 |
| FR-014 | T016-T019 |
| FR-015 | T016-T017 |
| FR-016 | T026-T027 |
| FR-017 | T026-T027 |
| FR-018 | T014-T015 |
| FR-019 | T010-T011 |
| FR-020 | T010-T011 |
| FR-021 | T035 |
| FR-022 | T029 |
| FR-023 | T028-T032 |
| FR-024 | T021, T027 |
| FR-025 | T028 |
| FR-026 | T031 |
| FR-027 | T032 |
| FR-028 | T029 |
| FR-029 | T012-T013 |
| FR-030 | T006-T007 |
| FR-031 | T033-T035 |
| FR-032 | T041-T043 |
| FR-033 | T042 |
| FR-034 | T043 |
| FR-035 | T044-T046 |
| FR-036 | T045-T046 |
| SC-001 | T024-T025 |
| SC-002 | T008-T009 |
| SC-003 | T012-T013, T030, T035 |
| SC-004 | T016-T019 |
| SC-005 | T020, T027, T029, T035 |
| SC-006 | T022-T023 |
| SC-007 | T024-T025, T029 |
| SC-008 | T035, T037 |

## Phase A: Specification And Design Gates

- [x] T001 Review Spec #065 against existing backup, restore, protected-data,
      cutover, and disaster-recovery documents.
- [ ] T002 Run SpecKit analysis and resolve all critical issues.
- [x] T003 Run `pnpm spec:validate` and document any expected active-feature
      gaps before code starts.
- [x] T004 Approve ADR-046 before package or module implementation.

## Phase B: Package Foundation - `@tempot/backup-engine`

- [x] T005 Complete the 10-point package creation checklist before first package
      code.
- [x] T006 Add failing unit tests for backup request validation and status
      transitions.
- [x] T007 Implement package types, errors, and service contracts returning
      `Result<T, AppError>`.
- [x] T008 Add failing unit tests for manifest generation and integrity failure
      classification.
- [x] T009 Implement manifest and integrity services.
- [x] T010 Add failing unit tests for retention preview and latest-complete
      protection.
- [x] T011 Implement retention service.
- [ ] T012 Add integration tests for database backup metadata repository
      behavior.
- [x] T013 Implement repository-backed metadata persistence.
- [x] T014 Add queue-factory tests for long-running backup orchestration.
- [x] T015 Implement queued backup orchestration through the shared queue
      factory.

## Phase C: Restore Rehearsal

- [x] T016 Add failing tests that block live-environment restore targets.
- [x] T017 Implement isolated restore target validation.
- [x] T018 Add unit tests for restore rehearsal status and evidence
      results.
- [x] T019 Implement restore rehearsal service.
- [ ] T020 Add protected-data readability checks without exposing key material.

## Phase D: Module Foundation - `backup-management`

- [x] T021 Create module scaffold with README, config, abilities, locales,
      tests, and `module.flow.json`.
- [x] T022 Add failing authorization tests for non-super-admin denial.
- [x] T023 Implement super-admin-only abilities and handler guards.
- [x] T024 Add callback/menu tests for empty backup history and return action.
- [x] T025 Implement backup management menu surfaces using UX helpers.
- [ ] T026 Add confirmation expiry tests for restore, deletion, and retention.
- [x] T027 Implement confirmation flows with localized text.

## Phase E: Package Composition

- [x] T028 Wire backup-management to backup-engine through injected ports.
- [ ] T029 Wire notification outcomes through notifier or event-backed notifier
      adapter.
- [x] T030 Wire lifecycle events through event-bus.
- [ ] T031 Wire schedule reads through `@tempot/settings` `backup_schedule`.
- [x] T032 Wire artifact persistence through storage-engine boundaries.

## Phase F: Evidence, Documentation, And Verification

- [ ] T033 Update docs that currently reference `pnpm backup:restore`,
      `pnpm backup:verify`, or backup evidence if command names change.
- [ ] T034 Update `docs/ROADMAP.md` with implementation status.
- [ ] T035 Add operational evidence template for backup-management acceptance.
- [x] T036 Run module/package unit tests.
- [ ] T037 Run integration tests covering backup metadata and restore rehearsal.
- [x] T038 Run `pnpm telegram-keyboard-ux:check` for module menus.
- [ ] T039 Run `pnpm lint`, `pnpm build`, `pnpm test:unit`,
      `pnpm spec:validate`, and `pnpm docs:check`.
- [ ] T040 Request code review and resolve all critical findings before merge.
- [x] T041 Add failing tests that block live restore without a passed rehearsal.
- [x] T042 Implement controlled live restore with a pre-restore backup.
- [x] T043 Add Telegram two-step confirmation UX for live restore.
- [x] T044 Add failing tests for destructive database factory reset.
- [x] T045 Implement schema reset and migration replay after a pre-reset backup.
- [x] T046 Add Telegram two-step confirmation UX for factory reset.

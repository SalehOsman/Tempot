# Tasks: Integration Gate Repair

**Input**: SpecKit artifacts in `specs/034-integration-gate-repair/`

## Phase 1: Setup

- [x] T001 Confirm `codex/034-integration-gate-repair` worktree is isolated from `main`.
- [x] T002 Install dependencies from lockfile if local binaries are missing.
- [x] T003 Run `corepack pnpm test:integration` and capture the current RED failure covering FR-001, FR-002, FR-003, SC-001, SC-002.

## Phase 2: Test Infrastructure Design

- [x] T004 Inspect current duplicated integration setup in `packages/database/tests/integration/audit-log-schema.test.ts`, `packages/database/tests/integration/soft-delete.test.ts`, `packages/database/tests/integration/transaction-repository.test.ts`, `packages/database/tests/integration/vector-search.test.ts`, `packages/logger/tests/integration/audit-logger.test.ts`, and `packages/settings/tests/integration/settings.integration.test.ts` covering FR-005.
- [x] T005 Define the shared bootstrap API in `packages/database/src/testing/database.helper.ts` covering FR-002, FR-003, FR-004.
- [x] T006 Confirm no new dependency or ADR is required covering FR-006, FR-009.

## Phase 3: RED

- [x] T007 Add or adjust the smallest failing integration coverage that proves TestDB schema bootstrap is required before Prisma operations covering FR-002, SC-002.
- [x] T008 Add or adjust the smallest failing integration coverage that proves vector schema bootstrap is required before vector repository operations covering FR-003, SC-002.
- [x] T009 Re-run the targeted integration tests and confirm RED fails for missing bootstrap behavior rather than dependency installation covering SC-001.

## Phase 4: GREEN

- [x] T010 Implement shared Prisma schema bootstrap in `packages/database/src/testing/database.helper.ts` covering FR-001, FR-002, FR-004.
- [x] T011 Implement shared vector schema bootstrap or vector setup helper in `packages/database/src/testing/database.helper.ts` covering FR-001, FR-003, FR-004.
- [x] T012 Replace duplicated `pnpm prisma db push --accept-data-loss` setup in affected integration tests with the shared helper covering FR-001, FR-005.
- [x] T013 Replace duplicated `pnpm exec drizzle-kit push --force` setup in vector integration tests with the shared helper covering FR-001, FR-003, FR-005.
- [x] T014 Run targeted integration tests for database, logger, settings, and vector scenarios covering SC-002.

## Phase 5: Refactor

- [x] T015 Remove obsolete command imports and setup comments from affected tests covering FR-005, FR-007.
- [x] T016 Verify no `any`, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable` was introduced covering FR-008.
- [x] T017 Keep production behavior unchanged and document any unavoidable test-infrastructure source edits covering FR-006.

## Phase 6: Verification

- [x] T018 Run `corepack pnpm test:integration` covering SC-001, SC-002, SC-003.
- [x] T019 Run `corepack pnpm test:unit` covering SC-004.
- [x] T020 Run `corepack pnpm lint` covering SC-004.
- [x] T021 Run `corepack pnpm --recursive build` covering SC-004.
- [x] T022 Run `corepack pnpm spec:validate` covering FR-010, SC-004.
- [x] T023 Run `corepack pnpm cms:check` covering SC-004.
- [x] T024 Run `corepack pnpm audit --audit-level=high` covering SC-004.
- [x] T025 Run `git diff --check` covering SC-004.

## Phase 7: Documentation and Finish

- [x] T026 Update `specs/034-integration-gate-repair/tasks.md` with executed evidence only covering FR-010.
- [x] T027 Update `docs/archive/ROADMAP.md` only if project status changes.
- [x] T028 Add a changeset only if package runtime or published test infrastructure behavior changes.
- [x] T029 Produce final verification report with exact command results.
- [x] T030 Request code review and resolve all CRITICAL findings before finish.

## Dependencies

- T001-T003 must complete before implementation.
- T007-T009 must complete before T010-T014.
- T018 must pass or be explicitly blocked before broader finish decisions.

## Coverage Notes

- FR-001 is covered by T003, T009, T010, T011, T012, T013, and T018.
- FR-002 is covered by T003, T005, T007, T010, T014, and T018.
- FR-003 is covered by T003, T005, T008, T011, T013, T014, and T018.
- FR-004 is covered by T005, T010, T011, and T018.
- FR-005 is covered by T004, T012, T013, and T015.
- FR-006 is covered by T006 and T017.
- FR-007 is covered by T015.
- FR-008 is covered by T016 and T020.
- FR-009 is covered by T006 and T022.
- FR-010 is covered by T022 and T026.
- SC-001 is covered by T003, T009, and T018.
- SC-002 is covered by T003, T007, T008, T014, and T018.
- SC-003 is covered by T018.
- SC-004 is covered by T019 through T025.
- SC-005 is covered by T017, T025, and T029.

## Execution Evidence

- T003/T009 RED: `corepack pnpm test:integration` failed before repair with six integration suites blocked by shell calls to `pnpm prisma db push --accept-data-loss` and `pnpm exec drizzle-kit push --force` where `pnpm` was not globally available.
- T010-T015 GREEN: `TestDB` now owns Prisma and vector schema bootstrap; affected database, logger, settings, and vector integration tests call the shared helper instead of shelling out to `pnpm`.
- T018: `corepack pnpm test:integration` passed on 2026-05-05 with 9 files passed and 25 tests passed.
- T019: `corepack pnpm test:unit` passed on 2026-05-05 with 195 files passed, 1 skipped, 1701 tests passed, and 10 todo tests.
- T020: `corepack pnpm lint` passed on 2026-05-05.
- T021: `corepack pnpm build` passed on 2026-05-05 after root package scripts were made Corepack-safe.
- T022: `corepack pnpm spec:validate` passed on 2026-05-05 with 168/168 checks passed.
- T023: `corepack pnpm cms:check` passed on 2026-05-05 with `{"passed":true,"violations":[]}`.
- T024: `corepack pnpm audit --audit-level=high` passed on 2026-05-05 with no known vulnerabilities found.
- T025: `git diff --check` passed on 2026-05-05.
- T027: Roadmap update was not required because no project phase, activation decision, or deferred-package state changed.
- T028: Changeset was not required because all packages are private and the runtime package versions are unchanged.
- T030: Review Gate completed locally with zero critical findings before branch finish.

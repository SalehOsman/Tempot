# Tasks: Data Integrity Hardening

**Input**: Design documents from `specs/055-data-integrity-hardening/`
**Tests**: Mandatory. Each invariant uses RED -> GREEN -> REFACTOR and a separate scoped commit.

## Phase 1: Setup and Blast Radius

- [x] T001 Create execution worktree `codex/055-data-integrity-hardening`
- [x] T002 Map shared database consumers and record blast radius in `specs/055-data-integrity-hardening/research.md`
- [x] T003 [P] Record direct Prisma calls and permitted infrastructure exceptions in `docs/architecture/boundaries/`
- [x] T004 [P] Record affected pagination methods and current query behavior in `quickstart.md`

## Phase 2: User Story 1 - Atomic Identity Updates (P1)

- [x] T005 [P] [US1] Write failing failure-injection integration tests in `modules/user-management/tests/integration/user.repository.test.ts`
- [x] T006 [P] [US1] Write failing service contract tests in `modules/user-management/tests/unit/user.service.test.ts`
- [x] T007 [US1] Add one atomic identity-update repository operation in `modules/user-management/repositories/user.repository.ts`
- [x] T008 [US1] Replace service-level concurrent writes in `modules/user-management/services/user.service.ts`
- [ ] T009 [US1] Reconcile one logical audit operation with the protected audit policy from Spec 054
- [x] T010 [US1] Confirm GREEN, refactor, and commit only the atomic-update concern

**Independent Test**: Every injected failure leaves all identity fields unchanged.

## Phase 3: User Story 2 - Non-Overridable Soft Delete (P1)

- [x] T011 [P] [US2] Write failing adversarial soft-delete tests for the Prisma extension and shared BaseRepository
- [x] T012 [P] [US2] Write failing affected module repository tests for conflicting and nested filters
- [ ] T013 [P] [US2] Write failing authorized/denied recovery repository tests
- [x] T014 [US2] Correct and centralize normal-read deletion enforcement in `packages/database/src/`
- [x] T015 [US2] Remove deletion control from normal public filter types
- [ ] T016 [US2] Add the explicit privileged recovery repository contract
- [x] T017 [US2] Remove duplicated module deletion-policy implementations where the shared contract applies
- [ ] T018 [US2] Confirm GREEN, refactor, run blast-radius tests, and commit only the soft-delete concern

**Independent Test**: Normal reads cannot return deleted rows; explicit authorized recovery can.

## Phase 4: User Story 3 - Repository-Only Application Access (P1)

- [ ] T019 [P] [US3] Add failing boundary fixtures for direct Prisma calls in governed application layers
- [ ] T020 [P] [US3] Write repository contract tests for audit-history, interaction-event, and bootstrap-session operations
- [ ] T021 [US3] Add purpose-specific repository interfaces and implementations in `packages/database/src/`
- [ ] T022 [US3] Replace direct reads in `apps/bot-server/src/startup/deps.orchestrator.ts`
- [ ] T023 [US3] Replace direct session persistence in `apps/bot-server/src/startup/bootstrap.ts`
- [ ] T024 [US3] Remove `as never` data-contract bridges with typed adapters
- [ ] T025 [US3] Extend `scripts/ci/import-boundary-audit.cli.ts` with governed Prisma access rules
- [ ] T026 [US3] Confirm GREEN and commit only the repository-boundary concern

**Independent Test**: Boundary audit reports zero prohibited Prisma use and runtime behavior passes repository tests.

## Phase 5: User Story 4 - Aggregate Pagination (P2)

- [ ] T027 [P] [US4] Write failing query-behavior tests for user-management pagination
- [ ] T028 [P] [US4] Write failing query-behavior tests for template-management pagination variants
- [ ] T029 [US4] Add typed count support to the owning repository abstraction
- [ ] T030 [US4] Replace full-list count reads in `modules/user-management/repositories/user.repository.ts`
- [ ] T031 [US4] Replace full-list count reads in `modules/template-management/repositories/template.repository.ts`
- [ ] T032 [US4] Verify filter parity, empty, boundary-page, and large-dataset behavior
- [ ] T033 [US4] Confirm GREEN, measure query behavior, and commit only the pagination concern

**Independent Test**: Each page request uses aggregate count and never loads all matching entities for totals.

## Phase 6: Documentation, Review, and Gates

- [x] T034 Update repository, database, module, boundary, and architecture documentation
- [x] T035 Update all SpecKit artifacts and `docs/ROADMAP.md`
- [x] T036 Run focused package/module tests after each slice
- [x] T037 Run `pnpm boundary:audit`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, and `pnpm test:integration`
- [ ] T038 Request code review after each scoped concern and resolve all Critical/High findings
- [x] T039 Run `speckit-analyze` and resolve Critical inconsistencies
- [x] T040 Run `pnpm spec:validate`
- [ ] T041 Create required changesets
- [ ] T042 Run final verification with fresh output

## Dependencies and Execution Order

- US1 can execute after setup.
- US2 shared changes require blast-radius evidence before implementation.
- US3 depends on repository contracts but not on pagination.
- US4 follows shared repository stabilization.
- Each story must pass its review gate before the next concern is committed.

## Improved Sequence Boundary - 2026-06-15

The current pre-Spec-054 foundation covers atomic identity state and
non-overridable normal soft-delete reads. T009, T013, T016, and the remaining
US3/US4 work stay open until the protected-data cutover provides the required
authorization and audit integration. No checkbox is completed solely because
foundation code exists.

Atomic identity state was completed in commit `41d8273`. Focused verification
passed the user-management build, 23 module tests, the two service contract
tests, and the two repository integration tests. T009 remains open because the
audit write is not yet part of the protected transaction boundary.

Normal-read soft-delete enforcement was completed in commit `e42cce8`.
`BaseRepository.findMany` is now protected, Prisma and module repositories use
one active-record scope helper, non-soft-deletable models remain unfiltered,
and the storage purge query uses an explicit internal deleted-record path.
Database, template-management, bot-management, and storage-engine regression
suites passed, as did full lint, the 32-project build, and boundary audit.
T013, T016, and T018 remain open until authorized recovery is integrated.

Foundation verification also passed 310 unit/application files with 2,325
tests, 22 integration files with 130 tests, documentation freshness and claims,
and `spec:validate` at 330/330. SpecKit cross-artifact analysis mapped all 19
functional requirements and 8 success criteria to tasks with zero Critical or
High inconsistencies.

## MVP Scope

US1 and US2 are the release-blocking data-integrity minimum. US3 is required for
constitutional architecture compliance, and US4 closes the confirmed
performance defect.

## Requirements Traceability

- `FR-001`, `FR-002`, `FR-003`: T005-T010
- `FR-004`, `FR-005`, `FR-006`, `FR-007`, `FR-008`: T011-T018
- `FR-009`, `FR-010`, `FR-011`, `FR-012`, `FR-013`, `FR-017`: T003, T019-T026
- `FR-014`, `FR-015`, `FR-016`: T004, T027-T033
- `FR-018`: T005-T033 and the scoped commit checkpoints in each story
- `FR-019`: T002, T018, T034-T038
- `SC-001`: T005-T010
- `SC-002`, `SC-003`: T011-T018
- `SC-004`: T019-T026, T037
- `SC-005`, `SC-006`: T027-T033
- `SC-007`: T038, T042
- `SC-008`: T036-T042

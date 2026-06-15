# Tasks: Authorization Correction

**Input**: Design documents from `specs/053-authorization-correction/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/authorization-enforcement-contract.md`, `quickstart.md`
**Tests**: Mandatory. Every behavior change follows RED -> GREEN -> REFACTOR.

## Phase 1: Setup and Evidence

- [x] T001 Create the execution worktree and branch `codex/053-authorization-correction` and confirm a clean baseline
- [x] T002 Record current middleware, ability-factory, handler, repository, and test evidence in `specs/053-authorization-correction/quickstart.md`
- [x] T003 [P] Build the active command/callback authorization inventory in `docs/developer/authorization-coverage.md`
- [x] T004 [P] Run the current bot-server and affected module tests and preserve failing baseline output in the execution report

## Phase 2: Foundational RED Tests

- [x] T005 [P] Write failing production-ability role tests in `apps/bot-server/tests/integration/authorization-role-matrix.test.ts` covering FR-001, FR-002, FR-009, and FR-010
- [x] T006 [P] Write failing disabled and missing actor tests in `apps/bot-server/tests/unit/middleware/auth.middleware.test.ts` covering FR-005 and FR-015
- [x] T007 [P] Write failing zero-mutation denial tests in affected module integration test files covering FR-004 and FR-011
- [x] T008 Write a failing test that rejects non-super-admin `manage all` production fixtures in `packages/auth-core/tests/unit/ability.factory.test.ts`

**Checkpoint**: RED evidence reproduces the global denial and protects against broad access.

## Phase 3: User Story 1 - Legitimate Users Reach Authorized Features (P1)

- [x] T009 [US1] Refactor `apps/bot-server/src/bot/middleware/auth.middleware.ts` to establish actor/ability context without unconditional `manage all`
- [x] T010 [US1] Reconcile production ability construction in `apps/bot-server/src/startup/deps.bot-factory.ts` and `packages/auth-core/src/` without changing the role hierarchy
- [x] T011 [US1] Add explicit action/subject enforcement to the first representative USER and ADMIN handler paths identified by T003
- [x] T012 [US1] Run T005 role-matrix tests and confirm GREEN for legitimate flows
- [x] T013 [US1] Refactor duplicated guard invocation only after GREEN while preserving strict types and Result contracts

**Independent Test**: Production USER and ADMIN abilities reach permitted command and callback behavior without `manage all`.

## Phase 4: User Story 2 - Protected Actions Remain Denied (P1)

- [x] T014 [US2] Implement controlled denial for unresolved and disabled actors in the owning bot security boundary
- [x] T015 [US2] Add or reconcile action/subject checks for protected state-changing handlers identified by T003
- [x] T016 [US2] Verify the correction introduces no repository bypass or direct persistence access and record broad repository remediation under Spec 055
- [x] T017 [US2] Add or reconcile localized denial keys in affected `locales/ar.json` and `locales/en.json` files
- [x] T018 [US2] Add structured denial evidence without PII in the existing audit/logging boundary
- [x] T019 [US2] Run T006-T008 and affected mutation tests and confirm GREEN

**Independent Test**: Missing, disabled, and insufficient actors are denied with zero mutation and localized feedback.

## Phase 5: User Story 3 - Reviewable Authorization Governance (P2)

- [x] T020 [P] [US3] Complete `docs/developer/authorization-coverage.md` with every active protected entry point in scope
- [x] T021 [P] [US3] Add callback coverage tests for old-message, disabled-module, and stale-role scenarios in bot-server/module tests
- [x] T022 [US3] Add a CI-visible authorization coverage assertion using the existing project tooling pattern
- [x] T023 [US3] Update affected architecture and module documentation with enforcement ownership
- [x] T024 [US3] Confirm every matrix row maps to at least one allowed or denied automated test as specified

**Independent Test**: A reviewer can map every scoped entry point to policy ownership and automated evidence.

## Phase 6: Review, Documentation Sync, and Verification

- [x] T025 Run focused tests, then `pnpm --filter bot-server test`, affected module tests, and auth-core tests
- [x] T026 Run `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, `pnpm boundary:audit`, and `pnpm cms:check`
- [x] T027 Request code review and resolve all Critical/High authorization findings before proceeding
- [x] T028 Update `spec.md`, `plan.md`, `research.md`, `data-model.md`, `tasks.md`, affected docs, and `docs/ROADMAP.md` to match implementation
- [x] T029 Run `speckit-analyze` and resolve all Critical findings
- [x] T030 Run `pnpm spec:validate` and resolve reconciliation findings
- [x] T031 Create the required changeset for affected released packages
- [x] T032 Run verification-before-completion with fresh output and prepare the merge decision

## Dependencies and Execution Order

- T005-T008 must be RED before T009-T018.
- US1 and US2 are both release-blocking; US3 follows once behavior is GREEN.
- No implementation task may proceed past a failed test or review gate.
- Spec 054 may be planned in parallel but production remediation execution remains sequential.

## MVP Scope

T001-T019 form the minimum safe correction: legitimate USER/ADMIN access plus
proof that protected behavior remains denied.

## Execution Notes

- T016 confirmed that Spec 053 adds no repository bypass or direct Prisma
  access. The audit's broader repository-boundary remediation remains owned by
  Spec 055.
- T017 reuses the existing localized `bot-server.unauthorized` key; no duplicate
  module-specific denial text was introduced.
- T025 was reverified on 2026-06-15 after reconciliation. Root
  unit/application tests passed 2,318 tests, integration passed 122 tests, and
  E2E passed 13 tests.
- T027 completed through a local defect-first review against the constitution,
  Spec 053, and the changed implementation. No Critical or High authorization
  finding remains; independent delegated review was not requested.
- T032 decision: the authorization implementation is verified on
  `codex/remediation-sequence-reconciliation` and awaits the Project Manager's
  merge decision.

## Requirements Traceability

- `FR-001`, `FR-002`, `FR-005`, `FR-015`: T005-T010, T014, T019
- `FR-003`, `FR-004`, `FR-006`, `FR-011`: T003, T007, T011, T015, T019
- `FR-007`, `FR-008`: T017-T018
- `FR-009`, `FR-010`: T005, T008, T012, T021
- `FR-012`, `FR-013`: T010-T011, T016, T028
- `FR-014`: T006, T009, T025-T026
- `FR-016`: T003, T020, T022, T024
- `SC-001`, `SC-002`, `SC-003`: T005-T019
- `SC-004`, `SC-005`: T003, T008, T020-T024
- `SC-006`: T025-T026, T029-T032
- `SC-007`: T027, T032

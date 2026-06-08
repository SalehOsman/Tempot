# Tasks: Quality Gates Hardening

**Input**: Design documents from `specs/056-quality-gates-hardening/`  
**Tests**: Mandatory for every gate behavior.

## Phase 1: Setup and Baseline

- [x] T001 Create execution worktree `codex/056-quality-gates-hardening`
- [x] T002 Generate a governed workspace/test inventory from `pnpm-workspace.yaml` and manifests
- [x] T003 Record baseline root, bot-server, docs, coverage, freshness, and toolchain command results
- [x] T004 [P] Record active documentation drift and missing README inventory
- [x] T005 [P] Record Node/pnpm/Vitest/coverage versions across manifest, lockfile, CI, Docker, and docs

## Phase 2: User Story 1 - Complete Workspace CI (P1)

- [x] T006 [P] [US1] Repair stale interaction trace fixtures in `apps/bot-server/tests/unit/error-boundary.test.ts`
- [x] T007 [P] [US1] Repair stale interaction trace fixtures in `apps/bot-server/tests/unit/middleware/audit.middleware.test.ts`
- [x] T008 [US1] Confirm direct bot-server tests pass without weakening `packages/interaction-observability/src/interaction.context.ts`
- [x] T009 [P] [US1] Add a failing fixture proving root config currently omits an app project
- [x] T010 [US1] Extend `vitest.config.ts` or workspace configuration to include governed applications
- [x] T011 [US1] Add canonical root scripts for complete application/project execution
- [x] T012 [US1] Update `.github/workflows/ci.yml` to invoke canonical complete commands and publish project/test counts
- [x] T013 [US1] Prove a seeded app failure blocks CI, remove the seed, and confirm GREEN

**Independent Test**: Any required app test failure fails the root and CI gates.

## Phase 3: User Story 2 - Enforced Coverage Policy (P1)

- [x] T014 [P] [US2] Add failing coverage-policy fixtures for service and handler thresholds
- [x] T015 [P] [US2] Add reporting fixtures for repository and conversation warning thresholds
- [x] T016 [US2] Pin `@vitest/coverage-v8` exactly to the approved Vitest version in `package.json`
- [x] T017 [US2] Consolidate active coverage configuration and include application source
- [x] T018 [US2] Implement deterministic component-category threshold mapping
- [x] T019 [US2] Add required coverage execution to CI
- [x] T020 [US2] Prove seeded blocking threshold failure and warning reporting, then confirm GREEN

**Independent Test**: Component thresholds control the gate independently of aggregate coverage.

## Phase 4: User Story 3 - Documentation Freshness (P1)

- [x] T021 [P] [US3] Add failing tests for docs script execution from root and `apps/docs`
- [x] T022 [P] [US3] Add failing fixtures for stale active claims and archive classification
- [x] T023 [US3] Make `apps/docs/scripts/check-freshness.ts` resolve repository root robustly
- [x] T024 [US3] Add canonical root `docs:freshness` and documentation validation scripts
- [x] T025 [US3] Add required docs freshness/frontmatter checks to CI
- [x] T026 [US3] Reconcile root README, bot-server README, Compose comments, environment names, deployment docs, and roadmap claims
- [x] T027 [US3] Add required README documentation for active modules currently missing it
- [x] T028 [US3] Document and enforce active/archive freshness policy
- [x] T029 [US3] Confirm seeded stale claims fail and current active docs pass

**Independent Test**: One root command detects stale active documentation with an actionable path.

## Phase 5: User Story 4 - Reproducible Toolchain and Policy (P2)

- [x] T030 [P] [US4] Add a failing check for package-manager baseline disagreement
- [x] T031 [P] [US4] Add failing conformance fixtures for suppression directives, hardcoded user text, and non-English comments
- [x] T032 [US4] Add approved `packageManager` metadata and align Corepack instructions
- [x] T033 [US4] Update CI to test Node 22.12+ and the current supported runtime line
- [x] T034 [US4] Reconcile Node/pnpm statements across Docker, workflow guide, roadmap, and deployment docs
- [x] T035 [US4] Extend existing lint/CI audits with explicit production-source conformance rules
- [x] T036 [US4] Remove confirmed hardcoded alert text, non-English developer comments, and unauthorized lint suppression through scoped fixes and i18n where user-facing
- [x] T037 [US4] Prove seeded violations fail and clean source passes

**Independent Test**: Clean checkout uses the pinned toolchain and constitutional source violations fail CI.

## Phase 6: Review and Verification

- [x] T038 Update all SpecKit artifacts, workflow docs, and `docs/ROADMAP.md`
- [x] T039 Run complete root/app test inventory and coverage
- [x] T040 Run docs freshness, frontmatter, docs tests, and docs build
- [x] T041 Run Node runtime matrix and clean Corepack bootstrap
- [x] T042 Run lint, build, boundary, module checklist, CMS, audit, and spec validation
- [x] T043 Request code/documentation review and resolve all Critical/High findings
- [x] T044 Run `speckit-analyze`
- [x] T045 Create required changesets
- [x] T046 Run verification-before-completion with fresh outputs

## Dependencies and Execution Order

- Hidden bot-server failures are fixed before app tests become required.
- Test inventory precedes coverage policy.
- Documentation scripts are corrected before CI marks them required.
- Toolchain pinning precedes the clean-checkout matrix.
- Each seeded failing fixture must prove RED and be removed or converted before merge.

## MVP Scope

US1 and US3 are the minimum false-green CI correction. US2 and US4 are required
before production-readiness sign-off.

## Requirements Traceability

- `FR-001`, `FR-002`, `FR-003`, `FR-004`: T002-T013
- `FR-005`, `FR-006`, `FR-007`, `FR-008`, `FR-009`: T014-T020
- `FR-010`, `FR-011`, `FR-012`, `FR-013`, `FR-014`: T021-T029
- `FR-015`, `FR-016`, `FR-017`: T005, T030, T032-T034, T041
- `FR-018`, `FR-019`, `FR-020`: T031, T035-T037
- `FR-021`: T004, T026-T029
- `FR-022`: T009-T013, T021-T025, T030-T037
- `FR-023`: T038, T043-T046
- `SC-001`, `SC-002`, `SC-003`: T006-T013, T039
- `SC-004`, `SC-005`: T014-T020, T039
- `SC-006`, `SC-007`: T021-T029, T040
- `SC-008`: T032-T034, T041
- `SC-009`: T031, T035-T037
- `SC-010`: T043, T046

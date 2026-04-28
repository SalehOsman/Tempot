# Tasks: Architecture Isolation and SaaS Readiness

**Input**: Design documents from `specs/026-architecture-isolation-and-saas-readiness/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: This feature is documentation, governance, and enforcement planning first. Code-facing enforcement tasks must add or update validation before changing implementation rules.

**Organization**: Tasks are grouped by user story so each architectural improvement can be reviewed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches independent files.
- **[Story]**: Maps the task to a user story from `spec.md`.
- Every task names exact files or directories.

## Phase 1: Setup

- [x] T001 Create or switch to a dedicated execution branch/worktree from `main` before editing tracked files; never execute this feature directly on `main`.
- [x] T002 [P] Review `docs/archive/tempot_v11_final.md`, `.specify/memory/constitution.md`, and `docs/archive/developer/workflow-guide.md` for existing boundary and methodology language.
- [x] T003 [P] Review Telegram Managed Bots documentation from `https://core.telegram.org/bots/features#managed-bots` and record only stable product implications in `docs/archive/architecture/telegram-managed-bots-assessment.md`.
- [x] T004 Create `docs/archive/architecture/boundaries/` for boundary inventory, rules, audit output, and remediation planning.

## Phase 2: Foundational Architecture Artifacts

- [x] T005 [P] Create `docs/archive/architecture/boundaries/component-inventory.md` listing apps, packages, modules, deferred packages, and infrastructure packages with ownership and allowed responsibility.
- [x] T006 [P] Create `docs/archive/architecture/boundaries/dependency-rules.md` defining allowed import directions, forbidden dependency paths, and extension seams for future business modules.
- [x] T007 [P] Create `docs/archive/architecture/boundaries/decision-matrix.md` defining when new functionality belongs in a package, module, app, deferred package, or future SaaS layer.
- [x] T008 Create `docs/archive/architecture/adr/ADR-040-tempot-core-cloud-boundary.md` documenting the accepted Tempot Core versus Tempot Cloud separation.
- [x] T009 Create `docs/archive/architecture/adr/ADR-041-telegram-managed-bots-strategy.md` documenting the strategic handling of Telegram Managed Bots.
- [x] T010 Update `docs/archive/architecture/adr/README.md` with ADR-040 and ADR-041.

## Phase 3: User Story 1 - Protect Architectural Boundaries (P1)

**Goal**: A developer can safely change one package or module without unexpected edits elsewhere.

**Independent Test**: The boundary audit report lists current violations, risk level, owner, and remediation path without requiring production code changes.

- [x] T011 [US1] Create `docs/archive/architecture/boundaries/audit-report.md` with current boundary findings across apps, packages, modules, and tests.
- [x] T012 [US1] Create `docs/archive/architecture/boundaries/remediation-plan.md` with prioritized fixes, estimated blast radius, and required tests for each issue.
- [x] T013 [US1] Create `docs/archive/developer/module-boundary-guide.md` explaining how to add or modify a module without crossing package boundaries.
- [x] T014 [US1] Define future CI enforcement changes in `docs/archive/architecture/boundaries/ci-enforcement-plan.md`, including `pnpm spec:validate`, boundary linting, package checklist validation, and Docker build validation.
- [x] T015 [US1] Update `docs/archive/ROADMAP.md` with the architecture hardening track as the active workstream before the next business module.

## Phase 4: User Story 2 - Make Tempot Core SaaS-Ready (P2)

**Goal**: The current bot framework stays usable as an open core while future SaaS layers are designed without invasive rewrites.

**Independent Test**: A reviewer can identify which concepts are in Tempot Core now and which belong to a future Tempot Cloud product.

- [x] T016 [US2] Create `docs/archive/architecture/saas-readiness.md` defining Tempot Core, Tempot Cloud, tenant scope, bot scope, ownership boundaries, and excluded work.
- [x] T017 [US2] Create `docs/archive/architecture/saas-migration-map.md` mapping current packages to future SaaS concerns without requiring current package rewrites.
- [x] T018 [US2] Document future multi-tenant guardrails in `docs/archive/architecture/saas-readiness.md`, including tenant ID propagation, billing isolation, admin panel scope, and deployment topology.
- [x] T019 [US2] Add a SaaS readiness milestone to `docs/archive/ROADMAP.md` after architecture hardening and before any dashboard SaaS work.

## Phase 5: User Story 3 - Evaluate Telegram Managed Bots Strategically (P3)

**Goal**: Telegram Managed Bots are treated as a strategic opportunity, not a reason to abandon Tempot or disrupt current development.

**Independent Test**: The Telegram assessment states positive effects, risks, integration timing, and required isolation boundary.

- [x] T020 [US3] Complete `docs/archive/architecture/telegram-managed-bots-assessment.md` with impact, opportunity, risks, and adoption recommendation.
- [x] T021 [US3] Create `docs/archive/architecture/telegram-managed-bots-integration-boundary.md` defining the future adapter/service boundary, required consent model, token handling, and event flow.
- [x] T022 [US3] Update `docs/archive/ROADMAP.md` to track Telegram Managed Bots as a future optional capability after boundary hardening.

## Phase 6: User Story 4 - Improve Template Usability (P4)

**Goal**: Tempot becomes easier to use as a professional starter without weakening architecture discipline.

**Independent Test**: A new developer can find setup, extension, module creation, and validation guidance from roadmap-linked docs.

- [x] T023 [US4] Create `docs/archive/developer/template-usability-roadmap.md` covering CLI/scaffold goals, example modules, environment validation, and onboarding docs.
- [x] T024 [US4] Create `docs/archive/developer/new-module-checklist.md` aligned with the package checklist and module-registry rules.
- [x] T025 [US4] Identify documentation drift and cleanup candidates in `docs/archive/developer/documentation-cleanup-plan.md`, including the human-facing `agent-skills-guide.md`.
- [x] T026 [US4] Update `docs/archive/ROADMAP.md` with template usability milestones and documentation cleanup targets.

## Phase 7: User Story 5 - Close Review Findings and Define Professional Baselines (P2)

**Goal**: Known review findings and approved quality proposals are explicitly tracked before production code changes begin.

**Independent Test**: The remediation and baseline documents map every listed review finding and every approved DX/security proposal to a future implementation or governance task.

- [x] T027 [US5] Create `docs/archive/architecture/review-findings-remediation.md` mapping the five known review findings to resolved, planned, or deferred status with validation expectations.
- [x] T028 [US5] Extend `docs/archive/architecture/boundaries/ci-enforcement-plan.md` with a blocking security audit policy that addresses the current `continue-on-error` concern in `.github/workflows/ci.yml`.
- [x] T029 [US5] Add an i18n remediation item for `packages/national-id-parser/src/validators.ts` to `docs/archive/architecture/review-findings-remediation.md`, including translation-key expectations.
- [x] T030 [US5] Add a package checklist remediation item for `modules/user-management/package.json`, `modules/user-management/vitest.config.ts`, and `modules/user-management/.gitignore` to `docs/archive/architecture/review-findings-remediation.md`.
- [x] T031 [US5] Extend `docs/archive/developer/template-usability-roadmap.md` with the official CLI options `create-tempot-bot` and `pnpm tempot init`.
- [x] T032 [US5] Create `docs/archive/developer/module-generator-plan.md` defining generated module source, tests, i18n resources, events, contracts, package exports, and validation commands.
- [x] T033 [US5] Create `docs/archive/developer/local-developer-doctor.md` defining checks for Node.js, pnpm, Docker, environment variables, PostgreSQL, Redis, Prisma, and local webhook readiness.
- [x] T034 [US5] Create `docs/archive/developer/quick-path-first-module.md` defining the 15-minute path to build the first real Tempot module.
- [x] T035 [US5] Extend `docs/archive/architecture/saas-readiness.md` with future admin dashboard scope for modules, settings, users, bots, and tenant administration.
- [x] T036 [US5] Create `docs/archive/architecture/template-marketplace.md` defining an internal marketplace for activatable bot feature templates.
- [x] T037 [US5] Create `docs/archive/architecture/observability-dashboard.md` defining dashboard scope for logs, audit events, errors, queues, and sessions.
- [x] T038 [US5] Create `docs/archive/security/security-baseline.md` covering secret scanning, dependency review, token rotation guidance, and managed-bot token handling.

## Phase 8: Validation and Reconciliation

- [x] T039 Run `pnpm spec:validate` and fix all CRITICAL issues related to spec #026.
- [x] T040 Run a manual SpecKit analyze pass across `spec.md`, `plan.md`, and `tasks.md`; resolve inconsistencies before implementation.
- [x] T041 Run `git diff --check` to catch whitespace and formatting issues.
- [x] T042 Confirm no production code was changed in this planning phase unless explicitly authorized by the Project Manager.

## Dependencies

- Phase 1 must complete before all other phases.
- ADR tasks T008-T010 must complete before SaaS and Telegram architecture documents are finalized.
- Boundary inventory T005 and dependency rules T006 must complete before audit report T011.
- Roadmap updates T015, T019, T022, and T026 should be reconciled into one coherent edit.
- T027 must exist before review finding implementation begins.
- T031-T034 depend on T023.
- T035 depends on T016.
- T036 depends on T023 and T007.
- T037 depends on T011 and T016.
- T038 depends on T020 and T021 for managed-bot token handling context.
- Validation T039-T042 must complete before review or merge.

## Requirement Traceability

| Requirement | Covered By |
| --- | --- |
| FR-001 | T005, T011 |
| FR-002 | T006, T013 |
| FR-003 | T011, T012, T014 |
| FR-004 | T012 |
| FR-005 | T008, T016, T017 |
| FR-006 | T016, T018 |
| FR-007 | T008, T015, T019 |
| FR-008 | T003, T009, T020 |
| FR-009 | T009, T021, T022 |
| FR-010 | T023, T024, T025 |
| FR-011 | T014, T028, T039, T040, T041 |
| FR-012 | T015, T019, T022, T026 |
| FR-013 | T031 |
| FR-014 | T032 |
| FR-015 | T033 |
| FR-016 | T035 |
| FR-017 | T036 |
| FR-018 | T037 |
| FR-019 | T028, T038 |
| FR-020 | T034 |
| FR-021 | T027, T028, T029, T030 |

## Success Criteria Traceability

| Success Criterion | Covered By |
| --- | --- |
| SC-001 | T005, T011 |
| SC-002 | T008, T009, T016, T020 |
| SC-003 | T001-T042 |
| SC-004 | T012, T016, T020, T023 |
| SC-005 | T023, T024, T034, T039 |
| SC-006 | T039, T040 |
| SC-007 | T031, T032, T033, T034, T035, T036, T037, T038 |
| SC-008 | T027, T028, T029, T030 |

## Parallel Execution Examples

- T005, T006, and T007 can be drafted in parallel after T004.
- T016 and T020 can proceed in parallel after ADR drafts exist.
- T023, T024, and T025 can proceed in parallel after boundary rules are stable.
- T032, T033, T034, T036, T037, and T038 can proceed in parallel after T023 and the strategic ADRs are stable.

## Implementation Strategy

1. Establish boundary documentation first.
2. Record ADRs for the strategic decisions.
3. Audit current repository structure against the rules.
4. Add SaaS and Telegram strategy documents as future-facing architecture.
5. Update the roadmap as the single source of truth.
6. Add explicit DX, security, observability, and review-finding baselines.
7. Validate SpecKit and repository hygiene before requesting review.

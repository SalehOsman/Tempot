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

- [ ] T001 Confirm execution remains on branch `codex/architecture-saas-readiness-plan` before editing tracked files.
- [ ] T002 [P] Review `docs/archive/tempot_v11_final.md`, `.specify/memory/constitution.md`, and `docs/archive/developer/workflow-guide.md` for existing boundary and methodology language.
- [ ] T003 [P] Review Telegram Managed Bots documentation from `https://core.telegram.org/bots/features#managed-bots` and record only stable product implications in `docs/archive/architecture/telegram-managed-bots-assessment.md`.
- [ ] T004 Create `docs/archive/architecture/boundaries/` for boundary inventory, rules, audit output, and remediation planning.

## Phase 2: Foundational Architecture Artifacts

- [ ] T005 [P] Create `docs/archive/architecture/boundaries/component-inventory.md` listing apps, packages, modules, deferred packages, and infrastructure packages with ownership and allowed responsibility.
- [ ] T006 [P] Create `docs/archive/architecture/boundaries/dependency-rules.md` defining allowed import directions, forbidden dependency paths, and extension seams for future business modules.
- [ ] T007 [P] Create `docs/archive/architecture/boundaries/decision-matrix.md` defining when new functionality belongs in a package, module, app, deferred package, or future SaaS layer.
- [ ] T008 Create `docs/archive/architecture/adr/ADR-040-tempot-core-cloud-boundary.md` documenting the accepted Tempot Core versus Tempot Cloud separation.
- [ ] T009 Create `docs/archive/architecture/adr/ADR-041-telegram-managed-bots-strategy.md` documenting the strategic handling of Telegram Managed Bots.
- [ ] T010 Update `docs/archive/architecture/adr/README.md` with ADR-040 and ADR-041.

## Phase 3: User Story 1 - Protect Architectural Boundaries (P1)

**Goal**: A developer can safely change one package or module without unexpected edits elsewhere.

**Independent Test**: The boundary audit report lists current violations, risk level, owner, and remediation path without requiring production code changes.

- [ ] T011 [US1] Create `docs/archive/architecture/boundaries/audit-report.md` with current boundary findings across apps, packages, modules, and tests.
- [ ] T012 [US1] Create `docs/archive/architecture/boundaries/remediation-plan.md` with prioritized fixes, estimated blast radius, and required tests for each issue.
- [ ] T013 [US1] Create `docs/archive/developer/module-boundary-guide.md` explaining how to add or modify a module without crossing package boundaries.
- [ ] T014 [US1] Define future CI enforcement changes in `docs/archive/architecture/boundaries/ci-enforcement-plan.md`, including `pnpm spec:validate`, boundary linting, package checklist validation, and Docker build validation.
- [ ] T015 [US1] Update `docs/archive/ROADMAP.md` with the architecture hardening track as the active workstream before the next business module.

## Phase 4: User Story 2 - Make Tempot Core SaaS-Ready (P2)

**Goal**: The current bot framework stays usable as an open core while future SaaS layers are designed without invasive rewrites.

**Independent Test**: A reviewer can identify which concepts are in Tempot Core now and which belong to a future Tempot Cloud product.

- [ ] T016 [US2] Create `docs/archive/architecture/saas-readiness.md` defining Tempot Core, Tempot Cloud, tenant scope, bot scope, ownership boundaries, and excluded work.
- [ ] T017 [US2] Create `docs/archive/architecture/saas-migration-map.md` mapping current packages to future SaaS concerns without requiring current package rewrites.
- [ ] T018 [US2] Document future multi-tenant guardrails in `docs/archive/architecture/saas-readiness.md`, including tenant ID propagation, billing isolation, admin panel scope, and deployment topology.
- [ ] T019 [US2] Add a SaaS readiness milestone to `docs/archive/ROADMAP.md` after architecture hardening and before any dashboard SaaS work.

## Phase 5: User Story 3 - Evaluate Telegram Managed Bots Strategically (P3)

**Goal**: Telegram Managed Bots are treated as a strategic opportunity, not a reason to abandon Tempot or disrupt current development.

**Independent Test**: The Telegram assessment states positive effects, risks, integration timing, and required isolation boundary.

- [ ] T020 [US3] Complete `docs/archive/architecture/telegram-managed-bots-assessment.md` with impact, opportunity, risks, and adoption recommendation.
- [ ] T021 [US3] Create `docs/archive/architecture/telegram-managed-bots-integration-boundary.md` defining the future adapter/service boundary, required consent model, token handling, and event flow.
- [ ] T022 [US3] Update `docs/archive/ROADMAP.md` to track Telegram Managed Bots as a future optional capability after boundary hardening.

## Phase 6: User Story 4 - Improve Template Usability (P4)

**Goal**: Tempot becomes easier to use as a professional starter without weakening architecture discipline.

**Independent Test**: A new developer can find setup, extension, module creation, and validation guidance from roadmap-linked docs.

- [ ] T023 [US4] Create `docs/archive/developer/template-usability-roadmap.md` covering CLI/scaffold goals, example modules, environment validation, and onboarding docs.
- [ ] T024 [US4] Create `docs/archive/developer/new-module-checklist.md` aligned with the package checklist and module-registry rules.
- [ ] T025 [US4] Identify documentation drift and cleanup candidates in `docs/archive/developer/documentation-cleanup-plan.md`.
- [ ] T026 [US4] Update `docs/archive/ROADMAP.md` with template usability milestones and documentation cleanup targets.

## Phase 7: Validation and Reconciliation

- [ ] T027 Run `pnpm spec:validate` and fix all CRITICAL issues related to spec #026.
- [ ] T028 Run a manual SpecKit analyze pass across `spec.md`, `plan.md`, and `tasks.md`; resolve inconsistencies before implementation.
- [ ] T029 Run `git diff --check` to catch whitespace and formatting issues.
- [ ] T030 Confirm no production code was changed in this planning phase unless explicitly authorized by the Project Manager.

## Dependencies

- Phase 1 must complete before all other phases.
- ADR tasks T008-T010 must complete before SaaS and Telegram architecture documents are finalized.
- Boundary inventory T005 and dependency rules T006 must complete before audit report T011.
- Roadmap updates T015, T019, T022, and T026 should be reconciled into one coherent edit.
- Validation T027-T030 must complete before review or merge.

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
| FR-011 | T014, T027, T028, T029 |
| FR-012 | T015, T019, T022, T026 |

## Success Criteria Traceability

| Success Criterion | Covered By |
| --- | --- |
| SC-001 | T005, T011 |
| SC-002 | T008, T009, T016, T020 |
| SC-003 | T001-T030 |
| SC-004 | T012, T016, T020, T023 |
| SC-005 | T023, T024, T027 |
| SC-006 | T027, T028 |

## Parallel Execution Examples

- T005, T006, and T007 can be drafted in parallel after T004.
- T016 and T020 can proceed in parallel after ADR drafts exist.
- T023, T024, and T025 can proceed in parallel after boundary rules are stable.

## Implementation Strategy

1. Establish boundary documentation first.
2. Record ADRs for the strategic decisions.
3. Audit current repository structure against the rules.
4. Add SaaS and Telegram strategy documents as future-facing architecture.
5. Update the roadmap as the single source of truth.
6. Validate SpecKit and repository hygiene before requesting review.

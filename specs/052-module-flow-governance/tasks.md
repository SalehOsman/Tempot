# Tasks: Module Flow Governance

**Input**: Design documents from `specs/052-module-flow-governance/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/module-flow-governance-contract.md`, `quickstart.md`

**Tests**: Required. This feature changes developer tooling and module governance, so TDD is mandatory for readiness checks, seeded defects, assistant behavior, and pilot hardening.

## Phase 1: Setup

**Purpose**: Establish the governed feature branch and complete SpecKit handoff artifacts.

- [x] T001 Create and review `specs/052-module-flow-governance/spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and contracts - covers FR-001, FR-004, FR-008, FR-014, FR-018, SC-008
- [x] T002 [P] Update `specs/052-module-flow-governance/checklists/requirements.md` after clarification and planning review - covers FR-018
- [x] T003 Run `pnpm spec:validate` and resolve artifact coverage findings for `specs/052-module-flow-governance/` - covers SC-001, SC-002, SC-003, SC-004, SC-005, SC-006, SC-007, SC-008

---

## Phase 2: Foundational Governance

**Purpose**: Define shared standards and contracts that block all user-story implementation.

- [x] T004 Write the module flow governance standard in `docs/developer/module-flow-governance.md` - covers FR-001, FR-002, FR-003, FR-004, FR-005
- [x] T005 Update `docs/developer/module-development-catalog.md` to link flow governance, flow maps, readiness findings, and assistant boundaries - covers FR-014, FR-015, FR-016, FR-017
- [x] T006 Update `docs/developer/module-capability-reuse-standard.md` with flow-governance review questions and callback ownership expectations - covers FR-008, FR-009, FR-010
- [x] T007 Update `docs/developer/new-module-checklist.md` with flow map, callback ownership, localization, capability decision, and readiness-report items - covers FR-011, FR-014, FR-018
- [x] T008 [P] Write failing schema or contract tests for module flow maps in the module tooling test area - covers FR-004, FR-005, SC-001, SC-008
- [x] T009 [P] Write failing schema or contract tests for readiness findings in the module tooling test area - covers FR-006, FR-007, SC-002
- [x] T010 Implement the minimum flow map and readiness finding contracts in the module tooling boundary - covers FR-004, FR-005, FR-006, FR-007

**Checkpoint**: Shared standards and contracts are ready; user-story implementation may start.

---

## Phase 3: User Story 1 - Detect Module Flow Defects Early (Priority: P1)

**Goal**: Developers receive precise findings for missing handlers, repeated self-navigation, and unsupported visible actions.

**Independent Test**: Seed a missing-handler defect and repeated leaf callback defect, then confirm the readiness report identifies both.

- [x] T011 [P] [US1] Write failing seeded-fixture tests for missing visible callback handlers in the module tooling test area - covers FR-003, FR-006, SC-002
- [x] T012 [P] [US1] Write failing seeded-fixture tests for repeated leaf self-navigation in the module tooling test area - covers FR-002, FR-006, SC-002
- [x] T013 [US1] Implement missing-handler detection in module readiness checks - covers FR-003, FR-006, FR-007, SC-002
- [x] T014 [US1] Implement repeated self-navigation detection in module readiness checks - covers FR-002, FR-006, FR-007, SC-002
- [ ] T015 [US1] Implement unavailable-action validation for localized module responses - covers FR-003, FR-011, SC-003
- [x] T016 [US1] Verify the pilot report identifies module name, surface, callback, severity, and correction guidance - covers FR-006, FR-007, SC-002

**Checkpoint**: US1 is testable independently through seeded readiness fixtures.

---

## Phase 4: User Story 2 - Review Module Flows With Stable Diagrams (Priority: P1)

**Goal**: Project Manager and reviewers can inspect module flow maps before implementation.

**Independent Test**: Review one pilot module flow map and confirm all visible actions, leaf pages, unavailable actions, and exits are represented.

- [ ] T017 [P] [US2] Write failing tests that validate a pilot flow map includes command entry points, surfaces, callbacks, unavailable actions, role rules, and exits - covers FR-004, FR-005, SC-001, SC-008
- [x] T018 [US2] Add the pilot module flow map artifact or metadata in the approved pilot module documentation area - covers FR-004, FR-005, SC-001, SC-008
- [x] T019 [US2] Add review guidance for parent, leaf, action, unavailable, and exit surfaces in `docs/developer/module-flow-governance.md` - covers FR-001, FR-002, FR-005, SC-008
- [x] T020 [US2] Verify the pilot flow map has no undocumented visible callback or missing exit path - covers FR-003, FR-005, SC-001

**Checkpoint**: US2 is demonstrable by reviewing the pilot flow map without reading implementation code.

---

## Phase 5: User Story 3 - Enforce Package Reuse Before Custom Module Code (Priority: P1)

**Goal**: Module planning and review prevent local duplication of approved shared capabilities.

**Independent Test**: Review a pilot capability decision table and confirm every material capability is classified.

- [ ] T021 [P] [US3] Write failing tests or checklist fixtures for missing capability decisions in a module plan or manifest - covers FR-008, FR-010, SC-004, SC-005
- [ ] T022 [P] [US3] Write failing tests or checklist fixtures for incomplete Custom Approved exceptions - covers FR-009, SC-005
- [ ] T023 [US3] Extend module readiness output to summarize capability decisions and missing reuse classifications - covers FR-008, FR-010, SC-004
- [ ] T024 [US3] Add Custom Approved exception validation to module review guidance - covers FR-009, SC-005
- [ ] T025 [US3] Verify the pilot module has zero undocumented material capability decisions - covers FR-008, FR-009, FR-010, SC-004, SC-005

**Checkpoint**: US3 blocks undocumented capability duplication in the pilot path.

---

## Phase 6: User Story 4 - Guide Module Creation With a Grounded Assistant (Priority: P2)

**Goal**: Developers receive grounded module-building guidance without bypassing methodology gates.

**Independent Test**: Ask supported and unsupported module-building questions and verify source-backed and no-context responses.

- [ ] T026 [P] [US4] Write failing assistant evaluation fixtures for grounded module methodology questions - covers FR-015, FR-017, SC-006
- [ ] T027 [P] [US4] Write failing assistant evaluation fixtures for unsupported questions that must return no-context - covers FR-016, SC-006
- [ ] T028 [US4] Define the approved assistant source set in developer documentation and assistant planning artifacts - covers FR-015, FR-016, FR-017
- [ ] T029 [US4] Implement or document the grounded assistant contract for module creation guidance - covers FR-015, FR-016, FR-017, SC-006
- [ ] T030 [US4] Verify the assistant recommends methodology gates and package reuse without generating production code - covers FR-015, FR-016, FR-017, SC-006

**Checkpoint**: US4 is demonstrable through assistant evaluation fixtures.

---

## Phase 7: User Story 5 - Improve Existing Modules Incrementally (Priority: P2)

**Goal**: Existing active modules can adopt governance one at a time without wholesale recreation.

**Independent Test**: Run the governance report against the approved pilot module, fix findings, and confirm the report passes.

- [x] T031 [P] [US5] Select and record the pilot module in `specs/052-module-flow-governance/plan.md` or follow-up documentation after Project Manager approval - covers FR-012, FR-013, FR-018, SC-007
- [x] T032 [US5] Write failing pilot-module callback or flow tests for current governance defects - covers FR-002, FR-003, FR-011, SC-003
- [x] T033 [US5] Harden only the selected pilot module's flow, callbacks, locales, and README according to findings - covers FR-011, FR-012, FR-013, SC-003, SC-007
- [x] T034 [US5] Run the pilot readiness report and confirm critical findings are resolved without unrelated module rewrites - covers FR-012, FR-013, SC-007
- [x] T034A [US5] Roll out flow governance to the first influential module, `settings-management`, with a passing module flow map and bot runtime callback tests - covers FR-002, FR-003, FR-011, FR-012, SC-003, SC-007
- [x] T034B [US5] Roll out flow governance to `notification-center` with preferences, recent activity, real test delivery, and governed result surfaces - covers FR-002, FR-003, FR-011, FR-012, FR-013, SC-003, SC-007
- [x] T034C [US5] Roll out flow governance to `audit-viewer` with governed diagnostics surfaces and runtime flow-map tests - covers FR-002, FR-003, FR-011, FR-012, FR-013, SC-003, SC-007

**Checkpoint**: US5 proves the incremental rollout model.

---

## Phase 8: Documentation Sync and Verification

**Purpose**: Preserve bidirectional code-documentation parity and prove gates.

- [ ] T035 Update `docs/ROADMAP.md` with Spec #052 status after the approved implementation slice is complete - covers FR-018
- [ ] T036 Update affected module README and developer docs to match implemented governance behavior - covers FR-014, FR-018
- [x] T037 Run `pnpm spec:validate` and resolve all Spec #052 critical/high findings - covers SC-001, SC-002, SC-003, SC-004, SC-005, SC-006, SC-007, SC-008
- [ ] T038 Run `pnpm module:checklist`, `pnpm boundary:audit`, `pnpm cms:check`, `pnpm lint`, and targeted unit tests - covers SC-001, SC-002, SC-003, SC-004, SC-005, SC-006, SC-007
- [ ] T039 Request code review against the constitution, module methodology, package reuse standard, and pilot flow map - covers FR-001, FR-008, FR-014, FR-017, FR-018

## Dependencies & Execution Order

- Phase 1 must complete before planning handoff.
- Phase 2 blocks all user stories.
- US1, US2, and US3 are P1 and should complete before assistant or broad rollout work.
- US4 depends on the source set and contracts from Phase 2.
- US5 depends on US1 through US3 so the pilot has standards and checks to apply.
- Phase 8 follows the selected implementation scope.

## MVP Scope

The MVP is Phase 1 through Phase 5 with one pilot module flow map and readiness report. The grounded assistant can follow once the governance standard and package reuse checks are stable.

## Parallel Opportunities

- T008 and T009 can run in parallel.
- T011 and T012 can run in parallel.
- T021 and T022 can run in parallel.
- T026 and T027 can run in parallel.
- Documentation updates can run alongside tests only when they touch disjoint files.

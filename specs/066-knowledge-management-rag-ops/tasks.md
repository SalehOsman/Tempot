# Tasks: Knowledge Management RAG Operations

## Requirement Traceability

| Requirement | Covered By |
| --- | --- |
| FR-001 | T010-T015 |
| FR-002 | T011-T012 |
| FR-003 | T010, T014 |
| FR-004 | T016-T021 |
| FR-005 | T004-T007, T018 |
| FR-006 | T004-T006, T019 |
| FR-007 | T004-T006 |
| FR-008 | T020-T023 |
| FR-009 | T024-T026 |
| FR-010 | T024-T026 |
| FR-011 | T027-T029 |
| FR-012 | T027-T029 |
| FR-013 | T020-T026 |
| FR-014 | T030-T031 |
| FR-015 | T030-T031 |
| FR-016 | T032 |
| FR-017 | T032 |
| FR-018 | T033-T034 |
| FR-019 | T033-T034 |
| FR-020 | T035 |
| FR-021 | T013, T035 |
| FR-022 | T013, T036 |
| FR-023 | T037 |
| FR-024 | T038 |

## Success Criteria Traceability

| Success Criterion | Covered By |
| --- | --- |
| SC-001 | T016-T017, T036 |
| SC-002 | T020-T023 |
| SC-003 | T024-T026 |
| SC-004 | T004-T006, T019 |
| SC-005 | T007-T008, T017 |
| SC-006 | T026, T041-T042 |
| SC-007 | T033-T034, T042 |
| SC-008 | T032, T035, T042 |

## Phase A: Specification And Design Gates

- [x] T001 Create Spec #066 artifacts for knowledge-management RAG operations.
- [x] T002 Run SpecKit analysis and resolve critical issues.
- [x] T003 Run `pnpm spec:validate` and resolve critical issues.

## Phase B: Provider Contract And Runtime Profiles

- [x] T004 Add failing tests for approved source profile listing.
- [x] T005 Implement source profile contracts and allowlist validation.
- [x] T006 Add failing tests that reject unknown profile ids and path traversal.
- [x] T007 Implement RAG readiness snapshot contract.
- [ ] T008 Add failing tests for zero-embeddings readiness state.
- [x] T009 Implement provider-safe Result/error mapping.

## Phase C: Module Scaffold

- [x] T010 Create `modules/knowledge-management` scaffold.
- [ ] T011 Add failing authorization tests for non-super-admin denial.
- [x] T012 Implement super-admin-only abilities and handler guards.
- [x] T013 Add Arabic and English locale files for all operator text.
- [x] T014 Add module config with `hasAI: true` and graceful degradation.
- [x] T015 Add governed `module.flow.json` and module manifest tests.

## Phase D: Status, Sources, And Dry Run

- [x] T016 Add callback tests for status view.
- [x] T017 Implement status menu and renderer.
- [ ] T018 Add callback tests for source profile list and selection.
- [x] T019 Implement source profile menu.
- [x] T020 Add failing dry-run request tests.
- [x] T021 Implement dry-run request flow and processing state.
- [ ] T022 Add dry-run result rendering tests.
- [x] T023 Implement dry-run result renderer.

## Phase E: Write And Full Reindex

- [ ] T024 Add failing tests that write requires recent dry-run.
- [ ] T025 Add write confirmation tests.
- [x] T026 Implement write confirmation and execution flow.
- [ ] T027 Add two-step full reindex confirmation tests.
- [ ] T028 Add expired confirmation tests.
- [ ] T029 Implement full reindex confirmation flow.

## Phase F: History And Test Query

- [ ] T030 Add job history and empty-state tests.
- [x] T031 Implement bounded job history and detail views.
- [ ] T032 Emit audit-safe lifecycle events for state changes.
- [ ] T033 Add test-query rendering tests.
- [ ] T034 Implement test-query operation flow.
- [ ] T035 Add safe error rendering tests.

## Phase G: Runtime Composition And Documentation

- [x] T036 Wire bot-server `KnowledgeOperationsProvider` into module loader.
- [x] T037 Document Docker/local source mounts and operation runbook.
- [x] T038 Update roadmap, architecture/RAG docs, module README, and changeset.
- [x] T039 Run `pnpm cms:check`.
- [x] T040 Run `pnpm telegram-keyboard-ux:check`.
- [x] T041 Run `pnpm lint`, focused tests, `pnpm build:bot-runtime`, and
      `pnpm spec:validate`.
- [ ] T042 Capture local Docker evidence after source mounts are configured.

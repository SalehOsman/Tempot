# Tasks: Documentation Ingestion Runtime Composition

**Input**: Design documents from `/specs/063-docs-ingestion-runtime-composition/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Required by the Tempot TDD gate.

## Phase 1: Setup

- [x] T001 Update `.specify/feature.json` to point at Spec #063.
- [x] T002 [P] Add the Spec #063 feature artifacts under
  `specs/063-docs-ingestion-runtime-composition/`.

---

## Phase 2: Foundational Tests

- [x] T003 [US1] Add failing unit coverage proving dry-run does not save hashes
  or call ingestion dependencies.
- [x] T004 [US2] Add failing unit coverage proving write mode saves only
  successful file hashes.
- [x] T005 [US3] Add failing unit coverage proving `--full` processes unchanged
  files.

---

## Phase 3: User Story 1 - Preview Documentation Ingestion Safely (Priority: P1)

**Goal**: Dry-run previews ingestion scope without writes.

**Independent Test**: `pnpm --filter docs exec vitest run tests/unit/ingest-docs.test.ts`

- [x] T006 [US1] Extend CLI argument parsing in
  `apps/docs/scripts/ingest-docs.ts`.
- [x] T007 [US1] Add chunk preview reporting to dry-run processing in
  `apps/docs/scripts/ingest-docs.ts`.
- [x] T008 [US1] Ensure dry-run never calls hash persistence.

---

## Phase 4: User Story 2 - Write Embeddings With Explicit Operator Intent (Priority: P1)

**Goal**: Write mode composes live AI/database dependencies and writes only
successful file hashes.

**Independent Test**: `pnpm --filter docs exec vitest run tests/unit/ingest-docs.test.ts`

- [x] T009 [US2] Add runtime composition in
  `apps/docs/scripts/ingest-runtime.ts`.
- [x] T010 [US2] Add write-mode orchestration in
  `apps/docs/scripts/ingest-docs.ts`.
- [x] T011 [US2] Report file-level failures as structured JSON.
- [x] T012 [US2] Persist hashes only for successful file ingestions.

---

## Phase 5: User Story 3 - Re-index Documentation Intentionally (Priority: P2)

**Goal**: `--full` bypasses hash skipping for re-index operations.

- [x] T013 [US3] Preserve and test forced processing with `--full`.

---

## Phase 6: Documentation and Validation

- [x] T014 Update `docs/architecture/ai-rag-runtime-activation-plan.md`.
- [x] T015 Update `docs/ROADMAP.md` if project state changes.
- [x] T016 Run focused tests and SpecKit validation.

## Requirement Traceability

- **FR-001**: Covered by T003, T007, and T008.
- **FR-002**: Covered by T004, T006, T009, and T010.
- **FR-003**: Covered by T006 and T008.
- **FR-004**: Covered by T009.
- **FR-005**: Covered by T009.
- **FR-006**: Covered by T004 and T012.
- **FR-007**: Covered by T004 and T011.
- **FR-008**: Covered by T005 and T013.
- **FR-009**: Covered by T003 and T007.
- **FR-010**: Covered by T014 and T015.

## Success Criteria Traceability

- **SC-001**: Covered by T003, T008, and T016.
- **SC-002**: Covered by T004, T012, and T016.
- **SC-003**: Covered by T004, T011, and T016.
- **SC-004**: Covered by T014 and T015.
- **SC-005**: Covered by T003, T004, T005, and T016.

## Dependencies & Execution Order

Phase 1 must complete before implementation. Phase 2 tests must fail before
Phase 3 or Phase 4 production changes. Phase 6 follows implementation.

# Tasks: Tempot Multimodal RAG Methodology

**Input**: Design documents from `specs/027-tempot-multimodal-rag-methodology/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Scope**: This SpecKit feature establishes the methodology and implementation
handoff. Production code changes belong in follow-on implementation specs.

## Phase 1: Setup

**Purpose**: Establish the methodology artifacts and project pointers.

- [ ] T001 Confirm active feature pointer in `.specify/feature.json`
- [ ] T002 Create methodology architecture document in `docs/archive/architecture/ai-rag-methodology.md`
- [ ] T003 Update roadmap active workstream in `docs/archive/ROADMAP.md`

---

## Phase 2: Foundational Methodology

**Purpose**: Cover the RAG methodology requirements and measurable outcomes.

- [ ] T004 [P] Document RAG-Anything as methodology-only reference for FR-001 and SC-002 in `specs/027-tempot-multimodal-rag-methodology/research.md`
- [ ] T005 [P] Document the Tempot RAG pipeline stages for FR-002 and SC-001 in `specs/027-tempot-multimodal-rag-methodology/plan.md`
- [ ] T006 [P] Document the content block data model for FR-003, FR-004, and SC-003 in `specs/027-tempot-multimodal-rag-methodology/data-model.md`
- [ ] T007 [P] Document package ownership boundaries for FR-005 and SC-001 in `docs/archive/architecture/ai-rag-methodology.md`
- [ ] T008 [P] Document access-control and grounding rules for FR-006, FR-008, FR-009, and SC-005 in `specs/027-tempot-multimodal-rag-methodology/contracts/retrieval-contract.md`
- [ ] T009 [P] Document hybrid retrieval and multimodal handling for FR-007, FR-010, and SC-004 in `specs/027-tempot-multimodal-rag-methodology/contracts/retrieval-contract.md`
- [ ] T010 [P] Document evaluation metrics for FR-011 and SC-005 in `specs/027-tempot-multimodal-rag-methodology/contracts/evaluation-contract.md`
- [ ] T011 [P] Document provider compatibility and re-indexing rules for FR-012 in `specs/027-tempot-multimodal-rag-methodology/research.md`
- [ ] T012 [P] Document Result pattern and event-driven integration for FR-013 and FR-014 in `specs/027-tempot-multimodal-rag-methodology/contracts/content-block-contract.md`
- [ ] T013 Document the phased implementation path for FR-015 and SC-004 in `specs/027-tempot-multimodal-rag-methodology/plan.md`

---

## Phase 3: User Story 1 - Architecture Owner Defines Methodology (Priority: P1)

**Goal**: Make the RAG-Anything-inspired methodology actionable inside Tempot.

**Independent Test**: A reviewer can map every RAG stage to one Tempot package without reading code internals.

- [ ] T014 [US1] Review `specs/027-tempot-multimodal-rag-methodology/spec.md` against FR-001, FR-002, FR-005, SC-001, and SC-002
- [ ] T015 [US1] Review `docs/archive/architecture/ai-rag-methodology.md` for package ownership clarity
- [ ] T016 [US1] Review `docs/archive/ROADMAP.md` to confirm deferred packages are not activated by this methodology spec

---

## Phase 4: User Story 2 - Developer Builds Content Blocks (Priority: P1)

**Goal**: Define content block normalization as the contract between parsing and RAG.

**Independent Test**: A mixed document can be represented as content blocks without activating `document-engine`.

- [ ] T017 [US2] Review `specs/027-tempot-multimodal-rag-methodology/data-model.md` against FR-003, FR-004, and SC-003
- [ ] T018 [US2] Review `specs/027-tempot-multimodal-rag-methodology/contracts/content-block-contract.md` for direct content insertion and validation rules
- [ ] T019 [US2] Validate the mixed document walkthrough in `specs/027-tempot-multimodal-rag-methodology/quickstart.md`

---

## Phase 5: User Story 3 - Grounded Hybrid Retrieval (Priority: P1)

**Goal**: Define hybrid retrieval and grounded answer behavior.

**Independent Test**: Retrieval planning can represent vector, lexical, relationship, and rerank modes while enforcing access filters.

- [ ] T020 [US3] Review `specs/027-tempot-multimodal-rag-methodology/contracts/retrieval-contract.md` against FR-006, FR-007, FR-008, FR-009, and FR-010
- [ ] T021 [US3] Validate access filtering and no-context behavior in `specs/027-tempot-multimodal-rag-methodology/quickstart.md`

---

## Phase 6: User Story 4 - Operator Evaluates Quality And Cost (Priority: P2)

**Goal**: Make RAG quality measurable before broad rollout.

**Independent Test**: Evaluation cases can report retrieval, citation, no-context, latency, and cost metrics.

- [ ] T022 [US4] Review `specs/027-tempot-multimodal-rag-methodology/contracts/evaluation-contract.md` against FR-011 and SC-005
- [ ] T023 [US4] Confirm evaluation readiness checklist in `specs/027-tempot-multimodal-rag-methodology/quickstart.md`

---

## Phase 7: User Story 5 - Future Packages Integrate Through Contracts (Priority: P2)

**Goal**: Prepare package activation without coupling `ai-core` to deferred package internals.

**Independent Test**: A future package can use public contracts without importing internal files.

- [ ] T024 [US5] Review `docs/archive/architecture/ai-rag-methodology.md` against FR-005, FR-014, and FR-015
- [ ] T025 [US5] Confirm `docs/archive/ROADMAP.md` still keeps `search-engine`, `document-engine`, and `import-engine` deferred until explicit activation

---

## Final Phase: Verification And Handoff

- [ ] T026 Run `pnpm spec:validate` and confirm SC-006
- [ ] T027 Run `pnpm lint`
- [ ] T028 Run `git diff --check`
- [ ] T029 Request review of `specs/027-tempot-multimodal-rag-methodology/spec.md`
- [ ] T030 After approval, create follow-on implementation spec for current `ai-core` reconciliation

## Dependencies & Execution Order

- Phase 1 must complete before methodology review.
- Phase 2 covers all foundational requirements.
- US1, US2, and US3 are P1 and should be reviewed before any production code changes.
- US4 and US5 can be reviewed after P1.
- Follow-on implementation specs must use TDD and must not reuse this planning-only task list as code execution approval.

## MVP First

The MVP is a validated methodology handoff:

1. Complete Phase 1.
2. Complete Phase 2.
3. Validate US1, US2, and US3.
4. Run `pnpm spec:validate`.

After that, create the execution spec for `ai-core` reconciliation.

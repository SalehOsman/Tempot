# Tasks: Tempot Multimodal RAG Methodology

**Input**: Design documents from `specs/027-tempot-multimodal-rag-methodology/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Status**: Complete methodology handoff; runtime activation pending separately.

## Scope

This SpecKit feature establishes the methodology and implementation handoff.
Production code changes belong in follow-on implementation specs.

The follow-on foundation work has been delivered through:

- Spec #029: content block contracts.
- Spec #030: retrieval planning and grounded answer contracts.
- Spec #031: RAG runtime wiring.
- Spec #032: deterministic RAG evaluation fixtures.

Full Telegram bot runtime activation is not part of this methodology spec. It is
tracked in `docs/architecture/ai-rag-runtime-activation-plan.md`.

## Reconciled Task Status

### Phase 1: Setup

- [x] T001 Confirm active feature pointer in `.specify/feature.json`.
- [x] T002 Create methodology architecture document in `docs/architecture/ai-rag-methodology.md`.
- [x] T003 Update roadmap active workstream in `docs/ROADMAP.md`.

### Phase 2: Foundational Methodology

- [x] T004 Document RAG-Anything as a methodology-only reference in `research.md` for FR-001 and SC-002.
- [x] T005 Document the Tempot RAG pipeline stages in `plan.md` for FR-002 and SC-001.
- [x] T006 Document the content block data model in `data-model.md` for FR-003, FR-004, and SC-003.
- [x] T007 Document package ownership boundaries in `docs/architecture/ai-rag-methodology.md` for FR-005 and SC-001.
- [x] T008 Document access-control and grounding rules in `contracts/retrieval-contract.md` for FR-006, FR-008, FR-009, and SC-005.
- [x] T009 Document hybrid retrieval and multimodal handling in `contracts/retrieval-contract.md` for FR-007, FR-010, and SC-004.
- [x] T010 Document evaluation metrics in `contracts/evaluation-contract.md` for FR-011 and SC-005.
- [x] T011 Document provider compatibility and re-indexing rules in `research.md` for FR-012.
- [x] T012 Document Result pattern and event-driven integration in `contracts/content-block-contract.md` for FR-013 and FR-014.
- [x] T013 Document the phased implementation path in `plan.md` for FR-015 and SC-004.

### Phase 3: Methodology Review

- [x] T014 Review `spec.md` against methodology requirements and success criteria.
- [x] T015 Review `docs/architecture/ai-rag-methodology.md` for package ownership clarity.
- [x] T016 Review `docs/ROADMAP.md` to confirm methodology did not activate runtime AI/RAG.

### Phase 4: Content Block Contract Handoff

- [x] T017 Review `data-model.md` for content block representation.
- [x] T018 Review `contracts/content-block-contract.md` for direct content insertion and validation rules.
- [x] T019 Validate the mixed document walkthrough in `quickstart.md`.

### Phase 5: Grounded Retrieval Handoff

- [x] T020 Review `contracts/retrieval-contract.md` for retrieval planning, access filtering, grounding, and no-context behavior.
- [x] T021 Validate access filtering and no-context behavior in `quickstart.md`.

### Phase 6: Evaluation Handoff

- [x] T022 Review `contracts/evaluation-contract.md` for retrieval, citation, leakage, no-context, latency, and cost dimensions.
- [x] T023 Confirm evaluation readiness guidance in `quickstart.md`.

### Phase 7: Future Integration Guidance

- [x] T024 Review `docs/architecture/ai-rag-methodology.md` for future package integration boundaries.
- [x] T025 Confirm package activation remains governed by explicit roadmap and SpecKit decisions.

### Final Phase: Verification And Handoff

- [x] T026 Run `pnpm spec:validate` during feature completion for SC-006.
- [x] T027 Run `pnpm lint` during feature completion.
- [x] T028 Run `git diff --check` during feature completion.
- [x] T029 Request review of `spec.md`.
- [x] T030 Create follow-on implementation spec #028 for `ai-core` reconciliation.

## Current Follow-Up Plan

The next executable work is not more methodology writing. The remaining work is
runtime activation:

1. Create or verify production vector storage migration evidence.
2. Complete operational docs ingestion dependency composition.
3. Add a governed AI/RAG runtime composition point.
4. Activate one narrow read-only Telegram bot flow.
5. Extend fixture-backed tests for the activated flow.
6. Run local and staging gates before release consideration.

Use `docs/architecture/ai-rag-runtime-activation-plan.md` as the current plan.

# Tasks: AI/RAG Vector Storage Activation

**Input**: Design documents from `specs/062-ai-rag-vector-storage-activation/`
**Prerequisites**: spec.md, plan.md, research.md, data-model.md

## Phase 1: SpecKit Handoff

- [x] T001 Create Spec #062 artifacts for vector storage activation.
- [x] T002 Point `.specify/feature.json` at Spec #062.
- [x] T003 Run `tsx scripts/spec-validate/index.ts --all` before code changes.

## Phase 2: TDD RED

- [x] T004 Add failing unit test `packages/database/tests/unit/vector-migration.test.ts` proving the committed migration must create `vector`, `embeddings`, `id`, `content_id`, `content_type`, `metadata`, `vector(3072)`, and `embeddings_vector_hnsw_idx` for FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, and SC-001.
- [x] T005 Run the focused unit test and confirm RED for SC-001.

## Phase 3: GREEN

- [x] T006 Add the committed SQL migration for FR-001 through FR-005.
- [x] T007 Confirm no Prisma embedding model was added for FR-007.
- [x] T008 Run the focused unit test and confirm GREEN for SC-002.
- [x] T009 Run `pnpm --filter @tempot/database build` for SC-003.

## Phase 4: Documentation Sync

- [x] T010 Update `docs/architecture/ai-rag-runtime-activation-plan.md` for FR-008.
- [x] T011 Update `docs/ROADMAP.md` for FR-008.
- [x] T012 Mark Spec #062 tasks complete after verification evidence is collected.

## Phase 5: Verification

- [x] T013 Run `tsx scripts/spec-validate/index.ts --all` for SC-004.
- [x] T014 Run `git diff --check` for SC-005.

## MVP Definition

The MVP is committed vector storage migration evidence plus a deterministic
regression test. No bot flow is activated in this slice.

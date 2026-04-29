# Tasks: AI Core RAG Reconciliation

**Input**: Design documents from `specs/028-ai-core-rag-reconciliation/`
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [x] T001 Confirm active feature pointer in `.specify/feature.json`
- [x] T002 Review Spec #027 handoff task T030 before code edits
- [x] T003 Create Superpowers implementation plan in `docs/superpowers/plans/2026-04-29-ai-core-rag-reconciliation.md`

## Phase 2: TDD Confirmation Behavior

- [x] T004 [US2] Add failing unit assertion for `IntentRouter.route()` returning `ai-core.confirmation.required` when confirmation is pending for FR-004
- [x] T005 [US2] Add failing unit assertion for AI SDK tool callback returning JSON confirmation status for FR-005
- [x] T006 [US2] Run targeted ai-core test and verify RED
- [x] T007 [US2] Update `packages/ai-core/src/router/intent.router.ts` with confirmation response key and structured callback status
- [x] T008 [US2] Run targeted ai-core test and verify GREEN for FR-006

## Phase 3: Documentation Reconciliation

- [x] T009 [US1] Update `packages/ai-core/README.md` provider environment variable guidance for FR-001
- [x] T010 [US1] Update `specs/015-ai-core-package/spec.md` to supersede stale provider refusal guidance for FR-002
- [x] T011 [US1] Replace stale `specs/015-ai-core-package/tasks.md` with reconciled implementation status for FR-003
- [x] T012 [US3] Update `specs/027-tempot-multimodal-rag-methodology/tasks.md` to reference this follow-on spec
- [x] T013 [US3] Update `docs/archive/ROADMAP.md` active AI workstream for FR-007 and FR-008

## Phase 4: Verification

- [x] T014 Run `pnpm --filter @tempot/ai-core test` and confirm SC-001 for FR-009
- [x] T015 Run `pnpm spec:validate` and confirm SC-002 for FR-009
- [x] T016 Run `pnpm lint` and confirm SC-003 for FR-009
- [x] T017 Run `git diff --check` and confirm SC-004 for FR-009
- [x] T018 Search for active stale guidance and confirm SC-005
- [x] T019 Run `pnpm build`, `pnpm test:unit`, and `pnpm cms:check` as expanded merge readiness checks

## Dependencies

- T001-T003 before implementation.
- T004-T006 before T007.
- T007 before T008.
- T009-T013 after T008.
- T014-T018 after all edits.

## MVP First

The MVP is confirmation i18n compliance plus source-of-truth reconciliation. It does not activate `search-engine`, `document-engine`, or `import-engine`.

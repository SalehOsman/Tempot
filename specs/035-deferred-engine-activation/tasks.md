# Tasks: Deferred Engine Activation

**Input**: Design documents from `specs/035-deferred-engine-activation/`
**Prerequisites**: Product Manager activation decision dated 2026-05-06

## Phase 1: Setup

**Purpose**: Establish isolated activation work.

- [x] T001 Create isolated worktree branch `codex/035-activate-deferred-packages` - covers FR-008
- [x] T002 Point `.specify/feature.json` at Spec #035 - covers FR-005

## Phase 2: Roadmap Activation

**Purpose**: Record the Rule XC activation decision.

- [x] T003 Update `docs/archive/ROADMAP.md` with the activation decision for
  `search-engine`, `document-engine`, and `import-engine` - covers FR-001, SC-001
- [x] T004 Keep `cms-engine` in the deferred package section - covers FR-002, SC-001
- [x] T005 Document the execution order as `document-engine`, `import-engine`, then
  `search-engine` - covers FR-003, FR-004, SC-005

## Phase 3: Package SpecKit Repair

**Purpose**: Prepare each activated package for a future Superpowers implementation branch.

- [x] T006 Repair `specs/016-document-engine-package` handoff artifacts - covers FR-005, FR-006, SC-002
- [x] T007 Repair `specs/017-import-engine-package` handoff artifacts - covers FR-005, FR-006, SC-002
- [x] T008 Repair `specs/014-search-engine-package` handoff artifacts - covers FR-005, FR-006, SC-002
- [x] T009 Confirm repaired package tasks include package-relevant verification and merge gates - covers FR-007

## Phase 4: Validation

**Purpose**: Prove the activation handoff is ready.

- [x] T010 Run cross-artifact review and resolve critical findings - covers FR-006
- [x] T011 Run `corepack pnpm spec:validate` and confirm zero critical issues - covers FR-006, SC-003
- [x] T012 Run `git diff --check` to confirm whitespace safety - covers SC-004
- [x] T013 Review diff scope and confirm no production package source code changed - covers FR-008, FR-009, SC-004

## Dependencies & Execution Order

- Roadmap activation must happen before package implementation work.
- Package spec repair must complete before any package-specific Superpowers execution.
- `document-engine` implementation must complete before `import-engine`.
- `search-engine` implementation starts after the import/export foundation is merged.

## MVP Definition

The MVP for this activation slice is a validated roadmap and SpecKit handoff state that
allows the next branch to implement `document-engine` without violating Rule XC or Rule
LXXXV.

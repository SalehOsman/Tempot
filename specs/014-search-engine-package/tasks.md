# Tasks: Search Engine Package

**Input**: Design documents from `specs/014-search-engine-package/`
**Prerequisites**: Spec #035 activation merged, `document-engine` and `import-engine`
completed if the roadmap sequence is still unchanged

## Phase 1: Setup

- [ ] T001 Create isolated package branch or worktree for `search-engine` - covers FR-010
- [ ] T002 Create package manifest, strict TypeScript config, exports, README update, and
  package checklist entries - covers FR-010, SC-005

## Phase 2: TDD - Request Contracts and Relational Planning

- [ ] T003 Write failing unit tests for strict search request and filter contract coverage
  across enum, range, date range, contains, and boolean filters - covers FR-001, FR-002, SC-001
- [ ] T004 Write failing unit tests for invalid field and invalid operator errors - covers
  FR-003, FR-004, SC-002
- [ ] T005 Write failing unit tests for relational plan output without persistence execution
  - covers FR-005

## Phase 3: Implementation - Relational MVP

- [ ] T006 Implement typed contracts and public exports - covers FR-001, FR-002
- [ ] T007 Implement request validation with Result-returning error paths - covers FR-003, FR-004
- [ ] T008 Implement relational search plan normalization without Prisma client execution -
  covers FR-005, SC-002

## Phase 4: State Persistence

- [ ] T009 Write failing unit tests for save, load, missing, and expired search state - covers
  FR-006, FR-009, SC-003
- [ ] T010 Implement cache-adapter state persistence with 1800-second TTL - covers FR-006, FR-009
- [ ] T011 Implement pagination metadata for list flows - covers FR-007

## Phase 5: Semantic Planning

- [ ] T012 Write failing unit tests for semantic mode, missing semantic query, and adapter
  invocation - covers FR-008, SC-004
- [ ] T013 Implement semantic search planning through injected adapters only - covers FR-008

## Phase 6: Verification

- [ ] T014 Run package unit tests and verify GREEN - covers SC-001, SC-002, SC-003, SC-004
- [ ] T015 Run package build and lint - covers SC-005
- [ ] T016 Run package checklist audit and `corepack pnpm spec:validate` - covers FR-010, SC-005
- [ ] T017 Run full merge gates selected for package scope and review diff for constitution
  compliance - covers SC-005

## MVP Definition

The MVP is a strict, tested relational search planning package with cache-backed state.
Semantic planning may ship in the same branch only after the relational MVP is green and
adapter tests are written first.

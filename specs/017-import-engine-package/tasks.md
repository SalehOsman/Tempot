# Tasks: Import Engine Package

**Input**: Design documents from `specs/017-import-engine-package/`
**Prerequisites**: Spec #035 activation merged and `document-engine` package completed

## Phase 1: Setup and Dependency Verification

- [x] T001 Confirm `document-engine` completion and contracts before starting active
  execution - covers FR-009
- [x] T002 Create isolated package branch or worktree for `import-engine` - covers FR-011
- [x] T003 Verify parser dependency choices against lockfile, TypeScript support, runtime
  compatibility, and incremental processing needs before manifest edits - covers FR-002
- [x] T004 Create package manifest, strict TypeScript config, exports, README update, and
  package checklist entries - covers FR-001, FR-011, SC-005

## Phase 2: TDD - Parsing and Validation

- [x] T005 Write failing unit tests for CSV fixture parsing - covers FR-002, SC-001
- [x] T006 Write failing unit tests for spreadsheet fixture parsing - covers FR-002, SC-001
- [x] T007 Write failing unit tests for schema adapter validation, invalid-row row numbers,
  and validation message keys - covers FR-003, FR-004, FR-008, SC-002

## Phase 3: Implementation - Parser and Validation MVP

- [x] T008 Implement typed import contracts and public exports - covers FR-001
- [x] T009 Implement CSV parser adapter and spreadsheet parser adapter - covers FR-002, SC-001
- [x] T010 Implement schema adapter validation and row result collection - covers
  FR-003, FR-004, FR-008, SC-002

## Phase 4: Queue and Event Workflow

- [x] T011 Write failing tests for import request handling and queue enqueueing - covers
  FR-005, FR-006, SC-004
- [x] T012 Write failing tests for valid batch events - covers FR-007, SC-002, SC-004
- [x] T013 Write failing tests for error report requests and completion/failure events -
  covers FR-009, FR-010, SC-003, SC-004
- [x] T014 Implement event request listener and queue producer - covers FR-005, FR-006
- [x] T015 Implement batch emission for valid rows - covers FR-007
- [x] T016 Implement document error report request for invalid rows - covers FR-009, SC-003
- [x] T017 Implement completion and failure events with typed totals - covers FR-010, SC-004

## Phase 5: Verification

- [x] T018 Run package unit and integration tests and verify GREEN - covers SC-001, SC-002, SC-003, SC-004
- [x] T019 Run package build and lint - covers SC-005
- [x] T020 Run package checklist audit and `corepack pnpm spec:validate` - covers FR-011, SC-005
- [x] T021 Run full merge gates selected for package scope and review diff for constitution
  compliance - covers SC-005

## MVP Definition

The MVP is asynchronous CSV and spreadsheet import with validation, valid batch events,
document-engine error report requests, completion events, failure events, and deterministic
tests.

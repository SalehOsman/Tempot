# Tasks: Document Engine Package

**Input**: Design documents from `specs/016-document-engine-package/`
**Prerequisites**: Spec #035 activation merged

## Phase 1: Setup and Dependency Verification

- [x] T001 Create isolated package branch or worktree for `document-engine` - covers FR-011
- [x] T002 Verify document-generation dependency choices against lockfile, TypeScript
  support, runtime compatibility, and RTL needs before manifest edits - covers FR-002, FR-010
- [x] T003 Create package manifest, strict TypeScript config, exports, README update, and
  package checklist entries - covers FR-001, FR-011, SC-005

## Phase 2: TDD - Contracts and Generators

- [x] T004 Write failing unit tests for export request, job, result, and failure contracts -
  covers FR-001, FR-003
- [x] T005 Write failing unit tests for deterministic PDF fixture generation - covers
  FR-002, FR-009, FR-010, SC-001
- [x] T006 Write failing unit tests for deterministic spreadsheet fixture generation -
  covers FR-002, FR-009, FR-010, SC-001

## Phase 3: Implementation - Generator MVP

- [x] T007 Implement typed export contracts and package exports - covers FR-001, FR-003
- [x] T008 Implement PDF generator adapter with RTL metadata support - covers FR-002, FR-009, FR-010
- [x] T009 Implement spreadsheet generator adapter with RTL worksheet metadata support -
  covers FR-002, FR-009, FR-010

## Phase 4: Queue, Event, and Storage Workflow

- [x] T010 Write failing tests for event request handling and queue enqueueing - covers
  FR-004, FR-005, SC-002
- [x] T011 Write failing tests for storage upload and completion event emission - covers
  FR-006, FR-007, SC-003
- [x] T012 Write failing tests for generator and upload failure events - covers FR-008, SC-004
- [x] T013 Implement event request listener and queue producer - covers FR-004, FR-005
- [x] T014 Implement export job processor, storage upload, and completion events - covers
  FR-006, FR-007
- [x] T015 Implement typed failure events and Result-returning failure paths - covers FR-003, FR-008

## Phase 5: Verification

- [x] T016 Run package unit and integration tests and verify GREEN - covers SC-001, SC-002, SC-003, SC-004
- [x] T017 Run package build and lint - covers SC-005
- [x] T018 Run package checklist audit and `corepack pnpm spec:validate` - covers FR-011, SC-005
- [x] T019 Run full merge gates selected for package scope and review diff for constitution
  compliance - covers SC-005

## MVP Definition

The MVP is event-driven asynchronous PDF and spreadsheet export with storage upload,
completion events, failure events, and deterministic tests.

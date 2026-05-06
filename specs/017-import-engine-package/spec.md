# Feature Specification: Import Engine Package

**Feature Branch**: `017-import-engine-package`
**Created**: 2026-03-19
**Repaired**: 2026-05-06
**Status**: Active SpecKit Handoff
**Input**: Activate `import-engine` as the second package in the deferred engine execution
sequence, after `document-engine`.

## User Scenarios & Testing

### User Story 1 - Validated bulk import (Priority: P1)

As a module developer, I want uploaded CSV and spreadsheet rows parsed, validated, and
batched so destination modules can persist valid records efficiently.

**Why this priority**: Bulk import is a core administrative workflow and must be reusable
across modules.

**Independent Test**: Unit tests parse deterministic CSV and spreadsheet fixtures, validate
rows with a typed schema adapter, and assert valid batches are emitted.

**Acceptance Scenarios**:

1. **Given** a valid CSV import file, **When** processing runs, **Then** rows are parsed
   incrementally and valid rows are emitted in configured batches.
2. **Given** a valid spreadsheet import file, **When** processing runs, **Then** rows are
   parsed and normalized into the same row contract as CSV.
3. **Given** invalid rows, **When** validation runs, **Then** invalid rows are collected
   with row numbers and validation message keys.

---

### User Story 2 - Error report generation (Priority: P1)

As an administrator, I want a downloadable error report containing only failed rows so I
can correct and retry the import.

**Why this priority**: Partial success without actionable row errors is not usable for
large data imports.

**Independent Test**: Integration-style unit tests use a fake document export adapter and
verify invalid rows produce an error report request after processing.

**Acceptance Scenarios**:

1. **Given** invalid rows exist, **When** processing completes, **Then** the engine requests
   a spreadsheet error report through the `document-engine` contract.
2. **Given** no invalid rows exist, **When** processing completes, **Then** no error report
   request is emitted.

---

### User Story 3 - Import lifecycle events (Priority: P2)

As a bot workflow, I want import progress, completion, and failure events so users can be
notified without the import package knowing bot UI details.

**Why this priority**: Imports are asynchronous and need observable lifecycle state.

**Independent Test**: Tests force success, partial success, and failure paths and assert
typed lifecycle event payloads.

**Acceptance Scenarios**:

1. **Given** a received import file event, **When** the engine handles it, **Then** it
   enqueues an import job through the queue abstraction.
2. **Given** batches are emitted and processing finishes, **When** completion runs, **Then**
   an import completion event includes totals and error report metadata.
3. **Given** parsing or validation setup fails, **When** processing runs, **Then** a typed
   failure event is emitted.

## Edge Cases

- Large files are processed incrementally and must not be fully loaded into memory by the
  import workflow.
- Duplicate handling is delegated to destination modules that consume batch events.
- Failed rows must preserve source row numbers.
- Error report generation requires `document-engine` contracts to exist first.
- User-facing progress text is represented by i18n keys.
- The package must not add a root CLI in the MVP; template generation can be a future DX
  spec if needed.

## Requirements

### Functional Requirements

- **FR-001**: The package MUST define strict typed contracts for import requests, import
  jobs, row results, batches, lifecycle events, and failure payloads.
- **FR-002**: The package MUST support CSV and spreadsheet import formats.
- **FR-003**: Row validation MUST use an injected schema adapter so tests and modules can
  provide deterministic validation behavior.
- **FR-004**: Fallible public APIs MUST return `Result<T, AppError>` or async Result
  equivalents.
- **FR-005**: Import requests MUST be accepted through event-bus subscription contracts.
- **FR-006**: Import jobs MUST be queued through the shared queue factory abstraction.
- **FR-007**: Valid rows MUST be emitted as `import.batch.ready` event payloads.
- **FR-008**: Invalid rows MUST be collected with source row numbers and validation message
  keys.
- **FR-009**: Invalid rows MUST request a spreadsheet error report through the
  `document-engine` contract.
- **FR-010**: Completion and failure events MUST include totals, status, and optional error
  report metadata.
- **FR-011**: The implementation MUST satisfy the package creation checklist before code
  is considered complete.

### Key Entities

- **ImportRequest**: Event payload identifying file, module, format, locale, and validation
  schema adapter.
- **ImportJob**: Queue job payload used by the worker.
- **ImportRowResult**: Per-row validation outcome.
- **ImportBatchReady**: Event payload containing valid rows for destination modules.
- **ImportProcessSummary**: Completion event payload with totals and error report metadata.

## Success Criteria

- **SC-001**: Unit tests parse CSV and spreadsheet fixtures into the same row contract.
- **SC-002**: Validation tests prove valid rows are batched and invalid rows preserve row
  numbers.
- **SC-003**: Error-report tests prove invalid rows request a document export and valid-only
  imports do not.
- **SC-004**: Lifecycle tests prove request, batch, completion, and failure events are
  emitted through adapters.
- **SC-005**: Package checklist, lint, build, unit tests, integration tests, and
  `spec:validate` pass before merge.

## Assumptions

- `document-engine` has completed before this package enters active execution.
- Destination modules own persistence and duplicate/upsert behavior.
- Template-generation CLI work is out of scope for this MVP unless the Product Manager
  opens a separate DX spec.

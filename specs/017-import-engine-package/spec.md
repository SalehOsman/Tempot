# Feature Specification: Import Engine (Bulk Data)

**Feature Branch**: `017-import-engine-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the functional import-engine package for bulk data processing and validation as per Architecture Spec v11 Blueprint."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Bulk Excel Import (Priority: P1)

As a system administrator, I want to upload an Excel file containing hundreds of records so that I can batch-insert data instead of adding items one by one.

**Why this priority**: Essential for data migration and administrative efficiency.

**Independent Test**: Uploading a test Excel file and verifying the records are processed and added to the database.

**Acceptance Scenarios**:

1. **Given** a valid Excel file and a Zod schema, **When** I upload it, **Then** the engine validates each row and adds them to the database in batches.
2. **Given** a successful import, **When** finished, **Then** the user receives a summary report (total rows, success count, error count).

---

### User Story 2 - Validation & Error Reporting (Priority: P1)

As a user, I want to know exactly which rows failed in my import so that I can fix the errors and re-upload only the corrected data.

**Why this priority**: Crucial for usability in bulk data operations (Section 19.3).

**Independent Test**: Uploading a file with several invalid rows and verifying the system generates an "Error Report" file with specific error messages per row.

**Acceptance Scenarios**:

1. **Given** an Excel file with invalid data, **When** processed, **Then** the engine isolates failing rows and records the validation errors.
2. **Given** failed rows, **When** the process is complete, **Then** the system uses `document-engine` to generate an Excel file containing only the failing rows and their error descriptions.

---

## Edge Cases

- **Memory Overflow**: Importing a file with 100k rows (Answer: Process file in chunks/streams; never load the entire file into memory).
- **Duplicate Data**: Handling records that already exist in the DB (Answer: The module's `importBatchReady` listener must define the "Upsert" logic).
- **Partial Success**: The server crashes mid-import (Answer: Use BullMQ to track progress and allow resuming or clean restart).

## Clarifications

- **Technical Constraints**: `Zod` row validation. BullMQ batch processing.
- **Constitution Rules**: Rule XV (Event-Driven). Rule XXXII (Redis persistence for job status). Section 19.3.
- **Integration Points**: Uses `document-engine` for error reports and `storage-engine` for file retrieval.
- **Edge Cases**: Memory overflow prevented by chunked processing. Duplicates are handled by the destination module's upsert logic. Partial success allows resuming via BullMQ.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST process all imports asynchronously via the `shared` queue factory.
- **FR-002**: System MUST use `Zod` for row-level validation.
- **FR-003**: System MUST communicate via `event-bus` (e.g., `import.file.received`, `import.batch.ready`).
- **FR-004**: System MUST process records in configurable batches (e.g., 50 rows per batch).
- **FR-005**: System MUST generate a detailed Excel error report for all failing rows.
- **FR-006**: System MUST provide a template generation feature (`pnpm import:template {module}`).
- **FR-007**: System MUST support `CSV` and `XLSX` formats.

### Key Entities

- **ImportProcess**: processId, userId, moduleId, status, totalRows, processedRows, successCount, errorCount, errorFileUrl.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Import processing for 1,000 rows must complete in < 30 seconds (excluding AI/External API calls).
- **SC-002**: Error report generation must be 100% accurate, mapping the correct error to the correct row.
- **SC-003**: 100% of state changes must be recorded in the Audit Log.
- **SC-004**: System successfully handles 5+ concurrent large imports without memory exhaustion.

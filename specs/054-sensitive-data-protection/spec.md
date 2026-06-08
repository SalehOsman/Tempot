# Feature Specification: Sensitive Data Protection

**Feature Branch**: `codex/054-sensitive-data-protection`  
**Created**: 2026-06-07  
**Status**: Reversible implementation complete; operational and irreversible gates pending
**Input**: Project audit finding that protected user identity data is stored in plaintext, duplicated into audit records, and not comprehensively redacted from logs.

## Clarifications

### Session 2026-06-07

- Q: Which data is protected by the first remediation scope? -> A: Existing user identity and contact fields confirmed in the schema and any raw copies in audit, logs, or error telemetry.
- Q: Must protected fields remain searchable? -> A: Exact-match business lookups may remain available through non-reversible lookup tokens; plaintext and reversible indexes are prohibited.
- Q: How should historical audit records be handled? -> A: Preserve audit event metadata while irreversibly redacting protected values.
- Q: Where are cryptographic keys stored? -> A: Outside the database and repository, supplied by the deployment secret boundary with version identifiers for rotation.

## User Scenarios & Testing

### User Story 1 - New Protected Data Is Never Persisted in Plaintext (Priority: P1)

An operator can create or update a user while protected identity and contact
fields are stored only in approved protected representations.

**Why this priority**: Every new plaintext write increases breach scope and
violates the project encryption rule.

**Independent Test**: Create and update a user with known protected values,
inspect database rows, audit records, logs, and telemetry captures, and confirm
the known values do not appear.

**Acceptance Scenarios**:

1. **Given** a new user with email, national ID, mobile number, and birth-related data, **When** the user is persisted, **Then** protected values are not stored in plaintext.
2. **Given** an exact-match lookup required by an approved business flow, **When** the lookup executes, **Then** it finds the correct user without storing or querying plaintext.
3. **Given** a state-changing user operation, **When** its audit event is recorded, **Then** event metadata remains useful while protected before/after values are omitted or irreversibly masked.

---

### User Story 2 - Existing Protected Data Is Migrated Safely (Priority: P1)

An operator can migrate existing user and audit data with measurable progress,
verification, resumability, and rollback controls.

**Why this priority**: Protecting only future writes leaves existing exposure
unchanged.

**Independent Test**: Run the migration against a seeded production-like
database, interrupt it, resume it, verify every row, and exercise the rollback
procedure without losing recoverability.

**Acceptance Scenarios**:

1. **Given** legacy plaintext user rows, **When** the migration runs, **Then** every protected value is converted and verified before plaintext retirement.
2. **Given** legacy audit JSON containing protected values, **When** sanitation runs, **Then** audit metadata is retained and protected values are irreversibly redacted.
3. **Given** migration interruption, **When** the job resumes, **Then** already verified records are not corrupted or duplicated.
4. **Given** a verification mismatch, **When** the migration detects it, **Then** cutover stops and the operator receives a non-sensitive report.

---

### User Story 3 - Keys Can Rotate Without Data Loss (Priority: P1)

An operator can introduce a new active key version, continue reading older
records, re-protect them, and retire an old key only after verification.

**Why this priority**: Encryption without rotation creates a permanent
single-key operational risk.

**Independent Test**: Write records under one key version, activate another,
read both generations, rotate old records, and prove the retired key is no
longer required.

**Acceptance Scenarios**:

1. **Given** records protected under an older active key, **When** a new key becomes active, **Then** old records remain readable and new writes use only the new version.
2. **Given** a rotation job, **When** it completes and verifies all target records, **Then** the previous key can be marked for retirement.
3. **Given** an unknown or unavailable key version, **When** a protected value is read, **Then** the operation fails with a typed non-sensitive error.

---

### User Story 4 - Sensitive Values Stay Out of Observability Channels (Priority: P1)

A security reviewer can prove protected values are absent from application logs,
Sentry payloads, error details, audit JSON, and administrative diagnostics.

**Why this priority**: Encryption at rest does not reduce exposure if the same
values are emitted into other systems.

**Independent Test**: Inject known canary values through success and failure
paths and scan captured observability outputs for exact and nested variants.

**Acceptance Scenarios**:

1. **Given** a protected value in a nested object, **When** it reaches the logger, **Then** the value is removed or replaced by an approved marker.
2. **Given** an exception containing protected request data, **When** Sentry processing runs, **Then** the protected fields are absent.
3. **Given** a migration or decryption error, **When** evidence is emitted, **Then** it identifies record/key metadata without exposing plaintext.

### Edge Cases

- Empty, null, malformed, or partially populated legacy fields.
- Duplicate plaintext values discovered before unique lookup-token creation.
- Key material is missing, malformed, duplicated, or uses an unknown version.
- Rotation is interrupted after some records are updated.
- A write occurs while backfill or key rotation is running.
- Audit JSON contains protected values under unexpected nested field names.
- A protected value appears inside an error message rather than a structured field.
- Backup/restore occurs between migration phases.
- Exact-match normalization differs between old and new writes.
- A record cannot be decrypted during verification.

## Requirements

### Functional Requirements

- **FR-001**: The project MUST maintain an explicit data-classification inventory for protected user fields confirmed by the current schema.
- **FR-002**: New and updated protected fields MUST NOT be persisted in plaintext.
- **FR-003**: Protected values requiring exact-match lookup MUST use a non-reversible lookup representation separate from the protected payload.
- **FR-004**: Lookup normalization MUST be deterministic, documented, and tested for each searchable field.
- **FR-005**: Cryptographic key material MUST remain outside application data tables, source control, logs, and audit records.
- **FR-006**: Every protected payload MUST identify the key version needed for authorized recovery.
- **FR-007**: The system MUST support key activation, backward reads, re-protection, verification, and retirement.
- **FR-008**: Unknown, missing, or invalid key versions MUST produce typed non-sensitive failures.
- **FR-009**: User repositories MUST protect data before persistence and recover it only for authorized application use.
- **FR-010**: Audit records MUST use a field allowlist and MUST NOT contain raw protected before/after values.
- **FR-011**: Existing audit metadata MUST be retained while historical protected values are irreversibly redacted.
- **FR-012**: Logger and error-monitoring redaction MUST cover exact, nested, serialized, and error-detail representations of protected fields.
- **FR-013**: Migration MUST be resumable, idempotent, measurable, and stop cutover on verification failure.
- **FR-014**: Migration MUST define backup, restore, rollback, and irreversible-retirement checkpoints.
- **FR-015**: Migration and rotation reports MUST not include protected plaintext.
- **FR-016**: Protected-data writes MUST remain transactionally consistent with lookup representations.
- **FR-017**: The system MUST reject ambiguous duplicate lookup identities according to an operator-reviewed conflict process before enforcing uniqueness.
- **FR-018**: Existing business flows that are authorized to read protected values MUST continue to work after migration.
- **FR-019**: Unauthorized callers MUST NOT gain a bulk decryption or raw export path.
- **FR-020**: Tests MUST use canary protected values and prove their absence from database plaintext columns, audit JSON, logs, Sentry payloads, and error details.
- **FR-021**: Backup artifacts containing protected data MUST remain encrypted under the existing backup policy.
- **FR-022**: A security ADR and operational key-management runbook MUST be approved before production migration.

### Key Entities

- **Protected Field Classification**: Field sensitivity, lookup requirement, normalization, retention, and allowed exposure.
- **Protected Payload**: Encrypted value plus algorithm and key-version metadata.
- **Lookup Token**: Non-reversible deterministic representation for approved exact-match queries.
- **Key Version**: Identifier and lifecycle state for externally supplied cryptographic material.
- **Migration Record**: Non-sensitive progress and verification state for one migration unit.
- **Audit Field Policy**: Allowlist and masking rule for audit before/after data.
- **Redaction Policy**: Exact and nested observability-field protections.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Canary scans find zero protected plaintext values in new database writes, audit records, logs, Sentry payloads, and error evidence.
- **SC-002**: 100% of legacy protected user fields are migrated and independently verified before plaintext columns are retired.
- **SC-003**: 100% of historical audit records selected by the migration are scanned, with all detected protected values redacted or a blocking exception reported.
- **SC-004**: Migration can be interrupted and resumed twice in a seeded test without corruption, duplication, or unverified cutover.
- **SC-005**: Exact-match lookups return the same authorized records before and after migration for all covered searchable fields.
- **SC-006**: A two-version rotation exercise completes with old and new records readable during transition and the old key removable after verification.
- **SC-007**: Zero Critical or High findings remain in the independent security review.
- **SC-008**: Full relevant tests, migration rehearsal, backup/restore rehearsal, lint, build, audit, and reconciliation gates pass.

## Assumptions

- The current user schema is the authoritative first-scope inventory.
- Exact-match lookup is needed for selected identity/contact fields; substring
  search on protected values is out of scope.
- Existing audit event metadata remains valuable and will be preserved.
- Deployment secrets can supply versioned key material without storing it in
  the repository or database.
- No jurisdiction-specific retention period is introduced by this feature.

## Out of Scope

- Password hashing changes.
- Searchable substring encryption.
- New analytics based on raw identity data.
- End-user bulk export of decrypted fields.
- A hosted cloud KMS dependency unless separately approved.
- Redefining legal retention periods.

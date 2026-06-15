# Feature Specification: Data Integrity Hardening

**Feature Branch**: `codex/055-data-integrity-hardening`
**Created**: 2026-06-07
**Status**: Foundation implemented; completion pending Spec 054 integration and remaining stories
**Input**: Project audit findings covering partial multi-field updates, caller-overridable soft-delete filters, direct Prisma access outside repositories, and full-record reads used for pagination counts.

## Clarifications

### Session 2026-06-07

- Q: Are administrative deleted-record recovery flows removed? -> A: No; they require a separate explicit privileged repository contract.
- Q: Must all data fixes be one commit? -> A: No; each invariant is implemented and reviewed as a separate concern under one data-integrity program.
- Q: May services coordinate multiple repository writes without one transaction? -> A: Only when partial completion is an explicit documented business outcome; the affected identity update is atomic.

## User Scenarios & Testing

### User Story 1 - Identity Updates Are Atomic (Priority: P1)

A user or administrator updates national-ID-derived profile data and observes
either a complete valid update or no update.

**Why this priority**: Current concurrent repository calls can leave national
ID, gender, birth date, and governorate inconsistent.

**Independent Test**: Inject a failure at each persistence step and confirm all
affected fields retain their original values.

**Acceptance Scenarios**:

1. **Given** valid derived identity fields, **When** the update succeeds, **Then** all fields and audit metadata commit together.
2. **Given** any write failure, **When** the transaction ends, **Then** none of the related fields change.
3. **Given** concurrent updates to the same user, **When** conflicts occur, **Then** the result is deterministic and no mixed identity state is persisted.

---

### User Story 2 - Deleted Data Is Excluded by Default (Priority: P1)

A normal repository caller cannot retrieve soft-deleted records by supplying a
conflicting filter.

**Why this priority**: Current object merge order permits caller criteria to
override the global deletion policy.

**Independent Test**: Create active and deleted rows, query every normal read
method with `isDeleted: true`, and confirm deleted rows remain unavailable.

**Acceptance Scenarios**:

1. **Given** a deleted record, **When** a normal caller supplies any filter, **Then** the record is not returned.
2. **Given** a privileged recovery workflow, **When** it uses the explicit recovery repository, **Then** deleted data is available only after authorization and audit checks.
3. **Given** a repository type exposed to business code, **When** filters are compiled, **Then** callers cannot express the protected deletion field.

---

### User Story 3 - All Application Data Access Uses Repositories (Priority: P1)

A maintainer can trace each application database operation through an explicit,
typed repository contract rather than direct Prisma calls in startup,
orchestration, services, or handlers.

**Why this priority**: Repository bypasses fragment policy, testing, audit, and
authorization behavior.

**Independent Test**: Run a static boundary check and targeted tests that fail
when prohibited layers import or invoke Prisma directly.

**Acceptance Scenarios**:

1. **Given** audit-history and interaction-event reads, **When** the application requests them, **Then** explicit read repositories execute the queries.
2. **Given** bootstrap session persistence, **When** startup initializes data, **Then** a typed repository owns the write.
3. **Given** a new direct Prisma call in a prohibited layer, **When** CI runs, **Then** the boundary gate fails with the file and policy.

---

### User Story 4 - Pagination Uses Database Aggregates (Priority: P2)

A user can request paginated user or template data without the application
loading every matching row to calculate a total.

**Why this priority**: The current pattern grows linearly in network transfer
and memory.

**Independent Test**: Seed a large dataset, request one page, and prove the
repository issues a page query plus an aggregate count rather than a full-list
query.

**Acceptance Scenarios**:

1. **Given** a filtered paginated query, **When** totals are requested, **Then** total count matches the same filter through a database aggregate.
2. **Given** no matching rows, **When** a page is requested, **Then** count is zero and no full dataset is loaded.
3. **Given** concurrent writes, **When** page and count execute, **Then** documented consistency semantics apply.

### Edge Cases

- One derived identity value is unchanged while others change.
- Parser output is valid but persistence validation fails.
- Two transactions update the same user concurrently.
- A caller includes nested boolean filters around deletion state.
- A model does not implement soft delete.
- Recovery access is attempted by a non-privileged role.
- Count and page filters drift.
- Requested page is beyond the final page.
- Repository transaction fails after audit preparation.
- A static boundary exception is needed for database boot/connect operations.

## Requirements

### Functional Requirements

- **FR-001**: National-ID-derived profile updates MUST persist as one atomic transaction.
- **FR-002**: Transaction failure at any step MUST leave all affected identity fields unchanged.
- **FR-003**: Audit metadata for the atomic update MUST describe one logical operation and commit consistently with the state change.
- **FR-004**: Normal repository read methods MUST enforce `isDeleted = false` after all caller-supplied criteria.
- **FR-005**: Public normal-read filter types MUST NOT expose a caller-controlled soft-delete override.
- **FR-006**: Deleted-record recovery MUST use a separate explicit repository contract with authorization and audit requirements.
- **FR-007**: Soft-delete policy MUST have one authoritative implementation reused by affected repositories.
- **FR-008**: Tests MUST cover normal, nested, conflicting, and privileged recovery deletion queries.
- **FR-009**: Services, handlers, and application orchestration MUST NOT access Prisma directly.
- **FR-010**: Database connection, generation, migration, and low-level infrastructure boot exceptions MUST be explicitly documented and statically distinguishable.
- **FR-011**: Audit-history, interaction-event, and bootstrap-session access MUST use typed repository interfaces.
- **FR-012**: New repository interfaces MUST preserve strict types and `Result<T, AppError>` for fallible public operations.
- **FR-013**: CI MUST detect prohibited direct Prisma access in governed layers.
- **FR-014**: Paginated totals MUST use database aggregate count operations with the same filter semantics as page retrieval.
- **FR-015**: Pagination MUST NOT load all matching entities solely to calculate total count.
- **FR-016**: Page and count behavior, including concurrency semantics, MUST be documented and tested.
- **FR-017**: Unsafe `as never` casts used to bridge data-access contract mismatches MUST be removed through typed adapters or interfaces.
- **FR-018**: Each invariant correction MUST be implemented, tested, reviewed, and committed as a scoped concern.
- **FR-019**: Changes to shared database infrastructure MUST include documented blast-radius analysis for all affected packages and modules.

### Key Entities

- **Atomic Identity Update**: One logical update command and transaction for related user identity fields.
- **Soft-Delete Scope**: Enforced normal-read policy excluding deleted records.
- **Recovery Repository**: Privileged explicit access path for deleted records.
- **Application Read Repository**: Typed query contract for audit, interaction, or bootstrap data.
- **Page Query**: Filter, ordering, cursor/offset, limit, results, and aggregate total.
- **Boundary Rule**: Static rule defining where direct Prisma access is allowed.

## Success Criteria

- **SC-001**: Failure injection at every identity persistence step produces zero partial field updates.
- **SC-002**: 100% of normal repository read tests exclude deleted rows even when conflicting caller criteria are attempted.
- **SC-003**: 100% of deleted-record recovery tests require the explicit privileged contract.
- **SC-004**: Static analysis reports zero prohibited direct Prisma calls in services, handlers, and application orchestration.
- **SC-005**: All audited pagination methods use aggregate count and issue no full-list count query.
- **SC-006**: Page totals match page filters across empty, filtered, and boundary-page cases.
- **SC-007**: Zero Critical/High data-integrity findings remain after review.
- **SC-008**: Database, affected module, bot-server, integration, lint, build, boundary, and reconciliation gates pass.

## Assumptions

- Prisma remains the relational ORM.
- Existing repository patterns are retained and corrected rather than replaced.
- Infrastructure boot may connect/disconnect Prisma directly in explicitly
  permitted low-level code.
- Current pagination semantics remain offset-based unless a separate feature
  changes them.

## Out of Scope

- Database engine replacement.
- General event-sourcing adoption.
- Redesign of every repository unrelated to confirmed findings.
- User-visible deleted-record restoration features.
- Cursor pagination migration.

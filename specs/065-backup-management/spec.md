# Feature Specification: Backup Management

**Feature Branch**: `065-backup-management`  
**Created**: 2026-07-26  
**Status**: Draft  
**Input**: User request to create a professional independent backup module that covers the complete database, current and future storage files, attachments, restore rehearsal, operator evidence, notifications, and package-first reuse instead of rebuilding existing package capabilities locally.

## Existing Source Requirements

This feature consolidates existing Tempot backup and recovery requirements. It
does not invent a new operational policy from scratch.

| Source | Existing Requirement | Spec Impact |
| --- | --- | --- |
| `.specify/memory/constitution.md` Rule XXXI | Backup files are encrypted before upload. | Backup artifacts that include protected or sensitive data must never be stored as plaintext. |
| `.specify/memory/constitution.md` Rule LVII | Backup failure triggers immediate `SUPER_ADMIN` alert and all state changes are audited. | Backup and restore workflows must publish safe notifications and audit every state-changing operation. |
| `docs/architecture/tempot_architecture.md` Section 18 | Target backup rehearsal, restore evidence, and rollback or forward-fix evidence are production gates. | The feature must produce release evidence, not just raw backup files. |
| `docs/operations/DISASTER-RECOVERY.md` | PostgreSQL and storage-file backups have RTO/RPO, retention, destinations, encryption, and verification expectations. | The module must cover database data and managed files, including future attachments. |
| `docs/operations/sensitive-data-migration.md` | Backup rehearsal must include checksum recording, isolated restore, protected-data checks, and evidence approval. | Restore rehearsal must be isolated and evidence-oriented before production readiness can be claimed. |
| `docs/operations/protected-data-key-management.md` | Database backups contain encrypted envelopes, never key material; key-ring backups are separate. | The feature must not store or display encryption keys and must respect protected-data recovery boundaries. |
| `docs/operations/production-cutover-plan.md` | Production cutover requires backup storage location, restore target, final backup, and approved recovery plan. | Backup records must expose safe metadata usable for cutover decisions. |
| `docs/operations/RISK-REGISTRY.md` RISK-019 | Backup corruption is a high-impact risk mitigated by checksum verification, multiple destinations, and operator alerting. | Integrity checks and failure classification are first-class requirements. |
| `specs/018-settings-package` and `@tempot/settings` | `backup_schedule` exists as a dynamic setting. | Scheduling must reuse the settings package instead of adding a local schedule store. |
| `packages/module-registry` | `backup-engine` is registered behind `TEMPOT_BACKUP`. | The reusable execution capability belongs in a package named `@tempot/backup-engine`. |

## Scope Boundary

This feature has two deliverables:

1. `@tempot/backup-engine`: reusable infrastructure for backup execution,
   restore rehearsal, manifest generation, integrity verification, retention,
   failure classification, and package-level contracts.
2. `modules/backup-management`: Telegram/admin operator surface for requesting
   backups, reviewing history, confirming high-risk actions, viewing evidence,
   and delegating execution to the package.

The first release supports restore rehearsal into an isolated target. A later
operator-approved extension adds controlled live restore from the same module,
but only after a successful isolated rehearsal, a fresh pre-restore backup, and
two explicit operator confirmations.

The same operator-approved extension adds database factory reset for local or
staging recovery drills. Factory reset deletes all users and operational data,
reapplies migrations, and relies on `SUPER_ADMIN_IDS` bootstrap after the bot
container restarts.

## User Scenarios & Testing

### User Story 1 - Create A Complete Backup (Priority: P1)

A super admin can request a complete backup that includes all persistent project data and all current or future managed file artifacts, then receive a clear result showing whether the backup is valid and usable.

**Why this priority**: Production readiness remains blocked until backup evidence exists for the target environment. A partial backup that excludes files, attachments, protected data, or metadata does not satisfy the recovery requirement.

**Independent Test**: Can be tested by creating a database record and a stored file, requesting a complete backup, and verifying the backup record confirms both data and file coverage with a valid integrity result.

**Acceptance Scenarios**:

1. **Given** a super admin and a configured backup destination, **When** the super admin requests a complete backup, **Then** the system creates a backup record that covers database data, schema state, storage metadata, and managed file artifacts.
2. **Given** protected data exists in the system, **When** a backup is created, **Then** the produced artifact is not stored as plaintext and the operator view does not expose secrets or sensitive values.
3. **Given** the backup process completes, **When** the result is displayed, **Then** the super admin sees status, started time, completed time, backup type, size summary, integrity state, and next available actions.
4. **Given** the backup destination is unavailable, **When** the backup is requested, **Then** the system fails closed, records the failure, and notifies the operator with a human-readable reason that does not expose secrets.

---

### User Story 2 - Review Backup History And Evidence (Priority: P1)

A super admin can review recent backup runs, inspect safe metadata, and identify which backup is suitable for a restore rehearsal or production recovery decision.

**Why this priority**: Backup files are not enough; operators need evidence, integrity status, and an audit trail before trusting a recovery path.

**Independent Test**: Can be tested by creating successful and failed backup records, opening the backup management area, and verifying the list and detail screens expose safe operational metadata.

**Acceptance Scenarios**:

1. **Given** multiple backup runs exist, **When** the super admin opens backup history, **Then** the system shows a bounded, paginated list with status, type, created time, integrity result, and storage state.
2. **Given** a backup has failed, **When** the super admin opens its detail view, **Then** the system shows the failure category, safe remediation hint, and whether a retry is available.
3. **Given** a backup includes file artifacts, **When** the detail view is shown, **Then** the system reports file coverage and missing-file count without exposing direct storage secrets.
4. **Given** an operator needs release evidence, **When** the backup detail is opened, **Then** the system provides an evidence summary suitable for documenting the production readiness gate.

---

### User Story 3 - Run Restore Rehearsal Safely (Priority: P1)

A super admin can run a restore rehearsal into an isolated target to prove that a selected backup is recoverable without overwriting the live environment.

**Why this priority**: The project analysis and roadmap require restore evidence. A backup is not trustworthy until restore has been rehearsed successfully.

**Independent Test**: Can be tested by selecting a completed backup, running a restore rehearsal against an isolated target, and confirming data and file integrity checks pass.

**Acceptance Scenarios**:

1. **Given** a completed backup with valid integrity metadata, **When** the super admin starts a restore rehearsal, **Then** the system requires explicit confirmation before any restore action begins.
2. **Given** restore rehearsal is confirmed, **When** the rehearsal runs, **Then** the live environment remains unchanged and the restore result is recorded separately.
3. **Given** restore rehearsal completes, **When** the result is displayed, **Then** the system shows whether data integrity, schema compatibility, protected-data readability, and file coverage checks passed.
4. **Given** restore rehearsal fails, **When** the result is displayed, **Then** the system records the failure category and blocks the backup from being marked production-ready.

---

### User Story 4 - Manage Retention And Operational Safety (Priority: P2)

A super admin can configure backup retention and review safety controls so old artifacts do not accumulate indefinitely and high-risk operations remain controlled.

**Why this priority**: Backups contain sensitive operational data. Retention, deletion, and high-risk restore controls must be deliberate and auditable.

**Independent Test**: Can be tested by applying a retention policy to old successful and failed backup records, then verifying eligible artifacts are marked for removal while protected evidence remains visible.

**Acceptance Scenarios**:

1. **Given** retention is configured, **When** old backups exceed the policy, **Then** the system identifies eligible artifacts for removal without deleting the most recent usable backup.
2. **Given** a backup artifact is removed by retention, **When** an operator opens history, **Then** the audit record remains visible with the deletion status and safe metadata.
3. **Given** a destructive operation is requested, **When** confirmation is required, **Then** the confirmation text clearly states the target, consequence, and expiration window.

---

### User Story 5 - Notify Operators And Audit Every State Change (Priority: P2)

Super admins receive notifications for backup and restore outcomes, and every state-changing operation is auditable.

**Why this priority**: Backup failure is operationally critical. Silent failures or unaudited restore attempts create unacceptable production risk.

**Independent Test**: Can be tested by forcing successful and failed backup or restore rehearsal outcomes and verifying notifications, event records, and audit records are created.

**Acceptance Scenarios**:

1. **Given** a backup succeeds, **When** the operation completes, **Then** authorized operators receive a success notification with safe summary metadata.
2. **Given** a backup or restore rehearsal fails, **When** the operation fails, **Then** authorized operators receive a failure notification with a safe remediation hint.
3. **Given** any backup, restore rehearsal, retention, or configuration action changes state, **When** the action finishes, **Then** the system records actor, target, action, status, timestamp, and safe before/after metadata.

### Edge Cases

- Backup destination is not configured.
- Backup destination becomes unavailable during upload.
- Database is reachable but storage provider is unavailable.
- Storage metadata exists for a file whose binary artifact is missing.
- Protected data cannot be read with the configured key version during rehearsal.
- Backup integrity checksum does not match the stored artifact.
- Restore target is accidentally configured as the live environment.
- Live restore is requested before a selected backup has a successful isolated
  rehearsal.
- Pre-restore backup fails before live restore starts.
- Factory reset is requested before a fresh pre-reset backup can be created.
- Factory reset completes and the bot is not restarted, so super-admin bootstrap
  has not run yet.
- Retention would remove the only usable backup.
- Operator presses a stale confirmation button after expiration.
- Notification delivery fails after the backup operation itself succeeds.
- Two backup requests are submitted while one backup is already running.
- A non-super-admin attempts to create, delete, or rehearse a backup.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a dedicated backup management capability for authorized operators.
- **FR-002**: The system MUST restrict backup creation, restore rehearsal, retention execution, and backup deletion to super admins unless a future approved permission explicitly delegates an operation.
- **FR-003**: The system MUST support complete backups that cover persistent database data, schema state, storage metadata, and managed file artifacts.
- **FR-004**: The system MUST support database-only and files-only backup scopes for operational diagnostics.
- **FR-005**: The system MUST create a manifest for each backup that identifies scope, status, timestamps, artifact coverage, integrity metadata, source environment classification, and safe version metadata.
- **FR-006**: The system MUST verify backup artifact integrity before marking a backup as usable.
- **FR-007**: The system MUST ensure backup artifacts containing protected or sensitive data are not stored as plaintext.
- **FR-008**: The system MUST not expose raw secrets, database credentials, encryption keys, tokens, or sensitive field values in bot messages, evidence summaries, audit records, or notifications.
- **FR-009**: The system MUST record every backup, restore rehearsal, retention, deletion, and configuration state change in an audit-capable record.
- **FR-010**: The system MUST publish lifecycle events for backup and restore state changes so other operational services can react without direct module coupling.
- **FR-011**: The system MUST notify authorized operators when backup or restore rehearsal operations succeed, fail, or require attention.
- **FR-012**: The system MUST provide a bounded backup history with safe operational metadata and clear empty states.
- **FR-013**: The system MUST provide a backup detail view with status, scope, integrity, storage state, file coverage, and restore rehearsal eligibility.
- **FR-014**: The system MUST support restore rehearsal into an isolated target before any backup can be treated as production-ready evidence.
- **FR-015**: The system MUST prevent accidental restore rehearsal against the live environment.
- **FR-016**: The system MUST require explicit confirmation for high-risk operations, including restore rehearsal, backup deletion, and retention execution.
- **FR-017**: The system MUST reject expired or stale confirmation callbacks without executing the underlying operation.
- **FR-018**: The system MUST block concurrent backup jobs when the configured policy allows only one active backup at a time.
- **FR-019**: The system MUST preserve audit history even when a backup artifact is deleted by retention.
- **FR-020**: The system MUST prevent retention from deleting the most recent usable complete backup.
- **FR-021**: The system MUST produce operator-readable evidence summaries for production readiness documentation.
- **FR-022**: The system MUST treat notification delivery failure as a separately recorded warning when the underlying backup operation succeeded.
- **FR-023**: The system MUST use existing approved project capabilities for reusable infrastructure needs unless a documented exception is approved.
- **FR-024**: The system MUST keep operator-facing text localized through the project translation system.
- **FR-025**: The system MUST keep backup execution separate from Telegram handlers so user interface code only orchestrates operator intent and displays safe results.
- **FR-026**: The system MUST reuse `@tempot/settings` for backup schedule configuration.
- **FR-027**: The system MUST use `@tempot/storage-engine` or an approved storage package extension for backup artifact persistence.
- **FR-028**: The system MUST use `@tempot/notifier` or an event-backed notifier adapter for operator notifications.
- **FR-029**: The system MUST keep database backup metadata behind repository contracts and must not access Prisma directly from Telegram handlers or package services.
- **FR-030**: The system MUST expose package-level backup and restore contracts that return `Result<T, AppError>` for fallible public operations.
- **FR-031**: The system MUST document exact recovery evidence required before closing the production readiness gate.
- **FR-032**: The system MUST allow controlled live restore only after a successful isolated restore rehearsal for the selected backup.
- **FR-033**: The system MUST create a fresh complete backup before live restore mutates the live database or configured live files.
- **FR-034**: The system MUST require two explicit confirmations before live restore execution.
- **FR-035**: The system MUST allow super admins to reset the database to a clean migrated state after a fresh backup and two explicit confirmations.
- **FR-036**: The system MUST delete all users during factory reset and rely on `SUPER_ADMIN_IDS` bootstrap after restart.

### Key Entities

- **Backup Job**: A requested backup operation with scope, actor, status, timing, progress, and failure category.
- **Backup Artifact**: A stored encrypted backup output or grouped set of outputs with size, storage state, integrity metadata, and retention status.
- **Backup Manifest**: A safe metadata record describing what the backup contains, which environment it came from, and how integrity can be verified.
- **Restore Rehearsal**: A non-production restore attempt against an isolated target with data, schema, protected-data, and file coverage results.
- **Production Restore Result**: A controlled live restore execution record that references the selected backup, confirming actor, timing, status, and pre-restore backup.
- **Database Factory Reset Result**: A destructive reset execution record that references the confirming actor, timing, status, and pre-reset backup.
- **Retention Policy**: Operator-approved rules that define how long backup artifacts are retained and which artifacts must be protected from deletion.
- **Backup Evidence Summary**: A safe reportable summary of backup and restore readiness without secrets or sensitive data.
- **Operator Notification**: A safe success, warning, or failure message sent to authorized operators.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A super admin can request a complete backup from the bot in no more than 4 interactions after opening backup management.
- **SC-002**: 100% of completed usable backups have a manifest and integrity result.
- **SC-003**: 100% of backup and restore rehearsal state changes create auditable records with actor, target, action, status, and timestamp.
- **SC-004**: Restore rehearsal never mutates the live environment in acceptance testing.
- **SC-005**: 100% of operator-facing backup messages avoid raw secrets, credentials, tokens, encryption keys, and sensitive field values.
- **SC-006**: The system blocks non-super-admin backup creation, restore rehearsal, deletion, and retention execution attempts.
- **SC-007**: Backup history and detail views remain usable when there are zero backups, failed backups, missing artifacts, or disabled optional notification delivery.
- **SC-008**: At least one complete backup and one restore rehearsal can be documented as production readiness evidence before release approval.

## Assumptions

- Backup management is an operational module, not a replacement for database or storage packages.
- The first safe restore capability is restore rehearsal into an isolated target; direct production overwrite restore is outside the first release.
- Backup artifacts may include protected data, so encryption and safe metadata are mandatory.
- Existing package capabilities for storage, notifications, events, authorization, logging, database access, and UX should be reused or composed by default.
- Future attachments and managed files must be included through the same storage ownership boundary rather than custom file discovery in Telegram handlers.
- Dashboard support is outside the first Telegram-focused release but the records should remain dashboard-ready.
- Existing documentation commands such as `pnpm backup:restore` and `pnpm backup:verify` describe intended operator capability; this feature must either implement them or replace those references with the approved command names during documentation sync.

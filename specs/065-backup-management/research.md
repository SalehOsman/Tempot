# Research: Backup Management

## Decision: Package Plus Module Split

`@tempot/backup-engine` will own reusable backup and restore-rehearsal
capability. `modules/backup-management` will own Telegram/admin UX.

**Rationale**: Existing governance already identifies packages as shared
capability owners, and `packages/module-registry` already lists `backup-engine`
behind `TEMPOT_BACKUP`. A module-only implementation would duplicate
infrastructure behavior and violate the package-first standard.

**Alternatives considered**:

- Module-only backup implementation: rejected because execution, retention,
  manifest generation, and restore rehearsal are reusable infrastructure.
- External scripts only: rejected because operators need bot-visible status,
  audit, notifications, and release evidence.

## Decision: Isolated Restore Rehearsal First

The first release will support restore rehearsal into an isolated target, not
direct overwrite restore into production.

**Rationale**: Existing production cutover and sensitive-data migration docs
require restore proof before production decisions. Direct production restore is
high risk and needs a separate safety model.

**Alternatives considered**:

- Production overwrite restore: rejected for first release due to data-loss
  risk and insufficient current governance.
- Backup only without restore: rejected because a backup without restore
  evidence does not close the production gate.

## Decision: Encrypted Artifact Boundary

Backup artifacts containing protected or sensitive data must be encrypted before
upload. Backup metadata may store safe identifiers, checksums, sizes, status,
and non-secret key version identifiers, but never keys or plaintext secrets.

**Rationale**: Constitution Rule XXXI and protected-data key management require
encrypted backup artifacts and separate key-ring protection.

**Alternatives considered**:

- Store raw database dumps locally before upload: rejected except as temporary
  process-private implementation detail that is immediately removed and never
  surfaced as an artifact.
- Include key material with database backup: rejected as an explicit security
  violation.

## Decision: Storage Through `@tempot/storage-engine`

Backup artifacts and future attachment snapshots will use storage-engine
provider contracts or an approved package extension.

**Rationale**: Storage provider ownership already belongs to storage-engine.
Backup management should not call S3, Drive, Telegram file APIs, or filesystem
providers directly.

**Alternatives considered**:

- Local filesystem-only backup directory: rejected as insufficient for
  production recovery and provider abstraction.
- Direct S3 or Drive SDK use from backup-management: rejected by the
  package-first standard.

## Decision: Notifications Through `@tempot/notifier`

Backup success, warning, and failure notifications must use notifier contracts
or event-backed notifier integration.

**Rationale**: The notifier package owns delivery retries, queue production,
Telegram adapter behavior, and delivery failure semantics.

**Alternatives considered**:

- Direct Telegram `sendMessage` from backup-management: rejected because this
  bypasses notifier reliability and duplicates a known shortcut.

## Decision: Existing `backup_schedule` Is Reused

Backup scheduling will use the existing `backup_schedule` dynamic setting.

**Rationale**: Spec #018 and `@tempot/settings` already define this setting.
Creating a local backup schedule store would create configuration drift.

**Alternatives considered**:

- Local cron configuration in backup-management: rejected because settings are
  package-owned.

## Decision: Queue Factory For Long-Running Jobs

Backup and restore-rehearsal execution will use the shared queue factory when
asynchronous execution is needed.

**Rationale**: Constitution Rule XX prohibits direct BullMQ setup, and ADR-019
explicitly lists backup-engine among packages expected to use queue factory.

**Alternatives considered**:

- Run full backup inline from Telegram callback: rejected because it blocks bot
  responsiveness and creates timeout risk.
- Direct BullMQ queue construction: rejected by Rule XX.

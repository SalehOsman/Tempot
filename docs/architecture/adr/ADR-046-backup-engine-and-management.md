# ADR-046: Backup Engine And Backup Management Split

## Status

Accepted

## Context

Tempot already requires encrypted backups, restore rehearsal, backup
verification, backup failure alerts, and production readiness evidence. These
requirements are documented in the constitution, disaster-recovery runbook,
protected-data key-management guide, production cutover plan, sensitive-data
migration plan, and risk registry.

The repository also registers a `backup-engine` capability behind
`TEMPOT_BACKUP`, but no `@tempot/backup-engine` package or
`backup-management` module currently exists.

Backup and restore behavior crosses several reusable platform boundaries:
database metadata, storage artifacts, protected-data recovery, notification
delivery, audit, queues, settings, and operator UX.

## Decision

Implement backup capability as two coordinated components:

1. `@tempot/backup-engine` owns reusable backup infrastructure:
   backup execution, isolated restore rehearsal, manifest generation, checksum
   verification, retention, failure classification, queue orchestration, and
   package-level contracts.
2. `modules/backup-management` owns operator-facing Telegram/admin workflows:
   menu navigation, super-admin authorization, confirmations, history/detail
   views, evidence summaries, and localized messages.

The module must compose existing packages instead of rebuilding their behavior:

- `@tempot/storage-engine` for artifact storage;
- `@tempot/notifier` for operator notifications;
- `@tempot/event-bus` for lifecycle events;
- `@tempot/settings` for `backup_schedule`;
- `@tempot/database` for repository-backed metadata;
- `@tempot/ux-helpers` and `@tempot/input-engine` for Telegram UX.

The first release supports restore rehearsal into an isolated target. Direct
production overwrite restore is not included.

## Consequences

- Backup execution remains reusable outside Telegram surfaces.
- Operator UX remains thin and testable.
- Existing backup requirements become implementable through Spec #065.
- Future attachments and storage providers can be included through
  storage-engine boundaries.
- Production restore overwrite requires a separate specification and approval.

## Alternatives Rejected

### Module-Only Backup Implementation

Rejected because it would place reusable infrastructure inside a Telegram module
and duplicate storage, notification, queue, and evidence behavior.

### Script-Only Backup Commands

Rejected because existing production gates require operator-visible status,
notifications, audit records, and release evidence, not only local scripts.

### Direct Production Restore In First Release

Rejected because it has high data-loss risk and requires a separate rollback,
approval, and safety model.

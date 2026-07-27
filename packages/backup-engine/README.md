# @tempot/backup-engine

Reusable backup, restore-rehearsal, controlled live-restore, and database
factory-reset infrastructure for Tempot.

## Purpose

`@tempot/backup-engine` owns backup workflow contracts that must stay outside
Telegram modules:

- backup job creation and status transitions;
- safe manifest generation;
- artifact integrity classification;
- restore rehearsal target safety;
- live restore execution gated by a successful rehearsal and pre-restore backup;
- database factory reset that clears the live schema and reapplies migrations;
- retention preview and latest usable complete backup protection.

The package is designed for composition with storage, notifier, settings,
database repositories, event bus, and queue factory ports.

## Current Scope

The current implementation executes encrypted local backup artifacts, isolated
restore rehearsals, controlled live restore, post-restore migration deployment,
and database factory reset through injected command runner and storage ports.

## Public API

```typescript
import {
  BackupEngineService,
  BackupManifestService,
  DatabaseFactoryResetService,
  ProductionRestoreExecutionService,
  BackupRetentionService,
  RestoreRehearsalService,
} from '@tempot/backup-engine';
```

All fallible public operations return `Result<T, AppError>` or
`AsyncResult<T, AppError>`.

## Dependencies

- `@tempot/shared`
- `neverthrow`

## Validation

```bash
pnpm --filter @tempot/backup-engine test
pnpm --filter @tempot/backup-engine build
```

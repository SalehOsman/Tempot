# Data Model: Backup Management

## BackupJob

Represents a requested backup operation.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Stable backup job identifier. |
| `scope` | enum | Yes | `complete`, `database`, or `files`. |
| `status` | enum | Yes | `pending`, `running`, `succeeded`, `failed`, `warning`, `cancelled`. |
| `requestedBy` | string | Yes | Actor user identifier. |
| `startedAt` | datetime | No | Set when execution begins. |
| `completedAt` | datetime | No | Set when terminal. |
| `sourceEnvironment` | string | Yes | Safe environment classification, not credentials. |
| `failureCategory` | enum | No | Safe failure group for operator guidance. |
| `safeFailureMessage` | string | No | Human-readable, non-secret reason. |

## BackupArtifact

Represents one stored backup output or an artifact in a grouped backup.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Stable artifact identifier. |
| `backupJobId` | string | Yes | Parent job. |
| `artifactType` | enum | Yes | `database_dump`, `storage_snapshot`, `manifest`, `evidence`. |
| `storageState` | enum | Yes | `pending`, `stored`, `missing`, `deleted`, `failed`. |
| `storageReference` | string | No | Safe opaque storage reference. |
| `sizeBytes` | number | No | Stored size when known. |
| `checksum` | string | No | Integrity checksum. |
| `encryptionState` | enum | Yes | `encrypted`, `not_required`, `failed`. |
| `retentionUntil` | datetime | No | Artifact retention deadline. |

## BackupManifest

Safe metadata that describes a backup without exposing secrets.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `backupJobId` | string | Yes | Parent job. |
| `schemaVersion` | string | Yes | Manifest schema version. |
| `databaseIncluded` | boolean | Yes | Whether database data is included. |
| `filesIncluded` | boolean | Yes | Whether managed files are included. |
| `protectedDataIncluded` | boolean | Yes | Whether protected data envelopes are included. |
| `keyVersionReferences` | string[] | No | Non-secret key version identifiers only. |
| `migrationState` | string | No | Safe migration version summary. |
| `fileCoverage` | object | No | Counts for expected, included, and missing files. |
| `integrityStatus` | enum | Yes | `pending`, `passed`, `failed`. |

## RestoreRehearsal

Represents an isolated restore proof for a selected backup.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Stable rehearsal identifier. |
| `backupJobId` | string | Yes | Backup being rehearsed. |
| `status` | enum | Yes | `pending`, `running`, `passed`, `failed`, `blocked`. |
| `targetClassification` | string | Yes | Must identify isolated target, not production. |
| `confirmedBy` | string | Yes | Actor who confirmed rehearsal. |
| `startedAt` | datetime | No | Start time. |
| `completedAt` | datetime | No | Completion time. |
| `schemaCheck` | enum | Yes | `pending`, `passed`, `failed`. |
| `dataCheck` | enum | Yes | `pending`, `passed`, `failed`. |
| `protectedDataCheck` | enum | Yes | `pending`, `passed`, `failed`. |
| `fileCoverageCheck` | enum | Yes | `pending`, `passed`, `failed`. |
| `safeFailureMessage` | string | No | Non-secret failure reason. |

## ProductionRestoreResult

Represents a controlled live restore execution after a successful rehearsal.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Stable live restore execution identifier. |
| `backupJobId` | string | Yes | Backup restored into the live environment. |
| `confirmedBy` | string | Yes | Actor who passed final confirmation. |
| `preRestoreBackupJobId` | string | Yes | Fresh backup created before live mutation. |
| `status` | enum | Yes | `succeeded` for completed live restore result. |
| `requestedAt` | datetime | Yes | Start timestamp. |
| `completedAt` | datetime | Yes | Completion timestamp. |

## DatabaseFactoryResetResult

Represents a destructive database reset to a clean migrated state.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Stable reset execution identifier. |
| `confirmedBy` | string | Yes | Actor who passed final confirmation. |
| `preResetBackupJobId` | string | Yes | Fresh backup created before reset. |
| `status` | enum | Yes | `succeeded` for completed reset result. |
| `requestedAt` | datetime | Yes | Start timestamp. |
| `completedAt` | datetime | Yes | Completion timestamp. |

## RetentionPolicy

Operator-approved retention behavior.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Policy identifier. |
| `scope` | enum | Yes | `complete`, `database`, `files`, or `all`. |
| `retentionDays` | number | Yes | Must be positive. |
| `protectLatestComplete` | boolean | Yes | Must default to true. |
| `enabled` | boolean | Yes | Whether policy is active. |

## BackupEvidenceSummary

Release-ready safe evidence summary.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `backupJobId` | string | Yes | Backup reference. |
| `restoreRehearsalId` | string | No | Rehearsal reference when available. |
| `integrityPassed` | boolean | Yes | Backup artifact verification result. |
| `restorePassed` | boolean | Yes | Restore rehearsal result. |
| `createdAt` | datetime | Yes | Evidence creation time. |
| `safeSummary` | string | Yes | Human-readable summary with no secrets. |

## State Transitions

```text
BackupJob: pending -> running -> succeeded | failed | warning | cancelled
BackupArtifact: pending -> stored | missing | failed -> deleted
RestoreRehearsal: pending -> running -> passed | failed | blocked
ProductionRestoreResult: requested -> succeeded | failed
DatabaseFactoryResetResult: requested -> succeeded | failed
BackupManifest: pending -> passed | failed
```

Retention must never delete the most recent usable complete backup.

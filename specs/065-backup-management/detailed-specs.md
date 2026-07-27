# Detailed Specification: Backup Management

## Security Model

- Backup artifacts containing protected or sensitive data are encrypted before
  upload.
- Database backups contain encrypted protected-data envelopes and non-secret key
  version identifiers only.
- Key-ring backup and database backup remain separate protected systems.
- Operator messages, audit records, evidence summaries, logs, and notifications
  must not contain plaintext sensitive values, database credentials, tokens, or
  key material.
- Restore rehearsal must fail closed when a readable approved key version is not
  available.

## Restore Target Safety

- The first release only supports restore rehearsal into an isolated target.
- The restore target must be classified as non-production before execution.
- A rehearsal must be blocked if the target cannot be proven distinct from the
  live database or live storage destination.
- Production overwrite restore is out of scope for this feature.

## Integrity Verification

Each usable backup must have:

- manifest schema version;
- backup scope;
- artifact list;
- checksum for each stored artifact;
- encryption state;
- migration/schema state summary;
- storage file coverage summary when files are included;
- integrity status.

A backup without a passed integrity result cannot be marked as usable production
evidence.

## Notification Rules

- Backup failure triggers an immediate authorized-operator notification.
- Backup success may notify configured operators with safe metadata.
- Restore rehearsal failure triggers an immediate authorized-operator
  notification.
- Notification delivery failure after a successful backup is recorded as a
  warning and must not rewrite the backup result to failure.

## Audit Rules

Audit-capable records are required for:

- backup request;
- backup execution result;
- restore rehearsal request;
- restore rehearsal result;
- retention execution;
- artifact deletion;
- backup configuration change;
- denied authorization attempt.

Audit metadata must include actor, role, module, target, action, status,
timestamp, and safe before/after values.

## UX Rules

- Empty backup history shows an explicit empty state and a return action.
- High-risk actions require explicit confirmation and expire after five minutes.
- Confirm and cancel actions appear in the same row when the row width allows.
- Button labels must respect the project Telegram keyboard UX limits.
- The module must use i18n keys for all operator-facing text.

## Operational Evidence

A production-ready evidence summary requires:

1. successful complete backup;
2. passed artifact integrity verification;
3. isolated restore rehearsal;
4. schema compatibility check;
5. protected-data readability check;
6. file coverage check when files are included;
7. safe backup identifier and checksum summary;
8. approval timestamp and actor.

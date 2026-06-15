# Sensitive Data Protection Rehearsal Evidence

**Spec**: #054 Sensitive Data Protection
**Date**: 2026-06-08, with review remediation repeated on 2026-06-09 and 2026-06-16
**Environment**: Isolated local PostgreSQL 16 + pgvector containers
**Scope**: Reversible engineering gates only

## Migration and Sanitation

The focused Testcontainers integration suite executed:

- bounded migration with two intentional interruptions;
- checkpoint-based resume without duplicate processing;
- dry-run normalization conflict reporting;
- structured historical audit sanitation;
- row reconciliation and logical recovery;
- email and national-ID lookup-token parity;
- cutover blocking after forced verification failure.

No protected plaintext or key material was written to the test report.

## Key Rotation

The two-version integration rehearsal executed:

- activation of `enc-v2` and `lookup-v2`;
- bounded re-protection with interruption and resume;
- lookup-token rotation;
- verification of zero remaining references to `enc-v1`;
- successful protected read after removing the old keys from the test provider.

The rehearsal proves implementation readiness. Production key removal remains
an operator action subject to the key-management runbook.

## Backup and Restore

Two explicitly named temporary containers were created:

```text
tempot-054-backup-source
tempot-054-backup-restore
```

The source database received the current Prisma schema and one protected user
row. The row contained an AES-256-GCM envelope and HMAC lookup token while its
legacy email column remained `NULL`.

The initial rehearsal then:

1. created a PostgreSQL custom-format backup with `pg_dump`;
2. copied the backup outside the source container;
3. calculated SHA-256
   `BFFE361AFEAF81F238CD5F7D1AD917971A6815FD8D15672D97285A551815178A`;
4. restored the backup with `pg_restore` into the isolated restore database;
5. verified one restored row;
6. verified zero plaintext canary matches in the restored row;
7. recovered the logical email using the readable test key version;
8. verified exact lookup-token parity;
9. removed both temporary containers and the temporary backup file.

The independent review correctly identified that PostgreSQL custom format is
not encryption. On 2026-06-09, the rehearsal was repeated with an explicit
AES-256-GCM artifact-encryption boundary:

1. `pg_dump` created the temporary custom-format dump;
2. the dump was encrypted into a separate authenticated artifact;
3. the unencrypted dump was deleted before restore;
4. the encrypted artifact was decrypted only into the isolated restore
   workflow;
5. `pg_restore` restored the current schema and protected row;
6. the restored database returned one expected row and zero plaintext canary
   matches;
7. logical recovery and exact lookup-token parity passed;
8. the encrypted artifact SHA-256 was
   `EEBBE70F977611699D6B395524E852456FB8124CDFCEFC2017EC288787D21C38`;
9. both containers, decrypted temporary dump, and encrypted test artifact were
   removed.

This proves the local engineering procedure. It does not replace a rehearsal
through the target deployment backup system or approve production cutover.

## Result

| Gate                          | Result |
| ----------------------------- | ------ |
| Migration interruption/resume | Pass   |
| Audit sanitation              | Pass   |
| Dry-run conflict report       | Pass   |
| Canary absence                | Pass   |
| Two-version key rotation      | Pass   |
| Encrypted backup checksum     | Pass   |
| Isolated restore              | Pass   |
| Logical protected read        | Pass   |
| Lookup parity                 | Pass   |
| Temporary resource cleanup    | Pass   |

## Performance

The review found that a single 60-sample p95 assertion was vulnerable to
container and scheduler spikes under the full integration workload. The
benchmark now uses:

- equivalent protected-column writes for the control path, with cryptography
  precomputed outside the timed operation;
- 20 warm-up operations;
- 7 trials of 80 interleaved samples;
- alternating execution order;
- the median of trial p95 ratios;
- the unchanged maximum regression threshold of 20 percent.

The focused benchmark and the full integration suite pass with this method.

## Artifact Analysis

The post-implementation SpecKit analysis reported:

- 31 functional and success requirements;
- 46 implementation and release tasks;
- 100 percent requirement-to-task coverage;
- zero unmapped requirements;
- zero Critical, High, or Medium artifact inconsistencies;
- zero constitution conflicts.

The first independent review found eight High-priority issues. Remediation on
2026-06-09 added:

- exact multi-key lookup without broad decryption;
- lookup metadata clearing and retirement-reference verification;
- optimistic concurrency for backfill;
- protected/plaintext duplicate detection;
- explicit audit allowlisting and recursive logger redaction;
- startup failure for malformed protected-key settings;
- typed migration and rotation database failures;
- a stable merge-gate performance benchmark.

The Technical Advisor follow-up on 2026-06-16 found and corrected additional
release-blocking edge cases:

- canonical national-ID comparison after protected lookup;
- canonical national-ID token generation during lookup-key rotation;
- regeneration and retirement blocking for incomplete lookup metadata;
- explicit typed rejection of stale concurrent backfill writes;
- non-protected updates that do not require decryption capability;
- startup failure for every invalid static-settings result;
- audit allowlisting at the public logger boundary and accurate protected-field
  change detection.

The focused verification passed 47 unit tests, 14 migration/rotation/persistence
integration tests, and the seven-trial performance benchmark. The measured
median p95 regression was 3.89 percent against the approved 20 percent limit.

The Project Manager authorized execution of the irreversible work on
2026-06-16. Production application remains blocked until the exact retirement
migration is implemented and rehearsed after Spec #055 integration, the target
deployment backup system is restored successfully, and final review and release
gates pass.

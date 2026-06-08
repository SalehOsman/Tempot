# Sensitive Data Protection Rehearsal Evidence

**Spec**: #054 Sensitive Data Protection  
**Date**: 2026-06-08  
**Environment**: Isolated local PostgreSQL 16 + pgvector containers  
**Scope**: Reversible engineering gates only

## Migration and Sanitation

The focused Testcontainers integration suite executed:

- bounded migration with an intentional interruption;
- checkpoint-based resume without duplicate processing;
- dry-run normalization conflict reporting;
- structured historical audit sanitation;
- row reconciliation and logical recovery;
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

The rehearsal then:

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

## Result

| Gate                          | Result |
| ----------------------------- | ------ |
| Migration interruption/resume | Pass   |
| Audit sanitation              | Pass   |
| Dry-run conflict report       | Pass   |
| Canary absence                | Pass   |
| Two-version key rotation      | Pass   |
| Backup checksum               | Pass   |
| Isolated restore              | Pass   |
| Logical protected read        | Pass   |
| Lookup parity                 | Pass   |
| Temporary resource cleanup    | Pass   |

This evidence does not authorize plaintext-column retirement. T032 and T045
remain blocked pending the exact irreversible migration and separate Project
Manager approval.

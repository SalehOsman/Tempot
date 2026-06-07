# Quickstart: Sensitive Data Protection Verification

## Pre-Migration Requirements

1. Approve the encryption/key-management ADR.
2. Configure two test encryption key versions and two test lookup key versions.
3. Seed users and audit records with unique canary values.
4. Take and verify a test database backup.

## RED Checks

- Confirm canary values currently appear in legacy user columns.
- Confirm a state-changing repository operation can copy raw values into audit
  JSON.
- Confirm current logger redaction does not cover all protected fields.

## Migration Rehearsal

1. Apply expand migration.
2. Enable dual-write.
3. Backfill one bounded batch.
4. interrupt the migration.
5. Resume and finish.
6. Sanitize historical audit JSON.
7. Run logical and canary verification.
8. Cut reads over to protected payloads.
9. Rotate to the second key version.
10. Restore the pre-migration backup in an isolated database.

## Required Evidence

- Row and verification counts.
- Duplicate/conflict report without plaintext.
- Canary scan with zero matches outside approved in-memory assertions.
- Key rotation report.
- Backup restore report.
- Security review with zero Critical/High findings.

## Gates

```powershell
pnpm --filter @tempot/database test
pnpm --filter @tempot/user-management test
pnpm --filter @tempot/logger test
pnpm test:unit
pnpm test:integration
pnpm lint
pnpm build
pnpm audit --audit-level=high
pnpm spec:validate
```

# Quickstart: Sensitive Data Protection Verification

## Current State

The reversible implementation is complete on
`codex/054-sensitive-data-protection`. New protected writes, historical
backfill, audit sanitation, verification, and key rotation are covered by
focused tests. Plaintext retirement remains blocked.

## Pre-Migration Requirements

1. Approve the encryption/key-management ADR.
2. Configure two test encryption key versions and two test lookup key versions.
3. Seed users and audit records with unique canary values.
4. Take and verify a test database backup.

## Implemented Security Checks

- AES-256-GCM round-trip and tamper rejection.
- HMAC-SHA-256 normalization and exact lookup parity.
- Key-ring configuration rejection for missing, malformed, or reused material.
- New-write database, audit, Pino, Sentry, and error canary absence.
- Migration interruption/resume and cutover blocking.
- Two-version re-protection and old-key retirement readiness.
- Exact national-ID lookup through a versioned HMAC token.
- Protected repository update p95 within 20 percent of the equivalent legacy
  repository update, summarized with the geometric mean of interleaved trial
  ratios.

## Migration Rehearsal

1. Apply expand migration.
2. Activate protected writes.
3. Backfill one bounded batch.
4. interrupt the migration.
5. Resume and finish.
6. Sanitize historical audit JSON.
7. Run logical and canary verification.
8. Cut reads over to protected payloads.
9. Rotate to the second key version.
10. Restore the pre-migration backup in an isolated database using the
    deployment backup tool.

## Required Evidence

- Row and verification counts.
- Duplicate/conflict report without plaintext.
- Canary scan with zero matches outside approved in-memory assertions.
- Key rotation report.
- Backup restore report.
- Security review with zero Critical/High findings.

The backup/restore evidence and explicit plaintext-retirement approval are
operational gates, not unit-test substitutes.

## Gates

```powershell
pnpm --filter @tempot/database test
pnpm --filter @tempot/user-management test
pnpm --filter @tempot/logger test
pnpm --filter @tempot/database exec vitest run tests/integration/sensitive-data-migration.test.ts
pnpm --filter @tempot/database exec vitest run tests/integration/sensitive-data-rotation.test.ts
pnpm --filter @tempot/user-management exec vitest run tests/integration/protected-performance.test.ts
pnpm test:unit
pnpm test:integration
pnpm lint
pnpm build
pnpm audit --audit-level=high
pnpm spec:validate
```

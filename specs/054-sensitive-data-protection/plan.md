# Implementation Plan: Sensitive Data Protection

**Branch**: `codex/054-sensitive-data-protection` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/054-sensitive-data-protection/spec.md`

## Summary

Introduce versioned application-level protection for confirmed sensitive user
fields, non-reversible exact-match lookup tokens, minimized audit snapshots,
comprehensive logging/Sentry redaction, and a resumable verified migration for
legacy user and audit data. Use Node.js cryptography behind a project-owned
interface, keep key material in deployment secrets, and execute migration
through expand, protected-write activation, backfill, verify, cutover, and
retirement phases.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: Node.js `crypto`, Prisma 7.x, neverthrow 8.2.0, Pino 9.x, existing Sentry package, Zod settings validation
**Storage**: PostgreSQL 16 user and audit tables; deployment secret boundary for key material
**Testing**: Vitest 4.1.0, Testcontainers, migration fixtures, canary scans, backup/restore rehearsal
**Target Platform**: Node.js 22.12+ Linux container
**Project Type**: TypeScript monorepo with shared database, logger, settings, and user-management components
**Performance Goals**: Exact-match lookup remains index-backed; protected user-profile update p95 does not regress by more than 20 percent against the equivalent legacy repository update in an interleaved, warmed PostgreSQL Testcontainers benchmark
**Constraints**: AES-256 application-level protection; no plaintext fallback; no key material in DB/source/logs; no `any` or suppression directives
**Scale/Scope**: All existing user rows and historical audit JSON in the target deployment

## Constitution Check

- **Rule VII / Fix at source**: Protect fields at the repository/application persistence boundary and minimize audit generation.
- **Rule XIV / Repository pattern**: No service or handler performs raw cryptographic persistence.
- **Rule XVIII / External abstraction**: Key material access is behind a replaceable key-provider interface.
- **Rule XXI / Result pattern**: Protect/unprotect/key operations return typed results.
- **Rule XXXI / Encryption**: AES-256 application-level protection is mandatory.
- **Rules XXXIV-XXXVI / Testing**: TDD, integration migration tests, and coverage thresholds apply.
- **Rules LV/LVII / Observability and audit**: PII is removed while traceability remains.
- **Rule XLVII / Detailed specs**: Advanced security requires `detailed-specs.md`.
- **Rule XLIV / ADR**: The encryption, lookup-token, and key-rotation decision requires an ADR before implementation.
- **Rule LIV / Blast radius**: Database/logger/settings changes require dependent-consumer analysis.
- **Rule L / Documentation parity**: Security docs, deployment docs, schema docs, SpecKit artifacts, roadmap, and changesets must align.

Initial gate result: PASS, conditional on ADR approval before implementation.

## Project Structure

### Documentation

```text
specs/054-sensitive-data-protection/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- detailed-specs.md
|-- quickstart.md
|-- contracts/
|   `-- protected-data-contract.md
|-- checklists/
|   `-- security.md
`-- tasks.md
```

### Expected Source Scope

```text
packages/database/prisma/
packages/database/src/
packages/logger/src/
packages/sentry/src/
packages/settings/src/
modules/user-management/repositories/
modules/user-management/services/
scripts/
docs/security/
docs/operations/
docs/architecture/adr/
```

**Structure Decision**: A database-package protection service owns field
protection primitives and key-provider contracts. User repositories own field
classification and mapping. Audit and observability packages consume shared
redaction policies without receiving decryption capability.

## Migration Strategy

1. **Inventory**: confirm protected fields, duplicates, nulls, and audit exposure.
2. **Expand**: add protected payload, lookup-token, and key-version storage without removing legacy columns.
3. **Protected-write activation**: write protected representations transactionally and store `NULL` in legacy plaintext columns for new or updated protected values; unchanged legacy rows remain readable only for controlled migration.
4. **Backfill**: migrate deterministic batches with resumable checkpoints.
5. **Sanitize audit**: replace protected historical JSON values with irreversible markers.
6. **Verify**: compare authorized logical values, lookup parity, row counts, canary absence, and backup restore.
7. **Cut over**: read only protected representations; disable plaintext writes.
8. **Retire**: remove plaintext columns only after an approved irreversible checkpoint.
9. **Rotate**: exercise a second key version before production sign-off.

## TDD Strategy

- RED tests for plaintext persistence, lookup parity, audit leakage, logger/Sentry leakage, resume behavior, and key rotation.
- GREEN implementation in the smallest owning component.
- REFACTOR only after canary and migration tests pass.

## Verification Strategy

- Focused database, user-management, logger, Sentry, and settings tests.
- Testcontainers migration and rollback rehearsal.
- Database and filesystem canary scan.
- Backup/restore rehearsal.
- Interleaved legacy-versus-protected repository update benchmark with a
  maximum 20 percent p95 regression.
- `pnpm audit --audit-level=high`
- `pnpm lint`
- `pnpm build`
- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm spec:validate`

## Post-Design Constitution Check

The plan satisfies the encryption, repository, Result, audit, observability,
ADR, detailed-specification, TDD, and blast-radius rules. No production
migration can start until the ADR, backup, key runbook, and dry-run evidence are
approved.

Post-design gate result: PASS with explicit pre-migration approvals.

## Complexity Tracking

No constitution exception is requested. The multi-phase migration is required
to prevent data loss and unsafe irreversible cutover.

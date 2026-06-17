# Migration Compatibility Decision Template

Use this template before approving any production release that changes database
schema, protected-data format, queue payloads, session shape, or runtime
configuration contracts.

## Release

- **Spec or change:** `<spec-id-or-change>`
- **Release candidate digest:** `<image-digest>`
- **Git commit:** `<sha>`
- **Decision date:** `<yyyy-mm-dd>`
- **Owner:** `<name>`

## Compatibility Classification

- [ ] No migration or state compatibility impact.
- [ ] Additive and backward-compatible migration.
- [ ] Expand-and-contract migration with a documented compatibility window.
- [ ] Breaking migration requiring maintenance window and explicit approval.
- [ ] Protected-data migration requiring backup, restore, and key-rotation
  evidence.

## Required Evidence

- [ ] Migration files reviewed.
- [ ] `prisma migrate status` captured before migration.
- [ ] Backup created from target-like data.
- [ ] Backup restore rehearsal passed.
- [ ] Migration applied in staging.
- [ ] Post-migration smoke tests passed.
- [ ] Rollback or forward-fix procedure rehearsed.
- [ ] Data validation query results attached.
- [ ] Operator approval recorded.

## Rollback or Forward-Fix Decision

- **Preferred recovery path:** `<rollback | forward-fix>`
- **Reason:** `<short rationale>`
- **Maximum acceptable recovery time:** `<duration>`
- **Known irreversible step:** `<none-or-description>`
- **Compensating control:** `<control>`

## Go/No-Go

- **Decision:** `<go | no-go>`
- **Approver:** `<name>`
- **Blocking risks:** `<none-or-list>`
- **Follow-up tasks:** `<none-or-list>`

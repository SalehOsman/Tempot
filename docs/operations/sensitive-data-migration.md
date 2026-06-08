# Sensitive Data Migration Runbook

**Spec**: #054 Sensitive Data Protection  
**ADR**: ADR-044  
**Status**: Approved for reversible implementation on 2026-06-08

## Safety Rules

- Production migration is blocked until ADR-044, field classification, this
  runbook, and the key-management runbook are approved.
- Every database step runs against an explicit operator-selected connection.
- Expand, backfill, cutover, and retirement are separate deployments.
- No destructive retirement occurs in the same release as protected-column
  expansion.
- Any verification failure blocks cutover.
- Plaintext retirement requires a separate explicit approval after restore and
  rotation rehearsals.

## Phase 0: Inventory and Conflict Review

1. Confirm the target environment and deployment SHA.
2. Run the read-only inventory:

   ```powershell
   $env:DATABASE_URL = '<operator-supplied-connection>'
   corepack pnpm security:inventory
   ```

3. Review table presence, null counts, duplicate groups, normalization
   conflicts, and audit exposure counts.
4. Reconcile `UserProfile` and the legacy `user_management_profile` table if
   both exist.
5. Resolve duplicate identities through an operator-reviewed process before
   enabling unique lookup-token constraints.
6. Store only the non-sensitive JSON report as evidence.

## Phase 1: Backup and Restore Rehearsal

1. Create an encrypted database backup using the deployment backup system.
2. Record backup identifier, checksum, start/end time, and tool version.
3. Restore into an isolated PostgreSQL instance.
4. Run row-count and schema checks.
5. Inject readable test key versions through the secret boundary.
6. Run logical recovery and canary scans.
7. Destroy the isolated restore after evidence is approved.

Do not proceed when backup encryption, checksum verification, restore, or key
recovery fails.

## Phase 2: Expand

Apply an additive migration only:

- protected envelope columns,
- lookup-token columns,
- key and normalization version columns,
- non-sensitive migration checkpoint storage,
- non-unique token indexes needed for conflict review.

Legacy plaintext columns remain available during this phase. No plaintext
column or index is removed.

## Phase 3: Dual Write

Deploy repository logic that atomically writes:

- the protected envelope,
- the approved exact-match lookup token,
- key and normalization versions,
- temporary legacy plaintext only while migration mode is explicitly active.

New writes must pass database, audit, Pino, Sentry, and error canary tests.
Failure pauses the rollout.

## Phase 4: Bounded Backfill

The planned backfill command is implemented in task T027. It must support:

- dry-run mode,
- bounded batch size,
- a non-sensitive cursor,
- idempotent resume,
- processed, verified, and failed counts,
- a stop-on-mismatch option.

Run one canary batch, verify it, then increase batch size within the approved
database latency threshold. Do not log recovered values.

## Phase 5: Historical Audit Sanitation

The planned sanitation command is implemented in task T028.

For each selected audit record:

1. parse `before` and `after` as structured JSON,
2. match classified field names and approved aliases,
3. replace values with irreversible markers,
4. preserve actor, action, module, target, status, timestamp, and safe change
   metadata,
5. quarantine only the non-sensitive record ID when review is required.

Never export raw audit JSON for manual review.

## Phase 6: Verification

Cutover requires all checks to pass:

| Check                   | Pass condition                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------- |
| User row reconciliation | Target, processed, and verified counts match; failed count is zero                 |
| Logical recovery        | Authorized in-memory comparison succeeds for every migrated field                  |
| Lookup parity           | Approved exact lookups return the same logical record                              |
| Plaintext canary        | Zero canary occurrences in protected columns, audit JSON, logs, Sentry, and errors |
| Audit sanitation        | Every selected record is sanitized or blocks cutover                               |
| Resume                  | Two interrupted seeded runs resume without duplicate or corrupt work               |
| Restore                 | Isolated backup restore and protected reads pass                                   |
| Rotation                | Two-version rehearsal proves old-key retirement readiness                          |

## Phase 7: Protected-Read Cutover

1. Stop legacy plaintext writes.
2. Read only protected representations.
3. Keep legacy columns temporarily for rollback, with application access
   disabled.
4. Monitor typed key, integrity, lookup, and migration errors.
5. Roll back the application deployment if protected reads fail; do not resume
   plaintext writes automatically.

## Phase 8: Plaintext Retirement

This phase is irreversible and remains blocked until the Project Manager
approves the exact migration after reviewing Phase 6 evidence.

The retirement release may:

- drop plaintext indexes,
- null and then remove plaintext columns,
- enforce approved lookup-token uniqueness,
- remove dual-write and legacy-read code,
- mark migration checkpoints complete.

Take and verify a final encrypted backup immediately before the approved
retirement window.

## Rollback Matrix

| Failure point          | Allowed response                                                | Prohibited response                |
| ---------------------- | --------------------------------------------------------------- | ---------------------------------- |
| Inventory              | Correct data conflicts and rerun                                | Ignore duplicate groups            |
| Expand                 | Roll back additive schema if unused                             | Drop legacy columns                |
| Dual write             | Roll back application; preserve additive columns                | Continue partial protected writes  |
| Backfill               | Pause and resume from checkpoint                                | Restart without reconciling counts |
| Audit sanitation       | Restore isolated rehearsal data and fix sanitizer               | Export raw audit JSON              |
| Verification           | Block cutover                                                   | Override failed evidence           |
| Protected-read cutover | Roll back application to verified dual-read release             | Silent plaintext fallback          |
| Retirement             | Restore from the approved encrypted backup and incident process | Ad hoc reverse migration           |

## Approval Record

| Gate                           | Status                   | Approver        | Date       |
| ------------------------------ | ------------------------ | --------------- | ---------- |
| Inventory and conflict policy  | Approved                 | Project Manager | 2026-06-08 |
| Backup and restore rehearsal   | Approved                 | Project Manager | 2026-06-08 |
| Protected-read cutover         | Approved                 | Project Manager | 2026-06-08 |
| Plaintext retirement migration | Blocked pending evidence | Project Manager | Pending    |

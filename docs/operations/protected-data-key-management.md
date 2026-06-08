# Protected Data Key Management Runbook

**Spec**: #054 Sensitive Data Protection  
**ADR**: ADR-044  
**Status**: Approved by the Project Manager on 2026-06-08

## Purpose

Operate versioned encryption and lookup keys without storing key material in
source control, PostgreSQL, audit records, logs, diagnostics, or backups.

This runbook defines the implemented operational contract. Environment
variable parsing and startup validation are provided by
`@tempot/settings`.

## Roles

| Role                | Responsibility                                                     |
| ------------------- | ------------------------------------------------------------------ |
| Project Manager     | Approves activation and irreversible retirement checkpoints        |
| Deployment operator | Injects secrets, deploys versions, and records non-secret evidence |
| Security reviewer   | Reviews canary, rotation, and retirement evidence                  |
| Application         | Uses typed provider operations and never exposes raw key bytes     |

## Key Separation

Maintain independent 256-bit keys for:

- AES-256-GCM encryption,
- HMAC-SHA-256 exact lookup.

Do not derive one purpose from the other. Version identifiers are non-secret;
key bytes are secret.

## Secret Boundary

The initial self-hosted adapter will receive two versioned key rings from the
deployment secret system:

```text
PROTECTED_DATA_ACTIVE_ENCRYPTION_KEY_VERSION
PROTECTED_DATA_ENCRYPTION_KEYS
PROTECTED_DATA_ACTIVE_LOOKUP_KEY_VERSION
PROTECTED_DATA_LOOKUP_KEYS
```

The two `*_KEYS` values are secret JSON maps from version identifier to
base64-encoded 32-byte key material. They must be injected at runtime and must
never be populated in `.env.example`, CI logs, Docker image layers, database
tables, or generated diagnostic bundles. `.env.example` documents the variable
names with empty values only.

## Generate a Key

Run in an approved operator terminal:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64'))"
```

Immediately store the result in the approved secret system. Do not paste it
into tickets, chat, pull requests, or command transcripts.

Generate encryption and lookup keys separately.

## Startup Validation

The application must fail startup before accepting protected writes when:

- an active version is missing,
- a referenced version is duplicated or absent,
- decoded key material is not exactly 32 bytes,
- encryption and lookup keys are identical,
- a readable historical version is unavailable,
- JSON configuration is malformed.

Errors may include the non-secret purpose and version identifier. They must not
include key material or the raw secret payload.

## Activate the First Version

1. Generate independent encryption and lookup keys.
2. Store them under version `v1` in the deployment secret system.
3. Set both active version identifiers to `v1`.
4. Deploy to an isolated environment.
5. Confirm startup key-ring validation succeeds.
6. Run protected-write and canary tests.
7. Record only deployment SHA, version identifiers, timestamp, and gate result.
8. Do not enable production protected writes until the ADR, migration runbook,
   and restore evidence are approved.

## Rotate to a New Version

1. Generate independent encryption and lookup keys for `v2`.
2. Add `v2` while retaining `v1` as readable.
3. Activate `v2`; new writes must use only `v2`.
4. Confirm records protected by `v1` and `v2` are readable.
5. Run bounded re-protection and lookup-token rotation.
6. Reconcile target, processed, verified, and failed counts.
7. Confirm no record requires `v1`.
8. Mark `v1` retiring and repeat verification.
9. Obtain Project Manager and security-review approval.
10. Remove `v1` from the readable ring.
11. Restart and prove all protected reads and exact lookups still pass.

The automated two-version rehearsal is covered by
`scripts/security/sensitive-data-rotation.integration.test.ts`. Removing an old
key from the deployment secret system remains an operator action and is blocked
until the report proves zero references to that version.

## Compromise Procedure

1. Treat suspected key exposure as P0.
2. Stop protected writes if integrity cannot be established.
3. Preserve non-sensitive forensic evidence.
4. Introduce a new active version.
5. Re-protect all affected records and rotate lookup tokens.
6. Verify audit, logs, Sentry, backups, and CI output contain no key material.
7. Revoke the compromised version only after verified migration.
8. Document scope and corrective actions without including secrets.

## Backup and Recovery

- Database backups contain envelopes and key-version identifiers, never keys.
- Key-ring backup and database backup must use independent protected systems.
- A restore rehearsal must restore the database, inject the approved readable
  key ring, verify logical recovery, and run canary scans.
- Losing all readable key versions is unrecoverable data loss.

## Evidence Record

| Evidence   | Required fields                                                    |
| ---------- | ------------------------------------------------------------------ |
| Activation | Deployment SHA, active version IDs, timestamp, pass/fail           |
| Rotation   | Source and target version IDs, processed/verified/failed counts    |
| Retirement | Zero remaining references, restore result, approvals               |
| Incident   | Reference code, affected versions, containment and recovery status |

Never include protected plaintext or key bytes in evidence.

## Approval Record

| Item                                 | Status   | Approver        | Date       |
| ------------------------------------ | -------- | --------------- | ---------- |
| External key boundary                | Approved | Project Manager | 2026-06-08 |
| Initial version activation procedure | Approved | Project Manager | 2026-06-08 |
| Rotation and retirement procedure    | Approved | Project Manager | 2026-06-08 |
| Backup key recovery boundary         | Approved | Project Manager | 2026-06-08 |

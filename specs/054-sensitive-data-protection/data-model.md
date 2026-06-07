# Data Model: Sensitive Data Protection

## Protected Field Classification

| Attribute | Meaning |
|---|---|
| `fieldId` | Stable logical field name |
| `classification` | Restricted or confidential |
| `searchMode` | None or exact-match |
| `normalizationVersion` | Versioned canonicalization rule |
| `auditPolicy` | Omit, presence-only, or irreversible mask |
| `logPolicy` | Redact |
| `authorizedConsumers` | Approved application use cases |

Initial inventory includes current user email, national ID, mobile number, and
birth-related identity data confirmed by the Prisma schema. Final inventory is
validated before migration.

## Protected Payload

| Attribute | Meaning |
|---|---|
| `ciphertext` | Protected bytes encoded for storage |
| `nonce` | Unique random nonce |
| `authTag` | Integrity tag |
| `algorithm` | Versioned algorithm identifier |
| `keyVersion` | Key needed for recovery |
| `normalizationVersion` | Canonicalization version when relevant |

**Rules**:

- Nonce reuse with the same key is prohibited.
- Field identity and record context are authenticated metadata.
- Payload parsing failures return typed errors.

## Lookup Token

| Attribute | Meaning |
|---|---|
| `token` | Keyed non-reversible exact-match representation |
| `tokenKeyVersion` | Lookup-key version |
| `normalizationVersion` | Canonicalization version |
| `fieldId` | Domain separation identifier |

**Rules**:

- Tokens are field-separated.
- Tokens and payloads use different keys.
- Token generation and payload persistence occur in one transaction.

## Key Version

| Attribute | Meaning |
|---|---|
| `versionId` | Non-secret stable identifier |
| `state` | Active, readable, retiring, or retired |
| `purpose` | Encryption or lookup |
| `activatedAt` | Operational activation time |
| `retireAfterVerification` | Approval checkpoint |

The database may persist only non-secret version identifiers, never key
material.

## Migration Checkpoint

| Attribute | Meaning |
|---|---|
| `migrationId` | Stable migration execution |
| `phase` | Inventory, backfill, sanitize, verify, cutover, retire |
| `cursor` | Non-sensitive resume position |
| `processedCount` | Rows attempted |
| `verifiedCount` | Rows verified |
| `failureCount` | Rows blocked |
| `status` | Pending, running, paused, failed, complete |

**Rules**:

- Checkpoints contain no protected plaintext.
- Completion requires processed and verified counts to reconcile.
- Any failure blocks cutover.

## Audit Safe Change

| Attribute | Meaning |
|---|---|
| `fieldId` | Changed field |
| `changeKind` | Added, changed, cleared |
| `protected` | Always true for classified fields |
| `value` | Omitted or irreversible marker |

## State Transitions

```text
Legacy Plaintext
  -> Dual Written
  -> Backfilled
  -> Verified
  -> Protected Read Active
  -> Plaintext Retired

Key: Readable -> Active -> Retiring -> Retired
```

No transition to plaintext is permitted after protected-read cutover.

# ADR-044: Versioned Application-Level Sensitive Data Protection

## Status

Accepted

## Context

The current `UserProfile` schema stores email, national ID, mobile number, and
birth date in plaintext. It also indexes several of those plaintext fields.
`BaseRepository` copies whole entities into `AuditLog.before` and
`AuditLog.after`, Pino protects only a narrow secret-key list, and the Sentry
reporter sends `AppError.details` without a redaction boundary.

Spec #054 requires protection for new writes, safe exact lookup, historical
migration, audit sanitation, observability redaction, and key rotation. The
design must retain authorized profile behavior without exposing raw key
material to repositories, services, handlers, logs, audit records, or the
database.

## Decision

### Cryptographic Envelope

Use AES-256-GCM through Node.js `crypto`. Every protected value receives a
unique 96-bit random nonce. Authenticated additional data binds:

- payload format version,
- field identifier,
- stable record context,
- encryption key version.

The stored envelope contains the algorithm identifier, key version, nonce,
ciphertext, and authentication tag. It contains no key material.

### Exact Lookup

Use a separately keyed HMAC-SHA-256 token over a domain-separated,
field-specific normalized value. Encryption keys and lookup keys are distinct.
Lookup tokens are stored in separate indexed columns with their lookup-key and
normalization versions.

Email substring search is not preserved. Username substring search remains
available, while email access becomes an explicit exact-match lookup.

### Key Boundary and Lifecycle

Key material is supplied by the deployment secret boundary through a
project-owned provider interface. The provider exposes only typed protection,
recovery, lookup-token, validation, and re-protection operations. It does not
return raw key bytes to consumers.

Encryption and lookup key versions follow:

```text
Readable -> Active -> Retiring -> Retired
```

New writes use only the active versions. Older readable versions remain
available during verified rotation. Retirement is blocked while any protected
record requires the old version.

### Repository and Audit Boundaries

User repositories own mapping between logical profile values and protected
storage. Protected payloads and lookup tokens are written atomically.

Generic whole-entity audit snapshots are prohibited for classified entities.
Audit records use explicit safe-field policies. Protected fields retain only
field identity and `added`, `changed`, or `cleared` state. Historical audit JSON
is irreversibly sanitized while actor, action, module, target, status, and time
metadata remain available.

### Migration

Use expand and contract:

1. inventory and conflict review,
2. additive protected columns,
3. transactional dual write,
4. resumable bounded backfill,
5. historical audit sanitation,
6. logical and canary verification,
7. protected-read cutover,
8. separately approved plaintext retirement,
9. two-version rotation rehearsal.

No plaintext fallback is allowed after protected-read cutover. Any mismatch,
unknown key version, authentication failure, unresolved duplicate, or restore
failure blocks cutover and retirement.

## Consequences

- A database compromise does not directly expose first-wave plaintext fields
  when deployment secrets remain protected.
- Exact lookup remains index-backed without deterministic ciphertext.
- Substring email search is removed because it conflicts with the approved
  protection model.
- Key rotation and rollback require multiple readable versions and measurable
  migration checkpoints.
- Repositories gain protection mapping responsibilities but services and
  handlers remain isolated from cryptographic primitives.
- Historical audit sanitation is intentionally irreversible and therefore
  requires an explicit Project Manager checkpoint.
- Backups remain useful only when the external key ring is also recoverable
  through the independent secret-management process.

## Alternatives Rejected

- Database-native encryption: rejected because data and decryption capability
  would share the database boundary.
- Deterministic encryption for search: rejected because equality patterns leak
  through ciphertext.
- Plain hashes for lookup: rejected because low-entropy contact values are
  vulnerable to offline enumeration.
- Whole-audit encryption: rejected because it would require broad decryption
  for routine operational review.
- One destructive migration: rejected because it prevents safe verification
  and rollback.
- A mandatory hosted KMS: rejected because no hosted dependency has been
  approved; the provider interface preserves that future option.

## Approval

Approved by the Project Manager on 2026-06-08 with these constraints:

1. Protect `email`, `nationalId`, `mobileNumber`, and `birthDate`.
2. Use AES-256-GCM envelopes with separately keyed HMAC-SHA-256 lookup tokens.
3. Enable lookup tokens only for email and national ID. Mobile numbers remain
   encrypted without lookup until a separate E.164 normalization contract is
   approved.
4. Keep key material outside the repository and database through the
   deployment secret boundary.
5. Treat plaintext deletion as a separate irreversible approval after
   migration, restore, and rotation evidence is complete (`T032` and `T045`).
6. Limit protected-data p95 performance regression to 20 percent.

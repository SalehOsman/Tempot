# Research: Sensitive Data Protection

## Decision 1: AES-256-GCM for Protected Payloads

**Decision**: Use AES-256-GCM with a unique cryptographically random nonce for
each protected value and authenticated metadata binding field identity and key
version.

**Rationale**: The constitution requires AES-256. GCM provides confidentiality
and integrity and is supported by Node.js without a new dependency.

**Alternatives considered**:

- **AES-CBC**: Rejected because it requires a separate authentication design.
- **Database-native encryption**: Rejected because keys and plaintext handling
  would move into the data tier and weaken application-level policy.
- **Deterministic encryption for lookup**: Rejected because repeated plaintext
  would reveal equality patterns in the protected payload.

## Decision 2: Separate HMAC Lookup Tokens

**Decision**: Use a separately keyed HMAC-SHA-256 token over canonical field
values for exact-match lookup and uniqueness.

**Rationale**: Exact lookup remains indexable without storing plaintext or
making the encrypted payload deterministic. Separate keys limit cross-purpose
exposure.

**Alternatives considered**:

- **Plain hash**: Rejected because low-entropy phone/email domains are
  vulnerable to offline enumeration.
- **Decrypt every row**: Rejected because it is non-indexed and does not scale.
- **Prefix/substring search**: Rejected from this remediation scope.

## Decision 3: Versioned Key Ring Through a Provider Interface

**Decision**: Define a key-provider interface that returns an active encryption
key, lookup key, and readable historical key versions from deployment secrets.

**Rationale**: The initial self-hosted template can use environment-injected
secrets while preserving a future managed KMS adapter boundary.

**Alternatives considered**:

- **Store keys in PostgreSQL**: Rejected because data and keys would be
  compromised together.
- **Single unversioned environment key**: Rejected because rotation and safe
  rollback would be impossible.
- **Add a cloud KMS now**: Rejected because it introduces an unapproved hosted
  dependency and is not required for the current template.

## Decision 4: Expand-and-Contract Migration

**Decision**: Add protected columns, dual-write, backfill, verify, cut over, and
remove plaintext only after an explicit irreversible checkpoint.

**Rationale**: In-place destructive conversion makes rollback and verification
unsafe.

**Alternatives considered**:

- **One destructive migration**: Rejected due to data-loss and rollback risk.
- **Application downtime with direct rewrite**: Rejected because it still lacks
  safe verification and rotation proof.

## Decision 5: Audit Allowlist, Not Redaction-Only Snapshots

**Decision**: Audit records store approved metadata and safe changed-field
indicators rather than whole before/after entities. Historical JSON is scanned
and protected values are irreversibly replaced.

**Rationale**: Whole-entity snapshots continually duplicate sensitive data and
make future field additions unsafe by default.

**Alternatives considered**:

- **Expand logger redaction only**: Rejected because audit JSON is persistent
  database data.
- **Encrypt entire audit JSON**: Rejected because operators need safe metadata
  and broad decryption would recreate exposure.

## Decision 6: Canary-Based Leakage Tests

**Decision**: Use unique known values in tests and scan every storage and
observability sink for exact and serialized occurrences.

**Rationale**: Field-path tests alone miss nested objects, error strings, and
unexpected serialization.

**Alternatives considered**:

- **Configuration review only**: Rejected because configuration does not prove
  end-to-end absence.

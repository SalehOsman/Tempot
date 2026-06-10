# Detailed Security Specification: Sensitive Data Protection

## Cryptographic Envelope

Protected values use AES-256-GCM. Each value receives a unique 96-bit nonce
from the Node.js cryptographic random source. The authenticated additional data
binds at minimum:

- field identifier,
- record identifier or stable record context,
- payload format version,
- key version.

Stored payloads contain no key material.

## Key Provider

The provider exposes typed operations for:

- active encryption key version,
- readable encryption key by version,
- active lookup key version,
- readable lookup key by version,
- key-ring validation at startup.

The initial adapter reads deployment-injected secrets. The interface must allow
a future secret-manager or KMS adapter without changing repositories.

Key material requirements:

- exactly 256 bits after decoding,
- separate encryption and lookup keys,
- unique version identifiers,
- no logging or error serialization,
- startup validation before accepting protected writes.

## Lookup Normalization

Normalization is field-specific and versioned.

- Email: trim surrounding whitespace and apply the existing project-approved
  case normalization without inventing provider-specific transformations.
- Mobile number: normalize only through existing regional/phone rules approved
  by the project.
- National ID: validate and canonicalize through the existing national-ID
  parser.

The lookup token is HMAC-SHA-256 over a domain-separated message containing
field ID, normalization version, and canonical value.

## Repository Boundary

Repositories receive logical domain values and:

1. validate the value,
2. normalize when exact lookup is required,
3. create protected payload and lookup token,
4. persist both transactionally,
5. recover values only for authorized service responses.

Services and handlers do not receive raw keys or cryptographic primitives.

## Audit Policy

Audit generation uses an explicit allowlist. Classified fields record only:

- field name,
- added/changed/cleared state,
- optional approved irreversible display mask.

Whole user entities are prohibited in `before` and `after` audit JSON.

Historical sanitation traverses structured JSON, applies the classification
registry and known aliases, and reports unresolved suspicious values without
including their plaintext.

## Observability Policy

Pino and Sentry policies cover:

- direct field names,
- nested request/user objects,
- repository input objects,
- error causes and details,
- serialized JSON strings where project serializers can inspect structure.

Security tests use canary values and capture output from each sink.

## Migration Safety

- Batches are bounded and resumable.
- Every migrated row records only non-sensitive checkpoint metadata.
- Writes during backfill produce both protected payload and lookup token.
- Verification compares authorized logical values in memory without logging.
- Duplicate lookup tokens are resolved before unique constraints are enabled.
- Plaintext removal is a separate migration after approval.
- Backups are taken and restored in rehearsal before irreversible retirement.

## Failure Policy

- Missing key: fail startup for protected-write mode.
- Unknown historical key: return typed error and block record mutation.
- Authentication-tag failure: classify as integrity failure and alert without
  plaintext.
- Migration mismatch: pause migration and block cutover.
- Audit sanitation uncertainty: quarantine the record ID for review without
  exporting raw JSON.

## Security Review Gate

Before production migration:

1. ADR approved.
2. Threat model reviewed.
3. Canary tests pass.
4. Migration dry run passes.
5. Backup restore passes.
6. Key rotation rehearsal passes.
7. Zero Critical/High security findings remain.

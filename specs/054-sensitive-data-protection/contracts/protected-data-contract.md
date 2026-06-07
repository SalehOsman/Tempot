# Contract: Protected Data Boundary

## Protection Service

Fallible public operations return `Result<T, AppError>`.

Conceptual operations:

- protect a classified value,
- recover a protected payload for an authorized consumer,
- create an exact-match lookup token,
- validate the configured key ring,
- re-protect a payload under the active key.

The service MUST NOT expose raw key bytes to repositories, services, handlers,
logs, or diagnostics.

## Repository Contract

- Logical protected values enter through typed repository input.
- Protected payload and lookup token are persisted atomically.
- Exact lookup uses the lookup token.
- Returned protected values are recovered only for an authorized use case.
- Audit metadata follows the protected-field policy.

## Migration Contract

- Every phase is idempotent and resumable.
- Progress uses non-sensitive cursors and counts.
- Verification failures block cutover.
- Plaintext retirement is a separate approved phase.
- Dry-run mode performs inventory and verification without destructive writes.

## Observability Contract

- Protected canary values must not appear in captured logs, Sentry payloads,
  audit JSON, or error details.
- Redaction failures are release-blocking.
- Security telemetry identifies field category, record ID, key version, and
  error code only when those values are non-sensitive.

# Tempot Security Baseline

**Status**: Draft execution artifact for spec #026
**Purpose**: Define security expectations before SaaS and Managed Bots expansion.

## CI Security Gates

- `pnpm audit --audit-level=high` is blocking.
- High and critical vulnerabilities require remediation or a dated exception.
- `pnpm cms:check` blocks hardcoded user-facing text and locale drift.
- Future dependency review should run on PRs.
- Future secret scanning should run on PRs and pushes.

## Secret Handling

- Secrets live in environment variables or encrypted storage.
- Secrets are never logged.
- Doctor commands report only redacted status.
- Managed bot tokens require encryption before storage.
- Token access must be audited.

## Token Rotation Guidance

For every token-bearing integration:

1. Identify owner and scope.
2. Store encrypted value only.
3. Record creation and rotation timestamps.
4. Provide rotation procedure.
5. Revoke old token after successful replacement.
6. Audit all access.

## Managed Bot Token Requirements

Managed bot support must not ship until:

- Consent model is documented.
- `getManagedBotToken` access is isolated.
- Token storage is encrypted.
- Access is logged with actor, owner, bot, and reason.
- Abuse limits are defined.
- Rotation and disable flows exist.

## Dependency Review

Future dependency changes should document:

- Why the dependency is needed.
- Whether it is runtime or dev-only.
- License.
- Security posture.
- Maintenance status.
- Alternatives rejected.

## Security Exceptions

Exceptions must include:

- Date.
- Owner.
- Advisory or risk.
- Affected package.
- Expiration.
- Mitigation.
- Follow-up task.

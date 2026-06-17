# Production Delivery Threat Model

**Status:** Draft execution artifact for Spec 057
**Scope:** Startup, HTTP perimeter, runtime image, supply chain, deployment,
observability, backup, and recovery controls for the Tempot Core bot runtime.

## Assets

- Telegram bot token and webhook secret.
- Protected data key material and encrypted protected data.
- PostgreSQL data, migration history, and backups.
- Redis session, queue, cache, and rate-limit state.
- Runtime container image, SBOM, provenance, signature, and digest.
- CI/CD credentials, GHCR write permissions, and promotion approvals.
- Operational evidence for staging, backup/restore, alerts, and rollback.

## Trust Boundaries

- Public internet to Hono HTTP routes.
- Telegram webhook delivery to `/webhook`.
- Bot runtime to PostgreSQL, Redis, AI providers, storage providers, and Sentry.
- GitHub Actions to GHCR and future deployment targets.
- Staging evidence to production go/no-go approval.

## Threats and Required Controls

| Threat | Risk | Required control |
| --- | --- | --- |
| Public health endpoint leaks dependency state or version data | Attackers learn operational topology and failure modes | Public liveness returns minimal process status only; detailed readiness is restricted |
| Malformed or oversized HTTP bodies consume CPU or memory before validation | Availability loss | Body-size limit, schema validation, safe parse failures, and request rejection before bot processing |
| Missing secure headers or permissive CORS weakens future HTTP surfaces | Browser-facing risk grows silently | Default secure headers and explicit CORS allowlist policy |
| Redis outage disables rate limiting open | Abuse traffic reaches bot processing | Explicit Redis-outage rate-limit behavior: controlled denial or approved degraded fallback |
| Mandatory startup initializer is ignored | Runtime accepts traffic while partially initialized | Every mandatory initializer returns `Result<T, AppError>` and blocks readiness on failure |
| Optional provider degradation is reported as healthy | Operators miss partial outage | Readiness distinguishes healthy, degraded, unconfigured, and unhealthy states |
| Runtime image contains source, tests, specs, or excess package trees | Larger attack surface and accidental disclosure | Build-time runtime manifest and image-content assertions |
| Unsigned or mutable image is promoted | Unverified artifact reaches production | Immutable digest promotion, SBOM, provenance, signing, and scan gates |
| Moderate runtime advisory is accepted without review | Known exploitable dependency remains | Remediate or record dated non-exploitability approval |
| Breaking migration prevents rollback | Data loss or prolonged outage | Migration compatibility decision, backup evidence, staging rehearsal, and rollback or forward-fix plan |
| Alerts depend only on the failing bot path | Operators are blind during runtime failure | Independent alert fallback and tested metrics |

## Abuse Cases

1. An unauthenticated caller polls `/health` to identify database or Redis
   outages and time abuse attempts.
2. An attacker sends a large JSON body to `/webhook` with a valid-looking
   content type, forcing memory allocation before validation.
3. A dependency advisory in a runtime path remains unpatched because CI only
   blocks High severity.
4. A production deployment uses a rebuilt tag rather than the same staging
   digest, making staging evidence non-authoritative.
5. A migration changes protected data state without verified backup restore and
   leaves only image rollback available.

## Go/No-Go Security Questions

- Does public liveness reveal only minimal non-sensitive status?
- Is readiness restricted and does it accurately represent startup state?
- Are all runtime-reachable High and Moderate advisories remediated or approved
  with a dated exception?
- Does the promoted image have a verified SBOM, provenance, signature, scan
  result, and immutable digest?
- Was the same digest exercised in staging before production approval?
- Are backup restore, migration compatibility, alert fallback, and rollback or
  forward-fix evidence attached to the release record?

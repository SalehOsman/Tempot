# Contract: Production Release

## Startup Contract

- Mandatory stages succeed before readiness.
- Failed mandatory stage prevents traffic acceptance.
- Optional degradation is explicit.
- Shutdown follows the constitutional order.

## HTTP Contract

- Minimal public liveness.
- Restricted detailed readiness.
- Secure headers, body limits, HTTP rate limit, explicit CORS, stable errors.
- Timing-safe webhook secret validation.

## Artifact Contract

A promotable artifact has:

- immutable image digest,
- passing runtime dependency/image scan,
- SBOM,
- provenance,
- signature,
- validated runtime manifest,
- non-root smoke-test evidence.

## Promotion Contract

- The same digest moves from staging to production.
- Migration compatibility is approved.
- Smoke, health, and graceful-shutdown checks pass.
- Rollback or forward-fix path is rehearsed.
- Human approval is recorded.

## Operational Contract

- Required metrics are emitted.
- Thresholds are configured.
- Alerts have an independent fallback channel.
- Runbooks link each critical signal to operator action.

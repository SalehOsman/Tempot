# Production Cutover Plan

This plan is the provider-neutral release procedure for Tempot Core. It is not a
production approval by itself. A release is approved only when the matching
evidence record shows every required gate as passed for the target environment.

## Release Inputs

- Immutable image digest from the Docker workflow.
- Git commit associated with that digest.
- Staging and production environment identifiers.
- Staging and production database connection references.
- Redis connection references.
- Telegram bot token and webhook secret references.
- Protected-data key-ring references.
- Monitoring, alert, and incident-channel references.
- Backup storage location and restore target.
- Previous approved image digest for rollback.

Do not copy secret values into the release record. Record only secret reference
names and evidence locations.

## Pre-Cutover Gates

1. Confirm CI, Docker image build, Trivy scan, SBOM, provenance, Cosign signing,
   and Cosign verification passed for the immutable digest.
2. Deploy the same immutable digest to staging.
3. Run migration compatibility classification:
   - Backward-compatible migration: image rollback is allowed.
   - Forward-only or destructive migration: rollback requires restore or a
     documented forward-fix.
4. Run staging migrations.
5. Run staging smoke checks:
   - `GET /live` returns only `{ "status": "alive" }`.
   - `GET /health` returns only `{ "status": "alive" }`.
   - `GET /ready` without `x-tempot-readiness-token` returns `403`.
   - `GET /ready` with the trusted readiness token returns `healthy` or an
     explicitly approved `degraded` state.
   - Webhook requests require the configured Telegram secret token.
   - `SIGTERM` drains through graceful shutdown.
6. Prove backup and restore against a non-production restore target.
7. Rehearse rollback or forward-fix with the previous approved digest and the
   migration compatibility decision.
8. Confirm monitoring and alerts:
   - request/update latency;
   - error rate;
   - database latency or pool pressure;
   - Redis latency;
   - queue activity;
   - memory and event-loop health;
   - independent alert path outside Telegram.

## Cutover Steps

1. Announce deployment window and freeze unrelated changes.
2. Capture a final pre-cutover backup and record its reference.
3. Promote the immutable digest to production.
4. Run production migrations according to the compatibility decision.
5. Update or verify Telegram webhook configuration.
6. Run production post-deploy checks:
   - public liveness;
   - restricted readiness;
   - webhook smoke;
   - selected admin command smoke;
   - monitoring and alert signal visibility.
7. Keep rollback owner, database owner, and incident commander available until
   the post-release verification deadline expires.

## Rollback Or Forward-Fix Decision

- Use image rollback only when the migration compatibility record says the
  current schema remains compatible with the previous digest.
- Use restore only when the restore target has been rehearsed and the recovery
  point objective is accepted by the Product Manager.
- Use forward-fix when rollback would corrupt data, lose protected-data key
  compatibility, or violate the migration compatibility decision.

## Go/No-Go Decision

The default decision is **No-Go** until the release evidence record contains:

- zero Critical findings;
- no unapproved High runtime or security findings;
- staging deploy evidence for the immutable digest;
- backup/restore evidence;
- rollback or forward-fix rehearsal evidence;
- monitoring and independent alert evidence;
- Product Manager approval.

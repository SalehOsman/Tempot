# Quickstart: Production Delivery Verification

## Startup Failure Injection

Inject failures into i18n, database, Redis, module loading, and server startup.
For each case verify:

- readiness is false,
- webhook traffic is not accepted,
- one structured non-sensitive error is emitted,
- graceful shutdown completes.

## HTTP Adversarial Suite

- Public liveness contains minimal status only.
- Detailed readiness requires trusted access.
- Oversized body is rejected.
- Invalid content type/JSON/update/secret is rejected.
- Rate limit is enforced.
- Valid Telegram webhook remains functional.

## Image and Supply Chain

```powershell
docker build -f apps/bot-server/Dockerfile -t tempot-bot-server:audit .
docker inspect tempot-bot-server:audit
```

Verify runtime contents, non-root user, health, SBOM, scan, provenance, and
signature according to CI-generated evidence.

## Staging Rehearsal

1. Deploy immutable digest.
2. Apply classified migration.
3. Run smoke and readiness checks.
4. Process a synthetic Telegram update.
5. Exercise graceful shutdown.
6. Inject failure.
7. Execute image rollback or forward-fix according to compatibility record.
8. Verify metrics and independent alerts.

## Required Gates

```powershell
pnpm changeset:status --since=origin/main
pnpm audit --audit-level=moderate
pnpm --filter bot-server test
pnpm test:unit
pnpm test:integration
pnpm lint
pnpm build
pnpm spec:validate
```

The Moderate audit gate may pass with only documented, time-bounded,
non-runtime exceptions. As of the Phase 4 reconciliation, the only approved
exception is the Changesets-only `js-yaml` advisory through 2026-07-17.

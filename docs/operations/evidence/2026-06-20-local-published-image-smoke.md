# Local Published Image Smoke Evidence - 2026-06-20

## Release Identity

- **Release:** Spec #057 production-delivery hardening local smoke continuation.
- **Spec:** `057-production-delivery-hardening`.
- **Git commit:** `5bf5b42b06f518e06b7a762b4d629ff4e096f5c2`.
- **GitHub Docker run:** `27856129345`.
- **Image digest:** `ghcr.io/salehosman/tempot-bot-server@sha256:75c4150d377e4b2821b343fc1e7b30f6e49ba5083a150d9b343177a5e8405176`.
- **Environment:** Local isolated Docker rehearsal, not external staging.
- **Date:** 2026-06-20.
- **Operator:** Codex, acting under Project Manager approval.

## Scope

This record proves that the current signed `main` image can be pulled, migrated,
started, connected to Telegram with the available bot token, and queried through
the hardened liveness/readiness endpoints in a local isolated environment.

It does not close the external staging, webhook delivery, monitoring, alert,
rollback, backup target, or production go/no-go gates.

## Build And Supply Chain Evidence

- GitHub Docker workflow run `27856129345` passed on `main`.
- The workflow pushed `ghcr.io/salehosman/tempot-bot-server:main` with digest
  `sha256:75c4150d377e4b2821b343fc1e7b30f6e49ba5083a150d9b343177a5e8405176`.
- The same run executed Trivy image scanning, Cosign signing, and Cosign
  verification for the digest.
- Local Docker pulled the same immutable digest successfully.
- Local image inspection confirmed the runner executes as non-root user
  `hono` (`uid=1001`) and contains the Prisma CLI and database schema required
  for migration deployment.

## Telegram Evidence

- Telegram `getMe` succeeded with the local `.env` bot token.
- Bot username returned by Telegram: `TempotDevBot`.
- `getWebhookInfo` returned no configured webhook URL.
- Pending update count was `0`.
- No last webhook error was reported.

## Local Runtime Rehearsal

- Isolated PostgreSQL image: `pgvector/pgvector:0.8.2-pg16`.
- Isolated Redis image: `redis:7-alpine`.
- Isolated app container: `tempot-smoke-app`.
- Published app image: the immutable digest listed above.
- Application mode: `polling`.
- `DATABASE_URL`, `REDIS_URL`, protected-data key-ring values, and
  `TEMPOT_READINESS_TOKEN` were provided only to the local smoke containers.
  Secret values were not recorded in this evidence file.

Migration deployment from inside the published image passed with exit code `0`.
Applied migrations:

- `20260426013552_add_user_profile`
- `20260523000000_add_interaction_events`
- `20260608234000_expand_sensitive_data_protection`
- `20260608235500_add_sensitive_migration_checkpoints`

Startup evidence:

- Database connected.
- Super-admin bootstrap completed with the ID redacted by application logging.
- Caches warmed.
- Module discovery found `8` modules with `0` skipped and `0` failed.
- Module validation validated `8` modules with `0` skipped and `0` failed.
- All active module handlers loaded.
- HTTP server listened on port `3000`.
- `startup_completed` was logged.
- No fatal startup, dependency build, or startup failure log was present during
  the smoke window.

HTTP smoke evidence:

- `GET /live` returned HTTP `200` with body `{"status":"alive"}`.
- `GET /ready` without the readiness token returned HTTP `403` with body
  `{"error":"forbidden"}`.
- `GET /ready` with the readiness token returned HTTP `200`.
- Authorized readiness status was `degraded` because `queue_manager` and
  `ai_provider` were intentionally unconfigured in the local smoke environment.
- Authorized readiness reported `database`, `redis`, and `disk` as `ok`.

## Decision

- **Decision:** Partial pass for local published-image smoke.
- **T032 status:** Still open until the selected digest passes external staging
  smoke and webhook delivery evidence.
- **Production decision:** No-Go.
- **Reason:** External staging deployment, real webhook delivery through a
  public URL, monitoring and independent alert evidence, target backup/restore,
  rollback or forward-fix rehearsal, and final Product Manager approval remain
  unavailable.

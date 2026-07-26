# 2026-07-26 Signed Digest Docker Desktop Smoke

## Scope

This record documents a local Docker Desktop smoke test for the latest signed
`main` image after the 2026-07-26 CI, audit, and Docker recovery.

This is not a production go decision. It verifies that the immutable signed
image can be pulled from GHCR, started locally against the existing Docker
Desktop PostgreSQL and Redis services, apply migrations, expose health checks,
and keep readiness protected.

## Release Identity

| Item | Value |
| --- | --- |
| Date | 2026-07-26 |
| Environment | Local Docker Desktop |
| Git commit | `1c852bcbf8a670a2e8be9db80a8b4a2ee802f540` |
| Docker workflow run | `30204972822` |
| CI workflow run | `30204972837` |
| Image digest | `ghcr.io/salehosman/tempot-bot-server@sha256:e3c28b445dc0dd92e502591568573e3af3e1dd1b8fe043d7594774fc37066815` |
| Bot mode | `polling` |
| Local app binding | `127.0.0.1:3000` |
| Database | Local Docker PostgreSQL/pgvector on `tempot_default` |
| Redis | Local Docker Redis on `tempot_default` |

## Docker Desktop Procedure

| Step | Result |
| --- | --- |
| Pulled immutable GHCR image digest | Passed |
| Replaced local `tempot-bot` container only | Passed |
| Kept existing PostgreSQL container | Passed |
| Kept existing Redis container | Passed |
| Started signed image on `tempot_default` network | Passed |
| Bound container port `3000` to `127.0.0.1:3000` | Passed |

The local bot container now runs image ID prefix `e3c28b445dc0`, which maps to
the selected immutable digest.

## Startup Evidence

| Check | Result |
| --- | --- |
| Prisma migration deploy inside image | Passed |
| Migration status | `8 migrations found`; no pending migrations |
| Node runtime | `v22.12.0` |
| Required environment variables | Present |
| Bot mode | `polling` |
| Database connection | Passed |
| Super admin bootstrap | Passed; value redacted in logs |
| Cache warmup | Passed |
| Module discovery | Passed; 9 modules discovered |
| Module validation | Passed; 9 modules validated |
| Module loading | Passed; 9 modules loaded |
| HTTP startup | Passed; server listened on port `3000` |

The startup log reported `startup_completed` with `modulesLoaded: 9`.

## Health Check Evidence

| Endpoint | Result |
| --- | --- |
| `GET /live` local | `200`, `{"status":"alive"}` |
| `GET /health` local | `200`, `{"status":"alive"}` |
| `GET /ready` without token | `403` |
| `GET /ready` with readiness token | `200`, `degraded` |

The readiness response with the protected token reported:

| Probe | Status |
| --- | --- |
| Database | `ok` |
| Redis | `ok` |
| Disk | `ok` |
| Queue manager | `unconfigured` |
| AI provider | `unconfigured` |

Readiness is `degraded` because optional queue and AI subsystems are not
configured in this local Docker Desktop smoke environment. Database, Redis, and
disk probes were healthy.

## Manual Telegram Journey Status

This record does not close the manual Telegram journey. The image is running in
polling mode and is ready for the Project Manager to test from Telegram.

| Journey Step | Status | Evidence |
| --- | --- | --- |
| Super admin sends `/start` | Pending | Requires live Telegram interaction |
| Unknown user submits membership request | Pending | Requires second Telegram account |
| Membership data collection | Pending | Requires live form flow |
| Super admin approves membership | Pending | Requires pending membership request |
| Admin user console role or profile update | Pending | Requires live callback interaction |
| Block and unblock user | Pending | Requires selected user action |
| Test notification delivery | Pending | Requires selected real user |

## Operational Findings

1. The latest signed digest can run on Docker Desktop against the existing local
   PostgreSQL and Redis services.
2. The bot HTTP surface is available on `127.0.0.1:3000`.
3. Readiness protection is active: unauthenticated `/ready` returned `403`.
4. The signed image starts fast and loads the expected nine active modules.
5. The local environment is intentionally incomplete for optional queue and AI
   probes, so `degraded` readiness is expected for this smoke.
6. The runtime emitted a Node.js `punycode` deprecation warning. It is not a
   smoke failure, but it should be tracked as dependency maintenance.

## Current Local Runtime State

At the end of this smoke, Docker Desktop had:

| Container | State |
| --- | --- |
| `tempot-bot` | Running signed GHCR digest |
| `tempot-postgres` | Running and healthy |
| `tempot-redis` | Running and healthy |

## Remaining Release Gates

- Complete the real Telegram two-account membership journey.
- Capture evidence for super admin approval and user profile management.
- Capture evidence for role change, visitor downgrade, block, unblock, and test
  notification delivery.
- Run a webhook-mode smoke through a public tunnel or staging URL for this
  exact digest if webhook deployment is the intended staging mode.
- Record target-environment backup and restore evidence.
- Record protected-data key-rotation evidence.
- Record monitoring and alert evidence.
- Record rollback or forward-fix rehearsal evidence.

## Decision

**No-go for production.**

The signed Docker Desktop smoke is successful, but production approval remains
blocked by the real Telegram journey, external staging or webhook smoke,
backup/restore rehearsal, key rotation rehearsal, monitoring evidence, and
rollback evidence.

# 2026-07-22 Signed Digest Webhook Smoke

## Scope

This record documents a local staging-style smoke test for the latest signed
`main` Docker image after the CI and Docker gates recovered.

This is not a production go decision. It verifies that the immutable image can
start on Docker Desktop with local PostgreSQL and Redis, expose health checks,
receive a Cloudflare Quick Tunnel, register a Telegram webhook, and process a
signed `/start` webhook update.

## Release Identity

| Item | Value |
| --- | --- |
| Date | 2026-07-22 |
| Environment | Local staging-style Docker Desktop |
| Git commit | `cb2280d93a9a110d3b2465bde4f118190a88c6fe` |
| Docker workflow | `Docker #49` |
| CI workflow | `CI #227` |
| Image digest | `ghcr.io/salehosman/tempot-bot-server@sha256:58372801ba25189835e4c89a43257d9b830e9078179c5c71259b004939f6dec0` |
| Public exposure | Cloudflare Quick Tunnel |
| Public URL | `https://stands-std-excluded-rely.trycloudflare.com` |
| Bot mode | `webhook` |
| Local app binding | `127.0.0.1:3000` |
| Database | Local Docker PostgreSQL/pgvector on `tempot_default` |
| Redis | Local Docker Redis on `tempot_default` |

## Build And Supply Chain Evidence

| Check | Result |
| --- | --- |
| GitHub CI | Passed on `main` for commit `cb2280d` |
| GitHub Docker build | Passed on `main` for commit `cb2280d` |
| Image pull by immutable digest | Passed |
| Container image scan | Passed in Docker workflow |
| Image signature | Signed and verified in Docker workflow |
| Local container image identity | Running container image ID matched the immutable digest |

## Local Runtime Evidence

| Check | Result |
| --- | --- |
| Prisma migration deploy inside image | Passed; 7 migrations found, no pending migrations |
| Container startup | Passed |
| Node runtime | `v22.12.0` |
| Module discovery | Passed; 9 modules discovered |
| Module validation | Passed; 9 modules validated |
| HTTP startup | Passed; server listened on port `3000` |
| Redis event bus | Restored distributed mode |

## Health Check Evidence

| Endpoint | Result |
| --- | --- |
| `GET /live` local | `200`, `{"status":"alive"}` |
| `GET /health` local | `200`, `{"status":"alive"}` |
| `GET /ready` without token | `403` |
| `GET /ready` with token | `200`, `degraded` |
| `GET /live` through Cloudflare tunnel | `200`, `{"status":"alive"}` |

Readiness returned `degraded` because optional subsystems were unconfigured in
this local staging-style environment. Database and Redis probes were available.

## Webhook Evidence

| Check | Result |
| --- | --- |
| Cloudflare Quick Tunnel creation | Passed |
| Public tunnel `/live` smoke | Passed |
| Telegram `setWebhook` | Passed; Telegram returned `Webhook was set` |
| Telegram `getWebhookInfo` | Passed; URL matched the tunnel `/webhook`, pending updates `0`, no last error |
| Signed local `/webhook` `/start` update | `200`, `{"ok":true}` |
| Bot processing for `/start` | Passed; logs showed `interaction_received`, `interaction_response_sent`, and `interaction_handled` |

## Manual Telegram Journey Status

The requested manual Telegram journey was not fully completed during this
recording window because no real Telegram user updates arrived while logs were
monitored for four minutes after the webhook was registered.

| Journey Step | Status | Evidence |
| --- | --- | --- |
| Super admin sends `/start` from Telegram | Pending | No live Telegram update observed during monitoring |
| Unknown user starts membership request | Pending | No live Telegram update observed during monitoring |
| Membership data collection | Pending | Requires a real Telegram account interaction |
| Super admin approves request | Pending | Requires a real membership request |
| Admin user management action | Pending | Requires real Telegram callback interaction |
| Test notification delivery | Pending | Requires selected real user and callback interaction |

## Operational Findings

1. The latest signed image can run locally on Docker Desktop against the
   existing PostgreSQL and Redis services.
2. The previous local `tempot-bot-server:local` container was replaced with the
   immutable signed GHCR digest.
3. Cloudflare Quick Tunnel worked only after recreating the tunnel with the
   `http2` protocol. The first generated quick tunnel registered but its
   hostname did not resolve from the workstation or Docker.
4. The active webhook URL is temporary and should not be treated as stable
   staging infrastructure.
5. This run closes image startup, health, tunnel liveness, and webhook
   registration evidence. It does not close real end-user membership flow,
   backup/restore, key rotation, monitoring, or rollback gates.

## Remaining Release Gates

- Complete a real Telegram journey from two accounts:
  super admin and unregistered member.
- Capture evidence for membership request submission, super admin approval,
  admin user console usage, and test notification delivery.
- Rehearse database backup and restore against an isolated replica.
- Rehearse protected-data key rotation with the current staging database.
- Record rollback or forward-fix rehearsal evidence.
- Promote through a stable named tunnel or real staging domain before any
  production go/no-go decision.

## Decision

**No-go for production.**

The signed image smoke is successful, but production approval remains blocked by
manual Telegram journey evidence, backup/restore rehearsal, key rotation
rehearsal, monitoring evidence, and rollback evidence.

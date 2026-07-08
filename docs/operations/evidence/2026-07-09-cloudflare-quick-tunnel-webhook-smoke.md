# 2026-07-09 Cloudflare Quick Tunnel Webhook Smoke

## Scope

This record documents a controlled local staging-style smoke test for webhook
mode through a Cloudflare Quick Tunnel.

This is not production approval and does not replace the required stable
staging evidence for Spec #057. The tunnel URL is temporary and the verified
container image in this record was locally rebuilt from
`codex/fix-webhook-bot-init`, not promoted from an immutable signed `main`
digest.

## Environment

| Item | Value |
| --- | --- |
| Date | 2026-07-09 |
| Branch | `codex/fix-webhook-bot-init` |
| Runtime image | `tempot-bot-server:webhook-init-fix` |
| Public URL | `https://networking-innovations-stocks-lime.trycloudflare.com` |
| Public exposure | Cloudflare Quick Tunnel |
| Bot mode | `webhook` |
| App port | `127.0.0.1:3000` |
| Database | Local Docker PostgreSQL/pgvector service on `tempot_default` |
| Redis | Local Docker Redis service on `tempot_default` |

## Findings

The first webhook smoke against the previously published `main` image exposed a
startup defect: webhook mode started the Hono HTTP server without initializing
the grammY bot. A signed webhook request then failed with:

```text
Bot not initialized! Either call await bot.init(), or directly set the botInfo option...
```

The fix initializes the bot before the HTTP server starts in webhook mode.
During follow-up smoke testing, a malformed signed update containing only
`update_id` exposed an additional route robustness issue. The webhook route now
rejects structurally incomplete Telegram updates before passing them to grammY
and logs `handleUpdate` failures with sanitized error text only.

## Verification Commands

```powershell
corepack pnpm vitest run apps/bot-server/tests/unit/orchestrator.test.ts apps/bot-server/tests/integration/startup-sequence.test.ts apps/bot-server/tests/unit/routes/webhook.route.test.ts --reporter=verbose
corepack pnpm lint
corepack pnpm --filter bot-server build
docker build -f apps/bot-server/Dockerfile -t tempot-bot-server:webhook-init-fix .
```

## Verification Results

| Check | Result |
| --- | --- |
| Targeted unit/integration tests | Passed, 35 tests |
| ESLint | Passed |
| `bot-server` TypeScript build | Passed |
| Docker build | Passed |
| Prisma migration deploy inside image | Passed, no pending migrations |
| Local `/live` | `200` |
| Local `/health` | `200` |
| Local `/ready` without readiness token | `403` |
| Local `/ready` with readiness token | `200`, `degraded` |
| Tunnel `/live` | `200` |
| Tunnel `/health` | `200` |
| Tunnel `/ready` without readiness token | `403` |
| Tunnel `/ready` with readiness token | `200`, `degraded` |
| Local unsigned `/webhook` POST | `401` |
| Local signed malformed `/webhook` POST | `400` |
| Telegram `setWebhook` | `ok=true`, webhook already set |
| Telegram `getWebhookInfo` | URL matched tunnel `/webhook`, pending updates `0`, no last error |

The readiness status was `degraded` because optional subsystems were
unconfigured in this local staging-style run. Critical database and Redis probes
were available.

## Remaining Release Gates

- Re-run this smoke after the fix is merged to `main` and a new signed GHCR
  digest is produced.
- Promote and deploy by immutable digest, not by mutable tag or local rebuild.
- Replace the Quick Tunnel with a stable named tunnel or a real staging domain
  before treating the environment as persistent staging.
- Complete real Telegram delivery smoke with an actual `/start` or selected
  admin command from an authorized test account.
- Complete rollback or forward-fix rehearsal, metrics/alert evidence, and
  backup/restore evidence before production approval.

## Security Note

One malformed webhook smoke before the route hardening produced a raw grammY
exception in local container logs. The committed route-level error handling is
intended to prevent that failure path from logging unsanitized exception objects.
If local terminal or Docker logs are exported to a shared system, rotate the
Telegram bot token before using this bot beyond controlled testing.

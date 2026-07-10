# bot-server

The production Telegram runtime for Tempot. It assembles grammY, Hono, the
active infrastructure packages, and discovered business modules.

## Current State

The application is implemented and covered by unit and integration tests. It
supports polling for local development and webhook delivery for deployed
environments. Startup connects required infrastructure, initializes i18n and
caches, discovers and validates modules, registers commands, starts HTTP
serving, and installs graceful shutdown hooks.

## Main Responsibilities

- Build the grammY bot and middleware chain.
- Enforce authentication, authorization, maintenance, validation, sanitization,
  rate limiting, audit logging, and interaction observability.
- Discover module configuration and load validated module handlers.
- Expose Hono health and webhook routes.
- Bootstrap super administrators and warm runtime caches.
- Coordinate lifecycle events and graceful shutdown.

## Structure

```text
apps/bot-server/
|-- src/
|   |-- bot/                 # bot factory, error boundary, middleware
|   |-- server/              # Hono factory and routes
|   |-- startup/             # dependency assembly and lifecycle orchestration
|   `-- index.ts             # process entry point
|-- tests/
|   |-- unit/
|   `-- integration/
|-- Dockerfile
|-- package.json
`-- vitest.config.ts
```

## Required Environment

- `BOT_TOKEN`
- `DATABASE_URL`
- `REDIS_URL`
- `SUPER_ADMIN_IDS`
- `BOT_MODE=polling|webhook`
- `WEBHOOK_URL` and `WEBHOOK_SECRET_TOKEN` when webhook mode is enabled
- Optional HTTP operations hardening: `TEMPOT_READINESS_TOKEN`,
  `TEMPOT_HTTP_BODY_LIMIT_BYTES`, `TEMPOT_HTTP_RATE_LIMIT_MAX`,
  `TEMPOT_HTTP_RATE_LIMIT_WINDOW_MS`, `TEMPOT_DISK_FREE_THRESHOLD_BYTES`

See the root `.env.example` for the complete configuration reference.

## Commands

Run from the repository root:

```bash
pnpm build:bot-runtime
pnpm --filter bot-server test
pnpm --filter bot-server test:integration
pnpm --filter bot-server dev
pnpm --filter bot-server start
```

## Local Docker Webhook Build

Run this from the repository root when testing the current local checkout in
Docker webhook mode:

```powershell
pnpm build:bot-runtime
docker compose -f docker-compose.yml -f docker-compose.webhook.yml -p tempot up -d --build bot-server
docker compose -f docker-compose.yml -f docker-compose.webhook.yml -p tempot ps
docker logs -f tempot-bot
```

This builds `apps/bot-server/Dockerfile` locally through Compose and tags the
runtime image as `tempot-bot-server:local`. It does not pull or run the
published GHCR digest.

The webhook stack expects these `.env` values to be set:

- `WEBHOOK_URL`
- `WEBHOOK_SECRET_TOKEN`
- `TEMPOT_READINESS_TOKEN`

When using a Cloudflare Quick Tunnel, read the current URL from
`tempot-cloudflared` logs, update `WEBHOOK_URL`, recreate `bot-server`, and
register the Telegram webhook again.

## Health And Shutdown

`GET /health` and `GET /live` return minimal public liveness only. Detailed
runtime dependency readiness is available through restricted `GET /ready`
access using the operational readiness token. Shutdown hooks stop the HTTP
server and bot, then close cache, database, event bus, and other registered
resources through the shared `ShutdownManager`.

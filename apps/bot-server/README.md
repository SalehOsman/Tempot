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

## Health And Shutdown

`GET /health` and `GET /live` return minimal public liveness only. Detailed
runtime dependency readiness is available through restricted `GET /ready`
access using the operational readiness token. Shutdown hooks stop the HTTP
server and bot, then close cache, database, event bus, and other registered
resources through the shared `ShutdownManager`.

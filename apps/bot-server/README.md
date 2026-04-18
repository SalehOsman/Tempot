# bot-server

> The main Telegram bot entry point — grammY + Hono. Assembles all packages and modules into a running bot.

## Purpose

The `bot-server` app is the final assembly layer:

- Initialises the grammY bot with all middleware (session, auth, i18n, rate limiter, sanitizer)
- Starts the Hono web server (webhook endpoint + health check + API)
- Registers all active modules via `module-registry`
- Implements the Graceful Shutdown sequence (Constitution Rule XVII)
- Runs in polling mode for development, webhook mode for production

## Current State

**Minimal mode** (Phase 0) — grammY only, no database or Redis required. Used for connection testing.

Full bot assembly happens in Phase 5 after all packages are built.

## Phase

Phase 5 — App Assembly (final phase)

## Dependencies (Phase 5)

All `@tempot/*` packages plus:

| Package         | Purpose                    |
| --------------- | -------------------------- |
| `grammy` 1.41.1 | Telegram bot engine        |
| `hono` 4.x      | Web server (webhook + API) |
| `tsx` 4.21.0    | TypeScript dev runner      |

## Structure (Phase 5)

```
apps/bot-server/
├── src/
│   ├── index.ts              # Entry point — creates bot + server
│   ├── bot/
│   │   ├── bot.ts            # grammY bot instance + middleware stack
│   │   ├── middleware/       # session, auth, i18n, ratelimiter, sanitizer
│   │   └── error-boundary.ts # Global error handler
│   ├── server/
│   │   ├── hono.ts           # Hono app instance
│   │   ├── routes/
│   │   │   ├── webhook.ts    # POST /webhook
│   │   │   ├── health.ts     # GET /health
│   │   │   └── api/          # REST endpoints for dashboard
│   │   └── middleware/
│   └── startup/
│       ├── bootstrap.ts      # Super admin bootstrap
│       ├── cache-warmer.ts   # Warm settings + translations cache
│       └── shutdown.ts       # Graceful shutdown hooks
├── Dockerfile                # Phase 5 — see TODO comments inside
├── package.json
└── tsconfig.json
```

## Running

```bash
# Development (current — minimal mode)
pnpm dev

# Production (Phase 5 — requires all packages)
pnpm build
pnpm start
```

## Health Check

`GET /health` returns:

```json
{
  "status": "healthy",
  "uptime": 3600,
  "checks": {
    "database": { "status": "ok", "latency_ms": 12 },
    "redis": { "status": "ok", "latency_ms": 2 },
    "ai_provider": { "status": "ok" },
    "disk": { "status": "ok", "free_gb": 15.2 },
    "queue_manager": { "status": "ok", "active_jobs": 3 }
  },
  "version": "0.1.0"
}
```

## Graceful Shutdown Order (Constitution Rule XVII)

1. Hono server stops accepting new requests
2. grammY completes pending updates (10s max)
3. BullMQ workers drain via queue factory (15s max)
4. Redis connection closes
5. Prisma disconnects
6. Drizzle pool ends

Total timeout: 30 seconds → `process.exit(1)` + FATAL log if exceeded.

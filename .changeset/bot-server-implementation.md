---
'@tempot/event-bus': patch
---

feat(bot-server): implement production bot-server application

New application orchestrating the Tempot Telegram bot:

- Startup orchestrator with 10-step initialization sequence
- Config loader with strict env validation (PORT, BOT_TOKEN, WEBHOOK_SECRET)
- 8-step middleware chain: sanitizer, rate limiter, maintenance, auth (CASL), scoped users, validation, handlers, audit
- HTTP server (Hono) with webhook reception (timing-safe secret comparison) and health probes
- Module discovery/validation/loading via @tempot/module-registry
- Graceful shutdown with ShutdownManager from @tempot/shared
- Super admin bootstrap and cache warming
- Error boundary with reference codes and Sentry integration
- Differentiated rate limiting (global, per-user, per-group) via rate-limiter-flexible
- 112 unit tests, full TDD

Cross-package changes:

- event-bus: Add bot-server lifecycle event types to TempotEvents

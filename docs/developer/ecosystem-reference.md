# Ecosystem Reference Map

> **Purpose:** Maps all approved external libraries and plugins to their target Tempot packages.
> When building a new package, consult this document FIRST to avoid reinventing existing functionality.
>
> **Date:** 2026-03-26
> **Authority:** All entries are approved by the Project Manager.

---

## grammY Plugins (17 approved)

### bot-server

| Plugin                | npm Package                       | Purpose                                                                                       | Replaces                                             |
| --------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Auto Chat Action      | `@grammyjs/auto-chat-action`      | Automatic "typing..." indicator during handler execution                                      | Custom typing indicator (was planned for ux-helpers) |
| Auto Retry            | `@grammyjs/auto-retry`            | Automatic retry on Telegram 429 rate limit responses                                          | Custom retry logic                                   |
| Transformer Throttler | `@grammyjs/transformer-throttler` | Outbound rate limiting (30 msg/sec global Telegram limit)                                     | Custom outbound throttling                           |
| Hydrate               | `@grammyjs/hydrate`               | Adds `msg.editText()`, `cbq.answer()` to context — enables Golden Rule (edit-message pattern) | Manual `ctx.api.editMessageText()` calls             |
| Parse Mode            | `@grammyjs/parse-mode`            | `fmt` tagged templates, bold/italic/code formatters, auto-parse-mode                          | Manual MarkdownV2 escaping                           |
| Commands              | `@grammyjs/commands`              | i18n-aware command registration with Telegram Bot API scopes                                  | Manual `setMyCommands()` calls                       |
| Runner                | `@grammyjs/runner`                | Concurrent long polling with sequential per-chat processing                                   | Simple `bot.start()` for dev mode                    |
| Router                | `@grammyjs/router`                | Session-based routing (lightweight alternative to conversations)                              | Manual `if/else` on session state                    |
| Files                 | `@grammyjs/files`                 | Simplified Telegram file downloads with `getUrl()` and `download()`                           | Manual `getFile()` + URL construction                |
| Rate Limiter          | `@grammyjs/ratelimiter`           | Inbound rate limiting per user — 📐 ADR-020                                                   | Custom inbound throttling                            |

### ux-helpers

| Plugin        | npm Package                           | Purpose                                                  | Replaces                           |
| ------------- | ------------------------------------- | -------------------------------------------------------- | ---------------------------------- |
| Parse Mode    | `@grammyjs/parse-mode`                | Foundation for Message Composer — `fmt` tagged templates | Custom MarkdownV2 builder          |
| Callback Data | `callback-data` (npm, not grammY org) | Type-safe callback data encode/decode with validation    | Custom callback data serialization |

> **Note:** `@grammyjs/hydrate` is installed in bot-server but ux-helpers uses its Context type extensions (e.g., `ctx.msg.editText()`).

### ai-core

| Plugin | npm Package        | Purpose                                                           | Replaces                 |
| ------ | ------------------ | ----------------------------------------------------------------- | ------------------------ |
| Stream | `@grammyjs/stream` | LLM streaming to Telegram — works with Vercel AI SDK `textStream` | Custom streaming chunker |

### search-engine

| Plugin | npm Package      | Purpose                                             | Replaces                      |
| ------ | ---------------- | --------------------------------------------------- | ----------------------------- |
| Menu   | `@grammyjs/menu` | Interactive menus with dynamic content — 📐 ADR-025 | Custom search result renderer |

### input-engine

| Plugin             | npm Package                    | Purpose                                           | Replaces                          |
| ------------------ | ------------------------------ | ------------------------------------------------- | --------------------------------- |
| Conversations      | `@grammyjs/conversations`      | Multi-step input flows with wait/skip/cancel      | Custom conversation state machine |
| Stateless Question | `@grammyjs/stateless-question` | Lightweight single-question without session state | Custom ForceReply handling        |

### mini-apps (future)

| Plugin    | npm Package           | Purpose                                         | Replaces                   |
| --------- | --------------------- | ----------------------------------------------- | -------------------------- |
| Validator | `@grammyjs/validator` | Web App initData validation (HMAC verification) | Custom initData validation |
| Web App   | `@grammyjs/web-app`   | TypeScript types for Telegram Web App API       | Manual type definitions    |

---

## Hono Built-in Middleware — 📐 ADR-030

**Target:** bot-server (Phase 2)

### Built-in (zero extra dependencies)

| Middleware         | Import                 | Purpose                                            |
| ------------------ | ---------------------- | -------------------------------------------------- |
| `secureHeaders`    | `hono/secure-headers`  | Security headers (X-Frame-Options, CSP, etc.)      |
| `cors`             | `hono/cors`            | Cross-Origin Resource Sharing                      |
| `csrf`             | `hono/csrf`            | CSRF token protection                              |
| `jwt`              | `hono/jwt`             | JWT token verification                             |
| `bearerAuth`       | `hono/bearer-auth`     | Bearer token authentication                        |
| `requestId`        | `hono/request-id`      | Unique request ID per request                      |
| `bodyLimit`        | `hono/body-limit`      | Request body size limits                           |
| `timeout`          | `hono/timeout`         | Request timeout enforcement                        |
| `compress`         | `hono/compress`        | Response compression (gzip/brotli)                 |
| `ipRestriction`    | `hono/ip-restriction`  | IP whitelist/blacklist                             |
| `languageDetector` | `hono/language`        | Accept-Language header parsing                     |
| `timing`           | `hono/timing`          | Server-Timing header for performance metrics       |
| `contextStorage`   | `hono/context-storage` | AsyncLocalStorage for request context              |
| `etag`             | `hono/etag`            | ETag-based conditional responses                   |
| `combine`          | `hono/combine`         | `some`/`every`/`except` for middleware composition |

### External (3 packages)

| Package             | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `@hono/zod-openapi` | Type-safe OpenAPI route definitions with Zod schema validation |
| `@hono/swagger-ui`  | Auto-generated Swagger documentation UI                        |
| `hono-rate-limiter` | Configurable rate limiting with Redis/BullMQ backing           |

---

## Vercel AI SDK Advanced Features — 📐 ADR-031

**Target:** ai-core

| SDK Feature                  | Use Case                                         | Replaces                          |
| ---------------------------- | ------------------------------------------------ | --------------------------------- |
| `createProviderRegistry()`   | Provider aliasing + fallbacks + middleware       | Hand-rolled `AIProviderFactory`   |
| `Output.choice({ options })` | Type-safe enum classification                    | Manual `generateText()` + parsing |
| `Output.object({ schema })`  | Structured data extraction with Zod              | Already planned correctly         |
| `LanguageModelMiddleware`    | Cross-cutting: caching, circuit-breaker, logging | Per-service caching/retry logic   |
| Built-in `maxRetries`        | Automatic retry with exponential backoff         | Custom retry wrapper              |
| Built-in `abortSignal`       | Request timeouts                                 | Custom timeout logic              |
| Built-in `usage`             | Token counting per request                       | Custom token counter              |
| `experimental_telemetry`     | OpenTelemetry integration                        | Custom telemetry                  |

> **Version note:** Evaluate upgrading from AI SDK v4.x to v5.x during ai-core spec phase.

---

## Prisma Ecosystem (Future Evaluation)

**Target:** database package (enhancement spec when needed)

| Feature                        | Purpose                                   | Status                                |
| ------------------------------ | ----------------------------------------- | ------------------------------------- |
| `prismaSchemaFolder`           | Built-in multi-file schema support        | May replace custom `merge-schemas.ts` |
| `@prisma/instrumentation`      | OpenTelemetry query tracing               | Evaluate for observability            |
| `strictUndefinedChecks`        | Prevent accidental `undefined` in queries | Preview feature — evaluate stability  |
| `prisma-extension-soft-delete` | Soft delete via Prisma extension          | Evaluate vs custom extension          |

---

## Patterns from bot-base/telegram-bot-template

**Source:** [bot-base/telegram-bot-template](https://github.com/bot-base/telegram-bot-template) (440+ stars)

| Pattern                      | Description                                                       | Target Package         |
| ---------------------------- | ----------------------------------------------------------------- | ---------------------- |
| `logHandle(id)`              | Lightweight handler tracing middleware — logs handler ID on entry | bot-server             |
| Feature/Composer composition | Each feature as `Composer<Context>` — modular bot structure       | bot-server             |
| Keyboard factories           | Keyboards as factory functions in dedicated files                 | ux-helpers, bot-server |
| `chunk()` utility            | Array chunking for keyboard grid layouts                          | ux-helpers             |
| Config discriminated union   | TypeScript narrows config fields based on mode (polling/webhook)  | bot-server             |

---

## grammY Testing

**No testing utilities exist** in the grammY ecosystem (no `@grammyjs/test`, no community packages). Building `createMockContext()` in ux-helpers is necessary.

**Approach:** Real `Context` class + Mock API via transformer interception (NOT partial mock objects).

This utility is being built as part of the ux-helpers package test infrastructure and may be extracted to a shared testing package later.

# ADR-030: Hono Built-in Middleware over Custom Implementations

**Date:** 2026-03-26
**Status:** Accepted

## Context

bot-server requires middleware for security headers, CORS, CSRF protection, JWT/bearer authentication, request IDs, body size limits, timeouts, compression, IP restriction, language detection, request timing, and context storage. The initial architecture assumed building custom middleware for most of these concerns.

Hono v4.x ships 15+ production-ready middleware built into the framework — no extra dependencies required.

## Decision

Use **Hono's built-in middleware** for all concerns covered by the framework. Only install external packages where Hono has no built-in equivalent.

### Built-in (zero extra dependencies)

`secureHeaders`, `cors`, `csrf`, `jwt`, `bearerAuth`, `requestId`, `bodyLimit`, `timeout`, `compress`, `ipRestriction`, `languageDetector`, `timing`, `contextStorage` (AsyncLocalStorage), `etag`, `combine` (`some`/`every`/`except` for composing middleware guards).

### External (3 packages only)

| Package             | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `@hono/zod-openapi` | Type-safe OpenAPI route definitions with Zod validation |
| `@hono/swagger-ui`  | Auto-generated API documentation UI                     |
| `hono-rate-limiter` | Configurable rate limiting with BullMQ/Redis backing    |

### Notable: `hono/context-storage`

Uses Node.js `AsyncLocalStorage` to make request context (logger, request ID, user) available anywhere without explicit parameter passing. Evaluate during bot-server spec as a potential replacement for manual context threading.

## Consequences

- 15+ middleware eliminated from custom code — each is maintained and tested by the Hono team
- Consistent API — all built-in middleware follow the same `app.use()` pattern
- `combine()` with `some`/`every`/`except` provides declarative middleware composition for route-level auth guards
- ADR-002 chose Hono for performance and TypeScript-first design; this ADR extends that choice to its middleware ecosystem
- bot-server's middleware layer reduces from custom implementations to configuration of built-in options

## Alternatives Rejected

**Custom middleware for each concern:** Unnecessary duplication of battle-tested functionality. Hono's built-in middleware covers all standard web server concerns with zero extra dependencies.

**Third-party middleware packages (helmet, cors, etc.):** These are Express/Fastify ecosystem packages. Hono has native equivalents that are faster and type-safe.

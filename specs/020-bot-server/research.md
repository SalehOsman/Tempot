# Research: Bot Server

## Decisions

### 1. HTTP Framework Choice

- **Decision:** Use Hono 4.x for the HTTP server layer.
- **Rationale:** Hono is already in the project's locked tech stack (CLAUDE.md). It is lightweight, supports middleware composition similar to Express but with better TypeScript support, and works well for the three endpoints needed (webhook, health, future API routes). The bot-server README already specifies Hono.
- **Alternatives considered:** Express (rejected — not in locked tech stack, heavier). Fastify (rejected — not in locked tech stack). Native Node.js HTTP server (rejected — too low-level, no middleware composition).

### 2. Bot Engine Choice

- **Decision:** Use grammY 1.41.1 as the Telegram bot engine.
- **Rationale:** grammY is the locked bot engine in the tech stack. It supports both polling and webhook modes natively, has a mature middleware system, and the module-registry package already defines its `RegistryBot` interface around grammY's API. The `@grammyjs/ratelimiter` plugin integrates directly.
- **Alternatives considered:** Telegraf (rejected — not in locked tech stack, less TypeScript support). node-telegram-bot-api (rejected — not in locked tech stack, no middleware system).

### 3. Rate Limiting Strategy

- **Decision:** Use @grammyjs/ratelimiter for bot-side rate limiting and rate-limiter-flexible for API-side (Hono) rate limiting, both backed by Redis.
- **Rationale:** Architecture Spec Section 20 mandates @grammyjs/ratelimiter for bot updates (ADR-020). For the HTTP server (health check, future dashboard API), rate-limiter-flexible provides consistent API-side rate limiting. Both use Redis as the backing store for distributed rate limiting across multiple instances.
- **Alternatives considered:** Custom rate limiter (rejected — ADR-020 explicitly chose library-based over custom). grammY ratelimiter only (rejected — doesn't cover HTTP endpoints).

### 4. Input Sanitization Approach

- **Decision:** Use sanitize-html for input sanitization as the first middleware in the chain.
- **Rationale:** ADR-020 specifies sanitize-html as the chosen sanitization library. It runs before rate limiting to ensure all downstream middleware and handlers receive clean input. Applied to text content in incoming bot updates.
- **Alternatives considered:** DOMPurify (rejected — browser-oriented, ADR-020 chose sanitize-html). Custom regex sanitizer (rejected — ADR-020 explicitly chose battle-tested library).

### 5. Middleware Ordering Decision

- **Decision:** The middleware chain order is: sanitizer → rate limiter → maintenance → auth → scoped users → validation → handler → audit.
- **Rationale:** Architecture Spec Section 20 defines the security chain as `sanitize-html → ratelimiter → CASL Auth → Zod Validation → Business Logic → Audit Log`. Maintenance mode is inserted after rate limiting (to prevent abuse during maintenance) but before auth (to avoid unnecessary auth processing). Scoped users check is after auth (needs user identity) but before handler (to block before business logic).
- **Alternatives considered:** Maintenance before rate limiting (rejected — allows abuse during maintenance). Scoped users as part of auth middleware (rejected — separate concern, cleaner separation).

### 6. Module Handler Loading Strategy

- **Decision:** Dynamic import of each module's index.ts, calling its default-exported setup function with the bot instance and a dependency container.
- **Rationale:** Dynamic import allows lazy loading and supports the pluggable architecture. The setup function pattern gives modules full control over their handler registration while the dependency container provides consistent access to shared services. This mirrors grammY's plugin pattern.
- **Alternatives considered:** Require-based loading (rejected — not compatible with ESM modules). Declarative handler registration via config (rejected — too restrictive, modules need imperative control over handler setup). Single setup function with destructured args (rejected — D26 in spec.md mandates a dependency container object for extensibility).

### 7. Health Check Implementation

- **Decision:** Probe each subsystem independently with individual timeouts, compute overall classification, return structured JSON.
- **Rationale:** Architecture Spec Section 26.2 defines the exact response format. Independent probing ensures one slow subsystem doesn't block reporting on others. The 5-second total timeout (NFR-003) uses `Promise.race` per probe. Classification rules: DB/Redis down → unhealthy, AI/disk issues → degraded, all OK → healthy.
- **Alternatives considered:** Sequential probing (rejected — one slow probe delays the entire response). External health check service (rejected — adds dependency, overkill for single-app health).

### 8. Graceful Shutdown Design

- **Decision:** Reuse `ShutdownManager` from `@tempot/shared`, registering hooks in the order defined by Architecture Spec Section 25.3.
- **Rationale:** `ShutdownManager` already implements the 30-second fatal timeout, sequential hook execution, and error collection. Bot-server only needs to register the hooks in the correct order. This avoids reimplementing the timeout/error-handling logic.
- **Alternatives considered:** Custom shutdown logic (rejected — `ShutdownManager` already exists and handles the hard parts). Parallel shutdown (rejected — Architecture Spec Section 25.3 specifies sequential order with per-step timeouts).

### 9. Error Boundary and Reference Codes

- **Decision:** Use grammY's `bot.catch()` handler with `generateErrorReference()` from `@tempot/shared` for error reference codes.
- **Rationale:** grammY's `bot.catch()` is the standard error boundary for bot handlers. `generateErrorReference()` already produces ERR-YYYYMMDD-XXXX codes with in-process deduplication. The error boundary logs, optionally reports to Sentry, and emits a `system.error` event.
- **Alternatives considered:** Per-middleware try/catch (rejected — grammY's `bot.catch()` is the canonical pattern). Custom error code format (rejected — `generateErrorReference()` already implements Rule XXIV format).

### 10. Webhook Verification Method

- **Decision:** Verify the `X-Telegram-Bot-Api-Secret-Token` header against the configured `WEBHOOK_SECRET` environment variable.
- **Rationale:** This is Telegram's official webhook verification mechanism. The secret token is set when registering the webhook URL and Telegram includes it in every webhook request. Comparing the header value is simple, secure, and does not require cryptographic operations.
- **Alternatives considered:** IP allowlisting (rejected — Telegram uses dynamic IPs, not practical). Request body signature verification (rejected — Telegram doesn't sign webhook bodies, only provides the secret token header).

### 11. Testing Strategy for Application

- **Decision:** Focus on unit tests for individual components (middleware, startup steps, routes) with mocked package dependencies, plus integration tests for the full startup sequence.
- **Rationale:** Bot-server is an application, not a library. End-to-end tests with the real Telegram API are impractical (require bot tokens, webhooks, etc.). Each component (middleware, config loader, bootstrap, cache warmer, etc.) is testable in isolation with dependency injection. Integration tests verify the orchestration.
- **Alternatives considered:** E2E tests with real Telegram API (rejected — impractical, requires live bot). Snapshot testing (rejected — not meaningful for a startup orchestrator). No integration tests (rejected — need to verify step ordering).

### 12. Entry Point Architecture

- **Decision:** Thin entry point (`src/index.ts`) that creates dependencies and calls the startup orchestrator. All logic lives in dedicated modules under `bot/`, `server/`, `startup/`.
- **Rationale:** The existing bot-server README already defines this structure. A thin entry point makes the application testable (the orchestrator can be tested with mocked dependencies) and follows the separation of concerns principle. The orchestrator is the only file that knows the full startup order.
- **Alternatives considered:** Monolithic entry point (rejected — the 72-line prototype is exactly this, and it's marked "WILL NOT ENTER PRODUCTION"). Dependency injection container framework (rejected — Constitution doesn't use DI frameworks, D26 in spec.md uses a plain object).

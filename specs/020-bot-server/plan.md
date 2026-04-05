# Bot Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 72-line bot-server prototype (`apps/bot-server/src/index.ts`) with a production-grade application that assembles all infrastructure packages and business modules into a running Telegram bot with an HTTP server. The application initializes subsystems in a defined order, applies the mandatory security middleware chain, discovers and loads modules via module-registry, starts the HTTP server for webhook reception and health monitoring, and manages graceful shutdown.

**Architecture:** The application follows a three-directory structure: `src/bot/` (bot instance + middleware pipeline), `src/server/` (HTTP server + routes), and `src/startup/` (bootstrap, cache warming, shutdown, module loading). The entry point (`src/index.ts`) orchestrates the startup sequence by calling each subsystem initializer in order and the shutdown sequence by delegating to `ShutdownManager` from `@tempot/shared`.

**Tech Stack:** grammY 1.41.1 (Telegram bot engine), Hono 4.x (HTTP server for webhook + health + future API), @grammyjs/ratelimiter (bot-side rate limiting with Redis backend), sanitize-html (input sanitization per ADR-020), rate-limiter-flexible (API-side rate limiting), @tempot/module-registry (module discovery/validation/registration), @tempot/shared (Result pattern via neverthrow 8.2.0, AppError, ShutdownManager, CacheService, generateErrorReference, createToggleGuard, queueFactory), @tempot/logger (Pino 9.x structured logging), @tempot/event-bus (lifecycle event publishing), @tempot/auth-core (CASL @casl/ability + @casl/prisma for authorization), @tempot/session-manager (conversation state), @tempot/settings (system settings + maintenance mode via cache-manager 6.x), @tempot/i18n-core (i18next 25.x localization), @tempot/database (Prisma 7.x + Drizzle 0.45.x), @tempot/sentry (@sentry/node 8.x, optional toggle), @tempot/ux-helpers (user experience helpers).

**Design Constraints:**

- Fixed middleware order: sanitize-html → @grammyjs/ratelimiter → maintenance mode → CASL auth → scoped users → Zod validation → handler → audit log (D3 in spec.md, Architecture Spec Section 20). Maintenance is after rate limiting but before auth; scoped users is after auth but before validation (D9, D13 in spec.md)
- Application, not a library — no exports (D1 in spec.md)
- Dual mode via `BOT_MODE` env var — polling or webhook, no hot-switching (D10 in spec.md)
- Super admin bootstrap before module registration (D8 in spec.md)
- Cache warming order: settings first, translations second (D7 in spec.md)
- `ShutdownManager` from `@tempot/shared` already handles 30s timeout and hook sequencing
- `generateErrorReference()` from `@tempot/shared` already produces ERR-YYYYMMDD-XXXX codes
- Module handler setup receives dependency container, not individual args (D26 in spec.md)
- Health check in both modes; webhook route only in webhook mode (D15, D22 in spec.md)

---

### Shared Type Definitions

Defined in `src/bot-server.types.ts`:

```typescript
import type { Bot, Context } from 'grammy';
import type { ValidatedModule, ModuleConfig } from '@tempot/module-registry';

/** Operation mode for the bot */
export type BotMode = 'polling' | 'webhook';

/** Dependencies passed to each module's setup function (D26 in spec.md) */
export interface ModuleDependencyContainer {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  sessionProvider: SessionProvider;
  i18n: I18nProvider;
  settings: SettingsProvider;
  config: ModuleConfig;
}

/** Module setup function signature — default export from each module's index.ts */
export type ModuleSetupFn = (bot: Bot<Context>, deps: ModuleDependencyContainer) => Promise<void>;

/** Health check subsystem result */
export interface SubsystemCheck {
  status: 'ok' | 'error' | 'degraded';
  latency_ms?: number;
  error?: string;
  [key: string]: unknown;
}

/** Health check response shape (Architecture Spec Section 26.2) */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  checks: {
    database: SubsystemCheck;
    redis: SubsystemCheck;
    ai_provider: SubsystemCheck;
    disk: SubsystemCheck;
    queue_manager: SubsystemCheck;
  };
  version: string;
}

/** Overall health classification rules (D4 in spec.md) */
// database or redis error → unhealthy
// ai_provider or disk error → degraded
// all ok → healthy

/** Static configuration loaded from environment */
export interface BotServerConfig {
  botToken: string;
  botMode: BotMode;
  port: number;
  webhookUrl?: string;
  webhookSecret?: string;
  superAdminIds: number[];
}

/** Minimal logger interface for startup components */
export interface ModuleLogger {
  info: (data: unknown) => void;
  warn: (data: unknown) => void;
  error: (data: unknown) => void;
  debug: (data: unknown) => void;
  child: (bindings: Record<string, unknown>) => ModuleLogger;
}

/** Minimal event bus interface for modules */
export interface ModuleEventBus {
  publish: (event: string, payload: Record<string, unknown>) => Promise<{ isOk: () => boolean }>;
}

/** Session provider interface for modules */
export interface SessionProvider {
  getSession: (userId: string, chatId: string) => Promise<unknown>;
}

/** i18n provider interface for modules */
export interface I18nProvider {
  t: (key: string, options?: Record<string, unknown>) => string;
}

/** Settings provider interface for modules */
export interface SettingsProvider {
  get: (key: string) => Promise<unknown>;
}

/** A single step in the startup sequence — used for logging and error reporting */
export interface StartupStep {
  /** Step identifier (e.g., 'loadConfig') */
  name: string;
  /** Execution order (1-based, sequential) */
  order: number;
  /** Whether failure in this step halts the application */
  fatal: boolean;
  /** Milliseconds taken to complete — set after step finishes */
  duration?: number;
}

/** A single step in the graceful shutdown sequence with its timeout */
export interface ShutdownStep {
  /** Step identifier (e.g., 'stopHttpServer') */
  name: string;
  /** Execution order (1-based, per Architecture Spec Section 25.3) */
  order: number;
  /** Maximum milliseconds allowed for this step */
  timeout: number;
}
```

### Error Codes

Defined in `src/bot-server.errors.ts`:

```typescript
export const BOT_SERVER_ERRORS = {
  MISSING_BOT_TOKEN: 'bot-server.config.missing_bot_token',
  INVALID_BOT_MODE: 'bot-server.config.invalid_bot_mode',
  MISSING_WEBHOOK_URL: 'bot-server.config.missing_webhook_url',
  MISSING_WEBHOOK_SECRET: 'bot-server.config.missing_webhook_secret',
  INVALID_SUPER_ADMIN_IDS: 'bot-server.config.invalid_super_admin_ids',
  STARTUP_FAILED: 'bot-server.startup.failed',
  CORE_MODULE_HANDLER_FAILED: 'bot-server.module.core_handler_failed',
  MODULE_HANDLER_FAILED: 'bot-server.module.handler_failed',
  MODULE_SETUP_MISSING: 'bot-server.module.setup_missing',
  WEBHOOK_UNAUTHORIZED: 'bot-server.webhook.unauthorized',
  HEALTH_CHECK_TIMEOUT: 'bot-server.health.timeout',
  SUPER_ADMIN_BOOTSTRAP_FAILED: 'bot-server.bootstrap.super_admin_failed',
  CACHE_WARMING_FAILED: 'bot-server.startup.cache_warming_failed',
  DATABASE_UNREACHABLE: 'bot-server.startup.database_unreachable',
} as const;
```

---

### Task 0: Project Scaffolding

**Goal:** Update `apps/bot-server/package.json` with all production dependencies, create the directory structure (`bot/`, `server/`, `startup/`), create type definitions and error codes, and configure TypeScript.

**Files:** Update:

- `apps/bot-server/package.json`
- `apps/bot-server/tsconfig.json`

**Files:** Create:

- `apps/bot-server/src/bot-server.types.ts`
- `apps/bot-server/src/bot-server.errors.ts`
- `apps/bot-server/src/bot/` (directory)
- `apps/bot-server/src/server/` (directory)
- `apps/bot-server/src/server/routes/` (directory)
- `apps/bot-server/src/startup/` (directory)

**Test file:** N/A (infrastructure setup)

**Steps:**

- [ ] Update `package.json` to add all `@tempot/*` workspace dependencies and production deps (hono, @grammyjs/ratelimiter, sanitize-html, rate-limiter-flexible)
- [ ] Add `@types/sanitize-html` to devDependencies
- [ ] Update `tsconfig.json` to include test files exclusion and ensure `outDir: "dist"`, `rootDir: "src"`
- [ ] Create `src/bot-server.types.ts` with all shared type definitions
- [ ] Create `src/bot-server.errors.ts` with all error codes
- [ ] Create empty directory structure for `bot/`, `server/routes/`, `startup/`
- [ ] Verify `pnpm install` succeeds with no phantom dependencies
- [ ] Commit: `chore(bot-server): scaffold production directory structure and dependencies`

---

### Task 1: Static Configuration Loader

**Goal:** Create a configuration loader that reads and validates all required environment variables at startup, returning a typed `BotServerConfig` or a fatal error.

**Files:** Create:

- `apps/bot-server/src/startup/config.loader.ts`
- `apps/bot-server/tests/unit/config.loader.test.ts`

**Test file:** `apps/bot-server/tests/unit/config.loader.test.ts`

**Steps:**

- [ ] Write tests for: missing BOT_TOKEN → error, invalid BOT_MODE → error, valid polling config, valid webhook config (requires WEBHOOK_URL + WEBHOOK_SECRET), SUPER_ADMIN_IDS parsing (comma-separated numbers), empty SUPER_ADMIN_IDS → warning + empty array, invalid SUPER_ADMIN_IDS → error, PORT defaults to 3000
- [ ] Run tests — expect RED (no implementation)
- [ ] Implement `loadConfig(): Result<BotServerConfig, AppError>` that reads env vars and validates
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(bot-server): add static configuration loader with validation`

---

### Task 2: Super Admin Bootstrap

**Goal:** Create a bootstrap function that ensures super admin users exist in the auth-core system with SUPER_ADMIN role before module registration.

**Files:** Create:

- `apps/bot-server/src/startup/bootstrap.ts`
- `apps/bot-server/tests/unit/bootstrap.test.ts`

**Test file:** `apps/bot-server/tests/unit/bootstrap.test.ts`

**Steps:**

- [ ] Write tests for: bootstrap with two IDs → both get SUPER_ADMIN role, bootstrap with empty list → warning logged, bootstrap when IDs already exist → idempotent (no error), bootstrap called before module discovery
- [ ] Run tests — expect RED
- [ ] Implement `bootstrapSuperAdmins(ids: number[], deps: { logger, authSystem }): AsyncResult<void>`
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(bot-server): add super admin bootstrap at startup`

---

### Task 3: Cache Warming

**Goal:** Create a cache warmer that loads system settings and translation strings into cache in the correct order (settings first, then translations).

**Files:** Create:

- `apps/bot-server/src/startup/cache-warmer.ts`
- `apps/bot-server/tests/unit/cache-warmer.test.ts`

**Test file:** `apps/bot-server/tests/unit/cache-warmer.test.ts`

**Steps:**

- [ ] Write tests for: settings warmed first then translations, settings warming failure → warning + continues, translation warming failure → warning + continues, both succeed → returns ok, order is enforced (settings before translations)
- [ ] Run tests — expect RED
- [ ] Implement `warmCaches(deps: { settings, i18n, logger }): AsyncResult<void>`
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(bot-server): add ordered cache warming at startup`

---

### Task 4: Bot Instance & Middleware Pipeline

**Goal:** Create the grammY bot instance factory with the mandatory security middleware chain applied in the correct fixed order.

**Files:** Create:

- `apps/bot-server/src/bot/bot.factory.ts`
- `apps/bot-server/src/bot/middleware/sanitizer.middleware.ts`
- `apps/bot-server/src/bot/middleware/rate-limiter.middleware.ts`
- `apps/bot-server/src/bot/middleware/auth.middleware.ts`
- `apps/bot-server/src/bot/middleware/validation.middleware.ts`
- `apps/bot-server/src/bot/middleware/maintenance.middleware.ts`
- `apps/bot-server/src/bot/middleware/scoped-users.middleware.ts`
- `apps/bot-server/src/bot/middleware/audit.middleware.ts`
- `apps/bot-server/src/bot/error-boundary.ts`
- `apps/bot-server/tests/unit/middleware/sanitizer.middleware.test.ts`
- `apps/bot-server/tests/unit/middleware/rate-limiter.middleware.test.ts`
- `apps/bot-server/tests/unit/middleware/auth.middleware.test.ts`
- `apps/bot-server/tests/unit/middleware/maintenance.middleware.test.ts`
- `apps/bot-server/tests/unit/middleware/scoped-users.middleware.test.ts`
- `apps/bot-server/tests/unit/middleware/audit.middleware.test.ts`
- `apps/bot-server/tests/unit/error-boundary.test.ts`

**Test file:** Multiple test files (see above)

**Steps:**

- [ ] Write tests for sanitizer middleware: strips dangerous HTML content, passes clean content through
- [ ] Write tests for rate limiter middleware: blocks requests over limit, allows requests under limit
- [ ] Write tests for auth middleware: allows authorized users, blocks unauthorized users with localized message
- [ ] Write tests for maintenance middleware: blocks non-admin users when enabled, allows SUPER_ADMIN, passes all through when disabled
- [ ] Write tests for scoped users middleware: blocks unlisted users, allows listed users, skips when scopedUsers is undefined/empty, blocks SUPER_ADMIN if not in list
- [ ] Write tests for audit middleware: logs request result with user ID and action
- [ ] Write tests for error boundary: catches unhandled errors, generates ERR-YYYYMMDD-XXXX reference, logs full error, sends localized message, emits system.error event, reports to Sentry when enabled
- [ ] Run all tests — expect RED
- [ ] Implement each middleware as a grammY middleware function
- [ ] Implement error boundary using `bot.catch()` with `generateErrorReference()` from `@tempot/shared`
- [ ] Implement bot factory that creates Bot instance and applies middleware in fixed order
- [ ] Run all tests — expect GREEN
- [ ] Commit: `feat(bot-server): add security middleware chain and error boundary`

**Note:** This is the largest task. The middleware chain order MUST be: sanitizer → rate limiter → maintenance → auth → scoped users → validation → handler → audit. Maintenance mode check is positioned after rate limiting but before auth because we want to rate-limit even during maintenance (prevent abuse), but intercept before any auth or business logic processing.

---

### Task 5: Module Handler Loader

**Goal:** Create the module handler loading system that dynamically imports each validated module's entry point and calls its setup function.

**Files:** Create:

- `apps/bot-server/src/startup/module-loader.ts`
- `apps/bot-server/tests/unit/module-loader.test.ts`

**Test file:** `apps/bot-server/tests/unit/module-loader.test.ts`

**Steps:**

- [ ] Write tests for: loads valid module setup function, core module failure → returns fatal error, non-core module failure → logs warning + continues, module without default export → error, setup function receives correct dependency container, all valid modules loaded → returns list of loaded module names
- [ ] Run tests — expect RED
- [ ] Implement `loadModuleHandlers(bot, modules: ValidatedModule[], deps): AsyncResult<string[]>` that dynamically imports each module and calls setup
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(bot-server): add dynamic module handler loader`

---

### Task 6: HTTP Server (Webhook + Health Check)

**Goal:** Create the Hono HTTP server with webhook endpoint (verification) and health check endpoint (subsystem probing).

**Files:** Create:

- `apps/bot-server/src/server/hono.factory.ts`
- `apps/bot-server/src/server/routes/webhook.route.ts`
- `apps/bot-server/src/server/routes/health.route.ts`
- `apps/bot-server/tests/unit/routes/webhook.route.test.ts`
- `apps/bot-server/tests/unit/routes/health.route.test.ts`

**Test file:** Multiple test files (see above)

**Steps:**

- [ ] Write tests for webhook route: valid secret → 200, missing secret → 401, wrong secret → 401, non-POST → 405, non-JSON body → 400
- [ ] Write tests for health route: all systems OK → healthy, DB down → unhealthy, AI down → degraded, disk low → degraded, includes latency_ms for each subsystem, includes version and uptime, timeout within 5 seconds
- [ ] Run tests — expect RED
- [ ] Implement webhook route with `X-Telegram-Bot-Api-Secret-Token` header verification
- [ ] Implement health route with subsystem probing and classification logic
- [ ] Implement Hono factory that creates app instance and registers routes based on bot mode
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(bot-server): add HTTP server with webhook and health check routes`

---

### Task 7: Graceful Shutdown

**Goal:** Create the shutdown sequence that uses `ShutdownManager` from `@tempot/shared` to register hooks in the correct order with per-step timeouts.

**Files:** Create:

- `apps/bot-server/src/startup/shutdown.ts`
- `apps/bot-server/tests/unit/shutdown.test.ts`

**Test file:** `apps/bot-server/tests/unit/shutdown.test.ts`

**Steps:**

- [ ] Write tests for: hooks registered in correct order (HTTP → bot → queues → cache → primary DB → vector DB → log), SIGTERM triggers shutdown, SIGINT triggers shutdown, emits system.shutdown.initiated and system.shutdown.completed events, second SIGTERM is ignored
- [ ] Run tests — expect RED
- [ ] Implement `registerShutdownHooks(shutdownManager, deps): void` that registers hooks in Architecture Spec Section 25.3 order
- [ ] Implement signal handler registration that calls `shutdownManager.execute()` on SIGTERM/SIGINT
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(bot-server): add graceful shutdown with ordered resource cleanup`

---

### Task 8: Startup Orchestrator & Entry Point

**Goal:** Create the main startup orchestrator that calls all initialization steps in order, emits lifecycle events, and replaces the prototype entry point.

**Files:** Create:

- `apps/bot-server/src/startup/orchestrator.ts`
- `apps/bot-server/tests/unit/orchestrator.test.ts`

**Files:** Update:

- `apps/bot-server/src/index.ts` (replace prototype)

**Test file:** `apps/bot-server/tests/unit/orchestrator.test.ts`

**Steps:**

- [ ] Write tests for: full startup sequence in correct order, fatal on missing config, fatal on database unreachable, fatal on core module failure, warning on non-core failure + continues, emits system.startup.completed with duration and module count, startup completes within 30s timeout check
- [ ] Run tests — expect RED
- [ ] Implement startup orchestrator that calls steps in order: loadConfig → connectDatabase → bootstrapSuperAdmins → warmCaches → discovery → validation → loadModuleHandlers → registerCommands → startHttpServer → emit startup event
- [ ] Replace `src/index.ts` with production entry point that creates dependencies and calls orchestrator
- [ ] Delete the prototype comments and code
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(bot-server): add startup orchestrator and replace prototype entry point`

---

### Task 9: Lifecycle Events

**Goal:** Add system lifecycle event definitions to event-bus and ensure the startup orchestrator, shutdown handler, and error boundary emit them correctly.

**Files:** Update:

- `packages/event-bus/src/event-bus.events.ts` (add system lifecycle events)

**Files:** Create:

- `apps/bot-server/tests/unit/lifecycle-events.test.ts`

**Test file:** `apps/bot-server/tests/unit/lifecycle-events.test.ts`

**Steps:**

- [ ] Add event type definitions for `system.startup.completed`, `system.shutdown.initiated`, `system.shutdown.completed`, `system.error` to TempotEvents interface
- [ ] Write tests verifying events are emitted with correct payloads (duration, module count, mode, reason, reference code)
- [ ] Run tests — expect GREEN (events should already be emitted by orchestrator, shutdown, and error boundary from earlier tasks)
- [ ] Commit: `feat(bot-server): add system lifecycle event definitions`

---

### Task 10: Integration Tests

**Goal:** Write integration tests that verify the full startup sequence with mocked dependencies.

**Files:** Create:

- `apps/bot-server/tests/integration/startup-sequence.test.ts`

**Test file:** `apps/bot-server/tests/integration/startup-sequence.test.ts`

**Steps:**

- [ ] Write integration test: full startup with mocked packages → all steps execute in order
- [ ] Write integration test: startup with core module failure → halts at the correct step
- [ ] Write integration test: startup with non-core module failure → continues past failure
- [ ] Write integration test: startup in polling mode → no webhook route, health check available
- [ ] Write integration test: startup in webhook mode → webhook + health check routes available
- [ ] Verify all tests pass
- [ ] Commit: `test(bot-server): add integration tests for startup sequence`

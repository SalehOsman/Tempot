# Bot Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 72-line bot-server prototype (`apps/bot-server/src/index.ts`) with a production-grade application that assembles all infrastructure packages and business modules into a running Telegram bot with an HTTP server.

**Architecture:** Three-directory structure: `src/bot/` (bot instance + middleware pipeline), `src/server/` (HTTP server + routes), `src/startup/` (bootstrap, cache warming, shutdown, module loading, orchestration). Thin entry point calls startup orchestrator.

**Tech Stack:** grammY 1.41.1, Hono 4.x, @grammyjs/ratelimiter, sanitize-html, rate-limiter-flexible, all @tempot/\* packages, Vitest 4.1.0, TypeScript 5.9.3 Strict Mode, neverthrow 8.2.0.

**Key References:**

- Spec: `specs/020-bot-server/spec.md`
- Design doc: `docs/superpowers/specs/2026-04-05-bot-server-design.md`
- Plan: `specs/020-bot-server/plan.md`
- Tasks: `specs/020-bot-server/tasks.md`
- Data model: `specs/020-bot-server/data-model.md`
- Research: `specs/020-bot-server/research.md`
- Constitution: `.specify/memory/constitution.md`

**Design Decisions (from design doc):**

- DC-1: CacheAdapter gap → thin wrapper with get+set TTL refresh for `expire`
- DC-2: Super admin bootstrap → direct Prisma upsert (no ensureRole in auth-core)
- DC-3: Auth middleware → build CASL ability with SUPER_ADMIN manage-all rule
- DC-4: Scoped users → command-to-module Map, O(1) lookup
- DC-5: i18n init → `i18next.init(i18nConfig)` then `loadModuleLocales()`
- DC-6: Lifecycle events → 4 inline payload events in TempotEvents
- DC-7: DB connectivity → `prisma.$queryRaw(SELECT 1)` fail-fast
- DC-8: Health probes → `Promise.allSettled` + per-probe timeouts
- DC-9: Validation middleware → pass-through with optional Zod schema map
- DC-10: Audit middleware → best-effort via AuditLogger
- DC-11: ESM module format
- DC-12: ~80+ test cases across unit and integration tests

---

## File Structure

```
apps/bot-server/
├── src/
│   ├── index.ts                          # Thin entry point (replace prototype)
│   ├── bot-server.types.ts               # Shared type definitions
│   ├── bot-server.errors.ts              # Error code constants
│   ├── bot/
│   │   ├── bot.factory.ts                # Creates Bot + applies middleware
│   │   ├── error-boundary.ts             # bot.catch() handler
│   │   └── middleware/
│   │       ├── sanitizer.middleware.ts
│   │       ├── rate-limiter.middleware.ts
│   │       ├── maintenance.middleware.ts
│   │       ├── auth.middleware.ts
│   │       ├── scoped-users.middleware.ts
│   │       ├── validation.middleware.ts
│   │       └── audit.middleware.ts
│   ├── server/
│   │   ├── hono.factory.ts
│   │   └── routes/
│   │       ├── webhook.route.ts
│   │       └── health.route.ts
│   └── startup/
│       ├── config.loader.ts
│       ├── bootstrap.ts
│       ├── cache-warmer.ts
│       ├── module-loader.ts
│       ├── shutdown.ts
│       └── orchestrator.ts
├── tests/
│   ├── unit/
│   │   ├── config.loader.test.ts
│   │   ├── bootstrap.test.ts
│   │   ├── cache-warmer.test.ts
│   │   ├── module-loader.test.ts
│   │   ├── shutdown.test.ts
│   │   ├── orchestrator.test.ts
│   │   ├── error-boundary.test.ts
│   │   ├── lifecycle-events.test.ts
│   │   ├── middleware/
│   │   │   ├── sanitizer.middleware.test.ts
│   │   │   ├── rate-limiter.middleware.test.ts
│   │   │   ├── auth.middleware.test.ts
│   │   │   ├── maintenance.middleware.test.ts
│   │   │   ├── scoped-users.middleware.test.ts
│   │   │   └── audit.middleware.test.ts
│   │   └── routes/
│   │       ├── webhook.route.test.ts
│   │       └── health.route.test.ts
│   └── integration/
│       └── startup-sequence.test.ts
├── vitest.config.ts
├── package.json (update)
└── tsconfig.json (update)

Modified files outside apps/bot-server/:
└── packages/event-bus/src/event-bus.events.ts  # Add 4 lifecycle events (Task 9)
```

---

### Task 0: Project Scaffolding

**Goal:** Update package.json with all dependencies, create directory structure, type definitions, error codes, and vitest config.

**Files:**

- Update: `apps/bot-server/package.json`
- Update: `apps/bot-server/tsconfig.json`
- Create: `apps/bot-server/vitest.config.ts`
- Create: `apps/bot-server/src/bot-server.types.ts`
- Create: `apps/bot-server/src/bot-server.errors.ts`
- Create: `apps/bot-server/src/bot/` (directory)
- Create: `apps/bot-server/src/server/routes/` (directory)
- Create: `apps/bot-server/src/startup/` (directory)

- [ ] **Step 1: Update package.json dependencies** (~3 min)

Add all `@tempot/*` workspace dependencies and production deps to `apps/bot-server/package.json`:

```json
{
  "dependencies": {
    "grammy": "1.41.1",
    "hono": "^4.7.11",
    "@hono/node-server": "^1.14.4",
    "@grammyjs/ratelimiter": "^1.2.0",
    "sanitize-html": "^2.15.0",
    "rate-limiter-flexible": "^5.0.4",
    "@tempot/shared": "workspace:*",
    "@tempot/logger": "workspace:*",
    "@tempot/event-bus": "workspace:*",
    "@tempot/auth-core": "workspace:*",
    "@tempot/session-manager": "workspace:*",
    "@tempot/settings": "workspace:*",
    "@tempot/i18n-core": "workspace:*",
    "@tempot/database": "workspace:*",
    "@tempot/module-registry": "workspace:*",
    "@tempot/sentry": "workspace:*",
    "@tempot/ux-helpers": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/sanitize-html": "^2.13.0",
    "tsx": "^4.0.0",
    "vitest": "^4.1.0"
  }
}
```

Also add scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: Update tsconfig.json** (~1 min)

Ensure `outDir: "dist"`, `rootDir: "src"`, `composite: true`. Add `exclude: ["tests", "vitest.config.ts"]` if not already present.

- [ ] **Step 3: Create vitest.config.ts** (~2 min)

Follow the pattern from other packages (e.g., `packages/settings/vitest.config.ts`). Reference the monorepo base config.

- [ ] **Step 4: Create directory structure** (~1 min)

```
mkdir -p src/bot/middleware src/server/routes src/startup tests/unit/middleware tests/unit/routes tests/integration
```

- [ ] **Step 5: Create bot-server.types.ts** (~3 min)

Copy type definitions from plan.md's "Shared Type Definitions" section. Types: `BotMode`, `BotServerConfig`, `ModuleDependencyContainer`, `ModuleSetupFn`, `SubsystemCheck`, `HealthCheckResponse`, `ModuleLogger`, `ModuleEventBus`, `SessionProvider`, `I18nProvider`, `SettingsProvider`, `StartupStep`, `ShutdownStep`.

- [ ] **Step 6: Create bot-server.errors.ts** (~1 min)

Copy error codes from plan.md's "Error Codes" section. 14 error codes as `const` object.

- [ ] **Step 7: Run pnpm install and verify** (~2 min)

```bash
pnpm install
```

Verify no phantom dependency errors. Verify TypeScript compiles the type and error files.

- [ ] **Step 8: Commit** (~1 min)

```
git add -A
git commit -m "chore(bot-server): scaffold production directory structure and dependencies"
```

---

### Task 1: Static Configuration Loader

**Goal:** Create a config loader that reads/validates environment variables, returning typed `BotServerConfig` or fatal error.

**Files:**

- Create: `apps/bot-server/src/startup/config.loader.ts`
- Create: `apps/bot-server/tests/unit/config.loader.test.ts`

- [ ] **Step 1: Write config loader tests** (~5 min)

Create `tests/unit/config.loader.test.ts` with tests:

1. Missing BOT_TOKEN → returns err with MISSING_BOT_TOKEN code
2. Invalid BOT_MODE (not polling/webhook) → returns err with INVALID_BOT_MODE code
3. Valid polling config → returns ok with correct BotServerConfig
4. Valid webhook config with WEBHOOK_URL + WEBHOOK_SECRET → returns ok
5. BOT_MODE=webhook without WEBHOOK_URL → returns err
6. BOT_MODE=webhook without WEBHOOK_SECRET → returns err
7. SUPER_ADMIN_IDS parsing: "123,456" → [123, 456]
8. Invalid SUPER_ADMIN_IDS (non-numeric) → returns err
9. Empty/missing SUPER_ADMIN_IDS → returns ok with empty array + warning logged
10. PORT defaults to 3000 when not set
11. PORT=8080 → port: 8080

Use `vi.stubEnv()` for environment variable mocking.

- [ ] **Step 2: Run tests — expect RED** (~1 min)

```bash
cd apps/bot-server && pnpm vitest run tests/unit/config.loader.test.ts
```

All tests should fail (no implementation).

- [ ] **Step 3: Implement config loader** (~5 min)

Create `src/startup/config.loader.ts`:

- `loadConfig(): Result<BotServerConfig, AppError>` — reads env vars, validates each field
- Uses `BOT_SERVER_ERRORS` for error codes
- Returns `ok(config)` or `err(new AppError(code, details))`
- No `any` types, no console.\*, max 50 lines per function

- [ ] **Step 4: Run tests — expect GREEN** (~1 min)

```bash
cd apps/bot-server && pnpm vitest run tests/unit/config.loader.test.ts
```

All tests should pass.

- [ ] **Step 5: Commit** (~1 min)

```
git add -A
git commit -m "feat(bot-server): add static configuration loader with validation"
```

---

### Task 2: Super Admin Bootstrap

**Goal:** Create bootstrap function that ensures super admin users exist with SUPER_ADMIN role before module registration.

**Files:**

- Create: `apps/bot-server/src/startup/bootstrap.ts`
- Create: `apps/bot-server/tests/unit/bootstrap.test.ts`

- [ ] **Step 1: Write bootstrap tests** (~4 min)

Create `tests/unit/bootstrap.test.ts` with tests:

1. Bootstrap with two IDs → both get SUPER_ADMIN role (verify Prisma upsert called twice with correct args)
2. Bootstrap with empty list → warning logged, returns ok
3. Bootstrap when IDs already exist → idempotent (no error)
4. Bootstrap called before module discovery (ordering assertion — mock verifies no module calls happened)
5. Prisma error during upsert → returns err with SUPER_ADMIN_BOOTSTRAP_FAILED code

Mock the Prisma client with `vi.fn()`.

- [ ] **Step 2: Run tests — expect RED** (~1 min)

- [ ] **Step 3: Implement bootstrap** (~4 min)

Create `src/startup/bootstrap.ts`:

- `bootstrapSuperAdmins(ids, deps: { prisma, logger }): AsyncResult<void>` — per DC-2 from design doc
- For each ID: `prisma.session.upsert({ where: { userId_chatId: { userId: String(id), chatId: String(id) } }, update: { role: 'SUPER_ADMIN' }, create: { userId: String(id), chatId: String(id), role: 'SUPER_ADMIN', status: 'ACTIVE', language: 'ar-EG' } })`
- Empty list → log warning, return ok
- Wrap in try/catch → return err on failure

- [ ] **Step 4: Run tests — expect GREEN** (~1 min)

- [ ] **Step 5: Commit** (~1 min)

```
git add -A
git commit -m "feat(bot-server): add super admin bootstrap at startup"
```

---

### Task 3: Cache Warming

**Goal:** Create cache warmer that loads settings then translations into cache.

**Files:**

- Create: `apps/bot-server/src/startup/cache-warmer.ts`
- Create: `apps/bot-server/tests/unit/cache-warmer.test.ts`

- [ ] **Step 1: Write cache warmer tests** (~4 min)

Create `tests/unit/cache-warmer.test.ts` with tests:

1. Both succeed → returns ok
2. Settings warming failure → logs warning, continues to translations, returns ok
3. Translation warming failure → logs warning, returns ok
4. Both fail → logs two warnings, returns ok
5. Order enforced: settings callback called before translations callback

Mock settings and i18n dependencies.

- [ ] **Step 2: Run tests — expect RED** (~1 min)

- [ ] **Step 3: Implement cache warmer** (~3 min)

Create `src/startup/cache-warmer.ts`:

- `warmCaches(deps: { settingsService, i18n, logger }): AsyncResult<void>`
- Step 1: warm settings (e.g., `settingsService.loadAll()` or equivalent)
- Step 2: warm translations (e.g., `i18next.init(i18nConfig)` + `loadModuleLocales()`)
- Each step wrapped in try/catch — failure logs warning but continues

- [ ] **Step 4: Run tests — expect GREEN** (~1 min)

- [ ] **Step 5: Commit** (~1 min)

```
git add -A
git commit -m "feat(bot-server): add ordered cache warming at startup"
```

---

### Task 4: Bot Instance & Middleware Pipeline

**Goal:** Create bot factory with the mandatory 8-step security middleware chain and error boundary. This is the largest task — broken into sub-steps.

**Files (middleware):**

- Create: `apps/bot-server/src/bot/middleware/sanitizer.middleware.ts`
- Create: `apps/bot-server/src/bot/middleware/rate-limiter.middleware.ts`
- Create: `apps/bot-server/src/bot/middleware/maintenance.middleware.ts`
- Create: `apps/bot-server/src/bot/middleware/auth.middleware.ts`
- Create: `apps/bot-server/src/bot/middleware/scoped-users.middleware.ts`
- Create: `apps/bot-server/src/bot/middleware/validation.middleware.ts`
- Create: `apps/bot-server/src/bot/middleware/audit.middleware.ts`
- Create: `apps/bot-server/src/bot/error-boundary.ts`
- Create: `apps/bot-server/src/bot/bot.factory.ts`

**Test files:**

- Create: `apps/bot-server/tests/unit/middleware/sanitizer.middleware.test.ts`
- Create: `apps/bot-server/tests/unit/middleware/rate-limiter.middleware.test.ts`
- Create: `apps/bot-server/tests/unit/middleware/maintenance.middleware.test.ts`
- Create: `apps/bot-server/tests/unit/middleware/auth.middleware.test.ts`
- Create: `apps/bot-server/tests/unit/middleware/scoped-users.middleware.test.ts`
- Create: `apps/bot-server/tests/unit/middleware/audit.middleware.test.ts`
- Create: `apps/bot-server/tests/unit/error-boundary.test.ts`

#### Sub-task 4a: Sanitizer Middleware

- [ ] **Step 1: Write sanitizer tests** (~3 min)

Tests:

1. Strips dangerous HTML (e.g., `<script>alert('xss')</script>` → empty string or text only)
2. Passes clean text through unchanged
3. Handles non-text messages (no text field) without error

- [ ] **Step 2: Run tests — expect RED** (~1 min)

- [ ] **Step 3: Implement sanitizer middleware** (~3 min)

Uses `sanitize-html` to strip dangerous content from `ctx.message?.text` and `ctx.message?.caption`. Calls `next()` after sanitization.

- [ ] **Step 4: Run tests — expect GREEN** (~1 min)

#### Sub-task 4b: Rate Limiter Middleware

- [ ] **Step 5: Write rate limiter tests** (~3 min)

Tests:

1. Blocks requests over limit (mock @grammyjs/ratelimiter)
2. Allows requests under limit
3. Sends localized rate limit message when blocked

- [ ] **Step 6: Run tests — expect RED** (~1 min)

- [ ] **Step 7: Implement rate limiter middleware** (~3 min)

Wraps `@grammyjs/ratelimiter` plugin. Configures per-scope limits from spec (30/min messages, 10/min commands, etc.).

- [ ] **Step 8: Run tests — expect GREEN** (~1 min)

#### Sub-task 4c: Maintenance Middleware

- [ ] **Step 9: Write maintenance tests** (~3 min)

Tests:

1. Blocks non-admin users when maintenance enabled → localized maintenance message
2. Allows SUPER_ADMIN through when maintenance enabled
3. Passes all through when maintenance disabled

- [ ] **Step 10: Run tests — expect RED** (~1 min)

- [ ] **Step 11: Implement maintenance middleware** (~3 min)

Reads maintenance status from `MaintenanceService.getStatus()`. If enabled, checks if user is SUPER_ADMIN. If not, replies with localized maintenance message and aborts.

- [ ] **Step 12: Run tests — expect GREEN** (~1 min)

#### Sub-task 4d: Auth Middleware

- [ ] **Step 13: Write auth tests** (~3 min)

Tests:

1. Allows authorized users (ability permits action)
2. Blocks unauthorized users with localized message

- [ ] **Step 14: Run tests — expect RED** (~1 min)

- [ ] **Step 15: Implement auth middleware** (~4 min)

Extracts user session, builds CASL ability via `AbilityFactory.build()`, enforces via `Guard.enforce()`. Defines SUPER_ADMIN manage-all rule per DC-3.

- [ ] **Step 16: Run tests — expect GREEN** (~1 min)

#### Sub-task 4e: Scoped Users Middleware

- [ ] **Step 17: Write scoped users tests** (~4 min)

Tests:

1. Blocks unlisted users from module with scopedUsers
2. Allows listed users
3. Skips when scopedUsers is undefined/empty
4. Blocks SUPER_ADMIN if not in list (D13 in spec.md)

- [ ] **Step 18: Run tests — expect RED** (~1 min)

- [ ] **Step 19: Implement scoped users middleware** (~3 min)

Uses command-to-module Map (DC-4). Checks `ctx.from.id` against `module.config.scopedUsers`.

- [ ] **Step 20: Run tests — expect GREEN** (~1 min)

#### Sub-task 4f: Validation Middleware

- [ ] **Step 21: Implement validation middleware** (~2 min)

Pass-through middleware per DC-9. Checks command-to-schema Map. If schema exists, validates; if not, calls `next()`. No separate test file needed — validation is a pass-through in initial implementation. Can be verified in integration tests.

#### Sub-task 4g: Audit Middleware

- [ ] **Step 22: Write audit tests** (~3 min)

Tests:

1. Logs request result with user ID and action after handler completes
2. Handles audit failure gracefully (best-effort, no propagation)

- [ ] **Step 23: Run tests — expect RED** (~1 min)

- [ ] **Step 24: Implement audit middleware** (~3 min)

Uses `AuditLogger.log()` to record action, module, userId, status after handler completes.

- [ ] **Step 25: Run tests — expect GREEN** (~1 min)

#### Sub-task 4h: Error Boundary

- [ ] **Step 26: Write error boundary tests** (~4 min)

Tests:

1. Catches unhandled errors, generates ERR-YYYYMMDD-XXXX reference
2. Logs full error with stack trace
3. Sends localized user-facing message with reference code
4. Emits system.error event
5. Reports to Sentry when enabled, skips when disabled

- [ ] **Step 27: Run tests — expect RED** (~1 min)

- [ ] **Step 28: Implement error boundary** (~4 min)

Uses `bot.catch()`. Calls `generateErrorReference()`, logs via logger, sends localized message via `t()`, emits `system.error` event, optionally reports to Sentry.

- [ ] **Step 29: Run tests — expect GREEN** (~1 min)

#### Sub-task 4i: Bot Factory

- [ ] **Step 30: Implement bot factory** (~3 min)

Creates `Bot` instance, applies middleware in fixed order: sanitizer → rate limiter → maintenance → auth → scoped users → validation → (handler slot) → audit. Sets up error boundary.

- [ ] **Step 31: Run all Task 4 tests** (~1 min)

```bash
cd apps/bot-server && pnpm vitest run tests/unit/middleware tests/unit/error-boundary.test.ts
```

- [ ] **Step 32: Commit** (~1 min)

```
git add -A
git commit -m "feat(bot-server): add security middleware chain and error boundary"
```

---

### Task 5: Module Handler Loader

**Goal:** Create module handler loading system that dynamically imports and calls setup functions.

**Files:**

- Create: `apps/bot-server/src/startup/module-loader.ts`
- Create: `apps/bot-server/tests/unit/module-loader.test.ts`

- [ ] **Step 1: Write module loader tests** (~4 min)

Tests:

1. Loads valid module setup function successfully
2. Core module failure → returns fatal error
3. Non-core module failure → logs warning, continues
4. Module without default export → error
5. Setup function receives correct ModuleDependencyContainer
6. Returns list of loaded module names

Mock `import()` via vi.fn().

- [ ] **Step 2: Run tests — expect RED** (~1 min)

- [ ] **Step 3: Implement module loader** (~5 min)

Create `src/startup/module-loader.ts`:

- `loadModuleHandlers(bot, modules: ValidatedModule[], deps): AsyncResult<string[]>`
- For each module: `const mod = await import(module.path)`, call `mod.default(bot, container)`
- Create `ModuleDependencyContainer` per module with `logger.child({ module: name })`
- Core failure → return err; non-core failure → log warning, skip

- [ ] **Step 4: Run tests — expect GREEN** (~1 min)

- [ ] **Step 5: Commit** (~1 min)

```
git add -A
git commit -m "feat(bot-server): add dynamic module handler loader"
```

---

### Task 6: HTTP Server (Webhook + Health Check)

**Goal:** Create Hono HTTP server with webhook and health check endpoints.

**Files:**

- Create: `apps/bot-server/src/server/hono.factory.ts`
- Create: `apps/bot-server/src/server/routes/webhook.route.ts`
- Create: `apps/bot-server/src/server/routes/health.route.ts`
- Create: `apps/bot-server/tests/unit/routes/webhook.route.test.ts`
- Create: `apps/bot-server/tests/unit/routes/health.route.test.ts`

#### Sub-task 6a: Webhook Route

- [ ] **Step 1: Write webhook route tests** (~4 min)

Tests:

1. Valid secret header → 200
2. Missing secret header → 401
3. Wrong secret header → 401
4. Non-POST method → 405
5. Non-JSON body → 400

- [ ] **Step 2: Run tests — expect RED** (~1 min)

- [ ] **Step 3: Implement webhook route** (~4 min)

Verifies `X-Telegram-Bot-Api-Secret-Token` header against configured secret. On success, passes body to bot's `handleUpdate()`.

- [ ] **Step 4: Run tests — expect GREEN** (~1 min)

#### Sub-task 6b: Health Route

- [ ] **Step 5: Write health route tests** (~4 min)

Tests:

1. All systems OK → healthy
2. DB down → unhealthy
3. AI down → degraded
4. Includes latency_ms for each subsystem
5. Includes version and uptime

- [ ] **Step 6: Run tests — expect RED** (~1 min)

- [ ] **Step 7: Implement health route** (~5 min)

Per DC-8: `Promise.allSettled()` with per-probe timeouts. Classification logic: DB/Redis error → unhealthy, AI/Disk error → degraded.

- [ ] **Step 8: Run tests — expect GREEN** (~1 min)

#### Sub-task 6c: Hono Factory

- [ ] **Step 9: Implement Hono factory** (~3 min)

Creates Hono app, registers health route (always), webhook route (webhook mode only).

- [ ] **Step 10: Run all Task 6 tests** (~1 min)

- [ ] **Step 11: Commit** (~1 min)

```
git add -A
git commit -m "feat(bot-server): add HTTP server with webhook and health check routes"
```

---

### Task 7: Graceful Shutdown

**Goal:** Create shutdown handler using ShutdownManager from @tempot/shared.

**Files:**

- Create: `apps/bot-server/src/startup/shutdown.ts`
- Create: `apps/bot-server/tests/unit/shutdown.test.ts`

- [ ] **Step 1: Write shutdown tests** (~4 min)

Tests:

1. Hooks registered in correct order (HTTP → bot → queues → cache → primary DB → vector DB → log)
2. SIGTERM triggers shutdownManager.execute()
3. SIGINT triggers the same shutdown sequence
4. Emits system.shutdown.initiated and system.shutdown.completed events
5. Second signal is ignored while shutdown is in progress

- [ ] **Step 2: Run tests — expect RED** (~1 min)

- [ ] **Step 3: Implement shutdown handler** (~4 min)

Create `src/startup/shutdown.ts`:

- `registerShutdownHooks(shutdownManager, deps)` — registers 7 hooks in Architecture Spec Section 25.3 order
- `setupSignalHandlers(shutdownManager, deps)` — listens for SIGTERM/SIGINT, calls `shutdownManager.execute()`, ignores duplicates via a `shuttingDown` flag

- [ ] **Step 4: Run tests — expect GREEN** (~1 min)

- [ ] **Step 5: Commit** (~1 min)

```
git add -A
git commit -m "feat(bot-server): add graceful shutdown with ordered resource cleanup"
```

---

### Task 8: Startup Orchestrator & Entry Point

**Goal:** Create main orchestrator calling all steps in order. Replace prototype entry point.

**Files:**

- Create: `apps/bot-server/src/startup/orchestrator.ts`
- Create: `apps/bot-server/tests/unit/orchestrator.test.ts`
- Update: `apps/bot-server/src/index.ts` (replace prototype)

- [ ] **Step 1: Write orchestrator tests** (~5 min)

Tests:

1. Full startup sequence in correct order (all step mocks called in sequence)
2. Fatal on missing config
3. Fatal on database unreachable
4. Fatal on core module validation failure
5. Fatal on core module handler failure
6. Warning on non-core failure + continues
7. Emits system.startup.completed with durationMs, modulesLoaded, mode

Mock all dependencies (config loader, bootstrap, cache warmer, module loader, etc.).

- [ ] **Step 2: Run tests — expect RED** (~1 min)

- [ ] **Step 3: Implement orchestrator** (~5 min)

Create `src/startup/orchestrator.ts`:

- `startApplication(deps): AsyncResult<void>` — calls steps in order
- Steps: loadConfig → connectDatabase → bootstrapSuperAdmins → warmCaches → discover → validate → loadModuleHandlers → register(bot) → startHttpServer → emit startup event
- Each step timed and logged
- Fatal steps return err immediately; non-fatal steps log and continue

- [ ] **Step 4: Replace entry point** (~3 min)

Replace `src/index.ts` with thin shell:

- Creates real dependency instances
- Calls `startApplication(deps)`
- On failure: logs error, calls `process.exit(1)`

- [ ] **Step 5: Run tests — expect GREEN** (~1 min)

- [ ] **Step 6: Commit** (~1 min)

```
git add -A
git commit -m "feat(bot-server): add startup orchestrator and replace prototype entry point"
```

---

### Task 9: Lifecycle Event Definitions

**Goal:** Add lifecycle event types to event-bus and verify they are emitted correctly.

**Files:**

- Update: `packages/event-bus/src/event-bus.events.ts`
- Create: `apps/bot-server/tests/unit/lifecycle-events.test.ts`

- [ ] **Step 1: Add event definitions to TempotEvents** (~2 min)

Add to `packages/event-bus/src/event-bus.events.ts`:

```typescript
'system.startup.completed': {
  durationMs: number;
  modulesLoaded: number;
  mode: string;
};
'system.shutdown.initiated': {
  reason: string;
};
'system.shutdown.completed': {
  durationMs: number;
};
'system.error': {
  referenceCode: string;
  errorCode: string;
  module?: string;
};
```

- [ ] **Step 2: Write lifecycle event tests** (~3 min)

Create `tests/unit/lifecycle-events.test.ts`:

1. system.startup.completed emitted with correct payload
2. system.shutdown.initiated emitted with reason
3. system.shutdown.completed emitted with durationMs
4. system.error emitted with referenceCode and errorCode

These events should already be emitted by orchestrator, shutdown, and error boundary from earlier tasks. Tests verify the payloads match the type definitions.

- [ ] **Step 3: Run tests — expect GREEN** (~1 min)

- [ ] **Step 4: Commit** (~1 min)

```
git add -A
git commit -m "feat(bot-server): add system lifecycle event definitions"
```

---

### Task 10: Integration Tests

**Goal:** Write integration tests verifying the full startup sequence with mocked dependencies.

**Files:**

- Create: `apps/bot-server/tests/integration/startup-sequence.test.ts`

- [ ] **Step 1: Write integration tests** (~5 min)

Tests:

1. Full startup with mocked packages → all steps execute in order
2. Startup with core module failure → halts at the correct step
3. Startup with non-core module failure → continues past failure
4. Startup in polling mode → no webhook route, health check available
5. Startup in webhook mode → webhook + health check routes available

- [ ] **Step 2: Run all tests** (~2 min)

```bash
cd apps/bot-server && pnpm vitest run
```

All tests (unit + integration) should pass.

- [ ] **Step 3: Commit** (~1 min)

```
git add -A
git commit -m "test(bot-server): add integration tests for startup sequence"
```

---

## Summary

| Task | Name                     | Steps  | Est. Time   |
| ---- | ------------------------ | ------ | ----------- |
| 0    | Project Scaffolding      | 8      | 15 min      |
| 1    | Config Loader            | 5      | 13 min      |
| 2    | Super Admin Bootstrap    | 5      | 11 min      |
| 3    | Cache Warming            | 5      | 10 min      |
| 4    | Middleware Chain + Error | 32     | 60 min      |
| 5    | Module Handler Loader    | 5      | 12 min      |
| 6    | HTTP Server              | 11     | 25 min      |
| 7    | Graceful Shutdown        | 5      | 11 min      |
| 8    | Startup Orchestrator     | 6      | 16 min      |
| 9    | Lifecycle Events         | 4      | 7 min       |
| 10   | Integration Tests        | 3      | 8 min       |
|      | **Total**                | **89** | **188 min** |

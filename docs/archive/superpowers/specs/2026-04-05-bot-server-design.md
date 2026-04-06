# Design Spec — bot-server (Application Entry Point & Assembly Layer)

## 1. Overview

The `bot-server` application is the final assembly layer of Tempot. It replaces the existing 72-line prototype at `apps/bot-server/src/index.ts` with a production-grade application that initializes all `@tempot/*` infrastructure packages and business modules into a running Telegram bot with an HTTP server. It is an APPLICATION (not a library) — it exports nothing, uses the name `bot-server` (no `@tempot/` prefix), and has no `main`/`types`/`exports` fields in `package.json`.

The application follows a three-directory structure: `src/bot/` (bot instance + middleware pipeline), `src/server/` (HTTP server + routes), and `src/startup/` (bootstrap, cache warming, shutdown, module loading, orchestration). The entry point (`src/index.ts`) is a thin shell that creates dependencies and calls the startup orchestrator.

## 2. Architecture & Components

### 2.1 Entry Point (`src/index.ts`)

- Thin shell with zero business logic. Creates real dependency instances and calls the startup orchestrator.
- On orchestrator failure, logs the error and calls `process.exit(1)`.
- On success, the orchestrator keeps the process alive (via HTTP server listen or bot polling).

### 2.2 Startup Orchestrator (`src/startup/orchestrator.ts`)

- Calls initialization steps in strict order: `loadConfig` → `connectDatabase` → `bootstrapSuperAdmins` → `warmCaches` → `discover` → `validate` → `loadModuleHandlers` → `register` → `startHttpServer` → emit `system.startup.completed`.
- Each step is timed and logged.
- Fatal steps (config, database, core module validation/handler) cause immediate halt with `err()`.
- Non-fatal steps (cache warming, non-core modules) log warnings and continue.
- Returns `AsyncResult<void>`.

### 2.3 Config Loader (`src/startup/config.loader.ts`)

- `loadConfig(): Result<BotServerConfig, AppError>` — reads `process.env`, validates, returns typed config.
- Validates: `BOT_TOKEN` (required), `BOT_MODE` (polling|webhook), `PORT` (default 3000), `WEBHOOK_URL` + `WEBHOOK_SECRET` (required in webhook mode), `SUPER_ADMIN_IDS` (comma-separated positive integers, optional).

### 2.4 Super Admin Bootstrap (`src/startup/bootstrap.ts`)

- `bootstrapSuperAdmins(ids, deps): AsyncResult<void>` — ensures each ID has SUPER_ADMIN role.
- Uses Prisma directly to upsert Session records with `role: 'SUPER_ADMIN'` (see Design Concern 2 below).
- Empty list logs warning and returns ok.
- Idempotent — existing super admins are updated without error.

### 2.5 Cache Warmer (`src/startup/cache-warmer.ts`)

- `warmCaches(deps): AsyncResult<void>` — warms settings first, then translations.
- Settings warming failure logs warning and continues (graceful degradation).
- Translation warming failure logs warning and continues.

### 2.6 Module Loader (`src/startup/module-loader.ts`)

- `loadModuleHandlers(bot, modules, deps): AsyncResult<string[]>` — dynamically imports each module's entry point and calls its setup function.
- Core module failure returns fatal error. Non-core module failure logs warning and continues.
- Passes `ModuleDependencyContainer` with scoped child logger per module.

### 2.7 Bot Factory (`src/bot/bot.factory.ts`)

- Creates grammY `Bot` instance with the mandatory 8-step middleware chain.
- Sets up `bot.catch()` error boundary.
- Returns the configured bot instance.

### 2.8 Middleware Pipeline (`src/bot/middleware/`)

Eight middleware files in fixed order:

1. **Sanitizer** — strips dangerous HTML via `sanitize-html`
2. **Rate Limiter** — enforces per-scope limits via `@grammyjs/ratelimiter`
3. **Maintenance** — blocks non-SUPER_ADMIN users when enabled
4. **Auth** — builds CASL ability and enforces permissions
5. **Scoped Users** — enforces per-module user allowlists
6. **Validation** — pass-through slot for per-command Zod validation
7. (Handler — registered by modules, not a middleware file)
8. **Audit** — logs request result via `AuditLogger`

### 2.9 Error Boundary (`src/bot/error-boundary.ts`)

- Uses `bot.catch()` with `generateErrorReference()` from `@tempot/shared`.
- Logs full error with stack trace.
- Sends localized user-facing message with reference code.
- Emits `system.error` event via event bus.
- Reports to Sentry when enabled (via `sentryToggle`).

### 2.10 HTTP Server (`src/server/`)

- Hono factory creates app instance.
- Health route registered in both modes.
- Webhook route registered only in webhook mode.
- Webhook verifies `X-Telegram-Bot-Api-Secret-Token` header.

### 2.11 Shutdown Handler (`src/startup/shutdown.ts`)

- Registers hooks with `ShutdownManager` in Architecture Spec Section 25.3 order.
- Signal handlers (SIGTERM/SIGINT) call `shutdownManager.execute()`.
- Second signal is ignored while shutdown is in progress.

## 3. Design Concerns & Decisions

### DC-1: CacheAdapter Mismatch

**Problem**: `@tempot/session-manager`'s `SessionProvider` requires a `CacheAdapter` with `{ get, set, del, expire }`. `CacheService` from `@tempot/shared` has `{ get, set, del, reset }` — no `expire()` method.

**Decision**: Create a thin adapter wrapper `CacheServiceAdapter` in `src/startup/bootstrap.ts` (or a dedicated `src/adapters/cache.adapter.ts`) that implements `CacheAdapter` by:

- Delegating `get`, `set`, `del` directly to `CacheService`.
- Implementing `expire(key, ttl)` as a read-then-write: `get(key)` → if value exists → `set(key, value, ttl)`. This refreshes the TTL without losing the value.

**Rationale**: This is the minimal adapter that bridges the gap. The `expire` method is only called in `SessionProvider.getSession()` to extend TTL on cache hits. A read+write is safe because sessions are not concurrently modified for the same key (one user, one chat). The adapter is internal to bot-server and not exported.

**Type signature**:

```typescript
import { CacheAdapter } from '@tempot/session-manager';
import { CacheService } from '@tempot/shared';

function createCacheAdapter(cache: CacheService): CacheAdapter;
```

### DC-2: Super Admin Bootstrap Mechanism

**Problem**: `@tempot/auth-core` has NO `ensureRole()` method. It only has `AbilityFactory.build()` and `Guard.enforce()` for runtime authorization checks. There is no API to create or update user roles.

**Decision**: Bootstrap super admins by upserting directly into the `Session` table via Prisma. The `Session` model has a `role` field (default `'GUEST'`). For each super admin ID:

1. Upsert a `Session` record with `userId: String(id)`, `chatId: String(id)` (same value — the "system" chat), `role: 'SUPER_ADMIN'`, `status: 'ACTIVE'`.
2. If the record already exists, update `role` to `'SUPER_ADMIN'` (idempotent).

**Rationale**: This is the only mechanism available. The `Session` model is the source of truth for user roles in the system. Auth-core's `AbilityFactory.build()` takes a `SessionUser` object (which includes `role`) — it reads the role but doesn't write it. The session-manager's `SessionProvider.getSession()` reads from cache/DB and returns the role. By setting the role in the DB at bootstrap, all subsequent auth checks will see SUPER_ADMIN.

**Why not use SessionProvider?**: SessionProvider requires `CacheAdapter` which requires `CacheService` which requires `init()`. At bootstrap time, cache may not be initialized yet (bootstrap happens before cache warming). Using Prisma directly avoids this chicken-and-egg problem.

### DC-3: Auth Middleware Construction

**Problem**: `@tempot/auth-core` provides `AbilityFactory.build(user, definitions[])` and `Guard.enforce(ability, action, subject)`, but no pre-built middleware or SUPER_ADMIN logic.

**Decision**: The auth middleware in bot-server will:

1. Extract the user's session (from session-manager or session context).
2. Build an ability using `AbilityFactory.build(sessionUser, abilityDefinitions)`.
3. For the current command/action, call `Guard.enforce(ability, action, subject)`.
4. If `enforce` returns `err`, reply with a localized unauthorized message and abort.

The `abilityDefinitions` array will include a rule granting `manage all` to `SUPER_ADMIN` role. This is defined in bot-server's auth middleware, not in auth-core. Additional per-module ability definitions can be merged from module configs.

**Rationale**: Auth-core is intentionally generic — it provides the building blocks (CASL wrapper). Bot-server is responsible for defining the actual permission rules that apply to its domain.

### DC-4: Scoped Users Middleware Data Flow

**Problem**: The scoped users middleware needs to know which module a command belongs to, in order to check that module's `scopedUsers` list.

**Decision**: After module handlers are loaded, the bot factory will maintain a `Map<string, ValidatedModule>` mapping command names to their owning modules. The scoped users middleware will:

1. Extract the command from the incoming update (e.g., `/start` → `start`).
2. Look up the owning module in the command-to-module map.
3. If the module has a `scopedUsers` list with entries, check if `ctx.from.id` is in the list.
4. If not in the list, reply with a localized "not authorized" message and abort.
5. If `scopedUsers` is undefined or empty, skip the check and call `next()`.

**Rationale**: The command-to-module mapping is built once during module loading and is O(1) lookup. This is simpler than inspecting module configs at runtime. Non-command updates (messages, callbacks) will pass through the scoped users check unchecked (scoped users only applies to explicit commands).

### DC-5: i18n Initialization

**Problem**: `@tempot/i18n-core` exports `i18nConfig` and `loadModuleLocales()` but the initialization sequence needs to be explicit.

**Decision**: During startup:

1. Call `i18next.init(i18nConfig)` to initialize the i18n system with base configuration.
2. Call `loadModuleLocales()` to load all module translation files.
3. Both calls happen during cache warming (Task 3, step 4b).

At runtime, each incoming update is wrapped in `sessionContext.run()` with the user's locale from their session. The `t()` function reads locale from `sessionContext.getStore()?.locale` automatically.

**Rationale**: This follows the established pattern from i18n-core's own tests and documentation. The `sessionContext` is from `@tempot/shared` and is already used by logger and audit-logger.

### DC-6: Lifecycle Events (Task 9)

**Problem**: Four new events need to be added to `TempotEvents` in `packages/event-bus/src/event-bus.events.ts`.

**Decision**: Add these four events with inline payload types (following DC-5 pattern from settings):

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

**Rationale**: Inline payloads prevent cross-package imports into the event-bus package (which is a low-level dependency). The `mode` field is `string` rather than `BotMode` to avoid importing bot-server types into event-bus.

### DC-7: Database Connectivity Check

**Problem**: The startup sequence must fail fast if the database is unreachable.

**Decision**: Use `prisma.$queryRaw(Prisma.sql\`SELECT 1\`)`wrapped in a try/catch that returns`Result`. If it fails, return `err`with`DATABASE_UNREACHABLE` error code, which is fatal and halts startup.

**Rationale**: `SELECT 1` is the lightest possible query that validates connectivity. `prisma.$connect()` alone may succeed lazily (Prisma uses lazy connections). An explicit query forces an actual connection attempt.

### DC-8: Health Check Subsystem Probing

**Problem**: Health checks must probe 5 subsystems (database, redis, AI, disk, queue) independently with a 5-second total timeout.

**Decision**: Use `Promise.allSettled()` with per-probe `Promise.race()` against a 4-second individual timeout (leaving 1 second for aggregation). Each probe is an independent async function:

- **Database**: `prisma.$queryRaw(Prisma.sql\`SELECT 1\`)` — measures round-trip latency.
- **Redis**: `cache.get('health:ping')` — any cache operation validates connectivity.
- **AI Provider**: Check if AI-core is enabled and has a valid provider. If disabled, return `{ status: 'ok', note: 'disabled' }`.
- **Disk**: `fs.promises.statfs('/')` (or equivalent on Windows) — check free space threshold.
- **Queue Manager**: Check BullMQ connection status via queue factory (if available).

Classification:

- Database or Redis error → `unhealthy`
- AI or Disk error → `degraded`
- All ok → `healthy`

**Rationale**: `Promise.allSettled` ensures one slow probe doesn't block others. Individual timeouts prevent a hung connection from consuming the full 5 seconds.

### DC-9: Validation Middleware (Zod)

**Problem**: Validation middleware needs to be configurable per-command but exists as a fixed slot in the middleware chain.

**Decision**: The validation middleware is a pass-through by default. It checks if the current command has a registered Zod schema (from the module's command configuration). If a schema exists, it validates the command arguments against it. If validation fails, it replies with a localized error message and aborts. If no schema is registered, it calls `next()`.

Modules register their validation schemas during setup by attaching them to a shared `Map<string, ZodSchema>` passed via the dependency container or bot context.

**Rationale**: This keeps the middleware chain intact (all 8 slots always present) while allowing per-command validation. Commands without schemas pass through with zero overhead.

### DC-10: Audit Middleware

**Problem**: The audit middleware needs `AuditLogger` from `@tempot/logger`, which requires `AuditLogRepository` from `@tempot/database`.

**Decision**: The audit middleware receives the `AuditLogger` instance via closure (created during bot factory construction). It logs after the handler completes (it's the last middleware), capturing:

- `action`: the command or update type
- `module`: the owning module name (from command-to-module map)
- `userId`: from `ctx.from.id`
- `userRole`: from session context
- `status`: 'SUCCESS' or 'FAILURE' based on whether the handler threw

The audit log is best-effort — failures are logged but don't propagate to the user.

**Rationale**: Audit logging at the end of the chain captures the final outcome. Using `AuditLogger` directly follows the established pattern from logger tests. Best-effort semantics prevent audit failures from degrading user experience.

### DC-11: ESM Module Format

**Decision**: bot-server uses `"type": "module"` in `package.json`. All local imports use `.js` extensions. Workspace imports use bare specifiers (e.g., `@tempot/shared`).

**Rationale**: All existing packages follow this convention. Consistency is mandatory.

### DC-12: Testing Strategy

**Decision**: Unit tests for each component with mocked dependencies. Integration tests for the full startup sequence. No E2E tests with real Telegram API.

Test files:

- `tests/unit/config.loader.test.ts` — 8+ tests
- `tests/unit/bootstrap.test.ts` — 4+ tests
- `tests/unit/cache-warmer.test.ts` — 4+ tests
- `tests/unit/module-loader.test.ts` — 6+ tests
- `tests/unit/middleware/*.test.ts` — 20+ tests across 7 middleware files
- `tests/unit/error-boundary.test.ts` — 5+ tests
- `tests/unit/routes/webhook.route.test.ts` — 5+ tests
- `tests/unit/routes/health.route.test.ts` — 5+ tests
- `tests/unit/shutdown.test.ts` — 5+ tests
- `tests/unit/orchestrator.test.ts` — 7+ tests
- `tests/unit/lifecycle-events.test.ts` — 4+ tests
- `tests/integration/startup-sequence.test.ts` — 5+ tests

Total: ~80+ test cases.

**Rationale**: bot-server is an application, not a library. Each component is testable in isolation via dependency injection. Integration tests verify orchestration ordering. E2E with real Telegram API is impractical.

## 4. Dependency Wiring

The entry point creates these dependencies in order:

```
1. logger          ← @tempot/logger (singleton)
2. prisma          ← @tempot/database (PrismaClient)
3. eventBus        ← @tempot/event-bus (EventBusOrchestrator)
4. shutdownManager ← @tempot/shared (ShutdownManager)
5. cacheService    ← @tempot/shared (CacheService)
6. cacheAdapter    ← bot-server (CacheServiceAdapter wrapping CacheService)
7. sessionRepo     ← @tempot/session-manager (SessionRepository)
8. sessionProvider ← @tempot/session-manager (SessionProvider)
9. settingsRepo    ← @tempot/settings (SettingsRepository)
10. dynamicSettings ← @tempot/settings (DynamicSettingsService)
11. maintenance     ← @tempot/settings (MaintenanceService)
12. settingsService ← @tempot/settings (SettingsService)
13. auditRepo       ← @tempot/database (AuditLogRepository)
14. auditLogger     ← @tempot/logger (AuditLogger)
15. sentryReporter  ← @tempot/sentry (SentryReporter, optional)
16. moduleRegistry  ← @tempot/module-registry (ModuleRegistry)
17. bot             ← grammy (Bot) + middleware chain
18. honoApp         ← hono (Hono) + routes
```

These are created in the orchestrator and passed to each subsystem initializer.

## 5. File Structure

```
apps/bot-server/
├── src/
│   ├── index.ts                          # Thin entry point
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
│   │   ├── hono.factory.ts               # Creates Hono app + registers routes
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
├── package.json
├── tsconfig.json
└── README.md
```

## 6. Cross-Package Modification

**Only one file outside `apps/bot-server/` is modified:**

`packages/event-bus/src/event-bus.events.ts` — Add 4 lifecycle events to `TempotEvents` interface (DC-6). This is the established pattern for registering events (settings, module-registry, session-manager all follow this).

## 7. Risk Mitigations

| Risk                                       | Mitigation                                            |
| ------------------------------------------ | ----------------------------------------------------- |
| CacheAdapter `expire` gap                  | Thin adapter with get+set TTL refresh (DC-1)          |
| No `ensureRole` in auth-core               | Direct Prisma upsert for bootstrap only (DC-2)        |
| Module-to-command mapping for scoped users | Build once during loading, O(1) lookup (DC-4)         |
| Health check timeout cascade               | `Promise.allSettled` + per-probe timeouts (DC-8)      |
| Audit middleware failure                   | Best-effort — logged but not propagated (DC-10)       |
| i18n not initialized during bootstrap      | Bootstrap uses Prisma directly, no i18n needed (DC-2) |

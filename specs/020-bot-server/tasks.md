# Bot Server — Task Breakdown

**Feature:** 020-bot-server
**Source:** spec.md (Complete) + plan.md + data-model.md + research.md
**Generated:** 2026-04-05

---

## Task 0: Project Scaffolding

**Priority:** P0 (prerequisite for all other tasks)
**Estimated time:** 15 min
**FR:** None (infrastructure)
**Files to update:**

- `apps/bot-server/package.json`
- `apps/bot-server/tsconfig.json`
  **Files to create:**
- `apps/bot-server/src/bot-server.types.ts`
- `apps/bot-server/src/bot-server.errors.ts`
- `apps/bot-server/src/bot/` (directory)
- `apps/bot-server/src/server/` (directory)
- `apps/bot-server/src/server/routes/` (directory)
- `apps/bot-server/src/startup/` (directory)
- `apps/bot-server/vitest.config.ts`
- `apps/bot-server/tests/` (directory)
  **Test file:** N/A (infrastructure setup)

**Note:** bot-server is an APPLICATION in `apps/`, not a package in `packages/`. It uses the existing monorepo workspace but does not export anything. The `package.json` name remains `bot-server` (no `@tempot/` prefix). Add vitest configuration following the pattern from other packages.

**Acceptance criteria:**

- [ ] `package.json` includes all `@tempot/*` workspace dependencies: shared, logger, event-bus, auth-core, session-manager, settings, i18n-core, database, module-registry, sentry, ux-helpers
- [ ] `package.json` includes production deps: grammy 1.41.1, hono 4.x, @grammyjs/ratelimiter, sanitize-html, rate-limiter-flexible
- [ ] `package.json` includes devDependencies: @types/sanitize-html, vitest
- [ ] `tsconfig.json` has `outDir: "dist"`, `rootDir: "src"`, `composite: true` (Rule LXXIV)
- [ ] `bot-server.types.ts` defines: BotMode, BotServerConfig, ModuleDependencyContainer, ModuleSetupFn, SubsystemCheck, HealthCheckResponse, ModuleLogger, ModuleEventBus, SessionProvider, I18nProvider, SettingsProvider
- [ ] `bot-server.errors.ts` defines 14 error codes as `const` object
- [ ] Directory structure created: `bot/`, `server/routes/`, `startup/`
- [ ] `pnpm install` succeeds with no errors
- [ ] No `any` types (Rule I)

---

## Task 1: Static Configuration Loader

**Priority:** P0 (first step in startup sequence)
**Estimated time:** 15 min
**FR:** FR-001, FR-006, FR-010
**Dependencies:** Task 0
**Files to create:**

- `apps/bot-server/src/startup/config.loader.ts`
- `apps/bot-server/tests/unit/config.loader.test.ts`
  **Test file:** `apps/bot-server/tests/unit/config.loader.test.ts`

**Acceptance criteria:**

- [ ] `loadConfig()` returns `Result<BotServerConfig, AppError>` (Rule XXI)
- [ ] Missing `BOT_TOKEN` → returns `err` with `MISSING_BOT_TOKEN` code (FR-001)
- [ ] Invalid `BOT_MODE` (not polling/webhook) → returns `err` with `INVALID_BOT_MODE` code (FR-006)
- [ ] `BOT_MODE=webhook` without `WEBHOOK_URL` → returns `err` (FR-006)
- [ ] `BOT_MODE=webhook` without `WEBHOOK_SECRET` → returns `err` (FR-007)
- [ ] `SUPER_ADMIN_IDS` parsed as comma-separated numbers (FR-010)
- [ ] Invalid `SUPER_ADMIN_IDS` (non-numeric) → returns `err` (D24 in spec.md)
- [ ] Empty/missing `SUPER_ADMIN_IDS` → returns `ok` with empty array + logged warning
- [ ] `PORT` defaults to 3000 when not set (D25 in spec.md)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 8: missing token, invalid mode, valid polling, valid webhook, missing webhook URL, missing webhook secret, SUPER_ADMIN_IDS parsing, port default)

---

## Task 2: Super Admin Bootstrap

**Priority:** P0 (must run before module discovery)
**Estimated time:** 10 min
**FR:** FR-010
**Dependencies:** Task 0, Task 1
**Files to create:**

- `apps/bot-server/src/startup/bootstrap.ts`
- `apps/bot-server/tests/unit/bootstrap.test.ts`
  **Test file:** `apps/bot-server/tests/unit/bootstrap.test.ts`

**Acceptance criteria:**

- [ ] `bootstrapSuperAdmins()` returns `AsyncResult<void>` (Rule XXI)
- [ ] Each ID in the list gets SUPER_ADMIN role in auth-core (FR-010)
- [ ] Empty list → logs warning, returns ok (SC-008)
- [ ] Existing super admin → idempotent update, no error
- [ ] Bootstrap completes before module discovery starts (D8 in spec.md)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 4: two IDs, empty list, already exists, called before discovery)

---

## Task 3: Cache Warming

**Priority:** P1 (startup optimization)
**Estimated time:** 10 min
**FR:** FR-011
**Dependencies:** Task 0
**Files to create:**

- `apps/bot-server/src/startup/cache-warmer.ts`
- `apps/bot-server/tests/unit/cache-warmer.test.ts`
  **Test file:** `apps/bot-server/tests/unit/cache-warmer.test.ts`

**Acceptance criteria:**

- [ ] `warmCaches()` returns `AsyncResult<void>` (Rule XXI)
- [ ] Settings warmed first, then translations (FR-011, D7 in spec.md)
- [ ] Settings warming failure → logs warning, continues (SC-009)
- [ ] Translation warming failure → logs warning, continues
- [ ] Both succeed → returns ok
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 4: both succeed, settings fail, translations fail, order enforced)

---

## Task 4: Security Middleware Chain

**Priority:** P0 (core security requirement)
**Estimated time:** 30 min
**FR:** FR-005, FR-012, FR-014, FR-015
**Dependencies:** Task 0
**Files to create:**

- `apps/bot-server/src/bot/middleware/sanitizer.middleware.ts`
- `apps/bot-server/src/bot/middleware/rate-limiter.middleware.ts`
- `apps/bot-server/src/bot/middleware/auth.middleware.ts`
- `apps/bot-server/src/bot/middleware/maintenance.middleware.ts`
- `apps/bot-server/src/bot/middleware/scoped-users.middleware.ts`
- `apps/bot-server/src/bot/middleware/validation.middleware.ts`
- `apps/bot-server/src/bot/middleware/audit.middleware.ts`
- `apps/bot-server/src/bot/error-boundary.ts`
- `apps/bot-server/src/bot/bot.factory.ts`
- `apps/bot-server/tests/unit/middleware/sanitizer.middleware.test.ts`
- `apps/bot-server/tests/unit/middleware/rate-limiter.middleware.test.ts`
- `apps/bot-server/tests/unit/middleware/auth.middleware.test.ts`
- `apps/bot-server/tests/unit/middleware/maintenance.middleware.test.ts`
- `apps/bot-server/tests/unit/middleware/scoped-users.middleware.test.ts`
- `apps/bot-server/tests/unit/middleware/audit.middleware.test.ts`
- `apps/bot-server/tests/unit/error-boundary.test.ts`

**Test file:** Multiple (see file list above)

**Note:** This is the largest task. Consider splitting into sub-tasks during execution. The middleware order MUST be: sanitizer → rate limiter → maintenance → auth → scoped users → validation → handler → audit. The error boundary uses `bot.catch()`.

**Acceptance criteria:**

- [ ] Sanitizer middleware strips dangerous HTML from text content (FR-005)
- [ ] Rate limiter middleware blocks requests over configured limits (FR-005, D19 in spec.md)
- [ ] Auth middleware blocks unauthorized users with localized message (FR-005)
- [ ] Maintenance middleware blocks non-admin users when enabled, allows SUPER_ADMIN through (FR-014, SC-012)
- [ ] Scoped users middleware blocks unlisted users from restricted modules (FR-015, SC-013)
- [ ] Scoped users middleware blocks SUPER_ADMIN if not in list (D13 in spec.md)
- [ ] Scoped users middleware skips when scopedUsers is undefined/empty (D20 in spec.md)
- [ ] Audit middleware logs request result with user ID and action (FR-005)
- [ ] Error boundary generates ERR-YYYYMMDD-XXXX reference code (FR-012, SC-010)
- [ ] Error boundary logs full error with stack trace (FR-012)
- [ ] Error boundary emits system.error event (FR-013)
- [ ] Error boundary reports to Sentry when enabled, skips when disabled (FR-012)
- [ ] Error boundary sends localized user-facing message with reference code (FR-012, NFR-005)
- [ ] Bot factory applies middleware in the fixed order (SC-004)
- [ ] All user-facing text (error messages, maintenance messages, rate limit messages, unauthorized messages) is localized via i18n — zero hardcoded strings (SC-015, NFR-005)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 20: 2 sanitizer, 2 rate limiter, 2 auth, 3 maintenance, 4 scoped users, 2 audit, 5 error boundary)

---

## Task 5: Module Handler Loader

**Priority:** P0 (core module loading)
**Estimated time:** 15 min
**FR:** FR-003, FR-004
**Dependencies:** Task 0
**Files to create:**

- `apps/bot-server/src/startup/module-loader.ts`
- `apps/bot-server/tests/unit/module-loader.test.ts`
  **Test file:** `apps/bot-server/tests/unit/module-loader.test.ts`

**Acceptance criteria:**

- [ ] `loadModuleHandlers()` returns `AsyncResult<string[]>` (loaded module names) (Rule XXI)
- [ ] Dynamically imports each module's index.ts and calls its default setup function (FR-003, D2 in spec.md)
- [ ] Passes correct ModuleDependencyContainer with scoped child logger (D26 in spec.md)
- [ ] Core module handler failure → returns fatal error (FR-004, SC-002)
- [ ] Non-core module handler failure → logs warning, continues (FR-004, SC-003)
- [ ] Module without default export setup function → error (D2 in spec.md)
- [ ] Returns list of successfully loaded module names
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 6: valid load, core failure, non-core failure, missing setup, correct deps, loaded names)

---

## Task 6: HTTP Server (Webhook + Health Check)

**Priority:** P0 (webhook mode requirement) / P1 (health check)
**Estimated time:** 20 min
**FR:** FR-007, FR-008
**Dependencies:** Task 0
**Files to create:**

- `apps/bot-server/src/server/hono.factory.ts`
- `apps/bot-server/src/server/routes/webhook.route.ts`
- `apps/bot-server/src/server/routes/health.route.ts`
- `apps/bot-server/tests/unit/routes/webhook.route.test.ts`
- `apps/bot-server/tests/unit/routes/health.route.test.ts`
  **Test file:** Multiple (see file list above)

**Acceptance criteria:**

- [ ] Webhook route accepts POST with correct `X-Telegram-Bot-Api-Secret-Token` header → 200 (FR-007, SC-005)
- [ ] Webhook route rejects missing secret header → 401 (FR-007)
- [ ] Webhook route rejects wrong secret header → 401 (FR-007)
- [ ] Webhook route rejects non-POST methods → 405
- [ ] Webhook route rejects non-JSON body → 400
- [ ] Health route returns `healthy` when all subsystems OK (FR-008, SC-006)
- [ ] Health route returns `unhealthy` when DB or Redis down (FR-008, D4 in spec.md)
- [ ] Health route returns `degraded` when AI or disk has issues (FR-008, D4 in spec.md)
- [ ] Health route includes `latency_ms` for each subsystem (FR-008)
- [ ] Health route includes `version` and `uptime` (FR-008)
- [ ] Health route responds within 5 seconds (NFR-003)
- [ ] Hono factory registers health route in both modes, webhook route only in webhook mode (D15, D22 in spec.md)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 10: 5 webhook, 5 health)

---

## Task 7: Graceful Shutdown

**Priority:** P0 (data integrity requirement)
**Estimated time:** 10 min
**FR:** FR-009, FR-013
**Dependencies:** Task 0
**Files to create:**

- `apps/bot-server/src/startup/shutdown.ts`
- `apps/bot-server/tests/unit/shutdown.test.ts`
  **Test file:** `apps/bot-server/tests/unit/shutdown.test.ts`

**Acceptance criteria:**

- [ ] Uses `ShutdownManager` from `@tempot/shared` (research.md decision 8)
- [ ] Hooks registered in Architecture Spec Section 25.3 order: HTTP → bot → queues → cache → primary DB → vector DB → log (FR-009, SC-007)
- [ ] SIGTERM triggers `shutdownManager.execute()` (FR-009)
- [ ] SIGINT triggers the same shutdown sequence (FR-009)
- [ ] Emits `system.shutdown.initiated` event with reason (FR-013, SC-011)
- [ ] Emits `system.shutdown.completed` event with duration (FR-013, SC-011)
- [ ] Second signal is ignored while shutdown is in progress
- [ ] 30-second total timeout enforced by ShutdownManager (NFR-002)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 5: correct order, SIGTERM, SIGINT, events emitted, duplicate signal)

---

## Task 8: Startup Orchestrator & Entry Point

**Priority:** P0 (application assembly)
**Estimated time:** 20 min
**FR:** FR-001, FR-002, FR-003, FR-004, FR-006, FR-013, FR-016
**Dependencies:** Task 1, Task 2, Task 3, Task 4, Task 5, Task 6, Task 7
**Files to create:**

- `apps/bot-server/src/startup/orchestrator.ts`
- `apps/bot-server/tests/unit/orchestrator.test.ts`
  **Files to update:**
- `apps/bot-server/src/index.ts` (replace 72-line prototype)
  **Test file:** `apps/bot-server/tests/unit/orchestrator.test.ts`

**Note:** The prototype at `src/index.ts` is replaced entirely. The new entry point creates real dependencies and calls the orchestrator. The orchestrator is testable with mocked dependencies.

**Acceptance criteria:**

- [ ] Orchestrator calls steps in exact order: loadConfig → connectDatabase → bootstrapSuperAdmins → warmCaches → discover → validate → loadModuleHandlers → register → startHttp → emit startup event (FR-001, SC-001)
- [ ] Missing config → exits with fatal error (SC-001)
- [ ] Database unreachable → exits with fatal error (SC-001)
- [ ] Core module validation failure → halts (FR-002, SC-002)
- [ ] Core module handler failure → halts (FR-004, SC-002)
- [ ] Non-core module failure → warns, continues (FR-004, SC-003)
- [ ] Emits `system.startup.completed` with durationMs, modulesLoaded, mode (FR-013, SC-011)
- [ ] After all module handlers are loaded, `register(bot)` is called to register all commands with Telegram API via a single `setMyCommands` call (FR-016, SC-001)
- [ ] Polling mode: calls `bot.start()`, webhook mode: no `bot.start()` (FR-006, SC-005)
- [ ] `src/index.ts` prototype is fully replaced — no leftover prototype code
- [ ] Entry point has no business logic — only creates deps and calls orchestrator (research.md decision 12)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 7: full sequence, missing config, DB fail, core validation fail, core handler fail, non-core fail, startup event)

---

## Task 9: Lifecycle Event Definitions

**Priority:** P1 (observability)
**Estimated time:** 10 min
**FR:** FR-013
**Dependencies:** Task 7, Task 8
**Files to update:**

- `packages/event-bus/src/event-bus.events.ts`
  **Files to create:**
- `apps/bot-server/tests/unit/lifecycle-events.test.ts`
  **Test file:** `apps/bot-server/tests/unit/lifecycle-events.test.ts`

**Acceptance criteria:**

- [ ] `TempotEvents` interface includes `system.startup.completed` with `{ durationMs: number; modulesLoaded: number; mode: string }` (D16 in spec.md)
- [ ] `TempotEvents` interface includes `system.shutdown.initiated` with `{ reason: string }` (D16 in spec.md)
- [ ] `TempotEvents` interface includes `system.shutdown.completed` with `{ durationMs: number }` (D16 in spec.md)
- [ ] `TempotEvents` interface includes `system.error` with `{ referenceCode: string; errorCode: string; module?: string }` (D16 in spec.md)
- [ ] Events emitted by orchestrator, shutdown handler, and error boundary match these types (SC-011)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 4: one per event type)

---

## Task 10: Integration Tests

**Priority:** P1 (validation)
**Estimated time:** 15 min
**FR:** FR-001, FR-002, FR-004, FR-006
**Dependencies:** Task 8
**Files to create:**

- `apps/bot-server/tests/integration/startup-sequence.test.ts`
  **Test file:** `apps/bot-server/tests/integration/startup-sequence.test.ts`

**Acceptance criteria:**

- [ ] Full startup with mocked packages → all steps execute in correct order (SC-001)
- [ ] Core module failure → halts at correct step (SC-002)
- [ ] Non-core module failure → continues past failure (SC-003)
- [ ] Polling mode → no webhook route, health check available (SC-005)
- [ ] Webhook mode → webhook + health check routes available (SC-005)
- [ ] Startup completes within 30 seconds (SC-014)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 5: full startup, core fail, non-core fail, polling mode, webhook mode)

---

## Task Dependency Graph

```
Task 0 (Scaffolding)
├─→ Task 1 (Config Loader)
│   └─→ Task 2 (Super Admin Bootstrap)
│       └─→ Task 8 (Orchestrator)
├─→ Task 3 (Cache Warming)
│   └─→ Task 8
├─→ Task 4 (Middleware Chain)
│   └─→ Task 8
├─→ Task 5 (Module Loader)
│   └─→ Task 8
├─→ Task 6 (HTTP Server)
│   └─→ Task 8
├─→ Task 7 (Shutdown)
│   ├─→ Task 8
│   └─→ Task 9 (Lifecycle Events)
└─→ Task 8 (Orchestrator)
    ├─→ Task 9
    └─→ Task 10 (Integration Tests)
```

## Summary

| Task | Name                      | Priority | Est. Time   | FR Coverage                                            |
| ---- | ------------------------- | -------- | ----------- | ------------------------------------------------------ |
| 0    | Project Scaffolding       | P0       | 15 min      | None (infrastructure)                                  |
| 1    | Config Loader             | P0       | 15 min      | FR-001, FR-006, FR-010                                 |
| 2    | Super Admin Bootstrap     | P0       | 10 min      | FR-010                                                 |
| 3    | Cache Warming             | P1       | 10 min      | FR-011                                                 |
| 4    | Security Middleware Chain | P0       | 30 min      | FR-005, FR-012, FR-014, FR-015                         |
| 5    | Module Handler Loader     | P0       | 15 min      | FR-003, FR-004                                         |
| 6    | HTTP Server               | P0/P1    | 20 min      | FR-007, FR-008                                         |
| 7    | Graceful Shutdown         | P0       | 10 min      | FR-009, FR-013                                         |
| 8    | Startup Orchestrator      | P0       | 20 min      | FR-001, FR-002, FR-003, FR-004, FR-006, FR-013, FR-016 |
| 9    | Lifecycle Events          | P1       | 10 min      | FR-013                                                 |
| 10   | Integration Tests         | P1       | 15 min      | FR-001, FR-002, FR-004, FR-006                         |
|      | **Total**                 |          | **170 min** |                                                        |

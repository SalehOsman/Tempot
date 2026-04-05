# Data Model: Bot Server

## Entities

### `BotServerConfig`

Static configuration loaded from environment variables at application startup. Validated once; immutable after loading.

**Storage:** None — loaded from `process.env` at startup, validated, and held in memory for the application lifetime.

| Field         | Type     | Description                                   | Constraints / Validation                                                       |
| ------------- | -------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| botToken      | string   | Telegram Bot API token                        | Required. Non-empty.                                                           |
| botMode       | BotMode  | Operation mode — `polling` or `webhook`       | Required. Must be `'polling'` or `'webhook'`.                                  |
| port          | number   | HTTP server listen port                       | Optional. Defaults to `3000`. Must be 1-65535.                                 |
| webhookUrl    | string?  | Public HTTPS URL for webhook reception        | Required when botMode is `webhook`.                                            |
| webhookSecret | string?  | Secret token for webhook header verification  | Required when botMode is `webhook`.                                            |
| superAdminIds | number[] | Telegram user IDs to bootstrap as SUPER_ADMIN | Optional. Parsed from comma-separated string. Each must be a positive integer. |

---

### `BotMode`

Enumeration of supported operation modes.

**Storage:** In-memory only — part of `BotServerConfig`.

| Value     | Description                                     |
| --------- | ----------------------------------------------- |
| `polling` | Long polling for local development. No webhook. |
| `webhook` | HTTP webhook for production. Requires HTTPS.    |

---

### `ModuleDependencyContainer`

The dependency bag passed to each module's setup function during handler loading. Created per-module with a scoped logger.

**Storage:** Transient — created during module loading, passed to setup function, not stored.

| Field           | Type             | Description                              | Constraints                                  |
| --------------- | ---------------- | ---------------------------------------- | -------------------------------------------- |
| logger          | ModuleLogger     | Child logger scoped to module name       | Created via `logger.child({ module: name })` |
| eventBus        | ModuleEventBus   | Event bus instance for publishing events | Shared across all modules                    |
| sessionProvider | SessionProvider  | Session management access                | Shared across all modules                    |
| i18n            | I18nProvider     | Localization access                      | Shared across all modules                    |
| settings        | SettingsProvider | System settings access                   | Shared across all modules                    |
| config          | ModuleConfig     | The module's own validated configuration | Read-only, from module-registry              |

---

### `SubsystemCheck`

Result of probing a single subsystem during health check.

**Storage:** Transient — created during health check request, included in response, not persisted.

| Field      | Type                            | Description                               | Constraints                                  |
| ---------- | ------------------------------- | ----------------------------------------- | -------------------------------------------- |
| status     | `'ok' \| 'error' \| 'degraded'` | Subsystem health status                   | Required                                     |
| latency_ms | number?                         | Response time in milliseconds             | Present when subsystem responded             |
| error      | string?                         | Error description when status is not 'ok' | Present when status is 'error' or 'degraded' |

---

### `SubsystemProbe`

A function that probes a single subsystem and returns its health status. Used by `runSingleProbe` to execute health checks with timeout and latency measurement.

**Storage:** In-memory only — registered at server creation, invoked per health check request.

| Field | Type                            | Description                                     | Constraints                              |
| ----- | ------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| probe | `() => Promise<SubsystemCheck>` | Async function that checks a subsystem's health | Must resolve within 4s timeout (NFR-003) |

---

### `HealthProbes`

Map of subsystem names to their probe functions. Passed to the health route factory.

**Storage:** In-memory only — created at server initialization.

| Type                                            | Description                                             |
| ----------------------------------------------- | ------------------------------------------------------- |
| `Record<string, () => Promise<SubsystemCheck>>` | Keys: database, redis, ai_provider, disk, queue_manager |

---

### `HealthCheckResponse`

Aggregated health check result returned by the `/health` endpoint.

**Storage:** Transient — created per request, returned as JSON response, not persisted.

| Field   | Type                                     | Description                           | Constraints                                             |
| ------- | ---------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| status  | `'healthy' \| 'degraded' \| 'unhealthy'` | Overall health classification         | Computed from individual subsystem checks               |
| uptime  | number                                   | Seconds since application started     | Always present                                          |
| checks  | Record<string, SubsystemCheck>           | Per-subsystem check results           | Keys: database, redis, ai_provider, disk, queue_manager |
| version | string                                   | Application version from package.json | Always present                                          |

**Classification rules:**

- Any `database` or `redis` check with status `error` → overall `unhealthy`
- Any `ai_provider` or `disk` check with status `error` → overall `degraded`
- All checks `ok` → overall `healthy`
- Priority: unhealthy > degraded > healthy

---

### `StartupStep`

Represents a single step in the startup sequence. Used internally for logging and error reporting.

**Storage:** In-memory only — transient during startup orchestration.

| Field    | Type    | Description                                        | Constraints                       |
| -------- | ------- | -------------------------------------------------- | --------------------------------- |
| name     | string  | Step identifier (e.g., `'loadConfig'`)             | Required. Unique within sequence. |
| order    | number  | Execution order (1-based)                          | Required. Sequential.             |
| fatal    | boolean | Whether failure in this step halts the application | Required.                         |
| duration | number? | Milliseconds taken to complete                     | Set after step completes.         |

---

### `ShutdownStep`

Represents a single step in the graceful shutdown sequence with its timeout.

**Storage:** In-memory only — registered with ShutdownManager at startup.

| Field   | Type   | Description                                | Constraints                          |
| ------- | ------ | ------------------------------------------ | ------------------------------------ |
| name    | string | Step identifier (e.g., `'stopHttpServer'`) | Required.                            |
| order   | number | Execution order (1-based)                  | Required. Per Architecture Spec 25.3 |
| timeout | number | Maximum milliseconds allowed for this step | Required. From Architecture Spec.    |

Shutdown steps from Architecture Spec Section 25.3:

| Order | Step                                     | Timeout   |
| ----- | ---------------------------------------- | --------- |
| 1     | Stop HTTP server (no new requests)       | Immediate |
| 2     | Complete in-flight bot updates           | 10s       |
| 3     | Drain queue workers (BullMQ via factory) | 15s       |
| 4     | Close cache connection (Redis)           | 5s        |
| 5     | Close primary database (Prisma)          | 5s        |
| 6     | Close vector database (Drizzle pgvector) | 5s        |
| 7     | Log shutdown completion                  | Immediate |

Total timeout: 30 seconds (enforced by ShutdownManager).

---

### Error Codes

Application-specific error codes defined in `bot-server.errors.ts`, used with `AppError` from `@tempot/shared`.

| Code                                   | Context                                     | Fatal? |
| -------------------------------------- | ------------------------------------------- | ------ |
| `bot-server.config.invalid_port`       | Port value is not a valid number in 1-65535 | Yes    |
| `bot-server.auth.ability_build_failed` | CASL ability construction failed for a user | No     |

These are in addition to the existing error codes (`MISSING_BOT_TOKEN`, `INVALID_BOT_MODE`, etc.) documented in the implementation.

---

### `commandModuleMap`

Optional mapping of bot command names to module names, used by the audit middleware to resolve which module handled a given command.

**Storage:** In-memory only — passed to audit middleware at bot creation.

| Type                     | Description                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `Record<string, string>` | Keys: command names (e.g., `'start'`). Values: module names (e.g., `'core-module'`). |

When present, the audit middleware uses this map to log the correct module name for each command. Falls back to `'bot-server'` when no mapping exists.

---

### `commandScopeMap`

Runtime mapping of bot command names to their scoped user restrictions, used by the scoped-users middleware to enforce per-command user access (D13 in spec.md).

**Storage:** In-memory only — built from module configs during module loading.

| Type                                      | Description                                                                                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `Map<string, { scopedUsers?: number[] }>` | Keys: command names (e.g., `'admin_panel'`). Values: objects with optional `scopedUsers` array of Telegram user IDs allowed to use the command. |

When `scopedUsers` is defined and non-empty, only listed user IDs can execute that command — even SUPER_ADMIN is blocked if not in the list (D13). When `scopedUsers` is undefined or empty, the command is accessible to all authorized users.

> **Note:** Named `commandScopeMap` (not `commandModuleMap`) to avoid a type conflict with `AuditDeps.commandModuleMap`, which maps commands to module names for audit logging.

## Relationships

```
BotServerConfig
  └─→ used by StartupOrchestrator to configure all subsystems
       ├── botToken → Bot instance creation (grammY)
       ├── botMode → determines webhook vs polling, HTTP route registration
       ├── superAdminIds → bootstrapSuperAdmins()
       └── webhookUrl/Secret → webhook route verification

ModuleDependencyContainer
  └─→ created per-module by StartupOrchestrator
       ├── wraps shared package instances (logger, event bus, etc.)
       └── passed to ModuleSetupFn(bot, deps)

ValidatedModule (from @tempot/module-registry)
  └─→ consumed by ModuleHandlerLoader
       ├── path → dynamic import target
       ├── config.isCore → determines fatal vs warning on failure
       ├── config.scopedUsers → used by ScopedUsersMiddleware
       └── config.commands → registered via ModuleRegistry.register()

HealthCheckResponse
  └─→ composed from SubsystemCheck probes
       ├── database → Prisma.$queryRaw('SELECT 1')
       ├── redis → cache ping
       ├── ai_provider → provider health check (if enabled)
       ├── disk → fs.statfs free space check
       └── queue_manager → BullMQ connection status
```

- **BotServerConfig** is loaded once at startup and drives all initialization decisions
- **ModuleDependencyContainer** is created once per validated module, with a scoped child logger
- **ValidatedModule** comes from `@tempot/module-registry` — bot-server does not create these, only consumes them
- **HealthCheckResponse** is computed on each `/health` request from live subsystem probes
- **ShutdownManager** from `@tempot/shared` manages the hook execution with 30s total timeout

## Storage Mechanisms

- **Environment variables (read-only):** `BotServerConfig` is loaded from `process.env` once at startup. No writes.
- **In-memory (application lifetime):** Bot instance, middleware chain, HTTP server, module registry, loaded module references. None of these are persisted — they exist for the process lifetime only.
- **Transient (per-request):** Health check probes, error references, audit log entries. Created and discarded per request.
- **Delegated storage:** All persistent storage (database, cache, sessions) is handled by the respective packages (`@tempot/database`, `@tempot/shared` CacheService, `@tempot/session-manager`). Bot-server does not interact with storage directly — it initializes the packages and passes them to modules.

## Event Schema

Events follow the `system.{entity}.{action}` naming convention for lifecycle events.

| Event Name                  | Payload Type                                                    | Emitted When                                      | Level    |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------------------- | -------- |
| `system.startup.completed`  | `{ durationMs: number; modulesLoaded: number; mode: BotMode }`  | All startup steps complete, HTTP server listening | INTERNAL |
| `system.shutdown.initiated` | `{ reason: string }`                                            | SIGTERM or SIGINT received                        | INTERNAL |
| `system.shutdown.completed` | `{ durationMs: number }`                                        | All shutdown hooks executed                       | INTERNAL |
| `system.error`              | `{ referenceCode: string; errorCode: string; module?: string }` | Unhandled bot error caught by error boundary      | INTERNAL |

**Note:** Module-registry events (`module-registry.discovery.completed`, `module-registry.module.*`) are already defined in `packages/event-bus/src/event-bus.events.ts` and are emitted by the module-registry package itself during the discover/validate/register pipeline. Bot-server does not re-emit these.

## Data Flow

```
Process Start
│
├── 1. loadConfig()
│   └─→ Read process.env → validate → BotServerConfig
│
├── 2. connectDatabase()
│   └─→ Prisma.$connect() + Drizzle pool → fatal on failure
│
├── 3. bootstrapSuperAdmins()
│   └─→ For each superAdminId → auth-core.ensureRole(id, SUPER_ADMIN)
│
├── 4. warmCaches()
│   ├── 4a. Settings cache → SettingsService.loadAll()
│   └── 4b. Translation cache → i18n.init() / preload namespaces
│
├── 5. Module Pipeline (via @tempot/module-registry)
│   ├── 5a. registry.discover()  → DiscoveryResult
│   ├── 5b. registry.validate()  → ValidationResult
│   │   └── Core module failure → fatal error, halt
│   ├── 5c. loadModuleHandlers() → dynamic import + setup()
│   │   ├── Core handler failure → fatal error, halt
│   │   └── Non-core failure → warn + skip
│   └── 5d. registry.register(bot) → setMyCommands with all validated modules
│
├── 6. Start HTTP Server
│   ├── Register health check route (always)
│   ├── Register webhook route (webhook mode only)
│   └── Start listening on configured port
│
├── 7. Start Bot
│   ├── polling mode: bot.start() with long polling
│   └── webhook mode: (updates come via HTTP, no bot.start needed)
│
├── 8. Emit system.startup.completed
│   └─→ { durationMs, modulesLoaded, mode }
│
└── Register shutdown signal handlers
    └── SIGTERM / SIGINT → ShutdownManager.execute()
        ├── Step 1: honoServer.close()
        ├── Step 2: bot.stop()
        ├── Step 3: queueFactory.closeAll()
        ├── Step 4: cache/redis.quit()
        ├── Step 5: prisma.$disconnect()
        ├── Step 6: drizzlePool.end()
        └── Step 7: log completion + emit system.shutdown.completed
```

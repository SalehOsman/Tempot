# Data Model: Shared Package

## Overview

The `@tempot/shared` package contains no database entities. It provides foundational types, error classes, and service abstractions used by all other packages. The "data model" consists of TypeScript interfaces, type aliases, and class definitions that form the contract layer of the framework.

## Core Types

### `AppError`

Base error class for all application errors. Every package derives its error codes from this class.

**Storage:** In-memory only (instantiated on error, propagated via `Result` type).

| Field      | Type       | Description                                      | Constraints / Validation                         |
| ---------- | ---------- | ------------------------------------------------ | ------------------------------------------------ |
| `code`     | `string`   | Hierarchical error code (e.g., `shared.cache_*`) | Required, set via constructor, becomes `message` |
| `details`  | `unknown?` | Arbitrary error context (objects, strings, etc.) | Optional                                         |
| `i18nKey`  | `string`   | Auto-derived i18n key: `errors.{code}`           | Required, computed from `code` in constructor    |
| `loggedAt` | `Date?`    | Timestamp when error was first logged            | Optional, mutable (set by logger package)        |

**Inheritance:** Extends native `Error`. Uses `Object.setPrototypeOf(this, AppError.prototype)` for correct `instanceof` checks across module boundaries.

**Error Code Hierarchy (as implemented):**

| Code                           | Module   | Meaning                                  |
| ------------------------------ | -------- | ---------------------------------------- |
| `shared.cache_init_failed`     | Cache    | Both primary and fallback init failed    |
| `shared.cache_not_initialized` | Cache    | Operation attempted before `init()` call |
| `shared.cache_get_failed`      | Cache    | `get()` threw an exception               |
| `shared.cache_set_failed`      | Cache    | `set()` threw an exception               |
| `shared.cache_del_failed`      | Cache    | `del()` threw an exception               |
| `shared.cache_reset_failed`    | Cache    | `reset()` / `clear()` threw an exception |
| `shared.queue_factory_failed`  | Queue    | BullMQ `Queue` constructor threw         |
| `shared.shutdown_hook_failed`  | Shutdown | One or more shutdown hooks threw         |

---

### `Result<T, E = AppError>`

Type alias wrapping `neverthrow.Result`. Enforces the Result Pattern (Rule XXI) across the entire codebase.

**Storage:** In-memory only (return type contract).

| Type Parameter | Default    | Description                         |
| -------------- | ---------- | ----------------------------------- |
| `T`            | (required) | Success value type                  |
| `E`            | `AppError` | Error type (defaults to `AppError`) |

---

### `AsyncResult<T, E = AppError>`

Type alias: `Promise<Result<T, E>>`. Used for all async operations returning results.

**Storage:** In-memory only (return type contract).

---

## Service Interfaces

### `EventBus` (interface)

Minimal event bus contract used by `CacheService` for degradation alerts. Defined locally to avoid circular dependency with `@tempot/event-bus`.

| Method    | Signature                                                                                       | Description              |
| --------- | ----------------------------------------------------------------------------------------------- | ------------------------ |
| `publish` | `(event: string, payload: unknown, type: 'LOCAL' \| 'INTERNAL' \| 'EXTERNAL') => Promise<void>` | Publishes a domain event |

---

### `CacheLogger` (interface)

Minimal logger contract for `CacheService`. Avoids circular dependency with `@tempot/logger`.

| Method | Signature                   | Description                  |
| ------ | --------------------------- | ---------------------------- |
| `warn` | `(message: string) => void` | Logs a warning-level message |

---

### `ShutdownLogger` (interface)

Logger contract for `ShutdownManager`. Avoids circular dependency with `@tempot/logger`.

| Method  | Signature                                 | Description                |
| ------- | ----------------------------------------- | -------------------------- |
| `info`  | `(message: string) => void`               | Logs an info-level message |
| `error` | `(data: Record<string, unknown>) => void` | Logs structured error data |

---

### `QueueFactoryOptions` (interface)

Options passed to the `queueFactory` function.

| Field             | Type                     | Description                                      | Constraints |
| ----------------- | ------------------------ | ------------------------------------------------ | ----------- |
| `shutdownManager` | `ShutdownManager?`       | If provided, auto-registers `queue.close()` hook | Optional    |
| `queueOptions`    | `Partial<QueueOptions>?` | BullMQ queue options to merge with defaults      | Optional    |

---

## Service Classes

### `CacheService`

Unified cache wrapper around `cache-manager`. Provides get/set/del/reset operations with Result Pattern.

**Storage:** Internal `cache?: Cache` instance (in-memory via `cache-manager` `createCache()`).

| Method     | Return Type                           | Description                            |
| ---------- | ------------------------------------- | -------------------------------------- |
| `init()`   | `AsyncResult<void>`                   | Initialize cache store (with fallback) |
| `get<T>()` | `AsyncResult<T \| undefined \| null>` | Retrieve value by key                  |
| `set<T>()` | `AsyncResult<void>`                   | Store value with optional TTL          |
| `del()`    | `AsyncResult<void>`                   | Delete single key                      |
| `reset()`  | `AsyncResult<void>`                   | Clear entire cache                     |

**Constructor:** `new CacheService(eventBus?: EventBus, logger?: CacheLogger)`

---

### `ShutdownManager`

Centralized shutdown orchestrator. Executes registered hooks sequentially with a 30-second fatal timeout.

**Storage:** Internal `hooks: Array<() => Promise<void>>` array.

| Method       | Return Type         | Description                            |
| ------------ | ------------------- | -------------------------------------- |
| `register()` | `Result<void>`      | Add a shutdown hook (sync return)      |
| `execute()`  | `AsyncResult<void>` | Run all hooks sequentially, FIFO order |

**Constructor:** `new ShutdownManager(logger: ShutdownLogger)` -- logger is required.

---

### `queueFactory` (function)

Standalone factory function (not a class) for creating BullMQ queues with standardized defaults.

**Signature:** `queueFactory(name: string, options?: QueueFactoryOptions): Result<Queue, AppError>`

**Side effects:** Pushes created queue to module-level `activeQueues: Queue[]` array.

---

## Module-Level State

### `activeQueues`

Exported mutable array tracking all queues created by `queueFactory`. Enables bulk shutdown.

| Name           | Type      | Scope        | Description                           |
| -------------- | --------- | ------------ | ------------------------------------- |
| `activeQueues` | `Queue[]` | Module-level | All queues created via `queueFactory` |

---

## Relationships

```
AppError
  └-- used by all services as error type in Result<T, AppError>

Result<T, E> / AsyncResult<T, E>
  └-- return type for all public methods across all services

CacheService
  ├-- uses EventBus (optional) for degradation alerts
  └-- uses CacheLogger (optional) for warnings

QueueFactory
  ├-- uses ShutdownManager (optional) for auto-registering close hooks
  └-- pushes to activeQueues (module-level state)

ShutdownManager
  └-- uses ShutdownLogger (required) for info/error logging
```

## Storage Mechanisms

- **No database tables.** This package has zero Prisma schema or database models.
- **No persistent storage.** All state is in-memory and scoped to process lifetime.
- **Cache store:** `cache-manager` `createCache()` with default memory store. Redis adapter configured externally by consuming packages.
- **Queue connections:** BullMQ `Queue` connects to Redis via `REDIS_HOST`/`REDIS_PORT` environment variables (default: `localhost:6379`).
- **Shutdown hooks:** Stored in a plain array, executed once on process shutdown, then discarded.

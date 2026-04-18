---
title: Shared Package
description: Understanding the foundational utilities, error hierarchy, and cross-cutting services in Tempot
tags:
  - concepts
  - shared
  - error-handling
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
---

## What is the Shared Package?

The `@tempot/shared` package is the foundation layer of the Tempot framework. It provides the utilities, types, and services that every other package depends on: a unified error hierarchy, the Result pattern, caching, queue creation, graceful shutdown, toggle guards, and session context propagation.

## AppError Hierarchy

All errors in Tempot extend the `AppError` class. Each error carries a hierarchical code following the `{module}.{operation}_{outcome}` convention:

| Field           | Description                                                                      |
| --------------- | -------------------------------------------------------------------------------- |
| `code`          | Hierarchical error code (e.g., `shared.cache_init_failed`)                       |
| `details`       | Optional structured data about the failure                                       |
| `i18nKey`       | Auto-derived as `errors.{code}` for localization                                 |
| `referenceCode` | Unique `ERR-YYYYMMDD-XXXX` string linking logs, audit entries, and Sentry events |
| `loggedAt`      | Sentinel timestamp preventing double-logging                                     |

The `loggedAt` field ensures an error is only serialized once in logs. When the logger encounters an `AppError` whose `loggedAt` is already set, it produces a minimal stub instead of duplicating the full trace.

## Result Pattern

Tempot uses the `neverthrow` library to enforce explicit error handling. No public function throws an exception. Instead, every operation returns `Result<T, AppError>` (synchronous) or `AsyncResult<T, AppError>` (asynchronous):

```typescript
import { ok, err } from 'neverthrow';
import { AppError, type Result } from '@tempot/shared';

function validate(input: string): Result<string, AppError> {
  if (!input) {
    return err(new AppError('module.validation_failed'));
  }
  return ok(input.trim());
}
```

`AsyncResult<T>` is simply `Promise<Result<T, AppError>>`, providing a consistent async contract across the entire framework.

## CacheService

The `CacheService` provides a unified caching interface with automatic degradation:

| Tier     | Store                               | When Used                                      |
| -------- | ----------------------------------- | ---------------------------------------------- |
| Primary  | Redis (via Keyv adapter)            | When Redis is configured and available         |
| Fallback | In-memory (`cache-manager` default) | When Redis initialization fails                |
| Alert    | Event Bus notification              | On fallback, publishes `system.alert.critical` |

The service wraps `cache-manager` 6.x and exposes `get`, `set`, `del`, and `reset` methods, all returning `AsyncResult`. If the primary Redis store fails during initialization, the service automatically falls back to in-memory caching and alerts operators via the Event Bus.

## QueueFactory

The `queueFactory` function creates standardized BullMQ queues with sensible defaults: localhost Redis connection, three retry attempts with exponential backoff. It returns a synchronous `Result<Queue, AppError>` and optionally registers shutdown hooks when a `ShutdownManager` is provided.

## ShutdownManager

The `ShutdownManager` orchestrates graceful process termination. Services register async cleanup hooks via `register()`, and all hooks execute sequentially when `execute()` is called. A 30-second hard timeout ensures the process exits even if a hook hangs. Failed hooks do not block subsequent ones.

## Toggle Guards

Every optional package in Tempot can be enabled or disabled at runtime via environment variables. The `createToggleGuard` function reads an env var and returns a guard object. Packages default to enabled and are only disabled when the env var is set to the exact string `"false"`.

Guards are checked at the top of every public function. When disabled, the function short-circuits with an `AppError('{package}.disabled')` result instead of executing.

## Session Context

The `sessionContext` is an `AsyncLocalStorage` instance that propagates user session data (userId, userRole, locale, timezone) through the entire async call stack. Middleware sets the context at the request boundary, and any downstream code reads it without explicit parameter passing.

This enables automatic audit field population in the database layer and automatic userId injection in log entries, without threading session data through every function signature.

## Package Dependencies

The shared package intentionally defines minimal dependency interfaces (`CacheLogger`, `EventBus`, `ShutdownLogger`) rather than importing from `@tempot/logger` or `@tempot/event-bus`. This prevents circular dependencies while still allowing integration with those packages at runtime.

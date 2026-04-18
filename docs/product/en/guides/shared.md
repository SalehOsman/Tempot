---
title: Using the Shared Package
description: Practical guide to error handling, caching, queues, shutdown hooks, and toggle guards in Tempot
tags:
  - guide
  - shared
  - error-handling
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
---

## Overview

The `@tempot/shared` package provides the cross-cutting utilities that every Tempot package depends on. This guide covers the most common tasks: creating errors, using the Result pattern, configuring caching, creating queues, registering shutdown hooks, and setting up toggle guards.

## Creating AppErrors

Construct an `AppError` with a hierarchical code following the `{module}.{operation}_{outcome}` convention:

```typescript
import { AppError } from '@tempot/shared';

const error = new AppError('invoices.payment_failed', {
  invoiceId: 'inv_123',
  reason: 'insufficient_funds',
});
```

The `i18nKey` is auto-derived as `errors.invoices.payment_failed`, linking the error to its localized message. The optional `details` field carries structured diagnostic data.

## Working with the Result Pattern

Every public function returns `Result<T, AppError>` or `AsyncResult<T, AppError>` instead of throwing. Use `ok()` and `err()` from `neverthrow`:

```typescript
import { ok, err } from 'neverthrow';
import { AppError, type Result } from '@tempot/shared';

function parseAmount(input: string): Result<number, AppError> {
  const amount = Number(input);
  if (Number.isNaN(amount)) {
    return err(new AppError('billing.parse_failed', { input }));
  }
  return ok(amount);
}
```

Chain results with `.map()`, `.andThen()`, and `.mapErr()`. Handle both outcomes with `.match()`:

```typescript
parseAmount(raw).match(
  (value) => logger.info({ msg: 'Parsed', value }),
  (error) => logger.error({ err: error }),
);
```

## Setting Up CacheService

The `CacheService` provides Redis-first caching with automatic in-memory fallback. Construct it with optional `EventBus` and logger dependencies, then call `init()`:

```typescript
import { CacheService } from '@tempot/shared';

const cache = new CacheService(eventBus, logger);

const initResult = await cache.init({
  ttl: 60_000, // 60 seconds default TTL
});

if (initResult.isErr()) {
  // CacheService already fell back to in-memory; log the warning
  logger.warn(initResult.error.code);
}
```

All cache operations return `AsyncResult`:

```typescript
await cache.set('user:123', userData, 300_000);
const result = await cache.get<UserData>('user:123');
await cache.del('user:123');
await cache.reset();
```

If Redis is unavailable during `init()`, the service automatically switches to in-memory caching and publishes `system.alert.critical` through the Event Bus.

## Creating a Queue

Use `queueFactory` to create BullMQ queues with standardized defaults:

```typescript
import { queueFactory, type QueueFactoryOptions } from '@tempot/shared';

const options: QueueFactoryOptions = {
  shutdownManager,
  queueOptions: { defaultJobOptions: { removeOnComplete: 100 } },
};

const result = queueFactory('email-notifications', options);

if (result.isOk()) {
  const queue = result.value;
  await queue.add('welcome-email', { userId: 'user_123' });
}
```

When a `ShutdownManager` is provided, the queue automatically registers a shutdown hook that calls `queue.close()` during graceful termination. The factory reads `REDIS_HOST` and `REDIS_PORT` environment variables, defaulting to `localhost:6379`.

## Registering Shutdown Hooks

The `ShutdownManager` orchestrates graceful process termination. Register async cleanup functions via `register()`, then call `execute()` on process exit:

```typescript
import { ShutdownManager, type ShutdownLogger } from '@tempot/shared';

const shutdownManager = new ShutdownManager(logger as ShutdownLogger);

shutdownManager.register(async () => {
  await database.disconnect();
});

shutdownManager.register(async () => {
  await redis.quit();
});
```

Hooks run sequentially in registration order. A failed hook is logged but does not block subsequent hooks. A 30-second hard timeout ensures the process exits even if a hook hangs.

## Configuring Toggle Guards

Toggle guards let you disable optional packages at runtime via environment variables:

```typescript
import { createToggleGuard } from '@tempot/shared';

const searchToggle = createToggleGuard('TEMPOT_SEARCH', 'search-engine');
```

Check the guard at the top of every public function:

```typescript
function search(query: string): Result<SearchResult[], AppError> {
  const disabled = searchToggle.check();
  if (disabled) return disabled;

  // proceed with search logic
  return ok(results);
}
```

Packages default to enabled. They are only disabled when the env var is set to the exact string `"false"`. Use `searchToggle.isEnabled()` for conditional logic that does not need a Result return.

## Using Session Context

Set session data at the request boundary using `sessionContext.run()`. All downstream code reads it automatically:

```typescript
import { sessionContext, type ContextSession } from '@tempot/shared';

const session: ContextSession = {
  userId: 'user_123',
  userRole: 'ADMIN',
  locale: 'ar',
  timezone: 'Asia/Riyadh',
};

sessionContext.run(session, async () => {
  // All code here has access to session data
  // Database audit fields and logger userId are auto-populated
  await processRequest();
});
```

## Best Practices

- Always use the `{module}.{operation}_{outcome}` convention for error codes
- Never throw exceptions from public functions; return `Result` instead
- Provide a `ShutdownManager` when creating queues to ensure graceful cleanup
- Check toggle guards at the top of every public function, before any side effects
- Set `sessionContext` once at the middleware boundary, not in business logic

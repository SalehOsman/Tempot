---
title: Building a Service with the Shared Package
description: Step-by-step tutorial to build a service using CacheService, QueueFactory, and the Result pattern
tags:
  - tutorial
  - shared
  - error-handling
audience:
  - bot-developer
contentType: developer-docs
difficulty: beginner
---

## Prerequisites

Before you begin, make sure you have:

- A working Tempot development environment (see [Getting Started](/en/tutorials/getting-started/))
- Basic understanding of TypeScript and async/await
- Redis running locally on port 6379

## Building a Notification Service

In this tutorial you will build a notification service that caches user preferences and queues outgoing messages, using the Result pattern throughout.

### Step 1: Define the Error Codes

Create your module's error codes following the `{module}.{operation}_{outcome}` convention:

```typescript
import { AppError, type AsyncResult } from '@tempot/shared';
import { ok, err } from 'neverthrow';

const ERRORS = {
  NOT_FOUND: 'notifications.preferences_not_found',
  QUEUE_FAILED: 'notifications.queue_send_failed',
} as const;
```

### Step 2: Set Up the CacheService

Initialize a `CacheService` to store user notification preferences:

```typescript
import { CacheService } from '@tempot/shared';

const cache = new CacheService();

async function initCache(): AsyncResult<void> {
  return cache.init({ ttl: 300_000 }); // 5-minute TTL
}
```

### Step 3: Create Cached Preference Lookup

Use the cache to store and retrieve user preferences with the Result pattern:

```typescript
interface NotificationPrefs {
  email: boolean;
  telegram: boolean;
  locale: string;
}

async function getPreferences(userId: string): AsyncResult<NotificationPrefs> {
  const cached = await cache.get<NotificationPrefs>(`prefs:${userId}`);
  if (cached.isErr()) return cached;

  if (cached.value) return ok(cached.value);

  // Simulate fetching from database
  const prefs: NotificationPrefs = { email: true, telegram: true, locale: 'ar' };
  await cache.set(`prefs:${userId}`, prefs);
  return ok(prefs);
}
```

### Step 4: Create a Queue for Outgoing Messages

Use `queueFactory` to create a BullMQ queue with shutdown integration:

```typescript
import { queueFactory, ShutdownManager } from '@tempot/shared';

const shutdownLogger = {
  info: (msg: string) => process.stderr.write(JSON.stringify({ level: 'info', msg }) + '\n'),
  error: (data: Record<string, unknown>) => process.stderr.write(JSON.stringify(data) + '\n'),
};

const shutdownManager = new ShutdownManager(shutdownLogger);

const queueResult = queueFactory('notifications', { shutdownManager });
if (queueResult.isErr()) {
  process.stderr.write(
    JSON.stringify({ msg: 'Queue creation failed', err: queueResult.error.code }) + '\n',
  );
}
```

### Step 5: Wire the Service Together

Combine caching and queuing into a single `sendNotification` function:

```typescript
async function sendNotification(userId: string, message: string): AsyncResult<void> {
  const prefs = await getPreferences(userId);
  if (prefs.isErr()) return prefs;

  if (!prefs.value.telegram) {
    return err(new AppError(ERRORS.NOT_FOUND, { userId }));
  }

  if (queueResult.isErr()) {
    return err(new AppError(ERRORS.QUEUE_FAILED));
  }

  const queue = queueResult.value;
  await queue.add('send', { userId, message, locale: prefs.value.locale });
  return ok(undefined);
}
```

### Step 6: Register Shutdown Hooks

Ensure graceful cleanup on process exit:

```typescript
process.on('SIGTERM', async () => {
  await shutdownManager.execute();
});
```

## What You Built

You created a notification service that:

- Uses `CacheService` for Redis-first caching with automatic in-memory fallback
- Creates queues via `queueFactory` with automatic shutdown hook registration
- Returns `Result<T, AppError>` from every function instead of throwing exceptions
- Uses hierarchical error codes for localization and diagnostics

## Next Steps

- Read the [Shared Package Concepts](/en/concepts/shared/) to understand toggle guards and session context
- See the [Using the Shared Package](/en/guides/shared/) guide for advanced CacheService configuration
- Learn how to persist data in the [Database Tutorial](/en/tutorials/database/)

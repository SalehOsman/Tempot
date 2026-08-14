# @tempot/shared

> Core utilities shared across all packages — cache wrapper, queue factory, AppError, and Result pattern.

## Purpose

Two critical shared utilities that all other packages depend on:

- **`cache.ts`** — thin wrapper around `cache-manager` with unified API (Memory → Redis → DB)
- **`queue.factory.ts`** — centralised BullMQ factory (~30 lines) for graceful shutdown
- **`AppError`** — hierarchical error class with `module.error_name` code format
- **`Result<T, E>`** — re-exported from `neverthrow` for convenience

## Phase

Phase 1 — Core Bedrock (depends on logger only)

## Dependencies

| Package             | Purpose                    |
| ------------------- | -------------------------- |
| `cache-manager` 6.x | Multi-tier cache — ADR-023 |
| `@keyv/redis`       | Redis cache tier           |
| `@keyv/postgres`    | PostgreSQL fallback tier   |
| `bullmq` 5.x        | Queue worker management    |
| `ioredis`           | Redis connection           |
| `neverthrow` 8.2.0  | Result pattern             |

## API

```typescript
// Cache
import { cache } from '@tempot/shared/cache';

await cache.set('key', value, ttl);
const val = await cache.get<MyType>('key');
await cache.del('key');

// Queue Factory
import { queueFactory } from '@tempot/shared/queue.factory';

const queue = queueFactory.createQueue('notifications');
const worker = queueFactory.createWorker('notifications', async (job) => {
  // process job
});
await queueFactory.closeAll(); // graceful shutdown

// AppError
import { AppError } from '@tempot/shared';

throw new AppError('invoice.not_found');
throw new AppError('user.permission_denied', originalError);

// Result
import { ok, err, Result } from '@tempot/shared';

function doSomething(): Result<string, AppError> {
  if (failed) return err(new AppError('module.error'));
  return ok('success');
}
```

## ADRs

- ADR-011 — cache-manager as unified cache layer
- ADR-019 — centralised queue factory
- ADR-023 — cache-manager library

## Status

✅ **Implemented** — Phase 1

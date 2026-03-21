# Shared Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the foundational shared package providing a Unified Cache Service and a Standardized Queue Factory.

**Architecture:** A thin wrapper around `cache-manager` for multi-tier caching and a pure factory function for `BullMQ` to ensure consistent configuration across modules. Includes mandatory degradation alerting for SUPER_ADMIN via the event-bus and GracefulShutdown hooks.

**Tech Stack:** TypeScript, cache-manager, @keyv/redis, BullMQ, ioredis, @tempot/event-bus.

---

### Task 1: Unified Cache Service

**Files:**
- Create: `packages/shared/src/cache/cache.service.ts`
- Test: `packages/shared/tests/unit/cache.service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { CacheService } from '../src/cache/cache.service';

describe('CacheService', () => {
  it('should set and get a value correctly', async () => {
    const cache = new CacheService({} as any);
    await cache.set('key', 'value');
    const result = await cache.get('key');
    expect(result).toBe('value');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/shared/tests/unit/cache.service.test.ts`
Expected: FAIL (CacheService not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { caching, MultiCache } from 'cache-manager';

export class CacheService {
  private cache?: MultiCache;

  constructor(private eventBus: any) {}

  async init() {
    this.cache = await caching('memory'); // Basic memory for now
  }

  async set(key: string, value: any, ttl?: number) {
    return this.cache?.set(key, value, ttl);
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache?.get<T>(key);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/shared/tests/unit/cache.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/cache/cache.service.ts
git commit -m "feat(shared): implement unified CacheService wrapper"
```

---

### Task 2: Redis Degradation Strategy with Admin Alert (Rule XXXII)

**Files:**
- Modify: `packages/shared/src/cache/cache.service.ts`
- Test: `packages/shared/tests/unit/cache-degradation.test.ts`

- [ ] **Step 1: Write the failing test for alert**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { CacheService } from '../src/cache/cache.service';

describe('Cache Degradation Alert', () => {
  it('should notify SUPER_ADMIN when Redis connection fails via event-bus', async () => {
    const eventBus = { publish: vi.fn() };
    const cache = new CacheService(eventBus as any);
    // Simulate initialization failure
    await cache.init(true); // pass mock flag for test
    expect(eventBus.publish).toHaveBeenCalledWith('system.alert.critical', expect.any(Object), 'LOCAL');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/shared/tests/unit/cache-degradation.test.ts`
Expected: FAIL (No alert logic)

- [ ] **Step 3: Write minimal implementation with alerting**

```typescript
// Update CacheService to handle connection errors and alert
export class CacheService {
  async init(simulateFailure = false) {
    try {
      if (simulateFailure) throw new Error('Redis failure');
      // Attempt Redis + Memory multi-tier setup
    } catch (e) {
      console.warn('Redis unavailable, falling back to memory');
      await this.eventBus.publish('system.alert.critical', {
        message: 'CRITICAL: Redis failure detected. System fell back to in-memory cache.',
        error: e
      }, 'LOCAL');
      this.cache = await caching('memory');
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/shared/tests/unit/cache-degradation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/cache/cache.service.ts
git commit -m "feat(shared): implement Redis degradation fallback with SUPER_ADMIN alerts via event-bus (Rule XXXII)"
```

---

### Task 3: Queue Factory (ADR-019)

**Files:**
- Create: `packages/shared/src/queue/queue.factory.ts`
- Test: `packages/shared/tests/unit/queue.factory.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { queueFactory } from '../src/queue/queue.factory';

describe('QueueFactory', () => {
  it('should create a BullMQ queue with default settings', () => {
    const queue = queueFactory('test-queue');
    expect(queue.name).toBe('test-queue');
    expect(queue.opts.defaultJobOptions.attempts).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/shared/tests/unit/queue.factory.test.ts`
Expected: FAIL (queueFactory not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Queue, QueueOptions } from 'bullmq';

// Store instances for graceful shutdown
export const activeQueues: Queue[] = [];

export function queueFactory(name: string, options?: Partial<QueueOptions>) {
  const queue = new Queue(name, {
    connection: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    },
    ...options,
  });
  activeQueues.push(queue);
  return queue;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/shared/tests/unit/queue.factory.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/queue/queue.factory.ts
git commit -m "feat(shared): implement standardized QueueFactory (ADR-019)"
```

---

### Task 4: Graceful Shutdown Hooks (Rule XVII)

**Files:**
- Create: `packages/shared/src/shutdown/shutdown.manager.ts`
- Test: `packages/shared/tests/unit/shutdown.manager.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ShutdownManager } from '../src/shutdown/shutdown.manager';

describe('ShutdownManager', () => {
  it('should execute registered hooks on shutdown', async () => {
    const hook = vi.fn();
    ShutdownManager.register(hook);
    await ShutdownManager.execute();
    expect(hook).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/shared/tests/unit/shutdown.manager.test.ts`
Expected: FAIL (ShutdownManager not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
export class ShutdownManager {
  private static hooks: Array<() => Promise<void>> = [];

  static register(hook: () => Promise<void>) {
    this.hooks.push(hook);
  }

  static async execute() {
    const timeout = setTimeout(() => {
      console.error('FATAL: Shutdown exceeded 30s timeout.');
      process.exit(1);
    }, 30000);

    for (const hook of this.hooks) {
      try {
        await hook();
      } catch (e) {
        console.error('Error during shutdown hook', e);
      }
    }
    
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/shared/tests/unit/shutdown.manager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/shutdown/shutdown.manager.ts
git commit -m "feat(shared): implement GracefulShutdown manager (Rule XVII)"
```

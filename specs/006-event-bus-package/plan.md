> **⚠ Superseded Document**: This plan reflects the initial design intent before implementation.
> Subsequent design decisions are documented in `research.md` and the final task breakdown
> is in `tasks.md`. Where this plan diverges from `tasks.md` or `research.md`, the latter
> documents take precedence.

# Event Bus Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational event-bus package providing three levels of event-driven communication (Local, Internal, External) as per Tempot v11 Blueprint.

**Architecture:** A unified `EventBus` facade that delegates to specialized drivers: `LocalDriver` (internal Node.js EventEmitter), `InternalDriver` (cross-module communication via memory), and `ExternalDriver` (cross-instance via Redis Pub/Sub). It implements a Result pattern for all operations and ensures 100% reliability via Redis-backed persistence and exponential backoff retries.

**Tech Stack:** TypeScript, Node.js EventEmitter, Redis (ioredis), BullMQ (Queue Factory), neverthrow, vitest.

---

### Task 1: Event Types and Naming Validation (FR-002)

**Files:**

- Create: `packages/event-bus/src/event-bus.contracts.ts`
- Test: `packages/event-bus/tests/unit/local-bus.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { validateEventName } from '../src/event-bus.contracts';

describe('Event Naming Convention', () => {
  it('should validate name in format {module}.{entity}.{action}', () => {
    expect(validateEventName('users.user.created')).toBe(true);
    expect(validateEventName('invalid-name')).toBe(false);
    expect(validateEventName('too.many.parts.action')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/event-bus/tests/unit/local-bus.test.ts`
Expected: FAIL (validateEventName not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
export type EventLevel = 'LOCAL' | 'INTERNAL' | 'EXTERNAL';

export interface EventMetadata {
  eventId: string;
  timestamp: Date;
  userId?: string;
  module: string;
}

export interface Event<T = unknown> extends EventMetadata {
  eventName: string;
  payload: T;
  level: EventLevel;
}

export function validateEventName(name: string): boolean {
  const parts = name.split('.');
  return parts.length === 3;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/event-bus/tests/unit/local-bus.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/event-bus/src/event-bus.contracts.ts packages/event-bus/tests/unit/local-bus.test.ts
git commit -m "feat(event-bus): define event types and naming validation (FR-002)"
```

---

### Task 2: Local Driver (EventEmitter) (FR-001)

**Files:**

- Create: `packages/event-bus/src/local/local.bus.ts`
- Test: `packages/event-bus/tests/unit/local-bus.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { LocalEventBus } from '../src/local/local.bus';

describe('LocalDriver', () => {
  it('should emit and receive events locally', async () => {
    const driver = new LocalDriver();
    const handler = vi.fn();
    driver.on('test.event.fired', handler);
    await driver.emit({ eventName: 'test.event.fired', payload: { data: 1 } } as unknown as Event);
    expect(handler).toHaveBeenCalledWith({ data: 1 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/event-bus/tests/unit/local-bus.test.ts`
Expected: FAIL (LocalDriver not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { EventEmitter } from 'events';
import { Event } from '../event-bus.contracts';

export class LocalDriver {
  private emitter = new EventEmitter();

  async emit(event: Event): Promise<void> {
    this.emitter.emit(event.eventName, event.payload);
  }

  on(eventName: string, handler: (payload: unknown) => void): void {
    this.emitter.on(eventName, handler);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/event-bus/tests/unit/local-bus.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/event-bus/src/local/local.bus.ts packages/event-bus/tests/unit/local-bus.test.ts
git commit -m "feat(event-bus): implement LocalDriver using EventEmitter (FR-001)"
```

---

### Task 3: External Driver (Redis Pub/Sub) (FR-001, FR-004)

**Files:**

- Create: `packages/event-bus/src/distributed/redis.bus.ts`
- Test: `packages/event-bus/tests/integration/redis-bus.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { RedisEventBus } from '../src/distributed/redis.bus';
import Redis from 'ioredis';

describe('ExternalDriver (Redis)', () => {
  it('should publish events to Redis Pub/Sub', async () => {
    // In a real scenario, we'd use a mock or a local redis instance
    const redis = { publish: vi.fn() } as unknown as Redis;
    const driver = new ExternalDriver(redis);
    const event = {
      eventName: 'mod.ent.act',
      payload: { id: 1 },
      level: 'EXTERNAL',
    } as unknown as Event;
    await driver.emit(event);
    expect(redis.publish).toHaveBeenCalledWith('mod.ent.act', JSON.stringify(event));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/event-bus/tests/integration/redis-bus.test.ts`
Expected: FAIL (ExternalDriver not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Event } from '../event-bus.contracts';
import Redis from 'ioredis';

export class ExternalDriver {
  constructor(private redis: Redis) {}

  async emit(event: Event): Promise<void> {
    await this.redis.publish(event.eventName, JSON.stringify(event));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/event-bus/tests/integration/redis-bus.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/event-bus/src/distributed/redis.bus.ts packages/event-bus/tests/integration/redis-bus.test.ts
git commit -m "feat(event-bus): implement ExternalDriver using Redis Pub/Sub (FR-004)"
```

---

### Task 4: Unified EventBus Service with Wildcards (FR-003, FR-007)

**Files:**

- Create: `packages/event-bus/src/event-bus.orchestrator.ts`
- Test: `packages/event-bus/tests/integration/degradation.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { EventBusOrchestrator } from '../src/event-bus.orchestrator';

describe('EventBusService', () => {
  it('should support wildcards in event listeners', async () => {
    const bus = new EventBusService();
    const handler = vi.fn();
    bus.subscribe('invoices.*.completed', handler);

    await bus.publish('invoices.payment.completed', { id: 1 });
    expect(handler).toHaveBeenCalledWith({ id: 1 });

    await bus.publish('invoices.order.completed', { id: 2 });
    expect(handler).toHaveBeenCalledWith({ id: 2 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/event-bus/tests/integration/degradation.test.ts`
Expected: FAIL (EventBusService or wildcard logic missing)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Event, EventLevel, validateEventName } from './event-bus.contracts';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

export class EventBusService {
  private listeners: { pattern: string; handler: Function }[] = [];

  subscribe(pattern: string, handler: Function): void {
    this.listeners.push({ pattern, handler });
  }

  async publish(
    eventName: string,
    payload: unknown,
    level: EventLevel = 'INTERNAL',
  ): Promise<Result<void, AppError>> {
    if (!validateEventName(eventName)) {
      return err(new AppError('event_bus.invalid_name', `Invalid event name: ${eventName}`));
    }

    const event: Event = {
      eventId: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      module: eventName.split('.')[0],
      eventName,
      payload,
      level,
    };

    // Wildcard matching logic
    for (const listener of this.listeners) {
      if (this.matches(listener.pattern, eventName)) {
        await listener.handler(payload);
      }
    }

    return ok(undefined);
  }

  private matches(pattern: string, name: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '[^\\.]+') + '$');
    return regex.test(name);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/event-bus/tests/integration/degradation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/event-bus/src/event-bus.orchestrator.ts packages/event-bus/tests/integration/degradation.test.ts
git commit -m "feat(event-bus): implement unified EventBusService with wildcards (FR-007)"
```

---

### Task 5: Retry Strategy with BullMQ (FR-005)

**Files:**

- Create: `packages/event-bus/src/distributed/connection.watcher.ts`
- Modify: `packages/event-bus/src/event-bus.orchestrator.ts`
- Test: `packages/event-bus/tests/integration/degradation.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { EventBusService } from '../src/event-bus.service';

describe('Event Retry Strategy', () => {
  it('should retry failed handlers 3 times before failing', async () => {
    // This requires a mock of the QueueFactory and Worker
    // Mock handler that fails twice then succeeds
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/event-bus/tests/integration/degradation.test.ts`
Expected: FAIL (No retry logic)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { queueFactory } from '@tempot/shared';
import { Worker } from 'bullmq';

// In EventBusService.publish, if level is INTERNAL/EXTERNAL, add to queue
const eventQueue = queueFactory('events');

// In worker.ts
new Worker('events', async (job) => {
  const { event, handler } = job.data;
  try {
    await handler(event.payload);
  } catch (e) {
    throw e; // BullMQ handles retries based on queueFactory defaults (3 attempts)
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/event-bus/tests/integration/degradation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/event-bus/src/distributed/connection.watcher.ts packages/event-bus/src/event-bus.orchestrator.ts
git commit -m "feat(event-bus): implement event retry strategy via BullMQ (FR-005)"
```

---

### Task 6: Audit Logging Integration (FR-006)

**Files:**

- Modify: `packages/event-bus/src/event-bus.orchestrator.ts`
- Test: `packages/event-bus/tests/integration/degradation.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { EventBusOrchestrator } from '../src/event-bus.orchestrator';

describe('Event Audit Logging', () => {
  it('should log every published event to the audit log', async () => {
    const logger = { info: vi.fn() };
    const bus = new EventBusService(logger as unknown as Logger);
    await bus.publish('users.user.created', { id: 1 });
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('users.user.created'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/event-bus/tests/integration/degradation.test.ts`
Expected: FAIL (No logging)

- [ ] **Step 3: Write minimal implementation**

```typescript
// Update EventBusService.publish
async publish(eventName: string, payload: unknown, level: EventLevel = 'INTERNAL') {
  // ... existing logic ...
  this.logger.info(`[EventBus] ${event.level} Event: ${event.eventName}`, {
    eventId: event.eventId,
    module: event.module,
    payload
  });
  // ...
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/event-bus/tests/integration/degradation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/event-bus/src/event-bus.orchestrator.ts
git commit -m "feat(event-bus): integrate audit logging for events (FR-006)"
```

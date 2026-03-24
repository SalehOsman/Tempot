# Session Manager Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the foundational session-manager package with a dual-layer strategy (Redis + PostgreSQL) and global access via `AsyncLocalStorage`.

**Architecture:** Primary fast read/write to Redis with asynchronous background sync to PostgreSQL via the `event-bus` for long-term persistence and historical queries.

**Tech Stack:** TypeScript, ioredis, Prisma, AsyncLocalStorage, @tempot/event-bus.

---

### Task 1: Dual-layer Persistence Logic with Event Bus Sync

**Files:**
- Create: `packages/session-manager/src/persistence/session.provider.ts`
- Test: `packages/session-manager/tests/unit/session-persistence.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { SessionProvider } from '../src/persistence/session.provider';

describe('Session Persistence', () => {
  it('should save to Redis and emit event-bus sync event', async () => {
    const eventBus = { publish: vi.fn() };
    const provider = new SessionProvider(eventBus as any);
    await provider.save({ userId: '1', role: 'USER' });
    
    const redisSession = await provider.getFromRedis('1');
    expect(redisSession).toBeDefined();
    expect(eventBus.publish).toHaveBeenCalledWith('session.updated', expect.any(Object), 'INTERNAL');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/session-manager/tests/unit/session-persistence.test.ts`
Expected: FAIL (SessionProvider not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { Redis } from 'ioredis';

export class SessionProvider {
  private redis = new Redis();

  constructor(private eventBus: any) {}

  async save(session: any) {
    // Primary fast write
    await this.redis.set(`session:${session.userId}`, JSON.stringify(session), 'EX', 86400);
    
    // Asynchronous background sync via event bus
    this.eventBus.publish('session.updated', session, 'INTERNAL').catch(console.error);
  }

  async getFromRedis(userId: string) {
    const data = await this.redis.get(`session:${userId}`);
    return data ? JSON.parse(data) : null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/session-manager/tests/unit/session-persistence.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/session-manager/src/persistence/session.provider.ts
git commit -m "feat(session): implement basic dual-layer persistence with event-bus sync (FR-003)"
```

---

### Task 2: AsyncLocalStorage for Session Context

**Files:**
- Create: `packages/session-manager/src/context/session.context.ts`
- Test: `packages/session-manager/tests/unit/session-context.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { sessionStore } from '../src/context/session.context';

describe('Session Context', () => {
  it('should retrieve the session from the current context', () => {
    sessionStore.run({ userId: '123' }, () => {
      const session = sessionStore.getStore();
      expect(session?.userId).toBe('123');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/session-manager/tests/unit/session-context.test.ts`
Expected: FAIL (sessionStore not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { AsyncLocalStorage } from 'async_hooks';

export const sessionStore = new AsyncLocalStorage<{ userId: string; role?: string }>();

export function getSession() {
  return sessionStore.getStore();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/session-manager/tests/unit/session-context.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/session-manager/src/context/session.context.ts
git commit -m "feat(session): add AsyncLocalStorage for global session access"
```

---

### Task 3: Session Schema Versioning (Section 15.6)

**Files:**
- Create: `packages/session-manager/src/versioning/session.migrator.ts`
- Test: `packages/session-manager/tests/unit/session-versioning.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { migrateSession } from '../src/versioning/session.migrator';

describe('Session Migrator', () => {
  it('should migrate session data from v1 to v2', () => {
    const oldData = { _version: 1, name: 'Test' };
    const newData = migrateSession(oldData, 2);
    expect(newData._version).toBe(2);
    expect(newData.profile).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/session-manager/tests/unit/session-versioning.test.ts`
Expected: FAIL (migrateSession not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
export function migrateSession(data: any, targetVersion: number) {
  let current = { ...data };
  
  if (current._version === 1 && targetVersion >= 2) {
    current.profile = { name: current.name };
    delete current.name;
    current._version = 2;
  }
  
  return current;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/session-manager/tests/unit/session-versioning.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/session-manager/src/versioning/session.migrator.ts
git commit -m "feat(session): implement basic session schema versioning"
```

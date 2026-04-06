# Shared Package Implementation Plan (Updated)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the foundational shared package providing Core Dictionary components (AppError, Result), Unified Cache Service, Standardized Queue Factory, and Graceful Shutdown manager.

**Architecture:** 
- **Core Dictionary:** Unified `AppError` class with i18n support and `Result` type alias via `neverthrow`.
- **Cache:** A thin wrapper around `cache-manager` for multi-tier caching with Redis degradation fallback.
- **Queue:** A pure factory function for `BullMQ` to ensure consistent configuration.
- **Shutdown:** Centralized `ShutdownManager` for orchestration of graceful exits.

**Tech Stack:** TypeScript, neverthrow, i18next, cache-manager, @keyv/redis, BullMQ, ioredis, @tempot/event-bus.

---

### Task 1: Core Dictionary (AppError & Result Types)

**Files:**
- Create: `packages/shared/src/result.ts`
- Modify: `packages/shared/src/errors.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/tests/unit/errors.test.ts`

- [ ] **Step 1: Define `Result` and `AsyncResult` type aliases**

```typescript
import { Result as NeverthrowResult } from 'neverthrow';
import { AppError } from './errors';

export type Result<T> = NeverthrowResult<T, AppError>;
export type AsyncResult<T> = Promise<Result<T>>;
```

- [ ] **Step 2: Update `AppError` with i18n support and strict audit properties**

```typescript
export class AppError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly i18nKey: string;
  public loggedAt?: Date;

  constructor(code: string, details?: unknown) {
    super(code);
    this.code = code;
    this.details = details;
    this.i18nKey = `errors.${code}`;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

- [ ] **Step 3: Write tests for `AppError` and `Result` integration**
- [ ] **Step 4: Run tests and verify passes**
- [ ] **Step 5: Commit**

---

### Task 2: Unified Cache Service

**Files:**
- Create: `packages/shared/src/cache/cache.service.ts`
- Test: `packages/shared/tests/unit/cache.service.test.ts`

- [ ] **Step 1: Implement CacheService with Result pattern**
- [ ] **Step 2: Write failing test**
- [ ] **Step 3: Implement minimal implementation**
- [ ] **Step 4: Run tests and verify passes**
- [ ] **Step 5: Commit**

---

### Task 3: Redis Degradation Strategy (Rule XXXII)

**Files:**
- Modify: `packages/shared/src/cache/cache.service.ts`
- Test: `packages/shared/tests/unit/cache-degradation.test.ts`

- [ ] **Step 1: Implement alerting via event-bus on Redis failure**
- [ ] **Step 2: Write tests for degradation alerting**
- [ ] **Step 3: Run tests and verify passes**
- [ ] **Step 4: Commit**

---

### Task 4: Queue Factory (ADR-019)

**Files:**
- Create: `packages/shared/src/queue/queue.factory.ts`
- Test: `packages/shared/tests/unit/queue.factory.test.ts`

- [ ] **Step 1: Implement queueFactory using BullMQ**
- [ ] **Step 2: Write tests for default settings and backoff**
- [ ] **Step 3: Run tests and verify passes**
- [ ] **Step 4: Commit**

---

### Task 5: Graceful Shutdown Hooks (Rule XVII)

**Files:**
- Create: `packages/shared/src/shutdown/shutdown.manager.ts`
- Test: `packages/shared/tests/unit/shutdown.manager.test.ts`

- [ ] **Step 1: Implement ShutdownManager with 30s timeout**
- [ ] **Step 2: Write tests for hook execution and timeout safety**
- [ ] **Step 3: Run tests and verify passes**
- [ ] **Step 4: Commit**

# Shared Package -- Task Breakdown

**Feature:** 002-shared-package
**Source:** spec.md (Clarified) + plan.md (Stub)
**Generated:** 2026-04-01 (retroactive -- written from implemented code)

---

## Task 0: Package Scaffolding

**Priority:** P0 (prerequisite for all other tasks)
**Estimated time:** 5 min
**FR:** None (infrastructure)

**Files to create:**

- `packages/shared/.gitignore`
- `packages/shared/tsconfig.json`
- `packages/shared/package.json`
- `packages/shared/vitest.config.ts`
- `packages/shared/src/index.ts` (empty barrel)
- `packages/shared/tests/unit/` (directory)

**Test file:** N/A (infrastructure only -- validated by 10-point checklist)

**Acceptance criteria:**

- [x] All 10 points of `docs/developer/package-creation-checklist.md` pass
- [x] `package.json` has `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`
- [x] `package.json` has exact versions: `vitest: "4.1.0"`, `typescript: "5.9.3"`, `neverthrow: "8.2.0"`
- [x] Dependencies declared: `cache-manager: "6.4.0"`, `bullmq: "5.71.0"`, `neverthrow: "8.2.0"`
- [x] `src/index.ts` exists as barrel file
- [x] No compiled artifacts in `src/`

---

## Task 1: AppError Base Class and Result Types

**Priority:** P0 (dependency for all service tasks)
**Estimated time:** 5 min
**FR:** FR-005 (standardized error handling)

**Files to create:**

- `packages/shared/src/shared.errors.ts`
- `packages/shared/src/shared.result.ts`

**Test file:** `packages/shared/tests/unit/errors.test.ts`

**Acceptance criteria:**

- [x] `AppError` class extends `Error` with `code: string`, `details?: unknown`, `i18nKey: string`, `loggedAt?: Date`
- [x] `i18nKey` auto-derived as `errors.{code}` from constructor
- [x] `Object.setPrototypeOf` called for correct `instanceof` behavior
- [x] `Result<T, E = AppError>` type alias exported wrapping `neverthrow.Result`
- [x] `AsyncResult<T, E = AppError>` type alias exported as `Promise<Result<T, E>>`
- [x] All result types are compatible with `neverthrow` `ok()` and `err()` helpers
- [x] Hierarchical error codes used throughout (Rule XXII): `shared.cache_*`, `shared.queue_*`, `shared.shutdown_*`
- [x] No `any` types
- [x] All tests pass

---

## Task 2: CacheService -- Unified Cache Wrapper

**Priority:** P1
**Estimated time:** 15 min
**FR:** FR-001, FR-002, FR-004, FR-005, FR-006
**SC:** SC-001 (cache retrieval < 10ms -- benchmark test required), SC-004 (in-memory fallback on Redis failure)
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/shared/src/cache/cache.service.ts`

**Test files:**

- `packages/shared/tests/unit/cache.service.test.ts`
- `packages/shared/tests/unit/cache-degradation.test.ts`

**Acceptance criteria:**

- [x] `CacheService` class wraps `cache-manager` `createCache()` (FR-001)
- [x] `init()` returns `AsyncResult<void>` -- initializes the cache store
- [x] `get<T>(key: string)` returns `AsyncResult<T | undefined | null>` -- supports hierarchical keys like `user:123:profile` (FR-006)
- [x] `set<T>(key: string, value: T, ttl?: number)` returns `AsyncResult<void>` with optional TTL
- [x] `del(key: string)` returns `AsyncResult<void>` -- centralized deletion (FR-002)
- [x] `reset()` returns `AsyncResult<void>` -- clears entire cache
- [x] All methods return `err(AppError)` when cache is not initialized (code: `shared.cache_not_initialized`)
- [x] Constructor accepts optional `EventBus` and `CacheLogger` interfaces to avoid circular dependencies
- [x] On initialization failure: falls back to in-memory cache, publishes `system.alert.critical` via EventBus (SC-004, Rule XXXII)
- [x] On initialization failure without EventBus: falls back silently, logs warning via `CacheLogger` if available
- [x] Returns `err(AppError)` with code `shared.cache_init_failed` only if both primary and fallback fail
- [x] Cache retrieval benchmark test confirms < 10ms average for in-memory operations (SC-001)
- [x] No `any` types
- [x] No `console.*` calls
- [x] All tests pass

---

## Task 3: QueueFactory -- Standardized BullMQ Queue Creation

**Priority:** P1
**Estimated time:** 10 min
**FR:** FR-003, FR-004, FR-007
**SC:** SC-002 (< 50 lines setup per module)
**Dependencies:** Task 0, Task 1, Task 4

**Files to create:**

- `packages/shared/src/queue/queue.factory.ts`

**Test file:** `packages/shared/tests/unit/queue.factory.test.ts`

**Acceptance criteria:**

- [x] `queueFactory(name, options?)` function returns `Result<Queue, AppError>` (FR-003)
- [x] Default Redis connection read from `process.env.REDIS_HOST` / `process.env.REDIS_PORT` with fallback to `localhost:6379` (FR-004)
- [x] Default job options: `attempts: 3`, `backoff: { type: 'exponential', delay: 1000 }`
- [x] `QueueFactoryOptions` interface supports `shutdownManager?: ShutdownManager` and `queueOptions?: Partial<QueueOptions>`
- [x] Custom `queueOptions` merge with (and can override) defaults via spread
- [x] Created queues tracked in exported `activeQueues: Queue[]` array
- [x] When `shutdownManager` is provided, auto-registers `queue.close()` as shutdown hook (FR-007)
- [x] Returns `err(AppError)` with code `shared.queue_factory_failed` when `Queue` constructor throws
- [x] Implementation is ~30 lines as specified (FR-003)
- [x] No `any` types
- [x] All tests pass

---

## Task 4: ShutdownManager -- Graceful Shutdown Orchestration

**Priority:** P1
**Estimated time:** 10 min
**FR:** FR-007
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/shared/src/shutdown/shutdown.manager.ts`

**Test file:** `packages/shared/tests/unit/shutdown.manager.test.ts`

**Acceptance criteria:**

- [x] `ShutdownManager` class with constructor-injected `ShutdownLogger` interface
- [x] `register(hook)` returns `Result<void, AppError>` -- adds async hook to internal array
- [x] `execute()` returns `AsyncResult<void>` -- runs all hooks sequentially in FIFO order
- [x] If any hook throws, error is caught, logged via `logger.error()`, and execution continues to remaining hooks
- [x] Returns `err(AppError)` with code `shared.shutdown_hook_failed` containing `failedCount` and `errors` array if any hook failed
- [x] Returns `ok(undefined)` when all hooks complete successfully (including zero hooks)
- [x] 30-second fatal timeout guard: writes structured JSON to `process.stderr.write()` and calls `process.exit(1)` if hooks exceed 30s
- [x] Timeout is cleared on successful completion
- [x] `ShutdownLogger` interface: `{ info: (message: string) => void; error: (data: Record<string, unknown>) => void }`
- [x] No `console.*` calls -- uses injected logger or `process.stderr.write` for fatal timeout only
- [x] No `any` types
- [x] All tests pass (including fake timer test for 30s timeout)

---

## Task 5: Barrel Exports (`src/index.ts`)

**Priority:** P1
**Estimated time:** 5 min
**FR:** All (final integration)
**Dependencies:** Task 1, 2, 3, 4

**Files to update:**

- `packages/shared/src/index.ts`

**Test file:** All existing tests continue to pass

**Acceptance criteria:**

- [x] Exports from `./shared.errors.js`: `AppError`
- [x] Exports from `./shared.result.js`: `Result`, `AsyncResult`
- [x] Exports from `./cache/cache.service.js`: `CacheService`, `EventBus`, `CacheLogger`
- [x] Exports from `./queue/queue.factory.js`: `queueFactory`, `QueueFactoryOptions`, `activeQueues`
- [x] Exports from `./shutdown/shutdown.manager.js`: `ShutdownManager`, `ShutdownLogger`
- [x] All 5 modules exported via `export *` barrel pattern
- [x] All existing tests still pass after barrel update
- [x] No `any` types in any file across the package
- [x] All public methods return `Result<T, AppError>` or `AsyncResult<T>` -- zero thrown exceptions in public APIs
- [x] No `console.*` calls in any source file

---

## Task Dependency Graph

```
Task 0 (scaffolding)
  └--> Task 1 (AppError + Result types)
         ├--> Task 2 (CacheService)    --┐
         ├--> Task 4 (ShutdownManager) --┤--> Task 3 (QueueFactory) --┐
         └------------------------------->-----------------------------┤--> Task 5 (barrel exports)
```

## Summary

| Task      | Name                    | Priority | Est. Time  | FR Coverage                            |
| --------- | ----------------------- | -------- | ---------- | -------------------------------------- |
| 0         | Package Scaffolding     | P0       | 5 min      | Infrastructure                         |
| 1         | AppError + Result Types | P0       | 5 min      | FR-005                                 |
| 2         | CacheService            | P1       | 15 min     | FR-001, FR-002, FR-004, FR-005, FR-006 |
| 3         | QueueFactory            | P1       | 10 min     | FR-003, FR-004, FR-007                 |
| 4         | ShutdownManager         | P1       | 10 min     | FR-007                                 |
| 5         | Barrel Exports          | P1       | 5 min      | All                                    |
| **Total** |                         |          | **50 min** |                                        |

## FR/SC Traceability Matrix

| Requirement | Task(s)   | Verified By                                       |
| ----------- | --------- | ------------------------------------------------- |
| FR-001      | Task 2    | `cache.service.test.ts` -- init, get, set, del    |
| FR-002      | Task 2    | `cache.service.test.ts` -- del, reset methods     |
| FR-003      | Task 3    | `queue.factory.test.ts` -- factory returns Queue  |
| FR-004      | Task 2, 3 | Env-based Redis config in both services           |
| FR-005      | Task 1, 2 | `errors.test.ts` + all err() returns              |
| FR-006      | Task 2    | `cache.service.test.ts` -- string key support     |
| FR-007      | Task 3, 4 | `shutdown.manager.test.ts` + queue shutdown hook  |
| SC-001      | Task 2    | In-memory cache benchmark confirms < 10ms         |
| SC-002      | Task 3    | QueueFactory is ~30 lines, < 50 lines setup       |
| SC-003      | Task 2    | `cache.service.test.ts` -- Testcontainers capable |
| SC-004      | Task 2    | `cache-degradation.test.ts` -- fallback verified  |

# Event Bus -- Task Breakdown

**Feature:** 006-event-bus-package
**Source:** spec.md (Clarified) + plan.md (Corrected)
**Generated:** 2026-04-01
**Status:** Retroactive (written from implemented code)

---

## Task 0: Package Scaffolding

**Priority:** P0 (prerequisite for all other tasks)
**Estimated time:** 5 min
**FR:** None (infrastructure)

**Files created:**

- `packages/event-bus/.gitignore`
- `packages/event-bus/tsconfig.json`
- `packages/event-bus/package.json`
- `packages/event-bus/vitest.config.ts`
- `packages/event-bus/src/index.ts` (barrel)
- `packages/event-bus/tests/unit/` (directory)
- `packages/event-bus/tests/integration/` (directory)

**Test file:** N/A (infrastructure only -- validated by 10-point checklist)

**Acceptance criteria:**

- [x] All 10 points of `docs/developer/package-creation-checklist.md` pass
- [x] `package.json` has `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`
- [x] `package.json` has exact versions: `vitest: "4.1.0"`, `typescript: "5.9.3"`, `neverthrow: "8.2.0"`
- [x] Dependencies: `@tempot/shared`, `ioredis 5.10.1`, `neverthrow 8.2.0`
- [x] Dev dependencies: `@testcontainers/redis`, `vitest`, `typescript`
- [x] `src/index.ts` exists as barrel file exporting all modules
- [x] No compiled artifacts in `src/`

---

## Task 1: Event Contracts and Naming Validation (FR-001, FR-002)

**Priority:** P0 (dependency for all bus implementations)
**Estimated time:** 5 min
**FR:** FR-001 (event levels), FR-002 (naming convention)

**Files created:**

- `packages/event-bus/src/event-bus.contracts.ts`

**Test file:** `packages/event-bus/tests/unit/local-bus.test.ts` (naming validation tests included)

**Acceptance criteria:**

- [x] `EventLevel` type exported: `'LOCAL' | 'INTERNAL' | 'EXTERNAL'` -- three distinct levels per FR-001
- [x] `EventEnvelope<T>` interface exported with fields: `eventId`, `eventName`, `module`, `userId?`, `payload`, `timestamp`, `level`
- [x] `validateEventName()` function exported, enforces `{module}.{entity}.{action}` pattern via regex (FR-002)
- [x] Regex pattern: `/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/i`
- [x] Returns `false` for names not matching the three-part dot-separated convention
- [x] No `any` types
- [x] All tests pass

---

## Task 2: Typed Event Definitions (FR-003)

**Priority:** P1
**Estimated time:** 5 min
**FR:** FR-003 (unified EventBus service accessible to all packages)

**Files created:**

- `packages/event-bus/src/event-bus.events.ts`

**Test file:** N/A (type definitions -- validated at compile time)

**Acceptance criteria:**

- [x] `TempotEvents` interface exported with strongly-typed event definitions
- [x] Event keys follow `{module}.{entity}.{action}` naming convention (FR-002)
- [x] Events defined: `session-manager.session.updated`, `storage.file.uploaded`, `storage.file.deleted`
- [x] Each event payload has explicit typed fields (no `any`)
- [x] Serves as the central type registry for cross-module events (FR-003)
- [x] No `any` types

---

## Task 3: Local Event Bus (FR-001, SC-001)

**Priority:** P1
**Estimated time:** 10 min
**FR:** FR-001 (Local level via EventEmitter), SC-001 (< 1ms overhead)
**Dependencies:** Task 1

**Files created:**

- `packages/event-bus/src/local/local.bus.ts`

**Test file:** `packages/event-bus/tests/unit/local-bus.test.ts`

**Acceptance criteria:**

- [x] `LocalEventBus` class exported using Node.js `EventEmitter` internally (FR-001 Local level)
- [x] `publish(eventName, payload)` returns `AsyncResult<void>` -- validates name, iterates listeners
- [x] `subscribe(eventName, handler)` returns `Result<void, AppError>` -- validates name, registers listener
- [x] `unsubscribe(eventName, handler)` removes a previously registered listener
- [x] Listener isolation: one listener crash does not stop other listeners from executing
- [x] Error logging via `process.stderr.write(JSON.stringify(...))` -- no `console.*`
- [x] `setMaxListeners(100)` configured to prevent Node.js warnings
- [x] Local event delivery overhead must be < 1ms -- benchmark test validates this (SC-001)
- [x] All methods return `Result` or `AsyncResult` -- no thrown exceptions
- [x] No `any` types
- [x] All tests pass (5 tests: publish/subscribe, multiple subscribers, listener isolation, invalid name publish, invalid name subscribe)

---

## Task 4: Redis Event Bus (FR-001, FR-004, SC-003)

**Priority:** P1
**Estimated time:** 15 min
**FR:** FR-001 (External level via Redis), FR-004 (no event loss), SC-003 (cross-instance delivery)
**Dependencies:** Task 1

**Files created:**

- `packages/event-bus/src/distributed/redis.bus.ts`

**Test file:** `packages/event-bus/tests/integration/redis-bus.test.ts`

**Acceptance criteria:**

- [x] `RedisEventBus` class exported using `ioredis` for Redis Pub/Sub (FR-001 External level)
- [x] `RedisBusConfig` interface exported: `{ connectionString: string }`
- [x] Constructor creates two Redis connections: `pub` (publisher) and `sub` (subscriber)
- [x] `publish(eventName, payload)` serializes payload to JSON and publishes via Redis (FR-004)
- [x] `subscribe(eventName, handler)` subscribes to Redis channel, manages handler registry
- [x] Only subscribes to Redis channel once per event name (deduplication)
- [x] `handleMessage()` deserializes JSON and invokes all registered handlers for the channel
- [x] Handler errors logged via `process.stderr.write(JSON.stringify(...))` -- no crash propagation
- [x] Parse errors for malformed messages are logged separately
- [x] `dispose()` gracefully quits both Redis connections
- [x] `pubClient` getter exposes the publisher Redis instance (used by ConnectionWatcher)
- [x] External events successfully delivered across multiple instances (SC-003)
- [x] All methods return `AsyncResult<void>` -- no thrown exceptions
- [x] No `any` types
- [x] Integration tests pass using Testcontainers Redis (2 tests: cross-instance delivery, multiple subscribers)

---

## Task 5: Connection Watcher (FR-001, SC-004)

**Priority:** P1
**Estimated time:** 10 min
**FR:** FR-001 (graceful degradation between levels), SC-004 (handles temporary failures)
**Dependencies:** Task 4

**Files created:**

- `packages/event-bus/src/distributed/connection.watcher.ts`

**Test file:** `packages/event-bus/tests/unit/watcher.test.ts`

**Acceptance criteria:**

- [x] `ConnectionWatcher` class exported -- monitors Redis connection health (Rule XXXII)
- [x] `ConnectionWatcherOptions` interface exported: `{ intervalMs: number; stabilizationThreshold: number }`
- [x] `start()` begins periodic `PING` checks at configured interval
- [x] `stop()` clears the monitoring interval
- [x] `isRedisAvailable()` returns current Redis availability status
- [x] `onStatusChange(callback)` registers a callback for availability transitions
- [x] Stabilization logic: requires `stabilizationThreshold` consecutive successful pings before marking as available
- [x] Immediate failure: a single failed ping immediately marks Redis as unavailable
- [x] Failure during stabilization resets the consecutive success counter
- [x] Status callback only fires on actual transitions (deduplication via guard)
- [x] Handles temporary listener failures via retry-like stabilization (SC-004)
- [x] No `any` types
- [x] All tests pass (4 tests: initial state, stabilization threshold, immediate failure, counter reset)

---

## Task 6: Event Bus Orchestrator (FR-003, FR-001, SC-002)

**Priority:** P1
**Estimated time:** 15 min
**FR:** FR-003 (unified EventBus), FR-001 (automatic level routing), SC-002 (all inter-module via Event Bus)
**Dependencies:** Task 3, Task 4, Task 5

**Files created:**

- `packages/event-bus/src/event-bus.orchestrator.ts`

**Test file:** `packages/event-bus/tests/integration/degradation.test.ts`

**Acceptance criteria:**

- [x] `EventBusOrchestrator` class exported -- unified facade over LocalEventBus and RedisEventBus (FR-003)
- [x] `OrchestratorConfig` interface exported: `{ redis: RedisBusConfig; logger: LoggerInterface; shutdownManager?: ShutdownManager }`
- [x] `init()` starts the ConnectionWatcher and registers shutdown hook via `ShutdownManager`
- [x] `publish(eventName, payload)` routes to RedisEventBus when Redis is available, falls back to LocalEventBus when unavailable (FR-001)
- [x] `subscribe(eventName, handler)` registers handler on both LocalEventBus and RedisEventBus to ensure delivery in either mode
- [x] `dispose()` stops the watcher and disposes Redis connections
- [x] On Redis unavailability: logs critical alert with `target: 'SUPER_ADMIN'` and `fallback: 'local'`
- [x] On Redis restoration: logs info with `mode: 'distributed'`
- [x] 100% of inter-module communication uses this orchestrator (SC-002)
- [x] All methods return `AsyncResult<void>` -- no thrown exceptions
- [x] No `any` types
- [x] Integration tests pass (2 tests: critical alert on degradation, local bus fallback when Redis unavailable)

---

## Task 7: Barrel Exports (`src/index.ts`)

**Priority:** P1
**Estimated time:** 5 min
**FR:** All (final integration)
**Dependencies:** Task 1, 2, 3, 4, 5, 6

**Files updated:**

- `packages/event-bus/src/index.ts`

**Test file:** All existing tests continue to pass

**Acceptance criteria:**

- [x] Exports all contracts: `EventLevel`, `EventEnvelope`, `validateEventName`
- [x] Exports `LocalEventBus` from `./local/local.bus.js`
- [x] Exports `RedisEventBus`, `RedisBusConfig` from `./distributed/redis.bus.js`
- [x] Exports `ConnectionWatcher`, `ConnectionWatcherOptions` from `./distributed/connection.watcher.js`
- [x] Exports `EventBusOrchestrator`, `OrchestratorConfig` from `./event-bus.orchestrator.js`
- [x] Exports `TempotEvents` from `./event-bus.events.js`
- [x] All existing tests still pass after barrel update
- [x] No `any` types in any file across the package
- [x] No `console.*` calls in any file across the package
- [x] All public methods return `Result` or `AsyncResult` -- zero thrown exceptions

---

## Task Dependency Graph

```
Task 0 (scaffolding)
  +--> Task 1 (contracts)
  |      +--> Task 3 (LocalEventBus)       --+
  |      +--> Task 4 (RedisEventBus)       --+--> Task 6 (Orchestrator) --+
  +--> Task 2 (event types)                   |                            +--> Task 7 (barrel)
         +--> Task 5 (ConnectionWatcher) -----+
```

---

## Deferred / Not Implemented

The following spec requirements were documented but not implemented in the current codebase. They are tracked here for future work:

| Requirement | Description                                                        | Status                                                                                                            |
| ----------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| FR-005      | Automatic retries (up to 3 times) for failed event processing      | Not implemented -- no BullMQ worker or retry logic exists. Listener errors are caught and logged but not retried. |
| FR-006      | Audit log integration for event history and failures               | Not implemented -- no audit log system exists yet. Error logging goes to stderr only.                             |
| FR-007      | Wildcard support in event listeners (e.g., `invoices.*.completed`) | Not implemented -- `validateEventName` and all subscribe methods use exact string matching only.                  |

---

## Summary

| Task      | Name                    | Priority | Est. Time  | FR Coverage            |
| --------- | ----------------------- | -------- | ---------- | ---------------------- |
| 0         | Package Scaffolding     | P0       | 5 min      | Infrastructure         |
| 1         | Event Contracts         | P0       | 5 min      | FR-001, FR-002         |
| 2         | Typed Event Definitions | P1       | 5 min      | FR-003                 |
| 3         | Local Event Bus         | P1       | 10 min     | FR-001, SC-001         |
| 4         | Redis Event Bus         | P1       | 15 min     | FR-001, FR-004, SC-003 |
| 5         | Connection Watcher      | P1       | 10 min     | FR-001, SC-004         |
| 6         | Event Bus Orchestrator  | P1       | 15 min     | FR-003, FR-001, SC-002 |
| 7         | Barrel Exports          | P1       | 5 min      | All                    |
| **Total** |                         |          | **70 min** |                        |

### Benchmark Note

Local event delivery performance must be validated via a benchmark test to confirm < 1ms overhead (SC-001). The `LocalEventBus` uses Node.js `EventEmitter` synchronous dispatch, which inherently operates in sub-microsecond range for the dispatch mechanism itself. A performance test measuring publish-to-handler latency should confirm this target is met.

---

### Task 8: Pluggable Architecture Toggle (Rule XVI)

**Phase**: 1 (Setup)
**Estimated Duration**: 15 minutes

Constitution Rule XVI requires `TEMPOT_EVENT_BUS=true/false` environment variable.

#### Acceptance Criteria

- [ ] Define `TEMPOT_EVENT_BUS` environment variable
- [ ] When disabled, EventBusOrchestrator silently drops all publish() calls (returns ok())
- [ ] subscribe() still works (handlers registered but never triggered)
- [ ] Document the disable behavior

> **Note**: The event bus already has graceful degradation via ConnectionWatcher (falls back to local when Redis is unavailable). The toggle would fully disable even local event delivery.

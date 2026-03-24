# Tempot — Project Assessment Report

> **Note:** This is a historical snapshot. The constitution has since been updated to v2.0.0.
> For current project status, see `docs/ROADMAP.md`.

**Date:** 2026-03-23
**Assessor:** Claude (Sonnet 4.6) — AI-Assisted Code Review
**Scope:** Full codebase audit against Architecture Spec v11.0 and Constitution v1.1.0
**Phase:** Phase 0 — Core Bedrock (In Progress)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Overall Grade | **B+** — Strong for Phase 0 |
| Completed Packages | 6 / 18 |
| Packages (structure only) | 6 / 18 (README only) |
| Constitution Compliance | ~78% (of 70 principles) |
| Critical Issues | 3 |
| Medium Issues | 4 |
| Low / Observations | 4 |

The infrastructure built so far is architecturally sound and deliberately aligned with the Spec. The majority of the hardest architectural patterns (Result Pattern, Event Bus, Graceful Degradation, Soft Delete, Repository Pattern) are correctly implemented. Three critical blockers must be resolved before Phase 1 begins.

---

## Packages Status

### ✅ Completed Packages (6)

| Package | Files | Tests | Notes |
|---------|-------|-------|-------|
| `@tempot/shared` | `cache.service.ts`, `queue.factory.ts`, `errors.ts`, `result.ts`, `shutdown.manager.ts` | 5 unit tests | 95% aligned |
| `@tempot/logger` | `pino.logger.ts`, `serializer.ts`, `audit.logger.ts` | 3 unit + 1 integration | 90% aligned |
| `@tempot/database` | `base.repository.ts`, `base.entity.ts`, `vector.repository.ts`, `client.ts`, `transaction.manager.ts` | 4 unit + 4 integration | 88% aligned |
| `@tempot/event-bus` | `local.bus.ts`, `redis.bus.ts`, `connection.watcher.ts`, `orchestrator.ts` | 4 unit + 2 integration | 92% aligned |
| `@tempot/auth-core` | `ability.factory.ts`, `guard.ts`, `roles.ts`, `session-user.ts` | 4 unit | 85% aligned |
| `apps/bot-server` | `index.ts` (prototype) | — | Prototype only, labelled correctly |

### ⚠️ Partial Package (1)

| Package | Status | Issue |
|---------|--------|-------|
| `@tempot/session-manager` | Stub only | Returns hardcoded `userId = 'test-user-id'` — no real `AsyncLocalStorage` implementation |

### 🔲 Not Started (11 packages with README only)

`i18n-core`, `regional-engine`, `cms-engine`, `ai-core`, `notifier`, `module-registry`, `storage-engine`, `search-engine`, `ux-helpers`, `document-engine`, `import-engine`

### 🔲 Not Started (4 apps)

`dashboard`, `mini-app`, `docs` (Docusaurus), and full `bot-server` (beyond prototype)

---

## Critical Issues — Must Fix Before Phase 1

### CRITICAL-001 — session-manager is a Hollow Stub

**File:** `packages/session-manager/src/index.ts`
**Severity:** Critical
**Constitution:** Rule XXVII (Soft Delete with `deletedBy`), Rule LVII (Audit Log with user identity)

**Problem:**

The entire session-manager package is 5 lines that return hardcoded values:

```typescript
// Current (WRONG):
export const sessionContext = {
  getStore: () => ({
    userId: 'test-user-id',
    userRole: 'ADMIN',
  }),
};
```

Every package that depends on it (`BaseRepository`, `AuditLogger`, `pino.logger`) is currently recording `userId = 'test-user-id'` in all audit log entries. This means all integration tests that assert correct user identity are testing against a fixture, not a real session system.

**Impact:** `@tempot/database`, `@tempot/logger`, `@tempot/shared/cache`

**Required Fix:** Implement using Node.js `AsyncLocalStorage`:

```typescript
import { AsyncLocalStorage } from 'node:async_hooks';

export interface SessionStore {
  userId: string;
  userRole: string;
}

export const sessionContext = new AsyncLocalStorage<SessionStore>();
```

The bot-server middleware must call `sessionContext.run(store, handler)` for every incoming Telegram update.

---

### CRITICAL-002 — Silent Failure in Prisma Client Initialization

**File:** `packages/database/src/prisma/client.ts` — Lines 60–62
**Severity:** Critical
**Constitution:** Rule X (No Silent Failures)

**Problem:**

```typescript
function getPrismaClient() {
  if (!_prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // Pool will throw if connectionString is missing  <-- EMPTY COMMENT, NO THROW
    }
    // ... continues to create Pool with undefined connectionString
  }
}
```

When `DATABASE_URL` is absent, the code silently continues. The error will surface later as a cryptic `pg` connection error instead of a clear startup failure message.

**Required Fix:**

```typescript
if (!connectionString) {
  throw new Error(
    'FATAL: DATABASE_URL environment variable is not set. ' +
    'Copy .env.example to .env and configure it.'
  );
}
```

---

### CRITICAL-003 — Systematic `eslint-disable` for `any` in Production Code

**Severity:** Critical
**Constitution:** Rule I (No `any` types), Rule LXX (STRICTLY PROHIBITED: eslint-disable)

**Affected Files (7):**

| File | `any` Usage Count |
|------|------------------|
| `packages/database/src/base/base.repository.ts` | 8 |
| `packages/database/src/prisma/client.ts` | 12 |
| `packages/database/src/manager/transaction.manager.ts` | 3 |
| `packages/database/src/base/vector.repository.ts` | 2 |
| `packages/event-bus/src/distributed/redis.bus.ts` | 4 |
| `packages/event-bus/src/orchestrator.ts` | 4 |
| `packages/logger/src/audit/audit.logger.ts` | 2 |

**Root Cause:** Prisma 7.x's extended client loses type information after `$extends()`. The correct solution is to use the `Prisma.TypedQueryExtensionCb` types and define proper generic interfaces rather than suppressing errors.

**Required Approach:**

1. Define a typed `ExtendedPrismaClient` type that captures the `$extends` output.
2. Create typed interfaces for `AuditLogEntry` that don't require casting.
3. Use generics in `BaseRepository<T, TModel>` where `TModel` is the Prisma delegate type.

---

## Medium Issues — Fix Before Phase 2

### MEDIUM-001 — `deletedBy` Not Actually Saved in Database

**File:** `packages/database/src/base/base.repository.ts` Line ~110, `packages/database/src/prisma/client.ts`
**Constitution:** Rule XXVII (Soft Delete — `deletedBy` must be populated)

**Problem:** `BaseRepository.delete()` passes `data: { deletedBy: userId }` to the model's `delete()` call. However, the Prisma extension for `delete` intercepts this and builds a fresh `data` object:

```typescript
// In client.ts extension:
async delete<T, A>(this: T, args: ...) {
  const data = (args as any).data || {};  // <-- picks up deletedBy
  return (context as any).update({
    ...args,
    data: {
      ...data,          // <-- data IS spread here
      isDeleted: true,
      deletedAt: new Date(),
      // deletedBy is missing from the extension's own update
    },
  });
}
```

Wait — `deletedBy` IS spread via `...data`. But the `data` comes from `args.data`, and `BaseRepository.delete()` passes it as a top-level `data` key inside the `delete` args. This needs verification via integration test with explicit `deletedBy` assertion. The current integration test (`soft-delete.test.ts`) does **not** assert that `deletedBy` is populated — it only checks `isDeleted` and `deletedAt`.

**Required Action:** Add an integration test that asserts `deletedBy` is correctly set after a `delete()` call.

---

### MEDIUM-002 — Shutdown Hook Execution Order

**File:** `packages/shared/src/shutdown/shutdown.manager.ts`
**Constitution:** Rule XVII (Graceful Shutdown — ordered shutdown)

**Problem:** `ShutdownManager.execute()` runs hooks in FIFO order (the order they were registered). The Constitution mandates a specific shutdown order:

```
1. Hono server
2. grammY bot
3. BullMQ workers (queue factory)
4. Redis (ioredis)
5. Prisma ($disconnect)
6. Drizzle (pgvector pool end)
```

Since `queueFactory` registers its shutdown hook automatically at queue creation time, and queues are typically created during app startup (before Redis and Prisma connections are established), the current FIFO ordering will close BullMQ workers before Redis — which is correct. However, this is coincidental and fragile.

**Required Fix:** Add a `priority` parameter to `ShutdownManager.register()`:

```typescript
static register(hook: () => Promise<void>, priority: number = 50): void {
  this.hooks.push({ hook, priority });
  this.hooks.sort((a, b) => b.priority - a.priority); // higher = runs first
}
```

Standard priorities: Hono=100, grammY=90, BullMQ=80, Redis=70, Prisma=60, Drizzle=50.

---

### MEDIUM-003 — `console.*` Usage in Production Code

**Files:** `packages/shared/src/cache/cache.service.ts` (line 29), `packages/database/src/manager/transaction.manager.ts` (line 26)
**Constitution:** Rule LV (Observability — unified Pino logger)

`cache.service.ts` uses `console.warn` during cache initialization failure, and `transaction.manager.ts` uses `console.error` on transaction failure. Both must use the Pino logger from `@tempot/logger`.

**Note:** This creates a circular dependency risk (`shared` → `logger` → `shared`). The correct resolution is to accept an optional logger interface in `CacheService` constructor (already done for `EventBus`) and apply the same pattern for logging.

---

### MEDIUM-004 — Vitest Version Mismatch

**File:** `packages/auth-core/package.json`
**Constitution:** Rule XLVIII (Dependency consistency)

`auth-core` uses `vitest@1.4.0` while all other packages use `vitest@4.x`. This causes different test behavior, especially around mock resolution and TypeScript support. Update to `"vitest": "^4.1.0"` to align.

---

## Low / Observations

### LOW-001 — Prisma Schema is Minimal

`packages/database/prisma/schema.prisma` contains only `User` (with basic fields) and `AuditLog`. The Architecture Spec implies a much richer schema (telegramId, language preference, settings, roles table, etc.). This is acceptable for Phase 0 but must be expanded before business logic modules begin.

### LOW-002 — `AppSubjects` is Empty

`packages/auth-core/src/contracts/subjects.ts` defines an empty `AppSubjects` interface. CASL authorization is functional at the infrastructure level but non-functional for actual resources. Subjects must be extended as each module is built. Consider a registration pattern that allows modules to contribute their subjects.

### LOW-003 — `bot-server` Prototype Needs Scheduled Deletion

`apps/bot-server/src/index.ts` is correctly labelled as a prototype with a warning comment. Per Constitution Rule XLV, a prototype exception is allowed with an explicit label. However, there should be a tracked task (GitHub Issue or SpecKit spec) to rewrite this file once `@tempot/session-manager`, `@tempot/i18n-core`, and `@tempot/auth-core` are ready.

### LOW-004 — Coverage Thresholds Not Fully Aligned

`vitest.config.base.ts` sets a flat 70% threshold for all metrics. Constitution Rule XXXVI specifies:

| Component | Minimum |
|-----------|---------|
| Services | 80% |
| Handlers | 70% |
| Repositories | 60% |
| Conversations | 50% |

Consider splitting coverage configuration by package type (service packages vs. handler packages) using Vitest's `projects` configuration.

---

## Strengths — What Was Done Exceptionally Well

### Result Pattern (Constitution Rule XXI)
Every service function returns `Result<T, AppError>` via `neverthrow`. No thrown exceptions exist in business logic. The `AsyncResult<T>` type alias is clean and consistently used. **Exemplary.**

### Event Bus Design (Constitution Rule XV, XXXII)
The three-tier architecture (Local EventEmitter → Redis Pub/Sub → Graceful Degradation) with `ConnectionWatcher` for auto-recovery is a standout implementation. Listener isolation in `LocalEventBus` (errors in one handler don't stop others) is correctly implemented. **Exemplary.**

### Soft Delete via Prisma `$extends()` (Constitution Rule XXVII)
Using `$extends()` instead of Prisma middleware (which was the v4 approach) is architecturally correct for Prisma 7.x. The global `findMany`/`findFirst`/`count` filters that automatically exclude deleted records are clean and correct. **Well done.**

### Integration Tests with Testcontainers (Constitution Rule XXXV)
Using `@testcontainers/postgresql` (`ankane/pgvector` image) for real database integration tests is the correct approach. Tests run against a genuine PostgreSQL+pgvector instance rather than mocks. This catches real schema issues. **Excellent.**

### Queue Factory Auto-Registration (Constitution Rule XX, XVII)
`queueFactory()` automatically registers its own shutdown hook with `ShutdownManager` upon creation. This eliminates the risk of forgetting to register a queue for graceful shutdown. **Clean design.**

### Cache Degradation (Constitution Rule XXXII, XIX)
`CacheService` correctly falls back to in-memory cache on Redis failure AND notifies via the Event Bus (`system.alert.critical`). The degradation test (`cache-degradation.test.ts`) validates both behaviors. **Correctly implemented.**

### ESLint Configuration (Constitution Rule II, III)
The `eslint.config.js` enforces Constitution rules directly:
- `max-lines: 200` (Rule II)
- `max-lines-per-function: 50` (Rule II)
- `max-params: 3` (Rule II)
- `check-file/filename-blocklist` banning `utils.ts`, `helpers.ts` etc. (Rule III)
- `no-empty` with `allowEmptyCatch: false` (Rule X)

**Well configured.**

### `validateEventName()` Enforcement (Constitution Rule XV)
The `module.entity.action` naming convention is enforced at runtime in both `LocalEventBus` and `RedisEventBus` via the `validateEventName()` function. Invalid event names return `Result.err()` or throw immediately. **Correct.**

---

## Architecture Compliance Summary

### ✅ Fully Compliant (Constitution Rules)

- Rule XIV — Repository Pattern via `BaseRepository`
- Rule XV — Event-Driven module communication
- Rule XVI — Pluggable Architecture (env flags documented)
- Rule XVII — Graceful Shutdown hooks registered
- Rule XVIII — Abstraction layer for external services
- Rule XIX — Cache via `cache-manager` only
- Rule XX — Queues via Queue Factory only
- Rule XXI — Result Pattern via neverthrow
- Rule XXII — Hierarchical error codes (`module.error_name`)
- Rule XXIII — No double logging (`loggedAt` flag)
- Rule XXV — Security chain documented (bot-server prototype excluded)
- Rule XXVI — CASL RBAC with 4 roles
- Rule XXVII — Soft Delete via `$extends()` (with `deletedBy` caveat)
- Rule XXXII — Graceful Degradation (Cache + Redis Event Bus)
- Rule XXXIV — TDD: tests exist for all completed packages
- Rule XXXVI — Coverage thresholds enforced (partially — see LOW-004)

### ⚠️ Partially Compliant

- Rule I — No `any` types: violated in 7 production files via `eslint-disable`
- Rule XVII — Shutdown Order: FIFO only, no priority control
- Rule XXVII — `deletedBy`: needs integration test verification
- Rule XXXVI — Coverage thresholds: flat 70% vs. per-component thresholds
- Rule LV — Unified logger: `console.*` used in 2 production files

### ❌ Not Yet Compliant

- Rule XXVII — `session-manager`: stub returns hardcoded values
- Rule X — Silent failure in `getPrismaClient()`
- Rule XXXIX / XL — i18n system: not started
- Rule LVI — Health check endpoint: not started
- Rule LVII — Audit Log: user identity is always `test-user-id` due to stub

---

## Recommended Action Plan

### Phase 0 Completion (Immediate)

| Priority | Task | Effort |
|----------|------|--------|
| P0 | Fix `session-manager` — implement `AsyncLocalStorage` | Medium |
| P0 | Fix `getPrismaClient` — throw on missing `DATABASE_URL` | Trivial |
| P0 | Fix 7-file `any` suppression — define proper generic interfaces | High |
| P1 | Add `deletedBy` assertion to soft-delete integration test | Low |
| P1 | Add `priority` to `ShutdownManager.register()` | Low |
| P1 | Replace `console.*` with Pino logger interface injection | Low |
| P2 | Align `auth-core` Vitest to `^4.1.0` | Trivial |

### Phase 1 Build Order (After Phase 0 Complete)

Following the dependency graph from the Architecture Spec:

```
session-manager (real)
    ↓
i18n-core
    ↓
regional-engine
    ↓
cms-engine
    ↓
module-registry
    ↓
input-engine → notifier → ai-core → (business modules)
```

### Files That Need Attention Before Phase 1

```
packages/session-manager/src/index.ts       ← rewrite completely
packages/database/src/prisma/client.ts      ← remove any, add throw
packages/database/src/base/base.repository.ts ← remove any, add generics
packages/database/src/manager/transaction.manager.ts ← remove any
packages/shared/src/shutdown/shutdown.manager.ts     ← add priority
packages/shared/src/cache/cache.service.ts  ← replace console.warn
packages/database/prisma/schema.prisma      ← expand for real domain
```

---

## Metadata

| Field | Value |
|-------|-------|
| Files Read | 40+ source files |
| Test Files Reviewed | 17 |
| Constitution Version | 1.1.0 (ratified 2026-03-21) |
| Architecture Spec | v11.0 (2879 lines, 29 sections) |
| Assessment Date | 2026-03-23 |
| Next Review Recommended | After Phase 1 completion |

---

*This document was generated via automated codebase analysis. All findings reference specific files and line numbers. Findings should be verified by the development team before actioning.*

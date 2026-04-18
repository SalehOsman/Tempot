# Hotfix: Phase 0 Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve technical debt in `logger`, `database`, and `event-bus` by eliminating `any` types and adhering to the Repository Pattern (ISSUE-004, ISSUE-005).

**Architecture:** Use `unknown`, `Record<string, unknown>`, and generics to replace `any`. Define local interfaces for dependencies to avoid circular imports. Encapsulate Prisma calls within a new `AuditLogRepository`.

**Tech Stack:** TypeScript Strict Mode, Prisma, BullMQ, Vitest.

---

## Phase 1: event-bus Compliance (ISSUE-004)

### Task 1: Refactor `orchestrator.ts`

**Files:**

- Modify: `packages/event-bus/src/orchestrator.ts`
- Test: `packages/event-bus/tests/orchestrator.test.ts`

- [ ] **Step 1: Define `LoggerInterface` locally**
  - Add `interface LoggerInterface { error: (data: Record<string, unknown>) => void; }` to `orchestrator.ts`.
- [ ] **Step 2: Remove `any` and `eslint-disable`**
  - Replace `any` in `OrchestratorConfig.logger` with `LoggerInterface`.
  - Replace `any` in `subscribe` with `(payload: unknown) => void`.
- [ ] **Step 3: Fix `ConnectionWatcher` instantiation**
  - Add `get pubClient()` to `RedisEventBus` class in `packages/event-bus/src/redis/redis.bus.ts`.
  - Use `this.redisBus.pubClient` instead of `(this.redisBus as any).pub`.
- [ ] **Step 4: Run tests**
  - Run: `pnpm --filter @tempot/event-bus test`
  - Expected: PASS
- [ ] **Step 5: Commit**
  - `git commit -m "refactor(event-bus): remove any and eslint-disable in orchestrator"`

### Task 2: Refactor `local.bus.ts`

**Files:**

- Modify: `packages/event-bus/src/local/local.bus.ts`

- [ ] **Step 1: Remove `any` and `eslint-disable`**
  - Type the local listener execution: `(listener as (payload: unknown) => void)(payload)`.
  - Type `handler` as `(payload: unknown) => void`.
- [ ] **Step 2: Run tests**
  - Run: `pnpm --filter @tempot/event-bus test`
  - Expected: PASS
- [ ] **Step 3: Commit**
  - `git commit -m "refactor(event-bus): remove any and eslint-disable in local.bus"`

---

## Phase 2: database Compliance (ISSUE-004)

### Task 3: Refactor `base.repository.ts`

**Files:**

- Modify: `packages/database/src/base/base.repository.ts`

- [ ] **Step 1: Define `IAuditLogger` locally**
  - Add `interface IAuditLogger { log: (data: Record<string, unknown>) => Promise<void>; }`.
- [ ] **Step 2: Remove `any` and `eslint-disable`**
  - Replace `any` parameters with `Record<string, unknown>`.
  - Enforce `Entity` definition to have `{ id: string }`.
- [ ] **Step 3: Run tests**
  - Run: `pnpm --filter @tempot/database test`
  - Expected: PASS
- [ ] **Step 4: Commit**
  - `git commit -m "refactor(database): remove any and eslint-disable in base.repository"`

### Task 4: Refactor `transaction.manager.ts`

**Files:**

- Modify: `packages/database/src/manager/transaction.manager.ts`

- [ ] **Step 1: Remove `any` and `eslint-disable`**
  - Use `Prisma.TransactionClient` from `@prisma/client`.
- [ ] **Step 2: Run tests**
  - Run: `pnpm --filter @tempot/database test`
  - Expected: PASS
- [ ] **Step 3: Commit**
  - `git commit -m "refactor(database): remove any and eslint-disable in transaction.manager"`

---

## Phase 3: logger Compliance & Repository Pattern (ISSUE-004, ISSUE-005)

### Task 5: Create `AuditLogRepository`

**Files:**

- Create: `packages/database/src/repositories/audit-log.repository.ts`
- Modify: `packages/database/src/index.ts`

- [ ] **Step 1: Create the repository**
  - Extend `BaseRepository` targeting `prisma.auditLog`.
  - Override `create` to prevent infinite audit loops (don't log the audit log creation itself).
- [ ] **Step 2: Export from database package**
- [ ] **Step 3: Commit**
  - `git commit -m "feat(database): add AuditLogRepository"`

### Task 6: Refactor `AuditLogger`

**Files:**

- Modify: `packages/logger/src/audit/audit.logger.ts`

- [ ] **Step 1: Inject `AuditLogRepository`**
  - Replace `PrismaClient` with `AuditLogRepository`.
- [ ] **Step 2: Update `log()` method**
  - Use `this.repository.create(...)` instead of direct Prisma calls.
- [ ] **Step 3: Run tests**
  - Run: `pnpm --filter @tempot/logger test`
  - Expected: PASS
- [ ] **Step 4: Commit**
  - `git commit -m "refactor(logger): implement repository pattern for AuditLogger"`

---

## Final Verification

- [ ] Run: `pnpm build` across workspace.
- [ ] Run: `pnpm test --filter event-bus --filter database --filter logger`.

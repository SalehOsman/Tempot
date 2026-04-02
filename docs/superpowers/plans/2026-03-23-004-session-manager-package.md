# 004-session-manager-package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational session-manager package using a dual-layer strategy (Redis + Postgres) as per Architecture Spec v11 Blueprint.

**Architecture:** Use cache-manager for Redis fast access (<2ms) and BullMQ + event-bus to asynchronously sync session states to Postgres. Utilize Optimistic Concurrency Control (OCC) to handle multiple rapid messages.

**Tech Stack:** TypeScript Strict Mode 5.9.3, Vitest + Testcontainers, Redis (ioredis via cache-manager), PostgreSQL (via Prisma), BullMQ, neverthrow.

---

## Phase 1: Setup (Shared Infrastructure)

### Task 1: Initialize Package Structure

**Files:**

- Create/Modify: `packages/session-manager/package.json`
- Create: `packages/session-manager/tsconfig.json`
- Create: `packages/session-manager/vitest.config.ts`

- [ ] **Step 1: Write/Update package configs**
      Update `package.json` to include `@tempot/shared`, `@tempot/event-bus`, `@tempot/database`, `neverthrow`, `cache-manager`. Add `vitest.config.ts` and `tsconfig.json` based on the standard Tempot package structure.
- [ ] **Step 2: Commit**
      Run: `git add packages/session-manager/ && git commit -m "chore: initialize session-manager package structure"`

### Task 2: Define Types and Interfaces

**Files:**

- Create: `packages/session-manager/src/types.ts`
- Create: `packages/session-manager/src/index.ts`

- [ ] **Step 1: Implement minimal code**
      Define `Session` (with `schemaVersion`, `version`, `metadata`, etc.) and `ISessionProvider` interfaces in `types.ts`. Export them from `index.ts`.
- [ ] **Step 2: Run build/check to verify**
      Run: `pnpm --filter @tempot/session-manager run build` or `tsc --noEmit`
- [ ] **Step 3: Commit**
      Run: `git add packages/session-manager/src/ && git commit -m "feat(session-manager): define Session and ISessionProvider types"`

---

## Phase 2: Foundational (Blocking Prerequisites)

### Task 3: Database Schema

**Files:**

- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Write the schema changes**
      Add `Session` model to Prisma schema with `id` (composite userId+chatId as string or separate fields), `userId`, `chatId`, `role`, `status`, `language`, `activeConversation`, `metadata` (JSONB), `schemaVersion` (Int), `version` (Int), plus standard base fields.
- [ ] **Step 2: Run Prisma generate**
      Run: `cd packages/database && npx prisma generate`
- [ ] **Step 3: Commit**
      Run: `git add packages/database/ && git commit -m "feat(database): add Session model to schema"`

### Task 4: Session Repository and Events

**Files:**

- Create: `packages/session-manager/src/repository.ts`
- Modify: `packages/event-bus/src/events.ts` (if required)

- [ ] **Step 1: Write the failing tests (Optional/Skipped for pure boilerplate)**
- [ ] **Step 2: Implement minimal code**
      Create `SessionRepository` extending `BaseRepository` in `packages/session-manager/src/repository.ts`. Define `session.updated` event in `event-bus`.
- [ ] **Step 3: Commit**
      Run: `git add . && git commit -m "feat(session-manager): create SessionRepository and sync events"`

### Task 5: Sync Worker

**Files:**

- Create: `packages/session-manager/src/worker.ts`

- [ ] **Step 1: Implement BullMQ worker stub**
      Create `worker.ts` to consume `session.updated` events from queue and persist to `SessionRepository`.
- [ ] **Step 2: Commit**
      Run: `git add . && git commit -m "feat(session-manager): setup async sync worker stub"`

---

## Phase 3: User Story 1 - Fast & Persistent Sessions

### Task 6: SessionProvider Unit Tests (TDD)

**Files:**

- Create: `packages/session-manager/tests/provider.test.ts`

- [ ] **Step 1: Write the failing tests**
      Write tests for `SessionProvider.getSession`, `SessionProvider.saveSession`, and sliding TTL validation.
- [ ] **Step 2: Run test to verify it fails**
      Run: `pnpm --filter @tempot/session-manager exec vitest run tests/provider.test.ts`
      Expected: FAIL (Provider not implemented)

### Task 7: SessionProvider Implementation

**Files:**

- Create: `packages/session-manager/src/provider.ts`

- [ ] **Step 1: Write minimal implementation**
      Implement `SessionProvider` utilizing `cache-manager` and `event-bus`. Ensure OCC version checking and sliding TTL is applied. Handle Redis miss by falling back to Postgres (`SessionRepository`). Return `Result<T, AppError>` via `neverthrow`.
- [ ] **Step 2: Run test to verify it passes**
      Run: `pnpm --filter @tempot/session-manager exec vitest run tests/provider.test.ts`
      Expected: PASS
- [ ] **Step 3: Commit**
      Run: `git add . && git commit -m "feat(session-manager): implement SessionProvider with Redis/Postgres fallback"`

### Task 8: Integration Tests

**Files:**

- Create: `packages/session-manager/tests/integration.test.ts`

- [ ] **Step 1: Write integration tests**
      Use Testcontainers to spin up Redis and Postgres. Test that `getSession` accesses Redis in < 2ms, handles Redis failures smoothly, and `saveSession` successfully fires an event syncing to Postgres.
- [ ] **Step 2: Run test to verify it passes**
      Run: `pnpm --filter @tempot/session-manager exec vitest run tests/integration.test.ts`
- [ ] **Step 3: Commit**
      Run: `git add . && git commit -m "test(session-manager): integration tests for dual-layer strategy"`

---

## Phase 4: User Story 2 - Conversation State Management

### Task 9: AsyncLocalStorage Context Tests

**Files:**

- Create: `packages/session-manager/tests/context.test.ts`

- [ ] **Step 1: Write the failing test**
      Test setting and getting session data from global `sessionContext`.
- [ ] **Step 2: Run test to verify it fails**
      Run: `pnpm --filter @tempot/session-manager exec vitest run tests/context.test.ts`

### Task 10: AsyncLocalStorage Context Implementation

**Files:**

- Create: `packages/session-manager/src/context.ts`

- [ ] **Step 1: Write minimal implementation**
      Export `sessionContext = new AsyncLocalStorage<Session>()`.
- [ ] **Step 2: Run test to verify it passes**
      Run: `pnpm --filter @tempot/session-manager exec vitest run tests/context.test.ts`
- [ ] **Step 3: Commit**
      Run: `git add . && git commit -m "feat(session-manager): implement AsyncLocalStorage session context"`

### Task 11: Schema Versioning & Migration

**Files:**

- Create: `packages/session-manager/tests/migration.test.ts`
- Modify: `packages/session-manager/src/provider.ts`

- [ ] **Step 1: Write the failing test**
      Test that `migrateSession` correctly upgrades old schemas to the current `schemaVersion`.
- [ ] **Step 2: Implement minimal code**
      Implement migration logic in `SessionProvider`.
- [ ] **Step 3: Run test to verify it passes**
      Run tests for migrations.
- [ ] **Step 4: Commit**
      Run: `git add . && git commit -m "feat(session-manager): add session schema versioning logic"`

---

## Phase 5: Polish & Documentation

### Task 12: Degradation & Error Mapping

**Files:**

- Modify: `packages/session-manager/src/provider.ts`

- [ ] **Step 1: Polish error handling**
      Ensure explicit try/catch wraps all Redis ops, logging errors without failing, and routing properly to Postgres (Rule XXXII).
- [ ] **Step 2: Run all tests**
      Run: `pnpm test` across workspace
- [ ] **Step 3: Commit**
      Run: `git add . && git commit -m "refactor(session-manager): strict Redis degradation adherence"`

### Task 13: Documentation

**Files:**

- Create: `packages/session-manager/README.md`
- Modify: `packages/session-manager/src/**/*.ts`

- [ ] **Step 1: Add documentation**
      Add JSDoc/TSDoc to public APIs. Update `README.md` with usage instructions based on `quickstart.md`.
- [ ] **Step 2: Commit**
      Run: `git add . && git commit -m "docs(session-manager): add TSDoc and package README"`

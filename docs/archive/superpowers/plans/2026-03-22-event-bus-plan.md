# @tempot/event-bus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a dual-mode communication bus with Local fallback, Redis Distributed mode, and automatic recovery logic.

**Architecture:**

- **Levels:** Local (same module), Internal (cross-module), External (distributed via Redis).
- **Dual-Mode:** Primarily Redis, fallback to EventEmitter on failure.
- **Recovery:** Connection Watcher with stabilization threshold (5 pings / 10s).
- **Naming:** Strictly enforced `{module}.{entity}.{action}`.

**Tech Stack:** TypeScript, ioredis, neverthrow, @tempot/shared, @tempot/logger.

---

### Task 1: Package Initialization & Contracts

**Files:**

- Create: `packages/event-bus/package.json`
- Create: `packages/event-bus/src/contracts.ts`
- Create: `packages/event-bus/src/index.ts`

- [ ] **Step 1: Initialize package and install dependencies**
      Run: `cmd /c "cd packages/event-bus && pnpm add ioredis neverthrow @tempot/shared@workspace:* @tempot/logger@workspace:* @tempot/session-manager@workspace:* && pnpm add -D vitest @types/node"`

- [ ] **Step 2: Define `EventMap` and `EventEnvelope` in `src/contracts.ts`**
      Include strict naming convention validation logic (RegExp).

- [ ] **Step 3: Commit baseline**
      Run: `cmd /c "git add packages/event-bus/package.json packages/event-bus/src/contracts.ts && git commit -m \"chore(event-bus): initialize package and event contracts\""`

---

### Task 2: Local Mode (EventEmitter Wrapper)

**Files:**

- Create: `packages/event-bus/src/local/local.bus.ts`
- Create: `packages/event-bus/tests/unit/local-bus.test.ts`

- [ ] **Step 1: Write failing tests for local emission/subscription**
      Verify sync delivery and error isolation between listeners.

- [ ] **Step 2: Implement `LocalEventBus` in `src/local/local.bus.ts`**
      Wrap Node.js `EventEmitter`.

- [ ] **Step 3: Run tests to verify pass**
      Run: `cmd /c "cd packages/event-bus && pnpm vitest run tests/unit/local-bus.test.ts"`

- [ ] **Step 4: Commit Local mode**
      Run: `cmd /c "git add packages/event-bus/src/local/ && packages/event-bus/tests/unit/local-bus.test.ts && git commit -m \"feat(event-bus): implement Local EventEmitter fallback\""`

---

### Task 3: Redis Distributed Mode (Pub/Sub)

**Files:**

- Create: `packages/event-bus/src/distributed/redis.bus.ts`
- Create: `packages/event-bus/tests/integration/redis-bus.test.ts`

- [ ] **Step 1: Write failing integration test for Redis Pub/Sub**
      Use Testcontainers. Verify cross-client communication.

- [ ] **Step 2: Implement `RedisEventBus` in `src/distributed/redis.bus.ts`**
      Manage two Redis clients (pub and sub).

- [ ] **Step 3: Run tests to verify pass**
      Run: `cmd /c "cd packages/event-bus && pnpm vitest run tests/integration/redis-bus.test.ts"`

- [ ] **Step 4: Commit Distributed mode**
      Run: `cmd /c "git add packages/event-bus/src/distributed/ && packages/event-bus/tests/integration/redis-bus.test.ts && git commit -m \"feat(event-bus): implement Redis distributed messaging\""`

---

### Task 4: Connection Watcher & Recovery Loop

**Files:**

- Create: `packages/event-bus/src/distributed/connection.watcher.ts`
- Create: `packages/event-bus/tests/unit/watcher.test.ts`

- [ ] **Step 1: Write failing tests for stabilization logic**
      Mock clock. Verify re-promotion only after 5 consecutive pings.

- [ ] **Step 2: Implement `ConnectionWatcher`**
      Background loop checking Redis health.

- [ ] **Step 3: Run tests to verify pass**
      Run: `cmd /c "cd packages/event-bus && pnpm vitest run tests/unit/watcher.test.ts"`

- [ ] **Step 4: Commit Watcher**
      Run: `cmd /c "git add packages/event-bus/src/distributed/connection.watcher.ts && git commit -m \"feat(event-bus): implement auto-recovery with stabilization threshold\""`

---

### Task 5: Bus Orchestrator & Rule XXXII Integration

**Files:**

- Create: `packages/event-bus/src/orchestrator.ts`
- Create: `packages/event-bus/tests/integration/degradation.test.ts`

- [ ] **Step 1: Write failing test for degradation alert**
      Stop Redis container and verify `SUPER_ADMIN` alert via logger.

- [ ] **Step 2: Implement `EventBusOrchestrator`**
      Switch between `LocalBus` and `RedisBus` based on `Watcher` status.

- [ ] **Step 3: Export final public API from `src/index.ts`**
- [ ] **Step 4: Register in root `package.json`**
- [ ] **Step 5: Final full suite verification**
      Run: `cmd /c "pnpm test"`
- [ ] **Step 6: Final commit**
      Run: `cmd /c "git add . && git commit -m \"feat(event-bus): complete event-bus implementation with dual-mode support\""`

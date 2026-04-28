# Notifier Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@tempot/notifier` as Tempot's optional notification package for Telegram delivery and future adapter expansion.

**Architecture:** `NotifierService` validates i18n template requests, resolves recipients, applies rate offsets, and enqueues delivery jobs. `NotificationProcessor` renders templates, sends through a delivery adapter, records audit attempts, and publishes events. Infrastructure is injected through ports to preserve package and module boundaries.

**Tech Stack:** TypeScript strict mode, neverthrow, BullMQ, `@tempot/shared`, Vitest.

---

## Files

- `packages/notifier/package.json`: package metadata, exports, scripts, dependencies.
- `packages/notifier/tsconfig.json`: strict package compilation to `dist`.
- `packages/notifier/vitest.config.ts`: unit and integration test projects.
- `packages/notifier/src/notifier.types.ts`: core request, recipient, job, delivery, attempt types.
- `packages/notifier/src/notifier.ports.ts`: resolver, queue, renderer, delivery, audit, event, logger ports.
- `packages/notifier/src/notification.service.ts`: public producer API.
- `packages/notifier/src/notification.queue.ts`: BullMQ-compatible queue wrapper.
- `packages/notifier/src/notification.processor.ts`: delivery processing workflow.
- `packages/notifier/src/telegram.delivery.adapter.ts`: Telegram API adapter.
- `packages/notifier/src/notification.worker.ts`: BullMQ worker factory.
- `packages/notifier/tests/unit/*.test.ts`: TDD coverage for core behavior.

## Tasks

### Task 1: Package Foundation

- [x] Create `.gitignore`, `package.json`, `tsconfig.json`, and `vitest.config.ts`.
- [x] Add package to lockfile with `pnpm install --no-frozen-lockfile`.

### Task 2: RED Tests

- [x] Write failing tests for rate policy, queue wrapper, service producer, processor, and Telegram adapter.
- [x] Run `pnpm --filter @tempot/notifier test` and verify the tests fail before implementation.

### Task 3: GREEN Implementation

- [x] Implement notifier error codes, types, ports, service, queue wrapper, processor, Telegram adapter, and worker factory.
- [x] Run `pnpm --filter @tempot/notifier test` and verify package tests pass.
- [x] Run `pnpm --filter @tempot/notifier build` and verify TypeScript strict compilation passes.

### Task 4: Documentation Sync

- [x] Refresh `specs/013-notifier-package/spec.md`.
- [x] Refresh `specs/013-notifier-package/plan.md`.
- [x] Add `research.md`, `data-model.md`, `tasks.md`, and requirements checklist.
- [x] Update `packages/notifier/README.md`.
- [x] Update `docs/archive/ROADMAP.md`.

### Task 5: Final Verification

- [ ] Run package tests and build.
- [ ] Run `pnpm spec:validate`.
- [ ] Run `pnpm cms:check`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm boundary:audit`.
- [ ] Run `pnpm module:checklist`.
- [ ] Run `git diff --check`.

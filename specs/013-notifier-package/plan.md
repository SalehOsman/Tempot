# Notifier Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@tempot/notifier` as Tempot's optional, queue-backed Telegram notification package with clean adapter boundaries for future channels.

**Architecture:** The package exposes a small `NotifierService` public API. The service validates template-key requests, resolves recipients through injected ports, applies a Telegram-safe rate policy, and enqueues one delivery job per recipient. A worker processor renders templates, calls an injected delivery adapter, records audit attempts, and publishes notification events.

**Tech Stack:** TypeScript strict mode, neverthrow, BullMQ via `@tempot/shared` QueueFactory, structural ports for i18n/event/audit/delivery integration, Vitest.

---

## Reactivation Decision

`notifier` was deferred under Constitution Rule XC. It is now activated because Tempot needs a central alerting path for operator notifications, user-management workflows, future dashboard actions, document/import completion alerts, and SaaS-readiness operations.

## Constitution Check

- Rule XXI: All public fallible APIs return `Result` or `AsyncResult`.
- Rule XX: Queue usage goes through `@tempot/shared` QueueFactory.
- Rule XV: Cross-module effects happen through event bus events, not direct imports.
- Rule XXXIX: Public API accepts i18n template keys and variables, not raw user-facing text.
- Rule LXXI-LXXVIII: Package creation checklist is mandatory before merge.

## Package Boundary

`@tempot/notifier` may depend on:

- `@tempot/shared` for `AppError`, `AsyncResult`, and QueueFactory.
- `bullmq` for queue and worker types/implementation.
- `neverthrow` for `ok`/`err`.

The package MUST NOT depend directly on `apps/bot-server`, `modules/user-management`, Prisma delegates, or grammY bot lifecycle. The app injects ports.

## File Structure

```text
packages/notifier/
  .gitignore
  package.json
  tsconfig.json
  vitest.config.ts
  README.md
  src/
    index.ts
    notifier.errors.ts
    notifier.types.ts
    notifier.ports.ts
    notification.rate-policy.ts
    notification.queue.ts
    notification.service.ts
    notification.processor.ts
    notification.worker.ts
    telegram.delivery.adapter.ts
  tests/
    unit/
      notification.rate-policy.test.ts
      notification.service.test.ts
      notification.processor.test.ts
      notification.queue.test.ts
      telegram.delivery.adapter.test.ts
```

## Implementation Phases

### Phase 1 - Specification and Package Foundation

1. Update `ROADMAP.md` to mark `notifier` active.
2. Add `research.md`, `data-model.md`, `tasks.md`, and `checklists/requirements.md`.
3. Create checklist-compliant package infrastructure.
4. Run `pnpm module:checklist` after package infrastructure exists.

### Phase 2 - Contracts and Validation

1. Define error codes in `notifier.errors.ts`.
2. Define notification targets, payloads, recipients, jobs, attempts, delivery receipts, and events in `notifier.types.ts`.
3. Define ports for recipients, queue, template renderer, delivery adapter, audit sink, event publisher, and logger in `notifier.ports.ts`.
4. Write and run failing unit tests before implementation.

### Phase 3 - Queue Producer

1. Implement `NotificationRatePolicy`.
2. Implement `NotificationQueue` around a BullMQ-compatible queue object.
3. Implement `NotifierService` with:
   - `sendToUser`
   - `sendToUsers`
   - `sendToRole`
   - `broadcast`
   - `schedule`
4. Keep role and broadcast recipient lookup behind `RecipientResolver`.

### Phase 4 - Delivery Processor and Worker

1. Implement `NotificationProcessor`.
2. Implement `TelegramDeliveryAdapter` against a structural Telegram API interface.
3. Implement `createNotificationWorker` with BullMQ limiter `{ max: 30, duration: 1000 }`.
4. Ensure retryable failures are rethrown from the worker function after processor returns an error.

### Phase 5 - Verification and Documentation

1. Update `packages/notifier/README.md` with actual API and integration guidance.
2. Run package-level tests and build.
3. Run workspace gates:
   - `pnpm spec:validate`
   - `pnpm cms:check`
   - `pnpm lint`
   - `pnpm --filter @tempot/notifier test`
   - `pnpm --filter @tempot/notifier build`
   - `pnpm build`
   - `pnpm test:unit`
   - `pnpm test:integration`
   - `pnpm boundary:audit`
   - `pnpm module:checklist`
   - `pnpm audit --audit-level=high`
   - `git diff --check`

## Risks and Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Direct Telegram coupling leaks into modules | Only expose `NotifierService`; app injects delivery adapter |
| Role/broadcast depends on user-management internals | Use `RecipientResolver` port |
| i18n rule violation | Accept only `templateKey` and variables in public APIs |
| Rate limits exceeded during bulk sends | Apply enqueue-time rate offsets and worker limiter |
| Audit failure masks delivery success | Model audit as a sink result and preserve delivery event semantics |
| Optional package breaks disabled installs | Keep notifier out of app wiring until enabled by `TEMPOT_NOTIFIER` |

## Out of Scope

- Email, SMS, WhatsApp, or payment notifications.
- Dashboard UI for composing broadcasts.
- Database schema for notification history. Audit is handled through the injected sink.
- Direct user status mutation on blocked bot. The package emits `notification.user.blocked`; the owning module/app decides remediation.

# Feature Specification: Notifier Package

**Feature Branch**: `013-notifier-package`  
**Created**: 2026-03-19  
**Reactivated**: 2026-04-29
**Status**: Active
**Input**: Build `@tempot/notifier` as the centralized notification package for Tempot, with Telegram delivery now and adapter-ready boundaries for future channels.

## Purpose

Tempot needs one governed notification package that modules and apps can use without sending Telegram messages directly. The package must enqueue notification work, resolve recipients, render i18n templates, deliver messages through adapters, publish notification events, and record delivery attempts without coupling business modules to bot internals.

The first production implementation targets Telegram delivery only. The design must preserve adapter boundaries so future channels such as email, SMS, or managed bot delivery can be added without changing the notifier core API.

## User Scenarios & Testing

### User Story 1 - Send a Template Notification to One User (Priority: P1)

As a module developer, I want to request a notification for one user by template key so that module code never sends raw Telegram text directly.

**Independent Test**: Calling `sendToUser()` with a valid template key enqueues exactly one notification job containing a recipient, template key, variables, priority, and silent flag.

**Acceptance Scenarios**:

1. **Given** a user target and template key, **When** the module calls `sendToUser()`, **Then** the notifier validates the request and enqueues a delivery job.
2. **Given** an invalid blank template key, **When** the module calls `sendToUser()`, **Then** the notifier returns `notifier.invalid_template_key` and enqueues nothing.
3. **Given** a silent notification request, **When** delivery happens, **Then** the delivery adapter receives the silent option.

---

### User Story 2 - Send Bulk and Broadcast Notifications Safely (Priority: P1)

As a system administrator, I want to send notifications to many users without exceeding Telegram limits so that announcements and operational alerts are reliable.

**Independent Test**: Calling `broadcast()` uses the recipient resolver, creates one job per recipient, and applies a rate policy that keeps the queue under 30 messages per second.

**Acceptance Scenarios**:

1. **Given** a broadcast target, **When** recipients are resolved, **Then** the notifier enqueues one job per active recipient.
2. **Given** more than 30 recipients, **When** the jobs are scheduled, **Then** jobs after the first 30 are delayed by at least one second.
3. **Given** the recipient resolver fails, **When** a bulk request is made, **Then** the notifier returns the resolver error and enqueues nothing.

---

### User Story 3 - Schedule Future Notifications (Priority: P1)

As a module developer, I want to schedule future notifications so that reminders and operational follow-ups can run without module-specific queue code.

**Independent Test**: Calling `schedule()` for a future date enqueues jobs with the expected BullMQ delay.

**Acceptance Scenarios**:

1. **Given** a future delivery time, **When** `schedule()` is called, **Then** the job delay is based on the requested time.
2. **Given** a past delivery time, **When** `schedule()` is called, **Then** the notifier returns `notifier.invalid_schedule_time`.
3. **Given** a scheduled role notification, **When** recipients are resolved, **Then** all jobs share the same schedule baseline plus rate-policy offsets.

---

### User Story 4 - Process Delivery with Audit and Events (Priority: P1)

As an operator, I want every notification attempt to be auditable and event-driven so that failures can trigger remediation without direct package coupling.

**Independent Test**: Processing a job renders the template, calls the delivery adapter, records the attempt, and publishes `notification.delivery.succeeded` or `notification.delivery.failed`.

**Acceptance Scenarios**:

1. **Given** a valid job, **When** the worker processes it successfully, **Then** the notifier records a successful attempt and publishes a success event.
2. **Given** the delivery adapter reports that the user blocked the bot, **When** the worker processes the job, **Then** it publishes `notification.user.blocked` and records the failed attempt.
3. **Given** template rendering fails, **When** processing starts, **Then** delivery is not attempted and a failed attempt is recorded.

---

### User Story 5 - Initialize Optional Worker Infrastructure (Priority: P2)

As an app integrator, I want to start the notifier worker only when `TEMPOT_NOTIFIER=true` so that optional infrastructure remains pluggable.

**Independent Test**: A factory creates a queue-backed `NotifierService` and a worker with the configured limiter only when enabled by the app.

**Acceptance Scenarios**:

1. **Given** notifier is disabled, **When** the app starts, **Then** no notifier queue or worker is required.
2. **Given** notifier is enabled, **When** the app starts, **Then** the app can inject delivery, template, recipient, audit, and event ports into the notifier package.

## Edge Cases

- **User blocked the bot**: Delivery adapter returns `notifier.delivery_blocked`; notifier publishes `notification.user.blocked` and records the failed attempt.
- **Telegram 429 or temporary outage**: Delivery adapter returns a retryable error; the worker throws after recording/publishing so BullMQ retry/backoff can run.
- **Missing interpolation variables**: Template renderer returns a typed `AppError`; delivery is skipped.
- **Empty recipient list**: Bulk or broadcast returns `notifier.no_recipients`.
- **Past schedule time**: Scheduler returns `notifier.invalid_schedule_time`.
- **Queue unavailable**: Queue operations return `notifier.queue_enqueue_failed`; caller receives `Result.err`.
- **Audit sink fails**: The original delivery result remains authoritative; notifier publishes/logs the audit failure through its error result without swallowing it.

## Requirements

### Functional Requirements

- **FR-001**: The package MUST expose a `NotifierService` with methods for single user, multiple users, role-based, broadcast, and scheduled notification requests.
- **FR-002**: All public fallible APIs MUST return `Result<T, AppError>` or `AsyncResult<T, AppError>`.
- **FR-003**: Notification content MUST be represented as `templateKey` plus typed variables. Raw user-facing message text is not accepted by the public API.
- **FR-004**: The package MUST enqueue delivery work through a queue abstraction backed by `@tempot/shared` QueueFactory.
- **FR-005**: The package MUST support Telegram delivery through an injected adapter-compatible API and MUST NOT own bot lifecycle.
- **FR-006**: The package MUST define ports for recipient resolution, template rendering, delivery, audit recording, event publishing, and logging.
- **FR-007**: Bulk and broadcast requests MUST apply a rate policy compatible with Telegram's 30 messages per second limit.
- **FR-008**: Scheduled requests MUST convert future delivery times into queue delays and reject past times.
- **FR-009**: The worker processor MUST record every delivery attempt through the audit sink.
- **FR-010**: The worker processor MUST publish delivery success, delivery failure, broadcast queued, and user blocked events.
- **FR-011**: The package MUST be optional and safe to leave disabled through `TEMPOT_NOTIFIER=false`.
- **FR-012**: The package MUST satisfy the package creation checklist: `.gitignore`, `package.json`, `tsconfig.json`, `vitest.config.ts`, exports, tests, no `any`, no `console.*`, no phantom dependencies.

### Non-Functional Requirements

- **NFR-001**: Source files SHOULD remain under 200 lines and functions under 50 lines.
- **NFR-002**: The package MUST compile in TypeScript strict mode with no `any`, no `@ts-ignore`, and no eslint disables.
- **NFR-003**: Unit tests MUST cover request validation, recipient resolution, queue enqueueing, rate delay calculation, delivery processing, and Telegram adapter behavior.
- **NFR-004**: Integration tests SHOULD cover worker processing through a real BullMQ queue when Redis/Testcontainers are available.

## Key Entities

- **NotificationRequest**: Public input containing target, template key, variables, locale, silent flag, priority, and optional metadata.
- **NotificationTarget**: User, users, role, or broadcast target.
- **NotificationRecipient**: Resolved delivery recipient with user ID, chat ID, locale, and optional role.
- **NotificationJobData**: Queue payload for one recipient delivery attempt.
- **NotificationAttempt**: Audit record for a success or failure.
- **NotificationEvent**: Event payloads emitted by the package.

## Success Criteria

- **SC-001**: A single-user notification request enqueues exactly one job and returns `ok`.
- **SC-002**: A 100-recipient broadcast schedules jobs with rate offsets so no more than 30 jobs are due in any one-second window.
- **SC-003**: Scheduled notifications are enqueued with a delay within 250ms of the requested future time during unit tests.
- **SC-004**: Successful job processing renders, delivers, audits, and publishes success exactly once.
- **SC-005**: Blocked-user delivery publishes `notification.user.blocked` and returns a retry-safe error result.
- **SC-006**: Package gates and workspace gates pass before merge: `pnpm --filter @tempot/notifier test`, `pnpm --filter @tempot/notifier build`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, `pnpm lint`, `pnpm spec:validate`, `pnpm cms:check`, `pnpm boundary:audit`, `pnpm module:checklist`, `pnpm audit --audit-level=high`, and `git diff --check`.

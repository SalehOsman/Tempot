# Feature Specification: Notifier (Multi-channel & Bulk)

**Feature Branch**: `013-notifier-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the functional notifier package for centralized, scheduled, and bulk notifications as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-channel Bulk Notification (Priority: P1)

As a system administrator, I want to send a notification to all active users so that I can announce system updates or promotions effectively without hitting Telegram's rate limits.

**Why this priority**: Core engagement feature required for any professional bot.

**Independent Test**: Sending a broadcast to a test group of users and verifying 100% delivery via BullMQ workers.

**Acceptance Scenarios**:

1. **Given** a broadcast request, **When** I provide an i18n template and target role, **Then** the notifier adds jobs to the BullMQ queue for chunked delivery.
2. **Given** a large list of recipients (e.g., 10,000 users), **When** processing, **Then** the notifier adheres to Telegram's 30 msg/sec limit via standardized delays in the worker.

---

### User Story 2 - Scheduled & Individual Alerts (Priority: P1)

As a developer, I want to schedule a notification for a specific user at a future date so that I can implement reminders and automated follow-ups.

**Why this priority**: Essential for business logic like appointment reminders or task alerts.

**Independent Test**: Scheduling a notification for 1 minute in the future and verifying it is sent at the exact time.

**Acceptance Scenarios**:

1. **Given** a specific `userId` and a `timestamp`, **When** I call `Notifier.schedule()`, **Then** the job is added to the BullMQ delayed queue.
2. **Given** a scheduled notification, **When** the timestamp is reached, **Then** the notifier retrieves the user's latest session/language and sends the correct localized template.

---

## Edge Cases

- **User Blocked Bot**: What happens if the notification fails because the user blocked the bot? (Answer: Mark user status as `SUSPENDED` and log the event).
- **Rate Limit Hits**: Handling unexpected `429 Too Many Requests` from Telegram (Answer: BullMQ worker MUST implement exponential backoff retry).
- **Template Missing Data**: Required interpolation variables are missing (Answer: Throw a validation error during the schedule/send call).

## Clarifications

- **Technical Constraints**: BullMQ chunked delivery (30 msg/sec).
- **Constitution Rules**: Rule XXXIX (i18n-Only). Rule XXXII (Redis Degradation) for queue persistence. Section 9 for multi-channel support.
- **Integration Points**: Relies on `shared` (Queue Factory) and `i18n-core`.
- **Edge Cases**: Blocked bot updates user status to `SUSPENDED`. Unexpected 429 errors trigger exponential backoff. Scheduled notifications use `RegionalEngine` for correct timing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use the `QueueFactory` (BullMQ) for all notification delivery.
- **FR-002**: System MUST support 5 notification types: `Individual`, `Group`, `Role-based`, `Broadcast`, `Scheduled`.
- **FR-003**: System MUST enforce the "i18n-Only Rule" for all notification content.
- **FR-004**: System MUST automatically respect Telegram's API rate limits (30 msg/sec for bulk).
- **FR-005**: System MUST log every notification attempt (Success/Failure) in the `AuditLog`.
- **FR-006**: System MUST automatically handle user blocks by updating the `User` status.
- **FR-007**: System MUST support "Silent" notifications (no sound) via `disable_notification` parameter.

### Key Entities

- **NotificationJob**: userId, templateKey, data (JSON), scheduleAt, status, attempts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Bulk delivery to 1,000 users must complete with 100% accuracy within the rate limit constraints (~34 seconds).
- **SC-002**: Scheduled notifications must be delivered within ±5 seconds of the target time.
- **SC-003**: 100% of failed notifications due to user blocks must result in a status update for that user.
- **SC-004**: System successfully recovers and retries 100% of failed jobs due to temporary API downtime.

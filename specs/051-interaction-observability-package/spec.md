# Feature Specification: interaction-observability-package

## User Stories

### Story 1 - Diagnose Interaction Journeys

Administrators can inspect the full timeline for any Telegram command or
callback query, from receipt through routing, handler execution, view rendering,
Telegram response attempts, recovered no-op edits, failures, and completion.

### Story 2 - Reuse Observability In Future Modules

Module authors can rely on a shared interaction observability package instead of
creating custom tracing or logging code in every module.

## Functional Requirements

- FR-001: The system MUST provide a shared `@tempot/interaction-observability`
  package for trace context, interaction event types, and recorder APIs.
- FR-002: Every command, callback query, and message update handled by
  `bot-server` MUST receive one trace identifier.
- FR-003: The system MUST persist interaction timeline events separately from
  security audit entries.
- FR-004: Timeline events MUST include trace ID, stage, status, module, action,
  callback data, response type, user ID, chat ID, update ID, timestamp, and safe
  technical metadata.
- FR-005: `@tempot/ux-helpers` MUST record rendered view, edit attempt, edit
  success, edit no-op, fallback reply, and callback answer steps when a recorder
  is available on the context.
- FR-006: Interaction event persistence failures MUST be logged and MUST NOT
  block the user interaction.
- FR-007: `audit-viewer` MUST expose a recent interaction timeline view that
  helps diagnose button and flow behavior from inside the bot.
- FR-008: Future modules MUST be able to use the package without importing
  `bot-server` internals or another module.

## Acceptance Criteria

- SC-001: Repeating the same inline button records an `edit_noop` timeline event
  with reason `message_not_modified`.
- SC-002: A successful callback records received, rendered view, edit attempt,
  edit success, callback answer, and completed events with the same trace ID.
- SC-003: The audit viewer can render recent timeline events grouped by trace
  without querying technical Docker logs.
- SC-004: If timeline persistence fails, the bot still responds and emits a
  structured warning.

## Non-Functional Requirements

- User-facing text MUST remain in i18n files.
- Sensitive message body content MUST NOT be persisted.
- Public fallible APIs MUST return `Result<T, AppError>` or `AsyncResult`.
- The implementation MUST reuse Pino logging, Prisma repositories, and existing
  bot middleware boundaries.

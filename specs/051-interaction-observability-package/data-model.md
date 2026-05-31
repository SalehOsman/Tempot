# Data Model: interaction-observability-package

## InteractionTrace

- `traceId`: unique identifier for one Telegram update.
- `updateId`: Telegram update ID.
- `updateType`: `command`, `callback_query`, or `message`.
- `command`: command name when present.
- `callbackData`: callback query data when present.
- `callbackNamespace`: callback namespace when present.
- `module`: resolved owning module.
- `userId`: Telegram user ID.
- `chatId`: Telegram chat ID.
- `responseCount`: observed Telegram response count.
- `lastResponseType`: last observed Telegram response method.
- `eventCount`: recorded timeline event count.
- `startedAt`: start timestamp in milliseconds.

## InteractionEvent

- `id`: generated database identifier.
- `traceId`: links all events for a single update.
- `sequence`: monotonic event sequence inside the trace.
- `updateId`: Telegram update ID.
- `updateType`: update category.
- `stage`: lifecycle stage such as `received`, `view_rendered`, `edit_noop`, or
  `completed`.
- `status`: `received`, `attempted`, `succeeded`, `skipped`, `failed`, or
  `completed`.
- `module`: resolved owning module.
- `action`: command, callback data, or logical action.
- `callbackData`: callback data when present.
- `callbackNamespace`: callback namespace when present.
- `responseType`: Telegram API response type when relevant.
- `viewKey`: i18n or logical view identifier when a UI view is rendered.
- `reason`: safe technical reason for skipped or failed stages.
- `errorCode`: Tempot error code when available.
- `referenceCode`: user-facing error reference when available.
- `userId`: Telegram user ID as string.
- `chatId`: Telegram chat ID as string.
- `metadata`: safe JSON metadata, excluding message bodies.
- `timestamp`: event creation timestamp.

## AuditLog Relationship

`AuditLog` remains the security and compliance outcome record. `InteractionEvent`
stores operational timelines and uses the same `traceId` for correlation.

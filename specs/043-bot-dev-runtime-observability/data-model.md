# Data Model: Bot Developer Runtime Observability

No persistent data model changes are required.

## Runtime Log Shape

### Bot Interaction Log

- `code`: stable machine-readable log code.
- `updateId`: Telegram update id when available.
- `updateType`: `command`, `callback_query`, `message`, or `unknown`.
- `command`: command name for command updates.
- `callbackData`: callback data for callback query updates.
- `callbackNamespace`: inferred callback namespace.
- `module`: inferred module name.
- `userId`: Telegram user id.
- `chatId`: Telegram chat id.
- `durationMs`: handler duration.
- `status`: `received`, `handled`, `failed`, or `unhandled`.

### Input Field Log

- `code`: stable machine-readable log code.
- `formId`: input-engine form id.
- `fieldName`: schema field name.
- `fieldType`: input-engine field type.
- `fieldIndex`: zero-based field index.
- `attempt`: current attempt number.
- `maxRetries`: configured max retries.
- `status`: `started`, `validated`, `cancelled`, `back`, `validation_failed`, or `max_retries`.

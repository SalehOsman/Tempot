# Data Model: bot-interaction-observability

## InteractionTrace

- `traceId`: unique interaction identifier.
- `updateId`: Telegram update ID.
- `updateType`: `command`, `callback_query`, or `message`.
- `command`: command name when present.
- `callbackData`: callback query data when present.
- `callbackNamespace`: callback namespace when present.
- `module`: resolved owning module.
- `userId`: Telegram user ID.
- `chatId`: Telegram chat ID.
- `responseCount`: number of response API attempts observed.
- `lastResponseType`: last observed response method.
- `startedAt`: timestamp in milliseconds.

## AuditLog Usage

- `action`: command name, callback data, or `message`.
- `module`: resolved module.
- `targetId`: trace ID.
- `status`: `SUCCESS` or `FAILURE`.
- `after`: JSON metadata containing interaction trace fields and duration.

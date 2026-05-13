# Bot Developer Runtime Observability Design

## Goal

Make local bot development faster and make Telegram command, inline button, and input-flow failures visible in the terminal with structured logs.

## Scope

This design covers development auto rebuild/restart, bot interaction logging, unhandled callback detection, and input-engine field lifecycle logging.

It does not implement production hot module replacement or introduce a new observability backend.

## Architecture

The implementation stays inside existing Tempot boundaries. The root package exposes a development command. `bot-server` owns Telegram update observability. `input-engine` owns form and field lifecycle logs because it already receives a logger dependency and has the field context.

The bot error boundary remains responsible for thrown handler errors and reference codes. The new observer records lifecycle timing and metadata around successful, failed, and unhandled interactions.

## Development Runtime

The development runtime should use existing workspace tooling first. The intended behavior is auto rebuild plus auto restart, not in-process hot replacement. This is safer for grammY conversations, sessions, and module registration.

The first implementation should add a single root command and avoid new dependencies. If existing tools are insufficient after testing, dependency introduction requires a separate ADR and dependency-rule validation.

## Interaction Observability

The observer logs safe metadata only: update id, update type, command, callback data, inferred namespace, inferred module, user id, chat id, status, and duration. It must not log bot tokens or unrestricted message payloads.

A callback fallback runs after module handlers and reports callbacks that no handler consumed. It answers the callback and sends localized fallback text so buttons do not silently fail.

## Input Flow Observability

Input-engine field processing logs control decisions. Cancellation, back navigation, validation failure, successful validation, and max retry failures become visible in terminal logs.

These logs do not change user-facing behavior. They are diagnostic only.

## Testing

Tests are required before implementation:

- Middleware tests for command and callback lifecycle logs.
- Middleware tests for unhandled callback fallback.
- Bot factory registration test.
- Field processor tests for lifecycle logs.

## Documentation Sync

The module capability reuse standard must mention that new modules should rely on the shared observability pattern and must pass unrelated callback namespaces to the next handler.

# Interaction Observability Package Design

## Goal

Create a reusable operational observability layer for Telegram interactions so
administrators and developers can diagnose button and command behavior without
shell access to Docker logs.

## Architecture

The shared package `@tempot/interaction-observability` owns trace context types,
timeline event types, context helpers, and a recorder that writes through an
injected sink. It does not import Prisma or any module code.

`bot-server` creates a trace for every update, injects a database-backed recorder
into the grammY context, and records lifecycle stages. `@tempot/ux-helpers`
records view rendering and Telegram edit lifecycle stages when the recorder is
available. `audit-viewer` reads persisted events through an injected provider
and renders recent timelines inside the bot.

## Data Flow

1. Telegram update enters `bot-server`.
2. Interaction middleware creates a trace and attaches the recorder.
3. The owning handler renders a view through `editOrSend`.
4. `ux-helpers` records view and response lifecycle stages.
5. The middleware records completion or failure.
6. `audit-viewer` queries events by recency or trace ID for diagnosis.

## Error Handling

Interaction event persistence failures are warnings, not user-facing failures.
The recorder returns `Result` values and logs persistence failures using the
injected logger. Existing reference-code error handling remains owned by
`bot-server`.

## Testing

Implementation follows RED/GREEN/REFACTOR with focused tests for the package,
database repository, bot-server middleware, ux-helpers lifecycle recording, and
audit-viewer timeline rendering.

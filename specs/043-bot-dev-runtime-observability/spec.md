# Feature Specification: Bot Developer Runtime Observability

**Feature Branch**: `codex/bot-dev-runtime-observability`
**Created**: 2026-05-13
**Status**: Implemented
**Input**: Improve development restart workflow and terminal diagnostics for bot commands, inline buttons, and input flows.

## User Scenarios & Testing

### User Story 1 - Automatic development restart

As a developer, I want one development command to rebuild changed workspace code and restart the bot automatically so I do not manually stop and start the bot after every code edit.

**Acceptance Criteria**

1. Running the documented development command starts the bot in development mode.
2. Changes under bot server, runtime packages, or modules trigger a rebuild or restart path.
3. The command prints clear terminal lifecycle messages for start, restart, and failure.

### User Story 2 - Command and button diagnostics

As a developer, I want every Telegram command and inline callback to produce structured terminal logs so I can identify unhandled buttons, failing handlers, and slow interactions.

**Acceptance Criteria**

1. Command updates log the command, user, chat, module, status, and duration.
2. Callback query updates log callback data, user, chat, inferred namespace, status, and duration.
3. Unhandled callback queries produce a warning and a localized user response instead of silent failure.
4. Handler errors keep the existing reference-code error boundary behavior.

### User Story 3 - Input flow diagnostics

As a developer, I want input-engine flows to log field lifecycle decisions so cancellation, back navigation, validation failure, and max retries are visible in the terminal.

**Acceptance Criteria**

1. Field processing logs field start and successful completion.
2. Cancel, back, and keep-current actions are logged before the form returns the corresponding result.
3. Validation failures log retry count and field metadata.
4. Max retry failures log the final field failure context.

## Requirements

- **FR-001**: Provide a single root development script for bot development with auto rebuild and restart behavior.
- **FR-002**: Do not add external dependencies unless existing tooling cannot satisfy the requirement.
- **FR-003**: Add structured Pino-compatible logs for commands and callback queries.
- **FR-004**: Add a final callback fallback for unhandled inline buttons.
- **FR-005**: Add replay-safe input-engine field lifecycle logs without changing user-facing flow behavior.
- **FR-006**: Keep user-facing fallback text behind i18n keys.
- **FR-007**: Preserve existing grammY error-boundary reference-code behavior.
- **FR-008**: Callback acknowledgement must be best-effort and must not block input flow processing.
- **FR-009**: Startup observability events must be best-effort and must not block Telegram polling startup.
- **FR-010**: Module callback handlers must pass unrelated callback namespaces to downstream handlers or the shared fallback.

## Non-Goals

- Production in-process hot module replacement.
- New observability backend integration.
- Replacing audit logging.
- Refactoring existing module business logic outside callback pass-through requirements.

## Edge Cases

- Callback query has no data.
- Callback query data does not follow the module namespace convention.
- A handler throws after partially answering a callback query.
- Development restart happens while port 3000 is already used.
- Input flow cancellation arrives as text `/cancel` instead of a callback button.
- Startup completion event publishing is delayed or unavailable while HTTP startup has already completed.
- A stale or foreign callback namespace reaches a module-specific callback handler.
- A conversational inline callback acknowledgement is delayed while the form is waiting on a control action.

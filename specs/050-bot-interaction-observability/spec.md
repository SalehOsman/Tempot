# Feature Specification: bot-interaction-observability

## User Stories

### Story 1 - Trace Button Failures

Administrators can diagnose why a Telegram button or command failed by checking a single trace identifier that links the received interaction, module namespace, response attempt, failure point, and user-facing reference code.

### Story 2 - Inspect Interaction Outcomes

Administrators can see whether each command or callback was handled, failed, or produced a response, including the module that owned the interaction and the callback data that triggered it.

## Functional Requirements

- FR-001: The bot runtime MUST create one trace identifier for every received command, callback query, or message update.
- FR-002: The bot runtime MUST log received, response, handled, and failed interaction states with the same trace identifier.
- FR-003: Callback interactions MUST include callback data, callback namespace, resolved module name, user ID, chat ID, and update ID in technical logs.
- FR-004: Audit entries for callback interactions MUST record the callback action and trace metadata instead of the generic `message` action.
- FR-005: Error boundary logs and `system.error` events MUST include the interaction trace identifier when one exists.
- FR-006: User-facing error messages MUST interpolate the generated reference code.
- FR-007: Audit persistence failures MUST be logged without blocking the user interaction.

## Acceptance Criteria

- SC-001: Pressing a known callback logs one trace with received, response or handled, and audit success data.
- SC-002: Pressing a callback whose handler throws logs the same trace on the interaction failure and error boundary records.
- SC-003: The user-facing generic error message contains an `ERR-YYYYMMDD-XXXX` reference code, not an unresolved template variable.
- SC-004: Callback audit entries store the callback data and namespace in audit metadata.

## Non-Functional Requirements

- All user-facing text MUST remain in i18n files.
- The implementation MUST reuse existing logger, event bus, and database audit repository packages.
- The implementation MUST avoid logging sensitive message content.

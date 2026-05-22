# Implementation Plan: bot-interaction-observability

## Scope

Improve bot runtime observability without introducing a new package or database table. Use structured Pino logs, the existing `AuditLog` repository, existing Event Bus events, and the current bot middleware chain.

## Technical Approach

- Add a shared interaction trace object on the grammY context.
- Extend the interaction observer middleware to create the trace, log response attempts, and keep callback namespace to module resolution complete for active modules.
- Extend audit middleware to store callback-specific action and metadata.
- Extend error boundary logs and `system.error` payloads with trace information.
- Replace the startup no-op audit logger with a repository-backed writer.
- Fix startup i18n forwarding so interpolation options reach `@tempot/i18n-core`.

## Verification

- Unit tests for interaction observer trace and response logging.
- Unit tests for callback audit metadata and audit failure warning.
- Unit tests for error boundary trace propagation.
- Unit tests for startup i18n option forwarding.
- Run focused bot-server tests, then build the bot runtime.

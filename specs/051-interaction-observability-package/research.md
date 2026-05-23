# Research: interaction-observability-package

## Decision: New Shared Package

Spec #050 intentionally kept observability inside `bot-server`. Production
testing showed the data is useful but not reusable enough for future modules or
shared UX helpers. A dedicated package is now justified because callback
diagnostics must be available across `bot-server`, `ux-helpers`, and future
modules without direct imports between modules.

## Decision: Separate InteractionEvent Table

`AuditLog` is outcome-oriented and security-oriented. Timeline diagnostics need
multiple events per interaction, including skipped edits and recovered
conditions that are not security failures. A separate table avoids overloading
audit records and supports timeline queries by trace ID.

## Decision: Inject Persistence Through A Sink

The package owns contracts and recorder behavior, but does not import Prisma.
`bot-server` injects a database-backed sink, preserving clean architecture and
allowing tests or future runtimes to use memory or remote sinks.

## Decision: Record Safe Metadata Only

Timeline events persist callback identifiers, view keys, stages, and response
types. They do not persist full message text, file contents, tokens, or user
free-form input bodies.

## Rejected Alternative: Put All Timeline Events In Pino Logs Only

Docker logs are useful for developers but insufficient for in-bot diagnosis.
Administrators need a bot-accessible view that does not require shell access.

# ADR-043: Interaction Observability Package

## Status

Accepted

## Context

Spec #050 added trace IDs, response logging, audit metadata, and recent problem
inspection inside `bot-server` and `audit-viewer`. Manual Telegram testing then
showed a broader need: every button journey must be inspectable as a timeline,
including recovered no-op edits such as Telegram's `message is not modified`.

Keeping this logic inside `bot-server` makes `@tempot/ux-helpers` and future
modules depend on interface-layer internals. Overloading `AuditLog` also mixes
operational diagnostics with security and compliance audit records.

## Decision

Create `@tempot/interaction-observability` as a shared package for interaction
trace context, timeline event contracts, and recorder APIs. Persist timeline
events in a dedicated `InteractionEvent` table through a database-backed sink
provided by `bot-server`.

## Consequences

- Future modules can record interaction steps without importing `bot-server`.
- `ux-helpers` can record shared response lifecycle behavior once for all
  module handlers that use the Golden Rule helpers.
- `AuditLog` remains the outcome audit record, while `InteractionEvent` stores
  multi-step operational timelines.
- A dedicated package adds checklist, versioning, and verification overhead, but
  the reuse and diagnostic value justify that overhead.

## Alternatives Rejected

- Keep timeline events only in Pino logs: rejected because administrators need
  in-bot diagnosis without Docker access.
- Store every step inside `AuditLog`: rejected because a security audit entry is
  an outcome record, not a high-volume operational timeline.
- Let each module log its own button steps: rejected because it duplicates
  behavior and makes future modules inconsistent by default.

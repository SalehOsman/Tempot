# Implementation Plan: interaction-observability-package

## Scope

Extract bot interaction timeline tracking into a reusable package and persist
operational interaction events separately from security audit logs.

## Technical Approach

- Create `@tempot/interaction-observability` as an infrastructure package with:
  - typed interaction trace context helpers,
  - typed timeline event stages and statuses,
  - a recorder service using an injected persistence sink,
  - safe log serialization helpers.
- Add a Prisma `InteractionEvent` model and repository in `@tempot/database`.
- Update `bot-server` middleware to create traces, attach the recorder to the
  grammY context, and record received, response, failure, handled, and completed
  stages.
- Update `@tempot/ux-helpers` to record view rendering and edit lifecycle
  stages around `editOrSend` and `answerCallback`.
- Extend `audit-viewer` with a recent timeline page backed by a provider
  injected by `bot-server`.

## Verification

- RED/GREEN unit tests for the new package recorder and context helpers.
- RED/GREEN unit tests for database repository mapping.
- RED/GREEN unit tests for bot-server middleware event recording.
- RED/GREEN unit tests for ux-helpers edit no-op timeline recording.
- RED/GREEN unit tests for audit-viewer timeline rendering.
- Run package tests, affected module tests, lint, build, unit tests,
  `spec:validate`, `cms:check`, and changeset status.

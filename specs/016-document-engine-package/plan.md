# Implementation Plan: Document Engine Package

**Branch**: package-specific branch after Spec #035 | **Date**: 2026-05-06 |
**Spec**: [spec.md](./spec.md)

## Summary

Build `@tempot/document-engine` as the first activated deferred package. The package
accepts export requests through event-bus contracts, queues work through the shared queue
factory, generates PDF or spreadsheet buffers, uploads files through storage, and emits
completion or failure events.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: `neverthrow` 8.2.0, `@tempot/shared`, `@tempot/event-bus`,
`@tempot/storage-engine`, document generation dependency or dependencies approved by
research
**Storage**: Generated files uploaded through storage adapter
**Testing**: Vitest unit and integration-style unit tests with fake adapters
**Target Platform**: Node.js 22.12+ monorepo
**Project Type**: Workspace package
**Constraints**:
  - Event-bus integration through contracts and adapters
  - Queue work through shared queue factory
  - No hardcoded user-facing text
  - Result-returning failure paths
  - Dependency additions require research and manifest review

## Constitution Check

| Rule Area | Status | Notes |
| --- | --- | --- |
| Event-driven integration | PASS | Requests and results flow through event contracts |
| Queue factory | PASS | Jobs use shared queue abstraction |
| Storage boundary | PASS | Uploads use injected storage adapter |
| i18n-only user text | PASS | Labels and status metadata use keys |
| TDD mandatory | PASS | Tasks require failing tests first |
| Package checklist | PASS | Completion blocked on checklist verification |

## Project Structure

```text
packages/document-engine/
  src/
    contracts/
    generators/
    queue/
    events/
    index exports
  tests/
    unit/
    integration/
```

## Implementation Strategy

1. Verify dependency decisions before changing manifests.
2. Write failing generator tests for PDF and spreadsheet outputs.
3. Implement typed contracts and generator adapters.
4. Write failing queue and event workflow tests.
5. Implement request listener, queue producer, worker processor, storage upload, and
   completion/failure events.
6. Run package gates and full merge gates.

## Complexity Tracking

The only expected complexity area is document-generation dependency behavior. If the
selected library cannot satisfy RTL or test determinism, pause implementation and update
research before continuing.

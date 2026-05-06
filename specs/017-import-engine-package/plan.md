# Implementation Plan: Import Engine Package

**Branch**: package-specific branch after `document-engine` | **Date**: 2026-05-06 |
**Spec**: [spec.md](./spec.md)

## Summary

Build `@tempot/import-engine` as an asynchronous import workflow package. It receives
import requests through event contracts, queues work through the shared queue factory,
parses CSV and spreadsheet rows incrementally, validates rows through injected schema
adapters, emits valid batches, and requests document error reports for invalid rows.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: `neverthrow` 8.2.0, `@tempot/shared`, `@tempot/event-bus`,
`@tempot/storage-engine`, `@tempot/document-engine`, parser dependency or dependencies
approved by research
**Storage**: Uploaded files read through storage adapter
**Testing**: Vitest unit and integration-style unit tests with fake adapters and fixtures
**Target Platform**: Node.js 22.12+ monorepo
**Project Type**: Workspace package
**Constraints**:
  - `document-engine` contracts must exist before implementation starts
  - Queue work through shared queue factory
  - Destination modules own persistence and duplicate handling
  - No root CLI in MVP
  - Result-returning failure paths

## Constitution Check

| Rule Area | Status | Notes |
| --- | --- | --- |
| Event-driven integration | PASS | Requests, batches, completion, and failure use event contracts |
| Queue factory | PASS | Jobs use shared queue abstraction |
| Package boundaries | PASS | Destination modules own persistence |
| i18n-only user text | PASS | Progress and validation text use message keys |
| TDD mandatory | PASS | Tasks require failing tests first |
| Package checklist | PASS | Completion blocked on checklist verification |

## Project Structure

```text
packages/import-engine/
  src/
    contracts/
    parsers/
    validation/
    queue/
    events/
    index exports
  tests/
    fixtures/
    unit/
    integration/
```

## Implementation Strategy

1. Start only after `document-engine` is merged.
2. Verify parser dependency choices before changing manifests.
3. Write failing tests for CSV and spreadsheet parsing fixtures.
4. Write failing tests for validation, batching, error report requests, and lifecycle
   events.
5. Implement parser adapters, validation orchestration, queue workflow, and event payloads.
6. Run package gates and full merge gates.

## Complexity Tracking

Parser memory behavior and spreadsheet streaming support are the main complexity risks.
If the selected parser cannot satisfy incremental processing, pause and update research.

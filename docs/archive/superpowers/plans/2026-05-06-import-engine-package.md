# Import Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@tempot/import-engine` from Spec #017 with typed import contracts, deterministic CSV/XLSX parsing, schema-adapter validation, queue handling, batch events, document-engine error report requests, and lifecycle events.

**Architecture:** Keep the package port-based. The engine reads file buffers through an injected storage port, parses rows through format-specific parsers, validates rows through an injected schema adapter, emits valid batches through an injected event publisher, and requests invalid-row reports through the `document-engine` request contract.

**Tech Stack:** TypeScript 5.9.3 strict mode, `neverthrow` 8.2.0, and `@tempot/shared`. No new parser runtime dependency is added in the MVP; document report integration is adapter-based and dependency research is documented in `specs/017-import-engine-package/research.md`.

---

### Task 1: Package Shell and RED Contract Tests

**Files:**
- Create: `packages/import-engine/.gitignore`
- Create: `packages/import-engine/package.json`
- Create: `packages/import-engine/tsconfig.json`
- Create: `packages/import-engine/vitest.config.ts`
- Create: `packages/import-engine/tests/unit/import.contracts.test.ts`

- [ ] Write failing tests that import `IMPORT_ENGINE_EVENTS`, `createImportJob`, and public types from `../../src/index.js`.
- [ ] Run `corepack pnpm --filter @tempot/import-engine test`; expected result is failure because `src/index.ts` does not exist.
- [ ] Implement only exported event constants and contract helpers needed by the contract test.
- [ ] Re-run the package test and confirm the contract test passes.

### Task 2: Parser RED/GREEN

**Files:**
- Create: `packages/import-engine/tests/unit/import.parsers.test.ts`
- Create: `packages/import-engine/src/parsers/csv-import.parser.ts`
- Create: `packages/import-engine/src/parsers/spreadsheet-import.parser.ts`
- Create: `packages/import-engine/src/parsers/spreadsheet-zip.reader.ts`

- [ ] Write failing CSV tests for quoted fields, comma-separated cells, source row numbers, and normalized row objects.
- [ ] Write failing spreadsheet tests using a deterministic XLSX fixture buffer with inline strings and `rightToLeft` worksheet metadata.
- [ ] Run `corepack pnpm --filter @tempot/import-engine test`; expected failure is missing parser exports.
- [ ] Implement minimal parser classes returning `AsyncResult<ParsedImportRow[]>`.
- [ ] Re-run package tests until parser behavior is green.

### Task 3: Validation and Batching RED/GREEN

**Files:**
- Create: `packages/import-engine/tests/unit/import.validation.test.ts`
- Create: `packages/import-engine/src/import-validator.ts`
- Create: `packages/import-engine/src/import-batcher.ts`

- [ ] Write failing tests proving valid rows are normalized, invalid rows preserve row numbers, and validation failures carry message keys.
- [ ] Write failing tests proving valid rows are split into configured batch sizes.
- [ ] Implement `ImportValidator` and `createImportBatches` with Result-returning public APIs.
- [ ] Re-run package tests and confirm validation/batching are green.

### Task 4: Queue and Workflow RED/GREEN

**Files:**
- Create: `packages/import-engine/tests/unit/import.workflow.test.ts`
- Create: `packages/import-engine/src/import.queue.ts`
- Create: `packages/import-engine/src/import-request.handler.ts`
- Create: `packages/import-engine/src/import.processor.ts`

- [ ] Write failing tests for request handling and queue enqueueing.
- [ ] Write failing tests for batch events, completion events, failure events, and document-engine error report request behavior.
- [ ] Implement queue wrapper, request handler, and processor with injected ports.
- [ ] Re-run package tests and confirm all workflow tests are green.

### Task 5: Toggle, Documentation, and Gates

**Files:**
- Create: `packages/import-engine/src/import-engine.toggle.ts`
- Create: `.changeset/import-engine-package.md`
- Modify: `packages/import-engine/README.md`
- Modify: `specs/017-import-engine-package/research.md`
- Modify: `specs/017-import-engine-package/tasks.md`
- Modify: `docs/archive/ROADMAP.md`

- [ ] Add `TEMPOT_IMPORT_ENGINE` toggle guard checks to public Result-returning APIs.
- [ ] Update README to describe implemented MVP and remove deferred CLI/Zod/SheetJS claims.
- [ ] Mark Spec #017 tasks complete only after each task's verification has run.
- [ ] Run package checks, then merge gates: package test/build, lint, build, unit, integration, `spec:validate`, `boundary:audit`, `cms:check`, `module:checklist`, audit, changeset status, and diff checks.

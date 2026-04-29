# Implementation Plan: AI Core Content Block Contracts

**Branch**: `029-ai-core-content-block-contracts` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)

## Summary

Add public RAG content block contracts to `@tempot/ai-core` as the next implementation slice from Spec #027. The implementation is limited to TypeScript contracts, small validation helpers, public exports, tests, documentation sync, and quality gates.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: neverthrow 8.2.0, `@tempot/shared`
**Storage**: No schema changes in this slice
**Testing**: Vitest 4.1.0 unit tests
**Target Platform**: Node.js 22.12+ monorepo packages
**Project Type**: Monorepo package update
**Constraints**: Result pattern, no hardcoded user text, max 200 lines per file, no deferred package activation

## Constitution Check

- TypeScript strict mode: required.
- Result pattern: validation helpers return `Result<T, AppError>`.
- i18n-only: no user-facing text is added to TypeScript.
- Clean architecture: work stays in `packages/ai-core`.
- No deferred package activation: `search-engine`, `document-engine`, and `import-engine` remain deferred.
- TDD: tests are written and observed failing before implementation.

## Project Structure

```text
packages/ai-core/
  src/
    rag/
      content-block.types.ts
      content-block.validation.ts
    index.ts
  tests/unit/
    content-block.contract.test.ts
specs/029-ai-core-content-block-contracts/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/content-block-contract.md
  checklists/requirements.md
  tasks.md
```

## Implementation Strategy

1. Create SpecKit artifacts and point `.specify/feature.json` at Spec #029.
2. Add unit tests that import only from the public ai-core barrel.
3. Verify RED because the exported contracts do not exist.
4. Add focused contract and validation files under `packages/ai-core/src/rag/`.
5. Export the public contract from `packages/ai-core/src/index.ts`.
6. Update roadmap and changeset.
7. Run focused and reconciliation gates.

## Complexity Tracking

No constitution violations are expected. If any file exceeds the line limit, split types and validation before continuing.

## Closeout

This implementation slice is complete as of 2026-04-29 and was merged to `main`
in commit `7ca5538`. The next slice is Spec #030, which builds retrieval
planning and grounded answer states on top of the public content block
contracts introduced here.

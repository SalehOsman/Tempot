# Implementation Plan: AI Core Retrieval Planning And Grounding

**Branch**: `030-ai-core-retrieval-planning-and-grounding` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)

## Summary

Add public retrieval planning and grounded answer state contracts to `@tempot/ai-core` as the next implementation slice from Spec #027. This slice builds on Spec #029 content block contracts and prepares future hybrid retrieval without activating deferred packages.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: neverthrow 8.2.0, `@tempot/shared`
**Storage**: No schema changes in this slice
**Testing**: Vitest 4.1.0 unit tests
**Target Platform**: Node.js 22.12+ monorepo packages
**Project Type**: Monorepo package update
**Constraints**: Result pattern, i18n-only user text, package isolation, max 200 lines per file, no deferred package activation

## Constitution Check

- TypeScript strict mode: required.
- Result pattern: validators return `Result<T, AppError>`.
- i18n-only: non-answered states carry i18n keys, not hardcoded user text.
- Clean architecture: work stays in `packages/ai-core`.
- Deferred package policy: `search-engine`, `document-engine`, and `import-engine` remain deferred.
- TDD: tests must be written and observed failing before implementation.

## Project Structure

```text
packages/ai-core/
  src/
    rag/
      retrieval-plan.types.ts
      retrieval-plan.validation.ts
    index.ts
  tests/unit/
    retrieval-planning.contract.test.ts
specs/030-ai-core-retrieval-planning-and-grounding/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/retrieval-planning-contract.md
  contracts/grounded-answer-contract.md
  checklists/requirements.md
  tasks.md
```

## Implementation Strategy

1. Close Spec #029 documentation and point `.specify/feature.json` at Spec #030.
2. Add unit tests that import only from the public `@tempot/ai-core` barrel.
3. Verify RED because retrieval plan contracts do not exist yet.
4. Add focused retrieval planning types and validators under `packages/ai-core/src/rag/`.
5. Reuse existing `GroundedAnswer` concepts where possible and extend only when required by this spec.
6. Export the new public contracts from `packages/ai-core/src/index.ts`.
7. Update roadmap, changeset, and quality gates.

## Complexity Tracking

No constitution violations are expected. If implementation requires database persistence, deferred package activation, or a new dependency, stop and create a separate spec before continuing.

## Phase Relationship

- Spec #027 defines the RAG methodology.
- Spec #029 completed content block public contracts.
- Spec #030 adds retrieval planning and answer state contracts.
- Future specs may wire the contracts into runtime pipeline behavior and evaluation fixtures.

## Closeout

This implementation slice is complete as of 2026-04-29. It adds public
retrieval request, retrieval plan, retrieval outcome, and RAG answer state
contracts with validation helpers. No deferred package was activated and no
database schema was changed.

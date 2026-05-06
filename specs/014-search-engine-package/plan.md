# Implementation Plan: Search Engine Package

**Branch**: package-specific branch after Spec #035 | **Date**: 2026-05-06 |
**Spec**: [spec.md](./spec.md)

## Summary

Build `@tempot/search-engine` as a typed planning and state package. The package validates
search requests, normalizes relational and semantic search plans, persists list state via
an injected cache adapter, and returns i18n-keyed state metadata. It does not execute
Prisma clients directly and does not call AI providers directly.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: `neverthrow` 8.2.0, `@tempot/shared`, optional adapter contracts
for `@tempot/ai-core`
**Storage**: Search state through injected cache adapter
**Testing**: Vitest unit tests first, then package build and lint
**Target Platform**: Node.js 22.12+ monorepo
**Project Type**: Workspace package
**Constraints**:
  - No `any`, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable`
  - No hardcoded user-facing text
  - No direct Prisma client execution from package services
  - No direct AI provider calls
  - Public fallible APIs return Result values

## Constitution Check

| Rule Area | Status | Notes |
| --- | --- | --- |
| TypeScript strict mode | PASS | All contracts must be explicit |
| Result pattern | PASS | Public fallible APIs return Result values |
| Repository boundary | PASS | Package builds plans; repositories execute persistence |
| i18n-only user text | PASS | Empty and expired states use message keys |
| TDD mandatory | PASS | Tasks require RED before implementation |
| Package checklist | PASS | Completion blocked on checklist verification |

## Project Structure

```text
packages/search-engine/
  src/
    contracts/
    planning/
    state/
    semantic/
    index exports
  tests/
    unit/
```

## Implementation Strategy

1. Create failing unit tests for filter validation, plan building, state persistence, and
   semantic adapter behavior.
2. Add typed contracts and package exports.
3. Implement relational plan normalization without database execution.
4. Implement cache-backed state store through an injected adapter.
5. Implement semantic planning through injected retrieval adapters.
6. Run package gates and full merge gates.

## Complexity Tracking

No complexity exception is planned. If semantic search requires new runtime dependencies,
pause and update research before implementation continues.

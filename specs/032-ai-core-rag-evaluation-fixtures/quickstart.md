# Quickstart: AI Core RAG Evaluation Fixtures

## Purpose

Validate that Spec #032 fixtures and helper tests execute offline inside `packages/ai-core`.

## Commands

```powershell
corepack pnpm --filter @tempot/ai-core test -- tests/unit/rag-evaluation-fixtures.test.ts
corepack pnpm --filter @tempot/ai-core test
corepack pnpm lint
corepack pnpm spec:validate
git diff --check
```

## Expected Result

- The targeted RAG evaluation fixture test passes.
- The full `@tempot/ai-core` package test suite passes.
- Lint, SpecKit reconciliation, and whitespace checks pass.

## Scope Check

Confirm the implementation did not add:

- A CLI command.
- A runtime evaluator service.
- A new package dependency.
- Database schema or migration files.
- Activation of deferred packages.

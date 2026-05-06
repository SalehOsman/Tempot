# CMS Engine AI-Ready MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first `@tempot/cms-engine` MVP with deterministic dynamic translation overrides and optional AI draft review ports.

**Architecture:** The package is port-driven. Runtime lookup uses cache, override-store, and static-catalog ports only. AI is only used through an explicit draft-review method and is not reachable from runtime lookup.

**Tech Stack:** TypeScript 5.9.3, Vitest 4.1.0, neverthrow 8.2.0, `@tempot/shared`, `sanitize-html`.

---

## Task 1: Package Infrastructure

**Files:**

- Create: `packages/cms-engine/.gitignore`
- Create: `packages/cms-engine/package.json`
- Create: `packages/cms-engine/tsconfig.json`
- Create: `packages/cms-engine/vitest.config.ts`
- Modify: `packages/cms-engine/README.md`

- [ ] Create package checklist artifacts before `src/`.
- [ ] Install workspace dependencies with `corepack pnpm install`.
- [ ] Verify `corepack pnpm --filter @tempot/cms-engine build` fails only because no source exists yet.

## Task 2: TDD Contracts and Resolver

**Files:**

- Test: `packages/cms-engine/tests/unit/cms.contracts.test.ts`
- Test: `packages/cms-engine/tests/unit/cms.resolver.test.ts`
- Create: `packages/cms-engine/src/index.ts`
- Create: `packages/cms-engine/src/cms-engine.types.ts`
- Create: `packages/cms-engine/src/cms-engine.ports.ts`
- Create: `packages/cms-engine/src/cms-engine.errors.ts`
- Create: `packages/cms-engine/src/cms-resolution.service.ts`

- [ ] Write failing tests for exported contracts and fallback resolution.
- [ ] Verify RED with `corepack pnpm --filter @tempot/cms-engine exec vitest run tests/unit/cms.contracts.test.ts tests/unit/cms.resolver.test.ts`.
- [ ] Implement minimal contracts and resolver.
- [ ] Verify GREEN with the same command.

## Task 3: TDD Mutation Safety

**Files:**

- Test: `packages/cms-engine/tests/unit/cms.update.test.ts`
- Create: `packages/cms-engine/src/cms-placeholder.policy.ts`
- Create: `packages/cms-engine/src/cms-sanitizer.policy.ts`
- Create: `packages/cms-engine/src/cms-update.service.ts`

- [ ] Write failing tests for missing static key rejection, protected policy, placeholder mismatch, sanitization, event payload, audit payload, and cache invalidation.
- [ ] Verify RED with `corepack pnpm --filter @tempot/cms-engine exec vitest run tests/unit/cms.update.test.ts`.
- [ ] Implement minimal deterministic update path.
- [ ] Verify GREEN with the same command.

## Task 4: TDD Rollback and AI Draft Review

**Files:**

- Test: `packages/cms-engine/tests/unit/cms.rollback.test.ts`
- Test: `packages/cms-engine/tests/unit/cms.ai-review.test.ts`
- Create: `packages/cms-engine/src/cms-ai-review.service.ts`

- [ ] Write failing tests for rollback using normal update validation.
- [ ] Write failing tests for missing AI adapter and explicit AI review invocation.
- [ ] Verify RED with targeted Vitest.
- [ ] Implement rollback and AI review service.
- [ ] Verify GREEN with targeted Vitest.

## Task 5: Documentation and Gates

**Files:**

- Modify: `docs/archive/ROADMAP.md`
- Modify: `.specify/feature.json`
- Add: `.changeset/cms-engine-ai-ready.md`
- Modify: `specs/008-cms-engine-package/tasks.md`

- [ ] Mark tasks complete as implementation evidence is produced.
- [ ] Run package tests, package build, lint, spec validation, boundary audit, CMS check, module checklist, audit, and diff checks.
- [ ] Commit, push, open PR, wait for GitHub checks, and merge only after checks pass.

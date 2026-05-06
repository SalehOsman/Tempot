# Search Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@tempot/search-engine` as a strict, tested package for relational search planning, cache-backed search state, pagination metadata, and adapter-driven semantic planning.

**Architecture:** The package validates and normalizes search requests, but does not execute Prisma queries, render Telegram menus, or call AI providers directly. Repositories and modules consume `SearchPlan` values, while semantic behavior flows through injected adapters.

**Tech Stack:** TypeScript 5.9.3 strict mode, Vitest 4.1.0, `neverthrow` 8.2.0, `@tempot/shared` `AppError`/toggle guard patterns.

---

## Source Artifacts

- SpecKit: `specs/014-search-engine-package/spec.md`
- Plan: `specs/014-search-engine-package/plan.md`
- Tasks: `specs/014-search-engine-package/tasks.md`
- Research: `specs/014-search-engine-package/research.md`
- Data model: `specs/014-search-engine-package/data-model.md`
- Current package stub: `packages/search-engine/README.md`

## File Map

- Create `packages/search-engine/package.json`: workspace manifest and scripts.
- Create `packages/search-engine/tsconfig.json`: strict package build config.
- Create `packages/search-engine/vitest.config.ts`: package unit test config.
- Create `packages/search-engine/.gitignore`: generated output guard.
- Replace `packages/search-engine/README.md`: current Spec #014 package contract, not stale Prisma/menu behavior.
- Create `packages/search-engine/src/search-engine.errors.ts`: stable error codes.
- Create `packages/search-engine/src/search-engine.toggle.ts`: `TEMPOT_SEARCH_ENGINE` guard.
- Create `packages/search-engine/src/search-engine.types.ts`: requests, filters, plans, state, result page types.
- Create `packages/search-engine/src/search-engine.ports.ts`: cache and semantic adapter ports.
- Create `packages/search-engine/src/search-plan.builder.ts`: relational and semantic plan normalization.
- Create `packages/search-engine/src/search-state.store.ts`: injected cache state persistence with 1800-second TTL.
- Create `packages/search-engine/src/search-pagination.ts`: pagination plan and result page helpers.
- Create `packages/search-engine/src/index.ts`: public exports.
- Create `packages/search-engine/tests/unit/search.contracts.test.ts`: contract and filter coverage tests.
- Create `packages/search-engine/tests/unit/search.plan.test.ts`: invalid field/operator and plan tests.
- Create `packages/search-engine/tests/unit/search.state.test.ts`: cache-backed state tests.
- Create `packages/search-engine/tests/unit/search.semantic.test.ts`: semantic adapter tests.
- Create `packages/search-engine/tests/unit/search-engine.toggle.test.ts`: toggle tests.
- Add `.changeset/search-engine-package.md`: minor release entry.
- Update `specs/014-search-engine-package/tasks.md`: mark tasks complete only after verified.
- Update `docs/archive/ROADMAP.md`: record active/completed status after merge gates.

## Task 1: Package Setup

- [ ] Create package manifest, TypeScript config, Vitest config, `.gitignore`, and README aligned to Spec #014.
- [ ] Run `corepack pnpm --filter @tempot/search-engine test`.
- [ ] Expected RED: tests cannot run or no tests exist yet; setup alone must not introduce production behavior.

## Task 2: Contract RED Tests

- [ ] Write tests proving enum, range, date-range, contains, and boolean filters can be represented and planned.
- [ ] Write tests proving invalid fields and invalid operators return `AppError` through `Result`.
- [ ] Run `corepack pnpm --filter @tempot/search-engine test -- --run tests/unit/search.contracts.test.ts tests/unit/search.plan.test.ts`.
- [ ] Expected RED: missing exports such as `SearchPlanBuilder`, `SEARCH_ENGINE_ERRORS`, and typed contracts.

## Task 3: Relational Planning GREEN

- [ ] Implement error codes, typed contracts, toggle guard, and `SearchPlanBuilder.build`.
- [ ] Normalize pagination into `page`, `pageSize`, `offset`, `limit`, and placeholder `totalItems`.
- [ ] Reject unknown fields before plan creation.
- [ ] Reject operators not allowed by the configured field definition.
- [ ] Run the Task 2 command and verify GREEN.

## Task 4: State Persistence RED/GREEN

- [ ] Write failing tests for save, load, missing state, expired state, and fixed `1800` second TTL.
- [ ] Implement `SearchStateStore` using an injected cache adapter only.
- [ ] Use namespaced keys with `search-engine:state:{ownerId}:{stateId}`.
- [ ] Return `search_engine.state_expired` for missing or expired state.
- [ ] Run `corepack pnpm --filter @tempot/search-engine test -- --run tests/unit/search.state.test.ts` and verify GREEN.

## Task 5: Semantic Planning RED/GREEN

- [ ] Write failing tests for semantic mode with query, semantic mode without query, and adapter invocation.
- [ ] Implement semantic planning through an injected adapter.
- [ ] Return relevance metadata from the adapter without importing provider SDKs or calling `ai-core` directly.
- [ ] Run `corepack pnpm --filter @tempot/search-engine test -- --run tests/unit/search.semantic.test.ts` and verify GREEN.

## Task 6: Toggle and Package Completion

- [ ] Write toggle tests for builder and state store disabled behavior.
- [ ] Guard fallible public APIs with `TEMPOT_SEARCH_ENGINE`.
- [ ] Run `corepack pnpm --filter @tempot/search-engine test`.
- [ ] Run `corepack pnpm --filter @tempot/search-engine build`.
- [ ] Update `.changeset`, README, `tasks.md`, and Roadmap.

## Task 7: Merge Gates

- [ ] Run `corepack pnpm lint`.
- [ ] Run `corepack pnpm --filter @tempot/database db:generate`.
- [ ] Run `corepack pnpm build`.
- [ ] Run `corepack pnpm test:unit`.
- [ ] Run `corepack pnpm test:integration`.
- [ ] Run `corepack pnpm spec:validate`.
- [ ] Run `corepack pnpm boundary:audit`.
- [ ] Run `corepack pnpm cms:check`.
- [ ] Run `corepack pnpm module:checklist`.
- [ ] Run `corepack pnpm audit --audit-level=high`.
- [ ] Run `corepack pnpm changeset:status`.
- [ ] Run `git diff --check`.
- [ ] Review staged diff before commit.

## Self-Review

- Spec coverage: FR-001 through FR-010 are represented by Tasks 1-7.
- TDD coverage: Tasks 2, 4, 5, and 6 start with RED tests before implementation.
- Boundary coverage: no Prisma, Telegram menu, or direct AI provider calls are planned.
- Documentation sync: README, SpecKit tasks, Roadmap, changeset, and plan are included.

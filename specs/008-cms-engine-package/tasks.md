# CMS Engine Tasks

## Phase 1: SpecKit Repair

- [x] T001 Update `spec.md` with AI-assisted CMS requirements and no-AI runtime lookup - covers FR-003, FR-012, FR-013, SC-004
- [x] T002 Update `plan.md`, create `research.md`, and create `data-model.md` - covers FR-001, FR-002, FR-014
- [x] T003 Create dependency-ordered `tasks.md` and run SpecKit consistency validation - covers SC-005

## Phase 2: Package Infrastructure

- [x] T004 Create `packages/cms-engine/package.json`, `.gitignore`, `tsconfig.json`, and `vitest.config.ts` - covers FR-001
- [x] T005 Update `packages/cms-engine/README.md`, Roadmap, changeset, and active feature metadata - covers FR-001

## Phase 3: TDD - Contracts and Runtime Lookup

- [x] T006 Write failing unit tests for public contracts, fallback source metadata, and package exports - covers FR-001, FR-002
- [x] T007 Write failing unit tests proving runtime lookup skips AI adapters - covers FR-003, SC-004
- [x] T008 Implement strict public contracts and runtime fallback resolver - covers FR-001, FR-002, FR-003, SC-001

## Phase 4: TDD - Mutation Safety

- [x] T009 Write failing unit tests for missing static key rejection and no dashboard key creation - covers FR-004, SC-005
- [x] T010 Write failing unit tests for protected policies - covers FR-005, SC-005
- [x] T011 Write failing unit tests for placeholder preservation and sanitization - covers FR-006, FR-007, FR-014, SC-005
- [x] T012 Implement validated update service with store, cache invalidation, event, and audit ports - covers FR-008, FR-009, FR-010, SC-002, SC-003

## Phase 5: TDD - Rollback and AI Review

- [x] T013 Write failing unit tests for rollback through the normal update path - covers FR-011
- [x] T014 Write failing unit tests for optional AI review port and missing-adapter error - covers FR-012, FR-013, SC-004
- [x] T015 Implement rollback contracts and AI draft review service - covers FR-011, FR-012, FR-013

## Phase 6: Verification

- [x] T016 Run package unit tests, package cached lookup latency benchmark, and package build - covers SC-001, SC-004, SC-005
- [x] T017 Run `pnpm lint`, `pnpm spec:validate`, `pnpm boundary:audit`, `pnpm cms:check`, `pnpm module:checklist`, and `pnpm audit --audit-level=high` - covers SC-002, SC-003, SC-005
- [x] T018 Run full merge gates selected for package activation and review diff for constitution compliance - covers FR-001 through FR-014

## MVP Definition

The MVP is complete when `@tempot/cms-engine` exposes deterministic runtime resolution, validated override mutation, rollback contracts, and AI draft-review ports with unit tests. Dashboard UI, Prisma migrations, and direct `ai-core` adapter wiring are outside this MVP and must be activated by a later SpecKit decision.

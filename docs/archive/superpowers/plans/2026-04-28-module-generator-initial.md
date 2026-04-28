# Tempot Module Generator Initial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first governed module generator command, `pnpm tempot module create <module-name>`.

**Architecture:** The existing root Tempot CLI routes module creation requests to a focused generator. The generator validates a kebab-case module name, creates a minimal inactive module skeleton, and refuses to overwrite existing modules.

**Tech Stack:** TypeScript, Node.js filesystem APIs, Vitest, pnpm workspace root scripts.

---

### Task 1: Initial Module Generator

**Files:**
- Create: `scripts/tempot/module-generator.types.ts`
- Create: `scripts/tempot/module-generator.validation.ts`
- Create: `scripts/tempot/module-generator.templates.ts`
- Create: `scripts/tempot/module-generator.writer.ts`
- Create: `scripts/tempot/module-generator.presenter.ts`
- Create: `scripts/tempot/tests/unit/module-generator.test.ts`
- Modify: `scripts/tempot/doctor.presenter.ts`
- Modify: `scripts/tempot/index.ts`
- Modify: `docs/archive/developer/module-generator-plan.md`
- Modify: `docs/archive/ROADMAP.md`
- Modify: `specs/026-architecture-isolation-and-saas-readiness/tasks.md`

- [x] **Step 1: Write failing tests**

Cover valid module generation, invalid names, overwrite protection, CLI parsing, and user-facing generator output.

- [x] **Step 2: Run tests to verify RED**

Run: `pnpm vitest run --project=unit scripts/tempot/tests/unit/module-generator.test.ts`

Expected: FAIL because the module generator does not exist.

- [x] **Step 3: Implement minimal generator**

Create focused generator files that produce package metadata, TypeScript config, Vitest config, module config, starter abilities, root setup, locale resources, tests, and ignore rules.

- [x] **Step 4: Run tests to verify GREEN**

Run: `pnpm vitest run --project=unit scripts/tempot/tests/unit/module-generator.test.ts`

Expected: PASS.

- [x] **Step 5: Verify generated module build path**

Create a temporary generated module in the test sandbox and assert the generated module package metadata and files match Tempot module rules.

- [x] **Step 6: Sync documentation**

Update module generator docs, roadmap, and Spec #026 tasks to mark the initial generator slice as implemented.

- [x] **Step 7: Verify branch**

Run: `pnpm lint`, targeted tests, `pnpm spec:validate`, `pnpm cms:check`, and `git diff --check`.

- [ ] **Step 8: Commit**

Commit with: `feat: add tempot module generator`

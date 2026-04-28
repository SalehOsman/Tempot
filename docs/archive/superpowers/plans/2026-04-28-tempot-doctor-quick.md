# Tempot Doctor Quick Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first local developer diagnostic command, `pnpm tempot doctor --quick`.

**Architecture:** The root `tempot` script routes CLI input to a small doctor module. The doctor module keeps checks pure where possible and injects command execution for testability. Output is developer-facing English and never prints secret values.

**Tech Stack:** TypeScript, Node.js built-ins, Vitest, pnpm workspace root scripts.

---

### Task 1: Quick Doctor Checks

**Files:**
- Create: `scripts/tempot/doctor.checks.ts`
- Create: `scripts/tempot/doctor.presenter.ts`
- Create: `scripts/tempot/index.ts`
- Test: `scripts/tempot/tests/unit/doctor.test.ts`
- Modify: `package.json`
- Modify: `docs/archive/developer/local-developer-doctor.md`
- Modify: `docs/archive/ROADMAP.md`

- [x] **Step 1: Write the failing tests**

Create tests for Node version, pnpm version, Git branch status, install state, output formatting, and unsupported command handling.

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project=unit scripts/tempot/tests/unit/doctor.test.ts`

Expected: FAIL because the doctor module does not exist.

- [x] **Step 3: Implement the doctor module and CLI route**

Create focused files under `scripts/tempot/` and add `"tempot": "tsx scripts/tempot/index.ts"` to root scripts.

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project=unit scripts/tempot/tests/unit/doctor.test.ts`

Expected: PASS.

- [x] **Step 5: Sync documentation**

Update `docs/archive/developer/local-developer-doctor.md` and `docs/archive/ROADMAP.md` to mark quick mode as initially implemented.

- [x] **Step 6: Verify branch**

Run: `pnpm lint`, `pnpm spec:validate`, `pnpm cms:check`, `git diff --check`.

- [x] **Step 7: Commit**

Commit with: `feat: add tempot doctor quick mode`

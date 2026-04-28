# Tempot Init Initial Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first internal `pnpm tempot init` mode for safe local project initialization.

**Architecture:** The command stays inside the existing `scripts/tempot` CLI surface introduced by the doctor and module-generator slices. It creates `.env` from `.env.example` only when `.env` is missing, preserves existing local configuration, and prints deterministic developer-facing next steps without exposing secret values.

**Tech Stack:** TypeScript strict mode, Vitest unit tests, Node.js filesystem APIs, root `pnpm tempot` script.

---

## Scope

- Add parser support for `pnpm tempot init`.
- Add an initialization writer that copies `.env.example` to `.env` when safe.
- Add presenter output for success, skipped existing `.env`, and blocking failure.
- Keep this slice local-only; no project publishing, package scaffolding, or `create-tempot-bot` release workflow.

## File Plan

- Create `scripts/tempot/init.types.ts` for command result contracts.
- Create `scripts/tempot/init.writer.ts` for filesystem-safe initialization behavior.
- Create `scripts/tempot/init.presenter.ts` for deterministic CLI output.
- Modify `scripts/tempot/doctor.presenter.ts` to parse and document the command.
- Modify `scripts/tempot/index.ts` to route the command.
- Add `scripts/tempot/tests/unit/init.test.ts` for TDD coverage.
- Update spec #026 tasks and roadmap-linked docs after implementation.

## Executed Tasks

### Task 1: RED Tests

- [x] Add unit tests for parser support, `.env` creation, overwrite protection, missing `.env.example`, and secret-safe output.
- [x] Run `pnpm vitest run --project=unit scripts/tempot/tests/unit/init.test.ts --reporter=verbose`.
- [x] Confirm RED failure because `init.presenter.js` and `init.writer.js` did not exist.

### Task 2: GREEN Implementation

- [x] Add `init.types.ts`, `init.writer.ts`, and `init.presenter.ts`.
- [x] Extend `parseTempotArgs()` with `init`.
- [x] Route `init` in `scripts/tempot/index.ts`.
- [x] Run targeted CLI tests with doctor and module-generator coverage.

### Task 3: CLI Verification

- [x] Run `pnpm tempot init` from the repository worktree.
- [x] Confirm `.env` is created from `.env.example`.
- [x] Remove the local `.env` test artifact after verification.

### Task 4: Documentation Sync

- [x] Update spec #026 tasks with the Tempot init slice.
- [x] Update roadmap-linked developer docs to reflect implemented initial mode.
- [x] Update `docs/archive/ROADMAP.md` with the implemented command and tests.

## Validation Commands

```powershell
pnpm vitest run --project=unit scripts/tempot/tests/unit/init.test.ts scripts/tempot/tests/unit/doctor.test.ts scripts/tempot/tests/unit/module-generator.test.ts --reporter=verbose
pnpm tempot init
pnpm lint
pnpm test:unit
pnpm spec:validate
pnpm cms:check
git diff --check
```

# Spec Validation & Reconciliation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a structural validation system that prevents spec-to-code drift by checking artifact existence, cross-references, file paths, error codes, and NFR benchmark coverage.

**Architecture:** A single TypeScript script (`scripts/spec-validate.ts`) performs all mechanical checks. A Superpowers skill (`spec-reconciliation`) integrates the script into the merge workflow. Documentation updates add a Reconciliation Gate to the existing 6-gate system.

**Tech Stack:** TypeScript, tsx runner, node:fs, node:path (zero new dependencies)

---

## Task 1: Write `scripts/spec-validate.ts`

**Files:**

- Create: `scripts/spec-validate.ts`
- Modify: `package.json` (add `spec:validate` script)

Complete script implementing 6 checks: ARTIFACT_EXISTENCE, FR_COVERAGE, SC_COVERAGE, FILE_REFERENCES, ERROR_CODE_PARITY, NFR_BENCHMARK. Exit codes: 0 (pass), 1 (HIGH/MEDIUM), 2 (CRITICAL).

## Task 2: Write `spec-reconciliation` Skill

**Files:**

- Create: Skill SKILL.md (location determined by `writing-skills` skill)

Instructions for AI to run `pnpm spec:validate` as pre-merge gate within `finishing-a-development-branch`. Decision tree: pass/warn/block.

## Task 3: Update Documentation

**Files:**

- Modify: `.specify/memory/constitution.md` (Rules LXXXII, LXXXVI)
- Modify: `docs/developer/workflow-guide.md` (Handoff Gate + new step)
- Modify: `CLAUDE.md` (Quality Gates table + Handoff Gate text)

Add data-model.md + research.md to Handoff Gate. Add Reconciliation Gate. Add spec-reconciliation step to Superpowers sequence.

## Task 4: Integration Test

Run `pnpm spec:validate --all` against all 17 spec directories. Verify output format, exit codes, and that known issues are correctly detected.

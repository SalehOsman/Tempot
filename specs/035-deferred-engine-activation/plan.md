# Implementation Plan: Deferred Engine Activation

**Branch**: `codex/035-activate-deferred-packages` | **Date**: 2026-05-06 |
**Spec**: [spec.md](./spec.md)
**Input**: Product Manager decision to activate `search-engine`, `document-engine`, and
`import-engine`.

## Summary

Record the activation decision for three previously deferred packages, repair their
SpecKit handoff artifacts, and define the constitution-compliant execution order. This
slice intentionally does not implement package source code. It prepares the governance
state needed for separate Superpowers execution branches.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode for future package work
**Primary Dependencies**: Existing Tempot workspace packages; package-specific dependency
decisions stay in each package research artifact
**Storage**: N/A for activation documentation
**Testing**: Spec validation and cross-artifact review
**Target Platform**: Node.js 22.12+ monorepo
**Project Type**: Governance and SpecKit activation slice
**Constraints**:
  - Do not develop directly on `main`
  - Keep `.understand-anything/` local and untracked
  - Do not change production package source code in this slice
  - One package may be in active execution at a time after activation
  - Each package must pass its handoff gate before implementation

## Constitution Check

| Rule Area | Status | Notes |
| --- | --- | --- |
| Role framework | PASS | PM decision activates scope; Technical Advisor prepares controlled handoff |
| Rule XC deferred packages | PASS | Activation decision is recorded in the roadmap |
| Rule LXXXV package execution | PASS | Execution order allows one active package branch at a time |
| SpecKit handoff | PASS | Existing package specs are repaired before Superpowers execution |
| Git workflow | PASS | Work happens on isolated `codex/035-activate-deferred-packages` worktree |
| Scope control | PASS | No package source code changes in this activation slice |

## Project Structure

### Documentation

```text
specs/035-deferred-engine-activation/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/package-activation.md
  checklists/requirements.md
  tasks.md
```

### Existing Package Specs Repaired

```text
specs/014-search-engine-package/
specs/016-document-engine-package/
specs/017-import-engine-package/
```

## Implementation Strategy

1. Create an isolated activation branch and point `.specify/feature.json` at Spec #035.
2. Record the Product Manager activation decision in the roadmap.
3. Repair the three package specs so each has the required handoff artifacts.
4. Run cross-artifact analysis manually and resolve critical inconsistencies.
5. Run `corepack pnpm spec:validate` and confirm zero critical issues.
6. Finish this branch without production code changes.

## Execution Sequence After This Slice

| Order | Package | Reason |
| --- | --- | --- |
| 1 | `document-engine` | Foundational export and error-report capability |
| 2 | `import-engine` | Depends on document error report contracts |
| 3 | `search-engine` | Can align with current `ai-core` RAG contracts after import/export foundations |

## Complexity Tracking

No complexity exceptions are introduced by this activation slice.

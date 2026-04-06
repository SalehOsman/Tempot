# Design: Spec Validation & Reconciliation System

**Date**: 2026-03-31
**Status**: Approved
**Approach**: Script-Centric (Approach A)

## Problem

Specification analysis (`/speckit.analyze`) repeatedly finds issues across packages — 78 in Round 1, 146 in Round 2, 62 in Round 3. Root causes:

1. **Artifact drift** — spec.md, plan.md, tasks.md edited independently without cross-validation
2. **Missing artifacts** — data-model.md and research.md not required by Handoff Gate
3. **No post-implementation reconciliation** — specs not verified against actual code after merge
4. **No automated structural checks** — cross-references, file paths, error codes validated only by manual AI analysis

## Solution: Three Components

### Component 1: `pnpm spec:validate` Script

A TypeScript script that performs mechanical/structural validation of spec artifacts against the codebase.

**Location**: `scripts/spec-validate.ts`
**Runner**: `npx tsx scripts/spec-validate.ts`
**Root package.json**: `"spec:validate": "npx tsx scripts/spec-validate.ts"`

#### Usage

```bash
# Validate a single package
pnpm spec:validate 004-session-manager-package

# Validate all packages
pnpm spec:validate --all
```

#### Checks

| #   | Check ID             | Severity | Logic                                                                                   |
| --- | -------------------- | -------- | --------------------------------------------------------------------------------------- |
| 1   | `ARTIFACT_EXISTENCE` | CRITICAL | All 5 artifacts exist: spec.md, plan.md, tasks.md, data-model.md, research.md           |
| 2   | `FR_COVERAGE`        | CRITICAL | Every FR-XXX in spec.md is referenced in at least one task in tasks.md                  |
| 3   | `SC_COVERAGE`        | HIGH     | Every SC-XXX in spec.md is referenced in tasks.md or acceptance criteria                |
| 4   | `FILE_REFERENCES`    | HIGH     | Every file path in plan.md/tasks.md (e.g., `packages/x/src/y.ts`) exists in the project |
| 5   | `ERROR_CODE_PARITY`  | HIGH     | Error codes mentioned in spec/plan exist in source code                                 |
| 6   | `NFR_BENCHMARK`      | MEDIUM   | NFRs with measurable targets (< Xms, < Xmb) have corresponding test tasks               |

#### Exit Codes

| Code | Meaning                                |
| ---- | -------------------------------------- |
| 0    | All checks pass                        |
| 1    | HIGH or MEDIUM issues found (warnings) |
| 2    | CRITICAL issues found (blocking)       |

#### Output Format

JSON report to stdout:

```json
{
  "package": "004-session-manager-package",
  "timestamp": "2026-03-31T12:00:00Z",
  "summary": { "critical": 0, "high": 1, "medium": 2, "pass": 3 },
  "checks": [
    {
      "id": "ARTIFACT_EXISTENCE",
      "status": "PASS",
      "severity": "CRITICAL",
      "details": []
    },
    {
      "id": "FILE_REFERENCES",
      "status": "FAIL",
      "severity": "HIGH",
      "details": [
        {
          "source": "plan.md:136",
          "reference": "packages/i18n-core/src/t.ts",
          "message": "Referenced file does not exist"
        }
      ]
    }
  ]
}
```

Human-readable summary table also printed to stderr.

#### Technology

- TypeScript, runs via `tsx` (already in project)
- Zero new dependencies — uses `node:fs`, `node:path`, regex parsing
- Single file: `scripts/spec-validate.ts`
- Parses markdown with line-by-line regex (not AST — simple and sufficient for structured spec format)

#### What It Does NOT Check

| Check                     | Covered By                        |
| ------------------------- | --------------------------------- |
| Function length (Rule II) | ESLint / code review              |
| `console.*` (Rule LXXIV)  | ESLint / pre-commit               |
| `any` types (Rule I)      | TypeScript strict mode            |
| TDD order                 | subagent-driven-development skill |
| Semantic consistency      | `/speckit.analyze` (Gemini)       |

### Component 2: `spec-reconciliation` Superpowers Skill

A skill that integrates into `finishing-a-development-branch` as a pre-merge gate.

**Location**: New skill directory in Superpowers

#### Integration Point

```
finishing-a-development-branch (updated flow):
  1. All tests pass
  2. Build succeeds
  3. [NEW] spec-reconciliation check
  4. Code review (requesting-code-review)
  5. PR/Merge
```

#### Decision Tree

```
Run pnpm spec:validate <package>
  |
  +-- Exit 0 (all pass) --> "Spec reconciliation passed" --> continue
  |
  +-- Exit 1 (HIGH/MEDIUM) --> Print warnings
  |   +-- Ask: "Fix before merge, or defer with justification?"
  |       +-- Fix --> user fixes, re-run
  |       +-- Defer --> log justification, continue
  |
  +-- Exit 2 (CRITICAL) --> BLOCK merge
      +-- List exact fixes needed
      +-- User must fix and re-run
```

#### When to Invoke

| Scenario                               | Action                                |
| -------------------------------------- | ------------------------------------- |
| New package (first implementation)     | At Handoff Gate before implementation |
| Post-implementation (finishing branch) | Pre-merge check                       |
| Retroactive (existing packages)        | Manual: `pnpm spec:validate --all`    |
| After spec edits                       | Manual on affected package            |

#### Skill File

Single file: `SKILL.md` containing instructions, checklist, and decision tree. No scripts inside the skill — the validation script lives in project root.

### Component 3: Documentation Updates

#### A. Constitution (`constitution.md`)

**Rule LXXXII (Handoff Gate)** — add 2 artifact requirements + script check:

```
Before:
  spec.md, plan.md, tasks.md, /speckit.analyze passed

After:
  spec.md, plan.md, tasks.md, data-model.md, research.md,
  /speckit.analyze passed, pnpm spec:validate passed (0 CRITICAL)
```

**Rule LXXXVI (Quality Gates)** — add Reconciliation Gate:

```
New row:
  Reconciliation Gate | Before merge | pnpm spec:validate passes (0 CRITICAL)
```

#### B. Workflow Guide (`workflow-guide.md`)

3 changes:

1. Handoff Gate section — add data-model.md + research.md + spec:validate
2. Superpowers sequence — add spec-reconciliation between verification and finishing
3. New section — "Post-Implementation Reconciliation" explaining when/how to run

#### C. CLAUDE.md

2 changes:

1. Quality Gates table — add Reconciliation Gate row
2. Handoff Gate text — add data-model.md, research.md, spec:validate

## Scope Boundaries

- Script validates structure, not semantics (that's `/speckit.analyze`)
- Skill reports issues, does not auto-fix
- No changes to SpecKit commands — `/speckit.plan` already produces data-model.md and research.md
- No changes to `roles.md` or `package-creation-checklist.md`

## Implementation Order

1. Write `scripts/spec-validate.ts` + add to root package.json
2. Run against all 5 existing packages to validate the script works
3. Write `spec-reconciliation` SKILL.md
4. Update constitution.md (Rules LXXXII, LXXXVI)
5. Update workflow-guide.md (3 sections)
6. Update CLAUDE.md (2 sections)
7. Commit all changes

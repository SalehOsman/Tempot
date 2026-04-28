---
name: tempot-code-review
description: Review Tempot changes for defects, constitution violations, architecture drift, missing tests, documentation drift, i18n violations, CI gaps, package checklist failures, and unsafe merge readiness. Use when asked to review code, specs, docs, GitHub Actions, PRs, commits, branches, or generated changes in the Tempot repository.
---

# Tempot Code Review

## Overview

Use this skill to review Tempot work with a defect-first stance. Lead with findings, not summaries.

## Required Sources

Read the changed files and the rules they touch. For broad reviews, read:

- `.specify/memory/constitution.md`
- `.specify/memory/roles.md`
- `docs/archive/ROADMAP.md`
- relevant `specs/{NNN}-{feature}/` artifacts
- relevant package or module README/checklist files

## Review Checklist

Check for:

- TypeScript strict violations, `any`, `@ts-ignore`, `eslint-disable`
- public APIs that throw instead of returning `Result<T, AppError>`
- direct Prisma access outside repository boundaries
- module-to-module imports instead of event-bus communication
- hardcoded user-facing text in source files
- missing Arabic/English locale parity
- missing tests for behavior changes
- package checklist gaps: `types`, `exports`, `vitest.config.ts`, `.gitignore`, `outDir: dist`
- CI gaps in lint, build, tests, `spec:validate`, `cms:check`, audit, and whitespace checks
- documentation drift in roadmap, specs, ADRs, and architecture docs
- changes that touch too broad a surface for the stated task

## Severity

- `P0`: security/data loss, broken main workflow, constitution-critical violation.
- `P1`: failing CI, missing required artifacts, architecture boundary break, untested critical behavior.
- `P2`: maintainability issue, incomplete docs sync, package checklist gap, risky but contained behavior.
- `P3`: style, clarity, or minor cleanup that does not block merge.

## Output Format

Report findings first, ordered by severity. Include file and line references. If no issues are found, say that clearly and identify residual risk or unrun tests.

Use this shape:

```markdown
## Findings
- [P1] Title - file:line
  Explanation and impact.

## Questions
- ...

## Verification
- Command: result
```

## Review Discipline

Do not rubber-stamp. Verify against repository files and command output. Do not claim tests pass unless the current session ran them and read the result.

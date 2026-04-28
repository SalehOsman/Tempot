---
name: tempot-ci-quality-gates
description: Run, interpret, repair, or improve Tempot local validation and GitHub Actions quality gates. Use when CI fails, GitHub Actions need updates, merge readiness must be proven, local verification is required, or project methodology gates such as lint, build, tests, spec:validate, cms:check, audit, and diff checks must be enforced.
---

# Tempot CI Quality Gates

## Overview

Use this skill to prove Tempot changes are safe to merge and to keep GitHub Actions aligned with the project constitution.

## Baseline Gates

Use these gates unless the task is explicitly narrower:

```powershell
$env:PATH = "F:\Tempot\temp\bin;$env:PATH"
pnpm spec:validate
pnpm cms:check
pnpm lint
pnpm --filter @tempot/database db:generate
pnpm build
pnpm test:unit
pnpm test:integration
pnpm audit --audit-level=high
git diff --check
```

Use the local `temp/bin` path when `pnpm` is not globally available.

## Gate Meaning

- `spec:validate`: SpecKit artifacts and spec-to-code reconciliation.
- `cms:check`: locale parity and hardcoded user-facing string guard.
- `lint`: TypeScript, boundaries, naming, and code-quality rules.
- `db:generate`: Prisma client and schema merge readiness.
- `build`: TypeScript and docs generation.
- `test:unit`: isolated package and module behavior.
- `test:integration`: database, Redis, and Testcontainers behavior.
- `audit`: dependency vulnerability gate.
- `git diff --check`: whitespace and clean diff guard.

## GitHub Actions Expectations

CI should include:

- lint
- type/build
- unit tests
- integration tests with PostgreSQL/pgvector and Redis
- security audit
- methodology gates: `spec:validate`, `cms:check`, and committed whitespace check
- PR-only changeset status when release-impacting changes are expected

Do not make security audit non-blocking for high or critical vulnerabilities unless a documented, dated exception exists.

## Debugging CI

When CI fails:

1. Read the exact failing job and first failing error.
2. Reproduce the same command locally.
3. Identify whether the root cause is code, docs, generated artifacts, dependency setup, or environment.
4. Fix at source.
5. Re-run the failing gate, then the surrounding gate group.

## Reporting

Report exact command results. Do not summarize a gate as passing unless the command was run in the current session and exited with code 0.

If a gate is skipped, state why and what risk remains.

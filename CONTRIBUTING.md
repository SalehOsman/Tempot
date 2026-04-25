# Contributing to Tempot

Thank you for your interest in contributing to Tempot. This document outlines the mandatory process for all contributions.

> ⚠️ **All contributions must follow the SpecKit + superpowers workflow defined in the [Project Constitution](.specify/memory/constitution.md). No exceptions.**

---

## Prerequisites

Before contributing, ensure you have:

- Node.js v20+
- pnpm v10+
- Docker & Docker Compose
- One of: Claude Code (Pro/Max) or Gemini CLI
- SpecKit: `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`
- superpowers extension installed on your AI tool

Run the setup script for a new environment:

```bash
bash scripts/setup-dev.sh
```

---

## The Mandatory 11-Step Workflow

Every contribution — no matter how small — must follow this lifecycle:

### Phase 1 — Specification (SpecKit, steps 1–5)

| Step | Command                                  | Output                 |
| ---- | ---------------------------------------- | ---------------------- |
| 1    | `specify init` + `/speckit.constitution` | Constitution loaded    |
| 2    | `/speckit.specify`                       | `spec.md` — what & why |
| 3    | `/speckit.clarify`                       | Edge cases resolved    |
| 4    | `/speckit.plan`                          | `plan.md` + data model |
| 5    | `/speckit.analyze`                       | Consistency verified   |

### Phase 2 — Execution (superpowers, steps 6–11)

| Step | Skill                                         | Output                                |
| ---- | --------------------------------------------- | ------------------------------------- |
| 6    | `brainstorming`                               | Architectural design approved         |
| 7    | `using-git-worktrees`                         | Isolated feature branch               |
| 8    | `writing-plans`                               | Actionable task plan                  |
| 9    | `executing-plans` + `test-driven-development` | Code + tests (RED → GREEN → REFACTOR) |
| 10   | `requesting-code-review`                      | Review report resolved                |
| 11   | `finishing-a-development-branch`              | PR or merge                           |

### No Skip Rule

- ❌ No code without an approved `spec.md`
- ❌ No code before tests (TDD is enforced — tests first)
- ❌ No merging with failing tests or lint errors
- ✅ Only exception: spike/prototype explicitly labelled "will not enter production"

---

## Branch Naming

```
feat/{spec-number}-{short-description}     # New feature
fix/{issue-number}-{short-description}     # Bug fix
docs/{short-description}                   # Documentation only
chore/{short-description}                  # Maintenance
security/{short-description}               # Security fix
```

---

## Commit Messages

Conventional Commits are mandatory and enforced via Husky:

```
feat(module): add user invitation system
fix(auth): handle expired session tokens correctly
docs(readme): update installation steps
chore(deps): upgrade vitest to 4.x
security(rate-limiter): tighten API limits
```

Format: `type(scope): description`

- `feat:` → MINOR version bump
- `fix:` → PATCH version bump
- `feat!:` or `BREAKING CHANGE:` → MAJOR version bump
- `docs:`, `chore:`, `test:`, `refactor:`, `security:` → no version bump

---

## Code Standards

All code must comply with the [Project Constitution](.specify/memory/constitution.md):

- **TypeScript strict mode** — no `any`, no `@ts-ignore` without ADR justification
- **200 lines max per file**, 50 lines max per function (ADR-030)
- **Result pattern** — `Result<T, AppError>` via `neverthrow`. No thrown exceptions in business logic
- **Repository pattern** — no direct Prisma calls in services or handlers
- **i18n-only** — zero hardcoded user-facing text in `.ts` files
- **No zombie code** — delete unused code, never comment it out

---

## Testing Requirements

Per Constitution Rules XXXIV–XXXVIII:

- Tests are written **before** implementation code (TDD)
- Coverage thresholds enforced: Services 80%, Handlers 70%
- All tests must pass before any PR is reviewed

```bash
pnpm test:unit          # Unit tests
pnpm test:integration   # Integration tests (requires Docker)
pnpm test:coverage      # Coverage report
```

---

## Pull Request Checklist

Before opening a PR, verify:

- [ ] `spec.md` exists and is approved
- [ ] All tests pass (`pnpm test`)
- [ ] No lint errors (`pnpm lint`)
- [ ] Coverage thresholds met (`pnpm test:coverage`)
- [ ] `pnpm cms:check` passes if locales were modified
- [ ] Conventional Commit format used
- [ ] ADR created if an architectural decision was made
- [ ] `requesting-code-review` skill used before final PR

---

## Hotfix Track

For critical production bugs (P0/P1) only:

1. Document the bug in a GitHub Issue with the `hotfix` label
2. Fix directly with a mandatory unit test
3. PR with prefix `security:` or `fix!:`
4. Create `spec.md` retroactively within 48 hours post-merge

**Conditions:** Active user impact + SUPER_ADMIN approval + fix ≤ 50 lines.

---

## Questions?

Open a GitHub Discussion or review the [Architecture Spec (Document v11)](docs/archive/tempot_v11_final.md) and [Workflow Guide](docs/archive/developer/workflow-guide.md).

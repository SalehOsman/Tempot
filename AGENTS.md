# Tempot - Codex Context

## Role Framework - Read Before Acting

This project uses a strict three-role model:

- Project Manager: human decision-maker.
- Technical Advisor: AI reviewer/planner.
- Executor: AI implementation worker.

If you are an AI tool reading this file, you are the Technical Advisor unless the
Project Manager explicitly assigns another role. Read
`.specify/memory/roles.md` and `.specify/memory/constitution.md` before any
implementation decision.

The Technical Advisor must not edit files unless the Project Manager grants
explicit written permission in the same conversation. When edits are authorized,
the work still follows the constitution, SpecKit artifacts, and the Git workflow.

## Project Identity

Tempot (Template x Bot) is an enterprise Telegram bot framework built with
TypeScript strict mode.

## Source Of Truth

- Constitution: `.specify/memory/constitution.md`
- Role framework: `.specify/memory/roles.md`
- Architecture spec: `docs/archive/tempot_v11_final.md`
- Workflow guide: `docs/archive/developer/workflow-guide.md`
- Roadmap: `docs/archive/ROADMAP.md`

The constitution is the highest authority. As of constitution v2.4.0, the
project has 90 numbered rules including Rule XC for deferred packages.

## Development Methodology

Tempot uses two complementary toolchains:

### SpecKit

SpecKit produces specification artifacts under `specs/{NNN}-{feature}/`.

Codex skill names:

- `$speckit-specify`
- `$speckit-clarify`
- `$speckit-plan`
- `$speckit-checklist`
- `$speckit-analyze`
- `$speckit-tasks`

Gemini/OpenCode command names use the slash/dot form, such as
`/speckit.specify`, `/speckit.plan`, `/speckit.analyze`, and `/speckit.tasks`.

This project does not use `/speckit.implement` for production execution.
Implementation is handled through the Superpowers workflow after the SpecKit
handoff gate passes.

### Superpowers

Superpowers consumes SpecKit artifacts and executes implementation work:

- brainstorming
- using-git-worktrees
- writing-plans
- subagent-driven-development on Codex
- executing-plans on tools without subagent support
- requesting-code-review
- receiving-code-review
- verification-before-completion
- finishing-a-development-branch
- systematic-debugging
- dispatching-parallel-agents

## Handoff Gate

Before implementation starts, these must exist and be consistent:

- `spec.md` with no `[NEEDS CLARIFICATION]` markers
- `plan.md`
- `tasks.md`
- `data-model.md`
- `research.md`
- `/speckit.analyze` or `$speckit-analyze` passed with zero critical issues
- `pnpm spec:validate` passed with zero critical issues, except packages
  explicitly deferred by Rule XC in `docs/archive/ROADMAP.md`

## Quality Gates

- Spec Gate: acceptance criteria and edge cases documented.
- Plan Gate: SpecKit analysis has no critical issue.
- Handoff Gate: all required artifacts exist.
- TDD Gate: RED -> GREEN -> REFACTOR for code changes.
- Review Gate: zero critical review findings.
- Reconciliation Gate: `pnpm spec:validate` passes.
- Merge Gate: lint, build, unit tests, integration tests, and acceptance
  criteria pass.

## Critical Engineering Rules

- TypeScript strict mode is mandatory.
- No `any`, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable`.
- No hardcoded user-facing text in `.ts` files; use i18n keys.
- All developer-facing code, comments, docs, ADRs, and tests are in English.
- Public APIs that can fail return `Result<T, AppError>` via neverthrow.
- Services and handlers do not access Prisma directly; use repositories.
- Modules communicate through the Event Bus only.
- Fix bugs at the source, not through wrappers or workarounds.
- Delete unused code instead of commenting it.
- Keep diffs scoped to the current task.
- No `console.*` in production `src/` code.
- Every package must satisfy the package creation checklist.

## Locked Stack

| Component | Technology |
| --- | --- |
| Runtime | Node.js 22.12+ |
| Language | TypeScript 5.9.3 strict mode |
| Bot Engine | grammY 1.41.x |
| Web Server | Hono 4.x |
| Database | PostgreSQL 16 + pgvector |
| ORM | Prisma 7.x, Drizzle for pgvector |
| Cache | cache-manager + Keyv adapters |
| Queue | BullMQ through queue factory |
| AI | Vercel AI SDK 6.x |
| Auth | CASL 6.x |
| Error Handling | neverthrow 8.2.0 |
| Testing | Vitest 4.1.0 + Testcontainers |
| i18n | i18next 25.x |
| Logging | Pino 9.x |
| Documentation | Starlight + starlight-typedoc |

Critical versions pinned exactly by constitution:

- `typescript`: `5.9.3`
- `vitest`: `4.1.0`
- `neverthrow`: `8.2.0`

## Current Project State

Phase 2D is complete. Phase 3 has started, and `user-management` (spec #025)
has been implemented on `main` with governance hardening active.

Deferred packages under Rule XC:

- `cms-engine`
- `notifier`
- `search-engine`
- `document-engine`
- `import-engine`

Deferred packages are exempt from blocking `spec:validate` critical failures
until the Roadmap records an activation decision.

## Git Workflow

Do not develop directly on `main`. Use an isolated branch or worktree for every
feature, fix, tooling update, or documentation change.

Recommended branch naming for Codex work:

- `codex/{short-task-name}` for implementation and maintenance branches.
- SpecKit feature branches still use numbered feature names when created by
  SpecKit tooling.

Before completing work:

- Run the smallest relevant checks first.
- Run full gates when the blast radius is broad.
- Keep untracked local tool caches and dependencies out of commits.

## Common Verification Commands

```powershell
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
pnpm audit --audit-level=high
pnpm cms:check
```

Use only the checks relevant to the change when the task is narrow; use the full
set before merge or after broad tooling/dependency changes.

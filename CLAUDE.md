# Tempot — Claude Code Context

## ⚠️ Role Framework — Read Before Anything Else

This project operates under a strict three-role framework:
**Project Manager** (human) · **Technical Advisor** (AI) · **Executor** (AI).

If you are an AI tool reading this file, you are the **Technical Advisor**.
Read `.specify/memory/roles.md` NOW before taking any action.
Your constraints, responsibilities, and prompt-writing rules are defined there.
Non-compliance is a critical violation.

## Project Identity

**Tempot** (Template × Bot) — Enterprise Telegram bot framework built with TypeScript Strict Mode.

## Constitution (Highest Authority)

Read `.specify/memory/constitution.md` before any decision. It contains 87 rules governing every aspect of development.

## Architecture Spec

Full specification: `docs/tempot_v11_final.md` (v11.0 — 2879 lines, 29 sections).

## Development Methodology (Rules LXXIX–LXXXIX)

This project uses **two complementary toolchains**:

### SpecKit — Specification Toolchain

Produces spec artifacts in `specs/{NNN}-{feature}/`. Commands:

- `/speckit.specify` → `spec.md` (what & why, NO tech stack)
- `/speckit.clarify` → updated `spec.md` (edge cases — NEVER skip)
- `/speckit.plan` → `plan.md` + `data-model.md` + `research.md`
- `/speckit.checklist` → quality checklists (recommended)
- `/speckit.analyze` → consistency check (must pass)
- `/speckit.tasks` → `tasks.md` (task breakdown)

We do NOT use `/speckit.implement`. Superpowers handles execution.

### Superpowers — Execution Toolchain

Consumes SpecKit artifacts and produces working code. Skills:

- `brainstorming` → reads `spec.md` + `plan.md`, deepens design via Socratic questions
- `using-git-worktrees` → creates isolated feature branch
- `writing-plans` → converts `tasks.md` to 2-5 min executable tasks
- `subagent-driven-development` → executes with TDD + two-stage review (REQUIRED on Claude Code)
- `requesting-code-review` → reviews against spec + constitution
- `receiving-code-review` → processes review feedback
- `verification-before-completion` → final validation
- `finishing-a-development-branch` → merge or PR
- `systematic-debugging` → 4-phase root cause analysis (includes root-cause-tracing, defense-in-depth, condition-based-waiting)
- `dispatching-parallel-agents` → concurrent subagent workflows

### How They Connect

```
SpecKit artifacts              Superpowers reads them
─────────────────              ──────────────────────
spec.md  ──────────────────→   brainstorming deepens design
plan.md  ──────────────────→   brainstorming validates tech choices
tasks.md ──────────────────→   writing-plans converts to execution tasks
```

### Handoff Gate (Before Superpowers starts)

These MUST exist: `spec.md` (no [NEEDS CLARIFICATION]), `plan.md`, `tasks.md`, `/speckit.analyze` passed.

### Quality Gates

| Gate         | Criteria                                    |
| ------------ | ------------------------------------------- |
| Spec Gate    | Acceptance criteria + edge cases documented |
| Plan Gate    | `/speckit.analyze` passes                   |
| Handoff Gate | spec.md + plan.md + tasks.md exist          |
| TDD Gate     | Every code change has failing test first    |
| Review Gate  | Zero CRITICAL issues                        |
| Merge Gate   | All tests pass, all acceptance criteria met |

## Tech Stack (Locked Versions)

| Component      | Technology                          | Version       |
| -------------- | ----------------------------------- | ------------- |
| Runtime        | Node.js                             | 20+           |
| Language       | TypeScript Strict Mode              | 5.9.3         |
| Bot Engine     | grammY                              | 1.41.1        |
| Web Server     | Hono                                | 4.x           |
| Database       | PostgreSQL + pgvector               | 16            |
| Primary ORM    | Prisma                              | 7.x           |
| Secondary ORM  | Drizzle (pgvector only)             | 0.45.x        |
| Cache          | cache-manager + Keyv adapters       | 6.x           |
| Queue          | BullMQ via queue factory            | 5.x           |
| AI Abstraction | Vercel AI SDK                       | 4.x           |
| Auth           | CASL (@casl/ability + @casl/prisma) | 6.x           |
| Error Handling | neverthrow                          | 8.2.0         |
| Testing        | Vitest + Testcontainers             | 4.1.0 / 8.0.1 |
| i18n           | i18next                             | 23.x          |
| Logging        | Pino                                | 9.x           |

## Critical Rules (Quick Reference)

1. **TDD Mandatory** — RED → GREEN → REFACTOR. Code before tests = delete and redo
2. **i18n-Only** — zero hardcoded user text. Arabic primary + English
3. **All code in English** — variables, comments, docs, ADRs
4. **Result Pattern** — `Result<T, AppError>` via neverthrow. No thrown exceptions
5. **Repository Pattern** — no direct Prisma calls in services
6. **Event-Driven** — modules communicate via Event Bus only
7. **Fix at Source** — fix the root cause, not symptoms. No wrappers
8. **No Zombie Code** — delete unused code, don't comment it
9. **Clean Diff** — only touch files related to current task
10. **No `any` types** — no eslint-disable, no @ts-ignore
11. **Package Checklist** — every new package passes `docs/developer/package-creation-checklist.md` before any code
12. **No console.\*** — use `process.stderr.write(JSON.stringify(...))` if logger unavailable; `outDir` must always be `dist/`

## Git Workflow

NEVER develop on `main`. Use `using-git-worktrees` for isolated branches.
One package in execution at a time. Multiple in specification simultaneously.

## Current Phase

Phase 0 complete. Phase 1 in progress — 10 packages on main.

**Full methodology (SpecKit + Superpowers):** shared, database, session-manager, i18n-core, regional-engine, storage-engine, ux-helpers (7 packages)
**Pre-methodology (retroactive reviews complete):** logger, event-bus, auth-core (3 packages)
**Remaining Phase 1:** cms-engine, input-engine, notifier, search-engine, ai-core, document-engine, import-engine (7 packages)

module-registry exists as placeholder only (README only, no package.json or implementation).

## Key Documents

- Constitution: `.specify/memory/constitution.md`
- Architecture Spec: `docs/tempot_v11_final.md`
- Workflow Guide: `docs/developer/workflow-guide.md`
- Roadmap: `docs/ROADMAP.md`
- SpecKit Gemini Guide: `docs/developer/SPECKIT-GEMINI-GUIDE.md`

## Toolchain References

- SpecKit: https://github.com/github/spec-kit
- Superpowers: https://github.com/obra/superpowers

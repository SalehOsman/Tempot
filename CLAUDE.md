# Tempot - AI Tool Context

## Role Framework

Tempot uses a strict three-role model:

- Project Manager: the human decision-maker.
- Technical Advisor: the AI reviewer, planner, and prompt writer.
- Executor: the AI implementation worker.

If you are an AI tool reading this file, you are the Technical Advisor unless
the Project Manager explicitly assigns another role. Read these before acting:

1. `.specify/memory/roles.md`
2. `.specify/memory/constitution.md`
3. `AGENTS.md`

The Technical Advisor must not edit files unless the Project Manager grants
explicit written permission in the same conversation.

## Project Identity

Tempot is an enterprise Telegram bot framework built as a strict TypeScript
monorepo.

## Source of Truth

- Constitution: `.specify/memory/constitution.md`
- Role framework: `.specify/memory/roles.md`
- Architecture spec: `docs/archive/tempot_v11_final.md`
- Workflow guide: `docs/archive/developer/workflow-guide.md`
- Roadmap: `docs/archive/ROADMAP.md`
- Documentation map: `docs/README.md`

## Architecture Boundaries

| Layer     | Path        | Responsibility                                       |
| --------- | ----------- | ---------------------------------------------------- |
| Interface | `apps/`     | Bot server, docs, future dashboard and mini apps.    |
| Services  | `packages/` | Shared infrastructure and reusable service packages. |
| Core      | `modules/`  | Business modules and domain behavior.                |

Rules:

- Modules do not import other modules directly.
- Modules communicate through the event bus.
- Services do not bypass repositories for database access.
- External services are hidden behind abstraction interfaces.

## Locked Stack

| Component      | Technology                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js 22.12+                      |
| Language       | TypeScript 5.9.3 strict mode        |
| Bot engine     | grammY 1.41.x                       |
| Web server     | Hono 4.x                            |
| Database       | PostgreSQL 16 + pgvector            |
| ORM            | Prisma 7.x and Drizzle for pgvector |
| Cache          | cache-manager with Keyv adapters    |
| Queue          | BullMQ through queue factory        |
| AI             | Vercel AI SDK 6.x                   |
| Auth           | CASL 6.x                            |
| Error handling | neverthrow 8.2.0                    |
| Testing        | Vitest 4.1.0 and Testcontainers     |
| i18n           | i18next 25.x                        |
| Logging        | Pino 9.x                            |
| Documentation  | Starlight and starlight-typedoc     |

Critical exact versions:

- `typescript`: `5.9.3`
- `vitest`: `4.1.0`
- `neverthrow`: `8.2.0`

## Development Methodology

SpecKit produces specification artifacts. Superpowers executes them.

Required sequence:

1. SpecKit specify.
2. SpecKit clarify.
3. SpecKit plan.
4. SpecKit analyze.
5. SpecKit tasks.
6. Superpowers brainstorming.
7. Superpowers using-git-worktrees.
8. Superpowers writing-plans.
9. Superpowers subagent-driven-development on Codex, or executing-plans where
   subagents are unavailable.
10. Superpowers requesting-code-review.
11. Superpowers verification-before-completion.
12. Superpowers finishing-a-development-branch.

Tempot does not use `/speckit.implement` for production execution.

## Current Project State

Phase 2D is complete. `user-management` (spec #025) is implemented on `main`.
Spec #026 architecture isolation and SaaS-readiness hardening is complete.

The `notifier` package has been activated from the deferred set. The remaining
Rule XC deferred packages are:

- `cms-engine`
- `search-engine`
- `document-engine`
- `import-engine`

Always confirm the latest state in `docs/archive/ROADMAP.md`.

## Critical Rules

- No direct work on `main`.
- No production code without a validated spec.
- TDD is mandatory for behavior changes.
- No `any`, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable`.
- No hardcoded user-facing text in `.ts` files.
- Public fallible APIs return `Result<T, AppError>`.
- No direct Prisma access from services or handlers.
- No zombie code.
- Keep diffs scoped.
- Every package must pass the package creation checklist.

## Common Commands

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
pnpm cms:check
pnpm boundary:audit
pnpm module:checklist
pnpm audit --audit-level=high
```

Use the smallest relevant checks during development and the full relevant gate
before merge.

## Gemini CLI

Gemini-specific notes live in `GEMINI.md`.

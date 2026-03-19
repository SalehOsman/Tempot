# Tempot — Gemini CLI Context

## Project Identity
**Tempot** (Template × Bot) — Enterprise Telegram bot framework built with TypeScript Strict Mode.

## Constitution
The project constitution is at `.specify/memory/constitution.md` (69 principles). It is the **highest authority** — reference it before any decision.

## Foundational Spec
Full architectural specification: `docs/tempot_v11_final.md` (v11.0 — 2879 lines, 29 sections).

## Tech Stack (Locked Versions)
| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 20+ |
| Language | TypeScript Strict Mode |
| Bot Engine | grammY 1.x |
| Web Server | Hono 4.x |
| Database | PostgreSQL + pgvector |
| Primary ORM | Prisma 7.x |
| Secondary ORM | Drizzle (pgvector only) |
| Cache | cache-manager + Keyv adapters |
| Queue | BullMQ via queue factory |
| AI Abstraction | Vercel AI SDK |
| Auth | CASL (@casl/ability + @casl/prisma) |
| Error Handling | neverthrow 8.2.0 |
| Testing | Vitest + Testcontainers |
| i18n | i18next |
| Logging | Pino |
| Versioning | Changesets + Conventional Commits |

## Architecture
Clean Architecture — 3 layers:
- `apps/` — Interfaces (bot-server, dashboard, mini-app, docs)
- `packages/` — Shared services (database, auth-core, logger, etc.)
- `modules/` — Independent business modules

## Mandatory Workflow
SpecKit (steps 1-5) + superpowers (steps 6-11). See `docs/developer/workflow-guide.md`.

## Critical Rules
1. **TDD Mandatory** — RED → GREEN → REFACTOR. No code before tests
2. **i18n-Only** — zero hardcoded user text. Arabic primary + English
3. **All code in English** — variables, comments, docs, ADRs
4. **Result Pattern** — `Result<T, AppError>` via neverthrow. No thrown exceptions
5. **Repository Pattern** — no direct Prisma calls in services
6. **Event-Driven** — modules communicate via Event Bus only
7. **Fix at Source** — fix the bug, don't wrap it. No "code to fix code"
8. **No Zombie Code** — delete unused code, don't comment it
9. **Clean Diff** — only touch files related to the current task

## Current Phase
Project Setup — creating foundational files and initial commit.

## Key Documents
- Constitution: `.specify/memory/constitution.md`
- Spec: `docs/tempot_v11_final.md`
- Workflow Guide: `docs/developer/workflow-guide.md`

# Tempot — Gemini CLI Context

## Project Identity
**Tempot** (Template × Bot) — Enterprise Telegram bot framework built with TypeScript Strict Mode.

## Constitution
The project constitution is at `.specify/memory/constitution.md` (69 principles). It is the **highest authority** — reference it before any decision.

## Foundational Spec
Full architectural specification: `docs/tempot_v11_final.md` (v11.0 — 2879 lines, 29 sections).

## Tech Stack (Locked Versions)
| Component | Technology | Version |
|-----------|-----------|--------|
| Runtime | Node.js | 20+ |
| Language | TypeScript Strict Mode | 5.9.3 |
| Bot Engine | grammY | 1.41.1 |
| Web Server | Hono | 4.x |
| Database | PostgreSQL + pgvector | 16 |
| Primary ORM | Prisma | 7.x |
| Secondary ORM | Drizzle (pgvector only) | 0.45.x |
| Cache | cache-manager + Keyv adapters | 6.x |
| Queue | BullMQ via queue factory | 5.x |
| AI Abstraction | Vercel AI SDK | 4.x |
| Auth | CASL (@casl/ability + @casl/prisma) | 6.x |
| Error Handling | neverthrow | 8.2.0 |
| Testing | Vitest + Vite + Testcontainers | 4.1.0 / 8.0.1 |
| i18n | i18next | 23.x |
| Logging | Pino | 9.x |
| Dev Runner | tsx | 4.21.0 |
| Linter | ESLint | 10.0.3 |
| Formatter | Prettier | 3.8.1 |
| Git Hooks | Husky | 9.1.7 |
| Versioning | Changesets + Conventional Commits | 2.x |

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
Phase 0 complete. Minimal bot-server running (`apps/bot-server`).
Next: Phase 1 — Core Bedrock packages (logger → shared → database).

## Key Documents
- Constitution: `.specify/memory/constitution.md`
- Spec: `docs/tempot_v11_final.md`
- Workflow Guide: `docs/developer/workflow-guide.md`

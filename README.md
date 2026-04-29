# Tempot

Tempot is an enterprise Telegram bot framework built as a strict TypeScript
monorepo. It provides the infrastructure needed to build production-grade bot
systems while keeping business modules isolated and replaceable.

## What Tempot Provides

- Telegram bot runtime with grammY and Hono.
- PostgreSQL, Prisma, Drizzle, and pgvector foundations.
- Redis-backed sessions, cache, event bus, and queue integration.
- CASL authorization, audit logging, and security-by-default conventions.
- Arabic-first i18n with English support.
- AI provider abstraction through Vercel AI SDK 6.x.
- SpecKit plus Superpowers delivery methodology.
- Starlight documentation app under `apps/docs`.

## Current Status

Tempot Core is active. The first business module, `user-management`, is
implemented on `main`. Architecture isolation and SaaS-readiness hardening have
also been completed. `notifier` is the currently activated deferred package;
`cms-engine`, `search-engine`, `document-engine`, and `import-engine` remain
deferred until the roadmap records an activation decision.

Use [docs/archive/ROADMAP.md](docs/archive/ROADMAP.md) as the single source of
truth for project status.

## Requirements

- Node.js 22.12 or newer.
- pnpm 10 or newer.
- Docker for PostgreSQL, pgvector, and Redis integration tests.

## Quick Start

```bash
git clone https://github.com/SalehOsman/Tempot.git
cd Tempot
pnpm install
cp .env.example .env
pnpm docker:dev
pnpm --filter @tempot/database db:generate
pnpm --filter @tempot/database db:migrate --name init
pnpm dev
```

Set the required environment values in `.env` before starting the bot:

- `BOT_TOKEN`
- `DATABASE_URL`
- `REDIS_URL`
- `SUPER_ADMIN_IDS`

AI is enabled by default through `TEMPOT_AI=true`. Provider switching uses
`TEMPOT_AI_PROVIDER=gemini|openai`.

## Repository Map

| Path               | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `apps/`            | Interface applications such as `bot-server` and `docs`.        |
| `packages/`        | Shared infrastructure and service packages.                    |
| `modules/`         | Business modules.                                              |
| `specs/`           | SpecKit artifacts for features, packages, apps, and modules.   |
| `docs/`            | Product, development, architecture, and archive documentation. |
| `.agents/skills/`  | Project-specific agent skills.                                 |
| `.specify/memory/` | Constitution and role framework.                               |

## Architecture

Tempot follows three layers:

```text
apps/      -> interfaces: bot server, docs, future dashboard and mini apps
packages/  -> reusable services: database, event bus, AI, storage, i18n, etc.
modules/   -> business capabilities with handlers, services, repositories, tests
```

Rules that must not be bypassed:

- Modules do not import other modules directly.
- Modules communicate through the event bus.
- Services do not bypass repositories for database access.
- Fallible public APIs return `Result<T, AppError>`.
- User-facing text comes from i18n keys.

## Documentation

Start here:

- [Documentation Map](docs/README.md)
- [Development Guide](docs/development/README.md)
- [Workflow Guide](docs/archive/developer/workflow-guide.md)
- [Roadmap](docs/archive/ROADMAP.md)
- [Architecture Spec](docs/archive/tempot_v11_final.md)
- [ADR Index](docs/archive/architecture/adr/README.md)

## Quality Gates

Use the smallest relevant check while developing and the full gate before merge:

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
pnpm cms:check
pnpm audit --audit-level=high
```

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and
[docs/archive/developer/workflow-guide.md](docs/archive/developer/workflow-guide.md)
before starting. Every production change follows SpecKit plus Superpowers and
must respect the project constitution.

## License

MIT. See [LICENSE](LICENSE).

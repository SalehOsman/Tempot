# Tempot

Tempot is a production-oriented TypeScript template for building modular
Telegram bots. It combines a grammY bot runtime, Hono HTTP server,
PostgreSQL/Prisma data access, Redis-backed infrastructure, Docker-based local
services, role-aware modules, and AI-ready service boundaries in one reusable
monorepo.

Use Tempot when you want to start a new bot from a structured foundation instead
of wiring authentication, persistence, localization, module loading, and
deployment basics from scratch.

## What You Get

- Telegram bot runtime built with grammY.
- Hono server for webhooks and health endpoints.
- PostgreSQL 16, Prisma, Drizzle, and pgvector foundations.
- Redis-ready sessions, queues, cache, and event-driven module communication.
- Modular business features under `modules/`.
- Reusable infrastructure packages under `packages/`.
- Arabic and English localization support.
- AI-provider abstraction ready for OpenAI, Gemini, or local providers.
- Docker Compose setup for local development.
- Tempot CLI helpers for initialization, diagnostics, and module scaffolding.

## Requirements

- Node.js 22.12 or newer.
- Corepack with the pnpm version pinned in `package.json`.
- Docker Desktop or a compatible Docker runtime.
- A Telegram bot token from BotFather.

## Quick Start

```bash
git clone https://github.com/SalehOsman/Tempot.git
cd Tempot
pnpm install
cp .env.example .env
pnpm docker:dev
pnpm dev
```

Update `.env` before connecting to Telegram:

```env
BOT_TOKEN=your-telegram-bot-token
DATABASE_URL=postgresql://tempot:tempot@localhost:5432/tempot
REDIS_URL=redis://localhost:6379
SUPER_ADMIN_IDS=123456789
```

The exact environment list is documented in `.env.example`.

## Common Commands

```bash
pnpm dev              # Start the bot server in development mode
pnpm dev:bot          # Build runtime packages, then run the bot watcher
pnpm build            # Build all workspace packages and apps
pnpm lint             # Run static analysis
pnpm template:audit   # Verify that private development files are excluded
pnpm docker:dev       # Start local services with Docker Compose
pnpm docker:down      # Stop local services
pnpm tempot doctor    # Run project diagnostics
pnpm tempot init      # Create local starter files when needed
```

## Project Structure

```text
apps/
  bot-server/      Telegram bot and HTTP runtime
  docs/            Optional documentation site

packages/
  */               Reusable infrastructure packages

modules/
  */               Business modules and bot capabilities

scripts/tempot/
  */               Public Tempot CLI helpers

docs/
  product/         Product and user-facing documentation
  guides/          Usage guides
  operations/      Deployment and operations notes
  security/        Security guidance
  troubleshooting/ Troubleshooting notes
```

Internal development artifacts, AI-agent files, historical analysis, SpecKit
artifacts, test suites, local stores, and generated files are intentionally
excluded from the public template through `.gitignore`.

## Creating a Bot

1. Clone or generate a new repository from this template.
2. Copy `.env.example` to `.env`.
3. Set `BOT_TOKEN`, database, Redis, and super-admin values.
4. Start local services with `pnpm docker:dev`.
5. Run the bot with `pnpm dev`.
6. Add or customize modules under `modules/`.
7. Run `pnpm build` before deployment.

## Creating a Module

Use the Tempot CLI as the public entry point:

```bash
pnpm tempot module:generate
pnpm tempot module:doctor
```

Each module should keep handlers, services, repositories, localization, and
module metadata together under its own directory.

## Docker

Start the local stack:

```bash
pnpm docker:dev
```

Stop it:

```bash
pnpm docker:down
```

For webhook development, use `docker-compose.webhook.yml` together with the
required `WEBHOOK_URL` and Telegram webhook commands provided by `bot-server`.

## Upgrade Strategy

Bots created from Tempot should keep custom business logic inside dedicated
modules and avoid editing shared packages unless necessary. When a new Tempot
version is released, compare changes in `apps/`, `packages/`, shared module
contracts, and `.env.example`, then merge selectively into the bot repository.

Recommended upgrade workflow:

1. Create a backup branch in your bot repository.
2. Review the new Tempot release notes.
3. Merge infrastructure changes first.
4. Run `pnpm install`, `pnpm build`, and `pnpm lint`.
5. Test critical bot flows in a staging Telegram bot.
6. Deploy only after environment variables and database migrations are verified.

## Public Repository Hygiene

Before publishing a new repository, run:

```bash
pnpm template:audit
```

For a newly initialized Git repository, the audit should be run in strict mode:

```bash
TEMPOT_TEMPLATE_AUDIT_STRICT=1 pnpm template:audit
```

The audit blocks private development folders, AI-agent state, historical
analysis, internal specifications, tests, generated outputs, local stores, and
secrets from being committed to the public template.

## License

MIT. See `LICENSE`.

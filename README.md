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
DATABASE_URL=postgresql://tempot:tempot_password@localhost:5432/tempot_db
REDIS_URL=redis://localhost:6379
SUPER_ADMIN_IDS=123456789
```

The exact environment list is documented in `.env.example`.

Tempot also includes a default Docker project identity:

```env
COMPOSE_PROJECT_NAME=tempot
BOT_HTTP_HOST_PORT=3000
POSTGRES_HOST_PORT=5432
RESTORE_POSTGRES_HOST_PORT=5433
```

If you create more than one bot from this template on the same Docker host,
change `COMPOSE_PROJECT_NAME` and any conflicting host ports before running
`pnpm docker:dev`.

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
3. Keep the default `COMPOSE_PROJECT_NAME=tempot`, or set a unique project name
   such as `my-customer-bot` before the first Docker start.
4. Set `BOT_TOKEN`, database, Redis, and super-admin values.
5. Start local services with `pnpm docker:dev`.
6. Run the bot with `pnpm dev`.
7. Add or customize modules under `modules/`.
8. Run `pnpm build` before deployment.

The Telegram display name and username are configured in BotFather. The Docker
project name is only the local infrastructure identity used for containers,
networks, volumes, and default image tags.

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

Run multiple bot instances on the same host by giving each checkout its own
identity and free host ports:

```env
COMPOSE_PROJECT_NAME=my-customer-bot
BOT_HTTP_HOST_PORT=3001
POSTGRES_HOST_PORT=5434
RESTORE_POSTGRES_HOST_PORT=5435
```

Docker Compose uses `COMPOSE_PROJECT_NAME` to isolate the local containers,
networks, and volumes for each bot checkout.

Stop it:

```bash
pnpm docker:down
```

For webhook development, use `docker-compose.webhook.yml` together with the
required `WEBHOOK_URL` and Telegram webhook commands provided by `bot-server`.

Detailed instance naming guidance is documented in
`docs/product/en/guides/bot-template-instance-identity.md`.

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

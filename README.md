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
implemented on `main`, and Phase 3 is in progress. Architecture isolation,
SaaS-readiness hardening, module tooling, and the documentation platform
restructure are complete. All packages formerly deferred under Rule XC are now
active; no package remains deferred.

Spec #058 adds the local bot access-mode and membership gate implementation.
The bot defaults to private mode, where unknown visitors can only use bootstrap
membership actions until an administrator approves them. Public mode allows
unknown visitors to use public navigation entries while still requiring
membership approval for protected capabilities.

Use [docs/ROADMAP.md](docs/ROADMAP.md) as the single source of
truth for project status.

## Requirements

- Node.js 22.12 or newer.
- The pnpm version pinned by the root `packageManager` field through Corepack.
- Docker for PostgreSQL, pgvector, and Redis integration tests.

## Quick Start

```bash
git clone https://github.com/SalehOsman/Tempot.git
cd Tempot
pnpm install
cp .env.example .env
pnpm docker:dev
```

`pnpm docker:dev` starts the local bot, PostgreSQL, and Redis stack through
Docker Compose. The bot container applies pending Prisma migrations before the
runtime starts.

### Local Docker Webhook Runtime

Use this workflow when you want Docker to run the code from the current local
checkout instead of a published GHCR image. The webhook override builds the
`bot-server` image locally and tags it as `tempot-bot-server:local`.

```powershell
pnpm build:bot-runtime
docker compose -f docker-compose.yml -f docker-compose.webhook.yml -p tempot up -d --build bot-server
docker compose -f docker-compose.yml -f docker-compose.webhook.yml -p tempot ps
docker logs -f tempot-bot
```

`docker-compose.webhook.yml` also runs `cloudflared` against the Compose
service URL `http://bot-server:3000`. Quick Tunnel URLs are temporary; when the
URL changes, update `WEBHOOK_URL` in `.env` and register the Telegram webhook
again before testing Telegram delivery.

Set the required environment values in `.env` before starting the stack:

- `BOT_TOKEN`
- `DATABASE_URL`
- `REDIS_URL`
- `SUPER_ADMIN_IDS`
- `PROTECTED_DATA_ACTIVE_ENCRYPTION_KEY_VERSION`
- `PROTECTED_DATA_ENCRYPTION_KEYS`
- `PROTECTED_DATA_ACTIVE_LOOKUP_KEY_VERSION`
- `PROTECTED_DATA_LOOKUP_KEYS`

AI is enabled by default through `TEMPOT_AI=true`. Provider switching uses
`TEMPOT_AI_PROVIDER=gemini|openai`.

## Bot Access Mode

The `bot_access_mode` setting controls the local Telegram access boundary:

- `private`: the default. Unknown and pending visitors can use `/start`,
  `/join`, and the membership request callback only. Protected commands and
  callbacks are denied and audited.
- `public`: unknown visitors can use capabilities explicitly classified as
  public. Protected and administrative capabilities still require an approved
  user profile and matching CASL abilities.

Membership requests are handled by `membership-management`. Approved requests
create or activate the corresponding `user-management` profile, after which
`/start` renders the normal role-filtered module menu.

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
- [Workflow Guide](docs/developer/workflow-guide.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture Spec](docs/architecture/tempot_architecture.md)
- [ADR Index](docs/architecture/adr/README.md)

## Quality Gates

Use the smallest relevant check while developing and the full gate before merge:

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:coverage
pnpm docs:check
pnpm spec:validate
pnpm cms:check
pnpm audit --audit-level=high
```

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and
[docs/developer/workflow-guide.md](docs/developer/workflow-guide.md)
before starting. Every production change follows SpecKit plus Superpowers and
must respect the project constitution.

## License

MIT. See [LICENSE](LICENSE).

# Tempot — Commands Reference

This document serves as the central reference for all CLI commands and Telegram Bot commands used in the Tempot project.

## 1. Development & Infrastructure Commands

Run these commands from the root of the monorepo.

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Starts the bot in development mode using long-polling. |
| `pnpm dev:tunnel` | Starts the bot with a Cloudflare tunnel for local webhook testing. |
| `pnpm docker:dev` | Starts the local infrastructure (PostgreSQL + Redis) via Docker. |
| `pnpm docker:down` | Stops the local infrastructure containers. |
| `pnpm docker:logs` | Follows the logs of the running Docker containers. |
| `pnpm docker:reset` | **WARNING:** Destroys all containers and volumes, then restarts them (Data loss). |

## 2. Database Commands

Run these commands from the root, targeting the database package.

| Command | Purpose |
|---------|---------|
| `pnpm --filter @tempot/database db:merge` | Merges all distributed `*.prisma` files from modules into the central schema. |
| `pnpm --filter @tempot/database db:generate` | Merges schemas and generates the Prisma Client. |
| `pnpm --filter @tempot/database db:migrate` | Applies pending database migrations to the local database. |
| `pnpm --filter @tempot/database db:studio` | Opens Prisma Studio on `localhost:51212` to manage data visually. |
| `pnpm --filter @tempot/database db:reset` | **WARNING:** Drops the database, recreates it, and runs seeders (Dev only). |

## 3. Workflow & Quality Commands

| Command | Purpose |
|---------|---------|
| `pnpm build` | Builds all packages in the correct dependency order. |
| `pnpm test` | Runs all Vitest suites across the monorepo. |
| `pnpm lint` | Runs ESLint on all TypeScript files. |
| `pnpm format` | Runs Prettier to format code. |
| `pnpm spec:validate` | Validates that source code aligns with SpecKit artifacts (Reconciliation Gate). |
| `pnpm changeset` | Creates a new changeset for version control before a release. |
| `pnpm cms:check` | Verifies that all `i18n` translation files are complete across modules. |

## 4. Telegram Bot Commands

These are the standard commands recognized by the Tempot bot engine. All commands are handled by the appropriate business modules.

| Command | Module / Purpose |
|---------|------------------|
| `/start` | Initializes the user session, sets default language, and shows the main menu. |
| `/settings` | Opens the settings menu (language, timezone, etc.). Handled by `settings` package. |
| `/help` | Displays available commands based on the user's RBAC permissions. |
| `/cancel` | Cancels any active conversation, input form, or ongoing AI process. |
| `/admin` | Opens the Dashboard/Admin panel link (Restricted to ADMIN / SUPER_ADMIN). |

> **Note on Bot Commands:** Tempot is an extensible framework. Additional commands are dynamically registered by individual business modules using the `module-registry`. The commands listed above are the foundational commands guaranteed by the core system.

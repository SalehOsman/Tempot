# Local Setup & Developer Onboarding Playbook

> **Target Platform:** Node.js 22/24 LTS, pnpm 10.5.2, Docker Engine 26+  
> **Toolchain:** Turborepo 2.4.4, Biome 1.9.4, Vitest

---

## 1. System Requirements

Before developing on the Tembot-v2 Platform, ensure your local machine satisfies:

| Tool | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 22.0.0 LTS` | `22.14.0 LTS` | `node -v` |
| **pnpm** | `>= 10.0.0` | `10.5.2` | `pnpm -v` |
| **Docker** | `>= 26.0.0` | `27.1.1` | `docker -v` |
| **Git** | `>= 2.40.0` | `2.46.0` | `git --version` |

---

## 2. First-Time Setup (From Zero to Running)

Follow these 5 steps to start development:

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Start containerized infrastructure (PostgreSQL, Redis, MinIO)
docker compose up -d

# 3. Apply Drizzle database migrations
pnpm db:migrate

# 4. Start all services in parallel (Hono API, grammY Bot, Vite frontends)
pnpm dev
```

---

## 3. Daily Developer Commands Cheatsheet

| Task / Lifecycle | Command | Description |
| :--- | :--- | :--- |
| **Development Server** | `pnpm dev` | Starts Hono API, Bot polling, and Vite frontends in watch mode |
| **Production Build** | `pnpm build` | Compiles TypeScript across all workspace apps and packages |
| **Code Formatting** | `pnpm format:biome` | Automatically formats TypeScript, JSON, and CSS files |
| **Linter & Code Quality**| `pnpm check:biome` | Checks formatting and static analysis rules |
| **Type Checking** | `pnpm typecheck` | Executes `tsc --noEmit` across all workspace projects |
| **Unit Testing** | `pnpm test` | Runs fast in-memory unit tests via Vitest |
| **Integration Testing** | `pnpm test:integration` | Runs containerized tests against real Postgres and Redis |
| **Scaffold Module** | `pnpm module:create` | Interactively generates a new domain module |
| **Scaffold Slice** | `pnpm slice:create` | Interactively generates a new vertical slice |
| **Database Migrations** | `pnpm db:generate` | Compiles TypeScript schema changes into SQL migrations |
| **Database Explorer** | `pnpm db:studio` | Launches Drizzle Studio visual web database browser |

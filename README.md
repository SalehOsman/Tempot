<div align="center">

# 🤖 Tempot

**Enterprise-Grade, Modular Telegram Bot Framework & Production Template**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9_Strict-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.12+-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.33.3-orange?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![grammY](https://img.shields.io/badge/grammY-1.41+-blueviolet?logo=telegram&logoColor=white)](https://grammy.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_+_pgvector-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Getting Started](#-quick-start) • [Architecture](#-architecture) • [Pre-built Modules](#-built-in-modules) • [CLI Tooling](#-tempot-cli) • [Documentation](#-documentation--governance)

</div>

---

## 🌟 Overview

**Tempot** (Template × Bot) is a battle-tested, enterprise-ready TypeScript framework designed for building scalable, multi-tenant Telegram bots. Built on top of **grammY** and **Hono**, it provides a rock-solid foundation with strict type safety, modular architecture, Redis-backed queues/sessions, PostgreSQL with pgvector AI memory, and native Arabic/English bilingual support with RTL and localized formatting.

Use Tempot to bootstrap your bots instantly with production-grade authentication, RBAC permissions, audit logging, backup management, and event-driven module isolation out-of-the-box.

---

## ✨ Key Capabilities

- ⚡ **High-Performance Runtime:** grammY 1.41+ with Hono 4.x HTTP server for high-throughput webhooks, health checks, and metrics.
- 🧩 **Modular Architecture:** Self-contained business modules communicating strictly via a typed Event Bus.
- 🛡️ **Enterprise Security & RBAC:** CASL-based declarative authorization, non-root Docker execution, and soft-delete database lifecycle.
- 🗄️ **Multi-Model Data Layer:** Prisma 7 + Drizzle ORM for PostgreSQL 16 with native `pgvector` embedding storage.
- 🧠 **AI-Ready Engine:** Multi-provider abstraction powered by Vercel AI SDK (OpenAI, Gemini, Claude, Local Ollama).
- 🌐 **Native Bilingual I18n:** Built-in Arabic (primary) & English translation keys with Arabic-Indic numeral formatting, timezone conversions, and RTL support.
- 🔄 **Multi-Instance Docker Isolation:** Run dozens of bot instances on the same host with automated project naming and port isolation.
- 🛠️ **Developer-First CLI:** Diagnostic tools (`pnpm tempot doctor`), instant module generators, and template validation.

---

## 🏛️ Architecture

```mermaid
graph TD
    subgraph "Entry Layer"
        TG[Telegram API / Webhook] --> BS[apps/bot-server<br>grammY + Hono]
    end

    subgraph "Core Packages (packages/*)"
        BS --> DB["@tempot/database<br>(PostgreSQL + pgvector)"]
        BS --> EVT["@tempot/event-bus<br>(Typed Pub/Sub)"]
        BS --> AUTH["@tempot/auth-core<br>(CASL RBAC)"]
        BS --> I18N["@tempot/i18n-core & regional<br>(AR / EN Localization)"]
        BS --> AI["@tempot/ai-core<br>(Vercel AI SDK)"]
        BS --> LOG["@tempot/logger & sentry<br>(Pino + Error Tracking)"]
    end

    subgraph "Business Modules (modules/*)"
        EVT <--> UM[user-management]
        EVT <--> CM[content-management]
        EVT <--> BM[backup-management]
        EVT <--> HC[help-center]
        EVT <--> KM[knowledge-management]
    end
```

---

## 📦 Built-in Modules

Tempot includes 11 production-ready, fully tested modules located in `modules/`:

| Module | Description | Core Features |
|---|---|---|
| 👤 **`user-management`** | User profiles & Administration | Onboarding, RBAC roles, profile management, banning |
| 🛡️ **`audit-viewer`** | Audit Trail & Compliance | Log inspection, security events, operator actions |
| 💾 **`backup-management`** | Automated Data Backups | Database dump/restore, S3 export, scheduled backups |
| 🤖 **`bot-management`** | Bot Instance Governance | Multi-instance controls, rate limits, status tracking |
| 📝 **`content-management`** | Dynamic Bot Content & CMS | Text management, media broadcasts, interactive FAQs |
| ❓ **`help-center`** | Interactive Support & Help | Guided menus, command discovery, ticketing |
| 🧠 **`knowledge-management`** | RAG & Vector Knowledgebase | Document indexing, semantic search, AI answering |
| 💳 **`membership-management`** | Subscriptions & Access | VIP tiers, expiration tracking, access gates |
| 🔔 **`notification-center`** | Targeted Broadcasting | Scheduled notifications, batch messaging, alerts |
| ⚙️ **`settings-management`** | Runtime Bot Settings | Dynamic configuration, feature flags, preferences |
| 📋 **`template-management`** | Blueprint Scaffold Engine | Modular generation, validation, and diagnostics |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** `22.12` or newer
- **pnpm** `10.33.3` (enforced via Corepack: `corepack enable`)
- **Docker Desktop** / Docker Compose V2
- A Telegram bot token from [@BotFather](https://t.me/botfather)

### 2. Clone & Install
```bash
git clone https://github.com/SalehOsman/Tempot.git
cd Tempot
pnpm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` with your core credentials:
```env
BOT_TOKEN=your-telegram-bot-token
DATABASE_URL=postgresql://tempot:tempot_password@localhost:5432/tempot_db
REDIS_URL=redis://localhost:6379
SUPER_ADMIN_IDS=123456789
```

### 4. Start Infrastructure & Run
```bash
# 1. Start PostgreSQL & Redis services
pnpm docker:dev

# 2. Apply database schemas
pnpm --filter @tempot/database db:generate
pnpm --filter @tempot/database db:migrate

# 3. Start bot in development mode
pnpm dev
```

---

## 🛠️ Tempot CLI

Tempot provides a built-in CLI for developer diagnostics and code generation:

```bash
# Run system & environment health check
pnpm tempot doctor

# Create a new business module from blueprint
pnpm tempot module create my-custom-feature

# Validate an existing module's structure and contracts
pnpm tempot module doctor my-custom-feature
```

---

## 💻 Common Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start the bot server in live development mode |
| `pnpm dev:bot` | Compile runtime packages and start the hot-reload watcher |
| `pnpm build` | Build all workspace packages and production artifacts |
| `pnpm lint` | Run ESLint across all apps, packages, and modules |
| `pnpm format` | Format entire repository with Prettier |
| `pnpm check` | Run complete quality gate: template audit + lint + build |
| `pnpm docker:dev` | Start local development containers in background |
| `pnpm docker:logs` | Tail real-time logs from all running Docker services |
| `pnpm docker:down` | Stop and teardown local Docker containers |
| `pnpm --filter docs dev` | Launch the Astro/Starlight documentation website locally |

---

## 🐳 Multi-Bot Docker Isolation

Deploy multiple bots on a single VPS or development machine without container or port conflicts by setting unique identities in `.env`:

```env
COMPOSE_PROJECT_NAME=customer-support-bot
BOT_HTTP_HOST_PORT=3001
POSTGRES_HOST_PORT=5434
RESTORE_POSTGRES_HOST_PORT=5435
```

---

## 📖 Documentation & Governance

- **Documentation Website:** Authored under `docs/product/`, rendered via Astro at `apps/docs/`. Run locally via `pnpm --filter docs dev`.
- **Public Template Scope:** See [`docs/product/enterprise/public-template-scope.md`](docs/product/enterprise/public-template-scope.md).
- **Pre-launch Checklist:** See [`docs/product/enterprise/pre-launch-checklist.md`](docs/product/enterprise/pre-launch-checklist.md).
- **Upgrade Guide:** See [`docs/product/upgrades/template-upgrade-guide.md`](docs/product/upgrades/template-upgrade-guide.md).

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

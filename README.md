<div align="center">

<img src="docs/Tempot_Logo.png" alt="Tempot Logo" width="420">

<br><br>

### *Template × Bot*

**The Enterprise-Grade, Spec-Driven Telegram Bot Framework**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![grammY](https://img.shields.io/badge/grammY-1.x-009DC4?logo=telegram&logoColor=white)](https://grammy.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Constitution](https://img.shields.io/badge/Constitution-v1.0.0_(69_principles)-green.svg)](.specify/memory/constitution.md)
[![Spec](https://img.shields.io/badge/Architecture_Spec-v11.0-orange.svg)](docs/tempot_v11_final.md)

---

**Built with precision and spec-driven rigor.**
**All infrastructure included — focus solely on your business logic.**

[Why Tempot?](#-why-tempot) •
[Overview](#-project-overview) •
[Tech Stack](#-full-tech-stack) •
[Architecture](#-architecture) •
[ADRs](#-architectural-decision-records-adrs) •
[Methodology](#-development-methodology) •
[Getting Started](#-getting-started) •
[Contributing](#-contribution-guidelines) •
[License](#-license)

</div>

---

> **Note on Versioning:** The "v11" designation in `tempot_v11_final.md` refers to the **11th iteration of the Architecture Specification Document**, not the software release version. The Tempot framework software is currently in the `v0.x.x` pre-release phase.

---

## 🤔 Why Tempot?

**Tempot** is a portmanteau of **Template × Bot**.

The philosophy behind Tempot is simple: **Stop reinventing the wheel for every Telegram bot project.**

Historically, developing complex, production-ready bots required rewriting authorization middleware, session management logic, caching layers, and deployment pipelines from scratch for every new client or service. Tempot solves this by providing a mature, enterprise-grade template out of the box.

It abstracts away the tedious infrastructure — giving you a plug-and-play architecture for RBAC, multi-language support, robust queues, and AI abstraction — so you can focus **100% of your effort** on building unique business logic and exceptional user experiences.

> 🎯 **Core Principle:** *"Don't reinvent the wheel."* — If an open-source library exists with 500+ stars, is actively maintained, and TypeScript-compatible — we use it instead of building from scratch.

---

## 📖 Project Overview

Tempot is a comprehensive, enterprise-grade framework designed for building professional, highly scalable Telegram bots. By providing robust, battle-tested infrastructure out of the box — ranging from CASL-based authorization and multi-tier caching to AI abstractions and dynamic input engines — Tempot allows developers to focus exclusively on business logic.

Tempot enforces a **Security-by-Default**, **Privacy-by-Design**, and **Spec-Driven Development** philosophy, ensuring that every feature is meticulously planned, documented, and resilient before a single line of code is written.

### ✨ Core Capabilities

<table>
<tr>
<td width="50%">

- 🛡️ **CASL-Based RBAC** — 4-tier role system (`Guest → User → Admin → Super Admin`) with scoped resource authorization integrated directly into the Data Access Layer

- 🧠 **AI Provider Abstraction** — Seamless integration via Vercel AI SDK. Includes fallback queues, graceful degradation, and circuit breakers

- 📊 **Dual ORM Architecture** — Prisma 7.x for relational data and strict type safety, paired with Drizzle ORM for high-performance `pgvector` semantic searches

</td>
<td width="50%">

- 📝 **Dynamic Input Engine** — Zod-powered, grammY-conversations-backed engine with 22 built-in field types, handling state, retries, and timeouts automatically

- 🌍 **Regional & CMS Engines** — Built-in timezone, currency, and multi-language support (i18next). Dynamic translation updating via centralized cache

- 🚦 **Robust Event Bus** — 3-tier event architecture: Local EventEmitter for in-process, Internal for cross-module, External via Redis Pub/Sub for durable jobs

</td>
</tr>
</table>

---

## 🛠️ Full Tech Stack

> Tempot strictly adheres to the principle of *"Not Reinventing the Wheel."* Every package is carefully chosen, vetted for ecosystem longevity, and documented via an [Architectural Decision Record (ADR)](#-architectural-decision-records-adrs).

<table>
<tr><th>Category</th><th>Technology</th><th>Version</th><th>Purpose</th></tr>
<tr><td><b>Runtime</b></td><td>Node.js</td><td><code>v20+</code></td><td>ESM, native TypeScript support</td></tr>
<tr><td><b>Language</b></td><td>TypeScript</td><td><code>5.x</code> Strict</td><td>Full type safety, no <code>any</code></td></tr>
<tr><td><b>Bot Engine</b></td><td>grammY</td><td><code>v1.x</code></td><td>Modern, flexible, TypeScript-first</td></tr>
<tr><td><b>Web Server</b></td><td>Hono</td><td><code>v4.x</code></td><td>Fastest, lightweight, Edge-compatible</td></tr>
<tr><td><b>Database</b></td><td>PostgreSQL + pgvector</td><td><code>v16</code></td><td>Relational + vector search</td></tr>
<tr><td><b>Primary ORM</b></td><td>Prisma</td><td><code>7.x</code></td><td>Type safety, auto migrations, Soft Delete via <code>$extends()</code></td></tr>
<tr><td><b>Vector ORM</b></td><td>Drizzle ORM</td><td><code>0.45.x</code></td><td>Native <code>pgvector</code> support (ADR-017)</td></tr>
<tr><td><b>Cache</b></td><td>cache-manager + Keyv</td><td><code>v7.x</code></td><td>Multi-tier: Memory → Redis → DB</td></tr>
<tr><td><b>Queue</b></td><td>BullMQ</td><td><code>5.x</code></td><td>Reliable job processing via centralized factory</td></tr>
<tr><td><b>AI SDK</b></td><td>Vercel AI SDK</td><td><code>latest</code></td><td>Provider-agnostic abstraction</td></tr>
<tr><td><b>Authorization</b></td><td>CASL</td><td><code>@casl/ability 6.x</code></td><td>RBAC + ABAC + Prisma adapter (ADR-013)</td></tr>
<tr><td><b>Error Handling</b></td><td>neverthrow</td><td><code>8.2.0</code></td><td><code>Result&lt;T, E&gt;</code> — no thrown exceptions</td></tr>
<tr><td><b>Event Bus</b></td><td>Emittery + BullMQ</td><td><code>1.2.0</code></td><td>Local + durable cross-process events</td></tr>
<tr><td><b>Testing</b></td><td>Vitest + Testcontainers</td><td><code>latest</code></td><td>Fast unit + containerized integration</td></tr>
<tr><td><b>i18n</b></td><td>i18next</td><td><code>latest</code></td><td>Arabic (primary) + English</td></tr>
<tr><td><b>Logging</b></td><td>Pino</td><td><code>9.x</code></td><td>Fastest JSON logger for Node.js</td></tr>
<tr><td><b>Sanitization</b></td><td>sanitize-html</td><td><code>latest</code></td><td>XSS protection (ADR-020)</td></tr>
<tr><td><b>Rate Limiting</b></td><td>@grammyjs/ratelimiter</td><td><code>latest</code></td><td>Official grammY plugin</td></tr>
<tr><td><b>Frontend</b></td><td>Next.js + Tailwind CSS</td><td><code>latest</code></td><td>Dashboard + Mini App</td></tr>
<tr><td><b>Documentation</b></td><td>Docusaurus</td><td><code>3.x</code></td><td>Developer + end-user docs</td></tr>
<tr><td><b>Versioning</b></td><td>Changesets</td><td><code>latest</code></td><td>Automated semantic releases</td></tr>
</table>

---

## 🏛️ Architecture

Tempot follows a **Clean, 3-Tier Architecture** implemented inside a **pnpm Monorepo**:

1. **Core Layer** (`/modules`) — Contains isolated business logic. Modules communicate with each other exclusively via the centralized Event Bus
2. **Service Layer** (`/packages`) — Centralized infrastructure packages (session-manager, ai-core, storage-engine, notifier, event-bus). These act as abstractions over external APIs
3. **Interface Layer** (`/apps`) — The interaction boundaries. Contains the bot-server (grammY + Hono), dashboard (Next.js), and mini-app

```
┌─────────────────────────────────────────────────────────┐
│                   INTERFACE LAYER (apps/)                │
│      bot-server  ·  dashboard  ·  mini-app  ·  docs     │
├─────────────────────────────────────────────────────────┤
│                   SERVICE LAYER (packages/)              │
│    database · auth-core · logger · cache · queue ·      │
│    event-bus · ai-core · storage · settings · i18n      │
├─────────────────────────────────────────────────────────┤
│                   CORE LAYER (modules/)                  │
│          Independent business modules                    │
│     Each with: handler · service · repository · tests   │
└─────────────────────────────────────────────────────────┘
```

### The 5 Architectural Mandates

> ⚠️ These mandates are non-negotiable — any code violating them is rejected in Code Review.

1. **External Abstraction** — External services (AI, Storage, Payments) must be wrapped behind an interface
2. **Unified Cache** — No custom caches. Everything passes through the `cache-manager` wrapper
3. **Centralized Queue Factory** — No raw BullMQ setup. All queues use the centralized factory for graceful shutdowns
4. **Event-Driven** — Cross-module communication is strictly decoupled via `module.entity.action` events
5. **Graceful Degradation** — All external dependencies (especially AI) must define a degradation fallback state

### 📂 Folder Structure

```
tempot/
├── apps/
│   ├── bot-server/              # Main Telegram Bot & Hono API entrypoint
│   ├── dashboard/               # Next.js Control Panel (Plugin architecture)
│   ├── mini-app/                # Telegram Mini App frontend
│   └── docs/                    # Docusaurus engineering documentation
├── packages/
│   ├── ai-core/                 # Vercel AI SDK abstraction & pgvector logic
│   ├── auth-core/               # CASL abilities and authorization
│   ├── database/                # Prisma 7 schema, migrations, Drizzle config
│   ├── event-bus/               # Emittery + BullMQ dual-layer event system
│   ├── input-engine/            # Dynamic form generation (22+ types)
│   ├── regional-engine/         # dayjs timezone, Intl formatting, geo data
│   ├── session-manager/         # Redis + PostgreSQL dual-session state
│   ├── shared/                  # queue factory, cache wrapper, errors, neverthrow
│   ├── logger/                  # Pino + Audit Log
│   ├── storage-engine/          # Google Drive + S3 + Local
│   ├── notifier/                # Multi-channel notifications via BullMQ
│   ├── cms-engine/              # Dynamic translations via i18next backends
│   ├── search-engine/           # Prisma query builder + semantic search
│   ├── ux-helpers/              # Messages, keyboards, pagination, feedback
│   ├── document-engine/         # PDF, Excel, Word generation
│   ├── import-engine/           # CSV, Excel import — event-driven
│   └── module-registry/         # Auto-discovery + module validation
├── modules/
│   └── {module-name}/           # Handlers, Services, i18n, Events, Abilities
├── docs/                        # Architecture diagrams, ADRs, DR plans
├── spec/                        # SpecKit requirements and specification files
└── package.json                 # Root pnpm workspace definition
```

---

## 📜 Architectural Decision Records (ADRs)

Tempot's architecture is governed by **37 formal ADRs**, ensuring every technical choice is justified and documented.

| ADR | Decision | Key Detail |
|-----|----------|------------|
| ADR-001 | grammY over Telegraf | Modern API, TypeScript-first |
| ADR-002 | Hono over Express | Fastest, Edge-compatible |
| ADR-011 | cache-manager | Unified multi-tier cache |
| ADR-013 | CASL for RBAC | Battle-tested, Prisma adapter |
| ADR-016 | Vercel AI SDK | Provider-agnostic abstraction |
| ADR-017 | Drizzle for pgvector | Native vector operations |
| ADR-019 | Queue Factory | Centralized BullMQ management |
| ADR-020 | sanitize-html + ratelimiter | Security libraries over custom |
| ADR-030 | Code Limits | 200 lines/file, 50 lines/function |
| ADR-034 | No Double Logging | `loggedAt` flag on errors |
| ADR-037 | Hono Auth Strategy | Session-based authentication |

> 📄 Full ADR documents at `docs/architecture/adr/`

---

## 🔒 Security

**Security by Default** — every request passes through an automatic chain:

```
sanitize-html → @grammyjs/ratelimiter → CASL Auth → Zod Validation → Business Logic → Audit Log
```

| Layer | Tool | Purpose |
|-------|------|---------|
| Input Validation | Zod | Strict schema validation |
| Input Sanitization | sanitize-html | XSS prevention (ADR-020) |
| Rate Limiting | @grammyjs/ratelimiter | Spam protection |
| Authentication | CASL + Sessions | Identity + scoped permissions |
| Encryption at Rest | AES-256 | Sensitive data in DB |
| Encryption in Transit | HTTPS + WSS | All connections |
| SQL Injection | Prisma + Drizzle | Automatic prevention |
| Secret Detection | gitleaks | Every commit scanned |
| Audit Trail | Audit Log | Every state change tracked |

---

## 🔬 Development Methodology

Tempot enforces **Spec-Driven Development**. No development happens without an approved specification and testing strategy.

### 11-Step Mandatory Lifecycle

#### Phase 1 — Specifications & Documentation (SpecKit)

| Step | Command | Output |
|------|---------|--------|
| 1 | `specify init` + `/speckit.constitution` | Constitution + project setup |
| 2 | `/speckit.specify` | `spec.md` — what & why |
| 3 | `/speckit.clarify` | Edge cases, ambiguities resolved |
| 4 | `/speckit.plan` | Technical plan + data model |
| 5 | `/speckit.validate` | Consistency verification |

#### Phase 2 — Execution & Quality (superpowers)

| Step | Skill | Output |
|------|-------|--------|
| 6 | `brainstorming` | Architectural design via Socratic questions |
| 7 | `using-git-worktrees` | Isolated branch + baseline tests |
| 8 | `writing-plans` | Actionable 2-5 min tasks with code |
| 9 | `executing-plans` + `test-driven-development` | Code + tests — RED→GREEN→REFACTOR |
| 10 | `requesting-code-review` | Quality review with severity ratings |
| 11 | `finishing-a-development-branch` | Merge / PR / cleanup |

> ⚠️ **No Skip Rule** — Skipping any step is a violation. No code without approved spec. No code before tests.

### The Language Rule

- **Developer-Facing** (Code, Variables, Docs, Specs, CLI): **100% English**
- **User-Facing** (Bot messages, UI, Errors): **Localized via i18n JSON files**. No hardcoded strings permitted in source code

### Current Tooling

| Tool | Purpose | Status |
|------|---------|--------|
| **Gemini CLI** + superpowers | Primary AI development environment | ✅ Supported |
| **Claude Code** + superpowers | Alternative AI development environment | ✅ Supported |
| **SpecKit** (specify-cli) | Spec-driven development workflow | ✅ Required |

---

## 📋 Project Governance

The [**Project Constitution**](.specify/memory/constitution.md) is the **highest authority** — **69 principles** across 11 categories:

| Category | Count | Key Rules |
|----------|-------|-----------|
| Code Quality | 13 | Strict TS, fix at source, no zombie code, clean diff |
| Architecture | 8 | Clean Architecture, Repository Pattern, Event-Driven |
| Error Handling | 4 | Result Pattern via neverthrow, hierarchical error codes |
| Security | 9 | Security by Default, CASL RBAC, encryption, Redis fallback |
| Testing | 5 | TDD mandatory, 80% service coverage, zero-defect gate |
| Internationalization | 5 | i18n-only, Arabic primary, RTL required |
| Workflow | 8 | SpecKit + superpowers, No Skip Rule, ADR before code |
| Governance | 3 | Constitution is law, blast radius rule |
| Observability | 4 | Sentry, health checks, audit log, performance thresholds |
| Documentation | 5 | Documentation-first, README per package, ADR before code |
| UX Standards | 6 | Edit message rule, 4 status types, button standards |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture Spec](docs/tempot_v11_final.md) | Complete architectural specification (v11.0 — 2879 lines, 29 sections) |
| [Constitution](.specify/memory/constitution.md) | 69 governing principles — the highest authority |
| [Workflow Guide](docs/developer/workflow-guide.md) | SpecKit + superpowers step-by-step guide |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `v20+`
- **pnpm** `v9+` (`corepack enable pnpm`)
- **Docker & Docker Compose** (for PostgreSQL/pgvector & Redis)
- **AI Development Environment** (choose one):
  - **Gemini CLI + superpowers** (Recommended):
    ```bash
    npm install -g @google/gemini-cli
    gemini extensions install https://github.com/obra/superpowers
    ```
  - **Claude Code**: Requires Anthropic Pro/Max subscription (`claude login`)
- **SpecKit**:
  ```bash
  uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
  ```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/SalehOsman/Tempot.git
cd tempot

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Update BOT_TOKEN, DATABASE_URL, REDIS_URL, etc.

# 4. Start local infrastructure (Database & Redis)
pnpm docker:dev

# 5. Generate Prisma Client and Run Migrations
cd packages/database
pnpm db:generate
pnpm db:migrate --name init
cd ../..

# 6. Start the development server
pnpm dev
```

---

## 🤝 Contribution Guidelines

We enforce a strict CI/CD pipeline. To contribute:

1. Ensure your feature is planned via the superpowers workflow (`brainstorming` → `writing-plans`)
2. Follow the **Result Object Pattern** (`neverthrow`) and **Repository Pattern**
3. Respect the ESLint rules (ADR-030: Max 200 lines per file, max 50 lines per function)
4. Follow `test-driven-development` — tests must be written and fail **before** implementation code
5. Run tests (`pnpm test:unit` & `pnpm test:integration`). Coverage thresholds are strictly enforced (80% Services, 70% Handlers)
6. All commits must follow **Conventional Commits**
7. Use `requesting-code-review` before finalizing your branch

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with precision and spec-driven rigor.**

**Tempot v0.1.0-alpha (Spec v11)**

[⬆ Back to Top](#tempot)

</div>

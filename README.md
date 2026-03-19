<div align="center">

<img src="docs/Tempot_Logo.png" alt="Tempot Logo" width="400">

# Tempot

### *Template × Bot*

**Enterprise Telegram Bot Framework**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![grammY](https://img.shields.io/badge/grammY-1.x-009DC4?logo=telegram&logoColor=white)](https://grammy.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Constitution](https://img.shields.io/badge/Constitution-v1.0.0_(69_principles)-green.svg)](.specify/memory/constitution.md)
[![Spec](https://img.shields.io/badge/Spec-v11.0-orange.svg)](docs/tempot_v11_final.md)

---

**A production-ready, modular framework for building professional Telegram bots.**
**All infrastructure included — focus solely on your business logic.**

[Getting Started](#-getting-started) •
[Architecture](#-architecture) •
[Tech Stack](#-tech-stack) •
[Features](#-key-features) •
[Methodology](#-development-methodology) •
[Documentation](#-documentation) •
[Contributing](#-contributing) •
[License](#-license)

</div>

---

## 📖 What is Tempot?

Tempot is an enterprise-grade framework that provides **everything you need** to build professional Telegram bots. The name is a blend of **Template** and **Bot** — a production template you extend with your own modules.

Instead of rebuilding permissions, sessions, AI integration, notifications, and documentation for every project, Tempot delivers them out of the box with best-in-class libraries and battle-tested patterns.

> 🎯 **Philosophy:** *"Don't reinvent the wheel."* — If an open-source library exists with 500+ stars, is actively maintained, and TypeScript-compatible, we use it.

---

## 🏗️ Architecture

Tempot follows **Clean Architecture** with strict three-layer separation:

```
┌─────────────────────────────────────────────────────┐
│                  INTERFACES (apps/)                  │
│     bot-server  ·  dashboard  ·  mini-app  ·  docs  │
├─────────────────────────────────────────────────────┤
│                  SERVICES (packages/)                │
│   database · auth-core · logger · cache · queue ·   │
│   event-bus · ai-core · storage · settings · i18n   │
├─────────────────────────────────────────────────────┤
│                  CORE (modules/)                     │
│         Independent business modules                 │
│    Each with: handler · service · repository · tests │
└─────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
tempot/
├── apps/
│   ├── bot-server/          # grammY + Hono — main bot engine
│   ├── dashboard/           # Next.js — admin panel
│   ├── mini-app/            # Next.js — user mini applications
│   └── docs/                # Docusaurus — documentation site
├── packages/
│   ├── database/            # Prisma schema + pgvector via Drizzle
│   ├── auth-core/           # CASL-based RBAC + scoped authorization
│   ├── session-manager/     # Redis + PostgreSQL dual sessions
│   ├── logger/              # Pino + Audit Log
│   ├── event-bus/           # EventEmitter + Redis Pub/Sub
│   ├── ai-core/             # Vercel AI SDK abstraction
│   ├── storage-engine/      # Google Drive + S3 + Local
│   ├── notifier/            # Multi-channel notifications via BullMQ
│   ├── settings/            # Hybrid config (.env + DB)
│   ├── i18n-core/           # i18next — Arabic primary + English
│   ├── cms-engine/          # Dynamic translations via i18next backends
│   ├── input-engine/        # 22 field types — dynamic form builder
│   ├── search-engine/       # Prisma query builder + semantic search
│   ├── ux-helpers/          # Messages, keyboards, pagination, feedback
│   ├── regional-engine/     # Timezone, currency, geo data (Egypt default)
│   ├── document-engine/     # PDF, Excel, Word generation
│   ├── import-engine/       # CSV, Excel import — event-driven
│   ├── module-registry/     # Auto-discovery + validation
│   └── shared/              # cache.ts + queue.factory.ts + errors + types
├── modules/
│   └── {module-name}/       # Business logic modules
├── docs/                    # Architectural specification + guides
├── scripts/                 # CLI generator + automation
└── .specify/                # SpecKit — spec-driven development
```

---

## 🛠️ Tech Stack

<table>
<tr><th>Category</th><th>Technology</th><th>Purpose</th></tr>
<tr><td><b>Runtime</b></td><td>Node.js 20+</td><td>ESM, native TypeScript</td></tr>
<tr><td><b>Language</b></td><td>TypeScript Strict Mode</td><td>Full type safety, no <code>any</code></td></tr>
<tr><td><b>Bot Engine</b></td><td>grammY 1.x</td><td>Modern, flexible, TypeScript-first</td></tr>
<tr><td><b>Web Server</b></td><td>Hono 4.x</td><td>Fastest, lightweight, Edge-compatible</td></tr>
<tr><td><b>Database</b></td><td>PostgreSQL + pgvector</td><td>Relational + vector search</td></tr>
<tr><td><b>Primary ORM</b></td><td>Prisma 7.x</td><td>Type safety, auto migrations</td></tr>
<tr><td><b>pgvector ORM</b></td><td>Drizzle ORM</td><td>Native pgvector support (ADR-017)</td></tr>
<tr><td><b>Cache</b></td><td>cache-manager + Keyv</td><td>Multi-tier: Memory → Redis → DB</td></tr>
<tr><td><b>Queue</b></td><td>BullMQ</td><td>Reliable job processing via factory</td></tr>
<tr><td><b>AI</b></td><td>Vercel AI SDK</td><td>Provider-agnostic abstraction</td></tr>
<tr><td><b>Auth</b></td><td>CASL</td><td>RBAC + ABAC + Prisma adapter</td></tr>
<tr><td><b>Error Handling</b></td><td>neverthrow 8.2.0</td><td>Result<T, E> — no thrown exceptions</td></tr>
<tr><td><b>Testing</b></td><td>Vitest + Testcontainers</td><td>Fast unit + containerized integration</td></tr>
<tr><td><b>i18n</b></td><td>i18next</td><td>Arabic (primary) + English</td></tr>
<tr><td><b>Logging</b></td><td>Pino</td><td>Fastest JSON logger for Node.js</td></tr>
<tr><td><b>Sanitization</b></td><td>sanitize-html</td><td>XSS protection (ADR-020)</td></tr>
<tr><td><b>Rate Limiting</b></td><td>@grammyjs/ratelimiter</td><td>Official grammY plugin</td></tr>
<tr><td><b>Frontend</b></td><td>Next.js + Tailwind CSS</td><td>Dashboard + Mini App</td></tr>
<tr><td><b>Docs</b></td><td>Docusaurus</td><td>Developer + end-user documentation</td></tr>
<tr><td><b>Versioning</b></td><td>Changesets</td><td>Automated releases</td></tr>
</table>

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🔐 Security by Default
Every request passes through an automatic chain:
`sanitize → ratelimit → CASL auth → Zod validate → logic → audit`

### 🌍 i18n-First Design
Arabic primary, English secondary. Zero hardcoded text. Dynamic translations via CMS engine.

### 🤖 Pluggable AI
Provider-agnostic via Vercel AI SDK. Graceful degradation when AI is unavailable. Circuit breaker protection.

### 📦 Module System
Independent modules with auto-discovery. Each module: handler + service + repository + tests + i18n.

</td>
<td width="50%">

### 🔄 Event-Driven
Modules communicate ONLY via Event Bus. Three levels: Local → Internal → External (Redis Pub/Sub).

### 🧪 TDD Mandatory
RED → GREEN → REFACTOR cycle enforced. Coverage: Services 80%, Handlers 70%.

### 🛡️ CASL RBAC
4-level roles: GUEST → USER → ADMIN → SUPER_ADMIN. Scoped authorization per module.

### ⚡ Pluggable Architecture
Every package toggleable via `.env` flags. The system runs correctly with any optional module disabled.

</td>
</tr>
</table>

---

## 🔒 Security

| Layer | Tool | Purpose |
|-------|------|---------|
| Input Validation | Zod | Strict schema validation |
| Input Sanitization | sanitize-html | XSS prevention |
| Rate Limiting | @grammyjs/ratelimiter | Spam protection |
| Authentication | CASL + Sessions | Identity + permissions |
| Encryption at Rest | AES-256 | Sensitive data |
| Encryption in Transit | HTTPS + WSS | All connections |
| SQL Injection | Prisma + Drizzle | Automatic prevention |
| Audit Trail | Audit Log | Every state change tracked |

---

## 📐 Development Methodology

Tempot follows a strict **11-step development lifecycle** combining two tools:

### Phase 1 — Specifications (SpecKit)

| Step | Command | Output |
|------|---------|--------|
| 1 | `specify init` + `/speckit.constitution` | Constitution + project setup |
| 2 | `/speckit.specify` | `spec.md` — what & why |
| 3 | `/speckit.clarify` | Edge cases + ambiguities |
| 4 | `/speckit.plan` | Technical plan + data model |
| 5 | `/speckit.validate` | Consistency check |

### Phase 2 — Execution (superpowers)

| Step | Skill | Output |
|------|-------|--------|
| 6 | `brainstorming` | Architectural design |
| 7 | `using-git-worktrees` | Isolated branch |
| 8 | `writing-plans` | Actionable task plan |
| 9 | `executing-plans` + `TDD` | Code + tests |
| 10 | `requesting-code-review` | Quality review |
| 11 | `finishing-a-development-branch` | Merge/PR |

> ⚠️ **No Skip Rule** — Skipping any step is a violation. No code without approved spec.

See [Workflow Guide](docs/developer/workflow-guide.md) for full details.

---

## 📋 Project Governance

The [**Project Constitution**](.specify/memory/constitution.md) is the highest authority — **69 principles** across 11 categories:

| Category | Principles | Key Rules |
|----------|-----------|-----------|
| Code Quality | 13 | Strict TS, no zombie code, fix at source |
| Architecture | 8 | Clean Architecture, Repository Pattern |
| Error Handling | 4 | Result Pattern via neverthrow |
| Security | 9 | Security by Default, CASL RBAC |
| Testing | 5 | TDD mandatory, coverage thresholds |
| i18n | 5 | i18n-only, Arabic primary |
| Workflow | 8 | SpecKit + superpowers, No Skip Rule |
| Governance | 3 | Constitution is law, blast radius rule |
| Observability | 4 | Sentry, health checks, audit log |
| Documentation | 5 | Documentation-first, ADR before code |
| UX Standards | 6 | Edit message rule, status types |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Foundational Spec](docs/tempot_v11_final.md) | Complete architectural specification (v11.0) |
| [Constitution](.specify/memory/constitution.md) | 69 governing principles |
| [Workflow Guide](docs/developer/workflow-guide.md) | SpecKit + superpowers step-by-step |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** (package manager)
- **Docker** (for PostgreSQL + Redis)
- **Gemini CLI** or **Claude Code** (with superpowers extension)
- **SpecKit** (`uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tempot.git
cd tempot

# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
pnpm docker:dev

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

---

## 🤝 Contributing

Tempot uses **Spec-Driven Development**. All contributions must follow the 11-step workflow:

1. Create a `spec.md` via `/speckit.specify`
2. Clarify edge cases via `/speckit.clarify`
3. Plan implementation via `/speckit.plan`
4. Validate against spec via `/speckit.validate`
5. Implement with TDD via superpowers

See the [Constitution](.specify/memory/constitution.md) for full rules.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ using TypeScript, grammY, and Clean Architecture**

[⬆ Back to Top](#tempot)

</div>

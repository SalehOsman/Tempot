# Tembot-v2 Platform — Canonical Documentation

> **Domain-Agnostic Omnichannel Modular Monolith Template & Starter Kit**  
> Unifying Telegram Bot (`grammY`), Telegram Mini App (`React 19`), and Web Admin Dashboard (`React 19`) over a central Hono HTTP & RPC Gateway.

---

## 🏛️ Documentation Map (The 10 Pillars)

| Pillar | Path | Scope & Focus |
| :--- | :--- | :--- |
| **00. Overview & Language** | [`docs/00-overview/`](./00-overview/) | High-level C4 context, domain-agnostic template philosophy, and canonical ubiquitous vocabulary. |
| **01. Architecture & Methodology** | [`docs/01-architecture/`](./01-architecture/) | Modular Monolith standards, Vertical Slice Architecture, FCIS purity, and the 10 Engineering Taboos. |
| **02. Omnichannel Surfaces** | [`docs/02-surfaces/`](./02-surfaces/) | grammY Bot engine, Rich Messages catalog, Telegram Mini App (TMA), and Web Admin Dashboard. |
| **03. Kernel Modules (The 10 Hubs)** | [`docs/03-kernel-modules/`](./03-kernel-modules/) | Invariant infrastructure modules: Settings, Access Control, Audit, Clock, Telemetry, Backup, Scheduler, Broadcast, Media, Google Services. |
| **04. Domain Extension Guide** | [`docs/04-domain-extension/`](./04-domain-extension/) | How to author, scaffold (Plop CLI), and plug custom business modules (`modules/domain/*`) into the engine. |
| **05. Contracts & Persistence** | [`docs/05-executable-contracts/`](./05-executable-contracts/) | PostgreSQL 16 + Drizzle ORM invariants, Double-Entry Ledger, Transactional Outbox, and Hono RPC contracts. |
| **06. Security & Authorization** | [`docs/06-security-and-compliance/`](./06-security-and-compliance/) | STRIDE Threat Model, OWASP ASVS 5.0 L2, Telegram `initData` HMAC verification, and Zero-Role Capability Engine. |
| **07. Operations & Deployment** | [`docs/07-operations-and-deployment/`](./07-operations-and-deployment/) | Minimal Alpine Docker topologies, T3-Env boot validation, Bull-Board queue monitoring, and CI/CD pipelines. |
| **08. Developer Playbooks** | [`docs/08-developer-playbooks/`](./08-developer-playbooks/) | Zero-to-running onboarding, step-by-step vertical slice tutorial, and Vitest/Testcontainers testing handbook. |
| **09. Architecture Decisions** | [`docs/09-decisions/`](./09-decisions/) | Historical Architectural Decision Records (`ADR-0001` through `ADR-0012`). |
| **10. User & Operator Guide** | [`docs/10-user-guide/`](./10-user-guide/) | End-user operating handbook, bot navigation, TMA flows, ngrok tunnels, and admin procedures. |

---

## ⚡ Quick Technology Reference

- **Backend Runtime:** Node.js 22/24 LTS + TypeScript Strict Mode (`tsconfig.base.json`)
- **Package & Monorepo Manager:** `pnpm@10.5.2` + `turbo@2.4.4` (Turborepo)
- **Code Quality:** `@biomejs/biome@1.9.4` (Linter & Formatter)
- **HTTP Engine & Gateway:** `hono@4.13.12` + `@hono/zod-validator` + `@scalar/hono-api-reference`
- **Bot Engine:** `grammy@1.46.0` + `@grammyjs/conversations` + `@grammyjs/transformer-throttler`
- **Frontends (TMA & Dashboard):** `react@19.3.0`, `@telegram-apps/sdk-react@3.3.9`, `tailwindcss@4.3.3`, `vite@8.3.1`
- **Persistence & Caching:** PostgreSQL 16 (`drizzle-orm@0.45.3`) + Redis 7/8 (`bullmq@6.3.10`)
- **Queue Monitoring:** `@bull-board/hono` (Embedded queue dashboard)
- **Math & Validation:** `decimal.js@10.6.0`, `zod@3.24.2`, `neverthrow@8.2.0`

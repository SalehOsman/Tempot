# 2. Adopt Modern Omnichannel Stack

Date: 2026-10-23

## Status
Accepted

## Context
The platform requires an architecture capable of powering three distinct interfaces simultaneously:
1. Automated conversational **Telegram Bot**.
2. Interactive **Telegram Mini App (TMA)** running inside mobile clients.
3. Administrative **Web Dashboard** for operators and auditors.

## Decision
We adopt the Modern Omnichannel Modular Monolith:
- **Backend Core:** Hono HTTP & RPC Gateway (`hono@4.13.12`)
- **Bot Engine:** grammY (`grammy@1.46.0`) with conversations and throttling middleware
- **Frontend Clients:** React 19 (`react@19.3.0`) + Tailwind CSS v4 + `@telegram-apps/sdk-react@3.3.9`
- **Data Stores:** PostgreSQL 16 (`drizzle-orm@0.45.3`) + Redis 7/8 (`bullmq@6.3.10`)
- **Queue Control & API Docs:** `@bull-board/hono` + `@scalar/hono-api-reference`
- **Scaffolding:** Plop.js CLI (`plop@4.0.1`)

## Consequences
### Positive
- End-to-end TypeScript type safety without code-generation fetchers.
- Ultra-fast startup, low memory footprint, and high-fidelity testing.
### Negative
- Requires strict adherence to vertical slice boundaries and 10 Engineering Taboos.

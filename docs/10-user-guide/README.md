# 📘 Tembot-v2 User & Operator Guide

> Canonical operating manual for operators, developers, and administrators running the Tembot Omnichannel Platform.

---

## 🧭 Guide Structure

This User Guide is divided into 5 focused operational manuals:

| Guide | File | Target Audience | Key Topics |
| :--- | :--- | :--- | :--- |
| **01. Platform Tour** | [`01-platform-tour.md`](./01-platform-tour.md) | Everyone | Architecture overview, 3-surface synergy (Bot, TMA, Dashboard), core capabilities. |
| **02. Telegram Bot Manual** | [`02-telegram-bot-manual.md`](./02-telegram-bot-manual.md) | End Users & Operators | `/start` command, persistent reply keyboard, rich interactive cards, language switching, message dismissal. |
| **03. Telegram Mini App (TMA)** | [`03-telegram-mini-app-manual.md`](./03-telegram-mini-app-manual.md) | End Users & Developers | Launching TMA in Telegram, HTTPS requirements, Telegram theme sync, mobile viewports. |
| **04. Tunneling & ngrok Manual** | [`04-tunneling-and-ngrok-manual.md`](./04-tunneling-and-ngrok-manual.md) | Operators & DevOps | ngrok v3 setup, `ngrok.yml` configuration, `pnpm tunnel`, Vite `allowedHosts`, troubleshooting. |
| **05. Admin Operations Manual** | [`05-admin-operations-manual.md`](./05-admin-operations-manual.md) | System Administrators | Platform settings, maintenance mode toggles (Bot/TMA/Global), audit logs, branding & theme. |

---

## ⚡ Quick Start Cheat Sheet

```bash
# 1. Install all dependencies across the monorepo
pnpm install

# 2. Start PostgreSQL, Redis, and MinIO storage infrastructure
pnpm docker:up

# 3. Start ngrok tunnel for Telegram Mini App
pnpm tunnel

# 4. In a separate terminal, start the Telegram Bot runner
pnpm bot:dev

# 5. In a separate terminal, start the Mini App dev server
pnpm tma:dev

# 6. Verify codebase health and architecture invariants
pnpm check:biome
pnpm check:i18n
pnpm typecheck
pnpm test
```

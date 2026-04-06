# Quick Start — Get Running in 10 Minutes

This guide gets you to a running Tempot bot as fast as possible. For the full architecture and methodology, see [tempot_v11_final.md](tempot_v11_final.md).

---

## Prerequisites

- Node.js v20+
- pnpm v10+ (`corepack enable pnpm`)
- Docker Desktop
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

---

## Step 1 — Clone and Install (2 min)

```bash
git clone https://github.com/SalehOsman/Tempot.git
cd Tempot
pnpm install
```

---

## Step 2 — Configure Environment (1 min)

```bash
cp .env.example .env
```

Open `.env` and set these two required values:

```env
BOT_TOKEN=your_bot_token_from_botfather
SUPER_ADMIN_IDS=your_telegram_user_id
```

To find your Telegram user ID, message [@userinfobot](https://t.me/userinfobot).

---

## Step 3 — Start Infrastructure (2 min)

```bash
pnpm docker:dev
```

This starts PostgreSQL (with pgvector) and Redis in the background. Wait for both containers to show `healthy`:

```bash
docker ps  # Both containers should show (healthy)
```

---

## Step 4 — Start the Bot (1 min)

```bash
pnpm dev
```

You should see:

```
🚀 Starting Tempot bot in minimal mode...
✅ Bot connected: @YourBotUsername
📡 Listening for messages... (Ctrl+C to stop)
```

---

## Step 5 — Test the Connection (1 min)

Open Telegram, find your bot, and send:

- `/start` — should reply with a welcome message
- `/ping` — should reply with `Pong!`

---

## What's Running Now

The current `bot-server` is a **minimal connection test** — grammY only, no database or Redis usage yet. This is intentional: it confirms Telegram connectivity before building out the full infrastructure.

Full bot functionality comes online in phases:

| Phase   | What gets built                            | Status         |
| ------- | ------------------------------------------ | -------------- |
| Phase 0 | Workspace setup                            | ✅ Done        |
| Phase 1 | 17 core packages (10 on main, 7 remaining) | ⏳ In Progress |
| Phase 2 | Bot Server reconstruction                  | Planned        |
| Phase 3 | Business Modules                           | Planned        |
| Phase 4 | Dashboard + Mini App                       | Planned        |

---

## Stopping

```bash
# Stop the bot
Ctrl+C

# Stop Docker services
pnpm docker:down

# Stop Docker and remove all data (clean slate)
pnpm docker:reset
```

---

## Next Steps

- Read the [Architecture Spec](tempot_v11_final.md) — the authoritative reference
- Read the [Project Constitution](../.specify/memory/constitution.md) — project governing rules
- Read the [Workflow Guide](developer/workflow-guide.md) — SpecKit + Superpowers methodology
- Read the [Roadmap](ROADMAP.md) — current project status
- Set up your AI development tool (Claude Code or Gemini CLI) per [Section 22.8](tempot_v11_final.md)

---
title: Getting Started with Tempot
description: Step-by-step tutorial to build your first Telegram bot using the Tempot framework
tags:
  - tutorial
  - getting-started
  - beginner
audience:
  - bot-developer
contentType: developer-docs
difficulty: beginner
---

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** version 20 or later
- **pnpm** package manager
- **PostgreSQL** version 16
- **Redis** for sessions and queues
- A **Telegram** account with a bot token from [@BotFather](https://t.me/BotFather)

## Creating a New Project

### Step 1: Clone the Repository

```bash
git clone https://github.com/SalehOsman/Tempot.git
cd Tempot
pnpm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the file and add your bot token and database credentials:

```
BOT_TOKEN=your_bot_token_here
DATABASE_URL=postgresql://user:password@localhost:5432/tempot
REDIS_URL=redis://localhost:6379
```

### Step 3: Set Up the Database

```bash
pnpm db:migrate
pnpm db:seed
```

### Step 4: Run the Bot

```bash
pnpm dev
```

The bot will start and you will see logging output confirming a successful connection.

## Project Structure Overview

Tempot follows a monorepo architecture using pnpm workspaces:

```
Tempot/
├── apps/
│   └── bot-server/          # Main bot application
├── packages/
│   ├── shared/              # Common utilities and types
│   ├── logger/              # Logging system (Pino)
│   ├── event-bus/           # Event bus for inter-module communication
│   ├── auth-core/           # Authorization system (CASL)
│   ├── database/            # Database layer (Prisma)
│   ├── session-manager/     # Session management
│   ├── i18n-core/           # Internationalization
│   ├── ai-core/             # AI integration
│   └── module-registry/     # Module discovery and registration
├── modules/                 # Business modules
└── docs/                    # Documentation
```

## Next Steps

After successfully running the bot, you can:

- Read the [Creating a Module](/en/guides/creating-a-module/) guide to learn how to add custom functionality
- Review the [Architecture Overview](/en/concepts/architecture-overview/) to understand the system design
- Explore the API reference for available packages in the Reference section

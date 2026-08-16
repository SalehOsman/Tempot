---
title: Public Template Scope
description: What the public Tempot template includes and intentionally excludes
tags:
  - enterprise
  - template
  - repository-hygiene
audience:
  - bot-developer
  - operator
contentType: developer-docs
difficulty: beginner
---

# Public Template Scope

Tempot's public repository is the bot creation template. It is not a full dump
of the private development workspace.

## Included In The Public Template

The public template includes the files a bot creator needs to build a new bot:

- `apps/bot-server/` for the Telegram and HTTP runtime.
- `apps/docs/` for the optional documentation site tooling.
- `packages/` for reusable platform services.
- `modules/` for business modules and bot capabilities.
- `scripts/tempot/` for public Tempot CLI helpers.
- `docs/product/` for public product, user, operator, and generated reference
  documentation.
- `docker-compose.yml` and `docker-compose.webhook.yml` for local development.
- `.env.example` for environment variable shape.
- `README.md` for quick start and common commands.

## Excluded From The Public Template

The public template intentionally excludes private or development-only assets:

- `.agents/`, `.claude/`, `.gemini/`, `.opencode/`, `.windsurf/`, and similar
  AI-agent state.
- `.specify/` and `specs/` development artifacts.
- `.github/workflows/` internal workflow files.
- `docs/project-analysis/` historical analysis packages.
- `docs/archive/`, `docs/developer/`, `docs/development/`, and internal
  governance documents not required to create a bot.
- test suites that are maintained as Tempot development assets.
- local stores such as `node_modules/`, `.pnpm-store/`, `data/`, generated
  `dist/`, and local backup artifacts.
- real `.env` files and secrets.

This separation keeps the published template focused and prevents private
development state from becoming part of downstream bot repositories.

## Required Public Checks

After cloning or generating a bot, run:

```bash
pnpm install
pnpm check
pnpm docs:check
pnpm template:audit
```

For a newly initialized public repository, run strict template audit before
publishing:

```bash
TEMPOT_TEMPLATE_AUDIT_STRICT=1 pnpm template:audit
```

On Windows PowerShell:

```powershell
$env:TEMPOT_TEMPLATE_AUDIT_STRICT='1'
pnpm template:audit
Remove-Item Env:TEMPOT_TEMPLATE_AUDIT_STRICT
```

## Rule For Bot Creators

Keep custom business logic inside dedicated modules when possible. Avoid editing
shared packages unless the change is intentionally part of your bot platform
fork. This makes future Tempot template upgrades easier to review.

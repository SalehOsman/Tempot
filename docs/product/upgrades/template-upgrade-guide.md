---
title: Template Upgrade Guide
description: Public process for upgrading a bot created from Tempot to a newer Tempot template version.
tags:
  - upgrades
  - template
  - operations
audience:
  - bot-developer
  - operator
contentType: developer-docs
difficulty: intermediate
---

# Template Upgrade Guide

Tempot is intended to be reusable. A bot created from the template can adopt
future template updates when the bot owner keeps project-specific changes
separated from template foundations.

## Upgrade Model

Use a normal Git workflow:

1. Keep the bot repository under its own Git history.
2. Add the Tempot template repository as an upstream remote or compare against a
   released Tempot tag.
3. Review the compatibility matrix before updating.
4. Merge or cherry-pick the template update into a dedicated upgrade branch.
5. Resolve conflicts deliberately.
6. Run the verification gates.
7. Deploy first to a non-production environment.

## Before Upgrading

Record the current bot state:

- Current bot commit.
- Current Tempot template version or source commit.
- Active modules.
- Environment variables in use, without secret values.
- Database migration state.
- Backup status.
- Known local customizations.

## Recommended Verification

Run these commands after applying a template update:

```bash
pnpm install
pnpm check
pnpm docs:check
pnpm template:audit
```

For data or backup changes, also verify migrations, backup creation, and restore
against a non-production database.

## Conflict Handling

Treat conflicts by ownership:

- Keep bot-specific module behavior unless the compatibility matrix says it must
  change.
- Prefer the new template version for shared infrastructure packages.
- Re-check `.env.example` for new required variables.
- Re-check `docker-compose.yml` for service, port, volume, or image changes.
- Update public docs when operator behavior changes.

## Rollback

Do not deploy an upgrade without rollback evidence:

- Previous deployable commit or image.
- Database rollback or forward-fix decision.
- Backup restore path.
- Operator contact.
- Smoke test result for the previous version.

## When Manual Migration Is Required

Manual migration is required when a release changes:

- Database schema or migrations.
- Required environment variables.
- Docker service names, ports, or volumes.
- Public module APIs.
- Package exports used by bot-specific code.
- Backup or restore formats.

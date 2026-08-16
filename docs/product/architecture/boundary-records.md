---
title: Boundary Records
description: Public architecture boundary map for Tempot packages, modules, runtime apps, and extension points.
tags:
  - architecture
  - boundaries
  - modules
audience:
  - bot-developer
  - package-developer
contentType: developer-docs
difficulty: intermediate
---

# Boundary Records

This page summarizes the boundaries a bot creator should preserve when building
on Tempot. Source code remains the authority for exact implementation details.

## Runtime Boundary

| Area | Path | Responsibility |
| --- | --- | --- |
| Bot server | `apps/bot-server` | Telegram runtime, HTTP server, runtime composition, startup behavior |
| Documentation site | `apps/docs` | Optional documentation application and generated reference rendering |

Runtime code should compose packages and modules. Business behavior should stay
inside modules or dedicated packages rather than being hardcoded into startup
composition.

## Package Boundary

| Package Area | Path | Responsibility |
| --- | --- | --- |
| Database | `packages/database` | Prisma, database access foundations, schema-owned data behavior |
| Event Bus | `packages/event-bus` | Cross-module event communication |
| Logger | `packages/logger` | Structured logging foundation |
| Shared | `packages/shared` | Shared types and reusable primitives |
| AI Core | `packages/ai-core` | AI provider abstractions and common AI service contracts |
| Backup Engine | `packages/backup-engine` | Backup and restore service foundations |

Packages should expose reusable capabilities and avoid depending on bot-specific
business modules.

## Module Boundary

Business modules live under `modules/`. A module should keep its handlers,
services, repositories, localization, and module metadata together.

Expected module responsibilities:

- Own business behavior for one capability.
- Use repositories for persistence.
- Communicate with other modules through the Event Bus.
- Keep user-facing text in locale files.
- Keep handlers focused on interaction flow.

## Documentation Boundary

Public template documentation belongs under `docs/product/` and public guides.
Internal methodology, historical analysis, AI-agent context, and local planning
artifacts are excluded from the public template by `.gitignore`.

## Extension Guidance

When creating a bot from Tempot:

1. Start with configuration in `.env`.
2. Add bot-specific behavior in a new or existing module.
3. Use package APIs instead of reaching into package internals.
4. Add public user/operator documentation when behavior is exposed to operators.
5. Record upgrade-sensitive changes in the compatibility matrix.

## Boundary Violation Signals

Review a change before merging if it:

- Adds direct database access from a handler.
- Adds user-facing strings inside TypeScript source.
- Makes one module import another module's private implementation.
- Places bot-specific behavior in a shared package.
- Requires editing internal development files to run a public bot.

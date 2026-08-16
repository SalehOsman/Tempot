---
title: Compatibility Matrix
description: Public compatibility checklist for Tempot template releases and generated bots.
tags:
  - upgrades
  - compatibility
  - releases
audience:
  - bot-developer
  - operator
contentType: developer-docs
difficulty: intermediate
---

# Compatibility Matrix

Use this matrix before upgrading a bot created from Tempot. Fill it for each
template release or release candidate.

## Current Baseline

| Area | Current Public Requirement |
| --- | --- |
| Runtime | Node.js 22.12 or newer |
| Package manager | Corepack with the pnpm version pinned in `package.json` |
| Language | TypeScript strict mode |
| Bot engine | grammY |
| HTTP server | Hono |
| Database | PostgreSQL 16 with Prisma and Drizzle foundations |
| Vector support | pgvector foundations |
| Cache/queue services | Redis-compatible infrastructure |
| Local services | Docker Compose |

## Release Compatibility Checklist

| Area | Compatible By Default | Requires Review When |
| --- | --- | --- |
| Environment variables | New optional variables have defaults | Required variables are added, renamed, or removed |
| Docker identity | `COMPOSE_PROJECT_NAME` can be customized per bot | Service names, volumes, or host ports change |
| Database | No migration is added | Prisma schema, migrations, pgvector behavior, or restore flow changes |
| Modules | Public module commands and menus remain stable | Commands, callback data, permissions, or locale keys change |
| Package APIs | Exports remain backward compatible | Exports, service constructors, or Result contracts change |
| Documentation | Public guides match the release behavior | Runtime behavior changes without matching docs |
| Security | No new secret handling path is introduced | Auth, authorization, token handling, or logs change |

## Release Record Template

| Field | Value |
| --- | --- |
| Tempot release/tag | TBD |
| Release commit | TBD |
| Breaking changes | None / List |
| Migration required | No / Yes |
| Database migration required | No / Yes |
| Environment changes | None / List |
| Docker changes | None / List |
| Backup/restore impact | None / List |
| Verified commands | TBD |
| Upgrade notes | TBD |

## Bot Owner Notes

Each bot repository should keep a short local upgrade note that records:

- Source Tempot release.
- Target Tempot release.
- Local conflicts resolved.
- Verification commands.
- Deployment result.
- Rollback evidence.

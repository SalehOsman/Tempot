---
title: Bot Management
description: Operational module for managed bot profiles, lifecycle governance, module enablement, and safe profile portability
tags:
  - modules
  - bot-management
  - product
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: advanced
---

## Purpose

`bot-management` is the operational Tempot module for managed Telegram bot
profiles. It owns bot registry records, lifecycle state, settings profiles,
per-bot module enablement, template source attribution, health snapshots, and
safe import/export contracts.

The module records governed operational state and emits events. It does not
start, stop, or reconfigure running bot processes.

## Lifecycle

Managed bots follow this governed lifecycle:

```text
DRAFT -> CONFIGURED -> ACTIVE
ACTIVE -> PAUSED -> ACTIVE
ACTIVE -> MAINTENANCE -> ACTIVE
any non-archived state -> ARCHIVED
```

Pause, maintenance, and archive transitions require an operator reason.

## Commands

The module exposes these Telegram command shortcuts:

```text
/bots
/new_bot
```

`/bots` opens the managed bot list backed by the module service and repository.
`/new_bot` starts the Telegram registration flow and stores a redacted
credential fingerprint instead of the raw token.

## Governance

The module is governed by Spec #040 and Spec #042. Current code includes module
metadata, contracts, Prisma schema references, managed bot repositories,
settings profile and module-enablement repositories/services, lifecycle
transition policy and service, Telegram list/detail/lifecycle menus, `/bots`,
`/new_bot`, callback and text handlers, guided registration through
`@tempot/input-engine`, lifecycle reason flows, and targeted unit coverage.

The module is active but not yet a production-complete multi-bot operations
platform. Treat it as a governed bot profile registry and lifecycle-control
surface. Remaining production completion work is tracked in
`specs/040-bot-management/tasks.md` and the production completion plan under
`docs/superpowers/plans/2026-05-12-bot-management-production-completion.md`;
do not document it as starting, stopping, or reconfiguring running bot
processes until runtime evidence exists.

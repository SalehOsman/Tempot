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

The module is governed by Spec #040. Production completion is in progress on the
`codex/bot-management-production` branch. Completed implementation now includes
module metadata, contracts, Prisma schema references, the managed bot
repository, registration service, list/detail menus, `/bots`, `/new_bot`,
callback and text handlers, and targeted unit coverage for the registry slice.

The module is not yet production complete. Remaining work includes all
non-registry repositories, lifecycle services, settings profiles, per-bot module
enablement, template provisioning, search, health, notifications, import/export,
integration tests, and final merge gates.

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

## Governance

The module is governed by Spec #040. Current implementation is in the initial
contracts checkpoint: module metadata, abilities, lifecycle contracts, event
contracts, schemas, locale keys, and module documentation.

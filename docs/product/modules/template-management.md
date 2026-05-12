---
title: Template Management
description: Product module for governed bot template lifecycle, search, import, export, and subscriptions
tags:
  - modules
  - template-management
  - product
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: advanced
---

## Purpose

`template-management` is the implemented product module for reusable bot
templates. It manages template metadata, lifecycle state, versions, search,
import/export flows, ratings, subscriptions, and notification events.

## Lifecycle

Templates follow the governed lifecycle:

```text
DRAFT -> REVIEW -> PUBLISHED -> ARCHIVED
```

The DRAFT to REVIEW transition requires a complete template with name,
description, category, and at least one command definition. Publishing requires
an admin role. Archiving requires a reason and can be performed by the owner or
an admin.

## Commands

The module exposes these Telegram command shortcuts:

```text
/templates
/new_template
/import_template
```

## Verification

Current closure verification for the module includes:

- 48 module unit tests passing.
- 22 module integration tests passing.
- Module Doctor ready.
- Module-scoped TypeScript build passing.

## Governance

The module has a `module.manifest.ts` file and communicates through package
contracts and events. The module remains governed by Spec #039 and must keep
`docs/ROADMAP.md`, SpecKit artifacts, and quality gates synchronized when its
behavior changes.

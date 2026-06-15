---
title: User Management
description: Core platform module for user profiles, roles, and access-aware user flows
tags:
  - modules
  - user-management
  - core-platform
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
---

## Purpose

`user-management` is the implemented core platform module for Tempot user
profiles, role-aware access flows, and Telegram user entry points.

## Commands

The module exposes these Telegram command shortcuts:

```text
/start
/profile
/users
```

## Capabilities

- Profile lookup and profile display.
- User administration flows for authorized roles.
- Role-aware menu and callback handling.
- Regional data support through `@tempot/national-id-parser`.
- Versioned AES-256-GCM protection for email, national ID, mobile number, and
  birth date before persistence.
- Exact email and canonical national-ID lookup through versioned HMAC tokens.
  Mobile lookup remains disabled until a governed E.164 normalization contract
  is approved.

## Governance

The module has a `module.manifest.ts` file and passes Module Doctor. It remains
governed by the Tempot repository pattern, Result pattern, i18n-only rule, and
module boundary rules.

Protected values must enter persistence through `UserRepository`. Services and
handlers must not query protected plaintext columns or build lookup tokens
directly.

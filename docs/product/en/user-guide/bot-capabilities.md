---
title: Bot Capabilities
description: End-user and operator overview of the main Tempot bot capabilities
tags:
  - user-guide
  - capabilities
  - bot
audience:
  - end-user
  - operator
contentType: user-guide
difficulty: beginner
---

## Overview

Tempot is an enterprise Telegram bot framework. The bot provides interactive
menus for users, admins, and super admins. Available features depend on the
user role and on enabled modules.

## Main Capabilities

Tempot currently supports:

- profile and account information;
- language and personal settings;
- membership request submission and approval;
- user administration for admins, with role and block management protected by
  higher authorization;
- notification viewing and test notifications;
- backup creation, backup history, restore checks, real restore, and factory reset;
- knowledge indexing and AI-assisted documentation questions;
- help and command discovery.

## Roles

The bot uses four role levels:

| Role        | Typical access                                      |
| ----------- | --------------------------------------------------- |
| Guest       | Can request membership when not blocked             |
| User        | Can use standard profile, settings, messages, help  |
| Admin       | Can manage delegated operational areas, including user administration where authorized |
| Super Admin | Can manage roles, blocked users, backups, and knowledge ops |

Blocked users cannot use bot features or submit membership requests until a
super admin removes the block.

## How Users Interact

Users normally interact through buttons. Text commands are still supported for
key actions such as `/start`, `/help`, and `/ask`.

For AI help, users can press the ask-question button or send a question through
`/ask`, `ask/`, `ask`, or the Arabic ask aliases.

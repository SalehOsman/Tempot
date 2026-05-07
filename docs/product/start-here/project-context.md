---
title: Project Context
description: Start here to understand Tempot sources of truth, current state, and navigation paths
tags:
  - start-here
  - context
  - onboarding
audience:
  - package-developer
  - bot-developer
  - operator
contentType: developer-docs
difficulty: beginner
---

## Start Here

Tempot is an enterprise Telegram bot framework built as a strict TypeScript
monorepo. Use this page as the published documentation entry point before
opening detailed archive or SpecKit files.

## Read Order

1. `docs/ONBOARDING.md` for fast project orientation and AI context.
2. `.specify/memory/constitution.md` for non-negotiable engineering rules.
3. `.specify/memory/roles.md` for Project Manager, Technical Advisor, and
   Executor responsibilities.
4. `docs/ROADMAP.md` for current status and next work.
5. `docs/developer/workflow-guide.md` for the SpecKit plus Superpowers
   delivery workflow.

## Current Documentation Layers

| Layer               | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| Source of truth     | Constitution, roles, SpecKit, Roadmap, ADRs, and source code |
| Published docs      | Starlight pages under `apps/docs/src/content/docs/`          |
| Repository map      | `docs/README.md` and `docs/development/README.md`            |
| Generated reference | TypeDoc pages under `reference/`                             |
| AI context          | Understand Anything graph and onboarding summaries           |
| Archive             | Historical plans plus active compatibility-path documents    |

## Current Active Spec

The documentation restructure is tracked by
`specs/038-documentation-platform-restructure/`.

## Rule of Authority

When documentation conflicts, use this order:

1. Constitution
2. Role framework
3. SpecKit artifacts
4. Roadmap
5. ADRs and architecture docs
6. Source code and generated context snapshots

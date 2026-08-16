---
title: Change Governance
description: Public governance model for Tempot template changes, bot upgrades, and release evidence.
tags:
  - operations
  - governance
  - releases
audience:
  - bot-developer
  - operator
contentType: developer-docs
difficulty: intermediate
---

# Change Governance

Tempot is a reusable bot template. Changes to the template must protect existing
bots created from earlier versions while still allowing the template to improve.

## Change Classes

| Class | Examples | Required Evidence |
| --- | --- | --- |
| Documentation-only | README, product guides, launch checklists | `pnpm docs:check`, `pnpm template:audit` |
| Template configuration | `.env.example`, Docker ports, default names, scripts | `pnpm check`, `pnpm template:audit`, startup smoke test |
| Runtime behavior | Bot handlers, modules, service logic, repositories | Focused tests, `pnpm check`, acceptance evidence |
| Data model | Prisma schema, migrations, backup/restore behavior | Migration test, rollback plan, restore evidence |
| Public package API | Exports, service contracts, module boundaries | Consumer impact note, compatibility matrix update |

## Compatibility Rule

A template release should not silently break a bot created from an earlier
release. If a breaking change is unavoidable, the release must include:

- A clear compatibility matrix update.
- Migration instructions.
- Rollback notes.
- A minimum affected file list.
- A verification checklist.

## Evidence Requirements

Every release candidate should record:

- Release commit or tag.
- Changed files and affected areas.
- Validation commands and results.
- Known risks accepted for the release.
- Rollback plan.

Use `docs/product/releases/release-evidence-template.md` as the public evidence
format.

## Upgrade Safety

Bot owners should keep bot-specific business logic isolated from template
internals. Prefer these extension points:

- Add bot behavior under `modules/`.
- Keep environment-specific values in `.env`, not source files.
- Keep deployment-specific changes outside reusable package internals when
  possible.
- Use the documented module and package boundaries before editing shared code.

## No-Secret Policy

Do not commit:

- `.env`
- access tokens
- bot tokens
- private keys
- production database dumps
- local Docker volumes
- private analysis folders
- AI-agent work folders

The public template scope is documented in
`docs/product/enterprise/public-template-scope.md`.

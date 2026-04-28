---
name: tempot-module-development
description: Create, modify, validate, or review Tempot business modules under modules/. Use when adding module commands, handlers, services, repositories, locales, events, contracts, tests, module configuration, or when deciding whether new functionality belongs in a module versus a package, app, or future SaaS layer.
---

# Tempot Module Development

## Overview

Use this skill when working on `modules/`. Modules contain business logic and must remain isolated, event-driven, i18n-safe, and governed by SpecKit.

## Required Sources

Read:

- `.specify/memory/constitution.md`
- `docs/archive/developer/package-creation-checklist.md`
- `docs/archive/developer/workflow-guide.md`
- the relevant module directory
- the relevant `specs/{NNN}-{feature}/` artifacts
- `packages/module-registry` patterns

## Module Boundary

A module may depend on packages, but must not import another module directly. Communicate between modules via events only.

Use a package instead of a module when the work is reusable infrastructure or cross-module service behavior. Use an app when the work is interface-specific.

## Expected Structure

For a complete module, check for:

- `package.json` with `main`, `types`, `exports`, and scripts
- `tsconfig.json` with `outDir: dist`
- `vitest.config.ts`
- `.gitignore`
- `README.md`
- `index.ts`
- `module.config.ts`
- `abilities.ts`
- `locales/ar.json`
- `locales/en.json`
- `features/`
- `handlers/` or `commands/` when the module exposes bot behavior
- `repositories/` when it owns persistence
- `services/` for business logic
- `tests/`

## Implementation Rules

- Start from approved SpecKit artifacts.
- Use TDD for behavior changes.
- Keep user-facing text out of TypeScript source; use i18n keys.
- Use repositories for persistence, not direct Prisma calls in services.
- Emit and consume events through the event bus.
- Return `Result<T, AppError>` from fallible public APIs.
- Keep module toggle behavior compatible with the registry.
- Update docs and roadmap when module status changes.

## Validation

Run the narrowest relevant checks first, then broader gates:

- package/module test command
- `pnpm lint`
- `pnpm build`
- `pnpm test:unit`
- `pnpm spec:validate`
- `pnpm cms:check`

Use integration tests when repository, database, Redis, or event-bus behavior changes.

## SaaS Awareness

Keep current work in Tempot Core unless the Project Manager explicitly approves Tempot Cloud work. Do not introduce tenancy, billing, or managed-bot ownership changes as side effects of a module task.

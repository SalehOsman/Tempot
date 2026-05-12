# Bot Management Initial Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first verified `bot-management` implementation slice covering module skeleton, metadata, abilities, lifecycle contracts, event contracts, and validation schemas.

**Architecture:** `bot-management` is a Tempot business module under `modules/` and depends only on shared packages. This checkpoint intentionally avoids persistence, services, and Telegram handlers so the domain contracts are stable before behavior layers begin.

**Tech Stack:** TypeScript 5.9.3 strict mode, Vitest 4.1.0, CASL 6.x, zod 3.x, Tempot module registry, Tempot auth roles.

---

## Files

- Create `modules/bot-management/package.json`
- Create `modules/bot-management/tsconfig.json`
- Create `modules/bot-management/vitest.config.ts`
- Create `modules/bot-management/.gitignore`
- Create `modules/bot-management/README.md`
- Create `modules/bot-management/index.ts`
- Create `modules/bot-management/module.config.ts`
- Create `modules/bot-management/module.manifest.ts`
- Create `modules/bot-management/abilities.ts`
- Create `modules/bot-management/types/*.ts`
- Create `modules/bot-management/contracts/*.ts`
- Create `modules/bot-management/events/*.ts`
- Create `modules/bot-management/locales/ar.json`
- Create `modules/bot-management/locales/en.json`
- Create `modules/bot-management/tests/unit/*.test.ts`

## Task 1: RED Tests for Metadata, Abilities, Lifecycle, Events, and Schemas

- [ ] Create unit tests that import the planned public module contracts and assert:
  - module config exposes `bots` and `new_bot` commands
  - manifest declares selected blueprints and published events
  - admins can manage bot profiles while guests cannot
  - lifecycle transition matrix accepts only valid transitions
  - reason requirements are enforced for pause, maintenance, and archive transitions
  - bot profile schema rejects raw token output in export payloads
  - module enablement schema distinguishes `ENABLED`, `DISABLED`, `UNAVAILABLE`, and `BLOCKED`

- [ ] Run:

```powershell
pnpm exec vitest run modules/bot-management/tests/unit/module-metadata.test.ts modules/bot-management/tests/unit/lifecycle-transitions.test.ts modules/bot-management/tests/unit/schemas.test.ts --config modules/bot-management/vitest.config.ts
```

Expected RED result: tests fail because `modules/bot-management` implementation files do not exist yet.

## Task 2: GREEN Minimal Module Skeleton

- [ ] Create package infrastructure matching existing module patterns:
  - `main` and `types` point to `dist/`
  - `exports` exists
  - `build` and `test` scripts exist
  - `vitest` is exactly `4.1.0`
  - `.gitignore` excludes build artifacts and stale compiled files

- [ ] Create `module.config.ts`, `module.manifest.ts`, and `index.ts` with no Telegram handler registration yet. The default setup function can log that the module foundation loaded, but must not use `console.*`.

## Task 3: GREEN Domain Contracts

- [ ] Create strongly typed domain enums and interfaces for:
  - `ManagedBot`
  - `BotLifecycleStatus`
  - `BotRuntimeMode`
  - `BotHealthStatus`
  - `BotModuleEnablementState`
  - settings, import/export, and navigation state

- [ ] Create lifecycle transition helpers:
  - `canTransition(from, to)`
  - `requiresTransitionReason(from, to)`
  - `getTransitionPolicy(from, to)`

- [ ] Create zod schemas for bot profile, settings profile, module enablement, and import/export payloads.

- [ ] Create event name constants and payload types.

## Task 4: GREEN Ability Policy and Locales

- [ ] Create CASL ability helpers:
  - `botManagementAbilities(user)`
  - `canDoBotManagement(user, action, subject)`

- [ ] Create Arabic and English locale key files with command, menu, status, action, notification, import, export, and error groups.

## Task 5: Verify First Checkpoint

- [ ] Run the targeted unit tests from Task 1.
- [ ] Run `pnpm --filter @tempot/bot-management build`.
- [ ] Run `pnpm spec:validate`.
- [ ] Run `git diff --check`.

## Scope Boundary

This checkpoint does not implement repositories, services, Telegram command handlers, menus, persistence, import/export processing, search, notifications, or documentation sync beyond this execution plan. Those remain in later `tasks.md` phases and must continue with TDD.

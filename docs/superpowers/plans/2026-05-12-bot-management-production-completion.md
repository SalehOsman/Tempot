# Bot Management Production Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete `bot-management` as a production-ready operational module that is usable from Telegram after installation.

**Architecture:** The module remains under `modules/bot-management` and owns bot registry, lifecycle, settings, module enablement, template provenance, health, search, notification, import, and export behavior. Services use module repositories, publish events through the injected event bus, keep all user-facing text in locale files, and never expose raw credentials.

**Tech Stack:** TypeScript 5.9.3 strict mode, grammY 1.41.x, Vitest 4.1.0, neverthrow 8.2.0, Prisma-backed Tempot repositories, CASL permissions, Tempot module registry, settings, search, notifier, import, document, storage, and ux helper packages.

---

## Production Readiness Definition

`bot-management` is not complete until all of these are true:

- `/bots` opens a real admin menu backed by persisted records.
- `/new_bot` starts a validated registration flow and creates a `DRAFT` managed bot.
- Administrators can view, edit, archive, search, and filter managed bots.
- Lifecycle transitions enforce the approved state model and reason requirements.
- Settings profiles persist per bot and emit settings events.
- Module enablement persists `ENABLED`, `DISABLED`, `UNAVAILABLE`, and `BLOCKED` states.
- Provisioning preserves template and version attribution without direct module imports.
- Health snapshots are visible and notification requests are throttled for incident windows.
- Export/import preserve non-sensitive profile data and redact credentials.
- Documentation, roadmap, SpecKit tasks, locale files, and changesets match implementation state.
- `pnpm lint`, `pnpm build`, `pnpm test:unit`, relevant `pnpm test:integration`, `pnpm spec:validate`, `pnpm cms:check`, `pnpm boundary:audit`, `pnpm module:checklist`, and `git diff --check` pass.

## Checkpoint 1: Persistence and Registry Flow

**Files:**

- Create: `modules/bot-management/database/schema.prisma`
- Create: `modules/bot-management/repositories/*.ts`
- Create: `modules/bot-management/services/bot.service.ts`
- Create: `modules/bot-management/commands/bots.command.ts`
- Create: `modules/bot-management/commands/new-bot.command.ts`
- Create: `modules/bot-management/menus/bot-menu.factory.ts`
- Create: `modules/bot-management/menus/bot-detail.factory.ts`
- Create: `modules/bot-management/handlers/callback.handler.ts`
- Create: `modules/bot-management/handlers/text.handler.ts`
- Modify: `modules/bot-management/index.ts`
- Modify: `modules/bot-management/locales/ar.json`
- Modify: `modules/bot-management/locales/en.json`
- Test: `modules/bot-management/tests/unit/bot.service.test.ts`
- Test: `modules/bot-management/tests/unit/bot-commands.test.ts`
- Test: `modules/bot-management/tests/integration/bot-registry.integration.test.ts`

- [ ] **Step 1: Write RED tests**

Write tests proving that duplicate bot usernames are rejected, raw token values are redacted, `/bots` displays a menu, `/new_bot` starts registration, and detail views are built from service data.

- [ ] **Step 2: Verify RED**

Run:

```powershell
pnpm exec vitest run modules/bot-management/tests/unit/bot.service.test.ts modules/bot-management/tests/unit/bot-commands.test.ts --config modules/bot-management/vitest.config.ts
```

Expected: FAIL because the service, commands, and menus do not exist yet.

- [ ] **Step 3: Implement GREEN**

Add repositories, service methods, menus, commands, handlers, locale keys, and command registration in `index.ts`. Keep services repository-backed and event-driven. Store token fingerprints and redacted token display only.

- [ ] **Step 4: Verify GREEN**

Run the targeted unit tests and `pnpm --filter @tempot/bot-management build`.

- [ ] **Step 5: Update tracking**

Mark `T011` through `T025` complete only when persistence and US1 behavior are actually implemented and verified.

## Checkpoint 2: Lifecycle, Settings, and Module Enablement

**Files:**

- Create: `modules/bot-management/services/lifecycle.service.ts`
- Create: `modules/bot-management/services/settings-profile.service.ts`
- Create: `modules/bot-management/services/module-enablement.service.ts`
- Create: `modules/bot-management/menus/lifecycle-menu.factory.ts`
- Create: `modules/bot-management/menus/settings-menu.factory.ts`
- Create: `modules/bot-management/menus/module-enablements-menu.factory.ts`
- Modify: `modules/bot-management/handlers/callback.handler.ts`
- Modify: `modules/bot-management/handlers/text.handler.ts`
- Test: unit and integration tests for lifecycle, settings, and module enablement.

- [ ] **Step 1: Write RED tests**

Cover valid and invalid transitions, reason requirements, settings persistence, invalid settings rejection, module enable/disable, unavailable modules, blocked modules, and event publishing.

- [ ] **Step 2: Verify RED**

Run the targeted module tests and confirm failures come from missing behavior.

- [ ] **Step 3: Implement GREEN**

Implement services and menus using existing contracts and repository methods. Do not import other modules.

- [ ] **Step 4: Verify GREEN**

Run targeted unit and integration tests.

- [ ] **Step 5: Update tracking**

Mark `T026` through `T040` complete only after verified behavior exists.

## Checkpoint 3: Template Provisioning, Search, Health, Notifications

**Files:**

- Create: `modules/bot-management/services/provisioning.service.ts`
- Create: `modules/bot-management/services/bot-search.service.ts`
- Create: `modules/bot-management/services/health.service.ts`
- Create: `modules/bot-management/services/notification.service.ts`
- Create: `modules/bot-management/handlers/notification.handler.ts`
- Create: `modules/bot-management/menus/provisioning-menu.factory.ts`
- Create: `modules/bot-management/menus/health-menu.factory.ts`
- Create: `modules/bot-management/contracts/search-adapter.ts`
- Test: provisioning, search, health, and notification unit/integration tests.

- [ ] **Step 1: Write RED tests**

Cover template source attribution, blocked provisioning requirements, search/filter/pagination correctness, 1,000-record search target, health status changes, and flapping suppression.

- [ ] **Step 2: Verify RED**

Run targeted tests and confirm behavior is missing.

- [ ] **Step 3: Implement GREEN**

Implement services and handlers through package contracts, IDs, and events only.

- [ ] **Step 4: Verify GREEN**

Run targeted tests and performance assertions.

- [ ] **Step 5: Update tracking**

Mark `T041` through `T054` complete only after verified behavior exists.

## Checkpoint 4: Import, Export, Documentation, and Merge Gates

**Files:**

- Create: `modules/bot-management/services/export.service.ts`
- Create: `modules/bot-management/services/import.service.ts`
- Create: `modules/bot-management/menus/export-menu.factory.ts`
- Modify: `modules/bot-management/handlers/callback.handler.ts`
- Modify: `modules/bot-management/README.md`
- Modify: `docs/product/modules/bot-management.md`
- Modify: `docs/ROADMAP.md`
- Modify: `specs/040-bot-management/spec.md`
- Modify: `specs/040-bot-management/tasks.md`
- Create: `.changeset/*.md`
- Test: import/export redaction and round-trip tests.

- [ ] **Step 1: Write RED tests**

Cover export redaction, import validation, import into `DRAFT`, missing requirements, and non-sensitive round-trip preservation.

- [ ] **Step 2: Verify RED**

Run targeted import/export tests.

- [ ] **Step 3: Implement GREEN**

Implement import/export services and Telegram callbacks without exposing secrets.

- [ ] **Step 4: Documentation sync**

Update README, product docs, roadmap, SpecKit task status, spec status, and changeset so documentation matches the implemented module.

- [ ] **Step 5: Full verification**

Run:

```powershell
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
pnpm cms:check
pnpm boundary:audit
pnpm module:checklist
git diff --check
```

Expected: all commands exit 0 before merge or push.

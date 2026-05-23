# Module Flow Navigation Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove repeated self-navigation buttons and unhandled callbacks from active Telegram module flows.

**Architecture:** Keep ownership inside each module while applying one consistent rule: a page must not render the callback that opened the same page unless it performs a real state-changing action. Parent pages show child actions; leaf pages show parent/back/main actions only.

**Tech Stack:** TypeScript 5.9.3, grammY InlineKeyboard, Vitest 4.1.0, Tempot module runtime, `@tempot/ux-helpers`.

---

### Task 1: RED Tests For Leaf Menus

**Files:**
- Modify tests: `modules/notification-center/tests/runtime.test.ts`
- Modify tests: `modules/content-management/tests/runtime.test.ts`
- Modify tests: `modules/help-center/tests/runtime.test.ts`
- Modify tests: `modules/audit-viewer/tests/runtime.test.ts`
- Modify tests: `modules/settings-management/tests/runtime.test.ts`
- Modify tests: `modules/user-management/tests/handlers/callback.handler.test.ts`

- [x] Add tests that press each leaf callback and assert the rendered keyboard does not include that same callback.
- [x] Run each affected module test and confirm the new tests fail because the current menus repeat the selected callback.

Commands:

```powershell
pnpm --filter @tempot/notification-center test
pnpm --filter @tempot/content-management test
pnpm --filter @tempot/help-center test
pnpm --filter @tempot/audit-viewer test
pnpm --filter @tempot/settings-management test
```

Expected RED failures: assertions such as `expected callbacks not to contain notifications:preferences`.

### Task 2: GREEN Module Menu Fixes

**Files:**
- Modify source: `modules/notification-center/menus/notification-menu.factory.ts`
- Modify source: `modules/notification-center/handlers/callback.handler.ts`
- Modify source: `modules/notification-center/commands/notifications.command.ts`
- Modify source: `modules/content-management/menus/message-menu.factory.ts`
- Modify source: `modules/content-management/handlers/callback.handler.ts`
- Modify source: `modules/content-management/commands/messages.command.ts`
- Modify source: `modules/help-center/menus/help-menu.factory.ts`
- Modify source: `modules/help-center/handlers/callback.handler.ts`
- Modify source: `modules/help-center/commands/help.command.ts`
- Modify source: `modules/audit-viewer/menus/stats-menu.factory.ts`
- Modify source: `modules/audit-viewer/handlers/callback.handler.ts`
- Modify source: `modules/audit-viewer/commands/stats.command.ts`
- Modify source: `modules/settings-management/menus/settings-menu.factory.ts`
- Modify source: `modules/settings-management/handlers/callback.handler.ts`
- Modify source: `modules/user-management/menus/users-menu.factory.ts`

- [x] Add menu surface parameters or leaf menu factories in each module.
- [x] Parent surfaces keep child action buttons.
- [x] Leaf surfaces remove the selected callback and expose parent/back/main navigation.
- [x] Keep all user-facing text in existing i18n keys.

Expected GREEN result: affected module tests pass without relying on Telegram `message is not modified` for normal navigation.

### Task 3: Bot Management Unhandled Callback Fix

**Files:**
- Modify tests: `modules/bot-management/tests/unit/lifecycle-callback.handler.test.ts`
- Modify source: `modules/bot-management/handlers/callback.handler.ts`
- Modify source if needed: `modules/bot-management/menus/bot-menu.factory.ts`

- [x] Add RED tests for `botmgmt:settings:{id}` and `botmgmt:modules:{id}`.
- [x] Implement explicit localized responses for unavailable detail sections.
- [x] Prefer real read-only responses when existing services can supply enough bot detail context.

Expected GREEN result: both visible detail buttons produce an edit or an explicit localized error response.

### Task 4: Observability Migration Readiness

**Files:**
- Modify runtime startup in `docker-compose.yml` after checking the existing migration path.
- Do not add a workaround table creator in application code.

- [x] Verify the `interaction_events` migration exists.
- [x] Wire the expected Docker migration command so event persistence is not silently unavailable.
- [x] Re-run the database table check after applying the migration in the local Docker database.

Expected result:

```sql
select to_regclass('public.interaction_events');
```

returns `interaction_events`.

### Task 5: Verification

**Files:**
- No production files unless tests reveal a source defect.

- [x] Run affected module tests.
- [x] Run `pnpm build:bot-runtime`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm spec:validate`.
- [x] Run `pnpm cms:check`.
- [x] Run Docker build when local gates pass.
- [x] Run `pnpm test:unit`.
- [x] Run `pnpm test:integration`.

Commands:

```powershell
pnpm --filter @tempot/notification-center test
pnpm --filter @tempot/content-management test
pnpm --filter @tempot/help-center test
pnpm --filter @tempot/audit-viewer test
pnpm --filter @tempot/settings-management test
pnpm --filter @tempot/bot-management test
pnpm build:bot-runtime
pnpm lint
pnpm spec:validate
pnpm cms:check
docker compose build --no-cache --pull bot-server
```

# Notification Center Functional Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `notification-center` into the single functional operational notification module with real test delivery, governed flows, settings-backed preferences, recent activity, and no duplicate settings submenu.

**Architecture:** `notification-center` owns all `notifications:*` callbacks and renders surface-specific menus. `settings-management` links only to `notifications:preferences`. Runtime behavior uses `@tempot/ux-helpers`, the module event bus, and existing observability providers without adding new persistence.

**Tech Stack:** TypeScript 5.9.3 strict mode, grammY 1.41.x, Vitest 4.1.0, Tempot module registry, `@tempot/ux-helpers`, i18n JSON locales, module flow doctor.

---

## File Map

- Modify `specs/046-notification-center/spec.md`: functional source of truth.
- Modify `specs/046-notification-center/plan.md`: architecture and verification plan.
- Modify `specs/046-notification-center/data-model.md`: runtime entities and state transitions.
- Modify `specs/046-notification-center/research.md`: decisions and rejected fake-function alternatives.
- Modify `specs/046-notification-center/tasks.md`: ordered implementation tasks.
- Create `specs/046-notification-center/quickstart.md`: manual Telegram acceptance flows.
- Create `modules/notification-center/module.flow.json`: governed notification surfaces.
- Modify `modules/settings-management/module.flow.json`: remove settings duplicate test action.
- Modify `modules/notification-center/menus/notification-menu.factory.ts`: surface-specific keyboards.
- Modify `modules/notification-center/handlers/callback.handler.ts`: explicit action handling and settings-backed preference toggling.
- Modify `modules/notification-center/commands/notifications.command.ts`: use root surface renderer.
- Modify `modules/notification-center/index.ts`: module dependency types for activity providers.
- Modify `modules/notification-center/locales/ar.json`: Arabic text for all new surfaces.
- Modify `modules/notification-center/locales/en.json`: English text for all new surfaces.
- Modify `modules/notification-center/tests/runtime.test.ts`: runtime behavior tests.
- Modify `modules/settings-management/menus/settings-menu.factory.ts`: direct preferences link only.
- Modify `modules/settings-management/tests/runtime.test.ts`: no duplicate notification settings submenu.
- Modify `scripts/tempot/tests/unit/module-doctor.test.ts`: notification flow governance coverage.
- Modify `docs/developer/module-flow-governance.md`: add notification-center rollout.

## Task 1: Flow Governance RED Test

**Files:**
- Modify: `scripts/tempot/tests/unit/module-doctor.test.ts`
- Create later: `modules/notification-center/module.flow.json`

- [ ] **Step 1: Write the failing module doctor test**

Add a test beside the existing governed module tests:

```typescript
it('should pass notification-center flow governance when its flow map is complete', async () => {
  const result = await runModuleDoctor('notification-center');
  const flowFinding = result.findings.find((finding) => finding.name === 'Module flow map');
  expect(flowFinding?.status).toBe('pass');
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
pnpm vitest run --project=unit scripts/tempot/tests/unit/module-doctor.test.ts
```

Expected: FAIL because `modules/notification-center/module.flow.json` is missing or incomplete.

- [ ] **Step 3: Add the notification flow map**

Create `modules/notification-center/module.flow.json`:

```json
{
  "moduleName": "notification-center",
  "entryPoints": ["notifications"],
  "surfaces": [
    {
      "surfaceId": "notifications.main",
      "surfaceType": "parent",
      "openedBy": "notifications:view",
      "visibleActions": [
        "notifications:preferences",
        "notifications:test",
        "notifications:activity",
        "menu:main"
      ]
    },
    {
      "surfaceId": "notifications.preferences",
      "surfaceType": "leaf",
      "openedBy": "notifications:preferences",
      "visibleActions": ["notifications:view", "menu:main"]
    },
    {
      "surfaceId": "notifications.activity",
      "surfaceType": "leaf",
      "openedBy": "notifications:activity",
      "visibleActions": ["notifications:view", "menu:main"]
    },
    {
      "surfaceId": "notifications.test_result",
      "surfaceType": "result",
      "openedBy": "notifications:test",
      "visibleActions": ["notifications:test", "notifications:view", "menu:main"]
    }
  ],
  "callbackActions": [
    {
      "callbackData": "notifications:view",
      "actionKind": "navigation",
      "handlerStatus": "handled",
      "labelKey": "notification-center.menu.button"
    },
    {
      "callbackData": "notifications:preferences",
      "actionKind": "navigation",
      "handlerStatus": "handled",
      "labelKey": "notification-center.menu.preferences"
    },
    {
      "callbackData": "notifications:test",
      "actionKind": "state_change",
      "handlerStatus": "handled",
      "labelKey": "notification-center.menu.test"
    },
    {
      "callbackData": "notifications:activity",
      "actionKind": "navigation",
      "handlerStatus": "handled",
      "labelKey": "notification-center.menu.activity"
    }
  ],
  "exitPaths": ["menu:main"]
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run:

```powershell
pnpm vitest run --project=unit scripts/tempot/tests/unit/module-doctor.test.ts
```

Expected: PASS for the notification-center flow map test.

## Task 2: Remove Settings Duplication

**Files:**
- Modify: `modules/settings-management/menus/settings-menu.factory.ts`
- Modify: `modules/settings-management/tests/runtime.test.ts`
- Modify: `modules/settings-management/module.flow.json`

- [ ] **Step 1: Write the failing runtime test**

Update the existing notification settings test so the settings surface routes only to preferences:

```typescript
expect(callbacks).toContain('notifications:preferences');
expect(callbacks).toContain('settings:view');
expect(callbacks).toContain('menu:main');
expect(callbacks).not.toContain('notifications:test');
expect(callbacks).not.toContain('settings:notifications');
```

- [ ] **Step 2: Run the settings test and verify RED**

Run:

```powershell
pnpm --filter @tempot/settings-management test
```

Expected: FAIL because `notifications:test` is still visible inside Settings.

- [ ] **Step 3: Remove the duplicate test action from settings menu**

Change `createNotificationSettingsMenu` so it renders only the shared preferences destination plus navigation:

```typescript
function createNotificationSettingsMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('settings-management.menu.preferences'), 'notifications:preferences')
    .row()
    .text(t('settings-management.menu.settings'), 'settings:view')
    .text(t('settings-management.menu.back'), 'menu:main');
}
```

- [ ] **Step 4: Update settings flow map**

In `modules/settings-management/module.flow.json`, change `settings.notifications.visibleActions` to:

```json
["notifications:preferences", "settings:view", "menu:main"]
```

Change `exitPaths` to remove `notifications:test`.

- [ ] **Step 5: Run settings verification**

Run:

```powershell
pnpm --filter @tempot/settings-management test
pnpm tempot module doctor settings-management
```

Expected: both PASS.

## Task 3: Surface-Specific Notification Menus

**Files:**
- Modify: `modules/notification-center/menus/notification-menu.factory.ts`
- Modify: `modules/notification-center/tests/runtime.test.ts`

- [ ] **Step 1: Add menu callback tests**

Add helper `callbackDataFrom` in `modules/notification-center/tests/runtime.test.ts` matching the settings tests. Add tests for root, preferences, activity, and test result callbacks.

Root expected callbacks:

```typescript
expect(callbacks).toEqual([
  'notifications:test',
  'notifications:preferences',
  'notifications:activity',
  'menu:main',
]);
```

Preferences expected callbacks:

```typescript
expect(callbacks).toEqual(['notifications:view', 'menu:main']);
```

Activity expected callbacks:

```typescript
expect(callbacks).toEqual(['notifications:view', 'menu:main']);
```

Test result expected callbacks:

```typescript
expect(callbacks).toEqual(['notifications:test', 'notifications:view', 'menu:main']);
```

- [ ] **Step 2: Run notification tests and verify RED**

Run:

```powershell
pnpm --filter @tempot/notification-center test
```

Expected: FAIL because `createNotificationMenu` has only one static menu.

- [ ] **Step 3: Implement surface-specific menus**

Replace the factory with:

```typescript
import { InlineKeyboard } from 'grammy';

type TranslationFn = (key: string) => string;
export type NotificationMenuSurface = 'main' | 'preferences' | 'activity' | 'test-result';

export function createNotificationMenu(
  t: TranslationFn,
  surface: NotificationMenuSurface = 'main',
): InlineKeyboard {
  if (surface === 'preferences' || surface === 'activity') return createLeafMenu(t);
  if (surface === 'test-result') return createTestResultMenu(t);
  return createMainMenu(t);
}

function createMainMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('notification-center.menu.test'), 'notifications:test')
    .text(t('notification-center.menu.preferences'), 'notifications:preferences')
    .row()
    .text(t('notification-center.menu.activity'), 'notifications:activity')
    .row()
    .text(t('notification-center.menu.back'), 'menu:main');
}

function createLeafMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('notification-center.menu.center'), 'notifications:view')
    .row()
    .text(t('notification-center.menu.back'), 'menu:main');
}

function createTestResultMenu(t: TranslationFn): InlineKeyboard {
  return new InlineKeyboard()
    .text(t('notification-center.menu.test_again'), 'notifications:test')
    .row()
    .text(t('notification-center.menu.center'), 'notifications:view')
    .text(t('notification-center.menu.back'), 'menu:main');
}
```

- [ ] **Step 4: Run notification tests**

Run:

```powershell
pnpm --filter @tempot/notification-center test
```

Expected: menu tests PASS.

## Task 4: Real Test Notification Behavior

**Files:**
- Modify: `modules/notification-center/handlers/callback.handler.ts`
- Modify: `modules/notification-center/tests/runtime.test.ts`
- Modify: `modules/notification-center/locales/ar.json`
- Modify: `modules/notification-center/locales/en.json`

- [ ] **Step 1: Write RED tests for real visible test delivery**

Add a test for `notifications:test`:

```typescript
expect(deps.eventBus.publish).toHaveBeenCalledWith(
  'notification-center.notification.test_requested',
  expect.objectContaining({
    telegramId: '123',
    reference: expect.stringMatching(/^NTF-/),
  }),
);
expect(ctx.reply).toHaveBeenCalledWith(
  'notification-center.test.delivery_message',
  expect.any(Object),
);
expect(ctx.editMessageText).toHaveBeenCalledWith(
  expect.stringContaining('notification-center.view.test_result'),
  expect.any(Object),
);
```

Add a second test that calls the handler twice and asserts the second edit text differs because the result includes a new reference.

- [ ] **Step 2: Run notification tests and verify RED**

Run:

```powershell
pnpm --filter @tempot/notification-center test
```

Expected: FAIL because the handler currently only publishes an event and edits to a static result.

- [ ] **Step 3: Implement reference generation and visible delivery**

In the callback handler, generate a reference from the timestamp and send a visible test message to the current chat before rendering the result. Keep user-facing text in i18n keys and pass `reference` and `requestedAt` as interpolation options.

Required behavior:

```typescript
const requestedAt = new Date();
const reference = `NTF-${requestedAt.getTime().toString(36).toUpperCase()}`;
await publishTestRequest(ctx, { reference, requestedAt: requestedAt.toISOString() });
await ctx.reply(i18n.t('notification-center.test.delivery_message', { reference }), {
  parse_mode: 'HTML',
});
```

The result screen must use:

```typescript
i18n.t('notification-center.view.test_result', {
  reference,
  requestedAt: requestedAt.toISOString(),
})
```

- [ ] **Step 4: Add i18n keys**

English:

```json
"test": {
  "delivery_message": "<b>Test notification received.</b> Reference: {{reference}}"
}
```

Add the equivalent Arabic keys in `modules/notification-center/locales/ar.json`.
Also add `view.test_result`, `menu.test_again`, and `menu.center` in both
locale files.

- [ ] **Step 5: Run notification tests**

Run:

```powershell
pnpm --filter @tempot/notification-center test
```

Expected: PASS.

## Task 5: Settings-Backed Preference Surface

**Files:**
- Modify: `modules/notification-center/handlers/callback.handler.ts`
- Modify: `modules/notification-center/tests/runtime.test.ts`
- Modify: `modules/notification-center/locales/ar.json`
- Modify: `modules/notification-center/locales/en.json`

- [ ] **Step 1: Write RED test for settings-backed preferences**

Test `notifications:preferences` with `settings.get` returning `true`:

```typescript
expect(ctx.editMessageText).toHaveBeenCalledWith(
  'notification-center.view.preferences_enabled',
  expect.any(Object),
);
```

Assert the rendered menu includes the real toggle callback:

```typescript
expect(callbacks).toContain('notifications:toggle');
```

- [ ] **Step 2: Run notification tests and verify RED**

Run:

```powershell
pnpm --filter @tempot/notification-center test
```

Expected: FAIL until preferences rendering is settings-backed.

- [ ] **Step 3: Implement preference toggle rendering**

Use the existing `settings.get` provider to read `notifications_enabled`. Render enable or disable action based on the current value. Keep unsupported category, quiet-hours, and priority-rule buttons hidden.

Required user-visible meaning:

- notifications are globally enabled or disabled through a persisted setting
- the visible toggle changes that setting
- unsupported per-user options do not appear

- [ ] **Step 4: Run notification tests**

Run:

```powershell
pnpm --filter @tempot/notification-center test
```

Expected: PASS.

## Task 6: Recent Activity Surface

**Files:**
- Modify: `modules/notification-center/index.ts`
- Modify: `modules/notification-center/handlers/callback.handler.ts`
- Modify: `modules/notification-center/tests/runtime.test.ts`
- Modify: `modules/notification-center/locales/ar.json`
- Modify: `modules/notification-center/locales/en.json`

- [ ] **Step 1: Extend test deps with activity providers**

Update `createDeps` with:

```typescript
auditLog: { findMany: vi.fn().mockResolvedValue([]) },
interactionEvents: { findMany: vi.fn().mockResolvedValue([]) },
```

- [ ] **Step 2: Write RED tests for activity**

Add one empty-state test:

```typescript
expect(ctx.editMessageText).toHaveBeenCalledWith(
  'notification-center.view.activity_empty',
  expect.any(Object),
);
```

Add one populated test where `interactionEvents.findMany` returns a
notification callback record and assert the activity text includes the action
and status via i18n interpolation.

- [ ] **Step 3: Run notification tests and verify RED**

Run:

```powershell
pnpm --filter @tempot/notification-center test
```

Expected: FAIL until activity loading exists.

- [ ] **Step 4: Implement activity query**

Use `getDeps().interactionEvents.findMany` with a notification namespace filter and a small limit. If no interaction events exist, fall back to `auditLog.findMany` for `module = notification-center`. Render an explicit empty state when both are empty.

- [ ] **Step 5: Run notification tests**

Run:

```powershell
pnpm --filter @tempot/notification-center test
```

Expected: PASS.

## Task 7: Documentation and Locales Gate

**Files:**
- Modify: `docs/developer/module-flow-governance.md`
- Modify: `specs/052-module-flow-governance/tasks.md`
- Modify: `modules/notification-center/locales/ar.json`
- Modify: `modules/notification-center/locales/en.json`

- [ ] **Step 1: Add notification-center to governed modules documentation**

Add:

```markdown
- `notification-center`: functional operational notification center with
  preferences, activity, and real test delivery flow governance.
```

- [ ] **Step 2: Run locale and spec checks**

Run:

```powershell
pnpm cms:check
pnpm spec:validate
```

Expected: both PASS.

## Task 8: Final Verification

**Files:**
- No new file edits unless verification reveals a defect.

- [ ] **Step 1: Run narrow module gates**

Run:

```powershell
pnpm --filter @tempot/notification-center test
pnpm --filter @tempot/notification-center build
pnpm --filter @tempot/settings-management test
pnpm tempot module doctor notification-center
pnpm tempot module doctor settings-management
pnpm cms:check
pnpm spec:validate
```

Expected: all PASS.

- [ ] **Step 2: Run broader merge gates**

Run:

```powershell
pnpm lint
pnpm build:bot-runtime
```

Expected: both PASS.

- [ ] **Step 3: Manual Telegram test**

Use `specs/046-notification-center/quickstart.md` and execute one flow at a time in the bot. Stop and fix if any flow shows duplicate menus, fake actions, or unchanged callback responses.

## Self-Review

- Spec coverage: SC-001 through SC-015 are mapped to Tasks 1 through 8.
- Placeholder scan: no `TBD`, `TODO`, or deferred implementation placeholders are present.
- Type consistency: callback names match `notifications:*`, settings exits use `notifications:preferences`, and surface names match the planned `module.flow.json`.

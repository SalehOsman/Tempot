# Quickstart: Module Navigation Foundation

## Goal

Verify that `/start` renders only actions owned by enabled modules and that every visible action has a live handler.

## Scenario 1: Fresh Menu Has No Dead Buttons

1. Start the bot with current implemented modules enabled.
2. Send `/start`.
3. Confirm the rendered menu only includes actions with active owners.
4. Press every visible button.
5. Confirm no visible button triggers the shared unavailable-action fallback.

## Scenario 2: Role-Based Visibility

1. Use a standard user session.
2. Send `/start`.
3. Confirm admin-only actions are absent.
4. Use an admin or super admin session.
5. Send `/start`.
6. Confirm admin-capable module actions are visible only when their owners are enabled.

## Scenario 3: Disabled Owner

1. Disable a module that owns a menu contribution.
2. Restart the bot.
3. Send `/start`.
4. Confirm the disabled module's action is absent.
5. Press an old button for that action from a previous message.
6. Confirm the response explains that the action is unavailable and offers a path back to the valid menu.

## Scenario 4: Duplicate Owner Protection

1. Configure two enabled modules to claim the same callback action in a test fixture.
2. Start validation.
3. Confirm startup validation rejects the duplicate ownership before polling begins.

## Validation Commands

```powershell
pnpm --filter @tempot/module-registry test
pnpm --filter bot-server test
pnpm --filter @tempot/user-management test
pnpm spec:validate
pnpm cms:check
pnpm lint
pnpm build
```

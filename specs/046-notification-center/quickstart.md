# Quickstart: notification-center

## Local Verification

Run these checks after implementing the functional notification center:

```powershell
pnpm --filter @tempot/notification-center test
pnpm --filter @tempot/notification-center build
pnpm --filter @tempot/settings-management test
pnpm tempot module doctor notification-center
pnpm tempot module doctor settings-management
pnpm cms:check
pnpm spec:validate
```

Run before merge:

```powershell
pnpm lint
pnpm build:bot-runtime
```

## Telegram Acceptance Flow

### Flow 1 - Open Notification Center

1. Send `/start`.
2. Press the main menu notification center button.
3. Confirm the bot opens the notification center root surface.
4. Confirm the buttons are operational actions only:
   - preferences
   - test notification
   - recent activity
   - back

### Flow 2 - Open Preferences From Settings

1. Send `/start`.
2. Press the main menu settings button.
3. Press the notification preferences entry.
4. Confirm the bot opens `notifications:preferences` directly.
5. Confirm there is no duplicate settings-level notification submenu.
6. Confirm a notification enablement toggle is shown.
7. Press the toggle.
8. Confirm the updated enabled or disabled state is rendered.

### Flow 3 - Send Test Notification

1. Open the notification center.
2. Press the test notification action.
3. Confirm the bot produces a Telegram-visible test delivery.
4. Confirm the result surface includes a unique timestamp or reference.
5. Press the test action again.
6. Confirm a new result is produced and Telegram does not show the unchanged
   callback response.

### Flow 4 - Review Activity

1. Open the notification center.
2. Press recent activity.
3. Confirm the bot shows notification-related activity if records exist.
4. Confirm the bot shows a localized empty state if no records exist.

### Flow 5 - Back Navigation

1. From preferences, press back to notification center.
2. From activity, press back to notification center.
3. From notification center, press back to main menu.
4. Confirm no screen repeats the callback that opened it unless that callback is
   a real state-changing action.

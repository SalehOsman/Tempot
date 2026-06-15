# @tempot/notification-center

Active non-core module for notification inbox, preferences, recent activity,
and test delivery workflows.

- Command: `/notifications`
- Minimum role: `USER`
- Required package: `@tempot/notifier`
- Optional package: `@tempot/settings`
- Main callback namespace: `notifications:*`

```bash
pnpm --filter @tempot/notification-center build
pnpm --filter @tempot/notification-center test
```

Runtime text is provided through `locales/ar.json` and `locales/en.json`.

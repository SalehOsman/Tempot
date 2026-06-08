# @tempot/settings-management

Active non-core module that exposes user-facing settings and regional
configuration surfaces.

- Command: `/settings`
- Minimum role: `USER`
- Required package: `@tempot/settings`
- Optional package: `@tempot/ux-helpers`
- Main callback namespace: `settings:*`

```bash
pnpm --filter @tempot/settings-management build
pnpm --filter @tempot/settings-management test
```

Runtime text is provided through `locales/ar.json` and `locales/en.json`.

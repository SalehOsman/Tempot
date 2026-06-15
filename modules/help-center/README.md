# @tempot/help-center

Active non-core module that renders contextual help, available commands, and
support information inside Telegram.

- Command: `/help`
- Minimum role: `USER`
- Required package: `@tempot/i18n-core`
- Optional package: `@tempot/search-engine`
- Main callback namespace: `help:*`

```bash
pnpm --filter @tempot/help-center build
pnpm --filter @tempot/help-center test
```

Runtime text is provided through `locales/ar.json` and `locales/en.json`.

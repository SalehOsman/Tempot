# @tempot/content-management

Active non-core module that provides the Telegram content and message
management surface backed by the CMS engine.

- Command: `/messages`
- Minimum role: `USER`
- Required package: `@tempot/cms-engine`
- Optional package: `@tempot/search-engine`
- Main callback namespace: `messages:*`

```bash
pnpm --filter @tempot/content-management build
pnpm --filter @tempot/content-management test
```

Runtime text is provided through `locales/ar.json` and `locales/en.json`.

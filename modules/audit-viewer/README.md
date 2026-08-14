# @tempot/audit-viewer

Active non-core module that exposes operational statistics and recent
interaction audit data to administrators.

- Command: `/stats`
- Minimum role: `ADMIN`
- Required package: `@tempot/logger`
- Optional package: `@tempot/search-engine`
- Main callback namespace: `stats:*`

```bash
pnpm --filter @tempot/audit-viewer build
pnpm --filter @tempot/audit-viewer test
```

Runtime text is provided through `locales/ar.json` and `locales/en.json`.

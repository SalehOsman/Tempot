# @tempot/cms-engine

> Dynamic translation overrides via i18next custom backend. Enables editing translations from the Dashboard without redeployment.

## Purpose

Extends `@tempot/i18n-core` with a database-backed translation layer:

- i18next custom backend: cache-manager (Redis) → PostgreSQL → Static JSON fallback
- Cache invalidation via Event Bus when a translation is updated
- `Key Discovery` on startup — syncs new JSON keys to the database
- `Protected Keys` — legal and security texts that cannot be edited from the Dashboard
- Rollback support — restore any key to its previous value
- `pnpm cms:check` / `pnpm cms:sync` CLI commands

Disabled by default. Enable with `TEMPOT_DYNAMIC_CMS=true`.

## Phase

Phase 4 — Advanced Engines

## Dependencies

| Package | Purpose |
|---------|---------|
| `i18next` 23.x | Backend plugin interface |
| `@tempot/shared` | cache-manager (Redis → DB cache) |
| `@tempot/database` | Translation override storage |
| `@tempot/event-bus` | Cache invalidation on update |
| `@tempot/logger` | Missing key warnings |
| `@tempot/i18n-core` | Base i18n configuration |

## Resolution Fallback Chain

```
cache-manager (Redis) → PostgreSQL overrides → Static JSON → Error key + WARN log
```

## API

```typescript
// Enabled transparently — t() works identically whether CMS is on or off
import { t } from '@tempot/i18n-core'; // same function, different backend

// Admin updates a translation (via Dashboard)
await cmsEngine.updateTranslation({
  key: 'invoices.welcome_message',
  locale: 'ar',
  value: 'مرحباً بك في نظام الفواتير المحسّن',
});
// → cached in Redis, Event Bus notified, change live in < 1 second

// Rollback
await cmsEngine.rollback({ key: 'invoices.welcome_message', locale: 'ar' });
```

## Scripts

```bash
pnpm cms:check              # Verify all keys present in all locales
pnpm cms:sync               # Sync JSON keys to DB
pnpm cms:report             # Report orphaned/missing keys
```

## ADRs

- ADR-014 — i18next backends for CMS Engine

## Status

⏳ **Not yet implemented** — Phase 4

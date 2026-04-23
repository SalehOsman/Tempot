# @tempot/settings

> Hybrid settings management — static `.env` configuration + dynamic database-backed settings with real-time event propagation.

## Purpose

Unified settings layer combining two sources:

- **Static settings** — loaded from `.env` + Zod validation at boot (immutable at runtime)
- **Dynamic settings** — database-backed key/value pairs, changeable at runtime via admin commands
- **Event-driven updates** — publishes `settings.changed` events via Event Bus when dynamic values change
- **Maintenance mode** — built-in toggle with reason tracking and Event Bus notifications

Implementation follows ADR-007 (Hybrid Settings).

## Phase

Phase 1 — Core Bedrock

## Dependencies

| Package | Purpose |
|---------|---------|
| `@prisma/client` 7.x | Database access for dynamic settings |
| `@tempot/shared` | AppError, Result pattern |
| `@tempot/database` | Prisma client (dev dependency) |
| `neverthrow` 8.2.0 | Result pattern |
| `zod` 4.x | Schema validation for static settings |

## API

```typescript
import {
  StaticSettingsLoader,
  DynamicSettingsService,
  MaintenanceService,
  SettingsService,
  SettingsRepository,
} from '@tempot/settings';

// Static settings (loaded once at boot)
const staticLoader = new StaticSettingsLoader();
const config = staticLoader.load(); // Result<StaticSettings, AppError>

// Dynamic settings (database-backed)
const dynamicService = new DynamicSettingsService(deps);
await dynamicService.get('welcome_message');
await dynamicService.set('welcome_message', 'Hello!');

// Maintenance mode
const maintenance = new MaintenanceService(deps);
await maintenance.enable('System upgrade in progress');
await maintenance.disable();
await maintenance.getStatus();

// Unified facade
const settings = new SettingsService(staticLoader, dynamicService, maintenance);
```

## Exports

- **Types:** `StaticSettings`, `JoinMode`, `DynamicSettingKey`, `SettingChangedPayload`, `MaintenanceStatus`
- **Repository:** `SettingsRepository`, `SettingsRepositoryPort`
- **Services:** `StaticSettingsLoader`, `DynamicSettingsService`, `MaintenanceService`, `SettingsService`
- **Constants:** `DYNAMIC_SETTING_DEFAULTS`, `SETTINGS_ERRORS`

## ADRs

- ADR-007 — Hybrid Settings (static + dynamic)

## Status

✅ **Implemented** — Phase 1

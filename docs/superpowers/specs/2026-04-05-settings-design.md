# Design Spec — @tempot/settings (Hybrid Configuration System)

## 1. Overview

The `@tempot/settings` package provides a hybrid configuration system: static `.env` settings validated at startup via zod, and dynamic database settings with CRUD, caching (cache-manager, 5-min TTL), and event emission (Event Bus). It bridges ADR-007's architectural decision into a concrete, type-safe implementation.

## 2. Architecture & Components

### 2.1 StaticSettingsLoader

- Reads `process.env` and validates via a zod schema at startup.
- Returns `Result<StaticSettings, AppError>` — fail-fast on missing/invalid variables.
- Required variables: `BOT_TOKEN`, `DATABASE_URL`, `SUPER_ADMIN_IDS`, `DEFAULT_LANGUAGE`, `DEFAULT_COUNTRY`.
- `SUPER_ADMIN_IDS` parsed as comma-separated positive integers into `number[]`.
- Optional variables get defaults from the zod schema.

### 2.2 SettingsRepository (SettingsRepositoryPort)

- Prisma-based repository implementing the port interface for the `Setting` model.
- All CRUD methods return `AsyncResult<T>`.
- Hard-delete semantics (no soft-delete) — deleting returns the setting to its default.
- Does NOT extend `BaseRepository` — the `Setting` model uses a `key: String @id` primary key (not numeric `id`), so BaseRepository's assumptions do not apply.

### 2.3 DynamicSettingsService

- Type-safe CRUD over dynamic settings with `DynamicSettingKey` union type.
- Values stored as JSON-serialized strings in the `value: String` column. `set()` uses `JSON.stringify()` before writing; `get()` uses `JSON.parse()` and asserts against `DynamicSettingDefinitions[K]` for type safety.
- Cache key pattern: `settings:{key}`, TTL: `300_000` ms (5 minutes).
- Cache invalidation: immediate on any write (set/delete).
- Event emission on create, update, and delete via Event Bus. On `set()`, the service checks whether the key existed before the upsert: if it did not exist, emits `settings.setting.created`; if it did exist, emits `settings.setting.updated`. On `delete()`, emits `settings.setting.deleted`. On maintenance mode toggle, additionally emits `settings.maintenance.toggled`.
- Graceful degradation: returns `DYNAMIC_SETTING_DEFAULTS[key]` when DB is unavailable.
- Cache failure fallback: if CacheService operations fail, falls through to direct DB query via repository. Cache failures are logged but do not prevent settings from being read (NFR-005).

### 2.4 MaintenanceService

- Reads `maintenance_mode` from dynamic settings.
- Reads `superAdminIds` from static settings for bypass checks.
- Provides `getStatus(): AsyncResult<MaintenanceStatus>` where `MaintenanceStatus = { enabled: boolean; isSuperAdmin: (userId: number) => boolean }`. This matches the plan.md API shape (Task 5).

### 2.5 SettingsService (Facade)

- Unified public API composing StaticSettingsLoader + DynamicSettingsService + MaintenanceService.
- Single entry point for all consuming packages.

## 3. Design Decisions

### DC-1: ESM Module Format

**Decision**: Add `"type": "module"` to `package.json`. All local imports use `.js` extensions. Workspace imports use bare specifiers. The `exports` field uses `{ "import": ..., "types": ... }` pattern.

**Rationale**: All existing packages follow this convention. Consistency is mandatory.

### DC-2: No Toggle Guard

**Decision**: Settings is non-optional (spec requirement D3). No toggle file will be created.

**Rationale**: Unlike session-manager or event-bus, settings is a foundational dependency that all other packages require. A toggle would be meaningless.

### DC-3: AppError Constructor

**Decision**: Confirmed `constructor(code: string, details?: unknown)` aligns with plan usage.

**Rationale**: Verified against `packages/shared/src/shared.errors.ts` — matches the existing class definition.

### DC-4: CacheService API

**Decision**: Use `get<T>(key): AsyncResult<T | undefined | null>`, `set<T>(key, value, ttl?): AsyncResult<void>`, `del(key): AsyncResult<void>`. TTL in milliseconds: `300_000` for 5 minutes.

**Rationale**: Verified against `packages/shared/src/cache/cache.service.ts`. The actual API uses these exact signatures.

### DC-5: Event Registration (Inline Payloads)

**Decision**: All settings events in `TempotEvents` use inline payload shapes. No imports from `@tempot/settings`.

**Events**:

- `settings.setting.updated`: `{ key: string; oldValue: unknown; newValue: unknown; changedBy: string | null }`
- `settings.setting.created`: `{ key: string; oldValue: unknown; newValue: unknown; changedBy: string | null }`
- `settings.setting.deleted`: `{ key: string; oldValue: unknown; newValue: unknown; changedBy: string | null }`
- `settings.maintenance.toggled`: `{ enabled: boolean; changedBy: string | null }`

**Rationale**: All existing events in `event-bus.events.ts` define payloads inline. Event-bus must NOT depend on downstream packages to avoid circular dependencies.

### DC-6: DYNAMIC_SETTING_DEFAULTS Type Safety

**Decision**: Use a mapped type instead of `Record<DynamicSettingKey, unknown>`. Keys align exactly with spec FR-006/FR-007 and data-model.md:

```typescript
type JoinMode = 'AUTO' | 'REQUEST' | 'INVITE_ONLY' | 'CLOSED';

interface DynamicSettingDefinitions {
  join_mode: JoinMode;
  maintenance_mode: boolean;
  approval_role: string;
  backup_schedule: string;
  log_retention_days: number;
  dynamic_default_language: string;
}

type DynamicSettingKey = keyof DynamicSettingDefinitions;

const DYNAMIC_SETTING_DEFAULTS: { [K in DynamicSettingKey]: DynamicSettingDefinitions[K] } = {
  join_mode: 'AUTO',
  maintenance_mode: false,
  approval_role: '',
  backup_schedule: '',
  log_retention_days: 90,
  dynamic_default_language: '',
};
```

**Rationale**: Plan's `Record<DynamicSettingKey, unknown>` loses type safety at the value level. The mapped type preserves the relationship between each key and its value type.

### DC-7: Repository Prisma Client Typing

**Decision**: Define typed interfaces instead of using `Function` or `any`:

```typescript
interface SettingDelegate {
  findUnique(args: { where: { key: string } }): Promise<Setting | null>;
  findMany(): Promise<Setting[]>;
  upsert(args: {
    where: { key: string };
    create: SettingCreateInput;
    update: SettingUpdateInput;
  }): Promise<Setting>;
  delete(args: { where: { key: string } }): Promise<Setting>;
}

interface SettingsPrismaClient {
  setting: SettingDelegate;
}
```

**Rationale**: Plan used `{ setting: Record<string, Function> }` which violates Constitution Rule I (no `any` types — `Function` is effectively `any`). Typed interfaces provide compile-time safety.

### DC-8: Graceful Shutdown

**Decision**: Not needed. Do not implement `ShutdownManager` registration.

**Rationale**: Settings does not own long-lived resources. CacheService, EventBus, and Prisma are all externally managed and have their own shutdown hooks. YAGNI applies.

## 4. Pattern Alignments (from Existing Packages)

| Concern            | Convention                                                             | Source                         |
| ------------------ | ---------------------------------------------------------------------- | ------------------------------ |
| `tsconfig.json`    | Add `"noEmit": false`                                                  | session-manager                |
| `vitest.config.ts` | Import `serviceCoverageThresholds` from base; `testTimeout: 120_000`   | session-manager                |
| Barrel exports     | `export *` with `.js` extensions                                       | session-manager `index.ts`     |
| File naming        | `settings.{concern}.ts` (e.g., `settings.types.ts`)                    | session-manager pattern        |
| `AsyncResult`      | Import from `@tempot/shared`, not defined locally                      | shared package                 |
| `@prisma/client`   | Direct dependency (not peer dep)                                       | session-manager `package.json` |
| Env access         | `process.env['VAR_NAME']` bracket notation                             | session-manager convention     |
| Import style       | `import type` for type-only; `.js` for local files; bare for workspace | all packages                   |

## 5. Prisma Model

```prisma
model Setting {
  key         String    @id
  value       String
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdBy   String?
  updatedBy   String?

  @@map("settings")
}
```

No soft-delete fields. Hard-delete returns settings to defaults.

## 6. Testing Strategy

- **Unit tests**: StaticSettingsLoader validation (valid/invalid env), DynamicSettingsService CRUD with mocked repository/cache/events, MaintenanceService logic, type-safe defaults.
- **Integration tests**: Full Prisma repository against Testcontainers PostgreSQL. Cache integration with real cache-manager. End-to-end facade tests.
- **Coverage**: Service-level thresholds from `vitest.config.base` (`serviceCoverageThresholds`).

## 7. Dependencies

- `zod` — static settings validation
- `neverthrow` — Result pattern (Rule XXI)
- `@tempot/shared` — `AppError`, `AsyncResult`, `CacheService`
- `@tempot/event-bus` — event emission
- `@prisma/client` — database access (direct dependency, not peer dep — aligns with session-manager convention, overrides plan.md which incorrectly lists it as peerDependency)
- `pino` — logging (via `@tempot/logger`)

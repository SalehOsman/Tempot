# Data Model: Settings

## Entities

### `StaticSettings`

Typed representation of all required environment variables, validated once at startup via zod.

**Storage:** In-memory only (parsed from `process.env` at startup). Immutable after initialization — changes require a restart.

| Field             | Type       | Description                              | Constraints / Validation                                          |
| ----------------- | ---------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `botToken`        | `string`   | Telegram Bot API token from @BotFather   | Required, non-empty                                               |
| `databaseUrl`     | `string`   | PostgreSQL connection string             | Required, non-empty                                               |
| `superAdminIds`   | `number[]` | Telegram user IDs with full admin access | Required (may be empty array), each element is a positive integer |
| `defaultLanguage` | `string`   | Default language code (e.g., `"ar"`)     | Required, non-empty, default: `"ar"`                              |
| `defaultCountry`  | `string`   | Default country code (e.g., `"EG"`)      | Required, non-empty, default: `"EG"`                              |

**Validation:** All fields validated via zod schema at startup. `SUPER_ADMIN_IDS` is parsed from comma-separated string to `number[]`. Empty string yields empty array. Non-numeric values cause validation failure.

---

### `Setting` (Prisma Model)

Database entity for a single dynamic setting. Key-value pair with optional description.

**Storage:** PostgreSQL table `settings`, managed by Prisma 7.x. Accessed via `SettingsRepository` (never directly from services).

| Field         | Type       | Description                             | Constraints / Validation              |
| ------------- | ---------- | --------------------------------------- | ------------------------------------- |
| `key`         | `String`   | Unique setting identifier (primary key) | Required, PK, e.g., `"join_mode"`     |
| `value`       | `String`   | JSON-serialized setting value           | Required, JSON string                 |
| `description` | `String?`  | Human-readable description              | Optional                              |
| `createdAt`   | `DateTime` | Row creation timestamp                  | Required, auto-set, `@default(now())` |
| `updatedAt`   | `DateTime` | Last update timestamp                   | Required, auto-set, `@updatedAt`      |
| `createdBy`   | `String?`  | User ID who created the setting         | Optional (Rule XXVII audit field)     |
| `updatedBy`   | `String?`  | User ID who last updated the setting    | Optional (Rule XXVII audit field)     |

**Note:** No soft-delete fields (`isDeleted`, `deletedAt`, `deletedBy`). Settings use hard-delete because deleting a row causes the system to fall back to the built-in default — functionally equivalent to a "reset to default" operation.

**Prisma Schema:**

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

---

### `DynamicSettingDefinitions`

Type-safe mapping of known dynamic setting keys to their value types. Used at compile time for type safety.

**Storage:** None — compile-time type only.

| Key                        | Value Type | Default Value | Description                                                 |
| -------------------------- | ---------- | ------------- | ----------------------------------------------------------- |
| `join_mode`                | `JoinMode` | `"AUTO"`      | Bot join mode: AUTO, REQUEST, INVITE_ONLY, CLOSED           |
| `maintenance_mode`         | `boolean`  | `false`       | Whether maintenance mode is active                          |
| `approval_role`            | `string`   | `""`          | Role that can approve join requests (REQUEST mode)          |
| `backup_schedule`          | `string`   | `""`          | Cron expression for automated backups (empty = off)         |
| `log_retention_days`       | `number`   | `90`          | Days to keep audit logs before cleanup                      |
| `dynamic_default_language` | `string`   | `""`          | Runtime override of .env DEFAULT_LANGUAGE (empty = inherit) |

---

### `JoinMode`

Enum-like union type for bot join mode values.

**Storage:** Stored as JSON string in `Setting.value` column (e.g., `'"AUTO"'`).

| Value         | Description                                    |
| ------------- | ---------------------------------------------- |
| `AUTO`        | Anyone can join without approval               |
| `REQUEST`     | Users must request to join, approved by a role |
| `INVITE_ONLY` | Only invited users can join                    |
| `CLOSED`      | No new joins allowed                           |

---

### `SettingChangedPayload`

Event payload emitted when a dynamic setting is created, updated, or deleted.

**Storage:** Transient (event payload only, not persisted by the settings package). The Audit Log may persist it.

| Field       | Type      | Description                      | Constraints            |
| ----------- | --------- | -------------------------------- | ---------------------- |
| `key`       | `string`  | Setting key that changed         | Required               |
| `oldValue`  | `unknown` | Previous value (null for create) | Required (may be null) |
| `newValue`  | `unknown` | New value (null for delete)      | Required (may be null) |
| `changedBy` | `string?` | User ID who made the change      | Optional               |

---

### `MaintenanceModePayload`

Specialized event payload emitted when maintenance mode is toggled on or off.

**Storage:** Transient (event payload only).

| Field       | Type      | Description                               | Constraints |
| ----------- | --------- | ----------------------------------------- | ----------- |
| `enabled`   | `boolean` | Whether maintenance mode is now on or off | Required    |
| `changedBy` | `string?` | User ID who toggled maintenance mode      | Optional    |

---

### `MaintenanceStatus`

Runtime query result for maintenance mode status, including super admin check capability.

**Storage:** In-memory only (computed on each query).

| Field          | Type                          | Description                                  | Constraints         |
| -------------- | ----------------------------- | -------------------------------------------- | ------------------- |
| `enabled`      | `boolean`                     | Whether maintenance mode is currently active | Required            |
| `isSuperAdmin` | `(userId: number) => boolean` | Checks if a user ID is in SUPER_ADMIN_IDS    | Required (function) |

## Relationships

```
StaticSettings (in-memory, from .env)
  └── superAdminIds ──→ MaintenanceStatus.isSuperAdmin()

Setting (PostgreSQL table)
  └── 1:1 per key ──→ DynamicSettingDefinitions (type-safe access)
        ├── on write ──→ CacheService invalidation (settings:{key})
        └── on write ──→ EventBus emission (settings.setting.updated)
```

- `StaticSettings` and `Setting` are independent — static settings come from `.env`, dynamic settings come from PostgreSQL.
- `MaintenanceService` bridges both: reads `maintenance_mode` from dynamic settings, reads `superAdminIds` from static settings.
- `SettingsService` is the unified facade composing all three concerns.

## Storage Mechanisms

- **PostgreSQL:** One table `settings` for dynamic settings. Prisma 7.x as ORM. Accessed only through `SettingsRepository` (Rule XIV).
- **Cache:** `@tempot/shared` CacheService (cache-manager 6.x). Cache key pattern: `settings:{key}`. TTL: 5 minutes (300,000ms). Immediate invalidation on write operations.
- **In-memory:** `StaticSettings` parsed once at startup. `DYNAMIC_SETTING_DEFAULTS` constant for fallback values.

## Event Schema

Events follow the `{module}.{entity}.{action}` naming convention (validated by `validateEventName` from `@tempot/event-bus`).

| Event Name                     | Payload Type             | Emitted When                       | Level    |
| ------------------------------ | ------------------------ | ---------------------------------- | -------- |
| `settings.setting.updated`     | `SettingChangedPayload`  | Any dynamic setting is updated     | INTERNAL |
| `settings.setting.created`     | `SettingChangedPayload`  | A new dynamic setting is created   | INTERNAL |
| `settings.setting.deleted`     | `SettingChangedPayload`  | A dynamic setting is deleted       | INTERNAL |
| `settings.maintenance.toggled` | `MaintenanceModePayload` | Maintenance mode is toggled on/off | INTERNAL |

## Data Flow

```
Startup:
  process.env ──→ StaticSettingsLoader.load() ──→ StaticSettings (in-memory)

Read Dynamic Setting:
  SettingsService.getDynamic(key)
    └─→ CacheService.get("settings:{key}")
          ├── HIT ──→ return cached value
          └── MISS ──→ SettingsRepository.findByKey(key)
                          ├── FOUND ──→ cache value ──→ return
                          └── NOT FOUND ──→ return DYNAMIC_SETTING_DEFAULTS[key]

Write Dynamic Setting:
  SettingsService.setDynamic(key, value)
    └─→ SettingsRepository.upsert(key, value)
          └─→ CacheService.del("settings:{key}")
                └─→ EventBus.publish("settings.setting.updated", payload)
                      └─→ (if key === "maintenance_mode")
                            EventBus.publish("settings.maintenance.toggled", payload)

Database Unavailable (graceful degradation):
  SettingsRepository.findByKey(key) ──→ err(AppError)
    └─→ DynamicSettingsService catches ──→ return DYNAMIC_SETTING_DEFAULTS[key] + log warning
```

# Research: Settings

## Decisions

### 1. Environment Variable Validation Library

- **Decision:** Use `zod 3.24.x` for `.env` validation at startup.
- **Rationale:** Zod provides declarative schema definition with automatic type inference, transform support (e.g., parsing `SUPER_ADMIN_IDS` from comma-separated string to `number[]`), and detailed error messages that identify exactly which variable failed. The project already uses zod in other packages for validation.
- **Alternatives considered:** Manual validation with `if` checks (rejected — verbose, error-prone, no type inference). `envalid` (rejected — adds another validation library when zod is already in the project). `joi` (rejected — no TypeScript-first design, larger bundle).

### 2. Cache Layer

- **Decision:** Use `@tempot/shared` CacheService (wraps cache-manager 6.x) with cache key pattern `settings:{key}` and 5-minute TTL (300,000ms).
- **Rationale:** The CacheService is the project's standard cache abstraction, providing automatic fallback from external store (Redis) to in-memory cache on failure. It emits `system.alert.critical` events on degradation. Using it ensures consistency with other packages and avoids duplicating cache infrastructure. The 5-minute TTL is specified in ADR-007 and the architecture spec.
- **Alternatives considered:** Direct cache-manager usage (rejected — bypasses the project's standard abstraction and loses EventBus integration). Custom in-memory cache (rejected — reinvents existing infrastructure). No cache (rejected — violates NFR-001 and Constitution Rule XIX for < 2ms reads).

### 3. Database Access Pattern

- **Decision:** Repository pattern with `SettingsRepository` implementing `SettingsRepositoryPort` interface. Prisma client is injected via constructor. Services never call Prisma directly.
- **Rationale:** Constitution Rule XIV mandates the repository pattern. The port interface enables unit testing with mock implementations and allows future database migration without changing service code.
- **Alternatives considered:** Direct Prisma calls in service (rejected — violates Rule XIV). Generic repository base class (rejected — settings has a simple key-value model that doesn't benefit from a complex generic abstraction).

### 4. Dynamic Setting Value Storage

- **Decision:** Store dynamic setting values as JSON-serialized strings in a single `value: String` column. Deserialize to typed values using `JSON.parse` with the `DynamicSettingDefinitions` type map.
- **Rationale:** A single string column supports all value types (boolean, number, string, enum) without schema changes. JSON serialization is deterministic and reversible. The `DynamicSettingDefinitions` type map provides compile-time type safety for known keys while keeping the database schema simple and extensible.
- **Alternatives considered:** Separate columns per type (rejected — schema changes for each new setting type). PostgreSQL JSON column (rejected — Prisma `Json` type loses the explicitness of the string serialization, and settings values are simple scalars, not complex objects).

### 5. Event Emission Strategy

- **Decision:** Emit events via `@tempot/event-bus` EventBusOrchestrator. Three standard events (`settings.setting.created`, `settings.setting.updated`, `settings.setting.deleted`) plus one specialized event (`settings.maintenance.toggled`). Events are fire-and-forget — emission failures are logged but do not fail the write operation.
- **Rationale:** Constitution Rule XV mandates event-driven cross-module communication. The specialized `settings.maintenance.toggled` event simplifies consumer logic — subscribers don't need to filter `settings.setting.updated` events to find maintenance changes. Fire-and-forget ensures that event bus failures don't block operational settings changes.
- **Alternatives considered:** Only generic `settings.setting.updated` event (rejected — forces consumers to filter for specific keys, especially maintenance mode which has dedicated middleware). Synchronous event handling (rejected — settings changes must not be blocked by slow subscribers).

### 6. Soft Delete vs Hard Delete for Settings

- **Decision:** Use hard delete (no `isDeleted`, `deletedAt`, `deletedBy` audit fields). When a setting row is deleted, the system returns the built-in default value for that key.
- **Rationale:** Deleting a setting is functionally equivalent to "reset to default." Soft-deleting would create confusion: a soft-deleted row would still exist in the database but the system would need to filter it out, and the behavior would be identical to returning the default. Hard delete keeps the data model clean and the query logic simple.
- **Alternatives considered:** Soft delete per Constitution Rule XXVII (considered but rejected for settings specifically — Rule XXVII applies to business entities like users and sessions where deletion history matters. Settings are operational configuration, not user data. The audit trail is preserved via the `settings.setting.deleted` event and the Audit Log).

### 7. Prisma Model Design

- **Decision:** Single `Setting` model with `key` as primary key (`@id`), `value` as string, plus audit fields (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`). Table name `settings` via `@@map("settings")`.
- **Rationale:** Key-value design is the simplest model for a settings system with heterogeneous value types. Using `key` as the primary key eliminates the need for an auto-generated ID and enables direct lookups. The `@@map("settings")` follows the project's table naming convention.
- **Alternatives considered:** Auto-generated `id` with unique `key` index (rejected — `key` is the natural primary key, adding `id` is unnecessary indirection). EAV (Entity-Attribute-Value) pattern (rejected — overkill for a fixed set of known settings).

### 8. Graceful Degradation on Database Unavailability

- **Decision:** When the database is unreachable during a dynamic setting read, the service returns the built-in default value from `DYNAMIC_SETTING_DEFAULTS` and logs a warning via `@tempot/logger`. Write operations return an error (cannot write to an unavailable database).
- **Rationale:** NFR-004 requires graceful degradation for reads. Returning defaults ensures the bot continues functioning with safe values during database outages. Write operations cannot degrade — the user needs to know the change did not persist.
- **Alternatives considered:** Fail all operations when DB is unavailable (rejected — violates NFR-004, would make the bot non-functional during temporary database outages). Queue writes for later (rejected — adds complexity, stale data risk, and the settings package should not implement its own write queue).

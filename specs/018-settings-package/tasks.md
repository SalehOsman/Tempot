# Settings Package — Task Breakdown

**Feature:** 018-settings-package  
**Source:** spec.md (Complete) + plan.md + data-model.md + research.md  
**Generated:** 2026-04-05

---

## Task 0: Package Scaffolding

**Priority:** P0 (prerequisite for all other tasks)  
**Estimated time:** 5 min  
**FR:** None (infrastructure)

**Files to create:**

- `packages/settings/.gitignore`
- `packages/settings/tsconfig.json`
- `packages/settings/package.json`
- `packages/settings/vitest.config.ts`
- `packages/settings/src/index.ts` (empty barrel)
- `packages/settings/tests/unit/` (directory)
- `packages/settings/tests/integration/` (directory)

**Test file:** N/A (infrastructure only — validated by 10-point checklist)

**Acceptance criteria:**

- [x] All 10 points of `docs/developer/package-creation-checklist.md` pass
- [x] `.gitignore` includes: `dist/`, `node_modules/`, `*.tsbuildinfo`, `src/**/*.js`, `src/**/*.js.map`, `src/**/*.d.ts`, `src/**/*.d.ts.map`, `tests/**/*.js`, `tests/**/*.d.ts`
- [x] `tsconfig.json` extends `../../tsconfig.json`, has `"outDir": "dist"`, `"rootDir": "src"`
- [x] `package.json` has `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`, `"exports": { ".": "./dist/index.js" }`
- [x] `package.json` has exact versions: `vitest: "4.1.0"`, `typescript: "5.9.3"`, `neverthrow: "8.2.0"`
- [x] `vitest.config.ts` exists with unit and integration test projects
- [x] `src/index.ts` exists as empty barrel file
- [x] No compiled artifacts in `src/`

---

## Task 1: Type Definitions and Error Codes

**Priority:** P0 (dependency for all service tasks)  
**Estimated time:** 5 min  
**FR:** FR-010 (Result pattern), FR-011 (no `any`), FR-006 (JoinMode), FR-012 (no hardcoded values)

**Files to create:**

- `packages/settings/src/settings.types.ts`
- `packages/settings/src/settings.errors.ts`

**Test file:** `packages/settings/tests/unit/settings.types.test.ts`

**Acceptance criteria:**

- [x] `StaticSettings` interface exported with typed fields: `botToken`, `databaseUrl`, `superAdminIds`, `defaultLanguage`, `defaultCountry`
- [x] `JoinMode` type exported: `'AUTO' | 'REQUEST' | 'INVITE_ONLY' | 'CLOSED'`
- [x] `DynamicSettingDefinitions` interface exported mapping all 6 known keys to typed values
- [x] `DynamicSettingKey` type exported as `keyof DynamicSettingDefinitions`
- [x] `DynamicSettingRecord` interface exported matching Prisma `Setting` model shape
- [x] `SettingChangedPayload` interface exported: `{ key, oldValue, newValue, changedBy }`
- [x] `MaintenanceModePayload` interface exported: `{ enabled, changedBy }`
- [x] `MaintenanceStatus` interface exported: `{ enabled, isSuperAdmin }`
- [x] `DYNAMIC_SETTING_DEFAULTS` constant exported with all 6 keys and default values
- [x] `SETTINGS_ERRORS` constant exported with hierarchical error codes (`settings.static.*`, `settings.dynamic.*`, `settings.cache.*`, `settings.repository.*`)
- [x] All settings that could change are externalized — no hardcoded user-facing text or business logic values (FR-012)
- [x] No `any` types
- [x] All tests pass

---

## Task 2: Static Settings Loader (.env Validation)

**Priority:** P0 (required at startup — fail-fast)  
**Estimated time:** 10 min  
**FR:** FR-001, FR-002  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/settings/src/static-settings.loader.ts`

**Test file:** `packages/settings/tests/unit/static-settings.loader.test.ts`

**Acceptance criteria:**

- [x] `StaticSettingsLoader.load()` returns `Result<StaticSettings, AppError>`
- [x] Validates all 5 required env vars: `BOT_TOKEN`, `DATABASE_URL`, `SUPER_ADMIN_IDS`, `DEFAULT_LANGUAGE`, `DEFAULT_COUNTRY`
- [x] Returns `err` with code `settings.static.validation_failed` when any required variable is missing
- [x] Parses `SUPER_ADMIN_IDS` from comma-separated string to `number[]`
- [x] Empty `SUPER_ADMIN_IDS` (`""`) yields empty array `[]`
- [x] Non-numeric `SUPER_ADMIN_IDS` returns validation error
- [x] Uses zod for schema validation with transform support
- [x] Bot fails fast at startup when required .env variables are missing (SC-009)
- [x] Completes in < 100ms (NFR-002, SC-002) — benchmark test required
- [x] No `any` types
- [x] All tests pass (minimum 4: happy path, missing var, empty admin IDs, invalid admin IDs)

---

## Task 3: Settings Repository (Database Abstraction)

**Priority:** P0 (dependency for dynamic settings service)  
**Estimated time:** 10 min  
**FR:** FR-003 (CRUD), FR-010 (Result pattern)  
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/settings/src/settings.repository.ts`

**Test file:** `packages/settings/tests/unit/settings.repository.test.ts`

**Acceptance criteria:**

- [x] `SettingsRepositoryPort` interface exported with methods: `findByKey`, `findAll`, `upsert`, `deleteByKey`
- [x] `SettingsRepository` class implements `SettingsRepositoryPort`
- [x] Prisma client injected via constructor (Rule XIV — no direct Prisma calls in services)
- [x] `findByKey(key)` returns `AsyncResult<DynamicSettingRecord | null>`
- [x] `findAll()` returns `AsyncResult<DynamicSettingRecord[]>`
- [x] `upsert(key, value, updatedBy)` returns `AsyncResult<DynamicSettingRecord>`
- [x] `deleteByKey(key)` returns `AsyncResult<DynamicSettingRecord>`
- [x] All methods wrap Prisma errors in `AppError` with code `settings.repository.error`
- [x] No `any` types (mock Prisma client typed appropriately in tests)
- [x] All tests pass (minimum 4: find existing, find missing, upsert, delete)

---

## Task 4: Dynamic Settings Service (CRUD + Cache + Events)

**Priority:** P0 (core functionality)  
**Estimated time:** 15 min  
**FR:** FR-003, FR-004, FR-006, FR-007, FR-008, FR-009  
**Dependencies:** Task 1, Task 3

**Files to create:**

- `packages/settings/src/dynamic-settings.service.ts`

**Test file:** `packages/settings/tests/unit/dynamic-settings.service.test.ts`

**Acceptance criteria:**

- [x] `get<K extends DynamicSettingKey>(key: K)` returns `AsyncResult<DynamicSettingDefinitions[K]>`
- [x] `get()` checks cache first (`settings:{key}`), falls back to database on miss
- [x] `get()` returns `DYNAMIC_SETTING_DEFAULTS[key]` when no DB row exists (FR-009)
- [x] All dynamic settings return correct defaults on first deployment with empty database (SC-004)
- [x] `get()` returns `DYNAMIC_SETTING_DEFAULTS[key]` and logs warning when DB is unavailable (NFR-004)
- [x] System degrades gracefully when database is unavailable — returns defaults instead of errors (SC-010)
- [x] `get()` for unknown key returns `err` with code `settings.dynamic.unknown_key`
- [x] `set<K>(key, value, updatedBy?)` upserts DB → invalidates cache → emits `settings.setting.updated`
- [x] `set('maintenance_mode', ...)` additionally emits `settings.maintenance.toggled`
- [x] `delete(key)` deletes DB → invalidates cache → emits `settings.setting.deleted`
- [x] Setting change events are emitted for all create/update/delete operations (SC-006)
- [x] Cache key pattern: `settings:{key}`, TTL: 300,000ms (5 minutes)
- [x] Cached reads complete in < 2ms (NFR-001, SC-001) — benchmark test required
- [x] Cache invalidation is immediate — no stale reads after writes (NFR-003, SC-003)
- [x] Event payloads include `key`, `oldValue`, `newValue`, `changedBy`
- [x] Event emission failures are logged but do not fail the write operation
- [x] All methods return `Result<T, AppError>` — no thrown exceptions (FR-010)
- [x] No `any` types (FR-011)
- [x] All tests pass (minimum 7: cache hit, cache miss, default fallback, DB unavailable, set+invalidate, delete+invalidate, maintenance toggle event)

---

## Task 5: Maintenance Mode Helper

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** FR-005  
**Dependencies:** Task 2, Task 4

**Files to create:**

- `packages/settings/src/maintenance.service.ts`

**Test file:** `packages/settings/tests/unit/maintenance.service.test.ts`

**Acceptance criteria:**

- [x] `MaintenanceService` constructor takes `DynamicSettingsService` and `StaticSettings`
- [x] `getStatus()` returns `AsyncResult<MaintenanceStatus>`
- [x] `MaintenanceStatus.enabled` reflects current `maintenance_mode` dynamic setting
- [x] `MaintenanceStatus.isSuperAdmin(userId)` checks against `StaticSettings.superAdminIds`
- [x] When `maintenance_mode` read fails, defaults to `enabled: false` (safe fallback)
- [x] SUPER_ADMIN can always bypass (returns `true` for IDs in the list) (SC-005)
- [x] Regular user returns `false` for `isSuperAdmin` (SC-005)
- [x] No `any` types
- [x] All tests pass (minimum 4: disabled status, enabled status, super admin check true, super admin check false)

---

## Task 6: Unified SettingsService Facade

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** All (unified access point)  
**Dependencies:** Task 2, Task 4, Task 5

**Files to create:**

- `packages/settings/src/settings.service.ts`

**Test file:** `packages/settings/tests/unit/settings.service.test.ts`

**Acceptance criteria:**

- [x] `SettingsService` composes `StaticSettingsLoader`, `DynamicSettingsService`, `MaintenanceService`
- [x] `getStatic()` returns `Result<StaticSettings, AppError>` (sync — returns cached startup result)
- [x] `getDynamic<K>(key)` delegates to `DynamicSettingsService.get(key)`
- [x] `setDynamic<K>(key, value, updatedBy?)` delegates to `DynamicSettingsService.set(key, value, updatedBy)`
- [x] `deleteDynamic(key)` delegates to `DynamicSettingsService.delete(key)`
- [x] `getMaintenanceStatus()` delegates to `MaintenanceService.getStatus()`
- [x] All methods return `Result<T, AppError>` — no thrown exceptions (FR-010)
- [x] No `any` types (FR-011)
- [x] All tests pass (minimum 5: getStatic, getDynamic, setDynamic, deleteDynamic, getMaintenanceStatus)

---

## Task 7: Prisma Schema Addition

**Priority:** P0 (database infrastructure)  
**Estimated time:** 5 min  
**FR:** FR-003 (database storage for dynamic settings)  
**Dependencies:** Task 0

**Files to update:**

- `packages/database/prisma/schema.prisma`

**Test file:** N/A (validated by `npx prisma validate`)

**Acceptance criteria:**

- [x] `Setting` model added with `key` as `@id`, `value` as `String`, `description` as `String?`
- [x] Audit fields: `createdAt`, `updatedAt`, `createdBy`, `updatedBy` (Rule XXVII)
- [x] No soft-delete fields (hard delete — see research.md Decision 6)
- [x] Table name `settings` via `@@map("settings")`
- [x] `npx prisma validate` passes
- [x] `npx prisma generate` succeeds

---

## Task 8: Event Registration

**Priority:** P1 (required for event-driven architecture)  
**Estimated time:** 5 min  
**FR:** FR-008 (event emission)  
**Dependencies:** Task 1

**Files to update:**

- `packages/event-bus/src/event-bus.events.ts`

**Test file:** N/A (type-level registration — verified by build)

**Acceptance criteria:**

- [x] `settings.setting.updated` event type registered with `SettingChangedPayload`
- [x] `settings.setting.created` event type registered with `SettingChangedPayload`
- [x] `settings.setting.deleted` event type registered with `SettingChangedPayload`
- [x] `settings.maintenance.toggled` event type registered with `MaintenanceModePayload`
- [x] All event names follow `{module}.{entity}.{action}` convention
- [x] Build passes with new event types

---

## Task 9: Barrel Exports (`src/index.ts`)

**Priority:** P1 (final integration)  
**Estimated time:** 5 min  
**FR:** All (public API surface)  
**Dependencies:** Task 1, 2, 3, 4, 5, 6

**Files to update:**

- `packages/settings/src/index.ts`

**Test file:** All existing tests continue to pass

**Acceptance criteria:**

- [x] Exports all types: `StaticSettings`, `JoinMode`, `DynamicSettingKey`, `DynamicSettingDefinitions`, `DynamicSettingRecord`, `SettingChangedPayload`, `MaintenanceModePayload`, `MaintenanceStatus`
- [x] Exports constants: `DYNAMIC_SETTING_DEFAULTS`, `SETTINGS_ERRORS`
- [x] Exports services: `StaticSettingsLoader`, `SettingsRepository`, `DynamicSettingsService`, `MaintenanceService`, `SettingsService`
- [x] Exports port interface: `SettingsRepositoryPort`
- [x] All existing tests still pass after barrel update
- [x] 10-point package-creation-checklist passes final verification
- [x] No `any` types in any file across the package (SC-008)
- [x] All public methods return `Result<T, AppError>` — zero thrown exceptions (SC-007)

---

## Task 10: Integration Tests (Testcontainers)

**Priority:** P2 (validation)  
**Estimated time:** 15 min  
**FR:** All (end-to-end validation)  
**Dependencies:** Task 7, Task 9

**Files to create:**

- `packages/settings/tests/integration/settings.integration.test.ts`

**Test file:** Self (integration test)

**Acceptance criteria:**

- [x] Full CRUD flow: create → read → update → read → delete → read (returns default)
- [x] Cache behavior: read after write returns fresh value (cache invalidated)
- [x] Default values: empty database returns all defaults from `DYNAMIC_SETTING_DEFAULTS`
- [x] Maintenance mode: enable → check status → disable → check status
- [x] Event emission: verify events emitted for create, update, delete operations
- [x] Uses Testcontainers 8.0.1 for PostgreSQL
- [x] All tests pass

---

## Task Dependency Graph

```
Task 0 (scaffolding) ─┬─→ Task 1 (types + errors) ─┬─→ Task 2 (static loader) ────┐
                       │                              ├─→ Task 3 (repository) ──────┤
                       │                              └─→ Task 8 (event registration)│
                       └─→ Task 7 (Prisma schema)                                   │
                                                                                     │
                                          Task 3 + Task 1 ──→ Task 4 (dynamic svc) ─┤
                                                                                     │
                                          Task 2 + Task 4 ──→ Task 5 (maintenance) ─┤
                                                                                     │
                                     Task 2 + Task 4 + Task 5 ──→ Task 6 (facade) ──┤
                                                                                     │
                              Task 1-6 ──→ Task 9 (barrel exports) ──────────────────┤
                                                                                     │
                              Task 7 + Task 9 ──→ Task 10 (integration tests) ───────┘
```

## Summary

| Task      | Name                      | Priority | Est. Time  | FR Coverage            |
| --------- | ------------------------- | -------- | ---------- | ---------------------- |
| 0         | Package Scaffolding       | P0       | 5 min      | Infrastructure         |
| 1         | Type Definitions + Errors | P0       | 5 min      | FR-010, FR-011, FR-006 |
| 2         | Static Settings Loader    | P0       | 10 min     | FR-001, FR-002         |
| 3         | Settings Repository       | P0       | 10 min     | FR-003, FR-010         |
| 4         | Dynamic Settings Service  | P0       | 15 min     | FR-003–FR-009          |
| 5         | Maintenance Mode Helper   | P1       | 5 min      | FR-005                 |
| 6         | SettingsService Facade    | P1       | 10 min     | All                    |
| 7         | Prisma Schema Addition    | P0       | 5 min      | FR-003                 |
| 8         | Event Registration        | P1       | 5 min      | FR-008                 |
| 9         | Barrel Exports            | P1       | 5 min      | All                    |
| 10        | Integration Tests         | P2       | 15 min     | All                    |
| **Total** |                           |          | **90 min** |                        |

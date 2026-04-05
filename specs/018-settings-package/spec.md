# Feature Specification: Settings (Hybrid Configuration System)

**Feature Branch**: `018-settings-package`
**Created**: 2026-04-05
**Updated**: 2026-04-05
**Status**: Complete
**Input**: User description: "Build the settings package that provides a hybrid configuration system — static .env settings for sensitive/structural config, dynamic database settings for runtime-changeable operational config."
**Architecture Reference**: Section 11 of `docs/tempot_v11_final.md`
**ADR Reference**: ADR-007 (Hybrid Settings Approach)

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Static Configuration at Startup (Priority: P0)

As the system operator, I want the bot to read sensitive and structural configuration from environment variables at startup and validate them immediately, so that misconfiguration is caught before the bot starts serving users.

**Why this priority**: Without valid static settings (bot token, database URL, admin IDs), the bot cannot function at all. Fail-fast validation prevents silent failures.

**Independent Test**: Set required environment variables, call the static settings loader, and verify all values are returned with correct types. Remove a required variable and verify the system returns an error immediately.

**Acceptance Scenarios**:

1. **Given** all required environment variables are set (BOT_TOKEN, DATABASE_URL, SUPER_ADMIN_IDS, DEFAULT_LANGUAGE, DEFAULT_COUNTRY), **When** the settings service initializes, **Then** all static settings are accessible as typed values with no runtime errors.
2. **Given** a required environment variable (e.g., BOT_TOKEN) is missing, **When** the settings service initializes, **Then** it returns an error immediately with a clear message identifying the missing variable — the bot does not start.
3. **Given** SUPER_ADMIN_IDS contains a comma-separated list (e.g., "123,456,789"), **When** the settings service initializes, **Then** it parses them into an array of numbers and validates each is a positive integer.
4. **Given** DEFAULT_LANGUAGE is set to "ar" and DEFAULT_COUNTRY is set to "EG", **When** the settings service initializes, **Then** these values are accessible as typed strings to any consuming package.

---

### User Story 2 — Dynamic Settings CRUD (Priority: P0)

As the SUPER_ADMIN, I want to change operational settings (join mode, maintenance mode, default language) from the Dashboard at runtime without restarting the bot, so that I can respond to operational needs immediately.

**Why this priority**: Runtime configurability is the core value proposition of the settings package. Without it, every operational change requires a deployment.

**Independent Test**: Create a dynamic setting, read it back, update it, read again, and verify the update is reflected. Verify cache is invalidated immediately on update and repopulated on next read.

**Acceptance Scenarios**:

1. **Given** the bot is running, **When** the SUPER_ADMIN changes the join mode from AUTO to CLOSED via the Dashboard, **Then** the change takes effect immediately without a restart — new join requests are rejected.
2. **Given** a dynamic setting was last read 2 minutes ago (within cache TTL), **When** the setting is read again, **Then** the cached value is returned without a database query.
3. **Given** a dynamic setting was just updated, **When** the setting is read immediately after, **Then** the fresh value from the database is returned (cache was invalidated on update).
4. **Given** a dynamic setting has never been set (first deployment), **When** the setting is read, **Then** a sensible default value is returned (e.g., join mode defaults to AUTO).

---

### User Story 3 — Maintenance Mode (Priority: P1)

As the SUPER_ADMIN, I want to enable maintenance mode so that regular users see a maintenance message while I continue using the bot normally to perform administrative tasks.

**Why this priority**: Maintenance mode is a critical operational tool that must work correctly to avoid locking out the admin or silently letting users through.

**Independent Test**: Enable maintenance mode, verify SUPER_ADMIN can use the bot, verify a regular user receives the maintenance message. Verify the activation/deactivation is logged in the Audit Log.

**Acceptance Scenarios**:

1. **Given** maintenance mode is enabled, **When** SUPER_ADMIN sends a command, **Then** the bot responds normally as if maintenance mode is off.
2. **Given** maintenance mode is enabled, **When** a regular user sends a command, **Then** the bot responds with the maintenance message (i18n-translated) and does not process the command.
3. **Given** maintenance mode is enabled, **When** SUPER_ADMIN disables it, **Then** regular users can immediately use the bot again.
4. **Given** maintenance mode is toggled (on or off), **Then** the activation/deactivation event is emitted for audit logging purposes.

---

### User Story 4 — Setting Change Events (Priority: P1)

As a consuming package, I want to receive events when dynamic settings change so that I can react to configuration changes without polling.

**Why this priority**: Event-driven architecture is a constitutional requirement (Rule XV). Other packages need to know when settings change to update their behavior.

**Independent Test**: Subscribe to setting change events, update a dynamic setting, verify the event is received with the correct payload (setting key, old value, new value).

**Acceptance Scenarios**:

1. **Given** a consumer subscribes to setting change events, **When** the join mode is changed from AUTO to CLOSED, **Then** the consumer receives an event with the setting key, old value ("AUTO"), and new value ("CLOSED").
2. **Given** maintenance mode is toggled, **Then** a specific maintenance mode event is emitted in addition to the general setting change event.
3. **Given** no consumers are subscribed, **When** a setting is changed, **Then** the event is still emitted (fire-and-forget) — no errors occur.

---

## Edge Cases

- **Missing Required Static Setting**: If any required environment variable is missing at startup, the system MUST return an error immediately. The bot must not start with incomplete configuration. The error message must clearly identify which variable is missing.
- **Invalid SUPER_ADMIN_IDS Format**: If SUPER_ADMIN_IDS contains non-numeric values or is malformed, the system returns an error at startup. Empty SUPER_ADMIN_IDS is allowed (results in empty array — no super admin access).
- **First Deployment (Empty Database)**: When the dynamic settings table has no rows, all dynamic settings must return their documented default values. The system does not require database seeding — defaults are built into the application logic.
- **Database Unavailable During Read**: If the database is unreachable when reading a dynamic setting and the cache is empty (cold start), the system returns the built-in default value and logs a warning. It does not fail with an error for non-critical settings.
- **Cache Failure**: If the cache layer fails, the system falls back to direct database queries. Cache failures are logged but do not prevent settings from being read.
- **Concurrent Updates**: If two updates to the same setting arrive simultaneously, the last-write-wins strategy applies (standard database behavior). Cache invalidation ensures the latest value is always read after any write.
- **Setting Key Not Found**: If a consumer requests a dynamic setting key that does not exist in the database, the system returns the built-in default for known keys, or an error for unknown keys.
- **Maintenance Mode and SUPER_ADMIN**: When maintenance mode is active, the settings package provides a method to check maintenance status and whether a given user ID is in the SUPER_ADMIN list. The actual middleware enforcement (blocking user commands) is the responsibility of the bot-server or a middleware layer — the settings package only provides the data.

## Design Decisions & Clarifications

### D1. Hybrid Approach (ADR-007)

The system uses a hybrid approach: sensitive/structural settings in environment variables (require restart to change), operational settings in database (changeable at runtime). This decision is documented in ADR-007 and is non-negotiable.

**Static settings** (environment variables):

- BOT_TOKEN — bot authentication token
- DATABASE_URL — database connection string
- SUPER_ADMIN_IDS — comma-separated Telegram user IDs with full access
- DEFAULT_LANGUAGE — default language code (e.g., "ar")
- DEFAULT_COUNTRY — default country code (e.g., "EG")

**Dynamic settings** (database):

- Join mode — AUTO | REQUEST | INVITE_ONLY | CLOSED
- Maintenance mode — boolean (on/off)
- Approval role — which role can approve join requests in REQUEST mode
- Backup scheduling — cron expression or interval for automated backups
- Log retention period — days to keep audit logs before cleanup
- Dynamic default language — overrides the .env DEFAULT_LANGUAGE at runtime

### D2. Cache Strategy

Dynamic settings are cached with a 5-minute TTL. On any update (create/update/delete), the cache entry for that setting key is immediately invalidated. This ensures:

- Reads are fast (< 2ms from cache — Constitution Rule XIX)
- Updates are immediately visible (no stale reads after writes)
- Cache misses trigger a database read and cache population

### D3. Non-Optional Package

The settings package is non-optional — it has no toggle guard. Every other package in the system depends on configuration values. The architecture spec (Section 11) explicitly marks it as non-optional.

### D4. Result Pattern (Rule XXI)

All public methods return `Result<T, AppError>` via the project's error handling library. No thrown exceptions in public APIs. Error codes use the hierarchical naming pattern: `settings.{category}.{detail}` (e.g., `settings.static.missing_variable`, `settings.dynamic.not_found`).

### D5. Event-Driven Updates (Rule XV)

When a dynamic setting changes, the settings package emits an event via the Event Bus. The event follows the project's event naming convention: `settings.setting.updated`. Consumers subscribe to this event to react to setting changes. The settings package does NOT subscribe to its own events — it only publishes.

### D6. Separation of Concerns — Maintenance Mode

The settings package provides the data layer for maintenance mode (is it active? is this user a super admin?). It does NOT implement the middleware that blocks user commands during maintenance. That responsibility belongs to the bot-server middleware layer. This separation follows the single-responsibility principle and the package boundary architecture.

### D7. Default Values for Dynamic Settings

Every dynamic setting has a built-in default value that is used when:

- The database has no row for that key (first deployment)
- The database is unreachable and cache is empty

| Setting                  | Default Value                              |
| ------------------------ | ------------------------------------------ |
| Join mode                | AUTO                                       |
| Maintenance mode         | false (off)                                |
| Approval role            | (none — N/A when join mode is not REQUEST) |
| Backup scheduling        | (none — disabled)                          |
| Log retention period     | 90 days                                    |
| Dynamic default language | (inherits from .env DEFAULT_LANGUAGE)      |

### D8. No Hardcoded Values (Rule VI)

All settings that could change must be externalized. The defaults listed in D7 are application-level defaults (code constants), not hardcoded business logic. They represent safe starting points for a fresh deployment. The SUPER_ADMIN can override any of them at runtime via the Dashboard.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST read static settings from environment variables at startup and validate all required variables are present. Missing required variables must cause an immediate error — the bot must not start.
- **FR-002**: System MUST provide typed access to all static settings (bot token, database URL, super admin IDs, default language, default country) with proper type parsing (e.g., SUPER_ADMIN_IDS as number array).
- **FR-003**: System MUST provide typed CRUD operations for dynamic settings stored in the database. Each dynamic setting has a string key, a typed value, and an optional description.
- **FR-004**: System MUST cache dynamic settings with a 5-minute TTL. Cache entries are invalidated immediately on any update operation. Reads within TTL must not hit the database.
- **FR-005**: System MUST provide a maintenance mode setting. When active, the system reports maintenance status as true and identifies whether a given user ID is a super admin (bypass). Activation and deactivation must emit events for audit logging.
- **FR-006**: System MUST provide a join mode setting with valid values: AUTO, REQUEST, INVITE_ONLY, CLOSED. The setting is changeable at runtime without restart.
- **FR-007**: System MUST provide an approval role setting for REQUEST join mode, a backup scheduling setting, a log retention period setting, and a dynamic default language setting.
- **FR-008**: System MUST emit events via the Event Bus when any dynamic setting is created, updated, or deleted. Events must include the setting key, old value (if applicable), and new value.
- **FR-009**: System MUST return sensible default values for all dynamic settings when no database row exists (first deployment scenario). No database seeding is required.
- **FR-010**: All public methods MUST return `Result<T, AppError>`. No thrown exceptions. (Rule XXI)
- **FR-011**: No `any` types anywhere in the package. (Rule I)
- **FR-012**: All settings that could change MUST be externalized — no hardcoded user-facing text or business logic values. (Rule VI)

### Non-Functional Requirements

- **NFR-001**: Cached dynamic setting reads MUST complete in < 2ms (Constitution Rule XIX).
- **NFR-002**: Static setting initialization MUST complete in < 100ms.
- **NFR-003**: Cache invalidation on update MUST be immediate — no stale reads after a successful write operation.
- **NFR-004**: The package MUST gracefully handle database unavailability for dynamic setting reads by falling back to built-in defaults and logging a warning.
- **NFR-005**: The package MUST gracefully handle cache layer failures by falling back to direct database queries.

### Key Entities

- **StaticSettings**: Typed object representing all environment variable settings. Validated once at startup.
- **DynamicSetting**: Database entity with key (string), value (string/JSON), description (optional string), and timestamps.
- **SettingsService**: Unified facade providing access to both static and dynamic settings, with cache management and event emission.
- **JoinMode**: Enum with values AUTO, REQUEST, INVITE_ONLY, CLOSED.
- **MaintenanceStatus**: Object containing enabled (boolean) and super admin check capability.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Cached dynamic setting reads complete in < 2ms (NFR-001).
- **SC-002**: Static setting initialization completes in < 100ms (NFR-002).
- **SC-003**: Cache invalidation is immediate — no stale reads after successful writes (NFR-003).
- **SC-004**: All dynamic settings return correct defaults on first deployment with empty database (FR-009).
- **SC-005**: Maintenance mode correctly allows SUPER_ADMIN through while reporting maintenance for others (FR-005).
- **SC-006**: Setting change events are emitted for all create/update/delete operations (FR-008).
- **SC-007**: All public methods return `Result<T, AppError>` — zero thrown exceptions (FR-010).
- **SC-008**: Zero `any` types in the entire package (FR-011).
- **SC-009**: Bot fails fast at startup when required .env variables are missing (FR-001).
- **SC-010**: System degrades gracefully when database is unavailable — returns defaults instead of errors (NFR-004).

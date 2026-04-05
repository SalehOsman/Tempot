# Feature Specification: Module Registry (Runtime Discovery & Validation Engine)

**Feature Branch**: `019-module-registry-package`
**Created**: 2026-04-05
**Updated**: 2026-04-05
**Status**: Complete
**Input**: User description: "Build the module-registry package that provides runtime auto-discovery and validation of business modules at bot startup. It scans the modules/ directory, loads each module's configuration, validates structure and configuration, enforces spec gate and dependency requirements, and provides the validated module registry to the bot server for command registration."
**Architecture Reference**: Section 15 of `docs/tempot_v11_final.md` (Module System)
**ADR Reference**: None (no architectural alternatives — module system is defined in the architecture spec)

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Module Auto-Discovery at Startup (Priority: P0)

As the bot server, I want the system to automatically discover all business modules in the modules directory at startup, so that I do not need to manually register each module and new modules are picked up simply by being placed in the correct directory.

**Why this priority**: Without discovery, no modules can be loaded. The bot would start with zero business functionality. This is the foundational capability that all other stories depend on.

**Independent Test**: Place multiple module directories with valid configuration files in a test modules directory. Call the discovery method and verify all modules are found and their configurations are loaded correctly.

**Acceptance Scenarios**:

1. **Given** the modules directory contains three module directories (each with a valid `module.config.ts`), **When** the registry performs discovery, **Then** all three modules are discovered and their configurations are loaded into memory.
2. **Given** the modules directory contains a directory without a `module.config.ts` file, **When** the registry performs discovery, **Then** that directory is ignored and a warning is logged identifying the directory.
3. **Given** the modules directory does not exist or is empty, **When** the registry performs discovery, **Then** no modules are discovered, a warning is logged, and the bot continues startup with zero business modules (this is not an error).
4. **Given** a module's `module.config.ts` cannot be loaded (syntax error, missing export), **When** the registry performs discovery, **Then** the module is marked as failed with a descriptive error, and discovery continues for remaining modules.

---

### User Story 2 — Module Structural Validation (Priority: P0)

As the system operator, I want each discovered module to be validated against the mandatory file and directory structure defined in the architecture specification, so that incomplete or malformed modules are caught before they cause runtime errors.

**Why this priority**: Structural validation prevents runtime crashes from missing required files. Without it, the bot could attempt to use a module missing its locale files or abilities definition and fail unpredictably.

**Independent Test**: Create a complete module with all mandatory files and verify it passes validation. Then remove one mandatory file at a time and verify that each removal causes a validation failure with a clear error message.

**Acceptance Scenarios**:

1. **Given** a module has all mandatory files (`module.config.ts`, `abilities.ts`, `locales/ar.json`, `locales/en.json`, `index.ts`, `features/` directory, `shared/` directory), **When** validation runs, **Then** the module passes structural validation.
2. **Given** a module is missing `locales/ar.json`, **When** validation runs, **Then** the module fails structural validation with an error identifying the missing file.
3. **Given** a module has `features.hasDatabase: true` in its configuration, **When** validation runs, **Then** the validator also requires `database/schema.prisma` and `database/migrations/` directory to exist.
4. **Given** a module has `features.hasDatabase: false`, **When** validation runs, **Then** the database directory and files are not required.
5. **Given** a module has no `tests/` directory, **When** validation runs, **Then** a warning is emitted but validation does not fail (tests directory is recommended, not mandatory).

---

### User Story 3 — Configuration Validation (Priority: P0)

As the system operator, I want each module's configuration to be validated against the 22 mandatory fields defined in the architecture specification, so that misconfigured modules are caught at startup rather than causing unexpected behavior at runtime.

**Why this priority**: Configuration validation ensures all modules conform to the architecture contract. Missing fields, invalid types, or conflicting settings must be caught early.

**Independent Test**: Create a module configuration with all 22 mandatory fields correctly set and verify it passes validation. Then remove or invalidate each field and verify each causes a validation failure.

**Acceptance Scenarios**:

1. **Given** a module configuration has all mandatory fields with valid values, **When** configuration validation runs, **Then** the module passes.
2. **Given** a module configuration is missing the `name` field, **When** configuration validation runs, **Then** validation fails with an error identifying the missing field.
3. **Given** a module has `features.hasAI: true` but no `aiDegradationMode` field, **When** configuration validation runs, **Then** validation fails because `aiDegradationMode` is mandatory when `hasAI` is enabled.
4. **Given** a module has `aiDegradationMode: "graceful"` and `features.hasAI: true`, **When** configuration validation runs, **Then** validation passes.
5. **Given** two modules both have `name: "person"`, **When** configuration validation runs across all modules, **Then** the second module fails with a duplicate name error.
6. **Given** a module has `isActive: false`, **When** discovery and validation run, **Then** the module is skipped silently — no validation is performed and it does not appear in the registry.

---

### User Story 4 — Core vs Optional Module Failure Handling (Priority: P0)

As the system operator, I want the system to halt startup when a core module fails validation and continue with a warning when an optional module fails, so that critical business functionality is never partially loaded while non-critical features degrade gracefully.

**Why this priority**: This is the safety mechanism that prevents the bot from running in an inconsistent state. Core modules failing silently would be catastrophic.

**Independent Test**: Create a core module with a validation error and verify the registry returns a fatal error. Create an optional module with a validation error and verify the registry skips it with a warning.

**Acceptance Scenarios**:

1. **Given** a core module (`isCore: true`) fails structural or configuration validation, **When** the registry completes validation, **Then** the registry returns a fatal error that prevents the bot from starting.
2. **Given** an optional module (`isCore: false`) fails validation, **When** the registry completes validation, **Then** the module is excluded from the registry, a warning is logged with the failure reason, and the bot continues startup.
3. **Given** all core modules pass validation and one optional module fails, **When** the registry completes validation, **Then** the registry contains all valid modules (core + valid optional) and the bot starts successfully.

---

### User Story 5 — Spec Gate Enforcement (Priority: P0)

As the project methodology enforcer, I want the registry to refuse to load any module that does not have an approved specification file, so that the Constitution requirement for spec-driven development is enforced at runtime.

**Why this priority**: Constitution Rule XLVI mandates no module without an approved specification. This runtime check is the enforcement mechanism that prevents accidental deployment of unspecified modules.

**Independent Test**: Create a module with a valid configuration but no corresponding spec file. Verify the registry rejects it. Create the spec file and verify the module is now accepted.

**Acceptance Scenarios**:

1. **Given** a module named "person-registration" exists with valid structure, **When** the registry checks for a spec file, **Then** it looks for a matching specification directory in the specs directory (matching by module name).
2. **Given** no matching spec directory exists, **When** the registry validates the module, **Then** validation fails with an error stating the module has no approved specification.
3. **Given** a matching spec directory exists and contains a `spec.md` file, **When** the registry validates the module, **Then** the spec gate check passes.

---

### User Story 6 — Dependency Validation (Priority: P1)

As the system operator, I want the registry to validate that each module's declared package dependencies are available, so that modules with missing dependencies are caught at startup rather than failing at runtime.

**Why this priority**: Dependency validation prevents modules from starting in an inconsistent state where they reference packages that are not installed or are disabled.

**Independent Test**: Create a module that declares a dependency on a specific package. Verify validation passes when the package is available. Remove the package and verify validation fails.

**Acceptance Scenarios**:

1. **Given** a module declares `requires.packages: ["shared", "logger"]`, **When** dependency validation runs, **Then** it verifies both packages are available and passes.
2. **Given** a module declares `requires.packages: ["nonexistent"]`, **When** dependency validation runs, **Then** it fails with an error identifying the missing package.
3. **Given** a module has `features.hasNotifications: true`, **When** dependency validation runs, **Then** it additionally verifies that the `notifier` package is available (feature flag implies package dependency).
4. **Given** a module has `features.hasAI: true` and the `ai-core` package is available, **When** dependency validation runs, **Then** the implicit dependency check passes.
5. **Given** a module declares `requires.optional: ["payment"]` and that package is not available, **When** dependency validation runs, **Then** a warning is logged but validation does not fail.

---

### User Story 7 — Module Registry Query (Priority: P1)

As the bot server, I want to query the validated module registry to retrieve module configurations by name, list all registered modules, and access module command definitions, so that I can set up routing and access control based on module configurations.

**Why this priority**: The registry is the authoritative source of module information. The bot server and other infrastructure code query it to configure routing, permissions, and features.

**Independent Test**: Register multiple validated modules, then query by name and verify the correct configuration is returned. Query for all modules and verify the full list. Query for a non-existent module and verify a not-found response.

**Acceptance Scenarios**:

1. **Given** the registry contains three validated modules, **When** I query by module name, **Then** I receive the full configuration for that module.
2. **Given** the registry contains three validated modules, **When** I request all modules, **Then** I receive all three module configurations.
3. **Given** I query for a module name that is not in the registry, **Then** I receive a not-found indicator (not an error — the module simply does not exist).
4. **Given** I request all module commands across the registry, **Then** I receive a consolidated list of all command definitions from all registered modules.

---

### User Story 8 — Command Registration Interface (Priority: P1)

As the bot server, I want the registry to provide an interface for registering all validated module commands with the bot framework, so that module commands are automatically available to users without manual wiring.

**Why this priority**: Command registration is the bridge between module definitions and runtime bot functionality. Without it, discovered modules have no effect on user-facing features.

**Independent Test**: Register modules with command definitions. Call the command registration interface with a mock bot instance. Verify that commands from all validated modules are registered.

**Acceptance Scenarios**:

1. **Given** the registry has validated modules with command definitions, **When** the registration method is called with a bot instance, **Then** all commands from all registered modules are set up on the bot.
2. **Given** a module defines commands with required roles, **When** commands are registered, **Then** the role requirements are preserved in the registration for the bot server to enforce.
3. **Given** the registry has no modules (empty modules directory), **When** the registration method is called, **Then** no commands are registered and no error occurs.

---

### User Story 9 — Module Lifecycle Events (Priority: P1)

As the observability infrastructure, I want the registry to emit events for module lifecycle stages (discovery, validation, registration), so that module loading is fully auditable and debuggable.

**Why this priority**: Events are required by Constitution Rule XV for cross-module communication and Rule LVII for audit logging. Module lifecycle visibility is essential for debugging startup issues.

**Independent Test**: Subscribe to module lifecycle events. Run the full discovery-validation-registration pipeline. Verify events are emitted at each stage with appropriate payloads.

**Acceptance Scenarios**:

1. **Given** the registry completes discovery, **Then** a discovery completed event is emitted with the count of modules found.
2. **Given** a module passes validation, **Then** a module validated event is emitted with the module name.
3. **Given** a module fails validation, **Then** a module validation failed event is emitted with the module name and error details.
4. **Given** an optional module is skipped, **Then** a module skipped event is emitted with the module name and reason.
5. **Given** a module is disabled (`isActive: false`), **Then** a module disable alert event is emitted for audit purposes (Rule LVII — SUPER_ADMIN alert).

---

### User Story 10 — Audit Logging (Priority: P1)

As the system operator, I want the registry to log detailed information about the discovery and validation process, so that I can diagnose issues with module loading from the application logs.

**Why this priority**: Detailed logging is essential for debugging production issues where modules fail to load or are unexpectedly skipped.

**Independent Test**: Run the full pipeline with a mix of valid, invalid, and inactive modules. Verify logs include module counts, individual validation results, and a summary.

**Acceptance Scenarios**:

1. **Given** the registry completes discovery, **Then** it logs the total number of module directories found.
2. **Given** validation completes, **Then** it logs a summary: N modules validated, M skipped, K failed.
3. **Given** a module fails validation, **Then** it logs the specific validation errors for that module.
4. **Given** a module is inactive, **Then** it logs that the module was skipped due to `isActive: false`.

---

## Edge Cases

- **Empty Modules Directory**: If the `modules/` directory does not exist or contains no subdirectories, the registry logs a warning and the bot starts with zero business modules. This is not an error — it is a valid state for initial setup or testing.
- **Module Config Load Failure**: If a module's `module.config.ts` cannot be loaded (syntax error, missing default export, runtime error), the module is treated as a discovery failure. For core modules, this is fatal. For optional modules, it is logged and the module is skipped.
- **Duplicate Module Names**: If two modules have the same `name` field, the second module fails validation with a duplicate name error. The first module (in filesystem discovery order) is kept.
- **Inactive Core Module**: If a core module has `isActive: false`, it is silently skipped like any inactive module. This is valid — the operator has intentionally disabled it. However, a SUPER_ADMIN alert event is emitted per Constitution Rule LVII.
- **Missing Spec File**: If a module has no matching specification directory in `specs/`, it fails the spec gate check. This is treated as a validation failure (fatal for core, skip for optional).
- **Feature Flag Without Package**: If a module declares `hasNotifications: true` but the `notifier` package is not available, this is a dependency validation failure. The feature flag implies the module needs that package at runtime.
- **Optional Dependencies Missing**: If a module's `requires.optional` lists packages that are not available, this is logged as a warning but does not cause validation failure. The module is responsible for checking optional dependencies at runtime.
- **Circular Module Dependencies**: Not possible by architecture — modules communicate only via the Event Bus (Rule XV). There are no direct imports between modules.
- **Concurrent Discovery**: Not possible — discovery runs exactly once at startup, synchronously (sequential scan). No concurrency concerns.
- **Large Number of Modules**: Discovery and validation are O(n) where n is the number of module directories. All validation is file-system checks and in-memory comparison — no database queries, no network calls. Performance is bounded by filesystem I/O.
- **Module Without Commands**: A module with an empty `commands` array is valid. Not every module exposes user-facing commands (some may be event-driven only).
- **Module Directory Symlinks**: Symlinked directories in `modules/` are followed normally. The registry does not differentiate between real and symlinked directories.

## Design Decisions & Clarifications

### D1. Three-Phase Pipeline

The registry operates as a three-phase sequential pipeline: **Discover → Validate → Register**. Each phase completes fully before the next begins. Discovery collects raw module data. Validation filters and verifies. Registration integrates validated modules with the bot framework. This separation ensures clean error handling — discovery errors are reported separately from validation errors.

### D2. Core vs Optional Failure Semantics

Core modules (`isCore: true`) that fail any validation step cause the entire registry to return a fatal error. This error propagates to the bot server, which must halt startup. Optional modules (`isCore: false`) that fail validation are excluded from the registry with a warning log. The bot starts without them. Inactive modules (`isActive: false`) are silently skipped regardless of core/optional status.

### D3. Spec Gate Check

Constitution Rule XLVI requires every module to have an approved specification. The registry enforces this by checking for the existence of a specification directory in the `specs/` directory that matches the module name. The check verifies the directory exists and contains a `spec.md` file. This is a structural check — the registry does not parse or validate the specification content.

### D4. In-Memory Registry

The module registry is purely in-memory. It does not persist state to a database. Module discovery and validation run at every bot startup. This design is intentional:

- No database dependency (the registry must work before database is fully initialized)
- No stale state (always reflects the current filesystem)
- Restart = full re-discovery (consistent with the no-hot-reload design)

### D5. Feature Flag to Package Mapping

The registry validates that modules with enabled feature flags have access to the corresponding packages. The mapping is fixed:

| Feature Flag       | Required Package  |
| ------------------ | ----------------- |
| `hasNotifications` | `notifier`        |
| `hasAttachments`   | `storage-engine`  |
| `hasAI`            | `ai-core`         |
| `hasInputEngine`   | `input-engine`    |
| `hasImport`        | `import-engine`   |
| `hasSearch`        | `search-engine`   |
| `hasDynamicCMS`    | `cms-engine`      |
| `hasRegional`      | `regional-engine` |

This mapping is hardcoded in the registry because it reflects a fundamental architectural contract. Package availability is determined by checking whether the package exists in the `packages/` directory (filesystem check).

### D6. Module Name Uniqueness

The `name` field in a module's configuration must be unique across all discovered modules. Uniqueness is checked during validation. If a duplicate is found, the second module (in filesystem discovery order) fails validation. This prevents routing conflicts and ambiguous module references.

### D7. No Toggle Guard

Module-registry is core infrastructure — it is NOT listed in the pluggable architecture table (Section 30). Without it, no modules can be loaded. It has no environment variable toggle and is always enabled. This aligns with other core infrastructure like `event-bus` and `cache-manager`.

### D8. Startup Order Dependencies

Module-registry requires `@tempot/logger` and `@tempot/event-bus` to be initialized before it runs. It does NOT require database or cache — it is purely filesystem and in-memory. This makes it suitable for early startup, before database connections are established.

### D9. No Hot-Reload

Modules are discovered at startup only. Adding, removing, or modifying a module requires a bot restart. Hot-reload is intentionally excluded — it introduces complexity (file watchers, state management, partial reloading) that is not justified for an enterprise bot that restarts in seconds.

### D10. Disable Audit Requirement

When a module has `isActive: false`, the registry emits a SUPER_ADMIN alert event per Constitution Rule LVII. This ensures that disabled modules are visible in the audit trail. The alert includes the module name and indicates it was intentionally disabled.

### D11. Command Registration Boundary

The registry collects and validates command definitions from module configurations. It provides an interface for the bot server to register these commands. The actual integration with the bot framework's routing system is a shared responsibility: the registry provides the data and a registration method, but the bot server controls when and how registration happens. The registry does not directly manage bot framework internals — it provides validated module data to the caller.

### D12. Package Availability Check

A package is "available" when its directory exists in `packages/`. For packages with toggle guards (Section 30), the registry additionally checks the corresponding `TEMPOT_{NAME}` environment variable. If the env var is explicitly set to `"false"`, the package is considered unavailable even if its directory exists. This ensures dependency validation respects the pluggable architecture.

### D13. Spec Gate Matching Strategy

The spec directory naming convention is `{NNN}-{module-name}` or `{NNN}-{module-name}-package`. The registry checks for any directory in `specs/` whose name, after removing the numeric prefix and separator (e.g., `019-`), matches the module name or `{module-name}-package`. For example, module `person-registration` matches `specs/021-person-registration/` or `specs/021-person-registration-package/`.

### D14. Command Object Structure

Each entry in the `commands` array must have at minimum: `command` (string — the slash command name) and `description` (string — human-readable description). The registry validates the structure of each command object but does not validate command name uniqueness across modules — that is the bot-server's responsibility during registration.

### D15. Module Config Export Convention

The registry expects `module.config.ts` to use a default export that is a `ModuleConfig` object. Named exports are not checked. This matches the architecture spec's example pattern.

### D16. UserRole Values

The `requiredRole` field maps to one of four values: `GUEST`, `USER`, `ADMIN`, `SUPER_ADMIN`. These correspond to the CASL-based RBAC roles defined in Constitution Rule XXVI.

### D17. Locale File Validation Scope

The registry only checks that `locales/ar.json` and `locales/en.json` exist. It does NOT validate the content of locale files — that is handled by `pnpm cms:check` (i18n-core package). This follows separation of concerns.

### D18. Inactive Core Module Behavior

If a core module has `isActive: false`, it is silently skipped like any inactive module. The bot does NOT halt — the operator made a conscious decision to disable it. A SUPER_ADMIN alert event is emitted per Rule LVII.

### D19. scopedUsers Field

The `scopedUsers` field is optional per Section 15.3. If present, it must be an array of user IDs (numbers). If absent, the module is available to all users matching `requiredRole`. The registry validates the type if present but does not enforce scoping — that is the bot-server's responsibility.

### D20. Version Field Format

The `version` field is a string (e.g., "1.0.0"). The registry validates it is a non-empty string but does not enforce semver format. Cross-module version compatibility checking is out of scope for this package.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST auto-discover all modules by scanning the `modules/` directory at startup and loading each module's `module.config.ts` configuration file.
- **FR-002**: System MUST validate the mandatory file and directory structure for each discovered module: `module.config.ts`, `abilities.ts`, `locales/ar.json`, `locales/en.json`, `index.ts`, `features/` directory, `shared/` directory. When `features.hasDatabase` is true, `database/schema.prisma` and `database/migrations/` are also mandatory.
- **FR-003**: System MUST validate each module's configuration against the 22 mandatory fields: `name`, `version`, `requiredRole`, `commands`, 10 feature flags (`hasDatabase`, `hasNotifications`, `hasAttachments`, `hasExport`, `hasAI`, `hasInputEngine`, `hasImport`, `hasSearch`, `hasDynamicCMS`, `hasRegional`), `isActive`, `isCore`, `aiDegradationMode` (mandatory when `hasAI` is true), `requires.packages`, `requires.optional`.
- **FR-004**: System MUST enforce different failure modes for core vs optional modules. Core module validation failure returns a fatal error that halts the bot. Optional module validation failure logs a warning and excludes the module from the registry.
- **FR-005**: System MUST skip inactive modules (`isActive: false`) silently — no validation is performed and the module does not appear in the registry.
- **FR-006**: System MUST enforce the spec gate: refuse to load any module that does not have a matching specification directory in `specs/` containing a `spec.md` file (Constitution Rule XLVI).
- **FR-007**: System MUST validate module dependencies: check `requires.packages` against available packages, and verify feature flag implied dependencies (e.g., `hasNotifications: true` requires `notifier` package to be available).
- **FR-008**: System MUST enforce module name uniqueness across all discovered modules. Duplicate names cause the second module to fail validation.
- **FR-009**: System MUST maintain an in-memory registry of all validated, active modules with their full configurations, queryable by module name.
- **FR-010**: System MUST provide a method to register all validated module commands with the bot framework's command routing system.
- **FR-011**: System MUST emit events for module lifecycle stages: discovery completed, module validation succeeded, module validation failed, module skipped, module registered.
- **FR-012**: System MUST emit a SUPER_ADMIN alert event when a module is disabled (`isActive: false`) per Constitution Rule LVII.
- **FR-013**: System MUST log module discovery results (modules found, validated, skipped, failed) and individual validation errors for debugging.
- **FR-014**: System MUST handle the `requires.optional` field — missing optional dependencies are logged as warnings but do not fail validation.
- **FR-015**: All public methods MUST return `Result<T, AppError>`. No thrown exceptions. (Rule XXI)
- **FR-016**: No `any` types anywhere in the package. (Rule I)

### Non-Functional Requirements

- **NFR-001**: Module discovery and validation MUST complete within 500ms for up to 20 modules (filesystem I/O bound).
- **NFR-002**: The registry MUST operate without database or cache dependencies — purely filesystem and in-memory.
- **NFR-003**: The registry MUST be initializable before database connections are established (early startup).
- **NFR-004**: Discovery and validation errors MUST produce clear, actionable log messages identifying the specific module and failure reason.

### Key Entities

- **ModuleConfig**: Typed representation of a module's `module.config.ts` configuration with all 22 mandatory fields. The authoritative type definition for the module system.
- **ModuleRegistry**: The main service that orchestrates discovery, validation, and provides the query interface for validated modules.
- **ModuleValidator**: Validates individual modules against structural and configuration requirements.
- **ModuleDiscovery**: Scans the modules directory and loads module configurations.
- **ValidatedModule**: A module that has passed all validation checks, wrapping the configuration with validation metadata.
- **ValidationResult**: The result of validating a single module, containing pass/fail status and any error details.
- **ModuleCommand**: A command definition from a module's configuration, used for bot framework registration.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All modules in the `modules/` directory with valid configurations and structures are discovered and validated at startup (FR-001, FR-002, FR-003).
- **SC-002**: Core modules that fail validation halt the bot. Optional modules that fail are skipped with warnings. Inactive modules are silently excluded (FR-004, FR-005).
- **SC-003**: Modules without a matching spec directory are rejected at the spec gate (FR-006).
- **SC-004**: Feature flag implied dependencies are validated — `hasAI: true` requires `ai-core` available (FR-007).
- **SC-005**: Duplicate module names are caught and the second module fails validation (FR-008).
- **SC-006**: The registry provides queryable access to all validated module configurations by name and as a full list (FR-009).
- **SC-007**: Module commands are registerable with the bot framework via the provided interface (FR-010).
- **SC-008**: Module lifecycle events are emitted at each stage (FR-011, FR-012).
- **SC-009**: Discovery, validation, and registration results are logged with counts and error details (FR-013).
- **SC-010**: All public methods return `Result<T, AppError>` — zero thrown exceptions (FR-015).
- **SC-011**: Zero `any` types in the entire package (FR-016).
- **SC-012**: Discovery and validation complete within 500ms for 20 modules (NFR-001).
- **SC-013**: Empty or missing modules directory does not cause an error — bot starts with zero modules (Edge Case).

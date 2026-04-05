# Data Model: Module Registry

## Entities

### `ModuleConfig`

The authoritative type definition for a module's `module.config.ts` configuration file. Contains all 22 mandatory fields defined in Architecture Spec Section 15.3.

**Storage:** None — loaded from filesystem at startup and held in-memory as part of `DiscoveredModule` and `ValidatedModule`. Not persisted to database.

| Field               | Type                 | Description                                    | Constraints / Validation                                                    |
| ------------------- | -------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| `name`              | `string`             | Unique module identifier                       | Required, non-empty, unique across all modules                              |
| `version`           | `string`             | Module version                                 | Required, non-empty string                                                  |
| `requiredRole`      | `UserRole`           | Minimum role to access the module              | Required, one of: GUEST, USER, ADMIN, SUPER_ADMIN                           |
| `commands`          | `ModuleCommand[]`    | Bot commands provided by this module           | Required (may be empty array)                                               |
| `features`          | `ModuleFeatures`     | Feature flags (10 boolean fields)              | Required, all 10 flags must be present                                      |
| `isActive`          | `boolean`            | Whether the module is enabled                  | Required                                                                    |
| `isCore`            | `boolean`            | Whether the module is core (failure halts bot) | Required                                                                    |
| `aiDegradationMode` | `AiDegradationMode?` | AI failure handling strategy                   | Required when `features.hasAI` is `true`, optional otherwise                |
| `requires`          | `ModuleRequirements` | Package dependency declarations                | Required, with `packages` and `optional` arrays                             |
| `scopedUsers`       | `number[]?`          | User IDs with access (if scoped)               | Optional, array of positive integers. If absent, module is role-based only. |

**Validation:** All fields validated via zod schema (`moduleConfigSchema`). The schema includes a refinement: `aiDegradationMode` is required when `features.hasAI` is `true`.

---

### `ModuleCommand`

A single command definition within a module's configuration.

**Storage:** None — embedded in `ModuleConfig.commands` array.

| Field         | Type     | Description                               | Constraints / Validation |
| ------------- | -------- | ----------------------------------------- | ------------------------ |
| `command`     | `string` | Slash command name (e.g., "start")        | Required, non-empty      |
| `description` | `string` | Human-readable description of the command | Required, non-empty      |

---

### `ModuleFeatures`

Feature flags that declare what capabilities a module uses. Each flag implies a package dependency.

**Storage:** None — embedded in `ModuleConfig.features`.

| Field              | Type      | Description                            | Implies Package    |
| ------------------ | --------- | -------------------------------------- | ------------------ |
| `hasDatabase`      | `boolean` | Module has its own database schema     | (structural check) |
| `hasNotifications` | `boolean` | Module sends notifications             | `notifier`         |
| `hasAttachments`   | `boolean` | Module handles file attachments        | `storage-engine`   |
| `hasExport`        | `boolean` | Module exports data                    | (none)             |
| `hasAI`            | `boolean` | Module uses AI features                | `ai-core`          |
| `hasInputEngine`   | `boolean` | Module uses dynamic form input         | `input-engine`     |
| `hasImport`        | `boolean` | Module imports bulk data               | `import-engine`    |
| `hasSearch`        | `boolean` | Module uses dynamic search             | `search-engine`    |
| `hasDynamicCMS`    | `boolean` | Module uses dynamic content management | `cms-engine`       |
| `hasRegional`      | `boolean` | Module uses regional formatting        | `regional-engine`  |

---

### `ModuleRequirements`

Declares package dependencies for a module.

**Storage:** None — embedded in `ModuleConfig.requires`.

| Field      | Type       | Description            | Constraints / Validation                                          |
| ---------- | ---------- | ---------------------- | ----------------------------------------------------------------- |
| `packages` | `string[]` | Required package names | All must be available at startup or validation fails              |
| `optional` | `string[]` | Optional package names | Missing optional packages log warnings but do not fail validation |

---

### `DiscoveredModule`

A module that has been found during directory scanning and whose configuration has been loaded and parsed.

**Storage:** In-memory only (transient — exists between discovery and validation phases).

| Field    | Type           | Description                                  | Constraints / Validation     |
| -------- | -------------- | -------------------------------------------- | ---------------------------- |
| `name`   | `string`       | Module name from `config.name`               | Matches `config.name`        |
| `path`   | `string`       | Absolute filesystem path to module directory | Must exist on filesystem     |
| `config` | `ModuleConfig` | Parsed and schema-validated configuration    | Passed zod schema validation |

---

### `ValidatedModule`

A module that has passed all validation checks (structural, spec gate, dependencies, name uniqueness).

**Storage:** In-memory only (held in `ModuleRegistry` for the lifetime of the bot process).

| Field         | Type           | Description                                  | Constraints / Validation                 |
| ------------- | -------------- | -------------------------------------------- | ---------------------------------------- |
| `name`        | `string`       | Module name from configuration               | Unique across registry                   |
| `path`        | `string`       | Absolute filesystem path to module directory | Validated to contain all mandatory files |
| `config`      | `ModuleConfig` | Full validated configuration                 | Passed all validation checks             |
| `validatedAt` | `Date`         | Timestamp when validation completed          | Auto-set during validation               |

---

### `ValidationError`

Describes a single validation failure for a module.

**Storage:** Transient — used in `ValidationResult.failed` array and event payloads.

| Field     | Type     | Description                            | Constraints |
| --------- | -------- | -------------------------------------- | ----------- |
| `module`  | `string` | Module name or directory name          | Required    |
| `code`    | `string` | Error code from MODULE_REGISTRY_ERRORS | Required    |
| `message` | `string` | Human-readable error description       | Required    |

---

### `DiscoveryResult`

Summary of the discovery phase.

**Storage:** Transient — returned by `discover()` method.

| Field        | Type                                     | Description                          | Constraints |
| ------------ | ---------------------------------------- | ------------------------------------ | ----------- |
| `discovered` | `DiscoveredModule[]`                     | Modules successfully loaded          | Required    |
| `skipped`    | `string[]`                               | Module names/dirs skipped (inactive) | Required    |
| `failed`     | `Array<{ path: string; error: string }>` | Modules that failed to load          | Required    |

---

### `ValidationResult`

Summary of the validation phase.

**Storage:** Transient — returned by `validate()` method.

| Field       | Type                | Description                              | Constraints |
| ----------- | ------------------- | ---------------------------------------- | ----------- |
| `validated` | `ValidatedModule[]` | Modules that passed all checks           | Required    |
| `skipped`   | `string[]`          | Module names skipped (optional + failed) | Required    |
| `failed`    | `ValidationError[]` | Detailed validation failures             | Required    |

## Relationships

```
modules/{name}/module.config.ts
  └── loaded by ModuleDiscovery
        └── parsed into DiscoveredModule
              └── validated by ModuleValidator
                    ├── structural check (filesystem)
                    ├── spec gate check (specs/ directory)
                    ├── dependency check (packages/ directory + env vars)
                    └── name uniqueness check (in-memory set)
                          └── produces ValidatedModule
                                └── stored in ModuleRegistry (Map<string, ValidatedModule>)
                                      ├── queryable: getModule(name), getAllModules(), getAllCommands()
                                      └── registerable: register(bot) → sets up commands
```

- `ModuleDiscovery` reads the filesystem and produces `DiscoveredModule[]`
- `ModuleValidator` consumes `DiscoveredModule[]` and produces `ValidationResult`
- `ModuleRegistry` orchestrates both and maintains the `Map<string, ValidatedModule>` registry
- The bot server consumes `ValidatedModule[]` via query methods and `register(bot)`

## Storage Mechanisms

- **Filesystem (read-only):** Module directories (`modules/`), spec directories (`specs/`), package directories (`packages/`). All accessed read-only during discovery and validation.
- **In-memory:** `Map<string, ValidatedModule>` — the validated module registry. Populated at startup, immutable after validation. No database, no cache, no persistence.
- **Environment variables (read-only):** `TEMPOT_{NAME}` toggle vars for package availability checks.

## Event Schema

Events follow the `{package-name}.{entity}.{action}` naming convention (per project convention in event-bus.events.ts).

| Event Name                                 | Payload Type                                      | Emitted When                                                 | Level    |
| ------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------ | -------- |
| `module-registry.discovery.completed`      | `{ modulesFound, modulesSkipped, modulesFailed }` | Discovery phase completes                                    | INTERNAL |
| `module-registry.module.validated`         | `{ moduleName, isCore }`                          | A module passes all validation checks                        | INTERNAL |
| `module-registry.module.validation_failed` | `{ moduleName, isCore, errors }`                  | A module fails validation                                    | INTERNAL |
| `module-registry.module.skipped`           | `{ moduleName, reason }`                          | An optional module is excluded                               | INTERNAL |
| `module-registry.module.registered`        | `{ moduleName, commandCount }`                    | A module's commands are registered                           | INTERNAL |
| `module-registry.module.disabled`          | `{ moduleName, isCore }`                          | A module has `isActive: false` (Rule LVII SUPER_ADMIN alert) | INTERNAL |

## Data Flow

```
Startup:
  bot-server calls ModuleRegistry.discover()
    └─→ ModuleDiscovery.discover()
          └─→ fs.readdir("modules/")
                └─→ for each subdir:
                      import("modules/{name}/module.config.ts")
                        ├── success → moduleConfigSchema.safeParse(config)
                        │                ├── valid + active → DiscoveredModule
                        │                ├── valid + inactive → skipped[]
                        │                └── invalid → failed[]
                        └── error → failed[]
          └─→ return DiscoveryResult
    └─→ emit "module-registry.discovery.completed"
    └─→ log summary

  bot-server calls ModuleRegistry.validate()
    └─→ ModuleValidator.validate(discovered[])
          └─→ for each DiscoveredModule:
                ├── validateStructure(module)
                │     └─→ check mandatory files exist
                ├── validateSpecGate(module)
                │     └─→ check specs/{NNN}-{name}/ exists with spec.md
                ├── validateDependencies(module)
                │     └─→ check requires.packages in packages/
                │     └─→ check feature flags against FEATURE_PACKAGE_MAP
                └── checkNameUniqueness(module)
                      └─→ check name not already in seen set
          └─→ return ValidationResult
    └─→ if any core module failed → return err(CORE_MODULE_FAILED)
    └─→ emit events per module (validated, failed, skipped, disabled)
    └─→ log summary

  bot-server calls ModuleRegistry.register(bot)
    └─→ for each ValidatedModule:
          └─→ register commands on bot instance
    └─→ emit "module-registry.module.registered" per module
    └─→ log summary
```

# Design Spec — @tempot/module-registry (Runtime Discovery & Validation Engine)

## 1. Overview

The `@tempot/module-registry` package provides runtime discovery and validation of business modules at bot startup. It scans the `modules/` directory, loads each module's `module.config.ts` configuration, validates structure/config/spec-gate/dependencies, and provides an in-memory queryable registry for the bot server. The package operates as a three-phase sequential pipeline: **Discover -> Validate -> Register**. No database, no cache, no hot-reload — purely filesystem and in-memory.

## 2. Architecture & Components

### 2.1 ModuleDiscovery

- Scans `modules/` directory and loads `module.config.ts` from each subdirectory.
- Constructor takes `deps: { modulesDir: string; loadConfig: (path: string) => Promise<unknown>; logger: RegistryLogger }`.
- `discover()` returns `AsyncResult<DiscoveryResult>`.
- Validates loaded config against `moduleConfigSchema` (zod).
- Skips inactive modules (`isActive: false`) — adds name to `skipped`.
- Config load failures (syntax error, missing export) go to `failed`.
- Empty or missing modules directory returns empty result, not an error.

### 2.2 ModuleValidator

- Validates each discovered module against structural, spec gate, and dependency requirements.
- Constructor takes `deps: { specsDir: string; packagesDir: string; logger: RegistryLogger }`.
- Implements `ModuleValidatorPort` interface.
- `validate(discovered: DiscoveredModule[])` returns `AsyncResult<ValidationResult>`.
- All validation checks (structure, spec gate, dependencies) run for each module even if earlier checks fail — operators see the complete picture and fix everything in one pass (error accumulation).
- Caches `specs/` directory listing once per validation batch.

### 2.3 ModuleRegistry (Orchestrator + Query Interface)

- Orchestrates the three-phase pipeline and provides the query interface.
- Constructor takes `deps: { discovery: ModuleDiscoveryPort; validator: ModuleValidatorPort; eventBus: RegistryEventBus; logger: RegistryLogger }`.
- State machine: must call `discover()` before `validate()`, and `validate()` before `register()`.
- In-memory registry: `Map<string, ValidatedModule>`.
- Query methods: `getModule(name)`, `getAllModules()`, `getAllCommands()`.
- `register(bot: RegistryBot)` — single `bot.api.setMyCommands()` call with ALL commands aggregated from all modules.

## 3. Design Decisions

### DC-1: Config Loading Strategy (Dependency Injection)

**Decision**: `ModuleDiscovery` accepts a `loadConfig: (path: string) => Promise<unknown>` function in its deps object instead of calling `import()` directly. Production passes `import()`, tests pass mocks.

**Rationale**: Decouples discovery from the runtime environment. Tests don't need real filesystem module loading. Follows the same DI pattern used throughout the project.

### DC-2: Spec Gate Matching

**Decision**: Use `fs.readdir` on `specs/` directory + string matching. Strip `{NNN}-` numeric prefix, compare against module name and `{name}-package`. Cache the spec directory listing for the validation batch.

**Rationale**: The naming convention is `{NNN}-{feature-name}` or `{NNN}-{feature-name}-package`. Both forms exist in the project. Caching the directory listing avoids repeated filesystem reads when validating multiple modules.

### DC-3: Toggle Guard Env Vars

**Decision**: Hardcoded `TOGGLE_GUARD_PACKAGES` constant mapping package names to `TEMPOT_{NAME}` env var names. Small, stable list from Architecture Spec Section 30. When architecture changes, constant is updated deliberately.

**Rationale**: The toggle guard packages are an architectural constant, not a dynamic configuration. Hardcoding makes the relationship explicit and reviewable. The list matches Section 30 exactly.

**Packages with toggle guards:**

| Package         | Environment Variable   |
| --------------- | ---------------------- |
| session-manager | TEMPOT_SESSION_MANAGER |
| i18n-core       | TEMPOT_I18N_CORE       |
| regional-engine | TEMPOT_REGIONAL_ENGINE |
| storage-engine  | TEMPOT_STORAGE_ENGINE  |
| ux-helpers      | TEMPOT_UX_HELPERS      |
| ai-core         | TEMPOT_AI_CORE         |
| cms-engine      | TEMPOT_CMS_ENGINE      |
| notifier        | TEMPOT_NOTIFIER        |
| search-engine   | TEMPOT_SEARCH_ENGINE   |
| document-engine | TEMPOT_DOCUMENT_ENGINE |
| import-engine   | TEMPOT_IMPORT_ENGINE   |
| input-engine    | TEMPOT_INPUT_ENGINE    |

### DC-4: Command Registration

**Decision**: Single `bot.api.setMyCommands()` call with ALL commands aggregated from all modules. `requiredRole` metadata stays in registry only — bot-server enforces access control.

**Rationale**: Telegram's `setMyCommands` API replaces the entire command list. Multiple calls would overwrite earlier ones. The registry provides command data; the bot-server owns authorization logic.

### DC-5: Error Accumulation

**Decision**: All validation checks (structure, spec gate, dependencies) run for each module even if earlier checks fail. Operators see the complete picture and fix everything in one pass.

**Rationale**: Fail-fast per-check would force operators to fix one issue, restart, discover the next issue, restart again. Error accumulation reduces iteration cycles.

### DC-6: Port Interfaces

**Decision**: Define `ModuleDiscoveryPort` and `ModuleValidatorPort` in the types file. Registry depends on abstractions, not concrete classes.

```typescript
export interface ModuleDiscoveryPort {
  discover(): AsyncResult<DiscoveryResult>;
}

export interface ModuleValidatorPort {
  validate(discovered: DiscoveredModule[]): AsyncResult<ValidationResult>;
}
```

**Rationale**: Follows the same DI pattern as the settings package (`SettingsRepositoryPort`). Enables unit testing of the registry with mock discovery/validator.

### DC-7: No Toggle Guard

**Decision**: Module-registry is core infrastructure, NOT listed in the pluggable architecture table (Section 30). No `createToggleGuard` needed. Always enabled.

**Rationale**: Without the registry, no modules can be loaded. It is in the same category as `event-bus` and `cache-manager`.

### DC-8: ESM Module Format

**Decision**: Add `"type": "module"` to `package.json`. All local imports use `.js` extensions. Workspace imports use bare specifiers.

**Rationale**: All existing packages follow this convention. Consistency is mandatory.

## 4. Pattern Alignments (from Existing Packages)

| Concern            | Convention                                                             | Source                     |
| ------------------ | ---------------------------------------------------------------------- | -------------------------- |
| `tsconfig.json`    | Extends root, `"outDir": "dist"`, `"rootDir": "src"`, `noEmit: false`  | session-manager            |
| `vitest.config.ts` | Import `serviceCoverageThresholds` from base; `testTimeout: 120_000`   | session-manager            |
| Barrel exports     | `export *` with `.js` extensions                                       | session-manager `index.ts` |
| File naming        | `module-registry.{concern}.ts`                                         | project convention         |
| `AsyncResult`      | Import from `@tempot/shared`, not defined locally                      | shared package             |
| Import style       | `import type` for type-only; `.js` for local files; bare for workspace | all packages               |
| Error codes        | `as const` object, hierarchical dot-notation                           | all packages               |
| Event registration | Inline payloads in `TempotEvents` interface, no cross-package imports  | event-bus convention       |
| AppError           | `new AppError(code, details?)` — `code: string`, `details?: unknown`   | shared package             |
| DI pattern         | Constructor takes single `deps` object with typed interfaces           | settings, session-manager  |

## 5. Dependencies

- `zod ^4.3.6` — module configuration schema validation
- `neverthrow 8.2.0` — Result pattern (Rule XXI)
- `@tempot/shared` (workspace:\*) — `AppError`, `Result`, `AsyncResult` types

**Injected (NOT direct dependencies):**

- `@tempot/logger` — via `RegistryLogger` interface
- `@tempot/event-bus` — via `RegistryEventBus` interface
- `grammy` — via `RegistryBot` interface

## 6. Testing Strategy

- **Unit tests**: Each service tested in isolation with mocked dependencies. Discovery uses mock `loadConfig` function. Validator uses temporary directories. Registry uses mock discovery/validator ports.
- **Integration tests**: Full pipeline with temporary filesystem directories. No database, no Testcontainers — module-registry is purely filesystem and in-memory.
- **Coverage**: Service-level thresholds from `vitest.config.base` (`serviceCoverageThresholds`).
- **Test count**: Minimum 65 tests across 6 test files (types, schema, discovery, validator, registry, integration).

## 7. Event Schema

Six lifecycle events registered in `packages/event-bus/src/event-bus.events.ts`:

| Event                                      | Payload                                           | When                                           |
| ------------------------------------------ | ------------------------------------------------- | ---------------------------------------------- |
| `module-registry.discovery.completed`      | `{ modulesFound, modulesSkipped, modulesFailed }` | Discovery phase completes                      |
| `module-registry.module.validated`         | `{ moduleName, isCore }`                          | Module passes validation                       |
| `module-registry.module.validation_failed` | `{ moduleName, isCore, errors }`                  | Module fails validation                        |
| `module-registry.module.skipped`           | `{ moduleName, reason }`                          | Optional module excluded                       |
| `module-registry.module.registered`        | `{ moduleName, commandCount }`                    | Commands registered on bot                     |
| `module-registry.module.disabled`          | `{ moduleName, isCore }`                          | Module has `isActive: false` (Rule LVII alert) |

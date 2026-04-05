# Module Registry Package — Task Breakdown

**Feature:** 019-module-registry-package
**Source:** spec.md (Complete) + plan.md + data-model.md + research.md
**Generated:** 2026-04-05

---

## Task 0: Package Scaffolding

**Priority:** P0 (prerequisite for all other tasks)
**Estimated time:** 5 min
**FR:** None (infrastructure)

**Files to create:**

- `packages/module-registry/.gitignore`
- `packages/module-registry/tsconfig.json`
- `packages/module-registry/package.json`
- `packages/module-registry/vitest.config.ts`
- `packages/module-registry/src/index.ts` (empty barrel)
- `packages/module-registry/tests/unit/` (directory)

**Test file:** N/A (infrastructure only — validated by 10-point checklist)

**Acceptance criteria:**

- [ ] All 10 points of `docs/developer/package-creation-checklist.md` pass
- [ ] `.gitignore` includes: `dist/`, `node_modules/`, `*.tsbuildinfo`, `src/**/*.js`, `src/**/*.js.map`, `src/**/*.d.ts`, `src/**/*.d.ts.map`, `tests/**/*.js`, `tests/**/*.d.ts`
- [ ] `tsconfig.json` extends `../../tsconfig.json`, has `"outDir": "dist"`, `"rootDir": "src"`
- [ ] `package.json` has `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`, `"exports": { ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" } }`
- [ ] `package.json` has `"type": "module"`
- [ ] `package.json` has exact versions: `vitest: "4.1.0"`, `typescript: "5.9.3"`, `neverthrow: "8.2.0"`
- [ ] `package.json` dependencies: `@tempot/shared` (workspace:\*), `neverthrow: "8.2.0"`, `zod: "^4.3.6"`
- [ ] No phantom dependencies — only packages actually imported in `src/` are in dependencies
- [ ] `vitest.config.ts` exists with unit test project
- [ ] `src/index.ts` exists as empty barrel file
- [ ] No compiled artifacts in `src/`

---

## Task 1: Type Definitions and Error Codes

**Priority:** P0 (dependency for all service tasks)
**Estimated time:** 10 min
**FR:** FR-015 (Result pattern), FR-016 (no `any`), FR-003 (config fields)
**Dependencies:** Task 0

**Files to create:**

- `packages/module-registry/src/module-registry.types.ts`
- `packages/module-registry/src/module-registry.errors.ts`

**Test file:** `packages/module-registry/tests/unit/module-registry.types.test.ts`

**Acceptance criteria:**

- [ ] `UserRole` type exported: `'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN'`
- [ ] `AiDegradationMode` type exported: `'graceful' | 'queue' | 'disable'`
- [ ] `ModuleCommand` interface exported with `command` and `description` fields
- [ ] `ModuleFeatures` interface exported with all 10 boolean feature flags
- [ ] `ModuleRequirements` interface exported with `packages` and `optional` arrays
- [ ] `ModuleConfig` interface exported with all 22 fields (name, version, requiredRole, commands, features, isActive, isCore, aiDegradationMode?, requires, scopedUsers?)
- [ ] `DiscoveredModule` interface exported with `name`, `path`, `config`
- [ ] `ValidatedModule` interface exported with `name`, `path`, `config`, `validatedAt`
- [ ] `ValidationError` interface exported with `module`, `code`, `message`
- [ ] `DiscoveryResult` interface exported with `discovered`, `skipped`, `failed`
- [ ] `ValidationResult` interface exported with `validated`, `skipped`, `failed`
- [ ] `RegistryLogger` interface exported with `info`, `warn`, `error`, `debug` methods
- [ ] `RegistryEventBus` interface exported with `publish` method
- [ ] `RegistryBot` interface exported with `api.setMyCommands` method
- [ ] `FEATURE_PACKAGE_MAP` constant exported with all 8 feature-to-package mappings
- [ ] `MODULE_REGISTRY_ERRORS` constant exported with 12 error codes following `module-registry.{category}.{detail}` pattern
- [ ] No `any` types
- [ ] All tests pass

---

## Task 2: Module Config Schema (Zod Validation)

**Priority:** P0 (dependency for discovery service)
**Estimated time:** 10 min
**FR:** FR-003 (22 mandatory fields), FR-016 (no `any`)
**Dependencies:** Task 0, Task 1

**Files to create:**

- `packages/module-registry/src/module-config.schema.ts`

**Test file:** `packages/module-registry/tests/unit/module-config.schema.test.ts`

**Acceptance criteria:**

- [ ] `moduleConfigSchema` exported as zod schema
- [ ] Valid config with all 22 mandatory fields passes validation
- [ ] Missing `name` field fails with descriptive error
- [ ] Missing `version` field fails
- [ ] Missing any of the 10 feature flags fails
- [ ] Invalid `requiredRole` value fails (e.g., `"MODERATOR"`)
- [ ] `features.hasAI: true` without `aiDegradationMode` fails (refinement)
- [ ] `features.hasAI: true` with valid `aiDegradationMode: "graceful"` passes
- [ ] `features.hasAI: false` without `aiDegradationMode` passes
- [ ] Invalid `aiDegradationMode` value (e.g., `"restart"`) fails
- [ ] `scopedUsers` as number array passes
- [ ] `scopedUsers` with non-number values fails
- [ ] `commands` array with valid objects (`command`, `description`) passes
- [ ] `commands` with missing `command` field fails
- [ ] `requires.packages` and `requires.optional` as string arrays passes
- [ ] No `any` types
- [ ] All tests pass (minimum 13: valid config, plus each validation failure case)

---

## Task 3: Module Discovery Service

**Priority:** P0 (required before validation)
**Estimated time:** 15 min
**FR:** FR-001 (auto-discovery), FR-005 (inactive skip), FR-015 (Result pattern)
**Dependencies:** Task 1, Task 2

**Files to create:**

- `packages/module-registry/src/module-discovery.service.ts`

**Test file:** `packages/module-registry/tests/unit/module-discovery.service.test.ts`

**Acceptance criteria:**

- [ ] `ModuleDiscovery` class exported with `discover()` method
- [ ] Constructor takes `deps: { modulesDir: string; logger: RegistryLogger }`
- [ ] `discover()` returns `AsyncResult<DiscoveryResult>`
- [ ] Discovers modules in directory with valid `module.config.ts` files
- [ ] Skips directories without `module.config.ts` and logs warning
- [ ] Returns empty `DiscoveryResult` when modules directory doesn't exist (not an error)
- [ ] Returns empty `DiscoveryResult` when modules directory is empty
- [ ] Handles config load failures (invalid export, runtime error) gracefully — adds to `failed`
- [ ] Skips inactive modules (`isActive: false`) — adds name to `skipped`
- [ ] Config validation failure (zod) adds to `failed` with descriptive error
- [ ] All `Result` returns — no thrown exceptions
- [ ] No `any` types
- [ ] Empty or missing modules directory returns empty result, not an error (SC-013)
- [ ] All tests pass (minimum 7: happy path, no config file, no dir, empty dir, load failure, inactive skip, validation failure)

---

## Task 4: Module Validator

**Priority:** P0 (core validation logic)
**Estimated time:** 20 min
**FR:** FR-002 (structural validation), FR-003 (config validation), FR-006 (spec gate), FR-007 (dependency validation), FR-008 (name uniqueness), FR-014 (optional deps)
**Dependencies:** Task 1, Task 2

**Files to create:**

- `packages/module-registry/src/module-validator.service.ts`

**Test file:** `packages/module-registry/tests/unit/module-validator.service.test.ts`

**Acceptance criteria:**

- [ ] `ModuleValidator` class exported with `validate(discovered: DiscoveredModule[])` method
- [ ] Constructor takes `deps: { specsDir: string; packagesDir: string; logger: RegistryLogger }`
- [ ] `validate()` returns `AsyncResult<ValidationResult>`
- [ ] Structural validation: module with all mandatory files passes
- [ ] Structural validation: module missing `abilities.ts` fails
- [ ] Structural validation: module missing `locales/ar.json` fails
- [ ] Structural validation: module missing `locales/en.json` fails
- [ ] Structural validation: module missing `index.ts` fails
- [ ] Structural validation: module missing `features/` directory fails
- [ ] Structural validation: module missing `shared/` directory fails
- [ ] Structural validation: `hasDatabase: true` requires `database/schema.prisma` and `database/migrations/`
- [ ] Structural validation: `hasDatabase: false` does not require database files
- [ ] Structural validation: missing `tests/` directory emits warning but passes
- [ ] Spec gate: module with matching spec dir containing `spec.md` passes
- [ ] Spec gate: module with no matching spec dir fails
- [ ] Spec gate: matching works with both `{name}` and `{name}-package` suffixes (SC-003)
- [ ] Dependency validation: available required packages passes
- [ ] Dependency validation: missing required package fails
- [ ] Dependency validation: `hasNotifications: true` checks for `notifier` package
- [ ] Dependency validation: `hasAI: true` checks for `ai-core` package (SC-004)
- [ ] Dependency validation: missing optional package logs warning but passes
- [ ] Dependency validation: checks `TEMPOT_{NAME}` env var for toggle guard packages
- [ ] Name uniqueness: two modules with different names pass
- [ ] Name uniqueness: duplicate name — second module fails (SC-005)
- [ ] All `Result` returns — no thrown exceptions (FR-015)
- [ ] No `any` types (FR-016)
- [ ] All tests pass (minimum 20: structural × 10, spec gate × 3, deps × 5, uniqueness × 2)

---

## Task 5: Module Registry Service (Orchestrator + Query Interface)

**Priority:** P0 (main service)
**Estimated time:** 15 min
**FR:** FR-004 (core vs optional failure), FR-009 (in-memory registry), FR-010 (command registration), FR-011 (lifecycle events), FR-012 (disable audit), FR-013 (audit logging)
**Dependencies:** Task 3, Task 4

**Files to create:**

- `packages/module-registry/src/module-registry.service.ts`

**Test file:** `packages/module-registry/tests/unit/module-registry.service.test.ts`

**Acceptance criteria:**

- [ ] `ModuleRegistry` class exported with `discover()`, `validate()`, `register()`, `getModule()`, `getAllModules()`, `getAllCommands()` methods
- [ ] Constructor takes `deps: { discovery: ModuleDiscoveryPort; validator: ModuleValidatorPort; eventBus: RegistryEventBus; logger: RegistryLogger }`
- [ ] `discover()` returns `AsyncResult<DiscoveryResult>` — delegates to discovery service
- [ ] `discover()` emits `module-registry.discovery.completed` event
- [ ] `discover()` logs summary: N found, M skipped, K failed (SC-009)
- [ ] `validate()` returns `AsyncResult<ValidationResult>` — delegates to validator
- [ ] `validate()` returns fatal error when any core module fails validation (FR-004, SC-002)
- [ ] `validate()` skips optional module failures with warning (FR-004, SC-002)
- [ ] `validate()` emits `module-registry.module.validated` for each valid module
- [ ] `validate()` emits `module-registry.module.validation_failed` for each failed module
- [ ] `validate()` emits `module-registry.module.skipped` for each skipped optional module
- [ ] `validate()` emits `module-registry.module.disabled` for inactive modules (Rule LVII, SC-008)
- [ ] `validate()` before `discover()` returns error with code `module-registry.state.not_discovered`
- [ ] `validate()` logs summary: N validated, M skipped, K failed (SC-009)
- [ ] `register(bot: RegistryBot)` returns `AsyncResult<void>` — registers commands via injected bot interface (SC-007)
- [ ] `register(bot)` before `validate()` returns error with code `module-registry.state.not_validated`
- [ ] `register(bot)` emits `module-registry.module.registered` per module
- [ ] `getModule(name)` returns `ValidatedModule | undefined` (SC-006)
- [ ] `getAllModules()` returns `ValidatedModule[]` (SC-006)
- [ ] `getAllCommands()` returns consolidated `ModuleCommand[]` from all modules (SC-006)
- [ ] Event emission failures are logged but do not fail the pipeline
- [ ] All `Result` returns — no thrown exceptions (FR-015)
- [ ] No `any` types (FR-016)
- [ ] All tests pass (minimum 15: discover delegation, validate with core failure, validate with optional skip, lifecycle events × 4, state errors × 2, query methods × 3, register)

---

## Task 6: Event Registration

**Priority:** P1 (required for event-driven architecture)
**Estimated time:** 5 min
**FR:** FR-011 (event emission), FR-012 (disable audit)
**Dependencies:** Task 1

**Files to update:**

- `packages/event-bus/src/event-bus.events.ts`

**Test file:** N/A (type-level registration — verified by build)

**Acceptance criteria:**

- [ ] `module-registry.discovery.completed` event registered with `{ modulesFound, modulesSkipped, modulesFailed }` payload
- [ ] `module-registry.module.validated` event registered with `{ moduleName, isCore }` payload
- [ ] `module-registry.module.validation_failed` event registered with `{ moduleName, isCore, errors }` payload
- [ ] `module-registry.module.skipped` event registered with `{ moduleName, reason }` payload
- [ ] `module-registry.module.registered` event registered with `{ moduleName, commandCount }` payload
- [ ] `module-registry.module.disabled` event registered with `{ moduleName, isCore }` payload
- [ ] All event names follow `{package-name}.{entity}.{action}` convention
- [ ] Build passes with new event types: `pnpm --filter @tempot/event-bus build`

---

## Task 7: Barrel Exports (`src/index.ts`)

**Priority:** P1 (final integration)
**Estimated time:** 5 min
**FR:** All (public API surface)
**Dependencies:** Task 1, 2, 3, 4, 5

**Files to update:**

- `packages/module-registry/src/index.ts`

**Test file:** All existing tests continue to pass

**Acceptance criteria:**

- [ ] Exports all types: `UserRole`, `AiDegradationMode`, `ModuleCommand`, `ModuleFeatures`, `ModuleRequirements`, `ModuleConfig`, `DiscoveredModule`, `ValidatedModule`, `ValidationError`, `DiscoveryResult`, `ValidationResult`, `RegistryLogger`, `RegistryEventBus`, `RegistryBot`
- [ ] Exports constants: `FEATURE_PACKAGE_MAP`, `MODULE_REGISTRY_ERRORS`
- [ ] Exports services: `ModuleDiscovery`, `ModuleValidator`, `ModuleRegistry`
- [ ] Exports schema: `moduleConfigSchema`
- [ ] All existing tests still pass after barrel update
- [ ] 10-point package-creation-checklist passes final verification
- [ ] No `any` types in any file across the package (SC-011)
- [ ] All public methods return `Result<T, AppError>` — zero thrown exceptions (SC-010)

---

## Task 8: Integration Tests (Full Pipeline)

**Priority:** P2 (validation)
**Estimated time:** 15 min
**FR:** All (end-to-end validation)
**Dependencies:** Task 7

**Files to create:**

- `packages/module-registry/tests/unit/module-registry.integration.test.ts`

**Note:** These test the full pipeline with temporary filesystem directories. No database or Testcontainers needed — module-registry is purely filesystem and in-memory.

**Test file:** Self (integration test)

**Acceptance criteria:**

- [ ] Full pipeline: discover 3 modules → validate all → register commands — verify counts and events (SC-001)
  - [ ] Core module failure: 1 core + 1 optional, core has missing file → returns fatal error (SC-002)
  - [ ] Optional module failure: 1 core (valid) + 1 optional (invalid) → core registered, optional skipped
  - [ ] Empty modules dir: discover returns empty, validate returns empty, register is no-op (SC-013)
  - [ ] Inactive module: module with `isActive: false` → skipped, SUPER_ADMIN alert emitted
  - [ ] Spec gate: module without spec dir → fails validation (SC-003)
  - [ ] Dependency validation: module with `hasAI: true` but ai-core unavailable → fails (SC-004)
  - [ ] Duplicate names: two modules with same name → second one fails (SC-005)
  - [ ] Performance: discovery + validation completes within 500ms for test modules (SC-012)
- [ ] All tests pass

---

## Task Dependency Graph

```
Task 0 (scaffolding) ─┬─→ Task 1 (types + errors) ─┬─→ Task 2 (config schema) ───┐
                       │                              ├─→ Task 6 (event registration)│
                       │                              │                              │
                       │   Task 1 + Task 2 ──────────→ Task 3 (discovery service) ──┤
                       │                              │                              │
                       │   Task 1 + Task 2 ──────────→ Task 4 (validator service) ──┤
                       │                                                             │
                       │              Task 3 + Task 4 ──→ Task 5 (registry service) ─┤
                       │                                                             │
                       │                   Task 1-5 ──→ Task 7 (barrel exports) ─────┤
                       │                                                             │
                       │                        Task 7 ──→ Task 8 (integration) ─────┘
```

## Summary

| Task      | Name                      | Priority | Est. Time   | FR Coverage                |
| --------- | ------------------------- | -------- | ----------- | -------------------------- |
| 0         | Package Scaffolding       | P0       | 5 min       | Infrastructure             |
| 1         | Type Definitions + Errors | P0       | 10 min      | FR-003, FR-015, FR-016     |
| 2         | Module Config Schema      | P0       | 10 min      | FR-003, FR-016             |
| 3         | Module Discovery Service  | P0       | 15 min      | FR-001, FR-005, FR-015     |
| 4         | Module Validator          | P0       | 20 min      | FR-002, FR-006–008, FR-014 |
| 5         | Module Registry Service   | P0       | 15 min      | FR-004, FR-009–013         |
| 6         | Event Registration        | P1       | 5 min       | FR-011, FR-012             |
| 7         | Barrel Exports            | P1       | 5 min       | All                        |
| 8         | Integration Tests         | P2       | 15 min      | All                        |
| **Total** |                           |          | **100 min** |                            |

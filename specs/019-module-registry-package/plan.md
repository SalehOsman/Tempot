# Module Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `@tempot/module-registry` package — a runtime discovery and validation engine that scans the `modules/` directory at bot startup, loads and validates each module's configuration and file structure, enforces the spec gate and dependency requirements, and provides the validated module registry to the bot server for command registration.

**Architecture:** A `ModuleRegistry` class that orchestrates a three-phase pipeline (Discover → Validate → Register) using three collaborators: `ModuleDiscovery` (scans `modules/` and loads `module.config.ts` files), `ModuleValidator` (validates structure, configuration, spec gate, and dependencies), and an in-memory registry (`Map<string, ValidatedModule>`). The package is non-optional — no toggle guard.

**Tech Stack:** TypeScript Strict Mode 5.9.3, neverthrow 8.2.0 (Result pattern), Vitest 4.1.0 (testing), `@tempot/shared` (AppError, Result types — direct dependency), `@tempot/logger` (Pino 9.x — injected via `RegistryLogger` interface), `@tempot/event-bus` (injected via `RegistryEventBus` interface), grammY (injected via `RegistryBot` interface — not a direct dependency), zod ^4.3.6 (config validation). No database. No cache. No Prisma.

**Design Constraints:**

- Non-optional package — no `createToggleGuard` needed (D7 in spec.md)
- All public methods return `Result<T, AppError>` via neverthrow 8.2.0 (Rule XXI)
- No `any` types anywhere (Rule I)
- Event-driven — lifecycle events emitted via Event Bus (Rule XV)
- No thrown exceptions in public APIs
- In-memory only — no database, no cache (D4 in spec.md)
- Error code pattern: `module-registry.{category}.{detail}` (hierarchical dot-notation)
- ESLint: max-params 3, max-lines-per-function 50, max-lines 200

---

### Shared Type Definitions

These interfaces are used across all tasks and must be defined in `src/module-registry.types.ts`:

```typescript
/** User roles from the CASL-based RBAC system (Rule XXVI) */
export type UserRole = 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';

/** AI degradation mode (Constitution Rule XXXIII) */
export type AiDegradationMode = 'graceful' | 'queue' | 'disable';

/** Command definition from module.config.ts */
export interface ModuleCommand {
  command: string;
  description: string;
}

/** Feature flags for a module (Section 15.3) */
export interface ModuleFeatures {
  hasDatabase: boolean;
  hasNotifications: boolean;
  hasAttachments: boolean;
  hasExport: boolean;
  hasAI: boolean;
  hasInputEngine: boolean;
  hasImport: boolean;
  hasSearch: boolean;
  hasDynamicCMS: boolean;
  hasRegional: boolean;
}

/** Module dependency requirements */
export interface ModuleRequirements {
  packages: string[];
  optional: string[];
}

/** Full module configuration — the 22 mandatory fields from Section 15.3 */
export interface ModuleConfig {
  name: string;
  version: string;
  requiredRole: UserRole;
  commands: ModuleCommand[];
  features: ModuleFeatures;
  isActive: boolean;
  isCore: boolean;
  aiDegradationMode?: AiDegradationMode;
  requires: ModuleRequirements;
  scopedUsers?: number[];
}

/** Feature flag to package name mapping (D5 in spec.md) */
export const FEATURE_PACKAGE_MAP: Record<string, string> = {
  hasNotifications: 'notifier',
  hasAttachments: 'storage-engine',
  hasAI: 'ai-core',
  hasInputEngine: 'input-engine',
  hasImport: 'import-engine',
  hasSearch: 'search-engine',
  hasDynamicCMS: 'cms-engine',
  hasRegional: 'regional-engine',
};

/** A module that has been discovered but not yet validated */
export interface DiscoveredModule {
  name: string;
  path: string;
  config: ModuleConfig;
}

/** A module that has passed all validation checks */
export interface ValidatedModule {
  name: string;
  path: string;
  config: ModuleConfig;
  validatedAt: Date;
}

/** Validation error detail */
export interface ValidationError {
  module: string;
  code: string;
  message: string;
}

/** Discovery result summary */
export interface DiscoveryResult {
  discovered: DiscoveredModule[];
  skipped: string[];
  failed: Array<{ path: string; error: string }>;
}

/** Validation result summary */
export interface ValidationResult {
  validated: ValidatedModule[];
  skipped: string[];
  failed: ValidationError[];
}

/** Logger interface (minimal — injected dependency) */
export interface RegistryLogger {
  info: (data: unknown) => void;
  warn: (data: unknown) => void;
  error: (data: unknown) => void;
  debug: (data: unknown) => void;
}

/** Event bus interface (minimal — injected dependency) */
export interface RegistryEventBus {
  publish: <K extends string>(
    event: K,
    payload: Record<string, unknown>,
  ) => Promise<{ isOk: () => boolean }>;
}

/** Bot interface (minimal — injected dependency for command registration) */
export interface RegistryBot {
  api: {
    setMyCommands: (commands: Array<{ command: string; description: string }>) => Promise<boolean>;
  };
}
```

---

### Error Codes

Defined in `src/module-registry.errors.ts`:

```typescript
export const MODULE_REGISTRY_ERRORS = {
  DISCOVERY_FAILED: 'module-registry.discovery.failed',
  DISCOVERY_NO_MODULES_DIR: 'module-registry.discovery.no_modules_dir',
  CONFIG_LOAD_FAILED: 'module-registry.config.load_failed',
  CONFIG_VALIDATION_FAILED: 'module-registry.config.validation_failed',
  STRUCTURE_INVALID: 'module-registry.structure.invalid',
  SPEC_GATE_FAILED: 'module-registry.spec_gate.failed',
  DEPENDENCY_MISSING: 'module-registry.dependency.missing',
  DUPLICATE_NAME: 'module-registry.name.duplicate',
  CORE_MODULE_FAILED: 'module-registry.core.validation_failed',
  REGISTRATION_FAILED: 'module-registry.registration.failed',
  NOT_DISCOVERED: 'module-registry.state.not_discovered',
  NOT_VALIDATED: 'module-registry.state.not_validated',
} as const;
```

---

### Task 0: Package Scaffolding (10-Point Checklist)

**Goal:** Create the `packages/module-registry/` directory with all required infrastructure files, passing all 10 points of the package-creation-checklist.

**Files:** Create:

- `packages/module-registry/.gitignore`
- `packages/module-registry/tsconfig.json`
- `packages/module-registry/package.json`
- `packages/module-registry/vitest.config.ts`
- `packages/module-registry/src/index.ts` (empty barrel)
- `packages/module-registry/tests/unit/` (directory)

**Steps:**

- [ ] Run `docs/developer/package-creation-checklist.md` 10-point check mentally for each file
- [ ] Create `.gitignore` with: `dist/`, `node_modules/`, `*.tsbuildinfo`, `src/**/*.js`, `src/**/*.js.map`, `src/**/*.d.ts`, `src/**/*.d.ts.map`, `tests/**/*.js`, `tests/**/*.d.ts`
- [ ] Create `tsconfig.json` extending `../../tsconfig.json` with `"outDir": "dist"`, `"rootDir": "src"`
- [ ] Create `package.json` with:
  - `"name": "@tempot/module-registry"`
  - `"version": "0.1.0"`
  - `"type": "module"`
  - `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`
  - `"exports": { ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" } }`
  - Dependencies: `@tempot/shared` (workspace:\*), `neverthrow: "8.2.0"`, `zod: "^4.3.6"`
  - Dev dependencies: `vitest: "4.1.0"`, `typescript: "5.9.3"`
  - Note: `@tempot/logger` and `@tempot/event-bus` are NOT direct dependencies — they are injected via interfaces (no phantom deps). Only `@tempot/shared` is a direct import (for AppError, Result types). `zod` is a direct dependency for config schema validation.
- [ ] Create `vitest.config.ts` with unit test project
- [ ] Create empty `src/index.ts` barrel
- [ ] Create `tests/unit/` directory
- [ ] Verify: `pnpm install` succeeds
- [ ] Verify: `pnpm --filter @tempot/module-registry build` succeeds
- [ ] Commit: `chore(module-registry): scaffold package — 10-point checklist passed`

---

### Task 1: Type Definitions and Error Codes

**Goal:** Define all interfaces, types, and error codes used throughout the module-registry package.

**Files:** Create:

- `packages/module-registry/src/module-registry.types.ts`
- `packages/module-registry/src/module-registry.errors.ts`

**Test file:** `packages/module-registry/tests/unit/module-registry.types.test.ts`

**Steps:**

- [ ] Write tests for type definitions:
  - `FEATURE_PACKAGE_MAP` has all 8 feature-to-package mappings
  - `MODULE_REGISTRY_ERRORS` has all 12 error codes
  - Error codes follow `module-registry.{category}.{detail}` pattern
- [ ] Run tests — expect FAIL (files don't exist)
- [ ] Create `src/module-registry.types.ts` with all interfaces from "Shared Type Definitions" section
- [ ] Create `src/module-registry.errors.ts` with all error codes
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(module-registry): type definitions and error codes`

---

### Task 2: Module Config Schema (Zod Validation)

**Goal:** Create a zod schema that validates module configuration objects against the 22 mandatory fields from Section 15.3.

**Files:** Create:

- `packages/module-registry/src/module-config.schema.ts`

**Test file:** `packages/module-registry/tests/unit/module-config.schema.test.ts`

**Steps:**

- [ ] Write tests:
  - Valid config with all fields passes validation
  - Missing `name` fails
  - Missing `version` fails
  - Missing feature flags fail
  - `hasAI: true` without `aiDegradationMode` fails
  - `hasAI: true` with valid `aiDegradationMode` passes
  - `hasAI: false` without `aiDegradationMode` passes
  - Invalid `requiredRole` fails
  - Invalid `aiDegradationMode` value fails
  - `scopedUsers` as number array passes
  - `scopedUsers` as non-number fails
  - `commands` array with valid objects passes
  - `commands` with missing `command` field fails
- [ ] Run tests — expect FAIL
- [ ] Create `src/module-config.schema.ts`:

```typescript
import { z } from 'zod';

const userRoleSchema = z.enum(['GUEST', 'USER', 'ADMIN', 'SUPER_ADMIN']);

const aiDegradationModeSchema = z.enum(['graceful', 'queue', 'disable']);

const moduleCommandSchema = z.object({
  command: z.string().min(1),
  description: z.string().min(1),
});

const moduleFeaturesSchema = z.object({
  hasDatabase: z.boolean(),
  hasNotifications: z.boolean(),
  hasAttachments: z.boolean(),
  hasExport: z.boolean(),
  hasAI: z.boolean(),
  hasInputEngine: z.boolean(),
  hasImport: z.boolean(),
  hasSearch: z.boolean(),
  hasDynamicCMS: z.boolean(),
  hasRegional: z.boolean(),
});

const moduleRequirementsSchema = z.object({
  packages: z.array(z.string()),
  optional: z.array(z.string()),
});

export const moduleConfigSchema = z
  .object({
    name: z.string().min(1),
    version: z.string().min(1),
    requiredRole: userRoleSchema,
    commands: z.array(moduleCommandSchema),
    features: moduleFeaturesSchema,
    isActive: z.boolean(),
    isCore: z.boolean(),
    aiDegradationMode: aiDegradationModeSchema.optional(),
    requires: moduleRequirementsSchema,
    scopedUsers: z.array(z.number()).optional(),
  })
  .refine((data) => !data.features.hasAI || data.aiDegradationMode !== undefined, {
    message: 'aiDegradationMode is required when hasAI is true',
  });
```

- [ ] Run tests — expect PASS
- [ ] Commit: `feat(module-registry): module config zod validation schema`

---

### Task 3: Module Discovery Service

**Goal:** Implement the discovery service that scans the `modules/` directory and loads `module.config.ts` from each module directory.

**Files:** Create:

- `packages/module-registry/src/module-discovery.service.ts`

**Test file:** `packages/module-registry/tests/unit/module-discovery.service.test.ts`

**Steps:**

- [ ] Write tests:
  - Discovers modules in a directory with valid configs
  - Skips directories without `module.config.ts`
  - Returns empty result when modules directory doesn't exist
  - Returns empty result when modules directory is empty
  - Handles config load failures (invalid JS/TS) gracefully
  - Skips inactive modules (`isActive: false`) and includes them in skipped list
  - Config validation failure (invalid fields) adds to failed list
- [ ] Run tests — expect FAIL
- [ ] Create `src/module-discovery.service.ts`:
  - Constructor takes `deps: { modulesDir: string; logger: RegistryLogger }`
  - `discover()` returns `AsyncResult<DiscoveryResult>`
  - Reads the modules directory entries
  - For each subdirectory, attempts to import `module.config.ts`
  - Validates loaded config against `moduleConfigSchema`
  - Skips inactive modules
  - Returns `DiscoveryResult` with discovered, skipped, and failed arrays
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(module-registry): module discovery service`

---

### Task 4: Module Validator

**Goal:** Implement the validator that checks structural requirements, spec gate, and dependencies for each discovered module.

**Files:** Create:

- `packages/module-registry/src/module-validator.service.ts`

**Test file:** `packages/module-registry/tests/unit/module-validator.service.test.ts`

**Steps:**

- [ ] Write tests for structural validation:
  - Module with all mandatory files passes
  - Module missing `abilities.ts` fails
  - Module missing `locales/ar.json` fails
  - Module missing `locales/en.json` fails
  - Module missing `index.ts` fails
  - Module missing `features/` directory fails
  - Module missing `shared/` directory fails
  - Module with `hasDatabase: true` and missing `database/schema.prisma` fails
  - Module with `hasDatabase: true` and missing `database/migrations/` fails
  - Module with `hasDatabase: false` and no database dir passes
  - Module without `tests/` emits warning but passes
- [ ] Write tests for spec gate:
  - Module with matching spec dir containing `spec.md` passes
  - Module with no matching spec dir fails
- [ ] Write tests for dependency validation:
  - Module with available required packages passes
  - Module with missing required package fails
  - Module with `hasNotifications: true` and available notifier passes
  - Module with `hasNotifications: true` and missing notifier fails
  - Module with missing optional package logs warning but passes
- [ ] Write tests for name uniqueness:
  - Two modules with different names pass
  - Two modules with same name — second one fails
- [ ] Run tests — expect FAIL
- [ ] Create `src/module-validator.service.ts`:
  - Constructor takes `deps: { specsDir: string; packagesDir: string; logger: RegistryLogger }`
  - `validate(discovered: DiscoveredModule[])` returns `AsyncResult<ValidationResult>`
  - `validateStructure(module)` — checks mandatory files/dirs
  - `validateSpecGate(module)` — checks specs directory
  - `validateDependencies(module)` — checks required and feature-implied packages
  - Tracks names for uniqueness checking
  - Returns `ValidationResult` with validated, skipped, failed arrays
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(module-registry): module validator with spec gate and dependency checks`

---

### Task 5: Module Registry Service (Orchestrator + Query Interface)

**Goal:** Implement the main `ModuleRegistry` class that orchestrates the discover-validate-register pipeline and provides the query interface.

**Files:** Create:

- `packages/module-registry/src/module-registry.service.ts`

**Test file:** `packages/module-registry/tests/unit/module-registry.service.test.ts`

**Steps:**

- [ ] Write tests:
  - `discover()` delegates to `ModuleDiscovery` and emits discovery event
  - `validate()` delegates to `ModuleValidator` and emits validation events
  - `validate()` returns fatal error when core module fails
  - `validate()` skips optional module failures with warning
  - `getModule(name)` returns validated module or undefined
  - `getAllModules()` returns all validated modules
  - `getAllCommands()` returns consolidated command list
  - `validate()` before `discover()` returns error
  - `register()` before `validate()` returns error
  - SUPER_ADMIN alert event emitted for disabled modules
  - Lifecycle events emitted: discovery.completed, module.validated, module.validation_failed, module.skipped
  - Discovery/validation summary logged
- [ ] Run tests — expect FAIL
- [ ] Create `src/module-registry.service.ts`:
  - Constructor takes `deps: { discovery: ModuleDiscoveryPort; validator: ModuleValidatorPort; eventBus: RegistryEventBus; logger: RegistryLogger }`
  - State: `discovered: DiscoveredModule[] | null`, `validated: Map<string, ValidatedModule> | null`
  - `discover()` → `AsyncResult<DiscoveryResult>` — calls discovery, emits event, logs summary
  - `validate()` → `AsyncResult<ValidationResult>` — calls validator, handles core failures, emits events, logs summary
  - `getModule(name)` → `ValidatedModule | undefined`
  - `getAllModules()` → `ValidatedModule[]`
  - `getAllCommands()` → `ModuleCommand[]`
  - `register(bot: RegistryBot)` → `AsyncResult<void>` — registers commands via injected bot interface
- [ ] Run tests — expect PASS
- [ ] Commit: `feat(module-registry): registry service with query interface`

---

### Task 6: Event Registration

**Goal:** Register module-registry lifecycle events in the Event Bus events file.

**Files:** Update:

- `packages/event-bus/src/event-bus.events.ts`

**Steps:**

- [ ] Add module-registry events to `TempotEvents` interface with inline payloads:

```typescript
// Module Registry events
'module-registry.discovery.completed': {
  modulesFound: number;
  modulesSkipped: number;
  modulesFailed: number;
};
'module-registry.module.validated': {
  moduleName: string;
  isCore: boolean;
};
'module-registry.module.validation_failed': {
  moduleName: string;
  isCore: boolean;
  errors: string[];
};
'module-registry.module.skipped': {
  moduleName: string;
  reason: string;
};
'module-registry.module.registered': {
  moduleName: string;
  commandCount: number;
};
'module-registry.module.disabled': {
  moduleName: string;
  isCore: boolean;
};
```

- [ ] Verify build passes: `pnpm --filter @tempot/event-bus build`
- [ ] Commit: `feat(event-bus): register module-registry lifecycle events`

---

### Task 7: Barrel Exports (`src/index.ts`)

**Goal:** Export all public types, services, constants, and error codes from the package barrel.

**Files:** Update:

- `packages/module-registry/src/index.ts`

**Steps:**

- [ ] Export all types: `ModuleConfig`, `ModuleCommand`, `ModuleFeatures`, `ModuleRequirements`, `UserRole`, `AiDegradationMode`, `DiscoveredModule`, `ValidatedModule`, `ValidationError`, `DiscoveryResult`, `ValidationResult`, `RegistryLogger`, `RegistryEventBus`, `RegistryBot`
- [ ] Export constants: `FEATURE_PACKAGE_MAP`, `MODULE_REGISTRY_ERRORS`
- [ ] Export services: `ModuleDiscovery`, `ModuleValidator`, `ModuleRegistry`
- [ ] Export schema: `moduleConfigSchema`
- [ ] Verify all existing tests still pass
- [ ] Verify build succeeds
- [ ] Commit: `feat(module-registry): barrel exports with full public API`

---

### Task 8: Integration Testing

**Goal:** Test the full discover → validate → register pipeline with a realistic module structure on the filesystem.

**Files:** Create:

- `packages/module-registry/tests/unit/module-registry.integration.test.ts`

**Note:** These are "integration" tests in that they test the full pipeline, but they use temporary filesystem directories (not Testcontainers) since module-registry has no database dependency. They run as part of the unit test suite.

**Steps:**

- [ ] Write integration tests:
  - Full pipeline: discover 3 modules → validate all → register commands — verify counts and events
  - Core module failure: 1 core + 1 optional, core has missing file → returns fatal error
  - Optional module failure: 1 core (valid) + 1 optional (invalid) → core registered, optional skipped
  - Empty modules dir: discover returns empty, validate returns empty, register is no-op
  - Inactive module: module with `isActive: false` → skipped, SUPER_ADMIN alert emitted
  - Spec gate: module without spec dir → fails validation
  - Dependency validation: module with `hasAI: true` but ai-core unavailable → fails
  - Duplicate names: two modules with same name → second one fails
- [ ] Run tests — expect PASS (if implementation is correct from prior tasks)
- [ ] Commit: `test(module-registry): integration tests for full pipeline`

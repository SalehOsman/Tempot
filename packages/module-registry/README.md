# @tempot/module-registry

> Auto-discovery and validation of all modules at bot startup.

## Purpose

- Scans `modules/*/` at startup and loads all `module.config.ts` files
- Validates each module against the mandatory structure (Constitution Rule Rule XLIX)
- Core modules (`isCore: true`) stop the bot if invalid
- Optional modules are skipped with a WARN log if invalid
- Registers all module commands with grammY router
- Enforces spec gate — refuses to load modules without an approved `spec.md`

## Phase

Phase 5 — App Assembly (used by `bot-server`)

## Dependencies

| Package          | Purpose                  |
| ---------------- | ------------------------ |
| `@tempot/logger` | Validation error logging |
| `@tempot/shared` | AppError                 |

## Module Validation Rules

| Check                     | Core module   | Optional module |
| ------------------------- | ------------- | --------------- |
| `module.config.ts` exists | ❌ Stops bot  | ⚠️ WARN, skip   |
| `abilities.ts` exists     | ❌ Stops bot  | ⚠️ WARN, skip   |
| `locales/ar.json` exists  | ❌ Stops bot  | ⚠️ WARN, skip   |
| `locales/en.json` exists  | ❌ Stops bot  | ⚠️ WARN, skip   |
| `isActive: false`         | Skip silently | Skip silently   |

## API

```typescript
import { ModuleRegistry } from '@tempot/module-registry';

// In bot-server startup
const registry = new ModuleRegistry();
await registry.discover(); // scans modules/ directory
await registry.validate(); // validates each module
registry.register(bot); // registers commands with grammY
```

## Status

⏳ **Not yet implemented** — Phase 5

# Module Boundary Guide

**Status**: Draft execution artifact for spec #026
**Audience**: Developers and agents adding or modifying Tempot modules.

## Module Ownership

A module owns:

- Commands.
- Handlers.
- Menus.
- Services.
- Repositories.
- Module config.
- Local types.
- Local tests.
- Locale files.
- Domain events it publishes.

A module does not own:

- Runtime app startup.
- Shared infrastructure.
- Other modules.
- Global settings infrastructure.
- Cross-module orchestration outside events.

## Allowed Dependencies

Modules may import:

- `@tempot/module-registry` for module contracts.
- `@tempot/shared` for Result, AppError, toggles, and shared primitives.
- `@tempot/database` repositories/base contracts where repository pattern applies.
- `@tempot/auth-core` authorization contracts.
- `@tempot/i18n-core` translation APIs.
- Other service packages through public exports.
- Local files inside the same module through relative imports.

## Prohibited Dependencies

Modules must not:

- Import another module.
- Import from `apps/*`.
- Import package internals such as `@tempot/database/src/*`.
- Call Prisma directly from services.
- Put user-facing text in TypeScript.
- Add module behavior to `apps/bot-server` except registration/composition.

## Module Change Checklist

Before editing a module:

1. Confirm the active spec and task.
2. Identify whether the change is domain behavior, infrastructure, or app wiring.
3. Keep edits inside the owning module unless a public package contract must change.
4. Add or update tests before behavior changes.
5. Update locale files for user-facing text.
6. Publish events instead of importing another module.
7. Run the module test and relevant root gates.

## New Module Checklist

A new module should include:

- `package.json` with `main`, `types`, `exports`, and scripts.
- `tsconfig.json`.
- `vitest.config.ts`.
- `.gitignore`.
- `module.config.ts`.
- `index.ts` public module entry.
- `commands/`, `handlers/`, `services/`, `repositories/`, `types/` as needed.
- `locales/ar.json` and `locales/en.json`.
- Unit tests and integration tests where needed.
- Events and contracts when communicating outward.

## Review Questions

- Can another developer understand the module from its public entry and config?
- Can the module be disabled without breaking unrelated modules?
- Can its services be tested without Telegram runtime?
- Are all user-facing strings in locale files?
- Are database calls isolated in repositories?
- Does it communicate outward through events?

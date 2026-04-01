# ADR-034: Structural Interface Decoupling Pattern

**Status:** Accepted
**Date:** 2026-04-02

## Context

Rule XV (Event-Driven Communication) mandates modules communicate only via Event Bus. Rule XIV (Repository Pattern) prohibits direct ORM calls in services. Both rules promote loose coupling between packages.

When a package like `@tempot/storage-engine` needs logger and event-bus functionality, importing `@tempot/logger` or `@tempot/event-bus` directly creates compile-time coupling. This causes:

1. Circular dependency risk (e.g., logger depends on shared, storage depends on logger, etc.)
2. Tighter package graph — changes in logger's API force storage-engine to rebuild
3. Harder to test — mocking requires knowing the full dependency API

TypeScript's structural type system offers an alternative: define minimal interfaces locally that match the shape of the real implementations, then accept them via constructor injection.

## Decision

Adopt the **Structural Interface Decoupling** pattern for cross-cutting concerns (logger, event-bus) in feature packages.

### Pattern Rules

1. Define minimal interfaces in a `{package}.interfaces.ts` file with only the methods actually used
2. Comment each interface with what it is structurally compatible with (e.g., "Structurally compatible with pino.Logger")
3. Export these interfaces from the package's `index.ts` so DI consumers know what to provide
4. Accept dependencies via a `{Service}Deps` object in the constructor (dependency injection)
5. Do NOT add `@tempot/logger` or `@tempot/event-bus` to `package.json` dependencies
6. At runtime, the application layer provides the real implementations which satisfy the structural types
7. Do NOT duplicate structural interfaces within the same package — reuse the shared definitions from `{package}.interfaces.ts`

### Current Usage

| Package         | Structural Interfaces              | Replaces Direct Import Of             |
| --------------- | ---------------------------------- | ------------------------------------- |
| storage-engine  | `StorageLogger`, `StorageEventBus` | `@tempot/logger`, `@tempot/event-bus` |
| session-manager | `EventBusAdapter`, logger type     | `@tempot/event-bus`, `@tempot/logger` |

### When To Use

- Feature packages that need logger or event-bus but are not core infrastructure
- Any package where adding a direct dependency would create a circular reference
- Packages that benefit from being testable without the full dependency graph

### When NOT To Use

- Core infrastructure packages (`shared`, `database`, `logger`, `i18n-core`) — these form the dependency root and can import each other directly where needed
- When the package genuinely depends on the full API surface of another package (not just 2-3 methods)

## Rationale

1. TypeScript's structural type system makes this zero-cost at runtime — no adapter layer, no wrapping, just interface satisfaction
2. Keeps the package dependency graph shallow and acyclic
3. Makes unit testing trivial — provide a simple object literal matching the interface
4. Aligns with Rule XV's intent: modules are decoupled, communication happens through well-defined contracts

## Consequences

- Feature packages do not declare `@tempot/logger` or `@tempot/event-bus` in `package.json` even though they use those capabilities at runtime
- The application bootstrap layer is responsible for wiring real implementations to structural interfaces
- Spec documents should reference the structural interface pattern rather than listing logger/event-bus as direct dependencies
- If the real implementation's API changes in a breaking way, the structural interface must be updated manually (no automatic type checking across package boundaries)

## Alternatives Rejected

1. **Direct imports with barrel re-exports**: Creates tight coupling and risks circular dependencies
2. **Abstract base classes**: Heavier than interfaces, forces inheritance hierarchy
3. **Shared contracts package**: Adds another package to maintain; structural typing achieves the same result with zero infrastructure

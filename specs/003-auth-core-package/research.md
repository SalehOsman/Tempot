# Research: Auth Core

## Decisions

### 1. Authorization Library

- **Decision:** Use `@casl/ability ^6.5.0` as the sole authorization library.
- **Rationale:** CASL is mandated by Rule XXVI of the constitution. It provides attribute-based access control (ABAC) on top of RBAC, supports MongoDB-style conditions for scoped authorization, and integrates with Prisma via `@casl/prisma` (not included in this package but used downstream).
- **Alternatives considered:** Custom RBAC implementation (rejected — would not meet Rule XXVI mandate). `accesscontrol` npm package (rejected — less flexible condition system, no Prisma integration). `casbin` (rejected — policy-file-based approach does not fit the TypeScript-first codebase).

### 2. Role Representation

- **Decision:** Use a TypeScript `enum` with string values (`RoleEnum.GUEST = 'GUEST'`, etc.) instead of a numeric enum with a hierarchy comparison function.
- **Rationale:** String enums serialize cleanly to JSON (session data), are self-documenting in logs and error messages, and can be compared directly with database/session values without a mapping layer. The plan proposed numeric enums with an `isAtLeastRole()` comparison function, but this was unnecessary — CASL handles permission checks via ability rules rather than role-level comparisons.
- **Alternatives considered:** Numeric enum with `isAtLeastRole()` (proposed in plan — rejected because CASL already encapsulates permission logic, making numeric hierarchy redundant). Plain string union type (rejected — enums provide better IDE autocomplete and refactoring support).

### 3. Ability Construction Pattern

- **Decision:** Use a static factory method (`AbilityFactory.build()`) that accepts an array of `AbilityDefinition` callbacks, merges their rules, and returns a single `AnyAbility` via `createMongoAbility`.
- **Rationale:** This enables decentralized permission management (FR-003) — each consuming module provides its own `AbilityDefinition` function without the auth-core package knowing about specific modules or subjects. The factory merges all rules into a single ability, supporting additive scopes (edge case: multiple scopes for one admin).
- **Alternatives considered:** Single monolithic `createAbilityForUser()` function (proposed in plan — rejected because it would require auth-core to know about all subjects and modules, violating separation of concerns). `AbilityBuilder` pattern exposed directly (rejected — leaks CASL internals to consumers).

### 4. Subject Extensibility

- **Decision:** Define `AppSubjects` as an empty interface with `AppSubject = keyof AppSubjects | 'all'`. Consuming packages extend `AppSubjects` via TypeScript declaration merging.
- **Rationale:** auth-core cannot know about subjects defined in other packages (e.g., `Article` in `cms-engine`). Declaration merging allows each package to register its subjects into the union type at compile time without modifying auth-core source. This is the standard CASL pattern for modular applications.
- **Alternatives considered:** String-based subjects without type safety (rejected — loses compile-time verification). Central subjects registry in auth-core (rejected — creates circular dependencies and violates package autonomy).

### 5. Error Pattern

- **Decision:** Two dedicated error classes (`UnauthorizedError`, `ForbiddenError`) extending `AppError` from `@tempot/shared`, with `Object.setPrototypeOf` for correct prototype chain.
- **Rationale:** Separating authentication errors (`UNAUTHORIZED` — who are you?) from authorization errors (`FORBIDDEN` — you cannot do this) follows HTTP semantics (401 vs 403) and enables distinct handling in upstream error handlers. The `Object.setPrototypeOf` call is required because TypeScript class inheritance from built-in `Error` subclasses breaks `instanceof` checks without it.
- **Alternatives considered:** Single `AuthError` class with a discriminant field (rejected — less ergonomic for `instanceof` checks in error handlers). Using `AppError` directly with string codes (rejected — loses type narrowing benefits).

### 6. Guard Design

- **Decision:** Static `Guard.enforce()` method that accepts an already-built `AnyAbility` and returns `Result<void, AppError>`.
- **Rationale:** The guard is stateless — it does not need an instance. Accepting a pre-built ability (rather than a user) keeps the guard decoupled from ability construction. The `Result` return type follows Rule XXI (no thrown exceptions). The error includes `{ action, subject }` details for audit logging and i18n message interpolation.
- **Alternatives considered:** Instance-based `AuthGuard` with injected `AuditLogger` (proposed in plan — rejected because audit logging is a cross-cutting concern handled by the event bus, not embedded in the guard). Middleware-style guard (rejected — auth-core is a library package, not a middleware layer).

### 7. Result Pattern

- **Decision:** Both `AbilityFactory.build()` and `Guard.enforce()` return `Result<T, AppError>` via `neverthrow 8.2.0`. Zero thrown exceptions in public APIs.
- **Rationale:** Strict adherence to Rule XXI. Error codes use the `AppError` convention from `@tempot/shared`, producing i18n keys like `errors.FORBIDDEN` automatically.
- **Alternatives considered:** None — Rule XXI is non-negotiable.

### 8. `@casl/prisma` Exclusion

- **Decision:** `@casl/prisma` is NOT a dependency of `auth-core`, despite being mentioned in the spec.
- **Rationale:** `@casl/prisma` provides Prisma-specific ability integration (e.g., `accessibleBy()` query filters). This belongs in the `database` package or in individual domain packages that perform Prisma queries — not in the foundational auth-core that defines roles and abilities. Including it here would create a hard dependency on Prisma in every package that imports auth-core.
- **Alternatives considered:** Including `@casl/prisma` as specified (rejected — violates separation of concerns, couples auth to database layer).

## Implementation Divergences from Plan

| Aspect                    | Plan                                           | Actual Code                                                      | Rationale                                                                |
| ------------------------- | ---------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Role type                 | Numeric `UserRole` enum with `isAtLeastRole()` | String `RoleEnum` enum, no hierarchy function                    | CASL handles permission checks; numeric hierarchy is redundant           |
| Ability construction      | `createAbilityForUser()` function              | `AbilityFactory.build()` static class method                     | Supports decentralized module definitions instead of monolithic function |
| Scoped authorization      | Built into `createAbilityForUser()` scopes arg | Delegated to consuming modules via `AbilityDefinition` callbacks | Each module defines its own scoping rules                                |
| Guard class               | `AuthGuard` instance with `AuditLogger` DI     | Static `Guard.enforce()` without audit logger                    | Audit logging handled by event bus, not embedded in guard                |
| Guard location            | `src/middleware/auth.guard.ts`                 | `src/guards/auth.guard.ts`                                       | Not middleware — it is a pure function guard                             |
| Role file location        | `src/roles/role.definitions.ts`                | `src/contracts/auth.roles.ts`                                    | Grouped with other contract types in `contracts/` directory              |
| Ability factory location  | `src/ability/ability.factory.ts`               | `src/factory/ability.factory.ts`                                 | Clearer separation between contracts and factory                         |
| `@casl/prisma` dependency | Listed as dependency                           | Not included                                                     | Belongs in database/domain packages, not foundational auth               |
| Audit logging             | Embedded in `AuthGuard.check()`                | Not in auth-core (handled by event bus downstream)               | Cross-cutting concern; auth-core is a library, not middleware            |
| `canAccessModule` helper  | FR-007 specifies explicit helper               | `Guard.enforce()` serves this role generically                   | Module access is just an `enforce(ability, action, moduleName)` call     |

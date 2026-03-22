# Auth Core Design Specification (CASL RBAC Implementation)

**Date**: 2026-03-23
**Package**: `@tempot/auth-core`
**Context**: Foundational authorization package using CASL for RBAC and Scoped Authorization as per Tempot v11 Blueprint. Designed for parallel execution by subagents.

## 1. Architectural Goals
1. **Deep Isolation (Clean Architecture):** Completely agnostic to any external transport protocol (no HTTP requests, no explicit Telegram contexts). Its solitary responsibility is taking a `userRole` and interpreting the `Ability` configuration against an `action` and `subject`.
2. **Strict Core Integration:** Rigorously depend on `@tempot/shared` to elegantly return `AppError` payloads (specifically `UNAUTHORIZED` and `FORBIDDEN` standard codes) via `neverthrow` upon access denial.
3. **Parallel Execution Preparation:** Isolate all generic `Interfaces/Contracts/Types` into a strictly standalone baseline element. The core CASL `AbilityFactory`, the Error Formatting Adapters, and the execution `Guards` must be designed independently, depending ONLY on the core Contracts element.

## 2. Core Components

The package will be structured into the following independent sub-modules to support parallel implementation:

### 2.1 Contracts (`src/contracts/`)
Defines the absolute baseline types and interfaces. **This module has zero dependencies on other parts of `auth-core`.**
- `AppAction`: String literals for actions (e.g., `'create' | 'read' | 'update' | 'delete' | 'manage'`).
- `RoleEnum`: Enum representing the 4 system roles (`GUEST`, `USER`, `ADMIN`, `SUPER_ADMIN`).
- `SessionUser`: Interface representing the user data injected from the session manager.
- **`AppSubjects` (Module Augmentation Target):** An empty interface serving as the integration point for domain modules to register their subjects.

### 2.2 Factory (`src/factory/`)
Responsible for constructing the CASL `Ability` instance based on the user's role and scopes.
- `AbilityFactory`: Takes a `SessionUser` and a list of `defineAbility` functions (provided by domain modules) and returns a configured CASL `Ability` instance.

### 2.3 Guards (`src/guards/`)
Provides the functions used to enforce permissions.
- `Guard`: Pure functions that take an `Ability` instance, an `action`, and a `subject`. Evaluates the permission and returns a `Result<void, AppError>` (using `@tempot/shared`). Returns `UNAUTHORIZED` if the user is unauthenticated (GUEST attempting restricted action) or `FORBIDDEN` if authenticated but lacking permissions.

## 3. Handling Subjects via TypeScript Module Augmentation (Approach 2)

To maintain "TypeScript Strict Mode" while decoupling the core auth package from domain modules, we mandate **TypeScript Module Augmentation** for defining `AppSubjects`.

### 3.1 The Base Contract (`packages/auth-core/src/contracts/subjects.ts`)
The `auth-core` package defines an empty interface:

```typescript
// packages/auth-core/src/contracts/subjects.ts
export interface AppSubjects {}

// Helper type to extract all registered subjects
export type AppSubject = keyof AppSubjects | 'all';
```

### 3.2 The Domain Module Integration (Example: Invoices)
Domain modules independently augment this interface. Parallel agents implementing domain modules **MUST** use this pattern:

```typescript
// modules/invoices/src/abilities.ts
import { AppSubjects } from '@tempot/auth-core';

// 1. Augment the global AppSubjects interface
declare module '@tempot/auth-core' {
  interface AppSubjects {
    Invoice: 'Invoice';
  }
}

// 2. Define the abilities for this module
export const defineInvoiceAbilities = (user: SessionUser) => {
  return defineAbility((can, cannot) => {
    // TypeScript now fully understands 'Invoice' as a valid subject!
    can('read', 'Invoice');
    if (user.role === 'ADMIN') {
        can('manage', 'Invoice');
    }
  });
};
```

This ensures perfect end-to-end IntelliSense without ever coupling to or intrinsically modifying the `auth-core` package.

## 4. Execution Flow (Option A)

The `Guard` expects the caller to first call the `AbilityFactory` and explicitly pass the resulting `Ability` object.

```typescript
// 1. Caller obtains the user (e.g., from SessionManager)
const user: SessionUser = { id: 1, role: 'USER' };

// 2. Caller builds the abilities (gathering definitions from relevant modules)
const ability = AbilityFactory.build(user, [defineInvoiceAbilities]);

// 3. Caller executes the Guard
const checkResult = Guard.enforce(ability, 'update', 'Invoice');

if (checkResult.isErr()) {
  // Returns standard AppError (UNAUTHORIZED or FORBIDDEN)
  return checkResult.error;
}
// Proceed with action...
```

## 5. Parallel Implementation Plan

The `auth-core` package can be implemented concurrently by subagents:

1. **Task 1: Contracts Agent:** Implements `src/contracts/` (Roles, Actions, `AppSubjects` augmentation interface).
2. **Task 2: Errors/Result Adapter Agent:** Implements the integration with `@tempot/shared` `Result` and `AppError` types specifically for auth failures (creating specific `UNAUTHORIZED` and `FORBIDDEN` error instances).
3. **Task 3: Factory Agent:** Implements `src/factory/` (CASL builder logic). Depends ONLY on Task 1 and CASL.
4. **Task 4: Guards Agent:** Implements `src/guards/`. Depends ONLY on Task 1, Task 2, and CASL.

*(Note: In Gemini CLI environments, these tasks will be executed sequentially by the generalist or executing-plans agent, but the decoupled design remains identical).*

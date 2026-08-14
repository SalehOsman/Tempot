# @tempot/auth-core

CASL-based authorization core. Provides role hierarchy, ability factory, and permission guard using the Result pattern.

## Phase

Phase 1 — Foundation

## Dependencies

| Package          | Purpose                    |
| ---------------- | -------------------------- |
| `@casl/ability`  | RBAC + ABAC engine         |
| `@tempot/shared` | `AppError`, Result pattern |
| `neverthrow`     | Result type                |

## Exports

All public API is re-exported from `src/index.ts`:

**Contracts:**

- `RoleEnum` — enum with `GUEST`, `USER`, `ADMIN`, `SUPER_ADMIN`
- `AppAction` — `'create' | 'read' | 'update' | 'delete' | 'manage'`
- `AppSubjects` — extensible interface for subject registration
- `AppSubject` — `keyof AppSubjects | 'all'`
- `SessionUser` — `{ id: string | number; role: RoleEnum | \`${RoleEnum}\`; [key: string]: unknown }`

**Factory:**

- `AbilityFactory` — static `build()` method that merges ability definitions
- `AbilityDefinition` — callback type `(user: SessionUser) => AnyAbility`

**Guard:**

- `Guard` — static `enforce()` method for permission checks

**Errors:**

- `UnauthorizedError` — `AppError` with code `'auth.unauthorized'`
- `ForbiddenError` — `AppError` with code `'auth.forbidden'`

## API

### AbilityFactory.build()

Accepts a `SessionUser` and an array of `AbilityDefinition` callbacks. Merges all CASL rules and returns a single ability object.

```typescript
import { AbilityFactory, AbilityDefinition, SessionUser } from '@tempot/auth-core';
import { defineAbility } from '@casl/ability';

const invoiceAbilities: AbilityDefinition = (user: SessionUser) =>
  defineAbility((can) => {
    if (user.role === 'SUPER_ADMIN') {
      can('manage', 'all');
      return;
    }
    if (user.role === 'ADMIN') {
      can('read', 'Invoice');
      can('create', 'Invoice');
    }
    if (user.role === 'USER') {
      can('read', 'Invoice', { userId: user.id });
    }
  });

const result = AbilityFactory.build(user, [invoiceAbilities]);
// Result<AnyAbility, AppError>
```

### Guard.enforce()

Checks whether an ability permits a given action on a subject. Returns `ok(undefined)` on success or `err(AppError)` with code `'auth.forbidden'` on denial.

```typescript
import { Guard } from '@tempot/auth-core';

const result = Guard.enforce(ability, 'read', 'Invoice');
if (result.isErr()) {
  // result.error.code === 'auth.forbidden'
  // result.error.details === { action: 'read', subject: 'Invoice' }
}
```

### Error Classes

```typescript
import { UnauthorizedError, ForbiddenError } from '@tempot/auth-core';

const err1 = new UnauthorizedError(); // code: 'auth.unauthorized'
const err2 = new ForbiddenError({ reason: 'insufficient role' }); // code: 'auth.forbidden'
```

## Role Hierarchy

| Role          | Level | Description             |
| ------------- | ----- | ----------------------- |
| `SUPER_ADMIN` | 4     | `can('manage', 'all')`  |
| `ADMIN`       | 3     | Module management       |
| `USER`        | 2     | Standard feature access |
| `GUEST`       | 1     | Minimal read access     |

Role enforcement is not built into this package. Roles are expressed through `AbilityDefinition` callbacks that each consuming module provides.

## Design Decisions

- **No thrown exceptions** — all public methods return `Result<T, AppError>`
- **No middleware** — this package provides primitives only; middleware is composed by consuming packages
- **Implicit deny** — an empty definitions array produces an ability with no permissions
- **Extensible subjects** — modules augment `AppSubjects` to register their own subject types

## Status

Implemented (Phase 1).

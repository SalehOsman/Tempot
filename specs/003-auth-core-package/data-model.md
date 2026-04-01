# Data Model: Auth Core

## Entities

### `RoleEnum`

Enumeration of the four authorization levels in the system. Defines the role hierarchy from least to most privileged.

**Storage:** In-memory only (no database persistence in this package). Role values are string enums used in session data and CASL ability definitions.

| Value         | String Value    | Description                                      | Privilege Level |
| ------------- | --------------- | ------------------------------------------------ | --------------- |
| `GUEST`       | `'GUEST'`       | Unauthenticated user, minimal access             | Lowest          |
| `USER`        | `'USER'`        | Authenticated regular user                       | Standard        |
| `ADMIN`       | `'ADMIN'`       | Administrator, may be scoped to specific modules | Elevated        |
| `SUPER_ADMIN` | `'SUPER_ADMIN'` | Full system access, God Mode (`manage`, `all`)   | Highest         |

**Note:** Unlike a numeric enum (as the plan proposed), the actual implementation uses string enums. This allows direct comparison with session data without mapping functions.

---

### `AppAction`

Union type defining the five permitted authorization actions. Maps directly to CASL's action concept.

**Storage:** Type-only — no runtime representation beyond string literals.

| Value      | Description                                     |
| ---------- | ----------------------------------------------- |
| `'create'` | Create a new entity                             |
| `'read'`   | Read/view an entity                             |
| `'update'` | Modify an existing entity                       |
| `'delete'` | Remove an entity                                |
| `'manage'` | All actions (CASL wildcard — used for God Mode) |

---

### `AppSubjects`

Extensible interface for authorization subjects. Designed as an empty interface that consuming packages augment via declaration merging.

**Storage:** Type-only — no runtime representation.

| Field             | Type | Description                                                         |
| ----------------- | ---- | ------------------------------------------------------------------- |
| (empty by design) | --   | Consuming packages extend this interface to register their subjects |

**Extension pattern:**

```typescript
// In a consuming package (e.g., cms-engine):
declare module '@tempot/auth-core' {
  interface AppSubjects {
    Article: Article;
    Category: Category;
  }
}
```

---

### `AppSubject`

Derived type representing a valid authorization subject — either a key from `AppSubjects` or the literal `'all'`.

**Definition:** `type AppSubject = keyof AppSubjects | 'all'`

When `AppSubjects` is empty (no extensions), `AppSubject` resolves to `'all'` only. As packages register subjects, the union grows automatically.

---

### `SessionUser`

The user identity structure expected by the ability factory. Injected from upstream session management.

**Storage:** In-memory only (resolved from session context at request time).

| Field   | Type                          | Description                           | Constraints                        |
| ------- | ----------------------------- | ------------------------------------- | ---------------------------------- |
| `id`    | `string \| number`            | User identifier from the database     | Required                           |
| `role`  | `RoleEnum \| \`${RoleEnum}\`` | User's authorization role             | Required, must be valid `RoleEnum` |
| `[key]` | `unknown`                     | Extensible fields (scopes, org, etc.) | Index signature for forward compat |

**Note:** The `role` field accepts both the enum value and its template literal string form. This allows session data serialized as plain strings to pass type checks without explicit casting.

---

### `AbilityDefinition`

Function type that defines permissions for a specific module/domain. Each consuming package provides one or more definitions.

**Definition:** `type AbilityDefinition = (user: SessionUser) => AnyAbility`

**Usage pattern:**

```typescript
// Each module defines its own ability rules:
const cmsAbilities: AbilityDefinition = (user) =>
  defineAbility((can) => {
    if (user.role === RoleEnum.ADMIN) can('manage', 'Article');
    if (user.role === RoleEnum.USER) can('read', 'Article');
  });
```

---

### `UnauthorizedError`

Typed error class for authentication failures (user not identified).

| Field     | Type       | Description                    | Source                |
| --------- | ---------- | ------------------------------ | --------------------- |
| `code`    | `string`   | Always `'UNAUTHORIZED'`        | Constructor           |
| `i18nKey` | `string`   | Always `'errors.UNAUTHORIZED'` | Derived by `AppError` |
| `details` | `unknown?` | Optional context               | Constructor           |

---

### `ForbiddenError`

Typed error class for authorization failures (user identified but not permitted).

| Field     | Type       | Description                        | Source                |
| --------- | ---------- | ---------------------------------- | --------------------- |
| `code`    | `string`   | Always `'FORBIDDEN'`               | Constructor           |
| `i18nKey` | `string`   | Always `'errors.FORBIDDEN'`        | Derived by `AppError` |
| `details` | `unknown?` | Optional context (action, subject) | Constructor           |

---

## Relationships

```
SessionUser
  └── role: RoleEnum
  └── passed to AbilityDefinition[]
        └── produces AnyAbility (CASL)
              └── consumed by Guard.enforce(ability, action, subject)
                    ├── ok(undefined)  → access granted
                    └── err(AppError)  → ForbiddenError { action, subject }
```

- `AbilityFactory.build()` accepts a `SessionUser` and merges rules from multiple `AbilityDefinition` callbacks.
- `Guard.enforce()` consumes the resulting `AnyAbility` to check a specific `AppAction` + `AppSubject` pair.
- `AppSubjects` is extended by consuming packages via TypeScript declaration merging — auth-core itself defines no concrete subjects.

## Storage Mechanisms

- **No database tables.** This package has zero Prisma schema or database models.
- **No persistence.** All entities are in-memory types and runtime objects.
- **CASL abilities** are constructed per-request from session data and module-provided definitions.
- **Error objects** are ephemeral — created at the point of denial and consumed by upstream error handlers.

## Data Flow

```
Upstream Session Manager
  └─ provides SessionUser { id, role, ...scopes }
       └─ AbilityFactory.build(user, definitions)
            └─ Merges rules from all AbilityDefinition callbacks
                 └─ Returns Result<AnyAbility, AppError>
                      └─ Guard.enforce(ability, action, subject)
                           ├─ ok(undefined)  → handler proceeds
                           └─ err(AppError)  → FORBIDDEN with { action, subject }

Module Registration (consuming packages):
  └─ Each module exports AbilityDefinition functions
       └─ Collected and passed to AbilityFactory.build()
            └─ SUPER_ADMIN: can('manage', 'all') via definition
            └─ ADMIN: scoped via CASL conditions in definition
            └─ USER: read-only or specific permissions
            └─ GUEST: minimal/no permissions (empty rules)
```

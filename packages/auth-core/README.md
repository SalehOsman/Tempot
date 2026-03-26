# @tempot/auth-core

> CASL-based RBAC + ABAC. 4-tier role hierarchy with Scoped Authorization.

## Purpose

- `defineAbility(user)` — builds CASL ability object per user role
- `AuthGuard` — grammY and Hono middleware for role enforcement
- `can(ability, action, subject)` — helper for conditional UI rendering
- SUPER_ADMIN God Mode — `can('manage', 'all')` bypasses all checks
- Scoped Authorization — restrict module access to specific named users
- `@casl/prisma` integration via `accessibleBy(ability)` for automatic query filtering

## Phase

Phase 2 — The Nervous System

## Dependencies

| Package             | Purpose                      |
| ------------------- | ---------------------------- |
| `@casl/ability` 6.x | RBAC + ABAC engine — ADR-013 |
| `@casl/prisma`      | Prisma query integration     |
| `@tempot/database`  | User role lookup             |
| `@tempot/logger`    | Denied access logging        |
| `@tempot/shared`    | AppError, Result pattern     |

## Role Hierarchy

| Role          | Level | Capabilities                            |
| ------------- | ----- | --------------------------------------- |
| `SUPER_ADMIN` | 4     | `can('manage', 'all')` — absolute power |
| `ADMIN`       | 3     | Module management, scoped access        |
| `USER`        | 2     | Standard feature access                 |
| `GUEST`       | 1     | Minimal read access                     |

## API

```typescript
// Define abilities per module
import { defineAbility } from '@casl/ability';

export const defineInvoiceAbilities = (user: SessionUser) => {
  return defineAbility((can) => {
    if (user.role === 'SUPER_ADMIN') {
      can('manage', 'all');
      return;
    }
    if (user.role === 'ADMIN') {
      can('read', 'Invoice');
      can('create', 'Invoice');
      can('update', 'Invoice', { createdBy: user.id });
    }
    if (user.role === 'USER') {
      can('read', 'Invoice', { userId: user.id });
    }
  });
};

// Prisma integration
const invoices = await prisma.invoice.findMany({
  where: accessibleBy(ability, 'read').Invoice,
});

// grammY middleware
bot.use(AuthGuard({ minRole: 'ADMIN' }));

// Hono middleware
app.use('/api/*', authMiddleware({ minRole: 'ADMIN' }));
```

## ADRs

- ADR-013 — CASL over custom RBAC

## Status

✅ **Implemented** — Phase 1

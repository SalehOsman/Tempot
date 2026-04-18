# Auth Core Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the foundational authentication and authorization core using CASL for RBAC and Scoped Authorization.

**Architecture:** A centralized authority that defines user abilities based on roles (GUEST, USER, ADMIN, SUPER_ADMIN). Supports scoped permissions where admins can be limited to specific modules or entities. Integrates with AuditLogger to track all denied access attempts.

**Tech Stack:** TypeScript, @casl/ability, @casl/prisma, neverthrow.

---

### Task 1: Role Definitions & Hierarchy

**Files:**

- Create: `packages/auth-core/src/roles/role.definitions.ts`
- Test: `packages/auth-core/tests/unit/role.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { UserRole, isAtLeastRole } from '../src/roles/role.definitions';

describe('Role Hierarchy', () => {
  it('should correctly identify role levels', () => {
    expect(isAtLeastRole(UserRole.ADMIN, UserRole.USER)).toBe(true);
    expect(isAtLeastRole(UserRole.USER, UserRole.ADMIN)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/auth-core/tests/unit/role.test.ts`
Expected: FAIL (isAtLeastRole not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
export enum UserRole {
  GUEST = 1,
  USER = 2,
  ADMIN = 3,
  SUPER_ADMIN = 4,
}

export function isAtLeastRole(current: UserRole, target: UserRole): boolean {
  return current >= target;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/auth-core/tests/unit/role.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/auth-core/src/roles/role.definitions.ts
git commit -m "feat(auth): define user roles and hierarchy"
```

---

### Task 2: CASL Ability Factory

**Files:**

- Create: `packages/auth-core/src/ability/ability.factory.ts`
- Test: `packages/auth-core/tests/unit/ability.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { createAbilityForUser } from '../src/ability/ability.factory';
import { UserRole } from '../src/roles/role.definitions';

describe('Ability Factory', () => {
  it('should grant manage all to SUPER_ADMIN', () => {
    const ability = createAbilityForUser({ id: '1', role: UserRole.SUPER_ADMIN });
    expect(ability.can('manage', 'all')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/auth-core/tests/unit/ability.test.ts`
Expected: FAIL (createAbilityForUser not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { UserRole } from '../roles/role.definitions';

export function createAbilityForUser(user: { id: string; role: UserRole }) {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  if (user.role === UserRole.SUPER_ADMIN) {
    can('manage', 'all');
  } else if (user.role === UserRole.ADMIN) {
    can('read', 'all');
    // Scoping logic will go here
  }

  return build();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/auth-core/tests/unit/ability.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/auth-core/src/ability/ability.factory.ts
git commit -m "feat(auth): implement basic CASL ability factory"
```

---

### Task 3: Scoped Authorization Logic

**Files:**

- Modify: `packages/auth-core/src/ability/ability.factory.ts`
- Test: `packages/auth-core/tests/unit/scoped-auth.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { createAbilityForUser } from '../src/ability/ability.factory';
import { UserRole } from '../src/roles/role.definitions';

describe('Scoped Authorization', () => {
  it('should allow admin to update only their scoped entities', () => {
    const user = { id: '1', role: UserRole.ADMIN, scopes: ['Invoices'] };
    const ability = createAbilityForUser(user);
    expect(ability.can('update', 'Invoice')).toBe(true);
    expect(ability.can('update', 'User')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/auth-core/tests/unit/scoped-auth.test.ts`
Expected: FAIL (No scoping logic)

- [ ] **Step 3: Write minimal implementation**

```typescript
// Update createAbilityForUser to handle scopes
export function createAbilityForUser(user: { id: string; role: UserRole; scopes?: string[] }) {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  if (user.role === UserRole.SUPER_ADMIN) {
    can('manage', 'all');
  } else if (user.role === UserRole.ADMIN) {
    user.scopes?.forEach((scope) => {
      can('manage', scope);
    });
  }

  return build();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/auth-core/tests/unit/scoped-auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/auth-core/src/ability/ability.factory.ts
git commit -m "feat(auth): add scoped authorization logic for admins"
```

---

### Task 4: Audit Logging for Denied Access (FR-006)

**Files:**

- Create: `packages/auth-core/src/middleware/auth.guard.ts`
- Test: `packages/auth-core/tests/unit/auth-guard.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { AuthGuard } from '../src/middleware/auth.guard';

describe('AuthGuard', () => {
  it('should log to AuditLogger when access is denied', async () => {
    const auditLogger = { log: vi.fn() };
    const guard = new AuthGuard(auditLogger as any);
    const result = await guard.check({ id: '1', role: 1 }, 'manage', 'all');
    expect(result.isErr()).toBe(true);
    expect(auditLogger.log).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED' }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/auth-core/tests/unit/auth-guard.test.ts`
Expected: FAIL (AuthGuard not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { createAbilityForUser } from '../ability/ability.factory';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

export class AuthGuard {
  constructor(private auditLogger: any) {}

  async check(user: any, action: string, subject: string): Promise<Result<void, AppError>> {
    const ability = createAbilityForUser(user);
    if (ability.can(action, subject)) {
      return ok(undefined);
    }

    await this.auditLogger.log({
      userId: user.id,
      userRole: user.role,
      action: 'auth.access_denied',
      module: 'auth-core',
      targetId: subject,
      before: null,
      after: null,
      status: 'FAILED',
      timestamp: new Date(),
    });

    return err(new AppError('auth.permission_denied', `Access denied for ${action} on ${subject}`));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/auth-core/tests/unit/auth-guard.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/auth-core/src/middleware/auth.guard.ts
git commit -m "feat(auth): implement AuthGuard with AuditLog integration for denied access (FR-006)"
```

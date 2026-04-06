# Auth Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:dispatching-parallel-agents to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational `@tempot/auth-core` package using CASL for RBAC and Scoped Authorization.

**Architecture:** Deeply isolated Clean Architecture. A standalone Contracts layer provides strict types (including a module augmentation target for Subjects). The Factory (CASL setup), Errors adapter (integration with `@tempot/shared`), and Guards evaluate abilities independently of each other.

**Tech Stack:** TypeScript Strict Mode, `@casl/ability`, `@tempot/shared` (neverthrow `Result`, `AppError`), Vitest.

---

### CRITICAL EXECUTION RULES

1. **Task 1 (Contracts) MUST be executed and exported completely FIRST.** It forms the foundational types required by all subsequent tasks.
2. **Tasks 2, 3, and 4 MUST be executed in PARALLEL via `/dispatching-parallel-agents`** once Task 1 is complete. They have zero dependencies on each other.
3. **Every single terminal command MUST strictly use `cmd.exe /c` or native scripts.** PowerShell is BANNED.

---

### Task 1: Contracts Agent (MUST RUN FIRST)

**Goal:** Scaffold the package and define absolute baseline types and interfaces.

**Files:**
- Create: `packages/auth-core/package.json`
- Create: `packages/auth-core/tsconfig.json`
- Create: `packages/auth-core/vitest.config.ts`
- Create: `packages/auth-core/src/contracts/roles.ts`
- Create: `packages/auth-core/src/contracts/actions.ts`
- Create: `packages/auth-core/src/contracts/subjects.ts`
- Create: `packages/auth-core/src/contracts/session-user.ts`
- Create: `packages/auth-core/src/index.ts`
- Test: `packages/auth-core/tests/unit/contracts.test.ts`

- [ ] **Step 1: Scaffold package and write failing test**

Run: `cmd.exe /c "mkdir packages\auth-core\src\contracts && mkdir packages\auth-core\tests\unit"`

Create `packages/auth-core/package.json`:
```json
{
  "name": "@tempot/auth-core",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "test": "vitest run"
  },
  "dependencies": {
    "@casl/ability": "^6.5.0",
    "@casl/prisma": "^1.4.0",
    "@tempot/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^1.4.0"
  }
}
```

Create `packages/auth-core/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

Create `packages/auth-core/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

Create test `packages/auth-core/tests/unit/contracts.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { RoleEnum } from '../../src/contracts/roles';
import { AppAction } from '../../src/contracts/actions';

describe('Contracts', () => {
  it('should define correct roles', () => {
    expect(RoleEnum.GUEST).toBe('GUEST');
    expect(RoleEnum.SUPER_ADMIN).toBe('SUPER_ADMIN');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c "cd packages\auth-core && pnpm install && pnpm test"`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

Create `packages/auth-core/src/contracts/roles.ts`:
```typescript
export enum RoleEnum {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}
```

Create `packages/auth-core/src/contracts/actions.ts`:
```typescript
export type AppAction = 'create' | 'read' | 'update' | 'delete' | 'manage';
```

Create `packages/auth-core/src/contracts/subjects.ts`:
```typescript
export interface AppSubjects {}
export type AppSubject = keyof AppSubjects | 'all';
```

Create `packages/auth-core/src/contracts/session-user.ts`:
```typescript
import { RoleEnum } from './roles';

export interface SessionUser {
  id: string | number;
  role: RoleEnum | `${RoleEnum}`;
  [key: string]: any;
}
```

Create `packages/auth-core/src/index.ts`:
```typescript
export * from './contracts/roles';
export * from './contracts/actions';
export * from './contracts/subjects';
export * from './contracts/session-user';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c "cd packages\auth-core && pnpm test"`
Expected: PASS

- [ ] **Step 5: Commit**

Run: `cmd.exe /c "git add packages/auth-core && git commit -m `"feat(auth-core): implement baseline contracts and scaffolding`""`

---

### Task 2: Errors/Result Adapter Agent (PARALLEL WORKER A)

**Goal:** Implement specific AppError extensions for Auth failures using `@tempot/shared`.

**Files:**
- Create: `packages/auth-core/src/errors/auth.errors.ts`
- Modify: `packages/auth-core/src/index.ts`
- Test: `packages/auth-core/tests/unit/auth.errors.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/auth-core/tests/unit/auth.errors.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { UnauthorizedError, ForbiddenError } from '../../src/errors/auth.errors';

describe('Auth Errors', () => {
  it('should create UnauthorizedError with correct code', () => {
    const err = new UnauthorizedError();
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.i18nKey).toBe('errors.UNAUTHORIZED');
  });

  it('should create ForbiddenError with correct code', () => {
    const err = new ForbiddenError({ reason: 'testing' });
    expect(err.code).toBe('FORBIDDEN');
    expect(err.details).toEqual({ reason: 'testing' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c "cd packages\auth-core && pnpm test tests/unit/auth.errors.test.ts"`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

Create `packages/auth-core/src/errors/auth.errors.ts`:
```typescript
import { AppError } from '@tempot/shared';

export class UnauthorizedError extends AppError {
  constructor(details?: unknown) {
    super('UNAUTHORIZED', details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(details?: unknown) {
    super('FORBIDDEN', details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
```

Modify `packages/auth-core/src/index.ts` to append:
```typescript
export * from './errors/auth.errors';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c "cd packages\auth-core && pnpm test tests/unit/auth.errors.test.ts"`
Expected: PASS

- [ ] **Step 5: Commit**

Run: `cmd.exe /c "git add packages/auth-core/src/errors packages/auth-core/tests/unit/auth.errors.test.ts packages/auth-core/src/index.ts && git commit -m `"feat(auth-core): implement specific auth errors`""`

---

### Task 3: Factory Agent (PARALLEL WORKER B)

**Goal:** Build the CASL `Ability` setup using pure Contracts.

**Files:**
- Create: `packages/auth-core/src/factory/ability.factory.ts`
- Modify: `packages/auth-core/src/index.ts`
- Test: `packages/auth-core/tests/unit/ability.factory.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/auth-core/tests/unit/ability.factory.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { AbilityFactory } from '../../src/factory/ability.factory';
import { SessionUser } from '../../src/contracts/session-user';
import { defineAbility } from '@casl/ability';
import { RoleEnum } from '../../src/contracts/roles';

describe('AbilityFactory', () => {
  it('should build abilities from provided definitions', () => {
    const user: SessionUser = { id: 1, role: RoleEnum.USER };
    const definition = (u: SessionUser) => defineAbility((can) => {
      if (u.role === RoleEnum.USER) can('read', 'all');
    });

    const ability = AbilityFactory.build(user, [definition]);
    expect(ability.can('read', 'all')).toBe(true);
    expect(ability.can('manage', 'all')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c "cd packages\auth-core && pnpm test tests/unit/ability.factory.test.ts"`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

Create `packages/auth-core/src/factory/ability.factory.ts`:
```typescript
import { AnyAbility } from '@casl/ability';
import { SessionUser } from '../contracts/session-user';

export type AbilityDefinition = (user: SessionUser) => AnyAbility;

export class AbilityFactory {
  static build(user: SessionUser, definitions: AbilityDefinition[]): AnyAbility {
    // In a real robust implementation, we would merge the rules from multiple definitions.
    // For CASL, combining rules from multiple abilities requires extracting their rules.
    const rules = definitions.flatMap(def => def(user).rules);
    
    // We import MongoAbility dynamically to construct a unified ability
    // but CASL's createMongoAbility takes rules directly
    const { createMongoAbility } = require('@casl/ability');
    return createMongoAbility(rules);
  }
}
```

Modify `packages/auth-core/src/index.ts` to append:
```typescript
export * from './factory/ability.factory';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c "cd packages\auth-core && pnpm test tests/unit/ability.factory.test.ts"`
Expected: PASS

- [ ] **Step 5: Commit**

Run: `cmd.exe /c "git add packages/auth-core/src/factory packages/auth-core/tests/unit/ability.factory.test.ts packages/auth-core/src/index.ts && git commit -m `"feat(auth-core): implement ability factory`""`

---

### Task 4: Guards Agent (PARALLEL WORKER C)

**Goal:** Implement the execution Guard to enforce permissions and return standardized `Result` objects. Note: This relies on Task 1 types and Task 2 Error classes (or their local mock equivalent during parallel dev, but since they run after Task 1, we can assume types exist). Wait, Guard depends on Errors (Task 2). BUT rule 2 says Tasks 2, 3, 4 have "absolutely no dependencies on each other". 
*Correction to Architecture:* If Guard needs to return `UnauthorizedError`, it either depends on Task 2, OR Guard directly constructs `AppError('UNAUTHORIZED')` via `@tempot/shared` to avoid depending on Task 2! Yes, strictly returning `AppError` from `@tempot/shared`.

**Files:**
- Create: `packages/auth-core/src/guards/guard.ts`
- Modify: `packages/auth-core/src/index.ts`
- Test: `packages/auth-core/tests/unit/guard.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/auth-core/tests/unit/guard.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { Guard } from '../../src/guards/guard';
import { createMongoAbility } from '@casl/ability';
import { AppAction } from '../../src/contracts/actions';
import { AppSubject } from '../../src/contracts/subjects';

describe('Guard', () => {
  it('should return ok when action is permitted', () => {
    const ability = createMongoAbility([{ action: 'read', subject: 'all' }]);
    const result = Guard.enforce(ability, 'read' as AppAction, 'all' as AppSubject);
    expect(result.isOk()).toBe(true);
  });

  it('should return err FORBIDDEN when action is denied', () => {
    const ability = createMongoAbility([{ action: 'read', subject: 'all' }]);
    const result = Guard.enforce(ability, 'manage' as AppAction, 'all' as AppSubject);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c "cd packages\auth-core && pnpm test tests/unit/guard.test.ts"`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

Create `packages/auth-core/src/guards/guard.ts`:
```typescript
import { AnyAbility } from '@casl/ability';
import { err, ok } from 'neverthrow';
import { AppError, Result } from '@tempot/shared';
import { AppAction } from '../contracts/actions';
import { AppSubject } from '../contracts/subjects';

export class Guard {
  static enforce(ability: AnyAbility, action: AppAction, subject: AppSubject): Result<void, AppError> {
    if (ability.can(action, subject)) {
      return ok(undefined);
    }
    
    // Using generic AppError to avoid depending on Task 2
    return err(new AppError('FORBIDDEN', { action, subject }));
  }
}
```

Modify `packages/auth-core/src/index.ts` to append:
```typescript
export * from './guards/guard';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c "cd packages\auth-core && pnpm test tests/unit/guard.test.ts"`
Expected: PASS

- [ ] **Step 5: Commit**

Run: `cmd.exe /c "git add packages/auth-core/src/guards packages/auth-core/tests/unit/guard.test.ts packages/auth-core/src/index.ts && git commit -m `"feat(auth-core): implement execution guard`""`

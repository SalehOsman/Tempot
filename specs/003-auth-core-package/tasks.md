# Auth Core — Task Breakdown

**Feature:** 003-auth-core-package  
**Source:** spec.md (Clarified) + plan.md (Corrected)  
**Generated:** 2026-04-01  
**Note:** Retroactive artifact — written from implemented code, not from plan.

---

## Task 0: Package Scaffolding

**Priority:** P0 (prerequisite for all other tasks)  
**Estimated time:** 5 min  
**FR:** None (infrastructure)

**Files created:**

- `packages/auth-core/.gitignore`
- `packages/auth-core/tsconfig.json`
- `packages/auth-core/package.json`
- `packages/auth-core/vitest.config.ts`
- `packages/auth-core/src/index.ts` (barrel)
- `packages/auth-core/tests/unit/` (directory)

**Test file:** N/A (infrastructure only — validated by 10-point checklist)

**Acceptance criteria:**

- [x] All 10 points of `docs/developer/package-creation-checklist.md` pass
- [x] `package.json` has `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`
- [x] `package.json` has exact versions: `vitest: "4.1.0"`, `typescript: "5.9.3"`, `neverthrow: "8.2.0"`
- [x] Dependencies: `@casl/ability: ^6.5.0`, `@tempot/shared: workspace:*`, `neverthrow: 8.2.0`
- [x] `src/index.ts` exists as barrel file re-exporting all modules
- [x] No compiled artifacts in `src/`

---

## Task 1: Contract Type Definitions (Roles, Actions, Subjects)

**Priority:** P0 (dependency for all other tasks)  
**Estimated time:** 5 min  
**FR:** FR-001, FR-002

**Files created:**

- `packages/auth-core/src/contracts/auth.roles.ts`
- `packages/auth-core/src/contracts/auth.actions.ts`
- `packages/auth-core/src/contracts/auth.subjects.ts`
- `packages/auth-core/src/contracts/session.types.ts`

**Test file:** `packages/auth-core/tests/unit/contracts.test.ts`

**Acceptance criteria:**

- [x] `RoleEnum` enum exported with exactly four values: `GUEST`, `USER`, `ADMIN`, `SUPER_ADMIN` (FR-002)
- [x] `AppAction` type exported as union: `'create' | 'read' | 'update' | 'delete' | 'manage'` (FR-001)
- [x] `AppSubjects` interface exported as extensible empty interface
- [x] `AppSubject` type exported as `keyof AppSubjects | 'all'`
- [x] `SessionUser` interface exported with `id: string | number`, `role: RoleEnum | \`${RoleEnum}\``, and index signature `[key: string]: unknown`
- [x] Tests verify correct role string values (e.g., `RoleEnum.GUEST === 'GUEST'`)
- [x] Tests verify `AppAction` type assignment
- [x] No `any` types
- [x] All tests pass

---

## Task 2: CASL Ability Factory

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-001, FR-003, FR-004, FR-005  
**Dependencies:** Task 0, Task 1

**Files created:**

- `packages/auth-core/src/factory/ability.factory.ts`

**Test file:** `packages/auth-core/tests/unit/ability.factory.test.ts`

**Acceptance criteria:**

- [x] `AbilityFactory` class exported with static `build()` method (FR-003)
- [x] `build()` accepts `SessionUser` and array of `AbilityDefinition` callbacks
- [x] `AbilityDefinition` type exported: `(user: SessionUser) => AnyAbility`
- [x] `build()` merges rules from all provided definitions using `createMongoAbility` (FR-001)
- [x] `build()` returns `Result<AnyAbility, AppError>` — no thrown exceptions
- [x] Empty definitions array returns ability with no permissions (implicit deny)
- [x] `SUPER_ADMIN` God Mode achievable via definition that calls `can('manage', 'all')` (FR-004)
- [x] Scoped authorization achievable via CASL conditions in definitions (FR-005)
- [x] Authorization check (ability.can) completes in < 5ms — benchmark test validates performance (SC-001)
- [x] No `any` types
- [x] All tests pass

---

## Task 3: Auth Guard (Permission Enforcement)

**Priority:** P1  
**Estimated time:** 10 min  
**FR:** FR-006, FR-007  
**Dependencies:** Task 1, Task 2

**Files created:**

- `packages/auth-core/src/guards/auth.guard.ts`

**Test file:** `packages/auth-core/tests/unit/auth.guard.test.ts`

**Acceptance criteria:**

- [x] `Guard` class exported with static `enforce()` method (FR-007)
- [x] `enforce()` accepts `AnyAbility`, `AppAction`, and `AppSubject` parameters
- [x] Returns `Result<void, AppError>` — `ok(undefined)` when permitted, `err(AppError)` when denied
- [x] Denied access returns `AppError` with code `'FORBIDDEN'` and includes `{ action, subject }` details (FR-006)
- [x] Tests verify permitted access returns `ok`
- [x] Tests verify denied access returns `err` with `FORBIDDEN` code
- [x] SC-001: Guard enforcement completes in < 5ms — benchmark validates overhead
- [x] SC-004: Denied access error includes clear action/subject context for user-facing messages via i18n
- [x] No `any` types
- [x] All tests pass

---

## Task 4: Auth Error Classes

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** FR-006, FR-007  
**Dependencies:** Task 0

**Files created:**

- `packages/auth-core/src/errors/auth.errors.ts`

**Test file:** `packages/auth-core/tests/unit/auth.errors.test.ts`

**Acceptance criteria:**

- [x] `UnauthorizedError` class exported, extends `AppError` with code `'UNAUTHORIZED'`
- [x] `ForbiddenError` class exported, extends `AppError` with code `'FORBIDDEN'`
- [x] Both classes accept optional `details` parameter
- [x] Both classes correctly set prototype chain via `Object.setPrototypeOf`
- [x] `UnauthorizedError` produces i18nKey `'errors.UNAUTHORIZED'`
- [x] `ForbiddenError` preserves details object in `error.details`
- [x] SC-003: Error codes map to audit log entries — `UNAUTHORIZED` and `FORBIDDEN` codes are standardized for downstream audit logging
- [x] SC-004: Error codes produce clear user-facing messages via i18n key convention
- [x] No `any` types
- [x] All tests pass

---

## Task 5: Barrel Exports (`src/index.ts`)

**Priority:** P1  
**Estimated time:** 5 min  
**FR:** All (final integration)  
**Dependencies:** Task 1, 2, 3, 4

**Files updated:**

- `packages/auth-core/src/index.ts`

**Test file:** All existing tests continue to pass

**Acceptance criteria:**

- [x] Exports all contracts: `RoleEnum`, `AppAction`, `AppSubject`, `AppSubjects`, `SessionUser`
- [x] Exports error classes: `UnauthorizedError`, `ForbiddenError`
- [x] Exports factory: `AbilityFactory`, `AbilityDefinition`
- [x] Exports guard: `Guard`
- [x] All existing tests still pass after barrel update
- [x] 10-point package-creation-checklist passes final verification
- [x] No `any` types in any file across the package
- [x] SC-002: All modules can define their own permissions via exported `AbilityDefinition` type
- [x] All public methods return `Result<T, AppError>` — zero thrown exceptions

---

### Task 6: Pluggable Architecture Toggle (Rule XVI)

**Phase**: 1 (Setup)
**Estimated Duration**: 15 minutes

Constitution Rule XVI requires every package to be enable/disable-able via `TEMPOT_{NAME}=true/false` environment variable.

#### Acceptance Criteria

- [ ] Define `TEMPOT_AUTH_CORE` environment variable in package config
- [ ] Guard.enforce() returns ok() (allowing all access) when auth-core is disabled
- [ ] AbilityFactory.build() returns a permissive ability when disabled
- [ ] Document the disable behavior in package README

> **Note**: Disabling auth-core in production is a security risk and should only be used for development/testing.

---

## Task Dependency Graph

```
Task 0 (scaffolding)
  ├─→ Task 1 (contracts)  ─┬─→ Task 2 (AbilityFactory) ─┐
  │                         └─→ Task 3 (Guard)           ─┤─→ Task 5 (barrel exports)
  └─→ Task 4 (errors)     ───────────────────────────────┘
```

## Summary

| Task      | Name           | Priority | Est. Time  | FR Coverage                    | SC Coverage    |
| --------- | -------------- | -------- | ---------- | ------------------------------ | -------------- |
| 0         | Scaffolding    | P0       | 5 min      | Infrastructure                 | --             |
| 1         | Contracts      | P0       | 5 min      | FR-001, FR-002                 | --             |
| 2         | AbilityFactory | P1       | 10 min     | FR-001, FR-003, FR-004, FR-005 | SC-001, SC-002 |
| 3         | Guard          | P1       | 10 min     | FR-006, FR-007                 | SC-001, SC-004 |
| 4         | Auth Errors    | P1       | 5 min      | FR-006, FR-007                 | SC-003, SC-004 |
| 5         | Barrel Exports | P1       | 5 min      | All                            | SC-002         |
| **Total** |                |          | **40 min** |                                |                |

# @tempot/logger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a high-performance Pino technical logger with automatic `AppError` serialization/redaction and a database-backed `AuditLogger`.

**Architecture:**

- **Technical Logger:** Pino instance with custom `mixin` for ALS context and a custom `err` serializer for `AppError`.
- **Audit Logger:** Service using `@tempot/database` to persist state changes following Rule LVII.
- **Redaction:** Centralized `SENSITIVE_KEYS` list applied to both Pino core and recursive error detail obfuscation.

**Tech Stack:** TypeScript, Pino, neverthrow, @tempot/shared, @tempot/session-manager, @tempot/database.

---

### Task 1: Package Initialization & Config

**Files:**

- Create: `packages/logger/package.json`
- Create: `packages/logger/src/config.ts`
- Create: `packages/logger/src/index.ts`

- [ ] **Step 1: Initialize package and install dependencies**
      Run: `cmd /c "cd packages/logger && pnpm add pino neverthrow @tempot/shared@workspace:* @tempot/session-manager@workspace:* @tempot/database@workspace:* && pnpm add -D vitest @types/node"`

- [ ] **Step 2: Define `SENSITIVE_KEYS` in `src/config.ts`**

```typescript
export const SENSITIVE_KEYS = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
```

- [ ] **Step 3: Commit baseline**
      Run: `cmd /c "git add packages/logger/package.json packages/logger/src/config.ts && git commit -m \"chore(logger): initialize package and sensitive keys\""`

---

### Task 2: AppError Serializer (TDD)

**Files:**

- Create: `packages/logger/src/technical/serializer.ts`
- Create: `packages/logger/tests/unit/serializer.test.ts`

- [ ] **Step 1: Write failing tests for AppError serialization**
      Verify:

1. Redaction of `details`.
2. Format of `code` and `i18nKey`.
3. Respecting `loggedAt` flag (Rule XXIII).
4. Stack trace suppression based on `NODE_ENV`.

- [ ] **Step 2: Run tests to verify failure**
      Run: `cmd /c "cd packages/logger && pnpm vitest run tests/unit/serializer.test.ts"`

- [ ] **Step 3: Implement `appErrorSerializer` in `src/technical/serializer.ts`**
      Include recursive obfuscation logic for `details` using `SENSITIVE_KEYS`.

- [ ] **Step 4: Run tests to verify pass**
      Run: `cmd /c "cd packages/logger && pnpm vitest run tests/unit/serializer.test.ts"`

- [ ] **Step 5: Commit serializer**
      Run: `cmd /c "git add packages/logger/src/technical/serializer.ts packages/logger/tests/unit/serializer.test.ts && git commit -m \"feat(logger): implement AppError serializer with recursive redaction (Rule XXIII)\""`

---

### Task 3: Technical Pino Logger (TDD)

**Files:**

- Create: `packages/logger/src/technical/pino.logger.ts`
- Create: `packages/logger/tests/unit/pino-logger.test.ts`

- [ ] **Step 1: Write failing test for ALS context injection**
      Mock `sessionContext` to provide a `userId` and verify it appears in the log JSON.

- [ ] **Step 2: Implement logger in `src/technical/pino.logger.ts`**
      Configure Pino with the `appErrorSerializer`, `mixin` for context, and `redact` for top-level keys.

- [ ] **Step 3: Run tests to verify pass**
      Run: `cmd /c "cd packages/logger && pnpm vitest run tests/unit/pino-logger.test.ts"`

- [ ] **Step 4: Commit logger**
      Run: `cmd /c "git add packages/logger/src/technical/pino.logger.ts packages/logger/tests/unit/pino-logger.test.ts && git commit -m \"feat(logger): implement technical Pino logger with context mixin\""`

---

### Task 4: Audit Logger (TDD)

**Files:**

- Create: `packages/logger/src/audit/audit.logger.ts`
- Create: `packages/logger/tests/integration/audit-logger.test.ts`

- [ ] **Step 1: Write failing integration test for AuditLogger**
      Use `TestDB` utility from Task 2 of Database package. Verify entry exists in DB after `log()` call.

- [ ] **Step 2: Run tests to verify failure**
      Run: `cmd /c "cd packages/logger && pnpm vitest run tests/integration/audit-logger.test.ts"`

- [ ] **Step 3: Implement `AuditLogger` in `src/audit/audit.logger.ts`**
      Ensure it returns `AsyncResult<void>` and merges `userId/userRole` from session context automatically.

- [ ] **Step 4: Run tests to verify pass**
      Run: `cmd /c "cd packages/logger && pnpm vitest run tests/integration/audit-logger.test.ts"`

- [ ] **Step 5: Commit AuditLogger**
      Run: `cmd /c "git add packages/logger/src/audit/audit.logger.ts packages/logger/tests/integration/audit-logger.test.ts && git commit -m \"feat(logger): implement AuditLogger service (Rule LVII)\""`

---

### Task 5: Final Integration & Cleanup

**Files:**

- Modify: `packages/logger/src/index.ts`
- Modify: `package.json` (root)

- [ ] **Step 1: Export all services from `src/index.ts`**
- [ ] **Step 2: Register `@tempot/logger` in root `package.json`**
- [ ] **Step 3: Final full suite verification**
      Run: `cmd /c "pnpm test"`
- [ ] **Step 4: Final commit**
      Run: `cmd /c "git add . && git commit -m \"feat(logger): complete logger package implementation\""`

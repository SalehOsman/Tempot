# Bot Developer Runtime Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a professional development watch command and structured diagnostics for bot commands, inline callbacks, and input-engine flows.

**Architecture:** The root workspace exposes the development command. `bot-server` adds middleware for interaction observation and unhandled callback fallback. `input-engine` adds field lifecycle logs through the existing logger dependency.

**Tech Stack:** TypeScript 5.9.3, grammY 1.41.x, Vitest 4.1.0, Pino-compatible logger, pnpm workspace scripts.

---

### Task 1: Interaction Observer Middleware

**Files:**

- Create: `apps/bot-server/src/bot/middleware/interaction-observer.middleware.ts`
- Create: `apps/bot-server/tests/unit/middleware/interaction-observer.middleware.test.ts`

- [ ] **Step 1: Write failing tests**

Test command updates log `received` and `handled` metadata with duration. Test callback updates log callback data and namespace. Test thrown handlers log `failed` and rethrow.

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
pnpm --filter bot-server test -- tests/unit/middleware/interaction-observer.middleware.test.ts
```

Expected: fail because the middleware does not exist.

- [ ] **Step 3: Implement middleware**

Create a middleware factory that extracts safe metadata, logs before and after `next()`, measures duration with `Date.now()`, and rethrows errors after logging failure.

- [ ] **Step 4: Run test to verify pass**

Run the same test command. Expected: pass.

### Task 2: Callback Fallback Middleware

**Files:**

- Create: `apps/bot-server/src/bot/middleware/callback-fallback.middleware.ts`
- Create: `apps/bot-server/tests/unit/middleware/callback-fallback.middleware.test.ts`
- Modify: `apps/bot-server/locales/ar.json`
- Modify: `apps/bot-server/locales/en.json`

- [ ] **Step 1: Write failing tests**

Test that a callback query reaching fallback logs `bot-server.callback_unhandled`, answers the callback, and replies with the i18n fallback key.

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
pnpm --filter bot-server test -- tests/unit/middleware/callback-fallback.middleware.test.ts
```

Expected: fail because the fallback does not exist.

- [ ] **Step 3: Implement fallback**

Create a final middleware for callback queries. It should log a warning, answer the callback if possible, and reply using `bot-server.callback_unhandled`.

- [ ] **Step 4: Run test to verify pass**

Run the same test command. Expected: pass.

### Task 3: Bot Factory Registration

**Files:**

- Modify: `apps/bot-server/src/bot/bot.factory.ts`
- Modify: `apps/bot-server/tests/unit/bot.factory.test.ts`

- [ ] **Step 1: Update failing registration test**

Expect the bot factory to register the additional observer and fallback middleware.

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
pnpm --filter bot-server test -- tests/unit/bot.factory.test.ts
```

Expected: fail because registration count/order has not changed.

- [ ] **Step 3: Register middleware**

Register interaction observer before conversations and fallback after audit so module handlers get the opportunity to handle callbacks first.

- [ ] **Step 4: Run test to verify pass**

Run the same test command. Expected: pass.

### Task 4: Input-Engine Field Logs

**Files:**

- Modify: `packages/input-engine/src/runner/field.processor.ts`
- Modify: `packages/input-engine/tests/unit/field.processor.test.ts`

- [ ] **Step 1: Add failing lifecycle log tests**

Test logs for field started, cancelled, back navigation, validation failed, validated, and max retries.

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
pnpm --filter @tempot/input-engine test -- tests/unit/field.processor.test.ts
```

Expected: fail because the new log codes are missing.

- [ ] **Step 3: Implement minimal logs**

Add structured `debug`, `info`, or `warn` logs at the exact control decisions without changing return values.

- [ ] **Step 4: Run test to verify pass**

Run the same test command. Expected: pass.

### Task 5: Development Command

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Add script validation**

Inspect existing script usage and add a root script that builds workspace packages before starting the bot development server.

- [ ] **Step 2: Verify script is listed**

Run:

```powershell
pnpm run
```

Expected: `dev:bot` appears in the root script list.

### Task 6: Documentation Sync

**Files:**

- Modify: `docs/developer/module-capability-reuse-standard.md`

- [ ] **Step 1: Document observability requirement**

Add a concise section requiring module handlers to use shared UX helpers, pass unrelated callback namespaces onward, and rely on bot-server observability.

- [ ] **Step 2: Verify markdown hygiene**

Run:

```powershell
pnpm lint
```

Expected: no new lint issue from changed files.

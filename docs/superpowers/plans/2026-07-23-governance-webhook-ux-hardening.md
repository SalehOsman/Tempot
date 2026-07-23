# Governance Webhook UX Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add enforceable controls for webhook rate-limit identity, body limits,
Telegram keyboard UX, and staging smoke evidence.

**Architecture:** Runtime HTTP hardening remains in `apps/bot-server`. New
governance and smoke checks live in `scripts/ci/` and `scripts/operations/`,
following existing read-only audit and evidence patterns.

**Tech Stack:** TypeScript 5.9.3, Hono 4.x, Vitest 4.1.0, native Node.js
filesystem and HTTP APIs, existing `pnpm` scripts.

---

### Task 1: Trusted Proxy Rate Limit Identity

**Files:**
- Modify: `apps/bot-server/src/server/hono.factory.ts`
- Test: `apps/bot-server/tests/unit/hono.factory.test.ts`
- Docs: `docs/operations/deployment.md`

- [x] **Step 1: Write failing tests**

Add tests proving that when `trustedClientIpHeader` is configured and the
header is missing, `/webhook` returns `502` and does not call
`bot.handleUpdate`.

- [x] **Step 2: Verify RED**

Run:

```powershell
pnpm exec vitest run --project=unit apps/bot-server/tests/unit/hono.factory.test.ts
```

Expected: the new missing-header test fails because current behavior uses
`unknown-client`.

- [x] **Step 3: Implement minimal code**

Change the rate-limit middleware so `clientRateLimitKey` returns a discriminated
result. Missing trusted headers return a `502` response before bucket lookup.

- [x] **Step 4: Verify GREEN**

Run the same focused test and confirm it passes.

### Task 2: Body Limit Edge Coverage

**Files:**
- Modify: `apps/bot-server/src/server/hono.factory.ts` only if the test exposes
  a behavior gap.
- Test: `apps/bot-server/tests/unit/hono.factory.test.ts`
- Docs: `apps/bot-server/README.md`

- [x] **Step 1: Write failing or regression tests**

Add a request without `content-length` whose cloned body exceeds the configured
limit. Assert `413` and no bot processing.

- [x] **Step 2: Verify RED or Existing Coverage**

Run the focused Hono factory test. If the test already passes, document it as a
regression guard and avoid changing production code.

- [x] **Step 3: Implement only if needed**

If the test fails, fix the existing body-limit middleware at the source.

- [x] **Step 4: Verify GREEN**

Run the focused test again.

### Task 3: Telegram Keyboard UX Audit

**Files:**
- Create: `scripts/ci/telegram-keyboard-ux-audit.ts`
- Create: `scripts/ci/tests/unit/telegram-keyboard-ux-audit.test.ts`
- Modify: `scripts/ci/methodology-lint.ts`
- Modify: `package.json`
- Docs: `docs/developer/methodology-lint.md`

- [x] **Step 1: Write failing audit tests**

Add fixtures that prove the audit reports:

- four buttons in one row;
- Arabic locale label longer than 20 characters;
- English locale label longer than 24 characters;
- missing locale key.

Also add a passing fixture with single-button rows.

- [x] **Step 2: Verify RED**

Run:

```powershell
pnpm exec vitest run --project=unit scripts/ci/tests/unit/telegram-keyboard-ux-audit.test.ts
```

Expected: fails because the audit does not exist.

- [x] **Step 3: Implement the audit**

Implement a deterministic read-only scanner for module menu factories and their
co-located `locales/ar.json` and `locales/en.json` files.

- [x] **Step 4: Wire command**

Add `telegram-keyboard-ux:check` to `package.json`. Add the audit to
`methodology-lint.ts` after `eslint-disable` so pre-commit quick mode can catch
new UX regressions.

- [x] **Step 5: Verify GREEN**

Run the focused audit test, then run the audit against production files.

### Task 4: Staging Webhook Smoke Evidence Command

**Files:**
- Create: `scripts/operations/staging-webhook-smoke.ts`
- Create: `scripts/operations/tests/unit/staging-webhook-smoke.test.ts`
- Modify: `package.json`
- Docs: `docs/operations/release-evidence-template.md`

- [x] **Step 1: Write failing smoke tests**

Use a local test server in Vitest. Verify the script checks `/live`, checks
optional `/ready`, sends a signed `/webhook` update, and writes Markdown
evidence.

- [x] **Step 2: Verify RED**

Run:

```powershell
pnpm exec vitest run --project=unit scripts/operations/tests/unit/staging-webhook-smoke.test.ts
```

Expected: fails because the smoke script does not exist.

- [x] **Step 3: Implement script**

Implement a TypeScript CLI that reads `TEMPOT_STAGING_BASE_URL`,
`WEBHOOK_SECRET_TOKEN`, required `TEMPOT_READINESS_TOKEN`, and optional
`TEMPOT_EVIDENCE_OUTPUT`.

- [x] **Step 4: Wire command**

Add `smoke:staging:webhook` to `package.json`.

- [x] **Step 5: Verify GREEN**

Run focused smoke tests.

### Task 5: Documentation And Spec Sync

**Files:**
- Modify: `specs/057-production-delivery-hardening/tasks.md`
- Modify: `specs/059-methodology-lint-coverage/tasks.md`
- Modify: `specs/064-admin-user-access-console/tasks.md`
- Modify: `docs/developer/workflow-guide.md`
- Modify: `docs/developer/methodology-lint.md`
- Modify: `docs/operations/deployment.md`

- [x] **Step 1: Update affected tasks**

Mark the new hardening slice as an implementation continuation without
claiming production go/no-go completion.

- [x] **Step 2: Update developer docs**

Document existing ESLint size gates and the new Telegram keyboard UX gate.

- [x] **Step 3: Update operations docs**

Document trusted-proxy behavior, body-limit configuration, and staging smoke
evidence command.

### Task 6: Verification And Commit

Run:

```powershell
pnpm exec vitest run --project=unit apps/bot-server/tests/unit/hono.factory.test.ts scripts/ci/tests/unit/telegram-keyboard-ux-audit.test.ts scripts/operations/tests/unit/staging-webhook-smoke.test.ts
pnpm telegram-keyboard-ux:check
pnpm methodology:lint
pnpm cms:check
pnpm lint
pnpm build:bot-runtime
pnpm spec:validate
git diff --check
```

`pnpm smoke:staging:webhook` requires a real staging URL and secrets. Unit tests
cover its behavior locally; live staging evidence must be recorded when the
Docker Desktop or staging environment is running.

Commit with scoped commits if the implementation crosses concerns:

- `fix(bot-server): harden webhook client identity`
- `chore(methodology): enforce telegram keyboard ux`
- `chore(operations): add staging webhook smoke evidence`
- `docs(governance): document active hardening gates`

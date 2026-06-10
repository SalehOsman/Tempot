# Authorization Correction Implementation Plan

> **For Codex:** Execute this plan task-by-task with strict RED -> GREEN -> REFACTOR evidence.

**Goal:** Remove the incorrect global `manage all` requirement while preserving deny-by-default authorization for every active Telegram command and callback.

**Architecture:** Global bot middleware resolves the Telegram actor, rejects unusable session states, builds the combined production CASL ability, and attaches immutable actor context. A startup-owned `AbilityRegistry` receives module-owned ability definitions during module loading. Commands and callbacks enforce explicit action/subject policy at their owning module boundary before business logic or mutation.

**Tech Stack:** TypeScript 5.9.3 strict mode, grammY 1.41.x, CASL 6.x, neverthrow 8.2.0, Vitest 4.1.0.

---

## Task 1: Establish Execution Baseline

**Files:**
- Modify: `specs/053-authorization-correction/quickstart.md`
- Modify: `specs/053-authorization-correction/tasks.md`

**Steps:**
1. Create isolated worktree `F:\Tempot_Worktrees\053-authorization-correction` on branch `codex/053-authorization-correction`.
2. Install/link workspace dependencies without changing the lockfile.
3. Run focused baseline commands:
   - `pnpm --filter @tempot/auth-core test`
   - `pnpm --filter bot-server exec vitest run tests/unit/middleware/auth.middleware.test.ts tests/unit/deps.bot-factory.test.ts`
4. Record exact results and known unrelated failures in `quickstart.md`.
5. Mark T001, T002, and T004 complete only after evidence is recorded.

## Task 2: Define the Authorization Runtime Contract

**Files:**
- Create: `apps/bot-server/src/authorization/ability-registry.ts`
- Create: `apps/bot-server/src/authorization/context-authorization.ts`
- Modify: `apps/bot-server/src/bot-server.types.ts`
- Modify: `apps/bot-server/src/startup/deps.orchestrator.ts`
- Modify: `apps/bot-server/src/startup/module-loader.ts`
- Test: `apps/bot-server/tests/unit/authorization/ability-registry.test.ts`
- Test: `apps/bot-server/tests/unit/authorization/context-authorization.test.ts`
- Test: `apps/bot-server/tests/unit/module-loader.test.ts`

**RED:**
1. Test that registry definitions are initially empty, register by module name, replace duplicate module registrations deterministically, and return an immutable snapshot.
2. Test that authorization rejects missing actor/ability context and denies disallowed action/subject pairs without invoking protected work.
3. Test that module loading registers a named `abilityDefinition` export before setup.

**GREEN:**
1. Implement a startup-scoped registry with no global singleton.
2. Extend the module importer contract with optional `abilityDefinition`.
3. Register definitions before module setup and inject the same registry into bot construction.
4. Implement localized, structured context authorization using the existing logger and CASL ability.

**REFACTOR:**
1. Keep registry and context helper independent of module implementations.
2. Remove duplicate unsafe context casts behind typed accessors.

## Task 3: Correct Authentication Middleware

**Files:**
- Modify: `packages/auth-core/src/contracts/session.types.ts`
- Modify: `apps/bot-server/src/bot/middleware/auth.middleware.ts`
- Modify: `apps/bot-server/src/startup/deps.bot-factory.ts`
- Test: `apps/bot-server/tests/unit/middleware/auth.middleware.test.ts`
- Test: `apps/bot-server/tests/unit/deps.bot-factory.test.ts`

**RED:**
1. Replace the synthetic USER `manage all` fixture with a real USER rule and prove middleware currently blocks it.
2. Test ACTIVE USER, ACTIVE GUEST, missing identity, BANNED session, PENDING session, session resolution error, and ability-definition failure.
3. Test that runtime session mapping preserves status and distinguishes “not found” from infrastructure failure.

**GREEN:**
1. Extend actor context with `status: ACTIVE | BANNED | PENDING | UNRESOLVED`.
2. Change session resolution to a typed result rather than collapsing all failures to `null`.
3. Deny missing identity, banned/pending actors, and infrastructure failures.
4. Remove `Guard.enforce(ability, 'manage', 'all')`.
5. Attach session user and combined production ability before `next()`.

**REFACTOR:**
1. Centralize denial logging fields: actor ID, role, status, outcome, and reason.
2. Preserve localized user-facing messages and security-chain order.

## Task 4: Standardize Module Ability Exports

**Files:**
- Modify: `modules/*/abilities.ts`
- Modify: `modules/*/index.ts`
- Test: affected `modules/*/tests/abilities.test.ts`

**RED:**
1. Add role matrix tests for GUEST, USER, ADMIN, and SUPER_ADMIN using each module's production ability definition.
2. Prove only SUPER_ADMIN receives `manage all`.
3. Document and test explicit public/bootstrap policy for `/start`.

**GREEN:**
1. Export every module policy as `abilityDefinition`.
2. Replace empty ability arrays with CASL definitions matching approved module access.
3. Keep specialized action/subject types local to each module.
4. Correct the user-management guest/profile mismatch by assigning guest access only to the explicit bootstrap subject.

**REFACTOR:**
1. Reuse small role-policy builders only when they reduce real duplication.
2. Do not add direct module-to-module imports.

## Task 5: Enforce Command Policies

**Files:**
- Modify: `modules/*/index.ts`
- Test: affected module command tests
- Create: `apps/bot-server/tests/integration/authorization-role-matrix.test.ts`

**RED:**
1. Add allowed and denied command cases for every active command.
2. Include at least one allowed and denied case for each role where policy permits.
3. Assert denied state-changing commands invoke no service/repository mutation.

**GREEN:**
1. Wrap each `bot.command` registration with explicit module/action/subject authorization.
2. Classify `/start` as bootstrap; classify all other commands as authenticated/protected.
3. Use production module definitions, not synthetic broad abilities.

**REFACTOR:**
1. Keep registration declarations readable and policy-adjacent.
2. Remove obsolete manual command role checks only after equivalent CASL tests are green.

## Task 6: Enforce Callback and Conversation Policies

**Files:**
- Modify: `modules/*/handlers/callback.handler.ts`
- Modify: `modules/user-management/handlers/users.callback.handler.ts`
- Modify: relevant conversation entry files under `modules/bot-management/flows/`
- Test: affected callback/conversation tests

**RED:**
1. Add policy-map tests for every handled callback namespace/action.
2. Add stale-role, old-message, disabled-module, missing actor, and unauthorized mutation tests.
3. Prove denied callbacks do not call protected services.

**GREEN:**
1. Resolve callback data to an explicit action/subject before dispatch.
2. Authorize before fetching protected collections or mutating state.
3. Replace manual role comparisons with module CASL decisions.
4. Add explicit policy to conversation entry and state-changing transitions.

**REFACTOR:**
1. Use one policy resolver per module.
2. Keep callback parsing separate from authorization and business dispatch.

## Task 7: Authorization Coverage Governance

**Files:**
- Create: `docs/developer/authorization-coverage.md`
- Create: `scripts/validate-authorization-coverage.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Test: `tests/governance/authorization-coverage.test.ts` or existing governance test location

**RED:**
1. Generate inventory from module configs and flow files.
2. Fail when an active command or handled callback lacks a matrix row.

**GREEN:**
1. Document classification, action, subject, enforcement owner, allowed roles, denied roles, and test reference.
2. Add `pnpm authorization:validate`.
3. Run the validation in CI using the existing governance pattern.

**REFACTOR:**
1. Keep the validator deterministic and dependency-free.
2. Treat config/flow declarations as inventory sources, not as runtime authorization grants.

## Task 8: Reconciliation and Completion

**Files:**
- Modify: `specs/053-authorization-correction/*.md`
- Modify: `docs/ROADMAP.md`
- Add: required changeset files

**Steps:**
1. Run focused module/auth tests first.
2. Run:
   - `pnpm --filter bot-server test`
   - affected module tests
   - `pnpm --filter @tempot/auth-core test`
   - `pnpm lint`
   - `pnpm build`
   - `pnpm test:unit`
   - `pnpm test:integration`
   - `pnpm boundary:audit`
   - `pnpm cms:check`
   - `pnpm authorization:validate`
   - `pnpm spec:validate`
3. Perform a local review against the constitution and Spec 053; record all findings and fixes.
4. Update tasks, quickstart evidence, SpecKit artifacts, roadmap status, and changesets.
5. Confirm zero Critical/High authorization findings before merge preparation.

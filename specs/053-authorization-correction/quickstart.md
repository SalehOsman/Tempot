# Quickstart: Authorization Correction Verification

## Purpose

Verify the implementation increment without requiring a live Telegram bot.

## RED Baseline

1. Build a USER and ADMIN through the production ability factory.
2. Send a representative allowed command and callback through the current
   middleware chain.
3. Confirm the tests fail because the global middleware requires `manage all`.
4. Attempt an ADMIN-only mutation as USER and assert no mutation.

## Execution Baseline - 2026-06-07

**Worktree**: `F:\Tempot_Worktrees\053-authorization-correction`
**Branch**: `codex/053-authorization-correction`
**Base commit**: `6de17cb`

The fresh worktree required generated workspace artifacts before tests could
resolve package exports:

```powershell
pnpm install --frozen-lockfile
pnpm --filter @tempot/database db:generate
pnpm build
```

Results:

- `pnpm install --frozen-lockfile`: PASS. The optional `cpu-features` native
  build reported that no compiler type was detected on Node.js 24.11.1, but
  pnpm completed successfully and the package is not part of the authorization
  runtime.
- Initial `pnpm build`: FAILED because Prisma Client had not been generated in
  the fresh worktree.
- `pnpm --filter @tempot/database db:generate`: PASS.
- Repeated `pnpm build`: PASS for all 32 buildable workspace projects.
- `pnpm --filter @tempot/auth-core test`: PASS, 6 files and 13 tests.
- Focused bot authorization baseline: PASS, 2 files and 6 tests.
- `pnpm --filter @tempot/user-management test`: PASS, 5 files and 16 tests.
- `pnpm --filter @tempot/template-management test`: PASS, 11 files and 74 tests.
- `pnpm --filter @tempot/bot-management test`: PASS, 15 files and 70 tests.

The full `pnpm --filter bot-server test` baseline has 184 passing and 3 failing
tests. These failures predate Spec 053 and are tracked by Spec 056:

1. `tests/unit/middleware/audit.middleware.test.ts`: expected interaction trace
   metadata is absent from the audit write.
2. `tests/unit/error-boundary.test.ts`: expected interaction trace metadata is
   absent from the structured error log.
3. `tests/integration/e2e.test.ts`: the removed `test-module` fixture has no
   built `dist/module.config.js`, so startup reports zero loaded modules.

The authorization implementation must not increase this baseline failure set.
These failures remain production blockers, but they are not feature-owned
acceptance failures for Spec 053 because the approved remediation sequence
assigns their repair to Spec 056.

## GREEN Verification

1. Repeat the role matrix after the global middleware correction.
2. Confirm allowed USER and ADMIN flows reach their handlers.
3. Confirm insufficient, disabled, and missing actors are denied.
4. Confirm SUPER_ADMIN retains `manage all`.
5. Confirm every denial precedes repository mutation.

## Implementation Evidence - 2026-06-07

- Production ability definitions are registered before module setup and remain
  available through one stable runtime registry.
- GUEST, USER, ADMIN, and SUPER_ADMIN role-matrix tests use actual module
  ability definitions.
- Commands in all eight active modules use explicit authorization guards.
- Callback and text-state handlers enforce action/subject policies before work.
- Bot registration and lifecycle conversations refresh authorization before
  commit.
- Zero-mutation tests cover settings writes, bot lifecycle transitions,
  template creation entry, user-management service access, and role text state.
- `pnpm authorization:check`: PASS, 8 modules checked, 0 violations.
- `pnpm lint`: PASS.
- Affected module tests: PASS, 248 tests after authorization additions.
- Full `pnpm --filter bot-server test`: 207 passing, 3 failing. The failure set
  is identical to the recorded baseline and remains assigned to Spec 056.

## Regression Commands

```powershell
pnpm --filter bot-server test
pnpm test:unit
pnpm test:integration
pnpm lint
pnpm build
pnpm boundary:audit
pnpm authorization:check
pnpm cms:check
pnpm spec:validate
```

## Review Evidence

- Authorization coverage matrix.
- RED and GREEN test output.
- Production ability factory role cases.
- Denial audit/log examples with no PII.
- Code-review report with zero Critical/High authorization findings.

# Quickstart: Bot Access Mode and Membership Gate

This quickstart describes expected verification after implementation.

## Prerequisites

- Local PostgreSQL and Redis available through Docker Compose.
- Bot token configured for local testing.
- Super-admin Telegram identity configured and present in the local database.
- Migrations applied.

## Scenario 1: Private Mode Unknown Visitor

1. Configure access mode as `private` or leave it unset.
2. Use a Telegram identity that has no active `UserProfile`.
3. Send `/start`.
4. Verify the response shows only membership request/status/bootstrap actions.
5. Send `/settings`, `/profile`, `/users`, and at least one module command.
6. Verify each protected command is denied before the module handler runs.
7. Press an old protected callback button if available.
8. Verify the callback is denied and no protected action executes.

## Scenario 2: Membership Request Lifecycle

1. From the unknown visitor, submit a membership request.
2. Send `/start` again.
3. Verify pending status is shown and internal features remain hidden.
4. From the super-admin account, open the administration menu.
5. Open membership management.
6. Verify an empty-state message with a back action appears if no pending requests exist.
7. Inspect the pending request when one exists.
8. Approve the request.
9. From the visitor account, send `/start`.
10. Verify the member menu appears according to `USER` permissions.

## Scenario 3: Role-Filtered Menus

1. Render or snapshot menu output for unknown visitor, pending visitor, `USER`, `ADMIN`, and `SUPER_ADMIN`.
2. Verify unknown private visitor sees only bootstrap membership actions.
3. Verify pending visitor sees only pending status and allowed bootstrap actions.
4. Verify `USER` does not see settings, users, or membership-management admin controls.
5. Verify `ADMIN` sees only admin capabilities granted by abilities.
6. Verify `SUPER_ADMIN` sees membership-management and access-mode controls.

## Scenario 4: Public Mode

1. From the super-admin account, change access mode to `public`.
2. From an unknown visitor account, send `/start`.
3. Verify only bootstrap and explicitly public capabilities appear.
4. Attempt protected/member/admin commands directly.
5. Verify protected/member/admin commands remain denied.
6. Change access mode back to `private`.
7. Verify unknown visitor `/start` returns to membership-only behavior.

## Scenario 5: Audit Evidence

1. Submit a membership request.
2. Approve or reject it.
3. Change access mode.
4. Inspect audit records.
5. Verify actor, target, action, result, and timestamp are present without plaintext protected data leakage.

## Expected Verification Commands

```powershell
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
```

For early implementation loops, run the smallest relevant package or module tests first, then run full gates before merge.

# Quickstart: Data Integrity Hardening Verification

## Atomic Update

1. Seed a user with known identity fields.
2. Inject a failure at each persistence step.
3. Verify all fields and audit state remain unchanged.
4. Run a successful update and verify one logical audit event.

## Soft Delete

1. Seed active and deleted records for affected models.
2. Attempt normal reads with conflicting deletion filters.
3. Verify only active rows are returned.
4. Exercise the privileged recovery repository with allowed and denied actors.

## Repository Boundary

1. Run the boundary audit.
2. Confirm current prohibited application Prisma calls are detected by the new
   failing fixture.
3. Replace calls with repositories and confirm zero violations.

## Pagination

1. Seed enough rows to exceed one page.
2. Filter and request a middle and out-of-range page.
3. Verify totals.
4. Inspect query evidence to confirm aggregate count and no full-list fetch.

## Gates

```powershell
pnpm --filter @tempot/database test
pnpm --filter @tempot/user-management test
pnpm --filter @tempot/template-management test
pnpm --filter bot-server test
pnpm boundary:audit
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
```

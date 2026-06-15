# Quickstart: Data Integrity Hardening Verification

## Reconciliation Baseline - 2026-06-15

| Surface                  | Current behavior                                      | Foundation action                          |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------ |
| User identity update     | Up to four independent writes through `Promise.all`   | Replace with one repository operation      |
| Prisma soft-delete reads | Caller `isDeleted` can overwrite the default scope    | Apply protected scope after caller filters |
| BaseRepository reads     | Nested or flat caller filters can overwrite the scope | Apply protected scope last                 |
| User pagination          | Second full `findMany` supplies `totalCount`          | Deferred to remaining Spec 055             |
| Template pagination      | Full result queries supply counts in three methods    | Deferred to remaining Spec 055             |
| Bot pagination           | Full result query supplies `totalCount`               | Deferred to remaining Spec 055             |
| Startup Prisma access    | Direct audit/event reads and session upsert           | Deferred to remaining Spec 055             |

The current foundation does not expose deleted-record recovery. That contract
requires the authorization and protected-audit integration completed around
Spec 054.

## Foundation Evidence - 2026-06-15

- Atomic identity state: commit `41d8273`
- Non-overridable normal soft-delete reads: commit `e42cce8`
- Normal `BaseRepository.findMany` access is protected.
- Prisma filters only models that implement soft delete.
- Storage purge reads deleted attachments through a purpose-specific internal
  query rather than the normal read path.
- Full lint, the 32-project build, and boundary audit passed.

Authorized deleted-record recovery, protected audit transaction integration,
repository-only startup access, and aggregate pagination remain open.

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

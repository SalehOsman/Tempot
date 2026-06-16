# Quickstart: Data Integrity Hardening Verification

## Reconciliation Baseline - 2026-06-15

| Surface                  | Baseline behavior                                     | Current action                             |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------ |
| User identity update     | Up to four independent writes through `Promise.all`   | Replaced with one repository operation     |
| Prisma soft-delete reads | Caller `isDeleted` can overwrite the default scope    | Protected scope applies after filters      |
| BaseRepository reads     | Nested or flat caller filters can overwrite the scope | Protected scope applies last               |
| User pagination          | Second full `findMany` supplies `totalCount`          | Replaced with aggregate count              |
| Template pagination      | Full result queries supply counts in three methods    | Replaced with aggregate count              |
| Bot pagination           | Full result query supplies `totalCount`               | Replaced with aggregate count              |
| Startup Prisma access    | Direct audit/event reads and session upsert           | Replaced with explicit repositories        |

Deleted-record recovery is available only through the explicit privileged
repository contract with authorization input and recovery audit evidence.

## Foundation Evidence - 2026-06-15

- Atomic identity state: commit `41d8273`
- Non-overridable normal soft-delete reads: commit `e42cce8`
- Normal `BaseRepository.findMany` access is protected.
- Prisma filters only models that implement soft delete.
- Storage purge reads deleted attachments through a purpose-specific internal
  query rather than the normal read path.
- Full lint, the 32-project build, and boundary audit passed.

## Completion Evidence - 2026-06-16

- Repository-only startup access: commit `4f8f7b0`
- Aggregate pagination: commit `a9faa52`
- Privileged recovery contract: commit `f55d409`
- Production startup data-contract adapters no longer use `as never`.
- Boundary audit covers governed direct Prisma model access.
- Bot-server, database, template-management, and bot-management focused tests
  passed for their changed surfaces.

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

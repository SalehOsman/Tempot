# @tempot/membership-management

Membership request workflow for private/public bot access control.

## Purpose

This module owns membership request persistence and review state transitions. It does not create or mutate user profiles directly; profile activation remains owned by `user-management` and will be connected through an approved event boundary.

## Implemented

- Visitor callback handler for `membership:request`.
- Administrator review callbacks for pending list, detail, approve, and reject.
- Administrator review inline menus.
- Empty pending-list state with a back-to-main-menu action.
- PostgreSQL persistence through `PrismaMembershipRequestRepository`.
- Pending request lookup by Telegram id.
- Submit, approve, and reject service methods.
- Event publication for submitted, approved, and rejected requests.
- Typed event names and payload contracts for submitted, approved, rejected, cancelled, and expired request events.
- English and Arabic locale keys.
- CASL ability definition for membership request management.
- User-management approval consumer for default member profile activation.

## Access Boundary

- `membership:request` is bootstrap-only and allowed for unknown visitors.
- Membership administration callbacks such as `membership:list` are protected by `manage.membership-request`.
- Approval emits `membership-management.request.approved`, which `user-management` consumes through its own boundary.
- Services and handlers use the repository boundary; they do not access Prisma directly.

## Follow-up Scope

- Visitor-facing cancellation and automatic expiry commands are not exposed yet.
- Production rollout evidence remains governed by Spec #057 and is outside this module.

## Verification

```powershell
pnpm --filter @tempot/membership-management build
pnpm --filter @tempot/membership-management test -- --run tests/unit/membership-request.service.test.ts tests/handlers/callback.handler.test.ts tests/integration/membership-request.repository.test.ts
```

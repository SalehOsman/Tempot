# Contract: Membership Workflow

## Purpose

This contract defines how visitors request membership and how administrators review those requests.

## Visitor Flow

### Submit Request

**Actor**: Unknown or rejected visitor when resubmission policy allows.

**Preconditions**:

- Telegram identity is present.
- No active `PENDING` membership request exists for the same Telegram identity.
- Bot access mode allows bootstrap membership actions.

**Result**:

- Create `MembershipRequest` with status `PENDING`.
- Emit `membership-management.request.submitted`.
- Audit request submission.
- Return i18n-backed confirmation.

**Idempotency**:

- If a pending request already exists, return pending status and do not create a duplicate.

### View Status

**Actor**: Visitor with pending, rejected, cancelled, expired, or approved request.

**Result**:

- Return only the visitor's own request status.
- Do not expose reviewer-only notes or protected audit fields.

## Administrator Flow

### List Requests

**Actor**: Actor with membership-management review ability.

**Result**:

- Paginated list of pending requests.
- No protected personal data beyond what the administrator is permitted to view.

### Inspect Request

**Actor**: Actor with membership-management review ability.

**Result**:

- Request details, safe Telegram identity snapshot, status, and review controls.

### Approve Request

**Actor**: Actor with membership-management approval ability.

**Preconditions**:

- Request exists.
- Request status is `PENDING`.
- Reviewer still has approval ability at execution time.

**Result**:

- Mark request as `APPROVED`.
- Emit `membership-management.request.approved`.
- User-management creates or activates the profile with default member role.
- Membership request stores `createdUserProfileId` when the user-management outcome is known.
- Emit or record `user-management.profile.created_from_membership`.
- Audit approval.

**Concurrency**:

- If another reviewer already completed the request, return the current terminal status and do not create a second profile.

### Reject Request

**Actor**: Actor with membership-management rejection ability.

**Preconditions**:

- Request exists.
- Request status is `PENDING`.
- Reviewer still has rejection ability at execution time.

**Result**:

- Mark request as `REJECTED`.
- Store rejection reason according to protected-data policy.
- Emit `membership-management.request.rejected`.
- Audit rejection.
- Visitor sees only the safe rejection response and resubmission options allowed by policy.

## Permissions

| Capability | Default Role |
| --- | --- |
| Submit membership request | Unknown bootstrap |
| View own request status | Unknown bootstrap |
| List membership requests | `ADMIN`, `SUPER_ADMIN` |
| Inspect membership request | `ADMIN`, `SUPER_ADMIN` |
| Approve membership request | `SUPER_ADMIN` by default; `ADMIN` only if explicitly granted |
| Reject membership request | `SUPER_ADMIN` by default; `ADMIN` only if explicitly granted |
| Change access mode | `SUPER_ADMIN` |

Exact CASL ability names must be defined during implementation and documented in module README files.

## Locale Keys

Implementation must introduce locale keys for:

- Membership request button label
- Pending status
- Approved status
- Rejected status
- Request submitted confirmation
- Duplicate pending request message
- Access denied for unknown visitor
- Access denied for pending visitor
- Admin list title
- Admin request details
- Approve action
- Reject action
- Access mode current value
- Access mode changed confirmation

No new user-facing string may be hardcoded in TypeScript.

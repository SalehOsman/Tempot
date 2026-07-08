# Contract: Bot Access Control

## Purpose

This contract defines how Telegram interactions are classified, how actors are resolved, and how access decisions are enforced consistently for menu rendering, commands, and callbacks.

## Capability Classification

| Classification | Meaning | Unknown Private | Unknown Public | Member | Admin |
| --- | --- | --- | --- | --- | --- |
| `bootstrap` | Start, join request, request status, minimal safe help | Allow | Allow | Allow | Allow |
| `public` | Explicitly public feature | Deny unless also bootstrap | Allow | Allow if ability permits | Allow if ability permits |
| `member` | Member self-service feature | Deny | Deny | Allow if ability permits | Allow if ability permits |
| `protected` | Authenticated internal feature | Deny | Deny | Allow if ability permits | Allow if ability permits |
| `admin` | Administration feature | Deny | Deny | Deny unless explicitly permitted | Allow if ability permits |

Unclassified commands, callbacks, and menu entries are treated as protected during rollout and must be corrected before merge.

## Actor Resolution

### Input

- Telegram update identity
- Optional command name
- Optional callback payload
- Current bot access mode
- User profile lookup result
- Membership request lookup result
- Ability registry output

### Output

```ts
type AccessActorState =
  | "UNKNOWN"
  | "PENDING"
  | "REJECTED"
  | "MEMBER"
  | "ADMIN"
  | "SUPER_ADMIN";

type AccessDecisionReason =
  | "allowed"
  | "bootstrap_allowed"
  | "public_allowed"
  | "profile_not_found"
  | "membership_pending"
  | "membership_rejected"
  | "capability_not_public"
  | "missing_ability"
  | "unclassified_capability"
  | "actor_resolution_failed"
  | "invalid_access_mode";
```

Public implementation must return `Result<AccessDecision, AppError>` for fallible decision APIs.

## Enforcement Requirements

- The gate runs before protected command handlers.
- The gate runs before callback handlers.
- The gate is re-evaluated even when a button was previously rendered.
- Denied interactions must not call target module handlers.
- Denied interactions must return i18n-backed user-facing responses appropriate to actor state.
- Denied interactions must be audit-safe and must not leak internal capability names to unknown visitors.
- Bot liveness/readiness endpoints are outside Telegram membership enforcement.

## Menu Rendering Requirements

- Menu factories receive actor and ability context directly or through an approved navigation provider.
- A visible menu item must have a corresponding allowed access decision.
- Membership-management appears only for actors with membership-management abilities.
- `USER` menus must not include administrator-only capabilities.
- Unknown private visitor menus contain only bootstrap membership actions.
- Unknown public visitor menus contain bootstrap actions and explicitly public actions.

## Command and Callback Requirements

- `/start` is bootstrap but must render different content based on actor state.
- `/profile` is member/protected and denied to unknown or pending visitors.
- `/settings` is admin/protected and denied to unknown, pending, and ordinary users unless ability rules say otherwise.
- `/users` is admin/protected and denied to unknown, pending, and ordinary users unless ability rules say otherwise.
- Module callbacks must include stable capability or namespace metadata so the gate can classify them before dispatch.

## Failure Semantics

- User lookup failure: deny protected behavior.
- Membership lookup failure: deny protected behavior for unknown identity unless actor already has a valid active profile.
- Ability registry failure: deny protected/admin behavior.
- Settings lookup failure: private behavior or startup failure according to implementation decision.
- Invalid access mode: never public.

# Telegram Authorization Coverage

**Spec**: 053 Authorization Correction
**Inventory date**: 2026-06-07
**Status**: Implemented and enforced by `pnpm authorization:check`.

## Policy Rules

- Global middleware establishes actor status, role, and the combined production
  CASL ability. It does not require `manage all`.
- `manage all` is exclusive to `SUPER_ADMIN`.
- `GUEST` is allowed only where this matrix explicitly classifies an entry as
  `bootstrap` or `public`.
- A command, callback, text-state action, or conversation transition is denied
  before business logic when no matrix policy matches.
- Module ability definitions are the runtime policy source. This file is the
  review and coverage contract, not a second authorization implementation.

## Command Coverage

| Entry point | Module | Classification | Action | Subject | Allowed roles | Enforcement owner | Test evidence |
|---|---|---|---|---|---|---|---|
| `/start` | user-management | bootstrap | read | bootstrap | GUEST, USER, ADMIN, SUPER_ADMIN | command registration | runtime registration |
| `/profile` | user-management | protected | read | profile | USER, ADMIN, SUPER_ADMIN | command registration | runtime registration + role matrix |
| `/users` | user-management | protected | manage | users | ADMIN, SUPER_ADMIN | command registration | runtime registration + denial tests |
| `/templates` | template-management | public | read | template | GUEST, USER, ADMIN, SUPER_ADMIN | command registration | runtime registration + role matrix |
| `/new_template` | template-management | protected | create | template | USER, ADMIN, SUPER_ADMIN | command registration | runtime registration + callback denial |
| `/import_template` | template-management | protected | manage | template | ADMIN, SUPER_ADMIN | command registration | runtime registration + role matrix |
| `/bots` | bot-management | protected | read | bot | USER, ADMIN, SUPER_ADMIN | command registration | runtime registration + role matrix |
| `/new_bot` | bot-management | protected | create | bot | ADMIN, SUPER_ADMIN | command registration | runtime registration + commit denial |
| `/settings` | settings-management | protected | read | settings | USER, ADMIN, SUPER_ADMIN | command registration | runtime + ability tests |
| `/notifications` | notification-center | protected | read | notifications | USER, ADMIN, SUPER_ADMIN | command registration | runtime + ability tests |
| `/messages` | content-management | protected | read | content | USER, ADMIN, SUPER_ADMIN | command registration | runtime + ability tests |
| `/stats` | audit-viewer | protected | read | audit | ADMIN, SUPER_ADMIN | command registration | runtime + ability tests |
| `/help` | help-center | protected | read | help | USER, ADMIN, SUPER_ADMIN | command registration | runtime + ability tests |

## Callback Coverage

| Callback or pattern | Module | Classification | Action | Subject | Allowed roles | Enforcement owner | Mutation assertion |
|---|---|---|---|---|---|---|---|
| `menu:main` | user-management | bootstrap | read | bootstrap | GUEST, USER, ADMIN, SUPER_ADMIN | callback policy resolver | N/A |
| `profile:view`, `profile:stats`, `profile:edit`, `profile:edit:personal` | user-management | protected | read | profile | USER, ADMIN, SUPER_ADMIN | callback policy resolver | N/A |
| `profile:edit:name`, `profile:edit:email`, `profile:edit:language`, personal-field prompts | user-management | protected | update | profile | USER, ADMIN, SUPER_ADMIN | callback policy resolver | state setup denied |
| `profile:edit:role` | user-management | protected | manage | users | ADMIN, SUPER_ADMIN | callback policy resolver | state setup denied |
| `users:list`, `users:search`, `users:view:*` | user-management | protected | manage | users | ADMIN, SUPER_ADMIN | callback policy resolver | service calls denied |
| `users:role:*` | user-management | protected | manage | users | ADMIN, SUPER_ADMIN | callback policy resolver | role mutation denied |
| `tmpl:menu`, `tmpl:browse`, `tmpl:export:*` | template-management | public | read | template | GUEST, USER, ADMIN, SUPER_ADMIN | callback policy resolver | N/A |
| `tmpl:my` | template-management | protected | read | template-own | USER, ADMIN, SUPER_ADMIN | callback policy resolver | N/A |
| `tmpl:create` | template-management | protected | create | template | USER, ADMIN, SUPER_ADMIN | callback policy resolver | conversation entry denied |
| `tmpl:rate:*` | template-management | protected | create | rating | USER, ADMIN, SUPER_ADMIN | callback policy resolver | rating mutation denied |
| `botmgmt:list:*`, `botmgmt:view:*` | bot-management | protected | read | bot | USER, ADMIN, SUPER_ADMIN | callback policy resolver | service calls denied |
| `botmgmt:create` | bot-management | protected | create | bot | ADMIN, SUPER_ADMIN | callback policy resolver | conversation entry denied |
| `botmgmt:settings:*` | bot-management | protected | read | settings-profile | USER, ADMIN, SUPER_ADMIN | callback policy resolver | N/A |
| `botmgmt:modules:*` | bot-management | protected | read | module-enablement | USER, ADMIN, SUPER_ADMIN | callback policy resolver | N/A |
| `botmgmt:lifecycle:*` | bot-management | protected | read | bot | USER, ADMIN, SUPER_ADMIN | callback policy resolver | N/A |
| `botmgmt:lifecycle-transition:*`, `botmgmt:lifecycle-reason:*`, `botmgmt:lifecycle-archive-confirm:*`, `botmgmt:lifecycle-archive-start:*`, `botmgmt:archive:*` | bot-management | protected | manage | bot | ADMIN, SUPER_ADMIN | callback policy resolver | lifecycle mutation denied |
| `settings:view`, `settings:profile`, `settings:regional*` | settings-management | protected | read | settings | USER, ADMIN, SUPER_ADMIN | callback policy resolver | N/A |
| `notifications:view`, `notifications:preferences`, `notifications:activity` | notification-center | protected | read | notifications | USER, ADMIN, SUPER_ADMIN | callback policy resolver | N/A |
| `notifications:toggle` | notification-center | protected | update | notifications | USER, ADMIN, SUPER_ADMIN | callback policy resolver | settings write denied |
| `notifications:test` | notification-center | protected | create | notification-test | USER, ADMIN, SUPER_ADMIN | callback policy resolver | event publish and delivery denied |
| `messages:view` and module-owned `messages:*` leaves | content-management | protected | read | content | USER, ADMIN, SUPER_ADMIN | callback policy resolver | N/A |
| `stats:view`, `stats:modules`, `stats:runtime`, `stats:problems`, `stats:timeline` | audit-viewer | protected | read | audit | ADMIN, SUPER_ADMIN | callback policy resolver | repository reads denied |
| `help:view`, `help:commands`, `help:support` | help-center | protected | read | help | USER, ADMIN, SUPER_ADMIN | callback policy resolver | N/A |

## Stateful Text and Conversation Coverage

| Entry point | Module | Classification | Action | Subject | Allowed roles | Enforcement owner | Mutation assertion |
|---|---|---|---|---|---|---|---|
| profile text states except role | user-management | protected | update | profile | USER, ADMIN, SUPER_ADMIN | text-state dispatcher | profile update denied |
| `edit_role` text state | user-management | protected | manage | users | ADMIN, SUPER_ADMIN | text-state dispatcher | role update denied |
| bot registration conversation | bot-management | protected | create | bot | ADMIN, SUPER_ADMIN | conversation entry and commit | bot creation denied |
| lifecycle reason conversation | bot-management | protected | manage | bot | ADMIN, SUPER_ADMIN | conversation entry and transition | lifecycle mutation denied |

## Enforcement Evidence

- Global middleware resolves actor status and builds the combined production
  ability without requiring `manage all`.
- Every configured active command is registered behind
  `authorization.guard(policy)`.
- Every active callback and text handler calls `authorization.enforce` before
  business work.
- Deferred bot-management mutations call `refreshAndEnforce` immediately before
  commit, so role changes during a conversation are re-evaluated.
- Missing sessions become explicitly unresolved GUEST actors; infrastructure
  errors deny without entering module handlers.
- `pnpm authorization:check` compares module configuration, registrations,
  handler enforcement, conversation commit enforcement, and this matrix.

## Related Boundary

Spec 053 introduces no new direct database access. The broader repository
boundary and direct-Prisma remediation identified by the audit remains owned by
Spec 055.

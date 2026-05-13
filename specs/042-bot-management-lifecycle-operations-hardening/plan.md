# Implementation Plan: Bot Management Lifecycle Operations Hardening

**Branch**: `042-bot-management-lifecycle-operations-hardening` | **Date**: 2026-05-13 | **Spec**: `specs/042-bot-management-lifecycle-operations-hardening/spec.md`  
**Input**: Feature specification from `specs/042-bot-management-lifecycle-operations-hardening/spec.md`

## Summary

Complete the production Telegram operating surface for bot lifecycle governance.
The module already owns transition policy, lifecycle service, persistence, and
events. This feature adds inline menus, callback execution, shared
`@tempot/input-engine` reason flows, explicit archive confirmation, and aligned
documentation.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode  
**Primary Dependencies**: `grammy`, `@grammyjs/conversations`,
`@tempot/input-engine`, `@tempot/shared`, `@tempot/i18n-core`,
`@tempot/ux-helpers` patterns already used by the module  
**Storage**: Existing `bot-management` repositories and lifecycle history model  
**Testing**: Vitest 4.1.0 focused unit/integration-style module coverage  
**Target Platform**: Telegram bot runtime hosted by `apps/bot-server`  
**Project Type**: Scoped module production-completion slice  
**Performance Goals**: No additional runtime requirement beyond current module
menu/callback responsiveness  
**Constraints**: Preserve service ownership of transition rules, no hardcoded
user-facing text, no direct Prisma in handlers/services, no duplicate manual
state machines, function/file limits enforced by lint

## Constitution Check

| Rule | Status |
| --- | --- |
| Rule XII: Preserve Existing Patterns | Pass. Extend current callback/menu/service contracts. |
| Rule XIV: Repository Pattern | Pass. Existing lifecycle service/repositories remain authoritative. |
| Rule XXI: Result Pattern | Pass. Lifecycle service already returns `Result<T, AppError>`. |
| Rule XXXIV: TDD Mandatory | Pass. Callback/menu/reason-flow tests are defined before implementation. |
| Rule XXXIX: i18n-Only Rule | Pass. New button labels, prompts, and error text use locale keys. |
| Rule L: Code-Documentation Parity | Pass. README/spec artifacts are reconciled with implemented lifecycle behavior. |
| Rule LXXXII: Handoff Gate | Pass. Feature artifacts exist, reconciliation gates passed, and implementation proceeded through TDD. |

## Capability Reuse Decision Table

| Capability Need | Default Package | Decision | Rationale | Follow-up |
| --- | --- | --- | --- | --- |
| Reason collection for pause, maintenance, archive | `@tempot/input-engine` | `Reuse` | Spec #041 standardized guided Telegram flows for structured input. | Add one lifecycle reason form, not local text-state code. |
| Inline lifecycle navigation and callback composition | Existing module menu/callback layer plus UX helper conventions | `Compose` | The module already owns bot menus and callback routing; this feature adds lifecycle-specific surfaces without new package abstractions. | Keep callback payloads narrow and state-derived. |
| Transition validation, history, events | Existing `LifecycleService` | `Reuse` | Domain policy already exists and must stay authoritative. | Handlers invoke service only. |
| Archive protection | Inline confirmation pattern | `Compose` | Archive is destructive enough to require confirmation before reason capture. | Reuse existing callback routing style and localized copy. |

## Project Structure

### Documentation

```text
specs/042-bot-management-lifecycle-operations-hardening/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- tasks.md
`-- checklists/
    `-- requirements.md

docs/superpowers/specs/
`-- 2026-05-13-bot-management-lifecycle-operations-hardening-design.md
```

### Source Code

```text
modules/bot-management/
|-- handlers/callback.handler.ts
|-- menus/bot-menu.factory.ts
|-- menus/lifecycle-menu.factory.ts                 # new
|-- flows/lifecycle-reason.flow.ts                   # new
|-- services/lifecycle-service.context.ts            # new if needed for setup parity
|-- index.ts
|-- locales/ar.json
|-- locales/en.json
`-- tests/unit/
    |-- lifecycle-menu.factory.test.ts
    |-- lifecycle-callback.handler.test.ts
    |-- lifecycle-reason.flow.test.ts
    `-- lifecycle-runtime-registration.test.ts
```

## Implementation Strategy

### Layer 1: Menu Projection

Write failing tests for lifecycle action projection by state. Implement a small
menu factory that derives valid inline actions from current status and always
preserves back navigation.

### Layer 2: Callback Routing

Write failing tests for `botmgmt:lifecycle:*`,
`botmgmt:lifecycle-transition:*`, and archive confirmation callback paths.
Extend the existing callback handler without bypassing the existing list/detail
paths.

### Layer 3: Lifecycle Reason Form

Write failing tests proving pause, maintenance, and archive enter a shared
conversation-backed input-engine reason flow. Implement one reusable flow that
captures a non-empty reason and then delegates to `LifecycleService`.

### Layer 4: Service Context and Runtime Registration

If setup needs explicit lifecycle service context or conversation registration,
add the smallest module-level context consistent with the current bot service
pattern. Keep setup focused and under lint limits.

### Layer 5: Documentation Sync

Update module README so it no longer describes stale registration-only behavior
and explicitly records lifecycle controls as the current production-completion
slice.

### Layer 6: Verification

Run focused tests first, then module tests, bot-server compatibility if setup
changes touch runtime registration, followed by:

- `pnpm lint`
- `pnpm build`
- `pnpm spec:validate`
- `pnpm cms:check`
- `pnpm boundary:audit`
- `pnpm module:checklist`
- `git diff --check`

## Risk Assessment

| Risk | Mitigation |
| --- | --- |
| Duplicate transition logic leaks into handlers | Force tests around service invocation and keep state policy lookup inside existing contracts/services. |
| Callback payload sprawl | Use a narrow action family and explicit callback parser branches. |
| Archive UX becomes unsafe | Require confirmation before reason collection starts. |
| Conversation setup drifts from registration flow | Mirror Spec #041 module conversation registration patterns. |
| Docs lag implementation | Update README and reconcile Spec #042 in same branch. |

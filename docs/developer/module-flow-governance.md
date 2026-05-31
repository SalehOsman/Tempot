# Module Flow Governance

**Status**: Active standard for Telegram-facing Tempot modules
**Applies to**: Commands, inline menus, callback handlers, module manifests,
module doctor checks, and module creation reviews.

## Purpose

Module flows must be reviewable before implementation and testable after each
change. A module should not rely on manual Telegram testing to discover missing
handlers, repeated callback buttons, stale navigation, or duplicated package
capabilities.

This standard extends the module catalog and capability reuse standard. It does
not replace SpecKit, TDD, review, or verification gates.

## Flow Surfaces

Use these surface types consistently:

| Surface | Meaning |
| --- | --- |
| `main` | The module's root view or command landing view. |
| `parent` | A view that lists child actions. |
| `leaf` | A read-only detail or information view reached from a parent. |
| `action` | A state-changing action result. |
| `confirmation` | A confirm or cancel decision point. |
| `result` | A final status or completion view. |
| `unavailable` | A clear localized response for a visible but unsupported action. |

Parent surfaces show child actions. Leaf surfaces show parent, back, or main
navigation. A leaf surface must not render the same callback that opened it
unless that callback performs a documented state change.

## Required Flow Map

Every governed Telegram-facing module should provide a reviewable flow map. The
first supported format is `module.flow.json` in the module root.

The flow map must identify:

- command or menu entry points
- interaction surfaces
- callback actions
- unavailable actions
- role-sensitive visibility when relevant
- exit paths such as back, cancel, parent, and main menu

## Callback Rules

- Every visible callback must be handled, explicitly unavailable, or omitted.
- Callback namespaces must belong to the owning module.
- Unrelated callback namespaces must pass through to downstream handlers.
- Stale callbacks from old messages must produce a safe response.
- Unsupported visible actions must return localized feedback.

## Package Reuse Rules

Modules must reuse approved package capabilities before writing local code.
Capability decisions use the project classifications:

- `Reuse`
- `Compose`
- `Extend Package`
- `Custom Approved`

Local custom behavior requires an exception rationale before implementation.
Telegram UX should use `@tempot/ux-helpers`; structured input flows should use
`@tempot/input-engine`; AI guidance must use grounded `@tempot/ai-core`
contracts when the AI assistant path is activated.

## Module Doctor Expectations

`pnpm tempot module doctor <module-name>` reports readiness findings. For flow
governance, it checks that:

- `module.flow.json` is present and valid for governed modules
- visible callbacks are mapped
- leaf surfaces do not repeat their opening callback
- handled callback namespaces appear in module source
- callback label keys exist in required locale files

Blocking flow findings must be fixed before a governed module is considered
ready.

## Pilot Rollout

Apply this standard incrementally. Start with one pilot module, prove the flow
map and readiness report, then roll out to other modules only after review.
Do not recreate all modules from scratch unless a specific module is approved
for replacement.

Current governed modules:

- `help-center`: pilot flow map and callback runtime tests.
- `settings-management`: first influential rollout with nested settings,
  regional leaf pages, and cross-module exits to profile and notification
  surfaces.
- `notification-center`: functional operational notification center with
  preferences, recent activity, real test delivery, and governed result
  surfaces.
- `audit-viewer`: operational diagnostics module with governed stats, modules,
  runtime, recent problems, and interaction timeline surfaces.

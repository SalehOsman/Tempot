# Bot Management UX Helpers Reference Standard Design

**Date:** 2026-05-13
**Status:** Approved design for the next implementation cycle
**Scope:** `bot-management` UX standardization plus developer-documentation updates

## Goal

Turn `bot-management` into the reference Telegram-facing module for
`@tempot/ux-helpers`, then document the same reuse expectation for future
modules without prematurely refactoring `user-management` or
`template-management`.

## Current Findings

`bot-management` is already aligned with `@tempot/input-engine` for structured
registration flows, but its presentation layer is not yet the project reference
for `@tempot/ux-helpers`.

Observed gaps:

- Menus are still assembled directly with `InlineKeyboard`.
- Some flow prompt keyboards are rendered manually as raw
  `inline_keyboard` payloads.
- Button layout decisions are spread across factories instead of being governed
  by shared UX rules.
- Operational icons are not yet standardized for the module.
- Existing developer guidance names `@tempot/ux-helpers`, but does not yet make
  the `bot-management` pattern explicit enough as the reusable reference.

## Approved Direction

### 1. Reference Module Role

`bot-management` becomes the canonical example for Telegram-facing operational
modules that need:

- inline-first navigation
- mobile-aware button layout
- consistent action icons
- callback and confirmation handling backed by reusable package primitives

The first implementation cycle is limited to `bot-management`. Later module
adoption for `user-management` and `template-management` should be handled as
separate, scoped work.

### 2. Package Reuse Standard

The implementation should prefer:

- `@tempot/ux-helpers` for inline menus, confirmation surfaces, callback-safe
  UX helpers, and layout-conscious button construction
- `@tempot/input-engine` for structured registration and future multi-step edit
  flows

Direct `InlineKeyboard` construction inside `bot-management` should be reduced
where `ux-helpers` covers the capability cleanly. Any direct construction that
remains must be justified by a concrete capability gap.

### 3. Operational Iconography

Use a restrained operational icon set, with the icon at the beginning of the
label:

| Meaning | Icon |
| --- | --- |
| Create | `➕` |
| Back | `↩️` |
| Refresh | `🔄` |
| Settings | `⚙️` |
| Modules | `📦` |
| Lifecycle | `🔁` |
| Activate | `▶️` |
| Pause | `⏸️` |
| Archive | `🗄️` |

Icons should support scanning, not decorate arbitrarily. Labels remain concise
and localized in locale files.

### 4. Mobile-Aware Layout

The UX target is Telegram on phones first:

- Long labels receive their own row.
- Two-button rows are used only when both labels remain compact.
- Primary navigation actions should not be mixed with destructive actions in a
  visually ambiguous way.
- Pagination and return actions should remain easy to find.
- Confirmation actions should stay compact and unambiguous.

The implementation should rely on `ux-helpers` row and label policies wherever
possible instead of encoding one-off row logic in each factory.

### 5. Bot Management Surfaces in Scope

The implementation plan should cover:

1. Bot list menu
2. Bot detail menu
3. Lifecycle action menu
4. Archive confirmation menu
5. Registration-adjacent presentation helpers where the module currently owns
   prompt keyboard rendering
6. Localized button labels needed for the approved icon set

### 6. Documentation Changes

Developer documentation must make the expectation explicit:

- `module-capability-reuse-standard.md`
  - Clarify that Telegram-facing modules default to `@tempot/ux-helpers`
  - State that raw `InlineKeyboard` construction is an exception path
  - Reference `bot-management` as the initial implementation example
- `module-development-catalog.md`
  - Present `@tempot/ux-helpers` as an expected package for
    Telegram-facing module UX
  - Add practical guidance tying module creation to the UX helper standard

## Non-Goals

- Refactoring every existing Telegram-facing module in the same cycle
- Redesigning all user-facing copy across the product
- Replacing `@tempot/input-engine`
- Introducing a new visual framework outside current package boundaries

## Testing Expectations

The implementation cycle should include:

- unit coverage for revised menu factories
- regression coverage for button ordering and callback targets
- tests that verify localized icon-prefixed labels where behavior depends on
  label identity
- package or module checks proving no invalid label/layout behavior was
  introduced

## Acceptance Criteria

The work is complete when:

- `bot-management` menus consistently follow the approved UX pattern
- `@tempot/ux-helpers` becomes the visible implementation default for the
  revised surfaces
- mobile-facing menus are less crowded and operationally clearer
- developer docs explicitly direct future modules toward the same package-first
  pattern
- validation gates pass for the touched modules and docs

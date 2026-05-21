# Implementation Plan: Module Navigation Foundation

**Branch**: `codex/module-navigation-foundation` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/044-module-navigation-foundation/spec.md`

## Summary

Create a module-owned navigation foundation for the `/start` menu so every visible action is backed by an enabled owner, role-aware visibility, localized labels, startup validation, and pass-through-safe callback routing. This foundation is the prerequisite for professional follow-up modules for settings, notifications, messages/content, statistics/audit, and help.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode  
**Primary Dependencies**: grammY, module-registry, auth-core, i18n-core, ux-helpers, settings, event-bus, shared Result/AppError primitives  
**Storage**: No new persistence for this slice; module availability and contribution metadata come from module declarations and runtime validation  
**Testing**: Vitest unit tests, bot-server/module integration tests, callback regression tests  
**Target Platform**: Node.js 22.12+ bot-server runtime in Docker/local development  
**Project Type**: TypeScript monorepo with `apps/`, `packages/`, and `modules/` architecture  
**Performance Goals**: Render the main menu and route callbacks without noticeable user delay; startup validation must remain small relative to module discovery  
**Constraints**: No hardcoded user-facing text in `.ts`; no `any`; no direct module-to-module imports; all fallible public APIs return `Result`; no direct Prisma access; one capability owner per callback action  
**Scale/Scope**: Current single-bot template with active modules, designed to support additional modules without changing `user-management` for every new menu action

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Rule I, TypeScript strict mode**: Pass. All new contracts and tests must use explicit types and avoid `any`.
- **Rule II, code limits**: Pass with constraint. Implementation tasks must keep files under 200 lines and functions under 50 lines.
- **Rule III, naming**: Pass. New files must use descriptive kebab-case folders and `{feature}.{type}.ts` naming.
- **Rule VII, fix at source**: Pass. Root cause is menu ownership drift; fix belongs in navigation ownership, not fallback wrappers.
- **Rule IX, single responsibility**: Pass. This spec owns navigation foundation only; downstream modules get separate specs.
- **Rule XIII, clean architecture**: Pass. `apps/bot-server` hosts runtime wiring, `packages/module-registry` owns reusable metadata contracts, `modules/*` own capability contributions.
- **Rule XV, event-driven communication**: Pass. No direct imports between feature modules are allowed.
- **Rule XVI, pluggable architecture**: Pass. Contributions must disappear when a module is disabled or invalid.
- **Rule XXI, Result pattern**: Pass. New fallible registry/validation functions must return `Result<T, AppError>`.
- **Rules XXXIX-XLI, i18n**: Pass. Labels and user-facing responses must be i18n keys with Arabic and English entries.
- **Rule XLIV, ADR requirement**: Required. A navigation ownership ADR is needed before implementation because this introduces a reusable module contribution contract.
- **Rule L, documentation sync**: Required. Module catalog, roadmap, and relevant module docs must be updated during implementation.

## Project Structure

### Documentation (this feature)

```text
specs/044-module-navigation-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- navigation-contribution.contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
packages/module-registry/
|-- src/
|   |-- navigation-contribution.contract.ts
|   |-- navigation-registry.service.ts
|   `-- navigation-validation.service.ts
`-- tests/unit/

apps/bot-server/
|-- src/
|   |-- bot/navigation/
|   |-- bot/middleware/
|   `-- startup/
`-- tests/unit/

modules/user-management/
|-- menus/
|-- handlers/
|-- module.manifest.ts
`-- tests/unit/

modules/template-management/
|-- module.manifest.ts
`-- tests/unit/

modules/bot-management/
|-- module.manifest.ts
`-- tests/unit/

docs/architecture/adr/
docs/developer/
```

**Structure Decision**: Reusable navigation contracts and validation belong in `packages/module-registry`; bot-server composes those contributions into Telegram runtime surfaces; feature modules declare owned entries in their manifests or setup metadata and handle only their own callback namespaces.

## Capability Reuse Decision Table

| Capability Need | Default Package | Decision | Rationale | Follow-up |
| --- | --- | --- | --- | --- |
| Module contribution metadata | `@tempot/module-registry` | Extend Package | Navigation ownership is reusable metadata for all modules. | Add package-level contract and validation tests. |
| Main menu rendering | `@tempot/ux-helpers` | Compose | Helpers should own Telegram UX primitives while modules own labels and actions. | Use existing helpers when they cover layout; document any gap. |
| Role and permission checks | `@tempot/auth-core` | Compose | Visibility must reuse existing authorization concepts. | Keep module-local rule declarations thin. |
| Localized labels and messages | `@tempot/i18n-core` | Reuse | No user-facing strings may be hardcoded. | Add locale keys for new fallback/menu messages. |
| Module enablement and validation | `@tempot/module-registry` | Extend Package | Existing discovery and validation should own availability checks. | Add contribution validation to module startup gate. |
| Settings entry module | `@tempot/settings` | Compose | Dedicated follow-up module should manage settings over the package. | Create separate settings-management spec. |
| Notification entry module | `@tempot/notifier`, `@tempot/settings` | Compose | Dedicated follow-up module should show notifications and preferences. | Create separate notification-center spec. |
| Messages/content entry module | `@tempot/cms-engine` | Compose | Dedicated follow-up module should own editable content/message workflows. | Create separate content-management spec. |
| Stats/audit entry module | `@tempot/logger`, `@tempot/search-engine` | Compose | Dedicated follow-up module should own read-only operational views. | Create separate audit-viewer/statistics spec. |
| Dynamic help | `@tempot/module-registry`, `@tempot/i18n-core` | Compose | Help can be generated from active module metadata and localized descriptions. | Create separate help-center or include as second slice only after foundation. |

## Phase 0: Research Output

See [research.md](./research.md).

## Phase 1: Design Output

- [data-model.md](./data-model.md)
- [contracts/navigation-contribution.contract.md](./contracts/navigation-contribution.contract.md)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

- No unresolved clarification remains.
- The design keeps module boundaries intact and rejects direct feature-module imports.
- The design requires a dedicated ADR before implementation.
- The implementation must be TDD-first and must not start until `tasks.md`, `speckit-analyze`, and `pnpm spec:validate` pass.

## Complexity Tracking

No constitution violation is intentionally introduced. The only added complexity is a reusable navigation contribution contract, justified because multiple current and planned modules need the same menu ownership behavior.

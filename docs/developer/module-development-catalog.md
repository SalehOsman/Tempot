# Module Development Catalog

**Status**: Authoritative developer catalog for Specs #036 and #037
**Audience**: Developers and agents creating, reviewing, or extending Tempot modules.

## Purpose

This catalog defines the standard way to build Tempot business modules. It turns
module creation into a governed workflow based on SpecKit artifacts, reusable
package capabilities, generator blueprints, validation gates, and optional
AI-assisted guidance.

For mandatory package reuse rules, decision classifications, and the approved
exception path for local custom behavior, read
`docs/developer/module-capability-reuse-standard.md`.

Tempot modules are product or domain capabilities under `modules/`. They may use
packages, but they must not become shared infrastructure. Shared infrastructure
belongs in `packages/`; runtime surfaces belong in `apps/`.

## Core Decisions

- Tempot must have a professional module methodology before adding more core
  modules.
- `test-module` is a development fixture candidate, not a production module.
- `user-management` is suitable as a core platform module unless the Product
  Manager later decides to convert it into an example/reference module.
- Future core modules should be built only after SpecKit artifacts pass the
  handoff gate.
- AI assistance is allowed for module design guidance and review, but it must be
  grounded in project documentation and must not bypass SpecKit, TDD, review, or
  verification gates.

## Baseline Module Roadmap

| Module | Type | Purpose | Primary packages |
| --- | --- | --- | --- |
| `user-management` | Core platform | Users, roles, profiles, and access-aware user flows. | `auth-core`, `database`, `i18n-core`, `ux-helpers` |
| `template-management` | Product | Bot templates, categories, tags, publishing, and archiving. | `search-engine`, `import-engine`, `document-engine`, `cms-engine`, `notifier` |
| `bot-management` | Operational platform | Bot settings, webhook metadata, runtime status, and future multi-bot readiness. | `settings`, `event-bus`, `logger`, `module-registry`, `ux-helpers`, `input-engine` |
| `content-management` | Product platform | Bot messages, content blocks, and editable text workflows above `cms-engine`. | `cms-engine`, `i18n-core`, `auth-core`, `logger` |
| `notification-center` | Operational | Notification channels, preferences, delivery views, and notification events. | `notifier`, `settings`, `event-bus`, `logger` |
| `audit-viewer` | Operational | Read-only audit and activity exploration for admins and dashboard users. | `logger`, `search-engine`, `auth-core` |
| `settings-management` | Core platform | Module, system, and user-facing settings workflows above `@tempot/settings`. | `settings`, `auth-core`, `cms-engine`, `logger` |

## Module Types

| Type | Description | Examples |
| --- | --- | --- |
| Core platform | Required framework capability that other product work relies on. | `user-management`, `settings-management` |
| Operational | Admin or support capability for visibility, notifications, and operations. | `audit-viewer`, `notification-center` |
| Product | End-user or product-domain capability. | `template-management`, future domain modules |
| Integration | Domain feature that coordinates an external integration through package ports. | Future provider-specific modules |
| Example/reference | Documentation or fixture module that is not production runtime behavior. | Replacement for `test-module` if needed |

## Standard Module Structure

```text
modules/{module-name}/
  package.json
  tsconfig.json
  vitest.config.ts
  .gitignore
  README.md
  index.ts
  module.config.ts
  module.manifest.ts
  abilities.ts
  commands/
  handlers/
  menus/
  services/
  repositories/
  events/
  contracts/
  types/
  features/
  shared/
  locales/ar.json
  locales/en.json
  tests/
```

Create optional folders only when the module needs them. A minimal module still
needs package metadata, module config, public exports, locales, tests, and a
README.

## Module Manifest

Each generated module now includes a starter `module.manifest.ts` contract from
the `basic` blueprint. The manifest is the declarative source for module
metadata and generator output.

Expected manifest concerns:

- module name, display key, type, and status
- capabilities selected from this catalog
- commands and callback entry points
- published and consumed events
- permissions and abilities
- owned settings and CMS namespaces
- import/export/search requirements
- repository ownership and migration needs
- dashboard/admin surfaces, when approved

The manifest should eventually generate or validate `abilities.ts`, event
contracts, README sections, i18n namespaces, and module doctor checks.

## Methodology

Every new module follows this sequence:

1. Product Manager records the module decision.
2. Create `specs/{NNN}-{module-name}/spec.md`.
3. Clarify unresolved requirements until `spec.md` has no clarification markers.
4. Create `plan.md`, `research.md`, and `data-model.md`.
5. Create `tasks.md` with dependency-ordered work.
6. Run SpecKit analysis and resolve critical issues.
7. Run `pnpm spec:validate`.
8. Create an isolated branch or worktree from `origin/main`.
9. Execute with TDD: RED, GREEN, REFACTOR.
10. Add unit tests and integration tests when persistence, Redis, queues, or
    event-bus behavior changes.
11. Run `pnpm boundary:audit` and `pnpm module:checklist`.
12. Sync documentation: SpecKit artifacts, Roadmap, README, ADRs when needed,
    and changesets when release behavior changes.
13. Run the relevant merge gates.
14. Open PR, wait for CI, then merge only after gates pass.

Tempot does not use `/speckit.implement` for production execution.

## Capability Catalog

| Need | Use | Rule |
| --- | --- | --- |
| Structured Telegram input flows | `@tempot/input-engine` | Use the package for multi-step create/edit flows before writing local state machines. |
| Authorization | `@tempot/auth-core` | Define permissions in `abilities.ts`; do not duplicate RBAC logic. |
| Cross-module communication | `@tempot/event-bus` | Publish and consume events; never import another module directly. |
| Persistence | `@tempot/database` | Use repositories; services do not call Prisma directly. |
| User-facing text | `@tempot/i18n-core` and locale files | No hardcoded user-facing text in TypeScript. |
| Dynamic editable text | `@tempot/cms-engine` | Use protected keys and placeholder validation for editable content. |
| Settings | `@tempot/settings` | Store configurable behavior through settings contracts, not ad hoc files. |
| Notifications | `@tempot/notifier` | Emit notification requests or events instead of calling Telegram directly. |
| Search and filters | `@tempot/search-engine` | Use typed search plans and state snapshots. |
| Imports | `@tempot/import-engine` | Use parsing, validation, batching, and report contracts. |
| Exports | `@tempot/document-engine` | Use export request contracts and storage upload flows. |
| AI and RAG | `@tempot/ai-core` | Require audit, access policy, grounded answers, and no hallucinated authority. |
| Files | `@tempot/storage-engine` | Use storage providers and attachment contracts. |
| Telegram UX | `@tempot/ux-helpers` | Use common menus, pagination, callback, confirmation, and mobile-aware button helpers. Treat raw Telegram keyboard assembly as an exception path. |
| Module metadata | `@tempot/module-registry` | Register config and toggle behavior through public contracts. |

All selections in this catalog must follow the mandatory classification model
from `module-capability-reuse-standard.md`: `Reuse`, `Compose`,
`Extend Package`, or `Custom Approved`.

## Blueprints

Blueprints are generator presets. A module may combine more than one.

| Blueprint | Adds |
| --- | --- |
| `basic` | Package metadata, module config, exports, locales, README, and tests. |
| `crud` | Repository, service, abilities, CRUD tests, and data-model notes. |
| `workflow` | State types, command handlers, events, and transition tests. |
| `searchable` | Search contracts, query state, pagination, and search tests. |
| `importable` | Import schema adapter, batch handling, invalid-row report flow. |
| `exportable` | Document export request, queue event, storage upload contract. |
| `notifiable` | Notification events, preferences, and delivery status hooks. |
| `cms-enabled` | CMS namespaces, protected keys, placeholder policy tests. |
| `ai-assisted` | RAG-safe assistant ports, audit metadata, grounded answer tests. |
| `admin-managed` | Admin abilities, audit requirements, dashboard-readiness contracts. |

## Capability Packs

Capability packs are smaller than blueprints. They can be added to an existing
module after the initial module has merged.

| Pack | Required additions |
| --- | --- |
| Auth pack | `abilities.ts`, permission tests, denied-flow tests. |
| Event pack | Event name constants, payload types, publisher tests. |
| Repository pack | Repository class, migration, service tests, integration tests when needed. |
| Search pack | Search plan adapter, state key, pagination metadata. |
| Import pack | Schema validation, parser wiring, batch event tests. |
| Export pack | Document request contract, completion/failure event tests. |
| Notification pack | Notification request events and preference checks. |
| CMS pack | CMS key registry, placeholder tests, protected key policy. |
| AI pack | Grounded retrieval source list, citations, no-context behavior, audit tests. |

## Telegram UX Package Guidance

Any Telegram-facing module should treat `@tempot/ux-helpers` as part of its
default developer toolkit when it owns menus, buttons, confirmations, callback
surfaces, or status messaging.

Recommended baseline:

- `@tempot/input-engine` for structured multi-step forms
- `@tempot/ux-helpers` for inline menu construction, confirmations, callback UX,
  and compact mobile-aware layouts
- `@tempot/i18n-core` for all visible labels

`bot-management` is the first operational reference module for this standard.
New modules should follow the same package-first interaction model instead of
rebuilding button layout and callback presentation locally.

## RAG Assistant

The Module Builder RAG Assistant is a planned developer helper that uses
`@tempot/ai-core` to answer module-building questions from project-approved
sources.

Authoritative sources:

- this catalog
- `docs/developer/workflow-guide.md`
- `docs/developer/new-module-checklist.md`
- `docs/developer/module-boundary-guide.md`
- `.specify/memory/constitution.md`
- `.specify/memory/roles.md`
- active SpecKit artifacts for the module being built
- README files for approved packages

Allowed outputs:

- recommend module type and blueprint
- explain which package capability to use
- suggest events, permissions, i18n keys, and test coverage
- review SpecKit artifacts for methodology gaps
- produce executor-ready prompts that preserve SpecKit and Superpowers gates

Prohibited outputs:

- bypassing Product Manager decisions
- generating production code without approved SpecKit artifacts
- using ungrounded claims as project authority
- hiding no-context situations
- calling AI during runtime module lookup paths without an explicit port,
  access policy, and audit trail

Evaluation requirements:

- retrieval hit coverage for module methodology questions
- citation coverage for methodology answers
- no hallucinated package usage
- no-context behavior when the catalog has no answer
- leakage prevention for role and permission boundaries

## Module Doctor

`pnpm tempot module doctor <module-name>` is available as the first readiness
slice. It reports module readiness instead of only failing late in CI.

Implemented checks:

- module directory exists
- required files: `package.json`, `module.config.ts`, `module.manifest.ts`,
  `locales/ar.json`, and `locales/en.json`
- package metadata: `main`, `types`, root export, `build`, and `test`
- locale key parity between Arabic and English files
- no direct imports from another `modules/*` module

Recommended future checks:

- `module.config.ts` validity
- `module.manifest.ts` schema validity
- locale placeholder parity
- no hardcoded user-facing text in TypeScript
- no app imports from module code
- no direct Prisma access in services or handlers
- Result pattern on fallible public APIs
- event contract documentation
- tests mapped to SpecKit functional requirements
- README completeness

## Readiness Score

Future tooling may produce a readiness score to guide reviews:

| Area | Meaning |
| --- | --- |
| Architecture | Boundaries, module config, dependency rules, and event use. |
| Tests | Unit, integration, contract, and acceptance coverage. |
| i18n/CMS | Locale completeness, CMS key ownership, and placeholder parity. |
| Security | Abilities, audit requirements, and denied flows. |
| Docs | README, SpecKit traceability, and roadmap sync. |
| Operations | Toggles, events, queues, notifications, and failure behavior. |

Scores are advisory. Failing gates remain authoritative.

## Experimental Module Policy

Experimental modules must not be treated as production modules. They should be:

- deleted when no longer useful, or
- moved into fixtures/examples outside production runtime, or
- converted into a documented reference module with explicit non-production
  status.

Any removal requires updating Roadmap, specs, tests, and checklist tooling that
refer to the module.

## Acceptance Gates

Before a module PR is merged:

- SpecKit artifacts exist and pass validation.
- `pnpm --filter @tempot/{module-name} test` passes.
- `pnpm --filter @tempot/{module-name} build` passes.
- `pnpm lint` passes.
- `pnpm spec:validate` passes.
- `pnpm cms:check` passes when locales or CMS keys changed.
- `pnpm boundary:audit` passes.
- `pnpm module:checklist` passes.
- `pnpm test:unit` passes for broad changes.
- `pnpm test:integration` passes when persistence, Redis, queues, or event-bus
  behavior changed.
- `git diff --check` passes.

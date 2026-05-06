# Tempot Onboarding Guide

Tempot is an enterprise Telegram bot framework built as a strict TypeScript monorepo. This guide is generated from the project knowledge graph and reviewed against the current Tempot methodology.

## Project At A Glance

| Area | Value |
|---|---|
| Runtime | Node.js 22.12+ |
| Language | TypeScript strict mode |
| Main interfaces | Telegram bot server, documentation app |
| Architecture style | apps -> packages -> modules with event-driven module communication |
| Graph snapshot | 1127 nodes, 1911 relationships |
| Graph commit | e2e727df0b40c4130b441dd8d80b2fc96742402c |

## Read These First

1. `.specify/memory/constitution.md` - highest engineering authority.
2. `.specify/memory/roles.md` - Project Manager, Technical Advisor, and Executor responsibilities.
3. `docs/archive/ROADMAP.md` - current delivery state and next phases.
4. `docs/archive/developer/workflow-guide.md` - SpecKit plus Superpowers workflow.
5. `docs/archive/developer/module-development-catalog.md` - module creation methodology.

## Architecture Layers

### Applications

- `apps/bot-server`: Telegram bot runtime, Hono server, startup composition, middleware, and webhook routes.
- `apps/docs`: Starlight documentation site and generated API reference surface.

### Packages

- `packages/database`: database package in the Tempot workspace.
- `packages/event-bus`: event-bus package in the Tempot workspace.
- `packages/shared`: shared package in the Tempot workspace.
- `packages/logger`: logger package in the Tempot workspace.
- `packages/ai-core`: ai-core package in the Tempot workspace.
- `packages/cms-engine`: cms-engine package in the Tempot workspace.
- `packages/search-engine`: search-engine package in the Tempot workspace.
- `packages/document-engine`: document-engine package in the Tempot workspace.
- `packages/import-engine`: import-engine package in the Tempot workspace.
- `packages/settings`: settings package in the Tempot workspace.
- `packages/module-registry`: module-registry package in the Tempot workspace.

### Modules

- `modules/user-management`: user-management module in the Tempot workspace.
- `modules/test-module`: test-module module in the Tempot workspace.

## Relationship Map

| Workspace | Kind | Detected package and concept dependencies |
| --- | --- | --- |
| bot-server | apps | Strict TypeScript, auth-core, database, event-bus, i18n-core, logger, module-registry, sentry, session-manager, settings, shared |
| docs | apps | Strict TypeScript, ai-core, shared |
| ai-core | packages | Strict TypeScript, database, shared |
| auth-core | packages | Strict TypeScript, shared |
| cms-engine | packages | Strict TypeScript, shared |
| database | packages | Strict TypeScript, shared |
| document-engine | packages | Strict TypeScript, shared |
| event-bus | packages | Strict TypeScript, shared |
| i18n-core | packages | Strict TypeScript, shared |
| import-engine | packages | Strict TypeScript, shared |
| input-engine | packages | Strict TypeScript, shared |
| logger | packages | Strict TypeScript, database, shared |
| module-registry | packages | Strict TypeScript, shared |
| national-id-parser | packages | Strict TypeScript |
| notifier | packages | Strict TypeScript, shared |
| regional-engine | packages | Strict TypeScript, shared |
| search-engine | packages | Strict TypeScript, shared |
| sentry | packages | Strict TypeScript, shared |
| session-manager | packages | Strict TypeScript, database, shared |
| settings | packages | Strict TypeScript, shared |
| shared | packages | Strict TypeScript |
| storage-engine | packages | Strict TypeScript, database, shared |
| ux-helpers | packages | Strict TypeScript, i18n-core, logger, shared |
| test-module | modules | Event-driven modules, Strict TypeScript, module-registry |
| user-management | modules | Event-driven modules, Strict TypeScript, auth-core, database, module-registry, national-id-parser, shared |

## Module Development Rules

- Build every module from a SpecKit feature and Superpowers execution plan.
- Use `pnpm tempot module create <name> --type <type> --blueprint basic` for starter structure.
- Use `pnpm tempot module doctor <name>` before review.
- Keep modules isolated. Module-to-module behavior must flow through the Event Bus.
- Keep user-facing text in locale files, not hardcoded in TypeScript.
- Services and handlers must not access Prisma directly.

## Quality Gates

Before merging meaningful changes, run the gates relevant to the change:

```powershell
pnpm spec:validate
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm boundary:audit
pnpm module:checklist
pnpm cms:check
```

## Guided Tour

### 1. Start With Governance

Read the constitution, role framework, roadmap, and methodology before making implementation decisions.

Key graph nodes: `document:.specify/memory/constitution.md`, `document:.specify/memory/roles.md`, `document:docs/archive/ROADMAP.md`, `concept:speckit-superpowers`.

### 2. Understand Runtime Entry Points

Inspect the bot server and docs app as the two current application surfaces.

Key graph nodes: `app:bot-server`, `app:docs`.

### 3. Understand Reusable Engines

Packages provide database, eventing, AI, CMS, import, document, search, settings, and UX foundations.

Key graph nodes: `package:database`, `package:event-bus`, `package:ai-core`, `package:cms-engine`, `package:search-engine`, `package:document-engine`, `package:import-engine`.

### 4. Understand Business Modules

Modules are isolated business capabilities. user-management is the current production reference module.

Key graph nodes: `module:user-management`, `module:test-module`, `concept:event-driven-modules`.

### 5. Follow The Module Tooling Path

Use the module catalog, generator plan, checklist, and CLI doctor before building new modules.

Key graph nodes: `document:docs/archive/developer/module-development-catalog.md`, `concept:module-tooling`, `article:specs/037-module-tooling-foundation`.

## Practical First Tasks

1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm spec:validate` to confirm documentation-to-code reconciliation.
3. Run `pnpm tempot module doctor user-management` to inspect the reference module.
4. Open the knowledge graph dashboard and inspect package/module relationships.
5. Read the latest SpecKit artifacts under `specs/037-module-tooling-foundation`.

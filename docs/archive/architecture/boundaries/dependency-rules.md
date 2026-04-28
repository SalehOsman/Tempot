# Tempot Dependency Rules

**Status**: Draft execution artifact for spec #026
**Purpose**: Define allowed and prohibited dependency directions for apps, packages, modules, documentation, and tooling.

## Layer Direction

Allowed runtime direction:

```text
apps -> packages
apps -> module-registry -> modules
modules -> packages
packages -> packages
```

Forbidden runtime direction:

```text
packages -> apps
packages -> modules
modules -> apps
modules -> modules
docs/specs -> runtime imports
```

## Import Rules

| Rule | Status | Detail |
| --- | --- | --- |
| Public package imports only | Required | Use `@tempot/{package}` or documented subpath exports only |
| Deep package imports | Prohibited | Do not import `@tempot/{package}/src/*` or internal files |
| Module-to-module imports | Prohibited | Modules communicate through event bus and shared contracts only |
| App-owned business logic | Prohibited | Business rules belong in `modules/` or service packages |
| Package-owned Telegram command flow | Prohibited | Telegram interaction flow belongs in apps or modules |
| Package-to-app imports | Prohibited | Packages are reusable services and must not know app entrypoints |
| Test internal imports | Restricted | Tests may use local relative imports inside the same component only |
| Generated docs imports | Restricted | Docs scripts may import package public APIs for ingestion only |

## Package Dependency Classes

| Class | Examples | May depend on |
| --- | --- | --- |
| Foundation | `shared`, `database`, `logger`, `event-bus`, `auth-core` | Foundation contracts, external libraries |
| Runtime service | `session-manager`, `settings`, `i18n-core`, `storage-engine`, `input-engine`, `ux-helpers`, `ai-core`, `regional-engine` | Foundation and needed service packages |
| Registry | `module-registry` | Shared contracts only unless explicitly justified |
| Infrastructure | `sentry` | Shared error/reporting contracts |
| Domain utility | `national-id-parser` | Prefer no Tempot runtime dependencies |
| Deferred service | `cms-engine`, `notifier`, `search-engine`, `document-engine`, `import-engine` | Defined when activated by a business module |

## Module Rules

- A module owns its commands, menus, handlers, services, repositories, locales, tests, and module config.
- A module may depend on service packages through public exports.
- A module must not import another module.
- Cross-module collaboration must use domain events and typed event payloads.
- A module may define local relative imports inside its own directory.
- A module repository may extend `BaseRepository`; services must not directly call Prisma.
- User-facing text must live in module locale files.

## Application Rules

- `apps/bot-server` composes infrastructure and loads modules; it does not own module domain behavior.
- `apps/docs` may import package APIs for documentation ingestion scripts but not runtime bot behavior.
- Future dashboard and mini-app surfaces must be apps, not modules.
- Apps may depend on multiple packages because they are composition roots.

## Documentation and Tooling Rules

- `specs/` define scope and acceptance criteria before implementation.
- `docs/archive/architecture/adr/` records accepted architecture decisions before implementation.
- `.agents/skills/` instruct agents and should reference docs rather than duplicate long-form architecture.
- CI changes must be documented in a CI enforcement plan before becoming blocking where they can disrupt merges.

## Enforcement Plan

1. Keep ESLint boundaries as the first enforcement layer.
2. Add a tracked-file import audit that excludes `node_modules`, `dist`, and generated docs.
3. Add package checklist validation for new packages and modules.
4. Treat deep package imports and module-to-module imports as hard failures.
5. Start with report-only mode for newly discovered ambiguous package-to-package edges, then promote stable rules to CI.

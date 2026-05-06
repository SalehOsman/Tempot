# Spec #037: Module Tooling Foundation

## Status

Specification for the first implementation slice of the module development
platform.

## Problem Statement

Spec #036 documented the professional module methodology, but the developer
tooling still exposes only a minimal module generator and a quick environment
doctor. Developers need the first governed tooling slice that turns the catalog
into executable checks and safer module scaffolding without jumping directly to
RAG, dashboard, or production module implementation.

## Goals

- Add module-specific doctor behavior for existing Tempot modules.
- Extend module creation with explicit module type and basic blueprint metadata.
- Generate a starter `module.manifest.ts` for new modules.
- Preserve existing `pnpm tempot module create <module-name>` behavior.
- Keep the first implementation slice small enough for TDD and local gates.
- Update developer documentation so the implemented tooling matches the module
  catalog.

## Non-Goals

- No Module Builder RAG Assistant is implemented in this spec.
- No new business module is created in this spec.
- No `test-module` removal is performed in this spec.
- No dashboard, SaaS, billing, tenant, or multi-bot behavior is introduced.
- No generator support for CRUD, import, export, search, notification, CMS, or
  AI capability packs is implemented beyond documenting unsupported values.

## Functional Requirements

- FR-001: `pnpm tempot module doctor <module-name>` MUST parse as a supported
  command.
- FR-002: Module doctor MUST report a developer-facing module readiness summary
  without exposing secret values.
- FR-003: Module doctor MUST fail for a missing module directory.
- FR-004: Module doctor MUST check required module metadata files:
  `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`,
  `index.ts`, `module.config.ts`, `locales/ar.json`, `locales/en.json`, and
  `tests/`.
- FR-005: Module doctor MUST check `package.json` has `main`, `types`, root
  `exports`, `build`, and `test`.
- FR-006: Module doctor MUST check locale parity between `locales/ar.json` and
  `locales/en.json`.
- FR-007: Module doctor MUST check module source files do not import from
  another `modules/*` package path.
- FR-008: `pnpm tempot module create <module-name>` MUST keep its current
  default behavior.
- FR-009: `pnpm tempot module create <module-name> --type <type>` MUST accept
  catalog module types: `core-platform`, `operational`, `product`,
  `integration`, and `example`.
- FR-010: `pnpm tempot module create <module-name> --blueprint basic` MUST
  accept the initial implemented blueprint.
- FR-011: Unsupported blueprint values MUST fail with a clear error that the
  value is not implemented yet.
- FR-012: Generated modules MUST include `module.manifest.ts` with module name,
  type, blueprint, status, and empty capability lists.
- FR-013: Generated module tests MUST cover the starter manifest.
- FR-014: Documentation MUST identify this tooling slice as the first
  implementation step after the module catalog.

## Acceptance Criteria

- SC-001: Unit tests prove `module doctor` parses, reports pass/fail status,
  detects missing modules, and avoids secret output.
- SC-002: Unit tests prove `module create` accepts default arguments and the new
  `--type` and `--blueprint basic` flags.
- SC-003: Unit tests prove unsupported blueprint values are rejected.
- SC-004: Unit tests prove the generated file list includes `module.manifest.ts`
  and a manifest test.
- SC-005: `pnpm --filter tempot-monorepo test:unit` or the narrow equivalent
  for `scripts/tempot` passes during implementation.
- SC-006: `pnpm spec:validate` passes after documentation sync.

## Edge Cases

- A module directory exists but has no `package.json`.
- Locale files exist but use different top-level keys.
- A module has no TypeScript source folder beyond root files.
- A generated module omits `--type`; it defaults to `product`.
- A generated module omits `--blueprint`; it defaults to `basic`.
- A developer requests future blueprints such as `searchable` or `ai-assisted`
  before implementation; the command must fail clearly instead of silently
  generating incomplete artifacts.

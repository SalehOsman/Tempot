# Implementation Plan: Module Tooling Foundation

## Scope

Implement the first tooling slice from the module development platform. The work
is limited to `scripts/tempot`, docs, and SpecKit artifacts.

## Current State

The Tempot CLI currently supports:

- `pnpm tempot init`
- `pnpm tempot doctor --quick`
- `pnpm tempot module create <module-name>`

The module generator creates a minimal inactive module skeleton. It does not
accept module type or blueprint metadata and does not generate
`module.manifest.ts`.

## Proposed Design

### CLI Parsing

Extend the existing `parseTempotArgs` function to support:

- `module doctor <module-name>`
- `module create <module-name> --type <type>`
- `module create <module-name> --blueprint basic`
- both flags in either supported order when simple to implement without
  over-engineering

Unsupported flags should keep the current help/error behavior unless explicitly
covered by the spec.

### Module Doctor

Add focused module doctor modules under `scripts/tempot/`:

- `module-doctor.types.ts`
- `module-doctor.checks.ts`
- `module-doctor.presenter.ts`

The doctor should inspect files through `fs` and produce structured checks. It
should not run shell commands, build modules, or mutate files.

### Module Generator

Extend existing generator types and templates:

- parse module type and blueprint
- default type: `product`
- default blueprint: `basic`
- generate `module.manifest.ts`
- generate `tests/module.manifest.test.ts`

Only `basic` is implemented. Other catalog blueprints remain rejected.

### Documentation Sync

Update:

- `docs/archive/developer/module-development-catalog.md`
- `docs/archive/developer/module-generator-plan.md`
- `docs/archive/developer/new-module-checklist.md`
- `docs/archive/ROADMAP.md`

## Constitution Checks

- TypeScript strict mode remains required.
- No `any`, suppressions, or `console.*`.
- Developer-facing strings are CLI output, not runtime user-facing bot text.
- No production module or package behavior is changed.
- No module imports another module.
- No `/speckit.implement` is used.

## TDD Strategy

Write failing unit tests before implementation:

- parser tests for new commands and flags
- module doctor checks for pass/fail/missing module behavior
- module doctor rendering tests
- generator tests for manifest and metadata
- unsupported blueprint rejection test

Run the narrow test file after each RED/GREEN loop, then broader checks.

## Verification

Minimum implementation gates:

- targeted Vitest test for `scripts/tempot`
- `pnpm test:unit`
- `pnpm spec:validate`
- `pnpm boundary:audit`
- `pnpm module:checklist`
- `pnpm cms:check`
- `git diff --check`

Run `pnpm build` if implementation touches TypeScript compiled by the root build
graph or if local validation indicates typecheck risk.

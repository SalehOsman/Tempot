# New Module Checklist

**Status**: Module creation checklist aligned with Spec #036
**Audience**: Developers and agents creating Tempot business modules.

Use this checklist with
`docs/archive/developer/module-development-catalog.md`. The catalog explains
module types, package capabilities, blueprints, capability packs, Module Doctor,
and the future Module Builder RAG Assistant.

## Before Creation

- [ ] Feature spec exists under `specs/{NNN}-{feature}/`.
- [ ] `spec.md` has no unresolved clarification markers.
- [ ] `plan.md`, `research.md`, `data-model.md`, and `tasks.md` exist.
- [ ] Boundary decision confirms the work belongs in `modules/`.
- [ ] No existing module already owns the same domain.
- [ ] Module type is selected from the catalog.
- [ ] Blueprint and capability packs are selected from the catalog.
- [ ] Package capability usage is documented in `plan.md`.

## Required Files

- [ ] `package.json` with `main`, `types`, `exports`, `build`, and `test`.
- [ ] `tsconfig.json`.
- [ ] `vitest.config.ts`.
- [ ] `.gitignore`.
- [ ] `index.ts`.
- [ ] `module.config.ts`.
- [ ] `module.manifest.ts` when manifest support is introduced.
- [ ] `abilities.ts` when authorization is needed.
- [ ] `locales/ar.json`.
- [ ] `locales/en.json`.
- [ ] `tests/`.

## Optional Folders

Create only when needed:

- `commands/`
- `handlers/`
- `menus/`
- `services/`
- `repositories/`
- `events/`
- `contracts/`
- `types/`
- `database/migrations/`

## Code Rules

- [ ] No `any`, `@ts-ignore`, or eslint disables.
- [ ] No hardcoded user-facing text.
- [ ] Public fallible APIs return `Result<T, AppError>` or `AsyncResult<T>`.
- [ ] Services do not call Prisma directly.
- [ ] Repositories extend `BaseRepository` when database access is needed.
- [ ] Module communicates outward through event bus.
- [ ] Module imports packages through public exports only.
- [ ] Module does not import another module.
- [ ] AI-assisted behavior is grounded, audited, access-controlled, and tested
      when the AI pack is selected.
- [ ] Search, import, export, notification, CMS, and settings behavior use the
      approved packages instead of local ad hoc implementations.

## Validation

- [ ] Module unit tests pass.
- [ ] Relevant integration tests pass when database or Redis behavior changes.
- [ ] `pnpm cms:check` passes when locales change.
- [ ] `pnpm boundary:audit` passes.
- [ ] `pnpm module:checklist` passes.
- [ ] Future `pnpm tempot module doctor {module-name}` passes when available.
- [ ] `pnpm lint` passes.
- [ ] `pnpm spec:validate` passes.
- [ ] `git diff --check` passes.

## Documentation

- [ ] Module behavior is represented in SpecKit artifacts.
- [ ] Selected blueprint and capability packs are recorded in module docs.
- [ ] Roadmap is updated if project status changes.
- [ ] ADR is added if the module introduces a new architectural decision.
- [ ] Module usage or quick path docs are updated when needed.

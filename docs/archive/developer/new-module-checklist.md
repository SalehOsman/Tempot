# New Module Checklist

**Status**: Draft execution artifact for spec #026
**Audience**: Developers and agents creating Tempot business modules.

## Before Creation

- [ ] Feature spec exists under `specs/{NNN}-{feature}/`.
- [ ] `spec.md` has no unresolved clarification markers.
- [ ] `plan.md`, `research.md`, `data-model.md`, and `tasks.md` exist.
- [ ] Boundary decision confirms the work belongs in `modules/`.
- [ ] No existing module already owns the same domain.

## Required Files

- [ ] `package.json` with `main`, `types`, `exports`, `build`, and `test`.
- [ ] `tsconfig.json`.
- [ ] `vitest.config.ts`.
- [ ] `.gitignore`.
- [ ] `index.ts`.
- [ ] `module.config.ts`.
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

## Validation

- [ ] Module unit tests pass.
- [ ] Relevant integration tests pass when database or Redis behavior changes.
- [ ] `pnpm cms:check` passes when locales change.
- [ ] `pnpm boundary:audit` passes.
- [ ] `pnpm module:checklist` passes.
- [ ] `pnpm lint` passes.
- [ ] `pnpm spec:validate` passes.
- [ ] `git diff --check` passes.

## Documentation

- [ ] Module behavior is represented in SpecKit artifacts.
- [ ] Roadmap is updated if project status changes.
- [ ] ADR is added if the module introduces a new architectural decision.
- [ ] Module usage or quick path docs are updated when needed.

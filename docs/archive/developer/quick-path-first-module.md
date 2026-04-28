# Quick Path: First Real Tempot Module

**Status**: Draft execution artifact for spec #026
**Goal**: Help a contributor build a minimal real module in about 15 minutes after tooling exists.

## Prerequisites

- `pnpm tempot init` has been run from the repository root.
- `pnpm tempot doctor --quick` passes.
- SpecKit feature exists for the module.
- Current branch or worktree is not `main`.

## Path

1. Create or select the feature spec.
2. Run the module generator.
3. Review generated files.
4. Add one command and one service method.
5. Add Arabic and English locale keys.
6. Add a unit test for the service.
7. Add a command/handler test when Telegram behavior changes.
8. Run module validation.
9. Run root methodology gates.

## Expected Commands

```powershell
pnpm tempot init
pnpm tempot doctor --quick
pnpm tempot module create example-module
pnpm --filter @tempot/example-module test
pnpm --filter @tempot/example-module build
pnpm cms:check
pnpm spec:validate
git diff --check
```

## Success Criteria

- The module builds.
- Tests pass.
- Locale checks pass.
- Spec validation passes.
- Module does not import another module.
- Module can be disabled without breaking startup.

## Notes

This guide now has the first CLI support in place through `pnpm tempot init`, `pnpm tempot doctor --quick`, and `pnpm tempot module create <module-name>`. Continue using `docs/archive/developer/new-module-checklist.md` for module-specific review until deeper module validation commands are implemented.

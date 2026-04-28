# CI Tempot CLI Smoke Checks Plan

**Date**: 2026-04-28
**Spec**: `specs/026-architecture-isolation-and-saas-readiness/`
**Scope**: Add a small CI methodology gate that proves the internal Tempot CLI remains runnable after install.

## Objective

Ensure GitHub Actions catches broken `pnpm tempot init` and `pnpm tempot doctor --quick` behavior before merge.

## Constraints

- Keep the change limited to CI methodology enforcement and tests.
- Do not change production application behavior.
- Keep the security audit blocking policy unchanged.
- Do not add new dependencies.

## TDD Steps

1. Add a unit test that reads `.github/workflows/ci.yml` and expects both Tempot CLI smoke commands.
2. Run the test and confirm it fails before the workflow change.
3. Add the CLI smoke commands to the methodology job after install and methodology checks.
4. Re-run the targeted CI workflow test.
5. Run local CLI smoke commands.
6. Run the surrounding gates before commit.

## Validation

- `pnpm vitest run --project=unit scripts/ci/tests/unit/ci-workflow.test.ts scripts/ci/tests/unit/vitest-config.test.ts --reporter=verbose`
- `pnpm tempot init`
- `pnpm tempot doctor --quick`
- `pnpm lint`
- `pnpm spec:validate`
- `pnpm cms:check`
- `git diff --check`

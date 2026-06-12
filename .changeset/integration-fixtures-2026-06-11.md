---
"bot-server": patch
---

Spec #056 Integration Fixtures slice (continuation of T010):

- **Fix broken type import** in `tests/integration/__fixtures__/modules/test-module/index.ts`:
  the path was `../../../../../../src/bot-server.types.js` (6 levels up,
  resolving to non-existent `apps/src/`), should be 5 levels. Replaced with
  a self-contained `FixtureBot`/`FixtureDeps` interface so the fixture compiles
  with a single-directory `rootDir`. Runtime behavior is unchanged
  (registers `/ping`, calls `logger.info`).
- **Add fixture `tsconfig.json`** extending the repo root tsconfig so
  `tsc -p .` inside the fixture emits clean `dist/`.
- **Build fixture in `beforeAll`** of `tests/integration/e2e.test.ts`
  via `pnpm exec tsc -p .` (symmetric with the existing `prisma db push`
  invocation). CI no longer relies on a pre-existing local `dist/`.
- **Re-enable `apps/*/tests/integration/**`** in root `vitest.config.ts`.
  Now surfaces app-level integration tests in the root CI gate.

Root `pnpm test:integration` now runs 19 files / 115 tests (was 18/114 in
the previous slice when apps were partially excluded). No production code
changes.

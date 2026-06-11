---
"bot-server": patch
---

Spec #056 CI Visibility slice (T006, T007, T010):

- **T006**: Repair stale `InteractionTrace` fixture in
  `apps/bot-server/tests/unit/error-boundary.test.ts`. Add the required
  `eventCount: 0` field so `isInteractionTrace` accepts the fixture and
  `getInteractionTrace` returns the trace as designed.
- **T007**: Same fix for
  `apps/bot-server/tests/unit/middleware/audit.middleware.test.ts`.
- **T010 (partial)**: Extend root `vitest.config.ts` to include
  `apps/*/tests/unit/**/*.test.ts` so application unit tests run in the root
  CI gate.

Production code is unchanged; the bugs were stale test fixtures missing a
field that the production trace type already required. Root unit count goes
from 241 files / 1942 tests to 271 files / 2167 tests.

The application integration include (`apps/*/tests/integration/**`) is
deferred: enabling it surfaces a separate hidden issue
(`apps/bot-server/tests/integration/e2e.test.ts` depends on a gitignored
`dist/` build of `tests/integration/__fixtures__/modules/test-module/` that
no CI step rebuilds). Fixing that needs its own slice (fixture build
pipeline) and is now documented as the next step for Spec #056.

Remaining Spec #056 tasks (T008, T009, T011-T046, integration include) stay
owned by Spec #056.

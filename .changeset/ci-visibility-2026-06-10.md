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
- **T010**: Extend root `vitest.config.ts` to include
  `apps/*/tests/unit/**/*.test.ts` and `apps/*/tests/integration/**/*.test.ts`
  so application tests run in the root CI gate.

Production code is unchanged; the bugs were stale test fixtures missing a
field that the production trace type already required. Root unit count goes
from 241 files / 1942 tests to 271 files / 2167 tests.

Remaining Spec #056 tasks (T008 seeded fixture, T011 canonical scripts, T012
CI script update, T013 seed-and-prove cycle, T014-T046) are out of scope for
this slice and remain owned by Spec #056.

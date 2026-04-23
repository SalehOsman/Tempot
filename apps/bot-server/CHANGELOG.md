# bot-server

## 1.0.0

### Major Changes

- bee4948: Completed Phase 2 DevOps local webhook setup and Cloudflare Tunnels integration

### Minor Changes

- bee4948: Phase 2D: Added End-to-End Integration Tests for bot-server and module-registry wiring

### Patch Changes

- 7fe2445: fix: resolve ESLint violations in deps.factory and e2e test — decompose buildDeps into focused builder functions, replace all any types, remove eslint-disable comments
- 8c870c3: fix(bot-server): resolve phantom dependency and post-review documentation gaps
  - Add missing @tempot/ux-helpers workspace dependency (C6)
  - Conditional cache_warming log — only logs success when warming succeeds (W5)
  - Document commandScopeMap in data-model.md (W10)
  - Add TODO comments for global and per_group rate limiter scopes (C3)
  - Mark all 112 tasks.md acceptance criteria as complete

- Updated dependencies [7e49350]
- Updated dependencies [e8414a1]
- Updated dependencies [9c9b244]
- Updated dependencies [6d42561]
- Updated dependencies [4d1dac3]
  - @tempot/database@0.1.2
  - @tempot/event-bus@0.2.1
  - @tempot/module-registry@0.2.0
  - @tempot/settings@0.2.0
  - @tempot/logger@0.1.2
  - @tempot/session-manager@0.1.2
  - @tempot/ux-helpers@0.1.2

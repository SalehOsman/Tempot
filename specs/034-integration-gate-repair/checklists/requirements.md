# Requirements Checklist: Integration Gate Repair

**Purpose**: Validate Spec #034 before implementation.

- [ ] No `[NEEDS CLARIFICATION]` markers remain.
- [ ] The task is isolated from Spec #031 and docs-freshness work.
- [ ] Requirements identify both observed failure classes: global `pnpm` assumptions and missing database schema bootstrap.
- [ ] TDD tasks require RED before code changes.
- [ ] Verification tasks include `test:integration`, unit tests, lint, build, `spec:validate`, `cms:check`, audit, and diff check.
- [ ] Scope excludes Rule XC deferred package activation.
- [ ] Documentation sync is represented before finish.

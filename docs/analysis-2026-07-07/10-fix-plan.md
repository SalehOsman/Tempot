# 10 - Completion and Documentation Remediation Plan

## Execution Principles

This plan follows the constitution and workflow guide:

- Do not develop directly on `main`.
- Use one active implementation spec at a time.
- Do not bypass TDD, review, reconciliation, or merge gates.
- Keep documentation synchronized with actual merged behavior.
- Fix confirmed defects at the source.

## Phase 1 - Stabilize the Current Workspace

Goal: prevent accidental release from dirty local state.

Tasks:

1. Keep all current work on an isolated branch or worktree.
2. Do not deploy the dirty workspace.
3. Use only clean `origin/main` signed image digests for staging smoke.
4. Remove or isolate unrelated untracked analysis artifacts before any feature merge.
5. Align the local pnpm command path with Corepack-managed `pnpm@10.33.3`.

Acceptance:

- `git status` for the release candidate is clean except intended files.
- Direct release commands use `corepack pnpm` or an equivalent pinned pnpm.

## Phase 2 - Complete Spec #058

Goal: close the access-mode and membership gate before real-user beta.

Open task groups:

1. Denied-interaction audit logging.
2. Visitor command and callback handler completion.
3. Remaining lifecycle event emissions.
4. Concurrent approval/rejection idempotency.
5. Membership state transition and profile activation audit records.
6. Super-admin access-mode settings view/update flow.
7. End-to-end scenario tests for private, pending, stale callback, approval, role-filtered menus, public mode, and super-admin bootstrap.
8. Documentation sync for README, roadmap, and architecture.
9. Integration gate and code review.

Acceptance:

- All Spec #058 tasks are complete.
- `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, `pnpm spec:validate`, and relevant docs/CMS/source gates pass.
- Review has zero Critical and no unapproved High findings.

## Phase 3 - Cleanup Constitutional Violations

Goal: remove known local/documentation violations before merge or final release.

Tasks:

1. Delete `apps/bot-server/src/bot-server.types.js`.
2. Refactor `apps/bot-server/scripts/webhook-manager.ts` to remove `eslint-disable`.
3. Translate developer-facing Arabic comments in active TypeScript files to English.
4. Decide which Arabic product docs are legitimate localized end-user docs and document that policy.
5. Create Spec #060 for workspace cleanup if the project keeps the numbering referenced by Spec #059.

Acceptance:

- `pnpm source:conformance` passes.
- No `eslint-disable` remains outside approved test fixtures.
- Arabic text outside locale files, product localization, and approved test fixtures is either removed, translated, or tracked in a time-boxed allowlist.

## Phase 4 - Implement Methodology Enforcement

Goal: prevent recurrence of the 2026-06-23 documentation-language incident.

Tasks:

1. Start Spec #059 only after Spec #058 merges.
2. Implement language-policy audit.
3. Implement stale-artifacts audit.
4. Implement `eslint-disable` audit.
5. Add the `pnpm methodology:lint` aggregator.
6. Wire the aggregator into CI.
7. Add time-boxed allowlist entries only for explicitly owned cleanup specs.
8. Create Spec #061 for Arabic documentation translation/removal if the project keeps the numbering referenced by Spec #059.

Acceptance:

- `pnpm methodology:lint` passes.
- CI blocks new methodology violations.
- Allowlist entries are owned, dated, and expiring.

## Phase 5 - Repair Active Documentation

Goal: restore reliable English source-of-truth documentation.

Tasks:

1. Rebuild `docs/architecture/tempot_architecture.md` in English from current ADRs, roadmap, and implementation state.
2. Update `docs/developer/documentation-cleanup-plan.md` with the 2026-07-07 findings.
3. Translate or remove `docs/analysis-2026-06-10/` and `docs/analysis-2026-06-23/`, or move them under a clearly historical allowlisted archive.
4. Review `docs/prompt/`, `docs/troubleshooting/`, and old code-review docs for active versus historical classification.
5. Update `docs/ROADMAP.md` only after merges, not for unmerged local state.

Acceptance:

- Active source-of-truth docs are English and not mojibake.
- Historical exceptions are clearly marked and excluded from active guidance.
- `pnpm docs:check` and `pnpm spec:validate` pass.

## Phase 6 - Complete Spec #057 Staging and Production Evidence

Goal: make a production decision based on actual target-environment evidence.

Tasks:

1. Resolve latest signed immutable `origin/main` image digest.
2. Deploy to external staging.
3. Run migrations and staging smoke.
4. Verify Telegram webhook delivery.
5. Verify `/live` and restricted `/ready`.
6. Verify metrics and independent alert fallback.
7. Rehearse rollback or forward-fix.
8. Record backup/restore evidence for the target environment.
9. Complete security, architecture, DevSecOps, QA, and code review.
10. Record final go/no-go.

Acceptance:

- All Spec #057 tasks are complete.
- No open Critical or unapproved High findings remain.
- Production go/no-go is explicitly recorded.


# Remediation Sequence Reconciliation Design

**Date:** 2026-06-15
**Status:** Project Manager approved the improved sequence in conversation;
written design pending review
**Scope:** Specs 053-057 remediation sequencing and branch reconciliation

## Context

The remediation specifications remain directionally correct, but repository
state has advanced beyond the status recorded on 2026-06-10:

- `main` at `8611dd1` contains the Spec 056 CI visibility and integration
  fixture slices merged on 2026-06-11 and 2026-06-12.
- `codex/053-authorization-correction` contains a committed authorization
  implementation that is not on `main`.
- `codex/056-quality-gates-hardening` contains a committed broader quality-gate
  implementation that is not on `main`.
- `codex/remediation-integration` combines the committed Spec 053 and Spec 056
  work, but its merge base predates the three latest `main` commits.
- `codex/054-sensitive-data-protection` contains committed implementation work
  plus uncommitted changes. Those changes must be preserved and must not be
  treated as verified or complete.
- Spec 055 has no active implementation worktree.

The existing roadmap and analysis therefore cannot be used as a literal
execution ledger.

## Approaches Considered

### Approach A: Restart Every Remediation from Current Main

Reimplement Specs 053-057 in the improved order from fresh branches.

**Rejected:** This discards substantial committed, reviewable work and risks
reintroducing already solved defects.

### Approach B: Merge Existing Branches Immediately

Merge the integration and sensitive-data branches, then repair failures on
`main`.

**Rejected:** The integration branch is behind current `main`, and the
sensitive-data branch has uncommitted work. Immediate merging would bypass
review, clean-diff, TDD evidence, and reconciliation gates.

### Approach C: Reconcile, Review, and Promote Existing Work Incrementally

Preserve every existing branch, establish an accurate baseline, reconcile the
integration branch with current `main`, review and verify each remediation
slice, then promote only proven work.

**Selected:** This approach preserves completed effort while restoring the
project's required gates and the improved dependency order.

## Improved Execution Sequence

### Stage 0: Baseline and Branch Reconciliation

1. Record actual branch, commit, worktree, and dirty-state evidence.
2. Update the remediation program and roadmap only from verified evidence.
3. Mark the Spec 056 CI visibility tasks already merged to `main` as complete.
4. Keep unmerged branch work explicitly classified as in review or in progress.
5. Reconcile `codex/remediation-integration` with current `main` in its own
   worktree without touching the dirty Spec 054 worktree.

### Stage 1: Authorization and CI Foundation

1. Review the existing Spec 053 implementation against the authorization
   coverage matrix, constitution, and current `main`.
2. Review the remaining Spec 056 foundation changes without reimplementing the
   CI visibility slice already merged.
3. Resolve integration conflicts at their source.
4. Run focused authorization and bot-server tests, then the relevant broad
   gates.
5. Update Spec 053 and Spec 056 tasks, implementation evidence, changesets, and
   roadmap status before promotion.

### Stage 2: Data-Integrity Prerequisites

1. Complete the atomic identity-update and non-overridable soft-delete slices
   from Spec 055 before protected-data production cutover.
2. Implement each invariant in a separate TDD-backed commit.
3. Add transaction rollback and adversarial soft-delete tests.
4. Perform the shared database blast-radius review.

Spec 055 repository-boundary and pagination slices may follow after these two
release-blocking invariants if they do not block protected-data correctness.

### Stage 3: Sensitive-Data Protection

1. Preserve and review the existing Spec 054 branch instead of restarting it.
2. Rebase or integrate it only after Stage 2 invariants are available.
3. Verify encryption envelopes, versioned lookup-token reads, audit allowlists,
   observability redaction, migration resumability, and key rotation.
4. Do not execute plaintext retirement, destructive migration, production key
   rotation, or production cutover without a separate Project Manager approval.

### Stage 4: Remaining Quality and Data Work

1. Complete the remaining Spec 055 repository-boundary and aggregate-count
   slices.
2. Complete Spec 056 coverage, documentation freshness, toolchain, source
   conformance, and dependency automation work.
3. Treat freshness as source-of-truth claim validation, not file-age checking
   alone.
4. Resolve the current high-severity dependency audit finding before release.

### Stage 5: Production Delivery

Execute Spec 057 as separately reviewable slices:

1. startup and truthful health;
2. HTTP perimeter and runtime dependencies;
3. minimal runtime image and manifest;
4. one approved vulnerability scanner, SBOM generation, provenance, signing,
   and verification;
5. immutable promotion, observability, backup/restore, and recovery rehearsal.

Production remains blocked until the full go/no-go evidence exists.

## Branch and Worktree Policy

- No direct development occurs on `main`.
- Existing dirty worktrees are preserved.
- Only one shared production-code remediation slice is actively modified at a
  time.
- Reconciliation work uses
  `codex/remediation-sequence-reconciliation`.
- Existing implementation commits are reviewed and integrated; they are not
  copied or silently rewritten.
- A failed gate stops promotion to the next stage.

## Error and Conflict Handling

- Merge conflicts are resolved using current specifications and current `main`
  behavior as the baseline, not by preferring one branch wholesale.
- Pre-existing uncommitted changes are never discarded.
- A test failure is classified as pre-existing, merge-induced, or
  implementation-induced before a fix is attempted.
- Database migration or key failures block cutover and emit non-sensitive
  evidence.
- Documentation claims use the states `merged`, `verified on branch`,
  `in progress`, or `not started`; branch existence alone is not completion.

## Verification Strategy

Stage-specific focused tests run first. Before promoting a stage, run the
relevant subset of:

```powershell
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
pnpm cms:check
pnpm boundary:audit
pnpm module:checklist
pnpm audit --audit-level=high
```

Additional required evidence:

- Spec 053: production ability role matrix and zero-mutation denials.
- Spec 055: transaction failure injection and adversarial soft-delete queries.
- Spec 054: canary leakage scans, migration resume, backup/restore, and
  two-version key rotation.
- Spec 056: seeded gate failures followed by clean GREEN runs.
- Spec 057: image inspection, scan, signature verification, staging smoke,
  migration compatibility, and rollback or forward-fix rehearsal.

## Documentation Reconciliation

Each promoted stage updates:

- affected SpecKit artifacts and task checkboxes;
- `docs/ROADMAP.md`;
- the remediation program status;
- implementation or verification evidence;
- affected architecture, security, operations, and developer documentation;
- ADR index and changesets when applicable.

Any future constitution amendment must target a version after the current
`2.5.0`; the obsolete proposal to create Constitution `2.5` is removed from
the execution program.

## Completion Criteria

This design is complete when:

1. branch state is represented accurately;
2. current `main` work is not reimplemented;
3. Spec 055 atomicity and soft-delete invariants precede irreversible Spec 054
   cutover;
4. existing Spec 054 work is preserved and reviewed;
5. every stage has explicit verification and documentation gates;
6. production remains blocked until Spec 057 and the final go/no-go gate pass.

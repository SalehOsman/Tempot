# Remediation Stage 0-1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile the existing Spec 053 and Spec 056 implementations with
current `main`, verify their behavior, and publish an accurate execution
baseline without touching the dirty Spec 054 worktree.

**Architecture:** Use the current-main branch
`codex/remediation-sequence-reconciliation` as the reconciliation target.
Merge the committed `codex/remediation-integration` history, resolve conflicts
against current-main behavior, and treat the newer CI fixture commits already
on `main` as authoritative where behavior overlaps. Review and repair the
result before updating completion claims.

**Tech Stack:** Git worktrees, TypeScript 5.9.3, pnpm, Vitest 4.1.0, ESLint,
SpecKit validation, CASL authorization, GitHub Actions.

---

## File Map

- `docs/operations/evidence/2026-06-15-remediation-branch-baseline.md`: immutable
  baseline of branch heads, dirty worktrees, and merge dependencies.
- `docs/superpowers/specs/2026-06-15-remediation-sequence-reconciliation-design.md`:
  approved sequencing decision.
- `.github/workflows/ci.yml`: canonical CI commands after conflict resolution.
- `.specify/feature.json`: active execution feature after reconciliation.
- `apps/bot-server/tests/integration/e2e.test.ts`: retain the latest
  current-main integration fixture while preserving complete app coverage.
- `apps/bot-server/tests/unit/error-boundary.test.ts`: retain current trace
  fixture correction.
- `apps/bot-server/tests/unit/middleware/audit.middleware.test.ts`: retain
  current trace fixture correction.
- `docs/ROADMAP.md`: factual merged/on-branch/in-progress status.
- `docs/project-analysis/2026-06-07/remediation-program.md`: improved sequence
  and current evidence.
- `specs/053-authorization-correction/tasks.md`: Spec 053 verified task ledger.
- `specs/056-quality-gates-hardening/tasks.md`: Spec 056 verified task ledger.
- `specs/056-quality-gates-hardening/implementation-report.md`: commands and
  current verification evidence.
- `pnpm-lock.yaml`: regenerated only from the reconciled manifest.
- Other Spec 053/056 source and test files: imported from the committed
  implementation, then reviewed against their specifications.

### Task 1: Record the Immutable Branch Baseline

**Files:**

- Create:
  `docs/operations/evidence/2026-06-15-remediation-branch-baseline.md`
- Modify:
  `docs/superpowers/specs/2026-06-15-remediation-sequence-reconciliation-design.md`

- [ ] **Step 1: Capture branch and worktree evidence**

Run:

```powershell
git worktree list --porcelain
git log -1 --oneline main
git log -1 --oneline codex/053-authorization-correction
git log -1 --oneline codex/056-quality-gates-hardening
git log -1 --oneline codex/remediation-integration
git log -1 --oneline codex/054-sensitive-data-protection
git -C F:\Tempot_Worktrees\054-sensitive-data-protection status --short
```

Expected: the evidence identifies current `main`, committed remediation heads,
and the dirty Spec 054 worktree without modifying it.

- [ ] **Step 2: Write the baseline document**

The document must contain:

```markdown
| Worktree or branch                  | Head         | State                  | Permitted action     |
| ----------------------------------- | ------------ | ---------------------- | -------------------- |
| main                                | <actual SHA> | merged baseline        | read only            |
| codex/053-authorization-correction  | <actual SHA> | committed, unmerged    | review and reconcile |
| codex/056-quality-gates-hardening   | <actual SHA> | committed, unmerged    | review and reconcile |
| codex/remediation-integration       | <actual SHA> | committed, behind main | merge source         |
| codex/054-sensitive-data-protection | <actual SHA> | dirty                  | preserve; no edits   |
```

Also record that Spec 055 has no active worktree.

- [ ] **Step 3: Verify the baseline document**

Run:

```powershell
rg -n "main|053|054|055|056|remediation-integration|dirty|no edits" `
  docs/operations/evidence/2026-06-15-remediation-branch-baseline.md
git diff --check
```

Expected: every branch/state assertion is present and `git diff --check`
returns no findings.

- [ ] **Step 4: Commit the baseline**

```powershell
git add docs/operations/evidence/2026-06-15-remediation-branch-baseline.md `
  docs/superpowers/specs/2026-06-15-remediation-sequence-reconciliation-design.md
git commit -m "docs(remediation): record branch reconciliation baseline"
```

### Task 2: Merge the Committed Remediation Integration

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.specify/feature.json`
- Modify: `README.md`
- Modify: `apps/bot-server/src/index.ts`
- Modify: `apps/bot-server/tests/integration/e2e.test.ts`
- Modify: `apps/bot-server/tests/unit/error-boundary.test.ts`
- Modify: `apps/bot-server/tests/unit/middleware/audit.middleware.test.ts`
- Modify: `docker-compose.yml`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/project-analysis/2026-06-07/README.md`
- Modify: `docs/project-analysis/2026-06-07/remediation-program.md`
- Modify: `pnpm-lock.yaml`
- Modify: `specs/053-authorization-correction/**`
- Modify: `specs/054-sensitive-data-protection/**`
- Modify: `specs/055-data-integrity-hardening/**`
- Modify: `specs/056-quality-gates-hardening/**`
- Modify: `specs/057-production-delivery-hardening/**`
- Modify: `vitest.config.ts`
- Add: committed Spec 053/056 implementation files shown by
  `git diff --name-status main...codex/remediation-integration`

- [ ] **Step 1: Start a non-committing merge**

Run:

```powershell
git merge --no-ff --no-commit codex/remediation-integration
```

Expected: Git imports committed remediation work and reports the known
current-main conflicts. Do not abort unless the index cannot represent the
merge.

- [ ] **Step 2: Resolve current-main behavior conflicts**

Use these rules:

```text
.github/workflows/ci.yml:
  keep current-main security override and integration fixture behavior;
  add canonical inventory, docs, coverage, and authorization gates once each.

apps/bot-server/tests/integration/e2e.test.ts:
  keep the current-main real module fixture and gRPC-compatible setup;
  retain the broader required application-path assertions where compatible.

apps/bot-server/tests/unit/error-boundary.test.ts and
apps/bot-server/tests/unit/middleware/audit.middleware.test.ts:
  keep the trace fixture shape merged on 2026-06-11.

pnpm-lock.yaml:
  do not resolve by choosing one side wholesale; reconcile package.json first,
  then run corepack pnpm install --lockfile-only.

.specify/feature.json:
  set feature to 053-authorization-correction during Stage 1 verification.

SpecKit artifacts:
  preserve the current-main artifact content plus implementation evidence;
  never mark unverified work complete solely because the source branch did.
```

- [ ] **Step 3: Confirm no unresolved merge markers remain**

Run:

```powershell
git diff --name-only --diff-filter=U
rg -n "^(<<<<<<<|=======|>>>>>>>)" `
  --glob "!pnpm-lock.yaml" .
```

Expected: both commands return no unresolved conflicts.

- [ ] **Step 4: Regenerate the lockfile**

Run:

```powershell
corepack pnpm install --lockfile-only
git diff --check
```

Expected: install exits zero and no whitespace errors exist.

- [ ] **Step 5: Commit the mechanical reconciliation**

```powershell
git add -A
git commit -m "chore(remediation): reconcile authorization and quality branches"
```

This commit records merge resolution only. Behavioral repairs discovered by
tests belong to later TDD commits.

### Task 3: Verify and Repair Spec 053 Authorization

**Files:**

- Review: `specs/053-authorization-correction/spec.md`
- Review: `specs/053-authorization-correction/tasks.md`
- Review: `docs/developer/authorization-coverage.md`
- Test: `apps/bot-server/tests/integration/authorization-role-matrix.test.ts`
- Test: `apps/bot-server/tests/unit/authorization/*.test.ts`
- Test: `apps/bot-server/tests/unit/middleware/auth.middleware.test.ts`
- Test: `packages/auth-core/tests/unit/ability.factory.test.ts`
- Modify only if a failing test proves a defect: corresponding Spec 053 source

- [ ] **Step 1: Run focused authorization tests**

Run:

```powershell
corepack pnpm exec vitest run `
  apps/bot-server/tests/unit/authorization `
  apps/bot-server/tests/unit/middleware/auth.middleware.test.ts `
  packages/auth-core/tests/unit/ability.factory.test.ts `
  --reporter=verbose
corepack pnpm exec vitest run `
  apps/bot-server/tests/integration/authorization-role-matrix.test.ts `
  --reporter=verbose
corepack pnpm authorization:check
```

Expected: all tests and the authorization coverage audit pass.

- [ ] **Step 2: If a defect appears, preserve RED evidence**

Add the smallest failing test to the owning test file and rerun only that test.
The expected failure must describe the missing action/subject enforcement,
invalid actor acceptance, non-super-admin `manage all`, or state mutation.

- [ ] **Step 3: Implement the minimal GREEN repair**

Change only the owning middleware, ability factory, policy, or handler. Do not
add broad allow rules, synthetic production abilities, direct Prisma access,
or hardcoded user-facing text.

- [ ] **Step 4: Rerun focused tests**

Run the commands from Step 1.

Expected: all focused tests pass and the coverage audit reports zero findings.

- [ ] **Step 5: Commit any behavioral repair**

```powershell
git add <failing-test-files> <owning-source-files>
git commit -m "fix(auth): repair reconciled authorization behavior"
```

Skip this commit when no repair was required.

### Task 4: Verify and Repair Spec 056 Quality Gates

**Files:**

- Test: `scripts/ci/tests/unit/*.test.ts`
- Test: `apps/docs/tests/unit/check-freshness.test.ts`
- Review: `.github/workflows/ci.yml`
- Review: `package.json`
- Review: `vitest.config.ts`
- Modify only when a failing meta-test proves a gate defect

- [ ] **Step 1: Run quality-gate meta-tests**

Run:

```powershell
corepack pnpm exec vitest run scripts/ci/tests/unit --reporter=verbose
corepack pnpm exec vitest run `
  apps/docs/tests/unit/check-freshness.test.ts `
  apps/docs/tests/unit/validate-frontmatter.test.ts `
  --reporter=verbose
corepack pnpm test:inventory
corepack pnpm docs:check
```

Expected: meta-tests, project inventory, and documentation checks pass.

- [ ] **Step 2: Verify canonical app execution**

Run:

```powershell
corepack pnpm test:unit
corepack pnpm test:integration
```

Expected: application projects are listed and all tests pass.

- [ ] **Step 3: Repair failures with RED -> GREEN**

For each failure:

1. isolate one failing gate behavior;
2. add or retain a meta-test that fails for the correct reason;
3. change the smallest owning script/configuration;
4. rerun the isolated test;
5. rerun Steps 1 and 2.

- [ ] **Step 4: Commit quality-gate repairs**

```powershell
git add <gate-test-files> <owning-script-or-config-files>
git commit -m "fix(ci): repair reconciled quality gates"
```

Skip this commit when no repair was required.

### Task 5: Review the Reconciled Diff

**Files:**

- Review all files in `git diff main...HEAD`
- Modify findings at their owning source

- [ ] **Step 1: Run constitutional static checks**

Run:

```powershell
corepack pnpm lint
corepack pnpm boundary:audit
corepack pnpm module:checklist
corepack pnpm cms:check
```

Expected: all commands exit zero.

- [ ] **Step 2: Review high-risk authorization and CI changes**

Confirm:

```text
- global middleware no longer requires manage all;
- every protected handler in scope owns action/subject enforcement;
- denied actions mutate no state;
- CI does not omit apps;
- CI uses canonical root commands;
- no eslint-disable, ts-ignore, ts-expect-error, any, or hardcoded user text was
  introduced;
- no existing current-main integration fixture was replaced by a dummy path.
```

- [ ] **Step 3: Fix every Critical/High finding with TDD**

Each behavior defect receives a failing test first. Documentation-only findings
are corrected directly and verified with docs/spec commands.

- [ ] **Step 4: Commit reviewed fixes**

```powershell
git add <reviewed-files>
git commit -m "fix(remediation): resolve reconciliation review findings"
```

Skip this commit when review has no findings.

### Task 6: Reconcile Documentation and Task Ledgers

**Files:**

- Modify: `docs/ROADMAP.md`
- Modify: `docs/project-analysis/2026-06-07/remediation-program.md`
- Modify: `specs/053-authorization-correction/tasks.md`
- Modify: `specs/056-quality-gates-hardening/tasks.md`
- Modify: `specs/056-quality-gates-hardening/implementation-report.md`
- Modify: `.specify/feature.json`

- [ ] **Step 1: Update status from verification evidence**

Use only these states:

```text
merged on main
verified on reconciliation branch
in progress
not started
blocked pending explicit approval
```

Mark task checkboxes complete only when the corresponding file and fresh
verification evidence exist.

- [ ] **Step 2: Record the improved dependency order**

The program must state:

```text
053 and 056 foundation -> 055 atomicity/soft-delete -> 054 cutover ->
remaining 055 -> remaining 056 -> 057 -> production go/no-go
```

It must also state that destructive Spec 054 actions require separate approval.

- [ ] **Step 3: Run documentation reconciliation**

Run:

```powershell
corepack pnpm docs:check
corepack pnpm spec:validate
git diff --check
```

Expected: all commands exit zero.

- [ ] **Step 4: Commit documentation reconciliation**

```powershell
git add docs/ROADMAP.md `
  docs/project-analysis/2026-06-07/remediation-program.md `
  specs/053-authorization-correction/tasks.md `
  specs/056-quality-gates-hardening/tasks.md `
  specs/056-quality-gates-hardening/implementation-report.md `
  .specify/feature.json
git commit -m "docs(remediation): reconcile stage 1 execution evidence"
```

### Task 7: Final Stage 1 Verification

**Files:**

- No intended source changes
- Update verification evidence only if required

- [ ] **Step 1: Verify clean source workspace**

Run:

```powershell
Get-ChildItem apps,packages,modules -Recurse -File -Include *.js,*.d.ts |
  Where-Object { $_.FullName -match '[\\/]src[\\/]' }
```

Expected: no generated JavaScript or declaration files under `src`.

- [ ] **Step 2: Run full relevant gates**

Run:

```powershell
corepack pnpm lint
corepack pnpm build
corepack pnpm test:unit
corepack pnpm test:integration
corepack pnpm spec:validate
corepack pnpm cms:check
corepack pnpm boundary:audit
corepack pnpm module:checklist
corepack pnpm audit --audit-level=high
```

Expected: all gates pass. If audit reports a current High advisory, Stage 1 is
not complete; record and fix it before promotion.

- [ ] **Step 3: Confirm the dirty Spec 054 worktree was preserved**

Run:

```powershell
git -C F:\Tempot_Worktrees\054-sensitive-data-protection status --short
```

Expected: the pre-existing dirty file set remains present; no file was removed
or reset by Stage 1.

- [ ] **Step 4: Produce the merge-readiness report**

Report exact command results, remaining findings, branch SHA, and whether Stage
1 is ready for Project Manager merge approval. Do not merge to `main`
automatically.

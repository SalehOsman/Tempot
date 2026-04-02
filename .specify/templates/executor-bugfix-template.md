# Executor Prompt Template — Bugfix

> **Authority:** This template has the same authority as `roles.md`.
> Every bugfix prompt written for the Executor MUST follow this structure.
> **Version:** 1.1.0

---

## Usage Instructions

Replace all `{PLACEHOLDERS}` with actual values.
Remove this "Usage Instructions" section from the final prompt.

**Placeholders:**

- `{BUG_TITLE}` — concise title, e.g., "Session locale not persisting after restart"
- `{SEVERITY}` — P0 (critical) | P1 (high) | P2 (medium) | P3 (low)
- `{AFFECTED_PACKAGE}` — e.g., `packages/session-manager`
- `{SYMPTOMS}` — what the user/system observes (observable behavior, error messages, logs)
- `{REPRODUCTION_STEPS}` — numbered steps to reproduce
- `{EXPECTED_BEHAVIOR}` — what should happen
- `{ACTUAL_BEHAVIOR}` — what actually happens
- `{RELEVANT_FILES}` — files suspected to be involved (if known)
- `{RELATED_SPECS}` — spec artifacts if they exist for this area

---

## Template Start

---

# Bugfix: {BUG_TITLE}

**Severity:** {SEVERITY}

## References

Read and comply with these before any action:

- Constitution: `.specify/memory/constitution.md` — especially Rule VII (Fix at Source) and Rule LXX (Critical Bug-Fixing Methodology)
- Workflow: `docs/developer/workflow-guide.md`

## Toolchain

### Superpowers (Debugging & Fix Skills)

Activate these skills as specified below. Do not improvise — follow
the skill instructions exactly.

| Skill                            | Purpose                                     | When to use                                                                                        |
| -------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `systematic-debugging`           | 4-phase root cause analysis                 | Phase 1-2: evidence gathering + root cause analysis. This is the PRIMARY skill — activate it FIRST |
| `root-cause-tracing`             | Trace execution path from symptom to defect | Phase 2: sub-skill of `systematic-debugging`. Use when the cause is not immediately obvious        |
| `defense-in-depth`               | Validate fix prevents recurrence            | Phase 3: after fixing, ensure the fix is robust                                                    |
| `condition-based-waiting`        | Handle timing/race condition bugs           | Phase 1-2: use when the bug is intermittent or timing-related                                      |
| `test-driven-development`        | RED → GREEN → REFACTOR cycle                | Phase 3: write failing test BEFORE fixing. Mandatory per Constitution Rule XXXIV                   |
| `verification-before-completion` | Evidence-based final check                  | Phase 4: run tests, paste actual output. No claims without evidence                                |
| `requesting-code-review`         | Review fix against constitution             | Phase 4: optional but recommended for P0/P1 fixes                                                  |

## Bug Context

**Affected package:** `{AFFECTED_PACKAGE}`

**Symptoms:**
{SYMPTOMS}

**Reproduction steps:**
{REPRODUCTION_STEPS}

**Expected behavior:**
{EXPECTED_BEHAVIOR}

**Actual behavior:**
{ACTUAL_BEHAVIOR}

**Relevant files (if known):**
{RELEVANT_FILES}

**Related specs:**
{RELATED_SPECS}

## Execute

### Phase 1: Evidence Gathering

**Activate `systematic-debugging`** and follow its evidence gathering phase.

- Reproduce the bug. Confirm you can observe the exact symptoms described above.
- Collect evidence: error messages, stack traces, logs, failing test output.
- If the bug is intermittent or timing-related, activate `condition-based-waiting` sub-skill.
- If you cannot reproduce: STOP and report. Do not guess.

### Phase 2: Root Cause Analysis

Continue with `systematic-debugging` hypothesis and testing phases.

- Trace the execution path from symptom to source. Activate `root-cause-tracing` sub-skill if the cause is not immediately obvious.
- Identify the EXACT line(s) where the defect exists.
- Document your reasoning: "The bug occurs because [X] at [file:line] does [Y] instead of [Z]."

### Phase 3: Fix with TDD

**Activate `test-driven-development`** and follow its RED → GREEN → REFACTOR cycle.

1. Write a failing test that reproduces the bug exactly. Run it — confirm it FAILS for the right reason.
2. Fix the root cause DIRECTLY in the original code. Write the minimum change needed.
3. Run the test — confirm it PASSES.
4. Activate `defense-in-depth` sub-skill to validate the fix prevents recurrence.
5. Run the full test suite of the affected package — confirm zero regressions.
6. Commit: `fix({module}): {concise description}`

### Phase 3.5: Documentation Sync (MANDATORY — Constitution Rule L)

If the fix changed any behavior, interface, data model, or API documented in SpecKit artifacts or project documentation, update them now. Code and documentation MUST always match.

**A. SpecKit Artifacts** — Check and update in `specs/{NNN}-{FEATURE_NAME}/` if affected:

- `data-model.md`: if entities, fields, events, interfaces, or type registries changed
- `tasks.md`: if acceptance criteria no longer match implementation
- `research.md`: if a new technical decision was made as part of the fix (add as numbered Decision)
- `spec.md`: only if the fix changed functional requirements or edge case behavior

**B. Spec Consistency Gate** — If SpecKit artifacts were updated, run `/speckit.analyze`
to verify internal consistency between updated artifacts (spec ↔ plan ↔ tasks ↔ data-model):

```
/speckit.analyze
```

Fix any inconsistencies before proceeding.

**C. Reconciliation Gate** — Run `pnpm spec:validate` to verify spec→code alignment:

```bash
pnpm spec:validate {NNN}-{FEATURE_NAME}
```

Exit 0: continue. Exit 1: fix or justify. Exit 2: BLOCKED.

**C. Project Documentation** — Update ALL that apply:

- `docs/ROADMAP.md` — update "Last updated" date and "Next Action" section (Rule LXXXIX)
- `docs/architecture/adr/README.md` — if a new ADR was created, add its row to the index
- `CLAUDE.md` — if a new dependency was added, update the tech stack table
- `docs/tempot_v11_final.md` — if the fix changed architectural patterns or documented guarantees
- `docs/developer/package-creation-checklist.md` — if a new quality gate was introduced

**D. Changeset** — Create a changeset:

```bash
pnpm changeset
```

Select affected package(s), type (patch for bugfix), and write a summary.

### Phase 4: Verification

**Activate `verification-before-completion`** — no claims without evidence.

- Run full test suite. Paste actual output.
- Confirm the original reproduction steps no longer produce the bug.
- If other packages depend on the affected code, run their tests too (Constitution Rule LIV — Blast Radius).
- For P0/P1 fixes: activate `requesting-code-review` for an additional review against the constitution.

## Constraints

- Fix the defective code DIRECTLY at its source. NEVER write new code to handle, wrap, or compensate for broken existing code. Prohibited patterns: adding try/catch around a buggy call, creating a helper function to sanitize bad output, adding if-checks to guard against a function that should not fail, or duplicating logic to bypass the broken path. If the bug is in function X at file:line, fix function X — do not write function Y to work around it. (Constitution Rule VII + LXX)
- No `@ts-ignore`, no `eslint-disable`, no `any` types.
- Single responsibility: fix THIS bug only. Do not "while I'm here" fix other issues (Constitution Rule IX).
- If the root cause is unclear or ambiguity exists: STOP. Do NOT guess a fix. Report your analysis and wait.
- If the fix requires changing shared code (`packages/shared/`, base types): document the blast radius on all dependent packages before proceeding (Constitution Rule LIV).

## Final Report

When the fix is complete, report:

- Root cause: what was wrong and where (file:line)
- Fix applied: what you changed and why
- Test evidence: paste test output (before and after)
- Regression check: full suite results
- Blast radius: other packages affected (if any)

---

## Template End

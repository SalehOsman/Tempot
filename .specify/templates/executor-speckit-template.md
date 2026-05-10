# Executor Prompt Template — SpecKit Specification Phase

> **Authority:** This template has the same authority as `roles.md`.
> Every SpecKit specification prompt written for the Executor MUST follow this structure.
> **Version:** 1.0.0

---

## Usage Instructions

Replace all `{PLACEHOLDERS}` with actual values.
Remove this "Usage Instructions" section from the final prompt.

**Placeholders:**

- `{PACKAGE_NAME}` — e.g., `@tempot/settings`
- `{NNN}` — spec directory number, e.g., `014`
- `{FEATURE_NAME}` — e.g., `settings-package`
- `{PACKAGE_DIR}` — e.g., `packages/settings`
- `{SPEC_MODE}` — one of: `full` (from scratch) | `completion` (missing artifacts only)
- `{EXISTING_ARTIFACTS}` — list of already-existing artifacts, or "None" if full mode
- `{MISSING_ARTIFACTS}` — list of artifacts to produce in this session
- `{PACKAGE_DESCRIPTION}` — 2-3 sentences: what the package does and why it exists
- `{FUNCTIONAL_REQUIREMENTS}` — numbered list of what the package must do
- `{TECH_STACK_DECISIONS}` — bullet list of tech choices for `/speckit.plan` (e.g., "Prisma 7.x for ORM", "BullMQ 5.x for queues")
- `{DEPENDENCIES}` — packages this depends on or is depended on by
- `{REFERENCE_SPECS}` — existing spec directories to study for conventions, e.g., `specs/007-i18n-core-package/`

---

## Template Start

---

# {PACKAGE_NAME} — SpecKit Specification Phase

## References

Read and comply with these before any action:

- Constitution: `.specify/memory/constitution.md` — especially Rules LXXIX–LXXXIX (Methodology)
- Workflow: `docs/developer/workflow-guide.md` — "مرحلة المواصفات (SpecKit)" section

## What This Package Does

{PACKAGE_DESCRIPTION}

**Functional requirements:**
{FUNCTIONAL_REQUIREMENTS}

**Key dependencies:**
{DEPENDENCIES}

## Specification Mode

**Mode:** {SPEC_MODE}

**Existing artifacts:** {EXISTING_ARTIFACTS}

**Artifacts to produce:** {MISSING_ARTIFACTS}

## Preparation

1. Study the structure and conventions of an existing spec directory (e.g., `{REFERENCE_SPECS}`) to follow established patterns for artifact format, depth, and style.

2. Set the SpecKit feature environment variable:

   ```powershell
   $env:SPECIFY_FEATURE = "{NNN}-{FEATURE_NAME}"
   ```

   This ensures all SpecKit commands write artifacts to the correct directory: `specs/{NNN}-{FEATURE_NAME}/`.

## Execute

Run all applicable SpecKit phases **in sequence within this session**. Do not stop between phases — complete the full pipeline.

### Phase 1: Specify (skip if `spec.md` already exists)

```
/speckit.specify {PACKAGE_DESCRIPTION}
```

**Rules:**

- Describe WHAT and WHY only. Do NOT mention any technology, framework, or library.
- Include all functional requirements listed above.
- The output `spec.md` must have zero `[NEEDS CLARIFICATION]` markers when this phase completes.

### Phase 2: Clarify (skip if `spec.md` already exists)

```
/speckit.clarify
```

**Rules:**

- Answer ALL questions the AI asks. Do not skip this phase.
- If you don't know the answer to a question, say so — the AI will suggest options.
- This phase catches edge cases and ambiguities. It is mandatory per workflow-guide.md.
- When this phase completes, verify `spec.md` contains zero `[NEEDS CLARIFICATION]` markers.

### Phase 3: Plan (skip if `plan.md` + `data-model.md` + `research.md` already exist)

```
/speckit.plan {TECH_STACK_DECISIONS}
```

**Rules:**

- THIS is where you mention the tech stack. Not before.
- The output must include: `plan.md`, `data-model.md`, and `research.md`.
- Verify all three files were created in `specs/{NNN}-{FEATURE_NAME}/`.

### Phase 4: Tasks (skip if `tasks.md` already exists)

```
/speckit.tasks
```

**Rules:**

- The output `tasks.md` is the contract that will be handed to Superpowers for execution.
- Tasks must be ordered and actionable.
- Verify the file was created in `specs/{NNN}-{FEATURE_NAME}/`.

### Phase 5: Analyze (ALWAYS run — never skip)

```
/speckit.analyze
```

**Rules:**

- This checks consistency between spec ↔ plan ↔ tasks ↔ data-model.
- It MUST pass with zero critical issues.
- If critical issues are found: fix them in the affected artifacts, then re-run `/speckit.analyze` until it passes cleanly.

### Phase 6: Validate (ALWAYS run — never skip)

```bash
pnpm spec:validate {NNN}-{FEATURE_NAME}
```

**Rules:**

- Exit 0: passed — continue to report.
- Exit 1: HIGH/MEDIUM issues — fix or document justification for deferral.
- Exit 2: CRITICAL issues — BLOCKED. Fix all critical issues before proceeding.

## Constraints

- Do NOT write any implementation code. This is specification only.
- Do NOT create git branches or worktrees. The spec phase happens on the current branch.
- Do NOT skip `/speckit.clarify`. It is mandatory per project methodology.
- Do NOT mention technology in `/speckit.specify`. Tech decisions belong in `/speckit.plan` only.
- If any SpecKit command fails or produces unexpected output: STOP. Report the exact error and wait.
- If `/speckit.analyze` reports critical issues that you cannot resolve: STOP. Report the issues and wait.

## Pre-Report Checklist

Before writing the Final Report, verify each item. If any item fails, fix it before reporting.

- [ ] All required artifacts exist in `specs/{NNN}-{FEATURE_NAME}/`
- [ ] `spec.md` contains zero `[NEEDS CLARIFICATION]` markers
- [ ] `plan.md` includes tech stack decisions and architecture approach
- [ ] `data-model.md` defines all entities, interfaces, and events
- [ ] `research.md` documents technical decisions with rationale
- [ ] `tasks.md` contains ordered, actionable tasks
- [ ] `/speckit.analyze` passed with zero critical issues (paste output)
- [ ] `pnpm spec:validate` passed (paste output)

## Final Report

When all phases complete, report:

- Specification mode used (full / completion)
- Artifacts produced (list each file path)
- Artifacts skipped (list with reason)
- `/speckit.analyze` result (paste actual output)
- `pnpm spec:validate` result (paste actual output)
- Any issues encountered and how they were resolved
- Any open questions or decisions that need Project Manager input

---

## Template End

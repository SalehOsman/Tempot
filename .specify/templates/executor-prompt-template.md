# Executor Prompt Template — Phase B (Full Execution)

> **Authority:** This template has the same authority as `roles.md`.
> Every Phase B prompt written for the Executor MUST follow this structure.
> **Version:** 1.1.0

---

## Usage Instructions

Replace all `{PLACEHOLDERS}` with actual values.
Remove this "Usage Instructions" section from the final prompt.

**Placeholders:**

- `{PACKAGE_NAME}` — e.g., `@tempot/i18n-core`
- `{NNN}` — spec directory number, e.g., `007`
- `{FEATURE_NAME}` — e.g., `i18n-core-package`
- `{FEATURE}` — short name for files, e.g., `i18n-core`
- `{PACKAGE_DIR}` — e.g., `packages/i18n-core`
- `{REFERENCE_PACKAGE}` — existing package to study, e.g., `packages/event-bus`
- `{PACKAGE_DESCRIPTION}` — 2-3 sentences: what and why
- `{COMPONENT_LIST}` — bullet list of core components
- `{DEPENDENCIES}` — packages this depends on or is depended on by
- `{DESIGN_CONCERNS}` — numbered list of specific design questions

---

## Template Start

---

# {PACKAGE_NAME} — Phase B Execution

## References

Read and comply with these before any action:

- Constitution: `.specify/memory/constitution.md`
- Package Checklist: `docs/developer/package-creation-checklist.md`
- Workflow: `docs/developer/workflow-guide.md`

## Toolchain

This project uses two mandatory toolchains. You MUST use their
commands and skills as specified below.

### SpecKit (Specification Artifacts)

The following artifacts were produced by SpecKit and are your
source of truth for WHAT to build:

| Artifact | Produced by                             | Path                                  |
| -------- | --------------------------------------- | ------------------------------------- |
| Spec     | `/speckit.specify` + `/speckit.clarify` | `specs/{NNN}-{FEATURE_NAME}/spec.md`  |
| Plan     | `/speckit.plan`                         | `specs/{NNN}-{FEATURE_NAME}/plan.md`  |
| Tasks    | `/speckit.tasks`                        | `specs/{NNN}-{FEATURE_NAME}/tasks.md` |
| Analyze  | `/speckit.analyze`                      | Passed with 0 critical issues         |

Read all artifacts before starting.

### Superpowers (Execution Skills)

Use these skills for HOW to build. Activate each via the Skill
tool before starting its phase.

| Skill                            | Purpose                                               | When to use                                                                                                            |
| -------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `brainstorming`                  | Socratic design deepening                             | Phase 1: reading spec + plan, asking design questions                                                                  |
| `using-git-worktrees`            | Isolated feature branch                               | Phase 2: before any code                                                                                               |
| `writing-plans`                  | Granular 2-5 min task breakdown                       | Phase 3: converting tasks.md to executable steps                                                                       |
| `subagent-driven-development`    | Sequential task execution with TDD + two-stage review | Phase 4: main execution — dispatches one implementer subagent per task, then spec-reviewer, then code-quality-reviewer |
| `dispatching-parallel-agents`    | Concurrent independent work                           | Phase 4 ONLY IF multiple tasks are fully independent with no shared state                                              |
| `executing-plans`                | Inline execution without subagents                    | Phase 4 alternative: use ONLY on platforms that do not support subagents                                               |
| `test-driven-development`        | RED → GREEN → REFACTOR cycle                          | During every task in Phase 4 — enforced per Constitution Rule XXXIV                                                    |
| `requesting-code-review`         | Review against spec + constitution                    | Phase 5: after all tasks complete                                                                                      |
| `receiving-code-review`          | Process review feedback                               | Phase 5: if reviewer finds issues, use this to address them systematically                                             |
| `verification-before-completion` | Evidence-based final check                            | Phase 6: run tests + build, paste actual output                                                                        |
| `finishing-a-development-branch` | Merge / PR / cleanup options                          | Phase 7: final integration                                                                                             |
| `systematic-debugging`           | 4-phase root cause analysis                           | Any phase: if an unexpected error or test failure occurs                                                               |

**Subagent selection rules (subagent-driven-development):**

- One implementer subagent per task — NEVER parallel implementers.
- After each implementer: dispatch spec-reviewer subagent, then code-quality-reviewer subagent.
- Use `dispatching-parallel-agents` ONLY for tasks that are fully independent (no shared files, no sequential dependency).

## What This Package Does

{PACKAGE_DESCRIPTION}

**Core components:**
{COMPONENT_LIST}

**Key dependencies:**
{DEPENDENCIES}

**Design concerns to address during brainstorming:**
{DESIGN_CONCERNS}

## Execute

Do not improvise the workflow — activate the required skill and
follow its instructions exactly.

1. **Activate `brainstorming`** — Read spec.md + plan.md. Deepen the technical design via Socratic questions. Address the design concerns listed above. Save design doc to `docs/superpowers/specs/YYYY-MM-DD-{FEATURE}-design.md`. No code in this phase.

2. **Activate `using-git-worktrees`** — Create isolated branch: `feature/{NNN}-{FEATURE_NAME}`.

3. **Activate `writing-plans`** — Convert tasks.md + design doc into granular 2-5 min executable tasks. Each task follows TDD cycle (use `test-driven-development` skill as reference). Save to `docs/superpowers/plans/YYYY-MM-DD-{FEATURE}.md`. Dispatch plan-document-reviewer subagent before proceeding.

4. **Activate `subagent-driven-development`** — Before writing any code, study the structure and patterns of an existing package (e.g., `{REFERENCE_PACKAGE}`) to follow established conventions. Run package-creation-checklist before first line of code. Execute tasks sequentially. Per task: implementer subagent → spec-reviewer → code-quality-reviewer. TDD is mandatory (`test-driven-development` skill). If an unexpected error occurs during any task, activate `systematic-debugging` before proceeding.

5. **Activate `requesting-code-review`** — Review all changes against spec.md + constitution. Zero CRITICAL issues to proceed. If issues are found, activate `receiving-code-review` to address them.

6. **Activate `verification-before-completion`** — Run full test suite and build. Paste actual output as evidence. No claims without evidence.

7. **Activate `finishing-a-development-branch`** — Merge to main. Update `docs/ROADMAP.md`.

## Constraints

- If any gate fails or you encounter ambiguity not covered by the spec: STOP. Do NOT attempt to fix, workaround, or decide independently. Report the exact failure and wait.
- Do ONLY what spec.md requires. No bonus features, no refactoring of unrelated code, no "while I'm here" changes.
- Every public API returns `Result<T, AppError>` via neverthrow.
- All code, comments, variables in English.

## Final Report

When all phases complete, report:

- Design doc path
- Branch name
- Tasks executed (count)
- Test results with output evidence
- Code review summary (issues by severity)
- Merge status

---

## Template End

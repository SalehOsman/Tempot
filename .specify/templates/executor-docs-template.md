# Executor Prompt Template — Documentation-Only Task

> **Authority:** This template has the same authority as `roles.md`.
> Every documentation-only prompt written for the Executor MUST follow this structure.
> **Version:** 1.0.0

---

## Usage Instructions

Replace all `{PLACEHOLDERS}` with actual values.
Remove this "Usage Instructions" section from the final prompt.

**Placeholders:**

- `{TASK_TITLE}` — concise title, e.g., "Methodology Documentation Improvement"
- `{TASK_DESCRIPTION}` — 2-3 sentences: what this task accomplishes and why
- `{OPERATIONS_TABLE}` — markdown table listing every file operation (CREATE/MODIFY/DELETE) with file path and description
- `{OPERATION_DETAILS}` — for each operation: the exact changes to make, with enough detail that the executor needs no interpretation. For CREATE operations, include the complete file content. For MODIFY operations, include the exact lines to find and replace. For DELETE operations, state the file path.
- `{VERIFICATION_STEPS}` — numbered list of commands or checks to verify correctness after all operations

---

## Template Start

---

# Documentation Task: {TASK_TITLE}

## References

Read and comply with these before any action:

- Constitution: `.specify/memory/constitution.md`

## What This Task Does

{TASK_DESCRIPTION}

## Operations Summary

{OPERATIONS_TABLE}

## Operations Detail

{OPERATION_DETAILS}

## Execute

1. Read ALL operation details before starting any changes.
2. Execute operations in the order listed.
3. For CREATE operations: create the file with the exact content specified.
4. For MODIFY operations: find the exact text specified and replace it. Verify the replacement was applied correctly.
5. For DELETE operations: delete the file. Verify it no longer exists.
6. After all operations: run the verification steps.

## Constraints

- This is a documentation-only task. Do NOT modify any source code (`.ts`, `.js`, `.json` files in `src/` or `packages/`).
- Do NOT create git branches or worktrees. Documentation changes happen on the current branch.
- Apply changes EXACTLY as specified. Do not rephrase, reformat, or "improve" the content.
- If any operation fails or the specified text to replace cannot be found: STOP. Report the exact error and wait.

## Verification

{VERIFICATION_STEPS}

## Pre-Report Checklist

Before writing the Final Report, verify each item. If any item fails, fix it before reporting.

- [ ] Every CREATE operation produced a file at the correct path with correct content
- [ ] Every MODIFY operation changed only the specified text — no unintended changes
- [ ] Every DELETE operation removed the file
- [ ] All verification steps passed

## Final Report

When all operations complete, report:

- Operations completed (count: created / modified / deleted)
- Each file changed with a one-line summary of what changed
- Verification results (paste output of each verification step)
- Any issues encountered and how they were resolved

---

## Template End

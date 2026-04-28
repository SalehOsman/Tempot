# Tempot Agent Skills Guide

**Status**: Draft execution artifact for spec #026
**Purpose**: Explain the project-specific `.agents/skills` surface for human maintainers.

## Location

Tempot agent skills live in:

```text
.agents/skills/
```

They belong there because they are executable agent instructions, not ordinary human documentation. Human-facing explanations live in `docs/archive/developer/`.

## Project Skills

| Skill | Purpose |
| --- | --- |
| `tempot-project-context` | Establish project authority, role, branch, and source documents before work |
| `tempot-methodology-workflow` | Apply the SpecKit + Superpowers process |
| `tempot-code-review` | Review code, docs, specs, CI, and methodology drift |
| `tempot-module-development` | Create or modify Tempot business modules |
| `tempot-ci-quality-gates` | Run and interpret local/CI validation gates |
| `tempot-spec-kit-toolchain` | Use Spec Kit correctly inside Tempot |
| `tempot-superpowers-toolchain` | Use Superpowers correctly after SpecKit handoff |

## Maintenance Rules

- Keep each skill concise and operational.
- Put long human explanations in docs, not skills.
- Regenerate `agents/openai.yaml` when skill metadata changes.
- Validate changed skills with `quick_validate.py`.
- Update this guide when adding or removing a Tempot skill.

## When To Add a Skill

Add a skill only when agents repeatedly need procedural knowledge that is specific to Tempot, such as governance, module boundaries, CI gates, or toolchain workflow.

Do not add a skill for ordinary project documentation, one-time notes, or code comments.

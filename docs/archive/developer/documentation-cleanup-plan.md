# Documentation Cleanup Plan

**Status**: Draft execution artifact for spec #026
**Purpose**: Keep Tempot documentation aligned with the actual repository.

## Current Cleanup Targets

| Target | Issue | Action |
| --- | --- | --- |
| `docs/archive/tempot_v11_final.md` | Older package/module descriptions lag newer components | Update during a dedicated architecture doc sync |
| `docs/archive/developer/workflow-guide.md` | Console shows mojibake in some environments; content is Arabic and old date | Review encoding and update methodology references |
| `docs/archive/ROADMAP.md` | Must remain single source after each merge | Keep updated after every spec #026 slice |
| `docs/archive/developer/package-creation-checklist.md` | Package checklist should align with modules too | Cross-link new module checklist |
| `.agents/skills/` | Operational skills exist without human-facing guide | Add `agent-skills-guide.md` |
| Spec directories | Completed specs should remain reconcilable | Keep `pnpm spec:validate` blocking |

## Cleanup Rules

- Do not rewrite old docs for style only.
- Fix drift that affects decisions, onboarding, or validation.
- Keep archive paths stable unless a migration plan exists.
- Prefer focused docs over one large document.
- Link to source-of-truth artifacts instead of duplicating long sections.

## Proposed Order

1. Add missing guide for agent skills.
2. Align package and module checklists.
3. Update architecture spec component list in a dedicated doc sync.
4. Review workflow guide encoding and references.
5. Add CI checks for documentation drift where deterministic.

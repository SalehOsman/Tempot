# Implementation Plan: Module Flow Governance

**Branch**: `codex/052-module-flow-governance` | **Date**: 2026-05-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/052-module-flow-governance/spec.md`

## Summary

Create a governed module-flow system that prevents repeated callback behavior,
missing handlers, undocumented custom capability decisions, and ad hoc module
construction. The first slice will document the standard, define structured
flow metadata and readiness findings, extend module readiness checks, and plan a
grounded module-building assistant that reinforces Tempot methodology.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode  
**Primary Dependencies**: Existing Tempot CLI, module manifest contracts, module catalog, module doctor, package capability reuse standard, AI grounding contracts  
**Storage**: Repository files and SpecKit artifacts; no database migration in the first governance slice  
**Testing**: Vitest 4.1.0, targeted CLI/unit tests, seeded fixture modules, SpecKit validation, module checklist gates  
**Target Platform**: Node.js 22.12+ local developer tooling and Telegram module review workflow  
**Project Type**: TypeScript monorepo with apps, packages, modules, specs, and developer tooling  
**Performance Goals**: Module readiness checks should remain fast enough for local use and CI preflight on one selected module  
**Constraints**: No production module rewrite in the first slice; no bypass of SpecKit, TDD, review, i18n, or package reuse rules; no SaaS-only behavior  
**Scale/Scope**: One pilot module first, then incremental rollout across active modules after Project Manager approval

**Pilot Module**: `help-center`, selected because it is a small Telegram-facing
module with command and callback entry points that can validate flow maps,
leaf-surface navigation, module doctor reporting, and bot-level runtime tests
without broad module rewrites.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Rule I / TypeScript strict mode**: Any tooling or package changes must use strict TypeScript with no `any`, suppression comments, or lint disables.
- **Rule VII / Fix at source**: Existing module flow defects must be corrected in the owning module or shared tooling boundary, not masked by wrappers.
- **Rule IX / Single responsibility**: This feature is governance/tooling plus pilot adoption, not a broad module rewrite.
- **Rule XXI / Result pattern**: Any new fallible public tooling APIs must return project-standard result types.
- **Rule XXXIV / TDD mandatory**: Readiness checks and assistant contracts require failing tests before implementation.
- **Rule XXXIX / i18n-only**: User-facing unavailable responses and labels remain in locale files.
- **Rule XLIX / No skip rule**: Implementation starts only after SpecKit handoff gates pass.
- **Rule L / Code-documentation parity**: Module catalog, checklist, workflow guidance, SpecKit artifacts, and roadmap must stay synchronized.
- **Rule LXXIX-LXXXVI / SpecKit plus Superpowers**: This feature must complete SpecKit artifacts before Superpowers execution.
- **Rule LXXXV / Git workflow**: Work remains on an isolated branch.

Initial gate result: PASS. No constitution exception is required for planning.

## Project Structure

### Documentation (this feature)

```text
specs/052-module-flow-governance/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- module-flow-governance-contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
docs/developer/
|-- module-development-catalog.md
|-- module-capability-reuse-standard.md
|-- new-module-checklist.md
`-- workflow-guide.md

scripts/tempot/
`-- module doctor and module tooling implementation

packages/module-registry/
`-- module manifest and registry contracts

packages/ai-core/
`-- grounded assistant contracts and evaluation support

modules/{pilot-module}/
`-- pilot flow metadata, callback tests, locales, and README updates
```

**Structure Decision**: Keep governance in SpecKit and developer docs, executable readiness in the Tempot CLI/module tooling, durable module metadata in module manifests, and AI guidance as a grounded developer-assistant capability. Pilot module changes are incremental and scoped.

## Phase 0 Research Output

See [research.md](./research.md).

## Phase 1 Design Output

See [data-model.md](./data-model.md), [quickstart.md](./quickstart.md), and [module-flow-governance-contract.md](./contracts/module-flow-governance-contract.md).

## Post-Design Constitution Check

- The plan preserves module boundaries and package reuse rules.
- No active module is rebuilt wholesale.
- The assistant is explicitly grounded and does not bypass methodology gates.
- TDD is required for readiness checks, seeded defects, assistant evaluation, and pilot hardening.

Post-design gate result: PASS.

## Complexity Tracking

No constitution violations are introduced by this plan.

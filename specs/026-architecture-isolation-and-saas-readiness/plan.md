# Implementation Plan: Architecture Isolation and SaaS Readiness

**Branch**: `026-architecture-isolation-and-saas-readiness` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/026-architecture-isolation-and-saas-readiness/spec.md`

## Summary

Document and prepare the next strategic project track: harden architecture boundaries, preserve Tempot Core as the current implementation priority, define Tempot Cloud as a future SaaS layer, and record Telegram Managed Bots as a positive future opportunity to integrate after boundary hardening.

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 22.12+ for project validation
**Primary Dependencies**: Existing monorepo tooling, ESLint boundaries, Vitest, SpecKit, Superpowers, GitHub Actions, future Tempot CLI/tooling surfaces
**Storage**: Documentation artifacts first; no production database changes in the initial slice
**Testing**: `pnpm spec:validate`, `pnpm lint`, future boundary validation checks, CI status checks
**Target Platform**: Tempot monorepo and GitHub Actions
**Project Type**: Documentation, architecture governance, and future enforcement planning
**Performance Goals**: Boundary validation should complete quickly enough for pull-request use; final threshold to be defined during enforcement implementation
**Constraints**: No production code implementation before the owner approves the execution plan; no direct module-to-module dependencies; no deep package imports; preserve current bot framework progress
**Scale/Scope**: 2 apps, 15+ packages, active modules, deferred packages, future SaaS and managed-bot tracks, developer tooling, security baseline, and observability planning

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Rule Area | Status | Notes |
| --- | --- | --- |
| Spec-driven development | PASS | This feature starts with SpecKit artifacts before implementation. |
| Clean Architecture | PASS | The feature exists to strengthen apps/packages/modules boundaries. |
| Event-driven communication | PASS | Future module interaction remains event-only. |
| Documentation-first | PASS | The first slice is documentation, analysis, and governance. |
| ADR timing | PASS | Future architectural decisions from this plan will require ADRs before implementation. |
| Blast radius | PASS | Shared-code changes are explicitly deferred until impact analysis exists. |
| Git workflow | PASS | Work is performed on a feature branch. |
| Zero-defect gate | PASS | Validation tasks are required before merge. |

## Project Structure

### Documentation (this feature)

```text
specs/026-architecture-isolation-and-saas-readiness/
â”œâ”€â”€ spec.md
â”œâ”€â”€ plan.md
â”œâ”€â”€ research.md
â”œâ”€â”€ data-model.md
â”œâ”€â”€ quickstart.md
â”œâ”€â”€ contracts/
â”‚   â”œâ”€â”€ boundary-contract.md
â”‚   â”œâ”€â”€ saas-readiness-contract.md
â”‚   â””â”€â”€ telegram-managed-bots-contract.md
â”œâ”€â”€ checklists/
â”‚   â””â”€â”€ requirements.md
â””â”€â”€ tasks.md
```

### Source Code (repository root)

```text
docs/archive/
â”œâ”€â”€ ROADMAP.md
â”œâ”€â”€ developer/
â”‚   â””â”€â”€ workflow-guide.md
â””â”€â”€ superpowers/
    â””â”€â”€ plans/
        â””â”€â”€ 2026-04-28-architecture-isolation-and-saas-readiness.md

.github/workflows/
â””â”€â”€ ci.yml

eslint.config.js
package.json
```

**Structure Decision**: The first approved slice is documentation and governance. Production source changes are intentionally limited to future enforcement work after boundary inventory and owner approval.

Additional documentation surfaces planned by this feature:

- `docs/archive/architecture/review-findings-remediation.md`
- `docs/archive/architecture/template-marketplace.md`
- `docs/archive/architecture/observability-dashboard.md`
- `docs/archive/developer/module-generator-plan.md`
- `docs/archive/developer/local-developer-doctor.md`
- `docs/archive/developer/quick-path-first-module.md`
- `docs/archive/security/security-baseline.md`
- `specs/026-architecture-isolation-and-saas-readiness/checklists/dx-security-review-findings.md`

## Phase 0: Research

Research outputs are captured in [research.md](./research.md).

Resolved decisions:

- Continue Tempot Core before building Tempot Cloud.
- Start with architecture isolation hardening.
- Treat Telegram Managed Bots as a positive future opportunity.
- Keep Managed Bots behind a dedicated future boundary.
- Build template usability improvements after boundary rules.
- Treat governance and CI as part of architecture quality.
- Make DX proposals explicit: official CLI, governed module generator, developer doctor, internal template marketplace, and 15-minute quick path.
- Make security and observability proposals explicit: blocking audit policy, secret scanning, dependency review, token rotation guidance, and observability dashboard scope.
- Track known review findings as first-class remediation items.

## Phase 1: Design and Contracts

Design outputs:

- [data-model.md](./data-model.md)
- [contracts/boundary-contract.md](./contracts/boundary-contract.md)
- [contracts/saas-readiness-contract.md](./contracts/saas-readiness-contract.md)
- [contracts/telegram-managed-bots-contract.md](./contracts/telegram-managed-bots-contract.md)
- [contracts/dx-security-contract.md](./contracts/dx-security-contract.md)
- [quickstart.md](./quickstart.md)
- [checklists/dx-security-review-findings.md](./checklists/dx-security-review-findings.md)

## Phase 2: Task Planning

Task outputs:

- [tasks.md](./tasks.md)
- [Superpowers implementation plan](../../docs/archive/superpowers/plans/2026-04-28-architecture-isolation-and-saas-readiness.md)

## Post-Design Constitution Check

| Rule Area | Status | Notes |
| --- | --- | --- |
| Handoff artifacts | PASS | Spec, plan, research, data model, contracts, quickstart, checklist, and tasks are present. |
| No production code before tests | PASS | No production source implementation is included in this planning slice. |
| Documentation parity | PASS | Roadmap update is included as a planned execution task. |
| Telegram platform changes | PASS | Managed Bots are documented as a future track, not an immediate bypass. |
| Review findings | PASS | Known review findings are represented as remediation tasks before implementation. |
| DX and security baselines | PASS | Approved DX/security proposals are represented in tasks and checklist coverage. |

## Complexity Tracking

No constitution violations are introduced by this plan.

# Implementation Plan: Quality Gates Hardening

**Branch**: `codex/056-quality-gates-hardening` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

## Summary

Make root and CI quality results complete and reproducible by adding application
test projects, fixing the currently hidden bot-server failures, enforcing
component coverage policy, repairing root documentation freshness, pinning the
toolchain, and extending conformance checks for constitutional source and
documentation rules.

## Technical Context

**Language/Version**: TypeScript 5.9.3; Node.js minimum 22.12 plus current supported line
**Primary Dependencies**: Vitest 4.1.0, matching `@vitest/coverage-v8`, pnpm/Corepack, ESLint, existing CI scripts, Astro/Starlight docs tooling
**Storage**: Repository files and CI artifacts only
**Testing**: Meta-tests/fixtures for gate behavior plus full project gates
**Target Platform**: GitHub Actions and local PowerShell/Linux shells
**Project Type**: pnpm TypeScript monorepo
**Performance Goals**: Fast unit lane remains practical; complete required CI provides deterministic project accounting
**Constraints**: No omitted app projects; no version drift; no weakening existing lint/security rules
**Scale/Scope**: 32 workspace projects, active docs, root scripts, and CI workflows

## Constitution Check

- **Rules I-II**: Strict TypeScript and code limits remain enforced.
- **Rules XXXIV-XXXVIII**: TDD, pyramid, thresholds, naming, and zero-defect gates apply.
- **Rules XXXIX-XL**: i18n and English developer-facing source rules require automated enforcement.
- **Rules XLVIII-XLIX**: Supported tooling and no-skip methodology remain documented.
- **Rules L/LIX-LXIII**: Documentation parity, READMEs, and English docs are required.
- **Rules LXXIX-LXXXVI**: SpecKit and reconciliation gates remain mandatory.
- **Rule LXXXIX**: Roadmap reflects gate state.

Initial gate result: PASS.

## Project Structure

```text
specs/056-quality-gates-hardening/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- quality-gate-contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md

vitest.config.ts
vitest.config.base.ts
package.json
apps/*/vitest.config.ts
apps/docs/scripts/
scripts/ci/
.github/workflows/
docs/
modules/*/README.md
```

**Structure Decision**: Root scripts define canonical developer commands,
Vitest projects enumerate every governed source surface, CI invokes only
canonical commands, and specialized scripts emit structured actionable
findings.

## Delivery Phases

1. Repair hidden bot-server tests and enumerate apps.
2. Enforce coverage policy with version alignment.
3. Repair and require documentation quality.
4. Pin and matrix-test toolchain versions.
5. Extend constitutional conformance checks.

## TDD Strategy

Gate changes use seeded fixtures or temporary test projects:

- failing app test must fail root gate,
- below-threshold component must fail coverage,
- stale document must fail freshness,
- prohibited source pattern must fail conformance.

Remove or isolate seeded failures after proving the gate.

## Verification Strategy

- Root unit, integration, app, docs, and coverage commands.
- Clean checkout/Corepack bootstrap.
- Node runtime matrix.
- Docs build/freshness/frontmatter.
- Lint, boundary, module checklist, CMS, audit, and spec validation.

## Post-Design Constitution Check

The plan strengthens existing mandatory gates and does not lower any
constitutional threshold.

Post-design gate result: PASS.

## Complexity Tracking

No exception is required.

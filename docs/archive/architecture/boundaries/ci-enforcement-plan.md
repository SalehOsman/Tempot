# Boundary and Methodology CI Enforcement Plan

**Status**: Implemented execution artifact for spec #026
**Purpose**: Define how CI should prevent architecture and methodology drift before merge.

## Current Gates

| Gate | Status | Purpose |
| --- | --- | --- |
| `pnpm spec:validate` | Blocking | Spec artifact and reconciliation validation |
| `pnpm cms:check` | Blocking | i18n parity and hardcoded user-facing text guard |
| `pnpm boundary:audit` | Blocking | Tracked import boundary audit for modules, module package names, packages, apps, and deep package imports |
| `pnpm module:checklist` | Blocking | Module package metadata and local governance file validation |
| `pnpm tempot init` | Blocking | Internal CLI initialization smoke check |
| `pnpm tempot doctor --quick` | Blocking | Internal CLI local readiness smoke check |
| `git diff --check` | Blocking | Whitespace and clean diff guard |
| `pnpm lint` | Blocking | TypeScript, style, and boundary-related lint rules |
| `pnpm test:unit` | Blocking | Unit behavior |
| `pnpm test:integration` | Blocking | Database, Redis, and integration behavior |
| `pnpm audit --audit-level=high` | Blocking | Dependency vulnerability gate |

## Proposed New Gates

| Gate | Phase | Failure mode | Notes |
| --- | --- | --- | --- |
| Tracked import audit extensions | Future | New package-to-package edges and JSON output | Base hard-fail rules are blocking now |
| Package checklist validator extensions | Future | Full package checklist for active packages | Module metadata baseline is blocking now |
| Docker build validation | Report-only initially | Deployment drift | Run after dependency and docs stack stabilize |
| Spec-to-roadmap drift check | Report-only initially | Active feature not reflected in roadmap | Can become blocking after false positives are removed |
| Agent skill validation | Blocking when `.agents/skills/**` changes | Invalid `SKILL.md` or `openai.yaml` | Use `quick_validate.py` |

## Blocking Security Audit Policy

The security audit must remain blocking for high and critical vulnerabilities.

Exceptions require:

- A dated security exception document.
- Package name and advisory identifier.
- Business reason for accepting the risk.
- Expiration date.
- Owner and remediation path.

No generic `continue-on-error: true` is allowed for high or critical audit failures.

## Import Audit Rules

Hard-fail candidates:

- `modules/*` importing from `modules/*` outside its own directory.
- `packages/*` importing from `apps/*`.
- `packages/*` importing from `modules/*`.
- `@tempot/{package}/src/*` or equivalent deep imports.

Report-only candidates:

- New package-to-package edges not yet classified.
- Docs app ingestion imports.
- Test-only imports that cross package boundaries.

## Rollout

1. Land documentation and governance baseline. Done.
2. Add an import audit script with fixtures. Done.
3. Run the script in CI as a blocking methodology gate. Done.
4. Add module package checklist validation. Done.
5. Add JSON output and package-wide checklist validation after false-positive risks are understood.
6. Add Docker build validation after deployment packaging stabilizes.

## Required Output

Each new CI gate should print:

- Checked file count.
- Exclusion rules.
- Violation count by severity.
- Suggested owner document.
- Exit code behavior.

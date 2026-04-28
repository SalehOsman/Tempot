# Boundary and Methodology CI Enforcement Plan

**Status**: Draft execution artifact for spec #026
**Purpose**: Define how CI should prevent architecture and methodology drift before merge.

## Current Gates

| Gate | Status | Purpose |
| --- | --- | --- |
| `pnpm spec:validate` | Blocking | Spec artifact and reconciliation validation |
| `pnpm cms:check` | Blocking | i18n parity and hardcoded user-facing text guard |
| `git diff --check` | Blocking | Whitespace and clean diff guard |
| `pnpm lint` | Blocking | TypeScript, style, and boundary-related lint rules |
| `pnpm test:unit` | Blocking | Unit behavior |
| `pnpm test:integration` | Blocking | Database, Redis, and integration behavior |
| `pnpm audit --audit-level=high` | Blocking | Dependency vulnerability gate |

## Proposed New Gates

| Gate | Phase | Failure mode | Notes |
| --- | --- | --- | --- |
| Tracked import audit | Report-only, then blocking | Module-to-module, package-to-app, deep package imports | Must use `git ls-files` |
| Package checklist validator | Report-only, then blocking | Missing package/module metadata | Must exclude Rule XC deferred packages |
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

1. Land documentation and governance baseline.
2. Add an import audit script with fixtures.
3. Run the script in CI as non-blocking report output.
4. Fix or document findings.
5. Promote stable violations to blocking.
6. Add package checklist validation after module generator rules are finalized.

## Required Output

Each new CI gate should print:

- Checked file count.
- Exclusion rules.
- Violation count by severity.
- Suggested owner document.
- Exit code behavior.

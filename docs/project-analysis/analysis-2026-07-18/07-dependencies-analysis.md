# 07 - Dependencies Analysis

## Locked Stack Evidence

| Dependency | Required/current evidence |
|---|---|
| TypeScript | `typescript` is pinned to `5.9.3`. |
| Vitest | `vitest` is pinned to `4.1.0`. |
| neverthrow | `neverthrow` is pinned to `8.2.0`. |
| Package manager | `package.json:4` declares `pnpm@10.33.3`. |

## Dependency Findings

| ID | Finding | Severity | Evidence | Impact | Fix |
|---|---|---|---|---|---|
| D-001 | Root `package.json#pnpm` policy is ignored. | High | `package.json:91-104`; pnpm warning says `pnpm.overrides` and `pnpm.auditConfig` are ignored. | Dependency override and audit assumptions are unreliable. | Move policy to supported workspace settings. |
| D-002 | Workspace overrides and package overrides are not visibly equivalent. | Medium | `pnpm-workspace.yaml:15-33` includes some overrides; `package.json:91-104` includes additional entries. | Some intended mitigations may be missing. | Compare and consolidate all intended overrides. |
| D-003 | Audit passes high threshold but still reports lower vulnerabilities. | Low/Medium | `pnpm audit --audit-level=high` found 1 low and 1 moderate vulnerability. | Not production-blocking by threshold, but should be tracked. | Review moderate advisory and decide remediation or accepted risk. |
| D-004 | Docs stack emits build deprecation warnings. | Medium | Prior build warning for Astro markdown plugin config. | Future Astro upgrade risk. | Update docs app config to current Astro API. |

## Dependency Strengths

| Strength | Evidence |
|---|---|
| Critical versions are pinned. | TypeScript, Vitest, neverthrow match constitutional pinned versions. |
| Supply-chain image controls exist. | Docker workflow includes Trivy and Cosign. |
| Workspace dependencies are explicit. | `apps/docs/package.json` and package manifests use workspace packages. |

## Recommended Actions

| Priority | Action |
|---|---|
| P1 | Move pnpm overrides/audit policy to supported workspace configuration. |
| P1 | Add a CI check that fails if unsupported root `pnpm` field returns. |
| P2 | Track low/moderate audit findings with expiry and owner. |
| P2 | Clean docs build deprecation warnings. |


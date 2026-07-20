# 06 - Dependencies Analysis

## Package Manager

The repository declares:

```json
"packageManager": "pnpm@10.33.3"
```

Current shell observations:

| Command | Result |
| --- | --- |
| `node --version` | `v24.11.1` |
| `corepack pnpm --version` | `10.33.3` |
| `pnpm --version` | `11.7.0` |

The project supports Node.js `>=22.12.0`. Node 24 is valid, but release verification should also continue relying on CI's Node 22.12 coverage because it is the constitutional minimum.

## Dependency Control

The root `package.json` includes exact pins for constitution-critical dependencies:

- `typescript`: `5.9.3`
- `vitest`: `4.1.0`
- `neverthrow`: `8.2.0` through package-level dependencies where applicable.

Security overrides are present for known transitive paths including Hono node server, `qs`, `markdown-it`, `undici`, `vite`, `tmp`, `devalue`, and related packages.

## Current Risk: pnpm 11 Drift

Direct `pnpm` resolves to 11.7.0 and emits a warning that the `pnpm` field is ignored. This matters because the project still carries `pnpm.overrides` and `pnpm.auditConfig` in `package.json`.

Recommended release rule:

```powershell
corepack pnpm <command>
```

or fix PATH so direct `pnpm` resolves to the pinned Corepack-managed version.

## Audit State

Recent local verification reported:

- `pnpm audit --audit-level=high`: passed.
- Two vulnerabilities remained below the high gate: one low and one ignored moderate Changesets-only advisory.

The time-bounded Changesets-only exception should be revisited before or at its expiry date.

## Dependency Assessment

| Area | Status |
| --- | --- |
| Runtime baseline | Acceptable. |
| Critical version pinning | Good. |
| Security overrides | Present. |
| Release reproducibility | Needs local pnpm alignment. |
| High-severity audit gate | Previously green. |

## Conclusion

Dependency posture is acceptable for staging and continued development if commands are run through Corepack. Before production, rerun the full dependency/audit gates on a clean branch with the pinned toolchain.


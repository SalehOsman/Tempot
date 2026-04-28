# Tempot Boundary Audit Report

**Status**: Draft execution artifact for spec #026
**Audit date**: 2026-04-28
**Method**: Repository inventory, tracked-file import inspection, package metadata review, and architecture rule comparison.

## Summary

Tempot is broadly aligned with the intended three-layer model. The strongest current risks are not obvious module-to-module imports, but incomplete machine enforcement, older documentation drift, and package classification gaps around newer or deferred components.

## Findings

| ID | Severity | Area | Finding | Evidence | Recommended action |
| --- | --- | --- | --- | --- | --- |
| BND-001 | High | Enforcement | Boundary rules are documented but not yet fully machine-enforced for all tracked imports | CI has lint/spec/cms/audit gates; no dedicated tracked-file import audit yet | Add a report-only import audit, then promote hard rules |
| BND-002 | Medium | Documentation | Older architecture docs do not fully represent `packages/national-id-parser` and agent skills | Inventory found active package and `.agents/skills` surface | Update architecture narratives during docs cleanup |
| BND-003 | Medium | Deferred packages | Deferred packages exist as directories without package metadata | `cms-engine`, `notifier`, `search-engine`, `document-engine`, `import-engine` have no `package.json` | Keep deferred under Rule XC; do not treat as active failures |
| BND-004 | Medium | Worktree audit tooling | Scanning filesystem after install can include nested `node_modules` and produce false positives | Initial import scan entered workspace dependencies | Future audit scripts must use `git ls-files` or explicit excludes |
| BND-005 | Medium | App composition | `apps/bot-server` imports many packages as composition root | Startup files import database, logger, settings, event bus, i18n, sentry | Allowed, but keep business rules in modules |
| BND-006 | Low | Modules | Module internal relative imports are common | `modules/user-management` uses local relative imports within the module | Allowed; monitor only cross-module imports |
| BND-007 | Low | Docs app | Docs ingestion imports `@tempot/ai-core` and `@tempot/shared` | `apps/docs/scripts/*` uses public package APIs | Allowed for documentation tooling |

## No Critical Violations Found

The audit did not find evidence of direct module-to-module imports in tracked source files. It also did not find package-to-app imports from tracked source files during the sampled inspection.

## Enforcement Gaps

- There is no dedicated CI report proving zero module-to-module imports.
- There is no dedicated CI report proving zero deep package imports.
- There is no machine-readable component ownership file.
- Deferred packages need explicit exclusion in future validators.
- Documentation cleanup should align architecture docs, roadmap, and agent-skills guidance.

## Next Audit Iteration

The next implementation slice should create a deterministic script that:

1. Reads tracked files only through `git ls-files`.
2. Excludes `node_modules`, `dist`, generated docs, and lockfiles.
3. Flags module-to-module imports.
4. Flags package-to-app and package-to-module imports.
5. Flags deep `@tempot/*/src/*` imports.
6. Emits JSON and a human-readable summary for CI.

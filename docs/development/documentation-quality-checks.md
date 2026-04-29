# Documentation Quality Checks

This document defines the documentation checks Tempot should apply before a
documentation branch is merged.

## Current Manual Checks

Run these from the repository root or the active worktree.

### 1. Formatting

```bash
prettier --check README.md CONTRIBUTING.md CLAUDE.md GEMINI.md SECURITY.md AGENTS.md docs/**/*.md
```

If `pnpm` is not available in the current shell, use the workspace-local
Prettier binary from an installed checkout.

### 2. Git Whitespace

```bash
git diff --check
```

This catches trailing whitespace and malformed patch content.

### 3. Spec Reconciliation

```bash
pnpm spec:validate
```

This must pass for active packages. Deferred packages are excluded only when
`docs/archive/ROADMAP.md` records them as `Not started` under Rule XC.

### 4. Active Documentation Drift Scan

Search active entry points for stale terms. The active stale-term list currently
includes old documentation paths, old Node baselines, old planned module names,
and deprecated AI provider environment variable names.

```powershell
Select-String -Path README.md,CONTRIBUTING.md,CLAUDE.md,GEMINI.md,SECURITY.md,AGENTS.md,docs/README.md,docs/development/README.md,docs/product/README.md,docs/archive/README.md,docs/archive/ROADMAP.md,docs/archive/developer/workflow-guide.md -Pattern $STALE_DOC_TERMS -CaseSensitive
```

The command should return no matches for active guidance. Historical archive
files may keep older terms when they are clearly historical.

### 5. Mojibake Scan

Search active entry points for common encoding damage. Keep the actual marker
list in the future automation script so this guide does not itself contain
mojibake.

```powershell
Select-String -Path README.md,CONTRIBUTING.md,CLAUDE.md,GEMINI.md,SECURITY.md,AGENTS.md,docs/README.md,docs/development/README.md,docs/product/README.md,docs/archive/README.md,docs/archive/ROADMAP.md,docs/archive/developer/workflow-guide.md -Pattern $MOJIBAKE_MARKERS -CaseSensitive
```

The command should return no matches.

## Future Automation

The manual checks above should become a CI job after this documentation cleanup
phase stabilizes. The automated job should:

- Exclude generated TypeDoc pages.
- Exclude historical Superpowers execution plans unless they are listed as
  active source documents.
- Treat root docs and active `docs/archive/*` compatibility files as blocking.
- Fail on stale active paths, stale environment variable names, and mojibake.

## Active Entry Points

Treat these files as blocking quality targets:

- `README.md`
- `CONTRIBUTING.md`
- `CLAUDE.md`
- `GEMINI.md`
- `SECURITY.md`
- `AGENTS.md`
- `docs/README.md`
- `docs/development/README.md`
- `docs/product/README.md`
- `docs/archive/README.md`
- `docs/archive/ROADMAP.md`
- `docs/archive/developer/workflow-guide.md`
- `docs/archive/developer/documentation-cleanup-plan.md`

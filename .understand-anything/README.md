# Understand Anything Knowledge Graph

This directory stores the Understand Anything project graph for Tempot.

## Project Status

The knowledge graph is an official Tempot AI onboarding and project-context aid.
It helps AI tools and developers understand repository structure, relationships,
and navigation paths before deeper source review.

It is not a governance source of truth. The constitution, role framework,
SpecKit artifacts, roadmap, ADRs, and source code remain authoritative.

## What Is Tracked

- `knowledge-graph.json`: the dashboard graph.
- `meta.json`: graph freshness metadata.
- `.understandignore`: analysis scope rules.
- `README.md`: this operating note.

## What Is Local Only

The following files are scratch/runtime artifacts and must not be committed:

- `intermediate/`
- `tmp/`
- `diff-overlay.json`
- `*.log`
- ad hoc extraction scripts such as `extract-onboard.cjs`

## Local Setup

The working local plugin is installed at:

```text
C:\Users\saleh\.gemini\understand-anything\understand-anything-plugin
```

For cross-platform skill discovery, this machine also has the universal junction:

```text
C:\Users\saleh\.understand-anything-plugin
```

If the dashboard or analysis fails after a fresh install, rebuild the plugin:

```powershell
corepack pnpm install
corepack pnpm --filter @understand-anything/core build
corepack pnpm --filter @understand-anything/dashboard build
```

## Dashboard

Start the dashboard from the plugin dashboard package and point it at Tempot:

```powershell
$env:GRAPH_DIR='F:\Tempot'
corepack pnpm exec vite --host 127.0.0.1
```

Use the full dashboard URL printed by Vite, including the `?token=...` query string.

## Refresh Policy

Refresh the graph after broad architecture, package, or module changes.
The graph should not include local worktrees, generated docs reference output, or the `.understand-anything/` directory itself.

Before committing `knowledge-graph.json`, verify that `meta.json` points at the source commit used to generate the graph.
After committing graph-only changes, the repository `HEAD` will naturally move ahead by one commit.
Regenerate the graph when code, package, module, SpecKit, or architecture documentation changes after the recorded source commit.

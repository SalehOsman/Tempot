# Understand Anything Workflow

Understand Anything is an optional architecture-discovery aid for Tempot documentation.
It does not replace SpecKit, the constitution, ADRs, or the roadmap.

## Official Adoption

Tempot adopts the Understand Anything graph as an official AI onboarding and
project-context aid.

The graph is approved for helping AI tools and developers understand:

- applications, packages, modules, and documentation entry points;
- package and concept dependencies;
- module structure and Event Bus relationship points;
- SpecKit feature relationships and active source documents.

The graph is not a source of governance authority. The hierarchy remains:

1. `.specify/memory/constitution.md`
2. `.specify/memory/roles.md`
3. SpecKit artifacts under `specs/`
4. `docs/ROADMAP.md`
5. ADRs, architecture docs, source code, and generated graph snapshots

When the graph conflicts with a higher source, the higher source wins and the
graph must be regenerated or corrected.

## Purpose

Use it to:

- explore Tempot's package, app, and module structure visually;
- generate onboarding drafts from the knowledge graph;
- inspect architecture relationships before writing documentation;
- support developer orientation and review discussions.

Do not use it as an authority for requirements, acceptance criteria, or implementation decisions.
Tempot's source of truth remains the constitution, SpecKit artifacts, roadmap, ADRs, and source code.

## Local Repair Notes

The local installation previously failed because the plugin dependencies were not installed and
`packages/core/dist/index.js` did not exist. The dashboard skill also expects a universal plugin path.

The repaired local setup uses:

```text
C:\Users\saleh\.gemini\understand-anything\understand-anything-plugin
C:\Users\saleh\.understand-anything-plugin
```

The second path is a Windows junction to the first path.

## Commands

Build and verify the plugin:

```powershell
cd C:\Users\saleh\.gemini\understand-anything\understand-anything-plugin
corepack pnpm install
corepack pnpm --filter @understand-anything/core build
corepack pnpm --filter @understand-anything/core test
corepack pnpm --filter @understand-anything/dashboard build
```

Launch the dashboard for Tempot:

```powershell
cd C:\Users\saleh\.gemini\understand-anything\understand-anything-plugin\packages\dashboard
$env:GRAPH_DIR='F:\Tempot'
corepack pnpm exec vite --host 127.0.0.1
```

Open the tokenized URL printed by Vite.

## Repository Hygiene

Commit the stable graph files only:

- `.understand-anything/knowledge-graph.json`
- `.understand-anything/meta.json`
- `.understand-anything/.understandignore`
- `.understand-anything/README.md`

Do not commit runtime scratch files:

- `.understand-anything/intermediate/`
- `.understand-anything/tmp/`
- `.understand-anything/diff-overlay.json`
- `.understand-anything/*.log`
- local extraction scripts

`pnpm lint` ignores `.understand-anything/**` because the directory is generated documentation data,
not Tempot source code.

## Refresh Guidance

Refresh the graph after:

- package activation or package boundary changes;
- new foundational modules;
- major documentation restructuring;
- roadmap phase transitions;
- broad refactors.

Check the source commit before treating generated output as current:

```powershell
git rev-parse HEAD
Get-Content .understand-anything\meta.json
```

`meta.json.gitCommitHash` is the source commit used to build the graph. After committing graph-only
artifacts, `HEAD` will naturally move ahead. Treat the graph as stale when code, package, module,
SpecKit, or architecture documentation files changed after the recorded source commit.

Before using generated onboarding output as official docs, review it manually against:

- `.specify/memory/constitution.md`
- `.specify/memory/roles.md`
- `docs/ROADMAP.md`
- `docs/architecture/tempot_v11_final.md`

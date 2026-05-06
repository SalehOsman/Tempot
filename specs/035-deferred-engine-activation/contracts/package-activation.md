# Contract: Package Activation Handoff

## Activation Record

The roadmap must record:

- Decision date: 2026-05-06
- Activated packages: `document-engine`, `import-engine`, `search-engine`
- Remaining deferred package: `cms-engine`
- Execution sequence: `document-engine` -> `import-engine` -> `search-engine`

## Handoff Preconditions

Before a package implementation branch starts:

- Required SpecKit artifacts exist.
- No `[NEEDS CLARIFICATION]` marker remains.
- Cross-artifact analysis has no critical findings.
- `corepack pnpm spec:validate` has no critical findings for activated specs.
- Package-specific tasks include RED, GREEN, REFACTOR, review, and verification phases.

## Execution Contract

- Use a separate isolated branch or worktree for each package.
- Do not execute more than one package at a time.
- Do not merge a package until its package gates and merge gates pass.
- Keep unrelated tool caches, including `.understand-anything/`, out of commits.

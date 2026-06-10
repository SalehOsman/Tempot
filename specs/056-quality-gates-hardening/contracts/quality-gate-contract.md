# Contract: Quality Gates

## Root Test Gate

- Enumerates every governed workspace.
- Executes app, package, module, and script tests.
- Fails on any required project failure.
- Reports project and test counts.
- Reports required projects with zero discovered tests.

## Coverage Gate

- Includes application source.
- Uses exactly compatible Vitest packages.
- Applies category thresholds.
- Fails on blocking threshold violations.
- Reports warning threshold violations.

## Documentation Gate

- Is callable as `pnpm docs:freshness` from root.
- Resolves repository paths independently of working directory.
- Validates freshness, frontmatter, critical configuration names, and active
  status claims.
- Applies a separate explicit archive policy.

## Toolchain Gate

- Uses manifest-pinned package manager metadata.
- Tests minimum and current supported Node lines.
- Fails when local, CI, Docker, or docs baselines conflict.

## Conformance Gate

- Reports prohibited suppression directives.
- Reports hardcoded user-facing TypeScript text.
- Reports non-English developer comments in governed source.
- Preserves explicit tooling-script exceptions without weakening production
  source rules.

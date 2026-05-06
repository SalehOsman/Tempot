# Implementation Plan: Documentation Platform Restructure

## Scope

Implement the first governed documentation restructure slice. The work is
limited to documentation source files, Starlight documentation content and
configuration, documentation validation scripts, generated API reference
configuration, and Understand Anything context policy.

No production runtime behavior is changed.

## Current State

Tempot currently has:

- `apps/docs` using Astro, Starlight, starlight-typedoc, and TypeDoc.
- Repository documentation split between `docs/README.md`,
  `docs/development/`, `docs/product/`, and `docs/archive/`.
- Active compatibility documents still under `docs/archive/`.
- Generated API reference under the Starlight content tree.
- Understand Anything graph files under `.understand-anything/`.
- A documented restructure plan at
  `docs/archive/developer/documentation-restructure-plan.md`.

## Proposed Design

### Information Architecture

Use a two-layer documentation system:

1. Repository-native source documents for governance, SpecKit, ADRs, roadmap,
   archive policy, and AI graph snapshots.
2. Starlight published pages for human-facing navigation across Start Here,
   Governance, Architecture, Development, Modules, Packages, Operations, API
   Reference, and AI Context.

### Compatibility Strategy

Do not move authoritative compatibility-path files in the first slice. Add
published Starlight pages and repository map updates that point to those files
instead.

### Generated Content Strategy

Keep generated TypeDoc pages generated only. Update generation inputs and
validate output through the docs build. Review completed packages before adding
them to the generated reference set.

### AI Context Strategy

Treat `.understand-anything/knowledge-graph.json`, `.understand-anything/meta.json`,
`docs/ONBOARDING.md`, and
`docs/archive/developer/project-knowledge-graph.md` as governed AI context
artifacts. Add quality checks and refresh policy before making graph updates a
CI gate.

## Constitution Checks

- Developer-facing docs remain English.
- No production user-facing bot text is introduced.
- No `/speckit.implement` is used.
- No production TypeScript behavior changes are made without TDD.
- Generated reference pages are not manually edited.
- Diffs remain scoped to documentation platform restructure.
- Documentation sync updates Roadmap and active documentation maps.

## Artifacts

- `docs/README.md`
- `docs/ONBOARDING.md`
- `docs/development/README.md`
- `docs/development/documentation-quality-checks.md`
- `docs/archive/ROADMAP.md`
- `docs/archive/developer/documentation-cleanup-plan.md`
- `docs/archive/developer/documentation-restructure-plan.md`
- `docs/archive/developer/project-knowledge-graph.md`
- `docs/archive/developer/understand-anything-workflow.md`
- `.understand-anything/README.md`
- `apps/docs/astro.config.mjs`
- `apps/docs/src/content/docs/`
- `apps/docs/scripts/`
- `apps/docs/package.json`
- `package.json`
- `specs/038-documentation-platform-restructure/`

## Execution Strategy

### Slice 1: SpecKit and Adoption Baseline

Create this SpecKit feature, record the AI graph adoption decision, and document
the professional restructure plan.

### Slice 2: Starlight Entry Points

Add or update published Start Here, Governance, Development, Architecture, and
AI Context pages. Prefer pointer pages over moving active compatibility files.

### Slice 3: Navigation and Encoding Repair

Repair sidebar labels and active localized labels. Add a documented mojibake
check before enforcing it broadly.

### Slice 4: Documentation Gates

Expose root or docs-level checks for frontmatter, freshness, graph quality,
Starlight build, and active documentation hygiene.

### Slice 5: API Reference Coverage

Review completed public packages and expand TypeDoc configuration only when
their public exports are ready for generated documentation.

## Validation Strategy

Minimum gates for documentation-only slices:

- `pnpm lint`
- `pnpm spec:validate`
- `pnpm --filter docs docs:validate`
- `pnpm --filter docs build`
- graph quality validation
- `git diff --check`

Run broader gates if a slice changes scripts, package configuration, or
generated reference behavior.

## Risks

- Moving active archive files can break existing references. Mitigation: pointer
  pages first.
- Generated TypeDoc updates can create large diffs. Mitigation: isolate
  generated reference changes and verify reproducibility.
- Arabic and English published content can drift. Mitigation: classify pages
  that require bilingual parity and validate frontmatter.
- Graph context can become stale. Mitigation: refresh policy and quality
  thresholds.

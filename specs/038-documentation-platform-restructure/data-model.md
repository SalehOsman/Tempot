# Data Model: Documentation Platform Restructure

## Documentation Source

Represents a repository file or generated artifact that provides guidance,
reference, governance, or historical context.

Fields:

- `path`: repository-relative path.
- `classification`: authoritative source, published guide, generated reference,
  compatibility pointer, historical archive, deprecated duplicate, or AI
  context snapshot.
- `audience`: product user, module developer, operator, maintainer, or AI
  agent.
- `ownerArea`: governance, architecture, development, operations, product,
  reference, or AI context.
- `publishedPath`: optional Starlight route or content path.
- `updatePolicy`: manual, generated, compatibility-only, or archived.

Validation rules:

- Generated reference pages must not be manually edited.
- Historical archive files must not be promoted without classification review.
- Compatibility pointers must retain stable paths until all active references
  are updated.

## Published Page

Represents a Starlight documentation page intended for human consumption.

Fields:

- `path`: Starlight content path.
- `locale`: Arabic, English, or locale-neutral.
- `section`: Start Here, Governance, Architecture, Development, Modules,
  Packages, Operations, API Reference, or AI Context.
- `sourceReferences`: authoritative repository paths linked by the page.
- `frontmatterStatus`: valid or invalid.
- `generated`: true when created by TypeDoc.

Validation rules:

- Active non-generated pages require valid frontmatter where the docs app
  expects it.
- Navigation labels must avoid encoding damage.
- Generated pages are excluded from manual copyediting.

## Compatibility Pointer

Represents a stable document path retained for existing references.

Fields:

- `path`: existing compatibility path.
- `canonicalTarget`: preferred active or published target.
- `referenceReason`: constitution, role framework, Roadmap, SpecKit, AI context,
  or external compatibility.
- `migrationStatus`: retained, pointer-only, ready-to-move, or historical.

Validation rules:

- A compatibility pointer cannot be removed while active references remain.
- Pointer text must clearly identify the canonical target.

## AI Context Snapshot

Represents generated AI onboarding context.

Fields:

- `graphPath`: `.understand-anything/knowledge-graph.json`.
- `metaPath`: `.understand-anything/meta.json`.
- `onboardingPath`: `docs/ONBOARDING.md`.
- `summaryPath`: `docs/developer/project-knowledge-graph.md`.
- `sourceCommit`: commit used to generate the graph.
- `nodeCount`: generated graph node count.
- `edgeCount`: generated graph edge count.
- `refreshPolicy`: when the graph must be regenerated.

Validation rules:

- Node and edge counts must be meaningful.
- The graph must record its source commit.
- The graph must not claim authority over constitution, SpecKit, roadmap, ADRs,
  or source code.

## Documentation Gate

Represents a validation check for active documentation.

Fields:

- `name`: gate name.
- `command`: command or documented manual check.
- `scope`: root docs, Starlight app, generated reference, AI graph, or SpecKit.
- `blocking`: whether the gate blocks merge.
- `exclusions`: historical archive or generated output exclusions.

Validation rules:

- Active documentation gates must be documented before becoming blocking.
- Historical archive exclusions must be explicit.
- Broad restructure work must include `pnpm spec:validate`.

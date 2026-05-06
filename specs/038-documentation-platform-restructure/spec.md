# Spec #038: Documentation Platform Restructure

## Status

Specification for restructuring Tempot documentation into a professional
Starlight-first documentation system with governed AI context.

## Problem Statement

Tempot has the correct documentation platform decision: Astro, Starlight, and
starlight-typedoc. The current documentation is still difficult to consume
professionally because active guidance, compatibility-path archive files,
generated reference pages, product documentation, development documentation, and
AI context are split across several locations without a strict publishing model.

Developers, operators, maintainers, and AI tools need a clearer documentation
system that separates authoritative sources, published guidance, generated
reference, historical archive, and generated AI context.

## Goals

- Make `apps/docs` the primary published documentation portal.
- Preserve authoritative source paths for the constitution, roles, SpecKit,
  roadmap, ADRs, and compatibility documents.
- Promote active developer and architecture guidance into an organized
  Starlight navigation model.
- Adopt the Understand Anything graph as a governed AI onboarding aid.
- Expand the documentation quality gates so documentation drift is caught before
  merge.
- Keep the first restructure documentation-only and reversible.

## Non-Goals

- No production bot, package, module, dashboard, SaaS, tenant, or billing
  behavior is implemented.
- No new documentation framework replaces Starlight.
- No historical Superpowers execution log is rewritten for style only.
- No RAG ingestion runtime is implemented in this spec.
- No generated TypeDoc page is edited manually.

## User Scenarios & Testing

### User Story 1 - Find Current Project Guidance (Priority: P1)

A developer or AI agent can start from the documentation map and quickly find
the current source for governance, workflow, architecture, module development,
and AI context without browsing historical archive files manually.

**Why this priority**: This is the minimum useful outcome. If entry points are
unclear, every later documentation improvement remains hard to consume.

**Independent Test**: Review the active documentation map and verify that it
links to current source documents, the AI onboarding guide, and the restructure
plan.

**Acceptance Scenarios**:

1. **Given** a new contributor starts at `docs/README.md`, **When** they look
   for workflow and governance, **Then** they can identify the active documents
   without using historical execution logs as current guidance.
2. **Given** an AI tool starts with `docs/ONBOARDING.md`, **When** it needs
   deeper context, **Then** it can locate the graph, roadmap, workflow guide,
   and authoritative source hierarchy.

### User Story 2 - Publish Professional Documentation Navigation (Priority: P2)

A reader can use the Starlight docs site to navigate product, development,
architecture, operations, API reference, and AI context sections.

**Why this priority**: The repository already has Starlight, but the published
site does not yet represent the full project methodology and active source map.

**Independent Test**: Build the docs site and verify that the intended
navigation sections exist, render correctly, and do not show encoding damage in
active labels.

**Acceptance Scenarios**:

1. **Given** `apps/docs` is built, **When** the sidebar renders, **Then** active
   sections use clear labels and do not contain mojibake.
2. **Given** a reader opens the published docs, **When** they need module
   development or architecture guidance, **Then** they can reach active guides
   without knowing the archive path layout.

### User Story 3 - Keep Generated and AI Context Governed (Priority: P3)

Maintainers can refresh generated API reference and AI graph context while
keeping generated artifacts distinct from manually authored docs.

**Why this priority**: Generated content is valuable but can create noisy diffs
or stale context if not governed.

**Independent Test**: Run documentation validation and graph quality checks and
verify that generated reference pages and graph files are treated according to
the documented policy.

**Acceptance Scenarios**:

1. **Given** completed packages have public exports, **When** TypeDoc generation
   runs, **Then** the API reference includes the approved package set without
   manual edits to generated pages.
2. **Given** architecture or module structure changes, **When** the graph is
   refreshed, **Then** it has meaningful relationships and records the source
   commit used to generate it.

## Edge Cases

- A file under `docs/archive/` is still authoritative because existing context
  files reference its stable path.
- A historical file contains stale or superseded guidance that must not be
  promoted without review.
- A generated TypeDoc page changes when the docs build runs.
- Arabic documentation navigation labels render with encoding damage.
- The knowledge graph exists but has zero or too few relationships.
- A documentation page duplicates guidance that should live in a single
  canonical source.

## Functional Requirements

- **FR-001**: The project MUST document the source-of-truth hierarchy for
  documentation and AI context.
- **FR-002**: The project MUST identify `docs/ONBOARDING.md` and the Understand
  Anything graph as official AI onboarding aids.
- **FR-003**: The documentation map MUST distinguish authoritative sources,
  published guides, generated reference, compatibility pointers, historical
  archive, and generated AI context.
- **FR-004**: The Starlight documentation site MUST expose a professional
  navigation model for Start Here, Governance, Architecture, Development,
  Modules, Packages, Operations, API Reference, and AI Context.
- **FR-005**: Active Starlight labels and active documentation entry points MUST
  avoid mojibake and stale active paths.
- **FR-006**: Active developer and architecture guides MUST be promoted or
  mirrored into the published documentation site without breaking compatibility
  paths.
- **FR-007**: Compatibility-path archive documents MUST remain available when
  they are referenced by the constitution, role framework, roadmap, SpecKit
  artifacts, or AI context files.
- **FR-008**: Generated TypeDoc reference MUST remain reproducible from source
  and MUST NOT be manually edited.
- **FR-009**: Completed public packages MUST be reviewed for API reference
  inclusion.
- **FR-010**: Documentation quality gates MUST include Starlight build,
  frontmatter validation, documentation freshness, active link validation,
  mojibake scanning, graph quality validation, and spec reconciliation.
- **FR-011**: The graph refresh workflow MUST define when the graph is stale and
  what quality threshold makes a graph unacceptable.
- **FR-012**: RAG ingestion for documentation MUST remain a future separate
  SpecKit feature unless explicitly approved later.

## Acceptance Criteria

- **SC-001**: A new contributor can identify the active governance, workflow,
  roadmap, architecture, module, and AI context entry points from the
  documentation map.
- **SC-002**: `docs/ONBOARDING.md` clearly states that the graph is an official
  AI context aid but not a higher authority than the constitution or SpecKit.
- **SC-003**: The restructure plan defines a target information architecture
  for repository-native docs and Starlight published docs.
- **SC-004**: The Starlight docs app builds successfully after the first
  documentation restructure slice.
- **SC-005**: Frontmatter validation passes for active published docs.
- **SC-006**: Graph quality validation confirms meaningful node and edge counts.
- **SC-007**: `pnpm spec:validate` passes after documentation sync.
- **SC-008**: The Roadmap identifies documentation platform restructure as the
  next documentation work item.

## Key Entities

- **Documentation Source**: A file or generated artifact that provides project
  guidance, reference, governance, or historical context.
- **Published Page**: A Starlight page intended for human consumption in the
  docs site.
- **Compatibility Pointer**: A stable historical path that remains available
  because active tools or documents reference it.
- **Generated Reference**: TypeDoc output created from package public exports.
- **AI Context Snapshot**: Understand Anything graph files and onboarding
  summaries used by AI tools before deeper source review.
- **Documentation Gate**: A validation command or policy that blocks stale,
  broken, or misleading active documentation.

## Assumptions

- ADR-038 remains accepted, so Starlight continues as the documentation
  platform.
- The first implementation slice should be documentation-only.
- Existing archive paths must not be removed until active references are updated
  in a separate controlled batch.
- Generated API reference pages are reproducible and should stay isolated from
  manual authoring.
- RAG ingestion is valuable but must not be bundled into this restructure.

# Research: Documentation Platform Restructure

## Decision: Keep Starlight as the Documentation Platform

Use the existing Astro and Starlight documentation app instead of introducing a
new framework.

Rationale: ADR-038 already accepted Starlight over Docusaurus. The repository
has `apps/docs`, Starlight, starlight-typedoc, TypeDoc generation, validation
scripts, and a working build. The current problem is information architecture,
not framework choice.

Alternatives considered:

- Replace Starlight with another framework: rejected because it would violate
  ADR-038 without solving the immediate organization problem.
- Keep documentation only in repository Markdown: rejected because the project
  already planned and implemented a professional docs app.

## Decision: Pointer Pages Before File Moves

Promote active guidance into Starlight by adding published pages and pointers
before moving compatibility-path files.

Rationale: Several active documents still live under `docs/archive/` because
the constitution, AGENTS context, Roadmap, SpecKit artifacts, and existing docs
reference those paths. Moving them first would create avoidable breakage.

Alternatives considered:

- Move all active files immediately: rejected because it creates a broad,
  high-risk diff.
- Leave active files only in archive: rejected because it keeps the published
  documentation site incomplete.

## Decision: Govern AI Context as a Snapshot

Adopt Understand Anything graph output as an official AI onboarding aid while
keeping higher project authorities unchanged.

Rationale: The graph helps AI tools and developers understand structure and
relationships quickly, but generated analysis can become stale or conflict with
source documents. It must be useful without becoming a governance authority.

Alternatives considered:

- Treat the graph as authoritative: rejected because generated context cannot
  supersede the constitution, roles, SpecKit, ADRs, roadmap, or source code.
- Treat the graph as local-only scratch data: rejected because the generated
  graph now has enough relationships to provide real onboarding value.

## Decision: Automate Documentation Gates Incrementally

Start from existing docs validation, Starlight build, spec validation, and graph
quality checks, then add link and mojibake scans as explicit future tasks.

Rationale: The project already has several validation scripts. The next value is
exposing them coherently and adding missing checks without overloading the first
slice.

Alternatives considered:

- Add a large custom documentation linter immediately: rejected because the
  first slice should stay documentation-only and low risk.
- Rely only on manual review: rejected because documentation drift has already
  accumulated.

## Decision: Separate RAG Ingestion from Documentation Restructure

Keep documentation ingestion into `ai-core` as a future SpecKit feature.

Rationale: Documentation organization and RAG ingestion are related but have
different acceptance criteria, test strategy, and runtime implications.

Alternatives considered:

- Implement RAG ingestion in this spec: rejected because it would turn a
  documentation restructure into a runtime AI feature.

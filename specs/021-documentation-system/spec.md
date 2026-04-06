# Feature Specification: Documentation System (Starlight Documentation Platform)

**Feature Branch**: `021-documentation-system`
**Created**: 2026-04-05
**Status**: Complete
**Input**: User description: "Comprehensive documentation platform for Tempot using Starlight (Astro), serving 4 audiences with AI-generated content and RAG integration"
**Architecture Reference**: Section 29 of `docs/tempot_v11_final.md`
**ADR Reference**: ADR-038 (Starlight over Docusaurus for Documentation Platform)

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — End User Reads Bot Guide (Priority: P1)

As an end user of the Telegram bot, I want to read user-facing documentation in Arabic so that I can learn how to use the bot's features.

**Why this priority**: End users are the primary audience; Arabic-first documentation is a core product requirement.

**Independent Test**: Navigate to `/ar/user-guide/getting-started` and verify the page renders in RTL layout with Arabic content.

**Acceptance Scenarios**:

1. **Given** the documentation site is deployed, **When** a user visits the Arabic user guide, **Then** the page renders in RTL layout with Arabic text and navigation.
2. **Given** the user is on an Arabic page, **When** they switch to English, **Then** the same content appears in LTR layout in English.
3. **Given** the user is on a page with code snippets, **When** the page renders in RTL mode, **Then** code blocks remain LTR while surrounding text is RTL.

---

### User Story 2 — New Developer Follows Tutorial (Priority: P0)

As a new developer, I want to follow a step-by-step tutorial to set up and contribute to Tempot so that I can onboard quickly.

**Why this priority**: Developer onboarding is the primary use case for the documentation platform.

**Independent Test**: Navigate to `/tutorials/getting-started` and verify the page contains a complete step-by-step guide with code examples.

**Acceptance Scenarios**:

1. **Given** a developer visits the tutorials section, **When** they click on "Getting Started", **Then** a step-by-step guide loads with code examples and expected outputs.
2. **Given** the tutorial references an API, **When** the developer clicks an API link, **Then** they are navigated to the auto-generated API reference page for that symbol.

---

### User Story 3 — Advanced Developer Browses API Reference (Priority: P0)

As an advanced developer building modules, I want to browse auto-generated API documentation for every package so that I can understand the public interfaces.

**Why this priority**: API reference is the most frequently accessed section for active developers and must be auto-generated to stay in sync.

**Independent Test**: Run `pnpm build` in `apps/docs` and verify that API reference pages are generated for all packages with public exports. Content is sourced from `docs/product/`.

**Acceptance Scenarios**:

1. **Given** the documentation is built, **When** a developer navigates to `/reference/logger/`, **Then** they see auto-generated TypeDoc documentation for `@tempot/logger`.
2. **Given** a package's source code changes, **When** the documentation is rebuilt, **Then** the API reference reflects the updated types and functions.
3. **Given** the monorepo has 13+ packages, **When** the API reference is generated, **Then** each package has its own sidebar section with correct navigation.

---

### User Story 4 — Template User Customizes Bot (Priority: P2)

As a developer using Tempot as a template for their own bot, I want customization guides so that I can adapt the framework to my needs.

**Why this priority**: Template users are a secondary audience; this can follow initial documentation launch.

**Independent Test**: Navigate to `/guides/customization/` and verify guides exist for module creation, branding, and configuration.

**Acceptance Scenarios**:

1. **Given** a template user visits the customization section, **When** they read the "Create a Module" guide, **Then** they find step-by-step instructions with a working example module.

---

### User Story 5 — AI Pipeline Generates Documentation (Priority: P1)

As a maintainer, I want an AI pipeline that generates documentation from SpecKit artifacts and source code so that documentation stays in sync with implementation.

**Why this priority**: Manual documentation writing does not scale; AI generation from structured artifacts ensures consistency.

**Independent Test**: Run `pnpm docs:generate --package logger` and verify it produces valid Starlight-compatible Markdown files with correct frontmatter.

**Acceptance Scenarios**:

1. **Given** a package has spec.md, plan.md, and source code, **When** the generate-docs script runs, **Then** it produces Starlight-compatible Markdown files with typed frontmatter.
2. **Given** the AI pipeline generates a document, **When** a maintainer reviews it, **Then** the output includes correct code references, cross-links, and section structure.
3. **Given** a package has no SpecKit artifacts (pre-methodology), **When** the pipeline runs, **Then** it falls back to source code and JSDoc comments only, logging a warning.

---

### User Story 6 — RAG Pipeline Indexes Documentation (Priority: P1)

As a developer using the AI assistant, I want documentation indexed in the RAG pipeline so that I can ask questions and get accurate answers from the docs.

**Why this priority**: RAG integration is a key differentiator, enabling AI-assisted developer support from documentation content.

**Independent Test**: Run `pnpm docs:ingest` and verify that documentation chunks are inserted into the vector database with correct metadata.

**Acceptance Scenarios**:

1. **Given** documentation Markdown files exist, **When** the ingest script runs, **Then** content is chunked by Markdown headings and ingested into `@tempot/ai-core` with `contentType: 'developer-docs'`.
2. **Given** a document has frontmatter with package and tags, **When** it is ingested, **Then** the metadata (filePath, section, language, package) is preserved in the vector store.
3. **Given** documentation is updated, **When** re-ingestion runs, **Then** only changed files are re-indexed (incremental update).

---

### User Story 7 — CI Detects Stale Documentation (Priority: P1)

As a maintainer, I want CI to detect when documentation is stale relative to source code so that I can trigger regeneration.

**Why this priority**: Without freshness detection, documentation drift is inevitable.

**Independent Test**: Modify a source file, run the freshness detection script, and verify it reports the corresponding doc as stale.

**Acceptance Scenarios**:

1. **Given** a source file was modified after its corresponding doc, **When** the freshness check runs in CI, **Then** it reports that doc as stale with a diff timestamp.
2. **Given** all docs are up to date, **When** the freshness check runs, **Then** it exits with code 0 and reports "all fresh".

---

## Edge Cases

- **Pre-methodology packages**: logger, event-bus, auth-core have no SpecKit artifacts. The AI pipeline must fall back to source code + JSDoc comments only, logging a warning for each missing artifact.
- **Source code changes without doc regeneration**: The freshness detection script compares git timestamps of source files vs. corresponding docs. CI warns but does not block — regeneration is triggered separately.
- **RTL mixed content**: Arabic text with English code snippets. Starlight handles this natively — code blocks are always LTR. Inline code within RTL paragraphs uses `dir="auto"` via the Markdown renderer.
- **AI-generated doc conflicts with ADR**: ADRs are authoritative. The generate-docs pipeline includes ADR content as context and must not contradict ADR decisions. If a conflict is detected during review, the ADR takes precedence and the generated content is adjusted.
- **RAG re-indexing strategy**: Incremental by default — hash-based change detection per file. Full rebuild available via `pnpm docs:ingest --full` flag for recovery scenarios.
- **Empty package (no exports)**: Packages with no public exports (e.g., `sentry` which only initializes) generate a minimal API reference page stating "This package has no public API — it is initialized internally."
- **Build failure in starlight-typedoc**: If TypeDoc fails for one package, the build continues for remaining packages. Failed packages are logged as warnings. The overall build fails only if the core Starlight build fails.
- **Large documentation corpus**: For RAG ingestion, documents exceeding 8000 tokens per chunk are split further at paragraph boundaries within sections to stay within embedding model limits.

---

## Design Decisions & Clarifications (updated after /speckit.clarify)

### D1. Starlight (Astro) over Docusaurus

Use Starlight (Astro) as the documentation platform instead of Docusaurus 3.x. Native RTL support, i18next compatibility, zero-JS default, and better TypeDoc integration. See ADR-038 for full rationale.

### D2. Diataxis Framework for Content Organization

Organize documentation using the Diataxis framework: tutorials (learning-oriented), guides (task-oriented), reference (information-oriented), concepts (understanding-oriented), plus user-guide for end users. This provides clear content categories and helps authors decide where content belongs.

### D3. starlight-typedoc for Monorepo API Reference

Use `starlight-typedoc` with `createStarlightTypeDocPlugin()` — one plugin instance per package. Each package gets its own sidebar section under `/reference/{package-name}/`. This avoids a single monolithic TypeDoc run and enables per-package rebuilds.

### D4. AI-First Documentation Generation

90% of documentation is AI-generated from SpecKit artifacts (spec.md, plan.md, data-model.md), source code, test files, and ADRs. 10% is human review and editorial polish. The `generate-docs.ts` script constructs structured prompts and outputs Starlight-compatible Markdown. This is a local script using whatever AI tool is available — not a hosted service.

### D5. RAG Integration via @tempot/ai-core

Documentation content is ingested into the existing RAG pipeline using `ContentIngestionService.ingest()` from `@tempot/ai-core` with `contentType: 'developer-docs'`. This enables the AI assistant to answer developer questions from documentation content.

### D6. Markdown-Aware Chunking for RAG

Enhancement to existing character-based chunking in `@tempot/ai-core`. New chunking strategy splits by Markdown headings (`##`, `###`) instead of arbitrary character counts. Each chunk preserves section context in metadata: `{ filePath, section, language }`. Falls back to paragraph splitting for sections exceeding the token limit.

### D7. Arabic Primary Language with English Secondary

Arabic is the primary language (matching Tempot's target audience). English is secondary. Starlight's built-in i18n handles locale routing (`/ar/...` and `/en/...`). Content files are organized as `docs/product/{locale}/...` at the project root. Starlight 0.34.x requires content at `src/content/docs/` — a directory junction (Windows) or symlink (Linux/Mac) maps `apps/docs/src/content/docs/` → `docs/product/`. The junction is created automatically by `scripts/setup-content-link.cjs` (runs via `prepare` hook).

### D8. Vale for Prose Quality Enforcement

Vale prose linter enforces style consistency in CI. Custom Tempot style rules check for: consistent terminology, prohibited words, sentence length limits. Vale runs as a GitHub Actions step on documentation PRs.

### D9. Frontmatter Schema for RAG Readiness

All documentation pages use typed frontmatter with fields: `title`, `description`, `tags`, `audience`, `package`, `contentType`, `difficulty`. The `contentType` field maps directly to `AIContentType` enum in `@tempot/ai-core` for seamless RAG ingestion.

### D10. Incremental RAG Re-indexing

Default re-indexing is incremental: file content hashes are stored alongside vectors. On re-ingestion, only files with changed hashes are re-processed. Full rebuild (`--full` flag) deletes all `developer-docs` content and re-ingests everything.

### D11. Zero-Deletion Archive Policy

All existing documentation in `docs/` (tempot_v11_final.md, ROADMAP.md, architecture/adr/, developer/) is moved to `docs/archive/` and preserved as read-only historical reference. Nothing is deleted — ever. A `docs/archive/README.md` explains that this is archived reference material. New documentation in `docs/product/` and `docs/development/` may reference archived content via relative links. ADRs in the archive remain as historical record; new ADRs are created in `docs/development/adr/`.

### D12. Development vs Product Documentation Separation

Documentation is split into two categories with distinct purposes and audiences:

- **`docs/development/`** — Project development process: ADRs (new), methodology (SpecKit + Superpowers), devlog, retrospectives. Audience: internal development team. NOT published via Starlight.
- **`docs/product/`** — Product documentation: tutorials, guides, reference, concepts, user-guide. Audience: package developers, bot developers, operators, end users. Published via Starlight.

This separation ensures development-internal decisions do not clutter user-facing documentation.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST serve documentation using Starlight (Astro) at `apps/docs/` with content sourced from `docs/product/` and native RTL support.
- **FR-002**: System MUST generate API reference documentation for each `@tempot/*` package using starlight-typedoc with one plugin instance per package.
- **FR-003**: System MUST support i18n with Arabic as primary language and English as secondary, using Starlight's built-in i18n system.
- **FR-004**: System MUST organize product content in `docs/product/` using the Diataxis framework: tutorials, guides, reference, concepts, and user-guide sections. Development documentation in `docs/development/` is organized separately (adr, methodology, devlog, retrospectives).
- **FR-005**: System MUST provide an AI documentation generation pipeline (`generate-docs.ts`) that reads SpecKit artifacts and source code to produce Starlight-compatible Markdown.
- **FR-006**: System MUST provide a RAG ingestion script (`docs:ingest`) that chunks documentation by Markdown headings and ingests into `@tempot/ai-core` with `contentType: 'developer-docs'`.
- **FR-007**: System MUST implement Markdown-aware chunking that splits by headings (`##`, `###`) instead of character counts, preserving section metadata.
- **FR-008**: System MUST provide a freshness detection script that compares git timestamps of source files vs. documentation to identify stale content.
- **FR-009**: System MUST use typed frontmatter with fields: title, description, tags, audience, package, contentType, difficulty.
- **FR-010**: System MUST support incremental RAG re-indexing with hash-based change detection per file.
- **FR-011**: System MUST fall back gracefully for pre-methodology packages (no SpecKit artifacts) by using source code and JSDoc comments only.
- **FR-012**: System MUST integrate Vale prose linter for style consistency enforcement in CI.
- **FR-013**: System MUST archive all existing documentation from `docs/` into `docs/archive/` with zero deletion. An archive README MUST explain the archive's purpose and reference policy.
- **FR-014**: System MUST create `docs/development/` directory structure for project development documentation (adr, methodology, devlog, retrospectives), separate from product documentation.

### Non-Functional Requirements

- **NFR-001**: Documentation site MUST load in under 3 seconds on a 3G connection (Starlight's zero-JS default).
- **NFR-002**: API reference generation MUST complete in under 5 minutes for all packages combined.
- **NFR-003**: RAG ingestion MUST process the full documentation corpus in under 10 minutes.
- **NFR-004**: Documentation MUST be accessible (WCAG 2.1 AA) including proper RTL/LTR handling.
- **NFR-005**: All user-facing documentation text MUST be available in both Arabic and English.

### Key Entities

```typescript
/** Frontmatter schema for all documentation pages */
interface DocFrontmatter {
  title: string;
  description: string;
  tags: string[];
  audience: ('package-developer' | 'bot-developer' | 'operator' | 'end-user')[];
  package?: string;
  contentType: 'developer-docs';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/** Configuration for the AI documentation generation pipeline */
interface DocGenerationConfig {
  packageName: string;
  specDir: string; // Path to specs/{NNN}-{feature}/
  sourceDir: string; // Path to packages/{name}/src/ or apps/{name}/src/
  outputDir: string; // Path to docs/product/
  locale: 'ar' | 'en';
}

/** Chunk metadata for RAG ingestion */
interface DocChunkMetadata {
  filePath: string;
  section: string;
  language: string;
  package?: string;
  contentHash: string;
}
```

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `pnpm build` in `apps/docs` produces a complete Starlight site with all configured pages (FR-001).
- **SC-002**: API reference pages exist for every `@tempot/*` package with public exports, auto-generated by starlight-typedoc (FR-002).
- **SC-003**: Documentation site renders correctly in both RTL (Arabic) and LTR (English) modes with proper navigation (FR-003, NFR-004).
- **SC-004**: Content is organized into tutorials, guides, reference, concepts, and user-guide sections matching the Diataxis framework (FR-004).
- **SC-005**: `pnpm docs:generate --package {name}` produces valid Starlight-compatible Markdown with correct frontmatter for packages with SpecKit artifacts (FR-005, FR-009).
- **SC-006**: `pnpm docs:generate` falls back to source-only generation for pre-methodology packages, logging warnings for missing artifacts (FR-011).
- **SC-007**: `pnpm docs:ingest` chunks documentation by Markdown headings and inserts into vector store with correct metadata (FR-006, FR-007).
- **SC-008**: `pnpm docs:ingest --full` re-indexes all content; default mode only re-indexes changed files (FR-010).
- **SC-009**: Freshness detection script correctly identifies stale docs based on git timestamp comparison (FR-008).
- **SC-010**: Vale linter passes on all documentation content with zero errors (FR-012).
- **SC-011**: All documentation pages include typed frontmatter with required fields (FR-009).
- **SC-012**: Documentation site loads in under 3 seconds on simulated 3G (NFR-001).
- **SC-013**: Full API reference generation completes in under 5 minutes (NFR-002).
- **SC-014**: Full RAG ingestion completes in under 10 minutes (NFR-003).
- **SC-015**: `docs/archive/` contains all previously existing documentation files intact with zero deletions, plus an archive README (FR-013).
- **SC-016**: `docs/development/` contains adr, methodology, devlog, and retrospectives subdirectories (FR-014).

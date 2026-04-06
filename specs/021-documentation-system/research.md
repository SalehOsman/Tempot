# Research: Documentation System

## Decisions

### 1. Starlight (Astro) as Documentation Platform

- **Decision:** Use Starlight (Astro) instead of Docusaurus 3.x for the documentation platform.
- **Rationale:** Native RTL support, i18next compatibility (same as Tempot), zero-JS default for performance, `starlight-typedoc` for monorepo API reference. See ADR-038 for full analysis.
- **Alternatives considered:** Docusaurus 3.x (rejected — no native RTL, different i18n system, heavier bundle). VitePress (rejected — Vue-based, no native RTL). Mintlify (rejected — closed-source SaaS). GitBook (rejected — closed-source SaaS).

### 2. starlight-typedoc for API Reference

- **Decision:** Use `starlight-typedoc` with `createStarlightTypeDocPlugin()` for per-package API reference generation.
- **Rationale:** Native Starlight integration, supports monorepo via multiple plugin instances, automatic sidebar generation. Outputs Markdown files that are RAG-ingestible.
- **Alternatives considered:** Manual TypeDoc + custom sidebar (rejected — maintenance burden). Single monolithic TypeDoc run (rejected — slow, no per-package isolation). Fumadocs TypeDoc plugin (rejected — Next.js only).

### 3. Diataxis Framework for Content Organization

- **Decision:** Organize documentation using the Diataxis framework (tutorials, guides, reference, concepts) plus a user-guide section.
- **Rationale:** Provides clear content categorization, helps authors decide where content belongs, and is the industry standard for technical documentation.
- **Alternatives considered:** Flat structure (rejected — doesn't scale). Custom taxonomy (rejected — reinventing the wheel).

### 4. AI-First Documentation Generation

- **Decision:** Use a local `generate-docs.ts` script that reads SpecKit artifacts and source code, constructs structured prompts, and outputs Starlight-compatible Markdown.
- **Rationale:** 90% AI-generated documentation ensures consistency with source and reduces manual effort. The script is OSS/local — uses whatever AI tool is available (not a hosted service dependency).
- **Alternatives considered:** Manual documentation writing (rejected — doesn't scale with 13+ packages). Hosted AI service (rejected — adds vendor dependency and cost).

### 5. Markdown-Aware Chunking for RAG

- **Decision:** Implement a new chunking strategy in `@tempot/ai-core` that splits by Markdown headings instead of character counts.
- **Rationale:** Character-based chunking breaks mid-section, losing context. Heading-based chunking preserves section boundaries and enables metadata-rich vectors (filePath, section, language).
- **Alternatives considered:** Keep character-based chunking (rejected — poor retrieval quality for structured docs). Sentence-based chunking (rejected — too granular for documentation).

### 6. Incremental RAG Re-indexing

- **Decision:** Use hash-based change detection per file for incremental re-indexing, with full rebuild available via `--full` flag.
- **Rationale:** Full re-indexing on every change is wasteful for large documentation corpora. Content hashes stored alongside vectors enable efficient delta updates.
- **Alternatives considered:** Always full rebuild (rejected — slow for 100+ pages). Git-diff based detection (rejected — doesn't handle content transformations).

### 7. Vale for Prose Linting

- **Decision:** Use Vale prose linter with custom Tempot style rules in CI.
- **Rationale:** Ensures consistent terminology, catches style violations early. Vale is the industry standard for docs-as-code prose quality.
- **Alternatives considered:** ESLint for Markdown (rejected — syntax only, not prose quality). Custom script (rejected — reinventing the wheel). write-good (rejected — less configurable, no CI integration).

### 8. Frontmatter Schema Design

- **Decision:** Use typed frontmatter with `contentType: 'developer-docs'` mapping directly to `AIContentType` enum in `@tempot/ai-core`.
- **Rationale:** Seamless RAG ingestion without translation layers. The `audience` and `difficulty` fields enable filtered retrieval.
- **Alternatives considered:** Untyped frontmatter (rejected — no validation). Separate metadata files (rejected — maintenance overhead).

### 9. Pre-methodology Package Handling

- **Decision:** For packages without SpecKit artifacts (logger, event-bus, auth-core), fall back to source code + JSDoc comments for documentation generation.
- **Rationale:** These packages were built before the SpecKit methodology was adopted. Blocking documentation on retroactive spec creation would delay the entire docs launch.
- **Alternatives considered:** Require retroactive spec creation (rejected — blocks docs launch). Skip pre-methodology packages entirely (rejected — API reference is still needed).

### 10. Content Locale Organization

- **Decision:** Organize content files as `docs/product/{locale}/...` using Starlight's built-in i18n routing. Starlight 0.34.x has no `contentDir` option — a directory junction maps `apps/docs/src/content/docs/` → `docs/product/` (created by `scripts/setup-content-link.cjs` via `prepare` hook).
- **Rationale:** Starlight's i18n system handles locale routing, fallback, and sidebar generation natively. Arabic (`ar`) is the default locale; English (`en`) is the secondary. Content lives at project root for better discoverability — `apps/docs/` is a build tool only.
- **Alternatives considered:** Single locale with translation keys (rejected — Starlight doesn't work this way). Separate Starlight instances per locale (rejected — duplication). Content inside `apps/docs/src/content/docs/` (rejected — buries content deep in build app).

### 11. Zero-Deletion Archive Policy

- **Decision:** All existing documentation in `docs/` is moved to `docs/archive/` with a README notice. No files are deleted.
- **Rationale:** Preserves institutional knowledge and avoids accidental loss of context during the migration to the new Starlight-based documentation structure. The archive serves as a read-only reference.
- **Alternatives considered:** Delete old docs after migration (rejected — risks losing institutional knowledge). Keep old docs in place alongside new structure (rejected — confusing coexistence of old/new formats).

### 12. Development vs Product Documentation Separation

- **Decision:** Internal development documentation (ADRs, methodology, devlog, retrospectives) lives in `docs/development/` and is NOT published via Starlight. Product documentation (user/developer-facing content) lives in `docs/product/` and is the only content published.
- **Rationale:** Separates internal process documentation from public-facing content. Development docs are for the core team only and should not appear in the published documentation site. This keeps the Starlight site focused on content relevant to the 4 target audiences (package-developer, bot-developer, operator, end-user).
- **Alternatives considered:** Publish everything including internal docs (rejected — exposes internal process to end users). Keep development docs inside `apps/docs/` with draft flags (rejected — still present in build, risk of accidental publication).

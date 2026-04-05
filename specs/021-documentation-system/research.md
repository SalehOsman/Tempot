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

- **Decision:** Organize content files as `src/content/docs/{locale}/...` using Starlight's built-in i18n routing.
- **Rationale:** Starlight's i18n system handles locale routing, fallback, and sidebar generation natively. Arabic (`ar`) is the default locale; English (`en`) is the secondary.
- **Alternatives considered:** Single locale with translation keys (rejected — Starlight doesn't work this way). Separate Starlight instances per locale (rejected — duplication).

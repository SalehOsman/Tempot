# Documentation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive documentation platform for Tempot using Starlight (Astro) that serves 4 audiences (end user, new developer, advanced developer, template user), organizes content via the Diataxis framework, auto-generates API reference from TypeDoc, provides an AI documentation generation pipeline from SpecKit artifacts, integrates with the RAG pipeline for AI-assisted search, and enforces prose quality via Vale linting in CI.

**Architecture:** Documentation content lives in `docs/` at the project root, split into three directories: `docs/archive/` (existing docs preserved as read-only reference), `docs/development/` (project development process — ADRs, methodology, devlog, retrospectives — NOT published), and `docs/product/` (user/developer-facing content organized by locale and Diataxis sections). The Starlight (Astro) application in `apps/docs/` is a build tool only — a directory junction maps `apps/docs/src/content/docs/` → `docs/product/` at the project root (Starlight 0.34.x requires content at `src/content/docs/` with no `contentDir` option). The junction is created automatically by `scripts/setup-content-link.cjs` via the `prepare` hook. API reference is auto-generated at build time by `starlight-typedoc` with one plugin instance per `@tempot/*` package. Documentation generation scripts live in `apps/docs/scripts/` — `generate-docs.ts` for AI-first content generation, `ingest-docs.ts` for RAG ingestion, and `check-freshness.ts` for staleness detection. Markdown-aware chunking extends `@tempot/ai-core` with a new chunking strategy.

**Tech Stack:** Astro 5.x (static site generator), @astrojs/starlight (documentation theme), starlight-typedoc (API reference generation), TypeDoc (TypeScript documentation generator), i18next (Starlight's built-in i18n — matches Tempot's stack), Vale (prose linter for CI), Vercel AI SDK 6.x (AI generation pipeline — via `@tempot/ai-core`), pgvector (RAG vector storage — via `@tempot/database`), @tempot/ai-core (RAG ingestion service), @tempot/shared (Result pattern, AppError).

**Design Constraints:**

- Arabic is the default locale; English is secondary (D7 in spec.md)
- One `createStarlightTypeDocPlugin()` instance per `@tempot/*` package (D3 in spec.md)
- AI pipeline is a local script, not a hosted service (D4 in spec.md)
- Markdown-aware chunking splits by headings (`##`, `###`), not character counts (D6 in spec.md)
- Incremental RAG re-indexing via content hashes; full rebuild via `--full` flag (D10 in spec.md)
- Pre-methodology packages (logger, event-bus, auth-core) fall back to source + JSDoc only (D4 in spec.md)
- Vale runs in CI as a GitHub Actions step on documentation PRs (D8 in spec.md)
- All documentation frontmatter uses typed schema with `contentType: 'developer-docs'` mapping to `AIContentType` (D9 in spec.md)
- Content follows Diataxis framework: tutorials, guides, reference, concepts, user-guide (D2 in spec.md)
- `apps/docs/` is an application — not a library, no package exports
- Existing documentation archived in `docs/archive/` — zero deletion policy (D11 in spec.md)
- Development documentation (`docs/development/`) separate from product documentation (`docs/product/`) — only product docs published via Starlight (D12 in spec.md)
- `apps/docs/` is a build application only — content lives in `docs/product/` at project root

---

### Shared Type Definitions

Defined in `apps/docs/scripts/docs.types.ts`:

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
  specDir: string;
  sourceDir: string;
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

/** Output of the freshness detection script */
interface FreshnessReport {
  package: string;
  sourceFile: string;
  docFile: string;
  sourceMtime: string;
  docMtime: string;
  isStale: boolean;
}
```

---

### Task 0: Project Scaffolding

**Goal:** Create the `apps/docs/` directory with Starlight (Astro) project structure, configure i18n for Arabic primary + English secondary, and set up the Diataxis directory layout.

**Files:** Create:

- `apps/docs/package.json`
- `apps/docs/astro.config.mjs`
- `apps/docs/tsconfig.json`
- `docs/archive/README.md` (archive notice)
- `docs/development/adr/` (directory)
- `docs/development/methodology/` (directory)
- `docs/development/devlog/` (directory)
- `docs/development/retrospectives/` (directory)
- `docs/product/ar/index.md` (Arabic landing page)
- `docs/product/en/index.md` (English landing page)
- `docs/product/ar/tutorials/` (directory)
- `docs/product/ar/guides/` (directory)
- `docs/product/ar/concepts/` (directory)
- `docs/product/ar/user-guide/` (directory)
- `docs/product/en/tutorials/` (directory)
- `docs/product/en/guides/` (directory)
- `docs/product/en/concepts/` (directory)
- `docs/product/en/user-guide/` (directory)
- `apps/docs/scripts/docs.types.ts`

**Test file:** N/A (infrastructure setup)

**Steps:**

- [ ] Move all existing documentation from `docs/` to `docs/archive/` preserving directory structure
- [ ] Create `docs/archive/README.md` — notice that these files are archived (zero-deletion policy, D11) and should not be edited
- [ ] Create `docs/development/` with subdirectories: `adr/`, `methodology/`, `devlog/`, `retrospectives/`
- [ ] Create `docs/product/` with Diataxis structure for both locales: `{ar,en}/{tutorials,guides,concepts,user-guide}/`
- [ ] Initialize `apps/docs/` with `package.json` — name: `docs`, private: true, scripts: `dev`, `build`, `preview`
- [ ] Create `astro.config.mjs` with Starlight plugin, i18n config (`ar` default RTL, `en` secondary), and sidebar configuration for Diataxis sections. Content is served via directory junction from `src/content/docs/` → `docs/product/` (created by `scripts/setup-content-link.cjs`).
- [ ] Create `tsconfig.json` extending Astro's base config
- [ ] Create landing pages for both locales at `docs/product/{ar,en}/index.md` with typed DocFrontmatter
- [ ] Create `scripts/docs.types.ts` with shared type definitions
- [ ] Run `pnpm install` to verify workspace resolution
- [ ] Run `pnpm build` in `apps/docs` to verify Starlight builds successfully with junction from `src/content/docs/` → `docs/product/`
- [ ] Verify `docs/archive/` contains all previously existing docs untouched
- [ ] Commit: `chore(docs): scaffold Starlight documentation site with i18n, Diataxis structure, and content relocation`

---

### Task 1: starlight-typedoc API Reference Configuration

**Goal:** Configure `starlight-typedoc` with one plugin instance per `@tempot/*` package to auto-generate API reference pages at build time.

**Files:** Update:

- `apps/docs/astro.config.mjs` (add starlight-typedoc plugins)

**Files:** Create:

- `apps/docs/typedoc.base.json` (shared TypeDoc config)

**Test file:** N/A (build-time configuration)

**Steps:**

- [ ] Create base TypeDoc configuration with shared settings (excludePrivate, excludeInternal, etc.)
- [ ] Add `createStarlightTypeDocPlugin()` call for each `@tempot/*` package with public exports in `astro.config.mjs`
- [ ] Configure each plugin instance to output to `reference/{package-name}/` sidebar section
- [ ] Handle packages with no public exports (e.g., sentry) — skip plugin instance, create manual minimal page
- [ ] Run `pnpm build` in `apps/docs` and verify API reference pages are generated per package
- [ ] Verify each package has its own sidebar section with correct navigation
- [ ] Commit: `feat(docs): configure starlight-typedoc for per-package API reference`

---

### Task 2: Frontmatter Schema & Validation

**Goal:** Define and enforce the typed frontmatter schema for all documentation pages, ensuring RAG readiness via `contentType` mapping.

**Files:** Create:

- `apps/docs/scripts/validate-frontmatter.ts`
- `apps/docs/tests/unit/validate-frontmatter.test.ts`

**Test file:** `apps/docs/tests/unit/validate-frontmatter.test.ts`

**Steps:**

- [ ] Write tests for: valid frontmatter passes, missing required field fails, invalid audience value fails, invalid contentType fails, optional fields accepted when present, optional fields omitted passes
- [ ] Run tests — expect RED (no implementation)
- [ ] Implement `validateFrontmatter(data: unknown): Result<DocFrontmatter, AppError>` using Zod schema
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(docs): add frontmatter schema validation with Zod`

---

### Task 3: AI Documentation Generation Pipeline

**Goal:** Create the `generate-docs.ts` script that reads SpecKit artifacts and source code, constructs structured prompts, and outputs Starlight-compatible Markdown with typed frontmatter.

**Files:** Create:

- `apps/docs/scripts/generate-docs.ts`
- `apps/docs/tests/unit/generate-docs.test.ts`

**Test file:** `apps/docs/tests/unit/generate-docs.test.ts`

**Steps:**

- [ ] Write tests for: generates valid Markdown with correct frontmatter for package with SpecKit artifacts, falls back to source+JSDoc for pre-methodology packages (logs warning), output files have correct Diataxis section placement, generated frontmatter includes all required fields, cross-links between API reference and generated docs are valid
- [ ] Run tests — expect RED (no implementation)
- [ ] Implement package discovery — enumerate `packages/*/` and `apps/*/`, resolve `specDir` and `sourceDir`
- [ ] Implement prompt construction — reads spec.md, plan.md, data-model.md, source files, ADRs, constructs structured prompt
- [ ] Implement output writer — writes Starlight-compatible Markdown with typed DocFrontmatter to `outputDir`
- [ ] Implement pre-methodology fallback — when specDir is empty, use source code + JSDoc comments only
- [ ] Add CLI interface: `pnpm docs:generate --package {name}` (single) or `pnpm docs:generate` (all)
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(docs): add AI documentation generation pipeline from SpecKit artifacts`

---

### Task 4: Markdown-Aware Chunking Strategy

**Goal:** Extend `@tempot/ai-core` with a new chunking strategy that splits by Markdown headings instead of character counts, preserving section metadata.

**Files:** Create:

- `packages/ai-core/src/chunking/markdown-chunker.ts`
- `packages/ai-core/tests/unit/chunking/markdown-chunker.test.ts`

**Files:** Update:

- `packages/ai-core/src/chunking/index.ts` (export new chunker)

**Test file:** `packages/ai-core/tests/unit/chunking/markdown-chunker.test.ts`

**Steps:**

- [ ] Write tests for: splits at `##` headings, splits at `###` headings, preserves section title in metadata, sections under token limit stay intact, sections over 8000 tokens split at paragraph boundaries, empty sections are skipped, frontmatter is excluded from chunks, metadata includes filePath and section
- [ ] Run tests — expect RED (no implementation)
- [ ] Implement `chunkByMarkdownHeadings(content: string, metadata: Partial<DocChunkMetadata>): DocChunkMetadata[]` that parses Markdown structure and splits at heading boundaries
- [ ] Implement paragraph-level fallback for oversized sections (>8000 tokens)
- [ ] Export from chunking index
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(ai-core): add Markdown-aware chunking strategy for documentation`

---

### Task 5: RAG Ingestion Script

**Goal:** Create the `ingest-docs.ts` script that reads documentation Markdown files, chunks them by headings, and ingests into the vector database via `@tempot/ai-core`.

**Files:** Create:

- `apps/docs/scripts/ingest-docs.ts`
- `apps/docs/tests/unit/ingest-docs.test.ts`

**Test file:** `apps/docs/tests/unit/ingest-docs.test.ts`

**Steps:**

- [ ] Write tests for: reads Markdown files from `docs/product/`, extracts frontmatter metadata, chunks by Markdown headings, computes content hash per chunk, calls `ContentIngestionService.ingest()` with `contentType: 'developer-docs'`, incremental mode skips unchanged files (matching hash), full mode (`--full`) re-indexes everything, metadata includes filePath/section/language/package
- [ ] Run tests — expect RED (no implementation)
- [ ] Implement file discovery — recursively finds all `.md` files in `docs/product/`
- [ ] Implement frontmatter extraction — parses YAML frontmatter from each file
- [ ] Implement chunking integration — uses `chunkByMarkdownHeadings()` from Task 4
- [ ] Implement hash-based change detection — stores content hashes, skips unchanged files
- [ ] Implement ingestion — calls `ContentIngestionService.ingest()` for each changed chunk
- [ ] Add CLI interface: `pnpm docs:ingest` (incremental) or `pnpm docs:ingest --full` (full rebuild)
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(docs): add RAG ingestion script with incremental re-indexing`

---

### Task 6: Freshness Detection Script

**Goal:** Create the `check-freshness.ts` script that compares git timestamps of source files vs. documentation to identify stale content.

**Files:** Create:

- `apps/docs/scripts/check-freshness.ts`
- `apps/docs/tests/unit/check-freshness.test.ts`

**Test file:** `apps/docs/tests/unit/check-freshness.test.ts`

**Steps:**

- [ ] Write tests for: source file newer than doc → reports stale with diff timestamp, doc up to date → not stale, all docs fresh → exit code 0 with "all fresh", outputs FreshnessReport per package, handles packages without docs gracefully
- [ ] Run tests — expect RED (no implementation)
- [ ] Implement source-to-doc mapping — for each package, map `packages/{name}/src/` to `docs/product/**/{name}*`
- [ ] Implement git timestamp comparison — use `git log -1 --format=%cI` for both source and doc
- [ ] Implement report output — structured JSON to stdout for CI consumption
- [ ] Add CLI interface: `pnpm docs:freshness`
- [ ] Run tests — expect GREEN
- [ ] Commit: `feat(docs): add freshness detection script for stale documentation`

---

### Task 7: Vale Prose Linting Configuration

**Goal:** Configure Vale prose linter with custom Tempot style rules for documentation quality enforcement in CI.

**Files:** Create:

- `apps/docs/.vale.ini`
- `apps/docs/styles/Tempot/Terminology.yml`
- `apps/docs/styles/Tempot/ProhibitedWords.yml`
- `apps/docs/styles/Tempot/SentenceLength.yml`
- `.github/workflows/docs-lint.yml` (Vale CI step)

**Test file:** N/A (linter configuration)

**Steps:**

- [ ] Create `.vale.ini` with `StylesPath = styles/`, `MinAlertLevel = suggestion`, `Packages = Google`
- [ ] Create `Terminology.yml` with Tempot-specific terms (consistent spelling of project names, package names)
- [ ] Create `ProhibitedWords.yml` to flag deprecated/incorrect terminology
- [ ] Create `SentenceLength.yml` with max sentence length rule
- [ ] Create GitHub Actions workflow that runs Vale on documentation PRs
- [ ] Run `vale docs/product/` locally to verify configuration
- [ ] Commit: `feat(docs): add Vale prose linting with custom Tempot style rules`

---

### Task 8: RTL/LTR Rendering Verification

**Goal:** Verify that the Starlight site correctly handles RTL (Arabic) and LTR (English) rendering, including mixed content with code blocks.

**Files:** Create:

- `apps/docs/tests/e2e/rtl-rendering.test.ts`

**Test file:** `apps/docs/tests/e2e/rtl-rendering.test.ts`

**Steps:**

- [ ] Write tests for: Arabic pages render with `dir="rtl"` attribute, English pages render with `dir="ltr"`, code blocks within RTL pages remain LTR, navigation sidebar renders correctly in both directions, locale switcher navigates to the same page in the other locale
- [ ] Run tests — expect RED
- [ ] Fix any Starlight/Astro configuration needed for correct RTL rendering
- [ ] Run tests — expect GREEN
- [ ] Commit: `test(docs): add RTL/LTR rendering verification tests`

---

### Task 9: Documentation Content Seeding

**Goal:** Create initial documentation content for at least one package per Diataxis section, demonstrating the content structure and frontmatter schema.

**Files:** Create:

- `docs/product/ar/tutorials/getting-started.md`
- `docs/product/en/tutorials/getting-started.md`
- `docs/product/ar/guides/creating-a-module.md`
- `docs/product/en/guides/creating-a-module.md`
- `docs/product/ar/concepts/architecture-overview.md`
- `docs/product/en/concepts/architecture-overview.md`
- `docs/product/ar/user-guide/getting-started.md`
- `docs/product/en/user-guide/getting-started.md`

**Test file:** N/A (content creation)

**Steps:**

- [ ] Create "Getting Started" tutorial in both locales with complete frontmatter
- [ ] Create "Creating a Module" guide in both locales with complete frontmatter
- [ ] Create "Architecture Overview" concept page in both locales with complete frontmatter
- [ ] Create "Getting Started" user guide in both locales with complete frontmatter (Arabic primary)
- [ ] Validate all frontmatter using the validation script from Task 2
- [ ] Run `pnpm build` in `apps/docs` to verify all pages render correctly
- [ ] Commit: `docs: seed initial content for all Diataxis sections in both locales`

---

### Task 10: Integration & Final Validation

**Goal:** Run all scripts end-to-end, verify the full pipeline from generation through ingestion, and ensure all success criteria are met.

**Files:** Create:

- `apps/docs/tests/integration/full-pipeline.test.ts`

**Test file:** `apps/docs/tests/integration/full-pipeline.test.ts`

**Steps:**

- [ ] Write integration test: `pnpm build` in `apps/docs` produces complete site with API reference
- [ ] Write integration test: `pnpm docs:generate --package logger` produces valid Markdown (pre-methodology fallback)
- [ ] Write integration test: `pnpm docs:generate --package shared` produces valid Markdown (with SpecKit artifacts)
- [ ] Write integration test: `pnpm docs:ingest` ingests documentation into vector store
- [ ] Write integration test: `pnpm docs:freshness` correctly identifies stale/fresh docs
- [ ] Write integration test: Vale passes on all seeded content
- [ ] Verify all acceptance criteria from spec.md are met (SC-001 through SC-014)
- [ ] Run full test suite: `pnpm test` in `apps/docs` and `packages/ai-core`
- [ ] Commit: `test(docs): add integration tests for full documentation pipeline`

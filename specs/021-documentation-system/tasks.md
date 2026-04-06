# Documentation System — Task Breakdown

**Feature:** 021-documentation-system
**Source:** spec.md (Complete) + plan.md + data-model.md + research.md
**Generated:** 2026-04-05

---

## Task 0: Project Scaffolding

**Priority:** P0 (prerequisite for all other tasks)
**Estimated time:** 20 min
**FR:** FR-001, FR-003, FR-004, FR-013, FR-014
**Files to create:**

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

**Note:** `apps/docs/` is an APPLICATION, not a package. It does not export anything. The `package.json` name is `docs` (no `@tempot/` prefix). The Starlight site must build successfully before proceeding.

**Acceptance criteria:**

- [ ] All existing documentation moved from `docs/` to `docs/archive/` with directory structure preserved (FR-013)
- [ ] `docs/archive/README.md` exists with zero-deletion policy notice (FR-013)
- [ ] `docs/development/` directory created with subdirectories: `adr/`, `methodology/`, `devlog/`, `retrospectives/` (FR-014)
- [ ] `package.json` includes dependencies: astro, @astrojs/starlight, starlight-typedoc, typedoc, typedoc-plugin-markdown
- [ ] `package.json` includes scripts: `dev`, `build`, `preview`
- [ ] Content is served via directory junction from `apps/docs/src/content/docs/` → `docs/product/` (created by `scripts/setup-content-link.cjs` via `prepare` hook)
- [ ] `astro.config.mjs` configures Starlight with Arabic (`ar`) as default locale (RTL) and English (`en`) as secondary
- [ ] Sidebar configuration includes Diataxis sections: tutorials, guides, reference, concepts, user-guide (FR-004)
- [ ] Landing pages exist for both locales at `docs/product/{ar,en}/index.md` with valid DocFrontmatter (FR-003)
- [ ] Diataxis directory structure created for both locales under `docs/product/` (FR-004)
- [ ] `scripts/docs.types.ts` defines: DocFrontmatter, DocGenerationConfig, DocChunkMetadata, FreshnessReport
- [ ] `pnpm install` succeeds with no errors
- [ ] `pnpm build` in `apps/docs` produces a Starlight site with content from `docs/product/` (FR-001)
- [ ] No `any` types (Rule I)

---

## Task 1: starlight-typedoc API Reference Configuration

**Priority:** P0 (core API reference requirement)
**Estimated time:** 15 min
**FR:** FR-002
**Dependencies:** Task 0
**Files to update:**

- `apps/docs/astro.config.mjs`
  **Files to create:**
- `apps/docs/typedoc.base.json`
  **Test file:** N/A (build-time configuration)

**Acceptance criteria:**

- [ ] Base TypeDoc configuration exists with shared settings (excludePrivate, excludeInternal)
- [ ] `createStarlightTypeDocPlugin()` configured for each `@tempot/*` package with public exports (FR-002)
- [ ] Each plugin instance outputs to `reference/{package-name}/` sidebar section
- [ ] Packages with no public exports (e.g., sentry) have a manual minimal page instead of a plugin instance
- [ ] `pnpm build` in `apps/docs` generates API reference pages per package (SC-002)
- [ ] Each package has its own sidebar section with correct navigation (SC-002)
- [ ] No `any` types (Rule I)

---

## Task 2: Frontmatter Schema & Validation

**Priority:** P0 (required for content integrity and RAG readiness)
**Estimated time:** 15 min
**FR:** FR-009
**Dependencies:** Task 0
**Files to create:**

- `apps/docs/scripts/validate-frontmatter.ts`
- `apps/docs/tests/unit/validate-frontmatter.test.ts`
  **Test file:** `apps/docs/tests/unit/validate-frontmatter.test.ts`

**Acceptance criteria:**

- [ ] `validateFrontmatter()` returns `Result<DocFrontmatter, AppError>` (Rule XXI)
- [ ] Valid frontmatter with all required fields passes validation (FR-009)
- [ ] Missing `title` → returns err
- [ ] Missing `description` → returns err
- [ ] Missing `tags` or empty array → returns err
- [ ] Missing `audience` → returns err
- [ ] Invalid `audience` value → returns err
- [ ] Invalid `contentType` (not `'developer-docs'`) → returns err
- [ ] Optional `package` field accepted when present
- [ ] Optional `difficulty` field accepted when present
- [ ] All required fields present with valid values → returns ok with typed DocFrontmatter (SC-011)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 8: valid full, missing title, missing description, missing tags, missing audience, invalid audience, invalid contentType, optional fields)

---

## Task 3: AI Documentation Generation Pipeline

**Priority:** P1 (AI-first content generation)
**Estimated time:** 30 min
**FR:** FR-005, FR-011
**Dependencies:** Task 0, Task 2
**Files to create:**

- `apps/docs/scripts/generate-docs.ts`
- `apps/docs/tests/unit/generate-docs.test.ts`
  **Test file:** `apps/docs/tests/unit/generate-docs.test.ts`

**Note:** This is a local script using whatever AI tool is available — not a hosted service dependency (D4 in spec.md). The script must handle pre-methodology packages (logger, event-bus, auth-core) gracefully.

**Acceptance criteria:**

- [ ] `generate-docs.ts` discovers packages from `packages/*/` and `apps/*/` (FR-005)
- [ ] For packages with SpecKit artifacts, reads spec.md, plan.md, data-model.md, source files, and ADRs (FR-005)
- [ ] Constructs structured prompts and outputs Starlight-compatible Markdown (FR-005, SC-005)
- [ ] Output files have correct typed DocFrontmatter with all required fields (FR-009, SC-005)
- [ ] Pre-methodology packages (no SpecKit artifacts) fall back to source code + JSDoc comments only (FR-011, SC-006)
- [ ] Logs warning for each missing SpecKit artifact in pre-methodology packages (FR-011, SC-006)
- [ ] Output files are placed in correct Diataxis sections (FR-004)
- [ ] CLI supports `pnpm docs:generate --package {name}` (single) and `pnpm docs:generate` (all)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 5: valid generation with specs, pre-methodology fallback, correct frontmatter, correct placement, CLI args)

---

## Task 4: Markdown-Aware Chunking Strategy

**Priority:** P0 (required for RAG quality)
**Estimated time:** 20 min
**FR:** FR-007
**Dependencies:** None (extends ai-core)
**Files to create:**

- `packages/ai-core/src/chunking/markdown-chunker.ts`
- `packages/ai-core/tests/unit/markdown-chunker.test.ts`
  **Files to update:**
- `packages/ai-core/src/chunking/index.ts`
  **Test file:** `packages/ai-core/tests/unit/markdown-chunker.test.ts`

**Acceptance criteria:**

- [ ] `chunkByMarkdownHeadings()` splits content at `##` heading boundaries (FR-007)
- [ ] Also splits at `###` headings within sections (FR-007)
- [ ] Each chunk includes section title in metadata (FR-007)
- [ ] Sections under token limit remain intact
- [ ] Sections exceeding 8000 tokens split at paragraph boundaries (edge case: large corpus)
- [ ] Empty sections are skipped
- [ ] YAML frontmatter is excluded from chunks
- [ ] Metadata includes filePath, section, language fields (FR-007)
- [ ] Exported from `packages/ai-core/src/chunking/index.ts`
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 8: h2 split, h3 split, metadata, under limit, over limit, empty, frontmatter, filePath)

---

## Task 5: RAG Ingestion Script

**Priority:** P1 (RAG integration)
**Estimated time:** 20 min
**FR:** FR-006, FR-010
**Dependencies:** Task 0, Task 4
**Files to create:**

- `apps/docs/scripts/ingest-docs.ts`
- `apps/docs/tests/unit/ingest-docs.test.ts`
  **Test file:** `apps/docs/tests/unit/ingest-docs.test.ts`

**Acceptance criteria:**

- [ ] Reads all `.md` files from `docs/product/` recursively (FR-006)
- [ ] Extracts YAML frontmatter metadata from each file (FR-006)
- [ ] Chunks content using `chunkByMarkdownHeadings()` from Task 4 (FR-006, FR-007)
- [ ] Computes SHA-256 content hash per chunk (FR-010)
- [ ] Calls `ContentIngestionService.ingest()` with `contentType: 'developer-docs'` (FR-006, SC-007)
- [ ] Metadata includes filePath, section, language, package (SC-007)
- [ ] Incremental mode: skips files with unchanged content hashes (FR-010, SC-008)
- [ ] Full mode (`--full` flag): deletes existing `developer-docs` content and re-indexes everything (FR-010, SC-008)
- [ ] CLI supports `pnpm docs:ingest` (incremental) and `pnpm docs:ingest --full` (full rebuild)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 7: file discovery, frontmatter extraction, chunking, hash computation, ingestion call, incremental skip, full rebuild)

---

## Task 6: Freshness Detection Script

**Priority:** P1 (documentation drift prevention)
**Estimated time:** 15 min
**FR:** FR-008
**Dependencies:** Task 0
**Files to create:**

- `apps/docs/scripts/check-freshness.ts`
- `apps/docs/tests/unit/check-freshness.test.ts`
  **Test file:** `apps/docs/tests/unit/check-freshness.test.ts`

**Acceptance criteria:**

- [ ] Compares git timestamps of source files vs. corresponding documentation files (FR-008)
- [ ] Source file newer than doc → reports stale with diff timestamp (FR-008, SC-009)
- [ ] Doc up to date → reports not stale
- [ ] All docs fresh → exits with code 0 and reports "all fresh" (SC-009)
- [ ] Outputs structured `FreshnessReport` per package to stdout (FR-008)
- [ ] Handles packages without documentation files gracefully (no crash)
- [ ] CLI supports `pnpm docs:freshness`
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 5: stale detection, fresh detection, all fresh exit, structured output, missing docs)

---

## Task 7: Vale Prose Linting Configuration

**Priority:** P2 (quality enforcement)
**Estimated time:** 15 min
**FR:** FR-012
**Dependencies:** Task 0
**Files to create:**

- `apps/docs/.vale.ini`
- `apps/docs/styles/Tempot/Terminology.yml`
- `apps/docs/styles/Tempot/ProhibitedWords.yml`
- `apps/docs/styles/Tempot/SentenceLength.yml`
- `.github/workflows/docs-lint.yml`
  **Test file:** N/A (linter configuration)

**Acceptance criteria:**

- [ ] `.vale.ini` configured with `StylesPath = styles/`, `MinAlertLevel = suggestion`, `Packages = Google` (FR-012)
- [ ] `Terminology.yml` enforces consistent Tempot-specific terminology (FR-012)
- [ ] `ProhibitedWords.yml` flags deprecated or incorrect terminology (FR-012)
- [ ] `SentenceLength.yml` enforces maximum sentence length (FR-012)
- [ ] GitHub Actions workflow runs Vale on documentation PRs
- [ ] `vale docs/product/` runs locally with zero errors on seeded content (SC-010)
- [ ] No `any` types (Rule I)

---

## Task 8: RTL/LTR Rendering Verification

**Priority:** P1 (accessibility and i18n)
**Estimated time:** 15 min
**FR:** FR-003
**Dependencies:** Task 0, Task 9
**Files to create:**

- `apps/docs/tests/e2e/rtl-rendering.test.ts`
  **Test file:** `apps/docs/tests/e2e/rtl-rendering.test.ts`

**Acceptance criteria:**

- [ ] Arabic pages render with `dir="rtl"` attribute (FR-003, SC-003, NFR-004)
- [ ] English pages render with `dir="ltr"` attribute (FR-003, SC-003)
- [ ] Code blocks within RTL pages remain LTR (edge case: RTL mixed content)
- [ ] Navigation sidebar renders correctly in both directions (SC-003)
- [ ] Locale switcher navigates to the same page in the other locale (FR-003)
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 5: RTL attribute, LTR attribute, code blocks, sidebar, locale switcher)

---

## Task 9: Documentation Content Seeding

**Priority:** P1 (demonstrates content structure)
**Estimated time:** 20 min
**FR:** FR-003, FR-004
**Dependencies:** Task 0, Task 2
**Files to create:**

- `docs/product/ar/tutorials/getting-started.md`
- `docs/product/en/tutorials/getting-started.md`
- `docs/product/ar/guides/creating-a-module.md`
- `docs/product/en/guides/creating-a-module.md`
- `docs/product/ar/concepts/architecture-overview.md`
- `docs/product/en/concepts/architecture-overview.md`
- `docs/product/ar/user-guide/getting-started.md`
- `docs/product/en/user-guide/getting-started.md`
  **Test file:** N/A (content creation)

**Acceptance criteria:**

- [ ] "Getting Started" tutorial exists in both locales with complete typed frontmatter (FR-003, FR-004, SC-004)
- [ ] "Creating a Module" guide exists in both locales with complete typed frontmatter (FR-004, SC-004)
- [ ] "Architecture Overview" concept page exists in both locales with complete typed frontmatter (FR-004, SC-004)
- [ ] "Getting Started" user guide exists in both locales with Arabic as primary content (FR-003, FR-004, SC-004)
- [ ] All frontmatter passes validation script from Task 2 (FR-009, SC-011)
- [ ] `pnpm build` in `apps/docs` renders all pages correctly
- [ ] No `any` types (Rule I)

---

## Task 10: Integration & Final Validation

**Priority:** P0 (validation gate)
**Estimated time:** 20 min
**FR:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014
**Dependencies:** Task 0, Task 1, Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 8, Task 9
**Files to create:**

- `apps/docs/tests/integration/full-pipeline.test.ts`
  **Test file:** `apps/docs/tests/integration/full-pipeline.test.ts`

**Acceptance criteria:**

- [ ] `pnpm build` in `apps/docs` produces complete Starlight site with API reference (SC-001, SC-002)
- [ ] `pnpm docs:generate --package logger` produces valid Markdown via pre-methodology fallback (SC-006)
- [ ] `pnpm docs:generate --package shared` produces valid Markdown with SpecKit artifacts (SC-005)
- [ ] `pnpm docs:ingest` ingests documentation into vector store with correct metadata (SC-007)
- [ ] `pnpm docs:ingest --full` re-indexes all content (SC-008)
- [ ] `pnpm docs:freshness` correctly identifies stale/fresh docs (SC-009)
- [ ] Vale passes on all seeded content with zero errors (SC-010)
- [ ] `docs/archive/` contains all previously existing docs, untouched (SC-015)
- [ ] `docs/development/` exists with correct subdirectories, not published via Starlight (SC-016)
- [ ] All documentation pages include typed frontmatter (SC-011)
- [ ] Documentation site loads in under 3 seconds on simulated 3G (SC-012)
- [ ] Full API reference generation completes in under 5 minutes (SC-013)
- [ ] Full RAG ingestion completes in under 10 minutes (SC-014)
- [ ] All acceptance criteria from spec.md (SC-001 through SC-016) verified
- [ ] No `any` types (Rule I)
- [ ] All tests pass (minimum 7: build, generate pre-methodology, generate with specs, ingest, freshness, Vale, frontmatter)

---

## Task Dependency Graph

```
Task 0 (Scaffolding)
├─→ Task 1 (starlight-typedoc)
│   └─→ Task 10 (Integration)
├─→ Task 2 (Frontmatter Validation)
│   ├─→ Task 3 (AI Generation Pipeline)
│   │   └─→ Task 10
│   └─→ Task 9 (Content Seeding)
│       ├─→ Task 8 (RTL/LTR Verification)
│       │   └─→ Task 10
│       └─→ Task 10
├─→ Task 5 (RAG Ingestion)
│   └─→ Task 10
├─→ Task 6 (Freshness Detection)
│   └─→ Task 10
└─→ Task 7 (Vale Linting)
    └─→ Task 10

Task 4 (Markdown Chunking — ai-core)
└─→ Task 5 (RAG Ingestion)
    └─→ Task 10
```

## Summary

| Task | Name                     | Priority | Est. Time   | FR Coverage                            |
| ---- | ------------------------ | -------- | ----------- | -------------------------------------- |
| 0    | Project Scaffolding      | P0       | 20 min      | FR-001, FR-003, FR-004, FR-013, FR-014 |
| 1    | starlight-typedoc Config | P0       | 15 min      | FR-002                                 |
| 2    | Frontmatter Validation   | P0       | 15 min      | FR-009                                 |
| 3    | AI Generation Pipeline   | P1       | 30 min      | FR-005, FR-011                         |
| 4    | Markdown-Aware Chunking  | P0       | 20 min      | FR-007                                 |
| 5    | RAG Ingestion Script     | P1       | 20 min      | FR-006, FR-010                         |
| 6    | Freshness Detection      | P1       | 15 min      | FR-008                                 |
| 7    | Vale Prose Linting       | P2       | 15 min      | FR-012                                 |
| 8    | RTL/LTR Verification     | P1       | 15 min      | FR-003                                 |
| 9    | Content Seeding          | P1       | 20 min      | FR-003, FR-004                         |
| 10   | Integration & Validation | P0       | 20 min      | FR-001 through FR-014 (all)            |
|      | **Total**                |          | **205 min** |                                        |

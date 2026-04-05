# Data Model: Documentation System

## Entities

### `DocFrontmatter`

Typed frontmatter schema for all documentation pages, used for rendering metadata and RAG ingestion.

**Storage:** Embedded in Markdown files as YAML frontmatter.

| Field       | Type                                         | Description                                        | Constraints / Validation                          |
| ----------- | -------------------------------------------- | -------------------------------------------------- | ------------------------------------------------- |
| title       | `string`                                     | Page title displayed in navigation and browser tab | Required, max 100 characters                      |
| description | `string`                                     | Brief page description for SEO and search          | Required, max 200 characters                      |
| tags        | `string[]`                                   | Categorization tags for search and filtering       | Required, at least 1 tag                          |
| audience    | `('developer' \| 'user')[]`                  | Target audience(s) for the page                    | Required, at least 1 audience                     |
| package     | `string`                                     | Associated `@tempot/*` package name                | Optional, must match a valid package if present   |
| contentType | `'developer-docs'`                           | Maps to `AIContentType` enum for RAG ingestion     | Required, fixed value `'developer-docs'`          |
| difficulty  | `'beginner' \| 'intermediate' \| 'advanced'` | Content difficulty level                           | Optional, defaults to `'intermediate'` if omitted |

---

### `DocGenerationConfig`

Configuration for the AI documentation generation pipeline, specifying source and output paths per package.

**Storage:** Computed at runtime by `generate-docs.ts` script from package discovery.

| Field       | Type           | Description                                          | Constraints / Validation                      |
| ----------- | -------------- | ---------------------------------------------------- | --------------------------------------------- |
| packageName | `string`       | Name of the package being documented                 | Required, must match a workspace package      |
| specDir     | `string`       | Path to `specs/{NNN}-{feature}/`                     | Optional — empty for pre-methodology packages |
| sourceDir   | `string`       | Path to `packages/{name}/src/` or `apps/{name}/src/` | Required, must exist on filesystem            |
| outputDir   | `string`       | Path to `apps/docs/src/content/docs/`                | Required, created if not exists               |
| locale      | `'ar' \| 'en'` | Target language for generation                       | Required                                      |

---

### `DocChunkMetadata`

Metadata associated with each documentation chunk during RAG ingestion.

**Storage:** Stored in vector database alongside embedding vectors via `@tempot/ai-core`.

| Field       | Type     | Description                                       | Constraints / Validation                        |
| ----------- | -------- | ------------------------------------------------- | ----------------------------------------------- |
| filePath    | `string` | Path to the source Markdown file                  | Required, relative to `apps/docs/`              |
| section     | `string` | Heading text of the section this chunk belongs to | Required, extracted from `##` or `###` headings |
| language    | `string` | Language code (`ar` or `en`)                      | Required, derived from file path locale         |
| package     | `string` | Associated package name from frontmatter          | Optional, may be absent for general docs        |
| contentHash | `string` | SHA-256 hash of the chunk content                 | Required, used for incremental re-indexing      |

---

### `FreshnessReport`

Output of the freshness detection script comparing source vs. documentation timestamps.

**Storage:** Transient — output to stdout/CI logs only.

| Field       | Type      | Description                                     | Constraints / Validation |
| ----------- | --------- | ----------------------------------------------- | ------------------------ |
| package     | `string`  | Package being checked                           | Required                 |
| sourceFile  | `string`  | Path to the most recently modified source file  | Required                 |
| docFile     | `string`  | Path to the corresponding documentation file    | Required                 |
| sourceMtime | `string`  | Last modification time of the source file (ISO) | Required, from git log   |
| docMtime    | `string`  | Last modification time of the doc file (ISO)    | Required, from git log   |
| isStale     | `boolean` | True if sourceMtime > docMtime                  | Computed                 |

---

### `StarlightConfig`

Starlight configuration for the documentation site.

**Storage:** File-based — `apps/docs/astro.config.mjs`.

| Field         | Type     | Description                                     | Constraints / Validation                                             |
| ------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| title         | `string` | Site title                                      | `'Tempot Documentation'`                                             |
| defaultLocale | `string` | Default locale for the site                     | `'ar'` (Arabic primary)                                              |
| locales       | `object` | Locale configuration for i18n                   | `{ ar: { label: 'العربية', dir: 'rtl' }, en: { label: 'English' } }` |
| social        | `object` | Social links in site header                     | GitHub repository link                                               |
| sidebar       | `array`  | Navigation sidebar configuration                | Auto-generated per section + starlight-typedoc                       |
| plugins       | `array`  | Starlight plugins (starlight-typedoc instances) | One per `@tempot/*` package with public exports                      |

---

### `ValeConfig`

Vale prose linter configuration for documentation quality enforcement.

**Storage:** File-based — `apps/docs/.vale.ini` and `apps/docs/styles/Tempot/`.

| Field         | Type       | Description                   | Constraints / Validation                       |
| ------------- | ---------- | ----------------------------- | ---------------------------------------------- |
| StylesPath    | `string`   | Path to custom style rules    | `styles/`                                      |
| MinAlertLevel | `string`   | Minimum alert level to report | `suggestion`                                   |
| Packages      | `string[]` | Vale packages to use          | `['Google']` (base style guide)                |
| customRules   | `object`   | Tempot-specific rules         | Terminology, prohibited words, sentence length |

## Relationships

```
DocFrontmatter
  └─→ embedded in every Markdown file in apps/docs/src/content/docs/
       ├── contentType → maps to AIContentType for RAG ingestion
       ├── package → links doc to @tempot/* package
       └── audience + difficulty → enables filtered retrieval

DocGenerationConfig
  └─→ computed per package by generate-docs.ts
       ├── specDir → reads spec.md, plan.md, data-model.md
       ├── sourceDir → reads .ts source + JSDoc comments
       └── outputDir → writes Starlight-compatible Markdown

DocChunkMetadata
  └─→ produced by docs:ingest script
       ├── filePath → source Markdown file
       ├── section → heading-based chunk boundary
       ├── contentHash → enables incremental re-indexing
       └── stored in vector DB via @tempot/ai-core

FreshnessReport
  └─→ produced by freshness detection script
       ├── compares git timestamps of source vs. docs
       └── outputs to CI logs

StarlightConfig
  └─→ apps/docs/astro.config.mjs
       ├── locales → Arabic (RTL) + English (LTR)
       ├── sidebar → auto-generated sections
       └── plugins → starlight-typedoc per package

ValeConfig
  └─→ apps/docs/.vale.ini
       └── enforces prose quality in CI
```

## Storage Mechanisms

- **File-based (config):** StarlightConfig (`astro.config.mjs`), ValeConfig (`.vale.ini`), TypeDoc configs
- **File-based (content):** Markdown documentation files with DocFrontmatter in `src/content/docs/`
- **Vector database:** DocChunkMetadata stored alongside embeddings via `@tempot/ai-core`
- **Transient:** FreshnessReport (stdout/CI output only), DocGenerationConfig (runtime-computed)

## Data Flow

```
Source Code + SpecKit Artifacts
  │
  ├─→ generate-docs.ts (AI pipeline)
  │     ├── reads: spec.md, plan.md, data-model.md, source .ts files, ADRs
  │     ├── constructs structured prompts
  │     ├── calls AI model
  │     └── outputs: Starlight Markdown with DocFrontmatter
  │           │
  │           ├─→ apps/docs/src/content/docs/{locale}/tutorials/
  │           ├─→ apps/docs/src/content/docs/{locale}/guides/
  │           ├─→ apps/docs/src/content/docs/{locale}/concepts/
  │           └─→ apps/docs/src/content/docs/{locale}/user-guide/
  │
  ├─→ starlight-typedoc (build-time)
  │     ├── reads: packages/*/src/**/*.ts (TypeDoc)
  │     └── outputs: apps/docs/src/content/docs/reference/{package}/
  │
  └─→ freshness detection script
        ├── compares git timestamps: source vs. docs
        └── reports stale docs in CI

Starlight Build (pnpm build in apps/docs)
  │
  ├── reads all Markdown from src/content/docs/
  ├── starlight-typedoc generates API reference at build time
  └── outputs static site to apps/docs/dist/

RAG Ingestion (pnpm docs:ingest)
  │
  ├── reads all Markdown from apps/docs/src/content/docs/
  ├── extracts DocFrontmatter metadata
  ├── splits content by Markdown headings (## / ###)
  ├── computes content hashes for incremental detection
  └── calls ContentIngestionService.ingest() from @tempot/ai-core
        └── stores vectors + DocChunkMetadata in pgvector
```

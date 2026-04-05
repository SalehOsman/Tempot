# Documentation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Starlight (Astro) documentation platform at `apps/docs/`, extend `@tempot/ai-core` with Markdown-aware chunking, and restructure the `docs/` directory with archive/development/product separation. The platform serves 4 audiences, organizes content via Diataxis, auto-generates API reference from TypeDoc, provides AI documentation generation from SpecKit artifacts, integrates with the RAG pipeline, and enforces prose quality via Vale.

**Architecture:** Documentation content lives in `docs/` at project root in three directories: `docs/archive/` (existing docs, read-only), `docs/development/` (ADRs, methodology — NOT published), `docs/product/` (user/developer-facing, organized by locale and Diataxis). The Starlight app in `apps/docs/` reads content via `contentDir: '../../docs/product/'`. Scripts in `apps/docs/scripts/` handle generation, ingestion, freshness. Markdown chunking extends `@tempot/ai-core` additively.

**Tech Stack:** Astro 5.x, @astrojs/starlight, starlight-typedoc, TypeDoc, typedoc-plugin-markdown, Zod (frontmatter validation), Cheerio (E2E tests), Vale (prose linting), Vitest 4.1.0, TypeScript 5.9.3 Strict, neverthrow 8.2.0.

**Key References:**

- Spec: `specs/021-documentation-system/spec.md`
- Design doc: `docs/archive/superpowers/specs/2026-04-05-documentation-system-design.md` (post archive migration)
- Plan: `specs/021-documentation-system/plan.md`
- Tasks: `specs/021-documentation-system/tasks.md`
- Data model: `specs/021-documentation-system/data-model.md`
- Research: `specs/021-documentation-system/research.md`
- Constitution: `.specify/memory/constitution.md`

**Design Decisions (from design doc):**

- DC-1: `contentDir: '../../docs/product/'` works — pnpm workspace root auto-detected by Vite
- DC-2: `git mv` per top-level item for archive migration (preserves git blame)
- DC-3: Hardcode `DOCUMENTED_PACKAGES` array for TypeDoc (Rule V simplicity)
- DC-4: AI generation = prompt constructor + output formatter; prompt-only default
- DC-5: API reference NOT indexed by RAG — build-time only
- DC-6: Standalone `chunkByMarkdownHeadings()` in `src/chunking/` — does NOT modify existing chunker
- DC-7: Cheerio for E2E RTL tests (no Playwright needed)
- DC-8: Cross-reference updates in Documentation Sync (Phase 7)

---

## File Structure

```
apps/docs/
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── .vale.ini
├── typedoc.base.json
├── src/
│   └── (Astro boilerplate only)
├── scripts/
│   ├── docs.types.ts
│   ├── validate-frontmatter.ts
│   ├── generate-docs.ts
│   ├── ingest-docs.ts
│   └── check-freshness.ts
├── styles/
│   └── Tempot/
│       ├── Terminology.yml
│       ├── ProhibitedWords.yml
│       └── SentenceLength.yml
├── tests/
│   ├── unit/
│   │   ├── validate-frontmatter.test.ts
│   │   ├── generate-docs.test.ts
│   │   ├── ingest-docs.test.ts
│   │   └── check-freshness.test.ts
│   ├── integration/
│   │   └── full-pipeline.test.ts
│   └── e2e/
│       └── rtl-rendering.test.ts
└── dist/                         # Build output (gitignored)

docs/
├── archive/                      # All pre-existing docs moved here
│   ├── README.md                 # Zero-deletion policy notice
│   ├── QUICK-START.md
│   ├── ROADMAP.md
│   ├── tempot_v11_final.md
│   ├── Tempot_Logo.png
│   ├── Tempot_Logo_O.png
│   ├── adr/
│   ├── architecture/
│   ├── deployment/
│   ├── developer/
│   ├── guides/
│   ├── legal/
│   ├── operations/
│   ├── security/
│   └── superpowers/
├── development/                  # Project internals (NOT published)
│   ├── adr/
│   ├── methodology/
│   ├── devlog/
│   └── retrospectives/
└── product/                      # Published via Starlight
    ├── ar/
    │   ├── index.md
    │   ├── tutorials/
    │   │   └── getting-started.md
    │   ├── guides/
    │   │   └── creating-a-module.md
    │   ├── concepts/
    │   │   └── architecture-overview.md
    │   └── user-guide/
    │       └── getting-started.md
    └── en/
        ├── index.md
        ├── tutorials/
        │   └── getting-started.md
        ├── guides/
        │   └── creating-a-module.md
        ├── concepts/
        │   └── architecture-overview.md
        └── user-guide/
            └── getting-started.md

packages/ai-core/
├── src/
│   ├── chunking/                 # NEW directory
│   │   ├── index.ts
│   │   └── markdown-chunker.ts
│   └── index.ts                  # Add export from ./chunking/index.js
└── tests/
    └── unit/
        └── markdown-chunker.test.ts

.github/workflows/
└── docs-lint.yml                 # Vale CI workflow
```

---

### Task 0: Project Scaffolding

**Goal:** Move all existing docs to `docs/archive/`, create directory structure, scaffold `apps/docs/` with Starlight, and define shared types.

**Files:**

- Move: all files from `docs/` to `docs/archive/` (via `git mv`)
- Create: `docs/archive/README.md`
- Create: `docs/development/{adr,methodology,devlog,retrospectives}/` directories
- Create: `docs/product/{ar,en}/{tutorials,guides,concepts,user-guide}/` directories
- Create: `docs/product/ar/index.md`, `docs/product/en/index.md`
- Create: `apps/docs/package.json`
- Create: `apps/docs/astro.config.mjs`
- Create: `apps/docs/tsconfig.json`
- Create: `apps/docs/vitest.config.ts`
- Create: `apps/docs/.gitignore`
- Create: `apps/docs/scripts/docs.types.ts`

- [ ] **Step 1: Create archive directory and migrate docs** (~5 min)

Create `docs/archive/` and `git mv` every top-level item in `docs/` to `docs/archive/`:

```powershell
mkdir docs/archive
git mv docs/QUICK-START.md docs/archive/QUICK-START.md
git mv docs/ROADMAP.md docs/archive/ROADMAP.md
git mv docs/tempot_v11_final.md docs/archive/tempot_v11_final.md
git mv docs/Tempot_Logo.png docs/archive/Tempot_Logo.png
git mv docs/Tempot_Logo_O.png docs/archive/Tempot_Logo_O.png
git mv docs/adr docs/archive/adr
git mv docs/architecture docs/archive/architecture
git mv docs/deployment docs/archive/deployment
git mv docs/developer docs/archive/developer
git mv docs/guides docs/archive/guides
git mv docs/legal docs/archive/legal
git mv docs/operations docs/archive/operations
git mv docs/security docs/archive/security
git mv docs/superpowers docs/archive/superpowers
```

Then verify with `git status` — should show only renames, zero deletions.

- [ ] **Step 2: Create archive README** (~2 min)

Create `docs/archive/README.md`:

```markdown
# Archived Documentation

> **Zero-Deletion Policy**: These files were archived on 2026-04-05 as part of the
> documentation system restructuring (Feature 021). They are preserved for historical
> reference and git blame attribution.
>
> **DO NOT EDIT** files in this directory. They are read-only snapshots.
>
> - Active product documentation: `docs/product/`
> - Active development documentation: `docs/development/`
```

- [ ] **Step 3: Create development directories** (~1 min)

```powershell
mkdir docs/development/adr
mkdir docs/development/methodology
mkdir docs/development/devlog
mkdir docs/development/retrospectives
```

Add a `.gitkeep` to each empty directory so git tracks them.

- [ ] **Step 4: Create product directories with Diataxis structure** (~2 min)

```powershell
# Arabic (primary)
mkdir docs/product/ar/tutorials
mkdir docs/product/ar/guides
mkdir docs/product/ar/concepts
mkdir docs/product/ar/user-guide

# English (secondary)
mkdir docs/product/en/tutorials
mkdir docs/product/en/guides
mkdir docs/product/en/concepts
mkdir docs/product/en/user-guide
```

Add `.gitkeep` to empty directories.

- [ ] **Step 5: Create landing pages** (~3 min)

Create `docs/product/ar/index.md`:

```markdown
---
title: توثيق تمبوت
description: الصفحة الرئيسية لتوثيق منصة تمبوت
tags:
  - documentation
  - home
audience:
  - end-user
  - bot-developer
  - package-developer
  - operator
contentType: developer-docs
---

# مرحبًا بك في توثيق تمبوت

منصة تمبوت هي إطار عمل متقدم لبناء بوتات تيليجرام للمؤسسات.
```

Create `docs/product/en/index.md`:

```markdown
---
title: Tempot Documentation
description: Main documentation page for the Tempot bot framework
tags:
  - documentation
  - home
audience:
  - end-user
  - bot-developer
  - package-developer
  - operator
contentType: developer-docs
---

# Welcome to Tempot Documentation

Tempot is an enterprise Telegram bot framework built with TypeScript.
```

- [ ] **Step 6: Create apps/docs/package.json** (~3 min)

```json
{
  "name": "docs",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "docs:generate": "tsx scripts/generate-docs.ts",
    "docs:ingest": "tsx scripts/ingest-docs.ts",
    "docs:freshness": "tsx scripts/check-freshness.ts",
    "docs:validate": "tsx scripts/validate-frontmatter.ts"
  },
  "dependencies": {
    "astro": "^5.7.10",
    "@astrojs/starlight": "^0.34.3",
    "starlight-typedoc": "^0.22.0",
    "typedoc": "^0.28.4",
    "typedoc-plugin-markdown": "^4.6.3"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "cheerio": "^1.0.0",
    "neverthrow": "8.2.0",
    "tsx": "^4.0.0",
    "vitest": "4.1.0",
    "zod": "^3.24.0"
  }
}
```

Note: `neverthrow` and `zod` are devDependencies because they're used by scripts/tests only, not the Astro site itself. Versions pinned per Constitution Rule LXXVI.

- [ ] **Step 7: Create apps/docs/astro.config.mjs** (~3 min)

Initial configuration with Starlight, i18n, and Diataxis sidebar. TypeDoc plugins will be added in Task 1.

```javascript
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Tempot Documentation',
      defaultLocale: 'ar',
      locales: {
        ar: { label: 'العربية', dir: 'rtl' },
        en: { label: 'English' },
      },
      sidebar: [
        {
          label: 'الدروس التعليمية',
          autogenerate: { directory: 'tutorials' },
          translations: { en: 'Tutorials' },
        },
        {
          label: 'الأدلة الإرشادية',
          autogenerate: { directory: 'guides' },
          translations: { en: 'Guides' },
        },
        {
          label: 'المفاهيم',
          autogenerate: { directory: 'concepts' },
          translations: { en: 'Concepts' },
        },
        {
          label: 'دليل المستخدم',
          autogenerate: { directory: 'user-guide' },
          translations: { en: 'User Guide' },
        },
      ],
      social: { github: 'https://github.com/SalehOsman/Tempot' },
    }),
  ],
  srcDir: './src',
  outDir: './dist',
  contentDir: '../../docs/product/',
});
```

Note: `contentDir` is set at the top-level Astro config level, not inside Starlight. Exact API position may need adjustment during implementation based on Starlight 0.34 API.

- [ ] **Step 8: Create apps/docs/tsconfig.json** (~1 min)

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

Astro projects extend Astro's tsconfig, not the monorepo root.

- [ ] **Step 9: Create apps/docs/vitest.config.ts** (~2 min)

```typescript
import { defineConfig, defineProject } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      }),
      defineProject({
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      }),
      defineProject({
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.test.ts'],
          environment: 'node',
        },
      }),
    ],
  },
});
```

- [ ] **Step 10: Create apps/docs/.gitignore** (~1 min)

```
dist/
node_modules/
.astro/
```

- [ ] **Step 11: Create scripts/docs.types.ts** (~3 min)

Define all shared types from data-model.md:

```typescript
/** Frontmatter schema for all documentation pages */
export interface DocFrontmatter {
  title: string;
  description: string;
  tags: string[];
  audience: DocAudience[];
  package?: string;
  contentType: 'developer-docs';
  difficulty?: DocDifficulty;
}

export type DocAudience = 'package-developer' | 'bot-developer' | 'operator' | 'end-user';
export type DocDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** Configuration for the AI documentation generation pipeline */
export interface DocGenerationConfig {
  packageName: string;
  specDir: string;
  sourceDir: string;
  outputDir: string;
  locale: 'ar' | 'en';
}

/** Chunk metadata for RAG ingestion */
export interface DocChunkMetadata {
  filePath: string;
  section: string;
  language: string;
  package?: string;
  contentHash: string;
}

/** Output of the freshness detection script */
export interface FreshnessReport {
  package: string;
  sourceFile: string;
  docFile: string;
  sourceMtime: string;
  docMtime: string;
  isStale: boolean;
}
```

- [ ] **Step 12: Run pnpm install** (~2 min)

```bash
pnpm install
```

Verify workspace resolution succeeds. Check for any dependency conflicts.

- [ ] **Step 13: Build Starlight site** (~3 min)

```bash
cd apps/docs && pnpm build
```

Verify the site builds and outputs to `apps/docs/dist/`. The built site should include the two landing pages from `docs/product/`.

- [ ] **Step 14: Verify archive integrity** (~1 min)

Confirm all 114 files from the original `docs/` now exist under `docs/archive/` with no deletions.

- [ ] **Step 15: Commit** (~1 min)

```
git add -A
git commit -m "chore(docs): scaffold Starlight documentation site with i18n, Diataxis structure, and content relocation"
```

---

### Task 1: starlight-typedoc API Reference Configuration

**Goal:** Configure per-package TypeDoc API reference generation using `starlight-typedoc`.

**Files:**

- Create: `apps/docs/typedoc.base.json`
- Update: `apps/docs/astro.config.mjs`

- [ ] **Step 1: Create typedoc.base.json** (~2 min)

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "excludePrivate": true,
  "excludeInternal": true,
  "excludeExternals": true,
  "hideGenerator": true,
  "readme": "none",
  "entryPointStrategy": "resolve"
}
```

- [ ] **Step 2: Update astro.config.mjs with TypeDoc plugins** (~5 min)

Import `createStarlightTypeDocPlugin` from `starlight-typedoc` and configure one plugin instance per documented package:

```javascript
import { createStarlightTypeDocPlugin } from 'starlight-typedoc';

const DOCUMENTED_PACKAGES = [
  'shared',
  'logger',
  'event-bus',
  'auth-core',
  'session-manager',
  'i18n-core',
  'database',
  'storage-engine',
  'ux-helpers',
  'ai-core',
  'input-engine',
  'settings',
  'module-registry',
  'regional-engine',
  'sentry',
];

// Generate one plugin instance per package
const typeDocPlugins = DOCUMENTED_PACKAGES.map((pkg) => {
  const [plugin, sidebar] = createStarlightTypeDocPlugin();
  return {
    plugin: plugin({
      entryPoints: [`../../packages/${pkg}/src/index.ts`],
      tsconfig: `../../packages/${pkg}/tsconfig.json`,
      output: `reference/${pkg}`,
      typeDoc: { extends: ['../../apps/docs/typedoc.base.json'] },
    }),
    sidebar,
  };
});
```

Then integrate into the Starlight config:

```javascript
starlight({
  plugins: typeDocPlugins.map(({ plugin }) => plugin),
  sidebar: [
    // ... Diataxis sections ...
    {
      label: 'المرجع البرمجي',
      translations: { en: 'API Reference' },
      items: typeDocPlugins.map(({ sidebar }) => sidebar),
    },
  ],
});
```

Note: The exact `createStarlightTypeDocPlugin` API may differ. Verify against `starlight-typedoc@0.22.0` docs during implementation.

- [ ] **Step 3: Build and verify** (~3 min)

```bash
cd apps/docs && pnpm build
```

Verify API reference pages are generated under `dist/reference/{package}/` for each package.

- [ ] **Step 4: Commit** (~1 min)

```
git add -A
git commit -m "feat(docs): configure starlight-typedoc for per-package API reference"
```

---

### Task 2: Frontmatter Schema & Validation

**Goal:** Create Zod-based frontmatter validation returning `Result<DocFrontmatter, AppError>`.

**Files:**

- Create: `apps/docs/scripts/validate-frontmatter.ts`
- Create: `apps/docs/tests/unit/validate-frontmatter.test.ts`

- [ ] **Step 1: Write validation tests** (~5 min)

Create `tests/unit/validate-frontmatter.test.ts` with these test cases:

1. Valid frontmatter with all required fields → returns `ok(DocFrontmatter)`
2. Missing `title` → returns `err` with descriptive message
3. Missing `description` → returns `err`
4. Missing `tags` → returns `err`
5. Empty `tags` array → returns `err`
6. Missing `audience` → returns `err`
7. Invalid `audience` value (e.g., `'admin'`) → returns `err`
8. Invalid `contentType` (e.g., `'blog'`) → returns `err`
9. Optional `package` field accepted when present → `ok`
10. Optional `difficulty` field accepted when present → `ok`
11. All optional fields omitted → `ok` (only required fields)

Import types from `../scripts/docs.types.js` (`.js` extension per NodeNext).

- [ ] **Step 2: Run tests — expect RED** (~1 min)

```bash
cd apps/docs && pnpm vitest run tests/unit/validate-frontmatter.test.ts
```

- [ ] **Step 3: Implement validate-frontmatter.ts** (~5 min)

```typescript
import { z } from 'zod';
import { ok, err, type Result } from 'neverthrow';
import type { DocFrontmatter } from './docs.types.js';

const DOC_AUDIENCES = ['package-developer', 'bot-developer', 'operator', 'end-user'] as const;
const DOC_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

const docFrontmatterSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(200),
  tags: z.array(z.string()).min(1),
  audience: z.array(z.enum(DOC_AUDIENCES)).min(1),
  package: z.string().optional(),
  contentType: z.literal('developer-docs'),
  difficulty: z.enum(DOC_DIFFICULTIES).optional(),
});

export function validateFrontmatter(data: unknown): Result<DocFrontmatter, AppError> {
  const result = docFrontmatterSchema.safeParse(data);
  if (!result.success) {
    return err(new AppError('INVALID_FRONTMATTER', result.error.issues[0].message));
  }
  return ok(result.data);
}
```

Note: Import `AppError` from `@tempot/shared` if available as workspace dependency, otherwise define a local error type.

- [ ] **Step 4: Run tests — expect GREEN** (~1 min)

```bash
cd apps/docs && pnpm vitest run tests/unit/validate-frontmatter.test.ts
```

- [ ] **Step 5: Commit** (~1 min)

```
git add -A
git commit -m "feat(docs): add frontmatter schema validation with Zod"
```

---

### Task 3: AI Documentation Generation Pipeline

**Goal:** Create `generate-docs.ts` that discovers packages, reads SpecKit artifacts + source code, and constructs structured prompts for Starlight-compatible Markdown.

**Files:**

- Create: `apps/docs/scripts/generate-docs.ts`
- Create: `apps/docs/tests/unit/generate-docs.test.ts`

- [ ] **Step 1: Write generation tests** (~5 min)

Create `tests/unit/generate-docs.test.ts` with:

1. Discovers packages from `packages/*/` (reads filesystem, finds package.json)
2. For package with SpecKit artifacts (e.g., `shared`), constructs prompt including spec.md, plan.md, data-model.md, source files
3. For pre-methodology package (e.g., `logger`), falls back to source + JSDoc only, logs warning
4. Output includes correct typed DocFrontmatter with all required fields
5. Output places files in correct Diataxis section directories
6. CLI `--package` flag filters to a single package

Mock filesystem reads with `vi.mock('node:fs/promises')`.

- [ ] **Step 2: Run tests — expect RED** (~1 min)

- [ ] **Step 3: Implement package discovery** (~3 min)

Read `packages/*/package.json` and `apps/*/package.json` to discover packages. For each, resolve:

- `specDir`: `specs/{feature-number}-{name}/` if exists, empty string otherwise
- `sourceDir`: `packages/{name}/src/` or `apps/{name}/src/`

- [ ] **Step 4: Implement prompt construction** (~5 min)

`buildDocPrompt(ctx: PromptContext): string` — reads spec.md, plan.md, data-model.md, source files, ADRs. Constructs a structured prompt that instructs the AI model to generate Starlight-compatible Markdown with typed frontmatter.

- [ ] **Step 5: Implement output formatter** (~3 min)

`processAIResponse(response: string, config: DocGenerationConfig): Result<DocOutput, AppError>` — validates the AI response has correct frontmatter, writes to correct Diataxis directory.

- [ ] **Step 6: Implement pre-methodology fallback** (~3 min)

When `specDir` is empty (logger, event-bus, auth-core), use source code + JSDoc comments only. Log warning via `process.stderr.write()`.

- [ ] **Step 7: Add CLI interface** (~3 min)

Parse `process.argv` for `--package {name}` (single) or no args (all). Default mode: prompt-only (outputs prompt to stdout). `--generate` mode: calls AI model if provider configured.

- [ ] **Step 8: Run tests — expect GREEN** (~1 min)

- [ ] **Step 9: Commit** (~1 min)

```
git add -A
git commit -m "feat(docs): add AI documentation generation pipeline from SpecKit artifacts"
```

---

### Task 4: Markdown-Aware Chunking Strategy

**Goal:** Extend `@tempot/ai-core` with `chunkByMarkdownHeadings()` that splits content at heading boundaries with section metadata.

**Files:**

- Create: `packages/ai-core/src/chunking/markdown-chunker.ts`
- Create: `packages/ai-core/src/chunking/index.ts`
- Create: `packages/ai-core/tests/unit/markdown-chunker.test.ts`
- Update: `packages/ai-core/src/index.ts` (add export)

- [ ] **Step 1: Write chunking tests** (~5 min)

Create `tests/unit/markdown-chunker.test.ts` (flat in `tests/unit/` per ai-core convention):

1. Splits content at `##` heading boundaries → returns one chunk per section
2. Splits at `###` headings within sections → sub-sections become separate chunks
3. Each chunk includes section title in metadata
4. Sections under token limit (~8000 tokens) remain intact
5. Sections exceeding 8000 tokens split at paragraph boundaries
6. Empty sections are skipped
7. YAML frontmatter is excluded from chunks
8. Metadata includes filePath, section, language fields
9. Returns `ContentChunk[]` (same type as existing chunker)

- [ ] **Step 2: Run tests — expect RED** (~1 min)

```bash
cd packages/ai-core && pnpm vitest run tests/unit/markdown-chunker.test.ts
```

- [ ] **Step 3: Create chunking directory and barrel** (~2 min)

Create `src/chunking/index.ts`:

```typescript
export { chunkByMarkdownHeadings } from './markdown-chunker.js';
```

- [ ] **Step 4: Implement markdown-chunker.ts** (~5 min)

```typescript
import type { ContentChunk } from '../ai-core.types.js';

export interface MarkdownChunkMetadata {
  filePath: string;
  section: string;
  language: string;
  package?: string;
}

export function chunkByMarkdownHeadings(
  content: string,
  metadata: MarkdownChunkMetadata,
): ContentChunk[] {
  // 1. Strip YAML frontmatter
  // 2. Split on ## headings (primary boundaries)
  // 3. Within each section, split on ### headings
  // 4. For sections > 8000 tokens (~32000 chars), split at paragraph boundaries
  // 5. Skip empty sections
  // 6. Attach metadata to each chunk
}
```

Algorithm:

- Use regex `/^---\n[\s\S]*?\n---\n/` to strip frontmatter
- Split on `/^## /m` for primary sections
- Within each, split on `/^### /m` for sub-sections
- Token estimation: ~4 chars per token → 8000 tokens = 32000 chars
- Paragraph split: split on `/\n\n+/` and accumulate until limit

- [ ] **Step 5: Update ai-core barrel export** (~1 min)

Add to `packages/ai-core/src/index.ts`:

```typescript
// Chunking
export { chunkByMarkdownHeadings } from './chunking/index.js';
export type { MarkdownChunkMetadata } from './chunking/markdown-chunker.js';
```

- [ ] **Step 6: Run tests — expect GREEN** (~1 min)

- [ ] **Step 7: Commit** (~1 min)

```
git add -A
git commit -m "feat(ai-core): add Markdown-aware chunking strategy for documentation"
```

---

### Task 5: RAG Ingestion Script

**Goal:** Create `ingest-docs.ts` that reads Markdown from `docs/product/`, chunks by headings, and ingests into the vector database.

**Files:**

- Create: `apps/docs/scripts/ingest-docs.ts`
- Create: `apps/docs/tests/unit/ingest-docs.test.ts`

- [ ] **Step 1: Write ingestion tests** (~5 min)

Create `tests/unit/ingest-docs.test.ts`:

1. Discovers all `.md` files from `docs/product/` recursively
2. Extracts YAML frontmatter metadata from each file
3. Chunks content using `chunkByMarkdownHeadings()`
4. Computes SHA-256 content hash per chunk
5. Calls ingestion service with `contentType: 'developer-docs'`
6. Metadata includes filePath, section, language, package
7. Incremental mode: skips files with unchanged content hashes
8. Full mode (`--full`): deletes existing content and re-indexes

Mock `chunkByMarkdownHeadings` and `ContentIngestionService`.

- [ ] **Step 2: Run tests — expect RED** (~1 min)

- [ ] **Step 3: Implement file discovery** (~3 min)

Recursively find all `.md` files in `docs/product/` using `node:fs/promises` `readdir` with `recursive: true`.

- [ ] **Step 4: Implement frontmatter extraction** (~2 min)

Parse YAML frontmatter between `---` delimiters. Extract `package`, `contentType`, and other metadata.

- [ ] **Step 5: Implement hash-based change detection** (~3 min)

Compute SHA-256 of file content. Store hashes in `.docs-hashes.json` in `apps/docs/`. On incremental run, skip files with matching hashes.

- [ ] **Step 6: Implement ingestion integration** (~3 min)

Import `chunkByMarkdownHeadings` from `@tempot/ai-core`. For each changed file, chunk and call `ContentIngestionService.ingest()` with `contentType: 'developer-docs'` and full metadata.

- [ ] **Step 7: Add CLI interface** (~2 min)

`pnpm docs:ingest` (incremental) or `pnpm docs:ingest --full` (full rebuild — deletes existing, re-indexes all).

- [ ] **Step 8: Run tests — expect GREEN** (~1 min)

- [ ] **Step 9: Commit** (~1 min)

```
git add -A
git commit -m "feat(docs): add RAG ingestion script with incremental re-indexing"
```

---

### Task 6: Freshness Detection Script

**Goal:** Create `check-freshness.ts` that compares git timestamps of source vs. documentation to identify stale content.

**Files:**

- Create: `apps/docs/scripts/check-freshness.ts`
- Create: `apps/docs/tests/unit/check-freshness.test.ts`

- [ ] **Step 1: Write freshness tests** (~5 min)

Create `tests/unit/check-freshness.test.ts`:

1. Source file newer than doc → reports stale with diff timestamp
2. Doc up to date → reports not stale
3. All docs fresh → exits with code 0 and reports "all fresh"
4. Outputs structured `FreshnessReport` per package to stdout
5. Handles packages without documentation files gracefully (no crash)

Mock `child_process.execSync` (for `git log` calls) and filesystem reads.

- [ ] **Step 2: Run tests — expect RED** (~1 min)

- [ ] **Step 3: Implement source-to-doc mapping** (~3 min)

For each package in `packages/*/`, map `src/` files to corresponding `docs/product/**/{name}*` documentation files. Use glob patterns to find related docs.

- [ ] **Step 4: Implement git timestamp comparison** (~3 min)

Use `git log -1 --format=%cI -- {file}` to get the last commit date for both source and doc files. Compare ISO timestamps.

- [ ] **Step 5: Implement report output** (~2 min)

Output `FreshnessReport[]` as JSON to stdout for CI consumption. Exit code 0 if all fresh, 1 if any stale.

- [ ] **Step 6: Add CLI interface** (~1 min)

`pnpm docs:freshness` — no flags needed.

- [ ] **Step 7: Run tests — expect GREEN** (~1 min)

- [ ] **Step 8: Commit** (~1 min)

```
git add -A
git commit -m "feat(docs): add freshness detection script for stale documentation"
```

---

### Task 7: Vale Prose Linting Configuration

**Goal:** Configure Vale with custom Tempot rules and GitHub Actions CI workflow.

**Files:**

- Create: `apps/docs/.vale.ini`
- Create: `apps/docs/styles/Tempot/Terminology.yml`
- Create: `apps/docs/styles/Tempot/ProhibitedWords.yml`
- Create: `apps/docs/styles/Tempot/SentenceLength.yml`
- Create: `.github/workflows/docs-lint.yml`

- [ ] **Step 1: Create .vale.ini** (~2 min)

```ini
StylesPath = styles/
MinAlertLevel = suggestion

Packages = Google

[docs/product/**/*.md]
BasedOnStyles = Tempot, Google
```

- [ ] **Step 2: Create Terminology.yml** (~2 min)

```yaml
extends: substitution
message: "Use '%s' instead of '%s'."
level: warning
swap:
  Telegram bot: Telegram Bot
  tempot: Tempot
  typescript: TypeScript
  javascript: JavaScript
  grammy: grammY
  bullmq: BullMQ
  neverthrow: neverthrow
  postgresql: PostgreSQL
  pgvector: pgvector
  diataxis: Diataxis
```

- [ ] **Step 3: Create ProhibitedWords.yml** (~2 min)

```yaml
extends: existence
message: "Avoid using '%s'. Use the current terminology."
level: error
tokens:
  - simply
  - obviously
  - just
  - easy
  - trivial
```

- [ ] **Step 4: Create SentenceLength.yml** (~1 min)

```yaml
extends: occurrence
message: 'Sentences should be no longer than 40 words.'
level: suggestion
scope: sentence
max: 40
token: '\b\w+\b'
```

- [ ] **Step 5: Create GitHub Actions workflow** (~3 min)

Create `.github/workflows/docs-lint.yml`:

```yaml
name: Documentation Lint
on:
  pull_request:
    paths:
      - 'docs/product/**/*.md'
jobs:
  vale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: errata-ai/vale-action@v2
        with:
          files: docs/product/
          config: apps/docs/.vale.ini
```

- [ ] **Step 6: Verify Vale runs locally** (~2 min)

```bash
cd apps/docs && vale ../../docs/product/
```

Should report zero errors on existing seeded content (if Task 9 is done) or on landing pages.

- [ ] **Step 7: Commit** (~1 min)

```
git add -A
git commit -m "feat(docs): add Vale prose linting with custom Tempot style rules"
```

---

### Task 8: RTL/LTR Rendering Verification

**Goal:** Write E2E tests verifying correct RTL/LTR rendering using Cheerio against the built site.

**Files:**

- Create: `apps/docs/tests/e2e/rtl-rendering.test.ts`

**Prerequisites:** Task 0 (site builds), Task 9 (seeded content in both locales).

- [ ] **Step 1: Write E2E tests** (~5 min)

Create `tests/e2e/rtl-rendering.test.ts`:

```typescript
import { readFileSync } from 'node:fs';
import * as cheerio from 'cheerio';
import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';

describe('RTL/LTR Rendering', () => {
  beforeAll(() => {
    // Build the site before E2E tests
    execSync('pnpm build', { cwd: import.meta.dirname + '/../..' });
  });

  it('renders Arabic pages with dir="rtl"', () => {
    const html = readFileSync('dist/ar/index.html', 'utf-8');
    const $ = cheerio.load(html);
    expect($('html').attr('dir')).toBe('rtl');
  });

  it('renders English pages with dir="ltr"', () => {
    const html = readFileSync('dist/en/index.html', 'utf-8');
    const $ = cheerio.load(html);
    expect($('html').attr('dir')).toBe('ltr');
  });

  it('keeps code blocks LTR within RTL pages', () => {
    // Find an Arabic page with code blocks
    const html = readFileSync('dist/ar/concepts/architecture-overview/index.html', 'utf-8');
    const $ = cheerio.load(html);
    expect($('html').attr('dir')).toBe('rtl');
    // Code blocks should have dir="ltr" or inherit LTR from their container
    $('pre code').each((_, el) => {
      const codeDir = $(el).closest('[dir]').attr('dir');
      // Starlight wraps code in LTR containers
      expect(codeDir).toBe('ltr');
    });
  });

  it('renders sidebar correctly in both locales', () => {
    const arHtml = readFileSync('dist/ar/index.html', 'utf-8');
    const enHtml = readFileSync('dist/en/index.html', 'utf-8');
    const $ar = cheerio.load(arHtml);
    const $en = cheerio.load(enHtml);

    // Both should have sidebar navigation
    expect($ar('nav').length).toBeGreaterThan(0);
    expect($en('nav').length).toBeGreaterThan(0);
  });

  it('locale switcher links to equivalent page', () => {
    const arHtml = readFileSync('dist/ar/index.html', 'utf-8');
    const $ = cheerio.load(arHtml);

    // Find locale switcher link to English
    const enLink = $('a[hreflang="en"]');
    expect(enLink.length).toBeGreaterThan(0);
    expect(enLink.attr('href')).toContain('/en/');
  });
});
```

Note: Exact selectors may need adjustment based on Starlight's generated HTML structure. The code-block LTR test may need refinement — Starlight may not explicitly set `dir="ltr"` on code blocks but may inherit from a parent.

- [ ] **Step 2: Run E2E tests** (~3 min)

```bash
cd apps/docs && pnpm vitest run tests/e2e/rtl-rendering.test.ts
```

- [ ] **Step 3: Fix any rendering issues** (~2 min)

If tests fail, adjust Starlight/Astro configuration (e.g., CSS overrides for code block direction).

- [ ] **Step 4: Commit** (~1 min)

```
git add -A
git commit -m "test(docs): add RTL/LTR rendering verification tests"
```

---

### Task 9: Documentation Content Seeding

**Goal:** Create initial content for all Diataxis sections in both locales with valid typed frontmatter.

**Files:**

- Create: `docs/product/ar/tutorials/getting-started.md`
- Create: `docs/product/en/tutorials/getting-started.md`
- Create: `docs/product/ar/guides/creating-a-module.md`
- Create: `docs/product/en/guides/creating-a-module.md`
- Create: `docs/product/ar/concepts/architecture-overview.md`
- Create: `docs/product/en/concepts/architecture-overview.md`
- Create: `docs/product/ar/user-guide/getting-started.md`
- Create: `docs/product/en/user-guide/getting-started.md`

- [ ] **Step 1: Create Getting Started tutorial (both locales)** (~5 min)

Arabic (`docs/product/ar/tutorials/getting-started.md`):

- Frontmatter: title (Arabic), description (Arabic), tags: [tutorial, getting-started], audience: [bot-developer], contentType: developer-docs, difficulty: beginner
- Content: Step-by-step guide for setting up a new Tempot bot (in Arabic)

English (`docs/product/en/tutorials/getting-started.md`):

- Same structure, English content

- [ ] **Step 2: Create Creating a Module guide (both locales)** (~5 min)

Arabic + English guide on creating a new module using the module registry. Frontmatter with tags: [guide, modules], audience: [package-developer], difficulty: intermediate.

- [ ] **Step 3: Create Architecture Overview concept (both locales)** (~5 min)

Arabic + English overview of Tempot's architecture (layers, packages, event-driven design). Include a code block to test RTL code-in-LTR behavior. Frontmatter with tags: [concepts, architecture], audience: [package-developer, bot-developer], difficulty: advanced.

- [ ] **Step 4: Create Getting Started user guide (both locales)** (~3 min)

Arabic-primary user guide for end users. Frontmatter with tags: [user-guide, getting-started], audience: [end-user], difficulty: beginner.

- [ ] **Step 5: Validate all frontmatter** (~2 min)

Run the validation script from Task 2 against all 8 new files. All must pass.

- [ ] **Step 6: Build and verify** (~2 min)

```bash
cd apps/docs && pnpm build
```

Verify all 8 pages render correctly in the built site.

- [ ] **Step 7: Commit** (~1 min)

```
git add -A
git commit -m "docs: seed initial content for all Diataxis sections in both locales"
```

---

### Task 10: Integration & Final Validation

**Goal:** Write integration tests verifying the full pipeline and ensure all success criteria are met.

**Files:**

- Create: `apps/docs/tests/integration/full-pipeline.test.ts`

- [ ] **Step 1: Write integration test — site build** (~3 min)

Test that `pnpm build` in `apps/docs` produces a complete Starlight site with API reference pages.

- [ ] **Step 2: Write integration test — generate pre-methodology** (~3 min)

Test `pnpm docs:generate --package logger` produces valid Markdown using source+JSDoc fallback.

- [ ] **Step 3: Write integration test — generate with specs** (~3 min)

Test `pnpm docs:generate --package shared` produces valid Markdown with SpecKit artifacts.

- [ ] **Step 4: Write integration test — ingest** (~3 min)

Test `pnpm docs:ingest` runs without error (mock vector DB).

- [ ] **Step 5: Write integration test — freshness** (~3 min)

Test `pnpm docs:freshness` correctly identifies stale/fresh docs.

- [ ] **Step 6: Write integration test — Vale** (~2 min)

Test Vale passes on all seeded content with zero errors.

- [ ] **Step 7: Write integration test — frontmatter** (~2 min)

Test all documentation pages include valid typed frontmatter.

- [ ] **Step 8: Run full test suite** (~3 min)

```bash
cd apps/docs && pnpm test
cd packages/ai-core && pnpm test
```

All tests must pass.

- [ ] **Step 9: Verify success criteria SC-001 through SC-016** (~5 min)

Walk through each success criterion from spec.md and verify evidence:

- SC-001: Starlight site builds → `pnpm build` succeeds
- SC-002: API reference per package → pages exist in `dist/reference/`
- SC-003: RTL/LTR correct → E2E tests pass
- SC-004: Content in both locales → 8 seeded pages exist
- SC-005: AI generation with specs → generate script works
- SC-006: Pre-methodology fallback → logger generation works
- SC-007: RAG ingestion metadata → ingest script works
- SC-008: Incremental re-indexing → hash-based skip works
- SC-009: Freshness detection → freshness script works
- SC-010: Vale passes → zero errors
- SC-011: Typed frontmatter → validation passes
- SC-012: Site loads < 3s (simulated 3G) → measure built page size
- SC-013: API ref < 5 min → build time measurement
- SC-014: RAG ingestion < 10 min → ingestion time measurement
- SC-015: Archive contains all docs → file count matches
- SC-016: Development dir exists, not published → verify dist/ excludes development/

- [ ] **Step 10: Commit** (~1 min)

```
git add -A
git commit -m "test(docs): add integration tests for full documentation pipeline"
```

---

## Post-Implementation

After all 11 tasks are complete:

1. **Code Review** — Review against spec + constitution
2. **Verification** — Run `pnpm spec:validate`, ensure 0 CRITICAL
3. **Documentation Sync** — Update `CLAUDE.md` and `.specify/memory/constitution.md` cross-references (see DC-8 table)
4. **Changeset** — Create changeset for `@tempot/ai-core` (minor: new chunking export)
5. **Merge** — Merge `feature/021-documentation-system` to `main`

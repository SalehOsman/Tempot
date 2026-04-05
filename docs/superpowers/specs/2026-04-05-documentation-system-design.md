# Documentation System — Brainstorming Design Document

**Feature:** 021-documentation-system
**Date:** 2026-04-05
**Spec:** `specs/021-documentation-system/spec.md` (v1, Complete)
**Plan:** `specs/021-documentation-system/plan.md`
**Status:** Pre-implementation design deepening

---

## Design Concerns & Resolutions

### DC-1: Starlight contentDir with Upward Relative Paths

**Question:** Does Starlight's `contentDir` natively support `../../docs/product/`?

**Answer:** Yes. Starlight's `contentDir` option resolves relative to `astro.config.mjs` location. Since `apps/docs/astro.config.mjs` is two levels deep, `../../docs/product/` resolves to `{monorepo-root}/docs/product/`.

**Build mode:** Astro uses Node.js `fs` APIs directly — no path restrictions. Works out of the box.

**Dev mode:** Vite restricts file serving outside the project root by default. In pnpm workspaces, Vite auto-detects the workspace root and adds it to `server.fs.allow`. Since `docs/product/` is within the workspace root, dev mode works without extra config.

**Fallback:** If Vite restrictions are encountered, explicitly configure in `astro.config.mjs`:

```js
export default defineConfig({
  vite: { server: { fs: { allow: ['../..'] } } },
  integrations: [starlight({ contentDir: '../../docs/product/' })],
});
```

**Decision:** Use `contentDir: '../../docs/product/'` directly. Add Vite `fs.allow` only if dev mode fails during Task 0 scaffolding.

---

### DC-2: Safe Archive Migration Preserving Git History

**Question:** How to move all existing `docs/` content to `docs/archive/` while preserving git history?

**Answer:** Use `git mv` for each top-level item. Git tracks renames explicitly with `git mv`, preserving `git blame` attribution.

**Procedure for Task 0:**

1. Create target: `mkdir docs/archive`
2. For each top-level item in `docs/`:
   ```bash
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
3. Create `docs/archive/README.md` with archive notice
4. Verify: `git status` shows renames only (no deletions)

**File count:** 114 tracked files move to `docs/archive/`.

**Cross-reference impact:** All references to `docs/` paths in `CLAUDE.md`, `.specify/memory/constitution.md`, and spec artifacts must be updated during Documentation Sync (Phase 7). See DC-8.

---

### DC-3: Per-Package TypeDoc Plugin — Hardcode vs Dynamic

**Question:** Should `astro.config.mjs` hardcode each package or dynamically discover `packages/*/`?

**Answer:** Hardcode with a helper array. This follows Constitution Rule V (simplicity).

**Design:**

```typescript
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
];

// Packages with no public exports — skip TypeDoc, manual minimal page
const MANUAL_ONLY_PACKAGES = ['sentry'];
```

Each entry in `DOCUMENTED_PACKAGES` produces one `createStarlightTypeDocPlugin()` call. New packages require adding one string to the array — intentional manual step that forces the developer to decide whether API docs are needed.

**Rejected:** Dynamic filesystem discovery — adds complexity, harder to exclude packages, harder to customize per-package TypeDoc options.

---

### DC-4: AI Generation Pipeline — Model-Agnostic Design

**Question:** How to design `generate-docs.ts` to work with any AI tool locally?

**Answer:** The script operates as a **prompt constructor + output formatter**, NOT as an AI model caller by default.

**Two modes:**

1. **Prompt-only mode** (default): Reads SpecKit artifacts + source code, constructs structured prompts, outputs them to `stdout` or a file. No API key required. The developer pipes the prompt to their preferred AI tool manually.

2. **Generate mode** (`--generate`): If a Vercel AI SDK provider is configured (via environment variables), calls the model directly to generate content. Falls back to prompt-only if no provider is available.

**Interface design:**

```typescript
interface PromptContext {
  packageName: string;
  specArtifacts: { spec?: string; plan?: string; dataModel?: string };
  sourceFiles: Array<{ path: string; content: string }>;
  adrs: Array<{ path: string; content: string }>;
  locale: 'ar' | 'en';
}

function buildDocPrompt(ctx: PromptContext): string;
function processAIResponse(
  response: string,
  config: DocGenerationConfig,
): Result<DocOutput, AppError>;
```

**Pre-methodology fallback:** When `specArtifacts` is empty (logger, event-bus, auth-core), the prompt uses source code + JSDoc comments only. A warning is logged per Constitution Rule LXXIV (via `process.stderr.write`).

---

### DC-5: starlight-typedoc Reference Pages vs RAG Ingestion

**Question:** starlight-typedoc generates pages at build time. RAG ingestion needs `.md` files. How to reconcile?

**Answer:** They don't need to be reconciled. The RAG pipeline indexes `docs/product/` only — committed content (tutorials, guides, concepts, user-guide). API reference pages (auto-generated at build time by starlight-typedoc) are NOT indexed by RAG.

**Rationale:**

- API reference is structural/auto-generated — poor RAG retrieval quality
- Conceptual/tutorial content is what developers actually search for via AI
- The Data Flow diagram in `data-model.md` explicitly shows RAG reading from `docs/product/`
- API reference is available on the live site for direct browsing

**Future option:** If RAG indexing of API reference is needed, a separate script could run TypeDoc in markdown-only mode to a temp directory, then ingest. This is NOT in scope for the current feature.

---

### DC-6: Markdown Chunking Integration with ai-core

**Question:** How to add Markdown-aware chunking without breaking existing character-based chunking?

**Answer:** Create a standalone utility in a NEW `src/chunking/` directory. Do NOT modify `ContentIngestionService.chunkContent()`.

**Architecture:**

```
packages/ai-core/src/
├── chunking/                          ← NEW directory
│   ├── index.ts                       ← barrel export
│   └── markdown-chunker.ts            ← chunkByMarkdownHeadings()
├── content/
│   └── content-ingestion.service.ts   ← UNCHANGED
└── index.ts                           ← add export from ./chunking/index.js
```

**Function signature:**

```typescript
function chunkByMarkdownHeadings(
  content: string,
  metadata: Partial<DocChunkMetadata>,
): ContentChunk[];
```

Returns `ContentChunk[]` (same type as existing chunker) for compatibility. The RAG ingestion script in `apps/docs/` imports `chunkByMarkdownHeadings` directly and calls `ContentIngestionService.ingest()` with pre-chunked content.

**The existing `ContentIngestionService.chunkContent()` is untouched.** The new chunker is a separate, additive strategy. No strategy pattern abstraction needed — YAGNI (Rule V).

**Algorithm:**

1. Strip YAML frontmatter
2. Split on `##` headings (primary boundaries)
3. Within each section, split on `###` headings (secondary boundaries)
4. For sections exceeding 8000 tokens (~32000 chars), split at paragraph boundaries
5. Each chunk carries metadata: `{ filePath, section (heading text), language, package?, contentHash }`
6. Empty sections are skipped

**Test file:** `tests/unit/markdown-chunker.test.ts` (flat in `tests/unit/`, following ai-core convention)

---

### DC-7: E2E RTL Tests — Framework Choice

**Question:** What test framework for RTL rendering verification?

**Answer:** Use Vitest with **Cheerio** (HTML parser) against the built static site. No browser dependency needed.

**Rationale:**

- The tests check HTML attributes (`dir="rtl"`, `dir="ltr"`), CSS classes, and link targets
- These are all verifiable by parsing static HTML — no JavaScript execution needed
- Adding Playwright for 5 tests is disproportionate overhead
- Cheerio is lightweight (~200KB), well-maintained, and TypeScript-compatible
- Consistent with Vitest-based testing strategy (Constitution Rule XXXV)

**Approach:**

1. Pre-condition: `pnpm build` in `apps/docs` (produces `dist/`)
2. Tests read HTML files from `apps/docs/dist/` using `node:fs`
3. Parse with Cheerio, assert on structure

**Example test:**

```typescript
it('should render Arabic pages with dir="rtl"', () => {
  const html = readFileSync('dist/ar/index.html', 'utf-8');
  const $ = cheerio.load(html);
  expect($('html').attr('dir')).toBe('rtl');
});
```

**Locale switcher test:** Verify that switcher links point to the equivalent page in the other locale (href check, no browser navigation).

**Vitest config:** Add a third test project `e2e` alongside `unit` and `integration`:

```typescript
defineProject({
  test: {
    name: 'e2e',
    include: ['tests/e2e/**/*.test.ts'],
    environment: 'node',
  },
});
```

**Dependency:** Add `cheerio` as a devDependency of `apps/docs`.

---

### DC-8: Cross-Reference Validity After Archive Migration

**Question:** How to ensure all cross-references remain valid after moving `docs/` to `docs/archive/`?

**Answer:** Systematic update during Documentation Sync (Phase 7, mandatory per Constitution Rule L).

**Files requiring path updates:**

| File                              | Old Reference                                  | New Reference                                                                 |
| --------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `CLAUDE.md`                       | `docs/tempot_v11_final.md`                     | `docs/archive/tempot_v11_final.md`                                            |
| `CLAUDE.md`                       | `docs/developer/workflow-guide.md`             | `docs/archive/developer/workflow-guide.md`                                    |
| `CLAUDE.md`                       | `docs/developer/package-creation-checklist.md` | `docs/archive/developer/package-creation-checklist.md`                        |
| `CLAUDE.md`                       | `docs/ROADMAP.md`                              | `docs/archive/ROADMAP.md` + `docs/development/ROADMAP.md` (active)            |
| `.specify/memory/constitution.md` | `docs/architecture/adr/`                       | `docs/archive/architecture/adr/` (historical) + `docs/development/adr/` (new) |
| `.specify/memory/constitution.md` | `docs/developer/package-creation-checklist.md` | `docs/archive/developer/package-creation-checklist.md`                        |

**Active ROADMAP:** Create `docs/development/ROADMAP.md` as the new active version with updated status. `docs/archive/ROADMAP.md` is the frozen historical snapshot.

**New ADRs:** Written to `docs/development/adr/`. Historical ADRs remain at `docs/archive/architecture/adr/` as read-only reference.

**Superpowers artifacts:** After Task 0, existing superpowers docs are at `docs/archive/superpowers/`. New artifacts for this feature (this design doc, the execution plan) are referenced from their archive paths during implementation.

---

## Application Architecture: apps/docs/

Based on the `apps/bot-server/` reference application, adapted for an Astro/Starlight app:

### Key Differences from bot-server

| Concern          | bot-server                 | docs                                      |
| ---------------- | -------------------------- | ----------------------------------------- |
| Build tool       | `tsc`                      | `astro build`                             |
| Dev command      | `tsx watch`                | `astro dev`                               |
| Framework        | Hono                       | Astro + Starlight                         |
| Source structure | `src/` with business logic | `src/` minimal (Astro entry only)         |
| Scripts          | N/A                        | `scripts/` directory for doc tooling      |
| Content          | N/A                        | `docs/product/` (external via contentDir) |

### Conventions to Follow

- **package.json name:** `docs` (no `@tempot/` prefix — apps use bare names)
- **private:** `true`
- **type:** `"module"`
- **tsconfig.json:** Extends Astro base config (not monorepo root)
- **vitest:** `4.1.0` exact (Constitution Rule LXXVI)
- **neverthrow:** `8.2.0` exact (for scripts using Result pattern)
- **.js extensions:** All relative imports use `.js` (NodeNext resolution)
- **File naming:** `kebab-case` with descriptive suffixes (`.types.ts`, `.test.ts`)
- **No console.\*:** Use `process.stderr.write()` (Constitution Rule LXXIV)
- **Error handling:** Result pattern for all script functions (Constitution Rule XXI)

### Directory Structure

```
apps/docs/
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── .vale.ini
├── src/                          # Minimal Astro entry
│   └── content.config.ts         # Content collection config (if needed)
├── scripts/
│   ├── docs.types.ts             # Shared type definitions
│   ├── generate-docs.ts          # AI documentation generation
│   ├── ingest-docs.ts            # RAG ingestion
│   ├── check-freshness.ts        # Freshness detection
│   └── validate-frontmatter.ts   # Frontmatter schema validation
├── styles/
│   └── Tempot/                   # Vale custom style rules
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
```

---

## Key Technical Decisions Made During Brainstorming

1. **Cheerio over Playwright** for E2E RTL tests — lighter, faster, sufficient for HTML attribute checks
2. **Hardcoded package list** over dynamic discovery for TypeDoc — explicit, simple, follows Rule V
3. **Standalone chunker** over strategy pattern in ContentIngestionService — YAGNI, additive only
4. **Prompt-only default** for AI generation — no hosted service dependency, model-agnostic
5. **No RAG indexing of API reference** — build-time generated, poor retrieval quality
6. **git mv per item** for archive migration — preserves git blame attribution
7. **No Vite fs.allow** needed initially — pnpm workspace root detection handles it
8. **Documentation Sync in Phase 7** handles all cross-reference updates systematically

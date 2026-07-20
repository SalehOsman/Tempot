# 02 - Documentation Corpus And RAG Readiness

## Executive Assessment

The documentation platform exists and the ingestion command works in safe dry-run mode. However, the current documentation corpus is not yet production-grade for RAG because metadata quality, language classification, corpus prioritization, link validation, and partial ingestion semantics need hardening.

This is the most important improvement area if the project intends to use documentation as AI context.

## Evidence

| Evidence | Result |
|---|---|
| `apps/docs/package.json` | Provides `docs:generate`, `docs:ingest`, `docs:freshness`, and `docs:validate`. |
| `apps/docs/astro.config.mjs:56` | Default locale is `ar`. |
| `docs/product` corpus count | 2845 Markdown files. |
| `docs/product/reference` count | 2811 generated API reference files. |
| `apps/docs/scripts/ingest-docs.ts:65-68` | Language is derived only from first path segment `ar` or `en`; everything else becomes `unknown`. |
| Dry-run command for `en/guides` | Processed 5 files, produced 53 chunks, wrote no hashes. |
| Dry-run command for `reference/ai-core/README.md` | Processed 1 file, produced 5 chunks, language was `unknown`. |
| `apps/docs/tests/integration/rag-golden-fixture.test.ts` | A golden fixture exists locally but is currently untracked. |

## Dry-Run Results

### Human-authored English guide sample

Command:

```powershell
pnpm --filter docs docs:ingest -- --dry-run --full --path en/guides
```

Result:

| File | Language | Chunk count |
|---|---|---:|
| `en/guides/creating-a-module.md` | `en` | 10 |
| `en/guides/database.md` | `en` | 11 |
| `en/guides/event-bus.md` | `en` | 11 |
| `en/guides/logger.md` | `en` | 12 |
| `en/guides/shared.md` | `en` | 9 |

### Generated API reference sample

Command:

```powershell
pnpm --filter docs docs:ingest -- --dry-run --full --path reference/ai-core/README.md
```

Result:

| File | Language | Chunk count | Concern |
|---|---|---:|---|
| `reference/ai-core/README.md` | `unknown` | 5 | This represents the dominant `reference` corpus segment. |

## RAG Readiness Scores

| Area | Score | Reason |
|---|---:|---|
| Ingestion command safety | 84% | Default is dry-run/no-write and `--write` is explicit. |
| Chunking capability | 78% | Markdown-aware chunking exists, but metadata and partial failure semantics need work. |
| Corpus language metadata | 35% | 2811 of 2845 product docs live outside `en`/`ar` path roots and become `unknown`. |
| Corpus prioritization | 45% | Generated reference dominates the corpus without an observed ranking/weight policy. |
| Source-of-truth quality | 58% | Many docs are good, but active architecture doc has language/encoding debt. |
| Link quality evidence | 65% | Docs build/checks pass, but no dedicated authoritative link-check artifact was observed. |
| Golden evaluation coverage | 55% | A golden fixture test exists locally but is untracked. |
| Production RAG readiness | 52% | Vector storage and ingestion exist; runtime activation and evidence are still incomplete. |

## Critical RAG Findings

### RAG-001 - Most product docs will be indexed with `language=unknown`

| Field | Detail |
|---|---|
| Severity | High |
| Evidence | `docs/product/reference` has 2811 of 2845 Markdown files; `apps/docs/scripts/ingest-docs.ts:65-68` returns `unknown` unless first segment is `ar` or `en`. |
| Impact | Retrieval cannot reliably filter, rank, or answer by language. This is especially harmful with default locale `ar` and mostly generated reference docs. |
| Fix | Introduce explicit metadata mapping for non-locale paths, especially `reference/*`, `modules/*`, `packages/*`, and source-of-truth docs. |

### RAG-002 - Generated API reference dominates the corpus

| Field | Detail |
|---|---|
| Severity | High |
| Evidence | 2811 generated reference files versus 17 English and 5 Arabic human-authored product docs. |
| Impact | RAG answers may retrieve low-level API pages before higher-value tutorials, concepts, or operator runbooks. |
| Fix | Add corpus tiers and retrieval weights: source-of-truth docs first, task guides second, API reference third unless the query is explicitly API-oriented. |

### RAG-003 - Partial chunk failure can still mark a file as indexed

| Field | Detail |
|---|---|
| Severity | High |
| Evidence | `packages/ai-core/src/content/content-ingestion.service.ts:91` continues after failed chunks; `apps/docs/scripts/ingest-runner.ts:107-170` saves the file hash after `ingestFile` succeeds. |
| Impact | A file can be treated as indexed even when only part of its content was stored. Future incremental runs may skip it, leaving permanent retrieval gaps. |
| Fix | Make docs ingestion strict by default: all chunks must store successfully before the file hash is persisted. |

### RAG-004 - Sync discovery helper returns an empty list

| Field | Detail |
|---|---|
| Severity | Medium |
| Evidence | `apps/docs/scripts/ingest-docs.ts:34-39` has `discoverDocFiles()` returning `ok([])`. |
| Impact | Any caller using the sync helper gets no files, while async discovery works. |
| Fix | Either implement sync discovery correctly or remove/export only the async discovery path. |

### RAG-005 - Golden RAG fixture is not tracked in git

| Field | Detail |
|---|---|
| Severity | Medium |
| Evidence | `git status --short` shows `apps/docs/tests/fixtures/` and `apps/docs/tests/integration/rag-golden-fixture.test.ts` as untracked. |
| Impact | Local RAG verification can pass for one developer but not exist in CI or other worktrees. |
| Fix | Decide whether this fixture belongs to Spec #063/#RAG work, then stage it intentionally or remove it from local review scope. |

### RAG-006 - Documentation link checking is not yet a first-class RAG gate

| Field | Detail |
|---|---|
| Severity | Medium |
| Evidence | `pnpm docs:check` validates freshness/frontmatter/claims. `pnpm build` previously passed with Astro/Pagefind warnings, but no dedicated link-check command was identified. |
| Impact | Broken internal links and stale route assumptions reduce RAG citation quality. |
| Fix | Add a rendered-site link checker or Starlight-aware route checker and publish results as CI artifacts. |

## Recommended RAG Documentation Architecture

| Layer | Recommendation |
|---|---|
| Corpus manifest | Add `docs/rag/manifest.json` or generated manifest with path, language, audience, type, freshness, source package, and priority. |
| Frontmatter schema | Require `title`, `description`, `audience`, `contentType`, `sourceOfTruth`, `lastVerified`, and `ragPriority` for human-authored docs. |
| Generated reference handling | Assign generated API docs lower default priority and explicit `contentType=api-reference`. |
| Source-of-truth docs | Treat roadmap, architecture, ADRs, operations, and package docs as higher-priority RAG inputs. |
| Chunk IDs | Use stable IDs based on normalized path, heading slug, and content hash rather than only chunk index. |
| Strict ingestion | Persist file hash only when all chunks are successfully embedded and stored. |
| Evaluation | Promote the golden fixture to tracked CI and add no-context, stale-context, and wrong-language tests. |

## Documentation Improvements For AI Use

| Improvement | Priority | Benefit |
|---|---|---|
| Add "RAG-ready" frontmatter to source-of-truth docs. | P1 | Better retrieval filtering and citations. |
| Split very large docs into smaller topic pages. | P1 | Better chunk precision and less noisy context. |
| Normalize language/encoding in architecture docs. | P1 | Prevents corrupted retrieval context. |
| Add canonical citations to roadmap/spec evidence. | P2 | Helps AI cite current authority correctly. |
| Add summary blocks at top of long docs. | P2 | Improves retrieval and answer grounding. |
| Add stale/archived flags for historical analyses. | P2 | Prevents RAG from using old findings as current truth. |


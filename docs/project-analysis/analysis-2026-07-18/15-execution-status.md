# 15 - Execution Status

## Execution Start

The Project Manager authorized implementation after reviewing the analysis direction. This file records the first execution slice so the analysis package remains synchronized with the repository state.

## Completed In This Slice

| Item | Status | Files changed | Verification |
|---|---|---|---|
| Fix methodology allowlist path drift for historical analysis folders. | Complete | `scripts/ci/methodology-lint.allowlist.json` | `pnpm methodology:lint --format=json` passed. |
| Move ignored pnpm policy out of `package.json#pnpm`. | Complete | `package.json`, `pnpm-workspace.yaml` | `pnpm --version` and `pnpm methodology:lint --format=json` ran without the previous ignored `package.json#pnpm` warning. |
| Classify generated reference and top-level product docs as English for RAG metadata. | Complete | `apps/docs/scripts/ingest-docs.ts`, `packages/ai-core/src/chunking/markdown-chunker.ts` | Focused docs and ai-core tests passed; dry-run for `reference/ai-core/README.md` now logs `language=en`. |
| Make docs ingestion use strict chunk storage semantics. | Complete | `apps/docs/scripts/ingest-docs.ts`, `packages/ai-core/src/content/content-ingestion.service.ts` | Focused docs and ai-core tests passed. |
| Implement synchronous docs discovery instead of returning an empty list. | Complete | `apps/docs/scripts/ingest-docs.ts`, `apps/docs/scripts/doc-discovery.ts` | Focused docs ingestion tests passed. |
| Re-check integration gate timeout. | Complete | No code change. | `pnpm test:integration` passed with 30 files and 154 tests in about 318 seconds. The earlier failure was the executor timeout, not a test failure. |
| Re-check coverage gate timeout. | Complete | No code change. | `pnpm test:coverage` passed in about 348 seconds. Coverage policy evaluated 117 components with 0 blocking failures and 7 repository warnings. |
| Remove webhook fallback secret and lint suppressions. | Complete | `apps/bot-server/scripts/webhook-manager.ts`, `apps/bot-server/scripts/webhook-manager.config.ts`, `apps/bot-server/src/bot-server.errors.ts`, `scripts/ci/methodology-lint.allowlist.json` | TDD covered missing `WEBHOOK_SECRET_TOKEN`, no fallback secret, undeclared imports, and CLI invalid-action startup. Bot-server tests, build, lint, and methodology lint passed. |
| Add blocking secret scanning CI. | Complete | `.github/workflows/ci.yml`, `scripts/ci/tests/unit/ci-workflow.test.ts`, `docs/security/security-baseline.md`, `docs/security/SECURITY-OPERATIONS.md` | TDD covered the CI workflow. Gitleaks job now runs with `fetch-depth: 0`; docs, lint, and methodology lint passed. |
| Add RAG corpus metadata and retrieval ranking policy. | Complete | `apps/docs/scripts/doc-discovery.ts`, `apps/docs/scripts/docs.types.ts`, `apps/docs/scripts/ingest-docs.ts`, `apps/docs/scripts/ingest-runner.ts`, `packages/ai-core/src/chunking/markdown-chunker.ts`, `packages/ai-core/src/rag/retrieval-plan.builder.ts`, `packages/ai-core/src/rag/retrieval-plan.executor.ts`, `packages/ai-core/src/rag/retrieval-ranking.ts` | TDD covered corpus segment/priority/source-of-truth metadata and reranking generated reference docs behind governed documentation using explicit `sourcePriority` metadata with `filePath` fallback. |
| Rewrite the active architecture source of truth in English. | Complete | `docs/architecture/tempot_architecture.md`, `scripts/ci/methodology-lint.allowlist.json` | RED: removing the architecture allowlist entry made `pnpm methodology:lint --format=json` fail with Rule XL violations in the legacy document. GREEN: the rewritten English architecture spec passes methodology lint and ASCII scanning. |
| Promote the RAG golden fixture into an explicit regression guard. | Complete | `apps/docs/tests/fixtures/rag-golden/en/guides/tempot-rag-golden.md`, `apps/docs/tests/integration/rag-golden-fixture.test.ts` | The fixture now verifies stable RAG chunk sections, content IDs, and corpus metadata fields: `corpusSegment`, `sourcePriority`, and `sourceOfTruth`. |

## Verification Completed After Implementation

| Command | Result | Notes |
|---|---|---|
| `pnpm lint` | Passed | The initial lint failures caused by long files/functions were fixed by extracting focused helpers. |
| `pnpm build` | Passed | Full workspace build completed. Astro still reports existing deprecation and Pagefind `Entry docs -> 404 was not found` warnings. |
| `pnpm test:unit` | Passed | 365 test files, 2595 tests passed. Expected test logger output appeared from existing negative-path tests. |
| `pnpm --filter docs exec vitest run tests/unit/ingest-docs.test.ts --reporter=verbose` | Passed | 25 docs ingestion tests passed. |
| `pnpm --filter @tempot/ai-core exec vitest run tests/unit/content-ingestion.service.test.ts tests/unit/markdown-chunker.test.ts --reporter=verbose` | Passed | 25 ai-core tests passed. |
| `pnpm --filter @tempot/ai-core build` | Passed | TypeScript build passed for ai-core. |
| `pnpm docs:check` | Passed | Freshness, frontmatter, and documentation claims checks passed. |
| `pnpm methodology:lint --format=json` | Passed | Overall pass; allowlist total remains 28 with no expiring or expired entries. |
| `pnpm audit --audit-level=high` | Passed threshold | 2 vulnerabilities remain: 1 low and 1 moderate, with 1 ignored advisory configured. |
| `pnpm --filter docs docs:ingest -- --dry-run --full --path reference/ai-core/README.md` | Passed | Processed 1 file, 5 chunks, no hash writes, `language=en`. |
| `pnpm test:integration` | Passed | 30 test files, 154 tests passed in about 318 seconds. |
| `pnpm test:coverage` | Passed | Coverage policy completed with 0 failures and 7 repository warnings. |
| `pnpm --filter bot-server test -- --run tests/unit` | Passed | 40 test files, 281 tests passed. |
| `pnpm exec vitest run scripts/ci/tests/unit/ci-workflow.test.ts --reporter=verbose` | Passed | 7 workflow governance tests passed. |
| `pnpm --filter @tempot/ai-core exec vitest run tests/unit/rag-runtime-wiring.test.ts --reporter=verbose` | Passed | 12 RAG runtime wiring tests passed, including rerank timing, governed-doc ranking, and explicit `sourcePriority` ranking. |
| `pnpm --filter @tempot/ai-core exec vitest run tests/unit/markdown-chunker.test.ts --reporter=verbose` | Passed | 15 Markdown chunking tests passed, including corpus metadata. |
| `pnpm --filter docs exec vitest run tests/unit/ingest-docs.test.ts --reporter=verbose` | Passed | 26 docs ingestion tests passed, including corpus dry-run log metadata. |
| `pnpm --filter docs build` | Passed | Docs build completed after rerunning with a longer timeout. Existing Astro deprecation and Pagefind `Entry docs -> 404 was not found` warnings remain. |
| `pnpm --filter docs docs:ingest -- --dry-run --full --path reference/ai-core/README.md` | Passed | Dry-run logs `language=en`, `corpusSegment=generated-reference`, `sourcePriority=20`, and `sourceOfTruth=false`. |
| `pnpm --filter docs docs:ingest -- --dry-run --full --path governance/source-of-truth.md` | Passed | Dry-run logs `language=en`, `corpusSegment=source-of-truth`, `sourcePriority=100`, and `sourceOfTruth=true`. |
| `pnpm methodology:lint --format=json` after removing `docs/architecture/tempot_architecture.md` from the allowlist | Failed as expected | RED evidence: the previous legacy architecture document triggered Rule XL developer-facing language violations. |
| `Select-String -Path docs/architecture/tempot_architecture.md -Pattern '[^\x00-\x7F]'` | Passed | No non-ASCII matches returned after the rewrite. |
| `pnpm methodology:lint --format=json` after the architecture rewrite | Passed | Overall pass; allowlist total is now 26. |
| `pnpm docs:check` after the architecture rewrite | Passed | Documentation freshness, frontmatter, and claim checks passed. |
| `pnpm lint` after the architecture rewrite | Passed | Workspace lint passed with the architecture document removed from the language-policy allowlist. |
| `pnpm spec:validate` after the architecture rewrite | Passed | 366/366 SpecKit checks passed. |
| `pnpm --filter docs build` with the default short executor timeout | Timed out | The process was killed after about 182 seconds and Astro reported `EPIPE` while writing to a closed output pipe. This was treated as executor timeout evidence, not a product build failure. |
| `pnpm --filter docs build` with a 600-second timeout | Passed | Built 2846 pages in about 3 minutes. Existing Astro markdown deprecation and Pagefind `Entry docs -> 404 was not found` warnings remain non-blocking. |
| `pnpm --dir apps/docs exec vitest run tests/integration/rag-golden-fixture.test.ts --reporter=verbose` | Passed | 1 test file and 2 tests passed. This is the focused RAG golden fixture regression check. |
| `pnpm lint` after promoting the RAG golden fixture | Passed | Workspace ESLint passed with the new fixture test. |
| `pnpm test:integration` after promoting the RAG golden fixture | Blocked by environment | The general integration gate reached Testcontainers and failed because Docker access is not available: `Could not find a working container runtime strategy`. `docker version` also reports permission denied when connecting to `npipe:////./pipe/docker_engine`. |

## Remaining High-Priority Work

| Priority | Work |
|---|---|
| P1 | Re-run the full integration gate when Docker or the CI container runtime is available. |

## Current Note

The repository still contains unrelated moved/deleted historical analysis paths in git status. Those were not reverted because they appear to be existing workspace changes, and the Project Manager explicitly requested leaving previous analysis folders untouched until the later project cleanup phase. The methodology allowlist now matches the current historical analysis path layout under `docs/project-analysis/`, and the current allowlist total is 26.

The active architecture document has been rewritten as an English ASCII source-of-truth document while preserving compatibility for the section references used by other documentation pages.

The RAG golden fixture has been promoted as the local regression guard for documentation ingestion metadata. It remains subject to normal Git staging and review; no staging or commit was performed in this slice.

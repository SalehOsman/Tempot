# 08 - Testing And Quality Gates Analysis

## Verification Matrix

| Command | Result | Notes |
|---|---|---|
| `pnpm lint` | Passed | No lint failures. |
| `pnpm build` | Passed on rerun | First 180-second run timed out; rerun completed in about 208 seconds with docs warnings. |
| `pnpm --filter bot-server... build` | Passed | Bot-server scope built. |
| `pnpm build:bot-runtime` | Passed | Runtime packages/modules built. |
| `pnpm test:unit` | Passed | 363 files, 2584 tests. |
| `pnpm test:e2e` | Passed | 1 file, 13 tests. |
| `pnpm test:integration` | Timed out locally | Timed out after 244 seconds. |
| `pnpm test:coverage` | Timed out locally | Timed out after 244 seconds; no coverage summary. |
| `pnpm spec:validate` | Passed | 366 of 366 checks passed. |
| `pnpm docs:check` | Passed | Freshness, frontmatter, and documentation claims passed. |
| `pnpm cms:check` | Passed | No violations. |
| `pnpm boundary:audit` | Passed | 1096 TypeScript files checked. |
| `pnpm authorization:check` | Passed | 9 modules checked. |
| `pnpm module:checklist` | Passed | 9 modules checked. |
| `pnpm source:conformance` | Passed | Zero findings. |
| `pnpm toolchain:audit` | Passed | Zero findings. |
| `pnpm audit --audit-level=high` | Passed threshold | 1 low and 1 moderate vulnerability remain. |
| `pnpm --filter docs docs:ingest -- --dry-run --full --path en/guides` | Passed | 5 files, 53 chunks, no hash writes. |
| `pnpm --filter docs docs:ingest -- --dry-run --full --path reference/ai-core/README.md` | Passed | 1 file, 5 chunks, language `unknown`. |

## Test Gaps

| Gap | Severity | Why it matters |
|---|---|---|
| Integration command hangs locally. | High | Blocks local release confidence. |
| Coverage command hangs locally. | High | Prevents measured coverage evidence. |
| RAG golden fixture is untracked. | Medium | It cannot be relied on in CI until intentionally tracked. |
| Partial chunk failure is not guarded by docs ingestion tests. | High | Can create silent RAG coverage gaps. |
| Corpus metadata tests are insufficient. | High | Most docs can become `language=unknown` without failing a gate. |
| Rendered link checking is not a first-class gate. | Medium | Broken links degrade docs and RAG citations. |

## Required New Tests

| Priority | Test | Expected result |
|---|---|---|
| P1 | Docs ingestion partial chunk failure | Hash is not saved if any chunk fails. |
| P1 | RAG corpus language coverage | CI fails if more than an approved threshold resolves to `unknown`. |
| P1 | RAG manifest validation | Every indexed document has content type, audience, source-of-truth state, language, and priority. |
| P1 | Golden fixture tracked CI test | Known query retrieves expected controlled answer and citation. |
| P2 | Rendered docs link check | Broken internal links are reported as CI artifacts. |
| P2 | Stale/historical docs exclusion | Archived analysis docs are not indexed as current context unless explicitly requested. |

## QA Recommendation

Testing is adequate for general code health, but not yet adequate for RAG production quality. The next QA slice should focus on ingestion correctness, metadata coverage, retrieval ranking, no-context behavior, stale-context behavior, and link/citation integrity.


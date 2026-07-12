# Plan: AI/RAG Vector Storage Activation

**Feature**: 062-ai-rag-vector-storage-activation
**Date**: 2026-07-12

## Overview

This slice implements Workstream 2 from
`docs/architecture/ai-rag-runtime-activation-plan.md`: make AI/RAG vector
storage reproducible outside tests.

The implementation is intentionally narrow. It adds committed migration evidence
for the existing Drizzle pgvector schema and a focused regression test. It does
not activate a Telegram bot AI flow, does not run provider calls, and does not
change active module configuration.

## Technical Context

| Area | Decision |
| --- | --- |
| Runtime | Node.js 22.12+ |
| Package | `@tempot/database` |
| Schema owner | Drizzle for pgvector |
| Migration carrier | Raw SQL migration committed under database migrations |
| Vector dimension | 3072 |
| Index | HNSW over `vector::halfvec(3072)` with cosine operators |

## Constitution Check

| Rule area | Status | Notes |
| --- | --- | --- |
| TypeScript strict mode | PASS | Test code is TypeScript strict. |
| Result pattern | PASS | No new public runtime API is added. |
| Repository boundary | PASS | No service bypasses repositories. |
| Package isolation | PASS | Scope stays in `packages/database` plus docs/spec sync. |
| TDD | PASS | Test must be written and observed RED before migration SQL is added. |
| Clean diff | PASS | No unrelated code or lockfile changes. |

## Implementation Phases

### Phase 1: SpecKit Handoff

- Create complete SpecKit artifacts for Spec #062.
- Point `.specify/feature.json` at Spec #062.
- Verify `tsx scripts/spec-validate/index.ts --all` passes before code work.

### Phase 2: RED

- Add `packages/database/tests/unit/vector-migration.test.ts`.
- The test reads the expected migration SQL path and asserts required pgvector
  schema evidence.
- Run the focused test and confirm it fails because the migration does not
  exist yet.

### Phase 3: GREEN

- Add the SQL migration.
- Keep Drizzle as schema owner; do not add Prisma schema models.
- Run the focused test and database build.

### Phase 4: Documentation Sync

- Update `docs/architecture/ai-rag-runtime-activation-plan.md`.
- Update `docs/ROADMAP.md`.
- Mark Spec #062 tasks as complete.

### Phase 5: Verification

- Run the focused database test.
- Run `pnpm --filter @tempot/database build`.
- Run `tsx scripts/spec-validate/index.ts --all`.
- Run `git diff --check`.

## Out of Scope

- Docs ingestion dependency composition.
- Runtime AI/RAG service composition.
- Telegram bot flow activation.
- AI provider calls.
- Embedding re-index jobs.
- Prisma model generation for embeddings.


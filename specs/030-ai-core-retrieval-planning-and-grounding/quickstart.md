# Quickstart: AI Core Retrieval Planning And Grounding

**Feature**: 030-ai-core-retrieval-planning-and-grounding
**Date**: 2026-04-29

## Goal

Use the public `@tempot/ai-core` barrel to describe retrieval planning and answer states without depending on `search-engine`, `document-engine`, or private `ai-core` files.

## Example Flow

1. Create a retrieval request with query text, locale, allowed content types, user scope, max results, and confidence threshold.
2. Build a retrieval plan with vector retrieval, content type filtering, access filtering, optional reranking, and context assembly.
3. Validate the request and plan.
4. Execute retrieval through the current or future pipeline.
5. Return an answer state:
   - `answered` with citations when context is sufficient.
   - `no-context` with an i18n key when context is insufficient.
   - `degraded` with an i18n key when retrieval or provider behavior is degraded.
   - `refused` with an i18n key when provider safety or policy blocks the answer.

## Validation Commands

```powershell
pnpm --filter @tempot/ai-core test
pnpm lint
pnpm spec:validate
git diff --check
```

## Deferred Package Check

This spec must not activate:

- `@tempot/search-engine`
- `@tempot/document-engine`
- `@tempot/import-engine`

If implementation needs any of these packages, stop and create a separate activation spec.

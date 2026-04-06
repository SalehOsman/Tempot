---
'@tempot/ai-core': minor
---

feat(021): documentation system with Starlight, RAG ingestion, and AI generation pipeline

New documentation platform at apps/docs/:

- Starlight (Astro) site with Arabic primary + English secondary (RTL/LTR)
- starlight-typedoc generating API reference for 15 packages
- AI documentation generation pipeline from SpecKit artifacts
- RAG ingestion script using ContentIngestionService from @tempot/ai-core
- Frontmatter validation with Zod + neverthrow Result pattern
- Freshness detection via git timestamps
- Vale prose linting with custom Tempot style rules
- RTL/LTR rendering verification (13 E2E tests)
- Bilingual content seeding (8 pages × 2 locales)
- 119 tests (unit + integration + E2E)

Cross-package changes:

- ai-core: Added Markdown-aware chunking strategy (chunkMarkdown) for heading-based RAG splitting

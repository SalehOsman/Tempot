# Quickstart: Reviewing The Tempot RAG Methodology

**Feature**: 027-tempot-multimodal-rag-methodology  
**Date**: 2026-04-29

This quickstart validates the methodology before production implementation.

## 1. Review Source Boundaries

Confirm each RAG stage has one owner:

| Stage                         | Owner                                       |
| ----------------------------- | ------------------------------------------- |
| Storage reference             | `storage-engine`                            |
| Parsing                       | future `document-engine` or `import-engine` |
| Content block ingestion       | `ai-core`                                   |
| Vector persistence            | `database`                                  |
| Hybrid retrieval              | current `ai-core`, future `search-engine`   |
| Generation and grounding      | `ai-core`                                   |
| Module knowledge registration | `modules/*` via events                      |

## 2. Validate A Mixed Document Example

Use this conceptual document:

- title paragraph
- two body paragraphs
- one table
- one image with caption
- one formula

Expected result:

- at least five content blocks
- source sequence preserved
- table and image linked to the surrounding section
- image represented by metadata and optional binary reference
- formula represented as a formula block with text explanation when available

## 3. Validate Access Filtering

Use two roles:

- `USER`
- `SUPER_ADMIN`

Expected result:

- user retrieves only allowed blocks
- super admin retrieves admin-only blocks
- relationship traversal never leaks forbidden blocks

## 4. Validate No-Context Behavior

Ask a question with no matching authorized content.

Expected result:

- answer state is `no-context`
- user-facing text comes from i18n
- no unsupported answer is generated

## 5. Validate Evaluation Readiness

An implementation plan is ready only when it can define at least:

- one retrieval hit case
- one no-context case
- one unauthorized-content case
- one multimodal-content case

## Verification Commands

```powershell
pnpm spec:validate
pnpm lint
pnpm test:unit
```

Implementation slices may require additional package-specific tests.

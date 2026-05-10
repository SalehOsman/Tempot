# AI RAG Methodology

> Feature reference: `specs/027-tempot-multimodal-rag-methodology/`
>
> Status: Planning methodology. This document does not activate deferred
> packages or introduce a runtime dependency on HKUDS/RAG-Anything.

## Purpose

Tempot adopts a multimodal RAG methodology inspired by RAG-Anything while
remaining TypeScript-native and aligned with Tempot package boundaries.

The useful methodology is:

1. Normalize sources into structured content blocks.
2. Preserve relationships between blocks.
3. Retrieve with a hybrid plan instead of vector-only assumptions.
4. Generate answers only from authorized, cited context.
5. Measure retrieval quality, grounding, latency, and cost.

## Non-Goals

- Do not import, vendor, or run the Python RAG-Anything project.
- Do not add a Python sidecar service.
- Do not move document parsing, search, storage, and answer generation into one
  package.
- Do not activate `document-engine`, `search-engine`, or `import-engine`
  without a roadmap decision.

## Package Responsibility Matrix

| RAG stage                          | Current owner          | Future owner when activated                        |
| ---------------------------------- | ---------------------- | -------------------------------------------------- |
| File storage and binary references | `storage-engine`       | `storage-engine`                                   |
| Document parsing                   | Not active             | `document-engine`                                  |
| External import parsing            | Not active             | `import-engine`                                    |
| Content block contract             | `ai-core`              | Shared public contract                             |
| Embedding orchestration            | `ai-core`              | `ai-core`                                          |
| Vector persistence                 | `database`             | `database`                                         |
| Vector retrieval                   | `ai-core`              | `search-engine` may own hybrid retrieval           |
| Lexical retrieval                  | Not active             | `search-engine`                                    |
| Relationship expansion             | Logical only           | `search-engine` or `database` implementation slice |
| Answer grounding                   | `ai-core`              | `ai-core`                                          |
| RAG evaluation                     | `ai-core` methodology  | `ai-core` plus future CLI                          |
| Module knowledge registration      | `modules/*` via events | `modules/*` via events                             |

## Methodology Pipeline

```text
ContentSource
-> Parser or direct content insertion
-> ContentBlock normalization
-> PII and access policy validation
-> Embedding and metadata indexing
-> RetrievalPlan selection
-> Authorized context assembly
-> GroundedAnswer generation
-> Evaluation and audit
```

## Content Block Rules

Every content block must have:

- stable identity
- source reference
- block type
- source order
- metadata
- extraction confidence
- access policy
- PII state
- embedding state

Direct insertion of pre-parsed content blocks is allowed only through public
contracts and still requires validation, audit, and access policy checks.

## Retrieval Rules

Retrieval is hybrid by design. The first implementation may be vector-only, but
the contract must allow:

- semantic vector search
- lexical search
- content type filters
- access filters
- relationship expansion
- reranking

Unauthorized content must be filtered before context reaches the model.

## Grounding Rules

An answer is grounded only when it cites at least one authorized content block.
If no sufficient context exists, the assistant returns a localized no-context
response. Unsupported generation is not acceptable.

## Evaluation Rules

RAG quality must be measured with repeatable cases that track:

- retrieval hit rate
- citation coverage
- unauthorized source leakage
- unsupported-answer rate
- no-context correctness
- latency
- token usage and cost

## Activation Guidance

This methodology suggests but does not activate deferred packages.

- Activate `document-engine` when Tempot needs first-party parsing for PDF,
  Office, image-heavy, or mixed-format documents.
- Activate `search-engine` when vector-only retrieval is not enough and lexical,
  relationship, or reranking signals become necessary.
- Activate `import-engine` when external systems need repeatable ingestion into
  Tempot content blocks.

Each activation requires its own SpecKit feature and Superpowers execution flow.

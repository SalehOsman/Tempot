# Data Model: AI Core Content Block Contracts

**Feature**: 029-ai-core-content-block-contracts
**Date**: 2026-04-29

## Entity: ContentSource

| Field | Description | Rules |
| --- | --- | --- |
| `id` | Stable source identifier | Required |
| `kind` | Source kind | Required |
| `originPackage` | Package or module registering source | Required |
| `title` | Source display title | Optional |
| `locale` | Source locale | Optional |
| `checksum` | File checksum | Optional in this slice |
| `accessPolicy` | Access policy reference | Required |
| `botId` | Future bot scope | Optional |
| `tenantId` | Future tenant scope | Optional |

## Entity: ContentBlock

| Field | Description | Rules |
| --- | --- | --- |
| `id` | Stable block identifier | Required |
| `sourceId` | Parent source id | Required |
| `blockType` | Normalized modality type | Required |
| `sequence` | Order within source | Required, integer >= 0 |
| `text` | Searchable text | Optional if `binaryRef` exists |
| `binaryRef` | Storage reference | Optional if `text` exists |
| `metadata` | Structured metadata | Required object |
| `extractionConfidence` | Extraction confidence | Required, 0 through 1 |
| `accessPolicy` | Block-level access policy | Required |
| `piiState` | PII handling state | Required |
| `embeddingState` | Embedding lifecycle state | Required |

## Entity: GroundedAnswer

| Field | Description | Rules |
| --- | --- | --- |
| `answerId` | Stable answer id | Required |
| `state` | Answer state | Required |
| `messageKey` | i18n message key | Required for user-facing states |
| `citations` | Cited content block ids | Required for answered state |
| `confidence` | Grounding confidence | Required, 0 through 1 |
| `provider` | AI provider id | Optional |
| `model` | AI model id | Optional |
| `usage` | Usage metadata | Optional |

## Validation Rules

- Source id, kind, origin package, and access policy are mandatory.
- A block must contain searchable text or a binary reference.
- Raw PII blocks are not embeddable by default.
- Answered grounded answers require at least one citation.

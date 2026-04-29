# Data Model: Tempot Multimodal RAG Methodology

**Feature**: 027-tempot-multimodal-rag-methodology  
**Date**: 2026-04-29

This model is logical. Physical schema changes must be designed in the implementation phase after package ownership is confirmed.

## Entity: ContentSource

Represents any source that can produce retrievable knowledge.

| Field           | Description                                                                      | Rules                              |
| --------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| `id`            | Stable source identifier                                                         | Required                           |
| `kind`          | `document`, `message`, `module-artifact`, `imported-dataset`, `custom-knowledge` | Required                           |
| `originPackage` | Package or module that registered the source                                     | Required                           |
| `title`         | Human-readable source title                                                      | Optional                           |
| `locale`        | Source language or locale                                                        | Optional                           |
| `checksum`      | Content hash for deduplication                                                   | Required for files                 |
| `accessPolicy`  | Access policy reference                                                          | Required                           |
| `botId`         | Future SaaS bot scope                                                            | Optional in Core, required in SaaS |
| `tenantId`      | Future SaaS tenant scope                                                         | Optional in Core, required in SaaS |

## Entity: ContentBlock

Represents one normalized retrievable unit.

| Field                  | Description                                                                            | Rules                           |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------- |
| `id`                   | Stable block identifier                                                                | Required                        |
| `sourceId`             | Parent content source                                                                  | Required                        |
| `blockType`            | `text`, `table`, `image`, `chart`, `formula`, `audio`, `video`, `pdf-page`, `metadata` | Required                        |
| `sequence`             | Order within the source                                                                | Required                        |
| `text`                 | Searchable text representation                                                         | Optional for binary-only blocks |
| `binaryRef`            | Storage reference for media                                                            | Optional                        |
| `metadata`             | Structured block metadata                                                              | Required, may be empty          |
| `extractionConfidence` | Parser confidence from 0 to 1                                                          | Required                        |
| `accessPolicy`         | Block-level access policy                                                              | Required                        |
| `piiState`             | `raw`, `sanitized`, `redacted`, `none`                                                 | Required                        |
| `embeddingState`       | `not-indexed`, `indexed`, `failed`, `stale`                                            | Required                        |

## Entity: BlockRelationship

Represents contextual relationships between blocks.

| Field              | Description                                                                                                                  | Rules    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| `id`               | Stable relationship identifier                                                                                               | Required |
| `fromBlockId`      | Source block                                                                                                                 | Required |
| `toBlockId`        | Target block                                                                                                                 | Required |
| `relationshipType` | `next`, `previous`, `caption-of`, `describes`, `belongs-to-section`, `table-row-context`, `formula-explains`, `derived-from` | Required |
| `weight`           | Relationship strength from 0 to 1                                                                                            | Required |
| `metadata`         | Relationship metadata                                                                                                        | Optional |

## Entity: KnowledgeIndex

Represents index metadata for a content block.

| Field                 | Description                              | Rules    |
| --------------------- | ---------------------------------------- | -------- |
| `blockId`             | Indexed content block                    | Required |
| `embeddingModel`      | Embedding model identifier               | Required |
| `embeddingDimensions` | Vector dimensions                        | Required |
| `vectorSpaceId`       | Stable identifier for compatible vectors | Required |
| `lexicalDocumentId`   | Future lexical index reference           | Optional |
| `indexedAt`           | Index timestamp                          | Required |
| `staleReason`         | Why index is stale                       | Optional |

## Entity: RetrievalPlan

Represents the selected retrieval strategy for a user query.

| Field                 | Description                                     | Rules    |
| --------------------- | ----------------------------------------------- | -------- |
| `queryId`             | Query or request identifier                     | Required |
| `role`                | User role at request time                       | Required |
| `locale`              | User locale                                     | Required |
| `contentTypes`        | Allowed content types                           | Required |
| `retrievalModes`      | `vector`, `lexical`, `relationship`, `rerank`   | Required |
| `confidenceThreshold` | Minimum confidence for grounded answer          | Required |
| `limit`               | Maximum blocks before reranking                 | Required |
| `filters`             | Access, tenant, bot, module, and source filters | Required |

## Entity: GroundedAnswer

Represents the final answer state.

| Field        | Description                                               | Rules                       |
| ------------ | --------------------------------------------------------- | --------------------------- |
| `answerId`   | Stable answer identifier                                  | Required                    |
| `state`      | `answered`, `no-context`, `refused`, `degraded`, `failed` | Required                    |
| `messageKey` | i18n key for user-facing text                             | Required when user-facing   |
| `citations`  | Referenced content block IDs                              | Required for answered state |
| `confidence` | Grounding confidence                                      | Required                    |
| `provider`   | Provider used for generation                              | Required when generated     |
| `model`      | Model used for generation                                 | Required when generated     |
| `usage`      | Token and cost metadata                                   | Optional                    |

## Entity: RAGEvaluationCase

Represents a repeatable evaluation case.

| Field                 | Description                 | Rules                        |
| --------------------- | --------------------------- | ---------------------------- |
| `id`                  | Stable case identifier      | Required                     |
| `query`               | User query                  | Required                     |
| `role`                | Role used for access checks | Required                     |
| `locale`              | Query locale                | Required                     |
| `expectedBlockIds`    | Expected source blocks      | Required for retrieval tests |
| `forbiddenBlockIds`   | Blocks that must not appear | Optional                     |
| `expectedAnswerRules` | Grounding and refusal rules | Required                     |
| `tags`                | Scenario tags               | Optional                     |

## State Transitions

### ContentBlock Embedding State

```text
not-indexed -> indexed
not-indexed -> failed
indexed -> stale
stale -> indexed
failed -> indexed
```

### GroundedAnswer State

```text
retrieval-started -> answered
retrieval-started -> no-context
retrieval-started -> refused
retrieval-started -> degraded
retrieval-started -> failed
```

## Validation Rules

- A block cannot be used for answer generation unless access policy passes for the user.
- A generated answer cannot be marked `answered` without at least one citation.
- A vector index cannot mix incompatible embedding models or dimensions under the same `vectorSpaceId`.
- A block marked `raw` for PII cannot be embedded unless the content type explicitly allows it.
- Relationship traversal must not bypass access filters.

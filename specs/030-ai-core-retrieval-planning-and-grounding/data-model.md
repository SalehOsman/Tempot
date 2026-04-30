# Data Model: AI Core Retrieval Planning And Grounding

**Feature**: 030-ai-core-retrieval-planning-and-grounding
**Date**: 2026-04-29

## Entity: RetrievalRequest

| Field | Description | Rules |
| --- | --- | --- |
| `requestId` | Stable request identifier | Required |
| `queryText` | User query text | Required unless `queryBlockId` exists |
| `queryBlockId` | Existing content block used as query | Required unless `queryText` exists |
| `locale` | Request locale | Required |
| `allowedContentTypes` | Content types available to caller | Required, non-empty |
| `userScope` | User, role, bot, and tenant scope | Required |
| `maxResults` | Maximum selected blocks | Required, integer > 0 |
| `confidenceThreshold` | Minimum grounding confidence | Required, 0 through 1 |

## Entity: RetrievalPlan

| Field | Description | Rules |
| --- | --- | --- |
| `planId` | Stable plan identifier | Required |
| `requestId` | Parent request id | Required |
| `steps` | Ordered retrieval steps | Required, non-empty |
| `policy` | Execution policy | Required |
| `createdAt` | Creation timestamp | Required ISO string |

## Entity: RetrievalStep

| Field | Description | Rules |
| --- | --- | --- |
| `id` | Stable step id | Required |
| `kind` | Step kind | Required |
| `inputRefs` | References consumed by the step | Optional |
| `outputRef` | Step output reference | Required |
| `required` | Whether the plan fails without this step | Required boolean |
| `params` | Step-specific parameters | Required object |

Supported step kinds:

- `vector`
- `lexical`
- `relationship-expansion`
- `content-type-filter`
- `access-filter`
- `rerank`
- `context-assembly`

## Entity: RetrievalOutcome

| Field | Description | Rules |
| --- | --- | --- |
| `outcomeId` | Stable outcome identifier | Required |
| `planId` | Parent plan id | Required |
| `selectedBlockIds` | Blocks allowed into generation context | Required |
| `rejectedBlocks` | Rejected block ids and reason codes | Required |
| `timings` | Per-stage timing metadata | Required |
| `degraded` | Whether retrieval degraded | Required boolean |

## Entity: RAGAnswerState

| Field | Description | Rules |
| --- | --- | --- |
| `answerId` | Stable answer identifier | Required |
| `state` | Answer state | Required |
| `messageKey` | i18n message key | Required for non-answered states |
| `citations` | Cited content block ids | Required for answered state |
| `confidence` | Grounding confidence | Required, 0 through 1 |
| `provider` | AI provider id | Optional |
| `model` | AI model id | Optional |
| `usage` | Token and cost metadata | Optional |

## Validation Rules

- Retrieval requests must include query text or a query block reference.
- Retrieval plans must include access filtering before context assembly.
- Relationship expansion cannot appear after context assembly.
- Answered states require at least one citation.
- Non-answered states require an i18n message key.

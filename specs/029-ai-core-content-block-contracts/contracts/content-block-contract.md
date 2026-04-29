# Contract: AI Core Content Block Public API

**Feature**: 029-ai-core-content-block-contracts
**Date**: 2026-04-29

## Public Exports

`@tempot/ai-core` MUST export:

- `ContentSource`
- `ContentBlock`
- `ContentBlockEmbeddingPolicy`
- `GroundedAnswer`
- `validateContentSource`
- `validateContentBlock`
- `validateEmbeddableContentBlock`
- `validateGroundedAnswer`

## Validation Return Type

All validators return:

```ts
Result<T, AppError>
```

## Error Codes

- `ai-core.content_source.invalid`
- `ai-core.content_block.invalid`
- `ai-core.content_block.raw_pii`
- `ai-core.content_block.not_embeddable`
- `ai-core.rag.grounding_invalid`

## Boundary Rules

- The public barrel is the supported import path for consumers.
- This slice does not import from deferred packages.
- This slice does not evaluate access permissions; it validates that an access policy reference exists.

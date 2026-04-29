# Quickstart: AI Core Content Block Contracts

**Feature**: 029-ai-core-content-block-contracts
**Date**: 2026-04-29

## Example

```ts
import {
  validateContentBlock,
  validateEmbeddableContentBlock,
} from '@tempot/ai-core';

const result = validateContentBlock({
  id: 'block-1',
  sourceId: 'source-1',
  blockType: 'text',
  sequence: 0,
  text: 'Knowledge content',
  metadata: {},
  extractionConfidence: 0.95,
  accessPolicy: { policyId: 'public-docs', scope: 'public' },
  piiState: 'none',
  embeddingState: 'not-indexed',
});

if (result.isOk()) {
  validateEmbeddableContentBlock(result.value);
}
```

## Verification

```bash
pnpm --filter @tempot/ai-core test
pnpm lint
pnpm spec:validate
git diff --check
```

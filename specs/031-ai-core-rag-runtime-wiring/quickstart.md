# Quickstart: AI Core RAG Runtime Wiring

**Feature**: 031-ai-core-rag-runtime-wiring
**Date**: 2026-04-30

## 1. Verify the contracts foundation

Before executing this spec, confirm Spec #029 and Spec #030 exports are available:

```typescript
import {
  validateRetrievalRequest,
  validateRetrievalPlan,
  validateRetrievalOutcome,
  validateRAGAnswerState,
} from '@tempot/ai-core';
```

Run: `pnpm --filter @tempot/ai-core test` — should pass with zero failures.

## 2. Use the new retrieveWithPlan method

```typescript
import { RAGPipeline } from '@tempot/ai-core';
import type { RetrievalRequest } from '@tempot/ai-core';

const request: RetrievalRequest = {
  requestId: crypto.randomUUID(),
  queryText: 'كيف أضيف موظفاً جديداً؟',
  locale: 'ar',
  allowedContentTypes: ['ui-guide', 'custom-knowledge'],
  userScope: { userId: 'u1', role: 'user' },
  maxResults: 5,
  confidenceThreshold: 0.75,
};

const outcomeResult = await pipeline.retrieveWithPlan(request);

if (outcomeResult.isErr()) {
  // handle AppError
}

const outcome = outcomeResult.value;
// outcome.selectedBlockIds  — blocks passed to LLM
// outcome.rejectedBlocks    — blocks filtered with reason codes
// outcome.timings           — per-step durations
```

## 3. Convert outcome to RAGAnswerState

```typescript
const stateResult = pipeline.buildAnswerState(outcome);

if (stateResult.isErr()) {
  // handle AppError
}

const state = stateResult.value;

switch (state.state) {
  case 'answered':
    // state.citations contains blockIds
    break;
  case 'no-context':
    // state.messageKey is an i18n key — translate for user
    break;
  case 'degraded':
    // state.messageKey is an i18n key — translate for user
    break;
}
```

## 4. Verify backward compatibility

```typescript
// Old signature must still work:
const context = await pipeline.retrieve({
  query: 'test',
  userRole: 'user',
  userId: 'u1',
});
// Returns ok(RAGContext) as before
```

## 5. Verification commands

```powershell
pnpm --filter @tempot/ai-core test
pnpm lint
pnpm spec:validate
git diff --check
```

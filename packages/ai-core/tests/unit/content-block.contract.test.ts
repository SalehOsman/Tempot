import { describe, expect, it } from 'vitest';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import {
  validateContentBlock,
  validateContentSource,
  validateEmbeddableContentBlock,
  validateGroundedAnswer,
} from '../../src/index.js';
import type {
  ContentBlock,
  ContentSource,
  GroundedAnswer,
} from '../../src/index.js';

const accessPolicy = { policyId: 'public-docs', scope: 'public' } as const;

function createSource(overrides: Partial<ContentSource> = {}): ContentSource {
  return {
    id: 'source-1',
    kind: 'document',
    originPackage: '@tempot/ai-core',
    accessPolicy,
    ...overrides,
  };
}

function createBlock(overrides: Partial<ContentBlock> = {}): ContentBlock {
  return {
    id: 'block-1',
    sourceId: 'source-1',
    blockType: 'text',
    sequence: 0,
    text: 'Knowledge content',
    metadata: {},
    extractionConfidence: 0.95,
    accessPolicy,
    piiState: 'none',
    embeddingState: 'not-indexed',
    ...overrides,
  };
}

function createAnswer(overrides: Partial<GroundedAnswer> = {}): GroundedAnswer {
  return {
    answerId: 'answer-1',
    state: 'answered',
    messageKey: 'ai-core.rag.answer.grounded',
    citations: ['block-1'],
    confidence: 0.9,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    ...overrides,
  };
}

describe('Content block public contracts', () => {
  it('validates a complete content source through the public barrel', () => {
    const source = createSource();

    const result = validateContentSource(source);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(source);
  });

  it('validates a complete content block through the public barrel', () => {
    const block = createBlock();

    const result = validateContentBlock(block);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(block);
  });

  it('rejects blocks without text or binary reference', () => {
    const block = createBlock({ text: undefined, binaryRef: undefined });

    const result = validateContentBlock(block);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.CONTENT_BLOCK_INVALID);
  });

  it('rejects raw PII blocks for embedding by default', () => {
    const block = createBlock({ piiState: 'raw' });

    const result = validateEmbeddableContentBlock(block);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.CONTENT_BLOCK_RAW_PII);
  });

  it('rejects answered grounded answers without citations', () => {
    const answer = createAnswer({ citations: [] });

    const result = validateGroundedAnswer(answer);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.RAG_GROUNDING_INVALID);
  });

  it('allows no-context grounded answers with an i18n message key', () => {
    const answer = createAnswer({
      state: 'no-context',
      messageKey: 'ai-core.rag.no_context',
      citations: [],
      provider: undefined,
      model: undefined,
    });

    const result = validateGroundedAnswer(answer);

    expect(result.isOk()).toBe(true);
  });
});

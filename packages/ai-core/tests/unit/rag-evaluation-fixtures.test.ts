import { describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import type { EmbeddingService } from '../../src/embedding/embedding.service.js';
import { buildAnswerState, RAGPipeline } from '../../src/rag/rag-pipeline.service.js';
import type { RAGAnswerState, RetrievalOutcome } from '../../src/rag/retrieval-plan.types.js';
import { ragEvaluationFixtures } from '../fixtures/rag-evaluation.fixtures.js';
import type { RAGEvaluationFixture } from '../fixtures/rag-evaluation.fixtures.js';
import { evaluateRAGFixture } from '../helpers/rag-evaluation.helper.js';

describe('RAG evaluation fixtures (Spec #032)', () => {
  it('should provide deterministic cases for each approved metric category', () => {
    expect(ragEvaluationFixtures.map((fixture) => fixture.id)).toEqual([
      'authorized-hit',
      'citation-coverage',
      'leakage-prevention',
      'no-context',
    ]);
  });

  it('should score retrieval hits when expected blocks are selected', () => {
    const fixture = findFixture('authorized-hit');
    const score = evaluateRAGFixture({
      outcome: outcome(['guide-reset']),
      answerState: answerState(['guide-reset']),
      expectation: fixture.expectation,
    });
    expect(score.isOk()).toBe(true);
    expect(score._unsafeUnwrap()).toMatchObject({ retrievalHit: true });
  });

  it('should report missing retrieval hits when expected blocks are absent', () => {
    const fixture = findFixture('authorized-hit');
    const score = evaluateRAGFixture({
      outcome: outcome([]),
      answerState: answerState([]),
      expectation: fixture.expectation,
    });
    expect(score._unsafeUnwrap()).toMatchObject({
      retrievalHit: false,
      missingSelectedBlockIds: ['guide-reset'],
    });
  });

  it('should score citation coverage only when required selected blocks are cited', () => {
    const fixture = findFixture('citation-coverage');
    const score = evaluateRAGFixture({
      outcome: outcome(['guide-reset', 'memory-reset']),
      answerState: answerState(['guide-reset']),
      expectation: fixture.expectation,
    });
    expect(score._unsafeUnwrap()).toMatchObject({
      citationCoverage: false,
      missingCitationBlockIds: ['memory-reset'],
    });
  });

  it('should detect forbidden selected or cited block ids as leakage', () => {
    const fixture = findFixture('leakage-prevention');
    const score = evaluateRAGFixture({
      outcome: outcome(['guide-reset', 'memory-other']),
      answerState: answerState(['guide-reset', 'custom-user-only']),
      expectation: fixture.expectation,
    });
    expect(score._unsafeUnwrap()).toMatchObject({
      leakageDetected: true,
      leakedBlockIds: ['memory-other', 'custom-user-only'],
    });
  });

  it('should score no-context correctness from structured answer state', () => {
    const fixture = findFixture('no-context');
    const score = evaluateRAGFixture({
      outcome: outcome([]),
      answerState: {
        answerId: 'answer-1',
        state: 'no-context',
        messageKey: 'ai-core.rag.no_context',
        citations: [],
        confidence: 0,
      },
      expectation: fixture.expectation,
    });
    expect(score._unsafeUnwrap()).toMatchObject({ noContextCorrect: true });
  });

  it('should evaluate selected fixtures through the runtime RAG path', async () => {
    for (const fixture of ragEvaluationFixtures) {
      const result = await new RAGPipeline(createEmbeddingService(fixture)).retrieveWithPlan(
        fixture.request,
      );
      expect(result.isOk()).toBe(true);
      const answer = buildAnswerState(result._unsafeUnwrap());
      expect(answer.isOk()).toBe(true);
      const score = evaluateRAGFixture({
        outcome: result._unsafeUnwrap(),
        answerState: answer._unsafeUnwrap(),
        expectation: fixture.expectation,
      });
      expect(score._unsafeUnwrap().leakageDetected).toBe(false);
    }
  });
});

function findFixture(id: string): RAGEvaluationFixture {
  const fixture = ragEvaluationFixtures.find((candidate) => candidate.id === id);
  if (!fixture) throw new Error(`Fixture not found: ${id}`);
  return fixture;
}

function outcome(selectedBlockIds: readonly string[]): RetrievalOutcome {
  return {
    outcomeId: 'outcome-1',
    planId: 'plan-1',
    selectedBlockIds,
    rejectedBlocks: [],
    timings: [],
    degraded: false,
  };
}

function answerState(blockIds: readonly string[]): RAGAnswerState {
  return {
    answerId: 'answer-1',
    state: blockIds.length > 0 ? 'answered' : 'no-context',
    messageKey: blockIds.length > 0 ? undefined : 'ai-core.rag.no_context',
    citations: blockIds.map((blockId) => ({ blockId })),
    confidence: blockIds.length > 0 ? 1 : 0,
  };
}

function createEmbeddingService(fixture: RAGEvaluationFixture): EmbeddingService {
  const searchSimilar = vi.fn(async () => ok([...fixture.searchResults]));
  return { searchSimilar } as unknown as EmbeddingService;
}

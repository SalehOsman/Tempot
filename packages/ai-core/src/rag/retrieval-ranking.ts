import type { EmbeddingSearchResult } from '../ai-core.types.js';

const GOVERNED_DOC_BOOSTS: Readonly<Record<string, number>> = {
  governance: 0.08,
  architecture: 0.07,
  'ai-context': 0.06,
  'start-here': 0.05,
  development: 0.04,
  operations: 0.04,
  modules: 0.03,
  packages: 0.02,
  reference: 0,
};

export function rankRetrievalResults(
  results: readonly EmbeddingSearchResult[],
): EmbeddingSearchResult[] {
  return results
    .map((result, index) => ({ result, index }))
    .sort(compareRankedResults)
    .map((ranked) => ranked.result);
}

interface RankedResult {
  result: EmbeddingSearchResult;
  index: number;
}

function compareRankedResults(left: RankedResult, right: RankedResult): number {
  const adjustedDiff = adjustedScore(right.result) - adjustedScore(left.result);
  if (adjustedDiff !== 0) return adjustedDiff;

  const scoreDiff = right.result.score - left.result.score;
  if (scoreDiff !== 0) return scoreDiff;

  return left.index - right.index;
}

function adjustedScore(result: EmbeddingSearchResult): number {
  return result.score + corpusBoost(result.metadata);
}

function corpusBoost(metadata: Record<string, unknown> | null): number {
  const sourcePriority = metadata?.['sourcePriority'];
  if (typeof sourcePriority === 'number' && Number.isFinite(sourcePriority)) {
    return sourcePriority / 1_000;
  }

  const filePath = metadata?.['filePath'];
  if (typeof filePath !== 'string') return 0;

  const root = filePath.replace(/\\/g, '/').split('/')[0];
  return GOVERNED_DOC_BOOSTS[root] ?? 0;
}

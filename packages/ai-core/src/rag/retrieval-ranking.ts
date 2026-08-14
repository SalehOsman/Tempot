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

const ARABIC_TEXT_RE = /[\u0600-\u06ff]/;
const QUERY_LANGUAGE_BOOST = 0.08;

export function rankRetrievalResults(
  results: readonly EmbeddingSearchResult[],
  queryText = '',
): EmbeddingSearchResult[] {
  const queryLanguage = detectQueryLanguage(queryText);
  return results
    .map((result, index) => ({ result, index }))
    .sort((left, right) => compareRankedResults(left, right, queryLanguage))
    .map((ranked) => ranked.result);
}

interface RankedResult {
  result: EmbeddingSearchResult;
  index: number;
}

function compareRankedResults(
  left: RankedResult,
  right: RankedResult,
  queryLanguage: string,
): number {
  const adjustedDiff =
    adjustedScore(right.result, queryLanguage) - adjustedScore(left.result, queryLanguage);
  if (adjustedDiff !== 0) return adjustedDiff;

  const scoreDiff = right.result.score - left.result.score;
  if (scoreDiff !== 0) return scoreDiff;

  return left.index - right.index;
}

function adjustedScore(result: EmbeddingSearchResult, queryLanguage: string): number {
  return (
    result.score + corpusBoost(result.metadata) + languageBoost(result.metadata, queryLanguage)
  );
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

function languageBoost(metadata: Record<string, unknown> | null, queryLanguage: string): number {
  if (queryLanguage === 'unknown') return 0;
  return sourceLanguage(metadata) === queryLanguage ? QUERY_LANGUAGE_BOOST : 0;
}

function sourceLanguage(metadata: Record<string, unknown> | null): string {
  const language = metadata?.['language'];
  if (language === 'ar' || language === 'en') return language;

  const filePath = metadata?.['filePath'];
  if (typeof filePath !== 'string') return 'unknown';

  const segments = filePath.replace(/\\/g, '/').split('/');
  if (segments.includes('ar')) return 'ar';
  if (segments.includes('en')) return 'en';
  return 'unknown';
}

function detectQueryLanguage(queryText: string): string {
  return ARABIC_TEXT_RE.test(queryText) ? 'ar' : 'unknown';
}

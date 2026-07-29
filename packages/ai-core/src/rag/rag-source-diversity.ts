import type { EmbeddingSearchResult } from '../ai-core.types.js';

export const RETRIEVAL_CANDIDATE_LIMIT = 20;
export const RETRIEVAL_CONTEXT_LIMIT = 5;

export function selectDiverseSources(
  results: readonly EmbeddingSearchResult[],
): EmbeddingSearchResult[] {
  const selected: EmbeddingSearchResult[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    const key = sourceKey(result);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(result);
    if (selected.length >= RETRIEVAL_CONTEXT_LIMIT) break;
  }
  return selected;
}

function sourceKey(result: EmbeddingSearchResult): string {
  const metadata = result.metadata;
  if (metadata && typeof metadata['filePath'] === 'string') return metadata['filePath'];
  return result.contentId.replace(/:\d+$/u, '');
}

import { createHash } from 'node:crypto';
import type { LanguageModelMiddleware } from 'ai';
import type { AICache, AILogger } from '../ai-core.contracts.js';

const DEFAULT_CACHE_TTL_MS = 86_400_000; // 24 hours

export function createCacheMiddleware(
  cache: AICache,
  logger: AILogger,
  ttlMs: number = DEFAULT_CACHE_TTL_MS,
): LanguageModelMiddleware {
  return {
    specificationVersion: 'v3' as const,
    wrapGenerate: async ({ doGenerate, params }) => {
      const cacheKey = computeCacheKey(params);
      const cached = await cache.get<Awaited<ReturnType<typeof doGenerate>>>(cacheKey);
      if (cached) {
        logger.debug({ message: 'AI cache hit', cacheKey });
        return cached;
      }
      const result = await doGenerate();
      await cache.set(cacheKey, result, ttlMs);
      return result;
    },
  };
}

// Scale assumption: < 1M cached entries — 64-bit hash has negligible collision probability at this scale
function computeCacheKey(params: Record<string, unknown>): string {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(params.prompt ?? ''));
  const toolNames = Object.keys((params.tools as Record<string, unknown>) ?? {}).sort();
  hash.update(JSON.stringify(toolNames));
  return `ai:cache:${hash.digest('hex').slice(0, 16)}`;
}

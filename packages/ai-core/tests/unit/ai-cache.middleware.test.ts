import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AICache, AILogger } from '../../src/ai-core.contracts.js';
import { createCacheMiddleware } from '../../src/cache/ai-cache.middleware.js';

// Scale assumption advisory note:
// These tests assume < 1M cached entries. At this scale, the 64-bit (16 hex char)
// SHA-256 truncation has negligible collision probability. If the system scales
// beyond this, the hash length should be revisited.

function createMockCache(): AICache {
  return {
    get: vi.fn().mockResolvedValue(null) as AICache['get'],
    set: vi.fn().mockResolvedValue(undefined) as AICache['set'],
    del: vi.fn().mockResolvedValue(undefined) as AICache['del'],
  };
}

function createMockLogger(): AILogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

type WrapGenerateOptions = Parameters<
  NonNullable<ReturnType<typeof createCacheMiddleware>['wrapGenerate']>
>[0];

describe('createCacheMiddleware', () => {
  let cache: AICache;
  let logger: AILogger;

  const fakeResult = {
    text: 'Hello world',
    finishReason: 'stop' as const,
    usage: { promptTokens: 10, completionTokens: 5 },
    rawCall: { rawPrompt: '', rawSettings: {} },
    rawResponse: { headers: {} },
    response: { id: 'resp-1', timestamp: new Date(), modelId: 'test' },
    warnings: [],
    request: { body: '' },
  };

  const baseParams = {
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
    tools: { search: {}, calculate: {} },
  };

  function callWrapGenerate(
    middleware: ReturnType<typeof createCacheMiddleware>,
    doGenerate: () => PromiseLike<typeof fakeResult>,
    params: Record<string, unknown> = baseParams,
  ) {
    return middleware.wrapGenerate!({
      doGenerate,
      params,
    } as unknown as WrapGenerateOptions);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    cache = createMockCache();
    logger = createMockLogger();
  });

  it('calls doGenerate and stores result on cache miss', async () => {
    const middleware = createCacheMiddleware(cache, logger);
    const doGenerate = vi.fn().mockResolvedValue(fakeResult);

    const result = await callWrapGenerate(middleware, doGenerate);

    expect(doGenerate).toHaveBeenCalledOnce();
    expect(cache.set).toHaveBeenCalledOnce();
    expect(result).toEqual(fakeResult);
  });

  it('returns cached result without calling doGenerate on cache hit', async () => {
    vi.mocked(cache.get).mockResolvedValue(fakeResult);
    const middleware = createCacheMiddleware(cache, logger);
    const doGenerate = vi.fn().mockResolvedValue(fakeResult);

    const result = await callWrapGenerate(middleware, doGenerate);

    expect(doGenerate).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
    expect(result).toEqual(fakeResult);
  });

  it('produces different cache keys for different prompts', async () => {
    const middleware = createCacheMiddleware(cache, logger);

    const params1 = {
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      tools: {},
    };
    const params2 = {
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'Goodbye' }] }],
      tools: {},
    };

    const doGenerate = vi.fn().mockResolvedValue(fakeResult);

    await callWrapGenerate(middleware, doGenerate, params1);
    await callWrapGenerate(middleware, doGenerate, params2);

    const firstKey = vi.mocked(cache.set).mock.calls[0]![0];
    const secondKey = vi.mocked(cache.set).mock.calls[1]![0];

    expect(firstKey).not.toBe(secondKey);
    expect(firstKey).toMatch(/^ai:cache:[0-9a-f]{16}$/);
    expect(secondKey).toMatch(/^ai:cache:[0-9a-f]{16}$/);
  });

  it('passes TTL to cache.set', async () => {
    const customTtl = 60_000; // 1 minute
    const middleware = createCacheMiddleware(cache, logger, customTtl);
    const doGenerate = vi.fn().mockResolvedValue(fakeResult);

    await callWrapGenerate(middleware, doGenerate);

    expect(cache.set).toHaveBeenCalledWith(
      expect.stringMatching(/^ai:cache:[0-9a-f]{16}$/),
      fakeResult,
      customTtl,
    );
  });

  it('logs debug message on cache hit', async () => {
    vi.mocked(cache.get).mockResolvedValue(fakeResult);
    const middleware = createCacheMiddleware(cache, logger);
    const doGenerate = vi.fn().mockResolvedValue(fakeResult);

    await callWrapGenerate(middleware, doGenerate);

    expect(logger.debug).toHaveBeenCalledWith({
      message: 'AI cache hit',
      cacheKey: expect.stringMatching(/^ai:cache:[0-9a-f]{16}$/),
    });
  });

  it('uses default TTL of 24 hours when none specified', async () => {
    const middleware = createCacheMiddleware(cache, logger);
    const doGenerate = vi.fn().mockResolvedValue(fakeResult);

    await callWrapGenerate(middleware, doGenerate);

    expect(cache.set).toHaveBeenCalledWith(
      expect.any(String),
      fakeResult,
      86_400_000, // 24 hours in ms
    );
  });
});

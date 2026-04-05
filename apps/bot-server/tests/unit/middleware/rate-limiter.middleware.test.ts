import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@grammyjs/ratelimiter', () => ({
  limit: vi.fn((config: { onLimitExceeded: (ctx: unknown) => Promise<void> }) => {
    const handler = async (ctx: unknown, next: () => Promise<void>): Promise<void> => {
      const limitState = (handler as unknown as { __exceeded: boolean }).__exceeded;
      if (limitState) {
        await config.onLimitExceeded(ctx);
        return;
      }
      await next();
    };
    (handler as unknown as { __exceeded: boolean }).__exceeded = false;
    return handler;
  }),
}));

import { createRateLimiterMiddleware } from '../../../src/bot/middleware/rate-limiter.middleware.js';
import { limit } from '@grammyjs/ratelimiter';

interface MockContext {
  from: { id: number };
  chat: { id: number };
  reply: ReturnType<typeof vi.fn>;
}

function createMockContext(overrides: Partial<MockContext> = {}): MockContext {
  return {
    from: { id: 123 },
    chat: { id: 456 },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('createRateLimiterMiddleware', () => {
  const mockT = vi.fn((key: string) => `translated:${key}`);
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn().mockResolvedValue(undefined);
  });

  it('calls next() for requests under limit', async () => {
    const middleware = createRateLimiterMiddleware({ t: mockT });
    const ctx = createMockContext();

    await (middleware as (ctx: unknown, next: () => Promise<void>) => Promise<void>)(ctx, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('sends localized rate limit message when over limit', async () => {
    const middleware = createRateLimiterMiddleware({ t: mockT });
    const ctx = createMockContext();

    // Simulate exceeding the rate limit
    (middleware as unknown as { __exceeded: boolean }).__exceeded = true;

    await (middleware as (ctx: unknown, next: () => Promise<void>) => Promise<void>)(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.rate_limit_exceeded');
  });

  it('passes correct config to limit()', () => {
    createRateLimiterMiddleware({ t: mockT });

    expect(limit).toHaveBeenCalledWith(
      expect.objectContaining({
        timeFrame: expect.any(Number) as number,
        limit: expect.any(Number) as number,
        onLimitExceeded: expect.any(Function) as (...args: unknown[]) => unknown,
      }),
    );
  });
});

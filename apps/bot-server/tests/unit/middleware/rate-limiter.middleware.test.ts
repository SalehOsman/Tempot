import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRateLimiterMiddleware } from '../../../src/bot/middleware/rate-limiter.middleware.js';

function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

interface MockContext {
  from: { id: number } | undefined;
  message?: {
    text?: string;
    document?: unknown;
    photo?: unknown[];
    video?: unknown;
  };
  reply: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

function createMockContext(overrides: Partial<MockContext> = {}): MockContext {
  return {
    from: { id: 123 },
    message: { text: 'hello' },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('createRateLimiterMiddleware', () => {
  const mockT = vi.fn((key: string) => `translated:${key}`);
  const mockLogger = createMockLogger();
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn().mockResolvedValue(undefined);
  });

  it('allows plain messages under the limit', async () => {
    const middleware = createRateLimiterMiddleware({ t: mockT, logger: mockLogger });
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('allows command messages under the limit', async () => {
    const middleware = createRateLimiterMiddleware({ t: mockT, logger: mockLogger });
    const ctx = createMockContext({ message: { text: '/start' } });

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks when command limit exceeded (10/min)', async () => {
    const middleware = createRateLimiterMiddleware({ t: mockT, logger: mockLogger });

    for (let i = 0; i < 10; i++) {
      const ctx = createMockContext({ message: { text: '/help' } });
      await middleware(ctx as never, next);
    }

    const ctx = createMockContext({ message: { text: '/help' } });
    next.mockClear();
    await middleware(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.rate_limit_exceeded');
  });

  it('blocks when message limit exceeded (30/min)', async () => {
    const middleware = createRateLimiterMiddleware({ t: mockT, logger: mockLogger });

    for (let i = 0; i < 30; i++) {
      const ctx = createMockContext({
        from: { id: 999 },
        message: { text: 'msg' },
      });
      await middleware(ctx as never, next);
    }

    const ctx = createMockContext({
      from: { id: 999 },
      message: { text: 'msg' },
    });
    next.mockClear();
    await middleware(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.rate_limit_exceeded');
  });

  it('blocks when upload limit exceeded (5/10min)', async () => {
    const middleware = createRateLimiterMiddleware({ t: mockT, logger: mockLogger });

    for (let i = 0; i < 5; i++) {
      const ctx = createMockContext({
        from: { id: 777 },
        message: { document: { file_id: 'abc' } },
      });
      await middleware(ctx as never, next);
    }

    const ctx = createMockContext({
      from: { id: 777 },
      message: { document: { file_id: 'def' } },
    });
    next.mockClear();
    await middleware(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.rate_limit_exceeded');
  });

  it('skips rate limiting for updates without from', async () => {
    const middleware = createRateLimiterMiddleware({ t: mockT, logger: mockLogger });
    const ctx = createMockContext({ from: undefined });

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('uses separate limits per user', async () => {
    const middleware = createRateLimiterMiddleware({ t: mockT, logger: mockLogger });

    // Exhaust command limit for user 111
    for (let i = 0; i < 10; i++) {
      const ctx = createMockContext({
        from: { id: 111 },
        message: { text: '/cmd' },
      });
      await middleware(ctx as never, next);
    }

    // User 222 should still be allowed
    const ctx = createMockContext({
      from: { id: 222 },
      message: { text: '/cmd' },
    });
    next.mockClear();
    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('logs warning and swallows error when ctx.reply fails during rate limit', async () => {
    const logger = createMockLogger();
    const middleware = createRateLimiterMiddleware({ t: mockT, logger });

    // Exhaust command limit for user 555
    for (let i = 0; i < 10; i++) {
      const ctx = createMockContext({
        from: { id: 555 },
        message: { text: '/help' },
      });
      await middleware(ctx as never, next);
    }

    // 11th request — ctx.reply will throw (simulating blocked bot)
    const ctx = createMockContext({
      from: { id: 555 },
      message: { text: '/help' },
      reply: vi.fn().mockRejectedValue(new Error('Forbidden: bot was blocked')),
    });
    next.mockClear();

    // Should NOT throw
    await middleware(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'bot-server.rate_limit_reply_failed' }),
    );
  });

  it('logs rate limit event when user is blocked', async () => {
    const logger = createMockLogger();
    const middleware = createRateLimiterMiddleware({ t: mockT, logger });

    // Exhaust command limit for user 888
    for (let i = 0; i < 10; i++) {
      const ctx = createMockContext({
        from: { id: 888 },
        message: { text: '/test' },
      });
      await middleware(ctx as never, next);
    }

    const ctx = createMockContext({
      from: { id: 888 },
      message: { text: '/test' },
    });
    next.mockClear();
    await middleware(ctx as never, next);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'bot-server.rate_limited',
        userId: 888,
        scope: 'command',
      }),
    );
  });
});

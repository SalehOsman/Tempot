import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthMiddleware } from '../../../src/bot/middleware/auth.middleware.js';
import type { AuthDeps } from '../../../src/bot/middleware/auth.middleware.js';

interface MockContext {
  from: { id: number } | undefined;
  chat: { id: number };
  reply: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

function createMockContext(overrides: Partial<MockContext> = {}): MockContext {
  return {
    from: { id: 123 },
    chat: { id: 456 },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('createAuthMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;
  const mockT = vi.fn((key: string) => `translated:${key}`);

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn().mockResolvedValue(undefined);
  });

  it('allows authorized users and stores session user on context', async () => {
    const sessionUser = { id: 'user-1', role: 'USER' };
    const deps: AuthDeps = {
      getSessionUser: vi.fn().mockResolvedValue(sessionUser),
      t: mockT,
    };

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx['sessionUser']).toEqual(sessionUser);
  });

  it('blocks requests without from field with localized message', async () => {
    const deps: AuthDeps = {
      getSessionUser: vi.fn(),
      t: mockT,
    };

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext({ from: undefined });

    await middleware(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.unauthorized');
  });

  it('allows guest users (no session) and calls next', async () => {
    const deps: AuthDeps = {
      getSessionUser: vi.fn().mockResolvedValue(null),
      t: mockT,
    };

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(deps.getSessionUser).toHaveBeenCalledWith(123);
  });
});

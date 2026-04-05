import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthMiddleware } from '../../../src/bot/middleware/auth.middleware.js';
import type { AuthDeps } from '../../../src/bot/middleware/auth.middleware.js';
import { RoleEnum } from '@tempot/auth-core';

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

function createDeps(overrides: Partial<AuthDeps> = {}): AuthDeps {
  return {
    getSessionUser: vi.fn().mockResolvedValue(null),
    abilityDefinitions: [],
    logger: {
      warn: vi.fn(),
    },
    t: vi.fn((key: string) => `translated:${key}`),
    ...overrides,
  };
}

describe('createAuthMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn().mockResolvedValue(undefined);
  });

  it('stores session user and ability on context for known users', async () => {
    const sessionUser = { id: 'user-1', role: RoleEnum.USER };
    const deps = createDeps({
      getSessionUser: vi.fn().mockResolvedValue(sessionUser),
    });

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx['sessionUser']).toEqual(sessionUser);
    expect(ctx['ability']).toBeDefined();
  });

  it('blocks requests without from field with localized message', async () => {
    const deps = createDeps();

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext({ from: undefined });

    await middleware(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.unauthorized');
  });

  it('creates guest session user when no session found', async () => {
    const deps = createDeps({
      getSessionUser: vi.fn().mockResolvedValue(null),
    });

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx['sessionUser']).toEqual({
      id: '123',
      role: RoleEnum.GUEST,
    });
    expect(ctx['ability']).toBeDefined();
  });

  it('calls next even when ability build fails', async () => {
    const sessionUser = { id: 'user-1', role: RoleEnum.USER };
    const failingDefinition = () => {
      throw new Error('definition error');
    };
    const deps = createDeps({
      getSessionUser: vi.fn().mockResolvedValue(sessionUser),
      abilityDefinitions: [failingDefinition],
    });

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx['sessionUser']).toEqual(sessionUser);
    expect(deps.logger.warn).toHaveBeenCalled();
  });

  it('passes user id to getSessionUser', async () => {
    const deps = createDeps();

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext({ from: { id: 999 } });

    await middleware(ctx as never, next);

    expect(deps.getSessionUser).toHaveBeenCalledWith(999);
  });
});

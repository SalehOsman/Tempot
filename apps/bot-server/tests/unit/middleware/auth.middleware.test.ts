import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthMiddleware } from '../../../src/bot/middleware/auth.middleware.js';
import type { AuthDeps } from '../../../src/bot/middleware/auth.middleware.js';
import { RoleEnum, AbilityFactory } from '@tempot/auth-core';
import { createMongoAbility } from '@casl/ability';
import type { AbilityDefinition } from '@tempot/auth-core';

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
      error: vi.fn(),
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
    AbilityFactory.clearCache();
  });

  const manageAllDefinition: AbilityDefinition = () =>
    createMongoAbility([{ action: 'manage', subject: 'all' }]);

  it('stores session user and ability on context for known users', async () => {
    const sessionUser = { id: 'user-1', role: RoleEnum.USER, status: 'ACTIVE' as const };
    const readProfileDefinition: AbilityDefinition = () =>
      createMongoAbility([{ action: 'read', subject: 'profile' }]);
    const deps = createDeps({
      getSessionUser: vi.fn().mockResolvedValue(sessionUser),
      abilityDefinitions: [readProfileDefinition],
    });

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx['sessionUser']).toEqual(sessionUser);
    expect(ctx['ability']).toBeDefined();
  });

  it('blocks a BANNED session even when its ability contains manage all', async () => {
    const sessionUser = {
      id: 'disabled-user',
      role: RoleEnum.SUPER_ADMIN,
      status: 'BANNED' as const,
    };
    const deps = createDeps({
      getSessionUser: vi.fn().mockResolvedValue(sessionUser),
      abilityDefinitions: [manageAllDefinition],
    });

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.unauthorized');
    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'access_denied',
        reason: 'session_banned',
      }),
    );
  });

  it('passes a PENDING session to the access gate with no effective abilities', async () => {
    const sessionUser = {
      id: 'pending-user',
      role: RoleEnum.SUPER_ADMIN,
      status: 'PENDING' as const,
    };
    const deps = createDeps({
      getSessionUser: vi.fn().mockResolvedValue(sessionUser),
      abilityDefinitions: [manageAllDefinition],
    });

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext();

    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.reply).not.toHaveBeenCalled();
    expect(ctx['sessionUser']).toEqual(sessionUser);
    expect(ctx['ability']).toBeDefined();
    const ability = ctx['ability'] as { can: (action: string, subject: string) => boolean };
    expect(ability.can('manage', 'all')).toBe(false);
  });

  it('denies with a controlled response when session resolution fails', async () => {
    const deps = createDeps({
      getSessionUser: vi.fn().mockRejectedValue(new Error('session unavailable')),
    });

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext();

    await expect(middleware(ctx as never, next)).resolves.toBeUndefined();

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.unauthorized');
    expect(deps.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'session_resolution_failed',
      }),
    );
  });

  it('blocks requests without from field with localized message', async () => {
    const deps = createDeps();

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext({ from: undefined });

    await middleware(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.unauthorized');
  });

  it('creates unresolved guest context when no session is found', async () => {
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
      status: 'UNRESOLVED',
    });
    expect(ctx['ability']).toBeDefined();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('denies with a controlled response when ability construction fails', async () => {
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

    expect(next).not.toHaveBeenCalled();
    expect(ctx['sessionUser']).toEqual(sessionUser);
    expect(deps.logger.warn).toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.unauthorized');
  });

  it('passes user id to getSessionUser', async () => {
    const deps = createDeps();

    const middleware = createAuthMiddleware(deps);
    const ctx = createMockContext({ from: { id: 999 } });

    await middleware(ctx as never, next);

    expect(deps.getSessionUser).toHaveBeenCalledWith(999);
  });
});

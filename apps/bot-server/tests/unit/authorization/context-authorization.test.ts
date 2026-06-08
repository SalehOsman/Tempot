import { describe, expect, it, vi } from 'vitest';
import { defineAbility } from '@casl/ability';
import { createModuleAuthorizationProvider } from '../../../src/authorization/context-authorization.js';

function createContext(overrides: Record<string, unknown> = {}) {
  return {
    sessionUser: { id: 'user-1', role: 'USER', status: 'ACTIVE' },
    ability: defineAbility((can) => can('read', 'profile')),
    reply: vi.fn().mockResolvedValue(undefined),
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createProvider(
  resolveContext?: Parameters<typeof createModuleAuthorizationProvider>[0]['resolveContext'],
) {
  const logger = { warn: vi.fn() };
  return {
    logger,
    provider: createModuleAuthorizationProvider({
      logger,
      t: vi.fn((key: string) => `translated:${key}`),
      resolveContext,
    }),
  };
}

describe('createModuleAuthorizationProvider', () => {
  it('continues when the production ability permits the action and subject', async () => {
    const { provider } = createProvider();
    const next = vi.fn().mockResolvedValue(undefined);
    const ctx = createContext();

    await provider.guard({
      module: 'user-management',
      classification: 'protected',
      action: 'read',
      subject: 'profile',
    })(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('denies before protected work and records structured evidence', async () => {
    const { logger, provider } = createProvider();
    const next = vi.fn().mockResolvedValue(undefined);
    const ctx = createContext();

    await provider.guard({
      module: 'user-management',
      classification: 'protected',
      action: 'manage',
      subject: 'users',
    })(ctx as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('translated:bot-server.unauthorized');
    expect(logger.warn).toHaveBeenCalledWith({
      module: 'user-management',
      msg: 'authorization_denied',
      actorId: 'user-1',
      role: 'USER',
      action: 'manage',
      subject: 'users',
      outcome: 'denied',
      reason: 'ability_forbidden',
    });
  });

  it('allows an unresolved guest only for an explicit public policy', async () => {
    const { provider } = createProvider();
    const publicNext = vi.fn().mockResolvedValue(undefined);
    const protectedNext = vi.fn().mockResolvedValue(undefined);
    const ctx = createContext({
      sessionUser: { id: 'guest-1', role: 'GUEST', status: 'UNRESOLVED' },
      ability: defineAbility((can) => can('read', 'template')),
    });

    await provider.guard({
      module: 'template-management',
      classification: 'public',
      action: 'read',
      subject: 'template',
    })(ctx as never, publicNext);
    await provider.guard({
      module: 'template-management',
      classification: 'protected',
      action: 'read',
      subject: 'template',
    })(ctx as never, protectedNext);

    expect(publicNext).toHaveBeenCalledOnce();
    expect(protectedNext).not.toHaveBeenCalled();
  });

  it('answers callback queries when a callback policy is denied', async () => {
    const { provider } = createProvider();
    const ctx = createContext({ callbackQuery: { data: 'users:list' } });

    const allowed = await provider.enforce(ctx as never, {
      module: 'user-management',
      classification: 'protected',
      action: 'manage',
      subject: 'users',
    });

    expect(allowed).toBe(false);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('translated:bot-server.unauthorized');
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('re-evaluates the current actor before a deferred mutation', async () => {
    const resolveContext = vi.fn().mockResolvedValue({
      actor: { id: 'user-1', role: 'USER', status: 'ACTIVE' },
      ability: defineAbility((can) => can('read', 'bot')),
    });
    const { provider } = createProvider(resolveContext);
    const ctx = createContext({
      sessionUser: { id: 'user-1', role: 'ADMIN', status: 'ACTIVE' },
      ability: defineAbility((can) => can('manage', 'bot')),
    });

    const allowed = await provider.refreshAndEnforce(ctx as never, {
      module: 'bot-management',
      classification: 'protected',
      action: 'manage',
      subject: 'bot',
    });

    expect(resolveContext).toHaveBeenCalledWith(ctx);
    expect(allowed).toBe(false);
  });
});

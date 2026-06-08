import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AbilityFactory, RoleEnum, type SessionUser } from '@tempot/auth-core';
import { createAuthMiddleware } from '../../src/bot/middleware/auth.middleware.js';
import { userManagementAbilities } from '../../../../modules/user-management/abilities.js';
import { templateManagementAbilities } from '../../../../modules/template-management/abilities.js';
import { botManagementAbilities } from '../../../../modules/bot-management/abilities.js';

const productionDefinitions = [
  userManagementAbilities,
  templateManagementAbilities,
  botManagementAbilities,
];

function createContext(userId: number) {
  return {
    from: { id: userId },
    chat: { id: userId },
    reply: vi.fn().mockResolvedValue(undefined),
  };
}

describe('production authorization role matrix', () => {
  beforeEach(() => {
    AbilityFactory.clearCache();
  });

  it.each([
    [RoleEnum.GUEST, 'read', 'template'],
    [RoleEnum.USER, 'read', 'profile'],
    [RoleEnum.ADMIN, 'manage', 'users'],
    [RoleEnum.SUPER_ADMIN, 'manage', 'all'],
  ] as const)(
    'attaches the production ability and continues for %s',
    async (role, allowedAction, allowedSubject) => {
      const sessionUser: SessionUser = { id: `actor-${role}`, role, status: 'ACTIVE' };
      const next = vi.fn().mockResolvedValue(undefined);
      const ctx = createContext(100);
      const middleware = createAuthMiddleware({
        getSessionUser: vi.fn().mockResolvedValue(sessionUser),
        abilityDefinitions: productionDefinitions,
        logger: { warn: vi.fn(), error: vi.fn() },
        t: vi.fn((key: string) => key),
      });

      await middleware(ctx as never, next);

      expect(next).toHaveBeenCalledOnce();
      expect((ctx as Record<string, unknown>)['sessionUser']).toEqual(sessionUser);
      const ability = (ctx as Record<string, unknown>)['ability'] as {
        can: (action: string, subject: string) => boolean;
      };
      expect(ability.can(allowedAction, allowedSubject)).toBe(true);
    },
  );

  it.each([
    [RoleEnum.GUEST, 'read', 'profile'],
    [RoleEnum.USER, 'manage', 'users'],
    [RoleEnum.ADMIN, 'manage', 'all'],
  ] as const)(
    'does not grant %s the denied %s %s permission',
    async (role, deniedAction, deniedSubject) => {
      const sessionUser: SessionUser = { id: `actor-${role}`, role, status: 'ACTIVE' };
      const ctx = createContext(100);
      const middleware = createAuthMiddleware({
        getSessionUser: vi.fn().mockResolvedValue(sessionUser),
        abilityDefinitions: productionDefinitions,
        logger: { warn: vi.fn(), error: vi.fn() },
        t: vi.fn((key: string) => key),
      });

      await middleware(ctx as never, vi.fn().mockResolvedValue(undefined));

      const ability = (ctx as Record<string, unknown>)['ability'] as {
        can: (action: string, subject: string) => boolean;
      };
      expect(ability.can(deniedAction, deniedSubject)).toBe(false);
    },
  );
});

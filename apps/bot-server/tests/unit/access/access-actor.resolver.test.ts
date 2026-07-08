import { describe, expect, it, vi } from 'vitest';
import { RoleEnum, type SessionUser } from '@tempot/auth-core';
import { resolveAccessActor } from '../../../src/access/access-actor.resolver.js';

describe('resolveAccessActor', () => {
  it('should resolve unknown actor when no session user exists', async () => {
    const result = await resolveAccessActor({
      telegramId: 111,
      getSessionUser: vi.fn().mockResolvedValue(null),
      getAbilityTokens: () => [],
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.state).toBe('UNKNOWN');
      expect(result.value.telegramId).toBe(111);
      expect(result.value.abilities).toEqual([]);
      expect(result.value.resolutionStatus).toBe('resolved');
    }
  });

  it('should resolve pending actor when session status is pending', async () => {
    const sessionUser = user({ status: 'PENDING' });
    const result = await resolveAccessActor({
      telegramId: 111,
      getSessionUser: vi.fn().mockResolvedValue(sessionUser),
      getAbilityTokens: () => ['profile.read'],
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.state).toBe('PENDING');
      expect(result.value.abilities).toEqual([]);
    }
  });

  it('should resolve member actor for active user role', async () => {
    const sessionUser = user({ role: RoleEnum.USER });
    const result = await resolveAccessActor({
      telegramId: 111,
      getSessionUser: vi.fn().mockResolvedValue(sessionUser),
      getAbilityTokens: () => ['profile.read'],
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.state).toBe('MEMBER');
      expect(result.value.profileId).toBe('profile-1');
      expect(result.value.abilities).toEqual(['profile.read']);
    }
  });

  it('should resolve admin actor for active admin role', async () => {
    const sessionUser = user({ role: RoleEnum.ADMIN });
    const result = await resolveAccessActor({
      telegramId: 111,
      getSessionUser: vi.fn().mockResolvedValue(sessionUser),
      getAbilityTokens: () => ['membership.review'],
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.state).toBe('ADMIN');
      expect(result.value.abilities).toEqual(['membership.review']);
    }
  });

  it('should resolve super admin actor for active super admin role', async () => {
    const sessionUser = user({ role: RoleEnum.SUPER_ADMIN });
    const result = await resolveAccessActor({
      telegramId: 111,
      getSessionUser: vi.fn().mockResolvedValue(sessionUser),
      getAbilityTokens: () => ['membership.review', 'access-mode.manage'],
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.state).toBe('SUPER_ADMIN');
      expect(result.value.abilities).toEqual(['membership.review', 'access-mode.manage']);
    }
  });

  it('should fail closed when session lookup throws', async () => {
    const result = await resolveAccessActor({
      telegramId: 111,
      getSessionUser: vi.fn().mockRejectedValue(new Error('lookup failed')),
      getAbilityTokens: () => [],
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.state).toBe('UNKNOWN');
      expect(result.value.resolutionStatus).toBe('failed');
      expect(result.value.abilities).toEqual([]);
    }
  });
});

function user(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: 'profile-1',
    role: RoleEnum.USER,
    status: 'ACTIVE',
    ...overrides,
  };
}

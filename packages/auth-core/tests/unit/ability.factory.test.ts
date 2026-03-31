import { describe, it, expect } from 'vitest';
import { AbilityFactory } from '../../src/factory/ability.factory.js';
import { SessionUser } from '../../src/contracts/session.types.js';
import { defineAbility } from '@casl/ability';
import { RoleEnum } from '../../src/contracts/auth.roles.js';

describe('AbilityFactory', () => {
  it('should return ok with built ability from provided definitions', () => {
    const user: SessionUser = { id: 1, role: RoleEnum.USER };
    const definition = (u: SessionUser) =>
      defineAbility((can) => {
        if (u.role === RoleEnum.USER) can('read', 'all');
      });

    const result = AbilityFactory.build(user, [definition]);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.can('read', 'all')).toBe(true);
      expect(result.value.can('manage', 'all')).toBe(false);
    }
  });

  it('should return ok with empty ability when no definitions provided', () => {
    const user: SessionUser = { id: 1, role: RoleEnum.GUEST };
    const result = AbilityFactory.build(user, []);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.can('read', 'all')).toBe(false);
    }
  });
});

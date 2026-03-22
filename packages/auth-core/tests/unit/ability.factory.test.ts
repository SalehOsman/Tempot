import { describe, it, expect } from 'vitest';
import { AbilityFactory } from '../../src/factory/ability.factory';
import { SessionUser } from '../../src/contracts/session-user';
import { defineAbility } from '@casl/ability';
import { RoleEnum } from '../../src/contracts/roles';

describe('AbilityFactory', () => {
  it('should build abilities from provided definitions', () => {
    const user: SessionUser = { id: 1, role: RoleEnum.USER };
    const definition = (u: SessionUser) =>
      defineAbility((can) => {
        if (u.role === RoleEnum.USER) can('read', 'all');
      });

    const ability = AbilityFactory.build(user, [definition]);
    expect(ability.can('read', 'all')).toBe(true);
    expect(ability.can('manage', 'all')).toBe(false);
  });
});

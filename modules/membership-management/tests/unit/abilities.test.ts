import { describe, expect, it } from 'vitest';
import { RoleEnum, type SessionUser } from '@tempot/auth-core';
import { membershipAbilityDefinition } from '../../abilities.js';

function user(role: RoleEnum): SessionUser {
  return { id: `${role.toLowerCase()}-1`, role, status: 'ACTIVE' };
}

describe('membership-management abilities', () => {
  it('should allow guests to create membership requests', () => {
    const ability = membershipAbilityDefinition(user(RoleEnum.GUEST));

    expect(ability.can('create', 'membership-request')).toBe(true);
    expect(ability.can('manage', 'membership-request')).toBe(false);
  });

  it('should allow administrators to manage membership requests', () => {
    const ability = membershipAbilityDefinition(user(RoleEnum.ADMIN));

    expect(ability.can('create', 'membership-request')).toBe(true);
    expect(ability.can('manage', 'membership-request')).toBe(true);
  });
});

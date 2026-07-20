import { describe, expect, it } from 'vitest';
import { RoleEnum } from '@tempot/auth-core';
import { userManagementAbilities } from '../abilities.js';

describe('userManagementAbilities', () => {
  it('allows admins to manage users without granting role-management authority', () => {
    const ability = userManagementAbilities({ id: 'admin', role: RoleEnum.ADMIN });

    expect(ability.can('manage', 'users')).toBe(true);
    expect(ability.can('manage', 'roles')).toBe(false);
  });

  it('allows super admins to manage roles through manage all', () => {
    const ability = userManagementAbilities({ id: 'super-admin', role: RoleEnum.SUPER_ADMIN });

    expect(ability.can('manage', 'roles')).toBe(true);
    expect(ability.can('manage', 'all')).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { settingsManagementAbilities } from '../abilities.js';

describe('settingsManagementAbilities', () => {
  it.each([
    ['GUEST', false],
    ['USER', true],
    ['ADMIN', true],
    ['SUPER_ADMIN', true],
  ] as const)('maps %s to settings read=%s', (role, expected) => {
    const ability = settingsManagementAbilities({ id: role, role });

    expect(ability.can('read', 'settings')).toBe(expected);
    expect(ability.can('manage', 'all')).toBe(role === 'SUPER_ADMIN');
  });
});

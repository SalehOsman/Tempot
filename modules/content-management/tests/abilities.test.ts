import { describe, expect, it } from 'vitest';
import { contentManagementAbilities } from '../abilities.js';

describe('contentManagementAbilities', () => {
  it.each([
    ['GUEST', false],
    ['USER', true],
    ['ADMIN', true],
    ['SUPER_ADMIN', true],
  ] as const)('maps %s to content read=%s', (role, expected) => {
    const ability = contentManagementAbilities({ id: role, role });

    expect(ability.can('read', 'content')).toBe(expected);
    expect(ability.can('manage', 'all')).toBe(role === 'SUPER_ADMIN');
  });
});

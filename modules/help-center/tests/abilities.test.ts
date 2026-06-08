import { describe, expect, it } from 'vitest';
import { helpCenterAbilities } from '../abilities.js';

describe('helpCenterAbilities', () => {
  it.each([
    ['GUEST', false],
    ['USER', true],
    ['ADMIN', true],
    ['SUPER_ADMIN', true],
  ] as const)('maps %s to help read=%s', (role, expected) => {
    const ability = helpCenterAbilities({ id: role, role });

    expect(ability.can('read', 'help')).toBe(expected);
    expect(ability.can('manage', 'all')).toBe(role === 'SUPER_ADMIN');
  });
});

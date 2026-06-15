import { describe, expect, it } from 'vitest';
import { auditViewerAbilities } from '../abilities.js';

describe('auditViewerAbilities', () => {
  it.each([
    ['GUEST', false],
    ['USER', false],
    ['ADMIN', true],
    ['SUPER_ADMIN', true],
  ] as const)('maps %s to audit read=%s', (role, expected) => {
    const ability = auditViewerAbilities({ id: role, role });

    expect(ability.can('read', 'audit')).toBe(expected);
    expect(ability.can('manage', 'all')).toBe(role === 'SUPER_ADMIN');
  });
});

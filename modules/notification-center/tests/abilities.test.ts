import { describe, expect, it } from 'vitest';
import { notificationCenterAbilities } from '../abilities.js';

describe('notificationCenterAbilities', () => {
  it.each([
    ['GUEST', false],
    ['USER', true],
    ['ADMIN', true],
    ['SUPER_ADMIN', true],
  ] as const)('maps %s to notification access=%s', (role, expected) => {
    const ability = notificationCenterAbilities({ id: role, role });

    expect(ability.can('read', 'notifications')).toBe(expected);
    expect(ability.can('update', 'notifications')).toBe(expected);
    expect(ability.can('create', 'notification-test')).toBe(expected);
    expect(ability.can('manage', 'all')).toBe(role === 'SUPER_ADMIN');
  });
});

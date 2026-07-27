import { describe, expect, it } from 'vitest';
import { backupManagementAbilities } from '../abilities.js';

describe('backupManagementAbilities', () => {
  it.each([
    ['GUEST', false],
    ['USER', false],
    ['ADMIN', false],
    ['SUPER_ADMIN', true],
  ] as const)('maps %s to backup management access=%s', (role, expected) => {
    const ability = backupManagementAbilities({ id: role, role });

    expect(ability.can('manage', 'backups')).toBe(expected);
    expect(ability.can('read', 'backup-history')).toBe(expected);
    expect(ability.can('create', 'restore-rehearsal')).toBe(expected);
    expect(ability.can('delete', 'backup-artifact')).toBe(expected);
  });
});

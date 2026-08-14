import { defineAbility } from '@casl/ability';

interface AbilityActor {
  id: string | number;
  role: string;
}

export function backupManagementAbilities(user: AbilityActor) {
  return defineAbility((can) => {
    if (user.role === 'SUPER_ADMIN') {
      can('manage', 'backups');
      can('read', 'backup-history');
      can('create', 'restore-rehearsal');
      can('delete', 'backup-artifact');
    }
  });
}

export const abilityDefinition = backupManagementAbilities;

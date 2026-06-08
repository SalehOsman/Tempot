import { defineAbility } from '@casl/ability';

interface AbilityActor {
  id: string | number;
  role: string;
}

export function contentManagementAbilities(user: AbilityActor) {
  return defineAbility((can) => {
    if (user.role === 'SUPER_ADMIN') {
      can('manage', 'all');
      return;
    }
    if (user.role === 'USER' || user.role === 'ADMIN') {
      can('read', 'content');
    }
  });
}

export const abilityDefinition = contentManagementAbilities;

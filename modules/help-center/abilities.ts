import { defineAbility } from '@casl/ability';

interface AbilityActor {
  id: string | number;
  role: string;
}

export function helpCenterAbilities(user: AbilityActor) {
  return defineAbility((can) => {
    if (user.role === 'SUPER_ADMIN') {
      can('manage', 'all');
      return;
    }
    if (user.role === 'USER' || user.role === 'ADMIN') {
      can('read', 'help');
    }
  });
}

export const abilityDefinition = helpCenterAbilities;

import { defineAbility } from '@casl/ability';

interface AbilityActor {
  id: string | number;
  role: string;
}

export function notificationCenterAbilities(user: AbilityActor) {
  return defineAbility((can) => {
    if (user.role === 'SUPER_ADMIN') {
      can('manage', 'all');
      return;
    }
    if (user.role === 'USER' || user.role === 'ADMIN') {
      can('read', 'notifications');
      can('update', 'notifications');
      can('create', 'notification-test');
    }
  });
}

export const abilityDefinition = notificationCenterAbilities;

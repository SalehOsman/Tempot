import { ModuleConfig } from '@tempot/module-registry';
import { defineAbility } from '@casl/ability';
import { RoleEnum } from '@tempot/auth-core';

export const userManagementConfig: ModuleConfig = {
  id: 'user-management',
  name: 'User Management',
  version: '1.0.0',
  description: 'User profile management and administration via Inline Keyboards',

  features: {
    hasInputEngine: true,
    hasSearch: false,
    hasAI: false,
  },

  commands: ['start', 'profile', 'users'],

  callbacks: ['profile:*', 'users:*', 'menu:*', 'settings:*'],

  permissions: {
    'users:manage': ['ADMIN', 'SUPER_ADMIN'],
    'users:view': ['ADMIN', 'SUPER_ADMIN'],
    'profile:edit': ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'],
    'profile:view': ['GUEST', 'USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'],
  },
};

export const userManagementAbilities = (user: { id: string; role: RoleEnum }) => {
  return defineAbility((can) => {
    if (user.role === RoleEnum.SUPER_ADMIN) {
      can('manage', 'all');
      return;
    }

    if (user.role === RoleEnum.ADMIN) {
      can('manage', 'users');
      can('read', 'all');
      return;
    }

    if (user.role === RoleEnum.MODERATOR) {
      can('read', 'users');
      can('update', 'users');
      can('read', 'own');
      can('update', 'own');
      return;
    }

    if (user.role === RoleEnum.USER) {
      can('read', 'own');
      can('update', 'own');
      return;
    }

    // GUEST
    can('read', 'own');
  });
};

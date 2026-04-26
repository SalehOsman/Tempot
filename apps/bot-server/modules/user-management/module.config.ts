import { ModuleConfig } from '@tempot/module-registry';
import { defineAbility } from '@casl/ability';
import { RoleEnum } from '@tempot/auth-core';

export const userManagementConfig: ModuleConfig = {
  name: 'User Management',
  version: '1.0.0',
  requiredRole: 'USER',

  features: {
    hasDatabase: true,
    hasNotifications: false,
    hasAttachments: false,
    hasExport: false,
    hasImport: false,
    hasAI: false,
    hasInputEngine: true,
    hasSearch: false,
    hasDynamicCMS: false,
    hasRegional: true,
  },

  commands: [
    { command: 'start', description: 'Show main menu' },
    { command: 'profile', description: 'View profile' },
    { command: 'users', description: 'Manage users' },
  ],

  isActive: true,
  isCore: false,
  requires: {
    packages: ['@tempot/database', '@tempot/auth-core'],
    optional: ['@tempot/input-engine', '@tempot/regional-engine'],
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

    if (user.role === RoleEnum.USER) {
      can('read', 'own');
      can('update', 'own');
      return;
    }

    // GUEST
    can('read', 'own');
  });
};

import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'membership-management',
  version: '0.1.0',
  requiredRole: 'GUEST',
  isActive: true,
  isCore: false,
  commands: [{ command: 'join', description: 'membership-management.commands.join' }],
  navigation: {
    mainMenu: [
      {
        id: 'membership-management',
        labelKey: 'membership-management.menu.button',
        callbackData: 'membership:list',
        requiredRole: 'ADMIN',
        accessClassification: 'admin',
        requiredAbility: 'manage.membership-request',
        row: 2,
        order: 10,
      },
    ],
  },
  features: {
    hasDatabase: true,
    hasNotifications: false,
    hasAttachments: false,
    hasExport: false,
    hasAI: false,
    hasInputEngine: false,
    hasImport: false,
    hasSearch: false,
    hasDynamicCMS: false,
    hasRegional: false,
  },
  requires: {
    packages: ['@tempot/shared'],
    optional: [],
  },
};

export default config;

import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'notification-center',
  version: '0.1.0',
  requiredRole: 'USER',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'notifications', description: 'notification-center.commands.notifications' },
  ],
  navigation: {
    mainMenu: [
      {
        id: 'notifications',
        labelKey: 'notification-center.menu.button',
        callbackData: 'notifications:view',
        requiredRole: 'USER',
        accessClassification: 'protected',
        requiredAbility: 'read.notifications',
        row: 1,
        order: 10,
      },
    ],
  },
  features: {
    hasDatabase: false,
    hasNotifications: true,
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
    packages: ['@tempot/notifier'],
    optional: ['@tempot/settings'],
  },
};

export default config;

import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'settings-management',
  version: '0.1.0',
  requiredRole: 'USER',
  isActive: true,
  isCore: false,
  commands: [{ command: 'settings', description: 'settings-management.commands.settings' }],
  navigation: {
    mainMenu: [
      {
        id: 'settings',
        labelKey: 'settings-management.menu.button',
        callbackData: 'settings:view',
        requiredRole: 'USER',
        row: 0,
        order: 20,
      },
    ],
  },
  features: {
    hasDatabase: false,
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
    packages: ['@tempot/settings'],
    optional: ['@tempot/ux-helpers'],
  },
};

export default config;

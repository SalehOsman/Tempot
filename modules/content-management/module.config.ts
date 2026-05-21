import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'content-management',
  version: '0.1.0',
  requiredRole: 'USER',
  isActive: true,
  isCore: false,
  commands: [{ command: 'messages', description: 'content-management.commands.messages' }],
  navigation: {
    mainMenu: [
      {
        id: 'messages',
        labelKey: 'content-management.menu.button',
        callbackData: 'messages:view',
        requiredRole: 'USER',
        row: 1,
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
    hasDynamicCMS: true,
    hasRegional: false,
  },
  requires: {
    packages: ['@tempot/cms-engine'],
    optional: ['@tempot/search-engine'],
  },
};

export default config;

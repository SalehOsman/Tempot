import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'audit-viewer',
  version: '0.1.0',
  requiredRole: 'ADMIN',
  isActive: true,
  isCore: false,
  commands: [{ command: 'stats', description: 'audit-viewer.commands.stats' }],
  navigation: {
    mainMenu: [
      {
        id: 'stats',
        labelKey: 'audit-viewer.menu.button',
        callbackData: 'stats:view',
        requiredRole: 'ADMIN',
        row: 2,
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
    packages: ['@tempot/logger'],
    optional: ['@tempot/search-engine'],
  },
};

export default config;

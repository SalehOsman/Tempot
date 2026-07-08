import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'help-center',
  version: '0.1.0',
  requiredRole: 'USER',
  isActive: true,
  isCore: false,
  commands: [{ command: 'help', description: 'help-center.commands.help' }],
  navigation: {
    mainMenu: [
      {
        id: 'help',
        labelKey: 'help-center.menu.button',
        callbackData: 'help:view',
        requiredRole: 'USER',
        accessClassification: 'protected',
        requiredAbility: 'read.help',
        row: 3,
        order: 10,
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
    packages: ['@tempot/i18n-core'],
    optional: ['@tempot/search-engine'],
  },
};

export default config;

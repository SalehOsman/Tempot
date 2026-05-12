import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'bot-management',
  version: '0.1.0',
  requiredRole: 'ADMIN',
  isActive: true,
  isCore: false,

  commands: [
    { command: 'bots', description: 'bot-management.commands.bots' },
    { command: 'new_bot', description: 'bot-management.commands.new_bot' },
  ],

  features: {
    hasDatabase: true,
    hasNotifications: true,
    hasAttachments: false,
    hasExport: true,
    hasImport: true,
    hasAI: false,
    hasInputEngine: true,
    hasSearch: true,
    hasDynamicCMS: false,
    hasRegional: false,
  },

  requires: {
    packages: [
      '@tempot/database',
      '@tempot/auth-core',
      '@tempot/event-bus',
      '@tempot/settings',
      '@tempot/module-registry',
      '@tempot/search-engine',
      '@tempot/notifier',
      '@tempot/import-engine',
      '@tempot/document-engine',
      '@tempot/storage-engine',
      '@tempot/input-engine',
    ],
    optional: ['@tempot/i18n-core', '@tempot/ux-helpers', '@tempot/logger'],
  },
};

export default config;

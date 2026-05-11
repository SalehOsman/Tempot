import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'template-management',
  version: '0.1.0',
  requiredRole: 'GUEST',
  isActive: true,
  isCore: false,

  commands: [
    { command: 'templates', description: 'template-management.commands.templates' },
    { command: 'new_template', description: 'template-management.commands.new_template' },
    { command: 'import_template', description: 'template-management.commands.import_template' },
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
    hasDynamicCMS: true,
    hasRegional: true,
  },

  requires: {
    packages: [
      '@tempot/database',
      '@tempot/auth-core',
      '@tempot/event-bus',
      '@tempot/search-engine',
      '@tempot/import-engine',
      '@tempot/document-engine',
      '@tempot/notifier',
      '@tempot/cms-engine',
    ],
    optional: ['@tempot/input-engine', '@tempot/regional-engine'],
  },
};

export default config;

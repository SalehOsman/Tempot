import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'knowledge-management',
  version: '0.1.0',
  requiredRole: 'SUPER_ADMIN',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'knowledge', description: 'knowledge-management.commands.knowledge' },
    {
      command: 'knowledge_custom',
      description: 'knowledge-management.commands.knowledge_custom',
    },
  ],
  navigation: {
    mainMenu: [
      {
        id: 'knowledge-management',
        labelKey: 'knowledge-management.menu.button',
        callbackData: 'knowledge:view',
        requiredRole: 'SUPER_ADMIN',
        accessClassification: 'admin',
        requiredAbility: 'manage.knowledge',
        row: 5,
        order: 50,
      },
    ],
  },
  features: {
    hasDatabase: true,
    hasNotifications: false,
    hasAttachments: false,
    hasExport: false,
    hasAI: true,
    hasInputEngine: false,
    hasImport: false,
    hasSearch: true,
    hasDynamicCMS: false,
    hasRegional: false,
  },
  aiDegradationMode: 'graceful',
  requires: {
    packages: ['@tempot/ai-core', '@tempot/ux-helpers'],
    optional: ['@tempot/event-bus'],
  },
};

export default config;

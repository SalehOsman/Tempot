import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'backup-management',
  version: '0.1.0',
  requiredRole: 'SUPER_ADMIN',
  isActive: true,
  isCore: false,
  commands: [{ command: 'backups', description: 'backup-management.commands.backups' }],
  navigation: {
    mainMenu: [
      {
        id: 'backup-management',
        labelKey: 'backup-management.menu.button',
        callbackData: 'backups:view',
        requiredRole: 'SUPER_ADMIN',
        accessClassification: 'admin',
        requiredAbility: 'manage.backups',
        row: 4,
        order: 40,
      },
    ],
  },
  features: {
    hasDatabase: true,
    hasNotifications: true,
    hasAttachments: true,
    hasExport: false,
    hasAI: false,
    hasInputEngine: false,
    hasImport: false,
    hasSearch: false,
    hasDynamicCMS: false,
    hasRegional: false,
  },
  requires: {
    packages: ['@tempot/backup-engine', '@tempot/storage-engine', '@tempot/notifier'],
    optional: ['@tempot/event-bus', '@tempot/settings'],
  },
};

export default config;

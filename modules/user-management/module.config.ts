import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'user-management',
  version: '1.0.0',
  requiredRole: 'USER',
  isActive: true,
  isCore: false,

  commands: [
    { command: 'start', description: 'user-management.commands.start' },
    { command: 'profile', description: 'user-management.commands.profile' },
    { command: 'users', description: 'user-management.commands.users' },
  ],

  features: {
    hasDatabase: true,
    hasNotifications: false,
    hasAttachments: false,
    hasExport: false,
    hasImport: false,
    hasAI: false,
    hasInputEngine: false,
    hasSearch: false,
    hasDynamicCMS: false,
    hasRegional: true,
  },

  requires: {
    packages: ['@tempot/database', '@tempot/auth-core'],
    optional: ['@tempot/input-engine', '@tempot/regional-engine'],
  },
};

export default config;

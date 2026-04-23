/**
 * Test Module — module.config.ts
 *
 * Temporary diagnostic module for verifying the full bot pipeline end-to-end.
 * Remove this module (and specs/022-test-module/) when the first real module is ready.
 *
 * Constitution compliance:
 *  - isCore: false   → validation failure skips module, does NOT crash the bot
 *  - isActive: true  → loaded on startup
 *  - requiredRole: GUEST → accessible to all users for diagnostic purposes
 */
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'test-module',
  version: '0.1.0',
  requiredRole: 'GUEST',
  isActive: true,
  isCore: false,

  commands: [
    { command: 'start', description: 'test-module.commands.start' },
    { command: 'ping', description: 'test-module.commands.ping' },
    { command: 'whoami', description: 'test-module.commands.whoami' },
    { command: 'dbtest', description: 'test-module.commands.dbtest' },
    { command: 'status', description: 'test-module.commands.status' },
    { command: 'settings', description: 'test-module.commands.settings' },
    { command: 'event', description: 'test-module.commands.event' },
    { command: 'session', description: 'test-module.commands.session' },
  ],

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
    packages: [],
    optional: [],
  },
};

export default config;

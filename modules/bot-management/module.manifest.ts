export const moduleManifest = {
  name: 'bot-management',
  type: 'product',
  blueprint: 'basic',
  status: 'active',
  capabilities: [
    'crud',
    'workflow',
    'searchable',
    'importable',
    'exportable',
    'notifiable',
    'admin-managed',
  ] as const,
  commands: ['bots', 'new_bot'] as const,
  events: {
    publishes: [
      'bot-management.bot.registered',
      'bot-management.bot.updated',
      'bot-management.lifecycle.changed',
      'bot-management.settings.changed',
      'bot-management.module-enablement.changed',
      'bot-management.provisioning.completed',
      'bot-management.health.changed',
      'bot-management.export.completed',
      'bot-management.import.completed',
    ] as const,
    consumes: [] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;

export const moduleManifest = {
  name: 'notification-center',
  type: 'operational',
  blueprint: 'basic',
  status: 'active',
  capabilities: ['notifications'] as const,
  commands: ['notifications'] as const,
  events: {
    publishes: ['notification-center.notification.test_requested'] as const,
    consumes: [] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;

export const moduleManifest = {
  name: 'settings-management',
  type: 'core-platform',
  blueprint: 'basic',
  status: 'active',
  capabilities: ['settings'] as const,
  commands: ['settings'] as const,
  events: {
    publishes: [] as const,
    consumes: [] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;

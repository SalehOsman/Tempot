export const moduleManifest = {
  name: 'help-center',
  type: 'core-platform',
  blueprint: 'basic',
  status: 'active',
  capabilities: ['help'] as const,
  commands: ['help'] as const,
  events: {
    publishes: [] as const,
    consumes: [] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;

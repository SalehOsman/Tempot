export const moduleManifest = {
  name: 'audit-viewer',
  type: 'operational',
  blueprint: 'basic',
  status: 'active',
  capabilities: ['stats'] as const,
  commands: ['stats'] as const,
  events: {
    publishes: [] as const,
    consumes: [] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;

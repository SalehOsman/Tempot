export const moduleManifest = {
  name: 'content-management',
  type: 'product',
  blueprint: 'basic',
  status: 'active',
  capabilities: ['messages', 'cms'] as const,
  commands: ['messages'] as const,
  events: {
    publishes: [] as const,
    consumes: [] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;

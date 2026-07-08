export const moduleManifest = {
  name: 'membership-management',
  type: 'core-platform',
  blueprint: 'basic',
  status: 'active',
  capabilities: ['membership-requests'] as const,
  commands: [] as const,
  events: {
    publishes: [
      'membership-management.request.submitted',
      'membership-management.request.approved',
      'membership-management.request.rejected',
    ] as const,
    consumes: [] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;

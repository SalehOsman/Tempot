export const moduleManifest = {
  name: 'user-management',
  type: 'core-platform',
  blueprint: 'basic',
  status: 'active',
  capabilities: ['profile-management', 'user-administration', 'rbac', 'regional-data'] as const,
  commands: ['start', 'profile', 'users'] as const,
  events: {
    publishes: ['user-management.user.started'] as const,
    consumes: [] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;

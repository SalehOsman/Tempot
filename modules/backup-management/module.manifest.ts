export const moduleManifest = {
  name: 'backup-management',
  type: 'operations',
  blueprint: 'admin-operations',
  status: 'active',
  capabilities: ['backup', 'restore-rehearsal', 'retention'] as const,
  commands: ['backups'] as const,
  events: {
    publishes: [
      'backup.job.requested',
      'restore.rehearsal.requested',
      'backup.retention.executed',
    ] as const,
    consumes: ['backup.job.succeeded', 'backup.job.failed', 'backup.job.warning'] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;

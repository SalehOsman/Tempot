export const moduleManifest = {
  name: 'template-management',
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
    'cms-enabled',
    'admin-managed',
  ] as const,
  commands: ['templates', 'new_template', 'import_template'] as const,
  events: {
    publishes: [
      'template-management.template.created',
      'template-management.status.changed',
      'template-management.version.published',
      'template-management.template.deleted',
      'template-management.template.cloned',
      'template-management.template.rated',
    ] as const,
    consumes: [] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;

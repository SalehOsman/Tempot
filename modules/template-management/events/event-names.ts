export const TEMPLATE_EVENTS = {
  CREATED: 'template-management.template.created',
  STATUS_CHANGED: 'template-management.status.changed',
  VERSION_PUBLISHED: 'template-management.version.published',
  DELETED: 'template-management.template.deleted',
  CLONED: 'template-management.template.cloned',
  RATED: 'template-management.template.rated',
} as const;

export type TemplateEventName = (typeof TEMPLATE_EVENTS)[keyof typeof TEMPLATE_EVENTS];

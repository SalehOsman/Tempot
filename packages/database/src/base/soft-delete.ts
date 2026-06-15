const ACTIVE_RECORD_SCOPE = Object.freeze({ isDeleted: false });
const SOFT_DELETABLE_MODELS = new Set([
  'UserProfile',
  'InteractionEvent',
  'Session',
  'Attachment',
  'Template',
  'Category',
  'ManagedBot',
]);

export function enforceActiveRecordScope(where?: Record<string, unknown>): Record<string, unknown> {
  return { ...(where ?? {}), ...ACTIVE_RECORD_SCOPE };
}

export function supportsSoftDelete(model: string): boolean {
  return SOFT_DELETABLE_MODELS.has(model);
}

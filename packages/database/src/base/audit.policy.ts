import {
  getProtectedDataCategory,
  omitSensitiveData,
  type ProtectedDataCategory,
} from '@tempot/shared';

export interface ProtectedAuditChange {
  fieldId: ProtectedDataCategory;
  protected: true;
  changeKind: 'added' | 'changed' | 'cleared';
}

export function buildSafeAuditSnapshot(value: unknown): Record<string, unknown> {
  const safe = omitSensitiveData(value);
  return safe !== null && typeof safe === 'object' && !Array.isArray(safe)
    ? (safe as Record<string, unknown>)
    : {};
}

export function buildProtectedAuditChanges(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): ProtectedAuditChange[] {
  const fields = new Set<ProtectedDataCategory>();
  for (const source of [before, after]) {
    if (!source) continue;
    for (const key of Object.keys(source)) {
      const category = getProtectedDataCategory(key);
      if (category) fields.add(category);
    }
  }

  return [...fields].map((fieldId) => ({
    fieldId,
    protected: true,
    changeKind: determineChangeKind(before, after, fieldId),
  }));
}

function determineChangeKind(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  fieldId: ProtectedDataCategory,
): ProtectedAuditChange['changeKind'] {
  const beforePresent = hasProtectedValue(before, fieldId);
  const afterPresent = hasProtectedValue(after, fieldId);
  if (!beforePresent && afterPresent) return 'added';
  if (beforePresent && !afterPresent) return 'cleared';
  return 'changed';
}

function hasProtectedValue(
  source: Record<string, unknown> | null,
  fieldId: ProtectedDataCategory,
): boolean {
  if (!source) return false;
  return Object.entries(source).some(
    ([key, value]) =>
      getProtectedDataCategory(key) === fieldId && value !== null && value !== undefined,
  );
}

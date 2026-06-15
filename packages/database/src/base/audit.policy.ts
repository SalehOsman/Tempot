import { isDeepStrictEqual } from 'node:util';
import { getProtectedDataCategory, type ProtectedDataCategory } from '@tempot/shared';

const AUDIT_SNAPSHOT_ALLOWED_FIELDS = new Set(['language', 'role']);
const PROTECTED_DATA_CATEGORIES = new Set<ProtectedDataCategory>([
  'email',
  'nationalId',
  'mobileNumber',
  'birthDate',
]);
const PROTECTED_CHANGE_KINDS = new Set<ProtectedAuditChange['changeKind']>([
  'added',
  'changed',
  'cleared',
]);

export interface ProtectedAuditChange {
  fieldId: ProtectedDataCategory;
  protected: true;
  changeKind: 'added' | 'changed' | 'cleared';
}

export function buildSafeAuditSnapshot(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return {};

  const source = value as Record<string, unknown>;
  const snapshot = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([key, fieldValue]) => AUDIT_SNAPSHOT_ALLOWED_FIELDS.has(key) && fieldValue !== undefined,
    ),
  );
  const changes = sanitizeProtectedAuditChanges(source['changes']);
  if (changes.length > 0) snapshot['changes'] = changes;
  return snapshot;
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

  return [...fields]
    .filter(
      (fieldId) =>
        !isDeepStrictEqual(
          protectedFieldState(before, fieldId),
          protectedFieldState(after, fieldId),
        ),
    )
    .map((fieldId) => ({
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

function protectedFieldState(
  source: Record<string, unknown> | null,
  fieldId: ProtectedDataCategory,
): Array<readonly [string, unknown]> {
  if (!source) return [];
  return Object.entries(source)
    .filter(([key]) => getProtectedDataCategory(key) === fieldId)
    .sort(([left], [right]) => left.localeCompare(right));
}

function sanitizeProtectedAuditChanges(value: unknown): ProtectedAuditChange[] {
  if (!Array.isArray(value)) return [];
  const changes: ProtectedAuditChange[] = [];
  for (const item of value) {
    const change = parseProtectedAuditChange(item);
    if (change) changes.push(change);
  }
  return changes;
}

function parseProtectedAuditChange(value: unknown): ProtectedAuditChange | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const change = value as Record<string, unknown>;
  if (
    typeof change['fieldId'] !== 'string' ||
    !PROTECTED_DATA_CATEGORIES.has(change['fieldId'] as ProtectedDataCategory) ||
    change['protected'] !== true ||
    typeof change['changeKind'] !== 'string' ||
    !PROTECTED_CHANGE_KINDS.has(change['changeKind'] as ProtectedAuditChange['changeKind'])
  ) {
    return null;
  }
  return {
    fieldId: change['fieldId'] as ProtectedDataCategory,
    protected: true,
    changeKind: change['changeKind'] as ProtectedAuditChange['changeKind'],
  };
}

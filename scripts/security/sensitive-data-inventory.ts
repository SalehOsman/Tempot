import {
  AUDIT_LOG_QUERY,
  LEGACY_USER_PROFILE_QUERY,
  TABLE_PRESENCE_QUERY,
  USER_PROFILE_QUERY,
} from './sensitive-data-inventory.queries.js';

export interface ReadonlyQueryClient {
  query: (sql: string) => Promise<readonly Record<string, unknown>[]>;
}

interface UserProfileInventory {
  totalRows: number;
  populated: {
    email: number;
    nationalId: number;
    mobileNumber: number;
    birthDate: number;
  };
  nulls: {
    email: number;
    nationalId: number;
    mobileNumber: number;
    birthDate: number;
  };
  duplicateGroups: {
    email: number;
    nationalId: number;
    mobileNumber: number;
  };
  normalizationConflicts: {
    email: number;
    nationalId: number;
    mobileNumber: number;
  };
}

interface LegacyUserProfileInventory {
  totalRows: number;
  emailPopulated: number;
  emailDuplicateGroups: number;
  emailNormalizationConflicts: number;
}

interface AuditLogInventory {
  totalRows: number;
  beforeProtectedKeyRecords: number;
  afterProtectedKeyRecords: number;
  protectedKeyRecords: number;
}

export interface SensitiveDataInventoryReport {
  generatedAt: string;
  mode: 'read-only';
  tables: {
    userProfile: boolean;
    legacyUserProfile: boolean;
    auditLog: boolean;
  };
  userProfile: UserProfileInventory | null;
  legacyUserProfile: LegacyUserProfileInventory | null;
  auditLog: AuditLogInventory | null;
  warnings: string[];
}

export async function collectSensitiveDataInventory(
  client: ReadonlyQueryClient,
  generatedAt: Date = new Date(),
): Promise<SensitiveDataInventoryReport> {
  const presence = firstRow(await client.query(TABLE_PRESENCE_QUERY));
  const tables = {
    userProfile: toBoolean(presence['userProfileTable']),
    legacyUserProfile: toBoolean(presence['legacyUserProfileTable']),
    auditLog: toBoolean(presence['auditLogTable']),
  };
  const warnings: string[] = [];

  if (!tables.userProfile && !tables.legacyUserProfile) {
    warnings.push('No supported user profile table was found.');
  } else if (tables.userProfile && tables.legacyUserProfile) {
    warnings.push(
      'Both UserProfile and user_management_profile tables exist; reconcile the legacy table before migration.',
    );
  }
  if (!tables.auditLog) {
    warnings.push('AuditLog table was not found.');
  }

  const userProfile = tables.userProfile
    ? mapUserProfile(firstRow(await client.query(USER_PROFILE_QUERY)))
    : null;
  const legacyUserProfile = tables.legacyUserProfile
    ? mapLegacyUserProfile(firstRow(await client.query(LEGACY_USER_PROFILE_QUERY)))
    : null;
  const auditLog = tables.auditLog
    ? mapAuditLog(firstRow(await client.query(AUDIT_LOG_QUERY)))
    : null;

  return {
    generatedAt: generatedAt.toISOString(),
    mode: 'read-only',
    tables,
    userProfile,
    legacyUserProfile,
    auditLog,
    warnings,
  };
}

function firstRow(rows: readonly Record<string, unknown>[]): Record<string, unknown> {
  return rows[0] ?? {};
}

function mapUserProfile(row: Record<string, unknown>): UserProfileInventory {
  return {
    totalRows: toCount(row['totalRows']),
    populated: {
      email: toCount(row['emailPopulated']),
      nationalId: toCount(row['nationalIdPopulated']),
      mobileNumber: toCount(row['mobileNumberPopulated']),
      birthDate: toCount(row['birthDatePopulated']),
    },
    nulls: {
      email: toCount(row['emailNulls']),
      nationalId: toCount(row['nationalIdNulls']),
      mobileNumber: toCount(row['mobileNumberNulls']),
      birthDate: toCount(row['birthDateNulls']),
    },
    duplicateGroups: {
      email: toCount(row['emailDuplicateGroups']),
      nationalId: toCount(row['nationalIdDuplicateGroups']),
      mobileNumber: toCount(row['mobileNumberDuplicateGroups']),
    },
    normalizationConflicts: {
      email: toCount(row['emailNormalizationConflicts']),
      nationalId: toCount(row['nationalIdNormalizationConflicts']),
      mobileNumber: toCount(row['mobileNumberNormalizationConflicts']),
    },
  };
}

function mapLegacyUserProfile(row: Record<string, unknown>): LegacyUserProfileInventory {
  return {
    totalRows: toCount(row['totalRows']),
    emailPopulated: toCount(row['emailPopulated']),
    emailDuplicateGroups: toCount(row['emailDuplicateGroups']),
    emailNormalizationConflicts: toCount(row['emailNormalizationConflicts']),
  };
}

function mapAuditLog(row: Record<string, unknown>): AuditLogInventory {
  return {
    totalRows: toCount(row['totalRows']),
    beforeProtectedKeyRecords: toCount(row['beforeProtectedKeyRecords']),
    afterProtectedKeyRecords: toCount(row['afterProtectedKeyRecords']),
    protectedKeyRecords: toCount(row['protectedKeyRecords']),
  };
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function toCount(value: unknown): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

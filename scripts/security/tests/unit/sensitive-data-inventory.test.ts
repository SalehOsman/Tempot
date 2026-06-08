import { describe, expect, it, vi } from 'vitest';

import {
  collectSensitiveDataInventory,
  type ReadonlyQueryClient,
} from '../../sensitive-data-inventory.js';

describe('collectSensitiveDataInventory', () => {
  it('reports counts without returning protected values', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes('to_regclass')) {
        return [
          {
            userProfileTable: true,
            legacyUserProfileTable: true,
            auditLogTable: true,
          },
        ];
      }
      if (sql.includes('FROM "UserProfile"')) {
        return [
          {
            totalRows: '8',
            emailPopulated: '6',
            nationalIdPopulated: '4',
            mobileNumberPopulated: '5',
            birthDatePopulated: '3',
            emailNulls: '2',
            nationalIdNulls: '4',
            mobileNumberNulls: '3',
            birthDateNulls: '5',
            emailDuplicateGroups: '1',
            nationalIdDuplicateGroups: '0',
            mobileNumberDuplicateGroups: '2',
            emailNormalizationConflicts: '2',
            nationalIdNormalizationConflicts: '1',
            mobileNumberNormalizationConflicts: '3',
          },
        ];
      }
      if (sql.includes('FROM "user_management_profile"')) {
        return [
          {
            totalRows: '2',
            emailPopulated: '1',
            emailDuplicateGroups: '0',
            emailNormalizationConflicts: '0',
          },
        ];
      }
      if (sql.includes('FROM "AuditLog"')) {
        return [
          {
            totalRows: '12',
            beforeProtectedKeyRecords: '3',
            afterProtectedKeyRecords: '4',
            protectedKeyRecords: '5',
          },
        ];
      }
      throw new Error(`Unexpected query: ${sql}`);
    });
    const client: ReadonlyQueryClient = { query };

    const report = await collectSensitiveDataInventory(
      client,
      new Date('2026-06-08T00:00:00.000Z'),
    );

    expect(report).toEqual({
      generatedAt: '2026-06-08T00:00:00.000Z',
      mode: 'read-only',
      tables: {
        userProfile: true,
        legacyUserProfile: true,
        auditLog: true,
      },
      userProfile: {
        totalRows: 8,
        populated: {
          email: 6,
          nationalId: 4,
          mobileNumber: 5,
          birthDate: 3,
        },
        nulls: {
          email: 2,
          nationalId: 4,
          mobileNumber: 3,
          birthDate: 5,
        },
        duplicateGroups: {
          email: 1,
          nationalId: 0,
          mobileNumber: 2,
        },
        normalizationConflicts: {
          email: 2,
          nationalId: 1,
          mobileNumber: 3,
        },
      },
      legacyUserProfile: {
        totalRows: 2,
        emailPopulated: 1,
        emailDuplicateGroups: 0,
        emailNormalizationConflicts: 0,
      },
      auditLog: {
        totalRows: 12,
        beforeProtectedKeyRecords: 3,
        afterProtectedKeyRecords: 4,
        protectedKeyRecords: 5,
      },
      warnings: [
        'Both UserProfile and user_management_profile tables exist; reconcile the legacy table before migration.',
      ],
    });

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain('person@example.com');
    expect(serialized).not.toContain('29801011234567');
    expect(serialized).not.toContain('+201001234567');
  });

  it('skips table-specific queries when target tables are absent', async () => {
    const query = vi.fn(async () => [
      {
        userProfileTable: false,
        legacyUserProfileTable: false,
        auditLogTable: false,
      },
    ]);
    const client: ReadonlyQueryClient = { query };

    const report = await collectSensitiveDataInventory(
      client,
      new Date('2026-06-08T00:00:00.000Z'),
    );

    expect(query).toHaveBeenCalledTimes(1);
    expect(report.userProfile).toBeNull();
    expect(report.legacyUserProfile).toBeNull();
    expect(report.auditLog).toBeNull();
    expect(report.warnings).toEqual([
      'No supported user profile table was found.',
      'AuditLog table was not found.',
    ]);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { NodeProtectedDataService, StaticProtectedDataKeyProvider } from '../../src/index.js';
import { formatNationalId } from '@tempot/national-id-parser';
import { runSensitiveDataRotation } from '../../../../scripts/security/sensitive-data-rotation.js';
import { countOldReferences } from '../../../../scripts/security/sensitive-data-rotation.row.js';

describe('sensitive data lookup rotation', () => {
  it('should return a typed error when loading the rotation checkpoint rejects', async () => {
    const protectionService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v1',
        encryptionKeys: { 'enc-v1': Buffer.alloc(32, 71) },
        activeLookupKeyVersion: 'lookup-v1',
        lookupKeys: { 'lookup-v1': Buffer.alloc(32, 72) },
      }),
    );
    const database = {
      userProfile: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      sensitiveDataMigrationCheckpoint: {
        findUnique: vi.fn().mockRejectedValue(new Error('db-down')),
        upsert: vi.fn(),
      },
    };

    const result = await runSensitiveDataRotation({
      migrationId: 'rotation-db-failure',
      fromEncryptionKeyVersion: 'enc-v0',
      batchSize: 10,
      database: database as never,
      protectionService,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('database.protection.rotation_database_failed');
    }
  });

  it('should return a typed error when a public rotation database helper rejects', async () => {
    const database = {
      userProfile: {
        findMany: vi.fn().mockRejectedValue(new Error('db-down')),
      },
    };

    const result = await countOldReferences(database as never, 'enc-v1', 'lookup-v1');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('database.protection.rotation_database_failed');
    }
  });

  it('should not overwrite a protected write committed after the rotation row was loaded', async () => {
    const recordId = 'concurrent-protected-write-user';
    const email = 'concurrent@example.com';
    const oldService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v1',
        encryptionKeys: { 'enc-v1': Buffer.alloc(32, 91) },
        activeLookupKeyVersion: 'lookup-v1',
        lookupKeys: { 'lookup-v1': Buffer.alloc(32, 92) },
      }),
    );
    const rotatingService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v2',
        encryptionKeys: {
          'enc-v1': Buffer.alloc(32, 91),
          'enc-v2': Buffer.alloc(32, 93),
        },
        activeLookupKeyVersion: 'lookup-v2',
        lookupKeys: {
          'lookup-v1': Buffer.alloc(32, 92),
          'lookup-v2': Buffer.alloc(32, 94),
        },
      }),
    );
    const loadedAt = new Date('2026-06-09T09:00:00.000Z');
    const concurrentlyUpdatedAt = new Date('2026-06-09T09:00:01.000Z');
    const loadedRow = {
      id: recordId,
      updatedAt: loadedAt,
      emailProtected: oldService.protect(email, { fieldId: 'email', recordId })._unsafeUnwrap(),
      emailLookupToken: oldService.createLookupToken(email, 'email')._unsafeUnwrap().token,
      emailLookupKeyVersion: 'lookup-v1',
      emailNormalizationVersion: 'email-v1',
      nationalIdProtected: null,
      nationalIdLookupToken: null,
      nationalIdLookupKeyVersion: null,
      nationalIdNormalizationVersion: null,
      mobileNumberProtected: null,
      birthDateProtected: null,
    };
    const concurrentPayload = rotatingService
      .protect('newer@example.com', { fieldId: 'email', recordId })
      ._unsafeUnwrap();
    const currentRow = {
      ...loadedRow,
      updatedAt: concurrentlyUpdatedAt,
      emailProtected: concurrentPayload,
    };
    let batchReads = 0;
    const findMany = vi.fn().mockImplementation((args?: { take?: number }) => {
      if (args?.take === undefined) return Promise.resolve([currentRow]);
      batchReads += 1;
      return Promise.resolve(batchReads === 1 ? [loadedRow] : []);
    });
    const updateMany = vi
      .fn()
      .mockImplementation((args: { where: { updatedAt: Date }; data: Record<string, unknown> }) => {
        if (args.where.updatedAt.getTime() !== currentRow.updatedAt.getTime()) {
          return Promise.resolve({ count: 0 });
        }
        Object.assign(currentRow, args.data);
        return Promise.resolve({ count: 1 });
      });
    const findUnique = vi.fn().mockResolvedValue(currentRow);
    const database = {
      userProfile: { findMany, findUnique, updateMany },
      sensitiveDataMigrationCheckpoint: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue(undefined),
      },
    };

    const result = await runSensitiveDataRotation({
      migrationId: 'concurrent-protected-write',
      fromEncryptionKeyVersion: 'enc-v1',
      batchSize: 10,
      database: database as never,
      protectionService: rotatingService,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('database.protection.rotation_concurrent_update');
      expect(JSON.stringify(result.error)).not.toContain(email);
    }
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: recordId, updatedAt: loadedAt },
      data: expect.any(Object),
    });
    expect(findUnique).not.toHaveBeenCalled();
    expect(currentRow.emailProtected).toEqual(concurrentPayload);
  });

  it('should clear orphaned lookup metadata before reporting retirement readiness', async () => {
    const staleRow = {
      id: 'orphaned-lookup-user',
      updatedAt: new Date('2026-06-09T08:00:00.000Z'),
      emailProtected: null,
      emailLookupToken: 'orphaned-token',
      emailLookupKeyVersion: 'lookup-v1',
      emailNormalizationVersion: 'email-v1',
      nationalIdProtected: null,
      nationalIdLookupToken: null,
      nationalIdLookupKeyVersion: null,
      nationalIdNormalizationVersion: null,
      mobileNumberProtected: null,
      birthDateProtected: null,
    };
    let currentRow = { ...staleRow };
    let batchReads = 0;
    const findMany = vi.fn().mockImplementation((args?: { take?: number }) => {
      if (args?.take !== undefined) {
        batchReads += 1;
        return Promise.resolve(batchReads === 1 ? [currentRow] : []);
      }
      return Promise.resolve([currentRow]);
    });
    const updateMany = vi.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
      currentRow = { ...currentRow, ...args.data };
      return Promise.resolve({ count: 1 });
    });
    const database = {
      userProfile: {
        findMany,
        findUnique: vi.fn().mockImplementation(() => Promise.resolve(currentRow)),
        updateMany,
      },
      sensitiveDataMigrationCheckpoint: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue(undefined),
      },
    };
    const protectionService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v2',
        encryptionKeys: { 'enc-v2': Buffer.alloc(32, 81) },
        activeLookupKeyVersion: 'lookup-v2',
        lookupKeys: { 'lookup-v2': Buffer.alloc(32, 82) },
      }),
    );

    const before = await countOldReferences(database as never, 'enc-v1', 'lookup-v2');
    const result = await runSensitiveDataRotation({
      migrationId: 'orphaned-lookup-cleanup',
      fromEncryptionKeyVersion: 'enc-v1',
      batchSize: 10,
      database: database as never,
      protectionService,
    });
    const after = await countOldReferences(database as never, 'enc-v1', 'lookup-v2');

    expect(before._unsafeUnwrap()).toBe(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: staleRow.id, updatedAt: staleRow.updatedAt },
      data: expect.objectContaining({
        emailLookupToken: null,
        emailLookupKeyVersion: null,
        emailNormalizationVersion: null,
      }),
    });
    expect(after._unsafeUnwrap()).toBe(0);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value.retirementReady).toBe(true);
  });

  it('should block retirement when an old lookup reference remains after rotation', async () => {
    const recordId = 'stale-lookup-user';
    const email = 'stale-lookup@example.com';
    const encryptionKey = Buffer.alloc(32, 51);
    const oldLookupKey = Buffer.alloc(32, 52);
    const newLookupKey = Buffer.alloc(32, 53);
    const oldService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v2',
        encryptionKeys: { 'enc-v2': encryptionKey },
        activeLookupKeyVersion: 'lookup-v1',
        lookupKeys: { 'lookup-v1': oldLookupKey },
      }),
    );
    const rotatingService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v2',
        encryptionKeys: { 'enc-v2': encryptionKey },
        activeLookupKeyVersion: 'lookup-v2',
        lookupKeys: {
          'lookup-v1': oldLookupKey,
          'lookup-v2': newLookupKey,
        },
        lookupKeyStates: { 'lookup-v1': 'retiring', 'lookup-v2': 'active' },
      }),
    );
    const payload = oldService.protect(email, { fieldId: 'email', recordId })._unsafeUnwrap();
    const oldLookup = oldService.createLookupToken(email, 'email')._unsafeUnwrap();
    const staleRow = {
      id: recordId,
      updatedAt: new Date('2026-06-09T08:30:00.000Z'),
      emailProtected: payload,
      emailLookupToken: oldLookup.token,
      emailLookupKeyVersion: oldLookup.tokenKeyVersion,
      nationalIdProtected: null,
      nationalIdLookupToken: null,
      nationalIdLookupKeyVersion: null,
      mobileNumberProtected: null,
      birthDateProtected: null,
    };
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([staleRow])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([staleRow]);
    const database = {
      userProfile: {
        findMany,
        findUnique: vi.fn().mockResolvedValue(staleRow),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      sensitiveDataMigrationCheckpoint: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue(undefined),
      },
    };

    const result = await runSensitiveDataRotation({
      migrationId: 'stale-lookup-retirement',
      fromEncryptionKeyVersion: 'enc-v1',
      batchSize: 10,
      database: database as never,
      protectionService: rotatingService,
    });

    expect(result.isErr()).toBe(true);
    expect(database.userProfile.updateMany).toHaveBeenCalledOnce();
  });

  it('should regenerate incomplete lookup metadata even when its key version is active', async () => {
    const recordId = 'incomplete-lookup-metadata-user';
    const email = 'incomplete@example.com';
    const protectionService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v2',
        encryptionKeys: { 'enc-v2': Buffer.alloc(32, 101) },
        activeLookupKeyVersion: 'lookup-v2',
        lookupKeys: { 'lookup-v2': Buffer.alloc(32, 102) },
      }),
    );
    let currentRow = {
      id: recordId,
      updatedAt: new Date('2026-06-09T10:00:00.000Z'),
      emailProtected: protectionService
        .protect(email, { fieldId: 'email', recordId })
        ._unsafeUnwrap(),
      emailLookupToken: null,
      emailLookupKeyVersion: 'lookup-v2',
      emailNormalizationVersion: null,
      nationalIdProtected: null,
      nationalIdLookupToken: null,
      nationalIdLookupKeyVersion: null,
      nationalIdNormalizationVersion: null,
      mobileNumberProtected: null,
      birthDateProtected: null,
    };
    let batchReads = 0;
    const database = {
      userProfile: {
        findMany: vi.fn().mockImplementation((args?: { take?: number }) => {
          if (args?.take !== undefined) {
            batchReads += 1;
            return Promise.resolve(batchReads === 1 ? [currentRow] : []);
          }
          return Promise.resolve([currentRow]);
        }),
        findUnique: vi.fn().mockImplementation(() => Promise.resolve(currentRow)),
        updateMany: vi.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
          currentRow = { ...currentRow, ...args.data };
          return Promise.resolve({ count: 1 });
        }),
      },
      sensitiveDataMigrationCheckpoint: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue(undefined),
      },
    };

    const result = await runSensitiveDataRotation({
      migrationId: 'incomplete-lookup-metadata',
      fromEncryptionKeyVersion: 'enc-v1',
      batchSize: 10,
      database: database as never,
      protectionService,
    });

    expect(result.isOk()).toBe(true);
    expect(currentRow.emailLookupToken).toBe(
      protectionService.createLookupToken(email, 'email')._unsafeUnwrap().token,
    );
    expect(currentRow.emailNormalizationVersion).toBe('email-v1');
  });

  it('should keep national ID lookup tokens canonical during rotation', async () => {
    const recordId = 'canonical-national-id-rotation-user';
    const nationalId = '28009010100332';
    const oldService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v1',
        encryptionKeys: { 'enc-v1': Buffer.alloc(32, 111) },
        activeLookupKeyVersion: 'lookup-v1',
        lookupKeys: { 'lookup-v1': Buffer.alloc(32, 112) },
      }),
    );
    const rotatingService = new NodeProtectedDataService(
      new StaticProtectedDataKeyProvider({
        activeEncryptionKeyVersion: 'enc-v2',
        encryptionKeys: {
          'enc-v1': Buffer.alloc(32, 111),
          'enc-v2': Buffer.alloc(32, 113),
        },
        activeLookupKeyVersion: 'lookup-v2',
        lookupKeys: {
          'lookup-v1': Buffer.alloc(32, 112),
          'lookup-v2': Buffer.alloc(32, 114),
        },
      }),
    );
    let currentRow = {
      id: recordId,
      updatedAt: new Date('2026-06-09T10:30:00.000Z'),
      emailProtected: null,
      emailLookupToken: null,
      emailLookupKeyVersion: null,
      emailNormalizationVersion: null,
      nationalIdProtected: oldService
        .protect(nationalId, { fieldId: 'nationalId', recordId })
        ._unsafeUnwrap(),
      nationalIdLookupToken: oldService
        .createLookupToken(formatNationalId(nationalId), 'nationalId')
        ._unsafeUnwrap().token,
      nationalIdLookupKeyVersion: 'lookup-v1',
      nationalIdNormalizationVersion: 'national-id-v1',
      mobileNumberProtected: null,
      birthDateProtected: null,
    };
    let batchReads = 0;
    const database = {
      userProfile: {
        findMany: vi.fn().mockImplementation((args?: { take?: number }) => {
          if (args?.take !== undefined) {
            batchReads += 1;
            return Promise.resolve(batchReads === 1 ? [currentRow] : []);
          }
          return Promise.resolve([currentRow]);
        }),
        findUnique: vi.fn().mockImplementation(() => Promise.resolve(currentRow)),
        updateMany: vi.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
          currentRow = { ...currentRow, ...args.data };
          return Promise.resolve({ count: 1 });
        }),
      },
      sensitiveDataMigrationCheckpoint: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue(undefined),
      },
    };

    const result = await runSensitiveDataRotation({
      migrationId: 'canonical-national-id-rotation',
      fromEncryptionKeyVersion: 'enc-v1',
      batchSize: 10,
      database: database as never,
      protectionService: rotatingService,
    });

    expect(result.isOk()).toBe(true);
    expect(currentRow.nationalIdLookupToken).toBe(
      rotatingService.createLookupToken(formatNationalId(nationalId), 'nationalId')._unsafeUnwrap()
        .token,
    );
  });
});

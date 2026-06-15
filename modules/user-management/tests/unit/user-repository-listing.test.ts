import { describe, expect, it, vi } from 'vitest';
import { ok, type Result } from 'neverthrow';
import type {
  ProtectedDataContext,
  ProtectedDataService,
  ProtectedLookupToken,
  ProtectedPayload,
} from '@tempot/database';
import type { AppError } from '@tempot/shared';
import { RoleEnum } from '@tempot/auth-core';
import { UserRepository } from '../../repositories/user.repository.js';

const safeSelect = {
  id: true,
  telegramId: true,
  username: true,
  language: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

function createProtectionService() {
  const recover =
    vi.fn<(payload: ProtectedPayload, context: ProtectedDataContext) => Result<string, AppError>>();
  const service: ProtectedDataService = {
    protect: vi.fn(),
    recover,
    createLookupToken: vi.fn(),
    createLookupTokens: vi.fn(() =>
      ok<readonly ProtectedLookupToken[]>([
        {
          fieldId: 'email',
          normalizationVersion: 'email-v1',
          tokenKeyVersion: 'lookup-v1',
          token: 'email-token',
        },
      ]),
    ),
    reprotect: vi.fn(),
  };
  return { service, recover };
}

function createDatabase() {
  const row = {
    id: 'listed-user',
    telegramId: 2001n,
    username: 'Listed',
    language: 'en',
    role: 'USER',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  return {
    row,
    findMany: vi.fn().mockResolvedValue([row]),
    count: vi.fn().mockResolvedValue(1),
  };
}

function repositoryWith(database: ReturnType<typeof createDatabase>) {
  const { service, recover } = createProtectionService();
  const repository = new UserRepository(
    { log: vi.fn().mockResolvedValue(undefined) },
    {
      userProfile: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: database.findMany,
        count: database.count,
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as never,
    service,
  );
  return { repository, recover };
}

describe('UserRepository routine listing', () => {
  it('should list only safe fields without bulk decryption', async () => {
    const database = createDatabase();
    const { repository, recover } = repositoryWith(database);

    const result = await repository.findMany();

    expect(result.isOk()).toBe(true);
    expect(database.findMany).toHaveBeenCalledWith({
      where: { isDeleted: false },
      select: safeSelect,
    });
    expect(recover).not.toHaveBeenCalled();
  });

  it('should apply indexed exact lookup, pagination, and database count before returning rows', async () => {
    const database = createDatabase();
    const { repository, recover } = repositoryWith(database);

    const result = await repository.search('Person@Example.Invalid', 2, 10);

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    const where = {
      isDeleted: false,
      OR: [
        { username: { contains: 'Person@Example.Invalid', mode: 'insensitive' } },
        { emailLookupToken: { in: ['email-token'] } },
      ],
    };
    expect(database.findMany).toHaveBeenCalledWith({
      where,
      select: safeSelect,
      skip: 20,
      take: 10,
    });
    expect(database.count).toHaveBeenCalledWith({ where });
    expect(result.value).toMatchObject({
      users: [database.row],
      totalCount: 1,
      page: 2,
      pageSize: 10,
    });
    expect(recover).not.toHaveBeenCalled();
  });

  it('should update non-protected fields without requiring decryption keys', async () => {
    const row = {
      id: 'role-update-user',
      telegramId: 2002n,
      username: 'RoleUser',
      language: 'en',
      role: RoleEnum.USER,
      emailProtected: {
        formatVersion: 1,
        algorithm: 'aes-256-gcm',
        keyVersion: 'enc-v1',
        nonce: 'nonce',
        ciphertext: 'ciphertext',
        authTag: 'auth-tag',
      },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const repository = new UserRepository({ log: vi.fn().mockResolvedValue(undefined) }, {
      userProfile: {
        create: vi.fn(),
        findUnique: vi.fn().mockResolvedValue(row),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn().mockResolvedValue({ ...row, role: RoleEnum.ADMIN }),
        delete: vi.fn(),
      },
    } as never);

    const result = await repository.updateRole(row.id, RoleEnum.ADMIN);

    expect(result.isOk()).toBe(true);
  });
});

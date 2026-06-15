import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '../../src/testing/database.helper.js';
import { PrismaClient } from '@prisma/client';

describe('Soft Delete Extension', () => {
  const testDb = new TestDB();
  // The extended prisma client from src/prisma/client (with soft-delete extensions).
  // Typed as PrismaClient since $extends() produces a structurally compatible supertype.
  let prisma: PrismaClient;
  let telegramIdSequence = 9_000_000_000_000n;

  function userProfileData(username: string) {
    telegramIdSequence += 1n;
    return { telegramId: telegramIdSequence, username };
  }

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();

    // Import prisma AFTER DATABASE_URL is set by testDb.start()
    const mod = await import('../../src/prisma/prisma.client.js');
    prisma = mod.prisma;
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('should set isDeleted to true instead of removing the record', async () => {
    const user = await prisma.userProfile.create({
      data: userProfileData('test-soft-delete'),
    });

    await prisma.userProfile.delete({ where: { id: user.id } });

    const dbUser = await testDb.prisma.userProfile.findUnique({ where: { id: user.id } });

    expect(dbUser).toBeDefined();
    expect(dbUser?.isDeleted).toBe(true);
    expect(dbUser?.deletedAt).toBeDefined();
  });

  it('should propagate deletedBy through the soft-delete extension', async () => {
    const user = await prisma.userProfile.create({
      data: userProfileData('test-deleted-by'),
    });

    await prisma.userProfile.delete({
      where: { id: user.id },
      data: { deletedBy: 'user-123' },
    } as Record<string, unknown>);

    const dbUser = await testDb.prisma.userProfile.findUnique({ where: { id: user.id } });

    expect(dbUser).toBeDefined();
    expect(dbUser?.isDeleted).toBe(true);
    expect(dbUser?.deletedBy).toBe('user-123');
  });

  it('should filter out deleted records in findMany', async () => {
    await prisma.userProfile.create({ data: userProfileData('active-user') });
    const deletedUser = await prisma.userProfile.create({ data: userProfileData('deleted-user') });
    await prisma.userProfile.delete({ where: { id: deletedUser.id } });

    const activeUsers = await prisma.userProfile.findMany();
    expect(activeUsers.some((u: { username: string | null }) => u.username === 'active-user')).toBe(
      true,
    );
    expect(
      activeUsers.some((u: { username: string | null }) => u.username === 'deleted-user'),
    ).toBe(false);
  });

  it('should ignore a conflicting isDeleted filter in findMany', async () => {
    const active = await prisma.userProfile.create({
      data: userProfileData('conflicting-find-many-active'),
    });
    const deleted = await prisma.userProfile.create({
      data: userProfileData('conflicting-find-many-deleted'),
    });
    await prisma.userProfile.delete({ where: { id: deleted.id } });

    const users = await prisma.userProfile.findMany({
      where: {
        id: { in: [active.id, deleted.id] },
        isDeleted: true,
      },
    });

    expect(users.map((user) => user.id)).toEqual([active.id]);
  });

  it('should ignore a conflicting isDeleted filter in findFirst', async () => {
    const active = await prisma.userProfile.create({
      data: userProfileData('conflicting-find-first-active'),
    });
    const deleted = await prisma.userProfile.create({
      data: userProfileData('conflicting-find-first-deleted'),
    });
    await prisma.userProfile.delete({ where: { id: deleted.id } });

    const user = await prisma.userProfile.findFirst({
      where: {
        id: { in: [active.id, deleted.id] },
        isDeleted: true,
      },
      orderBy: { id: 'asc' },
    });

    expect(user?.id).toBe(active.id);
  });

  it('should ignore a conflicting isDeleted filter in count', async () => {
    const firstActive = await prisma.userProfile.create({
      data: userProfileData('conflicting-count-active-1'),
    });
    const secondActive = await prisma.userProfile.create({
      data: userProfileData('conflicting-count-active-2'),
    });
    const deleted = await prisma.userProfile.create({
      data: userProfileData('conflicting-count-deleted'),
    });
    await prisma.userProfile.delete({ where: { id: deleted.id } });

    const count = await prisma.userProfile.count({
      where: {
        id: { in: [firstActive.id, secondActive.id, deleted.id] },
        isDeleted: true,
      },
    });

    expect(count).toBe(2);
  });

  it('should enforce the active-record scope alongside nested boolean filters', async () => {
    const active = await prisma.userProfile.create({
      data: userProfileData('nested-filter-active'),
    });
    const deleted = await prisma.userProfile.create({
      data: userProfileData('nested-filter-deleted'),
    });
    await prisma.userProfile.delete({ where: { id: deleted.id } });

    const users = await prisma.userProfile.findMany({
      where: {
        OR: [{ id: active.id }, { AND: [{ id: deleted.id }, { isDeleted: true }] }],
        isDeleted: true,
      },
    });

    expect(users.map((user) => user.id)).toEqual([active.id]);
  });

  it('should return null when finding a deleted record via findUnique', async () => {
    const user = await prisma.userProfile.create({ data: userProfileData('unique-soft-delete') });
    await prisma.userProfile.delete({ where: { id: user.id } });

    // This should return null if the extension is working correctly
    const found = await prisma.userProfile.findUnique({ where: { id: user.id } });
    expect(found).toBeNull();
  });

  it('should not inject deletion filters into models without soft delete', async () => {
    const auditLog = await testDb.prisma.auditLog.create({
      data: {
        action: 'database.audit.read',
        module: 'database',
      },
    });

    const records = await prisma.auditLog.findMany({ where: { id: auditLog.id } });
    const count = await prisma.auditLog.count({ where: { id: auditLog.id } });

    expect(records.map((record) => record.id)).toEqual([auditLog.id]);
    expect(count).toBe(1);
  });
});

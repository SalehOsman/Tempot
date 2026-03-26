import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '../utils/test-db';
import { PrismaClient } from '@prisma/client';

describe('Soft Delete Extension', () => {
  const testDb = new TestDB();
  // The extended prisma client from src/prisma/client (with soft-delete extensions).
  // Typed as PrismaClient since $extends() produces a structurally compatible supertype.
  let prisma: PrismaClient;

  beforeAll(async () => {
    await testDb.start();
    const { execSync } = await import('child_process');
    const path = await import('path');
    // We need to use prisma from the package under test
    execSync('pnpm prisma db push --accept-data-loss', {
      env: process.env,
      cwd: path.resolve(__dirname, '../../'),
    });

    // Import prisma AFTER DATABASE_URL is set by testDb.start()
    const mod = await import('../../src/prisma/client');
    prisma = mod.prisma;
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('should set isDeleted to true instead of removing the record', async () => {
    const user = await prisma.user.create({
      data: { name: 'Test Soft Delete' },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const dbUser = await testDb.prisma.user.findUnique({ where: { id: user.id } });

    expect(dbUser).toBeDefined();
    expect(dbUser?.isDeleted).toBe(true);
    expect(dbUser?.deletedAt).toBeDefined();
  });

  it('should propagate deletedBy through the soft-delete extension', async () => {
    const user = await prisma.user.create({
      data: { name: 'Test DeletedBy' },
    });

    await prisma.user.delete({
      where: { id: user.id },
      data: { deletedBy: 'user-123' },
    } as Record<string, unknown>);

    const dbUser = await testDb.prisma.user.findUnique({ where: { id: user.id } });

    expect(dbUser).toBeDefined();
    expect(dbUser?.isDeleted).toBe(true);
    expect(dbUser?.deletedBy).toBe('user-123');
  });

  it('should filter out deleted records in findMany', async () => {
    await prisma.user.create({ data: { name: 'Active User' } });
    const deletedUser = await prisma.user.create({ data: { name: 'Deleted User' } });
    await prisma.user.delete({ where: { id: deletedUser.id } });

    const activeUsers = await prisma.user.findMany();
    expect(activeUsers.some((u: { name: string }) => u.name === 'Active User')).toBe(true);
    expect(activeUsers.some((u: { name: string }) => u.name === 'Deleted User')).toBe(false);
  });

  it('should return null when finding a deleted record via findUnique', async () => {
    const user = await prisma.user.create({ data: { name: 'Unique Soft Delete' } });
    await prisma.user.delete({ where: { id: user.id } });

    // This should return null if the extension is working correctly
    const found = await prisma.user.findUnique({ where: { id: user.id } });
    expect(found).toBeNull();
  });
});

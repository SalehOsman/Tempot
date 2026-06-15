import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '@tempot/database';
import { TestDB } from '@tempot/database/testing';
import { AttachmentRepository } from '../../src/attachment.repository.js';

describe('AttachmentRepository privileged purge reads', () => {
  const testDb = new TestDB();
  const repository = new AttachmentRepository(
    { log: vi.fn().mockResolvedValue(undefined) },
    prisma,
  );

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('returns only expired deleted attachments outside the normal active-record scope', async () => {
    const deletedAt = new Date('2026-01-01T00:00:00.000Z');
    const active = await testDb.prisma.attachment.create({
      data: {
        fileName: 'active.txt',
        originalName: 'active.txt',
        mimeType: 'text/plain',
        size: 1,
        provider: 'local',
        providerKey: 'active-expired-query',
        deletedAt,
      },
    });
    const deleted = await testDb.prisma.attachment.create({
      data: {
        fileName: 'deleted.txt',
        originalName: 'deleted.txt',
        mimeType: 'text/plain',
        size: 1,
        provider: 'local',
        providerKey: 'deleted-expired-query',
        isDeleted: true,
        deletedAt,
      },
    });

    const result = await repository.findExpiredDeleted(new Date('2026-02-01T00:00:00.000Z'));

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().map((attachment) => attachment.id)).toEqual([deleted.id]);
    expect(result._unsafeUnwrap().some((attachment) => attachment.id === active.id)).toBe(false);
  });
});
